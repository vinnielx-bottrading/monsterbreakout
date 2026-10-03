/* Monster Breakout — kho vũ khí nâng cao (v6.4)
   - Boss: điểm yếu lộ ra theo chu kỳ (×2), thanh gục choáng (choáng 4 giây, +50% sát thương), khắc hệ (×1,5)
   - Siêu chiêu: thanh nộ tích khi gây sát thương / hạ quái; chọn 1 trong 3 loại khi boss xuất hiện
   - Tiếp tế đạn hạng nặng thả xuống trong trận boss
   - Hiệu ứng súng đặc biệt: laser tia liên tục, tên lửa tự dẫn, nỏ tên nổ, súng băng, đĩa cưa nảy */
'use strict';
(function (MB) {
  const U = MB.U;

  // hệ của từng súng và điểm khắc của từng boss
  const ELEM = { flame: 'fire', cryo: 'ice', plasma: 'shock', beam: 'shock', launcher: 'blast', bolt: 'blast', hornet: 'blast' };
  const ELEM_VI = { fire: 'LỬA', ice: 'BĂNG', shock: 'ĐIỆN', blast: 'NỔ' };
  const ELEM_GUNS = { fire: 'Pyro', ice: 'Cryo', shock: 'Arc Plasma / Lumen Beam', blast: 'Boomer / Bolt X / Hornet' };
  const WEAK = {
    spiderQueen: 'fire', behemoth: 'blast', toadKing: 'fire', cryoWyrm: 'fire', magmaTitan: 'ice', kraken: 'shock',
    assembler: 'shock', abomination: 'fire', omega: 'ice', origin: 'shock', nightBlade: 'blast', lanternSerpent: 'ice',
  };
  // súng mới: nhận khi hạ boss ở Gate tương ứng, hoặc mua bằng xu (mở bán khi đã tới Gate trước đó 2 cửa)
  const GUNS = [
    { id: 'cryo', gate: 3, price: 600 },
    { id: 'bolt', gate: 5, price: 800 },
    { id: 'hornet', gate: 7, price: 1000 },
    { id: 'beam', gate: 9, price: 1200 },
    { id: 'ripper', gate: 11, price: 1400 },
  ];

  /* ===================== BOSS ===================== */
  const Boss = MB.Boss = {
    ELEM, ELEM_VI, ELEM_GUNS, WEAK, GUNS,
    gunForGate(id) { const g = GUNS.find((x) => x.gate === id); return g ? g.id : null; },
    init(G, e) {
      e.stag = 0; e.stagMax = e.maxHp * 0.13; e.stagT = 0;
      e.weak = null; e.weakCd = 4; e.weakTxtT = 0;
      G.heavyT = 12; G.superOfferT = 0.8;
    },
    update(G, e, dt) {
      if (e.stagT > 0) e.stagT = Math.max(0, e.stagT - dt);
      e.weakTxtT -= dt;
      if (e.weak) { e.weak.t -= dt; if (e.weak.t <= 0) { e.weak = null; e.weakCd = 5; } }
      else if (e.spawnT <= 0 && !e.hidden) {
        e.weakCd -= dt;
        if (e.weakCd <= 0) {
          // lộ ra hơi lệch khỏi hướng người chơi: chỉ cần bước sang ngang một chút là bắn trúng
          const p = G.player, a = Math.atan2(p.y - e.y, p.x - e.x) + (Math.random() < 0.5 ? -1 : 1) * U.rnd(0.5, 1.2);
          e.weak = { a, t: 6 };
          if (!G.weakTold) { G.weakTold = true; MB.HUD.toast('Boss lộ <b style="color:#ff6a3c">ĐIỂM YẾU</b> (vòng đỏ) · bắn trúng gây ×2 sát thương', '#ff9a5c'); }
        }
      }
    },
    weakPos(e) { return { x: e.x + Math.cos(e.weak.a) * e.r * 0.8, y: e.y + Math.sin(e.weak.a) * e.r * 0.8 }; },
    // nhân hệ số sát thương lên boss + tích thanh gục choáng
    hit(G, e, dmg, src) {
      src = src || {};
      let k = 1;
      const el = src.wid && ELEM[src.wid];
      if (el && WEAK[e.type] === el) {
        k *= 1.5;
        if (!G.elemTold) { G.elemTold = true; G.text(e.x, e.y - e.r - 26, `KHẮC CHẾ ${ELEM_VI[el]} ×1,5`, '#9dff8a', 15); }
      }
      if (e.weak && src.fx != null && !src.sup) {
        const d = Math.hypot(src.fx - e.x, src.fy - e.y) || 1;
        const ix = e.x + (src.fx - e.x) / d * e.r, iy = e.y + (src.fy - e.y) / d * e.r;
        const w = this.weakPos(e);
        if (U.dist(ix, iy, w.x, w.y) < e.r * 0.65 + 10) {
          k *= 2;
          if (e.weakTxtT <= 0) { e.weakTxtT = 0.35; G.text(w.x, w.y - 16, 'ĐIỂM YẾU ×2', '#ff7a3c', 14); }
          MB.Audio.play('weakhit');
        }
      }
      if (e.stagT > 0) k *= 1.5;
      if (G.player.apT > 0 && !src.sup) k *= 1.4;
      dmg *= Math.min(k, 4);
      if (e.stagT <= 0 && !e.hidden && !e.airborne) {
        e.stag += dmg;
        if (e.stag >= e.stagMax) this.stagger(G, e);
      }
      return dmg;
    },
    stagger(G, e) {
      e.stag = 0; e.stagMax *= 1.2; e.stagT = 4; e.stunT = Math.max(e.stunT || 0, 4);
      G.hitstop = Math.max(G.hitstop, 0.12); G.shake(12); MB.haptic([30, 20, 50]);
      G.banner('BOSS GỤC CHOÁNG!', 'Dồn hoả lực · +50% sát thương trong 4 giây', 1.8);
      MB.Audio.play('stagger');
      G.burst(e.x, e.y, '#ffd56a', 30, 260);
    },
    tip(e) {
      const w = WEAK[e.type];
      const s = e.stagT > 0 ? 'ĐANG GỤC CHOÁNG · +50%' : w ? `KHẮC CHẾ: SÚNG ${ELEM_VI[w]}` : '';
      return s;
    },
  };

  /* ===================== SIÊU CHIÊU ===================== */
  const TYPES = {
    orbital: { name: 'Pháo kích vệ tinh', icon: '☄', desc: '5 cột pháo từ vệ tinh dội xuống boss và quái quanh đó (mỗi phát ~3% máu boss)' },
    laser: { name: 'Laser quét', icon: '⚡', desc: 'Tia laser cực mạnh 3 giây theo hướng ngắm, xuyên mọi quái (~12% máu boss)' },
    drone: { name: 'Drone tự bắn', icon: '✈', desc: 'Drone bay quanh Hunter, tự khoá và bắn 10 giây (~12% máu boss)' },
  };
  const Super = MB.Super = {
    TYPES,
    gain(G, n) { const p = G.player; if (!p || p.dead) return; p.rage = Math.min(100, (p.rage || 0) + n); },
    onDamage(G, e, dmg, src) { if (src && src.sup) return; this.gain(G, Math.min(6, dmg * 0.018) * (e.boss ? 1.2 : 1)); },
    onKill(G, e) { if (!e.boss) this.gain(G, e.elite ? 6 : 1.5); },
    ready(G) { const p = G.player; return !!p.superType && (p.rage || 0) >= 100 && !G.sup; },

    use(G) {
      const p = G.player;
      if (!p.superType) { MB.HUD.toast('Siêu chiêu được chọn khi boss xuất hiện', '#ffd56a'); MB.Audio.play('empty'); return; }
      if ((p.rage || 0) < 100 || G.sup) { MB.Audio.play('empty'); return; }
      p.rage = 0;
      const T = TYPES[p.superType];
      G.banner('SIÊU CHIÊU', T.name.toUpperCase(), 1.2);
      MB.haptic([40, 30, 60]); G.shake(8);
      if (p.superType === 'orbital') { G.sup = { type: 'orbital', t: 0, dur: 2.6, n: 0, next: 0 }; MB.Audio.play('super_orbital'); }
      else if (p.superType === 'laser') { G.sup = { type: 'laser', t: 0, dur: 3, tick: 0 }; MB.Audio.play('super_laser'); p.iframes = Math.max(p.iframes, 0.6); }
      else { G.sup = { type: 'drone', t: 0, dur: 10, cd: 0.3, a: 0, x: p.x, y: p.y }; MB.Audio.play('drone'); }
    },

    update(G, dt) {
      const p = G.player, I = MB.Input;
      if (I.take('super') && !p.dead && !G.over) this.use(G);
      if (p.apT > 0) p.apT -= dt;
      if (p.beam) { p.beam.t -= dt; if (p.beam.t <= 0) p.beam = null; }
      for (let i = G.sfx.length - 1; i >= 0; i--) { const f = G.sfx[i]; f.t += dt; if (f.t >= f.life) G.sfx.splice(i, 1); }
      const boss = G.boss && !G.boss.dead ? G.boss : null;
      if (boss) Boss.update(G, boss, dt);
      // tiếng gầm gừ của quái ở gần (không khí rùng rợn)
      G.growlT = (G.growlT == null ? 3 : G.growlT) - dt;
      if (G.growlT <= 0 && !G.over) {
        G.growlT = 3 + Math.random() * 4;
        if (G.enemies.some((e) => !e.dead && !e.boss && !e.hidden && U.dist(e.x, e.y, p.x, p.y) < 520)) MB.Audio.play('growl');
      }
      if (boss && G.state === 'boss' && !G.over) { G.heavyT -= dt; if (G.heavyT <= 0) { G.heavyT = 22; this.dropHeavy(G); } }
      if (G.superOfferT > 0 && !G.over && !p.dead) { G.superOfferT -= dt; if (G.superOfferT <= 0) { MB.App.offerSuper(); return; } }
      const s = G.sup; if (!s) return;
      s.t += dt;
      if (p.dead || G.over) { G.sup = null; return; }
      if (s.type === 'orbital') {
        while (s.n < 5 && s.t >= s.next) { this.orbitalShot(G, s.n); s.n++; s.next += 0.36; }
      } else if (s.type === 'laser') {
        const a = p.aim, L = 900;
        s.x1 = p.x + Math.cos(a) * 30; s.y1 = p.y + Math.sin(a) * 30; s.x2 = p.x + Math.cos(a) * L; s.y2 = p.y + Math.sin(a) * L;
        s.tick -= dt;
        if (s.tick <= 0) {
          s.tick = 0.05;
          for (const e of G.enemies) {
            if (e.dead || e.hidden || e.spawnT > 0) continue;
            if (MB.Col.segCircle(s.x1, s.y1, s.x2, s.y2, e.x, e.y, e.r + 18)) {
              G.damageEnemy(e, e.boss ? e.maxHp * 0.002 : 30, a, e.boss ? 0 : 60, false, { sup: true, noText: true });
              if (Math.random() < 0.3) G.sparks(e.x, e.y, a + Math.PI, '#ffd0d0', 2);
            }
          }
          G.shake(1.6);
        }
      } else if (s.type === 'drone') {
        s.a += dt * 2.4;
        s.x = p.x + Math.cos(s.a) * 48; s.y = p.y + Math.sin(s.a) * 48;
        s.cd -= dt;
        if (s.cd <= 0) {
          let tg = boss && U.dist(boss.x, boss.y, s.x, s.y) < 640 && !boss.hidden ? boss : null;
          if (!tg) { let bd = 540; for (const e of G.enemies) { if (e.dead || e.hidden || e.spawnT > 0) continue; const d = U.dist(e.x, e.y, s.x, s.y); if (d < bd && G.los(s.x, s.y, e.x, e.y)) { bd = d; tg = e; } } }
          if (tg) {
            s.cd = 0.12;
            const a = Math.atan2(tg.y - s.y, tg.x - s.x) + U.rnd(-0.03, 0.03), sp = 1050;
            G.bullets.push({ x: s.x, y: s.y, px: s.x, py: s.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.7, dmg: tg.boss ? tg.maxHp * 0.0015 : 34,
              pierce: 0, hits: [], r: 3, color: '#7ef3ff', knock: 20, max0: 0.7, wid: 'drone', sup: true });
            if ((s.sh = (s.sh || 0) + 1) % 2) MB.Audio.play('shot_smg');
          } else s.cd = 0.2;
        }
      }
      if (s.t >= s.dur) G.sup = null;
    },
    orbitalShot(G, n) {
      const p = G.player, boss = G.boss && !G.boss.dead && !G.boss.hidden ? G.boss : null;
      let tg = null;
      if (boss && n % 2 === 0) tg = boss;
      else {
        const cx = boss ? boss.x : p.x, cy = boss ? boss.y : p.y;
        let bd = 760;
        for (const e of G.enemies) { if (e.dead || e.hidden || e.boss || e.spawnT > 0 || e.__orb === G.time) continue; const d = U.dist(e.x, e.y, cx, cy); if (d < bd) { bd = d; tg = e; } }
        if (tg) tg.__orb = G.time;
        if (!tg && boss) tg = boss;
      }
      let x, y;
      if (tg) { x = tg.x; y = tg.y; } else { const a = U.rnd(0, U.TAU); x = p.x + Math.cos(a) * 220; y = p.y + Math.sin(a) * 220; }
      G.telegraphCircle(x, y, 120, 0.5, (GG) => {
        if (tg && !tg.dead && tg.boss) { x = tg.x; y = tg.y; }
        GG.sfx.push({ kind: 'column', x, y, t: 0, life: 0.5 });
        GG.explosion(x, y, 130, 280, { knock: 300, bossPct: 0.03, src: { sup: true }, shake: 14, color: '#ffe6a0', ring: '255,230,160' });
      }, 'rgba(255,220,120,.12)');
    },

    dropHeavy(G) {
      const p = G.player;
      let x = p.x, y = p.y;
      for (let i = 0; i < 12; i++) {
        const a = U.rnd(0, U.TAU), d = U.rnd(90, 190);
        const tx = U.clamp(p.x + Math.cos(a) * d, 60, G.world.w - 60), ty = U.clamp(p.y + Math.sin(a) * d, 60, G.world.h - 60);
        if (!G.obstacles.some((o) => !o.dead && !o.noMove && MB.Col.overlap(o, tx, ty, 26))) { x = tx; y = ty; break; }
      }
      G.pickups.push({ kind: 'heavy', x, y, vx: 0, vy: 0, z: 280, vz: 0, t: 0, life: 30, aid: true });
      MB.HUD.toast('Tiếp tế <b>ĐẠN HẠNG NẶNG</b> đang thả xuống!', '#ffd56a');
      MB.Audio.play('weapon');
    },
    collectHeavy(G) {
      const p = G.player;
      this.gain(G, 40);
      for (const w of p.weapons) { w.ammo = null; w.reloading = 0; }
      p.apT = 10;
      G.text(p.x, p.y - 34, 'ĐẠN XUYÊN GIÁP 10s · +40 NỘ', '#ffd56a', 14);
      G.burst(p.x, p.y, '#ffd56a', 20);
      MB.Audio.play('mod');
    },

    /* ---------- súng đặc biệt ---------- */
    fireBeam(p, G, w, s) {
      const a = p.aim + U.rnd(-1, 1) * s.spread;
      const x1 = p.x + Math.cos(a) * s.tip * 1.15, y1 = p.y + Math.sin(a) * s.tip * 1.15;
      let x2 = x1 + Math.cos(a) * s.range, y2 = y1 + Math.sin(a) * s.range;
      const hit = MB.Col.raycast(G.obstacles, p.x, p.y, x2, y2, (o) => !o.noShot);
      if (hit) {
        x2 = p.x + (x2 - p.x) * hit.t; y2 = p.y + (y2 - p.y) * hit.t;
        if (hit.o.hp) G.damageObstacle(hit.o, s.dmg);
        if (hit.o.onShot) hit.o.onShot(G, hit.o, { dmg: s.dmg, x: x2, y: y2 });
        if (Math.random() < 0.4) G.sparks(x2, y2, a + Math.PI, '#bff8ff', 2);
      }
      let n = 0;
      for (const e of G.enemies) {
        if (e.dead || e.hidden || e.spawnT > 0) continue;
        if (MB.Col.segCircle(x1, y1, x2, y2, e.x, e.y, e.r + 4)) {
          G.damageEnemy(e, s.dmg, a, s.knock, false, { wid: 'beam', fx: p.x, fy: p.y, noText: (p.beamN || 0) % 4 !== 0 });
          n++;
        }
      }
      p.beamN = (p.beamN || 0) + 1;
      G.stats.shots++; if (n) G.stats.bhits++;
      p.beam = { x1, y1, x2, y2, t: 0.1 };
      p.recoil = s.kick;
      if (p.beamN % 4 === 0) MB.Audio.play(s.sound);
    },
    steer(G, b, dt) {
      if (!b.tg || b.tg.dead || b.tg.hidden) {
        b.tg = null;
        const cur = Math.atan2(b.vy, b.vx);
        let bd = 1e9;
        const L = G.lockE && !G.lockE.dead && !G.lockE.hidden && G.lockE.hp ? G.lockE : null;
        if (L) b.tg = L;
        else for (const e of G.enemies) {
          if (e.dead || e.hidden || e.spawnT > 0) continue;
          const d = U.dist(e.x, e.y, b.x, b.y);
          if (d > 650) continue;
          const da = Math.abs(U.angDiff(cur, Math.atan2(e.y - b.y, e.x - b.x)));
          if (da > 1.5) continue;
          const sc = d + da * 200 - (e.boss ? 150 : 0);
          if (sc < bd) { bd = sc; b.tg = e; }
        }
      }
      let a = Math.atan2(b.vy, b.vx);
      if (b.tg && b.t0 > 0.12) a += U.clamp(U.angDiff(a, Math.atan2(b.tg.y - b.y, b.tg.x - b.x)), -5.5 * dt, 5.5 * dt);
      b.t0 = (b.t0 || 0) + dt;
      const sp = Math.min(b.maxSp || 800, Math.hypot(b.vx, b.vy) + 1100 * dt);
      b.vx = Math.cos(a) * sp; b.vy = Math.sin(a) * sp;
      if (Math.random() < 0.5) G.particle({ x: b.x - Math.cos(a) * 8, y: b.y - Math.sin(a) * 8, vx: U.rnd(-15, 15), vy: U.rnd(-15, 15), life: 0.35, color: 'rgba(200,200,200,.55)', r: 2.6 });
    },
    // nỏ: tên cắm vào mục tiêu rồi phát nổ
    stick(G, b, e, x, y) {
      const st = b.stick;
      G.addFx({
        layer: 'top', life: st.delay, x, y, e,
        update(f) { if (f.e && !f.e.dead) { f.x = f.e.x; f.y = f.e.y; } },
        draw(ctx, f) { ctx.fillStyle = Math.floor(f.t * 14) % 2 ? '#ff5b3c' : '#ffd56a'; U.circle(ctx, f.x, f.y, 5); ctx.fill(); },
        end: (GG, f) => GG.explosion(f.x, f.y, st.r, st.dmg, { knock: 260, small: true, wid: 'bolt' }),
      });
    },
    chill(G, e) {
      if (e.boss) { e.slowT = 1.2; return; }
      e.slowT = 1.2; e.chill = (e.chill || 0) + 34;
      if (e.chill >= 100) {
        e.chill = 0; e.stunT = Math.max(e.stunT || 0, 1.6); e.frozenT = 1.6;
        G.text(e.x, e.y - e.r - 10, 'ĐÓNG BĂNG', '#9be8ff', 12);
        G.burst(e.x, e.y, '#d8f6ff', 10, 120);
      }
    },
    // đĩa cưa nảy khỏi vật cản
    bounce(G, b, o, hx, hy) {
      let nx, ny;
      if (o.shape === 'circle') { nx = hx - o.x; ny = hy - o.y; }
      else {
        const [lx, ly] = MB.Col.toLocal(o, hx, hy);
        let lnx = 0, lny = 0;
        if (Math.abs(lx) / o.hw > Math.abs(ly) / o.hh) lnx = Math.sign(lx) || 1; else lny = Math.sign(ly) || 1;
        nx = lnx * o.c - lny * o.s; ny = lnx * o.s + lny * o.c;
      }
      const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
      const dot = b.vx * nx + b.vy * ny;
      if (dot > 0) { nx = -nx; ny = -ny; }
      const d2 = b.vx * nx + b.vy * ny;
      b.vx -= 2 * d2 * nx; b.vy -= 2 * d2 * ny;
      b.x = hx + nx * 3; b.y = hy + ny * 3; b.px = b.x; b.py = b.y;
      b.hits = []; b.disc.left--;
      G.sparks(hx, hy, Math.atan2(ny, nx), '#ffe9b0', 4);
      MB.Audio.play('hit');
    },

    /* ---------- vẽ (dùng chung 2D và 3D) ----------
       P(x, h, y) → toạ độ vẽ; k = số pixel trên 1 đơn vị thế giới (2D: 1 vì đã nhân zoom) */
    draw(ctx, G, P, k) {
      const t = G.time, p = G.player, r3 = G.r3on;
      const mh = (e) => (r3 ? ((e.__m3 && e.__m3.userData.h) || 40) : 0);
      ctx.save(); ctx.lineCap = 'round';
      // vòng băng dưới chân quái bị làm chậm
      for (const e of G.enemies) {
        if (e.dead || !(e.slowT > 0) || !G.inView(e.x, e.y, 40)) continue;
        const c = P(e.x, 0, e.y);
        ctx.strokeStyle = 'rgba(155,232,255,.85)'; ctx.lineWidth = 2;
        ctx.fillStyle = e.frozenT > 0 ? 'rgba(190,240,255,.35)' : 'rgba(155,232,255,.12)';
        ctx.beginPath(); ctx.ellipse(c.x, c.y, e.r * 1.1 * k, e.r * 0.7 * k, 0, 0, U.TAU); ctx.fill(); ctx.stroke();
      }
      // boss: điểm yếu + sao choáng
      const b = G.boss;
      if (b && !b.dead && !b.hidden && b.spawnT <= 0) {
        if (b.weak) {
          const w = Boss.weakPos(b), c = P(w.x, mh(b) * 0.55, w.y), R = (b.r * 0.42 + 6) * k * (1 + Math.sin(t * 9) * 0.12);
          const fade = Math.min(1, b.weak.t * 2);
          ctx.globalAlpha = fade;
          ctx.fillStyle = 'rgba(255,80,40,.28)'; U.circle(ctx, c.x, c.y, R); ctx.fill();
          ctx.strokeStyle = '#ff6a3c'; ctx.lineWidth = 3; U.circle(ctx, c.x, c.y, R); ctx.stroke();
          ctx.lineWidth = 2; ctx.beginPath();
          for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + t; ctx.moveTo(c.x + Math.cos(a) * R * 0.45, c.y + Math.sin(a) * R * 0.45); ctx.lineTo(c.x + Math.cos(a) * R * 1.35, c.y + Math.sin(a) * R * 1.35); }
          ctx.stroke();
          ctx.fillStyle = '#ffd56a'; U.circle(ctx, c.x, c.y, 3); ctx.fill();
          ctx.globalAlpha = 1;
        }
        if (b.stagT > 0) {
          const c = P(b.x, r3 ? mh(b) * 1.15 : 0, b.y - (r3 ? 0 : b.r + 16));
          for (let i = 0; i < 4; i++) {
            const a = t * 4 + i * Math.PI / 2, sx = c.x + Math.cos(a) * 26 * Math.max(0.6, k), sy = c.y + Math.sin(a) * 9 * Math.max(0.6, k);
            ctx.fillStyle = '#ffd56a'; ctx.beginPath();
            for (let j = 0; j < 10; j++) { const aa = j * Math.PI / 5 - Math.PI / 2, rr = j % 2 ? 2.6 : 6.2; ctx.lineTo(sx + Math.cos(aa) * rr, sy + Math.sin(aa) * rr); }
            ctx.closePath(); ctx.fill();
          }
        }
      }
      // tia súng laser
      if (p.beam && !p.dead) {
        const a = P(p.beam.x1, 30, p.beam.y1), c = P(p.beam.x2, 30, p.beam.y2), f = 0.7 + Math.random() * 0.3;
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = `rgba(80,220,255,${0.35 * f})`; ctx.lineWidth = 9 * Math.max(0.7, k); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(c.x, c.y); ctx.stroke();
        ctx.strokeStyle = `rgba(220,255,255,${0.95 * f})`; ctx.lineWidth = 2.6 * Math.max(0.7, k); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(c.x, c.y); ctx.stroke();
        ctx.fillStyle = 'rgba(200,250,255,.9)'; U.circle(ctx, c.x, c.y, 5 * Math.max(0.7, k)); ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
      }
      // siêu chiêu
      const s = G.sup;
      if (s && s.type === 'laser' && s.x1 != null) {
        const a = P(s.x1, 30, s.y1), c = P(s.x2, 30, s.y2), f = 0.8 + Math.random() * 0.2, w = Math.min(1, s.t * 6, (s.dur - s.t) * 4);
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = `rgba(255,60,80,${0.35 * f * w})`; ctx.lineWidth = 46 * k * w; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(c.x, c.y); ctx.stroke();
        ctx.strokeStyle = `rgba(255,170,150,${0.7 * f * w})`; ctx.lineWidth = 22 * k * w; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(c.x, c.y); ctx.stroke();
        ctx.strokeStyle = `rgba(255,255,240,${f * w})`; ctx.lineWidth = 8 * k * w; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(c.x, c.y); ctx.stroke();
        ctx.globalCompositeOperation = 'source-over';
      }
      if (s && s.type === 'drone') {
        const g = P(s.x, 0, s.y), c = P(s.x, 70, s.y - (r3 ? 0 : 34)), z = Math.max(0.8, k);
        ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(g.x, g.y, 12 * z, 6 * z, 0, 0, U.TAU); ctx.fill();
        ctx.fillStyle = '#20282c'; ctx.strokeStyle = '#7ef3ff'; ctx.lineWidth = 1.5;
        for (const [dx, dy] of [[-9, -6], [9, -6], [-9, 6], [9, 6]]) { ctx.globalAlpha = 0.55; U.circle(ctx, c.x + dx * z, c.y + dy * z, 5 * z); ctx.fill(); ctx.globalAlpha = 1; ctx.beginPath(); ctx.ellipse(c.x + dx * z, c.y + dy * z, 5.5 * z, 1.5 * z, t * 30, 0, U.TAU); ctx.stroke(); }
        ctx.fillStyle = '#2c363b'; U.rr(ctx, c.x - 7 * z, c.y - 5 * z, 14 * z, 10 * z, 3 * z); ctx.fill();
        ctx.fillStyle = Math.floor(t * 6) % 2 ? '#7ef3ff' : '#ff5b5b'; U.circle(ctx, c.x, c.y, 2.4 * z); ctx.fill();
        const left = Math.max(0, s.dur - s.t);
        ctx.fillStyle = 'rgba(126,243,255,.9)'; ctx.font = `800 ${Math.round(10 * Math.max(1, k))}px system-ui,sans-serif`; ctx.textAlign = 'center';
        ctx.fillText(Math.ceil(left) + 's', c.x, c.y - 12 * z);
      }
      for (const f of G.sfx) {
        if (f.kind !== 'column') continue;
        const q = f.t / f.life, top = P(f.x, 520, f.y - (r3 ? 0 : 520)), bot = P(f.x, 0, f.y), w = (34 * (1 - q) + 6) * k;
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = `rgba(255,220,140,${0.5 * (1 - q)})`; ctx.lineWidth = w * 2; ctx.beginPath(); ctx.moveTo(top.x, top.y); ctx.lineTo(bot.x, bot.y); ctx.stroke();
        ctx.strokeStyle = `rgba(255,255,235,${1 - q})`; ctx.lineWidth = w * 0.6; ctx.beginPath(); ctx.moveTo(top.x, top.y); ctx.lineTo(bot.x, bot.y); ctx.stroke();
        ctx.globalCompositeOperation = 'source-over';
      }
      ctx.restore();
    },
    // đạn đặc biệt (2D)
    drawBullet(ctx, b, G) {
      const a = Math.atan2(b.vy, b.vx);
      ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(a);
      if (b.kind === 'missile') {
        ctx.fillStyle = 'rgba(255,150,60,.75)'; ctx.beginPath(); ctx.moveTo(-6, -3); ctx.lineTo(-16 - Math.random() * 6, 0); ctx.lineTo(-6, 3); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#1a1d1f'; U.rr(ctx, -7, -3.6, 14, 7.2, 3); ctx.fill();
        ctx.fillStyle = '#d8dde0'; U.rr(ctx, -6, -2.6, 12, 5.2, 2.5); ctx.fill();
        ctx.fillStyle = '#ff5b3c'; ctx.beginPath(); ctx.moveTo(6, -2.6); ctx.lineTo(10, 0); ctx.lineTo(6, 2.6); ctx.closePath(); ctx.fill();
      } else if (b.kind === 'disc') {
        ctx.rotate(G.time * 30);
        ctx.fillStyle = '#1a1d1f'; U.circle(ctx, 0, 0, b.r + 2); ctx.fill();
        ctx.fillStyle = '#d9e2e6'; ctx.beginPath();
        for (let i = 0; i < 16; i++) { const aa = i / 16 * U.TAU, rr = i % 2 ? b.r * 0.78 : b.r + 1.5; ctx.lineTo(Math.cos(aa) * rr, Math.sin(aa) * rr); }
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#5a6266'; U.circle(ctx, 0, 0, b.r * 0.35); ctx.fill();
      } else if (b.kind === 'bolt') {
        ctx.strokeStyle = 'rgba(16,10,6,.6)'; ctx.lineWidth = 4.5; ctx.beginPath(); ctx.moveTo(-18, 0); ctx.lineTo(8, 0); ctx.stroke();
        ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(-18, 0); ctx.lineTo(8, 0); ctx.stroke();
        ctx.fillStyle = '#ffb347'; ctx.beginPath(); ctx.moveTo(6, -3.4); ctx.lineTo(13, 0); ctx.lineTo(6, 3.4); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#e0e6e8'; ctx.fillRect(-18, -3, 4, 6);
      } else if (b.kind === 'ice') {
        const k = Math.max(0, b.life / b.max0);
        ctx.globalAlpha = 0.45 + k * 0.5;
        ctx.fillStyle = 'rgba(155,232,255,.35)'; U.circle(ctx, 0, 0, b.r * 1.8); ctx.fill();
        ctx.fillStyle = '#e8fbff'; ctx.beginPath(); ctx.moveTo(b.r * 1.4, 0); ctx.lineTo(0, -b.r * 0.7); ctx.lineTo(-b.r, 0); ctx.lineTo(0, b.r * 0.7); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    },
  };
})(window.MB);
