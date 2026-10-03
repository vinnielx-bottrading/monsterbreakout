/* Gate 17 — ĐÀ LẠT: Thành phố ngàn hoa (Màn 2 · Nguồn Gốc)
   Thắng cảnh: hồ Xuân Hương giữa đồi thông, vườn hoa thành phố (luống hoa nhiều màu), Ga Đà Lạt với ba mái nhọn
   và đoàn tàu hơi nước cổ, những dãy nhà kính trồng hoa trải dài trên đồi.
   Cơ chế: ĐOÀN TÀU chạy ngang đường ray theo đợt (còi + ray chớp đỏ báo trước) — đâm trúng rất đau, nghiền cả quái;
   hồ chặn đường đi (đạn bay qua); bướm phấn độc để lại đám phấn làm chậm + mất máu.
   Dian ở lại Đà Nẵng, liên lạc qua bộ đàm.
   Quái mới: Dây Leo Gai (luồn dưới đất rồi quất lên), Bướm Phấn Độc (bay tới tự vỡ, để lại đám phấn độc).
   Boss: ĐOÁ DÃ QUỲ KHỔNG LỒ — hoa đột biến cắm rễ giữa nhà kính số 9: dây leo quất từ dưới đất, bắn hạt hình quạt,
   tung phấn độc, gọi bướm; giai đoạn cuối xoay vòng hạt như cánh hoa. */
