'use strict';
// ---------------------------------------------------------------------------
// Interactive world objects, projectiles and particle effects.
// Every object: {type, x, y(bottom), w, h, ...}. Behaviour lives in ObjTypes.
// ---------------------------------------------------------------------------
const ObjTypes = {};
const HIDE_PROMPT = { closet: 'Hide in wardrobe', pile: 'Hide', curtain: 'Hide behind curtain' };

function drawRect(ctx, x, y, w, h, col) { ctx.fillStyle = col; ctx.fillRect(Math.round(x), Math.round(y), w, h); }

// ---------------- doors ---------------------------------------------------
ObjTypes.door = {
  init(o, W) { o.w = 10; o.h = 32; o.c = Math.floor(o.x / TILE); o.r = Math.floor((o.y - 1) / TILE); o.open = !!o.open; o.sync(W); },
  methods: {
    sync(W) { const L = W.level; L.setDyn(this.c, this.r, !this.open); L.setDyn(this.c, this.r - 1, !this.open); },
    setOpen(W, v, silent) {
      if (this.open === v) return;
      if (!v) { // don't close on someone
        const occ = [W.player, ...W.enemies, ...W.followers].some((a) => a && Math.abs(a.x - this.x) < 9 && Math.abs(a.y - this.y) < 20);
        if (occ) return;
      }
      this.open = v; this.sync(W);
      if (Math.abs(W.player.x - this.x) < 260) Sfx.play('door', silent ? 0.35 : 0.7);
      if (!silent) W.level.noise(this.x, this.y - 12, 45, 'door', 'door');
    },
  },
  prompt(o, W) {
    if (o.gate) return o.open ? null : 'Gate (locked mechanism)';
    if (o.keypad && o.locked) return 'Locked (keypad)';
    if (o.locked && !W.has(o.locked)) return 'Locked door';
    return o.open ? 'Close door' : (o.locked ? 'Unlock door' : 'Open door');
  },
  interact(o, W) {
    if (o.gate) { W.toast('It won\'t move. There must be a lever somewhere.'); Sfx.play('locked'); return; }
    if (o.keypad && o.locked) { W.toast('A combination keypad controls this door.'); Sfx.play('locked'); return; }
    if (o.locked) {
      if (!W.has(o.locked)) { W.toast(o.lockMsg || 'Locked. You need a key.'); Sfx.play('locked'); return; }
      o.locked = null; Sfx.play('unlock'); W.toast('Unlocked.');
    }
    o.setOpen(W, !o.open);
  },
  draw(o, ctx, cam, W) {
    const x = o.x - cam.x, y = o.y - cam.y, th = W.level.theme;
    const wood = o.gate ? '#4a4a50' : (o.color || th.wood);
    drawRect(ctx, x - 7, y - 34, 14, 2, th.trim); // lintel
    if (o.open) {
      drawRect(ctx, x - 6, y - 32, 12, 32, 'rgba(0,0,0,0.35)');
      drawRect(ctx, x + 4, y - 32, 3, 32, U.shade(wood, -0.2));
    } else if (o.gate) {
      for (let i = 0; i < 5; i++) drawRect(ctx, x - 6 + i * 3, y - 32, 1, 32, '#6a6a70');
      drawRect(ctx, x - 6, y - 26, 12, 1, '#5a5a60'); drawRect(ctx, x - 6, y - 10, 12, 1, '#5a5a60');
    } else {
      drawRect(ctx, x - 6, y - 32, 12, 32, wood);
      drawRect(ctx, x - 6, y - 32, 1, 32, U.shade(wood, 0.2));
      drawRect(ctx, x - 4, y - 29, 8, 11, U.shade(wood, -0.15));
      drawRect(ctx, x - 4, y - 15, 8, 12, U.shade(wood, -0.15));
      drawRect(ctx, x + 3, y - 17, 2, 2, o.locked ? '#c8a040' : '#b0a080');
      if (o.keypad) drawRect(ctx, x + 7, y - 20, 3, 5, o.locked ? '#a02020' : '#20a040');
      if (o.locked && !o.keypad) drawRect(ctx, x + 3, y - 14, 2, 2, '#302010');
    }
  },
};

// ---------------- hiding spots -------------------------------------------
function hideDraw(o, ctx, cam, W) {
  const x = o.x - cam.x, y = o.y - cam.y, th = W.level.theme, tn = W.level.def.theme;
  if (o.type === 'closet') {
    const w = th.wood;
    drawRect(ctx, x - 8, y - 30, 16, 30, U.shade(w, -0.1));
    drawRect(ctx, x - 8, y - 30, 16, 2, U.shade(w, 0.2));
    drawRect(ctx, x - 7, y - 27, 7, 25, U.shade(w, 0.05)); drawRect(ctx, x + 1, y - 27, 6, 25, U.shade(w, 0.05));
    drawRect(ctx, x - 1, y - 16, 1, 3, '#c8a050'); drawRect(ctx, x + 1, y - 16, 1, 3, '#c8a050');
    if (o.occupant === 'player') drawRect(ctx, x - 3, y - 19, 3, 1, 'rgba(240,240,220,0.8)');
    if (o.occupant && o.occupant !== 'player') drawRect(ctx, x - 1, y - 2, 4, 2, 'rgba(110,10,10,0.6)');
  } else if (o.type === 'curtain') {
    const c = o.color || (tn === 'shanghai' ? '#6a1020' : tn === 'palace' ? '#8a6a20' : '#7a1a1a');
    for (let i = 0; i < 6; i++) drawRect(ctx, x - 9 + i * 3, y - 40, 3, 40, i % 2 ? c : U.shade(c, 0.15));
    drawRect(ctx, x - 11, y - 42, 22, 2, '#c8a040');
    if (o.occupant === 'player') drawRect(ctx, x - 2, y - 20, 4, 1, 'rgba(0,0,0,0.4)');
  } else {
    // pile: haystack / barrels / baskets depending on theme
    if (tn === 'loess' || tn === 'yanan' || tn === 'railway' || tn === 'nanjing') {
      const h = '#b89a50';
      ctx.fillStyle = h; ctx.beginPath(); ctx.ellipse(x, y - 8, 12, 11, 0, Math.PI, 0); ctx.fill();
      drawRect(ctx, x - 12, y - 8, 24, 8, h);
      for (let i = 0; i < 9; i++) drawRect(ctx, x - 11 + i * 2.5, y - 16 + (i % 3) * 3, 1, 6, U.shade(h, -0.2));
      if (W.level.theme.snow) { ctx.fillStyle = '#eef2fa'; ctx.beginPath(); ctx.ellipse(x, y - 15, 9, 4, 0, Math.PI, 0); ctx.fill(); }
    } else {
      // barrels
      for (const bx of [-6, 5]) {
        drawRect(ctx, x + bx - 5, y - 16, 10, 16, '#5a3a20');
        drawRect(ctx, x + bx - 5, y - 13, 10, 1, '#2a2a2a'); drawRect(ctx, x + bx - 5, y - 4, 10, 1, '#2a2a2a');
        drawRect(ctx, x + bx - 4, y - 16, 2, 16, '#6a4a2a');
      }
      drawRect(ctx, x - 3, y - 26, 10, 10, '#5a3a20'); drawRect(ctx, x - 3, y - 23, 10, 1, '#2a2a2a');
      if (W.level.theme.snow) drawRect(ctx, x - 11, y - 17, 22, 2, '#eef2fa');
    }
  }
}
for (const t of ['closet', 'pile', 'curtain']) {
  ObjTypes[t] = {
    init(o) { o.hideSpot = true; o.w = 16; o.h = 30; o.occupant = null; },
    prompt(o, W) {
      const p = W.player;
      if (p.drag) return o.occupant ? null : 'Hide body';
      if (o.occupant && o.occupant !== 'player') return null;
      return HIDE_PROMPT[t];
    },
    interact(o, W) {
      const p = W.player;
      if (p.drag) { if (!o.occupant) W.stashBody(o); return; }
      if (o.occupant) return;
      W.hide(o);
    },
    draw: hideDraw,
  };
}

