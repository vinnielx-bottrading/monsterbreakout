/* Gate 13 — HẠ LONG: Vịnh di sản lúc hoàng hôn (Màn 2 · Nguồn Gốc)
   Thắng cảnh: núi đá vôi mọc giữa biển, Hòn Trống Mái (hai khối đá như đôi gà), làng chài nổi Cửa Vạn (nhà bè sơn xanh đỏ,
   lối ván gỗ), thuyền buồm nâu, thuyền thúng, bãi cát và cửa hang Sửng Sốt dưới vách đá phủ cây.
   Cơ chế: phần lớn bản đồ là biển — chỉ đi được trên lối ván, nhà bè, đảo đá và bãi cát; đạn bay qua mặt nước;
   sứa đột biến bay lên từ biển. Hoàng hôn vàng cam, sương biển trôi.
   Quái mới: Sứa Điện (bay, bắn cầu điện), Cua Đột Biến (giáp càng phía trước, lao ngang).
   Boss: THUỶ LONG VỊNH HẠ — rồng biển đột biến trồi lên ngoài bãi cát: phun tia nước, quật đuôi tạo sóng xung kích,
   lặn sang chỗ khác, gọi sứa; giai đoạn cuối đẩy sóng thần tràn qua bãi (chạy vào khe hở hoặc lộn né).
   Thử thách: phá 4 thùng lạnh đầu dê, giữ đài ngắm Hòn Trống Mái, 20 hạ gục liên tiếp. */
