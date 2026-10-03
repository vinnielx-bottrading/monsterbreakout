/* Monster Breakout — trang quản trị (cancuhunterx.html, v7.2)
   Giao diện sáng: menu chức năng bên trái, nội dung bên phải.
   THEO DÕI: tổng quan · người chơi (tiến độ, thời gian qua cửa, đánh giá năng lực) · thống kê cửa ải.
   KINH DOANH: bật/tắt thu phí · thông tin nhận donate · bảng giá · đơn hàng · cấp quyền.
   Mọi quyền đọc/ghi do RLS + hàm security definer trên Supabase kiểm tra (chỉ tài khoản trong mb_admins). */
'use strict';
(function () {
  const URL_ = 'https://oapfplwvvspkvklldtpf.supabase.co';
  const KEY = 'sb_publishable_rsIgEmVNK_UkDY-XjoS8vw_cnx4Q5Hk';
  const sb = window.supabase.createClient(URL_, KEY, { auth: { flowType: 'pkce', detectSessionInUrl: true, persistSession: true, autoRefreshToken: true } });
  const $ = (id) => document.getElementById(id);
  const esc = (t) => String(t == null ? '' : t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const vnd = (v) => Number(v || 0).toLocaleString('vi-VN') + 'đ';
  const num = (v, d) => Number(v || 0).toLocaleString('vi-VN', { maximumFractionDigits: d == null ? 0 : d });
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const dur = (s) => { if (!s && s !== 0) return '—'; s = Math.round(s); const m = Math.floor(s / 60); return m >= 60 ? `${Math.floor(m / 60)}g ${m % 60}p` : `${m}:${String(s % 60).padStart(2, '0')}`; };
  const hours = (s) => (s / 3600 >= 1 ? num(s / 3600, 1) + ' giờ' : Math.round(s / 60) + ' phút');
  const dt = (d) => (d ? new Date(d).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—');
  const ago = (d) => {
    if (!d) return '—'; const s = (Date.now() - Date.parse(d)) / 1000;
    return s < 3600 ? Math.max(1, Math.round(s / 60)) + ' phút trước' : s < 86400 ? Math.round(s / 3600) + ' giờ trước' : Math.round(s / 86400) + ' ngày trước';
  };
  const median = (a) => { if (!a.length) return null; const b = [...a].sort((x, y) => x - y), m = b.length >> 1; return b.length % 2 ? b[m] : (b[m - 1] + b[m]) / 2; };
  const GATES = (window.MB.Gates.meta || []).filter((m) => m.file);
  const gname = (id) => { const m = GATES.find((g) => g.id === id); return m ? `${String(id).padStart(2, '0')} · ${m.name}` : `Gate ${id}`; };
  const RANKS = [[90, 'Huyền thoại', 'b-good'], [75, 'Bậc thầy', 'b-good'], [55, 'Tinh nhuệ', 'b-info'], [35, 'Chiến binh', 'b-warn'], [0, 'Tân binh', 'b-mute']];
  const rankOf = (sc) => RANKS.find((r) => sc >= r[0]);

  const S = { cfg: {}, players: [], plays: [], gs: {}, page: 'overview', sel: null, sort: { k: 'skill', d: -1 }, q: '', rf: '' };

  /* ================= khởi động ================= */
  async function start() {
    const { data } = await sb.auth.getSession();
    if (/[?&]code=/.test(location.search)) history.replaceState(null, '', location.pathname);
    const user = data.session && data.session.user;
    if (!user) {
      $('title').textContent = 'Đăng nhập';
      $('page').innerHTML = `<div class="card center"><h2>Trang quản trị</h2><p class="muted">Đăng nhập bằng tài khoản Google quản trị.</p><button id="login" class="primary">Đăng nhập Google</button></div>`;
      $('login').onclick = () => sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: location.origin + location.pathname, queryParams: { prompt: 'select_account' } } });
      return;
    }
    $('title').textContent = 'Đang kiểm tra…';
    const { data: isAdmin, error } = await sb.rpc('mb_is_admin');
    if (error || !isAdmin) {
      // không phải quản trị: không hiện menu, không lộ gì về trang quản trị — đưa về game
      $('title').textContent = '';
      $('page').innerHTML = `<div class="card center"><h2>Không tìm thấy trang</h2><p class="muted">Đang quay về game…</p><p><a href="./" class="primary btnlink">← Về game</a></p></div>`;
      setTimeout(() => location.replace('./'), 2500);
      return;
    }
    document.body.classList.remove('locked');
    $('who').innerHTML = `${esc(user.email)}<a href="#" id="out">Đăng xuất</a>`;
    $('out').onclick = async (e) => { e.preventDefault(); await sb.auth.signOut(); location.reload(); };
    initUI();
    $('reload').onclick = async () => { await loadAll(); render(); };
    $('title').textContent = 'Đang tải dữ liệu…';
    await loadAll();
    render();
  }
  function initUI() {
    document.querySelectorAll('#nav [data-p]').forEach((b) => b.addEventListener('click', () => { go(b.dataset.p); $('side').classList.remove('open'); }));
    $('menuBtn').onclick = () => $('side').classList.toggle('open');
    bindTip();
    const h = location.hash.slice(1); if (h) S.page = h;
  }
  function go(p) { S.page = p; S.sel = null; S.draft = null; history.replaceState(null, '', '#' + p); render(); window.scrollTo(0, 0); }

  /* ================= dữ liệu ================= */
  async function loadAll() {
    const [cfg, pl] = await Promise.all([sb.from('mb_config').select('key,value'), sb.rpc('mb_admin_players')]);
    S.cfg = {}; for (const r of cfg.data || []) S.cfg[r.key] = r.value;
    S.cfg.paywall = S.cfg.paywall || { enabled: false, loginFrom: 8, paidFrom: 11 };
    S.cfg.donate = S.cfg.donate || {}; S.cfg.plans = S.cfg.plans || {};
    S.players = pl.data || []; S.err = pl.error ? pl.error.message : '';
    S.cfg.starve = S.cfg.starve || { enabled: true, gates: [11] }; S.cfg.server = S.cfg.server || { goal: 0, label: 'Chi phí server tháng này', extra: 0 };
    const [sp, dn] = await Promise.all([sb.from('mb_supporters').select('*'), sb.from('mb_donations').select('*').order('created_at', { ascending: false }).limit(300)]);
    S.sup = {}; for (const r of sp.data || []) S.sup[r.user_id] = r;
    S.dons = dn.data || [];
    // nhật ký trận: tải theo trang 1.000 dòng (tối đa 20.000 trận gần nhất)
    S.plays = [];
    for (let from = 0; from < 20000; from += 1000) {
      const { data, error } = await sb.from('mb_plays').select('user_id,gate,mode,win,time_s,score,kills,accuracy,hits,stars,wave,boss_tier,created_at').order('created_at', { ascending: false }).range(from, from + 999);
      if (error) { S.err = error.message; break; }
      S.plays.push(...data); if (data.length < 1000) break;
    }
    compute();
    $('sub').textContent = `Cập nhật ${new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} · ${num(S.players.length)} người chơi · ${num(S.plays.length)} trận`;
  }

  function compute() {
    // thống kê từng cửa (chiến dịch)
    const gs = {};
    for (const g of GATES) gs[g.id] = { id: g.id, n: 0, w: 0, users: new Set(), times: [], acc: 0, hits: 0, min: 0, surv: 0, cleared: 0 };
    for (const p of S.plays) {
      const g = gs[p.gate]; if (!g) continue;
      if (p.mode === 'survival') { g.surv++; continue; }
      g.n++; g.users.add(p.user_id); g.acc += p.accuracy; g.hits += p.hits; g.min += p.time_s / 60;
      if (p.win) { g.w++; g.times.push(p.time_s); }
    }
    for (const id in gs) { const g = gs[id]; g.med = median(g.times); g.best = g.times.length ? Math.min(...g.times) : null; g.wr = g.n ? g.w / g.n : null; g.accAvg = g.n ? g.acc / g.n : null; g.hpm = g.min > 0 ? g.hits / g.min : null; }
    // số người đã qua từng cửa (theo bản lưu tiến trình)
    for (const u of S.players) { const sv = u.save || {}; for (const id in sv.gates || {}) if (sv.gates[id].cleared && gs[id]) gs[id].cleared++; }
    S.gs = gs;
    // từng người chơi
    const by = {};
    for (const p of S.plays) (by[p.user_id] = by[p.user_id] || []).push(p);
    for (const u of S.players) {
      const ps = by[u.user_id] || [], camp = ps.filter((p) => p.mode === 'campaign'), sv = u.save || {};
      u.ps = ps; u.nPlays = ps.length; u.wins = camp.filter((p) => p.win).length; u.nCamp = camp.length;
      u.time = ps.reduce((a, p) => a + p.time_s, 0);
      u.last = ps.length ? ps[0].created_at : null;
      const cl = Object.keys(sv.gates || {}).filter((k) => sv.gates[k].cleared).map(Number);
      u.cleared = cl.length; u.top = cl.length ? Math.max(...cl) : 0;
      u.stars = Object.values(sv.gates || {}).reduce((a, g) => a + ((g.done || []).length), 0);
      u.coins = sv.coins || 0;
      u.rate = rate(u, camp);
      u.skill = u.rate ? u.rate.total : -1;
      u.sup = S.sup && S.sup[u.user_id]; u.code = 'MBTT' + u.user_id.replace(/-/g, '').slice(0, 6).toUpperCase();
    }
  }

  // Đánh giá năng lực (0–100): thắng · tốc độ so với trung vị · chính xác · né đòn · tiến độ
  function rate(u, camp) {
    if (camp.length < 3) return null;
    const winRate = u.wins / camp.length;
    const ratios = camp.filter((p) => p.win && S.gs[p.gate] && S.gs[p.gate].med && p.time_s > 0).map((p) => clamp(S.gs[p.gate].med / p.time_s, 0.3, 2.5));
    const r = ratios.length ? ratios.reduce((a, b) => a + b, 0) / ratios.length : 0.8;
    const acc = camp.reduce((a, p) => a + p.accuracy, 0) / camp.length;
    const mins = camp.reduce((a, p) => a + p.time_s, 0) / 60, hpm = mins > 0 ? camp.reduce((a, p) => a + p.hits, 0) / mins : 0;
    const c = {
      win: winRate * 100,
      speed: clamp(50 + (r - 1) * 100, 0, 100),
      acc: clamp((acc - 30) / 50 * 100, 0, 100),
      dodge: clamp(100 - hpm * 12.5, 0, 100),
      prog: clamp(u.cleared / Math.max(1, GATES.length) * 100, 0, 100),
    };
    const total = Math.round(c.win * 0.25 + c.speed * 0.25 + c.acc * 0.2 + c.dodge * 0.15 + c.prog * 0.15);
    return { total, c, raw: { winRate, r, acc, hpm } };
  }
  const rankHtml = (u) => (u.rate ? `<span class="rank"><span class="sc">${u.rate.total}</span><span class="badge ${rankOf(u.rate.total)[2]}">${rankOf(u.rate.total)[1]}</span></span>` : '<span class="badge b-mute">Chưa đủ dữ liệu</span>');
  const whoHtml = (u) => `<div class="who">${/^https:\/\//.test(u.avatar || '') ? `<img src="${esc(u.avatar)}" alt="" referrerpolicy="no-referrer">` : `<span class="av">${esc((u.name || '?')[0].toUpperCase())}</span>`}<div><b>${esc(u.name)}${u.sup ? ' <span class="badge b-warn" title="Người tiếp tế">☕</span>' : ''}</b><span>${esc(u.email)}</span></div></div>`;

  /* ================= biểu đồ cột (SVG, 1 chuỗi, có tooltip) ================= */
  function bars(data, o) {
    o = o || {};
    const W = 640, H = o.h || 220, L = o.left || 36, B = 34, T = 14, R = 8, n = data.length;
    if (!n) return '<div class="empty">Chưa có dữ liệu</div>';
    let max = o.max || Math.max(1, ...data.map((d) => d.v || 0)) * 1.1;
    if (!o.max) { const st = max <= 8 ? Math.ceil(max / 4) : Math.ceil(max / 4 / (max > 80 ? 10 : 2)) * (max > 80 ? 10 : 2); max = st * 4; }
    const bw = (W - L - R) / n, gap = Math.min(8, bw * 0.3);
    const y = (v) => T + (H - T - B) * (1 - v / max);
    let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.label || '')}">`;
    for (let i = 0; i <= 4; i++) { const v = max * i / 4, yy = y(v); s += `<line class="grid" x1="${L}" x2="${W - R}" y1="${yy}" y2="${yy}"/><text x="${L - 6}" y="${yy + 4}" text-anchor="end">${o.yfmt ? o.yfmt(v) : Math.round(v)}</text>`; }
    data.forEach((d, i) => {
      const x = L + i * bw + gap / 2, w = bw - gap, v = d.v || 0, yy = y(v), h = Math.max(0, H - B - yy), r = Math.min(4, w / 2, h);
      const path = h > 0 ? `M${x},${H - B}V${yy + r}Q${x},${yy} ${x + r},${yy}H${x + w - r}Q${x + w},${yy} ${x + w},${yy + r}V${H - B}Z` : '';
      s += `<rect class="hit" x="${L + i * bw}" y="${T}" width="${bw}" height="${H - B - T}" data-tip="${esc(d.tip || d.l + ': ' + v)}"/>`;
      if (path) s += `<path class="bar" d="${path}" pointer-events="none"/>`;
      if (o.vals && v) s += `<text class="lbl" x="${x + w / 2}" y="${yy - 4}" text-anchor="middle">${o.vfmt ? o.vfmt(v) : v}</text>`;
      if (n <= 16 || i % Math.ceil(n / 14) === 0) s += `<text x="${x + w / 2}" y="${H - B + 16}" text-anchor="middle">${esc(d.l)}</text>`;
    });
    s += `<line class="axis" x1="${L}" x2="${W - R}" y1="${H - B}" y2="${H - B}"/></svg>`;
    return s;
  }
  function bindTip() {
    const tip = $('tip');
    document.addEventListener('mousemove', (e) => {
      const t = e.target.closest && e.target.closest('[data-tip]');
      if (!t) { tip.hidden = true; return; }
      tip.textContent = t.dataset.tip; tip.hidden = false;
      tip.style.left = Math.min(innerWidth - tip.offsetWidth - 8, e.clientX + 12) + 'px'; tip.style.top = (e.clientY - tip.offsetHeight - 10) + 'px';
    });
  }
  const days = (n) => { const out = []; for (let i = n - 1; i >= 0; i--) { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - i); out.push(d); } return out; };
  const sameDay = (a, d) => { const x = new Date(a); return x.getFullYear() === d.getFullYear() && x.getMonth() === d.getMonth() && x.getDate() === d.getDate(); };

  /* ================= các trang ================= */
  const PAGES = {
    overview: { t: 'Tổng quan', r: pOverview }, players: { t: 'Người chơi', r: pPlayers }, gates: { t: 'Thống kê cửa ải', r: pGates },
    content: { t: 'Mở cửa ải', r: pContent }, paywall: { t: 'Đăng nhập & thu phí', r: pPaywall }, donate: { t: 'Tài khoản nhận tiền', r: pDonate }, plans: { t: 'Bảng giá gói', r: pPlans }, orders: { t: 'Đơn hàng', r: pOrders }, grant: { t: 'Cấp quyền thủ công', r: pGrant }, support: { t: 'Người tiếp tế', r: pSupport },
  };
  function render() {
    if (!PAGES[S.page]) S.page = 'overview';
    document.querySelectorAll('#nav [data-p]').forEach((b) => b.classList.toggle('on', b.dataset.p === S.page));
    $('title').textContent = S.sel ? 'Hồ sơ người chơi' : PAGES[S.page].t;
    const warn = S.err ? `<div class="note" style="margin-bottom:14px">⚠ ${esc(S.err)} — kiểm tra đã chạy lại <code>supabase/schema.sql</code> (mục 6) chưa.</div>` : '';
    $('page').innerHTML = warn + (S.sel ? pPlayer(S.sel) : PAGES[S.page].r());
    if (PAGES[S.page].after && !S.sel) PAGES[S.page].after();
    bindPage();
  }

  function pOverview() {
    const P = S.players, now = Date.now(), D7 = 7 * 864e5;
    const new7 = P.filter((u) => now - Date.parse(u.created_at) < D7).length;
    const act = new Set(S.plays.filter((p) => now - Date.parse(p.created_at) < D7).map((p) => p.user_id)).size;
    const p7 = S.plays.filter((p) => now - Date.parse(p.created_at) < D7);
    const camp = S.plays.filter((p) => p.mode === 'campaign'), wr = camp.length ? camp.filter((p) => p.win).length / camp.length : 0;
    const tt = S.plays.reduce((a, p) => a + p.time_s, 0);
    const d14 = days(14);
    const playsDay = d14.map((d) => { const v = S.plays.filter((p) => sameDay(p.created_at, d)).length; return { l: `${d.getDate()}/${d.getMonth() + 1}`, v, tip: `${d.toLocaleDateString('vi-VN')}: ${v} trận` }; });
    const usersDay = d14.map((d) => { const v = P.filter((u) => sameDay(u.created_at, d)).length; return { l: `${d.getDate()}/${d.getMonth() + 1}`, v, tip: `${d.toLocaleDateString('vi-VN')}: ${v} người đăng ký mới` }; });
    const top = P.filter((u) => u.rate).sort((a, b) => b.skill - a.skill).slice(0, 8);
    const hard = Object.values(S.gs).filter((g) => g.n >= 3).sort((a, b) => a.wr - b.wr).slice(0, 5);
    return `<div class="kpis">
      <div class="kpi"><span>Người chơi đăng ký</span><b>${num(P.length)}</b><small>+${num(new7)} trong 7 ngày</small></div>
      <div class="kpi"><span>Hoạt động 7 ngày</span><b>${num(act)}</b><small>${P.length ? Math.round(act / P.length * 100) : 0}% tổng số</small></div>
      <div class="kpi"><span>Trận trong 7 ngày</span><b>${num(p7.length)}</b><small>${num(S.plays.length)} trận đã ghi</small></div>
      <div class="kpi"><span>Tỉ lệ thắng (chiến dịch)</span><b>${Math.round(wr * 100)}%</b><small>${num(camp.length)} lượt</small></div>
      <div class="kpi"><span>Tổng thời gian chơi</span><b>${hours(tt)}</b><small>TB ${S.plays.length ? dur(tt / S.plays.length) : '—'} / trận</small></div>
      <div class="kpi"><span>Thu phí</span><b style="font-size:20px;color:${S.cfg.paywall.enabled ? 'var(--good)' : 'var(--muted)'}">${S.cfg.paywall.enabled ? 'Đang bật' : 'Đang tắt'}</b><small>Thu từ Gate ${S.cfg.paywall.paidFrom || 11}</small></div>
    </div>
    <div class="grid2">
      <div class="card"><div class="card-head"><h2>Số trận mỗi ngày</h2><span class="muted">14 ngày gần nhất</span></div>${bars(playsDay, { label: 'Số trận mỗi ngày' })}</div>
      <div class="card"><div class="card-head"><h2>Người đăng ký mới</h2><span class="muted">14 ngày gần nhất</span></div>${bars(usersDay, { label: 'Người đăng ký mới mỗi ngày' })}</div>
    </div>
    <div class="grid2">
      <div class="card"><div class="card-head"><h2>Người chơi giỏi nhất</h2><a href="#players" data-go="players">Xem tất cả →</a></div>
        ${top.length ? `<table><tr><th>Người chơi</th><th class="num">Cửa qua</th><th>Năng lực</th></tr>${top.map((u) => `<tr class="click" data-u="${u.user_id}"><td>${whoHtml(u)}</td><td class="num">${u.cleared}</td><td>${rankHtml(u)}</td></tr>`).join('')}</table>` : '<div class="empty">Cần ít nhất 3 trận chiến dịch / người để đánh giá.</div>'}</div>
      <div class="card"><div class="card-head"><h2>Cửa ải khó nhất</h2><a href="#gates" data-go="gates">Thống kê cửa →</a></div>
        ${hard.length ? `<table><tr><th>Cửa</th><th class="num">Lượt</th><th class="num">Tỉ lệ thắng</th><th class="num">Thời gian qua (trung vị)</th></tr>${hard.map((g) => `<tr><td>${esc(gname(g.id))}</td><td class="num">${g.n}</td><td class="num">${Math.round(g.wr * 100)}%</td><td class="num">${dur(g.med)}</td></tr>`).join('')}</table>` : '<div class="empty">Chưa đủ dữ liệu.</div>'}</div>
    </div>`;
  }

  // tách mã tiếp tế từ nội dung chuyển khoản: "MBTT ab12 cd …" → "MBTTAB12CD"
  function codeIn(t) { const m = String(t || '').toUpperCase().replace(/[^0-9A-Z]/g, '').match(/MBTT([0-9A-F]{6})/); return m ? 'MBTT' + m[1] : null; }
  function pPlayers() {
    const q = S.q.toLowerCase().trim(), code = codeIn(S.q);
    // tìm theo mã tiếp tế (dán cả nội dung chuyển khoản cũng được) / tên / email / mã gõ dở
    let list = S.players.filter((u) => !q || (code ? u.code === code : (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q) || u.code.toLowerCase().includes(q.replace(/\s+/g, ''))));
    if (S.rf) list = list.filter((u) => (S.rf === 'none' ? !u.rate : u.rate && rankOf(u.rate.total)[1] === S.rf));
    const k = S.sort.k, d = S.sort.d;
    const val = (u) => (k === 'name' ? (u.name || '').toLowerCase() : k === 'created' ? Date.parse(u.created_at) : k === 'last' ? Date.parse(u.last || u.last_sign_in_at || 0) : u[k] || 0);
    list.sort((a, b) => (val(a) > val(b) ? d : val(a) < val(b) ? -d : 0));
    const th = (key, label, cls) => `<th class="sortable ${cls || ''}" data-sort="${key}">${label}${k === key ? `<span class="ar"> ${d > 0 ? '↑' : '↓'}</span>` : ''}</th>`;
    return `<div class="card">
      <div class="toolbar"><input id="q" placeholder="Tìm tên, email hoặc mã MBTT… (dán cả nội dung chuyển khoản)" value="${esc(S.q)}" style="max-width:420px">
        <select id="rf"><option value="">Mọi hạng</option>${RANKS.map((r) => `<option ${S.rf === r[1] ? 'selected' : ''}>${r[1]}</option>`).join('')}<option value="none" ${S.rf === 'none' ? 'selected' : ''}>Chưa đủ dữ liệu</option></select>
        <span class="muted">${num(list.length)} người</span><span style="flex:1"></span><button id="csv" class="sm">Tải CSV</button></div>
      <div class="tablewrap"><table><thead><tr>${th('name', 'Người chơi')}${th('created', 'Đăng ký')}${th('last', 'Chơi gần nhất')}${th('top', 'Cửa cao nhất', 'num')}${th('cleared', 'Cửa đã qua', 'num')}${th('nPlays', 'Số trận', 'num')}${th('time', 'Thời gian chơi', 'num')}${th('skill', 'Năng lực')}</tr></thead><tbody>
      ${list.map((u) => `<tr class="click" data-u="${u.user_id}"><td>${whoHtml(u)}</td><td>${new Date(u.created_at).toLocaleDateString('vi-VN')}</td><td>${ago(u.last || u.last_sign_in_at)}</td>
        <td class="num">${u.top ? 'Gate ' + u.top : '—'}</td><td class="num">${u.cleared}</td><td class="num">${num(u.nPlays)}</td><td class="num">${u.time ? hours(u.time) : '—'}</td><td>${rankHtml(u)}</td></tr>`).join('') || '<tr><td colspan="8" class="empty">Không có người chơi phù hợp</td></tr>'}
      </tbody></table></div></div>
      <p class="muted">Năng lực (0–100) = 25% tỉ lệ thắng + 25% tốc độ qua cửa so với trung vị mọi người + 20% độ chính xác + 15% né đòn (ít trúng đòn mỗi phút) + 15% tiến độ. Cần ít nhất 3 trận chiến dịch.</p>`;
  }

  function pPlayer(uid) {
    const u = S.players.find((x) => x.user_id === uid); if (!u) return '<div class="empty">Không tìm thấy</div>';
    const sv = u.save || {}, R = u.rate;
    const rows = GATES.map((g) => {
      const ps = u.ps.filter((p) => p.gate === g.id && p.mode === 'campaign'), wins = ps.filter((p) => p.win), sg = (sv.gates || {})[g.id] || {};
      if (!ps.length && !sg.cleared) return '';
      const times = wins.map((p) => p.time_s), best = times.length ? Math.min(...times) : sg.bestTime || null, avg = times.length ? times.reduce((a, b) => a + b, 0) / times.length : null;
      const med = S.gs[g.id] && S.gs[g.id].med, diff = best && med ? (med - best) / med : null;
      const acc = ps.length ? ps.reduce((a, p) => a + p.accuracy, 0) / ps.length : null;
      return `<tr><td>${esc(gname(g.id))}</td><td>${sg.cleared ? '<span class="badge b-good">Đã qua</span>' : '<span class="badge b-warn">Chưa qua</span>'}</td><td class="num">${ps.length || '—'}</td><td class="num">${ps.length ? wins.length : '—'}</td>
        <td class="num">${dur(best)}</td><td class="num">${dur(avg)}</td>
        <td>${diff == null ? '—' : Math.abs(diff) < 0.03 ? '<span class="badge b-mute">ngang trung vị</span>' : diff >= 0 ? `<span class="badge b-good">nhanh hơn ${Math.round(diff * 100)}%</span>` : `<span class="badge b-warn">chậm hơn ${Math.round(-diff * 100)}%</span>`}</td>
        <td class="num">${acc == null ? '—' : Math.round(acc) + '%'}</td><td class="num">${'★'.repeat((sg.done || []).length)}${'☆'.repeat(3 - (sg.done || []).length)}</td></tr>`;
    }).join('');
    const C = R ? R.c : null;
    const it = (l, v, sub) => `<div class="it"><span>${l}<br><small class="muted">${sub}</small></span><div class="meter"><i style="width:${Math.round(v)}%"></i></div><b>${Math.round(v)}</b></div>`;
    return `<div class="back"><button class="sm" id="backList">← Danh sách người chơi</button></div>
    <div class="card"><div class="card-head">${whoHtml(u)}<span style="flex:1"></span>${rankHtml(u)}</div>
      <div class="row muted"><div>Đăng ký: <b style="color:var(--ink)">${dt(u.created_at)}</b></div><div>Đăng nhập gần nhất: <b style="color:var(--ink)">${dt(u.last_sign_in_at)}</b></div><div>Đồng bộ tiến trình: <b style="color:var(--ink)">${dt(u.save_at)}</b></div></div>
      <p class="muted" style="margin:10px 0 0">Mã tiếp tế: <code>${u.code}</code> · ${u.sup ? `<span class="badge b-warn">☕ Người tiếp tế</span> đã ủng hộ ${vnd(u.sup.total)} (${u.sup.times} lần, gần nhất ${dt(u.sup.last_at)})` : 'Chưa tiếp tế'}</p></div>
    <div class="card supcard"><h2>☕ Xác nhận người này đã tiếp tế</h2>
      <p class="muted">Khi nhận được chuyển khoản có mã <code>${u.code}</code>. Lần mở game kế tiếp, người chơi sẽ thấy <b>ngôi sao cảm ơn sáng rực</b> kèm số tiền và lời nhắn bên dưới, nhận huy hiệu ☕ trên bảng xếp hạng, và hết gặp "cửa ác mộng".</p>
      <div class="row"><div><label>Số tiền đã nhận (đ)</label><input id="pAmt" type="number" value="20000" min="1000" step="1000"></div>
        <div style="grid-column: span 2"><label>Tiền được dùng cho (hiện cho người chơi)</label><input id="pNote" placeholder="Duy trì server tháng ${new Date().getMonth() + 1} và làm màn chơi mới"></div></div>
      <p style="margin-top:14px"><button id="pSup" class="primary">✓ Xác nhận đã tiếp tế</button></p><div id="pMsg" class="msg"></div></div>
    <div class="kpis">
      <div class="kpi"><span>Số trận</span><b>${num(u.nPlays)}</b><small>${u.nCamp} chiến dịch · ${u.nPlays - u.nCamp} sinh tồn</small></div>
      <div class="kpi"><span>Tỉ lệ thắng</span><b>${u.nCamp ? Math.round(u.wins / u.nCamp * 100) + '%' : '—'}</b><small>${u.wins}/${u.nCamp} lượt chiến dịch</small></div>
      <div class="kpi"><span>Thời gian chơi</span><b>${u.time ? hours(u.time) : '—'}</b><small>chơi gần nhất ${ago(u.last)}</small></div>
      <div class="kpi"><span>Cửa đã qua</span><b>${u.cleared}</b><small>cao nhất ${u.top ? 'Gate ' + u.top : '—'} · ${u.stars}★</small></div>
      <div class="kpi"><span>Xu · súng</span><b>${num(u.coins)}</b><small>${(sv.armory || []).length} khẩu súng</small></div>
    </div>
    <div class="grid2">
      <div class="card"><h2>Đánh giá năng lực</h2>${R ? `<p class="muted">Điểm tổng <b style="color:var(--ink)">${R.total}/100</b> — hạng <b style="color:var(--ink)">${rankOf(R.total)[1]}</b></p>
        <div class="breakdown">
          ${it('Thắng (25%)', C.win, `${Math.round(R.raw.winRate * 100)}% lượt thắng`)}
          ${it('Tốc độ (25%)', C.speed, `nhanh gấp ${num(R.raw.r, 2)}× trung vị`)}
          ${it('Chính xác (20%)', C.acc, `${Math.round(R.raw.acc)}% đạn trúng`)}
          ${it('Né đòn (15%)', C.dodge, `${num(R.raw.hpm, 1)} lần trúng đòn / phút`)}
          ${it('Tiến độ (15%)', C.prog, `${u.cleared}/${GATES.length} cửa`)}
        </div>` : '<div class="empty">Cần ít nhất 3 trận chiến dịch để đánh giá.</div>'}</div>
      <div class="card"><h2>Thời gian các trận gần đây</h2>${bars(u.ps.slice(0, 20).reverse().map((p) => ({ l: String(p.gate), v: Math.round(p.time_s / 6) / 10, tip: `${gname(p.gate)} · ${p.mode === 'survival' ? 'Sinh tồn wave ' + p.wave : p.win ? 'Thắng' : 'Thua'} · ${dur(p.time_s)} · ${dt(p.created_at)}` })), { label: 'Thời gian 20 trận gần nhất (phút)', yfmt: (v) => num(v, 1) + 'p' })}<p class="muted">Cột = số phút mỗi trận, nhãn dưới = số cửa. Rê chuột để xem chi tiết.</p></div>
    </div>
    <div class="card"><h2>Tiến độ từng cửa</h2><p class="muted">So sánh thời gian qua cửa nhanh nhất với trung vị của mọi người chơi.</p>
      <div class="tablewrap"><table><tr><th>Cửa</th><th>Trạng thái</th><th class="num">Lượt</th><th class="num">Thắng</th><th class="num">Nhanh nhất</th><th class="num">Trung bình</th><th>So với mọi người</th><th class="num">Chính xác</th><th class="num">Thử thách</th></tr>${rows || '<tr><td colspan="9" class="empty">Chưa có dữ liệu</td></tr>'}</table></div></div>
    <div class="card"><h2>Trận gần đây</h2><div class="tablewrap"><table><tr><th>Thời điểm</th><th>Cửa</th><th>Chế độ</th><th>Kết quả</th><th class="num">Thời gian</th><th class="num">Điểm</th><th class="num">Hạ gục</th><th class="num">Chính xác</th><th class="num">Trúng đòn</th></tr>
      ${u.ps.slice(0, 40).map((p) => `<tr><td>${dt(p.created_at)}</td><td>${esc(gname(p.gate))}</td><td>${p.mode === 'survival' ? 'Sinh tồn' : 'Chiến dịch'}</td><td>${p.mode === 'survival' ? 'Wave ' + p.wave : p.win ? '<span class="badge b-good">Thắng</span>' : '<span class="badge b-bad">Thua</span>'}</td>
        <td class="num">${dur(p.time_s)}</td><td class="num">${num(p.score)}</td><td class="num">${num(p.kills)}</td><td class="num">${p.accuracy}%</td><td class="num">${p.hits}</td></tr>`).join('') || '<tr><td colspan="9" class="empty">Chưa có trận nào được ghi (nhật ký bắt đầu từ v7.2)</td></tr>'}</table></div></div>`;
  }

  function pGates() {
    const G = GATES.map((g) => S.gs[g.id]);
    const total = S.players.length || 1;
    return `<div class="grid2">
      <div class="card"><div class="card-head"><h2>Tỉ lệ thắng theo cửa</h2><span class="muted">chiến dịch</span></div>${bars(G.map((g) => ({ l: String(g.id), v: g.wr == null ? 0 : Math.round(g.wr * 100), tip: `${gname(g.id)}: ${g.wr == null ? 'chưa có lượt' : Math.round(g.wr * 100) + '% (' + g.w + '/' + g.n + ')'}` })), { max: 100, label: 'Tỉ lệ thắng theo cửa', yfmt: (v) => Math.round(v) + '%' })}</div>
      <div class="card"><div class="card-head"><h2>Phễu tiến độ</h2><span class="muted">số người đã qua mỗi cửa</span></div>${bars(G.map((g) => ({ l: String(g.id), v: g.cleared, tip: `${gname(g.id)}: ${g.cleared} người đã qua (${Math.round(g.cleared / total * 100)}%)` })), { label: 'Số người đã qua mỗi cửa' })}</div>
    </div>
    <div class="card"><h2>Chi tiết từng cửa</h2><p class="muted">Dùng để cân bằng độ khó: tỉ lệ thắng thấp + thời gian dài = cửa đang quá khó.</p>
      <div class="tablewrap"><table><tr><th>Cửa</th><th class="num">Người đã qua</th><th class="num">Người đã chơi</th><th class="num">Lượt chơi</th><th class="num">Tỉ lệ thắng</th><th class="num">Qua nhanh nhất</th><th class="num">Thời gian qua (trung vị)</th><th class="num">Chính xác TB</th><th class="num">Trúng đòn / phút</th><th class="num">Lượt sinh tồn</th></tr>
      ${G.map((g) => `<tr><td>${esc(gname(g.id))}</td><td class="num">${g.cleared}</td><td class="num">${g.users.size}</td><td class="num">${g.n}</td>
        <td class="num">${g.wr == null ? '—' : `<span class="badge ${g.wr < 0.35 ? 'b-bad' : g.wr < 0.6 ? 'b-warn' : 'b-good'}">${Math.round(g.wr * 100)}%</span>`}</td>
        <td class="num">${dur(g.best)}</td><td class="num">${dur(g.med)}</td><td class="num">${g.accAvg == null ? '—' : Math.round(g.accAvg) + '%'}</td><td class="num">${g.hpm == null ? '—' : num(g.hpm, 1)}</td><td class="num">${g.surv}</td></tr>`).join('')}
      </table></div></div>`;
  }

  /* ---------- nội dung: kiểm soát cửa mở theo từng Màn ---------- */
  const ALL = (window.MB.Gates.meta || []);
  const ACTS = (window.MB.Gates.acts || []);
  // bản nháp: { "2": Set([11,12]) } — Màn có trong bản nháp = đang kiểm soát
  function draftFromCfg() { const out = {}, A = (S.cfg.gates && S.cfg.gates.acts) || {}; for (const k in A) out[k] = new Set((A[k] || []).map(Number)); return out; }
  function pContent() {
    const D = S.draft || (S.draft = draftFromCfg());
    const acts = ACTS.length ? ACTS : [...new Set(ALL.map((m) => m.act || 1))].map((n) => ({ n, name: '' }));
    return `<div class="card"><h2>Kiểm soát cửa mở theo từng màn</h2>
      <p class="muted"><b>Màn không bật kiểm soát</b> → người chơi chơi liên tục như bình thường, hết cửa này qua cửa khác (kể cả cửa mới phát hành sau này).<br>
      <b>Màn bật kiểm soát</b> → chỉ những cửa bạn chọn mới mở; cửa còn lại hiện "🔒 Sắp mở" với người chơi, và cửa mới phát hành sau này của màn đó mặc định đóng.<br>
      <b>Tài khoản admin luôn chơi được mọi cửa</b> để chơi thử.</p>
      ${acts.map((a) => {
        const k = String(a.n), list = ALL.filter((m) => (m.act || 1) === a.n), rel = list.filter((m) => m.file), ctl = !!D[k];
        const on = ctl ? rel.filter((m) => D[k].has(m.id)).length : rel.length;
        return `<div class="actbox ${ctl ? 'ctl' : ''}"><div class="acthd">
          <label class="toggle"><input type="checkbox" data-ctl="${k}" ${ctl ? 'checked' : ''} ${rel.length ? '' : 'disabled'}><span></span></label>
          <div><b>Màn ${a.n}${a.name ? ' · ' + esc(a.name) : ''}</b><br><span class="muted">${!rel.length ? 'Chưa có cửa phát hành' : ctl ? `Đang kiểm soát · ${on}/${rel.length} cửa mở` : `Mở tự do · ${rel.length}/${rel.length} cửa mở`}</span></div>
          <span style="flex:1"></span>${ctl ? `<button class="sm" data-actall="${k}">Chọn hết</button><button class="sm" data-actnone="${k}">Bỏ chọn hết</button>` : ''}</div>
          <div class="gchips">${list.length ? list.map((m) => !m.file ? `<span class="gchip off"><b>${String(m.id).padStart(2, '0')}</b><span>Chưa phát hành</span></span>`
            : ctl ? `<button class="gchip ${D[k].has(m.id) ? 'on' : ''}" data-g="${m.id}" data-a="${k}"><b>${String(m.id).padStart(2, '0')}</b><span>${esc(m.name)}</span><i>${D[k].has(m.id) ? 'Đang mở' : 'Đang đóng'}</i></button>`
            : `<span class="gchip on free"><b>${String(m.id).padStart(2, '0')}</b><span>${esc(m.name)}</span><i>Mở tự do</i></span>`).join('')
            : (a.teasers || []).map((t) => `<span class="gchip off"><b>${esc(t.n.replace('GATE ', ''))}</b><span>Chưa phát hành</span></span>`).join('') || '<span class="muted">Chưa có cửa</span>'}</div></div>`;
      }).join('')}
      <p style="margin-top:16px"><button id="cSave" class="primary">Lưu thay đổi</button> <button id="cReset">Huỷ thay đổi</button></p><div id="cMsg" class="msg"></div></div>`;
  }
  PAGES.content.after = () => {
    const re = () => { const y = window.scrollY; render(); window.scrollTo(0, y); };
    const relOf = (k) => ALL.filter((m) => m.file && String(m.act || 1) === k).map((m) => m.id);
    document.querySelectorAll('[data-ctl]').forEach((c) => (c.onchange = () => { const k = c.dataset.ctl; if (c.checked) S.draft[k] = new Set(relOf(k)); else delete S.draft[k]; re(); }));
    document.querySelectorAll('[data-g]').forEach((b) => (b.onclick = () => { const id = +b.dataset.g, st = S.draft[b.dataset.a]; st.has(id) ? st.delete(id) : st.add(id); re(); }));
    document.querySelectorAll('[data-actall]').forEach((b) => (b.onclick = () => { S.draft[b.dataset.actall] = new Set(relOf(b.dataset.actall)); re(); }));
    document.querySelectorAll('[data-actnone]').forEach((b) => (b.onclick = () => { S.draft[b.dataset.actnone] = new Set(); re(); }));
    $('cReset').onclick = () => { S.draft = null; re(); };
    $('cSave').onclick = async () => {
      const acts = {}; for (const k in S.draft) acts[k] = [...S.draft[k]].sort((x, y) => x - y);
      if (await save('gates', { acts, updated: new Date().toISOString() }, 'cMsg')) S.draft = null;
    };
  };

  /* ---------- người tiếp tế (donate) ---------- */
  function pSupport() {
    const sv = S.cfg.server, st = S.cfg.starve, now = new Date(), m0 = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const dons = S.dons || [];
    const month = dons.filter((d) => Date.parse(d.created_at) >= m0).reduce((a, d) => a + d.amount, 0), all = dons.reduce((a, d) => a + d.amount, 0);
    const sups = S.players.filter((u) => u.sup).sort((a, b) => b.sup.total - a.sup.total);
    const pname = (id) => { const u = S.players.find((x) => x.user_id === id); return u ? `${esc(u.name)} <span class="muted">${esc(u.email)}</span>` : '<span class="muted">Ẩn danh</span>'; };
    const k = sv.goal ? Math.min(1, (month + (sv.extra || 0)) / sv.goal) : 0;
    return `<div class="card"><h2>Tìm người chơi theo mã chuyển khoản</h2><p class="muted">Dán nội dung tin nhắn nhận tiền (có mã MBTT…) rồi bấm Tìm → mở hồ sơ → bấm "Xác nhận đã tiếp tế".</p>
      <div class="toolbar" style="margin:0"><input id="findCode" placeholder="VD: NGUYEN VAN A chuyen tien MBTT3FA9C2" style="max-width:480px"><button id="findGo" class="primary">Tìm</button></div></div>
    <div class="kpis">
      <div class="kpi"><span>Tiếp tế tháng này</span><b>${vnd(month)}</b><small>${sv.goal ? Math.round(k * 100) + '% mục tiêu server' : 'chưa đặt mục tiêu'}</small></div>
      <div class="kpi"><span>Tổng đã nhận (300 lần gần nhất)</span><b>${vnd(all)}</b><small>${dons.length} lần</small></div>
      <div class="kpi"><span>Người tiếp tế</span><b>${sups.length}</b><small>${S.players.length ? Math.round(sups.length / S.players.length * 100) : 0}% người chơi</small></div>
    </div>
    <div class="grid2">
      <div class="card"><h2>Ghi nhận tiếp tế thủ công</h2><p class="muted">Khi nhận chuyển khoản mà SePay chưa tự ghi. Mỗi người chơi có mã riêng <code>MBTTxxxxxx</code> (xem trong hồ sơ người chơi). Để trống email = ủng hộ ẩn danh (chỉ cộng vào tổng).</p>
        <label>Email người chơi</label><input id="sEmail" list="emails2" placeholder="ten@gmail.com"><datalist id="emails2">${S.players.map((u) => `<option value="${esc(u.email)}">${esc(u.code)}</option>`).join('')}</datalist>
        <div class="row"><div><label>Số tiền (đ)</label><input id="sAmt" type="number" value="20000"></div><div><label>Ghi chú</label><input id="sNote" placeholder="CK ngày…"></div></div>
        <p style="margin-top:14px"><button id="sGo" class="primary">Ghi nhận & trao huy hiệu</button></p><div id="sMsg" class="msg"></div></div>
      <div class="card"><h2>Thanh chi phí server</h2><p class="muted">Hiện trong màn Tiếp tế của game (khi mục tiêu &gt; 0). Số đã nhận = tiếp tế trong tháng + số cộng thêm.</p>
        <label>Tên hiển thị</label><input id="svLabel" value="${esc(sv.label)}">
        <div class="row"><div><label>Mục tiêu tháng (đ)</label><input id="svGoal" type="number" value="${sv.goal || 0}"></div><div><label>Cộng thêm (tiền nhận ngoài hệ thống)</label><input id="svExtra" type="number" value="${sv.extra || 0}"></div></div>
        ${sv.goal ? `<div class="meter" style="margin-top:12px"><i style="width:${k * 100}%"></i></div><p class="muted">${vnd(month + (sv.extra || 0))} / ${vnd(sv.goal)}</p>` : ''}
        <p style="margin-top:14px"><button id="svSave" class="primary">Lưu</button></p><div id="svMsg" class="msg"></div></div>
    </div>
    <div class="card"><h2>Cửa ác mộng khi chưa tiếp tế</h2><p class="muted">Người chơi <b>chưa tiếp tế</b> vào các cửa này gặp "Vùng ác mộng": quái đông gấp ~1,7 lần, máu ×1,8, đánh đau ×1,4, ~30% quái tinh nhuệ, boss cấp tinh nhuệ, thùng y tế thưa. Thua lần đầu sẽ hiện màn "Trạm tiếp tế" (sau đó thỉnh thoảng, tối đa 1 lần mỗi phiên). Người tiếp tế chơi bình thường. Admin chưa tiếp tế cũng gặp ác mộng (để thử).</p>
      <div class="switch"><label class="toggle"><input type="checkbox" id="stOn" ${st.enabled ? 'checked' : ''}><span></span></label><b>${st.enabled ? 'Đang bật' : 'Đang tắt'}</b></div>
      <label>Các cửa ác mộng (cách nhau dấu phẩy)</label><input id="stGates" value="${esc((st.gates || []).join(', '))}" style="max-width:320px">
      <p style="margin-top:14px"><button id="stSave" class="primary">Lưu</button></p><div id="stMsg" class="msg"></div></div>
    <div class="grid2">
      <div class="card"><h2>Người tiếp tế</h2>${sups.length ? `<div class="tablewrap"><table><tr><th>Người chơi</th><th class="num">Tổng</th><th class="num">Số lần</th><th>Gần nhất</th></tr>${sups.map((u) => `<tr class="click" data-u="${u.user_id}"><td>${whoHtml(u)}</td><td class="num">${vnd(u.sup.total)}</td><td class="num">${u.sup.times}</td><td>${ago(u.sup.last_at)}</td></tr>`).join('')}</table></div>` : '<div class="empty">Chưa có ai</div>'}</div>
      <div class="card"><h2>Lịch sử tiếp tế</h2>${dons.length ? `<div class="tablewrap"><table><tr><th>Thời điểm</th><th>Người</th><th class="num">Số tiền</th><th>Nguồn</th></tr>${dons.slice(0, 60).map((d) => `<tr><td>${dt(d.created_at)}</td><td>${pname(d.user_id)}</td><td class="num">${vnd(d.amount)}</td><td>${d.source === 'sepay' ? 'Tự động' : 'Thủ công'}${d.note ? `<br><span class="muted">${esc(d.note)}</span>` : ''}</td></tr>`).join('')}</table></div>` : '<div class="empty">Chưa có</div>'}</div>
    </div>`;
  }
  PAGES.support.after = () => {
    $('sGo').onclick = async () => {
      const m = $('sMsg'), amt = +$('sAmt').value || 0;
      if (amt <= 0) { m.className = 'msg err'; m.textContent = 'Nhập số tiền'; return; }
      const { error } = await sb.rpc('mb_admin_support', { p_email: $('sEmail').value.trim(), p_amount: amt, p_note: $('sNote').value.trim() });
      m.className = 'msg ' + (error ? 'err' : 'ok'); m.textContent = error ? 'Lỗi: ' + error.message : 'Đã ghi nhận. Người chơi nhận huy hiệu khi mở lại game.';
      if (!error) { await loadAll(); render(); }
    };
    $('svSave').onclick = () => save('server', { label: $('svLabel').value.trim(), goal: +$('svGoal').value || 0, extra: +$('svExtra').value || 0 }, 'svMsg');
    $('stSave').onclick = () => save('starve', { enabled: $('stOn').checked, gates: $('stGates').value.split(/[^0-9]+/).filter(Boolean).map(Number) }, 'stMsg');
  };

  /* ---------- kinh doanh ---------- */
  async function save(key, value, msgEl) {
    const { error } = await sb.from('mb_config').upsert({ key, value, updated_at: new Date().toISOString() });
    const m = $(msgEl);
    if (m) { m.className = 'msg ' + (error ? 'err' : 'ok'); m.textContent = error ? 'Lỗi: ' + error.message : 'Đã lưu · người chơi nhận cấu hình mới khi mở lại game.'; }
    if (!error) S.cfg[key] = value;
    return !error;
  }
  const qrUrl = (d, amount) => (d.bank && d.account ? `https://img.vietqr.io/image/${encodeURIComponent(d.bank)}-${encodeURIComponent(d.account)}-compact2.png?${new URLSearchParams({ ...(amount ? { amount } : {}), addInfo: 'MB UNG HO', accountName: d.name || '' })}` : d.qr || '');

  function pPaywall() {
    const P = S.cfg.paywall;
    return `<div class="card"><h2>🔑 Bắt buộc đăng nhập</h2><p class="muted"><b>Luôn hoạt động, không phụ thuộc công tắc thu phí.</b> Khách chơi tự do tới trước cửa này; tới cửa này phải đăng nhập Google (miễn phí) mới chơi tiếp.</p>
      <div class="row"><div><label>Bắt buộc đăng nhập từ Gate</label><input id="pwLogin" type="number" min="2" value="${P.loginFrom || 8}"></div><div></div></div>
      <p style="margin-top:14px"><button id="lgSave" class="primary">Lưu</button></p><div id="lgMsg" class="msg"></div></div>
    <div class="card"><h2>💎 Thu phí</h2><p class="muted">TẮT (hiện tại): người chơi đã đăng nhập chơi hết các cửa đang mở. BẬT: từ cửa "Thu phí từ" trở đi cần mua gói. <b>Chỉ bật khi đã cài SePay</b> (hoặc sẵn sàng duyệt tay ở mục Đơn hàng).</p>
      <div class="switch"><label class="toggle"><input type="checkbox" id="pwOn" ${P.enabled ? 'checked' : ''}><span></span></label><b id="pwState">${P.enabled ? 'Đang bật thu phí' : 'Đang tắt thu phí'}</b></div>
      <div class="row" style="margin-top:6px"><div><label>Thu phí từ Gate</label><input id="pwPaid" type="number" min="2" value="${P.paidFrom || 11}"></div><div></div></div>
      <p style="margin-top:14px"><button id="pwSave" class="primary">Lưu</button></p><div id="pwMsg" class="msg"></div></div>
      <div class="note">Đang chưa thu phí? Dùng <b>Mở cửa ải</b> để giữ lại các cửa chưa muốn mở, và <b>Người tiếp tế</b> để kêu gọi ủng hộ + cửa ác mộng.</div>`;
  }
  PAGES.paywall.after = () => {
    $('pwOn').onchange = () => { $('pwState').textContent = ($('pwOn').checked ? 'Sẽ bật' : 'Sẽ tắt') + ' (bấm Lưu)'; };
    $('lgSave').onclick = () => save('paywall', Object.assign({}, S.cfg.paywall, { loginFrom: +$('pwLogin').value || 8 }), 'lgMsg');
    $('pwSave').onclick = async () => {
      const v = Object.assign({}, S.cfg.paywall, { enabled: $('pwOn').checked, paidFrom: +$('pwPaid').value || 11 });
      if (v.enabled && !confirm('Bật thu phí từ Gate ' + v.paidFrom + '? Người chơi chưa có gói sẽ bị khoá.')) return;
      if (await save('paywall', v, 'pwMsg')) $('pwState').textContent = v.enabled ? 'Đang bật thu phí' : 'Đang tắt thu phí';
    };
  };
  function pDonate() {
    const D = S.cfg.donate;
    return `<div class="grid2"><div class="card"><h2>Tài khoản nhận tiền</h2><p class="muted">Dùng cho nút ☕ Ủng hộ trong game và mã QR thanh toán gói.</p>
      <label>Mã ngân hàng</label><input id="dBank" value="${esc(D.bank)}" placeholder="VCB, MB, TCB, ACB, VPB, BIDV, ICB…">
      <label>Số tài khoản</label><input id="dAcc" value="${esc(D.account)}">
      <label>Tên chủ tài khoản (không dấu)</label><input id="dName" value="${esc(D.name)}" placeholder="NGUYEN VAN A">
      <label>Lời nhắn hiện trong game</label><input id="dNote" value="${esc(D.note)}">
      <label>Hoặc link ảnh QR riêng (ví dụ QR MoMo) — dùng khi để trống ngân hàng</label><input id="dQr" value="${esc(D.qr)}" placeholder="https://…">
      <p style="margin-top:14px"><button id="dSave" class="primary">Lưu</button> <button id="dPrev">Xem thử QR</button></p><div id="dMsg" class="msg"></div></div>
      <div class="card"><h2>Xem trước</h2><div id="dQrBox" class="empty">Bấm "Xem thử QR"</div></div></div>`;
  }
  PAGES.donate.after = () => {
    const val = () => ({ bank: $('dBank').value.trim(), account: $('dAcc').value.trim(), name: $('dName').value.trim().toUpperCase(), note: $('dNote').value.trim(), qr: $('dQr').value.trim() });
    $('dSave').onclick = () => save('donate', val(), 'dMsg');
    $('dPrev').onclick = () => { const u = qrUrl(val(), 20000); $('dQrBox').innerHTML = u ? `<img class="qr" src="${esc(u)}" alt="QR"><p class="muted">Quét thử (20.000đ) để kiểm tra đúng tên & số tài khoản.</p>` : 'Chưa nhập ngân hàng / số tài khoản.'; };
  };
  function pPlans() {
    const PL = S.cfg.plans;
    return `<div class="card"><h2>Bảng giá</h2><p class="muted">act15 / act30: theo từng màn · year: mọi màn + Chu kỳ+ · gate: ủng hộ mở 1 cửa. Quyền Sinh tồn / bảng xếp hạng / Chu kỳ+ cố định theo gói.</p>
      <div class="tablewrap"><table><tr><th>Mã</th><th>Tên gói</th><th>Giá (đ)</th><th>Màn tiếp theo (đ)</th><th>Số ngày</th><th>Mô tả</th></tr>
      ${Object.keys(PL).map((k) => `<tr data-k="${k}"><td><b>${esc(k)}</b><br><span class="muted">${esc(PL[k].scope)}</span></td>
        <td><input data-f="name" value="${esc(PL[k].name)}"></td><td><input data-f="price" type="number" value="${PL[k].price || 0}"></td>
        <td>${PL[k].scope === 'act' ? `<input data-f="next" type="number" value="${PL[k].next || 0}">` : '—'}</td>
        <td><input data-f="days" type="number" value="${PL[k].days || ''}"></td><td><textarea data-f="desc" rows="2">${esc(PL[k].desc)}</textarea></td></tr>`).join('')}</table></div>
      <p style="margin-top:14px"><button id="plSave" class="primary">Lưu bảng giá</button></p><div id="plMsg" class="msg"></div></div>`;
  }
  PAGES.plans.after = () => {
    $('plSave').onclick = () => {
      const v = JSON.parse(JSON.stringify(S.cfg.plans));
      document.querySelectorAll('tr[data-k]').forEach((tr) => {
        const p = v[tr.dataset.k];
        tr.querySelectorAll('[data-f]').forEach((el) => { const f = el.dataset.f; p[f] = el.type === 'number' ? (el.value === '' ? undefined : +el.value) : el.value; });
        if (!p.days) delete p.days;
      });
      save('plans', v, 'plMsg');
    };
  };
  function pOrders() { return `<div class="card"><div class="card-head"><h2>Đơn hàng gần đây</h2><button id="oLoad" class="sm">Tải lại</button></div><p class="muted">Đơn tự chuyển "Đã trả" khi SePay báo chuyển khoản đúng mã + đủ tiền. Đã nhận tiền mà đơn chưa mở thì bấm Duyệt.</p><div id="orders"><div class="empty">Đang tải…</div></div></div>`; }
  PAGES.orders.after = () => { $('oLoad').onclick = loadOrders; loadOrders(); };
  async function loadOrders() {
    const { data, error } = await sb.from('mb_orders').select('*').order('created_at', { ascending: false }).limit(100);
    const box = $('orders'); if (!box) return;
    if (error) { box.innerHTML = `<p class="msg err">${esc(error.message)}</p>`; return; }
    if (!data.length) { box.innerHTML = '<div class="empty">Chưa có đơn nào.</div>'; return; }
    box.innerHTML = `<div class="tablewrap"><table><tr><th>Mã đơn</th><th>Email</th><th>Gói</th><th class="num">Số tiền</th><th>Trạng thái</th><th>Tạo lúc</th><th></th></tr>
      ${data.map((o) => `<tr><td><b>${esc(o.code)}</b></td><td>${esc(o.email)}</td><td>${esc(o.plan)}${o.act ? ' · Màn ' + o.act : ''}${o.plan === 'gate' && o.gate ? ' · Gate ' + o.gate : ''}</td>
        <td class="num">${vnd(o.amount)}</td><td>${o.status === 'paid' ? '<span class="badge b-good">Đã trả</span>' : o.status === 'pending' ? '<span class="badge b-warn">Chờ</span>' : `<span class="badge b-mute">${esc(o.status)}</span>`}</td>
        <td>${dt(o.created_at)}</td><td>${o.status === 'pending' ? `<button class="sm" data-ok="${esc(o.code)}">Duyệt</button>` : ''}</td></tr>`).join('')}</table></div>`;
    box.querySelectorAll('[data-ok]').forEach((b) => (b.onclick = async () => {
      if (!confirm('Xác nhận đã nhận tiền cho đơn ' + b.dataset.ok + '?')) return;
      const { error: e } = await sb.rpc('mb_apply_order', { p_code: b.dataset.ok, p_amount: null, p_ref: 'manual' });
      if (e) alert(e.message); loadOrders();
    }));
  }
  function pGrant() {
    const PL = S.cfg.plans;
    return `<div class="card"><h2>Cấp quyền theo email</h2><p class="muted">Dùng khi nhận chuyển khoản trực tiếp, tặng quà hoặc thử nghiệm.</p>
      <div class="row"><div><label>Email người chơi</label><input id="gEmail" list="emails" placeholder="ten@gmail.com"><datalist id="emails">${S.players.map((u) => `<option value="${esc(u.email)}">`).join('')}</datalist></div>
        <div><label>Gói</label><select id="gPlan">${Object.keys(PL).map((k) => `<option value="${k}">${esc(PL[k].name)} (${k})</option>`).join('')}</select></div>
        <div><label>Màn (gói theo màn)</label><input id="gAct" type="number" value="2"></div>
        <div><label>Gate (gói mở 1 cửa)</label><input id="gGate" type="number" value="11"></div></div>
      <p style="margin-top:14px"><button id="gGo" class="primary">Cấp quyền</button></p><div id="gMsg" class="msg"></div></div>`;
  }
  PAGES.grant.after = () => {
    $('gGo').onclick = async () => {
      const m = $('gMsg');
      const { error } = await sb.rpc('mb_admin_grant', { p_email: $('gEmail').value.trim(), p_plan: $('gPlan').value, p_act: +$('gAct').value || null, p_gate: +$('gGate').value || null });
      m.className = 'msg ' + (error ? 'err' : 'ok'); m.textContent = error ? 'Lỗi: ' + error.message : 'Đã cấp quyền. Người chơi bấm "Kiểm tra" hoặc mở lại game.';
    };
  };

  /* ---------- sự kiện chung trong trang ---------- */
  function bindPage() {
    const page = $('page');
    page.querySelectorAll('[data-u]').forEach((tr) => tr.addEventListener('click', () => { S.sel = tr.dataset.u; render(); window.scrollTo(0, 0); }));
    page.querySelectorAll('[data-go]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); go(a.dataset.go); }));
    const back = $('backList'); if (back) back.onclick = () => { S.sel = null; S.page = 'players'; render(); };
    const ps = $('pSup');
    if (ps) ps.onclick = async () => {
      const u = S.players.find((x) => x.user_id === S.sel), amt = +$('pAmt').value || 0, m = $('pMsg');
      if (!u || amt <= 0) { m.className = 'msg err'; m.textContent = 'Nhập số tiền đã nhận'; return; }
      if (!confirm(`Xác nhận ${u.name} đã tiếp tế ${vnd(amt)}?`)) return;
      ps.disabled = true;
      const { error } = await sb.rpc('mb_admin_support', { p_email: u.email, p_amount: amt, p_note: $('pNote').value.trim() || $('pNote').placeholder });
      ps.disabled = false;
      m.className = 'msg ' + (error ? 'err' : 'ok'); m.textContent = error ? 'Lỗi: ' + error.message : 'Đã xác nhận! Người chơi sẽ thấy ngôi sao cảm ơn khi mở game.';
      if (!error) { const sel = S.sel; await loadAll(); S.sel = sel; render(); const mm = $('pMsg'); if (mm) { mm.className = 'msg ok'; mm.textContent = 'Đã xác nhận! Người chơi sẽ thấy ngôi sao cảm ơn khi mở game.'; } }
    };
    const fc = $('findCode');
    if (fc) { const goFind = () => { S.q = fc.value; S.rf = ''; go('players'); }; fc.onkeydown = (e) => { if (e.key === 'Enter') goFind(); }; $('findGo').onclick = goFind; }
    page.querySelectorAll('[data-sort]').forEach((th) => th.addEventListener('click', () => { const k = th.dataset.sort; S.sort = { k, d: S.sort.k === k ? -S.sort.d : (k === 'name' ? 1 : -1) }; render(); }));
    const q = $('q'); if (q) { q.oninput = () => { S.q = q.value; const pos = q.selectionStart; render(); const n = $('q'); n.focus(); n.setSelectionRange(pos, pos); }; }
    const rf = $('rf'); if (rf) rf.onchange = () => { S.rf = rf.value; render(); };
    const csv = $('csv'); if (csv) csv.onclick = exportCsv;
  }
  function exportCsv() {
    const head = ['Tên', 'Email', 'Đăng ký', 'Chơi gần nhất', 'Cửa cao nhất', 'Cửa đã qua', 'Số trận', 'Thắng', 'Phút chơi', 'Năng lực', 'Hạng'];
    const rows = S.players.map((u) => [u.name, u.email, u.created_at, u.last || '', u.top, u.cleared, u.nPlays, u.wins, Math.round(u.time / 60), u.rate ? u.rate.total : '', u.rate ? rankOf(u.rate.total)[1] : '']);
    const txt = '﻿' + [head, ...rows].map((r) => r.map((v) => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], { type: 'text/csv' })); a.download = 'monster-breakout-nguoi-choi.csv'; a.click();
  }

  // dữ liệu mẫu để xem giao diện khi thử trên máy: cancuhunterx.html?demo=1 (chỉ localhost)
  if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname) && /[?&]demo=1/.test(location.search)) {
    document.body.classList.remove('locked');
    window.__mbAdminDemo = { S, compute, render, go, initUI };
    return;
  }
  start().catch((e) => { $('page').innerHTML = `<div class="card msg err">${esc(e.message || e)}</div>`; });
})();
