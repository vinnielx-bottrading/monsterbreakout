/* Monster Breakout — cốt truyện: cảnh chuyển (cutscene), bộ đàm trong trận, mảnh manh mối của Giáo sư Ted.
   Màn 2 "Nguồn Gốc": sau Gate 10, AI GoatEvil xuất hiện, Giáo sư Ted bị "sát hại", để lại mẩu giấy dẫn Hunter về Việt Nam.
   (Sự thật — chỉ hé lộ ở cuối Màn 2: chính Ted dựng nên vở kịch này để thâu tóm thế giới.) */
'use strict';
(function (MB) {
  const U = MB.U;
  const $ = (id) => document.getElementById(id);
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ================= ÂM THANH RIÊNG CHO CỐT TRUYỆN ================= */
  const SND = {
    ok() { const A = MB.Audio; return A.ctx && A.ctx.state === 'running' && A.on.sfx ? A : null; },
    glitch() {
      const A = this.ok(); if (!A) return;
      for (let i = 0; i < 6; i++) A.noise(0.04 + Math.random() * 0.06, 0.22, 'bandpass', 400 + Math.random() * 3000, 0, i * 0.05 + Math.random() * 0.03, 6);
      A.tone('square', 1800, 90, 0.18, 0.05);
    },
    type() { const A = this.ok(); if (A) A.tone('square', 1300 + Math.random() * 300, 0, 0.012, 0.012); },
    // tiếng cười méo tiếng điện tử: chuỗi "ha" qua 2 dải cộng hưởng (giọng) + méo + bè trầm quãng tám
    laugh() {
      const A = this.ok(); if (!A) return;
      const c = A.ctx, t0 = c.currentTime + 0.05;
      const shaper = c.createWaveShaper(), curve = new Float32Array(256);
      for (let i = 0; i < 256; i++) { const x = i / 128 - 1; curve[i] = Math.tanh(x * 6) * 0.8; }
      shaper.curve = curve;
      const out = c.createGain(); out.gain.value = 0.55; shaper.connect(out); out.connect(A.sfx);
      const f1 = c.createBiquadFilter(), f2 = c.createBiquadFilter();
      f1.type = 'bandpass'; f1.frequency.value = 760; f1.Q.value = 7; f2.type = 'bandpass'; f2.frequency.value = 1240; f2.Q.value = 9;
      f1.connect(shaper); f2.connect(shaper);
      const N = 10;
      for (let i = 0; i < N; i++) {
        const t = t0 + i * 0.19 * (1 - i * 0.025), f = 150 - i * 7 + (i % 2) * 12;
        for (const [mul, vol] of [[1, 0.9], [0.5, 0.6]]) {
          const o = c.createOscillator(), g = c.createGain();
          o.type = 'sawtooth'; o.frequency.setValueAtTime(f * mul * 1.15, t); o.frequency.exponentialRampToValueAtTime(f * mul * 0.82, t + 0.15);
          g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
          o.connect(g); g.connect(f1); g.connect(f2); o.start(t); o.stop(t + 0.2);
        }
        A.noise(0.08, 0.05, 'highpass', 2500, 0, t - c.currentTime + 0.01);
      }
      // tiếng vang cuối, trầm dần
      A.tone('sawtooth', 70, 40, 2.2, 0.05, N * 0.18);
    },
    alarm(n) { const A = this.ok(); if (!A) return; for (let i = 0; i < (n || 4); i++) { A.tone('square', 880, 880, 0.22, 0.035, i * 0.5); A.tone('square', 620, 620, 0.22, 0.035, i * 0.5 + 0.25); } },
    heart() { const A = this.ok(); if (!A) return; A.tone('sine', 90, 40, 0.18, 0.4); A.tone('sine', 80, 38, 0.16, 0.28, 0.24); },
    drone(on) {
      const A = MB.Audio;
      if (!on) { if (this.dr) { const d = this.dr; this.dr = null; d.g.gain.setTargetAtTime(0.0001, A.ctx.currentTime, 0.4); setTimeout(() => d.o.forEach((o) => { try { o.stop(); } catch (e) { /* bỏ qua */ } }), 1800); } return; }
      if (this.dr || !A.ctx || A.ctx.state !== 'running') return;
      const c = A.ctx, g = c.createGain(), f = c.createBiquadFilter();
      f.type = 'lowpass'; f.frequency.value = 300; f.Q.value = 3; g.gain.setValueAtTime(0.0001, c.currentTime); g.gain.exponentialRampToValueAtTime(0.09, c.currentTime + 2);
      const o = [41.2, 41.6, 61.7].map((fr, i) => { const x = c.createOscillator(); x.type = i < 2 ? 'sawtooth' : 'sine'; x.frequency.value = fr; x.connect(f); x.start(); return x; });
      f.connect(g); g.connect(A.mus);
      this.dr = { g, o };
    },
  };

  /* ================= VẼ CẢNH ================= */
  function sky(ctx, w, h, stops) { const g = ctx.createLinearGradient(0, 0, 0, h); stops.forEach(([k, c]) => g.addColorStop(k, c)); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); }
  function skyline(ctx, w, base, hmax, color, seed, broken, fires, t) {
    const r = U.seeded(seed);
    ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(0, base);
    let x = -10;
    const wins = [];
    while (x < w + 20) {
      const bw = 30 + r() * 70, bh = hmax * (0.35 + r() * 0.65);
      const top = base - bh;
      ctx.lineTo(x, top + (broken ? r() * 20 : 0));
      if (broken && r() < 0.6) { ctx.lineTo(x + bw * 0.3, top - r() * 18); ctx.lineTo(x + bw * 0.45, top + 14 + r() * 20); ctx.lineTo(x + bw * 0.7, top - r() * 10); }
      ctx.lineTo(x + bw, top + (broken ? r() * 24 : 0));
      if (fires) for (let i = 0; i < 3; i++) if (r() < 0.35) wins.push([x + 6 + r() * (bw - 14), top + 16 + r() * (bh - 30)]);
      x += bw;
    }
    ctx.lineTo(w + 20, base); ctx.lineTo(w + 20, base + 400); ctx.lineTo(-10, base + 400); ctx.closePath(); ctx.fill();
    for (const [wx, wy] of wins) { const f = 0.5 + Math.sin(t * 7 + wx) * 0.3 + Math.sin(t * 13 + wy) * 0.2; ctx.fillStyle = `rgba(255,${120 + f * 60 | 0},40,${0.35 + f * 0.4})`; ctx.fillRect(wx, wy, 5, 7); }
  }
  // Hunter nhìn từ phía sau (bóng đen viền sáng)
  function hunter(ctx, x, y, s, rim, step) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    const b = step ? Math.sin(step) * 3 : 0;
    ctx.fillStyle = '#05080a';
    ctx.beginPath(); // chân
    ctx.moveTo(-16, 0); ctx.lineTo(-10 + b, -70); ctx.lineTo(10 - b, -70); ctx.lineTo(16, 0); ctx.lineTo(6, 0); ctx.lineTo(0, -50); ctx.lineTo(-6, 0); ctx.closePath(); ctx.fill();
    ctx.beginPath(); // thân + balo
    ctx.moveTo(-26, -72); ctx.quadraticCurveTo(-30, -130, -18, -142); ctx.lineTo(18, -142); ctx.quadraticCurveTo(30, -130, 26, -72); ctx.closePath(); ctx.fill();
    ctx.fillRect(-17, -138, 34, 44); ctx.fillRect(-20, -134, 4, 30); ctx.fillRect(16, -134, 4, 30); // ba lô chiến thuật
    ctx.beginPath(); ctx.ellipse(0, -142, 17, 7, 0, 0, U.TAU); ctx.fill(); // mũ trùm cổ
    ctx.beginPath(); ctx.arc(0, -157, 13.5, 0, U.TAU); ctx.fill(); // đầu
    ctx.beginPath(); // tóc rối
    for (let i = 0; i <= 14; i++) { const a = Math.PI + (i / 14) * Math.PI, r = i % 2 ? 15 : 18.5; const px = Math.cos(a) * r, py = -158 + Math.sin(a) * r; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
    ctx.lineTo(14, -150); ctx.lineTo(-14, -150); ctx.closePath(); ctx.fill();
    ctx.save(); ctx.rotate(0.5); ctx.fillRect(10, -150, 9, 92); ctx.restore(); // súng đeo chéo
    ctx.strokeStyle = rim; ctx.lineWidth = 2.2; ctx.globalAlpha = 0.85;
    ctx.beginPath(); ctx.moveTo(26, -72); ctx.quadraticCurveTo(30, -130, 18, -142); ctx.moveTo(10.6, -170.6); ctx.arc(0, -158, 16.5, -0.9, 0.6); ctx.moveTo(16, 0); ctx.lineTo(10 - b, -70); ctx.stroke();
    ctx.restore();
  }
  // gương mặt dê AI (GoatEvil) dạng ảnh ba chiều, đường nét phát sáng
  function goatHead(ctx, cx, cy, s, t, mouth, alpha) {
    ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s); ctx.globalAlpha = alpha;
    const L = (pts, close) => { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); if (close) ctx.closePath(); ctx.stroke(); };
    for (const pass of [[18, 'rgba(255,40,60,.18)'], [7, 'rgba(255,60,80,.45)'], [2, '#ffd0d6']]) {
      ctx.lineWidth = pass[0]; ctx.strokeStyle = pass[1]; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      for (const sd of [-1, 1]) {
        // sừng xoắn
        ctx.beginPath(); ctx.moveTo(sd * 34, -78);
        ctx.bezierCurveTo(sd * 70, -150, sd * 170, -140, sd * 170, -70);
        ctx.bezierCurveTo(sd * 170, -20, sd * 120, -20, sd * 118, -60);
        ctx.bezierCurveTo(sd * 116, -90, sd * 145, -92, sd * 146, -66); ctx.stroke();
        // tai
        L([[sd * 60, -46], [sd * 128, -34], [sd * 70, -18]], true);
      }
      // sọ dài + mõm
      L([[-60, -70], [-34, -96], [34, -96], [60, -70], [64, -20], [38, 60], [22, 120], [0, 132], [-22, 120], [-38, 60], [-64, -20]], true);
      L([[-38, 60], [0, 74], [38, 60]]);
      L([[-30, -60], [0, -30], [30, -60]]);
      L([[0, -30], [0, 74]]);
      // râu
      L([[-16, 130 + mouth * 6], [-8, 178 + mouth * 8], [0, 196 + mouth * 10], [8, 178 + mouth * 8], [16, 130 + mouth * 6]]);
      // miệng
      L([[-16, 104], [0, 112 + mouth * 14], [16, 104]]);
    }
    // mắt: khe ngang như mắt dê
    for (const sd of [-1, 1]) {
      const ex = sd * 34, ey = -12, gl = ctx.createRadialGradient(ex, ey, 2, ex, ey, 34);
      gl.addColorStop(0, 'rgba(255,60,60,.95)'); gl.addColorStop(1, 'rgba(255,0,40,0)');
      ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(ex, ey, 34, 0, U.TAU); ctx.fill();
      ctx.fillStyle = '#fff3c0'; ctx.beginPath(); ctx.ellipse(ex, ey, 14, 9, 0, 0, U.TAU); ctx.fill();
      ctx.fillStyle = '#120004'; ctx.fillRect(ex - 11, ey - 2.5, 22, 5);
    }
    // vân mạch điện chạy trên sọ
    ctx.strokeStyle = 'rgba(126,243,255,.55)'; ctx.lineWidth = 1.5;
    for (let i = 0; i < 6; i++) { const y = -80 + i * 32 + ((t * 40) % 32); ctx.beginPath(); ctx.moveTo(-50 + i * 6, y); ctx.lineTo(-20, y); ctx.lineTo(-12, y + 8); ctx.lineTo(12, y + 8); ctx.lineTo(20, y); ctx.lineTo(50 - i * 6, y); ctx.stroke(); }
    ctx.restore();
  }
  function glitchSlices(ctx, cv, w, h, k) {
    if (k <= 0) return;
    const n = 3 + (k * 8 | 0);
    for (let i = 0; i < n; i++) {
      const y = Math.random() * h, sh = 4 + Math.random() * 30 * k, dx = (Math.random() - 0.5) * 80 * k;
      try { ctx.drawImage(cv, 0, y * cv.width / w, cv.width, sh * cv.width / w, dx, y, w, sh); } catch (e) { /* bỏ qua */ }
    }
    ctx.fillStyle = `rgba(255,0,60,${0.08 * k})`; ctx.fillRect(0, 0, w, h);
  }
  function scanlines(ctx, w, h, a) { ctx.fillStyle = `rgba(0,0,0,${a})`; for (let y = 0; y < h; y += 3) ctx.fillRect(0, y, w, 1); }
  function vignette(ctx, w, h, a, col) {
    const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.25, w / 2, h / 2, Math.max(w, h) * 0.75);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, col || `rgba(0,0,0,${a})`); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  }

  const SCENES = {
    // 1. chiến trường sau Gate 10 — GoatEvil hiện hình
    battle(ctx, w, h, t, S) {
      sky(ctx, w, h, [[0, '#14040a'], [0.45, '#3d0a14'], [0.75, '#7a2216'], [1, '#2a0a08']]);
      const mx = w * 0.78, my = h * 0.22, mg = ctx.createRadialGradient(mx, my, 10, mx, my, h * 0.22);
      mg.addColorStop(0, 'rgba(255,120,80,.9)'); mg.addColorStop(0.25, 'rgba(200,40,30,.6)'); mg.addColorStop(1, 'rgba(120,0,0,0)');
      ctx.fillStyle = mg; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#c23a22'; ctx.beginPath(); ctx.arc(mx, my, h * 0.07, 0, U.TAU); ctx.fill();
      // khói trôi
      for (let i = 0; i < 9; i++) { const x = ((i * 233 + t * (12 + i * 3)) % (w + 400)) - 200, y = h * (0.28 + (i % 4) * 0.07); ctx.fillStyle = `rgba(20,6,8,${0.25 + (i % 3) * 0.1})`; U.ellipse(ctx, x, y, 220, 50); ctx.fill(); }
      skyline(ctx, w, h * 0.66, h * 0.32, '#2a0c10', 11, true, true, t);
      skyline(ctx, w, h * 0.74, h * 0.24, '#14060a', 23, true, true, t);
      // xác boss
      ctx.fillStyle = '#070204'; ctx.beginPath(); ctx.moveTo(w * 0.48, h * 0.86);
      ctx.bezierCurveTo(w * 0.52, h * 0.62, w * 0.78, h * 0.58, w * 0.9, h * 0.86); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#070204'; ctx.lineWidth = 9; ctx.lineCap = 'round';
      for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(w * (0.55 + i * 0.07), h * 0.7); ctx.quadraticCurveTo(w * (0.5 + i * 0.09), h * (0.58 - (i % 2) * 0.05), w * (0.47 + i * 0.1), h * (0.66 + (i % 3) * 0.04)); ctx.stroke(); }
      // mặt đất
      sky(ctx, w, h, [[0, 'rgba(0,0,0,0)'], [0.8, 'rgba(0,0,0,0)'], [0.82, '#0a0405'], [1, '#050203']]);
      // tàn lửa bay lên
      for (let i = 0; i < 60; i++) { const k = ((t * 0.12 + i * 0.137) % 1), x = (i * 97 % w) + Math.sin(t + i) * 20, y = h * (1 - k * 0.9); ctx.fillStyle = `rgba(255,${150 + (i % 5) * 20},60,${(1 - k) * 0.8})`; ctx.fillRect(x, y, 2, 2); }
      hunter(ctx, w * 0.24, h * 0.9, h / 520, '#ff5a3a');
      // GoatEvil
      const g = S.goat;
      if (g > 0) {
        const cx = w * 0.66, cy = h * 0.4, flick = g < 1 ? g : 0.82 + Math.sin(t * 30) * 0.08 + (Math.random() < 0.05 ? -0.4 : 0);
        // tia chiếu từ xác boss
        const beam = ctx.createLinearGradient(0, h * 0.75, 0, cy - h * 0.2);
        beam.addColorStop(0, `rgba(255,60,80,${0.35 * flick})`); beam.addColorStop(1, 'rgba(255,60,80,0)');
        ctx.fillStyle = beam; ctx.beginPath(); ctx.moveTo(w * 0.64, h * 0.74); ctx.lineTo(cx - h * 0.3, cy - h * 0.25); ctx.lineTo(cx + h * 0.3, cy - h * 0.25); ctx.lineTo(w * 0.68, h * 0.74); ctx.closePath(); ctx.fill();
        const sh = S.laughing ? Math.sin(t * 40) * 6 : 0;
        ctx.globalCompositeOperation = 'lighter';
        goatHead(ctx, cx - 4 + sh, cy, h / 900, t, S.mouth || 0, flick * 0.5);
        goatHead(ctx, cx + 4 + sh, cy, h / 900, t, S.mouth || 0, flick * 0.5);
        ctx.globalCompositeOperation = 'source-over';
        goatHead(ctx, cx + sh, cy, h / 900, t, S.mouth || 0, flick);
      }
      // vỡ thành điểm ảnh khi biến mất
      if (S.shatter) for (const q of S.shatter) { ctx.fillStyle = q.c; ctx.globalAlpha = Math.max(0, q.l); ctx.fillRect(q.x, q.y, q.s, q.s); }
      ctx.globalAlpha = 1;
      vignette(ctx, w, h, 0.75);
    },
    // 2. căn cứ: phòng thí nghiệm bị phá, Giáo sư Ted gục ngã
    lab(ctx, w, h, t) {
      ctx.fillStyle = '#07090b'; ctx.fillRect(0, 0, w, h);
      const vx = w * 0.5, vy = h * 0.42, bw = w * 0.42, bh = h * 0.34;
      const bx0 = vx - bw / 2, by0 = vy - bh / 2;
      // tường sau, sàn, trần (phối cảnh 1 điểm tụ)
      ctx.fillStyle = '#141a1e'; ctx.fillRect(bx0, by0, bw, bh);
      ctx.fillStyle = '#0d1114'; ctx.beginPath(); ctx.moveTo(0, h); ctx.lineTo(bx0, by0 + bh); ctx.lineTo(bx0 + bw, by0 + bh); ctx.lineTo(w, h); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#0a0d10'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(bx0, by0); ctx.lineTo(bx0 + bw, by0); ctx.lineTo(w, 0); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#10151a'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(bx0, by0); ctx.lineTo(bx0, by0 + bh); ctx.lineTo(0, h); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(w, 0); ctx.lineTo(bx0 + bw, by0); ctx.lineTo(bx0 + bw, by0 + bh); ctx.lineTo(w, h); ctx.closePath(); ctx.fill();
      // gạch sàn tụ về điểm
      ctx.strokeStyle = 'rgba(120,150,160,.12)'; ctx.lineWidth = 1;
      for (let i = -6; i <= 6; i++) { ctx.beginPath(); ctx.moveTo(vx + i * bw / 12, by0 + bh); ctx.lineTo(vx + i * w / 6, h); ctx.stroke(); }
      for (let k = 1; k < 7; k++) { const y = by0 + bh + (h - by0 - bh) * Math.pow(k / 7, 1.8); ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
      // màn hình vỡ chập chờn trên tường sau
      for (let i = 0; i < 4; i++) {
        const sx = bx0 + 16 + i * (bw - 32) / 4, sy = by0 + 18, sw = (bw - 32) / 4 - 12, shh = bh * 0.38;
        ctx.fillStyle = '#05070a'; ctx.fillRect(sx, sy, sw, shh);
        const on = Math.sin(t * (5 + i * 3)) > -0.2 || i === 2;
        if (on) { ctx.fillStyle = i === 1 ? 'rgba(255,60,70,.55)' : 'rgba(110,220,255,.35)'; for (let y = 0; y < shh; y += 3) if (Math.random() < 0.7) ctx.fillRect(sx, sy + y, sw * (0.3 + Math.random() * 0.7), 2); }
        if (i === 1) { ctx.fillStyle = '#ff4a5a'; ctx.font = `800 ${Math.max(9, bh * 0.05)}px system-ui`; ctx.fillText('G04T_EV1L', sx + 6, sy + shh * 0.55); }
        ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.beginPath(); ctx.moveTo(sx + sw * 0.2, sy); ctx.lineTo(sx + sw * 0.5, sy + shh * 0.6); ctx.lineTo(sx + sw * 0.8, sy + shh); ctx.stroke();
      }
      // bồn mẫu vỡ bên phải + dịch xanh tràn
      const tx = w * 0.82, ty = h * 0.5;
      ctx.fillStyle = 'rgba(120,255,140,.08)'; U.ellipse(ctx, tx - 30, h * 0.86, 170, 40); ctx.fill();
      ctx.strokeStyle = 'rgba(180,230,255,.35)'; ctx.lineWidth = 4; ctx.strokeRect(tx - 50, ty - 120, 100, 220);
      ctx.fillStyle = 'rgba(160,255,160,.15)'; ctx.fillRect(tx - 48, ty + 40, 96, 58);
      ctx.strokeStyle = 'rgba(200,240,255,.5)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(tx - 50, ty - 30); ctx.lineTo(tx - 10, ty - 60); ctx.lineTo(tx + 30, ty - 20); ctx.lineTo(tx + 50, ty - 50); ctx.stroke();
      // Giáo sư Ted nằm trên sàn
      const px = w * 0.52, py = h * 0.8, s = h / 700;
      ctx.save(); ctx.translate(px, py); ctx.scale(s, s);
      ctx.fillStyle = 'rgba(80,0,0,.55)'; U.ellipse(ctx, 20, 18, 190, 34); ctx.fill();
      ctx.fillStyle = '#d9dcd6'; ctx.beginPath(); ctx.moveTo(-150, 6); ctx.quadraticCurveTo(-60, -40, 60, -24); ctx.lineTo(120, -8); ctx.lineTo(120, 16); ctx.quadraticCurveTo(0, 30, -150, 22); ctx.closePath(); ctx.fill(); // áo blouse
      ctx.fillStyle = '#2a2a30'; ctx.fillRect(-210, 4, 70, 16); ctx.fillRect(-205, -12, 66, 14); // chân
      ctx.fillStyle = '#c9a68a'; ctx.beginPath(); ctx.arc(146, -2, 22, 0, U.TAU); ctx.fill(); // đầu
      ctx.fillStyle = '#e8e8e8'; ctx.beginPath(); ctx.arc(152, -12, 18, Math.PI * 1.05, Math.PI * 2.1); ctx.fill(); // tóc bạc
      ctx.strokeStyle = '#111'; ctx.lineWidth = 2; ctx.strokeRect(186, 18, 18, 8); ctx.strokeRect(208, 20, 18, 8); // kính rơi
      ctx.fillStyle = '#c9a68a'; ctx.save(); ctx.translate(60, -20); ctx.rotate(-0.5); ctx.fillRect(0, -6, 110, 12); ctx.restore(); // cánh tay vươn ra
      ctx.save(); ctx.translate(152, -78); ctx.rotate(-0.3); ctx.fillStyle = '#e9dcb8'; ctx.fillRect(-14, -10, 30, 22); ctx.fillStyle = '#3a2416'; ctx.fillRect(-14, 8, 30, 4); ctx.restore(); // mẩu giấy
      ctx.restore();
      // giấy tờ vương vãi
      const r = U.seeded(4);
      for (let i = 0; i < 14; i++) { ctx.save(); ctx.translate(w * (0.15 + r() * 0.7), h * (0.7 + r() * 0.28)); ctx.rotate(r() * 3); ctx.fillStyle = `rgba(220,220,210,${0.25 + r() * 0.35})`; ctx.fillRect(-14, -10, 28, 20); ctx.restore(); }
      // đèn báo động quét đỏ
      const a = t * 2.2, lx = w * 0.5, ly = 0;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const beam = ctx.createRadialGradient(lx, ly, 10, lx, ly, h * 1.1); beam.addColorStop(0, 'rgba(255,30,30,.35)'); beam.addColorStop(1, 'rgba(255,0,0,0)');
      ctx.fillStyle = beam; ctx.beginPath(); ctx.moveTo(lx, ly); ctx.arc(lx, ly, h * 1.2, Math.PI / 2 + Math.sin(a) * 0.9 - 0.28, Math.PI / 2 + Math.sin(a) * 0.9 + 0.28); ctx.closePath(); ctx.fill();
      ctx.restore();
      ctx.fillStyle = `rgba(255,0,20,${0.06 + (Math.sin(t * 6) > 0 ? 0.08 : 0)})`; ctx.fillRect(0, 0, w, h);
      // tia lửa điện từ dây cáp đứt
      if (Math.sin(t * 9) > 0.6) { ctx.strokeStyle = '#bfefff'; ctx.lineWidth = 1.5; for (let i = 0; i < 6; i++) { const sx = w * 0.18, sy = h * 0.2; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + (Math.random() - 0.5) * 50, sy + Math.random() * 50); ctx.stroke(); } }
      hunter(ctx, w * 0.12, h * 1.08, h / 330, '#ff3a3a');
      vignette(ctx, w, h, 0.85);
    },
    // 3. cận cảnh mẩu giấy cháy dở
    note(ctx, w, h, t, S) {
      ctx.fillStyle = '#120c08'; ctx.fillRect(0, 0, w, h);
      const r = U.seeded(77);
      for (let i = 0; i < 18; i++) { ctx.fillStyle = `rgba(${60 + r() * 30},${36 + r() * 20},${20 + r() * 10},.5)`; ctx.fillRect(0, i * h / 18, w, h / 18 - 2); } // mặt bàn gỗ
      const pw = Math.min(w * 0.62, h * 1.0), ph = pw * 0.66, cx = w / 2, cy = h / 2;
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(-0.05 + Math.sin(t * 0.5) * 0.005);
      ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(-pw / 2 + 14, -ph / 2 + 18, pw, ph);
      // mép giấy cháy nham nhở
      const edge = []; const rr = U.seeded(9);
      for (let i = 0; i <= 40; i++) edge.push([-pw / 2 + pw * i / 40, -ph / 2 + rr() * 10]);
      for (let i = 0; i <= 26; i++) edge.push([pw / 2 - rr() * (i > 14 ? 40 : 10), -ph / 2 + ph * i / 26]);
      for (let i = 40; i >= 0; i--) edge.push([-pw / 2 + pw * i / 40, ph / 2 - rr() * (i > 26 ? 34 : 8)]);
      for (let i = 26; i >= 0; i--) edge.push([-pw / 2 + rr() * 8, -ph / 2 + ph * i / 26]);
      ctx.beginPath(); edge.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath();
      const pg = ctx.createRadialGradient(0, 0, pw * 0.2, 0, 0, pw * 0.7); pg.addColorStop(0, '#efe2bf'); pg.addColorStop(0.75, '#d8c393'); pg.addColorStop(1, '#5a3a1a');
      ctx.fillStyle = pg; ctx.fill();
      ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(40,20,8,.85)'; ctx.stroke();
      ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,120,40,.5)'; ctx.stroke();
      // nếp gấp + vết máu
      ctx.strokeStyle = 'rgba(120,90,50,.25)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-pw / 2, 0); ctx.lineTo(pw / 2, 4); ctx.moveTo(0, -ph / 2); ctx.lineTo(-6, ph / 2); ctx.stroke();
      ctx.fillStyle = 'rgba(120,10,10,.55)'; U.circle(ctx, pw * 0.3, ph * 0.28, 14); ctx.fill(); U.circle(ctx, pw * 0.33, ph * 0.22, 6); ctx.fill();
      // chữ viết tay
      const fs = pw / 22;
      ctx.fillStyle = '#2a1a10'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      const lines = S.note || [['Hunter — nếu cậu đọc được thư này,', 1], ['thì tôi đã không kịp.', 1], ['HỒ GƯƠM · THÁP RÙA', 1.35], ['21°01\'43"N  105°51\'08"E', 1.05], ['Nó không phải AI bình thường. Đừng tin ai cả.', 0.92], ['— T.', 1.1]];
      let y = -ph / 2 + fs * 2.2;
      for (const [s, k] of lines) { ctx.font = `italic ${k > 1.2 ? 700 : 500} ${fs * k}px Georgia, 'Times New Roman', serif`; ctx.fillText(s, -pw / 2 + fs * 1.6, y); y += fs * 1.55 * k; }
      // ký hiệu đầu dê bằng mực đỏ
      ctx.strokeStyle = 'rgba(160,20,20,.9)'; ctx.lineWidth = 3;
      const gx = pw * 0.33, gy = ph * 0.2;
      ctx.beginPath(); ctx.arc(gx, gy, fs * 2.1, 0, U.TAU); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(gx - fs * 1.1, gy - fs * 0.6); ctx.lineTo(gx, gy + fs * 1.5); ctx.lineTo(gx + fs * 1.1, gy - fs * 0.6); ctx.moveTo(gx - fs * 0.9, gy - fs * 0.7); ctx.quadraticCurveTo(gx - fs * 2, gy - fs * 2.2, gx - fs * 0.4, gy - fs * 1.6); ctx.moveTo(gx + fs * 0.9, gy - fs * 0.7); ctx.quadraticCurveTo(gx + fs * 2, gy - fs * 2.2, gx + fs * 0.4, gy - fs * 1.6); ctx.stroke();
      ctx.restore();
      // ánh đèn pin lắc nhẹ
      const fx = cx + Math.sin(t * 0.7) * 30, fy = cy + Math.cos(t * 0.9) * 20, fl = ctx.createRadialGradient(fx, fy, pw * 0.2, fx, fy, pw * 0.9);
      fl.addColorStop(0, 'rgba(0,0,0,0)'); fl.addColorStop(1, 'rgba(0,0,0,.82)'); ctx.fillStyle = fl; ctx.fillRect(0, 0, w, h);
    },
    // 4. lên đường lúc bình minh
    depart(ctx, w, h, t, S) {
      sky(ctx, w, h, [[0, '#0b1626'], [0.45, '#36456a'], [0.62, '#c9805a'], [0.7, '#f0b070'], [1, '#1a1410']]);
      const sx = w * 0.5, sy = h * 0.66, sg = ctx.createRadialGradient(sx, sy, 6, sx, sy, h * 0.5);
      sg.addColorStop(0, 'rgba(255,230,160,1)'); sg.addColorStop(0.12, 'rgba(255,190,110,.6)'); sg.addColorStop(1, 'rgba(255,150,80,0)');
      ctx.fillStyle = sg; ctx.fillRect(0, 0, w, h);
      // dãy núi xa + đô thị đổ nát phía sau
      ctx.fillStyle = 'rgba(40,40,70,.7)'; ctx.beginPath(); ctx.moveTo(0, h * 0.66);
      for (let x = 0; x <= w; x += w / 14) ctx.lineTo(x, h * (0.6 - Math.abs(Math.sin(x * 0.01 + 1)) * 0.06)); ctx.lineTo(w, h * 0.7); ctx.lineTo(0, h * 0.7); ctx.fill();
      skyline(ctx, w, h * 0.7, h * 0.12, '#1c1820', 31, true, false, t);
      // con đường tụ về chân trời
      ctx.fillStyle = '#16120f'; ctx.fillRect(0, h * 0.7, w, h * 0.3);
      ctx.fillStyle = '#2a2420'; ctx.beginPath(); ctx.moveTo(w * 0.47, h * 0.7); ctx.lineTo(w * 0.53, h * 0.7); ctx.lineTo(w * 0.85, h); ctx.lineTo(w * 0.15, h); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(240,210,120,.55)'; ctx.lineWidth = 3; ctx.setLineDash([18, 22]); ctx.lineDashOffset = -t * 60;
      ctx.beginPath(); ctx.moveTo(w * 0.5, h * 0.7); ctx.lineTo(w * 0.5, h); ctx.stroke(); ctx.setLineDash([]);
      const k = Math.min(1, S.st / 6);
      hunter(ctx, w * 0.5, h * (0.98 - k * 0.12), h / (480 + k * 500), '#ffcf80', t * 6);
      vignette(ctx, w, h, 0.6);
      if (S.title) {
        const a = Math.min(1, S.title);
        ctx.globalAlpha = a; ctx.textAlign = 'center'; ctx.fillStyle = '#fff3d8'; ctx.shadowColor = 'rgba(0,0,0,.8)'; ctx.shadowBlur = 20;
        ctx.font = `900 ${Math.min(w * 0.07, h * 0.11)}px system-ui, sans-serif`; ctx.fillText(S.tt || 'MÀN 2 · NGUỒN GỐC', w / 2, h * 0.24);
        ctx.font = `600 ${Math.min(w * 0.026, h * 0.04)}px system-ui, sans-serif`; ctx.fillStyle = '#ffcf80'; ctx.fillText(S.ts || 'Gate 11 — Hồ Gươm, Hà Nội', w / 2, h * 0.32);
        ctx.shadowBlur = 0; ctx.globalAlpha = 1;
      }
    },

    // 5. sảnh lõi phản ứng Căn cứ Alpha — bộ giáp vỡ, GS Ted quỵ gối
    alpha(ctx, w, h, t, S) {
      ctx.fillStyle = '#06090c'; ctx.fillRect(0, 0, w, h);
      // lõi phản ứng tắt dần phía sau
      const cx = w * 0.5, cy = h * 0.4, pul = 0.5 + Math.sin(t * 3) * 0.2 * (1 - (S.cut || 0));
      const cg = ctx.createRadialGradient(cx, cy, 10, cx, cy, h * 0.5); cg.addColorStop(0, `rgba(90,210,255,${0.55 * pul})`); cg.addColorStop(0.4, `rgba(40,120,200,${0.25 * pul})`); cg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = cg; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = `rgba(120,220,255,${0.4 * pul})`; ctx.lineWidth = 3;
      for (let i = 1; i <= 4; i++) { ctx.beginPath(); ctx.ellipse(cx, cy, h * 0.08 * i, h * 0.03 * i, 0, 0, U.TAU); ctx.stroke(); }
      ctx.fillStyle = '#0c1218'; ctx.fillRect(cx - h * 0.05, cy, h * 0.1, h * 0.5);
      // sàn
      ctx.fillStyle = '#0a0f13'; ctx.fillRect(0, h * 0.72, w, h * 0.28);
      ctx.strokeStyle = 'rgba(120,160,180,.12)'; ctx.lineWidth = 1; for (let i = -8; i <= 8; i++) { ctx.beginPath(); ctx.moveTo(cx + i * w * 0.04, h * 0.72); ctx.lineTo(cx + i * w * 0.14, h); ctx.stroke(); }
      // bộ giáp Alpha vỡ, Ted quỵ gối (bóng)
      const tx = w * 0.62, ty = h * 0.86, s = h / 620;
      ctx.save(); ctx.translate(tx, ty); ctx.scale(s, s);
      ctx.fillStyle = 'rgba(0,0,0,.6)'; U.ellipse(ctx, 0, 6, 140, 20); ctx.fill();
      ctx.fillStyle = '#2a2e34'; ctx.beginPath(); ctx.moveTo(-80, 0); ctx.lineTo(-70, -90); ctx.lineTo(-30, -150); ctx.lineTo(40, -150); ctx.lineTo(80, -80); ctx.lineTo(90, 0); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(255,120,60,.8)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-20, -150); ctx.lineTo(0, -100); ctx.lineTo(-14, -60); ctx.lineTo(10, -20); ctx.stroke();
      ctx.fillStyle = '#c9a68a'; ctx.beginPath(); ctx.arc(10, -170, 22, 0, U.TAU); ctx.fill();
      ctx.fillStyle = '#e8e8e8'; ctx.beginPath(); ctx.arc(4, -176, 20, Math.PI * 0.9, Math.PI * 2.05); ctx.fill();
      ctx.fillStyle = `rgba(255,${S.cut ? 60 : 90},60,${0.5 + Math.sin(t * 9) * 0.3})`; U.circle(ctx, -50, -100, 10); ctx.fill();
      ctx.restore();
      // Hunter + Dian đứng phía trước
      hunter(ctx, w * 0.26, h * 1.02, h / 360, '#7ad8ff');
      ctx.save(); ctx.translate(w * 0.12, h * 1.04); ctx.scale(h / 420, h / 420); ctx.fillStyle = '#05080a';
      ctx.beginPath(); ctx.ellipse(0, -150, 30, 9, 0, 0, U.TAU); ctx.fill(); ctx.beginPath(); ctx.arc(0, -150, 13, 0, U.TAU); ctx.fill(); ctx.fillRect(-22, -140, 44, 80); ctx.fillRect(-16, -60, 12, 60); ctx.fillRect(4, -60, 12, 60);
      ctx.save(); ctx.rotate(-0.6); ctx.fillRect(-4, -200, 8, 140); ctx.restore(); ctx.restore();
      // tia lửa điện
      if (Math.sin(t * 7) > 0.5) { ctx.strokeStyle = '#bfefff'; ctx.lineWidth = 1.5; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(tx - 40, ty - 80 * s); ctx.lineTo(tx - 40 + (Math.random() - 0.5) * 60, ty - 80 * s + (Math.random() - 0.5) * 60); ctx.stroke(); } }
      if (S.cut) { ctx.fillStyle = `rgba(255,255,255,${Math.max(0, 0.8 - S.cut)})`; ctx.fillRect(0, 0, w, h); }
      vignette(ctx, w, h, 0.8);
    },
    // 6. Hội đồng Mười Hai hiện hình qua tín hiệu đầu dê
    council(ctx, w, h, t, S) {
      ctx.fillStyle = '#05060a'; ctx.fillRect(0, 0, w, h);
      const cx = w / 2, cy = h * 0.58, k = S.council || 1, rx = Math.min(w * 0.42, h * 0.75), ry = h * 0.22;
      // bàn tròn ánh sáng
      ctx.strokeStyle = `rgba(255,60,90,${0.5 * k})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(cx, cy, rx * 0.75, ry * 0.75, 0, 0, U.TAU); ctx.stroke();
      ctx.strokeStyle = `rgba(255,60,90,${0.2 * k})`; ctx.lineWidth = 12; ctx.stroke();
      // 12 bóng người: sau lưng trước, xa nhỏ — ghế số 7 trống, chớp tắt
      const seats = [];
      for (let i = 0; i < 12; i++) { const a = -Math.PI / 2 + i / 12 * U.TAU; seats.push({ i, a, x: cx + Math.cos(a) * rx, y: cy + Math.sin(a) * ry }); }
      seats.sort((a, b) => a.y - b.y);
      for (const st of seats) {
        const sc = 0.6 + (st.y - (cy - ry)) / (2 * ry) * 0.6, x = st.x, y = st.y, fl = k * (0.7 + Math.sin(t * 20 + st.i) * 0.08 + (Math.random() < 0.03 ? -0.5 : 0));
        if (st.i === 6) { ctx.strokeStyle = `rgba(255,60,90,${0.25 + Math.abs(Math.sin(t * 6)) * 0.3})`; ctx.lineWidth = 2; ctx.setLineDash([6, 6]); ctx.strokeRect(x - 18 * sc, y - 90 * sc, 36 * sc, 90 * sc); ctx.setLineDash([]); ctx.fillStyle = `rgba(255,120,140,${k})`; ctx.font = `800 ${12 * sc}px system-ui`; ctx.textAlign = 'center'; ctx.fillText('VII', x, y + 16 * sc); continue; }
        const g = ctx.createLinearGradient(0, y - 110 * sc, 0, y); g.addColorStop(0, `rgba(255,90,120,${0.85 * fl})`); g.addColorStop(1, `rgba(255,40,70,${0.15 * fl})`);
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(x, y - 92 * sc, 12 * sc, 0, U.TAU); ctx.fill();
        ctx.beginPath(); ctx.moveTo(x - 22 * sc, y); ctx.quadraticCurveTo(x - 26 * sc, y - 70 * sc, x, y - 78 * sc); ctx.quadraticCurveTo(x + 26 * sc, y - 70 * sc, x + 22 * sc, y); ctx.closePath(); ctx.fill();
        ctx.fillStyle = `rgba(255,220,230,${0.6 * fl})`; ctx.font = `700 ${10 * sc}px system-ui`; ctx.textAlign = 'center'; ctx.fillText(['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'][st.i], x, y + 14 * sc);
      }
      // đầu dê mờ phía trên bàn
      ctx.globalCompositeOperation = 'lighter'; goatHead(ctx, cx, cy - h * 0.32, h / 1400, t, 0.2, 0.35 * k); ctx.globalCompositeOperation = 'source-over';
      // nhiễu quét ngang
      ctx.fillStyle = 'rgba(255,60,90,.05)'; for (let i = 0; i < 6; i++) ctx.fillRect(0, (t * 120 + i * h / 6) % h, w, 3);
      vignette(ctx, w, h, 0.85);
    },
  };

  /* ================= KỊCH BẢN ================= */
  const SCRIPTS = {

    // kết thúc Màn 2 (sau Gate 21)
    ending: [
      { scene: 'alpha', who: '', text: 'Bộ giáp Alpha nứt toác. Giáo sư Ted quỵ xuống giữa lõi phản ứng đang tắt dần.' },
      { scene: 'alpha', who: 'GS. TED', text: 'Cậu làm được rồi, Hunter… đúng như ta đã tính.' },
      { scene: 'alpha', who: 'HUNTER', text: 'Ông thật sự là ai?' },
      { scene: 'alpha', who: 'GS. TED', text: 'Một trong Mười Hai. Ghế số Bảy của Hội đồng.' },
      { scene: 'alpha', who: 'DIAN', text: 'Thầy… vì sao?' },
      { scene: 'alpha', who: 'GS. TED', text: 'Vì thế giới này cần được làm lại từ đầu. Virus chỉ là cây chổi, Dũng.' },
      { scene: 'council', fx: 'council', who: '', text: 'Mười một bóng người hiện lên quanh căn phòng — qua tín hiệu đầu dê. Một chiếc ghế trống.' },
      { scene: 'council', who: 'HỘI ĐỒNG', text: 'Ghế số Bảy đã thất bại.' },
      { scene: 'council', who: 'HỘI ĐỒNG', text: 'Thí nghiệm Hunter: thành công. Chuyển sang giai đoạn ba.' },
      { scene: 'alpha', who: 'GS. TED', text: 'Hunter… chạy đi. Họ ở khắp nơi.' },
      { scene: 'alpha', fx: 'cut', who: '', text: 'Tín hiệu cắt đứt. Lõi Alpha tắt lịm. Giáo sư Ted không còn thở — lần này là thật.' },
    ],
    endTrue: [
      { scene: 'note', who: 'HUNTER', note: [['Hunter — mười mảnh giấy, mười cửa.', 1], ['Cậu đã đọc hết. Ta đã chọn đúng người.', 1], ['GHẾ SỐ MỘT', 1.35], ['47°22\'N  8°32\'E', 1.05], ['Kẻ đứng đầu không bao giờ lộ mặt.', 0.92], ['— T.', 1.1]], text: 'Trong túi áo ông ấy… mẩu giấy thứ mười một.' },
      { scene: 'note', who: '', text: 'KẾT THÚC THẬT — Giáo sư Ted để lại đường đến kẻ ngồi ghế số Một.' },
    ],
    endOut: [
      { scene: 'depart', who: 'DIAN', text: 'Mười một người còn lại. Họ ở khắp thế giới.' },
      { scene: 'depart', who: 'HUNTER', text: 'Vậy thì chúng ta đi khắp thế giới.' },
      { scene: 'depart', fx: 'title', tt: 'HẾT MÀN 2 · NGUỒN GỐC', ts: 'Màn 3 · Bóng Tối Lan Rộng — sắp ra mắt · Chu kỳ+ đã mở', who: '', text: 'Chu kỳ+ đã mở: chơi lại mọi cửa với quái mạnh hơn, xu thưởng ×1,5 — trong lúc chờ Màn 3.' },
    ],
    act2: [
      { scene: 'battle', who: '', text: 'The Origin gục ngã. Lần đầu tiên sau nhiều tháng, thành phố chìm vào im lặng…' },
      { scene: 'battle', fx: 'goat', who: 'GOATEVIL', text: 'Hunter… Ngươi vừa tiêu diệt một bản thử nghiệm. Một trong hàng nghìn bản.' },
      { scene: 'battle', who: 'GOATEVIL', text: 'Ta là GoatEvil. Virus chỉ là món khai vị. Thế giới này… đã thuộc về ta từ lâu rồi.' },
      { scene: 'battle', fx: 'laugh', who: 'GOATEVIL', text: 'HA… HA HA… HA HA HA HA HA!' },
      { scene: 'battle', fx: 'vanish', who: 'HUNTER', text: 'GoatEvil?… Phải báo cho Giáo sư Ted ngay!' },
      { scene: 'lab', fx: 'alarm', who: '', text: 'Căn cứ Alpha — ba giờ sau.' },
      { scene: 'lab', who: 'HUNTER', text: 'Giáo sư!… Không… không thể nào…' },
      { scene: 'lab', who: '', text: 'Giáo sư Ted — người duy nhất đang lần theo nguồn gốc virus — đã bị sát hại.' },
      { scene: 'lab', who: 'HUNTER', text: 'Trong tay ông ấy… có một mẩu giấy.' },
      { scene: 'note', who: 'HUNTER', text: 'Hồ Gươm… Hà Nội. Ông đã tìm thấy điều gì ở đó?' },
      { scene: 'note', who: 'HUNTER', text: 'GoatEvil. Ta sẽ tìm ra ngươi — và cả kẻ đứng sau ngươi.' },
      { scene: 'depart', fx: 'title', who: '', text: 'Hunter lên đường tới Hà Nội, mang theo mẩu giấy cuối cùng của Giáo sư Ted.' },
    ],
  };

  /* ================= TRÌNH CHIẾU CẢNH CHUYỂN ================= */
  const Story = MB.Story = {
    SND, goatHead,
    seen(id) { return !!((MB.Save.data.story || {})[id]); },
    mark(id) { const sv = MB.Save.data; sv.story = sv.story || {}; sv.story[id] = true; MB.Save.save(); },

    play(id, done) {
      const lines = Array.isArray(id) ? id.flatMap((k) => SCRIPTS[k] || []) : SCRIPTS[id]; if (!lines || !lines.length) { if (done) done(); return; }
      MB.Audio.unlock(); MB.Audio.menuTheme(false); SND.drone(true);
      const root = $('story'), cv = $('storyCanvas'), ctx = cv.getContext('2d');
      const off = document.createElement('canvas'), octx = off.getContext('2d');
      root.classList.remove('hidden');
      const S = { i: -1, st: 0, typed: 0, goat: 0, mouth: 0, shatter: null, title: 0, glitch: 0 };
      let w = 0, h = 0, dpr = 1, last = performance.now(), raf = 0, ended = false;
      const fit = () => {
        dpr = Math.min(2, devicePixelRatio || 1); w = innerWidth; h = innerHeight;
        cv.width = off.width = w * dpr; cv.height = off.height = h * dpr;
      };
      fit(); addEventListener('resize', fit);
      const next = () => {
        if (ended) return;
        const L = lines[S.i];
        if (L && S.typed < L.text.length) { S.typed = L.text.length; return; } // đang gõ → hiện hết dòng
        S.i++;
        if (S.i >= lines.length) return finish();
        const N = lines[S.i]; S.typed = 0;
        if (!lines[S.i - 1] || lines[S.i - 1].scene !== N.scene) { S.st = 0; S.glitch = 0.8; SND.glitch(); }
        if (N.fx === 'goat') { S.goat = 0.01; S.glitch = 1; SND.glitch(); }
        if (N.fx === 'laugh') { S.laughing = true; SND.laugh(); S.glitch = 0.7; }
        if (N.fx === 'vanish') {
          S.laughing = false; S.goat = 0; S.glitch = 1.2; SND.glitch();
          S.shatter = Array.from({ length: 260 }, () => ({ x: w * 0.66 + (Math.random() - 0.5) * h * 0.35, y: h * 0.4 + (Math.random() - 0.5) * h * 0.4, vx: (Math.random() - 0.5) * 400, vy: (Math.random() - 0.8) * 300, s: 2 + Math.random() * 5, l: 1 + Math.random(), c: Math.random() < 0.5 ? '#ff4a5a' : '#ffd0d6' }));
        }
        if (N.fx === 'alarm') SND.alarm(5);
        if (N.fx === 'title') { S.title = 0.01; S.tt = N.tt; S.ts = N.ts; }
        if (N.note) S.note = N.note;
        if (N.fx === 'council') { S.council = 0.01; S.glitch = 1; SND.glitch(); }
        if (N.fx === 'cut') { S.cut = 0.01; S.glitch = 1.4; SND.glitch(); }
        if (N.scene === 'note' && lines[S.i - 1].scene !== 'note') SND.heart();
      };
      const finish = () => {
        if (ended) return; ended = true;
        cancelAnimationFrame(raf); removeEventListener('resize', fit); removeEventListener('keydown', key, true);
        root.classList.add('hidden'); SND.drone(false);
        (Array.isArray(id) ? id : [id]).forEach((k) => this.mark(k));
        if (done) done();
      };
      const key = (e) => {
        if (e.code === 'Escape') { e.preventDefault(); finish(); }
        else if (['Space', 'Enter', 'ArrowRight'].includes(e.code)) { e.preventDefault(); next(); }
        e.stopPropagation();
      };
      addEventListener('keydown', key, true);
      root.onpointerdown = (e) => { if (e.target.id === 'storySkip') return; e.preventDefault(); next(); };
      $('storySkip').onclick = (e) => { e.stopPropagation(); finish(); };
      const frame = (now) => {
        if (ended) return;
        const dt = Math.min(0.05, (now - last) / 1000); last = now; S.st += dt;
        const L = lines[S.i] || lines[0];
        if (S.typed < L.text.length) { const before = S.typed | 0; S.typed = Math.min(L.text.length, S.typed + dt * 38); if ((S.typed | 0) !== before && (S.typed | 0) % 2 === 0) SND.type(); }
        if (S.goat > 0 && S.goat < 1) S.goat = Math.min(1, S.goat + dt * 1.6);
        S.mouth = S.laughing ? Math.abs(Math.sin(now / 90)) : S.typed < L.text.length && L.who === 'GOATEVIL' ? Math.abs(Math.sin(now / 70)) * 0.5 : 0;
        if (S.shatter) for (const q of S.shatter) { q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 200 * dt; q.l -= dt * 0.8; }
        if (S.title > 0) S.title = Math.min(1, S.title + dt * 0.6);
        if (S.council > 0) S.council = Math.min(1, S.council + dt * 0.5);
        if (S.cut > 0) S.cut = Math.min(1, S.cut + dt * 0.8);
        S.glitch = Math.max(0, S.glitch - dt * 1.4);
        const t = now / 1000;
        octx.setTransform(dpr, 0, 0, dpr, 0, 0);
        (SCENES[L.scene] || SCENES.battle)(octx, w, h, t, S);
        if (S.st < 0.6) { octx.fillStyle = `rgba(0,0,0,${1 - S.st / 0.6})`; octx.fillRect(0, 0, w, h); }
        scanlines(octx, w, h, 0.12);
        ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(off, 0, 0);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        glitchSlices(ctx, off, w, h, S.glitch + (S.laughing ? 0.25 : 0));
        // khung thoại
        const box = $('storyText');
        const shown = L.text.slice(0, S.typed | 0);
        let html = (L.who ? `<b class="${L.who === 'GOATEVIL' || L.who === 'HỘI ĐỒNG' ? 'evil' : ''}">${esc(L.who)}</b>` : '') + `<span class="${L.who ? '' : 'narr'}">${esc(shown)}</span>`;
        // lời thoại của Hunter: kèm chân dung
        if (L.who === 'HUNTER') html = `<img class="sp" src="assets/hunter/portrait.webp" alt=""><div>${html}</div>`;
        if (box.__h !== html) { box.innerHTML = html; box.__h = html; box.classList.toggle('pt', L.who === 'HUNTER'); }
        raf = requestAnimationFrame(frame);
      };
      next();
      raf = requestAnimationFrame(frame);
    },

    /* ================= TRONG TRẬN: bộ đàm, manh mối ================= */
    // bộ đàm: hiện khung thoại nhỏ ở góc, không dừng game
    say(who, text, dur) {
      this.q = this.q || [];
      this.q.push({ who, text, dur: dur || Math.max(3, text.length / 16) });
      if (!this.cur) this.nextSay();
    },
    nextSay() {
      const el = $('comm'); if (!el) return;
      const m = this.q.shift();
      this.cur = m || null;
      if (!m) { el.classList.remove('show'); return; }
      const evil = m.who === 'GOATEVIL', ally = m.who === 'DIAN';
      el.className = 'comm show' + (evil ? ' evil' : ally ? ' ally' : m.who === 'TIẾP TẾ' ? ' relay' : '');
      el.innerHTML = `<i class="av${m.who === 'HUNTER' ? ' img' : ''}">${evil ? GOAT_ICON : ally ? DIAN_ICON : m.who === 'TIẾP TẾ' ? '☕' : m.who === 'TED' ? 'T' : m.who === 'HUNTER' ? '<img src="assets/hunter/portrait.webp" alt="">' : esc((m.who.split(' ').pop() || 'H')[0])}</i><div><b>${esc(m.who === 'TED' ? 'GS. TED (ghi chép)' : m.who)}</b><span>${esc(m.text)}</span></div>`;
      if (evil && SND.ok()) SND.glitch();
      clearTimeout(this.ct); this.ct = setTimeout(() => this.nextSay(), m.dur * 1000);
    },
    clearSay() { this.q = []; this.cur = null; clearTimeout(this.ct); const el = $('comm'); if (el) el.classList.remove('show'); },

    // gọi khi bắt đầu một Gate có cốt truyện
    startGate(G) {
      this.clearSay();
      const d = G.def, sv = MB.Save.data;
      G.storyT = 0; G.storyFired = {};
      if (d.clue) {
        const got = (sv.clues || {})[d.id];
        G.clue = { kind: 'clue', x: d.clue.x, y: d.clue.y, r: 16, h: 0, taken: !!got, hidden: !!got };
        G.actors.push(G.clue);
      } else G.clue = null;
    },
    update(G, dt) {
      const d = G.def; if (!d.comms) return;
      G.storyT += dt;
      for (const c of d.comms) {
        const key = c.on + (c.t || 0);
        if (G.storyFired[key] || G.mode === 'survival') continue;
        let go = false;
        if (c.on === 'start') go = G.storyT >= (c.t || 0);
        else if (c.on === 'wave') go = G.state === 'fight' && G.waveIdx + 1 === c.wave;
        else if (c.on === 'boss') go = G.state === 'boss' && G.boss && !G.boss.dead;
        else if (c.on === 'phase') go = G.boss && !G.boss.dead && G.boss.phase === c.phase;
        else if (c.on === 'low') go = G.player.hp < G.player.maxHp * 0.3 && !G.player.dead;
        else if (c.on === 'won') go = G.state === 'won';
        else if (c.on === 'ally') go = !!G.ally && G.ally.arrivedT >= (c.t || 0);
        if (go) { G.storyFired[key] = true; for (const [who, text] of c.lines) this.say(who, text); }
      }
      // nhặt manh mối
      const cl = G.clue, p = G.player;
      if (cl && !cl.taken && !p.dead && U.dist(cl.x, cl.y, p.x, p.y) < 46) {
        cl.taken = true; cl.hidden = true;
        const sv = MB.Save.data; sv.clues = sv.clues || {}; sv.clues[d.id] = true; sv.ts = Date.now(); MB.Save.save(); if (MB.Cloud) MB.Cloud.push();
        MB.Audio.play('pickup'); MB.haptic && MB.haptic(30);
        this.showClue(d);
      }
    },
    showClue(d) {
      const G = MB.G, wasPaused = G.paused;
      G.paused = true; MB.Input.clear();
      const n = Object.keys(MB.Save.data.clues || {}).length;
      $('clueBody').innerHTML = `<h3>${esc(d.clue.title)}</h3>${d.clue.text.map((p) => `<p>${esc(p)}</p>`).join('')}<em>— Ghi chép của GS. Ted · mảnh ${n}/10</em>`;
      $('clue').classList.remove('hidden');
      const close = () => { $('clue').classList.add('hidden'); G.paused = wasPaused; MB.Input.clear(); $('clueClose').onclick = null; };
      $('clueClose').onclick = close;
    },
    // vẽ manh mối 2D (mẩu giấy phát sáng nhấp nháy)
    drawClue(ctx, a, G) {
      if (a.taken) return;
      const t = G.time, b = Math.sin(t * 3) * 3;
      const gl = ctx.createRadialGradient(a.x, a.y, 2, a.x, a.y, 44); gl.addColorStop(0, 'rgba(255,220,120,.55)'); gl.addColorStop(1, 'rgba(255,200,80,0)');
      ctx.fillStyle = gl; U.circle(ctx, a.x, a.y, 44); ctx.fill();
      ctx.save(); ctx.translate(a.x, a.y - 6 + b); ctx.rotate(Math.sin(t) * 0.2);
      ctx.fillStyle = '#efe2bf'; ctx.fillRect(-11, -8, 22, 16); ctx.strokeStyle = '#5a3a1a'; ctx.lineWidth = 1.5; ctx.strokeRect(-11, -8, 22, 16);
      ctx.strokeStyle = 'rgba(60,40,20,.6)'; ctx.beginPath(); ctx.moveTo(-7, -3); ctx.lineTo(7, -3); ctx.moveTo(-7, 2); ctx.lineTo(5, 2); ctx.stroke();
      ctx.restore();
      ctx.fillStyle = '#ffd56a'; ctx.font = '800 11px system-ui'; ctx.textAlign = 'center'; ctx.fillText('MANH MỐI', a.x, a.y - 26 + b);
    },
    // model 3D cho manh mối (dùng chung cho các Gate Màn 2)
    actors3d: {
      clue: (a, K) => {
        const T = K.T, g = new T.Group(), pap = K.std(0xefe2bf, { rough: 0.9 });
        const pg = new T.Group(); pg.position.y = 22; g.add(pg);
        const sheet = K.mesh(K.box(20, 1, 15), pap, 0, 0, 0); sheet.rotation.x = 0.5; pg.add(sheet);
        pg.add(K.glowSprite(0xffd27a, 70, 0.75));
        g.userData.anim = (aa, m, G) => { pg.position.y = 22 + Math.sin(G.time * 3) * 4; pg.rotation.y = G.time * 1.5; m.visible = !aa.taken; };
        return g;
      },
    },
  };
  const GOAT_ICON = '<svg viewBox="0 0 40 40"><path d="M12 10 C6 2 1 6 4 12 M28 10 C34 2 39 6 36 12 M12 10 L28 10 L30 20 L24 34 L20 37 L16 34 L10 20 Z" fill="none" stroke="#ff5a6a" stroke-width="2.4" stroke-linejoin="round"/><rect x="13" y="17" width="5" height="2.4" fill="#ffd0d6"/><rect x="22" y="17" width="5" height="2.4" fill="#ffd0d6"/></svg>';
  const DIAN_ICON = '<svg viewBox="0 0 40 40"><ellipse cx="20" cy="17" rx="17" ry="5" fill="#46532f"/><path d="M11 17 Q12 6 20 6 Q28 6 29 17 Z" fill="#5a6a3c"/><circle cx="20" cy="24" r="7" fill="#b98a68"/><path d="M11 31 h18 v5 h-18z" fill="#e8e2d0"/><path d="M13 31v5M17 31v5M21 31v5M25 31v5M11 33.5h18" stroke="#1a1a1a" stroke-width="1.4"/></svg>';
  MB.Props.registerActor('clue', (ctx, a, G) => Story.drawClue(ctx, a, G));
})(window.MB);
