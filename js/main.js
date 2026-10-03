/* Monster Breakout — app shell: màn hình menu, chọn Gate, tải file Gate theo yêu cầu, vòng lặp game */
'use strict';
(function (MB) {
  const $ = (id) => document.getElementById(id);
  const G = MB.G;
  const SCREENS = ['menu', 'gates', 'help', 'settings', 'pause', 'result', 'retry', 'perks', 'shop', 'account', 'board', 'dossier', 'wall', 'donate', 'relay', 'thanks', 'loading'];
  const MENU_SCREENS = ['menu', 'gates', 'help', 'settings', 'shop', 'account', 'board', 'dossier', 'wall', 'donate', 'relay', 'thanks', 'result'];
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
      if (MB.Access.dev) { MB.Save.data.unlocked = 99; } // chỉ khi thử trên máy (localhost)
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
      MB.Access.loadConfig().then(() => { if (this.current === 'gates') this.openGates(); });
      MB.Cloud.init().then(() => this.afterPay());
    },
    // quay về từ trang thanh toán (?paid=1): làm mới quyền đã mua
    async afterPay() {
      if (!/[?&]paid=1/.test(location.search)) return;
      history.replaceState(null, '', location.pathname);
      await MB.Access.refresh();
      const ok = !MB.Access.need(MB.Access.PAID_FROM);
      MB.HUD.toast(ok ? '<b>ĐÃ MỞ KHOÁ</b> · cảm ơn bạn đã ủng hộ game!' : 'Đang chờ xác nhận thanh toán… thử lại sau ít phút trong mục Tài khoản.', ok ? '#9dff8a' : '#ffd56a');
      if (this.current === 'gates' || ok) this.openGates();
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
        MB.Audio.play('ui'); this.act = +b.dataset.actn;
        if (this.mode === 'survival') { this.openGates(); return; }
        document.querySelectorAll('#actToggle [data-actn]').forEach((x) => x.classList.toggle('on', x === b));
        const sec = document.getElementById('act' + this.act); if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }));
      on('btnReplay', () => MB.Story.play('act2', () => this.openGates()));
      on('btnReplayEnd', () => MB.Story.play(this.endingIds(), () => this.openGates()));
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
      on('btnDonate', () => this.openDonate('menu'));
      on('btnDonateP', () => this.openDonate('pause'));
      on('btnDonateR', () => this.openDonate('result'));
      on('btnAgain', () => (this.endlessRun || (this.mode === 'survival' && this.lastEndless) ? this.startEndless() : this.playGate(this.lastGate)));
      on('btnNext', () => this.playGate(this.lastGate + 1));
      on('btnMenu', () => this.quit());
      on('btnReset', () => {
        const b = $('btnReset');
        if (b.dataset.confirm) { MB.Save.reset(); b.textContent = 'Đã xoá tiến trình'; delete b.dataset.confirm; this.openSettings(); }
        else { b.dataset.confirm = '1'; b.textContent = 'Bấm lần nữa để xác nhận'; }
      });
    },

    // khối giới thiệu Chu kỳ+ nằm sau Gate 21 (lấp khoảng trống, kích thích người chơi vượt hết Màn 2)
    ngpPromo(list) {
      const sv = MB.Save.data, open = this.cycleOpen(), ngp = this.mode === 'ngplus';
      const done = list.filter((m) => (sv.gates[m.id] || {}).cleared).length, total = list.length;
      const all = MB.Gates.meta.filter((m) => m.file), won = all.filter((m) => ((sv.gates[m.id] || {}).ngp || {}).cleared).length;
      const perks = [['☠', 'Quái hung hãn hơn', 'Máu ×1,5 · đòn đánh ×1,3 · đông hơn 30%'], ['♛', 'Boss tinh nhuệ', 'Lên một cấp: tim lộ ít hơn, biết xoay người che điểm yếu'],
        ['⛁', 'Xu thưởng ×1,5', 'Cày vũ khí và nâng cấp nhanh gấp rưỡi'], ['⟳', 'Huy hiệu vàng', 'Mỗi cửa chinh phục được đóng dấu ⟳ · kỷ lục tính riêng'], ['⇄', 'Tự chọn chiến trường', 'Vào thẳng bất kỳ cửa nào, không cần đi lần lượt']];
      return `<div class="ngp-promo${open ? ' open' : ''}">
        <div class="np-head"><span class="np-ico">⟳</span><div><b>CHU KỲ+</b><em>${open ? (ngp ? 'ĐANG BẬT' : 'ĐÃ MỞ KHOÁ') : 'THỬ THÁCH SAU CÙNG'}</em></div></div>
        <p class="np-tag">${open ? 'Ghế số Bảy đã đổ — nhưng lũ quái chưa bao giờ ngừng tiến hoá. Quay lại mọi chiến trường, đối đầu phiên bản dữ dằn nhất của chúng.' : 'Chỉ dành cho Hunter đã đánh sập Ghế số Bảy. Mọi chiến trường trở lại — dữ dằn gấp bội, thưởng hậu hĩnh gấp rưỡi.'}</p>
        <ul class="np-perks">${perks.map(([i, t, d]) => `<li><i>${i}</i><div><b>${t}</b><span>${d}</span></div></li>`).join('')}</ul>
        ${open ? `<div class="np-foot"><span>Đã chinh phục <b>${won}/${all.length}</b> cửa ở Chu kỳ+</span><button id="ngpGo" class="primary">${ngp ? '← VỀ CHIẾN DỊCH' : 'VÀO CHU KỲ+ ▸'}</button></div>`
          : `<div class="np-foot"><div class="np-bar"><i style="width:${Math.round(done / total * 100)}%"></i></div><span>Màn 2: <b>${done}/${total}</b> cửa · vượt <b>Gate 21</b> để mở khoá</span></div>`}
      </div>`;
    },
    // Chu kỳ+ mở sau khi xong Gate 21 (kết thúc Màn 2)
    cycleOpen() { const sv = MB.Save.data; return MB.Story.seen('ending') || !!((sv.gates || {})[21] || {}).cleared || MB.Access.dev; },
    endingIds() { return ['ending', ...(Object.keys(MB.Save.data.clues || {}).length >= 10 ? ['endTrue'] : []), 'endOut']; },

    // thẻ chiến binh ở menu chính: chân dung, tên, chỉ số tác chiến + gợi ý cửa tiếp theo
    renderMenuOp() {
      const el = $('mnOp'); if (!el) return;
      const sv = MB.Save.data, C = MB.Cloud, u = C.user, gs = sv.gates || {};
      const ready = MB.Gates.meta.filter((m) => m.file), cleared = ready.filter((m) => (gs[m.id] || {}).cleared).length;
      const nClue = Object.keys(sv.clues || {}).length, rec = sv.endless;
      const next = ready.find((m) => !(gs[m.id] || {}).cleared && m.id <= sv.unlocked) || null;
      const av = u ? safeImg(C.avatar()) : '';
      const nm = u ? esc(C.name()) : 'KHÁCH · CHƯA ĐỊNH DANH';
      const lv = cleared >= 21 ? 'CHỈ HUY' : cleared >= 15 ? 'ĐẠI ĐỘI TRƯỞNG' : cleared >= 10 ? 'TRUNG ĐỘI TRƯỞNG' : cleared >= 5 ? 'TIỂU ĐỘI TRƯỞNG' : 'TÂN BINH';
      el.innerHTML = `<div class="op-av">${av ? `<img src="${av}" alt="" referrerpolicy="no-referrer">` : '<img src="assets/hunter/portrait.webp" alt="">'}<i></i></div>
        <div class="op-id"><small>CHIẾN BINH${MB.Access.supporter ? ' · <em>☕</em>' : ''}</small><b>${nm}</b><span>CẤP BẬC: ${lv}</span></div>
        <div class="op-stats"><div><b>${cleared}<small>/${ready.length}</small></b><span>Cửa ải</span></div><div><b>${nClue}<small>/10</small></b><span>Manh mối</span></div><div><b>${rec ? rec.wave : 0}</b><span>Wave SST</span></div><div><b>${(sv.coins || 0).toLocaleString('vi-VN')}</b><span>Xu</span></div></div>`;
      const ps = $('mnPlaySub'); if (ps) ps.textContent = next ? `Tiếp tục: Gate ${String(next.id).padStart(2, '0')} · ${next.name}` : 'Chiến dịch · Đấu trường Sinh tồn · Chu kỳ+';
    },

    show(name) {
      this.current = name;
      if (name === 'menu') this.renderMenuOp();
      // nhạc chủ đề hồi hộp ở các màn menu; vào trận thì nhường cho nhạc trận
      MB.Audio.menuTheme(MENU_SCREENS.includes(name));
      for (const s of SCREENS) $(s).classList.toggle('hidden', s !== name);
      const inGame = G.running && (name === null);
      $('hud').classList.toggle('hidden', !G.running || name === 'menu' || name === 'gates');
      $('touchUI').classList.toggle('hidden', !inGame);
      document.body.classList.toggle('playing', inGame);
      if (this.thanksPending && ['menu', 'gates', 'result'].includes(name)) setTimeout(() => { if (this.thanksPending && this.current === name) this.showThanks(); }, 400);
    },

    /* ---------- chọn Gate ---------- */
    openGates() {
      if (this.pendingUpdate) { G.running = false; this.applyUpdate(this.pendingUpdate); return; }
      const sv = MB.Save.data;
      const cyc = this.cycleOpen();
      if (this.mode === 'ngplus' && !cyc) this.mode = 'campaign';
      const surv = this.mode === 'survival', ngp = this.mode === 'ngplus';
      $('btnNgp').classList.toggle('hidden', !cyc); $('modeToggle').classList.toggle('three', cyc);
      $('gates').classList.toggle('world-surv', surv); $('gates').classList.toggle('world-ngp', ngp);
      document.querySelector('#gates .head h2').textContent = surv ? 'ĐẤU TRƯỜNG' : ngp ? 'CHU KỲ+' : 'CHỌN CỬA ẢI';
      if (!this.act) this.act = sv.unlocked >= 11 && sv.unlocked < 99 ? 2 : 1;
      $('gateGrid').classList.remove('acts');
      document.querySelectorAll('#actToggle [data-actn]').forEach((b) => b.classList.toggle('on', +b.dataset.actn === this.act));
      const nClue = Object.keys(sv.clues || {}).length;
      $('actNote').innerHTML = `<b>CHIẾN DỊCH</b> — Màn 1 · <b>Màn 2 đã mở</b> · Màn 3 sắp ra mắt. Manh mối của GS. Ted: <b>${nClue}/10</b>`;
      if (ngp) $('actNote').innerHTML = '<b>CHU KỲ+</b> — chơi lại mọi cửa đã qua: quái máu ×1,5, đánh đau ×1,3, đông hơn 30%, boss cấp cao hơn. <b>Xu thưởng ×1,5</b>, kỷ lục tính riêng.';
      $('btnReplay').classList.toggle('hidden', !MB.Story.seen('act2'));
      $('btnReplayEnd').classList.toggle('hidden', !MB.Story.seen('ending'));
      document.querySelectorAll('#modeToggle [data-mode]').forEach((b) => b.classList.toggle('on', b.dataset.mode === this.mode || (!this.mode && b.dataset.mode === 'campaign')));
      $('coinText').textContent = (sv.coins || 0).toLocaleString('vi-VN');
      $('actToggle').classList.toggle('hidden', surv);
      $('gateGrid').classList.toggle('endless-wrap', surv);
      if (surv) { this.openArena(); return; }
      // Chiến dịch: hiện cả 3 màn trên một trang (Màn 2 nổi bật, Màn 3 "sắp ra mắt") để người chơi thấy game còn dài
      const ACTS = MB.Gates.acts || [];
      const card = (m) => {
        const g = sv.gates[m.id] || { best: 0, done: [], cleared: false };
        const ready = !!m.file;
        const adm = MB.Access.admin || MB.Access.dev, closed = ready && MB.Access.isClosed(m.id);
        const unlocked = ready && (ngp ? !!g.cleared && (adm || !closed) : (adm || (!closed && (surv ? !!g.cleared : m.id <= sv.unlocked))));
        const stars = [0, 1, 2].map((i) => `<i class="${i < (g.done || []).length ? 'on' : ''}">★</i>`).join('');
        let status = !ready ? (m.act === 2 ? 'Sắp ra mắt · Màn 2' : 'Sắp ra mắt') : !unlocked ? (surv ? 'Qua Gate này ở Chiến dịch để mở' : `Hoàn thành Gate ${String(m.id - 1).padStart(2, '0')} để mở`) : g.cleared ? `Đã qua · Best ${g.best.toLocaleString('vi-VN')}` : 'Sẵn sàng';
        if (closed && !adm) status = '🔒 Sắp mở · đang hoàn thiện';
        if (surv && unlocked) status = g.surv ? `Kỷ lục: Wave ${g.surv.wave} · ${g.surv.score.toLocaleString('vi-VN')}` : 'Chưa có kỷ lục';
        if (ngp) status = !ready ? 'Sắp ra mắt' : !g.cleared ? 'Qua cửa này ở Chiến dịch để mở' : g.ngp && g.ngp.best ? `Chu kỳ+ · Best ${g.ngp.best.toLocaleString('vi-VN')}` : 'Chu kỳ+ · chưa có kỷ lục';
        const need = unlocked ? MB.Access.need(m.id, surv ? 'survival' : ngp ? 'ngplus' : 'campaign') : null;
        if (need === 'login') status = '🔑 Đăng nhập để chơi tiếp';
        else if (need === 'pay') status = '💎 Cần gói để chơi';
        return `<button class="gate${unlocked ? '' : ' locked'}${need ? ' gated' : ''}${g.cleared ? ' cleared' : ''}" data-gate="${m.id}" style="--gc:${m.color}" ${unlocked ? '' : 'disabled'}>
          <span class="gnum">GATE ${String(m.id).padStart(2, '0')}</span>${m.has3d ? '<span class="b3d">3D</span>' : ''}${m.ally && unlocked ? '<span class="bally">+ DIAN</span>' : ''}${g.ngp && g.ngp.cleared ? '<span class="bngp" title="Đã chinh phục Chu kỳ+">⟳</span>' : ''}${closed && adm ? '<span class="badm">ĐÓNG · ADMIN</span>' : ''}
          <b>${m.name}</b><small>${m.vi}</small>
          <span class="stars">${unlocked ? stars : '🔒'}</span>
          <em>${status}</em>
          <span class="gboss">Boss: ${unlocked ? m.boss : '???'}</span>
        </button>`;
      };
      $('gateGrid').classList.add('acts');
      $('gateGrid').innerHTML = ACTS.map((a) => {
        const list = MB.Gates.meta.filter((m) => (m.act || 1) === a.n);
        const done = list.filter((m) => (sv.gates[m.id] || {}).cleared).length, total = a.total || list.length;
        const head = `<div class="acthead" id="act${a.n}" style="--ac:${a.color}"><span class="anum">${a.n}</span>
          <div><b>MÀN ${a.n} · ${a.name}</b>${a.tag ? `<em class="atag">${a.tag}</em>` : ''}<span>${a.desc}</span></div>
          <i>${a.soon && !list.length ? 'Sắp ra mắt' : `${done}/${total} cửa`}${a.n === 2 ? ` · Manh mối ${nClue}/10` : ''}</i></div>`;
        const promo = a.n === 2 && !surv ? this.ngpPromo(list) : '';
        const body = list.length ? `<div class="grid">${list.map(card).join('')}${promo}</div>`
          : `<div class="grid">${(a.teasers || []).map((t) => `<div class="gate locked soon" style="--gc:${a.color}"><span class="gnum">${t.n}</span><b>${t.name}</b><small>${t.vi}</small><span class="stars">🔒</span><em>Sắp ra mắt</em><span class="gboss">Boss: ???</span></div>`).join('')}</div>`;
        return `<section class="actsec">${head}${body}</section>`;
      }).join('');
      const pg = $('ngpGo'); if (pg) pg.addEventListener('click', () => { MB.Audio.play('ui'); this.mode = ngp ? 'campaign' : 'ngplus'; this.openGates(); });
      $('gateGrid').querySelectorAll('[data-gate]').forEach((b) => b.addEventListener('click', () => { MB.Audio.play('ui'); this.playGate(+b.dataset.gate); }));
      this.renderViewToggle();
      $('armoryText').textContent = 'Kho vũ khí: ' + sv.armory.map((id) => MB.Weapons.DEFS[id].name).join(' · ');
      this.show('gates');
      // cuộn tới màn đang chơi
      const cur = document.getElementById('act' + this.act); if (cur && this.act > 1) setTimeout(() => cur.scrollIntoView({ block: 'start' }), 30);
    },

    renderViewToggle() {
      const v = MB.Save.data.settings.view || '2d';
      // 3D: tải trước three.js + mô hình nhân vật ngay khi đang ở màn chọn cửa, vào trận không phải chờ
      if (v === '3d' && !this._pre3d) { this._pre3d = true; setTimeout(() => this.loadScript('js/render3d.js').then(() => MB.R3.load()).catch(() => { this._pre3d = false; }), 300); }
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
        $('loadingText').textContent = 'Đang tải nhân vật 3D…';
        await MB.R3.waitSkinned(10000);
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
    // chuỗi đấu trường: Màn 1 mở sẵn (vào thẳng Sinh tồn được), cửa Màn 2+ nhập chuỗi khi đã qua ở Chiến dịch
    endlessChain() {
      const gs = MB.Save.data.gates, A = MB.Access, adm = A.admin || A.dev;
      return MB.Gates.meta.filter((m) => m.file && ((m.act || 1) === 1 || (gs[m.id] && gs[m.id].cleared) || adm)
        && (adm || (!A.isClosed(m.id) && !(A.paywall && m.id >= A.PAID_FROM && !A.has(m.id, 'survival'))))).map((m) => m.id);
    },
    async startEndless(resume) {
      const C = MB.Cloud, A = MB.Access, sv = MB.Save.data;
      if (!C.user && !A.dev) { this.mode = 'survival'; this.openGates(); return; }
      this.show('loading'); $('loadingText').textContent = 'Đang mở cửa đấu trường…';
      await A.survStatus();
      if (A.survLeft() <= 0) { this.mode = 'survival'; this.openGates(); return; }
      const run = resume && sv.survRun;
      if (run && run.chain && run.chain.length) {
        this.mode = 'survival'; this.endlessRun = { chain: run.chain, i: run.i || 0 };
        this.playGate(run.chain[this.endlessRun.i], { endless: true, carry: run.carry || null });
        return;
      }
      const chain = this.endlessChain(); if (!chain.length) { this.openGates(); return; }
      this.mode = 'survival'; this.endlessRun = { chain, i: 0 };
      sv.survRun = { chain, i: 0, carry: null, stage: 1, ts: Date.now() }; sv.ts = Date.now(); MB.Save.save(); MB.Cloud.push();
      this.playGate(chain[0], { endless: true });
    },
    async endlessAdvance() {
      const run = this.endlessRun; if (!run) return;
      run.i = (run.i + 1) % run.chain.length;
      const id = run.chain[run.i], meta = MB.Gates.meta.find((m) => m.id === id), carry = G.carry();
      // điểm lưu: đầu mỗi khu vực (thoát giữa chừng / hết giờ → lần sau vào lại đúng khu vực này)
      { const sv = MB.Save.data; sv.survRun = { chain: run.chain, i: run.i, carry: JSON.parse(JSON.stringify(carry)), stage: carry.stage, ts: Date.now() }; sv.ts = Date.now(); MB.Save.save(); MB.Cloud.push(); }
      G.paused = true;
      $('loadingText').textContent = `Tiến vào khu vực ${carry.stage}: ${meta.name} — ${meta.vi}…`; this.show('loading');
      try {
        for (const rid of meta.requires || []) { const rm = MB.Gates.meta.find((m) => m.id === rid); if (rm && rm.file) await this.loadScript(rm.file); }
        await this.loadScript(meta.file); await this.prepare3D(meta);
        this.lastGate = id; MB.Input.clear();
        G.start(MB.Gates.defs[id], { mode: 'survival', endless: true, carry });
        this.survClockStart();
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
      if (this.mode === 'ngplus' && !((MB.Save.data.gates || {})[id] || {}).cleared) this.mode = 'campaign';
      MB.Audio.unlock();
      this.show('loading');
      {
        $('loadingText').textContent = 'Đang kiểm tra tài khoản…';
        const need = await MB.Access.check(id, this.mode);
        if (need) { G.running = false; this.openWall(need, id); return; }
      }
      try {
        $('loadingText').textContent = 'Đang tải cửa ải…';
        for (const rid of meta.requires || []) { const rm = MB.Gates.meta.find((m) => m.id === rid); if (rm && rm.file) await this.loadScript(rm.file); }
        await this.loadScript(meta.file);
        await this.prepare3D(meta);
        const def = MB.Gates.defs[id];
        if (!def) throw new Error('Gate chưa đăng ký');
        this.lastGate = id;
        MB.Input.clear();
        G.start(def, { mode: this.mode === 'ngplus' ? 'campaign' : this.mode, ngp: this.mode === 'ngplus', endless: !!opts.endless, carry: opts.carry || undefined });
        if (opts.carry) G.banner(`KHU VỰC ${opts.carry.stage}`, `${meta.name} · tiếp tục trận đang dở`, 2.6);
        if (opts.endless) this.survClockStart();
        if (G.ngp) G.banner('CHU KỲ+', 'Quái mạnh hơn · xu thưởng ×1,5', 2.6);
        if (G.starve) {
          G.banner('VÙNG ÁC MỘNG', 'Hunter đang thiếu tiếp tế — quái đông và dữ gấp bội', 3);
          MB.Story.say('HUNTER', 'Đạn dược gần cạn… đoàn tiếp tế vẫn chưa tới.', 3.2);
          MB.Story.say('TIẾP TẾ', 'Hunter, trạm tiếp tế thiếu nhiên liệu. Cố cầm cự — lũ quái ở đây dữ hơn bao giờ hết.', 4.2);
        }
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
      $('btnDonateP').classList.toggle('hidden', !!MB.Access.supporter);
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
        ...(sv.life ? [['Đã chiến đấu', `${sv.life.plays} trận · ${Math.round(sv.life.time / 60)} phút · hạ ${sv.life.kills.toLocaleString('vi-VN')} quái`]] : []),
        ...(MB.Access.supporter ? [['Huy hiệu', '<span class="supbadge">☕ NGƯỜI TIẾP TẾ</span> · cảm ơn bạn đã giữ cho server hoạt động']] : []),
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
        chip.innerHTML = C.status === 'loading' ? 'ĐANG KẾT NỐI…' : '<b class="g">G</b> ĐĂNG NHẬP GOOGLE';
        hint.textContent = `Gate 1–${MB.Access.LOGIN_FROM - 1} chơi ngay không cần đăng nhập. Đăng nhập Google (miễn phí) để lưu tiến trình, chơi tiếp các cửa sau và có tên trên bảng xếp hạng.`;
      } else {
        const av = safeImg(C.avatar());
        chip.innerHTML = (av ? `<img src="${av}" alt="" referrerpolicy="no-referrer">` : '👤 ') + esc(C.name().split(' ').slice(-1)[0]);
        hint.textContent = C.status === 'syncing' ? 'Đang đồng bộ tiến trình…' : C.status === 'error' ? 'Chưa đồng bộ được (mất mạng?). Tiến trình vẫn lưu trên máy.' : `Đã đồng bộ tiến trình${t ? ' lúc ' + t : ''}.`;
      }
      $('btnAccount').classList.toggle('in', !!u);
      const bd = $('btnDonate'); if (bd) { const b2 = bd.querySelector('b'); if (b2) b2.textContent = MB.Access.supporter ? 'NGƯỜI TIẾP TẾ' : 'TIẾP TẾ CHO GAME'; }
      this.renderMenuOp();
      if (u && MB.Access.supporter) chip.innerHTML += ' <span class="glowstar" title="Người tiếp tế">★</span>';
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
        ${MB.Access.supporter ? '<p class="plan-line"><span class="supbadge">☕ NGƯỜI TIẾP TẾ</span> · cảm ơn bạn đã tiếp sức cho game!</p>' : `<p class="plan-line">Mã tiếp tế của bạn: <b>${esc(MB.Access.donateCode())}</b> (ghi vào nội dung chuyển khoản để nhận huy hiệu)</p>`}
        ${MB.Access.paywall || MB.Access.active().length ? `<p class="plan-line">${MB.Access.active().length ? '💎 Gói đang dùng: <b>' + esc(MB.Access.active().join(' · ')) + '</b>' : 'Chưa mua gói · Màn 1 (Gate 1–10) miễn phí'}</p>` : ''}
        <div class="btns"><button id="btnSync" class="primary">ĐỒNG BỘ NGAY</button>${MB.Access.paywall ? '<button id="btnPlans">CÁC GÓI</button>' : ''}<button id="btnDonate2">☕ ỦNG HỘ</button>${MB.Access.admin ? '<button id="btnAdmin">⚙ QUẢN TRỊ</button>' : ''}<button id="btnLogout">ĐĂNG XUẤT</button></div>`
        : `
        <p>Chơi ngay <b>Gate 1–${MB.Access.LOGIN_FROM - 1} không cần đăng nhập</b>. Từ Gate ${MB.Access.LOGIN_FROM} cần đăng nhập Google (miễn phí) để lưu tiến trình và chơi tiếp.</p>
        <ul class="perks-list"><li><b>Lưu tiến trình trên mạng:</b> đổi điện thoại, xoá dữ liệu trình duyệt vẫn không mất gate, xu, nâng cấp.</li>
        <li><b>Chơi tiếp trên máy khác</b> chỉ cần đăng nhập cùng tài khoản.</li><li><b>Có tên trên bảng xếp hạng</b> từng Gate và chế độ Sinh tồn.</li></ul>
        <p class="hint">Tiến trình đang có trên máy này sẽ được gộp vào tài khoản ngay khi đăng nhập.</p>
        <div class="btns"><button id="btnGoogle" class="google"><b class="g">G</b> ĐĂNG NHẬP BẰNG GOOGLE</button></div>
        ${C.status === 'loading' ? '<p class="hint">Đang chuyển sang trang Google…</p>' : ''}${C.error && !u ? `<p class="hint err">${esc(C.error)}</p>` : ''}`;
      const b = (id, f) => { const el = $(id); if (el) el.addEventListener('click', f); };
      b('btnGoogle', () => { MB.Audio.play('ui'); C.signIn(); });
      b('btnSync', () => { MB.Audio.play('ui'); C.sync(); MB.Access.refresh().then(() => this.renderAccount()); });
      b('btnPlans', () => { MB.Audio.play('ui'); this.openWall('pay', MB.Access.PAID_FROM, 'account'); });
      b('btnDonate2', () => { MB.Audio.play('ui'); this.openDonate('account'); });
      b('btnAdmin', () => { location.href = 'cancuhunterx'; });
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
      G.paused = true; MB.Input.clear(); this.retryKind = 'boss'; $('btnRetryBoss').textContent = 'ĐẤU LẠI BOSS (1 LẦN)';
      const b = MB.Enemies.types[G.def.boss.type];
      $('retryInfo').innerHTML = `Bạn đã tới trận cuối với <b>${b ? b.name : 'Boss'}</b>.<br>Đấu lại ngay tại chỗ: hồi đầy máu, giáp, đạn, lựu đạn và xung kích; giữ nguyên súng, linh kiện và điểm.<br><small>Mỗi lượt chơi Gate chỉ có 1 cơ hội.</small>`;
      this.show('retry');
    },
    retryBoss() {
      if (this.retryKind === 'surv') { this.reviveSurv(); return; }
      MB.Audio.play('ui');
      G.retryBoss(); G.paused = false; MB.Input.clear();
      this.show(null);
    },
    giveUp() {
      MB.Audio.play('ui');
      G.retryOffer = false; G.paused = false;
      this.onGateEnd(G.summary());
    },

    /* ---------- ĐẤU TRƯỜNG SINH TỒN (v8.2) ---------- */
    fmtClock(sec) { sec = Math.max(0, Math.round(sec)); const h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60; return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(s).padStart(2, '0'); },
    // đếm giờ đang đánh (theo đồng hồ trận, tạm dừng không tính), gửi máy chủ mỗi 20 giây
    survClockStart() {
      clearInterval(this.survIv); this.survAcc = 0; this.survLast = G.time; this.survWarn = {};
      const A = MB.Access, el = $('survClock');
      if (!A.surv) A.survApply(null);
      el.classList.remove('hidden');
      const tick = () => {
        if (!G.running || G.mode !== 'survival') { clearInterval(this.survIv); el.classList.add('hidden'); this.survFlush(); return; }
        const d = Math.max(0, Math.min(2, G.time - this.survLast)); this.survLast = G.time;
        if (!G.over && !G.paused && G.state !== 'intro') this.survAcc += d;
        const left = A.survLeft() - this.survAcc, lim = A.surv ? A.surv.limit : 0;
        if (lim >= 86400) { el.classList.add('hidden'); } else {
          el.textContent = '⏱ ' + this.fmtClock(left); el.classList.toggle('low', left < 300);
          for (const m of [10, 5, 1]) if (left <= m * 60 && left > m * 60 - 3 && !this.survWarn[m]) { this.survWarn[m] = 1; MB.HUD.toast(`<b>Đấu trường còn ${m} phút</b> hôm nay`, '#ffb84a'); }
          if (left <= 0 && !G.over) {
            G.survOut = true; G.banner('ĐẤU TRƯỜNG TẮT ĐÈN', 'Hết giờ chiến đấu hôm nay — khu vực này được giữ lại cho ngày mai', 3);
            G.finish(false, 2.5); this.survFlush();
          }
        }
        if (this.survAcc >= 20) this.survFlush();
      };
      this.survIv = setInterval(tick, 1000);
    },
    survFlush() { const a = Math.round(this.survAcc || 0); this.survAcc = 0; if (a > 0) MB.Access.survTick(a); },
    async offerSurvRevive() {
      this.survFlush();
      const A = MB.Access, st = A.surv || A.survApply(null);
      if (st.revLimit <= 0 || st.revives >= st.revLimit) { this.onGateEnd(G.summary()); return; }
      G.paused = true; MB.Input.clear();
      const left = st.revLimit - st.revives;
      $('retryInfo').innerHTML = `Bạn gục ở <b>khu vực ${G.stage || 1} · wave ${(G.waveIdx || 0) + 1}</b>.<br>Là <b>Người tiếp tế</b>, bạn được hồi sinh ngay tại chỗ: đầy máu, giáp, đạn — giữ nguyên wave, súng, nâng cấp và điểm.<br><small>Còn ${left}/${st.revLimit} lượt hồi sinh hôm nay.</small>`;
      $('btnRetryBoss').textContent = `HỒI SINH TẠI CHỖ (${left})`; this.retryKind = 'surv';
      this.show('retry');
    },
    async reviveSurv() {
      MB.Audio.play('ui');
      const ok = await MB.Access.survRevive();
      if (!ok) { this.giveUp(); return; }
      G.reviveHere(); G.paused = false; MB.Input.clear(); this.show(null);
    },
    openArena() {
      const sv = MB.Save.data, A = MB.Access, C = MB.Cloud, chain = this.endlessChain(), rec = sv.endless, run = sv.survRun;
      const lim = A.survLimits(), st = A.surv;
      const logged = !!C.user || A.dev, left = st ? A.survLeft() : lim.limit, out = logged && st && left <= 0;
      $('actNote').innerHTML = ''; $('btnReplay').classList.add('hidden'); $('btnReplayEnd').classList.add('hidden');
      const unlim = (st ? st.limit : lim.limit) >= 86400;
      const capT = this.fmtClock(st ? st.limit : lim.limit), sup = st ? st.supporter : lim.supporter;
      const now = Date.now(), vn = new Date(now + 7 * 3600e3), reopen = (24 * 3600 - (vn.getUTCHours() * 3600 + vn.getUTCMinutes() * 60 + vn.getUTCSeconds()));
      const status = !logged ? `<div class="ar-gate"><b>🔑 Đấu trường yêu cầu đăng nhập</b><span>Để lưu khu vực đang chiến đấu, trạng thái Hunter và giờ chiến đấu — đổi máy vẫn đánh tiếp. Tiến trình Chiến dịch dùng chung tài khoản.</span><button id="arLogin" class="primary">ĐĂNG NHẬP GOOGLE</button></div>`
        : out ? `<div class="ar-gate out"><b>🌑 Đấu trường đã tắt đèn hôm nay</b><span>Mỗi trận Sinh tồn đốt máy chủ gấp nhiều lần Chiến dịch. Để đấu trường sống được lâu dài, mỗi chiến binh có ${capT} chiến đấu mỗi ngày. Mở lại sau <b>${this.fmtClock(reopen)}</b> (0h giờ Việt Nam)${run ? ` — khu vực ${run.stage || 1} của bạn vẫn được giữ nguyên` : ''}.</span>
            ${sup ? '<em>Cảm ơn bạn đã tiếp tế cho đấu trường ☕</em>' : `<em>☕ Người tiếp tế được chiến <b>${this.fmtClock(A.cfg.survival.supMin * 60)}</b> mỗi ngày và <b>hồi sinh tại chỗ ${A.cfg.survival.supRev} lần</b> — không phải đánh lại từ đầu.</em><button id="arDon" class="primary">☕ TIẾP TẾ CHO ĐẤU TRƯỜNG</button>`}</div>`
        : `<div class="ar-stat"><div><span>Thời gian chiến hôm nay</span><b>${unlim ? 'Không giới hạn' : this.fmtClock(left) + ' / ' + capT}</b>${unlim ? '' : `<div class="ar-bar"><i style="width:${Math.round(left / (st ? st.limit : lim.limit) * 100)}%"></i></div>`}</div>
            <div><span>Hồi sinh tại chỗ</span><b>${(st ? st.revLimit : lim.revLimit) > 0 ? `${Math.max(0, (st ? st.revLimit - st.revives : lim.revLimit))} lượt còn lại` : 'Không có — gục là hết'}</b>${!sup && A.cfg.survival.supRev > 0 ? `<small>Người tiếp tế: ${A.cfg.survival.supRev} lượt/ngày</small>` : ''}</div>
            <div><span>Kỷ lục của bạn</span><b>${rec ? `Wave ${rec.wave} · khu vực ${rec.stage}` : 'Chưa có'}</b>${rec ? `<small>${rec.score.toLocaleString('vi-VN')} điểm</small>` : ''}</div></div>
          <div class="ar-go">${run && run.stage > 1 ? `<button id="arResume" class="primary">▶ TIẾP TỤC KHU VỰC ${run.stage}</button><button id="arNew">TRẬN MỚI</button>` : `<button id="arNew" class="primary big">⚔ BƯỚC VÀO ĐẤU TRƯỜNG</button>`}</div>`;
      $('gateGrid').innerHTML = `<div class="arena">
        <div class="ar-hero"><small>CHẾ ĐỘ ĐỘC LẬP · KHÔNG CỐT TRUYỆN</small><h3>ĐẤU TRƯỜNG SINH TỒN</h3>
          <p class="ar-cry">Không cốt truyện. Không lối thoát. Không ai tới cứu.<br>Chỉ có bạn, khẩu súng — và một biển quái <b>không bao giờ cạn</b>.</p>
          <p>Mỗi khu vực là 4 đợt quái dồn dập và một Boss chặn cửa. Hạ Boss → hồi 25% máu, chọn thẻ nâng cấp, lao sang chiến trường kế tiếp. Hết vòng các chiến trường, lũ quái quay lại — <b>mạnh hơn, đông hơn, khát máu hơn</b>. Bạn trụ được bao lâu?</p></div>
        ${status}
        <div class="ar-rules"><div><i>⚔</i><b>Mỗi khu vực</b><span>4 wave + 1 Boss, quái tăng dần</span></div><div><i>♥</i><b>Giữ suốt chuỗi</b><span>Máu, súng, linh kiện, thẻ nâng cấp</span></div><div><i>⟲</i><b>Điểm lưu</b><span>Thoát giữa chừng → vào lại đúng khu vực</span></div><div><i>☠</i><b>Gục là hết</b><span>${A.cfg.survival.supRev > 0 ? `Trừ Người tiếp tế: hồi sinh tại chỗ ${A.cfg.survival.supRev} lần/ngày` : 'Không đấu lại'}</span></div></div>
        <div class="ar-chain"><b>CHUỖI CHIẾN TRƯỜNG (${chain.length})</b><div class="echain">${chain.map((id, i) => { const m = MB.Gates.meta.find((q) => q.id === id); return `<span style="--gc:${m.color}"><i>${i + 1}</i>${m.name}</span>`; }).join('<b>›</b>')}<b>↻</b></div>
          <small>Màn 1 mở sẵn. Chiến trường Màn 2 nhập chuỗi khi bạn chinh phục cửa đó ở Chiến dịch.</small></div>
        <div class="ar-foot"><div id="arBar"></div><span>Đấu trường Sinh tồn tiêu tốn máy chủ nhiều nhất trong game. Mỗi ly cà phê tiếp tế giữ cho đèn đấu trường không bao giờ tắt.</span><button id="arDon2" class="sm">☕ Tiếp tế</button></div>
      </div>`;
      const on2 = (id, fn) => { const e = $(id); if (e) e.addEventListener('click', () => { MB.Audio.play('ui'); fn(); }); };
      on2('arLogin', () => MB.Cloud.signIn());
      on2('arDon', () => this.openDonate('gates')); on2('arDon2', () => this.openDonate('gates'));
      on2('arResume', () => this.startEndless(true));
      on2('arNew', () => { MB.Save.data.survRun = { done: true, ts: Date.now() }; MB.Save.save(); this.startEndless(false); });
      this.serverBar($('arBar'));
      this.renderViewToggle();
      $('armoryText').textContent = 'Kho vũ khí: ' + sv.armory.map((id) => MB.Weapons.DEFS[id].name).join(' · ');
      this.show('gates');
      // cập nhật giờ còn lại từ máy chủ rồi vẽ lại (1 lần)
      if (logged && !this.arFetching && (!st || Date.now() - (this.arT || 0) > 15000)) { this.arFetching = true; this.arT = Date.now(); A.survStatus().then(() => { this.arFetching = false; if (this.current === 'gates' && this.mode === 'survival') this.openArena(); }); }
    },

    /* ---------- chặn cửa: đăng nhập / mua gói ---------- */
    openWall(kind, id, back) {
      const A = MB.Access, C = MB.Cloud, n = String(id).padStart(2, '0');
      this.wallBack = back || 'gates'; this.wallStop();
      let html;
      if (kind === 'closed') {
        html = `<div class="wall-ico">🔒</div><h2>GATE ${n} SẮP MỞ</h2><p>Cửa này đang được hoàn thiện và sẽ mở cho mọi người trong thời gian tới. Hẹn gặp lại bạn!</p>
          <div class="btns"><button id="wBack" class="primary">VỀ CHỌN CỬA</button></div>`;
      } else if (kind === 'login') {
        html = `<div class="wall-ico">🔑</div><h2>ĐĂNG NHẬP ĐỂ CHƠI TIẾP</h2>
          <p>Bạn đã chơi hết <b>${A.LOGIN_FROM - 1} cửa dành cho khách</b>. Đăng nhập Google — <b>miễn phí</b> — để lưu tiến trình và chơi tiếp từ Gate ${n}.</p>
          <ul class="perks-list"><li>Toàn bộ tiến trình, xu, súng, nâng cấp trên máy này được giữ nguyên và gộp vào tài khoản.</li>
          <li>Đổi máy, xoá trình duyệt vẫn chơi tiếp được.</li><li>Có tên trên bảng xếp hạng.</li></ul>
          <div class="btns"><button id="wGoogle" class="google"><b class="g">G</b> ĐĂNG NHẬP BẰNG GOOGLE</button><button id="wBack" class="ghost">ĐỂ SAU</button></div>
          ${C.status === 'loading' ? '<p class="hint">Đang chuyển sang trang Google…</p>' : ''}`;
      } else {
        const act = A.actOf(id), P = A.cfg.plans;
        const list = ['act15', 'act30', 'year', 'gate'].filter((k) => P[k]).map((k) => {
          const p = P[k], pr = A.priceFor(k, act), disc = pr < p.price;
          const what = p.scope === 'gate' ? `Gate ${n}` : p.scope === 'all' ? 'Mọi màn' : `Màn ${act}`;
          return `<button class="plan${k === 'act30' ? ' hot' : ''}" data-plan="${k}">${k === 'act30' ? '<em>ĐƯỢC CHỌN NHIỀU</em>' : k === 'year' ? '<em>CHU KỲ+</em>' : ''}
            <b>${esc(p.name)}</b><small class="what">${what}${p.days ? ' · ' + p.days + ' ngày' : ''}</small>
            <strong>${A.price(pr)}${disc ? ` <s>${A.price(p.price)}</s>` : ''}</strong><span>${esc(p.desc)}</span></button>`;
        }).join('');
        html = `<div class="wall-ico">💎</div><h2>MỞ KHOÁ GATE ${n}</h2>
          <p>Bạn đã hoàn thành phần miễn phí. Chọn một gói để tiếp tục — tiến trình của bạn được giữ nguyên.</p>
          <div class="plans">${list}</div>
          <div id="wPay"></div><p id="wMsg" class="hint"></p>
          <div class="btns"><button id="wCheck">ĐÃ CHUYỂN KHOẢN? KIỂM TRA</button><button id="wBack" class="ghost">ĐỂ SAU</button></div>`;
      }
      $('wallBody').innerHTML = html;
      const b = (k, f) => { const el = $(k); if (el) el.addEventListener('click', () => { MB.Audio.play('ui'); f(); }); };
      const goBack = () => { this.wallStop(); this.wallBack === 'account' ? this.openAccount() : this.openGates(); };
      const ok = () => { this.wallStop(); MB.HUD.toast('<b>ĐÃ MỞ KHOÁ</b> · cảm ơn bạn đã ủng hộ game!', '#9dff8a'); MB.Audio.play('weapon'); this.openGates(); };
      b('wGoogle', () => C.signIn());
      b('wBack', goBack);
      b('wCheck', async () => { $('wMsg').textContent = 'Đang kiểm tra…'; await A.refresh(); if (!A.need(id, this.mode)) ok(); else $('wMsg').textContent = 'Chưa nhận được chuyển khoản. Thường mất 10–60 giây, thử lại sau ít phút.'; });
      $('wallBody').querySelectorAll('[data-plan]').forEach((el) => el.addEventListener('click', async () => {
        MB.Audio.play('ui');
        $('wallBody').querySelectorAll('[data-plan]').forEach((x) => x.classList.toggle('sel', x === el));
        $('wMsg').textContent = 'Đang tạo đơn…'; $('wPay').innerHTML = '';
        try {
          const o = await A.order(el.dataset.plan, A.actOf(id), id);
          $('wMsg').textContent = '';
          $('wPay').innerHTML = A.qrBox(o.amount, o.code, 'Quét bằng app ngân hàng hoặc MoMo. <b>Giữ nguyên nội dung chuyển khoản</b> để hệ thống tự mở khoá trong vài giây.');
          A.bindCopy($('wPay'));
          // tự kiểm tra mỗi 5 giây trong 15 phút
          this.wallStop(); let n2 = 0;
          this.wallPoll = setInterval(async () => { if (++n2 > 180 || this.current !== 'wall') { this.wallStop(); return; } await A.refresh(); if (!A.need(id, this.mode)) ok(); }, 5000);
        } catch (e) { $('wMsg').textContent = /paywall off/.test(e.message || '') ? 'Hiện chưa mở bán gói — bạn cứ chơi miễn phí.' : 'Không tạo được đơn: ' + (e.message || e); }
      }));
      this.show('wall');
    },
    wallStop() { clearInterval(this.wallPoll); this.wallPoll = null; },

    /* ---------- donate ---------- */
    openDonate(back) {
      const A = MB.Access, C = MB.Cloud, d = A.cfg.donate;
      this.donateBack = back || this.current || 'menu';
      const info = A.donateCode(), sup = A.supporter;
      const draw = (amt) => {
        $('donBody').innerHTML = `<div class="wall-ico">☕</div><h2>${sup ? 'CẢM ƠN NGƯỜI TIẾP TẾ' : 'TIẾP TẾ CHO HUNTER'}</h2>
          <p>${sup ? 'Bạn đã tiếp sức cho chiến dịch — server vẫn chạy nhờ bạn. Muốn tiếp tế thêm thì quét mã bên dưới.' : esc(d.note || 'Ủng hộ duy trì server') + '. Game do một người làm — miễn phí, không quảng cáo. Mỗi đóng góp giúp server chạy và có thêm màn mới.'}</p>
          <div id="donBar"></div>
          <div class="amts">${[0, 20000, 50000, 100000, 200000].map((v) => `<button class="sm${v === amt ? ' on' : ''}" data-amt="${v}">${v ? A.price(v) : 'Tuỳ ý'}</button>`).join('')}</div>
          ${A.qrBox(amt, info, C.user ? '<b>Giữ nguyên nội dung chuyển khoản</b> để nhận huy hiệu ☕ Người tiếp tế. Cảm ơn bạn rất nhiều! ❤' : 'Đăng nhập trước khi chuyển để nhận huy hiệu ☕ Người tiếp tế. Cảm ơn bạn rất nhiều! ❤')}
          <div class="btns"><button id="donBack" class="ghost">${this.donateBack === 'pause' ? 'QUAY LẠI TRẬN' : 'ĐÓNG'}</button></div>`;
        A.bindCopy($('donBody'));
        this.serverBar($('donBar'));
        $('donBody').querySelectorAll('[data-amt]').forEach((el) => el.addEventListener('click', () => { MB.Audio.play('ui'); draw(+el.dataset.amt); }));
        $('donBack').addEventListener('click', () => { MB.Audio.play('ui'); if (C.user) MB.Access.refresh(); this.show(this.donateBack); });
      };
      draw(0);
      this.show('donate');
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
      // thắng Gate 21 lần đầu → cảnh kết thúc Màn 2 (kết thúc thật nếu đủ 10 manh mối), mở Chu kỳ+
      if (!afterStory && sum.gateId === 21 && sum.win && sum.mode !== 'survival' && !sum.ngp && !MB.Story.seen('ending')) {
        G.running = false; MB.Audio.stopMusic();
        MB.Story.play(this.endingIds(), () => this.onGateEnd(sum, true));
        return;
      }
      const sv = MB.Save.data, g = MB.Save.gate(sum.gateId), surv = sum.mode === 'survival';
      if (surv) { clearInterval(this.survIv); $('survClock').classList.add('hidden'); this.survFlush(); }
      if (surv && sum.endless && !sum.survOut) sv.survRun = { done: true, ts: Date.now() };
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
      } else if (sum.ngp) {
        const gp = g.ngp || (g.ngp = { best: 0 });
        newBest = sum.score > (gp.best || 0); if (newBest) gp.best = sum.score;
        if (sum.win) { gp.cleared = true; if (!gp.bestTime || sum.time < gp.bestTime) gp.bestTime = sum.time; }
      } else { newBest = sum.score > g.best; if (newBest) g.best = sum.score; }
      const coins = MB.Shop.earn(sum);
      sv.coins = (sv.coins || 0) + coins; sv.ts = Date.now();
      MB.Cloud.submit(sum); MB.Cloud.logPlay(sum); MB.Cloud.push();
      const life = sv.life || (sv.life = { plays: 0, time: 0, kills: 0 });
      life.plays++; life.time += sum.time || 0; life.kills += sum.kills || 0;
      if (sum.win && !surv && !sum.ngp) {
        g.cleared = true;
        if (!g.bestTime || sum.time < g.bestTime) g.bestTime = sum.time;
        sv.unlocked = Math.max(sv.unlocked, sum.gateId + 1);
      }
      MB.Save.save();
      G.running = false; MB.Audio.stopMusic();
      const mm = Math.floor(sum.time / 60), ss = String(Math.floor(sum.time % 60)).padStart(2, '0');
      $('resTitle').textContent = surv && sum.survOut ? `ĐẤU TRƯỜNG TẮT ĐÈN · KHU VỰC ${sum.stage}` : surv ? (sum.endless ? `BẤT TẬN · WAVE ${sum.wave} · KHU VỰC ${sum.stage}` : `SINH TỒN · WAVE ${sum.wave}`) : sum.win ? (sum.gateId === 10 && !sum.ngp ? 'NHÂN LOẠI ĐÃ ĐƯỢC CỨU' : sum.gateId === 21 && !sum.ngp ? 'GHẾ SỐ BẢY ĐÃ ĐỔ' : sum.ngp ? 'CHU KỲ+ · CLEARED' : 'GATE CLEARED') : 'MISSION FAILED';
      $('resTitle').className = sum.win || surv ? 'win' : 'lose';
      $('resCoins').innerHTML = `+${coins.toLocaleString('vi-VN')} xu · tổng ${sv.coins.toLocaleString('vi-VN')} xu` + (sum.comboBest >= 5 ? ` · combo cao nhất ×${sum.comboBest}` : '');
      if (surv && sum.endless) {
        const A = MB.Access, sc = A.cfg.survival;
        if (sum.survOut) $('resCoins').innerHTML += `<br><small class="survnote">Hết giờ chiến đấu hôm nay. Khu vực ${sum.stage} được giữ nguyên — quay lại sau 0h để đánh tiếp.</small>`;
        else if (!A.supporter && sc.supRev > 0 && !this.survNudged && (sum.wave || 0) >= 5) { this.survNudged = true; $('resCoins').innerHTML += `<br><small class="survnote">☕ Người tiếp tế được <b>hồi sinh ngay tại chỗ ${sc.supRev} lần/ngày</b> và chiến ${Math.round(sc.supMin / 60 * 10) / 10} giờ mỗi ngày — không phải đánh lại từ khu vực 1.</small>`; }
      }
      $('resStars').innerHTML = [0, 1, 2].map((i) => `<i class="${i < sum.done.length ? 'on' : ''}">★</i>`).join('');
      $('resStats').innerHTML = `
        <div><span>${surv ? 'Wave · điểm' : 'Điểm'}</span><b>${surv ? sum.wave + ' · ' : ''}${sum.score.toLocaleString('vi-VN')}${newBest ? ' <em>KỶ LỤC</em>' : ''}</b></div>
        <div><span>Thời gian</span><b>${mm}:${ss}</b></div>
        <div><span>Hạ gục</span><b>${sum.kills}</b></div>
        <div><span>Chính xác</span><b>${sum.accuracy}%</b></div>
        <div><span>Thử thách</span><b>${sum.done.length}/${sum.totalChallenges}</b></div>
        <div><span>Sức mạnh súng</span><b>PWR ${sum.mods}</b></div>`;
      $('resCloud').innerHTML = MB.Cloud.user ? '' : (sum.gateId >= MB.Access.LOGIN_FROM - 2 ? 'Gate ' + MB.Access.LOGIN_FROM + ' trở đi cần đăng nhập · ' : 'Bạn đang chơi khách · ') + '<button id="btnResLogin" class="sm google"><b class="g">G</b> Đăng nhập để lưu tiến trình & lên bảng xếp hạng</button>';
      const rl = $('btnResLogin'); if (rl) rl.addEventListener('click', () => { G.running = false; this.openAccount(); });
      const next = MB.Gates.meta.find((m) => m.id === sum.gateId + 1);
      $('btnNext').classList.toggle('hidden', !(sum.win && !surv && next && next.file));
      $('btnDonateR').classList.toggle('hidden', !!MB.Access.supporter);
      // người tiếp tế: thỉnh thoảng một lời cảm ơn nhỏ (tối đa 1 lần / ngày, 15% khi thắng)
      if (MB.Access.supporter && sum.win) {
        const day = new Date().toDateString(), fl = sv.flags || (sv.flags = {});
        if (fl.thxDay !== day && Math.random() < 0.15) { fl.thxDay = day; MB.Save.save(); $('resCloud').innerHTML = '<span class="thx">☕ Server vẫn chạy nhờ những Người tiếp tế như bạn. Cảm ơn!</span>'; }
      }
      this.show('result');
      // Trạm tiếp tế: 1 lần sau khi thắng Gate 10; cửa ác mộng: lần thua đầu + thỉnh thoảng (≤ 1 lần / phiên)
      if (!MB.Access.supporter && !surv) {
        const fl = sv.flags || (sv.flags = {});
        if (sum.gateId === 10 && sum.win && !fl.relay10) { fl.relay10 = true; MB.Save.save(); this.openRelay('act1', sum); }
        else if (sum.starve && !sum.win && !this.relayThisSession && (!fl.relayStarve || Math.random() < 0.3)) { fl.relayStarve = true; MB.Save.save(); this.relayThisSession = true; this.openRelay('starve', sum); }
      }
    },

    /* ---------- Trạm tiếp tế (lời mời ủng hộ, lồng vào cốt truyện) ---------- */
    openRelay(kind, sum) {
      const A = MB.Access, sv = MB.Save.data, life = sv.life || { plays: 0, time: 0, kills: 0 };
      const cleared = Object.values(sv.gates || {}).filter((g) => g && g.cleared).length;
      const stars = Object.values(sv.gates || {}).reduce((a, g) => a + ((g && g.done) || []).length, 0);
      const t = Math.round(life.time / 60), tt = t >= 60 ? `${Math.floor(t / 60)} giờ ${t % 60} phút` : `${t} phút`;
      const L = kind === 'act1' ? [
        ['TIẾP TẾ', 'Hunter đã quét sạch 10 cửa ải. Cuộc chiến ở Việt Nam sắp bắt đầu.'],
        ['TIẾP TẾ', 'Nếu bạn muốn tiếp sức cho chiến dịch, hãy gửi một chút tiếp tế cho đội phát triển.'],
      ] : [
        ['HUNTER', 'Hết đạn… hết thuốc… Trạm tiếp tế, nghe rõ không?'],
        ['TIẾP TẾ', 'Đoàn tiếp tế đã sẵn sàng nhưng thiếu nhiên liệu để bay tới Hà Nội.'],
        ['TIẾP TẾ', 'Một chút tiếp sức từ bạn sẽ đưa đạn dược tới tay Hunter — và lũ quái sẽ trở lại bình thường.'],
      ];
      $('relayBody').innerHTML = `<div class="relay-head"><span class="rdot"></span>KÊNH TIẾP TẾ · ${kind === 'act1' ? 'BÁO CÁO CHIẾN DỊCH' : 'KHẨN CẤP'}</div>
        <div class="relay-lines">${L.map(([w, x], i) => `<p style="animation-delay:${i * 0.9}s"><b>${w}</b>${esc(x)}</p>`).join('')}</div>
        <div class="relay-stats"><div><b>${life.kills.toLocaleString('vi-VN')}</b><span>quái đã hạ</span></div><div><b>${tt}</b><span>chiến đấu</span></div><div><b>${cleared}</b><span>cửa đã qua</span></div><div><b>${stars}★</b><span>thử thách</span></div></div>
        <p class="relay-note">Game do một người làm — miễn phí, không quảng cáo. Người tiếp tế nhận huy hiệu <b>☕ Người tiếp tế</b> trên bảng xếp hạng và hồ sơ Hunter${A.cfg.starve && A.cfg.starve.enabled ? ', và đoàn tiếp tế sẽ tới kịp ở các vùng ác mộng' : ''}.</p>
        <div id="relayBar"></div>
        <div class="btns relay-btns"><button id="rDonate" class="donate">☕ TIẾP TẾ CHO HUNTER</button><button id="rGo">CHIẾN TIẾP →</button></div>`;
      this.serverBar($('relayBar'));
      $('rDonate').onclick = () => { MB.Audio.play('ui'); this.openDonate('result'); };
      $('rGo').onclick = () => { MB.Audio.play('ui'); if (kind === 'act1' || kind === 'starve') this.playGate(kind === 'act1' ? 11 : sum.gateId); };
      this.show('relay');
    },
    // thanh "chi phí server tháng này" (admin đặt mục tiêu)
    async serverBar(el) {
      const S = MB.Access.cfg.server || {}; if (!el || !S.goal) return;
      const got = await MB.Access.monthSupport(); if (got == null) return;
      const v = got + (S.extra || 0), k = Math.min(1, v / S.goal);
      el.innerHTML = `<div class="sbar"><div class="sbar-h"><span>${esc(S.label || 'Chi phí server tháng này')}</span><b>${Math.round(k * 100)}%</b></div><div class="sbar-t"><i style="width:${k * 100}%"></i></div><small>${MB.Access.price(v)} / ${MB.Access.price(S.goal)}</small></div>`;
    },
    // lần đầu nhận ra người chơi đã tiếp tế: cảm ơn 1 lần
    // người chơi được admin xác nhận tiếp tế (mỗi lần tiếp tế mới) → ngôi sao cảm ơn sáng rực, hiện ở màn menu (không chen vào trận)
    queueThanks() {
      const A = MB.Access, u = MB.Cloud.user; if (!u || !A.support) return;
      const fl = MB.Save.data.flags || (MB.Save.data.flags = {}), seen = (fl.thx || {})[u.id] || 0;
      if (A.support.times > seen) { this.thanksPending = true; if (['menu', 'gates', 'result', 'account', 'dossier'].includes(this.current)) this.showThanks(); }
      this.renderAccount();
    },
    showThanks() {
      const A = MB.Access, u = MB.Cloud.user, sp = A.support; if (!u || !sp) return;
      this.thanksPending = false; this.thanksBack = this.current || 'menu';
      const fl = MB.Save.data.flags || (MB.Save.data.flags = {}); fl.thx = fl.thx || {}; fl.thx[u.id] = sp.times; MB.Save.save();
      const d = A.lastDon, use = (d && d.note) || 'duy trì server và phát triển những màn chơi mới';
      $('thxBody').innerHTML = `<div class="star-wrap"><div class="rays"></div><svg class="bigstar" viewBox="0 0 100 100" aria-hidden="true"><defs><radialGradient id="sg" cx="50%" cy="40%" r="60%"><stop offset="0" stop-color="#fffbe0"/><stop offset=".55" stop-color="#ffd84a"/><stop offset="1" stop-color="#ff9e1a"/></radialGradient></defs><path d="M50 6l12.6 27.6 30.2 3.4-22.6 20.4 6.4 29.8L50 72.2 23.4 87.2l6.4-29.8L7.2 37l30.2-3.4z" fill="url(#sg)" stroke="#fff3b0" stroke-width="2" stroke-linejoin="round"/></svg>
        ${[0, 1, 2, 3, 4, 5].map((i) => `<i class="spark s${i}"></i>`).join('')}</div>
        <h2 class="thx-title">CẢM ƠN NGƯỜI TIẾP TẾ!</h2>
        <p>${d && d.amount ? `Khoản tiếp tế <b>${A.price(d.amount)}</b> của bạn đã đến nơi.` : 'Khoản tiếp tế của bạn đã đến nơi.'}</p>
        <p class="thx-use">Đã được dùng cho: <b>${esc(use)}</b></p>
        <p class="hint">Tổng bạn đã tiếp sức: ${A.price(sp.total)} · ${sp.times} lần. Huy hiệu ☕ Người tiếp tế đã hiện trên bảng xếp hạng và hồ sơ Hunter.</p>
        <div class="btns"><button id="thxGo" class="primary">TIẾP TỤC CHIẾN ĐẤU</button></div>`;
      $('thxGo').onclick = () => { MB.Audio.play('ui'); this.show(this.thanksBack === 'thanks' ? 'menu' : this.thanksBack); };
      MB.Audio.play('weapon'); MB.haptic && MB.haptic([30, 40, 60]);
      this.show('thanks');
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
          <option value="3d"${st.view === '3d' ? ' selected' : ''}>3D</option></select></label>
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
