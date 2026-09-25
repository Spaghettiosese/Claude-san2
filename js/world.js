'use strict';
// ---------------------------------------------------------------------------
// World: one playable level instance. Owns the actors, objects and rules of
// stealth: detection, takedowns, bodies, alarms, checkpoints, rendering.
// ---------------------------------------------------------------------------
const FACTION_ROLES = {
  jp: { S: 'soldier', V: 'sentry', O: 'officer', K: 'kempei' },
  kmt: { S: 'kmt', V: 'kmt', O: 'kmt_mp', K: 'kmt_mp' },
  puppet: { S: 'puppet', V: 'puppet', O: 'agent', K: 'agent' },
  ccp: { S: 'ccp', V: 'ccp', O: 'ccp', K: 'ccp' },
};
const DEFAULT_MARKS = {
  P: { type: 'player' }, X: { type: 'checkpoint' }, E: { type: 'exit' },
  C: { type: 'closet' }, Y: { type: 'pile' }, U: { type: 'curtain' },
  l: { type: 'lamp' }, L: { type: 'streetlamp' }, h: { type: 'lantern' }, u: { type: 'candle' }, '*': { type: 'fire' },
  F: { type: 'fuse' }, A: { type: 'alarm' }, D: { type: 'door' }, Z: { type: 'searchlight' },
  R: { type: 'pickup', kind: 'rifle' }, p: { type: 'pickup', kind: 'pistol' }, '!': { type: 'pickup', kind: 'firecracker', id: 'firecracker' },
  S: { type: 'enemy', role: 'S' }, V: { type: 'enemy', role: 'V', stationary: true }, O: { type: 'enemy', role: 'O' }, K: { type: 'enemy', role: 'K' }, J: { type: 'enemy', kind: 'dog' },
  N: { type: 'civ', wander: true }, M: { type: 'civ', wander: false },
  b: { type: 'deco', kind: 'bookshelf' }, t: { type: 'deco', kind: 'table' }, k: { type: 'deco', kind: 'desk' }, q: { type: 'deco', kind: 'plant' },
  f: { type: 'deco', kind: 'painting' }, e: { type: 'deco', kind: 'bed' }, y: { type: 'deco', kind: 'chair' }, z: { type: 'deco', kind: 'barrel' },
  i: { type: 'deco', kind: 'pillar' }, n: { type: 'deco', kind: 'seats' }, d: { type: 'deco', kind: 'crates' }, '%': { type: 'deco', kind: 'kang' },
  '&': { type: 'deco', kind: 'sunyatsen' }, w: { type: 'radio' }, a: { type: 'deco', kind: 'flag' }, j: { type: 'deco', kind: 'rails' },
};

class World {
  constructor(def, snapshot) {
    this.def = def;
    this.level = new Level(def);
    this.enemies = []; this.npcs = []; this.objects = []; this.followers = [];
    this.projectiles = []; this.fx = new FX(); this.barks = []; this.footprints = [];
    this.time = 0; this.cam = { x: 0, y: 0 }; this.shake = 0;
    this.stats = { kills: 0, kos: 0, alerts: 0, bodies: 0, time: 0, shots: 0, spotted: 0, sabotage: 0 };
    this.lines = Object.assign({
      alert: ['Intruder!', 'Halt! Who goes there?!', 'Over there!', 'Stop right there!', 'Enemy!'],
      hear: ['What was that?', 'Hm? Who\'s there?', 'Did you hear that?', 'Something moved...'],
      giveup: ['Must have been a cat.', 'Nothing. Back to post.', 'Just rats...', 'Keep your eyes open.'],
    }, def.lines || {});
    this.diff = Game.difficulty();
    this.hintText = null; this.focus = null; this.takedown = null;
    this.darkC = U.canvas(VW, VH);
    this.weather = [];
    this.alertMusicT = 0;
    this.deathT = -1;
    this.build();
    if (snapshot) this.restore(snapshot);
    this.camSnap();
    if (def.onStart) def.onStart(this);
  }

  // ------------------------------------------------------------------ build
  build() {
    const L = this.level, def = this.def;
    const counts = {};
    let player = null;
    const roles = FACTION_ROLES[def.faction || 'jp'];
    const spawn = (spec, c, r) => {
      const x = c * TILE + 8 + (spec.dx || 0), y = (r + 1) * TILE;
      spec = Object.assign({}, spec);
      if (spec.cond && !Game.cond(spec.cond)) return;
      if (spec.type === 'player') { player = { x, y }; return; }
      if (spec.type === 'enemy') {
        const kind = spec.kind || roles[spec.role] || 'soldier';
        const e = new Enemy(kind, x, y, Object.assign({ nonlethal: !!def.nonlethal, talk: def.talk }, spec));
        e.world = this; e.markIndex = this.enemies.length;
        if (spec.patrolTiles) e.range = spec.patrolTiles;
        e.initPatrol(L);
        if (def.enemyPal && !spec.pal && e.kind !== 'dog') e.pal = def.enemyPal[e.kind] || e.pal;
        this.enemies.push(e);
        return;
      }
      if (spec.type === 'civ' || spec.type === 'npc') { this.npcs.push(new Civilian(x, y, spec)); return; }
      if (spec.type === 'follower') { this.followers.push(new Follower(x, y, spec)); return; }
      if (spec.type === 'deco' && spec.kind === 'flag') spec.kind = { jp: 'flag_jp', kmt: 'flag_roc', puppet: 'flag_wang', ccp: 'flag_red' }[def.faction || 'jp'];
      const o = this.makeObj(spec, x, y);
      if (o) this.objects.push(o);
    };
    for (const m of L.marks) {
      let spec = def.marks && def.marks[m.ch];
      if (Array.isArray(spec)) { const i = counts[m.ch] || 0; counts[m.ch] = i + 1; spec = spec[Math.min(i, spec.length - 1)]; }
      if (!spec) spec = DEFAULT_MARKS[m.ch];
      if (!spec) { console.warn('Unknown map mark', m.ch, 'at', m.c, m.r, def.id); continue; }
      spawn(spec, m.c, m.r);
    }
    for (const en of def.entities || []) spawn(en.spec, en.c, en.r);
    const start = player || { x: 40, y: 64 };
    const look = Game.flags.lanLook && Pals[Game.flags.lanLook] && !def.outfit ? Game.flags.lanLook : 'lan';
    this.player = new Player(start.x, start.y, Game.flags.outfit || def.outfit || look);
    this.player.disguise = !!def.disguise && !!(def.outfit || Game.flags.outfit);
    if (Game.state.gun && def.guns !== false) this.player.gun = Object.assign({}, Game.state.gun);
    for (const f of this.followers) { f.x = start.x - 12; f.y = start.y; }
    this.weatherInit();
  }
  makeObj(spec, x, y) {
    const ty = ObjTypes[spec.type];
    if (!ty) { console.warn('Unknown object', spec.type); return null; }
    const o = Object.assign({}, spec, { x, y });
    if (ty.methods) Object.assign(o, ty.methods);
    if (ty.init) ty.init(o, this);
    o.idx = this.objects.length;
    return o;
  }

