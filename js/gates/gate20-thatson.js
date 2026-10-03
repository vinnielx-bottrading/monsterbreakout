/* Gate 20 — THẤT SƠN · AN GIANG: Bảy núi (Màn 2 · Nguồn Gốc)
   Thắng cảnh: rừng tràm Trà Sư ngập nước (lối ván gỗ xuyên rừng, mặt nước phủ bèo xanh), cánh đồng thốt nốt
   Tịnh Biên, chân núi Cấm đá tảng và tuyến cáp treo lên đỉnh.
   Cơ chế: kênh sâu trong rừng tràm chặn đường (qua bằng cầu ván), bèo phủ làm chậm; NHIỄU TÍN HIỆU — GoatEvil
   dội "mưa điểm ảnh" xuống quanh Hunter theo đợt (vòng đỏ báo trước).
   Dian quay lại đánh cùng; cô Hạnh qua bộ đàm.
   Quái mới: Hồn Rừng Tràm (bay xuyên rừng, bắn cầu độc chậm), Lính Đầu Dê (lấy đà húc, tiếp đất dậm sóng).
   Boss: GOATEVIL · HIỆN THÂN — đầu dê ảo ảnh khổng lồ: dịch chuyển, bắn tia nhiễu, quét tia kép; giai đoạn 2 dựng 3 trụ
   tín hiệu (còn trụ = gần như bất tử); giai đoạn 3 phân thân giả + mưa điểm ảnh dày đặc. */
