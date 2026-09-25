'use strict';
// ---------------------------------------------------------------------------
// Level: ASCII map parsing, tiles, collision, lighting, line-of-sight, noise,
// and the pre-rendered pixel-art tile layer + parallax backdrops.
// ---------------------------------------------------------------------------
const T = { EMPTY: 0, SOLID: 1, ONEWAY: 2, LOW: 3, LADDER: 4, WATER: 5, HAZARD: 6, GRASS: 7 };
const SOLID_CHARS = '#Bmgrcv';
const TILE_TYPE = (ch) => {
  if (SOLID_CHARS.includes(ch)) return T.SOLID;
  if (ch === '=' || ch === '-') return T.ONEWAY;
  if (ch === '^') return T.LOW;
  if (ch === 'H') return T.LADDER;
  if (ch === '~') return T.WATER;
  if (ch === 'x') return T.HAZARD;
  if (ch === '"') return T.GRASS;
  return T.EMPTY;
};
// characters that are real tiles (kept in the tile grid)
const TILE_CHARS = '#Bmgrcv=-^H~x"';
// background characters
const BG_CHARS = { ' ': 0, ',': 1, 'o': 2, ';': 3 };

const Themes = {
  nanjing: { ground: '#4a4a52', groundTop: '#6a6a72', brick: '#5a4e4e', wall: '#3a3438', interior: '#4a3a2c', interiorB: '#3a2c20', wood: '#6a4a2a', trim: '#2a1e16', sky: ['#1a1830', '#3a3050'], amb: 0.35, fogCol: '#a09080', sepia: 0.35 },
  chongqing: { ground: '#5a5048', groundTop: '#7a6e60', brick: '#6a5a4a', wall: '#4a4038', interior: '#6a5a48', interiorB: '#54463a', wood: '#7a5634', trim: '#3a2616', sky: ['#6a6a70', '#b0a898'], amb: 0.7, fogCol: '#c8c0b0' },
  office: { ground: '#4a4a48', groundTop: '#5a5a58', brick: '#6a6a64', wall: '#50504c', interior: '#8a8878', interiorB: '#6a6a5c', wood: '#6a4a30', trim: '#3a2a1a', sky: ['#3a3a44', '#6a6a70'], amb: 0.45, fogCol: '#b0b0b0' },
  mansion: { ground: '#5a5a50', groundTop: '#4a6a3a', brick: '#d8d0c0', wall: '#b8b0a0', interior: '#d8ccb0', interiorB: '#b8a888', wood: '#5a3018', trim: '#3a1a0a', carpet: '#8a1a1a', sky: ['#1a2040', '#4a4060'], amb: 0.4, fogCol: '#8090a0' },
  loess: { ground: '#9a7a4a', groundTop: '#b8965a', brick: '#8a6a40', wall: '#7a5e38', interior: '#a88a5a', interiorB: '#8a6e44', wood: '#6a4a2a', trim: '#3a2a16', sky: ['#0a0e20', '#2a2440'], amb: 0.22, fogCol: '#5a5068' },
  yanan: { ground: '#a8865a', groundTop: '#c4a06a', brick: '#9a7a4a', wall: '#8a6a40', interior: '#c8b08a', interiorB: '#a89068', wood: '#6a4a2a', trim: '#4a3218', sky: ['#101830', '#3a3050'], amb: 0.3, fogCol: '#6a6078' },
  railway: { ground: '#4a4438', groundTop: '#6a6048', brick: '#6a6a60', wall: '#5a5a52', interior: '#5a5a50', interiorB: '#44443c', wood: '#5a4028', trim: '#2a2218', sky: ['#080a18', '#1a1a30'], amb: 0.2, fogCol: '#3a3a50' },
  train: { ground: '#3a3a3e', groundTop: '#5a5a60', brick: '#4a3020', wall: '#3a2a1a', interior: '#7a5a3a', interiorB: '#5a4028', wood: '#6a4424', trim: '#2a1a0e', seat: '#3a5a4a', sky: ['#1a2a4a', '#6a7aa0'], amb: 0.55, fogCol: '#8090b0' },
  shanghai: { ground: '#2a2a30', groundTop: '#3a3a44', brick: '#1a1a1e', wall: '#141418', interior: '#2a2420', interiorB: '#1a1614', wood: '#3a2a1a', trim: '#c8a040', carpet: '#5a1020', sky: ['#0a0a1a', '#2a1a3a'], amb: 0.4, fogCol: '#4a3a5a' },
  no76: { ground: '#3a3c38', groundTop: '#4a4c48', brick: '#4a4a44', wall: '#3a3a36', interior: '#4a5a4a', interiorB: '#3a463a', wood: '#4a3a28', trim: '#2a2a22', sky: ['#0a0c14', '#1a1c28'], amb: 0.3, fogCol: '#3a4040' },
  snow: { ground: '#5a5a62', groundTop: '#e8ecf4', brick: '#5a5058', wall: '#3a3440', interior: '#5a4a3a', interiorB: '#44382c', wood: '#5a3e24', trim: '#2a1e16', sky: ['#1a2030', '#4a5060'], amb: 0.35, fogCol: '#a0a8b8', snow: true },
  palace: { ground: '#6a6460', groundTop: '#8a8480', brick: '#c8c0b0', wall: '#a89e90', interior: '#c8b898', interiorB: '#a89878', wood: '#6a1a14', trim: '#3a0a08', carpet: '#8a1a1a', pillar: '#9a1a14', sky: ['#1a1a30', '#4a4050'], amb: 0.45, fogCol: '#9090a0', snow: true },
  prison: { ground: '#34302c', groundTop: '#44403a', brick: '#3a3632', wall: '#2a2824', interior: '#3a3834', interiorB: '#2a2824', wood: '#3a2a1a', trim: '#1a1612', sky: ['#05060a', '#101218'], amb: 0.18, fogCol: '#2a2a30' },
  docks: { ground: '#4a4038', groundTop: '#6a5a44', brick: '#5a5048', wall: '#3a342e', interior: '#5a4a38', interiorB: '#44382a', wood: '#6a4c2c', trim: '#2a1e12', sky: ['#1a1a2a', '#6a5a6a'], amb: 0.3, fogCol: '#8a8090', snow: true },
};

