/* Monster Breakout — HUD (DOM), chỉ cập nhật khi giá trị thay đổi */
'use strict';
(function (MB) {
  const $ = (id) => document.getElementById(id);
  const H = MB.HUD = {
    el: {}, last: {},
    init() {
      ['hud', 'hpFill', 'armorFill', 'hpText', 'stFill', 'waveText', 'enemyText', 'scoreText', 'objTitle', 'objText',
        'chList', 'chHead', 'weaponSlots', 'ammoText', 'magText', 'reloadFill', 'modList', 'bossHud', 'bossName', 'bossFill',
        'toasts', 'banner', 'bannerT', 'bannerS', 'dodgeBtn', 'powerText'].forEach((k) => { this.el[k] = $(k); });
      this.el.chHead.addEventListener('click', () => document.getElementById('challenges').classList.toggle('collapsed'));
    },
    set(key, el, prop, val) {
      if (this.last[key] === val) return;
      this.last[key] = val;
      if (prop === 'text') el.textContent = val;
      else if (prop === 'html') el.innerHTML = val;
      else el.style[prop] = val;
    },
    reset() {
      this.last = {};
      this.el.toasts.innerHTML = '';
      this.bossHide();
      if (MB.U.isTouchDevice()) document.getElementById('challenges').classList.add('collapsed');
    },
    objective(t, s) { this.el.objTitle.textContent = t; this.el.objText.textContent = s; },
    banner(t, s, dur) {
      const b = this.el.banner;
      this.el.bannerT.textContent = t; this.el.bannerS.textContent = s || '';
      b.classList.remove('hidden', 'show'); void b.offsetWidth; b.classList.add('show');
      clearTimeout(this.bt);
      this.bt = setTimeout(() => b.classList.add('hidden'), (dur || 2) * 1000);
    },
    toast(html, color) {
      const d = document.createElement('div');
      d.className = 'toast'; d.innerHTML = html;
      if (color) d.style.borderLeftColor = color;
      this.el.toasts.prepend(d);
      while (this.el.toasts.children.length > 4) this.el.toasts.lastChild.remove();
      setTimeout(() => d.classList.add('out'), 2600);
      setTimeout(() => d.remove(), 3100);
    },
    bossShow(name) {
      this.el.bossName.textContent = name.toUpperCase(); this.el.bossHud.classList.remove('hidden'); this.last.boss = null;
      document.querySelector('.objective').classList.add('hidden');
    },
    bossHide() { this.el.bossHud.classList.add('hidden'); document.querySelector('.objective').classList.remove('hidden'); },

    update(G) {
      const p = G.player, e = this.el, W = MB.Weapons;
      this.set('hp', e.hpFill, 'width', (p.hp / p.maxHp * 100).toFixed(1) + '%');
      this.set('ar', e.armorFill, 'width', (p.armor / p.maxArmor * 100).toFixed(1) + '%');
      this.set('hpt', e.hpText, 'text', p.armor > 0 ? `${Math.ceil(p.hp)} +${Math.ceil(p.armor)}` : `${Math.ceil(p.hp)}`);
      this.set('st', e.stFill, 'width', p.stamina.toFixed(0) + '%');
      this.set('stc', e.stFill, 'background', p.exhausted ? '#ff8a5c' : '');
      const d = G.def;
      const waveLabel = G.state === 'boss' || G.state === 'won' ? 'BOSS' : G.state === 'intro' ? 'SẴN SÀNG' : `WAVE ${Math.max(1, G.waveIdx + 1)}/${d.waves.length}`;
      this.set('wave', e.waveText, 'text', waveLabel);
      let left = '';
      if (G.state === 'fight') { const w = d.waves[G.waveIdx]; left = `Quái ${w.total - G.spawned + G.countedAlive()}`; }
      else if (G.state === 'break') left = `Nghỉ ${Math.ceil(G.stateT)}s`;
      else if (G.state === 'preboss') left = `Boss ${Math.ceil(G.stateT)}s`;
      this.set('en', e.enemyText, 'text', left);
      this.set('sc', e.scoreText, 'text', G.score.toLocaleString('vi-VN'));

      // vũ khí
      const sig = p.weapons.map((w) => w.id).join(',') + '|' + p.wi;
      if (this.last.slots !== sig) {
        this.last.slots = sig;
        e.weaponSlots.innerHTML = p.weapons.map((w, i) => `<span class="slot${i === p.wi ? ' on' : ''}">${i + 1}·${W.DEFS[w.id].short}</span>`).join('');
      }
      const w = W.current(p), s = W.stats(p, w);
      this.set('ammo', e.ammoText, 'text', w.reloading ? '···' : String(w.ammo == null ? s.mag : w.ammo));
      this.set('mag', e.magText, 'text', '/' + s.mag);
      this.set('rl', e.reloadFill, 'width', w.reloading ? ((1 - w.reloading / s.reload) * 100).toFixed(0) + '%' : '0%');
      this.set('pw', e.powerText, 'text', `PWR ${W.power(p)} · ${Math.round(s.dmg)} DMG · ${Math.round(60000 / s.rate)} RPM`);
      const modSig = JSON.stringify(p.mods);
      if (this.last.mods !== modSig) {
        this.last.mods = modSig;
        e.modList.innerHTML = Object.keys(p.mods).filter((k) => p.mods[k] > 0)
          .map((k) => { const m = W.MODS[k]; return `<span class="mod" title="${m.name}" style="--c:${m.color}">${m.glyph}${p.mods[k]}</span>`; }).join('');
      }
      if (e.dodgeBtn) this.set('dg', e.dodgeBtn, 'opacity', p.dashCd > 0 || p.stamina < 18 ? '.45' : '1');

      // thử thách
      const chSig = G.challenges.map((c) => c.id + (c.done ? 'D' : MB.Challenges.label(c)) + (c.active ? 'A' : '')).join('|');
      if (this.last.ch !== chSig) {
        this.last.ch = chSig;
        const done = G.challenges.filter((c) => c.done).length;
        e.chHead.innerHTML = `THỬ THÁCH <b>${done}/${G.challenges.length}</b>`;
        e.chList.innerHTML = G.challenges.map((c) => {
          const rw = c.reward.weapon ? MB.Weapons.DEFS[c.reward.weapon].short : MB.Weapons.MODS[c.reward.mod].name;
          return `<div class="ch${c.done ? ' done' : ''}${c.active ? ' active' : ''}"><i>${c.done ? '✓' : '◆'}</i><div><b>${c.name}</b><span>${c.done ? 'Hoàn thành' : c.desc + ' · ' + MB.Challenges.label(c)}</span><em>Thưởng: ${rw}</em></div></div>`;
        }).join('');
      }

      if (G.boss && !G.boss.dead) this.set('boss', e.bossFill, 'width', (G.boss.hp / G.boss.maxHp * 100).toFixed(1) + '%');
    },
  };
})(window.MB);