  // ---------------------------------------------------------- snapshots
  snapshot() {
    return {
      px: this.player.x, py: this.player.y,
      gun: this.player.gun ? Object.assign({}, this.player.gun) : null,
      objs: this.objects.map((o) => ({ fired: o.fired, done: o.done, taken: o.taken, open: o.open, locked: o.locked, on: o.on, disabled: o.disabled, solved: o.solved, occupant: o.occupant && o.occupant !== 'player' ? o.occupant.markIndex : null, hidden: o.hidden })),
      enemies: this.enemies.map((e) => ({ dead: e.dead, ko: e.ko, x: e.x, y: e.y, hidden: e.body && e.body.hidden, found: e.body && e.body.found, removed: e.removed, carry: e.carry || null, passive: e.passive })),
      npcs: this.npcs.map((n) => ({ x: n.x, y: n.y, removed: n.removed, talked: n.talked, pickpocket: n.pickpocket || null })),
      followers: this.followers.filter((f) => !f.dead).map((f) => ({ id: f.id, pal: f.pal, name: f.name, slow: f.slow, waiting: f.waiting })),
      stats: Object.assign({}, this.stats),
      game: Game.stateSnapshot(),
      extra: this.def.snapshot ? this.def.snapshot(this) : null,
    };
  }
  restore(s) {
    Game.stateRestore(s.game);
    this.player.x = s.px; this.player.y = s.py;
    this.player.gun = s.gun;
    s.objs.forEach((st, i) => {
      const o = this.objects[i]; if (!o) return;
      for (const k of ['fired', 'done', 'taken', 'locked', 'solved', 'hidden']) if (st[k] !== undefined) o[k] = st[k];
      if (o.type === 'door' && st.open !== undefined) { o.open = st.open; o.sync(this); }
      if (o.type === 'fuse' && st.on === false) { o.on = false; for (const l of this.level.lights) if (l.group === o.group) l.on = false; }
      if (o.type === 'alarm' && st.disabled) o.disabled = true;
    });
    s.enemies.forEach((st, i) => {
      const e = this.enemies[i]; if (!e) return;
      if (st.removed) { e.removed = true; }
      e.carry = st.carry; e.passive = st.passive;
      if (st.dead || st.ko) {
        e.dead = st.dead; e.ko = st.ko; e.x = st.x; e.y = st.y;
        e.body = { hidden: st.hidden, found: true, dragged: false };
      }
    });
    this.enemies = this.enemies.filter((e) => !e.removed);
    s.objs.forEach((st, i) => { if (st.occupant !== null && st.occupant !== undefined) { const e = this.enemies.find((q) => q.markIndex === st.occupant); if (e) { this.objects[i].occupant = e; e.body.hidden = true; } } });
    s.npcs.forEach((st, i) => { const n = this.npcs[i]; if (!n) return; n.removed = st.removed; n.talked = st.talked; n.pickpocket = st.pickpocket; if (st.y !== undefined) { n.x = st.x; n.y = st.y; } });
    this.followers = s.followers.map((st) => { const f = new Follower(s.px - 10, s.py, st); f.waiting = st.waiting; return f; });
    for (const n of this.npcs) if (this.followers.some((f) => f.id === n.id)) n.removed = true;
    this.stats = Object.assign({}, s.stats);
    if (this.def.restore && s.extra) this.def.restore(this, s.extra);
  }

  // ------------------------------------------------------------------ helpers
  has(id) { return Game.has(id); }
  toast(text, t = 3.5) { Game.toast(text, t); }
  bark(actor, text, quiet) {
    if (!text) return;
    if (quiet && Math.hypot(actor.x - this.player.x, actor.y - this.player.y) > 220) return;
    this.barks = this.barks.filter((b) => b.actor !== actor);
    this.barks.push({ actor, text, t: 2.6 });
  }
  anyAlert() { return this.level.alarm || this.enemies.some((e) => e.alive && (e.state === 'alert' || e.state === 'toAlarm' || e.state === 'ringing')); }
  anySearch() { return this.enemies.some((e) => e.alive && (e.state === 'search' || e.state === 'investigate' || e.state === 'look' || e.state === 'lookaround')); }
  doorAt(x, y) {
    for (const o of this.objects) if (o.type === 'door' && Math.abs(o.x - x) < 7 && y > o.y - 32 && y < o.y) return o;
    return null;
  }
  inRestricted(x) {
    const r = this.def.restricted; if (!r) return false;
    const c = x / TILE;
    return r.some(([a, b]) => c >= a && c <= b);
  }
  disguiseBlown() { return !!this.disguiseBurned; }
  footprint(x, y, dir) {
    this.footprints.push({ x, y, dir, t: 0, seen: false });
    if (this.footprints.length > 80) this.footprints.shift();
  }
  camSnap() { this.updateCamera(1, true); }

