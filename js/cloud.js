/* Monster Breakout — lưu tiến trình lên mạng + bảng xếp hạng (Supabase, đăng nhập Google).
   Không bắt buộc: khách vẫn chơi bình thường, dữ liệu lưu trên máy. Đăng nhập thì tiến trình
   được đồng bộ giữa các máy và có tên trên bảng xếp hạng. Thư viện Supabase chỉ được tải khi cần. */
'use strict';
(function (MB) {
  const SUPABASE_URL = 'https://oapfplwvvspkvklldtpf.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_rsIgEmVNK_UkDY-XjoS8vw_cnx4Q5Hk'; // khoá công khai (publishable), an toàn khi để ở trình duyệt

  // ghép 2 bản lưu: tiến độ lấy phần tốt hơn; xu lấy theo bản mới hơn; cài đặt giữ của máy này
  function merge(local, cloud) {
    const out = JSON.parse(JSON.stringify(local));
    if (!cloud) return out;
    out.unlocked = Math.max(local.unlocked || 1, cloud.unlocked || 1);
    out.gates = out.gates || {};
    for (const id in cloud.gates || {}) {
      const a = out.gates[id], b = cloud.gates[id];
      if (!a) { out.gates[id] = b; continue; }
      a.best = Math.max(a.best || 0, b.best || 0);
      a.done = Array.from(new Set([...(a.done || []), ...(b.done || [])]));
      a.cleared = !!(a.cleared || b.cleared);
      const t = [a.bestTime, b.bestTime].filter((x) => x > 0);
      a.bestTime = t.length ? Math.min(...t) : 0;
      if (b.surv && (!a.surv || b.surv.wave > a.surv.wave || (b.surv.wave === a.surv.wave && b.surv.score > a.surv.score))) a.surv = b.surv;
    }
    const arm = new Set([...(local.armory || []), ...(cloud.armory || [])]);
    out.armory = MB.Weapons.ORDER.filter((id) => arm.has(id));
    out.upg = Object.assign({}, local.upg || {});
    for (const k in cloud.upg || {}) out.upg[k] = Math.max(out.upg[k] || 0, cloud.upg[k]);
    const newer = (cloud.ts || 0) > (local.ts || 0) ? cloud : local;
    out.coins = newer.coins || 0;
    out.ts = Math.max(local.ts || 0, cloud.ts || 0);
    return out;
  }

  const C = MB.Cloud = {
    URL: SUPABASE_URL, KEY: SUPABASE_KEY,
    sb: null, user: null, status: 'guest', lastSync: 0, error: '',
    merge,

    // có phiên đăng nhập cũ / đang quay về từ trang Google?
    needsInit() {
      try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith('sb-') && k.endsWith('-auth-token')) return true; } } catch (e) { /* bỏ qua */ }
      return /[?&]code=/.test(location.search) || /access_token|error_description/.test(location.hash + location.search);
    },
    async init() {
      if (this.needsInit()) { try { await this.load(); } catch (e) { this.fail(e); } }
      this.render();
    },
    async load() {
      if (this.sb) return this.sb;
      if (!this.loading) {
        this.loading = MB.App.loadScript('js/vendor/supabase.min.js').then(async () => {
          this.sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
            auth: { flowType: 'pkce', detectSessionInUrl: true, persistSession: true, autoRefreshToken: true },
          });
          this.sb.auth.onAuthStateChange((ev, session) => { setTimeout(() => this.setUser(session ? session.user : null), 0); });
          const { data } = await this.sb.auth.getSession();
          this.setUser(data.session ? data.session.user : null);
          // dọn ?code=… khỏi thanh địa chỉ sau khi đăng nhập xong
          if (/[?&]code=|error/.test(location.search) || /access_token/.test(location.hash)) history.replaceState(null, '', location.pathname);
          return this.sb;
        });
      }
      return this.loading;
    },

    name() { const m = (this.user && this.user.user_metadata) || {}; return m.full_name || m.name || (this.user && this.user.email) || 'Hunter'; },
    avatar() { const m = (this.user && this.user.user_metadata) || {}; return m.avatar_url || m.picture || ''; },

    setUser(u) {
      const prev = this.user && this.user.id;
      this.user = u || null;
      if ((u && u.id) !== prev && MB.Access) MB.Access.onUser(this.user);
      if (!u) { this.status = 'guest'; this.render(); return; }
      if (u.id !== prev) this.sync();
      else this.render();
    },

    async signIn() {
      try {
        this.status = 'loading'; this.render();
        await this.load();
        const { error } = await this.sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: location.origin + location.pathname, queryParams: { prompt: 'select_account' } } });
        if (error) throw error;
      } catch (e) { this.fail(e); }
    },
    async signOut() {
      try { if (this.sb) await this.sb.auth.signOut(); } catch (e) { /* bỏ qua */ }
      this.user = null; this.status = 'guest'; this.render();
      MB.HUD.toast('Đã đăng xuất. Tiến trình trên máy này vẫn giữ nguyên.', '#7ef3ff');
    },

    // kéo bản trên mạng về, ghép với bản trên máy, rồi đẩy bản đã ghép lên
    async sync() {
      if (!this.user) return;
      this.status = 'syncing'; this.render();
      try {
        const uid = this.user.id, sv = MB.Save.data;
        const { data, error } = await this.sb.from('mb_saves').select('save').eq('user_id', uid).maybeSingle();
        if (error) throw error;
        const cloud = data && data.save;
        let next;
        if (sv.owner && sv.owner !== uid) {
          // máy này đang giữ tiến trình của tài khoản khác → dùng bản của tài khoản vừa đăng nhập
          next = Object.assign(MB.Save.blank(), cloud || {}, { settings: sv.settings });
        } else next = merge(sv, cloud);
        next.owner = uid;
        MB.Save.data = next; MB.Save.save();
        await this.push(true);
        this.status = 'synced'; this.lastSync = Date.now();
        if (MB.App.current === 'gates') MB.App.openGates();
      } catch (e) { this.fail(e); }
      this.render();
    },
    async push(now) {
      if (!this.user || !this.sb) return;
      if (!now) { clearTimeout(this.pt); this.pt = setTimeout(() => this.push(true), 1500); return; }
      const save = Object.assign({}, MB.Save.data); delete save.settings;
      const { error } = await this.sb.from('mb_saves').upsert({ user_id: this.user.id, save, updated_at: new Date().toISOString() });
      if (error) { this.fail(error); return; }
      this.status = 'synced'; this.lastSync = Date.now(); this.render();
    },
    // gửi thành tích lên bảng xếp hạng (chiến dịch: chỉ khi thắng; sinh tồn: mọi lần)
    async submit(sum) {
      if (!this.user || !this.sb) return;
      if (sum.mode !== 'survival' && !sum.win) return;
      if (sum.ngp) return; // Chu kỳ+: kỷ lục riêng trên máy, không trộn bảng xếp hạng chiến dịch
      const { error } = await this.sb.rpc('mb_submit_score', { p_gate: sum.mode === 'survival' ? 30 : sum.gateId, p_mode: sum.mode || 'campaign', p_score: Math.round(sum.score), p_wave: sum.mode === 'survival' ? sum.wave : 0, p_time: sum.time });
      if (error) console.warn('[cloud] gửi điểm lỗi', error);
    },
    // nhật ký trận (để admin thống kê, đánh giá năng lực)
    async logPlay(sum) {
      if (!this.user || !this.sb) return;
      const p = { gate: sum.gateId, mode: sum.mode, win: !!sum.win, time: Math.round(sum.time * 10) / 10, score: Math.round(sum.score), kills: sum.kills, accuracy: sum.accuracy,
        hits: sum.hitsTaken || 0, stars: (sum.done || []).length, wave: sum.wave || 0, bossTier: sum.bossTier || 0 };
      const { error } = await this.sb.rpc('mb_log_play', { p });
      if (error) console.warn('[cloud] ghi trận lỗi', error);
    },
    async leaderboard(gate, mode) {
      await this.load();
      let q = this.sb.from('mb_scores').select('*').eq('gate', gate).eq('mode', mode);
      q = mode === 'survival' ? q.order('wave', { ascending: false }).order('score', { ascending: false }) : q.order('score', { ascending: false });
      const { data, error } = await q.limit(50);
      if (error) throw error;
      return data || [];
    },

    fail(e) {
      console.warn('[cloud]', e);
      this.error = (e && (e.message || e.error_description)) || String(e);
      this.status = this.user ? 'error' : 'guest';
      this.render();
    },
    // cập nhật mọi chỗ hiển thị trạng thái tài khoản
    render() { if (MB.App && MB.App.renderAccount) MB.App.renderAccount(); },
  };
})(window.MB);
