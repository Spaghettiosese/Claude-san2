'use strict';
// ---------------------------------------------------------------------------
// Procedural pixel-art character sprites. Each character is described by a
// palette/outfit object; frames are rendered once, outlined and cached.
// Frame canvas: 24 x 28, anchor at bottom-centre (12, 28).
// ---------------------------------------------------------------------------
const SW = 24, SH = 28;

const Pals = {
  lan: { skin: '#f0c8a0', hair: '#1a1418', hairStyle: 'bob', top: '#3d6a9a', bottom: '#2a2f3a', shoes: '#1c1612', dress: true, collar: '#e8e0d0', female: true },
  lan_servant: { skin: '#f0c8a0', hair: '#1a1418', hairStyle: 'bob', top: '#d8d0c0', bottom: '#2a2a30', shoes: '#1c1612', dress: false, collar: '#8a2a2a', female: true, apron: '#f4f0e8' },
  lan_qipao: { skin: '#f0c8a0', hair: '#1a1418', hairStyle: 'bob', top: '#9a1e2e', bottom: '#9a1e2e', shoes: '#101010', dress: true, long: true, collar: '#e0b050', female: true },
  lan_nurse: { skin: '#f0c8a0', hair: '#1a1418', hairStyle: 'bob', top: '#e8e8e0', bottom: '#e8e8e0', shoes: '#f0f0f0', dress: true, collar: '#c02020', female: true, hat: { type: 'nurse', color: '#f4f4f0' } },
  lan_winter: { skin: '#f0c8a0', hair: '#1a1418', hairStyle: 'bob', top: '#5a4a3a', bottom: '#2a2f3a', shoes: '#1c1612', dress: true, collar: '#b03030', female: true, scarf: '#b03030' },
  ming: { skin: '#e8c098', hair: '#161214', hairStyle: 'short', top: '#2e3440', bottom: '#2e3440', shoes: '#15110e', glasses: true, scarf: '#e8e4dc' },
  ming_prison: { skin: '#d8b090', hair: '#161214', hairStyle: 'messy', top: '#6a6458', bottom: '#4a463e', shoes: '#15110e', glasses: true, wounded: true },
  lu: { skin: '#e8c098', hair: '#141010', hairStyle: 'short', top: '#4a4a44', bottom: '#2c2c2a', shoes: '#101010', hat: { type: 'fedora', color: '#2a2a2c' }, coat: true },
  han: { skin: '#d4a878', hair: '#141010', hairStyle: 'short', top: '#5f6e78', bottom: '#56646c', shoes: '#2a2218', hat: { type: 'cap8', color: '#5a6872' }, armband: '#e8e4d8', puttees: '#6a7078' },
  mori: { skin: '#e8c098', hair: '#141010', hairStyle: 'short', top: '#8a7a48', bottom: '#7a6c40', shoes: '#3a2a1a', hat: { type: 'jpcap', color: '#8e7e4c' }, puttees: '#7a6c44' },
  fang: { skin: '#f2cca8', hair: '#221a18', hairStyle: 'bob', top: '#7a2a3a', bottom: '#3a3034', shoes: '#101010', dress: true, female: true, hat: { type: 'beret', color: '#2a1e24' } },
  qin: { skin: '#dcb090', hair: '#8a8580', hairStyle: 'bun', top: '#3a3028', bottom: '#2a2420', shoes: '#15110e', female: true },
  // historical figures
  chiang: { skin: '#e4bc94', hair: '#e4bc94', hairStyle: 'bald', top: '#5a6040', bottom: '#5a6040', shoes: '#101010', collar: '#b08a30', cape: '#3a3e2c', mustache: true },
  mao: { skin: '#e0b890', hair: '#141010', hairStyle: 'long', top: '#6e7478', bottom: '#62686c', shoes: '#2a2218' },
  zhou: { skin: '#e4bc94', hair: '#141010', hairStyle: 'short', top: '#4a525a', bottom: '#4a525a', shoes: '#101010' },
  wang: { skin: '#ecc8a4', hair: '#141010', hairStyle: 'slick', top: '#262a30', bottom: '#262a30', shoes: '#101010', tie: '#7a6a3a' },
  dai: { skin: '#dcb48c', hair: '#141010', hairStyle: 'short', top: '#3a3e36', bottom: '#3a3e36', shoes: '#101010', coat: true },
  kageyama: { skin: '#e8c098', hair: '#141010', hairStyle: 'short', top: '#6a5e3a', bottom: '#6a5e3a', shoes: '#101010', hat: { type: 'peaked', color: '#5a5030', band: '#8a1a1a' }, boots: true, sword: true, armband: '#f0f0f0', glasses: true },
  bai: { skin: '#f4d0b0', hair: '#141010', hairStyle: 'wave', top: '#5a2a6a', bottom: '#5a2a6a', shoes: '#101010', dress: true, long: true, female: true, collar: '#d8c070' },
  xu: { skin: '#d8b08c', hair: '#3a3430', hairStyle: 'short', top: '#4a5244', bottom: '#4a5244', shoes: '#101010', gown: true, hat: { type: 'fedora', color: '#3a3830' } },
  // enemies
  jp_soldier: { skin: '#e0b890', hair: '#141010', hairStyle: 'short', top: '#8a7a48', bottom: '#7a6c40', shoes: '#3a2a1a', hat: { type: 'jpcap', color: '#8e7e4c' }, puttees: '#7a6c44', belt: '#4a3420', gun: 'rifle' },
  jp_officer: { skin: '#e0b890', hair: '#141010', hairStyle: 'short', top: '#6e6238', bottom: '#6e6238', shoes: '#101010', hat: { type: 'peaked', color: '#5e5434', band: '#8a1a1a' }, boots: true, sword: true, belt: '#3a2618', gun: 'pistol' },
  kempei: { skin: '#e0b890', hair: '#141010', hairStyle: 'short', top: '#7a6c40', bottom: '#6a5e36', shoes: '#101010', hat: { type: 'peaked', color: '#6a5e38', band: '#8a1a1a' }, boots: true, armband: '#f0f0f0', belt: '#3a2618', gun: 'pistol' },
  agent: { skin: '#dcb48c', hair: '#141010', hairStyle: 'short', top: '#23252a', bottom: '#1e2024', shoes: '#101010', hat: { type: 'fedora', color: '#1a1a1c' }, coat: true, gun: 'pistol' },
  puppet: { skin: '#dcb48c', hair: '#141010', hairStyle: 'short', top: '#4a5a48', bottom: '#44523f', shoes: '#2a2218', hat: { type: 'kmtcap', color: '#4a5a48' }, puttees: '#4a5642', belt: '#3a2a18', gun: 'rifle', armband: '#d8c040' },
  kmt: { skin: '#dcb48c', hair: '#141010', hairStyle: 'short', top: '#4f5d63', bottom: '#46545a', shoes: '#2a2218', hat: { type: 'helmet', color: '#4a5450' }, puttees: '#4e5a5e', belt: '#3a2a18', gun: 'rifle' },
  kmt_mp: { skin: '#dcb48c', hair: '#141010', hairStyle: 'short', top: '#4f5d63', bottom: '#46545a', shoes: '#101010', hat: { type: 'helmet', color: '#3a4440' }, armband: '#f0f0f0', belt: '#e8e8e0', gun: 'rifle' },
  ccp_guard: { skin: '#d4a878', hair: '#141010', hairStyle: 'short', top: '#5f6e78', bottom: '#56646c', shoes: '#2a2218', hat: { type: 'cap8', color: '#5a6872' }, armband: '#e8e4d8', puttees: '#6a7078', gun: 'rifle' },
  guard_jp: null, // alias set below
  // civilians
  civ_m1: { skin: '#dcb48c', hair: '#141010', hairStyle: 'short', top: '#4a4038', bottom: '#3a3530', shoes: '#15110e', gown: true },
  civ_m2: { skin: '#d8ac80', hair: '#141010', hairStyle: 'short', top: '#6a5a44', bottom: '#2e2a26', shoes: '#15110e', hat: { type: 'cap', color: '#3a3a36' } },
  civ_f1: { skin: '#f0c8a0', hair: '#161214', hairStyle: 'bun', top: '#6a7a8a', bottom: '#2a2a30', shoes: '#15110e', female: true, dress: true },
  civ_f2: { skin: '#eac4a0', hair: '#161214', hairStyle: 'wave', top: '#2a6a5a', bottom: '#2a6a5a', shoes: '#101010', female: true, dress: true, long: true, collar: '#e0d0a0' },
  waiter: { skin: '#dcb48c', hair: '#141010', hairStyle: 'slick', top: '#f0ece0', bottom: '#1a1a1c', shoes: '#101010', tie: '#101010' },
  prisoner: { skin: '#d0a888', hair: '#221c18', hairStyle: 'messy', top: '#6a6458', bottom: '#4a463e', shoes: '#15110e' },
  worker: { skin: '#c89868', hair: '#141010', hairStyle: 'short', top: '#3a4a5a', bottom: '#2a3038', shoes: '#15110e', hat: { type: 'straw', color: '#b89858' } },
};
Pals.guard_jp = Pals.jp_soldier;

