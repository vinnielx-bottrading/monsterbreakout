/* Gate 07 — Industrial: Nhà Máy Hoá Chất
   Cơ chế: băng chuyền đẩy người và quái, thùng hoá chất nổ khi bị bắn (dùng để diệt đám đông), hàng rào laser bật/tắt theo nhịp, vũng dầu trơn.
   Quái mới: Drone (bay, bắn tia laser sau vạch đỏ), Sludge (chết thì tách thành 2 Sludgeling).
   Boss: Assembler Mech — giáp giảm 40% sát thương; tên lửa rơi vào vòng đỏ, tia laser quét vòng; sau khi quét bị quá nhiệt (lõi hở, nhận ×2).
   Thử thách: phá 4 máy phát điện (→ Tempest MG), giữ bảng điều khiển (→ Bộ Chia Tia), 18 hạ gục (→ Cò Siêu Tốc). */
'use strict';
(function (MB) {
  const U = MB.U, Ens = MB.Enemies, GK = MB.GK;
  const WW = 3400, WH = 2300;
  const BELTS = [
    { x: 700, y: 520, w: 520, h: 90, dx: 1, dy: 0 },
    { x: 1700, y: 1650, w: 600, h: 90, dx: -1, dy: 0 },
    { x: 2550, y: 900, w: 90, h: 520, dx: 0, dy: 1 },
  ];
  const inRect = (r, x, y) => x > r.x - r.w / 2 && x < r.x + r.w / 2 && y > r.y - r.h / 2 && y < r.y + r.h / 2;

  /* ---------- props ---------- */
  MB.Props.register('wall', (ctx, o) => {
    ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(o.rot || 0);
    ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(-o.hw + 6, -o.hh + 10, o.w, o.h);
    ctx.fillStyle = '#4a5054'; ctx.fillRect(-o.hw, -o.hh, o.w, o.h);
    ctx.fillStyle = '#5e666a'; ctx.fillRect(-o.hw + 4, -o.hh + 4, o.w - 8, o.h * 0.4);
    ctx.save(); ctx.beginPath(); ctx.rect(-o.hw, o.hh - 10, o.w, 10); ctx.clip();
    for (let i = -o.hw; i < o.hw; i += 20) { ctx.fillStyle = (i / 20) % 2 ? '#f2c230' : '#1a1a1a'; ctx.beginPath(); ctx.moveTo(i, o.hh); ctx.lineTo(i + 10, o.hh - 10); ctx.lineTo(i + 20, o.hh - 10); ctx.lineTo(i + 10, o.hh); ctx.fill(); }
    ctx.restore(); ctx.restore();
  });
  MB.Props.register('machine', (ctx, o, t) => {
    ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(o.rot || 0);
    ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(-o.hw + 6, -o.hh + 10, o.w, o.h);
    ctx.fillStyle = '#3a4448'; ctx.fillRect(-o.hw, -o.hh, o.w, o.h);
    ctx.fillStyle = '#525e64'; ctx.fillRect(-o.hw + 6, -o.hh + 6, o.w - 12, o.h - 12);
    for (let i = 0; i < 3; i++) { ctx.fillStyle = Math.floor(t * 2 + i + o.x) % 3 ? '#2a3a2a' : '#7dff9b'; ctx.fillRect(-o.hw + 12 + i * 10, -o.hh + 10, 6, 6); }
    ctx.strokeStyle = '#2a3236'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(o.hw * 0.4, 0, Math.min(o.hw, o.hh) * 0.35, 0, U.TAU); ctx.stroke();
    ctx.restore();
  });
  MB.Props.register('tank', (ctx, o) => {
    MB.Props.shadow(ctx, o.x + 8, o.y + 12, o.r, o.r * 0.6, 0.3);
    ctx.fillStyle = '#5a7a5a'; U.circle(ctx, o.x, o.y, o.r); ctx.fill();
    ctx.fillStyle = '#7a9a7a'; U.circle(ctx, o.x - o.r * 0.2, o.y - o.r * 0.2, o.r * 0.6); ctx.fill();
    ctx.fillStyle = '#f2c230'; ctx.fillRect(o.x - o.r * 0.4, o.y - 4, o.r * 0.8, 8);
  });
  MB.Props.register('barrel', (ctx, o, t) => {
    MB.Props.shadow(ctx, o.x + 4, o.y + 7, o.r, o.r * 0.6, 0.3);
    ctx.fillStyle = o.flash > 0 ? '#ffffff' : '#c8402a'; U.circle(ctx, o.x, o.y, o.r); ctx.fill();
    ctx.strokeStyle = '#7a2014'; ctx.lineWidth = 2; U.circle(ctx, o.x, o.y, o.r * 0.7); ctx.stroke();
    ctx.fillStyle = '#f2c230'; ctx.beginPath(); ctx.moveTo(o.x, o.y - 7); ctx.lineTo(o.x + 6, o.y + 5); ctx.lineTo(o.x - 6, o.y + 5); ctx.fill();
    ctx.fillStyle = '#1a1a1a'; ctx.fillRect(o.x - 1, o.y - 3, 2, 5);
  });
  MB.Props.register('pylon', (ctx, o, t) => {
    MB.Props.shadow(ctx, o.x + 3, o.y + 6, o.r, o.r * 0.6, 0.3);
    ctx.fillStyle = '#3a4248'; U.circle(ctx, o.x, o.y, o.r); ctx.fill();
    ctx.fillStyle = Math.floor(t * 4) % 2 ? '#ff5b5b' : '#7a2a2a'; U.circle(ctx, o.x, o.y, o.r * 0.45); ctx.fill();
  });
  MB.Props.register('gen', (ctx, o, t) => {
    ctx.save(); ctx.translate(o.x, o.y);
    ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(-o.r + 6, -o.r + 10, o.r * 2, o.r * 2);
    ctx.fillStyle = o.flash > 0 ? '#ffffff' : '#3a4a52'; ctx.fillRect(-o.r, -o.r, o.r * 2, o.r * 2);
    const glow = 0.5 + Math.sin(t * 8 + o.x) * 0.4;
    ctx.strokeStyle = `rgba(126,243,255,${glow})`; ctx.lineWidth = 3;
    for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.arc(0, 0, o.r * (0.35 + i * 0.12 + 0.12), 0, U.TAU); ctx.stroke(); }
    ctx.restore();
  });
  MB.Props.registerActor('laser', (ctx, a, G) => {
    if (!a.on) {
      if (a.warn) { ctx.strokeStyle = `rgba(255,90,90,${0.3 + Math.abs(Math.sin(G.time * 16)) * 0.4})`; ctx.lineWidth = 2; ctx.setLineDash([8, 8]); ctx.beginPath(); ctx.moveTo(a.x1, a.y1); ctx.lineTo(a.x2, a.y2); ctx.stroke(); ctx.setLineDash([]); }
      return;
    }
    ctx.strokeStyle = 'rgba(255,60,60,.35)'; ctx.lineWidth = 14; ctx.beginPath(); ctx.moveTo(a.x1, a.y1); ctx.lineTo(a.x2, a.y2); ctx.stroke();
    ctx.strokeStyle = '#ffd0d0'; ctx.lineWidth = 3; ctx.stroke();
  });

  /* ---------- Drone ---------- */
  Ens.register('drone', Ens.make({
    name: 'Drone', r: 14, hp: 50, speed: 130, dmg: 10, score: 190, fly: true, blood: '#2a3236', gore: '#ffd56a',
    draw(ctx, e, G) {
      ctx.save(); ctx.translate(e.x, e.y - 10); ctx.rotate(e.face || 0);
      ctx.fillStyle = 'rgba(0,0,0,.18)'; U.ellipse(ctx, 0, 24, 14, 5); ctx.fill();
      ctx.strokeStyle = '#3a4248'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-10, -10); ctx.lineTo(10, 10); ctx.moveTo(10, -10); ctx.lineTo(-10, 10); ctx.stroke();
      ctx.fillStyle = 'rgba(200,210,220,.35)'; for (const [x, y] of [[-10, -10], [10, 10], [10, -10], [-10, 10]]) { U.circle(ctx, x, y, 7); ctx.fill(); }
      ctx.fillStyle = '#5a646a'; U.rr(ctx, -7, -6, 14, 12, 3); ctx.fill();
      ctx.fillStyle = e.state === 'aim' ? '#ff5b5b' : '#ffd56a'; U.circle(ctx, 6, 0, 2.5); ctx.fill();
      ctx.restore();
    },
  }, Ens.AI.shooter({
    min: 180, max: 380, cd: [1.8, 2.6], aim: 0.65, lineLen: 420, wig: { f: 3, a: 0.5 },
    shot(e, G, a) { G.enemyShot({ x: e.x, y: e.y, a, speed: 900, r: 5, dmg: 12, life: 0.6, kind: 'orb', color: '#ff5b5b', owner: e }); MB.Audio.play('shot_plasma'); },
  })));

  /* ---------- Sludge (tách đôi khi chết) ---------- */
  const drawSludge = (ctx, e, G, s) => {
    const wob = Math.sin(G.time * 5 + e.t) * 0.08;
    ctx.save(); ctx.translate(e.x, e.y); ctx.scale(s * (1 + wob), s * (1 - wob));
    ctx.fillStyle = '#5a3a7a'; U.circle(ctx, 0, 0, 18); ctx.fill();
    ctx.fillStyle = '#7a5aa0'; U.circle(ctx, -5, -5, 10); ctx.fill();
    ctx.fillStyle = 'rgba(190,255,120,.8)'; U.circle(ctx, 6, 4, 3); ctx.fill(); U.circle(ctx, -7, 7, 2.5); ctx.fill();
    ctx.fillStyle = '#ffe060'; U.circle(ctx, 8, -4, 2); ctx.fill(); U.circle(ctx, 3, -8, 2); ctx.fill();
    ctx.restore();
  };
  Ens.register('sludge', {
    name: 'Sludge', r: 22, hp: 110, speed: 55, dmg: 14, score: 220, knockMul: 0.6, blood: '#3a2a4a', gore: '#c89ae8',
    update(e, G, dt) { Ens.steer(e, G, G.player.x, G.player.y, e.speed, dt, { f: 2, a: 0.3 }); },
    onDeath(e, G) {
      for (let i = 0; i < 2; i++) { const a = U.rnd(0, U.TAU); G.spawnEnemyAt('sludgeling', e.x + Math.cos(a) * 18, e.y + Math.sin(a) * 18, { extra: true }); }
      G.addHazard({ kind: 'oil', x: e.x, y: e.y, r: 45, life: 6, slip: true });
    },
    draw(ctx, e, G) { drawSludge(ctx, e, G, 1.2); },
  });
  Ens.register('sludgeling', {
    name: 'Sludgeling', r: 12, hp: 30, speed: 120, dmg: 7, score: 60, blood: '#3a2a4a', gore: '#c89ae8',
    init(e) { e.spawnT = 0.15; },
    update(e, G, dt) { Ens.steer(e, G, G.player.x, G.player.y, e.speed, dt, { f: 6, a: 0.5 }); },
    draw(ctx, e, G) { drawSludge(ctx, e, G, 0.65); },
  });

  /* ---------- Boss: Assembler Mech ---------- */
  Ens.register('assembler', {
    name: 'Assembler Mech', r: 68, hp: 9500, speed: 55, dmg: 24, score: 0, boss: true, knockMul: 0, blood: '#2a3236', gore: '#ffd56a',
    init(e) { e.phase = 1; e.state = 'walk'; e.misT = 3; e.laserT = 7; e.dronT = 6; e.beam = 0; },
    armorFn(e, dmg, G) {
      if (e.state === 'overheat') return dmg * 2;
      if (Math.random() < 0.06) G.text(e.x, e.y - 80, 'GIÁP', '#9fd8ff', 12);
      return dmg * 0.6;
    },
    update(e, G, dt) {
      const p = G.player, d = Ens.distPlayer(e, G), k = e.hp / e.maxHp;
      const ph = k > 0.6 ? 1 : k > 0.25 ? 2 : 3;
      if (ph > e.phase) { e.phase = ph; G.banner(`PHASE ${ph}`, ph === 2 ? 'Assembler thả drone' : 'Assembler quá tải: tên lửa kép, laser nhanh hơn', 2); MB.Audio.play('roar'); G.shake(12); }
      if (e.state === 'walk') {
        Ens.steer(e, G, p.x, p.y, e.speed, dt);
        e.misT -= dt; e.laserT -= dt; e.dronT -= dt;
        if (e.misT <= 0) {
          e.misT = ph === 3 ? 3.5 : 5;
          const n = ph === 3 ? 10 : 6;
          for (let i = 0; i < n; i++) {
            const tx = p.x + U.rnd(-170, 170), ty = p.y + U.rnd(-170, 170), delay = 1.0 + i * 0.12;
            G.telegraphCircle(tx, ty, 70, delay, (GG) => GG.explosion(tx, ty, 70, 30, { player: 18, knock: 250, small: true, obstacles: false }));
          }
          MB.Audio.play('shot_gl');
        } else if (e.laserT <= 0 && d < 520) {
          e.state = 'laserWarn'; e.st = 0.9; e.beam = Ens.toPlayer(e, G) - 1.2; e.bdir = Math.random() < 0.5 ? 1 : -1;
        }
        if (ph >= 2 && e.dronT <= 0) { e.dronT = 9; for (let i = 0; i < 3 && G.extraAlive() < 8; i++) G.spawnEnemyAt('drone', e.x + U.rnd(-80, 80), e.y + U.rnd(-80, 80), { extra: true }); }
      } else if (e.state === 'laserWarn') {
        Ens.stop(e, dt, 10); e.st -= dt;
        if (e.st <= 0) { e.state = 'laser'; e.st = ph === 3 ? 2.2 : 3.0; e.hitCd = 0; MB.Audio.play('nova'); }
      } else if (e.state === 'laser') {
        Ens.stop(e, dt, 10); e.st -= dt;
        e.beam += e.bdir * (ph === 3 ? 3.0 : 2.1) * dt; e.face = e.beam;
        const L = 560, x2 = e.x + Math.cos(e.beam) * L, y2 = e.y + Math.sin(e.beam) * L;
        e.hitCd -= dt;
        if (e.hitCd <= 0 && MB.Col.segCircle(e.x, e.y, x2, y2, p.x, p.y, p.r + 8)) { G.hurtPlayer(20, e); e.hitCd = 0.5; }
        if (e.st <= 0) { e.state = 'overheat'; e.st = 2.8; e.laserT = ph === 1 ? 8 : 6; G.text(e.x, e.y - 90, 'QUÁ NHIỆT!', '#ffd56a', 20); }
      } else if (e.state === 'overheat') {
        Ens.stop(e, dt, 10); e.st -= dt;
        if (Math.random() < 0.3) G.particle({ x: e.x + U.rnd(-30, 30), y: e.y + U.rnd(-30, 30), vx: 0, vy: -50, life: 0.6, color: 'rgba(220,220,220,.6)', r: 6 });
        if (e.st <= 0) e.state = 'walk';
      }
    },
    tele(ctx, e, G) {
      if (e.state === 'laserWarn' || e.state === 'laser') {
        const on = e.state === 'laser', L = 560, x2 = e.x + Math.cos(e.beam) * L, y2 = e.y + Math.sin(e.beam) * L;
        if (!on) { ctx.strokeStyle = `rgba(255,80,80,${0.4 + Math.abs(Math.sin(G.time * 18)) * 0.4})`; ctx.lineWidth = 3; ctx.setLineDash([12, 10]); }
        else { ctx.strokeStyle = 'rgba(255,60,60,.45)'; ctx.lineWidth = 22; }
        ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(x2, y2); ctx.stroke(); ctx.setLineDash([]);
        if (on) { ctx.strokeStyle = '#fff0f0'; ctx.lineWidth = 5; ctx.stroke(); }
      }
    },
    draw(ctx, e, G) {
      const t = G.time, mv = Math.hypot(e.vx, e.vy) > 10;
      ctx.save(); ctx.translate(e.x, e.y);
      ctx.strokeStyle = '#2a3236'; ctx.lineWidth = 12; ctx.lineCap = 'round';
      for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4 + (mv ? Math.sin(t * 6 + i) * 0.15 : 0); ctx.beginPath(); ctx.moveTo(Math.cos(a) * 30, Math.sin(a) * 30); ctx.lineTo(Math.cos(a) * 80, Math.sin(a) * 80); ctx.stroke(); }
      ctx.fillStyle = '#4a565c'; U.rr(ctx, -52, -46, 104, 92, 18); ctx.fill();
      ctx.fillStyle = '#f2c230'; ctx.fillRect(-52, -8, 104, 6);
      const heat = e.state === 'overheat';
      ctx.fillStyle = heat ? `rgba(255,${120 + Math.sin(t * 20) * 60},60,1)` : '#2a3a42'; U.circle(ctx, 0, 0, 22); ctx.fill();
      ctx.rotate(e.face || 0);
      ctx.fillStyle = '#5e6a70'; U.rr(ctx, -10, -24, 50, 48, 10); ctx.fill();
      ctx.fillStyle = '#2a3236'; ctx.fillRect(36, -16, 30, 8); ctx.fillRect(36, 8, 30, 8);
      ctx.fillStyle = '#c8402a'; for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) U.circle(ctx, -2 + i * 9, -14 + j * 28, 3), ctx.fill();
      ctx.restore();
    },
  });

  /* ---------- bản đồ ---------- */
  const rng = U.seeded(707);
  const obstacles = [];
  const W = (x, y, w, h, rot) => obstacles.push({ kind: 'wall', shape: 'box', x, y, w, h, rot: rot || 0 });
  const M = (x, y, w, h) => obstacles.push({ kind: 'machine', shape: 'box', x, y, w, h, rot: 0 });
  const TK = (x, y, r) => obstacles.push({ kind: 'tank', shape: 'circle', x, y, r });
  // tường bao
  W(WW / 2, 30, WW, 60); W(WW / 2, WH - 30, WW, 60); W(30, 560, 60, 1000); W(30, 1800, 60, 900); W(WW - 30, WH / 2, 60, WH);
  // khu nhà xưởng
  W(1150, 1000, 40, 520); W(1150, 1850, 40, 500); W(2150, 520, 40, 700); W(2150, 1600, 40, 600);
  W(1650, 1150, 360, 40); W(2850, 1700, 500, 40);
  M(600, 1500, 160, 110); M(1600, 400, 180, 120); M(1650, 850, 140, 100); M(2600, 1350, 160, 100); M(2950, 400, 200, 120); M(800, 1950, 150, 90);
  TK(1450, 1500, 55); TK(1900, 1950, 50); TK(2500, 300, 50); TK(3100, 1150, 60); TK(500, 300, 45);
  // thùng hoá chất nổ
  const barrels = [[900, 800], [950, 830], [1350, 650], [1400, 1250], [1800, 600], [1900, 1350], [2350, 1000], [2400, 1950], [2700, 700], [2750, 1950], [700, 1150], [3000, 900], [1300, 1950], [2050, 1100]];
  barrels.forEach(([x, y]) => obstacles.push({ kind: 'barrel', shape: 'circle', x, y, r: 15, hp: 30, maxHp: 30, barrel: true }));
  // cột laser + hàng rào laser
  const LASERS = [[1150, 700, 1150, 520], [2150, 870, 2150, 1300], [1150, 1260, 1150, 1600]];
  LASERS.forEach(([x1, y1, x2, y2]) => { obstacles.push({ kind: 'pylon', shape: 'circle', x: x1, y: y1, r: 16 }); obstacles.push({ kind: 'pylon', shape: 'circle', x: x2, y: y2, r: 16 }); });
  const hazards = [];
  [[1350, 1700, 70], [2450, 1500, 80], [800, 400, 60], [3000, 1950, 70]].forEach(([x, y, r]) => hazards.push({ kind: 'oil', x, y, r, slip: true }));
  [[1800, 1100, 60], [2700, 1100, 55]].forEach(([x, y, r]) => hazards.push({ kind: 'acid', x, y, r, dps: 12 }));

  MB.registerGate({
    id: 7, seed: 707, view3d: true,
    title: 'GATE 07 — INDUSTRIAL', subtitle: 'Nhà Máy Hoá Chất',
    world: { w: WW, h: WH }, bg: '#14181a', mmColor: 'rgba(140,150,155,.7)',
    scale: { hp: 1.5, dmg: 1.2 },
    start: { x: 220, y: 1200 },
    obstacles, hazards,
    crates: [{ x: 500, y: 900 }, { x: 900, y: 1650 }, { x: 1650, y: 1450 }, { x: 1700, y: 250 }, { x: 2400, y: 700 }, { x: 2500, y: 2050 }, { x: 3150, y: 600 }],
    spawnPoints: [
      { x: 400, y: 300 }, { x: 400, y: 2050 }, { x: 1600, y: 200 }, { x: 1650, y: 2050 }, { x: 2600, y: 200 }, { x: 2650, y: 2050 },
      { x: 3200, y: 300 }, { x: 3200, y: 2050 }, { x: 1400, y: 1100 }, { x: 2450, y: 1150 }, { x: 900, y: 1250 },
    ],
    waves: [
      { total: 16, maxAlive: 9, mix: { zombie: 4, drone: 3, sludge: 3 }, interval: [0.75, 1.25], elite: 0.08 },
      { total: 21, maxAlive: 10, mix: { drone: 4, sludge: 4, spider: 3, licker: 1 }, interval: [0.6, 1.1], elite: 0.12 },
      { total: 25, maxAlive: 12, mix: { drone: 4, sludge: 4, licker: 3, zombie: 3 }, interval: [0.5, 0.95], elite: 0.16 },
    ],
    boss: { type: 'assembler', x: 2900, y: 1150 },
    intro: { title: 'NHIỆM VỤ', text: 'Nhà máy đầy bẫy: bắn thùng hoá chất đỏ gần quái để nổ cả đám. Né hàng rào laser khi nó bật.' },
    objectives: [
      { title: 'LOADING BAY', text: 'Drone bắn laser sau vạch đỏ. Băng chuyền đẩy bạn theo mũi tên.' },
      { title: 'CHEM LAB', text: 'Sludge chết thì tách thành 2 con nhỏ và để lại vũng dầu trơn.' },
      { title: 'CORE ROOM', text: 'Wave cuối trước Boss.' },
      { title: 'BOSS · ASSEMBLER MECH', text: 'Giáp chặn 40% sát thương. Lộn né qua tia laser quét; khi máy quá nhiệt (lõi đỏ) bắn ×2.' },
    ],
    challenges: [
      { id: 'gens', type: 'destroy', name: 'Máy Phát Điện', desc: 'Phá 4 máy phát', kind: 'gen', r: 30, hp: 280,
        spawner: { type: 'drone', every: 9, range: 700, cap: 4 },
        targets: [{ x: 600, y: 300 }, { x: 1650, y: 2000 }, { x: 2650, y: 500 }, { x: 3150, y: 1950 }], reward: { weapon: 'minigun' } },
      { id: 'panel', type: 'hold', name: 'Bảng Điều Khiển', desc: 'Đứng trong vùng xanh 15 giây', zone: { x: 1650, y: 1350, r: 110 }, time: 15,
        mix: { drone: 1, sludge: 1, zombie: 2 }, spawnEvery: 2.1, reward: { mod: 'split' } },
      { id: 'streak', type: 'streak', name: 'Vận Hành Hoàn Hảo', desc: '18 hạ gục liên tiếp không trúng đòn', count: 18, reward: { mod: 'trigger' } },
    ],

    // thùng hoá chất phát nổ
    onObstacleDestroyed(G, o) {
      if (o.barrel) {
        G.explosion(o.x, o.y, 130, 90, { player: 26, knock: 450, color: '#ffb347', ring: '255,170,70' });
        G.addHazard({ kind: 'fire', x: o.x, y: o.y, r: 60, life: 4, dps: 8, burn: 1.5, enemyDps: 12 });
      }
    },
    setup(G) {
      G.gs.laserT = 0;
      for (const [x1, y1, x2, y2] of LASERS) G.actors.push({ kind: 'laser', x: (x1 + x2) / 2, y: (y1 + y2) / 2, x1, y1, x2, y2, on: false, warn: false, phase: Math.random() * 3 });
    },
    update(G, dt) {
      const p = G.player;
      // hàng rào laser: 3 giây bật, 3 giây tắt (0,8 giây cảnh báo)
      for (const a of G.actors) {
        if (a.kind !== 'laser') continue;
        const c = (G.time + a.phase) % 6;
        a.on = c < 3; a.warn = !a.on && c > 5.2; a.hidden = !a.on;
        if (a.on && !p.dead && MB.Col.segCircle(a.x1, a.y1, a.x2, a.y2, p.x, p.y, p.r + 4)) G.hurtPlayer(20, { x: p.x - 10, y: p.y });
        if (a.on) for (const e of G.enemies) if (!e.dead && !e.fly && !e.boss && MB.Col.segCircle(a.x1, a.y1, a.x2, a.y2, e.x, e.y, e.r)) G.damageEnemy(e, 80 * dt, 0, 0, true);
      }
      // băng chuyền
      for (const b of BELTS) {
        if (inRect(b, p.x, p.y) && !p.dash) { p.x += b.dx * 110 * dt; p.y += b.dy * 110 * dt; }
        for (const e of G.enemies) if (!e.fly && !e.boss && inRect(b, e.x, e.y)) { e.x += b.dx * 110 * dt; e.y += b.dy * 110 * dt; }
      }
    },
    drawUnder(G, ctx) {
      // mũi tên chạy trên băng chuyền
      const t = G.time;
      for (const b of BELTS) {
        ctx.save(); ctx.beginPath(); ctx.rect(b.x - b.w / 2, b.y - b.h / 2, b.w, b.h); ctx.clip();
        ctx.fillStyle = 'rgba(242,194,48,.55)';
        const horiz = b.dx !== 0, L = horiz ? b.w : b.h, off = (t * 110) % 60;
        for (let s = -60; s < L + 60; s += 60) {
          const d = (b.dx + b.dy > 0 ? s + off : s - off);
          const cx = horiz ? b.x - b.w / 2 + d : b.x, cy = horiz ? b.y : b.y - b.h / 2 + d;
          ctx.save(); ctx.translate(cx, cy); ctx.rotate(Math.atan2(b.dy, b.dx));
          ctx.beginPath(); ctx.moveTo(-12, -18); ctx.lineTo(8, 0); ctx.lineTo(-12, 18); ctx.lineTo(-4, 0); ctx.closePath(); ctx.fill();
          ctx.restore();
        }
        ctx.restore();
      }
    },

    buildGround(g, w, h, rand) {
      g.fillStyle = '#3a4044'; g.fillRect(0, 0, w, h);
      // gạch nền
      g.strokeStyle = 'rgba(20,24,26,.5)'; g.lineWidth = 2;
      for (let x = 0; x < w; x += 100) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
      for (let y = 0; y < h; y += 100) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
      GK.patches(g, rand, w, h, 160, ['rgba(20,24,26,.35)', 'rgba(80,90,96,.25)', 'rgba(60,50,30,.25)'], 30, 110);
      // vạch kẻ an toàn
      g.strokeStyle = 'rgba(242,194,48,.6)'; g.lineWidth = 6; g.setLineDash([30, 20]);
      g.beginPath(); g.moveTo(100, 1200); g.lineTo(3300, 1200); g.stroke(); g.setLineDash([]);
      // băng chuyền
      for (const b of BELTS) {
        g.fillStyle = '#1e2224'; g.fillRect(b.x - b.w / 2 - 6, b.y - b.h / 2 - 6, b.w + 12, b.h + 12);
        g.fillStyle = '#2a2e30'; g.fillRect(b.x - b.w / 2, b.y - b.h / 2, b.w, b.h);
        g.strokeStyle = 'rgba(0,0,0,.5)'; g.lineWidth = 2;
        if (b.dx) for (let x = b.x - b.w / 2; x < b.x + b.w / 2; x += 16) { g.beginPath(); g.moveTo(x, b.y - b.h / 2); g.lineTo(x, b.y + b.h / 2); g.stroke(); }
        else for (let y = b.y - b.h / 2; y < b.y + b.h / 2; y += 16) { g.beginPath(); g.moveTo(b.x - b.w / 2, y); g.lineTo(b.x + b.w / 2, y); g.stroke(); }
        g.fillStyle = 'rgba(242,194,48,.7)';
        for (let i = 0; i < 4; i++) { const cx = b.dx ? b.x - b.w / 3 + i * b.w / 4.5 : b.x, cy = b.dx ? b.y : b.y - b.h / 3 + i * b.h / 4.5; g.save(); g.translate(cx, cy); g.rotate(Math.atan2(b.dy, b.dx)); g.beginPath(); g.moveTo(-10, -14); g.lineTo(8, 0); g.lineTo(-10, 14); g.fill(); g.restore(); }
      }
      GK.cracks(g, rand, w, h, 40, 'rgba(10,12,14,.45)', 22);
      GK.vignette(g, w, h, 0.45);
    },

    /* ---------- 3D ---------- */
    models3d: {
      drone: (K) => ({ base: 14, anim: K.animFlyer, build: () => K.buildFlyer({ drone: true, body: 0x5a646a, wing: 0x3a4248, metal: 0.5, eye: 0xff5b5b }) }),
      sludge: (K) => ({ base: 22, anim: K.animBlob, build: () => K.buildBlob({ color: 0x5a3a7a, glow: 0xbeff78, eye: 0xffe060, seed: 7 }) }),
      sludgeling: (K) => ({ base: 12, anim: K.animBlob, build: () => { const g = K.buildBlob({ color: 0x7a5aa0, glow: 0xbeff78, eye: 0xffe060, seed: 8, pustules: 4 }); g.scale.setScalar(0.65); return g; } }),
      assembler: (K) => ({
        base: 68,
        build() {
          const T = K.T, g = new T.Group(), steel = K.std(0x4a565c, { rough: 0.4, metal: 0.6 }), dark = K.std(0x2a3236, { rough: 0.5, metal: 0.5 });
          const body = K.mesh(K.box(100, 34, 90), steel, 0, 64, 0); g.add(body);
          g.add(K.mesh(K.box(102, 6, 92), K.std(0xf2c230), 0, 58, 0));
          const core = K.mesh(K.sph(18, 16), K.std(0x2a3a42, { own: true, emissive: 0x000000, rough: 0.3 }), 0, 84, 0); g.add(core);
          const turret = new T.Group(); turret.position.y = 92; g.add(turret);
          turret.add(K.mesh(K.box(50, 22, 46), steel, 10, 0, 0));
          for (const z of [-12, 12]) { const bar = K.mesh(K.cyl(4, 4, 40, 10), dark, 52, 0, z); bar.rotation.z = Math.PI / 2; turret.add(bar); }
          for (const z of [-26, 26]) { const pod = K.mesh(K.box(24, 16, 12), dark, -6, 14, z); turret.add(pod); for (let i = 0; i < 3; i++) turret.add(K.mesh(K.sph(3, 8), K.std(0xc8402a), 6, 14 + (i - 1) * 4, z)); }
          const legs = [];
          for (let i = 0; i < 4; i++) {
            const a = i * Math.PI / 2 + Math.PI / 4, yg = new T.Group(); yg.position.set(Math.cos(a) * 40, 56, Math.sin(a) * 36); yg.rotation.y = -a; g.add(yg);
            const up = K.joint(yg, 0, 0, 0, 7, 6, 40, dark, steel); up.rotation.z = 1.9;
            const lo = K.joint(up.userData.end, 0, 0, 0, 6, 4, 54, steel, dark); lo.rotation.z = -1.95;
            legs.push({ yg, up, a, i });
          }
          g.userData = { turret, core, legs, h: 110 };
          return g;
        },
        anim(e, m, G) {
          const d = m.userData, t = G.time, mv = Math.hypot(e.vx, e.vy) > 10;
          m.rotation.y = 0; d.turret.rotation.y = -(e.face || 0);
          d.legs.forEach((L) => { L.up.rotation.z = 1.9 + (mv ? Math.max(0, Math.sin(t * 6 + L.i * Math.PI / 2)) * 0.35 : 0); });
          const heat = e.state === 'overheat';
          d.core.material.emissive.setHex(heat ? 0xff5a20 : 0x000000); d.core.material.emissiveIntensity = heat ? 1 + Math.sin(t * 20) * 0.4 : 1;
        },
      }),
    },
    props3d: {
      wall: (o, K) => { const T = K.T, g = new T.Group(); g.add(K.mesh(K.box(o.w, 80, o.h), K.std(0x4a5054, { rough: 0.7, metal: 0.3 }), 0, 40, 0)); g.add(K.mesh(K.box(o.w + 1, 8, o.h + 1), K.std(0xf2c230), 0, 6, 0)); g.rotation.y = -(o.rot || 0); return g; },
      machine: (o, K) => {
        const T = K.T, g = new T.Group(), st = K.std(0x3a4448, { rough: 0.5, metal: 0.5 });
        g.add(K.mesh(K.box(o.w, 60, o.h), st, 0, 30, 0));
        g.add(K.mesh(K.cyl(Math.min(o.w, o.h) * 0.3, Math.min(o.w, o.h) * 0.3, 30, 16), K.std(0x525e64, { metal: 0.6, rough: 0.3 }), o.w * 0.2, 75, 0));
        for (let i = 0; i < 3; i++) g.add(K.mesh(K.box(6, 6, 2), K.glowMat(i % 2 ? 0x7dff9b : 0xff5b5b, 1.5), -o.w / 2 + 14 + i * 10, 50, o.h / 2 + 1, false));
        return g;
      },
      tank: (o, K) => { const T = K.T, g = new T.Group(), mt = K.std(0x5a7a5a, { rough: 0.4, metal: 0.4 }); g.add(K.mesh(K.cyl(o.r, o.r, 90, 20), mt, 0, 45, 0), K.mesh(K.sph(o.r, 20), mt, 0, 90, 0), K.mesh(K.cyl(o.r + 1, o.r + 1, 10, 20), K.std(0xf2c230), 0, 50, 0)); return g; },
      barrel: (o, K) => { const T = K.T, g = new T.Group(), mt = K.std(0xc8402a, { own: true, rough: 0.5, metal: 0.3 }); g.add(K.mesh(K.cyl(o.r, o.r, 34, 14), mt, 0, 17, 0), K.mesh(K.cyl(o.r + 0.6, o.r + 0.6, 3, 14), K.std(0x7a2014), 0, 26, 0), K.mesh(K.cyl(o.r + 0.6, o.r + 0.6, 3, 14), K.std(0x7a2014), 0, 8, 0)); g.userData.flashMat = mt; return g; },
      pylon: (o, K) => { const T = K.T, g = new T.Group(); g.add(K.mesh(K.cyl(o.r * 0.7, o.r, 50, 10), K.std(0x3a4248, { metal: 0.6, rough: 0.4 }), 0, 25, 0), K.mesh(K.sph(6, 10), K.glowMat(0xff5b5b, 2), 0, 52, 0, false)); return g; },
      gen: (o, K) => {
        const T = K.T, g = new T.Group(), mt = K.std(0x3a4a52, { own: true, rough: 0.4, metal: 0.5 });
        g.add(K.mesh(K.box(o.r * 2, 50, o.r * 2), mt, 0, 25, 0));
        for (let i = 0; i < 3; i++) g.add(K.mesh(K.G3('coil', () => new T.TorusGeometry(10, 2.2, 8, 20)), K.glowMat(0x7ef3ff, 1.6), 0, 58 + i * 7, 0, false));
        const gl = K.glowSprite(0x7ef3ff, 80, 0.5); gl.position.y = 66; g.add(gl);
        g.userData.flashMat = mt; return g;
      },
    },
    actors3d: {
      laser: (a, K) => {
        const T = K.T, g = new T.Group(), L = Math.hypot(a.x2 - a.x1, a.y2 - a.y1);
        const beam = new T.Mesh(K.cyl(3, 3, 1, 8), new T.MeshBasicMaterial({ color: 0xff5050, transparent: true, opacity: 0.9, blending: T.AdditiveBlending }));
        beam.material.userData.own = true; beam.scale.y = L; beam.rotation.z = Math.PI / 2; beam.position.y = 40; g.add(beam);
        const glow = new T.Mesh(K.cyl(9, 9, 1, 8), new T.MeshBasicMaterial({ color: 0xff2020, transparent: true, opacity: 0.25, blending: T.AdditiveBlending, depthWrite: false }));
        glow.material.userData.own = true; glow.scale.y = L; glow.rotation.z = Math.PI / 2; glow.position.y = 40; g.add(glow);
        a.rot = Math.atan2(a.y2 - a.y1, a.x2 - a.x1);
        return g;
      },
    },
    hazards3d: { oil: { inner: 'rgba(15,12,10,0.95)', outer: 'rgba(30,20,40,0.2)', add: false, opacity: 0.85, y: 0.9 } },
  });
})(window.MB);
