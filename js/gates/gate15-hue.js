/* Gate 15 — HUẾ: Kinh thành trong đêm mưa (Màn 2 · Nguồn Gốc)
   Thắng cảnh: sông Hương với thuyền rồng và cầu Trường Tiền (vòm thép), tháp Phước Duyên chùa Thiên Mụ bên bờ Bắc,
   Kỳ Đài (cột cờ) trước kinh thành, hào thành phủ sen, tường thành gạch rêu, Ngọ Môn với lầu Ngũ Phụng mái vàng,
   hồ Thái Dịch và cầu Trung Đạo, sân Đại Triều Nghi, điện Thái Hòa cột đỏ mái vàng, Hiển Lâm Các và Cửu Đỉnh, Duyệt Thị Đường.
   Cơ chế: đêm mưa — chỉ sáng quanh đèn lồng cung đình; SÉT đánh theo đợt (chớp sáng cả kinh thành rồi đánh xuống 2 điểm
   gần Hunter, vòng đỏ báo trước); sông, hào và hồ chặn đường đi (đạn bay qua).
   Dian không vào trận: anh đi tìm "người cần gặp" ở bờ Bắc và hỗ trợ qua bộ đàm.
   Quái mới: Thị Vệ Xác Sống (giáo quét hình quạt), Kẻ Gọi Sét (gọi sét xuống chỗ Hunter đứng).
   Boss: NGHÊ ĐÁ HOÀNG CUNG — tượng nghê canh cung bị virus đánh thức: vồ, phun đá vụn, gầm; giai đoạn 2 gọi 3 viên ngọc
   xoay quanh làm giáp (bắn vỡ ngọc để phá giáp, nó sẽ choáng); giai đoạn 3 gọi sấm sét liên tục. */
