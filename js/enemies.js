/* Monster Breakout — quái vật dùng chung: Zombie, Spider, Licker
   Gate riêng có thể đăng ký thêm quái/boss bằng MB.Enemies.register() trong file gate. */
'use strict';
(function (MB) {
  const U = MB.U;

  const E = MB.Enemies = {
    types: {},
    register(key, def) { this.types[key] = def; },

    // Lái hướng: đuổi mục tiêu + né vật cản + dao động (zigzag)
    steer(e, G, tx, ty, spd, dt, wig) {
      // không thấy đường thẳng tới người chơi → đi theo bản đồ dẫn đường
      if (!e.fly && !e.burrow && G.nav) {
        const p = G.player;
        if (U.dist(tx, ty, p.x, p.y) < 320) {
          e.losT = (e.losT || 0) - dt;
          if (e.losT <= 0) { e.losT = 0.3; e.blocked = !!MB.Col.raycast(G.obstacles, e.x, e.y, p.x, p.y, (o) => !o.noMove && U.dist(o.x, o.y, e.x, e.y) > 0); }
          if (e.blocked) { const st = G.navStep(e); if (st) { tx = st.x; ty = st.y; wig = null; } }
        }
      }
      let dx = tx - e.x, dy = ty - e.y;
      const d = Math.hypot(dx, dy) || 1;
      dx /= d; dy /= d;
      if (wig) {
        const a = Math.sin(G.time * wig.f + e.t) * wig.a;
        const c = Math.cos(a), s = Math.sin(a);
        const nx = dx * c - dy * s; dy = dx * s + dy * c; dx = nx;
      }
      if (!e.side) e.side = Math.random() < 0.5 ? 1 : -1;
      if (!e.fly) {
        // bị kẹt quá lâu → đi vòng theo một phía cố định
        if (e.unstick > 0) {
          e.unstick -= dt;
          const c = Math.cos(1.25 * e.side), s = Math.sin(1.25 * e.side);
          const nx = dx * c - dy * s; dy = dx * s + dy * c; dx = nx;
        }
        for (const o of G.obstacles) {
          if (o.dead || o.noMove) continue;
          const ox = o.x - e.x, oy = o.y - e.y;
          const R = o.br + e.r + 34;
          const od2 = ox * ox + oy * oy;
          if (od2 > R * R) continue;
          const od = Math.sqrt(od2) || 1;
          const ahead = (ox * dx + oy * dy) / od;
          if (ahead < 0.05) continue;
          const sinA = (-oy * dx + ox * dy) / od;
          const side = Math.abs(sinA) < 0.3 ? e.side : (sinA >= 0 ? 1 : -1); // đâm thẳng → dùng phía ưu tiên, tránh rung lắc
          const tx2 = -oy / od * side, ty2 = ox / od * side;
          const w = (1 - od / R) * 3.2 * ahead + 0.25;
          dx += tx2 * w; dy += ty2 * w;
        }
        // phát hiện kẹt
        const moved = Math.hypot(e.x - (e.lx == null ? e.x : e.lx), e.y - (e.ly == null ? e.y : e.ly));
        e.lx = e.x; e.ly = e.y;
        if (moved < spd * dt * 0.25) { e.stuckT = (e.stuckT || 0) + dt; if (e.stuckT > 0.6) { e.stuckT = 0; e.unstick = 0.9; e.side = -e.side; } }
        else e.stuckT = 0;
      }
      const l = Math.hypot(dx, dy) || 1;
      dx /= l; dy /= l;
      const k = 1 - Math.exp(-(e.accel || 8) * dt);
      e.vx += (dx * spd - e.vx) * k;
      e.vy += (dy * spd - e.vy) * k;
      e.face = Math.atan2(e.vy, e.vx);
    },
    stop(e, dt, k) { const f = Math.exp(-(k || 10) * dt); e.vx *= f; e.vy *= f; },
    toPlayer(e, G) { const p = G.player; return Math.atan2(p.y - e.y, p.x - e.x); },
    distPlayer(e, G) { const p = G.player; return Math.hypot(p.x - e.x, p.y - e.y); },
  };

  /* ---------------- Zombie ---------------- */
  E.register('zombie', {
    name: 'Zombie', r: 19, hp: 60, speed: 62, dmg: 10, score: 100,
    init(e) { e.speed += U.rnd(-8, 12); e.lurch = U.rnd(0, 6); },
    update(e, G, dt) {
      const p = G.player;
      const surge = 1 + Math.max(0, Math.sin(G.time * 2.2 + e.lurch)) * 0.35;
      E.steer(e, G, p.x, p.y, e.speed * surge, dt);
    },
    draw(ctx, e, G) {
      ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.face || 0);
      const sw = Math.sin(G.time * 6 + e.t) * 4;
      ctx.fillStyle = '#3f5a3b';
      U.rr(ctx, -6 + sw, -10, 12, 7, 3); ctx.fill(); U.rr(ctx, -6 - sw, 3, 12, 7, 3); ctx.fill();
      ctx.fillStyle = '#5f7f58'; U.rr(ctx, -12, -13, 22, 26, 9); ctx.fill();
      ctx.fillStyle = '#4b6545'; ctx.fillRect(-9, -2, 14, 4);
      // tay vươn ra
      ctx.strokeStyle = '#8fa483'; ctx.lineWidth = 5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(2, -11); ctx.lineTo(20 + sw * 0.4, -9); ctx.moveTo(2, 11); ctx.lineTo(19 - sw * 0.4, 10); ctx.stroke();
      // đầu
      ctx.fillStyle = '#b9b190'; U.circle(ctx, 1, 0, 8.5); ctx.fill();
      ctx.fillStyle = '#7d8a5b'; U.circle(ctx, -2, -3, 3.5); ctx.fill();
      ctx.fillStyle = '#e9ff9a'; U.circle(ctx, 5, -3, 1.8); ctx.fill(); U.circle(ctx, 5, 3, 1.8); ctx.fill();
      // mụn virus
      ctx.fillStyle = `rgba(170,255,90,${0.5 + Math.sin(G.time * 4 + e.t) * 0.3})`;
      U.circle(ctx, -7, 6, 2.6); ctx.fill(); U.circle(ctx, -4, -9, 2); ctx.fill();
      ctx.restore();
    },
  });

  /* ---------------- Spider ---------------- */
  E.register('spider', {
    name: 'Spider', r: 14, hp: 34, speed: 125, dmg: 8, score: 140,
    init(e) { e.speed += U.rnd(-10, 25); e.state = 'run'; e.st = U.rnd(1, 3); },
    update(e, G, dt) {
      const p = G.player, d = E.distPlayer(e, G);
      e.st -= dt;
      if (e.state === 'run') {
        E.steer(e, G, p.x, p.y, e.speed, dt, { f: 6, a: 0.65 });
        if (d < 190 && e.st <= 0 && G.los(e.x, e.y, p.x, p.y)) { e.state = 'crouch'; e.st = 0.3; e.lock = E.toPlayer(e, G); }
      } else if (e.state === 'crouch') {
        E.stop(e, dt, 14);
        if (e.st <= 0) { e.state = 'leap'; e.st = 0.28; e.vx = Math.cos(e.lock) * 420; e.vy = Math.sin(e.lock) * 420; e.face = e.lock; }
      } else if (e.state === 'leap') {
        if (e.st <= 0) { e.state = 'run'; e.st = U.rnd(1.6, 2.8); }
      }
    },
    draw(ctx, e, G) {
      ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.face || 0);
      const crouch = e.state === 'crouch' ? 0.8 : 1;
      ctx.strokeStyle = '#6e4a38'; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
      for (let k = 0; k < 4; k++) {
        for (const side of [-1, 1]) {
          const base = (k - 1.5) * 0.45;
          const wig = Math.sin(G.time * 18 + e.t + k * 1.7 + (side > 0 ? 1.5 : 0)) * 0.25;
          const a = side * (Math.PI / 2 + base * 1.2) + wig;
          const kx = Math.cos(a) * 11 * crouch, ky = Math.sin(a) * 11 * crouch;
          ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(kx, ky);
          ctx.lineTo(kx + Math.cos(a + side * 0.6) * 9, ky + Math.sin(a + side * 0.6) * 9); ctx.stroke();
        }
      }
      ctx.fillStyle = '#7c4a37'; U.ellipse(ctx, -6, 0, 9, 7.5); ctx.fill();
      ctx.fillStyle = 'rgba(170,255,90,.75)'; U.circle(ctx, -7, 0, 2.6); ctx.fill();
      ctx.fillStyle = '#9a5c44'; U.circle(ctx, 5, 0, 6); ctx.fill();
      ctx.fillStyle = '#ffdf8c'; U.circle(ctx, 8, -2.2, 1.6); ctx.fill(); U.circle(ctx, 8, 2.2, 1.6); ctx.fill();
      ctx.restore();
    },
  });

  /* ---------------- Licker ---------------- */
  E.register('licker', {
    name: 'Licker', r: 18, hp: 85, speed: 100, dmg: 12, score: 220,
    init(e) { e.state = 'chase'; e.cd = U.rnd(1, 2); },
    update(e, G, dt) {
      const p = G.player, d = E.distPlayer(e, G);
      e.cd -= dt;
      if (e.state === 'chase') {
        E.steer(e, G, p.x, p.y, e.speed * (d > 320 ? 1.35 : 1), dt, { f: 9, a: 0.18 });
        if (d < 270 && d > 60 && e.cd <= 0 && G.los(e.x, e.y, p.x, p.y)) { e.state = 'aim'; e.st = 0.55; e.lock = E.toPlayer(e, G); }
      } else if (e.state === 'aim') {
        E.stop(e, dt, 12);
        e.lock += U.angDiff(e.lock, E.toPlayer(e, G)) * Math.min(1, dt * 3);
        e.face = e.lock; e.st -= dt;
        if (e.st <= 0) {
          G.enemyShot({ x: e.x, y: e.y, a: e.lock, speed: 560, r: 7, dmg: e.dmg, life: 0.5, kind: 'tongue', owner: e });
          MB.Audio.play('lash');
          e.state = 'chase'; e.cd = U.rnd(1.6, 2.4);
        }
      }
    },
    tele(ctx, e, G) { if (e.state === 'aim') G.drawTelegraphLine(ctx, e.x, e.y, e.lock, 270, 1 - e.st / 0.55); },
    draw(ctx, e, G) {
      ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.face || 0);
      const sw = Math.sin(G.time * 10 + e.t) * 5;
      ctx.strokeStyle = '#5a2020'; ctx.lineWidth = 4; ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-4, -8); ctx.lineTo(-14 + sw, -18); ctx.moveTo(-4, 8); ctx.lineTo(-14 - sw, 18);
      ctx.moveTo(6, -8); ctx.lineTo(16 - sw, -17); ctx.moveTo(6, 8); ctx.lineTo(16 + sw, 17);
      ctx.stroke();
      ctx.fillStyle = '#8d3434';
      ctx.beginPath(); ctx.moveTo(-17, 0); ctx.lineTo(-6, -11); ctx.lineTo(10, -9); ctx.lineTo(16, 0); ctx.lineTo(10, 9); ctx.lineTo(-6, 11); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#5e1d1d'; ctx.lineWidth = 1.5;
      for (let i = -8; i < 8; i += 4) { ctx.beginPath(); ctx.moveTo(i, -8); ctx.lineTo(i + 2, 8); ctx.stroke(); }
      // não lộ ra
      ctx.fillStyle = '#f0b3b3'; U.ellipse(ctx, 10, 0, 6, 5); ctx.fill();
      ctx.strokeStyle = '#c47878'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(6, 0); ctx.quadraticCurveTo(10, -3, 14, 0); ctx.stroke();
      if (e.state === 'aim') { ctx.fillStyle = '#ff6b6b'; ctx.fillRect(14, -1.5, 8, 3); }
      ctx.restore();
    },
  });

  /* ================= KHUÔN HÀNH VI (dùng lại cho quái ở các Gate) ================= */
  E.AI = {
    // bắn tầm xa: giữ khoảng cách, hiện vạch đỏ rồi bắn
    shooter(o) {
      return {
        update(e, G, dt) {
          const p = G.player, d = E.distPlayer(e, G);
          if (e.cd == null) e.cd = U.rnd(o.cd[0], o.cd[1]);
          e.cd -= dt;
          if (e.state !== 'aim') {
            let tx = p.x, ty = p.y;
            if (d < o.min) { const a = Math.atan2(e.y - p.y, e.x - p.x); tx = e.x + Math.cos(a) * 120; ty = e.y + Math.sin(a) * 120; }
            else if (d < o.max) { const a = Math.atan2(e.y - p.y, e.x - p.x) + 0.7 * (e.side || 1); tx = p.x + Math.cos(a) * d; ty = p.y + Math.sin(a) * d; }
            E.steer(e, G, tx, ty, e.speed, dt, o.wig);
            if (d < o.max + 80 && e.cd <= 0 && G.los(e.x, e.y, p.x, p.y)) { e.state = 'aim'; e.st = o.aim; e.lock = E.toPlayer(e, G); }
          } else {
            E.stop(e, dt, 12);
            e.lock += U.angDiff(e.lock, E.toPlayer(e, G)) * Math.min(1, dt * 3); e.face = e.lock; e.st -= dt;
            if (e.st <= 0) { o.shot(e, G, e.lock); e.state = 'move'; e.cd = U.rnd(o.cd[0], o.cd[1]); }
          }
        },
        tele(ctx, e, G) { if (e.state === 'aim' && o.line !== false) G.drawTelegraphLine(ctx, e.x, e.y, e.lock, o.lineLen || 320, 1 - e.st / o.aim); },
      };
    },
    // tự nổ: lao tới, phồng lên rồi nổ (gây sát thương cả quái khác)
    exploder(o) {
      return {
        update(e, G, dt) {
          const d = E.distPlayer(e, G);
          if (e.state !== 'fuse') {
            E.steer(e, G, G.player.x, G.player.y, e.speed, dt, o.wig);
            if (d < o.trigger) { e.state = 'fuse'; e.st = o.fuse; MB.Audio.play('spit'); }
          } else {
            E.stop(e, dt, 6); e.st -= dt; e.swell = 1 - e.st / o.fuse;
            if (e.st <= 0) E.AI.blow(e, G, o);
          }
        },
        onDeath(e, G) { if (!e.blown && o.deathBlast) E.AI.blow(e, G, o, true); if (o.onDeath) o.onDeath(e, G); },
        tele(ctx, e, G) {
          if (e.state !== 'fuse') return;
          const k = 1 - e.st / o.fuse;
          ctx.fillStyle = `rgba(255,80,60,${0.1 + k * 0.2})`; U.circle(ctx, e.x, e.y, o.r); ctx.fill();
          ctx.strokeStyle = `rgba(255,90,70,${0.5 + Math.abs(Math.sin(G.time * 20)) * 0.4})`; ctx.lineWidth = 3; U.circle(ctx, e.x, e.y, o.r); ctx.stroke();
        },
      };
    },
    blow(e, G, o, fromDeath) {
      if (e.blown) return;
      e.blown = true;
      G.explosion(e.x, e.y, o.r, o.dmgEnemies || 40, { player: fromDeath ? Math.round(o.dmg * 0.6) : o.dmg, source: e, knock: 300, color: o.color, ring: o.ring, decal: o.decal });
      if (o.pool) G.addHazard(Object.assign({ x: e.x, y: e.y }, o.pool));
      if (!e.dead) G.killEnemy(e);
    },
    // đào đất: lặn xuống (không bắn trúng được), trồi lên cắn
    burrower(o) {
      return {
        init(e) { e.state = 'under'; e.hidden = true; e.burrow = true; e.st = U.rnd(0.5, 1.5); },
        update(e, G, dt) {
          const p = G.player, d = E.distPlayer(e, G);
          e.st -= dt;
          if (e.state === 'under') {
            e.hidden = true; e.burrow = true;
            E.steer(e, G, p.x, p.y, e.speed * (o.underMul || 1.5), dt);
            if (d < (o.emerge || 90) && e.st <= 0) { e.state = 'rise'; e.st = 0.6; e.rx = e.x; e.ry = e.y; }
          } else if (e.state === 'rise') {
            E.stop(e, dt, 20); e.x = e.rx; e.y = e.ry;
            if (e.st <= 0) {
              e.state = 'up'; e.hidden = false; e.burrow = false; e.st = o.up || 2.6;
              G.burst(e.x, e.y, o.dirt || '#6b5a3a', 18, 200); G.shake(3);
              if (U.dist(e.x, e.y, p.x, p.y) < e.r + p.r + 26) G.hurtPlayer(Math.round(e.dmg * 1.4), e);
            }
          } else if (e.state === 'up') {
            E.steer(e, G, p.x, p.y, e.speed, dt);
            if (e.st <= 0) { e.state = 'under'; e.st = U.rnd(1.2, 2.2); G.burst(e.x, e.y, o.dirt || '#6b5a3a', 10, 120); }
          }
        },
        tele(ctx, e, G) {
          if (e.state === 'under') {
            const k = (G.time * 2 + e.t) % 1;
            ctx.strokeStyle = `rgba(${o.ripple || '200,230,160'},${0.6 * (1 - k)})`; ctx.lineWidth = 2;
            U.circle(ctx, e.x, e.y, 8 + k * 22); ctx.stroke();
            ctx.fillStyle = `rgba(${o.ripple || '200,230,160'},.25)`; U.ellipse(ctx, e.x, e.y, 12, 6); ctx.fill();
          } else if (e.state === 'rise') {
            ctx.fillStyle = 'rgba(255,80,60,.22)'; U.circle(ctx, e.x, e.y, e.r + 26); ctx.fill();
            ctx.strokeStyle = 'rgba(255,90,70,.8)'; ctx.lineWidth = 2; U.circle(ctx, e.x, e.y, e.r + 26); ctx.stroke();
          }
        },
      };
    },
    // dịch chuyển: mờ đi rồi hiện ra sau lưng người chơi và chém
    blinker(o) {
      return {
        update(e, G, dt) {
          const p = G.player, d = E.distPlayer(e, G);
          e.cd = (e.cd == null ? U.rnd(2, 3.5) : e.cd) - dt;
          if (e.state === 'fade') {
            E.stop(e, dt, 20); e.st -= dt; e.invuln = true; e.alpha = Math.max(0.1, e.st / 0.4);
            if (e.st <= 0) {
              for (let i = 0; i < 8; i++) {
                const a = p.aim + Math.PI + U.rnd(-0.8, 0.8), tx = p.x + Math.cos(a) * 100, ty = p.y + Math.sin(a) * 100;
                if (!G.obstacles.some((ob) => !ob.dead && !ob.noMove && MB.Col.overlap(ob, tx, ty, e.r))) { e.x = tx; e.y = ty; break; }
              }
              e.state = 'appear'; e.st = 0.35; e.invuln = false; e.alpha = 1; e.lock = E.toPlayer(e, G); e.face = e.lock;
              G.burst(e.x, e.y, o.color || '#b98cff', 14, 140); MB.Audio.play('dash');
            }
          } else if (e.state === 'appear') {
            E.stop(e, dt, 20); e.st -= dt;
            if (e.st <= 0) { e.state = 'lunge'; e.st = 0.25; e.vx = Math.cos(e.lock) * 520; e.vy = Math.sin(e.lock) * 520; }
          } else if (e.state === 'lunge') {
            e.st -= dt; if (e.st <= 0) { e.state = 'stalk'; e.cd = U.rnd(2.5, 4); }
          } else {
            e.state = 'stalk'; e.alpha = o.ghost || 1;
            E.steer(e, G, p.x, p.y, e.speed, dt, { f: 4, a: 0.4 });
            if (e.cd <= 0 && d < 520 && d > 120) { e.state = 'fade'; e.st = 0.4; }
          }
        },
        tele(ctx, e, G) { if (e.state === 'appear') G.drawTelegraphLine(ctx, e.x, e.y, e.lock, 140, 1 - e.st / 0.35); },
      };
    },
    // khiên phía trước: đạn bắn trực diện giảm sát thương mạnh
    shieldFront(mul, arc) {
      return function (e, dmg, G, ang) {
        if (ang == null || e.stunT > 0) return dmg;
        if (Math.abs(U.angDiff(e.face || 0, ang + Math.PI)) < (arc || 1)) {
          if (Math.random() < 0.15) G.text(e.x, e.y - e.r - 14, 'CHẶN', '#9fd8ff', 12);
          G.sparks(e.x + Math.cos(e.face) * e.r, e.y + Math.sin(e.face) * e.r, e.face, '#cfe8ff', 2);
          return dmg * (mul || 0.2);
        }
        return dmg * 1.25;
      };
    },
  };
  // ghép khuôn hành vi vào định nghĩa quái: E.make(base, E.AI.shooter({...}))
  E.make = (base, ai) => {
    const d = Object.assign({}, base);
    if (ai.update) d.update = ai.update;
    if (ai.tele) d.tele = ai.tele;
    if (ai.init) { const bi = base.init; d.init = (e, G) => { ai.init(e, G); if (bi) bi(e, G); }; }
    if (ai.onDeath) { const bd = base.onDeath; d.onDeath = (e, G) => { ai.onDeath(e, G); if (bd) bd(e, G); }; }
    return d;
  };
})(window.MB);