  // ------------------------------------------------------------------ main update
  update(dt) {
    const p = this.player, L = this.level;
    this.time += dt;
    if (!p.dead) this.stats.time += dt;
    this.hintText = null;
    L.flash = Math.max(0, (L.flash || 0) - dt * 2);
    for (const l of L.lights) if (l.flicker) l.i = (l.i0 || (l.i0 = l.i)) * (0.85 + Math.random() * 0.15);

    if (!p.dead) {
      p.update(dt, this);
      this.handleActions();
    } else {
      this.deathT += dt;
      if (this.deathT > 1.6 && !this.deathReported) { this.deathReported = true; Game.onPlayerDeath(this.deathReason, this.deathBy); }
    }
    for (const f of this.followers) f.update(dt, this);
    for (const e of this.enemies) e.update(dt, this);
    for (const n of this.npcs) if (!n.removed) n.update(dt, this);
    for (const o of this.objects) { const ty = ObjTypes[o.type]; if (ty.update) ty.update(o, dt, this); }
    for (const pr of this.projectiles) pr.update(dt, this);
    this.projectiles = this.projectiles.filter((q) => !q.dead);
    // dragged body follows
    if (p.drag) { const e = p.drag.enemy; e.x = p.x - p.facing * 14; e.y = p.y; }
    // noises expire after one frame of processing
    for (const n of L.noises) n.t += dt;
    L.noises = L.noises.filter((n) => n.t <= 0);
    this.fx.update(dt, this);
    for (const b of this.barks) b.t -= dt;
    this.barks = this.barks.filter((b) => b.t > 0);
    for (const f of this.footprints) f.t += dt;
    this.footprints = this.footprints.filter((f) => f.t < 45);
    this.checkFootprints(dt);
    this.updateMusic(dt);
    this.updateAlarm(dt);
    if (this.def.onUpdate) this.def.onUpdate(this, dt);
    this.updateCamera(dt);
    this.updateWeather(dt);
    this.shake = Math.max(0, this.shake - dt * 3);
  }

  updateMusic(dt) {
    const alert = this.anyAlert();
    if (alert) this.alertMusicT = 5;
    else this.alertMusicT -= dt;
    const want = this.alertMusicT > 0 ? 'alert' : (this.anySearch() ? 'tense' : (this.def.music || 'stealth'));
    if (Game.state_ === 'play' && Music.mood !== want && !this.musicLock) Music.play(want);
  }
  updateAlarm(dt) {
    const L = this.level;
    if (!L.alarm) return;
    this.alarmT = (this.alarmT || 0) + dt;
    if (this.def.alarmFail && !this.failing && this.alarmT > 1.4) { this.failing = true; Game.fail(this.def.alarmFailText || 'The alarm was raised. With the whole compound roused, there is no way through.'); }
    if (!this.def.alarmFail && this.alarmT > 35 && !this.anyAlert()) {
      L.alarm = false; this.alarmT = 0; Sfx.siren(false);
      for (const o of this.objects) if (o.type === 'alarm') o.ringing = false;
    }
  }
  raiseAlarm() {
    const L = this.level;
    if (L.alarm) return;
    L.alarm = true; this.alarmT = 0;
    Sfx.siren(true); Sfx.play('bell');
    this.toast('THE ALARM HAS BEEN RAISED!', 3);
    this.shake = 0.5;
    const p = this.player;
    for (const e of this.enemies) if (e.alive) { e.wary = true; e.becomeAlert(this, { x: p.x, y: p.y }); }
    if (!this.def.alarmFail && this.def.reinforce) {
      for (const r of this.def.reinforce) {
        const e = new Enemy(r.kind || FACTION_ROLES[this.def.faction || 'jp'].S, r.x * TILE + 8, r.y * TILE + TILE, { nonlethal: !!this.def.nonlethal });
        e.world = this; e.initPatrol(L); e.wary = true; e.becomeAlert(this, { x: p.x, y: p.y });
        e.markIndex = -1;
        this.enemies.push(e);
      }
    }
  }
  spottedBySearchlight(o, body, e) {
    if (this.anyAlert()) return;
    Sfx.play('alert');
    const p = this.player;
    const where = body ? { x: e.x, y: e.y } : { x: p.x, y: p.y };
    this.toast(body ? 'The searchlight found a body!' : 'Caught in the searchlight!', 2.5);
    for (const q of this.enemies) if (q.alive && Math.abs(q.x - where.x) < 450) { q.becomeAlert(this, where); }
    if (this.objects.some((a) => a.type === 'alarm' && !a.disabled)) this.raiseAlarm();
  }
  onAlert(e) {
    this.stats.spotted++;
    if (this.def.noAlert && !this.failing) {
      this.failing = true;
      setTimeout(() => Game.fail(this.def.noAlertText || 'You were spotted.'), 900);
    }
  }
  checkFootprints(dt) {
    if (!this.footprints.length) return;
    this.fpT = (this.fpT || 0) + dt;
    if (this.fpT < 0.5) return;
    this.fpT = 0;
    for (const e of this.enemies) {
      if (!e.alive || !(e.state === 'patrol' || e.state === 'wait' || e.state === 'post')) continue;
      for (let i = this.footprints.length - 1; i >= 0; i--) {
        const f = this.footprints[i];
        if (f.seen || f.t < 1.5) continue;
        if (Math.abs(f.x - e.x) > 70 || Math.abs(f.y - e.y) > 12) continue;
        if (e.canSeePoint(this, f.x, f.y - 1) > 0) {
          f.seen = true;
          for (const g of this.footprints) if (Math.abs(g.x - f.x) < 40) g.seen = true;
          e.sus = Math.max(e.sus, 0.45); e.target = { x: f.x + f.dir * 40, y: f.y }; e.lastSeen = e.target;
          e.setState('investigate', this); this.bark(e, 'Footprints in the snow...?', true); Sfx.play('suspicious', 0.6);
          break;
        }
      }
    }
  }

