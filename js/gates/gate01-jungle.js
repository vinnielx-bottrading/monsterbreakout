/* Gate 01 — Jungle: Rừng Nhiễm Độc
   Quái: Zombie, Spider, Licker · Boss: Spider Queen
   Thử thách: phá 3 ổ virus (→ Shotgun), giữ trạm tín hiệu (→ Lõi Xuyên Phá), chuỗi 12 hạ gục không trúng đòn (→ Cò Siêu Tốc) */
'use strict';
(function (MB) {
  const U = MB.U;
  const WW = 3000, WH = 2000;

  /* ---------- props riêng của Gate 01 ---------- */
  MB.Props.register('nest', (ctx, o, t) => {
    const { x, y, r } = o;
    const pulse = 1 + Math.sin(t * 3 + x) * 0.05;
    MB.Props.shadow(ctx, x + 6, y + 10, r * 1.1, r * 0.7, 0.3);
    ctx.save(); ctx.translate(x, y); ctx.scale(pulse, pulse);
    ctx.strokeStyle = '#3c2440'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    for (let i = 0; i < 7; i++) {
      const a = i / 7 * U.TAU + Math.sin(t + i) * 0.08;
      ctx.beginPath(); ctx.moveTo(Math.cos(a) * r * 0.6, Math.sin(a) * r * 0.6);
      ctx.quadraticCurveTo(Math.cos(a + 0.3) * r * 1.2, Math.sin(a + 0.3) * r * 1.2, Math.cos(a + 0.1) * r * 1.45, Math.sin(a + 0.1) * r * 1.45); ctx.stroke();
    }
    ctx.fillStyle = o.flash > 0 ? '#e9d0ef' : '#4a2c4f'; U.circle(ctx, 0, 0, r); ctx.fill();
    ctx.fillStyle = '#5f3a63';
    for (let i = 0; i < 6; i++) { const a = i / 6 * U.TAU + 0.4; U.circle(ctx, Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.55, r * 0.32); ctx.fill(); }
    const g = ctx.createRadialGradient(0, 0, 2, 0, 0, r * 0.6);
    g.addColorStop(0, 'rgba(220,255,140,.95)'); g.addColorStop(1, 'rgba(120,220,60,0)');
    ctx.fillStyle = g; U.circle(ctx, 0, 0, r * 0.6); ctx.fill();
    ctx.restore();
  });

  /* ---------- Boss: Spider Queen ---------- */
  MB.Enemies.register('spiderQueen', {
    name: 'Spider Queen', r: 54, hp: 4200, speed: 74, dmg: 20, score: 0, boss: true, knockMul: 0,
    blood: '#3f6b25', gore: '#c9ff8a',
    init(e) { e.phase = 1; e.shootT = 2.2; e.summonT = 4; e.dashT = 6; e.webT = 4; e.state = 'walk'; e.orbit = 1; e.spiralA = 0; e.spiralCycle = 5; e.spiralOn = 0; },
    armorFn(e, dmg) { return e.state === 'stunned' ? dmg * 1.5 : dmg; },
    update(e, G, dt) {
      const p = G.player, Ens = MB.Enemies;
      const d = Ens.distPlayer(e, G), k = e.hp / e.maxHp;
      const ph = k > 0.6 ? 1 : k > 0.25 ? 2 : 3;
      if (ph > e.phase) {
        e.phase = ph; e.state = 'walk';
        G.banner(`PHASE ${ph}`, ph === 2 ? 'Spider Queen nổi giận: lao tới và bắn mạng nhện' : 'Spider Queen cuồng bạo: xoáy độc', 2);
        MB.Audio.play('roar'); G.shake(12);
      }
      if (e.state === 'walk') {
        let tx = p.x, ty = p.y;
        if (d < 340) { const a = Math.atan2(e.y - p.y, e.x - p.x) + 0.9 * e.orbit; tx = p.x + Math.cos(a) * 300; ty = p.y + Math.sin(a) * 300; }
        if (e.bumped && Math.random() < 0.05) e.orbit *= -1;
        Ens.steer(e, G, tx, ty, e.speed * (ph === 3 ? 1.35 : 1), dt);
        e.shootT -= dt; e.summonT -= dt; e.dashT -= dt; e.webT -= dt;
        if (e.shootT <= 0) {
          const a = Ens.toPlayer(e, G), n = ph === 1 ? 5 : 7;
          for (let i = 0; i < n; i++) G.enemyShot({ x: e.x, y: e.y, a: a + (i - (n - 1) / 2) * 0.2, speed: 290, r: 8, dmg: 9, kind: 'spit', owner: e });
          e.shootT = ph === 1 ? 2.2 : ph === 2 ? 1.9 : 1.6;
          MB.Audio.play('spit');
        }
        if (ph >= 2 && e.webT <= 0) {
          e.webT = 5;
          const a = Ens.toPlayer(e, G);
          G.enemyShot({ x: e.x, y: e.y, a, speed: 360, r: 12, dmg: 6, life: U.clamp(d / 360, 0.3, 1.6), kind: 'web', pass: true, owner: e,
            onEnd: (GG, b) => GG.addHazard({ kind: 'web', x: b.x, y: b.y, r: 75, life: 5 }) });
        }
        if (e.summonT <= 0) {
          e.summonT = ph === 1 ? 6 : ph === 2 ? 5 : 4.5;
          const n = ph === 3 ? 3 : 2;
          for (let i = 0; i < n && G.extraAlive() < 8; i++) {
            const a = U.rnd(0, U.TAU);
            G.spawnEnemyAt('spider', e.x + Math.cos(a) * 80, e.y + Math.sin(a) * 80, { extra: true });
          }
        }
        if (ph >= 2 && e.dashT <= 0 && d < 620) { e.state = 'aim'; e.st = 0.75; e.lock = Ens.toPlayer(e, G); }
        if (ph === 3) {
          e.spiralCycle -= dt;
          if (e.spiralCycle <= 0) { e.spiralCycle = 5.5; e.spiralOn = 2.2; }
          if (e.spiralOn > 0) {
            e.spiralOn -= dt; e.spiralT = (e.spiralT || 0) - dt;
            if (e.spiralT <= 0) {
              e.spiralT = 0.15; e.spiralA += 0.45;
              for (let i = 0; i < 3; i++) G.enemyShot({ x: e.x, y: e.y, a: e.spiralA + i * U.TAU / 3, speed: 220, r: 7, dmg: 8, kind: 'spit', color: '#ffd56a', owner: e });
            }
          }
        }
      } else if (e.state === 'aim') {
        Ens.stop(e, dt, 12);
        e.lock += U.angDiff(e.lock, Ens.toPlayer(e, G)) * Math.min(1, dt * 2);
        e.face = e.lock; e.st -= dt;
        if (e.st <= 0) { e.state = 'dash'; e.st = 0.6; e.vx = Math.cos(e.lock) * 650; e.vy = Math.sin(e.lock) * 650; MB.Audio.play('roar'); }
      } else if (e.state === 'dash') {
        e.st -= dt;
        if (Math.random() < 0.6) G.particle({ x: e.x + U.rnd(-30, 30), y: e.y + U.rnd(-30, 30), vx: 0, vy: 0, life: 0.4, color: 'rgba(120,100,70,.6)', r: 6 });
        if (e.bumped || e.st <= 0) {
          e.dashT = e.phase === 3 ? 5 : 7;
          if (e.bumped) { e.state = 'stunned'; e.st = 1.3; G.shake(10); G.text(e.x, e.y - 70, 'CHOÁNG!', '#ffd56a', 20); MB.Audio.play('slam'); }
          else e.state = 'walk';
          e.vx *= 0.2; e.vy *= 0.2;
        }
      } else if (e.state === 'stunned') {
        Ens.stop(e, dt, 10); e.st -= dt;
        if (e.st <= 0) e.state = 'walk';
      }
    },
    tele(ctx, e, G) { if (e.state === 'aim') G.drawTelegraphLine(ctx, e.x, e.y, e.lock, 430, 1 - e.st / 0.75); },
    draw(ctx, e, G) {
      const t = G.time;
      ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.face || 0);
      const moving = Math.hypot(e.vx, e.vy) > 20;
      const gait = moving ? t * (e.state === 'dash' ? 22 : 9) : t * 1.5;
      ctx.lineCap = 'round';
      for (const side of [-1, 1]) {
        for (let k = 0; k < 4; k++) {
          const a = side * (0.55 + k * 0.6) + Math.sin(gait + k * 1.6 + (side > 0 ? 0 : Math.PI)) * 0.16;
          const jx = Math.cos(a) * 48, jy = Math.sin(a) * 48;
          const b = a + side * 0.55;
          ctx.strokeStyle = '#3d1f1f'; ctx.lineWidth = 8;
          ctx.beginPath(); ctx.moveTo(Math.cos(a) * 18, Math.sin(a) * 18); ctx.lineTo(jx, jy); ctx.lineTo(jx + Math.cos(b) * 42, jy + Math.sin(b) * 42); ctx.stroke();
          ctx.fillStyle = '#6b3434'; U.circle(ctx, jx, jy, 5); ctx.fill();
        }
      }
      const body = e.phase === 3 ? '#7d2a2a' : '#5b2b2b';
      ctx.fillStyle = '#3a1c1c'; U.ellipse(ctx, -36, 0, 42, 34); ctx.fill();
      const glow = 0.55 + Math.sin(t * 4) * 0.3;
      ctx.fillStyle = `rgba(190,255,110,${glow})`;
      ctx.beginPath(); ctx.moveTo(-58, -10); ctx.lineTo(-36, 0); ctx.lineTo(-58, 10); ctx.lineTo(-14, 10); ctx.lineTo(-36, 0); ctx.lineTo(-14, -10); ctx.closePath(); ctx.fill();
      ctx.fillStyle = `rgba(190,255,110,${glow * 0.8})`;
      U.circle(ctx, -50, -22, 6); ctx.fill(); U.circle(ctx, -48, 22, 5); ctx.fill(); U.circle(ctx, -66, 2, 4); ctx.fill();
      ctx.fillStyle = body; U.ellipse(ctx, 14, 0, 32, 27); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.07)'; U.ellipse(ctx, 8, -8, 18, 10); ctx.fill();
      ctx.shadowColor = '#ffdf8c'; ctx.shadowBlur = 10; ctx.fillStyle = '#ffdf8c';
      [[34, -9, 4], [34, 9, 4], [39, -4, 3], [39, 4, 3], [29, -15, 2.4], [29, 15, 2.4]].forEach(([x, y, r]) => { U.circle(ctx, x, y, r); ctx.fill(); });
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#d9cfb8'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(42, -8); ctx.quadraticCurveTo(56, -8, 56, 2); ctx.moveTo(42, 8); ctx.quadraticCurveTo(56, 8, 56, -2); ctx.stroke();
      if (e.state === 'stunned') {
        ctx.fillStyle = '#ffd56a';
        for (let i = 0; i < 3; i++) { const a = t * 5 + i * 2.1; U.circle(ctx, 14 + Math.cos(a) * 30, Math.sin(a) * 30, 4); ctx.fill(); }
      }
      ctx.restore();
    },
  });

  /* ---------- bản đồ ---------- */
  const rng = U.seeded(101);
  const obstacles = [];
  const T = (x, y, r, inf) => obstacles.push({ kind: 'tree', shape: 'circle', x, y, r, infected: !!inf });
  const R = (x, y, r) => obstacles.push({ kind: 'rock', shape: 'circle', x, y, r });
  const L = (x, y, w, rot) => obstacles.push({ kind: 'log', shape: 'box', x, y, w, h: 34, rot });

  // viền rừng rậm
  for (let x = 40; x < WW; x += 105 + rng() * 40) { T(x, 40 + rng() * 60, 55 + rng() * 22, rng() < 0.2); T(x + 50, WH - 40 - rng() * 60, 55 + rng() * 22, rng() < 0.2); }
  for (let y = 160; y < WH - 120; y += 110 + rng() * 40) { if (Math.abs(y - 1000) > 160) T(30 + rng() * 50, y, 52 + rng() * 20); T(WW - 30 - rng() * 50, y, 52 + rng() * 20, rng() < 0.25); }
  // vật cản chiến thuật
  [[540, 800, 42], [1080, 820, 50], [1420, 1120, 54], [2020, 1180, 58], [2420, 980, 46], [760, 1640, 48], [1900, 480, 44]].forEach((a) => R(...a));
  [[680, 560, 58, 1], [1180, 1260, 56], [1820, 780, 60, 1], [2240, 1300, 56], [2600, 700, 58, 1], [360, 1250, 52], [1300, 1760, 54], [2000, 1700, 50, 1], [1680, 360, 50]].forEach((a) => T(...a));
  L(900, 1080, 170, 0.2); L(1560, 900, 180, -0.25); L(2300, 600, 160, 0.15); L(640, 1450, 160, 0.1); L(2100, 1450, 170, -0.15);

  MB.registerGate({
    id: 1, seed: 101, view3d: true,
    title: 'GATE 01 — JUNGLE', subtitle: 'Rừng Nhiễm Độc',
    world: { w: WW, h: WH }, bg: '#06100a', mmColor: 'rgba(90,150,90,.6)',
    start: { x: 260, y: 1000 },
    obstacles,
    crates: [{ x: 620, y: 1150 }, { x: 1150, y: 1500 }, { x: 1320, y: 300, rot: 0.2 }, { x: 1960, y: 1000 }, { x: 2250, y: 1650 }, { x: 2650, y: 330 }, { x: 420, y: 1700, rot: -0.3 }],
    hazards: [
      { kind: 'virus', x: 780, y: 1330, r: 82, dps: 10 }, { kind: 'virus', x: 1250, y: 620, r: 74, dps: 10 },
      { kind: 'virus', x: 1700, y: 1260, r: 90, dps: 11 }, { kind: 'virus', x: 2150, y: 720, r: 80, dps: 11 },
      { kind: 'virus', x: 2520, y: 1440, r: 80, dps: 12 }, { kind: 'virus', x: 480, y: 470, r: 70, dps: 10 },
    ],
    spawnPoints: [
      { x: 330, y: 300 }, { x: 1100, y: 230 }, { x: 2000, y: 240 }, { x: 2760, y: 300 }, { x: 2800, y: 1000 }, { x: 2760, y: 1720 },
      { x: 1900, y: 1790 }, { x: 1050, y: 1800 }, { x: 330, y: 1760 }, { x: 1450, y: 1460 }, { x: 2250, y: 1020 }, { x: 900, y: 600 },
    ],
    waves: [
      { total: 10, maxAlive: 6, mix: { zombie: 7, spider: 3 }, interval: [0.9, 1.5], elite: 0 },
      { total: 14, maxAlive: 8, mix: { zombie: 5, spider: 3, licker: 2 }, interval: [0.8, 1.3], elite: 0.08 },
      { total: 18, maxAlive: 10, mix: { zombie: 4, spider: 3, licker: 3 }, interval: [0.6, 1.1], elite: 0.12 },
    ],
    boss: { type: 'spiderQueen', x: 2620, y: 1000 },
    intro: { title: 'NHIỆM VỤ', text: 'Vượt rừng nhiễm virus, sống sót 3 wave và hạ Spider Queen.' },
    objectives: [
      { title: 'JUNGLE ENTRY', text: 'Bắn vỡ thùng tiếp tế (★ vàng) để nhặt linh kiện nâng cấp súng.' },
      { title: 'DEEP FOREST', text: 'Licker xuất hiện: thấy vạch đỏ thì né ngang hoặc nấp sau vật cản.' },
      { title: 'INFECTED CORE', text: 'Wave cuối. Đừng để bị dồn vào góc.' },
      { title: 'BOSS · SPIDER QUEEN', text: 'Khi nó lao tới, dụ nó đâm vào đá/cây: bị choáng và nhận thêm 50% sát thương.' },
    ],
    challenges: [
      { id: 'nests', type: 'destroy', name: 'Phá Ổ Virus', desc: 'Phá 3 ổ sinh nhện', kind: 'nest', r: 32, hp: 220,
        spawner: { type: 'spider', every: 6.5, range: 750, cap: 5 },
        targets: [{ x: 880, y: 360 }, { x: 1620, y: 1640 }, { x: 2400, y: 420 }], reward: { weapon: 'shotgun' } },
      { id: 'signal', type: 'hold', name: 'Trạm Tín Hiệu', desc: 'Đứng trong vùng xanh 12 giây', zone: { x: 1480, y: 1000, r: 115 }, time: 12,
        mix: { zombie: 3, spider: 2 }, spawnEvery: 2.3, reward: { mod: 'pierce' } },
      { id: 'streak', type: 'streak', name: 'Không Một Vết Xước', desc: '12 hạ gục liên tiếp không trúng đòn', count: 12, reward: { mod: 'trigger' } },
    ],

    buildGround(g, w, h, rand) {
      g.fillStyle = '#0e1f12'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 320; i++) {
        const x = rand() * w, y = rand() * h, r = 30 + rand() * 90;
        g.fillStyle = rand() < 0.5 ? 'rgba(22,48,26,.55)' : 'rgba(8,22,12,.5)';
        g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
      }
      // đường mòn
      const trail = () => { g.beginPath(); g.moveTo(120, 1000); g.bezierCurveTo(600, 880, 900, 1120, 1300, 1000); g.bezierCurveTo(1700, 880, 2100, 1120, 2900, 1000); };
      g.lineCap = 'round';
      g.strokeStyle = 'rgba(92,72,46,.55)'; g.lineWidth = 150; trail(); g.stroke();
      g.strokeStyle = 'rgba(122,96,62,.45)'; g.lineWidth = 90; trail(); g.stroke();
      for (let i = 0; i < 260; i++) {
        const x = 150 + rand() * 2750, y = 1000 + (rand() - 0.5) * 120;
        g.fillStyle = 'rgba(60,45,28,.5)'; g.beginPath(); g.arc(x, y, 2 + rand() * 4, 0, Math.PI * 2); g.fill();
      }
      // cỏ
      for (let i = 0; i < 2200; i++) {
        const x = rand() * w, y = rand() * h, l = 5 + rand() * 9, a = -Math.PI / 2 + (rand() - 0.5) * 0.9;
        g.strokeStyle = rand() < 0.5 ? 'rgba(80,140,70,.45)' : 'rgba(50,100,52,.5)'; g.lineWidth = 1.6;
        g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
      }
      // nấm, hoa
      for (let i = 0; i < 140; i++) {
        const x = rand() * w, y = rand() * h;
        g.fillStyle = ['#c9a0ff', '#ffd56a', '#ff9b7a', '#bfffb0'][(rand() * 4) | 0];
        g.globalAlpha = 0.55; g.beginPath(); g.arc(x, y, 2 + rand() * 2, 0, Math.PI * 2); g.fill(); g.globalAlpha = 1;
      }
      // mạch virus quanh hồ độc
      for (const hz of this.hazards) {
        for (let k = 0; k < 9; k++) {
          let x = hz.x, y = hz.y, a = rand() * Math.PI * 2;
          g.strokeStyle = 'rgba(150,255,90,.22)'; g.lineWidth = 3;
          g.beginPath(); g.moveTo(x, y);
          for (let s = 0; s < 8; s++) { a += (rand() - 0.5) * 0.9; x += Math.cos(a) * 26; y += Math.sin(a) * 26; g.lineTo(x, y); }
          g.stroke();
        }
      }
      // tối dần ở viền
      const v = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.65);
      v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.55)');
      g.fillStyle = v; g.fillRect(0, 0, w, h);
    },
  });
})(window.MB);
