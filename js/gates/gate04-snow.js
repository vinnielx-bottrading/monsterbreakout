/* Gate 04 — Snow: Bão Tuyết
   Cơ chế: mặt băng trơn trượt, bão tuyết định kỳ (tầm nhìn thu hẹp, đi chậm).
   Quái mới: Frost Zombie (chạm vào bị đóng băng chậm), Ice Wraith (bay, bắn 3 mũi băng).
   Boss: Cryo Wyrm — rắn băng nhiều đốt: lặn dưới tuyết rồi phá băng trồi lên, phun hơi băng hình nón.
   Thử thách: phá 4 cột băng (→ Pyro F-9), giữ lò sưởi (→ Nòng Tăng Lực), 15 hạ gục (→ Cò Siêu Tốc). */
'use strict';
(function (MB) {
  const U = MB.U, Ens = MB.Enemies, GK = MB.GK;
  const WW = 3200, WH = 2200;
  const chill = (G, t) => { const p = G.player; p.slow = Math.max(p.slow, t); G.text(p.x, p.y - 30, 'ĐÓNG BĂNG', '#bfe8ff', 13); };

  /* ---------- props ---------- */
  MB.Props.register('totem', (ctx, o, t) => {
    const { x, y, r } = o;
    MB.Props.shadow(ctx, x + 6, y + 10, r, r * 0.55, 0.25);
    ctx.save(); ctx.translate(x, y);
    const glow = 0.5 + Math.sin(t * 3 + x) * 0.3;
    ctx.shadowColor = '#7ef3ff'; ctx.shadowBlur = 14 * glow;
    ctx.fillStyle = o.flash > 0 ? '#ffffff' : '#7fb4d8';
    ctx.beginPath(); ctx.moveTo(0, -r * 1.4); ctx.lineTo(r * 0.55, -r * 0.2); ctx.lineTo(r * 0.4, r * 0.6); ctx.lineTo(-r * 0.4, r * 0.6); ctx.lineTo(-r * 0.55, -r * 0.2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = `rgba(220,250,255,${glow})`;
    ctx.beginPath(); ctx.moveTo(0, -r * 1.1); ctx.lineTo(r * 0.2, -r * 0.2); ctx.lineTo(0, r * 0.3); ctx.lineTo(-r * 0.2, -r * 0.2); ctx.closePath(); ctx.fill();
    ctx.restore();
  });

  /* ---------- Frost Zombie ---------- */
  Ens.register('frostZombie', {
    name: 'Frost Zombie', r: 20, hp: 85, speed: 56, dmg: 12, score: 150, blood: '#6a8aa8', gore: '#cfeaff',
    init(e) { e.speed += U.rnd(-6, 10); },
    update(e, G, dt) { Ens.steer(e, G, G.player.x, G.player.y, e.speed, dt); },
    onContact(e, G) { chill(G, 1.4); },
    draw(ctx, e, G) {
      ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.face || 0);
      const sw = Math.sin(G.time * 5 + e.t) * 4;
      ctx.fillStyle = '#4a6278'; U.rr(ctx, -6 + sw, -10, 12, 7, 3); ctx.fill(); U.rr(ctx, -6 - sw, 3, 12, 7, 3); ctx.fill();
      ctx.fillStyle = '#7d9cb4'; U.rr(ctx, -12, -13, 22, 26, 9); ctx.fill();
      ctx.fillStyle = '#d8f0ff'; [[-6, -8], [-2, 9], [-9, 3]].forEach(([x, y]) => { ctx.beginPath(); ctx.moveTo(x, y - 5); ctx.lineTo(x + 3, y); ctx.lineTo(x, y + 2); ctx.lineTo(x - 3, y); ctx.fill(); });
      ctx.strokeStyle = '#a8c4d8'; ctx.lineWidth = 5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(2, -11); ctx.lineTo(20 + sw * 0.4, -9); ctx.moveTo(2, 11); ctx.lineTo(19 - sw * 0.4, 10); ctx.stroke();
      ctx.fillStyle = '#c8dce8'; U.circle(ctx, 1, 0, 8.5); ctx.fill();
      ctx.fillStyle = '#7ef3ff'; U.circle(ctx, 5, -3, 1.9); ctx.fill(); U.circle(ctx, 5, 3, 1.9); ctx.fill();
      ctx.restore();
    },
  });

  /* ---------- Ice Wraith ---------- */
  Ens.register('iceWraith', Ens.make({
    name: 'Ice Wraith', r: 14, hp: 55, speed: 115, dmg: 8, score: 200, fly: true, blood: '#8ab0d0', gore: '#e0f6ff',
    draw(ctx, e, G) {
      ctx.save(); ctx.translate(e.x, e.y - 10); ctx.rotate(e.face || 0);
      ctx.fillStyle = 'rgba(0,0,0,.18)'; U.ellipse(ctx, 0, 24, 14, 5); ctx.fill();
      const f = Math.sin(G.time * 8 + e.t);
      ctx.fillStyle = 'rgba(190,230,255,.5)';
      ctx.beginPath(); ctx.moveTo(-18, 0); ctx.quadraticCurveTo(-8, -14 - f * 4, 6, -8); ctx.lineTo(12, 0); ctx.lineTo(6, 8); ctx.quadraticCurveTo(-8, 14 + f * 4, -18, 0); ctx.fill();
      ctx.fillStyle = 'rgba(230,248,255,.9)'; U.ellipse(ctx, 4, 0, 8, 6); ctx.fill();
      ctx.fillStyle = '#2a6aa0'; U.circle(ctx, 8, -2.5, 1.8); ctx.fill(); U.circle(ctx, 8, 2.5, 1.8); ctx.fill();
      ctx.restore();
    },
  }, Ens.AI.shooter({
    min: 160, max: 340, cd: [1.6, 2.4], aim: 0.55, lineLen: 300, wig: { f: 3, a: 0.4 },
    shot(e, G, a) {
      for (let i = -1; i <= 1; i++) G.enemyShot({ x: e.x, y: e.y, a: a + i * 0.18, speed: 330, r: 6, dmg: 8, life: 1.6, kind: 'ice', color: '#bfe8ff', owner: e, onHit: (GG) => chill(GG, 1.0) });
      MB.Audio.play('spit');
    },
  })));

  /* ---------- Boss: Cryo Wyrm ---------- */
  const SEG = 10, SPACING = 30;
  Ens.register('cryoWyrm', {
    name: 'Cryo Wyrm', r: 42, hp: 7600, speed: 150, dmg: 22, score: 0, boss: true, knockMul: 0, blood: '#6a8aa8', gore: '#e0f6ff', fly: true, noHover: true,
    init(e) {
      e.phase = 1; e.state = 'surface'; e.st = 6; e.breathT = 3; e.trail = []; e.segs = [];
      for (let i = 0; i < SEG; i++) e.segs.push({ x: e.x - (i + 1) * SPACING, y: e.y });
      for (let i = 0; i < SEG * 12; i++) e.trail.push({ x: e.x - i * SPACING / 12, y: e.y });
      e.wig = 0; e.orbT = 6; e.sumT = 9;
    },
    armorFn(e, dmg) { return e.state === 'stun' ? dmg * 1.5 : dmg; },
    update(e, G, dt) {
      const p = G.player, d = Ens.distPlayer(e, G), k = e.hp / e.maxHp;
      const ph = k > 0.6 ? 1 : k > 0.25 ? 2 : 3;
      if (ph > e.phase) { e.phase = ph; G.banner(`PHASE ${ph}`, ph === 2 ? 'Cryo Wyrm bắn cầu băng' : 'Cryo Wyrm cuồng nộ: trồi lên liên tiếp', 2); MB.Audio.play('roar'); G.shake(12); }
      e.st -= dt; e.wig += dt;
      const spd = e.speed * (ph === 3 ? 1.25 : 1);
      if (e.state === 'surface') {
        e.hidden = false; e.invuln = false; e.burrow = false;
        // lượn ngoằn ngoèo quanh người chơi
        const a = Math.atan2(p.y - e.y, p.x - e.x) + Math.sin(e.wig * 1.6) * 0.9 + (d < 220 ? 1.2 : 0);
        const tx = e.x + Math.cos(a) * 200, ty = e.y + Math.sin(a) * 200;
        Ens.steer(e, G, tx, ty, spd, dt);
        e.breathT -= dt; e.orbT -= dt; e.sumT -= dt;
        if (e.breathT <= 0 && d < 420) { e.state = 'breathAim'; e.st2 = 0.8; e.lock = Ens.toPlayer(e, G); }
        if (ph >= 2 && e.orbT <= 0) {
          e.orbT = 6;
          for (let i = 0; i < 10; i++) G.enemyShot({ x: e.x, y: e.y, a: i / 10 * U.TAU + e.wig, speed: 220, r: 9, dmg: 9, life: 2.6, kind: 'ice', color: '#9fd8ff', owner: e, onHit: (GG) => chill(GG, 1.2) });
          MB.Audio.play('spit');
        }
        if (ph === 3 && e.sumT <= 0) { e.sumT = 10; for (let i = 0; i < 2 && G.extraAlive() < 6; i++) G.spawnEnemyAt('iceWraith', e.x + U.rnd(-80, 80), e.y + U.rnd(-80, 80), { extra: true }); }
        if (e.st <= 0) { e.state = 'dive'; e.st = 0.6; MB.Audio.play('slam'); G.burst(e.x, e.y, '#e8f4ff', 24, 200); }
      } else if (e.state === 'breathAim') {
        Ens.stop(e, dt, 10); e.st2 -= dt;
        e.lock += U.angDiff(e.lock, Ens.toPlayer(e, G)) * Math.min(1, dt * 2); e.face = e.lock;
        if (e.st2 <= 0) { e.state = 'breath'; e.st2 = 1.1; }
      } else if (e.state === 'breath') {
        Ens.stop(e, dt, 10); e.st2 -= dt;
        if (Math.random() < 0.7) {
          const a = e.lock + U.rnd(-0.32, 0.32);
          G.enemyShot({ x: e.x + Math.cos(e.lock) * 40, y: e.y + Math.sin(e.lock) * 40, a, speed: U.rnd(320, 420), r: 7, dmg: 6, life: 1.1, kind: 'ice', color: '#e0f6ff', owner: e, onHit: (GG) => chill(GG, 1.3) });
        }
        if (e.st2 <= 0) { e.state = 'surface'; e.breathT = ph === 1 ? 5 : 3.8; }
      } else if (e.state === 'dive') {
        Ens.stop(e, dt, 6);
        if (e.st <= 0) { e.state = 'under'; e.st = ph === 3 ? 1.6 : 2.4; e.hidden = true; e.invuln = true; e.burrow = true; }
      } else if (e.state === 'under') {
        Ens.steer(e, G, p.x, p.y, spd * 1.5, dt);
        if (e.st <= 0) {
          e.state = 'rise'; e.st = 0.9; e.rx = p.x; e.ry = p.y;
          G.telegraphCircle(e.rx, e.ry, 115, 0.9);
        }
      } else if (e.state === 'rise') {
        Ens.stop(e, dt, 20);
        if (e.st <= 0) {
          e.x = e.rx; e.y = e.ry; e.hidden = false; e.invuln = false; e.burrow = false;
          G.shake(14); MB.Audio.play('slam'); G.burst(e.x, e.y, '#e8f4ff', 40, 300);
          if (U.dist(p.x, p.y, e.x, e.y) < 115 + p.r) { G.hurtPlayer(28, e); chill(G, 1.5); }
          for (let i = 0; i < 8; i++) G.enemyShot({ x: e.x, y: e.y, a: i / 8 * U.TAU, speed: 260, r: 7, dmg: 8, life: 1.2, kind: 'ice', color: '#bfe8ff', owner: e });
          e.rises = (e.rises || 0) + 1;
          if (ph === 3 && e.rises % 2 === 1) { e.state = 'under'; e.st = 1.0; e.hidden = true; e.invuln = true; e.burrow = true; }
          else { e.state = 'stun'; e.st = 1.2; }
        }
      } else if (e.state === 'stun') {
        Ens.stop(e, dt, 10);
        if (e.st <= 0) { e.state = 'surface'; e.st = U.rnd(6, 8); }
      }
      // thân rắn bám theo đường đi của đầu
      const last = e.trail[0];
      if (!last || U.dist(last.x, last.y, e.x, e.y) > 2.5) { e.trail.unshift({ x: e.x, y: e.y }); if (e.trail.length > SEG * 14) e.trail.pop(); }
      let acc = 0, idx = 0;
      for (let i = 0; i < SEG; i++) {
        const want = (i + 1) * SPACING;
        while (idx < e.trail.length - 1 && acc < want) { acc += U.dist(e.trail[idx].x, e.trail[idx].y, e.trail[idx + 1].x, e.trail[idx + 1].y); idx++; }
        const tp = e.trail[Math.min(idx, e.trail.length - 1)];
        e.segs[i].x = tp.x; e.segs[i].y = tp.y;
      }
      // thân rắn gây sát thương khi đang nổi
      if (!e.hidden && e.state !== 'dive') for (let i = 0; i < SEG; i++) {
        const s = e.segs[i], r = 26 - i * 1.4;
        if (U.dist(s.x, s.y, p.x, p.y) < r + p.r) { G.hurtPlayer(12, s); break; }
      }
    },
    tele(ctx, e, G) {
      if (e.state === 'breathAim') {
        const k = 1 - e.st2 / 0.8;
        ctx.fillStyle = `rgba(160,220,255,${0.12 + k * 0.2})`;
        ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.arc(e.x, e.y, 420, e.lock - 0.34, e.lock + 0.34); ctx.closePath(); ctx.fill();
      }
      if (e.hidden) {
        for (let i = 0; i < SEG; i += 2) {
          const s = e.segs[i];
          ctx.fillStyle = 'rgba(240,248,255,.55)'; U.ellipse(ctx, s.x, s.y, 16 - i, 9 - i * 0.5); ctx.fill();
        }
        const k = (G.time * 2) % 1;
        ctx.strokeStyle = `rgba(200,230,255,${1 - k})`; ctx.lineWidth = 3; U.circle(ctx, e.x, e.y, 14 + k * 30); ctx.stroke();
      }
    },
    draw(ctx, e, G) {
      const t = G.time, alpha = e.state === 'dive' ? Math.max(0.2, e.st / 0.6) : 1;
      ctx.globalAlpha = alpha;
      for (let i = SEG - 1; i >= 0; i--) {
        const s = e.segs[i], r = 28 - i * 1.6;
        ctx.fillStyle = 'rgba(0,0,0,.2)'; U.ellipse(ctx, s.x + 4, s.y + 10, r, r * 0.5); ctx.fill();
        ctx.fillStyle = i % 2 ? '#7fa6c4' : '#93b8d4'; U.circle(ctx, s.x, s.y, r); ctx.fill();
        ctx.fillStyle = '#e0f4ff';
        ctx.beginPath(); ctx.moveTo(s.x - 5, s.y); ctx.lineTo(s.x, s.y - r - 6); ctx.lineTo(s.x + 5, s.y); ctx.fill();
      }
      ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.face || 0);
      ctx.fillStyle = '#6e98b8'; U.ellipse(ctx, 0, 0, 44, 32); ctx.fill();
      ctx.fillStyle = '#a8cce4'; U.ellipse(ctx, 6, 0, 30, 20); ctx.fill();
      const open = e.state === 'breath' ? 0.5 : 0.15;
      ctx.fillStyle = '#20384a'; ctx.beginPath(); ctx.moveTo(30, 0); ctx.lineTo(50, -14 * open * 3); ctx.lineTo(50, 14 * open * 3); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#e8f8ff'; for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(-10, sd * 20); ctx.lineTo(-34, sd * 40); ctx.lineTo(-4, sd * 26); ctx.fill(); }
      ctx.shadowColor = '#7ef3ff'; ctx.shadowBlur = 12; ctx.fillStyle = '#c8f6ff';
      U.circle(ctx, 22, -12, 4.5); ctx.fill(); U.circle(ctx, 22, 12, 4.5); ctx.fill(); ctx.shadowBlur = 0;
      if (e.state === 'stun') { ctx.fillStyle = '#ffd56a'; for (let i = 0; i < 3; i++) { const a = t * 5 + i * 2.1; U.circle(ctx, Math.cos(a) * 34, Math.sin(a) * 34, 4); ctx.fill(); } }
      ctx.restore();
      ctx.globalAlpha = 1;
    },
  });

  /* ---------- bản đồ ---------- */
  const rng = U.seeded(404);
  const obstacles = [];
  const PINE = (L, x, y, r) => L.push({ kind: 'tree', shape: 'circle', x, y, r: r || 46 + rng() * 18, c1: '#2d4a3e', c2: '#e8f2f5', c3: '#ffffff' });
  const ICE = (L, x, y) => L.push({ kind: 'rock', shape: 'circle', x, y, r: 32 + rng() * 22, c1: '#8396a6', c2: '#d4e4f0' });
  GK.border(obstacles, rng, WW, WH, (L, x, y) => PINE(L, x, y, 52 + rng() * 18), 1100);
  const keep = [{ x: 240, y: 1100, r: 320 }, { x: 2850, y: 1100, r: 320 }, { x: 1600, y: 1100, r: 300 }, { x: 1150, y: 600, r: 180 },
    { x: 650, y: 1750, r: 120 }, { x: 1300, y: 350, r: 120 }, { x: 2350, y: 1850, r: 120 }, { x: 2700, y: 450, r: 120 }];
  GK.scatter(obstacles, rng, 18, [250, 250, WW - 250, WH - 250], keep, (L, x, y) => PINE(L, x, y));
  GK.scatter(obstacles, rng, 10, [250, 250, WW - 250, WH - 250], keep, (L, x, y) => ICE(L, x, y));
  const hazards = [{ kind: 'ice', x: 1600, y: 1100, r: 280, slip: true }];
  [[800, 900, 110], [2200, 650, 120], [2300, 1500, 130], [900, 1500, 100], [1900, 1800, 110], [500, 500, 90]].forEach(([x, y, r]) => hazards.push({ kind: 'ice', x, y, r, slip: true }));

  MB.registerGate({
    id: 4, seed: 404, view3d: true, bright: true,
    title: 'GATE 04 — SNOW', subtitle: 'Bão Tuyết',
    world: { w: WW, h: WH }, bg: '#9fb2c0', mmColor: 'rgba(200,220,235,.7)',
    scale: { hp: 1.2, dmg: 1.1 },
    start: { x: 240, y: 1100 },
    obstacles, hazards,
    crates: [{ x: 700, y: 1150 }, { x: 1250, y: 1650 }, { x: 1700, y: 400 }, { x: 2100, y: 1150 }, { x: 2600, y: 1800 }, { x: 2950, y: 700 }, { x: 420, y: 1800, rot: 0.3 }, { x: 1600, y: 1900 }],
    spawnPoints: [
      { x: 350, y: 300 }, { x: 1300, y: 230 }, { x: 2300, y: 240 }, { x: 3000, y: 300 }, { x: 3000, y: 1100 }, { x: 3000, y: 1900 },
      { x: 2250, y: 2000 }, { x: 1250, y: 2000 }, { x: 350, y: 1950 }, { x: 1100, y: 1100 }, { x: 2200, y: 1100 }, { x: 800, y: 600 },
    ],
    waves: [
      { total: 15, maxAlive: 8, mix: { zombie: 4, frostZombie: 5, iceWraith: 2 }, interval: [0.8, 1.3], elite: 0.07 },
      { total: 19, maxAlive: 10, mix: { frostZombie: 5, iceWraith: 3, spider: 3, zombie: 2 }, interval: [0.65, 1.15], elite: 0.1 },
      { total: 23, maxAlive: 11, mix: { frostZombie: 5, iceWraith: 4, licker: 2, spider: 3 }, interval: [0.55, 1.0], elite: 0.14 },
    ],
    boss: { type: 'cryoWyrm', x: 2850, y: 1100 },
    intro: { title: 'NHIỆM VỤ', text: 'Vượt vùng tuyết. Băng làm trơn trượt, bão tuyết thu hẹp tầm nhìn theo đợt.' },
    objectives: [
      { title: 'WHITEOUT', text: 'Frost Zombie chạm vào là bị đóng băng chậm: giữ khoảng cách.' },
      { title: 'FROST WINDS', text: 'Ice Wraith bay và bắn 3 mũi băng sau vạch đỏ.' },
      { title: 'GLACIER', text: 'Wave cuối trước Boss.' },
      { title: 'BOSS · CRYO WYRM', text: 'Chỉ đầu rắn nhận sát thương. Khi nó lặn, chạy khỏi vòng đỏ; bắn mạnh lúc nó choáng sau khi trồi lên.' },
    ],
    challenges: [
      { id: 'totems', type: 'destroy', name: 'Cột Băng', desc: 'Phá 4 cột băng', kind: 'totem', r: 28, hp: 230,
        spawner: { type: 'iceWraith', every: 10, range: 700, cap: 4 },
        targets: [{ x: 650, y: 1750 }, { x: 1300, y: 350 }, { x: 2350, y: 1850 }, { x: 2700, y: 450 }], reward: { weapon: 'flame' } },
      { id: 'heater', type: 'hold', name: 'Lò Sưởi', desc: 'Đứng trong vùng xanh 14 giây', zone: { x: 1150, y: 600, r: 115 }, time: 14,
        mix: { frostZombie: 2, iceWraith: 1 }, spawnEvery: 2.3, reward: { mod: 'barrel' } },
      { id: 'streak', type: 'streak', name: 'Máu Lạnh', desc: '15 hạ gục liên tiếp không trúng đòn', count: 15, reward: { mod: 'trigger' } },
    ],

    // bão tuyết theo chu kỳ
    setup(G) { G.gs.storm = 0; G.gs.stormT = 22; G.gs.flakes = []; for (let i = 0; i < 140; i++) G.gs.flakes.push({ x: Math.random(), y: Math.random(), s: 0.5 + Math.random() }); },
    update(G, dt) {
      const gs = G.gs;
      if (G.state === 'intro' || G.over) return;
      gs.stormT -= dt;
      if (gs.stormT <= 0) {
        if (gs.on) { gs.on = false; gs.stormT = U.rnd(20, 26); }
        else { gs.on = true; gs.stormT = 10; MB.HUD.toast('<b>BÃO TUYẾT</b> · tầm nhìn giảm, đi chậm hơn', '#bfe8ff'); MB.Audio.play('nova'); }
      }
      gs.storm += ((gs.on ? 1 : 0) - gs.storm) * Math.min(1, dt * 1.5);
      if (gs.storm > 0.3) G.player.zoneMul = Math.min(G.player.zoneMul, 0.85);
    },
    drawScreen(G, ctx) {
      const k = G.gs.storm || 0;
      const W = G.W, H = G.H;
      ctx.fillStyle = 'rgba(255,255,255,.8)';
      for (const f of G.gs.flakes) {
        f.x = (f.x - 0.0016 * f.s * (1 + k * 3) + 1) % 1; f.y = (f.y + 0.0012 * f.s * (1 + k * 2)) % 1;
        if (k < 0.1 && f.s < 1) continue;
        ctx.globalAlpha = 0.35 + k * 0.5;
        ctx.fillRect(f.x * W, f.y * H, 1.5 + f.s * (1 + k * 2), 1.5 + f.s);
      }
      ctx.globalAlpha = 1;
      if (k > 0.02) {
        const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.18, W / 2, H / 2, Math.max(W, H) * 0.55);
        g.addColorStop(0, 'rgba(235,245,255,0)'); g.addColorStop(1, `rgba(235,245,255,${0.88 * k})`);
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      }
    },

    buildGround(g, w, h, rand) {
      g.fillStyle = '#dfe9ef'; g.fillRect(0, 0, w, h);
      GK.patches(g, rand, w, h, 260, ['rgba(180,200,220,.35)', 'rgba(255,255,255,.5)', 'rgba(160,185,205,.25)'], 40, 140);
      GK.path(g, [[100, 1100], [700, 1000], [1300, 1180], [1900, 1000], [2500, 1180], [3100, 1100]], 110, 'rgba(170,190,205,.45)');
      for (let i = 0; i < 300; i++) { const x = rand() * w, y = rand() * h; g.fillStyle = 'rgba(140,165,185,.35)'; g.beginPath(); g.ellipse(x, y, 4, 2.5, rand() * 3, 0, Math.PI * 2); g.fill(); }
      GK.dots(g, rand, w, h, 1800, ['rgba(255,255,255,.9)', 'rgba(200,225,245,.8)'], 2.5);
      GK.strokes(g, rand, w, h, 500, ['rgba(120,140,110,.35)'], 8, 1.4);
      GK.vignette(g, w, h, 0.35);
    },

    /* ---------- 3D ---------- */
    models3d: {
      frostZombie: (K) => ({
        base: 20, anim: K.animZombie,
        build: () => K.buildZombie({ skin: 0x9ab4c8, cloth: 0x3a4a5c, shirt: 0x5a6e80, eye: 0x7ef3ff, pustule: 0xbfe8ff, hair: 0xe8f4ff,
          extra(KK, torso) { const T = KK.T, ice = KK.std(0xd8f0ff, { rough: 0.15, metal: 0.1 }); for (const [x, y, z, r] of [[-6, 14, 5, 0.5], [-5, 18, -6, -0.4], [-7, 8, -2, 0.2]]) { const c = KK.mesh(KK.G3('ish', () => new T.ConeGeometry(1.8, 8, 5)), ice, x, y, z); c.rotation.set(r, 0, 0.8); torso.add(c); } } }),
      }),
      iceWraith: (K) => ({ base: 14, anim: K.animFlyer, build: () => K.buildFlyer({ body: 0xd8f0ff, wing: 0x9fd0f0, eye: 0x2a8ad0 }) }),
      cryoWyrm: (K) => ({
        base: 42,
        build() {
          const T = K.T, g = new T.Group(), skin = K.skinMat(0x7fa6c4, { rough: 0.35, metal: 0.1 }), ice = K.std(0xe0f4ff, { rough: 0.1, metal: 0.2 });
          const head = new T.Group(); g.add(head);
          const hb = K.mesh(K.bumpy('wyh', new T.SphereGeometry(30, 24, 18), 1.2, 0.3), skin, 0, 34, 0); hb.scale.set(1.45, 0.85, 1); head.add(hb);
          const jaw = K.mesh(K.box(40, 8, 32), K.std(0x3a5a74), 26, 18, 0); head.add(jaw);
          for (const z of [-14, 14]) { head.add(K.mesh(K.sph(5, 12), K.glowMat(0xc8f6ff, 2), 30, 44, z)); const hn = K.mesh(K.G3('wyhn', () => new T.ConeGeometry(5, 34, 6)), ice, -18, 58, z * 1.4); hn.rotation.set(z > 0 ? -0.6 : 0.6, 0, 0.9); head.add(hn); }
          for (let i = 0; i < 6; i++) head.add(K.mesh(K.G3('wyt', () => new T.ConeGeometry(1.6, 7, 4)), ice, 30 + i * 3, 22, (i % 2 ? 1 : -1) * 12));
          const segs = [];
          for (let i = 0; i < SEG; i++) {
            const r = 26 - i * 1.6, sg = new T.Group();
            const b = K.mesh(K.sph(r, 16), i % 2 ? skin : K.std(0x93b8d4, { rough: 0.35 }), 0, r * 0.9, 0); sg.add(b);
            const sp = K.mesh(K.G3('wysp', () => new T.ConeGeometry(4, 18, 5)), ice, 0, r * 1.9, 0); sp.scale.setScalar(r / 26); sg.add(sp);
            g.add(sg); segs.push(sg);
          }
          g.userData = { head, segs, h: 60 };
          return g;
        },
        anim(e, m, G) {
          const d = m.userData;
          m.rotation.y = 0; d.head.rotation.y = -(e.face || 0);
          const sink = e.state === 'dive' ? (1 - e.st / 0.6) : 0;
          d.head.position.y = -sink * 60;
          d.segs.forEach((s, i) => { const p = e.segs[i]; s.position.set(p.x - e.x, -sink * 60, p.y - e.y); s.visible = !e.hidden; });
        },
      }),
    },
    props3d: {
      totem: (o, K) => {
        const T = K.T, g = new T.Group(), mt = K.std(0x7fb4d8, { own: true, emissive: 0x3aa0d0, ei: 0.4, rough: 0.12, metal: 0.2 });
        const c = K.mesh(K.G3('tot', () => new T.ConeGeometry(16, 70, 6)), mt, 0, 35, 0); g.add(c);
        for (const [x, z, s] of [[-12, 6, 0.5], [10, -8, 0.6], [6, 12, 0.4]]) { const cc = K.mesh(K.G3('tot', () => new T.ConeGeometry(16, 70, 6)), mt, x, 35 * s, z); cc.scale.setScalar(s); cc.rotation.z = x * 0.02; g.add(cc); }
        const gl = K.glowSprite(0x7ef3ff, 70, 0.45); gl.position.y = 40; g.add(gl);
        g.userData.flashMat = mt; return g;
      },
    },
    hazards3d: { ice: { inner: 'rgba(240,250,255,0.9)', outer: 'rgba(190,225,255,0.35)', add: false, opacity: 0.8, y: 0.9 } },
  });
})(window.MB);
