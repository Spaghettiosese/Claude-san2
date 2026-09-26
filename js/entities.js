'use strict';
// ---------------------------------------------------------------------------
// Player, enemies (vision/hearing AI), civilians and companion followers.
// Positions: x = horizontal centre, y = feet (bottom of hitbox).
// ---------------------------------------------------------------------------
const GRAV = 900, MAXFALL = 420;
const STANCE_H = { stand: 22, crouch: 13, prone: 7 };

// shared physics helper for walking actors -------------------------------
function physMove(a, L, dt, opts = {}) {
  const tall = a.h > 10;
  // horizontal
  if (a.vx) {
    const nx = a.x + a.vx * dt;
    if (!L.blocked(nx - a.w / 2, a.y - a.h, nx + a.w / 2, a.y - 0.01, tall)) a.x = nx;
    else { a.vx = 0; a.hitWall = true; }
  }
  // vertical
  if (!a.onLadder) { a.vy = Math.min(a.vy + GRAV * dt, MAXFALL); }
  const ny = a.y + a.vy * dt;
  const wasGround = a.onGround;
  a.onGround = false;
  if (a.vy > 0) {
    // solid or one-way landing
    const c1 = Math.floor((a.x - a.w / 2) / TILE), c2 = Math.floor((a.x + a.w / 2 - 0.01) / TILE);
    const rOld = Math.floor((a.y - 0.01) / TILE), rNew = Math.floor(ny / TILE);
    let land = null;
    for (let r = rOld; r <= rNew && land === null; r++) {
      for (let c = c1; c <= c2; c++) {
        const t = L.type(c, r);
        const top = r * TILE;
        if (t === T.SOLID && ny > top && a.y - a.h < top) { land = top; break; }
        if ((t === T.ONEWAY || (t === T.LADDER && L.type(c, r - 1) !== T.LADDER && !opts.onLadderDrop)) && a.y <= top + 0.5 && ny > top && !opts.drop) { land = top; break; }
      }
    }
    if (land !== null) { a.y = land; a.vy = 0; a.onGround = true; }
    else a.y = ny;
  } else if (a.vy < 0) {
    if (L.blocked(a.x - a.w / 2, ny - a.h, a.x + a.w / 2, ny - a.h + 2, tall)) { a.vy = 0; a.y = Math.ceil((ny - a.h) / TILE) * TILE + a.h; }
    else a.y = ny;
  } else {
    // resting: probe ground
    const t1 = L.typeAt(a.x - a.w / 2 + 1, a.y + 1), t2 = L.typeAt(a.x + a.w / 2 - 1, a.y + 1);
    const onTop = Math.abs(a.y - Math.round(a.y / TILE) * TILE) < 0.6;
    const ok = (t) => t === T.SOLID || (onTop && (t === T.ONEWAY || t === T.LADDER));
    if (ok(t1) || ok(t2)) a.onGround = true;
  }
  if (!a.onGround && !a.onLadder && a.vy === 0) {
    // ensure we start falling next frame
  }
  a.justLanded = !wasGround && a.onGround;
}

// ===========================================================================
class Player {
  constructor(x, y, pal) {
    this.x = x; this.y = y; this.vx = 0; this.vy = 0;
    this.w = 8; this.h = 22; this.facing = 1;
    this.stance = 'stand'; this.onGround = false; this.onLadder = false;
    this.hidden = null; this.drag = null; this.action = null;
    this.gun = null; this.gunDrawn = false;
    this.pal = pal || 'lan';
    this.anim = 0; this.pose = 'stand'; this.frame = 0;
    this.stepAcc = 0; this.fallFrom = y; this.throwCD = 0; this.shootCD = 0;
    this.dead = false; this.breath = 1; this.holding = false;
    this.moving = false; this.running = false;
    this.trail = [];
    this.disguise = false;
    this.lastNoise = 0; this.inGrass = false; this.inWater = false;
  }
  get box() { return [this.x - this.w / 2, this.y - this.h, this.x + this.w / 2, this.y]; }
  center() { return { x: this.x, y: this.y - this.h / 2 }; }

  setStance(s, L) {
    if (s === this.stance) return true;
    const nh = STANCE_H[s];
    if (nh > this.h && L.blocked(this.x - this.w / 2, this.y - nh, this.x + this.w / 2, this.y - this.h, nh > 10)) return false;
    this.stance = s; this.h = nh;
    Sfx.play('crouch');
    return true;
  }