// ---------------- lights ------------------------------------------------------
function lampInit(o, W, r, i, col) {
  o.w = 10; o.h = 12; o.on = o.on !== undefined ? o.on : true;
  o.light = { x: o.x, y: o.y - (o.type === 'streetlamp' ? 44 : o.type === 'lamp' ? 12 : 10), r: o.r || r, i: o.i || i, on: o.on, col: col, group: o.group || (o.type === 'streetlamp' ? 'street' : 'A') };
  if (o.type === 'lamp') {
    // hang from ceiling: find ceiling above
    let yy = o.y - 8; while (yy > 0 && W.level.typeAt(o.x, yy) !== T.SOLID) yy -= 4;
    o.top = Math.ceil(yy / TILE) * TILE; o.light.y = Math.min(o.y - 10, o.top + 14);
  }
  W.level.lights.push(o.light);
}
ObjTypes.lamp = {
  init(o, W) { lampInit(o, W, 70, 0.8, '#ffd890'); },
  draw(o, ctx, cam) {
    const x = o.x - cam.x, ly = o.light.y - cam.y;
    drawRect(ctx, x, o.top - cam.y, 1, ly - (o.top - cam.y) - 3, '#2a2a2a');
    drawRect(ctx, x - 4, ly - 3, 9, 3, '#3a3a2a');
    drawRect(ctx, x - 2, ly, 5, 2, o.light.on ? '#fff0b0' : '#5a5a4a');
  },
};
ObjTypes.streetlamp = {
  init(o, W) { lampInit(o, W, 85, 0.85, '#ffe0a0'); },
  draw(o, ctx, cam) {
    const x = o.x - cam.x, y = o.y - cam.y;
    drawRect(ctx, x - 1, y - 44, 2, 44, '#2a2a2e'); drawRect(ctx, x - 3, y - 3, 6, 3, '#2a2a2e');
    drawRect(ctx, x - 1, y - 46, 7, 2, '#2a2a2e');
    drawRect(ctx, x + 3, y - 44, 5, 4, '#3a3a3a'); drawRect(ctx, x + 4, y - 40, 3, 2, o.light.on ? '#fff4c0' : '#555');
    o.light.x = o.x + 5;
  },
};
ObjTypes.lantern = {
  init(o, W) { lampInit(o, W, 50, 0.6, '#ff7050'); o.light.group = o.group || 'lantern'; },
  draw(o, ctx, cam, W) {
    const x = o.x - cam.x, y = o.light.y - cam.y + Math.sin(W.time * 1.5 + o.x) * 0.6;
    drawRect(ctx, x, o.top - cam.y, 1, y - (o.top - cam.y) - 4, '#2a2020');
    drawRect(ctx, x - 3, y - 4, 7, 8, o.light.on ? '#d02820' : '#5a2020');
    drawRect(ctx, x - 2, y - 5, 5, 1, '#e0b040'); drawRect(ctx, x - 2, y + 4, 5, 1, '#e0b040');
    drawRect(ctx, x, y + 5, 1, 3, '#e0b040');
    if (o.light.on) drawRect(ctx, x - 1, y - 2, 2, 4, '#ff9060');
  },
};
ObjTypes.candle = {
  init(o, W) { o.w = 4; o.h = 6; o.light = { x: o.x, y: o.y - 20, r: 38, i: 0.55, on: true, col: '#ffc070', group: o.group || 'candle', flicker: true }; W.level.lights.push(o.light); },
  draw(o, ctx, cam, W) {
    const x = o.x - cam.x, y = o.y - cam.y - 16;
    drawRect(ctx, x - 5, y + 2, 10, 2, W.level.theme.wood);
    drawRect(ctx, x - 1, y - 3, 2, 5, '#e8e0c8');
    if (o.light.on) drawRect(ctx, x - 1, y - 5 + Math.round(Math.sin(W.time * 13 + o.x)), 2, 2, '#ffd060');
  },
};
ObjTypes.fire = {
  init(o, W) { o.w = 14; o.h = 12; o.light = { x: o.x, y: o.y - 8, r: 75, i: 0.9, on: true, col: '#ff8040', group: 'fire', flicker: true }; W.level.lights.push(o.light); },
  update(o, dt, W) { if (Math.random() < dt * 8) W.fx.spark(o.x + U.rand(-4, 4), o.y - 6); },
  draw(o, ctx, cam, W) {
    const x = o.x - cam.x, y = o.y - cam.y;
    drawRect(ctx, x - 7, y - 3, 14, 3, '#3a2a1a');
    for (let i = 0; i < 5; i++) {
      const h = 6 + Math.sin(W.time * 9 + i * 1.7) * 3;
      drawRect(ctx, x - 6 + i * 3, y - 3 - h, 3, h, i % 2 ? '#e05020' : '#f08030');
      drawRect(ctx, x - 5 + i * 3, y - 3 - h * 0.5, 1, h * 0.5, '#ffd060');
    }
  },
};

