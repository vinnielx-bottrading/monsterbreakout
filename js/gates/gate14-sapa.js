/* Gate 14 — SA PA · FANSIPAN: Ruộng bậc thang trong sương sớm (Màn 2 · Nguồn Gốc)
   Thắng cảnh: ruộng bậc thang Mường Hoa (bờ ruộng uốn lượn, lúa vàng xen ruộng nước soi mây), bản làng người H'Mông
   (nhà gỗ mái pơ mu, giàn ngô phơi, sạp thổ cẩm), ga cáp treo Fansipan với cabin chạy giữa mây, rừng pơ mu – đỗ quyên,
   suối Thác Bạc, cầu treo qua vực mây và đỉnh Fansipan 3.143 m (chóp inox tam giác).
   Cơ chế: bờ ruộng chặn đường đi (đạn bay qua) — phải tìm lối bậc thang; SƯƠNG MÙ tràn xuống theo đợt, chỉ thấy quanh mình;
   ĐỒNG ĐỘI DIAN xuất hiện ở wave 1, ống ngắm nhiệt đánh dấu đỏ quái trong sương.
   Quái mới: Dê Núi Đột Biến (húc lao), Bóng Sương (gần như vô hình, vồ từ trong sương).
   Boss: DÊ CHÚA HOÀNG LIÊN — húc lao (dụ nó húc vào đá để gục choáng), nhảy dậm, phun băng, hú gọi sương + Bóng Sương,
   giai đoạn cuối gây lở đá trên đỉnh.
   Thử thách: phá 4 đèn sương đầu dê, giữ ga cáp treo, 22 hạ gục liên tiếp. */