class Level {
  constructor(def) {
    this.def = def;
    this.theme = Themes[def.theme] || Themes.chongqing;
    const rows = def.map.map((r) => r.replace(/\s+$/, ''));
    // pad with earth below so the camera can frame the ground level comfortably
    const last = rows[rows.length - 1] || '';
    for (let i = 0; i < 5; i++) rows.push(last.split('').map((ch) => (SOLID_CHARS.includes(ch) ? '#' : ch === '~' ? '~' : ' ')).join(''));
    this.h = rows.length;
    this.w = Math.max(...rows.map((r) => r.length));
    this.pw = this.w * TILE; this.ph = this.h * TILE;
    this.tiles = []; this.types = []; this.bg = [];
    this.marks = [];
    for (let r = 0; r < this.h; r++) {
      const row = rows[r].padEnd(this.w, ' ');
      this.tiles.push([]); this.types.push([]); this.bg.push([]);
      let lastBg = 0;
      for (let c = 0; c < this.w; c++) {
        const ch = row[c];
        if (ch in BG_CHARS) lastBg = BG_CHARS[ch];
        let bgv = lastBg;
        if (ch === 'o') { bgv = 2; lastBg = 1; }
        if (TILE_CHARS.includes(ch)) {
          this.tiles[r].push(ch); this.types[r].push(TILE_TYPE(ch));
        } else {
          this.tiles[r].push(' '); this.types[r].push(T.EMPTY);
          if (!(ch in BG_CHARS)) this.marks.push({ ch, c, r });
        }
        this.bg[r].push(bgv === 2 ? 2 : bgv);
      }
    }
    // background of solid tiles (for rendering doorways etc.)
    this.dyn = new Map(); // dynamic solid tiles (closed doors)
    this.lights = [];
    this.noises = [];
    this.amb = def.amb !== undefined ? def.amb : this.theme.amb;
    this.alarm = false;
    this.renderStatic();
    this.backdrop = Backdrop.build(def.backdrop || def.theme, this);
  }

  inb(c, r) { return c >= 0 && r >= 0 && c < this.w && r < this.h; }
  type(c, r) {
    if (c < 0 || c >= this.w) return T.SOLID;
    if (r < 0) return T.EMPTY;
    if (r >= this.h) return T.EMPTY;
    if (this.dyn.has(r * 10000 + c)) return T.SOLID;
    return this.types[r][c];
  }
  typeAt(px, py) { return this.type(Math.floor(px / TILE), Math.floor(py / TILE)); }
  ch(c, r) { return this.inb(c, r) ? this.tiles[r][c] : '#'; }
  chAt(px, py) { return this.ch(Math.floor(px / TILE), Math.floor(py / TILE)); }
  isInterior(px, py) {
    const c = Math.floor(px / TILE), r = Math.floor(py / TILE);
    return this.inb(c, r) && this.bg[r][c] >= 1;
  }
  setDyn(c, r, on) { const k = r * 10000 + c; if (on) this.dyn.set(k, true); else this.dyn.delete(k); }

