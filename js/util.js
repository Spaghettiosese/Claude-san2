'use strict';
// ---------------------------------------------------------------------------
// Core constants, math helpers, input and persistence.
// ---------------------------------------------------------------------------
const TILE = 16;          // world tile size (pixels)
const VW = 480, VH = 270; // pixel-art world viewport
const UIW = 1920, UIH = 1080; // high resolution UI canvas (portraits, text)
const SC = UIW / VW;      // 4x

const U = {
  clamp: (v, a, b) => (v < a ? a : v > b ? b : v),
  lerp: (a, b, t) => a + (b - a) * t,
  rand: (a, b) => a + Math.random() * (b - a),
  randi: (a, b) => Math.floor(a + Math.random() * (b - a + 1)),
  pick: (arr) => arr[Math.floor(Math.random() * arr.length)],
  dist: (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1),
  sign: (v) => (v < 0 ? -1 : v > 0 ? 1 : 0),
  approach(v, t, d) { return v < t ? Math.min(v + d, t) : Math.max(v - d, t); },
  // xorshift seeded random
  srand(seed) {
    let s = (seed >>> 0) || 1;
    return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  },
  hex(hex) {
    const h = hex.replace('#', '');
    const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  },
  rgb(r, g, b, a) {
    r = U.clamp(Math.round(r), 0, 255); g = U.clamp(Math.round(g), 0, 255); b = U.clamp(Math.round(b), 0, 255);
    return a === undefined ? `rgb(${r},${g},${b})` : `rgba(${r},${g},${b},${a})`;
  },
  // lighten (amt>0) or darken (amt<0) a hex color, returns css string
  shade(hex, amt, a) {
    const [r, g, b] = U.hex(hex);
    if (amt >= 0) return U.rgb(r + (255 - r) * amt, g + (255 - g) * amt, b + (255 - b) * amt, a);
    return U.rgb(r * (1 + amt), g * (1 + amt), b * (1 + amt), a);
  },
  mix(h1, h2, t, a) {
    const A = U.hex(h1), B = U.hex(h2);
    return U.rgb(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t, a);
  },
  alpha(hex, a) { const [r, g, b] = U.hex(hex); return `rgba(${r},${g},${b},${a})`; },
  canvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  },
  // wrap text to lines for a given ctx/maxWidth
  wrap(ctx, text, maxW) {
    const out = [];
    for (const para of String(text).split('\n')) {
      const words = para.split(' ');
      let line = '';
      for (const w of words) {
        const test = line ? line + ' ' + w : w;
        if (ctx.measureText(test).width > maxW && line) { out.push(line); line = w; } else line = test;
      }
      out.push(line);
    }
    return out;
  },
  fmtTime(s) {
    s = Math.floor(s);
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  },
};

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------
const Input = {
  down: new Set(),
  pressed: new Set(),
  mouse: { x: 0, y: 0, click: false, moved: false },
  binds: {
    left: ['KeyA', 'ArrowLeft'],
    right: ['KeyD', 'ArrowRight'],
    up: ['KeyW', 'ArrowUp'],
    down: ['KeyS', 'ArrowDown'],
    jump: ['Space'],
    run: ['ShiftLeft', 'ShiftRight'],
    crouch: ['KeyC', 'ControlLeft'],
    prone: ['KeyZ'],
    interact: ['KeyE'],
    kill: ['KeyF'],
    choke: ['KeyV'],
    throw: ['KeyQ'],
    firecracker: ['KeyT'],
    weapon: ['KeyG'],
    order: ['KeyR'],
    journal: ['Tab', 'KeyJ'],
    pause: ['Escape', 'KeyP'],
    confirm: ['Enter', 'Space', 'KeyE'],
    breath: ['Space'],
    c1: ['Digit1', 'Numpad1'], c2: ['Digit2', 'Numpad2'], c3: ['Digit3', 'Numpad3'], c4: ['Digit4', 'Numpad4'],
  },
  init(canvas) {
    const block = ['Tab', 'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ControlLeft'];
    addEventListener('keydown', (e) => {
      if (block.includes(e.code)) e.preventDefault();
      if (!this.down.has(e.code)) this.pressed.add(e.code);
      this.down.add(e.code);
      this.lastKey = e.key;
      if (typeof Sfx !== 'undefined') Sfx.unlock();
    });
    addEventListener('keyup', (e) => { this.down.delete(e.code); });
    addEventListener('blur', () => { this.down.clear(); });
    const pos = (e) => {
      const r = canvas.getBoundingClientRect();
      this.mouse.x = ((e.clientX - r.left) / r.width) * UIW;
      this.mouse.y = ((e.clientY - r.top) / r.height) * UIH;
    };
    canvas.addEventListener('mousemove', (e) => { pos(e); this.mouse.moved = true; });
    canvas.addEventListener('mousedown', (e) => {
      pos(e); this.mouse.click = true;
      if (typeof Sfx !== 'undefined') Sfx.unlock();
    });
    canvas.addEventListener('touchstart', (e) => {
      const t = e.touches[0]; pos(t); this.mouse.click = true;
      if (typeof Sfx !== 'undefined') Sfx.unlock();
    }, { passive: true });
  },
  is(a) { return this.binds[a].some((k) => this.down.has(k)); },
  hit(a) { return this.binds[a].some((k) => this.pressed.has(k)); },
  anyKey() { return this.pressed.size > 0 || this.mouse.click; },
  digit() {
    for (const k of this.pressed) {
      const m = /^(Digit|Numpad)(\d)$/.exec(k);
      if (m) return m[2];
    }
    return null;
  },
  consume() { this.pressed.clear(); this.mouse.click = false; },
  eat(a) { for (const k of this.binds[a]) this.pressed.delete(k); },
  end() { this.pressed.clear(); this.mouse.click = false; this.mouse.moved = false; },
};

// ---------------------------------------------------------------------------
// Persistence (localStorage, failure tolerant)
// ---------------------------------------------------------------------------
const Store = {
  key: 'jade_lantern_save_v1',
  load() {
    try { const s = localStorage.getItem(this.key); return s ? JSON.parse(s) : null; } catch (e) { return null; }
  },
  save(data) {
    try { localStorage.setItem(this.key, JSON.stringify(data)); return true; } catch (e) { return false; }
  },
  wipe() { try { localStorage.removeItem(this.key); } catch (e) { /* ignore */ } },
};
