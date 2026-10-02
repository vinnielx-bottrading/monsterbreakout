/* Gate 11 — HÀ NỘI: Hồ Gươm lúc hoàng hôn (Màn 2 · Nguồn Gốc)
   Thắng cảnh: Hồ Gươm (nước xanh lục), Tháp Rùa giữa hồ, cầu Thê Húc đỏ dẫn vào Đền Ngọc Sơn, Tháp Bút,
   Tháp Hoà Phong (gạch đỏ), liễu rủ ven hồ, cây lộc vừng, phố cổ nhà ống mái ngói / bồn nước inox, xe máy đỗ kín vỉa hè.
   Cơ chế: hồ nước sâu (đạn bay qua, người không lội được) — vào Đền Ngọc Sơn chỉ qua cầu Thê Húc; hàng xe máy bắn nổ được.
   Quái mới: Drone GoatEvil (bay, bắn tia), Xe Ôm Zombie (lấy đà rồi lao thẳng).
   Boss: SÁT THỦ BÓNG ĐÊM — kẻ đã "giết" Giáo sư Ted: tàng hình, chém lướt, ném phi tiêu, phân thân, bom khói.
   Đồ hoạ 2D có chiều sâu: mặt tiền nhìn nghiêng 3/4, mái nhà/tán cây vẽ đè lên nhân vật đi phía sau (mờ đi khi bị che). */
