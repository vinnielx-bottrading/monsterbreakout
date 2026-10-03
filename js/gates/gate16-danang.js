/* Gate 16 — ĐÀ NẴNG: Cầu Rồng & Cầu Vàng (Màn 2 · Nguồn Gốc)
   Thắng cảnh: biển Mỹ Khê (bãi cát trắng, dù xanh), sông Hàn với Cầu Rồng (thân rồng vàng uốn lượn, đầu rồng phun lửa)
   và cầu sông Hàn, phố bờ Đông – Tây với cao ốc kính, đường đèo lên Bà Nà, Cầu Vàng cong giữa biển mây.
   Cơ chế: CẦU RỒNG PHUN LỬA theo đợt (vạch cam báo trước, lửa phủ kín mặt cầu 3 giây — đốt cả quái);
   biển mây quanh Cầu Vàng chặn đường đi (đạn bay qua). ĐỒNG ĐỘI DIAN đánh cùng từ đầu trận.
   Quái mới: Bọ Cát Mỹ Khê (đào dưới cát rồi trồi lên cắn), Robot Tuần Cầu (khiên phía trước + bắn laser).
   Boss: CỰ NHÂN ĐÁ BÀ NÀ — đầu đá khổng lồ trồi lên giữa biển mây, hai bàn tay đá đỡ Cầu Vàng:
   tay đập xuống cầu, quét dọc cầu, vỗ hai tay; giai đoạn cuối mắt bắn tia + mưa đá. */