// ---------------- fuse box ----------------------------------------------------
ObjTypes.fuse = {
  init(o) { o.w = 10; o.h = 14; o.group = o.group || 'A'; o.on = true; },
  methods: {
    setOn(W, v) {
      this.on = v;
      for (const l of W.level.lights) if (l.group === this.group) l.on = v;
      Sfx.play('fuse');
      if (!v) {
        W.toast('Lights out.');
        // nearest soldier comes to fix it after a while
        const cands = W.enemies.filter((e) => e.alive && e.kind !== 'dog' && Math.abs(e.x - this.x) < 320 && Math.abs(e.y - this.y) < 60 && e.state !== 'alert');
        cands.sort((a, b) => Math.abs(a.x - this.x) - Math.abs(b.x - this.x));
        for (const e of cands) { e.sus = Math.max(e.sus, 0.35); e.icon = '?'; W.bark(e, U.pick(['Who turned off the lights?', 'Damn fuses again...', 'Hey! The lights!']), true); }
        if (cands[0]) { const e = cands[0]; e.target = { x: this.x, y: this.y }; e.fuseObj = this; e.waitT = 2; e.setState('fuse', W); }
      }
    },
  },
  prompt(o) { return o.on ? 'Cut the power' : 'Restore power'; },
  interact(o, W) { o.setOn(W, !o.on); },
  draw(o, ctx, cam) {
    const x = o.x - cam.x, y = o.y - cam.y - 18;
    drawRect(ctx, x - 5, y - 7, 10, 13, '#4a4a44'); drawRect(ctx, x - 4, y - 6, 8, 11, '#5a5a52');
    drawRect(ctx, x - 1, y - 3, 2, 5, o.on ? '#e0e0d0' : '#303030'); drawRect(ctx, x + 2, y - 5, 1, 1, o.on ? '#40e040' : '#e04040');
    drawRect(ctx, x, y + 6, 1, 12, '#2a2a2a');
  },
};

// ---------------- alarm ---------------------------------------------------------
ObjTypes.alarm = {
  init(o) { o.w = 10; o.h = 16; o.disabled = false; o.ringing = false; },
  methods: {
    ring(W) {
      if (this.disabled || W.level.alarm) return;
      this.ringing = true;
      W.raiseAlarm(this);
    },
  },
  prompt(o, W) { if (o.disabled) return null; if (W.level.alarm) return null; return 'Sabotage alarm'; },
  interact(o, W) {
    W.startWork(2.2, 'Cutting the alarm wire...', () => { o.disabled = true; Sfx.play('click'); W.toast('Alarm disabled. They can\'t call for help from here.'); W.stats.sabotage = (W.stats.sabotage || 0) + 1; });
  },
  update(o, dt, W) { if (o.ringing && Math.random() < dt * 1.2) Sfx.play('bell', 0.7); },
  draw(o, ctx, cam, W) {
    const x = o.x - cam.x, y = o.y - cam.y - 20;
    drawRect(ctx, x - 1, y, 2, 20, '#3a2a1a');
    const sw = o.ringing ? Math.sin(W.time * 20) * 2 : 0;
    ctx.fillStyle = o.disabled ? '#5a5040' : '#c8a040';
    ctx.beginPath(); ctx.moveTo(x - 6 + sw, y + 6); ctx.quadraticCurveTo(x + sw, y - 6, x + 6 + sw, y + 6); ctx.fill();
    drawRect(ctx, x - 7 + sw, y + 5, 14, 2, o.disabled ? '#4a4030' : '#a88020');
    if (!o.disabled) drawRect(ctx, x + sw, y + 7, 1, 8, '#8a7a5a');
    if (!o.disabled && !o.ringing && Math.floor(W.time * 2) % 2) drawRect(ctx, x + 4, y - 4, 1, 1, '#ff4040');
  },
};

// ---------------- pickups --------------------------------------------------------
ObjTypes.pickup = {
  init(o) { o.w = 10; o.h = 10; o.taken = false; o.bob = Math.random() * 6; },
  prompt(o, W) {
    if (o.taken) return null;
    const names = { rifle: 'Pick up rifle (Arisaka)', pistol: 'Pick up pistol', firecracker: 'Take firecrackers', stones: 'Take stones' };
    if (names[o.kind]) return names[o.kind];
    if (o.kind === 'doc') return 'Read ' + (Story.docs[o.id] ? Story.docs[o.id].title : 'document');
    if (o.kind === 'photo') return 'Pick up photograph';
    return 'Take ' + (Story.items[o.id] ? Story.items[o.id].name : o.id);
  },
  interact(o, W) { if (!o.taken) W.collect(o); },
  draw(o, ctx, cam, W) {
    if (o.taken) return;
    const x = o.x - cam.x, y = o.y - cam.y - 4 + Math.sin(W.time * 3 + o.bob) * 1;
    if (o.kind === 'rifle') { drawRect(ctx, x - 9, y - 1, 16, 2, '#5a3a1e'); drawRect(ctx, x - 1, y - 2, 9, 1, '#3a3a3a'); }
    else if (o.kind === 'pistol') { drawRect(ctx, x - 3, y - 2, 6, 2, '#2a2a2a'); drawRect(ctx, x - 3, y, 2, 3, '#4a3020'); }
    else if (o.kind === 'doc') { drawRect(ctx, x - 4, y - 5, 8, 6, '#e8e0c8'); drawRect(ctx, x - 3, y - 3, 6, 1, '#8a7a6a'); drawRect(ctx, x - 3, y - 1, 5, 1, '#8a7a6a'); }
    else if (o.kind === 'photo') { drawRect(ctx, x - 4, y - 5, 8, 7, '#f0ece0'); drawRect(ctx, x - 3, y - 4, 6, 4, '#6a5a4a'); }
    else if (o.kind === 'firecracker') { drawRect(ctx, x - 4, y - 4, 2, 5, '#d02020'); drawRect(ctx, x - 1, y - 4, 2, 5, '#d02020'); drawRect(ctx, x + 2, y - 4, 2, 5, '#d02020'); drawRect(ctx, x - 4, y - 5, 8, 1, '#e0c040'); }
    else if (o.kind === 'medicine') { drawRect(ctx, x - 4, y - 4, 8, 6, '#f0f0e8'); drawRect(ctx, x - 1, y - 3, 2, 4, '#c02020'); drawRect(ctx, x - 2, y - 2, 4, 2, '#c02020'); }
    else if (o.kind === 'disguise') { drawRect(ctx, x - 5, y - 4, 10, 6, o.color || '#8a7a48'); drawRect(ctx, x - 5, y - 4, 10, 1, U.shade(o.color || '#8a7a48', 0.2)); }
    else { drawRect(ctx, x - 3, y - 4, 6, 5, '#c8a040'); drawRect(ctx, x - 2, y - 3, 2, 2, '#fff0b0'); }
    // sparkle
    if (Math.floor(W.time * 3 + o.bob) % 3 === 0) { drawRect(ctx, x + 4, y - 7, 1, 1, '#fff'); }
  },
};

