/* Gate 05 — Volcano: Miệng Núi Lửa
   Cơ chế: sông dung nham (bỏng nặng, đốt cả quái), mưa thiên thạch (vòng đỏ báo trước), đợt phun trào.
   Quái mới: Magma Imp (chạy nhanh, để lại vệt lửa), Ember Spitter (ném cầu lửa vòng cung), Cinder Golem (đập đất).
   Boss: Magma Titan — vỏ đá giảm 50% sát thương; sau mỗi đòn lớn lõi mở ra (nhận ×1,6).
   Thử thách: phá 4 miệng phun (→ Boomer GL), giữ trạm làm mát (→ Bộ Chia Tia), 16 hạ gục (→ Nòng Tăng Lực). */
'use strict';
(function (MB) {
  const U = MB.U, Ens = MB.Enemies, GK = MB.GK;
  const WW = 3300, WH = 2200;

  // thiên thạch rơi (actor): vòng đỏ báo trước rồi nổ + để lại lửa
  function meteor(G, x, y, delay) {
    G.telegraphCircle(x, y, 90, delay || 1.3, null, 'rgba(255,110,40,.14)');
    G.actors.push({ kind: 'meteor', x, y, h: 600, vh: -600 / (delay || 1.3), r: 22, spin: Math.random() * 6 });
  }
  function updateMeteors(G, dt) {
    for (let i = G.actors.length - 1; i >= 0; i--) {
      const a = G.actors[i];
      if (a.kind !== 'meteor') continue;
      a.h += a.vh * dt; a.spin += dt * 4;
      if (Math.random() < 0.5) G.particle({ x: a.x + U.rnd(-6, 6), y: a.y - a.h * 0.5, vx: 0, vy: 30, life: 0.4, color: '#ff8a3c', r: 3 });
      if (a.h <= 0) {
        G.actors.splice(i, 1);
        G.explosion(a.x, a.y, 90, 50, { player: 18, knock: 300, color: '#ff8a3c', ring: '255,120,40', obstacles: false });
        G.addHazard({ kind: 'fire', x: a.x, y: a.y, r: 60, life: 4, dps: 8, burn: 1.5, enemyDps: 10 });
      }
    }
  }

  /* ---------- props ---------- */
  MB.Props.register('vent', (ctx, o, t) => {
    const { x, y, r } = o;
    MB.Props.shadow(ctx, x + 6, y + 10, r * 1.1, r * 0.6, 0.3);
    ctx.fillStyle = o.flash > 0 ? '#ffffff' : '#3a2a24'; U.circle(ctx, x, y, r); ctx.fill();
    ctx.fillStyle = '#4e3a30'; U.circle(ctx, x - r * 0.15, y - r * 0.15, r * 0.7); ctx.fill();
    const g = ctx.createRadialGradient(x, y, 2, x, y, r * 0.5);
    g.addColorStop(0, `rgba(255,230,140,${0.8 + Math.sin(t * 6 + x) * 0.2})`); g.addColorStop(1, 'rgba(255,90,20,0)');
    ctx.fillStyle = g; U.circle(ctx, x, y, r * 0.5); ctx.fill();
  });
  MB.Props.register('spire', (ctx, o) => {
    const { x, y, r } = o;
    MB.Props.shadow(ctx, x + 10, y + 12, r * 1.1, r * 0.6, 0.35);
    ctx.fillStyle = '#1a1416';
    ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * U.TAU + x; ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r * 0.9); } ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#3a2e3a'; ctx.beginPath(); ctx.moveTo(x, y - r * 0.2); ctx.lineTo(x + r * 0.5, y - r * 0.6); ctx.lineTo(x + r * 0.2, y + r * 0.4); ctx.closePath(); ctx.fill();
  });
  MB.Props.register('charred', (ctx, o) => {
    const { x, y, r } = o;
    MB.Props.shadow(ctx, x + 6, y + 10, r * 0.8, r * 0.45, 0.25);
    ctx.strokeStyle = '#1e1614'; ctx.lineCap = 'round';
    for (let i = 0; i < 5; i++) { const a = i / 5 * U.TAU + x * 0.01; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); ctx.stroke(); }
    ctx.fillStyle = '#2a1e1a'; U.circle(ctx, x, y, r * 0.3); ctx.fill();
    ctx.fillStyle = 'rgba(255,120,40,.6)'; U.circle(ctx, x + 2, y - 2, r * 0.1); ctx.fill();
  });
  MB.Props.registerActor('meteor', (ctx, a, G) => {
    const y = a.y - a.h * 0.6;
    ctx.fillStyle = 'rgba(0,0,0,.25)'; U.ellipse(ctx, a.x, a.y, 20 * (1 - a.h / 800), 10 * (1 - a.h / 800)); ctx.fill();
    ctx.strokeStyle = 'rgba(255,150,60,.5)'; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(a.x - 30, y - 60); ctx.lineTo(a.x, y); ctx.stroke();
    ctx.fillStyle = '#4a3a30'; U.circle(ctx, a.x, y, a.r); ctx.fill();
    ctx.fillStyle = '#ffb347'; U.circle(ctx, a.x - 5, y - 5, a.r * 0.5); ctx.fill();
  });

  /* ---------- Magma Imp ---------- */
  Ens.register('magmaImp', {
    name: 'Magma Imp', r: 15, hp: 55, speed: 150, dmg: 10, score: 160, blood: '#3a1a10', gore: '#ff9a4a',
    init(e) { e.trailT = 0; },
    update(e, G, dt) {
      Ens.steer(e, G, G.player.x, G.player.y, e.speed, dt, { f: 5, a: 0.5 });
      e.trailT -= dt;
      if (e.trailT <= 0 && G.hazards.length < 70) { e.trailT = 0.35; G.addHazard({ kind: 'fire', x: e.x, y: e.y, r: 22, life: 2, dps: 5, burn: 1 }); }
    },
    onContact(e, G) { G.player.burnT = Math.max(G.player.burnT || 0, 2); },
    draw(ctx, e, G) {
      ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.face || 0);
      const sw = Math.sin(G.time * 14 + e.t) * 3;
      ctx.fillStyle = '#3a1410'; U.rr(ctx, -5 + sw, -8, 9, 5, 2); ctx.fill(); U.rr(ctx, -5 - sw, 3, 9, 5, 2); ctx.fill();
      ctx.fillStyle = '#6a2214'; U.ellipse(ctx, 0, 0, 11, 9); ctx.fill();
      ctx.strokeStyle = `rgba(255,150,60,${0.6 + Math.sin(G.time * 8 + e.t) * 0.3})`; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(-6, -3); ctx.lineTo(0, 1); ctx.lineTo(5, -4); ctx.stroke();
      ctx.fillStyle = '#8a3018'; U.circle(ctx, 8, 0, 6); ctx.fill();
      ctx.fillStyle = '#1a0a08'; ctx.beginPath(); ctx.moveTo(6, -5); ctx.lineTo(2, -11); ctx.lineTo(8, -5); ctx.fill(); ctx.beginPath(); ctx.moveTo(6, 5); ctx.lineTo(2, 11); ctx.lineTo(8, 5); ctx.fill();
      ctx.fillStyle = '#ffd060'; U.circle(ctx, 11, -2, 1.5); ctx.fill(); U.circle(ctx, 11, 2, 1.5); ctx.fill();
      ctx.restore();
    },
  });

  /* ---------- Ember Spitter ---------- */
  Ens.register('emberSpitter', Ens.make({
    name: 'Ember Spitter', r: 19, hp: 80, speed: 60, dmg: 10, score: 200, blood: '#3a1a10', gore: '#ff9a4a',
    draw(ctx, e, G) {
      ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.face || 0);
      const pul = 1 + (e.state === 'aim' ? Math.sin(G.time * 20) * 0.08 : 0);
      ctx.scale(pul, pul);
      ctx.fillStyle = '#4a1e14'; U.circle(ctx, -4, -12, 5); ctx.fill(); U.circle(ctx, -4, 12, 5); ctx.fill();
      ctx.fillStyle = '#5a2418'; U.circle(ctx, 0, 0, 17); ctx.fill();
      ctx.fillStyle = `rgba(255,140,50,${0.7 + Math.sin(G.time * 6 + e.t) * 0.25})`;
      [[-6, -6, 4], [-8, 7, 3], [4, 9, 2.5], [2, -10, 2.5]].forEach(([x, y, r]) => { U.circle(ctx, x, y, r); ctx.fill(); });
      ctx.fillStyle = '#2a0a06'; U.circle(ctx, 13, 0, 5); ctx.fill();
      ctx.fillStyle = '#ffb347'; U.circle(ctx, 13, 0, e.state === 'aim' ? 4 : 2); ctx.fill();
      ctx.restore();
    },
  }, Ens.AI.shooter({
    min: 200, max: 420, cd: [2.0, 2.8], aim: 0.7, line: false,
    shot(e, G) {
      const p = G.player, tx = p.x + p.vx * 0.5, ty = p.y + p.vy * 0.5, dd = U.dist(tx, ty, e.x, e.y);
      G.telegraphCircle(tx, ty, 60, 1.0, null, 'rgba(255,120,40,.12)');
      G.enemyShot({ x: e.x, y: e.y, a: Math.atan2(ty - e.y, tx - e.x), speed: dd / 1.0, r: 9, dmg: 0, life: 1.0, kind: 'orb', color: '#ff8a3c', pass: true, owner: e,
        onEnd: (GG, b) => { GG.explosion(b.x, b.y, 60, 20, { player: 14, knock: 200, color: '#ff8a3c', ring: '255,120,40', small: true, obstacles: false }); GG.addHazard({ kind: 'fire', x: b.x, y: b.y, r: 48, life: 3, dps: 7, burn: 1.5 }); } });
      MB.Audio.play('spit');
    },
  })));

  /* ---------- Cinder Golem ---------- */
  Ens.register('cinderGolem', {
    name: 'Cinder Golem', r: 26, hp: 300, speed: 45, dmg: 18, score: 420, knockMul: 0.2, blood: '#2a2220', gore: '#ff9a4a',
    init(e) { e.state = 'walk'; e.cd = 2; },
    update(e, G, dt) {
      const d = Ens.distPlayer(e, G);
      e.cd -= dt;
      if (e.state === 'walk') {
        Ens.steer(e, G, G.player.x, G.player.y, e.speed, dt);
        if (d < 170 && e.cd <= 0) { e.state = 'windup'; e.st = 0.8; G.telegraphCircle(e.x, e.y, 210, 0.8); }
      } else if (e.state === 'windup') {
        Ens.stop(e, dt, 12); e.st -= dt;
        if (e.st <= 0) { G.shockwave(e.x, e.y, 230, 0.7, 16, 'rgba(255,140,60,.9)'); e.state = 'walk'; e.cd = U.rnd(2.5, 3.5); }
      }
    },
    draw(ctx, e, G) {
      ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.face || 0);
      const lift = e.state === 'windup' ? 1 - e.st / 0.8 : 0, sw = Math.sin(G.time * 4 + e.t) * 4;
      ctx.fillStyle = '#2e2622'; U.circle(ctx, 12 + sw + lift * 8, -24, 11); ctx.fill(); U.circle(ctx, 12 - sw + lift * 8, 24, 11); ctx.fill();
      ctx.fillStyle = '#3a302a'; U.ellipse(ctx, -2, 0, 25, 26); ctx.fill();
      ctx.strokeStyle = `rgba(255,120,40,${0.6 + Math.sin(G.time * 3 + e.t) * 0.3})`; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(-16, -8); ctx.lineTo(-4, 2); ctx.lineTo(-12, 14); ctx.moveTo(0, -18); ctx.lineTo(8, -4); ctx.stroke();
      ctx.fillStyle = '#2a2220'; U.circle(ctx, 16, 0, 10); ctx.fill();
      ctx.fillStyle = '#ffb347'; U.circle(ctx, 22, -4, 2.2); ctx.fill(); U.circle(ctx, 22, 4, 2.2); ctx.fill();
      ctx.restore();
    },
  });

  /* ---------- Boss: Magma Titan ---------- */
  Ens.register('magmaTitan', {
    name: 'Magma Titan', r: 70, hp: 9000, speed: 52, dmg: 26, score: 0, boss: true, knockMul: 0, blood: '#2a2220', gore: '#ff9a4a',
    init(e) { e.phase = 1; e.state = 'walk'; e.sweepT = 4; e.metT = 6; e.slamT = 8; e.sumT = 9; e.trailT = 0; },
    armorFn(e, dmg, G) {
      if (e.state === 'vent') return dmg * 1.6;
      if (Math.random() < 0.08) G.text(e.x, e.y - 80, 'VỎ ĐÁ', '#ffb347', 12);
      return dmg * 0.5;
    },
    update(e, G, dt) {
      const p = G.player, d = Ens.distPlayer(e, G), k = e.hp / e.maxHp;
      const ph = k > 0.6 ? 1 : k > 0.25 ? 2 : 3;
      if (ph > e.phase) { e.phase = ph; G.banner(`PHASE ${ph}`, ph === 2 ? 'Magma Titan gọi Magma Imp' : 'Magma Titan nóng chảy: để lại dung nham khi đi', 2); MB.Audio.play('roar'); G.shake(12); }
      if (ph === 3) { e.trailT -= dt; if (e.trailT <= 0) { e.trailT = 0.5; G.addHazard({ kind: 'fire', x: e.x, y: e.y, r: 70, life: 4, dps: 10, burn: 2 }); } }
      if (e.state === 'walk') {
        Ens.steer(e, G, p.x, p.y, e.speed * (ph === 3 ? 1.3 : 1), dt);
        e.sweepT -= dt; e.metT -= dt; e.slamT -= dt; e.sumT -= dt;
        if (e.sweepT <= 0 && d < 480) { e.state = 'sweep'; e.st = 1.6; e.a0 = Ens.toPlayer(e, G) - 0.9; e.dir = 1; G.banner('', 'Titan phun lửa quét ngang!', 1); }
        else if (e.metT <= 0) {
          e.metT = ph === 1 ? 7 : 5.5;
          const n = ph === 1 ? 5 : 7;
          for (let i = 0; i < n; i++) meteor(G, p.x + U.rnd(-180, 180), p.y + U.rnd(-180, 180), 1.2 + i * 0.12);
          e.state = 'vent'; e.st = 1.8;
        } else if (e.slamT <= 0 && d < 300) { e.state = 'windup'; e.st = 0.8; G.telegraphCircle(e.x, e.y, 160, 0.8); }
        if (ph >= 2 && e.sumT <= 0) { e.sumT = 9; for (let i = 0; i < 3 && G.extraAlive() < 8; i++) G.spawnEnemyAt('magmaImp', e.x + U.rnd(-90, 90), e.y + U.rnd(-90, 90), { extra: true }); }
      } else if (e.state === 'sweep') {
        Ens.stop(e, dt, 10); e.st -= dt;
        const a = e.a0 + (1 - e.st / 1.6) * 1.8; e.face = a;
        if (Math.random() < 0.85) G.enemyShot({ x: e.x + Math.cos(a) * 60, y: e.y + Math.sin(a) * 60, a: a + U.rnd(-0.08, 0.08), speed: U.rnd(360, 460), r: 9, dmg: 7, life: 1.0, kind: 'orb', color: '#ff8a3c', owner: e, onHit: (GG) => { GG.player.burnT = Math.max(GG.player.burnT || 0, 2); } });
        if (e.st <= 0) { e.state = 'vent'; e.st = 1.6; e.sweepT = ph === 1 ? 6 : 4.5; }
      } else if (e.state === 'windup') {
        Ens.stop(e, dt, 12); e.st -= dt;
        if (e.st <= 0) {
          G.shockwave(e.x, e.y, 460, 1.1, 20, 'rgba(255,140,60,.9)');
          if (U.dist(p.x, p.y, e.x, e.y) < 160 + p.r) G.hurtPlayer(30, e);
          e.state = 'vent'; e.st = 1.8; e.slamT = ph === 3 ? 5 : 7;
        }
      } else if (e.state === 'vent') {
        Ens.stop(e, dt, 10); e.st -= dt;
        if (e.st <= 0) e.state = 'walk';
      }
    },
    tele(ctx, e, G) {
      if (e.state === 'sweep') {
        const a = e.face;
        ctx.fillStyle = 'rgba(255,120,40,.16)';
        ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.arc(e.x, e.y, 460, a - 0.12, a + 0.12); ctx.closePath(); ctx.fill();
      }
    },
    draw(ctx, e, G) {
      const t = G.time, lift = e.state === 'windup' ? 1 - e.st / 0.8 : 0;
      ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.face || 0);
      const sw = Math.hypot(e.vx, e.vy) > 10 ? Math.sin(t * 4) * 10 : 0;
      for (const sd of [-1, 1]) { ctx.fillStyle = '#2a2220'; U.circle(ctx, 34 + sd * sw + lift * 20, sd * 64, 26); ctx.fill(); ctx.fillStyle = '#3e3430'; U.circle(ctx, 38 + sd * sw, sd * 60, 14); ctx.fill(); }
      ctx.fillStyle = e.phase === 3 ? '#4a2a20' : '#342a26'; U.ellipse(ctx, -6, 0, 64, 58); ctx.fill();
      ctx.fillStyle = '#463a34'; [[-26, -30, 22], [-32, 26, 20], [6, -34, 18], [8, 34, 18], [-52, 0, 18]].forEach(([x, y, r]) => { U.circle(ctx, x, y, r); ctx.fill(); });
      const glow = e.state === 'vent' ? 1 : 0.5 + Math.sin(t * 3) * 0.25;
      ctx.strokeStyle = `rgba(255,140,50,${glow})`; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(-44, -14); ctx.lineTo(-22, 0); ctx.lineTo(-34, 22); ctx.moveTo(-12, -36); ctx.lineTo(0, -14); ctx.lineTo(22, -18); ctx.stroke();
      if (e.state === 'vent') { const g = ctx.createRadialGradient(-10, 0, 4, -10, 0, 36); g.addColorStop(0, 'rgba(255,240,160,1)'); g.addColorStop(1, 'rgba(255,100,20,0)'); ctx.fillStyle = g; U.circle(ctx, -10, 0, 36); ctx.fill(); }
      ctx.fillStyle = '#2e2420'; U.circle(ctx, 40, 0, 22); ctx.fill();
      ctx.shadowColor = '#ff8a4c'; ctx.shadowBlur = 14; ctx.fillStyle = '#ffd060';
      U.circle(ctx, 52, -8, 4); ctx.fill(); U.circle(ctx, 52, 8, 4); ctx.fill(); ctx.shadowBlur = 0;
      ctx.restore();
    },
  });

  /* ---------- bản đồ ---------- */
  const rng = U.seeded(505);
  const obstacles = [];
  const ROCK = (L, x, y) => L.push({ kind: 'rock', shape: 'circle', x, y, r: 40 + rng() * 25, c1: '#2a2624', c2: '#3d3632' });
  const SPIRE = (L, x, y) => L.push({ kind: 'spire', shape: 'circle', x, y, r: 28 + rng() * 16 });
  const CHAR = (L, x, y) => L.push({ kind: 'charred', shape: 'circle', x, y, r: 34 + rng() * 10 });
  GK.border(obstacles, rng, WW, WH, (L, x, y) => (rng() < 0.6 ? ROCK(L, x, y) : SPIRE(L, x, y)), 1100);
  // sông dung nham (chuỗi vòng tròn), chừa cầu đá qua sông
  const hazards = [];
  const river = (pts, gaps) => {
    for (let i = 0; i < pts.length - 1; i++) {
      const [x1, y1] = pts[i], [x2, y2] = pts[i + 1], L = Math.hypot(x2 - x1, y2 - y1);
      for (let d = 0; d < L; d += 48) {
        const x = x1 + (x2 - x1) * d / L, y = y1 + (y2 - y1) * d / L;
        if (gaps.some((g) => Math.hypot(g[0] - x, g[1] - y) < 110)) continue;
        hazards.push({ kind: 'lava', x, y, r: 58, dps: 22, burn: 2, enemyDps: 25, noBub: hazards.length % 4 !== 0 });
      }
    }
  };
  river([[1150, 0], [1050, 500], [1200, 1000], [1100, 1600], [1200, 2200]], [[1150, 1080], [1080, 420], [1150, 1820]]);
  river([[2300, 0], [2400, 600], [2250, 1150], [2380, 1700], [2300, 2200]], [[2260, 1100], [2380, 520], [2330, 1880]]);
  const keep = [{ x: 240, y: 1100, r: 320 }, { x: 2900, y: 1100, r: 320 }, { x: 1700, y: 1100, r: 220 }, ...hazards.map((h) => ({ x: h.x, y: h.y, r: 120 })),
    { x: 600, y: 450, r: 120 }, { x: 1700, y: 1850, r: 120 }, { x: 1750, y: 350, r: 120 }, { x: 2900, y: 1800, r: 120 }];
  GK.scatter(obstacles, rng, 12, [250, 250, WW - 250, WH - 250], keep, ROCK);
  GK.scatter(obstacles, rng, 8, [250, 250, WW - 250, WH - 250], keep, SPIRE);
  GK.scatter(obstacles, rng, 8, [250, 250, WW - 250, WH - 250], keep, CHAR);

  MB.registerGate({
    id: 5, seed: 505, view3d: true,
    title: 'GATE 05 — VOLCANO', subtitle: 'Miệng Núi Lửa',
    world: { w: WW, h: WH }, bg: '#120a08', mmColor: 'rgba(150,110,100,.6)',
    scale: { hp: 1.3, dmg: 1.15 },
    start: { x: 240, y: 1100 },
    obstacles, hazards,
    crates: [{ x: 700, y: 1150 }, { x: 600, y: 1800 }, { x: 1650, y: 700 }, { x: 1750, y: 1450 }, { x: 2800, y: 500 }, { x: 2750, y: 1650 }, { x: 1650, y: 1100 }],
    spawnPoints: [
      { x: 350, y: 300 }, { x: 800, y: 1900 }, { x: 1700, y: 240 }, { x: 1700, y: 1950 }, { x: 3050, y: 300 }, { x: 3050, y: 1100 }, { x: 3050, y: 1900 },
      { x: 2700, y: 1100 }, { x: 1700, y: 900 }, { x: 600, y: 700 }, { x: 2800, y: 1950 },
    ],
    waves: [
      { total: 16, maxAlive: 9, mix: { magmaImp: 5, zombie: 4, emberSpitter: 2 }, interval: [0.75, 1.25], elite: 0.08 },
      { total: 20, maxAlive: 10, mix: { magmaImp: 5, emberSpitter: 3, cinderGolem: 1, spider: 3 }, interval: [0.65, 1.1], elite: 0.11 },
      { total: 24, maxAlive: 12, mix: { magmaImp: 5, emberSpitter: 3, cinderGolem: 2, licker: 2, zombie: 2 }, interval: [0.5, 0.95], elite: 0.15 },
    ],
    boss: { type: 'magmaTitan', x: 2900, y: 1100 },
    intro: { title: 'NHIỆM VỤ', text: 'Qua sông dung nham bằng cầu đá. Thiên thạch rơi ở vòng đỏ. Dung nham đốt cả quái: dụ chúng vào.' },
    objectives: [
      { title: 'ASH FIELDS', text: 'Magma Imp để lại vệt lửa. Ember Spitter ném cầu lửa vào vòng đỏ.' },
      { title: 'LAVA FLOW', text: 'Cinder Golem đập đất khi bạn lại gần: lùi ra khỏi vòng đỏ.' },
      { title: 'CALDERA', text: 'Wave cuối trước Boss.' },
      { title: 'BOSS · MAGMA TITAN', text: 'Vỏ đá chặn 50% sát thương. Sau mỗi đòn lớn lõi mở sáng: dồn hoả lực lúc đó (×1,6).' },
    ],
    challenges: [
      { id: 'vents', type: 'destroy', name: 'Miệng Phun', desc: 'Phá 4 miệng phun', kind: 'vent', r: 34, hp: 260,
        spawner: { type: 'magmaImp', every: 8, range: 700, cap: 5 },
        targets: [{ x: 600, y: 450 }, { x: 1700, y: 1850 }, { x: 1750, y: 350 }, { x: 2900, y: 1800 }], reward: { weapon: 'launcher' } },
      { id: 'cooler', type: 'hold', name: 'Trạm Làm Mát', desc: 'Đứng trong vùng xanh 14 giây', zone: { x: 1700, y: 1100, r: 115 }, time: 14,
        mix: { magmaImp: 2, emberSpitter: 1 }, spawnEvery: 2.2, reward: { mod: 'split' } },
      { id: 'streak', type: 'streak', name: 'Chân Lửa', desc: '16 hạ gục liên tiếp không trúng đòn', count: 16, reward: { mod: 'barrel' } },
    ],

    setup(G) { G.gs.metT = 10; G.gs.eruptT = 40; },
    update(G, dt) {
      updateMeteors(G, dt);
      const gs = G.gs, p = G.player;
      if (G.state === 'intro' || G.state === 'won' || G.over || p.dead) return;
      gs.metT -= dt; gs.eruptT -= dt;
      if (gs.metT <= 0) { gs.metT = U.rnd(6, 9); meteor(G, p.x + U.rnd(-160, 160), p.y + U.rnd(-160, 160)); }
      if (gs.eruptT <= 0 && G.state !== 'boss') {
        gs.eruptT = U.rnd(35, 45);
        G.banner('PHUN TRÀO', 'Thiên thạch rơi khắp nơi!', 1.8); G.shake(10); MB.Audio.play('boom');
        for (let i = 0; i < 8; i++) meteor(G, p.x + U.rnd(-380, 380), p.y + U.rnd(-300, 300), 1.3 + i * 0.25);
      }
    },
    drawScreen(G, ctx) {
      // tro bụi lơ lửng + ánh đỏ
      const t = G.time;
      ctx.fillStyle = 'rgba(255,90,30,.05)'; ctx.fillRect(0, 0, G.W, G.H);
      ctx.fillStyle = 'rgba(255,170,90,.6)';
      for (let i = 0; i < 40; i++) { const x = ((i * 137 + t * 20 * (1 + (i % 3))) % G.W), y = G.H - ((i * 251 + t * 35 * (1 + (i % 2))) % G.H); ctx.fillRect(x, y, 2, 2); }
    },

    buildGround(g, w, h, rand) {
      g.fillStyle = '#1e1715'; g.fillRect(0, 0, w, h);
      GK.patches(g, rand, w, h, 260, ['rgba(50,40,36,.5)', 'rgba(10,8,8,.45)', 'rgba(70,56,50,.3)'], 40, 140);
      GK.path(g, [[100, 1100], [700, 980], [1150, 1080], [1700, 1100], [2260, 1100], [2900, 1100], [3200, 1100]], 120, 'rgba(70,58,52,.6)');
      g.lineCap = 'round';
      for (let k = 0; k < 70; k++) {
        let x = rand() * w, y = rand() * h, a = rand() * 6.28;
        g.strokeStyle = 'rgba(255,110,30,.35)'; g.lineWidth = 3; g.beginPath(); g.moveTo(x, y);
        for (let s = 0; s < 5; s++) { a += (rand() - 0.5) * 1.3; x += Math.cos(a) * 26; y += Math.sin(a) * 26; g.lineTo(x, y); }
        g.stroke(); g.strokeStyle = 'rgba(255,200,120,.25)'; g.lineWidth = 1; g.stroke();
      }
      GK.dots(g, rand, w, h, 1600, ['rgba(120,100,90,.5)', 'rgba(255,140,60,.3)', 'rgba(20,16,14,.6)'], 3);
      GK.vignette(g, w, h, 0.6);
    },

    /* ---------- 3D ---------- */
    models3d: {
      magmaImp: (K) => ({
        base: 15, anim: K.animZombie,
        build: () => K.buildZombie({ skin: 0x6a2214, cloth: 0x2a1410, shirt: 0x4a1a10, eye: 0xffd060, pustule: 0xff7a20, hair: false, scale: [0.72, 0.72, 0.72], hunch: -0.5,
          extra(KK, torso, head) { const T = KK.T, horn = KK.std(0x1a0a08); for (const z of [-3, 3]) { const c = KK.mesh(KK.G3('imph', () => new T.ConeGeometry(1.4, 7, 6)), horn, -1, 6, z); c.rotation.x = z > 0 ? -0.5 : 0.5; head.add(c); } } }),
      }),
      emberSpitter: (K) => ({ base: 19, anim: K.animBlob, build: () => K.buildBlob({ color: 0x5a2418, glow: 0xff8a3c, eye: 0xffd060, seed: 5 }) }),
      cinderGolem: (K) => ({ base: 26, anim: K.animGolem, build: () => K.buildGolem({ scale: 0.62, stone: 0x2e2622, glow: 0xff7a30 }) }),
      magmaTitan: (K) => ({
        base: 70,
        build() {
          const g = K.buildGolem({ scale: 1.5, stone: 0x342a26, glow: 0xff6a20, crystal: 0xffa040 });
          const core = K.glowSprite(0xffb347, 120, 0); core.position.set(-3, 45, 0); g.add(core); g.userData.ventGlow = core;
          return g;
        },
        anim(e, m, G) { K.animGolem(e, m, G); m.userData.ventGlow.material.opacity = e.state === 'vent' ? 0.9 : 0; },
      }),
    },
    props3d: {
      vent: (o, K) => {
        const T = K.T, g = new T.Group(), mt = K.std(0x3a2a24, { own: true, flat: true, rough: 0.9 });
        g.add(K.mesh(K.G3('vcone', () => new T.CylinderGeometry(18, 40, 30, 9)), mt, 0, 15, 0));
        g.add(K.mesh(K.cyl(14, 14, 2, 14), K.glowMat(0xffb347, 1.6), 0, 30.5, 0, false));
        const gl = K.glowSprite(0xff8a3c, 90, 0.6); gl.position.y = 40; g.add(gl);
        g.userData.flashMat = mt; return g;
      },
      spire: (o, K) => { const T = K.T, g = new T.Group(); const c = K.mesh(K.G3('spire', () => new T.ConeGeometry(1, 1, 6)), K.std(0x1a1416, { flat: true, rough: 0.3, metal: 0.3 }), 0, 0, 0); c.scale.set(o.r, o.r * 3.2, o.r); c.position.y = o.r * 1.6; g.add(c); return g; },
      charred: (o, K) => {
        const T = K.T, g = new T.Group(), wood = K.std(0x1e1614, { rough: 0.95 });
        g.add(K.mesh(K.cyl(o.r * 0.14, o.r * 0.22, 54, 7), wood, 0, 27, 0));
        for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2 + o.x; K.limbBetween(g, [0, 36 + i * 4, 0], [Math.cos(a) * o.r * 0.7, 56 + i * 3, Math.sin(a) * o.r * 0.7], 2.2, 0.8, wood); }
        g.add(K.mesh(K.sph(2.5, 6), K.glowMat(0xff7a30, 1.5), 3, 30, 4, false));
        return g;
      },
    },
    actors3d: {
      meteor: (a, K) => {
        const T = K.T, g = new T.Group();
        const r = K.mesh(K.G3('met', () => new T.DodecahedronGeometry(22, 1)), K.std(0x4a3a30, { flat: true, emissive: 0xff5a10, ei: 0.4 }), 0, 0, 0); g.add(r);
        const gl = K.glowSprite(0xff8a3c, 110, 0.85); g.add(gl);
        g.userData.anim = (aa) => { r.rotation.x = aa.spin; r.rotation.z = aa.spin * 0.7; };
        return g;
      },
    },
  });
})(window.MB);