const Sprites = {
  cache: new Map(),

  get(palId, pose, frame, dir) {
    const key = palId + '|' + pose + '|' + frame + '|' + dir;
    let c = this.cache.get(key);
    if (c) return c;
    const base = this.cache.get(palId + '|' + pose + '|' + frame + '|1');
    if (dir === -1 && base) {
      c = U.canvas(SW, SH);
      const x = c.getContext('2d'); x.translate(SW, 0); x.scale(-1, 1); x.drawImage(base, 0, 0);
    } else {
      c = this.render(Pals[palId] || Pals.civ_m1, pose, frame);
      if (dir === -1) {
        const f = U.canvas(SW, SH); const x = f.getContext('2d');
        x.translate(SW, 0); x.scale(-1, 1); x.drawImage(c, 0, 0);
        this.cache.set(palId + '|' + pose + '|' + frame + '|1', c);
        c = f;
      }
    }
    this.cache.set(key, c);
    return c;
  },

  render(p, pose, frame) {
    const c = U.canvas(SW, SH);
    const g = c.getContext('2d');
    const R = (x, y, w, h, col) => { if (!col) return; g.fillStyle = col; g.fillRect(x | 0, y | 0, w, h); };
    const P = (x, y, col) => R(x, y, 1, 1, col);
    const dk = (col, a = -0.25) => U.shade(col, a);
    const lt = (col, a = 0.18) => U.shade(col, a);

    // leg: from hip (hx,hy) to foot (fx, fy) 2px wide with knee
    const leg = (hx, hy, fx, fy, col, shoe, dark) => {
      const steps = fy - hy;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const x = Math.round(hx + (fx - hx) * t);
        R(x, hy + i, 2, 1, dark ? dk(col, -0.2) : col);
        if (p.puttees && i > steps * 0.5) R(x, hy + i, 2, 1, dark ? dk(p.puttees, -0.2) : p.puttees);
        if (p.boots && i > steps * 0.45) R(x, hy + i, 2, 1, dark ? '#050505' : '#141414');
      }
      R(fx, fy, 3, 2, dark ? dk(shoe, -0.3) : shoe);
      P(fx + 2, fy, lt(shoe, 0.15));
    };
    const arm = (sx, sy, hx, hy, col, dark) => {
      const steps = Math.max(Math.abs(hy - sy), Math.abs(hx - sx));
      for (let i = 0; i <= steps; i++) {
        const t = steps ? i / steps : 0;
        R(Math.round(sx + (hx - sx) * t), Math.round(sy + (hy - sy) * t), 2, 1, dark ? dk(col, -0.25) : col);
      }
      R(hx, hy + 1, 2, 2, dark ? dk(p.skin, -0.15) : p.skin);
    };
    const head = (hx, hy, look = 0) => {
      // hx,hy = top-left of 6x7 head box
      const s = p.skin, h = p.hair;
      if (p.hairStyle === 'long' || p.hairStyle === 'bob' || p.hairStyle === 'wave') R(hx - 1, hy + 1, 3, p.hairStyle === 'bob' ? 6 : 5, h);
      R(hx + 1, hy + 1, 5, 6, s);
      R(hx, hy + 2, 1, 4, s);
      R(hx + 1, hy + 6, 4, 1, dk(s, -0.12)); // jaw shade
      P(hx + 2, hy + 3, dk(s, -0.2)); // ear
      // eye + brow
      P(hx + 4 + look, hy + 3, '#1a1010');
      if (p.female) P(hx + 5, hy + 3, '#1a1010');
      P(hx + 5, hy + 5, dk(s, -0.25)); // mouth
      if (p.mustache) R(hx + 4, hy + 5, 2, 1, '#3a2a20');
      if (p.glasses) { R(hx + 3, hy + 3, 3, 1, 'rgba(40,30,20,0.9)'); P(hx + 4, hy + 2, '#9ab'); }
      // hair
      switch (p.hairStyle) {
        case 'bald': R(hx + 1, hy, 4, 1, lt(s, 0.1)); P(hx + 2, hy + 1, lt(s, 0.35)); break;
        case 'bob': R(hx, hy, 6, 2, h); R(hx, hy + 2, 3, 5, h); R(hx + 4, hy + 1, 2, 1, h); P(hx + 2, hy, lt(h, 0.3)); break;
        case 'wave': R(hx, hy, 6, 2, h); R(hx, hy + 2, 2, 4, h); P(hx + 3, hy, lt(h, 0.3)); P(hx + 5, hy + 1, h); break;
        case 'bun': R(hx, hy, 6, 2, h); R(hx, hy + 2, 2, 3, h); R(hx - 2, hy + 1, 3, 3, h); P(hx + 2, hy, lt(h, 0.3)); break;
        case 'long': R(hx, hy - 1, 6, 2, h); R(hx, hy + 1, 3, 4, h); P(hx + 4, hy - 1, lt(h, 0.25)); break;
        case 'slick': R(hx, hy, 6, 1, h); R(hx, hy + 1, 3, 2, h); P(hx + 3, hy, lt(h, 0.4)); break;
        case 'messy': R(hx, hy - 1, 6, 2, h); R(hx, hy + 1, 3, 3, h); P(hx + 5, hy - 1, h); P(hx + 1, hy - 2, h); break;
        default: R(hx, hy, 6, 1, h); R(hx, hy + 1, 3, 2, h); P(hx + 5, hy + 1, h); break;
      }
      // hats
      const ht = p.hat;
      if (ht) {
        const hc = ht.color;
        switch (ht.type) {
          case 'jpcap': R(hx, hy - 1, 6, 2, hc); R(hx + 5, hy + 1, 2, 1, dk(hc)); R(hx - 1, hy + 1, 2, 4, lt(hc, 0.1)); P(hx + 3, hy - 1, '#e0c040'); break;
          case 'helmet': R(hx - 1, hy - 1, 8, 2, hc); R(hx, hy - 2, 6, 1, hc); R(hx - 1, hy + 1, 2, 3, hc); R(hx + 6, hy + 1, 1, 1, dk(hc)); P(hx + 2, hy - 2, lt(hc, 0.3)); break;
          case 'fedora': R(hx - 1, hy, 8, 1, hc); R(hx, hy - 2, 6, 2, hc); R(hx, hy - 1, 6, 1, dk(hc, -0.4)); P(hx + 1, hy - 2, lt(hc, 0.2)); break;
          case 'peaked': R(hx, hy - 2, 6, 2, hc); R(hx, hy - 0, 6, 1, ht.band || dk(hc)); R(hx + 4, hy + 1, 3, 1, '#101010'); P(hx + 3, hy - 2, '#e0c040'); break;
          case 'cap8': R(hx, hy - 1, 6, 2, hc); R(hx + 4, hy + 1, 3, 1, dk(hc)); P(hx + 3, hy - 1, '#d03030'); break;
          case 'kmtcap': R(hx, hy - 1, 6, 2, hc); R(hx + 4, hy + 1, 3, 1, dk(hc)); P(hx + 3, hy - 1, '#e8e8f0'); break;
          case 'cap': R(hx, hy - 1, 6, 2, hc); R(hx + 4, hy + 1, 3, 1, dk(hc)); break;
          case 'beret': R(hx - 1, hy - 1, 7, 2, hc); P(hx + 2, hy - 2, hc); break;
          case 'straw': R(hx - 2, hy + 1, 10, 1, hc); R(hx + 1, hy - 1, 4, 2, hc); P(hx + 2, hy - 2, hc); break;
          case 'nurse': R(hx, hy - 1, 6, 2, hc); P(hx + 3, hy - 1, '#c02020'); break;
          default: break;
        }
      }
    };
    const torso = (tx, ty, h, lean = 0) => {
      const col = p.top;
      R(tx + lean, ty, 6, h, col);
      R(tx + lean, ty, 1, h, dk(col, -0.2));
      R(tx + 5 + lean, ty + 1, 1, h - 1, lt(col, 0.12));
      if (p.collar) R(tx + 3 + lean, ty, 3, 1, p.collar);
      if (p.scarf) { R(tx + lean, ty, 6, 2, p.scarf); R(tx + lean, ty + 2, 2, 3, p.scarf); }
      if (p.tie) { R(tx + 3 + lean, ty, 2, 1, '#f0ece0'); R(tx + 4 + lean, ty + 1, 1, 4, p.tie); }
      if (p.apron) R(tx + 2 + lean, ty + 2, 4, h - 2, p.apron);
      if (p.belt) R(tx + lean, ty + h - 2, 6, 1, p.belt);
      if (p.armband) R(tx + 1 + lean, ty + 2, 2, 1, p.armband);
      if (p.coat) { R(tx + 3 + lean, ty, 1, h, dk(col, -0.3)); }
      if (p.wounded) { P(tx + 3 + lean, ty + 3, '#8a1818'); P(tx + 4 + lean, ty + 4, '#8a1818'); }
    };
    const skirt = (tx, ty, h, spread) => {
      const col = p.bottom;
      for (let i = 0; i < h; i++) {
        const w = 6 + Math.floor((i / h) * spread);
        R(tx - Math.floor((w - 6) / 2), ty + i, w, 1, i === 0 ? dk(col, -0.1) : col);
      }
      R(tx + 4, ty + 1, 1, h - 1, dk(col, -0.25)); // qipao slit / fold
    };
    const slung = (tx, ty) => { // rifle on back
      if (p.gun !== 'rifle') return;
      for (let i = 0; i < 11; i++) P(tx + 1 + Math.floor(i * 0.3), ty - 2 + i, i < 3 ? '#555' : '#5a3a1e');
    };
    const sword = (tx, ty) => { if (!p.sword) return; for (let i = 0; i < 8; i++) P(tx - 1 - Math.floor(i * 0.5), ty + i, i < 2 ? '#b0a060' : '#2a2a2a'); };

    const f = frame;
    if (pose === 'stand' || pose === 'walk' || pose === 'run' || pose === 'aim' || pose === 'talk' || pose === 'stab' || pose === 'alert' || pose === 'carry') {
      let bob = 0, lf = 0, lb = 0, liftF = 0, liftB = 0, aF = 0, aB = 0, lean = 0;
      if (pose === 'stand' || pose === 'talk' || pose === 'alert') { bob = f % 2 === 1 ? 1 : 0; }
      if (pose === 'walk') {
        const seq = [[2, -2, 0, 0], [1, -1, 1, 0], [-2, 2, 0, 0], [-1, 1, 0, 1]][f % 4];
        [lf, lb, liftF, liftB] = seq; aF = -lf; aB = -lb; bob = f % 2;
      }
      if (pose === 'run') {
        const seq = [[4, -3, 0, 2], [2, -1, 2, 0], [-3, 4, 2, 0], [-1, 2, 0, 2]][f % 4];
        [lf, lb, liftF, liftB] = seq; aF = -lf; aB = -lb; bob = f % 2; lean = 1;
      }
      const hipY = 19 + bob;
      const hx = 10;
      // back arm
      if (pose !== 'aim' && pose !== 'carry') arm(hx + 1 + lean, 12 + bob, hx + 1 + aB + lean, 17 + bob, p.top, true);
      slung(hx - 1, 12 + bob);
      // legs
      if (!(p.dress && p.long)) {
        leg(hx + 1, hipY, hx + 1 + lb, 25 - liftB, p.bottom, p.shoes, true);
        leg(hx + 3, hipY, hx + 3 + lf, 25 - liftF, p.bottom, p.shoes, false);
      } else {
        leg(hx + 1, hipY + 4, hx + 1 + Math.round(lb / 2), 25 - liftB, p.skin, p.shoes, true);
        leg(hx + 3, hipY + 4, hx + 3 + Math.round(lf / 2), 25 - liftF, p.skin, p.shoes, false);
      }
      torso(hx, 11 + bob, 8, lean);
      if (p.dress) skirt(hx + lean, 18 + bob, p.long ? 6 : 4, 1);
      if (p.gown) skirt(hx + lean, 18 + bob, 5, 1);
      if (p.cape) { R(hx - 1, 11 + bob, 2, 9, p.cape); }
      sword(hx + 1, 18 + bob);
      head(hx + lean, 4 + bob);
      // front arm
      if (pose === 'aim') {
        R(hx + 3, 13 + bob, 7, 2, p.top); R(hx + 10, 13 + bob, 2, 2, p.skin);
        if (p.gun === 'rifle' || !p.gun) { R(hx + 6, 12 + bob, 12, 2, '#5a3a1e'); R(hx + 12, 12 + bob, 7, 1, '#3a3a3a'); P(hx + 19, 12 + bob, '#999'); }
        else { R(hx + 10, 12 + bob, 4, 2, '#2a2a2a'); }
      } else if (pose === 'stab') {
        const ext = f % 2 ? 7 : 3;
        R(hx + 3, 13 + bob, ext, 2, p.top); R(hx + 3 + ext, 13 + bob, 2, 2, p.skin);
        R(hx + 4 + ext, 12 + bob, 4, 1, '#c8c8d0');
      } else if (pose === 'carry') {
        R(hx + 3, 14 + bob, 5, 2, p.top); R(hx + 8, 14 + bob, 2, 2, p.skin);
      } else if (pose === 'talk') {
        arm(hx + 3, 12 + bob, hx + 6, 14 + bob - (f % 2), p.top, false);
      } else {
        arm(hx + 3 + lean, 12 + bob, hx + 3 + aF + lean, 17 + bob, p.top, false);
      }
      if (pose === 'alert') { R(hx + 3, 12 + bob, 6, 2, p.top); if (p.gun === 'rifle') { R(hx + 5, 11 + bob, 11, 2, '#5a3a1e'); R(hx + 11, 11 + bob, 6, 1, '#3a3a3a'); } }
    } else if (pose === 'crouch' || pose === 'crouchwalk' || pose === 'crouchaim') {
      const w = pose === 'crouchwalk' ? [[1, -1], [0, 0], [-1, 1], [0, 0]][f % 4] : [0, 0];
      const hx = 10;
      arm(hx + 3, 17, hx + 4 + w[1], 21, p.top, true);
      // folded legs
      R(hx + 0 + w[1], 22, 3, 3, dk(p.dress && p.long ? p.skin : p.bottom, -0.2));
      R(hx + 1 + w[1], 25, 3, 2, dk(p.shoes, -0.3));
      R(hx + 2, 21, 5, 3, p.dress ? p.bottom : p.bottom);
      R(hx + 5 + w[0], 23, 2, 3, p.dress && p.long ? p.skin : p.bottom);
      if (p.puttees) R(hx + 5 + w[0], 24, 2, 2, p.puttees);
      R(hx + 5 + w[0], 26, 3, 1, p.shoes);
      R(hx + 1, 25, 3, 2, p.shoes);
      torso(hx, 15, 7, 1);
      slung(hx, 15);
      head(hx + 2, 9);
      if (pose === 'crouchaim') { R(hx + 5, 17, 5, 2, p.top); R(hx + 7, 16, 11, 2, '#5a3a1e'); R(hx + 13, 16, 6, 1, '#3a3a3a'); }
      else arm(hx + 5, 16, hx + 7 + w[0], 20, p.top, false);
    } else if (pose === 'prone' || pose === 'crawl') {
      const w = pose === 'crawl' ? [1, 0, -1, 0][f % 4] : 0;
      // lying on belly facing right; head at right
      R(2, 25, 4, 2, p.shoes);
      R(4, 24 + (w > 0 ? 0 : 1), 7, 2, p.dress && p.long ? p.skin : p.bottom);
      R(4, 25 - (w > 0 ? 0 : 1) + 1, 6, 1, dk(p.bottom, -0.2));
      R(10, 23, 8, 3, p.top);
      R(10, 23, 8, 1, lt(p.top, 0.12));
      if (p.belt) R(10, 25, 1, 1, p.belt);
      // arm reaching
      R(16 + w, 26, 4, 1, p.top); R(19 + w, 26, 2, 1, p.skin);
      // head
      R(17, 20, 5, 5, p.skin); R(17, 20, 4, 2, p.hair); R(16, 21, 2, 3, p.hair);
      P(20, 22, '#1a1010');
      if (p.hat && p.hat.type) R(17, 19, 5, 2, p.hat.color);
    } else if (pose === 'climb') {
      const s = f % 2 ? 1 : -1;
      const hx = 9;
      leg(hx + 1, 19, hx + 1, 25 - (s > 0 ? 2 : 0), p.bottom, p.shoes, true);
      leg(hx + 4, 19, hx + 4, 25 - (s < 0 ? 2 : 0), p.bottom, p.shoes, false);
      R(hx, 11, 7, 8, p.top); R(hx, 11, 7, 1, lt(p.top));
      if (p.dress) R(hx - 1, 18, 9, 3, p.bottom);
      // back of head
      R(hx + 1, 4, 5, 7, p.hair); R(hx + 1, 9, 5, 1, dk(p.skin, -0.1));
      if (p.hat) R(hx, 3, 7, 2, p.hat.color);
      // arms up
      R(hx - 1, 5 + (s > 0 ? 0 : 3), 2, 7, p.top); R(hx - 1, 4 + (s > 0 ? 0 : 3), 2, 2, p.skin);
      R(hx + 6, 5 + (s < 0 ? 0 : 3), 2, 7, p.top); R(hx + 6, 4 + (s < 0 ? 0 : 3), 2, 2, p.skin);
    } else if (pose === 'dead' || pose === 'ko') {
      // lying on back, head to the left
      R(3, 22, 5, 5, p.skin); R(2, 22, 3, 5, p.hair);
      P(6, 24, pose === 'dead' ? '#1a1010' : '#1a1010');
      if (p.hat) R(1, 23, 2, 4, p.hat.color);
      R(8, 23, 9, 4, p.top); R(8, 23, 9, 1, lt(p.top));
      R(17, 24, 5, 3, p.bottom); R(21, 23, 2, 3, p.shoes);
      R(10, 22, 5, 1, p.top); R(14, 22, 2, 1, p.skin);
      if (pose === 'dead') { R(9, 27, 8, 1, 'rgba(120,10,10,0.85)'); P(12, 25, '#6a0a0a'); }
      if (pose === 'ko') { P(5, 20, '#e8e070'); P(7, 19, '#e8e070'); }
    } else if (pose === 'sit') {
      const hx = 10;
      R(hx + 2, 19, 6, 3, p.bottom); R(hx + 6, 21, 2, 5, p.bottom); R(hx + 6, 26, 3, 1, p.shoes);
      torso(hx, 12, 8, 0);
      head(hx, 5);
      arm(hx + 3, 13, hx + 6, 17, p.top, false);
    } else if (pose === 'hide') {
      // peeking eyes only (used for closets)
      R(10, 12, 4, 1, '#f0f0e0');
    } else if (pose === 'bound') {
      // prisoner sitting on floor, knees up
      const hx = 10;
      R(hx + 2, 23, 7, 3, p.bottom); R(hx + 7, 20, 2, 4, p.bottom); R(hx + 8, 26, 3, 1, p.shoes);
      torso(hx, 16, 8, 0);
      head(hx, 9);
      R(hx + 1, 19, 3, 2, '#8a7a5a');
    }

    this.outline(g);
    return c;
  },

  outline(g) {
    const img = g.getImageData(0, 0, SW, SH), d = img.data;
    const out = new Uint8ClampedArray(d);
    const op = (x, y) => x >= 0 && y >= 0 && x < SW && y < SH && d[(y * SW + x) * 4 + 3] > 40;
    for (let y = 0; y < SH; y++) {
      for (let x = 0; x < SW; x++) {
        const i = (y * SW + x) * 4;
        if (d[i + 3] > 40) continue;
        if (op(x - 1, y) || op(x + 1, y) || op(x, y - 1) || op(x, y + 1)) {
          out[i] = 14; out[i + 1] = 10; out[i + 2] = 16; out[i + 3] = 200;
        }
      }
    }
    img.data.set(out);
    g.putImageData(img, 0, 0);
  },

  // --- dog ------------------------------------------------------------
  dog(frame, pose, dir) {
    const key = 'dog|' + pose + '|' + frame + '|' + dir;
    let c = this.cache.get(key);
    if (c) return c;
    c = U.canvas(SW, SH);
    const g = c.getContext('2d');
    const R = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
    const tan = '#a87a44', blk = '#2a2018', lt = '#c89a5e';
    if (pose === 'dead') {
      R(3, 24, 16, 3, tan); R(5, 24, 9, 1, blk); R(17, 23, 5, 3, tan); R(3, 27, 12, 1, 'rgba(120,10,10,0.8)');
    } else {
      const lf = [[0, 2], [1, 1], [2, 0], [1, 1]][frame % 4];
      const run = pose === 'run';
      R(4, 18, 12, 5, tan); R(6, 18, 8, 2, blk); // body + saddle
      R(15, 15, 5, 5, tan); R(18, 17, 3, 2, lt); R(20, 17, 1, 1, blk); // head + snout
      R(15, 13, 2, 3, blk); R(18, 13, 1, 2, blk); // ears
      P(g, 17, 16, '#fff');
      R(1, 17 + (run ? 0 : 1), 4, 2, tan); // tail
      R(5 + lf[0], 23, 2, 4, tan); R(8 - lf[0], 23, 2, 4, U.shade(tan, -0.2));
      R(13 + lf[1], 23, 2, 4, tan); R(15 - lf[1], 23, 2, 4, U.shade(tan, -0.2));
    }
    function P(gg, x, y, col) { gg.fillStyle = col; gg.fillRect(x, y, 1, 1); }
    this.outline(g);
    if (dir === -1) {
      const f = U.canvas(SW, SH); const x = f.getContext('2d');
      x.translate(SW, 0); x.scale(-1, 1); x.drawImage(c, 0, 0); c = f;
    }
    this.cache.set(key, c);
    return c;
  },
};