// ---------------- keypad / safe ------------------------------------------------------
ObjTypes.keypad = {
  init(o) { o.w = 8; o.h = 10; o.solved = false; },
  prompt(o) { return o.solved ? null : (o.label || 'Enter combination'); },
  interact(o, W) { if (!o.solved) Game.openKeypad(o); },
  draw(o, ctx, cam) {
    const x = o.x - cam.x, y = o.y - cam.y - 18;
    if (o.safe) {
      drawRect(ctx, x - 7, y + 4, 14, 14, '#3a3a40'); drawRect(ctx, x - 6, y + 5, 12, 12, '#4a4a52');
      ctx.fillStyle = '#b0a060'; ctx.beginPath(); ctx.arc(x, y + 11, 3, 0, Math.PI * 2); ctx.fill();
      drawRect(ctx, x + 4, y + 10, 1, 3, '#b0a060');
      if (o.solved) drawRect(ctx, x - 6, y + 5, 3, 12, '#1a1a1a');
    } else {
      drawRect(ctx, x - 3, y - 4, 7, 9, '#2a2a2a'); drawRect(ctx, x - 2, y - 3, 5, 2, o.solved ? '#40c060' : '#a03030');
      for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) drawRect(ctx, x - 2 + j * 3, y + i * 2, 2, 1, '#8a8a8a');
    }
  },
};

// ---------------- lever -----------------------------------------------------------------
ObjTypes.lever = {
  init(o) { o.w = 8; o.h = 12; o.on = false; },
  prompt(o) { return o.on ? 'Pull lever back' : 'Pull lever'; },
  interact(o, W) {
    o.on = !o.on; Sfx.play('click'); Sfx.play('door');
    for (const d of W.objects) if (d.type === 'door' && d.id === o.opens) d.setOpen(W, o.on);
    W.level.noise(o.x, o.y - 8, 70, 'lever', 'door');
  },
  draw(o, ctx, cam) {
    const x = o.x - cam.x, y = o.y - cam.y - 12;
    drawRect(ctx, x - 4, y + 4, 8, 6, '#4a4a4a');
    ctx.strokeStyle = '#8a8a8a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, y + 6); ctx.lineTo(x + (o.on ? 5 : -5), y - 2); ctx.stroke();
    drawRect(ctx, x + (o.on ? 4 : -6), y - 4, 3, 3, '#c02020');
  },
};

// ---------------- searchlight ---------------------------------------------------------------
ObjTypes.searchlight = {
  init(o) {
    o.w = 12; o.h = 40;
    o.a1 = o.a1 !== undefined ? o.a1 : 0.35; o.a2 = o.a2 !== undefined ? o.a2 : 1.35; // radians below horizontal (facing)
    o.dir = o.dir || -1; o.speed = o.speed || 0.35; o.len = o.len || 230; o.ang = o.a1; o.sweep = 1; o.half = 0.085;
    o.spotT = 0; o.on = true;
  },
  update(o, dt, W) {
    if (!o.on) return;
    o.ang += o.sweep * o.speed * dt;
    if (o.ang > o.a2) { o.ang = o.a2; o.sweep = -1; }
    if (o.ang < o.a1) { o.ang = o.a1; o.sweep = 1; }
    const p = W.player; if (p.dead || p.hidden) { o.spotT = 0; return; }
    const lx = o.x, ly = o.y - 40;
    const test = (tx, ty) => {
      const dx = tx - lx, dy = ty - ly; const d = Math.hypot(dx, dy);
      if (d > o.len || dx * o.dir < 0) return false;
      const a = Math.atan2(dy, Math.abs(dx));
      if (Math.abs(a - o.ang) > o.half + 6 / Math.max(d, 1)) return false;
      return W.level.los(lx, ly, tx, ty);
    };
    let hit = test(p.x, p.y - p.h + 2) || test(p.x, p.y - p.h / 2);
    if (p.inGrass && p.stance !== 'stand') hit = false;
    for (const f of W.followers) if (f.visible && !f.dead && test(f.x, f.y - f.h / 2)) hit = true;
    if (hit) { o.spotT += dt; if (o.spotT > 0.35 * W.diff.aim) W.spottedBySearchlight(o); } else o.spotT = Math.max(0, o.spotT - dt);
    for (const e of W.enemies) if (!e.alive && e.body && !e.body.hidden && !e.body.found && !e.body.dragged && test(e.x, e.y - 3)) { e.body.found = true; W.stats.bodies++; W.spottedBySearchlight(o, true, e); }
  },
  draw(o, ctx, cam) {
    const x = o.x - cam.x, y = o.y - cam.y;
    // tower
    drawRect(ctx, x - 6, y - 38, 12, 3, '#3a3a3a');
    for (const s of [-5, 4]) drawRect(ctx, x + s, y - 36, 2, 36, '#4a4038');
    for (let i = 0; i < 4; i++) { ctx.strokeStyle = '#4a4038'; ctx.beginPath(); ctx.moveTo(x - 5, y - 34 + i * 9); ctx.lineTo(x + 5, y - 26 + i * 9); ctx.stroke(); }
    drawRect(ctx, x - 3, y - 44, 7, 6, '#5a5a5a'); drawRect(ctx, x + (o.dir > 0 ? 3 : -4), y - 43, 2, 4, o.on ? '#fff8d0' : '#333');
  },
  beam(o, ctx, cam) {
    if (!o.on) return;
    const lx = o.x - cam.x, ly = o.y - 40 - cam.y;
    const a1 = o.ang - o.half, a2 = o.ang + o.half;
    ctx.beginPath(); ctx.moveTo(lx, ly);
    ctx.lineTo(lx + Math.cos(a1) * o.len * o.dir, ly + Math.sin(a1) * o.len);
    ctx.lineTo(lx + Math.cos(a2) * o.len * o.dir, ly + Math.sin(a2) * o.len);
    ctx.closePath();
  },
};