  update(dt, W) {
    const L = W.level;
    if (this.dead) return;
    this.throwCD = Math.max(0, this.throwCD - dt);
    this.shootCD = Math.max(0, this.shootCD - dt);
    this.anim += dt;

    if (this.action) { this.updateAction(dt, W); return; }

    if (this.hidden) {
      this.vx = 0;
      this.holding = Input.is('breath');
      if (this.holding) this.breath = Math.max(0, this.breath - dt * 0.28);
      else this.breath = Math.min(1, this.breath + dt * 0.35);
      if (Input.hit('interact') || Input.hit('left') || Input.hit('right') || Input.hit('up')) { W.unhide(); Input.eat('interact'); Input.eat('up'); }
      else if (Input.hit('kill') || Input.hit('choke')) W.tryAmbush(Input.hit('kill') ? 'kill' : 'ko');
      return;
    }
    this.breath = Math.min(1, this.breath + dt * 0.4);

    const left = Input.is('left'), right = Input.is('right');
    const dir = (right ? 1 : 0) - (left ? 1 : 0);
    this.running = Input.is('run') && this.stance === 'stand' && !this.drag && dir !== 0;

    // --- stance changes ---
    if (!this.onLadder) {
      if (Input.hit('crouch') || (Input.hit('down') && !this.nearLadder(L, 1) && !Input.is('jump'))) {
        if (this.stance === 'crouch') this.setStance('stand', L); else this.setStance('crouch', L);
      }
      if (Input.hit('prone') && this.onGround && !this.drag) {
        if (this.stance === 'prone') this.setStance('crouch', L); else this.setStance('prone', L);
      }
    }

    // --- ladder ---
    const onLadderTile = this.nearLadder(L, 0);
    if (!this.onLadder && !this.drag) {
      if (Input.is('up') && this.nearLadder(L, -1) && this.stance === 'stand') { this.onLadder = true; this.snapLadder(L); }
      else if (Input.is('down') && this.nearLadder(L, 1) && this.onGround) {
        if (this.stance !== 'stand') this.setStance('stand', L);
        this.onLadder = true; this.snapLadder(L); this.y += 2;
      }
    }
    if (this.onLadder) {
      this.vx = 0;
      this.vy = Input.is('up') ? -48 : Input.is('down') ? 52 : 0;
      if (dir && !Input.is('up') && !Input.is('down')) { this.onLadder = false; this.vx = dir * 30; }
      if (Input.hit('jump')) { this.onLadder = false; this.vy = -120; this.vx = dir * 50; }
      const ny = this.y + this.vy * dt;
      // leave ladder at top
      const cc = Math.floor(this.x / TILE);
      const rFeet = Math.floor((ny - 1) / TILE);
      if (this.vy < 0 && L.type(cc, rFeet) !== T.LADDER) {
        this.y = (rFeet + 1) * TILE; this.onLadder = false; this.onGround = true; this.vy = 0;
      } else if (this.vy > 0 && (L.type(cc, Math.floor((ny) / TILE)) === T.SOLID)) {
        this.onLadder = false; this.vy = 0; this.y = Math.floor(ny / TILE) * TILE; this.onGround = true;
      } else if (L.type(cc, Math.floor((ny - 4) / TILE)) !== T.LADDER && L.type(cc, Math.floor(ny / TILE)) !== T.LADDER) {
        this.onLadder = false;
      } else this.y = ny;
      this.fallFrom = this.y;
      if (this.vy) this.stepNoise(dt, W, Math.abs(this.vy) * 0.6, 'ladder');
      this.pose = 'climb'; this.frame = this.vy ? Math.floor(this.anim * 6) % 2 : 0;
      return;
    }

    // --- horizontal movement ---
    let spd = 52;
    if (this.running) spd = 100;
    if (this.stance === 'crouch') spd = 30;
    if (this.stance === 'prone') spd = 15;
    if (this.drag) spd = 22;
    if (this.gunDrawn) spd *= 0.85;
    const ft = L.typeAt(this.x, this.y - 3);
    this.inWater = ft === T.WATER;
    if (this.inWater) spd *= 0.6;
    const target = dir * spd;
    this.vx = U.approach(this.vx, target, (this.onGround ? 900 : 400) * dt);
    if (dir && !this.drag) this.facing = dir;
    if (this.drag && dir) this.facing = dir;

    // --- jump / drop ---
    if ((Input.hit('jump') || (Input.hit('up') && !onLadderTile)) && this.onGround && !this.drag) {
      if (Input.is('down') && this.standingOnOneWay(L)) {
        this.dropT = 0.25; this.y += 1;
      } else if (this.stance === 'prone') this.setStance('crouch', L);
      else if (this.stance === 'crouch' && Input.hit('up')) this.setStance('stand', L);
      else {
        if (this.stance === 'crouch') this.setStance('stand', L);
        if (this.stance === 'stand') { this.vy = -265; this.onGround = false; Sfx.play('jump'); }
      }
    }
    if (this.dropT > 0) this.dropT -= dt;

    const wasGround = this.onGround;
    const oldY = this.y;
    physMove(this, L, dt, { drop: this.dropT > 0 });
    if (wasGround && !this.onGround) this.fallFrom = oldY;
    if (!this.onGround && this.vy < 0) this.fallFrom = Math.min(this.fallFrom, this.y);
    if (this.justLanded) {
      const fall = this.y - this.fallFrom;
      if (fall > 150) { W.killPlayer('fall'); return; }
      if (fall > 30) {
        const r = fall > 70 ? 110 : 60;
        L.noise(this.x, this.y - 2, this.stance === 'stand' ? r : r * 0.5, 'player', 'step');
        Sfx.play('land');
        W.fx.dust(this.x, this.y, 5);
        // air assassination
        W.tryAirTakedown();
      }
      this.fallFrom = this.y;
    }
    if (this.onGround) this.fallFrom = this.y;

    // hazards / out of bounds
    if (L.typeAt(this.x, this.y - 4) === T.HAZARD) { W.killPlayer('fire'); return; }
    if (this.y > L.ph + 40) { W.killPlayer('fall'); return; }

    this.inGrass = L.typeAt(this.x, this.y - 3) === T.GRASS;
    this.moving = Math.abs(this.vx) > 4;

    // --- footsteps / noise ---
    if (this.onGround && this.moving) this.stepNoise(dt, W, Math.abs(this.vx), 'walk');

    // trail for followers
    const lt = this.trail[this.trail.length - 1];
    if (!lt || Math.hypot(lt.x - this.x, lt.y - this.y) > 5) {
      this.trail.push({ x: this.x, y: this.y, st: this.stance, lad: false });
      if (this.trail.length > 120) this.trail.shift();
    }

    // --- pose ---
    if (this.drag) { this.pose = 'carry'; this.frame = this.moving ? Math.floor(this.anim * 6) % 4 : 0; }
    else if (!this.onGround) { this.pose = 'run'; this.frame = 1; }
    else if (this.stance === 'prone') { this.pose = this.moving ? 'crawl' : 'prone'; this.frame = Math.floor(this.anim * 5) % 4; }
    else if (this.stance === 'crouch') { this.pose = this.gunDrawn && !this.moving ? 'crouchaim' : this.moving ? 'crouchwalk' : 'crouch'; this.frame = Math.floor(this.anim * 6) % 4; }
    else if (this.moving) { this.pose = this.running ? 'run' : 'walk'; this.frame = Math.floor(this.anim * (this.running ? 11 : 7)) % 4; }
    else { this.pose = this.gunDrawn ? 'aim' : 'stand'; this.frame = Math.floor(this.anim * 1.5) % 2; }
  }

  stepNoise(dt, W, speed, mode) {
    this.stepAcc += speed * dt;
    const stride = this.running ? 20 : 14;
    if (this.stepAcc < stride) return;
    this.stepAcc = 0;
    const L = W.level;
    const under = L.chAt(this.x, this.y + 2);
    const snow = L.theme.snow && !L.isInterior(this.x, this.y - 8);
    let r = 0;
    if (mode === 'ladder') r = 25;
    else if (this.stance === 'prone') r = 0;
    else if (this.stance === 'crouch') r = 0;
    else if (this.drag) r = 30;
    else r = this.running ? 120 : 40;
    let snd = 'step', vol = 0.6;
    if (under === 'm') { r = this.stance === 'crouch' ? 35 : this.stance === 'prone' ? 10 : r * 1.9 + 20; snd = 'stepWood'; }
    else if (under === 'g') { r = this.stance === 'stand' ? r * 1.5 + 20 : r + 12; snd = 'stepGravel'; }
    else if (under === 'r') { r *= 0.45; }
    else if (snow) { r *= 0.85; snd = 'stepSnow'; }
    if (this.inWater) { r = Math.max(r * 1.6, this.stance === 'prone' ? 20 : 45); snd = 'stepWater'; }
    if (mode === 'ladder') snd = 'stepWood';
    if (this.stance !== 'stand' && r < 12) vol = 0.25;
    Sfx.play(snd, vol * (r > 0 ? Math.min(1.4, 0.4 + r / 100) : 0.3));
    if (r > 0) L.noise(this.x, this.y - 4, r, 'player', 'step');
    this.lastNoise = r;
    if (snow && this.stance !== 'prone') W.footprint(this.x, this.y, this.facing);
    if (Game.settings && this.running && Math.random() < 0.3) W.fx.dust(this.x, this.y, 2);
  }

