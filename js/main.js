/* Monster Breakout — app shell: màn hình menu, chọn Gate, tải file Gate theo yêu cầu, vòng lặp game */
'use strict';
(function (MB) {
  const $ = (id) => document.getElementById(id);
  const G = MB.G;
  const SCREENS = ['menu', 'gates', 'help', 'settings', 'pause', 'result', 'retry', 'perks', 'shop', 'account', 'board', 'dossier', 'loading'];
  const MENU_SCREENS = ['menu', 'gates', 'help', 'settings', 'shop', 'account', 'board', 'dossier', 'result'];
  const esc = (t) => String(t == null ? '' : t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const safeImg = (u) => (/^https:\/\//.test(u || '') ? esc(u) : '');
  const loaded = {};

  const App = MB.App = {
    current: 'menu',
    mode: 'campaign',
    lastGate: null,

    init() {
      MB.Save.load();
      const st = MB.Save.data.settings;
      MB.Audio.set('sfx', st.sfx); MB.Audio.set('music', st.music); MB.Audio.setMute(st.mute);
      if (new URLSearchParams(location.search).get('unlock') === 'all') { MB.Save.data.unlocked = 99; }
      G.init($('game'));
      MB.HUD.init();
      MB.Input.init($('input'));
      MB.Audio.bindUnlock();
      if (MB.U.isTouchDevice()) MB.Input.setMode('touch');
      this.bind();
      this.onResize();
      addEventListener('resize', () => this.onResize());
      addEventListener('orientationchange', () => setTimeout(() => this.onResize(), 200));
      document.addEventListener('visibilitychange', () => { if (document.hidden && G.running && !G.over) this.pause(); });
      this.show('menu');
      this.loop();
      this.pwa();
      MB.Cloud.init();
    },

    bind() {
      const on = (id, fn) => { const el = $(id); if (el) el.addEventListener('click', () => { MB.Audio.unlock(); MB.Audio.play('ui'); fn(); }); };
      on('btnPlay', () => this.openGates());
      on('btnHelp', () => this.show('help'));
      on('btnDossier', () => this.openDossier());
      on('btnSettings', () => this.openSettings());
      on('btnFull', () => this.fullscreen());
      document.querySelectorAll('#viewToggle [data-view]').forEach((b) => b.addEventListener('click', () => {
        MB.Audio.play('ui'); MB.Save.data.settings.view = b.dataset.view; MB.Save.save(); this.renderViewToggle();
      }));
      document.querySelectorAll('[data-back]').forEach((b) => b.addEventListener('click', () => { MB.Audio.play('ui'); if (b.dataset.back === 'gates') this.openGates(); else this.show(b.dataset.back); }));
      on('btnResume', () => this.resume());
      on('btnRestart', () => (this.endlessRun ? this.startEndless() : this.playGate(this.lastGate)));
      on('btnView', () => this.switchView());
      on('btnRetryBoss', () => this.retryBoss());
      on('btnShop', () => this.openShop());
      on('btnAccount', () => this.openAccount());
      on('btnBoard', () => this.openBoard());
      document.querySelectorAll('#boardMode [data-bmode]').forEach((b) => b.addEventListener('click', () => { MB.Audio.play('ui'); this.openBoard(this.boardGate, b.dataset.bmode); }));
      on('btnResShop', () => { G.running = false; this.openShop(); });
      document.querySelectorAll('#actToggle [data-actn]').forEach((b) => b.addEventListener('click', () => {
        MB.Audio.play('ui'); this.act = +b.dataset.actn; this.openGates();
      }));
      on('btnReplay', () => MB.Story.play('act2', () => this.openGates()));
      document.querySelectorAll('#modeToggle [data-mode]').forEach((b) => b.addEventListener('click', () => {
        MB.Audio.play('ui'); this.mode = b.dataset.mode; this.openGates();
      }));
      // nút loa: bật / tắt toàn bộ âm thanh (dùng được cả ở menu lẫn trong trận)
      const snd = $('soundBtn');
      snd.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); this.toggleMute(); }, { passive: false });
      addEventListener('keydown', (e) => { if (e.code === 'KeyM' && !/INPUT|TEXTAREA/.test(document.activeElement && document.activeElement.tagName)) this.toggleMute(); });
      this.renderSound();
      // nút đổi chế độ ngắm ngay trên màn hình (cảm ứng và máy tính, mỗi loại lưu riêng): TỰ ĐỘNG → HỖ TRỢ → TAY/CHUỘT
      $('aimBtn').addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); this.cycleAim(); }, { passive: false });
      addEventListener('keydown', (e) => { if (e.code === 'KeyT' && !e.repeat && G.running && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement && document.activeElement.tagName)) this.cycleAim(); });
      this.updateAimBtn();
      on('btnGiveUp', () => this.giveUp());
      on('btnQuit', () => this.quit());
      on('btnAgain', () => (this.endlessRun || (this.mode === 'survival' && this.lastEndless) ? this.startEndless() : this.playGate(this.lastGate)));
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
      // nhạc chủ đề hồi hộp ở các màn menu; vào trận thì nhường cho nhạc trận
      MB.Audio.menuTheme(MENU_SCREENS.includes(name));
      for (const s of SCREENS) $(s).classList.toggle('hidden', s !== name);
      const inGame = G.running && (name === null);
      $('hud').classList.toggle('hidden', !G.running || name === 'menu' || name === 'gates');
      $('touchUI').classList.toggle('hidden', !inGame);
      document.body.classList.toggle('playing', inGame);
    },

    /* ---------- chọn Gate ---------- */
    openGates() {
      if (this.pendingUpdate) { G.running = false; this.applyUpdate(this.pendingUpdate); return; }
      const sv = MB.Save.data, surv = this.mode === 'survival';
      if (!this.act) this.act = sv.unlocked >= 11 && sv.unlocked < 99 ? 2 : 1;
      document.querySelectorAll('#actToggle [data-actn]').forEach((b) => b.classList.toggle('on', +b.dataset.actn === this.act));
      const nClue = Object.keys(sv.clues || {}).length;
      $('actNote').innerHTML = this.act === 2
        ? `<b>MÀN 2 · NGUỒN GỐC</b> — lần theo manh mối của Giáo sư Ted khắp Việt Nam. Manh mối đã tìm: <b>${nClue}/10</b>`
        : '<b>MÀN 1 · BÙNG PHÁT</b> — 10 cửa ải bị virus chiếm đóng.';
      $('btnReplay').classList.toggle('hidden', !(this.act === 2 && MB.Story.seen('act2')));
      document.querySelectorAll('#modeToggle [data-mode]').forEach((b) => b.classList.toggle('on', b.dataset.mode === (surv ? 'survival' : 'campaign')));
      $('coinText').textContent = (sv.coins || 0).toLocaleString('vi-VN');
      $('actToggle').classList.toggle('hidden', surv);
      $('gateGrid').classList.toggle('endless-wrap', surv);
      if (surv) {
        const chain = this.endlessChain(), rec = sv.endless;
        $('actNote').innerHTML = '<b>SINH TỒN BẤT TẬN</b> — một chuỗi chiến đấu không ngừng xuyên qua mọi khu vực bạn đã giải phóng.';
        $('btnReplay').classList.add('hidden');
        $('gateGrid').innerHTML = chain.length ? `<div class="endless">
            <div class="etop"><div><b>BẤT TẬN</b><span>${rec ? `Kỷ lục: <em>Wave ${rec.wave}</em> · khu vực ${rec.stage} · ${rec.score.toLocaleString('vi-VN')} điểm` : 'Chưa có kỷ lục — hãy là người mở màn.'}</span></div>
              <button id="btnEndless" class="primary">BẮT ĐẦU ▸</button></div>
            <p class="hint">Mỗi khu vực: 4 wave + 1 boss. Hạ boss → hồi 25% máu, chọn thẻ nâng cấp rồi tiến sang khu vực kế tiếp. Máu, súng, linh kiện, thẻ nâng cấp được giữ suốt chuỗi. Hết các khu vực thì quay vòng với quái mạnh hơn. Không có đấu lại boss.</p>
            <div class="echain">${chain.map((id, i) => { const m = MB.Gates.meta.find((q) => q.id === id); return `<span style="--gc:${m.color}"><i>${i + 1}</i>${m.name}</span>`; }).join('<b>›</b>')}<b>↻</b></div>
          </div>` : '<p class="hint">Qua Gate 01 ở Chiến dịch để mở chế độ Sinh tồn Bất tận.</p>';
        const be = $('btnEndless'); if (be) be.addEventListener('click', () => { MB.Audio.play('ui'); this.startEndless(); });
        this.renderViewToggle();
        $('armoryText').textContent = 'Kho vũ khí: ' + sv.armory.map((id) => MB.Weapons.DEFS[id].name).join(' · ');
        this.show('gates');
        return;
      }
      $('gateGrid').innerHTML = MB.Gates.meta.filter((m) => (m.act || 1) === this.act).map((m) => {
        const g = sv.gates[m.id] || { best: 0, done: [], cleared: false };
        const ready = !!m.file;
        const unlocked = ready && (surv ? !!g.cleared : m.id <= sv.unlocked);
        const stars = [0, 1, 2].map((i) => `<i class="${i < (g.done || []).length ? 'on' : ''}">★</i>`).join('');
        let status = !ready ? (m.act === 2 ? 'Sắp ra mắt · Màn 2' : 'Sắp ra mắt') : !unlocked ? (surv ? 'Qua Gate này ở Chiến dịch để mở' : `Hoàn thành Gate ${String(m.id - 1).padStart(2, '0')} để mở`) : g.cleared ? `Đã qua · Best ${g.best.toLocaleString('vi-VN')}` : 'Sẵn sàng';
        if (surv && unlocked) status = g.surv ? `Kỷ lục: Wave ${g.surv.wave} · ${g.surv.score.toLocaleString('vi-VN')}` : 'Chưa có kỷ lục';
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

    /* ---------- Sinh tồn Bất tận: 1 chuỗi qua mọi khu vực đã giải phóng ---------- */
    endlessChain() {
      const gs = MB.Save.data.gates;
      return MB.Gates.meta.filter((m) => m.file && gs[m.id] && gs[m.id].cleared).map((m) => m.id);
    },
    startEndless() {
      const chain = this.endlessChain(); if (!chain.length) return;
      this.mode = 'survival'; this.endlessRun = { chain, i: 0 };
      this.playGate(chain[0], { endless: true });
    },
    async endlessAdvance() {
      const run = this.endlessRun; if (!run) return;
      run.i = (run.i + 1) % run.chain.length;
      const id = run.chain[run.i], meta = MB.Gates.meta.find((m) => m.id === id), carry = G.carry();
      G.paused = true;
      $('loadingText').textContent = `Tiến vào khu vực ${carry.stage}: ${meta.name} — ${meta.vi}…`; this.show('loading');
      try {
        for (const rid of meta.requires || []) { const rm = MB.Gates.meta.find((m) => m.id === rid); if (rm && rm.file) await this.loadScript(rm.file); }
        await this.loadScript(meta.file); await this.prepare3D(meta);
        this.lastGate = id; MB.Input.clear();
        G.start(MB.Gates.defs[id], { mode: 'survival', endless: true, carry });
        G.banner(`KHU VỰC ${carry.stage}`, `${meta.name} · ${meta.vi}`, 2.6);
        this.updateAimBtn(); this.show(null);
      } catch (err) { console.error(err); G.paused = false; G.finish(false, 0.1); }
    },

    async playGate(id, opts) {
      opts = opts || {};
      if (!opts.endless) this.endlessRun = null;
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
        G.start(def, { mode: this.mode, endless: !!opts.endless });
        this.updateAimBtn();
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
    quit() { MB.Story.clearSay(); G.running = false; G.paused = false; document.getElementById('game3d').classList.add('hidden'); MB.Audio.stopMusic(); this.openGates(); },

    toggleMute() {
      const st = MB.Save.data.settings;
      st.mute = !st.mute; MB.Save.save();
      MB.Audio.unlock(); MB.Audio.setMute(st.mute);
      if (!st.mute) MB.Audio.play('ui');
      this.renderSound();
      MB.HUD.toast(st.mute ? '🔇 Đã tắt âm thanh' : '🔊 Đã bật âm thanh', '#7ef3ff');
    },
    renderSound() {
      const m = MB.Save.data.settings.mute, b = $('soundBtn');
      b.classList.toggle('off', !!m);
      b.innerHTML = m
        ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16.5 9.5l5 5M21.5 9.5l-5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>'
        : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>';
    },
    openDossier() {
      const sv = MB.Save.data, gs = sv.gates || {};
      const cleared = Object.keys(gs).filter((k) => gs[k] && gs[k].cleared).length;
      const best = Object.values(gs).reduce((a, g) => a + ((g && g.best) || 0), 0);
      const upg = MB.Shop.SHOP.map((it) => `${it.name} ${MB.Shop.level(it.id)}/${it.max}`).join(' · ');
      const en = sv.endless || {};
      const rows = [
        ['Cửa đã qua', `${cleared} / ${MB.Gates.meta.filter((m) => m.file).length}`],
        ['Tổng điểm cao nhất', best.toLocaleString('vi-VN')],
        ['Sinh tồn Bất tận', en.wave ? `Wave ${en.wave} · ${(en.score || 0).toLocaleString('vi-VN')} điểm` : 'Chưa chơi'],
        ['Kho súng', (sv.armory || []).map((id) => (MB.Weapons.DEFS[id] || {}).short || id).join(', ') || 'AR-7'],
        ['Nâng cấp', upg],
        ['Xu', (sv.coins || 0).toLocaleString('vi-VN')],
      ];
      $('dosStats').innerHTML = rows.map(([a, b]) => `<tr><td>${a}</td><td>${b}</td></tr>`).join('');
      this.show('dossier');
    },
    aimKey() { return MB.Input.mode === 'kb' ? 'aimModeKb' : 'aimMode'; },
    aimNow() { const st = MB.Save.data.settings, k = this.aimKey(); return st[k] || (k === 'aimModeKb' ? 'manual' : 'auto'); },
    cycleAim() {
      const st = MB.Save.data.settings, k = this.aimKey(), kb = k === 'aimModeKb';
      const order = kb ? ['manual', 'assist', 'auto'] : ['auto', 'assist', 'manual'];
      st[k] = order[(order.indexOf(this.aimNow()) + 1) % 3]; MB.Save.save();
      MB.Audio.play('ui'); this.updateAimBtn();
      const msg = kb
        ? { manual: 'Ngắm CHUỘT: súng theo con trỏ, giữ chuột trái để bắn.', assist: 'Ngắm HỖ TRỢ: súng theo chuột nhưng nắn nhẹ về phía quái gần con trỏ.', auto: 'Ngắm TỰ ĐỘNG: tự khoá và tự bắn quái gần nhất. Giữ chuột trái để bắn theo chuột.' }
        : { auto: 'Ngắm TỰ ĐỘNG: tự khoá và tự bắn quái gần nhất.', assist: 'Ngắm HỖ TRỢ: bạn tự ngắm, game nắn nhẹ về phía quái.', manual: 'Ngắm TAY: tự ngắm hoàn toàn. Chạm bên phải để bắn vào điểm chạm.' };
      MB.HUD.toast(msg[st[k]], '#7ef3ff');
    },
    updateAimBtn() {
      const m = this.aimNow(), kb = this.aimKey() === 'aimModeKb';
      $('aimBtn').innerHTML = 'NGẮM <b>' + ({ auto: 'TỰ ĐỘNG', assist: 'HỖ TRỢ', manual: kb ? 'CHUỘT' : 'TAY' }[m]) + '</b>';
      $('aimBtn').dataset.mode = m;
    },

    /* ---------- thẻ nâng cấp sau wave ---------- */
    // siêu chiêu: chọn 1 trong 3 khi boss xuất hiện
    offerSuper() {
      const p = G.player, T = MB.Super.TYPES, ids = Object.keys(T);
      G.paused = true; MB.Input.clear();
      $('perkTitle').textContent = 'CHỌN SIÊU CHIÊU';
      $('perkHint').textContent = 'Tung khi thanh NỘ đầy (nút SIÊU / phím X) · nộ tăng khi gây sát thương và hạ quái';
      $('perkList').innerHTML = ids.map((id, i) => `<button class="perk sup${p.superType === id ? ' last' : ''}" data-sup="${id}"><i>${T[id].icon}</i><b>${T[id].name}</b><span>${T[id].desc}</span>
        <em>${p.superType === id ? 'Lần trước' : 'Siêu chiêu'}</em><kbd>${i + 1}</kbd></button>`).join('');
      const pick = (id) => {
        removeEventListener('keydown', key, true);
        p.superType = id; MB.Audio.play('mod'); MB.haptic(20);
        G.paused = false; MB.Input.clear(); this.show(null);
        MB.HUD.toast(`${T[id].icon} <b>${T[id].name}</b> · ${(p.rage || 0) >= 100 ? 'nộ đã đầy, tung ngay được!' : 'tung khi thanh nộ đầy'}`, '#ffd56a');
      };
      const key = (e) => { const n = +e.key; if (n >= 1 && n <= ids.length) { e.preventDefault(); e.stopPropagation(); pick(ids[n - 1]); } };
      addEventListener('keydown', key, true);
      $('perkList').querySelectorAll('[data-sup]').forEach((b) => b.addEventListener('click', () => pick(b.dataset.sup)));
      this.show('perks');
    },
    offerPerks() {
      const p = G.player, cards = MB.Perks.roll(p);
      if (!cards.length) return;
      G.paused = true; MB.Input.clear();
      $('perkTitle').textContent = 'CHỌN NÂNG CẤP'; $('perkHint').textContent = 'Hiệu lực đến hết trận này';
      $('perkList').innerHTML = cards.map((k, i) => `<button class="perk" data-perk="${k.id}"><i>${k.icon}</i><b>${k.name}</b><span>${k.desc}</span>
        <em>${(p.perks[k.id] || 0) ? 'Cấp ' + (p.perks[k.id] + 1) : 'Mới'}</em><kbd>${i + 1}</kbd></button>`).join('');
      const pick = (id) => {
        removeEventListener('keydown', key, true);
        MB.Perks.take(p, id); MB.Audio.play('pickup'); MB.haptic(20);
        G.paused = false; MB.Input.clear(); this.show(null);
        const k = MB.Perks.PERKS.find((x) => x.id === id);
        MB.HUD.toast(`${k.icon} ${k.name}: ${k.desc}`, '#d7ff9f');
      };
      const key = (e) => { const n = +e.key; if (n >= 1 && n <= cards.length) { e.preventDefault(); e.stopPropagation(); pick(cards[n - 1].id); } };
      addEventListener('keydown', key, true);
      $('perkList').querySelectorAll('[data-perk]').forEach((b) => b.addEventListener('click', () => pick(b.dataset.perk)));
      this.show('perks');
    },

    /* ---------- cửa hàng ---------- */
    openShop() {
      const sv = MB.Save.data;
      $('shopCoins').textContent = (sv.coins || 0).toLocaleString('vi-VN');
      $('shopList').innerHTML = MB.Shop.SHOP.map((it) => {
        const l = MB.Shop.level(it.id), maxed = l >= it.max, c = MB.Shop.cost(it, l);
        const pips = Array.from({ length: it.max }, (_, i) => `<i class="${i < l ? 'on' : ''}"></i>`).join('');
        return `<div class="item"><i class="ic">${it.icon}</i><div><b>${it.name}</b><span>${it.desc(l)}</span><div class="pips">${pips}</div></div>
          <button data-buy="${it.id}" class="${maxed ? 'ghost' : 'primary'} sm" ${maxed || (sv.coins || 0) < c ? 'disabled' : ''}>${maxed ? 'TỐI ĐA' : c.toLocaleString('vi-VN') + ' xu'}</button></div>`;
      }).join('');
      $('shopList').querySelectorAll('[data-buy]').forEach((b) => b.addEventListener('click', () => {
        if (MB.Shop.buy(b.dataset.buy)) { MB.Audio.play('pickup'); MB.Cloud.push(); this.openShop(); }
      }));
      // kho súng: mua súng mới bằng xu
      const W = MB.Weapons;
      $('gunList').innerHTML = MB.Boss.GUNS.map((g) => {
        const d = W.DEFS[g.id], owned = sv.armory.includes(g.id), open = (sv.unlocked || 1) >= g.gate - 2;
        const label = owned ? 'ĐÃ CÓ' : !open ? `Mở bán ở Gate ${g.gate - 2}` : g.price.toLocaleString('vi-VN') + ' xu';
        const dis = owned || !open || (sv.coins || 0) < g.price;
        return `<div class="item gun"><canvas class="gunic" data-gun="${g.id}" width="96" height="48"></canvas><div><b>${d.name}</b><span>${d.desc}</span><span class="gfree">Miễn phí khi hạ boss Gate ${g.gate}</span></div>
          <button data-gun-buy="${g.id}" class="${owned ? 'ghost' : 'primary'} sm" ${dis ? 'disabled' : ''}>${label}</button></div>`;
      }).join('');
      $('gunList').querySelectorAll('canvas[data-gun]').forEach((cv) => {
        const c = cv.getContext('2d'); c.translate(14, 24); c.scale(1.7, 1.7); W.drawGun(c, cv.dataset.gun, 0, 0);
      });
      $('gunList').querySelectorAll('[data-gun-buy]').forEach((b) => b.addEventListener('click', () => {
        if (MB.Shop.buyGun(b.dataset.gunBuy)) { MB.Audio.play('weapon'); MB.Cloud.push(); this.openShop(); MB.HUD.toast(`Đã mua <b>${W.DEFS[b.dataset.gunBuy].name}</b> · có trong mọi trận`, '#ffd56a'); }
      }));
      this.show('shop');
    },

    /* ---------- tài khoản (Google) ---------- */
    renderAccount() {
      const C = MB.Cloud, u = C.user, chip = $('acctChip'), hint = $('acctHint');
      if (!chip) return;
      const t = C.lastSync ? new Date(C.lastSync).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '';
      if (!u) {
        chip.innerHTML = C.status === 'loading' ? 'ĐANG KẾT NỐI…' : '<b class="g">G</b> ĐĂNG NHẬP LƯU TIẾN TRÌNH';
        hint.textContent = 'Không cần đăng nhập vẫn chơi được. Đăng nhập Google để giữ tiến trình trên mọi máy và có tên trên bảng xếp hạng.';
      } else {
        const av = safeImg(C.avatar());
        chip.innerHTML = (av ? `<img src="${av}" alt="" referrerpolicy="no-referrer">` : '👤 ') + esc(C.name().split(' ').slice(-1)[0]);
        hint.textContent = C.status === 'syncing' ? 'Đang đồng bộ tiến trình…' : C.status === 'error' ? 'Chưa đồng bộ được (mất mạng?). Tiến trình vẫn lưu trên máy.' : `Đã đồng bộ tiến trình${t ? ' lúc ' + t : ''}.`;
      }
      $('btnAccount').classList.toggle('in', !!u);
      if (this.current === 'account') this.openAccount(true);
    },
    openAccount(keep) {
      const C = MB.Cloud, u = C.user;
      if (!keep) MB.Audio.play('ui');
      const t = C.lastSync ? new Date(C.lastSync).toLocaleString('vi-VN') : 'chưa';
      $('acctBody').innerHTML = u ? `
        <div class="who">${safeImg(C.avatar()) ? `<img src="${safeImg(C.avatar())}" alt="" referrerpolicy="no-referrer">` : '<i>👤</i>'}<div><b>${esc(C.name())}</b><span>${esc(u.email || '')}</span></div></div>
        <p class="hint">${C.status === 'syncing' ? 'Đang đồng bộ…' : C.status === 'error' ? 'Lỗi đồng bộ: ' + esc(C.error) : 'Đồng bộ gần nhất: ' + t}</p>
        <ul class="perks-list"><li>Tiến trình, xu và nâng cấp được lưu trên mạng — đổi máy vẫn chơi tiếp.</li><li>Thành tích tự gửi lên bảng xếp hạng sau mỗi trận.</li></ul>
        <div class="btns"><button id="btnSync" class="primary">ĐỒNG BỘ NGAY</button><button id="btnLogout">ĐĂNG XUẤT</button></div>`
        : `
        <p>Game chơi được ngay, <b>không bắt buộc đăng nhập</b>. Tiến trình hiện lưu trên máy này.</p>
        <ul class="perks-list"><li><b>Lưu tiến trình trên mạng:</b> đổi điện thoại, xoá dữ liệu trình duyệt vẫn không mất gate, xu, nâng cấp.</li>
        <li><b>Chơi tiếp trên máy khác</b> chỉ cần đăng nhập cùng tài khoản.</li><li><b>Có tên trên bảng xếp hạng</b> từng Gate và chế độ Sinh tồn.</li></ul>
        <p class="hint">Tiến trình đang có trên máy này sẽ được gộp vào tài khoản ngay khi đăng nhập.</p>
        <div class="btns"><button id="btnGoogle" class="google"><b class="g">G</b> ĐĂNG NHẬP BẰNG GOOGLE</button></div>
        ${C.status === 'loading' ? '<p class="hint">Đang chuyển sang trang Google…</p>' : ''}${C.error && !u ? `<p class="hint err">${esc(C.error)}</p>` : ''}`;
      const b = (id, f) => { const el = $(id); if (el) el.addEventListener('click', f); };
      b('btnGoogle', () => { MB.Audio.play('ui'); C.signIn(); });
      b('btnSync', () => { MB.Audio.play('ui'); C.sync(); });
      b('btnLogout', () => { MB.Audio.play('ui'); C.signOut(); });
      if (!keep) this.show('account');
    },

    /* ---------- bảng xếp hạng ---------- */
    async openBoard(gate, mode) {
      gate = gate || this.boardGate || 1; mode = mode || this.boardMode || 'campaign';
      this.boardGate = gate; this.boardMode = mode;
      document.querySelectorAll('#boardMode [data-bmode]').forEach((b) => b.classList.toggle('on', b.dataset.bmode === mode));
      if (mode === 'survival') gate = 30;
      $('boardGates').classList.toggle('hidden', mode === 'survival');
      $('boardGates').innerHTML = MB.Gates.meta.filter((m) => m.file).map((m) => `<button data-bg="${m.id}" class="${m.id === gate ? 'on' : ''}" style="--gc:${m.color}">${String(m.id).padStart(2, '0')}<small>${esc(m.name)}</small></button>`).join('');
      $('boardGates').querySelectorAll('[data-bg]').forEach((b) => b.addEventListener('click', () => { MB.Audio.play('ui'); this.openBoard(+b.dataset.bg, this.boardMode); }));
      $('boardList').innerHTML = '<p class="hint">Đang tải…</p>';
      $('boardNote').textContent = MB.Cloud.user ? '' : 'Bạn đang chơi khách — đăng nhập Google (ở Menu → nút đăng nhập) để có tên trên bảng xếp hạng.';
      this.show('board');
      const req = (this.boardReq = (this.boardReq || 0) + 1);
      try {
        const rows = await MB.Cloud.leaderboard(gate, mode);
        if (req !== this.boardReq) return;
        const me = MB.Cloud.user && MB.Cloud.user.id;
        $('boardList').innerHTML = rows.length ? rows.map((r, i) => {
          const mm = Math.floor(r.time_s / 60), ss = String(Math.floor(r.time_s % 60)).padStart(2, '0');
          const av = safeImg(r.avatar);
          return `<div class="brow${r.user_id === me ? ' me' : ''}"><span class="rk">${i + 1}</span>${av ? `<img src="${av}" alt="" referrerpolicy="no-referrer">` : '<i>👤</i>'}
            <b>${esc(r.name)}</b><span class="sc">${mode === 'survival' ? 'Wave ' + r.wave + ' · ' : ''}${r.score.toLocaleString('vi-VN')}</span>${mode === 'campaign' ? `<span class="tm">${mm}:${ss}</span>` : ''}</div>`;
        }).join('') : '<p class="hint">Chưa có ai trên bảng này. Hãy là người đầu tiên!</p>';
      } catch (e) {
        if (req === this.boardReq) $('boardList').innerHTML = '<p class="hint err">Không tải được bảng xếp hạng (kiểm tra mạng).</p>';
      }
    },

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
    onGateEnd(sum, afterStory) {
      MB.Story.clearSay();
      // thắng Gate 10 lần đầu → cảnh chuyển sang Màn 2
      if (!afterStory && sum.gateId === 10 && sum.win && sum.mode !== 'survival' && !MB.Story.seen('act2')) {
        G.running = false; MB.Audio.stopMusic();
        MB.Story.play('act2', () => { this.act = 2; this.onGateEnd(sum, true); });
        return;
      }
      const sv = MB.Save.data, g = MB.Save.gate(sum.gateId), surv = sum.mode === 'survival';
      MB.Skill.record(sum);
      this.lastEndless = !!sum.endless;
      g.done = Array.from(new Set([...(g.done || []), ...sum.done]));
      let newBest;
      if (surv && sum.endless) {
        const e = sv.endless;
        newBest = !e || sum.wave > e.wave || (sum.wave === e.wave && sum.score > e.score);
        if (newBest) sv.endless = { wave: sum.wave, score: sum.score, stage: sum.stage };
      } else if (surv) {
        newBest = !g.surv || sum.wave > g.surv.wave || (sum.wave === g.surv.wave && sum.score > g.surv.score);
        if (newBest) g.surv = { wave: sum.wave, score: sum.score };
      } else { newBest = sum.score > g.best; if (newBest) g.best = sum.score; }
      const coins = MB.Shop.earn(sum);
      sv.coins = (sv.coins || 0) + coins; sv.ts = Date.now();
      MB.Cloud.submit(sum); MB.Cloud.push();
      if (sum.win && !surv) {
        g.cleared = true;
        if (!g.bestTime || sum.time < g.bestTime) g.bestTime = sum.time;
        sv.unlocked = Math.max(sv.unlocked, sum.gateId + 1);
      }
      MB.Save.save();
      G.running = false; MB.Audio.stopMusic();
      const mm = Math.floor(sum.time / 60), ss = String(Math.floor(sum.time % 60)).padStart(2, '0');
      $('resTitle').textContent = surv ? (sum.endless ? `BẤT TẬN · WAVE ${sum.wave} · KHU VỰC ${sum.stage}` : `SINH TỒN · WAVE ${sum.wave}`) : sum.win ? (sum.gateId === 10 ? 'NHÂN LOẠI ĐÃ ĐƯỢC CỨU' : 'GATE CLEARED') : 'MISSION FAILED';
      $('resTitle').className = sum.win || surv ? 'win' : 'lose';
      $('resCoins').innerHTML = `+${coins.toLocaleString('vi-VN')} xu · tổng ${sv.coins.toLocaleString('vi-VN')} xu` + (sum.comboBest >= 5 ? ` · combo cao nhất ×${sum.comboBest}` : '');
      $('resStars').innerHTML = [0, 1, 2].map((i) => `<i class="${i < sum.done.length ? 'on' : ''}">★</i>`).join('');
      $('resStats').innerHTML = `
        <div><span>${surv ? 'Wave · điểm' : 'Điểm'}</span><b>${surv ? sum.wave + ' · ' : ''}${sum.score.toLocaleString('vi-VN')}${newBest ? ' <em>KỶ LỤC</em>' : ''}</b></div>
        <div><span>Thời gian</span><b>${mm}:${ss}</b></div>
        <div><span>Hạ gục</span><b>${sum.kills}</b></div>
        <div><span>Chính xác</span><b>${sum.accuracy}%</b></div>
        <div><span>Thử thách</span><b>${sum.done.length}/${sum.totalChallenges}</b></div>
        <div><span>Sức mạnh súng</span><b>PWR ${sum.mods}</b></div>`;
      $('resCloud').innerHTML = MB.Cloud.user ? '' : 'Bạn đang chơi khách · <button id="btnResLogin" class="sm google"><b class="g">G</b> Đăng nhập để lưu tiến trình & lên bảng xếp hạng</button>';
      const rl = $('btnResLogin'); if (rl) rl.addEventListener('click', () => { G.running = false; this.openAccount(); });
      const next = MB.Gates.meta.find((m) => m.id === sum.gateId + 1);
      $('btnNext').classList.toggle('hidden', !(sum.win && !surv && next && next.file));
      this.show('result');
    },

    /* ---------- settings ---------- */
    openSettings() {
      const st = MB.Save.data.settings;
      const rows = [
        ['sfx', 'Hiệu ứng âm thanh'], ['music', 'Nhạc nền'], ['shake', 'Rung màn hình'],
        ['dmgNum', 'Hiện số sát thương'], ['vibrate', 'Rung điện thoại'],
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
        <label class="row"><span>Ngắm trên máy tính (chuột)</span><select data-set="aimModeKb">
          <option value="manual"${(st.aimModeKb || 'manual') === 'manual' ? ' selected' : ''}>Theo chuột (giữ chuột trái bắn)</option>
          <option value="assist"${st.aimModeKb === 'assist' ? ' selected' : ''}>Hỗ trợ (nắn nhẹ về quái)</option>
          <option value="auto"${st.aimModeKb === 'auto' ? ' selected' : ''}>Tự động (tự khoá + tự bắn)</option></select></label>
        <label class="row"><span>Tốc độ xoay người khi ngắm</span><select data-set="aimSpeed">
          <option value="slow"${st.aimSpeed === 'slow' ? ' selected' : ''}>Chậm (dễ ngắm)</option>
          <option value="normal"${st.aimSpeed === 'normal' || !st.aimSpeed ? ' selected' : ''}>Vừa</option>
          <option value="fast"${st.aimSpeed === 'fast' ? ' selected' : ''}>Nhanh</option></select></label>
        <label class="row"><span>Góc nhìn</span><select data-set="view">
          <option value="2d"${st.view !== '3d' ? ' selected' : ''}>2D từ trên xuống</option>
          <option value="3d"${st.view === '3d' ? ' selected' : ''}>3D (thử nghiệm)</option></select></label>
        <label class="row"><span>Nhân vật 3D</span><select data-set="model3d">
          <option value="real"${st.model3d !== 'classic' ? ' selected' : ''}>Mô hình có khung xương (chuyển động thật)</option>
          <option value="classic"${st.model3d === 'classic' ? ' selected' : ''}>Mô hình dựng sẵn (nhẹ máy)</option></select></label>`;
      $('settingsList').querySelectorAll('[data-set]').forEach((el) => el.addEventListener('change', () => {
        const k = el.dataset.set;
        st[k] = el.type === 'checkbox' ? el.checked : el.value;
        if (k === 'sfx' || k === 'music') MB.Audio.set(k, st[k]);
        if (k === 'quality') G.resize();
        if (k === 'model3d' && MB.R3 && MB.R3.onSkinnedReady) MB.R3.onSkinnedReady();
        if (k === 'aimMode' || k === 'aimModeKb') this.updateAimBtn();
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
      // gợi ý xoay ngang: hiện 4 giây mỗi lần chuyển sang dọc rồi tự ẩn (không che nút bấm khi đang chơi)
      const portrait = innerHeight > innerWidth && MB.U.isTouchDevice();
      if (portrait && !this.rotShown) {
        this.rotShown = true; $('rotateHint').classList.remove('hidden');
        clearTimeout(this.rotT); this.rotT = setTimeout(() => $('rotateHint').classList.add('hidden'), 4000);
      } else if (!portrait) { this.rotShown = false; $('rotateHint').classList.add('hidden'); }
    },
    onInputMode(m) {
      $('touchUI').classList.toggle('hidden', !(G.running && this.current === null));
      this.updateAimBtn();
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