// ---------------- zones: trigger, hint, checkpoint, exit ------------------------------------
function zoneInit(o) { o.w = (o.tw || 1) * TILE; o.h = (o.th || 3) * TILE; o.zone = true; }
function inZone(o, p) { return p.x > o.x - o.w / 2 && p.x < o.x + o.w / 2 && p.y > o.y - o.h && p.y <= o.y + 2; }
ObjTypes.trigger = { init: zoneInit, update(o, dt, W) { if (o.fired && o.once !== false) return; if (inZone(o, W.player) && !W.player.dead && (!o.cond || Game.cond(o.cond))) { if (!o.inside) { o.inside = true; o.fired = true; W.runScene(o.scene, o); } } else o.inside = false; } };
ObjTypes.hint = { init: zoneInit, update(o, dt, W) { if (inZone(o, W.player) && (!o.cond || Game.cond(o.cond))) W.hintText = o.text; } };
ObjTypes.checkpoint = {
  init(o) { zoneInit(o); o.w = 24; o.h = 48; },
  update(o, dt, W) { if (!o.done && inZone(o, W.player) && !W.player.dead && !W.anyAlert()) { o.done = true; W.checkpoint(o); } },
  draw(o, ctx, cam, W) {
    const x = o.x - cam.x, y = o.y - cam.y;
    drawRect(ctx, x - 1, y - 22, 1, 22, '#3a2a1a');
    drawRect(ctx, x - 3, y - 24, 6, 7, o.done ? '#e03a2a' : '#6a3a2a');
    drawRect(ctx, x - 2, y - 25, 4, 1, '#d8b040');
    if (o.done) drawRect(ctx, x - 1, y - 22, 2, 3, '#ffb070');
  },
};
ObjTypes.exit = {
  init(o) { zoneInit(o); o.w = (o.tw || 1) * TILE; o.h = 48; },
  update(o, dt, W) {
    if (!inZone(o, W.player) || W.player.dead || W.player.hidden) { o.inside = false; return; }
    if (o.inside) return;
    o.inside = true;
    if (o.need && !Game.cond(o.need)) { W.toast(o.msg || 'You can\'t leave yet.'); return; }
    if (W.followers.some((f) => !f.dead && Math.hypot(f.x - W.player.x, f.y - W.player.y) > 90)) { W.toast('Wait for your companion.'); o.inside = false; return; }
    W.exitLevel(o);
  },
  draw(o, ctx, cam, W) {
    if (o.hidden) return;
    const x = o.x - cam.x, y = o.y - cam.y;
    const a = 0.35 + Math.sin(W.time * 3) * 0.2;
    ctx.fillStyle = `rgba(255,220,140,${a * 0.35})`;
    ctx.fillRect(x - o.w / 2, y - 40, o.w, 40);
    ctx.fillStyle = `rgba(255,230,160,${a})`;
    ctx.fillRect(x - 1, y - 48 + Math.sin(W.time * 3) * 2, 3, 3);
  },
};

// ---------------- readable / radio / npc-less interactions ---------------------------------------
ObjTypes.read = {
  init(o) { o.w = 10; o.h = 16; },
  prompt(o) { return o.label || 'Read'; },
  interact(o, W) { Game.showLetter(o.title, o.text, o.style); if (o.flag) Game.flags[o.flag] = true; },
  draw(o, ctx, cam) {
    const x = o.x - cam.x, y = o.y - cam.y;
    if (o.look === 'poster') { drawRect(ctx, x - 6, y - 30, 12, 16, '#d8c8a0'); drawRect(ctx, x - 5, y - 29, 10, 5, '#b02020'); drawRect(ctx, x - 4, y - 22, 8, 1, '#3a3a3a'); drawRect(ctx, x - 4, y - 20, 6, 1, '#3a3a3a'); drawRect(ctx, x - 4, y - 18, 7, 1, '#3a3a3a'); }
    else if (o.look === 'grave') { drawRect(ctx, x - 5, y - 14, 10, 14, '#6a6a6a'); drawRect(ctx, x - 4, y - 15, 8, 1, '#7a7a7a'); drawRect(ctx, x - 2, y - 11, 4, 1, '#3a3a3a'); drawRect(ctx, x - 2, y - 8, 4, 1, '#3a3a3a'); }
    else if (o.look === 'board') { drawRect(ctx, x - 8, y - 32, 16, 20, '#5a4028'); drawRect(ctx, x - 7, y - 31, 14, 18, '#c8b890'); for (let i = 0; i < 4; i++) drawRect(ctx, x - 5, y - 28 + i * 4, 9, 1, '#5a4a3a'); drawRect(ctx, x - 1, y - 12, 2, 12, '#5a4028'); }
    else { drawRect(ctx, x - 4, y - 18, 8, 5, '#e8e0c8'); drawRect(ctx, x - 3, y - 17, 6, 1, '#8a7a6a'); }
  },
};
ObjTypes.radio = {
  init(o) { o.w = 12; o.h = 10; o.idx = 0; },
  prompt() { return 'Listen to the radio'; },
  interact(o, W) {
    const lines = o.lines || Story.radio;
    const l = lines[o.idx % lines.length]; o.idx++;
    Sfx.play('click');
    W.toast('📻 ' + l, 7);
    W.level.noise(o.x, o.y - 8, 60, 'radio', 'radio');
  },
  draw(o, ctx, cam, W) {
    const x = o.x - cam.x, y = o.y - cam.y - 16;
    drawRect(ctx, x - 6, y - 6, 12, 8, '#6a4020'); drawRect(ctx, x - 5, y - 5, 5, 6, '#c8b080');
    ctx.fillStyle = '#3a2a1a'; ctx.beginPath(); ctx.arc(x + 3, y - 2, 2, 0, Math.PI * 2); ctx.fill();
    drawRect(ctx, x - 6, y + 2, 12, 2, W.level.theme.wood);
  },
};