  nearLadder(L, dy) {
    const c = Math.floor(this.x / TILE);
    const y = dy < 0 ? this.y - 4 : dy > 0 ? this.y + 4 : this.y - 8;
    const t = L.type(c, Math.floor(y / TILE));
    if (t !== T.LADDER) return false;
    return Math.abs(this.x - (c * TILE + 8)) < 7;
  }
  snapLadder() { this.x = Math.floor(this.x / TILE) * TILE + 8; this.vx = 0; this.vy = 0; if (this.stance !== 'stand') { this.stance = 'stand'; this.h = 22; } }
  standingOnOneWay(L) {
    const t = L.typeAt(this.x, this.y + 2);
    return t === T.ONEWAY || t === T.LADDER;
  }

  updateAction(dt, W) {
    const a = this.action;
    a.t += dt;
    this.vx = 0;
    if (a.kind === 'kill') { this.pose = 'stab'; this.frame = a.t > 0.2 ? 1 : 0; }
    else { this.pose = 'stab'; this.frame = Math.floor(a.t * 6) % 2; }
    if (a.t >= a.dur) { W.finishTakedown(a); this.action = null; }
    if (a.kind === 'sabotage' || a.kind === 'work') {
      this.pose = 'crouch';
      if (a.t >= a.dur) { if (a.done) a.done(); this.action = null; }
    }
  }

  draw(ctx, cam) {
    if (this.hidden) return;
    const pal = this.palette();
    const spr = Sprites.get(pal, this.pose, this.frame, this.facing);
    const sx = Math.round(this.x - cam.x - SW / 2), sy = Math.round(this.y - cam.y - SH);
    ctx.drawImage(spr, sx, sy);
    if (this.drag && this.drag.enemy) {
      // body being dragged
      const e = this.drag.enemy;
      const b = e.kind === 'dog' ? Sprites.dog(0, 'dead', -this.facing) : Sprites.get(e.pal, e.dead ? 'dead' : 'ko', 0, this.facing === 1 ? -1 : 1);
      ctx.drawImage(b, Math.round(this.x - cam.x - SW / 2 - this.facing * 14), sy + 2);
    }
  }
  palette() { return this.pal; }
}

// ===========================================================================
const ENEMY_KINDS = {
  soldier: { pal: 'jp_soldier', range: 125, fov: 0.62, walk: 26, run: 80, aim: 0.62, hear: 1, armed: true },
  sentry: { pal: 'jp_soldier', range: 135, fov: 0.62, walk: 26, run: 80, aim: 0.62, hear: 1, armed: true, stationary: true },
  officer: { pal: 'jp_officer', range: 150, fov: 0.7, walk: 24, run: 78, aim: 0.5, hear: 1.2, armed: true, sharp: true },
  kempei: { pal: 'kempei', range: 145, fov: 0.7, walk: 27, run: 85, aim: 0.52, hear: 1.25, armed: true, sharp: true },
  agent: { pal: 'agent', range: 135, fov: 0.66, walk: 28, run: 88, aim: 0.55, hear: 1.2, armed: true, sharp: true },
  puppet: { pal: 'puppet', range: 115, fov: 0.6, walk: 25, run: 76, aim: 0.7, hear: 0.9, armed: true },
  kmt: { pal: 'kmt', range: 125, fov: 0.62, walk: 26, run: 80, aim: 0.62, hear: 1, armed: true },
  kmt_mp: { pal: 'kmt_mp', range: 140, fov: 0.66, walk: 26, run: 82, aim: 0.55, hear: 1.1, armed: true, sharp: true },
  ccp: { pal: 'ccp_guard', range: 125, fov: 0.62, walk: 27, run: 82, aim: 0.62, hear: 1.1, armed: true },
  dog: { pal: 'dog', range: 85, fov: 0.9, walk: 34, run: 125, aim: 0, hear: 1.7, armed: false, dog: true },
};

let ENEMY_ID = 0;
class Enemy {
  constructor(kind, x, y, opts = {}) {
    const K = ENEMY_KINDS[kind] || ENEMY_KINDS.soldier;
    this.id = opts.id || ('e' + (ENEMY_ID++));
    this.kind = K.dog ? 'dog' : kind;
    this.K = K;
    this.pal = opts.pal || K.pal;
    this.x = x; this.y = y; this.vx = 0; this.vy = 0; this.w = K.dog ? 12 : 8; this.h = K.dog ? 12 : 22;
    this.facing = opts.facing || (Math.random() < 0.5 ? -1 : 1);
    this.home = { x, y, facing: this.facing };
    this.state = K.stationary || opts.stationary ? 'post' : 'patrol';
    this.stationary = !!(K.stationary || opts.stationary);
    this.turns = opts.turns !== undefined ? opts.turns : true;
    this.turnEvery = opts.turnEvery || 3.5 + Math.random() * 2;
    this.patrol = null; this.range = opts.range;
    this.sus = 0; this.t = 0; this.aimT = 0; this.stateT = 0; this.waitT = 0;
    this.target = null; this.lastSeen = null; this.wary = false;
    this.dead = false; this.ko = false; this.body = null;
    this.anim = Math.random() * 3; this.icon = null;
    this.name = opts.name;
    this.noAlarm = !!opts.noAlarm;
    this.nonlethal = !!opts.nonlethal; // allied soldiers: capture instead of shooting
    this.talk = opts.talk; // optional bark lines
    this.barkT = 3 + Math.random() * 8;
    this.onGround = true; this.onLadder = false;
    this.climb = null;
    this.searchT = 0; this.checkObj = null; this.checkT = 0;
    this.seenPlayerT = 0;
    this.drop = opts.drop; // weapon dropped on death
    this.carry = opts.carry || null; // item that can be pickpocketed / looted
    this.passive = !!opts.passive;
  }
  get alive() { return !this.dead && !this.ko; }
  eye() { return { x: this.x + this.facing * 3, y: this.y - (this.kind === 'dog' ? 8 : 19) }; }

  initPatrol(L) {
    if (this.stationary) { this.patrol = { x1: this.x, x2: this.x }; return; }
    const lim = (this.range || 7) * TILE;
    let x1 = this.x, x2 = this.x;
    for (let x = this.x; x > this.x - lim; x -= 4) { if (!this.canStand(L, x - 6)) break; x1 = x; }
    for (let x = this.x; x < this.x + lim; x += 4) { if (!this.canStand(L, x + 6)) break; x2 = x; }
    this.patrol = { x1, x2 };
  }
  canStand(L, x) {
    const tall = this.h > 10;
    if (L.blocked(x - this.w / 2, this.y - this.h, x + this.w / 2, this.y - 1, tall)) return false;
    const g = L.typeAt(x, this.y + 2);
    return g === T.SOLID || g === T.ONEWAY || g === T.LADDER;
  }