'use strict';
(function (MB) {
  const U = MB.U, Ens = MB.Enemies, GK = MB.GK, VN = MB.VN;
  const WW = 4000, WH = 3000;
  const H3 = 0.45;
  const RIV = { y0: 2390, y1: 2700 };          // sông Hương
  const BRIDGE = { x0: 2700, x1: 2840 };       // cầu Trường Tiền
  const MOAT = { y0: 1890, y1: 2010, x0: 260, x1: 3740 };
  const WALL = { y0: 1720, y1: 1870 };
  const GATES = [[700, 820], [1930, 2070], [3280, 3400]];   // lối qua tường thành (Ngọ Môn ở giữa)
  const PONDS = [[1420, 1390, 1900, 1610], [2100, 1390, 2580, 1610]];
  const COURT = { x0: 1540, y0: 880, x1: 2460, y1: 1370 };
  const KYDAI = { x: 1150, y: 2230 };
  const THIENMU = { x: 520, y: 2200 };
  const PALACE = { x: 2000, y: 640 };

  /* ---------- vẽ cảnh 2D ---------- */
  const yellowRoof = (ctx, x, y, w, h, tiers) => {
    for (let i = 0; i < tiers; i++) {
      const k = i * 0.16, xx = x + w * k / 2, ww = w * (1 - k), yy = y - i * 16, hh = h * (1 - k * 0.6);
      ctx.fillStyle = '#7a5a10'; ctx.fillRect(xx - 6, yy + hh - 4, ww + 12, 6);
      VN.tileRoof(ctx, xx - 6, yy, ww + 12, hh, '#e0a828', '#a87818');
      // đầu đao cong
      ctx.fillStyle = '#c89018';
      for (const sx of [xx - 10, xx + ww + 2]) { ctx.beginPath(); ctx.moveTo(sx, yy + hh); ctx.quadraticCurveTo(sx + 4, yy + hh - 10, sx + (sx < xx ? -4 : 12), yy + hh - 18); ctx.lineTo(sx + 8, yy + hh); ctx.fill(); }
      ctx.fillStyle = '#5a8a6a'; ctx.fillRect(xx + ww * 0.15, yy - 3, ww * 0.7, 4); // bờ nóc men xanh
    }
  };
  // tường thành gạch rêu
  MB.Props.register('citadelWall', (ctx, o) => {
    const x = o.x - o.hw, y = o.y - o.hh;
    ctx.fillStyle = '#4a4238'; ctx.fillRect(x, y, o.w, o.h);
    ctx.strokeStyle = 'rgba(20,16,12,.4)'; ctx.lineWidth = 1;
    for (let yy = y + 8; yy < y + o.h; yy += 10) { ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x + o.w, yy); ctx.stroke(); }
    ctx.fillStyle = 'rgba(70,100,50,.35)'; for (let i = 0; i < o.w / 40; i++) U.ellipse(ctx, x + i * 40 + 12, y + ((i * 37) % o.h), 14, 6), ctx.fill();
    ctx.fillStyle = '#5a5246'; ctx.fillRect(x, y, o.w, 10);
  });
  // Ngọ Môn: đài cổng + lầu Ngũ Phụng (vẽ đè)
  MB.Props.register('ngoMon', (ctx, o) => {
    const x = o.x - o.hw, y = o.y - o.hh;
    VN.shadowBox(ctx, x, y - 40, o.w, o.h, 120, 0.3);
    ctx.fillStyle = '#5a4e40'; ctx.fillRect(x, y, o.w, o.h);
    ctx.fillStyle = '#3a3026'; for (let i = 0; i < 2; i++) { const cx = o.side < 0 ? x + o.w - 60 - i * 90 : x + 60 + i * 90; ctx.beginPath(); ctx.ellipse(cx, y + o.h, 26, 40, 0, Math.PI, 0); ctx.fill(); }
  });
  VN.over.ngoMon = (ctx, o, G) => {
    const x = o.x - o.hw, y = o.y - o.hh, H = 120 * H3;
    ctx.globalAlpha = VN.coverAlpha(G, x, y - H - 40, x + o.w, y + o.h - H);
    ctx.fillStyle = '#6a5c4a'; ctx.fillRect(x, y - H, o.w, o.h);
    // lầu Ngũ Phụng: hàng cột đỏ + mái vàng nhiều tầng
    ctx.fillStyle = '#9a1a14'; for (let i = 0; i < 6; i++) ctx.fillRect(x + 12 + i * (o.w - 30) / 5, y - H - 12, 5, 14);
    yellowRoof(ctx, x - 4, y - H - 46, o.w + 8, 40, 2);
    ctx.globalAlpha = 1;
  };
  // điện Thái Hòa
  MB.Props.register('palace', (ctx, o) => {
    const x = o.x - o.hw, y = o.y - o.hh, H = o.tall * H3;
    VN.shadowBox(ctx, x, y - H, o.w, o.h, o.tall, 0.3);
    ctx.fillStyle = '#6a5a48'; ctx.fillRect(x - 20, y + o.h - 14, o.w + 40, 26); // nền đá bậc thềm
    ctx.fillStyle = '#7a1a12'; ctx.fillRect(x, y + o.h - H, o.w, H);
    ctx.fillStyle = '#c8282a'; for (let i = 0; i < 12; i++) ctx.fillRect(x + 10 + i * (o.w - 26) / 11, y + o.h - H, 6, H);
    ctx.fillStyle = '#d8a828'; for (let i = 0; i < 11; i++) ctx.fillRect(x + 18 + i * (o.w - 26) / 11, y + o.h - H + 4, (o.w - 26) / 11 - 10, 6);
  });
  VN.over.palace = (ctx, o, G) => {
    const x = o.x - o.hw, y = o.y - o.hh, H = o.tall * H3;
    ctx.globalAlpha = VN.coverAlpha(G, x, y - H - 30, x + o.w, y + o.h - H);
    yellowRoof(ctx, x - 16, y - H - 24, o.w + 32, o.h + 10, o.tiers || 2);
    ctx.globalAlpha = 1;
  };
  // hành lang / nhà phụ mái ngói
  MB.Props.register('hall', (ctx, o) => {
    const x = o.x - o.hw, y = o.y - o.hh, H = (o.tall || 60) * H3;
    VN.shadowBox(ctx, x, y - H, o.w, o.h, o.tall || 60, 0.25);
    ctx.fillStyle = '#6a2a1e'; ctx.fillRect(x, y + o.h - H, o.w, H);
    ctx.fillStyle = '#b8282a'; for (let xx = x + 6; xx < x + o.w - 4; xx += 26) ctx.fillRect(xx, y + o.h - H, 4, H);
  });
  VN.over.hall = (ctx, o, G) => {
    const x = o.x - o.hw, y = o.y - o.hh, H = (o.tall || 60) * H3;
    ctx.globalAlpha = VN.coverAlpha(G, x, y - H, x + o.w, y + o.h - H);
    if (o.yellow) yellowRoof(ctx, x - 6, y - H - 6, o.w + 12, o.h + 6, o.tiers || 1);
    else VN.tileRoof(ctx, x - 6, y - H - 6, o.w + 12, o.h + 6, '#8a4a34', '#5a2a1e', o.h > o.w);
    ctx.globalAlpha = 1;
  };
  // tháp Phước Duyên (chùa Thiên Mụ): 7 tầng bát giác
  MB.Props.register('thienMu', (ctx, o) => { MB.Props.shadow(ctx, o.x + 60, o.y + 20, 80, 26, 0.3); ctx.fillStyle = '#7a6a58'; U.circle(ctx, o.x, o.y, o.r); ctx.fill(); });
  VN.over.thienMu = (ctx, o, G) => {
    const H = 360 * H3, x = o.x, y = o.y;
    ctx.globalAlpha = VN.coverAlpha(G, x - 70, y - H - 30, x + 70, y);
    for (let i = 0; i < 7; i++) {
      const w = 62 - i * 6.5, yy = y - i * H / 7, hh = H / 7;
      ctx.fillStyle = i % 2 ? '#c8b89a' : '#d8c8a8'; ctx.fillRect(x - w / 2, yy - hh, w, hh);
      ctx.fillStyle = '#3a2a1a'; ctx.fillRect(x - 6, yy - hh * 0.75, 12, hh * 0.55);
      ctx.fillStyle = '#6a5a48'; ctx.fillRect(x - w / 2 - 6, yy - hh - 3, w + 12, 5);
    }
    ctx.fillStyle = '#8a7048'; ctx.beginPath(); ctx.moveTo(x - 8, y - H); ctx.lineTo(x, y - H - 26); ctx.lineTo(x + 8, y - H); ctx.fill();
    ctx.globalAlpha = 1;
  };
  // Kỳ Đài: cột cờ + cờ đỏ sao vàng
  MB.Props.register('flagpole', (ctx, o) => { ctx.fillStyle = '#3a3a3a'; U.circle(ctx, o.x, o.y, o.r); ctx.fill(); });
  VN.over.flagpole = (ctx, o, G) => {
    const H = 300 * H3, x = o.x, y = o.y, wv = Math.sin(G.time * 4) * 4;
    ctx.strokeStyle = '#8a8a8a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - H); ctx.stroke();
    ctx.fillStyle = '#d8261e'; ctx.beginPath(); ctx.moveTo(x, y - H); ctx.quadraticCurveTo(x + 30, y - H + wv, x + 62, y - H + 4 + wv); ctx.lineTo(x + 62, y - H + 40 + wv); ctx.quadraticCurveTo(x + 30, y - H + 36 + wv, x, y - H + 36); ctx.fill();
    ctx.fillStyle = '#f2d02a'; U.circle(ctx, x + 28, y - H + 18 + wv * 0.6, 7); ctx.fill();
  };
  // đỉnh đồng (Cửu Đỉnh)
  MB.Props.register('urn', (ctx, o) => {
    MB.Props.shadow(ctx, o.x + 10, o.y + 8, o.r * 1.1, o.r * 0.5, 0.3);
    ctx.fillStyle = '#5a4a28'; for (const a of [0.6, 2.6, 4.6]) { U.circle(ctx, o.x + Math.cos(a) * o.r * 0.8, o.y + Math.sin(a) * o.r * 0.8, 4); ctx.fill(); }
    const gr = ctx.createRadialGradient(o.x - o.r * 0.3, o.y - o.r * 0.3, 2, o.x, o.y, o.r); gr.addColorStop(0, '#b0904a'); gr.addColorStop(1, '#5a4626');
    ctx.fillStyle = gr; U.circle(ctx, o.x, o.y, o.r); ctx.fill();
    ctx.strokeStyle = '#c8a860'; ctx.lineWidth = 2.5; U.circle(ctx, o.x, o.y, o.r * 0.72); ctx.stroke();
    ctx.fillStyle = 'rgba(30,22,12,.75)'; U.circle(ctx, o.x, o.y, o.r * 0.6); ctx.fill();
    ctx.fillStyle = '#8a7238'; ctx.fillRect(o.x - o.r - 3, o.y - 2, 6, 4); ctx.fillRect(o.x + o.r - 3, o.y - 2, 6, 4);
  });
  // đèn lồng cung đình trên cột
  MB.Props.register('cungLamp', (ctx, o, t) => {
    ctx.fillStyle = '#3a2a1a'; U.circle(ctx, o.x, o.y, 6); ctx.fill();
    VN.lantern(ctx, o.x, o.y - 34, 8, '#e8b030', t + o.x, true);
  });
  // ấn đầu dê (mục tiêu thử thách): trụ bùa đỏ dán trên cửa cung
  MB.Props.register('goatSeal', (ctx, o, t) => {
    MB.Props.shadow(ctx, o.x + 8, o.y + 8, 20, 8, 0.3);
    ctx.fillStyle = o.flash > 0 ? '#ffffff' : '#2a1a14'; U.rr(ctx, o.x - 12, o.y - 44, 24, 52, 4); ctx.fill();
    ctx.fillStyle = '#c8202a'; ctx.fillRect(o.x - 9, o.y - 40, 18, 40);
    ctx.fillStyle = '#ffe08a'; ctx.font = '900 12px system-ui'; ctx.textAlign = 'center'; ctx.fillText('♉', o.x, o.y - 18);
    const pul = 0.5 + Math.sin(t * 4 + o.x) * 0.5; ctx.strokeStyle = `rgba(255,80,80,${0.3 + pul * 0.5})`; ctx.lineWidth = 2; U.circle(ctx, o.x, o.y - 20, 22 + pul * 4); ctx.stroke();
  });
  MB.Props.register('hueWater', () => {});

  /* ---------- quái mới ---------- */
  Ens.register('palaceGuard', {
    name: 'Thị Vệ Xác Sống', r: 21, hp: 120, speed: 88, dmg: 20, score: 210, blood: '#3a1a10', gore: '#a8e07a', knockMul: 0.4,
    init(e) { e.cd = U.rnd(0.8, 1.6); },
    update(e, G, dt) {
      const p = G.player, d = Ens.distPlayer(e, G);
      e.cd -= dt;
      if (e.state === 'wind') {
        Ens.stop(e, dt, 14); e.st -= dt; e.face = e.lock;
        if (e.st <= 0) {
          e.state = 'swing'; e.st = 0.25; MB.Audio.play('lash');
          const a = Math.atan2(p.y - e.y, p.x - e.x);
          if (U.dist(p.x, p.y, e.x, e.y) < 140 && Math.abs(U.angDiff(e.lock, a)) < 1.0) G.hurtPlayer(Math.round(e.dmg * 1.4), e);
        }
      } else if (e.state === 'swing') { Ens.stop(e, dt, 10); e.st -= dt; if (e.st <= 0) { e.state = null; e.cd = U.rnd(1.8, 2.6); } }
      else {
        Ens.steer(e, G, p.x, p.y, e.speed, dt);
        if (d < 125 && e.cd <= 0) { e.state = 'wind'; e.st = 0.65; e.lock = Ens.toPlayer(e, G); }
      }
    },
    tele(ctx, e, G) {
      if (e.state !== 'wind') return;
      const k = 1 - e.st / 0.65;
      ctx.fillStyle = `rgba(255,70,70,${0.1 + k * 0.25})`; ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.arc(e.x, e.y, 140, e.lock - 1, e.lock + 1); ctx.closePath(); ctx.fill();
    },
    draw(ctx, e, G) {
      const t = G.time, mv = Math.hypot(e.vx, e.vy) > 15, sw = mv ? Math.sin(t * 8 + e.t) * 5 : 0;
      const sweep = e.state === 'wind' ? -0.9 * (1 - e.st / 0.65) : e.state === 'swing' ? 1.0 : 0;
      ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.face || 0);
      ctx.fillStyle = 'rgba(0,0,0,.28)'; U.ellipse(ctx, 3, 6, 22, 15); ctx.fill();
      ctx.fillStyle = '#2a2420'; U.rr(ctx, -6 + sw, -10, 12, 6, 3); ctx.fill(); U.rr(ctx, -6 - sw, 4, 12, 6, 3); ctx.fill();
      // áo thị vệ đỏ viền vàng, giáp ngực
      ctx.fillStyle = '#8a1a14'; U.rr(ctx, -12, -14, 22, 28, 8); ctx.fill();
      ctx.strokeStyle = '#d8a828'; ctx.lineWidth = 2; ctx.strokeRect(-6, -10, 10, 20);
      // giáo dài (quét)
      ctx.save(); ctx.rotate(sweep);
      ctx.strokeStyle = '#5a3a1a'; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(-6, 12); ctx.lineTo(44, 12); ctx.stroke();
      ctx.fillStyle = '#c8ccd0'; ctx.beginPath(); ctx.moveTo(44, 7); ctx.lineTo(58, 12); ctx.lineTo(44, 17); ctx.fill();
      ctx.fillStyle = '#c8202a'; ctx.fillRect(38, 9, 5, 7);
      ctx.restore();
      // nón chóp lính
      ctx.fillStyle = '#2a2420'; U.circle(ctx, 2, 0, 9.5); ctx.fill();
      ctx.fillStyle = '#d8a828'; U.circle(ctx, 2, 0, 3); ctx.fill();
      ctx.fillStyle = '#a8e07a'; U.circle(ctx, 10, -3, 1.6); ctx.fill(); U.circle(ctx, 10, 3, 1.6); ctx.fill();
      ctx.restore();
    },
  });
  // sét đánh xuống một điểm (dùng cho Kẻ Gọi Sét, đợt sấm và boss)
  function strike(G, x, y, dmg) {
    G.explosion(x, y, 72, 40, { player: dmg || 18, color: '#d8e8ff', ring: '190,210,255', obstacles: false, small: true, shake: 5, knock: 200 });
    G.gs.flash = Math.max(G.gs.flash || 0, 0.12);
    G.addFx({ layer: 'top', life: 0.22, draw(ctx, fx) {
      const k = 1 - fx.t / fx.life; ctx.strokeStyle = `rgba(230,240,255,${k})`; ctx.lineWidth = 4 * k + 1; ctx.beginPath(); ctx.moveTo(x + U.rnd(-30, 30), y - 420);
      for (let i = 1; i <= 7; i++) ctx.lineTo(x + U.rnd(-24, 24) * (1 - i / 7), y - 420 + i * 60);
      ctx.stroke(); } });
  }
  function callStrike(G, x, y, dur, dmg) { G.telegraphCircle(x, y, 72, dur || 1, () => strike(G, x, y, dmg), 'rgba(170,200,255,.14)'); }
  Ens.register('stormCaller', Ens.make({
    name: 'Kẻ Gọi Sét', r: 17, hp: 80, speed: 100, dmg: 12, score: 190, blood: '#1a1a3a', gore: '#bcd0ff',
    draw(ctx, e, G) {
      const t = G.time, aim = e.state === 'aim';
      ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.face || 0);
      ctx.fillStyle = 'rgba(0,0,0,.28)'; U.ellipse(ctx, 3, 6, 18, 13); ctx.fill();
      // áo choàng trùm đầu xanh đen
      ctx.fillStyle = '#1e2238'; U.ellipse(ctx, -2, 0, 16, 14); ctx.fill();
      ctx.fillStyle = '#2e3458'; U.circle(ctx, 4, 0, 8); ctx.fill();
      ctx.fillStyle = '#9ab8ff'; U.circle(ctx, 9, -2.5, 1.5); ctx.fill(); U.circle(ctx, 9, 2.5, 1.5); ctx.fill();
      // gậy thu sét
      ctx.strokeStyle = '#6a5a48'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-4, 10); ctx.lineTo(18, 16); ctx.stroke();
      ctx.fillStyle = aim ? '#eaf2ff' : '#7a9aff'; U.circle(ctx, 20, 16, aim ? 5 : 3.5); ctx.fill();
      ctx.restore();
      if (aim) { ctx.strokeStyle = `rgba(200,220,255,${0.4 + Math.random() * 0.6})`; ctx.lineWidth = 1.5; ctx.beginPath(); for (let i = 0; i < 3; i++) { const a = Math.random() * U.TAU; ctx.moveTo(e.x, e.y); ctx.lineTo(e.x + Math.cos(a) * 26, e.y + Math.sin(a) * 26); } ctx.stroke(); }
    },
  }, Ens.AI.shooter({ cd: [3.2, 4.4], min: 240, max: 520, aim: 0.8, line: false, wig: { f: 1.2, a: 0.4 },
    shot: (e, G) => { const p = G.player; callStrike(G, p.x + p.vx * 0.45, p.y + p.vy * 0.45, 1.0, 16); MB.Audio.play('shot_plasma'); } })));

  /* ---------- BOSS: NGHÊ ĐÁ HOÀNG CUNG ---------- */
  Ens.register('jadeOrb', {
    name: 'Ngọc Giáp', r: 16, hp: 360, speed: 0, dmg: 10, score: 300, fly: true, noContact: true, knockMul: 0, blood: '#0a3a2a', gore: '#8affc8',
    init(e) { e.fireT = U.rnd(1.5, 3); e.ang = 0; },
    update(e, G, dt) {
      const b = G.boss;
      if (!b || b.dead) { e.dead = true; return; }
      e.ang += dt * 1.3;
      e.x = b.x + Math.cos(e.ang) * 120; e.y = b.y + Math.sin(e.ang) * 120; e.vx = e.vy = 0;
      e.fireT -= dt;
      if (e.fireT <= 0) { e.fireT = U.rnd(2.4, 3.4); G.enemyShot({ x: e.x, y: e.y, a: Ens.toPlayer(e, G), speed: 300, r: 8, dmg: 10, color: '#8affc8', owner: e }); }
    },
    onDeath(e, G) {
      G.burst(e.x, e.y, '#8affc8', 30, 260);
      const b = G.boss; if (!b || b.dead) return;
      const left = G.enemies.filter((o) => !o.dead && o.type === 'jadeOrb').length;
      if (left === 0) { b.stunT = 3; G.banner('GIÁP NGỌC VỠ!', 'Nghê đá choáng 3 giây — dồn hoả lực!', 1.6); MB.Audio.play('stagger'); G.shake(12); }
    },
    draw(ctx, e, G) {
      const t = G.time, gl = ctx.createRadialGradient(e.x - 4, e.y - 4, 2, e.x, e.y, 22);
      gl.addColorStop(0, '#eafff4'); gl.addColorStop(0.5, '#4ad89a'); gl.addColorStop(1, 'rgba(20,120,80,0)');
      ctx.fillStyle = gl; U.circle(ctx, e.x, e.y, 22); ctx.fill();
      ctx.strokeStyle = `rgba(160,255,210,${0.5 + Math.sin(t * 6) * 0.3})`; ctx.lineWidth = 2; U.circle(ctx, e.x, e.y, 16); ctx.stroke();
      const b = G.boss; if (b && !b.dead) { ctx.strokeStyle = 'rgba(120,255,190,.25)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
    },
  });
  Ens.register('nghe', {
    name: 'Nghê Đá Hoàng Cung', r: 54, hp: 16000, speed: 115, dmg: 28, score: 0, boss: true, knockMul: 0, blood: '#2a2a20', gore: '#c8c0a0',
    init(e) { e.phase = 1; e.state = 'stalk'; e.pounceT = 3.5; e.shardT = 2.2; e.roarT = 7; e.stormT = 4; },
    armorFn(e, dmg, G) {
      const orbs = G.enemies.some((o) => !o.dead && o.type === 'jadeOrb');
      if (orbs) { if (!e.armTxt || G.time - e.armTxt > 1.2) { e.armTxt = G.time; G.text(e.x, e.y - e.r - 24, 'GIÁP NGỌC', '#8affc8', 13); } return dmg * 0.15; }
      return dmg;
    },
    update(e, G, dt) {
      const p = G.player, k = e.hp / e.maxHp, ph = k > 0.66 ? 1 : k > 0.33 ? 2 : 3, d = Ens.distPlayer(e, G);
      if (ph > e.phase) {
        e.phase = ph; G.shake(14); MB.Audio.play('roar');
        if (ph === 2) {
          G.banner('PHASE 2', 'Ba viên ngọc giáp xoay quanh Nghê — bắn vỡ ngọc!', 2);
          for (let i = 0; i < 3; i++) { const o = G.spawnEnemyAt('jadeOrb', e.x, e.y, { extra: true }); if (o) { o.ang = i / 3 * U.TAU; o.spawnT = 0.4; } }
        } else G.banner('PHASE 3', 'Sấm Huế gầm lên!', 2);
      }
      if (ph === 3) { e.stormT -= dt; if (e.stormT <= 0) { e.stormT = 1.6; callStrike(G, p.x + U.rnd(-90, 90), p.y + U.rnd(-90, 90), 1.0, 18); } }
      if (e.state === 'stalk') {
        Ens.steer(e, G, p.x, p.y, e.speed, dt);
        e.pounceT -= dt; e.shardT -= dt; e.roarT -= dt;
        if (e.pounceT <= 0 && d > 140 && d < 620) { e.state = 'crouch'; e.st = 0.55; e.tx = p.x; e.ty = p.y; MB.Audio.play('growl'); }
        else if (e.shardT <= 0 && d < 560) { e.state = 'shardAim'; e.st = 0.5; e.lock = Ens.toPlayer(e, G); e.volley = 2; }
        else if (ph >= 2 && e.roarT <= 0) { e.state = 'roar'; e.st = 0.8; }
      } else if (e.state === 'crouch') {
        Ens.stop(e, dt, 14); e.st -= dt; e.face = Math.atan2(e.ty - e.y, e.tx - e.x);
        if (e.st <= 0) { e.state = 'air'; e.st = 0.55; e.airborne = true; e.fx0 = e.x; e.fy0 = e.y; G.telegraphCircle(e.tx, e.ty, 120, 0.55, null, 'rgba(255,70,70,.16)'); }
      } else if (e.state === 'air') {
        e.st -= dt; const kk = 1 - e.st / 0.55;
        e.x = U.lerp(e.fx0, e.tx, kk); e.y = U.lerp(e.fy0, e.ty, kk); e.vx = e.vy = 0;
        if (e.st <= 0) {
          e.airborne = false; e.state = 'stalk'; e.pounceT = ph === 1 ? 5 : 3.8;
          G.explosion(e.x, e.y, 120, 0, { player: 26, knock: 0, color: '#c8c0a0', ring: '200,190,160', obstacles: false, enemies: false });
        }
      } else if (e.state === 'shardAim') {
        Ens.stop(e, dt, 14); e.st -= dt; e.lock += U.angDiff(e.lock, Ens.toPlayer(e, G)) * Math.min(1, dt * 3); e.face = e.lock;
        if (e.st <= 0) {
          for (let i = -4; i <= 4; i++) G.enemyShot({ x: e.x + Math.cos(e.lock) * 50, y: e.y + Math.sin(e.lock) * 50, a: e.lock + i * 0.13, speed: 430, r: 9, dmg: 12, kind: 'rock', owner: e, life: 1.6 });
          MB.Audio.play('break'); e.volley--;
          if (e.volley > 0) { e.st = 0.35; } else { e.state = 'stalk'; e.shardT = ph === 1 ? 4 : 3; }
        }
      } else if (e.state === 'roar') {
        Ens.stop(e, dt, 14); e.st -= dt;
        if (e.st <= 0) { e.state = 'stalk'; e.roarT = 9; G.shockwave(e.x, e.y, 620, 1.8, 18, 'rgba(220,210,180,.9)'); }
      }
    },
    tele(ctx, e, G) {
      if (e.state === 'crouch') G.drawTelegraphLine(ctx, e.x, e.y, Math.atan2(e.ty - e.y, e.tx - e.x), U.dist(e.x, e.y, e.tx, e.ty), 1 - e.st / 0.55);
      if (e.state === 'shardAim') { const k = 1 - e.st / 0.5; ctx.fillStyle = `rgba(255,80,80,${0.08 + k * 0.18})`; ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.arc(e.x, e.y, 480, e.lock - 0.55, e.lock + 0.55); ctx.closePath(); ctx.fill(); }
      if (e.state === 'roar') { const k = U.clamp(1 - e.st / 0.8, 0, 1); ctx.strokeStyle = `rgba(230,220,190,${0.3 + k * 0.6})`; ctx.lineWidth = 4; U.circle(ctx, e.x, e.y, 70 + k * 60); ctx.stroke(); }
    },
    draw(ctx, e, G) {
      const t = G.time, mv = Math.hypot(e.vx, e.vy) > 20, walk = mv ? Math.sin(t * 9) : 0;
      const lift = e.airborne ? Math.sin((1 - e.st / 0.55) * Math.PI) : 0;
      ctx.fillStyle = 'rgba(0,0,0,.35)'; U.ellipse(ctx, e.x + 8, e.y + 16, 58, 32); ctx.fill();
      ctx.save(); ctx.translate(e.x, e.y - lift * 50); ctx.rotate(e.face || 0); ctx.scale(1 + lift * 0.2, 1 + lift * 0.2);
      // chân đá vuốt cong
      ctx.fillStyle = '#5a5a4a';
      for (const [x, sd, phs] of [[28, -1, 1], [28, 1, -1], [-24, -1, -1], [-24, 1, 1]]) { U.ellipse(ctx, x + walk * phs * 8, sd * 34, 12, 9); ctx.fill(); }
      // thân đá rêu phong, nứt phát sáng virus
      const gr = ctx.createRadialGradient(-10, -12, 6, 0, 0, 56); gr.addColorStop(0, '#a8a890'); gr.addColorStop(0.7, '#7a7a64'); gr.addColorStop(1, '#4a4a3a');
      ctx.fillStyle = gr; U.ellipse(ctx, 0, 0, 50, 34); ctx.fill();
      ctx.fillStyle = 'rgba(80,110,60,.45)'; for (let i = 0; i < 6; i++) { U.circle(ctx, -30 + i * 11, (i % 2 ? 1 : -1) * 18, 7); ctx.fill(); }
      ctx.strokeStyle = 'rgba(150,255,110,.8)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-36, -6); ctx.lineTo(-18, -14); ctx.lineTo(-4, -4); ctx.lineTo(14, -12); ctx.moveTo(-30, 12); ctx.lineTo(-10, 6); ctx.lineTo(8, 14); ctx.stroke();
      // đuôi xoăn
      ctx.fillStyle = '#6a6a56'; for (let i = 0; i < 4; i++) { U.circle(ctx, -52 - i * 6, Math.sin(t * 3 + i) * 6, 8 - i); ctx.fill(); }
      // đầu nghê: bờm xoăn từng lọn, mắt lồi, miệng ngậm ngọc
      ctx.fillStyle = '#6a6a56'; for (let i = 0; i < 10; i++) { const a = i / 10 * U.TAU; U.circle(ctx, 46 + Math.cos(a) * 20, Math.sin(a) * 20, 8); ctx.fill(); }
      ctx.fillStyle = '#8a8a72'; U.circle(ctx, 50, 0, 18); ctx.fill();
      ctx.fillStyle = '#4a4a3a'; U.ellipse(ctx, 64, 0, 9, 12); ctx.fill();
      ctx.fillStyle = e.phase >= 2 ? '#8affc8' : '#d8e8c0'; U.circle(ctx, 66, 0, 5); ctx.fill();
      const eye = e.enrageT > 0 ? '#ff2a2a' : '#ffcc3a';
      ctx.shadowColor = eye; ctx.shadowBlur = 10; ctx.fillStyle = eye; U.circle(ctx, 56, -9, 4); ctx.fill(); U.circle(ctx, 56, 9, 4); ctx.fill(); ctx.shadowBlur = 0;
      ctx.restore();
    },
  });

  /* ---------- bản đồ ---------- */
  const rng = U.seeded(1515);
  const obstacles = [];
  const water = (x0, y0, x1, y1) => obstacles.push({ kind: 'hueWater', shape: 'box', x: (x0 + x1) / 2, y: (y0 + y1) / 2, w: x1 - x0, h: y1 - y0, rot: 0, noShot: true, water: true });
  // sông Hương (chừa cầu Trường Tiền)
  water(0, RIV.y0, BRIDGE.x0, RIV.y1); water(BRIDGE.x1, RIV.y0, WW, RIV.y1);
  // hào thành (chừa 3 cầu) + tường thành (chừa 3 cổng)
  let xs = MOAT.x0;
  for (const [a, b] of GATES) { water(xs, MOAT.y0, a, MOAT.y1); xs = b; }
  water(xs, MOAT.y0, MOAT.x1, MOAT.y1);
  xs = 120;
  for (const [a, b] of GATES) { if (a - xs > 10) obstacles.push({ kind: 'citadelWall', shape: 'box', x: (xs + a) / 2, y: (WALL.y0 + WALL.y1) / 2, w: a - xs, h: WALL.y1 - WALL.y0, rot: 0, tall: 50 }); xs = b; }
  obstacles.push({ kind: 'citadelWall', shape: 'box', x: (xs + 3880) / 2, y: (WALL.y0 + WALL.y1) / 2, w: 3880 - xs, h: WALL.y1 - WALL.y0, rot: 0, tall: 50 });
  // Ngọ Môn hai cánh hai bên lối giữa (đè lên tường)
  obstacles.push({ kind: 'ngoMon', shape: 'box', x: GATES[1][0] - 160, y: 1780, w: 320, h: 150, rot: 0, tall: 120, side: -1 });
  obstacles.push({ kind: 'ngoMon', shape: 'box', x: GATES[1][1] + 160, y: 1780, w: 320, h: 150, rot: 0, tall: 120, side: 1 });
  // hồ Thái Dịch
  for (const [x0, y0, x1, y1] of PONDS) water(x0, y0, x1, y1);
  // điện Thái Hòa + Tử Cấm Thành phía sau
  obstacles.push({ kind: 'palace', shape: 'box', x: PALACE.x, y: PALACE.y, w: 640, h: 230, rot: 0, tall: 130, tiers: 2 });
  for (const [x, w] of [[1250, 360], [2000, 520], [2760, 360]]) obstacles.push({ kind: 'hall', shape: 'box', x, y: 260, w, h: 120, rot: 0, tall: 80, yellow: true });
  // hành lang hai bên sân (có lối đi)
  for (const x of [1430, 2570]) for (const [y0, y1] of [[420, 820], [960, 1300]]) obstacles.push({ kind: 'hall', shape: 'box', x, y: (y0 + y1) / 2, w: 70, h: y1 - y0, rot: 0, tall: 60 });
  // Hiển Lâm Các + Cửu Đỉnh (phía Tây), Duyệt Thị Đường (phía Đông)
  obstacles.push({ kind: 'palace', shape: 'box', x: 860, y: 760, w: 220, h: 160, rot: 0, tall: 150, tiers: 3 });
  for (let i = 0; i < 9; i++) obstacles.push({ kind: 'urn', shape: 'circle', x: 560 + i * 72, y: 1120, r: 22 });
  obstacles.push({ kind: 'hall', shape: 'box', x: 3150, y: 820, w: 380, h: 220, rot: 0, tall: 90, yellow: true, tiers: 2 });
  // đỉnh đồng lớn ở 4 góc sân (chỗ nấp khi đánh boss)
  for (const [x, y] of [[1680, 980], [2320, 980], [1680, 1290], [2320, 1290]]) obstacles.push({ kind: 'urn', shape: 'circle', x, y, r: 30 });
  // tháp Phước Duyên (Thiên Mụ), Kỳ Đài
  obstacles.push({ kind: 'thienMu', shape: 'circle', x: THIENMU.x, y: THIENMU.y, r: 52 });
  obstacles.push({ kind: 'flagpole', shape: 'circle', x: KYDAI.x, y: KYDAI.y - 30, r: 10 });
  // cây xanh: hàng cây ven sông, vườn trong thành
  for (let x = 160; x < 3900; x += 190) if (Math.abs(x - BRIDGE.x0 - 70) > 140 && Math.abs(x - THIENMU.x) > 140 && Math.abs(x - KYDAI.x) > 160) obstacles.push({ kind: 'vtree', shape: 'circle', x: x + rng() * 40, y: 2330, r: 24, sp: rng() < 0.5 ? 'banyan' : 'locvung', lean: 0, tall: 100 });
  for (let i = 0; i < 26; i++) {
    const x = 200 + rng() * 3600, y = 300 + rng() * 1350;
    if (x > 1300 && x < 2700 && y > 380) continue;
    if (obstacles.some((o) => U.dist(o.x, o.y, x, y) < (o.br || 60) + 70)) continue;
    obstacles.push({ kind: 'vtree', shape: 'circle', x, y, r: 26, sp: rng() < 0.6 ? 'banyan' : 'locvung', lean: 0, tall: 110 });
  }
  // đèn cung đình
  const LAMPS = [];
  for (let y = 1450; y < 1700; y += 120) LAMPS.push([1920, y], [2080, y]);
  for (let x = 1600; x <= 2400; x += 200) LAMPS.push([x, 900], [x, 1350]);
  for (const [a, b] of GATES) LAMPS.push([a - 30, 2050], [b + 30, 2050]);
  for (let x = 300; x < 3900; x += 400) LAMPS.push([x, 2370]);
  LAMPS.push([BRIDGE.x0 + 10, 2760], [BRIDGE.x1 - 10, 2760], [860, 900], [3150, 960], [KYDAI.x - 100, KYDAI.y + 60], [KYDAI.x + 100, KYDAI.y + 60]);
  for (const [x, y] of LAMPS) obstacles.push({ kind: 'cungLamp', shape: 'circle', x, y, r: 7 });
  const lights = LAMPS.map(([x, y]) => ({ x, y: y - 10, r: 190, h: 30, c: 'rgba(255,190,90,.22)' }));
  const DRAGONS = [[600, 2520, 0.05], [1700, 2600, -0.04], [3300, 2500, 0.08]];

  MB.registerGate({
    id: 15, seed: 1515, view3d: true, act: 2,
    title: 'GATE 15 — HUẾ', subtitle: 'Kinh thành trong đêm mưa',
    world: { w: WW, h: WH }, bg: '#0c1218', mmColor: 'rgba(200,170,110,.7)',
    scale: { hp: 2.55, dmg: 1.6 },
    start: { x: 2770, y: 2870 },
    obstacles, hazards: [],
    crates: [{ x: 2400, y: 2860 }, { x: 3300, y: 2200 }, { x: 900, y: 2100 }, { x: 600, y: 1450 }, { x: 3300, y: 1400 }, { x: 1560, y: 1200 }, { x: 1000, y: 400 }],
    spawnPoints: [
      { x: 1200, y: 2880 }, { x: 3700, y: 2880 }, { x: 300, y: 2250 }, { x: 3800, y: 2250 }, { x: 2000, y: 2200 },
      { x: 600, y: 1550 }, { x: 3400, y: 1550 }, { x: 400, y: 600 }, { x: 3700, y: 500 }, { x: 2000, y: 1250 }, { x: 1000, y: 1300 }, { x: 3000, y: 1300 },
    ],
    waves: [
      { total: 32, maxAlive: 14, mix: { zombie: 3, runner: 3, palaceGuard: 3, goatDrone: 2, lanternWisp: 1 }, interval: [0.45, 0.85], elite: 0.14 },
      { total: 36, maxAlive: 15, mix: { palaceGuard: 4, stormCaller: 3, runner: 3, goatDrone: 2, lanternWisp: 2 }, interval: [0.4, 0.8], elite: 0.18 },
      { total: 40, maxAlive: 17, mix: { palaceGuard: 4, stormCaller: 3, riot: 2, runner: 3, lanternWisp: 2, goatDrone: 2 }, interval: [0.36, 0.72], elite: 0.22 },
    ],
    boss: { type: 'nghe', x: 2000, y: 1120, fixed: true },
    intro: { title: 'MÀN 2 · NHIỆM VỤ', text: 'Huế, đêm mưa. Vượt cầu Trường Tiền, qua Ngọ Môn, vào Đại Nội. Thấy vòng xanh dưới chân thì chạy — sét sắp đánh.' },
    objectives: [
      { title: 'BỜ SÔNG HƯƠNG', text: 'Thị Vệ Xác Sống quét giáo hình quạt (vùng đỏ): lùi ra sau hoặc lộn né.' },
      { title: 'NGỌ MÔN', text: 'Kẻ Gọi Sét gọi sét xuống chỗ bạn đứng — hạ chúng trước.' },
      { title: 'ĐẠI NỘI', text: 'Wave cuối. Qua cầu Trung Đạo, tiến vào sân Đại Triều Nghi.' },
      { title: 'BOSS · NGHÊ ĐÁ HOÀNG CUNG', text: 'Né cú vồ và đá vụn. Khi ngọc giáp xuất hiện, bắn vỡ cả 3 viên để Nghê choáng.' },
    ],
    challenges: [
      { id: 'seal', type: 'destroy', name: 'Ấn Đầu Dê', desc: 'Phá 4 ấn bùa GoatEvil dán trong kinh thành', kind: 'goatSeal', r: 18, hp: 320,
        spawner: { type: 'palaceGuard', every: 7, range: 700, cap: 5 },
        targets: [{ x: 760, y: 1640 }, { x: 860, y: 950 }, { x: 3150, y: 1000 }, { x: 3340, y: 1640 }], reward: { mod: 'split' } },
      { id: 'kydai', type: 'hold', name: 'Kỳ Đài', desc: 'Giữ chân cột cờ Kỳ Đài 16 giây', zone: { x: KYDAI.x, y: KYDAI.y + 30, r: 90 }, time: 16,
        mix: { palaceGuard: 2, stormCaller: 1 }, spawnEvery: 1.7, reward: { mod: 'barrel' } },
      { id: 'streak', type: 'streak', name: 'Mưa Huế', desc: '24 hạ gục liên tiếp không trúng đòn', count: 24, reward: { mod: 'pierce' } },
    ],
    clue: { x: 560, y: 1180, title: 'Ghi chép số 5 — Huế', text: [
      'Ngày 29. Dưới chân Cửu Đỉnh có một hầm cũ, khô ráo, kín đáo. Hạnh vẫn giữ chìa khoá của nó.',
      'Hạnh là người duy nhất ngoài tôi biết công thức gốc. Nếu cô ấy nói ra, mọi thứ sẽ sụp đổ.',
      'Không được tin bất kỳ ai mang ký hiệu đầu dê — kể cả những người từng mặc áo blouse trắng. Bước tiếp theo: Đà Nẵng, cây cầu có con rồng phun lửa.',
    ] },
    comms: [
      { on: 'start', t: 2.5, lines: [['HUNTER', 'Huế mưa… Kinh thành im lặng như một ngôi mộ.']] },
      { on: 'start', t: 7, lines: [['DIAN', 'Tôi đi tìm người đó ở bờ Bắc. Cậu vào Đại Nội — giữ liên lạc.']] },
      { on: 'start', t: 14, lines: [['GOATEVIL', 'Hoàng cung đẹp nhỉ? Ta đã trao cho những pho tượng ở đây… một trái tim mới.']] },
      { on: 'wave', wave: 2, lines: [['DIAN', 'Kẻ Gọi Sét — thấy vòng sáng dưới chân thì chạy ngay, sét đánh đúng chỗ đó.']] },
      { on: 'wave', wave: 3, lines: [['HUNTER', 'Dian, anh tìm được người đó chưa?'], ['DIAN', 'Rồi. Cô ấy run lắm… cứ nhắc mãi một cái tên: V-0.']] },
      { on: 'low', lines: [['GOATEVIL', 'Mưa Huế dai dẳng lắm, Hunter. Như cái chết của ngươi vậy.']] },
      { on: 'boss', lines: [['GOATEVIL', 'Nghê đá canh giữ hoàng cung hàng trăm năm. Giờ nó canh giữ ta.'], ['HUNTER', 'Vậy thì ta phá nó.']] },
      { on: 'phase', phase: 2, lines: [['DIAN', 'Ba viên ngọc xoay quanh nó là lớp giáp — bắn vỡ ngọc trước!']] },
      { on: 'phase', phase: 3, lines: [['GOATEVIL', 'Sấm Huế, gầm lên đi!']] },
      { on: 'won', lines: [['DIAN', 'Người đó là cô Hạnh — trợ lý cũ của thầy Ted. Cô ấy nói V-0… không phải tai nạn.'], ['HUNTER', 'Vậy là cố ý?'], ['DIAN', 'Gặp tôi ở Đà Nẵng. Ở đó tôi kể hết.']] },
    ],
    light3d: { hemiSky: 0x6a7aa8, hemiGround: 0x1a1810, hemi: 1.1, sun: 0xa8b8ff, sunI: 0.85, exposure: 1.55 },

    setup(G) {
      G.__over = null;
      G.gs.flash = 0; G.gs.boltT = 16; G.gs.drops = null;
      for (const [x, y, rot] of DRAGONS) G.actors.push({ kind: 'dragonBoat', x, y, rot, ph: x * 0.01, r: 80, x0: x });
      G.actors.push({ kind: 'hueLights', x: 0, y: 0, r: 1 });
    },
    update(G, dt) {
      const s = G.gs;
      if (s.flash > 0) s.flash -= dt;
      // đợt sấm: chớp sáng cả kinh thành rồi sét đánh xuống 2 điểm gần Hunter
      if (G.state === 'fight' || G.state === 'boss' || G.state === 'break') {
        s.boltT -= dt;
        if (s.boltT <= 0) {
          s.boltT = U.rnd(13, 19); s.flash = 0.35; MB.Audio.play('boom'); G.shake(4);
          const p = G.player;
          for (let i = 0; i < 2; i++) { const a = U.rnd(0, U.TAU), d = U.rnd(60, 200); callStrike(G, p.x + Math.cos(a) * d, p.y + Math.sin(a) * d, 1.1, 18); }
        }
      }
      for (const a of G.actors) if (a.kind === 'dragonBoat') a.x = a.x0 + Math.sin(G.time * 0.12 + a.ph) * 260;
    },
    drawUnder(G, ctx) {
      // giọt mưa lăn tăn trên mặt nước và sân đá
      const t = G.time, c = G.cam, vw = G.W / G.zoom, vh = G.H / G.zoom;
      ctx.strokeStyle = 'rgba(200,220,255,.35)'; ctx.lineWidth = 1;
      for (let i = 0; i < 70; i++) {
        const k = (t * 1.6 + i * 0.137) % 1, x = c.x + ((i * 211) % vw), y = c.y + ((i * 127 + Math.floor(t * 1.6 + i * 0.137) * 53) % vh);
        ctx.globalAlpha = 1 - k; ctx.beginPath(); ctx.ellipse(x, y, 3 + k * 10, 1.5 + k * 4, 0, 0, U.TAU); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      // sen trên hào và hồ
      const draw = (x0, y0, x1, y1, seed) => {
        if (x1 < c.x || x0 > c.x + vw || y1 < c.y || y0 > c.y + vh) return;
        const R = U.seeded(seed);
        for (let i = 0; i < (x1 - x0) * (y1 - y0) / 3000; i++) {
          const x = x0 + R() * (x1 - x0), y = y0 + R() * (y1 - y0);
          ctx.fillStyle = '#2a5a34'; U.circle(ctx, x, y, 8 + R() * 6); ctx.fill();
          if (R() < 0.25) { ctx.fillStyle = '#f0a8c0'; U.circle(ctx, x + 3, y - 3, 4); ctx.fill(); }
        }
      };
      draw(MOAT.x0, MOAT.y0 + 10, MOAT.x1, MOAT.y1 - 10, 5);
      PONDS.forEach((p, i) => draw(p[0] + 10, p[1] + 10, p[2] - 10, p[3] - 10, 11 + i));
    },
    drawOver(G, ctx) {
      VN.drawOver(G, ctx);
      // vòm thép cầu Trường Tiền (6 nhịp)
      const t = G.time;
      ctx.strokeStyle = '#c8ccd4'; ctx.lineWidth = 3;
      for (const x of [BRIDGE.x0 + 4, BRIDGE.x1 - 4]) for (let i = 0; i < 6; i++) {
        const y0 = RIV.y0 - 10 + i * (RIV.y1 - RIV.y0 + 20) / 6, y1 = y0 + (RIV.y1 - RIV.y0 + 20) / 6;
        ctx.beginPath(); ctx.moveTo(x, y0); ctx.quadraticCurveTo(x - 30, (y0 + y1) / 2, x, y1); ctx.stroke();
      }
      ctx.strokeStyle = `rgba(255,220,140,${0.4 + Math.sin(t * 2) * 0.1})`; ctx.lineWidth = 1.5;
      for (const x of [BRIDGE.x0 + 4, BRIDGE.x1 - 4]) { ctx.beginPath(); ctx.moveTo(x - 2, RIV.y0 - 10); ctx.lineTo(x - 2, RIV.y1 + 10); ctx.stroke(); }
    },
    drawScreen(G, ctx) {
      const s = G.gs, p = G.player, W = G.W, H = G.H, t = G.time;
      const L = [{ x: p.x, y: p.y, r: 300, k: 0.95 }, ...lights];
      for (const e of G.enemies) if (!e.dead && (e.type === 'lanternWisp' || e.type === 'jadeOrb')) L.push({ x: e.x, y: e.y, r: 130, h: 20, c: e.type === 'jadeOrb' ? 'rgba(120,255,190,.25)' : 'rgba(170,80,255,.25)' });
      if (G.clue && !G.clue.taken) L.push({ x: G.clue.x, y: G.clue.y, r: 140, c: 'rgba(255,220,120,.3)' });
      const fl = s.flash > 0 ? Math.min(1, s.flash / 0.2) : 0;
      VN.darkness(G, ctx, L, (G.r3on ? 0.34 : 0.62) * (1 - fl * 0.85));
      if (fl > 0) { ctx.fillStyle = `rgba(220,230,255,${fl * 0.35})`; ctx.fillRect(0, 0, W, H); }
      // mưa xiên
      ctx.strokeStyle = 'rgba(190,210,240,.32)'; ctx.lineWidth = 1;
      ctx.beginPath();
      const n = G.lowFx ? 70 : 140;
      for (let i = 0; i < n; i++) {
        const sp = 900 + (i % 5) * 120, x = ((i * 97.3 + t * sp * 0.35) % (W + 80)) - 40, y = ((i * 53.7 + t * sp) % (H + 60)) - 30;
        ctx.moveTo(x, y); ctx.lineTo(x - 6, y + 18);
      }
      ctx.stroke();
    },

    buildGround(g, w, h, rand) {
      // nền đất ẩm + cỏ
      g.fillStyle = '#2e3a2a'; g.fillRect(0, 0, w, h);
      GK.patches(g, rand, w, h, 240, ['rgba(60,80,50,.35)', 'rgba(20,28,18,.35)'], 40, 140);
      // nội thành: sân gạch Bát Tràng đỏ sẫm + lối đá
      g.fillStyle = '#4a3a30'; g.fillRect(120, 160, 3760, WALL.y0 - 160);
      GK.patches(g, rand, w, h, 0, [], 1);
      g.fillStyle = '#6a6458'; g.fillRect(COURT.x0, COURT.y0, COURT.x1 - COURT.x0, COURT.y1 - COURT.y0);
      g.strokeStyle = 'rgba(30,26,20,.35)'; g.lineWidth = 1;
      for (let y = COURT.y0; y < COURT.y1; y += 30) { g.beginPath(); g.moveTo(COURT.x0, y); g.lineTo(COURT.x1, y); g.stroke(); }
      for (let x = COURT.x0; x < COURT.x1; x += 60) { g.beginPath(); g.moveTo(x, COURT.y0); g.lineTo(x, COURT.y1); g.stroke(); }
      // hai bậc sân (Đại Triều Nghi chia 3 cấp)
      g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(COURT.x0, COURT.y0 + 160, COURT.x1 - COURT.x0, 8); g.fillRect(COURT.x0, COURT.y0 + 320, COURT.x1 - COURT.x0, 8);
      // đường thần đạo: Ngọ Môn → cầu Trung Đạo → sân → điện
      g.fillStyle = '#7a7466'; g.fillRect(1930, COURT.y1, 140, WALL.y0 - COURT.y1);
      g.fillStyle = '#8a3a2a'; g.fillRect(1900, 1380, 200, 240); // cầu Trung Đạo
      g.fillStyle = '#c8a028'; g.fillRect(1900, 1380, 200, 8); g.fillRect(1900, 1612, 200, 8);
      // hào + hồ: nước đêm
      const wt = (x0, y0, x1, y1) => { const wg = g.createLinearGradient(0, y0, 0, y1); wg.addColorStop(0, '#16283a'); wg.addColorStop(1, '#0c1824'); g.fillStyle = wg; g.fillRect(x0, y0, x1 - x0, y1 - y0); g.fillStyle = '#5a5246'; g.fillRect(x0 - 6, y0 - 6, x1 - x0 + 12, 6); g.fillRect(x0 - 6, y1, x1 - x0 + 12, 6); };
      wt(MOAT.x0, MOAT.y0, MOAT.x1, MOAT.y1);
      for (const [x0, y0, x1, y1] of PONDS) wt(x0, y0, x1, y1);
      // cầu qua hào
      for (const [a, b] of GATES) { g.fillStyle = '#6a6052'; g.fillRect(a, MOAT.y0 - 10, b - a, MOAT.y1 - MOAT.y0 + 20); g.fillStyle = '#4a4238'; g.fillRect(a, MOAT.y0 - 10, 6, MOAT.y1 - MOAT.y0 + 20); g.fillRect(b - 6, MOAT.y0 - 10, 6, MOAT.y1 - MOAT.y0 + 20); }
      // đường ven sông
      g.fillStyle = '#3a3a3e'; g.fillRect(0, 2050, w, 290);
      g.strokeStyle = 'rgba(230,220,160,.35)'; g.lineWidth = 3; g.setLineDash([30, 26]); g.beginPath(); g.moveTo(0, 2195); g.lineTo(w, 2195); g.stroke(); g.setLineDash([]);
      // Kỳ Đài: 3 tầng bệ
      for (let i = 0; i < 3; i++) { const r = 120 - i * 28; g.fillStyle = ['#5a5046', '#6a6052', '#7a7062'][i]; g.fillRect(KYDAI.x - r, KYDAI.y - 30 - r * 0.55, r * 2, r * 1.1 + 40); }
      // sông Hương
      const rg = g.createLinearGradient(0, RIV.y0, 0, RIV.y1); rg.addColorStop(0, '#1a3048'); rg.addColorStop(1, '#0e1e30');
      g.fillStyle = rg; g.fillRect(0, RIV.y0, w, RIV.y1 - RIV.y0);
      g.fillStyle = 'rgba(255,200,120,.08)'; for (let i = 0; i < 60; i++) g.fillRect(rand() * w, RIV.y0 + rand() * (RIV.y1 - RIV.y0), 40 + rand() * 60, 2);
      g.fillStyle = '#4a4a44'; g.fillRect(0, RIV.y0 - 10, w, 10); g.fillRect(0, RIV.y1, w, 10);
      // cầu Trường Tiền: mặt cầu
      g.fillStyle = '#5a5a60'; g.fillRect(BRIDGE.x0, RIV.y0 - 20, BRIDGE.x1 - BRIDGE.x0, RIV.y1 - RIV.y0 + 40);
      g.strokeStyle = 'rgba(255,255,255,.25)'; g.lineWidth = 2; g.setLineDash([20, 16]); g.beginPath(); g.moveTo((BRIDGE.x0 + BRIDGE.x1) / 2, RIV.y0); g.lineTo((BRIDGE.x0 + BRIDGE.x1) / 2, RIV.y1); g.stroke(); g.setLineDash([]);
      // bờ Nam: phố
      g.fillStyle = '#34343a'; g.fillRect(0, RIV.y1 + 10, w, h - RIV.y1);
      // sân chùa Thiên Mụ
      g.fillStyle = '#5a5046'; g.fillRect(THIENMU.x - 140, THIENMU.y - 120, 280, 260);
      GK.vignette(g, w, h, 0.5);
    },

    /* ---------- 3D ---------- */
    models3d: {
      palaceGuard: (K) => ({
        base: 21,
        build() {
          return K.buildZombie({ skin: 0x8a9a74, cloth: 0x2a2420, shirt: 0x8a1a14, arms: 0.9, hunch: -0.15,
            extra: (KK, torso, head) => {
              const T = KK.T;
              const hat = new T.Mesh(KK.G3('nonchop', () => new T.ConeGeometry(9, 8, 14)), KK.std(0x2a2420, { rough: 0.8 })); hat.position.y = 6; head.add(hat);
              head.add(KK.mesh(KK.sph(1.6, 6), KK.std(0xd8a828, { metal: 0.6 }), 0, 10.5, 0));
              torso.add(KK.mesh(KK.box(2, 14, 12), KK.std(0xd8a828, { metal: 0.4, rough: 0.5 }), 6.5, 10, 0));
              const sp = KK.mesh(KK.cyl(0.9, 0.9, 56, 5), KK.std(0x5a3a1a), 10, 14, 8); sp.rotation.z = Math.PI / 2 - 0.2; torso.add(sp);
              const tip = new T.Mesh(KK.G3('spear', () => new T.ConeGeometry(2.2, 9, 6)), KK.std(0xc8ccd0, { metal: 0.8, rough: 0.3 })); tip.position.set(38, 20, 8); tip.rotation.z = -Math.PI / 2 - 0.2; torso.add(tip);
            } });
        },
        anim(e, m, G) { K.animZombie(e, m, G); if (e.state === 'swing') m.userData.torso.rotation.y = -0.8; else if (e.state === 'wind') m.userData.torso.rotation.y = 0.6; else m.userData.torso.rotation.y = 0; },
      }),
      stormCaller: (K) => ({
        base: 17,
        build() {
          return K.buildZombie({ skin: 0x7a8aa0, cloth: 0x1e2238, shirt: 0x2e3458, eye: 0x9ab8ff, pustule: false, arms: 1.0,
            extra: (KK, torso, head, g) => {
              const T = KK.T;
              const hood = KK.mesh(KK.sph(7.4, 12), KK.std(0x1e2238, { rough: 1 }), -1, 1, 0); hood.scale.set(1.1, 1.15, 1.05); head.add(hood);
              const st = KK.mesh(KK.cyl(0.8, 0.8, 44, 5), KK.std(0x6a5a48), 8, 14, 9); torso.add(st);
              const orb = KK.mesh(KK.sph(3, 8), KK.glowMat(0x9ab8ff, 2.6), 8, 37, 9, false); torso.add(orb);
              g.userData.orb = orb;
            } });
        },
        anim(e, m, G) { K.animZombie(e, m, G); const o = m.userData.orb; if (o) o.scale.setScalar(e.state === 'aim' ? 1.6 + Math.random() * 0.4 : 1); },
      }),
      jadeOrb: (K) => ({
        base: 16,
        build() { const T = K.T, g = new T.Group(); const s = K.mesh(K.sph(14, 16), K.std(0x3ac88a, { own: true, emissive: 0x1a8a5a, ei: 1.2, metal: 0.2, rough: 0.15 }), 0, 0, 0); g.add(s); g.add(K.glowSprite(0x8affc8, 80, 0.6)); g.userData = { s, h: 20 }; return g; },
        anim(e, m, G) { m.userData.s.rotation.y = G.time * 2; m.position.y = 34 + Math.sin(G.time * 3 + e.ang) * 4; },
      }),
      nghe: (K) => ({
        base: 54,
        build() {
          const T = K.T, g = new T.Group(), stone = K.std(0x8a8a72, { own: true, flat: true, rough: 0.95 }), dark = K.std(0x5a5a4a, { flat: true });
          const body = K.mesh(K.bumpy('nghebody', new T.SphereGeometry(30, 14, 10), 1.6, 1.4), stone, -6, 34, 0); body.scale.set(1.5, 0.8, 0.9); g.add(body);
          const legs = [];
          for (const [x, z] of [[24, -20], [24, 20], [-30, -20], [-30, 20]]) { const l = K.mesh(K.cyl(7, 8, 30, 7), dark, x, 15, z); g.add(l); legs.push(l); g.add(K.mesh(K.sph(8, 8), dark, x + 3, 3, z)); }
          const head = new T.Group(); head.position.set(46, 54, 0); g.add(head);
          for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; head.add(K.mesh(K.sph(7, 8), dark, -6, Math.sin(a) * 18, Math.cos(a) * 18)); }
          const sk = K.mesh(K.sph(17, 12), stone, 0, 0, 0); sk.scale.set(1.1, 1, 1); head.add(sk);
          head.add(K.mesh(K.box(14, 10, 22), dark, 15, -6, 0));
          const pearl = K.mesh(K.sph(5, 10), K.glowMat(0xd8e8c0, 1.6), 22, -5, 0, false); head.add(pearl);
          for (const z of [-8, 8]) head.add(K.mesh(K.sph(3.4, 8), K.glowMat(0xffcc3a, 2.6), 12, 7, z, false));
          for (let i = 0; i < 4; i++) g.add(K.mesh(K.sph(8 - i, 8), stone, -54 - i * 7, 44 + Math.sin(i) * 6, 0));
          for (let i = 0; i < 5; i++) g.add(K.mesh(K.sph(2.6, 6), K.glowMat(0x9aff6a, 1.6), -30 + i * 12, 58, (i % 2 ? 8 : -8), false));
          g.userData = { legs, head, pearl, h: 80 }; return g;
        },
        anim(e, m, G) {
          const d = m.userData, mv = Math.hypot(e.vx, e.vy) > 20;
          d.legs.forEach((l, i) => { l.rotation.z = mv ? Math.sin(G.time * 9 + i * 1.6) * 0.35 : 0; });
          d.head.rotation.z = e.state === 'crouch' || e.state === 'shardAim' ? -0.3 : e.state === 'roar' ? 0.35 : 0;
          d.pearl.material.color.setHex(e.phase >= 2 ? 0x8affc8 : 0xd8e8c0);
          m.position.y = e.airborne ? Math.sin((1 - e.st / 0.55) * Math.PI) * 60 : 0;
        },
      }),
    },
    props3d: {
      hueWater: (o, K) => new K.T.Group(),
      citadelWall: (o, K) => {
        const T = K.T, g = new T.Group();
        g.add(K.mesh(K.box(o.w, 46, o.h), K.std(0x4a4238, { rough: 1 }), 0, 23, 0));
        g.add(K.mesh(K.box(o.w, 6, o.h * 0.25), K.std(0x5a5246), 0, 49, -o.hh * 0.7));
        for (let x = -o.hw + 20; x < o.hw - 10; x += 60) g.add(K.mesh(K.box(14, 10, 10), K.std(0x4a4238), x, 52, o.hh - 6));
        return g;
      },
      ngoMon: (o, K) => {
        const T = K.T, g = new T.Group(), roof = K.std(0xe0a828, { own: true, transparent: true, rough: 0.5, metal: 0.2 });
        g.add(K.mesh(K.box(o.w, 70, o.h), K.std(0x5a4e40, { rough: 1 }), 0, 35, 0));
        for (let i = 0; i < 6; i++) g.add(K.mesh(K.cyl(2.6, 2.6, 30, 6), K.std(0x9a1a14), -o.hw + 20 + i * (o.w - 40) / 5, 85, o.hh - 20));
        const r1 = K.mesh(K.box(o.w + 20, 8, o.h * 0.85), roof, 0, 104, 0); g.add(r1);
        const r2 = K.mesh(K.box(o.w * 0.7, 8, o.h * 0.6), roof, 0, 124, 0); g.add(r2);
        g.add(K.mesh(K.box(o.w * 0.6, 4, 4), K.std(0x5a8a6a), 0, 130, 0));
        g.userData.canopy = [roof]; return g;
      },
      palace: (o, K) => {
        const T = K.T, g = new T.Group(), roof = K.std(0xe0a828, { own: true, transparent: true, rough: 0.5, metal: 0.2 }), H = o.tall * 0.55;
        g.add(K.mesh(K.box(o.w + 40, 10, o.h + 30), K.std(0x6a5a48), 0, 5, 0));
        g.add(K.mesh(K.box(o.w - 20, H, o.h - 20), K.std(0x7a1a12, { rough: 0.8 }), 0, 10 + H / 2, 0));
        const pil = K.std(0xc8282a, { rough: 0.6 });
        for (let i = 0; i < 10; i++) for (const z of [-1, 1]) g.add(K.mesh(K.cyl(3.2, 3.2, H, 8), pil, -o.hw + 10 + i * (o.w - 20) / 9, 10 + H / 2, z * (o.hh - 4)));
        for (let k = 0; k < (o.tiers || 2); k++) { const r = K.mesh(K.box((o.w + 30) * (1 - k * 0.2), 8, (o.h + 30) * (1 - k * 0.25)), roof, 0, 14 + H + k * 22, 0); g.add(r); }
        g.add(K.mesh(K.box(o.w * 0.5, 5, 5), K.std(0x5a8a6a), 0, 22 + H + ((o.tiers || 2) - 1) * 22, 0));
        g.userData.canopy = [roof]; return g;
      },
      hall: (o, K) => {
        const T = K.T, g = new T.Group(), H = (o.tall || 60) * 0.6, roof = K.std(o.yellow ? 0xe0a828 : 0x8a4a34, { own: true, transparent: true, rough: 0.7 });
        g.add(K.mesh(K.box(o.w - 8, H, o.h - 8), K.std(0x6a2a1e, { rough: 0.85 }), 0, H / 2, 0));
        g.add(K.mesh(K.box(o.w + 12, 7, o.h + 12), roof, 0, H + 4, 0));
        if ((o.tiers || 1) > 1) g.add(K.mesh(K.box(o.w * 0.7, 7, o.h * 0.7), roof, 0, H + 20, 0));
        g.userData.canopy = [roof]; return g;
      },
      thienMu: (o, K) => {
        const T = K.T, g = new T.Group(), c1 = K.std(0xd8c8a8, { own: true, transparent: true, rough: 0.9 }), c2 = K.std(0x6a5a48, { own: true, transparent: true });
        for (let i = 0; i < 7; i++) {
          const r = 34 - i * 3.6, y = i * 30;
          const b = new T.Mesh(K.G3('oct', () => new T.CylinderGeometry(1, 1, 1, 8)), c1); b.scale.set(r, 26, r); b.position.y = y + 13; g.add(b);
          const e = new T.Mesh(K.G3('oct', () => new T.CylinderGeometry(1, 1, 1, 8)), c2); e.scale.set(r + 6, 4, r + 6); e.position.y = y + 28; g.add(e);
        }
        const sp = new T.Mesh(K.G3('tmsp', () => new T.ConeGeometry(6, 26, 8)), K.std(0x8a7048)); sp.position.y = 223; g.add(sp);
        g.userData.canopy = [c1, c2]; return g;
      },
      flagpole: (o, K) => {
        const T = K.T, g = new T.Group();
        g.add(K.mesh(K.cyl(2.4, 3.2, 300, 8), K.std(0x9a9a9a, { metal: 0.6 }), 0, 150, 0));
        const flag = K.mesh(K.box(64, 40, 1), K.std(0xd8261e, { emissive: 0x300404 }), 32, 280, 0); g.add(flag);
        g.add(K.mesh(K.sph(7, 5), K.std(0xf2d02a, { emissive: 0x403000 }), 30, 280, 1));
        g.userData.anim = null; return g;
      },
      urn: (o, K) => {
        const T = K.T, g = new T.Group(), br = K.std(0xa88a48, { metal: 0.35, rough: 0.45, emissive: 0x2a1e08 });
        const b = K.mesh(K.sph(o.r, 14), br, 0, o.r * 1.2, 0); b.scale.y = 0.8; g.add(b);
        g.add(K.mesh(K.cyl(o.r * 0.8, o.r * 0.9, 6, 14), br, 0, o.r * 1.9, 0));
        for (const a of [0, 2.1, 4.2]) g.add(K.mesh(K.cyl(2.2, 2.6, o.r * 0.7, 6), br, Math.cos(a) * o.r * 0.6, o.r * 0.3, Math.sin(a) * o.r * 0.6));
        for (const sd of [-1, 1]) { const h = new T.Mesh(K.G3('urnh', () => new T.TorusGeometry(4, 1.2, 6, 10, Math.PI)), br); h.position.set(sd * o.r * 0.6, o.r * 2.1, 0); g.add(h); }
        return g;
      },
      cungLamp: (o, K) => {
        const T = K.T, g = new T.Group();
        g.add(K.mesh(K.cyl(1.6, 2, 46, 6), K.std(0x3a2a1a), 0, 23, 0));
        const l = K.mesh(K.sph(7, 10), K.glowMat(0xe8b030, 2.4), 0, 52, 0, false); l.scale.y = 1.3; g.add(l);
        const sp = K.glowSprite(0xffb050, 60, 0.6); sp.position.y = 52; g.add(sp);
        return g;
      },
      goatSeal: (o, K) => {
        const T = K.T, g = new T.Group(), mt = K.std(0x2a1a14, { own: true });
        g.add(K.mesh(K.box(24, 52, 24), mt, 0, 26, 0), K.mesh(K.box(18, 40, 1), K.std(0xc8202a, { emissive: 0x400808 }), 0, 28, 12.5));
        g.add(K.glowSprite(0xff4a4a, 70, 0.45)); g.children[g.children.length - 1].position.y = 30;
        g.userData.flashMat = mt; return g;
      },
    },
    actors3d: Object.assign({
      dragonBoat: (a, K) => {
        const T = K.T, g = new T.Group(), red = K.std(0xa8201a, { rough: 0.6 }), gold = K.std(0xd8a828, { metal: 0.5, rough: 0.4 });
        const hull = K.mesh(K.sph(1, 16), red, 0, 6, 0); hull.scale.set(90, 12, 22); g.add(hull);
        g.add(K.mesh(K.box(110, 22, 34), K.std(0x6a1a14), -8, 24, 0), K.mesh(K.box(118, 5, 40), gold, -8, 37, 0));
        const neck = K.mesh(K.cyl(5, 7, 40, 8), gold, 88, 26, 0); neck.rotation.z = -0.6; g.add(neck);
        const hd = K.mesh(K.sph(10, 10), gold, 102, 44, 0); hd.scale.set(1.4, 0.9, 0.8); g.add(hd);
        for (let i = 0; i < 4; i++) { const ln = K.mesh(K.sph(4, 8), K.glowMat(0xffa040, 2.2), -50 + i * 30, 46, 0, false); ln.scale.y = 1.3; g.add(ln); }
        g.rotation.y = -a.rot;
        g.userData.anim = (aa, m, G) => { m.position.y = Math.sin(G.time * 1.2 + aa.ph) * 1.5; };
        return g;
      },
      hueLights: (a, K) => {
        const T = K.T, g = new T.Group();
        const pls = [0xffb050, 0xffa040, 0xffc070, 0xff9a50].map((c) => { const L = new T.PointLight(c, 0, 320, 1.5); L.castShadow = false; g.add(L); return L; });
        g.userData.anim = (aa, m, G) => {
          const p = G.player, fl = G.gs.flash > 0 ? Math.min(1, G.gs.flash / 0.2) : 0;
          const near = LAMPS.map((L) => [L, (L[0] - p.x) ** 2 + (L[1] - p.y) ** 2]).sort((u, v) => u[1] - v[1]).slice(0, pls.length);
          near.forEach(([L], i) => { pls[i].position.set(L[0], 52, L[1]); pls[i].intensity = 1.6e4 * (0.9 + Math.sin(G.time * 6 + i) * 0.08); });
          m.position.set(0, 0, 0);
          if (MB.R3 && MB.R3.sun) MB.R3.sun.intensity = 0.85 + fl * 3;
        };
        return g;
      },
    }, MB.Story.actors3d),
  });
  // 2D: thuyền rồng trên sông Hương
  MB.Props.registerActor('dragonBoat', (ctx, a, G) => {
    const t = G.time;
    ctx.save(); ctx.translate(a.x, a.y + Math.sin(t * 1.2 + a.ph) * 1.5); ctx.rotate(a.rot);
    ctx.fillStyle = 'rgba(0,0,0,.3)'; U.ellipse(ctx, 8, 10, 96, 22); ctx.fill();
    ctx.fillStyle = '#a8201a'; ctx.beginPath(); ctx.moveTo(-92, 0); ctx.quadraticCurveTo(-70, -22, 0, -22); ctx.quadraticCurveTo(70, -22, 92, 0); ctx.quadraticCurveTo(70, 22, 0, 22); ctx.quadraticCurveTo(-70, 22, -92, 0); ctx.fill();
    ctx.fillStyle = '#6a1a14'; U.rr(ctx, -64, -16, 112, 32, 6); ctx.fill();
    ctx.fillStyle = '#d8a828'; ctx.fillRect(-64, -16, 112, 4); ctx.fillRect(-64, 12, 112, 4);
    // đầu rồng vàng
    ctx.fillStyle = '#d8a828'; ctx.beginPath(); ctx.moveTo(86, -8); ctx.quadraticCurveTo(118, -26, 122, 0); ctx.quadraticCurveTo(118, 26, 86, 8); ctx.fill();
    ctx.fillStyle = '#ff3a2a'; U.circle(ctx, 112, -6, 2.2); ctx.fill();
    for (let i = 0; i < 4; i++) VN.lantern(ctx, -50 + i * 30, -2, 6, '#ff9a3a', t + i, true);
    ctx.restore();
  });
  MB.Props.registerActor('hueLights', () => {});
})(window.MB);
