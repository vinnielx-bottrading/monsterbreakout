/* Gate 02 — Mountain: Vách Núi Đá Lăn
   Cơ chế mới: vực sâu (chặn đi bộ, đạn bay qua), làn đá lăn từ vách núi.
   Quái mới: Bat (bay qua vật cản), Brute (lao húc, đâm vào đá sẽ choáng) · Boss: Stone Behemoth
   Thử thách: phá 4 tinh thể virus (→ SMG), giữ trạm radio (→ Bộ Chia Tia), chuỗi 15 hạ gục (→ Nòng Tăng Lực) */
'use strict';
(function (MB) {
  const U = MB.U, Ens = MB.Enemies;
  const WW = 3200, WH = 2200;
  const LANES = [950, 1750, 2500];

  /* ---------- props ---------- */
  MB.Props.register('chasm', (ctx, o) => {
    ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(o.rot);
    ctx.fillStyle = '#5a4a3a'; U.rr(ctx, -o.hw - 8, -o.hh - 8, o.w + 16, o.h + 16, 26); ctx.fill();
    const g = ctx.createLinearGradient(0, -o.hh, 0, o.hh);
    g.addColorStop(0, '#000'); g.addColorStop(0.5, '#0b0806'); g.addColorStop(1, '#000');
    ctx.fillStyle = g; U.rr(ctx, -o.hw, -o.hh, o.w, o.h, 22); ctx.fill();
    ctx.strokeStyle = 'rgba(160,130,100,.35)'; ctx.lineWidth = 2;
    for (let i = -o.hw + 20; i < o.hw - 10; i += 34) { ctx.beginPath(); ctx.moveTo(i, -o.hh + 2); ctx.lineTo(i + 8, -o.hh + 12); ctx.stroke(); }
    ctx.restore();
  });
  MB.Props.register('cliff', (ctx, o) => {
    ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(o.rot);
    ctx.fillStyle = 'rgba(0,0,0,.3)'; U.rr(ctx, -o.hw + 6, -o.hh + 10, o.w, o.h, 14); ctx.fill();
    ctx.fillStyle = '#5d554d'; U.rr(ctx, -o.hw, -o.hh, o.w, o.h, 14); ctx.fill();
    ctx.fillStyle = '#756b60'; U.rr(ctx, -o.hw + 6, -o.hh + 5, o.w - 14, o.h * 0.45, 10); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 2;
    for (let i = -o.hw + 25; i < o.hw - 10; i += 40) { ctx.beginPath(); ctx.moveTo(i, -o.hh + 6); ctx.lineTo(i - 6, o.hh - 6); ctx.stroke(); }
    ctx.restore();
  });
  MB.Props.register('deadtree', (ctx, o, t) => {
    const { x, y, r } = o;
    MB.Props.shadow(ctx, x + 8, y + 10, r * 0.9, r * 0.5, 0.25);
    ctx.strokeStyle = '#4a3a2c'; ctx.lineCap = 'round';
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * U.TAU + x * 0.01 + Math.sin(t * 0.8 + i) * 0.02;
      ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); ctx.stroke();
      ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * r * 0.6, y + Math.sin(a) * r * 0.6);
      ctx.lineTo(x + Math.cos(a + 0.5) * r * 0.95, y + Math.sin(a + 0.5) * r * 0.95); ctx.stroke();
    }
    ctx.fillStyle = '#5b4733'; U.circle(ctx, x, y, r * 0.32); ctx.fill();
    ctx.fillStyle = '#6e5840'; U.circle(ctx, x - 3, y - 3, r * 0.18); ctx.fill();
  });
  MB.Props.register('crystal', (ctx, o, t) => {
    const { x, y, r } = o;
    MB.Props.shadow(ctx, x + 6, y + 10, r, r * 0.55, 0.3);
    ctx.save(); ctx.translate(x, y);
    const glow = 0.5 + Math.sin(t * 3 + x) * 0.3;
    ctx.shadowColor = '#c47bff'; ctx.shadowBlur = 18 * glow;
    const shards = [[0, -1.1, 0.42], [-0.7, -0.5, 0.32], [0.75, -0.4, 0.34], [-0.4, 0.5, 0.28], [0.45, 0.55, 0.3]];
    for (const [sx, sy, s] of shards) {
      ctx.fillStyle = o.flash > 0 ? '#ffffff' : '#7b3fb8';
      ctx.beginPath(); ctx.moveTo(sx * r * 0.5, sy * r * 0.5 - r * s * 1.6); ctx.lineTo(sx * r * 0.5 + r * s * 0.6, sy * r * 0.5); ctx.lineTo(sx * r * 0.5, sy * r * 0.5 + r * s * 0.7); ctx.lineTo(sx * r * 0.5 - r * s * 0.6, sy * r * 0.5); ctx.closePath(); ctx.fill();
      ctx.fillStyle = `rgba(230,190,255,${glow})`;
      ctx.beginPath(); ctx.moveTo(sx * r * 0.5, sy * r * 0.5 - r * s * 1.3); ctx.lineTo(sx * r * 0.5 + r * s * 0.25, sy * r * 0.5); ctx.lineTo(sx * r * 0.5, sy * r * 0.5 + r * s * 0.3); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  });

  /* ---------- Bat ---------- */
  Ens.register('bat', {
    name: 'Bat', r: 12, hp: 26, speed: 160, dmg: 7, score: 120, fly: true, blood: '#4a2c3a', gore: '#e0a0c0',
    init(e) { e.state = 'circle'; e.st = U.rnd(1.5, 3); e.orb = U.rnd(0, U.TAU); e.dir = Math.random() < 0.5 ? 1 : -1; e.accel = 5; },
    update(e, G, dt) {
      const p = G.player;
      e.st -= dt;
      if (e.state === 'circle') {
        e.orb += e.dir * dt * 1.6;
        Ens.steer(e, G, p.x + Math.cos(e.orb) * 170, p.y + Math.sin(e.orb) * 170, e.speed, dt);
        if (e.st <= 0) { e.state = 'swoop'; e.st = 0.5; const a = Ens.toPlayer(e, G); e.vx = Math.cos(a) * 430; e.vy = Math.sin(a) * 430; e.face = a; }
      } else if (e.st <= 0) { e.state = 'circle'; e.st = U.rnd(1.8, 3.2); }
    },
    draw(ctx, e, G) {
      ctx.save(); ctx.translate(e.x, e.y - 6); ctx.rotate(e.face || 0);
      ctx.fillStyle = 'rgba(0,0,0,.22)'; U.ellipse(ctx, 0, 22, 14, 5); ctx.fill();
      const f = Math.sin(G.time * 26 + e.t) * 0.6;
      ctx.fillStyle = '#7a4f8f';
      for (const s of [-1, 1]) {
        ctx.beginPath(); ctx.moveTo(-2, 0);
        ctx.lineTo(-8, s * (16 + f * 8)); ctx.lineTo(0, s * (11 + f * 6)); ctx.lineTo(6, s * (18 + f * 8)); ctx.lineTo(4, s * 3);
        ctx.closePath(); ctx.fill();
      }
      ctx.fillStyle = '#9c6ab0'; U.ellipse(ctx, 0, 0, 8, 6); ctx.fill();
      ctx.shadowColor = '#ff6b8a'; ctx.shadowBlur = 8; ctx.fillStyle = '#ff8fa8'; U.circle(ctx, 6, -2, 1.8); ctx.fill(); U.circle(ctx, 6, 2, 1.8); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.restore();
    },
  });

  /* ---------- Brute ---------- */
  Ens.register('brute', {
    name: 'Brute', r: 26, hp: 260, speed: 50, dmg: 18, score: 420, knockMul: 0.25, blood: '#4b3b2b', gore: '#d9b48a',
    init(e) { e.state = 'walk'; e.cd = U.rnd(1.5, 3); },
    armorFn(e, dmg) { return e.state === 'stunned' ? dmg * 2 : dmg; },
    update(e, G, dt) {
      const p = G.player, d = Ens.distPlayer(e, G);
      e.cd -= dt;
      if (e.state === 'walk') {
        Ens.steer(e, G, p.x, p.y, e.speed, dt);
        if (d < 420 && e.cd <= 0 && G.los(e.x, e.y, p.x, p.y)) { e.state = 'aim'; e.st = 0.85; e.lock = Ens.toPlayer(e, G); }
      } else if (e.state === 'aim') {
        Ens.stop(e, dt, 12); e.st -= dt;
        e.lock += U.angDiff(e.lock, Ens.toPlayer(e, G)) * Math.min(1, dt * 2.5); e.face = e.lock;
        if (e.st <= 0) { e.state = 'charge'; e.st = 0.9; e.vx = Math.cos(e.lock) * 470; e.vy = Math.sin(e.lock) * 470; MB.Audio.play('roar'); }
      } else if (e.state === 'charge') {
        e.st -= dt;
        if (e.bumped) { e.state = 'stunned'; e.st = 1.5; e.vx = e.vy = 0; G.shake(6); G.text(e.x, e.y - 40, 'CHOÁNG ×2', '#ffd56a', 15); MB.Audio.play('slam'); }
        else if (e.st <= 0) { e.state = 'walk'; e.cd = U.rnd(2.2, 3.5); }
      } else if (e.state === 'stunned') {
        Ens.stop(e, dt, 10); e.st -= dt;
        if (e.st <= 0) { e.state = 'walk'; e.cd = U.rnd(1.5, 2.5); }
      }
    },
    tele(ctx, e, G) { if (e.state === 'aim') G.drawTelegraphLine(ctx, e.x, e.y, e.lock, 400, 1 - e.st / 0.85); },
    draw(ctx, e, G) {
      ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.face || 0);
      const s = e.r / 26;
      ctx.scale(s, s);
      const sw = Math.sin(G.time * 5 + e.t) * 4;
      ctx.fillStyle = '#5a4636';
      U.circle(ctx, 14 + sw, -22, 10); ctx.fill(); U.circle(ctx, 14 - sw, 22, 10); ctx.fill();
      ctx.fillStyle = '#7a604a'; U.ellipse(ctx, -2, 0, 24, 26); ctx.fill();
      ctx.fillStyle = '#8e735a'; U.ellipse(ctx, -6, -4, 14, 16); ctx.fill();
      ctx.fillStyle = '#b07cff';
      [[-16, -10], [-18, 6], [-8, 14]].forEach(([x, y]) => { ctx.beginPath(); ctx.moveTo(x, y - 7); ctx.lineTo(x + 4, y); ctx.lineTo(x, y + 4); ctx.lineTo(x - 4, y); ctx.closePath(); ctx.fill(); });
      ctx.fillStyle = '#6b5442'; U.circle(ctx, 16, 0, 10); ctx.fill();
      ctx.fillStyle = e.state === 'aim' || e.state === 'charge' ? '#ff5b5b' : '#ffb36b';
      U.circle(ctx, 22, -4, 2.2); ctx.fill(); U.circle(ctx, 22, 4, 2.2); ctx.fill();
      if (e.state === 'stunned') { ctx.fillStyle = '#ffd56a'; for (let i = 0; i < 3; i++) { const a = G.time * 6 + i * 2.1; U.circle(ctx, Math.cos(a) * 20, Math.sin(a) * 20, 3); ctx.fill(); } }
      ctx.restore();
    },
  });

  /* ---------- Boss: Stone Behemoth ---------- */
  Ens.register('behemoth', {
    name: 'Stone Behemoth', r: 64, hp: 6000, speed: 58, dmg: 22, score: 0, boss: true, knockMul: 0, blood: '#3e3328', gore: '#d0b090',
    init(e) { e.phase = 1; e.state = 'walk'; e.slamT = 4; e.throwT = 2.5; e.chargeT = 6; e.summonT = 6; },
    armorFn(e, dmg) { return e.state === 'stunned' ? dmg * 1.6 : dmg; },
    update(e, G, dt) {
      const p = G.player, d = Ens.distPlayer(e, G), k = e.hp / e.maxHp;
      const ph = k > 0.55 ? 1 : k > 0.25 ? 2 : 3;
      if (ph > e.phase) {
        e.phase = ph; e.state = 'walk';
        G.banner(`PHASE ${ph}`, ph === 2 ? 'Behemoth bắt đầu húc và gọi dơi' : 'Behemoth điên cuồng: sóng chấn kép', 2);
        MB.Audio.play('roar'); G.shake(14);
      }
      if (e.state === 'walk') {
        Ens.steer(e, G, p.x, p.y, e.speed * (ph === 3 ? 1.3 : 1), dt);
        e.slamT -= dt; e.throwT -= dt; e.chargeT -= dt; e.summonT -= dt;
        if (e.slamT <= 0 && d < 520) { e.state = 'slamPrep'; e.st = 0.8; G.telegraphCircle(e.x, e.y, 130, 0.8); }
        else if (e.throwT <= 0 && d > 200) {
          e.throwT = ph === 1 ? 3 : 2.4;
          const a = Ens.toPlayer(e, G);
          G.enemyShot({ x: e.x, y: e.y, a, speed: 330, r: 20, dmg: 15, life: 3, kind: 'rock', owner: e,
            onEnd: (GG, b) => {
              GG.burst(b.x, b.y, '#9b8e7e', 14, 160);
              for (let i = 0; i < 6; i++) GG.enemyShot({ x: b.x, y: b.y, a: i / 6 * U.TAU, speed: 210, r: 5, dmg: 5, life: 0.7, color: '#c9b49a' });
            } });
          MB.Audio.play('spit');
        } else if (ph >= 2 && e.chargeT <= 0 && d < 650) { e.state = 'aim'; e.st = 0.9; e.lock = Ens.toPlayer(e, G); }
        if (ph >= 2 && e.summonT <= 0) {
          e.summonT = 8;
          for (let i = 0; i < 3 && G.extraAlive() < 7; i++) { const a = U.rnd(0, U.TAU); G.spawnEnemyAt('bat', e.x + Math.cos(a) * 90, e.y + Math.sin(a) * 90, { extra: true }); }
        }
      } else if (e.state === 'slamPrep') {
        Ens.stop(e, dt, 12); e.st -= dt;
        if (e.st <= 0) {
          G.shockwave(e.x, e.y, 540, 1.3, 18);
          if (e.phase === 3) { const x = e.x, y = e.y; setTimeout(() => { if (G.running && !e.dead) G.shockwave(x, y, 540, 1.3, 18); }, 550); }
          e.slamT = e.phase === 1 ? 5 : e.phase === 2 ? 4.2 : 3.4;
          e.state = 'recover'; e.st = 0.5;
        }
      } else if (e.state === 'recover') {
        Ens.stop(e, dt, 12); e.st -= dt; if (e.st <= 0) e.state = 'walk';
      } else if (e.state === 'aim') {
        Ens.stop(e, dt, 12); e.st -= dt;
        e.lock += U.angDiff(e.lock, Ens.toPlayer(e, G)) * Math.min(1, dt * 2); e.face = e.lock;
        if (e.st <= 0) { e.state = 'charge'; e.st = 0.85; e.vx = Math.cos(e.lock) * 580; e.vy = Math.sin(e.lock) * 580; MB.Audio.play('roar'); }
      } else if (e.state === 'charge') {
        e.st -= dt;
        if (Math.random() < 0.7) G.particle({ x: e.x + U.rnd(-40, 40), y: e.y + U.rnd(-40, 40), vx: 0, vy: 0, life: 0.5, color: 'rgba(150,130,100,.55)', r: 8 });
        if (e.bumped || e.st <= 0) {
          e.chargeT = e.phase === 3 ? 4.5 : 6;
          if (e.bumped) { e.state = 'stunned'; e.st = 1.6; G.shake(14); G.text(e.x, e.y - 80, 'CHOÁNG!', '#ffd56a', 22); MB.Audio.play('slam'); }
          else e.state = 'walk';
          e.vx *= 0.2; e.vy *= 0.2;
        }
      } else if (e.state === 'stunned') {
        Ens.stop(e, dt, 10); e.st -= dt; if (e.st <= 0) e.state = 'walk';
      }
    },
    tele(ctx, e, G) { if (e.state === 'aim') G.drawTelegraphLine(ctx, e.x, e.y, e.lock, 460, 1 - e.st / 0.9); },
    draw(ctx, e, G) {
      const t = G.time;
      ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.face || 0);
      const moving = Math.hypot(e.vx, e.vy) > 15;
      const sw = moving ? Math.sin(t * 5) * 10 : 0;
      const lift = e.state === 'slamPrep' ? 1 - e.st / 0.8 : 0;
      // nắm đấm
      ctx.fillStyle = '#5c5248';
      for (const s of [-1, 1]) {
        const fx = 30 + s * sw + lift * 18, fy = s * (58 + lift * 10);
        ctx.fillStyle = '#4e463e'; U.circle(ctx, fx, fy, 22 + lift * 4); ctx.fill();
        ctx.fillStyle = '#6b6156'; U.circle(ctx, fx + 4, fy - s * 4, 12); ctx.fill();
      }
      // thân
      ctx.fillStyle = e.phase === 3 ? '#6e5a4e' : '#62584e'; U.ellipse(ctx, -6, 0, 58, 52); ctx.fill();
      ctx.fillStyle = '#7b7064';
      [[-24, -26, 20], [-30, 22, 18], [6, -30, 16], [8, 30, 16], [-48, 0, 16]].forEach(([x, y, r]) => { U.circle(ctx, x, y, r); ctx.fill(); });
      // vết nứt virus phát sáng
      const glow = 0.5 + Math.sin(t * 3) * 0.3 + (e.phase - 1) * 0.15;
      ctx.strokeStyle = `rgba(255,140,80,${glow})`; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(-40, -10); ctx.lineTo(-20, 0); ctx.lineTo(-30, 18); ctx.moveTo(-10, -30); ctx.lineTo(0, -12); ctx.lineTo(18, -16); ctx.stroke();
      // tinh thể virus trên lưng
      ctx.fillStyle = `rgba(190,120,255,${0.7 + glow * 0.3})`;
      [[-36, -14], [-42, 10], [-22, 30], [-24, -34]].forEach(([x, y]) => { ctx.beginPath(); ctx.moveTo(x - 6, y); ctx.lineTo(x - 22, y - 4); ctx.lineTo(x - 6, y - 8); ctx.closePath(); ctx.fill(); });
      // đầu
      ctx.fillStyle = '#544a41'; U.circle(ctx, 36, 0, 20); ctx.fill();
      ctx.shadowColor = '#ff8a4c'; ctx.shadowBlur = 12; ctx.fillStyle = '#ffb36b';
      U.circle(ctx, 48, -7, 3.5); ctx.fill(); U.circle(ctx, 48, 7, 3.5); ctx.fill();
      ctx.shadowBlur = 0;
      if (e.state === 'stunned') { ctx.fillStyle = '#ffd56a'; for (let i = 0; i < 4; i++) { const a = t * 5 + i * 1.6; U.circle(ctx, 30 + Math.cos(a) * 34, Math.sin(a) * 34, 4.5); ctx.fill(); } }
      ctx.restore();
    },
  });

  /* ---------- bản đồ ---------- */
  const rng = U.seeded(202);
  const obstacles = [];
  const nearLane = (x, r) => LANES.some((lx) => Math.abs(x - lx) < 70 + r);
  const R = (x, y, r) => { if (!nearLane(x, r)) obstacles.push({ kind: 'rock', shape: 'circle', x, y, r, c1: '#6a5e52', c2: '#857766' }); };
  const D = (x, y, r) => { if (!nearLane(x, r)) obstacles.push({ kind: 'deadtree', shape: 'circle', x, y, r }); };
  const C = (x, y, w, h, rot) => obstacles.push({ kind: 'cliff', shape: 'box', x, y, w, h, rot: rot || 0 });
  const PIT = (x, y, w, h, rot) => obstacles.push({ kind: 'chasm', shape: 'box', x, y, w, h, rot: rot || 0, noShot: true });

  // vách đá viền bản đồ (chừa lối cho làn đá lăn)
  for (let x = 60; x < WW; x += 90 + rng() * 50) { R(x, 40 + rng() * 40, 55 + rng() * 25); R(x + 30, WH - 40 - rng() * 40, 55 + rng() * 25); }
  for (let y = 180; y < WH - 150; y += 100 + rng() * 50) { if (Math.abs(y - 1100) > 170) R(35 + rng() * 40, y, 55 + rng() * 20); R(WW - 35 - rng() * 40, y, 55 + rng() * 20); }
  PIT(600, 420, 260, 90, 0.3); PIT(1350, 1520, 360, 110, 0.1); PIT(2160, 520, 300, 100, -0.2); PIT(2950, 1750, 220, 90, 0.4);
  C(1250, 760, 70, 300, 0.1); C(2150, 1420, 280, 64, -0.1); C(620, 1350, 220, 60, 0.35); C(2850, 650, 60, 260, -0.15);
  [[480, 900, 46], [1150, 1100, 50], [1500, 640, 44], [1980, 1050, 56], [2280, 1000, 40], [2700, 1300, 48], [400, 1500, 44], [1500, 1900, 46], [2200, 1880, 42], [1600, 260, 46]].forEach((a) => R(...a));
  [[800, 1750, 46], [1200, 380, 44], [2050, 300, 46], [2650, 1650, 44], [300, 600, 42], [2800, 1450, 40]].forEach((a) => D(...a));

  MB.registerGate({
    id: 2, seed: 202,
    title: 'GATE 02 — MOUNTAIN', subtitle: 'Vách Núi Đá Lăn',
    world: { w: WW, h: WH }, bg: '#120e0a', mmColor: 'rgba(170,150,120,.6)',
    start: { x: 240, y: 1100 },
    obstacles,
    crates: [{ x: 700, y: 1100 }, { x: 1400, y: 900 }, { x: 1150, y: 1900 }, { x: 2050, y: 760 }, { x: 2300, y: 1650 }, { x: 2850, y: 350 }, { x: 420, y: 1900, rot: 0.3 }, { x: 2950, y: 1100 }],
    hazards: [],
    spawnPoints: [
      { x: 350, y: 300 }, { x: 1300, y: 230 }, { x: 2300, y: 240 }, { x: 3000, y: 300 }, { x: 3000, y: 1100 }, { x: 3000, y: 1900 },
      { x: 2250, y: 2000 }, { x: 1250, y: 2000 }, { x: 350, y: 1950 }, { x: 1550, y: 1150 }, { x: 2200, y: 1150 }, { x: 800, y: 700 },
    ],
    waves: [
      { total: 12, maxAlive: 7, mix: { zombie: 6, bat: 4 }, interval: [0.8, 1.4], elite: 0.05 },
      { total: 16, maxAlive: 9, mix: { zombie: 4, bat: 4, spider: 3, brute: 1 }, interval: [0.7, 1.2], elite: 0.1 },
      { total: 20, maxAlive: 11, mix: { zombie: 3, bat: 4, spider: 3, licker: 2, brute: 2 }, interval: [0.55, 1.0], elite: 0.13 },
    ],
    boss: { type: 'behemoth', x: 2850, y: 1100 },
    intro: { title: 'NHIỆM VỤ', text: 'Băng qua vách núi. Coi chừng vạch đỏ trên làn đá lăn và miệng vực.' },
    objectives: [
      { title: 'MOUNTAIN PASS', text: 'Dơi bay qua cả vực và vật cản. Đá lăn cũng nghiền nát quái.' },
      { title: 'ROCKSLIDE', text: 'Brute xuất hiện: dụ nó húc vào đá để làm choáng (sát thương ×2).' },
      { title: 'SUMMIT', text: 'Wave cuối trước Boss.' },
      { title: 'BOSS · STONE BEHEMOTH', text: 'Né vòng sóng chấn bằng lộn né (Space/DODGE). Dụ nó húc vào vách đá.' },
    ],
    challenges: [
      { id: 'crystals', type: 'destroy', name: 'Tinh Thể Virus', desc: 'Phá 4 tinh thể', kind: 'crystal', r: 30, hp: 180,
        spawner: { type: 'bat', every: 7, range: 750, cap: 5 },
        targets: [{ x: 480, y: 1720 }, { x: 1350, y: 300 }, { x: 2100, y: 1950 }, { x: 2950, y: 900 }], reward: { weapon: 'smg' } },
      { id: 'radio', type: 'hold', name: 'Trạm Radio', desc: 'Đứng trong vùng xanh 14 giây', zone: { x: 1380, y: 1150, r: 115 }, time: 14,
        mix: { zombie: 2, bat: 2, spider: 1 }, spawnEvery: 2.2, reward: { mod: 'split' } },
      { id: 'streak', type: 'streak', name: 'Bất Khả Xâm Phạm', desc: '15 hạ gục liên tiếp không trúng đòn', count: 15, reward: { mod: 'barrel' } },
    ],

    setup(G) { G.gs.boulderT = 7; G.gs.boulders = []; },
    update(G, dt) {
      const gs = G.gs, p = G.player;
      if (G.state !== 'intro' && G.state !== 'won' && !G.over) gs.boulderT -= dt;
      if (gs.boulderT <= 0) {
        gs.boulderT = U.rnd(6, 9) - (G.state === 'boss' ? 1.5 : 0);
        // ưu tiên làn gần người chơi
        const lane = LANES.slice().sort((a, b) => Math.abs(a - p.x) - Math.abs(b - p.x))[Math.random() < 0.6 ? 0 : (Math.random() * 3) | 0];
        const down = Math.random() < 0.5;
        G.addFx({
          layer: 'ground', life: 1.5,
          draw(ctx, fx) {
            const k = fx.t / fx.life, a = 0.15 + Math.abs(Math.sin(fx.t * 12)) * 0.25;
            ctx.fillStyle = `rgba(255,70,50,${a})`; ctx.fillRect(lane - 48, 0, 96, WH);
            ctx.fillStyle = `rgba(255,120,90,${0.5 + k * 0.4})`;
            for (let y = 60; y < WH; y += 160) {
              const yy = down ? y : WH - y;
              ctx.beginPath(); ctx.moveTo(lane - 20, yy - (down ? 14 : -14)); ctx.lineTo(lane + 20, yy - (down ? 14 : -14)); ctx.lineTo(lane, yy + (down ? 14 : -14)); ctx.closePath(); ctx.fill();
            }
          },
          end(GG) { GG.gs.boulders.push({ x: lane, y: down ? -50 : WH + 50, vy: down ? 470 : -470, r: 36, rot: 0 }); GG.shake(5); MB.Audio.play('slam'); },
        });
      }
      for (let i = gs.boulders.length - 1; i >= 0; i--) {
        const b = gs.boulders[i];
        b.y += b.vy * dt; b.rot += b.vy * dt / b.r;
        if (Math.random() < 0.5) G.particle({ x: b.x + U.rnd(-30, 30), y: b.y - Math.sign(b.vy) * 30, vx: U.rnd(-40, 40), vy: 0, life: 0.5, color: 'rgba(160,140,110,.5)', r: 5 });
        if (!p.dead && U.dist(b.x, b.y, p.x, p.y) < b.r + p.r) G.hurtPlayer(25, { x: b.x, y: b.y - Math.sign(b.vy) * 40 });
        for (const e of G.enemies) if (!e.dead && !e.fly && !e.boss && U.dist(b.x, b.y, e.x, e.y) < b.r + e.r) { G.damageEnemy(e, 300, Math.sign(b.vy) * Math.PI / 2, 0); }
        if (b.y < -80 || b.y > WH + 80) gs.boulders.splice(i, 1);
      }
    },
    drawOver(G, ctx) {
      for (const b of G.gs.boulders) {
        ctx.fillStyle = 'rgba(0,0,0,.3)'; U.ellipse(ctx, b.x + 6, b.y + 12, b.r, b.r * 0.6); ctx.fill();
        ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.rot);
        ctx.fillStyle = '#7a6d5e'; U.circle(ctx, 0, 0, b.r); ctx.fill();
        ctx.fillStyle = '#958672'; U.circle(ctx, -b.r * 0.3, -b.r * 0.3, b.r * 0.45); ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(-b.r * 0.8, 0); ctx.lineTo(b.r * 0.8, 0); ctx.moveTo(0, -b.r * 0.6); ctx.lineTo(0, b.r * 0.6); ctx.stroke();
        ctx.restore();
      }
    },

    buildGround(g, w, h, rand) {
      g.fillStyle = '#3a3027'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 300; i++) {
        const x = rand() * w, y = rand() * h, r = 40 + rand() * 110;
        g.fillStyle = rand() < 0.5 ? 'rgba(80,66,52,.35)' : 'rgba(30,24,18,.22)';
        g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
      }
      for (let i = 0; i < 2600; i++) {
        const x = rand() * w, y = rand() * h;
        g.fillStyle = rand() < 0.5 ? 'rgba(140,120,96,.45)' : 'rgba(20,16,12,.45)';
        g.fillRect(x, y, 2 + rand() * 4, 2 + rand() * 3);
      }
      // đường đèo
      g.lineCap = 'round';
      const path = () => { g.beginPath(); g.moveTo(100, 1100); g.bezierCurveTo(700, 950, 1100, 1250, 1600, 1100); g.bezierCurveTo(2100, 950, 2500, 1250, 3100, 1100); };
      g.strokeStyle = 'rgba(120,98,72,.5)'; g.lineWidth = 140; path(); g.stroke();
      g.strokeStyle = 'rgba(150,124,92,.35)'; g.lineWidth = 80; path(); g.stroke();
      // rãnh đá lăn
      for (const lx of LANES) {
        g.fillStyle = 'rgba(25,20,15,.45)'; g.fillRect(lx - 52, 0, 104, h);
        g.strokeStyle = 'rgba(110,90,70,.5)'; g.lineWidth = 3;
        for (let y = 0; y < h; y += 46) { g.beginPath(); g.moveTo(lx - 40, y); g.lineTo(lx - 30, y + 20); g.moveTo(lx + 40, y + 20); g.lineTo(lx + 30, y + 40); g.stroke(); }
      }
      // vết nứt
      for (let k = 0; k < 40; k++) {
        let x = rand() * w, y = rand() * h, a = rand() * Math.PI * 2;
        g.strokeStyle = 'rgba(15,10,8,.5)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y);
        for (let s = 0; s < 6; s++) { a += (rand() - 0.5) * 1.2; x += Math.cos(a) * 24; y += Math.sin(a) * 24; g.lineTo(x, y); }
        g.stroke();
      }
      // cỏ khô
      for (let i = 0; i < 700; i++) {
        const x = rand() * w, y = rand() * h, l = 4 + rand() * 7, a = -Math.PI / 2 + (rand() - 0.5);
        g.strokeStyle = 'rgba(170,150,90,.4)'; g.lineWidth = 1.4;
        g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
      }
      const v = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.65);
      v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.5)');
      g.fillStyle = v; g.fillRect(0, 0, w, h);
    },
  });
})(window.MB);
