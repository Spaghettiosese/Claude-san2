'use strict';
// ---------------------------------------------------------------------------
// Painted cutscene backdrops (960x540, drawn with gradients and silhouettes,
// scaled 2x onto the UI canvas). Each scene may add animated weather.
// ---------------------------------------------------------------------------
const Art = {
  W: 960, H: 540, cache: new Map(),
  get(id) {
    let c = this.cache.get(id);
    if (!c) {
      c = U.canvas(this.W, this.H);
      const g = c.getContext('2d');
      const fn = this.scenes[id] || this.scenes.black;
      try { fn.call(this, g, U.srand(id.length * 7919 + id.charCodeAt(0))); } catch (e) { console.error('art', id, e); }
      this.grain(g);
      this.cache.set(id, c);
    }
    return c;
  },
  weatherOf(id) { return (this.meta[id] || {}).weather; },
  meta: {
    nanjing_night: { weather: 'snow' }, nanjing_raid: { weather: 'embers' }, chongqing_raid: { weather: 'embers' },
    hongyan: { weather: 'rain' }, no76: { weather: 'rain' }, nanjing_snow: { weather: 'snow' }, river_night: { weather: 'snow' },
    garden: { weather: 'snow' }, railway: { weather: 'embers' }, palace: { weather: 'snow' }, home: {}, epilogue: { weather: 'fireworks' },
    loess_night: {}, train_roof: {},
  },

  // ---------------------------------------------------------------- helpers
  sky(g, top, bot, h = this.H) { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, top); gr.addColorStop(1, bot); g.fillStyle = gr; g.fillRect(0, 0, this.W, h); },
  stars(g, r, n = 200, h = 300) { for (let i = 0; i < n; i++) { g.fillStyle = `rgba(255,255,240,${r() * 0.8})`; const s = r() < 0.1 ? 2 : 1; g.fillRect(r() * this.W, r() * h, s, s); } },
  moon(g, x, y, rad, col = '#f4ecd0') {
    const gl = g.createRadialGradient(x, y, rad, x, y, rad * 5); gl.addColorStop(0, 'rgba(255,245,210,0.25)'); gl.addColorStop(1, 'rgba(255,245,210,0)');
    g.fillStyle = gl; g.fillRect(x - rad * 5, y - rad * 5, rad * 10, rad * 10);
    g.fillStyle = col; g.beginPath(); g.arc(x, y, rad, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(180,170,140,0.35)'; g.beginPath(); g.arc(x - rad * 0.3, y - rad * 0.2, rad * 0.25, 0, Math.PI * 2); g.fill(); g.beginPath(); g.arc(x + rad * 0.3, y + rad * 0.3, rad * 0.18, 0, Math.PI * 2); g.fill();
  },
  ridge(g, r, base, amp, col, rough = 14, step = 6) {
    g.fillStyle = col; g.beginPath(); g.moveTo(0, this.H);
    let y = base;
    for (let x = 0; x <= this.W + step; x += step) { y += (r() - 0.5) * rough; y = U.clamp(y, base - amp, base + amp); g.lineTo(x, y); }
    g.lineTo(this.W, this.H); g.closePath(); g.fill();
  },
  fog(g, y, h, col, a = 0.35) {
    const gr = g.createLinearGradient(0, y, 0, y + h); const c = U.hex(col).join(',');
    gr.addColorStop(0, `rgba(${c},0)`); gr.addColorStop(0.5, `rgba(${c},${a})`); gr.addColorStop(1, `rgba(${c},0)`);
    g.fillStyle = gr; g.fillRect(0, y, this.W, h);
  },
  glow(g, x, y, rad, col, a = 0.6) { const c = U.hex(col); const gr = g.createRadialGradient(x, y, 1, x, y, rad); gr.addColorStop(0, `rgba(${c.join(',')},${a})`); gr.addColorStop(1, `rgba(${c.join(',')},0)`); g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2); },
  roof(g, x, y, w, col, curl = 14) {
    g.fillStyle = col; g.beginPath();
    g.moveTo(x - curl, y - curl * 0.5); g.quadraticCurveTo(x + w * 0.1, y + 2, x + w * 0.5, y - curl * 0.8); g.quadraticCurveTo(x + w * 0.9, y + 2, x + w + curl, y - curl * 0.5);
    g.lineTo(x + w, y + 8); g.lineTo(x, y + 8); g.closePath(); g.fill();
  },
  building(g, x, y, w, h, col, r, winCol = 'rgba(255,200,120,0.7)', roofCol) {
    g.fillStyle = col; g.fillRect(x, y, w, h);
    if (roofCol) this.roof(g, x - 4, y - 6, w + 8, roofCol, 12);
    for (let wy = y + 10; wy < y + h - 10; wy += 16) for (let wx = x + 6; wx < x + w - 8; wx += 14) if (r() < 0.3) { g.fillStyle = winCol; g.fillRect(wx, wy, 6, 8); }
  },
  wall(g, y, col, r, towers = true) {
    g.fillStyle = col; g.fillRect(0, y, this.W, this.H - y);
    for (let x = 0; x < this.W; x += 22) g.fillRect(x, y - 12, 14, 12);
    g.fillStyle = 'rgba(0,0,0,0.2)'; for (let yy = y + 10; yy < this.H; yy += 14) g.fillRect(0, yy, this.W, 2);
    if (towers) { for (let i = 0; i < 2; i++) { const tx = 180 + i * 520 + r() * 60; g.fillStyle = col; g.fillRect(tx, y - 60, 120, 60); this.roof(g, tx - 10, y - 74, 140, U.shade(col, -0.35), 20); this.roof(g, tx + 10, y - 104, 100, U.shade(col, -0.35), 16); g.fillRect(tx + 20, y - 100, 80, 28); } }
  },
  lanterns(g, n, y, r) { for (let i = 0; i < n; i++) { const x = 60 + r() * (this.W - 120), yy = y + r() * 40; this.glow(g, x, yy, 40, '#ff5a30', 0.4); g.fillStyle = '#c82020'; g.beginPath(); g.ellipse(x, yy, 9, 12, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = '#e0b040'; g.fillRect(x - 5, yy - 13, 10, 2); g.fillRect(x - 5, yy + 11, 10, 2); } },
  person(g, x, y, s, col, opts = {}) {
    g.fillStyle = col;
    g.beginPath(); g.arc(x, y - 58 * s, 8 * s, 0, Math.PI * 2); g.fill();
    if (opts.cap) { g.fillRect(x - 9 * s, y - 68 * s, 18 * s, 6 * s); g.fillRect(x - 2 * s, y - 64 * s, 13 * s * (opts.dir || 1), 3 * s); }
    if (opts.helmet) { g.beginPath(); g.ellipse(x, y - 62 * s, 12 * s, 8 * s, 0, Math.PI, 0); g.fill(); }
    g.beginPath(); g.moveTo(x - 11 * s, y - 48 * s); g.lineTo(x + 11 * s, y - 48 * s); g.lineTo(x + (opts.dress ? 14 : 9) * s, y - 14 * s); g.lineTo(x - (opts.dress ? 14 : 9) * s, y - 14 * s); g.fill();
    g.fillRect(x - 8 * s, y - 16 * s, 6 * s, 16 * s); g.fillRect(x + 2 * s, y - 16 * s, 6 * s, 16 * s);
    if (opts.rifle) { g.save(); g.translate(x, y - 40 * s); g.rotate(-0.5 * (opts.dir || 1)); g.fillRect(-2 * s, -30 * s, 3 * s, 50 * s); g.restore(); }
    if (opts.hair) { g.beginPath(); g.arc(x, y - 60 * s, 9 * s, Math.PI, 0); g.fill(); g.fillRect(x - 9 * s, y - 60 * s, 18 * s, 8 * s); }
  },
  plane(g, x, y, s, col) {
    g.fillStyle = col;
    g.beginPath(); g.ellipse(x, y, 30 * s, 5 * s, 0, 0, Math.PI * 2); g.fill();
    g.fillRect(x - 6 * s, y - 2 * s, 12 * s, 4 * s);
    g.beginPath(); g.moveTo(x - 4 * s, y); g.lineTo(x + 8 * s, y - 32 * s); g.lineTo(x + 16 * s, y - 32 * s); g.lineTo(x + 12 * s, y); g.lineTo(x + 16 * s, y + 32 * s); g.lineTo(x + 8 * s, y + 32 * s); g.fill();
    g.beginPath(); g.moveTo(x - 26 * s, y); g.lineTo(x - 22 * s, y - 10 * s); g.lineTo(x - 18 * s, y - 10 * s); g.lineTo(x - 20 * s, y); g.fill();
  },
  pagoda(g, x, y, s, col) {
    g.fillStyle = col;
    for (let i = 0; i < 9; i++) { const w = (40 - i * 3) * s; g.fillRect(x - w / 2, y - (i + 1) * 18 * s, w, 18 * s); this.roof(g, x - w / 2 - 4 * s, y - (i + 1) * 18 * s - 2, w + 8 * s, col, 6 * s); }
    g.fillRect(x - 2 * s, y - 9 * 18 * s - 30 * s, 4 * s, 30 * s);
  },
  room(g, wall, floor, r, opts = {}) {
    const H = this.H, W = this.W;
    this.sky(g, U.shade(wall, 0.05), U.shade(wall, -0.25), H * 0.72);
    const fg = g.createLinearGradient(0, H * 0.72, 0, H); fg.addColorStop(0, U.shade(floor, 0.1)); fg.addColorStop(1, U.shade(floor, -0.4));
    g.fillStyle = fg; g.fillRect(0, H * 0.72, W, H * 0.28);
    g.fillStyle = 'rgba(0,0,0,0.25)'; for (let x = -W; x < W * 2; x += 60) { g.beginPath(); g.moveTo(W / 2 + (x - W / 2) * 0.3, H * 0.72); g.lineTo(x, H); g.lineTo(x + 2, H); g.lineTo(W / 2 + (x - W / 2) * 0.3 + 1, H * 0.72); g.fill(); }
    g.fillStyle = U.shade(wall, -0.35); g.fillRect(0, H * 0.72 - 40, W, 40);
    g.fillStyle = U.shade(wall, -0.5); g.fillRect(0, H * 0.72 - 42, W, 3);
    if (opts.window) {
      const wx = opts.window, wy = 90;
      g.fillStyle = '#1a1410'; g.fillRect(wx - 6, wy - 6, 172, 192);
      const sk = g.createLinearGradient(0, wy, 0, wy + 180); sk.addColorStop(0, opts.winTop || '#1a2040'); sk.addColorStop(1, opts.winBot || '#4a4060');
      g.fillStyle = sk; g.fillRect(wx, wy, 160, 180);
      g.fillStyle = '#1a1410'; g.fillRect(wx + 77, wy, 6, 180); g.fillRect(wx, wy + 86, 160, 6);
      // lattice
      g.strokeStyle = 'rgba(30,20,16,0.8)'; g.lineWidth = 2; for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(wx + i * 40, wy); g.lineTo(wx + i * 40, wy + 180); g.stroke(); }
    }
  },
  vignette(g, a = 0.6) { const gr = g.createRadialGradient(this.W / 2, this.H / 2, this.H * 0.35, this.W / 2, this.H / 2, this.H * 0.95); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, `rgba(0,0,0,${a})`); g.fillStyle = gr; g.fillRect(0, 0, this.W, this.H); },
  grain(g) { const r = U.srand(99); g.fillStyle = 'rgba(255,255,255,0.03)'; for (let i = 0; i < 3000; i++) g.fillRect(r() * this.W, r() * this.H, 1, 1); g.fillStyle = 'rgba(0,0,0,0.06)'; for (let i = 0; i < 3000; i++) g.fillRect(r() * this.W, r() * this.H, 1, 1); },
  sepia(g, a = 0.55) { g.save(); g.globalCompositeOperation = 'color'; g.fillStyle = `rgba(150,110,60,${a})`; g.fillRect(0, 0, this.W, this.H); g.restore(); },

  // ---------------------------------------------------------------- scenes
  scenes: {
    black(g) { g.fillStyle = '#050405'; g.fillRect(0, 0, this.W, this.H); },
    title(g, r) {
      this.sky(g, '#0a0a18', '#5a2a2a');
      this.moon(g, 720, 120, 36, '#f8e8c8');
      this.stars(g, r, 160, 260);
      this.ridge(g, r, 300, 40, '#1e1620', 12);
      this.pagoda(g, 220, 380, 1.2, '#140e14');
      this.wall(g, 420, '#120c10', r, false);
      this.fog(g, 330, 120, '#c08070', 0.25);
      this.lanterns(g, 6, 380, r);
      this.vignette(g, 0.7);
    },
    nanjing_night(g, r) {
      this.sky(g, '#16141e', '#4a4038');
      this.stars(g, r, 120);
      this.moon(g, 780, 90, 26);
      this.ridge(g, r, 250, 30, '#2a2426', 10); // Purple Mountain
      this.wall(g, 330, '#2e2824', r, true);
      for (let i = 0; i < 12; i++) { const x = r() * this.W; this.building(g, x, 400 + r() * 30, 70 + r() * 50, 200, '#1c1614', r, 'rgba(255,190,110,0.6)', '#141010'); }
      this.lanterns(g, 4, 390, r);
      this.sepia(g, 0.5); this.vignette(g, 0.7);
    },
    nanjing_raid(g, r) {
      this.sky(g, '#1a0c0a', '#6a2a14');
      this.glow(g, 480, 420, 400, '#ff6020', 0.35);
      for (let i = 0; i < 10; i++) { const x = r() * this.W; this.building(g, x, 330 + r() * 60, 80 + r() * 60, 300, '#140a08', r, 'rgba(255,140,60,0.8)', '#0a0504'); }
      for (let i = 0; i < 5; i++) { const x = 100 + r() * 760; g.fillStyle = 'rgba(40,20,16,0.6)'; g.beginPath(); g.ellipse(x, 200, 60, 140, 0.2, 0, Math.PI * 2); g.fill(); }
      for (let i = 0; i < 4; i++) this.person(g, 200 + i * 160, 520, 2.2, '#080404', { cap: true, rifle: true, dir: i % 2 ? 1 : -1 });
      this.sepia(g, 0.35); this.vignette(g, 0.75);
    },
    chongqing_raid(g, r) {
      this.sky(g, '#2a2830', '#8a5a40');
      this.ridge(g, r, 250, 50, '#3a3440', 18);
      this.fog(g, 230, 120, '#b0a098', 0.35);
      this.ridge(g, r, 330, 40, '#2a2226', 14);
      for (let i = 0; i < 30; i++) { const x = r() * this.W, y = 330 + r() * 120; g.fillStyle = '#1a1414'; g.fillRect(x, y, 30 + r() * 30, 20 + r() * 20); for (let k = 0; k < 3; k++) g.fillRect(x + k * 14, y + 20, 2, 40); }
      for (let i = 0; i < 5; i++) { const x = r() * this.W; this.glow(g, x, 400, 110, '#ff6a20', 0.5); g.fillStyle = 'rgba(30,20,20,0.5)'; g.beginPath(); g.ellipse(x + 20, 250, 40, 150, 0.15, 0, Math.PI * 2); g.fill(); }
      for (let i = 0; i < 9; i++) this.plane(g, 150 + (i % 3) * 90 + Math.floor(i / 3) * 170, 80 + (i % 3) * 30 + Math.floor(i / 3) * 18, 0.8, '#141418');
      g.strokeStyle = 'rgba(255,255,220,0.2)'; g.lineWidth = 14; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(200 + i * 280, 540); g.lineTo(300 + i * 200 + r() * 100, 0); g.stroke(); }
      this.vignette(g, 0.6);
    },
    chongqing_fog(g, r) {
      this.sky(g, '#9a9890', '#d8d0c0');
      this.ridge(g, r, 200, 40, '#8a8880', 16);
      this.fog(g, 180, 140, '#e8e0d0', 0.6);
      this.ridge(g, r, 300, 30, '#6a6660', 14);
      for (let i = 0; i < 26; i++) { const x = r() * this.W, y = 300 + r() * 150; g.fillStyle = '#4a4440'; g.fillRect(x, y, 30 + r() * 40, 24 + r() * 20); this.roof(g, x - 4, y - 6, 40, '#3a3430', 8); for (let k = 0; k < 3; k++) g.fillRect(x + k * 16, y + 24, 2, 50); }
      // stone steps
      g.fillStyle = '#5a5450'; for (let i = 0; i < 14; i++) g.fillRect(380 + i * 6, 540 - i * 14, 200 - i * 12, 14);
      this.fog(g, 380, 160, '#e8e0d0', 0.55);
      g.fillStyle = 'rgba(80,90,100,0.6)'; g.fillRect(0, 500, this.W, 40); // river
      this.vignette(g, 0.4);
    },
    teahouse(g, r) {
      this.room(g, '#6a5038', '#4a3424', r, { window: 620, winTop: '#9a9890', winBot: '#d8d0c0' });
      for (let i = 0; i < 3; i++) { const x = 120 + i * 230; g.fillStyle = '#3a2414'; g.fillRect(x, 420, 150, 12); g.fillRect(x + 10, 432, 10, 80); g.fillRect(x + 130, 432, 10, 80); g.fillStyle = '#e8e0d0'; g.fillRect(x + 40, 405, 18, 15); g.fillRect(x + 90, 408, 14, 12); }
      this.lanterns(g, 3, 60, r);
      g.fillStyle = '#2a1a10'; g.fillRect(40, 120, 90, 240); g.fillStyle = '#c8a050'; g.font = 'bold 36px serif'; g.fillText('茶', 66, 200); g.fillText('館', 66, 260);
      this.vignette(g, 0.55);
    },
    office(g, r) {
      this.room(g, '#5a5a50', '#3a3028', r, { window: 680, winTop: '#2a2a34', winBot: '#6a6068' });
      for (let i = 0; i < 4; i++) { g.fillStyle = '#4a4a44'; g.fillRect(60 + i * 110, 180, 90, 210); for (let k = 0; k < 4; k++) { g.fillStyle = '#5a5a52'; g.fillRect(66 + i * 110, 190 + k * 50, 78, 42); g.fillStyle = '#b0a080'; g.fillRect(96 + i * 110, 208 + k * 50, 18, 5); } }
      g.fillStyle = '#3a2618'; g.fillRect(420, 400, 260, 16); g.fillRect(430, 416, 20, 100); g.fillRect(650, 416, 20, 100);
      this.glow(g, 600, 380, 180, '#ffd080', 0.45); g.fillStyle = '#2a5a3a'; g.fillRect(580, 360, 40, 14); g.fillStyle = '#2a2a2a'; g.fillRect(598, 374, 4, 26);
      g.fillStyle = '#e8e0c8'; g.fillRect(480, 390, 60, 10);
      this.vignette(g, 0.65);
    },
    huangshan(g, r) {
      this.sky(g, '#1a2040', '#c07050');
      this.ridge(g, r, 230, 40, '#3a3048', 16);
      this.fog(g, 220, 120, '#d0a090', 0.3);
      this.ridge(g, r, 320, 30, '#1e1a24', 12);
      // villa
      g.fillStyle = '#d8d0c0'; g.fillRect(360, 280, 260, 120); this.roof(g, 350, 268, 280, '#3a2a2a', 18);
      for (let i = 0; i < 6; i++) { g.fillStyle = 'rgba(255,210,140,0.85)'; g.fillRect(380 + i * 40, 310, 18, 30); }
      for (let i = 0; i < 22; i++) { const x = r() * this.W; g.fillStyle = '#0e1a12'; const h = 80 + r() * 120; g.beginPath(); g.moveTo(x, 420); g.lineTo(x + 20, 420 - h); g.lineTo(x + 40, 420); g.fill(); }
      g.fillStyle = '#0c0a0e'; g.fillRect(0, 420, this.W, 120);
      this.vignette(g, 0.55);
    },
    study(g, r) {
      this.room(g, '#b8a888', '#5a2a18', r, { window: 700, winTop: '#10183a', winBot: '#3a3058' });
      g.fillStyle = '#4a2814'; g.fillRect(60, 120, 200, 280); for (let s = 0; s < 5; s++) for (let b = 0; b < 12; b++) { g.fillStyle = ['#7a2a2a', '#2a3a5a', '#5a4a2a', '#3a4a3a'][(b + s) % 4]; g.fillRect(68 + b * 16, 128 + s * 54, 12, 46); }
      // Sun Yat-sen portrait + flags
      g.fillStyle = '#b89040'; g.fillRect(380, 90, 140, 170); g.fillStyle = '#d8ccb0'; g.fillRect(390, 100, 120, 150);
      g.fillStyle = '#c8a888'; g.beginPath(); g.ellipse(450, 160, 26, 32, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = '#2a2a2a'; g.fillRect(420, 192, 60, 58); g.fillRect(430, 124, 40, 10);
      for (const fx of [300, 560]) { g.fillStyle = '#c82020'; g.fillRect(fx, 110, 70, 46); g.fillStyle = '#1a3a9a'; g.fillRect(fx, 110, 35, 24); g.fillStyle = '#f0f0f0'; g.beginPath(); g.arc(fx + 17, 122, 7, 0, Math.PI * 2); g.fill(); }
      g.fillStyle = '#3a1a0a'; g.fillRect(330, 400, 300, 18); g.fillRect(340, 418, 24, 100); g.fillRect(596, 418, 24, 100);
      this.glow(g, 560, 380, 160, '#ffd080', 0.4);
      this.vignette(g, 0.6);
    },
    hongyan(g, r) {
      this.sky(g, '#3a4048', '#7a8080');
      this.ridge(g, r, 250, 40, '#4a5048', 14);
      g.fillStyle = '#7a7468'; g.fillRect(300, 250, 380, 190); this.roof(g, 290, 238, 400, '#2e2a26', 20);
      for (let i = 0; i < 7; i++) { g.fillStyle = 'rgba(255,210,140,0.7)'; g.fillRect(320 + i * 50, 290, 22, 34); g.fillRect(320 + i * 50, 360, 22, 34); }
      g.fillStyle = '#c02020'; g.fillRect(470, 200, 40, 26);
      for (let i = 0; i < 16; i++) { const x = r() * this.W; g.fillStyle = '#1a2a1a'; g.beginPath(); g.arc(x, 420, 30 + r() * 30, Math.PI, 0); g.fill(); }
      g.fillStyle = '#1e221e'; g.fillRect(0, 430, this.W, 110);
      this.vignette(g, 0.55);
    },
    loess_night(g, r) {
      this.sky(g, '#060812', '#2a2440'); this.stars(g, r, 250, 360); this.moon(g, 200, 100, 22);
      for (let k = 0; k < 6; k++) this.ridge(g, r, 270 + k * 40, 16, U.mix('#3a3048', '#6a5030', k / 6), 6, 8);
      this.vignette(g, 0.6);
    },
    yanan(g, r) {
      this.sky(g, '#f0b070', '#f8e0b0');
      this.glow(g, 700, 330, 200, '#fff0c0', 0.6);
      for (let k = 0; k < 5; k++) this.ridge(g, r, 300 + k * 45, 16, U.mix('#b08050', '#6a4a2a', k / 5), 6, 8);
      this.pagoda(g, 480, 300, 1.1, '#5a3a2a');
      for (let i = 0; i < 14; i++) { const x = 40 + i * 68, y = 420 + (i % 3) * 30; g.fillStyle = '#3a2618'; g.beginPath(); g.arc(x, y, 20, Math.PI, 0); g.fillRect(x - 20, y, 40, 22); g.fill(); g.fillStyle = '#e0c890'; g.fillRect(x - 12, y - 8, 24, 14); g.strokeStyle = '#3a2618'; g.lineWidth = 2; g.strokeRect(x - 12, y - 8, 24, 14); }
      g.fillStyle = '#c02020'; g.fillRect(800, 260, 50, 32); g.fillStyle = '#3a2a1a'; g.fillRect(798, 260, 3, 120);
      this.vignette(g, 0.35);
    },
    cave(g, r) {
      g.fillStyle = '#2a2016'; g.fillRect(0, 0, this.W, this.H);
      const gr = g.createRadialGradient(480, 330, 20, 480, 300, 480); gr.addColorStop(0, '#d8c8a0'); gr.addColorStop(1, '#6a5a40');
      g.fillStyle = gr; g.beginPath(); g.moveTo(80, 540); g.lineTo(80, 260); g.quadraticCurveTo(480, -60, 880, 260); g.lineTo(880, 540); g.fill();
      g.fillStyle = '#5a4630'; g.fillRect(80, 450, 800, 90);
      g.fillStyle = '#5a3a1a'; g.fillRect(360, 390, 260, 14); g.fillRect(370, 404, 16, 80); g.fillRect(594, 404, 16, 80);
      for (let i = 0; i < 8; i++) { g.fillStyle = '#e8e0c8'; g.fillRect(380 + i * 22, 378 + (i % 2) * 3, 18, 12); }
      this.glow(g, 590, 350, 200, '#ffc060', 0.55); g.fillStyle = '#8a6a3a'; g.fillRect(580, 356, 18, 34); g.fillStyle = '#ffd060'; g.fillRect(586, 344, 6, 12);
      // map on the wall
      g.fillStyle = '#c8b890'; g.fillRect(170, 200, 160, 110); g.strokeStyle = '#7a5a3a'; g.lineWidth = 2; for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(180, 220 + i * 18); g.bezierCurveTo(220, 200 + i * 22, 260, 240 + i * 10, 320, 214 + i * 18); g.stroke(); } g.fillStyle = '#c02020'; g.beginPath(); g.arc(260, 250, 5, 0, Math.PI * 2); g.fill();
      this.vignette(g, 0.65);
    },
    railway(g, r) {
      this.sky(g, '#05060e', '#2a1a20'); this.stars(g, r, 180);
      this.ridge(g, r, 330, 30, '#141018', 10);
      this.glow(g, 700, 360, 260, '#ff6020', 0.55);
      g.fillStyle = 'rgba(40,20,16,0.7)'; g.beginPath(); g.ellipse(720, 200, 90, 200, 0.1, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#0c0a0c'; g.fillRect(0, 420, this.W, 120);
      g.fillStyle = '#4a4a50'; g.fillRect(0, 430, this.W, 4); g.fillRect(0, 446, this.W, 4); for (let x = 0; x < this.W; x += 26) { g.fillStyle = '#2a1a10'; g.fillRect(x, 428, 10, 26); }
      // blockhouse
      g.fillStyle = '#1a1818'; g.fillRect(120, 300, 110, 120); g.fillRect(130, 280, 90, 20); g.fillStyle = 'rgba(255,200,120,0.6)'; g.fillRect(150, 340, 30, 8);
      for (let i = 0; i < 5; i++) this.person(g, 420 + i * 60, 520, 1.5, '#0a0808', { cap: true, rifle: true, dir: 1 });
      this.vignette(g, 0.6);
    },
    train(g, r) {
      this.sky(g, '#2a3050', '#e09060');
      this.ridge(g, r, 300, 30, '#5a4a50', 12);
      this.ridge(g, r, 360, 20, '#3a3034', 8);
      g.fillStyle = '#1a1414'; g.fillRect(0, 440, this.W, 100);
      // train
      g.fillStyle = '#141010'; for (let i = 0; i < 5; i++) { g.fillRect(40 + i * 180, 370, 170, 70); for (let k = 0; k < 6; k++) { g.fillStyle = 'rgba(255,210,140,0.75)'; g.fillRect(52 + i * 180 + k * 26, 385, 16, 16); g.fillStyle = '#141010'; } g.beginPath(); g.arc(70 + i * 180, 445, 12, 0, Math.PI * 2); g.arc(180 + i * 180, 445, 12, 0, Math.PI * 2); g.fill(); }
      g.fillRect(900, 350, 60, 90); g.fillRect(930, 320, 18, 30);
      for (let i = 0; i < 8; i++) { g.fillStyle = `rgba(60,50,50,${0.5 - i * 0.05})`; g.beginPath(); g.arc(940 - i * 60, 300 - i * 12, 20 + i * 8, 0, Math.PI * 2); g.fill(); }
      this.vignette(g, 0.5);
    },
    train_roof(g, r) {
      this.sky(g, '#05060e', '#1a2040'); this.stars(g, r, 300, 400); this.moon(g, 740, 110, 20);
      this.ridge(g, r, 380, 20, '#0e0e18', 8);
      g.fillStyle = '#1e1a1a'; g.fillRect(0, 440, this.W, 100); g.fillStyle = '#2e2a28'; g.fillRect(0, 436, this.W, 6);
      this.person(g, 400, 440, 1.6, '#08080a', { hair: true, dress: true });
      this.person(g, 470, 440, 1.7, '#08080a', { cap: true });
      this.vignette(g, 0.55);
    },
    shanghai(g, r) {
      this.sky(g, '#0a0a1c', '#3a1a3a'); this.stars(g, r, 60, 200);
      for (let i = 0; i < 26; i++) { const x = i * 38 + r() * 10, h = 120 + r() * 200; this.building(g, x, 400 - h, 36, h + 60, '#12101a', r, r() < 0.5 ? 'rgba(255,220,150,0.7)' : 'rgba(255,240,210,0.4)'); if (r() < 0.2) { g.fillStyle = '#12101a'; g.fillRect(x + 12, 400 - h - 40, 12, 40); g.beginPath(); g.moveTo(x + 8, 400 - h - 40); g.lineTo(x + 18, 400 - h - 70); g.lineTo(x + 28, 400 - h - 40); g.fill(); } }
      // Customs House clock tower
      g.fillStyle = '#16141e'; g.fillRect(560, 140, 60, 280); g.fillRect(570, 100, 40, 40); g.fillStyle = '#e8d8a0'; g.beginPath(); g.arc(590, 170, 14, 0, Math.PI * 2); g.fill();
      // river + neon reflections
      const rv = g.createLinearGradient(0, 420, 0, 540); rv.addColorStop(0, '#1a1a30'); rv.addColorStop(1, '#06060e'); g.fillStyle = rv; g.fillRect(0, 420, this.W, 120);
      for (let i = 0; i < 40; i++) { g.fillStyle = r() < 0.5 ? 'rgba(255,90,140,0.4)' : 'rgba(255,220,140,0.35)'; g.fillRect(r() * this.W, 430 + r() * 100, 20 + r() * 30, 2); }
      for (let i = 0; i < 5; i++) { const x = 60 + r() * 800; g.fillStyle = ['#ff3a6a', '#3affd0', '#ffd03a'][i % 3]; g.fillRect(x, 300, 8, 60); this.glow(g, x + 4, 330, 50, ['#ff3a6a', '#3affd0', '#ffd03a'][i % 3], 0.35); }
      this.vignette(g, 0.55);
    },
    ballroom(g, r) {
      this.room(g, '#2a2020', '#6a1020', r);
      for (let i = 0; i < 6; i++) { g.fillStyle = '#c8a040'; g.fillRect(60 + i * 170, 60, 6, 320); }
      g.fillStyle = '#c8a040'; g.fillRect(0, 60, this.W, 6);
      // chandelier
      for (let i = 0; i < 2; i++) { const x = 300 + i * 360; this.glow(g, x, 120, 160, '#ffe0a0', 0.5); g.fillStyle = '#e8d090'; for (let k = 0; k < 7; k++) g.fillRect(x - 60 + k * 20, 110 + Math.abs(3 - k) * 6, 4, 22); }
      // stage + band silhouettes
      g.fillStyle = '#1a1010'; g.fillRect(620, 300, 340, 80);
      for (let i = 0; i < 4; i++) this.person(g, 660 + i * 70, 300, 1.2, '#0a0606', {});
      for (let i = 0; i < 7; i++) this.person(g, 80 + i * 80, 500, 1.6, '#100808', { dress: i % 2 === 0, hair: i % 2 === 0 });
      this.vignette(g, 0.55);
    },
    no76(g, r) {
      this.sky(g, '#0a0c14', '#2a2c34');
      g.fillStyle = '#1a1c1e'; g.fillRect(180, 160, 600, 280);
      for (let i = 0; i < 10; i++) for (let k = 0; k < 4; k++) { g.fillStyle = r() < 0.3 ? 'rgba(255,220,150,0.6)' : '#0a0a0c'; g.fillRect(210 + i * 56, 190 + k * 60, 26, 36); }
      g.fillStyle = '#101214'; g.fillRect(0, 380, this.W, 160);
      g.fillStyle = '#2a2a2c'; g.fillRect(420, 360, 120, 80); g.fillStyle = '#e8e0c8'; g.font = 'bold 28px serif'; g.fillText('76', 460, 400);
      for (let x = 0; x < this.W; x += 14) { g.fillStyle = '#1e1e20'; g.fillRect(x, 330, 3, 110); }
      g.strokeStyle = '#3a3a3a'; for (let x = 0; x < this.W; x += 14) { g.beginPath(); g.moveTo(x, 330); g.lineTo(x + 7, 322); g.lineTo(x + 14, 330); g.stroke(); }
      this.vignette(g, 0.7);
    },
    nanjing_snow(g, r) {
      this.sky(g, '#2a3040', '#8a90a0');
      this.ridge(g, r, 250, 30, '#4a5060', 10);
      this.wall(g, 320, '#3a3438', r, true);
      g.fillStyle = '#e8ecf4'; g.fillRect(0, 316, this.W, 6);
      for (let i = 0; i < 12; i++) { const x = r() * this.W; this.building(g, x, 410 + r() * 30, 70 + r() * 60, 200, '#262024', r, 'rgba(255,190,110,0.5)', '#1a1618'); g.fillStyle = '#e8ecf4'; g.fillRect(x - 4, 398 + 0, 80, 5); }
      g.fillStyle = '#dde4ee'; g.fillRect(0, 500, this.W, 40);
      this.vignette(g, 0.55);
    },
    home(g, r) {
      this.room(g, '#6a5040', '#3a2a1c', r, { window: 640, winTop: '#2a3040', winBot: '#6a7080' });
      g.fillStyle = '#3a2414'; g.fillRect(120, 410, 220, 12); g.fillRect(130, 422, 14, 90); g.fillRect(316, 422, 14, 90);
      // photos on wall
      for (let i = 0; i < 3; i++) { g.fillStyle = '#2a1a10'; g.fillRect(140 + i * 90, 180, 70, 90); g.fillStyle = '#c8b898'; g.fillRect(146 + i * 90, 186, 58, 78); g.fillStyle = '#6a5a4a'; g.beginPath(); g.arc(175 + i * 90, 215, 12, 0, Math.PI * 2); g.fill(); g.fillRect(163 + i * 90, 228, 24, 30); }
      // camera on table
      g.fillStyle = '#1a1a1a'; g.fillRect(200, 385, 50, 26); g.fillStyle = '#5a5a5a'; g.beginPath(); g.arc(225, 398, 9, 0, Math.PI * 2); g.fill();
      this.glow(g, 300, 380, 150, '#ffc070', 0.35);
      this.sepia(g, 0.3); this.vignette(g, 0.6);
    },
    palace(g, r) {
      this.sky(g, '#1a1a30', '#6a6070');
      g.fillStyle = '#8a8278'; g.fillRect(120, 240, 720, 220);
      this.roof(g, 100, 226, 760, '#2a2020', 30);
      for (let i = 0; i < 9; i++) { g.fillStyle = '#7a1410'; g.fillRect(150 + i * 80, 280, 14, 180); }
      for (let i = 0; i < 8; i++) { g.fillStyle = 'rgba(255,210,140,0.6)'; g.fillRect(172 + i * 80, 310, 40, 60); }
      // flags with yellow pennant (the Reorganized Government)
      for (const fx of [300, 620]) { g.fillStyle = '#3a2a1a'; g.fillRect(fx, 110, 4, 130); g.fillStyle = '#c82020'; g.fillRect(fx + 4, 110, 70, 44); g.fillStyle = '#1a3a9a'; g.fillRect(fx + 4, 110, 35, 22); g.fillStyle = '#f0f0f0'; g.beginPath(); g.arc(fx + 21, 121, 6, 0, Math.PI * 2); g.fill(); g.fillStyle = '#e0c030'; g.beginPath(); g.moveTo(fx + 4, 100); g.lineTo(fx + 60, 92); g.lineTo(fx + 4, 86); g.fill(); }
      g.fillStyle = '#dde2ea'; g.fillRect(0, 460, this.W, 80);
      for (let i = 0; i < 9; i++) this.person(g, 150 + i * 80, 520, 1.3, '#141418', { cap: i % 3 === 0 });
      this.vignette(g, 0.5);
    },
    garden(g, r) {
      this.sky(g, '#2a2e40', '#6a6a7a');
      g.fillStyle = '#6a1a14'; for (let i = 0; i < 6; i++) g.fillRect(80 + i * 170, 120, 16, 340);
      g.fillStyle = '#2a1a18'; g.fillRect(0, 100, this.W, 24); this.roof(g, -10, 90, this.W + 20, '#1e1614', 16);
      // plum blossom tree
      g.strokeStyle = '#2a1a14'; g.lineWidth = 10; g.beginPath(); g.moveTo(560, 500); g.bezierCurveTo(540, 400, 620, 360, 600, 260); g.stroke();
      g.lineWidth = 5; for (let i = 0; i < 7; i++) { g.beginPath(); g.moveTo(590, 280 + i * 30); g.quadraticCurveTo(620 + i * 12, 250 + i * 20, 700 - i * 10, 230 + i * 26); g.stroke(); }
      for (let i = 0; i < 80; i++) { g.fillStyle = r() < 0.5 ? '#e05a78' : '#f090a8'; g.beginPath(); g.arc(560 + r() * 200, 200 + r() * 220, 3 + r() * 3, 0, Math.PI * 2); g.fill(); }
      g.fillStyle = '#dde2ea'; g.fillRect(0, 460, this.W, 80);
      this.vignette(g, 0.55);
    },
    prison(g, r) {
      g.fillStyle = '#0c0b0a'; g.fillRect(0, 0, this.W, this.H);
      const gr = g.createLinearGradient(0, 0, this.W, 0); gr.addColorStop(0, '#1a1816'); gr.addColorStop(0.5, '#3a3632'); gr.addColorStop(1, '#1a1816');
      g.fillStyle = gr; g.fillRect(0, 60, this.W, 400);
      for (let y = 60; y < 460; y += 30) for (let x = (y / 30) % 2 ? 0 : 30; x < this.W; x += 60) { g.strokeStyle = 'rgba(0,0,0,0.4)'; g.strokeRect(x, y, 60, 30); }
      for (let i = 0; i < 14; i++) { g.fillStyle = '#4a4a50'; g.fillRect(240 + i * 36, 100, 8, 360); }
      g.fillStyle = '#4a4a50'; g.fillRect(230, 100, 520, 10); g.fillRect(230, 270, 520, 8);
      this.glow(g, 480, 60, 260, '#c8d0a0', 0.35); g.fillStyle = '#e8f0c0'; g.fillRect(470, 40, 20, 10);
      this.person(g, 480, 440, 1.8, '#050404', { hair: true });
      g.fillStyle = '#1a1614'; g.fillRect(0, 460, this.W, 80);
      this.vignette(g, 0.75);
    },
    river_dawn(g, r) {
      this.sky(g, '#3a4060', '#f0b080');
      this.glow(g, 480, 360, 300, '#ffe0a0', 0.7);
      g.fillStyle = '#f8e8c0'; g.beginPath(); g.arc(480, 360, 40, Math.PI, 0); g.fill();
      this.ridge(g, r, 350, 20, '#5a4a58', 8);
      const rv = g.createLinearGradient(0, 360, 0, 540); rv.addColorStop(0, '#c89070'); rv.addColorStop(1, '#2a2a3a'); g.fillStyle = rv; g.fillRect(0, 360, this.W, 180);
      for (let i = 0; i < 40; i++) { g.fillStyle = 'rgba(255,230,180,0.5)'; g.fillRect(380 + r() * 200, 370 + r() * 160, 30 + r() * 40, 2); }
      // junk boat
      g.fillStyle = '#1a1210'; g.beginPath(); g.moveTo(260, 450); g.lineTo(520, 450); g.lineTo(490, 480); g.lineTo(290, 480); g.fill();
      g.fillRect(380, 300, 5, 150);
      g.fillStyle = '#3a2820'; g.beginPath(); g.moveTo(386, 305); g.lineTo(470, 440); g.lineTo(386, 440); g.fill();
      for (let i = 0; i < 8; i++) { g.fillStyle = '#1a1210'; g.fillRect(386, 318 + i * 15, 72 - i * 7, 2); }
      this.person(g, 320, 450, 1.1, '#0a0808', { hair: true, dress: true });
      this.person(g, 350, 450, 1.2, '#0a0808', {});
      this.vignette(g, 0.4);
    },
    river_night(g, r) {
      this.sky(g, '#05060c', '#1a2030'); this.stars(g, r, 150); this.moon(g, 220, 90, 18);
      this.wall(g, 300, '#141418', r, true);
      g.fillStyle = '#0a0c14'; g.fillRect(0, 380, this.W, 160);
      for (let i = 0; i < 30; i++) { g.fillStyle = 'rgba(200,210,255,0.25)'; g.fillRect(r() * this.W, 390 + r() * 140, 20 + r() * 30, 1); }
      g.fillStyle = '#1a1612'; g.fillRect(0, 380, 400, 20); for (let i = 0; i < 8; i++) g.fillRect(20 + i * 50, 400, 6, 60);
      this.lanterns(g, 3, 340, r);
      this.vignette(g, 0.65);
    },
    memory(g) {
      g.fillStyle = '#1a140e'; g.fillRect(0, 0, this.W, this.H);
      this.glow(g, 480, 270, 500, '#6a5030', 0.5);
      this.vignette(g, 0.8);
    },
    epilogue(g, r) {
      this.sky(g, '#0a0a1c', '#3a2040');
      this.stars(g, r, 120);
      for (let i = 0; i < 6; i++) { const x = 100 + r() * 760, y = 80 + r() * 160, c = U.pick(['#ff5040', '#ffd050', '#60c0ff', '#ff80c0']); for (let k = 0; k < 24; k++) { const a = (k / 24) * Math.PI * 2; g.strokeStyle = c; g.lineWidth = 2; g.beginPath(); g.moveTo(x + Math.cos(a) * 10, y + Math.sin(a) * 10); g.lineTo(x + Math.cos(a) * 50, y + Math.sin(a) * 50); g.stroke(); } this.glow(g, x, y, 70, c, 0.3); }
      for (let i = 0; i < 22; i++) { const x = r() * this.W; this.building(g, x, 360 + r() * 60, 60 + r() * 50, 200, '#120e14', r, 'rgba(255,200,120,0.7)', '#0a080a'); }
      for (let i = 0; i < 26; i++) this.person(g, r() * this.W, 540, 1.2 + r() * 0.6, '#050405', { hair: r() < 0.5, dress: r() < 0.4 });
      this.lanterns(g, 8, 330, r);
      this.vignette(g, 0.5);
    },
    city_1945(g, r) { this.scenes.epilogue.call(this, g, r); },
  },

  // animated overlay for cutscenes
  overlay(ctx, id, t, x0, y0, w, h) {
    const wt = this.weatherOf(id);
    if (!wt) return;
    const sc = w / this.W;
    const r = U.srand(42);
    if (wt === 'snow') {
      ctx.fillStyle = 'rgba(245,248,255,0.8)';
      for (let i = 0; i < 160; i++) { const sp = 20 + r() * 40; const x = (r() * this.W + Math.sin(t + i) * 20 - t * 10) % this.W; const y = (r() * this.H + t * sp) % this.H; const s = r() < 0.2 ? 3 : 2; ctx.fillRect(x0 + ((x + this.W) % this.W) * sc, y0 + y * sc, s * sc, s * sc); }
    } else if (wt === 'rain') {
      ctx.strokeStyle = 'rgba(180,200,230,0.35)'; ctx.lineWidth = 1.5 * sc;
      for (let i = 0; i < 180; i++) { const x = (r() * this.W - t * 120 + this.W * 4) % this.W; const y = (r() * this.H + t * (500 + r() * 200)) % this.H; ctx.beginPath(); ctx.moveTo(x0 + x * sc, y0 + y * sc); ctx.lineTo(x0 + (x - 3) * sc, y0 + (y + 14) * sc); ctx.stroke(); }
    } else if (wt === 'embers') {
      for (let i = 0; i < 90; i++) { const x = (r() * this.W + Math.sin(t * 2 + i) * 20); const y = (this.H - ((r() * this.H + t * (30 + r() * 40)) % this.H)); ctx.fillStyle = `rgba(255,${140 + r() * 90},60,${0.5 + r() * 0.5})`; ctx.fillRect(x0 + x * sc, y0 + y * sc, 2 * sc, 2 * sc); }
    } else if (wt === 'fireworks') {
      for (let i = 0; i < 4; i++) { const ph = (t * 0.5 + i * 0.27) % 1; const x = 150 + ((i * 263) % 660), y = 90 + ((i * 97) % 150); const c = ['255,80,64', '255,208,80', '96,192,255', '255,128,192'][i]; for (let k = 0; k < 20; k++) { const a = (k / 20) * Math.PI * 2; ctx.fillStyle = `rgba(${c},${1 - ph})`; ctx.fillRect(x0 + (x + Math.cos(a) * ph * 80) * sc, y0 + (y + Math.sin(a) * ph * 80 + ph * ph * 30) * sc, 3 * sc, 3 * sc); } }
    }
  },
};
