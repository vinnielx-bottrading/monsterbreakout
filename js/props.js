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
  Props.register('tree', (ctx, o, t) => {
    const { x, y, r } = o;
    shadow(ctx, x + 8, y + 12, r * 0.95, r * 0.75, 0.3);
    ctx.fillStyle = '#4a3322';
    U.circle(ctx, x, y, r * 0.3); ctx.fill();
    const c1 = o.c1 || '#2f5634', c2 = o.c2 || '#3f7244', c3 = o.c3 || '#58924f';
    ctx.fillStyle = c1; U.circle(ctx, x, y, r * 0.95); ctx.fill();
    ctx.fillStyle = c2;
    U.circle(ctx, x - r * 0.22, y - r * 0.18, r * 0.58); ctx.fill();
    U.circle(ctx, x + r * 0.26, y - r * 0.05, r * 0.52); ctx.fill();
    U.circle(ctx, x - r * 0.02, y + r * 0.28, r * 0.5); ctx.fill();
    ctx.fillStyle = c3;
    U.circle(ctx, x - r * 0.3, y - r * 0.3, r * 0.26); ctx.fill();
    U.circle(ctx, x + r * 0.18, y - r * 0.22, r * 0.2); ctx.fill();
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
})(window.MB);
