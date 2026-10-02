/* Gate 12 — HỘI AN: Phố cổ đêm đèn lồng (Màn 2 · Nguồn Gốc)
   Thắng cảnh: Chùa Cầu (cầu có mái bắc qua rạch), nhà cổ tường vàng mái ngói âm dương phủ rêu, đèn lồng giăng khắp phố,
   sông Hoài với thuyền gỗ và hoa đăng trôi, cổng Hội quán Phúc Kiến, giàn hoa giấy.
   Cơ chế: BAN ĐÊM — chỉ thấy rõ quanh đèn lồng và quanh Hunter; sông Hoài & rạch nước sâu (đạn bay qua được).
   Quái mới: Ma Đèn Lồng (bay, tự nổ lửa tím), Thuỷ Xà (lặn rồi trồi lên đớp).
   Boss: MÃNG XÀ ĐÈN LỒNG — rắn khổng lồ thân là chuỗi đèn lồng: phun cầu lửa, chui xuống lòng phố rồi phóng lên, xả vòng lửa.
   Thử thách: phá 4 đèn ma GoatEvil, giữ Chùa Cầu, 20 hạ gục liên tiếp. */
'use strict';
(function (MB) {
  const U = MB.U, Ens = MB.Enemies, GK = MB.GK, VN = MB.VN;
  const WW = 3600, WH = 2500;
  const RIVER = 1960;                                   // bờ sông Hoài (phía Nam)
  const CANAL = { x0: 720, x1: 840, y0: 900 };          // rạch nước chảy ra sông
  const CC = { x: 780, y: 1330, w: 190, h: 74 };         // Chùa Cầu (bắc ngang rạch, lối đi theo trục X)
  const H3 = 0.45;

  /* ---------- vật cản riêng ---------- */
  // Chùa Cầu: hai bên vách, mái ngói, biển chữ Hán "來遠橋"
  function drawChuaCau(ctx, o, G, top) {
    const x = CC.x - CC.w / 2, y = CC.y - CC.h / 2, H = 52 * H3 * 1.5;
    if (!top) {
      // sàn gỗ trên mặt rạch
      ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(x + 6, y + 10, CC.w, CC.h);
      ctx.fillStyle = '#7a4a2a'; ctx.fillRect(x, y, CC.w, CC.h);
      ctx.strokeStyle = 'rgba(40,20,8,.5)'; ctx.lineWidth = 1.5; for (let i = x + 8; i < x + CC.w; i += 10) { ctx.beginPath(); ctx.moveTo(i, y); ctx.lineTo(i, y + CC.h); ctx.stroke(); }
      // vách phía trước (nhìn nghiêng): tường hồng nhạt, cột gỗ, cửa sổ tròn
      ctx.fillStyle = '#d89a7a'; ctx.fillRect(x, y + CC.h - H * 0.55, CC.w, H * 0.55);
      ctx.fillStyle = '#6a3a22'; for (let i = 0; i <= 6; i++) ctx.fillRect(x + i * (CC.w - 6) / 6, y + CC.h - H * 0.55, 6, H * 0.55);
      ctx.fillStyle = '#3a2214'; for (let i = 0; i < 3; i++) { U.circle(ctx, x + CC.w * (0.25 + i * 0.25), y + CC.h - H * 0.3, 5); ctx.fill(); }
      return;
    }
    const a = VN.coverAlpha(G, x, y - H, x + CC.w, y + CC.h - H * 0.4);
    ctx.globalAlpha = a;
    VN.tileRoof(ctx, x - 14, y - H, CC.w + 28, CC.h + 8, '#5a4034', 'rgba(30,16,10,.65)', false);
    ctx.fillStyle = '#5a4034';
    for (const [cx, cy, sx] of [[x - 14, y - H, -1], [x + CC.w + 14, y - H, 1], [x - 14, y - H + CC.h + 8, -1], [x + CC.w + 14, y - H + CC.h + 8, 1]]) { ctx.beginPath(); ctx.moveTo(cx, cy); ctx.quadraticCurveTo(cx + sx * 12, cy, cx + sx * 14, cy - 12); ctx.lineTo(cx - sx * 6, cy + 4); ctx.closePath(); ctx.fill(); }
    // chòi nhỏ giữa cầu (miếu thờ) nhô cao
    VN.tileRoof(ctx, CC.x - 30, y - H - 22, 60, CC.h * 0.6, '#664638', 'rgba(30,16,10,.65)', false);
    ctx.fillStyle = '#7a1a14'; ctx.fillRect(CC.x - 22, y - H + CC.h * 0.58 - 22, 44, 12);
    ctx.fillStyle = '#f2d27a'; ctx.font = '800 9px Georgia,serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('來遠橋', CC.x, y - H + CC.h * 0.58 - 16);
    VN.lantern(ctx, x + 8, y + CC.h - H * 0.45, 6, 'rgba(230,40,40,1)', G.time, true); VN.lantern(ctx, x + CC.w - 8, y + CC.h - H * 0.45, 6, 'rgba(230,40,40,1)', G.time, true);
    ctx.globalAlpha = 1;
  }
  MB.Props.register('ccWall', () => {});
  MB.Props.register('chuaCau', (ctx, o, t, G) => drawChuaCau(ctx, o, G, false));
  VN.over.chuaCau = (ctx, o, G) => drawChuaCau(ctx, o, G, true);

  // cổng Hội quán Phúc Kiến (tam quan): 3 cửa, mái ngói xanh men, đầu đao rồng
  MB.Props.register('hoiQuan', (ctx, o) => {
    const x = o.x - o.hw, y = o.y - o.hh, H = 70 * H3;
    VN.shadowBox(ctx, x, y - H, o.w, o.h, 80, 0.3);
    ctx.fillStyle = '#f2d8a0'; ctx.fillRect(x, y + o.h - H, o.w, H);
    ctx.fillStyle = '#b8261e'; for (const k of [0.12, 0.38, 0.62, 0.88]) ctx.fillRect(x + o.w * k - 4, y + o.h - H, 8, H);
    ctx.fillStyle = '#2a1a10'; for (const [k, ww] of [[0.25, 0.16], [0.5, 0.18], [0.75, 0.16]]) { const dx = x + o.w * k; ctx.beginPath(); ctx.moveTo(dx - o.w * ww / 2, y + o.h); ctx.lineTo(dx - o.w * ww / 2, y + o.h - H * 0.55); ctx.arc(dx, y + o.h - H * 0.55, o.w * ww / 2, Math.PI, 0); ctx.lineTo(dx + o.w * ww / 2, y + o.h); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,190,90,.4)'; ctx.fillRect(x + o.w * 0.45, y + o.h - H * 0.5, o.w * 0.1, H * 0.5);
  });
  VN.over.hoiQuan = (ctx, o, G) => {
    const x = o.x - o.hw, y = o.y - o.hh, H = 70 * H3;
    ctx.globalAlpha = VN.coverAlpha(G, x, y - H, x + o.w, y + o.h - H);
    for (const [k, w, dy] of [[0.25, 0.3, 0], [0.75, 0.3, 0], [0.5, 0.42, -14]]) {
      const rx = x + o.w * (k - w / 2) - 6, ry = y - H + dy;
      VN.tileRoof(ctx, rx, ry, o.w * w + 12, o.h + 6, '#2f7a5e', 'rgba(10,40,30,.6)', false);
      ctx.fillStyle = '#e8c050'; ctx.fillRect(rx, ry + o.h + 2, o.w * w + 12, 4);
      ctx.strokeStyle = '#e8c050'; ctx.lineWidth = 3; for (const sx of [-1, 1]) { const cx = sx < 0 ? rx : rx + o.w * w + 12; ctx.beginPath(); ctx.moveTo(cx, ry + 4); ctx.quadraticCurveTo(cx + sx * 10, ry - 2, cx + sx * 8, ry - 14); ctx.stroke(); }
    }
    ctx.fillStyle = '#8a1a14'; ctx.fillRect(o.x - 40, y - H + 6, 80, 14); ctx.fillStyle = '#f2d27a'; ctx.font = '800 10px Georgia,serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('福建會館', o.x, y - H + 13);
    ctx.globalAlpha = 1;
  };
  // giàn hoa giấy (hồng tím) leo tường
  MB.Props.register('bougain', (ctx, o) => { MB.Props.shadow(ctx, o.x + 8, o.y + 6, o.r, o.r * 0.5, 0.25); ctx.fillStyle = '#4a3622'; U.circle(ctx, o.x, o.y, 5); ctx.fill(); });
  VN.over.bougain = (ctx, o, G) => {
    const cx = o.x, cy = o.y - 26;
    ctx.globalAlpha = VN.coverAlpha(G, cx - o.r, cy - o.r, cx + o.r, cy + o.r);
    ctx.fillStyle = '#2f6a34'; U.circle(ctx, cx, cy, o.r * 0.9); ctx.fill();
    const r = U.seeded(o.x | 0);
    for (let i = 0; i < 26; i++) { const a = r() * U.TAU, d = r() * o.r; ctx.fillStyle = r() < 0.7 ? '#e0368a' : '#f070b0'; U.circle(ctx, cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.85, 3 + r() * 3); ctx.fill(); }
    ctx.globalAlpha = 1;
  };
  // đèn ma GoatEvil (mục tiêu thử thách): đèn lồng tím ma quái trên cột
  MB.Props.register('evilLantern', (ctx, o, t) => {
    MB.Props.shadow(ctx, o.x + 10, o.y + 6, 16, 6, 0.3);
    ctx.fillStyle = '#2a2030'; U.circle(ctx, o.x, o.y, 6); ctx.fill();
    ctx.strokeStyle = '#2a2030'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(o.x, o.y - 46); ctx.stroke();
    const pul = 1 + Math.sin(t * 4 + o.x) * 0.1;
    VN.lantern(ctx, o.x, o.y - 52, o.r * 0.7 * pul, o.flash > 0 ? 'rgba(255,255,255,1)' : 'rgba(170,70,255,1)', t, true);
    ctx.fillStyle = '#1a0a24'; ctx.fillRect(o.x - 5, o.y - 56, 3, 3); ctx.fillRect(o.x + 2, o.y - 56, 3, 3);
  });

  /* ---------- quái mới ---------- */
  Ens.register('lanternWisp', Ens.make({
    name: 'Ma Đèn Lồng', r: 15, hp: 45, speed: 150, dmg: 16, score: 110, fly: true, blood: '#3a1a4a', gore: '#c070ff', knockMul: 1.4,
    draw(ctx, e, G) {
      const t = G.time, sw = 1 + (e.swell || 0) * 0.5;
      // đuôi lửa ma
      for (let i = 1; i < 6; i++) { ctx.fillStyle = `rgba(170,80,255,${0.18 - i * 0.025})`; U.circle(ctx, e.x - (e.vx || 0) * i * 0.03, e.y - (e.vy || 0) * i * 0.03 + i * 2, 12 - i); ctx.fill(); }
      VN.lantern(ctx, e.x, e.y + Math.sin(t * 5 + e.t) * 3, 11 * sw, (e.swell || 0) > 0.5 && Math.sin(t * 30) > 0 ? 'rgba(255,90,90,1)' : 'rgba(180,90,255,1)', t, true);
      ctx.fillStyle = '#1a0624'; ctx.fillRect(e.x - 5, e.y - 3, 3, 4); ctx.fillRect(e.x + 2, e.y - 3, 3, 4); ctx.fillRect(e.x - 3, e.y + 4, 6, 2);
    },
  }, Ens.AI.exploder({ trigger: 70, fuse: 0.6, r: 85, dmg: 16, dmgEnemies: 30, color: '#b070ff', ring: '180,90,255', wig: { f: 3, a: 0.6 }, deathBlast: false,
    pool: { kind: 'fire', r: 46, life: 2.5, dps: 6, burn: 1, enemyDps: 0, color: 'rgba(170,90,255,.35)' } })));

  Ens.register('riverSnake', Ens.make({
    name: 'Thuỷ Xà', r: 17, hp: 90, speed: 140, dmg: 15, score: 150, blood: '#1a3a3a', gore: '#6ad0c0',
    draw(ctx, e, G) {
      if (e.hidden) return;
      const t = G.time;
      ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.face || 0);
      ctx.strokeStyle = '#2f6a62'; ctx.lineWidth = 12; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(0, 0); for (let i = 1; i <= 5; i++) ctx.lineTo(-i * 9, Math.sin(t * 9 + i) * 6); ctx.stroke();
      ctx.strokeStyle = '#4fa094'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(0, 0); for (let i = 1; i <= 5; i++) ctx.lineTo(-i * 9, Math.sin(t * 9 + i) * 6); ctx.stroke();
      ctx.fillStyle = '#2f6a62'; U.ellipse(ctx, 6, 0, 12, 9); ctx.fill();
      ctx.fillStyle = '#e8f070'; U.circle(ctx, 11, -4, 2); ctx.fill(); U.circle(ctx, 11, 4, 2); ctx.fill();
      ctx.restore();
    },
  }, Ens.AI.burrower({ emerge: 95, up: 2.2, underMul: 1.6, dirt: '#5a8a8a', ripple: '120,220,230' })));

  /* ---------- BOSS: MÃNG XÀ ĐÈN LỒNG ---------- */
  const NSEG = 16;
  const SEGC = ['#e8302a', '#f08a20', '#f2c63a'];
  Ens.register('lanternSerpent', {
    name: 'Mãng Xà Đèn Lồng', r: 46, hp: 12500, speed: 205, dmg: 24, score: 0, boss: true, knockMul: 0, blood: '#3a1a10', gore: '#ffb040',
    init(e, G) {
      e.phase = 1; e.state = 'chase'; e.spitT = 3; e.diveT = 7; e.novaT = 9; e.trail = []; e.segs = [];
      for (let i = 0; i < NSEG; i++) { const a = { kind: 'serpSeg', x: e.x, y: e.y, r: 22 - i * 0.7, i, h: 18 }; e.segs.push(a); G.actors.push(a); }
    },
    onDeath(e, G) { for (const a of e.segs) { a.dead = true; G.burst(a.x, a.y, SEGC[a.i % 3], 10, 180); } },
    armorFn(e, dmg) { return e.state === 'under' || e.state === 'rise' ? 0 : dmg; },
    update(e, G, dt) {
      const p = G.player, d = Ens.distPlayer(e, G), k = e.hp / e.maxHp;
      const ph = k > 0.62 ? 1 : k > 0.28 ? 2 : 3;
      if (ph > e.phase) { e.phase = ph; G.shake(12); MB.Audio.play('roar'); G.banner(`PHASE ${ph}`, ph === 2 ? 'Mãng xà chui xuống lòng phố' : 'Vòng lửa đèn lồng', 2); }
      if (e.state === 'chase') {
        const a = Ens.toPlayer(e, G) + Math.sin(G.time * 2.4) * 0.6;
        Ens.steer(e, G, e.x + Math.cos(a) * 200, e.y + Math.sin(a) * 200, e.speed * (ph === 3 ? 1.2 : 1), dt);
        e.face = Math.atan2(e.vy, e.vx);
        e.spitT -= dt; e.diveT -= dt; e.novaT -= dt;
        if (e.spitT <= 0 && d < 620) { e.state = 'spitAim'; e.st = 0.6; e.lock = Ens.toPlayer(e, G); }
        else if (ph >= 2 && e.diveT <= 0) { e.state = 'under'; e.st = 1.6; e.hidden = true; e.invuln = true; G.burst(e.x, e.y, '#8a6a4a', 30, 220); G.shake(8); MB.Audio.play('slam'); }
        else if (ph === 3 && e.novaT <= 0) { e.state = 'coil'; e.st = 1.1; }
      } else if (e.state === 'spitAim') {
        Ens.stop(e, dt, 10); e.st -= dt; e.lock += U.angDiff(e.lock, Ens.toPlayer(e, G)) * Math.min(1, dt * 3); e.face = e.lock;
        if (e.st <= 0) {
          const n = ph === 1 ? 3 : 5;
          for (let i = 0; i < n; i++) G.enemyShot({ x: e.x + Math.cos(e.lock) * 40, y: e.y + Math.sin(e.lock) * 40, a: e.lock + (i - (n - 1) / 2) * 0.22, speed: 300, r: 12, dmg: 14, color: '#ffb040', owner: e, life: 2.4,
            onEnd: (GG, b) => GG.addHazard({ kind: 'fire', x: b.x, y: b.y, r: 40, life: 2.5, dps: 7, burn: 1, enemyDps: 0 }) });
          MB.Audio.play('shot_flame'); e.state = 'chase'; e.spitT = ph === 1 ? 3.2 : 2.4;
        }
      } else if (e.state === 'under') {
        // di chuyển ngầm (gợn đất) về phía người chơi
        e.st -= dt; Ens.steer(e, G, p.x, p.y, 360, dt);
        if (e.st <= 0) { e.state = 'rise'; e.st = 1.0; e.rx = p.x; e.ry = p.y; G.telegraphCircle(p.x, p.y, 120, 1.0); }
      } else if (e.state === 'rise') {
        Ens.stop(e, dt, 30); e.st -= dt; e.x += (e.rx - e.x) * Math.min(1, dt * 6); e.y += (e.ry - e.y) * Math.min(1, dt * 6);
        if (e.st <= 0) {
          e.state = 'chase'; e.hidden = false; e.invuln = false; e.diveT = ph === 3 ? 6 : 8.5;
          G.explosion(e.x, e.y, 120, 40, { player: 30, knock: 600, color: '#ffb040', ring: '255,170,60', obstacles: false });
          for (let i = 0; i < 8; i++) G.enemyShot({ x: e.x, y: e.y, a: i / 8 * U.TAU, speed: 260, r: 9, dmg: 10, color: '#ffd060', owner: e, life: 1.6 });
          e.trail.length = 0;
        }
      } else if (e.state === 'coil') {
        Ens.stop(e, dt, 10); e.st -= dt; e.face += dt * 8;
        if (e.st <= 0) {
          for (let i = 0; i < 18; i++) G.enemyShot({ x: e.x, y: e.y, a: i / 18 * U.TAU + G.time, speed: 240, r: 10, dmg: 12, color: '#ff8a30', owner: e, life: 2.6 });
          for (const s of e.segs) if (s.i % 4 === 0) G.addHazard({ kind: 'fire', x: s.x, y: s.y, r: 44, life: 4, dps: 8, burn: 1.2, enemyDps: 0 });
          MB.Audio.play('boom'); e.state = 'chase'; e.novaT = 7.5;
        }
      }
      // thân rắn bám theo vệt đường đi của đầu
      const tr = e.trail, last = tr[0];
      if (!last || Math.hypot(last[0] - e.x, last[1] - e.y) > 5) { tr.unshift([e.x, e.y]); if (tr.length > NSEG * 8 + 4) tr.length = NSEG * 8 + 4; }
      for (const s of e.segs) {
        const pt = tr[Math.min(tr.length - 1, (s.i + 1) * 7)] || [e.x, e.y];
        s.x += (pt[0] - s.x) * Math.min(1, dt * 14); s.y += (pt[1] - s.y) * Math.min(1, dt * 14);
        s.hidden = e.hidden; s.h = 14 + Math.sin(G.time * 6 - s.i * 0.6) * 5;
        // chạm vào thân rắn: bỏng + bị đẩy
        if (!e.hidden && !p.dead && U.dist(s.x, s.y, p.x, p.y) < s.r + p.r - 4 && p.iframes <= 0) { G.hurtPlayer(12, s); p.burnT = Math.max(p.burnT || 0, 1); }
      }
    },
    tele(ctx, e, G) {
      if (e.state === 'spitAim') G.drawTelegraphLine(ctx, e.x, e.y, e.lock, 420, 1 - e.st / 0.6);
      if (e.state === 'under') { const k = (G.time * 3) % 1; ctx.strokeStyle = `rgba(255,170,60,${0.7 * (1 - k)})`; ctx.lineWidth = 3; U.circle(ctx, e.x, e.y, 20 + k * 40); ctx.stroke(); }
      if (e.state === 'coil') { ctx.fillStyle = `rgba(255,120,40,${0.15 + (1 - e.st / 1.1) * 0.25})`; U.circle(ctx, e.x, e.y, 200); ctx.fill(); }
    },
    draw(ctx, e, G) {
      const t = G.time;
      if (!e.hidden) {
        // thân: chuỗi đèn lồng (vẽ từ đuôi tới đầu)
        for (let i = e.segs.length - 1; i >= 0; i--) {
          const s = e.segs[i], c = SEGC[i % 3];
          ctx.fillStyle = 'rgba(0,0,0,.25)'; U.ellipse(ctx, s.x + 4, s.y + 10, s.r, s.r * 0.5); ctx.fill();
          VN.lantern(ctx, s.x, s.y - 6, s.r * 0.8, hexA(c), t, i % 2 === 0);
          ctx.fillStyle = '#3a1a10'; ctx.beginPath(); ctx.moveTo(s.x - 4, s.y - s.r * 0.9 - 6); ctx.lineTo(s.x, s.y - s.r * 1.4 - 6); ctx.lineTo(s.x + 4, s.y - s.r * 0.9 - 6); ctx.fill(); // vây lưng
        }
      }
      if (e.hidden) return;
      ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.face || 0);
      const open = e.state === 'spitAim' || e.state === 'coil' ? 0.5 : 0.15 + Math.abs(Math.sin(t * 3)) * 0.1;
      ctx.fillStyle = '#b8261e'; U.ellipse(ctx, 0, 0, 52, 34); ctx.fill();
      ctx.fillStyle = '#e8402a'; U.ellipse(ctx, 14, 0, 40, 26); ctx.fill();
      // hàm mở
      ctx.fillStyle = '#3a0a06'; ctx.beginPath(); ctx.moveTo(30, 0); ctx.lineTo(60, -22 * open - 4); ctx.lineTo(60, 22 * open + 4); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffe0a0'; for (let i = 0; i < 4; i++) { ctx.fillRect(36 + i * 6, -14 * open - 3, 3, 5); ctx.fillRect(36 + i * 6, 14 * open - 2, 3, 5); }
      // sừng, râu rồng, mắt
      ctx.strokeStyle = '#f2c63a'; ctx.lineWidth = 5; ctx.lineCap = 'round';
      for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(-6, sd * 18); ctx.quadraticCurveTo(-34, sd * 40, -54, sd * 30); ctx.stroke(); }
      ctx.strokeStyle = '#ffd060'; ctx.lineWidth = 2;
      for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(44, sd * 14); ctx.quadraticCurveTo(60, sd * (30 + Math.sin(t * 4) * 8), 40, sd * 50); ctx.stroke(); }
      for (const sd of [-1, 1]) { const gl = ctx.createRadialGradient(18, sd * 14, 1, 18, sd * 14, 14); gl.addColorStop(0, 'rgba(255,255,180,1)'); gl.addColorStop(1, 'rgba(255,160,40,0)'); ctx.fillStyle = gl; U.circle(ctx, 18, sd * 14, 14); ctx.fill(); ctx.fillStyle = '#2a0a04'; ctx.fillRect(16, sd * 14 - 4, 4, 8); }
      ctx.restore();
    },
  });
  function hexA(c) { const n = parseInt(c.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},1)`; }
  MB.Props.registerActor('serpSeg', () => {}); // vẽ cùng boss
  MB.Props.registerActor('boatLantern', (ctx, a, G) => {
    const t = G.time, x = a.x + Math.sin(t * 0.3 + a.ph) * 30, y = a.y + Math.sin(t * 1.2 + a.ph) * 3;
    ctx.save(); ctx.translate(x, y); ctx.rotate(a.rot);
    ctx.fillStyle = 'rgba(0,0,0,.3)'; U.ellipse(ctx, 6, 8, 64, 16); ctx.fill();
    ctx.fillStyle = '#3a2416'; ctx.beginPath(); ctx.moveTo(-66, 0); ctx.quadraticCurveTo(-50, -18, 0, -18); ctx.quadraticCurveTo(50, -18, 66, 0); ctx.quadraticCurveTo(50, 18, 0, 18); ctx.quadraticCurveTo(-50, 18, -66, 0); ctx.fill();
    ctx.fillStyle = '#6a3a22'; U.ellipse(ctx, 0, 0, 52, 12); ctx.fill();
    ctx.fillStyle = '#e8302a'; U.ellipse(ctx, 58, 0, 6, 8); ctx.fill(); // mắt thuyền
    ctx.restore();
    for (let i = 0; i < 3; i++) VN.lantern(ctx, x - 30 + i * 30, y - 16, 5, ['rgba(230,40,40,1)', 'rgba(250,210,60,1)', 'rgba(200,60,160,1)'][i], t, true);
  });

  /* ---------- bản đồ ---------- */
  const rng = U.seeded(1212);
  const obstacles = [];
  // sông Hoài (phía Nam) + rạch chảy ra sông, chừa lối đi qua Chùa Cầu
  const CELL = 40;
  for (let y = RIVER; y < WH; y += CELL) obstacles.push({ kind: 'lake', shape: 'box', x: WW / 2, y: y + CELL / 2, w: WW, h: CELL + 2, rot: 0, noShot: true, water: true });
  for (let y = CANAL.y0; y < RIVER; y += CELL) {
    if (y + CELL > CC.y - CC.h / 2 + 6 && y < CC.y + CC.h / 2 - 6) continue;
    obstacles.push({ kind: 'lake', shape: 'box', x: (CANAL.x0 + CANAL.x1) / 2, y: y + CELL / 2, w: CANAL.x1 - CANAL.x0, h: CELL + 2, rot: 0, noShot: true, water: true });
  }
  // vách Chùa Cầu (2 bên lối đi) + phần cầu để vẽ
  obstacles.push({ kind: 'ccWall', shape: 'box', x: CC.x, y: CC.y - CC.h / 2 - 4, w: CC.w, h: 10, rot: 0 });
  obstacles.push({ kind: 'ccWall', shape: 'box', x: CC.x, y: CC.y + CC.h / 2 + 4, w: CC.w, h: 10, rot: 0 });
  obstacles.push({ kind: 'chuaCau', shape: 'box', x: CC.x, y: CC.y - CC.h / 2 - 16, w: 12, h: 12, rot: 0, noShot: true, tall: 120 });
  // dãy nhà cổ: 3 phố ngang (Trần Phú y≈620, Nguyễn Thái Học y≈1260, Bạch Đằng ven sông y≈1830)
  const STREETS_X = [[CANAL.x0 - 70, CANAL.x1 + 70], [1500, 1600], [2300, 2400], [3000, 3100]];
  const rows = (y1, y2) => { let x = 60; for (const [s0, s1] of STREETS_X) { if (s0 - x > 80) VN.row(obstacles, rng, x, y1, s0, y2, true, 'hoian'); x = s1; } VN.row(obstacles, rng, x, y1, WW - 60, y2, true, 'hoian'); };
  rows(90, 270);
  rows(390, 550);
  // khu giữa: chừa sân trước Hội quán
  const HQ = { x: 1950, y: 760, w: 300, h: 90 };
  { let x = 60; for (const [s0, s1] of STREETS_X) { if (s0 - x > 80) { if (x < HQ.x + HQ.w / 2 + 40 && s0 > HQ.x - HQ.w / 2 - 40) { VN.row(obstacles, rng, x, 720, HQ.x - HQ.w / 2 - 40, 880, true, 'hoian'); VN.row(obstacles, rng, HQ.x + HQ.w / 2 + 40, 720, s0, 880, true, 'hoian'); } else VN.row(obstacles, rng, x, 720, s0, 880, true, 'hoian'); } x = s1; } VN.row(obstacles, rng, x, 720, WW - 60, 880, true, 'hoian'); }
  obstacles.push({ kind: 'hoiQuan', shape: 'box', x: HQ.x, y: HQ.y + 40, w: HQ.w, h: HQ.h, rot: 0, tall: 110 });
  rows(1010, 1170);
  { let x = 60; for (const [s0, s1] of STREETS_X) { if (s0 - x > 80) VN.row(obstacles, rng, x, 1400, s0, 1570, true, 'hoian'); x = s1; } VN.row(obstacles, rng, x, 1400, 2600, 1570, true, 'hoian'); }
  // kho hàng số 7 (bến sông phía Đông) để trống — nơi giấu manh mối
  const WAREHOUSE = { x: 3200, y: 1520 };
  // giàn hoa giấy, đèn ma
  [[300, 640], [1250, 950], [2700, 950], [1700, 1320], [2900, 640], [480, 1660], [2500, 1660]].forEach(([x, y]) => obstacles.push({ kind: 'bougain', shape: 'circle', x, y, r: 30, tall: 60 }));
  // dây đèn lồng giăng ngang phố
  const strings = [];
  const LCOL = ['rgba(230,40,40,1)', 'rgba(255,170,40,1)', 'rgba(250,210,60,1)', 'rgba(200,60,160,1)', 'rgba(60,170,90,1)', 'rgba(70,120,230,1)'];
  const addString = (x1, y1, x2, y2) => { const n = Math.max(4, Math.round(Math.hypot(x2 - x1, y2 - y1) / 46)); strings.push({ x1, y1, x2, y2, n, cols: Array.from({ length: n }, () => LCOL[(rng() * LCOL.length) | 0]) }); };
  for (const y of [340, 640, 950, 1290]) for (let x = 200; x < WW - 200; x += 360) addString(x, y - 50, x + 220, y + 50);
  for (let x = 300; x < WW - 300; x += 420) addString(x, 1860, x + 260, 1780);
  // ánh sáng: đèn lồng các nhà + dây đèn + thuyền
  const lights = [];
  for (const o of obstacles) if (o.kind === 'row') for (const u of o.units) if (u.lan.length) lights.push({ x: o.x - o.w / 2 + u.u0 + u.uw / 2, y: o.y + o.h / 2 + 6, r: 170, h: 24, c: 'rgba(255,150,60,.16)' });
  for (const s of strings) lights.push({ x: (s.x1 + s.x2) / 2, y: (s.y1 + s.y2) / 2, r: 200, h: 40, c: 'rgba(255,170,80,.14)' });
  lights.push({ x: CC.x, y: CC.y, r: 220, h: 30, c: 'rgba(255,120,60,.2)' });
  const boats = [[1300, 2080, 0.05], [2100, 2180, -0.08], [2900, 2060, 0.1], [600, 2200, 0]];
  for (const [x, y] of boats) lights.push({ x, y: y - 16, r: 180, h: 20, c: 'rgba(255,160,70,.18)' });

  MB.registerGate({
    id: 12, seed: 1212, view3d: true, act: 2,
    title: 'GATE 12 — HỘI AN', subtitle: 'Phố cổ đêm đèn lồng',
    world: { w: WW, h: WH }, bg: '#0a0c18', mmColor: 'rgba(200,160,90,.7)',
    scale: { hp: 2.1, dmg: 1.45 },
    start: { x: 200, y: 950 },
    obstacles, hazards: [],
    crates: [{ x: 1100, y: 640 }, { x: 2700, y: 340 }, { x: 1950, y: 1290 }, { x: 3300, y: 1290 }, { x: 420, y: 1830 }, { x: 2000, y: 1830 }, { x: 3000, y: 950 }],
    spawnPoints: [
      { x: 1550, y: 60 }, { x: 2350, y: 60 }, { x: 3050, y: 60 }, { x: 780, y: 60 },
      { x: 3500, y: 340 }, { x: 3500, y: 950 }, { x: 3500, y: 1290 }, { x: 3500, y: 1830 },
      { x: 1550, y: 1830 }, { x: 2350, y: 1830 }, { x: 60, y: 1830 }, { x: 60, y: 640 },
    ],
    waves: [
      { total: 24, maxAlive: 12, mix: { zombie: 3, runner: 4, lanternWisp: 3, riverSnake: 2 }, interval: [0.5, 0.9], elite: 0.12 },
      { total: 28, maxAlive: 13, mix: { lanternWisp: 4, riverSnake: 3, goatDrone: 2, xeOm: 2, licker: 2 }, interval: [0.45, 0.85], elite: 0.16 },
      { total: 32, maxAlive: 15, mix: { lanternWisp: 4, riverSnake: 3, goatDrone: 3, xeOm: 2, riot: 2, runner: 3 }, interval: [0.4, 0.8], elite: 0.2 },
    ],
    boss: { type: 'lanternSerpent', x: 2000, y: 1830, fixed: true },
    intro: { title: 'MÀN 2 · NHIỆM VỤ', text: 'Hội An về đêm: chỉ thấy rõ quanh đèn lồng. Tìm KHO SỐ 7 ở bến sông phía Đông — manh mối thứ hai của Giáo sư Ted.' },
    objectives: [
      { title: 'PHỐ ĐÈN LỒNG', text: 'Ma Đèn Lồng bay tới và tự nổ (vòng đỏ): bắn từ xa hoặc lùi lại.' },
      { title: 'BẾN SÔNG HOÀI', text: 'Thuỷ Xà lặn (gợn nước xanh) rồi trồi lên ở vòng đỏ.' },
      { title: 'ĐÊM SÂU', text: 'Wave cuối trước khi thứ gì đó trồi lên từ sông Hoài.' },
      { title: 'BOSS · MÃNG XÀ ĐÈN LỒNG', text: 'Chỉ bắn được đầu rắn. Tránh chạm thân lửa. Khi nó chui xuống, chạy khỏi vòng đỏ.' },
    ],
    challenges: [
      { id: 'evil', type: 'destroy', name: 'Đèn Ma GoatEvil', desc: 'Phá 4 đèn lồng tím', kind: 'evilLantern', r: 20, hp: 260,
        spawner: { type: 'lanternWisp', every: 7, range: 700, cap: 5 },
        targets: [{ x: 1150, y: 340 }, { x: 2650, y: 640 }, { x: 1150, y: 1830 }, { x: 2900, y: 1290 }], reward: { mod: 'pierce' } },
      { id: 'bridge', type: 'hold', name: 'Giữ Chùa Cầu', desc: 'Đứng trong Chùa Cầu 15 giây', zone: { x: CC.x, y: CC.y, r: 70 }, time: 15,
        mix: { lanternWisp: 2, riverSnake: 1 }, spawnEvery: 1.9, reward: { mod: 'mag' } },
      { id: 'streak', type: 'streak', name: 'Đêm Rằm Phố Hội', desc: '20 hạ gục liên tiếp không trúng đòn', count: 20, reward: { mod: 'split' } },
    ],
    clue: { x: WAREHOUSE.x, y: WAREHOUSE.y, title: 'Ghi chép số 2 — Hội An', text: [
      'Ngày 9. Kho số 7 trống trơn. Chỉ còn một thùng làm lạnh khắc biểu tượng đầu dê.',
      'Hoá đơn vận chuyển ký tên "T.K." — Tôi biết chữ ký này. Tôi đã nhìn thấy nó mỗi ngày, suốt mười hai năm.',
      'Lô hàng tiếp theo đã được đưa ra phía Bắc, theo đường biển. Hạ Long.',
    ] },
    comms: [
      { on: 'start', t: 2.5, lines: [['HUNTER', 'Hội An về đêm… đèn lồng khắp nơi. Đẹp đến lạ.']] },
      { on: 'start', t: 8, lines: [['GOATEVIL', 'Đẹp nhỉ? Mỗi chiếc đèn lồng là một con mắt của ta.']] },
      { on: 'wave', wave: 2, lines: [['GOATEVIL', 'Đừng đứng trong bóng tối quá lâu, Hunter.']] },
      { on: 'low', lines: [['GOATEVIL', 'Ngọn đèn của ngươi sắp tắt rồi.']] },
      { on: 'boss', lines: [['GOATEVIL', 'Sông Hoài có một vị khách muốn chào ngươi.'], ['HUNTER', 'Cái quái gì thế kia…']] },
      { on: 'phase', phase: 3, lines: [['GOATEVIL', 'Cháy đi, cháy cho rực rỡ như phố Hội!']] },
      { on: 'won', lines: [['HUNTER', 'Biểu tượng đầu dê… xuất hiện ở mọi nơi Giáo sư từng đi qua. Trùng hợp sao?']] },
    ],
    light3d: { hemiSky: 0x7a88c8, hemiGround: 0x2a1e14, hemi: 1.15, sun: 0xb0c0ff, sunI: 0.95, exposure: 1.6 },
    hazards3d: { smoke: { inner: 'rgba(40,40,50,0.85)', outer: 'rgba(30,30,40,0)', add: false, opacity: 0.8 } },

    setup(G) {
      G.__over = null;
      for (const [x, y, rot] of boats) G.actors.push({ kind: 'boatLantern', x, y, rot, ph: x * 0.01, r: 60 });
      G.actors.push({ kind: 'lanternNet', x: 0, y: 0, r: 1 }, { kind: 'hoaDang', x: 0, y: RIVER, r: 1 });
    },
    drawUnder(G, ctx) {
      // hoa đăng trôi trên sông
      const t = G.time;
      for (let i = 0; i < 40; i++) {
        const x = ((i * 271 + t * (12 + (i % 5) * 3)) % (WW + 200)) - 100, y = RIVER + 60 + (i * 97 % 420) + Math.sin(t + i) * 6;
        if (!G.inView(x, y, 30)) continue;
        const gr = ctx.createRadialGradient(x, y, 1, x, y, 22); gr.addColorStop(0, 'rgba(255,200,90,.6)'); gr.addColorStop(1, 'rgba(255,160,60,0)');
        ctx.fillStyle = gr; U.circle(ctx, x, y, 22); ctx.fill();
        ctx.fillStyle = ['#f070a0', '#f2c63a', '#ff8a5a'][i % 3]; for (let k = 0; k < 6; k++) { const a = k / 6 * U.TAU; U.circle(ctx, x + Math.cos(a) * 5, y + Math.sin(a) * 4, 3); ctx.fill(); }
        ctx.fillStyle = '#fff6c8'; U.circle(ctx, x, y, 2); ctx.fill();
      }
      // gợn ánh đèn trên mặt nước
      ctx.strokeStyle = 'rgba(255,190,110,.18)'; ctx.lineWidth = 2;
      for (let i = 0; i < 30; i++) { const x = (i * 131) % WW, y = RIVER + 40 + (i * 53 % 460) + Math.sin(t * 0.8 + i) * 8; ctx.beginPath(); ctx.moveTo(x - 30, y); ctx.quadraticCurveTo(x, y - 4, x + 30, y); ctx.stroke(); }
    },
    drawOver(G, ctx) {
      VN.drawOver(G, ctx);
      // dây đèn lồng giăng ngang phố (lớp cao nhất)
      const t = G.time;
      for (const s of strings) {
        if (!G.inView((s.x1 + s.x2) / 2, (s.y1 + s.y2) / 2 - 60, 300)) continue;
        const pt = (k) => { const x = s.x1 + (s.x2 - s.x1) * k, y = s.y1 + (s.y2 - s.y1) * k - 70 + Math.sin(k * Math.PI) * 26; return [x, y]; };
        ctx.strokeStyle = 'rgba(20,14,10,.8)'; ctx.lineWidth = 1.2; ctx.beginPath();
        for (let i = 0; i <= 20; i++) { const [x, y] = pt(i / 20); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); } ctx.stroke();
        for (let i = 0; i < s.n; i++) { const [x, y] = pt((i + 0.5) / s.n); VN.lantern(ctx, x, y + 9 + Math.sin(t * 2 + i) * 1.5, 6, s.cols[i], t, true); }
      }
    },
    drawScreen(G, ctx) {
      const p = G.player, L = [{ x: p.x, y: p.y, r: 300, k: 0.95 }, ...lights];
      for (const e of G.enemies) if (!e.dead && e.type === 'lanternWisp') L.push({ x: e.x, y: e.y, r: 120, h: 20, c: 'rgba(170,80,255,.25)' });
      if (G.boss && !G.boss.dead && !G.boss.hidden) for (const s of G.boss.segs) if (s.i % 3 === 0) L.push({ x: s.x, y: s.y, r: 160, h: 20, c: 'rgba(255,150,50,.2)' });
      for (const h of G.hazards) if (h.kind === 'fire') L.push({ x: h.x, y: h.y, r: h.r * 2.4, c: 'rgba(255,120,40,.18)' });
      if (G.clue && !G.clue.taken) L.push({ x: G.clue.x, y: G.clue.y, r: 140, c: 'rgba(255,220,120,.3)' });
      VN.darkness(G, ctx, L, G.r3on ? 0.32 : 0.7);
    },

    buildGround(g, w, h, rand) {
      // đường lát gạch cũ + đá
      g.fillStyle = '#4a4038'; g.fillRect(0, 0, w, h);
      GK.patches(g, rand, w, h, 260, ['rgba(80,66,52,.4)', 'rgba(40,32,26,.4)', 'rgba(90,80,60,.25)'], 30, 110);
      g.strokeStyle = 'rgba(30,22,16,.35)'; g.lineWidth = 1;
      for (let y = 0; y < RIVER; y += 22) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
      for (let y = 0; y < RIVER; y += 22) for (let x = (y / 22 % 2) * 22; x < w; x += 44) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 22); g.stroke(); }
      // hiên nhà (gạch đỏ) quanh dãy nhà
      for (const o of obstacles) if (o.kind === 'row') { g.fillStyle = '#7a4a34'; g.fillRect(o.x - o.w / 2 - 18, o.y - o.h / 2 - 18, o.w + 36, o.h + 36); }
      // kè sông + mặt nước sông Hoài (xanh đêm)
      g.fillStyle = '#5a5248'; g.fillRect(0, RIVER - 18, w, 22);
      const wg = g.createLinearGradient(0, RIVER, 0, h); wg.addColorStop(0, '#16304a'); wg.addColorStop(1, '#0a1a2c');
      g.fillStyle = wg; g.fillRect(0, RIVER, w, h - RIVER);
      g.fillStyle = '#5a5248'; g.fillRect(CANAL.x0 - 12, CANAL.y0 - 12, CANAL.x1 - CANAL.x0 + 24, RIVER - CANAL.y0 + 12);
      g.fillStyle = '#16304a'; g.fillRect(CANAL.x0, CANAL.y0, CANAL.x1 - CANAL.x0, RIVER - CANAL.y0 + 4);
      // bến kho số 7
      g.fillStyle = '#5a4030'; g.fillRect(WAREHOUSE.x - 140, WAREHOUSE.y - 90, 280, 180);
      g.strokeStyle = 'rgba(30,18,8,.5)'; for (let x = WAREHOUSE.x - 140; x < WAREHOUSE.x + 140; x += 14) { g.beginPath(); g.moveTo(x, WAREHOUSE.y - 90); g.lineTo(x, WAREHOUSE.y + 90); g.stroke(); }
      g.fillStyle = '#e8d6a8'; g.font = '900 40px Georgia,serif'; g.textAlign = 'center'; g.fillText('7', WAREHOUSE.x, WAREHOUSE.y - 40);
      // sân Hội quán lát đá
      g.fillStyle = '#6e6458'; g.fillRect(HQ.x - HQ.w / 2 - 30, HQ.y + 90, HQ.w + 60, 140);
      GK.dots(g, rand, w, h, 1200, ['rgba(120,100,80,.4)', 'rgba(20,16,12,.5)'], 3);
      GK.vignette(g, w, h, 0.5);
    },

    /* ---------- 3D ---------- */
    models3d: {
      lanternWisp: (K) => ({
        base: 15,
        build() {
          const T = K.T, g = new T.Group(), body = new T.Group(); body.position.y = 26; g.add(body);
          const ln = K.mesh(K.sph(11, 14), K.glowMat(0xb070ff, 1.8), 0, 0, 0, false); ln.scale.y = 1.2; body.add(ln);
          body.add(K.mesh(K.cyl(6, 6, 3, 10), K.std(0x2a1a10), 0, 13, 0), K.mesh(K.cyl(6, 6, 3, 10), K.std(0x2a1a10), 0, -13, 0), K.glowSprite(0xb070ff, 60, 0.6));
          for (const z of [-4, 4]) body.add(K.mesh(K.box(2, 3, 2.4), K.std(0x1a0624), 10, 2, z));
          g.userData = { body, h: 40 }; return g;
        },
        anim(e, m, G) { const d = m.userData; d.body.position.y = 26 + Math.sin(G.time * 5 + e.t) * 3; d.body.scale.setScalar(1 + (e.swell || 0) * 0.5); },
      }),
      riverSnake: (K) => ({
        base: 17,
        build() {
          const T = K.T, g = new T.Group(), sk = K.std(0x2f6a62, { rough: 0.4 }), segs = [];
          for (let i = 0; i < 6; i++) { const s = K.mesh(K.sph(8 - i * 0.8, 10), sk, -i * 9, 7, 0); g.add(s); segs.push(s); }
          const head = K.mesh(K.sph(9, 12), sk, 6, 9, 0); head.scale.set(1.3, 0.8, 1); g.add(head);
          for (const z of [-4, 4]) g.add(K.mesh(K.sph(1.8, 6), K.glowMat(0xe8f070, 2), 15, 12, z, false));
          g.userData = { segs, h: 20 }; return g;
        },
        anim(e, m, G) { m.userData.segs.forEach((s, i) => { s.position.z = Math.sin(G.time * 9 + i) * 5; }); m.visible = !e.hidden; },
      }),
      lanternSerpent: (K) => ({
        base: 46,
        build() {
          const T = K.T, g = new T.Group(), red = K.std(0xb8261e, { rough: 0.5 }), gold = K.std(0xf2c63a, { metal: 0.5, rough: 0.3 });
          const head = new T.Group(); head.position.y = 22; g.add(head);
          const skull = K.mesh(K.sph(30, 18), red, 0, 0, 0); skull.scale.set(1.6, 0.8, 1.05); head.add(skull);
          const snout = K.mesh(K.sph(20, 16), K.std(0xe8402a, { rough: 0.5 }), 30, -2, 0); snout.scale.set(1.5, 0.6, 0.9); head.add(snout);
          const jaw = K.mesh(K.box(40, 5, 28), K.std(0x7a1a10), 36, -12, 0); head.add(jaw);
          for (const z of [-1, 1]) {
            const horn = K.mesh(K.G3('shorn', () => new T.ConeGeometry(4, 40, 8)), gold, -14, 18, z * 14); horn.rotation.z = 1.9; horn.rotation.x = z * 0.4; head.add(horn);
            head.add(K.mesh(K.sph(5, 10), K.glowMat(0xfff0a0, 2.6), 18, 8, z * 15, false));
            const wh = K.mesh(K.box(30, 1.2, 1.2), gold, 50, 0, z * 16); wh.rotation.y = z * 0.6; head.add(wh);
          }
          head.add(K.glowSprite(0xffa040, 120, 0.45));
          g.userData = { head, jaw, h: 60 }; return g;
        },
        anim(e, m, G) { const d = m.userData; d.jaw.rotation.z = -(e.state === 'spitAim' || e.state === 'coil' ? 0.5 : 0.1 + Math.abs(Math.sin(G.time * 3)) * 0.1); d.head.position.y = 22 + Math.sin(G.time * 4) * 3; m.visible = !e.hidden; },
      }),
    },
    props3d: {
      ccWall: (o, K) => new K.T.Group(),
      chuaCau: (o, K) => {
        // dựng cả cây cầu, căn theo tâm CC (vật cản này nằm lệch phía Bắc)
        const T = K.T, g = new T.Group(), root = new T.Group(); root.position.set(CC.x - o.x, 0, CC.y - o.y); g.add(root);
        const wood = K.std(0x7a4a2a, { rough: 0.8 }), wall = K.std(0xd89a7a, { rough: 0.85 }), roofM = K.std(0x5a4034, { own: true, transparent: true, rough: 0.9 });
        root.add(K.mesh(K.box(CC.w, 4, CC.h + 14), wood, 0, 2, 0));
        for (const sd of [-1, 1]) {
          root.add(K.mesh(K.box(CC.w, 26, 4), wall, 0, 15, sd * (CC.h / 2 + 4)));
          for (let i = 0; i <= 6; i++) root.add(K.mesh(K.cyl(2.2, 2.2, 44, 8), K.std(0x6a3a22), -CC.w / 2 + i * CC.w / 6, 22, sd * (CC.h / 2 + 6)));
        }
        const sh = new T.Shape(); sh.moveTo(-CC.h / 2 - 16, 0); sh.lineTo(0, 26); sh.lineTo(CC.h / 2 + 16, 0); sh.closePath();
        const roof = new T.Mesh(K.G3('ccroof', () => { const ge = new T.ExtrudeGeometry(sh, { depth: CC.w + 26, bevelEnabled: false }); ge.rotateY(Math.PI / 2); ge.translate(-(CC.w + 26) / 2, 0, 0); return ge; }), roofM);
        roof.position.y = 44; roof.castShadow = true; root.add(roof);
        const mini = new T.Mesh(K.G3('ccmini', () => { const s2 = new T.Shape(); s2.moveTo(-26, 0); s2.lineTo(0, 18); s2.lineTo(26, 0); s2.closePath(); const ge = new T.ExtrudeGeometry(s2, { depth: 60, bevelEnabled: false }); ge.translate(0, 0, -30); return ge; }), roofM);
        mini.position.y = 64; root.add(mini);
        for (const sd of [-1, 1]) { const ln = K.mesh(K.sph(5, 10), K.glowMat(0xe8302a, 2.4), sd * (CC.w / 2 - 6), 34, CC.h / 2 + 10, false); ln.scale.y = 1.25; root.add(ln); const sp = K.glowSprite(0xff6040, 46, 0.55); sp.position.copy(ln.position); root.add(sp); }
        g.userData.canopy = [roofM]; return g;
      },
      hoiQuan: (o, K) => {
        const T = K.T, g = new T.Group(), wall = K.std(0xf2d8a0), red = K.std(0xb8261e), green = K.std(0x2f7a5e, { own: true, transparent: true, rough: 0.5 }), gold = K.std(0xe8c050, { metal: 0.5, rough: 0.3 });
        g.add(K.mesh(K.box(o.w, 50, o.h), wall, 0, 25, 0));
        for (const k of [0.12, 0.38, 0.62, 0.88]) g.add(K.mesh(K.cyl(4, 4, 60, 10), red, -o.w / 2 + o.w * k, 30, o.h / 2 + 4));
        for (const [k, ww] of [[0.25, 0.16], [0.5, 0.18], [0.75, 0.16]]) g.add(K.mesh(K.box(o.w * ww, 32, 2), K.std(0x2a1a10), -o.w / 2 + o.w * k, 16, o.h / 2 + 1));
        for (const [k, w, dy] of [[0.25, 0.3, 0], [0.75, 0.3, 0], [0.5, 0.42, 16]]) {
          const sh = new T.Shape(); sh.moveTo(-o.h / 2 - 12, 0); sh.lineTo(0, 22); sh.lineTo(o.h / 2 + 12, 0); sh.closePath();
          const L = o.w * w + 14, roof = new T.Mesh(K.G3('hq' + L, () => { const ge = new T.ExtrudeGeometry(sh, { depth: L, bevelEnabled: false }); ge.rotateY(Math.PI / 2); ge.translate(-L / 2, 0, 0); return ge; }), green);
          roof.position.set(-o.w / 2 + o.w * k, 50 + dy, 0); g.add(roof);
          for (const sd of [-1, 1]) { const c = K.mesh(K.G3('hqc', () => new T.ConeGeometry(2.5, 16, 6)), gold, -o.w / 2 + o.w * k + sd * L / 2, 56 + dy, o.h / 2 + 10); c.rotation.z = -sd * 0.9; g.add(c); }
        }
        g.add(K.mesh(K.box(80, 14, 3), K.std(0x8a1a14, { emissive: 0x401008 }), 0, 44, o.h / 2 + 3));
        g.userData.canopy = [green]; return g;
      },
      bougain: (o, K) => {
        const T = K.T, g = new T.Group(), mats = [];
        const mk = (c) => { const m = K.std(c, { own: true, transparent: true, flat: true }); mats.push(m); return m; };
        g.add(K.mesh(K.cyl(2.5, 3.5, 30, 6), K.std(0x4a3622), 0, 15, 0));
        const leaf = mk(0x2f6a34), pink = mk(0xe0368a);
        const c = K.mesh(K.G3('bgico', () => new T.IcosahedronGeometry(o.r * 0.85, 1)), leaf, 0, 36, 0); c.scale.y = 0.75; g.add(c);
        const r = U.seeded(o.x | 0);
        for (let i = 0; i < 22; i++) { const a = r() * Math.PI * 2, d = o.r * (0.5 + r() * 0.4); g.add(K.mesh(K.sph(3 + r() * 2.5, 6), pink, Math.cos(a) * d, 30 + r() * 18, Math.sin(a) * d)); }
        g.userData.canopy = mats; return g;
      },
      evilLantern: (o, K) => {
        const T = K.T, g = new T.Group(), mt = K.std(0x7a3ad0, { own: true, emissive: 0x9050ff, ei: 1.4 });
        g.add(K.mesh(K.cyl(2, 3, 56, 8), K.std(0x2a2030), 0, 28, 0));
        const ln = K.mesh(K.sph(o.r * 0.7, 14), mt, 0, 62, 0, false); ln.scale.y = 1.25; g.add(ln);
        ln.add(K.glowSprite(0xa060ff, 3.2, 0.7));
        for (const y of [-1, 1]) g.add(K.mesh(K.cyl(7, 7, 3, 10), K.std(0x1a0a24), 0, 62 + y * o.r * 0.85, 0));
        g.userData.flashMat = mt; g.userData.core = ln; return g;
      },
    },
    actors3d: Object.assign({
      serpSeg: (a, K) => {
        const T = K.T, g = new T.Group(), c = [0xe8302a, 0xf08a20, 0xf2c63a][a.i % 3];
        const body = K.mesh(K.sph(a.r * 0.85, 14), K.glowMat(c, 1.4), 0, 0, 0); body.scale.set(1, 1.15, 1); g.add(body);
        g.add(K.mesh(K.cyl(a.r * 0.5, a.r * 0.5, 3, 10), K.std(0x3a1a10), 0, a.r * 0.95, 0), K.mesh(K.cyl(a.r * 0.5, a.r * 0.5, 3, 10), K.std(0x3a1a10), 0, -a.r * 0.95, 0));
        const fin = K.mesh(K.G3('sfin', () => new T.ConeGeometry(4, 16, 4)), K.std(0x3a1a10), 0, a.r * 1.2, 0); g.add(fin);
        if (a.i % 2 === 0) g.add(K.glowSprite(c, a.r * 4, 0.5));
        return g;
      },
      boatLantern: (a, K) => {
        const T = K.T, g = new T.Group(), wood = K.std(0x3a2416, { rough: 0.8 });
        const hull = K.mesh(K.sph(1, 16), wood, 0, 4, 0); hull.scale.set(66, 12, 18); g.add(hull);
        g.add(K.mesh(K.box(100, 3, 22), K.std(0x6a3a22), 0, 12, 0));
        [0xe8302a, 0xf2c63a, 0xc83ca0].forEach((c, i) => { const ln = K.mesh(K.sph(5, 10), K.glowMat(c, 2.4), -30 + i * 30, 30, 0, false); ln.scale.y = 1.25; g.add(ln); const sp = K.glowSprite(c, 44, 0.6); sp.position.copy(ln.position); g.add(sp); g.add(K.mesh(K.cyl(0.6, 0.6, 18, 4), K.std(0x2a1a10), -30 + i * 30, 20, 0)); });
        g.userData.anim = (aa, m, G) => { m.position.x = aa.x + Math.sin(G.time * 0.3 + aa.ph) * 30; m.position.y = Math.sin(G.time * 1.2 + aa.ph) * 1.5; m.rotation.z = Math.sin(G.time * 1.1 + aa.ph) * 0.04; };
        return g;
      },
      lanternNet: (a, K) => {
        const T = K.T, g = new T.Group(), wire = K.std(0x1a120c);
        // 5 đèn điểm luôn "bám" các đèn lồng gần Hunter nhất → tường nhà được hắt sáng ấm (số đèn cố định, không tốn biên dịch lại)
        const pls = [0xffa050, 0xff7040, 0xffc070, 0xff9060, 0xffb060].map((c) => { const L = new T.PointLight(c, 0, 300, 1.5); L.castShadow = false; g.add(L); return L; });
        g.userData.anim = (aa, m, G) => {
          const p = G.player;
          const near = lights.map((L) => [L, (L.x - p.x) ** 2 + (L.y - p.y) ** 2]).sort((u, v) => u[1] - v[1]).slice(0, pls.length);
          near.forEach(([L], i) => { pls[i].position.set(L.x, 46, L.y); pls[i].intensity = 1.5e4 * (0.9 + Math.sin(G.time * 7 + i) * 0.08); });
        };
        for (const s of strings) {
          const pt = (k) => [s.x1 + (s.x2 - s.x1) * k, 92 - Math.sin(k * Math.PI) * 22, s.y1 + (s.y2 - s.y1) * k];
          for (let i = 0; i < 12; i++) {
            const [x0, y0, z0] = pt(i / 12), [x1, y1, z1] = pt((i + 1) / 12), L = Math.hypot(x1 - x0, y1 - y0, z1 - z0);
            const w = K.mesh(K.box(L, 0.8, 0.8), wire, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, false);
            w.lookAt(x1, y1, z1); w.rotateY(Math.PI / 2); g.add(w);
          }
          for (let i = 0; i < s.n; i++) {
            const [x, y, z] = pt((i + 0.5) / s.n), col = new T.Color(s.cols[i].replace(',1)', ')').replace('rgba', 'rgb')).getHex();
            const ln = K.mesh(K.sph(4.5, 8), K.glowMat(col, 2.4), x, y - 8, z, false); ln.scale.y = 1.25; g.add(ln);
            if (i % 2 === 0) { const sp = K.glowSprite(col, 40, 0.45); sp.position.set(x, y - 8, z); g.add(sp); }
          }
        }
        return g;
      },
      hoaDang: (a, K) => {
        const T = K.T, g = new T.Group(), list = [];
        for (let i = 0; i < 26; i++) {
          const f = new T.Group(); f.add(K.mesh(K.cyl(6, 4, 3, 8), K.std([0xf070a0, 0xf2c63a, 0xff8a5a][i % 3]), 0, 1.5, 0, false), K.mesh(K.sph(1.8, 6), K.glowMat(0xfff6c8, 3), 0, 4, 0, false));
          const sp = K.glowSprite(0xffb050, 30, 0.6); sp.position.y = 5; f.add(sp);
          g.add(f); list.push({ f, i });
        }
        g.userData.anim = (aa, m, G) => { const t = G.time; m.position.set(0, 0, 0); for (const q of list) { const x = ((q.i * 271 + t * (12 + (q.i % 5) * 3)) % (WW + 200)) - 100, z = RIVER + 60 + (q.i * 97 % 420) + Math.sin(t + q.i) * 6; q.f.position.set(x, 3, z); } };
        return g;
      },
    }, MB.Story.actors3d),
  });
})(window.MB);
