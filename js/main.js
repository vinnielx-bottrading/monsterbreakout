/* Monster Breakout — app shell: màn hình menu, chọn Gate, tải file Gate theo yêu cầu, vòng lặp game */
'use strict';
(function (MB) {
  const $ = (id) => document.getElementById(id);
  const G = MB.G;
  const SCREENS = ['menu', 'gates', 'help', 'settings', 'pause', 'result', 'retry', 'loading'];
  const loaded = {};

  const App = MB.App = {
    current: 'menu',
    lastGate: null,

    init() {
      MB.Save.load();
      const st = MB.Save.data.settings;
      MB.Audio.set('sfx', st.sfx); MB.Audio.set('music', st.music);
      if (new URLSearchParams(location.search).get('unlock') === 'all') { MB.Save.data.unlocked = 99; }
      G.init($('game'));
      MB.HUD.init();
      MB.Input.init($('input'));
      if (MB.U.isTouchDevice()) MB.Input.setMode('touch');
      this.bind();
      this.onResize();
      addEventListener('resize', () => this.onResize());
      addEventListener('orientationchange', () => setTimeout(() => this.onResize(), 200));
      document.addEventListener('visibilitychange', () => { if (document.hidden && G.running && !G.over) this.pause(); });
      this.show('menu');
      this.loop();
      this.pwa();
    },

    bind() {
      const on = (id, fn) => { const el = $(id); if (el) el.addEventListener('click', () => { MB.Audio.unlock(); MB.Audio.play('ui'); fn(); }); };
      on('btnPlay', () => this.openGates());
      on('btnHelp', () => this.show('help'));
      on('btnSettings', () => this.openSettings());
      on('btnFull', () => this.fullscreen());
      document.querySelectorAll('#viewToggle [data-view]').forEach((b) => b.addEventListener('click', () => {
        MB.Audio.play('ui'); MB.Save.data.settings.view = b.dataset.view; MB.Save.save(); this.renderViewToggle();
      }));
      document.querySelectorAll('[data-back]').forEach((b) => b.addEventListener('click', () => { MB.Audio.play('ui'); this.show(b.dataset.back); }));
      on('btnResume', () => this.resume());
      on('btnRestart', () => this.playGate(this.lastGate));
      on('btnView', () => this.switchView());
      on('btnRetryBoss', () => this.retryBoss());
      on('btnGiveUp', () => this.giveUp());
      on('btnQuit', () => this.quit());
      on('btnAgain', () => this.playGate(this.lastGate));
      on('btnNext', () => this.playGate(this.lastGate + 1));
      on('btnMenu', () => this.quit());
      on('btnReset', () => {
        const b = $('btnReset');
        if (b.dataset.confirm) { MB.Save.reset(); b.textContent = 'Đã xoá tiến trình'; delete b.dataset.confirm; this.openSettings(); }
        else { b.dataset.confirm = '1'; b.textContent = 'Bấm lần nữa để xác nhận'; }
      });
    },

    show(name) {
      this.current = name;
      for (const s of SCREENS) $(s).classList.toggle('hidden', s !== name);
      const inGame = G.running && (name === null);
      $('hud').classList.toggle('hidden', !G.running || name === 'menu' || name === 'gates');
      $('touchUI').classList.toggle('hidden', !inGame);
      document.body.classList.toggle('playing', inGame);
    },

    /* ---------- chọn Gate ---------- */
    openGates() {
      if (this.pendingUpdate) { G.running = false; this.applyUpdate(this.pendingUpdate); return; }
      const sv = MB.Save.data;
      $('gateGrid').innerHTML = MB.Gates.meta.map((m) => {
        const g = sv.gates[m.id] || { best: 0, done: [], cleared: false };
        const ready = !!m.file;
        const unlocked = ready && m.id <= sv.unlocked;
        const stars = [0, 1, 2].map((i) => `<i class="${i < (g.done || []).length ? 'on' : ''}">★</i>`).join('');
        let status = !ready ? 'Sắp ra mắt' : !unlocked ? `Hoàn thành Gate ${String(m.id - 1).padStart(2, '0')} để mở` : g.cleared ? `Đã qua · Best ${g.best.toLocaleString('vi-VN')}` : 'Sẵn sàng';
        return `<button class="gate${unlocked ? '' : ' locked'}${g.cleared ? ' cleared' : ''}" data-gate="${m.id}" style="--gc:${m.color}" ${unlocked ? '' : 'disabled'}>
          <span class="gnum">GATE ${String(m.id).padStart(2, '0')}</span>${m.has3d ? '<span class="b3d">3D</span>' : ''}
          <b>${m.name}</b><small>${m.vi}</small>
          <span class="stars">${unlocked ? stars : '🔒'}</span>
          <em>${status}</em>
          <span class="gboss">Boss: ${unlocked ? m.boss : '???'}</span>
        </button>`;
      }).join('');
      $('gateGrid').querySelectorAll('[data-gate]').forEach((b) => b.addEventListener('click', () => { MB.Audio.play('ui'); this.playGate(+b.dataset.gate); }));
      this.renderViewToggle();
      $('armoryText').textContent = 'Kho vũ khí: ' + sv.armory.map((id) => MB.Weapons.DEFS[id].name).join(' · ');
      this.show('gates');
    },

    renderViewToggle() {
      const v = MB.Save.data.settings.view || '2d';
      document.querySelectorAll('#viewToggle [data-view]').forEach((b) => b.classList.toggle('on', b.dataset.view === v));
      $('viewNote').textContent = v === '3d'
        ? 'Chế độ 3D: đẹp hơn nhưng nặng. Nếu điện thoại bị đen màn hình hoặc giật, chọn 2D (đổi được cả trong menu Tạm dừng).'
        : 'Chế độ 2D góc nhìn từ trên xuống: nhẹ, chạy tốt trên mọi máy — kể cả điện thoại.';
    },
    async prepare3D(meta) {
      this.view3d = false;
      if ((MB.Save.data.settings.view || '2d') !== '3d' || !meta.has3d) return;
      try {
        $('loadingText').textContent = 'Đang tải đồ hoạ 3D…';
        await this.loadScript('js/render3d.js');
        await MB.R3.load();
        this.view3d = true;
      } catch (err) {
        console.warn('3D không khả dụng, dùng 2D', err);
        MB.HUD.toast('Không tải được đồ hoạ 3D (cần mở qua web/server). Đang chơi bản 2D.', '#ff8a5c');
      }
    },

    loadScript(src) {
      if (loaded[src]) return loaded[src];
      loaded[src] = new Promise((res, rej) => {
        const s = document.createElement('script');
        s.src = src; s.onload = res;
        s.onerror = () => { delete loaded[src]; rej(new Error('Không tải được ' + src)); };
        document.body.appendChild(s);
      });
      return loaded[src];
    },

    async playGate(id) {
      if (this.pendingUpdate) { G.running = false; this.applyUpdate(this.pendingUpdate); return; }
      const meta = MB.Gates.meta.find((m) => m.id === id);
      if (!meta || !meta.file) { this.openGates(); return; }
      MB.Audio.unlock();
      this.show('loading');
      try {
        $('loadingText').textContent = 'Đang tải cửa ải…';
        for (const rid of meta.requires || []) { const rm = MB.Gates.meta.find((m) => m.id === rid); if (rm && rm.file) await this.loadScript(rm.file); }
        await this.loadScript(meta.file);
        await this.prepare3D(meta);
        const def = MB.Gates.defs[id];
        if (!def) throw new Error('Gate chưa đăng ký');
        this.lastGate = id;
        MB.Input.clear();
        G.start(def);
        this.show(null);
      } catch (err) {
        console.error(err);
        $('loadingText').textContent = 'Lỗi tải Gate: ' + err.message;
        setTimeout(() => this.openGates(), 1800);
      }
    },

    /* ---------- pause ---------- */
    togglePause() {
      if (!G.running || G.over) return;
      if (G.paused) this.resume(); else this.pause();
    },
    pause() {
      if (!G.running || G.paused) return;
      G.paused = true; MB.Input.clear();
      const d = G.def;
      $('pauseInfo').innerHTML = `${d.title}<br><small>Điểm ${G.score.toLocaleString('vi-VN')} · ${G.challenges.filter((c) => c.done).length}/${G.challenges.length} thử thách · PWR ${MB.Weapons.power(G.player)}</small>`;
      this.updateViewBtn();
      this.show('pause');
    },
    // đổi 2D ⇄ 3D ngay giữa trận (từ menu Tạm dừng)
    async switchView() {
      MB.Audio.play('ui');
      const to3d = !G.r3on;
      MB.Save.data.settings.view = to3d ? '3d' : '2d'; MB.Save.save(); this.renderViewToggle();
      if (to3d) {
        const meta = MB.Gates.meta.find((m) => m.id === G.def.id);
        $('btnView').textContent = 'ĐANG TẢI 3D…';
        await this.prepare3D(meta);
        if (!this.view3d || !G.set3D(true)) { this.view3d = false; MB.HUD.toast('Máy không chạy được 3D — giữ bản 2D.', '#ff8a5c'); }
      } else { this.view3d = false; G.set3D(false); }
      this.updateViewBtn();
    },
    updateViewBtn() { $('btnView').textContent = G.r3on ? 'ĐỔI SANG 2D (NHẸ HƠN)' : 'ĐỔI SANG 3D'; },
    resume() { G.paused = false; MB.Input.clear(); this.show(null); },
    quit() { G.running = false; G.paused = false; document.getElementById('game3d').classList.add('hidden'); MB.Audio.stopMusic(); this.openGates(); },

    /* ---------- cơ hội đấu lại boss ---------- */
    offerBossRetry() {
      G.paused = true; MB.Input.clear();
      const b = MB.Enemies.types[G.def.boss.type];
      $('retryInfo').innerHTML = `Bạn đã tới trận cuối với <b>${b ? b.name : 'Boss'}</b>.<br>Đấu lại ngay tại chỗ: hồi đầy máu, giáp, đạn, lựu đạn và xung kích; giữ nguyên súng, linh kiện và điểm.<br><small>Mỗi lượt chơi Gate chỉ có 1 cơ hội.</small>`;
      this.show('retry');
    },
    retryBoss() {
      MB.Audio.play('ui');
      G.retryBoss(); G.paused = false; MB.Input.clear();
      this.show(null);
    },
    giveUp() {
      MB.Audio.play('ui');
      G.retryOffer = false; G.paused = false;
      this.onGateEnd(G.summary());
    },

    /* ---------- kết thúc ---------- */
    onGateEnd(sum) {
      const sv = MB.Save.data, g = MB.Save.gate(sum.gateId);
      g.done = Array.from(new Set([...(g.done || []), ...sum.done]));
      const newBest = sum.score > g.best;
      if (newBest) g.best = sum.score;
      if (sum.win) {
        g.cleared = true;
        if (!g.bestTime || sum.time < g.bestTime) g.bestTime = sum.time;
        sv.unlocked = Math.max(sv.unlocked, sum.gateId + 1);
      }
      MB.Save.save();
      G.running = false; MB.Audio.stopMusic();
      const mm = Math.floor(sum.time / 60), ss = String(Math.floor(sum.time % 60)).padStart(2, '0');
      $('resTitle').textContent = sum.win ? (sum.gateId === 10 ? 'NHÂN LOẠI ĐÃ ĐƯỢC CỨU' : 'GATE CLEARED') : 'MISSION FAILED';
      $('resTitle').className = sum.win ? 'win' : 'lose';
      $('resStars').innerHTML = [0, 1, 2].map((i) => `<i class="${i < sum.done.length ? 'on' : ''}">★</i>`).join('');
      $('resStats').innerHTML = `
        <div><span>Điểm</span><b>${sum.score.toLocaleString('vi-VN')}${newBest ? ' <em>KỶ LỤC</em>' : ''}</b></div>
        <div><span>Thời gian</span><b>${mm}:${ss}</b></div>
        <div><span>Hạ gục</span><b>${sum.kills}</b></div>
        <div><span>Chính xác</span><b>${sum.accuracy}%</b></div>
        <div><span>Thử thách</span><b>${sum.done.length}/${sum.totalChallenges}</b></div>
        <div><span>Sức mạnh súng</span><b>PWR ${sum.mods}</b></div>`;
      const next = MB.Gates.meta.find((m) => m.id === sum.gateId + 1);
      $('btnNext').classList.toggle('hidden', !(sum.win && next && next.file));
      this.show('result');
    },

    /* ---------- settings ---------- */
    openSettings() {
      const st = MB.Save.data.settings;
      const rows = [
        ['sfx', 'Hiệu ứng âm thanh'], ['music', 'Nhạc nền'], ['shake', 'Rung màn hình'],
        ['dmgNum', 'Hiện số sát thương'],
      ];
      $('settingsList').innerHTML = rows.map(([k, label]) => `<label class="row"><span>${label}</span><input type="checkbox" data-set="${k}" ${st[k] ? 'checked' : ''}></label>`).join('') +
        `<label class="row"><span>Đồ hoạ</span><select data-set="quality">
          <option value="auto"${st.quality === 'auto' ? ' selected' : ''}>Tự động</option>
          <option value="high"${st.quality === 'high' ? ' selected' : ''}>Cao</option>
          <option value="low"${st.quality === 'low' ? ' selected' : ''}>Thấp (máy yếu)</option></select></label>
        <label class="row"><span>Ngắm trên điện thoại / tay cầm</span><select data-set="aimMode">
          <option value="auto"${st.aimMode === 'auto' ? ' selected' : ''}>Tự động (tự khoá + tự bắn)</option>
          <option value="assist"${st.aimMode === 'assist' ? ' selected' : ''}>Hỗ trợ (hút nhẹ về quái)</option>
          <option value="manual"${st.aimMode === 'manual' ? ' selected' : ''}>Thủ công</option></select></label>
        <label class="row"><span>Tốc độ xoay người khi ngắm</span><select data-set="aimSpeed">
          <option value="slow"${st.aimSpeed === 'slow' ? ' selected' : ''}>Chậm (dễ ngắm)</option>
          <option value="normal"${st.aimSpeed === 'normal' || !st.aimSpeed ? ' selected' : ''}>Vừa</option>
          <option value="fast"${st.aimSpeed === 'fast' ? ' selected' : ''}>Nhanh</option></select></label>
        <label class="row"><span>Góc nhìn</span><select data-set="view">
          <option value="2d"${st.view !== '3d' ? ' selected' : ''}>2D từ trên xuống</option>
          <option value="3d"${st.view === '3d' ? ' selected' : ''}>3D (thử nghiệm)</option></select></label>`;
      $('settingsList').querySelectorAll('[data-set]').forEach((el) => el.addEventListener('change', () => {
        const k = el.dataset.set;
        st[k] = el.type === 'checkbox' ? el.checked : el.value;
        if (k === 'sfx' || k === 'music') MB.Audio.set(k, st[k]);
        if (k === 'quality') G.resize();
        MB.Save.save();
      }));
      $('btnReset').textContent = 'Xoá tiến trình'; delete $('btnReset').dataset.confirm;
      this.show('settings');
    },

    /* ---------- vòng lặp ---------- */
    loop() {
      let last = performance.now();
      const frame = (t) => {
        let dt = Math.min(0.05, (t - last) / 1000); last = t;
        if (G.running && !G.paused) {
          const steps = dt > 0.022 ? 2 : 1;
          for (let i = 0; i < steps; i++) G.update(dt / steps);
        }
        if (G.running) G.draw();
        requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    },

    onResize() {
      G.resize();
      const cs = getComputedStyle(document.documentElement);
      G.safeT = parseInt(cs.getPropertyValue('--sat')) || 0;
      G.safeR = parseInt(cs.getPropertyValue('--sar')) || 0;
      document.documentElement.style.setProperty('--mmw', G.mmW + 'px');
      const portrait = innerHeight > innerWidth && MB.U.isTouchDevice();
      $('rotateHint').classList.toggle('hidden', !portrait);
    },
    onInputMode(m) {
      $('touchUI').classList.toggle('hidden', !(G.running && this.current === null));
      void m;
    },

    fullscreen() {
      const el = document.documentElement;
      const req = el.requestFullscreen || el.webkitRequestFullscreen;
      if (req) {
        Promise.resolve(req.call(el)).then(() => {
          if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => {});
        }).catch(() => {});
      }
    },

    pwa() {
      let deferred = null;
      addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e; $('btnInstall').classList.remove('hidden'); });
      $('btnInstall').addEventListener('click', async () => {
        if (!deferred) return;
        deferred.prompt(); await deferred.userChoice; deferred = null; $('btnInstall').classList.add('hidden');
      });
      const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
      const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
      if (isIOS && !standalone) $('iosHint').classList.remove('hidden');
      const host = location.hostname;
      const sandboxed = host.endsWith('claude.ai') || host.includes('claudeusercontent') || host.includes('anthropic');
      if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol) && !sandboxed) {
        navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then((r) => { this.swReg = r; }).catch(() => {});
      }
      // Tự cập nhật: app cài ra màn hình chính thường chỉ "ngủ" rồi mở lại trang cũ, không tải lại.
      // Mỗi lần app quay lại / mở menu / mỗi 5 phút: hỏi version.json trên server, khác bản đang chạy thì tải lại.
      if (/^https?:$/.test(location.protocol) && !sandboxed) {
        this.checkUpdate();
        document.addEventListener('visibilitychange', () => { if (!document.hidden) this.checkUpdate(); });
        addEventListener('pageshow', (e) => { if (e.persisted) this.checkUpdate(); });
        setInterval(() => this.checkUpdate(), 5 * 60 * 1000);
      }
    },

    async checkUpdate() {
      try {
        const r = await fetch('version.json?t=' + Date.now(), { cache: 'no-store' });
        if (!r.ok) return;
        const v = (await r.json()).version;
        if (!this.runVersion) { this.runVersion = v; return; }
        if (v && v !== this.runVersion) this.applyUpdate(v);
      } catch (e) { /* offline: chơi tiếp bản cũ */ }
    },
    async applyUpdate(v) {
      const inGame = G.running && !G.over && this.current !== 'gates' && this.current !== 'menu';
      if (inGame) {
        // đang đánh dở: không cắt ngang, chờ về menu / chọn Gate mới tải lại
        if (!this.pendingUpdate) MB.HUD.toast('Có bản mới v' + v + ' — sẽ tự cập nhật khi bạn về menu.', '#7ef3ff');
        this.pendingUpdate = v; return;
      }
      if (this.updating) return; this.updating = true;
      $('loadingText').textContent = 'Đang cập nhật lên bản v' + v + '…'; this.show('loading');
      try { if (this.swReg) await this.swReg.update(); } catch (e) { /* bỏ qua */ }
      try { const keys = await caches.keys(); await Promise.all(keys.map((k) => caches.delete(k))); } catch (e) { /* bỏ qua */ }
      location.reload();
    },
  };

  addEventListener('DOMContentLoaded', () => App.init());
})(window.MB);
