/* Monster Breakout — đồng đội máy (v6.9): DIAN (Dũng), đặc công, học trò cũ của GS Ted.
   Gate bật đồng đội bằng `ally` trong định nghĩa: { enter: 'start' } hoặc { enter: { wave, delay, x, y, overwatch } }
   (xuất hiện giữa trận từ một vị trí bắn tỉa rồi chạy tới nhập nhóm).
   - Bám theo Hunter ở phía sau-bên cạnh, tự đi vòng vật cản, tụt quá xa thì đu dây/đổi chỗ tới gần.
   - Súng bắn tỉa: ưu tiên quái đang áp sát Hunter, quái tinh nhuệ, quả tim của boss; có tia ngắm laser xanh trước khi bắn.
   - Bộc phá: ném vào đám quái đông (không gây sát thương cho Hunter).
   - Có máu riêng; gục thì Hunter đứng gần để kéo dậy (hoặc tự băng bó sau 35 giây).
   - Đánh dấu quái trong sương (e.markT) để Gate có sương mù vẽ viền. */
'use strict';
(function (MB) {
  const U = MB.U, Col = MB.Col;
  const CFG = { maxHp: 340, speed: 240, r: 15, cd: 1.1, cdOver: 0.55, dmg: 150, bossDmg: 95, range: 700, reviveT: 2.4, selfRevive: 35, take: 0.55 };
  const LINES = {
    kill: ['Hạ một.', 'Gọn.', 'Bên trái cậu, xử rồi.', 'Đừng quay lại, sau lưng cậu sạch rồi.', 'Mục tiêu tinh nhuệ — đã hạ.', 'Cứ tiến, tôi yểm trợ.'],
    down: ['Tôi trúng đạn! Hào Tình — kéo tôi dậy!', 'Chân tôi… không đứng được. Lại đây!'],
    up: ['Cảm ơn. Nợ cậu một lần.', 'Ổn rồi. Tiếp tục.'],
    self: ['Tự băng xong rồi. Tôi quay lại đây.'],
    low: ['Lùi lại! Tôi che cho cậu.', 'Máu cậu thấp quá — rút về phía tôi!'],
    heart: ['Thấy quả tim đó không? Tôi ghim nó, cậu dồn đạn!', 'Tim nó lộ rồi — bắn ngay!'],
    charge: ['Ném bộc phá!', 'Nằm xuống — bộc phá!'],
    catch: ['Đợi tôi, tôi bám theo đây.'],
  };

  const Ally = MB.Ally = {
    CFG, LINES,
    init(G) {
      G.ally = null; G.allyT = 0;
      const c = G.def.ally;
      if (c && c.enter === 'start') { const q = this.spot(G, G.player, 60, 110); this.spawn(G, q.x, q.y, 'follow'); }
    },
    // tìm chỗ trống quanh một điểm (không đứng trong nhà / dưới nước)
    spot(G, c, d0, d1) {
      for (let i = 0; i < 30; i++) {
        const an = U.rnd(0, U.TAU), d = U.rnd(d0, d1), x = c.x + Math.cos(an) * d, y = c.y + Math.sin(an) * d;
        if (x > 40 && y > 40 && x < G.world.w - 40 && y < G.world.h - 40 && this.free(G, x, y, CFG.r + 8) && G.los(c.x, c.y, x, y)) return { x, y };
      }
      return { x: c.x, y: c.y };
    },
    spawn(G, x, y, mode, ow) {
      const a = G.ally = {
        kind: 'dian', name: 'DIAN', x, y, vx: 0, vy: 0, r: CFG.r, hp: CFG.maxHp, maxHp: CFG.maxHp,
        aim: Math.atan2(G.player.y - y, G.player.x - x), moveAng: 0, walk: 0, t: 0, side: Math.random() < 0.5 ? 1 : -1, sideT: 8,
        mode: mode || 'follow', owT: ow || 0, fireT: 0.8, tgt: null, tgtT: 0, sightT: 0, muzzle: 0, recoil: 0, hurtT: 0,
        down: false, downT: 0, revK: 0, lineCd: 6, chargeT: 10, lowTold: false, heartTold: false, arrivedT: 0,
      };
      for (const p of [0, 1, 2]) G.burst(x + U.rnd(-10, 10), y + U.rnd(-10, 10), '#9dff8a', 8, 120);
      return a;
    },
    say(G, key, force) {
      const a = G.ally; if (!a || (!force && a.lineCd > 0) || G.mode === 'survival') return;
      a.lineCd = U.rnd(14, 22);
      const ls = (G.def.allyLines && G.def.allyLines[key]) || LINES[key];
      if (ls) MB.Story.say('DIAN', U.pick(ls), 2.6);
    },
    hurt(G, dmg) {
      const a = G.ally; if (!a || a.down || G.state === 'won') return;
      a.hp -= dmg * CFG.take; a.hurtT = 0.18;
      if (a.hp <= 0) {
        a.hp = 0; a.down = true; a.downT = 0; a.revK = 0; a.vx = a.vy = 0; a.tgt = null; a.sightT = 0;
        G.burst(a.x, a.y, '#ff6b6b', 20, 160); MB.Audio.play('hurt');
        this.say(G, 'down', true);
        MB.HUD.toast('<b>DIAN BỊ HẠ</b> · đứng gần anh ấy để kéo dậy', '#9dff8a');
      }
    },
    revive(G, k, key) {
      const a = G.ally; if (!a) return;
      a.down = false; a.hp = a.maxHp * k; a.revK = 0; a.downT = 0;
      G.burst(a.x, a.y, '#9dff8a', 24, 160); MB.Audio.play('heal');
      this.say(G, key, true);
    },
    free(G, x, y, r) { return !G.obstacles.some((o) => !o.dead && !o.noMove && Col.overlap(o, x, y, r)); },

    update(G, dt) {
      const c = G.def.ally;
      if (!c) return;
      if (!G.ally) {
        // xuất hiện giữa trận từ vị trí bắn tỉa
        const en = c.enter;
        let ready = false;
        if (G.mode === 'survival') ready = G.waveIdx >= 0;
        else if (en && typeof en === 'object') ready = (G.state === 'fight' && G.waveIdx + 1 >= en.wave) || G.waveIdx + 1 > en.wave;
        if (ready) {
          G.allyT += dt;
          const surv = G.mode === 'survival';
          if (surv || G.allyT >= (en.delay || 0)) {
            const q = !surv && en.x != null ? { x: en.x, y: en.y } : this.spot(G, G.player, surv ? 60 : 230, surv ? 110 : 330);
            const a = this.spawn(G, q.x, q.y, surv ? 'follow' : 'overwatch', en.overwatch || 6);
            a.arrived = true;
          }
        }
        return;
      }
      const a = G.ally, p = G.player;
      a.t += dt; a.arrivedT += dt; a.lineCd -= dt; a.muzzle -= dt; a.hurtT -= dt; a.recoil *= Math.exp(-12 * dt);
      if (p.dead) { MB.Enemies.stop(a, dt, 8); return; }
      if (G.retryRevive) { G.retryRevive = false; if (a.down) this.revive(G, 1, 'up'); a.hp = a.maxHp; }

      /* ---- gục: chờ Hunter kéo dậy ---- */
      if (a.down) {
        a.downT += dt;
        const near = U.dist(a.x, a.y, p.x, p.y) < 80;
        a.revK = near ? a.revK + dt / CFG.reviveT : Math.max(0, a.revK - dt * 0.3);
        if (a.revK >= 1) this.revive(G, 0.6, 'up');
        else if (a.downT >= CFG.selfRevive) this.revive(G, 0.35, 'self');
        return;
      }

      /* ---- nhận sát thương: quái chạm vào, đạn quái ---- */
      for (const e of G.enemies) {
        if (e.allyCd > 0) e.allyCd -= dt;
        if (e.dead || e.hidden || e.airborne || e.spawnT > 0 || e.def.noContact) continue;
        if ((e.allyCd || 0) <= 0 && U.dist(e.x, e.y, a.x, a.y) < e.r + a.r - 2) { this.hurt(G, e.dmg); e.allyCd = 0.9; }
      }
      const eb = G.ebullets;
      for (let i = eb.length - 1; i >= 0; i--) {
        const b = eb[i];
        if (U.dist(b.x, b.y, a.x, a.y) < a.r + b.r - 2) {
          this.hurt(G, b.dmg);
          if (!b.pass) { eb.splice(i, 1); if (b.onEnd) b.onEnd(G, b); }
          if (a.down) return;
        }
      }

      /* ---- di chuyển ---- */
      const dp = U.dist(a.x, a.y, p.x, p.y);
      if (a.mode === 'overwatch') {
        a.owT -= dt; MB.Enemies.stop(a, dt, 10);
        if (a.owT <= 0) a.mode = 'follow';
      } else {
        if (G.state === 'won') { MB.Enemies.stop(a, dt, 6); }
        else {
          // tụt quá xa (ngoài màn hình) → đổi chỗ tới gần Hunter
          if (dp > 950 && !G.inView(a.x, a.y, 30)) {
            for (let i = 0; i < 14; i++) {
              const an = p.aim + Math.PI + U.rnd(-1.4, 1.4), d = U.rnd(110, 200), x = p.x + Math.cos(an) * d, y = p.y + Math.sin(an) * d;
              if (x > 40 && y > 40 && x < G.world.w - 40 && y < G.world.h - 40 && this.free(G, x, y, a.r + 6)) { a.x = x; a.y = y; a.vx = a.vy = 0; G.burst(x, y, '#9dff8a', 12, 120); break; }
            }
          }
          a.sideT -= dt; if (a.sideT <= 0) { a.sideT = U.rnd(7, 12); a.side = -a.side; }
          let tx = p.x + Math.cos(p.aim + Math.PI * 0.72 * a.side) * 125, ty = p.y + Math.sin(p.aim + Math.PI * 0.72 * a.side) * 125;
          // né quái áp sát
          let th = null, td = 120;
          for (const e of G.enemies) { if (e.dead || e.hidden || e.boss) continue; const d = U.dist(e.x, e.y, a.x, a.y); if (d < td) { td = d; th = e; } }
          if (th) { const an = Math.atan2(a.y - th.y, a.x - th.x); tx = a.x + Math.cos(an) * 120 + (p.x - a.x) * 0.3; ty = a.y + Math.sin(an) * 120 + (p.y - a.y) * 0.3; }
          const dd = U.dist(a.x, a.y, tx, ty);
          if (dd > 34) {
            if (!G.los(a.x, a.y, tx, ty) && dp > 90) { const st = G.navStep(a); if (st) { tx = st.x; ty = st.y; } }
            const sp = CFG.speed * (dp > 380 ? 1.4 : 1) * (th ? 1.15 : 1);
            const an = Math.atan2(ty - a.y, tx - a.x), k = 1 - Math.exp(-9 * dt);
            a.vx += (Math.cos(an) * sp - a.vx) * k; a.vy += (Math.sin(an) * sp - a.vy) * k;
          } else MB.Enemies.stop(a, dt, 9);
        }
      }
      a.x += a.vx * dt; a.y += a.vy * dt;
      G.collide(a);
      const spd = Math.hypot(a.vx, a.vy);
      if (spd > 20) { a.moveAng = Math.atan2(a.vy, a.vx); a.walk += spd * dt * 0.055; }

      /* ---- chọn mục tiêu ---- */
      a.tgtT -= dt;
      if (a.tgtT <= 0 || (a.tgt && (a.tgt.dead || a.tgt.hidden))) { a.tgtT = 0.25; a.tgt = this.pick(G, a); }
      const tg = a.tgt;
      if (tg) {
        tg.markT = 1.5;
        let ax = tg.x, ay = tg.y;
        if (tg.boss && tg.weak && MB.Boss.weakPos) { const w = MB.Boss.weakPos(tg); ax = w.x; ay = w.y; if (!a.heartTold) { a.heartTold = true; this.say(G, 'heart', true); } }
        const want = Math.atan2(ay - a.y, ax - a.x);
        a.aim += U.clamp(U.angDiff(a.aim, want), -11 * dt, 11 * dt);
        a.fireT -= dt;
        a.sightT = a.fireT < 0.35 ? 1 - Math.max(0, a.fireT) / 0.35 : 0;
        if (a.fireT <= 0 && Math.abs(U.angDiff(a.aim, want)) < 0.1 && G.state !== 'won') this.fire(G, a, tg);
      } else {
        a.sightT = 0; a.fireT = Math.max(a.fireT - dt, 0.2);
        const want = spd > 20 ? a.moveAng : p.aim;
        a.aim += U.clamp(U.angDiff(a.aim, want), -6 * dt, 6 * dt);
      }

      /* ---- bộc phá vào đám đông ---- */
      a.chargeT -= dt;
      if (a.chargeT <= 0 && G.state !== 'won') {
        a.chargeT = 2;
        let best = null, bn = 3;
        for (const e of G.enemies) {
          if (e.dead || e.hidden || e.boss || U.dist(e.x, e.y, a.x, a.y) > 520) continue;
          let n = 0; for (const o of G.enemies) if (!o.dead && !o.hidden && U.dist(o.x, o.y, e.x, e.y) < 120) n++;
          if (n > bn && U.dist(e.x, e.y, p.x, p.y) > 110) { bn = n; best = e; }
        }
        if (best) { a.chargeT = U.rnd(14, 18); this.charge(G, a, best.x, best.y); }
      }

      /* ---- thoại ---- */
      if (!a.lowTold && p.hp < p.maxHp * 0.3) { a.lowTold = true; this.say(G, 'low', true); }
      if (p.hp > p.maxHp * 0.6) a.lowTold = false;
    },
    pick(G, a) {
      const p = G.player;
      let best = null, bs = 1e9;
      for (const e of G.enemies) {
        if (e.dead || e.spawnT > 0 || e.hidden || e.invuln) continue;
        const d = U.dist(e.x, e.y, a.x, a.y);
        if (d > CFG.range) continue;
        let sc = d;
        const dp = U.dist(e.x, e.y, p.x, p.y);
        if (dp < 230) sc -= (230 - dp) * 2.2;   // đang áp sát Hunter
        if (e.elite) sc -= 160;
        if (e.boss) sc += e.weak ? -260 : 120;  // quả tim lộ ra → ưu tiên nhất
        if (e === a.tgt) sc -= 60;
        if (sc < bs && G.los(a.x, a.y, e.x, e.y)) { bs = sc; best = e; }
      }
      return best;
    },
    fire(G, a, tg) {
      a.fireT = a.mode === 'overwatch' ? CFG.cdOver : CFG.cd * U.rnd(0.9, 1.1);
      a.muzzle = 0.07; a.recoil = 6; a.sightT = 0;
      const sx = a.x + Math.cos(a.aim) * 26, sy = a.y + Math.sin(a.aim) * 26, sp = 2600;
      const boss = tg.boss;
      G.bullets.push({ x: sx, y: sy, px: sx, py: sy, vx: Math.cos(a.aim) * sp, vy: Math.sin(a.aim) * sp, life: 0.36, dmg: boss ? CFG.bossDmg : CFG.dmg, pierce: 1, hits: [], r: 3.4,
        color: '#b8ff7a', knock: 220, max0: 0.36, ally: true, noFalloff: true });
      MB.Audio.play('shot_sniper');
      G.particle({ x: sx, y: sy, vx: 0, vy: 0, life: 0.08, color: '#eaffc8', r: 5 });
    },
    charge(G, a, x, y) {
      this.say(G, 'charge');
      MB.Audio.play('throw');
      G.addFx({ layer: 'ground', life: 0.9,
        draw(ctx, fx) { const k = fx.t / fx.life; ctx.fillStyle = 'rgba(150,255,110,.1)'; U.circle(ctx, x, y, 125); ctx.fill(); ctx.strokeStyle = 'rgba(170,255,120,.8)'; ctx.lineWidth = 2; U.circle(ctx, x, y, 125); ctx.stroke(); ctx.fillStyle = 'rgba(170,255,120,.25)'; U.circle(ctx, x, y, 125 * k); ctx.fill(); },
        end: (GG) => GG.explosion(x, y, 125, 150, { obstacles: false, knock: 420, color: '#d8ff9a', ring: '170,255,120', small: true }) });
    },

    /* ---------- vẽ 2D ---------- */
    draw(ctx, G) {
      const a = G.ally; if (!a) return;
      const t = G.time;
      // tia ngắm laser xanh trước khi bắn
      if (a.sightT > 0 && !a.down) {
        ctx.strokeStyle = `rgba(150,255,110,${0.25 + a.sightT * 0.55})`; ctx.lineWidth = 1.2 + a.sightT;
        ctx.beginPath(); ctx.moveTo(a.x + Math.cos(a.aim) * 24, a.y + Math.sin(a.aim) * 24); ctx.lineTo(a.x + Math.cos(a.aim) * CFG.range, a.y + Math.sin(a.aim) * CFG.range); ctx.stroke();
      }
      ctx.save(); ctx.translate(a.x, a.y);
      ctx.strokeStyle = 'rgba(157,255,138,.6)'; ctx.lineWidth = 2; U.ellipse(ctx, 0, 6, 24, 16); ctx.stroke();
      ctx.fillStyle = 'rgba(0,0,0,.3)'; U.ellipse(ctx, 2, 8, 21, 14); ctx.fill();
      if (a.down) {
        // nằm gục + vòng kéo dậy
        ctx.rotate(0.4);
        ctx.fillStyle = '#3e4a2c'; U.rr(ctx, -20, -8, 34, 16, 7); ctx.fill();
        ctx.fillStyle = '#4a5a32'; U.circle(ctx, 18, 0, 10); ctx.fill(); ctx.fillStyle = '#5c6e3c'; U.circle(ctx, 18, 0, 6.5); ctx.fill();
        ctx.restore();
        const pul = 0.5 + Math.sin(t * 6) * 0.5;
        ctx.strokeStyle = `rgba(157,255,138,${0.35 + pul * 0.4})`; ctx.lineWidth = 3; U.circle(ctx, a.x, a.y, 80); ctx.stroke();
        if (a.revK > 0) { ctx.strokeStyle = '#9dff8a'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(a.x, a.y, 34, -Math.PI / 2, -Math.PI / 2 + U.TAU * a.revK); ctx.stroke(); }
        return;
      }
      ctx.scale(1.22, 1.22);
      const sp = Math.hypot(a.vx, a.vy), stride = sp > 25 ? Math.sin(a.walk) * 7 : 0;
      ctx.save(); ctx.rotate(a.moveAng);
      ctx.fillStyle = '#353b28'; U.rr(ctx, -6 + stride, -10, 14, 7, 3); ctx.fill(); U.rr(ctx, -6 - stride, 3, 14, 7, 3); ctx.fill();
      ctx.fillStyle = '#20180f'; U.rr(ctx, 4 + stride, -10, 5, 7, 2.5); ctx.fill(); U.rr(ctx, 4 - stride, 3, 5, 7, 2.5); ctx.fill();
      ctx.restore();
      ctx.rotate(a.aim);
      const hurt = a.hurtT > 0, rk = a.recoil * 0.5;
      // ba lô nhỏ + cuộn dây đu
      ctx.fillStyle = '#3a4228'; U.rr(ctx, -21, -8, 9, 16, 3); ctx.fill();
      ctx.strokeStyle = '#8a7a52'; ctx.lineWidth = 2; U.circle(ctx, -17, 0, 4); ctx.stroke();
      // áo rằn ri xanh ô liu
      ctx.fillStyle = hurt ? '#7a3434' : '#46532f'; ctx.strokeStyle = '#141a0c'; ctx.lineWidth = 2;
      U.rr(ctx, -12, -13, 21, 26, 8); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(30,40,18,.6)'; for (const [x, y, r] of [[-6, -6, 3], [2, 5, 3.5], [-3, 7, 2.5], [4, -8, 2.5]]) { U.circle(ctx, x, y, r); ctx.fill(); }
      // khăn rằn quanh cổ
      ctx.fillStyle = '#e8e2d0'; U.rr(ctx, -4, -9, 7, 18, 3); ctx.fill();
      ctx.fillStyle = '#1a1a1a'; for (let i = 0; i < 4; i++) ctx.fillRect(-4, -8 + i * 4.4, 7, 1.6);
      // tay + súng bắn tỉa dài có ống ngắm
      ctx.lineCap = 'round'; ctx.strokeStyle = '#46532f'; ctx.lineWidth = 5.5;
      ctx.beginPath(); ctx.moveTo(0, -11); ctx.lineTo(8 - rk, -5); ctx.moveTo(0, 11); ctx.lineTo(14 - rk, 3); ctx.stroke();
      ctx.fillStyle = '#1c1f1a'; ctx.fillRect(4 - rk, -2.5, 40, 5); ctx.fillRect(40 - rk, -1.5, 16, 3);
      ctx.fillStyle = '#5a4630'; ctx.fillRect(-2 - rk, -3, 10, 6);
      ctx.fillStyle = '#2a2e26'; ctx.fillRect(14 - rk, -5.5, 14, 3.4);
      ctx.fillStyle = '#9dff8a'; ctx.fillRect(27 - rk, -5, 1.6, 2.4);
      if (a.muzzle > 0) { ctx.fillStyle = '#eaffc8'; U.circle(ctx, 58 - rk, 0, 6); ctx.fill(); }
      // mũ tai bèo xanh (vành rộng)
      ctx.fillStyle = '#3e4a2c'; U.circle(ctx, -1, 0, 11.5); ctx.fill();
      ctx.strokeStyle = '#2a3320'; ctx.lineWidth = 1.2; U.circle(ctx, -1, 0, 11.5); ctx.stroke();
      ctx.fillStyle = '#56653a'; U.circle(ctx, -1, 0, 6.8); ctx.fill();
      ctx.strokeStyle = 'rgba(20,26,12,.6)'; U.circle(ctx, -1, 0, 7); ctx.stroke();
      ctx.restore();
    },
    // thanh máu + tên (toạ độ màn hình, cả 2D và 3D); project(x, h, y) → {x, y}
    drawHud(ctx, G, project) {
      const a = G.ally; if (!a) return;
      const s = project(a.x, 92, a.y); if (!s || !Number.isFinite(s.x + s.y)) return;
      ctx.save();
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '800 10px system-ui,sans-serif';
      if (a.down) {
        ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillText('CỨU DIAN', s.x + 1, s.y - 5); ctx.fillStyle = '#9dff8a'; ctx.fillText('CỨU DIAN', s.x, s.y - 6);
        ctx.restore(); return;
      }
      ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillText('DIAN', s.x + 1, s.y - 9); ctx.fillStyle = '#b8ff9a'; ctx.fillText('DIAN', s.x, s.y - 10);
      G.drawHpBar(ctx, s.x, s.y, 40, a.hp / a.maxHp, '#9dff8a');
      ctx.restore();
    },
  };
})(window.MB);