  // ------------------------------------------------------------------ player actions
  takedownTarget() {
    const p = this.player;
    if (p.hidden || p.action || p.drag || p.onLadder || p.stance === 'prone' || !p.onGround) return null;
    let best = null, bd = 99;
    for (const e of this.enemies) {
      if (!e.alive || e.kind === 'dog' || e.onLadder || e.state === 'grabbed') continue;
      const dx = p.x - e.x, dy = Math.abs(p.y - e.y);
      if (Math.abs(dx) > 17 || dy > 12) continue;
      const behind = e.facing * dx < 0;
      const aware = (e.state === 'alert' || e.state === 'look' || e.state === 'lookaround') && !behind;
      if (aware) continue;
      if (!behind && e.sus > 0.25) continue;
      if (Math.abs(dx) < bd) { bd = Math.abs(dx); best = e; }
    }
    return best;
  }
  handleActions() {
    const p = this.player;
    if (p.dead) return;
    this.takedown = p.action ? null : this.takedownTarget();
    this.focus = p.action || p.hidden ? null : this.findFocus();
    if (p.action) return;
    if (p.hidden) {
      // breath-hold warning
      return;
    }
    if (Input.hit('kill') && this.takedown) { this.startTakedown(this.takedown, 'kill'); return; }
    if (Input.hit('choke') && this.takedown) { this.startTakedown(this.takedown, 'ko'); return; }
    if (Input.hit('kill') && p.gun && p.gunDrawn) { this.playerShoot(); return; }
    if (Input.hit('kill') && p.gun && !p.gunDrawn) { this.toast('Draw your weapon first [G].', 1.5); }
    if (Input.hit('weapon')) {
      if (!p.gun) this.toast('You have no firearm.', 1.5);
      else if (this.def.guns === false) this.toast('Not here. Gunfire would bring the whole city down on you.', 2);
      else { p.gunDrawn = !p.gunDrawn; Sfx.play('click'); if (p.gunDrawn && p.disguise) this.toast('A drawn weapon will blow your cover.', 2); }
    }
    if (Input.hit('throw')) this.throwThing('stone');
    if (Input.hit('firecracker')) this.throwThing('firecracker');
    if (Input.hit('order') && this.followers.length) {
      for (const f of this.followers) { f.waiting = !f.waiting; this.bark(f, f.waiting ? U.pick(['I\'ll wait here.', 'Alright. Be careful.', 'Staying put.']) : U.pick(['Right behind you.', 'Coming.', 'Lead the way.'])); if (!f.waiting) f.ti = -1; }
    }
    if (Input.hit('interact')) {
      if (p.drag && (!this.focus || !this.focus.hideSpot)) { this.dropBody(); return; }
      if (this.focus) this.interact(this.focus);
    }
  }
  findFocus() {
    const p = this.player;
    let best = null, bs = 1e9;
    const consider = (item, d, pri) => { const s = d + pri * 40; if (s < bs) { bs = s; best = item; } };
    for (const o of this.objects) {
      const ty = ObjTypes[o.type];
      if (!ty.interact || o.zone) continue;
      const reach = o.type === 'door' ? 14 : o.hideSpot ? 12 : 13;
      const dx = Math.abs(o.x - p.x), dy = Math.abs((o.y - 8) - (p.y - 8));
      if (dx > reach || dy > 22) continue;
      const pr = ty.prompt ? ty.prompt(o, this) : null;
      if (!pr) continue;
      consider({ kind: 'obj', o, prompt: pr, hideSpot: !!o.hideSpot }, dx, o.type === 'pickup' ? 0 : o.hideSpot ? 2 : 1);
    }
    for (const n of this.npcs) {
      if (n.removed) continue;
      const dx = Math.abs(n.x - p.x), dy = Math.abs(n.y - p.y);
      if (dx > 18 || dy > 16 || n.scared) continue;
      if (n.pickpocket) {
        const behind = n.facing * (p.x - n.x) < 0;
        if (behind && dx < 15) consider({ kind: 'steal', n, prompt: n.prompt || ('Pickpocket ' + (n.name || '')) }, dx, 0);
        continue;
      }
      if (!n.scene || (n.talkOnce && n.talked)) continue;
      consider({ kind: 'npc', n, prompt: 'Talk to ' + (n.name || 'them') }, dx, 0);
    }
    for (const e of this.enemies) {
      const dx = Math.abs(e.x - p.x), dy = Math.abs(e.y - p.y);
      if (dx > 15 || dy > 12) continue;
      if (e.alive) {
        if (!e.carry || p.drag || e.state === 'alert' || e.state === 'grabbed') continue;
        const behind = e.facing * (p.x - e.x) < 0;
        if (behind) consider({ kind: 'lift', e, prompt: 'Pickpocket ' + (Story.items[e.carry] ? Story.items[e.carry].name : 'item') }, dx, 0);
        continue;
      }
      if (!e.body || e.body.hidden || e.body.dragged || p.drag) continue;
      if (e.carry) consider({ kind: 'search', e, prompt: 'Search body' }, dx, 0);
      else consider({ kind: 'body', e, prompt: 'Drag body' }, dx, 3);
    }
    return best;
  }
  interact(f) {
    if (f.kind === 'obj') ObjTypes[f.o.type].interact(f.o, this);
    else if (f.kind === 'npc') { f.n.facing = this.player.x > f.n.x ? 1 : -1; f.n.talked = true; this.runScene(f.n.scene, f.n); }
    else if (f.kind === 'steal') {
      const n = f.n; Game.give(n.pickpocket); n.pickpocket = null; Sfx.play('hide', 0.4);
      this.stats.pickpockets = (this.stats.pickpockets || 0) + 1; Game.unlock('light_fingers');
      if (n.scene) this.runScene(n.scene, n);
    } else if (f.kind === 'lift') {
      const e = f.e; Game.give(e.carry); e.carry = null; Sfx.play('hide', 0.4); Game.unlock('light_fingers');
    } else if (f.kind === 'search') {
      const e = f.e; Game.give(e.carry); e.carry = null; Sfx.play('doc', 0.6);
    } else if (f.kind === 'body') {
      this.player.drag = { enemy: f.e }; f.e.body.dragged = true;
      if (this.player.stance === 'prone') this.player.setStance('crouch', this.level);
      Sfx.play('hide', 0.5);
    }
  }
  dropBody() {
    const p = this.player, e = p.drag.enemy;
    p.drag = null; e.body.dragged = false;
    e.x = p.x - p.facing * 12; e.y = p.y;
    const light = this.level.lightAt(e.x, e.y - 4);
    const grass = this.level.typeAt(e.x, e.y - 3) === T.GRASS;
    if (light < 0.2 || grass) { e.body.hidden = true; this.toast(grass ? 'Body hidden in the grass.' : 'Body left in the shadows.', 2); }
    else this.toast('Body dropped. Anyone passing will see it.', 2);
    Sfx.play('thud', 0.5);
  }
  stashBody(o) {
    const p = this.player, e = p.drag.enemy;
    p.drag = null; e.body.dragged = false; e.body.hidden = true;
    e.x = o.x; e.y = o.y; o.occupant = e;
    Sfx.play('hide'); this.toast('Body hidden.', 2);
  }
  hide(o) {
    const p = this.player;
    if (p.gunDrawn) p.gunDrawn = false;
    // was anyone watching?
    for (const e of this.enemies) {
      if (!e.alive) continue;
      const v = e.seePlayer(this);
      if (v > 0 && (e.sus > 0.25 || e.state === 'alert')) {
        o.sawHide = e.id;
        e.sus = 1; e.lastSeen = { x: o.x, y: o.y };
        if (e.kind !== 'dog') { e.setState('search', this); e.searchCenter = { x: o.x, y: o.y }; e.searchT = 10; e.checkObj = o; e.checkT = 0; this.bark(e, 'I saw you go in there!'); }
      }
    }
    p.hidden = o; o.occupant = 'player';
    p.x = o.x; p.vx = 0;
    if (p.stance === 'prone') p.setStance('crouch', this.level);
    Sfx.play('hide');
  }
  unhide() {
    const p = this.player, o = p.hidden;
    if (!o) return;
    o.occupant = null; p.hidden = null;
    Sfx.play('hide', 0.6);
  }
  checkHideSpot(e, o) {
    const p = this.player;
    if (o.occupant === 'player') {
      const breathOk = p.holding && p.breath > 0;
      if (o.sawHide === e.id || !breathOk) {
        this.bark(e, U.pick(['Got you!', 'Come out!', 'Found the rat!']));
        this.unhide();
        if (e.nonlethal) this.captured(e); else { e.becomeAlert(this, { x: p.x, y: p.y }); e.aimT = 10; e.shoot(this, p); }
      } else { this.bark(e, U.pick(['Empty.', 'Nothing in here.', 'Hmph.']), true); }
    } else if (o.occupant && o.occupant !== 'player' && o.occupant.body && !o.occupant.body.found) {
      o.occupant.body.found = true; this.stats.bodies++;
      o.occupant.body.hidden = false; o.occupant.x = o.x + 10; o.occupant = null;
      e.becomeAlert(this, { x: e.x, y: e.y });
      this.bark(e, 'A body! There\'s a killer here!');
    } else this.bark(e, U.pick(['Empty.', 'Nothing.']), true);
  }
  tryAmbush(kind) {
    const p = this.player, o = p.hidden;
    for (const e of this.enemies) {
      if (!e.alive || e.kind === 'dog' || e.state === 'alert') continue;
      if (Math.abs(e.x - o.x) < 20 && Math.abs(e.y - o.y) < 12) {
        this.unhide();
        this.startTakedown(e, kind, o);
        return;
      }
    }
  }
  tryAirTakedown() {
    const p = this.player;
    if (!(Input.is('kill') || Input.is('choke'))) return;
    for (const e of this.enemies) {
      if (!e.alive || e.kind === 'dog' || e.state === 'alert') continue;
      if (Math.abs(e.x - p.x) < 14 && Math.abs(e.y - p.y) < 8) { this.startTakedown(e, Input.is('kill') ? 'kill' : 'ko'); this.toast('Death from above.', 1.5); return; }
    }
  }
  startTakedown(e, kind, intoSpot) {
    const p = this.player;
    if (kind === 'kill' && this.def.nonlethal) { this.toast(this.def.nonlethalMsg || 'Not them. They are your own countrymen — knock them out [V].', 2.5); return; }
    p.action = { kind, e, t: 0, dur: kind === 'kill' ? 0.55 : 1.4, spot: intoSpot };
    if (p.stance === 'prone') p.setStance('crouch', this.level);
    e.setState('grabbed', this); e.icon = null;
    e.facing = p.x < e.x ? 1 : -1;
    p.facing = e.x > p.x ? 1 : -1;
    p.x = e.x - p.facing * 9;
    if (p.gunDrawn) p.gunDrawn = false;
    Sfx.play(kind === 'kill' ? 'stab' : 'choke');
    this.level.noise(p.x, p.y - 10, kind === 'kill' ? 28 : 22, 'player', 'struggle');
  }
  finishTakedown(a) {
    const e = a.e, p = this.player;
    if (a.kind === 'kill') { e.dead = true; this.stats.kills++; this.fx.blood(e.x, e.y - 12, p.facing); Game.state.kills++; }
    else { e.ko = true; this.stats.kos++; Game.state.kos++; }
    e.state = 'down'; e.vx = 0; e.icon = null; e.sus = 0;
    e.body = { hidden: false, found: false, dragged: false };
    Sfx.play('thud', 0.6);
    if (a.spot && !a.spot.occupant) { a.spot.occupant = e; e.body.hidden = true; e.x = a.spot.x; }
    else if (this.level.typeAt(e.x, e.y - 3) === T.GRASS || this.level.lightAt(e.x, e.y - 4) < 0.14) e.body.hidden = true;
    // weapon drop
    if (e.K.armed && this.def.guns !== false && !e.noDrop) {
      const kind = e.drop || (e.pal === 'jp_soldier' || e.pal === 'kmt' || e.pal === 'puppet' || e.pal === 'ccp_guard' ? 'rifle' : 'pistol');
      if (Math.random() < (this.def.dropChance !== undefined ? this.def.dropChance : 0.6)) {
        const o = this.makeObj({ type: 'pickup', kind }, e.x + p.facing * 6, e.y);
        this.objects.push(o);
      }
    }
    if (e.onDown) e.onDown(this, a.kind);
    if (this.def.onTakedown) this.def.onTakedown(this, e, a.kind);
  }
  playerShoot() {
    const p = this.player, L = this.level;
    if (p.shootCD > 0) return;
    if (!p.gun || p.gun.ammo <= 0) { Sfx.play('click'); this.toast('Out of ammunition.', 1.5); p.gun = null; p.gunDrawn = false; Game.state.gun = null; return; }
    p.gun.ammo--; p.shootCD = p.gun.kind === 'rifle' ? 1.0 : 0.45;
    Game.state.gun = Object.assign({}, p.gun);
    this.stats.shots++;
    const y = p.y - (p.stance === 'crouch' ? 9 : 15);
    const x0 = p.x + p.facing * 8;
    Sfx.play('gun'); this.fx.muzzle(x0 + p.facing * 4, y, p.facing); this.shake = 0.25;
    L.noise(p.x, p.y - 10, 420, 'player', 'gunshot');
    let hitX = x0 + p.facing * 320;
    for (let d = 0; d < 320; d += 3) {
      const x = x0 + p.facing * d;
      if (L.typeAt(x, y) === T.SOLID) { hitX = x; this.fx.dust(x, y, 3); break; }
      const e = this.enemies.find((q) => q.alive && Math.abs(q.x - x) < q.w / 2 + 1 && y > q.y - q.h && y < q.y);
      if (e) {
        hitX = x;
        e.dead = true; e.state = 'down'; e.icon = null; e.vx = 0; e.body = { hidden: false, found: true, dragged: false };
        this.fx.blood(e.x, y, p.facing); this.stats.kills++; Game.state.kills++;
        if (e.onDown) e.onDown(this, 'shot');
        break;
      }
    }
    this.fx.tracer(x0, y, hitX, y);
    if (p.disguise) this.disguiseBurned = true;
    for (const n of this.npcs) if (!n.removed && Math.abs(n.x - p.x) < 300 && n.witness !== false) n.panic(this);
  }
  throwThing(kind) {
    const p = this.player;
    if (p.drag) return;
    if (kind === 'stone') { if (p.throwCD > 0) return; p.throwCD = 1.1; }
    else { if (!Game.state.firecrackers) { this.toast('No firecrackers left.', 1.5); return; } Game.state.firecrackers--; }
    const pw = p.stance === 'stand' ? 1 : p.stance === 'crouch' ? 0.75 : 0.5;
    const pr = new Projectile(kind, p.x + p.facing * 4, p.y - p.h + 4, p.facing * 160 * pw + p.vx * 0.3, -160 * pw);
    this.projectiles.push(pr);
    Sfx.play('throw');
  }
  startWork(dur, label, done) {
    const p = this.player;
    p.action = { kind: 'work', t: 0, dur, label, done };
  }
  collect(o) {
    o.taken = true;
    const p = this.player;
    switch (o.kind) {
      case 'rifle': case 'pistol':
        if (this.def.guns === false) { this.toast('Too dangerous to carry a gun here.'); o.taken = false; return; }
        p.gun = { kind: o.kind, ammo: o.ammo || (o.kind === 'rifle' ? 5 : 8) };
        Game.state.gun = Object.assign({}, p.gun);
        this.toast(`Picked up ${o.kind === 'rifle' ? 'an Arisaka rifle' : 'a pistol'} (${p.gun.ammo} rounds). [G] draw, [F] fire. Gunfire alerts everyone.`, 4);
        Sfx.play('click');
        break;
      case 'firecracker':
        Game.state.firecrackers += o.count || 2;
        this.toast(`Firecrackers +${o.count || 2}. [T] to throw — draws soldiers, scares dogs.`, 3.5);
        Sfx.play('pickup');
        break;
      case 'doc': Game.addDoc(o.id); break;
      case 'photo': Game.addPhoto(o.id); break;
      case 'disguise':
        Game.give(o.id);
        if (o.outfit) { Game.flags.outfit = o.outfit; p.pal = o.outfit; p.disguise = true; this.disguiseBurned = false; this.toast(o.msg || 'You changed into the disguise.', 4); }
        break;
      default: Game.give(o.id, o.count); break;
    }
    if (o.scene) this.runScene(o.scene, o);
  }
  runScene(id, src) { Game.runScene(id, { src, world: this }); }
  checkpoint(o) {
    Game.checkpoint = this.snapshot();
    Sfx.play('checkpoint');
    this.toast('Checkpoint', 1.8);
    Game.autosave();
  }
  exitLevel(o) { Game.completeLevel(o); }
  killPlayer(reason, by) {
    const p = this.player;
    if (p.dead || Game.godMode) return;
    p.dead = true; p.pose = 'dead'; p.hidden = null;
    if (p.drag) { p.drag.enemy.body.dragged = false; p.drag = null; }
    this.deathT = 0; this.deathReason = reason; this.deathBy = by;
    this.fx.blood(p.x, p.y - 10, by ? (by.x < p.x ? 1 : -1) : 1);
    Sfx.play('death'); Sfx.siren(false);
    this.shake = 0.6;
    Music.play('silence');
  }
  killFollower(f, by) {
    f.dead = true;
    this.fx.blood(f.x, f.y - 10, 1);
    Sfx.play('death');
    this.deathT = 0; this.deathReason = 'follower'; this.deathBy = f; this.player.dead = true;
  }
  captured(e) {
    const p = this.player;
    if (p.dead) return;
    p.dead = true; p.pose = 'stand';
    this.deathT = 0.2; this.deathReason = 'captured'; this.deathBy = e;
    Sfx.play('shout');
  }

