/* Monster Breakout — nhân vật chính "Hunter": đặc nhiệm chống virus
   Thiết kế: giáp xanh đậm, sọc cam cảnh báo, mũ có kính visor phát sáng,
   bình lọc sinh học sau lưng. Chân theo hướng di chuyển, thân theo hướng ngắm. */
'use strict';
(function (MB) {
  const U = MB.U;

  const Hero = MB.Hero = {
    create(x, y) {
      return {
        x, y, vx: 0, vy: 0, r: 18,
        hp: 100, maxHp: 100, armor: 0, maxArmor: 60,
        stamina: 100, exhausted: false,
        speed: 235, sprintMul: 1.5, accel: 11,
        aim: 0, moveAng: 0, walk: 0,
        dash: null, dashCd: 0, dashCdMax: 1.0, iframes: 0, hurtT: 0,
        recoil: 0, muzzle: 0, swapT: 0, fireCd: 0,
        weapons: [], wi: 0,
        mods: { barrel: 0, trigger: 0, mag: 0, pierce: 0, split: 0 },
        ghosts: [], slow: 0, inVirus: false, dead: false, deadT: 0,
      };
    },

    update(p, G, dt) {
      const I = MB.Input;
      if (p.dead) { p.deadT += dt; return; }
      let mx = I.move.x, my = I.move.y;
      let len = Math.hypot(mx, my);
      if (len > 1) { mx /= len; my /= len; len = 1; }

      // thể lực
      const wantSprint = I.sprint() && len > 0.2;
      const sprinting = wantSprint && !p.exhausted && p.stamina > 0;
      if (sprinting) p.stamina -= 30 * dt;
      else p.stamina = Math.min(100, p.stamina + (len > 0.1 ? 15 : 25) * dt);
      if (p.stamina <= 0) { p.stamina = 0; p.exhausted = true; }
      if (p.exhausted && p.stamina >= 35) p.exhausted = false;
      p.sprinting = sprinting;

      let mul = sprinting ? p.sprintMul : 1;
      if (p.inVirus) mul *= 0.8;
      if (p.zoneMul < 1) mul *= p.zoneMul;
      if (p.slow > 0) { mul *= 0.55; p.slow -= dt; }
      if (G.wantFire) mul *= 0.88;

      if (p.dash) {
        p.dash.t -= dt;
        p.vx = p.dash.dx * p.dash.spd; p.vy = p.dash.dy * p.dash.spd;
        if (Math.random() < 0.7) p.ghosts.push({ x: p.x, y: p.y, a: p.aim, life: 0.22 });
        if (p.dash.t <= 0) { p.dash = null; p.vx *= 0.35; p.vy *= 0.35; }
      } else {
        const k = 1 - Math.exp(-(p.slip ? 2.2 : p.accel) * dt);
        p.vx += (mx * p.speed * mul - p.vx) * k;
        p.vy += (my * p.speed * mul - p.vy) * k;
      }
      p.x += p.vx * dt; p.y += p.vy * dt;
      G.collide(p);

      const sp = Math.hypot(p.vx, p.vy);
      p.walk += sp * dt * 0.05;
      if (sp > 30) p.moveAng = Math.atan2(p.vy, p.vx);

      if (I.take('dodge')) this.dodge(p, mx, my);

      p.dashCd = Math.max(0, p.dashCd - dt);
      p.iframes = Math.max(0, p.iframes - dt);
      p.hurtT = Math.max(0, p.hurtT - dt);
      p.recoil *= Math.pow(0.0005, dt);
      p.muzzle = Math.max(0, p.muzzle - dt);
      for (let i = p.ghosts.length - 1; i >= 0; i--) { p.ghosts[i].life -= dt; if (p.ghosts[i].life <= 0) p.ghosts.splice(i, 1); }
    },

    dodge(p, mx, my) {
      if (p.dash || p.dashCd > 0 || p.stamina < 18) { if (p.stamina < 18) MB.Audio.play('empty'); return; }
      let dx = mx, dy = my;
      if (Math.hypot(dx, dy) < 0.15) { dx = Math.cos(p.aim); dy = Math.sin(p.aim); }
      const l = Math.hypot(dx, dy) || 1;
      p.dash = { t: 0.19, dx: dx / l, dy: dy / l, spd: 700 };
      p.iframes = Math.max(p.iframes, 0.3);
      p.dashCd = p.dashCdMax;
      p.stamina -= 18;
      MB.Audio.play('dash');
    },

    draw(ctx, p, G) {
      const t = G.time;
      // bóng mờ khi lộn né
      for (const g of p.ghosts) {
        ctx.globalAlpha = g.life * 1.8;
        ctx.fillStyle = '#7ef3ff';
        U.circle(ctx, g.x, g.y, 13); ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (p.dead) { this.drawDead(ctx, p); return; }

      const flicker = p.iframes > 0 && !p.dash && Math.floor(t * 20) % 2 === 0;
      ctx.save();
      ctx.translate(p.x, p.y);
      if (flicker) ctx.globalAlpha = 0.55;

      // vòng định vị dưới chân (dễ nhận ra giữa đám quái)
      ctx.strokeStyle = 'rgba(126,243,255,.55)'; ctx.lineWidth = 2;
      U.ellipse(ctx, 0, 6, 26, 18); ctx.stroke();
      ctx.fillStyle = 'rgba(0,0,0,.32)';
      U.ellipse(ctx, 2, 8, 23, 15); ctx.fill();
      ctx.scale(1.28, 1.28);

      // --- chân (theo hướng di chuyển)
      const sp = Math.hypot(p.vx, p.vy);
      const stride = sp > 25 ? Math.sin(p.walk) * Math.min(9, 3 + sp / 45) : 0;
      ctx.save(); ctx.rotate(p.moveAng);
      ctx.fillStyle = '#1a2226';
      U.rr(ctx, -6 + stride, -10, 14, 7, 3); ctx.fill();
      U.rr(ctx, -6 - stride, 3, 14, 7, 3); ctx.fill();
      ctx.fillStyle = '#f2a33a';
      ctx.fillRect(5 + stride, -9, 2, 5); ctx.fillRect(5 - stride, 4, 2, 5);
      ctx.restore();

      // --- thân (theo hướng ngắm)
      ctx.rotate(p.aim);
      if (p.dash) ctx.scale(0.86, 1.12);
      const breathe = Math.sin(t * 3) * 0.5;
      const hurt = p.hurtT > 0;
      const w = MB.Weapons.current(p);
      const s = MB.Weapons.DEFS[w.id];
      const reloadK = w.reloading > 0 ? 1 - w.reloading / (s.reload * (1 - 0.12 * p.mods.mag)) : 0;

      // bình lọc sinh học
      ctx.fillStyle = '#1f2f34'; U.rr(ctx, -23, -9, 11, 18, 4); ctx.fill();
      const glow = 0.6 + Math.sin(t * 4) * 0.25;
      ctx.fillStyle = `rgba(125,255,155,${glow})`; U.rr(ctx, -21, -6, 5, 12, 2); ctx.fill();
      ctx.fillStyle = '#9aa9ad'; ctx.fillRect(-15, -2, 4, 4);

      // thân giáp (viền tối để nổi trên nền)
      ctx.fillStyle = hurt ? '#b84b4b' : '#3a5f66';
      ctx.strokeStyle = '#0c1416'; ctx.lineWidth = 2;
      U.rr(ctx, -13, -14 - breathe * 0.3, 23, 28 + breathe * 0.6, 9); ctx.fill(); ctx.stroke();
      ctx.fillStyle = hurt ? '#d06a6a' : '#3f6870';
      U.rr(ctx, -8, -10, 14, 20, 5); ctx.fill();
      ctx.fillStyle = '#f2a33a'; ctx.fillRect(-2, -10, 3, 20);
      // vai giáp
      ctx.fillStyle = '#4f7f87';
      U.circle(ctx, -2, -13, 6.5); ctx.fill();
      U.circle(ctx, -2, 13, 6.5); ctx.fill();
      ctx.fillStyle = '#f2a33a';
      ctx.fillRect(-5, -15, 6, 2); ctx.fillRect(-5, 13, 6, 2);

      // tay
      ctx.strokeStyle = '#263a3f'; ctx.lineWidth = 6; ctx.lineCap = 'round';
      const rk = p.recoil * 0.6;
      ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(13 - rk, -4); ctx.moveTo(0, 12); ctx.lineTo(19 - rk, 2); ctx.stroke();

      MB.Weapons.drawGun(ctx, w.id, p.recoil, reloadK);

      ctx.fillStyle = '#151c1f';
      U.circle(ctx, 13 - rk, -4, 3.4); ctx.fill();
      U.circle(ctx, 19 - rk, 2, 3.4); ctx.fill();

      // mũ + kính visor
      ctx.fillStyle = '#2a4247'; ctx.strokeStyle = '#0c1416'; ctx.lineWidth = 1.6;
      U.circle(ctx, 0, 0, 9); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#5b8790'; U.circle(ctx, -1.5, -1.5, 6); ctx.fill();
      ctx.shadowColor = '#7ef3ff'; ctx.shadowBlur = 10;
      ctx.fillStyle = '#86f6ff';
      ctx.beginPath(); ctx.ellipse(4.5, 0, 3.6, 6.4, 0, -Math.PI / 2, Math.PI / 2); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(5.5, -4, 1.4, 3);
      ctx.strokeStyle = '#f2a33a'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(1, 0); ctx.stroke();

      // chớp nòng
      if (p.muzzle > 0) {
        const tip = s.tip - p.recoil;
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = 'rgba(255,220,120,.9)';
        ctx.beginPath(); ctx.moveTo(tip, -5); ctx.lineTo(tip + 16 + Math.random() * 8, 0); ctx.lineTo(tip, 5); ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,220,.95)'; U.circle(ctx, tip + 2, 0, 4); ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
      }
      ctx.restore();
    },

    drawDead(ctx, p) {
      ctx.save(); ctx.translate(p.x, p.y);
      const k = Math.min(1, p.deadT * 2);
      ctx.rotate(p.aim + k * 1.4);
      ctx.globalAlpha = 1 - Math.min(0.5, p.deadT * 0.3);
      ctx.fillStyle = '#2e4a50'; U.rr(ctx, -13, -14, 24, 28, 9); ctx.fill();
      ctx.fillStyle = '#35535a'; U.circle(ctx, 0, 0, 9); ctx.fill();
      ctx.fillStyle = '#86f6ff'; ctx.globalAlpha *= 0.4; U.circle(ctx, 4, 0, 4); ctx.fill();
      ctx.restore();
    },

    // laser ngắm (hữu ích khi chơi cảm ứng / tay cầm)
    drawAimLine(ctx, p, G) {
      if (p.dead) return;
      const len = 280;
      const hit = MB.Col.raycast(G.obstacles, p.x, p.y, p.x + Math.cos(p.aim) * len, p.y + Math.sin(p.aim) * len, (o) => !o.noShot);
      const L = hit ? len * hit.t : len;
      ctx.save();
      ctx.strokeStyle = 'rgba(126,243,255,.35)'; ctx.lineWidth = 1.5; ctx.setLineDash([6, 8]);
      ctx.beginPath();
      ctx.moveTo(p.x + Math.cos(p.aim) * 30, p.y + Math.sin(p.aim) * 30);
      ctx.lineTo(p.x + Math.cos(p.aim) * L, p.y + Math.sin(p.aim) * L);
      ctx.stroke(); ctx.restore();
    },
  };
  void Hero;
})(window.MB);