  setState(s, W) {
    if (this.state === s) return;
    this.state = s; this.stateT = 0;
    if (s === 'alert') {
      this.aimT = 0;
      this.icon = '!';
      if (!this.alertedOnce) { this.alertedOnce = true; W.stats.alerts++; }
    }
  }

  // --- perception -----------------------------------------------------
  canSeePoint(W, px, py, isPlayer = true) {
    const L = W.level;
    const e = this.eye();
    const dx = px - e.x, dy = py - e.y;
    const d = Math.hypot(dx, dy);
    let range = this.K.range * (this.wary ? 1.2 : 1) * (L.alarm ? 1.2 : 1) * (W.diff.vision || 1);
    const light = L.lightAt(px, py);
    const lf = 0.28 + 0.72 * Math.min(1, light / 0.75);
    range *= lf;
    if (d > range) return 0;
    if (dx * this.facing < -2) return 0;
    const ang = Math.atan2(Math.abs(dy), Math.abs(dx));
    if (ang > this.K.fov + (d < 30 ? 0.5 : 0)) return 0;
    if (!L.los(e.x, e.y, px, py)) return 0;
    return 1 - d / range;
  }

  seePlayer(W) {
    const p = W.player;
    if (p.dead || p.hidden || Game.settings.ghost) return 0;
    if (p.inGrass && p.stance !== 'stand') {
      const d = Math.hypot(p.x - this.x, p.y - this.y);
      if (p.stance === 'prone' ? (d > 12 || !p.moving) : d > 20) return 0;
    }
    const top = p.y - p.h + 2, mid = p.y - p.h / 2;
    const v = Math.max(this.canSeePoint(W, p.x, top), this.canSeePoint(W, p.x, mid));
    if (v > 0) return v;
    // bump: very close & noisy
    if (Math.abs(p.x - this.x) < 14 && Math.abs(p.y - this.y) < 12 && p.stance === 'stand' && p.moving) return 0.9;
    return 0;
  }

  update(dt, W) {
    this.anim += dt; this.t += dt; this.stateT += dt;
    const L = W.level, p = W.player;
    if (this.dead || this.ko) {
      physMove(this, L, dt);
      return;
    }
    if (this.state === 'grabbed') { this.vx = 0; return; }
    if (this.state === 'scripted') { this.moveTo(this.target && this.target.x, 26, dt, L); physMove(this, L, dt); return; }

    if (this.passive) {
      this.icon = null; this.sus = 0;
      if (this.stationary) { this.vx = 0; this.facing = this.home.facing; }
      else if (this.state !== 'patrol' && this.state !== 'wait') this.state = 'patrol';
      if (this.state === 'patrol') { const goal = this.facing > 0 ? this.patrol.x2 : this.patrol.x1; if (this.moveTo(goal, this.K.walk, dt, L)) { this.state = 'wait'; this.waitT = 2; } }
      else if (this.state === 'wait') { this.vx = 0; this.waitT -= dt; if (this.waitT < 0) { this.facing *= -1; this.state = 'patrol'; } }
      physMove(this, L, dt);
      return;
    }
    // ---- perception ----
    let vis = this.seePlayer(W);
    let seeTarget = vis > 0 ? p : null;
    // followers are spotted too
    for (const f of W.followers) {
      if (!f.visible || f.dead || Game.settings.ghost) continue;
      const fv = Math.max(this.canSeePoint(W, f.x, f.y - f.h + 2), this.canSeePoint(W, f.x, f.y - f.h / 2));
      if (fv > vis) { vis = fv; seeTarget = f; }
    }
    // disguise handling
    if (vis > 0 && seeTarget === p && p.disguise && !W.disguiseBlown()) {
      const suspicious = p.stance !== 'stand' || p.running || p.gunDrawn || p.drag || W.inRestricted(p.x, p.y);
      if (!suspicious) {
        const d = Math.hypot(p.x - this.x, p.y - this.y);
        if (this.K.sharp && d < 48) vis *= 0.22; else vis = 0;
      }
    }
    if (this.kind === 'dog') {
      // dogs smell nearby players, even hidden
      const d = Math.hypot(p.x - this.x, (p.y - 6) - (this.y - 6));
      if (!p.dead && d < 34 && !p.inWater && !Game.settings.ghost) vis = Math.max(vis, 0.6);
    }
    if (vis > 0) {
      const tgt = seeTarget || p;
      let rate = 2.1 * vis + 0.35;
      const tp = tgt.stance || 'stand';
      rate *= tp === 'prone' ? 0.3 : tp === 'crouch' ? 0.55 : 1;
      if (tgt.moving) rate *= tgt.running ? 1.7 : 1.25;
      if (this.K.sharp) rate *= 1.15;
      if (this.state === 'alert' || this.state === 'search') rate *= 6;
      rate *= W.diff.detect;
      this.sus = Math.min(1, this.sus + rate * dt);
      this.lastSeen = { x: tgt.x, y: tgt.y };
      this.seenPlayerT += dt;
    } else {
      this.seenPlayerT = 0;
      const floor = this.state === 'investigate' || this.state === 'look' ? 0.3 : 0;
      if (this.state !== 'alert') this.sus = Math.max(floor, this.sus - 0.22 * dt);
    }

    // bodies
    if (this.state !== 'alert') {
      for (const e of W.enemies) {
        if (e === this || e.alive || !e.body || e.body.hidden || e.body.found) continue;
        if (e.body.dragged) continue;
        const v = this.canSeePoint(W, e.x, e.y - 3);
        if (v > 0) {
          e.body.found = true; W.stats.bodies++;
          W.bark(this, U.pick(['What?! A body!', 'Man down!', 'Intruder! Someone killed him!', 'Wake up! ...He is dead.']));
          Sfx.play('shout');
          L.noise(this.x, this.y - 10, 170, this.id, 'shout');
          this.lastSeen = { x: e.x, y: e.y };
          this.sus = 1; this.wary = true;
          if (!this.tryAlarm(W)) { this.setState('search', W); this.searchCenter = { x: e.x, y: e.y }; this.searchT = 12; }
          break;
        }
      }
    }

    // ---- state transitions from suspicion ----
    const calm = this.state === 'patrol' || this.state === 'wait' || this.state === 'post' || this.state === 'return';
    if (this.sus >= 1 && this.state !== 'alert' && this.state !== 'toAlarm' && this.state !== 'ringing' && this.state !== 'flee') {
      this.becomeAlert(W, this.lastSeen);
    } else if (calm && this.sus > 0.3) {
      this.setState('look', W); this.icon = '?'; Sfx.play('suspicious', 0.8);
      if (this.lastSeen) this.facing = this.lastSeen.x > this.x ? 1 : -1;
    }

    // ---- behaviours ----
    const K = this.K;
    switch (this.state) {
      case 'post':
        this.vx = 0;
        if (this.turns) { this.waitT += dt; if (this.waitT > this.turnEvery) { this.waitT = 0; this.facing *= -1; } }
        else this.facing = this.home.facing;
        if (Math.abs(this.x - this.home.x) > 4) { this.setState('return', W); }
        break;
      case 'patrol': {
        const goal = this.facing > 0 ? this.patrol.x2 : this.patrol.x1;
        if (this.moveTo(goal, K.walk, dt, L)) { this.setState('wait', W); this.waitT = 1.6 + Math.random() * 1.8; }
        break;
      }
      case 'wait':
        this.vx = 0; this.waitT -= dt;
        if (this.waitT < 0) { this.facing *= -1; this.setState('patrol', W); }
        break;
      case 'look':
        this.vx = 0;
        if (this.lastSeen) this.facing = this.lastSeen.x > this.x ? 1 : -1;
        if (this.sus > 0.62 && this.stateT > 0.8 && vis === 0) { this.target = this.lastSeen; this.setState('investigate', W); }
        else if (this.sus < 0.12 && this.stateT > 1.2) { this.icon = null; this.setState('return', W); }
        break;
      case 'investigate': {
        this.icon = '?';
        const tx = this.target ? this.target.x : this.x;
        const arrived = this.pathTo(this.target, K.walk * 1.35, dt, L);
        if (arrived || this.stateT > 12) { this.setState('lookaround', W); this.waitT = 3.5; }
        break;
      }
      case 'lookaround':
        this.vx = 0; this.waitT -= dt;
        if (Math.floor(this.stateT / 1.1) % 2 === 1 && this.lastFlip !== Math.floor(this.stateT / 1.1)) { this.facing *= -1; this.lastFlip = Math.floor(this.stateT / 1.1); }
        if (this.waitT < 0) { this.icon = null; this.sus = Math.min(this.sus, 0.2); this.setState('return', W); }
        break;
      case 'return': {
        this.icon = null;
        const arrived = this.pathTo(this.home, K.walk, dt, L);
        if (arrived) { this.facing = this.home.facing; this.setState(this.stationary ? 'post' : 'patrol', W); }
        break;
      }
      case 'distracted': {
        this.icon = '?';
        const arrived = this.pathTo(this.target, K.run * 0.7, dt, L);
        if (arrived) { this.vx = 0; this.waitT -= dt; if (this.waitT < 0) { this.icon = null; this.setState('return', W); } }
        break;
      }
      case 'flee': {
        this.icon = null;
        const dir = this.target && this.target.x > this.x ? -1 : 1;
        this.facing = dir;
        this.vx = this.canStand(L, this.x + dir * 8) ? dir * K.run : 0;
        if (this.stateT > 4) this.setState('return', W);
        break;
      }
      case 'fuse': {
        const arrived = this.pathTo(this.target, K.walk * 1.2, dt, L);
        if (arrived) { this.vx = 0; this.waitT -= dt; if (this.waitT < 0) { if (this.fuseObj) this.fuseObj.setOn(W, true); this.setState('return', W); } }
        break;
      }
      case 'toAlarm': {
        this.icon = '!';
        const a = this.alarmObj;
        if (!a || a.disabled || L.alarm) { this.setState('alert', W); break; }
        const arrived = this.pathTo({ x: a.x, y: a.y }, K.run, dt, L);
        if (arrived) { this.setState('ringing', W); this.vx = 0; }
        break;
      }
      case 'ringing':
        this.vx = 0;
        if (this.stateT > 0.9) { if (this.alarmObj && !this.alarmObj.disabled) this.alarmObj.ring(W); this.setState('alert', W); }
        break;
      case 'alert': this.updateAlert(dt, W, vis, seeTarget); break;
      case 'search': this.updateSearch(dt, W, vis); break;
      default: break;
    }

    // hearing
    this.hear(W);

    // idle barks
    if (calm && this.kind !== 'dog') {
      this.barkT -= dt;
      if (this.barkT < 0) {
        this.barkT = 10 + Math.random() * 14;
        if (Math.abs(p.x - this.x) < 200 && this.talk && this.talk.length) W.bark(this, U.pick(this.talk), true);
      }
    }
    if (this.kind === 'dog' && this.state === 'alert' && Math.random() < dt * 2) Sfx.play('bark', 0.6);

    physMove(this, L, dt);
  }