  // ------------------------------------------------------------------ camera
  updateCamera(dt, snap) {
    const p = this.player, L = this.level;
    const lead = p.hidden ? 0 : p.facing * 28;
    let tx = p.x - VW / 2 + lead, ty = p.y - VH * 0.62;
    if (this.camTarget) { tx = this.camTarget.x - VW / 2; ty = this.camTarget.y - VH * 0.6; }
    tx = U.clamp(tx, 0, Math.max(0, L.pw - VW)); ty = U.clamp(ty, 0, Math.max(0, L.ph - VH));
    if (snap) { this.cam.x = tx; this.cam.y = ty; return; }
    this.cam.x += (tx - this.cam.x) * Math.min(1, dt * 4);
    this.cam.y += (ty - this.cam.y) * Math.min(1, dt * 3);
  }

  // ------------------------------------------------------------------ weather
  weatherInit() {
    const w = this.def.weather;
    this.weather = [];
    const n = w === 'rain' ? 140 : w === 'snow' ? 110 : w === 'embers' ? 50 : w === 'ash' ? 60 : 0;
    for (let i = 0; i < n; i++) this.weather.push({ x: Math.random() * VW, y: Math.random() * VH, s: Math.random() });
  }
  updateWeather(dt) {
    const w = this.def.weather;
    for (const q of this.weather) {
      if (w === 'rain') { q.x += (-60 - q.s * 40) * dt; q.y += (360 + q.s * 200) * dt; }
      else if (w === 'snow') { q.x += (Math.sin(this.time + q.s * 10) * 12 - 8) * dt; q.y += (18 + q.s * 26) * dt; }
      else if (w === 'embers') { q.x += Math.sin(this.time * 2 + q.s * 9) * 20 * dt; q.y -= (20 + q.s * 30) * dt; }
      else if (w === 'ash') { q.x += (Math.sin(this.time + q.s * 7) * 8 + 6) * dt; q.y += (10 + q.s * 12) * dt; }
      if (q.y > VH) { q.y = -4; q.x = Math.random() * VW; }
      if (q.y < -6) { q.y = VH; q.x = Math.random() * VW; }
      if (q.x < -4) q.x = VW + 2; if (q.x > VW + 4) q.x = -2;
    }
    if (w === 'rain' && Math.random() < dt * 0.04) { this.level.flash = 0.7; setTimeout(() => Sfx.play('lightning'), 400); }
  }