  // Box collision: does box overlap blocking tiles? tall = height>10 (for LOW tiles)
  blocked(x1, y1, x2, y2, tall) {
    const c1 = Math.floor(x1 / TILE), c2 = Math.floor((x2 - 0.01) / TILE);
    const r1 = Math.floor(y1 / TILE), r2 = Math.floor((y2 - 0.01) / TILE);
    for (let r = r1; r <= r2; r++) {
      for (let c = c1; c <= c2; c++) {
        const t = this.type(c, r);
        if (t === T.SOLID) return true;
        if (t === T.LOW && tall) {
          // wire occupies upper 10px of the tile
          const top = r * TILE, bot = top + 8;
          if (y1 < bot && y2 > top) return true;
        }
      }
    }
    return false;
  }

  // line of sight between two points; returns true if clear
  los(x1, y1, x2, y2) {
    const d = Math.hypot(x2 - x1, y2 - y1);
    const n = Math.ceil(d / 4);
    for (let i = 1; i < n; i++) {
      const t = i / n;
      const x = x1 + (x2 - x1) * t, y = y1 + (y2 - y1) * t;
      const ty = this.typeAt(x, y);
      if (ty === T.SOLID) return false;
    }
    return true;
  }
  wallsBetween(x1, y1, x2, y2) {
    const d = Math.hypot(x2 - x1, y2 - y1);
    const n = Math.ceil(d / 8); let k = 0, prev = false;
    for (let i = 1; i < n; i++) {
      const t = i / n;
      const s = this.typeAt(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t) === T.SOLID;
      if (s && !prev) k++;
      prev = s;
    }
    return k;
  }

  lightAt(x, y) {
    let l = this.amb * (this.isInterior(x, y) ? 0.8 : 1);
    for (const L of this.lights) {
      if (!L.on) continue;
      const d = Math.hypot(x - L.x, y - L.y);
      if (d < L.r) l += (1 - d / L.r) * L.i * 1.25;
    }
    if (this.flash > 0) l += this.flash;
    return U.clamp(l, 0, 1.3);
  }

  noise(x, y, r, src = 'player', kind = 'noise') {
    this.noises.push({ x, y, r, src, kind, t: 0 });
    if (Game && Game.fx) Game.fx.ring(x, y, r, kind);
  }

  groundBelow(x, y, max = 400) {
    for (let yy = y; yy < y + max; yy += 4) {
      const t = this.typeAt(x, yy);
      if (t === T.SOLID || t === T.ONEWAY) return Math.floor(yy / TILE) * TILE;
    }
    return null;
  }

  // ------------------------------------------------------------------
  // Static tile rendering (pixel art, pre-baked into one canvas)
  // ------------------------------------------------------------------
  renderStatic() {
    const th = this.theme;
    this.canvas = U.canvas(this.pw, this.ph);
    const g = this.canvas.getContext('2d');
    const rng = U.srand(this.def.seed || 1234);
    const R = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
    // --- background walls (interior) ---
    for (let r = 0; r < this.h; r++) {
      for (let c = 0; c < this.w; c++) {
        const b = this.bg[r][c];
        if (b === 0) continue;
        const x = c * TILE, y = r * TILE;
        this.drawInterior(g, R, x, y, c, r, b, rng);
      }
    }
    // --- tiles ---
    for (let r = 0; r < this.h; r++) {
      for (let c = 0; c < this.w; c++) {
        const ch = this.tiles[r][c];
        if (ch === ' ') continue;
        this.drawTile(g, R, ch, c * TILE, r * TILE, c, r, rng);
      }
    }
  }

