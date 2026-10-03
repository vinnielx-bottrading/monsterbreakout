/* Monster Breakout — vũ khí, linh kiện nâng cấp (mod), bắn đạn */
'use strict';
(function (MB) {
  const U = MB.U;

  const DEFS = {
    rifle: {
      name: 'Rifle AR-7', short: 'AR-7', dmg: 20, rate: 110, mag: 30, reload: 1.1, spread: 0.035,
      speed: 900, life: 0.85, pellets: 1, kick: 3, shake: 1.1, knock: 40, sound: 'shot_rifle', color: '#ffe39b', tip: 48, br: 3.5,
    },
    shotgun: {
      name: 'Shotgun SG-12', short: 'SG-12', dmg: 11, rate: 640, mag: 6, reload: 1.4, spread: 0.32,
      speed: 820, life: 0.36, pellets: 7, kick: 8, shake: 4, knock: 110, sound: 'shot_shotgun', color: '#ffcf87', tip: 42, br: 3,
    },
    smg: {
      name: 'SMG Viper', short: 'VIPER', dmg: 10, rate: 62, mag: 44, reload: 1.15, spread: 0.11,
      speed: 880, life: 0.62, pellets: 1, kick: 2, shake: 0.7, knock: 22, sound: 'shot_smg', color: '#b9f3ff', tip: 32, br: 3,
    },
  };

  Object.assign(DEFS, {
    sniper: {
      name: 'Rail Lancer', short: 'RAIL', dmg: 110, rate: 850, mag: 5, reload: 1.6, spread: 0.004,
      speed: 1900, life: 0.6, pellets: 1, kick: 9, shake: 3, knock: 160, sound: 'shot_sniper', color: '#9fe8ff', tip: 46, br: 3.5, pierce: 3,
    },
    flame: {
      name: 'Pyro F-9', short: 'PYRO', dmg: 6, rate: 45, mag: 90, reload: 1.8, spread: 0.24,
      speed: 520, life: 0.34, pellets: 2, kick: 0.6, shake: 0.2, knock: 8, sound: 'shot_flame', color: '#ff9a3c', tip: 36, br: 6, pierce: 2, flame: true, burn: true,
    },
    launcher: {
      name: 'Boomer GL', short: 'BOOM', dmg: 20, rate: 620, mag: 6, reload: 1.7, spread: 0.03,
      speed: 640, life: 0.8, pellets: 1, kick: 7, shake: 2.5, knock: 0, sound: 'shot_gl', color: '#ffd56a', tip: 40, br: 5, explode: { r: 95, dmg: 70, knock: 380 },
    },
    plasma: {
      name: 'Arc Plasma', short: 'ARC', dmg: 34, rate: 170, mag: 26, reload: 1.3, spread: 0.03,
      speed: 760, life: 0.9, pellets: 1, kick: 3, shake: 1, knock: 60, sound: 'shot_plasma', color: '#c79bff', tip: 40, br: 6, pierce: 1, chain: { n: 2, r: 150, dmg: 0.5 },
    },
    minigun: {
      name: 'Tempest MG', short: 'TEMP', dmg: 9, rate: 42, mag: 140, reload: 2.6, spread: 0.13,
      speed: 950, life: 0.7, pellets: 1, kick: 1.5, shake: 0.5, knock: 18, sound: 'shot_smg', color: '#ffe39b', tip: 44, br: 3,
    },
    // ----- v6.4: 5 súng mới (nhận khi hạ boss Gate 3/5/7/9/11 hoặc mua bằng xu) -----
    cryo: {
      name: 'Cryo Frost', short: 'CRYO', dmg: 9, rate: 55, mag: 80, reload: 1.6, spread: 0.12,
      speed: 640, life: 0.42, pellets: 1, kick: 0.8, shake: 0.2, knock: 10, sound: 'shot_cryo', color: '#9be8ff', tip: 38, br: 4.5, pierce: 1, chill: true, bk: 'ice',
      desc: 'Phun băng: làm chậm, đủ lạnh thì đóng băng quái; boss bị chậm 25%',
    },
    bolt: {
      name: 'Bolt X Crossbow', short: 'BOLT', dmg: 70, rate: 700, mag: 5, reload: 1.5, spread: 0.008,
      speed: 1350, life: 0.7, pellets: 1, kick: 6, shake: 1.6, knock: 60, sound: 'shot_bolt', color: '#ffb347', tip: 36, br: 3.5, stick: { r: 85, dmg: 110, delay: 0.5 }, bk: 'bolt',
      desc: 'Nỏ tên nổ: tên cắm vào mục tiêu rồi phát nổ sau 0,5 giây',
    },
    hornet: {
      name: 'Hornet ML', short: 'HORNET', dmg: 0, rate: 750, mag: 4, reload: 1.8, spread: 0.55,
      speed: 380, maxSp: 820, life: 1.6, pellets: 3, kick: 6, shake: 1.8, knock: 0, sound: 'shot_missile', color: '#ff8a5c', tip: 40, br: 4, homing: true, explode: { r: 55, dmg: 50, knock: 160 }, bk: 'missile',
      desc: 'Mỗi phát 3 tên lửa tự dẫn, ưu tiên boss và mục tiêu đang khoá',
    },
    beam: {
      name: 'Lumen Beam', short: 'BEAM', dmg: 11, rate: 60, mag: 120, reload: 2, spread: 0.006, range: 560,
      speed: 0, life: 0, pellets: 1, kick: 0.5, shake: 0.15, knock: 14, sound: 'shot_beam', color: '#7ef3ff', tip: 40, br: 3, beam: true,
      desc: 'Tia laser liên tục, trúng ngay, xuyên mọi quái trên đường bắn',
    },
    ripper: {
      name: 'Ripper Disc', short: 'RIPPER', dmg: 34, rate: 380, mag: 8, reload: 1.5, spread: 0.01,
      speed: 700, life: 1.35, pellets: 1, kick: 3, shake: 0.8, knock: 50, sound: 'shot_disc', color: '#d9e2e6', tip: 34, br: 7, pierce: 99, disc: 3, bk: 'disc',
      desc: 'Đĩa cưa xuyên đám đông, nảy khỏi tường tối đa 3 lần',
    },
  });
  const ORDER = ['rifle', 'shotgun', 'smg', 'sniper', 'flame', 'launcher', 'plasma', 'minigun', 'cryo', 'bolt', 'hornet', 'beam', 'ripper'];

  // Linh kiện: nhặt từ thùng tiếp tế, quái tinh nhuệ hoặc phần thưởng thử thách
  const MODS = {
    barrel: { name: 'Nòng Tăng Lực', desc: '+15% sát thương', max: 5, color: '#ff8a5c', glyph: 'D' },
    trigger: { name: 'Cò Siêu Tốc', desc: '+12% tốc độ bắn', max: 5, color: '#ffd56a', glyph: 'F' },
    mag: { name: 'Băng Đạn Mở Rộng', desc: '+25% băng đạn, nạp nhanh hơn', max: 3, color: '#7ad7ff', glyph: 'M' },
    pierce: { name: 'Lõi Xuyên Phá', desc: 'Đạn xuyên thêm 1 mục tiêu', max: 2, color: '#c79bff', glyph: 'P' },
    split: { name: 'Bộ Chia Tia', desc: '+1 tia đạn phụ (60% sát thương)', max: 2, color: '#9dff8a', glyph: 'S' },
  };
  const MOD_DROP = { barrel: 4, trigger: 3, mag: 3, pierce: 1, split: 1 };

  const W = MB.Weapons = {
    DEFS, MODS, MOD_DROP, ORDER,
    make(id) { return { id, ammo: null, reloading: 0 }; },
    stats(p, w) {
      const d = DEFS[w.id], m = p.mods, B = p.bonus || {};
      return {
        ...d,
        dmg: d.dmg * (1 + 0.15 * m.barrel) * (1 + (B.dmg || 0)),
        dmgK: (1 + 0.15 * m.barrel) * (1 + (B.dmg || 0)),
        rate: d.rate / (1 + 0.12 * m.trigger) / (1 + (B.rate || 0)),
        mag: Math.round(d.mag * (1 + 0.25 * m.mag) * (1 + (B.mag || 0))),
        reload: d.reload * (1 - 0.12 * m.mag) * Math.max(0.4, 1 - (B.reload || 0)),
        pierce: (d.pierce || 0) + m.pierce + (B.pierce || 0),
        extra: m.split,
      };
    },
    power(p) { let s = 0; for (const k in p.mods) s += p.mods[k]; return s; },
    current(p) { return p.weapons[p.wi]; },

    startReload(p, w, s) {
      if (w.reloading > 0 || w.ammo >= s.mag) return;
      w.reloading = s.reload;
      MB.Audio.play('reload');
    },
    switchTo(p, i) {
      if (i < 0 || i >= p.weapons.length || i === p.wi) return;
      p.weapons[p.wi].reloading = 0;
      p.wi = i; p.fireCd = Math.max(p.fireCd, 140); p.swapT = 0.25;
      MB.Audio.play('swap');
    },

    update(p, G, dt) {
      const I = MB.Input;
      // đổi súng
      if (I.take('swap') || I.take('next')) this.switchTo(p, (p.wi + 1) % p.weapons.length);
      if (I.take('prev')) this.switchTo(p, (p.wi - 1 + p.weapons.length) % p.weapons.length);
      for (let k = 1; k <= 10; k++) if (I.take('slot' + k)) this.switchTo(p, k - 1);

      const w = p.weapons[p.wi], s = this.stats(p, w);
      if (w.ammo == null) w.ammo = s.mag;
      p.fireCd -= dt * 1000;
      if (p.swapT > 0) p.swapT -= dt;
      if (w.reloading > 0) {
        w.reloading -= dt;
        if (w.reloading <= 0) { w.reloading = 0; w.ammo = s.mag; MB.Audio.play('reload_done'); }
      }
      if (I.take('reload')) this.startReload(p, w, s);
      if (p.dead) return;
      if (G.wantFire && !w.reloading && !p.dash && p.swapT <= 0) {
        if (w.ammo <= 0) { this.startReload(p, w, s); }
        else if (p.fireCd <= 0) { this.fire(p, G, w, s); }
      }
    },

    fire(p, G, w, s) {
      if (p.fireCd < -40) p.fireCd = 0;
      p.fireCd += s.rate;
      w.ammo--;
      if (s.beam) { MB.Super.fireBeam(p, G, w, s); if (w.ammo <= 0) this.startReload(p, w, s); return; }
      const a0 = p.aim;
      const tx = p.x + Math.cos(a0) * s.tip * 1.28, ty = p.y + Math.sin(a0) * s.tip * 1.28;
      const shots = [];
      if (s.pellets > 1) {
        const n = s.pellets + s.extra * 2;
        for (let i = 0; i < n; i++) {
          const k = n === 1 ? 0 : i / (n - 1) - 0.5;
          shots.push({ a: a0 + k * s.spread + U.rnd(-0.04, 0.04), dmg: s.dmg });
        }
      } else {
        shots.push({ a: a0 + U.rnd(-1, 1) * s.spread, dmg: s.dmg });
        for (let i = 1; i <= s.extra; i++) {
          shots.push({ a: a0 + 0.12 * i + U.rnd(-1, 1) * s.spread, dmg: s.dmg * 0.6 });
          shots.push({ a: a0 - 0.12 * i + U.rnd(-1, 1) * s.spread, dmg: s.dmg * 0.6 });
        }
      }
      // điểm xuất phát lùi về trong thân để không bắn xuyên tường khi đứng sát vật cản
      const sx = p.x + Math.cos(a0) * 10, sy = p.y + Math.sin(a0) * 10;
      const crit = (p.bonus && p.bonus.crit) || 0;
      for (const sh of shots) {
        const sp = s.speed * U.rnd(0.94, 1.06);
        if (crit && Math.random() < crit) sh.dmg *= 2.5;
        G.bullets.push({
          x: sx, y: sy, px: sx, py: sy, vx: Math.cos(sh.a) * sp, vy: Math.sin(sh.a) * sp,
          life: s.life * U.rnd(0.9, 1.1), dmg: sh.dmg, pierce: s.pierce, hits: [], r: s.br, color: s.color, knock: s.knock,
          flame: s.flame, burn: s.burn, explode: s.explode && { ...s.explode, dmg: s.explode.dmg * s.dmgK }, chain: s.chain, max0: s.life, wid: w.id,
          kind: s.bk, homing: s.homing, maxSp: s.maxSp, stick: s.stick && { ...s.stick, dmg: s.stick.dmg * s.dmgK }, chill: s.chill, disc: s.disc ? { left: s.disc } : null, noFalloff: !!s.disc,
        });
      }
      G.stats.shots++;
      p.recoil = s.kick; p.muzzle = 0.06;
      G.shake(s.shake * 0.6);
      MB.Audio.play(s.sound);
      G.fxMuzzle(tx, ty, a0, s.pellets > 1 ? 1.6 : 1);
      // vỏ đạn
      const pa = a0 + Math.PI / 2 + U.rnd(-0.3, 0.3);
      G.particle({ x: p.x + Math.cos(a0) * 14, y: p.y + Math.sin(a0) * 14, vx: Math.cos(pa) * U.rnd(80, 140), vy: Math.sin(pa) * U.rnd(80, 140), life: 0.5, color: '#d9b45a', r: 2, type: 'shell', rot: U.rnd(0, 6), drag: 0.9 });
      if (w.ammo <= 0) this.startReload(p, w, s);
    },

    // vẽ súng trong hệ toạ độ thân nhân vật (hướng +x)
    drawGun(ctx, id, recoil, reloadK) {
      ctx.save();
      ctx.translate(-recoil, 0);
      if (reloadK > 0) { ctx.translate(10, 4); ctx.rotate(Math.sin(reloadK * Math.PI) * 0.7); ctx.translate(-10, -4); }
      const showMag = !(reloadK > 0.25 && reloadK < 0.75);
      if (id === 'sniper') {
        ctx.fillStyle = '#1d2224'; U.rr(ctx, 4, -2.5, 34, 5, 2); ctx.fill();
        ctx.fillStyle = '#3c474b'; ctx.fillRect(36, -1.5, 12, 3);
        ctx.fillStyle = '#2b3336'; U.rr(ctx, 14, -6, 12, 3.5, 1.5); ctx.fill();
        ctx.fillStyle = '#9fe8ff'; ctx.fillRect(25, -5.5, 1.5, 2.5); ctx.fillRect(20, 1, 12, 1.4);
      } else if (id === 'flame') {
        ctx.fillStyle = '#2a2420'; U.rr(ctx, 6, -3.5, 26, 7, 2); ctx.fill();
        ctx.fillStyle = '#c0471f'; U.rr(ctx, 12, 3, 9, 7, 3); ctx.fill();
        ctx.fillStyle = '#4b4b4b'; ctx.fillRect(30, -2.5, 7, 5);
        ctx.fillStyle = '#ff9a3c'; U.circle(ctx, 37, 0, 1.6); ctx.fill();
      } else if (id === 'launcher') {
        ctx.fillStyle = '#2d3a2a'; U.rr(ctx, 6, -4.5, 30, 9, 3); ctx.fill();
        ctx.fillStyle = '#1b1f22'; ctx.fillRect(34, -4, 6, 8);
        ctx.fillStyle = '#ffd56a'; ctx.fillRect(16, -4.5, 3, 9);
      } else if (id === 'plasma') {
        ctx.fillStyle = '#22202c'; U.rr(ctx, 6, -3.5, 28, 7, 3); ctx.fill();
        ctx.fillStyle = '#c79bff'; U.rr(ctx, 14, -2, 12, 4, 2); ctx.fill();
        ctx.fillStyle = '#3c3a4b'; ctx.fillRect(32, -2.5, 8, 5);
      } else if (id === 'minigun') {
        ctx.fillStyle = '#1d2224'; U.rr(ctx, 4, -5, 22, 10, 3); ctx.fill();
        ctx.fillStyle = '#3c474b'; for (const yy of [-3, 0, 3]) ctx.fillRect(24, yy - 1, 20, 2);
        ctx.fillStyle = '#ffd56a'; ctx.fillRect(10, 5, 8, 4);
      } else if (id === 'cryo') {
        ctx.fillStyle = '#2a3a44'; U.rr(ctx, 6, -3.5, 24, 7, 2); ctx.fill();
        ctx.fillStyle = '#9be8ff'; U.rr(ctx, 10, 3, 11, 6, 3); ctx.fill();
        ctx.fillStyle = '#cfefff'; ctx.fillRect(29, -2.5, 9, 5);
        ctx.fillStyle = 'rgba(190,240,255,.8)'; U.circle(ctx, 38.5, 0, 1.8); ctx.fill();
      } else if (id === 'bolt') {
        ctx.fillStyle = '#3a2c22'; U.rr(ctx, 2, -2.5, 28, 5, 2); ctx.fill();
        ctx.strokeStyle = '#1d2224'; ctx.lineWidth = 2.6;
        ctx.beginPath(); ctx.moveTo(22, -12); ctx.quadraticCurveTo(31, 0, 22, 12); ctx.stroke();
        ctx.strokeStyle = '#cfd6d8'; ctx.lineWidth = 0.9;
        ctx.beginPath(); ctx.moveTo(21.5, -11.5); ctx.lineTo(13 - recoil, 0); ctx.lineTo(21.5, 11.5); ctx.stroke();
        if (showMag) { ctx.fillStyle = '#6a4a2a'; ctx.fillRect(13 - recoil, -0.9, 22, 1.8); ctx.fillStyle = '#ffb347'; ctx.fillRect(34 - recoil, -1.6, 3, 3.2); }
      } else if (id === 'hornet') {
        ctx.fillStyle = '#2d3a2a'; U.rr(ctx, 4, -5.5, 32, 11, 3); ctx.fill();
        ctx.fillStyle = '#c0471f'; ctx.fillRect(12, -5.5, 3, 11);
        ctx.fillStyle = '#111'; for (const yy of [-3, 0, 3]) { U.circle(ctx, 35, yy, 1.5); ctx.fill(); }
        ctx.fillStyle = '#1b1f22'; ctx.fillRect(18, 5.5, 4, 5);
      } else if (id === 'beam') {
        ctx.fillStyle = '#22262e'; U.rr(ctx, 6, -3.5, 28, 7, 3); ctx.fill();
        ctx.fillStyle = '#3a4250'; for (const xx of [14, 19, 24]) ctx.fillRect(xx, -4.5, 2.4, 9);
        ctx.shadowColor = '#7ef3ff'; ctx.shadowBlur = 8; ctx.fillStyle = '#9ff6ff'; U.circle(ctx, 36, 0, 3); ctx.fill(); ctx.shadowBlur = 0;
      } else if (id === 'ripper') {
        ctx.fillStyle = '#2c2f31'; U.rr(ctx, 4, -3.5, 20, 7, 2); ctx.fill();
        if (showMag) {
          ctx.save(); ctx.translate(27, 0); ctx.rotate((MB.G ? MB.G.time : 0) * 6);
          ctx.fillStyle = '#c9d1d4'; ctx.beginPath();
          for (let i = 0; i < 12; i++) { const a = i / 12 * U.TAU, r = i % 2 ? 4.6 : 6.4; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
          ctx.closePath(); ctx.fill(); ctx.fillStyle = '#444'; U.circle(ctx, 0, 0, 1.8); ctx.fill(); ctx.restore();
        }
      } else if (id === 'shotgun') {
        ctx.fillStyle = '#1b1f22'; U.rr(ctx, 6, -3.5, 26, 7, 2); ctx.fill();
        ctx.fillStyle = '#2b3236'; ctx.fillRect(30, -2.5, 12, 5);
        ctx.fillStyle = '#7a4f2a'; U.rr(ctx, 20 - recoil * 0.6, -4.5, 10, 9, 2); ctx.fill();
        ctx.fillStyle = '#5c3b20'; U.rr(ctx, 2, -3, 8, 6, 2); ctx.fill();
      } else if (id === 'smg') {
        ctx.fillStyle = '#1c2124'; U.rr(ctx, 8, -3, 19, 6, 2); ctx.fill();
        ctx.fillStyle = '#39454a'; ctx.fillRect(26, -1.5, 6, 3);
        if (showMag) { ctx.fillStyle = '#2a3236'; ctx.fillRect(13, 3, 4, 9); }
        ctx.fillStyle = '#4fd6ff'; ctx.fillRect(17, -3, 6, 1.6);
      } else {
        // súng trường: ốp tay cầm dài, ống ngắm có chấm đỏ, giảm thanh
        ctx.fillStyle = '#1d2224'; U.rr(ctx, 8, -3, 27, 6, 2); ctx.fill();
        ctx.fillStyle = '#3c474b'; U.rr(ctx, 25, -3.2, 12, 6.4, 1.5); ctx.fill();
        ctx.fillStyle = '#2b3236'; ctx.fillRect(37, -1.6, 4, 3.2);
        ctx.fillStyle = '#3a4246'; U.rr(ctx, 40, -2.6, 9, 5.2, 2); ctx.fill();
        ctx.fillStyle = '#14181a'; U.rr(ctx, 15, -2.2, 10, 4.4, 2); ctx.fill();
        ctx.fillStyle = '#ff5040'; ctx.fillRect(18, -0.7, 1.6, 1.4);
        if (showMag) { ctx.fillStyle = '#2a3134'; ctx.fillRect(16, 3, 5, 7); }
      }
      ctx.restore();
    },
  };
})(window.MB);
