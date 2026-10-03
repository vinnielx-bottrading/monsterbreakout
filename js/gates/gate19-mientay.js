/* Gate 19 — MIỀN TÂY: Chín rồng ra biển (Màn 2 · Nguồn Gốc)
   Thắng cảnh: sông Hậu mênh mông, chợ nổi Cái Răng (ghe xuồng neo kín sông, cây bẹo treo nông sản),
   kênh rạch chằng chịt với cầu khỉ tre, vườn dừa – vườn trái cây, nhà sàn mái lá ven sông, ruộng lúa.
   Cơ chế: NƯỚC LỚN — thuỷ triều dâng theo đợt tràn bãi ven sông (làm chậm), kênh rạch chặn đường (đạn bay qua),
   chỉ qua được bằng cầu khỉ và lối ghe chợ nổi.
   Hunter đi một mình — cô Hạnh (trợ lý cũ của GS Ted) liên lạc qua bộ đàm.
   Quái mới: Cá Sấu Bùn (lặn dưới bùn rồi đớp), Khỉ Ném Dừa (ném trái dừa nổ theo vòng báo trước).
   Boss: THUỶ QUÁI CỬU LONG — cá tra đột biến khổng lồ dưới đầm: lặn (miễn sát thương), trồi lên quất râu, phun bùn,
   phóng mình lên bờ đè bẹp (nằm trên bờ = thời cơ vàng), gọi cá sấu, giai đoạn 3 nước lớn tràn bờ đầm. */
