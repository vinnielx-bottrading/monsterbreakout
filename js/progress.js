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
      sv.coins -= c; sv.upg = sv.upg || {}; sv.upg[id] = l + 1; sv.ts = Date.now(); MB.Save.save();
      return true;
    },
    buyGun(id) {
      const sv = MB.Save.data, g = MB.Boss.GUNS.find((x) => x.id === id);
      if (!g || sv.armory.includes(id) || (sv.unlocked || 1) < g.gate - 2 || (sv.coins || 0) < g.price) return false;
      sv.coins -= g.price; sv.armory.push(id); sv.ts = Date.now(); MB.Save.save();
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
      if (sum.nightmare) c = Math.round(c * 1.3);
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

  /* ---------- đánh giá kỹ năng → độ khó Ác mộng (âm thầm) ----------
     Mỗi lần thắng 1 Gate ở Chiến dịch: chấm điểm 0..1 từ độ chính xác, số đòn trúng/phút, máu còn lại,
     số lần thua trước khi qua và việc có phải dùng "đấu lại boss". Qua đủ Gate 1–7 với điểm trung bình cao
     → từ Gate 8 trở đi quái trâu hơn, mạnh hơn, đông tinh nhuệ hơn mà không báo cho người chơi.
     Lưới an toàn: thua 2 lần liền ở 1 Gate thì Gate đó trở lại độ khó thường. */
  const Skill = MB.Skill = {
    PRO: 0.6,
    rate(sum) {
      const mins = Math.max(0.5, sum.time / 60);
      const acc = U.clamp((sum.accuracy || 0) / 55, 0, 1);
      const dodge = U.clamp(1 - (sum.hitsTaken || 0) / mins / 6, 0, 1);
      const hp = U.clamp(sum.hpK || 0, 0, 1);
      const g = MB.Save.gate(sum.gateId), fails = g.fails || 0;
      let k = 0.35 * acc + 0.3 * dodge + 0.2 * hp + 0.15 * (1 - Math.min(1, fails / 3));
      if (sum.retry) k -= 0.15;
      return Math.round(U.clamp(k, 0, 1) * 100) / 100;
    },
    record(sum) {
      if (sum.mode === 'survival') return;
      const g = MB.Save.gate(sum.gateId);
      if (sum.win) { g.skill = this.rate(sum); g.streakFail = 0; }
      else { g.fails = (g.fails || 0) + 1; g.streakFail = (g.streakFail || 0) + 1; }
    },
    // điểm trung bình Gate 1–7 (null nếu chưa qua đủ)
    level() {
      const gs = MB.Save.data.gates; let sum = 0;
      for (let i = 1; i <= 7; i++) { const g = gs[i]; if (!g || g.skill == null) return null; sum += g.skill; }
      return sum / 7;
    },
    nightmareFor(id) {
      if (id < 8 || /[?&]nightmare=0/.test(location.search)) return false;
      if (/[?&]nightmare=1/.test(location.search)) return true;
      const lv = this.level(); if (lv == null || lv < this.PRO) return false;
      const g = MB.Save.data.gates[id];
      return !(g && (g.streakFail || 0) >= 2);
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
