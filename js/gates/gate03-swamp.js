/* Gate 03 — Swamp: Đầm Lầy Đột Biến
   Cơ chế: bùn lún (đi chậm), hồ axit, mạch khí độc phun lên quanh người chơi (vòng đỏ báo trước).
   Quái mới: Bloater (lao tới tự nổ, để lại axit), Lurker (lặn dưới bùn, trồi lên cắn).
   Boss: Toad King — nhảy đè (vòng đỏ chỗ rơi), phóng lưỡi kéo người chơi, khạc axit.
   Thử thách: phá 4 túi bào tử (→ Rail Lancer), giữ trạm lọc nước (→ Băng Đạn Mở Rộng), 15 hạ gục không trúng đòn (→ Lõi Xuyên Phá). */
'use strict';
(function (MB) {
  const U = MB.U, Ens = MB.Enemies, GK = MB.GK;
  const WW = 3200, WH = 2200;

  /* ---------- props ---------- */
  MB.Props.register('pod', (ctx, o, t) => {
    const { x, y, r } = o, pul = 1 + Math.sin(t * 3 + x) * 0.06;
    MB.Props.shadow(ctx, x + 5, y + 10, r, r * 0.6, 0.3);
    ctx.save(); ctx.translate(x, y); ctx.scale(pul, pul);
    ctx.fillStyle = '#3d4a24'; ctx.fillRect(-3, 0, 6, r * 0.6);
    ctx.fillStyle = o.flash > 0 ? '#ffffff' : '#9aa83a'; U.ellipse(ctx, 0, -r * 0.2, r * 0.85, r); ctx.fill();
    ctx.strokeStyle = 'rgba(220,255,120,.6)'; ctx.lineWidth = 2;
    for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(i * r * 0.3, r * 0.6); ctx.quadraticCurveTo(i * r * 0.6, -r * 0.2, i * r * 0.2, -r); ctx.stroke(); }
    ctx.fillStyle = `rgba(230,255,140,${0.6 + Math.sin(t * 4 + x) * 0.3})`; U.circle(ctx, 0, -r * 0.3, r * 0.3); ctx.fill();
    ctx.restore();
  });

  /* ---------- Bloater ---------- */
  Ens.register('bloater', Ens.make({
    name: 'Bloater', r: 20, hp: 70, speed: 52, dmg: 22, score: 180, knockMul: 0.5, blood: '#5a6a1a', gore: '#d8ff7a',
    draw(ctx, e, G) {
      const sw = e.swell || 0, s = 1 + sw * 0.35 + Math.sin(G.time * (6 + sw * 20) + e.t) * 0.04;
      ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.face || 0); ctx.scale(s, s);
      ctx.fillStyle = '#4e5a2a'; U.circle(ctx, -4, -14, 5); ctx.fill(); U.circle(ctx, -4, 14, 5); ctx.fill();
      ctx.fillStyle = sw > 0 && Math.floor(G.time * 14) % 2 ? '#d86a4a' : '#8a9a4a'; U.circle(ctx, 0, 0, 18); ctx.fill();
      ctx.fillStyle = '#a4b45a'; U.circle(ctx, -4, -4, 10); ctx.fill();
      ctx.fillStyle = 'rgba(210,255,110,.85)';
      [[8, -8, 3], [-9, 7, 3.5], [3, 10, 2.5], [-10, -9, 2.5], [10, 6, 2]].forEach(([x, y, r]) => { U.circle(ctx, x, y, r); ctx.fill(); });
      ctx.fillStyle = '#2a0a0a'; U.circle(ctx, 13, 0, 3); ctx.fill();
      ctx.fillStyle = '#ffe060'; U.circle(ctx, 12, -5, 1.6); ctx.fill(); U.circle(ctx, 12, 5, 1.6); ctx.fill();
      ctx.restore();
    },
  }, Ens.AI.exploder({ trigger: 75, fuse: 0.75, r: 110, dmg: 22, dmgEnemies: 60, deathBlast: true, color: '#c8ff5a', ring: '190,255,90', decal: 'rgba(90,120,20,.7)', pool: { kind: 'acid', r: 60, life: 6, dps: 9 } })));

  /* ---------- Lurker ---------- */
  Ens.register('lurker', Ens.make({
    name: 'Lurker', r: 18, hp: 95, speed: 92, dmg: 14, score: 240, blood: '#2c3a22', gore: '#9ac07a',
    draw(ctx, e, G) {
      ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.face || 0);
      const sw = Math.sin(G.time * 8 + e.t) * 0.3;
      ctx.fillStyle = '#2f4a2a';
      ctx.beginPath(); ctx.moveTo(-14, -4); ctx.quadraticCurveTo(-30, sw * 10, -38, sw * 18); ctx.quadraticCurveTo(-30, 4 + sw * 10, -14, 5); ctx.fill();
      ctx.fillStyle = '#3a5a32'; U.ellipse(ctx, -2, 0, 17, 10); ctx.fill();
      ctx.fillStyle = '#26381f'; for (let i = -12; i < 8; i += 5) { ctx.beginPath(); ctx.moveTo(i, -3); ctx.lineTo(i + 2.5, -8); ctx.lineTo(i + 5, -3); ctx.fill(); }
      ctx.fillStyle = '#44663a'; U.ellipse(ctx, 18, 0, 9, 6); ctx.fill();
      ctx.fillStyle = '#f2e8c8'; for (let i = 0; i < 4; i++) { ctx.fillRect(14 + i * 3, -5, 1.5, 2); ctx.fillRect(14 + i * 3, 3, 1.5, 2); }
      ctx.fillStyle = '#ffd040'; U.circle(ctx, 14, -4, 1.8); ctx.fill(); U.circle(ctx, 14, 4, 1.8); ctx.fill();
      ctx.strokeStyle = '#2f4a2a'; ctx.lineWidth = 3.5;
      ctx.beginPath(); ctx.moveTo(6, -8); ctx.lineTo(10 + sw * 8, -15); ctx.moveTo(6, 8); ctx.lineTo(10 - sw * 8, 15); ctx.moveTo(-8, -8); ctx.lineTo(-12 - sw * 8, -15); ctx.moveTo(-8, 8); ctx.lineTo(-12 + sw * 8, 15); ctx.stroke();
      ctx.restore();
    },
  }, Ens.AI.burrower({ up: 2.4, emerge: 95, underMul: 1.6, dirt: '#4a3a22', ripple: '150,190,120' })));

  /* ---------- Boss: Toad King ---------- */
  Ens.register('toadKing', {
    name: 'Toad King', r: 70, hp: 6500, speed: 58, dmg: 24, score: 0, boss: true, knockMul: 0, blood: '#3b4a22', gore: '#c8e07a',
    init(e) { e.phase = 1; e.state = 'walk'; e.leapT = 3; e.tongueT = 2.5; e.spitT = 4; e.sumT = 7; e.gasT = 5; e.air = 0; },
    armorFn(e, dmg) { return e.state === 'air' ? dmg * 0.2 : e.state === 'recover' ? dmg * 1.4 : dmg; },
    update(e, G, dt) {
      const p = G.player, d = Ens.distPlayer(e, G), k = e.hp / e.maxHp;
      const ph = k > 0.6 ? 1 : k > 0.25 ? 2 : 3;
      if (ph > e.phase) { e.phase = ph; G.banner(`PHASE ${ph}`, ph === 2 ? 'Toad King gọi Bloater và nhảy liên tục' : 'Toad King nổi điên: khí độc phun quanh nó', 2); MB.Audio.play('roar'); G.shake(12); }
      if (e.state === 'walk') {
        Ens.steer(e, G, p.x, p.y, e.speed * (ph === 3 ? 1.3 : 1), dt);
        e.leapT -= dt; e.tongueT -= dt; e.spitT -= dt; e.sumT -= dt; e.gasT -= dt;
        if (e.leapT <= 0) {
          e.state = 'crouch'; e.st = 0.45;
          e.tx = U.clamp(p.x + p.vx * 0.4, 120, G.world.w - 120); e.ty = U.clamp(p.y + p.vy * 0.4, 120, G.world.h - 120);
          G.telegraphCircle(e.tx, e.ty, 140, 1.35);
        } else if (e.tongueT <= 0 && d < 520 && G.los(e.x, e.y, p.x, p.y)) { e.state = 'tongueAim'; e.st = 0.6; e.lock = Ens.toPlayer(e, G); }
        else if (e.spitT <= 0) {
          e.spitT = ph === 1 ? 4 : 3;
          for (let i = 0; i < 3; i++) {
            const tx = p.x + U.rnd(-110, 110), ty = p.y + U.rnd(-110, 110), dd = U.dist(tx, ty, e.x, e.y), a = Math.atan2(ty - e.y, tx - e.x);
            G.enemyShot({ x: e.x, y: e.y, a, speed: dd / 0.9, r: 10, dmg: 8, life: 0.9, kind: 'spit', pass: true, owner: e,
              onEnd: (GG, b) => { GG.addHazard({ kind: 'acid', x: b.x, y: b.y, r: 62, life: 6, dps: 9 }); GG.burst(b.x, b.y, '#c8ff5a', 10, 120); } });
          }
          MB.Audio.play('spit');
        }
        if (ph >= 2 && e.sumT <= 0) {
          e.sumT = 8;
          for (let i = 0; i < 2 && G.extraAlive() < 7; i++) { const a = U.rnd(0, U.TAU); G.spawnEnemyAt('bloater', e.x + Math.cos(a) * 100, e.y + Math.sin(a) * 100, { extra: true }); }
        }
        if (ph === 3 && e.gasT <= 0) {
          e.gasT = 5;
          for (let i = 0; i < 4; i++) {
            const a = i / 4 * U.TAU + U.rnd(-0.3, 0.3), x = e.x + Math.cos(a) * 170, y = e.y + Math.sin(a) * 170;
            G.telegraphCircle(x, y, 85, 1.0, (GG) => GG.addHazard({ kind: 'gas', x, y, r: 85, life: 3.5, dps: 11 }), 'rgba(190,255,90,.14)');
          }
        }
      } else if (e.state === 'crouch') {
        Ens.stop(e, dt, 14); e.st -= dt;
        if (e.st <= 0) { e.state = 'air'; e.st = 0.9; e.fx0 = e.x; e.fy0 = e.y; e.airborne = true; MB.Audio.play('dash'); }
      } else if (e.state === 'air') {
        e.st -= dt; const kk = U.clamp(1 - e.st / 0.9, 0, 1);
        e.vx = 0; e.vy = 0; e.x = U.lerp(e.fx0, e.tx, kk); e.y = U.lerp(e.fy0, e.ty, kk); e.air = Math.sin(kk * Math.PI);
        e.face = Math.atan2(e.ty - e.fy0, e.tx - e.fx0);
        if (e.st <= 0) {
          e.air = 0; e.airborne = false; e.state = 'recover'; e.st = 0.9;
          G.shockwave(e.x, e.y, 380, 1.0, 16);
          if (U.dist(p.x, p.y, e.x, e.y) < 140 + p.r) G.hurtPlayer(26, e);
          G.addHazard({ kind: 'mud', x: e.x, y: e.y, r: 120, life: 8, slowMul: 0.5 });
          G.burst(e.x, e.y, '#5a4a2a', 30, 260);
        }
      } else if (e.state === 'recover') {
        Ens.stop(e, dt, 12); e.st -= dt;
        if (e.st <= 0) { e.state = 'walk'; e.leapT = e.phase === 1 ? 6 : e.phase === 2 ? 4.5 : 3.2; }
      } else if (e.state === 'tongueAim') {
        Ens.stop(e, dt, 12); e.st -= dt;
        e.lock += U.angDiff(e.lock, Ens.toPlayer(e, G)) * Math.min(1, dt * 2.5); e.face = e.lock;
        if (e.st <= 0) {
          e.state = 'walk'; e.tongueT = U.rnd(3.5, 5);
          G.enemyShot({ x: e.x, y: e.y, a: e.lock, speed: 780, r: 10, dmg: 14, life: 0.7, kind: 'tongue', owner: e,
            onHit: (GG) => { const pl = GG.player, a = Math.atan2(e.y - pl.y, e.x - pl.x); pl.vx = Math.cos(a) * 620; pl.vy = Math.sin(a) * 620; GG.text(pl.x, pl.y - 30, 'BỊ KÉO!', '#ff8a7a', 15); } });
          MB.Audio.play('lash');
        }
      }
    },
    tele(ctx, e, G) { if (e.state === 'tongueAim') G.drawTelegraphLine(ctx, e.x, e.y, e.lock, 540, 1 - e.st / 0.6); },
    draw(ctx, e, G) {
      const t = G.time, lift = (e.air || 0) * 60;
      ctx.fillStyle = 'rgba(0,0,0,.3)'; U.ellipse(ctx, e.x, e.y + 20, 70 * (1 - (e.air || 0) * 0.3), 40 * (1 - (e.air || 0) * 0.3)); ctx.fill();
      ctx.save(); ctx.translate(e.x, e.y - lift); ctx.rotate(e.face || 0);
      const s = 1 + (e.air || 0) * 0.2 - (e.state === 'crouch' ? 0.08 : 0); ctx.scale(s, s);
      ctx.fillStyle = '#4a5a2a';
      for (const sd of [-1, 1]) { U.ellipse(ctx, -30, sd * 50, 26, 14, sd * 0.4); ctx.fill(); U.ellipse(ctx, 34, sd * 46, 12, 9); ctx.fill(); }
      ctx.fillStyle = e.phase === 3 ? '#6a5a2a' : '#5e6e34'; U.ellipse(ctx, 0, 0, 64, 54); ctx.fill();
      ctx.fillStyle = '#8a9a5a'; U.ellipse(ctx, 10, 0, 40, 34); ctx.fill();
      ctx.fillStyle = `rgba(210,255,110,${0.6 + Math.sin(t * 3) * 0.3})`;
      [[-30, -24, 6], [-18, 30, 5], [-40, 10, 4], [0, -38, 4], [-8, 40, 3.5]].forEach(([x, y, r]) => { U.circle(ctx, x, y, r); ctx.fill(); });
      ctx.fillStyle = '#e8d8a0'; for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(-6, i * 12 - 4); ctx.lineTo(-18, i * 12); ctx.lineTo(-6, i * 12 + 4); ctx.fill(); }
      for (const sd of [-1, 1]) { ctx.fillStyle = '#6e7e3e'; U.circle(ctx, 40, sd * 22, 13); ctx.fill(); ctx.fillStyle = '#ffd040'; U.circle(ctx, 44, sd * 22, 7); ctx.fill(); ctx.fillStyle = '#1a1a0a'; ctx.fillRect(42, sd * 22 - 1.5, 6, 3); }
      ctx.strokeStyle = '#2a1a0a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(30, 0, 30, -0.9, 0.9); ctx.stroke();
      ctx.restore();
    },
  });

  /* ---------- bản đồ ---------- */
  const rng = U.seeded(303);
  const obstacles = [];
  const MG = (L, x, y, r) => L.push({ kind: 'tree', shape: 'circle', x, y, r: r || 50 + rng() * 18, c1: '#28402f', c2: '#365a40', c3: '#4f7454', infected: rng() < 0.25 });
  const ST = (L, x, y) => L.push({ kind: 'rock', shape: 'circle', x, y, r: 30 + rng() * 14, c1: '#4a3a28', c2: '#5e4c36' });
  GK.border(obstacles, rng, WW, WH, (L, x, y) => MG(L, x, y, 55 + rng() * 18), 1100);
  const keep = [{ x: 240, y: 1100, r: 320 }, { x: 2850, y: 1100, r: 300 }, { x: 1600, y: 1100, r: 200 },
    { x: 600, y: 450, r: 120 }, { x: 1500, y: 1850, r: 120 }, { x: 2300, y: 400, r: 120 }, { x: 2900, y: 1750, r: 120 }];
  GK.scatter(obstacles, rng, 16, [250, 250, WW - 250, WH - 250], keep, (L, x, y) => MG(L, x, y));
  GK.scatter(obstacles, rng, 10, [250, 250, WW - 250, WH - 250], keep, (L, x, y) => ST(L, x, y));
  [[900, 900, 170, 0.3], [1250, 1450, 160, -0.2], [2050, 800, 180, 0.15], [2450, 1350, 160, -0.35], [1850, 1500, 150, 0.5]].forEach(([x, y, w, rot]) => obstacles.push({ kind: 'log', shape: 'box', x, y, w, h: 34, rot }));

  const hazards = [];
  [[700, 1300, 130], [1150, 650, 150], [1700, 600, 120], [1350, 1250, 110], [2100, 1250, 150], [2600, 700, 130], [2550, 1650, 120], [900, 1750, 120], [2050, 1900, 110]]
    .forEach(([x, y, r]) => hazards.push({ kind: 'mud', x, y, r, slowMul: 0.55 }));
  [[1000, 400, 70], [1950, 1650, 75], [2700, 1100, 0], [500, 800, 65]].forEach(([x, y, r]) => { if (r) hazards.push({ kind: 'acid', x, y, r, dps: 9 }); });

  MB.registerGate({
    id: 3, seed: 303, view3d: true,
    title: 'GATE 03 — SWAMP', subtitle: 'Đầm Lầy Đột Biến',
    world: { w: WW, h: WH }, bg: '#0b130e', mmColor: 'rgba(90,140,100,.6)',
    scale: { hp: 1.1, dmg: 1.05 },
    start: { x: 240, y: 1100 },
    obstacles, hazards,
    crates: [{ x: 650, y: 1050 }, { x: 1250, y: 300 }, { x: 1150, y: 1900 }, { x: 1950, y: 1050 }, { x: 2350, y: 1850 }, { x: 2800, y: 450 }, { x: 420, y: 1850, rot: 0.3 }, { x: 2950, y: 1350 }],
    spawnPoints: [
      { x: 350, y: 300 }, { x: 1300, y: 230 }, { x: 2300, y: 240 }, { x: 3000, y: 300 }, { x: 3000, y: 1100 }, { x: 3000, y: 1900 },
      { x: 2250, y: 2000 }, { x: 1250, y: 2000 }, { x: 350, y: 1950 }, { x: 1100, y: 1100 }, { x: 2200, y: 1100 }, { x: 800, y: 600 },
    ],
    waves: [
      { total: 14, maxAlive: 8, mix: { zombie: 6, bloater: 3, spider: 2 }, interval: [0.8, 1.3], elite: 0.06 },
      { total: 18, maxAlive: 9, mix: { zombie: 4, bloater: 3, lurker: 3, licker: 1 }, interval: [0.7, 1.2], elite: 0.1 },
      { total: 22, maxAlive: 11, mix: { zombie: 4, bloater: 3, lurker: 3, licker: 2, spider: 2 }, interval: [0.55, 1.0], elite: 0.13 },
    ],
    boss: { type: 'toadKing', x: 2850, y: 1100 },
    intro: { title: 'NHIỆM VỤ', text: 'Lội qua đầm lầy. Bùn làm chậm, khí độc phun lên quanh bạn: thấy vòng đỏ là tránh.' },
    objectives: [
      { title: 'MARSHLAND', text: 'Bloater lao tới và tự nổ: bắn từ xa hoặc lộn né khi nó phồng lên.' },
      { title: 'DEEP MUD', text: 'Lurker lặn dưới bùn (gợn sóng). Nó trồi lên ở vòng đỏ, tránh ra rồi bắn.' },
      { title: 'ROTTEN HEART', text: 'Wave cuối trước Boss.' },
      { title: 'BOSS · TOAD KING', text: 'Ra khỏi vòng đỏ chỗ nó nhảy xuống. Bắn mạnh khi nó vừa tiếp đất (nhận thêm 40% sát thương).' },
    ],
    challenges: [
      { id: 'pods', type: 'destroy', name: 'Túi Bào Tử', desc: 'Phá 4 túi bào tử', kind: 'pod', r: 30, hp: 200,
        spawner: { type: 'bloater', every: 9, range: 700, cap: 4 },
        targets: [{ x: 600, y: 450 }, { x: 1500, y: 1850 }, { x: 2300, y: 400 }, { x: 2900, y: 1750 }], reward: { weapon: 'sniper' } },
      { id: 'filter', type: 'hold', name: 'Trạm Lọc Nước', desc: 'Đứng trong vùng xanh 14 giây', zone: { x: 1600, y: 1100, r: 115 }, time: 14,
        mix: { zombie: 2, bloater: 1, lurker: 1 }, spawnEvery: 2.3, reward: { mod: 'mag' } },
      { id: 'streak', type: 'streak', name: 'Lội Bùn Không Tì Vết', desc: '15 hạ gục liên tiếp không trúng đòn', count: 15, reward: { mod: 'pierce' } },
    ],

    // mạch khí độc phun lên gần người chơi
    setup(G) { G.gs.geyserT = 8; },
    update(G, dt) {
      const p = G.player;
      if (G.state === 'intro' || G.state === 'won' || G.over || p.dead) return;
      G.gs.geyserT -= dt;
      if (G.gs.geyserT <= 0) {
        G.gs.geyserT = U.rnd(5.5, 8);
        const n = G.state === 'boss' ? 2 : U.ri(2, 3);
        for (let i = 0; i < n; i++) {
          const a = U.rnd(0, U.TAU), dd = U.rnd(40, 240), x = p.x + Math.cos(a) * dd, y = p.y + Math.sin(a) * dd;
          G.telegraphCircle(x, y, 80, 1.1, (GG) => { GG.addHazard({ kind: 'gas', x, y, r: 80, life: 3.2, dps: 11 }); GG.burst(x, y, '#c8e07a', 14, 160); MB.Audio.play('spit'); }, 'rgba(190,255,90,.14)');
        }
      }
    },

    buildGround(g, w, h, rand) {
      g.fillStyle = '#1b2a1e'; g.fillRect(0, 0, w, h);
      GK.patches(g, rand, w, h, 280, ['rgba(40,60,40,.45)', 'rgba(14,24,16,.45)', 'rgba(50,58,34,.35)'], 40, 130);
      // nước đọng
      for (let i = 0; i < 40; i++) { const x = rand() * w, y = rand() * h, r = 30 + rand() * 70; g.fillStyle = 'rgba(30,70,70,.45)'; g.beginPath(); g.ellipse(x, y, r, r * 0.6, rand() * 3, 0, Math.PI * 2); g.fill(); }
      // lá sen
      for (let i = 0; i < 160; i++) { const x = rand() * w, y = rand() * h, r = 6 + rand() * 8, a = rand() * 6; g.fillStyle = rand() < 0.5 ? 'rgba(80,130,70,.8)' : 'rgba(60,110,60,.8)'; g.beginPath(); g.arc(x, y, r, a, a + Math.PI * 1.75); g.lineTo(x, y); g.fill(); }
      // cầu ván
      const pts = [[100, 1100], [600, 1000], [1100, 1180], [1600, 1100], [2100, 1000], [2600, 1180], [3100, 1100]];
      GK.path(g, pts, 70, 'rgba(92,70,44,.85)');
      GK.path(g, pts, 56, 'rgba(120,92,58,.8)');
      g.strokeStyle = 'rgba(50,36,20,.6)'; g.lineWidth = 2;
      for (let i = 0; i < pts.length - 1; i++) {
        const [x1, y1] = pts[i], [x2, y2] = pts[i + 1], L = Math.hypot(x2 - x1, y2 - y1), nx = -(y2 - y1) / L, ny = (x2 - x1) / L;
        for (let d = 0; d < L; d += 18) { const x = x1 + (x2 - x1) * d / L, y = y1 + (y2 - y1) * d / L; g.beginPath(); g.moveTo(x - nx * 26, y - ny * 26); g.lineTo(x + nx * 26, y + ny * 26); g.stroke(); }
      }
      GK.strokes(g, rand, w, h, 1500, ['rgba(110,140,70,.5)', 'rgba(70,100,50,.5)', 'rgba(140,130,70,.4)'], 12, 1.6);
      GK.vignette(g, w, h, 0.55);
    },

    /* ---------- 3D ---------- */
    models3d: {
      bloater: (K) => ({ build: () => K.buildBlob({ color: 0x7d8f4a, glow: 0xc8ff5a, seed: 3 }), anim: K.animBlob, base: 20 }),
      lurker: (K) => ({
        base: 18,
        build() {
          const T = K.T, g = new T.Group(), skin = K.skinMat(0x3a5a32, { rough: 0.55 }), dark = K.std(0x26381f);
          const body = K.mesh(K.bumpy('lurkb', new T.CapsuleGeometry(7, 20, 6, 14), 0.5, 1.2), skin, 0, 8, 0); body.rotation.z = Math.PI / 2; body.scale.set(0.75, 1, 1.15); g.add(body);
          for (let i = -10; i <= 8; i += 4) { const c = K.mesh(K.G3('lspk', () => new T.ConeGeometry(1.6, 5, 5)), dark, i, 14, 0); g.add(c); }
          const head = new T.Group(); head.position.set(16, 8, 0); g.add(head);
          const up = K.mesh(K.box(16, 4, 9), skin, 6, 1.5, 0); head.add(up);
          const jaw = new T.Group(); head.add(jaw); jaw.add(K.mesh(K.box(15, 3, 8), dark, 6, -2, 0));
          const tooth = K.std(0xf2e8c8);
          for (let i = 0; i < 5; i++) for (const z of [-3.6, 3.6]) jaw.add(K.mesh(K.G3('lt', () => new T.ConeGeometry(0.6, 2.2, 4)), tooth, 2 + i * 2.6, 0, z));
          for (const z of [-3.2, 3.2]) head.add(K.mesh(K.sph(1.6, 8), K.glowMat(0xffd040, 2), 2, 4.5, z));
          const tail = []; let par = g, px = -14;
          for (let i = 0; i < 3; i++) { const piv = new T.Group(); piv.position.set(px, 8, 0); par.add(piv); const sg = K.mesh(K.cap(4.5 - i * 1.2, 6), skin, -5, 0, 0); sg.rotation.z = Math.PI / 2; piv.add(sg); tail.push(piv); par = piv; px = -9; }
          const legs = [];
          for (const [x, z] of [[8, -7], [8, 7], [-8, -7], [-8, 7]]) { const l = K.joint(g, x, 6, z, 2.2, 1.8, 7, skin); l.rotation.x = z > 0 ? -0.6 : 0.6; legs.push(l); }
          g.userData = { jaw, tail, legs, h: 18 };
          return g;
        },
        anim(e, m, G) {
          const d = m.userData, t = G.time;
          d.tail.forEach((s, i) => { s.rotation.y = Math.sin(t * 6 + e.t + i) * 0.35; });
          d.legs.forEach((l, i) => { l.rotation.z = Math.sin(t * 10 + e.t + i * Math.PI / 2) * 0.5; });
          d.jaw.rotation.z = e.state === 'rise' || (e.state === 'up' && Math.sin(t * 8) > 0.6) ? -0.5 : -0.08;
        },
      }),
      toadKing: (K) => ({
        base: 70,
        build() {
          const T = K.T, g = new T.Group(), core = new T.Group(); g.add(core);
          const skin = K.skinMat(0x5e6e34, { rough: 0.55 }), belly = K.std(0x9aa66a), dark = K.std(0x3e4a22);
          const body = K.mesh(K.bumpy('toadb', new T.SphereGeometry(42, 30, 22), 1.6, 0.25), skin, 0, 34, 0); body.scale.set(1.25, 0.72, 1.15); core.add(body);
          const bel = K.mesh(K.sph(30, 20), belly, 18, 26, 0); bel.scale.set(0.9, 0.6, 1.1); core.add(bel);
          const sac = K.mesh(K.sph(16, 16), K.std(0xd8d0a0, { own: true, rough: 0.4 }), 40, 18, 0); core.add(sac);
          for (const z of [-24, 24]) {
            const ey = K.mesh(K.sph(11, 16), skin, 38, 58, z); core.add(ey);
            core.add(K.mesh(K.sph(7, 14), K.glowMat(0xffd040, 1.4), 45, 60, z));
            core.add(K.mesh(K.box(2, 9, 2.5), K.std(0x111108), 51, 60, z));
          }
          core.add(K.mesh(K.box(4, 3, 54), K.std(0x2a1a0a), 52, 36, 0));
          const wm = K.glowMat(0xc8ff5a, 1.1);
          for (let i = 0; i < 10; i++) { const a = i * 0.7, b = 0.2 + (i % 3) * 0.25; core.add(K.mesh(K.sph(3 + (i % 3), 8), wm, -10 + Math.cos(a) * 34 * Math.cos(b), 34 + Math.sin(b) * 26, Math.sin(a) * 40 * Math.cos(b))); }
          const bone = K.std(0xe8d8a0);
          for (let i = -2; i <= 2; i++) { const c = K.mesh(K.G3('crown', () => new T.ConeGeometry(3, 14, 5)), bone, 8 - Math.abs(i) * 3, 64, i * 9); c.rotation.x = i * 0.15; core.add(c); }
          const legs = [];
          for (const z of [-1, 1]) {
            const th = K.mesh(K.sph(18, 14), skin, -28, 22, z * 46); th.scale.set(1.4, 0.8, 0.9); core.add(th);
            const ft = K.mesh(K.box(30, 5, 16), dark, -8, 3, z * 56); core.add(ft); legs.push(ft);
            const fl = K.joint(core, 30, 28, z * 34, 6, 4.5, 26, skin); fl.rotation.x = z * 0.35; legs.push(fl);
          }
          g.userData = { core, sac, h: 80 };
          return g;
        },
        anim(e, m, G) {
          const d = m.userData, t = G.time;
          d.core.position.y = (e.air || 0) * 120;
          const s = 1 + Math.sin(t * 3) * 0.08 + (e.state === 'tongueAim' ? 0.25 : 0);
          d.sac.scale.set(s, s, s);
          d.core.scale.y = e.state === 'crouch' ? 0.85 : 1;
          if (e.phase === 3 && !d.p3) { d.p3 = true; K.ownMats(m)[0].color.setHex(0x6a5a2a); }
        },
      }),
    },
    props3d: {
      pod: (o, K) => {
        const T = K.T, g = new T.Group();
        g.add(K.mesh(K.cyl(3, 4, 20, 8), K.std(0x3d4a24), 0, 10, 0));
        const mt = K.std(0x9aa83a, { own: true, emissive: 0x6a8a20, ei: 0.35, rough: 0.35 });
        const b = K.mesh(K.bumpy('pod', new T.SphereGeometry(o.r * 0.9, 20, 16), 2, 0.3), mt, 0, 20 + o.r * 0.8, 0); b.scale.y = 1.25; g.add(b);
        const gl = K.glowSprite(0xd8ff7a, o.r * 2.6, 0.5); gl.position.y = 20 + o.r * 0.8; g.add(gl);
        g.userData.flashMat = mt; g.userData.core = b;
        return g;
      },
    },
  });
})(window.MB);