  // ------------------------------------------------------------------ rendering
  draw(ctx) {
    const L = this.level;
    const sh = this.shake > 0 ? { x: (Math.random() - 0.5) * this.shake * 8, y: (Math.random() - 0.5) * this.shake * 8 } : { x: 0, y: 0 };
    const cam = { x: Math.round(this.cam.x + sh.x), y: Math.round(this.cam.y + sh.y) };
    // backdrop
    const vOff = Math.max(0, L.ph - VH) - cam.y;
    for (const b of L.backdrop) {
      const oy = Math.round(b.f ? -vOff * b.f * 0.5 : 0);
      if (this.def.scroll && b.f) {
        const w = b.c.width, off = (((cam.x + this.time * this.def.scroll) * b.f) % w + w) % w;
        ctx.drawImage(b.c, -Math.round(off), oy); ctx.drawImage(b.c, w - Math.round(off), oy);
      } else ctx.drawImage(b.c, Math.round(-cam.x * b.f), oy);
    }
    if (this.def.fog || this.def.weather === 'fog') {
      const fc = U.hex(L.theme.fogCol);
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = `rgba(${fc[0]},${fc[1]},${fc[2]},0.10)`;
        const off = ((this.time * (6 + i * 4) - cam.x * 0.2 * (i + 1)) % 600 + 600) % 600 - 300;
        ctx.fillRect(off - 300, 120 + i * 30, 900, 70);
      }
    }
    // tiles
    ctx.drawImage(L.canvas, cam.x, cam.y, VW, VH, 0, 0, VW, VH);
    if (this.def.restricted && this.player.disguise) {
      for (const [a, b] of this.def.restricted) {
        const x1 = a * TILE - cam.x, x2 = (b + 1) * TILE - cam.x;
        if (x2 < 0 || x1 > VW) continue;
        ctx.fillStyle = 'rgba(200,30,30,0.07)'; ctx.fillRect(x1, 0, x2 - x1, VH);
        ctx.fillStyle = 'rgba(220,40,40,0.5)';
        for (let y = (Math.floor(this.time * 20) % 8) - 8; y < VH; y += 8) { ctx.fillRect(x1, y, 1, 4); ctx.fillRect(x2 - 1, y, 1, 4); }
      }
    }
    // footprints
    ctx.fillStyle = 'rgba(90,100,120,0.55)';
    for (const f of this.footprints) { ctx.globalAlpha = Math.max(0, 1 - f.t / 45); ctx.fillRect(Math.round(f.x - cam.x - 1), Math.round(f.y - cam.y - 1), 2, 1); }
    ctx.globalAlpha = 1;
    // objects
    for (const o of this.objects) {
      const ty = ObjTypes[o.type];
      if (!ty.draw) continue;
      if (o.x - cam.x < -60 || o.x - cam.x > VW + 60) continue;
      ty.draw(o, ctx, cam, this);
    }
    // bodies first, then living
    for (const e of this.enemies) if (!e.alive) e.draw(ctx, cam);
    for (const n of this.npcs) if (!n.removed) n.draw(ctx, cam);
    for (const e of this.enemies) if (e.alive) e.draw(ctx, cam);
    for (const f of this.followers) f.draw(ctx, cam);
    this.player.draw(ctx, cam);
    for (const pr of this.projectiles) pr.draw(ctx, cam);
    // grass foreground: redraw grass tiles over characters
    this.drawGrassFg(ctx, cam);
    this.fx.draw(ctx, cam, Game.settings.noiseRings);
    // darkness
    this.drawDarkness(ctx, cam);
    // aim lines
    for (const e of this.enemies) {
      if (!e.alive || !e.aimTarget || e.aimT <= 0 || e.state !== 'alert') continue;
      const ey = e.eye();
      ctx.strokeStyle = `rgba(255,40,30,${0.25 + Math.min(0.6, e.aimT)})`; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(ey.x - cam.x + e.facing * 8, ey.y - cam.y + 3); ctx.lineTo(e.aimTarget.x - cam.x, e.aimTarget.y - e.aimTarget.h / 2 - cam.y); ctx.stroke();
    }
    if (Game.settings.cones) this.drawCones(ctx, cam);
    // searchlight beams (additive)
    ctx.globalCompositeOperation = 'lighter';
    for (const o of this.objects) if (o.type === 'searchlight') {
      ObjTypes.searchlight.beam(o, ctx, cam);
      const hot = o.spotT > 0;
      ctx.fillStyle = hot ? 'rgba(255,120,90,0.22)' : 'rgba(255,250,210,0.13)'; ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
    // tunnel etc. overlays
    for (const o of this.objects) if (o.type === 'tunnels') ObjTypes.tunnels.draw(o, ctx, cam, this);
    // weather
    this.drawWeather(ctx);
    // sepia for flashbacks
    if (this.def.sepia) {
      ctx.globalCompositeOperation = 'color';
      ctx.fillStyle = 'rgba(150,110,60,0.45)'; ctx.fillRect(0, 0, VW, VH);
      ctx.globalCompositeOperation = 'source-over';
    }
    this.lastCam = cam;
  }
  drawGrassFg(ctx, cam) {
    const L = this.level;
    const c1 = Math.floor(cam.x / TILE), c2 = Math.ceil((cam.x + VW) / TILE);
    const r1 = Math.floor(cam.y / TILE), r2 = Math.ceil((cam.y + VH) / TILE);
    for (let r = r1; r <= r2; r++) for (let c = c1; c <= c2; c++) {
      if (L.type(c, r) !== T.GRASS) continue;
      ctx.drawImage(L.canvas, c * TILE, r * TILE + 6, TILE, 10, c * TILE - cam.x, r * TILE + 6 - cam.y, TILE, 10);
    }
  }
  drawDarkness(ctx, cam) {
    const L = this.level;
    const amb = U.clamp(L.amb + (L.flash || 0), 0, 1);
    const alpha = (1 - amb) * 0.9;
    if (alpha < 0.02) return;
    const g = this.darkC.getContext('2d');
    g.globalCompositeOperation = 'source-over';
    g.clearRect(0, 0, VW, VH);
    g.fillStyle = `rgba(6,8,22,${alpha})`;
    g.fillRect(0, 0, VW, VH);
    g.globalCompositeOperation = 'destination-out';
    for (const l of L.lights) {
      if (!l.on) continue;
      const x = l.x - cam.x, y = l.y - cam.y;
      if (x < -l.r || x > VW + l.r || y < -l.r || y > VH + l.r) continue;
      const gr = g.createRadialGradient(x, y, 2, x, y, l.r * 1.1);
      gr.addColorStop(0, `rgba(0,0,0,${Math.min(1, l.i * 1.1)})`); gr.addColorStop(0.55, `rgba(0,0,0,${l.i * 0.55})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.fillRect(x - l.r * 1.1, y - l.r * 1.1, l.r * 2.2, l.r * 2.2);
    }
    // faint personal aura so the player can see Lan
    const p = this.player;
    const px = p.x - cam.x, py = p.y - p.h / 2 - cam.y;
    const pg = g.createRadialGradient(px, py, 1, px, py, 30);
    pg.addColorStop(0, 'rgba(0,0,0,0.45)'); pg.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = pg; g.fillRect(px - 30, py - 30, 60, 60);
    for (const o of this.objects) if (o.type === 'searchlight' && o.on) { ObjTypes.searchlight.beam(o, g, cam); g.fillStyle = 'rgba(0,0,0,0.9)'; g.fill(); }
    g.globalCompositeOperation = 'source-over';
    ctx.drawImage(this.darkC, 0, 0);
    // warm glow
    ctx.globalCompositeOperation = 'lighter';
    for (const l of L.lights) {
      if (!l.on) continue;
      const x = l.x - cam.x, y = l.y - cam.y;
      if (x < -l.r || x > VW + l.r) continue;
      const c = U.hex(l.col || '#ffd890');
      const gr = ctx.createRadialGradient(x, y, 1, x, y, l.r * 0.7);
      gr.addColorStop(0, `rgba(${c[0]},${c[1]},${c[2]},0.16)`); gr.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gr; ctx.fillRect(x - l.r, y - l.r, l.r * 2, l.r * 2);
    }
    ctx.globalCompositeOperation = 'source-over';
  }
  drawCones(ctx, cam) {
    const L = this.level;
    for (const e of this.enemies) {
      if (!e.alive || e.state === 'grabbed') continue;
      const ey = e.eye();
      const x = ey.x - cam.x, y = ey.y - cam.y;
      if (x < -160 || x > VW + 160) continue;
      const range = e.K.range * (e.wary ? 1.2 : 1) * (L.alarm ? 1.2 : 1) * (this.diff.vision || 1);
      const col = e.state === 'alert' || e.state === 'toAlarm' ? '255,60,50' : e.sus > 0.3 || e.state === 'search' || e.state === 'investigate' ? '255,190,60' : '255,255,210';
      const n = 12;
      ctx.beginPath(); ctx.moveTo(x, y);
      for (let i = 0; i <= n; i++) {
        const a = -e.K.fov + (2 * e.K.fov * i) / n;
        const dx = Math.cos(a) * e.facing, dy = Math.sin(a);
        let d = 4;
        while (d < range) { if (L.typeAt(ey.x + dx * d, ey.y + dy * d) === T.SOLID) break; d += 5; }
        ctx.lineTo(x + dx * d, y + dy * d);
      }
      ctx.closePath();
      const gr = ctx.createRadialGradient(x, y, 4, x, y, range);
      const a0 = Game.settings.coneAlpha || 0.16;
      gr.addColorStop(0, `rgba(${col},${a0})`); gr.addColorStop(0.35, `rgba(${col},${a0 * 0.55})`); gr.addColorStop(1, `rgba(${col},0)`);
      ctx.fillStyle = gr; ctx.fill();
    }
  }
  drawWeather(ctx) {
    const w = this.def.weather;
    if (!w || w === 'fog') return;
    for (const q of this.weather) {
      if (w === 'rain') { ctx.fillStyle = `rgba(180,200,230,${0.25 + q.s * 0.3})`; ctx.fillRect(q.x, q.y, 1, 4 + q.s * 4); }
      else if (w === 'snow') { ctx.fillStyle = `rgba(240,245,255,${0.5 + q.s * 0.5})`; ctx.fillRect(q.x, q.y, q.s > 0.7 ? 2 : 1, q.s > 0.7 ? 2 : 1); }
      else if (w === 'embers') { ctx.fillStyle = `rgba(255,${140 + q.s * 80},60,${0.5 + q.s * 0.5})`; ctx.fillRect(q.x, q.y, 1, 1); }
      else if (w === 'ash') { ctx.fillStyle = `rgba(160,150,140,${0.4 + q.s * 0.4})`; ctx.fillRect(q.x, q.y, 1, 1); }
    }
  }
}
