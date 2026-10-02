/* Gate 09 — Laboratory: Phòng Thí Nghiệm
   Cơ chế: tia laser an ninh quay vòng, bệ dịch chuyển (giẫm lên để thoát vây), súng máy canh gác, khí độc rò rỉ theo đợt.
   Quái mới: Clone Soldier (bắn loạt 3 viên, chạy vòng), Phase Stalker (tàng hình, dịch chuyển ra sau lưng chém), Sentry (tháp súng cố định).
   Boss: Specimen Omega — dịch chuyển, tạo bản sao, lưới laser cả phòng, hút người chơi rồi nổ xung kích.
   Thử thách: phá 4 máy chủ (→ Nòng Tăng Lực), giữ phòng điều khiển (→ Bộ Chia Tia), 22 hạ gục (→ Băng Đạn Mở Rộng). */
'use strict';
(function (MB) {
  const U = MB.U, Ens = MB.Enemies, GK = MB.GK;
  const WW = 3400, WH = 2300;
  const PADS = [[{ x: 450, y: 450 }, { x: 2950, y: 1850 }], [{ x: 450, y: 1850 }, { x: 2950, y: 450 }]];
  const SPIN = [{ x: 1150, y: 600, L: 240, w: 0.9 }, { x: 1150, y: 1700, L: 240, w: -0.9 }, { x: 2250, y: 1150, L: 280, w: 0.7 }];

  /* ---------- props ---------- */
  MB.Props.register('labwall', (ctx, o) => {
    ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(o.rot || 0);
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(-o.hw + 5, -o.hh + 8, o.w, o.h);
    ctx.fillStyle = '#c8d4dc'; ctx.fillRect(-o.hw, -o.hh, o.w, o.h);
    ctx.fillStyle = '#9fb0bc'; ctx.fillRect(-o.hw, o.hh - 6, o.w, 6);
    ctx.fillStyle = '#4fd6ff'; if (o.w > o.h) ctx.fillRect(-o.hw, -1.5, o.w, 3); else ctx.fillRect(-1.5, -o.hh, 3, o.h);
    ctx.restore();
  });
  MB.Props.register('specimen', (ctx, o, t) => {
    const { x, y, r } = o;
    MB.Props.shadow(ctx, x + 5, y + 9, r, r * 0.6, 0.25);
    ctx.fillStyle = '#5a6a74'; U.circle(ctx, x, y, r); ctx.fill();
    ctx.fillStyle = 'rgba(120,230,200,.45)'; U.circle(ctx, x, y, r * 0.85); ctx.fill();
    ctx.fillStyle = 'rgba(60,40,60,.8)'; U.ellipse(ctx, x, y + Math.sin(t + x) * 2, r * 0.35, r * 0.5); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.35)'; U.ellipse(ctx, x - r * 0.35, y - r * 0.3, r * 0.15, r * 0.35); ctx.fill();
  });
  MB.Props.register('desk', (ctx, o) => {
    ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(o.rot || 0);
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(-o.hw + 4, -o.hh + 6, o.w, o.h);
    ctx.fillStyle = '#e8eef2'; ctx.fillRect(-o.hw, -o.hh, o.w, o.h);
    ctx.fillStyle = '#2a3a44'; ctx.fillRect(-o.hw + 8, -o.hh + 6, 26, 16); ctx.fillStyle = '#4fd6ff'; ctx.fillRect(-o.hw + 10, -o.hh + 8, 22, 12);
    ctx.restore();
  });
  MB.Props.register('server', (ctx, o, t) => {
    ctx.save(); ctx.translate(o.x, o.y);
    ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(-o.r + 5, -o.r * 1.3 + 8, o.r * 2, o.r * 2.6);
    ctx.fillStyle = o.flash > 0 ? '#ffffff' : '#1e2a32'; ctx.fillRect(-o.r, -o.r * 1.3, o.r * 2, o.r * 2.6);
    for (let i = 0; i < 6; i++) { ctx.fillStyle = Math.floor(t * 6 + i * 1.7 + o.x) % 3 ? '#2a4a3a' : '#7dff9b'; ctx.fillRect(-o.r + 6, -o.r * 1.1 + i * 9, o.r * 2 - 12, 4); }
    ctx.restore();
  });
  MB.Props.registerActor('spin', (ctx, a, G) => {
    const x2 = a.x + Math.cos(a.rot) * a.L, y2 = a.y + Math.sin(a.rot) * a.L, x3 = a.x - Math.cos(a.rot) * a.L, y3 = a.y - Math.sin(a.rot) * a.L;
    ctx.strokeStyle = 'rgba(255,60,90,.35)'; ctx.lineWidth = 14; ctx.beginPath(); ctx.moveTo(x3, y3); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.strokeStyle = '#ffd0dc'; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = '#3a4a54'; U.circle(ctx, a.x, a.y, 18); ctx.fill(); ctx.fillStyle = '#ff5b7a'; U.circle(ctx, a.x, a.y, 7); ctx.fill();
  });

  /* ---------- Clone Soldier ---------- */
  Ens.register('clone', Ens.make({
    name: 'Clone Soldier', r: 18, hp: 90, speed: 95, dmg: 10, score: 240, blood: '#5a2a2a', gore: '#ffb0a0',
    draw(ctx, e, G) {
      ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.face || 0);
      const sw = Math.sin(G.time * 8 + e.t) * 4;
      ctx.fillStyle = '#c8d0d8'; U.rr(ctx, -6 + sw, -10, 12, 7, 3); ctx.fill(); U.rr(ctx, -6 - sw, 3, 12, 7, 3); ctx.fill();
      ctx.fillStyle = '#e8eef4'; U.rr(ctx, -12, -13, 22, 26, 9); ctx.fill();
      ctx.fillStyle = '#4fd6ff'; ctx.fillRect(-2, -12, 3, 24);
      ctx.fillStyle = '#2a3236'; ctx.fillRect(8, -2, 22, 5);
      ctx.fillStyle = '#d0dae2'; U.circle(ctx, 0, 0, 8); ctx.fill();
      ctx.fillStyle = e.state === 'aim' ? '#ff5b5b' : '#2a4a5a'; U.ellipse(ctx, 4, 0, 3.5, 6); ctx.fill();
      ctx.restore();
    },
  }, Ens.AI.shooter({
    min: 200, max: 400, cd: [1.6, 2.4], aim: 0.55, lineLen: 380,
    shot(e, G, a) { for (let i = 0; i < 3; i++) setTimeout(() => { if (!e.dead && G.running) G.enemyShot({ x: e.x, y: e.y, a: a + U.rnd(-0.05, 0.05), speed: 620, r: 5, dmg: 8, life: 0.9, kind: 'orb', color: '#ffe39b', owner: e }); }, i * 90); MB.Audio.play('shot_smg'); },
  })));

  /* ---------- Phase Stalker ---------- */
  Ens.register('stalker', Ens.make({
    name: 'Phase Stalker', r: 17, hp: 75, speed: 110, dmg: 16, score: 280, blood: '#2a1a3a', gore: '#b98cff',
    draw(ctx, e, G) {
      ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.face || 0);
      const sw = Math.sin(G.time * 10 + e.t) * 5;
      ctx.strokeStyle = '#3a2a5a'; ctx.lineWidth = 4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-4, -8); ctx.lineTo(-14 + sw, -18); ctx.moveTo(-4, 8); ctx.lineTo(-14 - sw, 18); ctx.moveTo(6, -8); ctx.lineTo(20, -14); ctx.moveTo(6, 8); ctx.lineTo(20, 14); ctx.stroke();
      ctx.fillStyle = '#4a3a6a'; U.ellipse(ctx, 0, 0, 15, 10); ctx.fill();
      ctx.fillStyle = '#b98cff'; U.circle(ctx, 12, 0, 5); ctx.fill();
      ctx.strokeStyle = '#e8d8ff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(20, -14); ctx.lineTo(28, -12); ctx.moveTo(20, 14); ctx.lineTo(28, 12); ctx.stroke();
      ctx.restore();
    },
  }, Ens.AI.blinker({ color: '#b98cff', ghost: 0.4 })));

  /* ---------- Sentry (tháp súng) ---------- */
  Ens.register('sentry', {
    name: 'Sentry', r: 22, hp: 260, speed: 0, dmg: 9, score: 300, knockMul: 0, noContact: true, blood: '#2a3236', gore: '#ffd56a',
    init(e) { e.cd = U.rnd(1, 2); e.face = 0; },
    update(e, G, dt) {
      const p = G.player, d = Ens.distPlayer(e, G);
      e.vx = 0; e.vy = 0; e.cd -= dt;
      if (d < 480 && G.los(e.x, e.y, p.x, p.y)) {
        e.face += U.angDiff(e.face, Ens.toPlayer(e, G)) * Math.min(1, dt * 3);
        if (e.cd <= 0) { e.cd = 1.4; for (let i = 0; i < 2; i++) setTimeout(() => { if (!e.dead && G.running) G.enemyShot({ x: e.x, y: e.y, a: e.face, speed: 560, r: 5, dmg: 9, life: 1, kind: 'orb', color: '#ff8a5c', owner: e }); }, i * 120); }
      } else e.face += dt * 0.8;
    },
    draw(ctx, e) {
      ctx.fillStyle = 'rgba(0,0,0,.3)'; U.ellipse(ctx, e.x + 3, e.y + 8, 22, 12); ctx.fill();
      ctx.fillStyle = '#3a4a54'; U.circle(ctx, e.x, e.y, 20); ctx.fill();
      ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.face);
      ctx.fillStyle = '#5e6e78'; U.rr(ctx, -12, -11, 24, 22, 6); ctx.fill();
      ctx.fillStyle = '#1e2a32'; ctx.fillRect(10, -6, 20, 4); ctx.fillRect(10, 2, 20, 4);
      ctx.fillStyle = '#ff5b5b'; U.circle(ctx, 4, 0, 3); ctx.fill();
      ctx.restore();
    },
  });

  /* ---------- Boss: Specimen Omega ---------- */
  const omegaDraw = (ctx, e, G, decoy) => {
    const t = G.time;
    ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.face || 0);
    if (decoy) ctx.globalAlpha *= 0.75 + Math.sin(t * 20 + e.t) * 0.2;
    ctx.strokeStyle = 'rgba(126,243,255,.5)'; ctx.lineWidth = 3;
    for (let i = 0; i < 2; i++) { ctx.beginPath(); ctx.ellipse(0, 0, 50 + i * 12, 22 + i * 6, t * (i ? -1.5 : 1.2), 0, U.TAU); ctx.stroke(); }
    ctx.fillStyle = '#3a3a4a'; U.rr(ctx, -6, -30, 12, 14, 4); ctx.fill(); U.rr(ctx, -6, 16, 12, 14, 4); ctx.fill();
    ctx.fillStyle = '#d8d0e0'; U.ellipse(ctx, 0, 0, 24, 30); ctx.fill();
    ctx.strokeStyle = `rgba(126,243,255,${0.6 + Math.sin(t * 5) * 0.3})`; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-14, -18); ctx.lineTo(-4, -4); ctx.lineTo(-12, 14); ctx.moveTo(6, -20); ctx.lineTo(10, 0); ctx.stroke();
    ctx.strokeStyle = '#c8c0d8'; ctx.lineWidth = 7; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, -24); ctx.lineTo(30, -34); ctx.moveTo(0, 24); ctx.lineTo(30, 34); ctx.stroke();
    ctx.fillStyle = '#e8e0f0'; U.circle(ctx, 8, 0, 13); ctx.fill();
    ctx.fillStyle = `rgba(126,243,255,${0.7 + Math.sin(t * 6) * 0.25})`; U.circle(ctx, 4, 0, 9); ctx.fill();
    ctx.fillStyle = '#1a1a2a'; U.ellipse(ctx, 16, -4, 2.5, 3.5); ctx.fill(); U.ellipse(ctx, 16, 4, 2.5, 3.5); ctx.fill();
    ctx.restore();
  };
  function blinkTo(e, G, x, y) {
    G.burst(e.x, e.y, '#7ef3ff', 20, 200);
    e.x = U.clamp(x, 120, G.world.w - 120); e.y = U.clamp(y, 120, G.world.h - 120);
    G.collide(e); G.burst(e.x, e.y, '#7ef3ff', 20, 200); MB.Audio.play('dash');
  }
  Ens.register('omegaDecoy', {
    name: 'Omega Clone', r: 40, hp: 500, speed: 120, dmg: 18, score: 400, knockMul: 0, blood: '#3a2a4a', gore: '#7ef3ff',
    init(e) { e.cd = U.rnd(1, 2.5); },
    update(e, G, dt) {
      const p = G.player;
      Ens.steer(e, G, p.x, p.y, e.speed, dt, { f: 2, a: 0.8 });
      e.cd -= dt;
      if (e.cd <= 0) { e.cd = 2.4; for (let i = 0; i < 6; i++) G.enemyShot({ x: e.x, y: e.y, a: i / 6 * U.TAU + G.time, speed: 240, r: 7, dmg: 8, life: 2, kind: 'orb', color: '#7ef3ff', owner: e }); }
    },
    onDeath(e, G) { G.explosion(e.x, e.y, 100, 40, { player: 16, color: '#7ef3ff', ring: '126,243,255' }); },
    draw(ctx, e, G) { omegaDraw(ctx, e, G, true); },
  });
  Ens.register('omega', {
    name: 'Specimen Omega', r: 40, hp: 11500, speed: 140, dmg: 24, score: 0, boss: true, knockMul: 0, blood: '#3a2a4a', gore: '#7ef3ff',
    init(e) { e.phase = 1; e.state = 'walk'; e.blinkT = 3; e.gridT = 7; e.decT = 4; e.pullT = 6; },
    update(e, G, dt) {
      const p = G.player, d = Ens.distPlayer(e, G), k = e.hp / e.maxHp;
      const ph = k > 0.6 ? 1 : k > 0.25 ? 2 : 3;
      if (ph > e.phase) { e.phase = ph; G.banner(`PHASE ${ph}`, ph === 2 ? 'Omega tạo bản sao (bản sao nhấp nháy)' : 'Omega hút bạn lại gần rồi nổ', 2); MB.Audio.play('roar'); G.shake(12); }
      if (e.state === 'walk') {
        const a = Math.atan2(e.y - p.y, e.x - p.x) + 0.8;
        Ens.steer(e, G, p.x + Math.cos(a) * 280, p.y + Math.sin(a) * 280, e.speed, dt);
        e.blinkT -= dt; e.gridT -= dt; e.decT -= dt; e.pullT -= dt;
        if (e.blinkT <= 0) {
          e.blinkT = ph === 3 ? 2.5 : 3.5;
          const a2 = U.rnd(0, U.TAU); blinkTo(e, G, p.x + Math.cos(a2) * 300, p.y + Math.sin(a2) * 300);
          const n = ph === 1 ? 10 : 14;
          for (let i = 0; i < n; i++) G.enemyShot({ x: e.x, y: e.y, a: i / n * U.TAU, speed: 250, r: 8, dmg: 9, life: 2.4, kind: 'orb', color: '#7ef3ff', owner: e });
        } else if (e.gridT <= 0) {
          e.gridT = ph === 1 ? 9 : 7;
          // lưới laser: các dải ngang/dọc quanh người chơi, báo trước 1 giây
          const vert = Math.random() < 0.5, off = U.rnd(0, 140);
          for (let i = -4; i <= 4; i++) {
            const c = (vert ? p.x : p.y) + i * 140 + off - 70;
            const band = { vert, c, w: 44 };
            G.addFx({
              layer: 'ground', life: 1.6, hit: false,
              update(fx) {
                if (fx.t > 1 && !fx.hit && !p.dead) { const v = band.vert ? p.x : p.y; if (Math.abs(v - band.c) < band.w / 2 + p.r * 0.5) { fx.hit = true; G.hurtPlayer(22, { x: p.x - 1, y: p.y }); } }
              },
              draw(ctx, fx) {
                const on = fx.t > 1, a = on ? 0.6 : 0.12 + (fx.t) * 0.2;
                ctx.fillStyle = on ? `rgba(255,70,110,${a})` : `rgba(255,70,110,${a})`;
                if (band.vert) ctx.fillRect(band.c - band.w / 2, p.y - 700, band.w, 1400); else ctx.fillRect(p.x - 900, band.c - band.w / 2, 1800, band.w);
              },
            });
          }
          MB.Audio.play('nova');
        } else if (ph >= 2 && e.decT <= 0 && G.extraAlive() < 4) {
          e.decT = 12;
          for (let i = 0; i < 3; i++) { const a3 = i / 3 * U.TAU; G.spawnEnemyAt('omegaDecoy', e.x + Math.cos(a3) * 120, e.y + Math.sin(a3) * 120, { extra: true }); }
          blinkTo(e, G, e.x + U.rnd(-200, 200), e.y + U.rnd(-200, 200));
        } else if (ph === 3 && e.pullT <= 0) { e.state = 'pull'; e.st = 1.6; e.pullT = 7; }
      } else if (e.state === 'pull') {
        Ens.stop(e, dt, 12); e.st -= dt;
        if (!p.dash) { const a = Math.atan2(e.y - p.y, e.x - p.x); p.vx += Math.cos(a) * 520 * dt; p.vy += Math.sin(a) * 520 * dt; }
        if (e.st <= 0) { G.shockwave(e.x, e.y, 360, 0.9, 24, 'rgba(126,243,255,.9)'); if (d < 120) G.hurtPlayer(26, e); e.state = 'walk'; }
      }
    },
    tele(ctx, e, G) {
      if (e.state === 'pull') {
        const k = 1 - e.st / 1.6;
        ctx.strokeStyle = `rgba(126,243,255,${0.3 + k * 0.5})`; ctx.lineWidth = 3;
        for (let i = 0; i < 3; i++) { U.circle(ctx, e.x, e.y, 360 * (1 - ((G.time * 1.5 + i / 3) % 1))); ctx.stroke(); }
      }
    },
    draw(ctx, e, G) { omegaDraw(ctx, e, G, false); },
  });

  /* ---------- bản đồ ---------- */
  const obstacles = [];
  const W = (x, y, w, h) => obstacles.push({ kind: 'labwall', shape: 'box', x, y, w, h, rot: 0 });
  // tường phòng thí nghiệm (có cửa)
  W(800, 380, 30, 560); W(800, 1300, 30, 640); W(800, 2050, 30, 360);
  W(1600, 280, 30, 460); W(1600, 1150, 30, 560); W(1600, 1950, 30, 600);
  W(2600, 450, 30, 700); W(2600, 1400, 30, 500); W(2600, 2050, 30, 400);
  W(1200, 1150, 400, 30); W(2100, 700, 600, 30); W(2100, 1650, 600, 30);
  [[1000, 300], [1350, 950], [1400, 1450], [2000, 300], [2350, 1950], [3000, 1150], [500, 1150]].forEach(([x, y]) => obstacles.push({ kind: 'specimen', shape: 'circle', x, y, r: 30 }));
  [[1050, 1900, 110, 50], [2050, 1350, 120, 50], [2900, 800, 110, 50], [550, 750, 110, 50], [3050, 1550, 110, 50]].forEach(([x, y, w, h]) => obstacles.push({ kind: 'desk', shape: 'box', x, y, w, h, rot: 0 }));
  const hazards = [];

  MB.registerGate({
    id: 9, seed: 909, view3d: true,
    title: 'GATE 09 — LABORATORY', subtitle: 'Phòng Thí Nghiệm',
    world: { w: WW, h: WH }, bg: '#0c1418', mmColor: 'rgba(200,215,225,.75)',
    scale: { hp: 1.7, dmg: 1.3 },
    start: { x: 220, y: 1150 },
    obstacles, hazards,
    crates: [{ x: 500, y: 300 }, { x: 1200, y: 600 }, { x: 1200, y: 1700 }, { x: 2100, y: 1000 }, { x: 2100, y: 2000 }, { x: 3100, y: 300 }, { x: 3100, y: 2000 }],
    spawnPoints: [
      { x: 1200, y: 200 }, { x: 1200, y: 2100 }, { x: 2100, y: 200 }, { x: 2100, y: 2100 }, { x: 3200, y: 200 }, { x: 3200, y: 2100 },
      { x: 3200, y: 1150 }, { x: 2100, y: 1150 }, { x: 1300, y: 800 }, { x: 1300, y: 1500 },
    ],
    waves: [
      { total: 18, maxAlive: 10, mix: { clone: 5, zombie: 4, stalker: 2 }, interval: [0.65, 1.1], elite: 0.1 },
      { total: 22, maxAlive: 11, mix: { clone: 5, stalker: 4, licker: 2, spider: 2 }, interval: [0.55, 1.0], elite: 0.13 },
      { total: 26, maxAlive: 13, mix: { clone: 6, stalker: 4, licker: 3, zombie: 3 }, interval: [0.45, 0.9], elite: 0.17 },
    ],
    boss: { type: 'omega', x: 2950, y: 1150 },
    intro: { title: 'NHIỆM VỤ', text: 'Phòng thí nghiệm bị khoá. Né tia laser quay. Giẫm lên bệ dịch chuyển (vòng xanh) để thoát vây.' },
    objectives: [
      { title: 'QUARANTINE', text: 'Clone Soldier bắn loạt 3 viên sau vạch đỏ. Tháp súng canh gác các phòng.' },
      { title: 'BIOHAZARD', text: 'Phase Stalker gần như tàng hình và dịch chuyển ra sau lưng: thấy vạch đỏ thì né.' },
      { title: 'SPECIMEN VAULT', text: 'Wave cuối trước Boss.' },
      { title: 'BOSS · SPECIMEN OMEGA', text: 'Dải đỏ = lưới laser sắp bật: đứng vào khe trống. Bản sao nhấp nháy và nổ khi chết.' },
    ],
    challenges: [
      { id: 'servers', type: 'destroy', name: 'Máy Chủ', desc: 'Phá 4 máy chủ', kind: 'server', r: 24, hp: 340,
        spawner: { type: 'clone', every: 9, range: 700, cap: 4 },
        targets: [{ x: 1200, y: 300 }, { x: 1250, y: 2050 }, { x: 2200, y: 450 }, { x: 3200, y: 1900 }], reward: { mod: 'barrel' } },
      { id: 'control', type: 'hold', name: 'Phòng Điều Khiển', desc: 'Đứng trong vùng xanh 16 giây', zone: { x: 2100, y: 1150, r: 110 }, time: 16,
        mix: { clone: 2, stalker: 1, zombie: 1 }, spawnEvery: 2, reward: { mod: 'split' } },
      { id: 'streak', type: 'streak', name: 'Thí Nghiệm Hoàn Hảo', desc: '22 hạ gục liên tiếp không trúng đòn', count: 22, reward: { mod: 'mag' } },
    ],

    setup(G) {
      for (const s of SPIN) G.actors.push({ kind: 'spin', x: s.x, y: s.y, L: s.L, w: s.w, rot: Math.random() * 6, h: 0 });
      G.gs.padCd = 0;
      // tháp súng canh gác
      for (const [x, y] of [[1150, 1150], [2100, 450], [2100, 1900], [3000, 600]]) { const e = G.spawnEnemyAt('sentry', x, y, { extra: true }); if (e) e.spawnT = 0; }
      G.gs.gasT = 20;
    },
    update(G, dt) {
      const p = G.player;
      for (const a of G.actors) {
        if (a.kind !== 'spin') continue;
        a.rot += a.w * dt;
        const x2 = a.x + Math.cos(a.rot) * a.L, y2 = a.y + Math.sin(a.rot) * a.L, x3 = a.x - Math.cos(a.rot) * a.L, y3 = a.y - Math.sin(a.rot) * a.L;
        if (!p.dead && MB.Col.segCircle(x3, y3, x2, y2, p.x, p.y, p.r + 4)) G.hurtPlayer(18, { x: p.x - Math.cos(a.rot + 1.57) * 10, y: p.y - Math.sin(a.rot + 1.57) * 10 });
        for (const e of G.enemies) if (!e.dead && !e.boss && e.type !== 'sentry' && MB.Col.segCircle(x3, y3, x2, y2, e.x, e.y, e.r)) G.damageEnemy(e, 60 * dt, 0, 0, true);
      }
      // bệ dịch chuyển
      G.gs.padCd -= dt;
      if (G.gs.padCd <= 0 && !p.dead) for (const pair of PADS) for (let i = 0; i < 2; i++) {
        const a = pair[i], b = pair[1 - i];
        if (U.dist(a.x, a.y, p.x, p.y) < 34) {
          G.burst(p.x, p.y, '#7ef3ff', 20, 200);
          p.x = b.x + 60; p.y = b.y; p.vx = 0; p.vy = 0; p.iframes = Math.max(p.iframes, 0.4);
          G.collide(p); G.burst(p.x, p.y, '#7ef3ff', 20, 200); MB.Audio.play('dash');
          G.gs.padCd = 2.5; if (G.r3on) MB.R3.tgt.x = p.x, MB.R3.tgt.y = p.y; else G.snapCamera();
          return;
        }
      }
      // rò rỉ khí độc trong các phòng
      if (G.state === 'fight' || G.state === 'boss') {
        G.gs.gasT -= dt;
        if (G.gs.gasT <= 0) {
          G.gs.gasT = U.rnd(14, 20);
          for (let i = 0; i < 3; i++) { const x = p.x + U.rnd(-300, 300), y = p.y + U.rnd(-250, 250); G.telegraphCircle(x, y, 90, 1.2, (GG) => GG.addHazard({ kind: 'gas', x, y, r: 90, life: 5, dps: 12 }), 'rgba(190,255,90,.14)'); }
          MB.HUD.toast('<b>RÒ RỈ KHÍ ĐỘC</b>', '#c8ff8a');
        }
      }
    },
    drawUnder(G, ctx) {
      const t = G.time;
      for (const pair of PADS) for (const a of pair) {
        ctx.strokeStyle = `rgba(126,243,255,${G.gs.padCd > 0 ? 0.25 : 0.6 + Math.sin(t * 4) * 0.3})`; ctx.lineWidth = 3;
        U.circle(ctx, a.x, a.y, 30); ctx.stroke(); U.circle(ctx, a.x, a.y, 18 + ((t * 20) % 12)); ctx.stroke();
      }
    },

    buildGround(g, w, h, rand) {
      g.fillStyle = '#b8c6ce'; g.fillRect(0, 0, w, h);
      g.strokeStyle = 'rgba(120,140,150,.45)'; g.lineWidth = 2;
      for (let x = 0; x < w; x += 60) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
      for (let y = 0; y < h; y += 60) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
      GK.patches(g, rand, w, h, 90, ['rgba(140,160,170,.2)', 'rgba(90,110,120,.15)', 'rgba(150,60,60,.12)'], 30, 90);
      // bệ dịch chuyển
      for (const pair of PADS) for (const a of pair) {
        g.fillStyle = '#2a3a44'; g.beginPath(); g.arc(a.x, a.y, 38, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#4fd6ff'; g.beginPath(); g.arc(a.x, a.y, 26, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#c8f6ff'; g.beginPath(); g.arc(a.x, a.y, 12, 0, Math.PI * 2); g.fill();
      }
      for (const s of SPIN) { g.strokeStyle = 'rgba(255,90,120,.35)'; g.lineWidth = 3; g.setLineDash([10, 10]); g.beginPath(); g.arc(s.x, s.y, s.L, 0, Math.PI * 2); g.stroke(); g.setLineDash([]); }
      g.strokeStyle = 'rgba(242,194,48,.6)'; g.lineWidth = 6; g.setLineDash([24, 16]); g.beginPath(); g.moveTo(80, 1150); g.lineTo(3300, 1150); g.stroke(); g.setLineDash([]);
      GK.dots(g, rand, w, h, 400, ['rgba(120,40,40,.35)', 'rgba(90,100,110,.35)'], 4);
      GK.vignette(g, w, h, 0.35);
    },

    /* ---------- 3D ---------- */
    models3d: {
      clone: (K) => ({
        base: 18, anim: K.animZombie,
        build: () => K.buildZombie({ skin: 0xd0dae2, cloth: 0xc8d0d8, shirt: 0xe8eef4, eye: 0x4fd6ff, pustule: false, hair: false, hunch: -0.05, arms: 1.45,
          extra(KK, torso, head) {
            head.add(KK.mesh(KK.sph(7.6, 16), KK.std(0xe8eef4, { rough: 0.3 }), 0, 1, 0));
            head.add(KK.mesh(KK.box(3, 5, 9), KK.std(0x2a4a5a, { rough: 0.1, metal: 0.4, emissive: 0x1a4a6a, ei: 0.5 }), 6.6, 0, 0));
            torso.add(KK.mesh(KK.box(24, 4, 3), KK.std(0x2a3236, { metal: 0.5 }), 20, 15, 0));
            torso.add(KK.mesh(KK.box(2, 16, 2), KK.glowMat(0x4fd6ff, 1.2), 7.5, 10, 0));
          } }),
      }),
      stalker: (K) => ({ base: 17, anim: K.animLicker, build: () => K.buildLicker({ muscle: 0x4a3a6a, sinew: 0x2a1a3a, bone: 0xe8d8ff, brain: 0xb98cff, brainGlow: 0x7a40ff }) }),
      sentry: (K) => ({
        base: 22,
        build() {
          const T = K.T, g = new T.Group(), steel = K.std(0x5e6e78, { metal: 0.6, rough: 0.35 });
          g.add(K.mesh(K.cyl(20, 24, 16, 16), K.std(0x3a4a54, { metal: 0.5 }), 0, 8, 0));
          const head = new T.Group(); head.position.y = 26; g.add(head);
          head.add(K.mesh(K.box(26, 18, 24), steel, 0, 0, 0));
          for (const z of [-5, 5]) { const b = K.mesh(K.cyl(2, 2, 24, 8), K.std(0x1e2a32, { metal: 0.6 }), 22, 0, z); b.rotation.z = Math.PI / 2; head.add(b); }
          head.add(K.mesh(K.sph(3, 8), K.glowMat(0xff5b5b, 2), 13, 4, 0, false));
          g.userData = { head, h: 40 };
          return g;
        },
        anim(e, m) { m.rotation.y = 0; m.userData.head.rotation.y = -e.face; },
      }),
      omega: (K) => ({ base: 40, anim: (e, m, G) => { K.animZombie(e, m, G); m.userData.rings.rotation.y = G.time * 1.5; }, build: () => buildOmega(K) }),
      omegaDecoy: (K) => ({ base: 40, anim: (e, m, G) => { K.animZombie(e, m, G); m.userData.rings.rotation.y = -G.time * 1.5; }, build: () => { const g = buildOmega(K); K.ownMats(g).forEach((m) => { m.transparent = true; m.opacity = 0.7; }); return g; } }),
    },
    props3d: {
      labwall: (o, K) => {
        const T = K.T, g = new T.Group();
        g.add(K.mesh(K.box(o.w, 70, o.h), K.std(0xc8d4dc, { rough: 0.5 }), 0, 35, 0));
        g.add(K.mesh(K.box(o.w + 1, 3, o.h + 1), K.glowMat(0x4fd6ff, 1.2), 0, 50, 0, false));
        return g;
      },
      specimen: (o, K) => {
        const T = K.T, g = new T.Group();
        g.add(K.mesh(K.cyl(o.r, o.r, 8, 20), K.std(0x5a6a74, { metal: 0.5 }), 0, 4, 0), K.mesh(K.cyl(o.r, o.r, 8, 20), K.std(0x5a6a74, { metal: 0.5 }), 0, 84, 0));
        const glass = new T.Mesh(K.cyl(o.r * 0.95, o.r * 0.95, 72, 20), new T.MeshStandardMaterial({ color: 0x78e6c8, transparent: true, opacity: 0.35, roughness: 0.05, metalness: 0.1, emissive: 0x2a8a70, emissiveIntensity: 0.4 }));
        glass.material.userData.own = true; glass.position.y = 44; g.add(glass);
        const sp = K.mesh(K.bumpy('spec', new T.SphereGeometry(10, 14, 10), 1.5, 0.4), K.std(0x4a3a4a), 0, 44, 0); sp.scale.set(0.8, 1.6, 0.8); g.add(sp);
        return g;
      },
      desk: (o, K) => {
        const T = K.T, g = new T.Group();
        g.add(K.mesh(K.box(o.w, 4, o.h), K.std(0xe8eef2, { rough: 0.4 }), 0, 30, 0));
        for (const [x, z] of [[-o.w / 2 + 4, -o.h / 2 + 4], [o.w / 2 - 4, -o.h / 2 + 4], [-o.w / 2 + 4, o.h / 2 - 4], [o.w / 2 - 4, o.h / 2 - 4]]) g.add(K.mesh(K.box(3, 30, 3), K.std(0x8a9aa4, { metal: 0.5 }), x, 15, z));
        g.add(K.mesh(K.box(24, 16, 2), K.glowMat(0x4fd6ff, 0.9), -o.w / 2 + 22, 42, 0));
        return g;
      },
      server: (o, K) => {
        const T = K.T, g = new T.Group(), mt = K.std(0x1e2a32, { own: true, metal: 0.5, rough: 0.4 });
        g.add(K.mesh(K.box(o.r * 2, 80, o.r * 2.4), mt, 0, 40, 0));
        for (let i = 0; i < 6; i++) g.add(K.mesh(K.box(o.r * 1.6, 3, 1), K.glowMat(i % 2 ? 0x7dff9b : 0x4fd6ff, 1.2), 0, 15 + i * 10, o.r * 1.2 + 0.6, false));
        g.userData.flashMat = mt; return g;
      },
    },
    actors3d: {
      spin: (a, K) => {
        const T = K.T, g = new T.Group();
        g.add(K.mesh(K.cyl(16, 20, 40, 14), K.std(0x3a4a54, { metal: 0.6 }), 0, 20, 0), K.mesh(K.sph(7, 10), K.glowMat(0xff5b7a, 2), 0, 42, 0, false));
        const beam = new T.Mesh(K.cyl(3, 3, 1, 8), new T.MeshBasicMaterial({ color: 0xff5070, transparent: true, opacity: 0.9, blending: T.AdditiveBlending }));
        beam.material.userData.own = true; beam.scale.y = a.L * 2; beam.rotation.z = Math.PI / 2; beam.position.y = 34; g.add(beam);
        const glow = new T.Mesh(K.cyl(9, 9, 1, 8), new T.MeshBasicMaterial({ color: 0xff2050, transparent: true, opacity: 0.25, blending: T.AdditiveBlending, depthWrite: false }));
        glow.material.userData.own = true; glow.scale.y = a.L * 2; glow.rotation.z = Math.PI / 2; glow.position.y = 34; g.add(glow);
        return g;
      },
    },
  });

  function buildOmega(K) {
    const T = K.T;
    const g = K.buildZombie({ skin: 0xd8d0e0, cloth: 0x3a3a4a, shirt: 0xc8c0d8, eye: 0x7ef3ff, pustule: 0x7ef3ff, hair: false, hunch: -0.05, arms: 0.5, scale: [2.0, 2.1, 2.0],
      extra(KK, torso, head) {
        head.add(KK.mesh(KK.sph(5.5, 14), KK.glowMat(0x7ef3ff, 1.3), -1, 4.5, 0));
        for (let i = 0; i < 4; i++) torso.add(KK.mesh(KK.box(0.6, 12, 0.6), KK.glowMat(0x7ef3ff, 1.4), 6.8, 8 + i * 0.5, -4 + i * 2.6));
      } });
    const rings = new T.Group(); rings.position.y = 50; g.add(rings);
    for (let i = 0; i < 2; i++) { const r = new T.Mesh(K.G3('oring' + i, () => new T.TorusGeometry(48 + i * 12, 1.2, 6, 48)), K.glowMat(0x7ef3ff, 1.2)); r.rotation.x = Math.PI / 2 + (i ? 0.4 : -0.3); rings.add(r); }
    g.userData.rings = rings;
    return g;
  }
})(window.MB);
