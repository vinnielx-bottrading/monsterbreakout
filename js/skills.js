/* Monster Breakout — kỹ năng giải vây
   - Lựu đạn (G / nút LỰU): ném tới điểm ngắm, nổ diện rộng, hất văng quái. Tối đa 3 quả, tự hồi 1 quả mỗi 15 giây.
   - Xung kích (F / nút XUNG): sóng năng lượng quanh người, đẩy lùi + làm choáng quái, xoá đạn địch gần. Hồi chiêu 18 giây. */
'use strict';
(function (MB) {
  const U = MB.U;
  const S = MB.Skills = {
    GRENADE: { max: 3, regen: 15, radius: 140, dmg: 140, knock: 520, range: 460 },
    NOVA: { cd: 18, radius: 230, dmg: 50, knock: 700, stun: 1.3 },

    init(p) { p.grenades = 2; p.gRegen = S.GRENADE.regen; p.novaCd = 0; },

    update(G, dt) {
      const p = G.player, I = MB.Input;
      if (p.grenades < S.GRENADE.max) { p.gRegen -= dt; if (p.gRegen <= 0) { p.grenades++; p.gRegen = S.GRENADE.regen; } }
      else p.gRegen = S.GRENADE.regen;
      p.novaCd = Math.max(0, p.novaCd - dt);
      if (!p.dead && !G.over) {
        if (I.take('grenade')) this.throwGrenade(G);
        if (I.take('nova')) this.nova(G);
      } else { I.take('grenade'); I.take('nova'); }

      for (let i = G.grenades.length - 1; i >= 0; i--) {
        const g = G.grenades[i];
        g.t += dt;
        const k = Math.min(1, g.t / g.T);
        g.x = U.lerp(g.x0, g.x1, k); g.y = U.lerp(g.y0, g.y1, k);
        g.h = 4 * g.H * k * (1 - k) + 18 * (1 - k);
        if (k >= 1) { this.explode(G, g.x, g.y); G.grenades.splice(i, 1); }
      }
    },

    throwGrenade(G) {
      const p = G.player, I = MB.Input, C = S.GRENADE;
      if (p.grenades <= 0) { MB.Audio.play('empty'); MB.HUD.toast('Hết lựu đạn · tự hồi sau ' + Math.ceil(p.gRegen) + 's', '#ff8a5c'); return; }
      let tx, ty;
      if (I.mode === 'kb') {
        if (G.r3on) { const w = MB.R3.screenToGround(I.mouse.x, I.mouse.y, G); tx = w.x; ty = w.y; }
        else { tx = I.mouse.x / G.zoom + G.cam.x; ty = I.mouse.y / G.zoom + G.cam.y; }
      } else if (G.lockE && !G.lockE.dead) { tx = G.lockE.x; ty = G.lockE.y; }
      else { tx = p.x + Math.cos(p.aim) * 300; ty = p.y + Math.sin(p.aim) * 300; }
      const d = U.dist(tx, ty, p.x, p.y);
      if (d > C.range) { tx = p.x + (tx - p.x) / d * C.range; ty = p.y + (ty - p.y) / d * C.range; }
      const dd = U.dist(tx, ty, p.x, p.y);
      p.grenades--;
      G.grenades.push({ x0: p.x, y0: p.y, x1: tx, y1: ty, x: p.x, y: p.y, h: 18, t: 0, T: 0.45 + dd / 1100, H: 40 + dd * 0.3 });
      MB.Audio.play('throw');
    },

    explode(G, x, y) {
      const C = S.GRENADE;
      MB.Audio.play('boom'); G.shake(11);
      G.burst(x, y, '#ffb347', 30, 320); G.burst(x, y, '#5a5048', 18, 180);
      G.decal(x, y, 'rgba(20,16,12,.85)', 46);
      G.addFx({
        layer: 'ground', life: 0.45,
        draw(ctx, fx) {
          const k = fx.t / fx.life, R = C.radius * (0.4 + k * 0.7);
          ctx.fillStyle = `rgba(255,170,70,${0.55 * (1 - k)})`; U.circle(ctx, x, y, R); ctx.fill();
          ctx.strokeStyle = `rgba(255,230,160,${1 - k})`; ctx.lineWidth = 6 * (1 - k) + 1; U.circle(ctx, x, y, R); ctx.stroke();
        },
      });
      for (const e of G.enemies) {
        if (e.dead) continue;
        const d = U.dist(e.x, e.y, x, y);
        if (d > C.radius + e.r) continue;
        const a = Math.atan2(e.y - y, e.x - x);
        G.damageEnemy(e, C.dmg * (1 - Math.min(1, d / C.radius) * 0.5), a, e.boss ? 0 : C.knock);
      }
      for (const o of G.obstacles) if (!o.dead && o.hp && U.dist(o.x, o.y, x, y) < C.radius + o.br) G.damageObstacle(o, 120);
    },

    nova(G) {
      const p = G.player, C = S.NOVA;
      if (p.novaCd > 0) { MB.Audio.play('empty'); return; }
      p.novaCd = C.cd;
      p.iframes = Math.max(p.iframes, 0.35);
      MB.Audio.play('nova'); G.shake(8);
      const x = p.x, y = p.y;
      G.addFx({
        layer: 'ground', life: 0.5,
        draw(ctx, fx) {
          const k = fx.t / fx.life, R = C.radius * (0.2 + k * 0.85);
          ctx.fillStyle = `rgba(126,243,255,${0.22 * (1 - k)})`; U.circle(ctx, x, y, R); ctx.fill();
          ctx.strokeStyle = `rgba(190,250,255,${1 - k})`; ctx.lineWidth = 10 * (1 - k) + 2; U.circle(ctx, x, y, R); ctx.stroke();
        },
      });
      for (let i = 0; i < 24; i++) { const a = i / 24 * U.TAU; G.particle({ x, y, vx: Math.cos(a) * 420, vy: Math.sin(a) * 420, life: 0.35, color: '#7ef3ff', r: 2, type: 'spark', drag: 0.9 }); }
      for (const e of G.enemies) {
        if (e.dead) continue;
        const d = U.dist(e.x, e.y, x, y);
        if (d > C.radius + e.r) continue;
        const a = Math.atan2(e.y - y, e.x - x);
        G.damageEnemy(e, C.dmg, a, e.boss ? 0 : C.knock);
        if (!e.boss && !e.dead) e.stunT = C.stun;
      }
      // xoá đạn địch trong vùng
      for (let i = G.ebullets.length - 1; i >= 0; i--) { const b = G.ebullets[i]; if (U.dist(b.x, b.y, x, y) < C.radius) { G.burst(b.x, b.y, '#bff8ff', 3, 60); G.ebullets.splice(i, 1); } }
    },

    draw2D(ctx, G) {
      for (const g of G.grenades) {
        ctx.fillStyle = 'rgba(0,0,0,.3)'; U.ellipse(ctx, g.x, g.y + 4, 7, 4); ctx.fill();
        ctx.fillStyle = '#3e5a36'; U.circle(ctx, g.x, g.y - g.h, 6); ctx.fill();
        ctx.fillStyle = Math.floor(G.time * 12) % 2 ? '#ff5b5b' : '#ffd56a'; U.circle(ctx, g.x + 2, g.y - g.h - 2, 2); ctx.fill();
      }
    },
  };
})(window.MB);
