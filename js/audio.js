/* Monster Breakout — âm thanh (v6.5)
   - Hiệu ứng & nhạc nền dạng file (assets/audio): tự dựng từ mẫu âm CC0 (Sonic Pi / freesound, Kenney) + tổng hợp offline.
   - Chưa tải xong file (hoặc lỗi mạng) thì dùng âm tổng hợp WebAudio bên dưới làm dự phòng. */
'use strict';
(function (MB) {
  const A = MB.Audio = {
    ctx: null, out: null, sfx: null, mus: null, noiseBuf: null,
    on: { sfx: true, music: true }, muted: false, wantMenu: false, menu: null,
    last: {},
    music: null,
    buf: {}, mbuf: {}, voices: {}, lastVar: {}, loading: false,
    // số biến thể của mỗi hiệu ứng (tên_1.mp3, tên_2.mp3 …)
    SAMPLES: { boom: 3, boss: 1, break: 2, challenge: 1, dash: 2, drone: 1, empty: 1, growl: 4, heal: 1, hit: 4, hurt: 2, kill: 3, lash: 1, lose: 1, mod: 1, nova: 1, pickup: 1,
      reload: 1, reload_done: 1, roar: 2, shot_beam: 1, shot_bolt: 1, shot_cryo: 2, shot_disc: 1, shot_flame: 2, shot_gl: 1, shot_missile: 1, shot_plasma: 2, shot_rifle: 3,
      shot_shotgun: 2, shot_smg: 3, shot_sniper: 2, slam: 1, spit: 1, stagger: 1, super_laser: 1, super_orbital: 1, swap: 1, throw: 1, ui: 1, wave: 1, weakhit: 1, weapon: 1, win: 1 },
    // âm lượng từng hiệu ứng (cân bằng với nhau)
    VOL: { hit: 0.32, kill: 0.5, shot_rifle: 0.5, shot_smg: 0.42, shot_shotgun: 0.62, shot_sniper: 0.62, shot_flame: 0.36, shot_gl: 0.55, shot_plasma: 0.45, shot_beam: 0.32,
      shot_cryo: 0.34, shot_bolt: 0.55, shot_missile: 0.5, shot_disc: 0.45, boom: 0.75, growl: 0.32, roar: 0.75, boss: 0.85, ui: 0.35, pickup: 0.5, empty: 0.4, reload: 0.5,
      reload_done: 0.5, swap: 0.45, dash: 0.45, hurt: 0.6, stagger: 0.8, weakhit: 0.38, wave: 0.7, win: 0.75, lose: 0.75, super_orbital: 0.8, super_laser: 0.8 },
    MAXV: { hit: 4, shot_rifle: 5, shot_smg: 5, shot_flame: 3, shot_cryo: 3, shot_beam: 2, kill: 4, boom: 4, growl: 2 },
    LOOPS: { battle: [0.1, 48.1], boss: [0.1, 41.2428], menu: [0.1, 48.1] },
    MUSVOL: 0.42,
    decode(ab) {
      return new Promise((res, rej) => { const p = this.ctx.decodeAudioData(ab, res, rej); if (p && p.then) p.then(res, rej); });
    },
    async fetchBuf(url) { const r = await fetch(url); if (!r.ok) throw new Error(r.status); return this.decode(await r.arrayBuffer()); },
    // tải hiệu ứng (song song tối đa 6 file một lúc)
    loadSamples() {
      if (this.loading || !this.ctx) return;
      this.loading = true;
      const jobs = [];
      for (const k in this.SAMPLES) for (let i = 1; i <= this.SAMPLES[k]; i++) jobs.push([k, this.SAMPLES[k] > 1 ? `${k}_${i}` : k]);
      let idx = 0;
      const next = () => {
        if (idx >= jobs.length) return;
        const [k, f] = jobs[idx++];
        this.fetchBuf(`assets/audio/sfx/${f}.mp3`).then((b) => { (this.buf[k] = this.buf[k] || []).push(b); }).catch(() => {}).then(next);
      };
      for (let i = 0; i < 6; i++) next();
      this.loadMusic('menu');
    },
    loadMusic(name) {
      if (this.mbuf[name] || !this.ctx) return Promise.resolve(this.mbuf[name]);
      this.mbuf[name] = this.fetchBuf(`assets/audio/music/${name}.mp3`).then((b) => { this.mbuf[name] = b; this.onMusicReady(name); return b; }).catch(() => { this.mbuf[name] = null; });
      return this.mbuf[name];
    },
    isBuf(x) { return x && typeof x.getChannelData === 'function'; },
    loopSrc(name, gain) {
      const c = this.ctx, b = this.mbuf[name], L = this.LOOPS[name];
      const s = c.createBufferSource(), g = c.createGain();
      s.buffer = b; s.loop = true; s.loopStart = L[0]; s.loopEnd = Math.min(L[1], b.duration);
      g.gain.value = 0.0001; g.gain.setTargetAtTime(gain, c.currentTime, 0.6);
      s.connect(g); g.connect(this.mus); s.start(c.currentTime + 0.02, L[0]);
      return { s, g };
    },
    // nhạc file tải xong khi đang phát nhạc tổng hợp → chuyển sang nhạc file
    onMusicReady(name) {
      if (!this.ctx) return;
      if (name === 'menu' && this.wantMenu && this.menu && !this.menu.file) { this.menuTheme(false); this.menuTheme(true); }
      if ((name === 'battle' || name === 'boss') && this.music && !this.music.file && this.isBuf(this.mbuf.battle) && this.isBuf(this.mbuf.boss)) {
        const k = this.music.k || 0.2; this.stopMusic(); this.startMusic(); this.intensity(k);
      }
    },

    // iPhone: âm thanh web mặc định bị tắt theo nút gạt im lặng. Khi nút loa của game đang BẬT,
    // chuyển phiên âm thanh sang "playback" (như app nghe nhạc) để vẫn có tiếng dù máy đang im lặng.
    // Khi người chơi TẮT loa trong game thì trả về mặc định, không chiếm âm thanh của app khác.
    isIOS() { return /iphone|ipad|ipod/i.test(navigator.userAgent) || (/macintosh/i.test(navigator.userAgent) && 'ontouchend' in document); },
    playback(on) {
      try { if (navigator.audioSession) navigator.audioSession.type = on ? 'playback' : 'auto'; } catch (e) { /* iOS < 17 */ }
      if (!this.isIOS()) return;
      if (on && !this.silent) {
        // đoạn WAV im lặng 0,5 giây phát lặp: cách giữ phiên "playback" trên iOS cũ
        const n = 4000, b = new Uint8Array(44 + n), v = new DataView(b.buffer);
        const w = (o, str) => { for (let i = 0; i < str.length; i++) b[o + i] = str.charCodeAt(i); };
        w(0, 'RIFF'); v.setUint32(4, 36 + n, true); w(8, 'WAVEfmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
        v.setUint32(24, 8000, true); v.setUint32(28, 8000, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true); w(36, 'data'); v.setUint32(40, n, true);
        b.fill(128, 44);
        let bin = ''; for (let i = 0; i < b.length; i++) bin += String.fromCharCode(b[i]);
        const el = this.silent = document.createElement('audio');
        el.src = 'data:audio/wav;base64,' + btoa(bin); el.loop = true; el.preload = 'auto';
        el.setAttribute('playsinline', ''); el.setAttribute('x-webkit-airplay', 'deny');
      }
      if (!this.silent) return;
      if (on && this.silent.paused && !document.hidden) { const pr = this.silent.play(); if (pr && pr.catch) pr.catch(() => {}); }
      if (!on && !this.silent.paused) this.silent.pause();
    },
    unlock() {
      this.playback(!this.muted);
      // "suspended" (chưa chạm) hoặc "interrupted" (iOS sau khi có cuộc gọi / chuyển app)
      if (this.ctx) {
        const go = () => { if (this.wantMenu && !this.menu) this.menuTheme(true); };
        if (this.ctx.state !== 'running') this.ctx.resume().then(go).catch(() => {}); else go();
        return;
      }
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      try {
        this.ctx = new AC();
        this.out = this.ctx.createGain(); this.out.gain.value = this.muted ? 0 : 0.7; this.out.connect(this.ctx.destination);
        this.sfx = this.ctx.createGain(); this.sfx.gain.value = 0.85; this.sfx.connect(this.out);
        this.mus = this.ctx.createGain(); this.mus.gain.value = this.on.music ? this.MUSVOL : 0; this.mus.connect(this.out);
        const len = this.ctx.sampleRate;
        this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
        const d = this.noiseBuf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
        // iOS cũ: phải phát 1 mẫu âm trong cùng lần chạm thì ngữ cảnh mới thật sự mở
        const src = this.ctx.createBufferSource(); src.buffer = this.ctx.createBuffer(1, 1, 22050); src.connect(this.ctx.destination); src.start(0);
        if (this.ctx.state !== 'running') this.ctx.resume().catch(() => {});
        if (this.wantMenu) this.menuTheme(true);
        this.loadSamples();
      } catch (e) { this.ctx = null; }
    },
    // nút loa: tắt / bật toàn bộ âm thanh của game
    setMute(m) {
      this.muted = !!m;
      this.playback(!this.muted);
      if (this.out && this.ctx) this.out.gain.setTargetAtTime(m ? 0 : 0.7, this.ctx.currentTime, 0.05);
    },
    // gắn 1 lần: mọi lần chạm/nhấp đều thử mở lại âm thanh (iOS chỉ tính touchend/click là thao tác của người dùng)
    bindUnlock() {
      const f = () => this.unlock();
      ['touchend', 'click', 'keydown'].forEach((ev) => document.addEventListener(ev, f, { capture: true, passive: true }));
      document.addEventListener('visibilitychange', () => {
        if (!this.ctx) return;
        if (document.hidden) { this.ctx.suspend().catch(() => {}); if (this.silent) this.silent.pause(); } else if (this.ctx.state !== 'running') this.ctx.resume().catch(() => {});
      });
    },
    set(kind, v) {
      this.on[kind] = v;
      if (kind === 'music' && this.mus && this.ctx) this.mus.gain.setTargetAtTime(v ? this.MUSVOL : 0, this.ctx.currentTime, 0.2);
    },
    env(g, t, a, d, peak) {
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + a);
      g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
    },
    tone(type, f1, f2, dur, vol, delay) {
      const c = this.ctx, t = c.currentTime + (delay || 0);
      const o = c.createOscillator(), g = c.createGain();
      o.type = type; o.frequency.setValueAtTime(f1, t);
      if (f2 && f2 !== f1) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
      this.env(g, t, 0.005, dur, vol);
      o.connect(g); g.connect(this.sfx);
      o.start(t); o.stop(t + dur + 0.05);
    },
    noise(dur, vol, ftype, f1, f2, delay, Q) {
      const c = this.ctx, t = c.currentTime + (delay || 0);
      const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
      s.buffer = this.noiseBuf;
      f.type = ftype; f.frequency.setValueAtTime(f1, t);
      if (f2) f.frequency.exponentialRampToValueAtTime(f2, t + dur);
      f.Q.value = Q || 1;
      this.env(g, t, 0.003, dur, vol);
      s.connect(f); f.connect(g); g.connect(this.sfx);
      s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
    },
    play(name) {
      if (!this.ctx || !this.on.sfx || this.ctx.state !== 'running') return;
      const now = performance.now();
      const gap = { hit: 35, shot_smg: 45, shot_rifle: 55, kill: 45, spit: 60, break: 60, shot_flame: 90, shot_cryo: 110, growl: 900, weakhit: 120 }[name] || 25;
      if (this.last[name] && now - this.last[name] < gap) return;
      this.last[name] = now;
      const list = this.buf[name];
      if (list && list.length) {
        // phát mẫu âm: chọn biến thể khác lần trước, lệch cao độ nhẹ cho đỡ lặp
        const v = this.voices[name] || 0, max = this.MAXV[name] || 3;
        if (v >= max) return;
        let i = Math.floor(Math.random() * list.length);
        if (list.length > 1 && i === this.lastVar[name]) i = (i + 1) % list.length;
        this.lastVar[name] = i;
        const c = this.ctx, s = c.createBufferSource(), g = c.createGain();
        s.buffer = list[i];
        s.playbackRate.value = /^shot_|^hit|^kill|^growl|^boom/.test(name) ? 0.94 + Math.random() * 0.12 : 1;
        g.gain.value = this.VOL[name] || 0.55;
        s.connect(g); g.connect(this.sfx);
        this.voices[name] = v + 1;
        s.onended = () => { this.voices[name] = Math.max(0, (this.voices[name] || 1) - 1); };
        s.start();
        return;
      }
      const fn = SFX[name] || SFX[FALLBACK[name]];
      if (fn) { try { fn(this); } catch (e) { /* ignore */ } }
    },

    /* ---------- nhạc chủ đề ở menu: hồi hộp, nguy hiểm ----------
       tiếng tim đập "thình thịch", ostinato giọng thứ (Rê thứ) đều đặn, nền trầm rung rùng rợn,
       thỉnh thoảng có hợp âm nghịch tai và tiếng rít kim loại. Lịch phát đặt trước theo đồng hồ âm thanh. */
    menuTheme(on) {
      this.wantMenu = on;
      if (!on) {
        if (!this.menu) return;
        const m = this.menu; this.menu = null; clearInterval(m.timer);
        m.g.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.35);
        setTimeout(() => m.nodes.forEach((o) => { try { o.stop(); } catch (e) { /* ignore */ } }), 1600);
        return;
      }
      if (!this.ctx || this.menu || this.ctx.state !== 'running') return;
      if (this.isBuf(this.mbuf.menu)) {
        const l = this.loopSrc('menu', 1);
        this.menu = { g: l.g, nodes: [l.s], file: true, timer: 0 };
        return;
      }
      this.loadMusic('menu');
      const c = this.ctx, g = c.createGain();
      g.gain.setValueAtTime(0.0001, c.currentTime); g.gain.exponentialRampToValueAtTime(1, c.currentTime + 2.5);
      g.connect(this.mus);
      // nền trầm: 2 sawtooth lệch nhẹ + quãng 5, qua lọc thấp có LFO chậm
      const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 220; f.Q.value = 6;
      const dg = c.createGain(); dg.gain.value = 0.07;
      const o1 = c.createOscillator(), o2 = c.createOscillator(), o3 = c.createOscillator(), lfo = c.createOscillator(), lg = c.createGain();
      o1.type = 'sawtooth'; o1.frequency.value = 36.7; o2.type = 'sawtooth'; o2.frequency.value = 36.95; o3.type = 'triangle'; o3.frequency.value = 55;
      lfo.frequency.value = 0.06; lg.gain.value = 120; lfo.connect(lg); lg.connect(f.frequency);
      o1.connect(f); o2.connect(f); o3.connect(f); f.connect(dg); dg.connect(g);
      [o1, o2, o3, lfo].forEach((o) => o.start());
      const m = this.menu = { g, nodes: [o1, o2, o3, lfo], next: c.currentTime + 0.3, step: 0 };
      const BPM = 92, S = 60 / BPM / 4; // 1 phách = 4 bước
      const D = 146.83;
      const ost = [1, 0, 1.189, 0, 1.498, 0, 1.189, 1.335, 1, 0, 1.189, 0, 1.587, 0, 1.498, 1.335]; // Rê-Fa-La-Sib…
      const note = (t, freq, dur, vol, type, cut) => {
        const o = c.createOscillator(), ng = c.createGain(), nf = c.createBiquadFilter();
        o.type = type || 'square'; o.frequency.setValueAtTime(freq, t);
        nf.type = 'lowpass'; nf.frequency.setValueAtTime(cut || 1400, t); nf.frequency.exponentialRampToValueAtTime(300, t + dur);
        ng.gain.setValueAtTime(0.0001, t); ng.gain.exponentialRampToValueAtTime(vol, t + 0.008); ng.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(nf); nf.connect(ng); ng.connect(g); o.start(t); o.stop(t + dur + 0.05);
      };
      const thump = (t, vol) => {
        const o = c.createOscillator(), ng = c.createGain();
        o.type = 'sine'; o.frequency.setValueAtTime(95, t); o.frequency.exponentialRampToValueAtTime(38, t + 0.16);
        ng.gain.setValueAtTime(0.0001, t); ng.gain.exponentialRampToValueAtTime(vol, t + 0.01); ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
        o.connect(ng); ng.connect(g); o.start(t); o.stop(t + 0.32);
      };
      const stab = (t) => { [1, 1.059, 1.414].forEach((k) => note(t, D * 2 * k, 1.6, 0.025, 'sawtooth', 2200)); };
      const screech = (t) => {
        const s = c.createBufferSource(), sf = c.createBiquadFilter(), sg = c.createGain();
        s.buffer = this.noiseBuf; sf.type = 'bandpass'; sf.Q.value = 18;
        sf.frequency.setValueAtTime(900, t); sf.frequency.exponentialRampToValueAtTime(3800, t + 1.4);
        sg.gain.setValueAtTime(0.0001, t); sg.gain.exponentialRampToValueAtTime(0.05, t + 0.6); sg.gain.exponentialRampToValueAtTime(0.0001, t + 1.5);
        s.connect(sf); sf.connect(sg); sg.connect(g); s.start(t, Math.random() * 0.4); s.stop(t + 1.6);
      };
      m.timer = setInterval(() => {
        if (!this.menu || this.ctx.state !== 'running') return;
        while (m.next < c.currentTime + 0.25) {
          const t = m.next, i = m.step, bar = Math.floor(i / 16), k = i % 16;
          if (k === 0 || k === 3) thump(t, k === 0 ? 0.5 : 0.32);          // tim đập: thình…thịch
          if (bar % 8 >= 2 && ost[k]) note(t, D * ost[k] * (bar % 8 >= 6 ? 2 : 1), S * 1.6, 0.045, 'square', 1200 + (bar % 4) * 300);
          if (bar % 8 >= 4 && k % 4 === 2) note(t, D * 4 * ost[(k + bar) % 16 || 1], 0.09, 0.018, 'triangle', 4000); // nhịp kim nhọn
          if (k === 0 && bar % 8 === 7) stab(t);
          if (k === 8 && bar % 16 === 11) screech(t);
          m.step++; m.next += S;
        }
      }, 40);
    },

    // nhạc nền trong trận: drone tối giản, tăng cường độ khi đánh boss
    startMusic() {
      this.menuTheme(false);
      if (!this.ctx || this.music) return;
      const c = this.ctx;
      if (this.isBuf(this.mbuf.battle) && this.isBuf(this.mbuf.boss)) {
        const a = this.loopSrc('battle', 0.75), b = this.loopSrc('boss', 0.0001);
        this.music = { file: true, a, b, k: 0, nodes: [a.s, b.s] };
        return;
      }
      this.loadMusic('battle'); this.loadMusic('boss');
      const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 260; f.Q.value = 4;
      const g = c.createGain(); g.gain.value = 0.06;
      const o1 = c.createOscillator(), o2 = c.createOscillator(), o3 = c.createOscillator();
      o1.type = 'sawtooth'; o1.frequency.value = 55;
      o2.type = 'sawtooth'; o2.frequency.value = 55.6;
      o3.type = 'sine'; o3.frequency.value = 82.4;
      const lfo = c.createOscillator(), lg = c.createGain();
      lfo.frequency.value = 0.08; lg.gain.value = 140;
      lfo.connect(lg); lg.connect(f.frequency);
      o1.connect(f); o2.connect(f); o3.connect(f); f.connect(g); g.connect(this.mus);
      [o1, o2, o3, lfo].forEach((o) => o.start());
      this.music = { f, g, nodes: [o1, o2, o3, lfo] };
    },
    intensity(k) {
      if (!this.music) return;
      const t = this.ctx.currentTime;
      this.music.k = k;
      if (this.music.file) {
        const boss = k >= 0.95;
        this.music.a.g.gain.setTargetAtTime(boss ? 0.0001 : 0.55 + 0.45 * Math.min(1, k), t, 1.0);
        this.music.b.g.gain.setTargetAtTime(boss ? 1 : 0.0001, t, 1.0);
        return;
      }
      this.music.f.frequency.setTargetAtTime(260 + k * 500, t, 0.8);
      this.music.g.gain.setTargetAtTime(0.06 + k * 0.05, t, 0.8);
    },
    stopMusic() {
      if (!this.music) return;
      const m = this.music; this.music = null;
      if (m.file) { m.a.g.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.3); m.b.g.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.3); }
      else m.g.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.3);
      setTimeout(() => m.nodes.forEach((o) => { try { o.stop(); } catch (e) { /* ignore */ } }), 1200);
    },
  };

  // âm dự phòng cho hiệu ứng mới khi chưa tải file
  const FALLBACK = { shot_beam: 'shot_plasma', shot_cryo: 'shot_flame', shot_bolt: 'shot_sniper', shot_missile: 'shot_gl', shot_disc: 'shot_rifle', growl: 'roar',
    stagger: 'slam', weakhit: 'hit', super_orbital: 'boom', super_laser: 'nova', drone: 'mod' };
  const arp = (a, notes, type, step, dur, vol) => notes.forEach((f, i) => a.tone(type, f, f, dur, vol, i * step));
  const SFX = {
    shot_rifle: (a) => { a.noise(0.07, 0.32, 'highpass', 1800, 600); a.tone('square', 180, 60, 0.07, 0.14); },
    shot_smg: (a) => { a.noise(0.05, 0.24, 'highpass', 2400, 900); a.tone('square', 230, 90, 0.05, 0.08); },
    shot_shotgun: (a) => { a.noise(0.24, 0.5, 'lowpass', 3200, 260); a.tone('sine', 110, 40, 0.2, 0.4); },
    hit: (a) => a.tone('triangle', 900, 520, 0.04, 0.07),
    kill: (a) => { a.noise(0.18, 0.28, 'lowpass', 900, 150); a.tone('sawtooth', 160, 50, 0.14, 0.07); },
    hurt: (a) => { a.tone('sawtooth', 260, 90, 0.18, 0.2); a.noise(0.1, 0.2, 'lowpass', 800, 200); },
    dash: (a) => a.noise(0.18, 0.22, 'bandpass', 600, 2400, 0, 2),
    reload: (a) => { a.tone('square', 1200, 900, 0.03, 0.07); a.tone('square', 800, 600, 0.03, 0.07, 0.14); },
    reload_done: (a) => a.tone('square', 1500, 1300, 0.035, 0.09),
    empty: (a) => a.tone('square', 300, 280, 0.03, 0.07),
    pickup: (a) => { a.tone('sine', 660, 660, 0.08, 0.14); a.tone('sine', 990, 990, 0.12, 0.14, 0.07); },
    mod: (a) => arp(a, [523, 659, 784, 1046], 'triangle', 0.07, 0.14, 0.15),
    weapon: (a) => arp(a, [392, 494, 587, 784, 988], 'square', 0.06, 0.12, 0.08),
    challenge: (a) => arp(a, [392, 523, 659, 784, 1046, 1318], 'triangle', 0.08, 0.2, 0.15),
    swap: (a) => a.tone('square', 500, 720, 0.05, 0.07),
    wave: (a) => { a.tone('sawtooth', 196, 196, 0.35, 0.1); a.tone('sawtooth', 294, 294, 0.5, 0.1, 0.3); },
    boss: (a) => { a.tone('sawtooth', 70, 38, 1.3, 0.3); a.noise(1.0, 0.22, 'lowpass', 420, 80); },
    roar: (a) => { a.tone('sawtooth', 120, 50, 0.8, 0.25); a.noise(0.7, 0.2, 'bandpass', 500, 120, 0, 2); },
    slam: (a) => { a.noise(0.5, 0.5, 'lowpass', 520, 60); a.tone('sine', 80, 30, 0.5, 0.5); },
    break: (a) => a.noise(0.25, 0.32, 'bandpass', 1200, 300, 0, 1.5),
    spit: (a) => a.noise(0.12, 0.14, 'bandpass', 1500, 500, 0, 3),
    lash: (a) => a.noise(0.14, 0.18, 'bandpass', 2600, 700, 0, 4),
    shot_sniper: (a) => { a.noise(0.2, 0.45, 'highpass', 900, 200); a.tone('sawtooth', 900, 120, 0.25, 0.18); },
    shot_flame: (a) => a.noise(0.09, 0.12, 'bandpass', 700, 400, 0, 0.8),
    shot_gl: (a) => { a.tone('sine', 160, 70, 0.18, 0.35); a.noise(0.1, 0.2, 'lowpass', 900, 300); },
    shot_plasma: (a) => { a.tone('square', 1200, 300, 0.12, 0.08); a.tone('sine', 600, 200, 0.12, 0.12); },
    throw: (a) => a.noise(0.15, 0.15, 'bandpass', 900, 2200, 0, 2),
    boom: (a) => { a.noise(0.7, 0.6, 'lowpass', 1400, 60); a.tone('sine', 90, 30, 0.6, 0.55); },
    nova: (a) => { a.tone('sawtooth', 200, 900, 0.3, 0.12); a.noise(0.4, 0.3, 'bandpass', 3000, 400, 0, 1.5); a.tone('sine', 120, 40, 0.4, 0.4); },
    heal: (a) => arp(a, [523, 784], 'sine', 0.08, 0.16, 0.14),
    ui: (a) => a.tone('triangle', 700, 700, 0.05, 0.09),
    win: (a) => arp(a, [523, 659, 784, 1046, 1318, 1568], 'triangle', 0.11, 0.3, 0.16),
    lose: (a) => arp(a, [392, 330, 262, 196], 'sawtooth', 0.18, 0.35, 0.1),
  };
})(window.MB);
