/* Monster Breakout — vật phẩm (thiết bị) và thử thách
   Cách tăng sức mạnh súng: nhặt linh kiện (mod) từ thùng tiếp tế / quái tinh nhuệ,
   hoặc hoàn thành thử thách để nhận súng mới / linh kiện hiếm. */
'use strict';
(function (MB) {
  const U = MB.U;

  const Items = MB.Items = {
    drop(G, kind, x, y, id) {
      const a = U.rnd(0, U.TAU), s = U.rnd(30, 90);
      G.pickups.push({ kind, id, x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, z: 0, vz: 160, t: 0, life: kind === 'med' || kind === 'armor' ? 30 : 9999 });
    },
    randomLoot(G, x, y, table) {
      const kind = U.weighted(table || { mod: 5, med: 3, armor: 2, grenade: 2 });
      if (kind === 'mod') this.drop(G, 'mod', x, y, this.randomMod(G.player));
      else this.drop(G, kind, x, y);
    },
    randomMod(p) {
      const W = MB.Weapons, table = {};
      for (const k in W.MOD_DROP) if (p.mods[k] < W.MODS[k].max) table[k] = W.MOD_DROP[k];
      return Object.keys(table).length ? U.weighted(table) : 'barrel';
    },

    update(G, dt) {
      const p = G.player;
      for (let i = G.pickups.length - 1; i >= 0; i--) {
        const it = G.pickups[i];
        it.t += dt; it.life -= dt;
        if (it.life <= 0) { G.pickups.splice(i, 1); continue; }
        it.x += it.vx * dt; it.y += it.vy * dt;
        it.vx *= Math.pow(0.02, dt); it.vy *= Math.pow(0.02, dt);
        if (it.aid && it.z > 0) { it.z = Math.max(0, it.z - 95 * dt); if (it.z === 0) { G.burst(it.x, it.y, '#c9e8b0', 10, 90); it.vz = 0; } }
        else { it.vz -= 600 * dt; it.z = Math.max(0, it.z + it.vz * dt); if (it.z === 0 && it.vz < 0) it.vz = -it.vz * 0.35; }
        if (p.dead) continue;
        const d = U.dist(it.x, it.y, p.x, p.y);
        const wants = this.wants(p, it);
        const mr = 110 * (p.magnet || 1);
        if (wants && d < mr && it.t > 0.4 && it.z < 12) { // hút nhẹ về phía người chơi
          const k = (1 - d / mr) * 500 * dt;
          it.x += (p.x - it.x) / (d || 1) * k; it.y += (p.y - it.y) / (d || 1) * k;
        }
        if (wants && d < p.r + 16 && it.t > 0.25 && it.z < 12) { this.collect(G, it); G.pickups.splice(i, 1); }
      }
    },
    wants(p, it) {
      if (it.kind === 'med') return p.hp < p.maxHp;
      if (it.kind === 'armor') return p.armor < p.maxArmor;
      if (it.kind === 'grenade') return p.grenades < (p.gMax || MB.Skills.GRENADE.max);
      return true;
    },
    collect(G, it) {
      const p = G.player, W = MB.Weapons, H = MB.HUD;
      if (it.kind === 'med') {
        p.hp = Math.min(p.maxHp, p.hp + 35);
        G.text(p.x, p.y - 30, '+35 HP', '#9dff8a'); MB.Audio.play('heal');
      } else if (it.kind === 'armor') {
        p.armor = Math.min(p.maxArmor, p.armor + 30);
        G.text(p.x, p.y - 30, '+30 GIÁP', '#7ad7ff'); MB.Audio.play('pickup');
      } else if (it.kind === 'grenade') {
        p.grenades = Math.min(p.gMax || MB.Skills.GRENADE.max, p.grenades + 1);
        G.text(p.x, p.y - 30, '+1 LỰU ĐẠN', '#ffb347'); MB.Audio.play('pickup');
      } else if (it.kind === 'mod') {
        const m = W.MODS[it.id];
        if (p.mods[it.id] < m.max) {
          p.mods[it.id]++;
          H.toast(`<b style="color:${m.color}">${m.name}</b> Lv.${p.mods[it.id]} · ${m.desc}`, m.color);
          G.text(p.x, p.y - 34, m.name.toUpperCase(), m.color);
        } else {
          G.addScore(300); H.toast(`${m.name} đã tối đa · +300 điểm`, m.color);
        }
        G.stats.mods++;
        MB.Audio.play('mod'); G.burst(p.x, p.y, m.color, 18);
      } else if (it.kind === 'heavy') {
        MB.Super.collectHeavy(G); G.addScore(25); return;
      } else if (it.kind === 'weapon') {
        const owned = p.weapons.some((w) => w.id === it.id);
        if (!owned) {
          p.weapons.push(W.make(it.id));
          W.switchTo(p, p.weapons.length - 1);
          const sv = MB.Save.data;
          if (!sv.armory.includes(it.id)) { sv.armory.push(it.id); MB.Save.save(); }
          H.toast(`Mở khóa vũ khí <b>${W.DEFS[it.id].name}</b> · bấm Q / ⇄ để đổi súng`, '#ffd56a');
          G.banner('VŨ KHÍ MỚI', W.DEFS[it.id].name, 2.2);
          MB.Audio.play('weapon');
        } else {
          const mid = this.randomMod(p);
          this.collect(G, { kind: 'mod', id: mid });
          return;
        }
      }
      G.addScore(25);
    },

    draw(ctx, G) {
      const t = G.time;
      for (const it of G.pickups) {
        if (!G.inView(it.x, it.y, 40)) continue;
        const bob = Math.sin(t * 4 + it.x) * 2 - it.z * 0.25;
        const fade = it.life < 4 ? (Math.floor(t * 8) % 2 ? 0.4 : 1) : 1;
        ctx.save(); ctx.translate(it.x, it.y);
        ctx.fillStyle = 'rgba(0,0,0,.25)'; U.ellipse(ctx, 0, 8, 12, 5); ctx.fill();
        ctx.translate(0, bob - 4); ctx.globalAlpha = fade;
        if (it.aid && it.z > 2) {
          ctx.strokeStyle = 'rgba(230,240,230,.7)'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(-14, -26); ctx.lineTo(-6, -8); ctx.moveTo(14, -26); ctx.lineTo(6, -8); ctx.stroke();
          ctx.fillStyle = '#e9f2e6'; ctx.beginPath(); ctx.arc(0, -26, 16, Math.PI, 0); ctx.closePath(); ctx.fill();
          ctx.fillStyle = '#3fbf5a'; ctx.fillRect(-2, -38, 4, 10);
        }
        if (it.kind === 'heavy') {
          ctx.shadowColor = '#ffd56a'; ctx.shadowBlur = 14;
          ctx.fillStyle = '#2a2a24'; U.rr(ctx, -13, -10, 26, 20, 3); ctx.fill(); ctx.shadowBlur = 0;
          ctx.fillStyle = '#ffd56a'; for (let i = -12; i < 12; i += 7) { ctx.beginPath(); ctx.moveTo(i, -10); ctx.lineTo(i + 3.5, -10); ctx.lineTo(i - 1.5, 10); ctx.lineTo(i - 5, 10); ctx.closePath(); ctx.fill(); }
          ctx.fillStyle = '#1a1a16'; U.rr(ctx, -9, -5.5, 18, 11, 2); ctx.fill();
          ctx.fillStyle = '#ffd56a'; ctx.font = 'bold 9px system-ui,sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('AP', 0, 0.5);
        } else if (it.kind === 'grenade') {
          ctx.fillStyle = '#3e5a36'; U.circle(ctx, 0, 0, 8); ctx.fill();
          ctx.fillStyle = '#6b8f5c'; U.circle(ctx, -2, -2, 3.5); ctx.fill();
          ctx.fillStyle = '#ffb347'; ctx.fillRect(-2, -12, 4, 5);
        } else if (it.kind === 'med') {
          ctx.fillStyle = '#eef6ee'; U.rr(ctx, -10, -8, 20, 16, 4); ctx.fill();
          ctx.fillStyle = '#3fbf5a'; ctx.fillRect(-2.5, -6, 5, 12); ctx.fillRect(-6, -2.5, 12, 5);
        } else if (it.kind === 'armor') {
          ctx.fillStyle = '#2d6f93';
          ctx.beginPath(); ctx.moveTo(0, -11); ctx.lineTo(10, -6); ctx.lineTo(8, 6); ctx.lineTo(0, 11); ctx.lineTo(-8, 6); ctx.lineTo(-10, -6); ctx.closePath(); ctx.fill();
          ctx.strokeStyle = '#9fe3ff'; ctx.lineWidth = 2; ctx.stroke();
        } else if (it.kind === 'mod') {
          const m = MB.Weapons.MODS[it.id];
          ctx.shadowColor = m.color; ctx.shadowBlur = 16;
          ctx.rotate(t * 1.5);
          ctx.fillStyle = '#121a1d'; U.rr(ctx, -10, -10, 20, 20, 4); ctx.fill();
          ctx.strokeStyle = m.color; ctx.lineWidth = 2.5; U.rr(ctx, -10, -10, 20, 20, 4); ctx.stroke();
          ctx.shadowBlur = 0; ctx.rotate(-t * 1.5);
          ctx.fillStyle = m.color; ctx.font = 'bold 12px system-ui,sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(m.glyph, 0, 1);
        } else if (it.kind === 'weapon') {
          ctx.shadowColor = '#ffd56a'; ctx.shadowBlur = 22;
          ctx.fillStyle = 'rgba(255,213,106,.18)'; U.circle(ctx, 0, 0, 24); ctx.fill();
          ctx.shadowBlur = 0;
          ctx.save(); ctx.translate(-20, 0); ctx.scale(1.1, 1.1);
          MB.Weapons.drawGun(ctx, it.id, 0, 0);
          ctx.restore();
          ctx.fillStyle = '#ffd56a'; ctx.font = 'bold 10px system-ui,sans-serif'; ctx.textAlign = 'center';
          ctx.fillText(MB.Weapons.DEFS[it.id].short, 0, -20);
        }
        ctx.restore();
      }
    },
  };

  /* ================= Thử thách ================= */
  const Ch = MB.Challenges = {
    init(G, defs) {
      G.challenges = (defs || []).map((d) => ({ ...d, progress: 0, done: false, spawnT: 0 }));
      for (const c of G.challenges) {
        if (c.type === 'destroy') {
          c.total = c.targets.length;
          for (const t of c.targets) {
            G.addObstacle({
              kind: c.kind, shape: 'circle', x: t.x, y: t.y, r: c.r || 30, hp: c.hp, maxHp: c.hp,
              challenge: c.id, spawner: c.spawner ? { ...c.spawner, t: U.rnd(1, c.spawner.every) } : null, target: true,
            });
          }
        }
        if (c.type === 'streak') c.total = c.count;
        if (c.type === 'hold') c.total = c.time;
      }
    },
    label(c) {
      if (c.type === 'hold') return `${Math.floor(Math.min(c.progress, c.time))}/${c.time}s`;
      return `${Math.min(c.progress, c.total)}/${c.total}`;
    },
    event(G, ev, obj) {
      for (const c of G.challenges) {
        if (c.done) continue;
        if (c.type === 'destroy' && ev === 'destroyed' && obj.challenge === c.id) {
          c.progress++;
          MB.HUD.toast(`${c.name}: ${this.label(c)}`, '#c7ff8a');
          if (c.progress >= c.total) this.complete(G, c, obj.x, obj.y);
        }
        if (c.type === 'streak') {
          if (ev === 'kill') { c.progress++; if (c.progress >= c.total) this.complete(G, c); }
          if (ev === 'hurt' && c.progress > 0) {
            if (c.progress >= 4) MB.HUD.toast(`${c.name}: chuỗi bị phá (${c.progress})`, '#ff8a7a');
            c.progress = 0;
          }
        }
      }
    },
    update(G, dt) {
      const p = G.player;
      for (const c of G.challenges) {
        if (c.done || c.type !== 'hold') continue;
        const inside = !p.dead && U.dist(p.x, p.y, c.zone.x, c.zone.y) < c.zone.r;
        c.active = inside;
        if (inside) {
          c.progress += dt;
          c.spawnT -= dt;
          if (c.spawnT <= 0 && G.extraAlive() < 7) {
            c.spawnT = c.spawnEvery || 2.4;
            const a = U.rnd(0, U.TAU), R = U.rnd(380, 480);
            G.spawnEnemyAt(U.weighted(c.mix || { zombie: 2, spider: 2 }), c.zone.x + Math.cos(a) * R, c.zone.y + Math.sin(a) * R, { extra: true });
          }
          if (c.progress >= c.time) this.complete(G, c, c.zone.x, c.zone.y);
        }
      }
    },
    complete(G, c, x, y) {
      c.done = true;
      const p = G.player;
      const rx = x != null ? x : p.x + 60, ry = y != null ? y : p.y;
      if (c.reward.weapon) Items.drop(G, 'weapon', rx, ry, c.reward.weapon);
      if (c.reward.mod) Items.drop(G, 'mod', rx, ry, c.reward.mod);
      G.addScore(1000);
      G.banner('THỬ THÁCH HOÀN THÀNH', `${c.name} · phần thưởng đã rơi ra`, 2.4);
      MB.Audio.play('challenge');
      G.burst(rx, ry, '#ffd56a', 40);
    },
    // điểm đánh dấu trên minimap / mũi tên chỉ hướng
    markers(G) {
      const out = [];
      for (const c of G.challenges) {
        if (c.done) continue;
        if (c.type === 'hold') out.push({ x: c.zone.x, y: c.zone.y, color: '#7ef3ff' });
      }
      for (const it of G.pickups) if (it.aid) out.push({ x: it.x, y: it.y, color: '#9dff8a' });
      for (const c of G.challenges) {
        if (c.done) continue;
        if (c.type === 'destroy') for (const o of G.obstacles) if (!o.dead && o.challenge === c.id) out.push({ x: o.x, y: o.y, color: '#c7ff8a' });
      }
      return out;
    },
    // vùng giữ trạm tín hiệu
    drawZones(ctx, G) {
      const t = G.time;
      for (const c of G.challenges) {
        if (c.type !== 'hold') continue;
        const { x, y, r } = c.zone;
        ctx.save();
        ctx.strokeStyle = c.done ? 'rgba(157,255,138,.35)' : c.active ? 'rgba(126,243,255,.85)' : 'rgba(126,243,255,.4)';
        ctx.lineWidth = 3; ctx.setLineDash([14, 10]); ctx.lineDashOffset = -t * 30;
        U.circle(ctx, x, y, r); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = c.active ? 'rgba(126,243,255,.10)' : 'rgba(126,243,255,.04)';
        U.circle(ctx, x, y, r); ctx.fill();
        if (!c.done) {
          ctx.strokeStyle = '#7ef3ff'; ctx.lineWidth = 6;
          ctx.beginPath(); ctx.arc(x, y, r - 10, -Math.PI / 2, -Math.PI / 2 + U.TAU * Math.min(1, c.progress / c.time)); ctx.stroke();
        }
        // cột ăng-ten
        ctx.fillStyle = 'rgba(0,0,0,.3)'; U.ellipse(ctx, x + 4, y + 8, 22, 12); ctx.fill();
        ctx.fillStyle = '#3b4a50'; U.rr(ctx, x - 16, y - 16, 32, 32, 6); ctx.fill();
        ctx.fillStyle = '#56676e'; U.rr(ctx, x - 10, y - 10, 20, 20, 4); ctx.fill();
        const blink = c.done ? '#9dff8a' : (Math.floor(t * 3) % 2 ? '#7ef3ff' : '#2f6c78');
        ctx.fillStyle = blink; ctx.shadowColor = blink; ctx.shadowBlur = 14; U.circle(ctx, x, y, 5); ctx.fill(); ctx.shadowBlur = 0;
        if (c.active && !c.done) {
          const k = (t * 1.2) % 1;
          ctx.strokeStyle = `rgba(126,243,255,${1 - k})`; ctx.lineWidth = 2; U.circle(ctx, x, y, 20 + k * 60); ctx.stroke();
        }
        ctx.restore();
      }
    },
  };
})(window.MB);