'use strict';
(function (MB) {
  const U = MB.U, Ens = MB.Enemies, GK = MB.GK, VN = MB.VN;
  const WW = 4400, WH = 3000;
  const H3 = 0.45;
  const RIV = { x0: 2480, x1: 2860 };
  const DRAGON = { y0: 1440, y1: 1560 };         // Cầu Rồng
  const HAN = { y0: 640, y1: 740 };              // cầu sông Hàn
  const SEA_X = 4250, BEACH_X = 3700;
  const ARC = { x: 700, y: 1500, r: 440, w: 92, a0: 0, a1: 200 * Math.PI / 180 };  // Cầu Vàng (độ theo chiều ngược kim, từ hướng Đông qua Bắc)
  const MTN_X = 1400;
  const arcT = (x, y) => { let a = -Math.atan2(y - ARC.y, x - ARC.x); if (a < -0.05) a += Math.PI * 2; return a; };
  const arcPt = (t, rr) => ({ x: ARC.x + Math.cos(t) * (rr || ARC.r), y: ARC.y - Math.sin(t) * (rr || ARC.r) });
  const ARC_END = arcPt(ARC.a1);
  const onArc = (x, y, pad) => { const d = Math.hypot(x - ARC.x, y - ARC.y), t = arcT(x, y); return Math.abs(d - ARC.r) < ARC.w + pad && t >= ARC.a0 - 0.02 && t <= ARC.a1 + 0.02; };
  const mtnWalk = (x, y, pad) => onArc(x, y, pad) || (x > ARC.x + ARC.r - ARC.w - pad && x < MTN_X + 10 && Math.abs(y - ARC.y) < 70 + pad) || Math.hypot(x - ARC_END.x, y - ARC_END.y) < 130 + pad;

  /* ---------- vẽ 2D ---------- */
  // cao ốc kính
  MB.Props.register('dnTower', (ctx, o) => {
    const x = o.x - o.hw, y = o.y - o.hh, H = o.tall * H3;
    VN.shadowBox(ctx, x, y - H, o.w, o.h, o.tall, 0.3);
    ctx.fillStyle = o.col; ctx.fillRect(x, y + o.h - H, o.w, H);
    ctx.fillStyle = 'rgba(160,220,255,.35)'; for (let i = 0; i < 5; i++) ctx.fillRect(x + 4 + i * (o.w - 8) / 5, y + o.h - H + 4, (o.w - 8) / 5 - 4, H - 8);
  });
  VN.over.dnTower = (ctx, o, G) => {
    const x = o.x - o.hw, y = o.y - o.hh, H = o.tall * H3;
    ctx.globalAlpha = VN.coverAlpha(G, x, y - H, x + o.w, y + o.h - H);
    ctx.fillStyle = o.roof; ctx.fillRect(x, y - H, o.w, o.h);
    ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 1; ctx.strokeRect(x + 6, y - H + 6, o.w - 12, o.h - 12);
    ctx.fillStyle = 'rgba(60,70,80,.7)'; ctx.fillRect(x + o.w * 0.3, y - H + o.h * 0.3, o.w * 0.25, o.h * 0.2); // phòng máy trên nóc
    if (o.lit) { ctx.fillStyle = `rgba(255,80,80,${0.5 + Math.sin(G.time * 3 + o.x) * 0.5})`; U.circle(ctx, x + o.w - 8, y - H + 8, 3); ctx.fill(); }
    ctx.globalAlpha = 1;
  };
  // dù che nắng trên bãi biển
  MB.Props.register('umbrella', (ctx, o, t) => {
    MB.Props.shadow(ctx, o.x + 10, o.y + 8, 26, 12, 0.22);
    const c = o.col; ctx.fillStyle = c; U.circle(ctx, o.x, o.y - 10, 24); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 2; for (let i = 0; i < 6; i++) { const a = i / 6 * U.TAU; ctx.beginPath(); ctx.moveTo(o.x, o.y - 10); ctx.lineTo(o.x + Math.cos(a) * 24, o.y - 10 + Math.sin(a) * 24); ctx.stroke(); }
    ctx.fillStyle = '#fff'; U.circle(ctx, o.x, o.y - 10, 3); ctx.fill();
  });
  // cột thân rồng (chân cầu): vẽ thân rồng đè lên mặt cầu
  MB.Props.register('void', () => {});
  MB.Props.register('dnWater', () => {});

  /* ---------- quái mới ---------- */
  Ens.register('sandCrawler', Ens.make({
    name: 'Bọ Cát Mỹ Khê', r: 18, hp: 110, speed: 120, dmg: 18, score: 170, blood: '#4a3a10', gore: '#e8d68a', knockMul: 0.8,
    draw(ctx, e, G) {
      if (e.hidden) return;
      const t = G.time, w = Math.sin(t * 16 + e.t);
      ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.face || 0);
      ctx.fillStyle = 'rgba(0,0,0,.25)'; U.ellipse(ctx, 3, 5, 22, 15); ctx.fill();
      ctx.strokeStyle = '#6a5428'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      for (const sd of [-1, 1]) for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-6 + i * 6, sd * 8); ctx.lineTo(-9 + i * 7 + w * (i % 2 ? 3 : -3), sd * 18); ctx.stroke(); }
      const gr = ctx.createRadialGradient(-3, -4, 2, 0, 0, 18); gr.addColorStop(0, '#e8d08a'); gr.addColorStop(1, '#8a6a2a');
      ctx.fillStyle = gr; U.ellipse(ctx, 0, 0, 18, 12); ctx.fill();
      ctx.strokeStyle = 'rgba(70,50,20,.6)'; ctx.lineWidth = 1.5; for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(i * 6, -11); ctx.lineTo(i * 6, 11); ctx.stroke(); }
      ctx.fillStyle = '#3a2a10'; for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(14, sd * 3); ctx.lineTo(26, sd * 8); ctx.lineTo(16, sd * 7); ctx.fill(); }
      ctx.fillStyle = '#c8ff7a'; U.circle(ctx, 13, -4, 2); ctx.fill(); U.circle(ctx, 13, 4, 2); ctx.fill();
      ctx.restore();
    },
  }, Ens.AI.burrower({ emerge: 95, up: 2.4, dirt: '#d8c48a', ripple: '240,220,160' })));

  Ens.register('bridgeBot', Ens.make({
    name: 'Robot Tuần Cầu', r: 20, hp: 200, speed: 80, dmg: 14, score: 220, blood: '#1a2a3a', gore: '#9fd8ff', knockMul: 0.4,
    armorFn: Ens.AI.shieldFront(0.3, 0.9),
    draw(ctx, e, G) {
      const t = G.time, aim = e.state === 'aim';
      ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.face || 0);
      ctx.fillStyle = 'rgba(0,0,0,.28)'; U.ellipse(ctx, 3, 6, 22, 16); ctx.fill();
      ctx.fillStyle = '#2a3440'; U.rr(ctx, -15, -14, 26, 28, 6); ctx.fill();
      ctx.fillStyle = '#4a5a6a'; U.rr(ctx, -11, -10, 18, 20, 4); ctx.fill();
      // khiên năng lượng phía trước
      ctx.strokeStyle = `rgba(120,210,255,${0.5 + Math.sin(t * 6) * 0.2})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, 22, -0.9, 0.9); ctx.stroke();
      ctx.fillStyle = aim ? '#ff4a4a' : '#7ad8ff'; U.circle(ctx, 8, 0, 4); ctx.fill();
      ctx.fillStyle = '#ff5a6a'; ctx.font = '900 8px system-ui'; ctx.textAlign = 'center'; ctx.fillText('♉', -4, 3);
      ctx.restore();
    },
  }, Ens.AI.shooter({ cd: [2, 3], min: 160, max: 440, aim: 0.6, lineLen: 460,
    shot: (e, G, a) => { MB.Audio.play('shot_beam'); for (let i = 0; i < 4; i++) setTimeout(() => { if (!e.dead) G.enemyShot({ x: e.x, y: e.y, a: a + U.rnd(-0.03, 0.03), speed: 640, r: 5, dmg: 8, color: '#7ad8ff', owner: e }); }, i * 90); } })));

  /* ---------- BOSS: CỰ NHÂN ĐÁ BÀ NÀ ---------- */
  const HAND_REST = [{ dx: -190, dy: -90 }, { dx: 190, dy: -90 }];
  Ens.register('stoneGiant', {
    name: 'Cự Nhân Đá Bà Nà', r: 70, hp: 16500, speed: 0, dmg: 28, score: 0, boss: true, knockMul: 0, fly: true, noHover: true, noContact: true,
    blood: '#3a3a30', gore: '#c8c0a0',
    init(e) {
      e.phase = 1; e.state = 'idle'; e.atkT = 2.5; e.face = Math.PI / 2;
      e.hands = HAND_REST.map((h) => ({ x: e.x + h.dx, y: e.y + h.dy, tx: e.x + h.dx, ty: e.y + h.dy, h: 60, th: 60, slam: 0 }));
      e.rockT = 6;
    },
    update(e, G, dt) {
      const p = G.player, k = e.hp / e.maxHp, ph = k > 0.66 ? 1 : k > 0.33 ? 2 : 3;
      if (ph > e.phase) {
        e.phase = ph; G.shake(16); MB.Audio.play('roar');
        G.banner(`PHASE ${ph}`, ph === 2 ? 'Hai bàn tay quét dọc Cầu Vàng' : 'Mắt Cự Nhân bừng sáng — mưa đá!', 2);
        for (let i = 0; i < 2 + ph; i++) { const pt = arcPt(U.rnd(0.3, 3.2)); G.spawnEnemyAt('goatDrone', pt.x, pt.y - 40, { extra: true }); }
      }
      e.face = Math.atan2(p.y - e.y, p.x - e.x);
      // tay di chuyển mượt tới đích
      for (const h of e.hands) { const kk = Math.min(1, dt * (h.fast ? 10 : 4)); h.x += (h.tx - h.x) * kk; h.y += (h.ty - h.y) * kk; h.h += (h.th - h.h) * Math.min(1, dt * (h.fast ? 14 : 5)); }
      const rest = () => e.hands.forEach((h, i) => { h.tx = e.x + HAND_REST[i].dx; h.ty = e.y + HAND_REST[i].dy; h.th = 60; h.fast = false; });
      if (ph === 3) {
        e.rockT -= dt;
        if (e.rockT <= 0) { e.rockT = 2.6; for (let i = 0; i < 3; i++) { const x = p.x + U.rnd(-160, 160), y = p.y + U.rnd(-160, 160); G.telegraphCircle(x, y, 50, 1.0, () => G.explosion(x, y, 50, 0, { player: 16, small: true, obstacles: false, enemies: false, color: '#c8c0a0', ring: '200,190,160', shake: 3 })); } }
      }
      if (e.state === 'idle') {
        rest(); e.atkT -= dt;
        if (e.atkT <= 0) {
          const r = Math.random();
          if (ph >= 3 && r < 0.3) { e.state = 'eyeAim'; e.st = 1.0; e.lock = e.face; MB.Audio.play('boss'); }
          else if (ph >= 2 && r < 0.6) {
            if (Math.random() < 0.5) {
              // quét dọc cầu: 1 tay chạy theo cung cầu qua chỗ Hunter đứng
              const tp = arcT(p.x, p.y), dir = Math.random() < 0.5 ? 1 : -1;
              e.state = 'sweepAim'; e.st = 1.0; e.sw = { i: dir > 0 ? 0 : 1, t0: tp - dir * 0.6, t1: tp + dir * 0.6 };
              const h = e.hands[e.sw.i], s0 = arcPt(e.sw.t0); h.tx = s0.x; h.ty = s0.y; h.th = 30;
            } else {
              // vỗ hai tay: kẹp Hunter từ hai phía
              const tp = arcT(p.x, p.y), A = arcPt(tp - 0.42), B = arcPt(tp + 0.42);
              e.state = 'clapAim'; e.st = 0.9; e.cl = { x: p.x, y: p.y };
              e.hands[0].tx = A.x; e.hands[0].ty = A.y; e.hands[1].tx = B.x; e.hands[1].ty = B.y; e.hands.forEach((h) => { h.th = 34; });
            }
          } else {
            // đập xuống chỗ Hunter đứng
            const i = Math.random() < 0.5 ? 0 : 1, h = e.hands[i];
            e.state = 'slamAim'; e.st = ph === 1 ? 1.0 : 0.8; e.si = i; e.sx = p.x; e.sy = p.y; h.tx = p.x; h.ty = p.y; h.th = 120;
            G.telegraphCircle(p.x, p.y, 110, e.st, null, 'rgba(255,80,60,.14)');
          }
        }
      } else if (e.state === 'slamAim') {
        e.st -= dt;
        if (e.st <= 0) {
          const h = e.hands[e.si]; h.th = 0; h.fast = true;
          G.explosion(e.sx, e.sy, 110, 0, { player: 26, knock: 0, color: '#c8c0a0', ring: '210,200,170', obstacles: false, enemies: false });
          if (ph >= 2) G.shockwave(e.sx, e.sy, 360, 1.2, 16, 'rgba(230,220,190,.9)');
          e.state = 'recover'; e.st = 0.9;
        }
      } else if (e.state === 'sweepAim') {
        e.st -= dt;
        if (e.st <= 0) { e.state = 'sweep'; e.st = 0.9; MB.Audio.play('dash'); }
      } else if (e.state === 'sweep') {
        e.st -= dt; const kk = 1 - e.st / 0.9, t = U.lerp(e.sw.t0, e.sw.t1, kk), pt = arcPt(t), h = e.hands[e.sw.i];
        h.x = h.tx = pt.x; h.y = h.ty = pt.y; h.th = 20;
        if (U.dist(p.x, p.y, h.x, h.y) < 95) G.hurtPlayer(22, { x: h.x, y: h.y });
        if (Math.random() < 0.6) G.particle({ x: h.x + U.rnd(-30, 30), y: h.y + U.rnd(-30, 30), vx: U.rnd(-60, 60), vy: U.rnd(-60, 60), life: 0.5, color: '#d8d0b8', r: 4 });
        if (e.st <= 0) { e.state = 'recover'; e.st = 0.6; }
      } else if (e.state === 'clapAim') {
        e.st -= dt;
        if (e.st <= 0) { e.state = 'clap'; e.st = 0.35; e.hands.forEach((h) => { h.tx = e.cl.x; h.ty = e.cl.y; h.fast = true; }); }
      } else if (e.state === 'clap') {
        e.st -= dt;
        if (e.st <= 0) { G.shockwave(e.cl.x, e.cl.y, 300, 1.0, 24, 'rgba(255,230,160,.95)'); G.explosion(e.cl.x, e.cl.y, 70, 0, { player: 20, obstacles: false, enemies: false, small: true }); e.state = 'recover'; e.st = 0.8; }
      } else if (e.state === 'eyeAim') {
        e.st -= dt; e.lock += U.angDiff(e.lock, e.face) * Math.min(1, dt * 2);
        if (e.st <= 0) { e.state = 'eye'; e.st = 1.6; e.fireT = 0; e.sweepD = Math.random() < 0.5 ? -1 : 1; MB.Audio.play('super_laser'); }
      } else if (e.state === 'eye') {
        e.st -= dt; e.lock += e.sweepD * dt * 0.35; e.fireT -= dt;
        if (e.fireT <= 0) { e.fireT = 0.04; G.enemyShot({ x: e.x + Math.cos(e.lock) * 70, y: e.y + Math.sin(e.lock) * 70, a: e.lock + U.rnd(-0.015, 0.015), speed: 900, r: 9, dmg: 7, color: '#ffd84a', owner: e, life: 1.0, pass: true }); }
        if (e.st <= 0) { e.state = 'recover'; e.st = 0.8; }
      } else if (e.state === 'recover') {
        e.st -= dt; if (e.st <= 0) { e.state = 'idle'; e.atkT = ph === 1 ? 1.8 : ph === 2 ? 1.4 : 1.1; rest(); }
      }
      // tay là actor (vẽ 2D/3D)
      if (G.gs.hands) G.gs.hands.forEach((a, i) => { const h = e.hands[i]; a.x = h.x; a.y = h.y; a.h = h.h; a.flat = h.h < 10; a.hidden = false; });
    },
    tele(ctx, e, G) {
      if (e.state === 'sweepAim' || e.state === 'sweep') {
        ctx.strokeStyle = `rgba(255,80,60,${e.state === 'sweep' ? 0.25 : 0.2 + (1 - e.st) * 0.4})`; ctx.lineWidth = ARC.w * 2; ctx.lineCap = 'butt';
        const a0 = -e.sw.t0, a1 = -e.sw.t1; ctx.beginPath(); ctx.arc(ARC.x, ARC.y, ARC.r, Math.min(a0, a1), Math.max(a0, a1)); ctx.stroke();
      }
      if (e.state === 'clapAim') { ctx.fillStyle = `rgba(255,200,80,${0.15 + (1 - e.st / 0.9) * 0.25})`; U.circle(ctx, e.cl.x, e.cl.y, 120); ctx.fill(); }
      if (e.state === 'eyeAim') G.drawTelegraphLine(ctx, e.x, e.y, e.lock, 900, 1 - e.st);
    },
    draw(ctx, e, G) {
      const t = G.time;
      // đầu đá khổng lồ nhô lên từ biển mây
      ctx.fillStyle = 'rgba(255,255,255,.6)'; for (let i = 0; i < 10; i++) { const a = i / 10 * U.TAU + t * 0.3; U.ellipse(ctx, e.x + Math.cos(a) * 90, e.y + 40 + Math.sin(a) * 26, 46, 18); ctx.fill(); }
      const gr = ctx.createRadialGradient(e.x - 20, e.y - 30, 10, e.x, e.y, 90); gr.addColorStop(0, '#a8a490'); gr.addColorStop(1, '#5a5848');
      ctx.fillStyle = gr; U.ellipse(ctx, e.x, e.y - 10, 78, 88); ctx.fill();
      ctx.fillStyle = 'rgba(70,110,50,.6)'; for (let i = 0; i < 9; i++) { U.circle(ctx, e.x - 60 + (i * 37) % 120, e.y - 80 + (i * 23) % 50, 10 + (i % 3) * 4); ctx.fill(); }
      ctx.strokeStyle = 'rgba(40,36,28,.6)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(e.x - 40, e.y - 60); ctx.lineTo(e.x - 20, e.y - 20); ctx.lineTo(e.x - 34, e.y + 20); ctx.moveTo(e.x + 30, e.y - 70); ctx.lineTo(e.x + 44, e.y - 30); ctx.stroke();
      const eye = e.state === 'eye' || e.state === 'eyeAim' ? '#fff3a0' : e.enrageT > 0 ? '#ff4a2a' : '#ffb84a';
      ctx.shadowColor = eye; ctx.shadowBlur = 18; ctx.fillStyle = eye;
      for (const sd of [-1, 1]) { U.ellipse(ctx, e.x + sd * 26, e.y - 24, 12, 7); ctx.fill(); }
      ctx.shadowBlur = 0; ctx.fillStyle = '#2a2820'; U.ellipse(ctx, e.x, e.y + 26, 28, 9); ctx.fill();
    },
  });

  /* ---------- bản đồ ---------- */
  const rng = U.seeded(1616);
  const obstacles = [];
  const water = (x0, y0, x1, y1) => obstacles.push({ kind: 'dnWater', shape: 'box', x: (x0 + x1) / 2, y: (y0 + y1) / 2, w: x1 - x0, h: y1 - y0, rot: 0, noShot: true, water: true });
  // sông Hàn (chừa 2 cầu) + biển
  water(RIV.x0, 0, RIV.x1, HAN.y0); water(RIV.x0, HAN.y1, RIV.x1, DRAGON.y0); water(RIV.x0, DRAGON.y1, RIV.x1, WH);
  water(SEA_X, 0, WW, WH);
  // biển mây Bà Nà: lưới ô 50 quanh Cầu Vàng
  const CELL = 50;
  for (let y = 0; y < WH; y += CELL) {
    let run = -1;
    for (let x = 0; x <= MTN_X; x += CELL) {
      const v = x < MTN_X && !mtnWalk(x + CELL / 2, y + CELL / 2, 14);
      if (v && run < 0) run = x;
      if ((!v || x >= MTN_X) && run >= 0) { obstacles.push({ kind: 'void', shape: 'box', x: (run + x) / 2, y: y + CELL / 2, w: x - run, h: CELL + 2, rot: 0, noShot: true, water: true }); run = -1; }
    }
  }
  // cao ốc hai bờ sông
  const COLS = ['#3a6a8a', '#4a5a6a', '#2a5a7a', '#5a6a7a', '#3a4a5a'];
  const towers = [];
  for (let bx = MTN_X + 160; bx < RIV.x0 - 120; bx += 280) for (let by = 300; by < WH - 200; by += 300) {
    if (Math.abs(by - 1500) < 200 || Math.abs(by - 690) < 120) continue;
    towers.push([bx + rng() * 40, by + rng() * 40]);
  }
  for (let bx = RIV.x1 + 200; bx < BEACH_X - 120; bx += 280) for (let by = 300; by < WH - 200; by += 320) {
    if (Math.abs(by - 1500) < 200 || Math.abs(by - 690) < 120) continue;
    towers.push([bx + rng() * 40, by + rng() * 40]);
  }
  towers.forEach(([x, y], i) => obstacles.push({ kind: 'dnTower', shape: 'box', x, y, w: 120 + (i % 3) * 20, h: 110, rot: 0, tall: 120 + (i * 37) % 160, col: COLS[i % 5], roof: ['#5a6670', '#4a525a', '#6a7680'][i % 3], lit: i % 4 === 0 }));
  // dù trên bãi Mỹ Khê
  for (let i = 0; i < 16; i++) obstacles.push({ kind: 'umbrella', shape: 'circle', x: BEACH_X + 80 + (i % 4) * 120 + rng() * 30, y: 500 + Math.floor(i / 4) * 520 + rng() * 60, r: 14, col: ['#2a8ad8', '#e8483a', '#f2c63a', '#2ab88a'][i % 4] });
  // cây xanh ven sông
  for (let y = 120; y < WH - 100; y += 220) for (const x of [RIV.x0 - 70, RIV.x1 + 70]) if (Math.abs(y - 1500) > 140 && Math.abs(y - 690) > 120) obstacles.push({ kind: 'vtree', shape: 'circle', x, y, r: 22, sp: 'banyan', lean: 0, tall: 90 });
  const MEMO = { x: RIV.x0 - 120, y: 1620 };

  MB.registerGate({
    id: 16, seed: 1616, view3d: true, act: 2,
    title: 'GATE 16 — ĐÀ NẴNG', subtitle: 'Cầu Rồng & Cầu Vàng',
    world: { w: WW, h: WH }, bg: '#1a3a4a', mmColor: 'rgba(170,190,210,.7)',
    scale: { hp: 2.6, dmg: 1.65 },
    start: { x: 3950, y: 2500 },
    obstacles, hazards: [],
    crates: [{ x: 3900, y: 1500 }, { x: 3200, y: 2300 }, { x: 3100, y: 900 }, { x: 2200, y: 2300 }, { x: 1800, y: 1000 }, { x: 1500, y: 1500 }, { x: 900, y: 980 }],
    spawnPoints: [
      { x: 3900, y: 400 }, { x: 4100, y: 1500 }, { x: 3900, y: 2800 }, { x: 3300, y: 600 }, { x: 3300, y: 2600 }, { x: 3000, y: 1500 },
      { x: 2200, y: 400 }, { x: 2200, y: 2700 }, { x: 1700, y: 600 }, { x: 1700, y: 2500 }, { x: 1450, y: 1500 }, { x: 1150, y: 1200 },
    ],
    waves: [
      { total: 32, maxAlive: 14, mix: { zombie: 3, runner: 3, sandCrawler: 4, bridgeBot: 2, goatDrone: 1 }, interval: [0.42, 0.8], elite: 0.15 },
      { total: 36, maxAlive: 16, mix: { bridgeBot: 3, sandCrawler: 3, runner: 3, goatDrone: 2, riot: 2 }, interval: [0.4, 0.78], elite: 0.19 },
      { total: 40, maxAlive: 17, mix: { bridgeBot: 4, sandCrawler: 3, goatDrone: 3, riot: 2, runner: 3, xeOm: 2 }, interval: [0.36, 0.72], elite: 0.22 },
    ],
    boss: { type: 'stoneGiant', x: ARC.x, y: ARC.y, fixed: true },
    ally: { enter: 'start' },
    intro: { title: 'MÀN 2 · NHIỆM VỤ', text: 'Đà Nẵng. Cùng Dian vượt Cầu Rồng sang bờ Tây, lên đèo tới Cầu Vàng giữa biển mây. Cẩn thận: đầu rồng phun lửa phủ kín mặt cầu.' },
    objectives: [
      { title: 'BIỂN MỸ KHÊ', text: 'Bọ Cát đào dưới cát — thấy gợn cát thì tránh xa, đợi nó trồi lên rồi bắn.' },
      { title: 'CẦU RỒNG', text: 'Robot Tuần Cầu có khiên phía trước: vòng ra sau, hoặc để Dian bắn tỉa. Đầu rồng phun lửa theo đợt — tránh khỏi mặt cầu khi thấy vạch cam.' },
      { title: 'ĐÈO BÀ NÀ', text: 'Wave cuối. Tiến lên Cầu Vàng.' },
      { title: 'BOSS · CỰ NHÂN ĐÁ BÀ NÀ', text: 'Bàn tay đá đập xuống vòng đỏ — lộn né khỏi vòng. Khi hai tay kẹp hai bên, chạy dọc cầu. Bắn vào đầu đá giữa biển mây.' },
    ],
    challenges: [
      { id: 'jammer', type: 'destroy', name: 'Trạm Phát Sóng Đầu Dê', desc: 'Phá 4 trạm phát sóng GoatEvil trên nóc phố', kind: 'goatCrate', r: 22, hp: 340,
        spawner: { type: 'bridgeBot', every: 8, range: 700, cap: 4 },
        targets: [{ x: 4000, y: 900 }, { x: 3300, y: 1900 }, { x: 2000, y: 1200 }, { x: 1700, y: 2100 }], reward: { mod: 'barrel' } },
      { id: 'dragon', type: 'hold', name: 'Đầu Cầu Rồng', desc: 'Giữ đầu Cầu Rồng 16 giây', zone: { x: RIV.x1 + 90, y: 1500, r: 85 }, time: 16,
        mix: { sandCrawler: 2, bridgeBot: 1 }, spawnEvery: 1.6, reward: { mod: 'split' } },
      { id: 'streak', type: 'streak', name: 'Gió Sông Hàn', desc: '24 hạ gục liên tiếp không trúng đòn', count: 24, reward: { mod: 'trigger' } },
    ],
    clue: { x: MEMO.x, y: MEMO.y, title: 'Ghi chép số 6 — Đà Nẵng', text: [
      'Ngày 34. Lô V-0 cuối cùng rời cảng Tiên Sa trong đêm. Đích đến: Đà Lạt — nơi đủ lạnh để giữ chủng gốc sống.',
      'Hạnh đã gặp Dũng. Cô ấy nói hết rồi. Tôi đáng lẽ phải xử lý chuyện này từ mười hai năm trước.',
      'Hội đồng hỏi tiến độ mỗi tuần. Họ không quan tâm cái giá. Tôi cũng vậy.',
    ] },
    comms: [
      { on: 'start', t: 2.5, lines: [['DIAN', 'Lần này tôi đi cùng cậu tới cùng. Cô Hạnh nói rồi: V-0 được thả ra có chủ đích.'], ['HUNTER', 'Ai thả?'], ['DIAN', 'Người ký tên "T.K." trên mọi hoá đơn mà cậu đã thấy.']] },
      { on: 'start', t: 12, lines: [['GOATEVIL', 'Đà Nẵng — thành phố đáng sống. Hãy xem nó còn đáng sống bao lâu.']] },
      { on: 'wave', wave: 2, lines: [['DIAN', 'Đầu rồng sắp phun lửa. Nghe tiếng rít là rời khỏi mặt cầu ngay!']] },
      { on: 'wave', wave: 3, lines: [['HUNTER', '"T.K."… Ted K. Dian, anh nghĩ Giáo sư còn sống?'], ['DIAN', '…Tôi không chắc. Đi tiếp đã.']] },
      { on: 'low', lines: [['DIAN', 'Lùi lại! Tôi che cho cậu.']] },
      { on: 'boss', lines: [['GOATEVIL', 'Đôi bàn tay đỡ cây cầu này hàng năm trời. Giờ chúng sẽ bóp nát ngươi.'], ['DIAN', 'Cái đầu giữa mây mới là thứ điều khiển. Tôi ghim nó, cậu né tay!']] },
      { on: 'phase', phase: 3, lines: [['DIAN', 'Mắt nó sáng lên — tia quét! Lộn né qua tia!']] },
      { on: 'won', lines: [['HUNTER', 'Dian. Anh vừa ngập ngừng. Anh biết điều gì đó.'], ['DIAN', 'Ở Đà Lạt có một nhà kính. Đến đó, cậu sẽ tự thấy.']] },
    ],
    light3d: { hemiSky: 0xfff0d8, hemiGround: 0x3a4a5a, hemi: 1.4, sun: 0xffe8c0, sunI: 1.7, exposure: 1.3 },

    setup(G) {
      G.__over = null;
      G.gs.fireT = 14; G.gs.fireWarn = 0;
      G.gs.hands = [0, 1].map((i) => { const a = { kind: 'stoneHand', x: ARC.x + HAND_REST[i].dx, y: ARC.y + HAND_REST[i].dy, h: 60, idx: i, r: 60, hidden: true }; G.actors.push(a); return a; });
      G.actors.push({ kind: 'dragonBridge', x: (RIV.x0 + RIV.x1) / 2, y: 1500, r: 220 });
      G.actors.push({ kind: 'goldenRail', x: ARC.x, y: ARC.y, r: 600 });
    },
    update(G, dt) {
      const s = G.gs;
      // Cầu Rồng phun lửa theo đợt
      if (G.state === 'fight' || G.state === 'break' || G.state === 'boss') {
        s.fireT -= dt;
        if (s.fireT <= 0 && s.fireWarn <= 0) { s.fireWarn = 1.6; MB.Audio.play('roar'); MB.HUD.toast('<b>CẦU RỒNG</b> sắp phun lửa!', '#ff9a4a'); }
      }
      if (s.fireWarn > 0) {
        s.fireWarn -= dt;
        if (s.fireWarn <= 0) {
          s.fireT = U.rnd(18, 24); MB.Audio.play('shot_flame'); G.shake(6);
          for (let x = RIV.x0 - 20; x <= RIV.x1 + 10; x += 46) G.addHazard({ kind: 'fire', x, y: 1500 + U.rnd(-20, 20), r: 58, dps: 30, burn: 1.5, enemyDps: 60, life: 3 });
        }
      }
      if (!G.boss) G.gs.hands.forEach((a) => { a.hidden = true; });
    },
    drawUnder(G, ctx) {
      const t = G.time, c = G.cam, vw = G.W / G.zoom, vh = G.H / G.zoom;
      // mây trôi dưới Cầu Vàng
      if (c.x < MTN_X) { ctx.fillStyle = 'rgba(255,255,255,.4)'; for (let i = 0; i < 30; i++) { const x = ((i * 167 + t * 16) % (MTN_X + 200)) - 100, y = (i * 101) % WH; if (y < c.y - 60 || y > c.y + vh + 60 || mtnWalk(x, y, 20)) continue; U.ellipse(ctx, x, y, 70 + (i % 3) * 30, 22); ctx.fill(); } }
      // sóng biển Mỹ Khê
      ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 3;
      for (let y = Math.max(0, c.y - 40); y < Math.min(WH, c.y + vh + 40); y += 60) { const x = SEA_X + 6 + Math.sin(t * 1.6 + y * 0.03) * 10; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 14, y + 30, x, y + 60); ctx.stroke(); }
      // vạch cảnh báo lửa trên Cầu Rồng
      if (G.gs.fireWarn > 0) { const k = 1 - G.gs.fireWarn / 1.6; ctx.fillStyle = `rgba(255,120,40,${0.15 + k * 0.35 * (0.6 + Math.sin(t * 20) * 0.4)})`; ctx.fillRect(RIV.x0 - 60, DRAGON.y0, RIV.x1 - RIV.x0 + 80, DRAGON.y1 - DRAGON.y0); }
      void vw;
    },
    drawOver(G, ctx) {
      VN.drawOver(G, ctx);
      // thân Rồng vàng uốn lượn trên Cầu Rồng (vẽ đè, nhìn nghiêng)
      const t = G.time, y0 = 1500 - 24;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#a8701a'; ctx.lineWidth = 18; ctx.beginPath();
      for (let x = RIV.x0 - 30; x <= RIV.x1 + 10; x += 8) { const yy = y0 - Math.abs(Math.sin((x - RIV.x0) / 70)) * 46; if (x === RIV.x0 - 30) ctx.moveTo(x, yy); else ctx.lineTo(x, yy); }
      ctx.stroke(); ctx.strokeStyle = '#f2c63a'; ctx.lineWidth = 11; ctx.stroke();
      ctx.fillStyle = '#d89a2a'; for (let x = RIV.x0; x <= RIV.x1; x += 24) { const yy = y0 - Math.abs(Math.sin((x - RIV.x0) / 70)) * 46; ctx.beginPath(); ctx.moveTo(x - 5, yy - 4); ctx.lineTo(x, yy - 16); ctx.lineTo(x + 5, yy - 4); ctx.fill(); }
      // đầu rồng ở bờ Đông
      const hx = RIV.x1 + 20, hy = y0 - 30, open = G.gs.fireWarn > 0 ? 0.6 : 0.2;
      ctx.fillStyle = '#e8b030'; U.ellipse(ctx, hx, hy, 34, 22); ctx.fill();
      ctx.fillStyle = '#7a3a0a'; ctx.beginPath(); ctx.moveTo(hx - 30, hy); ctx.lineTo(hx - 58, hy - 14 * open - 2); ctx.lineTo(hx - 58, hy + 14 * open + 2); ctx.fill();
      ctx.strokeStyle = '#f2d06a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(hx + 10, hy - 18); ctx.quadraticCurveTo(hx + 30, hy - 44, hx + 50, hy - 40); ctx.moveTo(hx, hy - 20); ctx.quadraticCurveTo(hx + 14, hy - 54, hx + 36, hy - 58); ctx.stroke();
      ctx.fillStyle = G.gs.fireWarn > 0 ? '#ff3a1a' : '#3a1a0a'; U.circle(ctx, hx - 12, hy - 8, 4); ctx.fill();
      if (G.gs.fireWarn > 0 && Math.random() < 0.8) G.particle({ x: hx - 58, y: hy, vx: -U.rnd(60, 160), vy: U.rnd(-30, 30), life: 0.4, color: '#ff9a3a', r: 3 });
      void t;
    },
    drawScreen(G, ctx) {
      // nắng biển sáng ấm
      const gr = ctx.createLinearGradient(G.W, 0, 0, G.H); gr.addColorStop(0, 'rgba(255,220,160,.14)'); gr.addColorStop(1, 'rgba(80,140,200,.08)');
      ctx.fillStyle = gr; ctx.fillRect(0, 0, G.W, G.H);
    },

    buildGround(g, w, h, rand) {
      // phố: nhựa đường + vỉa hè
      g.fillStyle = '#4a4e52'; g.fillRect(0, 0, w, h);
      GK.patches(g, rand, w, h, 220, ['rgba(90,94,98,.35)', 'rgba(40,44,48,.3)'], 30, 120);
      for (const o of obstacles) if (o.kind === 'dnTower') { g.fillStyle = '#8a8478'; g.fillRect(o.x - o.w / 2 - 22, o.y - o.h / 2 - 22, o.w + 44, o.h + 44); }
      g.strokeStyle = 'rgba(240,240,240,.4)'; g.lineWidth = 3; g.setLineDash([26, 22]);
      for (const y of [690, 1500]) { g.beginPath(); g.moveTo(MTN_X, y); g.lineTo(BEACH_X, y); g.stroke(); }
      g.setLineDash([]);
      // biển mây Bà Nà + đèo
      const cg = g.createLinearGradient(0, 0, MTN_X, 0); cg.addColorStop(0, '#dfe8ee'); cg.addColorStop(1, '#c8d6e0');
      g.fillStyle = cg; g.fillRect(0, 0, MTN_X, h);
      g.fillStyle = 'rgba(255,255,255,.7)'; for (let i = 0; i < 140; i++) { g.beginPath(); g.ellipse(rand() * MTN_X, rand() * h, 40 + rand() * 70, 14 + rand() * 16, 0, 0, U.TAU); g.fill(); }
      // núi xanh dưới mây (lấp ló)
      g.fillStyle = 'rgba(70,110,80,.25)'; for (let i = 0; i < 10; i++) { g.beginPath(); g.ellipse(rand() * MTN_X, rand() * h, 120, 60, 0, 0, U.TAU); g.fill(); }
      // đường đèo nối Cầu Vàng
      g.fillStyle = '#6a6458'; g.fillRect(ARC.x + ARC.r - ARC.w, ARC.y - 70, MTN_X - (ARC.x + ARC.r - ARC.w) + 20, 140);
      // Cầu Vàng: mặt cầu cong vàng óng, lan can
      g.lineCap = 'butt';
      g.strokeStyle = '#8a6a1a'; g.lineWidth = ARC.w * 2 + 10; g.beginPath(); g.arc(ARC.x, ARC.y, ARC.r, -ARC.a1, -ARC.a0); g.stroke();
      const dg = g.createRadialGradient(ARC.x, ARC.y, ARC.r - ARC.w, ARC.x, ARC.y, ARC.r + ARC.w); dg.addColorStop(0, '#e8c050'); dg.addColorStop(0.5, '#f8dc78'); dg.addColorStop(1, '#d8a838');
      g.strokeStyle = dg; g.lineWidth = ARC.w * 2; g.stroke();
      g.strokeStyle = 'rgba(120,90,30,.35)'; g.lineWidth = 1.5;
      for (let a = ARC.a0; a <= ARC.a1; a += 0.02) { const p0 = arcPt(a, ARC.r - ARC.w), p1 = arcPt(a, ARC.r + ARC.w); g.beginPath(); g.moveTo(p0.x, p0.y); g.lineTo(p1.x, p1.y); g.stroke(); }
      g.fillStyle = '#c89a30'; g.beginPath(); g.arc(ARC_END.x, ARC_END.y, 130, 0, U.TAU); g.fill();
      // sông Hàn + 2 cầu
      const rg = g.createLinearGradient(RIV.x0, 0, RIV.x1, 0); rg.addColorStop(0, '#2a6a8a'); rg.addColorStop(1, '#1e5a7a');
      g.fillStyle = rg; g.fillRect(RIV.x0, 0, RIV.x1 - RIV.x0, h);
      g.fillStyle = '#6a6a6e'; g.fillRect(RIV.x0 - 10, DRAGON.y0, RIV.x1 - RIV.x0 + 20, DRAGON.y1 - DRAGON.y0); g.fillRect(RIV.x0 - 10, HAN.y0, RIV.x1 - RIV.x0 + 20, HAN.y1 - HAN.y0);
      g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 3; g.setLineDash([20, 16]); g.beginPath(); g.moveTo(RIV.x0, 1500); g.lineTo(RIV.x1, 1500); g.moveTo(RIV.x0, 690); g.lineTo(RIV.x1, 690); g.stroke(); g.setLineDash([]);
      // bãi Mỹ Khê + biển
      const bg = g.createLinearGradient(BEACH_X, 0, SEA_X, 0); bg.addColorStop(0, '#d8c8a0'); bg.addColorStop(1, '#f0e4c4');
      g.fillStyle = bg; g.fillRect(BEACH_X, 0, SEA_X - BEACH_X, h);
      const sg = g.createLinearGradient(SEA_X, 0, w, 0); sg.addColorStop(0, '#5ac0c8'); sg.addColorStop(0.3, '#2a90b0'); sg.addColorStop(1, '#1a6a90');
      g.fillStyle = sg; g.fillRect(SEA_X, 0, w - SEA_X, h);
      // tượng cá chép hoá rồng (ghi chú manh mối gần đây)
      g.fillStyle = '#9a9488'; g.beginPath(); g.arc(MEMO.x + 40, MEMO.y + 40, 40, 0, U.TAU); g.fill();
      GK.vignette(g, w, h, 0.3);
    },

    /* ---------- 3D ---------- */
    models3d: {
      sandCrawler: (K) => ({
        base: 18,
        build() {
          const T = K.T, g = new T.Group(), sh = K.std(0xc8a860, { rough: 0.6 });
          const b = K.mesh(K.sph(16, 14), sh, 0, 9, 0); b.scale.set(1.2, 0.5, 0.8); g.add(b);
          const legs = []; for (const sd of [-1, 1]) for (let i = 0; i < 3; i++) { const l = K.mesh(K.cyl(1.2, 0.8, 18, 5), K.std(0x6a5428), -6 + i * 6, 5, sd * 13); l.rotation.x = sd * 1.1; g.add(l); legs.push(l); }
          for (const sd of [-1, 1]) { const m = new T.Mesh(K.G3('mand', () => new T.ConeGeometry(2, 12, 5)), K.std(0x3a2a10)); m.position.set(22, 9, sd * 4); m.rotation.z = -Math.PI / 2; g.add(m); }
          g.userData = { legs, h: 20 }; return g;
        },
        anim(e, m, G) { m.userData.legs.forEach((l, i) => { l.rotation.z = Math.sin(G.time * 16 + i) * 0.4; }); },
      }),
      bridgeBot: (K) => ({
        base: 20,
        build() {
          const T = K.T, g = new T.Group();
          g.add(K.mesh(K.box(26, 24, 24), K.std(0x2a3440, { metal: 0.6, rough: 0.4 }), 0, 22, 0), K.mesh(K.box(18, 8, 18), K.std(0x4a5a6a, { metal: 0.6 }), 0, 38, 0));
          g.add(K.mesh(K.cyl(4, 4, 10, 8), K.std(0x1a1e24), -6, 6, -8), K.mesh(K.cyl(4, 4, 10, 8), K.std(0x1a1e24), -6, 6, 8));
          const eye = K.mesh(K.sph(3.5, 8), K.glowMat(0x7ad8ff, 2.4), 12, 38, 0, false); g.add(eye);
          const sh = new T.Mesh(K.G3('bshield', () => new T.CylinderGeometry(24, 24, 30, 16, 1, true, -0.9, 1.8)), new T.MeshBasicMaterial({ color: 0x7ad2ff, transparent: true, opacity: 0.25, side: T.DoubleSide, depthWrite: false }));
          sh.material.userData.own = true; sh.position.y = 22; sh.rotation.y = Math.PI / 2; g.add(sh);
          g.userData = { eye, h: 44 }; return g;
        },
        anim(e, m) { m.userData.eye.material.color.setHex(e.state === 'aim' ? 0xff4a4a : 0x7ad8ff); },
      }),
      stoneGiant: (K) => ({
        base: 70,
        build() {
          const T = K.T, g = new T.Group(), st = K.std(0x8a8672, { own: true, flat: true, rough: 0.95 });
          const head = K.mesh(K.bumpy('sghead', new T.SphereGeometry(70, 18, 14), 3, 1.1), st, 0, 60, 0); head.scale.set(0.9, 1.15, 1); g.add(head);
          const moss = K.std(0x4a7a3a, { flat: true });
          for (let i = 0; i < 10; i++) { const mm = K.mesh(K.sph(14, 6), moss, -40 + (i * 23) % 80, 120 + (i % 3) * 8, -30 + (i * 17) % 60); g.add(mm); }
          const eyes = [];
          for (const z of [-26, 26]) { const ey = K.mesh(K.sph(10, 10), K.glowMat(0xffb84a, 3), 58, 80, z, false); ey.scale.set(0.6, 0.6, 1.1); g.add(ey); eyes.push(ey); }
          g.add(K.mesh(K.box(10, 8, 50), K.std(0x2a2820), 64, 34, 0));
          const fog = K.mesh(K.cyl(110, 120, 6, 20), K.std(0xffffff, { transparent: true, opacity: 0.6 }), 0, 4, 0, false); g.add(fog);
          g.userData = { eyes, h: 150 }; return g;
        },
        anim(e, m, G) { const c = e.state === 'eye' || e.state === 'eyeAim' ? 0xfff3a0 : e.enrageT > 0 ? 0xff4a2a : 0xffb84a; m.userData.eyes.forEach((ey) => ey.material.color.setHex(c)); m.position.y = Math.sin(G.time * 0.8) * 6; },
      }),
    },
    props3d: {
      void: (o, K) => new K.T.Group(),
      dnWater: (o, K) => new K.T.Group(),
      dnTower: (o, K) => {
        const T = K.T, g = new T.Group(), H = o.tall * 0.8;
        const glass = K.std(new T.Color(o.col).getHex(), { own: true, transparent: true, metal: 0.6, rough: 0.15 });
        g.add(K.mesh(K.box(o.w, H, o.h), glass, 0, H / 2, 0));
        for (let y = 20; y < H; y += 26) g.add(K.mesh(K.box(o.w + 1, 2, o.h + 1), K.std(0xc8d0d8, { metal: 0.5 }), 0, y, 0));
        g.add(K.mesh(K.box(o.w * 0.3, 12, o.h * 0.25), K.std(0x3c464e), 0, H + 6, 0));
        if (o.lit) { const l = K.mesh(K.sph(3, 6), K.glowMat(0xff4040, 2.5), o.w / 2 - 6, H + 4, o.h / 2 - 6, false); g.add(l); }
        g.userData.canopy = [glass]; return g;
      },
      umbrella: (o, K) => {
        const T = K.T, g = new T.Group();
        g.add(K.mesh(K.cyl(1, 1, 30, 5), K.std(0xe0e0e0), 0, 15, 0));
        const top = new T.Mesh(K.G3('umb', () => new T.ConeGeometry(26, 10, 8)), K.std(new T.Color(o.col).getHex(), { rough: 0.7 })); top.position.y = 33; g.add(top);
        return g;
      },
    },
    actors3d: Object.assign({
      stoneHand: (a, K) => {
        const T = K.T, g = new T.Group(), st = K.std(0x8a8672, { flat: true, rough: 0.95 }), moss = K.std(0x4a7a3a, { flat: true });
        const palm = K.mesh(K.bumpy('palm', new T.SphereGeometry(38, 14, 10), 2.4, 1.2), st, 0, 0, 0); palm.scale.set(1.3, 0.45, 1); g.add(palm);
        for (let i = 0; i < 4; i++) { const f = K.mesh(K.cyl(9, 7, 46, 7), st, 40, 10, -24 + i * 16); f.rotation.z = -1.2; g.add(f); }
        const th = K.mesh(K.cyl(9, 7, 36, 7), st, 10, 8, 40); th.rotation.x = 1.1; g.add(th);
        for (let i = 0; i < 6; i++) g.add(K.mesh(K.sph(7, 5), moss, -20 + i * 9, 16, (i % 2 ? 14 : -14)));
        const arm = K.mesh(K.cyl(26, 32, 140, 8), st, -40, -70, 0); arm.rotation.z = 0.5; g.add(arm);
        g.rotation.y = a.idx ? Math.PI : 0;
        g.userData.anim = (aa, m) => { m.position.y = 20 + aa.h * 1.4; m.visible = !aa.hidden; };
        return g;
      },
      dragonBridge: (a, K) => {
        const T = K.T, g = new T.Group(), gold = K.std(0xf2c63a, { metal: 0.6, rough: 0.35 }), dark = K.std(0xa8701a, { metal: 0.4 });
        const span = RIV.x1 - RIV.x0 + 40, n = 60;
        for (let i = 0; i < n; i++) {
          const x = -span / 2 + i * span / n, y = 18 + Math.abs(Math.sin((x + span / 2) / 70)) * 58;
          const s = K.mesh(K.sph(9, 8), gold, x, y, -54, true); s.scale.set(1.2, 1, 1); g.add(s);
          if (i % 3 === 0) g.add(K.mesh(new T.ConeGeometry(3, 10, 4), dark, x, y + 10, -54));
        }
        const head = new T.Group(); head.position.set(span / 2 + 10, 50, -54); g.add(head);
        head.add(K.mesh(K.sph(26, 12), gold, 0, 0, 0)); const sn = K.mesh(K.box(40, 14, 26), gold, -30, -4, 0); head.add(sn);
        for (const z of [-10, 10]) { const hr = new T.Mesh(new T.ConeGeometry(3, 30, 5), dark); hr.position.set(10, 22, z); hr.rotation.z = -0.6; head.add(hr); }
        const eyeM = K.glowMat(0xff3a1a, 2); head.add(K.mesh(K.sph(4, 6), eyeM, -16, 8, 12, false), K.mesh(K.sph(4, 6), eyeM, -16, 8, -12, false));
        const fire = K.glowSprite(0xff8a3a, 140, 0.9); fire.position.set(-70, -4, 0); head.add(fire);
        g.userData.anim = (aa, m, G) => { fire.visible = G.gs.fireWarn > 0 || G.hazards.some((h) => h.kind === 'fire' && h.life > 0); fire.scale.setScalar(120 + Math.random() * 60); };
        return g;
      },
      goldenRail: (a, K) => {
        const T = K.T, g = new T.Group(), rail = K.std(0xd8b048, { metal: 0.7, rough: 0.3 });
        for (const rr of [ARC.r - ARC.w, ARC.r + ARC.w]) for (let t = ARC.a0; t <= ARC.a1 + 0.001; t += 0.06) {
          const p = arcPt(t, rr), q = arcPt(t + 0.06, rr);
          g.add(K.mesh(K.cyl(1.2, 1.2, 18, 5), rail, p.x - ARC.x, 9, p.y - ARC.y));
          if (t + 0.06 <= ARC.a1) { const L = Math.hypot(q.x - p.x, q.y - p.y), b = K.mesh(K.box(L, 2, 2), rail, (p.x + q.x) / 2 - ARC.x, 18, (p.y + q.y) / 2 - ARC.y, false); b.rotation.y = -Math.atan2(q.y - p.y, q.x - p.x); g.add(b); }
        }
        return g;
      },
    }, MB.Story.actors3d),
  });
  // 2D: bàn tay đá (bóng đổ lớn khi giơ cao, chạm đất khi đập)
  MB.Props.registerActor('stoneHand', (ctx, a, G) => {
    if (a.hidden) return;
    const lift = a.h * 0.6, s = 1 + a.h / 260;
    ctx.fillStyle = `rgba(0,0,0,${0.35 - Math.min(0.25, a.h / 600)})`; U.ellipse(ctx, a.x + 10, a.y + 10, 70 * s, 40 * s); ctx.fill();
    ctx.save(); ctx.translate(a.x, a.y - lift); ctx.scale(s * (a.idx ? -1 : 1), s);
    const gr = ctx.createRadialGradient(-10, -10, 6, 0, 0, 70); gr.addColorStop(0, '#a8a490'); gr.addColorStop(1, '#5a5848');
    ctx.fillStyle = gr; U.ellipse(ctx, 0, 0, 52, 36); ctx.fill();
    ctx.strokeStyle = '#6a6858'; ctx.lineCap = 'round'; ctx.lineWidth = 16;
    for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(30, -24 + i * 16); ctx.lineTo(70, -30 + i * 20); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(-10, 30); ctx.lineTo(10, 58); ctx.stroke();
    ctx.fillStyle = 'rgba(70,110,50,.6)'; for (let i = 0; i < 6; i++) { U.circle(ctx, -30 + i * 10, (i % 2 ? 12 : -12), 6); ctx.fill(); }
    ctx.restore();
  });
  MB.Props.registerActor('dragonBridge', () => {});
  MB.Props.registerActor('goldenRail', () => {});
})(window.MB);
