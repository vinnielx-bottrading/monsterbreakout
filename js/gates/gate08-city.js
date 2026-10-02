/* Gate 08 — City: Đô Thị Đổ Nát
   Cơ chế: phố xá giữa các toà nhà, ô tô bỏ lại (bắn nổ được), đám cháy, "bầy đàn" Runner tràn tới theo đợt.
   Quái mới: Runner (zombie chạy rất nhanh, đi theo bầy), Riot (zombie cầm khiên chống bạo động, chặn đạn trực diện).
   Boss: Abomination — khối thịt khổng lồ: húc (đâm vào nhà sẽ choáng), ném xác xe, nôn axit hình nón, đẻ Runner.
   Thử thách: phá 4 ổ zombie (→ Bộ Chia Tia), giữ trạm cứu hộ (→ Lõi Xuyên Phá), 20 hạ gục (→ Cò Siêu Tốc). */
'use strict';
(function (MB) {
  const U = MB.U, Ens = MB.Enemies, GK = MB.GK;
  const WW = 3600, WH = 2400;

  /* ---------- props ---------- */
  MB.Props.register('building', (ctx, o) => {
    const x = o.x - o.hw, y = o.y - o.hh;
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(x + 14, y + 18, o.w, o.h);
    ctx.fillStyle = o.c || '#4a4650'; ctx.fillRect(x, y, o.w, o.h);
    ctx.fillStyle = 'rgba(255,255,255,.06)'; ctx.fillRect(x + 8, y + 8, o.w - 16, o.h - 16);
    ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 4; ctx.strokeRect(x + 2, y + 2, o.w - 4, o.h - 4);
    ctx.fillStyle = '#6a6670';
    for (let i = 0; i < 3; i++) ctx.fillRect(x + 20 + ((i * 97 + o.x) % Math.max(20, o.w - 60)), y + 20 + ((i * 61 + o.y) % Math.max(20, o.h - 60)), 26, 18);
    if (o.hole) { ctx.fillStyle = '#1a1820'; U.circle(ctx, o.x + o.hw * 0.3, o.y - o.hh * 0.2, 26); ctx.fill(); }
  });
  MB.Props.register('car', (ctx, o, t) => {
    ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(o.rot || 0);
    ctx.fillStyle = 'rgba(0,0,0,.3)'; U.rr(ctx, -o.hw + 5, -o.hh + 8, o.w, o.h, 10); ctx.fill();
    ctx.fillStyle = o.flash > 0 ? '#ffffff' : (o.c || '#7a3a3a'); U.rr(ctx, -o.hw, -o.hh, o.w, o.h, 10); ctx.fill();
    ctx.fillStyle = 'rgba(40,60,80,.85)'; U.rr(ctx, -o.hw * 0.35, -o.hh + 4, o.w * 0.5, o.h - 8, 6); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(-o.hw * 0.3, -o.hh + 6, o.w * 0.15, o.h - 12);
    if (o.hp < o.maxHp * 0.5) { ctx.fillStyle = `rgba(255,${120 + Math.sin(t * 20) * 60},40,.8)`; U.circle(ctx, o.hw * 0.6, 0, 6); ctx.fill(); }
    ctx.restore();
  });
  MB.Props.register('hive', (ctx, o, t) => {
    const { x, y, r } = o, pul = 1 + Math.sin(t * 2.5 + x) * 0.06;
    MB.Props.shadow(ctx, x + 6, y + 10, r * 1.2, r * 0.7, 0.3);
    ctx.save(); ctx.translate(x, y); ctx.scale(pul, pul);
    ctx.fillStyle = o.flash > 0 ? '#ffffff' : '#7a3a3a'; U.circle(ctx, 0, 0, r); ctx.fill();
    ctx.fillStyle = '#9a4a48'; for (let i = 0; i < 6; i++) { const a = i / 6 * U.TAU; U.circle(ctx, Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.55, r * 0.3); ctx.fill(); }
    ctx.fillStyle = `rgba(255,200,120,${0.5 + Math.sin(t * 4) * 0.3})`; U.circle(ctx, 0, 0, r * 0.3); ctx.fill();
    ctx.restore();
  });

  /* ---------- Runner ---------- */
  Ens.register('runner', {
    name: 'Runner', r: 15, hp: 35, speed: 175, dmg: 8, score: 80, blood: '#4a2020', gore: '#d88a7a',
    init(e) { e.speed += U.rnd(-15, 20); },
    update(e, G, dt) { Ens.steer(e, G, G.player.x, G.player.y, e.speed, dt, { f: 7, a: 0.25 }); },
    draw(ctx, e, G) {
      ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.face || 0);
      const sw = Math.sin(G.time * 16 + e.t) * 6;
      ctx.fillStyle = '#3a3a44'; U.rr(ctx, -5 + sw, -8, 10, 6, 3); ctx.fill(); U.rr(ctx, -5 - sw, 2, 10, 6, 3); ctx.fill();
      ctx.fillStyle = '#7a6a5a'; U.rr(ctx, -9, -10, 17, 20, 7); ctx.fill();
      ctx.strokeStyle = '#a89a86'; ctx.lineWidth = 4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(-8 - sw * 0.5, -14); ctx.moveTo(0, 9); ctx.lineTo(-8 + sw * 0.5, 14); ctx.stroke();
      ctx.fillStyle = '#b8a890'; U.circle(ctx, 4, 0, 6.5); ctx.fill();
      ctx.fillStyle = '#ff5a40'; U.circle(ctx, 8, -2.4, 1.5); ctx.fill(); U.circle(ctx, 8, 2.4, 1.5); ctx.fill();
      ctx.restore();
    },
  });

  /* ---------- Riot ---------- */
  Ens.register('riot', {
    name: 'Riot', r: 21, hp: 160, speed: 62, dmg: 16, score: 280, knockMul: 0.3, blood: '#4a2020', gore: '#d88a7a',
    armorFn: Ens.AI.shieldFront(0.1, 1.05),
    update(e, G, dt) { Ens.steer(e, G, G.player.x, G.player.y, e.speed, dt); e.face = Ens.toPlayer(e, G); },
    draw(ctx, e, G) {
      ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.face || 0);
      const sw = Math.sin(G.time * 5 + e.t) * 4;
      ctx.fillStyle = '#20242a'; U.rr(ctx, -6 + sw, -10, 12, 7, 3); ctx.fill(); U.rr(ctx, -6 - sw, 3, 12, 7, 3); ctx.fill();
      ctx.fillStyle = '#2a3440'; U.rr(ctx, -12, -13, 22, 26, 9); ctx.fill();
      ctx.fillStyle = '#1a2028'; U.circle(ctx, 1, 0, 8.5); ctx.fill();
      ctx.fillStyle = 'rgba(160,200,230,.35)'; U.rr(ctx, 3, -5, 5, 10, 2); ctx.fill();
      ctx.fillStyle = 'rgba(180,210,235,.55)'; U.rr(ctx, 16, -20, 7, 40, 3); ctx.fill();
      ctx.strokeStyle = '#e8f0f8'; ctx.lineWidth = 2; ctx.strokeRect(16, -20, 7, 40);
      ctx.restore();
    },
  });

  /* ---------- Boss: Abomination ---------- */
  Ens.register('abomination', {
    name: 'Abomination', r: 66, hp: 11000, speed: 62, dmg: 26, score: 0, boss: true, knockMul: 0, blood: '#4a2020', gore: '#d88a7a',
    init(e) { e.phase = 1; e.state = 'walk'; e.chargeT = 5; e.throwT = 3; e.vomitT = 7; e.sumT = 8; },
    armorFn(e, dmg) { return e.state === 'stun' ? dmg * 1.6 : dmg; },
    update(e, G, dt) {
      const p = G.player, d = Ens.distPlayer(e, G), k = e.hp / e.maxHp;
      const ph = k > 0.6 ? 1 : k > 0.25 ? 2 : 3;
      if (ph > e.phase) { e.phase = ph; G.banner(`PHASE ${ph}`, ph === 2 ? 'Abomination đẻ Runner' : 'Abomination điên loạn: húc liên tiếp', 2); MB.Audio.play('roar'); G.shake(12); }
      if (e.state === 'walk') {
        Ens.steer(e, G, p.x, p.y, e.speed * (ph === 3 ? 1.3 : 1), dt);
        e.chargeT -= dt; e.throwT -= dt; e.vomitT -= dt; e.sumT -= dt;
        if (e.chargeT <= 0 && d < 650) { e.state = 'aim'; e.st = 0.8; e.lock = Ens.toPlayer(e, G); }
        else if (e.vomitT <= 0 && d < 330) { e.state = 'vomitAim'; e.st = 0.7; e.lock = Ens.toPlayer(e, G); }
        else if (e.throwT <= 0 && d > 220) {
          e.throwT = ph === 1 ? 3.5 : 2.6;
          const tx = p.x + p.vx * 0.5, ty = p.y + p.vy * 0.5, dd = U.dist(tx, ty, e.x, e.y);
          G.telegraphCircle(tx, ty, 90, 1.1);
          G.enemyShot({ x: e.x, y: e.y, a: Math.atan2(ty - e.y, tx - e.x), speed: dd / 1.1, r: 26, dmg: 0, life: 1.1, kind: 'car', pass: true, owner: e,
            onEnd: (GG, b) => GG.explosion(b.x, b.y, 90, 40, { player: 22, knock: 350, obstacles: false }) });
          MB.Audio.play('throw');
        }
        if (ph >= 2 && e.sumT <= 0) { e.sumT = 8; for (let i = 0; i < 4 && G.extraAlive() < 10; i++) G.spawnEnemyAt('runner', e.x + U.rnd(-70, 70), e.y + U.rnd(-70, 70), { extra: true }); }
      } else if (e.state === 'aim') {
        Ens.stop(e, dt, 12); e.st -= dt;
        e.lock += U.angDiff(e.lock, Ens.toPlayer(e, G)) * Math.min(1, dt * 2); e.face = e.lock;
        if (e.st <= 0) { e.state = 'charge'; e.st = 0.75; e.vx = Math.cos(e.lock) * 640; e.vy = Math.sin(e.lock) * 640; MB.Audio.play('roar'); }
      } else if (e.state === 'charge') {
        e.st -= dt;
        if (e.bumped || e.st <= 0) {
          e.chargeT = ph === 3 ? 3.5 : 5.5;
          if (e.bumped) { e.state = 'stun'; e.st = 1.5; G.shake(14); G.text(e.x, e.y - 80, 'CHOÁNG!', '#ffd56a', 22); MB.Audio.play('slam'); }
          else if (ph === 3 && !e.second) { e.second = true; e.state = 'aim'; e.st = 0.45; e.lock = Ens.toPlayer(e, G); return; }
          else e.state = 'walk';
          e.second = false; e.vx *= 0.2; e.vy *= 0.2;
        }
      } else if (e.state === 'vomitAim') {
        Ens.stop(e, dt, 12); e.st -= dt; e.face = e.lock;
        if (e.st <= 0) { e.state = 'vomit'; e.st = 1.0; }
      } else if (e.state === 'vomit') {
        Ens.stop(e, dt, 12); e.st -= dt;
        if (Math.random() < 0.6) G.enemyShot({ x: e.x + Math.cos(e.lock) * 50, y: e.y + Math.sin(e.lock) * 50, a: e.lock + U.rnd(-0.4, 0.4), speed: U.rnd(260, 380), r: 8, dmg: 7, life: 1.0, kind: 'spit', owner: e,
          onEnd: (GG, b) => { if (Math.random() < 0.25) GG.addHazard({ kind: 'acid', x: b.x, y: b.y, r: 45, life: 4, dps: 9 }); } });
        if (e.st <= 0) { e.state = 'walk'; e.vomitT = U.rnd(6, 8); }
      } else if (e.state === 'stun') {
        Ens.stop(e, dt, 10); e.st -= dt; if (e.st <= 0) e.state = 'walk';
      }
    },
    tele(ctx, e, G) {
      if (e.state === 'aim') G.drawTelegraphLine(ctx, e.x, e.y, e.lock, 480, 1 - e.st / 0.8);
      if (e.state === 'vomitAim') { ctx.fillStyle = `rgba(190,255,90,${0.12 + (1 - e.st / 0.7) * 0.2})`; ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.arc(e.x, e.y, 360, e.lock - 0.45, e.lock + 0.45); ctx.closePath(); ctx.fill(); }
    },
    draw(ctx, e, G) {
      const t = G.time;
      ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.face || 0);
      const sw = Math.hypot(e.vx, e.vy) > 10 ? Math.sin(t * 5) * 8 : 0;
      ctx.fillStyle = '#8a6a5a';
      U.circle(ctx, 30 + sw, -58, 22); ctx.fill(); U.circle(ctx, 30 - sw, 58, 26); ctx.fill();
      ctx.fillStyle = e.phase === 3 ? '#9a4a48' : '#8a5a50'; U.ellipse(ctx, -6, 0, 64, 58); ctx.fill();
      ctx.fillStyle = '#a87a6a';
      [[-30, -26, 20], [-20, 30, 18], [10, -30, 14], [-46, 6, 16], [8, 28, 12]].forEach(([x, y, r]) => { U.circle(ctx, x, y, r); ctx.fill(); });
      ctx.fillStyle = '#e0d4bc'; for (let i = -2; i <= 2; i++) { ctx.fillRect(-30 + i * 10, -6, 4, 12); }
      ctx.fillStyle = 'rgba(190,255,90,.8)'; U.circle(ctx, -36, -20, 5); ctx.fill(); U.circle(ctx, -10, 40, 4); ctx.fill();
      // vài cái đầu dính vào thân
      for (const [x, y] of [[36, -10], [30, 22], [-4, -44]]) { ctx.fillStyle = '#c8b090'; U.circle(ctx, x, y, 10); ctx.fill(); ctx.fillStyle = '#ff5a40'; U.circle(ctx, x + 5, y - 3, 2); ctx.fill(); U.circle(ctx, x + 5, y + 3, 2); ctx.fill(); }
      if (e.state === 'stun') { ctx.fillStyle = '#ffd56a'; for (let i = 0; i < 3; i++) { const a = t * 5 + i * 2.1; U.circle(ctx, Math.cos(a) * 44, Math.sin(a) * 44, 4.5); ctx.fill(); } }
      ctx.restore();
    },
  });

  /* ---------- bản đồ ---------- */
  const rng = U.seeded(808);
  const obstacles = [];
  const COLS = ['#4a4650', '#524a44', '#3e4a52', '#504454', '#46504a'];
  const B = (x1, y1, x2, y2) => obstacles.push({ kind: 'building', shape: 'box', x: (x1 + x2) / 2, y: (y1 + y2) / 2, w: x2 - x1, h: y2 - y1, rot: 0, c: COLS[(rng() * COLS.length) | 0], hole: rng() < 0.35, tall: 260 });
  // khối nhà (đường ngang chính y≈1200, đường dọc x≈900/1800/2700)
  const XS = [[100, 760], [1040, 1660], [1940, 2560]], YS = [[90, 520], [640, 1060], [1340, 1760], [1880, 2310]];
  for (const [x1, x2] of XS) for (const [y1, y2] of YS) { if (rng() < 0.12) continue; B(x1, y1, x2, y2); }
  // khu quảng trường phía đông (boss)
  B(2840, 90, 3510, 520); B(2840, 1880, 3510, 2310);
  const CARC = ['#7a3a3a', '#3a5a7a', '#c8b030', '#5a5a5a', '#2a6a4a'];
  const cars = [[600, 1180, 0.1], [1350, 1250, -0.2], [2200, 1150, 0.3], [900, 580, 1.5], [1800, 1700, 1.6], [2700, 650, 1.4], [3000, 1000, 0.6], [3200, 1500, -0.5], [2700, 1800, 1.7], [450, 1260, 0.05], [1650, 1180, 2.9]];
  cars.forEach(([x, y, rot]) => obstacles.push({ kind: 'car', shape: 'box', x, y, w: 90, h: 46, rot, hp: 120, maxHp: 120, car: true, c: CARC[(rng() * CARC.length) | 0] }));
  const hazards = [];
  [[1300, 1700, 60], [2300, 600, 55], [700, 1750, 50], [3050, 1300, 60]].forEach(([x, y, r]) => hazards.push({ kind: 'fire', x, y, r, dps: 10, burn: 1.5, enemyDps: 10 }));

  MB.registerGate({
    id: 8, seed: 808, view3d: true,
    title: 'GATE 08 — CITY', subtitle: 'Đô Thị Đổ Nát',
    world: { w: WW, h: WH }, bg: '#121014', mmColor: 'rgba(120,115,130,.75)',
    scale: { hp: 1.6, dmg: 1.25 },
    start: { x: 200, y: 1200 },
    obstacles, hazards,
    crates: [{ x: 900, y: 1000 }, { x: 900, y: 1500 }, { x: 1800, y: 300 }, { x: 1800, y: 2100 }, { x: 2700, y: 1300 }, { x: 3300, y: 700 }, { x: 3420, y: 1450 }],
    spawnPoints: [
      { x: 900, y: 150 }, { x: 900, y: 2250 }, { x: 1800, y: 150 }, { x: 1800, y: 2250 }, { x: 2700, y: 150 }, { x: 2700, y: 2250 },
      { x: 3450, y: 1200 }, { x: 1350, y: 1200 }, { x: 2250, y: 1200 }, { x: 900, y: 1200 },
    ],
    waves: [
      { total: 22, maxAlive: 12, mix: { runner: 7, zombie: 4, riot: 2 }, interval: [0.45, 0.85], elite: 0.08 },
      { total: 26, maxAlive: 13, mix: { runner: 7, riot: 3, licker: 2, zombie: 3 }, interval: [0.4, 0.8], elite: 0.12 },
      { total: 30, maxAlive: 15, mix: { runner: 8, riot: 4, licker: 3, spider: 2 }, interval: [0.35, 0.7], elite: 0.16 },
    ],
    boss: { type: 'abomination', x: 3150, y: 1200 },
    intro: { title: 'NHIỆM VỤ', text: 'Thành phố đầy zombie. Bắn ô tô khi quái đứng gần để nổ cả đám. Coi chừng bầy Runner.' },
    objectives: [
      { title: 'MAIN STREET', text: 'Runner rất nhanh nhưng yếu: dùng shotgun / xung kích khi bị áp sát.' },
      { title: 'RIOT ZONE', text: 'Riot chặn đạn trực diện bằng khiên: vòng ra sau hoặc dùng lựu đạn.' },
      { title: 'DOWNTOWN', text: 'Wave cuối trước Boss.' },
      { title: 'BOSS · ABOMINATION', text: 'Dụ nó húc vào toà nhà để làm choáng. Tránh xác xe rơi (vòng đỏ) và vùng nôn axit.' },
    ],
    challenges: [
      { id: 'hives', type: 'destroy', name: 'Ổ Zombie', desc: 'Phá 4 ổ zombie', kind: 'hive', r: 32, hp: 320,
        spawner: { type: 'runner', every: 6, range: 700, cap: 6 },
        targets: [{ x: 900, y: 300 }, { x: 1800, y: 1900 }, { x: 2700, y: 300 }, { x: 3200, y: 1650 }], reward: { mod: 'split' } },
      { id: 'evac', type: 'hold', name: 'Trạm Cứu Hộ', desc: 'Đứng trong vùng xanh 16 giây', zone: { x: 1800, y: 1200, r: 115 }, time: 16,
        mix: { runner: 3, riot: 1 }, spawnEvery: 1.8, reward: { mod: 'pierce' } },
      { id: 'streak', type: 'streak', name: 'Người Sống Sót', desc: '20 hạ gục liên tiếp không trúng đòn', count: 20, reward: { mod: 'trigger' } },
    ],

    onObstacleDestroyed(G, o) {
      if (o.car) {
        G.explosion(o.x, o.y, 150, 110, { player: 28, knock: 500 });
        G.addHazard({ kind: 'fire', x: o.x, y: o.y, r: 70, life: 6, dps: 9, burn: 1.5, enemyDps: 12 });
      }
    },
    // bầy Runner tràn tới
    setup(G) { G.gs.hordeT = 30; },
    update(G, dt) {
      const p = G.player;
      if (G.state !== 'fight' || G.over || p.dead) return;
      G.gs.hordeT -= dt;
      if (G.gs.hordeT <= 0) {
        G.gs.hordeT = U.rnd(32, 40);
        G.banner('BẦY ĐÀN!', 'Runner tràn tới', 1.6); MB.Audio.play('roar');
        const sp = G.pickSpawn();
        for (let i = 0; i < 10; i++) G.spawnEnemyAt('runner', sp.x + U.rnd(-60, 60), sp.y + U.rnd(-60, 60), { extra: true });
      }
    },

    buildGround(g, w, h, rand) {
      g.fillStyle = '#2a2a2e'; g.fillRect(0, 0, w, h);
      GK.patches(g, rand, w, h, 200, ['rgba(50,50,56,.4)', 'rgba(16,16,18,.4)', 'rgba(70,60,50,.2)'], 30, 120);
      // vỉa hè quanh nhà
      for (const o of obstacles) if (o.kind === 'building') { g.fillStyle = '#4a4a50'; g.fillRect(o.x - o.w / 2 - 30, o.y - o.h / 2 - 30, o.w + 60, o.h + 60); }
      // vạch kẻ đường
      g.strokeStyle = 'rgba(240,220,120,.6)'; g.lineWidth = 6; g.setLineDash([40, 30]);
      g.beginPath(); g.moveTo(0, 1200); g.lineTo(w, 1200); g.stroke();
      for (const x of [900, 1800, 2700]) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
      g.setLineDash([]);
      // vạch qua đường
      g.fillStyle = 'rgba(230,230,230,.5)';
      for (const x of [900, 1800, 2700]) for (let i = -3; i <= 3; i++) { g.fillRect(x - 120, 1200 + i * 18 - 5, 30, 10); g.fillRect(x + 90, 1200 + i * 18 - 5, 30, 10); }
      GK.cracks(g, rand, w, h, 80, 'rgba(10,10,12,.5)', 26);
      GK.dots(g, rand, w, h, 900, ['rgba(120,110,100,.5)', 'rgba(20,20,22,.6)'], 4);
      GK.vignette(g, w, h, 0.5);
    },

    /* ---------- 3D ---------- */
    models3d: {
      runner: (K) => ({ base: 15, anim: K.animZombie, build: () => K.buildZombie({ skin: 0xb8a890, cloth: 0x3a3a44, shirt: 0x7a6a5a, eye: 0xff5a40, pustule: false, scale: [0.8, 0.85, 0.8], hunch: -0.6, gait: 11, arms: 0.4 }) }),
      riot: (K) => ({
        base: 21, anim: K.animZombie,
        build: () => K.buildZombie({ skin: 0x8a8a7a, cloth: 0x20242a, shirt: 0x2a3440, eye: 0xff5a40, pustule: false, hair: false, hunch: -0.15, arms: 1.1,
          extra(KK, torso, head) {
            const T = KK.T;
            head.add(KK.mesh(KK.sph(7.4, 16), KK.std(0x1a2028, { rough: 0.3, metal: 0.4 }), 0, 1.5, 0));
            head.add(KK.mesh(KK.box(2, 5, 9), KK.std(0x8ab0d0, { rough: 0.1, metal: 0.3, transparent: true, opacity: 0.6 }), 6.5, 0, 0));
            const sh = KK.mesh(KK.box(2, 34, 22), KK.std(0xb4d2eb, { rough: 0.1, metal: 0.2, transparent: true, opacity: 0.55 }), 14, 10, 0); torso.add(sh);
          } }),
      }),
      abomination: (K) => ({
        base: 66,
        build() {
          const T = K.T, g = new T.Group(), skin = K.skinMat(0x8a5a50, { rough: 0.5 }), flesh = K.std(0xa87a6a, { rough: 0.5 });
          const core = new T.Group(); g.add(core);
          const body = K.mesh(K.bumpy('abom', new T.SphereGeometry(52, 30, 22), 3, 0.12), skin, -6, 58, 0); body.scale.set(1.15, 1, 1.05); core.add(body);
          for (const [x, y, z, r] of [[-30, 80, -26, 18], [-20, 70, 30, 16], [10, 92, -18, 14], [-40, 50, 10, 15]]) core.add(K.mesh(K.bumpy('abl' + r, new T.SphereGeometry(r, 14, 10), 1, 0.4), flesh, x, y, z));
          for (const [x, y, z] of [[42, 70, -10], [36, 56, 24], [0, 104, -10]]) { const h = new T.Group(); h.position.set(x, y, z); core.add(h); h.add(K.mesh(K.sph(9, 12), K.std(0xc8b090), 0, 0, 0)); for (const zz of [-3, 3]) h.add(K.mesh(K.sph(1.6, 6), K.glowMat(0xff5a40, 2), 8, 2, zz)); }
          for (let i = 0; i < 5; i++) core.add(K.mesh(K.cyl(1.2, 1.2, 14, 6), K.std(0xe0d4bc), -30 + i * 8, 60, 50));
          const pm = K.glowMat(0xbeff5a, 1.2); core.add(K.mesh(K.sph(5, 8), pm, -36, 76, -40), K.mesh(K.sph(4, 8), pm, -10, 40, 50));
          const arms = [];
          for (const z of [-1, 1]) {
            const sh = K.joint(core, 10, 76, z * 50, 12, 10, 34, skin, flesh); sh.rotation.z = 0.9;
            const el = K.joint(sh.userData.end, 0, 0, 0, 10, 8, 30, skin, flesh); el.rotation.z = 0.5;
            el.userData.end.add(K.mesh(K.bumpy('abf', new T.SphereGeometry(13, 14, 10), 1.2, 0.4), flesh, 0, 0, 0));
            arms.push(sh);
          }
          const legs = [];
          for (const z of [-22, 22]) { const l = K.joint(core, -6, 26, z, 12, 10, 26, skin); legs.push(l); }
          const stars = new T.Group(); stars.visible = false; stars.position.y = 130; g.add(stars);
          for (let i = 0; i < 3; i++) stars.add(K.mesh(K.sph(4, 6), K.glowMat(0xffd56a, 2), 0, 0, 0, false));
          g.userData = { core, arms, legs, stars, h: 120 };
          return g;
        },
        anim(e, m, G) {
          const d = m.userData, t = G.time, mv = Math.hypot(e.vx, e.vy) > 10, f = e.state === 'charge' ? 12 : 5;
          const sw = mv ? Math.sin(t * f) * 0.4 : 0;
          d.legs[0].rotation.z = sw; d.legs[1].rotation.z = -sw;
          d.arms[0].rotation.z = 0.9 - sw * 0.5 + (e.state === 'aim' ? 0.8 : 0); d.arms[1].rotation.z = 0.9 + sw * 0.5 + (e.state === 'aim' ? 0.8 : 0);
          d.core.rotation.z = e.state === 'charge' ? -0.3 : e.state === 'vomit' ? -0.2 : 0;
          d.stars.visible = e.state === 'stun';
          if (d.stars.visible) d.stars.children.forEach((c, i) => { const a = t * 5 + i * 2.1; c.position.set(Math.cos(a) * 50, 0, Math.sin(a) * 50); });
        },
      }),
    },
    props3d: {
      building: (o, K) => {
        const T = K.T, g = new T.Group(), hgt = 160 + ((o.x * 7 + o.y * 3) % 120);
        if (!K.U.__winTex) {
          const cv = document.createElement('canvas'); cv.width = 64; cv.height = 128; const c = cv.getContext('2d');
          c.fillStyle = '#3a3640'; c.fillRect(0, 0, 64, 128);
          for (let y = 6; y < 128; y += 16) for (let x = 6; x < 64; x += 14) { c.fillStyle = Math.random() < 0.12 ? '#ffd27a' : Math.random() < 0.5 ? '#1a1a22' : '#2a3040'; c.fillRect(x, y, 8, 10); }
          K.U.__winTex = new T.CanvasTexture(cv); K.U.__winTex.wrapS = K.U.__winTex.wrapT = T.RepeatWrapping; K.U.__winTex.colorSpace = T.SRGBColorSpace;
        }
        const tex = K.U.__winTex.clone(); tex.needsUpdate = true; tex.repeat.set(Math.max(1, o.w / 90), Math.max(1, hgt / 160));
        const wallM = new T.MeshStandardMaterial({ map: tex, color: new T.Color(o.c || '#4a4650').lerp(new T.Color('#ffffff'), 0.35), roughness: 0.85, transparent: true }); wallM.userData.own = true;
        const roofM = K.std(new T.Color(o.c || '#4a4650').getHex(), { own: true, rough: 0.9, transparent: true });
        g.add(K.mesh(K.box(o.w, hgt, o.h), wallM, 0, hgt / 2, 0));
        g.add(K.mesh(K.box(o.w - 10, 6, o.h - 10), roofM, 0, hgt + 3, 0));
        for (let i = 0; i < 2; i++) g.add(K.mesh(K.box(24, 14, 18), K.std(0x6a6670), -o.w / 4 + i * o.w / 2, hgt + 12, 0));
        g.userData.canopy = [wallM, roofM];
        return g;
      },
      car: (o, K) => {
        const T = K.T, g = new T.Group(), body = K.std(new T.Color(o.c || '#7a3a3a').getHex(), { own: true, rough: 0.4, metal: 0.4 });
        g.add(K.mesh(K.box(o.w, 18, o.h), body, 0, 14, 0));
        g.add(K.mesh(K.box(o.w * 0.5, 14, o.h * 0.9), K.std(0x2a3a4a, { rough: 0.1, metal: 0.5 }), -o.w * 0.05, 29, 0));
        for (const [x, z] of [[-o.w * 0.32, -o.h / 2], [o.w * 0.32, -o.h / 2], [-o.w * 0.32, o.h / 2], [o.w * 0.32, o.h / 2]]) { const wh = K.mesh(K.cyl(8, 8, 6, 12), K.std(0x111111), x, 8, z); wh.rotation.x = Math.PI / 2; g.add(wh); }
        g.rotation.y = -(o.rot || 0); g.userData.flashMat = body; return g;
      },
      hive: (o, K) => {
        const T = K.T, g = new T.Group(), mt = K.std(0x7a3a3a, { own: true, rough: 0.5 });
        const b = K.mesh(K.bumpy('hive', new T.SphereGeometry(o.r, 22, 16), 3, 0.25), mt, 0, o.r * 0.6, 0); b.scale.y = 0.8; g.add(b);
        const core = K.mesh(K.sph(o.r * 0.35, 12), K.glowMat(0xffc878, 1.4), 0, o.r * 1.15, 0, false); g.add(core);
        g.userData.flashMat = mt; g.userData.core = core; return g;
      },
    },
  });
})(window.MB);
