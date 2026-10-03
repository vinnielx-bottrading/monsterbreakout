/* Monster Breakout — trang quản trị (admin.html)
   Đăng nhập Google bằng tài khoản có trong bảng mb_admins. Mọi quyền ghi đều do RLS trên Supabase kiểm tra,
   trang này chỉ là giao diện. Chức năng: bật/tắt thu phí, thông tin nhận donate (QR ngân hàng), bảng giá gói,
   đơn hàng (duyệt tay), cấp quyền thủ công theo email. */
'use strict';
(function () {
  const URL_ = 'https://oapfplwvvspkvklldtpf.supabase.co';
  const KEY = 'sb_publishable_rsIgEmVNK_UkDY-XjoS8vw_cnx4Q5Hk';
  const sb = window.supabase.createClient(URL_, KEY, { auth: { flowType: 'pkce', detectSessionInUrl: true, persistSession: true, autoRefreshToken: true } });
  const $ = (id) => document.getElementById(id);
  const esc = (t) => String(t == null ? '' : t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const vnd = (v) => Number(v || 0).toLocaleString('vi-VN') + 'đ';
  const app = $('app');
  let cfg = {};

  async function start() {
    const { data } = await sb.auth.getSession();
    if (/[?&]code=/.test(location.search)) history.replaceState(null, '', location.pathname);
    const user = data.session && data.session.user;
    if (!user) {
      app.innerHTML = `<div class="center"><p>Đăng nhập bằng tài khoản Google quản trị.</p><button id="login" class="primary">ĐĂNG NHẬP GOOGLE</button></div>`;
      $('login').onclick = () => sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: location.origin + location.pathname } });
      return;
    }
    $('who').innerHTML = `${esc(user.email)} · <a href="#" id="out">Đăng xuất</a>`;
    $('out').onclick = async (e) => { e.preventDefault(); await sb.auth.signOut(); location.reload(); };
    const { data: isAdmin, error } = await sb.rpc('mb_is_admin');
    if (error || !isAdmin) {
      app.innerHTML = `<div class="center"><p>Tài khoản <b>${esc(user.email)}</b> chưa có quyền quản trị.</p>
        <p class="hint">Chạy trong Supabase → SQL Editor:<br><code>insert into public.mb_admins (user_id) select id from auth.users where email = '${esc(user.email)}';</code></p></div>`;
      return;
    }
    await loadCfg();
    render();
  }
  async function loadCfg() {
    const { data } = await sb.from('mb_config').select('key,value');
    cfg = {}; for (const r of data || []) cfg[r.key] = r.value;
    cfg.paywall = cfg.paywall || { enabled: false, loginFrom: 8, paidFrom: 11 };
    cfg.donate = cfg.donate || {};
    cfg.plans = cfg.plans || {};
  }
  async function save(key, value, msgEl) {
    const { error } = await sb.from('mb_config').upsert({ key, value, updated_at: new Date().toISOString() });
    const m = $(msgEl);
    if (m) { m.className = 'msg ' + (error ? 'err' : 'ok'); m.textContent = error ? 'Lỗi: ' + error.message : 'Đã lưu · người chơi nhận cấu hình mới khi mở lại game.'; }
    if (!error) cfg[key] = value;
    return !error;
  }
  const qrUrl = (d, amount) => (d.bank && d.account ? `https://img.vietqr.io/image/${encodeURIComponent(d.bank)}-${encodeURIComponent(d.account)}-compact2.png?${new URLSearchParams({ ...(amount ? { amount } : {}), addInfo: 'MB UNG HO', accountName: d.name || '' })}` : d.qr || '');

  function render() {
    const P = cfg.paywall, D = cfg.donate, PL = cfg.plans;
    app.innerHTML = `
    <section>
      <h2>THU PHÍ</h2>
      <div class="switch"><input type="checkbox" id="pwOn" ${P.enabled ? 'checked' : ''}> Bật thu phí từ Gate <span id="pwState" class="state ${P.enabled ? 'on' : 'off'}">${P.enabled ? 'ĐANG BẬT' : 'ĐANG TẮT'}</span></div>
      <p class="hint">TẮT: người chơi chỉ cần đăng nhập Google là chơi hết. BẬT: từ cửa "Thu phí từ" trở đi cần mua gói.</p>
      <div class="row"><div><label>Khách chơi tới trước Gate (bắt buộc đăng nhập từ)</label><input id="pwLogin" type="number" min="2" value="${P.loginFrom || 8}"></div>
      <div><label>Thu phí từ Gate</label><input id="pwPaid" type="number" min="2" value="${P.paidFrom || 11}"></div></div>
      <p><button id="pwSave" class="primary">LƯU</button></p><div id="pwMsg" class="msg"></div>
    </section>

    <section>
      <h2>NHẬN DONATE / CHUYỂN KHOẢN (QR NGÂN HÀNG)</h2>
      <div class="row">
        <div><label>Mã ngân hàng (VCB, MB, TCB, ACB, VPB, BIDV, ICB…)</label><input id="dBank" value="${esc(D.bank)}" placeholder="VCB"></div>
        <div><label>Số tài khoản</label><input id="dAcc" value="${esc(D.account)}"></div>
        <div><label>Tên chủ tài khoản (không dấu)</label><input id="dName" value="${esc(D.name)}" placeholder="NGUYEN VAN A"></div>
      </div>
      <label>Lời nhắn hiện trong game</label><input id="dNote" value="${esc(D.note)}">
      <label>Hoặc đường dẫn ảnh QR riêng (ví dụ QR MoMo) — dùng khi để trống ngân hàng</label><input id="dQr" value="${esc(D.qr)}" placeholder="https://…">
      <p><button id="dSave" class="primary">LƯU</button> <button id="dPrev">XEM THỬ QR</button></p><div id="dMsg" class="msg"></div>
      <div id="dQrBox"></div>
    </section>

    <section>
      <h2>BẢNG GIÁ GÓI</h2>
      <div class="scroll"><table><tr><th>Mã</th><th>Tên gói</th><th>Giá</th><th>Màn tiếp theo</th><th>Số ngày</th><th>Mô tả</th></tr>
      ${Object.keys(PL).map((k) => `<tr data-k="${k}"><td><b>${esc(k)}</b><br><span class="hint">${esc(PL[k].scope)}</span></td>
        <td><input data-f="name" value="${esc(PL[k].name)}"></td><td><input data-f="price" type="number" value="${PL[k].price || 0}"></td>
        <td>${PL[k].scope === 'act' ? `<input data-f="next" type="number" value="${PL[k].next || 0}">` : '—'}</td>
        <td><input data-f="days" type="number" value="${PL[k].days || ''}"></td><td><textarea data-f="desc" rows="2">${esc(PL[k].desc)}</textarea></td></tr>`).join('')}
      </table></div>
      <p class="hint">act15 / act30: theo từng màn · year: mọi màn + Chu kỳ+ · gate: ủng hộ mở 1 cửa. Quyền Sinh tồn / bảng xếp hạng / Chu kỳ+ cố định theo gói.</p>
      <p><button id="plSave" class="primary">LƯU BẢNG GIÁ</button></p><div id="plMsg" class="msg"></div>
    </section>

    <section>
      <h2>ĐƠN HÀNG</h2>
      <p class="hint">Đơn tự chuyển "đã trả" khi SePay báo chuyển khoản đúng mã + đủ tiền. Nhận tiền mà đơn chưa tự mở thì bấm DUYỆT.</p>
      <p><button id="oLoad" class="sm">TẢI LẠI</button></p>
      <div id="orders" class="scroll"></div>
    </section>

    <section>
      <h2>CẤP QUYỀN THỦ CÔNG</h2>
      <div class="row">
        <div><label>Email người chơi</label><input id="gEmail" placeholder="ten@gmail.com"></div>
        <div><label>Gói</label><select id="gPlan">${Object.keys(PL).map((k) => `<option value="${k}">${esc(PL[k].name)} (${k})</option>`).join('')}</select></div>
        <div><label>Màn (gói theo màn)</label><input id="gAct" type="number" value="2"></div>
        <div><label>Gate (gói mở 1 cửa)</label><input id="gGate" type="number" value="11"></div>
      </div>
      <p><button id="gGo" class="primary">CẤP QUYỀN</button></p><div id="gMsg" class="msg"></div>
    </section>`;

    $('pwOn').onchange = () => { $('pwState').textContent = $('pwOn').checked ? 'SẼ BẬT (bấm LƯU)' : 'SẼ TẮT (bấm LƯU)'; };
    $('pwSave').onclick = async () => {
      const v = { enabled: $('pwOn').checked, loginFrom: +$('pwLogin').value || 8, paidFrom: +$('pwPaid').value || 11 };
      if (v.enabled && !confirm('Bật thu phí từ Gate ' + v.paidFrom + '? Người chơi chưa có gói sẽ bị khoá.')) return;
      if (await save('paywall', v, 'pwMsg')) { $('pwState').className = 'state ' + (v.enabled ? 'on' : 'off'); $('pwState').textContent = v.enabled ? 'ĐANG BẬT' : 'ĐANG TẮT'; }
    };
    const donVal = () => ({ bank: $('dBank').value.trim(), account: $('dAcc').value.trim(), name: $('dName').value.trim().toUpperCase(), note: $('dNote').value.trim(), qr: $('dQr').value.trim() });
    $('dSave').onclick = () => save('donate', donVal(), 'dMsg');
    $('dPrev').onclick = () => { const u = qrUrl(donVal(), 20000); $('dQrBox').innerHTML = u ? `<img class="qr" src="${esc(u)}" alt="QR"><p class="hint">Quét thử bằng app ngân hàng (20.000đ) để kiểm tra tên & số tài khoản.</p>` : '<p class="hint">Chưa nhập ngân hàng / số tài khoản.</p>'; };
    $('plSave').onclick = () => {
      const v = JSON.parse(JSON.stringify(cfg.plans));
      app.querySelectorAll('tr[data-k]').forEach((tr) => {
        const p = v[tr.dataset.k];
        tr.querySelectorAll('[data-f]').forEach((el) => { const f = el.dataset.f; p[f] = el.type === 'number' ? (el.value === '' ? undefined : +el.value) : el.value; });
        if (!p.days) delete p.days;
      });
      save('plans', v, 'plMsg');
    };
    $('oLoad').onclick = loadOrders;
    $('gGo').onclick = async () => {
      const m = $('gMsg');
      const { error } = await sb.rpc('mb_admin_grant', { p_email: $('gEmail').value.trim(), p_plan: $('gPlan').value, p_act: +$('gAct').value || null, p_gate: +$('gGate').value || null });
      m.className = 'msg ' + (error ? 'err' : 'ok'); m.textContent = error ? 'Lỗi: ' + error.message : 'Đã cấp quyền. Người chơi bấm "Kiểm tra" hoặc mở lại game.';
    };
    loadOrders();
  }

  async function loadOrders() {
    const { data, error } = await sb.from('mb_orders').select('*').order('created_at', { ascending: false }).limit(60);
    const box = $('orders');
    if (error) { box.innerHTML = `<p class="msg err">${esc(error.message)}</p>`; return; }
    if (!data.length) { box.innerHTML = '<p class="hint">Chưa có đơn nào.</p>'; return; }
    box.innerHTML = `<table><tr><th>Mã</th><th>Email</th><th>Gói</th><th>Số tiền</th><th>Trạng thái</th><th>Tạo lúc</th><th></th></tr>
      ${data.map((o) => `<tr><td><b>${esc(o.code)}</b></td><td>${esc(o.email)}</td><td>${esc(o.plan)}${o.act ? ' · Màn ' + o.act : ''}${o.plan === 'gate' && o.gate ? ' · Gate ' + o.gate : ''}</td>
        <td>${vnd(o.amount)}</td><td class="${esc(o.status)}">${o.status === 'paid' ? 'Đã trả' : o.status === 'pending' ? 'Chờ' : esc(o.status)}</td>
        <td>${new Date(o.created_at).toLocaleString('vi-VN')}</td><td>${o.status === 'pending' ? `<button class="sm" data-ok="${esc(o.code)}">DUYỆT</button>` : ''}</td></tr>`).join('')}</table>`;
    box.querySelectorAll('[data-ok]').forEach((b) => b.onclick = async () => {
      if (!confirm('Xác nhận đã nhận tiền cho đơn ' + b.dataset.ok + '?')) return;
      const { error: e } = await sb.rpc('mb_apply_order', { p_code: b.dataset.ok, p_amount: null, p_ref: 'manual' });
      if (e) alert(e.message); loadOrders();
    });
  }

  start().catch((e) => { app.innerHTML = `<div class="center msg err">${esc(e.message || e)}</div>`; });
})();
