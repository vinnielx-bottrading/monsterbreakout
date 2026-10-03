/* Gate 18 — SÀI GÒN: Thành phố không ngủ (Màn 2 · Nguồn Gốc)
   Thắng cảnh: phố đi bộ Nguyễn Huệ, Trụ sở UBND Thành phố (tường vàng, tháp đồng hồ), chợ Bến Thành với tháp đồng hồ
   cổng Nam, Bưu điện Thành phố, tháp Bitexco có sân đỗ trực thăng, sông Sài Gòn + bến Bạch Đằng, Landmark 81 bên kia sông.
   Ban đêm rực đèn neon. Cơ chế: GIỜ CAO ĐIỂM — dòng xe máy tràn qua đường Lê Lợi theo đợt (còi + mặt đường chớp cam),
   tông trúng rất đau, cuốn bay quái; dụ boss nhảy xuống làn xe thì nó bị tông choáng.
   Dian đánh cùng. Lộ chuyện Dian giấu việc GS Ted còn sống → hai người chia tay sau trận.
   Quái mới: Ma Neon (dịch chuyển chớp nhoáng ra sau lưng), Trực Thăng Mini (bay, bắn loạt 3 viên).
   Boss: VẬT THỂ V-0 — bệnh nhân số 0 của virus: nhảy vồ, cánh tay đột biến quét, phun virus; giai đoạn 3 nổ vòng virus. */
