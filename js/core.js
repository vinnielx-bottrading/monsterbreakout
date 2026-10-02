/* Monster Breakout — core: tiện ích, va chạm, lưu game, registry */
'use strict';
window.MB = window.MB || {};
(function (MB) {
  const TAU = Math.PI * 2;

  const U = MB.U = {
    TAU,
    rnd: (a, b) => a + Math.random() * (b - a),
    ri: (a, b) => Math.floor(a + Math.random() * (b - a + 1)),
    pick: (arr) => arr[(Math.random() * arr.length) | 0],
    clamp: (v, a, b) => (v < a ? a : v > b ? b : v),
    lerp: (a, b, t) => a + (b - a) * t,
    dist: (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by),
    angDiff(a, b) {
      let d = (b - a) % TAU;
      if (d > Math.PI) d -= TAU;
      if (d < -Math.PI) d += TAU;
      return d;
    },
    weighted(map) {
      let tot = 0;
      for (const k in map) tot += map[k];
      let r = Math.random() * tot;
      for (const k in map) { r -= map[k]; if (r <= 0) return k; }
      return Object.keys(map)[0];
    },
    // RNG có seed để bản đồ giống nhau mỗi lần chơi
    seeded(seed) {
      let a = seed >>> 0;
      return function () {
        a = (a + 0x6D2B79F5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    },
    // roundRect tự viết (Safari cũ không có ctx.roundRect)
    rr(ctx, x, y, w, h, r) {
      r = Math.min(r, w / 2, h / 2);
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    },
    circle(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); },
    ellipse(ctx, x, y, rx, ry, rot) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot || 0, 0, TAU); },
    isTouchDevice: () => ('ontouchstart' in window) || navigator.maxTouchPoints > 0,
  };

  /* ---------- Va chạm ----------
     Obstacle: {shape:'circle', x,y,r} | {shape:'box', x,y,w,h,rot}
     Cờ: noMove (không chặn di chuyển), noShot (đạn bay qua), hp (phá được) */
  const Col = MB.Col = {
    prep(o) {
      if (o.shape === 'box') {
        o.rot = o.rot || 0;
        o.c = Math.cos(o.rot); o.s = Math.sin(o.rot);
        o.hw = o.w / 2; o.hh = o.h / 2;
        o.br = Math.hypot(o.hw, o.hh);
      } else { o.shape = 'circle'; o.br = o.r; }
      return o;
    },
    toLocal(o, x, y) { const dx = x - o.x, dy = y - o.y; return [dx * o.c + dy * o.s, -dx * o.s + dy * o.c]; },
    toWorld(o, lx, ly) { return [o.x + lx * o.c - ly * o.s, o.y + lx * o.s + ly * o.c]; },
    overlap(o, x, y, r) {
      if (Math.abs(x - o.x) > o.br + r || Math.abs(y - o.y) > o.br + r) return false;
      if (o.shape === 'circle') return (x - o.x) ** 2 + (y - o.y) ** 2 < (r + o.r) ** 2;
      const [lx, ly] = Col.toLocal(o, x, y);
      const cx = U.clamp(lx, -o.hw, o.hw), cy = U.clamp(ly, -o.hh, o.hh);
      return (lx - cx) ** 2 + (ly - cy) ** 2 < r * r;
    },
    // Đẩy thực thể hình tròn ra khỏi vật cản. Trả về true nếu có va chạm.
    push(ent, r, o) {
      if (Math.abs(ent.x - o.x) > o.br + r || Math.abs(ent.y - o.y) > o.br + r) return false;
      if (o.shape === 'circle') {
        let dx = ent.x - o.x, dy = ent.y - o.y;
        const R = r + o.r, d2 = dx * dx + dy * dy;
        if (d2 >= R * R) return false;
        let d = Math.sqrt(d2);
        if (d < 1e-4) { dx = 1; dy = 0; d = 1; }
        ent.x = o.x + dx / d * R; ent.y = o.y + dy / d * R;
        return true;
      }
      let [lx, ly] = Col.toLocal(o, ent.x, ent.y);
      if (Math.abs(lx) < o.hw && Math.abs(ly) < o.hh) {
        const px = o.hw - Math.abs(lx), py = o.hh - Math.abs(ly);
        if (px < py) lx = (lx < 0 ? -1 : 1) * (o.hw + r);
        else ly = (ly < 0 ? -1 : 1) * (o.hh + r);
      } else {
        const cx = U.clamp(lx, -o.hw, o.hw), cy = U.clamp(ly, -o.hh, o.hh);
        const dx = lx - cx, dy = ly - cy, d2 = dx * dx + dy * dy;
        if (d2 >= r * r) return false;
        const d = Math.sqrt(d2) || 1;
        lx = cx + dx / d * r; ly = cy + dy / d * r;
      }
      const w = Col.toWorld(o, lx, ly);
      ent.x = w[0]; ent.y = w[1];
      return true;
    },
    // Đoạn thẳng vs vật cản → t ∈ [0,1] hoặc -1
    seg(o, x1, y1, x2, y2, pad) {
      pad = pad || 0;
      if (o.shape === 'circle') {
        const R = o.r + pad, dx = x2 - x1, dy = y2 - y1, fx = x1 - o.x, fy = y1 - o.y;
        const a = dx * dx + dy * dy, b = 2 * (fx * dx + fy * dy), c = fx * fx + fy * fy - R * R;
        if (c < 0) return 0;
        if (a < 1e-9) return -1;
        const disc = b * b - 4 * a * c;
        if (disc < 0) return -1;
        const t = (-b - Math.sqrt(disc)) / (2 * a);
        return t >= 0 && t <= 1 ? t : -1;
      }
      const [ax, ay] = Col.toLocal(o, x1, y1), [bx, by] = Col.toLocal(o, x2, y2);
      const hw = o.hw + pad, hh = o.hh + pad, dx = bx - ax, dy = by - ay;
      const p = [-dx, dx, -dy, dy], q = [ax + hw, hw - ax, ay + hh, hh - ay];
      let t0 = 0, t1 = 1;
      for (let i = 0; i < 4; i++) {
        if (Math.abs(p[i]) < 1e-9) { if (q[i] < 0) return -1; }
        else {
          const t = q[i] / p[i];
          if (p[i] < 0) { if (t > t1) return -1; if (t > t0) t0 = t; }
          else { if (t < t0) return -1; if (t < t1) t1 = t; }
        }
      }
      return t0;
    },
    raycast(list, x1, y1, x2, y2, filter) {
      let best = null, bt = 2;
      const minx = Math.min(x1, x2), maxx = Math.max(x1, x2), miny = Math.min(y1, y2), maxy = Math.max(y1, y2);
      for (const o of list) {
        if (o.dead || (filter && !filter(o))) continue;
        if (o.x + o.br < minx || o.x - o.br > maxx || o.y + o.br < miny || o.y - o.br > maxy) continue;
        const t = Col.seg(o, x1, y1, x2, y2);
        if (t >= 0 && t < bt) { bt = t; best = o; }
      }
      return best ? { o: best, t: bt } : null;
    },
    segCircle(x1, y1, x2, y2, cx, cy, r) {
      const dx = x2 - x1, dy = y2 - y1, l2 = dx * dx + dy * dy;
      let t = l2 ? ((cx - x1) * dx + (cy - y1) * dy) / l2 : 0;
      t = U.clamp(t, 0, 1);
      const px = x1 + dx * t, py = y1 + dy * t;
      return (px - cx) ** 2 + (py - cy) ** 2 < r * r;
    },
  };

  /* ---------- Lưu game (localStorage, luôn bọc try/catch) ---------- */
  const KEY = 'monster_breakout_save_v1';
  const defaults = () => ({
    unlocked: 1,
    gates: {},
    armory: ['rifle'],
    coins: 0, upg: {},
    settings: { view: '3d', aimMode: 'auto', aimSpeed: 'normal', sfx: true, music: true, shake: true, dmgNum: true, quality: 'auto', vibrate: true, mute: false },
  });
  MB.Save = {
    data: defaults(),
    load() {
      try {
        const s = JSON.parse(localStorage.getItem(KEY) || 'null');
        const d = defaults();
        if (s) {
          Object.assign(d, s);
          d.settings = Object.assign(defaults().settings, s.settings || {});
        }
        this.data = d;
      } catch (e) { this.data = defaults(); }
      return this.data;
    },
    save() { try { localStorage.setItem(KEY, JSON.stringify(this.data)); } catch (e) { /* ignore */ } },
    blank: () => defaults(),
    gate(id) {
      if (!this.data.gates[id]) this.data.gates[id] = { best: 0, done: [], cleared: false, bestTime: 0 };
      return this.data.gates[id];
    },
    reset() { this.data = defaults(); this.save(); },
  };

  /* ---------- Registry ---------- */
  MB.Gates = MB.Gates || { meta: [], defs: {} };
  MB.registerGate = (def) => { MB.Gates.defs[def.id] = def; };
})(window.MB);