'use strict';
(function (MB) {
  const U = MB.U, Ens = MB.Enemies, GK = MB.GK, VN = MB.VN, Col = MB.Col;
  const WW = 4000, WH = 3000;
  const H3 = 0.45;
  const START = { x: 300, y: 2860 };
  const ROWS = 7, ROW0 = 1700, ROWD = 160, TX1 = 2150;
  const rowY = (i, x) => ROW0 + i * ROWD + 45 * Math.sin(x / 380 + i * 0.7);
  const CABLE = { x: 3600, y0: 2010, y1: 400 };
  const SUMMIT = { x: 3150, y: 650 };
  const STREAM_X = 1050;

  /* ---------- vẽ cảnh 2D ---------- */
  // bờ ruộng bậc thang: bờ đất có cỏ, bên dưới là vách đất thấp
  MB.Props.register('terrace', (ctx, o) => {
    ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(o.rot || 0);
    ctx.fillStyle = 'rgba(40,30,10,.35)'; ctx.fillRect(-o.hw, o.hh - 2, o.w, 10);
    ctx.fillStyle = '#7a5a34'; ctx.fillRect(-o.hw, -o.hh, o.w, o.h);
    ctx.fillStyle = '#6a9a3a'; ctx.fillRect(-o.hw, -o.hh, o.w, o.h * 0.45);
    ctx.fillStyle = 'rgba(150,200,90,.6)'; for (let x = -o.hw + 6; x < o.hw; x += 14) ctx.fillRect(x, -o.hh - 2, 2, 4);
    ctx.restore();
  });
  // nhà gỗ người H'Mông: vách gỗ, mái pơ mu (ván gỗ xếp lớp) vẽ đè
  MB.Props.register('hmongHouse', (ctx, o) => {
    const x = o.x - o.hw, y = o.y - o.hh, H = 60 * H3;
    VN.shadowBox(ctx, x, y - H, o.w, o.h, 60, 0.25);
    ctx.fillStyle = '#6a4a2e'; ctx.fillRect(x, y + o.h - H, o.w, H);
    ctx.strokeStyle = 'rgba(30,18,8,.45)'; ctx.lineWidth = 1; for (let xx = x + 8; xx < x + o.w; xx += 9) { ctx.beginPath(); ctx.moveTo(xx, y + o.h - H); ctx.lineTo(xx, y + o.h); ctx.stroke(); }
    ctx.fillStyle = '#2a1a0e'; ctx.fillRect(o.x - 10, y + o.h - H * 0.85, 20, H * 0.85);
  });
  VN.over.hmongHouse = (ctx, o, G) => {
    const x = o.x - o.hw, y = o.y - o.hh, H = 60 * H3;
    ctx.globalAlpha = VN.coverAlpha(G, x, y - H - 20, x + o.w, y + o.h - H);
    // mái hai dốc phủ ván pơ mu xám nâu
    ctx.fillStyle = '#4a4238'; ctx.fillRect(x - 10, y - H - 8, o.w + 20, (o.h + 8) / 2);
    ctx.fillStyle = '#3a332b'; ctx.fillRect(x - 10, y - H - 8 + (o.h + 8) / 2, o.w + 20, (o.h + 8) / 2);
    ctx.strokeStyle = 'rgba(20,16,12,.5)'; ctx.lineWidth = 1;
    for (let yy = y - H - 4; yy < y - H + o.h; yy += 7) { ctx.beginPath(); ctx.moveTo(x - 10, yy); ctx.lineTo(x + o.w + 10, yy); ctx.stroke(); }
    for (let k = 0; k < 18; k++) { const xx = x - 6 + ((k * 37) % (o.w + 12)), yy = y - H - 4 + ((k * 23) % o.h); ctx.fillRect(xx, yy, 1, 6); }
    ctx.fillStyle = 'rgba(200,210,190,.18)'; ctx.fillRect(x - 10, y - H - 8, o.w + 20, 3); // nóc mái đọng sương
    // khói bếp
    const t = G.time;
    for (let i = 0; i < 3; i++) { const k = (t * 0.25 + i / 3) % 1; ctx.fillStyle = `rgba(220,220,215,${0.35 * (1 - k)})`; U.circle(ctx, x + o.w * 0.7 + Math.sin(t + i) * 6, y - H - 10 - k * 50, 6 + k * 14); ctx.fill(); }
    ctx.globalAlpha = 1;
  };
  // giàn ngô phơi
  MB.Props.register('cornRack', (ctx, o) => {
    MB.Props.shadow(ctx, o.x + 8, o.y + 8, 30, 10, 0.25);
    ctx.fillStyle = '#5a3a20'; ctx.fillRect(o.x - 30, o.y - 4, 60, 8);
    for (let i = 0; i < 7; i++) { ctx.fillStyle = i % 2 ? '#e8b830' : '#f0c848'; U.ellipse(ctx, o.x - 26 + i * 8.6, o.y - 12, 3.4, 9); ctx.fill(); }
  });
  // sạp thổ cẩm
  MB.Props.register('brocade', (ctx, o) => {
    const x = o.x - o.hw, y = o.y - o.hh;
    MB.Props.shadow(ctx, o.x + 8, o.y + 10, o.hw + 6, o.hh * 0.6, 0.25);
    ctx.fillStyle = '#5a3a20'; ctx.fillRect(x, y, o.w, o.h);
    const C = ['#2a3a8a', '#c8282a', '#e8b830', '#1a1a1a', '#2a8a5a', '#d84a8a'];
    for (let i = 0; i < 6; i++) { ctx.fillStyle = C[i]; ctx.fillRect(x + 4 + i * (o.w - 8) / 6, y + 4, (o.w - 8) / 6 - 2, o.h - 8); ctx.fillStyle = 'rgba(255,255,255,.5)'; for (let k = 0; k < 3; k++) ctx.fillRect(x + 6 + i * (o.w - 8) / 6, y + 8 + k * 9, (o.w - 8) / 6 - 6, 2); }
  });
  // cây pơ mu (tán vẽ đè)
  MB.Props.register('pine', (ctx, o) => { MB.Props.shadow(ctx, o.x + o.r * 0.9, o.y + o.r * 0.5, o.r * 1.4, o.r * 0.6, 0.25); ctx.fillStyle = '#4a3420'; U.circle(ctx, o.x, o.y, o.r * 0.35); ctx.fill(); });
  VN.over.pine = (ctx, o, G) => {
    const H = (o.tall || 150) * H3, x = o.x, y = o.y, r = o.r;
    ctx.globalAlpha = VN.coverAlpha(G, x - r * 1.6, y - H - r, x + r * 1.6, y);
    for (let i = 0; i < 4; i++) {
      const k = i / 4, w = r * (1.7 - k * 1.1), yy = y - H * (0.2 + k * 0.72);
      ctx.fillStyle = ['#23402a', '#2c4e30', '#356036', '#3e6c3c'][i];
      ctx.beginPath(); ctx.moveTo(x - w, yy + r * 0.5); ctx.lineTo(x, yy - r * 0.9); ctx.lineTo(x + w, yy + r * 0.5); ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = 'rgba(230,240,235,.25)'; ctx.beginPath(); ctx.moveTo(x - 4, y - H * 0.92 - r * 0.4); ctx.lineTo(x, y - H * 0.92 - r * 0.9); ctx.lineTo(x + 4, y - H * 0.92 - r * 0.4); ctx.fill();
    ctx.globalAlpha = 1;
  };
  // ga cáp treo (dưới chân núi + trên đỉnh)
  MB.Props.register('cableStation', (ctx, o) => {
    const x = o.x - o.hw, y = o.y - o.hh, H = 90 * H3;
    VN.shadowBox(ctx, x, y - H, o.w, o.h, 90, 0.25);
    ctx.fillStyle = '#c8ccd0'; ctx.fillRect(x, y + o.h - H, o.w, H);
    ctx.fillStyle = '#5a8aa8'; for (let i = 0; i < 6; i++) ctx.fillRect(x + 12 + i * (o.w - 24) / 6, y + o.h - H * 0.8, (o.w - 24) / 6 - 8, H * 0.5);
    ctx.fillStyle = '#c8282a'; ctx.fillRect(x, y + o.h - H - 4, o.w, 6);
  });
  VN.over.cableStation = (ctx, o, G) => {
    const x = o.x - o.hw, y = o.y - o.hh, H = 90 * H3;
    ctx.globalAlpha = VN.coverAlpha(G, x, y - H, x + o.w, y + o.h - H);
    ctx.fillStyle = '#8a3a2a'; ctx.fillRect(x - 8, y - H - 6, o.w + 16, o.h + 6);
    ctx.fillStyle = '#a84a34'; ctx.fillRect(x - 8, y - H - 6, o.w + 16, (o.h + 6) * 0.42);
    // mái cong kiểu đình chùa vùng cao
    ctx.fillStyle = '#6a2a1e'; for (const sx of [x - 14, x + o.w + 2]) { ctx.beginPath(); ctx.moveTo(sx, y - H - 6); ctx.lineTo(sx + 12, y - H - 6); ctx.lineTo(sx + 6, y - H - 18); ctx.fill(); }
    ctx.fillStyle = '#f2f2f2'; ctx.font = '900 13px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(o.label || 'GA CÁP TREO', o.x, y - H + o.h * 0.6);
    ctx.globalAlpha = 1;
  };
  MB.Props.register('cableTower', (ctx, o) => { MB.Props.shadow(ctx, o.x + 30, o.y + 12, 34, 10, 0.3); ctx.fillStyle = '#7a8088'; ctx.fillRect(o.x - 12, o.y - 12, 24, 24); });
  VN.over.cableTower = (ctx, o, G) => {
    const H = 220 * H3;
    ctx.strokeStyle = '#8a9098'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(o.x - 12, o.y); ctx.lineTo(o.x - 4, o.y - H); ctx.moveTo(o.x + 12, o.y); ctx.lineTo(o.x + 4, o.y - H); ctx.stroke();
    ctx.lineWidth = 1.5; for (let k = 1; k < 6; k++) { const yy = o.y - H * k / 6; ctx.beginPath(); ctx.moveTo(o.x - 12 + k * 1.3, yy); ctx.lineTo(o.x + 12 - k * 1.3, yy - H / 6); ctx.stroke(); }
    ctx.fillStyle = '#5a6068'; ctx.fillRect(o.x - 22, o.y - H - 4, 44, 8);
  };
  // chóp Fansipan: khối inox tam giác ghi độ cao
  MB.Props.register('fansipan', (ctx, o) => { MB.Props.shadow(ctx, o.x + 26, o.y + 12, 40, 14, 0.32); ctx.fillStyle = '#5a5a58'; U.ellipse(ctx, o.x, o.y + 6, 46, 18); ctx.fill(); });
  VN.over.fansipan = (ctx, o, G) => {
    const H = 120 * H3, x = o.x, y = o.y;
    ctx.globalAlpha = VN.coverAlpha(G, x - 40, y - H - 20, x + 40, y);
    ctx.fillStyle = '#d8dde2'; ctx.beginPath(); ctx.moveTo(x - 30, y); ctx.lineTo(x, y - H); ctx.lineTo(x + 6, y); ctx.fill();
    ctx.fillStyle = '#9aa2aa'; ctx.beginPath(); ctx.moveTo(x + 6, y); ctx.lineTo(x, y - H); ctx.lineTo(x + 30, y); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(x - 3, y - H + 6, 2, H - 10);
    ctx.fillStyle = '#c8282a'; ctx.font = '900 7px system-ui'; ctx.textAlign = 'center'; ctx.fillText('FANSIPAN', x - 9, y - H * 0.42); ctx.fillText('3.143 m', x - 9, y - H * 0.42 + 8);
    // cờ đỏ trên đỉnh
    const wv = Math.sin(G.time * 6) * 2;
    ctx.strokeStyle = '#3a3a3a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, y - H); ctx.lineTo(x, y - H - 22); ctx.stroke();
    ctx.fillStyle = '#d8261e'; ctx.beginPath(); ctx.moveTo(x, y - H - 22); ctx.lineTo(x + 18, y - H - 18 + wv); ctx.lineTo(x, y - H - 13); ctx.fill();
    ctx.fillStyle = '#f2d02a'; U.circle(ctx, x + 7, y - H - 17.5 + wv * 0.5, 1.8); ctx.fill();
    ctx.globalAlpha = 1;
  };
  // đèn sương đầu dê (mục tiêu thử thách): cột phát sương + đèn đỏ
  MB.Props.register('fogBeacon', (ctx, o, t) => {
    MB.Props.shadow(ctx, o.x + 8, o.y + 8, 22, 9, 0.3);
    ctx.fillStyle = o.flash > 0 ? '#ffffff' : '#3a3a40'; U.rr(ctx, o.x - 14, o.y - 40, 28, 48, 5); ctx.fill();
    ctx.fillStyle = '#5a5a62'; ctx.fillRect(o.x - 16, o.y - 44, 32, 7);
    const pul = 0.5 + Math.sin(t * 5 + o.x) * 0.5;
    ctx.fillStyle = `rgba(255,60,70,${0.5 + pul * 0.5})`; U.circle(ctx, o.x, o.y - 24, 6); ctx.fill();
    ctx.fillStyle = '#ff5a6a'; ctx.font = '900 11px system-ui'; ctx.textAlign = 'center'; ctx.fillText('♉', o.x, o.y - 6);
    for (let i = 0; i < 3; i++) { const k = (t * 0.5 + i / 3) % 1; ctx.fillStyle = `rgba(235,240,245,${0.4 * (1 - k)})`; U.circle(ctx, o.x + Math.sin(t + i * 2) * 10, o.y - 48 - k * 40, 8 + k * 18); ctx.fill(); }
  });
  MB.Props.register('void', () => {});
  MB.Props.hazard.stream = () => {};

  /* ---------- quái mới ---------- */
  Ens.register('mtGoat', {
    name: 'Dê Núi Đột Biến', r: 22, hp: 90, speed: 125, dmg: 18, score: 180, blood: '#4a1a10', gore: '#c8ff7a', knockMul: 0.5,
    init(e) { e.cd = U.rnd(1.2, 2.6); },
    update(e, G, dt) {
      const p = G.player, d = Ens.distPlayer(e, G);
      e.cd -= dt;
      if (e.state === 'wind') { Ens.stop(e, dt, 14); e.st -= dt; e.face = e.lock; if (e.st <= 0) { e.state = 'dash'; e.st = 0.45; e.vx = Math.cos(e.lock) * 640; e.vy = Math.sin(e.lock) * 640; MB.Audio.play('dash'); } }
      else if (e.state === 'dash') { e.st -= dt; e.face = e.lock; if (e.st <= 0 || e.bumped) { e.state = 'daze'; e.st = e.bumped ? 1.1 : 0.5; if (e.bumped) G.burst(e.x, e.y, '#d8d0b8', 10, 120); } }
      else if (e.state === 'daze') { Ens.stop(e, dt, 12); e.st -= dt; if (e.st <= 0) { e.state = null; e.cd = U.rnd(1.8, 3); } }
      else {
        Ens.steer(e, G, p.x, p.y, e.speed, dt, { f: 4, a: 0.3 });
        if (d < 330 && e.cd <= 0 && G.los(e.x, e.y, p.x, p.y)) { e.state = 'wind'; e.st = 0.6; e.lock = Ens.toPlayer(e, G); MB.Audio.play('growl'); }
      }
    },
    onContact(e, G) { if (e.state === 'dash') { const p = G.player, a = Math.atan2(p.y - e.y, p.x - e.x); p.vx += Math.cos(a) * 420; p.vy += Math.sin(a) * 420; } },
    tele(ctx, e, G) { if (e.state === 'wind') G.drawTelegraphLine(ctx, e.x, e.y, e.lock, 290, 1 - e.st / 0.6); },
    draw(ctx, e, G) { drawGoat(ctx, e, G, 1); },
  });
  function drawGoat(ctx, e, G, s) {
    const t = G.time, mv = Math.hypot(e.vx, e.vy) > 20, walk = mv ? Math.sin(t * 14 + e.t) : 0;
    ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.face || 0); ctx.scale(s, s);
    if (e.airborne) ctx.scale(1.15, 1.15);
    ctx.fillStyle = 'rgba(0,0,0,.28)'; U.ellipse(ctx, 4, 8, 30, 18); ctx.fill();
    // chân
    ctx.strokeStyle = '#2a2420'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    for (const [x, sd, ph] of [[12, -1, 1], [12, 1, -1], [-12, -1, -1], [-12, 1, 1]]) { ctx.beginPath(); ctx.moveTo(x, sd * 8); ctx.lineTo(x + walk * ph * 5, sd * 16); ctx.stroke(); }
    // thân lông xám bạc + gân virus
    const gr = ctx.createRadialGradient(-4, -6, 2, 0, 0, 24); gr.addColorStop(0, '#d8d4c8'); gr.addColorStop(1, '#7a7468');
    ctx.fillStyle = gr; U.ellipse(ctx, 0, 0, 22, 14); ctx.fill();
    ctx.strokeStyle = 'rgba(150,255,90,.7)'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(-14, -4); ctx.quadraticCurveTo(-4, -10, 6, -3); ctx.moveTo(-12, 6); ctx.quadraticCurveTo(0, 2, 8, 7); ctx.stroke();
    // đầu + sừng cong
    ctx.fillStyle = '#5a544a'; U.ellipse(ctx, 22, 0, 10, 8); ctx.fill();
    ctx.strokeStyle = '#c8b890'; ctx.lineWidth = 4;
    for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(20, sd * 5); ctx.quadraticCurveTo(10, sd * 20, 2, sd * 12); ctx.stroke(); }
    ctx.fillStyle = e.state === 'wind' ? '#ff4a4a' : '#c8ff7a'; U.circle(ctx, 26, -4, 1.8); ctx.fill(); U.circle(ctx, 26, 4, 1.8); ctx.fill();
    ctx.restore();
  }

  Ens.register('mistStalker', {
    name: 'Bóng Sương', r: 17, hp: 60, speed: 150, dmg: 15, score: 160, blood: '#2a3a40', gore: '#dfe8ef', knockMul: 1,
    init(e) { e.alpha = 0.2; e.cd = U.rnd(1, 2); },
    update(e, G, dt) {
      const p = G.player, d = Ens.distPlayer(e, G);
      e.cd -= dt;
      // gần như vô hình — lộ ra khi ở gần, khi trúng đạn hoặc khi Dian đánh dấu
      const seen = d < 190 || e.markT > 0 || e.flash > 0 || e.state === 'lunge';
      e.alpha += ((seen ? 1 : 0.16) - e.alpha) * Math.min(1, dt * 6);
      if (e.markT > 0) e.markT -= dt;
      if (e.state === 'crouch') { Ens.stop(e, dt, 16); e.st -= dt; e.face = e.lock; if (e.st <= 0) { e.state = 'lunge'; e.st = 0.32; e.vx = Math.cos(e.lock) * 720; e.vy = Math.sin(e.lock) * 720; } }
      else if (e.state === 'lunge') { e.st -= dt; if (e.st <= 0) { e.state = null; e.cd = U.rnd(1.6, 2.6); } }
      else {
        Ens.steer(e, G, p.x, p.y, e.speed, dt, { f: 3, a: 0.6 });
        if (d < 240 && e.cd <= 0 && G.los(e.x, e.y, p.x, p.y)) { e.state = 'crouch'; e.st = 0.42; e.lock = Ens.toPlayer(e, G); }
      }
    },
    tele(ctx, e, G) { if (e.state === 'crouch') G.drawTelegraphLine(ctx, e.x, e.y, e.lock, 230, 1 - e.st / 0.42); },
    draw(ctx, e, G) {
      const t = G.time;
      ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.face || 0);
      // vệt sương kéo phía sau
      for (let i = 1; i < 4; i++) { ctx.fillStyle = `rgba(225,232,238,${0.22 / i})`; U.circle(ctx, -i * 9, Math.sin(t * 4 + i) * 3, 14 - i * 2); ctx.fill(); }
      ctx.fillStyle = '#c8d2da'; U.ellipse(ctx, 0, 0, 13, 10); ctx.fill();
      // tay dài vươn ra trước
      ctx.strokeStyle = '#aab6c0'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      const reach = e.state === 'crouch' || e.state === 'lunge' ? 10 : 0;
      for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(4, sd * 8); ctx.lineTo(20 + reach, sd * (12 - reach * 0.4)); ctx.lineTo(26 + reach, sd * 6); ctx.stroke(); }
      ctx.fillStyle = '#e8eef2'; U.circle(ctx, 8, 0, 7); ctx.fill();
      ctx.fillStyle = '#ff3a4a'; U.circle(ctx, 12, -2.4, 1.6); ctx.fill(); U.circle(ctx, 12, 2.4, 1.6); ctx.fill();
      ctx.restore();
    },
  });

  /* ---------- BOSS: DÊ CHÚA HOÀNG LIÊN ---------- */
  const ARENA = { x0: 2470, y0: 160, x1: 3900, y1: 1120 };
  Ens.register('goatKing', {
    name: 'Dê Chúa Hoàng Liên', r: 56, hp: 15500, speed: 120, dmg: 30, score: 0, boss: true, knockMul: 0, blood: '#3a0a0a', gore: '#c8ff7a',
    init(e) { e.phase = 1; e.state = 'stalk'; e.chargeT = 3; e.leapT = 7.5; e.breathT = 5; e.howlT = 10; e.avaT = 6; e.chain = 0; },
    update(e, G, dt) {
      const p = G.player, k = e.hp / e.maxHp, ph = k > 0.66 ? 1 : k > 0.33 ? 2 : 3, d = Ens.distPlayer(e, G);
      if (ph > e.phase) {
        e.phase = ph; G.shake(14); MB.Audio.play('roar');
        G.banner(`PHASE ${ph}`, ph === 2 ? 'Dê Chúa hú gọi sương' : 'Lở đá trên đỉnh Fansipan!', 2);
        G.gs.fogForce = 10;
      }
      if (e.state === 'stalk') {
        Ens.steer(e, G, p.x, p.y, e.speed * (ph === 3 ? 1.2 : 1), dt);
        for (const kk of ['chargeT', 'leapT', 'breathT', 'howlT', 'avaT']) e[kk] -= dt;
        if (ph === 3 && e.avaT <= 0) {
          e.state = 'avaAim'; e.st = 1.1; e.lanes = [];
          for (let i = 0; i < 5; i++) e.lanes.push(U.clamp(p.x + (i - 2) * 230 + U.rnd(-40, 40), ARENA.x0 + 40, ARENA.x1 - 40));
          MB.Audio.play('roar');
        } else if (e.chargeT <= 0 && d > 170) { e.state = 'chargeAim'; e.st = 0.8; e.lock = Ens.toPlayer(e, G); e.chain = ph === 1 ? 1 : ph === 2 ? 2 : 3; MB.Audio.play('growl'); }
        else if (e.leapT <= 0) { e.state = 'crouch'; e.st = 0.35; }
        else if (e.breathT <= 0 && d < 430) { e.state = 'breathAim'; e.st = 0.55; e.lock = Ens.toPlayer(e, G); }
        else if (ph >= 2 && e.howlT <= 0) { e.state = 'howl'; e.st = 1.1; MB.Audio.play('roar'); }
      } else if (e.state === 'chargeAim') {
        Ens.stop(e, dt, 14); e.st -= dt; e.lock += U.angDiff(e.lock, Ens.toPlayer(e, G)) * Math.min(1, dt * 1.6); e.face = e.lock;
        if (e.st <= 0) { e.state = 'charge'; e.st = 1.05; e.vx = Math.cos(e.lock) * 840; e.vy = Math.sin(e.lock) * 840; MB.Audio.play('dash'); G.shake(5); }
      } else if (e.state === 'charge') {
        e.st -= dt; e.face = e.lock;
        if (Math.random() < 0.5) G.particle({ x: e.x - Math.cos(e.lock) * 40, y: e.y - Math.sin(e.lock) * 40, vx: U.rnd(-40, 40), vy: U.rnd(-40, 40), life: 0.5, color: '#d8d0b8', r: 4 });
        if (e.bumped && e.bumped.kind !== 'void') {
          // húc vào đá / nhà ga → gục choáng, đá vụn rơi quanh
          e.state = 'stalk'; e.vx = e.vy = 0; e.chargeT = ph === 1 ? 5.5 : 4.2;
          G.shake(16); G.burst(e.x, e.y, '#d8d0b8', 40, 300); MB.Audio.play('slam');
          if (e.stagT <= 0 && e.stagLock <= 0) MB.Boss.stagger(G, e); else e.stunT = 1.2;
          for (let i = 0; i < 4; i++) { const x = e.x + U.rnd(-200, 200), y = e.y + U.rnd(-200, 200); G.telegraphCircle(x, y, 46, 0.8, () => G.explosion(x, y, 46, 0, { player: 14, small: true, obstacles: false, enemies: false, color: '#c8c0a8', ring: '200,190,160', shake: 2 })); }
        } else if (e.st <= 0 || e.x < ARENA.x0 - 40 || e.x > ARENA.x1 + 40 || e.y < ARENA.y0 - 40 || e.y > ARENA.y1 + 300) {
          e.chain--;
          if (e.chain > 0) { e.state = 'chargeAim'; e.st = 0.45; e.lock = Ens.toPlayer(e, G); }
          else { e.state = 'stalk'; e.chargeT = ph === 1 ? 5.5 : 4.5; }
          Ens.stop(e, dt, 30);
        }
      } else if (e.state === 'crouch') {
        Ens.stop(e, dt, 14); e.st -= dt;
        if (e.st <= 0) {
          e.state = 'air'; e.st = 0.95; e.airborne = true; e.fx0 = e.x; e.fy0 = e.y; e.tx = p.x; e.ty = p.y;
          G.telegraphCircle(e.tx, e.ty, 150, 0.95, null, 'rgba(255,70,70,.14)');
        }
      } else if (e.state === 'air') {
        e.st -= dt; const kk = 1 - e.st / 0.95;
        e.x = U.lerp(e.fx0, e.tx, kk); e.y = U.lerp(e.fy0, e.ty, kk); e.vx = e.vy = 0;
        if (e.st <= 0) {
          e.airborne = false; e.state = 'stalk'; e.leapT = ph === 1 ? 8 : 6.5;
          G.explosion(e.x, e.y, 150, 0, { player: 28, knock: 0, color: '#e8e2d0', ring: '230,225,210', obstacles: false, enemies: false });
          if (ph >= 2) G.shockwave(e.x, e.y, 520, 1.6, 18, 'rgba(230,240,255,.85)');
        }
      } else if (e.state === 'breathAim') {
        Ens.stop(e, dt, 14); e.st -= dt; e.lock += U.angDiff(e.lock, Ens.toPlayer(e, G)) * Math.min(1, dt * 3); e.face = e.lock;
        if (e.st <= 0) { e.state = 'breath'; e.st = 1.1; e.fireT = 0; MB.Audio.play('shot_cryo'); }
      } else if (e.state === 'breath') {
        // phun băng hình nón — trúng thì bị chậm
        Ens.stop(e, dt, 14); e.st -= dt; e.fireT -= dt; e.lock += U.angDiff(e.lock, Ens.toPlayer(e, G)) * Math.min(1, dt * 0.8); e.face = e.lock;
        if (e.fireT <= 0) {
          e.fireT = 0.055;
          const a = e.lock + U.rnd(-0.42, 0.42);
          G.ebullets.push({ x: e.x + Math.cos(a) * 50, y: e.y + Math.sin(a) * 50, px: e.x, py: e.y, vx: Math.cos(a) * 470, vy: Math.sin(a) * 470, r: 9, dmg: 7, life: 0.95, kind: 'orb', owner: e, color: '#cfefff',
            onHit: (GG) => { GG.player.slow = Math.max(GG.player.slow || 0, 1.2); } });
        }
        if (e.st <= 0) { e.state = 'stalk'; e.breathT = ph === 1 ? 6 : 4.5; }
      } else if (e.state === 'howl') {
        Ens.stop(e, dt, 14); e.st -= dt;
        if (e.st <= 0) {
          e.state = 'stalk'; e.howlT = 13; G.gs.fogForce = 9;
          for (let i = 0; i < 2 + ph; i++) { const a = i / (2 + ph) * U.TAU; G.spawnEnemyAt('mistStalker', e.x + Math.cos(a) * 170, e.y + Math.sin(a) * 170, { extra: true }); }
          G.banner('SƯƠNG MÙ', 'Dê Chúa gọi sương — bám theo đánh dấu đỏ của Dian', 1.6);
        }
      } else if (e.state === 'avaAim') {
        Ens.stop(e, dt, 14); e.st -= dt;
        if (e.st <= 0) {
          e.state = 'stalk'; e.avaT = 9.5; G.shake(10); MB.Audio.play('boom');
          for (const x of e.lanes) for (let j = 0; j < 2; j++) G.enemyShot({ x: x + U.rnd(-20, 20), y: ARENA.y0 - 20 - j * 120, a: Math.PI / 2, speed: 380, r: 24, dmg: 24, kind: 'rock', owner: e, life: 3.4, pass: true });
        }
      }
    },
    tele(ctx, e, G) {
      if (e.state === 'chargeAim') G.drawTelegraphLine(ctx, e.x, e.y, e.lock, 760, 1 - e.st / 0.8);
      if (e.state === 'breathAim') { const k = 1 - e.st / 0.55; ctx.fillStyle = `rgba(200,235,255,${0.1 + k * 0.2})`; ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.arc(e.x, e.y, 440, e.lock - 0.42, e.lock + 0.42); ctx.closePath(); ctx.fill(); }
      if (e.state === 'avaAim') { const k = 1 - e.st / 1.1; for (const x of e.lanes) { ctx.fillStyle = `rgba(255,80,80,${0.08 + k * 0.2})`; ctx.fillRect(x - 26, ARENA.y0, 52, ARENA.y1 - ARENA.y0 + 200); } }
      if (e.state === 'howl') { const k = 1 - e.st / 1.1; ctx.strokeStyle = `rgba(230,240,250,${0.7 * (1 - k)})`; ctx.lineWidth = 6; U.circle(ctx, e.x, e.y, 60 + k * 260); ctx.stroke(); }
    },
    draw(ctx, e, G) {
      const t = G.time, mv = Math.hypot(e.vx, e.vy) > 20, walk = mv ? Math.sin(t * 9) : 0;
      const lift = e.airborne ? Math.sin((1 - e.st / 0.95) * Math.PI) : 0;
      ctx.fillStyle = 'rgba(0,0,0,.32)'; U.ellipse(ctx, e.x + 8, e.y + 16, 62 * (1 - lift * 0.3), 34 * (1 - lift * 0.3)); ctx.fill();
      ctx.save(); ctx.translate(e.x, e.y - lift * 60); ctx.rotate(e.face || 0); ctx.scale(1 + lift * 0.25, 1 + lift * 0.25);
      // chân guốc
      ctx.strokeStyle = '#2a2420'; ctx.lineWidth = 9; ctx.lineCap = 'round';
      for (const [x, sd, phs] of [[26, -1, 1], [26, 1, -1], [-26, -1, -1], [-26, 1, 1]]) { ctx.beginPath(); ctx.moveTo(x, sd * 20); ctx.lineTo(x + walk * phs * 10, sd * 40); ctx.stroke(); }
      // thân lông bạc xù
      const gr = ctx.createRadialGradient(-10, -14, 6, 0, 0, 60); gr.addColorStop(0, '#ece6d8'); gr.addColorStop(0.7, '#a8a090'); gr.addColorStop(1, '#5a5448');
      ctx.fillStyle = gr; U.ellipse(ctx, 0, 0, 56, 36); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.5)'; for (let i = 0; i < 14; i++) { const a = i / 14 * U.TAU; U.circle(ctx, Math.cos(a) * 46, Math.sin(a) * 28, 6 + (i % 3) * 2); ctx.fill(); }
      // mảng thịt virus nứt trên lưng
      ctx.fillStyle = '#5a1418'; U.ellipse(ctx, -12, 0, 18, 10); ctx.fill();
      ctx.strokeStyle = 'rgba(160,255,90,.85)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-40, -10); ctx.quadraticCurveTo(-14, -26, 10, -12); ctx.moveTo(-36, 14); ctx.quadraticCurveTo(-8, 4, 18, 16); ctx.stroke();
      // đầu + bộ râu + sừng xoắn khổng lồ
      ctx.fillStyle = '#4a443a'; U.ellipse(ctx, 56, 0, 22, 18); ctx.fill();
      ctx.fillStyle = '#e8e2d2'; U.ellipse(ctx, 72, 0, 10, 7); ctx.fill();
      ctx.strokeStyle = '#d8c8a0'; ctx.lineWidth = 9;
      for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(50, sd * 12); ctx.bezierCurveTo(30, sd * 52, -6, sd * 46, 6, sd * 24); ctx.bezierCurveTo(14, sd * 12, 28, sd * 22, 22, sd * 32); ctx.stroke(); }
      ctx.strokeStyle = 'rgba(90,70,40,.6)'; ctx.lineWidth = 1.5;
      for (const sd of [-1, 1]) for (let i = 0; i < 6; i++) { const a = i / 6; ctx.beginPath(); ctx.moveTo(48 - a * 40, sd * (14 + a * 30) - 4); ctx.lineTo(48 - a * 40, sd * (14 + a * 30) + 4); ctx.stroke(); }
      const eye = e.state === 'chargeAim' || e.enrageT > 0 ? '#ff2a2a' : '#ff8a3a';
      ctx.shadowColor = eye; ctx.shadowBlur = 12; ctx.fillStyle = eye; U.circle(ctx, 64, -8, 3.4); ctx.fill(); U.circle(ctx, 64, 8, 3.4); ctx.fill(); ctx.shadowBlur = 0;
      if (e.state === 'breath' || e.state === 'breathAim') { ctx.fillStyle = 'rgba(210,240,255,.6)'; U.circle(ctx, 84, 0, 10 + Math.random() * 6); ctx.fill(); }
      ctx.restore();
    },
  });

  /* ---------- bản đồ ---------- */
  const rng = U.seeded(1414);
  const obstacles = [];
  const VOID = [];
  // bờ ruộng bậc thang: các đoạn bờ đất uốn lượn, chừa lối bậc thang
  for (let i = 0; i < ROWS; i++) {
    let k = 0;
    for (let x = 80; x < TX1 - 40; x += 150, k++) {
      if ((k + i * 5) % 6 === 2 || (k + i * 3) % 7 === 5) continue;   // lối lên xuống
      const cx = x + 75, cy = rowY(i, cx), sl = 45 / 380 * Math.cos(cx / 380 + i * 0.7);
      obstacles.push({ kind: 'terrace', shape: 'box', x: cx, y: cy, w: 154, h: 16, rot: Math.atan(sl), noShot: true });
    }
  }
  // biển mây: rìa phía Bắc + vực mây giữa rừng và đỉnh núi (cầu treo ở giữa)
  VOID.push([0, 0, WW, 120], [2160, 120, 2420, 730], [2160, 850, 2420, 1300]);
  for (const [x0, y0, x1, y1] of VOID) obstacles.push({ kind: 'void', shape: 'box', x: (x0 + x1) / 2, y: (y0 + y1) / 2, w: x1 - x0, h: y1 - y0, rot: 0, noShot: true, water: true });
  // bản H'Mông
  const HOUSES = [[2420, 1960], [2780, 1910], [3110, 2010], [2380, 2330], [2740, 2370], [3080, 2420], [2480, 2730], [2880, 2770], [3200, 2760]];
  for (const [x, y] of HOUSES) obstacles.push({ kind: 'hmongHouse', shape: 'box', x, y, w: 150, h: 96, rot: 0, tall: 70 });
  [[2600, 2120], [2930, 2180], [2560, 2540], [3260, 2230], [2700, 2900]].forEach(([x, y]) => obstacles.push({ kind: 'cornRack', shape: 'box', x, y, w: 64, h: 14, rot: 0 }));
  obstacles.push({ kind: 'brocade', shape: 'box', x: 2900, y: 2580, w: 110, h: 46, rot: 0 });
  // ga cáp treo: dưới chân núi + trên đỉnh, cột cáp
  obstacles.push({ kind: 'cableStation', shape: 'box', x: CABLE.x, y: 2100, w: 300, h: 160, rot: 0, tall: 90, label: 'GA CÁP TREO' });
  obstacles.push({ kind: 'cableStation', shape: 'box', x: CABLE.x, y: 330, w: 240, h: 130, rot: 0, tall: 90, label: 'GA FANSIPAN' });
  for (const y of [1550, 1000]) obstacles.push({ kind: 'cableTower', shape: 'circle', x: CABLE.x, y, r: 18 });
  // chóp Fansipan
  obstacles.push({ kind: 'fansipan', shape: 'circle', x: 3060, y: 300, r: 34 });
  // đá tảng trên đỉnh (để dụ boss húc vào) + sườn núi
  [[2700, 560], [2980, 880], [3420, 640], [3720, 900], [2760, 1020], [3300, 1040], [2620, 300], [3820, 560]].forEach(([x, y]) => obstacles.push({ kind: 'rock', shape: 'circle', x, y, r: 36 + rng() * 12 }));
  [[2600, 1350], [2900, 1450], [3250, 1300], [3450, 1600], [2700, 1700], [3100, 1650], [3800, 1350]].forEach(([x, y]) => obstacles.push({ kind: 'rock', shape: 'circle', x, y, r: 24 + rng() * 14 }));
  // rừng pơ mu (phía Tây + sườn núi), tránh suối và lối mòn
  for (let i = 0; i < 70; i++) {
    const x = 80 + rng() * 2040, y = 180 + rng() * 1360;
    if (Math.abs(x - STREAM_X) < 90 || (y > 760 && y < 860 && x > 1800) || (Math.abs(y - 1200) < 60)) continue;
    if (obstacles.some((o) => U.dist(o.x, o.y, x, y) < 90)) continue;
    obstacles.push({ kind: 'pine', shape: 'circle', x, y, r: 20 + rng() * 8, tall: 130 + rng() * 60 });
  }
  for (let i = 0; i < 16; i++) {
    const x = 2480 + rng() * 1400, y = 1150 + rng() * 600;
    if (Math.abs(x - CABLE.x) < 80 || Math.abs(x - 2750) < 70) continue;
    if (obstacles.some((o) => U.dist(o.x, o.y, x, y) < 100)) continue;
    obstacles.push({ kind: 'pine', shape: 'circle', x, y, r: 20 + rng() * 6, tall: 140 + rng() * 40 });
  }
  // suối Thác Bạc: làm chậm
  const hazards = [];
  for (let y = 180; y < 1560; y += 70) hazards.push({ kind: 'stream', x: STREAM_X + Math.sin(y / 160) * 30, y, r: 46, slowMul: 0.6 });

  MB.registerGate({
    id: 14, seed: 1414, view3d: true, act: 2,
    title: 'GATE 14 — SA PA · FANSIPAN', subtitle: 'Ruộng bậc thang trong sương sớm',
    world: { w: WW, h: WH }, bg: '#d8dde0', mmColor: 'rgba(170,190,120,.7)',
    scale: { hp: 2.45, dmg: 1.55 },
    start: START,
    obstacles, hazards,
    crates: [{ x: 900, y: 2900 }, { x: 1700, y: 2000 }, { x: 600, y: 1550 }, { x: 1500, y: 600 }, { x: 2600, y: 2300 }, { x: 3400, y: 2600 }, { x: 3300, y: 1450 }],
    spawnPoints: [
      { x: 1200, y: 2900 }, { x: 1900, y: 2900 }, { x: 2000, y: 2200 }, { x: 600, y: 1600 }, { x: 1600, y: 1600 }, { x: 300, y: 900 }, { x: 1500, y: 400 },
      { x: 2300, y: 2900 }, { x: 3400, y: 2900 }, { x: 3850, y: 2600 }, { x: 3200, y: 1800 }, { x: 2600, y: 1250 }, { x: 3700, y: 1250 }, { x: 1900, y: 1300 },
    ],
    waves: [
      { total: 30, maxAlive: 13, mix: { zombie: 3, runner: 3, mtGoat: 3, goatDrone: 2 }, interval: [0.45, 0.85], elite: 0.13 },
      { total: 34, maxAlive: 15, mix: { mtGoat: 4, mistStalker: 4, runner: 2, goatDrone: 2, riot: 1 }, interval: [0.4, 0.8], elite: 0.17 },
      { total: 38, maxAlive: 16, mix: { mistStalker: 4, mtGoat: 4, goatDrone: 2, riot: 2, zombie: 2 }, interval: [0.38, 0.75], elite: 0.21 },
    ],
    boss: { type: 'goatKing', x: SUMMIT.x, y: SUMMIT.y, fixed: true },
    ally: { enter: { wave: 1, delay: 14, overwatch: 7 } },
    intro: { title: 'MÀN 2 · NHIỆM VỤ', text: 'Sa Pa phủ sương. Bờ ruộng chặn lối — tìm bậc thang để lên. Lô hàng đầu dê được đưa lên ga cáp treo Fansipan.' },
    objectives: [
      { title: 'RUỘNG BẬC THANG MƯỜNG HOA', text: 'Dê Núi lấy đà rồi húc (vạch đỏ): né sang bên, nó sẽ choáng nếu đâm vào bờ đá.' },
      { title: 'BẢN H\'MÔNG', text: 'Sương đang xuống. Bóng Sương gần như vô hình — bắn theo dấu đỏ Dian đánh dấu.' },
      { title: 'SƯỜN FANSIPAN', text: 'Wave cuối. Lên ga cáp treo, tiến về đỉnh núi.' },
      { title: 'BOSS · DÊ CHÚA HOÀNG LIÊN', text: 'Dụ Dê Chúa húc vào đá tảng để nó gục choáng. Né vòng nhảy dậm và luồng băng.' },
    ],
    challenges: [
      { id: 'beacon', type: 'destroy', name: 'Đèn Sương Đầu Dê', desc: 'Phá 4 đèn phát sương của GoatEvil', kind: 'fogBeacon', r: 20, hp: 300,
        spawner: { type: 'mistStalker', every: 6.5, range: 700, cap: 5 },
        targets: [{ x: 1320, y: 2420 }, { x: 600, y: 1000 }, { x: 1750, y: 500 }, { x: 3320, y: 2600 }], reward: { mod: 'pierce' } },
      { id: 'cable', type: 'hold', name: 'Ga Cáp Treo', desc: 'Giữ sân ga cáp treo 16 giây', zone: { x: CABLE.x, y: 2310, r: 85 }, time: 16,
        mix: { mtGoat: 2, mistStalker: 2 }, spawnEvery: 1.6, reward: { mod: 'mag' } },
      { id: 'streak', type: 'streak', name: 'Mây Ngàn Hoàng Liên', desc: '22 hạ gục liên tiếp không trúng đòn', count: 22, reward: { mod: 'trigger' } },
    ],
    clue: { x: 3420, y: 2140, title: 'Ghi chép số 4 — Sa Pa', text: [
      'Ngày 22. Lô hàng được đưa lên ga cáp treo cũ, giữa mây. Ở độ cao này, chủng V-0 ngủ đông lâu hơn — đúng như tôi dự đoán.',
      'Có người đang theo dấu chúng tôi. Cùng một kiểu dấu giày, cùng một cách cắt khoá dây. Tôi đã dạy cậu ấy cách đó.',
      'Bước tiếp theo: Kinh thành Huế. Nơi các vua xưa cất giấu những gì họ không muốn ai thấy.',
    ] },
    comms: [
      { on: 'start', t: 2.5, lines: [['HUNTER', 'Sa Pa… sương dày tới mức không thấy nổi bàn tay mình.']] },
      { on: 'start', t: 9, lines: [['GOATEVIL', 'Lạc giữa mây rồi, Hunter. Ở đây, chỉ có ta là nhìn thấy.']] },
      { on: 'ally', t: 0.3, lines: [['DIAN', 'Cúi xuống!'], ['HUNTER', 'Ai đó?!'], ['DIAN', 'Người đã đi con đường này mười hai năm trước cậu. Gọi tôi là Dian.']] },
      { on: 'ally', t: 13, lines: [['HUNTER', 'Anh biết Giáo sư Ted?'], ['DIAN', 'Biết rõ hơn tôi muốn. Để sau — lũ dê đang vòng ra sau lưng cậu.']] },
      { on: 'wave', wave: 2, lines: [['DIAN', 'Sương sắp xuống. Tôi có ống ngắm nhiệt — con nào tôi đánh dấu đỏ, cậu cứ bắn theo.']] },
      { on: 'wave', wave: 3, lines: [['GOATEVIL', 'Dũng… học trò cưng bỏ trốn. Thầy ngươi vẫn nhắc về ngươi đấy.'], ['HUNTER', '"Thầy ngươi"? Hắn nói vậy là sao?'], ['DIAN', '…Tập trung vào trận đánh.']] },
      { on: 'low', lines: [['GOATEVIL', 'Mây Hoàng Liên sẽ là tấm khăn liệm của ngươi.']] },
      { on: 'boss', lines: [['GOATEVIL', 'Trên nóc nhà Đông Dương, Dê Chúa sẽ tiễn cả hai ngươi.'], ['DIAN', 'Nó húc rất mạnh nhưng không phanh kịp. Dụ nó đâm vào đá tảng!']] },
      { on: 'phase', phase: 3, lines: [['DIAN', 'Lở đá! Nhìn vệt đỏ mà né, bám sát tôi!']] },
      { on: 'won', lines: [['HUNTER', 'Anh còn nợ tôi một lời giải thích, Dian.'], ['DIAN', 'Ở Huế. Có một người cậu cần gặp trước đã.']] },
    ],
    light3d: { hemiSky: 0xe8eef2, hemiGround: 0x4a5a3a, hemi: 1.35, sun: 0xfff2dc, sunI: 1.15, exposure: 1.25 },

    setup(G) {
      G.__over = null;
      G.gs.fog = 0; G.gs.fogT = 22; G.gs.fogOn = 0; G.gs.fogForce = 0; G.gs.scanT = 0;
      for (let i = 0; i < 4; i++) G.actors.push({ kind: 'cableCar', x: CABLE.x, y: CABLE.y0, k: i / 4, r: 30, h: 130 });
    },
    update(G, dt) {
      const s = G.gs;
      // đợt sương mù: tràn xuống 12 giây rồi tan
      if (s.fogForce > 0) { s.fogOn = Math.max(s.fogOn, s.fogForce); s.fogForce = 0; s.fogT = U.rnd(26, 34); MB.HUD.toast('<b>SƯƠNG MÙ</b> đang tràn xuống', '#dfe8ef'); }
      else if (G.state === 'fight' || G.state === 'boss' || G.state === 'break') {
        s.fogT -= dt;
        if (s.fogT <= 0 && s.fogOn <= 0) { s.fogOn = 12; s.fogT = U.rnd(26, 34); MB.HUD.toast('<b>SƯƠNG MÙ</b> đang tràn xuống', '#dfe8ef'); MB.Audio.play('wave'); }
      }
      if (s.fogOn > 0) s.fogOn -= dt;
      s.fog += ((s.fogOn > 0 ? 1 : 0) - s.fog) * Math.min(1, dt * 0.9);
      // ống ngắm nhiệt của Dian: đánh dấu quái quanh anh ấy khi có sương
      const a = G.ally;
      if (a && !a.down && s.fog > 0.3) {
        s.scanT -= dt;
        if (s.scanT <= 0) { s.scanT = 0.5; for (const e of G.enemies) if (!e.dead && U.dist(e.x, e.y, a.x, a.y) < 560) e.markT = 1.2; }
      }
      for (const e of G.enemies) if (e.markT > 0 && e.type !== 'mistStalker') e.markT -= dt;
      // cabin cáp treo chạy lên xuống
      for (const c of G.actors) if (c.kind === 'cableCar') { c.k = (c.k + dt * 0.025) % 1; const kk = c.k < 0.5 ? c.k * 2 : 2 - c.k * 2; c.y = U.lerp(CABLE.y0, CABLE.y1, kk); c.x = CABLE.x + (c.k < 0.5 ? -14 : 14); }
    },
    drawUnder(G, ctx) {
      // gợn nước trên ruộng nước + mây trôi dưới vực
      const t = G.time, c = G.cam, vw = G.W / G.zoom, vh = G.H / G.zoom;
      ctx.fillStyle = 'rgba(255,255,255,.45)';
      for (const [x0, y0, x1, y1] of VOID) {
        if (x1 < c.x || x0 > c.x + vw || y1 < c.y || y0 > c.y + vh) continue;
        for (let i = 0; i < 16; i++) { const x = x0 + ((i * 131 + t * 18) % (x1 - x0)), y = y0 + ((i * 89) % Math.max(1, y1 - y0)); U.ellipse(ctx, x, y, 50 + (i % 3) * 20, 18); ctx.fill(); }
      }
      // dòng suối chảy
      ctx.strokeStyle = 'rgba(230,245,255,.55)'; ctx.lineWidth = 2;
      for (let i = 0; i < 24; i++) { const y = 180 + ((i * 61 + t * 90) % 1380), x = STREAM_X + Math.sin(y / 160) * 30 + ((i * 17) % 40) - 20; if (!G.inView(x, y, 20)) continue; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 2, y + 14); ctx.stroke(); }
    },
    drawOver(G, ctx) {
      VN.drawOver(G, ctx);
      // dây cáp treo căng giữa 2 ga
      ctx.strokeStyle = 'rgba(40,40,44,.75)'; ctx.lineWidth = 2;
      for (const dx of [-14, 14]) { ctx.beginPath(); ctx.moveTo(CABLE.x + dx, CABLE.y0 - 60); ctx.lineTo(CABLE.x + dx, CABLE.y1 - 60); ctx.stroke(); }
    },
    drawScreen(G, ctx) {
      const s = G.gs, W = G.W, H = G.H, t = G.time;
      // sương sớm luôn có + đợt sương dày; lỗ nhìn quanh Hunter và Dian
      const amb = 0.12 + s.fog * 0.72;
      fogLayer(G, ctx, amb);
      // nắng sớm nghiêng
      const gr = ctx.createLinearGradient(0, 0, W, H); gr.addColorStop(0, 'rgba(255,230,190,.12)'); gr.addColorStop(1, 'rgba(120,150,190,.1)');
      ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
      // dấu đỏ ống ngắm nhiệt trên quái bị Dian đánh dấu (nổi trên lớp sương)
      if (s.fog > 0.2) {
        ctx.save(); ctx.strokeStyle = `rgba(255,70,70,${Math.min(1, s.fog * 1.2)})`; ctx.lineWidth = 2;
        for (const e of G.enemies) {
          if (e.dead || !(e.markT > 0) || e.hidden) continue;
          const sp = VN.toScreen(G, e.x, e.y, 20); if (!sp.vis) continue;
          const r = Math.max(10, e.r * G.zoom * 1.1);
          for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + t * 1.5; ctx.beginPath(); ctx.arc(sp.x, sp.y, r, a, a + 0.7); ctx.stroke(); }
          ctx.fillStyle = 'rgba(255,60,60,.5)'; U.circle(ctx, sp.x, sp.y, 2.5); ctx.fill();
        }
        ctx.restore();
      }
      // sợi sương trôi ngang
      for (let i = 0; i < 3; i++) {
        const y = H * (0.2 + i * 0.3) + Math.sin(t * 0.2 + i) * 30, x = ((t * (14 + i * 6) + i * 400) % (W + 600)) - 300;
        const mg = ctx.createRadialGradient(x, y, 10, x, y, 340); mg.addColorStop(0, `rgba(240,244,248,${0.14 + s.fog * 0.12})`); mg.addColorStop(1, 'rgba(240,244,248,0)');
        ctx.fillStyle = mg; ctx.fillRect(x - 340, y - 340, 680, 680);
      }
    },

    buildGround(g, w, h, rand) {
      // núi rừng: cỏ xanh sẫm
      g.fillStyle = '#4a6a3a'; g.fillRect(0, 0, w, h);
      GK.patches(g, rand, w, h, 260, ['rgba(80,110,60,.35)', 'rgba(40,60,30,.3)', 'rgba(140,130,90,.15)'], 40, 160);
      // ruộng bậc thang: dải lúa vàng xen ruộng nước soi mây
      for (let i = -1; i < ROWS; i++) {
        for (let x = 0; x < TX1 + 30; x += 10) {
          const y0 = i < 0 ? 1520 : rowY(i, x), y1 = i === ROWS - 1 ? h : rowY(i + 1, x);
          const water = (i + 7) % 3 === 0, col = water ? (x % 40 < 20 ? '#8ab8c0' : '#86b4bc') : i % 2 ? '#c8b040' : '#a8b848';
          g.fillStyle = col; g.fillRect(x, y0, 11, y1 - y0);
          if (!water) { g.fillStyle = 'rgba(90,80,20,.25)'; for (let yy = y0 + 6; yy < y1; yy += 9) g.fillRect(x + ((yy * 7) % 10), yy, 2, 3); }
          else { g.fillStyle = 'rgba(255,255,255,.18)'; if ((x / 10 + i) % 7 === 0) g.fillRect(x, y0 + 12, 10, 3); }
        }
      }
      // lối mòn đất qua bản + bậc đá lên đỉnh
      g.strokeStyle = '#8a7350'; g.lineWidth = 46; g.lineCap = 'round';
      g.beginPath(); g.moveTo(2150, 2600); g.lineTo(2600, 2550); g.lineTo(3000, 2250); g.lineTo(3450, 2300); g.lineTo(3600, 2400); g.stroke();
      g.beginPath(); g.moveTo(2750, 2050); g.lineTo(2760, 1600); g.lineTo(2900, 1200); g.lineTo(3150, 800); g.stroke();
      g.beginPath(); g.moveTo(300, 1550); g.lineTo(900, 1200); g.lineTo(1500, 1210); g.lineTo(2160, 790); g.stroke();
      g.strokeStyle = 'rgba(60,46,30,.5)'; g.lineWidth = 2;
      for (let k = 0; k < 40; k++) { const a = k / 40, x = U.lerp(2760, 2900, a), y = U.lerp(1600, 1200, a); g.beginPath(); g.moveTo(x - 22, y); g.lineTo(x + 22, y); g.stroke(); }
      // bản làng: sân đất nện
      g.fillStyle = 'rgba(150,120,80,.45)'; g.beginPath(); g.ellipse(2800, 2350, 600, 520, 0, 0, U.TAU); g.fill();
      // hoa đỗ quyên đỏ hồng trong rừng
      for (let i = 0; i < 160; i++) { const x = rand() * 2100, y = 150 + rand() * 1350; g.fillStyle = ['#d83a5a', '#e86a8a', '#c8284a'][i % 3]; g.beginPath(); g.arc(x, y, 3 + rand() * 4, 0, U.TAU); g.fill(); }
      // đỉnh núi: đá xám, cỏ úa
      const sg = g.createLinearGradient(0, 120, 0, 1250); sg.addColorStop(0, '#8a8a80'); sg.addColorStop(1, 'rgba(110,120,90,0)');
      g.fillStyle = sg; g.fillRect(2420, 120, w - 2420, 1130);
      GK.patches(g, rand, w, h, 0, [], 1);
      // suối Thác Bạc
      g.strokeStyle = '#8ac0d8'; g.lineWidth = 70; g.lineCap = 'round';
      g.beginPath(); for (let y = 140; y <= 1560; y += 20) { const x = STREAM_X + Math.sin(y / 160) * 30; if (y === 140) g.moveTo(x, y); else g.lineTo(x, y); } g.stroke();
      g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 20; g.stroke();
      // cầu gỗ qua suối
      g.fillStyle = '#7a5a34'; g.fillRect(STREAM_X - 70, 1180, 140, 46); g.strokeStyle = 'rgba(40,26,12,.6)'; g.lineWidth = 2; for (let x = STREAM_X - 66; x < STREAM_X + 70; x += 10) { g.beginPath(); g.moveTo(x, 1180); g.lineTo(x, 1226); g.stroke(); }
      // biển mây (vực)
      for (const [x0, y0, x1, y1] of VOID) {
        const cg = g.createLinearGradient(0, y0, 0, y1); cg.addColorStop(0, '#e8eef2'); cg.addColorStop(1, '#c8d4dc');
        g.fillStyle = cg; g.fillRect(x0, y0, x1 - x0, y1 - y0);
        g.fillStyle = 'rgba(255,255,255,.6)'; for (let i = 0; i < (x1 - x0) * (y1 - y0) / 9000; i++) { g.beginPath(); g.ellipse(x0 + rand() * (x1 - x0), y0 + rand() * (y1 - y0), 30 + rand() * 50, 14 + rand() * 14, 0, 0, U.TAU); g.fill(); }
        g.fillStyle = 'rgba(60,50,40,.35)'; if (x0 > 0) { g.fillRect(x0 - 10, y0, 12, y1 - y0); g.fillRect(x1 - 2, y0, 12, y1 - y0); } else g.fillRect(0, y1 - 4, w, 12);
      }
      // cầu treo qua vực mây
      g.fillStyle = '#6a4a2a'; g.fillRect(2150, 745, 280, 90);
      g.strokeStyle = 'rgba(40,26,12,.7)'; g.lineWidth = 2; for (let x = 2154; x < 2430; x += 9) { g.beginPath(); g.moveTo(x, 750); g.lineTo(x, 830); g.stroke(); }
      g.strokeStyle = '#3a2a1a'; g.lineWidth = 4; g.beginPath(); g.moveTo(2150, 742); g.lineTo(2430, 742); g.moveTo(2150, 838); g.lineTo(2430, 838); g.stroke();
      // sân ga cáp treo
      g.fillStyle = '#9a9a94'; g.fillRect(CABLE.x - 200, 2190, 400, 230);
      g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 2; for (let x = CABLE.x - 200; x < CABLE.x + 200; x += 40) { g.beginPath(); g.moveTo(x, 2190); g.lineTo(x, 2420); g.stroke(); }
      GK.vignette(g, w, h, 0.35);
    },

    /* ---------- 3D ---------- */
    models3d: {
      mtGoat: (K) => ({ base: 22, build() { return goat3D(K, 1); }, anim(e, m, G) { goatAnim(e, m, G); } }),
      goatKing: (K) => ({ base: 56, build() { return goat3D(K, 2.4, true); }, anim(e, m, G) { goatAnim(e, m, G); m.position.y = e.airborne ? Math.sin((1 - e.st / 0.95) * Math.PI) * 70 : 0; } }),
      mistStalker: (K) => ({
        base: 17,
        build() {
          const g = K.buildZombie({ skin: 0xd8e2ea, cloth: 0x8a96a0, shirt: 0xb4c0ca });
          g.traverse((o) => { if (o.material && !Array.isArray(o.material)) { o.material = o.material.clone(); o.material.transparent = true; o.material.opacity = 0.9; o.material.userData.own = true; } });
          g.add(K.glowSprite(0xe8f0f6, 70, 0.35));
          return g;
        },
        anim(e, m, G) {
          K.animZombie(e, m, G);
          const op = 0.15 + (e.alpha == null ? 1 : e.alpha) * 0.8;
          m.traverse((o) => { if (o.material && o.material.transparent && !o.isSprite) o.material.opacity = op; });
        },
      }),
    },
    props3d: {
      terrace: (o, K) => {
        const T = K.T, g = new T.Group();
        const b = K.mesh(K.box(o.w, 12, o.h + 6), K.std(0x7a5a34, { rough: 1 }), 0, 6, 0); g.add(b);
        g.add(K.mesh(K.box(o.w, 3, o.h + 8), K.std(0x6a9a3a, { rough: 1 }), 0, 13, 0));
        g.rotation.y = -(o.rot || 0); return g;
      },
      void: (o, K) => new K.T.Group(),
      hmongHouse: (o, K) => {
        const T = K.T, g = new T.Group(), wood = K.std(0x6a4a2e, { rough: 0.9 }), roof = K.std(0x4a4238, { own: true, transparent: true, rough: 1, flat: true });
        g.add(K.mesh(K.box(o.w, 40, o.h), wood, 0, 20, 0));
        g.add(K.mesh(K.box(20, 30, 2), K.std(0x2a1a0e), 0, 15, o.h / 2 + 1));
        for (const sd of [-1, 1]) { const r = K.mesh(K.box(o.w + 22, 4, o.h * 0.62), roof, 0, 52, sd * o.h * 0.26); r.rotation.x = sd * 0.5; g.add(r); }
        g.userData.canopy = [roof]; return g;
      },
      cornRack: (o, K) => {
        const T = K.T, g = new T.Group();
        g.add(K.mesh(K.box(64, 4, 6), K.std(0x5a3a20), 0, 30, 0), K.mesh(K.cyl(1.5, 1.5, 30, 5), K.std(0x5a3a20), -30, 15, 0), K.mesh(K.cyl(1.5, 1.5, 30, 5), K.std(0x5a3a20), 30, 15, 0));
        for (let i = 0; i < 7; i++) { const c = K.mesh(K.sph(3.4, 6), K.std(i % 2 ? 0xe8b830 : 0xf0c848), -26 + i * 8.6, 22, 0); c.scale.y = 2.4; g.add(c); }
        g.rotation.y = -(o.rot || 0); return g;
      },
      brocade: (o, K) => {
        const T = K.T, g = new T.Group(); g.add(K.mesh(K.box(o.w, 22, o.h), K.std(0x5a3a20), 0, 11, 0));
        const C = [0x2a3a8a, 0xc8282a, 0xe8b830, 0x1a1a1a, 0x2a8a5a, 0xd84a8a];
        C.forEach((c, i) => g.add(K.mesh(K.box(o.w / 6 - 3, 2, o.h - 6), K.std(c), -o.w / 2 + (i + 0.5) * o.w / 6, 23, 0)));
        return g;
      },
      pine: (o, K) => {
        const T = K.T, g = new T.Group(), H = (o.tall || 150) * 0.8, m = K.std(0x2c4e30, { own: true, transparent: true, flat: true, rough: 0.95 });
        g.add(K.mesh(K.cyl(o.r * 0.18, o.r * 0.28, H * 0.4, 6), K.std(0x4a3420), 0, H * 0.2, 0));
        for (let i = 0; i < 4; i++) { const c = K.mesh(K.G3('pcone', () => new T.ConeGeometry(1, 1, 7)), m, 0, H * (0.32 + i * 0.18), 0); c.scale.set(o.r * (1.6 - i * 0.3), H * 0.32, o.r * (1.6 - i * 0.3)); g.add(c); }
        g.userData.canopy = [m]; return g;
      },
      cableStation: (o, K) => {
        const T = K.T, g = new T.Group(), roof = K.std(0x8a3a2a, { own: true, transparent: true, rough: 0.6 });
        g.add(K.mesh(K.box(o.w, 50, o.h), K.std(0xc8ccd0, { rough: 0.5 }), 0, 25, 0));
        for (let i = 0; i < 6; i++) g.add(K.mesh(K.box((o.w - 24) / 6 - 8, 22, 1), K.std(0x5a8aa8, { metal: 0.6, rough: 0.2 }), -o.w / 2 + 12 + (i + 0.5) * (o.w - 24) / 6, 28, o.h / 2 + 1));
        g.add(K.mesh(K.box(o.w + 16, 8, o.h + 12), roof, 0, 56, 0));
        const top = K.mesh(K.box(o.w * 0.6, 8, o.h * 0.6), roof, 0, 64, 0); g.add(top);
        g.userData.canopy = [roof]; return g;
      },
      cableTower: (o, K) => {
        const T = K.T, g = new T.Group(), st = K.std(0x8a9098, { metal: 0.6, rough: 0.4 });
        for (const [x, z] of [[-10, -10], [10, -10], [-10, 10], [10, 10]]) { const l = K.mesh(K.cyl(1.6, 2.2, 180, 5), st, x * 0.6, 90, z * 0.6); l.rotation.z = -x * 0.004; g.add(l); }
        g.add(K.mesh(K.box(46, 6, 10), st, 0, 182, 0));
        return g;
      },
      fansipan: (o, K) => {
        const T = K.T, g = new T.Group();
        const pyr = new T.Mesh(K.G3('fpyr', () => new T.ConeGeometry(30, 100, 3)), K.std(0xd8dde2, { metal: 0.85, rough: 0.2 })); pyr.position.y = 50; pyr.castShadow = true; g.add(pyr);
        g.add(K.mesh(K.cyl(46, 50, 10, 16), K.std(0x5a5a58), 0, 4, 0));
        g.add(K.mesh(K.cyl(0.8, 0.8, 26, 4), K.std(0x3a3a3a), 0, 112, 0), K.mesh(K.box(18, 10, 1), K.std(0xd8261e, { emissive: 0x400808 }), 9, 120, 0));
        return g;
      },
      fogBeacon: (o, K) => {
        const T = K.T, g = new T.Group(), mt = K.std(0x3a3a40, { own: true, metal: 0.4 });
        g.add(K.mesh(K.box(28, 48, 28), mt, 0, 24, 0), K.mesh(K.box(32, 6, 32), K.std(0x5a5a62), 0, 50, 0));
        g.add(K.mesh(K.sph(5, 8), K.glowMat(0xff3a4a, 2.4), 0, 34, 14.5, false));
        g.add(K.glowSprite(0xe8eef4, 120, 0.35)); g.children[g.children.length - 1].position.y = 70;
        g.userData.flashMat = mt; return g;
      },
    },
    hazards3d: { stream: { inner: 'rgba(160,210,235,.35)', outer: 'rgba(160,210,235,0)', opacity: 0.35 } },
    actors3d: Object.assign({
      cableCar: (a, K) => {
        const T = K.T, g = new T.Group();
        const cab = K.mesh(K.box(30, 24, 22), K.std(0xc8282a, { rough: 0.4, metal: 0.3 }), 0, -28, 0); g.add(cab);
        g.add(K.mesh(K.box(31, 9, 23), K.std(0x2a3a4a, { metal: 0.6, rough: 0.2 }), 0, -24, 0));
        g.add(K.mesh(K.cyl(0.8, 0.8, 26, 4), K.std(0x3a3a3a), 0, -2, 0));
        g.userData.anim = (aa, m) => { m.position.y = aa.h; };
        return g;
      },
    }, MB.Story.actors3d),
  });
  // 2D: cabin cáp treo bay giữa mây (vẽ lệch lên theo độ cao)
  MB.Props.registerActor('cableCar', (ctx, a) => {
    const y = a.y - a.h * H3;
    ctx.strokeStyle = '#3a3a3a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(a.x, y - 60); ctx.lineTo(a.x, y - 14); ctx.stroke();
    ctx.fillStyle = 'rgba(0,0,0,.18)'; U.ellipse(ctx, a.x + 20, a.y + 6, 18, 8); ctx.fill();
    ctx.fillStyle = '#c8282a'; U.rr(ctx, a.x - 15, y - 14, 30, 24, 5); ctx.fill();
    ctx.fillStyle = '#2a3a4a'; ctx.fillRect(a.x - 12, y - 10, 24, 8);
  });

  /* ---------- mô hình 3D dê ---------- */
  function goat3D(K, s, king) {
    const T = K.T, g = new T.Group();
    const fur = K.std(0xd8d4c8, { own: true, rough: 1 }), dark = K.std(0x2a2420, { rough: 0.9 }), horn = K.std(0xd8c8a0, { rough: 0.6 });
    const body = K.mesh(K.bumpy ? K.bumpy('gfur', new T.SphereGeometry(20, 16, 12), 0.6, 1.2) : K.sph(20, 16), fur, 0, 30, 0); body.scale.set(1.25, 0.8, 0.8); g.add(body);
    const legs = [];
    for (const [x, z] of [[14, -9], [14, 9], [-14, -9], [-14, 9]]) { const l = K.mesh(K.cyl(2.6, 2, 24, 6), dark, x, 12, z); g.add(l); legs.push(l); }
    const head = new T.Group(); head.position.set(28, 38, 0); g.add(head);
    const hd = K.mesh(K.sph(8, 12), K.std(0x4a443a, { rough: 0.9 }), 4, 0, 0); hd.scale.set(1.3, 0.9, 0.85); head.add(hd);
    head.add(K.mesh(K.sph(4, 8), K.std(0xe8e2d2), 10, -6, 0));
    for (const sd of [-1, 1]) {
      const hn = new T.Mesh(K.G3('ghorn', () => new T.TorusGeometry(7, 2.2, 6, 14, Math.PI * 1.5)), horn);
      hn.position.set(-2, 5, sd * 6); hn.rotation.set(0, sd * 0.4, 0.6); head.add(hn);
      head.add(K.mesh(K.sph(1.3, 6), K.glowMat(king ? 0xff3a2a : 0xc8ff7a, 2.4), 10, 2, sd * 4, false));
    }
    // gân virus phát sáng trên lưng
    for (let i = 0; i < (king ? 6 : 3); i++) g.add(K.mesh(K.sph(2.4, 6), K.glowMat(0xa8ff6a, 1.6), -12 + i * 5, 46, (i % 2 ? 4 : -4), false));
    if (king) { const sc = K.mesh(K.sph(9, 10), K.std(0x5a1418, { emissive: 0x2a0505 }), -6, 46, 0); sc.scale.set(1.6, 0.5, 1); g.add(sc); }
    g.scale.setScalar(s * 0.9);
    g.userData = { legs, head, h: 50 * s }; return g;
  }
  function goatAnim(e, m, G) {
    const d = m.userData, mv = Math.hypot(e.vx, e.vy) > 20, sp = e.state === 'charge' || e.state === 'dash' ? 22 : 12;
    d.legs.forEach((l, i) => { l.rotation.z = mv ? Math.sin(G.time * sp + i * 1.7) * 0.5 : 0; });
    d.head.rotation.z = e.state === 'chargeAim' || e.state === 'wind' || e.state === 'charge' || e.state === 'dash' ? -0.45 : 0;
  }
  // lớp sương trắng có lỗ nhìn quanh Hunter và Dian (2D lẫn 3D)
  let fogCv = null;
  function fogLayer(G, ctx, amb) {
    const W = G.W, H = G.H, S = 0.5;
    const cv = fogCv || (fogCv = document.createElement('canvas'));
    if (cv.width !== Math.ceil(W * S) || cv.height !== Math.ceil(H * S)) { cv.width = Math.ceil(W * S); cv.height = Math.ceil(H * S); }
    const g = cv.getContext('2d');
    g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, cv.width, cv.height);
    g.fillStyle = `rgba(226,232,238,${amb})`; g.fillRect(0, 0, cv.width, cv.height);
    g.globalCompositeOperation = 'destination-out';
    const holes = [{ x: G.player.x, y: G.player.y, r: 300 }];
    if (G.ally && !G.ally.down) holes.push({ x: G.ally.x, y: G.ally.y, r: 170 });
    for (const L of holes) {
      const s = VN.toScreen(G, L.x, L.y, 0); if (!s.vis) continue;
      const e = VN.toScreen(G, L.x + L.r, L.y, 0), R = Math.max(8, Math.abs(e.x - s.x)) * S;
      const x = s.x * S, y = s.y * S; if (!Number.isFinite(x + y + R)) continue;
      const gr = g.createRadialGradient(x, y, R * 0.15, x, y, R);
      gr.addColorStop(0, 'rgba(0,0,0,.92)'); gr.addColorStop(0.6, 'rgba(0,0,0,.55)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, R, 0, U.TAU); g.fill();
    }
    ctx.drawImage(cv, 0, 0, W, H);
  }
})(window.MB);