'use strict';
(function (MB) {
  const U = MB.U, Ens = MB.Enemies, GK = MB.GK;
  const WW = 3400, WH = 2900;
  const LK = { x: 1700, y: 1560, rx: 440, ry: 820 };           // Hồ Gươm (dài theo hướng Bắc–Nam)
  const ISL = { x: 1700, y: 1010, r: 112 };                      // đảo Ngọc Sơn
  const TR = { x: 1650, y: 1790, r: 64 };                        // đảo Tháp Rùa
  const BR = [[1800, 1040], [1930, 1000], [2090, 960]];          // cầu Thê Húc (đảo → bờ đông), đường cong bậc 2
  const H3 = 0.45;                                               // tỉ lệ chiều cao → độ lệch mặt tiền (2D)

  /* =====================================================================
     BỘ CÔNG CỤ VIỆT NAM (dùng chung cho các Gate Màn 2)
     ===================================================================== */
  const VN = MB.VN = {
    // toạ độ thế giới → màn hình (2D hoặc 3D)
    toScreen(G, x, y, h) {
      if (G.r3on && MB.R3 && MB.R3.camReady) return MB.R3.project(x, h || 0, y, G);
      return { x: (x - G.cam.x) * G.zoom + (G.sx || 0), y: (y - G.cam.y) * G.zoom + (G.sy || 0), vis: true };
    },
    // bóng tối có lỗ sáng (đèn lồng, đèn đường, nhân vật). lights: [{x,y,r,h,c?}]
    darkness(G, ctx, lights, amb) {
      const W = G.W, H = G.H, S = 0.5;
      const cv = this._dk || (this._dk = document.createElement('canvas'));
      if (cv.width !== Math.ceil(W * S) || cv.height !== Math.ceil(H * S)) { cv.width = Math.ceil(W * S); cv.height = Math.ceil(H * S); }
      const g = cv.getContext('2d');
      g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, cv.width, cv.height);
      g.fillStyle = `rgba(4,6,18,${amb})`; g.fillRect(0, 0, cv.width, cv.height);
      g.globalCompositeOperation = 'destination-out';
      for (const L of lights) {
        const s = this.toScreen(G, L.x, L.y, L.h || 0); if (!s.vis) continue;
        const e = this.toScreen(G, L.x + L.r, L.y, L.h || 0), R = Math.max(8, Math.abs(e.x - s.x)) * S;
        const x = s.x * S, y = s.y * S;
        if (!Number.isFinite(x + y + R)) continue;
        if (x < -R || y < -R || x > cv.width + R || y > cv.height + R) continue;
        const gr = g.createRadialGradient(x, y, R * 0.1, x, y, R);
        gr.addColorStop(0, `rgba(0,0,0,${L.k || 1})`); gr.addColorStop(0.55, `rgba(0,0,0,${(L.k || 1) * 0.6})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = gr; g.beginPath(); g.arc(x, y, R, 0, U.TAU); g.fill();
      }
      ctx.drawImage(cv, 0, 0, W, H);
      // quầng màu ấm quanh đèn
      ctx.globalCompositeOperation = 'lighter';
      for (const L of lights) {
        if (!L.c) continue;
        const s = this.toScreen(G, L.x, L.y, L.h || 0); if (!s.vis) continue;
        const e = this.toScreen(G, L.x + L.r * 0.5, L.y, L.h || 0), R = Math.max(6, Math.abs(e.x - s.x));
        if (!Number.isFinite(s.x + s.y + R)) continue;
        if (s.x < -R || s.y < -R || s.x > W + R || s.y > H + R) continue;
        const gr = ctx.createRadialGradient(s.x, s.y, 1, s.x, s.y, R);
        gr.addColorStop(0, L.c); gr.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(s.x, s.y, R, 0, U.TAU); ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
    },
    // bóng đổ xiên về Đông-Nam của khối cao H
    shadowBox(ctx, x, y, w, h, H, a) {
      const dx = H * 0.55, dy = H * 0.3;
      ctx.fillStyle = `rgba(10,8,20,${a || 0.28})`;
      ctx.beginPath(); ctx.moveTo(x + w, y); ctx.lineTo(x + w + dx, y + dy); ctx.lineTo(x + w + dx, y + h + dy); ctx.lineTo(x + dx, y + h + dy); ctx.lineTo(x, y + h); ctx.lineTo(x + w, y + h); ctx.closePath(); ctx.fill();
    },
    // mái ngói: các hàng ngói song song + bờ nóc
    tileRoof(ctx, x, y, w, h, base, dark, vertical) {
      ctx.fillStyle = base; ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = dark; ctx.lineWidth = 1.2;
      if (!vertical) {
        for (let yy = y + 5; yy < y + h; yy += 6) { ctx.beginPath(); ctx.moveTo(x + 1, yy); ctx.lineTo(x + w - 1, yy); ctx.stroke(); }
        for (let xx = x + 4; xx < x + w; xx += 8) for (let yy = y; yy < y + h; yy += 12) { ctx.beginPath(); ctx.moveTo(xx + ((yy / 6) % 2) * 4, yy); ctx.lineTo(xx + ((yy / 6) % 2) * 4, yy + 6); ctx.stroke(); }
        ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(x, y, w, h * 0.45);
        ctx.fillStyle = dark; ctx.fillRect(x, y + h / 2 - 2, w, 4);
      } else {
        for (let xx = x + 5; xx < x + w; xx += 6) { ctx.beginPath(); ctx.moveTo(xx, y + 1); ctx.lineTo(xx, y + h - 1); ctx.stroke(); }
        ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(x, y, w * 0.45, h);
        ctx.fillStyle = dark; ctx.fillRect(x + w / 2 - 2, y, 4, h);
      }
      ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 2; ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
    },
    // mái ngói âm dương (Hội An): bờ nóc nằm ngang, các rãnh ngói chạy dọc từ nóc xuống hiên, loang rêu
    yinYangRoof(ctx, x, y, w, h, base, seed) {
      const r = U.seeded(seed || 1);
      ctx.fillStyle = base; ctx.fillRect(x, y, w, h);
      const ry = y + h * 0.42;
      const sh = ctx.createLinearGradient(0, y, 0, y + h); sh.addColorStop(0, 'rgba(255,230,200,.16)'); sh.addColorStop(0.42, 'rgba(255,230,200,.05)'); sh.addColorStop(0.43, 'rgba(0,0,0,.12)'); sh.addColorStop(1, 'rgba(0,0,0,.3)');
      ctx.fillStyle = sh; ctx.fillRect(x, y, w, h);
      for (let xx = x + 3; xx < x + w - 2; xx += 7) {
        ctx.fillStyle = 'rgba(0,0,0,.32)'; ctx.fillRect(xx, y + 2, 2.2, h - 4);            // rãnh ngói ngửa
        ctx.fillStyle = 'rgba(255,220,190,.13)'; ctx.fillRect(xx + 3, y + 2, 2.4, h - 4);   // hàng ngói úp
        for (let yy = y + 6 + (xx % 3) * 3; yy < y + h - 4; yy += 11) { ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(xx + 2.5, yy, 3.5, 1.2); }
      }
      for (let i = 0; i < 4; i++) { ctx.fillStyle = `rgba(${70 + r() * 30},${90 + r() * 30},50,.38)`; U.ellipse(ctx, x + r() * w, y + r() * h, 6 + r() * 12, 4 + r() * 7); ctx.fill(); }
      ctx.fillStyle = 'rgba(30,18,12,.85)'; ctx.fillRect(x - 2, ry - 3, w + 4, 7);           // bờ nóc
      ctx.fillStyle = 'rgba(230,220,200,.5)'; ctx.fillRect(x - 2, ry - 3, w + 4, 1.5);
      ctx.fillStyle = 'rgba(30,18,12,.85)'; ctx.fillRect(x - 4, ry - 6, 4, 9); ctx.fillRect(x + w, ry - 6, 4, 9); // đầu nóc vểnh
      ctx.fillStyle = 'rgba(20,12,8,.7)'; ctx.fillRect(x, y + h - 3, w, 3);                  // mép hiên
      ctx.strokeStyle = 'rgba(0,0,0,.45)'; ctx.lineWidth = 1.5; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    },
    // xe máy nhìn từ trên
    moto(ctx, x, y, rot, col, s) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s || 1, s || 1);
      ctx.fillStyle = 'rgba(0,0,0,.3)'; U.rr(ctx, -15, -4, 34, 12, 5); ctx.fill();
      ctx.fillStyle = '#1a1a1e'; U.rr(ctx, -18, -3.5, 8, 7, 3); ctx.fill(); U.rr(ctx, 10, -3.5, 8, 7, 3); ctx.fill();
      ctx.fillStyle = col; U.rr(ctx, -12, -5.5, 24, 11, 5); ctx.fill();
      ctx.fillStyle = '#2a2420'; U.rr(ctx, -8, -3.5, 11, 7, 3); ctx.fill();
      ctx.fillStyle = '#c8ccd2'; ctx.fillRect(10, -7, 2, 14);
      ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(-10, -4.5, 18, 2);
      ctx.restore();
    },
    lantern(ctx, x, y, r, col, t, glow) {
      if (glow) { const gr = ctx.createRadialGradient(x, y, 1, x, y, r * 3.2); gr.addColorStop(0, col.replace('1)', '.55)')); gr.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = gr; U.circle(ctx, x, y, r * 3.2); ctx.fill(); }
      ctx.fillStyle = col; U.ellipse(ctx, x, y, r, r * 1.15); ctx.fill();
      ctx.strokeStyle = 'rgba(80,30,10,.55)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y - r * 1.15); ctx.lineTo(x, y + r * 1.15); ctx.moveTo(x - r * 0.6, y - r * 0.8); ctx.quadraticCurveTo(x - r * 0.9, y, x - r * 0.6, y + r * 0.8); ctx.moveTo(x + r * 0.6, y - r * 0.8); ctx.quadraticCurveTo(x + r * 0.9, y, x + r * 0.6, y + r * 0.8); ctx.stroke();
      ctx.fillStyle = '#3a2210'; ctx.fillRect(x - r * 0.45, y - r * 1.3, r * 0.9, r * 0.25); ctx.fillRect(x - r * 0.45, y + r * 1.08, r * 0.9, r * 0.25);
      ctx.fillStyle = 'rgba(255,240,200,.5)'; U.ellipse(ctx, x - r * 0.3, y - r * 0.2, r * 0.25, r * 0.5); ctx.fill();
    },
    // mái/tán vẽ đè (lớp trên): mờ đi khi nhân vật đứng phía sau
    coverAlpha(G, x0, y0, x1, y1) {
      const p = G.player;
      return p.x > x0 - 10 && p.x < x1 + 10 && p.y > y0 - 10 && p.y < y1 + 26 ? 0.42 : 1;
    },
    ellipseX(e, y, off) { const ry = e.ry + off, k = 1 - ((y - e.y) / ry) ** 2; return k <= 0 ? 0 : (e.rx + off) * Math.sqrt(k); },
    inEllipse(e, x, y, off) { const rx = e.rx + (off || 0), ry = e.ry + (off || 0); return ((x - e.x) / rx) ** 2 + ((y - e.y) / ry) ** 2 < 1; },
    // lớp vẽ đè theo loại vật cản (mái, tán cây, đỉnh tháp…)
    over: {},
    drawOver(G, ctx) {
      const t = G.time;
      if (!G.__over) G.__over = G.obstacles.filter((o) => this.over[o.kind]).sort((a, b) => a.y - b.y);
      for (const o of G.__over) {
        if (o.dead || !G.inView(o.x, o.y - (o.tall || 60), (o.br || 60) + (o.tall || 60))) continue;
        this.over[o.kind](ctx, o, G, t);
      }
    },
    // vân ngói 3D (dùng chung): rãnh ngói sẫm xen hàng ngói sáng + rêu loang
    roofTex(K) {
      if (this._rt) return this._rt;
      const T = K.T, cv = document.createElement('canvas'); cv.width = cv.height = 128; const c = cv.getContext('2d');
      c.fillStyle = '#d8d0c8'; c.fillRect(0, 0, 128, 128);
      for (let x = 0; x < 128; x += 8) { c.fillStyle = '#6a5a52'; c.fillRect(x, 0, 3, 128); c.fillStyle = '#f2ece6'; c.fillRect(x + 4, 0, 3, 128); }
      for (let y = 0; y < 128; y += 12) { c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(0, y, 128, 1.5); }
      for (let i = 0; i < 10; i++) { c.fillStyle = 'rgba(90,120,70,.35)'; c.beginPath(); c.ellipse(Math.random() * 128, Math.random() * 128, 6 + Math.random() * 12, 4 + Math.random() * 6, 0, 0, 6.3); c.fill(); }
      const t = this._rt = new T.CanvasTexture(cv); t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(1 / 24, 1 / 24); t.colorSpace = T.SRGBColorSpace;
      return t;
    },
    // xe máy 3D
    moto3D(K, col) {
      const T = K.T, g = new T.Group(), body = K.std(col, { rough: 0.35, metal: 0.3 }), blk = K.std(0x18181c, { rough: 0.6 });
      for (const x of [-12, 12]) { const w = K.mesh(K.cyl(6, 6, 3, 12), blk, x, 6, 0); w.rotation.x = Math.PI / 2; g.add(w); }
      g.add(K.mesh(K.box(22, 7, 9), body, 0, 12, 0), K.mesh(K.box(11, 3, 8), K.std(0x2a2420), -4, 17, 0), K.mesh(K.box(3, 14, 3), K.std(0xc8ccd2, { metal: 0.6, rough: 0.3 }), 11, 18, 0), K.mesh(K.box(2, 2, 16), blk, 11, 25, 0));
      return g;
    },
  };

  /* =====================================================================
     VẬT CẢN (2D)
     ===================================================================== */
  const SIGNS = ['PHỞ BÒ', 'BÚN CHẢ', 'CÀ PHÊ', 'BÁNH MÌ', 'TRÀ ĐÁ', 'TẠP HOÁ', 'HÀNG MÃ', 'BÚN ĐẬU', 'NEM CHUA', 'ẢNH VIỆN', 'BÁNH CUỐN', 'ĐỒNG HỒ'];
  // dãy nhà ống: phần mặt tiền (lớp dưới); mái vẽ ở drawOver
  MB.Props.register('row', (ctx, o, t) => {
    const x = o.x - o.hw, y = o.y - o.hh;
    VN.shadowBox(ctx, x, y - o.hgt * H3, o.w, o.h, o.hgt, 0.3);
    for (const u of o.units) {
      const ux = x + u.u0, H = u.hgt * H3, fy = y + o.h - H;
      ctx.fillStyle = u.c; ctx.fillRect(ux, fy, u.uw, H);
      ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(ux + u.uw - 3, fy, 3, H);
      if (o.style === 'hoian') {
        // nhà cổ Hội An: tường vàng loang, tầng trệt cửa gỗ, ban công gỗ, đèn lồng dưới hiên
        ctx.fillStyle = 'rgba(120,90,30,.18)'; ctx.fillRect(ux + u.uw * 0.1, fy + H * 0.3, u.uw * 0.5, H * 0.35);
        const gh = Math.min(28, H * 0.48), gy = y + o.h - gh;
        ctx.fillStyle = '#5a3a22'; ctx.fillRect(ux + 3, gy, u.uw - 6, gh);
        ctx.strokeStyle = 'rgba(30,18,8,.6)'; ctx.lineWidth = 1; for (let i = ux + 8; i < ux + u.uw - 4; i += 7) { ctx.beginPath(); ctx.moveTo(i, gy + 2); ctx.lineTo(i, gy + gh); ctx.stroke(); }
        ctx.fillStyle = 'rgba(255,190,90,.35)'; ctx.fillRect(ux + u.uw * 0.35, gy + 4, u.uw * 0.3, gh - 4);
        ctx.fillStyle = '#4a3020'; ctx.fillRect(ux, gy - 5, u.uw, 5);
        if (H > gh + 14) { ctx.fillStyle = '#6a4a2a'; ctx.fillRect(ux + 6, fy + 4, u.uw - 12, Math.min(14, H - gh - 10)); ctx.fillStyle = 'rgba(0,0,0,.3)'; for (let i = ux + 8; i < ux + u.uw - 6; i += 5) ctx.fillRect(i, fy + 4, 1.5, Math.min(14, H - gh - 10)); }
        for (let i = 0; i < u.lan.length; i++) VN.lantern(ctx, ux + (i + 0.5) * u.uw / u.lan.length, gy + 4, 5, u.lan[i], t, true);
      } else if (o.front) {
        // tầng trệt: cửa hàng + mái hiên sọc
        const gh = Math.min(26, H * 0.42), gy = y + o.h - gh;
        ctx.fillStyle = '#2a2018'; ctx.fillRect(ux + 4, gy, u.uw - 8, gh);
        ctx.fillStyle = u.goods; for (let i = 0; i < 4; i++) ctx.fillRect(ux + 7 + i * (u.uw - 14) / 4, gy + gh * 0.45, (u.uw - 18) / 4, gh * 0.4);
        ctx.fillStyle = u.awn; ctx.fillRect(ux + 2, gy - 6, u.uw - 4, 7);
        ctx.fillStyle = 'rgba(255,255,255,.55)'; for (let i = ux + 4; i < ux + u.uw - 4; i += 8) ctx.fillRect(i, gy - 6, 4, 7);
        // biển hiệu
        if (u.sign) {
          const sy = gy - 18; ctx.fillStyle = u.signC; ctx.fillRect(ux + 5, sy, u.uw - 10, 11);
          ctx.fillStyle = '#fff6d8'; ctx.font = '800 8px system-ui,sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(u.sign, ux + u.uw / 2, sy + 6, u.uw - 12);
        }
        // tầng trên: cửa chớp xanh + ban công
        for (let fl = 1; fl < u.fl; fl++) {
          const wy = fy + 4 + (fl - 1) * 18; if (wy + 12 > gy - 20) break;
          for (let k = 0; k < 2; k++) { const wx = ux + 7 + k * (u.uw - 14) / 2; ctx.fillStyle = '#35604a'; ctx.fillRect(wx, wy, (u.uw - 22) / 2, 11); ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(wx + (u.uw - 22) / 4 - 0.5, wy, 1, 11); }
          ctx.fillStyle = 'rgba(30,30,30,.6)'; ctx.fillRect(ux + 4, wy + 12, u.uw - 8, 2);
          if (u.plant) { ctx.fillStyle = '#4f8a3a'; U.circle(ctx, ux + u.uw - 9, wy + 9, 4); ctx.fill(); }
        }
      } else {
        // mặt sau: tường + cục nóng điều hoà
        ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.fillRect(ux, fy, u.uw, H);
        ctx.fillStyle = '#d8d8d2'; ctx.fillRect(ux + u.uw * 0.3, fy + H * 0.35, 14, 9);
        ctx.fillStyle = '#88888a'; U.circle(ctx, ux + u.uw * 0.3 + 7, fy + H * 0.35 + 4.5, 3); ctx.fill();
      }
    }
    // dây điện chằng chịt (đặc trưng phố Hà Nội)
    if (o.front && o.style !== 'hoian') {
      ctx.strokeStyle = 'rgba(15,15,18,.75)'; ctx.lineWidth = 1;
      for (let k = 0; k < 4; k++) { const yy = y + o.h - o.hgt * H3 * (0.55 + k * 0.06); ctx.beginPath(); ctx.moveTo(x, yy); for (let xx = x; xx <= x + o.w; xx += 60) ctx.quadraticCurveTo(xx + 30, yy + 8 + k * 2, xx + 60, yy); ctx.stroke(); }
    }
  });
  function drawRowRoof(ctx, o, G) {
    const x = o.x - o.hw, y = o.y - o.hh;
    const a = VN.coverAlpha(G, x, y - o.hgt * H3, x + o.w, y + o.h - o.hgt * H3 * 0.9);
    ctx.globalAlpha = a;
    for (const u of o.units) {
      const ux = x + u.u0, ry = y - u.hgt * H3;
      if (u.roof === 'tile') {
        if (o.style === 'hoian') VN.yinYangRoof(ctx, ux + 1, ry, u.uw - 2, o.h, u.tile, (u.u0 + o.x) | 0);
        else VN.tileRoof(ctx, ux, ry, u.uw, o.h, u.tile, 'rgba(40,20,12,.6)', true);
      }
      else {
        ctx.fillStyle = u.flat; ctx.fillRect(ux, ry, u.uw, o.h);
        ctx.strokeStyle = 'rgba(0,0,0,.3)'; ctx.lineWidth = 2; ctx.strokeRect(ux + 1, ry + 1, u.uw - 2, o.h - 2);
        ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.fillRect(ux + 3, ry + 3, u.uw - 6, 6);
        // bồn nước inox nằm ngang
        const tx = ux + u.uw * 0.3, ty = ry + o.h * u.tankY;
        ctx.fillStyle = 'rgba(0,0,0,.3)'; U.rr(ctx, tx + 3, ty + 4, 30, 15, 7); ctx.fill();
        const tg = ctx.createLinearGradient(0, ty, 0, ty + 14); tg.addColorStop(0, '#f2f4f7'); tg.addColorStop(0.5, '#a8b0ba'); tg.addColorStop(1, '#e0e4ea');
        ctx.fillStyle = tg; U.rr(ctx, tx, ty, 30, 14, 7); ctx.fill();
        if (u.solar) { ctx.fillStyle = '#1e2c4a'; ctx.fillRect(ux + 6, ry + o.h * 0.62, u.uw - 12, 16); ctx.strokeStyle = 'rgba(160,190,255,.35)'; ctx.lineWidth = 1; for (let i = ux + 10; i < ux + u.uw - 6; i += 6) { ctx.beginPath(); ctx.moveTo(i, ry + o.h * 0.62); ctx.lineTo(i, ry + o.h * 0.62 + 16); ctx.stroke(); } }
        if (u.pots) { ctx.fillStyle = '#4f8a3a'; for (let i = 0; i < 3; i++) { U.circle(ctx, ux + 8 + i * 9, ry + o.h - 10, 4); ctx.fill(); } }
        if (u.cloth) { ctx.strokeStyle = 'rgba(40,40,40,.6)'; ctx.beginPath(); ctx.moveTo(ux + 5, ry + o.h * 0.4); ctx.lineTo(ux + u.uw - 5, ry + o.h * 0.4); ctx.stroke(); ['#e05a5a', '#5a8ae0', '#f2f2f2'].forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(ux + 9 + i * 10, ry + o.h * 0.4, 6, 9); }); }
      }
    }
    ctx.globalAlpha = 1;
  }

  // Tháp Rùa: tháp 3 tầng cửa vòm, rêu phong
  function drawTurtleTower(ctx, o, t, top) {
    const { x, y } = o, s = 1;
    const tiers = [[48, 30], [38, 24], [28, 18]];
    let hy = y;
    if (!top) { VN.shadowBox(ctx, x - 24, y - 70, 48, 48, 90, 0.25); }
    for (let i = 0; i < 3; i++) {
      const [w, h] = tiers[i]; const fx = x - w / 2, fy = hy - h;
      if (top || i === 0) {
        ctx.fillStyle = '#b9b09a'; ctx.fillRect(fx, fy, w, h);
        ctx.fillStyle = 'rgba(60,80,50,.35)'; ctx.fillRect(fx, fy + h * 0.6, w, h * 0.4);
        ctx.fillStyle = '#2a2a26'; const n = i === 0 ? 3 : i === 1 ? 2 : 1;
        for (let k = 0; k < n; k++) { const ax = fx + (k + 0.5) * w / n; ctx.beginPath(); ctx.moveTo(ax - 5, fy + h - 2); ctx.lineTo(ax - 5, fy + h * 0.45); ctx.arc(ax, fy + h * 0.45, 5, Math.PI, 0); ctx.lineTo(ax + 5, fy + h - 2); ctx.closePath(); ctx.fill(); }
        ctx.fillStyle = '#d6cdb5'; ctx.fillRect(fx - 3, fy - 3, w + 6, 4);
      }
      hy = fy - 3;
    }
    if (top) {
      // mái chóp nhỏ trên đỉnh
      ctx.fillStyle = '#8a6a50'; ctx.beginPath(); ctx.moveTo(x - 12, hy); ctx.lineTo(x, hy - 14); ctx.lineTo(x + 12, hy); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#d6cdb5'; ctx.fillRect(x - 1.5, hy - 20, 3, 7);
    }
  }
  MB.Props.register('turtleTower', (ctx, o, t) => drawTurtleTower(ctx, o, t, false));

  // Tháp Hoà Phong: gạch đỏ 3 tầng, cửa vòm 4 phía
  function drawHoaPhong(ctx, o, top) {
    const { x, y } = o;
    if (!top) { VN.shadowBox(ctx, x - 30, y - 110, 60, 60, 140, 0.3); return; }
    let hy = y + 30;
    const tiers = [[60, 52], [48, 40], [36, 32]];
    for (let i = 0; i < 3; i++) {
      const [w, h] = tiers[i], fx = x - w / 2, fy = hy - h;
      ctx.fillStyle = '#9a4a32'; ctx.fillRect(fx, fy, w, h);
      ctx.strokeStyle = 'rgba(60,20,10,.4)'; ctx.lineWidth = 1; for (let yy = fy + 4; yy < fy + h; yy += 5) { ctx.beginPath(); ctx.moveTo(fx, yy); ctx.lineTo(fx + w, yy); ctx.stroke(); }
      ctx.fillStyle = '#1e140f'; const aw = w * 0.32; ctx.beginPath(); ctx.moveTo(x - aw / 2, fy + h - 2); ctx.lineTo(x - aw / 2, fy + h * 0.45); ctx.arc(x, fy + h * 0.45, aw / 2, Math.PI, 0); ctx.lineTo(x + aw / 2, fy + h - 2); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#6a3a28'; ctx.fillRect(fx - 4, fy - 4, w + 8, 5);
      hy = fy - 4;
    }
    ctx.fillStyle = '#b8a070'; ctx.beginPath(); ctx.moveTo(x - 10, hy); ctx.quadraticCurveTo(x, hy - 22, x + 10, hy); ctx.fill();
  }
  MB.Props.register('hoaPhong', (ctx, o) => drawHoaPhong(ctx, o, false));

  // Tháp Bút trên gò đá (Đài Nghiên bên cạnh)
  function drawPen(ctx, o, top) {
    const { x, y } = o;
    if (!top) {
      MB.Props.shadow(ctx, x + 12, y + 8, o.r * 1.1, o.r * 0.6, 0.3);
      ctx.fillStyle = '#6e6a5e'; U.ellipse(ctx, x, y, o.r, o.r * 0.75); ctx.fill();
      ctx.fillStyle = '#8a8676'; U.ellipse(ctx, x - 8, y - 8, o.r * 0.6, o.r * 0.42); ctx.fill();
      ctx.fillStyle = '#3f6a3a'; for (let i = 0; i < 5; i++) { U.circle(ctx, x - o.r * 0.7 + i * o.r * 0.35, y + o.r * 0.45, 7); ctx.fill(); }
      return;
    }
    const by = y - 6;
    ctx.fillStyle = '#cfc6ae'; ctx.beginPath(); ctx.moveTo(x - 11, by); ctx.lineTo(x - 5, by - 92); ctx.lineTo(x + 5, by - 92); ctx.lineTo(x + 11, by); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.beginPath(); ctx.moveTo(x + 2, by); ctx.lineTo(x + 2, by - 92); ctx.lineTo(x + 5, by - 92); ctx.lineTo(x + 11, by); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#2a2018'; ctx.beginPath(); ctx.moveTo(x - 5, by - 92); ctx.quadraticCurveTo(x, by - 118, x + 5, by - 92); ctx.fill(); // ngòi bút
    ctx.fillStyle = '#7a2a20'; ctx.font = '700 7px Georgia,serif'; ctx.textAlign = 'center'; ctx.fillText('寫青天', x, by - 50);
  }
  MB.Props.register('penTower', (ctx, o) => drawPen(ctx, o, false));

  // Đền Ngọc Sơn: tường vàng, cột đỏ, mái ngói cong vút
  MB.Props.register('temple', (ctx, o) => {
    const x = o.x - o.hw, y = o.y - o.hh, H = 46 * H3 * 1.6;
    VN.shadowBox(ctx, x, y - H, o.w, o.h, 70, 0.28);
    ctx.fillStyle = '#d8b04a'; ctx.fillRect(x, y + o.h - H, o.w, H);
    ctx.fillStyle = '#a3241c'; for (let i = 0; i <= 6; i++) ctx.fillRect(x + 4 + i * (o.w - 12) / 6, y + o.h - H + 4, 4, H - 4);
    ctx.fillStyle = '#5a1a12'; ctx.fillRect(x + o.w / 2 - 12, y + o.h - H * 0.75, 24, H * 0.75);
    ctx.fillStyle = '#f2d27a'; ctx.font = '800 8px Georgia,serif'; ctx.textAlign = 'center'; ctx.fillText('玉山祠', x + o.w / 2, y + o.h - H + 9);
  });
  function drawTempleRoof(ctx, o, G) {
    const x = o.x - o.hw, y = o.y - o.hh, H = 46 * H3 * 1.6;
    ctx.globalAlpha = VN.coverAlpha(G, x, y - H, x + o.w, y + o.h - H);
    VN.tileRoof(ctx, x - 8, y - H - 4, o.w + 16, o.h + 6, '#4a3a30', 'rgba(20,12,8,.6)', false);
    // đầu đao cong vút ở 4 góc
    ctx.fillStyle = '#4a3a30';
    for (const [cx, cy, sx] of [[x - 8, y - H - 4, -1], [x + o.w + 8, y - H - 4, 1], [x - 8, y - H + o.h + 2, -1], [x + o.w + 8, y - H + o.h + 2, 1]]) { ctx.beginPath(); ctx.moveTo(cx, cy); ctx.quadraticCurveTo(cx + sx * 14, cy - 2, cx + sx * 16, cy - 14); ctx.lineTo(cx - sx * 6, cy + 4); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = '#c9a046'; U.circle(ctx, x + o.w / 2, y - H + o.h / 2 - 2, 6); ctx.fill(); // lưỡng long chầu nguyệt
    ctx.globalAlpha = 1;
  }

  // cây: liễu rủ (ven hồ), lộc vừng (hoa đỏ rủ), đa cổ thụ
  MB.Props.register('vtree', (ctx, o) => {
    MB.Props.shadow(ctx, o.x + o.r * 0.6, o.y + o.r * 0.25, o.r * 1.2, o.r * 0.55, 0.28);
    ctx.fillStyle = '#4a3622'; U.circle(ctx, o.x, o.y, o.r * 0.22); ctx.fill();
    ctx.strokeStyle = '#4a3622'; ctx.lineWidth = o.r * 0.16; ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(o.x + o.lean * 0.5, o.y - o.r * 0.9); ctx.stroke();
  });
  function drawCanopy(ctx, o, G, t) {
    const cx = o.x + o.lean, cy = o.y - o.r * 1.15, r = o.r;
    ctx.globalAlpha = VN.coverAlpha(G, cx - r * 1.2, cy - r, cx + r * 1.2, cy + r * 0.9);
    if (o.sp === 'willow') {
      ctx.fillStyle = '#6f9a3c'; U.circle(ctx, cx, cy, r * 0.75); ctx.fill();
      for (let i = 0; i < 26; i++) {
        const a = i / 26 * U.TAU, sw = Math.sin(t * 1.4 + i + o.x) * 3;
        ctx.strokeStyle = i % 3 ? '#8fbf4a' : '#a9d45e'; ctx.lineWidth = 3;
        const sx = cx + Math.cos(a) * r * 0.55, sy = cy + Math.sin(a) * r * 0.4;
        ctx.beginPath(); ctx.moveTo(sx, sy); ctx.quadraticCurveTo(sx + Math.cos(a) * r * 0.4 + sw, sy + r * 0.4, sx + Math.cos(a) * r * 0.55 + sw, sy + r * 0.95); ctx.stroke();
      }
    } else if (o.sp === 'locvung') {
      ctx.fillStyle = '#2f6a34'; U.circle(ctx, cx, cy, r); ctx.fill();
      ctx.fillStyle = '#3f8240'; U.circle(ctx, cx - r * 0.3, cy - r * 0.25, r * 0.6); ctx.fill();
      ctx.strokeStyle = '#d8283a'; ctx.lineWidth = 1.6;
      for (let i = 0; i < 18; i++) { const a = i * 2.4, rr = r * (0.3 + (i % 5) * 0.14), px = cx + Math.cos(a) * rr, py = cy + Math.sin(a) * rr; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + 1, py + 9); ctx.stroke(); }
    } else { // đa cổ thụ
      ctx.fillStyle = '#29522c'; U.circle(ctx, cx, cy, r); ctx.fill();
      ctx.fillStyle = '#356a36'; for (let i = 0; i < 6; i++) { const a = i / 6 * U.TAU; U.circle(ctx, cx + Math.cos(a) * r * 0.5, cy + Math.sin(a) * r * 0.45, r * 0.45); ctx.fill(); }
      ctx.fillStyle = 'rgba(255,255,255,.07)'; U.circle(ctx, cx - r * 0.35, cy - r * 0.35, r * 0.4); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  MB.Props.register('lamp', (ctx, o, t) => {
    ctx.fillStyle = 'rgba(0,0,0,.3)'; U.ellipse(ctx, o.x + 10, o.y + 5, 12, 4); ctx.fill();
    ctx.fillStyle = '#1f3a2c'; U.circle(ctx, o.x, o.y, 5); ctx.fill();
  });
  function drawLampTop(ctx, o, t) {
    const lx = o.x, ly = o.y - 40;
    ctx.strokeStyle = '#1f3a2c'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(lx, ly); ctx.stroke();
    const gr = ctx.createRadialGradient(lx, ly, 1, lx, ly, 38); gr.addColorStop(0, 'rgba(255,220,140,.6)'); gr.addColorStop(1, 'rgba(255,200,120,0)');
    ctx.fillStyle = gr; U.circle(ctx, lx, ly, 38); ctx.fill();
    ctx.fillStyle = '#fff2c8'; U.circle(ctx, lx, ly, 5); ctx.fill();
    ctx.strokeStyle = '#1f3a2c'; ctx.lineWidth = 1.5; U.circle(ctx, lx, ly, 6.5); ctx.stroke();
  }
  MB.Props.register('bench', (ctx, o) => {
    ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(o.rot || 0);
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(-o.hw + 4, -o.hh + 5, o.w, o.h);
    ctx.fillStyle = '#6a4a2e'; ctx.fillRect(-o.hw, -o.hh, o.w, o.h);
    ctx.fillStyle = '#8a6440'; for (let i = 0; i < 3; i++) ctx.fillRect(-o.hw + 2, -o.hh + 2 + i * (o.h / 3), o.w - 4, o.h / 3 - 2);
    ctx.restore();
  });
  // hàng xe máy đỗ trên vỉa hè (bắn nổ được)
  MB.Props.register('motoRow', (ctx, o) => {
    ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(o.rot || 0);
    const n = Math.max(2, Math.round(o.w / 28));
    for (let i = 0; i < n; i++) VN.moto(ctx, -o.hw + 14 + i * (o.w - 28) / Math.max(1, n - 1), 0, Math.PI / 2 + (i % 2 ? 0.12 : -0.1), o.flash > 0 ? '#ffffff' : o.cols[i % o.cols.length], 0.95);
    ctx.restore();
  });
  // gánh hàng / quán vỉa hè: ô che + ghế nhựa
  MB.Props.register('kiosk', (ctx, o, t) => {
    MB.Props.shadow(ctx, o.x + 10, o.y + 8, o.r * 1.05, o.r * 0.6, 0.28);
    const cols = ['#3a6ad0', '#d8403a', '#3a6ad0', '#d8403a'];
    for (let i = 0; i < 4; i++) { const a = i / 4 * U.TAU + 0.6; ctx.fillStyle = cols[i]; ctx.fillRect(o.x + Math.cos(a) * o.r * 0.7 - 4, o.y + Math.sin(a) * o.r * 0.7 - 4, 8, 8); }
    ctx.fillStyle = '#c8b090'; ctx.fillRect(o.x - 10, o.y - 6, 20, 12);
  });
  function drawKioskTop(ctx, o) {
    const x = o.x, y = o.y - 26;
    ctx.fillStyle = o.uc; ctx.beginPath(); for (let i = 0; i < 8; i++) { const a = i / 8 * U.TAU; ctx.lineTo(x + Math.cos(a) * o.r * 0.9, y + Math.sin(a) * o.r * 0.6); } ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.35)'; for (let i = 0; i < 8; i += 2) { const a = i / 8 * U.TAU, b = (i + 1) / 8 * U.TAU; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * o.r * 0.9, y + Math.sin(a) * o.r * 0.6); ctx.lineTo(x + Math.cos(b) * o.r * 0.9, y + Math.sin(b) * o.r * 0.6); ctx.closePath(); ctx.fill(); }
  }
  // ăng-ten phát sóng của GoatEvil (mục tiêu thử thách)
  MB.Props.register('antenna', (ctx, o, t) => {
    const { x, y, r } = o;
    MB.Props.shadow(ctx, x + 14, y + 6, r * 1.2, r * 0.5, 0.3);
    ctx.fillStyle = o.flash > 0 ? '#fff' : '#3a3a42'; ctx.fillRect(x - r * 0.7, y - r * 0.5, r * 1.4, r);
    ctx.strokeStyle = '#8a8a96'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x - r * 0.5, y); ctx.lineTo(x, y - r * 2.4); ctx.lineTo(x + r * 0.5, y); ctx.moveTo(x - r * 0.35, y - r * 0.8); ctx.lineTo(x + r * 0.35, y - r * 0.8); ctx.moveTo(x - r * 0.2, y - r * 1.6); ctx.lineTo(x + r * 0.2, y - r * 1.6); ctx.stroke();
    const k = (t * 1.5 + x) % 1;
    ctx.strokeStyle = `rgba(255,70,90,${1 - k})`; ctx.lineWidth = 2; U.circle(ctx, x, y - r * 2.4, 6 + k * 40); ctx.stroke();
    ctx.fillStyle = Math.sin(t * 8) > 0 ? '#ff4a5a' : '#6a1a22'; U.circle(ctx, x, y - r * 2.4, 4); ctx.fill();
  });
  // các vật cản không vẽ riêng (mặt hồ đã có trên nền)
  MB.Props.register('lake', () => {});

  Object.assign(VN.over, {
    row: (ctx, o, G) => drawRowRoof(ctx, o, G),
    temple: (ctx, o, G) => drawTempleRoof(ctx, o, G),
    vtree: (ctx, o, G, t) => drawCanopy(ctx, o, G, t),
    lamp: (ctx, o, G, t) => drawLampTop(ctx, o, t),
    kiosk: (ctx, o) => drawKioskTop(ctx, o),
    turtleTower: (ctx, o, G, t) => drawTurtleTower(ctx, o, t, true),
    hoaPhong: (ctx, o) => drawHoaPhong(ctx, o, true),
    penTower: (ctx, o) => drawPen(ctx, o, true),
  });

  /* =====================================================================
     QUÁI MỚI
     ===================================================================== */
  // Drone GoatEvil: bay qua hồ, bắn 3 tia đỏ
  Ens.register('goatDrone', Ens.make({
    name: 'Drone GoatEvil', r: 15, hp: 60, speed: 150, dmg: 8, score: 120, fly: true, blood: '#2a2a30', gore: '#ff4a5a', noContact: true,
    init(e) { e.side = Math.random() < 0.5 ? -1 : 1; },
    draw(ctx, e, G) {
      const t = G.time;
      ctx.fillStyle = 'rgba(0,0,0,.22)'; U.ellipse(ctx, e.x + 8, e.y + 22, 16, 6); ctx.fill();
      ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.face || 0);
      ctx.strokeStyle = '#2a2a32'; ctx.lineWidth = 4;
      for (const [ax, ay] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(ax * 13, ay * 13); ctx.stroke(); }
      for (const [ax, ay] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) { ctx.fillStyle = 'rgba(200,210,230,.35)'; U.circle(ctx, ax * 13, ay * 13, 8); ctx.fill(); ctx.strokeStyle = 'rgba(230,235,245,.7)'; ctx.lineWidth = 1.5; const a = t * 40; ctx.beginPath(); ctx.moveTo(ax * 13 + Math.cos(a) * 8, ay * 13 + Math.sin(a) * 8); ctx.lineTo(ax * 13 - Math.cos(a) * 8, ay * 13 - Math.sin(a) * 8); ctx.stroke(); }
      ctx.fillStyle = '#34343c'; U.rr(ctx, -9, -7, 18, 14, 5); ctx.fill();
      ctx.fillStyle = '#ff3a4a'; U.circle(ctx, 7, 0, 3); ctx.fill();
      ctx.restore();
    },
  }, Ens.AI.shooter({ min: 180, max: 430, cd: [2.2, 3.4], aim: 0.65, lineLen: 420, wig: { f: 3, a: 0.5 },
    shot(e, G, a) { MB.Audio.play('shot_plasma'); for (let i = 0; i < 3; i++) setTimeout(() => { if (!e.dead) G.enemyShot({ x: e.x, y: e.y, a: a + U.rnd(-0.05, 0.05), speed: 560, r: 5, dmg: 7, color: '#ff4a5a', owner: e }); }, i * 110); } })));

  // Xe Ôm Zombie: chạy vòng, ngắm rồi rồ ga lao thẳng
  Ens.register('xeOm', {
    name: 'Xe Ôm Zombie', r: 20, hp: 130, speed: 120, dmg: 18, score: 220, knockMul: 0.25, blood: '#4a2020', gore: '#d88a7a',
    init(e) { e.state = 'ride'; e.cd = U.rnd(2, 3.5); e.col = U.pick(['#c0302a', '#2a5ab0', '#e0e0e0', '#202024', '#d0a020']); },
    update(e, G, dt) {
      const p = G.player, d = Ens.distPlayer(e, G);
      if (e.state === 'ride') {
        e.cd -= dt;
        const a = Ens.toPlayer(e, G) + 1.1 * (e.side || (e.side = Math.random() < 0.5 ? -1 : 1));
        Ens.steer(e, G, p.x - Math.cos(a) * 240, p.y - Math.sin(a) * 240, e.speed, dt);
        if (e.cd <= 0 && d < 560 && G.los(e.x, e.y, p.x, p.y)) { e.state = 'aim'; e.st = 0.7; e.lock = Ens.toPlayer(e, G); MB.Audio.play('roar'); }
      } else if (e.state === 'aim') {
        Ens.stop(e, dt, 10); e.st -= dt;
        e.lock += U.angDiff(e.lock, Ens.toPlayer(e, G)) * Math.min(1, dt * 2.5); e.face = e.lock;
        if (e.st <= 0) { e.state = 'dash'; e.st = 0.85; e.vx = Math.cos(e.lock) * 560; e.vy = Math.sin(e.lock) * 560; }
      } else if (e.state === 'dash') {
        e.st -= dt; e.face = e.lock;
        if (Math.random() < 0.5) G.particle({ x: e.x - Math.cos(e.lock) * 20, y: e.y - Math.sin(e.lock) * 20, vx: 0, vy: 0, life: 0.4, color: 'rgba(120,120,120,.6)', r: 5 });
        if (e.bumped || e.st <= 0) { e.state = 'ride'; e.cd = U.rnd(2.5, 4); e.vx *= 0.2; e.vy *= 0.2; if (e.bumped) { e.stunT = 1; G.text(e.x, e.y - 30, 'ĐÂM!', '#ffd56a', 14); } }
      }
    },
    tele(ctx, e, G) { if (e.state === 'aim') G.drawTelegraphLine(ctx, e.x, e.y, e.lock, 470, 1 - e.st / 0.7); },
    draw(ctx, e, G) {
      ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.face || 0);
      VN.moto(ctx, 0, 0, 0, e.col, 1.25);
      ctx.fillStyle = '#5a5040'; U.rr(ctx, -10, -9, 16, 18, 7); ctx.fill();             // người lái
      ctx.fillStyle = '#8aa070'; U.circle(ctx, 2, 0, 7); ctx.fill();                       // da xanh xám
      ctx.fillStyle = e.col === '#e0e0e0' ? '#2a5ab0' : '#e8e8e8'; ctx.beginPath(); ctx.arc(1, 0, 7.6, Math.PI * 0.6, Math.PI * 1.4); ctx.fill(); // mũ bảo hiểm
      ctx.strokeStyle = '#8aa070'; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(0, -7); ctx.lineTo(12, -8); ctx.moveTo(0, 7); ctx.lineTo(12, 8); ctx.stroke();
      ctx.fillStyle = '#ff5a40'; U.circle(ctx, 7, -2.5, 1.4); ctx.fill(); U.circle(ctx, 7, 2.5, 1.4); ctx.fill();
      ctx.restore();
    },
  });

  // phân thân của sát thủ (dễ chết, nổ thành khói)
  const ninjaDraw = (ctx, e, G, boss) => {
    const t = G.time, s = boss ? 1.6 : 1;
    ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.face || 0); ctx.scale(s, s);
    const mv = Math.hypot(e.vx, e.vy) > 20, sw = mv ? Math.sin(t * 14 + e.t) * 6 : 0;
    ctx.fillStyle = '#121218'; U.rr(ctx, -6 + sw, -11, 12, 7, 3); ctx.fill(); U.rr(ctx, -6 - sw, 4, 12, 7, 3); ctx.fill();
    ctx.fillStyle = '#1c1c24'; U.rr(ctx, -11, -12, 21, 24, 9); ctx.fill();
    // khăn đỏ bay
    ctx.strokeStyle = '#c8202a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-4, 0); ctx.quadraticCurveTo(-18, Math.sin(t * 8) * 8, -30, Math.sin(t * 8 + 1) * 10); ctx.stroke();
    // kiếm sau lưng
    ctx.strokeStyle = '#b8c0cc'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-10, -10); ctx.lineTo(14, 12); ctx.stroke();
    ctx.fillStyle = '#0c0c10'; U.circle(ctx, 2, 0, 8); ctx.fill();
    ctx.fillStyle = '#ff2a3a'; ctx.fillRect(6, -4, 3, 2.2); ctx.fillRect(6, 1.8, 3, 2.2);
    ctx.restore();
  };
  Ens.register('shadowClone', {
    name: 'Phân Thân', r: 18, hp: 70, speed: 210, dmg: 14, score: 60, blood: '#101014', gore: '#3a3a48',
    update(e, G, dt) { Ens.steer(e, G, G.player.x, G.player.y, e.speed, dt, { f: 5, a: 0.5 }); e.face = Math.atan2(e.vy, e.vx); },
    onDeath(e, G) { G.burst(e.x, e.y, '#2a2a34', 24, 160); G.addHazard({ kind: 'smoke', x: e.x, y: e.y, r: 60, life: 2.5, slowMul: 0.85 }); },
    draw(ctx, e, G) { ninjaDraw(ctx, e, G, false); },
  });

  /* ---------- BOSS: SÁT THỦ BÓNG ĐÊM ---------- */
  Ens.register('nightBlade', {
    name: 'Sát Thủ Bóng Đêm', r: 30, hp: 9800, speed: 175, dmg: 22, score: 0, boss: true, knockMul: 0, blood: '#101014', gore: '#c8202a',
    init(e) { e.phase = 1; e.state = 'stalk'; e.dashT = 2.5; e.fanT = 4; e.cloneT = 6; e.smokeT = 9; e.alpha = 1; e.revealT = 0; },
    armorFn(e, dmg) { e.revealT = 1.2; return e.state === 'dizzy' ? dmg * 1.5 : dmg; },
    update(e, G, dt) {
      const p = G.player, d = Ens.distPlayer(e, G), k = e.hp / e.maxHp;
      const ph = k > 0.6 ? 1 : k > 0.25 ? 2 : 3;
      if (ph > e.phase) {
        e.phase = ph; G.shake(10); MB.Audio.play('roar');
        G.banner(`PHASE ${ph}`, ph === 2 ? 'Sát thủ phân thân' : 'Bom khói & chém liên hoàn', 2);
      }
      e.revealT = Math.max(0, e.revealT - dt);
      // tàng hình khi đi rình, hiện rõ khi bị bắn trúng hoặc ra đòn
      const stealth = e.state === 'stalk' && e.revealT <= 0;
      e.alpha += ((stealth ? 0.22 : 1) - e.alpha) * Math.min(1, dt * 6);
      if (e.state === 'stalk') {
        Ens.steer(e, G, p.x, p.y, e.speed * (ph === 3 ? 1.25 : 1), dt, { f: 3, a: 0.6 });
        e.face = Math.atan2(e.vy, e.vx);
        e.dashT -= dt; e.fanT -= dt; e.cloneT -= dt; e.smokeT -= dt;
        if (e.dashT <= 0 && d < 520) { e.state = 'aim'; e.st = ph === 3 ? 0.4 : 0.6; e.lock = Ens.toPlayer(e, G); e.chain = ph === 3 ? 2 : 0; }
        else if (e.fanT <= 0 && d < 600) {
          e.fanT = ph === 1 ? 3.6 : 2.8; e.revealT = 0.8;
          const n = ph === 1 ? 5 : 7, base = Ens.toPlayer(e, G);
          for (let i = 0; i < n; i++) G.enemyShot({ x: e.x, y: e.y, a: base + (i - (n - 1) / 2) * 0.16, speed: 470, r: 6, dmg: 9, color: '#dfe6f2', owner: e, life: 1.6 });
          MB.Audio.play('throw');
        } else if (ph >= 2 && e.cloneT <= 0) {
          e.cloneT = 11; e.revealT = 0;
          for (let i = 0; i < 3 && G.extraAlive() < 8; i++) { const a = i / 3 * U.TAU; G.spawnEnemyAt('shadowClone', e.x + Math.cos(a) * 70, e.y + Math.sin(a) * 70, { extra: true }); }
          G.burst(e.x, e.y, '#2a2a34', 30, 200); G.text(e.x, e.y - 50, 'ĐÂU LÀ THẬT?', '#c8202a', 18);
          // nhảy sang vị trí khác
          const a = U.rnd(0, U.TAU); const tx = e.x + Math.cos(a) * 220, ty = e.y + Math.sin(a) * 220;
          if (!G.obstacles.some((o) => !o.dead && MB.Col.overlap(o, tx, ty, e.r))) { e.x = tx; e.y = ty; }
        } else if (ph === 3 && e.smokeT <= 0) {
          e.smokeT = 8;
          for (let i = 0; i < 4; i++) { const a = U.rnd(0, U.TAU), r = U.rnd(60, 220); G.addHazard({ kind: 'smoke', x: p.x + Math.cos(a) * r, y: p.y + Math.sin(a) * r, r: 90, life: 6, slowMul: 0.8 }); }
          MB.Audio.play('boom');
        }
      } else if (e.state === 'aim') {
        Ens.stop(e, dt, 18); e.st -= dt;
        e.lock += U.angDiff(e.lock, Ens.toPlayer(e, G)) * Math.min(1, dt * 3); e.face = e.lock;
        if (e.st <= 0) { e.state = 'dash'; e.st = 0.32; e.vx = Math.cos(e.lock) * 900; e.vy = Math.sin(e.lock) * 900; MB.Audio.play('dash'); }
      } else if (e.state === 'dash') {
        e.st -= dt;
        G.particle({ x: e.x, y: e.y, vx: 0, vy: 0, life: 0.3, color: 'rgba(200,30,40,.5)', r: 10 });
        if (e.bumped || e.st <= 0) {
          e.vx *= 0.15; e.vy *= 0.15;
          if (e.bumped) { e.state = 'dizzy'; e.st = 1.3; G.text(e.x, e.y - 50, 'CHOÁNG!', '#ffd56a', 20); MB.Audio.play('slam'); }
          else if (e.chain > 0) { e.chain--; e.state = 'aim'; e.st = 0.3; e.lock = Ens.toPlayer(e, G); }
          else { e.state = 'stalk'; e.dashT = ph === 1 ? 3.2 : 2.4; }
        }
      } else if (e.state === 'dizzy') {
        Ens.stop(e, dt, 10); e.st -= dt; if (e.st <= 0) { e.state = 'stalk'; e.dashT = 2.5; }
      }
    },
    tele(ctx, e, G) { if (e.state === 'aim') G.drawTelegraphLine(ctx, e.x, e.y, e.lock, 300, 1 - e.st / 0.6); },
    draw(ctx, e, G) {
      ninjaDraw(ctx, e, G, true);
      if (e.state === 'dizzy') { ctx.fillStyle = '#ffd56a'; for (let i = 0; i < 3; i++) { const a = G.time * 5 + i * 2.1; U.circle(ctx, e.x + Math.cos(a) * 30, e.y - 30 + Math.sin(a) * 10, 4); ctx.fill(); } }
    },
  });
  // khói (làm chậm, che tầm nhìn)
  MB.Props.registerHazard('smoke', (ctx, h, t) => {
    const a = Math.min(1, (h.life == null ? 2 : h.life) / 1.2) * 0.7;
    for (let i = 0; i < 5; i++) { const an = t * 0.4 + i * 1.3; ctx.fillStyle = `rgba(40,40,48,${a * 0.45})`; U.circle(ctx, h.x + Math.cos(an) * h.r * 0.35, h.y + Math.sin(an) * h.r * 0.3, h.r * 0.75); ctx.fill(); }
  });

  /* =====================================================================
     BẢN ĐỒ
     ===================================================================== */
  const rng = U.seeded(1111);
  const obstacles = [], deco = [];
  const bez = (t) => { const [a, b, c] = BR; const u = 1 - t; return [u * u * a[0] + 2 * u * t * b[0] + t * t * c[0], u * u * a[1] + 2 * u * t * b[1] + t * t * c[1]]; };
  const nearBridge = (x, y, pad) => { for (let i = 0; i <= 24; i++) { const [bx, by] = bez(i / 24); if (Math.hypot(bx - x, by - y) < pad) return true; } return false; };
  // mặt hồ: chia lưới 40px, gộp theo hàng, chừa đảo Ngọc Sơn + cầu Thê Húc
  const CELL = 40;
  for (let y = LK.y - LK.ry; y < LK.y + LK.ry; y += CELL) {
    let run = null;
    for (let x = LK.x - LK.rx - CELL; x <= LK.x + LK.rx + CELL; x += CELL) {
      const cx = x + CELL / 2, cy = y + CELL / 2;
      const water = VN.inEllipse(LK, cx, cy, -6) && Math.hypot(cx - ISL.x, cy - ISL.y) > ISL.r + 4 && !nearBridge(cx, cy, 34);
      if (water) { if (!run) run = { x0: x }; run.x1 = x + CELL; }
      if ((!water || x + CELL > LK.x + LK.rx + CELL) && run) {
        obstacles.push({ kind: 'lake', shape: 'box', x: (run.x0 + run.x1) / 2, y: cy, w: run.x1 - run.x0, h: CELL + 2, rot: 0, noShot: true, water: true });
        run = null;
      }
    }
  }
  obstacles.push({ kind: 'turtleTower', shape: 'circle', x: TR.x, y: TR.y, r: 30, tall: 120 });
  obstacles.push({ kind: 'temple', shape: 'box', x: ISL.x - 10, y: ISL.y - 34, w: 120, h: 62, rot: 0, tall: 90 });
  obstacles.push({ kind: 'vtree', shape: 'circle', x: ISL.x + 50, y: ISL.y + 52, r: 30, sp: 'banyan', lean: -6 });
  // Tháp Bút (đầu cầu phía bờ) + Tháp Hoà Phong (công viên phía Đông-Nam)
  const PEN = { x: 2190, y: 900 }, HP = { x: 2540, y: 2170 };
  obstacles.push({ kind: 'penTower', shape: 'circle', x: PEN.x, y: PEN.y, r: 34, tall: 140 });
  obstacles.push({ kind: 'hoaPhong', shape: 'box', x: HP.x, y: HP.y, w: 60, h: 60, rot: 0, tall: 170 });

  // vành đai quanh hồ: liễu rủ sát mép nước, lộc vừng + đèn đường + ghế đá ở dải cỏ
  const ring = (off, step, fn) => {
    const per = 2 * Math.PI * Math.sqrt(((LK.rx + off) ** 2 + (LK.ry + off) ** 2) / 2), n = Math.floor(per / step);
    for (let i = 0; i < n; i++) { const a = i / n * U.TAU + 0.13; fn(LK.x + Math.cos(a) * (LK.rx + off), LK.y + Math.sin(a) * (LK.ry + off), a, i); }
  };
  const clearSpots = [{ x: BR[2][0], y: BR[2][1], r: 110 }, { x: PEN.x, y: PEN.y, r: 80 }];
  const freeAt = (x, y, r) => !clearSpots.some((c) => Math.hypot(c.x - x, c.y - y) < c.r + r);
  ring(42, 170, (x, y, a, i) => { if (freeAt(x, y, 30)) obstacles.push({ kind: 'vtree', shape: 'circle', x, y, r: 24, sp: 'willow', lean: -Math.cos(a) * 14, tall: 90 }); });
  ring(100, 260, (x, y, a, i) => { if (freeAt(x, y, 30)) obstacles.push({ kind: 'vtree', shape: 'circle', x, y, r: 28, sp: i % 3 ? 'locvung' : 'banyan', lean: 0, tall: 110 }); });
  ring(80, 230, (x, y, a, i) => { if (freeAt(x, y, 20) && i % 2 === 0) obstacles.push({ kind: 'lamp', shape: 'circle', x: x + 30 * Math.cos(a + 1.2), y: y + 30 * Math.sin(a + 1.2), r: 7, tall: 50 }); });
  ring(70, 310, (x, y, a, i) => { if (freeAt(x, y, 30) && i % 2) obstacles.push({ kind: 'bench', shape: 'box', x: x + 50 * Math.cos(a + 1.6), y: y + 50 * Math.sin(a + 1.6), w: 46, h: 14, rot: a + Math.PI / 2 }); });

  // dãy nhà ống
  const WALLS = ['#e8d6a8', '#f0e2c0', '#d8c08a', '#c8d8c0', '#e0c8b8', '#f2ead8', '#d0b890', '#b8c8d0', '#e8c070'];
  const AWN = ['#c0302a', '#2a6ab0', '#2a8a4a', '#d89a20', '#7a3a8a'];
  const SIGNC = ['#a8201a', '#1a4a8a', '#1a6a3a', '#3a2a1a', '#c86a10'];
  const GOODS = ['#d89a5a', '#7ab0d8', '#e0c070', '#c85a5a', '#8ac070'];
  const HOIAN_WALL = ['#e8b84a', '#e2ac3c', '#efc55a', '#d9a23a', '#e6b450', '#cfa04a', '#f0c868'];
  const LANC = ['rgba(230,40,40,1)', 'rgba(255,170,40,1)', 'rgba(250,210,60,1)', 'rgba(200,60,160,1)', 'rgba(60,170,90,1)', 'rgba(70,120,230,1)'];
  // tạo 1 dãy nhà (Hà Nội: nhà ống; Hội An: nhà cổ vàng mái ngói rêu)
  VN.row = (list, rnd, x1, y1, x2, y2, front, style) => {
    if (x2 - x1 < 60) return;
    const units = []; let u = 0; const P = (a) => a[(rnd() * a.length) | 0];
    while (u < x2 - x1 - 30) {
      const uw = Math.min(x2 - x1 - u, (style === 'hoian' ? 64 : 56) + Math.floor(rnd() * 4) * 12);
      const hoi = style === 'hoian';
      units.push({ u0: u, uw, c: P(hoi ? HOIAN_WALL : WALLS), awn: P(AWN), signC: P(SIGNC), goods: P(GOODS), sign: !hoi && rnd() < 0.75 ? P(SIGNS) : '', fl: hoi ? 2 : 3 + (rnd() * 3 | 0), hgt: hoi ? 72 + rnd() * 30 : 80 + rnd() * 60,
        roof: hoi || rnd() < 0.45 ? 'tile' : 'flat', tile: P(hoi ? ['#5a4034', '#4e3a30', '#664638', '#584238'] : ['#a8553a', '#9a4a30', '#b8633f', '#8a4a34']), flat: P(['#9a9a96', '#a8a49a', '#8e8e8a', '#b0a898']), tankY: 0.15 + rnd() * 0.4,
        solar: rnd() < 0.25, pots: rnd() < 0.5, cloth: rnd() < 0.3, plant: rnd() < 0.5, lan: hoi ? Array.from({ length: 1 + (rnd() * 2 | 0) }, () => P(LANC)) : [] });
      u += uw;
    }
    const hgt = Math.max(...units.map((q) => q.hgt));
    list.push({ kind: 'row', shape: 'box', x: (x1 + x2) / 2, y: (y1 + y2) / 2, w: x2 - x1, h: y2 - y1, rot: 0, units, hgt, front: !!front, tall: hgt, style });
  };
  const ROW = (x1, y1, x2, y2, front) => VN.row(obstacles, rng, x1, y1, x2, y2, front);
  const OUT = 300; // nhà bắt đầu từ mép ngoài đường vành đai
  const roadX = (y) => VN.ellipseX(LK, y, OUT);
  // phố cổ phía Bắc: 2 dãy nhà, các phố dọc chia cắt
  const NSTREETS = [[560, 660], [1120, 1220], [1660, 1760], [2240, 2340], [2800, 2900]];
  const rowsX = (y1, y2, front) => { let x = 60; for (const [s0, s1] of NSTREETS) { ROW(x, y1, s0, y2, front); x = s1; } ROW(x, y1, WW - 60, y2, front); };
  rowsX(60, 230, true);
  rowsX(330, 470, true);
  // phía Tây / Đông: các dãy nhà ngang, cắt bởi phố, dừng trước đường vành đai
  for (let y = 600; y < WH - 240; y += 270) {
    const y2 = y + 170, xr = LK.x - Math.max(roadX(y), roadX(y2)) - 20;
    if (xr > 220) ROW(60, y, Math.min(xr, 980), y2, true);
    const xl = LK.x + Math.max(roadX(y), roadX(y2)) + 20;
    const inPark = (yy) => Math.abs(yy - HP.y) < 260;
    if (xl < WW - 220 && !inPark(y) && !inPark(y2)) ROW(Math.max(xl, 2420), y, WW - 60, y2, true);
  }
  // phố Tràng Tiền phía Nam
  { let x = 60; for (const [s0, s1] of [[700, 800], [1300, 1400], [2000, 2100], [2600, 2700]]) { if (VN.inEllipse(LK, (x + s0) / 2, WH - 140, OUT)) { x = s1; continue; } ROW(x, WH - 220, s0, WH - 60, true); x = s1; } ROW(x, WH - 220, WW - 60, WH - 60, true); }

  // hàng xe máy trên vỉa hè + quán vỉa hè
  const MOTOC = ['#c0302a', '#2a5ab0', '#e0e0e0', '#202024', '#d0a020', '#3a8a5a', '#8a2a6a'];
  const motoRow = (x, y, w, rot) => obstacles.push({ kind: 'motoRow', shape: 'box', x, y, w, h: 26, rot: rot || 0, hp: 60, maxHp: 60, cols: Array.from({ length: 8 }, () => U.pick(MOTOC)) });
  [[300, 270, 200], [900, 270, 180], [1450, 270, 160], [2000, 270, 200], [2600, 270, 180], [3100, 270, 160], [380, 510, 200], [2600, 510, 220], [1400, 2600, 200], [2300, 2620, 180]].forEach(([x, y, w]) => motoRow(x, y, w));
  [[1010, 1250, 140, Math.PI / 2], [1010, 1900, 140, Math.PI / 2], [2390, 1300, 140, Math.PI / 2]].forEach(([x, y, w, r]) => motoRow(x, y, w, r));
  [[760, 300], [1950, 300], [2700, 300], [1120, 2560], [2520, 1600], [880, 1600]].forEach(([x, y], i) => obstacles.push({ kind: 'kiosk', shape: 'circle', x, y, r: 28, uc: ['#2a6ab0', '#c0302a', '#2a8a4a', '#d89a20'][i % 4], tall: 50 }));

  // hazards: không có — Hồ Gươm là vật cản (nước sâu)
  const hazards = [];

  // bóng tối hoàng hôn: đèn đường + cửa hàng
  const lights = [];
  for (const o of obstacles) if (o.kind === 'lamp') lights.push({ x: o.x, y: o.y - 40, r: 150, h: 40, c: 'rgba(255,210,130,.22)' });

  MB.registerGate({
    id: 11, seed: 1111, view3d: true, act: 2,
    title: 'GATE 11 — HÀ NỘI', subtitle: 'Hồ Gươm lúc hoàng hôn',
    world: { w: WW, h: WH }, bg: '#1a1a24', mmColor: 'rgba(170,150,130,.7)',
    scale: { hp: 2.0, dmg: 1.4 },
    start: { x: 520, y: 1630 },
    obstacles, hazards,
    crates: [{ x: 700, y: 900 }, { x: 760, y: 2200 }, { x: 1700, y: 560 }, { x: 2650, y: 820 }, { x: 2680, y: 2420 }, { x: 1300, y: 2600 }, { x: 2200, y: 2600 }, { x: 1600, y: 600 }],
    spawnPoints: [
      { x: 610, y: 120 }, { x: 1170, y: 120 }, { x: 1710, y: 120 }, { x: 2290, y: 120 }, { x: 2850, y: 120 },
      { x: 120, y: 820 }, { x: 120, y: 1900 }, { x: 3300, y: 820 }, { x: 3300, y: 1900 },
      { x: 750, y: 2780 }, { x: 1350, y: 2780 }, { x: 2050, y: 2780 }, { x: 2650, y: 2780 },
    ],
    waves: [
      { total: 24, maxAlive: 12, mix: { zombie: 4, runner: 4, goatDrone: 2, xeOm: 1 }, interval: [0.5, 0.9], elite: 0.1 },
      { total: 28, maxAlive: 13, mix: { runner: 4, xeOm: 3, goatDrone: 3, licker: 2, riot: 1 }, interval: [0.45, 0.85], elite: 0.14 },
      { total: 32, maxAlive: 15, mix: { xeOm: 3, goatDrone: 4, riot: 2, licker: 3, runner: 4 }, interval: [0.4, 0.8], elite: 0.18 },
    ],
    boss: { type: 'nightBlade', x: 1700, y: 590, fixed: true },
    intro: { title: 'MÀN 2 · NHIỆM VỤ', text: 'Lần theo mẩu giấy của Giáo sư Ted tới Hồ Gươm. Tìm MANH MỐI (mẩu giấy phát sáng) — có lẽ trong Đền Ngọc Sơn, qua cầu Thê Húc.' },
    objectives: [
      { title: 'BỜ HỒ', text: 'Drone GoatEvil bay qua hồ được: hạ chúng trước khi bị bắn tỉa.' },
      { title: 'PHỐ CỔ', text: 'Xe ôm zombie ngắm (vạch đỏ) rồi lao thẳng: né sang bên, dụ nó đâm vào nhà.' },
      { title: 'HOÀNG HÔN', text: 'Wave cuối trước khi kẻ sát nhân lộ diện.' },
      { title: 'BOSS · SÁT THỦ BÓNG ĐÊM', text: 'Hắn tàng hình khi rình: trúng đạn là lộ hình. Dụ hắn lao vào tường để làm choáng.' },
    ],
    challenges: [
      { id: 'antenna', type: 'destroy', name: 'Ăng-ten GoatEvil', desc: 'Phá 4 trạm phát sóng', kind: 'antenna', r: 22, hp: 300,
        spawner: { type: 'goatDrone', every: 8, range: 700, cap: 4 },
        targets: [{ x: 880, y: 760 }, { x: 2560, y: 700 }, { x: 900, y: 2400 }, { x: 2600, y: 1900 }], reward: { mod: 'barrel' } },
      { id: 'temple', type: 'hold', name: 'Giữ Đền Ngọc Sơn', desc: 'Đứng trong sân đền 15 giây', zone: { x: ISL.x, y: ISL.y + 30, r: 80 }, time: 15,
        mix: { goatDrone: 2, runner: 2 }, spawnEvery: 2, reward: { mod: 'split' } },
      { id: 'streak', type: 'streak', name: 'Người Hà Nội', desc: '18 hạ gục liên tiếp không trúng đòn', count: 18, reward: { mod: 'trigger' } },
    ],
    clue: { x: ISL.x - 60, y: ISL.y + 50, title: 'Ghi chép số 1 — Hồ Gươm', text: [
      'Ngày 3. Mẫu nước lấy dưới chân Tháp Rùa cho kết quả kỳ lạ: chủng V-0 đã có mặt ở đây từ 12 năm trước — trước cả đợt bùng phát đầu tiên.',
      'Ai đó đã thử nghiệm nó rất lâu rồi. Kẻ đó kiên nhẫn, có tiền… và hiểu virus hơn bất kỳ ai.',
      'Manh mối tiếp theo: một thương điếm cũ ở Hội An. Đèn lồng đỏ. Kho số 7.',
    ] },
    comms: [
      { on: 'start', t: 2.5, lines: [['HUNTER', 'Hồ Gươm… Giáo sư Ted từng kể ông lớn lên ở đây.']] },
      { on: 'start', t: 9, lines: [['GOATEVIL', 'Chào mừng tới Hà Nội, Hunter. Ta đã chuẩn bị một bữa tiệc nhỏ.']] },
      { on: 'wave', wave: 2, lines: [['GOATEVIL', 'Ngươi thích xe ôm không? Đội của ta chạy nhanh lắm.']] },
      { on: 'low', lines: [['GOATEVIL', 'Tim ngươi đập nhanh quá đấy, Hunter.']] },
      { on: 'boss', lines: [['GOATEVIL', 'Gặp kẻ đã tiễn lão Ted đi nhé. Hắn rất… kín đáo.'], ['HUNTER', 'Là ngươi! Ngươi đã giết Giáo sư!']] },
      { on: 'phase', phase: 2, lines: [['GOATEVIL', 'Một, hai, ba… đoán xem đâu là thật?']] },
      { on: 'won', lines: [['HUNTER', 'Hắn chỉ là con tốt thí. Kẻ thật sự đứng sau vẫn đang theo dõi.']] },
    ],
    hazards3d: { smoke: { inner: 'rgba(40,40,50,0.85)', outer: 'rgba(30,30,40,0)', add: false, opacity: 0.8 } },
    light3d: { hemiSky: 0xffe8d8, hemiGround: 0x30324a, hemi: 1.35, sun: 0xffc890, sunI: 1.9, exposure: 1.3 },

    // ---- vẽ phủ: mái nhà, tán cây, đỉnh tháp (tạo chiều sâu) ----
    drawOver(G, ctx) { VN.drawOver(G, ctx); },
    drawUnder(G, ctx) {
      // cầu Thê Húc đỏ son (lối duy nhất vào Đền Ngọc Sơn)
      ctx.lineCap = 'round';
      const pts = Array.from({ length: 25 }, (_, i) => bez(i / 24));
      ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 58; ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x + 6, y + 10) : ctx.moveTo(x + 6, y + 10))); ctx.stroke();
      ctx.strokeStyle = '#b8261e'; ctx.lineWidth = 52; ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
      ctx.strokeStyle = '#d8382c'; ctx.lineWidth = 40; ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
      ctx.strokeStyle = 'rgba(120,20,14,.6)'; ctx.lineWidth = 2;
      for (let i = 0; i <= 24; i++) { const [x, y] = pts[i], [x2, y2] = pts[Math.min(24, i + 1)], a = Math.atan2(y2 - y, x2 - x) + Math.PI / 2; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * 20, y + Math.sin(a) * 20); ctx.lineTo(x - Math.cos(a) * 20, y - Math.sin(a) * 20); ctx.stroke(); }
      // lan can
      for (const sd of [-1, 1]) {
        ctx.strokeStyle = '#8a1a14'; ctx.lineWidth = 5; ctx.beginPath();
        pts.forEach(([x, y], i) => { const [x2, y2] = pts[Math.min(24, i + 1)], [x0, y0] = pts[Math.max(0, i - 1)], a = Math.atan2(y2 - y0, x2 - x0) + Math.PI / 2; const px = x + Math.cos(a) * 25 * sd, py = y + Math.sin(a) * 25 * sd - 8; if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); });
        ctx.stroke();
      }
      // gợn sóng & phản chiếu hoàng hôn trên mặt hồ
      const t = G.time;
      ctx.strokeStyle = 'rgba(255,200,150,.18)'; ctx.lineWidth = 2;
      for (let i = 0; i < 16; i++) {
        const yy = LK.y - LK.ry + 80 + i * 100 + Math.sin(t * 0.6 + i) * 10, hw = VN.ellipseX(LK, yy, -40);
        if (hw < 40) continue;
        const xx = LK.x + Math.sin(i * 1.7 + t * 0.3) * hw * 0.4;
        ctx.beginPath(); ctx.moveTo(xx - 40, yy); ctx.quadraticCurveTo(xx, yy - 5, xx + 40, yy); ctx.stroke();
      }
    },
    drawScreen(G, ctx) {
      // ánh hoàng hôn ấm + bóng tối nhẹ, sáng quanh đèn đường
      ctx.fillStyle = 'rgba(255,120,60,.06)'; ctx.fillRect(0, 0, G.W, G.H);
      const p = G.player;
      VN.darkness(G, ctx, [{ x: p.x, y: p.y, r: 360, k: 0.9 }, ...lights], 0.3);
    },

    buildGround(g, w, h, rand) {
      // nền phố: nhựa đường
      g.fillStyle = '#3a3a40'; g.fillRect(0, 0, w, h);
      GK.patches(g, rand, w, h, 220, ['rgba(60,60,66,.4)', 'rgba(30,30,34,.35)'], 30, 120);
      // vỉa hè quanh mọi dãy nhà (gạch đỏ / xi măng)
      for (const o of obstacles) if (o.kind === 'row') { g.fillStyle = '#7a6a5e'; g.fillRect(o.x - o.w / 2 - 24, o.y - o.h / 2 - 24, o.w + 48, o.h + 48); }
      // vạch kẻ phố + vạch qua đường
      g.strokeStyle = 'rgba(240,240,240,.45)'; g.lineWidth = 4; g.setLineDash([30, 26]);
      g.beginPath(); g.moveTo(0, 280); g.lineTo(w, 280); g.stroke();
      for (const [s0, s1] of NSTREETS) { g.beginPath(); g.moveTo((s0 + s1) / 2, 0); g.lineTo((s0 + s1) / 2, 520); g.stroke(); }
      g.setLineDash([]);
      // vành đai: đường nhựa → dải cỏ → lối đi gạch đỏ → bờ đá → mặt nước
      const E = (off, fill) => { g.fillStyle = fill; g.beginPath(); g.ellipse(LK.x, LK.y, LK.rx + off, LK.ry + off, 0, 0, U.TAU); g.fill(); };
      E(265, '#3c3c44');
      g.strokeStyle = 'rgba(240,220,120,.5)'; g.lineWidth = 4; g.setLineDash([36, 30]); g.beginPath(); g.ellipse(LK.x, LK.y, LK.rx + 195, LK.ry + 195, 0, 0, U.TAU); g.stroke(); g.setLineDash([]);
      E(128, '#9a8a7a');                                  // vỉa hè ven đường
      E(118, '#4f7a3a');                                  // cỏ
      for (let i = 0; i < 900; i++) { const a = rand() * U.TAU, rr = 1 + rand() * 0.13; const x = LK.x + Math.cos(a) * (LK.rx + 70) * rr, y = LK.y + Math.sin(a) * (LK.ry + 70) * rr; g.fillStyle = rand() < 0.5 ? 'rgba(90,140,60,.6)' : 'rgba(60,100,40,.6)'; g.fillRect(x, y, 3, 3); }
      E(62, '#a8574a');                                   // lối đi gạch đỏ
      g.strokeStyle = 'rgba(80,30,20,.35)'; g.lineWidth = 1;
      for (let i = 0; i < 220; i++) { const a = i / 220 * U.TAU; g.beginPath(); g.moveTo(LK.x + Math.cos(a) * (LK.rx + 4), LK.y + Math.sin(a) * (LK.ry + 4)); g.lineTo(LK.x + Math.cos(a) * (LK.rx + 62), LK.y + Math.sin(a) * (LK.ry + 62)); g.stroke(); }
      E(8, '#6e6a62');                                    // kè đá
      // mặt hồ xanh lục đặc trưng + loang sáng hoàng hôn
      const wg = g.createLinearGradient(0, LK.y - LK.ry, 0, LK.y + LK.ry);
      wg.addColorStop(0, '#3f6e52'); wg.addColorStop(0.5, '#4c7a4e'); wg.addColorStop(1, '#3a6448');
      g.fillStyle = wg; g.beginPath(); g.ellipse(LK.x, LK.y, LK.rx, LK.ry, 0, 0, U.TAU); g.fill();
      for (let i = 0; i < 60; i++) { const a = rand() * U.TAU, rr = rand() * 0.85; g.fillStyle = `rgba(${rand() < 0.5 ? '255,190,140' : '120,170,120'},${0.05 + rand() * 0.07})`; g.beginPath(); g.ellipse(LK.x + Math.cos(a) * LK.rx * rr, LK.y + Math.sin(a) * LK.ry * rr, 60 + rand() * 80, 10 + rand() * 10, 0, 0, U.TAU); g.fill(); }
      // đảo Ngọc Sơn (sân đá + cây) và đảo Tháp Rùa (gò cỏ)
      g.fillStyle = '#6e6a62'; g.beginPath(); g.arc(ISL.x, ISL.y, ISL.r + 6, 0, U.TAU); g.fill();
      g.fillStyle = '#b8ac96'; g.beginPath(); g.arc(ISL.x, ISL.y, ISL.r, 0, U.TAU); g.fill();
      g.strokeStyle = 'rgba(80,70,60,.3)'; for (let i = -ISL.r; i < ISL.r; i += 16) { g.beginPath(); g.moveTo(ISL.x - ISL.r, ISL.y + i); g.lineTo(ISL.x + ISL.r, ISL.y + i); g.stroke(); }
      g.fillStyle = '#4f7a3a'; g.beginPath(); g.arc(ISL.x + 50, ISL.y + 52, 46, 0, U.TAU); g.fill();
      g.fillStyle = '#5a6a4a'; g.beginPath(); g.ellipse(TR.x, TR.y, TR.r, TR.r * 0.8, 0, 0, U.TAU); g.fill();
      g.fillStyle = '#4f7a3a'; g.beginPath(); g.ellipse(TR.x, TR.y, TR.r - 8, TR.r * 0.8 - 8, 0, 0, U.TAU); g.fill();
      // công viên Tháp Hoà Phong + gò Tháp Bút
      g.fillStyle = '#4f7a3a'; g.beginPath(); g.arc(HP.x, HP.y, 150, 0, U.TAU); g.fill();
      g.fillStyle = '#a8574a'; g.beginPath(); g.arc(HP.x, HP.y, 70, 0, U.TAU); g.fill();
      // quảng trường Đông Kinh Nghĩa Thục
      g.fillStyle = '#8e8478'; g.fillRect(1230, 520, 940, 150);
      g.strokeStyle = 'rgba(60,50,40,.25)'; g.lineWidth = 1; for (let x = 1230; x < 2170; x += 30) { g.beginPath(); g.moveTo(x, 520); g.lineTo(x, 670); g.stroke(); }
      GK.dots(g, rand, w, h, 1400, ['rgba(140,130,120,.4)', 'rgba(20,20,24,.4)'], 3);
      GK.vignette(g, w, h, 0.45);
    },

    /* =====================================================================
       3D
       ===================================================================== */
    models3d: {
      goatDrone: (K) => ({
        base: 15,
        build() {
          const T = K.T, g = new T.Group(), dark = K.std(0x2a2a32, { rough: 0.4, metal: 0.5 });
          const body = new T.Group(); body.position.y = 30; g.add(body);
          body.add(K.mesh(K.box(18, 7, 14), dark, 0, 0, 0), K.mesh(K.sph(3.4, 10), K.glowMat(0xff3a4a, 2.2), 9, 0, 0, false));
          body.add(K.glowSprite(0xff3a4a, 18, 0.7));
          const rotors = [];
          for (const [x, z] of [[11, 11], [11, -11], [-11, 11], [-11, -11]]) {
            const arm = K.mesh(K.box(Math.hypot(x, z), 2, 2), dark, x / 2, 1, z / 2); arm.rotation.y = -Math.atan2(z, x); body.add(arm);
            const r = K.mesh(K.box(16, 0.6, 2), K.std(0xd0d6e0, { metal: 0.6 }), x, 4, z, false); body.add(r); rotors.push(r);
          }
          g.userData = { body, rotors, h: 40 }; return g;
        },
        anim(e, m, G) { const d = m.userData; d.rotors.forEach((r, i) => { r.rotation.y = G.time * 40 + i; }); d.body.rotation.z = Math.sin(G.time * 3 + e.t) * 0.08; },
      }),
      xeOm: (K) => ({
        base: 20,
        build() {
          const T = K.T, g = new T.Group(), bike = VN.moto3D(K, 0xc0302a); bike.scale.setScalar(1.25); g.add(bike);
          const rider = K.buildZombie({ skin: 0x8aa070, cloth: 0x3a3a44, shirt: 0x5a5040, eye: 0xff5a40, pustule: false, hair: false, hunch: -0.2, arms: 0.9,
            extra(KK, torso, head) { head.add(KK.mesh(KK.sph(7.6, 14), KK.std(0xe8e8e8, { rough: 0.3 }), 0, 2, 0)); } });
          rider.scale.setScalar(0.85); rider.position.set(-2, 6, 0); g.add(rider);
          g.userData = { h: 46 }; return g;
        },
      }),
      shadowClone: (K) => ({ base: 18, anim: K.animZombie, build: () => ninja3D(K, false) }),
      nightBlade: (K) => ({ base: 30, anim: K.animZombie, build: () => ninja3D(K, true) }),
    },
    props3d: {
      lake: (o, K) => new K.T.Group(),
      row: (o, K) => {
        const T = K.T, g = new T.Group(), mats = [];
        const mk = (c, o2) => { const m = K.std(new T.Color(c).getHex(), Object.assign({ own: true, transparent: true, rough: 0.85 }, o2 || {})); mats.push(m); return m; };
        const glass = K.std(0x2a3a3a, { rough: 0.2, metal: 0.3 }), shutter = K.std(0x35604a, { rough: 0.7 }), dark = K.std(0x2a2018);
        for (const u of o.units) {
          const hgt = u.hgt, cx = -o.w / 2 + u.u0 + u.uw / 2, wall = mk(u.c, o.style === 'hoian' ? { emissive: 0x3a2400, ei: 0.55 } : null);
          g.add(K.mesh(K.box(u.uw - 1, hgt, o.h), wall, cx, hgt / 2, 0));
          if (o.style === 'hoian') {
            const fz = o.h / 2 + 0.6;
            g.add(K.mesh(K.box(u.uw - 6, 26, 1.5), K.std(0x5a3a22, { rough: 0.8 }), cx, 13, fz));
            const eave = K.mesh(K.box(u.uw, 2, 10), mk(u.tile), cx, 30, fz + 4); eave.rotation.x = 0.3; g.add(eave);
            u.lan.forEach((c, i) => { const col = new T.Color(c.replace(',1)', ')').replace('rgba', 'rgb')).getHex(), lx = cx - u.uw / 2 + (i + 0.5) * u.uw / u.lan.length;
              const ln = K.mesh(K.sph(4.5, 10), K.glowMat(col, 2.2), lx, 24, fz + 8, false); ln.scale.y = 1.2; g.add(ln); const sp = K.glowSprite(col, 34, 0.55); sp.position.set(lx, 24, fz + 8); g.add(sp); });
            if (hgt > 50) g.add(K.mesh(K.box(u.uw - 10, 12, 2), K.std(0x6a4a2a), cx, 42, fz + 1));
          } else if (o.front) {
            const fz = o.h / 2 + 0.6;
            g.add(K.mesh(K.box(u.uw - 8, 22, 1), dark, cx, 11, fz));
            const aw = K.mesh(K.box(u.uw - 4, 1.5, 12), mk(u.awn), cx, 25, fz + 5); aw.rotation.x = 0.35; g.add(aw);
            if (u.sign) g.add(K.mesh(K.box(u.uw - 10, 9, 2), K.std(new T.Color(u.signC).getHex(), { emissive: new T.Color(u.signC).getHex(), ei: 0.5 }), cx, 36, fz + 1));
            for (let fl = 1; fl < u.fl; fl++) {
              const y = 30 + fl * 22; if (y > hgt - 8) break;
              for (const k of [-1, 1]) g.add(K.mesh(K.box((u.uw - 22) / 2, 13, 1.2), Math.random() < 0.25 ? K.std(0xffd27a, { emissive: 0xffb050, ei: 0.8 }) : shutter, cx + k * (u.uw / 4), y, fz));
              g.add(K.mesh(K.box(u.uw - 6, 1.5, 6), K.std(0x2a2a2a), cx, y - 9, fz + 3));
            }
          }
          if (u.roof === 'tile') {
            const shape = new T.Shape(); shape.moveTo(-o.h / 2 - 3, 0); shape.lineTo(0, 22); shape.lineTo(o.h / 2 + 3, 0); shape.closePath();
            const geo = K.G3(`gab${o.h}_${u.uw}`, () => { const ge = new T.ExtrudeGeometry(shape, { depth: u.uw, bevelEnabled: false }); ge.rotateY(Math.PI / 2); ge.translate(-u.uw / 2, 0, 0); return ge; });
            const rm = mk(u.tile, { rough: 0.9 }); rm.map = VN.roofTex(K); rm.color.lerp(new T.Color(0xffffff), 0.15);
            const roof = new T.Mesh(geo, rm); roof.position.set(cx, hgt, 0); roof.castShadow = true; g.add(roof);
          } else {
            g.add(K.mesh(K.box(u.uw - 1, 3, o.h), mk(u.flat), cx, hgt + 1.5, 0));
            const tank = K.mesh(K.cyl(7, 7, 28, 14), K.std(0xd8dde4, { metal: 0.85, rough: 0.25 }), cx - u.uw * 0.15, hgt + 11, -o.h / 2 + o.h * u.tankY + 8); tank.rotation.z = Math.PI / 2; g.add(tank);
            if (u.solar) { const sp = K.mesh(K.box(u.uw - 12, 1, 16), K.std(0x1e2c4a, { metal: 0.4, rough: 0.2 }), cx, hgt + 6, o.h * 0.15); sp.rotation.x = -0.4; g.add(sp); }
            if (u.pots) for (let i = 0; i < 3; i++) g.add(K.mesh(K.sph(4, 8), K.std(0x4f8a3a), cx - u.uw / 2 + 8 + i * 9, hgt + 5, o.h / 2 - 8));
          }
        }
        g.userData.canopy = mats; return g;
      },
      turtleTower: (o, K) => {
        const T = K.T, g = new T.Group(), st = K.std(0xbdb49c, { rough: 0.95 }), moss = K.std(0x5a6a48, { rough: 1 }), hole = K.std(0x1e1e1a);
        let y = 0;
        [[50, 34, 3], [40, 26, 2], [30, 20, 1]].forEach(([w, h, n]) => {
          g.add(K.mesh(K.box(w, h, w), st, 0, y + h / 2, 0), K.mesh(K.box(w + 0.4, h * 0.35, w + 0.4), moss, 0, y + h * 0.18, 0));
          for (let side = 0; side < 4; side++) for (let k = 0; k < n; k++) {
            const off = (k + 0.5) * w / n - w / 2, a = side * Math.PI / 2;
            const win = K.mesh(K.box(8, h * 0.55, 2), hole, Math.cos(a) * (w / 2) + Math.sin(a) * off, y + h * 0.45, Math.sin(a) * (w / 2) - Math.cos(a) * off); win.rotation.y = -a; g.add(win);
          }
          g.add(K.mesh(K.box(w + 6, 3, w + 6), K.std(0xd6cdb5), 0, y + h + 1.5, 0)); y += h + 3;
        });
        const cap = K.mesh(K.cyl(0.1, 15, 16, 4), K.std(0x8a6a50), 0, y + 8, 0); cap.rotation.y = Math.PI / 4; g.add(cap);
        g.add(K.mesh(K.cyl(1.4, 1.4, 10, 6), K.std(0xd6cdb5), 0, y + 20, 0));
        return g;
      },
      hoaPhong: (o, K) => {
        const T = K.T, g = new T.Group(), brick = K.std(0x9a4a32, { rough: 0.95 }), trim = K.std(0x6a3a28), hole = K.std(0x1e140f);
        let y = 0;
        [[60, 56], [48, 44], [36, 36]].forEach(([w, h]) => {
          g.add(K.mesh(K.box(w, h, w), brick, 0, y + h / 2, 0));
          for (let side = 0; side < 4; side++) { const a = side * Math.PI / 2, d = K.mesh(K.box(w * 0.32, h * 0.6, 2), hole, Math.cos(a) * w / 2, y + h * 0.35, Math.sin(a) * w / 2); d.rotation.y = -a; g.add(d); }
          g.add(K.mesh(K.box(w + 8, 4, w + 8), trim, 0, y + h + 2, 0)); y += h + 4;
        });
        g.add(K.mesh(K.sph(9, 12), K.std(0xb8a070), 0, y + 4, 0));
        return g;
      },
      penTower: (o, K) => {
        const T = K.T, g = new T.Group();
        const mound = K.mesh(K.bumpy('penm', new T.SphereGeometry(o.r, 16, 10), 3, 0.3), K.std(0x6e6a5e, { flat: true }), 0, 0, 0); mound.scale.y = 0.55; g.add(mound);
        const ob = K.mesh(K.cyl(4, 9, 96, 4), K.std(0xcfc6ae, { rough: 0.9 }), 0, 66, 0); ob.rotation.y = Math.PI / 4; g.add(ob);
        g.add(K.mesh(K.G3('nib', () => new T.ConeGeometry(4.5, 22, 8)), K.std(0x2a2018), 0, 125, 0));
        return g;
      },
      temple: (o, K) => {
        const T = K.T, g = new T.Group(), wall = K.std(0xd8b04a, { rough: 0.8 }), red = K.std(0xa3241c), roofM = K.std(0x4a3a30, { own: true, transparent: true, rough: 0.9 });
        g.add(K.mesh(K.box(o.w, 40, o.h), wall, 0, 20, 0));
        for (let i = 0; i <= 6; i++) for (const z of [-1, 1]) g.add(K.mesh(K.cyl(2.4, 2.4, 40, 8), red, -o.w / 2 + 4 + i * (o.w - 8) / 6, 20, z * (o.h / 2 + 2)));
        g.add(K.mesh(K.box(26, 30, 2), K.std(0x5a1a12), 0, 15, o.h / 2 + 1));
        const shape = new T.Shape(); shape.moveTo(-o.h / 2 - 10, 0); shape.lineTo(0, 30); shape.lineTo(o.h / 2 + 10, 0); shape.closePath();
        const roof = new T.Mesh(K.G3('trf' + o.w, () => { const ge = new T.ExtrudeGeometry(shape, { depth: o.w + 20, bevelEnabled: false }); ge.rotateY(Math.PI / 2); ge.translate(-(o.w + 20) / 2, 0, 0); return ge; }), roofM);
        roof.position.y = 40; roof.castShadow = true; g.add(roof);
        for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const c = K.mesh(K.G3('curl', () => new T.ConeGeometry(3, 16, 6)), roofM, x * (o.w / 2 + 10), 46, z * (o.h / 2 + 10)); c.rotation.z = -x * 0.9; g.add(c); }
        g.add(K.mesh(K.sph(5, 10), K.std(0xc9a046, { metal: 0.6, rough: 0.3 }), 0, 72, 0));
        g.userData.canopy = [roofM]; return g;
      },
      vtree: (o, K) => {
        const T = K.T, g = new T.Group(), bark = K.std(0x4a3622, { rough: 1 });
        const lean = (o.lean || 0) / 20;
        const trunk = K.mesh(K.cyl(o.r * 0.14, o.r * 0.22, 60, 7), bark, 0, 30, 0); trunk.rotation.z = -lean * 0.4; g.add(trunk);
        const top = new T.Group(); top.position.set(o.lean || 0, 66, 0); g.add(top);
        const mats = [];
        const mk = (c) => { const m = K.std(c, { own: true, transparent: true, flat: true, rough: 0.8 }); mats.push(m); return m; };
        if (o.sp === 'willow') {
          const lf = mk(0x8fbf4a);
          top.add(K.mesh(K.G3('wico', () => new T.IcosahedronGeometry(o.r * 0.7, 0)), mk(0x6f9a3c), 0, 6, 0));
          for (let i = 0; i < 22; i++) { const a = i / 22 * Math.PI * 2, s = K.mesh(K.box(2.4, 46, 2.4), lf, Math.cos(a) * o.r * 0.7, -16, Math.sin(a) * o.r * 0.7); s.rotation.z = Math.cos(a) * 0.2; s.rotation.x = -Math.sin(a) * 0.2; top.add(s); }
        } else if (o.sp === 'locvung') {
          const c = K.mesh(K.G3('lico' + o.r, () => new T.IcosahedronGeometry(o.r, 1)), mk(0x2f6a34), 0, 8, 0); c.scale.y = 0.7; top.add(c);
          const red = mk(0xd8283a);
          for (let i = 0; i < 16; i++) { const a = i * 2.4, rr = o.r * (0.4 + (i % 4) * 0.15); top.add(K.mesh(K.box(1.2, 14, 1.2), red, Math.cos(a) * rr, -6, Math.sin(a) * rr)); }
        } else {
          for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; const c = K.mesh(K.G3('bico' + o.r, () => new T.IcosahedronGeometry(o.r * 0.6, 1)), mk(i % 2 ? 0x29522c : 0x356a36), Math.cos(a) * o.r * 0.5, 4 + (i % 3) * 5, Math.sin(a) * o.r * 0.5); top.add(c); }
          for (let i = 0; i < 6; i++) top.add(K.mesh(K.box(1.5, 50, 1.5), bark, (i - 3) * 6, -28, (i % 2) * 8 - 4)); // rễ phụ cây đa
        }
        g.userData.canopy = mats; return g;
      },
      lamp: (o, K) => {
        const T = K.T, g = new T.Group(), pole = K.std(0x1f3a2c, { metal: 0.5, rough: 0.5 });
        g.add(K.mesh(K.cyl(1.6, 2.4, 50, 8), pole, 0, 25, 0), K.mesh(K.sph(5, 10), K.glowMat(0xffe0a0, 2), 0, 53, 0, false));
        const s = K.glowSprite(0xffc070, 70, 0.55); s.position.y = 53; g.add(s);
        return g;
      },
      bench: (o, K) => { const T = K.T, g = new T.Group(); g.add(K.mesh(K.box(o.w, 3, o.h), K.std(0x8a6440), 0, 9, 0), K.mesh(K.box(o.w, 8, 2), K.std(0x6a4a2e), 0, 14, -o.h / 2)); g.rotation.y = -(o.rot || 0); return g; },
      motoRow: (o, K) => {
        const T = K.T, g = new T.Group(), n = Math.max(2, Math.round(o.w / 28));
        const flash = K.std(0x888888, { own: true });
        for (let i = 0; i < n; i++) { const b = VN.moto3D(K, new T.Color(o.cols[i % o.cols.length]).getHex()); b.position.x = -o.w / 2 + 14 + i * (o.w - 28) / Math.max(1, n - 1); b.rotation.y = Math.PI / 2 + (i % 2 ? 0.12 : -0.1); g.add(b); }
        g.rotation.y = -(o.rot || 0); g.userData.flashMat = flash; return g;
      },
      kiosk: (o, K) => {
        const T = K.T, g = new T.Group();
        g.add(K.mesh(K.cyl(1, 1, 30, 6), K.std(0x888888), 0, 15, 0));
        const um = K.mesh(K.G3('umb', () => new T.ConeGeometry(1, 0.35, 8)), K.std(new T.Color(o.uc).getHex(), { own: true, transparent: true }), 0, 32, 0); um.scale.set(o.r * 0.95, 30, o.r * 0.95); g.add(um);
        for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2 + 0.6; g.add(K.mesh(K.cyl(4, 3.5, 9, 8), K.std(i % 2 ? 0xd8403a : 0x3a6ad0), Math.cos(a) * o.r * 0.7, 4.5, Math.sin(a) * o.r * 0.7)); }
        g.add(K.mesh(K.box(20, 8, 12), K.std(0xc8b090), 0, 6, 0));
        g.userData.canopy = [um.material]; return g;
      },
      antenna: (o, K) => {
        const T = K.T, g = new T.Group(), mt = K.std(0x3a3a42, { own: true, metal: 0.6, rough: 0.4 }), steel = K.std(0x8a8a96, { metal: 0.7, rough: 0.3 });
        g.add(K.mesh(K.box(o.r * 1.4, 14, o.r), mt, 0, 7, 0));
        for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const l = K.mesh(K.cyl(1.2, 1.2, 70, 6), steel, x * 6, 48, z * 6); l.rotation.z = -x * 0.08; l.rotation.x = z * 0.08; g.add(l); }
        for (let i = 0; i < 4; i++) g.add(K.mesh(K.box(14 - i * 2.5, 1.2, 14 - i * 2.5), steel, 0, 24 + i * 16, 0));
        const lamp = K.mesh(K.sph(4, 10), K.glowMat(0xff4a5a, 2.4), 0, 86, 0, false); g.add(lamp); lamp.add(K.glowSprite(0xff4a5a, 30, 0.7));
        g.userData.flashMat = mt; g.userData.core = lamp; return g;
      },
    },
    actors3d: Object.assign({
      // mặt hồ (chừa lỗ cho 2 đảo) + cầu Thê Húc
      lakeWater: (a, K) => {
        const T = K.T, g = new T.Group();
        const sh = new T.Shape(); sh.absellipse(0, 0, LK.rx, LK.ry, 0, Math.PI * 2, false, 0);
        for (const c of [[ISL.x - LK.x, ISL.y - LK.y, ISL.r + 4], [TR.x - LK.x, TR.y - LK.y, TR.r * 0.8]]) { const hp = new T.Path(); hp.absarc(c[0], c[1], c[2], 0, Math.PI * 2, true); sh.holes.push(hp); }
        const geo = new T.ShapeGeometry(sh, 64); geo.rotateX(Math.PI / 2);
        const mt = new T.MeshStandardMaterial({ color: 0x2f8a64, emissive: 0x0c3a2a, emissiveIntensity: 0.7, roughness: 0.1, metalness: 0.45, transparent: true, opacity: 0.93, side: T.DoubleSide }); mt.userData.own = true;
        const w = new T.Mesh(geo, mt); w.position.set(0, 2, 0); w.receiveShadow = true; g.add(w);
        g.userData.anim = (aa, m, G) => { mt.emissiveIntensity = 0.65 + Math.sin(G.time * 0.6) * 0.08; };
        return g;
      },
      theHuc: (a, K) => {
        const T = K.T, g = new T.Group(), red = K.std(0xc8281e, { rough: 0.6 }), dred = K.std(0x8a1a14, { rough: 0.6 });
        for (let i = 0; i < 24; i++) {
          const [x0, y0] = bez(i / 24), [x1, y1] = bez((i + 1) / 24), mx = (x0 + x1) / 2 - a.x, mz = (y0 + y1) / 2 - a.y;
          const L = Math.hypot(x1 - x0, y1 - y0) + 1, ang = Math.atan2(y1 - y0, x1 - x0), arch = Math.sin((i + 0.5) / 24 * Math.PI) * 6;
          const deck = K.mesh(K.box(L, 3, 50), red, mx, 3 + arch * 0.4, mz); deck.rotation.y = -ang; g.add(deck);
          for (const sd of [-1, 1]) {
            const ox = Math.cos(ang + Math.PI / 2) * 24 * sd, oz = Math.sin(ang + Math.PI / 2) * 24 * sd;
            g.add(K.mesh(K.box(2.4, 14, 2.4), dred, mx + ox, 10 + arch, mz + oz));
            const rail = K.mesh(K.box(L, 2.2, 2.2), red, mx + ox, 17 + arch, mz + oz); rail.rotation.y = -ang; g.add(rail);
          }
        }
        return g;
      },
    }, MB.Story.actors3d),
    setup(G) {
      G.actors.push({ kind: 'lakeWater', x: LK.x, y: LK.y, r: 1 }, { kind: 'theHuc', x: BR[1][0], y: BR[1][1], r: 1 });
      G.__over = null;
    },
  });

  // Ninja 3D (dùng chung cho sát thủ + phân thân)
  function ninja3D(K, boss) {
    return K.buildZombie({ skin: 0x2a2a30, cloth: 0x121218, shirt: 0x1c1c24, eye: 0xff2a3a, pustule: false, hair: false, hunch: 0, arms: 0.7, gait: 12,
      extra(KK, torso, head) {
        const T = KK.T;
        head.add(KK.mesh(KK.sph(7.2, 14), KK.std(0x0c0c10, { rough: 0.5 }), 0, 0.5, 0));
        const scarf = KK.mesh(KK.box(3, 3, 26), KK.std(0xc8202a, { emissive: 0x400808 }), -6, -4, 0); scarf.rotation.y = 0.3; head.add(scarf);
        const blade = KK.mesh(KK.box(1, 36, 2.5), KK.std(0xb8c0cc, { metal: 0.9, rough: 0.15 }), -7, 6, 0); blade.rotation.x = 0.9; torso.add(blade);
        if (boss) head.add(KK.glowSprite(0xff2a3a, 26, 0.6));
      } });
  }
})(window.MB);
