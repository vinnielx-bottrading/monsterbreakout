/* Gate 21 — CĂN CỨ ALPHA: Nơi tất cả bắt đầu (Màn 2 · Nguồn Gốc · trận cuối chu kỳ)
   Hunter và Dian trở lại Căn cứ Alpha — nơi "xác" Giáo sư Ted được tìm thấy ở đầu Màn 2.
   Bản đồ: phòng máy chủ, phòng bồn mẫu, văn phòng, phòng thí nghiệm của Ted, sảnh lõi phản ứng (đấu trường).
   Cơ chế: CỬA LASER AN NINH — lưới laser ở các cửa thông phòng bật/tắt theo nhịp (chớp đỏ báo trước),
   chạm vào lúc bật thì bỏng và bị đẩy lùi (quái cũng vậy).
   Quái mới: Lính Alpha (khiên trước, bắn loạt), Bản Sao V-0 (lao nhanh, nổ ra vũng virus).
   Boss: GS. TED · GIÁP ALPHA — bộ giáp trợ lực: súng gatling quét, mưa tên lửa, lao vai; giai đoạn 2 bay lên bằng
   động cơ phản lực, gọi bản sao V-0 (và bắn hạ Dian); giai đoạn 3 lõi quá tải: 4 tia laser xoay + vòng đạn sau mỗi cú lao. */