'use strict';
(function (MB) {
  const U = MB.U, Ens = MB.Enemies, GK = MB.GK, VN = MB.VN;
  const WW = 4200, WH = 3000;
  const H3 = 0.45;
  const RIV = { y0: 1300, y1: 1620 };                  // sông Hậu
  const MARKET = { x0: 1450, x1: 1760 };               // lối ghe chợ nổi Cái Răng
  const C1 = { x0: 940, x1: 1030, y0: 0, y1: RIV.y0, bridge: 620 };      // rạch phía Bắc + cầu khỉ
  const C2 = { x0: 2680, x1: 2770, y0: RIV.y1, y1: WH, bridge: 2250 };   // rạch phía Nam + cầu khỉ
  const BR = 100;                                      // bề rộng lối cầu khỉ
  const POND = { x: 3500, y: 2340, rx: 360, ry: 230 }; // đầm của Thuỷ Quái
  const inPond = (x, y, pad) => ((x - POND.x) / (POND.rx + pad)) ** 2 + ((y - POND.y) / (POND.ry + pad)) ** 2 < 1;

  /* ---------- vẽ 2D ---------- */
  MB.Props.register('mtWater', () => {});
  // nhà sàn mái lá dừa ven sông
  MB.Props.register('nhaSan', (ctx, o) => {
    const x = o.x - o.hw, y = o.y - o.hh, H = 46 * H3;
    VN.shadowBox(ctx, x, y - H, o.w, o.h, 46, 0.28);
    ctx.fillStyle = '#4a3420'; for (let i = 0; i < 5; i++) ctx.fillRect(x + 4 + i * (o.w - 8) / 4 - 2, y + o.h - H, 4, H);
    ctx.fillStyle = '#8a6a44'; ctx.fillRect(x, y + o.h - H, o.w, H * 0.55);
    ctx.fillStyle = '#3a2a1a'; ctx.fillRect(o.x - 10, y + o.h - H + 2, 20, H * 0.5);
  });
  VN.over.nhaSan = (ctx, o, G) => {
    const x = o.x - o.hw, y = o.y - o.hh, H = 46 * H3;
    ctx.globalAlpha = VN.coverAlpha(G, x - 10, y - H - 20, x + o.w + 10, y + o.h - H);
    ctx.fillStyle = '#a8904a'; ctx.beginPath(); ctx.moveTo(x - 10, y - H + o.h * 0.5); ctx.lineTo(o.x, y - H - 22); ctx.lineTo(x + o.w + 10, y - H + o.h * 0.5); ctx.lineTo(x + o.w + 10, y - H + o.h + 4); ctx.lineTo(x - 10, y - H + o.h + 4); ctx.fill();
    ctx.strokeStyle = 'rgba(90,70,30,.55)'; ctx.lineWidth = 1.5; for (let i = 0; i < o.w + 20; i += 7) { ctx.beginPath(); ctx.moveTo(x - 10 + i, y - H + o.h * 0.5 - 4); ctx.lineTo(x - 10 + i + 3, y - H + o.h + 4); ctx.stroke(); }
    ctx.fillStyle = '#8a7238'; ctx.fillRect(x - 10, y - H + o.h * 0.5 - 4, o.w + 20, 5);
    ctx.globalAlpha = 1;
  };
  // ghe chợ nổi (đứng lên được) + cây bẹo treo nông sản
  const PROD = [['#e8c040', '#d8a830'], ['#5aa040', '#3a8030'], ['#c84a3a', '#a8302a'], ['#8a5ac8', '#6a3a9a'], ['#f2e8a0', '#e0c870']];
  MB.Props.register('ghe', (ctx, o, t) => {
    ctx.save(); ctx.translate(o.x, o.y + Math.sin(t * 1.4 + o.x) * 2); ctx.rotate(o.rot || 0);
    ctx.fillStyle = 'rgba(0,0,0,.25)'; U.ellipse(ctx, 5, 6, o.w / 2, o.h / 2); ctx.fill();
    ctx.fillStyle = '#5a3a22'; ctx.beginPath(); ctx.moveTo(-o.w / 2, 0); ctx.quadraticCurveTo(-o.w / 2 + 10, -o.h / 2, -o.w / 4, -o.h / 2); ctx.lineTo(o.w / 4, -o.h / 2); ctx.quadraticCurveTo(o.w / 2 - 10, -o.h / 2, o.w / 2, 0); ctx.quadraticCurveTo(o.w / 2 - 10, o.h / 2, o.w / 4, o.h / 2); ctx.lineTo(-o.w / 4, o.h / 2); ctx.quadraticCurveTo(-o.w / 2 + 10, o.h / 2, -o.w / 2, 0); ctx.fill();
    ctx.fillStyle = '#8a6440'; U.rr(ctx, -o.w / 2 + 16, -o.h / 2 + 6, o.w - 32, o.h - 12, 6); ctx.fill();
    ctx.strokeStyle = '#5a3a22'; ctx.lineWidth = 1.5; for (let i = -o.w / 2 + 26; i < o.w / 2 - 16; i += 12) { ctx.beginPath(); ctx.moveTo(i, -o.h / 2 + 7); ctx.lineTo(i, o.h / 2 - 7); ctx.stroke(); }
    // mắt ghe
    ctx.fillStyle = '#c8302a'; U.ellipse(ctx, o.w / 2 - 14, -o.h / 2 + 7, 5, 3); ctx.fill(); U.ellipse(ctx, o.w / 2 - 14, o.h / 2 - 7, 5, 3); ctx.fill();
    ctx.fillStyle = '#fff'; U.circle(ctx, o.w / 2 - 13, -o.h / 2 + 7, 1.6); ctx.fill(); U.circle(ctx, o.w / 2 - 13, o.h / 2 - 7, 1.6); ctx.fill();
    // hàng hoá
    const P = PROD[o.v % PROD.length];
    for (let i = 0; i < 8; i++) { ctx.fillStyle = P[i % 2]; U.circle(ctx, -o.w / 2 + 30 + (i % 4) * 14, -8 + ((i / 4) | 0) * 16, 6); ctx.fill(); }
    ctx.restore();
  });
  VN.over.ghe = (ctx, o, G) => {
    // cây bẹo: sào tre cao treo mẫu nông sản bán trên ghe
    const t = G.time, bx = o.x + Math.cos(o.rot || 0) * o.w * 0.25, by = o.y + Math.sin(o.rot || 0) * o.w * 0.25 - 70, P = PROD[o.v % PROD.length];
    ctx.globalAlpha = VN.coverAlpha(G, bx - 16, by - 10, bx + 16, by + 70) * 0.95;
    ctx.strokeStyle = '#c8a860'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(bx, by + 70); ctx.lineTo(bx, by - 6); ctx.stroke();
    for (let i = 0; i < 3; i++) { const sw = Math.sin(t * 2 + i + o.x) * 3; ctx.strokeStyle = '#6a5a3a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(bx, by + i * 10); ctx.lineTo(bx + 10 + sw, by + i * 10 + 8); ctx.stroke(); ctx.fillStyle = P[i % 2]; U.circle(ctx, bx + 10 + sw, by + i * 10 + 12, 5); ctx.fill(); }
    ctx.globalAlpha = 1;
  };
  // nước lớn: nước tràn bãi
  MB.Props.registerHazard('tide', (ctx, h, t) => {
    const a = h.life != null ? Math.min(1, h.life / 1.5) : 1;
    ctx.fillStyle = `rgba(110,160,170,${0.38 * a})`; U.circle(ctx, h.x, h.y, h.r); ctx.fill();
    ctx.strokeStyle = `rgba(220,240,240,${0.35 * a})`; ctx.lineWidth = 1.5; for (let i = 0; i < 3; i++) { const r = h.r * (0.4 + ((t * 0.4 + i / 3) % 1) * 0.6); U.circle(ctx, h.x, h.y, r); ctx.stroke(); }
  });

  /* ---------- quái mới ---------- */
  Ens.register('mudCroc', Ens.make({
    name: 'Cá Sấu Bùn', r: 20, hp: 175, speed: 115, dmg: 24, score: 190, blood: '#2a2a10', gore: '#9a8a4a', knockMul: 0.3,
    draw(ctx, e, G) {
      if (e.hidden) return;
      const t = G.time, w = Math.sin(t * 8 + e.t) * 0.25;
      ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.face || 0);
      ctx.fillStyle = 'rgba(0,0,0,.25)'; U.ellipse(ctx, 3, 6, 34, 14); ctx.fill();
      ctx.fillStyle = '#4a5a2a'; ctx.beginPath(); ctx.moveTo(-34, w * 20); ctx.quadraticCurveTo(-18, -10, 0, -12); ctx.lineTo(16, -9); ctx.lineTo(34, -5); ctx.lineTo(34, 5); ctx.lineTo(16, 9); ctx.lineTo(0, 12); ctx.quadraticCurveTo(-18, 10, -34, w * 20); ctx.fill();
      ctx.fillStyle = '#3a4a1a'; for (let i = 0; i < 6; i++) { U.circle(ctx, -22 + i * 7, 0, 2.5); ctx.fill(); }
      ctx.fillStyle = '#5a6a32'; for (const sd of [-1, 1]) for (const x of [-10, 8]) { U.ellipse(ctx, x, sd * 13, 5, 3); ctx.fill(); }
      ctx.fillStyle = '#f2e86a'; U.circle(ctx, 14, -6, 2.2); ctx.fill(); U.circle(ctx, 14, 6, 2.2); ctx.fill();
      if (e.state === 'up') { ctx.fillStyle = '#f2f2e0'; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(20 + i * 3, -4); ctx.lineTo(21 + i * 3, 0); ctx.lineTo(22 + i * 3, -4); ctx.fill(); } }
      ctx.restore();
    },
  }, Ens.AI.burrower({ emerge: 110, up: 2.2, underMul: 1.7, dirt: '#6a5a3a', ripple: '150,130,90' })));

  Ens.register('coconutMonkey', Ens.make({
    name: 'Khỉ Ném Dừa', r: 15, hp: 90, speed: 165, dmg: 16, score: 170, blood: '#3a2010', gore: '#c89a5a', knockMul: 1,
    draw(ctx, e, G) {
      const t = G.time, aim = e.state === 'aim', w = Math.sin(t * 12 + e.t) * 3;
      ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.face || 0);
      ctx.fillStyle = 'rgba(0,0,0,.25)'; U.ellipse(ctx, 3, 5, 16, 11); ctx.fill();
      ctx.strokeStyle = '#5a3a1a'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-10, 0); ctx.quadraticCurveTo(-26, 10 + w, -22, 22); ctx.stroke();
      ctx.fillStyle = '#7a5028'; U.ellipse(ctx, -2, 0, 12, 11); ctx.fill();
      ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(2, -8); ctx.lineTo(aim ? -6 : 12, aim ? -18 : -14 + w); ctx.moveTo(2, 8); ctx.lineTo(12, 14 - w); ctx.stroke();
      if (aim) { ctx.fillStyle = '#5a4020'; U.circle(ctx, -8, -20, 7); ctx.fill(); ctx.fillStyle = '#3a8a2a'; U.circle(ctx, -8, -20, 3); ctx.fill(); }
      ctx.fillStyle = '#8a6038'; U.circle(ctx, 8, 0, 8); ctx.fill(); ctx.fillStyle = '#d8b088'; U.ellipse(ctx, 12, 0, 4, 5); ctx.fill();
      ctx.fillStyle = '#ff3a3a'; U.circle(ctx, 13, -3, 1.4); ctx.fill(); U.circle(ctx, 13, 3, 1.4); ctx.fill();
      ctx.fillStyle = '#c8302a'; ctx.fillRect(1, -7, 3, 14);
      ctx.restore();
    },
  }, Ens.AI.shooter({ cd: [2.6, 3.6], min: 220, max: 500, aim: 0.6, line: false, wig: { f: 3, a: 0.6 },
    shot: (e, G) => {
      const p = G.player, tx = p.x + p.vx * 0.6, ty = p.y + p.vy * 0.6;
      MB.Audio.play('throw');
      G.telegraphCircle(tx, ty, 64, 0.9, (GG) => GG.explosion(tx, ty, 64, 20, { player: 16, knock: 220, color: '#c89a5a', ring: '220,180,110', small: true, obstacles: false }), 'rgba(255,150,60,.16)');
      G.particle({ x: e.x, y: e.y, vx: (tx - e.x) / 0.9, vy: (ty - e.y) / 0.9, life: 0.9, color: '#5a4020', r: 6 });
    } })));

  /* ---------- BOSS: THUỶ QUÁI CỬU LONG ---------- */
  const edgePt = (a, k) => ({ x: POND.x + Math.cos(a) * POND.rx * k, y: POND.y + Math.sin(a) * POND.ry * k });
  Ens.register('mekongCat', {
    name: 'Thuỷ Quái Cửu Long', r: 56, hp: 18000, speed: 0, dmg: 28, score: 0, boss: true, knockMul: 0, fly: true, noHover: true, noContact: true,
    blood: '#2a2a1a', gore: '#c8b87a',
    init(e) { e.phase = 1; e.state = 'sub'; e.st = 2; e.face = 0; e.flopT = 6; e.callT = 8; e.tideT = 6; e.atk = 0; },
    armorFn(e, dmg, G) {
      if (e.state === 'sub' || e.state === 'rise') { if (!e.armTxt || G.time - e.armTxt > 1.2) { e.armTxt = G.time; G.text(e.x, e.y - 40, 'ĐANG LẶN', '#9ad8e8', 13); } return 0; }
      return e.state === 'beached' ? dmg * 1.35 : dmg;
    },
    update(e, G, dt) {
      const p = G.player, k = e.hp / e.maxHp, ph = k > 0.66 ? 1 : k > 0.33 ? 2 : 3, d = Ens.distPlayer(e, G);
      if (ph > e.phase) {
        e.phase = ph; G.shake(14); MB.Audio.play('roar');
        G.banner(`PHASE ${ph}`, ph === 2 ? 'Thuỷ Quái phóng lên bờ — né vòng rồi dồn hoả lực khi nó mắc cạn!' : 'Nước lớn tràn bờ đầm!', 2.2);
      }
      e.flopT -= dt; e.callT -= dt;
      if (ph >= 2 && e.callT <= 0) { e.callT = 13; for (let i = 0; i < 1 + ph; i++) { const a = U.rnd(0, U.TAU), q = edgePt(a, 1.5); G.spawnEnemyAt('mudCroc', q.x, q.y, { extra: true }); } }
      if (ph === 3) { e.tideT -= dt; if (e.tideT <= 0) { e.tideT = 11; for (let i = 0; i < 10; i++) { const a = i / 10 * U.TAU + U.rnd(-0.2, 0.2), q = edgePt(a, 1.45); G.addHazard({ kind: 'tide', x: q.x, y: q.y, r: 95, slowMul: 0.55, dps: 4, life: 7 }); } MB.HUD.toast('<b>NƯỚC LỚN!</b> Bờ đầm ngập — di chuyển chậm', '#7ac8d8'); } }
      if (e.state === 'sub') {
        // lặn: bơi dưới mặt đầm tới mép gần Hunter
        e.st -= dt;
        const a = Math.atan2((p.y - POND.y) / POND.ry, (p.x - POND.x) / POND.rx), q = edgePt(a, 0.62);
        e.vx += ((q.x - e.x) * 1.4 - e.vx) * Math.min(1, dt * 2); e.vy += ((q.y - e.y) * 1.4 - e.vy) * Math.min(1, dt * 2);
        e.face = Math.atan2(e.vy, e.vx);
        if (e.st <= 0) { e.state = 'rise'; e.st = 0.6; e.vx = e.vy = 0; G.burst(e.x, e.y, '#c8e8e8', 24, 200); MB.Audio.play('slam'); }
      } else if (e.state === 'rise') {
        Ens.stop(e, dt, 10); e.st -= dt; e.face += U.angDiff(e.face, Ens.toPlayer(e, G)) * Math.min(1, dt * 6);
        if (e.st <= 0) { e.state = 'up'; e.st = ph === 1 ? 5 : 4.4; e.atk = 0.3; }
      } else if (e.state === 'up') {
        Ens.stop(e, dt, 10); e.st -= dt; e.atk -= dt; e.face += U.angDiff(e.face, Ens.toPlayer(e, G)) * Math.min(1, dt * 3);
        if (e.atk <= 0) {
          if (ph >= 2 && e.flopT <= 0 && d > 160 && d < 650) { e.state = 'flopAim'; e.st = 0.9; e.tx = p.x; e.ty = p.y; G.telegraphCircle(p.x, p.y, 140, 0.9 + 0.6, null, 'rgba(255,90,60,.16)'); MB.Audio.play('growl'); }
          else if (d < 280) { e.state = 'whiskAim'; e.ws = 0.65; e.lock = Ens.toPlayer(e, G); MB.Audio.play('growl'); }
          else { e.state = 'spitAim'; e.ws = 0.55; e.lock = Ens.toPlayer(e, G); e.volley = ph === 1 ? 2 : 3; }
        } else if (e.st <= 0) { e.state = 'sub'; e.st = U.rnd(2, 3); G.burst(e.x, e.y, '#c8e8e8', 20, 160); }
      } else if (e.state === 'whiskAim') {
        Ens.stop(e, dt, 10); e.ws -= dt; e.face = e.lock;
        if (e.ws <= 0) {
          if (d < 290 && Math.abs(U.angDiff(e.lock, Ens.toPlayer(e, G))) < 0.9) G.hurtPlayer(26, e);
          G.shake(6); MB.Audio.play('lash');
          for (let i = 0; i < 10; i++) { const aa = e.lock + U.rnd(-0.9, 0.9); G.particle({ x: e.x + Math.cos(aa) * 220, y: e.y + Math.sin(aa) * 220, vx: 0, vy: -40, life: 0.4, color: '#e8f4f4', r: 3 }); }
          e.state = 'up'; e.atk = 1.1;
        }
      } else if (e.state === 'spitAim') {
        Ens.stop(e, dt, 10); e.ws -= dt; e.lock += U.angDiff(e.lock, Ens.toPlayer(e, G)) * Math.min(1, dt * 3); e.face = e.lock;
        if (e.ws <= 0) {
          const n = 5 + ph * 2;
          for (let i = 0; i < n; i++) G.enemyShot({ x: e.x + Math.cos(e.lock) * 50, y: e.y + Math.sin(e.lock) * 50, a: e.lock + (i - (n - 1) / 2) * 0.1, speed: 380, r: 10, dmg: 12, color: '#8a7a4a', owner: e, life: 2 });
          MB.Audio.play('spit'); e.volley--;
          if (e.volley > 0) e.ws = 0.4; else { e.state = 'up'; e.atk = 1.2; }
        }
      } else if (e.state === 'flopAim') {
        Ens.stop(e, dt, 10); e.st -= dt; e.face = Math.atan2(e.ty - e.y, e.tx - e.x);
        if (e.st <= 0) { e.state = 'air'; e.st = 0.6; e.airborne = true; e.fx0 = e.x; e.fy0 = e.y; }
      } else if (e.state === 'air') {
        e.st -= dt; const kk = 1 - e.st / 0.6;
        e.x = U.lerp(e.fx0, e.tx, kk); e.y = U.lerp(e.fy0, e.ty, kk); e.vx = e.vy = 0;
        if (e.st <= 0) {
          e.airborne = false; e.state = 'beached'; e.st = 2.6; e.flopT = ph === 2 ? 9 : 7;
          G.explosion(e.x, e.y, 140, 0, { player: 30, knock: 340, color: '#8a7a4a', ring: '200,190,140', obstacles: false, enemies: false });
          G.text(e.x, e.y - 70, 'MẮC CẠN!', '#ffd84a', 16);
        }
      } else if (e.state === 'beached') {
        Ens.stop(e, dt, 10); e.st -= dt; e.face += Math.sin(G.time * 12) * 0.08;
        if (e.st <= 0) { e.state = 'slide'; e.st = 0.8; e.fx0 = e.x; e.fy0 = e.y; const q = edgePt(Math.atan2((e.y - POND.y) / POND.ry, (e.x - POND.x) / POND.rx), 0.6); e.tx = q.x; e.ty = q.y; }
      } else if (e.state === 'slide') {
        e.st -= dt; const kk = 1 - e.st / 0.8;
        e.x = U.lerp(e.fx0, e.tx, kk); e.y = U.lerp(e.fy0, e.ty, kk); e.vx = e.vy = 0;
        if (e.st <= 0) { e.state = 'sub'; e.st = 2; G.burst(e.x, e.y, '#c8e8e8', 30, 220); }
      }
    },
    tele(ctx, e, G) {
      if (e.state === 'whiskAim') { const k = 1 - e.ws / 0.65; ctx.fillStyle = `rgba(255,70,70,${0.12 + k * 0.25})`; ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.arc(e.x, e.y, 290, e.lock - 0.9, e.lock + 0.9); ctx.closePath(); ctx.fill(); }
      if (e.state === 'spitAim') { const k = 1 - e.ws / 0.55; ctx.fillStyle = `rgba(200,170,90,${0.08 + k * 0.18})`; ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.arc(e.x, e.y, 500, e.lock - 0.5, e.lock + 0.5); ctx.closePath(); ctx.fill(); }
      if (e.state === 'rise') { ctx.strokeStyle = 'rgba(200,240,240,.7)'; ctx.lineWidth = 3; U.circle(ctx, e.x, e.y, 70 * (1 - e.st / 0.6) + 20); ctx.stroke(); }
    },
    draw(ctx, e, G) {
      const t = G.time, sub = e.state === 'sub' || e.state === 'rise';
      const lift = e.airborne ? Math.sin((1 - e.st / 0.6) * Math.PI) : 0;
      if (sub) {
        // chỉ thấy vây lưng rẽ nước
        ctx.strokeStyle = 'rgba(220,240,240,.55)'; ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) { const r = 20 + ((t * 1.5 + i / 3) % 1) * 50; ctx.beginPath(); ctx.ellipse(e.x, e.y, r * 1.4, r * 0.7, e.face, 0, U.TAU); ctx.stroke(); }
        ctx.fillStyle = 'rgba(40,40,30,.4)'; U.ellipse(ctx, e.x, e.y, 60, 22); ctx.fill();
        ctx.fillStyle = '#4a4a3a'; ctx.beginPath(); ctx.moveTo(e.x - 6, e.y); ctx.lineTo(e.x + 4, e.y - 26); ctx.lineTo(e.x + 16, e.y); ctx.fill();
        return;
      }
      ctx.fillStyle = 'rgba(0,0,0,.3)'; U.ellipse(ctx, e.x + 8, e.y + 14, 80, 30); ctx.fill();
      ctx.save(); ctx.translate(e.x, e.y - lift * 70); ctx.rotate(e.face || 0); ctx.scale(1 + lift * 0.15, 1 + lift * 0.15);
      const sw = Math.sin(t * (e.state === 'beached' ? 14 : 4)) * 0.2;
      // đuôi
      ctx.fillStyle = '#5a5a48'; ctx.beginPath(); ctx.moveTo(-60, 0); ctx.lineTo(-104, -26 + sw * 40); ctx.lineTo(-96, 0); ctx.lineTo(-104, 26 + sw * 40); ctx.fill();
      // thân cá tra: lưng xám, bụng bạc
      const gr = ctx.createLinearGradient(0, -32, 0, 32); gr.addColorStop(0, '#4a4e44'); gr.addColorStop(0.5, '#8a8e80'); gr.addColorStop(1, '#c8ccc0');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.ellipse(-4, 0, 70, 32, 0, 0, U.TAU); ctx.fill();
      ctx.fillStyle = '#5a5e52'; ctx.beginPath(); ctx.moveTo(-18, -28); ctx.lineTo(-4, -50); ctx.lineTo(8, -28); ctx.fill();
      // vết virus
      ctx.fillStyle = 'rgba(150,255,90,.5)'; for (let i = 0; i < 6; i++) { U.circle(ctx, -40 + i * 13, Math.sin(i * 2) * 12, 3 + (i % 2) * 2); ctx.fill(); }
      // đầu bẹt, miệng rộng
      ctx.fillStyle = '#6a6e60'; ctx.beginPath(); ctx.ellipse(52, 0, 30, 30, 0, 0, U.TAU); ctx.fill();
      ctx.fillStyle = '#2a1a1a'; ctx.beginPath(); ctx.ellipse(76, 0, 8, 20, 0, 0, U.TAU); ctx.fill();
      // râu dài
      const wk = e.state === 'whiskAim' ? (1 - e.ws / 0.65) : 0;
      ctx.strokeStyle = '#3a3a2a'; ctx.lineWidth = 4; ctx.lineCap = 'round';
      for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(70, sd * 14); ctx.quadraticCurveTo(100, sd * (40 + wk * 60) + Math.sin(t * 3) * 6, 120 + wk * 60, sd * (70 + wk * 80)); ctx.stroke(); }
      ctx.lineWidth = 2; for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(68, sd * 20); ctx.quadraticCurveTo(84, sd * 40, 80, sd * 54); ctx.stroke(); }
      const eye = e.enrageT > 0 ? '#ff3a3a' : '#e8f04a';
      ctx.fillStyle = eye; U.circle(ctx, 60, -18, 5); ctx.fill(); U.circle(ctx, 60, 18, 5); ctx.fill();
      ctx.fillStyle = '#100808'; U.circle(ctx, 62, -18, 2); ctx.fill(); U.circle(ctx, 62, 18, 2); ctx.fill();
      ctx.restore();
    },
  });

  /* ---------- bản đồ ---------- */
  const rng = U.seeded(1919);
  const obstacles = [];
  const CELL = 50;
  // sông Hậu (chừa lối ghe chợ nổi)
  obstacles.push({ kind: 'mtWater', shape: 'box', x: MARKET.x0 / 2, y: (RIV.y0 + RIV.y1) / 2, w: MARKET.x0, h: RIV.y1 - RIV.y0, rot: 0, noShot: true, water: true });
  obstacles.push({ kind: 'mtWater', shape: 'box', x: (MARKET.x1 + WW) / 2, y: (RIV.y0 + RIV.y1) / 2, w: WW - MARKET.x1, h: RIV.y1 - RIV.y0, rot: 0, noShot: true, water: true });
  // rạch + cầu khỉ
  for (const C of [C1, C2]) {
    obstacles.push({ kind: 'mtWater', shape: 'box', x: (C.x0 + C.x1) / 2, y: (C.y0 + C.bridge - BR / 2) / 2, w: C.x1 - C.x0, h: C.bridge - BR / 2 - C.y0, rot: 0, noShot: true, water: true });
    obstacles.push({ kind: 'mtWater', shape: 'box', x: (C.x0 + C.x1) / 2, y: (C.bridge + BR / 2 + C.y1) / 2, w: C.x1 - C.x0, h: C.y1 - C.bridge - BR / 2, rot: 0, noShot: true, water: true });
  }
  // đầm của Thuỷ Quái (ô 50)
  for (let y = POND.y - POND.ry - CELL; y < POND.y + POND.ry + CELL; y += CELL) {
    let run = -1;
    for (let x = POND.x - POND.rx - CELL * 2; x <= POND.x + POND.rx + CELL * 2; x += CELL) {
      const w = inPond(x + CELL / 2, y + CELL / 2, -14);
      if (w && run < 0) run = x;
      if (!w && run >= 0) { obstacles.push({ kind: 'mtWater', shape: 'box', x: (run + x) / 2, y: y + CELL / 2, w: x - run, h: CELL + 2, rot: 0, noShot: true, water: true }); run = -1; }
    }
  }
  // ghe chợ nổi: kín lối qua sông (đi trên ghe), cùng vài ghe neo ngoài sông
  let gv = 0;
  for (let y = RIV.y0 + 30; y < RIV.y1 - 20; y += 62) for (let x = MARKET.x0 + 40; x < MARKET.x1 - 30; x += 120) obstacles.push({ kind: 'ghe', shape: 'box', x: x + (((y / 62) | 0) % 2) * 30, y, w: 110, h: 46, rot: 0, noMove: true, noShot: true, v: gv++ });
  for (const [x, y, r] of [[1250, 1380, 0.2], [1950, 1540, -0.15], [2150, 1360, 0.1], [1150, 1560, -0.1], [2400, 1460, 0.25]]) obstacles.push({ kind: 'ghe', shape: 'box', x, y, w: 110, h: 46, rot: r, noMove: true, noShot: true, v: gv++, float: true });
  // nhà sàn ven sông
  const houses = [[300, 1150], [700, 1150], [1250, 1150], [2050, 1150], [2500, 1150], [3300, 1150], [3800, 1150], [500, 1780], [1200, 1780], [2100, 1780], [3100, 1780], [3900, 1780], [3000, 2700], [2200, 2700]];
  for (const [x, y] of houses) obstacles.push({ kind: 'nhaSan', shape: 'box', x, y, w: 150, h: 90, rot: 0, tall: 46 });
  // vườn dừa + vườn cây trái
  const free = (x, y, r) => !inPond(x, y, 230) && !(y > RIV.y0 - 120 && y < RIV.y1 + 120) && !(Math.abs(x - (C1.x0 + C1.x1) / 2) < 110 && y < RIV.y0) && !(Math.abs(x - (C2.x0 + C2.x1) / 2) < 110 && y > RIV.y1)
    && !obstacles.some((o) => (o.kind === 'palm' || o.kind === 'vtree' || o.kind === 'nhaSan') && Math.hypot(o.x - x, o.y - y) < r + (o.r || o.hw || 40) + 30)
    && Math.hypot(x - 250, y - 500) > 200 && !(Math.abs(y - (C1.bridge)) < 90 && Math.abs(x - 985) < 220) && !(Math.abs(y - (C2.bridge)) < 90 && Math.abs(x - 2725) < 220);
  for (let i = 0; i < 160; i++) {
    const x = 60 + rng() * (WW - 120), y = 60 + rng() * (WH - 120);
    const r = 26 + rng() * 10;
    if (!free(x, y, r)) continue;
    // ruộng lúa phía Tây Nam để trống
    if (x < 2550 && y > 2050 && x > 400) continue;
    if (rng() < 0.6) obstacles.push({ kind: 'palm', shape: 'circle', x, y, r });
    else obstacles.push({ kind: 'vtree', shape: 'circle', x, y, r: 24, sp: 'locvung', lean: 0, tall: 100 });
  }
  const CLUE = { x: 3050, y: 2600 };

  MB.registerGate({
    id: 19, seed: 1919, view3d: true, act: 2,
    title: 'GATE 19 — MIỀN TÂY', subtitle: 'Chín rồng ra biển',
    world: { w: WW, h: WH }, bg: '#3a5a2a', mmColor: 'rgba(120,170,90,.7)',
    scale: { hp: 3.0, dmg: 1.8 },
    start: { x: 250, y: 500 },
    obstacles, hazards: [],
    crates: [{ x: 600, y: 300 }, { x: 1500, y: 900 }, { x: 3000, y: 500 }, { x: 1300, y: 2300 }, { x: 2300, y: 2500 }, { x: 3900, y: 2800 }],
    spawnPoints: [
      { x: 600, y: 150 }, { x: 600, y: 1000 }, { x: 1500, y: 300 }, { x: 2400, y: 600 }, { x: 3300, y: 300 }, { x: 4000, y: 900 },
      { x: 300, y: 2200 }, { x: 1000, y: 2850 }, { x: 2000, y: 2100 }, { x: 2400, y: 2850 }, { x: 3200, y: 1900 }, { x: 4050, y: 2700 },
    ],
    waves: [
      { total: 36, maxAlive: 16, mix: { zombie: 3, runner: 4, mudCroc: 3, coconutMonkey: 3, goatDrone: 1 }, interval: [0.38, 0.75], elite: 0.2 },
      { total: 40, maxAlive: 17, mix: { mudCroc: 4, coconutMonkey: 4, runner: 3, licker: 2, riot: 2 }, interval: [0.36, 0.72], elite: 0.24 },
      { total: 46, maxAlive: 19, mix: { mudCroc: 5, coconutMonkey: 4, licker: 3, riot: 3, goatDrone: 2, runner: 2 }, interval: [0.33, 0.68], elite: 0.28 },
    ],
    boss: { type: 'mekongCat', x: POND.x, y: POND.y, fixed: true },
    intro: { title: 'MÀN 2 · NHIỆM VỤ', text: 'Miền Tây — một mình. Qua cầu khỉ, băng sông Hậu trên ghe chợ nổi Cái Răng, xuống đầm phía Đông Nam. Nước lớn dâng theo đợt — bãi ven sông sẽ ngập.' },
    objectives: [
      { title: 'VƯỜN DỪA', text: 'Khỉ Ném Dừa ném trái dừa nổ vào vòng cam — đừng đứng yên. Rạch nước chỉ qua được bằng cầu khỉ.' },
      { title: 'CHỢ NỔI CÁI RĂNG', text: 'Đi trên ghe để qua sông Hậu. Cá Sấu Bùn lặn dưới bùn — thấy gợn bùn thì lùi lại.' },
      { title: 'RUỘNG LÚA', text: 'Wave cuối. Đầm của Thuỷ Quái ở phía Đông Nam, qua cầu khỉ thứ hai.' },
      { title: 'BOSS · THUỶ QUÁI CỬU LONG', text: 'Khi lặn thì không trúng đạn — chờ nó trồi lên. Râu quất hình quạt đỏ ở gần; phun bùn ở xa. Khi nó phóng lên bờ và MẮC CẠN, dồn toàn lực!' },
    ],
    challenges: [
      { id: 'buoys', type: 'destroy', name: 'Phao Phát Tín Hiệu', desc: 'Phá 4 phao tín hiệu đầu dê dọc kênh rạch', kind: 'goatCrate', r: 22, hp: 400,
        spawner: { type: 'coconutMonkey', every: 7, range: 700, cap: 5 },
        targets: [{ x: 1150, y: 300 }, { x: 2600, y: 1000 }, { x: 900, y: 1900 }, { x: 2950, y: 2900 }], reward: { mod: 'split' } },
      { id: 'market', type: 'hold', name: 'Chợ Nổi Cái Răng', desc: 'Giữ lối ghe chợ nổi 16 giây', zone: { x: (MARKET.x0 + MARKET.x1) / 2, y: (RIV.y0 + RIV.y1) / 2, r: 90 }, time: 16,
        mix: { mudCroc: 2, coconutMonkey: 1 }, spawnEvery: 1.5, reward: { mod: 'barrel' } },
      { id: 'streak', type: 'streak', name: 'Chín Rồng', desc: '27 hạ gục liên tiếp không trúng đòn', count: 27, reward: { mod: 'mag' } },
    ],
    clue: { x: CLUE.x, y: CLUE.y, title: 'Ghi chép số 9 — Miền Tây', text: [
      'Ngày 60. GoatEvil không phải một con người. Nó là chương trình chỉ huy của Hội đồng Mười Hai — điều khiển bầy quái qua tín hiệu đầu dê.',
      'Tôi viết những dòng mã đầu tiên cho nó. Hội đồng cho nó một giọng nói, và một cơn đói.',
      'Hạnh đã cố ngăn tôi ở đây, mười hai năm trước. Thất Sơn là nơi tín hiệu mạnh nhất — nơi GoatEvil có hình hài.',
    ] },
    comms: [
      { on: 'start', t: 2.5, lines: [['HUNTER', 'Không có Dian. Tốt thôi — tôi quen đi một mình rồi.']] },
      { on: 'start', t: 9, lines: [['CÔ HẠNH', 'Hunter, tôi là Hạnh — trợ lý cũ của giáo sư Ted. Dian đưa tôi tần số này. Cậu ấy vẫn lo cho cậu.'], ['HUNTER', '…Chỉ đường cho tôi.']] },
      { on: 'start', t: 20, lines: [['GOATEVIL', 'Bạn đồng hành bỏ đi rồi sao, Hunter? Con người luôn như vậy.']] },
      { on: 'wave', wave: 2, lines: [['CÔ HẠNH', 'Nước lớn sắp lên — bãi ven sông sẽ ngập. Đi trên ghe chợ nổi để qua sông Hậu.']] },
      { on: 'wave', wave: 3, lines: [['CÔ HẠNH', 'Tín hiệu đầu dê dưới cái đầm phía Đông Nam. Có thứ gì đó rất lớn dưới đó.']] },
      { on: 'low', lines: [['CÔ HẠNH', 'Lùi lại! Đừng để bị dồn xuống nước!']] },
      { on: 'boss', lines: [['GOATEVIL', 'Chín con rồng ra biển — và một con quái ở lại. Nó đã ăn virus của ta suốt mười hai năm.'], ['CÔ HẠNH', 'Nó lặn thì đạn vô ích. Chờ nó trồi lên!']] },
      { on: 'phase', phase: 2, lines: [['CÔ HẠNH', 'Nó phóng lên bờ được! Né vòng đỏ — khi nó mắc cạn là cơ hội của cậu.']] },
      { on: 'won', lines: [['HUNTER', 'GoatEvil là một chương trình… của Hội đồng.'], ['CÔ HẠNH', 'Và nó có hình hài ở Thất Sơn. Tôi đi cùng cậu tới đó.'], ['DIAN', '…Tôi cũng vậy. Nếu cậu còn cho tôi đi cùng.']] },
    ],
    light3d: { hemiSky: 0xfff0d8, hemiGround: 0x4a5a2a, hemi: 1.45, sun: 0xffe8c0, sunI: 1.6, exposure: 1.3 },

    setup(G) {
      G.__over = null;
      G.gs.tideT = 22; G.gs.warn = 0;
    },
    update(G, dt) {
      const s = G.gs;
      if (G.state === 'fight' || G.state === 'break') {
        if (s.warn <= 0) { s.tideT -= dt; if (s.tideT <= 0) { s.warn = 2.2; MB.HUD.toast('<b>NƯỚC LỚN!</b> Bãi ven sông sắp ngập', '#7ac8d8'); MB.Audio.play('boss'); } }
      }
      if (s.warn > 0) {
        s.warn -= dt;
        if (s.warn <= 0) {
          s.tideT = U.rnd(24, 30);
          for (let x = 80; x < WW; x += 150) for (const y of [RIV.y0 - 70, RIV.y1 + 70]) if (x < MARKET.x0 - 60 || x > MARKET.x1 + 60) G.addHazard({ kind: 'tide', x: x + U.rnd(-20, 20), y: y + U.rnd(-15, 15), r: 90, slowMul: 0.55, dps: 3, life: 12 });
        }
      }
    },
    drawUnder(G, ctx) {
      const t = G.time;
      // sóng nước sông / rạch / đầm
      ctx.strokeStyle = 'rgba(240,230,200,.25)'; ctx.lineWidth = 2;
      for (let i = 0; i < 40; i++) { const x = ((i * 113 + t * 25) % WW), y = RIV.y0 + 30 + (i * 37) % (RIV.y1 - RIV.y0 - 60); if (x > MARKET.x0 - 10 && x < MARKET.x1 + 10) continue; ctx.beginPath(); ctx.moveTo(x - 14, y); ctx.quadraticCurveTo(x, y - 4, x + 14, y); ctx.stroke(); }
      for (let i = 0; i < 10; i++) { const a = i * 1.9 + t * 0.06, x = POND.x + Math.cos(a) * POND.rx * 0.6 * ((i % 4) / 4 + 0.25), y = POND.y + Math.sin(a * 1.3) * POND.ry * 0.6 * ((i % 3) / 3 + 0.25); ctx.beginPath(); ctx.moveTo(x - 12, y); ctx.quadraticCurveTo(x, y - 4, x + 12, y); ctx.stroke(); }
      // lục bình trôi
      ctx.fillStyle = '#4a8a3a'; for (let i = 0; i < 16; i++) { const x = ((i * 271 + t * 18) % (WW + 100)) - 50, y = RIV.y0 + 40 + (i * 61) % (RIV.y1 - RIV.y0 - 80); if (x > MARKET.x0 - 30 && x < MARKET.x1 + 30) continue; U.circle(ctx, x, y, 9); ctx.fill(); ctx.fillStyle = '#a87ad8'; U.circle(ctx, x + 2, y - 2, 3); ctx.fill(); ctx.fillStyle = '#4a8a3a'; }
    },
    drawOver(G, ctx) { VN.drawOver(G, ctx); },
    drawScreen(G, ctx) {
      // nắng chiều miền sông nước
      const gr = ctx.createLinearGradient(0, 0, G.W, G.H); gr.addColorStop(0, 'rgba(255,220,150,.14)'); gr.addColorStop(1, 'rgba(255,170,90,.08)');
      ctx.fillStyle = gr; ctx.fillRect(0, 0, G.W, G.H);
    },

    buildGround(g, w, h, rand) {
      g.fillStyle = '#5a7a3a'; g.fillRect(0, 0, w, h);
      GK.patches(g, rand, w, h, 260, ['rgba(90,120,50,.35)', 'rgba(60,80,30,.3)', 'rgba(140,120,70,.15)'], 40, 160);
      // ruộng lúa phía Tây Nam: ô ruộng xanh + bờ đất
      for (let x = 420; x < 2560; x += 200) for (let y = 2060; y < 2960; y += 150) {
        g.fillStyle = (((x / 200) | 0) + ((y / 150) | 0)) % 3 ? '#7aa83a' : '#9ac04a'; g.fillRect(x + 6, y + 6, 188, 138);
        g.strokeStyle = 'rgba(60,90,30,.35)'; g.lineWidth = 1; for (let i = 12; i < 138; i += 10) { g.beginPath(); g.moveTo(x + 8, y + 6 + i); g.lineTo(x + 192, y + 6 + i); g.stroke(); }
      }
      // bãi bùn ven sông
      g.fillStyle = '#7a6a48'; g.fillRect(0, RIV.y0 - 80, w, 80); g.fillRect(0, RIV.y1, w, 80);
      // sông Hậu (phù sa)
      const rg = g.createLinearGradient(0, RIV.y0, 0, RIV.y1); rg.addColorStop(0, '#8a7a52'); rg.addColorStop(0.5, '#9a8a5e'); rg.addColorStop(1, '#8a7a52');
      g.fillStyle = rg; g.fillRect(0, RIV.y0, w, RIV.y1 - RIV.y0);
      // rạch
      g.fillStyle = '#8a7a52'; for (const C of [C1, C2]) g.fillRect(C.x0, C.y0, C.x1 - C.x0, C.y1 - C.y0);
      g.fillStyle = '#6a5a3a'; for (const C of [C1, C2]) { g.fillRect(C.x0 - 10, C.y0, 10, C.y1 - C.y0); g.fillRect(C.x1, C.y0, 10, C.y1 - C.y0); }
      // cầu khỉ: một cây tre làm lối + tay vịn, cọc chống chéo
      for (const C of [C1, C2]) {
        const y = C.bridge;
        g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(C.x0 - 20, y - BR / 2 + 18, C.x1 - C.x0 + 40, BR - 10);
        g.fillStyle = '#7a6a48'; g.fillRect(C.x0 - 20, y - BR / 2 + 6, C.x1 - C.x0 + 40, BR - 12);
        g.fillStyle = '#c8b070'; g.fillRect(C.x0 - 30, y - 7, C.x1 - C.x0 + 60, 14);
        g.strokeStyle = '#a8904a'; g.lineWidth = 3; g.beginPath(); g.moveTo(C.x0 - 30, y - 30); g.lineTo(C.x1 + 30, y - 30); g.moveTo(C.x0 - 30, y + 30); g.lineTo(C.x1 + 30, y + 30); g.stroke();
        g.lineWidth = 4; for (const xx of [C.x0 + 10, (C.x0 + C.x1) / 2, C.x1 - 10]) { g.beginPath(); g.moveTo(xx - 12, y - 34); g.lineTo(xx + 12, y + 34); g.moveTo(xx + 12, y - 34); g.lineTo(xx - 12, y + 34); g.stroke(); }
      }
      // lối ghe chợ nổi: nước giữa các ghe
      g.fillStyle = '#8a7a52'; g.fillRect(MARKET.x0, RIV.y0, MARKET.x1 - MARKET.x0, RIV.y1 - RIV.y0);
      // đầm
      g.fillStyle = '#6a6a3a'; g.beginPath(); g.ellipse(POND.x, POND.y, POND.rx + 40, POND.ry + 40, 0, 0, U.TAU); g.fill();
      const pg = g.createRadialGradient(POND.x, POND.y, 20, POND.x, POND.y, POND.rx); pg.addColorStop(0, '#4a5a3a'); pg.addColorStop(1, '#6a7a4a');
      g.fillStyle = pg; g.beginPath(); g.ellipse(POND.x, POND.y, POND.rx, POND.ry, 0, 0, U.TAU); g.fill();
      // bờ đầm đất sét đỏ
      g.fillStyle = 'rgba(150,100,60,.4)'; g.beginPath(); g.ellipse(POND.x, POND.y, POND.rx + 230, POND.ry + 200, 0, 0, U.TAU); g.ellipse(POND.x, POND.y, POND.rx + 40, POND.ry + 40, 0, 0, U.TAU); g.fill('evenodd');
      // đường đất
      g.strokeStyle = 'rgba(160,130,90,.6)'; g.lineWidth = 40; g.lineCap = 'round';
      g.beginPath(); g.moveTo(250, 500); g.lineTo(C1.x0 - 40, C1.bridge); g.moveTo(C1.x1 + 40, C1.bridge); g.lineTo(1600, 900); g.lineTo(1600, RIV.y0 - 60);
      g.moveTo(1600, RIV.y1 + 60); g.lineTo(1800, 1950); g.lineTo(C2.x0 - 40, C2.bridge); g.moveTo(C2.x1 + 40, C2.bridge); g.lineTo(POND.x - POND.rx - 120, POND.y); g.stroke();
      GK.vignette(g, w, h, 0.3);
    },

    /* ---------- 3D ---------- */
    models3d: {
      mudCroc: (K) => ({
        base: 20,
        build() {
          const T = K.T, g = new T.Group(), skin = K.std(0x4a5a2a, { rough: 0.9, flat: true });
          const body = K.mesh(K.sph(12, 10), skin, -4, 9, 0); body.scale.set(2.4, 0.7, 1); g.add(body);
          const tail = K.mesh(K.cyl(1, 8, 36, 6), skin, -40, 7, 0); tail.rotation.z = Math.PI / 2; g.add(tail);
          const jaw = K.mesh(K.box(30, 5, 14), skin, 26, 8, 0); g.add(jaw);
          const top = K.mesh(K.box(30, 5, 14), K.std(0x5a6a32, { flat: true }), 26, 13, 0); g.add(top);
          for (const z of [-5, 5]) g.add(K.mesh(K.sph(2.2, 6), K.glowMat(0xf2e86a, 2), 14, 17, z, false));
          for (const [x, z] of [[10, -13], [10, 13], [-16, -13], [-16, 13]]) g.add(K.mesh(K.box(8, 5, 6), skin, x, 3, z));
          g.userData = { tail, top, h: 22 }; return g;
        },
        anim(e, m, G) { const d = m.userData; d.tail.rotation.y = Math.sin(G.time * 8 + e.t) * 0.3; d.top.rotation.z = e.state === 'up' ? 0.3 + Math.sin(G.time * 10) * 0.1 : 0; m.visible = !e.hidden; },
      }),
      coconutMonkey: (K) => ({
        base: 15,
        build() {
          const T = K.T, g = new T.Group(), fur = K.std(0x7a5028, { rough: 0.9 });
          const body = K.mesh(K.sph(10, 8), fur, 0, 16, 0); body.scale.set(1, 1.2, 0.9); g.add(body);
          g.add(K.mesh(K.sph(8, 8), K.std(0x8a6038), 6, 32, 0), K.mesh(K.sph(4, 6), K.std(0xd8b088), 11, 31, 0));
          for (const z of [-3, 3]) g.add(K.mesh(K.sph(1.3, 6), K.glowMat(0xff3a3a, 3), 13, 34, z, false));
          const arm = K.mesh(K.cyl(2, 2, 18, 5), fur, 0, 30, -10); g.add(arm);
          const nut = K.mesh(K.sph(6, 8), K.std(0x5a4020), 0, 40, -12); g.add(nut);
          const tail = K.mesh(K.cyl(1.5, 1.5, 26, 5), fur, -12, 14, 0); tail.rotation.z = 0.9; g.add(tail);
          g.add(K.mesh(K.box(2, 2, 18), K.std(0xc8302a), 4, 26, 0));
          g.userData = { arm, nut, h: 40 }; return g;
        },
        anim(e, m, G) { const d = m.userData, aim = e.state === 'aim'; d.arm.rotation.x = aim ? -1.2 : Math.sin(G.time * 10 + e.t) * 0.4; d.nut.visible = aim; },
      }),
      mekongCat: (K) => ({
        base: 56,
        build() {
          const T = K.T, g = new T.Group(), back = K.std(0x5a5e52, { own: true, rough: 0.6, metal: 0.2 }), belly = K.std(0xc8ccc0, { rough: 0.5 });
          const fish = new T.Group(); g.add(fish);
          const body = K.mesh(K.sph(32, 16), back, -4, 30, 0); body.scale.set(2.3, 1, 1.05); fish.add(body);
          const bel = K.mesh(K.sph(30, 14), belly, -4, 22, 0); bel.scale.set(2.1, 0.6, 0.95); fish.add(bel);
          const head = K.mesh(K.sph(30, 14), back, 52, 28, 0); head.scale.set(1, 0.8, 1.05); fish.add(head);
          fish.add(K.mesh(K.box(6, 14, 34), K.std(0x2a1a1a), 80, 24, 0));
          const fin = new T.Mesh(K.G3('catfin', () => new T.ConeGeometry(1, 1, 3)), back); fin.scale.set(16, 30, 4); fin.position.set(-10, 64, 0); fish.add(fin);
          const tail = new T.Group(); tail.position.set(-72, 30, 0); fish.add(tail);
          const tf = K.mesh(K.box(40, 6, 54), back, -22, 0, 0); tf.rotation.x = Math.PI / 2; tail.add(tf);
          const wh = [];
          for (const z of [-1, 1]) { const w = K.mesh(K.cyl(1.6, 3, 90, 5), K.std(0x3a3a2a), 120, 24, z * 40); w.rotation.z = Math.PI / 2; w.rotation.y = z * 0.6; fish.add(w); wh.push(w); }
          for (const z of [-18, 18]) fish.add(K.mesh(K.sph(4, 8), K.glowMat(0xe8f04a, 2.4), 64, 38, z, false));
          for (let i = 0; i < 6; i++) fish.add(K.mesh(K.sph(3 + (i % 2) * 2, 6), K.glowMat(0x9aff5a, 1.6), -40 + i * 13, 52, Math.sin(i * 2) * 14, false));
          g.userData = { fish, tail, wh, h: 70 }; return g;
        },
        anim(e, m, G) {
          const d = m.userData, sub = e.state === 'sub' || e.state === 'rise';
          d.tail.rotation.y = Math.sin(G.time * (e.state === 'beached' ? 14 : 4)) * 0.4;
          d.fish.position.y = sub ? -52 + (e.state === 'rise' ? (1 - e.st / 0.6) * 40 : 0) : 0;
          d.wh.forEach((w, i) => { w.rotation.y = (i ? 1 : -1) * (0.6 + (e.state === 'whiskAim' ? (1 - e.ws / 0.65) * 0.8 : Math.sin(G.time * 3) * 0.1)); });
          m.position.y = e.airborne ? Math.sin((1 - e.st / 0.6) * Math.PI) * 80 : 0;
        },
      }),
    },
    props3d: {
      mtWater: (o, K) => new K.T.Group(),
      nhaSan: (o, K) => {
        const T = K.T, g = new T.Group(), wood = K.std(0x8a6a44, { rough: 0.9 }), thatch = K.std(0xa8904a, { own: true, transparent: true, rough: 1, flat: true });
        for (const x of [-o.hw + 6, 0, o.hw - 6]) for (const z of [-o.hh + 6, o.hh - 6]) g.add(K.mesh(K.cyl(2.5, 2.5, 18, 6), K.std(0x4a3420), x, 9, z));
        g.add(K.mesh(K.box(o.w, 4, o.h), wood, 0, 19, 0), K.mesh(K.box(o.w - 10, 24, o.h - 10), wood, 0, 33, 0));
        const r = new T.Mesh(K.G3('nsroof', () => { const s = new T.Shape(); s.moveTo(-0.5, 0); s.lineTo(0, 0.5); s.lineTo(0.5, 0); s.closePath(); const ge = new T.ExtrudeGeometry(s, { depth: 1, bevelEnabled: false }); ge.translate(0, 0, -0.5); return ge; }), thatch);
        r.scale.set(o.w + 20, 50, o.h + 20); r.rotation.y = Math.PI / 2; r.scale.set(o.h + 24, 50, o.w + 20); r.position.y = 44; g.add(r);
        g.userData.canopy = [thatch]; return g;
      },
      ghe: (o, K) => {
        const T = K.T, g = new T.Group(), hull = K.std(0x5a3a22, { rough: 0.8 });
        const b = K.mesh(K.sph(1, 12), hull, 0, 4, 0); b.scale.set(o.w / 2, 7, o.h / 2); g.add(b);
        g.add(K.mesh(K.box(o.w - 34, 2, o.h - 14), K.std(0x8a6440), 0, 9, 0));
        const P = PROD[o.v % PROD.length], pm = [K.std(new T.Color(P[0]).getHex()), K.std(new T.Color(P[1]).getHex())];
        for (let i = 0; i < 8; i++) g.add(K.mesh(K.sph(5.5, 7), pm[i % 2], -o.w / 2 + 30 + (i % 4) * 13, 14, -8 + ((i / 4) | 0) * 16, false));
        const bx = o.w * 0.25; g.add(K.mesh(K.cyl(1.2, 1.6, 90, 5), K.std(0xc8a860), bx, 50, 0));
        for (let i = 0; i < 3; i++) g.add(K.mesh(K.sph(5, 7), pm[i % 2], bx + 8, 86 - i * 10, 0, false));
        for (const z of [-1, 1]) g.add(K.mesh(K.sph(3, 6), K.std(0xc8302a), o.w / 2 - 12, 8, z * (o.h / 2 - 6), false));
        g.rotation.y = -(o.rot || 0);
        return g;
      },
    },
    hazards3d: { tide: { inner: 'rgba(160,210,220,.7)', outer: 'rgba(110,160,170,0)', opacity: 0.55 } },
    actors3d: Object.assign({}, MB.Story.actors3d),
  });
})(window.MB);
