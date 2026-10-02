/* Monster Breakout — âm thanh tổng hợp bằng WebAudio (không cần file mp3) */
'use strict';
(function (MB) {
  const A = MB.Audio = {
    ctx: null, out: null, sfx: null, mus: null, noiseBuf: null,
    on: { sfx: true, music: true },
    last: {},
    music: null,

    unlock() {
      if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      try {
        this.ctx = new AC();
        this.out = this.ctx.createGain(); this.out.gain.value = 0.7; this.out.connect(this.ctx.destination);
        this.sfx = this.ctx.createGain(); this.sfx.gain.value = 0.85; this.sfx.connect(this.out);
        this.mus = this.ctx.createGain(); this.mus.gain.value = this.on.music ? 0.5 : 0; this.mus.connect(this.out);
        const len = this.ctx.sampleRate;
        this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
        const d = this.noiseBuf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      } catch (e) { this.ctx = null; }
    },
    set(kind, v) {
      this.on[kind] = v;
      if (kind === 'music' && this.mus && this.ctx) this.mus.gain.setTargetAtTime(v ? 0.5 : 0, this.ctx.currentTime, 0.2);
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
      const gap = { hit: 35, shot_smg: 45, shot_rifle: 55, kill: 45, spit: 60, break: 60 }[name] || 25;
      if (this.last[name] && now - this.last[name] < gap) return;
      this.last[name] = now;
      const fn = SFX[name];
      if (fn) { try { fn(this); } catch (e) { /* ignore */ } }
    },

    // nhạc nền: drone tối giản, tăng cường độ khi đánh boss
    startMusic() {
      if (!this.ctx || this.music) return;
      const c = this.ctx;
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
      this.music.f.frequency.setTargetAtTime(260 + k * 500, t, 0.8);
      this.music.g.gain.setTargetAtTime(0.06 + k * 0.05, t, 0.8);
    },
    stopMusic() {
      if (!this.music) return;
      const m = this.music; this.music = null;
      m.g.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.3);
      setTimeout(() => m.nodes.forEach((o) => { try { o.stop(); } catch (e) { /* ignore */ } }), 1200);
    },
  };

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
    heal: (a) => arp(a, [523, 784], 'sine', 0.08, 0.16, 0.14),
    ui: (a) => a.tone('triangle', 700, 700, 0.05, 0.09),
    win: (a) => arp(a, [523, 659, 784, 1046, 1318, 1568], 'triangle', 0.11, 0.3, 0.16),
    lose: (a) => arp(a, [392, 330, 262, 196], 'sawtooth', 0.18, 0.35, 0.1),
  };
})(window.MB);
