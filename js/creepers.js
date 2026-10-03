/* Monster Breakout — creepers.js (v8.3.1)
   Nhện bò + dơi ma bay qua màn hình Menu và Chọn cửa ải để tạo cảm giác tận thế.
   Lớp canvas riêng, không chặn thao tác (pointer-events: none), tự tắt khi vào trận / tab ẩn. */
(function () {
  'use strict';
  const SCREENS = ['menu', 'gates'];
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;

  const cv = document.createElement('canvas');
  cv.id = 'creepers';
  cv.setAttribute('aria-hidden', 'true');
  cv.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:20';
  const ctx = cv.getContext('2d');
  let W = 0, H = 0, dpr = 1, running = false, last = 0, nextSpider = 1.2, nextBat = 2.5;
  const spiders = [], bats = [];
  const ptr = { x: -999, y: -999 };
  const R = (a, b) => a + Math.random() * (b - a);

  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = innerWidth; H = innerHeight;
    cv.width = W * dpr | 0; cv.height = H * dpr | 0;
  }
  function active() {
    if (document.hidden) return false;
    for (const id of SCREENS) { const e = document.getElementById(id); if (e && !e.classList.contains('hidden')) return true; }
    return false;
  }

  /* ---------- Nhện ---------- */
  function spawnSpider() {
    const r = R(8, 14) * (W < 520 ? 0.8 : 1);
    if (Math.random() < 0.35) { // thả tơ từ mép trên
      spiders.push({ kind: 'drop', x: R(W * 0.08, W * 0.92), y: -20, r, len: R(H * 0.15, H * 0.5), st: 'down', wait: R(1.8, 4), t: 0, a: Math.PI / 2 });
      return;
    }
    const side = Math.random() * 4 | 0; let x, y;
    if (side === 0) { x = -20; y = R(H * 0.1, H * 0.95); }
    else if (side === 1) { x = W + 20; y = R(H * 0.1, H * 0.95); }
    else if (side === 2) { x = R(0, W); y = H + 20; }
    else { x = R(0, W); y = -20; }
    const tx = R(W * 0.2, W * 0.8), ty = R(H * 0.2, H * 0.8);
    spiders.push({ kind: 'walk', x, y, r, a: Math.atan2(ty - y, tx - x), sp: R(38, 70), turn: 0, pause: 0, t: R(0, 9), life: 0, flee: 0 });
  }
  function stepSpider(s, dt) {
    s.t += dt;
    if (s.kind === 'drop') {
      const v = 60;
      if (s.st === 'down') { s.y += v * dt * (s.y < s.len * 0.8 ? 1 : 0.45); if (s.y >= s.len) s.st = 'hang'; }
      else if (s.st === 'hang') { s.wait -= dt; s.x += Math.sin(s.t * 1.3) * 0.15; if (s.wait <= 0 || Math.hypot(ptr.x - s.x, ptr.y - s.y) < 70) s.st = 'up'; }
      else { s.y -= v * 1.6 * dt; if (s.y < -30) s.dead = true; }
      s.moving = s.st !== 'hang';
      return;
    }
    s.life += dt;
    const dp = Math.hypot(ptr.x - s.x, ptr.y - s.y);
    if (dp < 90 && s.flee <= 0) { s.flee = 1.2; s.a = Math.atan2(s.y - ptr.y, s.x - ptr.x); s.pause = 0; }
    if (s.flee > 0) s.flee -= dt;
    if (s.pause > 0) { s.pause -= dt; s.moving = false; return; }
    if (s.flee <= 0 && Math.random() < dt * 0.35) s.pause = R(0.4, 1.6);
    if (Math.random() < dt * 1.5) s.turn = R(-1.6, 1.6);
    s.a += s.turn * dt;
    const sp = s.sp * (s.flee > 0 ? 3.2 : 1) * (0.75 + 0.25 * Math.sin(s.t * 9));
    s.x += Math.cos(s.a) * sp * dt; s.y += Math.sin(s.a) * sp * dt;
    s.moving = true;
    if (s.life > 3 && (s.x < -40 || s.x > W + 40 || s.y < -40 || s.y > H + 40)) s.dead = true;
    if (s.life > 28) { // bò về mép gần nhất
      const ex = s.x < W / 2 ? -60 : W + 60; s.a += (Math.atan2(s.y - s.y, ex - s.x) - s.a) * dt;
    }
  }
  function drawSpider(s) {
    const r = s.r;
    ctx.save();
    ctx.translate(s.x, s.y);
    if (s.kind === 'drop') { // sợi tơ
      ctx.strokeStyle = 'rgba(220,225,215,.28)'; ctx.lineWidth = 0.7;
      ctx.beginPath(); ctx.moveTo(0, -s.y - 2); ctx.lineTo(0, -r); ctx.stroke();
    }
    ctx.rotate(s.a);
    // bóng
    ctx.fillStyle = 'rgba(0,0,0,.35)';
    ctx.beginPath(); ctx.ellipse(-r * 0.3 + 3, 3, r * 2, r * 1.2, 0, 0, 7); ctx.fill();
    // chân
    const ph = s.moving ? s.t * 16 : 0;
    ctx.lineCap = 'round';
    for (let pass = 0; pass < 2; pass++) {
    ctx.strokeStyle = pass ? '#120d0a' : 'rgba(215,175,125,.32)'; ctx.lineWidth = Math.max(1, r * 0.16) + (pass ? 0 : 1.6);
    for (let side = -1; side <= 1; side += 2) {
      for (let i = 0; i < 4; i++) {
        const base = (-0.9 + i * 0.6) * side;
        const sw = Math.sin(ph + i * 1.7 + (side > 0 ? Math.PI : 0)) * 0.28;
        const a1 = Math.PI / 2 * side + base * 0.55 + sw;
        const kx = Math.cos(a1) * r * 1.5, ky = Math.sin(a1) * r * 1.5;
        const a2 = a1 + (i < 2 ? -0.6 : 0.6) * side;
        ctx.beginPath();
        ctx.moveTo(r * 0.1, 0);
        ctx.lineTo(kx, ky - side * r * 0.5);
        ctx.lineTo(kx + Math.cos(a2) * r * 1.4, ky + Math.sin(a2) * r * 1.4);
        ctx.stroke();
      }
    }
    }
    // thân
    ctx.fillStyle = '#0d0907';
    ctx.strokeStyle = 'rgba(210,170,120,.28)'; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.ellipse(-r * 1.15, 0, r * 1.15, r * 0.9, 0, 0, 7); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(r * 0.25, 0, r * 0.62, r * 0.52, 0, 0, 7); ctx.fill(); ctx.stroke();
    // vân lưng đỏ
    ctx.fillStyle = 'rgba(150,20,10,.75)';
    ctx.beginPath(); ctx.ellipse(-r * 1.2, 0, r * 0.38, r * 0.16, 0, 0, 7); ctx.fill();
    // mắt
    ctx.shadowColor = '#ff2a10'; ctx.shadowBlur = 6; ctx.fillStyle = '#ff3b1f';
    ctx.beginPath(); ctx.arc(r * 0.72, -r * 0.18, Math.max(0.9, r * 0.11), 0, 7); ctx.arc(r * 0.72, r * 0.18, Math.max(0.9, r * 0.11), 0, 7); ctx.fill();
    ctx.restore();
  }

  /* ---------- Dơi ma ---------- */
  function spawnBats() {
    const n = Math.random() < 0.3 ? (2 + (Math.random() * 3 | 0)) : 1;
    const dir = Math.random() < 0.5 ? 1 : -1;
    const swoop = n === 1 && Math.random() < 0.35;
    const baseY = R(H * 0.08, H * 0.75);
    for (let i = 0; i < n; i++) {
      bats.push({
        x: dir > 0 ? -60 - i * R(30, 70) : W + 60 + i * R(30, 70),
        y: baseY + R(-50, 50), dir, sp: R(150, 260) * (W < 520 ? 0.7 : 1), amp: R(14, 40), w: R(1.4, 2.6),
        sc: swoop ? 0.5 : R(0.9, 1.5), swoop, t: R(0, 6), trail: [], flap: R(11, 16)
      });
    }
  }
  function stepBat(b, dt) {
    b.t += dt;
    b.x += b.dir * b.sp * dt;
    b.y += Math.cos(b.t * b.w) * b.amp * b.w * dt + (b.swoop ? Math.sin(b.t * 0.8) * 18 * dt : 0);
    if (b.swoop) b.sc = Math.min(2.3, b.sc + dt * 0.55);
    b.trail.push(b.x, b.y); if (b.trail.length > 24) b.trail.splice(0, 2);
    if ((b.dir > 0 && b.x > W + 140) || (b.dir < 0 && b.x < -140)) b.dead = true;
  }
  function drawBat(b) {
    // vệt ma
    for (let i = 0; i < b.trail.length; i += 2) {
      const k = i / b.trail.length;
      ctx.fillStyle = `rgba(150,255,210,${0.07 * k})`;
      ctx.beginPath(); ctx.arc(b.trail[i], b.trail[i + 1], 9 * b.sc * k, 0, 7); ctx.fill();
    }
    const f = Math.sin(b.t * b.flap), s = 18 * b.sc;
    ctx.save();
    ctx.translate(b.x, b.y); ctx.rotate(b.dir * 0.12);
    ctx.globalAlpha = b.swoop ? Math.max(0, Math.min(0.75, 1.9 - b.sc * 0.75)) : 0.62;
    ctx.shadowColor = 'rgba(120,255,200,.9)'; ctx.shadowBlur = 14 * b.sc;
    ctx.fillStyle = 'rgba(205,240,228,.82)';
    const ty = -f * s * 0.55; // đầu cánh lên/xuống
    for (let side = -1; side <= 1; side += 2) {
      const X = v => v * side;
      ctx.beginPath();
      ctx.moveTo(X(s * 0.12), -s * 0.08);
      ctx.quadraticCurveTo(X(s * 0.55), ty * 0.6 - s * 0.32, X(s * 1.05), ty - s * 0.12);
      ctx.quadraticCurveTo(X(s * 0.92), ty * 0.5 + s * 0.08, X(s * 0.8), ty * 0.45 + s * 0.2);
      ctx.quadraticCurveTo(X(s * 0.68), ty * 0.3 + s * 0.06, X(s * 0.55), ty * 0.25 + s * 0.24);
      ctx.quadraticCurveTo(X(s * 0.42), ty * 0.15 + s * 0.1, X(s * 0.3), ty * 0.1 + s * 0.26);
      ctx.quadraticCurveTo(X(s * 0.2), s * 0.12, X(s * 0.08), s * 0.2);
      ctx.closePath(); ctx.fill();
    }
    ctx.beginPath(); ctx.ellipse(0, s * 0.05, s * 0.13, s * 0.22, 0, 0, 7); ctx.fill(); // thân
    ctx.beginPath(); ctx.arc(0, -s * 0.16, s * 0.11, 0, 7); ctx.fill(); // đầu
    ctx.beginPath(); ctx.moveTo(-s * 0.1, -s * 0.2); ctx.lineTo(-s * 0.08, -s * 0.38); ctx.lineTo(-s * 0.01, -s * 0.24);
    ctx.lineTo(s * 0.01, -s * 0.24); ctx.lineTo(s * 0.08, -s * 0.38); ctx.lineTo(s * 0.1, -s * 0.2); ctx.fill(); // tai
    ctx.shadowColor = '#ff2a10'; ctx.shadowBlur = 5; ctx.globalAlpha = 0.95; ctx.fillStyle = '#ff4020';
    const er = Math.max(0.9, s * 0.035);
    ctx.beginPath(); ctx.arc(-s * 0.045, -s * 0.17, er, 0, 7); ctx.arc(s * 0.045, -s * 0.17, er, 0, 7); ctx.fill();
    ctx.restore();
  }

  /* ---------- Vòng lặp ---------- */
  function frame(ts) {
    if (!running) return;
    const dt = Math.min(0.05, (ts - (last || ts)) / 1000); last = ts;
    nextSpider -= dt; nextBat -= dt;
    if (nextSpider <= 0) { if (spiders.length < (W < 520 ? 1 : 2)) spawnSpider(); nextSpider = R(6, 14); }
    if (nextBat <= 0) { if (bats.length < 4) spawnBats(); nextBat = R(7, 16); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    for (const s of spiders) { stepSpider(s, dt); drawSpider(s); }
    for (const b of bats) { stepBat(b, dt); drawBat(b); }
    for (let i = spiders.length - 1; i >= 0; i--) if (spiders[i].dead) spiders.splice(i, 1);
    for (let i = bats.length - 1; i >= 0; i--) if (bats[i].dead) bats.splice(i, 1);
    requestAnimationFrame(frame);
  }
  function check() {
    const on = active();
    if (on && !running) { running = true; last = 0; cv.style.display = ''; requestAnimationFrame(frame); }
    else if (!on && running) { running = false; spiders.length = 0; bats.length = 0; ctx.clearRect(0, 0, cv.width, cv.height); cv.style.display = 'none'; nextSpider = 1.2; nextBat = 2.5; }
  }
  function init() {
    document.body.appendChild(cv); resize();
    addEventListener('resize', resize);
    addEventListener('pointermove', e => { ptr.x = e.clientX; ptr.y = e.clientY; }, { passive: true });
    addEventListener('pointerdown', e => { ptr.x = e.clientX; ptr.y = e.clientY; }, { passive: true });
    document.addEventListener('visibilitychange', check);
    setInterval(check, 400); check();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  window.MB = window.MB || {}; MB.Creepers = { _demo() { spiders.push({ kind: 'walk', x: W / 2, y: H / 2, r: 13, a: -0.4, sp: 0, turn: 0, pause: 99, t: 0, life: 0, flee: 0 }); bats.push({ x: W / 2 + 120, y: H / 2, dir: 1, sp: 0, amp: 0, w: 1, sc: 1.4, t: 0.3, trail: [], flap: 0.0001 }); }, spawnSpider, spawnBats, get count() { return { spiders: spiders.length, bats: bats.length }; } };
})();
