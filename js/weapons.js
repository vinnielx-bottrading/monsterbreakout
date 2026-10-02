/* Monster Breakout — vũ khí, linh kiện nâng cấp (mod), bắn đạn */
'use strict';
(function (MB) {
  const U = MB.U;

  const DEFS = {
    rifle: {
      name: 'Rifle AR-7', short: 'AR-7', dmg: 20, rate: 110, mag: 30, reload: 1.1, spread: 0.035,
      speed: 900, life: 0.85, pellets: 1, kick: 3, shake: 1.1, knock: 40, sound: 'shot_rifle', color: '#ffe39b', tip: 42, br: 3.5,
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
    DEFS, MODS, MOD_DROP,
    make(id) { return { id, ammo: null, reloading: 0 }; },
    stats(p, w) {
      const d = DEFS[w.id], m = p.mods;
      return {
        ...d,
        dmg: d.dmg * (1 + 0.15 * m.barrel),
        rate: d.rate / (1 + 0.12 * m.trigger),
        mag: Math.round(d.mag * (1 + 0.25 * m.mag)),
        reload: d.reload * (1 - 0.12 * m.mag),
        pierce: m.pierce,
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
      for (let k = 1; k <= 3; k++) if (I.take('slot' + k)) this.switchTo(p, k - 1);

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
      for (const sh of shots) {
        const sp = s.speed * U.rnd(0.94, 1.06);
        G.bullets.push({
          x: sx, y: sy, px: sx, py: sy, vx: Math.cos(sh.a) * sp, vy: Math.sin(sh.a) * sp,
          life: s.life * U.rnd(0.9, 1.1), dmg: sh.dmg, pierce: s.pierce, hits: [], r: s.br, color: s.color, knock: s.knock,
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
      if (id === 'shotgun') {
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
        ctx.fillStyle = '#1d2224'; U.rr(ctx, 8, -3, 27, 6, 2); ctx.fill();
        ctx.fillStyle = '#3c474b'; ctx.fillRect(34, -1.5, 8, 3);
        ctx.fillStyle = '#2b3336'; ctx.fillRect(18, -4.5, 9, 2.5);
        if (showMag) { ctx.fillStyle = '#2a3134'; ctx.fillRect(16, 3, 5, 7); }
        ctx.fillStyle = '#f2a33a'; ctx.fillRect(28, -3, 3, 6);
      }
      ctx.restore();
    },
  };
})(window.MB);
