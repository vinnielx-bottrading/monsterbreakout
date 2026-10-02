/* Monster Breakout — điều khiển: bàn phím + chuột, cảm ứng twin-stick, gamepad */
'use strict';
(function (MB) {
  const U = MB.U;
  const STICK_R = 58;

  const I = MB.Input = {
    mode: 'kb',
    keys: {},
    edges: new Set(),
    move: { x: 0, y: 0 },
    mouse: { x: innerWidth / 2, y: innerHeight / 2, down: false },
    L: { id: null, ox: 0, oy: 0, x: 0, y: 0 },
    R: { id: null, ox: 0, oy: 0, x: 0, y: 0, tap: false, sx: 0, sy: 0 },
    tapT: 0, tapX: 0, tapY: 0, // chạm-để-bắn: điểm chạm cuối và thời gian bắn còn lại sau khi nhấc tay
    pad: { move: { x: 0, y: 0 }, aim: { x: 0, y: 0 }, fire: false, sprint: false, prev: [] },

    take(n) { if (this.edges.has(n)) { this.edges.delete(n); return true; } return false; },
    press(n) { this.edges.add(n); },
    clear() {
      this.edges.clear(); this.keys = {}; this.mouse.down = false; this.tapT = 0;
      this.release(this.L); this.release(this.R);
    },
    setMode(m) {
      if (this.mode === m) return;
      this.mode = m;
      document.body.dataset.input = m;
      if (MB.App && MB.App.onInputMode) MB.App.onInputMode(m);
    },

    // trạng thái tổng hợp cho game
    sprint() {
      if (this.mode === 'kb') return !!(this.keys.ShiftLeft || this.keys.ShiftRight);
      if (this.mode === 'pad') return this.pad.sprint;
      return Math.hypot(this.move.x, this.move.y) > 0.93;
    },
    // hướng ngắm cho cảm ứng / gamepad: {x,y,mag} hoặc null
    // chạm (không kéo) bên phải: trả về điểm màn hình cần bắn tới, hoặc null
    tapPoint() {
      if (this.mode !== 'touch') return null;
      if (this.R.id !== null && this.R.tap) return { x: this.R.sx, y: this.R.sy };
      if (this.tapT > 0) return { x: this.tapX, y: this.tapY };
      return null;
    },
    aimVec() {
      if (this.mode === 'touch' && this.R.id !== null && !this.R.tap) {
        const m = Math.hypot(this.R.x, this.R.y);
        return m > 0.12 ? { x: this.R.x, y: this.R.y, mag: m } : null;
      }
      if (this.mode === 'pad') {
        const m = Math.hypot(this.pad.aim.x, this.pad.aim.y);
        return m > 0.2 ? { x: this.pad.aim.x, y: this.pad.aim.y, mag: m } : null;
      }
      return null;
    },
    fire() {
      if (this.mode === 'kb') return this.mouse.down;
      if (this.mode === 'touch') return this.R.id !== null && !this.R.tap && Math.hypot(this.R.x, this.R.y) > 0.3;
      const a = this.aimVec();
      return this.pad.fire || (a && a.mag > 0.55);
    },

    poll() {
      // gamepad
      const pads = navigator.getGamepads ? navigator.getGamepads() : [];
      let gp = null;
      for (const p of pads) if (p && p.connected) { gp = p; break; }
      if (gp) {
        const dz = (v) => (Math.abs(v) < 0.18 ? 0 : v);
        const ax = gp.axes;
        const b = (i) => !!(gp.buttons[i] && (gp.buttons[i].pressed || gp.buttons[i].value > 0.35));
        const mx = dz(ax[0] || 0), my = dz(ax[1] || 0), rx = dz(ax[2] || 0), ry = dz(ax[3] || 0);
        const any = mx || my || rx || ry || gp.buttons.some((x) => x && x.pressed);
        if (any) this.setMode('pad');
        const P = this.pad;
        P.move.x = mx; P.move.y = my; P.aim.x = rx; P.aim.y = ry;
        P.fire = b(7);
        P.sprint = b(4) || b(10) || b(6);
        const edge = (i, name) => { const now = b(i); if (now && !P.prev[i]) this.press(name); P.prev[i] = now; };
        if (this.mode === 'pad') {
          edge(0, 'dodge'); edge(1, 'nova'); edge(2, 'reload'); edge(3, 'swap'); edge(5, 'grenade');
          const st = b(9); if (st && !P.prev[9] && MB.App) MB.App.togglePause(); P.prev[9] = st;
        }
      }
      // tổng hợp di chuyển
      if (this.mode === 'kb') {
        const k = this.keys;
        this.move.x = ((k.KeyD || k.ArrowRight) ? 1 : 0) - ((k.KeyA || k.ArrowLeft) ? 1 : 0);
        this.move.y = ((k.KeyS || k.ArrowDown) ? 1 : 0) - ((k.KeyW || k.ArrowUp) ? 1 : 0);
      } else if (this.mode === 'touch') {
        this.move.x = this.L.x; this.move.y = this.L.y;
      } else {
        this.move.x = this.pad.move.x; this.move.y = this.pad.move.y;
      }
    },

    /* ---------- cảm ứng ---------- */
    showStick(s, el) {
      if (!el) return;
      el.style.display = 'block';
      el.style.left = (s.ox - STICK_R) + 'px';
      el.style.top = (s.oy - STICK_R) + 'px';
      el.firstElementChild.style.transform = `translate(${s.x * STICK_R}px,${s.y * STICK_R}px)`;
    },
    release(s) {
      s.id = null; s.x = 0; s.y = 0; s.tap = false;
      const el = s === this.L ? this.elL : this.elR;
      if (el) el.style.display = 'none';
    },
    moveStick(s, cx, cy) {
      let dx = cx - s.ox, dy = cy - s.oy;
      const d = Math.hypot(dx, dy);
      // gậy "trôi": kéo xa quá thì đế gậy đi theo ngón tay
      if (d > STICK_R * 1.35) {
        const k = (d - STICK_R * 1.35) / d;
        s.ox += dx * k; s.oy += dy * k;
        dx = cx - s.ox; dy = cy - s.oy;
      }
      const dd = Math.hypot(dx, dy);
      const m = Math.min(1, dd / STICK_R);
      s.x = dd ? dx / dd * m : 0; s.y = dd ? dy / dd * m : 0;
    },

    init(surface) {
      document.body.dataset.input = this.mode;
      this.elL = document.getElementById('stickL');
      this.elR = document.getElementById('stickR');

      addEventListener('keydown', (e) => {
        const c = e.code;
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(c) && MB.G && MB.G.running) e.preventDefault();
        if (!this.keys[c]) {
          if (c === 'Space') this.press('dodge');
          if (c === 'KeyR') this.press('reload');
          if (c === 'KeyQ') this.press('swap');
          if (c === 'KeyG') this.press('grenade');
          if (c === 'KeyF' || c === 'KeyE') this.press('nova');
          if (/^Digit[1-8]$/.test(c)) this.press('slot' + c.slice(5));
          if ((c === 'Escape' || c === 'KeyP') && MB.App) MB.App.togglePause();
        }
        this.keys[c] = true;
        if (c !== 'Escape') this.setMode('kb');
      });
      addEventListener('keyup', (e) => { this.keys[e.code] = false; });
      addEventListener('blur', () => { this.keys = {}; this.mouse.down = false; });

      surface.addEventListener('contextmenu', (e) => e.preventDefault());
      surface.addEventListener('wheel', (e) => { if (MB.G && MB.G.running) this.press(e.deltaY > 0 ? 'next' : 'prev'); }, { passive: true });

      surface.addEventListener('pointerdown', (e) => {
        if (MB.Audio) MB.Audio.unlock();
        if (e.pointerType === 'mouse') {
          this.setMode('kb');
          this.mouse.x = e.clientX; this.mouse.y = e.clientY;
          if (e.button === 0) this.mouse.down = true;
          if (e.button === 2) this.press('dodge');
          if (e.button === 1) { e.preventDefault(); this.press('grenade'); }
          return;
        }
        e.preventDefault();
        this.setMode('touch');
        const leftZone = e.clientX < innerWidth * 0.45;
        const s = leftZone ? this.L : this.R;
        if (s.id !== null) return;
        s.id = e.pointerId; s.ox = e.clientX; s.oy = e.clientY; s.x = 0; s.y = 0;
        try { surface.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
        if (leftZone) this.showStick(s, this.elL);
        else {
          // bên phải: chạm giữ tại chỗ = bắn vào điểm chạm; kéo đi = gậy ngắm
          s.tap = true; s.sx = e.clientX; s.sy = e.clientY;
          this.tapX = e.clientX; this.tapY = e.clientY; this.tapT = 0.08;
        }
      }, { passive: false });

      surface.addEventListener('pointermove', (e) => {
        if (e.pointerType === 'mouse') {
          this.mouse.x = e.clientX; this.mouse.y = e.clientY;
          if (this.mode !== 'kb' && (Math.abs(e.movementX) + Math.abs(e.movementY) > 2)) this.setMode('kb');
          return;
        }
        for (const s of [this.L, this.R]) {
          if (s.id === e.pointerId) {
            if (s.tap) {
              if (Math.hypot(e.clientX - s.ox, e.clientY - s.oy) < 22) { s.sx = e.clientX; s.sy = e.clientY; this.tapX = s.sx; this.tapY = s.sy; continue; }
              s.tap = false; this.tapT = 0; // kéo xa → chuyển thành gậy ngắm
            }
            this.moveStick(s, e.clientX, e.clientY);
            this.showStick(s, s === this.L ? this.elL : this.elR);
          }
        }
      });
      const up = (e) => {
        if (e.pointerType === 'mouse') { if (e.button === 0) this.mouse.down = false; return; }
        if (this.L.id === e.pointerId) this.release(this.L);
        if (this.R.id === e.pointerId) { if (this.R.tap) this.tapT = Math.max(this.tapT, 0.06); this.release(this.R); }
      };
      surface.addEventListener('pointerup', up);
      surface.addEventListener('pointercancel', up);
      addEventListener('mouseup', (e) => { if (e.button === 0) this.mouse.down = false; });

      // nút cảm ứng
      document.querySelectorAll('[data-act]').forEach((btn) => {
        btn.addEventListener('pointerdown', (e) => {
          e.preventDefault(); e.stopPropagation();
          if (MB.Audio) MB.Audio.unlock();
          const act = btn.dataset.act;
          if (act === 'pause') { if (MB.App) MB.App.togglePause(); return; }
          this.press(act);
          btn.classList.add('on');
          setTimeout(() => btn.classList.remove('on'), 120);
        }, { passive: false });
      });
    },
  };
  I.STICK_R = STICK_R;
  void U;
})(window.MB);
