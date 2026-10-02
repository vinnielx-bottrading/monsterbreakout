/* Monster Breakout — tiến trình: xu & cửa hàng nâng cấp vĩnh viễn, thẻ nâng cấp sau mỗi wave, combo, rung */
'use strict';
(function (MB) {
  const U = MB.U;

  /* ---------- rung điện thoại ---------- */
  MB.haptic = (pattern) => {
    try { if (MB.Save.data.settings.vibrate && navigator.vibrate) navigator.vibrate(pattern); } catch (e) { /* bỏ qua */ }
  };

  /* ---------- cửa hàng nâng cấp vĩnh viễn (dùng xu) ---------- */
  const SHOP = [
    { id: 'hp', name: 'Thể lực', icon: '❤', desc: (l) => `+12 máu tối đa (đang +${l * 12})`, max: 5, base: 120 },
    { id: 'armor', name: 'Giáp khởi đầu', icon: '⛨', desc: (l) => `Vào trận có sẵn giáp (đang ${l * 12})`, max: 5, base: 120 },
    { id: 'dmg', name: 'Đạn xuyên giáp', icon: '✦', desc: (l) => `+6% sát thương mọi súng (đang +${l * 6}%)`, max: 5, base: 180 },
    { id: 'reload', name: 'Tay nhanh', icon: '⟳', desc: (l) => `Nạp đạn nhanh hơn 8% (đang −${l * 8}%)`, max: 5, base: 100 },
    { id: 'gren', name: 'Túi lựu đạn', icon: '●', desc: (l) => `+1 lựu đạn mang theo (đang ${3 + l})`, max: 2, base: 260 },
    { id: 'dodge', name: 'Phản xạ', icon: '➶', desc: (l) => `Hồi chiêu lộn né −10% (đang −${l * 10}%)`, max: 3, base: 140 },
    { id: 'magnet', name: 'Nam châm', icon: '⊕', desc: (l) => `Tầm hút vật phẩm +40% (đang +${l * 40}%)`, max: 3, base: 80 },
  ];
  const Shop = MB.Shop = {
    SHOP,
    level(id) { return (MB.Save.data.upg || {})[id] || 0; },
    cost(it, lvl) { return Math.round(it.base * (1 + lvl * 0.8)); },
    buy(id) {
      const sv = MB.Save.data, it = SHOP.find((s) => s.id === id), l = this.level(id);
      if (!it || l >= it.max) return false;
      const c = this.cost(it, l);
      if ((sv.coins || 0) < c) return false;
      sv.coins -= c; sv.upg = sv.upg || {}; sv.upg[id] = l + 1; MB.Save.save();
      return true;
    },
    // áp dụng vào nhân vật khi bắt đầu trận
    apply(p) {
      const L = (id) => this.level(id);
      p.maxHp += 12 * L('hp'); p.hp = p.maxHp;
      p.armor = Math.min(p.maxArmor, 12 * L('armor'));
      p.bonus.dmg += 0.06 * L('dmg');
      p.bonus.reload += 0.08 * L('reload');
      p.gMax = MB.Skills.GRENADE.max + L('gren');
      p.dashCdMax *= 1 - 0.1 * L('dodge');
      p.magnet = 1 + 0.4 * L('magnet');
    },
    // xu nhận được sau mỗi trận (thắng hay thua đều có, để người chơi kẹt có thể "cày")
    earn(sum) {
      let c = Math.floor(sum.score / 80) + sum.done.length * 40;
      if (sum.win) c += 120;
      if (sum.mode === 'survival') c += sum.wave * 15;
      return Math.max(5, c);
    },
  };

  /* ---------- thẻ nâng cấp trong trận (chọn 1 trong 3 sau mỗi wave) ---------- */
  const PERKS = [
    { id: 'dmg', name: 'Đạn nặng', icon: '✦', desc: '+15% sát thương', max: 5, apply: (p) => { p.bonus.dmg += 0.15; } },
    { id: 'rate', name: 'Cò nhạy', icon: '⚡', desc: '+12% tốc độ bắn', max: 5, apply: (p) => { p.bonus.rate += 0.12; } },
    { id: 'mag', name: 'Băng đạn lớn', icon: '▤', desc: '+30% sức chứa băng đạn', max: 3, apply: (p) => { p.bonus.mag += 0.3; } },
    { id: 'pierce', name: 'Đạn xuyên', icon: '➹', desc: 'Đạn xuyên thêm 1 quái', max: 2, apply: (p) => { p.bonus.pierce += 1; } },
    { id: 'crit', name: 'Chí mạng', icon: '✸', desc: '12% cơ hội gây ×2,5 sát thương', max: 3, apply: (p) => { p.bonus.crit += 0.12; } },
    { id: 'leech', name: 'Hút máu', icon: '♥', desc: 'Mỗi quái bị hạ hồi 2 máu', max: 3, apply: (p) => { p.bonus.leech += 2; } },
    { id: 'boom', name: 'Xác nổ', icon: '✺', desc: 'Quái bị hạ phát nổ nhỏ, gây sát thương lan', max: 2, apply: (p) => { p.bonus.boom += 1; } },
    { id: 'speed', name: 'Chân nhanh', icon: '»', desc: '+10% tốc độ chạy', max: 3, apply: (p) => { p.speed *= 1.1; } },
    { id: 'firedash', name: 'Vệt lửa', icon: '🔥', desc: 'Lộn né để lại vệt lửa đốt quái', max: 1, apply: (p) => { p.bonus.fireDash = 1; } },
    { id: 'gren', name: 'Kíp nổ nhanh', icon: '●', desc: 'Lựu đạn hồi nhanh hơn 35%, nhận ngay 1 quả', max: 2, apply: (p) => { p.bonus.gRegen += 0.35; p.grenades = Math.min(p.gMax, p.grenades + 1); } },
    { id: 'armor', name: 'Áo giáp', icon: '⛨', desc: 'Giáp tối đa +20, nạp đầy giáp', max: 3, apply: (p) => { p.maxArmor += 20; p.armor = p.maxArmor; } },
    { id: 'heal', name: 'Băng gạc', icon: '✚', desc: 'Hồi 45% máu ngay', max: 99, apply: (p) => { p.hp = Math.min(p.maxHp, p.hp + p.maxHp * 0.45); } },
  ];
  MB.Perks = {
    PERKS,
    // chọn 3 thẻ khác nhau chưa đạt tối đa; máu thấp thì dễ ra "Băng gạc"
    roll(p) {
      const pool = PERKS.filter((k) => (p.perks[k.id] || 0) < k.max);
      const out = [];
      while (out.length < 3 && pool.length) {
        const w = pool.map((k) => (k.id === 'heal' ? (p.hp < p.maxHp * 0.5 ? 4 : 0.6) : 1));
        let r = Math.random() * w.reduce((a, b) => a + b, 0), i = 0;
        while (r > w[i]) { r -= w[i]; i++; }
        out.push(pool.splice(Math.min(i, pool.length - 1), 1)[0]);
      }
      return out;
    },
    take(p, id) {
      const k = PERKS.find((x) => x.id === id);
      if (!k) return;
      p.perks[id] = (p.perks[id] || 0) + 1;
      k.apply(p);
    },
  };

  /* ---------- combo ---------- */
  MB.Combo = {
    reset(G) { G.combo = 0; G.comboT = 0; G.comboBest = G.comboBest || 0; },
    kill(G) {
      G.combo++; G.comboT = 2.6;
      if (G.combo > (G.comboBest || 0)) G.comboBest = G.combo;
      if (G.combo >= 5 && G.combo % 10 === 0) { G.hitstop = Math.max(G.hitstop || 0, 0.06); MB.haptic(20); }
      MB.HUD.combo && MB.HUD.combo(G.combo);
      return 1 + Math.min(G.combo - 1, 20) * 0.05; // hệ số điểm, tối đa ×2
    },
    update(G, dt) {
      if (G.comboT > 0) { G.comboT -= dt; if (G.comboT <= 0) { G.combo = 0; MB.HUD.combo && MB.HUD.combo(0); } }
    },
    break(G) { if (G.combo) { G.combo = 0; G.comboT = 0; MB.HUD.combo && MB.HUD.combo(0); } },
  };
  void U;
})(window.MB);
