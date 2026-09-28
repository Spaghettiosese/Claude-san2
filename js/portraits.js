'use strict';
// ---------------------------------------------------------------------------
// Painted high-resolution character portraits, generated with vector paths,
// gradients and soft shading. Every portrait is a 400x500 "card" in an
// art-deco frame, cached per character + expression.
// ---------------------------------------------------------------------------
const Portraits = {
  cache: new Map(),
  W: 400, H: 500,

  defs: {
    lan: { name: 'Su Lan', skin: '#f3cfae', hair: '#1b1519', hairHi: '#4a3a4c', iris: '#4a2c1c', style: 'bob', female: true, clothes: 'jacket', c1: '#3d6a9a', c2: '#294a70', bg: ['#2a3c56', '#0e141e'], faceW: 64, chinY: 312, lips: '#c8706a', blush: 0.35 },
    lan_qipao: { base: 'lan', clothes: 'qipao', c1: '#9a1e2e', c2: '#6a1020', trim: '#e0b050', bg: ['#4a1620', '#12060a'], lips: '#b83040' },
    lan_winter: { base: 'lan', clothes: 'winter', c1: '#5a4a3a', c2: '#3a2e24', scarf: '#b03030', bg: ['#34404c', '#0c1016'] },
    lan_servant: { base: 'lan', clothes: 'servant', c1: '#e0d8c8', c2: '#b8ae9c', bg: ['#3a3226', '#100c08'] },
    ming: { name: 'Su Ming', skin: '#ebc39c', hair: '#171214', hairHi: '#3e3440', iris: '#3a2418', style: 'short', clothes: 'student', c1: '#2e3440', c2: '#1c2028', scarf: '#ece8e0', glasses: 'round', bg: ['#3a3226', '#0e0c0a'], faceW: 66, chinY: 318 },
    ming_prison: { base: 'ming', style: 'messy', clothes: 'prison', c1: '#6a6458', c2: '#4a463e', bruise: true, bg: ['#2a2220', '#080606'] },
    lu: { name: 'Lu Zhiyuan', skin: '#e8c09a', hair: '#141010', hairHi: '#3a3434', iris: '#2a1a14', style: 'slick', clothes: 'trench', c1: '#6a6254', c2: '#4a443a', tie: '#5a1a1a', hat: 'fedora', hatC: '#2a2a2e', bg: ['#1e3438', '#070c0e'], faceW: 68, chinY: 322, jaw: 1.1, brow: 1.2 },
    han: { name: 'Han Tie', skin: '#d6a87c', hair: '#141010', hairHi: '#34302e', iris: '#2a1a12', style: 'short', clothes: 'eighth', c1: '#5f6e78', c2: '#46525a', hat: 'cap8', hatC: '#5a6872', scar: true, bg: ['#3a4030', '#0e100a'], faceW: 70, chinY: 322, jaw: 1.15, brow: 1.3 },
    fang: { name: 'Fang Yu', skin: '#f2cda8', hair: '#221a18', hairHi: '#5a4440', iris: '#3a2418', style: 'wave', female: true, clothes: 'blouse', c1: '#7a2a3a', c2: '#e8e0d4', hat: 'beret', hatC: '#2a1e24', lips: '#a8303c', bg: ['#4a2a30', '#10080a'], faceW: 63, chinY: 310, blush: 0.25 },
    qin: { name: 'Auntie Qin', skin: '#dcb090', hair: '#8e8984', hairHi: '#c8c4c0', iris: '#3a2418', style: 'bun', female: true, clothes: 'jacket', c1: '#3a3028', c2: '#241c16', bg: ['#4a3624', '#120c08'], faceW: 68, chinY: 316, age: 0.8, lips: '#a86a60', blush: 0.15 },
    mori: { name: 'Mori Takeshi', skin: '#e6c09c', hair: '#141010', hairHi: '#34302e', iris: '#2a1a12', style: 'buzz', clothes: 'jpuniform', c1: '#8a7a48', c2: '#6a5c34', hat: 'jpcap', hatC: '#8e7e4c', bg: ['#4a4430', '#0e0c08'], faceW: 64, chinY: 318, thin: true },
    chiang: { name: 'Chiang Kai-shek', skin: '#e6bf98', hair: '#e6bf98', hairHi: '#fff', iris: '#2a1a12', style: 'bald', clothes: 'kmtgeneral', c1: '#6a6a48', c2: '#4a4a30', mustache: 'chiang', bg: ['#1a2a5a', '#060a18'], faceW: 64, chinY: 330, age: 0.55, jaw: 0.95, brow: 0.9, cheekHollow: true, historical: true },
    mao: { name: 'Mao Zedong', skin: '#e2b890', hair: '#141010', hairHi: '#34302e', iris: '#2a1a12', style: 'long', clothes: 'ccp', c1: '#747a7c', c2: '#585e60', mole: true, bg: ['#5a2a1e', '#140806'], faceW: 72, chinY: 326, age: 0.3, jaw: 1.05, historical: true },
    zhou: { name: 'Zhou Enlai', skin: '#e6bf98', hair: '#141010', hairHi: '#3a3434', iris: '#2a1a12', style: 'swept', clothes: 'ccp', c1: '#4a525a', c2: '#343a40', bg: ['#3a2a2a', '#0e0808'], faceW: 67, chinY: 320, brow: 1.6, age: 0.25, historical: true },
    wang: { name: 'Wang Jingwei', skin: '#eec9a6', hair: '#141010', hairHi: '#4a4448', iris: '#2a1a12', style: 'slick', clothes: 'suit', c1: '#262a30', c2: '#16181c', tie: '#6a5a2a', bg: ['#3a3418', '#0c0a04'], faceW: 66, chinY: 320, age: 0.4, historical: true },
    dai: { name: 'Dai Li', skin: '#dcb48c', hair: '#141010', hairHi: '#2a2828', iris: '#1a1010', style: 'buzz', clothes: 'kmtgeneral', c1: '#3a3e36', c2: '#262a22', bg: ['#1a1e24', '#050608'], faceW: 72, chinY: 322, jaw: 1.2, brow: 1.2, age: 0.3, historical: true },
    kageyama: { name: 'Major Kageyama', skin: '#e6c09a', hair: '#141010', hairHi: '#3a3434', iris: '#1a1010', style: 'buzz', clothes: 'jpofficer', c1: '#6a5e3a', c2: '#4a4228', hat: 'peaked', hatC: '#5e5434', mustache: 'thin', bg: ['#4a1414', '#100404'], faceW: 64, chinY: 324, jaw: 1.05, brow: 1.1, narrow: true, age: 0.35 },
    bai: { name: 'Madame Bai', skin: '#f5d4b6', hair: '#141010', hairHi: '#4a3a44', iris: '#2a1a14', style: 'wave', female: true, clothes: 'qipao', c1: '#5a2a6a', c2: '#3a1648', trim: '#d8c070', pearls: true, lips: '#a01a30', bg: ['#3a1a40', '#0c040e'], faceW: 62, chinY: 312, blush: 0.2, lashes: true, age: 0.2 },
    xu: { name: 'Old Xu', skin: '#d8b08c', hair: '#3a3430', hairHi: '#6a6460', iris: '#2a1a12', style: 'receding', clothes: 'changshan', c1: '#4a5244', c2: '#343a30', bg: ['#2e3428', '#0a0c08'], faceW: 70, chinY: 324, age: 0.65, narrow: true },
    jp_soldier: { name: 'Soldier', skin: '#e0b890', hair: '#141010', hairHi: '#2a2828', iris: '#1a1010', style: 'buzz', clothes: 'jpuniform', c1: '#8a7a48', c2: '#6a5c34', hat: 'jpcap', hatC: '#8e7e4c', bg: ['#3a3424', '#0a0a06'], faceW: 68, chinY: 320, jaw: 1.1 },
    kmt: { name: 'Guard', skin: '#dcb48c', hair: '#141010', hairHi: '#2a2828', iris: '#1a1010', style: 'buzz', clothes: 'kmtsoldier', c1: '#4f5d63', c2: '#3a464c', hat: 'helmet', hatC: '#4a5450', bg: ['#243038', '#080c0e'], faceW: 68, chinY: 320, jaw: 1.1 },
    agent: { name: 'Agent', skin: '#dcb48c', hair: '#141010', hairHi: '#2a2828', iris: '#1a1010', style: 'slick', clothes: 'trench', c1: '#2a2a2e', c2: '#1a1a1c', tie: '#101010', hat: 'fedora', hatC: '#1a1a1c', bg: ['#202024', '#060608'], faceW: 68, chinY: 320, narrow: true },
    ccp_guard: { name: 'Sentry', skin: '#d6a87c', hair: '#141010', hairHi: '#34302e', iris: '#2a1a12', style: 'buzz', clothes: 'eighth', c1: '#5f6e78', c2: '#46525a', hat: 'cap8', hatC: '#5a6872', bg: ['#3a4030', '#0e100a'], faceW: 69, chinY: 320, jaw: 1.1 },
    civ: { name: 'Stranger', skin: '#dcb48c', hair: '#141010', hairHi: '#2a2828', iris: '#2a1a12', style: 'short', clothes: 'changshan', c1: '#4a4038', c2: '#342c26', bg: ['#3a3026', '#0c0a08'], faceW: 68, chinY: 318, age: 0.3 },
    civ_f: { name: 'Stranger', skin: '#f0c8a0', hair: '#161214', hairHi: '#3a3036', iris: '#2a1a12', style: 'bun', female: true, clothes: 'jacket', c1: '#6a7a8a', c2: '#4a5866', bg: ['#34404a', '#0a0e12'], faceW: 64, chinY: 312, lips: '#b8706a' },
    prisoner: { name: 'Prisoner', skin: '#d0a888', hair: '#221c18', hairHi: '#3a3430', iris: '#2a1a12', style: 'messy', clothes: 'prison', c1: '#6a6458', c2: '#4a463e', bruise: true, bg: ['#2a2220', '#080606'], faceW: 70, chinY: 322, age: 0.4 },
  },

  resolve(id) {
    let d = this.defs[id] || this.defs.civ;
    if (d.base) d = Object.assign({}, this.defs[d.base], d, { base: undefined });
    return d;
  },

  get(id, expr = 'neutral') {
    const key = id + '|' + expr;
    let c = this.cache.get(key);
    if (!c) {
      c = U.canvas(this.W, this.H);
      try { this.paint(c.getContext('2d'), this.resolve(id), expr); } catch (e) { console.error('portrait', id, e); }
      this.cache.set(key, c);
    }
    return c;
  },

  draw(ctx, id, expr, x, y, w, h, flip = false, alpha = 1) {
    const c = this.get(id, expr);
    ctx.save();
    ctx.globalAlpha = alpha;
    if (flip) { ctx.translate(x + w, y); ctx.scale(-1, 1); ctx.drawImage(c, 0, 0, w, h); }
    else ctx.drawImage(c, x, y, w, h);
    ctx.restore();
  },

  // --------------------------------------------------------------------
  paint(g, d, expr) {
    const W = this.W, H = this.H;
    const cx = 200;
    const E = this.expr(expr);
    const skin = d.skin, sd = U.shade(skin, -0.18), sd2 = U.shade(skin, -0.32), hl = U.shade(skin, 0.14);
    const fw = d.faceW || 66, chin = d.chinY || 318, jaw = d.jaw || 1;
    const eyeY = 222, eyeDX = fw * 0.56;

    // --- background / frame -------------------------------------------
    const bg = g.createRadialGradient(cx, 190, 20, cx, 260, 380);
    bg.addColorStop(0, d.bg[0]); bg.addColorStop(1, d.bg[1]);
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    // soft light rays / pattern
    g.save(); g.globalAlpha = 0.07; g.strokeStyle = '#fff'; g.lineWidth = 2;
    for (let i = -8; i < 20; i++) { g.beginPath(); g.moveTo(i * 30, 0); g.lineTo(i * 30 + 200, H); g.stroke(); }
    g.restore();
    // rim-light glow behind head
    const glow = g.createRadialGradient(cx - 40, 170, 10, cx - 40, 170, 230);
    glow.addColorStop(0, 'rgba(255,230,190,0.22)'); glow.addColorStop(1, 'rgba(255,230,190,0)');
    g.fillStyle = glow; g.fillRect(0, 0, W, H);

    // --- back hair ------------------------------------------------------
    this.hairBack(g, d, cx, fw, chin);

    // --- neck ------------------------------------------------------------
    const neckW = d.female ? 30 : (d.thin ? 34 : 40);
    const ng = g.createLinearGradient(cx - neckW, 0, cx + neckW, 0);
    ng.addColorStop(0, sd); ng.addColorStop(0.45, skin); ng.addColorStop(1, sd2);
    g.fillStyle = ng;
    g.beginPath();
    g.moveTo(cx - neckW, chin - 40); g.lineTo(cx - neckW - 4, 400); g.lineTo(cx + neckW + 4, 400); g.lineTo(cx + neckW, chin - 40); g.fill();
    // jaw shadow on neck
    const js = g.createLinearGradient(0, chin - 20, 0, chin + 30);
    js.addColorStop(0, 'rgba(60,20,20,0.45)'); js.addColorStop(1, 'rgba(60,20,20,0)');
    g.fillStyle = js; g.fillRect(cx - neckW - 5, chin - 20, neckW * 2 + 10, 50);

    // --- clothes ----------------------------------------------------------
    this.clothes(g, d, cx, chin);

    // --- ears -------------------------------------------------------------
    for (const s of [-1, 1]) {
      g.fillStyle = s < 0 ? skin : sd;
      g.beginPath();
      g.ellipse(cx + s * (fw + 4), eyeY + 18, 11, 22, s * 0.15, 0, Math.PI * 2); g.fill();
      g.fillStyle = sd2; g.beginPath(); g.ellipse(cx + s * (fw + 5), eyeY + 18, 5, 12, s * 0.15, 0, Math.PI * 2); g.fill();
    }

    // --- face shape -------------------------------------------------------
    const face = new Path2D();
    const top = 118;
    face.moveTo(cx - fw, eyeY - 30);
    face.bezierCurveTo(cx - fw, top + 10, cx - fw * 0.55, top - 8, cx, top - 8);
    face.bezierCurveTo(cx + fw * 0.55, top - 8, cx + fw, top + 10, cx + fw, eyeY - 30);
    face.bezierCurveTo(cx + fw + 2, eyeY + 30, cx + fw * 0.85 * jaw, chin - 45, cx + fw * 0.45 * jaw, chin - 12);
    face.quadraticCurveTo(cx, chin + 6, cx - fw * 0.45 * jaw, chin - 12);
    face.bezierCurveTo(cx - fw * 0.85 * jaw, chin - 45, cx - fw - 2, eyeY + 30, cx - fw, eyeY - 30);
    face.closePath();
    const fg = g.createLinearGradient(cx - fw, top, cx + fw, chin);
    fg.addColorStop(0, hl); fg.addColorStop(0.45, skin); fg.addColorStop(0.85, sd); fg.addColorStop(1, sd2);
    g.fillStyle = fg; g.fill(face);
    g.save(); g.clip(face);
    // side shadow (light from upper left)
    const ss = g.createLinearGradient(cx + fw * 0.3, 0, cx + fw, 0);
    ss.addColorStop(0, 'rgba(90,40,30,0)'); ss.addColorStop(1, 'rgba(90,40,30,0.35)');
    g.fillStyle = ss; g.fillRect(cx, top - 20, fw + 10, chin);
    // cheek blush
    const bl = d.blush !== undefined ? d.blush : 0.12;
    for (const s of [-1, 1]) {
      const b = g.createRadialGradient(cx + s * fw * 0.52, eyeY + 42, 2, cx + s * fw * 0.52, eyeY + 42, 34);
      b.addColorStop(0, `rgba(230,110,110,${bl + (E.blush || 0)})`); b.addColorStop(1, 'rgba(230,110,110,0)');
      g.fillStyle = b; g.fillRect(cx - fw, eyeY, fw * 2, 90);
    }
    if (d.cheekHollow) {
      for (const s of [-1, 1]) {
        const b = g.createRadialGradient(cx + s * fw * 0.62, eyeY + 60, 2, cx + s * fw * 0.62, eyeY + 60, 30);
        b.addColorStop(0, 'rgba(110,60,40,0.28)'); b.addColorStop(1, 'rgba(110,60,40,0)');
        g.fillStyle = b; g.fillRect(cx - fw, eyeY + 20, fw * 2, 90);
      }
    }
    if (d.bruise) {
      const b = g.createRadialGradient(cx + fw * 0.45, eyeY + 30, 2, cx + fw * 0.45, eyeY + 30, 26);
      b.addColorStop(0, 'rgba(90,50,110,0.45)'); b.addColorStop(1, 'rgba(90,50,110,0)');
      g.fillStyle = b; g.fillRect(cx, eyeY, fw, 80);
      g.strokeStyle = 'rgba(140,30,30,0.7)'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(cx - 30, chin - 70); g.lineTo(cx - 22, chin - 60); g.stroke();
    }
    // chin highlight
    const ch = g.createRadialGradient(cx - 6, chin - 18, 1, cx - 6, chin - 18, 20);
    ch.addColorStop(0, 'rgba(255,240,220,0.35)'); ch.addColorStop(1, 'rgba(255,240,220,0)');
    g.fillStyle = ch; g.fillRect(cx - 30, chin - 40, 60, 40);
    // forehead highlight
    const fh = g.createRadialGradient(cx - 18, top + 40, 1, cx - 18, top + 40, 45);
    fh.addColorStop(0, 'rgba(255,245,230,0.3)'); fh.addColorStop(1, 'rgba(255,245,230,0)');
    g.fillStyle = fh; g.fillRect(cx - fw, top - 10, fw * 2, 100);
    // age lines
    if (d.age) {
      g.strokeStyle = `rgba(110,60,45,${0.25 * d.age + 0.1})`; g.lineWidth = 1.6;
      for (const s of [-1, 1]) {
        g.beginPath(); g.moveTo(cx + s * 22, eyeY + 44); g.quadraticCurveTo(cx + s * 34, eyeY + 70, cx + s * 30, eyeY + 86); g.stroke(); // nasolabial
        if (d.age > 0.45) { g.beginPath(); g.moveTo(cx + s * (eyeDX + 20), eyeY - 2); g.lineTo(cx + s * (eyeDX + 30), eyeY + 4); g.stroke(); }
      }
      if (d.age > 0.5) {
        for (let i = 0; i < 2; i++) { g.beginPath(); g.moveTo(cx - 30, top + 38 + i * 11); g.quadraticCurveTo(cx, top + 32 + i * 11, cx + 30, top + 38 + i * 11); g.stroke(); }
      }
    }
    if (d.scar) {
      g.strokeStyle = 'rgba(150,70,60,0.8)'; g.lineWidth = 3;
      g.beginPath(); g.moveTo(cx + fw * 0.35, eyeY + 18); g.lineTo(cx + fw * 0.7, eyeY + 52); g.stroke();
      g.strokeStyle = 'rgba(240,190,170,0.5)'; g.lineWidth = 1;
      g.beginPath(); g.moveTo(cx + fw * 0.35 - 2, eyeY + 18); g.lineTo(cx + fw * 0.7 - 2, eyeY + 52); g.stroke();
    }
    g.restore();
    // jaw outline (subtle)
    g.strokeStyle = U.shade(skin, -0.45, 0.5); g.lineWidth = 2; g.stroke(face);

    // --- nose -------------------------------------------------------------
    const noseY = eyeY + 48;
    g.strokeStyle = U.shade(skin, -0.4, 0.8); g.lineWidth = 2.2; g.lineCap = 'round';
    g.beginPath(); g.moveTo(cx + 4, eyeY + 12); g.quadraticCurveTo(cx + 10, noseY - 6, cx + 6, noseY); g.stroke();
    g.fillStyle = U.shade(skin, -0.35, 0.6);
    g.beginPath(); g.ellipse(cx - 7, noseY + 1, 4.5, 2.5, 0.2, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.ellipse(cx + 8, noseY + 1, 4.5, 2.5, -0.2, 0, Math.PI * 2); g.fill();
    const nh = g.createRadialGradient(cx - 2, noseY - 8, 1, cx - 2, noseY - 8, 8);
    nh.addColorStop(0, 'rgba(255,245,235,0.55)'); nh.addColorStop(1, 'rgba(255,245,235,0)');
    g.fillStyle = nh; g.fillRect(cx - 12, noseY - 18, 22, 20);

    // --- eyes -------------------------------------------------------------
    for (const s of [-1, 1]) this.eye(g, d, E, cx + s * eyeDX, eyeY, s);
    // --- brows ------------------------------------------------------------
    for (const s of [-1, 1]) this.brow(g, d, E, cx + s * eyeDX, eyeY - 30, s);

    // --- mouth -------------------------------------------------------------
    this.mouth(g, d, E, cx, chin - 36);
    if (d.mustache) this.mustache(g, d, cx, chin - 44);
    if (d.mole) { g.fillStyle = '#4a2a1a'; g.beginPath(); g.arc(cx + 4, chin - 14, 3.5, 0, Math.PI * 2); g.fill(); }
    if (E.tears) {
      g.fillStyle = 'rgba(200,230,255,0.75)';
      for (const s of [-1, 1]) { g.beginPath(); g.ellipse(cx + s * eyeDX + s * 6, eyeY + 26, 3, 6, 0, 0, Math.PI * 2); g.fill(); g.fillRect(cx + s * eyeDX + s * 6 - 1.5, eyeY + 12, 3, 14); }
    }
    if (E.sweat) {
      g.fillStyle = 'rgba(210,235,255,0.8)';
      g.beginPath(); g.ellipse(cx + fw - 8, eyeY - 30, 4, 7, 0, 0, Math.PI * 2); g.fill();
    }

    // --- front hair / hat --------------------------------------------------
    this.hairFront(g, d, cx, fw, eyeY, top);
    if (d.glasses) this.glasses(g, cx, eyeY, eyeDX);
    if (d.hat) this.hat(g, d, cx, fw, top);
    if (d.pearls) {
      for (let i = -6; i <= 6; i++) {
        const a = i / 6;
        const px = cx + a * 46, py = 408 + (1 - a * a) * 22;
        const pg = g.createRadialGradient(px - 2, py - 2, 0.5, px, py, 6);
        pg.addColorStop(0, '#fff'); pg.addColorStop(1, '#b8b0a8');
        g.fillStyle = pg; g.beginPath(); g.arc(px, py, 5.5, 0, Math.PI * 2); g.fill();
      }
      for (const s of [-1, 1]) { g.fillStyle = '#f0ece6'; g.beginPath(); g.arc(cx + s * (fw + 5), eyeY + 44, 5, 0, Math.PI * 2); g.fill(); }
    }

    // --- frame / finishing ------------------------------------------------
    const vg = g.createRadialGradient(cx, 250, 150, cx, 250, 360);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.55)');
    g.fillStyle = vg; g.fillRect(0, 0, W, H);
    // subtle film grain
    const r = U.srand(d.name.length * 97 + 3);
    g.fillStyle = 'rgba(255,255,255,0.035)';
    for (let i = 0; i < 1400; i++) g.fillRect(r() * W, r() * H, 1.5, 1.5);
    g.fillStyle = 'rgba(0,0,0,0.05)';
    for (let i = 0; i < 1400; i++) g.fillRect(r() * W, r() * H, 1.5, 1.5);
    // art deco frame
    const gold = d.historical ? '#d8b860' : '#b89a58';
    g.strokeStyle = gold; g.lineWidth = 6; g.strokeRect(3, 3, W - 6, H - 6);
    g.strokeStyle = U.alpha(gold, 0.55); g.lineWidth = 1.5; g.strokeRect(13, 13, W - 26, H - 26);
    g.fillStyle = gold;
    for (const [x, y] of [[13, 13], [W - 13, 13], [13, H - 13], [W - 13, H - 13]]) {
      g.save(); g.translate(x, y); g.rotate(Math.PI / 4); g.fillRect(-6, -6, 12, 12); g.restore();
    }
    if (d.historical) {
      g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillRect(13, H - 44, W - 26, 30);
      g.fillStyle = gold; g.font = 'italic 17px Georgia, serif'; g.textAlign = 'center';
      g.fillText('— historical figure —', cx, H - 23);
    }
  },

  expr(e) {
    const X = {
      neutral: { lid: 0, brow: 0, browY: 0, mouth: 'flat' },
      happy: { lid: 0.2, brow: -0.1, browY: -3, mouth: 'smile', blush: 0.08, smileEyes: true },
      laugh: { lid: 0.5, brow: -0.1, browY: -5, mouth: 'open_smile', blush: 0.1, smileEyes: true },
      sad: { lid: 0.3, brow: 0.55, browY: -2, mouth: 'frown', look: 0.4 },
      cry: { lid: 0.35, brow: 0.7, browY: -4, mouth: 'open_sad', tears: true, blush: 0.12 },
      angry: { lid: 0.15, brow: -0.6, browY: 5, mouth: 'grit' },
      surprised: { lid: -0.3, brow: 0.2, browY: -9, mouth: 'o' },
      worried: { lid: 0.1, brow: 0.45, browY: -4, mouth: 'wavy', sweat: true },
      smirk: { lid: 0.25, brow: -0.15, browY: 0, mouth: 'smirk', browL: 5 },
      determined: { lid: 0.2, brow: -0.3, browY: 2, mouth: 'set' },
      stern: { lid: 0.2, brow: -0.35, browY: 3, mouth: 'down' },
      tender: { lid: 0.3, brow: 0.2, browY: -2, mouth: 'smile', blush: 0.18, look: -0.3 },
      shy: { lid: 0.4, brow: 0.3, browY: -2, mouth: 'smile_small', blush: 0.3, look: 0.6 },
      pain: { lid: 0.65, brow: 0.6, browY: 2, mouth: 'grit', sweat: true },
      closed: { lid: 1, brow: 0.1, browY: 0, mouth: 'flat' },
    };
    return X[e] || X.neutral;
  },

  eye(g, d, E, x, y, s) {
    const f = d.female ? 1.12 : 1;
    const w = 25 * f, open = (d.narrow ? 8.5 : 11.5) * f * (1 - U.clamp(E.lid, -0.4, 1));
    const shape = new Path2D();
    const outer = x + s * w, inner = x - s * w * 0.9;
    shape.moveTo(inner, y + 2);
    shape.bezierCurveTo(inner + s * 10, y - open - 2, outer - s * 14, y - open - 2, outer, y - 1);
    if (E.smileEyes) {
      shape.bezierCurveTo(outer - s * 12, y - open * 0.2, inner + s * 10, y - open * 0.2, inner, y + 2);
    } else {
      shape.bezierCurveTo(outer - s * 10, y + 9 * f, inner + s * 10, y + 9 * f, inner, y + 2);
    }
    // whites
    g.fillStyle = '#f4efe8'; g.fill(shape);
    g.save(); g.clip(shape);
    const look = (E.look || 0) * 6;
    const ir = 11.5 * f;
    const ig = g.createRadialGradient(x + look, y - 3, 1, x + look, y + 1, ir);
    ig.addColorStop(0, U.shade(d.iris, 0.35)); ig.addColorStop(0.6, d.iris); ig.addColorStop(1, U.shade(d.iris, -0.5));
    g.fillStyle = ig; g.beginPath(); g.arc(x + look, y + 1, ir, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#0a0606'; g.beginPath(); g.arc(x + look, y + 1, ir * 0.45, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.95)'; g.beginPath(); g.arc(x + look - 4, y - 4, 3.3 * f, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.5)'; g.beginPath(); g.arc(x + look + 4, y + 5, 1.6, 0, Math.PI * 2); g.fill();
    // upper lid shadow
    g.fillStyle = 'rgba(80,40,30,0.25)'; g.fillRect(x - w - 2, y - open - 6, w * 2 + 4, 7);
    g.restore();
    // lash line
    g.strokeStyle = '#1a0e0c'; g.lineCap = 'round';
    g.lineWidth = d.female ? 4.2 : 3.2;
    g.beginPath();
    g.moveTo(inner, y + 2);
    g.bezierCurveTo(inner + s * 10, y - open - 2, outer - s * 14, y - open - 2, outer, y - 1);
    g.stroke();
    if (d.female || d.lashes) {
      g.lineWidth = 2.4;
      g.beginPath(); g.moveTo(outer, y - 1); g.lineTo(outer + s * 7, y - 6); g.stroke();
      g.beginPath(); g.moveTo(outer - s * 4, y - open * 0.6); g.lineTo(outer + s * 3, y - open - 3); g.stroke();
    }
    // lower lid hint
    if (!E.smileEyes) {
      g.strokeStyle = 'rgba(90,50,40,0.45)'; g.lineWidth = 1.4;
      g.beginPath(); g.moveTo(outer - s * 2, y + 1); g.bezierCurveTo(outer - s * 10, y + 9 * f, inner + s * 10, y + 9 * f, inner + s * 2, y + 3); g.stroke();
    }
    // crease
    g.strokeStyle = 'rgba(100,55,40,0.45)'; g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(inner + s * 6, y - open - 4); g.quadraticCurveTo(x, y - open - 10, outer - s * 2, y - open - 2); g.stroke();
    if (E.lid >= 1) { // closed
      g.strokeStyle = '#1a0e0c'; g.lineWidth = 3; g.beginPath(); g.moveTo(inner, y + 2); g.quadraticCurveTo(x, y + 8, outer, y); g.stroke();
    }
  },

  brow(g, d, E, x, y, s) {
    const th = 5.5 * (d.brow || 1) * (d.female ? 0.75 : 1);
    const inY = y + E.browY - E.brow * 9 + (E.browL && s < 0 ? -E.browL : 0);
    const outY = y + E.browY + E.brow * 6 - 2 + (E.browL && s < 0 ? -E.browL : 0);
    const inner = x - s * 20, outer = x + s * 26;
    g.strokeStyle = U.shade(d.hair === d.skin ? '#3a2a20' : d.hair, 0.05); g.lineCap = 'round';
    if (d.style === 'bald' || d.hair === d.skin) g.strokeStyle = '#4a3a30';
    g.lineWidth = th;
    g.beginPath(); g.moveTo(inner, inY); g.quadraticCurveTo(x, Math.min(inY, outY) - 7, outer, outY + 3); g.stroke();
    g.lineWidth = th * 0.4; g.strokeStyle = 'rgba(0,0,0,0.3)';
    g.beginPath(); g.moveTo(inner, inY + 2); g.quadraticCurveTo(x, Math.min(inY, outY) - 5, outer, outY + 4); g.stroke();
  },

  mouth(g, d, E, x, y) {
    const lip = d.lips || U.shade(d.skin, -0.3);
    const line = U.shade(d.skin, -0.55);
    g.lineCap = 'round';
    const w = d.female ? 18 : 22;
    switch (E.mouth) {
      case 'smile': case 'smile_small': {
        const k = E.mouth === 'smile' ? 1 : 0.6;
        if (d.lips) { g.fillStyle = lip; g.beginPath(); g.moveTo(x - w * k, y - 1); g.quadraticCurveTo(x, y + 12 * k, x + w * k, y - 1); g.quadraticCurveTo(x, y + 4, x - w * k, y - 1); g.fill(); }
        g.strokeStyle = line; g.lineWidth = 2.6;
        g.beginPath(); g.moveTo(x - w * k, y - 2); g.quadraticCurveTo(x, y + 8 * k, x + w * k, y - 2); g.stroke();
        break;
      }
      case 'open_smile':
        g.fillStyle = '#5a1a1a'; g.beginPath(); g.moveTo(x - w, y - 3); g.quadraticCurveTo(x, y + 22, x + w, y - 3); g.closePath(); g.fill();
        g.fillStyle = '#f4f0ea'; g.fillRect(x - w + 5, y - 3, w * 2 - 10, 5);
        g.strokeStyle = line; g.lineWidth = 2; g.beginPath(); g.moveTo(x - w, y - 3); g.lineTo(x + w, y - 3); g.stroke();
        break;
      case 'frown':
        g.strokeStyle = line; g.lineWidth = 2.6;
        g.beginPath(); g.moveTo(x - w * 0.85, y + 4); g.quadraticCurveTo(x, y - 5, x + w * 0.85, y + 4); g.stroke();
        if (d.lips) { g.fillStyle = U.alpha(lip.startsWith('#') ? lip : '#b86060', 0.6); g.beginPath(); g.ellipse(x, y + 5, w * 0.5, 3.5, 0, 0, Math.PI * 2); g.fill(); }
        break;
      case 'open_sad':
        g.fillStyle = '#4a1414'; g.beginPath(); g.ellipse(x, y + 3, w * 0.55, 7, 0, 0, Math.PI * 2); g.fill();
        g.strokeStyle = line; g.lineWidth = 2; g.beginPath(); g.moveTo(x - w * 0.7, y + 2); g.quadraticCurveTo(x, y - 7, x + w * 0.7, y + 2); g.stroke();
        break;
      case 'grit':
        g.fillStyle = '#f0ece6'; g.fillRect(x - w * 0.8, y - 3, w * 1.6, 7);
        g.strokeStyle = line; g.lineWidth = 2.2; g.strokeRect(x - w * 0.8, y - 3, w * 1.6, 7);
        g.beginPath(); g.moveTo(x - w * 0.8, y + 0.5); g.lineTo(x + w * 0.8, y + 0.5); g.stroke();
        break;
      case 'o':
        g.fillStyle = '#4a1414'; g.beginPath(); g.ellipse(x, y + 2, 8, 10, 0, 0, Math.PI * 2); g.fill();
        g.strokeStyle = d.lips ? lip : line; g.lineWidth = 3; g.stroke();
        break;
      case 'wavy':
        g.strokeStyle = line; g.lineWidth = 2.4;
        g.beginPath(); g.moveTo(x - w * 0.8, y + 1); g.bezierCurveTo(x - 6, y - 5, x + 6, y + 6, x + w * 0.8, y); g.stroke();
        break;
      case 'smirk':
        g.strokeStyle = line; g.lineWidth = 2.6;
        g.beginPath(); g.moveTo(x - w * 0.8, y + 2); g.quadraticCurveTo(x + 4, y + 4, x + w, y - 6); g.stroke();
        break;
      case 'set':
        g.strokeStyle = line; g.lineWidth = 3;
        g.beginPath(); g.moveTo(x - w * 0.8, y); g.lineTo(x + w * 0.8, y); g.stroke();
        if (d.lips) { g.fillStyle = lip; g.beginPath(); g.ellipse(x, y + 4, w * 0.5, 3, 0, 0, Math.PI * 2); g.fill(); }
        break;
      case 'down':
        g.strokeStyle = line; g.lineWidth = 2.6;
        g.beginPath(); g.moveTo(x - w * 0.85, y + 3); g.quadraticCurveTo(x, y - 2, x + w * 0.85, y + 3); g.stroke();
        break;
      default:
        if (d.lips) {
          g.fillStyle = lip;
          g.beginPath(); g.moveTo(x - w, y); g.quadraticCurveTo(x - 6, y - 5, x, y - 2); g.quadraticCurveTo(x + 6, y - 5, x + w, y); g.quadraticCurveTo(x, y + 9, x - w, y); g.fill();
        }
        g.strokeStyle = line; g.lineWidth = 2.4;
        g.beginPath(); g.moveTo(x - w * 0.85, y); g.quadraticCurveTo(x, y + 2, x + w * 0.85, y); g.stroke();
    }
    // lower lip shading
    if (!d.lips && E.mouth !== 'open_smile' && E.mouth !== 'o') {
      g.fillStyle = U.shade(d.skin, -0.2, 0.5); g.beginPath(); g.ellipse(x, y + 9, w * 0.45, 3, 0, 0, Math.PI * 2); g.fill();
    }
  },

  mustache(g, d, x, y) {
    g.fillStyle = d.mustache === 'thin' ? '#1a1414' : '#2e2420';
    if (d.mustache === 'chiang') {
      g.beginPath(); g.moveTo(x - 20, y + 4); g.quadraticCurveTo(x, y - 6, x + 20, y + 4); g.quadraticCurveTo(x, y + 1, x - 20, y + 4); g.fill();
      g.fillRect(x - 12, y - 1, 24, 4);
    } else {
      g.beginPath(); g.moveTo(x - 14, y + 3); g.quadraticCurveTo(x, y - 3, x + 14, y + 3); g.quadraticCurveTo(x, y + 1, x - 14, y + 3); g.fill();
    }
  },

  glasses(g, cx, y, dx) {
    g.strokeStyle = '#2a1c14'; g.lineWidth = 3.5;
    for (const s of [-1, 1]) {
      g.beginPath(); g.arc(cx + s * dx, y + 2, 25, 0, Math.PI * 2); g.stroke();
      g.save(); g.globalAlpha = 0.18; g.fillStyle = '#cfe4ff';
      g.beginPath(); g.arc(cx + s * dx, y + 2, 23, 0, Math.PI * 2); g.fill(); g.restore();
      g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 2.5;
      g.beginPath(); g.arc(cx + s * dx, y + 2, 18, -2.4, -1.7); g.stroke();
      g.strokeStyle = '#2a1c14'; g.lineWidth = 3.5;
    }
    g.beginPath(); g.moveTo(cx - dx + 25, y - 2); g.quadraticCurveTo(cx, y - 10, cx + dx - 25, y - 2); g.stroke();
  },

  hairBack(g, d, cx, fw, chin) {
    const h = d.hair;
    const grad = g.createLinearGradient(0, 100, 0, 360);
    grad.addColorStop(0, U.shade(h, 0.08)); grad.addColorStop(1, U.shade(h, -0.3));
    g.fillStyle = grad;
    switch (d.style) {
      case 'bob':
        g.beginPath();
        g.moveTo(cx - fw - 22, 300);
        g.bezierCurveTo(cx - fw - 40, 180, cx - fw, 88, cx, 88);
        g.bezierCurveTo(cx + fw, 88, cx + fw + 40, 180, cx + fw + 22, 300);
        g.quadraticCurveTo(cx + fw, 316, cx + fw - 8, 300);
        g.lineTo(cx - fw + 8, 300); g.quadraticCurveTo(cx - fw, 316, cx - fw - 22, 300);
        g.fill();
        break;
      case 'wave':
        g.beginPath();
        g.moveTo(cx - fw - 20, 290);
        g.bezierCurveTo(cx - fw - 36, 170, cx - fw, 90, cx, 90);
        g.bezierCurveTo(cx + fw, 90, cx + fw + 36, 170, cx + fw + 20, 290);
        g.bezierCurveTo(cx + fw + 30, 305, cx + fw - 5, 312, cx + fw - 6, 290);
        g.lineTo(cx - fw + 6, 290);
        g.bezierCurveTo(cx - fw + 5, 312, cx - fw - 30, 305, cx - fw - 20, 290);
        g.fill();
        break;
      case 'bun':
        g.beginPath(); g.ellipse(cx + 10, 92, 40, 30, 0.2, 0, Math.PI * 2); g.fill();
        g.beginPath(); g.ellipse(cx, 190, fw + 10, 100, 0, 0, Math.PI * 2); g.fill();
        break;
      case 'long':
        g.beginPath(); g.ellipse(cx, 200, fw + 16, 120, 0, 0, Math.PI * 2); g.fill();
        g.fillRect(cx - fw - 14, 200, (fw + 14) * 2, 70);
        break;
      default:
        g.beginPath(); g.ellipse(cx, 175, fw + 6, 82, 0, 0, Math.PI * 2); g.fill();
    }
  },

  hairFront(g, d, cx, fw, eyeY, top) {
    const h = d.hair, hi = d.hairHi;
    const grad = g.createLinearGradient(cx - fw, top - 30, cx + fw, eyeY);
    grad.addColorStop(0, U.shade(h, 0.1)); grad.addColorStop(1, U.shade(h, -0.2));
    g.fillStyle = grad;
    const shine = (x1, y1, x2, y2, cpx, cpy, w = 5) => {
      g.strokeStyle = U.alpha(hi, 0.55); g.lineWidth = w; g.lineCap = 'round';
      g.beginPath(); g.moveTo(x1, y1); g.quadraticCurveTo(cpx, cpy, x2, y2); g.stroke();
    };
    switch (d.style) {
      case 'bob': {
        g.beginPath();
        g.moveTo(cx - fw - 10, eyeY + 70);
        g.bezierCurveTo(cx - fw - 18, top - 10, cx - fw * 0.5, top - 42, cx, top - 42);
        g.bezierCurveTo(cx + fw * 0.5, top - 42, cx + fw + 18, top - 10, cx + fw + 10, eyeY + 70);
        g.lineTo(cx + fw - 4, eyeY + 60);
        g.lineTo(cx + fw - 6, eyeY - 30);
        // fringe with jagged tips
        const n = 9, fy = eyeY - 36;
        for (let i = 0; i <= n; i++) {
          const x = cx + fw - 8 - (i / n) * (fw * 2 - 16);
          g.lineTo(x + 6, fy - (i % 2 ? 12 : 0) + Math.sin(i) * 3);
          g.lineTo(x, fy + (i % 2 ? 0 : 4));
        }
        g.lineTo(cx - fw + 6, eyeY - 30);
        g.lineTo(cx - fw + 4, eyeY + 60);
        g.closePath(); g.fill();
        shine(cx - fw * 0.7, top + 10, cx + fw * 0.4, top - 2, cx - 10, top - 26, 6);
        g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 2;
        for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(cx - 40 + i * 16, top - 20); g.quadraticCurveTo(cx - 44 + i * 16, eyeY - 60, cx - 42 + i * 17, eyeY - 38); g.stroke(); }
        break;
      }
      case 'wave': {
        g.beginPath();
        g.moveTo(cx - fw - 8, eyeY + 50);
        g.bezierCurveTo(cx - fw - 16, top - 10, cx - fw * 0.5, top - 40, cx + 10, top - 40);
        g.bezierCurveTo(cx + fw * 0.6, top - 40, cx + fw + 18, top - 10, cx + fw + 8, eyeY + 50);
        g.lineTo(cx + fw - 6, eyeY - 20);
        g.bezierCurveTo(cx + fw - 20, top + 10, cx + 20, top + 30, cx - 10, top + 8);
        g.bezierCurveTo(cx - 30, top + 30, cx - fw + 10, top + 10, cx - fw + 6, eyeY - 20);
        g.closePath(); g.fill();
        for (let i = 0; i < 3; i++) shine(cx - fw * 0.8 + i * 10, top + 20 + i * 18, cx - fw * 0.2 + i * 10, top + 4 + i * 18, cx - fw * 0.7 + i * 14, top - 8 + i * 18, 4);
        shine(cx + 10, top - 26, cx + fw * 0.8, top + 6, cx + fw * 0.5, top - 24, 5);
        break;
      }
      case 'short': case 'messy': {
        g.beginPath();
        g.moveTo(cx - fw - 6, eyeY - 10);
        g.bezierCurveTo(cx - fw - 14, top - 30, cx - fw * 0.4, top - 44, cx + 10, top - 40);
        g.bezierCurveTo(cx + fw * 0.7, top - 38, cx + fw + 14, top - 20, cx + fw + 4, eyeY - 12);
        g.lineTo(cx + fw - 6, top + 22);
        g.bezierCurveTo(cx + 30, top + 10, cx - 10, top + 30, cx - 30, top + 22);
        g.quadraticCurveTo(cx - fw + 6, top + 26, cx - fw + 2, eyeY - 12);
        g.closePath(); g.fill();
        if (d.style === 'messy') {
          g.beginPath(); for (let i = 0; i < 7; i++) { const x = cx - fw + i * 22; g.moveTo(x, top); g.lineTo(x + 8, top + 34 + (i % 2) * 10); g.lineTo(x + 16, top); } g.fill();
        }
        shine(cx - fw * 0.6, top - 6, cx + fw * 0.3, top - 24, cx - 16, top - 32, 5);
        break;
      }
      case 'slick': {
        g.beginPath();
        g.moveTo(cx - fw - 4, eyeY - 14);
        g.bezierCurveTo(cx - fw - 10, top - 34, cx - fw * 0.3, top - 44, cx + 16, top - 40);
        g.bezierCurveTo(cx + fw * 0.8, top - 36, cx + fw + 10, top - 14, cx + fw + 2, eyeY - 16);
        g.lineTo(cx + fw - 4, top + 12);
        g.bezierCurveTo(cx + 30, top - 4, cx - 30, top + 2, cx - fw + 4, top + 22);
        g.lineTo(cx - fw + 2, eyeY - 16);
        g.closePath(); g.fill();
        for (let i = 0; i < 4; i++) shine(cx - fw * 0.8 + i * 8, top + 8 - i * 4, cx + fw * 0.6, top - 26 + i * 8, cx - 20, top - 30 + i * 4, 3);
        // parting line
        g.strokeStyle = U.shade(d.skin, -0.1, 0.6); g.lineWidth = 2; g.beginPath(); g.moveTo(cx - fw * 0.45, top - 30); g.lineTo(cx - fw * 0.5, top + 4); g.stroke();
        break;
      }
      case 'swept': {
        g.beginPath();
        g.moveTo(cx - fw - 4, eyeY - 20);
        g.bezierCurveTo(cx - fw - 8, top - 40, cx, top - 56, cx + fw * 0.6, top - 40);
        g.bezierCurveTo(cx + fw + 8, top - 26, cx + fw + 6, top, cx + fw + 2, eyeY - 20);
        g.lineTo(cx + fw - 6, top + 16);
        g.bezierCurveTo(cx + 20, top - 6, cx - 30, top - 6, cx - fw + 4, top + 16);
        g.closePath(); g.fill();
        shine(cx - fw * 0.5, top - 20, cx + fw * 0.5, top - 30, cx, top - 48, 5);
        break;
      }
      case 'long': {
        // high forehead, hair swept back, centre-left parting, long at the sides
        g.beginPath();
        g.moveTo(cx - fw - 12, eyeY + 30);
        g.bezierCurveTo(cx - fw - 18, top - 30, cx - fw * 0.4, top - 50, cx, top - 44);
        g.bezierCurveTo(cx + fw * 0.5, top - 50, cx + fw + 18, top - 30, cx + fw + 12, eyeY + 30);
        g.lineTo(cx + fw - 2, eyeY - 10);
        g.bezierCurveTo(cx + fw - 6, top - 6, cx + 20, top - 18, cx - 6, top - 14);
        g.bezierCurveTo(cx - 30, top - 18, cx - fw + 4, top - 6, cx - fw + 2, eyeY - 10);
        g.closePath(); g.fill();
        shine(cx - fw * 0.7, top - 10, cx - 6, top - 38, cx - fw * 0.5, top - 42, 4);
        shine(cx + 6, top - 38, cx + fw * 0.7, top - 10, cx + fw * 0.5, top - 42, 4);
        break;
      }
      case 'bun': {
        g.beginPath();
        g.moveTo(cx - fw - 6, eyeY - 6);
        g.bezierCurveTo(cx - fw - 10, top - 34, cx - fw * 0.4, top - 42, cx, top - 40);
        g.bezierCurveTo(cx + fw * 0.4, top - 42, cx + fw + 10, top - 34, cx + fw + 6, eyeY - 6);
        g.lineTo(cx + fw - 2, top + 20);
        g.quadraticCurveTo(cx, top - 14, cx - fw + 2, top + 20);
        g.closePath(); g.fill();
        for (let i = 0; i < 5; i++) shine(cx - fw + 8 + i * 6, top + 10, cx - 4, top - 34 + i * 3, cx - fw * 0.4, top - 30, 2);
        for (let i = 0; i < 5; i++) shine(cx + fw - 8 - i * 6, top + 10, cx + 4, top - 34 + i * 3, cx + fw * 0.4, top - 30, 2);
        // hairpin
        g.strokeStyle = '#c8a040'; g.lineWidth = 4; g.beginPath(); g.moveTo(cx + 30, top - 58); g.lineTo(cx + 70, top - 36); g.stroke();
        break;
      }
      case 'buzz': {
        g.save(); g.globalAlpha = 0.85;
        g.beginPath();
        g.moveTo(cx - fw, eyeY - 20);
        g.bezierCurveTo(cx - fw - 4, top - 20, cx - fw * 0.4, top - 14, cx, top - 14);
        g.bezierCurveTo(cx + fw * 0.4, top - 14, cx + fw + 4, top - 20, cx + fw, eyeY - 20);
        g.lineTo(cx + fw - 6, top + 12); g.quadraticCurveTo(cx, top + 2, cx - fw + 6, top + 12);
        g.closePath(); g.fill(); g.restore();
        break;
      }
      case 'receding': {
        g.beginPath();
        g.moveTo(cx - fw - 2, eyeY - 10);
        g.bezierCurveTo(cx - fw - 6, top - 10, cx - fw * 0.6, top - 26, cx - 20, top - 24);
        g.lineTo(cx - fw + 16, top + 30); g.lineTo(cx - fw + 2, eyeY - 10); g.fill();
        g.beginPath();
        g.moveTo(cx + fw + 2, eyeY - 10);
        g.bezierCurveTo(cx + fw + 6, top - 10, cx + fw * 0.6, top - 26, cx + 20, top - 24);
        g.lineTo(cx + fw - 16, top + 30); g.lineTo(cx + fw - 2, eyeY - 10); g.fill();
        break;
      }
      case 'bald': {
        const sh = g.createRadialGradient(cx - 24, top - 10, 2, cx - 24, top - 10, 40);
        sh.addColorStop(0, 'rgba(255,255,250,0.5)'); sh.addColorStop(1, 'rgba(255,255,250,0)');
        g.fillStyle = sh; g.fillRect(cx - 70, top - 50, 100, 90);
        break;
      }
      default: break;
    }
  },

  hat(g, d, cx, fw, top) {
    const c = d.hatC || '#333';
    const gr = g.createLinearGradient(cx - fw - 40, top - 60, cx + fw + 40, top + 30);
    gr.addColorStop(0, U.shade(c, 0.18)); gr.addColorStop(1, U.shade(c, -0.35));
    g.fillStyle = gr;
    switch (d.hat) {
      case 'fedora':
        g.beginPath(); g.ellipse(cx, top + 6, fw + 58, 20, -0.04, 0, Math.PI * 2); g.fill();
        g.beginPath();
        g.moveTo(cx - fw - 8, top + 4);
        g.bezierCurveTo(cx - fw - 4, top - 70, cx - 20, top - 78, cx, top - 62);
        g.bezierCurveTo(cx + 20, top - 78, cx + fw + 4, top - 70, cx + fw + 8, top + 4);
        g.closePath(); g.fill();
        g.fillStyle = U.shade(c, -0.55); g.fillRect(cx - fw - 7, top - 16, (fw + 7) * 2, 14);
        g.strokeStyle = U.shade(c, 0.3, 0.5); g.lineWidth = 3; g.beginPath(); g.moveTo(cx - fw - 50, top + 10); g.quadraticCurveTo(cx, top + 30, cx + fw + 50, top + 4); g.stroke();
        break;
      case 'cap8': case 'jpcap': {
        g.beginPath();
        g.moveTo(cx - fw - 10, top + 20);
        g.bezierCurveTo(cx - fw - 12, top - 56, cx + fw + 12, top - 56, cx + fw + 10, top + 20);
        g.closePath(); g.fill();
        // visor
        g.fillStyle = U.shade(c, -0.4);
        g.beginPath(); g.moveTo(cx - fw + 4, top + 16); g.quadraticCurveTo(cx, top + 44, cx + fw - 4, top + 16); g.quadraticCurveTo(cx, top + 26, cx - fw + 4, top + 16); g.fill();
        if (d.hat === 'jpcap') {
          // yellow star
          this.star(g, cx, top - 10, 12, '#e8c040');
          g.strokeStyle = U.shade(c, -0.3); g.lineWidth = 3; g.beginPath(); g.moveTo(cx - fw - 8, top + 4); g.lineTo(cx + fw + 8, top + 4); g.stroke();
        } else {
          g.strokeStyle = U.shade(c, -0.3); g.lineWidth = 3; g.beginPath(); g.moveTo(cx - fw - 8, top + 6); g.lineTo(cx + fw + 8, top + 6); g.stroke();
        }
        break;
      }
      case 'peaked': {
        g.beginPath();
        g.moveTo(cx - fw - 8, top + 12);
        g.bezierCurveTo(cx - fw - 40, top - 50, cx + fw + 40, top - 50, cx + fw + 8, top + 12);
        g.closePath(); g.fill();
        g.fillStyle = '#7a1414'; g.fillRect(cx - fw - 6, top - 8, (fw + 6) * 2, 20);
        g.fillStyle = '#0e0e0e';
        g.beginPath(); g.moveTo(cx - fw + 2, top + 12); g.quadraticCurveTo(cx, top + 42, cx + fw - 2, top + 12); g.fill();
        g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(cx - 30, top + 16, 40, 3);
        this.star(g, cx, top - 16, 11, '#e0c040');
        break;
      }
      case 'beret':
        g.beginPath(); g.ellipse(cx + 18, top - 22, fw + 30, 34, 0.18, 0, Math.PI * 2); g.fill();
        g.fillStyle = U.shade(c, -0.4); g.fillRect(cx + 34, top - 62, 5, 10);
        break;
      case 'helmet':
        g.beginPath();
        g.moveTo(cx - fw - 24, top + 40);
        g.bezierCurveTo(cx - fw - 20, top - 80, cx + fw + 20, top - 80, cx + fw + 24, top + 40);
        g.lineTo(cx + fw + 6, top + 36); g.quadraticCurveTo(cx, top + 12, cx - fw - 6, top + 36);
        g.closePath(); g.fill();
        break;
      default: break;
    }
  },

  star(g, x, y, r, col) {
    g.fillStyle = col; g.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r;
      g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    g.closePath(); g.fill();
  },

  clothes(g, d, cx, chin) {
    const c1 = d.c1, c2 = d.c2, H = this.H;
    const sy = 372; // shoulder line
    const body = new Path2D();
    const sw = d.female ? 150 : 175;
    body.moveTo(cx - sw, H);
    body.bezierCurveTo(cx - sw, sy + 30, cx - sw + 40, sy, cx - 50, sy - 12);
    body.lineTo(cx + 50, sy - 12);
    body.bezierCurveTo(cx + sw - 40, sy, cx + sw, sy + 30, cx + sw, H);
    body.closePath();
    const bg = g.createLinearGradient(cx - sw, sy, cx + sw, H);
    bg.addColorStop(0, U.shade(c1, 0.15)); bg.addColorStop(0.5, c1); bg.addColorStop(1, U.shade(c1, -0.35));
    g.fillStyle = bg; g.fill(body);
    // folds
    g.save(); g.clip(body);
    g.strokeStyle = 'rgba(0,0,0,0.18)'; g.lineWidth = 3;
    for (const s of [-1, 1]) { g.beginPath(); g.moveTo(cx + s * 110, sy + 20); g.quadraticCurveTo(cx + s * 100, sy + 80, cx + s * 120, H); g.stroke(); }
    g.restore();
    const S = (col) => { g.fillStyle = col; };
    switch (d.clothes) {
      case 'jacket': case 'qipao': case 'winter': {
        // mandarin collar
        S(d.clothes === 'qipao' ? U.shade(c1, 0.1) : c2);
        g.beginPath(); g.moveTo(cx - 44, chin + 30); g.quadraticCurveTo(cx, chin + 46, cx + 44, chin + 30); g.lineTo(cx + 46, chin + 58); g.quadraticCurveTo(cx, chin + 74, cx - 46, chin + 58); g.closePath(); g.fill();
        // dajin curved opening
        g.strokeStyle = d.trim || U.shade(c1, -0.45); g.lineWidth = 4;
        g.beginPath(); g.moveTo(cx + 4, chin + 70); g.bezierCurveTo(cx + 40, chin + 80, cx + 70, chin + 100, cx + 80, H); g.stroke();
        if (d.trim) { g.strokeStyle = d.trim; g.lineWidth = 3; g.beginPath(); g.moveTo(cx - 44, chin + 32); g.quadraticCurveTo(cx, chin + 48, cx + 44, chin + 32); g.stroke(); }
        // frog buttons
        for (let i = 0; i < 3; i++) {
          const bx = cx + 20 + i * 18, by = chin + 78 + i * 16;
          g.strokeStyle = d.trim || '#e8dcc0'; g.lineWidth = 3;
          g.beginPath(); g.moveTo(bx - 10, by); g.lineTo(bx + 10, by); g.stroke();
          g.fillStyle = d.trim || '#e8dcc0'; g.beginPath(); g.arc(bx + 12, by, 3.5, 0, Math.PI * 2); g.fill();
        }
        if (d.clothes === 'qipao') {
          // silk sheen + floral pattern
          g.save(); g.clip(body);
          const sh = g.createLinearGradient(cx - 150, 380, cx + 20, 500);
          sh.addColorStop(0, 'rgba(255,255,255,0)'); sh.addColorStop(0.5, 'rgba(255,230,230,0.18)'); sh.addColorStop(1, 'rgba(255,255,255,0)');
          g.fillStyle = sh; g.fillRect(0, 360, 400, 140);
          g.fillStyle = U.alpha(d.trim || '#e0b050', 0.35);
          const r = U.srand(9);
          for (let i = 0; i < 14; i++) { const x = r() * 400, y = 390 + r() * 110; for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2; g.beginPath(); g.ellipse(x + Math.cos(a) * 6, y + Math.sin(a) * 6, 5, 3, a, 0, Math.PI * 2); g.fill(); } }
          g.restore();
        }
        if (d.clothes === 'winter' || d.scarf) {
          g.fillStyle = d.scarf || '#b03030';
          g.beginPath(); g.moveTo(cx - 60, chin + 34); g.quadraticCurveTo(cx, chin + 70, cx + 60, chin + 34); g.lineTo(cx + 64, chin + 64); g.quadraticCurveTo(cx, chin + 100, cx - 64, chin + 64); g.closePath(); g.fill();
          g.fillRect(cx + 20, chin + 60, 30, 110);
          g.strokeStyle = 'rgba(0,0,0,0.2)'; g.lineWidth = 2; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(cx + 20, chin + 80 + i * 20); g.lineTo(cx + 50, chin + 80 + i * 20); g.stroke(); }
        }
        break;
      }
      case 'servant':
        S(c2); g.beginPath(); g.moveTo(cx - 40, chin + 34); g.quadraticCurveTo(cx, chin + 48, cx + 40, chin + 34); g.lineTo(cx + 42, chin + 56); g.quadraticCurveTo(cx, chin + 70, cx - 42, chin + 56); g.fill();
        S('#f6f2ea'); g.fillRect(cx - 70, chin + 80, 140, 200);
        S('#8a2a2a'); g.fillRect(cx - 70, chin + 80, 140, 6);
        break;
      case 'student': {
        S(c2); g.fillRect(cx - 40, chin + 28, 80, 30);
        g.fillStyle = '#c8a050';
        for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(cx, chin + 80 + i * 32, 5, 0, Math.PI * 2); g.fill(); }
        // scarf
        g.fillStyle = d.scarf;
        g.beginPath(); g.moveTo(cx - 62, chin + 30); g.quadraticCurveTo(cx, chin + 70, cx + 62, chin + 30); g.lineTo(cx + 66, chin + 58); g.quadraticCurveTo(cx, chin + 96, cx - 66, chin + 58); g.closePath(); g.fill();
        g.beginPath(); g.moveTo(cx - 40, chin + 60); g.lineTo(cx - 70, H); g.lineTo(cx - 30, H); g.lineTo(cx - 20, chin + 70); g.fill();
        g.strokeStyle = 'rgba(0,0,0,0.12)'; g.lineWidth = 2; for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(cx - 45 - i * 5, chin + 90 + i * 20); g.lineTo(cx - 25 - i * 3, chin + 90 + i * 20); g.stroke(); }
        break;
      }
      case 'prison':
        S(U.shade(c1, -0.2)); g.beginPath(); g.moveTo(cx - 40, chin + 34); g.lineTo(cx, chin + 90); g.lineTo(cx + 40, chin + 34); g.lineTo(cx + 60, chin + 40); g.lineTo(cx, chin + 110); g.lineTo(cx - 60, chin + 40); g.fill();
        g.strokeStyle = 'rgba(120,20,20,0.5)'; g.lineWidth = 4; g.beginPath(); g.moveTo(cx + 70, 420); g.lineTo(cx + 110, 470); g.stroke();
        break;
      case 'trench': case 'suit': {
        // shirt + tie
        S('#ece8e0'); g.beginPath(); g.moveTo(cx - 36, chin + 30); g.lineTo(cx, chin + 120); g.lineTo(cx + 36, chin + 30); g.fill();
        S(d.tie || '#3a1a1a'); g.beginPath(); g.moveTo(cx - 8, chin + 44); g.lineTo(cx + 8, chin + 44); g.lineTo(cx + 12, chin + 120); g.lineTo(cx, chin + 134); g.lineTo(cx - 12, chin + 120); g.fill();
        S(U.shade(d.tie || '#3a1a1a', -0.3)); g.fillRect(cx - 8, chin + 36, 16, 10);
        // lapels
        const lw = d.clothes === 'trench' ? 70 : 50;
        S(U.shade(c1, d.clothes === 'trench' ? 0.08 : -0.15));
        for (const s of [-1, 1]) {
          g.beginPath(); g.moveTo(cx + s * 36, chin + 26); g.lineTo(cx + s * (36 + lw), chin + 60); g.lineTo(cx + s * (22 + lw * 0.5), chin + 96); g.lineTo(cx + s * 4, chin + 140); g.lineTo(cx + s * 12, chin + 60); g.closePath(); g.fill();
        }
        if (d.clothes === 'trench') {
          g.fillStyle = U.shade(c1, -0.4);
          for (const s of [-1, 1]) { g.beginPath(); g.arc(cx + s * 70, chin + 150, 6, 0, Math.PI * 2); g.fill(); }
          g.fillRect(cx - 170, chin + 130, 60, 10); g.fillRect(cx + 110, chin + 130, 60, 10);
        } else {
          S('#e8e0c8'); g.beginPath(); g.moveTo(cx - 92, chin + 90); g.lineTo(cx - 76, chin + 84); g.lineTo(cx - 74, chin + 100); g.fill();
        }
        break;
      }
      case 'eighth': case 'ccp': case 'kmtsoldier': {
        // turn-down collar + pockets
        S(U.shade(c1, 0.12));
        for (const s of [-1, 1]) { g.beginPath(); g.moveTo(cx + s * 4, chin + 40); g.lineTo(cx + s * 52, chin + 26); g.lineTo(cx + s * 60, chin + 70); g.lineTo(cx + s * 8, chin + 76); g.closePath(); g.fill(); }
        S(U.shade(c1, -0.3)); g.fillRect(cx - 3, chin + 70, 6, 140);
        g.fillStyle = U.shade(c1, -0.15);
        for (const s of [-1, 1]) { g.fillRect(cx + s * 50 - 30, chin + 110, 60, 50); g.fillStyle = U.shade(c1, -0.35); g.fillRect(cx + s * 50 - 30, chin + 108, 60, 10); g.fillStyle = U.shade(c1, -0.15); }
        g.fillStyle = '#8a8a7a'; for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(cx, chin + 90 + i * 30, 4.5, 0, Math.PI * 2); g.fill(); }
        if (d.clothes === 'ccp') {
          // patches
          g.fillStyle = U.shade(c1, 0.08); g.fillRect(cx - 150, chin + 150, 36, 30);
          g.strokeStyle = 'rgba(0,0,0,0.3)'; g.setLineDash([4, 4]); g.strokeRect(cx - 150, chin + 150, 36, 30); g.setLineDash([]);
        }
        if (d.clothes === 'eighth') {
          g.fillStyle = '#e8e4d8'; g.save(); g.translate(cx - 140, chin + 150); g.rotate(-0.1); g.fillRect(0, 0, 50, 26);
          g.fillStyle = '#222'; g.font = 'bold 17px serif'; g.fillText('八路', 7, 19); g.restore();
        }
        if (d.clothes === 'kmtsoldier') { g.fillStyle = '#2a3a8a'; g.fillRect(cx + 44, chin + 36, 18, 10); }
        break;
      }
      case 'kmtgeneral': {
        // high standing collar with insignia
        S(U.shade(c1, 0.05)); g.beginPath(); g.moveTo(cx - 44, chin + 20); g.lineTo(cx + 44, chin + 20); g.lineTo(cx + 48, chin + 58); g.lineTo(cx - 48, chin + 58); g.fill();
        S(d.name === 'Dai Li' ? '#6a2a2a' : '#c8a040'); g.fillRect(cx - 44, chin + 30, 26, 20); g.fillRect(cx + 18, chin + 30, 26, 20);
        g.fillStyle = '#f0e0a0'; for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(cx + s * 31 - 8 + i * 8, chin + 40, 2.5, 0, Math.PI * 2); g.fill(); }
        S(U.shade(c1, -0.3)); g.fillRect(cx - 3, chin + 58, 6, 150);
        g.fillStyle = '#c8a040'; for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(cx, chin + 76 + i * 28, 5, 0, Math.PI * 2); g.fill(); }
        if (d.name !== 'Dai Li') {
          // ribbons
          const cols = ['#b03030', '#2a4a9a', '#e8c040', '#f0f0f0', '#3a8a4a'];
          for (let i = 0; i < 6; i++) { g.fillStyle = cols[i % cols.length]; g.fillRect(cx - 120 + (i % 3) * 20, chin + 90 + Math.floor(i / 3) * 12, 18, 9); }
          // cape
          g.fillStyle = 'rgba(40,44,30,0.85)';
          g.beginPath(); g.moveTo(cx - 60, chin + 26); g.bezierCurveTo(cx - 190, chin + 60, cx - 200, 460, cx - 200, H); g.lineTo(cx - 150, H); g.bezierCurveTo(cx - 150, 430, cx - 110, chin + 70, cx - 50, chin + 40); g.fill();
          g.beginPath(); g.moveTo(cx + 60, chin + 26); g.bezierCurveTo(cx + 190, chin + 60, cx + 200, 460, cx + 200, H); g.lineTo(cx + 150, H); g.bezierCurveTo(cx + 150, 430, cx + 110, chin + 70, cx + 50, chin + 40); g.fill();
        }
        break;
      }
      case 'jpuniform': case 'jpofficer': {
        S(U.shade(c1, 0.05)); g.beginPath(); g.moveTo(cx - 44, chin + 22); g.lineTo(cx + 44, chin + 22); g.lineTo(cx + 48, chin + 56); g.lineTo(cx - 48, chin + 56); g.fill();
        // red collar tabs
        g.fillStyle = d.clothes === 'jpofficer' ? '#1a1a1a' : '#b02020';
        g.fillRect(cx - 44, chin + 30, 24, 18); g.fillRect(cx + 20, chin + 30, 24, 18);
        g.fillStyle = '#e0c040'; for (const s of [-1, 1]) for (let i = 0; i < (d.clothes === 'jpofficer' ? 3 : 1); i++) this.star(g, cx + s * 32 - 6 + i * 6, chin + 39, 4, '#e0c040');
        S(U.shade(c1, -0.3)); g.fillRect(cx - 3, chin + 56, 6, 150);
        g.fillStyle = '#c0a050'; for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(cx, chin + 74 + i * 28, 4.5, 0, Math.PI * 2); g.fill(); }
        if (d.clothes === 'jpofficer') {
          // Kempeitai armband
          g.save(); g.translate(cx - 170, chin + 120); g.rotate(-0.25);
          g.fillStyle = '#f0f0ea'; g.fillRect(0, 0, 58, 30);
          g.fillStyle = '#b01818'; g.font = 'bold 20px serif'; g.fillText('憲兵', 8, 23); g.restore();
          g.strokeStyle = '#2a1a10'; g.lineWidth = 8; g.beginPath(); g.moveTo(cx + 150, chin + 60); g.lineTo(cx - 60, H); g.stroke();
        }
        break;
      }
      case 'changshan':
        S(U.shade(c1, 0.08)); g.beginPath(); g.moveTo(cx - 42, chin + 28); g.quadraticCurveTo(cx, chin + 40, cx + 42, chin + 28); g.lineTo(cx + 44, chin + 54); g.quadraticCurveTo(cx, chin + 66, cx - 44, chin + 54); g.fill();
        g.strokeStyle = U.shade(c1, -0.4); g.lineWidth = 3; g.beginPath(); g.moveTo(cx + 2, chin + 62); g.bezierCurveTo(cx + 40, chin + 74, cx + 70, chin + 94, cx + 80, H); g.stroke();
        for (let i = 0; i < 3; i++) { g.fillStyle = '#d0c8b0'; g.beginPath(); g.arc(cx + 24 + i * 18, chin + 76 + i * 16, 3.5, 0, Math.PI * 2); g.fill(); }
        break;
      case 'blouse':
        S(c2); g.beginPath(); g.moveTo(cx - 36, chin + 30); g.lineTo(cx - 70, chin + 70); g.lineTo(cx, chin + 110); g.lineTo(cx + 70, chin + 70); g.lineTo(cx + 36, chin + 30); g.fill();
        g.strokeStyle = 'rgba(0,0,0,0.2)'; g.lineWidth = 2; g.beginPath(); g.moveTo(cx, chin + 60); g.lineTo(cx, H); g.stroke();
        // cardigan edges
        g.fillStyle = U.shade(c1, -0.15);
        g.fillRect(cx - 80, chin + 70, 22, 200); g.fillRect(cx + 58, chin + 70, 22, 200);
        // press badge
        g.fillStyle = '#e8e0c0'; g.fillRect(cx + 90, chin + 110, 44, 28); g.fillStyle = '#222'; g.font = 'bold 12px serif'; g.fillText('PRESS', cx + 93, chin + 129);
        break;
      default: break;
    }
  },
};