  becomeAlert(W, where) {
    const L = W.level;
    this.sus = 1;
    this.lastSeen = where || this.lastSeen || { x: W.player.x, y: W.player.y };
    if (this.state === 'alert') return;
    this.setState('alert', W);
    if (this.kind === 'dog') Sfx.play('bark'); else { Sfx.play('alert'); W.bark(this, U.pick(W.lines.alert)); }
    L.noise(this.x, this.y - 10, 190, this.id, 'shout');
    W.onAlert(this);
    this.tryAlarm(W);
  }

  tryAlarm(W) {
    const L = W.level;
    if (L.alarm || this.noAlarm || this.kind === 'dog') return false;
    if (W.enemies.some((e) => e !== this && e.alive && (e.state === 'toAlarm' || e.state === 'ringing'))) return false;
    let best = null, bd = 520;
    for (const o of W.objects) {
      if (o.type !== 'alarm' || o.disabled) continue;
      const d = Math.abs(o.x - this.x) + Math.abs(o.y - this.y) * 2;
      if (d < bd) { bd = d; best = o; }
    }
    if (!best) return false;
    this.alarmObj = best;
    this.setState('toAlarm', W);
    W.bark(this, U.pick(['Sound the alarm!', 'To the bell!', 'Raise the alarm!']));
    return true;
  }

  updateAlert(dt, W, vis, seeTarget) {
    const K = this.K, L = W.level, p = W.player;
    this.icon = '!';
    if (this.kind === 'dog') {
      const tgt = this.lastSeen || p;
      const arrived = this.pathTo(tgt, K.run, dt, L);
      if (Math.abs(p.x - this.x) < 11 && Math.abs(p.y - this.y) < 14 && !p.dead && !p.hidden) W.killPlayer('dog');
      if (!p.hidden && Math.hypot(p.x - this.x, p.y - this.y) < 40) this.lastSeen = { x: p.x, y: p.y };
      if (arrived && vis === 0) { this.setState('search', W); this.searchCenter = this.lastSeen; this.searchT = 6; }
      return;
    }
    if (vis > 0 && seeTarget) {
      this.vx = 0;
      this.facing = seeTarget.x > this.x ? 1 : -1;
      this.aimT += dt;
      this.aimTarget = seeTarget;
      const aimNeed = K.aim * W.diff.aim + (this.firstShot ? 0 : 0.25);
      if (this.nonlethal && this.aimT > aimNeed + 0.3 && Math.hypot(p.x - this.x, p.y - this.y) < 200) { W.captured(this); return; }
      if (!this.nonlethal && this.aimT >= aimNeed) {
        this.firstShot = true;
        this.shoot(W, seeTarget);
        this.aimT = -0.5;
      }
    } else {
      this.aimT = Math.max(0, this.aimT - dt);
      this.aimTarget = null;
      const arrived = this.pathTo(this.lastSeen || p, K.run, dt, L);
      if (arrived || this.stateT > 14) {
        this.setState('search', W); this.searchCenter = this.lastSeen || { x: this.x, y: this.y }; this.searchT = 9;
      }
    }
  }