'use strict';
(function (MB) {
  const U = MB.U, Ens = MB.Enemies, GK = MB.GK, VN = MB.VN;
  const WW = 4200, WH = 3000;
  const H3 = 0.45;
  const RIVER = { x0: 3550, x1: 3900 };
  const ROAD = { y: 2150, hw: 70, x0: 0, x1: RIVER.x0 };          // đường Lê Lợi (làn xe máy)
  const PLAZA = { x0: 1850, y0: 1350, x1: RIVER.x0 - 200, y1: 1950 }; // phố đi bộ Nguyễn Huệ
  const ARENA = { x: 2700, y: 1650 };
  const UBND = { x: 1660, y: 1650, w: 300, h: 420 };
  const BT = { x: 720, y: 2560, w: 440, h: 300 };                 // chợ Bến Thành
  const PO = { x: 660, y: 700, w: 420, h: 200 };                  // Bưu điện
  const BX = { x: 2900, y: 1000 };                                // Bitexco
  const LM = { x: 4060, y: 820 };                                 // Landmark 81 (bên kia sông)
  const NEON = ['#ff3ad8', '#3af0ff', '#ffd23a', '#7aff5a', '#ff5a3a', '#9a6aff'];

  /* ---------- vẽ 2D ---------- */
  MB.Props.register('sgWater', () => {});
  // UBND Thành phố: tường vàng, cột trắng, mái ngói đỏ, tháp đồng hồ giữa
  MB.Props.register('ubnd', (ctx, o) => {
    const x = o.x - o.hw, y = o.y - o.hh, H = 70 * H3;
    VN.shadowBox(ctx, x, y - H, o.w, o.h, 70, 0.3);
    ctx.fillStyle = '#f2d27a'; ctx.fillRect(x + o.w - H, y, H, o.h);
    ctx.fillStyle = '#fff6dc'; for (let i = 0; i < 9; i++) ctx.fillRect(x + o.w - H + 4, y + 16 + i * (o.h - 32) / 9, H - 8, 4);
  });
  VN.over.ubnd = (ctx, o, G) => {
    const x = o.x - o.hw, y = o.y - o.hh, H = 70 * H3;
    ctx.globalAlpha = VN.coverAlpha(G, x - 40, y - H - 60, x + o.w, y + o.h - H);
    ctx.fillStyle = '#b8462a'; ctx.fillRect(x, y - H, o.w - H + 4, o.h);
    ctx.fillStyle = '#9a3a22'; for (let i = 0; i < o.h; i += 10) ctx.fillRect(x, y - H + i, o.w - H + 4, 2);
    // tháp đồng hồ giữa
    const cx = x + o.w * 0.45, cy = o.y - H;
    ctx.fillStyle = '#f2d27a'; ctx.fillRect(cx - 26, cy - 40, 52, 80);
    ctx.fillStyle = '#8a3a22'; ctx.beginPath(); ctx.moveTo(cx - 32, cy - 40); ctx.lineTo(cx, cy - 78); ctx.lineTo(cx + 32, cy - 40); ctx.fill();
    ctx.fillStyle = '#fff'; U.circle(ctx, cx, cy - 14, 11); ctx.fill(); ctx.strokeStyle = '#2a2a2a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx, cy - 14); ctx.lineTo(cx, cy - 22); ctx.moveTo(cx, cy - 14); ctx.lineTo(cx + 6, cy - 12); ctx.stroke();
    ctx.fillStyle = '#c8302a'; ctx.fillRect(cx - 1, cy - 110, 2, 34); ctx.fillRect(cx + 1, cy - 110, 14, 9); ctx.fillStyle = '#ffd23a'; U.circle(ctx, cx + 8, cy - 105.5, 2); ctx.fill();
    ctx.globalAlpha = 1;
  };
  // chợ Bến Thành: tường kem, mái xám, tháp đồng hồ cổng Nam
  MB.Props.register('benThanh', (ctx, o) => {
    const x = o.x - o.hw, y = o.y - o.hh, H = 60 * H3;
    VN.shadowBox(ctx, x, y - H, o.w, o.h, 60, 0.3);
    ctx.fillStyle = '#e8dcc0'; ctx.fillRect(x, y + o.h - H, o.w, H);
    ctx.fillStyle = '#5a4a3a'; for (let i = 0; i < 10; i++) ctx.fillRect(x + 12 + i * (o.w - 24) / 10, y + o.h - H * 0.7, (o.w - 24) / 10 - 12, H * 0.6);
  });
  VN.over.benThanh = (ctx, o, G) => {
    const x = o.x - o.hw, y = o.y - o.hh, H = 60 * H3;
    ctx.globalAlpha = VN.coverAlpha(G, x, y - H - 90, x + o.w, y + o.h - H);
    ctx.fillStyle = '#7a7470'; ctx.fillRect(x - 4, y - H, o.w + 8, o.h);
    ctx.fillStyle = '#8a847e'; for (let i = 0; i < 6; i++) ctx.fillRect(x + i * o.w / 6 + 6, y - H + 6, o.w / 6 - 12, o.h - 12);
    // tháp đồng hồ cổng Nam
    const cx = o.x, cy = y + o.h - H;
    ctx.fillStyle = '#e8dcc0'; ctx.fillRect(cx - 34, cy - 100, 68, 100);
    ctx.fillStyle = '#7a7470'; ctx.fillRect(cx - 40, cy - 108, 80, 10);
    ctx.fillStyle = '#fff'; U.circle(ctx, cx, cy - 72, 16); ctx.fill(); ctx.strokeStyle = '#2a2a2a'; ctx.lineWidth = 2; U.circle(ctx, cx, cy - 72, 16); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, cy - 72); ctx.lineTo(cx, cy - 83); ctx.moveTo(cx, cy - 72); ctx.lineTo(cx + 8, cy - 70); ctx.stroke();
    ctx.fillStyle = '#c8302a'; ctx.font = '900 13px system-ui'; ctx.textAlign = 'center'; ctx.fillText('BẾN THÀNH', cx, cy - 34);
    ctx.globalAlpha = 1;
  };
  // Bưu điện Thành phố: vàng đất, vòm mái, đồng hồ
  MB.Props.register('postOffice', (ctx, o) => {
    const x = o.x - o.hw, y = o.y - o.hh, H = 60 * H3;
    VN.shadowBox(ctx, x, y - H, o.w, o.h, 60, 0.3);
    ctx.fillStyle = '#e0b46a'; ctx.fillRect(x, y + o.h - H, o.w, H);
    ctx.fillStyle = '#5a7a6a'; for (let i = 0; i < 11; i++) { const wx = x + 10 + i * (o.w - 20) / 11; ctx.fillRect(wx, y + o.h - H * 0.8, (o.w - 20) / 11 - 10, H * 0.65); ctx.beginPath(); ctx.arc(wx + ((o.w - 20) / 11 - 10) / 2, y + o.h - H * 0.8, ((o.w - 20) / 11 - 10) / 2, Math.PI, 0); ctx.fill(); }
  });
  VN.over.postOffice = (ctx, o, G) => {
    const x = o.x - o.hw, y = o.y - o.hh, H = 60 * H3;
    ctx.globalAlpha = VN.coverAlpha(G, x, y - H - 50, x + o.w, y + o.h - H);
    ctx.fillStyle = '#d8a858'; ctx.fillRect(x, y - H, o.w, o.h);
    ctx.fillStyle = '#5a6a6a'; ctx.fillRect(x + o.w * 0.3, y - H + 10, o.w * 0.4, o.h - 20);
    ctx.strokeStyle = '#7a8a8a'; ctx.lineWidth = 2; for (let i = 1; i < 8; i++) { ctx.beginPath(); ctx.moveTo(x + o.w * 0.3 + i * o.w * 0.05, y - H + 10); ctx.lineTo(x + o.w * 0.3 + i * o.w * 0.05, y - H + o.h - 10); ctx.stroke(); }
    ctx.fillStyle = '#e0b46a'; ctx.fillRect(o.x - 40, y - H + o.h - 40, 80, 36);
    ctx.fillStyle = '#fff'; U.circle(ctx, o.x, y - H + o.h - 24, 11); ctx.fill(); ctx.strokeStyle = '#2a2a2a'; ctx.lineWidth = 1.5; U.circle(ctx, o.x, y - H + o.h - 24, 11); ctx.stroke();
    ctx.globalAlpha = 1;
  };
  // tháp cao tầng: Bitexco (búp sen, sân đỗ trực thăng), Landmark 81 (bậc thang thu nhỏ dần)
  MB.Props.register('sgTower', (ctx, o) => {
    const H = o.tall * H3;
    ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.moveTo(o.x - o.hw, o.y); ctx.lineTo(o.x + o.hw, o.y); ctx.lineTo(o.x + o.hw + H * 0.6, o.y + H * 0.3); ctx.lineTo(o.x - o.hw + H * 0.6, o.y + H * 0.3); ctx.fill();
    ctx.fillStyle = '#3a4a5a'; ctx.fillRect(o.x - o.hw, o.y - o.hh, o.w, o.h);
  });
  VN.over.sgTower = (ctx, o, G) => {
    const H = o.tall * H3, x = o.x, y = o.y + o.hh, t = G.time;
    ctx.globalAlpha = VN.coverAlpha(G, x - o.hw - 20, y - H - 30, x + o.hw + 20, y) * 0.92;
    if (o.style === 'bitexco') {
      const gr = ctx.createLinearGradient(x - o.hw, 0, x + o.hw, 0); gr.addColorStop(0, '#5a7a9a'); gr.addColorStop(0.5, '#a8c8e8'); gr.addColorStop(1, '#4a6a8a');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(x - o.hw, y); ctx.quadraticCurveTo(x - o.hw * 1.2, y - H * 0.6, x - o.hw * 0.2, y - H); ctx.lineTo(x + o.hw * 0.2, y - H); ctx.quadraticCurveTo(x + o.hw * 1.2, y - H * 0.6, x + o.hw, y); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 1; for (let i = 1; i < 14; i++) { const yy = y - H * i / 14; ctx.beginPath(); ctx.moveTo(x - o.hw, yy); ctx.lineTo(x + o.hw, yy); ctx.stroke(); }
      ctx.fillStyle = '#2a3a4a'; U.ellipse(ctx, x + o.hw * 0.9, y - H * 0.62, o.hw * 0.7, 10); ctx.fill();
      ctx.strokeStyle = '#ffd23a'; ctx.lineWidth = 2; U.ellipse(ctx, x + o.hw * 0.9, y - H * 0.62, o.hw * 0.45, 6); ctx.stroke();
      ctx.fillStyle = `rgba(255,60,60,${0.5 + Math.sin(t * 4) * 0.5})`; U.circle(ctx, x, y - H - 4, 3); ctx.fill();
    } else {
      const steps = 6;
      for (let i = 0; i < steps; i++) {
        const w = o.w * (1 - i * 0.12), y0 = y - H * i / steps, y1 = y - H * (i + 1) / steps;
        ctx.fillStyle = i % 2 ? '#7a9ab8' : '#8aaac8'; ctx.fillRect(x - w / 2, y1, w, y0 - y1);
        ctx.fillStyle = 'rgba(255,240,200,.45)'; for (let k = 0; k < 6; k++) ctx.fillRect(x - w / 2 + 4 + k * (w - 8) / 6, y1 + 6, (w - 8) / 6 - 4, 3);
      }
      ctx.fillStyle = '#a8c8e8'; ctx.beginPath(); ctx.moveTo(x - o.w * 0.2, y - H); ctx.lineTo(x, y - H - 50); ctx.lineTo(x + o.w * 0.2, y - H); ctx.fill();
      ctx.fillStyle = `rgba(255,60,60,${0.5 + Math.sin(t * 3) * 0.5})`; U.circle(ctx, x, y - H - 52, 3); ctx.fill();
    }
    ctx.globalAlpha = 1;
  };
  // biển neon dựng đứng trên vỉa hè
  MB.Props.register('neonSign', (ctx, o, t) => {
    ctx.fillStyle = '#1a1a22'; U.circle(ctx, o.x, o.y, 5); ctx.fill();
    ctx.strokeStyle = '#2a2a32'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(o.x, o.y - 30); ctx.stroke();
    const fl = Math.sin(t * 3 + o.x) > -0.9 ? 1 : 0.3;
    ctx.fillStyle = '#100810'; U.rr(ctx, o.x - 26, o.y - 50, 52, 18, 4); ctx.fill();
    ctx.strokeStyle = o.c; ctx.globalAlpha = fl; ctx.lineWidth = 2; U.rr(ctx, o.x - 26, o.y - 50, 52, 18, 4); ctx.stroke();
    ctx.fillStyle = o.c; ctx.font = '900 9px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(o.txt, o.x, o.y - 41); ctx.globalAlpha = 1;
  });

  /* ---------- quái mới ---------- */
  Ens.register('neonGhoul', Ens.make({
    name: 'Ma Neon', r: 15, hp: 115, speed: 150, dmg: 20, score: 170, blood: '#3a0a3a', gore: '#ff6ae8', knockMul: 0.9,
    init(e) { e.neon = NEON[(Math.random() * 3) | 0]; },
    draw(ctx, e, G) {
      const t = G.time, w = Math.sin(t * 10 + e.t) * 4;
      ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.face || 0); ctx.globalAlpha = e.alpha == null ? 1 : e.alpha;
      ctx.fillStyle = 'rgba(0,0,0,.25)'; U.ellipse(ctx, 3, 5, 18, 12); ctx.fill();
      ctx.strokeStyle = e.neon; ctx.lineWidth = 2; ctx.shadowColor = e.neon; ctx.shadowBlur = 12;
      ctx.fillStyle = '#2a1a2a'; U.ellipse(ctx, 0, 0, 13, 15); ctx.fill(); ctx.stroke();
      ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(4, -10); ctx.lineTo(20 + w, -14); ctx.moveTo(4, 10); ctx.lineTo(20 - w, 14); ctx.stroke();
      ctx.fillStyle = '#3a2a3a'; U.circle(ctx, 6, 0, 8); ctx.fill();
      ctx.fillStyle = e.neon; U.circle(ctx, 10, -3, 2); ctx.fill(); U.circle(ctx, 10, 3, 2); ctx.fill();
      ctx.restore();
    },
  }, Ens.AI.blinker({ color: '#ff3ad8', ghost: 0.85 })));

  Ens.register('heliDrone', Ens.make({
    name: 'Trực Thăng Mini', r: 16, hp: 95, speed: 140, dmg: 12, score: 180, fly: true, blood: '#1a1a1a', gore: '#ffb84a', knockMul: 0.8,
    draw(ctx, e, G) {
      const t = G.time, aim = e.state === 'aim';
      ctx.save(); ctx.translate(e.x, e.y);
      ctx.fillStyle = 'rgba(0,0,0,.2)'; U.ellipse(ctx, 10, 22, 16, 7); ctx.fill();
      ctx.rotate(e.face || 0);
      ctx.fillStyle = '#2a2a30'; U.ellipse(ctx, 0, 0, 16, 9); ctx.fill(); ctx.fillRect(-26, -2, 14, 4);
      ctx.fillStyle = '#7ab0d8'; U.ellipse(ctx, 8, 0, 6, 5); ctx.fill();
      ctx.fillStyle = '#c83a3a'; ctx.fillRect(-28, -5, 4, 10);
      ctx.strokeStyle = 'rgba(220,220,230,.55)'; ctx.lineWidth = 2.5; const a = t * 40;
      ctx.beginPath(); ctx.moveTo(Math.cos(a) * 22, Math.sin(a) * 22); ctx.lineTo(-Math.cos(a) * 22, -Math.sin(a) * 22); ctx.moveTo(Math.cos(a + 1.57) * 22, Math.sin(a + 1.57) * 22); ctx.lineTo(-Math.cos(a + 1.57) * 22, -Math.sin(a + 1.57) * 22); ctx.stroke();
      ctx.fillStyle = aim ? '#ff3a3a' : `rgba(255,60,60,${0.4 + Math.sin(t * 8) * 0.4})`; U.circle(ctx, 16, 0, 2.5); ctx.fill();
      ctx.restore();
    },
  }, Ens.AI.shooter({ cd: [2.4, 3.4], min: 200, max: 480, aim: 0.6, lineLen: 460, wig: { f: 2, a: 0.5 },
    shot: (e, G, a) => { MB.Audio.play('shot_beam'); for (let i = 0; i < 3; i++) setTimeout(() => { if (!e.dead) G.enemyShot({ x: e.x, y: e.y, a: a + U.rnd(-0.05, 0.05), speed: 560, r: 6, dmg: 9, color: '#ffb84a', owner: e }); }, i * 110); } })));

  /* ---------- BOSS: VẬT THỂ V-0 ---------- */
  Ens.register('patientZero', {
    name: 'Vật Thể V-0', r: 52, hp: 18500, speed: 120, dmg: 28, score: 0, boss: true, knockMul: 0, blood: '#1a3a10', gore: '#9aff5a',
    init(e) { e.phase = 1; e.state = 'stalk'; e.leapT = 3; e.spitT = 2; e.sweepT = 4.5; e.callT = 6; e.trailT = 0; },
    update(e, G, dt) {
      const p = G.player, k = e.hp / e.maxHp, ph = k > 0.66 ? 1 : k > 0.33 ? 2 : 3, d = Ens.distPlayer(e, G);
      if (ph > e.phase) {
        e.phase = ph; G.shake(14); MB.Audio.play('roar');
        G.banner(`PHASE ${ph}`, ph === 2 ? 'V-0 gọi bầy Ma Neon — vết chân để lại virus' : 'V-0 biến dạng — mỗi cú tiếp đất nổ vòng virus!', 2);
      }
      if (ph >= 2) {
        e.trailT -= dt; if (e.trailT <= 0 && Math.hypot(e.vx, e.vy) > 30) { e.trailT = 0.9; G.addHazard({ kind: 'virus', x: e.x, y: e.y, r: 46, dps: 9, life: 5 }); }
        e.callT -= dt; if (e.callT <= 0) { e.callT = 14; for (let i = 0; i < 2 + ph; i++) { const a = U.rnd(0, U.TAU); G.spawnEnemyAt('neonGhoul', e.x + Math.cos(a) * 140, e.y + Math.sin(a) * 140, { extra: true }); } MB.Audio.play('growl'); }
      }
      if (e.state === 'stalk') {
        Ens.steer(e, G, p.x, p.y, e.speed * (ph === 3 ? 1.25 : 1), dt);
        e.leapT -= dt; e.spitT -= dt; e.sweepT -= dt;
        if (e.sweepT <= 0 && d < 190) { e.state = 'sweepAim'; e.st = 0.6; e.lock = Ens.toPlayer(e, G); MB.Audio.play('growl'); }
        else if (e.leapT <= 0 && d > 150 && d < 700) { e.state = 'crouch'; e.st = 0.6; e.tx = p.x + p.vx * 0.3; e.ty = p.y + p.vy * 0.3; MB.Audio.play('growl'); }
        else if (e.spitT <= 0 && d < 600) { e.state = 'spitAim'; e.st = 0.5; e.lock = Ens.toPlayer(e, G); e.volley = ph === 1 ? 2 : 3; }
      } else if (e.state === 'crouch') {
        Ens.stop(e, dt, 14); e.st -= dt; e.face = Math.atan2(e.ty - e.y, e.tx - e.x);
        if (e.st <= 0) { e.state = 'air'; e.st = 0.6; e.airborne = true; e.fx0 = e.x; e.fy0 = e.y; G.telegraphCircle(e.tx, e.ty, 130, 0.6, null, 'rgba(120,255,90,.16)'); }
      } else if (e.state === 'air') {
        e.st -= dt; const kk = 1 - e.st / 0.6;
        e.x = U.lerp(e.fx0, e.tx, kk); e.y = U.lerp(e.fy0, e.ty, kk); e.vx = e.vy = 0;
        if (e.st <= 0) {
          e.airborne = false; e.state = 'stalk'; e.leapT = ph === 1 ? 5 : ph === 2 ? 4 : 3;
          G.explosion(e.x, e.y, 130, 0, { player: 28, knock: 320, color: '#9aff5a', ring: '150,255,100', obstacles: false, enemies: false });
          if (ph >= 2) G.addHazard({ kind: 'virus', x: e.x, y: e.y, r: 90, dps: 11, life: 6 });
          if (ph === 3) for (let i = 0; i < 16; i++) { const a = i / 16 * U.TAU; G.enemyShot({ x: e.x + Math.cos(a) * 50, y: e.y + Math.sin(a) * 50, a, speed: 300, r: 9, dmg: 11, color: '#9aff5a', owner: e, life: 2.4 }); }
        }
      } else if (e.state === 'spitAim') {
        Ens.stop(e, dt, 14); e.st -= dt; e.lock += U.angDiff(e.lock, Ens.toPlayer(e, G)) * Math.min(1, dt * 3); e.face = e.lock;
        if (e.st <= 0) {
          for (let i = -3; i <= 3; i++) G.enemyShot({ x: e.x + Math.cos(e.lock) * 50, y: e.y + Math.sin(e.lock) * 50, a: e.lock + i * 0.12, speed: 400, r: 9, dmg: 12, color: '#9aff5a', owner: e, life: 1.8 });
          MB.Audio.play('spit'); e.volley--;
          if (e.volley > 0) e.st = 0.35; else { e.state = 'stalk'; e.spitT = ph === 1 ? 3.6 : 2.8; }
        }
      } else if (e.state === 'sweepAim') {
        Ens.stop(e, dt, 14); e.st -= dt; e.face = e.lock;
        if (e.st <= 0) {
          const a = Ens.toPlayer(e, G);
          if (d < 210 && Math.abs(U.angDiff(e.lock, a)) < 1.2) G.hurtPlayer(30, e);
          G.shake(8); MB.Audio.play('break');
          for (let i = 0; i < 12; i++) { const aa = e.lock + U.rnd(-1.2, 1.2); G.particle({ x: e.x + Math.cos(aa) * 150, y: e.y + Math.sin(aa) * 150, vx: Math.cos(aa) * 120, vy: Math.sin(aa) * 120, life: 0.4, color: '#9aff5a', r: 3 }); }
          e.state = 'stalk'; e.sweepT = ph === 3 ? 2.6 : 3.6;
        }
      }
    },
    tele(ctx, e, G) {
      if (e.state === 'crouch') G.drawTelegraphLine(ctx, e.x, e.y, Math.atan2(e.ty - e.y, e.tx - e.x), U.dist(e.x, e.y, e.tx, e.ty), 1 - e.st / 0.6);
      if (e.state === 'spitAim') { const k = 1 - e.st / 0.5; ctx.fillStyle = `rgba(150,255,90,${0.08 + k * 0.18})`; ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.arc(e.x, e.y, 500, e.lock - 0.4, e.lock + 0.4); ctx.closePath(); ctx.fill(); }
      if (e.state === 'sweepAim') { const k = 1 - e.st / 0.6; ctx.fillStyle = `rgba(255,70,70,${0.12 + k * 0.25})`; ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.arc(e.x, e.y, 210, e.lock - 1.2, e.lock + 1.2); ctx.closePath(); ctx.fill(); }
    },
    draw(ctx, e, G) {
      const t = G.time, mv = Math.hypot(e.vx, e.vy) > 20, walk = mv ? Math.sin(t * 8) : 0;
      const lift = e.airborne ? Math.sin((1 - e.st / 0.6) * Math.PI) : 0;
      ctx.fillStyle = 'rgba(0,0,0,.35)'; U.ellipse(ctx, e.x + 8, e.y + 14, 54, 30); ctx.fill();
      ctx.save(); ctx.translate(e.x, e.y - lift * 60); ctx.rotate(e.face || 0); ctx.scale(1 + lift * 0.2, 1 + lift * 0.2);
      // chân
      ctx.fillStyle = '#6a7a62'; U.ellipse(ctx, -14 + walk * 8, -20, 14, 10); ctx.fill(); U.ellipse(ctx, -14 - walk * 8, 20, 14, 10); ctx.fill();
      // thân phình, gân virus
      const gr = ctx.createRadialGradient(-6, -8, 6, 0, 0, 52); gr.addColorStop(0, '#c8d0b8'); gr.addColorStop(0.7, '#8a9880'); gr.addColorStop(1, '#4a5a42');
      ctx.fillStyle = gr; U.ellipse(ctx, 0, 0, 40, 46); ctx.fill();
      ctx.strokeStyle = '#7aff4a'; ctx.lineWidth = 2; ctx.shadowColor = '#7aff4a'; ctx.shadowBlur = 8;
      for (let i = 0; i < 7; i++) { const a = i * 0.9; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(Math.cos(a) * 20, Math.sin(a) * 26 + 6, Math.cos(a + 0.3) * 36, Math.sin(a + 0.3) * 40); ctx.stroke(); }
      ctx.shadowBlur = 0;
      // tay đột biến (phải) to như càng, tay trái nhỏ
      const sw = e.state === 'sweepAim' ? -0.8 * (1 - e.st / 0.6) : 0;
      ctx.save(); ctx.rotate(0.9 + sw); ctx.fillStyle = '#7a8a6a'; U.rr(ctx, 10, -12, 70, 26, 12); ctx.fill();
      ctx.fillStyle = '#4a5a3a'; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(76, -10 + i * 7); ctx.lineTo(96, -14 + i * 9); ctx.lineTo(78, -6 + i * 7); ctx.fill(); }
      ctx.restore();
      ctx.fillStyle = '#8a9880'; U.rr(ctx, 4, -44, 26, 12, 6); ctx.fill();
      // đầu + lõi phát sáng
      ctx.fillStyle = '#a8b098'; U.circle(ctx, 22, 0, 18); ctx.fill();
      ctx.fillStyle = e.enrageT > 0 ? '#ff3a3a' : '#c8ff5a'; U.circle(ctx, 32, -6, 3.5); ctx.fill(); U.circle(ctx, 32, 6, 3.5); ctx.fill();
      const pulse = 0.6 + Math.sin(t * 5) * 0.4;
      ctx.fillStyle = `rgba(150,255,90,${pulse})`; U.circle(ctx, -6, 0, 11); ctx.fill();
      ctx.fillStyle = '#e8ffd0'; ctx.font = '900 9px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('V-0', -6, 0);
      ctx.restore();
    },
  });

  /* ---------- bản đồ ---------- */
  const rng = U.seeded(1818);
  const obstacles = [];
  obstacles.push({ kind: 'sgWater', shape: 'box', x: (RIVER.x0 + RIVER.x1) / 2, y: WH / 2, w: RIVER.x1 - RIVER.x0, h: WH, rot: 0, noShot: true, water: true });
  obstacles.push({ kind: 'ubnd', shape: 'box', x: UBND.x, y: UBND.y, w: UBND.w, h: UBND.h, rot: 0, tall: 70 });
  obstacles.push({ kind: 'benThanh', shape: 'box', x: BT.x, y: BT.y, w: BT.w, h: BT.h, rot: 0, tall: 60 });
  obstacles.push({ kind: 'postOffice', shape: 'box', x: PO.x, y: PO.y, w: PO.w, h: PO.h, rot: 0, tall: 60 });
  obstacles.push({ kind: 'sgTower', shape: 'box', x: BX.x, y: BX.y, w: 150, h: 150, rot: 0, tall: 300, style: 'bitexco' });
  obstacles.push({ kind: 'sgTower', shape: 'box', x: LM.x, y: LM.y, w: 170, h: 170, rot: 0, tall: 560, style: 'lm81' });
  // dãy nhà ống (dùng lại kiểu Hà Nội, phố Sài Gòn)
  const ROW = (x1, y1, x2, y2) => VN.row(obstacles, rng, x1, y1, x2, y2, true);
  ROW(60, 60, 1240, 210); ROW(60, 1180, 1240, 1520);
  ROW(1420, 60, 2340, 210); ROW(1420, 460, 2340, 620); ROW(1420, 850, 2340, 1010); ROW(1420, 1150, 2340, 1300);
  ROW(2470, 60, 3400, 210); ROW(2470, 420, 3400, 580);
  ROW(1420, 2290, 2340, 2450); ROW(1420, 2700, 2340, 2900); ROW(2470, 2290, 3400, 2450); ROW(2470, 2700, 3400, 2900);
  ROW(60, 1810, 1240, 2000);
  // cây xanh: công viên quanh Bưu điện, ven bến Bạch Đằng, quanh chợ
  const tree = (x, y, sp, r) => obstacles.push({ kind: 'vtree', shape: 'circle', x, y, r: r || 26, sp: sp || 'locvung', lean: 0, tall: 110 });
  for (let i = 0; i < 26; i++) {
    const x = 120 + rng() * 1060, y = 300 + rng() * 820;
    if (Math.abs(x - PO.x) < PO.w / 2 + 50 && Math.abs(y - PO.y) < PO.h / 2 + 50) continue;
    if (obstacles.some((o) => o.kind === 'vtree' && Math.hypot(o.x - x, o.y - y) < 90)) continue;
    tree(x, y, i % 3 ? 'locvung' : 'banyan');
  }
  for (let y = 300; y < WH - 100; y += 170) { if (Math.abs(y - ROAD.y) < 140 || (y > PLAZA.y0 - 40 && y < PLAZA.y1 + 40)) continue; tree(RIVER.x0 - 60, y, 'locvung', 24); }
  for (const [x, y] of [[300, 2350], [1150, 2350], [300, 2850], [1150, 2850], [420, 2420], [1020, 2420]]) tree(x, y, 'banyan', 28);
  // đèn đường dọc phố đi bộ + bến sông
  const lamps = [];
  for (let x = PLAZA.x0 + 60; x < PLAZA.x1; x += 240) for (const y of [PLAZA.y0 + 20, PLAZA.y1 - 20]) { obstacles.push({ kind: 'lamp', shape: 'circle', x, y, r: 7, tall: 50 }); lamps.push([x, y]); }
  for (let y = 250; y < WH - 100; y += 400) { obstacles.push({ kind: 'lamp', shape: 'circle', x: RIVER.x0 - 20, y, r: 7, tall: 50 }); lamps.push([RIVER.x0 - 20, y]); }
  for (let x = 100; x < RIVER.x0; x += 450) for (const y of [ROAD.y - ROAD.hw - 24, ROAD.y + ROAD.hw + 24]) { obstacles.push({ kind: 'lamp', shape: 'circle', x: x + (y > ROAD.y ? 150 : 0), y, r: 7, tall: 50 }); lamps.push([x + (y > ROAD.y ? 150 : 0), y]); }
  // biển neon
  const NTXT = ['KARAOKE', 'BIA HƠI', 'CƠM TẤM', 'HỦ TIẾU', 'BÁNH MÌ', 'CAFE', 'SALE 50%', 'SPA', 'PHỞ 24H', 'ỐC ĐÊM'];
  const neons = [];
  for (const [x, y] of [[300, 1560], [700, 1560], [1100, 1560], [1550, 240], [1900, 240], [2200, 660], [1600, 1040], [2100, 1040], [2600, 240], [3100, 620], [1600, 2480], [2000, 2480], [2700, 2480], [3200, 2480], [1700, 2660], [2900, 2660], [300, 1780], [900, 1780]]) {
    const c = NEON[(rng() * NEON.length) | 0]; obstacles.push({ kind: 'neonSign', shape: 'circle', x, y, r: 8, tall: 50, c, txt: NTXT[(rng() * NTXT.length) | 0] }); neons.push({ x, y: y - 40, c });
  }
  // xe máy đỗ vỉa hè + quán vỉa hè
  const MOTOC = ['#c0302a', '#2a5ab0', '#e0e0e0', '#202024', '#d0a020', '#3a8a5a', '#8a2a6a'];
  const motoRow = (x, y, w, rot) => obstacles.push({ kind: 'motoRow', shape: 'box', x, y, w, h: 26, rot: rot || 0, hp: 60, maxHp: 60, cols: Array.from({ length: 8 }, () => U.pick(MOTOC)) });
  [[400, 1550, 200], [1000, 1550, 180], [1700, 2270, 200], [2900, 2270, 200], [2000, 2030, 160], [3100, 2030, 160], [1700, 230, 160], [2800, 230, 180]].forEach(([x, y, w]) => motoRow(x, y, w));
  const CLUE = { x: BX.x, y: BX.y + 130 };

  MB.registerGate({
    id: 18, seed: 1818, view3d: true, act: 2,
    title: 'GATE 18 — SÀI GÒN', subtitle: 'Thành phố không ngủ',
    world: { w: WW, h: WH }, bg: '#2a2a32', mmColor: 'rgba(150,140,170,.7)',
    scale: { hp: 2.85, dmg: 1.75 },
    start: { x: 220, y: 1660 },
    obstacles, hazards: [],
    crates: [{ x: 700, y: 1300 }, { x: 1330, y: 400 }, { x: 2400, y: 1700 }, { x: 3300, y: 1700 }, { x: 1330, y: 2600 }, { x: 2400, y: 2600 }],
    spawnPoints: [
      { x: 700, y: 300 }, { x: 1330, y: 120 }, { x: 2400, y: 120 }, { x: 3300, y: 320 }, { x: 3450, y: 1000 }, { x: 3450, y: 2600 },
      { x: 2400, y: 2950 }, { x: 1330, y: 2950 }, { x: 150, y: 2600 }, { x: 150, y: 1100 }, { x: 2400, y: 720 }, { x: 3000, y: 2600 },
    ],
    waves: [
      { total: 36, maxAlive: 16, mix: { zombie: 3, runner: 4, neonGhoul: 3, heliDrone: 2, xeOm: 2, goatDrone: 1 }, interval: [0.38, 0.75], elite: 0.18 },
      { total: 40, maxAlive: 17, mix: { neonGhoul: 4, heliDrone: 3, runner: 3, riot: 2, licker: 2, xeOm: 2 }, interval: [0.36, 0.72], elite: 0.22 },
      { total: 44, maxAlive: 19, mix: { neonGhoul: 5, heliDrone: 4, riot: 3, licker: 2, goatDrone: 2, xeOm: 2 }, interval: [0.33, 0.68], elite: 0.26 },
    ],
    boss: { type: 'patientZero', x: ARENA.x + 200, y: ARENA.y },
    ally: { enter: 'start' },
    intro: { title: 'MÀN 2 · NHIỆM VỤ', text: 'Sài Gòn về đêm. Cùng Dian chặn thử nghiệm diện rộng của Hội đồng ở phố đi bộ Nguyễn Huệ. Giờ cao điểm: dòng xe máy tràn qua Lê Lợi theo đợt — mặt đường chớp cam là phải tránh.' },
    objectives: [
      { title: 'BẾN THÀNH', text: 'Ma Neon chớp ra sau lưng rồi vồ: thấy vạch đỏ ngắn sau lưng thì lộn né.' },
      { title: 'LÊ LỢI', text: 'Trực Thăng Mini bắn loạt 3 viên từ xa. Dòng xe máy cuốn bay cả quái — dụ quái xuống làn xe.' },
      { title: 'NGUYỄN HUỆ', text: 'Wave cuối. Phố đi bộ trước UBND Thành phố.' },
      { title: 'BOSS · VẬT THỂ V-0', text: 'Nhảy vồ vào vòng xanh — lộn né. Đứng gần là bị cánh tay quét hình quạt đỏ. Mẹo: dụ nó nhảy xuống đường Lê Lợi đúng giờ cao điểm để xe tông choáng.' },
    ],
    challenges: [
      { id: 'jammers', type: 'destroy', name: 'Đầu Phát Virus', desc: 'Phá 4 đầu phát virus GoatEvil quanh trung tâm', kind: 'goatCrate', r: 22, hp: 380,
        spawner: { type: 'neonGhoul', every: 7, range: 700, cap: 5 },
        targets: [{ x: 1330, y: 1000 }, { x: 2410, y: 400 }, { x: 3300, y: 1250 }, { x: 2410, y: 2600 }], reward: { mod: 'barrel' } },
      { id: 'market', type: 'hold', name: 'Cổng Chợ Bến Thành', desc: 'Giữ cổng Nam chợ Bến Thành 16 giây', zone: { x: BT.x, y: BT.y - BT.h / 2 - 90, r: 85 }, time: 16,
        mix: { neonGhoul: 2, runner: 1, heliDrone: 1 }, spawnEvery: 1.5, reward: { mod: 'trigger' } },
      { id: 'streak', type: 'streak', name: 'Thành Phố Không Ngủ', desc: '26 hạ gục liên tiếp không trúng đòn', count: 26, reward: { mod: 'pierce' } },
    ],
    clue: { x: CLUE.x, y: CLUE.y, title: 'Ghi chép số 8 — Sài Gòn', text: [
      'Ngày 52. Tình nguyện viên V-0 là người duy nhất sống sót ở lô đầu tiên. Dũng ký tên làm chứng đêm đó. Cậu ta mang tờ giấy ấy theo suốt mười hai năm.',
      'Hội đồng muốn V-0 trở về Sài Gòn — nơi tất cả bắt đầu. Một thành phố mười triệu người là phòng thí nghiệm hoàn hảo.',
      'GoatEvil chỉ là cái vỏ. Ở Miền Tây, nó sẽ cho Hunter thấy nó thật sự thuộc về ai.',
    ] },
    comms: [
      { on: 'start', t: 2.5, lines: [['DIAN', 'Bến Thành. Đúng như đã hẹn.'], ['HUNTER', 'Anh nói có chuyện muốn nói với tôi.'], ['DIAN', '…Sau trận này.']] },
      { on: 'start', t: 13, lines: [['GOATEVIL', 'Sài Gòn chưa bao giờ ngủ. Đêm nay nó sẽ không bao giờ thức dậy nữa.']] },
      { on: 'wave', wave: 2, lines: [['DIAN', 'Giờ cao điểm! Xe máy tràn qua Lê Lợi — đừng đứng giữa đường.'], ['HUNTER', 'Ở đây thì giờ nào chẳng là giờ cao điểm.']] },
      { on: 'wave', wave: 3, lines: [['DIAN', 'Tín hiệu V-0 ở phố đi bộ Nguyễn Huệ. Nó… vẫn còn sống thật.']] },
      { on: 'ally', lines: [['DIAN', 'Ma Neon sau lưng cậu — tôi lo con bên trái.']] },
      { on: 'low', lines: [['DIAN', 'Lùi về phía tôi! Tôi yểm trợ!']] },
      { on: 'boss', lines: [['GOATEVIL', 'Hunter, gặp bệnh nhân số 0 đi. Dian — chào người quen cũ chứ?'], ['DIAN', '…'], ['HUNTER', 'Người quen cũ?']] },
      { on: 'phase', phase: 2, lines: [['GOATEVIL', 'Dian chưa kể với ngươi sao? Giáo sư Ted vẫn sống. Hắn biết từ Sa Pa.'], ['HUNTER', 'Dian?!'], ['DIAN', 'Đánh trước đã. Tôi sẽ giải thích.']] },
      { on: 'phase', phase: 3, lines: [['DIAN', 'Nó sắp nổ vòng virus mỗi lần tiếp đất — giữ khoảng cách!']] },
      { on: 'won', lines: [['HUNTER', 'Anh biết Ted còn sống từ Sa Pa. Và anh im lặng.'], ['DIAN', 'Ông ấy là thầy tôi. Tôi cần gặp ông ấy trước — một mình.'], ['HUNTER', 'Vậy anh đi đường anh.'], ['DIAN', 'Miền Tây… cẩn thận, Hunter.']] },
    ],
    light3d: { hemiSky: 0x9a9ad8, hemiGround: 0x4a4a5a, hemi: 1.5, sun: 0xd8dcff, sunI: 1.0, exposure: 1.35 },

    setup(G) {
      G.__over = null;
      G.gs.rushT = 14; G.gs.warn = 0;
      G.gs.swarm = { kind: 'sgSwarm', x: -9999, y: ROAD.y, r: 60, run: false, hidden: true, dir: 1 };
      G.actors.push(G.gs.swarm);
      G.gs.boat = 0;
    },
    update(G, dt) {
      const s = G.gs, sw = s.swarm, p = G.player;
      s.boat += dt;
      if (G.state === 'fight' || G.state === 'break' || G.state === 'boss' || G.state === 'preboss') {
        if (!sw.run && s.warn <= 0) { s.rushT -= dt; if (s.rushT <= 0) { s.warn = 2; sw.dir = -sw.dir; MB.Audio.play('boss'); MB.HUD.toast('<b>GIỜ CAO ĐIỂM!</b> Xe máy tràn qua Lê Lợi', '#ffb84a'); } }
      }
      if (s.warn > 0) { s.warn -= dt; if (s.warn <= 0) { sw.run = true; sw.hidden = false; sw.x = sw.dir > 0 ? ROAD.x0 - 400 : ROAD.x1 + 400; sw.hitB = false; } }
      if (sw.run) {
        sw.x += 560 * dt * sw.dir;
        const x0 = sw.x - 380, x1 = sw.x + 380, inLane = (o) => o.x > x0 && o.x < x1 && Math.abs(o.y - ROAD.y) < ROAD.hw + 6;
        const push = (o) => (o.y < ROAD.y ? -Math.PI / 2 : Math.PI / 2);
        if (!p.dead && inLane(p)) G.hurtPlayer(24, { x: p.x - sw.dir * 30, y: ROAD.y + (p.y < ROAD.y ? 60 : -60) });
        for (const e of G.enemies) {
          if (e.dead || e.fly || e.hidden || e.airborne || !inLane(e)) continue;
          if (e.boss) { if (!sw.hitB) { sw.hitB = true; e.stunT = 2.6; G.damageEnemy(e, e.maxHp * 0.04, push(e), 0); G.text(e.x, e.y - e.r - 20, 'XE TÔNG!', '#ffd23a', 18); G.shake(10); MB.Audio.play('break'); } }
          else G.damageEnemy(e, 700, push(e), 520);
        }
        if (G.ally && !G.ally.down && inLane(G.ally)) MB.Ally.hurt(G, 30);
        if ((sw.dir > 0 && sw.x > ROAD.x1 + 500) || (sw.dir < 0 && sw.x < ROAD.x0 - 500)) { sw.run = false; sw.hidden = true; s.rushT = U.rnd(18, 24); }
      }
    },
    drawUnder(G, ctx) {
      const t = G.time, s = G.gs;
      if (s.warn > 0 || s.swarm.run) { const k = s.swarm.run ? 0.45 : 0.3 + Math.abs(Math.sin(t * 10)) * 0.4; ctx.fillStyle = `rgba(255,150,40,${k * 0.45})`; ctx.fillRect(ROAD.x0, ROAD.y - ROAD.hw, ROAD.x1 - ROAD.x0, ROAD.hw * 2); }
      // sóng sông + ánh đèn phản chiếu
      ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 2;
      for (let i = 0; i < 30; i++) { const x = RIVER.x0 + 20 + (i * 53) % (RIVER.x1 - RIVER.x0 - 40), y = (i * 211 + t * 30) % WH; ctx.beginPath(); ctx.moveTo(x - 12, y); ctx.quadraticCurveTo(x, y - 4, x + 12, y); ctx.stroke(); }
      for (let i = 0; i < 8; i++) { ctx.fillStyle = `rgba(${['255,60,216', '58,240,255', '255,210,58'][i % 3]},.12)`; ctx.fillRect(RIVER.x0 + 30 + i * 38, 400 + (i * 330) % 2200, 8, 120 + Math.sin(t * 2 + i) * 20); }
      // tàu du lịch trên sông
      const by = ((s.boat * 40) % (WH + 400)) - 200, bx = (RIVER.x0 + RIVER.x1) / 2;
      ctx.fillStyle = 'rgba(0,0,0,.3)'; U.rr(ctx, bx - 30, by - 70, 70, 150, 20); ctx.fill();
      ctx.fillStyle = '#e8e8f0'; U.rr(ctx, bx - 36, by - 76, 72, 150, 24); ctx.fill();
      ctx.fillStyle = '#3a4a6a'; U.rr(ctx, bx - 26, by - 50, 52, 96, 10); ctx.fill();
      for (let i = 0; i < 6; i++) { ctx.fillStyle = NEON[(i + ((t * 3) | 0)) % NEON.length]; U.circle(ctx, bx - 30 + (i % 2) * 60, by - 50 + ((i / 2) | 0) * 45, 3); ctx.fill(); }
    },
    drawOver(G, ctx) { VN.drawOver(G, ctx); },
    drawScreen(G, ctx) {
      const p = G.player, s = G.gs;
      const L = [{ x: p.x, y: p.y, r: 300, k: 0.95 }];
      for (const [x, y] of lamps) L.push({ x, y: y - 10, r: 170, h: 30, c: 'rgba(255,200,120,.18)' });
      for (const n of neons) L.push({ x: n.x, y: n.y, r: 150, h: 20, c: `rgba(${parseInt(n.c.slice(1, 3), 16)},${parseInt(n.c.slice(3, 5), 16)},${parseInt(n.c.slice(5, 7), 16)},.22)` });
      L.push({ x: UBND.x, y: UBND.y, r: 330, c: 'rgba(255,220,140,.2)' }, { x: BT.x, y: BT.y - 60, r: 300, c: 'rgba(255,230,180,.16)' }, { x: BX.x, y: BX.y, r: 260, c: 'rgba(140,200,255,.18)' }, { x: PO.x, y: PO.y, r: 280, c: 'rgba(255,210,140,.16)' });
      if (G.ally) L.push({ x: G.ally.x, y: G.ally.y, r: 200 });
      if (s.swarm.run) for (let i = -2; i <= 2; i++) L.push({ x: s.swarm.x + i * 160, y: ROAD.y, r: 180, c: 'rgba(255,240,200,.25)' });
      for (const e of G.enemies) if (!e.dead && e.type === 'neonGhoul') L.push({ x: e.x, y: e.y, r: 110, c: 'rgba(255,60,216,.2)' });
      if (G.boss && !G.boss.dead) L.push({ x: G.boss.x, y: G.boss.y, r: 200, c: 'rgba(150,255,90,.2)' });
      if (G.clue && !G.clue.taken) L.push({ x: G.clue.x, y: G.clue.y, r: 140, c: 'rgba(255,220,120,.3)' });
      VN.darkness(G, ctx, L, G.r3on ? 0.16 : 0.46);
    },

    buildGround(g, w, h, rand) {
      // nhựa đường + vỉa hè gạch
      g.fillStyle = '#3a3a40'; g.fillRect(0, 0, w, h);
      GK.patches(g, rand, w, h, 200, ['rgba(60,60,66,.35)', 'rgba(30,30,34,.3)'], 40, 140);
      // vỉa hè quanh các khối nhà
      g.fillStyle = '#6a625a';
      for (const [x0, y0, x1, y1] of [[40, 40, 1260, 1540], [1400, 40, 2360, 1320], [2450, 40, 3420, 1320], [1400, 2260, 2360, 2930], [2450, 2260, 3420, 2930], [40, 2260, 1260, 2930], [40, 1790, 1260, 2020]]) g.fillRect(x0, y0, x1 - x0, y1 - y0);
      // công viên quanh Bưu điện / chợ
      g.fillStyle = '#2f4a32'; g.fillRect(90, 260, 1120, 880); g.fillRect(90, 2300, 1120, 600);
      // phố đi bộ Nguyễn Huệ: đá granite sọc, đài phun nước giữa
      g.fillStyle = '#8a8580'; g.fillRect(PLAZA.x0, PLAZA.y0, PLAZA.x1 - PLAZA.x0 + 200, PLAZA.y1 - PLAZA.y0);
      g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = 2; for (let x = PLAZA.x0; x < PLAZA.x1 + 200; x += 40) { g.beginPath(); g.moveTo(x, PLAZA.y0); g.lineTo(x, PLAZA.y1); g.stroke(); }
      g.fillStyle = 'rgba(80,140,200,.35)'; for (let x = PLAZA.x0 + 200; x < PLAZA.x1; x += 300) { g.beginPath(); g.arc(x, (PLAZA.y0 + PLAZA.y1) / 2, 18, 0, U.TAU); g.fill(); }
      // đường Lê Lợi: 2 làn, vạch đứt
      g.fillStyle = '#2a2a2e'; g.fillRect(ROAD.x0, ROAD.y - ROAD.hw, ROAD.x1, ROAD.hw * 2);
      g.fillStyle = '#e8e0c0'; for (let x = 0; x < ROAD.x1; x += 60) g.fillRect(x, ROAD.y - 2, 30, 4);
      g.fillStyle = '#d8c070'; g.fillRect(ROAD.x0, ROAD.y - ROAD.hw - 3, ROAD.x1, 3); g.fillRect(ROAD.x0, ROAD.y + ROAD.hw, ROAD.x1, 3);
      // vạch qua đường
      g.fillStyle = 'rgba(240,240,240,.7)'; for (const cx of [1330, 2410]) for (let i = 0; i < 9; i++) g.fillRect(cx - 50, ROAD.y - ROAD.hw + 6 + i * 15, 100, 8);
      // bến Bạch Đằng + sông Sài Gòn
      g.fillStyle = '#7a7268'; g.fillRect(RIVER.x0 - 160, 0, 160, h);
      const rg = g.createLinearGradient(RIVER.x0, 0, RIVER.x1, 0); rg.addColorStop(0, '#1a2a3a'); rg.addColorStop(0.5, '#22364a'); rg.addColorStop(1, '#1a2a3a');
      g.fillStyle = rg; g.fillRect(RIVER.x0, 0, RIVER.x1 - RIVER.x0, h);
      g.fillStyle = '#4a4a50'; g.fillRect(RIVER.x0 - 6, 0, 6, h); g.fillRect(RIVER.x1, 0, 6, h);
      // bờ Thủ Thiêm
      g.fillStyle = '#2f3a32'; g.fillRect(RIVER.x1 + 6, 0, w - RIVER.x1, h);
      GK.vignette(g, w, h, 0.4);
    },

    /* ---------- 3D ---------- */
    models3d: {
      neonGhoul: (K) => ({
        base: 15,
        build() {
          const T = K.T, g = new T.Group(), body = K.std(0x2a1a2a, { rough: 0.7 });
          const glow = K.glowMat(0xff3ad8, 2);
          g.add(K.mesh(K.cyl(9, 11, 26, 8), body, 0, 20, 0), K.mesh(K.sph(8, 10), K.std(0x3a2a3a), 3, 38, 0));
          const arms = [];
          for (const z of [-11, 11]) { const a = K.mesh(K.box(22, 3, 3), glow, 12, 28, z, false); g.add(a); arms.push(a); }
          g.add(K.mesh(K.box(1, 16, 20), glow, 9, 22, 0, false), K.mesh(K.sph(1.8, 6), K.glowMat(0x3af0ff, 3), 10, 40, -3, false), K.mesh(K.sph(1.8, 6), K.glowMat(0x3af0ff, 3), 10, 40, 3, false));
          const sp = K.glowSprite(0xff3ad8, 50, 0.4); sp.position.y = 24; g.add(sp);
          g.userData = { arms, h: 44 }; return g;
        },
        anim(e, m, G) { m.userData.arms.forEach((a, i) => { a.rotation.y = Math.sin(G.time * 10 + i * 3 + e.t) * 0.3; }); },
      }),
      heliDrone: (K) => ({
        base: 16,
        build() {
          const T = K.T, g = new T.Group(), body = new T.Group(); body.position.y = 44; g.add(body);
          const m = K.std(0x2a2a30, { metal: 0.5, rough: 0.4 });
          const hull = K.mesh(K.sph(9, 10), m, 0, 0, 0); hull.scale.set(1.7, 1, 1); body.add(hull);
          body.add(K.mesh(K.box(18, 3, 3), m, -18, 1, 0), K.mesh(K.box(3, 8, 1), K.std(0xc83a3a), -27, 3, 0), K.mesh(K.sph(5, 8), K.std(0x7ab0d8, { metal: 0.3, rough: 0.1 }), 9, 1, 0));
          const rotor = new T.Group(); rotor.position.y = 10; body.add(rotor);
          for (let i = 0; i < 2; i++) { const b = K.mesh(K.box(44, 0.6, 3), K.std(0xd0d6e0, { metal: 0.6 }), 0, 0, 0, false); b.rotation.y = i * Math.PI / 2; rotor.add(b); }
          body.add(K.mesh(K.cyl(1, 1, 8, 6), m, 0, 6, 0));
          const eye = K.mesh(K.sph(2, 6), K.glowMat(0xff3a3a, 3), 15, -1, 0, false); body.add(eye);
          g.userData = { body, rotor, h: 54 }; return g;
        },
        anim(e, m, G) { const d = m.userData; d.rotor.rotation.y = G.time * 40; d.body.position.y = 44 + Math.sin(G.time * 3 + e.t) * 4; d.body.rotation.x = Math.sin(G.time * 2 + e.t) * 0.08; },
      }),
      patientZero: (K) => ({
        base: 52,
        build() {
          const T = K.T, g = new T.Group(), skin = K.std(0x9aa890, { own: true, flat: true, rough: 0.85 }), dark = K.std(0x5a6a52, { flat: true });
          const legs = [];
          for (const z of [-20, 20]) { const l = K.mesh(K.cyl(9, 11, 40, 8), dark, -6, 20, z); g.add(l); legs.push(l); }
          const body = K.mesh(K.bumpy('pzbody', new T.SphereGeometry(32, 14, 10), 2.2, 1.6), skin, 0, 66, 0); body.scale.set(1, 1.25, 1.1); g.add(body);
          const core = K.mesh(K.sph(11, 10), K.glowMat(0x9aff5a, 2.4), 22, 66, 0, false); g.add(core);
          const csp = K.glowSprite(0x9aff5a, 90, 0.55); csp.position.set(24, 66, 0); g.add(csp);
          for (let i = 0; i < 8; i++) { const v = K.mesh(K.box(30, 1.6, 1.6), K.glowMat(0x7aff4a, 1.8), Math.cos(i) * 18, 50 + i * 5, Math.sin(i) * 26, false); v.rotation.set(i, i * 0.7, i * 0.4); g.add(v); }
          const head = K.mesh(K.sph(15, 10), skin, 8, 108, 0); g.add(head);
          for (const z of [-6, 6]) g.add(K.mesh(K.sph(2.6, 6), K.glowMat(0xc8ff5a, 3), 22, 110, z, false));
          const arm = new T.Group(); arm.position.set(4, 80, 34); g.add(arm);
          const up = K.mesh(K.cyl(10, 14, 70, 8), skin, 0, 0, 0); up.rotation.x = Math.PI / 2; up.position.z = 30; arm.add(up);
          for (let i = 0; i < 4; i++) { const c = K.mesh(K.cyl(0.5, 4, 22, 5), dark, 6 - i * 4, 0, 72); c.rotation.x = Math.PI / 2; arm.add(c); }
          const arm2 = K.mesh(K.cyl(5, 6, 40, 6), skin, 6, 70, -36); arm2.rotation.x = -0.5; g.add(arm2);
          g.userData = { legs, arm, core, h: 130 }; return g;
        },
        anim(e, m, G) {
          const d = m.userData, mv = Math.hypot(e.vx, e.vy) > 20;
          d.legs.forEach((l, i) => { l.rotation.z = mv ? Math.sin(G.time * 8 + i * 3.1) * 0.4 : 0; });
          d.arm.rotation.y = e.state === 'sweepAim' ? 1.2 - (1 - e.st / 0.6) * 2.4 : Math.sin(G.time * 2) * 0.15;
          d.core.scale.setScalar(1 + Math.sin(G.time * 5) * 0.15);
          m.position.y = e.airborne ? Math.sin((1 - e.st / 0.6) * Math.PI) * 70 : 0;
        },
      }),
    },
    props3d: {
      sgWater: (o, K) => new K.T.Group(),
      ubnd: (o, K) => {
        const T = K.T, g = new T.Group(), wall = K.std(0xf2d27a, { rough: 0.8 }), roof = K.std(0xb8462a, { own: true, transparent: true, rough: 0.8 }), white = K.std(0xfff6dc);
        g.add(K.mesh(K.box(o.w, 60, o.h), wall, 0, 30, 0));
        for (let i = 0; i < 9; i++) g.add(K.mesh(K.cyl(2.5, 2.5, 50, 8), white, o.hw + 2, 28, -o.hh + 20 + i * (o.h - 40) / 8));
        g.add(K.mesh(K.box(o.w + 10, 6, o.h + 10), roof, 0, 63, 0));
        const r = new T.Mesh(K.G3('ubndroof', () => new T.CylinderGeometry(0, 1, 1, 4)), roof); r.scale.set(o.w * 0.55, 34, o.h * 0.6); r.position.y = 82; r.rotation.y = Math.PI / 4; g.add(r);
        const tw = new T.Group(); tw.position.set(o.w * 0.45 - o.hw + 40, 0, 0); g.add(tw);
        tw.add(K.mesh(K.box(54, 140, 54), wall, 0, 70, 0));
        const tr = new T.Mesh(K.G3('ubndtop', () => new T.ConeGeometry(1, 1, 4)), roof); tr.scale.set(42, 50, 42); tr.position.y = 165; tr.rotation.y = Math.PI / 4; tw.add(tr);
        tw.add(K.mesh(K.cyl(10, 10, 2, 16), K.glowMat(0xfff4d0, 1.6), 28, 120, 0, false)); tw.children[tw.children.length - 1].rotation.z = Math.PI / 2;
        tw.add(K.mesh(K.cyl(0.8, 0.8, 40, 4), K.std(0x888888), 0, 210, 0), K.mesh(K.box(1, 12, 20), K.std(0xc8302a), 0, 222, 10));
        const sp = K.glowSprite(0xffd890, 260, 0.3); sp.position.set(0, 60, 0); g.add(sp);
        g.userData.canopy = [roof]; return g;
      },
      benThanh: (o, K) => {
        const T = K.T, g = new T.Group(), wall = K.std(0xe8dcc0, { rough: 0.85 }), roof = K.std(0x7a7470, { own: true, transparent: true, rough: 0.8 });
        g.add(K.mesh(K.box(o.w, 50, o.h), wall, 0, 25, 0), K.mesh(K.box(o.w + 8, 6, o.h + 8), roof, 0, 53, 0));
        for (let i = 0; i < 6; i++) { const r = K.mesh(K.box(o.w / 6 - 10, 20, o.h - 20), roof, -o.hw + (i + 0.5) * o.w / 6, 64, 0); g.add(r); }
        const tw = new T.Group(); tw.position.set(0, 0, -o.hh); g.add(tw);
        tw.add(K.mesh(K.box(70, 130, 40), wall, 0, 65, 0), K.mesh(K.box(80, 8, 48), roof, 0, 134, 0));
        const clock = K.mesh(K.cyl(17, 17, 2, 20), K.glowMat(0xfff4d0, 1.4), 0, 100, -21, false); clock.rotation.x = Math.PI / 2; tw.add(clock);
        g.userData.canopy = [roof]; return g;
      },
      postOffice: (o, K) => {
        const T = K.T, g = new T.Group(), wall = K.std(0xe0b46a, { rough: 0.85 }), roof = K.std(0x5a6a6a, { own: true, transparent: true, rough: 0.6, metal: 0.3 });
        g.add(K.mesh(K.box(o.w, 54, o.h), wall, 0, 27, 0));
        const v = new T.Mesh(K.G3('povault', () => new T.CylinderGeometry(1, 1, 1, 16, 1, false, 0, Math.PI)), roof); v.scale.set(o.h * 0.42, o.w * 0.45, o.h * 0.42); v.rotation.z = Math.PI / 2; v.position.y = 54; g.add(v);
        g.add(K.mesh(K.box(90, 40, 10), wall, 0, 74, o.hh - 4));
        const clock = K.mesh(K.cyl(12, 12, 2, 20), K.glowMat(0xfff4d0, 1.4), 0, 78, o.hh + 2, false); clock.rotation.x = Math.PI / 2; g.add(clock);
        g.userData.canopy = [roof]; return g;
      },
      sgTower: (o, K) => {
        const T = K.T, g = new T.Group(), glass = K.std(o.style === 'bitexco' ? 0x7a9ab8 : 0x8aaac8, { own: true, transparent: true, metal: 0.6, rough: 0.15, emissive: 0x1a2a4a, ei: 0.5 });
        if (o.style === 'bitexco') {
          const b = new T.Mesh(K.G3('bxbody', () => { const pts = []; for (let i = 0; i <= 10; i++) { const k = i / 10; pts.push(new T.Vector2(1 - k * 0.75 + Math.sin(k * Math.PI) * 0.18, k)); } return new T.LatheGeometry(pts, 16); }), glass);
          b.scale.set(o.hw, o.tall, o.hw * 0.8); g.add(b);
          const pad = K.mesh(K.cyl(o.hw * 0.7, o.hw * 0.7, 6, 20), K.std(0x2a3a4a), o.hw * 0.8, o.tall * 0.62, 0); g.add(pad);
          const ring = K.mesh(K.G3('bxring', () => new T.TorusGeometry(1, 0.06, 6, 24)), K.glowMat(0xffd23a, 1.6), o.hw * 0.8, o.tall * 0.62 + 4, 0, false); ring.scale.setScalar(o.hw * 0.45); ring.rotation.x = Math.PI / 2; g.add(ring);
        } else {
          for (let i = 0; i < 6; i++) { const w = o.w * (1 - i * 0.12); g.add(K.mesh(K.box(w, o.tall / 6, w), glass, 0, o.tall / 6 * (i + 0.5), 0)); }
          const sp = new T.Mesh(K.G3('lmspire', () => new T.ConeGeometry(1, 1, 4)), glass); sp.scale.set(o.w * 0.25, 80, o.w * 0.25); sp.position.y = o.tall + 40; g.add(sp);
        }
        const tip = K.mesh(K.sph(3, 6), K.glowMat(0xff3a3a, 3), 0, o.tall + (o.style === 'bitexco' ? 4 : 82), 0, false); g.add(tip);
        g.userData.canopy = [glass]; return g;
      },
      neonSign: (o, K) => {
        const T = K.T, g = new T.Group(), col = new T.Color(o.c).getHex();
        g.add(K.mesh(K.cyl(1.4, 1.4, 34, 6), K.std(0x2a2a32), 0, 17, 0), K.mesh(K.box(52, 18, 3), K.std(0x100810), 0, 42, 0));
        g.add(K.mesh(K.box(54, 2, 4), K.glowMat(col, 2.4), 0, 52, 0, false), K.mesh(K.box(54, 2, 4), K.glowMat(col, 2.4), 0, 32, 0, false), K.mesh(K.box(30, 6, 4), K.glowMat(col, 2), 0, 42, 0, false));
        const sp = K.glowSprite(col, 70, 0.45); sp.position.y = 42; g.add(sp);
        return g;
      },
    },
    actors3d: Object.assign({
      sgSwarm: (a, K) => {
        const T = K.T, g = new T.Group(), COLS = [0xc0302a, 0x2a5ab0, 0xe0e0e0, 0x202024, 0xd0a020, 0x3a8a5a, 0x8a2a6a];
        const bikes = new T.Group(); g.add(bikes);
        for (let i = 0; i < 26; i++) {
          const b = VN.moto3D(K, COLS[i % COLS.length]); b.position.set(-360 + (i * 137) % 720, 0, -55 + ((i * 53) % 110));
          b.add(K.mesh(K.box(6, 14, 8), K.std([0x3a5a8a, 0xc85a3a, 0x5a8a3a, 0xe8e0d0][i % 4]), -2, 26, 0), K.mesh(K.sph(4.5, 8), K.std([0xffffff, 0xd02a2a, 0x2a4ad0, 0xf2c63a][i % 4]), -1, 37, 0));
          if (i % 3 === 0) { const hl = K.glowSprite(0xfff0c0, 34, 0.7); hl.position.set(14, 16, 0); b.add(hl); }
          bikes.add(b);
        }
        g.userData.anim = (aa, m) => { m.visible = !aa.hidden; m.position.set(aa.x, 0, aa.y); bikes.rotation.y = aa.dir > 0 ? 0 : Math.PI; };
        return g;
      },
    }, MB.Story.actors3d),
  });
  // 2D: dòng xe máy giờ cao điểm
  const SW = Array.from({ length: 26 }, (_, i) => ({ dx: -360 + (i * 137) % 720, dy: -55 + ((i * 53) % 110), c: ['#c0302a', '#2a5ab0', '#e0e0e0', '#202024', '#d0a020', '#3a8a5a', '#8a2a6a'][i % 7], h: ['#ffffff', '#d02a2a', '#2a4ad0', '#f2c63a'][i % 4] }));
  MB.Props.registerActor('sgSwarm', (ctx, a, G) => {
    if (a.hidden) return;
    const rot = a.dir > 0 ? 0 : Math.PI;
    for (const b of SW) {
      const x = a.x + b.dx * a.dir, y = a.y + b.dy + Math.sin(G.time * 6 + b.dx) * 2;
      VN.moto(ctx, x, y, rot, b.c, 1.1);
      ctx.fillStyle = b.h; U.circle(ctx, x - 2 * a.dir, y, 5); ctx.fill();
      ctx.fillStyle = 'rgba(255,240,180,.25)'; ctx.beginPath(); ctx.moveTo(x + 14 * a.dir, y); ctx.lineTo(x + 70 * a.dir, y - 14); ctx.lineTo(x + 70 * a.dir, y + 14); ctx.fill();
    }
  });
})(window.MB);
