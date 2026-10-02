/* Gate 10 — Apocalypse: Tận Thế (màn cuối)
   Cơ chế: virus lan rộng theo thời gian, sét đỏ đánh xuống (vòng đỏ), khe nứt không gian sinh quái của mọi Gate.
   Quái: tổng hợp tất cả quái từ Gate 01–09 (file Gate này tải trước các Gate khác qua `requires`).
   Boss: The Origin — 4 phase: lá chắn nút năng lượng → xúc tu → dịch chuyển + lưới laser → cuồng nộ (sóng chấn + mưa sét).
   Thử thách: phá 4 khe nứt (→ Bộ Chia Tia), giữ thiết bị phong ấn (→ Lõi Xuyên Phá), 25 hạ gục (→ Nòng Tăng Lực). */
'use strict';
(function (MB) {
  const U = MB.U, Ens = MB.Enemies, GK = MB.GK;
  const WW = 3600, WH = 2400;

  function lightning(G, x, y, delay) {
    G.telegraphCircle(x, y, 80, delay || 1.1, (GG) => {
      GG.explosion(x, y, 80, 60, { player: 20, knock: 250, color: '#ff4a6a', ring: '255,70,110', obstacles: false, small: true });
      GG.addFx({ layer: 'top', life: 0.25, draw(ctx, fx) {
        ctx.strokeStyle = `rgba(255,200,220,${1 - fx.t / fx.life})`; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x + U.rnd(-30, 30), y - 600);
        for (let k = 1; k < 8; k++) ctx.lineTo(x + U.rnd(-25, 25), y - 600 + k * 75); ctx.lineTo(x, y); ctx.stroke(); } });
    }, 'rgba(255,60,90,.14)');
  }

  /* ---------- props ---------- */
  MB.Props.register('rift', (ctx, o, t) => {
    const { x, y, r } = o;
    ctx.save(); ctx.translate(x, y);
    for (let i = 0; i < 3; i++) { ctx.strokeStyle = `rgba(255,70,110,${0.5 - i * 0.12})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(0, 0, r * (1 + i * 0.3), r * 0.55 * (1 + i * 0.3), t * (i % 2 ? 1 : -1), 0, U.TAU); ctx.stroke(); }
    const g = ctx.createRadialGradient(0, 0, 2, 0, 0, r);
    g.addColorStop(0, o.flash > 0 ? '#ffffff' : 'rgba(20,0,20,1)'); g.addColorStop(0.6, 'rgba(120,10,60,.9)'); g.addColorStop(1, 'rgba(255,60,120,0)');
    ctx.fillStyle = g; U.ellipse(ctx, 0, 0, r, r * 0.6, Math.sin(t) * 0.2); ctx.fill();
    ctx.restore();
  });

  /* ---------- Nút năng lượng của The Origin ---------- */
  Ens.register('originNode', {
    name: 'Origin Node', r: 26, hp: 450, speed: 0, dmg: 10, score: 500, knockMul: 0, noContact: true, blood: '#3a0a1a', gore: '#ff6a8a',
    init(e) { e.cd = U.rnd(1, 2); },
    update(e, G, dt) {
      e.vx = 0; e.vy = 0; e.cd -= dt;
      if (e.cd <= 0) { e.cd = 2.2; const a = Ens.toPlayer(e, G); for (let i = -1; i <= 1; i++) G.enemyShot({ x: e.x, y: e.y, a: a + i * 0.25, speed: 300, r: 7, dmg: 9, life: 2, kind: 'orb', color: '#ff4a6a', owner: e }); }
    },
    draw(ctx, e, G) {
      const t = G.time;
      ctx.fillStyle = 'rgba(0,0,0,.3)'; U.ellipse(ctx, e.x + 3, e.y + 10, 24, 12); ctx.fill();
      ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(t);
      ctx.fillStyle = '#3a0a2a'; ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * U.TAU; ctx.lineTo(Math.cos(a) * 24, Math.sin(a) * 24); } ctx.closePath(); ctx.fill();
      ctx.fillStyle = `rgba(255,70,110,${0.7 + Math.sin(t * 5) * 0.3})`; U.circle(ctx, 0, 0, 11); ctx.fill();
      ctx.restore();
    },
  });

  /* ---------- Boss: The Origin ---------- */
  Ens.register('origin', {
    name: 'The Origin', r: 76, hp: 16000, speed: 70, dmg: 28, score: 0, boss: true, knockMul: 0, blood: '#3a0a1a', gore: '#ff6a8a',
    init(e) { e.phase = 1; e.state = 'core'; e.nodes = []; e.spiralA = 0; e.spT = 0; e.tentT = 2; e.blinkT = 3; e.gridT = 6; e.waveT = 4; e.boltT = 3; e.sumT = 8; e.shield = true; },
    armorFn(e, dmg, G) {
      if (e.shield) { if (Math.random() < 0.1) G.text(e.x, e.y - 90, 'PHÁ NÚT NĂNG LƯỢNG!', '#ff8aa0', 14); return 0; }
      return dmg;
    },
    update(e, G, dt) {
      const p = G.player, d = Ens.distPlayer(e, G), k = e.hp / e.maxHp;
      const ph = k > 0.75 ? 1 : k > 0.5 ? 2 : k > 0.25 ? 3 : 4;
      if (ph > e.phase) {
        e.phase = ph;
        const msg = ['', '', 'The Origin vươn xúc tu', 'The Origin dịch chuyển và giăng lưới laser', 'CUỒNG NỘ: sóng chấn và mưa sét'][ph];
        G.banner(`PHASE ${ph}`, msg, 2.2); MB.Audio.play('roar'); G.shake(16);
      }
      e.nodes = e.nodes.filter((n) => !n.dead);
      // phase 1: lá chắn bởi 4 nút năng lượng
      if (ph === 1) {
        Ens.stop(e, dt, 10);
        if (e.shield && !e.nodesMade) {
          e.nodesMade = true;
          for (let i = 0; i < 4; i++) { const a = i / 4 * U.TAU + 0.6, n = G.spawnEnemyAt('originNode', e.x + Math.cos(a) * 260, e.y + Math.sin(a) * 260, { extra: true }); if (n) e.nodes.push(n); }
        }
        if (e.shield && e.nodesMade && e.nodes.length === 0) { e.shield = false; G.banner('LÁ CHẮN VỠ', 'Tấn công The Origin!', 1.8); MB.Audio.play('break'); }
      } else e.shield = false;
      // xoắn ốc đạn (mọi phase)
      e.spT -= dt;
      if (e.spT <= 0) {
        e.spT = ph >= 3 ? 0.11 : 0.16; e.spiralA += 0.37;
        const n = ph === 4 ? 4 : 3;
        for (let i = 0; i < n; i++) G.enemyShot({ x: e.x, y: e.y, a: e.spiralA + i * U.TAU / n, speed: 210, r: 7, dmg: 8, life: 3, kind: 'orb', color: '#ff4a6a', owner: e });
      }
      if (ph >= 2) {
        Ens.steer(e, G, p.x, p.y, e.speed * (ph === 4 ? 1.3 : 1) * (d > 260 ? 1 : 0.2), dt);
        e.tentT -= dt;
        if (e.tentT <= 0 && G.extraAlive() < 9 && MB.Enemies.types.tentacle) {
          e.tentT = ph === 4 ? 4 : 6;
          for (let i = 0; i < 2; i++) { const a = U.rnd(0, U.TAU), t = G.spawnEnemyAt('tentacle', p.x + Math.cos(a) * 220, p.y + Math.sin(a) * 220, { extra: true }); if (t) { t.hp = t.maxHp = 600; } }
        }
      }
      if (ph >= 3) {
        e.blinkT -= dt; e.gridT -= dt;
        if (e.blinkT <= 0) {
          e.blinkT = 5; G.burst(e.x, e.y, '#ff4a6a', 24, 220);
          const a = U.rnd(0, U.TAU); e.x = U.clamp(p.x + Math.cos(a) * 360, 150, G.world.w - 150); e.y = U.clamp(p.y + Math.sin(a) * 360, 150, G.world.h - 150);
          G.burst(e.x, e.y, '#ff4a6a', 24, 220); MB.Audio.play('dash');
        }
        if (e.gridT <= 0) {
          e.gridT = 8;
          const vert = Math.random() < 0.5, off = U.rnd(0, 150);
          for (let i = -4; i <= 4; i++) {
            const c = (vert ? p.x : p.y) + i * 150 + off - 75;
            G.addFx({ layer: 'ground', life: 1.6, hit: false,
              update(fx) { if (fx.t > 1 && !fx.hit && !p.dead) { const v = vert ? p.x : p.y; if (Math.abs(v - c) < 24 + p.r * 0.5) { fx.hit = true; G.hurtPlayer(22, { x: p.x - 1, y: p.y }); } } },
              draw(ctx, fx) { ctx.fillStyle = `rgba(255,60,100,${fx.t > 1 ? 0.6 : 0.12 + fx.t * 0.2})`; if (vert) ctx.fillRect(c - 24, p.y - 700, 48, 1400); else ctx.fillRect(p.x - 900, c - 24, 1800, 48); } });
          }
        }
      }
      if (ph === 4) {
        e.waveT -= dt; e.boltT -= dt; e.sumT -= dt;
        if (e.waveT <= 0) { e.waveT = 4.5; G.shockwave(e.x, e.y, 520, 1.2, 22, 'rgba(255,90,130,.9)'); }
        if (e.boltT <= 0) { e.boltT = 2.5; for (let i = 0; i < 4; i++) lightning(G, p.x + U.rnd(-200, 200), p.y + U.rnd(-200, 200), 1.0 + i * 0.15); }
        if (e.sumT <= 0) { e.sumT = 10; for (let i = 0; i < 2 && G.extraAlive() < 10; i++) G.spawnEnemyAt(U.pick(['licker', 'stalker', 'riot', 'crab']), e.x + U.rnd(-120, 120), e.y + U.rnd(-120, 120), { extra: true, elite: true }); }
      }
      e.face = Ens.toPlayer(e, G);
    },
    draw(ctx, e, G) {
      const t = G.time, pul = 1 + Math.sin(t * 3) * 0.05;
      if (e.shield) { ctx.strokeStyle = `rgba(255,90,130,${0.5 + Math.sin(t * 6) * 0.3})`; ctx.lineWidth = 5; U.circle(ctx, e.x, e.y, 100); ctx.stroke(); for (const n of e.nodes) { ctx.strokeStyle = 'rgba(255,90,130,.4)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(n.x, n.y); ctx.stroke(); } }
      ctx.save(); ctx.translate(e.x, e.y); ctx.scale(pul, pul);
      ctx.fillStyle = '#2a0a1a';
      for (let i = 0; i < 14; i++) { const a = i / 14 * U.TAU + t * 0.3; ctx.beginPath(); ctx.moveTo(Math.cos(a - 0.12) * 60, Math.sin(a - 0.12) * 60); ctx.lineTo(Math.cos(a) * (96 + Math.sin(t * 4 + i) * 8), Math.sin(a) * (96 + Math.sin(t * 4 + i) * 8)); ctx.lineTo(Math.cos(a + 0.12) * 60, Math.sin(a + 0.12) * 60); ctx.fill(); }
      ctx.fillStyle = e.phase === 4 ? '#6a0a2a' : '#4a0a2a'; U.circle(ctx, 0, 0, 68); ctx.fill();
      ctx.strokeStyle = `rgba(255,80,120,${0.6 + Math.sin(t * 5) * 0.3})`; ctx.lineWidth = 4;
      for (let i = 0; i < 6; i++) { const a = i / 6 * U.TAU; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 20, Math.sin(a) * 20); ctx.quadraticCurveTo(Math.cos(a + 0.4) * 50, Math.sin(a + 0.4) * 50, Math.cos(a + 0.2) * 66, Math.sin(a + 0.2) * 66); ctx.stroke(); }
      ctx.fillStyle = '#f2e8d8'; U.circle(ctx, 0, 0, 28); ctx.fill();
      const pa = e.face || 0;
      ctx.fillStyle = '#ff2a5a'; U.circle(ctx, Math.cos(pa) * 9, Math.sin(pa) * 9, 14); ctx.fill();
      ctx.fillStyle = '#1a0008'; U.ellipse(ctx, Math.cos(pa) * 12, Math.sin(pa) * 12, 4, 10, pa); ctx.fill();
      ctx.restore();
    },
  });

  /* ---------- bản đồ ---------- */
  const rng = U.seeded(1010);
  const obstacles = [];
  const ROCK = (L, x, y) => L.push({ kind: 'rock', shape: 'circle', x, y, r: 36 + rng() * 26, c1: '#3a2a32', c2: '#54404a' });
  const CHAR = (L, x, y) => L.push({ kind: 'charred', shape: 'circle', x, y, r: 34 + rng() * 10 });
  const SPIRE = (L, x, y) => L.push({ kind: 'spire', shape: 'circle', x, y, r: 26 + rng() * 16 });
  GK.border(obstacles, rng, WW, WH, (L, x, y) => (rng() < 0.5 ? ROCK(L, x, y) : SPIRE(L, x, y)), 1200);
  const keep = [{ x: 240, y: 1200, r: 320 }, { x: 2900, y: 1200, r: 420 }, { x: 1700, y: 600, r: 200 },
    { x: 800, y: 500, r: 130 }, { x: 1500, y: 1950, r: 130 }, { x: 2300, y: 400, r: 130 }, { x: 3200, y: 2000, r: 130 }];
  GK.scatter(obstacles, rng, 14, [250, 250, WW - 250, WH - 250], keep, ROCK);
  GK.scatter(obstacles, rng, 10, [250, 250, WW - 250, WH - 250], keep, CHAR);
  GK.scatter(obstacles, rng, 8, [250, 250, WW - 250, WH - 250], keep, SPIRE);
  [[1200, 1300, 170, 0.3], [2100, 900, 180, -0.4], [2300, 1700, 160, 0.2]].forEach(([x, y, w, rot]) => obstacles.push({ kind: 'log', shape: 'box', x, y, w, h: 34, rot }));
  const hazards = [];
  [[900, 1500, 80], [1600, 1300, 70], [2200, 1300, 85], [1300, 800, 75], [2600, 1900, 80]].forEach(([x, y, r]) => hazards.push({ kind: 'virus', x, y, r, dps: 12, grow: true, base: r }));
  [[1900, 2000, 60], [600, 900, 55]].forEach(([x, y, r]) => hazards.push({ kind: 'lava', x, y, r, dps: 26, burn: 2, enemyDps: 20 }));

  const ALL = { zombie: 2, spider: 2, licker: 2, bat: 2, brute: 1, bloater: 2, lurker: 1, frostZombie: 2, iceWraith: 1, magmaImp: 2, emberSpitter: 1, cinderGolem: 1, crab: 2, drowned: 1, drone: 2, sludge: 1, runner: 3, riot: 1, clone: 2, stalker: 1 };

  MB.registerGate({
    id: 10, seed: 1010, view3d: true,
    title: 'GATE 10 — APOCALYPSE', subtitle: 'Tận Thế · Màn cuối',
    world: { w: WW, h: WH }, bg: '#14060c', mmColor: 'rgba(160,110,130,.7)',
    scale: { hp: 1.85, dmg: 1.35 },
    start: { x: 240, y: 1200 },
    obstacles, hazards,
    crates: [{ x: 700, y: 1200 }, { x: 1300, y: 400 }, { x: 1300, y: 2000 }, { x: 1900, y: 1200 }, { x: 2500, y: 500 }, { x: 2500, y: 2050 }, { x: 3300, y: 900 }, { x: 600, y: 2000 }],
    spawnPoints: [
      { x: 350, y: 300 }, { x: 1300, y: 230 }, { x: 2300, y: 240 }, { x: 3300, y: 300 }, { x: 3350, y: 1200 }, { x: 3300, y: 2100 },
      { x: 2300, y: 2150 }, { x: 1300, y: 2150 }, { x: 350, y: 2100 }, { x: 1100, y: 1200 }, { x: 2200, y: 1200 }, { x: 900, y: 700 },
    ],
    waves: [
      { total: 22, maxAlive: 12, mix: { zombie: 3, spider: 3, bat: 2, bloater: 2, frostZombie: 2, runner: 3 }, interval: [0.55, 0.95], elite: 0.12 },
      { total: 26, maxAlive: 13, mix: { licker: 2, magmaImp: 3, emberSpitter: 2, crab: 2, drowned: 2, drone: 2, sludge: 2 }, interval: [0.5, 0.9], elite: 0.15 },
      { total: 30, maxAlive: 14, mix: { brute: 2, cinderGolem: 1, riot: 2, clone: 3, stalker: 2, iceWraith: 2, lurker: 2, runner: 3 }, interval: [0.45, 0.85], elite: 0.18 },
      { total: 34, maxAlive: 15, mix: ALL, interval: [0.4, 0.8], elite: 0.22 },
    ],
    boss: { type: 'origin', x: 2900, y: 1200 },
    intro: { title: 'NHIỆM VỤ CUỐI', text: 'Nguồn gốc của virus ở đây. Sống sót 4 wave quái từ mọi vùng đất và tiêu diệt The Origin.' },
    objectives: [
      { title: 'THE BREACH', text: 'Virus lan rộng dần. Sét đỏ đánh vào vòng đỏ.' },
      { title: 'CONVERGENCE', text: 'Quái từ mọi Gate kéo đến.' },
      { title: 'NO MAN\'S LAND', text: 'Quái tinh nhuệ xuất hiện nhiều hơn.' },
      { title: 'LAST STAND', text: 'Wave cuối trước trận chiến cuối cùng.' },
      { title: 'BOSS · THE ORIGIN', text: 'Phase 1: phá 4 nút năng lượng để vỡ lá chắn. Sau đó né xúc tu, lưới laser và sóng chấn.' },
    ],
    challenges: [
      { id: 'rifts', type: 'destroy', name: 'Khe Nứt Không Gian', desc: 'Phá 4 khe nứt', kind: 'rift', r: 34, hp: 450,
        spawner: { type: 'runner', every: 7, range: 750, cap: 6 },
        targets: [{ x: 800, y: 500 }, { x: 1500, y: 1950 }, { x: 2300, y: 400 }, { x: 3200, y: 2000 }], reward: { mod: 'split' } },
      { id: 'seal', type: 'hold', name: 'Thiết Bị Phong Ấn', desc: 'Đứng trong vùng xanh 18 giây', zone: { x: 1700, y: 600, r: 115 }, time: 18,
        mix: { zombie: 2, runner: 2, licker: 1, clone: 1 }, spawnEvery: 1.8, reward: { mod: 'pierce' } },
      { id: 'streak', type: 'streak', name: 'Huyền Thoại', desc: '25 hạ gục liên tiếp không trúng đòn', count: 25, reward: { mod: 'barrel' } },
    ],

    setup(G) { G.gs.spreadT = 14; G.gs.boltT = 9; },
    update(G, dt) {
      const p = G.player, gs = G.gs;
      // virus lan rộng
      for (const h of G.hazards) if (h.grow && h.r < h.base * 1.8) h.r += dt * 1.2;
      if (G.state === 'intro' || G.state === 'won' || G.over || p.dead) return;
      gs.spreadT -= dt; gs.boltT -= dt;
      if (gs.spreadT <= 0 && G.hazards.filter((h) => h.grow).length < 14) {
        gs.spreadT = U.rnd(12, 16);
        const a = U.rnd(0, U.TAU), dd = U.rnd(200, 420);
        G.hazards.push({ kind: 'virus', x: U.clamp(p.x + Math.cos(a) * dd, 100, G.world.w - 100), y: U.clamp(p.y + Math.sin(a) * dd, 100, G.world.h - 100), r: 30, dps: 12, grow: true, base: 70 });
        G.mmDirty = true;
      }
      if (gs.boltT <= 0 && G.state !== 'boss') { gs.boltT = U.rnd(7, 10); for (let i = 0; i < 3; i++) lightning(G, p.x + U.rnd(-220, 220), p.y + U.rnd(-220, 220), 1.1 + i * 0.2); }
    },
    drawScreen(G, ctx) {
      const t = G.time;
      ctx.fillStyle = `rgba(120,0,30,${0.06 + Math.sin(t * 0.8) * 0.03})`; ctx.fillRect(0, 0, G.W, G.H);
    },

    buildGround(g, w, h, rand) {
      g.fillStyle = '#24121a'; g.fillRect(0, 0, w, h);
      GK.patches(g, rand, w, h, 280, ['rgba(60,24,40,.5)', 'rgba(10,4,8,.5)', 'rgba(80,40,50,.3)'], 40, 150);
      g.lineCap = 'round';
      for (let k = 0; k < 90; k++) {
        let x = rand() * w, y = rand() * h, a = rand() * 6.28;
        g.strokeStyle = 'rgba(255,60,110,.28)'; g.lineWidth = 3; g.beginPath(); g.moveTo(x, y);
        for (let s = 0; s < 6; s++) { a += (rand() - 0.5) * 1.3; x += Math.cos(a) * 28; y += Math.sin(a) * 28; g.lineTo(x, y); }
        g.stroke();
      }
      GK.path(g, [[100, 1200], [700, 1080], [1300, 1280], [1900, 1150], [2500, 1250], [3100, 1200], [3500, 1200]], 120, 'rgba(70,40,50,.6)');
      GK.dots(g, rand, w, h, 1500, ['rgba(140,90,110,.45)', 'rgba(255,90,120,.25)', 'rgba(10,4,8,.6)'], 3);
      GK.vignette(g, w, h, 0.6);
    },

    /* ---------- 3D ---------- */
    models3d: {
      originNode: (K) => ({
        base: 26,
        build() { const T = K.T, g = new T.Group(); g.add(K.mesh(K.G3('onode', () => new T.CylinderGeometry(24, 28, 30, 6)), K.std(0x3a0a2a, { metal: 0.4, rough: 0.4 }), 0, 15, 0)); const c = K.mesh(K.G3('ooct', () => new T.OctahedronGeometry(14, 0)), K.glowMat(0xff4a6a, 1.6), 0, 46, 0); g.add(c); g.userData = { c, h: 60 }; return g; },
        anim(e, m, G) { m.userData.c.rotation.y = G.time * 2; m.userData.c.position.y = 46 + Math.sin(G.time * 3) * 4; },
      }),
      origin: (K) => ({
        base: 76,
        build() {
          const T = K.T, g = new T.Group(), core = new T.Group(); core.position.y = 80; g.add(core);
          const body = K.mesh(K.bumpy('orig', new T.SphereGeometry(62, 32, 24), 4, 0.1), K.std(0x4a0a2a, { own: true, rough: 0.35, emissive: 0x3a0010, ei: 0.6 }), 0, 0, 0); core.add(body);
          const spk = K.std(0x2a0a1a, { rough: 0.4 });
          for (let i = 0; i < 26; i++) { const ph = Math.acos(1 - 2 * (i + 0.5) / 26), th = Math.PI * (1 + Math.sqrt(5)) * i; const dir = new T.Vector3(Math.sin(ph) * Math.cos(th), Math.cos(ph), Math.sin(ph) * Math.sin(th)); const c = K.mesh(K.G3('ospk', () => new T.ConeGeometry(7, 40, 6)), spk, dir.x * 62, dir.y * 62, dir.z * 62); c.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), dir); c.position.addScaledVector(dir, 16); core.add(c); }
          const veins = K.glowMat(0xff4a6a, 1.4);
          for (let i = 0; i < 8; i++) { const r = new T.Mesh(K.G3('ovein', () => new T.TorusGeometry(63, 1.2, 6, 40, 1.4)), veins); r.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3); core.add(r); }
          const eye = new T.Group(); core.add(eye);
          eye.add(K.mesh(K.sph(28, 20), K.std(0xf2e8d8, { rough: 0.2 }), 52, 0, 0));
          eye.add(K.mesh(K.sph(15, 16), K.glowMat(0xff2a5a, 1.5), 74, 0, 0));
          eye.add(K.mesh(K.box(4, 18, 6), K.std(0x1a0008), 88, 0, 0));
          const shield = new T.Mesh(K.sph(110, 24), new T.MeshBasicMaterial({ color: 0xff4a7a, transparent: true, opacity: 0.18, wireframe: true }));
          shield.material.userData.own = true; core.add(shield);
          const gl = K.glowSprite(0xff2a5a, 320, 0.35); core.add(gl);
          g.userData = { core, eye, shield, body, h: 170 };
          return g;
        },
        anim(e, m, G) {
          const d = m.userData, t = G.time;
          m.rotation.y = 0; d.eye.rotation.y = -(e.face || 0);
          d.core.rotation.x = Math.sin(t * 0.5) * 0.1; d.core.position.y = 80 + Math.sin(t * 1.5) * 8;
          const s = 1 + Math.sin(t * 3) * 0.04; d.body.scale.setScalar(s);
          d.shield.visible = !!e.shield; d.shield.rotation.y = t;
        },
      }),
    },
    props3d: {
      rift: (o, K) => {
        const T = K.T, g = new T.Group(), mt = new T.MeshBasicMaterial({ color: 0x1a0010 }); mt.userData.own = true;
        const disc = new T.Mesh(K.G3('riftd', () => new T.CircleGeometry(1, 32)), mt); disc.scale.set(o.r, o.r * 1.6, 1); disc.position.y = o.r * 1.7; g.add(disc);
        for (let i = 0; i < 3; i++) { const r = new T.Mesh(K.G3('riftr' + i, () => new T.TorusGeometry(1, 0.06, 6, 40)), K.glowMat(0xff4a7a, 1.6)); r.scale.set(o.r * (1.05 + i * 0.25), o.r * 1.6 * (1.05 + i * 0.25), o.r); r.position.y = o.r * 1.7; g.add(r); }
        const gl = K.glowSprite(0xff2a6a, o.r * 5, 0.5); gl.position.y = o.r * 1.7; g.add(gl);
        return g;
      },
    },
  });
})(window.MB);