'use strict';
(function (MB) {
  const U = MB.U, Ens = MB.Enemies, GK = MB.GK, VN = MB.VN;
  const WW = 3600, WH = 2800;
  const ARENA = { x: 3000, y: 700, r: 400 };
  const T = 44;                                          // độ dày tường
  const DOOR = 170;
  // tường: dọc x=1200, x=2400 (cửa ở y 700, 2100); ngang y=1400 (cửa ở x 600, 1800, 3000)
  const LASERS = [
    { x0: 1200, y0: 700 - DOOR / 2, x1: 1200, y1: 700 + DOOR / 2, ph: 0 },
    { x0: 1200, y0: 2100 - DOOR / 2, x1: 1200, y1: 2100 + DOOR / 2, ph: 1.6 },
    { x0: 2400, y0: 700 - DOOR / 2, x1: 2400, y1: 700 + DOOR / 2, ph: 2.4 },
    { x0: 2400, y0: 2100 - DOOR / 2, x1: 2400, y1: 2100 + DOOR / 2, ph: 0.8 },
    { x0: 600 - DOOR / 2, y0: 1400, x1: 600 + DOOR / 2, y1: 1400, ph: 3.2 },
    { x0: 1800 - DOOR / 2, y0: 1400, x1: 1800 + DOOR / 2, y1: 1400, ph: 0.4 },
    { x0: 3000 - DOOR / 2, y0: 1400, x1: 3000 + DOOR / 2, y1: 1400, ph: 2 },
  ];
  const CYC = 5;           // chu kỳ laser: 2.6 s bật · 0.6 s chớp báo · còn lại tắt
  const laserState = (L, t) => { const k = (t + L.ph) % CYC; return k < 2.6 ? 'on' : k > CYC - 0.6 ? 'warn' : 'off'; };
  const segDist = (px, py, L) => { const dx = L.x1 - L.x0, dy = L.y1 - L.y0, k = U.clamp(((px - L.x0) * dx + (py - L.y0) * dy) / (dx * dx + dy * dy), 0, 1); return Math.hypot(px - (L.x0 + dx * k), py - (L.y0 + dy * k)); };

  /* ---------- quái mới ---------- */
  Ens.register('labSoldier', Ens.make({
    name: 'Lính Alpha', r: 18, hp: 190, speed: 95, dmg: 12, score: 220, blood: '#2a0a0a', gore: '#ff7a7a', knockMul: 0.5,
    armorFn: Ens.AI.shieldFront(0.35, 0.8),
    draw(ctx, e, G) {
      const t = G.time, aim = e.state === 'aim', mv = Math.hypot(e.vx, e.vy) > 15, w = mv ? Math.sin(t * 10 + e.t) * 4 : 0;
      ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.face || 0);
      ctx.fillStyle = 'rgba(0,0,0,.28)'; U.ellipse(ctx, 3, 5, 20, 15); ctx.fill();
      ctx.fillStyle = '#1a1a20'; U.ellipse(ctx, -4 + w, -9, 7, 5); ctx.fill(); U.ellipse(ctx, -4 - w, 9, 7, 5); ctx.fill();
      ctx.fillStyle = '#e8eef2'; U.ellipse(ctx, -2, 0, 13, 15); ctx.fill();
      ctx.fillStyle = '#c83a3a'; ctx.fillRect(-8, -3, 12, 6);
      ctx.fillStyle = '#2a2a32'; ctx.fillRect(4, 4, 22, 5);
      // khiên chống đạn
      ctx.fillStyle = 'rgba(160,210,255,.35)'; ctx.strokeStyle = 'rgba(200,230,255,.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 22, -0.8, 0.8); ctx.lineTo(Math.cos(0.8) * 14, Math.sin(0.8) * 14); ctx.arc(0, 0, 14, 0.8, -0.8, true); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#d8dee2'; U.circle(ctx, 4, -2, 7); ctx.fill(); ctx.fillStyle = aim ? '#ff3a3a' : '#3af0ff'; ctx.fillRect(7, -5, 4, 6);
      ctx.restore();
    },
  }, Ens.AI.shooter({ cd: [2.2, 3.2], min: 180, max: 460, aim: 0.6, lineLen: 460,
    shot: (e, G, a) => { MB.Audio.play('shot_smg'); for (let i = 0; i < 4; i++) setTimeout(() => { if (!e.dead && G.running) G.enemyShot({ x: e.x, y: e.y, a: a + U.rnd(-0.04, 0.04), speed: 620, r: 5, dmg: 8, color: '#ff8a5c', owner: e }); }, i * 85); } })));

  Ens.register('v0Clone', Ens.make({
    name: 'Bản Sao V-0', r: 15, hp: 70, speed: 205, dmg: 18, score: 150, blood: '#1a3a10', gore: '#9aff5a', knockMul: 1.1,
    draw(ctx, e, G) {
      const t = G.time, sw = 1 + (e.swell || 0) * 0.5, w = Math.sin(t * 16 + e.t) * 5;
      ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.face || 0); ctx.scale(sw, sw);
      ctx.fillStyle = 'rgba(0,0,0,.25)'; U.ellipse(ctx, 3, 5, 16, 12); ctx.fill();
      ctx.fillStyle = '#7a8a6a'; U.ellipse(ctx, -4 + w, -8, 6, 4); ctx.fill(); U.ellipse(ctx, -4 - w, 8, 6, 4); ctx.fill();
      ctx.fillStyle = '#a8b098'; U.ellipse(ctx, 0, 0, 11, 13); ctx.fill();
      ctx.strokeStyle = '#7aff4a'; ctx.lineWidth = 1.5; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(i * 1.6) * 11, Math.sin(i * 1.6) * 12); ctx.stroke(); }
      ctx.fillStyle = `rgba(150,255,90,${0.6 + Math.sin(t * 8) * 0.4})`; U.circle(ctx, -2, 0, 5); ctx.fill();
      ctx.fillStyle = '#b8c0a8'; U.circle(ctx, 9, 0, 6); ctx.fill(); ctx.fillStyle = '#c8ff5a'; U.circle(ctx, 12, -2, 1.5); ctx.fill(); U.circle(ctx, 12, 2, 1.5); ctx.fill();
      ctx.restore();
    },
  }, Ens.AI.exploder({ trigger: 60, fuse: 0.4, r: 72, dmg: 16, dmgEnemies: 10, color: '#9aff5a', ring: '150,255,90', deathBlast: true,
    pool: { kind: 'virus', r: 60, dps: 9, life: 4 }, wig: { f: 6, a: 0.5 } })));

  /* ---------- BOSS: GS. TED · GIÁP ALPHA ---------- */
  const inArena = (x, y) => ({ x: U.clamp(x, ARENA.x - ARENA.r + 70, ARENA.x + ARENA.r - 70), y: U.clamp(y, ARENA.y - ARENA.r + 70, ARENA.y + ARENA.r - 70) });
  Ens.register('tedAlpha', {
    name: 'GS. Ted · Giáp Alpha', r: 50, hp: 22000, speed: 105, dmg: 30, score: 0, boss: true, knockMul: 0, blood: '#2a1a1a', gore: '#ffb84a',
    init(e) { e.phase = 1; e.state = 'walk'; e.gunT = 2; e.misT = 4; e.dashT = 6; e.callT = 2; e.beamA = 0; e.jetT = 3; },
    armorFn(e, dmg) { return e.state === 'jet' ? dmg * 0.4 : dmg; },
    update(e, G, dt) {
      const p = G.player, k = e.hp / e.maxHp, ph = k > 0.66 ? 1 : k > 0.33 ? 2 : 3, d = Ens.distPlayer(e, G);
      if (ph > e.phase) {
        e.phase = ph; G.shake(16); MB.Audio.play('roar');
        if (ph === 2) {
          G.banner('PHASE 2', 'Động cơ phản lực — Ted bay lên và gọi bản sao V-0', 2.2);
          e.state = 'jet'; e.st = 6; e.fireT = 0.6;
          // Ted bắn hạ Dian (Dian vẫn cứu được)
          if (G.ally && !G.ally.down) setTimeout(() => { if (G.running && G.ally && !G.ally.down) { G.enemyShot({ x: e.x, y: e.y, a: Math.atan2(G.ally.y - e.y, G.ally.x - e.x), speed: 900, r: 8, dmg: 0, color: '#ffb84a', owner: e, life: 1 }); MB.Ally.hurt(G, 9999); } }, 3500);
        } else { G.banner('PHASE 3', 'Lõi Alpha quá tải — tia laser xoay!', 2.2); e.state = 'walk'; }
      }
      if (ph >= 2) { e.callT -= dt; if (e.callT <= 0) { e.callT = ph === 2 ? 9 : 12; for (let i = 0; i < 3; i++) { const a = U.rnd(0, U.TAU), q = inArena(e.x + Math.cos(a) * 200, e.y + Math.sin(a) * 200); G.spawnEnemyAt('v0Clone', q.x, q.y, { extra: true }); } } }
      if (ph === 3) {
        // 4 tia laser xoay quanh Ted
        e.beamA += dt * 0.7; e.beamF = (e.beamF || 0) - dt;
        if (e.beamF <= 0) { e.beamF = 0.09; for (let i = 0; i < 4; i++) { const a = e.beamA + i * Math.PI / 2; G.enemyShot({ x: e.x + Math.cos(a) * 46, y: e.y + Math.sin(a) * 46, a, speed: 560, r: 8, dmg: 8, color: '#ff4a3a', owner: e, life: 0.9 }); } }
      }
      e.gunT -= dt; e.misT -= dt; e.dashT -= dt;
      if (e.state === 'walk') {
        const a = Math.atan2(e.y - p.y, e.x - p.x) + 0.5, q = inArena(p.x + Math.cos(a) * 280, p.y + Math.sin(a) * 280);
        Ens.steer(e, G, d > 200 ? q.x : e.x + (e.x - p.x), d > 200 ? q.y : e.y + (e.y - p.y), e.speed * (ph === 3 ? 1.3 : 1), dt);
        e.face = Ens.toPlayer(e, G);
        if (e.dashT <= 0 && d > 160 && d < 600) { e.state = 'dashAim'; e.st = 0.7; e.lock = Ens.toPlayer(e, G); MB.Audio.play('growl'); }
        else if (e.misT <= 0) { e.state = 'missile'; e.st = 0.5; MB.Audio.play('boss'); }
        else if (e.gunT <= 0 && d < 650) { e.state = 'gunAim'; e.st = 0.6; e.lock = Ens.toPlayer(e, G); }
      } else if (e.state === 'gunAim') {
        Ens.stop(e, dt, 12); e.st -= dt; e.lock += U.angDiff(e.lock, Ens.toPlayer(e, G)) * Math.min(1, dt * 4); e.face = e.lock;
        if (e.st <= 0) { e.state = 'gun'; e.st = 1.8; e.fireT = 0; MB.Audio.play('shot_smg'); }
      } else if (e.state === 'gun') {
        Ens.stop(e, dt, 12); e.st -= dt; e.fireT -= dt;
        e.lock += U.clamp(U.angDiff(e.lock, Ens.toPlayer(e, G)), -dt * 1.1, dt * 1.1); e.face = e.lock;
        if (e.fireT <= 0) { e.fireT = 0.06; G.enemyShot({ x: e.x + Math.cos(e.lock) * 50, y: e.y + Math.sin(e.lock) * 50, a: e.lock + U.rnd(-0.06, 0.06), speed: 680, r: 6, dmg: 7, color: '#ffd84a', owner: e, life: 1.2 }); if (Math.random() < 0.3) MB.Audio.play('shot_smg'); }
        if (e.st <= 0) { e.state = 'walk'; e.gunT = ph === 1 ? 3.6 : 2.8; }
      } else if (e.state === 'missile') {
        Ens.stop(e, dt, 12); e.st -= dt;
        if (e.st <= 0) {
          const n = ph === 1 ? 4 : 6;
          for (let i = 0; i < n; i++) {
            const x = i === 0 ? p.x + p.vx * 0.6 : p.x + U.rnd(-240, 240), y = i === 0 ? p.y + p.vy * 0.6 : p.y + U.rnd(-200, 200);
            G.telegraphCircle(x, y, 80, 1.1 + i * 0.12, (GG) => GG.explosion(x, y, 80, 40, { player: 20, knock: 260, color: '#ffb84a', ring: '255,180,90', small: true, obstacles: false }), 'rgba(255,150,60,.16)');
          }
          e.state = 'walk'; e.misT = ph === 1 ? 6 : 4.5;
        }
      } else if (e.state === 'dashAim') {
        Ens.stop(e, dt, 14); e.st -= dt; e.lock += U.angDiff(e.lock, Ens.toPlayer(e, G)) * Math.min(1, dt * 2); e.face = e.lock;
        if (e.st <= 0) { e.state = 'dash'; e.st = 0.5; e.vx = Math.cos(e.lock) * 760; e.vy = Math.sin(e.lock) * 760; MB.Audio.play('dash'); }
      } else if (e.state === 'dash') {
        e.st -= dt; e.face = e.lock;
        if (!p.dead && U.dist(e.x, e.y, p.x, p.y) < e.r + p.r + 6 && !e.hitP) { e.hitP = true; G.hurtPlayer(32, e); p.vx += Math.cos(e.lock) * 520; p.vy += Math.sin(e.lock) * 520; }
        if (e.st <= 0 || e.bumped) {
          e.state = 'walk'; e.hitP = false; e.dashT = ph === 1 ? 6 : 4.5; G.shake(8);
          G.shockwave(e.x, e.y, 200, 0.6, 16, 'rgba(255,180,90,.8)');
          if (ph === 3) for (let i = 0; i < 18; i++) { const a = i / 18 * U.TAU; G.enemyShot({ x: e.x, y: e.y, a, speed: 320, r: 8, dmg: 10, color: '#ff7a3a', owner: e, life: 2 }); }
        }
      } else if (e.state === 'jet') {
        // bay vòng quanh đấu trường, rải đạn xuống
        e.st -= dt; e.fireT -= dt; e.airborne = true;
        const a = G.time * 0.9, q = { x: ARENA.x + Math.cos(a) * (ARENA.r - 110), y: ARENA.y + Math.sin(a) * (ARENA.r - 110) };
        e.vx += ((q.x - e.x) * 2 - e.vx) * Math.min(1, dt * 3); e.vy += ((q.y - e.y) * 2 - e.vy) * Math.min(1, dt * 3);
        e.face = Ens.toPlayer(e, G);
        if (e.fireT <= 0) { e.fireT = 0.5; const aa = Ens.toPlayer(e, G); for (let i = -2; i <= 2; i++) G.enemyShot({ x: e.x, y: e.y, a: aa + i * 0.15, speed: 420, r: 7, dmg: 9, color: '#ffb84a', owner: e, life: 1.8 }); }
        if (e.st <= 0) { e.airborne = false; e.state = 'walk'; G.explosion(e.x, e.y, 130, 0, { player: 24, knock: 300, color: '#ffb84a', ring: '255,180,90', obstacles: false, enemies: false }); }
      }
    },
    tele(ctx, e, G) {
      if (e.state === 'gunAim') G.drawTelegraphLine(ctx, e.x, e.y, e.lock, 600, 1 - e.st / 0.6);
      if (e.state === 'dashAim') G.drawTelegraphLine(ctx, e.x, e.y, e.lock, 380, 1 - e.st / 0.7);
    },
    draw(ctx, e, G) {
      const t = G.time, mv = Math.hypot(e.vx, e.vy) > 20, walk = mv && !e.airborne ? Math.sin(t * 7) : 0, lift = e.airborne ? 40 + Math.sin(t * 4) * 6 : 0;
      ctx.fillStyle = 'rgba(0,0,0,.35)'; U.ellipse(ctx, e.x + 8, e.y + 14, 50, 26); ctx.fill();
      ctx.save(); ctx.translate(e.x, e.y - lift); ctx.rotate(e.face || 0);
      if (e.airborne) { for (const sd of [-1, 1]) { ctx.fillStyle = `rgba(255,${150 + Math.random() * 80},60,.8)`; ctx.beginPath(); ctx.moveTo(-26, sd * 16 - 6); ctx.lineTo(-56 - Math.random() * 20, sd * 16); ctx.lineTo(-26, sd * 16 + 6); ctx.fill(); } }
      // chân giáp
      ctx.fillStyle = '#3a3a42'; U.rr(ctx, -20 + walk * 10, -30, 26, 16, 6); ctx.fill(); U.rr(ctx, -20 - walk * 10, 14, 26, 16, 6); ctx.fill();
      // thân giáp
      const gr = ctx.createLinearGradient(-30, -30, 30, 30); gr.addColorStop(0, '#d8dce0'); gr.addColorStop(1, '#6a707a');
      ctx.fillStyle = gr; U.rr(ctx, -30, -34, 54, 68, 14); ctx.fill();
      ctx.fillStyle = '#c8302a'; ctx.fillRect(-26, -4, 46, 8);
      // vai + súng gatling (phải), bệ tên lửa (trái)
      ctx.fillStyle = '#4a4e56'; U.rr(ctx, -8, 26, 30, 18, 6); ctx.fill(); U.rr(ctx, -8, -44, 30, 18, 6); ctx.fill();
      ctx.fillStyle = '#2a2a30'; for (let i = 0; i < 3; i++) ctx.fillRect(20, 30 + i * 4, 36, 3);
      ctx.fillStyle = '#5a5e66'; ctx.fillRect(-4, -48, 22, 10); ctx.fillStyle = '#ffb84a'; for (let i = 0; i < 3; i++) U.circle(ctx, 0 + i * 7, -43, 2.5), ctx.fill();
      // buồng lái: GS Ted (tóc bạc, kính)
      ctx.fillStyle = 'rgba(160,220,255,.35)'; U.circle(ctx, 8, 0, 18); ctx.fill();
      ctx.fillStyle = '#c9a68a'; U.circle(ctx, 10, 0, 10); ctx.fill();
      ctx.fillStyle = '#e8e8e8'; ctx.beginPath(); ctx.arc(7, 0, 10, Math.PI * 0.6, Math.PI * 1.4); ctx.fill();
      ctx.strokeStyle = '#111'; ctx.lineWidth = 1.5; ctx.strokeRect(14, -6, 4, 4); ctx.strokeRect(14, 2, 4, 4);
      // lõi Alpha sau lưng
      const pulse = e.phase === 3 ? 0.6 + Math.sin(t * 14) * 0.4 : 0.5 + Math.sin(t * 4) * 0.3;
      ctx.fillStyle = e.phase === 3 ? `rgba(255,80,60,${pulse})` : `rgba(90,220,255,${pulse})`; U.circle(ctx, -22, 0, 9); ctx.fill();
      if (e.phase === 3) { ctx.strokeStyle = 'rgba(255,120,60,.7)'; ctx.lineWidth = 2; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-22, 0); ctx.lineTo(-22 + U.rnd(-30, 30), U.rnd(-30, 30)); ctx.stroke(); } }
      ctx.restore();
    },
  });

  /* ---------- bản đồ ---------- */
  const obstacles = [];
  const W = (x, y, w, h) => obstacles.push({ kind: 'labwall', shape: 'box', x, y, w, h, rot: 0 });
  const vwall = (x, gaps) => { let y = 0; for (const g of [...gaps, WH + DOOR / 2]) { const y2 = Math.min(WH, g - DOOR / 2); if (y2 - y > 10) W(x, (y + y2) / 2, T, y2 - y); y = g + DOOR / 2; } };
  const hwall = (y, gaps) => { let x = 0; for (const g of [...gaps, WW + DOOR / 2]) { const x2 = Math.min(WW, g - DOOR / 2); if (x2 - x > 10) W((x + x2) / 2, y, x2 - x, T); x = g + DOOR / 2; } };
  vwall(1200, [700, 2100]); vwall(2400, [700, 2100]); hwall(1400, [600, 1800, 3000]);
  // phòng máy chủ (Tây Bắc)
  for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) obstacles.push({ kind: 'server', shape: 'circle', x: 220 + i * 240, y: 380 + j * 560, r: 26 });
  // phòng bồn mẫu (giữa Bắc)
  for (const [x, y] of [[1450, 300], [1700, 300], [1950, 300], [2200, 300], [1450, 1100], [1700, 1100], [1950, 1100], [2200, 1100], [1800, 700]]) obstacles.push({ kind: 'specimen', shape: 'circle', x, y, r: 32 });
  // văn phòng (giữa Nam) + phòng thí nghiệm của Ted (Đông Nam)
  for (const [x, y] of [[1450, 1750], [1800, 1750], [2150, 1750], [1450, 2450], [1800, 2450], [2150, 2450], [2700, 1750], [3300, 1750], [2700, 2450], [3300, 2450]]) obstacles.push({ kind: 'desk', shape: 'box', x, y, w: 120, h: 50, rot: 0 });
  for (const [x, y] of [[3000, 2100], [2650, 2100], [3350, 2100]]) obstacles.push({ kind: 'specimen', shape: 'circle', x, y, r: 36 });
  // sảnh vào (Tây Nam): vài thùng chắn
  for (const [x, y] of [[400, 1900], [800, 2400], [900, 1700]]) obstacles.push({ kind: 'desk', shape: 'box', x, y, w: 110, h: 50, rot: 0.3 });

  MB.registerGate({
    id: 21, seed: 2121, view3d: true, act: 2,
    title: 'GATE 21 — CĂN CỨ ALPHA', subtitle: 'Nơi tất cả bắt đầu',
    world: { w: WW, h: WH }, bg: '#0c1418', mmColor: 'rgba(200,215,225,.75)',
    scale: { hp: 3.3, dmg: 1.9 },
    start: { x: 300, y: 2500 },
    obstacles, hazards: [],
    crates: [{ x: 300, y: 1600 }, { x: 1000, y: 2700 }, { x: 600, y: 900 }, { x: 1800, y: 1600 }, { x: 2200, y: 2650 }, { x: 3400, y: 2600 }],
    spawnPoints: [
      { x: 150, y: 150 }, { x: 1050, y: 150 }, { x: 1350, y: 700 }, { x: 2250, y: 700 }, { x: 1800, y: 1250 }, { x: 1350, y: 2650 },
      { x: 2250, y: 1550 }, { x: 2600, y: 2650 }, { x: 3450, y: 1550 }, { x: 3450, y: 2650 }, { x: 150, y: 1100 }, { x: 1050, y: 1550 },
    ],
    waves: [
      { total: 40, maxAlive: 17, mix: { zombie: 2, runner: 3, labSoldier: 4, v0Clone: 3, goatDrone: 2 }, interval: [0.35, 0.7], elite: 0.24 },
      { total: 46, maxAlive: 19, mix: { labSoldier: 4, v0Clone: 4, riot: 3, licker: 2, goatDrone: 2 }, interval: [0.33, 0.66], elite: 0.28 },
      { total: 52, maxAlive: 21, mix: { labSoldier: 5, v0Clone: 5, riot: 3, licker: 3, goatDrone: 2, runner: 2 }, interval: [0.3, 0.62], elite: 0.32 },
    ],
    boss: { type: 'tedAlpha', x: ARENA.x, y: ARENA.y - 150, fixed: true },
    ally: { enter: 'start' },
    intro: { title: 'MÀN 2 · TRẬN CUỐI', text: 'Căn cứ Alpha. Cùng Dian xuyên qua các phòng thí nghiệm tới sảnh lõi phản ứng phía Đông Bắc. Lưới laser ở các cửa bật tắt theo nhịp — chờ nó tắt rồi hãy qua.' },
    objectives: [
      { title: 'SẢNH VÀO', text: 'Lính Alpha có khiên phía trước — vòng ra sau hoặc dùng lựu đạn. Lưới laser chớp đỏ là sắp bật.' },
      { title: 'PHÒNG BỒN MẪU', text: 'Bản Sao V-0 lao rất nhanh rồi nổ ra vũng virus: bắn từ xa, lộn né khi nó phồng lên.' },
      { title: 'LÕI PHẢN ỨNG', text: 'Wave cuối. Cửa vào sảnh lõi ở phía Đông Bắc.' },
      { title: 'BOSS · GS. TED · GIÁP ALPHA', text: 'Súng gatling quét theo vạch đỏ — chạy ngang. Mưa tên lửa: rời vòng cam. Lao vai: lộn né sang bên. Giai đoạn 2 bay lên (giáp chịu đòn tốt) — xử lý bản sao trước. Giai đoạn 3: 4 tia laser xoay.' },
    ],
    challenges: [
      { id: 'cores', type: 'destroy', name: 'Máy Chủ Hội Đồng', desc: 'Phá 4 máy chủ liên lạc với Hội đồng', kind: 'goatCrate', r: 22, hp: 450,
        spawner: { type: 'labSoldier', every: 8, range: 700, cap: 4 },
        targets: [{ x: 1050, y: 650 }, { x: 2250, y: 1250 }, { x: 1350, y: 2650 }, { x: 3450, y: 1550 }], reward: { mod: 'barrel' } },
      { id: 'lab', type: 'hold', name: 'Phòng Thí Nghiệm Của Ted', desc: 'Giữ phòng thí nghiệm của Ted 16 giây', zone: { x: 3000, y: 2400, r: 90 }, time: 16,
        mix: { v0Clone: 2, labSoldier: 1 }, spawnEvery: 1.4, reward: { mod: 'pierce' } },
      { id: 'streak', type: 'streak', name: 'Nơi Tất Cả Bắt Đầu', desc: '30 hạ gục liên tiếp không trúng đòn', count: 30, reward: { mod: 'split' } },
    ],
    comms: [
      { on: 'start', t: 2.5, lines: [['HUNTER', 'Căn cứ Alpha. Nơi tôi tìm thấy xác ông ấy.'], ['DIAN', 'Xác của một bản sao.']] },
      { on: 'start', t: 11, lines: [['CÔ HẠNH', 'Lõi phản ứng ở sảnh phía Đông Bắc. Tín hiệu sinh học của giáo sư… ở đó.']] },
      { on: 'wave', wave: 2, lines: [['GS. TED', 'Hunter. Ta đã chờ cậu đủ mười cửa. Đi tiếp đi — cậu sắp tốt nghiệp rồi.']] },
      { on: 'wave', wave: 3, lines: [['DIAN', 'Giọng thầy… Vẫn bình thản như ngày tôi bỏ đi.']] },
      { on: 'low', lines: [['DIAN', 'Hunter! Lùi về phía tôi!']] },
      { on: 'boss', lines: [['GS. TED', 'Cậu đã vượt qua mười bài kiểm tra, Hunter.'], ['HUNTER', 'Tại sao?'], ['GS. TED', 'Vì Hội đồng cần một người miễn nhiễm với V-0. Và cậu chính là người đó.']] },
      { on: 'phase', phase: 2, lines: [['GS. TED', 'Dũng — con là học trò giỏi nhất của thầy. Về đây.'], ['DIAN', 'Thầy dạy con phân biệt đúng sai. Con chọn Hunter.'], ['GS. TED', 'Vậy thì… thầy xin lỗi.']] },
      { on: 'phase', phase: 3, lines: [['GS. TED', 'Lõi Alpha quá tải… Hội đồng sẽ không tha cho kẻ thua cuộc.'], ['HUNTER', 'Dian, cố lên — tôi sẽ đưa anh ra.']] },
    ],
    light3d: { hemiSky: 0xd8e8f4, hemiGround: 0x2a3640, hemi: 1.2, sun: 0xe8f4ff, sunI: 1.1, exposure: 1.2 },

    setup(G) { G.__over = null; G.gs.lt = 0; G.actors.push({ kind: 'alphaLasers', x: WW / 2, y: WH / 2, h: 0 }); },
    update(G, dt) {
      const s = G.gs; s.lt += dt;
      const p = G.player;
      for (const L of LASERS) {
        if (laserState(L, s.lt) !== 'on') continue;
        if (!p.dead && segDist(p.x, p.y, L) < p.r + 6 && !(p.iframes > 0)) { const a = L.x0 === L.x1 ? (p.x < L.x0 ? Math.PI : 0) : (p.y < L.y0 ? -Math.PI / 2 : Math.PI / 2); G.hurtPlayer(20, { x: p.x - Math.cos(a) * 40, y: p.y - Math.sin(a) * 40 }); p.vx += Math.cos(a) * 420; p.vy += Math.sin(a) * 420; }
        for (const e of G.enemies) if (!e.dead && !e.boss && !e.fly && segDist(e.x, e.y, L) < e.r + 4) G.damageEnemy(e, 60 * dt, 0, 0, true);
        if (G.ally && !G.ally.down && segDist(G.ally.x, G.ally.y, L) < 22) MB.Ally.hurt(G, 25 * dt);
      }
    },
    drawUnder(G, ctx) {
      const t = G.time;
      // ống dẫn sáng dưới sàn
      ctx.strokeStyle = `rgba(80,210,255,${0.25 + Math.sin(t * 2) * 0.1})`; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(300, 2500); ctx.lineTo(600, 2100); ctx.lineTo(600, 1400); ctx.lineTo(1800, 1400); ctx.lineTo(1800, 700); ctx.lineTo(ARENA.x, ARENA.y); ctx.stroke();
    },
    drawOver(G, ctx) {
      const lt = G.gs.lt, t = G.time;
      for (const L of LASERS) {
        const st = laserState(L, lt);
        // bệ phát laser hai đầu
        ctx.fillStyle = '#2a3440'; for (const [x, y] of [[L.x0, L.y0], [L.x1, L.y1]]) { U.circle(ctx, x, y, 9); ctx.fill(); }
        ctx.fillStyle = st === 'off' ? '#3a4a54' : '#ff3a3a'; for (const [x, y] of [[L.x0, L.y0], [L.x1, L.y1]]) { U.circle(ctx, x, y, 4); ctx.fill(); }
        if (st === 'off') continue;
        const a = st === 'on' ? 0.85 + Math.sin(t * 40) * 0.1 : Math.abs(Math.sin(t * 18)) * 0.5;
        const n = 3, vert = L.x0 === L.x1;
        for (let i = 0; i < n; i++) {
          const o = (i - 1) * 7;
          ctx.strokeStyle = `rgba(255,40,40,${a * (st === 'on' ? 1 : 0.6)})`; ctx.lineWidth = st === 'on' ? 3 : 1.5;
          ctx.shadowColor = '#ff2a2a'; ctx.shadowBlur = st === 'on' ? 10 : 0;
          ctx.beginPath(); ctx.moveTo(L.x0 + (vert ? o : 0), L.y0 + (vert ? 0 : o)); ctx.lineTo(L.x1 + (vert ? o : 0), L.y1 + (vert ? 0 : o)); ctx.stroke();
        }
        ctx.shadowBlur = 0;
      }
    },
    drawScreen(G, ctx) {
      // đèn báo động đỏ khi đánh boss
      if (G.state === 'boss' || G.state === 'preboss') { ctx.fillStyle = `rgba(255,0,20,${0.04 + (Math.sin(G.time * 4) > 0 ? 0.05 : 0)})`; ctx.fillRect(0, 0, G.W, G.H); }
    },

    buildGround(g, w, h, rand) {
      g.fillStyle = '#1a2228'; g.fillRect(0, 0, w, h);
      // gạch sàn phòng thí nghiệm
      g.strokeStyle = 'rgba(120,150,170,.12)'; g.lineWidth = 1;
      for (let x = 0; x < w; x += 60) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
      for (let y = 0; y < h; y += 60) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
      // màu sàn từng phòng
      const rooms = [[0, 0, 1200, 1400, 'rgba(60,120,160,.12)'], [1200, 0, 2400, 1400, 'rgba(90,200,160,.1)'], [2400, 0, 3600, 1400, 'rgba(255,90,60,.08)'], [0, 1400, 1200, 2800, 'rgba(120,120,140,.1)'], [1200, 1400, 2400, 2800, 'rgba(200,200,220,.07)'], [2400, 1400, 3600, 2800, 'rgba(160,255,120,.07)']];
      for (const [x0, y0, x1, y1, c] of rooms) { g.fillStyle = c; g.fillRect(x0, y0, x1 - x0, y1 - y0); }
      // vết virus loang ở phòng Ted
      GK.patches(g, rand, w, h, 40, ['rgba(120,255,90,.05)'], 30, 90);
      // sảnh lõi phản ứng: vòng tròn đồng tâm + lõi
      g.fillStyle = '#222c34'; g.beginPath(); g.arc(ARENA.x, ARENA.y, ARENA.r, 0, U.TAU); g.fill();
      for (let i = 1; i <= 4; i++) { g.strokeStyle = `rgba(80,210,255,${0.12 + i * 0.04})`; g.lineWidth = 3; g.beginPath(); g.arc(ARENA.x, ARENA.y, ARENA.r * i / 4.2, 0, U.TAU); g.stroke(); }
      g.strokeStyle = 'rgba(255,210,60,.35)'; g.lineWidth = 10; g.setLineDash([30, 20]); g.beginPath(); g.arc(ARENA.x, ARENA.y, ARENA.r - 8, 0, U.TAU); g.stroke(); g.setLineDash([]);
      g.fillStyle = '#ffffff'; g.globalAlpha = 0.12; g.font = '900 54px system-ui'; g.textAlign = 'center'; g.fillText('ALPHA', ARENA.x, ARENA.y + 18); g.globalAlpha = 1;
      // vạch "nơi tìm thấy GS Ted" ở phòng thí nghiệm
      g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 3; g.setLineDash([10, 8]); g.beginPath(); g.ellipse(3000, 2400, 90, 34, 0, 0, U.TAU); g.stroke(); g.setLineDash([]);
      GK.vignette(g, w, h, 0.45);
    },

    /* ---------- 3D ---------- */
    models3d: {
      labSoldier: (K) => ({
        base: 18,
        build() {
          const T3 = K.T, g = new T3.Group(), suit = K.std(0xe8eef2, { rough: 0.6 });
          const legs = [];
          for (const z of [-6, 6]) { const l = K.mesh(K.cyl(3.5, 4, 18, 6), K.std(0x1a1a20), 0, 9, z); g.add(l); legs.push(l); }
          g.add(K.mesh(K.box(14, 22, 20), suit, 0, 28, 0), K.mesh(K.box(15, 5, 21), K.std(0xc83a3a), 0, 28, 0), K.mesh(K.sph(7, 10), K.std(0xd8dee2), 2, 44, 0));
          g.add(K.mesh(K.box(3, 4, 8), K.glowMat(0x3af0ff, 2.4), 8, 44, 0, false));
          g.add(K.mesh(K.box(24, 4, 4), K.std(0x2a2a32), 14, 30, 6));
          const sh = K.mesh(K.box(3, 30, 28), K.std(0xa0d2ff, { own: true, transparent: true, opacity: 0.4, metal: 0.4, rough: 0.1 }), 16, 26, 0, false); g.add(sh);
          g.userData = { legs, h: 52 }; return g;
        },
        anim(e, m, G) { const mv = Math.hypot(e.vx, e.vy) > 15; m.userData.legs.forEach((l, i) => { l.rotation.z = mv ? Math.sin(G.time * 10 + i * 3) * 0.4 : 0; }); },
      }),
      v0Clone: (K) => ({
        base: 15,
        build() {
          const T3 = K.T, g = new T3.Group(), skin = K.std(0xa8b098, { flat: true, rough: 0.8 }), body = new T3.Group(); g.add(body);
          body.add(K.mesh(K.cyl(7, 9, 22, 7), skin, 0, 18, 0), K.mesh(K.sph(7, 8), skin, 3, 34, 0));
          body.add(K.mesh(K.sph(5, 8), K.glowMat(0x9aff5a, 2.4), 6, 22, 0, false));
          for (const z of [-3, 3]) body.add(K.mesh(K.sph(1.4, 6), K.glowMat(0xc8ff5a, 3), 9, 36, z, false));
          g.userData = { body, h: 42 }; return g;
        },
        anim(e, m, G) { m.userData.body.scale.setScalar(1 + (e.swell || 0) * 0.5); m.userData.body.rotation.z = Math.sin(G.time * 16 + e.t) * 0.15; },
      }),
      tedAlpha: (K) => ({
        base: 50,
        build() {
          const T3 = K.T, g = new T3.Group(), armor = K.std(0xc8ccd0, { metal: 0.6, rough: 0.35 }), dark = K.std(0x3a3a42, { metal: 0.5, rough: 0.5 });
          const legs = [];
          for (const z of [-20, 20]) { const l = K.mesh(K.box(18, 46, 18), dark, -6, 23, z); g.add(l); legs.push(l); }
          const body = new T3.Group(); body.position.y = 46; g.add(body);
          body.add(K.mesh(K.box(46, 54, 60), armor, 0, 27, 0), K.mesh(K.box(47, 8, 61), K.std(0xc8302a), 0, 30, 0));
          const cock = K.mesh(K.sph(17, 12), K.std(0xa0dcff, { own: true, transparent: true, opacity: 0.4, metal: 0.4, rough: 0.05 }), 18, 46, 0); body.add(cock);
          body.add(K.mesh(K.sph(9, 10), K.std(0xc9a68a), 18, 46, 0), K.mesh(K.sph(9.5, 10), K.std(0xe8e8e8), 14, 50, 0));
          const gun = new T3.Group(); gun.position.set(10, 36, 40); body.add(gun);
          gun.add(K.mesh(K.box(30, 18, 16), dark, 0, 0, 0));
          const barrels = new T3.Group(); barrels.position.x = 30; gun.add(barrels);
          for (let i = 0; i < 6; i++) { const b = K.mesh(K.cyl(2, 2, 40, 6), K.std(0x2a2a30, { metal: 0.7 }), 0, Math.cos(i) * 5, Math.sin(i) * 5); b.rotation.z = Math.PI / 2; barrels.add(b); }
          const pod = K.mesh(K.box(26, 14, 18), dark, 0, 60, -36); body.add(pod);
          for (let i = 0; i < 3; i++) pod.add(K.mesh(K.sph(3, 6), K.glowMat(0xffb84a, 2), 13, 0, -6 + i * 6, false));
          const core = K.mesh(K.sph(10, 12), K.glowMat(0x5ad8ff, 2.6), -26, 30, 0, false); body.add(core);
          const jets = [];
          for (const z of [-16, 16]) { const j = K.glowSprite(0xffa040, 60, 0.9); j.position.set(-30, 10, z); body.add(j); jets.push(j); }
          g.userData = { legs, barrels, core, jets, h: 120 }; return g;
        },
        anim(e, m, G) {
          const d = m.userData, mv = Math.hypot(e.vx, e.vy) > 20 && !e.airborne;
          d.legs.forEach((l, i) => { l.rotation.z = mv ? Math.sin(G.time * 7 + i * 3.1) * 0.35 : 0; });
          d.barrels.rotation.x = e.state === 'gun' ? G.time * 40 : 0;
          d.core.material.color.setHex(e.phase === 3 ? 0xff4a3a : 0x5ad8ff);
          d.jets.forEach((j) => { j.visible = !!e.airborne; });
          m.position.y = e.airborne ? 40 + Math.sin(G.time * 4) * 6 : 0;
        },
      }),
    },
    props3d: {},
    actors3d: Object.assign({
      alphaLasers: (a, K) => {
        const T3 = K.T, g = new T3.Group(), beams = [];
        for (const L of LASERS) {
          const len = Math.hypot(L.x1 - L.x0, L.y1 - L.y0), grp = new T3.Group(); grp.position.set((L.x0 + L.x1) / 2 - a.x, 0, (L.y0 + L.y1) / 2 - a.y);
          if (L.x0 === L.x1) grp.rotation.y = Math.PI / 2;
          const mat = new T3.MeshBasicMaterial({ color: 0xff2a2a, transparent: true, opacity: 0.9, depthWrite: false });
          for (let i = 0; i < 4; i++) { const b = K.mesh(K.box(len, 2, 2), mat, 0, 10 + i * 14, 0, false); grp.add(b); }
          for (const sd of [-1, 1]) grp.add(K.mesh(K.box(10, 70, 10), K.std(0x2a3440, { metal: 0.5 }), sd * len / 2, 35, 0));
          g.add(grp); beams.push({ L, grp, mat });
        }
        g.userData.anim = (aa, m, G) => {
          m.position.set(aa.x, 0, aa.y);
          const lt = G.gs.lt;
          for (const b of beams) { const st = laserState(b.L, lt); b.grp.children.forEach((c, i) => { if (i < 4) c.visible = st !== 'off'; }); b.mat.opacity = st === 'on' ? 0.9 : Math.abs(Math.sin(G.time * 18)) * 0.5; }
        };
        return g;
      },
    }, MB.Story.actors3d),
  });
  MB.Props.registerActor('alphaLasers', () => {});
})(window.MB);