// ---------------- decorations -------------------------------------------------------------------
ObjTypes.deco = {
  init(o) { o.w = 16; o.h = 16; },
  draw(o, ctx, cam, W) {
    const x = Math.round(o.x - cam.x), y = Math.round(o.y - cam.y), th = W.level.theme;
    const w = th.wood;
    switch (o.kind) {
      case 'bookshelf':
        drawRect(ctx, x - 8, y - 30, 16, 30, U.shade(w, -0.2));
        for (let s = 0; s < 4; s++) {
          drawRect(ctx, x - 7, y - 29 + s * 7, 14, 6, U.shade(w, -0.5));
          for (let b = 0; b < 6; b++) drawRect(ctx, x - 7 + b * 2 + (s % 2), y - 28 + s * 7 + (b % 2), 2, 5 - (b % 2), ['#8a2a2a', '#2a4a6a', '#6a5a2a', '#3a5a3a', '#7a6a5a'][(b + s) % 5]);
        }
        break;
      case 'table':
        drawRect(ctx, x - 10, y - 11, 20, 2, w); drawRect(ctx, x - 9, y - 9, 2, 9, U.shade(w, -0.2)); drawRect(ctx, x + 7, y - 9, 2, 9, U.shade(w, -0.2));
        drawRect(ctx, x - 4, y - 14, 3, 3, '#e8e0d0'); drawRect(ctx, x + 2, y - 13, 4, 2, '#4a6a5a');
        break;
      case 'desk':
        drawRect(ctx, x - 12, y - 12, 24, 3, w); drawRect(ctx, x - 12, y - 9, 8, 9, U.shade(w, -0.15)); drawRect(ctx, x + 9, y - 9, 3, 9, U.shade(w, -0.2));
        drawRect(ctx, x - 11, y - 7, 6, 1, '#b0a060'); drawRect(ctx, x - 11, y - 3, 6, 1, '#b0a060');
        drawRect(ctx, x + 2, y - 15, 6, 3, '#e8e0c8'); drawRect(ctx, x - 6, y - 19, 1, 7, '#2a2a2a'); drawRect(ctx, x - 8, y - 20, 5, 2, '#2a6a3a');
        break;
      case 'plant':
        drawRect(ctx, x - 3, y - 6, 6, 6, '#8a4a2a');
        for (let i = 0; i < 5; i++) drawRect(ctx, x - 5 + i * 2, y - 13 + (i % 2) * 2, 2, 7, i % 2 ? '#3a6a3a' : '#4a7a3a');
        break;
      case 'painting':
        drawRect(ctx, x - 7, y - 30, 14, 10, '#b89040'); drawRect(ctx, x - 6, y - 29, 12, 8, '#d8d0b8');
        drawRect(ctx, x - 4, y - 26, 3, 4, '#3a4a3a'); drawRect(ctx, x, y - 27, 4, 5, '#5a6a5a'); drawRect(ctx, x - 5, y - 23, 10, 1, '#6a7a8a');
        break;
      case 'sunyatsen': // portrait of Sun Yat-sen with party flag
        drawRect(ctx, x - 7, y - 34, 14, 16, '#b89040'); drawRect(ctx, x - 6, y - 33, 12, 14, '#d8ccb0');
        drawRect(ctx, x - 2, y - 31, 4, 5, '#c8a888'); drawRect(ctx, x - 2, y - 32, 4, 1, '#3a3a3a'); drawRect(ctx, x - 1, y - 28, 2, 1, '#3a3a3a');
        drawRect(ctx, x - 4, y - 25, 8, 6, '#3a3a3a');
        break;
      case 'flag_roc': // Blue Sky, White Sun, Red Earth
        drawRect(ctx, x - 1, y - 40, 1, 40, '#6a5a4a');
        drawRect(ctx, x, y - 40, 16, 11, '#c82020'); drawRect(ctx, x, y - 40, 8, 6, '#1a3a9a'); drawRect(ctx, x + 3, y - 38, 2, 2, '#f0f0f0');
        break;
      case 'flag_jp':
        drawRect(ctx, x - 1, y - 40, 1, 40, '#6a5a4a');
        drawRect(ctx, x, y - 40, 16, 11, '#f0f0ea'); ctx.fillStyle = '#c01818'; ctx.beginPath(); ctx.arc(x + 8, y - 34.5, 3, 0, Math.PI * 2); ctx.fill();
        break;
      case 'flag_wang': // puppet regime flag: ROC flag with yellow pennant
        drawRect(ctx, x - 1, y - 40, 1, 40, '#6a5a4a');
        drawRect(ctx, x, y - 40, 16, 11, '#c82020'); drawRect(ctx, x, y - 40, 8, 6, '#1a3a9a'); drawRect(ctx, x + 3, y - 38, 2, 2, '#f0f0f0');
        ctx.fillStyle = '#e0c030'; ctx.beginPath(); ctx.moveTo(x, y - 42); ctx.lineTo(x + 12, y - 44); ctx.lineTo(x, y - 46); ctx.fill();
        break;
      case 'flag_red':
        drawRect(ctx, x - 1, y - 40, 1, 40, '#6a5a4a'); drawRect(ctx, x, y - 40, 16, 11, '#c02020'); drawRect(ctx, x + 2, y - 38, 3, 3, '#e8c040');
        break;
      case 'bed':
        drawRect(ctx, x - 14, y - 8, 28, 4, w); drawRect(ctx, x - 14, y - 4, 2, 4, w); drawRect(ctx, x + 12, y - 4, 2, 4, w);
        drawRect(ctx, x - 13, y - 11, 26, 3, '#d8d0c0'); drawRect(ctx, x - 13, y - 12, 6, 3, '#f0ece0'); drawRect(ctx, x - 5, y - 11, 18, 3, '#6a4a6a');
        break;
      case 'kang': // heated brick bed (Yan'an caves)
        drawRect(ctx, x - 16, y - 9, 32, 9, '#8a6a4a'); drawRect(ctx, x - 16, y - 9, 32, 1, '#aa8a6a'); drawRect(ctx, x - 14, y - 11, 20, 2, '#b04040'); drawRect(ctx, x - 14, y - 11, 5, 2, '#e0d0b0');
        break;
      case 'chair':
        drawRect(ctx, x - 4, y - 7, 8, 2, w); drawRect(ctx, x - 4, y - 5, 1, 5, w); drawRect(ctx, x + 3, y - 5, 1, 5, w); drawRect(ctx, x + 3, y - 15, 1, 8, w);
        break;
      case 'barrel':
        drawRect(ctx, x - 5, y - 14, 10, 14, '#5a3a20'); drawRect(ctx, x - 5, y - 11, 10, 1, '#2a2a2a'); drawRect(ctx, x - 5, y - 4, 10, 1, '#2a2a2a');
        break;
      case 'crates':
        drawRect(ctx, x - 8, y - 12, 16, 12, U.shade(w, -0.1)); drawRect(ctx, x - 8, y - 12, 16, 1, U.shade(w, 0.2)); drawRect(ctx, x - 1, y - 12, 1, 12, U.shade(w, -0.4));
        break;
      case 'pillar':
        drawRect(ctx, x - 4, y - 64, 8, 64, th.pillar || '#8a1a14'); drawRect(ctx, x - 3, y - 64, 2, 64, U.shade(th.pillar || '#8a1a14', 0.25)); drawRect(ctx, x - 6, y - 4, 12, 4, '#8a8278');
        break;
      case 'stove':
        drawRect(ctx, x - 8, y - 12, 16, 12, '#4a4440'); drawRect(ctx, x - 5, y - 8, 10, 5, '#1a1410'); drawRect(ctx, x - 4, y - 6, 8, 2, '#e06020'); drawRect(ctx, x - 3, y - 18, 3, 6, '#3a3430');
        break;
      case 'seats': // train bench
        drawRect(ctx, x - 12, y - 8, 24, 3, th.seat || '#3a5a4a'); drawRect(ctx, x - 12, y - 20, 3, 15, th.seat || '#3a5a4a'); drawRect(ctx, x - 12, y - 20, 3, 1, U.shade(th.seat || '#3a5a4a', 0.2)); drawRect(ctx, x - 10, y - 5, 2, 5, '#2a2a2a'); drawRect(ctx, x + 8, y - 5, 2, 5, '#2a2a2a');
        break;
      case 'piano':
        drawRect(ctx, x - 14, y - 16, 28, 12, '#101010'); drawRect(ctx, x - 13, y - 8, 26, 2, '#f0f0f0'); for (let i = 0; i < 9; i++) drawRect(ctx, x - 12 + i * 3, y - 8, 1, 1, '#101010'); drawRect(ctx, x - 12, y - 4, 2, 4, '#101010'); drawRect(ctx, x + 10, y - 4, 2, 4, '#101010');
        break;
      case 'bar':
        drawRect(ctx, x - 16, y - 14, 32, 14, '#3a1a10'); drawRect(ctx, x - 16, y - 14, 32, 2, '#c8a040');
        for (let i = 0; i < 6; i++) drawRect(ctx, x - 14 + i * 5, y - 20, 2, 6, ['#3a6a3a', '#8a2a2a', '#c8a040'][i % 3]);
        break;
      case 'cell':
        for (let i = 0; i < 6; i++) drawRect(ctx, x - 8 + i * 3, y - 32, 1, 32, '#5a5a60');
        drawRect(ctx, x - 8, y - 32, 16, 1, '#5a5a60'); drawRect(ctx, x - 8, y - 16, 16, 1, '#5a5a60');
        break;
      case 'mao_desk': // simple desk with oil lamp & papers
        drawRect(ctx, x - 12, y - 11, 24, 2, '#6a4a2a'); drawRect(ctx, x - 11, y - 9, 2, 9, '#5a3a1a'); drawRect(ctx, x + 9, y - 9, 2, 9, '#5a3a1a');
        drawRect(ctx, x - 8, y - 13, 10, 2, '#e8e0c8'); drawRect(ctx, x + 4, y - 16, 3, 5, '#8a6a3a'); drawRect(ctx, x + 5, y - 18, 1, 2, '#ffd060');
        break;
      case 'rails':
        drawRect(ctx, x - 8, y - 2, 16, 1, '#8a8a90'); drawRect(ctx, x - 6, y - 1, 3, 1, '#4a3020'); drawRect(ctx, x + 3, y - 1, 3, 1, '#4a3020');
        break;
      case 'sign':
        drawRect(ctx, x - 1, y - 20, 2, 20, '#4a3a2a'); drawRect(ctx, x - 9, y - 26, 18, 8, o.color || '#e8e0c8');
        ctx.fillStyle = '#2a2a2a'; ctx.font = '5px monospace'; ctx.textAlign = 'center'; ctx.fillText(o.text || '', x, y - 20); ctx.textAlign = 'left';
        break;
      case 'banner':
        drawRect(ctx, x - 3, y - 44, 6, 26, o.color || '#b02020'); drawRect(ctx, x - 3, y - 44, 6, 1, '#e0c040');
        for (let i = 0; i < 4; i++) drawRect(ctx, x - 1, y - 41 + i * 6, 2, 3, '#e8d890');
        break;
      case 'boat':
        ctx.fillStyle = '#4a3020'; ctx.beginPath(); ctx.moveTo(x - 30, y - 10); ctx.lineTo(x + 30, y - 10); ctx.lineTo(x + 22, y); ctx.lineTo(x - 22, y); ctx.fill();
        drawRect(ctx, x - 1, y - 44, 2, 34, '#3a2a1a');
        ctx.fillStyle = '#b89a6a'; ctx.beginPath(); ctx.moveTo(x + 1, y - 42); ctx.lineTo(x + 20, y - 14); ctx.lineTo(x + 1, y - 14); ctx.fill();
        for (let i = 0; i < 4; i++) drawRect(ctx, x + 2, y - 38 + i * 7, 14 - i * 2, 1, '#8a6a4a');
        break;
      case 'truck':
        drawRect(ctx, x - 24, y - 20, 34, 14, '#5a5a3a'); drawRect(ctx, x + 10, y - 16, 12, 10, '#4a4a30'); drawRect(ctx, x + 14, y - 14, 6, 4, '#8aa0b0');
        for (const wx of [-16, 14]) { ctx.fillStyle = '#1a1a1a'; ctx.beginPath(); ctx.arc(x + wx, y - 5, 5, 0, Math.PI * 2); ctx.fill(); }
        break;
      case 'mound':
        ctx.fillStyle = W.level.theme.ground; ctx.beginPath(); ctx.ellipse(x, y, 16, 7, 0, Math.PI, 0); ctx.fill();
        break;
      case 'lamp_desk':
        drawRect(ctx, x - 1, y - 8, 2, 8, '#3a3a3a'); drawRect(ctx, x - 4, y - 11, 8, 3, '#2a6a3a');
        break;
      default:
        drawRect(ctx, x - 4, y - 8, 8, 8, '#6a6a6a');
    }
  },
};

