/* Monster Breakout — vẽ vật cản (props) và vùng nguy hiểm (hazards) */
'use strict';
(function (MB) {
  const U = MB.U;
  const Props = MB.Props = {
    draw: {},
    hazard: {},
    register(kind, fn) { this.draw[kind] = fn; },
    registerHazard(kind, fn) { this.hazard[kind] = fn; },
  };

  function shadow(ctx, x, y, rx, ry, a) {
    ctx.fillStyle = `rgba(0,0,0,${a || 0.25})`;
    U.ellipse(ctx, x, y, rx, ry);
    ctx.fill();
  }
  Props.shadow = shadow;

  // Cây rừng (có đốm virus tuỳ chọn)
  // Cây: tán gồm nhiều "chùm lá" chồng nhau (viền gợn như mây), đổ bóng, sáng phía Tây-Bắc, có vân lá
  Props.register('tree', (ctx, o, t) => {
    const { x, y, r } = o;
    if (!o._lb) {
      const rnd = U.seeded(Math.abs((x * 7 + y * 13) | 0) + 1), n = 10 + (rnd() * 4 | 0);
      o._lb = Array.from({ length: n }, (_, i) => { const a = i / n * U.TAU + rnd() * 0.4; return [Math.cos(a) * r * (0.55 + rnd() * 0.2), Math.sin(a) * r * (0.5 + rnd() * 0.2), r * (0.36 + rnd() * 0.16)]; });
      o._mid = Array.from({ length: 6 }, () => { const a = rnd() * U.TAU, d = rnd() * r * 0.45; return [Math.cos(a) * d - r * 0.1, Math.sin(a) * d - r * 0.12, r * (0.28 + rnd() * 0.16)]; });
      o._hi = Array.from({ length: 5 }, () => [-r * (0.15 + rnd() * 0.35), -r * (0.15 + rnd() * 0.35), r * (0.12 + rnd() * 0.12)]);
      o._sp = Array.from({ length: 16 }, () => { const a = rnd() * U.TAU, d = rnd() * r * 0.85; return [Math.cos(a) * d, Math.sin(a) * d, rnd() * 3]; });
    }
    // bóng đổ mềm
    ctx.fillStyle = 'rgba(0,0,0,.16)'; U.ellipse(ctx, x + r * 0.35, y + r * 0.4, r * 1.15, r * 0.8); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,.14)'; U.ellipse(ctx, x + r * 0.3, y + r * 0.35, r * 0.9, r * 0.6); ctx.fill();
    ctx.fillStyle = '#3e2a1c'; U.circle(ctx, x, y, r * 0.24); ctx.fill();
    const c1 = o.c1 || '#2f5634', c2 = o.c2 || '#3f7244', c3 = o.c3 || '#58924f';
    // lớp tối (viền gợn)
    ctx.fillStyle = c1;
    ctx.beginPath(); ctx.arc(x, y, r * 0.72, 0, U.TAU); for (const [dx, dy, rr] of o._lb) { ctx.moveTo(x + dx + rr, y + dy); ctx.arc(x + dx, y + dy, rr, 0, U.TAU); } ctx.fill();
    // lớp giữa lệch về phía sáng
    ctx.fillStyle = c2;
    ctx.beginPath(); for (const [dx, dy, rr] of o._mid) { ctx.moveTo(x + dx + rr, y + dy); ctx.arc(x + dx, y + dy, rr, 0, U.TAU); } ctx.fill();
    // điểm sáng
    ctx.fillStyle = c3;
    ctx.beginPath(); for (const [dx, dy, rr] of o._hi) { ctx.moveTo(x + dx + rr, y + dy); ctx.arc(x + dx, y + dy, rr, 0, U.TAU); } ctx.fill();
    // vân lá
    ctx.strokeStyle = 'rgba(0,0,0,.16)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); for (const [dx, dy, a] of o._sp) { ctx.moveTo(x + dx, y + dy); ctx.arc(x + dx, y + dy, 3.5, a, a + 1.8); } ctx.stroke();
    if (o.infected) {
      const p = 0.55 + Math.sin(t * 3 + x) * 0.25;
      ctx.fillStyle = `rgba(170,255,90,${p})`;
      U.circle(ctx, x + r * 0.35, y + r * 0.3, 5); ctx.fill();
      U.circle(ctx, x - r * 0.45, y + r * 0.1, 3.5); ctx.fill();
      U.circle(ctx, x + r * 0.05, y - r * 0.5, 4); ctx.fill();
    }
  });

  Props.register('rock', (ctx, o) => {
    const { x, y, r } = o;
    shadow(ctx, x + 5, y + 9, r * 0.98, r * 0.66, 0.28);
    ctx.fillStyle = o.c1 || '#5b6264';
    ctx.beginPath();
    ctx.moveTo(x - r * 0.95, y + r * 0.12);
    ctx.quadraticCurveTo(x - r * 0.7, y - r * 0.78, x + r * 0.05, y - r * 0.92);
    ctx.quadraticCurveTo(x + r * 0.85, y - r * 0.55, x + r * 0.93, y + r * 0.12);
    ctx.quadraticCurveTo(x + r * 0.5, y + r * 0.9, x - r * 0.5, y + r * 0.8);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = o.c2 || '#737b7d';
    ctx.beginPath();
    ctx.moveTo(x - r * 0.6, y - r * 0.1);
    ctx.quadraticCurveTo(x - r * 0.4, y - r * 0.65, x + r * 0.1, y - r * 0.7);
    ctx.quadraticCurveTo(x + r * 0.5, y - r * 0.4, x + r * 0.3, y - r * 0.05);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,.22)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x - r * 0.1, y + r * 0.1); ctx.lineTo(x + r * 0.35, y + r * 0.45); ctx.stroke();
  });

  Props.register('log', (ctx, o) => {
    ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(o.rot);
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(-o.hw + 5, -o.hh + 8, o.w, o.h);
    ctx.fillStyle = '#5e3e25'; U.rr(ctx, -o.hw, -o.hh, o.w, o.h, o.hh); ctx.fill();
    ctx.fillStyle = '#7d5434'; U.rr(ctx, -o.hw + 4, -o.hh + 4, o.w - 8, o.h - 10, o.hh - 4); ctx.fill();
    ctx.strokeStyle = '#3f2816'; ctx.lineWidth = 2;
    for (let i = -o.hw + 18; i < o.hw - 6; i += 24) { ctx.beginPath(); ctx.moveTo(i, -o.hh + 3); ctx.lineTo(i + 6, o.hh - 3); ctx.stroke(); }
    ctx.fillStyle = '#b08355'; U.ellipse(ctx, o.hw - 3, 0, 5, o.hh - 2); ctx.fill();
    ctx.strokeStyle = '#7d5434'; ctx.lineWidth = 1.5; U.ellipse(ctx, o.hw - 3, 0, 2.5, o.hh * 0.5); ctx.stroke();
    ctx.restore();
  });

  // Thùng tiếp tế — phá được bằng súng
  Props.register('crate', (ctx, o) => {
    ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(o.rot || 0);
    const w = o.w, h = o.h;
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(-w / 2 + 5, -h / 2 + 8, w, h);
    ctx.fillStyle = o.flash > 0 ? '#e9c79a' : '#8b6133'; ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.strokeStyle = '#c0915a'; ctx.lineWidth = 3; ctx.strokeRect(-w / 2 + 4, -h / 2 + 4, w - 8, h - 8);
    ctx.beginPath(); ctx.moveTo(-w / 2 + 7, -h / 2 + 7); ctx.lineTo(w / 2 - 7, h / 2 - 7); ctx.moveTo(w / 2 - 7, -h / 2 + 7); ctx.lineTo(-w / 2 + 7, h / 2 - 7); ctx.stroke();
    ctx.fillStyle = '#4b5559';
    [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, sy]) => ctx.fillRect(sx * w / 2 - (sx > 0 ? 9 : 0), sy * h / 2 - (sy > 0 ? 9 : 0), 9, 9));
    // biểu tượng tiếp tế
    ctx.fillStyle = '#ffd56a'; U.circle(ctx, 0, 0, 8); ctx.fill();
    ctx.fillStyle = '#5a3c18'; ctx.fillRect(-1.5, -5, 3, 10); ctx.fillRect(-5, -1.5, 10, 3);
    if (o.hp < o.maxHp) {
      ctx.strokeStyle = 'rgba(30,15,5,.75)'; ctx.lineWidth = 2;
      const k = 1 - o.hp / o.maxHp;
      ctx.beginPath(); ctx.moveTo(-w * 0.3, -h * 0.4); ctx.lineTo(-w * 0.1, -h * 0.1); ctx.lineTo(-w * 0.25, h * 0.1 * k * 3);
      if (k > 0.45) { ctx.moveTo(w * 0.35, h * 0.3); ctx.lineTo(w * 0.1, h * 0.05); ctx.lineTo(w * 0.2, -h * 0.2); }
      ctx.stroke();
    }
    ctx.restore();
  });

  // vùng nguy hiểm chưa có hàm vẽ riêng: vòng tròn màu
  Props.hazardGeneric = (ctx, h) => {
    ctx.fillStyle = h.color || 'rgba(255,120,60,.35)'; U.circle(ctx, h.x, h.y, h.r); ctx.fill();
  };
  Props.actor = {};
  Props.registerActor = (kind, fn) => { Props.actor[kind] = fn; };

  /* ---------- Hazards ---------- */
  Props.registerHazard('virus', (ctx, h, t) => {
    const { x, y, r } = h;
    const g = ctx.createRadialGradient(x, y, r * 0.08, x, y, r);
    g.addColorStop(0, 'rgba(203,255,118,.72)');
    g.addColorStop(0.5, 'rgba(112,243,93,.5)');
    g.addColorStop(1, 'rgba(77,180,58,.1)');
    ctx.fillStyle = g; U.circle(ctx, x, y, r); ctx.fill();
    ctx.strokeStyle = 'rgba(218,255,153,.28)'; ctx.lineWidth = 2;
    U.circle(ctx, x, y, r * (0.7 + Math.sin(t * 2 + x) * 0.05)); ctx.stroke();
    for (let i = 0; i < 7; i++) {
      const a = t * 0.6 + i * 0.9 + x * 0.01;
      const k = (t * 0.8 + i * 0.37) % 1;
      const bx = x + Math.cos(a) * r * 0.55, by = y + Math.sin(a * 1.3) * r * 0.38;
      ctx.fillStyle = `rgba(230,255,180,${0.6 * (1 - k)})`;
      U.circle(ctx, bx, by, 2 + k * 5); ctx.fill();
    }
  });

  // Mạng nhện do boss bắn ra: làm chậm
  Props.registerHazard('web', (ctx, h) => {
    const a = Math.min(1, h.life / 1.2) * 0.75;
    ctx.save(); ctx.translate(h.x, h.y);
    ctx.strokeStyle = `rgba(235,235,225,${a})`; ctx.lineWidth = 1.4;
    for (let i = 0; i < 8; i++) {
      const an = i / 8 * U.TAU;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(an) * h.r, Math.sin(an) * h.r); ctx.stroke();
    }
    for (let k = 1; k <= 3; k++) { U.circle(ctx, 0, 0, h.r * k / 3.3); ctx.stroke(); }
    ctx.restore();
  });

  /* ---------- vùng nguy hiểm dùng chung cho các Gate ---------- */
  const fadeOf = (h) => (h.life != null ? Math.min(1, h.life / 1.2) : 1);
  function blobPath(ctx, h, wob, t) {
    ctx.beginPath();
    for (let i = 0; i <= 18; i++) {
      const a = i / 18 * U.TAU, rr = h.r * (1 + Math.sin(a * 3 + h.x * 0.01) * wob + Math.sin(a * 5 + t * 0.6) * wob * 0.4);
      const x = h.x + Math.cos(a) * rr, y = h.y + Math.sin(a) * rr * 0.92;
      if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
    }
    ctx.closePath();
  }
  Props.registerHazard('mud', (ctx, h, t) => {
    ctx.globalAlpha = fadeOf(h);
    blobPath(ctx, h, 0.08, 0); ctx.fillStyle = 'rgba(58,44,26,.85)'; ctx.fill();
    blobPath(ctx, { x: h.x, y: h.y, r: h.r * 0.75 }, 0.1, 0); ctx.fillStyle = 'rgba(78,60,36,.7)'; ctx.fill();
    for (let i = 0; i < 4; i++) {
      const k = (t * 0.5 + i * 0.27 + h.x * 0.001) % 1, a = i * 1.7 + h.y * 0.01;
      ctx.strokeStyle = `rgba(120,98,64,${0.7 * (1 - k)})`; ctx.lineWidth = 1.5;
      U.circle(ctx, h.x + Math.cos(a) * h.r * 0.45, h.y + Math.sin(a) * h.r * 0.4, 3 + k * 9); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  });
  Props.registerHazard('acid', (ctx, h, t) => {
    ctx.globalAlpha = fadeOf(h);
    const g = ctx.createRadialGradient(h.x, h.y, 2, h.x, h.y, h.r);
    g.addColorStop(0, 'rgba(210,255,110,.8)'); g.addColorStop(1, 'rgba(120,220,40,.08)');
    blobPath(ctx, h, 0.07, t); ctx.fillStyle = g; ctx.fill();
    ctx.globalAlpha = 1;
  });
  Props.registerHazard('gas', (ctx, h, t) => {
    const a = fadeOf(h);
    for (let i = 0; i < 5; i++) {
      const an = t * 0.7 + i * 1.3, rr = h.r * (0.45 + (i % 3) * 0.15);
      ctx.fillStyle = `rgba(200,235,100,${0.16 * a})`;
      U.circle(ctx, h.x + Math.cos(an) * h.r * 0.3, h.y + Math.sin(an * 1.2) * h.r * 0.25, rr); ctx.fill();
    }
  });
  Props.registerHazard('lava', (ctx, h, t) => {
    ctx.globalAlpha = fadeOf(h);
    const g = ctx.createRadialGradient(h.x, h.y, 2, h.x, h.y, h.r);
    g.addColorStop(0, 'rgba(255,235,140,1)'); g.addColorStop(0.55, 'rgba(255,120,30,.95)'); g.addColorStop(1, 'rgba(160,30,10,.75)');
    blobPath(ctx, h, 0.06, t); ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = 'rgba(40,10,5,.6)'; ctx.lineWidth = 3; ctx.stroke();
    for (let i = 0; i < 3; i++) { const k = (t * 0.8 + i * 0.33 + h.x * 0.002) % 1; ctx.fillStyle = `rgba(255,240,170,${1 - k})`; U.circle(ctx, h.x + Math.cos(i * 2.3 + h.y) * h.r * 0.4, h.y + Math.sin(i * 2.3) * h.r * 0.35, 2 + k * 5); ctx.fill(); }
    ctx.globalAlpha = 1;
  });
  Props.registerHazard('fire', (ctx, h, t) => {
    const a = fadeOf(h);
    for (let i = 0; i < 4; i++) {
      const fl = 0.7 + Math.random() * 0.3;
      ctx.fillStyle = i % 2 ? `rgba(255,190,80,${0.35 * a * fl})` : `rgba(255,100,30,${0.3 * a * fl})`;
      U.circle(ctx, h.x + Math.sin(t * 9 + i) * 4, h.y + Math.cos(t * 7 + i) * 4, h.r * (0.5 + i * 0.15)); ctx.fill();
    }
  });
  Props.registerHazard('ice', (ctx, h) => {
    ctx.globalAlpha = fadeOf(h);
    blobPath(ctx, h, 0.05, 0); ctx.fillStyle = 'rgba(205,235,255,.55)'; ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(h.x - h.r * 0.5, h.y - h.r * 0.2); ctx.lineTo(h.x + h.r * 0.2, h.y + h.r * 0.1); ctx.lineTo(h.x + h.r * 0.5, h.y - h.r * 0.3); ctx.stroke();
    ctx.globalAlpha = 1;
  });
  Props.registerHazard('water', (ctx, h, t) => {
    ctx.globalAlpha = fadeOf(h);
    blobPath(ctx, h, 0.05, t * 0.3); ctx.fillStyle = 'rgba(60,150,200,.3)'; ctx.fill();
    const k = (t * 0.3 + h.x * 0.001) % 1; ctx.strokeStyle = `rgba(220,245,255,${0.25 * (1 - k)})`; ctx.lineWidth = 2; U.circle(ctx, h.x, h.y, h.r * (0.4 + k * 0.5)); ctx.stroke();
    ctx.globalAlpha = 1;
  });
  Props.registerHazard('oil', (ctx, h) => {
    ctx.globalAlpha = fadeOf(h);
    blobPath(ctx, h, 0.1, 0); ctx.fillStyle = 'rgba(15,12,10,.75)'; ctx.fill();
    ctx.strokeStyle = 'rgba(120,90,200,.25)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.globalAlpha = 1;
  });

  /* ---------- công cụ vẽ nền dùng chung cho các Gate ---------- */
  MB.GK = {
    // mảng màu nền: hình méo tự nhiên, mép mờ dần (không còn là hình tròn cứng)
    patches(g, rand, w, h, n, colors, rmin, rmax) {
      for (let i = 0; i < n; i++) {
        const col = colors[(rand() * colors.length) | 0], x = rand() * w, y = rand() * h, r = rmin + rand() * (rmax - rmin);
        const p1 = rand() * 6.3, p2 = rand() * 6.3, p3 = rand() * 6.3, sx = 0.7 + rand() * 0.6, rot = rand() * 6.3;
        const clear = /rgba\(/.test(col) ? col.replace(/,\s*[\d.]+\)$/, ',0)') : null;
        g.save(); g.translate(x, y); g.rotate(rot); g.scale(sx, 1 / sx);
        if (clear) { const gr = g.createRadialGradient(0, 0, r * 0.05, 0, 0, r); gr.addColorStop(0, col); gr.addColorStop(0.5, col); gr.addColorStop(1, clear); g.fillStyle = gr; }
        else g.fillStyle = col;
        g.beginPath();
        for (let k = 0; k <= 28; k++) {
          const a = k / 28 * U.TAU, rr = r * (1 + 0.16 * Math.sin(a * 3 + p1) + 0.09 * Math.sin(a * 5 + p2) + 0.05 * Math.sin(a * 9 + p3));
          if (k) g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); else g.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
        }
        g.closePath(); g.fill(); g.restore();
      }
    },
    strokes(g, rand, w, h, n, colors, len, lw) {
      g.lineWidth = lw || 1.5;
      for (let i = 0; i < n; i++) {
        const x = rand() * w, y = rand() * h, l = len * (0.5 + rand()), a = -Math.PI / 2 + (rand() - 0.5);
        g.strokeStyle = colors[(rand() * colors.length) | 0];
        g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
      }
    },
    dots(g, rand, w, h, n, colors, s) {
      for (let i = 0; i < n; i++) { g.fillStyle = colors[(rand() * colors.length) | 0]; g.beginPath(); g.ellipse(rand() * w, rand() * h, s * (0.3 + rand() * 0.5), s * (0.2 + rand() * 0.35), rand() * 3.14, 0, U.TAU); g.fill(); }
    },
    cracks(g, rand, w, h, n, color, step) {
      for (let k = 0; k < n; k++) {
        let x = rand() * w, y = rand() * h, a = rand() * U.TAU;
        g.strokeStyle = color; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y);
        for (let s = 0; s < 6; s++) { a += (rand() - 0.5) * 1.2; x += Math.cos(a) * (step || 24); y += Math.sin(a) * (step || 24); g.lineTo(x, y); }
        g.stroke();
      }
    },
    path(g, pts, width, color) {
      g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = color; g.lineWidth = width;
      g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length - 1; i++) { const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2; g.quadraticCurveTo(pts[i][0], pts[i][1], mx, my); }
      const l = pts[pts.length - 1]; g.lineTo(l[0], l[1]); g.stroke();
    },
    vignette(g, w, h, a) {
      const v = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.65);
      v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, `rgba(0,0,0,${a})`);
      g.fillStyle = v; g.fillRect(0, 0, w, h);
    },
    // viền bản đồ bằng vật cản, chừa lối vào phía tây (gapY)
    border(list, rand, w, h, make, gapY) {
      for (let x = 60; x < w; x += 95 + rand() * 45) { make(list, x, 40 + rand() * 40, rand); make(list, x + 30, h - 40 - rand() * 40, rand); }
      for (let y = 170; y < h - 140; y += 100 + rand() * 45) { if (gapY == null || Math.abs(y - gapY) > 170) make(list, 35 + rand() * 40, y, rand); make(list, w - 35 - rand() * 40, y, rand); }
    },
    // rải vật cản ngẫu nhiên, tránh các vùng cấm [{x,y,r}]
    scatter(list, rand, n, box, avoid, make) {
      let made = 0, tries = 0;
      while (made < n && tries++ < n * 30) {
        const x = box[0] + rand() * (box[2] - box[0]), y = box[1] + rand() * (box[3] - box[1]);
        if (avoid.some((a) => Math.hypot(a.x - x, a.y - y) < a.r)) continue;
        if (list.some((o) => Math.hypot(o.x - x, o.y - y) < (o.r || 60) + 60)) continue;
        make(list, x, y, rand); made++;
      }
    },
  };
})(window.MB);