  shoot(W, tgt) {
    const L = W.level;
    const e = this.eye();
    Sfx.play('gun');
    W.fx.muzzle(e.x + this.facing * 8, e.y + 3, this.facing);
    L.noise(this.x, this.y - 10, 380, this.id, 'gunshot');
    const hitY = tgt.y - tgt.h / 2;
    W.fx.tracer(e.x + this.facing * 8, e.y + 3, tgt.x, hitY);
    if (tgt === W.player) W.killPlayer('shot', this);
    else if (tgt.follower) W.killFollower(tgt, this);
  }

  updateSearch(dt, W, vis) {
    const L = W.level, K = this.K;
    this.icon = '?';
    this.searchT -= dt;
    if (this.checkObj) {
      const arrived = this.pathTo({ x: this.checkObj.x, y: this.checkObj.y }, K.walk * 1.5, dt, L);
      if (arrived) {
        this.vx = 0; this.checkT += dt;
        this.facing = this.checkObj.x >= this.x ? 1 : -1;
        if (this.checkT > 1.4) {
          W.checkHideSpot(this, this.checkObj);
          this.checkObj.checked = (this.checkObj.checked || 0) + 1;
          this.checkObj = null; this.checkT = 0;
        }
      }
    } else {
      if (!this.searchGoal || Math.abs(this.searchGoal.x - this.x) < 6 || this.stateT % 3.2 < dt) {
        const c = this.searchCenter || this.home;
        this.searchGoal = { x: c.x + (Math.random() * 2 - 1) * 90, y: c.y };
      }
      this.pathTo(this.searchGoal, K.walk * 1.4, dt, L);
      // look for hiding spots near
      for (const o of W.objects) {
        if (!o.hideSpot || (o.checked || 0) > 0) continue;
        const d = Math.abs(o.x - this.x) + Math.abs(o.y - this.y) * 2;
        const c = this.searchCenter || this;
        const nearCenter = Math.abs(o.x - c.x) < 110 && Math.abs(o.y - c.y) < 40;
        if (d < 110 && nearCenter && (o.sawHide === this.id || Math.random() < dt * 0.5)) { this.checkObj = o; this.checkT = 0; break; }
      }
    }
    if (this.searchT < 0) {
      this.icon = null; this.sus = 0; this.wary = true;
      this.setState('return', W);
      W.bark(this, U.pick(W.lines.giveup), true);
    }
  }

  hear(W) {
    const L = W.level;
    for (const n of L.noises) {
      if (n.src === this.id || n.t > 0) continue;
      if (Game.settings.ghost && (n.src === 'player' || n.kind === 'struggle')) continue;
      const walls = L.wallsBetween(this.x, this.y - 12, n.x, n.y);
      const d = Math.hypot(n.x - this.x, (n.y - this.y) * 1.5) + walls * 45;
      const r = n.r * this.K.hear * W.diff.hear;
      if (d > r) continue;
      this.onNoise(W, n);
    }
  }
  onNoise(W, n) {
    if (this.state === 'toAlarm' || this.state === 'ringing' || this.state === 'fuse') return;
    const pos = { x: n.x, y: n.y };
    if (n.kind === 'firecracker') {
      if (this.kind === 'dog') { this.target = pos; this.setState('flee', W); Sfx.play('bark', 0.5); return; }
      if (this.state !== 'alert') { this.target = pos; this.waitT = 4; this.setState('distracted', W); this.icon = '?'; }
      return;
    }
    if (n.kind === 'gunshot') {
      const src = W.enemies.find((e) => e.id === n.src);
      this.becomeAlert(W, src ? (src.lastSeen || pos) : { x: W.player.x, y: W.player.y });
      return;
    }
    if (n.kind === 'shout') {
      const src = W.enemies.find((e) => e.id === n.src);
      if (src && src.state === 'alert') { this.becomeAlert(W, src.lastSeen); return; }
      if (this.state !== 'alert' && this.state !== 'search') { this.target = pos; this.sus = Math.max(this.sus, 0.5); this.setState('investigate', W); }
      return;
    }
    if (this.state === 'alert') return;
    if (this.state === 'search') { this.searchCenter = pos; this.searchT = Math.max(this.searchT, 5); return; }
    // ordinary noise
    this.sus = Math.max(this.sus, n.kind === 'scream' ? 0.7 : 0.45);
    this.target = pos; this.lastSeen = pos;
    if (this.state !== 'investigate') { Sfx.play('suspicious', 0.6); W.bark(this, U.pick(W.lines.hear), true); }
    this.setState('investigate', W);
    this.facing = n.x > this.x ? 1 : -1;
  }

  // horizontal move on current floor; returns true when arrived or blocked
  moveTo(tx, speed, dt, L) {
    if (tx === undefined || tx === null) { this.vx = 0; return true; }
    const dx = tx - this.x;
    if (Math.abs(dx) < 3) { this.vx = 0; return true; }
    const dir = Math.sign(dx);
    this.facing = dir;
    // doors: open them
    const aheadX = this.x + dir * 8;
    const door = this.world && this.world.doorAt(aheadX, this.y - 8);
    if (door && !door.open) {
      if (door.enemyCanOpen !== false && !door.gate && !door.locked) { door.setOpen(this.world, true, true); }
      else { this.vx = 0; return true; }
    }
    if (!this.canStand(L, this.x + dir * 7)) { this.vx = 0; return true; }
    this.vx = dir * speed;
    return false;
  }
  // multi-floor path: uses ladders when target is on another floor
  pathTo(tgt, speed, dt, L) {
    if (!tgt) { this.vx = 0; return true; }
    if (this.onLadder) return this.climbStep(dt, L);
    const dy = tgt.y - this.y;
    if (Math.abs(dy) > 20 && this.kind !== 'dog') {
      // find ladder on this floor leading toward target
      if (!this.ladderX || this.ladderFor !== Math.round(tgt.y)) {
        this.ladderX = this.findLadder(L, dy < 0 ? -1 : 1);
        this.ladderFor = Math.round(tgt.y);
      }
      if (this.ladderX !== null) {
        if (this.moveTo(this.ladderX, speed, dt, L)) {
          if (Math.abs(this.x - this.ladderX) < 4) { this.onLadder = true; this.climbDir = dy < 0 ? -1 : 1; this.climbGoal = tgt.y; this.x = this.ladderX; this.vx = 0; }
          else return true;
        }
        return false;
      }
      return this.moveTo(tgt.x, speed, dt, L);
    }
    this.ladderX = null;
    return this.moveTo(tgt.x, speed, dt, L);
  }
  findLadder(L, dir) {
    const r = Math.floor((this.y - 4) / TILE);
    const rr = dir < 0 ? r : r + 1;
    let best = null, bd = 1e9;
    for (let c = 0; c < L.w; c++) {
      if (L.type(c, rr) !== T.LADDER) continue;
      const x = c * TILE + 8;
      // must be reachable along the floor
      const step = Math.sign(x - this.x) || 1;
      let ok = true;
      for (let xx = this.x; Math.abs(xx - x) > 4; xx += step * 4) { if (!this.canStand(L, xx)) { ok = false; break; } }
      if (!ok) continue;
      const d = Math.abs(x - this.x);
      if (d < bd) { bd = d; best = x; }
    }
    return best;
  }
  climbStep(dt, L) {
    this.vx = 0;
    const ny = this.y + this.climbDir * 40 * dt;
    const c = Math.floor(this.x / TILE);
    if (this.climbDir < 0) {
      if (L.type(c, Math.floor((ny - 1) / TILE)) !== T.LADDER) { this.y = Math.floor((ny - 1) / TILE + 1) * TILE; this.onLadder = false; this.vy = 0; return false; }
    } else if (L.type(c, Math.floor(ny / TILE)) === T.SOLID || (L.type(c, Math.floor(ny / TILE)) !== T.LADDER && L.type(c, Math.floor((ny - 8) / TILE)) !== T.LADDER)) {
      this.y = Math.floor(ny / TILE) * TILE; this.onLadder = false; this.vy = 0; return false;
    }
    this.y = ny; this.vy = 0;
    return false;
  }

