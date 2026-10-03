/* Monster Breakout — quyền chơi, gói trả phí, donate (v7.1)
   - Khách (chưa đăng nhập): chơi Gate 1–7. Từ Gate 8 phải đăng nhập Google (miễn phí).
   - THU PHÍ: bật/tắt bằng trang quản trị (admin.html → bảng mb_config, key 'paywall'). Đang TẮT: đăng nhập là chơi hết.
     Khi BẬT: từ Gate 11 (Màn 2) cần gói — 15 ngày / 30 ngày theo màn, 1 năm mọi màn (+ Chu kỳ+), hoặc ủng hộ 5.000đ mở 1 cửa 15 ngày.
   - Bảng giá, thông tin ngân hàng nhận donate cũng chỉnh ở trang quản trị (key 'plans', 'donate').
   - Thanh toán: mã VietQR có sẵn số tiền + mã đơn → SePay báo biến động số dư → Edge Function mb-sepay → mở khoá.
   Cấu hình đọc công khai qua REST (không cần tải thư viện Supabase), lưu tạm trên máy để chơi offline. */
'use strict';
(function (MB) {
  const DEV = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) && /[?&]unlock=all/.test(location.search);
  const DEF = {
    paywall: { enabled: false, loginFrom: 8, paidFrom: 11 },
    donate: { bank: '', account: '', name: '', note: 'Ủng hộ duy trì server Monster Breakout', qr: '' },
    starve: { enabled: true, gates: [11] },
    server: { goal: 0, label: 'Chi phí server tháng này', extra: 0 },
    plans: {
      act15: { name: 'Gói 15 ngày', price: 29000, next: 29000, days: 15, scope: 'act', perks: {}, desc: 'Chiến dịch của màn này trong 15 ngày.' },
      act30: { name: 'Gói 30 ngày', price: 49000, next: 25000, days: 30, scope: 'act', perks: { survival: true, board: true }, desc: 'Chiến dịch + Sinh tồn/Bất tận + bảng xếp hạng của màn này trong 30 ngày. Màn tiếp theo chỉ 25.000đ.' },
      year: { name: 'Gói 1 năm · Mọi màn', price: 525000, days: 365, scope: 'all', perks: { survival: true, board: true, ngplus: true }, desc: 'Mọi màn hiện có và sắp ra mắt, Sinh tồn, bảng xếp hạng, và Chu kỳ+ trong lúc chờ màn mới.' },
      gate: { name: 'Ủng hộ mở 1 cửa', price: 5000, days: 15, scope: 'gate', perks: {}, desc: 'Mở riêng cửa này trong 15 ngày.' },
    },
  };
  const esc = (t) => String(t == null ? '' : t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const A = MB.Access = {
    dev: DEV,
    cfg: JSON.parse(JSON.stringify(DEF)),
    ent: [], uid: null, loadedAt: 0, loading: null,

    /* ---------- cấu hình từ xa ---------- */
    async loadConfig() {
      try { const c = JSON.parse(localStorage.getItem('mb_cfg') || 'null'); if (c) this.applyCfg(c); } catch (e) { /* bỏ qua */ }
      try {
        const C = MB.Cloud;
        const r = await fetch(`${C.URL}/rest/v1/mb_config?select=key,value`, { headers: { apikey: C.KEY, Authorization: 'Bearer ' + C.KEY } });
        if (!r.ok) throw new Error(r.status);
        const rows = await r.json(), c = {};
        for (const row of rows) c[row.key] = row.value;
        this.applyCfg(c);
        try { localStorage.setItem('mb_cfg', JSON.stringify(c)); } catch (e) { /* bỏ qua */ }
      } catch (e) { console.warn('[config]', e); }
    },
    applyCfg(c) {
      for (const k of ['paywall', 'donate']) if (c[k]) this.cfg[k] = Object.assign({}, DEF[k], c[k]);
      if (c.plans) this.cfg.plans = c.plans;
      // cửa "ác mộng" khi chưa tiếp tế, mục tiêu chi phí server
      this.cfg.starve = Object.assign({ enabled: true, gates: [11] }, c.starve || {});
      this.cfg.server = Object.assign({ goal: 0, label: 'Chi phí server tháng này', extra: 0 }, c.server || {});
      // kiểm soát cửa theo từng Màn (admin chọn): { acts: { "2": [11, 12] } }
      // Màn KHÔNG có trong danh sách = mở tự do (chơi liên tục như bình thường). Màn có trong danh sách = chỉ mở các cửa được chọn.
      const g = c.gates;
      this.cfg.gates = g && g.acts ? g.acts : null;
    },
    // cửa đang đóng với người chơi (admin vẫn chơi được)
    isClosed(id) {
      const A = this.cfg.gates; if (!A) return false;
      const list = A[String(this.actOf(id))];
      return Array.isArray(list) && !list.map(Number).includes(id);
    },
    get LOGIN_FROM() { return this.cfg.paywall.loginFrom || 8; },
    get PAID_FROM() { return this.cfg.paywall.paidFrom || 11; },
    get paywall() { return !!this.cfg.paywall.enabled; },

    /* ---------- quyền ---------- */
    actOf(id) { const m = MB.Gates.meta.find((x) => x.id === id); return (m && m.act) || (id <= 10 ? 1 : 2); },
    live() { const now = Date.now(); return this.ent.filter((r) => !r.expires_at || Date.parse(r.expires_at) > now); },
    // được chơi cửa id ở chế độ mode?
    has(id, mode) {
      if (DEV) return true;
      const act = this.actOf(id), surv = mode === 'survival';
      return this.live().some((r) => {
        const p = r.perks || {};
        if (r.gates && r.gates.includes(id)) return !surv;
        if (r.acts && !r.acts.includes(act)) return false;
        return !surv || !!p.survival;
      });
    },
    ngplus() { return DEV || this.live().some((r) => r.perks && r.perks.ngplus); },
    // lý do chưa được chơi: null | 'login' | 'pay'
    need(id, mode) {
      if (DEV || this.admin) return null;
      if (this.isClosed(id)) return 'closed';
      if (id >= this.LOGIN_FROM && !(MB.Cloud && MB.Cloud.user)) return 'login';
      if (this.paywall && id >= this.PAID_FROM && !this.has(id, mode)) return 'pay';
      return null;
    },
    async check(id, mode) {
      if (DEV) return null;
      const C = MB.Cloud;
      if (!C.user && C.needsInit()) { try { await C.load(); } catch (e) { /* bỏ qua */ } }
      if (C.user && this.uid !== C.user.id) await this.refresh();   // biết có phải admin không
      if (this.need(id, mode) === 'closed') return 'closed';
      if (id < this.LOGIN_FROM) return null;
      if (C.user && this.paywall && id >= this.PAID_FROM && (this.uid !== C.user.id || Date.now() - this.loadedAt > 60000)) await this.refresh();
      return this.need(id, mode);
    },
    async refresh() {
      const C = MB.Cloud;
      if (!C.user) { this.ent = []; this.uid = null; return; }
      const uid = C.user.id;
      if (this.uid !== uid) { this.uid = uid; try { this.ent = JSON.parse(localStorage.getItem('mb_ent_' + uid) || '[]'); this.admin = localStorage.getItem('mb_adm_' + uid) === '1'; this.supporter = localStorage.getItem('mb_sup_' + uid) === '1'; } catch (e) { this.ent = []; } }
      if (this.loading) return this.loading;
      this.loading = (async () => {
        try {
          await C.load();
          const { data, error } = await C.sb.from('mb_entitlements').select('plan,acts,gates,perks,expires_at').eq('user_id', uid);
          if (error) throw error;
          this.ent = data || []; this.loadedAt = Date.now();
          try { localStorage.setItem('mb_ent_' + uid, JSON.stringify(this.ent)); } catch (e) { /* bỏ qua */ }
          const ad = await C.sb.from('mb_admins').select('user_id').eq('user_id', uid).maybeSingle();
          if (!ad.error) { this.admin = !!ad.data; try { localStorage.setItem('mb_adm_' + uid, this.admin ? '1' : '0'); } catch (e) { /* bỏ qua */ } }
          const sp = await C.sb.from('mb_supporters').select('total,times').eq('user_id', uid).maybeSingle();
          if (!sp.error) {
            const was = this.supporter; this.supporter = !!sp.data; this.support = sp.data || null;
            try { localStorage.setItem('mb_sup_' + uid, this.supporter ? '1' : '0'); } catch (e) { /* bỏ qua */ }
            if (this.supporter && !was && MB.App.thankSupporter) setTimeout(() => MB.App.thankSupporter(), 600);
          }
        } catch (e) { console.warn('[access]', e); }
        this.loading = null;
      })();
      return this.loading;
    },
    onUser(u) {
      if (!u) { this.ent = []; this.uid = null; this.loadedAt = 0; this.admin = false; this.supporter = false; return; }
      this.refresh().then(() => { if (MB.App.current === 'gates') MB.App.openGates(); if (MB.App.current === 'account') MB.App.renderAccount(); });
    },
    active() {
      return this.live().map((r) => {
        const p = this.cfg.plans[r.plan];
        const what = r.gates && r.gates.length ? ` Gate ${r.gates.join(', ')}` : r.acts ? ` · Màn ${r.acts.join(', ')}` : '';
        return (p ? p.name : r.plan) + what + (r.expires_at ? ` (đến ${new Date(r.expires_at).toLocaleDateString('vi-VN')})` : '');
      });
    },
    /* ---------- tiếp tế (donate) ---------- */
    // mã chuyển khoản riêng: MBTT + 6 ký tự đầu user id → máy chủ nhận ra ai đã ủng hộ
    donateCode() { const u = MB.Cloud && MB.Cloud.user; return u ? 'MBTT' + u.id.replace(/-/g, '').slice(0, 6).toUpperCase() : 'MB UNG HO'; },
    // cửa "ác mộng" khi chưa tiếp tế (admin chọn trong trang quản trị)
    starveFor(id) { const s = this.cfg.starve; return !DEV && !this.supporter && !!(s && s.enabled && (s.gates || []).map(Number).includes(id)); },
    async monthSupport() {
      try {
        const C = MB.Cloud;
        const r = await fetch(`${C.URL}/rest/v1/rpc/mb_month_support`, { method: 'POST', headers: { apikey: C.KEY, Authorization: 'Bearer ' + C.KEY, 'Content-Type': 'application/json' }, body: '{}' });
        if (!r.ok) throw new Error(r.status);
        return Number(await r.json()) || 0;
      } catch (e) { return null; }
    },
    price(v) { return Number(v || 0).toLocaleString('vi-VN') + 'đ'; },
    // giá dự kiến (máy chủ tính lại khi tạo đơn): đã từng mua cùng gói cho màn khác → giá "màn tiếp theo"
    priceFor(planId, act) {
      const p = this.cfg.plans[planId]; if (!p) return 0;
      if (p.scope === 'act' && p.next && this.ent.some((r) => r.plan === planId && r.acts && !r.acts.includes(act))) return p.next;
      return p.price;
    },
    async order(planId, act, gate) {
      const C = MB.Cloud;
      await C.load();
      const { data, error } = await C.sb.rpc('mb_create_order', { p_plan: planId, p_act: act || null, p_gate: gate || null });
      if (error) throw error;
      return data;
    },

    /* ---------- mã QR (VietQR) ---------- */
    qrUrl(amount, info) {
      const d = this.cfg.donate;
      if (!d.bank || !d.account) return d.qr || '';
      const q = new URLSearchParams();
      if (amount) q.set('amount', amount);
      if (info) q.set('addInfo', info);
      if (d.name) q.set('accountName', d.name);
      return `https://img.vietqr.io/image/${encodeURIComponent(d.bank)}-${encodeURIComponent(d.account)}-compact2.png?${q}`;
    },
    // khung QR dùng chung cho donate và thanh toán
    qrBox(amount, info, foot) {
      const d = this.cfg.donate, url = (amount || info || !d.qr) ? this.qrUrl(amount, info) : d.qr;
      if (!url) return '<p class="hint">Chủ game chưa cài đặt tài khoản nhận. Vui lòng quay lại sau.</p>';
      return `<div class="qrbox"><img src="${esc(url)}" alt="Mã QR chuyển khoản" referrerpolicy="no-referrer">
        <div class="qrinfo">${d.bank ? `<div><span>Ngân hàng</span><b>${esc(d.bank.toUpperCase())}</b></div>` : ''}
        ${d.account ? `<div><span>Số tài khoản</span><b>${esc(d.account)}</b> <button class="sm copy" data-copy="${esc(d.account)}">Sao chép</button></div>` : ''}
        ${d.name ? `<div><span>Chủ tài khoản</span><b>${esc(d.name)}</b></div>` : ''}
        ${amount ? `<div><span>Số tiền</span><b class="amt">${this.price(amount)}</b></div>` : ''}
        ${info ? `<div><span>Nội dung</span><b class="code">${esc(info)}</b> <button class="sm copy" data-copy="${esc(info)}">Sao chép</button></div>` : ''}
        ${foot ? `<p class="hint">${foot}</p>` : ''}</div></div>`;
    },
    bindCopy(root) {
      root.querySelectorAll('[data-copy]').forEach((b) => b.addEventListener('click', () => {
        const t = b.dataset.copy;
        (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => { b.textContent = 'Đã chép'; }).catch(() => { b.textContent = t; });
      }));
    },
  };
})(window.MB);