// ---------------- train tunnels (roof hazard) -------------------------------------------------
ObjTypes.tunnels = {
  init(o) { o.t = 0; o.phase = 'clear'; o.period = o.period || 11; o.warn = 2.4; o.dur = 2.6; o.roofY = o.roofY; },
  update(o, dt, W) {
    o.t += dt;
    const cyc = o.t % o.period;
    const prev = o.phase;
    if (cyc < o.period - o.warn - o.dur) o.phase = 'clear';
    else if (cyc < o.period - o.dur) o.phase = 'warn';
    else o.phase = 'tunnel';
    if (o.phase === 'warn' && prev !== 'warn') { Sfx.play('whistle'); }
    const p = W.player;
    if (o.phase === 'warn' && p.y <= o.roofY + 2) W.hintText = 'TUNNEL AHEAD — GET DOWN! [C] crouch / [Z] prone';
    if (o.phase === 'tunnel') {
      W.level.amb = 0.05;
      if (!p.dead && p.y <= o.roofY + 2 && p.stance === 'stand' && !p.hidden && !p.onLadder) W.killPlayer('tunnel');
      for (const f of W.followers) if (!f.dead && f.y <= o.roofY + 2 && f.stance === 'stand') { f.stance = 'crouch'; }
    } else W.level.amb = W.level.def.amb;
  },
  draw(o, ctx, cam, W) {
    if (o.phase !== 'tunnel') return;
    const cyc = (o.t % o.period) - (o.period - o.dur);
    const k = cyc / o.dur;
    ctx.fillStyle = 'rgba(10,8,8,0.92)';
    const edgeIn = Math.min(1, cyc * 5), edgeOut = Math.min(1, (o.dur - cyc) * 5);
    const x1 = VW * (1 - edgeIn), x2 = VW * edgeOut;
    ctx.fillRect(Math.min(x1, VW), 0, Math.max(0, x2 - x1 + VW * (edgeIn >= 1 ? 1 : 0)), o.roofY - cam.y - 10);
    ctx.fillRect(0, 0, VW, Math.max(0, o.roofY - cam.y - 28));
    // tunnel lights
    for (let i = 0; i < 6; i++) { const lx = (((i * 97 - W.time * 400) % VW) + VW) % VW; ctx.fillStyle = '#ffd080'; ctx.fillRect(lx, o.roofY - cam.y - 34, 3, 2); }
    void k;
  },
};

