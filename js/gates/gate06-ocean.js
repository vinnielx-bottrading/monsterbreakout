/* Gate 06 — Ocean: Đảo Hoang
   Cơ chế: kênh nước sâu (chỉ qua bằng cầu ván, đạn bay qua được), nước nông làm chậm, thuỷ triều dâng định kỳ.
   Quái mới: Crab Mutant (càng trước chặn đạn: bắn sườn/sau hoặc dùng lựu đạn), Drowned (lặn dưới nước, trồi lên tóm).
   Boss: Kraken — nằm trong đầm, chỉ trồi đầu khi mất hết xúc tu. Phun mực che tầm nhìn, gọi xoáy nước.
   Thử thách: phá 4 phao sonar (→ Arc Plasma), giữ hải đăng (→ Lõi Xuyên Phá), 16 hạ gục (→ Băng Đạn Mở Rộng). */
'use strict';
(function (MB) {
  const U = MB.U, Ens = MB.Enemies, GK = MB.GK;
  const WW = 3400, WH = 2300;
  const LAGOON = { x: 2780, y: 1150, r: 230 };

  /* ---------- props ---------- */
  MB.Props.register('deep', (ctx, o, t) => {
    // mặt nước sâu đã vẽ trên nền; ở đây chỉ vẽ sóng nhẹ
    ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(o.rot || 0);
    ctx.strokeStyle = 'rgba(200,235,255,.18)'; ctx.lineWidth = 2;
    const w = o.shape === 'box' ? o.w : o.r * 2, h = o.shape === 'box' ? o.h : o.r * 2;
    for (let i = 0; i < 4; i++) { const yy = -h / 2 + ((t * 18 + i * h / 4) % h); ctx.beginPath(); ctx.moveTo(-w * 0.35, yy); ctx.quadraticCurveTo(0, yy - 6, w * 0.35, yy); ctx.stroke(); }
    ctx.restore();
  });
  MB.Props.register('palm', (ctx, o, t) => {
    const { x, y, r } = o;
    MB.Props.shadow(ctx, x + 10, y + 12, r * 1.2, r * 0.7, 0.25);
    ctx.fillStyle = '#7a5a36'; U.circle(ctx, x, y, r * 0.3); ctx.fill();
    for (let i = 0; i < 7; i++) {
      const a = i / 7 * U.TAU + Math.sin(t + x) * 0.05;
      ctx.fillStyle = i % 2 ? '#3f8a3a' : '#57a24a';
      ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + Math.cos(a + 0.3) * r, y + Math.sin(a + 0.3) * r, x + Math.cos(a) * r * 1.5, y + Math.sin(a) * r * 1.5);
      ctx.quadraticCurveTo(x + Math.cos(a - 0.3) * r, y + Math.sin(a - 0.3) * r, x, y); ctx.fill();
    }
    ctx.fillStyle = '#6e4a2a'; U.circle(ctx, x + 3, y - 2, 4); ctx.fill(); U.circle(ctx, x - 3, y + 2, 4); ctx.fill();
  });
  MB.Props.register('boat', (ctx, o) => {
    ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(o.rot);
    ctx.fillStyle = 'rgba(0,0,0,.25)'; U.ellipse(ctx, 6, 8, o.hw, o.hh); ctx.fill();
    ctx.fillStyle = '#6e4a2e'; ctx.beginPath(); ctx.moveTo(-o.hw, -o.hh); ctx.lineTo(o.hw * 0.6, -o.hh); ctx.lineTo(o.hw, 0); ctx.lineTo(o.hw * 0.6, o.hh); ctx.lineTo(-o.hw, o.hh); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#8a6440'; ctx.fillRect(-o.hw + 6, -o.hh + 6, o.w - 30, o.h - 12);
    ctx.strokeStyle = '#4a3020'; ctx.lineWidth = 2; for (let i = -o.hw + 16; i < o.hw * 0.5; i += 16) { ctx.beginPath(); ctx.moveTo(i, -o.hh + 4); ctx.lineTo(i, o.hh - 4); ctx.stroke(); }
    ctx.restore();
  });
  MB.Props.register('buoy', (ctx, o, t) => {
    const { x, y, r } = o, bob = Math.sin(t * 2 + x) * 2;
    ctx.fillStyle = 'rgba(200,235,255,.25)'; U.circle(ctx, x, y, r * 1.3 + Math.sin(t * 3) * 2); ctx.fill();
    ctx.fillStyle = o.flash > 0 ? '#ffffff' : '#d84a3a'; U.circle(ctx, x, y + bob, r * 0.8); ctx.fill();
    ctx.fillStyle = '#f2f2f2'; ctx.fillRect(x - r * 0.8, y + bob - 4, r * 1.6, 8);
    ctx.fillStyle = Math.floor(t * 3) % 2 ? '#7ef3ff' : '#2a5a6a'; U.circle(ctx, x, y + bob - r * 0.5, 4); ctx.fill();
  });

  /* ---------- Crab Mutant ---------- */
  Ens.register('crab', {
    name: 'Crab Mutant', r: 22, hp: 120, speed: 72, dmg: 14, score: 260, knockMul: 0.4, blood: '#5a2a1a', gore: '#ffb08a',
    init(e) { e.sideT = U.rnd(1, 2); e.dir = Math.random() < 0.5 ? 1 : -1; },
    armorFn: Ens.AI.shieldFront(0.15, 1.0),
    update(e, G, dt) {
      const p = G.player, d = Ens.distPlayer(e, G);
      e.sideT -= dt; if (e.sideT <= 0) { e.sideT = U.rnd(1, 2.2); e.dir *= -1; }
      const a = Math.atan2(p.y - e.y, p.x - e.x);
      // bò ngang kiểu cua nhưng luôn quay càng về phía người chơi
      const tx = e.x + Math.cos(a) * 80 + Math.cos(a + Math.PI / 2) * 70 * e.dir * (d > 120 ? 1 : 0.3);
      const ty = e.y + Math.sin(a) * 80 + Math.sin(a + Math.PI / 2) * 70 * e.dir * (d > 120 ? 1 : 0.3);
      Ens.steer(e, G, tx, ty, e.speed, dt);
      e.face = a;
    },
    draw(ctx, e, G) {
      ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.face || 0);
      const t = G.time, sw = Math.sin(t * 14 + e.t) * 0.3;
      ctx.strokeStyle = '#8a3a22'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      for (const sd of [-1, 1]) for (let k = 0; k < 3; k++) { const a = sd * (1.9 + k * 0.35) + sw * (k % 2 ? 1 : -1); ctx.beginPath(); ctx.moveTo(-4, sd * 8); ctx.lineTo(-4 + Math.cos(a) * 22, sd * 8 + Math.sin(a) * 22 * 0.6 + sd * 6); ctx.stroke(); }
      ctx.fillStyle = '#b8502e'; U.ellipse(ctx, -3, 0, 18, 21); ctx.fill();
      ctx.fillStyle = '#d0704a'; U.ellipse(ctx, -5, 0, 10, 13); ctx.fill();
      for (const sd of [-1, 1]) {
        ctx.fillStyle = '#c85e38'; U.ellipse(ctx, 18, sd * 15, 11, 8, sd * 0.3); ctx.fill();
        ctx.fillStyle = '#e8a080'; ctx.beginPath(); ctx.moveTo(26, sd * 12); ctx.lineTo(34, sd * 16); ctx.lineTo(26, sd * 19); ctx.fill();
      }
      ctx.fillStyle = '#1a1a1a'; U.circle(ctx, 12, -5, 2); ctx.fill(); U.circle(ctx, 12, 5, 2); ctx.fill();
      ctx.restore();
    },
  });

  /* ---------- Drowned ---------- */
  Ens.register('drowned', Ens.make({
    name: 'Drowned', r: 19, hp: 80, speed: 70, dmg: 13, score: 190, blood: '#2a4a5a', gore: '#9ac8d8',
    draw(ctx, e, G) {
      ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.face || 0);
      const sw = Math.sin(G.time * 6 + e.t) * 4;
      ctx.fillStyle = '#2e4a58'; U.rr(ctx, -6 + sw, -10, 12, 7, 3); ctx.fill(); U.rr(ctx, -6 - sw, 3, 12, 7, 3); ctx.fill();
      ctx.fillStyle = '#4e7a82'; U.rr(ctx, -12, -13, 22, 26, 9); ctx.fill();
      ctx.strokeStyle = '#2f6a3a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-10, -8); ctx.quadraticCurveTo(-2, 0, -10, 9); ctx.stroke();
      ctx.strokeStyle = '#8ab4ba'; ctx.lineWidth = 5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(2, -11); ctx.lineTo(20 + sw * 0.4, -9); ctx.moveTo(2, 11); ctx.lineTo(19 - sw * 0.4, 10); ctx.stroke();
      ctx.fillStyle = '#9ac0c4'; U.circle(ctx, 1, 0, 8.5); ctx.fill();
      ctx.fillStyle = '#e8ffff'; U.circle(ctx, 5, -3, 1.9); ctx.fill(); U.circle(ctx, 5, 3, 1.9); ctx.fill();
      ctx.restore();
    },
  }, Ens.AI.burrower({ up: 3, emerge: 100, underMul: 1.4, dirt: '#9ad0e8', ripple: '160,220,255' })));

  /* ---------- Xúc tu (do Kraken gọi) ---------- */
  Ens.register('tentacle', {
    name: 'Tentacle', r: 28, hp: 520, speed: 0, dmg: 18, score: 300, knockMul: 0, noContact: true, blood: '#3a1a4a', gore: '#c89ae8',
    init(e) { e.state = 'idle'; e.cd = U.rnd(1.5, 3); },
    update(e, G, dt) {
      const p = G.player, d = Ens.distPlayer(e, G);
      e.vx = 0; e.vy = 0; e.cd -= dt;
      if (e.state === 'idle') {
        e.face = (e.face || 0) + U.angDiff(e.face || 0, Ens.toPlayer(e, G)) * Math.min(1, dt * 2);
        if (e.cd <= 0 && d < 380) { e.state = 'aim'; e.st = 0.85; e.lock = Ens.toPlayer(e, G); }
      } else if (e.state === 'aim') {
        e.st -= dt; e.face = e.lock;
        if (e.st <= 0) {
          e.state = 'slam'; e.st = 0.4; G.shake(8); MB.Audio.play('slam');
          // vùng đập: dải dài 340, rộng 54
          const px = p.x - e.x, py = p.y - e.y, along = px * Math.cos(e.lock) + py * Math.sin(e.lock), side = -px * Math.sin(e.lock) + py * Math.cos(e.lock);
          if (along > 0 && along < 350 && Math.abs(side) < 27 + p.r) G.hurtPlayer(e.dmg, e);
          for (let k = 0; k < 6; k++) G.burst(e.x + Math.cos(e.lock) * k * 60, e.y + Math.sin(e.lock) * k * 60, '#bfe8ff', 4, 100);
        }
      } else if (e.state === 'slam') { e.st -= dt; if (e.st <= 0) { e.state = 'idle'; e.cd = U.rnd(2.2, 3.4); } }
    },
    tele(ctx, e, G) {
      if (e.state !== 'aim') return;
      const k = 1 - e.st / 0.85;
      ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.lock);
      ctx.fillStyle = `rgba(255,70,70,${0.12 + k * 0.25})`; ctx.fillRect(0, -27, 350, 54);
      ctx.strokeStyle = 'rgba(255,90,90,.7)'; ctx.lineWidth = 2; ctx.strokeRect(0, -27, 350, 54);
      ctx.restore();
    },
    draw(ctx, e, G) {
      const t = G.time, slam = e.state === 'slam';
      ctx.fillStyle = 'rgba(200,235,255,.3)'; U.circle(ctx, e.x, e.y, 34 + Math.sin(t * 3) * 3); ctx.fill();
      ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.face || 0);
      const len = slam ? 340 : 70 + Math.sin(t * 3 + e.t) * 10;
      ctx.lineCap = 'round';
      for (let i = 0; i < 8; i++) {
        const k = i / 8, x = k * len, y = slam ? 0 : Math.sin(t * 4 + k * 5 + e.t) * 14 * k;
        ctx.fillStyle = i % 2 ? '#6a3a8a' : '#7e4aa0'; U.circle(ctx, x, y, 22 * (1 - k * 0.7)); ctx.fill();
        ctx.fillStyle = '#e8c8f8'; U.circle(ctx, x, y + 8 * (1 - k), 3 * (1 - k * 0.5)); ctx.fill();
      }
      ctx.restore();
    },
  });

  /* ---------- Boss: Kraken ---------- */
  Ens.register('kraken', {
    name: 'Kraken', r: 80, hp: 8000, speed: 0, dmg: 20, score: 0, boss: true, knockMul: 0, noContact: true, fly: true, noHover: true, blood: '#3a1a4a', gore: '#c89ae8',
    init(e) { e.phase = 1; e.state = 'sub'; e.invuln = true; e.growT = 1; e.inkT = 8; e.spoutT = 4; e.whirl = 0; e.sumT = 7; e.tents = []; },
    armorFn(e, dmg) { return dmg * 1.6; },
    update(e, G, dt) {
      const p = G.player, k = e.hp / e.maxHp;
      const ph = k > 0.6 ? 1 : k > 0.25 ? 2 : 3;
      if (ph > e.phase) { e.phase = ph; G.banner(`PHASE ${ph}`, ph === 2 ? 'Kraken mọc xúc tu nhanh hơn' : 'Kraken tạo xoáy nước kéo bạn vào đầm', 2); MB.Audio.play('roar'); G.shake(12); }
      e.vx = 0; e.vy = 0; e.face = Ens.toPlayer(e, G);
      e.tents = e.tents.filter((t) => !t.dead);
      if (e.state === 'sub') {
        e.invuln = true;
        if (!e.full) {
          e.growT -= dt;
          if (e.growT <= 0 && e.tents.length < 4) {
            e.growT = ph === 1 ? 1.2 : 0.8;
            const a = Ens.toPlayer(e, G) + U.rnd(-1.4, 1.4), R = LAGOON.r + 40 + U.rnd(0, 140);
            const t = G.spawnEnemyAt('tentacle', e.x + Math.cos(a) * R, e.y + Math.sin(a) * R, { extra: true });
            if (t) { t.hp = t.maxHp = 520 * (1 + (ph - 1) * 0.15); e.tents.push(t); }
            if (e.tents.length >= 4) e.full = true;
          }
        } else if (e.tents.length === 0) {
          e.state = 'up'; e.st = 5.5; e.invuln = false; e.full = false;
          G.banner('KRAKEN TRỒI LÊN', 'Bắn vào đầu! (nhận ×1,6 sát thương)', 1.8); MB.Audio.play('roar'); G.shake(10);
        }
      } else if (e.state === 'up') {
        e.st -= dt;
        if (e.st <= 0) { e.state = 'sub'; e.invuln = true; e.growT = 0.5; e.full = false; }
      }
      // phun nước vòng cung
      e.spoutT -= dt;
      if (e.spoutT <= 0) {
        e.spoutT = ph === 1 ? 4 : 3;
        for (let i = 0; i < 3; i++) {
          const tx = p.x + U.rnd(-120, 120), ty = p.y + U.rnd(-120, 120), dd = U.dist(tx, ty, e.x, e.y);
          G.telegraphCircle(tx, ty, 60, 1.1, null, 'rgba(120,200,255,.14)');
          G.enemyShot({ x: e.x, y: e.y, a: Math.atan2(ty - e.y, tx - e.x), speed: dd / 1.1, r: 10, dmg: 0, life: 1.1, kind: 'orb', color: '#7ec8ff', pass: true, owner: e,
            onEnd: (GG, b) => { GG.explosion(b.x, b.y, 60, 0, { player: 14, enemies: false, color: '#bfe8ff', ring: '160,220,255', small: true, obstacles: false }); } });
        }
      }
      // phun mực che màn hình
      e.inkT -= dt;
      if (e.inkT <= 0) { e.inkT = U.rnd(12, 16); G.gs.ink = 4.5; G.banner('', 'Kraken phun mực!', 1.2); }
      if (ph >= 2) { e.sumT -= dt; if (e.sumT <= 0) { e.sumT = 7; for (let i = 0; i < 2 && G.extraAlive() < 9; i++) G.spawnEnemyAt('drowned', p.x + U.rnd(-200, 200), p.y + U.rnd(-200, 200), { extra: true }); } }
      // xoáy nước
      if (ph === 3) {
        const d = U.dist(p.x, p.y, e.x, e.y);
        if (d < 700 && !p.dash) { const a = Math.atan2(e.y - p.y, e.x - p.x); p.vx += Math.cos(a) * 160 * dt; p.vy += Math.sin(a) * 160 * dt; }
      }
    },
    draw(ctx, e, G) {
      const t = G.time, up = e.state === 'up';
      ctx.strokeStyle = 'rgba(200,235,255,.25)'; ctx.lineWidth = 3;
      for (let i = 0; i < 3; i++) { const k = (t * 0.5 + i / 3) % 1; U.circle(ctx, e.x, e.y, 60 + k * 140); ctx.stroke(); }
      ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.face || 0);
      ctx.globalAlpha = up ? 1 : 0.45;
      ctx.fillStyle = e.phase === 3 ? '#7a2a6a' : '#5e3080'; U.ellipse(ctx, -10, 0, up ? 80 : 60, up ? 64 : 48); ctx.fill();
      ctx.fillStyle = '#7a48a0'; U.ellipse(ctx, -24, 0, 44, 36); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.shadowColor = '#ffd56a'; ctx.shadowBlur = 16; ctx.fillStyle = '#ffd56a';
      U.ellipse(ctx, 34, -26, 10, 7); ctx.fill(); U.ellipse(ctx, 34, 26, 10, 7); ctx.fill(); ctx.shadowBlur = 0;
      ctx.fillStyle = '#1a0a1a'; ctx.fillRect(32, -28, 4, 4); ctx.fillRect(32, 24, 4, 4);
      if (up) { ctx.fillStyle = '#d8c8a0'; ctx.beginPath(); ctx.moveTo(52, -8); ctx.lineTo(70, 0); ctx.lineTo(52, 8); ctx.fill(); }
      ctx.restore();
    },
  });

  /* ---------- bản đồ ---------- */
  const rng = U.seeded(606);
  const obstacles = [];
  const channel = (x, segs) => segs.forEach(([y1, y2]) => obstacles.push({ kind: 'deep', shape: 'box', x, y: (y1 + y2) / 2, w: 150, h: y2 - y1, rot: 0, noShot: true }));
  channel(1000, [[0, 520], [680, 1420], [1580, 2300]]);
  channel(1950, [[0, 1070], [1230, 1820], [1980, 2300]]);
  obstacles.push({ kind: 'deep', shape: 'circle', x: LAGOON.x, y: LAGOON.y, r: LAGOON.r, noShot: true });
  const PALM = (L, x, y) => L.push({ kind: 'palm', shape: 'circle', x, y, r: 26 + rng() * 10 });
  const ROCK = (L, x, y) => L.push({ kind: 'rock', shape: 'circle', x, y, r: 30 + rng() * 20, c1: '#6e6a62', c2: '#8a867c' });
  GK.border(obstacles, rng, WW, WH, (L, x, y) => (rng() < 0.6 ? PALM(L, x, y) : ROCK(L, x, y)), 1150);
  const keep = [{ x: 250, y: 1150, r: 300 }, { x: 1000, y: 1150, r: 150 }, { x: 1950, y: 1150, r: 150 }, { x: 1000, y: 600, r: 150 }, { x: 1000, y: 1500, r: 150 },
    { x: 1950, y: 1900, r: 150 }, { x: LAGOON.x, y: LAGOON.y, r: LAGOON.r + 220 }, { x: 1480, y: 500, r: 170 },
    { x: 500, y: 450, r: 120 }, { x: 1480, y: 1900, r: 120 }, { x: 2500, y: 350, r: 120 }, { x: 3100, y: 2000, r: 120 }];
  for (const o of obstacles.filter((o) => o.kind === 'deep' && o.shape === 'box')) for (let yy = o.y - o.h / 2; yy <= o.y + o.h / 2; yy += 100) keep.push({ x: o.x, y: yy, r: 200 });
  GK.scatter(obstacles, rng, 16, [250, 250, WW - 250, WH - 250], keep, PALM);
  GK.scatter(obstacles, rng, 8, [250, 250, WW - 250, WH - 250], keep, ROCK);
  [[650, 900, 150, 50, 0.6], [1500, 1350, 160, 52, -0.4], [2350, 600, 150, 50, 0.3]].forEach(([x, y, w, h, rot]) => obstacles.push({ kind: 'boat', shape: 'box', x, y, w, h, rot }));
  // nước nông dọc bờ kênh
  const hazards = [];
  for (const o of obstacles.filter((o) => o.kind === 'deep' && o.shape === 'box')) {
    for (let y = o.y - o.h / 2 + 40; y < o.y + o.h / 2 - 20; y += 120) for (const sd of [-1, 1]) hazards.push({ kind: 'water', x: o.x + sd * 100, y, r: 60, slowMul: 0.7, base: 60 });
  }
  for (let i = 0; i < 12; i++) { const a = i / 12 * U.TAU; hazards.push({ kind: 'water', x: LAGOON.x + Math.cos(a) * (LAGOON.r + 40), y: LAGOON.y + Math.sin(a) * (LAGOON.r + 40), r: 70, slowMul: 0.7, base: 70 }); }

  MB.registerGate({
    id: 6, seed: 606, view3d: true,
    title: 'GATE 06 — OCEAN', subtitle: 'Đảo Hoang',
    world: { w: WW, h: WH }, bg: '#0a2a40', mmColor: 'rgba(210,190,130,.7)',
    scale: { hp: 1.4, dmg: 1.2 },
    start: { x: 250, y: 1150 },
    obstacles, hazards,
    crates: [{ x: 600, y: 1300 }, { x: 700, y: 400 }, { x: 1500, y: 800 }, { x: 1450, y: 1650 }, { x: 2400, y: 1700 }, { x: 2300, y: 300 }, { x: 3150, y: 600 }],
    spawnPoints: [
      { x: 350, y: 300 }, { x: 350, y: 2000 }, { x: 1480, y: 260 }, { x: 1480, y: 2050 }, { x: 2400, y: 260 }, { x: 2400, y: 2050 },
      { x: 3200, y: 300 }, { x: 3200, y: 2000 }, { x: 700, y: 1150 }, { x: 1480, y: 1150 }, { x: 2350, y: 1150 },
    ],
    waves: [
      { total: 16, maxAlive: 9, mix: { zombie: 4, crab: 3, drowned: 3 }, interval: [0.75, 1.25], elite: 0.08 },
      { total: 20, maxAlive: 10, mix: { crab: 4, drowned: 4, spider: 2, licker: 1 }, interval: [0.65, 1.1], elite: 0.11 },
      { total: 24, maxAlive: 12, mix: { crab: 5, drowned: 4, licker: 2, zombie: 3 }, interval: [0.5, 0.95], elite: 0.15 },
    ],
    boss: { type: 'kraken', x: LAGOON.x, y: LAGOON.y, fixed: true },
    intro: { title: 'NHIỆM VỤ', text: 'Kênh nước sâu chỉ qua được bằng cầu ván. Thuỷ triều dâng làm vùng nước nông rộng ra.' },
    objectives: [
      { title: 'SHORELINE', text: 'Crab Mutant chặn đạn bằng càng phía trước: bắn vào sườn/sau hoặc dùng lựu đạn.' },
      { title: 'HIGH TIDE', text: 'Drowned lặn dưới nước (gợn sóng xanh) và trồi lên ở vòng đỏ.' },
      { title: 'THE LAGOON', text: 'Wave cuối trước Boss.' },
      { title: 'BOSS · KRAKEN', text: 'Phá hết xúc tu (vạch đỏ = sắp đập) để Kraken trồi đầu. Bắn đầu khi nó nổi lên.' },
    ],
    challenges: [
      { id: 'buoys', type: 'destroy', name: 'Phao Sonar', desc: 'Phá 4 phao sonar', kind: 'buoy', r: 26, hp: 220,
        spawner: { type: 'drowned', every: 9, range: 700, cap: 4 },
        targets: [{ x: 500, y: 450 }, { x: 1480, y: 1900 }, { x: 2500, y: 350 }, { x: 3100, y: 2000 }], reward: { weapon: 'plasma' } },
      { id: 'light', type: 'hold', name: 'Hải Đăng', desc: 'Đứng trong vùng xanh 14 giây', zone: { x: 1480, y: 500, r: 115 }, time: 14,
        mix: { crab: 1, drowned: 2 }, spawnEvery: 2.2, reward: { mod: 'pierce' } },
      { id: 'streak', type: 'streak', name: 'Lướt Sóng', desc: '16 hạ gục liên tiếp không trúng đòn', count: 16, reward: { mod: 'mag' } },
    ],

    setup(G) { G.gs.tide = 0; G.gs.tideOn = false; G.gs.tideT = 25; G.gs.ink = 0; },
    update(G, dt) {
      const gs = G.gs;
      gs.ink = Math.max(0, gs.ink - dt);
      if (G.state === 'intro' || G.over) return;
      gs.tideT -= dt;
      if (gs.tideT <= 0) {
        gs.tideOn = !gs.tideOn; gs.tideT = gs.tideOn ? 10 : U.rnd(22, 28);
        if (gs.tideOn) MB.HUD.toast('<b>THUỶ TRIỀU DÂNG</b> · nước nông lan rộng', '#7ec8ff');
      }
      gs.tide += ((gs.tideOn ? 1 : 0) - gs.tide) * Math.min(1, dt * 0.8);
      for (const h of G.hazards) if (h.kind === 'water' && h.base) { h.r = h.base * (1 + gs.tide * 0.35); h.slowMul = 0.7 - gs.tide * 0.15; }
    },
    drawScreen(G, ctx) {
      const ink = G.gs.ink || 0;
      if (ink > 0) {
        const a = Math.min(1, ink / 1.2) * 0.85;
        ctx.fillStyle = `rgba(10,5,20,${a * 0.5})`; ctx.fillRect(0, 0, G.W, G.H);
        ctx.fillStyle = `rgba(10,5,20,${a})`;
        for (let i = 0; i < 9; i++) { const x = ((i * 397) % G.W), y = ((i * 211 + 80) % G.H); U.circle(ctx, x, y, 90 + (i % 3) * 40); ctx.fill(); }
      }
      if (G.gs.tide > 0.05) { ctx.fillStyle = `rgba(40,120,200,${0.08 * G.gs.tide})`; ctx.fillRect(0, 0, G.W, G.H); }
    },

    buildGround(g, w, h, rand) {
      g.fillStyle = '#d8c48a'; g.fillRect(0, 0, w, h);
      GK.patches(g, rand, w, h, 240, ['rgba(230,212,160,.6)', 'rgba(190,168,110,.4)', 'rgba(150,170,100,.25)'], 40, 140);
      GK.dots(g, rand, w, h, 1500, ['rgba(160,140,100,.5)', 'rgba(255,250,230,.5)'], 2.5);
      // kênh nước + đầm
      const water = (draw) => {
        g.fillStyle = '#5ab4d0'; draw(40); g.fillStyle = '#2f86b0'; draw(14); g.fillStyle = '#1a5a8a'; draw(0);
      };
      for (const o of obstacles) {
        if (o.kind !== 'deep') continue;
        if (o.shape === 'box') water((p) => g.fillRect(o.x - o.hw - p, o.y - o.hh - p, o.w + p * 2, o.h + p * 2));
        else water((p) => { g.beginPath(); g.arc(o.x, o.y, o.r + p, 0, Math.PI * 2); g.fill(); });
      }
      // cầu ván qua kênh
      const bridge = (x, y) => {
        g.fillStyle = '#7a5a36'; g.fillRect(x - 110, y - 52, 220, 104);
        g.strokeStyle = '#4a3420'; g.lineWidth = 3; for (let i = -100; i <= 100; i += 16) { g.beginPath(); g.moveTo(x + i, y - 52); g.lineTo(x + i, y + 52); g.stroke(); }
        g.fillStyle = '#5a3e24'; g.fillRect(x - 112, y - 56, 224, 6); g.fillRect(x - 112, y + 50, 224, 6);
      };
      bridge(1000, 600); bridge(1000, 1500); bridge(1950, 1150); bridge(1950, 1900);
      GK.strokes(g, rand, w, h, 500, ['rgba(110,140,80,.5)'], 9, 1.5);
      GK.vignette(g, w, h, 0.4);
    },

    /* ---------- 3D ---------- */
    models3d: {
      crab: (K) => ({
        base: 22,
        build() {
          const T = K.T, g = new T.Group(), shell = K.skinMat(0xb8502e, { rough: 0.4, metal: 0.05 }), leg = K.std(0x8a3a22, { rough: 0.5 }), claw = K.std(0xc85e38, { rough: 0.4 });
          const b = K.mesh(K.bumpy('crabb', new T.SphereGeometry(18, 24, 16), 1, 0.4), shell, -3, 14, 0); b.scale.set(0.85, 0.45, 1.1); g.add(b);
          for (const z of [-5, 5]) { g.add(K.mesh(K.cyl(0.8, 0.8, 8, 6), leg, 10, 20, z)); g.add(K.mesh(K.sph(2, 8), K.std(0x111111, { rough: 0.2 }), 10, 24, z)); }
          const legs = [];
          for (const sd of [-1, 1]) for (let k = 0; k < 3; k++) {
            const yg = new T.Group(); yg.position.set(-8 + k * 5, 12, sd * 14); yg.rotation.y = -sd * (Math.PI / 2 + (k - 1) * 0.35); g.add(yg);
            const f = K.joint(yg, 0, 0, 0, 1.8, 1.4, 12, leg, leg); f.rotation.z = 2.0;
            const t2 = K.joint(f.userData.end, 0, 0, 0, 1.4, 0.5, 13, leg, leg); t2.rotation.z = -1.9;
            legs.push({ yg, f, sd, k, a: -sd * (Math.PI / 2 + (k - 1) * 0.35) });
          }
          const claws = [];
          for (const sd of [-1, 1]) {
            const arm = K.joint(g, 10, 14, sd * 14, 3, 2.5, 12, claw, claw); arm.rotation.z = 1.6; arm.rotation.x = -sd * 0.4;
            const pin = K.mesh(K.bumpy('pinc', new T.SphereGeometry(7, 14, 10), 0.6, 0.6), claw, 0, -16, 0); pin.scale.set(0.8, 1.4, 0.7); arm.userData.end.add(pin);
            claws.push(arm);
          }
          g.userData = { legs, claws, h: 24 };
          return g;
        },
        anim(e, m, G) {
          const d = m.userData, t = G.time;
          d.legs.forEach((L) => { L.yg.rotation.y = L.a + Math.sin(t * 16 + e.t + L.k * 2 + (L.sd > 0 ? Math.PI : 0)) * 0.25; L.f.rotation.z = 2.0 + Math.max(0, Math.cos(t * 16 + L.k * 2)) * 0.3; });
          d.claws.forEach((c, i) => { c.rotation.z = 1.6 + Math.sin(t * 5 + i * 2 + e.t) * 0.15; });
        },
      }),
      drowned: (K) => ({ base: 19, anim: K.animZombie, build: () => K.buildZombie({ skin: 0x8ab4ba, cloth: 0x2e4a58, shirt: 0x3e6a72, eye: 0xe8ffff, pustule: 0x7ec8ff, hair: 0x2f5a3a }) }),
      tentacle: (K) => ({
        base: 28,
        build() {
          const T = K.T, g = new T.Group(), segs = [], m1 = K.skinMat(0x6a3a8a, { rough: 0.35 }), m2 = K.std(0x7e4aa0, { rough: 0.35 }), suck = K.std(0xe8c8f8);
          let par = g;
          for (let i = 0; i < 9; i++) {
            const piv = new T.Group(); piv.position.y = i === 0 ? 0 : 13; par.add(piv);
            const r = 15 * (1 - i * 0.09);
            piv.add(K.mesh(K.sph(r, 14), i % 2 ? m1 : m2, 0, 6, 0));
            piv.add(K.mesh(K.sph(r * 0.22, 6), suck, r * 0.85, 6, 0));
            segs.push(piv); par = piv;
          }
          const ring = new T.Mesh(K.G3('tring', () => new T.RingGeometry(26, 36, 32)), new T.MeshBasicMaterial({ color: 0xd8f0ff, transparent: true, opacity: 0.4 }));
          ring.material.userData.own = true; ring.rotation.x = -Math.PI / 2; ring.position.y = 1.5; g.add(ring);
          g.userData = { segs, h: 110 };
          return g;
        },
        anim(e, m, G) {
          const d = m.userData, t = G.time;
          const slam = e.state === 'slam', aim = e.state === 'aim';
          d.segs.forEach((s, i) => {
            if (slam) { s.rotation.z = i === 0 ? -1.45 : 0; }
            else if (aim) { s.rotation.z = i === 0 ? 0.5 : 0.12; }
            else { s.rotation.z = Math.sin(t * 2.5 + i * 0.6 + e.t) * 0.25; s.rotation.x = Math.cos(t * 2 + i * 0.5 + e.t) * 0.15; }
          });
          if (slam) d.segs.forEach((s, i) => { if (i > 0) s.position.y = 38; }); else d.segs.forEach((s, i) => { if (i > 0) s.position.y = 13; });
        },
      }),
      kraken: (K) => ({
        base: 80,
        build() {
          const T = K.T, g = new T.Group(), core = new T.Group(); g.add(core);
          const skin = K.skinMat(0x5e3080, { rough: 0.35 });
          const head = K.mesh(K.bumpy('krak', new T.SphereGeometry(70, 30, 22), 2, 0.12), skin, -20, 30, 0); head.scale.set(1.25, 1, 1); core.add(head);
          const mantle = K.mesh(K.bumpy('krakm', new T.SphereGeometry(50, 24, 18), 2, 0.15), K.std(0x7a48a0, { rough: 0.35 }), -70, 60, 0); mantle.scale.set(1.3, 0.9, 0.9); core.add(mantle);
          for (const z of [-30, 30]) { core.add(K.mesh(K.sph(13, 16), K.glowMat(0xffd56a, 1.6), 38, 50, z)); core.add(K.mesh(K.box(4, 16, 5), K.std(0x111111), 49, 50, z)); }
          const beak = K.mesh(K.G3('beak', () => new T.ConeGeometry(10, 26, 6)), K.std(0xd8c8a0), 58, 18, 0); beak.rotation.z = -Math.PI / 2; core.add(beak);
          const ring = new T.Mesh(K.G3('kring', () => new T.RingGeometry(90, 110, 48)), new T.MeshBasicMaterial({ color: 0xd8f0ff, transparent: true, opacity: 0.35 }));
          ring.material.userData.own = true; ring.rotation.x = -Math.PI / 2; ring.position.y = 2; g.add(ring);
          g.userData = { core, ring, h: 120 };
          return g;
        },
        anim(e, m, G) {
          const d = m.userData, t = G.time, up = e.state === 'up';
          const target = up ? 0 : -75;
          d.core.position.y += (target - d.core.position.y) * 0.08;
          d.core.rotation.z = Math.sin(t * 1.5) * 0.05;
          d.ring.scale.setScalar(1 + Math.sin(t * 2) * 0.08);
          if (e.phase === 3 && !d.p3) { d.p3 = true; K.ownMats(m)[0].color.setHex(0x7a2a6a); }
        },
      }),
    },
    props3d: {
      deep: (o, K) => {
        const T = K.T, g = new T.Group();
        const geo = o.shape === 'box' ? K.box(o.w, 2, o.h) : K.G3('deepc', () => new T.CylinderGeometry(1, 1, 2, 40));
        const mt = new T.MeshStandardMaterial({ color: 0x1a6a9a, roughness: 0.15, metalness: 0.2, transparent: true, opacity: 0.6 }); mt.userData.own = true;
        const w = new T.Mesh(geo, mt); if (o.shape !== 'box') w.scale.set(o.r, 1, o.r); w.position.y = 1.2; w.receiveShadow = true; g.add(w);
        g.rotation.y = -(o.rot || 0); return g;
      },
      palm: (o, K) => {
        const T = K.T, g = new T.Group(), trunk = K.std(0x7a5a36, { rough: 0.9 }), leaf = K.std(0x4a9a40, { rough: 0.7 });
        let par = g; const lean = (o.x % 7) * 0.03;
        for (let i = 0; i < 6; i++) { const piv = new T.Group(); piv.position.y = i ? 14 : 0; piv.rotation.z = lean; par.add(piv); piv.add(K.mesh(K.cyl(4.2 - i * 0.3, 4.6 - i * 0.3, 14, 8), trunk, 0, 7, 0)); par = piv; }
        for (let i = 0; i < 7; i++) {
          const a = i / 7 * Math.PI * 2, lf = new T.Mesh(K.G3('leaf', () => { const sh = new T.Shape(); sh.moveTo(0, 0); sh.quadraticCurveTo(12, 6, 40, 0); sh.quadraticCurveTo(12, -6, 0, 0); return new T.ShapeGeometry(sh); }), leaf);
          lf.material.side = T.DoubleSide; lf.rotation.set(-Math.PI / 2 + 0.5, 0, 0); const holder = new T.Group(); holder.rotation.y = a; holder.add(lf); lf.rotation.z = -0.4; par.add(holder); holder.position.y = 14;
        }
        par.add(K.mesh(K.sph(3.5, 8), K.std(0x6e4a2a), 3, 12, 2), K.mesh(K.sph(3.5, 8), K.std(0x6e4a2a), -2, 12, -3));
        return g;
      },
      boat: (o, K) => {
        const T = K.T, g = new T.Group(), wood = K.std(0x6e4a2e, { rough: 0.85 });
        const hull = K.mesh(K.G3('hull', () => { const ge = new T.CylinderGeometry(1, 0.7, 1, 12, 1, true, 0, Math.PI); ge.rotateZ(Math.PI / 2); ge.rotateX(Math.PI / 2); return ge; }), wood, 0, 14, 0);
        hull.material = wood; hull.scale.set(o.w, 20, o.h / 2); g.add(hull);
        g.add(K.mesh(K.box(o.w * 0.8, 2, o.h * 0.8), K.std(0x8a6440), 0, 10, 0));
        g.rotation.y = -o.rot; g.rotation.z = 0.15; return g;
      },
      buoy: (o, K) => {
        const T = K.T, g = new T.Group(), mt = K.std(0xd84a3a, { own: true, rough: 0.4 });
        g.add(K.mesh(K.sph(o.r * 0.8, 16), mt, 0, 8, 0), K.mesh(K.cyl(o.r * 0.82, o.r * 0.82, 6, 16), K.std(0xf2f2f2), 0, 10, 0), K.mesh(K.cyl(2, 2, 30, 6), K.std(0x888888, { metal: 0.6 }), 0, 30, 0));
        const lamp = K.mesh(K.sph(4, 8), K.glowMat(0x7ef3ff, 2), 0, 46, 0, false); g.add(lamp);
        g.userData.flashMat = mt; g.userData.core = lamp; return g;
      },
    },
    hazards3d: { water: { inner: 'rgba(80,170,220,0.7)', outer: 'rgba(60,140,200,0.1)', add: false, opacity: 0.75 } },
  });
})(window.MB);