  draw(ctx, cam) {
    const sx = Math.round(this.x - cam.x - SW / 2), sy = Math.round(this.y - cam.y - SH);
    if (sx < -30 || sx > VW + 30 || sy < -40 || sy > VH + 30) return;
    if (this.body && this.body.hidden) return;
    if (this.body && this.body.dragged) return;
    let spr;
    if (this.kind === 'dog') {
      spr = Sprites.dog(Math.floor(this.anim * (Math.abs(this.vx) > 40 ? 12 : 7)) % 4, this.dead || this.ko ? 'dead' : Math.abs(this.vx) > 40 ? 'run' : 'walk', this.facing);
    } else {
      let pose = 'stand', f = Math.floor(this.anim * 1.5) % 2;
      if (this.dead) { pose = 'dead'; f = 0; }
      else if (this.ko) { pose = 'ko'; f = 0; }
      else if (this.onLadder) { pose = 'climb'; f = Math.floor(this.anim * 6) % 2; }
      else if (this.state === 'grabbed') { pose = 'stand'; f = 0; }
      else if (this.state === 'alert' && this.aimTarget) { pose = 'aim'; f = 0; }
      else if (Math.abs(this.vx) > 50) { pose = 'run'; f = Math.floor(this.anim * 11) % 4; }
      else if (Math.abs(this.vx) > 2) { pose = 'walk'; f = Math.floor(this.anim * 6) % 4; }
      else if (this.state === 'alert') { pose = 'alert'; }
      spr = Sprites.get(this.pal, pose, f, this.facing);
    }
    ctx.drawImage(spr, sx, sy);
  }
}

// ===========================================================================
// Civilians / talkable NPCs
class Civilian {
  constructor(x, y, opts = {}) {
    this.x = x; this.y = y; this.vx = 0; this.vy = 0; this.w = 8; this.h = 22;
    this.pal = opts.pal || U.pick(['civ_m1', 'civ_m2', 'civ_f1', 'civ_f2', 'worker']);
    this.facing = opts.facing || -1;
    this.home = { x, y };
    this.wander = opts.wander !== undefined ? opts.wander : !opts.scene;
    this.scene = opts.scene; this.name = opts.name || 'Civilian';
    this.id = opts.id; this.pose = opts.pose || 'stand';
    this.portrait = opts.portrait;
    this.onGround = true; this.anim = Math.random() * 5;
    this.state = 'idle'; this.t = Math.random() * 3; this.scared = false; this.cower = false;
    this.witness = opts.witness !== undefined ? opts.witness : true;
    this.talkOnce = opts.once; this.talked = false;
    this.hidden = false; this.target = null;
    this.bark = opts.bark;
    this.need = opts.need;
    this.pickpocket = opts.pickpocket || null;
    this.prompt = opts.prompt;
  }
  get alive() { return true; }
  update(dt, W) {
    const L = W.level;
    this.anim += dt; this.t -= dt;
    if (this.state === 'scripted') {
      if (this.target !== null && this.target !== undefined) {
        const dx = this.target - this.x;
        if (Math.abs(dx) > 2) { this.vx = Math.sign(dx) * (this.runScript ? 70 : 30); this.facing = Math.sign(dx); }
        else {
          this.vx = 0; this.target = null;
          if (this.thenPos) { this.x = this.thenPos.x; this.y = this.thenPos.y; this.vy = 0; this.thenPos = null; this.state = 'idle'; }
        }
        if (this.vx && L.blocked(this.x + Math.sign(this.vx) * 6 - 4, this.y - 20, this.x + Math.sign(this.vx) * 6 + 4, this.y - 1, true)) {
          if (this.thenPos) { this.x = this.thenPos.x; this.y = this.thenPos.y; this.vy = 0; this.thenPos = null; this.state = 'idle'; this.target = null; }
          this.vx = 0;
        }
      } else this.vx = 0;
      physMove(this, L, dt);
      return;
    }
    if (this.scared) {
      if (this.cower) this.vx = 0;
      else {
        const dir = this.x < W.player.x ? -1 : 1;
        this.facing = dir;
        const nx = this.x + dir * 10;
        const g = L.typeAt(nx, this.y + 2);
        if (!L.blocked(nx - 4, this.y - 20, nx + 4, this.y - 1, true) && (g === T.SOLID || g === T.ONEWAY)) this.vx = dir * 70; else { this.vx = 0; this.cower = true; }
        if (this.t < -4) this.cower = true;
      }
    } else if (this.wander) {
      if (this.t < 0) {
        this.t = 2 + Math.random() * 4;
        this.vx = Math.random() < 0.5 ? 0 : (Math.random() < 0.5 ? -1 : 1) * 16;
        if (this.vx) this.facing = Math.sign(this.vx);
      }
      if (Math.abs(this.x - this.home.x) > 40) { this.vx = Math.sign(this.home.x - this.x) * 16; this.facing = Math.sign(this.vx); }
      const nx = this.x + Math.sign(this.vx) * 8;
      const g = L.typeAt(nx, this.y + 2);
      if (this.vx && (L.blocked(nx - 4, this.y - 20, nx + 4, this.y - 1, true) || !(g === T.SOLID || g === T.ONEWAY))) this.vx = 0;
      // witness crimes
      if (this.witness) this.lookForCrime(W);
    } else if (this.witness) this.lookForCrime(W);
    physMove(this, L, dt);
  }
  lookForCrime(W) {
    const p = W.player, L = W.level;
    const see = (x, y) => {
      const dx = x - this.x;
      if (Math.abs(dx) > 110 || Math.abs(y - this.y) > 30) return false;
      if (dx * this.facing < 0 && Math.abs(dx) > 20) return false;
      return L.los(this.x, this.y - 18, x, y) && L.lightAt(x, y) > 0.2;
    };
    if (Game.settings.ghost) return;
    let crime = false;
    if (!p.hidden && (p.action || p.gunDrawn || p.drag) && see(p.x, p.y - 10)) crime = true;
    for (const e of W.enemies) if (!e.alive && e.body && !e.body.hidden && !e.body.dragged && see(e.x, e.y - 4)) crime = true;
    if (crime) this.panic(W);
  }
  panic(W) {
    if (this.scared) return;
    this.scared = true; this.t = 0; this.wander = false;
    Sfx.play('scream');
    W.bark(this, U.pick(['Aiyaa! Murder!', 'Help! Soldiers!', 'Heaven save us!', 'Somebody help!']));
    W.level.noise(this.x, this.y - 12, 200, 'civ', 'scream');
  }
  draw(ctx, cam) {
    const sx = Math.round(this.x - cam.x - SW / 2), sy = Math.round(this.y - cam.y - SH);
    if (sx < -30 || sx > VW + 30) return;
    let pose = this.pose, f = Math.floor(this.anim * 1.5) % 2;
    if (this.cower) { pose = 'crouch'; f = 0; }
    else if (Math.abs(this.vx) > 40) { pose = 'run'; f = Math.floor(this.anim * 10) % 4; }
    else if (Math.abs(this.vx) > 1) { pose = 'walk'; f = Math.floor(this.anim * 6) % 4; }
    ctx.drawImage(Sprites.get(this.pal, pose, f, this.facing), sx, sy);
  }
}

