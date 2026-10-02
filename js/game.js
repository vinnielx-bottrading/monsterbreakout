/* Monster Breakout — runtime của một Gate: wave, va chạm, đạn, hiệu ứng, camera, vẽ */
'use strict';
(function (MB) {
  const U = MB.U, Col = MB.Col;
  const GROUND_SCALE = 0.5;

  const G = MB.G = {
    running: false, paused: false, over: false,
    canvas: null, ctx: null, W: 0, H: 0, dpr: 1, zoom: 1,
    cam: { x: 0, y: 0 }, shakeAmt: 0, sx: 0, sy: 0,
    lowFx: false,

    init(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.resize();
    },
    resize() {
      const lowQ = this.quality() === 'low';
      this.W = innerWidth; this.H = innerHeight;
      this.dpr = Math.min(devicePixelRatio || 1, lowQ ? 1.25 : 2);
      this.canvas.width = Math.round(this.W * this.dpr);
      this.canvas.height = Math.round(this.H * this.dpr);
      this.zoom = U.clamp(Math.sqrt(this.W * this.H) / 900, U.isTouchDevice() ? 0.74 : 0.62, 1.25);
      this.mmW = U.isTouchDevice() ? Math.round(U.clamp(this.W * 0.12, 88, 130)) : Math.round(U.clamp(this.W * 0.16, 110, 180));
      this.mmDirty = true;
      if (MB.R3 && MB.R3.renderer) MB.R3.resize(this);
    },
    quality() {
      const q = MB.Save.data.settings.quality;
      return q === 'auto' ? (U.isTouchDevice() ? 'low' : 'high') : q;
    },

    /* ================== bắt đầu Gate ================== */
    start(def, opts) {
      opts = opts || {};
      this.def = def;
      this.mode = opts.mode === 'survival' ? 'survival' : 'campaign';
      this.endless = !!opts.endless;
      // độ khó tự điều chỉnh (âm thầm): người chơi giỏi ở Gate 1–7 → Ác mộng từ Gate 8
      this.nightmare = this.mode === 'campaign' && MB.Skill.nightmareFor(def.id);
      this.hitstop = 0; this.perkT = 0; this.lastBossPhase = null;
      this.lowFx = this.quality() === 'low';
      this.time = 0; this.over = false; this.overT = 0; this.reported = false; this.paused = false;
      this.enemies = []; this.bullets = []; this.ebullets = []; this.pickups = []; this.particles = [];
      this.decals = []; this.texts = []; this.fx = []; this.obstacles = []; this.hazards = [];
      this.bossRetryUsed = false; this.retryOffer = false;
      this.boss = null; this.score = 0; this.hurtFlash = 0; this.wantFire = false;
      this.stats = { shots: 0, bhits: 0, kills: 0, mods: 0, dmgTaken: 0, hitsTaken: 0 };
      this.world = { w: def.world.w, h: def.world.h };

      for (const o of def.obstacles) this.addObstacle({ ...o });
      for (const c of def.crates || []) this.addObstacle({ kind: 'crate', shape: 'box', x: c.x, y: c.y, w: 56, h: 56, rot: c.rot || 0, hp: 45, maxHp: 45, loot: c.loot || true });
      for (const h of def.hazards || []) this.hazards.push({ ...h });

      const p = this.player = MB.Hero.create(def.start.x, def.start.y);
      const armory = MB.Save.data.armory;
      for (const id of MB.Weapons.ORDER) if (armory.includes(id)) p.weapons.push(MB.Weapons.make(id));
      if (!p.weapons.length) p.weapons.push(MB.Weapons.make('rifle'));
      p.aim = 0;
      const carry = opts.carry;
      if (carry) {
        // chuỗi Bất tận: mang trạng thái Hunter sang khu vực mới (không áp lại nâng cấp cửa hàng)
        for (const k of ['hp', 'maxHp', 'armor', 'maxArmor', 'weapons', 'wi', 'mods', 'perks', 'bonus', 'gMax', 'grenades', 'speed', 'magnet', 'dashCdMax']) if (carry.p[k] !== undefined) p[k] = carry.p[k];
        for (const w of p.weapons) w.reloading = 0;
      } else MB.Shop.apply(p);
      MB.Combo.reset(this); this.comboBest = carry ? carry.comboBest : 0;

      this.nav = null; this.navDirty = true; this.navT = 0;
      MB.Skills.init(p);
      this.aidT = 0; this.lockE = null; this.grenades = []; this.actors = [];
      MB.Challenges.init(this, def.challenges);
      this.buildGround();
      this.mmDirty = true;

      this.waveIdx = -1; this.state = 'intro'; this.stateT = 2.6;
      this.spawned = 0; this.spawnT = 0;
      this.gs = {};
      if (def.setup) def.setup(this);
      MB.Story.startGate(this);

      this.snapCamera();
      this.viewRect = null;
      this.set3D(!!(MB.App.view3d && def.view3d && MB.R3 && MB.R3.ready));
      if (carry) {
        this.score = carry.score; this.stats = carry.stats; this.time = carry.time; this.stage = carry.stage;
        this.waveIdx = carry.waveIdx; this.state = 'break'; this.stateT = 3.2;
      } else this.stage = 1;
      this.running = true;
      this.banner(def.title, def.subtitle, 2.6);
      MB.HUD.reset(this);
      MB.HUD.objective(def.intro.title, def.intro.text);
      MB.Audio.startMusic(); MB.Audio.intensity(0.1);
    },

    addObstacle(o) {
      Col.prep(o);
      if (o.hp) o.maxHp = o.maxHp || o.hp;
      this.obstacles.push(o);
      this.mmDirty = true;
      return o;
    },

    buildGround() {
      const d = this.def;
      const cv = document.createElement('canvas');
      cv.width = Math.ceil(d.world.w * GROUND_SCALE); cv.height = Math.ceil(d.world.h * GROUND_SCALE);
      const g = cv.getContext('2d');
      g.scale(GROUND_SCALE, GROUND_SCALE);
      d.buildGround(g, d.world.w, d.world.h, U.seeded(d.seed || 7));
      this.ground = cv;
    },

    /* ================== tiện ích cho quái / gate ================== */
    shake(n) { if (MB.Save.data.settings.shake) this.shakeAmt = Math.min(18, this.shakeAmt + n); },
    addScore(n) { this.score += Math.round(n); },
    inView(x, y, m) {
      const v = this.viewRect;
      if (this.r3on && v) return x > v.x0 - m && x < v.x1 + m && y > v.y0 - m && y < v.y1 + m;
      const vw = this.W / this.zoom, vh = this.H / this.zoom;
      return x > this.cam.x - m && x < this.cam.x + vw + m && y > this.cam.y - m && y < this.cam.y + vh + m;
    },
    los(x1, y1, x2, y2) { return !Col.raycast(this.obstacles, x1, y1, x2, y2, (o) => !o.noShot); },
    collide(e) {
      if (!e.fly && !e.burrow) {
        for (let pass = 0; pass < 2; pass++) {
          for (const o of this.obstacles) {
            if (o.dead || o.noMove) continue;
            if (Col.push(e, e.r, o)) e.bumped = o;
          }
        }
      }
      e.x = U.clamp(e.x, e.r + 8, this.world.w - e.r - 8);
      e.y = U.clamp(e.y, e.r + 8, this.world.h - e.r - 8);
    },
    particle(p) {
      const cap = this.lowFx ? 220 : 480;
      if (this.particles.length > cap) this.particles.shift();
      p.max = p.life; this.particles.push(p);
    },
    burst(x, y, color, n, spd) {
      n = this.lowFx ? Math.ceil(n * 0.55) : n;
      for (let i = 0; i < n; i++) {
        const a = Math.random() * U.TAU, s = Math.random() * (spd || 140) + 30;
        this.particle({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.35 + Math.random() * 0.35, color, r: 1 + Math.random() * 2.6, drag: 0.92 });
      }
    },
    sparks(x, y, a, color, n) {
      for (let i = 0; i < n; i++) {
        const aa = a + U.rnd(-0.7, 0.7), s = U.rnd(120, 320);
        this.particle({ x, y, vx: Math.cos(aa) * s, vy: Math.sin(aa) * s, life: U.rnd(0.12, 0.25), color, r: 1.4, type: 'spark', drag: 0.88 });
      }
    },
    decal(x, y, color, size) {
      if (this.decals.length > 160) this.decals.shift();
      const blobs = [];
      for (let i = 0; i < 5; i++) blobs.push([U.rnd(-size, size) * 0.8, U.rnd(-size, size) * 0.8, U.rnd(size * 0.25, size * 0.6)]);
      const dc = { x, y, color, blobs };
      if (this.r3on) { MB.R3.onDecal(dc); return; }
      this.decals.push(dc);
    },
    text(x, y, txt, color, size) {
      if (this.texts.length > 40) this.texts.shift();
      this.texts.push({ x, y, txt, color, size: size || 14, life: 0.9, vy: -55 });
    },
    banner(title, sub, dur) { MB.HUD.banner(title, sub, dur); },
    fxMuzzle(x, y, a, k) {
      for (let i = 0; i < 3 * k; i++) this.particle({ x, y, vx: Math.cos(a + U.rnd(-0.4, 0.4)) * U.rnd(80, 220), vy: Math.sin(a + U.rnd(-0.4, 0.4)) * U.rnd(80, 220), life: 0.12, color: '#ffe7a3', r: 1.6, type: 'spark', drag: 0.85 });
    },
    addFx(fx) { fx.t = 0; this.fx.push(fx); return fx; },
    addHazard(h) { this.hazards.push(h); return h; },

    enemyShot(o) {
      const sp = o.speed || 280;
      this.ebullets.push({ x: o.x, y: o.y, px: o.x, py: o.y, vx: Math.cos(o.a) * sp, vy: Math.sin(o.a) * sp, r: o.r || 7, dmg: o.dmg || 8, life: o.life || 2.5, kind: o.kind || 'orb', owner: o.owner, pass: !!o.pass, onEnd: o.onEnd, color: o.color });
    },
    drawTelegraphLine(ctx, x, y, a, len, k) {
      ctx.save();
      ctx.strokeStyle = `rgba(255,80,80,${0.25 + k * 0.5})`;
      ctx.lineWidth = 2 + k * 6; ctx.lineCap = 'round';
      ctx.setLineDash([10, 8]);
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len); ctx.stroke();
      ctx.restore();
    },
    // vòng cảnh báo trên mặt đất, gọi onDone khi hết thời gian
    telegraphCircle(x, y, r, dur, onDone, color) {
      return this.addFx({
        layer: 'ground', life: dur,
        draw(ctx, fx) {
          const k = fx.t / fx.life;
          ctx.fillStyle = color || 'rgba(255,70,70,.12)'; U.circle(ctx, x, y, r); ctx.fill();
          ctx.strokeStyle = 'rgba(255,90,90,.7)'; ctx.lineWidth = 2; U.circle(ctx, x, y, r); ctx.stroke();
          ctx.fillStyle = 'rgba(255,90,90,.28)'; U.circle(ctx, x, y, r * k); ctx.fill();
        },
        end: onDone,
      });
    },
    // sóng xung kích lan rộng: trúng nếu người chơi ở trong vành sóng (lộn né để tránh)
    shockwave(x, y, maxR, dur, dmg, color) {
      const G = this;
      MB.Audio.play('slam'); this.shake(12);
      return this.addFx({
        layer: 'top', life: dur, hit: false,
        update(fx) {
          const R = maxR * (fx.t / fx.life), p = G.player;
          const d = U.dist(p.x, p.y, x, y);
          if (!fx.hit && Math.abs(d - R) < 20 + p.r * 0.5) { fx.hit = true; G.hurtPlayer(dmg, { x, y }); }
        },
        draw(ctx, fx) {
          const k = fx.t / fx.life, R = maxR * k;
          ctx.strokeStyle = color || `rgba(255,190,120,${1 - k})`; ctx.lineWidth = 16 * (1 - k) + 4;
          U.circle(ctx, x, y, R); ctx.stroke();
          ctx.strokeStyle = `rgba(255,255,255,${0.5 * (1 - k)})`; ctx.lineWidth = 2; U.circle(ctx, x, y, R); ctx.stroke();
        },
      });
    },

    // vụ nổ dùng chung (lựu đạn, súng phóng lựu, thùng hoá chất, quái tự nổ, thiên thạch...)
    explosion(x, y, r, dmg, o) {
      o = o || {};
      MB.Audio.play('boom'); this.shake(o.shake || 9);
      if (!o.small && U.dist(x, y, this.player.x, this.player.y) < 320) MB.haptic(25);
      this.burst(x, y, o.color || '#ffb347', o.small ? 14 : 26, 300); this.burst(x, y, '#5a5048', 10, 160);
      this.decal(x, y, o.decal || 'rgba(20,16,12,.7)', r * 0.22);
      const col = o.ring || '255,170,70';
      this.addFx({
        layer: 'ground', life: 0.42,
        draw(ctx, fx) {
          const k = fx.t / fx.life, R = r * (0.4 + k * 0.7);
          ctx.fillStyle = `rgba(${col},${0.5 * (1 - k)})`; U.circle(ctx, x, y, R); ctx.fill();
          ctx.strokeStyle = `rgba(255,235,180,${1 - k})`; ctx.lineWidth = 6 * (1 - k) + 1; U.circle(ctx, x, y, R); ctx.stroke();
        },
      });
      if (o.enemies !== false) for (const e of this.enemies) {
        if (e.dead || e === o.source) continue;
        const d = U.dist(e.x, e.y, x, y);
        if (d > r + e.r) continue;
        this.damageEnemy(e, dmg * (1 - Math.min(1, d / r) * 0.5), Math.atan2(e.y - y, e.x - x), e.boss ? 0 : (o.knock == null ? 380 : o.knock));
      }
      if (o.obstacles !== false) for (const ob of this.obstacles) if (!ob.dead && ob.hp && U.dist(ob.x, ob.y, x, y) < r + ob.br) this.damageObstacle(ob, o.objDmg || dmg);
      if (o.player) { const p = this.player; if (!p.dead && U.dist(p.x, p.y, x, y) < r + p.r) this.hurtPlayer(o.player, { x, y }); }
    },

    /* ================== quái ================== */
    spawnEnemyAt(type, x, y, opts) {
      opts = opts || {};
      const def = MB.Enemies.types[type];
      if (!def) { console.warn('Unknown enemy', type); return null; }
      const e = {
        type, def, x, y, vx: 0, vy: 0, kx: 0, ky: 0, r: def.r, hp: def.hp, maxHp: def.hp, speed: def.speed, dmg: def.dmg, score: def.score,
        fly: !!def.fly, t: U.rnd(0, 100), face: Math.atan2(this.player.y - y, this.player.x - x), flash: 0, atkCd: 0.6,
        spawnT: opts.boss ? 1.4 : 0.6, extra: !!opts.extra, boss: !!def.boss, elite: !!opts.elite, dead: false, state: null, st: 0,
      };
      const sc = this.def.scale;
      if (sc && !e.boss) { e.hp *= sc.hp || 1; e.maxHp = e.hp; e.dmg = Math.round(e.dmg * (sc.dmg || 1)); e.score = Math.round(e.score * (sc.hp || 1)); }
      if (e.elite) { e.hp *= 2.4; e.maxHp = e.hp; e.r *= 1.15; e.speed *= 1.06; e.score *= 3; e.dmg = Math.round(e.dmg * 1.3); }
      if (def.init) def.init(e, this);
      if (this.nightmare) {
        const m = e.boss ? { hp: 1.3, dmg: 1.15, spd: 1.04 } : { hp: 1.35, dmg: 1.2, spd: 1.07 };
        e.hp *= m.hp; e.maxHp = e.hp; e.dmg = Math.round(e.dmg * m.dmg); e.speed *= m.spd; e.score = Math.round(e.score * 1.25);
      }
      if (opts.hpMul && opts.hpMul !== 1) { e.hp *= opts.hpMul; e.maxHp *= opts.hpMul; e.score = Math.round(e.score * (1 + (opts.hpMul - 1) * 0.5)); }
      if (!e.fly) this.collide(e);
      this.enemies.push(e);
      if (e.boss) {
        this.boss = e;
        MB.HUD.bossShow(def.name || type);
      }
      return e;
    },
    countedAlive() { let n = 0; for (const e of this.enemies) if (!e.dead && !e.extra && !e.boss) n++; return n; },
    extraAlive() { let n = 0; for (const e of this.enemies) if (!e.dead && e.extra) n++; return n; },

    pickSpawn() {
      const p = this.player, pts = this.def.spawnPoints;
      const ok = pts.filter((s) => U.dist(s.x, s.y, p.x, p.y) > 480);
      const offscreen = ok.filter((s) => !this.inView(s.x, s.y, 40));
      const list = offscreen.length ? offscreen : ok.length ? ok : pts;
      for (let tries = 0; tries < 10; tries++) {
        const s = U.pick(list);
        const pos = { x: s.x + U.rnd(-90, 90), y: s.y + U.rnd(-90, 90), r: 22 };
        if (!this.obstacles.some((o) => !o.dead && !o.noMove && Col.overlap(o, pos.x, pos.y, 24))) return pos;
      }
      return U.pick(list);
    },

    damageEnemy(e, dmg, ang, knock, quiet) {
      if (e.dead || e.invuln) return;
      if (e.def.armorFn) dmg = e.def.armorFn(e, dmg, this, ang);
      e.hp -= dmg; if (!quiet) e.flash = 0.08;
      if (quiet) { if (e.hp <= 0) this.killEnemy(e); return; }
      if (MB.Save.data.settings.dmgNum && !this.lowFx || (MB.Save.data.settings.dmgNum && Math.random() < 0.5)) {
        this.text(e.x + U.rnd(-8, 8), e.y - e.r - 6, Math.round(dmg), dmg >= 30 ? '#ffd56a' : '#ffffff', dmg >= 30 ? 15 : 12);
      }
      if (!e.boss && knock) { const k = knock * (e.def.knockMul == null ? 1 : e.def.knockMul); e.kx += Math.cos(ang) * k; e.ky += Math.sin(ang) * k; }
      MB.Audio.play('hit');
      if (e.hp <= 0) this.killEnemy(e);
    },
    killEnemy(e) {
      e.dead = true;
      const mul = e.boss ? 1 : MB.Combo.kill(this);
      this.addScore(e.score * mul);
      this.stats.kills++;
      const P = this.player, B = P.bonus;
      if (B.leech && !P.dead) P.hp = Math.min(P.maxHp, P.hp + B.leech);
      if (e.elite) { this.hitstop = Math.max(this.hitstop, 0.05); MB.haptic(15); }
      if (B.boom && !e.boss && (this.boomDepth || 0) < 2) {
        this.boomDepth = (this.boomDepth || 0) + 1;
        this.explosion(e.x, e.y, 55 + 20 * B.boom, 18 + 14 * B.boom, { small: true, obstacles: false, source: e, knock: 160, shake: 3 });
        this.boomDepth--;
      }
      const blood = e.def.blood || '#3f6b25';
      this.decal(e.x, e.y, blood, e.r * 0.9);
      this.burst(e.x, e.y, e.def.gore || '#a8e07a', e.boss ? 60 : 16, e.boss ? 260 : 150);
      MB.Audio.play('kill');
      if (!e.boss) {
        if (e.elite) { MB.Items.drop(this, 'mod', e.x, e.y, MB.Items.randomMod(this.player)); if (Math.random() < 0.35) MB.Items.drop(this, 'grenade', e.x, e.y); }
        else {
          const r = Math.random();
          const low = this.player.hp < this.player.maxHp * 0.4;
          if (r < (low ? 0.14 : 0.055)) MB.Items.drop(this, 'med', e.x, e.y);
          else if (r < 0.085) MB.Items.drop(this, 'armor', e.x, e.y);
        }
      }
      MB.Challenges.event(this, 'kill', e);
      if (e.def.onDeath) e.def.onDeath(e, this);
      if (e.boss) this.bossDown(e);
    },
    bossDown(e) {
      this.addScore(5000);
      this.shake(18); this.hitstop = 0.22; MB.haptic([90, 40, 140]);
      if (this.mode === 'survival') return this.survivalBossDown(e);
      for (let i = 0; i < 6; i++) setTimeout(() => { if (this.running) this.burst(e.x + U.rnd(-60, 60), e.y + U.rnd(-60, 60), '#ffd56a', 30, 300); }, i * 120);
      MB.HUD.bossHide();
      this.state = 'won'; this.stateT = 2.8;
      this.banner('GATE CLEARED', `${e.def.name} đã bị tiêu diệt`, 2.8);
      MB.Audio.play('win'); MB.Audio.intensity(0.1);
      // kẻ địch còn lại tan biến
      for (const o of this.enemies) if (!o.dead && o !== e) { o.dead = true; this.burst(o.x, o.y, '#a8e07a', 8); }
      this.ebullets.length = 0;
    },

    // sinh tồn: hạ boss chưa phải hết — nghỉ, chọn thẻ rồi đánh tiếp
    survivalBossDown(e) {
      MB.HUD.bossHide();
      this.banner('BOSS BỊ HẠ', `Wave ${this.waveIdx + 1} · quái sẽ mạnh hơn nữa`, 2.6);
      MB.Audio.play('win'); MB.Audio.intensity(0.3);
      for (const o of this.enemies) if (!o.dead && o !== e) { o.dead = true; this.burst(o.x, o.y, '#a8e07a', 8); }
      this.ebullets.length = 0;
      const p = this.player;
      MB.Items.drop(this, 'med', e.x - 30, e.y); MB.Items.drop(this, 'armor', e.x + 30, e.y);
      MB.Items.drop(this, 'mod', e.x, e.y + 30, MB.Items.randomMod(p));
      this.state = 'break'; this.stateT = 6; this.perkT = 1.2;
      if (this.endless) { this.endlessNext = true; this.banner('KHU VỰC ĐÃ QUÉT SẠCH', 'Chuẩn bị tiến sang khu vực tiếp theo…', 2.6); }
    },
    // trạng thái mang sang khu vực mới (chuỗi Bất tận)
    carry() {
      const p = this.player, keep = {};
      for (const k of ['hp', 'maxHp', 'armor', 'maxArmor', 'weapons', 'wi', 'mods', 'perks', 'bonus', 'gMax', 'grenades', 'speed', 'magnet', 'dashCdMax']) keep[k] = p[k];
      keep.hp = Math.min(p.maxHp, p.hp + p.maxHp * 0.25); // nghỉ chân giữa 2 khu vực: hồi 25% máu
      return { p: keep, score: this.score, stats: this.stats, time: this.time, waveIdx: this.waveIdx, comboBest: this.comboBest || 0, stage: (this.stage || 1) + 1 };
    },
    // thông số wave: chiến dịch dùng đúng bảng của Gate; sinh tồn tăng dần vô hạn
    getWave(i) {
      const W = this.def.waves;
      if (this.mode !== 'survival') return W[i];
      const k = i + 1, base = W[Math.min(i, W.length - 1)];
      let mix = base.mix;
      if (i >= W.length) { mix = {}; for (const w of W) for (const t in w.mix) mix[t] = (mix[t] || 0) + w.mix[t]; }
      return {
        mix,
        total: Math.round(base.total * (0.55 + 0.16 * k)),
        maxAlive: Math.min(Math.round(base.maxAlive * 1.8), base.maxAlive + Math.floor(k / 2)),
        interval: [base.interval[0] * Math.max(0.45, 1 - 0.035 * k), base.interval[1] * Math.max(0.45, 1 - 0.035 * k)],
        elite: Math.min(0.3, (base.elite || 0) + 0.015 * k),
        hpMul: 1 + 0.09 * i,
      };
    },

    damageObstacle(o, dmg) {
      if (o.dead || !o.hp) return;
      o.hp -= dmg; o.flash = 0.08;
      if (o.hp <= 0) {
        o.dead = true; this.mmDirty = true;
        MB.Audio.play('break'); this.shake(4);
        this.burst(o.x, o.y, o.kind === 'crate' ? '#c0915a' : '#c7ff8a', 26, 200);
        this.navDirty = true;
        if (o.loot) MB.Items.randomLoot(this, o.x, o.y);
        if (o.challenge) MB.Challenges.event(this, 'destroyed', o);
        if (this.def.onObstacleDestroyed) this.def.onObstacleDestroyed(this, o);
      }
    },

    hurtPlayer(d, src) {
      const p = this.player;
      if (p.dead || this.over || this.state === 'won' || p.reviveT > 0) return;
      const dot = src && src.dot;
      if (!dot) {
        if (p.iframes > 0) return;
        p.iframes = 0.55; p.hurtT = 0.2; this.hurtFlash = 0.35;
        MB.Combo.break(this); MB.haptic(35);
        this.shake(7); MB.Audio.play('hurt');
        this.stats.hitsTaken++;
        MB.Challenges.event(this, 'hurt');
        if (src && src.x != null) {
          const a = Math.atan2(p.y - src.y, p.x - src.x);
          p.vx += Math.cos(a) * 280; p.vy += Math.sin(a) * 280;
        }
      }
      let dmg = d;
      if (p.armor > 0) { const ab = Math.min(p.armor, dmg); p.armor -= ab; dmg -= ab; }
      p.hp -= dmg; this.stats.dmgTaken += d;
      if (p.hp <= 0) {
        p.hp = 0; p.dead = true; MB.haptic(260);
        this.burst(p.x, p.y, '#ff6b6b', 40, 220);
        MB.Audio.play('lose'); MB.Audio.intensity(0);
        // gục ở trận boss lần đầu → được 1 cơ hội đấu lại boss, không phải chơi lại cả Gate
        this.retryOffer = this.mode === 'campaign' && (this.state === 'boss' || this.state === 'preboss') && !this.bossRetryUsed;
        this.banner('NHIỆM VỤ THẤT BẠI', this.retryOffer ? 'Còn 1 cơ hội đấu lại Boss' : 'Hunter đã gục ngã', 2);
        this.finish(false, 2.2);
      }
    },
    // đấu lại boss: hồi sinh tại chỗ, đầy máu/giáp/đạn/kỹ năng, dọn trận đấu, boss xuất hiện lại sau 3 giây
    retryBoss() {
      const p = this.player;
      this.bossRetryUsed = true; this.retryOffer = false;
      this.over = false; this.win = false; this.reported = false; this.overT = 0;
      p.dead = false; p.deadT = 0; p.dash = null; p.hp = p.maxHp; if (p.maxArmor) p.armor = p.maxArmor;
      p.burnT = 0; p.slow = 0; p.vx = 0; p.vy = 0; p.iframes = 3; p.reviveT = 3;
      for (const w of p.weapons) { w.ammo = null; w.reloading = 0; }
      p.grenades = Math.max(p.grenades, p.gMax || 3); p.novaCd = 0; MB.Combo.break(this);
      for (const e of this.enemies) e.dead = true;
      this.boss = null; MB.HUD.bossHide();
      this.ebullets.length = 0; this.fx.length = 0;
      for (let i = this.hazards.length - 1; i >= 0; i--) if (this.hazards[i].life != null) this.hazards.splice(i, 1);
      this.burst(p.x, p.y, '#7ef3ff', 40, 260);
      this.state = 'preboss'; this.stateT = 3;
      this.banner('ĐẤU LẠI BOSS', 'Cơ hội cuối · đã hồi đầy máu, đạn và kỹ năng', 2.6);
      MB.HUD.objective('ĐẤU LẠI', 'Boss xuất hiện lại sau 3 giây. Bất tử trong 3 giây để rời vùng nguy hiểm.');
      MB.Audio.play('wave'); MB.Audio.intensity(0.6);
    },
    finish(win, delay) { if (this.over) return; this.over = true; this.win = win; this.overT = delay; },

    /* ================== wave ================== */
    startWave(i) {
      this.waveIdx = i; this.state = 'fight'; this.spawned = 0; this.spawnT = 0.8;
      const ob = (this.mode === 'survival' ? { title: 'SINH TỒN', text: 'Trụ càng lâu càng tốt. Cứ 5 wave có một boss.' } : this.def.objectives[i]) || {};
      this.banner(`WAVE ${i + 1}`, ob.title || '', 2);
      MB.HUD.objective(ob.title || `WAVE ${i + 1}`, ob.text || '');
      MB.Audio.play('wave');
      MB.Audio.intensity(0.2 + i * 0.15);
    },
    updateWaves(dt) {
      const d = this.def;
      this.stateT -= dt;
      if (this.state === 'intro' && this.stateT <= 0) this.startWave(0);
      else if (this.state === 'fight') {
        const w = this.getWave(this.waveIdx);
        this.spawnT -= dt;
        if (this.spawned < w.total && this.countedAlive() < w.maxAlive && this.spawnT <= 0) {
          const pos = this.pickSpawn();
          const elite = Math.random() < (w.elite || 0) + (this.nightmare ? 0.08 : 0);
          this.spawnEnemyAt(U.weighted(w.mix), pos.x, pos.y, { elite, hpMul: w.hpMul });
          this.spawned++;
          this.spawnT = U.rnd(w.interval[0], w.interval[1]) * (this.nightmare ? 0.85 : 1);
        }
        if (this.spawned >= w.total && this.countedAlive() === 0) {
          this.addScore(500);
          const p = this.player;
          MB.Items.drop(this, p.hp < p.maxHp * 0.8 ? 'med' : 'armor', p.x + U.rnd(-60, 60), p.y + U.rnd(-60, 60));
          this.perkT = 1.0; // mở thẻ nâng cấp sau 1 giây
          const survBoss = this.mode === 'survival' && (this.waveIdx + 1) % 5 === 0;
          if (this.mode === 'survival' ? !survBoss : this.waveIdx < d.waves.length - 1) {
            this.state = 'break'; this.stateT = 5;
            this.banner('WAVE CLEARED', 'Nghỉ 5 giây · nhặt thiết bị, phá thùng tiếp tế', 2.4);
            MB.HUD.objective('TẠM NGHỈ', 'Tranh thủ làm thử thách để tăng sức mạnh súng.');
          } else {
            this.state = 'preboss'; this.stateT = 4;
            this.banner('CẢNH BÁO', `${MB.Enemies.types[d.boss.type].name} đang tới`, 3);
            MB.HUD.objective('CHUẨN BỊ', 'Boss sắp xuất hiện. Kiểm tra đạn và máu.');
          }
        }
      } else if (this.state === 'break' && this.stateT <= 0) {
        if (this.endlessNext) { this.endlessNext = false; this.state = 'travel'; MB.App.endlessAdvance(); }
        else this.startWave(this.waveIdx + 1);
      }
      else if (this.state === 'preboss' && this.stateT <= 0) {
        this.state = 'boss';
        // boss xuất hiện ở hướng đấu trường nhưng không quá xa người chơi
        const b = d.boss, p = this.player;
        let bx = b.x, by = b.y;
        const dd = U.dist(bx, by, p.x, p.y);
        if (dd > 750 && !b.fixed) { bx = p.x + (bx - p.x) / dd * 650; by = p.y + (by - p.y) / dd * 650; }
        this.spawnEnemyAt(b.type, bx, by, { boss: true, hpMul: this.mode === 'survival' ? 1 + 0.35 * Math.floor(this.waveIdx / 5) : 1 });
        const ob = (this.mode === 'survival' ? { title: 'BOSS', text: 'Hạ boss để tiếp tục sinh tồn.' } : d.objectives[d.waves.length]) || {};
        MB.HUD.objective(ob.title || 'BOSS', ob.text || '');
        MB.Audio.play('boss'); this.shake(14); MB.Audio.intensity(1);
      } else if (this.state === 'won' && this.stateT <= 0) {
        const p = this.player;
        this.addScore(2000 + Math.round(p.hp) * 10);
        this.finish(true, 0.3);
      }
    },

    /* ================== aim ================== */
    computeAim(dt) {
      const I = MB.Input, p = this.player, st = MB.Save.data.settings;
      if (p.dead) { this.wantFire = false; return; }
      // tốc độ xoay tối đa (rad/giây): tránh xoay giật, dễ ngắm hơn
      let rate = { slow: 5, normal: 8, fast: 14 }[st.aimSpeed] || 8;
      let want = null, fire = I.fire();
      if (I.mode === 'kb') {
        rate *= 2.2;
        let wx, wy;
        if (this.r3on) { const w = MB.R3.screenToGround(I.mouse.x, I.mouse.y, this); wx = w.x; wy = w.y; }
        else { wx = I.mouse.x / this.zoom + this.cam.x; wy = I.mouse.y / this.zoom + this.cam.y; }
        // chuột quá sát nhân vật thì giữ hướng cũ (tránh xoay vòng loạn)
        const mouseA = U.dist(wx, wy, p.x, p.y) > 34 ? Math.atan2(wy - p.y, wx - p.x) : null;
        const km = st.aimModeKb || 'manual';
        this.lockE = null;
        if (km === 'auto' && !I.mouse.down) {
          // tự khoá quái gần nhất & tự bắn; giữ chuột trái thì bắn theo chuột như thường
          const tg = this.autoTarget(mouseA);
          if (tg) {
            this.lockE = tg; want = Math.atan2(tg.y - p.y, tg.x - p.x);
            if (Math.abs(U.angDiff(p.aim, want)) < 0.3) fire = true;
          } else want = mouseA;
        } else if (mouseA != null) want = km === 'assist' ? this.assist(mouseA) : mouseA;
      } else if (I.tapPoint()) {
        // chạm-để-bắn: quay ngay về điểm chạm và bắn (không giới hạn tốc độ xoay)
        const tp = I.tapPoint();
        let wx, wy;
        if (this.r3on) { const w = MB.R3.screenToGround(tp.x, tp.y, this); wx = w.x; wy = w.y; }
        else { wx = tp.x / this.zoom + this.cam.x; wy = tp.y / this.zoom + this.cam.y; }
        if (U.dist(wx, wy, p.x, p.y) > 20) {
          want = Math.atan2(wy - p.y, wx - p.x);
          if ((st.aimMode || 'auto') === 'assist') want = this.assist(want);
          p.aim = want; fire = true;
        }
        if (I.tapT > 0) I.tapT -= dt;
        this.lockE = null;
      } else {
        const v = I.aimVec(), mode = st.aimMode || 'auto';
        const stickA = v ? Math.atan2(v.y, v.x) : null;
        if (mode === 'auto') {
          const tg = this.autoTarget(stickA);
          this.lockE = tg;
          if (tg) {
            want = Math.atan2(tg.y - p.y, tg.x - p.x);
            // tự bắn khi đã quay gần đúng hướng mục tiêu
            if (Math.abs(U.angDiff(p.aim, want)) < 0.3) fire = true;
          } else if (stickA != null) want = stickA;
        } else if (stickA != null) {
          want = mode === 'assist' ? this.assist(stickA) : stickA;
        }
        // không ngắm gì: quay mặt theo hướng chạy (chế độ Hỗ trợ còn nắn về quái gần hướng đó)
        if (want == null && Math.hypot(I.move.x, I.move.y) > 0.2) {
          const ma = Math.atan2(I.move.y, I.move.x);
          want = mode === 'assist' ? this.assist(ma) : ma;
        }
      }
      if (want != null) {
        const d = U.angDiff(p.aim, want);
        // quay đầu gấp: lệch lớn (quái sau lưng, đổi hướng chạy) thì xoay nhanh hơn nhiều, lệch nhỏ vẫn mượt
        const r = Math.abs(d) > 0.9 ? rate * 2.6 : Math.abs(d) > 0.45 ? rate * 1.6 : rate;
        const mx = r * dt; p.aim += U.clamp(d, -mx, mx);
      }
      this.wantFire = fire;
    },
    // ngắm tự động: chọn quái gần nhất trong tầm nhìn, ưu tiên hướng gậy ngắm và mục tiêu đang khoá
    autoTarget(prefA) {
      const p = this.player;
      let best = null, bs = 1e9;
      for (const e of this.enemies) {
        if (e.dead || e.spawnT > 0 || e.hidden) continue;
        const d = U.dist(e.x, e.y, p.x, p.y);
        if (d > 540) continue;
        let sc = d;
        // quái đã áp sát (dưới 230) là mối đe doạ: ưu tiên mạnh, kể cả khi ở sau lưng
        const near = d < 230;
        if (near) sc -= (230 - d) * 1.6;
        if (prefA != null && !(near && d < 150)) { const da = Math.abs(U.angDiff(prefA, Math.atan2(e.y - p.y, e.x - p.x))); if (da > 1.1) continue; sc += da * 320; }
        // giữ khoá mục tiêu cũ cho đỡ giật, nhưng không giữ khi nó ở xa còn quái khác đã áp sát
        if (e === this.lockE) sc -= 70;
        if (e.boss) sc -= 60;
        if (sc < bs && this.los(p.x, p.y, e.x, e.y)) { bs = sc; best = e; }
      }
      if (!best) for (const o of this.obstacles) {
        // không có quái: tự bắn mục tiêu thử thách / thùng ở gần
        if (o.dead || !o.hp) continue;
        const d = U.dist(o.x, o.y, p.x, p.y);
        if (d < 300 && d < bs && (prefA == null || Math.abs(U.angDiff(prefA, Math.atan2(o.y - p.y, o.x - p.x))) < 0.8)) { bs = d; best = o; }
      }
      return best;
    },
    assist(a) {
      const p = this.player;
      let best = null, bd = 0.42;
      for (const e of this.enemies) {
        if (e.dead || e.spawnT > 0 || e.hidden) continue;
        const d = U.dist(e.x, e.y, p.x, p.y);
        if (d > 560) continue;
        const da = Math.abs(U.angDiff(a, Math.atan2(e.y - p.y, e.x - p.x)));
        const score = da + d / 4000 - (e === this.lockE ? 0.15 : 0);
        if (score < bd && this.los(p.x, p.y, e.x, e.y)) { bd = score; best = e; }
      }
      this.lockE = best;
      if (!best) return a;
      return a + U.angDiff(a, Math.atan2(best.y - p.y, best.x - p.x)) * 0.85;
    },

    /* ================== update ================== */
    update(dt) {
      // khựng hình ngắn khi hạ quái lớn (cảm giác "đã tay")
      if (this.hitstop > 0) { this.hitstop -= dt; MB.Input.poll(); return; }
      this.time += dt;
      const p = this.player;
      MB.Input.poll();
      MB.Combo.update(this, dt);
      if (this.perkT > 0 && !this.over && !p.dead) { this.perkT -= dt; if (this.perkT <= 0) { MB.App.offerPerks(); return; } }
      const bb = this.boss;
      if (bb && !bb.dead) {
        if (this.lastBossPhase != null && bb.phase != null && bb.phase !== this.lastBossPhase) {
          this.hitstop = 0.12; this.shake(14); MB.haptic([40, 30, 60]); MB.Audio.play('boss'); MB.Audio.intensity(1);
          this.banner('BOSS NỔI ĐIÊN', `Giai đoạn ${bb.phase}`, 1.6);
        }
        this.lastBossPhase = bb.phase;
      } else this.lastBossPhase = null;

      if (this.over) {
        this.overT -= dt;
        if (this.overT <= 0 && !this.reported) {
          this.reported = true;
          if (this.retryOffer) MB.App.offerBossRetry(); else MB.App.onGateEnd(this.summary());
        }
      }

      if (p.reviveT > 0) p.reviveT -= dt;
      this.computeAim(dt);
      MB.Hero.update(p, this, dt);

      // hazards
      p.inVirus = false; p.zoneMul = 1; p.slip = false;
      for (let i = this.hazards.length - 1; i >= 0; i--) {
        const h = this.hazards[i];
        if (h.life != null) { h.life -= dt; if (h.life <= 0) { this.hazards.splice(i, 1); continue; } }
        if (p.dead) continue;
        const inside = U.dist(p.x, p.y, h.x, h.y) < h.r;
        if (!inside) continue;
        if (h.kind === 'virus') p.inVirus = true;
        if (h.dps) this.hurtPlayer(h.dps * dt, { dot: true });
        if (h.kind === 'web') p.slow = 0.25;
        if (h.slowMul) p.zoneMul = Math.min(p.zoneMul, h.slowMul);
        if (h.slip) p.slip = true;
        if (h.burn) p.burnT = Math.max(p.burnT || 0, h.burn);
      }
      // bỏng (lửa, dung nham)
      if (p.burnT > 0 && !p.dead) {
        p.burnT -= dt; this.hurtPlayer(5 * dt, { dot: true });
        if (Math.random() < 0.4) this.particle({ x: p.x + U.rnd(-10, 10), y: p.y + U.rnd(-10, 10), vx: 0, vy: -40, life: 0.4, color: '#ff8a3c', r: 2.5 });
      }

      MB.Weapons.update(p, this, dt);
      MB.Skills.update(this, dt);
      this.updateAid(dt);
      this.updateNav(dt);
      if (!this.over) { this.updateWaves(dt); MB.Story.update(this, dt); }
      this.updateEnemies(dt);
      this.updateObstacles(dt);
      this.updateBullets(dt);
      this.updateEnemyBullets(dt);
      this.updateFx(dt);
      MB.Items.update(this, dt);
      MB.Challenges.update(this, dt);
      if (this.def.update) this.def.update(this, dt);

      for (let i = this.particles.length - 1; i >= 0; i--) {
        const q = this.particles[i];
        q.x += q.vx * dt; q.y += q.vy * dt;
        const dr = Math.pow(q.drag || 0.92, dt * 60);
        q.vx *= dr; q.vy *= dr; q.life -= dt;
        if (q.rot != null) q.rot += dt * 12;
        if (q.life <= 0) this.particles.splice(i, 1);
      }
      for (let i = this.texts.length - 1; i >= 0; i--) {
        const t = this.texts[i];
        t.y += t.vy * dt; t.vy *= 0.94; t.life -= dt;
        if (t.life <= 0) this.texts.splice(i, 1);
      }
      this.hurtFlash = Math.max(0, this.hurtFlash - dt);
      this.updateCamera(dt);
      MB.HUD.update(this);
    },

    /* ---- dẫn đường (flow field): quái đi vòng tường/nhà/kênh nước để tới người chơi ---- */
    buildNav() {
      const cs = 50, cols = Math.ceil(this.world.w / cs), rows = Math.ceil(this.world.h / cs);
      const blocked = new Uint8Array(cols * rows);
      for (const o of this.obstacles) {
        if (o.dead || o.noMove) continue;
        const x0 = Math.max(0, Math.floor((o.x - o.br - 20) / cs)), x1 = Math.min(cols - 1, Math.floor((o.x + o.br + 20) / cs));
        const y0 = Math.max(0, Math.floor((o.y - o.br - 20) / cs)), y1 = Math.min(rows - 1, Math.floor((o.y + o.br + 20) / cs));
        for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) if (Col.overlap(o, cx * cs + cs / 2, cy * cs + cs / 2, 14)) blocked[cy * cols + cx] = 1;
      }
      this.nav = { cs, cols, rows, blocked, dist: new Int32Array(cols * rows), q: new Int32Array(cols * rows) };
      this.navDirty = false; this.navT = 0;
    },
    updateNav(dt) {
      if (this.navDirty || !this.nav) this.buildNav();
      this.navT -= dt;
      if (this.navT > 0) return;
      this.navT = 0.35;
      const N = this.nav, p = this.player, { cols, rows, cs, blocked, dist, q } = N;
      dist.fill(-1);
      let sx = U.clamp(Math.floor(p.x / cs), 0, cols - 1), sy = U.clamp(Math.floor(p.y / cs), 0, rows - 1);
      let head = 0, tail = 0;
      dist[sy * cols + sx] = 0; q[tail++] = sy * cols + sx;
      while (head < tail) {
        const c = q[head++], cx = c % cols, cy = (c / cols) | 0, d = dist[c] + 1;
        if (cx > 0) { const n = c - 1; if (dist[n] < 0 && !blocked[n]) { dist[n] = d; q[tail++] = n; } }
        if (cx < cols - 1) { const n = c + 1; if (dist[n] < 0 && !blocked[n]) { dist[n] = d; q[tail++] = n; } }
        if (cy > 0) { const n = c - cols; if (dist[n] < 0 && !blocked[n]) { dist[n] = d; q[tail++] = n; } }
        if (cy < rows - 1) { const n = c + cols; if (dist[n] < 0 && !blocked[n]) { dist[n] = d; q[tail++] = n; } }
      }
    },
    // điểm kế tiếp trên đường tới người chơi (null nếu không cần / không có)
    navStep(e) {
      const N = this.nav; if (!N) return null;
      const { cols, rows, cs, dist } = N;
      const cx = U.clamp(Math.floor(e.x / cs), 0, cols - 1), cy = U.clamp(Math.floor(e.y / cs), 0, rows - 1);
      let best = -1, bd = dist[cy * cols + cx] >= 0 ? dist[cy * cols + cx] : 1e9;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const nx = cx + dx, ny = cy + dy; if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
        const n = ny * cols + nx, d = dist[n];
        if (d < 0) continue;
        if (dx && dy && (dist[cy * cols + nx] < 0 || dist[ny * cols + cx] < 0)) continue; // không cắt góc
        const dd = d + (dx && dy ? 0.4 : 0);
        if (dd < bd) { bd = dd; best = n; }
      }
      if (best < 0) return null;
      return { x: (best % cols) * cs + cs / 2, y: ((best / cols) | 0) * cs + cs / 2 };
    },

    // thả tiếp tế y tế khi máu thấp
    updateAid(dt) {
      const p = this.player;
      this.aidT = (this.aidT || 0) - dt;
      if (p.dead || this.over || this.state === 'won' || this.state === 'intro' || this.aidT > 0 || p.hp > p.maxHp * 0.35) return;
      this.aidT = 40;
      let x = p.x, y = p.y;
      for (let i = 0; i < 12; i++) {
        const a = U.rnd(0, U.TAU), d = U.rnd(150, 230);
        const tx = U.clamp(p.x + Math.cos(a) * d, 80, this.world.w - 80), ty = U.clamp(p.y + Math.sin(a) * d, 80, this.world.h - 80);
        if (!this.obstacles.some((o) => !o.dead && !o.noMove && MB.Col.overlap(o, tx, ty, 30))) { x = tx; y = ty; break; }
      }
      const drop = (kind) => this.pickups.push({ kind, x: x + U.rnd(-40, 40), y: y + U.rnd(-40, 40), vx: 0, vy: 0, z: 280, vz: 0, t: 0, life: 45, aid: true });
      drop('med'); drop('med');
      if (Math.random() < 0.6) drop('armor'); else drop('grenade');
      MB.HUD.toast('<b>TIẾP TẾ Y TẾ</b> đang rơi xuống gần bạn (mũi tên xanh)', '#9dff8a');
      MB.Audio.play('heal');
    },

    updateEnemies(dt) {
      const p = this.player, list = this.enemies;
      for (const e of list) {
        if (e.dead) continue;
        e.flash -= dt;
        if (e.spawnT > 0) { e.spawnT -= dt; continue; }
        if (e.burnT > 0) {
          e.burnT -= dt; this.damageEnemy(e, 9 * dt, 0, 0, true);
          if (Math.random() < 0.3) this.particle({ x: e.x + U.rnd(-8, 8), y: e.y + U.rnd(-8, 8), vx: 0, vy: -30, life: 0.35, color: '#ff8a3c', r: 2.4 });
          if (e.dead) continue;
        }
        if (!e.fly && !e.boss) for (const h of this.hazards) if (h.enemyDps && U.dist(e.x, e.y, h.x, h.y) < h.r) this.damageEnemy(e, h.enemyDps * dt, 0, 0, true);
        if (e.dead) continue;
        if (e.stunT > 0) { e.stunT -= dt; MB.Enemies.stop(e, dt, 8); }
        else if (!p.dead && !this.over) e.def.update(e, this, dt);
        else MB.Enemies.stop(e, dt, 4);
        e.x += (e.vx + e.kx) * dt; e.y += (e.vy + e.ky) * dt;
        const kd = Math.exp(-9 * dt); e.kx *= kd; e.ky *= kd;
        e.bumped = null;
        this.collide(e);
        e.atkCd -= dt;
        if (!p.dead && !e.def.noContact && !e.hidden && !e.airborne && e.atkCd <= 0) {
          const d = U.dist(e.x, e.y, p.x, p.y);
          if (d < e.r + p.r - 2) {
            this.hurtPlayer(e.dmg, e);
            if (e.def.onContact) e.def.onContact(e, this);
            e.atkCd = 0.85;
            const a = Math.atan2(e.y - p.y, e.x - p.x);
            e.kx += Math.cos(a) * 160; e.ky += Math.sin(a) * 160;
          }
        }
      }
      // tách quái không chồng lên nhau
      for (let i = 0; i < list.length; i++) {
        const a = list[i]; if (a.dead || a.spawnT > 0) continue;
        for (let j = i + 1; j < list.length; j++) {
          const b = list[j]; if (b.dead || b.spawnT > 0 || a.fly !== b.fly) continue;
          const dx = b.x - a.x, dy = b.y - a.y, R = a.r + b.r;
          if (Math.abs(dx) > R || Math.abs(dy) > R) continue;
          const d = Math.hypot(dx, dy) || 0.01;
          if (d >= R) continue;
          const ov = (R - d) / 2, nx = dx / d, ny = dy / d;
          const wa = a.boss ? 0 : b.boss ? 2 : 1, wb = b.boss ? 0 : a.boss ? 2 : 1;
          a.x -= nx * ov * wa; a.y -= ny * ov * wa; b.x += nx * ov * wb; b.y += ny * ov * wb;
        }
      }
      for (let i = list.length - 1; i >= 0; i--) if (list[i].dead) list.splice(i, 1);
    },

    updateObstacles(dt) {
      const p = this.player;
      for (const o of this.obstacles) {
        if (o.dead) continue;
        if (o.flash > 0) o.flash -= dt;
        if (o.spawner && !p.dead && this.state !== 'won') {
          const sp = o.spawner;
          if (U.dist(o.x, o.y, p.x, p.y) < (sp.range || 800)) {
            sp.t -= dt;
            if (sp.t <= 0 && this.extraAlive() < (sp.cap || 6)) {
              sp.t = sp.every;
              const a = U.rnd(0, U.TAU);
              this.spawnEnemyAt(sp.type, o.x + Math.cos(a) * (o.br + 26), o.y + Math.sin(a) * (o.br + 26), { extra: true });
            }
          }
        }
      }
    },

    updateBullets(dt) {
      const list = this.bullets;
      for (let i = list.length - 1; i >= 0; i--) {
        const b = list[i];
        b.px = b.x; b.py = b.y;
        b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
        if (b.flame) { b.r += dt * 26; b.vx *= Math.pow(0.2, dt); b.vy *= Math.pow(0.2, dt); }
        if (b.life <= 0 || b.x < -50 || b.y < -50 || b.x > this.world.w + 50 || b.y > this.world.h + 50) {
          if (b.explode && b.life <= 0) this.explosion(b.x, b.y, b.explode.r, b.explode.dmg, { knock: b.explode.knock, small: true });
          list.splice(i, 1); continue;
        }
        let removed = false;
        const ang = Math.atan2(b.vy, b.vx);
        for (const e of this.enemies) {
          if (e.dead || e.hidden || b.hits.includes(e)) continue;
          if (Col.segCircle(b.px, b.py, b.x, b.y, e.x, e.y, e.r + b.r)) {
            b.hits.push(e);
            this.stats.bhits++;
            if (b.explode) { this.explosion(b.x, b.y, b.explode.r, b.explode.dmg, { knock: b.explode.knock, small: true }); list.splice(i, 1); removed = true; break; }
            this.damageEnemy(e, b.dmg, ang, b.knock, b.flame);
            if (b.burn) e.burnT = 2.2;
            if (b.chain) this.chainZap(e, b.chain, b.dmg);
            if (!b.flame) this.sparks(b.x, b.y, ang + Math.PI, e.def.gore || '#c9f59a', 3);
            if (b.pierce > 0) { b.pierce--; b.dmg *= 0.8; }
            else { list.splice(i, 1); removed = true; break; }
          }
        }
        if (removed) continue;
        const hit = Col.raycast(this.obstacles, b.px, b.py, b.x, b.y, (o) => !o.noShot);
        if (hit) {
          const hx = b.px + (b.x - b.px) * hit.t, hy = b.py + (b.y - b.py) * hit.t;
          if (b.explode) { this.explosion(hx, hy, b.explode.r, b.explode.dmg, { knock: b.explode.knock, small: true }); list.splice(i, 1); continue; }
          if (!b.flame) this.sparks(hx, hy, ang + Math.PI, hit.o.hp ? '#ffe3a8' : '#d4c7a1', 3);
          if (hit.o.hp) this.damageObstacle(hit.o, b.dmg);
          if (hit.o.onShot) hit.o.onShot(this, hit.o, b);
          list.splice(i, 1);
        }
      }
    },

    // tia sét lan sang quái gần (súng plasma)
    chainZap(src, ch, dmg) {
      let from = src; const hit = [src];
      for (let n = 0; n < ch.n; n++) {
        let best = null, bd = ch.r;
        for (const e of this.enemies) { if (e.dead || e.hidden || hit.includes(e)) continue; const d = U.dist(e.x, e.y, from.x, from.y); if (d < bd) { bd = d; best = e; } }
        if (!best) break;
        const x1 = from.x, y1 = from.y, x2 = best.x, y2 = best.y;
        this.addFx({ layer: 'top', life: 0.18, draw(ctx, fx) {
          ctx.strokeStyle = `rgba(200,160,255,${1 - fx.t / fx.life})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x1, y1);
          for (let k = 1; k < 6; k++) ctx.lineTo(U.lerp(x1, x2, k / 6) + U.rnd(-10, 10), U.lerp(y1, y2, k / 6) + U.rnd(-10, 10));
          ctx.lineTo(x2, y2); ctx.stroke(); } });
        this.damageEnemy(best, dmg * ch.dmg, Math.atan2(y2 - y1, x2 - x1), 20);
        hit.push(best); from = best;
      }
    },

    updateEnemyBullets(dt) {
      const p = this.player, list = this.ebullets;
      for (let i = list.length - 1; i >= 0; i--) {
        const b = list[i];
        b.px = b.x; b.py = b.y;
        b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
        let end = b.life <= 0 || b.x < -40 || b.y < -40 || b.x > this.world.w + 40 || b.y > this.world.h + 40;
        if (!end && !b.pass && Col.raycast(this.obstacles, b.px, b.py, b.x, b.y, (o) => !o.noShot)) {
          end = true; this.burst(b.x, b.y, '#c9d8b0', 4, 80);
        }
        if (!end && !p.dead && Col.segCircle(b.px, b.py, b.x, b.y, p.x, p.y, p.r + b.r - 2)) {
          if (p.iframes <= 0) { this.hurtPlayer(b.dmg, b.owner && !b.owner.dead ? b.owner : { x: b.px, y: b.py }); end = true; if (b.onHit) b.onHit(this, b); }
        }
        if (end) { if (b.onEnd) b.onEnd(this, b); list.splice(i, 1); }
      }
    },

    updateFx(dt) {
      for (let i = this.fx.length - 1; i >= 0; i--) {
        const f = this.fx[i];
        f.t += dt;
        if (f.update) f.update(f, dt, this);
        if (f.t >= f.life) { this.fx.splice(i, 1); if (f.end) f.end(this, f); }
      }
    },

    snapCamera() {
      const vw = this.W / this.zoom, vh = this.H / this.zoom;
      this.cam.x = U.clamp(this.player.x - vw / 2, 0, Math.max(0, this.world.w - vw));
      this.cam.y = U.clamp(this.player.y - vh / 2, 0, Math.max(0, this.world.h - vh));
    },
    updateCamera(dt) {
      const p = this.player, I = MB.Input;
      const vw = this.W / this.zoom, vh = this.H / this.zoom;
      let lx = 0, ly = 0;
      if (I.mode === 'kb') {
        lx = U.clamp((I.mouse.x - this.W / 2) / this.zoom * 0.22, -150, 150);
        ly = U.clamp((I.mouse.y - this.H / 2) / this.zoom * 0.22, -110, 110);
      } else if (this.wantFire) { lx = Math.cos(p.aim) * 90; ly = Math.sin(p.aim) * 70; }
      let tx = p.x + lx - vw / 2, ty = p.y + ly - vh / 2;
      tx = this.world.w < vw ? (this.world.w - vw) / 2 : U.clamp(tx, 0, this.world.w - vw);
      ty = this.world.h < vh ? (this.world.h - vh) / 2 : U.clamp(ty, 0, this.world.h - vh);
      const k = 1 - Math.exp(-7 * dt);
      this.cam.x += (tx - this.cam.x) * k; this.cam.y += (ty - this.cam.y) * k;
      this.shakeAmt *= Math.exp(-9 * dt);
      this.sx = U.rnd(-1, 1) * this.shakeAmt; this.sy = U.rnd(-1, 1) * this.shakeAmt;
    },

    summary() {
      const done = this.challenges.filter((c) => c.done).map((c) => c.id);
      return {
        gateId: this.def.id, win: this.win, score: this.score, mode: this.mode, wave: this.waveIdx + 1, comboBest: this.comboBest || 0, time: this.time, kills: this.stats.kills,
        accuracy: this.stats.shots ? Math.min(100, Math.round(this.stats.bhits / this.stats.shots * 100)) : 0,
        done, totalChallenges: this.challenges.length, mods: MB.Weapons.power(this.player), hitsTaken: this.stats.hitsTaken,
        hpK: this.player.maxHp ? Math.max(0, this.player.hp) / this.player.maxHp : 0, retry: !!this.bossRetryUsed, endless: !!this.endless, stage: this.stage || 1, nightmare: !!this.nightmare,
      };
    },

    // màu đạn hiển thị: map sáng (tuyết, cát) → đổi sang màu đậm, bão hoà để nổi bật
    bulletCol(c) {
      if (!this.def || !this.def.bright) return c;
      const cache = this._bc || (this._bc = {});
      if (cache[c]) return cache[c];
      const n = parseInt(c.slice(1), 16), r = (n >> 16) / 255, g = ((n >> 8) & 255) / 255, bl = (n & 255) / 255;
      const mx = Math.max(r, g, bl), mn = Math.min(r, g, bl); let hh = 0;
      if (mx !== mn) { const d = mx - mn; hh = mx === r ? ((g - bl) / d) % 6 : mx === g ? (bl - r) / d + 2 : (r - g) / d + 4; hh *= 60; if (hh < 0) hh += 360; }
      if (hh > 30 && hh < 70) hh = 24; // vàng nhạt → cam đỏ (dễ thấy nhất trên nền trắng)
      return (cache[c] = `hsl(${hh | 0},100%,${hh > 180 && hh < 260 ? 42 : 48}%)`);
    },
    /* ---------- bật / tắt 3D (đổi giữa trận, mất WebGL) ---------- */
    set3D(on) {
      const R = MB.R3;
      on = !!(on && this.def && this.def.view3d && R && R.ready);
      if (on) {
        try { R.init(this); if (R.lost) on = false; else { R.resize(this); R.build(this); } }
        catch (err) { console.warn('[3D] không dựng được, dùng 2D', err); on = false; }
      }
      if (!on && R && R.scene) R.teardown();
      this.r3on = on; this.viewRect = null;
      document.getElementById('game3d').classList.toggle('hidden', !on);
      return on;
    },
    on3DLost() {
      if (!this.r3on) return;
      this.r3on = false; this.viewRect = null; this.lost3d = true;
      document.getElementById('game3d').classList.add('hidden');
      MB.HUD.toast('Máy thiếu bộ nhớ đồ hoạ — tạm chuyển 2D. Có thể đổi lại trong menu Tạm dừng.', '#ff8a5c');
    },
    on3DRestored() {
      if (!this.lost3d) return;
      this.lost3d = false;
      if (this.running && !this.over && MB.App.view3d) { MB.R3.scene = null; this.set3D(true); }
    },

    /* ================== vẽ ================== */
    draw() {
      if (this.r3on) {
        try { MB.R3.render(this); MB.R3.drawOverlay(this); return; }
        catch (err) { console.error('[3D] lỗi vẽ, chuyển 2D', err); this.set3D(false); MB.HUD.toast('Đồ hoạ 3D lỗi — đã chuyển sang 2D.', '#ff8a5c'); }
      }
      const ctx = this.ctx, z = this.zoom, dpr = this.dpr;
      const vw = this.W / z, vh = this.H / z;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = this.def.bg || '#050b07'; ctx.fillRect(0, 0, this.W, this.H);
      ctx.setTransform(dpr * z, 0, 0, dpr * z, (-this.cam.x * z + this.sx) * dpr, (-this.cam.y * z + this.sy) * dpr);

      // nền
      const sx = U.clamp(this.cam.x - 20, 0, this.world.w), sy = U.clamp(this.cam.y - 20, 0, this.world.h);
      const sw = Math.min(this.world.w - sx, vw + 40), sh = Math.min(this.world.h - sy, vh + 40);
      if (sw > 0 && sh > 0) ctx.drawImage(this.ground, sx * GROUND_SCALE, sy * GROUND_SCALE, sw * GROUND_SCALE, sh * GROUND_SCALE, sx, sy, sw, sh);

      for (const d of this.decals) {
        if (!this.inView(d.x, d.y, 40)) continue;
        ctx.fillStyle = d.color; ctx.globalAlpha = 0.45;
        for (const b of d.blobs) { U.circle(ctx, d.x + b[0], d.y + b[1], b[2]); ctx.fill(); }
      }
      ctx.globalAlpha = 1;

      const t = this.time;
      for (const h of this.hazards) if (this.inView(h.x, h.y, h.r)) (MB.Props.hazard[h.kind] || MB.Props.hazardGeneric)(ctx, h, t, this);
      if (this.def.drawUnder) this.def.drawUnder(this, ctx);
      MB.Challenges.drawZones(ctx, this);
      for (const f of this.fx) if (f.layer === 'ground') f.draw(ctx, f, this);
      MB.Items.draw(ctx, this);

      for (const o of this.obstacles) {
        if (o.dead || !this.inView(o.x, o.y, o.br + 20)) continue;
        const fn = MB.Props.draw[o.kind];
        if (fn) fn(ctx, o, t, this);
        if (o.target && o.hp < o.maxHp) this.drawHpBar(ctx, o.x, o.y - o.br - 12, 46, o.hp / o.maxHp, '#c7ff8a');
      }

      // đạn người chơi (vệt sáng)
      ctx.lineCap = 'round';
      for (const b of this.bullets) {
        if (b.flame) {
          const k = Math.max(0, b.life / b.max0);
          ctx.globalAlpha = 0.25 + k * 0.5; ctx.fillStyle = k > 0.5 ? '#ffd27a' : '#ff7a2c';
          U.circle(ctx, b.x, b.y, b.r); ctx.fill(); ctx.globalAlpha = 1; continue;
        }
        // vệt đạn: viền sẫm (nổi trên nền sáng như tuyết/cát) + lõi màu + tâm trắng
        const col = this.bulletCol(b.color), tx = b.x - b.vx * 0.045, ty = b.y - b.vy * 0.045;
        ctx.strokeStyle = 'rgba(16,10,6,.55)'; ctx.lineWidth = b.r * 1.3 + 3;
        ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(b.x, b.y); ctx.stroke();
        ctx.strokeStyle = col; ctx.lineWidth = b.r * 1.3; ctx.globalAlpha = 0.85;
        ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(b.x, b.y); ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.fillStyle = 'rgba(16,10,6,.6)'; U.circle(ctx, b.x, b.y, b.r + 1.6); ctx.fill();
        ctx.fillStyle = col; U.circle(ctx, b.x, b.y, b.r); ctx.fill();
        ctx.fillStyle = '#fffbe8'; U.circle(ctx, b.x, b.y, b.r * 0.45); ctx.fill();
      }

      if (this.lockE && !this.lockE.dead) {
        const L = this.lockE, r = (L.r || L.br) + 10;
        ctx.strokeStyle = 'rgba(255,90,90,.85)'; ctx.lineWidth = 2;
        ctx.beginPath(); for (let i = 0; i < 4; i++) { const a = this.time * 2 + i * Math.PI / 2; ctx.moveTo(L.x + Math.cos(a) * r, L.y + Math.sin(a) * r); ctx.arc(L.x, L.y, r, a, a + 0.8); } ctx.stroke();
      }
      for (const e of this.enemies) if (!e.dead && this.inView(e.x, e.y, e.r + 80)) this.drawEnemy(ctx, e);

      if (MB.Input.mode !== 'kb') MB.Hero.drawAimLine(ctx, this.player, this);
      MB.Hero.draw(ctx, this.player, this);

      for (const b of this.ebullets) this.drawEnemyBullet(ctx, b);
      MB.Skills.draw2D(ctx, this);
      for (const a of this.actors) { const fn = MB.Props.actor[a.kind]; if (fn && this.inView(a.x, a.y, (a.r || 40) + 60)) fn(ctx, a, this); }
      for (const f of this.fx) if (f.layer !== 'ground') f.draw(ctx, f, this);

      for (const q of this.particles) {
        ctx.globalAlpha = Math.max(0, q.life / q.max);
        ctx.fillStyle = q.color;
        if (q.type === 'spark') {
          ctx.strokeStyle = q.color; ctx.lineWidth = q.r;
          ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(q.x - q.vx * 0.03, q.y - q.vy * 0.03); ctx.stroke();
        } else if (q.type === 'shell') {
          ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(q.rot); ctx.fillRect(-2.5, -1, 5, 2); ctx.restore();
        } else { U.circle(ctx, q.x, q.y, q.r); ctx.fill(); }
      }
      ctx.globalAlpha = 1;
      if (this.def.drawOver) this.def.drawOver(this, ctx);

      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (const tx of this.texts) {
        ctx.globalAlpha = Math.min(1, tx.life * 2);
        ctx.font = `800 ${tx.size}px system-ui,sans-serif`;
        ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillText(tx.txt, tx.x + 1, tx.y + 1);
        ctx.fillStyle = tx.color; ctx.fillText(tx.txt, tx.x, tx.y);
      }
      ctx.globalAlpha = 1;

      // ---- màn hình (screen-space)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (this.def.drawScreen) this.def.drawScreen(this, ctx);
      this.drawIndicators(ctx);
      this.drawMinimap(ctx);
      if (MB.Input.mode === 'kb' && !this.paused) this.drawCrosshair(ctx);
      else this.drawTapMark(ctx);
      this.drawVignette(ctx);
    },

    drawEnemy(ctx, e) {
      const def = e.def;
      if (e.hidden) { if (def.tele) def.tele(ctx, e, this); return; }
      if (e.alpha != null && e.alpha < 1) ctx.globalAlpha = e.alpha;
      if (e.spawnT > 0) {
        const max = e.boss ? 1.4 : 0.6, k = 1 - e.spawnT / max;
        ctx.strokeStyle = `rgba(170,255,90,${1 - k})`; ctx.lineWidth = 3;
        U.circle(ctx, e.x, e.y, e.r * (0.5 + k * 1.5)); ctx.stroke();
        ctx.globalAlpha = k;
      }
      if (!e.fly) { ctx.fillStyle = 'rgba(0,0,0,.25)'; U.ellipse(ctx, e.x + 2, e.y + e.r * 0.5, e.r * 1.05, e.r * 0.6); ctx.fill(); }
      if (e.elite) {
        ctx.save(); ctx.globalAlpha *= 0.55 + Math.sin(this.time * 6) * 0.2;
        ctx.strokeStyle = '#d79bff'; ctx.lineWidth = 3; U.circle(ctx, e.x, e.y, e.r + 7); ctx.stroke();
        ctx.restore();
      }
      if (def.tele) def.tele(ctx, e, this);
      def.draw(ctx, e, this);
      if (e.stunT > 0) {
        ctx.fillStyle = '#7ef3ff';
        for (let i = 0; i < 3; i++) { const a = this.time * 6 + i * 2.1; U.circle(ctx, e.x + Math.cos(a) * (e.r + 4), e.y - e.r - 4 + Math.sin(a) * 4, 2.6); ctx.fill(); }
      }
      if (e.flash > 0) {
        ctx.globalAlpha = Math.min(1, e.flash * 9) * 0.55;
        ctx.fillStyle = '#ffffff'; U.circle(ctx, e.x, e.y, e.r * 0.95); ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (!e.boss && e.hp < e.maxHp) this.drawHpBar(ctx, e.x, e.y - e.r - 10, e.r * 2, e.hp / e.maxHp, e.elite ? '#d79bff' : '#ff6d68');
    },
    drawHpBar(ctx, x, y, w, k, color) {
      ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(x - w / 2 - 1, y - 1, w + 2, 5);
      ctx.fillStyle = color; ctx.fillRect(x - w / 2, y, w * Math.max(0, k), 3);
    },
    drawEnemyBullet(ctx, b) {
      if (b.kind === 'tongue' && b.owner && !b.owner.dead) {
        ctx.strokeStyle = '#d24b5a'; ctx.lineWidth = 5; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(b.owner.x, b.owner.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        ctx.fillStyle = '#ff8c96'; U.circle(ctx, b.x, b.y, b.r); ctx.fill();
        return;
      }
      if (b.kind === 'rock') {
        ctx.fillStyle = 'rgba(0,0,0,.3)'; U.ellipse(ctx, b.x + 4, b.y + 8, b.r, b.r * 0.6); ctx.fill();
        ctx.fillStyle = '#7b6f62'; U.circle(ctx, b.x, b.y, b.r); ctx.fill();
        ctx.fillStyle = '#9b8e7e'; U.circle(ctx, b.x - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.45); ctx.fill();
        return;
      }
      if (b.kind === 'car') {
        const a = this.time * 6;
        ctx.save(); ctx.translate(b.x, b.y - 20); ctx.rotate(a);
        ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(-28, -10, 56, 30);
        ctx.fillStyle = '#6a4a3a'; U.rr(ctx, -30, -15, 60, 30, 8); ctx.fill();
        ctx.fillStyle = 'rgba(40,60,80,.8)'; ctx.fillRect(-8, -12, 22, 24);
        ctx.restore(); return;
      }
      if (b.kind === 'web') {
        ctx.strokeStyle = '#f0f0e6'; ctx.lineWidth = 1.5;
        U.circle(ctx, b.x, b.y, b.r); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(b.x - b.r, b.y); ctx.lineTo(b.x + b.r, b.y); ctx.moveTo(b.x, b.y - b.r); ctx.lineTo(b.x, b.y + b.r); ctx.stroke();
        return;
      }
      const c = b.color || (b.kind === 'spit' ? '#b6ff6a' : '#ffb36b');
      ctx.fillStyle = 'rgba(30,6,6,.55)'; U.circle(ctx, b.x, b.y, b.r + 2); ctx.fill();
      ctx.fillStyle = c; ctx.globalAlpha = 0.3; U.circle(ctx, b.x, b.y, b.r * 1.8); ctx.fill();
      ctx.globalAlpha = 1; U.circle(ctx, b.x, b.y, b.r); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.7)'; U.circle(ctx, b.x - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.35); ctx.fill();
    },

    // điểm chạm-để-bắn (màn hình)
    drawTapMark(ctx) {
      const tp = MB.Input.tapPoint();
      if (!tp || this.paused) return;
      ctx.save(); ctx.strokeStyle = 'rgba(255,120,100,.9)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(tp.x, tp.y, 16, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(tp.x - 24, tp.y); ctx.lineTo(tp.x - 8, tp.y); ctx.moveTo(tp.x + 8, tp.y); ctx.lineTo(tp.x + 24, tp.y);
      ctx.moveTo(tp.x, tp.y - 24); ctx.lineTo(tp.x, tp.y - 8); ctx.moveTo(tp.x, tp.y + 8); ctx.lineTo(tp.x, tp.y + 24); ctx.stroke();
      ctx.restore();
    },
    drawCrosshair(ctx) {
      const m = MB.Input.mouse;
      const w = MB.Weapons.current(this.player);
      ctx.strokeStyle = w.reloading ? 'rgba(255,213,106,.9)' : 'rgba(255,255,255,.85)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(m.x, m.y, 10, 0, U.TAU);
      ctx.moveTo(m.x - 16, m.y); ctx.lineTo(m.x - 6, m.y); ctx.moveTo(m.x + 6, m.y); ctx.lineTo(m.x + 16, m.y);
      ctx.moveTo(m.x, m.y - 16); ctx.lineTo(m.x, m.y - 6); ctx.moveTo(m.x, m.y + 6); ctx.lineTo(m.x, m.y + 16);
      ctx.stroke();
      if (w.reloading) {
        const s = MB.Weapons.stats(this.player, w);
        ctx.strokeStyle = '#ffd56a'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(m.x, m.y, 14, -Math.PI / 2, -Math.PI / 2 + U.TAU * (1 - w.reloading / s.reload)); ctx.stroke();
      }
    },

    drawVignette(ctx) {
      const p = this.player;
      const low = p.hp / p.maxHp < 0.3 && !p.dead;
      const k = this.hurtFlash / 0.35;
      if (!low && k <= 0) return;
      const pulse = low ? 0.35 + Math.sin(this.time * 6) * 0.15 : 0;
      const a = Math.max(pulse, k * 0.6);
      const g = ctx.createRadialGradient(this.W / 2, this.H / 2, Math.min(this.W, this.H) * 0.3, this.W / 2, this.H / 2, Math.max(this.W, this.H) * 0.7);
      g.addColorStop(0, 'rgba(255,0,0,0)'); g.addColorStop(1, `rgba(200,20,20,${a})`);
      ctx.fillStyle = g; ctx.fillRect(0, 0, this.W, this.H);
    },

    // mũi tên chỉ hướng tới mục tiêu ngoài màn hình
    drawIndicators(ctx) {
      const p = this.player, z = this.zoom;
      const marks = MB.Challenges.markers(this);
      if (this.boss && !this.boss.dead) marks.push({ x: this.boss.x, y: this.boss.y, color: '#ff5b6e', boss: true });
      marks.sort((a, b) => U.dist(a.x, a.y, p.x, p.y) - U.dist(b.x, b.y, p.x, p.y));
      let n = 0;
      const pad = 34, cx = this.W / 2, cy = this.H / 2;
      for (const m of marks) {
        if (n >= 4) break;
        if (this.inView(m.x, m.y, -30)) continue;
        n++;
        const sx = (m.x - this.cam.x) * z, sy = (m.y - this.cam.y) * z;
        const a = Math.atan2(sy - cy, sx - cx);
        const ex = U.clamp(sx, pad, this.W - pad), ey = U.clamp(sy, pad + 60, this.H - pad - 40);
        ctx.save(); ctx.translate(ex, ey); ctx.rotate(a);
        ctx.fillStyle = m.color; ctx.globalAlpha = 0.85;
        ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(-6, -8); ctx.lineTo(-2, 0); ctx.lineTo(-6, 8); ctx.closePath(); ctx.fill();
        ctx.restore();
      }
    },

    drawMinimap(ctx) {
      const w = this.mmW, h = Math.round(w * this.world.h / this.world.w);
      const x0 = this.W - w - 12 - (this.safeR || 0), y0 = 12 + (this.safeT || 0);
      const k = w / this.world.w;
      if (this.mmDirty || !this.mm) {
        this.mmDirty = false;
        const c = this.mm || document.createElement('canvas');
        c.width = w * 2; c.height = h * 2;
        const g = c.getContext('2d');
        g.setTransform(2, 0, 0, 2, 0, 0);
        g.fillStyle = 'rgba(6,14,9,.82)'; g.fillRect(0, 0, w, h);
        g.fillStyle = this.def.mmColor || 'rgba(110,160,110,.55)';
        for (const o of this.obstacles) {
          if (o.dead) continue;
          if (o.kind === 'chasm') g.fillStyle = 'rgba(0,0,0,.85)';
          else if (o.kind === 'deep') g.fillStyle = 'rgba(30,80,140,.9)';
          else if (o.water) g.fillStyle = 'rgba(50,110,90,.95)';
          else g.fillStyle = o.hp ? 'rgba(255,213,106,.8)' : (this.def.mmColor || 'rgba(110,160,110,.55)');
          if (o.shape === 'box') { g.save(); g.translate(o.x * k, o.y * k); g.rotate(o.rot || 0); g.fillRect(-o.hw * k, -o.hh * k, Math.max(1.5, o.w * k), Math.max(1.5, o.h * k)); g.restore(); }
          else { g.beginPath(); g.arc(o.x * k, o.y * k, Math.max(1.2, o.br * k * 0.8), 0, U.TAU); g.fill(); }
        }
        const HC = { lava: 'rgba(255,120,40,.6)', mud: 'rgba(120,90,50,.55)', ice: 'rgba(230,245,255,.5)', water: 'rgba(60,140,200,.5)', oil: 'rgba(0,0,0,.6)', acid: 'rgba(150,255,90,.4)' };
        for (const hz of this.hazards) if (hz.life == null) { g.fillStyle = HC[hz.kind] || 'rgba(150,255,90,.35)'; g.beginPath(); g.arc(hz.x * k, hz.y * k, hz.r * k, 0, U.TAU); g.fill(); }
        this.mm = c;
      }
      ctx.save();
      ctx.globalAlpha = 0.95;
      ctx.drawImage(this.mm, x0, y0, w, h);
      ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 1; ctx.strokeRect(x0 + 0.5, y0 + 0.5, w - 1, h - 1);
      // khung nhìn
      ctx.strokeStyle = 'rgba(255,255,255,.35)';
      ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, w, h); ctx.clip();
      const vr = this.r3on && this.viewRect;
      if (vr) ctx.strokeRect(x0 + vr.x0 * k, y0 + vr.y0 * k, (vr.x1 - vr.x0) * k, (vr.y1 - vr.y0) * k);
      else ctx.strokeRect(x0 + this.cam.x * k, y0 + this.cam.y * k, this.W / this.zoom * k, this.H / this.zoom * k);
      ctx.restore();
      for (const m of MB.Challenges.markers(this)) { ctx.fillStyle = m.color; ctx.fillRect(x0 + m.x * k - 2, y0 + m.y * k - 2, 4, 4); }
      ctx.fillStyle = '#ff6d68';
      for (const e of this.enemies) if (!e.dead) { const r = e.boss ? 3.5 : 1.6; ctx.fillRect(x0 + e.x * k - r, y0 + e.y * k - r, r * 2, r * 2); }
      for (const it of this.pickups) if (it.kind === 'weapon' || it.kind === 'mod') { ctx.fillStyle = '#ffd56a'; ctx.fillRect(x0 + it.x * k - 1.5, y0 + it.y * k - 1.5, 3, 3); }
      const p = this.player;
      ctx.fillStyle = '#7ef3ff'; ctx.beginPath(); ctx.arc(x0 + p.x * k, y0 + p.y * k, 3, 0, U.TAU); ctx.fill();
      ctx.restore();
      this.mmRect = { x: x0, y: y0, w, h };
    },
  };
})(window.MB);
