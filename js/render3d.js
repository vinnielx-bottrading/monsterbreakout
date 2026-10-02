/* Monster Breakout — bộ vẽ 3D (thử nghiệm) bằng Three.js
   Logic game (va chạm, AI, đạn, wave) giữ nguyên ở game.js; file này chỉ dựng cảnh 3D từ trạng thái G mỗi khung hình.
   Toạ độ: thế giới 2D (x, y) → Three.js (x, độ cao, y). Camera nhìn từ phía nam, nghiêng ~55°. */
'use strict';
(function (MB) {
  const U = MB.U;
  let T = null;

  /* ---------- tiện ích vật liệu / hình khối (dùng chung, có cache) ---------- */
  const geoCache = {}, matCache = {}, colCache = new Map();
  const G3 = (key, make) => geoCache[key] || (geoCache[key] = make());
  function std(color, o) {
    o = o || {};
    const key = 's' + color + JSON.stringify(o);
    if (!o.own && matCache[key]) return matCache[key];
    const m = new T.MeshStandardMaterial({ color, roughness: o.rough != null ? o.rough : 0.8, metalness: o.metal || 0, flatShading: !!o.flat,
      emissive: o.emissive != null ? o.emissive : 0x000000, emissiveIntensity: o.ei != null ? o.ei : 1, transparent: !!o.transparent, opacity: o.opacity != null ? o.opacity : 1 });
    if (o.own) m.userData.own = true; else matCache[key] = m;
    return m;
  }
  const glowMat = (color, ei) => std(color, { emissive: color, ei: (ei || 1.4) * 0.6, rough: 0.4 });
  function mesh(geo, mat, x, y, z, cast) {
    const m = new T.Mesh(geo, mat);
    m.position.set(x || 0, y || 0, z || 0);
    if (cast !== false) m.castShadow = true;
    return m;
  }
  const box = (w, h, d) => G3(`b${w}_${h}_${d}`, () => new T.BoxGeometry(w, h, d));
  const sph = (r, s) => G3(`s${r}_${s || 12}`, () => new T.SphereGeometry(r, s || 12, Math.max(6, (s || 12) * 0.7 | 0)));
  const cyl = (r1, r2, h, s) => G3(`c${r1}_${r2}_${h}_${s || 10}`, () => new T.CylinderGeometry(r1, r2, h, s || 10));
  const cap = (r, l) => G3(`p${r}_${l}`, () => new T.CapsuleGeometry(r, l, 4, 10));
  function colorOf(str) {
    let c = colCache.get(str);
    if (c) return c;
    c = new T.Color();
    const m = /rgba?\(([^)]+)\)/.exec(str);
    if (m) { const v = m[1].split(',').map(Number); c.setRGB(v[0] / 255, v[1] / 255, v[2] / 255, T.SRGBColorSpace); }
    else c.set(str);
    colCache.set(str, c);
    return c;
  }
  function radialTex(inner, outer) {
    const cv = document.createElement('canvas'); cv.width = cv.height = 128;
    const g = cv.getContext('2d'), gr = g.createRadialGradient(64, 64, 4, 64, 64, 64);
    gr.addColorStop(0, inner); gr.addColorStop(1, outer);
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    const t = new T.CanvasTexture(cv); t.colorSpace = T.SRGBColorSpace; return t;
  }
  // vệt loang: gradient trong một đường viền méo + lốm đốm bên trong
  function blobTex(inner, outer, seed) {
    const cv = document.createElement('canvas'); cv.width = cv.height = 256;
    const g = cv.getContext('2d'), r = U.seeded(seed || 7), p1 = r() * 6.3, p2 = r() * 6.3, p3 = r() * 6.3;
    g.beginPath();
    for (let k = 0; k <= 48; k++) {
      const a = k / 48 * U.TAU, rr = 104 * (1 + 0.1 * Math.sin(a * 3 + p1) + 0.07 * Math.sin(a * 5 + p2) + 0.04 * Math.sin(a * 11 + p3));
      if (k) g.lineTo(128 + Math.cos(a) * rr, 128 + Math.sin(a) * rr); else g.moveTo(128 + Math.cos(a) * rr, 128 + Math.sin(a) * rr);
    }
    g.closePath(); g.save(); g.clip();
    const gr = g.createRadialGradient(128, 128, 6, 128, 128, 120); gr.addColorStop(0, inner); gr.addColorStop(0.7, inner); gr.addColorStop(1, outer);
    g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
    g.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 26; i++) { const a = r() * 6.3, d = r() * 90, rr = 6 + r() * 16; g.fillStyle = `rgba(0,0,0,${0.15 + r() * 0.2})`; g.beginPath(); g.ellipse(128 + Math.cos(a) * d, 128 + Math.sin(a) * d, rr, rr * 0.6, r() * 3, 0, U.TAU); g.fill(); }
    g.restore();
    // mép mềm
    g.globalCompositeOperation = 'destination-in';
    const m = g.createRadialGradient(128, 128, 70, 128, 128, 128); m.addColorStop(0, 'rgba(0,0,0,1)'); m.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = m; g.fillRect(0, 0, 256, 256);
    const t = new T.CanvasTexture(cv); t.colorSpace = T.SRGBColorSpace; return t;
  }
  let glowTex = null;
  function glowSprite(color, size, opacity) {
    if (!glowTex) glowTex = radialTex('rgba(255,255,255,1)', 'rgba(255,255,255,0)');
    const s = new T.Sprite(new T.SpriteMaterial({ map: glowTex, color, transparent: true, opacity: opacity == null ? 0.8 : opacity, blending: T.AdditiveBlending, depthWrite: false }));
    s.scale.set(size, size, 1);
    return s;
  }
  function ownMats(group) {
    const list = [];
    group.traverse((o) => { if (o.isMesh && o.material && o.material.userData.own && o.material.emissive) list.push(o.material); });
    return list;
  }
  function disposeOwn(obj) {
    obj.traverse((o) => {
      if (o.material && (o.material.userData.own || o.isSprite)) o.material.dispose();
      if (o.userData.ownGeo && o.geometry) o.geometry.dispose();
    });
  }

  /* ================= CÔNG CỤ DỰNG HÌNH HỮU CƠ ================= */
  // đoạn chi thon: đỉnh tại gốc toạ độ, kéo dài xuống -y (để xoay quanh khớp)
  const limbGeo = (r1, r2, len) => G3(`l${r1}_${r2}_${len}`, () => { const g = new T.CylinderGeometry(r1, r2, len, 12, 1); g.translate(0, -len / 2, 0); return g; });
  function limb(r1, r2, len, mat) { const m = new T.Mesh(limbGeo(r1, r2, len), mat); m.castShadow = true; return m; }
  // khớp xoay: group chứa đoạn chi + khớp con ở đầu dưới
  function joint(parent, x, y, z, r1, r2, len, mat, knob) {
    const piv = new T.Group(); piv.position.set(x, y, z); parent.add(piv);
    piv.add(limb(r1, r2, len, mat));
    if (knob) piv.add(mesh(sph(r1 * 1.05, 10), knob, 0, 0, 0));
    const end = new T.Group(); end.position.y = -len; piv.add(end);
    piv.userData.end = end;
    return piv;
  }
  // đoạn chi nối 2 điểm cố định
  const DOWN = { x: 0, y: -1, z: 0 };
  function limbBetween(parent, a, b, r1, r2, mat) {
    const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], L = Math.hypot(dx, dy, dz);
    const m = limb(r1, r2, L, mat);
    m.position.set(a[0], a[1], a[2]);
    m.quaternion.setFromUnitVectors(new T.Vector3(DOWN.x, DOWN.y, DOWN.z), new T.Vector3(dx / L, dy / L, dz / L));
    parent.add(m); return m;
  }
  // làm méo bề mặt cầu cho giống da thịt / đá (nhiễu theo vị trí, liền mạch ở đường nối UV)
  function bumpy(key, base, amt, freq) {
    return G3(key, () => {
      const g = base.clone(), p = g.attributes.position, v = new T.Vector3();
      for (let i = 0; i < p.count; i++) {
        v.fromBufferAttribute(p, i);
        const n = Math.sin(v.x * freq + 1.3) * Math.sin(v.y * freq * 1.3 + 0.7) * Math.sin(v.z * freq * 0.9 + 2.1)
          + 0.5 * Math.sin(v.x * freq * 2.7 + v.z * freq * 1.9);
        const len = v.length() || 1;
        v.multiplyScalar(1 + n * amt / len);
        p.setXYZ(i, v.x, v.y, v.z);
      }
      g.computeVertexNormals(); return g;
    });
  }
  const skinMat = (c, o) => std(c, Object.assign({ own: true, rough: 0.78 }, o || {}));

  /* ================= MODEL: NHÂN VẬT HUNTER ================= */
  function buildGun(id) {
    const g = new T.Group(), dark = std(0x1d2224, { rough: 0.45, metal: 0.5 }), mid = std(0x3c474b, { rough: 0.45, metal: 0.4 });
    const orange = std(0xf2a33a), wood = std(0x7a4f2a);
    const barrel = (r, len, x, y) => { const b = mesh(cyl(r, r, len, 10), mid, x, y, 0); b.rotation.z = Math.PI / 2; return b; };
    if (id === 'shotgun') {
      g.add(mesh(box(24, 6.5, 5.5), dark, 12, 0, 0), barrel(2.4, 14, 30, 1), barrel(2.4, 14, 30, -1.6), mesh(cap(3.4, 6), wood, 20, -1.5, 0), mesh(box(9, 6, 5), wood, -3, -1.5, 0));
      g.children[3].rotation.z = Math.PI / 2;
      g.userData.tip = 38;
    } else if (id === 'sniper') {
      g.add(mesh(box(30, 5, 5), dark, 13, 0, 0), barrel(1.5, 18, 36, 0.5), mesh(cyl(2.2, 2.2, 12, 10), mid, 14, 5, 0), mesh(box(8, 5, 4), dark, -5, -1, 0));
      g.children[2].rotation.z = Math.PI / 2; g.add(mesh(sph(1.6, 8), glowMat(0x9fe8ff, 1.2), 20, 5, 0));
      g.userData.tip = 46;
    } else if (id === 'flame') {
      g.add(mesh(box(26, 7, 6), std(0x2a2420), 13, 0, 0), barrel(2.6, 8, 31, 0), mesh(cap(3.5, 5), std(0xc0471f, { rough: 0.4, metal: 0.3 }), 14, -6, 0), mesh(sph(1.6, 8), glowMat(0xff9a3c, 2), 36, 0, 0));
      g.children[2].rotation.z = Math.PI / 2;
      g.userData.tip = 37;
    } else if (id === 'launcher') {
      g.add(mesh(cyl(4.5, 4.5, 30, 14), std(0x2d3a2a, { rough: 0.5 }), 18, 0, 0), mesh(box(3, 9.4, 9.4), std(0xffd56a), 10, 0, 0), mesh(box(8, 6, 5), dark, -2, -2, 0));
      g.children[0].rotation.z = Math.PI / 2;
      g.userData.tip = 36;
    } else if (id === 'plasma') {
      g.add(mesh(box(26, 7, 6), std(0x22202c, { rough: 0.4, metal: 0.4 }), 12, 0, 0), mesh(cap(2.2, 10), glowMat(0xc79bff, 1.6), 14, 4.2, 0), barrel(2, 8, 30, 0));
      g.children[1].rotation.z = Math.PI / 2;
      g.userData.tip = 36;
    } else if (id === 'minigun') {
      g.add(mesh(box(20, 10, 9), dark, 8, 0, 0)); for (const [y, z] of [[2, 2], [2, -2], [-2, 2], [-2, -2]]) g.add(barrel(1.2, 22, 28, y)), g.children[g.children.length - 1].position.z = z;
      g.add(mesh(box(8, 5, 5), std(0xffd56a), 6, -6, 0));
      g.userData.tip = 40;
    } else if (id === 'smg') {
      g.add(mesh(box(19, 6, 5), dark, 9.5, 0, 0), barrel(1.6, 8, 22, 0.5), mesh(box(4, 11, 4), mid, 6, -7.5, 0), mesh(box(7, 1.6, 5.4), glowMat(0x4fd6ff, 1.4), 12, 3.2, 0));
      g.userData.tip = 26;
    } else {
      // súng trường chính: ống ngắm, ốp tay cầm dài, tay nắm trước, giảm thanh
      g.add(mesh(box(27, 6, 5), dark, 13.5, 0, 0), barrel(1.7, 12, 32, 0.6), mesh(box(5, 9, 4), mid, 10, -6.5, 0), mesh(box(12, 5.4, 5.6), mid, 22, 0.2, 0),
        mesh(cyl(2, 2, 9, 10), dark, 13, 5.4, 0), mesh(box(8, 5, 4), dark, -3, -1, 0), mesh(box(2.4, 5, 2.6), dark, 24, -4.6, 0));
      g.children[4].rotation.z = Math.PI / 2;
      g.add(mesh(cyl(1.5, 1.5, 1.2, 10), glowMat(0xff5040, 1), 17.6, 5.4, 0)); g.children[7].rotation.z = Math.PI / 2;
      g.add(barrel(2.4, 11, 43.5, 0.6));
      void orange;
      g.userData.tip = 49;
    }
    return g;
  }

  // Hunter (v6.3): đặc nhiệm "Operator" — áo chiến đấu đen than, giáp tấm nâu-ô liu đầy túi đạn,
  // ba lô chiến thuật, mũ trùm cổ, tóc nâu sẫm, bảo vệ gối, bốt da; phù hiệu cánh-kiếm phát sáng trên vai trái để dễ nhận ra.
  function buildHero() {
    const g = new T.Group();
    const pants = std(0x2b2e2b, { rough: 0.9 }), boot = std(0x2e241a, { rough: 0.75 }), kneeM = std(0x3d362b, { rough: 0.55, metal: 0.1 });
    const coyote = std(0x5a4f3a, { rough: 0.85 }), pouch = std(0x4b4432, { rough: 0.9 }), strap = std(0x272219, { rough: 0.9 });
    const legs = new T.Group(); g.add(legs);
    const mkLeg = (z) => {
      const hip = joint(legs, 0, 17, z, 3.7, 3.2, 8.5, pants);
      const knee = joint(hip.userData.end, 0, 0, 0, 3.2, 2.9, 7, pants);
      const kp = mesh(sph(3.1, 12), kneeM, 1.9, 0.2, 0); kp.scale.set(0.75, 1.1, 1); knee.add(kp);
      const b = mesh(cap(3.2, 6), boot, 2.4, -7.3, 0); b.rotation.z = Math.PI / 2; b.scale.set(1, 1, 1.15); knee.userData.end.add(b);
      knee.userData.end.add(mesh(cyl(3.3, 3.4, 3.4, 12), boot, 0, -4.4, 0));
      return { hip, knee };
    };
    const L = mkLeg(-5.2), R = mkLeg(5.2);
    // bao súng ngắn bên đùi phải
    R.hip.add(mesh(box(4.2, 7, 2.2), strap, 0.5, -4.5, 3.6));
    const upper = new T.Group(); upper.position.y = 17; g.add(upper);
    const bodyMat = std(0x33383a, { own: true, rough: 0.85 });
    const body = mesh(cap(9, 9), bodyMat, 0, 10, 0); body.scale.set(0.95, 1, 1.25); upper.add(body);
    // thắt lưng + túi đeo hông
    const belt = mesh(cyl(9.4, 9.4, 2.6, 18), strap, 0, 2.6, 0); belt.scale.set(0.95, 1, 1.25); upper.add(belt);
    upper.add(mesh(box(3.4, 4, 4), pouch, 6.4, 1.6, -7), mesh(box(3.4, 4, 4), pouch, 6.4, 1.6, 7), mesh(box(4, 4.5, 3.4), pouch, -4, 1.4, 10.4));
    // áo giáp tấm: tấm trước, tấm sau, quai vai, hàng túi đạn
    upper.add(mesh(box(4.4, 13, 15.5), coyote, 6.4, 11.5, 0), mesh(box(4, 13, 15), coyote, -6.6, 11.5, 0));
    for (const z of [-5.2, 5.2]) upper.add(mesh(box(13.6, 2, 3.4), coyote, 0, 18.6, z));
    for (const z of [-5, 0, 5]) { upper.add(mesh(box(2.6, 5.4, 4.2), pouch, 9.6, 8.2, z)); upper.add(mesh(box(2.8, 1, 4.4), strap, 9.7, 11, z)); }
    upper.add(mesh(cyl(0.9, 0.9, 6, 8), strap, 8.9, 15.4, -4.5)); // ăng-ten bộ đàm
    // ba lô chiến thuật + bình lọc sinh học nhỏ bên hông (giữ chi tiết cốt truyện)
    const packM = std(0x433d2e, { rough: 0.9 });
    upper.add(mesh(box(7, 14, 12.5), packM, -12, 12.5, 0), mesh(box(7.6, 3.4, 13), std(0x3a3427, { rough: 0.9 }), -12, 19.6, 0));
    for (const y of [9, 12, 15]) upper.add(mesh(box(7.2, 0.7, 12.7), strap, -12.1, y, 0));
    upper.add(mesh(box(2.6, 7, 9), pouch, -16.2, 11, 0));
    upper.add(mesh(cyl(1.7, 1.7, 7, 10), glowMat(0x7dff9b, 1.5), -12, 12, -7.6));
    // mũ trùm cổ (hood) quanh gáy
    const hood = mesh(G3('hood', () => new T.TorusGeometry(6.2, 2.6, 8, 18)), std(0x23272a, { rough: 0.95 }), -0.8, 22, 0); hood.rotation.x = Math.PI / 2; hood.scale.set(1, 1.2, 1); upper.add(hood);
    // tay: tay áo đen xắn tới khuỷu, cẳng tay để trần, găng đen
    const sleeve = std(0x363b3e, { rough: 0.9 }), skinA = std(0xb7876a, { rough: 0.7 }), glove = std(0x15181a, { rough: 0.6 });
    for (const z of [-12, 12]) { const sh = mesh(sph(5.4, 14), sleeve, -0.5, 19, z); sh.scale.set(1.1, 0.85, 1); upper.add(sh); }
    // phù hiệu cánh-kiếm phát sáng nhẹ (vai trái): điểm nhận diện trên map tối
    upper.add(mesh(box(3.8, 3.8, 0.6), std(0x5fd8ec, { emissive: 0x4fc8e0, ei: 0.7, rough: 0.4 }), -0.5, 19.2, -16.6));
    limbBetween(upper, [0, 19, -12], [7, 13, -8], 2.9, 2.6, sleeve);
    limbBetween(upper, [7, 13, -8], [13, 14, -1.5], 2.3, 2.1, skinA);
    limbBetween(upper, [0, 19, 12], [8, 13, 9], 2.9, 2.6, sleeve);
    limbBetween(upper, [8, 13, 9], [20, 14, 2.5], 2.3, 2.1, skinA);
    upper.add(mesh(sph(2.8, 8), glove, 13, 14, -1.5), mesh(sph(2.8, 8), glove, 20, 14, 2.5));
    upper.add(mesh(sph(2.75, 8), sleeve, 7, 13, -8), mesh(sph(2.75, 8), sleeve, 8, 13, 9));
    const gunHolder = new T.Group(); gunHolder.position.set(12, 14, 1.5); upper.add(gunHolder);
    // đầu: mặt, tóc nâu sẫm rối, mắt, lông mày, râu lún phún
    const head = new T.Group(); head.position.set(0, 29, 0); upper.add(head);
    const skin = std(0xc0937a, { rough: 0.72 });
    head.add(mesh(cyl(3.3, 3.7, 5, 12), skin, 0, -6, 0));
    const face = mesh(sph(7, 20), skin, 0.4, -0.4, 0); face.scale.set(1.08, 1.12, 0.92); head.add(face);
    const beard = mesh(sph(4.6, 12), std(0x3a3029, { rough: 1 }), 2.4, -4.2, 0); beard.scale.set(0.9, 0.6, 1.05); head.add(beard); // râu lún phún ở cằm
    const hairM = std(0x2a1d15, { rough: 0.95 });
    const hair = mesh(bumpy('hair', new T.SphereGeometry(7.7, 22, 14, 0, Math.PI * 2, 0, Math.PI * 0.6), 0.8, 1.5), hairM, -0.9, 1.2, 0); head.add(hair);
    for (let i = 0; i < 5; i++) { const f = mesh(G3('lock', () => new T.ConeGeometry(1.6, 6, 6)), hairM, 5.4, 4.2, -4.4 + i * 2.2); f.rotation.z = -1.9 - (i % 2) * 0.25; f.rotation.x = (i - 2) * 0.12; head.add(f); }
    const eyeM = std(0x1a1512, { rough: 0.4 });
    head.add(mesh(sph(0.85, 6), eyeM, 6.6, 0.6, -2.5), mesh(sph(0.85, 6), eyeM, 6.6, 0.6, 2.5));
    head.add(mesh(box(1, 0.8, 2.8), hairM, 6.7, 2, -2.5), mesh(box(1, 0.8, 2.8), hairM, 6.7, 2, 2.5));
    head.add(mesh(box(1.4, 2.6, 1.1), skin, 7.4, -0.6, 0));
    const muzzle = glowSprite(0xffd27a, 34, 1); muzzle.visible = false; upper.add(muzzle);
    const ring = new T.Mesh(G3('ring', () => new T.RingGeometry(23, 26.5, 48)), new T.MeshBasicMaterial({ color: 0x7ef3ff, transparent: true, opacity: 0.55, depthWrite: false }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.9; g.add(ring);
    g.userData = { legs: [L, R], legGroup: legs, upper, bodyMat, gunHolder, muzzle, ring, head, gunId: null };
    const outer = new T.Group(); g.scale.setScalar(1.3); outer.add(g); outer.userData = g.userData; return outer;
  }
  function animHero(p, m, G) {
    const d = m.userData, t = G.time;
    m.position.set(p.x, 0, p.y);
    const sp = Math.hypot(p.vx, p.vy);
    d.legGroup.rotation.y = -p.moveAng;
    const sw = sp > 25 ? Math.sin(p.walk) * Math.min(0.7, 0.25 + sp / 380) : 0;
    d.legs[0].hip.rotation.z = sw; d.legs[1].hip.rotation.z = -sw;
    d.legs[0].knee.rotation.z = -Math.max(0, -sw) * 1.2; d.legs[1].knee.rotation.z = -Math.max(0, sw) * 1.2;
    d.upper.rotation.y = -p.aim;
    d.upper.position.y = 17 + (sp > 25 ? Math.abs(Math.sin(p.walk)) * 1.4 : Math.sin(t * 3) * 0.4);
    d.head.rotation.z = Math.sin(t * 1.3) * 0.04;
    const w = MB.Weapons.current(p);
    if (d.gunId !== w.id) { d.gunHolder.clear(); d.gunHolder.add(buildGun(w.id)); d.gunId = w.id; }
    const s = MB.Weapons.DEFS[w.id];
    const reloadK = w.reloading > 0 ? 1 - w.reloading / (s.reload * (1 - 0.12 * p.mods.mag)) : 0;
    d.gunHolder.position.x = 12 - p.recoil * 0.8;
    d.gunHolder.rotation.z = -Math.sin(reloadK * Math.PI) * 0.7;
    d.gunHolder.rotation.x = Math.sin(reloadK * Math.PI) * 0.5;
    const tip = d.gunHolder.children[0] ? d.gunHolder.children[0].userData.tip : 36;
    d.muzzle.visible = p.muzzle > 0;
    if (d.muzzle.visible) { d.muzzle.position.set(12 + tip, 14.5, 1.5); const k = 12 + Math.random() * 9; d.muzzle.scale.set(k, k, 1); }
    d.bodyMat.emissive.setHex(p.hurtT > 0 ? 0xff2a2a : 0x000000);
    d.bodyMat.emissiveIntensity = p.hurtT > 0 ? 0.8 : 1;
    m.visible = !(p.iframes > 0 && !p.dash && !p.dead && Math.floor(t * 20) % 2 === 0);
    d.upper.scale.set(p.dash ? 1.12 : 1, p.dash ? 0.82 : 1, 1);
    d.ring.material.opacity = 0.35 + Math.sin(t * 4) * 0.15;
    if (p.dead) {
      const k = Math.min(1, p.deadT * 2.2);
      m.rotation.set(0, -p.aim, 0); d.legGroup.rotation.y = 0;
      m.rotation.z = k * 1.45; d.ring.visible = false;
    } else if (m.rotation.z !== 0 || m.rotation.y !== 0) {
      // hồi sinh (đấu lại boss): dựng Hunter đứng thẳng lại
      m.rotation.set(0, 0, 0); d.ring.visible = true;
    }
  }

  /* ================= MODEL: ZOMBIE ================= */
  function buildZombie(o) {
    o = o || {};
    const g = new T.Group();
    const skin = skinMat(o.skin || 0x8b9b78), cloth = std(o.cloth || 0x46525c, { rough: 0.95 }), shirt = std(o.shirt || 0x7a735a, { own: true, rough: 0.95 });
    const legs = [];
    for (const z of [-4.6, 4.6]) {
      const hip = joint(g, 0, 19, z, 3.5, 3, 10, cloth);
      const knee = joint(hip.userData.end, 0, 0, 0, 3, 2.3, 9, skin, skin);
      const foot = mesh(cap(2.3, 4.5), skin, 2.3, -9.3, 0); foot.rotation.z = Math.PI / 2; knee.userData.end.add(foot);
      legs.push({ hip, knee });
    }
    const torso = new T.Group(); torso.position.y = 19; torso.rotation.z = -0.32; g.add(torso);
    const pelvis = mesh(sph(6, 14), cloth, 0, 1, 0); pelvis.scale.set(0.9, 0.7, 1.25); torso.add(pelvis);
    const chest = mesh(bumpy('zchest', new T.SphereGeometry(8, 22, 16), 0.5, 0.9), shirt, 0, 10, 0); chest.scale.set(0.85, 1.15, 1.15); torso.add(chest);
    // vết thương hở + xương sườn
    torso.add(mesh(sph(3.2, 10), std(0x5a1414, { emissive: 0x3a0505, rough: 0.4 }), 6, 10, 3));
    for (let i = 0; i < 3; i++) { const r = mesh(cyl(0.5, 0.5, 6, 6), std(0xe0d4bc), 6.6, 8 + i * 2, 3); r.rotation.x = Math.PI / 2; torso.add(r); }
    const pm = glowMat(o.pustule || 0xaaff5a, 1.4);
    if (o.pustule !== false) torso.add(mesh(sph(2.2, 8), pm, -6, 13, 5), mesh(sph(1.7, 8), pm, -5, 17, -6), mesh(sph(1.5, 8), pm, -3, 7, -8));
    const arms = [];
    for (const z of [-8.8, 8.8]) {
      torso.add(mesh(sph(3.3, 10), skin, 0, 16, z));
      const sh = joint(torso, 0, 16, z, 2.8, 2.3, 10, skin);
      sh.rotation.z = o.arms == null ? 1.35 : o.arms; sh.rotation.x = z > 0 ? -0.15 : 0.15;
      const el = joint(sh.userData.end, 0, 0, 0, 2.3, 1.8, 9, skin, skin); el.rotation.z = 0.2;
      const hand = el.userData.end;
      hand.add(mesh(sph(2.4, 10), skin, 0, -1, 0));
      for (let f = -1; f <= 1; f++) { const fi = limb(0.7, 0.45, 4.2, skin); fi.position.set(0, -2.4, f * 1.3); fi.rotation.x = f * 0.35; hand.add(fi); }
      arms.push({ sh, el });
    }
    torso.add(mesh(cyl(2.4, 2.8, 4, 10), skin, 1, 19.5, 0));
    const head = new T.Group(); head.position.set(2.5, 25.5, 0); torso.add(head);
    const skull = mesh(bumpy('zskull', new T.SphereGeometry(6.4, 22, 16), 0.45, 1.2), skin, 0, 0, 0); skull.scale.set(1.05, 1.1, 0.95); head.add(skull);
    const jaw = new T.Mesh(G3('zjaw', () => new T.SphereGeometry(4.6, 16, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2)), skin);
    jaw.position.set(2.2, -2.6, 0); jaw.scale.set(1.1, 0.9, 0.85); head.add(jaw);
    head.add(mesh(sph(2.6, 10), std(0x2a0808, { rough: 0.3 }), 4.6, -2.4, 0));
    for (const z of [-2.3, 2.3]) {
      head.add(mesh(sph(1.9, 10), std(0x1a1a14, { rough: 0.3 }), 5, 1.2, z));
      head.add(mesh(sph(1.1, 8), glowMat(o.eye || 0xe9ff9a, 2.4), 5.9, 1.2, z));
    }
    const hair = std(o.hair || 0x2b2620);
    if (o.hair !== false) for (let i = 0; i < 5; i++) head.add(mesh(sph(1.6, 6), hair, -2 + i * 1.2, 5.6 - Math.abs(i - 2) * 0.4, (i % 2 ? 1 : -1) * 1.5));
    g.userData = { legs, torso, arms, head, h: 46, arms0: o.arms == null ? 1.35 : o.arms, hunch: o.hunch == null ? -0.32 : o.hunch, gait: o.gait || 5.5 };
    torso.rotation.z = g.userData.hunch;
    if (o.extra) o.extra(KIT, torso, head, g);
    if (o.scale) g.scale.set(o.scale[0], o.scale[1], o.scale[2]);
    return g;
  }
  function animZombie(e, m, G) {
    const d = m.userData, t = G.time, ph = t * d.gait + e.t;
    const moving = Math.hypot(e.vx, e.vy) > 10, sw = moving ? Math.sin(ph) * 0.5 : 0;
    d.legs[0].hip.rotation.z = sw; d.legs[1].hip.rotation.z = -sw;
    d.legs[0].knee.rotation.z = -Math.max(0, -sw) * 1.3; d.legs[1].knee.rotation.z = -Math.max(0, sw) * 1.3;
    d.torso.rotation.z = d.hunch + Math.sin(ph * 0.5) * 0.05;
    d.torso.rotation.x = Math.sin(ph * 0.5) * 0.08;
    d.arms[0].sh.rotation.z = d.arms0 + Math.sin(ph) * 0.15; d.arms[1].sh.rotation.z = d.arms0 - Math.sin(ph) * 0.15;
    d.head.rotation.x = Math.sin(t * 1.7 + e.t) * 0.2;
    d.head.rotation.z = -0.1 + Math.sin(t * 2.3 + e.t) * 0.08;
  }

  /* ================= MODEL: NHỆN / NỮ HOÀNG NHỆN ================= */
  function buildSpiderLike(o) {
    const g = new T.Group(), s = o.scale || 1;
    const bodyM = skinMat(o.body, { rough: 0.5, metal: 0.05 }), headM = skinMat(o.head, { rough: 0.45 }), legM = std(o.leg, { rough: 0.55 });
    const core = new T.Group(); core.scale.setScalar(s); g.add(core);
    const ab = mesh(bumpy('sab', new T.SphereGeometry(9, 24, 18), 0.35, 1.1), bodyM, -9, 10, 0); ab.scale.set(1.3, 0.85, 1.05); core.add(ab);
    core.add(mesh(sph(2.4, 10), legM, -1, 9, 0));
    const ce = mesh(sph(6.3, 20), headM, 4.5, 9, 0); ce.scale.set(1.15, 0.72, 1); core.add(ce);
    if (o.mark) {
      const mk = mesh(G3('oct', () => new T.OctahedronGeometry(3.4, 1)), glowMat(o.mark, 1.8), -9, 17.2, 0); mk.scale.set(1.8, 0.4, 0.9); core.add(mk);
      for (let i = 0; i < 4; i++) core.add(mesh(sph(1.1, 8), glowMat(o.mark, 1.6), -16 + i * 3, 15.5 - Math.abs(i - 1.5) * 0.6, (i % 2 ? 3.5 : -3.5)));
    }
    const eyeB = std(0x0c0c0c, { rough: 0.15, metal: 0.4 });
    for (const z of [-1.9, 1.9]) { core.add(mesh(sph(1.6, 10), eyeB, 9.6, 10.6, z)); core.add(mesh(sph(0.5, 6), glowMat(o.eye, 3), 10.9, 11, z)); }
    for (const z of [-3.3, -1, 1, 3.3]) core.add(mesh(sph(0.8, 6), glowMat(o.eye, 2.5), 8.6, 12.2, z));
    for (const z of [-1.5, 1.5]) { const f = limb(1.3, 0.4, 5, std(0x241414, { rough: 0.3 })); f.position.set(10.5, 8, z); f.rotation.z = 0.5; core.add(f); }
    if (o.sacs) for (const z of [-8.5, 8.5]) for (let i = 0; i < 3; i++) core.add(mesh(sph(2.2, 10), glowMat(0x7fd63a, 1.2), -13 + i * 4, 9, z * (0.9 + i * 0.05)));
    if (o.spikes) for (let i = 0; i < 5; i++) { const c = mesh(G3('spk', () => new T.ConeGeometry(1.2, 5, 6)), legM, -15 + i * 3.4, 17.5 - Math.abs(i - 2) * 0.6, 0); c.rotation.z = 0.4; core.add(c); }
    const legs = [];
    for (const side of [-1, 1]) for (let k = 0; k < 4; k++) {
      const a = side * (Math.PI / 2 + (k - 1.5) * 0.48);
      const lg = new T.Group(); lg.position.set(5.5 - k * 2.2, 9, side * 3.5); lg.rotation.y = -a; core.add(lg);
      const lw = o.legW || 1.3;
      const femur = joint(lg, 0, 0, 0, 1.5 * lw, 1.15 * lw, 12, legM, legM); femur.rotation.z = 2.1;
      const tibia = joint(femur.userData.end, 0, 0, 0, 1.15 * lw, 0.45 * lw, 14, legM, legM); tibia.rotation.z = -1.9;
      legs.push({ g: lg, femur, a, k, side });
    }
    const stars = new T.Group(); stars.visible = false; stars.position.y = 30 * s; g.add(stars);
    for (let i = 0; i < 3; i++) stars.add(mesh(sph(3, 6), glowMat(0xffd56a, 2), 0, 0, 0, false));
    g.userData = { core, legs, stars, h: 18 * s };
    return g;
  }
  function animSpiderLike(e, m, G) {
    const d = m.userData, t = G.time;
    const moving = Math.hypot(e.vx, e.vy) > 15;
    const f = e.boss ? (e.state === 'dash' ? 22 : 9) : 18;
    for (const L of d.legs) {
      const ph = t * f + e.t + L.k * 1.6 + (L.side > 0 ? Math.PI : 0) + (L.k % 2 ? Math.PI : 0);
      L.g.rotation.y = -L.a + (moving ? Math.sin(ph) * 0.3 : 0);
      L.femur.rotation.z = 2.1 + (moving ? Math.max(0, Math.cos(ph)) * 0.35 : 0) - (e.state === 'crouch' ? 0.35 : 0);
    }
    d.core.position.y = (e.state === 'leap' ? 12 : 0) + (moving ? Math.abs(Math.sin(t * f)) * 0.6 : 0);
    d.stars.visible = e.state === 'stunned';
    if (d.stars.visible) d.stars.children.forEach((c, i) => { const a = t * 5 + i * 2.1; c.position.set(Math.cos(a) * 40, 0, Math.sin(a) * 40); });
    if (e.boss && e.phase === 3 && !d.p3) { d.p3 = true; ownMats(m)[0].color.setHex(0x6e2222); }
  }

  /* ================= MODEL: LICKER ================= */
  function buildLicker(o) {
    o = o || {};
    const g = new T.Group();
    const muscle = skinMat(o.muscle || 0xa8383a, { rough: 0.45 }), sinew = std(o.sinew || 0x6a1d1f, { rough: 0.5 }), bone = std(o.bone || 0xe8d8c0, { rough: 0.6 });
    const up = new T.Group(); g.add(up);
    const body = mesh(bumpy('lbody', new T.CapsuleGeometry(6.5, 18, 6, 16), 0.35, 1.1), muscle, -1, 13, 0); body.rotation.z = Math.PI / 2; body.scale.set(0.85, 1, 1.15); up.add(body);
    for (let i = -9; i <= 7; i += 4) { const r = mesh(G3('lrib', () => new T.TorusGeometry(6.4, 0.7, 6, 18)), sinew, i, 13, 0); r.rotation.y = Math.PI / 2; r.scale.set(1.15, 0.85, 1); up.add(r); }
    for (let i = -10; i <= 8; i += 3) up.add(mesh(sph(1.3, 6), bone, i, 18.8, 0));
    const head = new T.Group(); head.position.set(14, 14, 0); up.add(head);
    const skull = mesh(sph(5.4, 18), muscle, 0, 0, 0); skull.scale.set(1.3, 0.85, 1); head.add(skull);
    const brain = mesh(bumpy('brain', new T.IcosahedronGeometry(4.3, 3), 0.55, 2.4), std(o.brain || 0xf0a3a8, { rough: 0.35, emissive: o.brainGlow || 0x000000, ei: 0.5 }), -0.5, 3.6, 0); brain.scale.set(1.2, 0.8, 1); head.add(brain);
    const jaw = new T.Mesh(G3('ljaw', () => new T.SphereGeometry(4, 14, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2)), sinew); jaw.position.set(3.5, -1.5, 0); jaw.scale.set(1.4, 0.8, 0.85); head.add(jaw);
    const tooth = std(0xf4ecd8, { rough: 0.3 });
    for (let i = 0; i < 6; i++) { const c = mesh(G3('tooth', () => new T.ConeGeometry(0.5, 2, 5)), tooth, 6 + (i % 3) * 0.9, -1, (i < 3 ? -1 : 1) * (1.4 + (i % 3) * 0.6)); c.rotation.z = Math.PI; head.add(c); }
    const tongue = limb(1.4, 0.6, 22, std(0xd24b5a, { emissive: 0x4a0a10, rough: 0.3 })); tongue.position.set(7, -1, 0); tongue.rotation.z = Math.PI / 2 + 0.05; tongue.visible = false; head.add(tongue);
    const limbs = [];
    for (const [x, side, front] of [[8, -1, 1], [8, 1, 1], [-9, -1, 0], [-9, 1, 0]]) {
      const yawG = new T.Group(); yawG.position.set(x, 12, side * 6); yawG.rotation.y = -(side * (Math.PI / 2 - (front ? 0.55 : -0.55))); up.add(yawG);
      const sh = joint(yawG, 0, 0, 0, 2.7, 2.1, 10, muscle, sinew); sh.rotation.z = 1.45;
      const el = joint(sh.userData.end, 0, 0, 0, 2.1, 1.4, 11, muscle, sinew); el.rotation.z = -1.55;
      for (let c = -1; c <= 1; c++) { const cl = mesh(G3('claw', () => new T.ConeGeometry(0.6, front ? 5 : 3.5, 5)), bone, 1.5, -11, c * 1.1); cl.rotation.z = -Math.PI / 2 - 0.4; el.add(cl); }
      limbs.push({ sh, el, side, front });
    }
    g.userData = { up, limbs, tongue, head, h: 26 };
    if (o.extra) o.extra(KIT, up, head, g);
    return g;
  }
  function animLicker(e, m, G) {
    const d = m.userData, t = G.time, moving = Math.hypot(e.vx, e.vy) > 10;
    d.limbs.forEach((l, i) => {
      const ph = t * 11 + e.t + (i === 0 || i === 3 ? 0 : Math.PI);
      l.sh.rotation.z = 1.45 + (moving ? Math.max(0, Math.sin(ph)) * 0.4 : 0);
      l.sh.rotation.x = moving ? Math.cos(ph) * 0.25 * l.side : 0;
    });
    d.up.position.y = moving ? Math.abs(Math.sin(t * 11 + e.t)) * 1 : 0;
    d.up.position.x = e.state === 'aim' ? -3 : 0;
    d.head.rotation.z = e.state === 'aim' ? 0.25 : Math.sin(t * 3 + e.t) * 0.08;
    d.tongue.visible = e.state === 'aim';
    if (d.tongue.visible) d.tongue.scale.y = 0.4 + Math.abs(Math.sin(t * 20)) * 0.3;
  }

  function buildGeneric(e) {
    const g = new T.Group(), c = std(0x999999, { own: true });
    g.add(mesh(cap(e.def.r * 0.6, e.def.r * 0.6), c, 0, e.def.r, 0));
    g.userData = { h: e.def.r * 2 };
    return g;
  }

  /* ================= KHUÔN MODEL DÙNG CHUNG CHO CÁC GATE ================= */
  // khối thịt phồng (bloater, sludge): thân cầu sần + mụn phát sáng + chân ngắn
  function buildBlob(o) {
    o = o || {};
    const g = new T.Group(), skin = skinMat(o.color || 0x7d8f4a, { rough: 0.5 });
    const body = mesh(bumpy('blob' + (o.seed || 0), new T.SphereGeometry(12, 26, 20), 0.9, 0.7), skin, 0, 14, 0); body.scale.set(1.1, 1, 1.1); g.add(body);
    const pm = glowMat(o.glow || 0xc8ff5a, 1.3);
    const rnd = U.seeded(o.seed || 5);
    for (let i = 0; i < (o.pustules || 9); i++) { const a = rnd() * U.TAU, b = rnd() * 1.2 - 0.2; g.add(mesh(sph(1.6 + rnd() * 2, 8), pm, Math.cos(a) * 11 * Math.cos(b), 14 + Math.sin(b) * 11, Math.sin(a) * 11 * Math.cos(b))); }
    const legs = [];
    for (const z of [-5, 5]) { const l = joint(g, 0, 6, z, 3, 2.4, 6, skin); legs.push(l); }
    if (o.face !== false) { g.add(mesh(sph(2.4, 10), std(0x2a0a0a), 11, 16, 0)); for (const z of [-3, 3]) g.add(mesh(sph(1.2, 8), glowMat(o.eye || 0xffe060, 2), 10.5, 19, z)); }
    g.userData = { body, legs, h: 28, base: body.scale.clone() };
    return g;
  }
  function animBlob(e, m, G) {
    const d = m.userData, t = G.time;
    const sw = e.swell || 0, pul = 1 + Math.sin(t * (6 + sw * 20) + e.t) * (0.04 + sw * 0.08) + sw * 0.35;
    d.body.scale.set(d.base.x * pul, d.base.y * pul, d.base.z * pul);
    const mv = Math.hypot(e.vx, e.vy) > 8 ? Math.sin(t * 9 + e.t) * 0.5 : 0;
    d.legs[0].rotation.z = mv; d.legs[1].rotation.z = -mv;
  }
  // sinh vật bay (dơi, drone, bóng ma băng)
  function buildFlyer(o) {
    o = o || {};
    const g = new T.Group(), bodyM = skinMat(o.body || 0x6b4a7a, { rough: 0.5, metal: o.metal || 0 }), wingM = std(o.wing || 0x4a2f5a, { rough: 0.7 });
    const body = mesh(o.drone ? box(14, 6, 14) : sph(6, 14), bodyM, 0, 0, 0); if (!o.drone) body.scale.set(1.3, 0.9, 1); g.add(body);
    const wings = [];
    for (const side of [-1, 1]) {
      const w = new T.Group(); w.position.set(0, 0, side * 4); g.add(w);
      if (o.drone) { const arm = mesh(box(3, 2, 12), wingM, 0, 1, side * 5); w.add(arm); const rot = mesh(cyl(7, 7, 0.8, 16), std(0x9aa9ad, { own: true, transparent: true, opacity: 0.45 }), 0, 3, side * 11, false); w.add(rot); w.userData.rot = rot; }
      else { const m = new T.Mesh(G3('wing', () => { const sh = new T.Shape(); sh.moveTo(0, 0); sh.lineTo(-6, 16); sh.lineTo(2, 12); sh.lineTo(6, 18); sh.lineTo(8, 4); sh.lineTo(0, 0); const ge = new T.ShapeGeometry(sh); ge.rotateX(-Math.PI / 2); return ge; }), wingM); m.material.side = T.DoubleSide; m.scale.set(1, 1, side); w.add(m); }
      wings.push(w);
    }
    for (const z of [-2, 2]) g.add(mesh(sph(1.3, 8), glowMat(o.eye || 0xff6b8a, 2.2), 7, 1.5, z));
    if (o.extra) o.extra(KIT, g);
    g.userData = { wings, body, h: 12, drone: !!o.drone };
    return g;
  }
  function animFlyer(e, m, G) {
    const d = m.userData, t = G.time;
    if (d.drone) { d.wings.forEach((w) => { if (w.userData.rot) w.userData.rot.rotation.y = t * 30; }); d.body.rotation.x = Math.sin(t * 3 + e.t) * 0.1; return; }
    const f = Math.sin(t * 26 + e.t) * 0.7;
    d.wings[0].rotation.x = f; d.wings[1].rotation.x = -f;
  }
  // người khổng lồ đá / băng / dung nham
  function buildGolem(o) {
    o = o || {};
    const g = new T.Group(), s = o.scale || 1;
    const core = new T.Group(); core.scale.setScalar(s); g.add(core);
    const stone = std(o.stone || 0x6b6156, { flat: true, rough: 0.9, own: true }), glow = glowMat(o.glow || 0xff8a4c, 1.5);
    const torso = mesh(bumpy('gtorso', new T.IcosahedronGeometry(16, 1), 1.6, 0.35), stone, -2, 30, 0); torso.scale.set(1, 0.95, 1.25); core.add(torso);
    const head = mesh(bumpy('ghead', new T.IcosahedronGeometry(7, 1), 0.8, 0.6), stone, 14, 38, 0); core.add(head);
    for (const z of [-3, 3]) core.add(mesh(sph(1.6, 8), glow, 20, 39, z));
    for (let i = 0; i < 4; i++) core.add(mesh(box(1.2, 10, 1.2), glow, -4 + i * 4, 30 + (i % 2) * 6, 13.5 * (i % 2 ? 1 : -1)));
    if (o.crystal) for (let i = 0; i < 5; i++) { const c = mesh(G3('gcr', () => new T.ConeGeometry(2.6, 12, 5)), glowMat(o.crystal, 1.1), -12 + i * 2, 42 + (i % 2) * 3, -8 + i * 4); c.rotation.set(0.3, 0, 0.5 - i * 0.1); core.add(c); }
    const arms = [];
    for (const z of [-19, 19]) {
      const sh = joint(core, 0, 38, z, 6, 5, 16, stone, stone); sh.rotation.z = 0.35;
      const fist = mesh(bumpy('gfist', new T.IcosahedronGeometry(7.5, 1), 0.9, 0.6), stone, 0, -18, 0); sh.userData.end.add(fist);
      arms.push(sh);
    }
    const legs = [];
    for (const z of [-8, 8]) { const l = joint(core, -2, 18, z, 6, 5.5, 16, stone); legs.push(l); }
    if (o.extra) o.extra(KIT, core, g);
    g.userData = { core, arms, legs, head, h: 50 * s };
    return g;
  }
  function animGolem(e, m, G) {
    const d = m.userData, t = G.time, mv = Math.hypot(e.vx, e.vy) > 10;
    const sw = mv ? Math.sin(t * 4 + e.t) * 0.35 : 0;
    d.legs[0].rotation.z = sw; d.legs[1].rotation.z = -sw;
    const lift = e.state === 'slamPrep' || e.state === 'windup' ? 1 - (e.st || 0) / 0.8 : 0;
    d.arms[0].rotation.z = 0.35 - sw * 0.6 + lift * 2.4; d.arms[1].rotation.z = 0.35 + sw * 0.6 + lift * 2.4;
    d.core.position.y = mv ? Math.abs(Math.sin(t * 4)) * 1.2 : 0;
  }
  const KIT = { get T() { return T; }, U, std, glowMat, skinMat, mesh, box, sph, cyl, cap, limb, joint, limbBetween, bumpy, glowSprite, G3, ownMats, radialTex,
    buildZombie, animZombie, buildSpiderLike, animSpiderLike, buildLicker, animLicker, buildBlob, animBlob, buildFlyer, animFlyer, buildGolem, animGolem };

  const MODELS = {
    zombie: { build: () => buildZombie(), anim: animZombie, base: 19 },
    spider: { build: () => buildSpiderLike({ body: 0x6b3b2b, head: 0x8a5040, leg: 0x4e3226, eye: 0xff5040, mark: 0xaaff5a }), anim: animSpiderLike, base: 14 },
    licker: { build: () => buildLicker(), anim: animLicker, base: 18 },
    spiderQueen: { build: () => buildSpiderLike({ scale: 3.9, legW: 1.25, body: 0x4a2020, head: 0x6b3030, leg: 0x4a2424, eye: 0xffdf8c, mark: 0x6fcf2a, sacs: true, spikes: true }), anim: animSpiderLike, base: 54 },
  };

  /* ================= VẬT CẢN ================= */
  let crateTex = null, barkTex = null;
  const PROPS3D = {}, ACTORS3D = {}, HAZ3D = {
    virus: { inner: 'rgba(210,255,130,0.9)', outer: 'rgba(70,200,50,0)', add: true, opacity: 0.6, bub: 0xd8ffa0 },
    acid: { inner: 'rgba(200,255,90,0.9)', outer: 'rgba(90,200,30,0)', add: true, opacity: 0.6, bub: 0xd8ffa0 },
    mud: { inner: 'rgba(70,52,30,0.95)', outer: 'rgba(60,45,25,0)', add: false, opacity: 0.9, bub: 0x6b5a3a, y: 0.8 },
    lava: { inner: 'rgba(255,220,120,1)', outer: 'rgba(255,80,20,0.15)', add: true, opacity: 0.95, bub: 0xffc060 },
    ice: { inner: 'rgba(230,248,255,0.85)', outer: 'rgba(170,215,255,0.2)', add: false, opacity: 0.75 },
    water: { inner: 'rgba(60,150,200,0.75)', outer: 'rgba(40,110,170,0.15)', add: false, opacity: 0.8 },
    fire: { inner: 'rgba(255,200,90,1)', outer: 'rgba(255,90,20,0)', add: true, opacity: 0.85, bub: 0xffa040 },
    oil: { inner: 'rgba(15,12,10,0.95)', outer: 'rgba(15,12,10,0)', add: false, opacity: 0.85 },
    gas: { inner: 'rgba(190,230,90,0.55)', outer: 'rgba(150,200,60,0)', add: true, opacity: 0.5, bub: 0xd8ff8a },
  };
  function buildProp(o) {
    if (PROPS3D[o.kind]) { const pg = PROPS3D[o.kind](o, KIT); pg.position.set(o.x, 0, o.y); return pg; }
    const g = new T.Group();
    const rnd = U.seeded(Math.floor(o.x * 7 + o.y * 13));
    if (o.kind === 'tree') {
      g.add(mesh(cyl(o.r * 0.18, o.r * 0.26, 46, 7), std(0x4a3322), 0, 23, 0));
      const cm = std(o.c1 ? new T.Color(o.c1).getHex() : 0x2f5634, { own: true, flat: true, transparent: true });
      const cm2 = std(o.c2 ? new T.Color(o.c2).getHex() : 0x3f7244, { own: true, flat: true, transparent: true });
      const ico = (r) => G3('ico' + Math.round(r), () => new T.IcosahedronGeometry(Math.round(r), 0));
      const a = mesh(ico(o.r * 0.95), cm, 0, 58, 0); a.scale.y = 0.75; a.rotation.y = rnd() * 6; g.add(a);
      const b = mesh(ico(o.r * 0.62), cm2, -o.r * 0.25, 78, -o.r * 0.15); b.rotation.y = rnd() * 6; g.add(b);
      const c = mesh(ico(o.r * 0.5), cm2, o.r * 0.3, 72, o.r * 0.25); c.rotation.y = rnd() * 6; g.add(c);
      if (o.infected) for (let i = 0; i < 3; i++) g.add(mesh(sph(4, 6), glowMat(0xaaff5a, 1.6), (rnd() - 0.5) * o.r, 50 + rnd() * 30, o.r * 0.7, false));
      g.userData.canopy = [cm, cm2];
    } else if (o.kind === 'rock') {
      const r = mesh(G3('rock' + Math.round(o.r), () => new T.DodecahedronGeometry(Math.round(o.r), 0)), std(o.c1 ? new T.Color(o.c1).getHex() : 0x646b6d, { flat: true }), 0, o.r * 0.25, 0);
      r.scale.set(1, 0.62, 0.92); r.rotation.set(rnd(), rnd() * 6, rnd() * 0.3); g.add(r);
    } else if (o.kind === 'log') {
      if (!barkTex) {
        const cv = document.createElement('canvas'); cv.width = 64; cv.height = 128; const c = cv.getContext('2d');
        c.fillStyle = '#8a6440'; c.fillRect(0, 0, 64, 128);
        for (let i = 0; i < 40; i++) { c.strokeStyle = `rgba(${40 + Math.random() * 30},${25 + Math.random() * 20},12,.7)`; c.lineWidth = 1 + Math.random() * 2; const x = Math.random() * 64; c.beginPath(); c.moveTo(x, 0); c.bezierCurveTo(x + 6, 40, x - 6, 80, x + 3, 128); c.stroke(); }
        for (let i = 0; i < 8; i++) { c.fillStyle = 'rgba(70,90,40,.35)'; c.beginPath(); c.ellipse(Math.random() * 64, Math.random() * 128, 8, 4, 0, 0, 6.3); c.fill(); }
        barkTex = new T.CanvasTexture(cv); barkTex.wrapS = barkTex.wrapT = T.RepeatWrapping; barkTex.colorSpace = T.SRGBColorSpace;
      }
      const bm = std(0xffffff, { own: true, rough: 0.95 }); bm.map = barkTex;
      const l = mesh(G3('logc' + o.hh + '_' + o.w, () => new T.CylinderGeometry(o.hh, o.hh * 1.08, o.w, 18, 1)), bm, 0, o.hh * 0.9, 0); l.rotation.z = Math.PI / 2; g.add(l);
      for (let i = 0; i < 2; i++) { const br = mesh(cyl(o.hh * 0.22, o.hh * 0.3, o.hh * 1.6, 7), bm, -o.w * 0.2 + i * o.w * 0.35, o.hh * 1.5, (i ? -1 : 1) * o.hh * 0.4); br.rotation.x = (i ? -1 : 1) * 0.9; g.add(br); }
      const capM = std(0xb08355);
      const c1 = mesh(cyl(o.hh * 0.9, o.hh * 0.9, 1, 10), capM, o.hw, o.hh, 0); c1.rotation.z = Math.PI / 2; g.add(c1);
      g.rotation.y = -o.rot;
    } else if (o.kind === 'crate') {
      if (!crateTex) {
        const cv = document.createElement('canvas'); cv.width = cv.height = 128; const c = cv.getContext('2d');
        c.fillStyle = '#8b6133'; c.fillRect(0, 0, 128, 128);
        c.strokeStyle = '#c0915a'; c.lineWidth = 8; c.strokeRect(8, 8, 112, 112);
        c.beginPath(); c.moveTo(14, 14); c.lineTo(114, 114); c.moveTo(114, 14); c.lineTo(14, 114); c.stroke();
        c.fillStyle = '#4b5559'; [[0, 0], [108, 0], [0, 108], [108, 108]].forEach(([x, y]) => c.fillRect(x, y, 20, 20));
        c.fillStyle = '#ffd56a'; c.beginPath(); c.arc(64, 64, 18, 0, 7); c.fill();
        c.fillStyle = '#5a3c18'; c.fillRect(60, 52, 8, 24); c.fillRect(52, 60, 24, 8);
        crateTex = new T.CanvasTexture(cv); crateTex.colorSpace = T.SRGBColorSpace;
      }
      const mt = new T.MeshStandardMaterial({ map: crateTex, roughness: 0.85 }); mt.userData.own = true;
      g.add(mesh(box(o.w, 44, o.h), mt, 0, 22, 0));
      g.rotation.y = -(o.rot || 0);
      g.userData.flashMat = mt;
    } else if (o.kind === 'nest') {
      const mt = std(0x4a2c4f, { own: true, rough: 0.6 });
      const b = mesh(sph(o.r, 16), mt, 0, 4, 0); b.scale.y = 0.62; g.add(b);
      const sp = std(0x3c2440);
      for (let i = 0; i < 8; i++) {
        const a = i / 8 * U.TAU, c = mesh(G3('cone', () => new T.ConeGeometry(4, 22, 6)), sp, Math.cos(a) * o.r * 0.8, 14, Math.sin(a) * o.r * 0.8);
        c.rotation.set(Math.sin(a) * 0.7, 0, -Math.cos(a) * 0.7); g.add(c);
      }
      const core = mesh(sph(o.r * 0.42, 12), glowMat(0xc8ff7a, 1.8), 0, o.r * 0.55, 0, false); g.add(core);
      const gl = glowSprite(0xaaff5a, o.r * 3.2, 0.55); gl.position.y = 22; g.add(gl);
      g.userData.flashMat = mt; g.userData.core = core;
    } else {
      // vật cản chưa có model 3D: khối đơn giản
      const h = 30;
      if (o.shape === 'box') { g.add(mesh(box(o.w, h, o.h), std(0x6b6155), 0, h / 2, 0)); g.rotation.y = -o.rot; }
      else g.add(mesh(cyl(o.r, o.r, h, 12), std(0x6b6155), 0, h / 2, 0));
    }
    g.position.set(o.x, 0, o.y);
    return g;
  }

  /* ================= VẬT PHẨM, ĐẠN ================= */
  function buildPickup(it) {
    const g = new T.Group(), inner = new T.Group(); g.add(inner);
    if (it.kind === 'med') {
      inner.add(mesh(box(15, 10, 15), std(0xeef6ee)), mesh(box(4, 2, 11), glowMat(0x3fbf5a, 0.9), 0, 5.5, 0), mesh(box(11, 2, 4), glowMat(0x3fbf5a, 0.9), 0, 5.5, 0));
    } else if (it.kind === 'armor') {
      inner.add(mesh(G3('oct9', () => new T.OctahedronGeometry(9)), std(0x2d8fc0, { metal: 0.3, rough: 0.3, emissive: 0x1d5f80, ei: 0.6 })));
    } else if (it.kind === 'mod') {
      const c = new T.Color(MB.Weapons.MODS[it.id].color).getHex();
      const b = mesh(box(12, 12, 12), std(0x121a1d, { emissive: c, ei: 0.9, rough: 0.3 })); b.rotation.set(0.6, 0, 0.6); inner.add(b);
      g.add(glowSprite(c, 46, 0.65));
    } else if (it.kind === 'grenade') {
      inner.add(mesh(sph(6, 12), std(0x3e5a36, { rough: 0.5 })), mesh(cyl(2, 2, 4, 8), std(0xffb347), 0, 6.5, 0));
      g.add(glowSprite(0xffb347, 36, 0.45));
    } else if (it.kind === 'weapon') {
      const gun = buildGun(it.id); gun.scale.setScalar(1.5); gun.position.x = -24; inner.add(gun);
      g.add(glowSprite(0xffd56a, 80, 0.6));
    }
    g.userData.inner = inner;
    if (it.aid) {
      const ch = new T.Group(); ch.position.y = 34;
      const canopy = new T.Mesh(G3('chute', () => new T.SphereGeometry(15, 18, 8, 0, Math.PI * 2, 0, Math.PI / 2.4)), std(0xe9f2e6, { rough: 0.9 }));
      canopy.material.side = T.DoubleSide; ch.add(canopy);
      ch.add(mesh(box(3, 8, 3), glowMat(0x3fbf5a, 1), 0, 14, 0, false), mesh(box(8, 3, 3), glowMat(0x3fbf5a, 1), 0, 14, 0, false));
      for (const [x, z] of [[-10, -10], [10, -10], [-10, 10], [10, 10]]) limbBetween(ch, [x * 0.9, 3, z * 0.9], [0, -30, 0], 0.3, 0.3, std(0xcfd8cc));
      g.add(ch); g.userData.chute = ch;
    }
    return g;
  }

  /* ================= RENDERER ================= */
  const R3 = MB.R3 = {
    debug: { buildHero: () => buildHero(), animHero: (p, m, G) => animHero(p, m, G), MODELS },
    ready: false,
    async load() {
      if (T) return;
      const url = new URL('js/vendor/three.module.min.js', document.baseURI).href;
      T = await import(url);
      this.T = T; this.ready = true;
    },

    init(G) {
      if (this.renderer) return;
      const low = G.quality() === 'low';
      this.low = low;
      // điện thoại: GPU/bộ nhớ hạn chế → giảm độ phân giải, bóng đổ nhẹ, tắt khử răng cưa (màn hình DPR cao đã đủ nét)
      this.mobile = MB.U.isTouchDevice();
      const canvas = document.getElementById('game3d');
      const r = this.renderer = new T.WebGLRenderer({ canvas, antialias: !low && !this.mobile, powerPreference: this.mobile ? 'default' : 'high-performance' });
      // trình duyệt (nhất là iOS Safari) có thể thu hồi WebGL khi thiếu bộ nhớ → màn hình đen.
      // Bắt sự kiện để chuyển tạm sang 2D, và dựng lại 3D khi WebGL được trả lại.
      canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); this.lost = true; console.warn('[3D] mất WebGL context'); if (MB.G.on3DLost) MB.G.on3DLost(); });
      canvas.addEventListener('webglcontextrestored', () => { this.lost = false; console.info('[3D] WebGL context đã khôi phục'); if (MB.G.on3DRestored) MB.G.on3DRestored(); });
      r.outputColorSpace = T.SRGBColorSpace;
      r.toneMapping = T.ACESFilmicToneMapping; r.toneMappingExposure = 1.45;
      r.shadowMap.enabled = true; r.shadowMap.type = low ? T.BasicShadowMap : this.mobile ? T.PCFShadowMap : T.PCFSoftShadowMap;
      this.camera = new T.PerspectiveCamera(40, 1, 20, 6000);
      this.ray = new T.Raycaster(); this.plane = new T.Plane(new T.Vector3(0, 1, 0), 0);
      this.v = new T.Vector3(); this.v2 = new T.Vector2();
      this.tgt = { x: 0, y: 0 };
      this.resize(G);
    },
    resize(G) {
      if (!this.renderer) return;
      const W = G.W, H = G.H;
      this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, this.low ? 1 : this.mobile ? 1.25 : 1.75));
      this.renderer.setSize(W, H, false);
      this.camera.aspect = W / H;
      // khoảng cách camera sao cho tầm nhìn tương đương bản 2D
      const visW = W / G.zoom * 0.82;
      const visH = visW / this.camera.aspect;
      this.dist = Math.max(500, visH / (2 * Math.tan(this.camera.fov * Math.PI / 360)));
      this.camera.far = this.dist * 4;
      this.camera.updateProjectionMatrix();
    },

    build(G) {
      const d = G.def;
      this.G = G;
      if (this.scene) this.teardown();
      const scene = this.scene = new T.Scene();
      const bg = new T.Color(d.bg || '#06100a');
      scene.background = bg;
      scene.fog = new T.Fog(bg, this.dist * 1.15, this.dist * 2.6);
      // ánh sáng theo từng Gate (hoàng hôn, ban đêm…) — mặc định: trời trưa
      const L3 = d.light3d || {};
      scene.add(new T.HemisphereLight(L3.hemiSky || 0xdff2e4, L3.hemiGround || 0x2a3a26, L3.hemi != null ? L3.hemi : 1.7));
      this.renderer.toneMappingExposure = L3.exposure || 1.45;
      const sun = this.sun = new T.DirectionalLight(L3.sun || 0xfff0d0, L3.sunI != null ? L3.sunI : 2.4);
      sun.castShadow = this.qLevel !== 2;
      const sm = this.low || this.mobile ? 1024 : 2048;
      sun.shadow.mapSize.set(sm, sm);
      const sc = sun.shadow.camera; sc.left = -1000; sc.right = 1000; sc.top = 1000; sc.bottom = -1000; sc.near = 50; sc.far = 3000;
      sun.shadow.bias = -0.0006; sun.shadow.normalBias = 1.5; sun.shadow.intensity = 0.65;
      scene.add(sun, sun.target);

      // nền: dùng lại texture vẽ của bản 2D
      const tex = this.groundTex = new T.CanvasTexture(G.ground);
      tex.colorSpace = T.SRGBColorSpace; tex.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
      const ground = new T.Mesh(new T.PlaneGeometry(d.world.w, d.world.h), new T.MeshStandardMaterial({ map: tex, roughness: 1 }));
      ground.rotation.x = -Math.PI / 2; ground.position.set(d.world.w / 2, 0, d.world.h / 2); ground.receiveShadow = true;
      scene.add(ground);
      const under = new T.Mesh(new T.PlaneGeometry(d.world.w * 4, d.world.h * 4), new T.MeshBasicMaterial({ color: bg.clone().multiplyScalar(0.7) }));
      under.rotation.x = -Math.PI / 2; under.position.set(d.world.w / 2, -2, d.world.h / 2); scene.add(under);

      // lớp phủ mặt đất: vạch cảnh báo, vòng sóng chấn, vùng thử thách (vẽ 2D lên texture)
      const OV = 1024, cv = document.createElement('canvas'); cv.width = cv.height = this.low ? 512 : OV;
      this.ov = { cv, ctx: cv.getContext('2d'), size: 1900, dirty: true };
      const ovTex = this.ovTex = new T.CanvasTexture(cv); ovTex.colorSpace = T.SRGBColorSpace;
      const ovMesh = this.ovMesh = new T.Mesh(new T.PlaneGeometry(1900, 1900), new T.MeshBasicMaterial({ map: ovTex, transparent: true, depthWrite: false }));
      ovMesh.rotation.x = -Math.PI / 2; ovMesh.position.y = 1.5; ovMesh.renderOrder = 2; scene.add(ovMesh);

      this.root = new T.Group(); scene.add(this.root);
      this.live = {};
      this.frame = 0;

      // nạp model / vật cản / vùng nguy hiểm riêng của các Gate đã tải
      for (const id in MB.Gates.defs) {
        const gd = MB.Gates.defs[id];
        if (gd.__r3done) continue; gd.__r3done = true;
        if (gd.models3d) for (const k in gd.models3d) MODELS[k] = gd.models3d[k](KIT);
        if (gd.props3d) Object.assign(PROPS3D, gd.props3d);
        if (gd.actors3d) Object.assign(ACTORS3D, gd.actors3d);
        if (gd.hazards3d) Object.assign(HAZ3D, gd.hazards3d);
      }
      this.hazTex = this.hazTex || {};
      // trạm tín hiệu (thử thách giữ vùng)
      for (const c of G.challenges) {
        if (c.type !== 'hold') continue;
        const tw = new T.Group(); tw.position.set(c.zone.x, 0, c.zone.y);
        tw.add(mesh(box(34, 10, 34), std(0x3b4a50), 0, 5, 0), mesh(cyl(2.5, 3.5, 70, 8), std(0x56676e, { metal: 0.5, rough: 0.4 }), 0, 45, 0));
        const dish = mesh(sph(12, 12), std(0x9aa9ad, { metal: 0.4 }), 6, 64, 0); dish.scale.set(0.35, 1, 1); tw.add(dish);
        const lamp = mesh(sph(4.5, 10), std(0x2f6c78, { own: true, emissive: 0x7ef3ff, ei: 1 }), 0, 82, 0, false); tw.add(lamp);
        scene.add(tw); c.__lamp = lamp;
      }
      // hạt (instanced)
      const PN = this.low ? 260 : 500;
      this.parts = new T.InstancedMesh(box(1, 1, 1), new T.MeshBasicMaterial({ color: 0xffffff }), PN);
      this.parts.instanceMatrix.setUsage(T.DynamicDrawUsage); this.parts.frustumCulled = false; this.parts.count = 0;
      this.parts.setColorAt(0, new T.Color(1, 1, 1));
      scene.add(this.parts);
      this.mtx = new T.Matrix4(); this.q = new T.Quaternion(); this.sv = new T.Vector3(); this.pv = new T.Vector3();

      const p = G.player;
      this.tgt.x = p.x; this.tgt.y = p.y;
      this.decalT = 0;
      this.lastT = null; // G.time về 0 ở màn mới — không reset sẽ ra dt âm → camera NaN → màn hình đen
    },

    // giải phóng toàn bộ bộ nhớ GPU của màn cũ (geometry/vật liệu/texture dùng lại sẽ tự nạp lại khi cần)
    teardown() {
      if (!this.scene) return;
      const geos = new Set(), mats = new Set(), texs = new Set();
      this.scene.traverse((o) => {
        if (o.geometry) geos.add(o.geometry);
        const ms = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
        for (const m of ms) { mats.add(m); for (const k in m) { const v = m[k]; if (v && v.isTexture) texs.add(v); } }
      });
      geos.forEach((g) => g.dispose()); mats.forEach((m) => m.dispose()); texs.forEach((t) => t.dispose());
      if (this.groundTex) this.groundTex.dispose();
      if (this.ovTex) this.ovTex.dispose();
      if (this.sun && this.sun.shadow.map) { this.sun.shadow.map.dispose(); this.sun.shadow.map = null; }
      if (this.renderer) this.renderer.renderLists.dispose();
      this.scene = null;
    },

    // đồng bộ một danh sách thực thể với mesh (tạo / cập nhật / xoá)
    sync(cat, list, create, update, keepDead) {
      const f = this.frame, live = this.live[cat] || (this.live[cat] = new Set());
      for (const o of list) {
        if (o.dead && !keepDead) continue;
        let m = o.__m3;
        if (!m || m.__r !== this.root) {
          m = create(o); if (!m) continue;
          m.__r = this.root; o.__m3 = m; this.root.add(m); live.add(o);
        }
        m.__f = f; update(o, m);
      }
      for (const o of live) {
        if (o.__m3.__f !== f) { this.root.remove(o.__m3); disposeOwn(o.__m3); o.__m3 = null; live.delete(o); }
      }
    },

    buildHazard(h) {
      const st = HAZ3D[h.kind];
      const g = new T.Group(); g.position.set(h.x, 0, h.y);
      if (h.kind === 'web') {
        if (!this.webTex) {
          const cv = document.createElement('canvas'); cv.width = cv.height = 128; const c = cv.getContext('2d');
          c.strokeStyle = 'rgba(240,240,230,.9)'; c.lineWidth = 2; c.translate(64, 64);
          for (let i = 0; i < 8; i++) { const a = i / 8 * U.TAU; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * 62, Math.sin(a) * 62); c.stroke(); }
          for (let k2 = 1; k2 <= 3; k2++) { c.beginPath(); c.arc(0, 0, 62 * k2 / 3.2, 0, U.TAU); c.stroke(); }
          this.webTex = new T.CanvasTexture(cv);
        }
        const mm = new T.Mesh(G3('circ', () => new T.CircleGeometry(1, 40)), new T.MeshBasicMaterial({ map: this.webTex, transparent: true, depthWrite: false }));
        mm.material.userData.own = true; mm.rotation.x = -Math.PI / 2; mm.scale.set(h.r, h.r, 1); mm.position.y = 2;
        g.add(mm); g.userData = { pool: mm, op: 0.85, r0: h.r }; return g;
      }
      const sty = st || { inner: h.color || 'rgba(255,120,60,.6)', outer: 'rgba(255,120,60,0)', add: false, opacity: 0.6 };
      const vari = Math.abs(Math.floor(h.x * 7 + h.y * 13)) % 3;
      const key = h.kind + (st ? '' : h.color) + vari;
      if (!this.hazTex[key]) this.hazTex[key] = blobTex(sty.inner, sty.outer, vari * 97 + h.kind.length * 13);
      const mat = new T.MeshBasicMaterial({ map: this.hazTex[key], transparent: true, opacity: sty.opacity, depthWrite: false, blending: sty.add ? T.AdditiveBlending : T.NormalBlending });
      mat.userData.own = true;
      const pool = new T.Mesh(G3('circ', () => new T.CircleGeometry(1, 40)), mat);
      pool.rotation.x = -Math.PI / 2; pool.rotation.z = (h.x * 0.37 + h.y * 0.11) % 6.28; pool.scale.set(h.r * 1.2, h.r * 1.2, 1); pool.position.y = sty.y || 1 + (h.layer || 0) * 0.3;
      g.add(pool);
      const u = { pool, op: sty.opacity, r0: h.r, flick: !!sty.flick || h.kind === 'fire' };
      if (sty.bub && h.r > 30 && !this.low && !h.noBub) {
        u.bub = [];
        for (let i = 0; i < 6; i++) { const b = mesh(sph(3, 6), glowMat(sty.bub, 1.6), 0, 2, 0, false); g.add(b); u.bub.push(b); }
      }
      g.userData = u;
      return g;
    },

    onDecal(dc) {
      if (!this.groundTex) return;
      const g = this.G.ground.getContext('2d');
      g.save(); g.setTransform(0.5, 0, 0, 0.5, 0, 0); g.globalAlpha = 0.45; g.fillStyle = dc.color;
      for (const b of dc.blobs) { g.beginPath(); g.arc(dc.x + b[0], dc.y + b[1], b[2], 0, U.TAU); g.fill(); }
      g.restore();
      this.decalDirty = true;
    },

    screenToGround(sx, sy, G) {
      this.v2.set(sx / G.W * 2 - 1, -(sy / G.H) * 2 + 1);
      this.ray.setFromCamera(this.v2, this.camera);
      const hit = this.ray.ray.intersectPlane(this.plane, this.v);
      return hit ? { x: hit.x, y: hit.z } : { x: G.player.x, y: G.player.y };
    },
    project(x, h, y, G) {
      this.pv.set(x, h, y).project(this.camera);
      return { x: (this.pv.x + 1) / 2 * G.W, y: (1 - this.pv.y) / 2 * G.H, vis: this.pv.z < 1 };
    },

    /* ---------- mỗi khung hình ---------- */
    // tự giảm chất lượng nếu máy chạy chậm (FPS thấp kéo dài)
    autoQuality() {
      const now = performance.now(), ft = now - (this.lastNow || now); this.lastNow = now;
      if (ft > 0 && ft < 500) { this.ftAvg = this.ftAvg == null ? ft : this.ftAvg * 0.97 + ft * 0.03; }
      this.qT = (this.qT || 0) + ft;
      if (this.qT < 3000 || this.ftAvg == null) return;
      this.qT = 0;
      if (this.ftAvg > 34 && this.qLevel !== 2) {
        this.qLevel = (this.qLevel || 0) + 1;
        if (this.qLevel === 1) { this.renderer.setPixelRatio(1); this.renderer.setSize(this.G.W, this.G.H, false); }
        else { this.renderer.shadowMap.enabled = false; this.sun.castShadow = false; this.scene.traverse((o) => { if (o.material) o.material.needsUpdate = true; }); }
        console.info('[3D] giảm chất lượng, mức', this.qLevel);
      }
    },

    render(G) {
      if (!this.scene || this.lost) return;
      this.frame++;
      this.autoQuality();
      const t = G.time, p = G.player, I = MB.Input, dt = U.clamp(t - (this.lastT == null ? t : this.lastT), 0, 0.05); this.lastT = t;
      if (!Number.isFinite(this.tgt.x) || !Number.isFinite(this.tgt.y)) { this.tgt.x = p.x; this.tgt.y = p.y; }

      // camera theo người chơi + nhìn trước theo hướng ngắm
      let lx = 0, ly = 0;
      if (I.mode === 'kb' && this.camReady) {
        const w = this.screenToGround(I.mouse.x, I.mouse.y, G);
        lx = U.clamp((w.x - p.x) * 0.22, -160, 160); ly = U.clamp((w.y - p.y) * 0.22, -120, 120);
      } else if (G.wantFire) { lx = Math.cos(p.aim) * 90; ly = Math.sin(p.aim) * 70; }
      const k = 1 - Math.exp(-7 * dt);
      this.tgt.x += (p.x + lx - this.tgt.x) * k; this.tgt.y += (p.y + ly - this.tgt.y) * k;
      const tx = U.clamp(this.tgt.x, 250, G.world.w - 250), ty = U.clamp(this.tgt.y, 200, G.world.h - 150);
      const pitch = 61 * Math.PI / 180, D = this.dist;
      const sx = G.sx * 1.4, sy = G.sy * 1.4;
      this.camera.position.set(tx + sx, Math.sin(pitch) * D, ty + Math.cos(pitch) * D + sy);
      this.camera.lookAt(tx + sx, 0, ty + sy);
      this.camera.updateMatrixWorld(); this.camReady = true;
      this.sun.position.set(tx - 500, 1300, ty + 650); this.sun.target.position.set(tx, 0, ty);

      // vùng nhìn thấy trên mặt đất (để game biết quái nào trong / ngoài màn hình)
      const c1 = this.screenToGround(0, 0, G), c2 = this.screenToGround(G.W, 0, G), c3 = this.screenToGround(0, G.H, G), c4 = this.screenToGround(G.W, G.H, G);
      G.viewRect = { x0: Math.min(c1.x, c3.x), x1: Math.max(c2.x, c4.x), y0: Math.min(c1.y, c2.y), y1: Math.max(c3.y, c4.y) };

      // vật cản
      this.sync('obs', G.obstacles, buildProp, (o, m) => {
        const u = m.userData;
        if (u.flashMat) {
          if (!u.baseCol) { u.baseCol = u.flashMat.color.clone(); u.baseEm = u.flashMat.emissive.clone(); }
          if (o.flash > 0) u.flashMat.emissive.setHex(0x664422); else u.flashMat.emissive.copy(u.baseEm);
          if (o.maxHp) u.flashMat.color.copy(u.baseCol).multiplyScalar(0.6 + 0.4 * o.hp / o.maxHp);
        }
        if (u.core) { const s = 1 + Math.sin(t * 3 + o.x) * 0.12; u.core.scale.setScalar(s); }
        if (u.canopy) {
          // tán cây phía trước nhân vật thì làm mờ để không che
          const hw = o.hw || o.r, hh = o.hh || o.r;
          const near = Math.abs(o.x - p.x) < hw + 40 && p.y < o.y + hh * 0.3 + 10 && p.y > o.y - hh - (o.tall || 150);
          const op = near ? 0.35 : 1;
          for (const cm of u.canopy) { cm.opacity += (op - cm.opacity) * 0.2; cm.depthWrite = cm.opacity > 0.95; }
        }
      });

      // vùng nguy hiểm (hồ virus, bùn, dung nham, băng, mạng nhện...)
      this.sync('haz', G.hazards, (h) => this.buildHazard(h), (h, m) => {
        const u = m.userData;
        if (h.life != null && u.pool) u.pool.material.opacity = (u.op || 0.8) * Math.min(1, h.life / 1.2);
        if (h.r !== u.r0 && u.pool) { u.pool.scale.set(h.r * 1.2, h.r * 1.2, 1); u.r0 = h.r; }
        if (u.bub) u.bub.forEach((b, i) => {
          const kk = (t * 0.6 + i * 0.37) % 1, a = t * 0.5 + i * 0.9 + h.x * 0.01;
          b.position.set(Math.cos(a) * h.r * 0.5, 2 + kk * 22, Math.sin(a * 1.3) * h.r * 0.4);
          b.scale.setScalar(0.6 + kk * 1.2); b.visible = kk < 0.9;
        });
        if (u.flick) u.pool.material.opacity = (u.op || 0.8) * (0.75 + Math.random() * 0.25) * (h.life != null ? Math.min(1, h.life / 1.2) : 1);
      });
      // vật thể động riêng của Gate (đá lăn, thiên thạch, xe...)
      this.sync('actor', G.actors, (a) => {
        const fn = ACTORS3D[a.kind];
        if (fn) return fn(a, KIT);
        const gg = new T.Group(); gg.add(mesh(sph(a.r || 20, 14), std(a.color3 || 0x888888), 0, 0, 0)); return gg;
      }, (a, m) => { m.position.set(a.x, a.h || 0, a.y); m.rotation.y = -(a.rot || 0); if (m.userData.anim) m.userData.anim(a, m, G); m.visible = a.hidden !== true; });
      for (const c of G.challenges) if (c.__lamp) {
        const on = c.done ? 0x9dff8a : (Math.floor(t * 3) % 2 ? 0x7ef3ff : 0x1d4048);
        c.__lamp.material.emissive.setHex(on); c.__lamp.material.emissiveIntensity = c.active ? 2.4 : 1.4;
      }

      // nhân vật
      this.sync('hero', [p], buildHero, (o, m) => animHero(o, m, G), true);
      this.sync('ghost', p.ghosts, () => { const mm = mesh(cap(9, 12), new T.MeshBasicMaterial({ color: 0x7ef3ff, transparent: true, opacity: 0.4, depthWrite: false }), 0, 18, 0, false); mm.material.userData.own = true; return mm; },
        (gh, m) => { m.position.set(gh.x, 18, gh.y); m.material.opacity = gh.life * 1.6; });

      // quái
      this.sync('enemy', G.enemies, (e) => {
        const md = MODELS[e.type];
        const g = md ? md.build(e) : buildGeneric(e);
        const outer = new T.Group(); outer.add(g);
        const sc = e.r / (md ? md.base : e.def.r); g.scale.setScalar(sc);
        outer.userData = { g, md, mats: ownMats(g), sc, h: (g.userData.h || 30) * sc };
        if (e.elite) {
          const ring = new T.Mesh(G3('ering', () => new T.RingGeometry(0.85, 1, 32)), new T.MeshBasicMaterial({ color: 0xd79bff, transparent: true, opacity: 0.7, depthWrite: false }));
          ring.material.userData.own = true; ring.rotation.x = -Math.PI / 2; ring.position.y = 1.2; ring.scale.setScalar(e.r + 9); outer.add(ring); outer.userData.ring = ring;
        }
        return outer;
      }, (e, m) => {
        const u = m.userData;
        m.position.set(e.x, 0, e.y);
        u.g.rotation.y = -(e.face || 0);
        if (e.spawnT > 0) { const mx = e.boss ? 1.4 : 0.6, kk = 1 - e.spawnT / mx; u.g.position.y = -(1 - kk) * u.h; }
        else u.g.position.y = e.fly && !e.def.noHover ? 26 + Math.sin(G.time * 6 + e.t) * 4 : 0;
        if (u.md) u.md.anim(e, u.g, G);
        m.visible = !e.hidden;
        if (e.alpha != null && e.alpha < 1 !== !!u.faded) { u.faded = e.alpha < 1; for (const mt of u.mats) { mt.transparent = u.faded; mt.opacity = u.faded ? 0.35 : 1; } }
        const fl = e.flash > 0, st = e.stunT > 0;
        for (const mt of u.mats) { mt.emissive.setHex(fl ? 0xffffff : st ? 0x2a7cff : 0x000000); mt.emissiveIntensity = fl ? 0.7 : st ? 0.45 : 1; }
        if (u.ring) u.ring.material.opacity = 0.45 + Math.sin(G.time * 6) * 0.25;
      });

      // lựu đạn đang bay
      this.sync('gren', G.grenades, () => {
        const gg = new T.Group(); gg.add(mesh(sph(5, 12), std(0x3e5a36, { rough: 0.5 }), 0, 0, 0));
        const led = mesh(sph(1.6, 6), std(0x330000, { own: true, emissive: 0xff3b3b, ei: 2 }), 3, 3, 0, false); gg.add(led); gg.userData.led = led; return gg;
      }, (gr, m) => { m.position.set(gr.x, 6 + gr.h, gr.y); m.rotation.z -= 0.3; m.userData.led.visible = Math.floor(t * 12) % 2 === 0; });

      // vật phẩm
      this.sync('pick', G.pickups, buildPickup, (it, m) => {
        if (m.userData.chute) m.userData.chute.visible = it.z > 2;
        m.position.set(it.x, 12 + (it.z > 2 ? 0 : Math.sin(t * 4 + it.x) * 3) + it.z * 0.6, it.y);
        m.userData.inner.rotation.y = t * 1.8;
        m.visible = !(it.life < 4 && Math.floor(t * 8) % 2);
      });

      // đạn người chơi
      this.sync('bul', G.bullets, (b) => {
        let mm;
        const bright = !!G.def.bright, col = colorOf(G.bulletCol(b.color));
        const shell = (geo) => { const sm = new T.MeshBasicMaterial({ color: 0x140a06, transparent: true, opacity: bright ? 0.6 : 0.35, depthWrite: false }); sm.userData.own = true; const o = new T.Mesh(geo, sm); o.renderOrder = -1; return o; };
        if (b.flame) { mm = new T.Mesh(sph(1, 8), new T.MeshBasicMaterial({ color: 0xffa040, transparent: true, opacity: 0.8, blending: bright ? T.NormalBlending : T.AdditiveBlending, depthWrite: false })); }
        else if (b.explode || b.chain) { mm = new T.Mesh(sph(1, 10), new T.MeshBasicMaterial({ color: col })); const sh = shell(sph(1, 10)); sh.scale.setScalar(1.45); mm.add(sh); if (!bright) mm.add(glowSprite(col, 5, 0.8)); }
        else { mm = new T.Mesh(box(22, 3.4, 3.4), new T.MeshBasicMaterial({ color: col })); mm.add(shell(box(26, 6, 6))); const hot = new T.Mesh(box(8, 2, 2), new T.MeshBasicMaterial({ color: 0xfffbe8 })); hot.material.userData.own = true; hot.position.x = 7; mm.add(hot); }
        mm.material.userData.own = true; return mm;
      }, (b, m) => {
        m.position.set(b.x, 30, b.y); m.rotation.y = -Math.atan2(b.vy, b.vx);
        if (b.flame) { m.scale.setScalar(b.r); const k = Math.max(0, b.life / b.max0); m.material.color.setHex(k > 0.5 ? 0xffd27a : 0xff6a20); m.material.opacity = 0.3 + k * 0.6; }
        else if (b.explode || b.chain) m.scale.setScalar(b.r);
      });
      // đạn quái
      const up = new T.Vector3(0, 1, 0), dir = new T.Vector3();
      this.sync('ebul', G.ebullets, (b) => {
        let mm;
        if (b.kind === 'tongue') mm = new T.Mesh(cyl(2.2, 2.2, 1, 6), std(0xd24b5a, { own: true, emissive: 0x5a1010 }));
        else if (b.kind === 'rock') mm = mesh(G3('dodec', () => new T.DodecahedronGeometry(1, 0)), std(0x7b6f62, { flat: true }));
        else if (b.kind === 'car') { mm = new T.Group(); mm.add(mesh(box(2.2, 0.8, 1.1), std(0x6a4a3a, { metal: 0.4, rough: 0.5 }))); mm.add(mesh(box(1, 0.6, 1), std(0x2a3a4a), 0, 0.6, 0)); }
        else if (b.kind === 'web') { mm = new T.Mesh(sph(1, 8), new T.MeshBasicMaterial({ color: 0xf0f0e6, wireframe: true })); mm.material.userData.own = true; }
        else { const c = colorOf(b.color || (b.kind === 'spit' ? '#b6ff6a' : '#ffb36b')); mm = new T.Mesh(sph(1, 10), new T.MeshBasicMaterial({ color: c })); mm.material.userData.own = true; const gl = glowSprite(c, 5, 0.7); mm.add(gl); }
        return mm;
      }, (b, m) => {
        if (b.kind === 'tongue' && b.owner && !b.owner.dead) {
          const ox = b.owner.x, oy = b.owner.y, L = Math.hypot(b.x - ox, b.y - oy) || 1;
          m.position.set((ox + b.x) / 2, 16, (oy + b.y) / 2);
          dir.set((b.x - ox) / L, 0, (b.y - oy) / L); m.quaternion.setFromUnitVectors(up, dir); m.scale.set(1, L, 1);
        } else {
          m.position.set(b.x, b.kind === 'rock' ? b.r : b.kind === 'car' ? 30 + Math.sin(Math.min(1, (1.1 - b.life) / 1.1) * Math.PI) * 140 : 20, b.y);
          m.scale.setScalar(b.r);
          if (b.kind === 'rock' || b.kind === 'web' || b.kind === 'car') { m.rotation.y += 0.1; if (b.kind === 'car') m.rotation.z += 0.12; }
        }
      });

      // hạt hiệu ứng
      const P = this.parts, n = Math.min(G.particles.length, P.instanceMatrix.count);
      for (let i = 0; i < n; i++) {
        const q = G.particles[i];
        if (q._h == null) q._h = q.type === 'shell' ? 26 : 8 + Math.random() * 26;
        const life = Math.max(0, q.life / q.max);
        const s = Math.max(0.5, q.r * (q.type === 'spark' ? 1.4 : 1.8) * (0.4 + life * 0.6));
        this.sv.set(q.type === 'spark' ? s * 2.5 : s, s, s);
        this.q.setFromAxisAngle(up, q.type === 'spark' ? -Math.atan2(q.vy, q.vx) : (q.rot || 0));
        this.v.set(q.x, q.type === 'shell' ? Math.max(1, q._h * life) : q._h + (1 - life) * 6, q.y);
        this.mtx.compose(this.v, this.q, this.sv);
        P.setMatrixAt(i, this.mtx); P.setColorAt(i, colorOf(q.color));
      }
      P.count = n; P.instanceMatrix.needsUpdate = true; if (P.instanceColor) P.instanceColor.needsUpdate = true;

      // vết máu / virus vẽ lên nền
      this.decalT -= dt;
      if (this.decalDirty && this.decalT <= 0) { this.groundTex.needsUpdate = true; this.decalDirty = false; this.decalT = 0.4; }

      this.drawGroundOverlay(G, tx, ty);
      this.renderer.render(this.scene, this.camera);
    },

    // vẽ vạch cảnh báo, vòng xung kích, vùng thử thách lên lớp phủ mặt đất
    drawGroundOverlay(G, cx, cy) {
      const ov = this.ov, ctx = ov.ctx, S = ov.size, px = ov.cv.width;
      const lock = G.lockE && !G.lockE.dead && MB.Input.mode !== 'kb' ? G.lockE : null;
      const tele = lock || G.enemies.some((e) => e.def.tele && e.state === 'aim');
      const zones = G.challenges.some((c) => c.type === 'hold' && U.dist(c.zone.x, c.zone.y, cx, cy) < S);
      if (!G.fx.length && !tele && !zones) { if (ov.dirty) { ctx.clearRect(0, 0, px, px); this.ovTex.needsUpdate = true; ov.dirty = false; } return; }
      ov.dirty = true;
      const ox = Math.round(cx / 40) * 40, oy = Math.round(cy / 40) * 40;
      this.ovMesh.position.set(ox, 1.5, oy);
      const k = px / S;
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, px, px);
      ctx.setTransform(k, 0, 0, k, -(ox - S / 2) * k, -(oy - S / 2) * k);
      const t = G.time;
      for (const c of G.challenges) {
        if (c.type !== 'hold') continue;
        const { x, y, r } = c.zone;
        ctx.save();
        ctx.strokeStyle = c.done ? 'rgba(157,255,138,.5)' : c.active ? 'rgba(126,243,255,.95)' : 'rgba(126,243,255,.55)';
        ctx.lineWidth = 5; ctx.setLineDash([16, 12]); ctx.lineDashOffset = -t * 30;
        U.circle(ctx, x, y, r); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = c.active ? 'rgba(126,243,255,.16)' : 'rgba(126,243,255,.06)'; U.circle(ctx, x, y, r); ctx.fill();
        if (!c.done) { ctx.strokeStyle = '#7ef3ff'; ctx.lineWidth = 9; ctx.beginPath(); ctx.arc(x, y, r - 12, -Math.PI / 2, -Math.PI / 2 + U.TAU * Math.min(1, c.progress / c.time)); ctx.stroke(); }
        ctx.restore();
      }
      for (const f of G.fx) f.draw(ctx, f, G);
      for (const e of G.enemies) if (e.def.tele && !e.dead) e.def.tele(ctx, e, G);
      if (lock) {
        const r = (lock.r || lock.br) + 12;
        ctx.strokeStyle = 'rgba(255,80,80,.95)'; ctx.lineWidth = 4;
        ctx.beginPath(); for (let i = 0; i < 4; i++) { const a = t * 2 + i * Math.PI / 2; ctx.moveTo(lock.x + Math.cos(a) * r, lock.y + Math.sin(a) * r); ctx.arc(lock.x, lock.y, r, a, a + 0.8); } ctx.stroke();
      }
      this.ovTex.needsUpdate = true;
    },

    /* ---------- lớp 2D trên cùng: chữ, thanh máu, mũi tên, minimap ---------- */
    drawOverlay(G) {
      const ctx = G.ctx;
      ctx.setTransform(G.dpr, 0, 0, G.dpr, 0, 0);
      ctx.clearRect(0, 0, G.W, G.H);
      // thanh máu quái
      for (const e of G.enemies) {
        if (e.dead || e.boss || e.hp >= e.maxHp || !G.inView(e.x, e.y, 0)) continue;
        const u = e.__m3 && e.__m3.userData, h = u ? u.h + 14 + (e.fly ? 26 : 0) : 40;
        const s = this.project(e.x, h, e.y, G);
        G.drawHpBar(ctx, s.x, s.y, Math.max(22, e.r * 1.6), e.hp / e.maxHp, e.elite ? '#d79bff' : '#ff6d68');
      }
      for (const o of G.obstacles) {
        if (o.dead || !o.target || o.hp >= o.maxHp || !G.inView(o.x, o.y, 0)) continue;
        const s = this.project(o.x, 50, o.y, G);
        G.drawHpBar(ctx, s.x, s.y, 46, o.hp / o.maxHp, '#c7ff8a');
      }
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (const tx of G.texts) {
        const s = this.project(tx.x, 46, tx.y, G);
        ctx.globalAlpha = Math.min(1, tx.life * 2);
        ctx.font = `800 ${Math.round(tx.size * 1.1)}px system-ui,sans-serif`;
        ctx.fillStyle = 'rgba(0,0,0,.65)'; ctx.fillText(tx.txt, s.x + 1, s.y + 1);
        ctx.fillStyle = tx.color; ctx.fillText(tx.txt, s.x, s.y);
      }
      ctx.globalAlpha = 1;
      // mũi tên chỉ hướng mục tiêu ngoài màn hình
      const p = G.player, marks = MB.Challenges.markers(G);
      if (G.boss && !G.boss.dead) marks.push({ x: G.boss.x, y: G.boss.y, color: '#ff5b6e' });
      marks.sort((a, b) => U.dist(a.x, a.y, p.x, p.y) - U.dist(b.x, b.y, p.x, p.y));
      const ps = this.project(p.x, 20, p.y, G);
      let n = 0;
      for (const m of marks) {
        if (n >= 4) break;
        const s = this.project(m.x, 20, m.y, G);
        if (s.x > 20 && s.x < G.W - 20 && s.y > 20 && s.y < G.H - 20) continue;
        n++;
        const a = Math.atan2(s.y - ps.y, s.x - ps.x);
        const ex = U.clamp(s.x, 34, G.W - 34), ey = U.clamp(s.y, 94, G.H - 74);
        ctx.save(); ctx.translate(ex, ey); ctx.rotate(a); ctx.fillStyle = m.color; ctx.globalAlpha = 0.85;
        ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(-6, -8); ctx.lineTo(-2, 0); ctx.lineTo(-6, 8); ctx.closePath(); ctx.fill(); ctx.restore();
      }
      if (G.def.drawScreen) G.def.drawScreen(G, ctx);
      G.drawMinimap(ctx);
      if (MB.Input.mode !== 'kb') G.drawTapMark(ctx);
      if (MB.Input.mode === 'kb' && !G.paused) G.drawCrosshair(ctx);
      else if (!p.dead) {
        // laser ngắm cho cảm ứng / tay cầm
        const L = 260, a = this.project(p.x + Math.cos(p.aim) * 30, 30, p.y + Math.sin(p.aim) * 30, G), b = this.project(p.x + Math.cos(p.aim) * L, 30, p.y + Math.sin(p.aim) * L, G);
        ctx.save(); ctx.strokeStyle = 'rgba(126,243,255,.4)'; ctx.lineWidth = 1.6; ctx.setLineDash([6, 8]);
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); ctx.restore();
      }
      G.drawVignette(ctx);
    },
  };
})(window.MB);