  drawInterior(g, R, x, y, c, r, b, rng) {
    const th = this.theme, tn = this.def.theme;
    const above = r > 0 ? this.bg[r - 1][c] : 0;
    const belowSolid = this.type(c, r + 1) === T.SOLID || this.type(c, r + 1) === T.ONEWAY;
    let base = th.interior, dark = th.interiorB;
    R(x, y, TILE, TILE, base);
    if (tn === 'chongqing' || tn === 'nanjing' || tn === 'docks' || tn === 'snow') {
      // wooden plank walls
      for (let i = 0; i < 4; i++) R(x + i * 4, y, 1, TILE, U.shade(base, -0.18));
      if (rng() < 0.2) R(x + 2, y + (rng() * 12) | 0, 2, 2, U.shade(base, -0.3));
    } else if (tn === 'yanan' || tn === 'loess') {
      // whitewashed cave: arched feel via vertical gradient
      R(x, y, TILE, TILE, U.shade(base, (r % 3) * -0.04));
      if (rng() < 0.3) R(x + (rng() * 14) | 0, y + (rng() * 14) | 0, 2, 1, U.shade(base, -0.12));
    } else if (tn === 'mansion' || tn === 'palace') {
      // wallpaper stripes
      R(x + 3, y, 2, TILE, U.shade(base, -0.06)); R(x + 11, y, 2, TILE, U.shade(base, -0.06));
      if (tn === 'palace' && c % 8 === 0) { R(x + 4, y, 8, TILE, th.pillar); R(x + 5, y, 2, TILE, U.shade(th.pillar, 0.2)); }
    } else if (tn === 'shanghai') {
      // art-deco panels, gold trim
      R(x, y, TILE, TILE, (c + r) % 2 ? base : U.shade(base, 0.05));
      if (c % 4 === 0) R(x, y, 1, TILE, U.shade(th.trim, -0.2));
      if (r % 4 === 1) R(x, y + 2, TILE, 1, U.shade(th.trim, -0.3));
    } else if (tn === 'train') {
      R(x, y, TILE, TILE, base); R(x, y + 8, TILE, 1, U.shade(base, -0.25));
      if (c % 3 === 0) R(x + 7, y, 1, TILE, U.shade(base, -0.2));
    } else if (tn === 'prison' || tn === 'no76' || tn === 'railway') {
      // stone blocks / concrete
      const off = (r % 2) * 8;
      R(x, y + 7, TILE, 1, U.shade(base, -0.2)); R(x + ((off + 0) % 16), y, 1, 7, U.shade(base, -0.2)); R(x + ((off + 8) % 16), y + 8, 1, 8, U.shade(base, -0.2));
      if (rng() < 0.15) R(x + (rng() * 12) | 0, y + (rng() * 12) | 0, 3, 2, U.shade(base, -0.28));
    } else {
      // office: plaster, subtle
      if (rng() < 0.2) R(x + (rng() * 14) | 0, y + (rng() * 14) | 0, 1, 1, U.shade(base, -0.1));
    }
    // wainscot near floor
    if (belowSolid) {
      R(x, y + 8, TILE, 8, dark);
      R(x, y + 8, TILE, 1, U.shade(th.trim, 0.1));
      if (th.carpet) R(x, y + 15, TILE, 1, U.shade(th.carpet, -0.2));
    }
    // ceiling shadow
    if (this.type(c, r - 1) === T.SOLID) R(x, y, TILE, 3, 'rgba(0,0,0,0.25)');
    // windows
    if (b === 2) {
      R(x + 2, y + 1, 12, 14, th.trim);
      const wg = g.createLinearGradient(0, y, 0, y + 14);
      wg.addColorStop(0, th.sky[0]); wg.addColorStop(1, th.sky[1]);
      g.fillStyle = wg; g.fillRect(x + 3, y + 2, 10, 12);
      R(x + 7, y + 2, 2, 12, th.trim); R(x + 3, y + 7, 10, 1, th.trim);
      R(x + 4, y + 3, 2, 2, 'rgba(255,255,230,0.35)');
      if (th.snow) { R(x + 3, y + 12, 10, 2, '#e8ecf4'); }
    }
    if (b === 3) R(x, y, TILE, TILE, 'rgba(0,0,0,0.45)');
  }