// ===========================================================================
// Companion that follows the player's breadcrumb trail
class Follower {
  constructor(x, y, opts = {}) {
    this.x = x; this.y = y; this.w = 8; this.h = 22; this.vx = 0; this.vy = 0;
    this.pal = opts.pal || 'ming'; this.name = opts.name || 'Ming'; this.id = opts.id || 'ming';
    this.facing = 1; this.stance = 'stand'; this.anim = 0; this.follower = true;
    this.waiting = false; this.visible = true; this.dead = false; this.moving = false;
    this.ti = -1; this.slow = opts.slow || 1; this.pose = 'stand'; this.frame = 0;
  }
  update(dt, W) {
    if (this.dead) return;
    const p = W.player;
    this.anim += dt;
    const trail = p.trail;
    const L = W.level;
    if (this.waiting) {
      this.moving = false; this.vx = 0;
      this.visible = true;
      this.pose = this.stance === 'prone' ? 'prone' : this.stance === 'crouch' ? 'crouch' : 'stand';
      return;
    }
    // aim for the trail point ~5 steps behind the player
    const lag = 4;
    const goalIdx = trail.length - 1 - lag;
    if (this.ti < 0 || this.ti >= trail.length) {
      let best = 0, bd = 1e9;
      for (let i = 0; i < trail.length; i++) { const d = Math.hypot(trail[i].x - this.x, trail[i].y - this.y); if (d < bd) { bd = d; best = i; } }
      this.ti = best;
    }
    // trail shifts when points drop
    if (this.lastLen === trail.length && trail.length === 120) this.ti = Math.max(0, this.ti - (this.shifted || 0));
    this.lastLen = trail.length;
    this.moving = false;
    if (this.ti < goalIdx && trail[this.ti]) {
      const pt = trail[this.ti];
      const dx = pt.x - this.x, dy = pt.y - this.y;
      const d = Math.hypot(dx, dy);
      let spd = (pt.st === 'prone' ? 16 : pt.st === 'crouch' ? 32 : p.running ? 100 : 55) * this.slow;
      if (d > 60) spd *= 1.6;
      const step = spd * dt;
      if (d <= step) { this.x = pt.x; this.y = pt.y; this.ti++; }
      else { this.x += (dx / d) * step; this.y += (dy / d) * step; }
      this.stance = pt.st;
      if (Math.abs(dx) > 0.5) this.facing = Math.sign(dx);
      this.moving = true;
      this.climbing = Math.abs(dy) > Math.abs(dx) * 1.5 && L.typeAt(this.x, this.y - 6) === T.LADDER;
    } else {
      this.stance = p.stance === 'prone' ? 'prone' : p.stance;
      if (p.hidden) this.stance = 'crouch';
    }
    this.h = STANCE_H[this.stance] || 22;
    this.running = p.running && this.moving;
    this.inGrass = L.typeAt(this.x, this.y - 3) === T.GRASS;
    // hidden together with the player when close to her hiding spot
    this.visible = !(p.hidden && Math.hypot(p.x - this.x, p.y - this.y) < 28);
    if (this.inGrass && this.stance !== 'stand') this.visible = false;
    if (this.climbing) { this.pose = 'climb'; this.frame = Math.floor(this.anim * 6) % 2; }
    else if (this.stance === 'prone') { this.pose = this.moving ? 'crawl' : 'prone'; this.frame = Math.floor(this.anim * 5) % 4; }
    else if (this.stance === 'crouch') { this.pose = this.moving ? 'crouchwalk' : 'crouch'; this.frame = Math.floor(this.anim * 6) % 4; }
    else if (this.moving) { this.pose = this.running ? 'run' : 'walk'; this.frame = Math.floor(this.anim * (this.running ? 11 : 7)) % 4; }
    else { this.pose = 'stand'; this.frame = Math.floor(this.anim * 1.5) % 2; }
    // footsteps
    if (this.moving && this.stance === 'stand') {
      this.stepAcc = (this.stepAcc || 0) + dt;
      if (this.stepAcc > (this.running ? 0.2 : 0.3)) { this.stepAcc = 0; if (this.running) L.noise(this.x, this.y - 4, 90, 'player', 'step'); }
    }
  }
  draw(ctx, cam) {
    if (this.dead) {
      ctx.drawImage(Sprites.get(this.pal, 'dead', 0, this.facing), Math.round(this.x - cam.x - SW / 2), Math.round(this.y - cam.y - SH));
      return;
    }
    if (!this.visible && Game.world.player.hidden) return;
    const sx = Math.round(this.x - cam.x - SW / 2), sy = Math.round(this.y - cam.y - SH);
    ctx.drawImage(Sprites.get(this.pal, this.pose, this.frame, this.facing), sx, sy);
    if (this.waiting) { ctx.fillStyle = '#e8d8a0'; ctx.fillRect(sx + 11, sy - 2, 2, 2); ctx.fillRect(sx + 9, sy - 5, 6, 1); }
  }
}