'use strict';
(function (MB) {
  const U = MB.U, Ens = MB.Enemies, GK = MB.GK, VN = MB.VN;
  const WW = 3800, WH = 2600;
  const H3 = 0.45;

  /* ---------- vùng đi được (còn lại là biển) ---------- */
  const WALK = [
    [60, 1210, 480, 1330],        // cầu tàu xuất phát
    [440, 1230, 1760, 1310],      // lối ván chính qua làng chài
    [680, 820, 750, 1740],        // lối ván dọc 1
    [1080, 820, 1150, 1740],      // lối ván dọc 2
    [1430, 640, 1500, 1740],      // lối ván dọc 3 (lên Hòn Trống Mái)
    [680, 1690, 1500, 1760],      // lối ván phía Nam
    [680, 800, 1150, 870],        // lối ván phía Bắc
    [1240, 360, 1780, 660],       // đảo đá Hòn Trống Mái (đài ngắm)
    [1740, 1230, 2320, 1310],     // cầu ván dài ra đảo lớn
    [2250, 1060, 3650, 2140],     // bãi cát đảo lớn (trước hang Sửng Sốt)
  ];
  // nhà bè: [x, y, màu tường]
  const RAFTS = [[560, 1110, '#3a86c8'], [880, 1120, '#d84a3a'], [880, 1440, '#2f9a7a'], [560, 1440, '#e8b830'], [1280, 1110, '#7a5ac8'],
    [1280, 1440, '#3a86c8'], [880, 940, '#e8b830'], [1280, 940, '#d84a3a'], [880, 1590, '#3a86c8'], [1280, 1590, '#2f9a7a']];
  for (const [x, y] of RAFTS) WALK.push([x - 95, y - 70, x + 95, y + 70]);
  const TM = { x: 1510, y: 470 };                  // Hòn Trống Mái
  const CAVE = { x: 3000, y: 1085 };               // cửa hang Sửng Sốt
  const SHORE = 2140;                              // mép nước bãi cát
  const inWalk = (x, y, pad) => WALK.some((r) => x > r[0] - pad && x < r[2] + pad && y > r[1] - pad && y < r[3] + pad);

  /* ---------- vẽ cảnh ---------- */
  // núi đá vôi giữa biển: chân đá xám, vách nhô cao (vẽ đè), đỉnh phủ cây xanh
  MB.Props.register('karst', (ctx, o) => {
    MB.Props.shadow(ctx, o.x + o.r * 0.5, o.y + o.r * 0.3, o.r * 1.15, o.r * 0.6, 0.3);
    ctx.fillStyle = 'rgba(255,255,255,.25)'; U.ellipse(ctx, o.x, o.y + o.r * 0.35, o.r * 1.05, o.r * 0.45); ctx.fill(); // bọt sóng quanh chân
    ctx.fillStyle = '#6a7268'; U.ellipse(ctx, o.x, o.y, o.r, o.r * 0.7); ctx.fill();
  });
  VN.over.karst = (ctx, o, G) => {
    const H = o.tall * H3, r = o.r, x = o.x, y = o.y;
    const R = U.seeded(o.x | 0);
    ctx.globalAlpha = VN.coverAlpha(G, x - r, y - H - r, x + r, y);
    // thân vách: vệt đá vôi dọc, loang rêu đen
    const gr = ctx.createLinearGradient(x - r, 0, x + r, 0); gr.addColorStop(0, '#9aa294'); gr.addColorStop(0.55, '#7a8478'); gr.addColorStop(1, '#4a544a');
    ctx.fillStyle = gr;
    ctx.beginPath(); ctx.moveTo(x - r, y);
    for (let i = 0; i <= 8; i++) { const k = i / 8; ctx.lineTo(x - r + (r * 0.25) * Math.sin(k * 3 + o.x) * 0.5 - k * 0, y - H * k); }
    ctx.lineTo(x - r * 0.75, y - H); ctx.quadraticCurveTo(x, y - H - r * 0.5, x + r * 0.75, y - H);
    for (let i = 8; i >= 0; i--) { const k = i / 8; ctx.lineTo(x + r + (r * 0.2) * Math.sin(k * 4 + o.y) * 0.5, y - H * k); }
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(40,46,40,.45)'; ctx.lineWidth = 2;
    for (let i = 0; i < 7; i++) { const sx = x - r * 0.8 + R() * r * 1.6; ctx.beginPath(); ctx.moveTo(sx, y - H * (0.1 + R() * 0.2)); ctx.lineTo(sx + (R() - 0.5) * 8, y - H * (0.6 + R() * 0.3)); ctx.stroke(); }
    for (let i = 0; i < 5; i++) { ctx.fillStyle = `rgba(30,40,30,${0.25 + R() * 0.2})`; U.ellipse(ctx, x - r * 0.7 + R() * r * 1.4, y - H * (0.2 + R() * 0.6), 4 + R() * 8, 8 + R() * 14); ctx.fill(); }
    // cây bụi bám vách + chỏm xanh
    for (let i = 0; i < 9; i++) { ctx.fillStyle = ['#3e6a34', '#4f7f3c', '#2f5a2c'][i % 3]; U.circle(ctx, x - r * 0.8 + R() * r * 1.6, y - H * (0.35 + R() * 0.55), 5 + R() * 7); ctx.fill(); }
    for (let i = 0; i < 12; i++) { ctx.fillStyle = ['#3e7a38', '#5a9a44', '#2f6030'][i % 3]; U.circle(ctx, x - r * 0.7 + R() * r * 1.4, y - H - r * 0.15 + (R() - 0.5) * r * 0.4, 8 + R() * 9); ctx.fill(); }
    ctx.globalAlpha = 1;
  };
  // Hòn Trống Mái: hai khối đá dựng như đôi gà chọi trên mỏm đảo
  MB.Props.register('trongMai', (ctx, o) => { MB.Props.shadow(ctx, o.x + 26, o.y + 14, o.r * 1.2, o.r * 0.55, 0.32); ctx.fillStyle = '#7a8072'; U.ellipse(ctx, o.x, o.y, o.r, o.r * 0.6); ctx.fill(); });
  VN.over.trongMai = (ctx, o, G) => {
    const x = o.x, y = o.y, H = o.tall * H3, s = o.r / 60;
    ctx.globalAlpha = VN.coverAlpha(G, x - 70 * s, y - H - 30, x + 70 * s, y);
    const shape = (dx, w, h, lean, col) => {
      ctx.fillStyle = col; ctx.beginPath();
      ctx.moveTo(x + dx - w * 0.35, y);
      ctx.bezierCurveTo(x + dx - w * 0.6, y - h * 0.4, x + dx - w * 0.7 + lean, y - h * 0.75, x + dx - w * 0.25 + lean, y - h);
      ctx.quadraticCurveTo(x + dx + w * 0.2 + lean, y - h * 1.08, x + dx + w * 0.45 + lean, y - h * 0.85);
      ctx.bezierCurveTo(x + dx + w * 0.35, y - h * 0.55, x + dx + w * 0.55, y - h * 0.2, x + dx + w * 0.3, y);
      ctx.closePath(); ctx.fill();
    };
    shape(-24 * s, 70 * s, H * 1.05, -10 * s, '#8a907e');   // "Trống" (cao hơn)
    shape(30 * s, 58 * s, H * 0.82, 12 * s, '#7a8270');     // "Mái"
    ctx.fillStyle = 'rgba(255,220,170,.18)'; shape(-30 * s, 30 * s, H * 1.0, -12 * s, 'rgba(255,220,170,.18)');
    for (let i = 0; i < 6; i++) { ctx.fillStyle = '#3e6a34'; U.circle(ctx, x + (i - 3) * 14 * s, y - H * (0.75 + (i % 2) * 0.12), 5 + (i % 3) * 2); ctx.fill(); }
    ctx.globalAlpha = 1;
  };
  // nhà bè làng chài: sàn ván, nhà gỗ sơn màu, mái tôn, cờ đỏ sao vàng nhỏ, phao xốp
  MB.Props.register('floatHouse', (ctx, o) => {
    const x = o.x - o.hw, y = o.y - o.hh, H = 46 * H3;
    VN.shadowBox(ctx, x, y - H, o.w, o.h, 46, 0.22);
    ctx.fillStyle = o.col; ctx.fillRect(x, y + o.h - H, o.w, H);
    ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.fillRect(x + o.w * 0.15, y + o.h - H * 0.75, o.w * 0.18, H * 0.45); ctx.fillRect(x + o.w * 0.62, y + o.h - H * 0.75, o.w * 0.18, H * 0.45);
    ctx.fillStyle = '#2a1a10'; ctx.fillRect(x + o.w * 0.42, y + o.h - H * 0.85, o.w * 0.14, H * 0.85);
  });
  VN.over.floatHouse = (ctx, o, G) => {
    const x = o.x - o.hw, y = o.y - o.hh, H = 46 * H3;
    ctx.globalAlpha = VN.coverAlpha(G, x, y - H, x + o.w, y + o.h - H);
    // mái tôn sóng
    ctx.fillStyle = o.roof; ctx.fillRect(x - 6, y - H - 4, o.w + 12, o.h + 4);
    ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 1.2; for (let xx = x - 4; xx < x + o.w + 6; xx += 6) { ctx.beginPath(); ctx.moveTo(xx, y - H - 4); ctx.lineTo(xx, y - H + o.h); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,255,255,.14)'; ctx.fillRect(x - 6, y - H - 4, o.w + 12, (o.h + 4) * 0.45);
    // cờ
    ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + o.w - 6, y - H); ctx.lineTo(x + o.w - 6, y - H - 30); ctx.stroke();
    const wv = Math.sin(G.time * 5 + o.x) * 2;
    ctx.fillStyle = '#d8261e'; ctx.beginPath(); ctx.moveTo(x + o.w - 6, y - H - 30); ctx.lineTo(x + o.w + 14, y - H - 26 + wv); ctx.lineTo(x + o.w - 6, y - H - 20); ctx.fill();
    ctx.fillStyle = '#f2d02a'; U.circle(ctx, x + o.w + 1, y - H - 25.5 + wv * 0.5, 1.8); ctx.fill();
    ctx.globalAlpha = 1;
  };
  // thùng lạnh đầu dê (mục tiêu thử thách)
  MB.Props.register('goatCrate', (ctx, o, t) => {
    const x = o.x, y = o.y, w = 46, h = 34;
    MB.Props.shadow(ctx, x + 8, y + 8, 28, 10, 0.3);
    ctx.fillStyle = o.flash > 0 ? '#ffffff' : '#c8d2d8'; U.rr(ctx, x - w / 2, y - h / 2 - 14, w, h + 14, 4); ctx.fill();
    ctx.fillStyle = '#8a969e'; ctx.fillRect(x - w / 2, y - h / 2 - 14, w, 10);
    ctx.fillStyle = '#7a0a10'; ctx.font = '900 16px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('♉', x, y + 2);
    const pul = 0.5 + Math.sin(t * 6 + x) * 0.5; ctx.fillStyle = `rgba(120,220,255,${0.4 + pul * 0.5})`; ctx.fillRect(x + w / 2 - 9, y - h / 2 - 11, 5, 4);
  });

  /* ---------- quái mới ---------- */
  Ens.register('seaJelly', Ens.make({
    name: 'Sứa Điện', r: 16, hp: 70, speed: 95, dmg: 12, score: 120, fly: true, blood: '#1a3a5a', gore: '#8ae8ff', knockMul: 1.2,
    draw(ctx, e, G) {
      const t = G.time, bob = Math.sin(t * 3 + e.t) * 4, pul = 1 + Math.sin(t * 4 + e.t) * 0.08;
      ctx.fillStyle = 'rgba(0,0,0,.2)'; U.ellipse(ctx, e.x + 6, e.y + 16, 14, 6); ctx.fill();
      // xúc tu
      ctx.strokeStyle = 'rgba(160,230,255,.55)'; ctx.lineWidth = 2;
      for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(e.x + i * 5, e.y + bob); for (let k = 1; k <= 4; k++) ctx.lineTo(e.x + i * 5 + Math.sin(t * 5 + k + i) * 3, e.y + bob + k * 6); ctx.stroke(); }
      const gr = ctx.createRadialGradient(e.x - 4, e.y - 8 + bob, 2, e.x, e.y - 4 + bob, 18 * pul);
      gr.addColorStop(0, 'rgba(240,255,255,.95)'); gr.addColorStop(0.5, 'rgba(110,210,255,.75)'); gr.addColorStop(1, 'rgba(60,120,255,.25)');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.ellipse(e.x, e.y - 4 + bob, 17 * pul, 13 * pul, 0, Math.PI, 0); ctx.quadraticCurveTo(e.x, e.y + 6 + bob, e.x - 17 * pul, e.y - 4 + bob); ctx.fill();
      if (e.state === 'aim') { ctx.strokeStyle = `rgba(200,250,255,${0.5 + Math.random() * 0.5})`; ctx.lineWidth = 1.5; ctx.beginPath(); for (let i = 0; i < 4; i++) { const a = Math.random() * U.TAU; ctx.moveTo(e.x, e.y - 4 + bob); ctx.lineTo(e.x + Math.cos(a) * 24, e.y - 4 + bob + Math.sin(a) * 24); } ctx.stroke(); }
    },
  }, Ens.AI.shooter({ cd: [2.2, 3.4], min: 150, max: 430, aim: 0.7, wig: { f: 1.5, a: 0.5 }, lineLen: 380,
    shot: (e, G, a) => { for (const k of [-0.18, 0, 0.18]) G.enemyShot({ x: e.x, y: e.y, a: a + k, speed: 250, r: 9, dmg: 11, color: '#9ff0ff', owner: e, life: 2.2 }); MB.Audio.play('shot_plasma'); } })));

  Ens.register('mutantCrab', {
    name: 'Cua Đột Biến', r: 23, hp: 240, speed: 95, dmg: 18, score: 200, blood: '#5a2a10', gore: '#ff8a4a', knockMul: 0.35,
    armorFn: Ens.AI.shieldFront(0.25, 0.9),
    init(e) { e.cd = U.rnd(1.5, 3); },
    update(e, G, dt) {
      const p = G.player, d = Ens.distPlayer(e, G);
      e.cd -= dt;
      if (e.state === 'wind') { Ens.stop(e, dt, 14); e.st -= dt; e.face = e.lock; if (e.st <= 0) { e.state = 'dash'; e.st = 0.38; e.vx = Math.cos(e.lock) * 560; e.vy = Math.sin(e.lock) * 560; MB.Audio.play('dash'); } }
      else if (e.state === 'dash') { e.st -= dt; e.face = e.lock; if (e.st <= 0) { e.state = null; e.cd = U.rnd(2.2, 3.4); } }
      else {
        Ens.steer(e, G, p.x, p.y, e.speed, dt);
        if (d < 260 && e.cd <= 0 && G.los(e.x, e.y, p.x, p.y)) { e.state = 'wind'; e.st = 0.55; e.lock = Ens.toPlayer(e, G); }
      }
    },
    tele(ctx, e, G) { if (e.state === 'wind') G.drawTelegraphLine(ctx, e.x, e.y, e.lock, 220, 1 - e.st / 0.55); },
    draw(ctx, e, G) {
      const t = G.time, walk = Math.sin(t * 14 + e.t) * (Math.hypot(e.vx, e.vy) > 20 ? 1 : 0.2);
      ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.face || 0);
      ctx.fillStyle = 'rgba(0,0,0,.28)'; U.ellipse(ctx, 4, 6, 26, 18); ctx.fill();
      ctx.strokeStyle = '#8a3a1a'; ctx.lineWidth = 4; ctx.lineCap = 'round';
      for (const sd of [-1, 1]) for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-6 + i * 6, sd * 12); ctx.lineTo(-10 + i * 7 + walk * (i % 2 ? 3 : -3), sd * 26); ctx.stroke(); }
      // càng to phía trước (lá chắn)
      for (const sd of [-1, 1]) { ctx.fillStyle = '#c84a24'; U.ellipse(ctx, 22, sd * 12, 12, 8); ctx.fill(); ctx.fillStyle = '#f0a070'; U.ellipse(ctx, 27, sd * 12, 5, 4); ctx.fill(); }
      const gr = ctx.createRadialGradient(-4, -6, 2, 0, 0, 24); gr.addColorStop(0, '#f07a40'); gr.addColorStop(1, '#8a2a10');
      ctx.fillStyle = gr; U.ellipse(ctx, 0, 0, 20, 17); ctx.fill();
      ctx.fillStyle = '#c8ff7a'; for (let i = 0; i < 4; i++) { U.circle(ctx, -8 + i * 4, (i % 2 ? 6 : -6), 2.4); ctx.fill(); } // nốt virus
      ctx.fillStyle = '#1a0a04'; U.circle(ctx, 14, -5, 2.4); ctx.fill(); U.circle(ctx, 14, 5, 2.4); ctx.fill();
      ctx.restore();
    },
  });

  /* ---------- BOSS: THUỶ LONG VỊNH HẠ ---------- */
  const PTS = [[2650, 2260], [3000, 2300], [3380, 2260]];
  Ens.register('bayDragon', {
    name: 'Thuỷ Long Vịnh Hạ', r: 52, hp: 13500, speed: 120, dmg: 26, score: 0, boss: true, knockMul: 0, fly: true, noHover: true, noContact: true,
    blood: '#0a3a4a', gore: '#6ae0ff',
    init(e) { e.phase = 1; e.state = 'swim'; e.pi = 1; e.jetT = 2.5; e.slamT = 6; e.diveT = 9; e.tideT = 8; e.callT = 10; e.face = -Math.PI / 2; },
    armorFn(e, dmg) { return e.state === 'dive' || e.state === 'rise' ? 0 : dmg; },
    update(e, G, dt) {
      const p = G.player, k = e.hp / e.maxHp, ph = k > 0.65 ? 1 : k > 0.32 ? 2 : 3;
      if (ph > e.phase) { e.phase = ph; G.shake(14); MB.Audio.play('roar'); G.banner(`PHASE ${ph}`, ph === 2 ? 'Rồng biển lặn và gọi bầy sứa' : 'Sóng thần tràn bãi!', 2); }
      const home = PTS[e.pi];
      e.face += U.angDiff(e.face, Ens.toPlayer(e, G)) * Math.min(1, dt * 3);
      if (e.state === 'swim') {
        const tx = home[0] + Math.sin(G.time * 0.6) * 120, ty = home[1] + Math.sin(G.time * 1.3) * 18;
        e.vx += ((tx - e.x) * 1.5 - e.vx) * Math.min(1, dt * 2); e.vy += ((ty - e.y) * 1.5 - e.vy) * Math.min(1, dt * 2);
        e.jetT -= dt; e.slamT -= dt; e.diveT -= dt; e.tideT -= dt; e.callT -= dt;
        if (ph === 3 && e.tideT <= 0) { e.state = 'tide'; e.st = 1.2; G.banner('SÓNG THẦN', 'Chạy vào khe hở hoặc lộn né!', 1.2); MB.Audio.play('boss'); }
        else if (ph >= 2 && e.diveT <= 0) { e.state = 'dive'; e.st = 1.5; e.hidden = true; e.invuln = true; G.burst(e.x, e.y, '#bff4ff', 40, 260); MB.Audio.play('slam'); }
        else if (e.slamT <= 0) { e.state = 'slam'; e.st = 0.9; }
        else if (e.jetT <= 0) { e.state = 'jetAim'; e.st = 0.85; e.lock = Ens.toPlayer(e, G); }
        else if (ph >= 2 && e.callT <= 0) {
          e.callT = 12; MB.Audio.play('roar');
          for (let i = 0; i < 3 + ph; i++) { const a = -Math.PI / 2 + (i - 2) * 0.5; G.spawnEnemyAt('seaJelly', e.x + Math.cos(a) * 140, e.y + Math.sin(a) * 140 - 60, { extra: true }); }
        }
      } else if (e.state === 'jetAim') {
        Ens.stop(e, dt, 8); e.st -= dt; e.lock += U.angDiff(e.lock, Ens.toPlayer(e, G)) * Math.min(1, dt * 2.5);
        if (e.st <= 0) { e.state = 'jet'; e.st = 1.3; e.sweep = (Math.random() < 0.5 ? -1 : 1) * 0.7; e.jetA = e.lock - e.sweep / 2; e.fireT = 0; MB.Audio.play('shot_flame'); }
      } else if (e.state === 'jet') {
        // tia nước quét ngang
        Ens.stop(e, dt, 8); e.st -= dt; e.jetA += e.sweep * dt / 1.3; e.fireT -= dt;
        if (e.fireT <= 0) { e.fireT = 0.045; G.enemyShot({ x: e.x + Math.cos(e.jetA) * 50, y: e.y + Math.sin(e.jetA) * 50, a: e.jetA + U.rnd(-0.03, 0.03), speed: 620, r: 11, dmg: 9, color: '#c8f4ff', owner: e, life: 1.1 }); }
        if (e.st <= 0) { e.state = 'swim'; e.jetT = ph === 1 ? 3.2 : 2.4; }
      } else if (e.state === 'slam') {
        Ens.stop(e, dt, 10); e.st -= dt;
        if (e.st <= 0) { G.shockwave(e.x, e.y - 40, 900, 2.2, 20, 'rgba(160,230,255,.9)'); G.burst(e.x, e.y, '#e8fbff', 40, 300); e.state = 'swim'; e.slamT = ph === 1 ? 7 : 5.5; }
      } else if (e.state === 'dive') {
        Ens.stop(e, dt, 8); e.st -= dt;
        if (e.st <= 0) {
          let ni = e.pi; while (ni === e.pi) ni = Math.floor(Math.random() * PTS.length);
          e.pi = ni; e.x = PTS[ni][0]; e.y = PTS[ni][1]; e.state = 'rise'; e.st = 0.7;
          G.telegraphCircle(e.x, e.y - 60, 170, 0.7, null, 'rgba(120,220,255,.16)');
        }
      } else if (e.state === 'rise') {
        Ens.stop(e, dt, 8); e.st -= dt;
        if (e.st <= 0) {
          e.state = 'swim'; e.hidden = false; e.invuln = false; e.diveT = ph === 3 ? 7 : 9;
          G.explosion(e.x, e.y - 60, 170, 40, { player: 26, knock: 600, color: '#bff4ff', ring: '170,230,255', obstacles: false, enemies: false });
          for (let i = 0; i < 12; i++) G.enemyShot({ x: e.x, y: e.y - 40, a: Math.PI + i / 11 * Math.PI, speed: 280, r: 10, dmg: 10, color: '#9ff0ff', owner: e, life: 2 });
        }
      } else if (e.state === 'tide') {
        Ens.stop(e, dt, 8); e.st -= dt;
        if (e.st <= 0) {
          // bức tường sóng chạy từ biển lên bãi, chừa một khe hở
          const gap = U.rnd(2400, 3500);
          for (let x = 2260; x < 3640; x += 34) if (Math.abs(x - gap) > 95) G.enemyShot({ x, y: SHORE + 30, a: -Math.PI / 2, speed: 210, r: 17, dmg: 22, color: '#e8fbff', owner: e, life: 5.4, pass: true });
          MB.Audio.play('boom'); G.shake(10); e.state = 'swim'; e.tideT = 11;
        }
      }
    },
    tele(ctx, e, G) {
      if (e.state === 'jetAim') G.drawTelegraphLine(ctx, e.x, e.y, e.lock, 640, 1 - e.st / 0.85);
      if (e.state === 'slam') { const k = 1 - e.st / 0.9; ctx.strokeStyle = `rgba(160,230,255,${0.3 + k * 0.6})`; ctx.lineWidth = 4; U.circle(ctx, e.x, e.y - 40, 60 + k * 80); ctx.stroke(); }
      if (e.state === 'tide') { ctx.fillStyle = `rgba(160,230,255,${0.12 + (1 - e.st / 1.2) * 0.2})`; ctx.fillRect(2250, SHORE - 60, 1400, 70); }
      if (e.state === 'dive') { const k = (G.time * 2) % 1; ctx.strokeStyle = `rgba(160,230,255,${0.6 * (1 - k)})`; ctx.lineWidth = 3; U.circle(ctx, e.x, e.y, 30 + k * 60); ctx.stroke(); }
    },
    draw(ctx, e, G) {
      if (e.hidden) return;
      const t = G.time, x = e.x, y = e.y;
      // thân cuộn nhô lên khỏi mặt nước phía sau
      for (let i = 0; i < 4; i++) {
        const hx = x + (i - 1.5) * 90 + Math.sin(t * 1.5 + i) * 10, hy = y + 70 + Math.sin(t * 2 + i) * 6;
        ctx.fillStyle = 'rgba(230,250,255,.5)'; U.ellipse(ctx, hx, hy + 8, 40, 10); ctx.fill();
        ctx.fillStyle = '#1e5a62'; ctx.beginPath(); ctx.ellipse(hx, hy, 34, 22, 0, Math.PI, 0); ctx.fill();
        ctx.fillStyle = '#3aa0a0'; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(hx + k * 12 - 5, hy - 18); ctx.lineTo(hx + k * 12, hy - 34); ctx.lineTo(hx + k * 12 + 5, hy - 18); ctx.fill(); }
      }
      // bọt nước quanh cổ
      for (let i = 0; i < 10; i++) { const a = i / 10 * U.TAU + t; ctx.fillStyle = 'rgba(240,252,255,.7)'; U.circle(ctx, x + Math.cos(a) * 46, y + 20 + Math.sin(a) * 14, 6 + Math.sin(t * 6 + i) * 2); ctx.fill(); }
      // cổ dựng đứng
      ctx.fillStyle = '#1e5a62'; U.rr(ctx, x - 24, y - 70, 48, 92, 22); ctx.fill();
      ctx.fillStyle = '#7ad8c8'; U.rr(ctx, x - 12, y - 66, 24, 84, 12); ctx.fill();
      // đầu rồng hướng về phía người chơi
      ctx.save(); ctx.translate(x, y - 78); ctx.rotate(e.face);
      const open = e.state === 'jet' || e.state === 'jetAim' ? 0.6 : 0.15 + Math.abs(Math.sin(t * 2.5)) * 0.1;
      ctx.fillStyle = '#226a6e'; U.ellipse(ctx, 6, 0, 44, 30); ctx.fill();
      ctx.fillStyle = '#2f8a88'; U.ellipse(ctx, 30, 0, 30, 20); ctx.fill();
      ctx.fillStyle = '#062022'; ctx.beginPath(); ctx.moveTo(40, 0); ctx.lineTo(66, -18 * open - 3); ctx.lineTo(66, 18 * open + 3); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#f0f8f0'; for (let i = 0; i < 4; i++) { ctx.fillRect(44 + i * 5, -12 * open - 3, 3, 5); ctx.fillRect(44 + i * 5, 12 * open - 2, 3, 5); }
      ctx.strokeStyle = '#d8f0e0'; ctx.lineWidth = 5; ctx.lineCap = 'round';
      for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(-10, sd * 18); ctx.quadraticCurveTo(-36, sd * 34, -52, sd * 22); ctx.stroke(); }
      ctx.strokeStyle = '#9ff0e0'; ctx.lineWidth = 2;
      for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(50, sd * 12); ctx.quadraticCurveTo(70, sd * (28 + Math.sin(t * 3) * 8), 46, sd * 46); ctx.stroke(); }
      for (const sd of [-1, 1]) { const gl = ctx.createRadialGradient(22, sd * 13, 1, 22, sd * 13, 13); gl.addColorStop(0, 'rgba(220,255,255,1)'); gl.addColorStop(1, 'rgba(80,200,255,0)'); ctx.fillStyle = gl; U.circle(ctx, 22, sd * 13, 13); ctx.fill(); ctx.fillStyle = '#04181a'; ctx.fillRect(20, sd * 13 - 4, 4, 8); }
      // vây lưng
      ctx.fillStyle = '#3aa0a0'; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-14 - i * 10, -6); ctx.lineTo(-20 - i * 10, -24 - (i % 2) * 6); ctx.lineTo(-24 - i * 10, -6); ctx.fill(); }
      ctx.restore();
    },
  });

  /* ---------- bản đồ ---------- */
  const rng = U.seeded(1313);
  const obstacles = [];
  // biển: lưới ô 50, gộp các ô liền nhau theo hàng (tránh hàng nghìn vật cản)
  const CELL = 50;
  for (let y = 0; y < WH; y += CELL) {
    let run = -1;
    for (let x = 0; x <= WW; x += CELL) {
      const water = x < WW && !inWalk(x + CELL / 2, y + CELL / 2, 18);
      if (water && run < 0) run = x;
      if ((!water || x >= WW) && run >= 0) { obstacles.push({ kind: 'lake', shape: 'box', x: (run + x) / 2, y: y + CELL / 2, w: x - run, h: CELL + 2, rot: 0, noShot: true, water: true }); run = -1; }
    }
  }
  // núi đá vôi giữa biển (chặn đạn)
  const KARST = [[300, 420, 90, 320], [620, 300, 70, 260], [980, 520, 80, 300], [260, 1900, 110, 340], [560, 2200, 80, 280], [1000, 2050, 95, 320],
    [1850, 820, 70, 260], [2050, 600, 100, 360], [2450, 380, 120, 380], [2900, 300, 90, 300], [3400, 450, 110, 360], [3600, 880, 80, 280],
    [1800, 1700, 90, 300], [2050, 2050, 100, 320], [1650, 2350, 80, 260], [3700, 2400, 90, 300], [3200, 820, 120, 340], [2650, 860, 100, 300]];
  for (const [x, y, r, tall] of KARST) if (!inWalk(x, y, r + 20)) obstacles.push({ kind: 'karst', shape: 'circle', x, y, r, tall });
  // vách đá phủ cây phía Bắc bãi cát (cửa hang ở giữa)
  for (let x = 2280; x < 3640; x += 120) if (Math.abs(x - CAVE.x) > 110) obstacles.push({ kind: 'karst', shape: 'circle', x, y: 1040, r: 70, tall: 300 });
  // Hòn Trống Mái
  obstacles.push({ kind: 'trongMai', shape: 'circle', x: TM.x, y: TM.y, r: 62, tall: 260 });
  // nhà bè
  const ROOFS = ['#3a6a8a', '#8a3a2a', '#4a7a5a', '#6a6a72', '#8a6a3a'];
  RAFTS.forEach(([x, y, col], i) => obstacles.push({ kind: 'floatHouse', shape: 'box', x, y: y - 20, w: 110, h: 54, rot: 0, tall: 60, col, roof: ROOFS[i % ROOFS.length] }));
  // đá rải trên bãi cát (che chắn)
  [[2500, 1500], [2800, 1300], [3250, 1450], [3450, 1800], [2650, 1850], [3100, 1650]].forEach(([x, y]) => obstacles.push({ kind: 'rock', shape: 'circle', x, y, r: 26 + rng() * 14 }));
  // thuyền trang trí trên biển
  const JUNKS = [[400, 900, 0.3], [1900, 300, -0.2], [2900, 2450, 0.1], [600, 2450, 0.5], [3500, 1300, 1.4]];
  const BASKETS = [[460, 1560], [1600, 1050], [1620, 1480], [2400, 2300], [760, 600]];

  MB.registerGate({
    id: 13, seed: 1313, view3d: true, act: 2,
    title: 'GATE 13 — HẠ LONG', subtitle: 'Vịnh di sản lúc hoàng hôn',
    world: { w: WW, h: WH }, bg: '#0e3a44', mmColor: 'rgba(200,180,120,.7)',
    scale: { hp: 2.3, dmg: 1.5 },
    start: { x: 140, y: 1270 },
    obstacles, hazards: [],
    crates: [{ x: 720, y: 1000 }, { x: 1110, y: 1650 }, { x: 1600, y: 540 }, { x: 2100, y: 1270 }, { x: 2700, y: 1600 }, { x: 3400, y: 1200 }],
    spawnPoints: [
      { x: 715, y: 840 }, { x: 1115, y: 840 }, { x: 715, y: 1720 }, { x: 1115, y: 1720 }, { x: 1465, y: 1720 }, { x: 1465, y: 700 },
      { x: 1300, y: 420 }, { x: 1720, y: 420 }, { x: 2300, y: 1270 }, { x: 2400, y: 1150 }, { x: 3600, y: 1150 }, { x: 3600, y: 2050 }, { x: 2300, y: 2050 },
    ],
    waves: [
      { total: 24, maxAlive: 12, mix: { zombie: 4, runner: 3, seaJelly: 3, mutantCrab: 2 }, interval: [0.5, 0.9], elite: 0.12 },
      { total: 28, maxAlive: 13, mix: { seaJelly: 4, mutantCrab: 3, riverSnake: 2, goatDrone: 2, runner: 2 }, interval: [0.45, 0.85], elite: 0.16 },
      { total: 32, maxAlive: 15, mix: { mutantCrab: 3, seaJelly: 4, riverSnake: 3, goatDrone: 2, riot: 2, zombie: 2 }, interval: [0.4, 0.8], elite: 0.2 },
    ],
    boss: { type: 'bayDragon', x: PTS[1][0], y: PTS[1][1], fixed: true },
    intro: { title: 'MÀN 2 · NHIỆM VỤ', text: 'Vịnh Hạ Long lúc hoàng hôn. Chỉ đi được trên lối ván, nhà bè và đảo đá. Lần theo lô hàng đầu dê tới hang Sửng Sốt ở đảo phía Đông.' },
    objectives: [
      { title: 'LÀNG CHÀI CỬA VẠN', text: 'Sứa Điện bay lên từ biển và bắn cầu điện — bắn hạ trước khi chúng áp sát.' },
      { title: 'CUA ĐỘT BIẾN', text: 'Càng cua chặn đạn phía trước: bắn vào hông, né cú lao ngang (vạch đỏ).' },
      { title: 'BÃI CÁT SỬNG SỐT', text: 'Wave cuối. Mặt biển phía Nam đang sủi bọt…' },
      { title: 'BOSS · THUỶ LONG VỊNH HẠ', text: 'Né tia nước quét, lộn né qua sóng xung kích. Khi nó đẩy sóng thần, chạy vào khe hở.' },
    ],
    challenges: [
      { id: 'cargo', type: 'destroy', name: 'Thùng Lạnh Đầu Dê', desc: 'Phá 4 thùng hàng của GoatEvil', kind: 'goatCrate', r: 22, hp: 280,
        spawner: { type: 'seaJelly', every: 7, range: 700, cap: 5 },
        targets: [{ x: 560, y: 1175 }, { x: 1280, y: 1655 }, { x: 1700, y: 600 }, { x: 3500, y: 1950 }], reward: { mod: 'barrel' } },
      { id: 'peak', type: 'hold', name: 'Đài Ngắm Trống Mái', desc: 'Giữ đài ngắm Hòn Trống Mái 15 giây', zone: { x: 1380, y: 560, r: 80 }, time: 15,
        mix: { seaJelly: 2, mutantCrab: 1 }, spawnEvery: 1.8, reward: { mod: 'trigger' } },
      { id: 'streak', type: 'streak', name: 'Sóng Vỗ Hạ Long', desc: '20 hạ gục liên tiếp không trúng đòn', count: 20, reward: { mod: 'split' } },
    ],
    clue: { x: CAVE.x, y: CAVE.y + 70, title: 'Ghi chép số 3 — Hạ Long', text: [
      'Ngày 15. Trong hang Sửng Sốt có một phòng lạnh giấu sau nhũ đá. Nhiệt độ âm 80 độ. Ai đó đã chuẩn bị nơi này từ rất lâu.',
      'Mười hai năm trước, một học trò giỏi nhất của tôi bỏ đi ngay trong đêm, sau khi nhìn thấy những "tình nguyện viên" của dự án V-0. Cậu ấy biết quá nhiều.',
      'Lô hàng đã được đưa lên núi cao, nơi mây phủ quanh năm. Sa Pa.',
    ] },
    comms: [
      { on: 'start', t: 2.5, lines: [['HUNTER', 'Hạ Long… Lần cuối mình về đây là năm mười tuổi, cùng ba đi thuyền.']] },
      { on: 'start', t: 9, lines: [['GOATEVIL', 'Nguyễn Hào Tình. Đứa con của vịnh trở về. Cảm động thật.']] },
      { on: 'wave', wave: 2, lines: [['HUNTER', 'Làng chài trống trơn… họ đi đâu hết rồi?'], ['GOATEVIL', 'Họ vẫn ở đây. Dưới nước.']] },
      { on: 'low', lines: [['GOATEVIL', 'Biển sẽ nuốt ngươi, như nó đã nuốt cả làng này.']] },
      { on: 'boss', lines: [['GOATEVIL', 'Người xưa kể rồng xuống vịnh để giữ yên biển. Ta đã đánh thức nó.'], ['HUNTER', 'Vậy thì ta sẽ cho nó ngủ lại.']] },
      { on: 'phase', phase: 3, lines: [['GOATEVIL', 'Sóng thần, Hunter! Chạy đi!']] },
      { on: 'won', lines: [['HUNTER', 'Dấu giày trong hang còn mới… có ai đó đã vào đây trước mình.']] },
    ],
    light3d: { hemiSky: 0xffd8b0, hemiGround: 0x2a4a50, hemi: 1.25, sun: 0xffc080, sunI: 1.5, exposure: 1.35 },

    setup(G) {
      G.__over = null;
      for (const [x, y, rot] of JUNKS) G.actors.push({ kind: 'junkBoat', x, y, rot, ph: x * 0.01, r: 80 });
      for (const [x, y] of BASKETS) G.actors.push({ kind: 'basketBoat', x, y, ph: y * 0.01, r: 20 });
      G.actors.push({ kind: 'seaSurface', x: 0, y: 0, r: 1 });
    },
    drawUnder(G, ctx) {
      // ánh hoàng hôn lấp lánh + gợn sóng trên mặt biển (chỉ vẽ trong khung nhìn)
      const t = G.time, c = G.cam, vw = G.W / G.zoom, vh = G.H / G.zoom;
      ctx.lineWidth = 2;
      for (let i = 0; i < 90; i++) {
        const x = c.x + ((i * 173 + t * 14) % (vw + 100)) - 50, y = c.y + ((i * 97) % (vh + 60)) - 30 + Math.sin(t + i) * 4;
        if (inWalk(x, y, 10)) continue;
        ctx.strokeStyle = i % 4 === 0 ? 'rgba(255,210,140,.45)' : 'rgba(220,250,255,.22)';
        ctx.beginPath(); ctx.moveTo(x - 16, y); ctx.quadraticCurveTo(x, y - 4, x + 16, y); ctx.stroke();
      }
      // bọt sóng dọc mép bãi
      ctx.fillStyle = 'rgba(255,255,255,.55)';
      for (let x = 2250; x < 3650; x += 26) { const y = SHORE + 6 + Math.sin(t * 2 + x * 0.05) * 6; U.ellipse(ctx, x, y, 16, 4); ctx.fill(); }
    },
    drawOver(G, ctx) { VN.drawOver(G, ctx); },
    drawScreen(G, ctx) {
      // nắng hoàng hôn + sương biển trôi ngang
      const W = G.W, H = G.H, t = G.time;
      const gr = ctx.createLinearGradient(0, 0, W, H); gr.addColorStop(0, 'rgba(255,170,80,.16)'); gr.addColorStop(0.6, 'rgba(255,120,60,.05)'); gr.addColorStop(1, 'rgba(60,40,90,.14)');
      ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 3; i++) {
        const y = (H * (0.2 + i * 0.3) + Math.sin(t * 0.2 + i) * 30), x = ((t * (12 + i * 6) + i * 400) % (W + 600)) - 300;
        const mg = ctx.createRadialGradient(x, y, 10, x, y, 320); mg.addColorStop(0, 'rgba(255,240,225,.12)'); mg.addColorStop(1, 'rgba(255,240,225,0)');
        ctx.fillStyle = mg; ctx.fillRect(x - 320, y - 320, 640, 640);
      }
    },

    buildGround(g, w, h, rand) {
      // biển xanh ngọc, sẫm dần ra xa
      const sg = g.createLinearGradient(0, 0, w, h); sg.addColorStop(0, '#1f6a6e'); sg.addColorStop(0.5, '#1a5a62'); sg.addColorStop(1, '#0f3e4a');
      g.fillStyle = sg; g.fillRect(0, 0, w, h);
      GK.patches(g, rand, w, h, 220, ['rgba(60,150,150,.25)', 'rgba(10,40,50,.25)', 'rgba(255,200,130,.06)'], 40, 160);
      // phản chiếu núi đá
      for (const o of obstacles) if (o.kind === 'karst') { g.fillStyle = 'rgba(10,30,30,.35)'; g.beginPath(); g.ellipse(o.x + o.r * 0.4, o.y + o.r * 1.4, o.r * 0.9, o.r * 1.6, 0, 0, U.TAU); g.fill(); }
      // bãi cát + đảo đá
      const beach = WALK[9];
      const bg2 = g.createLinearGradient(0, beach[1], 0, beach[3]); bg2.addColorStop(0, '#c8b48a'); bg2.addColorStop(1, '#e8d6a8');
      g.fillStyle = bg2; g.fillRect(beach[0], beach[1], beach[2] - beach[0], beach[3] - beach[1]);
      g.fillStyle = 'rgba(120,180,170,.5)'; g.fillRect(beach[0], beach[3] - 26, beach[2] - beach[0], 26); // cát ướt mép nước
      GK.dots(g, rand, w, h, 0, [], 1);
      const isl = WALK[7]; g.fillStyle = '#8a8a78'; g.fillRect(isl[0], isl[1], isl[2] - isl[0], isl[3] - isl[1]);
      GK.patches(g, rand, w, h, 0, [], 1, 1);
      // lối ván + sàn nhà bè (gỗ)
      for (let i = 0; i < WALK.length; i++) {
        if (i === 7 || i === 9) continue;
        const r = WALK[i], horiz = r[2] - r[0] > r[3] - r[1];
        g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(r[0] + 6, r[1] + 8, r[2] - r[0], r[3] - r[1]);
        g.fillStyle = '#8a6a44'; g.fillRect(r[0], r[1], r[2] - r[0], r[3] - r[1]);
        g.strokeStyle = 'rgba(50,34,18,.55)'; g.lineWidth = 1.5;
        if (horiz) for (let x = r[0]; x < r[2]; x += 12) { g.beginPath(); g.moveTo(x, r[1]); g.lineTo(x, r[3]); g.stroke(); }
        else for (let y = r[1]; y < r[3]; y += 12) { g.beginPath(); g.moveTo(r[0], y); g.lineTo(r[2], y); g.stroke(); }
        g.fillStyle = '#4a3420'; // cọc
        if (horiz) for (let x = r[0] + 10; x < r[2]; x += 90) { g.fillRect(x, r[1] - 4, 6, 6); g.fillRect(x, r[3] - 2, 6, 6); }
        else for (let y = r[1] + 10; y < r[3]; y += 90) { g.fillRect(r[0] - 4, y, 6, 6); g.fillRect(r[2] - 2, y, 6, 6); }
      }
      // phao xốp trắng quanh nhà bè
      for (const [x, y] of RAFTS) { g.fillStyle = 'rgba(240,240,235,.9)'; for (let k = -2; k <= 2; k++) { g.fillRect(x + k * 38 - 12, y + 66, 24, 10); } }
      // cửa hang Sửng Sốt: khoảng tối trên vách
      g.fillStyle = '#1a1a14'; g.beginPath(); g.ellipse(CAVE.x, CAVE.y - 10, 90, 54, 0, Math.PI, 0); g.fill();
      g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(CAVE.x - 90, CAVE.y - 10, 180, 40);
      GK.vignette(g, w, h, 0.45);
    },

    /* ---------- 3D ---------- */
    models3d: {
      seaJelly: (K) => ({
        base: 16,
        build() {
          const T = K.T, g = new T.Group(), body = new T.Group(); body.position.y = 30; g.add(body);
          const dome = new T.Mesh(K.G3('jdome', () => new T.SphereGeometry(15, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2)), K.std(0x7ad8ff, { own: true, emissive: 0x3aa8ff, ei: 0.9, transparent: true, opacity: 0.75, rough: 0.2 }));
          dome.scale.y = 0.8; body.add(dome);
          const tent = [];
          for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2, tt = K.mesh(K.cyl(0.8, 0.3, 22, 4), K.std(0xbff4ff, { emissive: 0x6ad8ff, ei: 0.6 }), Math.cos(a) * 8, -11, Math.sin(a) * 8, false); body.add(tt); tent.push(tt); }
          body.add(K.glowSprite(0x8ae8ff, 60, 0.5));
          g.userData = { body, tent, h: 44 }; return g;
        },
        anim(e, m, G) { const d = m.userData; d.body.position.y = 30 + Math.sin(G.time * 3 + e.t) * 4; d.tent.forEach((tt, i) => { tt.rotation.x = Math.sin(G.time * 5 + i) * 0.3; }); },
      }),
      mutantCrab: (K) => ({
        base: 23,
        build() {
          const T = K.T, g = new T.Group(), shell = K.std(0xc84a24, { rough: 0.45 }), dark = K.std(0x8a3a1a);
          const body = K.mesh(K.sph(20, 16), shell, 0, 12, 0); body.scale.set(1, 0.5, 0.9); g.add(body);
          const legs = [];
          for (const sd of [-1, 1]) for (let i = 0; i < 3; i++) { const l = K.mesh(K.cyl(1.8, 1.2, 24, 6), dark, -6 + i * 6, 6, sd * 20, true); l.rotation.x = sd * 1.1; g.add(l); legs.push(l); }
          for (const sd of [-1, 1]) { const c = K.mesh(K.sph(9, 12), shell, 24, 12, sd * 12); c.scale.set(1.4, 0.8, 0.9); g.add(c); g.add(K.mesh(K.sph(4, 8), K.std(0xf0a070), 34, 12, sd * 12)); }
          for (let i = 0; i < 4; i++) g.add(K.mesh(K.sph(2.2, 6), K.glowMat(0xc8ff7a, 1.6), -8 + i * 4, 21, (i % 2 ? 6 : -6), false));
          for (const z of [-5, 5]) g.add(K.mesh(K.cyl(0.8, 0.8, 8, 4), dark, 14, 22, z), K.mesh(K.sph(2, 6), K.std(0x1a0a04), 14, 26, z));
          g.userData = { legs, h: 30 }; return g;
        },
        anim(e, m, G) { const mv = Math.hypot(e.vx, e.vy) > 20; m.userData.legs.forEach((l, i) => { l.rotation.z = mv ? Math.sin(G.time * 14 + i) * 0.4 : 0; }); },
      }),
      bayDragon: (K) => ({
        base: 52,
        build() {
          const T = K.T, g = new T.Group(), skin = K.std(0x1e5a62, { rough: 0.35, metal: 0.1 }), belly = K.std(0x7ad8c8, { rough: 0.5 }), horn = K.std(0xd8f0e0);
          const neck = new T.Group(); g.add(neck);
          for (let i = 0; i < 5; i++) { const s = K.mesh(K.sph(20 - i * 1.5, 14), skin, 0, 10 + i * 18, 0); neck.add(s); }
          const head = new T.Group(); head.position.y = 98; neck.add(head);
          const sk = K.mesh(K.sph(26, 16), skin, 0, 0, 0); sk.scale.set(1.5, 0.85, 1); head.add(sk);
          const sn = K.mesh(K.sph(18, 14), K.std(0x2f8a88), 28, -2, 0); sn.scale.set(1.5, 0.6, 0.9); head.add(sn);
          const jaw = K.mesh(K.box(36, 5, 24), K.std(0x0a2a2c), 32, -12, 0); head.add(jaw);
          for (const z of [-1, 1]) {
            const h1 = K.mesh(K.G3('dhorn', () => new T.ConeGeometry(4, 38, 8)), horn, -14, 16, z * 14); h1.rotation.z = 1.9; h1.rotation.x = z * 0.4; head.add(h1);
            head.add(K.mesh(K.sph(4.5, 10), K.glowMat(0xbff8ff, 2.8), 16, 8, z * 14, false));
          }
          head.add(K.glowSprite(0x7ae8ff, 110, 0.4));
          const humps = [];
          for (let i = 0; i < 4; i++) { const hm = K.mesh(K.sph(28, 14), skin, (i - 1.5) * 85, 0, 70, true); hm.scale.y = 0.7; g.add(hm); humps.push(hm); }
          const foam = K.mesh(K.cyl(52, 60, 3, 20), K.std(0xeefcff, { transparent: true, opacity: 0.7 }), 0, 2, 0, false); g.add(foam);
          g.userData = { head, jaw, humps, h: 120 }; return g;
        },
        anim(e, m, G) {
          const d = m.userData; m.visible = !e.hidden;
          d.jaw.rotation.z = -(e.state === 'jet' || e.state === 'jetAim' ? 0.5 : 0.1);
          d.head.rotation.y = 0; d.head.position.y = 98 + Math.sin(G.time * 2) * 4;
          d.humps.forEach((hm, i) => { hm.position.y = Math.sin(G.time * 2 + i) * 6 - 4; });
          // mô hình đặt đầu về phía +x; nhóm cha đã xoay theo e.face
        },
      }),
    },
    props3d: {
      karst: (o, K) => {
        const T = K.T, g = new T.Group(), rock = K.std(0x8a9286, { flat: true, rough: 0.95 }), moss = K.std(0x3e7a38, { own: true, transparent: true, flat: true });
        const H = o.tall * 0.55, n = 4, rr = U.seeded(o.x | 0);
        for (let i = 0; i < n; i++) {
          const m = K.mesh(K.G3('kd' + i, () => new T.DodecahedronGeometry(1, 0)), rock, (rr() - 0.5) * o.r * 0.3, H * (i + 0.5) / n, (rr() - 0.5) * o.r * 0.3);
          m.scale.set(o.r * (1 - i * 0.12), H / n * 0.8, o.r * (0.9 - i * 0.1)); m.rotation.y = rr() * 6; g.add(m);
        }
        for (let i = 0; i < 6; i++) { const b = K.mesh(K.G3('kb', () => new T.IcosahedronGeometry(1, 0)), moss, (rr() - 0.5) * o.r, H + (rr() - 0.3) * 20, (rr() - 0.5) * o.r); b.scale.setScalar(o.r * (0.25 + rr() * 0.2)); g.add(b); }
        g.userData.canopy = [moss]; return g;
      },
      trongMai: (o, K) => {
        const T = K.T, g = new T.Group(), rock = K.std(0x8a907e, { flat: true, rough: 0.95 });
        const a = K.mesh(K.G3('tm1', () => new T.DodecahedronGeometry(1, 1)), rock, -26, 70, 0); a.scale.set(32, 72, 26); a.rotation.z = 0.15; g.add(a);
        const b = K.mesh(K.G3('tm1', () => new T.DodecahedronGeometry(1, 1)), rock, 30, 55, 6); b.scale.set(26, 56, 24); b.rotation.z = -0.2; g.add(b);
        g.add(K.mesh(K.cyl(70, 80, 10, 12), rock, 0, 4, 0));
        return g;
      },
      floatHouse: (o, K) => {
        const T = K.T, g = new T.Group(), wall = K.std(new T.Color(o.col).getHex(), { rough: 0.8 }), roof = K.std(new T.Color(o.roof).getHex(), { own: true, transparent: true, metal: 0.4, rough: 0.5 });
        g.add(K.mesh(K.box(o.w, 34, o.h), wall, 0, 17, 0));
        const r = K.mesh(K.box(o.w + 14, 4, o.h + 12), roof, 0, 38, 0); r.rotation.x = 0.08; g.add(r);
        g.add(K.mesh(K.box(14, 24, 2), K.std(0x2a1a10), 0, 12, o.h / 2 + 1));
        const pole = K.mesh(K.cyl(0.8, 0.8, 34, 4), K.std(0x3a2a1a), o.w / 2 - 6, 54, 0); g.add(pole);
        g.add(K.mesh(K.box(18, 10, 1), K.std(0xd8261e, { emissive: 0x400808 }), o.w / 2 + 3, 66, 0));
        g.userData.canopy = [roof]; return g;
      },
      goatCrate: (o, K) => {
        const T = K.T, g = new T.Group(), mt = K.std(0xc8d2d8, { own: true, metal: 0.5, rough: 0.35 });
        g.add(K.mesh(K.box(46, 34, 34), mt, 0, 17, 0), K.mesh(K.box(47, 6, 35), K.std(0x8a969e), 0, 31, 0));
        g.add(K.mesh(K.box(5, 4, 2), K.glowMat(0x7ad8ff, 2), 18, 26, 17.5, false));
        g.add(K.mesh(K.box(14, 14, 1), K.std(0x7a0a10, { emissive: 0x300004 }), 0, 17, 17.5));
        g.userData.flashMat = mt; return g;
      },
    },
    actors3d: Object.assign({
      junkBoat: (a, K) => {
        const T = K.T, g = new T.Group(), wood = K.std(0x5a3a22, { rough: 0.8 }), sail = K.std(0xa8542a, { rough: 0.9 });
        const hull = K.mesh(K.sph(1, 16), wood, 0, 6, 0); hull.scale.set(80, 16, 24); g.add(hull);
        g.add(K.mesh(K.box(120, 4, 30), K.std(0x7a5a3a), 0, 16, 0));
        for (const [x, h] of [[-30, 90], [10, 110], [45, 80]]) {
          g.add(K.mesh(K.cyl(1.4, 1.6, h, 6), K.std(0x3a2a1a), x, 16 + h / 2, 0));
          const s = K.mesh(K.box(4, h * 0.75, h * 0.55), sail, x + 3, 16 + h * 0.55, 0); s.rotation.y = 0.2; g.add(s);
          for (let k = 0; k < 4; k++) g.add(K.mesh(K.box(5, 1.2, h * 0.56), K.std(0x4a2a14), x + 3, 16 + h * 0.25 + k * h * 0.16, 0));
        }
        g.rotation.y = -a.rot;
        g.userData.anim = (aa, m, G) => { m.position.y = Math.sin(G.time * 1.1 + aa.ph) * 2; m.rotation.z = Math.sin(G.time * 0.9 + aa.ph) * 0.03; };
        return g;
      },
      basketBoat: (a, K) => {
        const T = K.T, g = new T.Group();
        const b = new T.Mesh(K.G3('basket', () => new T.SphereGeometry(18, 14, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2)), K.std(0x6a5030, { rough: 0.95 }));
        b.rotation.x = Math.PI; b.position.y = 10; g.add(b);
        g.userData.anim = (aa, m, G) => { m.position.y = Math.sin(G.time * 1.6 + aa.ph) * 1.5; m.rotation.y = G.time * 0.2 + aa.ph; };
        return g;
      },
      seaSurface: (a, K) => {
        // mặt biển phản chiếu nhẹ (mờ, trong suốt) phủ lên nền
        const T = K.T, g = new T.Group();
        const m = new T.Mesh(new T.PlaneGeometry(WW, WH), new T.MeshStandardMaterial({ color: 0x2a8a90, transparent: true, opacity: 0.18, roughness: 0.15, metalness: 0.3 }));
        m.rotation.x = -Math.PI / 2; m.position.set(WW / 2, 0.6, WH / 2); g.add(m);
        g.userData.anim = (aa, mm) => { mm.position.set(0, 0, 0); };
        return g;
      },
    }, MB.Story.actors3d),
  });
  // vẽ thuyền 2D (actor)
  MB.Props.registerActor('junkBoat', (ctx, a, G) => {
    const t = G.time, y = a.y + Math.sin(t * 1.1 + a.ph) * 2;
    ctx.save(); ctx.translate(a.x, y); ctx.rotate(a.rot);
    ctx.fillStyle = 'rgba(0,0,0,.28)'; U.ellipse(ctx, 10, 12, 86, 22); ctx.fill();
    ctx.fillStyle = '#5a3a22'; ctx.beginPath(); ctx.moveTo(-86, 0); ctx.quadraticCurveTo(-60, -24, 0, -24); ctx.quadraticCurveTo(70, -24, 90, -6); ctx.lineTo(90, 6); ctx.quadraticCurveTo(70, 24, 0, 24); ctx.quadraticCurveTo(-60, 24, -86, 0); ctx.fill();
    ctx.fillStyle = '#7a5a3a'; U.ellipse(ctx, 0, 0, 70, 16); ctx.fill();
    ctx.restore();
    // buồm nâu dựng đứng (vẽ lệch lên trên, như nhìn nghiêng)
    for (const [dx, h] of [[-30, 70], [10, 86], [45, 62]]) {
      const x = a.x + Math.cos(a.rot) * dx, yy = y + Math.sin(a.rot) * dx;
      ctx.fillStyle = '#a8542a'; ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x - 26, yy - h * 0.2); ctx.lineTo(x - 22, yy - h); ctx.lineTo(x + 10, yy - h * 0.9); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(60,24,10,.6)'; ctx.lineWidth = 1.5; for (let k = 1; k < 5; k++) { ctx.beginPath(); ctx.moveTo(x - 24 + k, yy - h * k / 5); ctx.lineTo(x + 8, yy - h * k / 5 * 0.95); ctx.stroke(); }
      ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x, yy - h - 6); ctx.stroke();
    }
  });
  MB.Props.registerActor('basketBoat', (ctx, a, G) => {
    const t = G.time, x = a.x, y = a.y + Math.sin(t * 1.6 + a.ph) * 1.5;
    ctx.fillStyle = 'rgba(0,0,0,.25)'; U.circle(ctx, x + 4, y + 5, 19); ctx.fill();
    ctx.fillStyle = '#6a5030'; U.circle(ctx, x, y, 18); ctx.fill();
    ctx.strokeStyle = 'rgba(40,26,12,.6)'; ctx.lineWidth = 1; for (let r = 6; r < 18; r += 4) { U.circle(ctx, x, y, r); ctx.stroke(); }
    ctx.fillStyle = '#3a2a18'; U.circle(ctx, x, y, 6); ctx.fill();
  });
  MB.Props.registerActor('seaSurface', () => {});
})(window.MB);