  drawTile(g, R, ch, x, y, c, r, rng) {
    const th = this.theme;
    const upOpen = (() => { const t = this.type(c, r - 1); return t !== T.SOLID; })();
    const sh = (col, a) => U.shade(col, a);
    switch (ch) {
      case '#': case 'g': case 'm': case 'r': {
        let base = ch === 'm' ? th.wood : ch === 'r' ? (th.carpet || '#6a1a1a') : th.ground;
        if (ch === 'g') base = U.mix(th.ground, '#8a8070', 0.4);
        R(x, y, TILE, TILE, base);
        // texture
        if (ch === '#') {
          for (let i = 0; i < 5; i++) R(x + ((rng() * 15) | 0), y + ((rng() * 15) | 0), 2, 1, sh(base, rng() < 0.5 ? -0.15 : 0.08));
          if (r % 2 === 0) R(x, y + 15, TILE, 1, sh(base, -0.12));
        } else if (ch === 'g') {
          for (let i = 0; i < 12; i++) R(x + ((rng() * 15) | 0), y + ((rng() * 15) | 0), 1, 1, sh(base, rng() * 0.4 - 0.2));
        } else if (ch === 'm') {
          for (let i = 0; i < 4; i++) R(x, y + i * 4 + 3, TILE, 1, sh(base, -0.25));
          R(x + (c % 2) * 8, y, 1, TILE, sh(base, -0.3));
          if (rng() < 0.3) R(x + ((rng() * 12) | 0), y + ((rng() * 12) | 0), 2, 1, sh(base, -0.35));
        } else if (ch === 'r') {
          R(x, y, TILE, 2, sh(base, 0.12)); R(x, y + 3, TILE, 1, sh(th.trim || '#c8a040', 0.2));
        }
        if (upOpen) {
          const topc = ch === 'r' ? sh(base, 0.2) : ch === 'm' ? sh(base, 0.2) : th.groundTop;
          R(x, y, TILE, 3, topc);
          R(x, y + 3, TILE, 1, sh(topc, -0.25));
          if (th.snow && ch !== 'r' && !this.isInterior(x + 8, y - 8)) { R(x, y - 1, TILE, 3, '#eef2fa'); R(x + ((rng() * 12) | 0), y + 2, 3, 2, '#dfe6f2'); }
          else if (this.def.theme === 'chongqing' || this.def.theme === 'mansion') {
            if (!this.isInterior(x + 8, y - 8) && rng() < 0.6) R(x + ((rng() * 14) | 0), y - 2, 1, 2, '#4a6a3a');
          }
          if (this.def.theme === 'railway' && !this.isInterior(x + 8, y - 8)) {
            R(x, y - 1, TILE, 1, '#8a8a90'); R(x + 3, y + 1, 4, 2, '#4a3020');
          }
        }
        break;
      }
      case 'B': {
        const base = th.brick;
        R(x, y, TILE, TILE, base);
        for (let i = 0; i < 4; i++) {
          R(x, y + i * 4 + 3, TILE, 1, sh(base, -0.25));
          const off = (i + r) % 2 ? 0 : 6;
          R(x + off, y + i * 4, 1, 3, sh(base, -0.25)); R(x + off + 8, y + i * 4, 1, 3, sh(base, -0.25));
        }
        for (let i = 0; i < 3; i++) R(x + ((rng() * 14) | 0), y + ((rng() * 14) | 0), 2, 1, sh(base, 0.1));
        if (upOpen) { R(x, y, TILE, 2, sh(base, 0.2)); if (th.snow && !this.isInterior(x + 8, y - 8)) R(x, y - 1, TILE, 3, '#eef2fa'); }
        break;
      }
      case 'c': { // crate
        const w = th.wood;
        R(x + 1, y + 1, 14, 15, w);
        R(x + 1, y + 1, 14, 2, sh(w, 0.2)); R(x + 1, y + 14, 14, 2, sh(w, -0.3));
        R(x + 1, y + 1, 2, 15, sh(w, -0.15)); R(x + 13, y + 1, 2, 15, sh(w, -0.25));
        for (let i = 0; i < 12; i++) R(x + 2 + i, y + 2 + i, 1, 1, sh(w, -0.35));
        R(x, y, TILE, 1, 'rgba(0,0,0,0.3)');
        if (th.snow && upOpen && !this.isInterior(x + 8, y)) R(x + 1, y, 14, 2, '#eef2fa');
        break;
      }
      case 'v': { // sandbags
        const s = '#8a7a5a';
        for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) {
          const bx = x + j * 8 - (i % 2) * 4, by = y + i * 5 + 1;
          R(bx + 1, by, 8, 5, s); R(bx + 1, by, 8, 1, sh(s, 0.2)); R(bx + 1, by + 4, 8, 1, sh(s, -0.3));
        }
        if (th.snow && upOpen) R(x, y, TILE, 2, '#eef2fa');
        break;
      }
      case '=': case '-': {
        const w = th.wood;
        R(x, y, TILE, 4, w); R(x, y, TILE, 1, sh(w, 0.25)); R(x, y + 3, TILE, 1, sh(w, -0.35));
        if (ch === '-') { R(x + 5, y + 1, 1, 2, sh(w, -0.4)); R(x + 11, y + 1, 1, 2, sh(w, -0.4)); }
        if (c % 3 === 0) { R(x + 2, y + 4, 2, 5, sh(w, -0.3)); }
        break;
      }
      case '^': { // barbed wire
        R(x, y + 3, TILE, 1, '#6a6a6a');
        R(x, y + 7, TILE, 1, '#5a5a5a');
        for (let i = 0; i < 4; i++) { R(x + i * 4 + 1, y + 2, 1, 3, '#9a9a9a'); R(x + i * 4 + 3, y + 6, 1, 3, '#8a8a8a'); }
        R(x + 7, y + 1, 2, 11, '#4a3a2a');
        break;
      }
      case 'H': { // ladder
        const w = th.wood;
        R(x + 3, y, 2, TILE, w); R(x + 11, y, 2, TILE, w);
        R(x + 3, y, 1, TILE, sh(w, 0.2));
        for (let i = 0; i < 4; i++) R(x + 3, y + i * 4 + 2, 10, 1, sh(w, 0.1));
        break;
      }
      case '~': { // shallow water
        R(x, y + 4, TILE, 12, 'rgba(40,70,90,0.7)');
        R(x, y + 4, TILE, 1, 'rgba(160,200,220,0.6)');
        break;
      }
      case 'x': { // fire/hazard
        R(x, y + 8, TILE, 8, '#3a1a0a');
        for (let i = 0; i < 4; i++) { R(x + i * 4, y + 4 + (i % 2) * 3, 3, 8, '#e06020'); R(x + i * 4 + 1, y + 8 + (i % 2) * 2, 1, 4, '#ffd060'); }
        break;
      }
      case '"': { // tall grass / reeds
        for (let i = 0; i < 8; i++) {
          const gx = x + i * 2, hgt = 8 + ((rng() * 7) | 0);
          R(gx, y + 16 - hgt, 1, hgt, this.theme.snow ? '#8a8a70' : (this.def.theme === 'loess' ? '#7a6a3a' : '#3a5a2a'));
          R(gx, y + 16 - hgt, 1, 2, this.theme.snow ? '#c0c0a8' : '#6a8a3a');
        }
        break;
      }
      default: break;
    }
  }
}