// ---------------------------------------------------------------------------
// Projectiles: stones & firecrackers
class Projectile {
  constructor(kind, x, y, vx, vy) { this.kind = kind; this.x = x; this.y = y; this.vx = vx; this.vy = vy; this.dead = false; this.landed = false; this.t = 0; this.pops = 0; }
  update(dt, W) {
    const L = W.level;
    this.t += dt;
    if (!this.landed) {
      this.vy += GRAV * 0.8 * dt;
      const nx = this.x + this.vx * dt, ny = this.y + this.vy * dt;
      const t1 = L.typeAt(nx, ny);
      if (t1 === T.SOLID || (t1 === T.ONEWAY && this.vy > 0 && L.typeAt(this.x, this.y) !== T.ONEWAY) || this.t > 4 || ny > L.ph) {
        this.landed = true;
        if (L.typeAt(this.x, ny) === T.SOLID) this.y = Math.floor(ny / TILE) * TILE - 1;
        if (this.kind === 'stone') {
          Sfx.play('stone');
          L.noise(this.x, this.y, 125, 'stone', 'stone');
          W.fx.dust(this.x, this.y, 3);
          this.dead = true;
        }
      } else if (W.enemies.some((e) => e.alive && Math.abs(e.x - nx) < 5 && ny > e.y - e.h && ny < e.y)) {
        // bonk: hitting a soldier with a stone alerts him but doesn't hurt
        const e = W.enemies.find((q) => q.alive && Math.abs(q.x - nx) < 5 && ny > q.y - q.h && ny < q.y);
        e.lastSeen = { x: W.player.x, y: W.player.y };
        e.sus = Math.max(e.sus, 0.8); e.facing = W.player.x > e.x ? 1 : -1;
        e.target = { x: W.player.x, y: W.player.y }; e.setState('investigate', W);
        W.bark(e, 'Ow! Who threw that?!');
        this.landed = true; this.dead = true; Sfx.play('stone');
      } else { this.x = nx; this.y = ny; }
    } else if (this.kind === 'firecracker') {
      if (this.t > this.pops * 0.35 + (this.fuseT || 0) && this.pops < 8) {
        if (this.pops === 0) { this.fuseT = this.t; Sfx.play('firecracker'); }
        this.pops++;
        L.noise(this.x, this.y - 4, 240, 'firecracker', 'firecracker');
        W.fx.spark(this.x + U.rand(-4, 4), this.y - 3); W.fx.spark(this.x + U.rand(-4, 4), this.y - 5);
        L.flash = 0.15;
      }
      if (this.pops >= 8) this.dead = true;
    }
  }
  draw(ctx, cam) {
    const x = this.x - cam.x, y = this.y - cam.y;
    if (this.kind === 'stone') drawRect(ctx, x - 1, y - 1, 2, 2, '#aaa49a');
    else { drawRect(ctx, x - 2, y - 2, 4, 2, '#d02020'); if (!this.landed || this.pops === 0) drawRect(ctx, x + 1, y - 3, 1, 1, '#ffd060'); }
  }
}

// ---------------------------------------------------------------------------
// Visual effects
class FX {
  constructor() { this.parts = []; this.rings = []; this.tracers = []; this.flashes = []; }
  clear() { this.parts.length = 0; this.rings.length = 0; this.tracers.length = 0; this.flashes.length = 0; }
  ring(x, y, r, kind) {
    if (r < 8) return;
    const col = kind === 'gunshot' ? '255,80,60' : kind === 'shout' || kind === 'scream' ? '255,150,80' : kind === 'firecracker' ? '255,200,80' : kind === 'stone' ? '200,220,255' : '220,220,200';
    this.rings.push({ x, y, r: 2, max: r, life: 1, col });
  }
  dust(x, y, n) { for (let i = 0; i < n; i++) this.parts.push({ x, y: y - 1, vx: U.rand(-20, 20), vy: U.rand(-25, -5), life: 0.5, max: 0.5, col: '#9a9080', s: 1, g: 60 }); }
  blood(x, y, dir) { for (let i = 0; i < 10; i++) this.parts.push({ x, y, vx: dir * U.rand(10, 60), vy: U.rand(-50, 0), life: 0.8, max: 0.8, col: '#8a1010', s: 1, g: 300, stick: true }); }
  spark(x, y) { this.parts.push({ x, y, vx: U.rand(-30, 30), vy: U.rand(-60, -10), life: 0.5, max: 0.5, col: U.pick(['#ffd060', '#ff8030', '#fff0a0']), s: 1, g: 120 }); }
  muzzle(x, y, dir) { this.flashes.push({ x, y, dir, life: 0.08 }); for (let i = 0; i < 4; i++) this.spark(x, y); }
  tracer(x1, y1, x2, y2) { this.tracers.push({ x1, y1, x2, y2, life: 0.1 }); }
  update(dt, W) {
    for (const p of this.parts) {
      p.life -= dt;
      if (p.stuck) continue;
      p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.stick && W.level.typeAt(p.x, p.y) === T.SOLID) { p.stuck = true; p.life = 12; p.max = 12; }
    }
    this.parts = this.parts.filter((p) => p.life > 0);
    for (const r of this.rings) { r.r += (r.max - r.r) * dt * 5 + 30 * dt; r.life -= dt * 1.6; }
    this.rings = this.rings.filter((r) => r.life > 0 && r.r < r.max + 5);
    for (const t of this.tracers) t.life -= dt;
    this.tracers = this.tracers.filter((t) => t.life > 0);
    for (const f of this.flashes) f.life -= dt;
    this.flashes = this.flashes.filter((f) => f.life > 0);
  }
  draw(ctx, cam, showRings) {
    for (const p of this.parts) {
      ctx.globalAlpha = Math.min(1, p.life / p.max * 1.5);
      ctx.fillStyle = p.col; ctx.fillRect(Math.round(p.x - cam.x), Math.round(p.y - cam.y), p.s, p.s);
    }
    ctx.globalAlpha = 1;
    if (showRings) {
      for (const r of this.rings) {
        ctx.strokeStyle = `rgba(${r.col},${r.life * 0.35})`; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(r.x - cam.x, r.y - cam.y, r.r, 0, Math.PI * 2); ctx.stroke();
      }
    }
    for (const t of this.tracers) {
      ctx.strokeStyle = `rgba(255,230,160,${t.life * 8})`; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(t.x1 - cam.x, t.y1 - cam.y); ctx.lineTo(t.x2 - cam.x, t.y2 - cam.y); ctx.stroke();
    }
    for (const f of this.flashes) {
      ctx.fillStyle = '#fff4c0'; ctx.fillRect(f.x - cam.x - 2, f.y - cam.y - 2, 5, 4);
      ctx.fillStyle = 'rgba(255,200,80,0.5)'; ctx.fillRect(f.x - cam.x - 4 + f.dir * 3, f.y - cam.y - 3, 7, 6);
    }
  }
}