'use strict';
(function (MB) {
  const U = MB.U, Ens = MB.Enemies, GK = MB.GK, VN = MB.VN;
  const WW = 4200, WH = 3000;
  const H3 = 0.45;
  const FOREST = { x1: 1900 };                         // rừng tràm phía Tây
  const CH = [                                          // kênh sâu (x0,y0,x1,y1) + lối cầu ván
    { x0: 0, y0: 900, x1: FOREST.x1, y1: 990, gaps: [600, 1500], h: true },
    { x0: 0, y0: 2000, x1: FOREST.x1, y1: 2090, gaps: [420, 1250], h: true },
    { x0: FOREST.x1, y0: 0, x1: FOREST.x1 + 90, y1: WH, gaps: [500, 1500, 2500], h: false },
  ];
  const BR = 100;
  const ARENA = { x: 3420, y: 1250, r: 380 };
  const CABLE = { x0: 2950, y0: 2620, x1: 3980, y1: 520 };  // ga dưới → ga trên
  const GLITCH = ['#ff3a5a', '#ffd0d6', '#3af0ff', '#ffffff'];

  /* ---------- vẽ 2D ---------- */
  MB.Props.register('tsWater', () => {});
  MB.Props.register('cajuput', (ctx, o) => {
    MB.Props.shadow(ctx, o.x + 14, o.y + 6, o.r * 1.4, o.r * 0.5, 0.22);
    ctx.fillStyle = '#d8d0c0'; U.circle(ctx, o.x, o.y, o.r * 0.45); ctx.fill();
    ctx.strokeStyle = '#a89a88'; ctx.lineWidth = 1; U.circle(ctx, o.x, o.y, o.r * 0.45); ctx.stroke();
  });
  VN.over.cajuput = (ctx, o, G) => {
    const cx = o.x, cy = o.y - o.tall * H3 * 0.7, r = o.r * 2.1;
    ctx.globalAlpha = VN.coverAlpha(G, cx - r, cy - r, cx + r, cy + r) * 0.95;
    ctx.strokeStyle = '#e8e0d0'; ctx.lineWidth = o.r * 0.5; ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(cx, cy + r * 0.4); ctx.stroke();
    ctx.fillStyle = '#4a7a3a'; U.circle(ctx, cx, cy, r); ctx.fill();
    ctx.fillStyle = '#5a8a42'; U.circle(ctx, cx - r * 0.3, cy - r * 0.25, r * 0.6); ctx.fill();
    ctx.fillStyle = 'rgba(200,230,150,.25)'; U.circle(ctx, cx - r * 0.35, cy - r * 0.35, r * 0.3); ctx.fill();
    ctx.globalAlpha = 1;
  };
  // thốt nốt: thân cao thẳng, tán lá quạt tròn
  MB.Props.register('thotnot', (ctx, o) => {
    MB.Props.shadow(ctx, o.x + 30, o.y + 10, o.r * 2, o.r * 0.7, 0.22);
    ctx.fillStyle = '#5a4a3a'; U.circle(ctx, o.x, o.y, o.r * 0.5); ctx.fill();
  });
  VN.over.thotnot = (ctx, o, G, t) => {
    const cx = o.x, cy = o.y - o.tall * H3, r = o.r * 2.4;
    ctx.globalAlpha = VN.coverAlpha(G, cx - r, cy - r, cx + r, cy + r) * 0.95;
    ctx.strokeStyle = '#5a4a3a'; ctx.lineWidth = o.r * 0.55; ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(cx, cy); ctx.stroke();
    for (let i = 0; i < 14; i++) {
      const a = i / 14 * U.TAU + (t || 0) * 0.05;
      ctx.strokeStyle = i % 2 ? '#3a7a32' : '#4a8a3a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.85); ctx.stroke();
      ctx.fillStyle = i % 2 ? '#3a7a32' : '#4a8a3a'; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r * 0.5, cy + Math.sin(a) * r * 0.45); ctx.lineTo(cx + Math.cos(a - 0.2) * r, cy + Math.sin(a - 0.2) * r * 0.85); ctx.lineTo(cx + Math.cos(a + 0.2) * r, cy + Math.sin(a + 0.2) * r * 0.85); ctx.fill();
    }
    ctx.fillStyle = '#6a5a2a'; U.circle(ctx, cx, cy, 6); ctx.fill();
    ctx.globalAlpha = 1;
  };
  // ga cáp treo
  MB.Props.register('cableStation', (ctx, o) => {
    const x = o.x - o.hw, y = o.y - o.hh, H = 60 * H3;
    VN.shadowBox(ctx, x, y - H, o.w, o.h, 60, 0.3);
    ctx.fillStyle = '#e8e4dc'; ctx.fillRect(x, y + o.h - H, o.w, H);
    ctx.fillStyle = '#5a8ab0'; ctx.fillRect(x + 10, y + o.h - H * 0.8, o.w - 20, H * 0.5);
  });
  VN.over.cableStation = (ctx, o, G) => {
    const x = o.x - o.hw, y = o.y - o.hh, H = 60 * H3;
    ctx.globalAlpha = VN.coverAlpha(G, x, y - H - 20, x + o.w, y + o.h - H);
    ctx.fillStyle = '#c8302a'; ctx.beginPath(); ctx.moveTo(x - 8, y - H + o.h); ctx.lineTo(x + o.w * 0.2, y - H - 10); ctx.lineTo(x + o.w * 0.8, y - H - 10); ctx.lineTo(x + o.w + 8, y - H + o.h); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = '900 11px system-ui'; ctx.textAlign = 'center'; ctx.fillText('CÁP TREO NÚI CẤM', o.x, y - H + o.h * 0.6);
    ctx.globalAlpha = 1;
  };
  // trụ tín hiệu GoatEvil (giai đoạn 2 của boss) — vẽ kiểu quái
  MB.Props.registerHazard('duckweed', (ctx, h) => {
    ctx.fillStyle = 'rgba(110,170,50,.55)'; U.circle(ctx, h.x, h.y, h.r); ctx.fill();
    ctx.fillStyle = 'rgba(150,210,70,.6)'; for (let i = 0; i < 14; i++) { const a = i * 2.4, r = (i % 7) / 7 * h.r * 0.85; U.circle(ctx, h.x + Math.cos(a) * r, h.y + Math.sin(a) * r, 3); ctx.fill(); }
  });

  /* ---------- quái mới ---------- */
  Ens.register('cajuputWraith', Ens.make({
    name: 'Hồn Rừng Tràm', r: 16, hp: 85, speed: 135, dmg: 14, score: 170, fly: true, blood: '#1a3a2a', gore: '#9aff9a', knockMul: 1,
    draw(ctx, e, G) {
      const t = G.time, aim = e.state === 'aim';
      ctx.save(); ctx.translate(e.x, e.y + Math.sin(t * 3 + e.t) * 4);
      ctx.fillStyle = 'rgba(0,0,0,.15)'; U.ellipse(ctx, 6, 22, 14, 6); ctx.fill();
      const gr = ctx.createRadialGradient(0, -4, 2, 0, 0, 22); gr.addColorStop(0, 'rgba(220,255,220,.9)'); gr.addColorStop(1, 'rgba(90,180,110,0)');
      ctx.fillStyle = gr; U.circle(ctx, 0, 0, 22); ctx.fill();
      ctx.fillStyle = 'rgba(170,230,170,.75)'; ctx.beginPath(); ctx.moveTo(-12, -6); ctx.quadraticCurveTo(0, -24, 12, -6); ctx.lineTo(14, 14); for (let i = 0; i < 5; i++) ctx.lineTo(10 - i * 6, 10 + (i % 2 ? 8 : 0) + Math.sin(t * 6 + i) * 3); ctx.lineTo(-14, 14); ctx.fill();
      ctx.fillStyle = aim ? '#ff3a3a' : '#1a3a1a'; U.circle(ctx, -4, -6, 2.4); ctx.fill(); U.circle(ctx, 4, -6, 2.4); ctx.fill();
      ctx.strokeStyle = 'rgba(120,90,60,.8)'; ctx.lineWidth = 1.5; for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sd * 10, 0); ctx.lineTo(sd * 20, -8); ctx.lineTo(sd * 24, -4); ctx.stroke(); }
      ctx.restore();
    },
  }, Ens.AI.shooter({ cd: [2.6, 3.6], min: 200, max: 460, aim: 0.7, lineLen: 360, wig: { f: 2, a: 0.8 },
    shot: (e, G, a) => { MB.Audio.play('spit'); G.enemyShot({ x: e.x, y: e.y, a, speed: 240, r: 11, dmg: 15, color: '#9aff9a', owner: e, life: 3 }); } })));

  Ens.register('goatBrute', {
    name: 'Lính Đầu Dê', r: 22, hp: 260, speed: 110, dmg: 24, score: 240, blood: '#3a1010', gore: '#ff7a7a', knockMul: 0.3,
    init(e) { e.cd = U.rnd(1.5, 3); },
    update(e, G, dt) {
      const p = G.player, d = Ens.distPlayer(e, G);
      e.cd -= dt;
      if (e.state === 'wind') { Ens.stop(e, dt, 14); e.st -= dt; e.face = e.lock; if (e.st <= 0) { e.state = 'dash'; e.st = 0.5; e.vx = Math.cos(e.lock) * 600; e.vy = Math.sin(e.lock) * 600; MB.Audio.play('dash'); } }
      else if (e.state === 'dash') {
        e.st -= dt; e.face = e.lock;
        if (e.st <= 0 || e.bumped) { e.state = 'daze'; e.st = 0.8; G.shockwave(e.x, e.y, 150, 0.5, 14, 'rgba(255,90,90,.8)'); G.shake(4); }
      } else if (e.state === 'daze') { Ens.stop(e, dt, 12); e.st -= dt; if (e.st <= 0) { e.state = null; e.cd = U.rnd(2, 3.4); } }
      else {
        Ens.steer(e, G, p.x, p.y, e.speed, dt, { f: 3, a: 0.25 });
        if (d < 360 && e.cd <= 0 && G.los(e.x, e.y, p.x, p.y)) { e.state = 'wind'; e.st = 0.7; e.lock = Ens.toPlayer(e, G); MB.Audio.play('growl'); }
      }
    },
    onContact(e, G) { if (e.state === 'dash') { const p = G.player, a = Math.atan2(p.y - e.y, p.x - e.x); p.vx += Math.cos(a) * 460; p.vy += Math.sin(a) * 460; } },
    tele(ctx, e, G) { if (e.state === 'wind') G.drawTelegraphLine(ctx, e.x, e.y, e.lock, 320, 1 - e.st / 0.7); },
    draw(ctx, e, G) {
      const t = G.time, mv = Math.hypot(e.vx, e.vy) > 20, walk = mv ? Math.sin(t * 10 + e.t) : 0;
      ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.face || 0);
      ctx.fillStyle = 'rgba(0,0,0,.3)'; U.ellipse(ctx, 4, 6, 26, 20); ctx.fill();
      ctx.fillStyle = '#2a2a30'; U.ellipse(ctx, -6 + walk * 6, -12, 9, 7); ctx.fill(); U.ellipse(ctx, -6 - walk * 6, 12, 9, 7); ctx.fill();
      ctx.fillStyle = '#5a2a2a'; U.ellipse(ctx, -2, 0, 17, 21); ctx.fill();
      ctx.fillStyle = '#3a1a1a'; ctx.fillRect(-12, -18, 6, 36);
      ctx.fillStyle = '#7a3a3a'; U.rr(ctx, 4, -24, 14, 9, 4); ctx.fill(); U.rr(ctx, 4, 15, 14, 9, 4); ctx.fill();
      // mặt nạ đầu dê
      ctx.fillStyle = '#d8d0c0'; U.ellipse(ctx, 12, 0, 10, 9); ctx.fill();
      ctx.strokeStyle = '#2a2420'; ctx.lineWidth = 3; for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(8, sd * 6); ctx.quadraticCurveTo(-2, sd * 22, -10, sd * 14); ctx.stroke(); }
      ctx.fillStyle = e.state === 'wind' ? '#ff2a2a' : '#ff6a6a'; U.circle(ctx, 16, -4, 2); ctx.fill(); U.circle(ctx, 16, 4, 2); ctx.fill();
      ctx.restore();
    },
  });

  // trụ tín hiệu (boss gọi ra ở giai đoạn 2)
  Ens.register('signalPylon', {
    name: 'Trụ Tín Hiệu', r: 26, hp: 700, speed: 0, dmg: 0, score: 300, knockMul: 0, noContact: true, blood: '#2a0a10', gore: '#ff5a7a',
    init(e) { e.x0 = e.x; e.y0 = e.y; e.cd = U.rnd(1, 2.5); },
    update(e, G, dt) {
      e.x = e.x0; e.y = e.y0; e.vx = e.vy = 0; e.cd -= dt;
      if (e.cd <= 0) { e.cd = 2.6; for (let i = 0; i < 6; i++) G.enemyShot({ x: e.x, y: e.y, a: i / 6 * U.TAU + G.time, speed: 220, r: 7, dmg: 9, color: '#ff5a7a', owner: e, life: 2.2 }); }
    },
    draw(ctx, e, G) {
      const t = G.time;
      ctx.fillStyle = 'rgba(0,0,0,.3)'; U.ellipse(ctx, e.x + 8, e.y + 8, 26, 12); ctx.fill();
      ctx.fillStyle = '#2a2a32'; U.rr(ctx, e.x - 16, e.y - 16, 32, 32, 6); ctx.fill();
      ctx.strokeStyle = '#4a4a52'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(e.x, e.y - 60); ctx.stroke();
      ctx.fillStyle = `rgba(255,60,90,${0.6 + Math.sin(t * 8) * 0.4})`; U.circle(ctx, e.x, e.y - 62, 8); ctx.fill();
      ctx.strokeStyle = 'rgba(255,60,90,.5)'; ctx.lineWidth = 2; for (let i = 0; i < 3; i++) { const r = 12 + ((t * 1.5 + i / 3) % 1) * 40; ctx.globalAlpha = 1 - r / 52; U.circle(ctx, e.x, e.y - 62, r); ctx.stroke(); } ctx.globalAlpha = 1;
      // tia nối về boss
      const b = G.boss; if (b && !b.dead) { ctx.strokeStyle = `rgba(255,60,90,${0.3 + Math.sin(t * 12) * 0.2})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(e.x, e.y - 62); ctx.lineTo(b.x, b.y - 40); ctx.stroke(); }
    },
  });

  // phân thân giả (giai đoạn 3)
  Ens.register('goatDecoy', {
    name: 'Ảo Ảnh GoatEvil', r: 40, hp: 1, speed: 0, dmg: 0, score: 50, knockMul: 0, fly: true, noHover: true, noContact: true, blood: '#2a0a10', gore: '#ff5a7a',
    init(e) { e.cd = U.rnd(1, 2); e.life = 10; },
    update(e, G, dt) {
      e.vx = e.vy = 0; e.cd -= dt; e.life -= dt;
      if (e.life <= 0) { G.killEnemy(e); return; }
      if (e.cd <= 0) { e.cd = 2.2; const a = Ens.toPlayer(e, G); for (let i = -1; i <= 1; i++) G.enemyShot({ x: e.x, y: e.y, a: a + i * 0.2, speed: 380, r: 8, dmg: 10, color: '#ff5a7a', owner: e, life: 2 }); }
    },
    draw(ctx, e, G) { drawAvatar(ctx, e, G, 0.55); },
  });

  /* ---------- BOSS: GOATEVIL · HIỆN THÂN ---------- */
  function drawAvatar(ctx, e, G, alpha) {
    const t = G.time, x = e.x, y = e.y - 40 + Math.sin(t * 1.5) * 8;
    ctx.fillStyle = 'rgba(255,40,70,.12)'; U.ellipse(ctx, e.x, e.y + 20, 90, 30); ctx.fill();
    // cột tín hiệu chiếu từ đất lên
    const bg = ctx.createLinearGradient(0, e.y + 20, 0, y - 120); bg.addColorStop(0, `rgba(255,60,90,${0.25 * alpha})`); bg.addColorStop(1, 'rgba(255,60,90,0)');
    ctx.fillStyle = bg; ctx.beginPath(); ctx.moveTo(x - 30, e.y + 20); ctx.lineTo(x - 110, y - 120); ctx.lineTo(x + 110, y - 120); ctx.lineTo(x + 30, e.y + 20); ctx.fill();
    const fl = alpha * (0.85 + Math.sin(t * 30) * 0.1 + (Math.random() < 0.04 ? -0.4 : 0));
    const mouth = e.state === 'boltAim' || e.state === 'beam' ? Math.abs(Math.sin(t * 12)) : 0.1;
    ctx.globalCompositeOperation = 'lighter';
    MB.Story.goatHead(ctx, x - 3, y, 0.42, t, mouth, Math.max(0, fl * 0.45));
    MB.Story.goatHead(ctx, x + 3, y, 0.42, t, mouth, Math.max(0, fl * 0.45));
    ctx.globalCompositeOperation = 'source-over';
    MB.Story.goatHead(ctx, x, y, 0.42, t, mouth, Math.max(0, fl));
    // điểm ảnh vỡ quanh
    for (let i = 0; i < 10; i++) { ctx.fillStyle = GLITCH[i % 4]; ctx.globalAlpha = alpha * 0.7; const a = t * 2 + i * 0.63, r = 70 + Math.sin(t * 3 + i) * 20; ctx.fillRect(x + Math.cos(a) * r, y + Math.sin(a) * r * 0.8, 4, 4); }
    ctx.globalAlpha = 1;
  }
  const inArena = (x, y) => ({ x: U.clamp(x, ARENA.x - ARENA.r + 60, ARENA.x + ARENA.r - 60), y: U.clamp(y, ARENA.y - ARENA.r + 60, ARENA.y + ARENA.r - 60) });
  Ens.register('goatAvatar', {
    name: 'GoatEvil · Hiện Thân', r: 60, hp: 19500, speed: 0, dmg: 26, score: 0, boss: true, knockMul: 0, fly: true, noHover: true, noContact: true,
    blood: '#2a0a10', gore: '#ff5a7a',
    init(e) { e.phase = 1; e.state = 'drift'; e.boltT = 1.5; e.blinkT = 6; e.beamT = 8; e.decoyT = 4; e.rainT = 5; },
    armorFn(e, dmg, G) {
      if (e.state === 'gone') return 0;
      if (G.enemies.some((o) => !o.dead && o.type === 'signalPylon')) { if (!e.armTxt || G.time - e.armTxt > 1.2) { e.armTxt = G.time; G.text(e.x, e.y - 110, 'TRỤ TÍN HIỆU ĐANG BẢO VỆ', '#ff8aa0', 13); } return dmg * 0.1; }
      return dmg;
    },
    update(e, G, dt) {
      const p = G.player, k = e.hp / e.maxHp, ph = k > 0.66 ? 1 : k > 0.33 ? 2 : 3;
      if (ph > e.phase) {
        e.phase = ph; G.shake(14); MB.Audio.play('roar'); MB.Story.SND.glitch && MB.Story.SND.glitch();
        if (ph === 2) {
          G.banner('PHASE 2', 'GoatEvil dựng 3 trụ tín hiệu — phá trụ để xuyên giáp!', 2.2);
          for (let i = 0; i < 3; i++) { const a = -Math.PI / 2 + i / 3 * U.TAU; G.spawnEnemyAt('signalPylon', ARENA.x + Math.cos(a) * (ARENA.r - 70), ARENA.y + Math.sin(a) * (ARENA.r - 70), { extra: true }); }
        } else G.banner('PHASE 3', 'Phân thân ảo ảnh — chỉ một là thật!', 2.2);
      }
      e.boltT -= dt; e.blinkT -= dt; e.beamT -= dt; e.rainT -= dt;
      // mưa điểm ảnh quanh Hunter
      if (e.rainT <= 0) { e.rainT = ph === 3 ? 4.5 : 7; pixelRain(G, ph === 3 ? 6 : 4); }
      if (ph === 3) { e.decoyT -= dt; if (e.decoyT <= 0 && e.state === 'drift') { e.decoyT = 12; for (let i = 0; i < 2; i++) { const q = inArena(p.x + U.rnd(-300, 300), p.y + U.rnd(-300, 300)); G.spawnEnemyAt('goatDecoy', q.x, q.y, { extra: true }); } const q = inArena(p.x + U.rnd(-300, 300), p.y + U.rnd(-300, 300)); e.x = q.x; e.y = q.y; G.burst(e.x, e.y, '#ff5a7a', 30, 240); } }
      if (e.state === 'drift') {
        const a = Math.atan2(e.y - p.y, e.x - p.x) + dt * 0.4, q = inArena(p.x + Math.cos(a) * 320, p.y + Math.sin(a) * 320);
        e.vx += ((q.x - e.x) * 1.2 - e.vx) * Math.min(1, dt * 2); e.vy += ((q.y - e.y) * 1.2 - e.vy) * Math.min(1, dt * 2);
        e.face = Ens.toPlayer(e, G);
        if (ph >= 2 && e.beamT <= 0) { e.state = 'beamAim'; e.st = 0.9; e.beamA = Ens.toPlayer(e, G); e.dir = Math.random() < 0.5 ? -1 : 1; MB.Audio.play('boss'); }
        else if (e.blinkT <= 0) { e.state = 'gone'; e.st = 0.5; e.alpha = 0; G.burst(e.x, e.y, '#ff5a7a', 26, 220); MB.Audio.play('dash'); }
        else if (e.boltT <= 0) { e.state = 'boltAim'; e.st = 0.5; e.volley = ph === 1 ? 3 : 4; e.lock = Ens.toPlayer(e, G); }
      } else if (e.state === 'boltAim') {
        Ens.stop(e, dt, 8); e.st -= dt; e.lock += U.angDiff(e.lock, Ens.toPlayer(e, G)) * Math.min(1, dt * 4);
        if (e.st <= 0) {
          for (let i = -2; i <= 2; i++) G.enemyShot({ x: e.x, y: e.y - 40, a: e.lock + i * 0.11, speed: 440, r: 8, dmg: 11, color: GLITCH[(i + 2) % 3], owner: e, life: 2 });
          MB.Audio.play('shot_plasma'); e.volley--;
          if (e.volley > 0) e.st = 0.28; else { e.state = 'drift'; e.boltT = ph === 1 ? 2.4 : 1.8; }
        }
      } else if (e.state === 'gone') {
        Ens.stop(e, dt, 20); e.st -= dt;
        if (e.st <= 0) {
          const a = U.rnd(0, U.TAU), q = inArena(p.x + Math.cos(a) * 260, p.y + Math.sin(a) * 260);
          e.x = q.x; e.y = q.y; e.state = 'appear'; e.st = 0.6;
          G.telegraphCircle(q.x, q.y, 150, 0.6, null, 'rgba(255,60,90,.16)');
        }
      } else if (e.state === 'appear') {
        Ens.stop(e, dt, 20); e.st -= dt;
        if (e.st <= 0) { e.state = 'drift'; e.alpha = 1; e.blinkT = ph === 1 ? 7 : 5.5; G.explosion(e.x, e.y, 150, 0, { player: 24, knock: 300, color: '#ff5a7a', ring: '255,90,120', obstacles: false, enemies: false }); }
      } else if (e.state === 'beamAim') {
        Ens.stop(e, dt, 10); e.st -= dt;
        if (e.st <= 0) { e.state = 'beam'; e.st = 2.8; e.fireT = 0; }
      } else if (e.state === 'beam') {
        // tia kép quét vòng
        Ens.stop(e, dt, 10); e.st -= dt; e.beamA += e.dir * dt * 1.1; e.fireT -= dt;
        if (e.fireT <= 0) { e.fireT = 0.05; for (const o of [0, Math.PI]) G.enemyShot({ x: e.x + Math.cos(e.beamA + o) * 50, y: e.y - 40 + Math.sin(e.beamA + o) * 50, a: e.beamA + o, speed: 640, r: 10, dmg: 9, color: '#ff3a5a', owner: e, life: 1.1 }); }
        if (e.st <= 0) { e.state = 'drift'; e.beamT = ph === 2 ? 9 : 7; }
      }
    },
    tele(ctx, e, G) {
      if (e.state === 'boltAim') G.drawTelegraphLine(ctx, e.x, e.y - 40, e.lock, 460, 1 - e.st / 0.5);
      if (e.state === 'beamAim') { const k = 1 - e.st / 0.9; ctx.strokeStyle = `rgba(255,60,90,${0.3 + k * 0.6})`; ctx.lineWidth = 3; ctx.setLineDash([12, 10]); for (const o of [0, Math.PI]) { ctx.beginPath(); ctx.moveTo(e.x, e.y - 40); ctx.lineTo(e.x + Math.cos(e.beamA + o) * 700, e.y - 40 + Math.sin(e.beamA + o) * 700); ctx.stroke(); } ctx.setLineDash([]); }
    },
    draw(ctx, e, G) { if (e.state === 'gone') return; drawAvatar(ctx, e, G, e.state === 'appear' ? 1 - e.st / 0.6 : 1); },
  });
  function pixelRain(G, n) {
    const p = G.player;
    for (let i = 0; i < n; i++) {
      const x = i === 0 ? p.x + p.vx * 0.5 : p.x + U.rnd(-260, 260), y = i === 0 ? p.y + p.vy * 0.5 : p.y + U.rnd(-220, 220);
      G.telegraphCircle(x, y, 70, 1.1, (GG) => {
        GG.explosion(x, y, 70, 30, { player: 18, knock: 200, color: '#ff5a7a', ring: '255,90,120', small: true, obstacles: false });
        for (let j = 0; j < 10; j++) GG.particle({ x: x + U.rnd(-30, 30), y: y + U.rnd(-30, 30), vx: U.rnd(-60, 60), vy: U.rnd(-160, -40), life: 0.6, color: GLITCH[j % 4], r: 3 });
      }, 'rgba(255,60,90,.14)');
    }
    MB.Audio.play('shot_plasma');
  }

  /* ---------- bản đồ ---------- */
  const rng = U.seeded(2020);
  const obstacles = [], hazards = [];
  for (const c of CH) {
    if (c.h) {
      let x = c.x0;
      for (const gx of [...c.gaps, c.x1 + BR / 2]) { const x2 = Math.min(c.x1, gx - BR / 2); if (x2 - x > 10) obstacles.push({ kind: 'tsWater', shape: 'box', x: (x + x2) / 2, y: (c.y0 + c.y1) / 2, w: x2 - x, h: c.y1 - c.y0, rot: 0, noShot: true, water: true }); x = gx + BR / 2; }
    } else {
      let y = c.y0;
      for (const gy of [...c.gaps, c.y1 + BR / 2]) { const y2 = Math.min(c.y1, gy - BR / 2); if (y2 - y > 10) obstacles.push({ kind: 'tsWater', shape: 'box', x: (c.x0 + c.x1) / 2, y: (y + y2) / 2, w: c.x1 - c.x0, h: y2 - y, rot: 0, noShot: true, water: true }); y = gy + BR / 2; }
    }
  }
  const nearChannel = (x, y, pad) => CH.some((c) => x > c.x0 - pad && x < c.x1 + pad && y > c.y0 - pad && y < c.y1 + pad);
  const nearGap = (x, y) => CH.some((c) => c.gaps.some((g) => (c.h ? Math.abs(x - g) < 130 && Math.abs(y - (c.y0 + c.y1) / 2) < 180 : Math.abs(y - g) < 130 && Math.abs(x - (c.x0 + c.x1) / 2) < 180)));
  // bèo phủ (nước nông, đi chậm)
  for (let i = 0; i < 22; i++) {
    const x = 120 + rng() * (FOREST.x1 - 240), y = 150 + rng() * (WH - 300);
    if (nearChannel(x, y, 110) || nearGap(x, y) || Math.hypot(x - 250, y - 1500) < 260) continue;
    hazards.push({ kind: 'duckweed', x, y, r: 70 + rng() * 50, slowMul: 0.7, dps: 0 });
  }
  // rừng tràm dày
  const busy = (x, y, r) => obstacles.some((o) => (o.kind === 'cajuput' || o.kind === 'thotnot' || o.kind === 'rock' || o.kind === 'cableStation') && Math.hypot(o.x - x, o.y - y) < r + (o.r || o.hw || 30) + 26);
  for (let i = 0; i < 420; i++) {
    const x = 60 + rng() * (FOREST.x1 - 100), y = 60 + rng() * (WH - 120), r = 11 + rng() * 4;
    if (nearChannel(x, y, 40) || nearGap(x, y) || Math.hypot(x - 250, y - 1500) < 220 || busy(x, y, r + 20)) continue;
    obstacles.push({ kind: 'cajuput', shape: 'circle', x, y, r, tall: 150 + rng() * 40 });
  }
  // đồng thốt nốt (giữa bản đồ): hàng thốt nốt dọc bờ ruộng
  for (let x = 2150; x < 2750; x += 150) for (let y = 200; y < WH - 150; y += 260) { const xx = x + rng() * 40 - 20, yy = y + rng() * 40 - 20; if (rng() < 0.25 || nearGap(xx, yy) || busy(xx, yy, 20)) continue; obstacles.push({ kind: 'thotnot', shape: 'circle', x: xx, y: yy, r: 15, tall: 190 + rng() * 40 }); }
  // ga cáp treo
  obstacles.push({ kind: 'cableStation', shape: 'box', x: CABLE.x0, y: CABLE.y0, w: 200, h: 120, rot: 0, tall: 60 });
  obstacles.push({ kind: 'cableStation', shape: 'box', x: CABLE.x1, y: CABLE.y1, w: 200, h: 120, rot: 0, tall: 60 });
  // đá tảng chân núi Cấm (chừa đấu trường)
  for (let i = 0; i < 70; i++) {
    const x = 2850 + rng() * (WW - 2900), y = 80 + rng() * (WH - 160), r = 26 + rng() * 30;
    if (Math.hypot(x - ARENA.x, y - ARENA.y) < ARENA.r + r + 40 || busy(x, y, r + 30)) continue;
    // chừa đường lên dọc tuyến cáp
    const k = U.clamp(((x - CABLE.x0) * (CABLE.x1 - CABLE.x0) + (y - CABLE.y0) * (CABLE.y1 - CABLE.y0)) / ((CABLE.x1 - CABLE.x0) ** 2 + (CABLE.y1 - CABLE.y0) ** 2), 0, 1);
    if (Math.hypot(x - (CABLE.x0 + k * (CABLE.x1 - CABLE.x0)), y - (CABLE.y0 + k * (CABLE.y1 - CABLE.y0))) < 120) continue;
    obstacles.push({ kind: 'rock', shape: 'circle', x, y, r, c1: ['#6a6458', '#7a7466', '#5a564c'][(rng() * 3) | 0] });
  }
  const CLUE = { x: CABLE.x0, y: CABLE.y0 - 110 };

  MB.registerGate({
    id: 20, seed: 2020, view3d: true, act: 2,
    title: 'GATE 20 — THẤT SƠN', subtitle: 'Bảy núi · An Giang',
    world: { w: WW, h: WH }, bg: '#2a4a2a', mmColor: 'rgba(110,160,100,.7)',
    scale: { hp: 3.15, dmg: 1.85 },
    start: { x: 250, y: 1500 },
    obstacles, hazards,
    crates: [{ x: 700, y: 600 }, { x: 1300, y: 1450 }, { x: 600, y: 2500 }, { x: 2400, y: 1000 }, { x: 2400, y: 2400 }, { x: 3300, y: 2200 }],
    spawnPoints: [
      { x: 900, y: 200 }, { x: 1500, y: 600 }, { x: 300, y: 2800 }, { x: 1500, y: 2700 }, { x: 1200, y: 1500 }, { x: 2300, y: 300 },
      { x: 2400, y: 1500 }, { x: 2400, y: 2800 }, { x: 3200, y: 300 }, { x: 3900, y: 1500 }, { x: 3800, y: 2700 }, { x: 3100, y: 2000 },
    ],
    waves: [
      { total: 38, maxAlive: 17, mix: { zombie: 2, runner: 4, cajuputWraith: 3, goatBrute: 2, mtGoat: 2, goatDrone: 1 }, interval: [0.36, 0.72], elite: 0.22 },
      { total: 42, maxAlive: 18, mix: { cajuputWraith: 4, goatBrute: 3, mtGoat: 3, runner: 3, licker: 2 }, interval: [0.34, 0.7], elite: 0.26 },
      { total: 48, maxAlive: 20, mix: { cajuputWraith: 4, goatBrute: 4, mtGoat: 3, goatDrone: 3, riot: 2, licker: 2 }, interval: [0.32, 0.66], elite: 0.3 },
    ],
    boss: { type: 'goatAvatar', x: ARENA.x, y: ARENA.y - 120, fixed: true },
    ally: { enter: 'start' },
    intro: { title: 'MÀN 2 · NHIỆM VỤ', text: 'Thất Sơn, An Giang. Cùng Dian xuyên rừng tràm Trà Sư, băng đồng thốt nốt, lên chân núi Cấm — nơi tín hiệu GoatEvil mạnh nhất. Coi chừng mưa điểm ảnh.' },
    objectives: [
      { title: 'RỪNG TRÀM TRÀ SƯ', text: 'Kênh sâu chỉ qua được bằng cầu ván. Bèo phủ làm chậm. Hồn Rừng Tràm bắn cầu độc chậm — né ngang.' },
      { title: 'ĐỒNG THỐT NỐT', text: 'Lính Đầu Dê lấy đà húc rồi dậm sóng — tránh vạch đỏ và lùi ra khi nó tiếp đất.' },
      { title: 'CHÂN NÚI CẤM', text: 'Wave cuối. Theo tuyến cáp treo lên cao nguyên đá.' },
      { title: 'BOSS · GOATEVIL HIỆN THÂN', text: 'Nó dịch chuyển (vòng đỏ là chỗ nó hiện ra), bắn tia nhiễu, quét tia kép. Giai đoạn 2: phá 3 trụ tín hiệu trước. Giai đoạn 3: phân thân giả — con thật có thanh máu boss.' },
    ],
    challenges: [
      { id: 'relays', type: 'destroy', name: 'Bộ Khuếch Đại Đầu Dê', desc: 'Phá 4 bộ khuếch đại tín hiệu trong rừng', kind: 'goatCrate', r: 22, hp: 420,
        spawner: { type: 'cajuputWraith', every: 7, range: 700, cap: 5 },
        targets: [{ x: 500, y: 400 }, { x: 1400, y: 1250 }, { x: 800, y: 2600 }, { x: 2450, y: 1700 }], reward: { mod: 'pierce' } },
      { id: 'station', type: 'hold', name: 'Ga Cáp Treo', desc: 'Giữ ga cáp treo chân núi 16 giây', zone: { x: CABLE.x0 - 180, y: CABLE.y0, r: 85 }, time: 16,
        mix: { goatBrute: 1, mtGoat: 1, cajuputWraith: 1 }, spawnEvery: 1.5, reward: { mod: 'split' } },
      { id: 'streak', type: 'streak', name: 'Bảy Núi', desc: '28 hạ gục liên tiếp không trúng đòn', count: 28, reward: { mod: 'trigger' } },
    ],
    clue: { x: CLUE.x, y: CLUE.y, title: 'Ghi chép số 10 — Thất Sơn', text: [
      'Ngày 66. Tôi không chết ở Căn cứ Alpha. Cái xác hôm đó là một bản V-0 mang khuôn mặt tôi.',
      'Hội đồng cần Hunter tin rằng tôi đã chết — để cậu ấy đi đúng con đường tôi vẽ sẵn. Mười mảnh giấy. Mười cửa. Mỗi cửa là một bài kiểm tra.',
      'Hunter, cậu là thí nghiệm thành công nhất của tôi. Hẹn gặp ở nơi tất cả bắt đầu.',
    ] },
    comms: [
      { on: 'start', t: 2.5, lines: [['DIAN', 'Tôi nợ cậu một lời xin lỗi — và một khẩu súng bắn tỉa yểm trợ.'], ['HUNTER', 'Bắn trúng thì tôi tính là trả nợ.']] },
      { on: 'start', t: 12, lines: [['CÔ HẠNH', 'Tín hiệu đầu dê mạnh nhất ở chân núi Cấm. Rừng tràm này… nó đang nghe các cậu.']] },
      { on: 'start', t: 22, lines: [['GOATEVIL', 'Bảy ngọn núi. Bảy lớp tín hiệu. Hunter, ngươi sắp được thấy ta bằng xương bằng thịt — hoặc thứ gần giống thế.']] },
      { on: 'wave', wave: 2, lines: [['DIAN', 'Mưa điểm ảnh! Vòng đỏ dưới chân là phải chạy.']] },
      { on: 'wave', wave: 3, lines: [['CÔ HẠNH', 'Đi theo tuyến cáp treo. Ga dưới chân núi — giáo sư từng giấu đồ ở đó.']] },
      { on: 'low', lines: [['DIAN', 'Tôi yểm trợ, lùi lại!']] },
      { on: 'boss', lines: [['GOATEVIL', 'Ta không có xác thịt, Hunter. Ta là tín hiệu. Ngươi bắn vào ánh sáng sao?'], ['HUNTER', 'Ánh sáng thì cũng tắt được.']] },
      { on: 'phase', phase: 2, lines: [['CÔ HẠNH', 'Ba trụ tín hiệu đang nuôi nó! Phá trụ trước!']] },
      { on: 'phase', phase: 3, lines: [['GOATEVIL', 'Ted đang đợi ngươi — ở nơi tất cả bắt đầu.'], ['DIAN', '…Căn cứ Alpha.']] },
      { on: 'won', lines: [['HUNTER', 'Ted còn sống. Và ông ta đang đợi.'], ['DIAN', 'Lần này tôi đi cùng cậu đến cuối, Hunter. Dù ông ấy là thầy tôi.']] },
    ],
    light3d: { hemiSky: 0xffe8d0, hemiGround: 0x3a5a2a, hemi: 1.4, sun: 0xffd8a8, sunI: 1.5, exposure: 1.25 },

    setup(G) {
      G.__over = null;
      G.gs.rainT = 18;
      G.gs.cabs = [0, 0.5].map((k, i) => ({ kind: 'cableCab', k, dir: i ? -1 : 1, x: 0, y: 0, h: 0 }));
      for (const c of G.gs.cabs) G.actors.push(c);
      G.actors.push({ kind: 'cableLine', x: (CABLE.x0 + CABLE.x1) / 2, y: (CABLE.y0 + CABLE.y1) / 2, h: 0 });
    },
    update(G, dt) {
      const s = G.gs;
      for (const c of s.cabs) { c.k += c.dir * dt * 0.035; if (c.k > 1) { c.k = 1; c.dir = -1; } if (c.k < 0) { c.k = 0; c.dir = 1; } c.x = CABLE.x0 + (CABLE.x1 - CABLE.x0) * c.k; c.y = CABLE.y0 + (CABLE.y1 - CABLE.y0) * c.k; }
      if (G.state === 'fight') { s.rainT -= dt; if (s.rainT <= 0) { s.rainT = U.rnd(14, 18); MB.HUD.toast('<b>NHIỄU TÍN HIỆU!</b> Mưa điểm ảnh', '#ff5a7a'); pixelRain(G, 4); } }
    },
    drawUnder(G, ctx) {
      const t = G.time;
      ctx.strokeStyle = 'rgba(230,240,220,.22)'; ctx.lineWidth = 2;
      for (const c of CH) for (let i = 0; i < 14; i++) { const x = c.h ? c.x0 + ((i * 137 + t * 20) % (c.x1 - c.x0)) : (c.x0 + c.x1) / 2 + (i % 2 ? 15 : -15), y = c.h ? (c.y0 + c.y1) / 2 + (i % 2 ? 15 : -15) : c.y0 + ((i * 211 + t * 20) % (c.y1 - c.y0)); ctx.beginPath(); ctx.moveTo(x - 10, y); ctx.quadraticCurveTo(x, y - 3, x + 10, y); ctx.stroke(); }
    },
    drawOver(G, ctx) {
      VN.drawOver(G, ctx);
      // dây cáp treo (trên cao) + cabin
      const H = 150 * H3;
      ctx.strokeStyle = 'rgba(40,40,40,.8)'; ctx.lineWidth = 2;
      for (const off of [-8, 8]) { ctx.beginPath(); ctx.moveTo(CABLE.x0 + off, CABLE.y0 - H); ctx.lineTo(CABLE.x1 + off, CABLE.y1 - H); ctx.stroke(); }
      for (const c of G.gs.cabs) {
        const x = c.x, y = c.y - H;
        ctx.fillStyle = 'rgba(0,0,0,.2)'; U.rr(ctx, c.x - 14, c.y - 8, 28, 18, 5); ctx.fill();
        ctx.strokeStyle = '#2a2a2a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 14); ctx.stroke();
        ctx.fillStyle = '#c8302a'; U.rr(ctx, x - 16, y + 14, 32, 24, 6); ctx.fill();
        ctx.fillStyle = '#9ad0f0'; ctx.fillRect(x - 12, y + 18, 24, 9);
      }
    },
    drawScreen(G, ctx) {
      const gr = ctx.createLinearGradient(0, 0, G.W, G.H); gr.addColorStop(0, 'rgba(255,200,140,.12)'); gr.addColorStop(1, 'rgba(120,60,90,.1)');
      ctx.fillStyle = gr; ctx.fillRect(0, 0, G.W, G.H);
      // nhiễu sóng khi boss hiện hình
      const b = G.boss; if (b && !b.dead && Math.random() < 0.06) { ctx.fillStyle = 'rgba(255,40,80,.08)'; ctx.fillRect(0, Math.random() * G.H, G.W, 6 + Math.random() * 20); }
    },

    buildGround(g, w, h, rand) {
      // rừng tràm: đất ngập ẩm
      g.fillStyle = '#3a5a3a'; g.fillRect(0, 0, FOREST.x1, h);
      GK.patches(g, rand, FOREST.x1, h, 200, ['rgba(60,90,60,.4)', 'rgba(30,50,30,.35)', 'rgba(90,120,60,.25)'], 40, 160);
      // đồng thốt nốt: ruộng
      for (let x = FOREST.x1 + 90; x < 2800; x += 180) for (let y = 0; y < h; y += 130) { g.fillStyle = (((x / 180) | 0) + ((y / 130) | 0)) % 2 ? '#8aa848' : '#a8b85a'; g.fillRect(x + 4, y + 4, 172, 122); }
      // chân núi Cấm: đất đá đỏ nâu
      const mg = g.createLinearGradient(2800, h, w, 0); mg.addColorStop(0, '#7a6a4a'); mg.addColorStop(1, '#5a5444');
      g.fillStyle = mg; g.fillRect(2800, 0, w - 2800, h);
      GK.patches(g, rand, w, h, 120, ['rgba(110,90,60,.3)', 'rgba(60,55,45,.3)'], 40, 140);
      // kênh: nước xanh rêu
      for (const c of CH) { g.fillStyle = '#2a4a3a'; g.fillRect(c.x0, c.y0, c.x1 - c.x0, c.y1 - c.y0); g.fillStyle = 'rgba(90,140,60,.35)'; g.fillRect(c.x0, c.y0, c.x1 - c.x0, 8); g.fillRect(c.x0, c.y1 - 8, c.x1 - c.x0, 8); }
      // cầu ván gỗ
      for (const c of CH) for (const gp of c.gaps) {
        g.fillStyle = 'rgba(0,0,0,.25)';
        if (c.h) { g.fillRect(gp - 34, c.y0 - 16, 76, c.y1 - c.y0 + 40); g.fillStyle = '#8a6a44'; g.fillRect(gp - 40, c.y0 - 20, 80, c.y1 - c.y0 + 40); g.fillStyle = '#6a4a2a'; for (let y = c.y0 - 20; y < c.y1 + 20; y += 10) g.fillRect(gp - 40, y, 80, 2); }
        else { g.fillRect(c.x0 - 16, gp - 34, c.x1 - c.x0 + 40, 76); g.fillStyle = '#8a6a44'; g.fillRect(c.x0 - 20, gp - 40, c.x1 - c.x0 + 40, 80); g.fillStyle = '#6a4a2a'; for (let x = c.x0 - 20; x < c.x1 + 20; x += 10) g.fillRect(x, gp - 40, 2, 80); }
      }
      // lối ván xuyên rừng
      g.strokeStyle = '#8a6a44'; g.lineWidth = 34; g.lineCap = 'round';
      g.beginPath(); g.moveTo(250, 1500); g.lineTo(600, 1300); g.lineTo(600, 1000); g.moveTo(600, 880); g.lineTo(1500, 600); g.lineTo(FOREST.x1 - 40, 500); g.moveTo(250, 1500); g.lineTo(1250, 1700); g.lineTo(1250, 1990); g.moveTo(1250, 2100); g.lineTo(FOREST.x1 - 40, 2500); g.moveTo(1250, 1700); g.lineTo(FOREST.x1 - 40, 1500); g.stroke();
      g.strokeStyle = 'rgba(60,40,20,.5)'; g.lineWidth = 2; g.stroke();
      // đường đất lên núi theo tuyến cáp
      g.strokeStyle = 'rgba(170,140,100,.55)'; g.lineWidth = 60; g.beginPath(); g.moveTo(FOREST.x1 + 90, 1500); g.lineTo(2800, 1600); g.lineTo(CABLE.x0 - 150, CABLE.y0); g.lineTo(ARENA.x, ARENA.y + ARENA.r); g.stroke();
      // cao nguyên đá: đấu trường
      g.fillStyle = '#8a8070'; g.beginPath(); g.arc(ARENA.x, ARENA.y, ARENA.r, 0, U.TAU); g.fill();
      g.strokeStyle = 'rgba(255,60,90,.35)'; g.lineWidth = 4; g.beginPath(); g.arc(ARENA.x, ARENA.y, ARENA.r * 0.6, 0, U.TAU); g.stroke();
      g.strokeStyle = 'rgba(255,60,90,.2)'; g.lineWidth = 2; for (let i = 0; i < 6; i++) { const a = i / 6 * U.TAU; g.beginPath(); g.moveTo(ARENA.x, ARENA.y); g.lineTo(ARENA.x + Math.cos(a) * ARENA.r * 0.6, ARENA.y + Math.sin(a) * ARENA.r * 0.6); g.stroke(); }
      GK.vignette(g, w, h, 0.35);
    },

    /* ---------- 3D ---------- */
    models3d: {
      cajuputWraith: (K) => ({
        base: 16,
        build() {
          const T = K.T, g = new T.Group(), body = new T.Group(); body.position.y = 40; g.add(body);
          const m = K.std(0xaae6aa, { own: true, transparent: true, opacity: 0.7, emissive: 0x3a8a4a, ei: 0.8 });
          const c = new T.Mesh(K.G3('wraith', () => new T.ConeGeometry(1, 1, 8, 1, true)), m); c.scale.set(14, 30, 14); c.rotation.x = Math.PI; body.add(c);
          body.add(K.mesh(K.sph(9, 8), m, 0, 12, 0));
          for (const z of [-3, 3]) body.add(K.mesh(K.sph(1.8, 6), K.glowMat(0xff3a3a, 3), 7, 13, z, false));
          const sp = K.glowSprite(0x9aff9a, 60, 0.4); body.add(sp);
          g.userData = { body, h: 56 }; return g;
        },
        anim(e, m, G) { m.userData.body.position.y = 40 + Math.sin(G.time * 3 + e.t) * 5; m.userData.body.rotation.y = Math.sin(G.time * 2 + e.t) * 0.3; },
      }),
      goatBrute: (K) => ({
        base: 22,
        build() {
          const T = K.T, g = new T.Group(), cloth = K.std(0x5a2a2a, { rough: 0.8 }), dark = K.std(0x2a2a30);
          const legs = [];
          for (const z of [-9, 9]) { const l = K.mesh(K.cyl(5, 6, 22, 6), dark, 0, 11, z); g.add(l); legs.push(l); }
          g.add(K.mesh(K.box(22, 30, 30), cloth, 0, 36, 0));
          for (const z of [-19, 19]) g.add(K.mesh(K.box(10, 22, 8), K.std(0x7a3a3a), 4, 34, z));
          const head = new T.Group(); head.position.set(6, 58, 0); g.add(head);
          head.add(K.mesh(K.box(16, 18, 16), K.std(0xd8d0c0, { flat: true }), 0, 0, 0));
          for (const z of [-1, 1]) { const h = K.mesh(K.G3('bhorn', () => new T.TorusGeometry(8, 2, 6, 10, Math.PI * 1.2)), K.std(0x2a2420), -4, 8, z * 8); h.rotation.y = Math.PI / 2; g.add(h); head.add(h); }
          for (const z of [-4, 4]) head.add(K.mesh(K.sph(1.8, 6), K.glowMat(0xff3a3a, 3), 8, 2, z, false));
          g.userData = { legs, h: 70 }; return g;
        },
        anim(e, m, G) { const mv = Math.hypot(e.vx, e.vy) > 20; m.userData.legs.forEach((l, i) => { l.rotation.z = mv ? Math.sin(G.time * 10 + i * 3) * 0.4 : 0; }); },
      }),
      signalPylon: (K) => ({
        base: 26,
        build() {
          const T = K.T, g = new T.Group();
          g.add(K.mesh(K.box(32, 14, 32), K.std(0x2a2a32, { metal: 0.5 }), 0, 7, 0), K.mesh(K.cyl(3, 5, 120, 6), K.std(0x4a4a52, { metal: 0.6 }), 0, 70, 0));
          const orb = K.mesh(K.sph(10, 12), K.glowMat(0xff3a5a, 2.6), 0, 136, 0, false); g.add(orb);
          const sp = K.glowSprite(0xff3a5a, 110, 0.6); sp.position.y = 136; g.add(sp);
          g.userData = { orb, h: 150 }; return g;
        },
        anim(e, m, G) { m.userData.orb.scale.setScalar(1 + Math.sin(G.time * 8) * 0.2); },
      }),
      goatDecoy: (K) => avatarModel(K, 0.45),
      goatAvatar: (K) => avatarModel(K, 1),
    },
    props3d: {
      tsWater: (o, K) => new K.T.Group(),
      cajuput: (o, K) => {
        const T = K.T, g = new T.Group();
        const tr = K.mesh(K.cyl(o.r * 0.3, o.r * 0.42, o.tall * 0.75, 6), K.std(0xe0d8c8, { rough: 0.9 }), 0, o.tall * 0.37, 0); g.add(tr);
        const leaf = K.std(0x4a7a3a, { own: true, transparent: true, flat: true, rough: 0.9 });
        const c = K.mesh(K.G3('cajc', () => new T.IcosahedronGeometry(1, 0)), leaf, 0, o.tall * 0.8, 0); c.scale.set(o.r * 2.2, o.r * 2.6, o.r * 2.2); g.add(c);
        const c2 = K.mesh(K.G3('cajc', () => new T.IcosahedronGeometry(1, 0)), leaf, o.r * 0.6, o.tall * 0.66, 0); c2.scale.setScalar(o.r * 1.5); g.add(c2);
        g.userData.canopy = [leaf]; return g;
      },
      thotnot: (o, K) => {
        const T = K.T, g = new T.Group();
        g.add(K.mesh(K.cyl(o.r * 0.42, o.r * 0.55, o.tall, 7), K.std(0x5a4a3a, { rough: 1 }), 0, o.tall / 2, 0));
        const leaf = K.std(0x3f8a3a, { own: true, transparent: true, flat: true, rough: 0.8 });
        const crown = new T.Group(); crown.position.y = o.tall; g.add(crown);
        for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, f = K.mesh(K.box(o.r * 2.6, 1, o.r * 1.2), leaf, Math.cos(a) * o.r * 1.4, Math.sin(i * 1.7) * 6, Math.sin(a) * o.r * 1.4); f.rotation.y = -a; f.rotation.z = 0.25; crown.add(f); }
        crown.add(K.mesh(K.sph(6, 6), K.std(0x6a5a2a), 0, -4, 0));
        g.userData.canopy = [leaf]; return g;
      },
      cableStation: (o, K) => {
        const T = K.T, g = new T.Group(), roof = K.std(0xc8302a, { own: true, transparent: true });
        g.add(K.mesh(K.box(o.w, 50, o.h), K.std(0xe8e4dc, { rough: 0.7 }), 0, 25, 0), K.mesh(K.box(o.w - 20, 22, 2), K.std(0x5a8ab0, { metal: 0.4, rough: 0.2 }), 0, 28, o.hh + 1));
        const r = new T.Mesh(K.G3('csroof', () => new T.CylinderGeometry(0.6, 1, 1, 4)), roof); r.scale.set(o.w * 0.75, 30, o.h * 0.75); r.rotation.y = Math.PI / 4; r.position.y = 65; g.add(r);
        g.add(K.mesh(K.cyl(4, 6, 150, 6), K.std(0x6a6a6a, { metal: 0.6 }), 0, 75, 0));
        g.userData.canopy = [roof]; return g;
      },
    },
    hazards3d: { duckweed: { inner: 'rgba(130,190,60,.85)', outer: 'rgba(110,170,50,.4)', opacity: 0.75 } },
    actors3d: Object.assign({
      cableCab: (a, K) => {
        const T = K.T, g = new T.Group();
        g.add(K.mesh(K.box(36, 26, 26), K.std(0xc8302a), 0, 0, 0), K.mesh(K.box(32, 10, 27), K.std(0x9ad0f0, { metal: 0.3, rough: 0.1 }), 0, 4, 0), K.mesh(K.cyl(1, 1, 22, 4), K.std(0x2a2a2a), 0, 24, 0));
        g.userData.anim = (aa, m) => { m.position.set(aa.x, 150, aa.y); };
        return g;
      },
      cableLine: (a, K) => {
        const T = K.T, g = new T.Group(), L = Math.hypot(CABLE.x1 - CABLE.x0, CABLE.y1 - CABLE.y0);
        for (const off of [-6, 6]) { const c = K.mesh(K.cyl(0.8, 0.8, L, 4), K.std(0x222222), 0, 0, 0, false); c.rotation.z = Math.PI / 2; c.position.z = off; g.add(c); }
        g.rotation.y = -Math.atan2(CABLE.y1 - CABLE.y0, CABLE.x1 - CABLE.x0);
        g.userData.anim = (aa, m) => { m.position.set((CABLE.x0 + CABLE.x1) / 2, 176, (CABLE.y0 + CABLE.y1) / 2); };
        return g;
      },
    }, MB.Story.actors3d),
  });
  MB.Props.registerActor('cableCab', () => {});
  MB.Props.registerActor('cableLine', () => {});
  // mô hình 3D đầu dê ảo ảnh (dùng chung boss + phân thân)
  function avatarModel(K, op) {
    return {
      base: 60,
      build() {
        const T = K.T, g = new T.Group(), head = new T.Group(); head.position.y = 110; g.add(head);
        const m = K.glowMat(0xff3a5a, 1.6 * op);
        const wire = new T.MeshBasicMaterial({ color: 0xff5a7a, wireframe: true, transparent: true, opacity: 0.8 * op });
        const skull = new T.Mesh(K.G3('gaskull', () => new T.ConeGeometry(1, 1, 6, 3)), wire); skull.scale.set(34, 90, 28); skull.rotation.x = Math.PI; head.add(skull);
        for (const sd of [-1, 1]) {
          const horn = new T.Mesh(K.G3('gahorn', () => new T.TorusGeometry(1, 0.12, 6, 14, Math.PI * 1.4)), wire); horn.scale.setScalar(36); horn.position.set(0, 30, sd * 40); horn.rotation.set(0, sd * 0.4, sd > 0 ? Math.PI * 0.1 : Math.PI * 0.9); head.add(horn);
          head.add(K.mesh(K.sph(6, 8), m, 18, 6, sd * 14, false));
        }
        const sp = K.glowSprite(0xff3a5a, 220, 0.4 * op); sp.position.y = 100; g.add(sp);
        const beam = new T.Mesh(K.G3('gabeam', () => new T.CylinderGeometry(1, 0.3, 1, 12, 1, true)), new T.MeshBasicMaterial({ color: 0xff3a5a, transparent: true, opacity: 0.15 * op, side: 2, depthWrite: false })); beam.scale.set(70, 110, 70); beam.position.y = 55; g.add(beam);
        g.userData = { head, h: 170 }; return g;
      },
      anim(e, m, G) { const d = m.userData; d.head.position.y = 110 + Math.sin(G.time * 1.5) * 8; d.head.rotation.y = Math.sin(G.time * 0.7) * 0.2; m.visible = e.state !== 'gone' && (Math.random() > 0.03); },
    };
  }
})(window.MB);