// ---------------------------------------------------------------------------
// Backdrops: parallax layers for outdoor areas, painted procedurally.
// ---------------------------------------------------------------------------
const Backdrop = {
  build(kind, level) {
    const th = level.theme;
    const layers = [];
    const sky = U.canvas(VW, VH);
    const g = sky.getContext('2d');
    const sg = g.createLinearGradient(0, 0, 0, VH);
    sg.addColorStop(0, th.sky[0]); sg.addColorStop(1, th.sky[1]);
    g.fillStyle = sg; g.fillRect(0, 0, VW, VH);
    const rng = U.srand(kind.length * 131 + 7);
    const night = th.amb < 0.5;
    if (night) {
      for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(255,255,240,${rng() * 0.7})`; g.fillRect((rng() * VW) | 0, (rng() * VH * 0.6) | 0, 1, 1); }
      // moon
      if (kind !== 'prison') {
        g.fillStyle = 'rgba(255,250,220,0.08)'; g.beginPath(); g.arc(380, 50, 28, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#f4ecd0'; g.beginPath(); g.arc(380, 50, 11, 0, Math.PI * 2); g.fill();
        g.fillStyle = 'rgba(200,190,160,0.5)'; g.fillRect(376, 46, 3, 2); g.fillRect(383, 53, 2, 2);
      }
    } else {
      g.fillStyle = 'rgba(255,250,230,0.25)'; g.beginPath(); g.arc(120, 60, 40, 0, Math.PI * 2); g.fill();
    }
    layers.push({ c: sky, f: 0 });
    const W = Math.ceil(VW + level.pw * 0.35) + 20;
    const mk = (f, draw) => { const c = U.canvas(Math.ceil(VW + level.pw * f) + 20, VH); draw(c.getContext('2d'), c.width, U.srand(kind.length * 17 + f * 1000)); layers.push({ c, f }); };
    const ridge = (g2, w, base, amp, col, rough, r) => {
      g2.fillStyle = col; g2.beginPath(); g2.moveTo(0, VH);
      let y = base;
      for (let x = 0; x <= w; x += 4) {
        y += (r() - 0.5) * rough; y = U.clamp(y, base - amp, base + amp);
        g2.lineTo(x, (y | 0));
      }
      g2.lineTo(w, VH); g2.closePath(); g2.fill();
    };
    const T2 = th;
    const far = U.mix(th.sky[1], '#000000', 0.25), mid = U.mix(th.sky[1], '#000000', 0.5), near = U.mix(th.sky[1], '#000000', 0.7);
    switch (kind) {
      case 'chongqing':
        mk(0.08, (g2, w, r) => ridge(g2, w, 110, 40, far, 14, r));
        mk(0.18, (g2, w, r) => {
          ridge(g2, w, 150, 30, mid, 10, r);
          // stilt houses (diaojiaolou) on the hills
          for (let x = 0; x < w; x += 20 + r() * 30) {
            const hy = 130 + r() * 30, hw = 14 + r() * 16, hh = 10 + r() * 12;
            g2.fillStyle = U.mix(th.sky[1], '#201810', 0.55); g2.fillRect(x, hy, hw, hh);
            g2.fillStyle = U.mix(th.sky[1], '#100804', 0.6); g2.beginPath(); g2.moveTo(x - 3, hy); g2.lineTo(x + hw / 2, hy - 6); g2.lineTo(x + hw + 3, hy); g2.fill();
            for (let k = 0; k < 3; k++) g2.fillRect(x + k * hw / 2, hy + hh, 1, 20);
            if (r() < 0.3) { g2.fillStyle = 'rgba(255,200,120,0.5)'; g2.fillRect(x + 3, hy + 3, 2, 2); }
          }
        });
        mk(0.32, (g2, w, r) => {
          g2.fillStyle = 'rgba(200,190,170,0.25)'; g2.fillRect(0, 180, w, 90);
          ridge(g2, w, 205, 20, near, 8, r);
        });
        break;
      case 'nanjing': case 'snow': case 'docks':
        mk(0.1, (g2, w, r) => {
          ridge(g2, w, 120, 30, far, 10, r); // Purple Mountain
        });
        mk(0.22, (g2, w, r) => {
          // city wall with crenellations
          g2.fillStyle = mid; g2.fillRect(0, 170, w, 100);
          for (let x = 0; x < w; x += 10) g2.fillRect(x, 164, 6, 6);
          // gate towers
          for (let x = 60; x < w; x += 260 + r() * 100) {
            g2.fillRect(x, 140, 50, 30);
            g2.fillStyle = U.mix(th.sky[1], '#000', 0.6);
            g2.beginPath(); g2.moveTo(x - 10, 142); g2.quadraticCurveTo(x + 25, 124, x + 60, 142); g2.fill();
            g2.fillStyle = 'rgba(255,190,110,0.5)'; g2.fillRect(x + 10, 150, 3, 3); g2.fillRect(x + 36, 150, 3, 3);
            g2.fillStyle = mid;
          }
          if (kind === 'docks') { g2.fillStyle = U.mix(th.sky[1], '#102030', 0.6); g2.fillRect(0, 200, w, 70); }
        });
        mk(0.38, (g2, w, r) => {
          // rooftops (curved eaves)
          for (let x = 0; x < w; x += 30 + r() * 40) {
            const hy = 190 + r() * 30, hw = 30 + r() * 30;
            g2.fillStyle = near; g2.fillRect(x, hy, hw, VH - hy);
            g2.beginPath(); g2.moveTo(x - 6, hy + 2); g2.quadraticCurveTo(x + hw / 2, hy - 12, x + hw + 6, hy + 2); g2.fill();
            if (T2.snow) { g2.fillStyle = 'rgba(230,236,246,0.7)'; g2.beginPath(); g2.moveTo(x - 6, hy + 2); g2.quadraticCurveTo(x + hw / 2, hy - 12, x + hw + 6, hy + 2); g2.lineTo(x + hw, hy); g2.quadraticCurveTo(x + hw / 2, hy - 8, x, hy); g2.fill(); }
            if (r() < 0.35) { g2.fillStyle = 'rgba(255,180,90,0.55)'; g2.fillRect(x + 6, hy + 10, 3, 3); }
          }
        });
        break;
      case 'loess': case 'yanan': case 'mansion':
        mk(0.07, (g2, w, r) => ridge(g2, w, 120, 40, far, 12, r));
        mk(0.2, (g2, w, r) => {
          // terraced loess hills
          for (let k = 0; k < 4; k++) ridge(g2, w, 150 + k * 18, 10, U.mix(mid, '#000', k * 0.08), 4, r);
          if (kind === 'yanan') {
            // Baota pagoda on hill
            const px = 220;
            g2.fillStyle = U.mix(mid, '#000', 0.4);
            for (let i = 0; i < 9; i++) { const pw = 16 - i * 1.2; g2.fillRect(px - pw / 2, 150 - i * 8, pw, 8); g2.fillRect(px - pw / 2 - 2, 150 - i * 8, pw + 4, 1); }
            g2.fillRect(px - 1, 70, 2, 10);
            // cave dwellings
            for (let x = 20; x < w; x += 40 + r() * 30) { g2.fillStyle = 'rgba(0,0,0,0.35)'; g2.beginPath(); g2.arc(x, 200, 7, Math.PI, 0); g2.fillRect(x - 7, 200, 14, 8); g2.fill(); if (r() < 0.5) { g2.fillStyle = 'rgba(255,190,100,0.6)'; g2.fillRect(x - 2, 198, 4, 4); } }
          }
          if (kind === 'mansion') {
            // pines
            for (let x = 0; x < w; x += 18 + r() * 20) { g2.fillStyle = U.mix(mid, '#0a1a10', 0.5); const ph = 30 + r() * 30; g2.beginPath(); g2.moveTo(x, 200); g2.lineTo(x + 8, 200 - ph); g2.lineTo(x + 16, 200); g2.fill(); }
          }
        });
        break;
      case 'railway':
        mk(0.06, (g2, w, r) => ridge(g2, w, 150, 30, far, 8, r));
        mk(0.2, (g2, w, r) => {
          ridge(g2, w, 190, 14, mid, 5, r);
          // telegraph poles
          for (let x = 0; x < w; x += 60) { g2.fillStyle = near; g2.fillRect(x, 150, 2, 50); g2.fillRect(x - 5, 154, 12, 1); }
          g2.strokeStyle = near; g2.beginPath(); for (let x = 0; x < w; x += 60) { g2.moveTo(x - 5, 155); g2.quadraticCurveTo(x + 25, 162, x + 55, 155); } g2.stroke();
          // distant fires (Hundred Regiments)
          for (let i = 0; i < 6; i++) { const fx = r() * w; g2.fillStyle = 'rgba(255,120,40,0.35)'; g2.beginPath(); g2.arc(fx, 188, 10, 0, Math.PI * 2); g2.fill(); g2.fillStyle = '#ff9a40'; g2.fillRect(fx - 2, 184, 4, 5); }
        });
        break;
      case 'train':
        mk(0.05, (g2, w, r) => ridge(g2, w, 140, 30, far, 10, r));
        mk(0.15, (g2, w, r) => { ridge(g2, w, 180, 16, mid, 6, r); for (let x = 0; x < w; x += 30 + r() * 50) { g2.fillStyle = near; g2.fillRect(x, 160 + r() * 20, 3, 30); g2.beginPath(); g2.arc(x + 1, 160, 10, 0, Math.PI * 2); g2.fill(); } });
        break;
      case 'shanghai':
        mk(0.08, (g2, w, r) => {
          // Bund skyline
          for (let x = 0; x < w; x += 16 + r() * 30) {
            const bh = 60 + r() * 90, bw = 16 + r() * 26;
            g2.fillStyle = far; g2.fillRect(x, VH - 60 - bh, bw, bh + 60);
            if (r() < 0.2) { g2.fillRect(x + bw / 2 - 3, VH - 60 - bh - 16, 6, 16); g2.beginPath(); g2.moveTo(x + bw / 2 - 5, VH - 76 - bh); g2.lineTo(x + bw / 2, VH - 92 - bh); g2.lineTo(x + bw / 2 + 5, VH - 76 - bh); g2.fill(); }
            for (let k = 0; k < bh / 6; k++) for (let j = 0; j < bw / 5; j++) if (r() < 0.25) { g2.fillStyle = r() < 0.5 ? 'rgba(255,220,140,0.6)' : 'rgba(255,240,200,0.4)'; g2.fillRect(x + 2 + j * 5, VH - 56 - bh + k * 6, 2, 3); }
          }
        });
        mk(0.22, (g2, w, r) => {
          for (let x = 0; x < w; x += 60 + r() * 80) {
            const cols = ['#ff3a6a', '#3affd0', '#ffd03a', '#ff6a3a'];
            g2.fillStyle = cols[(r() * 4) | 0]; g2.globalAlpha = 0.8; g2.fillRect(x, 130 + r() * 50, 4, 26); g2.globalAlpha = 0.2; g2.fillRect(x - 4, 126, 12, 80); g2.globalAlpha = 1;
          }
        });
        break;
      case 'palace':
        mk(0.1, (g2, w, r) => ridge(g2, w, 130, 20, far, 8, r));
        mk(0.25, (g2, w, r) => {
          for (let x = 0; x < w; x += 140) {
            g2.fillStyle = mid; g2.fillRect(x, 150, 110, 120);
            g2.beginPath(); g2.moveTo(x - 14, 152); g2.quadraticCurveTo(x + 55, 120, x + 124, 152); g2.fill();
            g2.fillStyle = 'rgba(255,200,120,0.4)'; for (let k = 0; k < 5; k++) g2.fillRect(x + 10 + k * 20, 170, 6, 10);
          }
        });
        break;
      default:
        mk(0.1, (g2, w, r) => ridge(g2, w, 150, 30, far, 10, r));
    }
    return layers;
  },
};