'use strict';
(function (MB) {
  const U = MB.U, Ens = MB.Enemies, GK = MB.GK, VN = MB.VN;
  const WW = 4000, WH = 3000;
  const H3 = 0.45;
  const LAKE = { x: 1900, y: 1450, rx: 480, ry: 270 };
  const RAIL = { y: 1150, x0: 2350, x1: WW };
  const STATION = { x: 3300, y: 900 };
  const GARDEN = { x0: 450, y0: 2050, x1: 1450, y1: 2650 };
  const ARENA = { x: 3300, y: 2350, r: 300 };
  const inLake = (x, y, pad) => ((x - LAKE.x) / (LAKE.rx + pad)) ** 2 + ((y - LAKE.y) / (LAKE.ry + pad)) ** 2 < 1;

  /* ---------- vẽ 2D ---------- */
  MB.Props.register('dlWater', () => {});
  // nhà kính: khung trắng, mái nilon mờ (vẽ đè)
  MB.Props.register('greenhouse', (ctx, o) => {
    const x = o.x - o.hw, y = o.y - o.hh;
    ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(x + 8, y + 8, o.w, o.h);
    ctx.fillStyle = '#4a7a3a'; ctx.fillRect(x, y, o.w, o.h);
    ctx.fillStyle = ['#e8483a', '#f2c63a', '#d84a8a', '#f2f2f2'][o.v % 4]; for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) { U.circle(ctx, x + 14 + i * (o.w - 28) / 5, y + 18 + j * (o.h - 36) / 2, 4); ctx.fill(); }
  });
  VN.over.greenhouse = (ctx, o, G) => {
    const x = o.x - o.hw, y = o.y - o.hh, H = 40 * H3;
    ctx.globalAlpha = VN.coverAlpha(G, x, y - H, x + o.w, y + o.h - H) * 0.85;
    ctx.fillStyle = 'rgba(235,242,245,.72)'; ctx.fillRect(x - 4, y - H, o.w + 8, o.h);
    ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 1.5; for (let xx = x; xx <= x + o.w; xx += 20) { ctx.beginPath(); ctx.moveTo(xx, y - H); ctx.lineTo(xx, y - H + o.h); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(x - 4, y - H, o.w + 8, o.h * 0.3);
    if (o.num) { ctx.fillStyle = '#2a4a2a'; ctx.font = '900 12px system-ui'; ctx.textAlign = 'center'; ctx.fillText(o.num, o.x, y - H + o.h * 0.6); }
    ctx.globalAlpha = 1;
  };
  // Ga Đà Lạt: thân vàng kem, ba mái nhọn ngói đỏ
  MB.Props.register('dlStation', (ctx, o) => {
    const x = o.x - o.hw, y = o.y - o.hh, H = 80 * H3;
    VN.shadowBox(ctx, x, y - H, o.w, o.h, 80, 0.28);
    ctx.fillStyle = '#e8d8a8'; ctx.fillRect(x, y + o.h - H, o.w, H);
    ctx.fillStyle = '#7ab0c8'; for (let i = 0; i < 9; i++) ctx.fillRect(x + 14 + i * (o.w - 28) / 9, y + o.h - H * 0.75, (o.w - 28) / 9 - 10, H * 0.5);
  });
  VN.over.dlStation = (ctx, o, G) => {
    const x = o.x - o.hw, y = o.y - o.hh, H = 80 * H3;
    ctx.globalAlpha = VN.coverAlpha(G, x, y - H - 60, x + o.w, y + o.h - H);
    ctx.fillStyle = '#b84a2a'; ctx.fillRect(x - 6, y - H, o.w + 12, o.h);
    for (let i = 0; i < 3; i++) {
      const cx = x + o.w * (0.2 + i * 0.3), w = o.w * 0.22, hh = 70;
      ctx.fillStyle = '#e8d8a8'; ctx.beginPath(); ctx.moveTo(cx - w / 2, y - H + 6); ctx.lineTo(cx, y - H - hh); ctx.lineTo(cx + w / 2, y - H + 6); ctx.fill();
      ctx.fillStyle = '#c85a32'; ctx.beginPath(); ctx.moveTo(cx - w / 2 - 6, y - H + 8); ctx.lineTo(cx, y - H - hh - 8); ctx.lineTo(cx + 4, y - H - hh + 4); ctx.lineTo(cx - w / 2 + 6, y - H + 8); ctx.fill();
      ctx.fillStyle = '#5a8aa8'; U.circle(ctx, cx, y - H - hh * 0.45, 8); ctx.fill();
    }
    ctx.fillStyle = '#5a2a14'; ctx.font = '900 13px system-ui'; ctx.textAlign = 'center'; ctx.fillText('ĐÀ LẠT', o.x, y - H + o.h * 0.7);
    ctx.globalAlpha = 1;
  };
  // luống hoa thấp (đạn bay qua)
  MB.Props.register('flowerBed', (ctx, o) => {
    const x = o.x - o.hw, y = o.y - o.hh;
    ctx.fillStyle = '#3a6a2a'; U.rr(ctx, x, y, o.w, o.h, 10); ctx.fill();
    const C = o.cols;
    for (let i = 0; i < o.w / 12; i++) for (let j = 0; j < o.h / 12; j++) { ctx.fillStyle = C[(i + j) % C.length]; U.circle(ctx, x + 6 + i * 12, y + 6 + j * 12, 4); ctx.fill(); }
  });
  // đám phấn độc
  MB.Props.registerHazard('pollen', (ctx, h, t) => {
    const a = h.life != null ? Math.min(1, h.life / 1.2) : 1;
    for (let i = 0; i < 6; i++) { const ang = i / 6 * U.TAU + t * 0.6; ctx.fillStyle = `rgba(230,210,60,${0.18 * a})`; U.circle(ctx, h.x + Math.cos(ang) * h.r * 0.4, h.y + Math.sin(ang) * h.r * 0.4, h.r * 0.6); ctx.fill(); }
    ctx.fillStyle = `rgba(250,240,120,${0.5 * a})`; for (let i = 0; i < 8; i++) U.circle(ctx, h.x + Math.sin(t * 2 + i * 7) * h.r * 0.7, h.y + Math.cos(t * 1.7 + i * 3) * h.r * 0.7, 2), ctx.fill();
  });

  /* ---------- quái mới ---------- */
  Ens.register('thornVine', Ens.make({
    name: 'Dây Leo Gai', r: 17, hp: 120, speed: 125, dmg: 20, score: 170, blood: '#2a4a1a', gore: '#9adf5a', knockMul: 0.3,
    draw(ctx, e, G) {
      if (e.hidden) return;
      const t = G.time, sway = Math.sin(t * 4 + e.t) * 0.3;
      ctx.save(); ctx.translate(e.x, e.y);
      ctx.fillStyle = 'rgba(60,40,20,.45)'; U.ellipse(ctx, 0, 6, 22, 10); ctx.fill();
      ctx.strokeStyle = '#3a6a22'; ctx.lineCap = 'round';
      for (let i = 0; i < 3; i++) {
        const a = -Math.PI / 2 + (i - 1) * 0.7 + sway;
        ctx.lineWidth = 7 - i; ctx.beginPath(); ctx.moveTo(0, 4); ctx.quadraticCurveTo(Math.cos(a) * 16, Math.sin(a) * 16 - 6, Math.cos(a + 0.4) * 30, Math.sin(a + 0.4) * 30 - 10); ctx.stroke();
        ctx.fillStyle = '#c8e87a'; for (let k = 0; k < 3; k++) { const px = Math.cos(a) * (10 + k * 7), py = Math.sin(a) * (10 + k * 7) - 4; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + 4, py - 4); ctx.lineTo(px + 1, py + 1); ctx.fill(); }
      }
      ctx.fillStyle = '#d83a8a'; U.circle(ctx, 0, -10, 6); ctx.fill(); ctx.fillStyle = '#ffd84a'; U.circle(ctx, 0, -10, 2.5); ctx.fill();
      ctx.restore();
    },
  }, Ens.AI.burrower({ emerge: 120, up: 2.2, underMul: 1.6, dirt: '#5a4a2a', ripple: '150,200,90' })));

  Ens.register('pollenMoth', Ens.make({
    name: 'Bướm Phấn Độc', r: 15, hp: 60, speed: 150, dmg: 18, score: 140, fly: true, blood: '#5a4a10', gore: '#f2e06a', knockMul: 1.2,
    draw(ctx, e, G) {
      const t = G.time, flap = Math.abs(Math.sin(t * 18 + e.t)), sw = 1 + (e.swell || 0) * 0.5;
      ctx.save(); ctx.translate(e.x, e.y); ctx.rotate((e.face || 0) + Math.PI / 2); ctx.scale(sw, sw);
      ctx.fillStyle = 'rgba(0,0,0,.18)'; U.ellipse(ctx, 6, 18, 14, 6); ctx.fill();
      for (const sd of [-1, 1]) {
        ctx.fillStyle = '#7a3ab8'; ctx.beginPath(); ctx.ellipse(sd * 9 * flap, -4, 10 * flap + 2, 12, sd * 0.4, 0, U.TAU); ctx.fill();
        ctx.fillStyle = '#f2d84a'; U.circle(ctx, sd * 10 * flap, -6, 3.4); ctx.fill();
        ctx.fillStyle = '#5a2a8a'; ctx.beginPath(); ctx.ellipse(sd * 7 * flap, 8, 6 * flap + 2, 7, -sd * 0.3, 0, U.TAU); ctx.fill();
      }
      ctx.fillStyle = '#2a1a10'; U.ellipse(ctx, 0, 0, 3, 11); ctx.fill();
      ctx.fillStyle = 'rgba(250,240,120,.6)'; for (let i = 0; i < 3; i++) U.circle(ctx, U.rnd(-8, 8), 12 + i * 4, 1.5), ctx.fill();
      ctx.restore();
    },
  }, Ens.AI.exploder({ trigger: 70, fuse: 0.45, r: 70, dmg: 14, dmgEnemies: 10, color: '#f2e06a', ring: '240,220,90', deathBlast: true,
    pool: { kind: 'pollen', r: 70, dps: 9, slowMul: 0.6, life: 4 }, wig: { f: 5, a: 0.7 } })));

  /* ---------- BOSS: ĐOÁ DÃ QUỲ KHỔNG LỒ ---------- */
  Ens.register('bloomQueen', {
    name: 'Đoá Dã Quỳ Khổng Lồ', r: 66, hp: 17500, speed: 0, dmg: 26, score: 0, boss: true, knockMul: 0, blood: '#3a2a08', gore: '#f2d84a',
    init(e) { e.phase = 1; e.state = 'idle'; e.lashT = 2; e.seedT = 4; e.pollT = 8; e.callT = 10; e.spinA = 0; e.x0 = e.x; e.y0 = e.y; },
    update(e, G, dt) {
      const p = G.player, k = e.hp / e.maxHp, ph = k > 0.66 ? 1 : k > 0.33 ? 2 : 3;
      e.x = e.x0; e.y = e.y0; e.vx = e.vy = 0;
      e.face = Math.atan2(p.y - e.y, p.x - e.x);
      if (ph > e.phase) {
        e.phase = ph; G.shake(14); MB.Audio.play('roar');
        G.banner(`PHASE ${ph}`, ph === 2 ? 'Đoá hoa tung phấn độc và gọi bầy bướm' : 'Cánh hoa xoay — mưa hạt độc!', 2);
      }
      e.lashT -= dt; e.seedT -= dt; e.pollT -= dt; e.callT -= dt;
      // dây leo quất từ dưới đất ngay chỗ Hunter (và quanh đó)
      if (e.lashT <= 0) {
        e.lashT = ph === 1 ? 3 : ph === 2 ? 2.4 : 1.9;
        const n = ph === 1 ? 2 : ph === 2 ? 3 : 4;
        for (let i = 0; i < n; i++) {
          const x = i === 0 ? p.x + p.vx * 0.5 : p.x + U.rnd(-180, 180), y = i === 0 ? p.y + p.vy * 0.5 : p.y + U.rnd(-180, 180);
          G.telegraphCircle(x, y, 62, 0.9, (GG) => {
            GG.explosion(x, y, 62, 30, { player: 22, knock: 280, color: '#7ac84a', ring: '120,200,80', small: true, obstacles: false });
            if (U.dist(GG.player.x, GG.player.y, x, y) < 70) GG.player.slow = Math.max(GG.player.slow || 0, 1);
            for (let j = 0; j < 8; j++) GG.particle({ x, y, vx: U.rnd(-120, 120), vy: U.rnd(-200, -60), life: 0.5, color: '#4a8a2a', r: 3 });
          }, 'rgba(120,200,80,.16)');
        }
      }
      // bắn hạt hình quạt
      if (e.seedT <= 0 && e.state === 'idle') {
        e.seedT = ph === 1 ? 3.6 : 2.8; e.state = 'seedAim'; e.st = 0.5; e.lock = e.face;
      }
      if (e.state === 'seedAim') {
        e.st -= dt; e.lock += U.angDiff(e.lock, e.face) * Math.min(1, dt * 3);
        if (e.st <= 0) {
          const n = 9 + ph * 2;
          for (let i = 0; i < n; i++) G.enemyShot({ x: e.x + Math.cos(e.lock) * 60, y: e.y + Math.sin(e.lock) * 60, a: e.lock + (i - (n - 1) / 2) * 0.09, speed: 360, r: 8, dmg: 11, color: '#f2c63a', owner: e, life: 2.2 });
          MB.Audio.play('spit'); e.state = 'idle';
        }
      }
      // phấn độc quanh hoa + gọi bướm
      if (ph >= 2 && e.pollT <= 0) {
        e.pollT = 9;
        for (let i = 0; i < 6; i++) { const a = i / 6 * U.TAU + U.rnd(-0.3, 0.3), d = U.rnd(160, 260); G.addHazard({ kind: 'pollen', x: e.x + Math.cos(a) * d, y: e.y + Math.sin(a) * d, r: 80, dps: 10, slowMul: 0.6, life: 6 }); }
        MB.Audio.play('spit');
      }
      if (ph >= 2 && e.callT <= 0) { e.callT = 12; for (let i = 0; i < 2 + ph; i++) { const a = U.rnd(0, U.TAU); G.spawnEnemyAt('pollenMoth', e.x + Math.cos(a) * 120, e.y + Math.sin(a) * 120, { extra: true }); } }
      // xoay vòng hạt như cánh hoa
      if (ph === 3) {
        e.spinA += dt * 1.1; e.spinT = (e.spinT || 0) - dt;
        if (e.spinT <= 0) { e.spinT = 0.16; for (let i = 0; i < 4; i++) { const a = e.spinA + i * Math.PI / 2; G.enemyShot({ x: e.x + Math.cos(a) * 60, y: e.y + Math.sin(a) * 60, a, speed: 260, r: 9, dmg: 9, color: '#ff9a3a', owner: e, life: 2.6 }); } }
      }
    },
    tele(ctx, e, G) { if (e.state === 'seedAim') { const k = 1 - e.st / 0.5; ctx.fillStyle = `rgba(255,200,60,${0.08 + k * 0.2})`; ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.arc(e.x, e.y, 520, e.lock - 0.55, e.lock + 0.55); ctx.closePath(); ctx.fill(); } },
    draw(ctx, e, G) {
      const t = G.time, x = e.x, y = e.y;
      // rễ bò khắp sàn nhà kính
      ctx.strokeStyle = '#3a5a1a'; ctx.lineCap = 'round';
      for (let i = 0; i < 10; i++) { const a = i / 10 * U.TAU + 0.2; ctx.lineWidth = 9 - (i % 3) * 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + Math.cos(a + 0.4) * 110, y + Math.sin(a + 0.4) * 110, x + Math.cos(a) * (190 + (i % 3) * 40), y + Math.sin(a) * (190 + (i % 3) * 40)); ctx.stroke(); }
      // lá to
      for (let i = 0; i < 6; i++) { const a = i / 6 * U.TAU + Math.sin(t * 0.8 + i) * 0.08; ctx.fillStyle = i % 2 ? '#3a7a2a' : '#4a8a32'; ctx.beginPath(); ctx.ellipse(x + Math.cos(a) * 95, y + Math.sin(a) * 95, 70, 26, a, 0, U.TAU); ctx.fill(); }
      // cánh hoa vàng (xoay ở giai đoạn 3)
      const rot = e.phase === 3 ? e.spinA : Math.sin(t * 0.6) * 0.1;
      for (let i = 0; i < 16; i++) { const a = rot + i / 16 * U.TAU; ctx.fillStyle = i % 2 ? '#f2c63a' : '#ffd84a'; ctx.beginPath(); ctx.ellipse(x + Math.cos(a) * 62, y + Math.sin(a) * 62, 38, 14, a, 0, U.TAU); ctx.fill(); }
      // nhuỵ đột biến tím có mắt
      const gr = ctx.createRadialGradient(x - 8, y - 8, 4, x, y, 50); gr.addColorStop(0, '#9a4ac8'); gr.addColorStop(1, '#3a1a4a');
      ctx.fillStyle = gr; U.circle(ctx, x, y, 46); ctx.fill();
      ctx.fillStyle = '#c8ff7a'; for (let i = 0; i < 18; i++) { const a = i * 2.4, r = 10 + (i % 6) * 6; U.circle(ctx, x + Math.cos(a) * r, y + Math.sin(a) * r, 2.2); ctx.fill(); }
      const eye = e.enrageT > 0 ? '#ff2a2a' : '#ffe84a';
      ctx.fillStyle = '#fff'; U.ellipse(ctx, x + Math.cos(e.face) * 10, y + Math.sin(e.face) * 10, 16, 12); ctx.fill();
      ctx.fillStyle = eye; U.circle(ctx, x + Math.cos(e.face) * 16, y + Math.sin(e.face) * 16, 7); ctx.fill();
      ctx.fillStyle = '#100808'; U.circle(ctx, x + Math.cos(e.face) * 18, y + Math.sin(e.face) * 18, 3); ctx.fill();
    },
  });

  /* ---------- bản đồ ---------- */
  const rng = U.seeded(1717);
  const obstacles = [];
  // hồ Xuân Hương (ô 50)
  const CELL = 50;
  for (let y = LAKE.y - LAKE.ry - CELL; y < LAKE.y + LAKE.ry + CELL; y += CELL) {
    let run = -1;
    for (let x = LAKE.x - LAKE.rx - CELL * 2; x <= LAKE.x + LAKE.rx + CELL * 2; x += CELL) {
      const w = inLake(x + CELL / 2, y + CELL / 2, -12);
      if (w && run < 0) run = x;
      if (!w && run >= 0) { obstacles.push({ kind: 'dlWater', shape: 'box', x: (run + x) / 2, y: y + CELL / 2, w: x - run, h: CELL + 2, rot: 0, noShot: true, water: true }); run = -1; }
    }
  }
  // Ga Đà Lạt
  obstacles.push({ kind: 'dlStation', shape: 'box', x: STATION.x, y: STATION.y, w: 420, h: 150, rot: 0, tall: 80 });
  // nhà kính quanh nhà kính số 9 (đấu trường boss)
  let n = 1;
  for (let y = 1880; y < 2850; y += 130) for (let x = 2700; x < 3900; x += 200) {
    if (Math.hypot(x - ARENA.x, y - ARENA.y) < ARENA.r + 90) continue;
    obstacles.push({ kind: 'greenhouse', shape: 'box', x, y, w: 170, h: 90, rot: 0, v: n, num: n === 9 ? '' : String(n) }); n++;
  }
  // luống hoa vườn hoa thành phố (đạn bay qua)
  const COLS = [['#e8483a', '#f2c63a'], ['#d84a8a', '#f2f2f2'], ['#7a5ac8', '#f2c63a'], ['#f28a3a', '#e8e8e8']];
  for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) obstacles.push({ kind: 'flowerBed', shape: 'box', x: GARDEN.x0 + 130 + i * 240, y: GARDEN.y0 + 110 + j * 190, w: 180, h: 70, rot: 0, noShot: true, cols: COLS[(i + j) % 4] });
  // đồi thông
  for (let i = 0; i < 120; i++) {
    const x = 60 + rng() * (WW - 120), y = 60 + rng() * (WH - 120);
    if (inLake(x, y, 120) || Math.abs(y - RAIL.y) < 90 && x > RAIL.x0 - 60 || (x > 2600 && y > 1780) || (x > GARDEN.x0 - 60 && x < GARDEN.x1 + 60 && y > GARDEN.y0 - 60 && y < GARDEN.y1 + 60)) continue;
    if (Math.abs(x - STATION.x) < 300 && Math.abs(y - STATION.y) < 160) continue;
    if (Math.hypot(x - 300, y - 1500) < 200) continue;
    if (obstacles.some((o) => o.kind === 'pine' && Math.hypot(o.x - x, o.y - y) < 110)) continue;
    obstacles.push({ kind: 'pine', shape: 'circle', x, y, r: 20 + rng() * 8, tall: 140 + rng() * 60 });
  }
  const CLUE = { x: 2950, y: 2150 };

  MB.registerGate({
    id: 17, seed: 1717, view3d: true, act: 2,
    title: 'GATE 17 — ĐÀ LẠT', subtitle: 'Thành phố ngàn hoa',
    world: { w: WW, h: WH }, bg: '#2a4a32', mmColor: 'rgba(120,170,110,.7)',
    scale: { hp: 2.7, dmg: 1.7 },
    start: { x: 300, y: 1500 },
    obstacles, hazards: [],
    crates: [{ x: 900, y: 900 }, { x: 1300, y: 1900 }, { x: 2600, y: 1500 }, { x: 2900, y: 700 }, { x: 3700, y: 1400 }, { x: 900, y: 2800 }],
    spawnPoints: [
      { x: 900, y: 400 }, { x: 1900, y: 300 }, { x: 2900, y: 400 }, { x: 3800, y: 600 }, { x: 3800, y: 1600 }, { x: 2500, y: 2000 },
      { x: 1700, y: 2300 }, { x: 600, y: 2800 }, { x: 200, y: 900 }, { x: 1200, y: 1100 }, { x: 2600, y: 2800 }, { x: 3800, y: 2850 },
    ],
    waves: [
      { total: 34, maxAlive: 15, mix: { zombie: 3, runner: 3, thornVine: 4, pollenMoth: 3, goatDrone: 1 }, interval: [0.4, 0.78], elite: 0.17 },
      { total: 38, maxAlive: 16, mix: { thornVine: 4, pollenMoth: 4, mistStalker: 2, runner: 3, riot: 2 }, interval: [0.38, 0.75], elite: 0.2 },
      { total: 42, maxAlive: 18, mix: { thornVine: 4, pollenMoth: 4, mistStalker: 3, mtGoat: 2, goatDrone: 2, riot: 2 }, interval: [0.35, 0.7], elite: 0.24 },
    ],
    boss: { type: 'bloomQueen', x: ARENA.x, y: ARENA.y, fixed: true },
    intro: { title: 'MÀN 2 · NHIỆM VỤ', text: 'Đà Lạt. Tìm nhà kính số 9 trên đồi phía Đông Nam. Coi chừng đoàn tàu ở Ga Đà Lạt — nghe còi là tránh khỏi đường ray.' },
    objectives: [
      { title: 'HỒ XUÂN HƯƠNG', text: 'Dây Leo Gai luồn dưới đất — thấy gợn đất xanh thì tránh, đợi nó quất xong rồi bắn.' },
      { title: 'GA ĐÀ LẠT', text: 'Bướm Phấn Độc vỡ ra đám phấn làm chậm: bắn từ xa. Tàu chạy theo đợt — đứng ngoài đường ray khi ray chớp đỏ.' },
      { title: 'ĐỒI NHÀ KÍNH', text: 'Wave cuối. Nhà kính số 9 ở giữa đồi.' },
      { title: 'BOSS · ĐOÁ DÃ QUỲ KHỔNG LỒ', text: 'Đoá hoa không di chuyển: giữ khoảng cách, né vòng xanh dây leo dưới chân, tránh đám phấn vàng.' },
    ],
    challenges: [
      { id: 'pods', type: 'destroy', name: 'Bầu Ươm Đầu Dê', desc: 'Phá 4 bầu ươm V-0 giấu trong vườn hoa', kind: 'goatCrate', r: 22, hp: 360,
        spawner: { type: 'pollenMoth', every: 7, range: 700, cap: 5 },
        targets: [{ x: 600, y: 2150 }, { x: 1350, y: 2550 }, { x: 2650, y: 1250 }, { x: 3850, y: 2000 }], reward: { mod: 'pierce' } },
      { id: 'station', type: 'hold', name: 'Sân Ga Đà Lạt', desc: 'Giữ sân ga 16 giây (coi chừng tàu)', zone: { x: STATION.x, y: RAIL.y - 110, r: 85 }, time: 16,
        mix: { thornVine: 2, pollenMoth: 1 }, spawnEvery: 1.5, reward: { mod: 'mag' } },
      { id: 'streak', type: 'streak', name: 'Ngàn Hoa', desc: '25 hạ gục liên tiếp không trúng đòn', count: 25, reward: { mod: 'split' } },
    ],
    clue: { x: CLUE.x, y: CLUE.y, title: 'Ghi chép số 7 — Đà Lạt', text: [
      'Ngày 41. Nhà kính số 9. Chủng V-0 đã ổn định ở 4 độ C. Tôi trồng hàng nghìn đoá dã quỳ quanh phòng lạnh — không ai nghi ngờ một vườn hoa.',
      'Hội đồng đã duyệt giai đoạn cuối: thử nghiệm diện rộng tại Sài Gòn. Mười triệu người. Không có nhóm đối chứng nào hoàn hảo hơn.',
      'Hunter đang đến gần. Đúng như tôi muốn — một người anh hùng cần một con đường để đi.',
    ] },
    comms: [
      { on: 'start', t: 2.5, lines: [['HUNTER', 'Đà Lạt… Hoa nở khắp nơi, mà sao lạnh sống lưng.']] },
      { on: 'start', t: 8, lines: [['DIAN', 'Tôi ở lại Đà Nẵng kiểm tra cảng Tiên Sa. Cậu vào nhà kính số 9 — tôi theo dõi qua bộ đàm.']] },
      { on: 'start', t: 16, lines: [['GOATEVIL', 'Thành phố ngàn hoa. Ngươi có biết hoa đẹp nhất nở trên thứ gì không, Hunter?']] },
      { on: 'wave', wave: 2, lines: [['DIAN', 'Tiếng còi tàu! Đường ray ở phía Bắc — tránh xa khi ray chớp đỏ.']] },
      { on: 'wave', wave: 3, lines: [['HUNTER', 'Dian, nhà kính ở đây có ký hiệu đầu dê. Tất cả.'], ['DIAN', '…Vậy là đúng chỗ rồi.']] },
      { on: 'low', lines: [['GOATEVIL', 'Ngươi sẽ làm phân bón rất tốt.']] },
      { on: 'boss', lines: [['GOATEVIL', 'Đoá hoa này được tưới bằng V-0 suốt mười hai năm. Nó đói lắm.'], ['HUNTER', 'Vậy để ta tỉa nó.']] },
      { on: 'phase', phase: 3, lines: [['DIAN', 'Cánh hoa đang xoay! Di chuyển theo vòng, đừng đứng yên!']] },
      { on: 'won', lines: [['HUNTER', 'Sài Gòn… mười triệu người. Dian, chúng ta phải đến đó ngay.'], ['DIAN', 'Tôi sẽ gặp cậu ở Bến Thành. Và… có chuyện tôi phải nói với cậu.']] },
    ],
    light3d: { hemiSky: 0xe8f4ff, hemiGround: 0x3a5a32, hemi: 1.4, sun: 0xfff4e0, sunI: 1.6, exposure: 1.3 },

    setup(G) {
      G.__over = null;
      G.gs.trainT = 16; G.gs.warn = 0;
      G.gs.train = { kind: 'dlTrain', x: -9999, y: RAIL.y, r: 60, run: false, hidden: true };
      G.actors.push(G.gs.train);
    },
    update(G, dt) {
      const s = G.gs, tr = s.train, p = G.player;
      if (G.state === 'fight' || G.state === 'break' || G.state === 'boss' || G.state === 'preboss') {
        if (!tr.run && s.warn <= 0) { s.trainT -= dt; if (s.trainT <= 0) { s.warn = 2.2; MB.Audio.play('boss'); MB.HUD.toast('<b>TÀU ĐẾN!</b> Tránh xa đường ray', '#ff9a4a'); } }
      }
      if (s.warn > 0) { s.warn -= dt; if (s.warn <= 0) { tr.run = true; tr.hidden = false; tr.x = RAIL.x0 - 300; } }
      if (tr.run) {
        tr.x += 620 * dt;
        const x0 = tr.x - 230, x1 = tr.x + 60;
        if (!p.dead && p.x > x0 && p.x < x1 && Math.abs(p.y - RAIL.y) < 46) G.hurtPlayer(38, { x: tr.x, y: RAIL.y + (p.y < RAIL.y ? 60 : -60) });
        for (const e of G.enemies) if (!e.dead && !e.boss && !e.fly && e.x > x0 && e.x < x1 && Math.abs(e.y - RAIL.y) < 46) G.damageEnemy(e, 900, p.y < RAIL.y ? -Math.PI / 2 : Math.PI / 2, 500);
        if (G.ally && !G.ally.down && G.ally.x > x0 && G.ally.x < x1 && Math.abs(G.ally.y - RAIL.y) < 46) MB.Ally.hurt(G, 40);
        if (Math.random() < 0.5) G.particle({ x: tr.x + 20, y: RAIL.y - 50, vx: U.rnd(-30, 30), vy: -U.rnd(40, 90), life: 1, color: 'rgba(240,240,240,.8)', r: 6 });
        if (tr.x > WW + 300) { tr.run = false; tr.hidden = true; s.trainT = U.rnd(20, 26); }
      }
    },
    drawUnder(G, ctx) {
      const t = G.time;
      // ray chớp đỏ khi tàu sắp đến
      if (G.gs.warn > 0 || G.gs.train.run) { const k = G.gs.train.run ? 0.5 : 0.3 + Math.abs(Math.sin(t * 10)) * 0.4; ctx.fillStyle = `rgba(255,60,40,${k * 0.5})`; ctx.fillRect(RAIL.x0 - 300, RAIL.y - 40, RAIL.x1 - RAIL.x0 + 300, 80); }
      // mặt hồ gợn sóng
      ctx.strokeStyle = 'rgba(255,255,255,.3)'; ctx.lineWidth = 2;
      for (let i = 0; i < 24; i++) { const a = i * 1.7 + t * 0.05, x = LAKE.x + Math.cos(a) * LAKE.rx * 0.6 * ((i % 5) / 5 + 0.2), y = LAKE.y + Math.sin(a * 1.3) * LAKE.ry * 0.6 * ((i % 4) / 4 + 0.2); ctx.beginPath(); ctx.moveTo(x - 14, y); ctx.quadraticCurveTo(x, y - 4, x + 14, y); ctx.stroke(); }
    },
    drawOver(G, ctx) { VN.drawOver(G, ctx); },
    drawScreen(G, ctx) {
      // nắng sớm se lạnh + sương mỏng
      const gr = ctx.createLinearGradient(0, 0, G.W, G.H); gr.addColorStop(0, 'rgba(255,240,200,.14)'); gr.addColorStop(1, 'rgba(160,200,240,.1)');
      ctx.fillStyle = gr; ctx.fillRect(0, 0, G.W, G.H);
    },

    buildGround(g, w, h, rand) {
      // đồi cỏ thông
      g.fillStyle = '#4a6a3a'; g.fillRect(0, 0, w, h);
      GK.patches(g, rand, w, h, 260, ['rgba(80,110,60,.35)', 'rgba(40,60,30,.3)', 'rgba(140,120,70,.15)'], 40, 160);
      // lá thông rụng
      for (let i = 0; i < 900; i++) { g.strokeStyle = 'rgba(120,90,50,.35)'; g.lineWidth = 1; const x = rand() * w, y = rand() * h, a = rand() * 3; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * 6, y + Math.sin(a) * 6); g.stroke(); }
      // đường quanh hồ + hồ
      g.strokeStyle = '#6a6458'; g.lineWidth = 70; g.beginPath(); g.ellipse(LAKE.x, LAKE.y, LAKE.rx + 90, LAKE.ry + 90, 0, 0, U.TAU); g.stroke();
      const lg = g.createRadialGradient(LAKE.x, LAKE.y, 40, LAKE.x, LAKE.y, LAKE.rx); lg.addColorStop(0, '#3a7a8a'); lg.addColorStop(1, '#2a5a6a');
      g.fillStyle = lg; g.beginPath(); g.ellipse(LAKE.x, LAKE.y, LAKE.rx, LAKE.ry, 0, 0, U.TAU); g.fill();
      g.strokeStyle = '#8a8478'; g.lineWidth = 8; g.beginPath(); g.ellipse(LAKE.x, LAKE.y, LAKE.rx + 6, LAKE.ry + 6, 0, 0, U.TAU); g.stroke();
      // đường lớn: Tây → hồ → ga → đồi nhà kính
      g.strokeStyle = '#6a6458'; g.lineWidth = 80; g.lineCap = 'round';
      g.beginPath(); g.moveTo(0, 1500); g.lineTo(LAKE.x - LAKE.rx - 90, 1500); g.moveTo(LAKE.x + LAKE.rx + 90, 1450); g.lineTo(2700, 1450); g.lineTo(3000, 1700); g.lineTo(ARENA.x, ARENA.y); g.moveTo(2700, 1450); g.lineTo(STATION.x, RAIL.y - 120); g.stroke();
      // vườn hoa
      g.fillStyle = '#5a8a3a'; g.fillRect(GARDEN.x0, GARDEN.y0, GARDEN.x1 - GARDEN.x0, GARDEN.y1 - GARDEN.y0);
      g.strokeStyle = '#c8b88a'; g.lineWidth = 16; g.strokeRect(GARDEN.x0, GARDEN.y0, GARDEN.x1 - GARDEN.x0, GARDEN.y1 - GARDEN.y0);
      // ga + đường ray (tà vẹt gỗ, 2 ray thép)
      g.fillStyle = '#9a9488'; g.fillRect(STATION.x - 300, STATION.y + 60, 600, RAIL.y - STATION.y - 90);
      g.fillStyle = '#5a4a3a'; for (let x = RAIL.x0 - 300; x < RAIL.x1; x += 22) g.fillRect(x, RAIL.y - 30, 10, 60);
      g.fillStyle = '#a8a8aa'; g.fillRect(RAIL.x0 - 300, RAIL.y - 20, RAIL.x1 - RAIL.x0 + 300, 5); g.fillRect(RAIL.x0 - 300, RAIL.y + 15, RAIL.x1 - RAIL.x0 + 300, 5);
      // đồi nhà kính: đất đỏ bazan
      g.fillStyle = 'rgba(150,80,50,.5)'; g.fillRect(2600, 1780, 1400, 1220);
      // nhà kính số 9 đổ nát: sàn kính vỡ
      g.fillStyle = '#7a6a4a'; g.beginPath(); g.arc(ARENA.x, ARENA.y, ARENA.r, 0, U.TAU); g.fill();
      g.strokeStyle = 'rgba(220,240,250,.6)'; g.lineWidth = 2; for (let i = 0; i < 40; i++) { const a = rand() * U.TAU, r = rand() * ARENA.r; const x = ARENA.x + Math.cos(a) * r, y = ARENA.y + Math.sin(a) * r; g.beginPath(); g.moveTo(x, y); g.lineTo(x + rand() * 14 - 7, y + rand() * 14 - 7); g.stroke(); }
      g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 6; g.strokeRect(ARENA.x - ARENA.r, ARENA.y - ARENA.r, ARENA.r * 2, ARENA.r * 2);
      g.fillStyle = '#ffffff'; g.font = '900 60px system-ui'; g.textAlign = 'center'; g.globalAlpha = 0.25; g.fillText('9', ARENA.x, ARENA.y - ARENA.r + 70); g.globalAlpha = 1;
      GK.vignette(g, w, h, 0.35);
    },

    /* ---------- 3D ---------- */
    models3d: {
      thornVine: (K) => ({
        base: 17,
        build() {
          const T = K.T, g = new T.Group(), vine = K.std(0x3a6a22, { rough: 0.8 }), vines = [];
          for (let i = 0; i < 3; i++) { const v = K.mesh(K.cyl(2.5 - i * 0.4, 1, 34, 6), vine, 0, 16, 0); v.rotation.z = (i - 1) * 0.5; v.rotation.x = (i - 1) * 0.3; g.add(v); vines.push(v); }
          g.add(K.mesh(K.sph(6, 8), K.std(0xd83a8a), 0, 34, 0), K.mesh(K.sph(2.5, 6), K.std(0xffd84a), 4, 35, 0));
          g.userData = { vines, h: 36 }; return g;
        },
        anim(e, m, G) { m.userData.vines.forEach((v, i) => { v.rotation.z = (i - 1) * 0.5 + Math.sin(G.time * 4 + i + e.t) * 0.2; }); m.visible = !e.hidden; },
      }),
      pollenMoth: (K) => ({
        base: 15,
        build() {
          const T = K.T, g = new T.Group(), body = new T.Group(); body.position.y = 30; g.add(body);
          body.add(K.mesh(K.cyl(2, 2, 18, 6), K.std(0x2a1a10), 0, 0, 0)); body.children[0].rotation.z = Math.PI / 2;
          const wings = [];
          for (const sd of [-1, 1]) { const w = K.mesh(K.box(16, 1, 14), K.std(0x7a3ab8, { own: true, emissive: 0x3a1a5a, ei: 0.6 }), 0, 0, sd * 9); body.add(w); wings.push(w); w.add(K.mesh(K.sph(3, 6), K.glowMat(0xf2d84a, 1.5), 0, 1, sd * 2, false)); }
          body.add(K.glowSprite(0xf2e06a, 40, 0.4));
          g.userData = { wings, body, h: 34 }; return g;
        },
        anim(e, m, G) { const f = Math.sin(G.time * 18 + e.t) * 0.9; m.userData.wings.forEach((w, i) => { w.rotation.x = (i ? 1 : -1) * f; }); m.userData.body.scale.setScalar(1 + (e.swell || 0) * 0.5); },
      }),
      bloomQueen: (K) => ({
        base: 66,
        build() {
          const T = K.T, g = new T.Group(), leaf = K.std(0x3a7a2a, { flat: true, rough: 0.8 });
          g.add(K.mesh(K.cyl(14, 20, 70, 10), K.std(0x3a5a1a), 0, 35, 0));
          for (let i = 0; i < 6; i++) { const l = K.mesh(K.sph(1, 8), leaf, Math.cos(i) * 80, 12, Math.sin(i) * 80); l.scale.set(70, 6, 26); l.rotation.y = -i; g.add(l); }
          const head = new T.Group(); head.position.y = 78; g.add(head);
          const petals = new T.Group(); head.add(petals);
          for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2, p = K.mesh(K.sph(1, 8), K.std(i % 2 ? 0xf2c63a : 0xffd84a, { rough: 0.6 }), Math.cos(a) * 64, 0, Math.sin(a) * 64); p.scale.set(38, 5, 14); p.rotation.y = -a; petals.add(p); }
          const core = K.mesh(K.sph(46, 16), K.std(0x5a2a7a, { own: true, emissive: 0x2a0a3a, ei: 0.6 }), 0, 6, 0); core.scale.y = 0.5; head.add(core);
          const eye = K.mesh(K.sph(14, 12), K.std(0xffffff), 0, 22, 0); head.add(eye);
          const pupil = K.mesh(K.sph(7, 10), K.glowMat(0xffe84a, 2.4), 10, 28, 0, false); head.add(pupil);
          g.userData = { petals, head, pupil, h: 110 }; return g;
        },
        anim(e, m, G) { const d = m.userData; d.petals.rotation.y = e.phase === 3 ? -e.spinA : Math.sin(G.time * 0.6) * 0.1; d.head.rotation.z = Math.sin(G.time * 0.8) * 0.05; d.pupil.material.color.setHex(e.enrageT > 0 ? 0xff2a2a : 0xffe84a); },
      }),
    },
    props3d: {
      dlWater: (o, K) => new K.T.Group(),
      greenhouse: (o, K) => {
        const T = K.T, g = new T.Group(), film = K.std(0xe8f0f4, { own: true, transparent: true, opacity: 0.55, rough: 0.2 });
        g.add(K.mesh(K.box(o.w, 2, o.h), K.std(0x4a7a3a), 0, 1, 0));
        const roof = new T.Mesh(K.G3('ghroof', () => new T.CylinderGeometry(1, 1, 1, 12, 1, false, 0, Math.PI)), film);
        roof.scale.set(o.h / 2, o.w, o.h / 2); roof.rotation.z = Math.PI / 2; roof.rotation.y = 0; roof.position.y = 18; g.add(roof);
        g.add(K.mesh(K.box(o.w, 18, 1), film, 0, 9, o.h / 2), K.mesh(K.box(o.w, 18, 1), film, 0, 9, -o.h / 2));
        g.userData.canopy = [film]; return g;
      },
      dlStation: (o, K) => {
        const T = K.T, g = new T.Group(), wall = K.std(0xe8d8a8, { rough: 0.8 }), roof = K.std(0xc85a32, { own: true, transparent: true, rough: 0.7 });
        g.add(K.mesh(K.box(o.w, 46, o.h), wall, 0, 23, 0));
        for (let i = 0; i < 9; i++) g.add(K.mesh(K.box((o.w - 28) / 9 - 10, 22, 1), K.std(0x7ab0c8, { metal: 0.5, rough: 0.2 }), -o.hw + 14 + (i + 0.5) * (o.w - 28) / 9, 26, o.h / 2 + 1));
        g.add(K.mesh(K.box(o.w + 12, 6, o.h + 10), roof, 0, 49, 0));
        for (let i = 0; i < 3; i++) {
          const x = -o.hw + o.w * (0.2 + i * 0.3);
          const r = new T.Mesh(K.G3('dlroof', () => new T.ConeGeometry(1, 1, 4)), roof); r.scale.set(o.w * 0.14, 80, o.h * 0.45); r.position.set(x, 92, 0); r.rotation.y = Math.PI / 4; g.add(r);
        }
        g.userData.canopy = [roof]; return g;
      },
      flowerBed: (o, K) => {
        const T = K.T, g = new T.Group();
        g.add(K.mesh(K.box(o.w, 8, o.h), K.std(0x3a6a2a), 0, 4, 0));
        const cols = o.cols.map((c) => K.std(new T.Color(c).getHex(), { rough: 0.6 }));
        for (let i = 0; i < o.w / 18; i++) for (let j = 0; j < o.h / 18; j++) g.add(K.mesh(K.sph(4, 5), cols[(i + j) % cols.length], -o.hw + 9 + i * 18, 11, -o.hh + 9 + j * 18, false));
        return g;
      },
    },
    hazards3d: { pollen: { inner: 'rgba(250,230,90,.75)', outer: 'rgba(240,210,60,0)', opacity: 0.6 } },
    actors3d: Object.assign({
      dlTrain: (a, K) => {
        const T = K.T, g = new T.Group(), body = K.std(0x2a3a2a, { metal: 0.4, rough: 0.5 }), red = K.std(0xa82a1a);
        g.add(K.mesh(K.box(110, 44, 50), body, 0, 32, 0)); const boiler = K.mesh(K.cyl(22, 22, 70, 12), body, 70, 34, 0); boiler.rotation.z = Math.PI / 2; g.add(boiler);
        g.add(K.mesh(K.cyl(7, 9, 30, 8), K.std(0x1a1a1a), 95, 66, 0), K.mesh(K.box(30, 6, 54), red, 112, 12, 0));
        for (const x of [-150, -260]) { g.add(K.mesh(K.box(100, 40, 48), K.std(0x7a3a24, { rough: 0.6 }), x, 30, 0)); for (let i = 0; i < 4; i++) g.add(K.mesh(K.box(16, 12, 49), K.std(0xe8d8a8), x - 36 + i * 24, 36, 0)); }
        for (const x of [-30, 30, 70, -170, -130, -280, -240]) for (const z of [-24, 24]) { const w = K.mesh(K.cyl(10, 10, 6, 12), K.std(0x1a1a1a, { metal: 0.6 }), x, 10, z); w.rotation.x = Math.PI / 2; g.add(w); }
        g.add(K.glowSprite(0xfff0c0, 60, 0.9)); g.children[g.children.length - 1].position.set(118, 34, 0);
        g.userData.anim = (aa, m) => { m.visible = !aa.hidden; m.position.set(aa.x - 60, 0, aa.y); };
        return g;
      },
    }, MB.Story.actors3d),
  });
  // 2D: đoàn tàu hơi nước
  MB.Props.registerActor('dlTrain', (ctx, a, G) => {
    if (a.hidden) return;
    const x = a.x, y = a.y;
    ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(x - 330, y - 20, 400, 50);
    for (const cx of [-160, -270]) { ctx.fillStyle = '#7a3a24'; U.rr(ctx, x + cx - 50, y - 30, 100, 52, 6); ctx.fill(); ctx.fillStyle = '#e8d8a8'; for (let i = 0; i < 4; i++) ctx.fillRect(x + cx - 40 + i * 22, y - 22, 14, 10); }
    ctx.fillStyle = '#2a3a2a'; U.rr(ctx, x - 60, y - 32, 120, 56, 8); ctx.fill();
    ctx.fillStyle = '#3a4a3a'; U.circle(ctx, x + 40, y - 4, 24); ctx.fill();
    ctx.fillStyle = '#a82a1a'; ctx.fillRect(x + 56, y - 26, 10, 48);
    ctx.fillStyle = '#1a1a1a'; U.circle(ctx, x + 40, y - 40, 9); ctx.fill();
    ctx.fillStyle = 'rgba(255,240,180,.9)'; U.circle(ctx, x + 66, y - 4, 5); ctx.fill();
    void G;
  });
})(window.MB);
