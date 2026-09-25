'use strict';
// ---------------------------------------------------------------------------
// Game: global state machine, progression, inventory/flags, save/load,
// conditions for locked choices, and the main loop.
// ---------------------------------------------------------------------------
const Game = {
  state_: 'boot', world: null, script: null, checkpoint: null,
  flags: {}, items: {}, docs: [], photos: [], aff: {}, choices: [], objective: '',
  state: { gun: null, firecrackers: 0, kills: 0, kos: 0, deaths: 0, alerts: 0, time: 0 },
  chapter: 0, toasts: [], time: 0, sceneQueue: [],
  settings: { difficulty: 'normal', textSpeed: 55, cones: true, coneAlpha: 0.16, noiseRings: true, grain: true, master: 0.8, music: 0.55, sfx: 0.9, hints: true },
  meta: { achievements: {}, endings: {}, unlocked: 0, photosEver: {} },
  save: null,

  // ---------------------------------------------------------------- boot
  init() {
    this.canvas = document.getElementById('game');
    this.ctx = this.canvas.getContext('2d');
    this.buf = U.canvas(VW, VH); this.bctx = this.buf.getContext('2d');
    this.grainC = this.makeGrain();
    Input.init(this.canvas);
    const s = Store.load();
    if (s) {
      this.save = s;
      if (s.settings) Object.assign(this.settings, s.settings);
      if (s.meta) this.meta = Object.assign(this.meta, s.meta);
    }
    Sfx.setVolumes({ master: this.settings.master, music: this.settings.music, sfx: this.settings.sfx });
    const fit = () => {
      const r = Math.min((innerWidth - 32) / UIW, (innerHeight - 32) / UIH);
      this.canvas.style.width = Math.floor(UIW * r) + 'px';
      this.canvas.style.height = Math.floor(UIH * r) + 'px';
    };
    addEventListener('resize', fit); fit();
    this.goTitle();
    let last = performance.now();
    const loop = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      try { this.update(dt); this.draw(); } catch (e) { console.error(e); this.lastError = e; }
      Input.end();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    // expose debug helpers
    window.JADE = this;
  },
  makeGrain() {
    const c = U.canvas(480, 270), g = c.getContext('2d');
    const img = g.createImageData(480, 270);
    for (let i = 0; i < img.data.length; i += 4) { const v = Math.random() * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 10; }
    g.putImageData(img, 0, 0);
    return c;
  },

  // ---------------------------------------------------------------- state helpers
  resetRun() {
    this.flags = {}; this.items = {}; this.docs = []; this.photos = []; this.choices = [];
    this.aff = { lu: 0, han: 0, ming: 0, fang: 0, mori: 0 };
    this.state = { gun: null, firecrackers: 0, kills: 0, kos: 0, deaths: 0, alerts: 0, time: 0 };
    this.objective = '';
    this.give('jade_half', 1, true);
  },
  stateSnapshot() {
    return JSON.parse(JSON.stringify({ flags: this.flags, items: this.items, docs: this.docs, photos: this.photos, aff: this.aff, choices: this.choices, state: this.state, objective: this.objective }));
  },
  stateRestore(s) {
    const deaths = this.state.deaths;
    const c = JSON.parse(JSON.stringify(s));
    this.flags = c.flags; this.items = c.items; this.docs = c.docs; this.photos = c.photos; this.aff = c.aff; this.choices = c.choices; this.state = c.state; this.objective = c.objective;
    this.state.deaths = Math.max(deaths, this.state.deaths);
  },
  has(id) { return (this.items[id] || 0) > 0; },
  give(id, n = 1, silent) {
    this.items[id] = (this.items[id] || 0) + (n || 1);
    const it = Story.items[id];
    if (!silent) { Sfx.play('pickup'); this.toast(`Obtained: ${it ? it.name : id}`, 3.5); }
    if (id === 'medicine') this.flags.hasMedicine = true;
  },
  take(id) { if (this.items[id]) { this.items[id]--; if (!this.items[id]) delete this.items[id]; } },
  addDoc(id, silent) {
    if (!this.docs.includes(id)) this.docs.push(id);
    const d = Story.docs[id];
    Sfx.play('doc');
    if (d && !silent) this.showLetter(d.title, d.text, d.style);
    else if (d) this.toast(`Document added to journal: ${d.title}`, 3);
    if (d && d.flag) this.flags[d.flag] = true;
  },
  addPhoto(id, silent) {
    if (!this.photos.includes(id)) this.photos.push(id);
    this.meta.photosEver[id] = true;
    Sfx.play('photo');
    if (!silent) this.showMemory(id);
    if (this.photos.length >= Story.photoCount) this.unlock('all_photos');
    this.persistMeta();
  },
  addAff(o) { for (const k in o) this.aff[k] = (this.aff[k] || 0) + o[k]; },
  setObjective(t) { if (t !== this.objective) { this.objective = t; this.toast('Objective: ' + t, 3.5); } },
  logChoice(q, a) { this.choices.push({ ch: this.chapter, q, a }); },
  unlock(id) {
    if (this.meta.achievements[id]) return;
    this.meta.achievements[id] = Date.now();
    const a = Story.achievements[id];
    if (a) { this.toast(`★ Achievement: ${a.name}`, 4); Sfx.play('photo'); }
    this.persistMeta();
  },
  toast(text, t = 3) { this.toasts.push({ text, t, max: t }); if (this.toasts.length > 4) this.toasts.shift(); },
  difficulty() {
    return {
      story: { detect: 0.55, aim: 1.7, hear: 0.75, vision: 0.9 },
      normal: { detect: 1, aim: 1, hear: 1, vision: 1 },
      hard: { detect: 1.4, aim: 0.8, hear: 1.2, vision: 1.12 },
    }[this.settings.difficulty] || { detect: 1, aim: 1, hear: 1, vision: 1 };
  },
  portraitFor(who) {
    if (who === 'lan' || who === 'lan_think') return this.flags.lanLook || 'lan';
    if (who === 'ming' && this.flags.mingLook) return this.flags.mingLook;
    return Story.portraitAlias[who] || who;
  },
  nameOf(who) {
    if (who === 'lan_think') return 'Su Lan (thinking)';
    if (Story.names[who]) return Story.names[who];
    const d = Portraits.defs[Story.portraitAlias[who] || who];
    return d ? d.name : who;
  },

  // conditions: 'item:x', 'flag:x', 'flag:x=v', 'aff:han>=3', 'kills>=5', 'photos>=12', 'romance:han', '!cond', 'a&b', 'a|b'
  cond(c) {
    if (!c) return true;
    if (typeof c === 'function') return !!c(this);
    if (Array.isArray(c)) return c.every((q) => this.cond(q));
    if (c.includes('|')) return c.split('|').some((q) => this.cond(q.trim()));
    if (c.includes('&')) return c.split('&').every((q) => this.cond(q.trim()));
    if (c[0] === '!') return !this.cond(c.slice(1));
    const m = /^(\w+)(?::([\w.]+))?(?:\s*(>=|<=|==|=|>|<)\s*([\w.-]+))?$/.exec(c.trim());
    if (!m) { console.warn('bad cond', c); return false; }
    const [, kind, key, op, valRaw] = m;
    const cmp = (a, b) => { const bv = isNaN(+b) ? b : +b; switch (op) { case '>=': return a >= bv; case '<=': return a <= bv; case '>': return a > bv; case '<': return a < bv; case '==': case '=': return a == bv; default: return !!a; } }; // eslint-disable-line eqeqeq
    switch (kind) {
      case 'item': case 'has': return op ? cmp(this.items[key] || 0, valRaw) : this.has(key);
      case 'flag': return op ? cmp(this.flags[key], valRaw) : !!this.flags[key];
      case 'aff': return cmp(this.aff[key] || 0, valRaw);
      case 'doc': return this.docs.includes(key);
      case 'photo': return this.photos.includes(key);
      case 'romance': return this.flags.romance === key;
      case 'kills': return cmp(this.state.kills, valRaw);
      case 'kos': return cmp(this.state.kos, valRaw);
      case 'photos': return cmp(this.photos.length, valRaw);
      case 'alerts': return cmp(this.state.alerts, valRaw);
      default: return !!this.flags[kind];
    }
  },
  describeNeed(n) {
    if (!n) return '';
    if (typeof n === 'function') return 'Locked';
    const first = n.split('&')[0].split('|')[0].trim();
    const m = /^!?(\w+)(?::([\w.]+))?/.exec(first);
    if (!m) return 'Locked';
    const [, kind, key] = m;
    if (kind === 'item' || kind === 'has') return 'Requires: ' + (Story.items[key] ? Story.items[key].name : key);
    if (kind === 'doc') return 'Requires knowledge: ' + (Story.docs[key] ? Story.docs[key].title : key);
    if (kind === 'aff') return 'Requires: ' + (Story.names[key] || key) + '\'s trust';
    if (kind === 'romance') return 'Requires: a bond with ' + (Story.names[key] || key);
    if (kind === 'photos') return 'Requires: more memories';
    if (kind === 'flag') return Story.flagHints[key] || 'Requires: a past choice';
    return 'Locked';
  },

  // ---------------------------------------------------------------- flow
  goTitle() {
    this.state_ = 'title'; this.world = null; this.script = null;
    this.menu = { sel: 0 };
    Music.play('title'); Sfx.ambience('none'); Sfx.siren(false);
  },
  newGame() {
    this.resetRun();
    this.chapter = 0;
    this.startChapter(0);
  },
  continueGame() {
    const s = this.save;
    if (!s || !s.run) return this.newGame();
    this.stateRestore((s.chapterStarts && s.chapterStarts[s.chapter]) || s.run);
    this.chapter = s.chapter;
    this.startChapter(s.chapter, true);
  },
  playChapter(i) {
    const s = this.save;
    if (s && s.chapterStarts && s.chapterStarts[i]) this.stateRestore(s.chapterStarts[i]);
    else { this.resetRun(); Story.defaultStateFor(i, this); }
    this.chapter = i;
    this.startChapter(i, true);
  },
  startChapter(i, fromSave) {
    const ch = Story.chapters[i];
    this.chapter = i;
    if (!ch) { this.finishGame(); return; }
    // chapter-specific look for Lan
    if (ch.lanLook) this.flags.lanLook = ch.lanLook; else delete this.flags.lanLook;
    delete this.flags.outfit;
    this.meta.unlocked = Math.max(this.meta.unlocked || 0, i);
    this.persist(true);
    this.checkpoint = null;
    this.world = null;
    this.runScene(ch.intro, { bgMode: true, onEnd: () => this.loadLevel(ch) });
  },
  loadLevel(ch) {
    const def = Levels[ch.level];
    if (!def) { console.error('No level', ch.level); this.completeLevel(); return; }
    this.levelStartState = this.stateSnapshot();
    this.completing = false;
    this.world = new World(def);
    this.checkpoint = this.world.snapshot();
    this.state_ = 'play';
    if (def.objective) this.setObjective(def.objective);
    Music.play(def.music || 'stealth');
    Sfx.ambience(def.sound || 'none');
    if (def.introScene) this.runScene(def.introScene);
  },
  restoreCheckpoint() {
    const ch = Story.chapters[this.chapter];
    const def = Levels[ch.level];
    Sfx.siren(false);
    this.world = new World(def, this.checkpoint);
    this.state_ = 'play';
    Music.play(def.music || 'stealth');
    Sfx.ambience(def.sound || 'none');
    this.toasts = [];
    this.toast('Restarted from checkpoint', 2);
  },
  restartLevel() {
    this.stateRestore(this.levelStartState);
    const ch = Story.chapters[this.chapter];
    this.world = new World(Levels[ch.level]);
    this.checkpoint = this.world.snapshot();
    this.state_ = 'play';
    Music.play(this.world.def.music || 'stealth');
  },
  completeLevel(exitObj) {
    if (this.completing) return;
    this.completing = true;
    this.sceneQueue = [];
    const W = this.world;
    const ch = Story.chapters[this.chapter];
    if (W) {
      for (const k of ['alerts']) this.state[k] += W.stats[k];
      this.state.time += W.stats.time;
      this.lastStats = Object.assign({}, W.stats);
      Sfx.siren(false);
    }
    const outro = (exitObj && exitObj.scene) || ch.outro;
    const after = () => {
      if (ch.last) { this.finishGame(); return; }
      this.state_ = 'summary'; this.summary = { ch, stats: this.lastStats || {}, t: 0 };
      Music.play('calm');
    };
    if (outro) this.runScene(outro, { bgMode: true, onEnd: after }); else after();
  },
  nextChapter() { this.startChapter(this.chapter + 1); },
  finishGame() {
    const endId = Story.computeEnding(this);
    this.endingId = endId;
    this.meta.endings[endId] = true;
    if (!this.state.kills) this.unlock('clean_hands');
    this.unlock('ending_' + endId);
    this.persistMeta();
    this.runScene('ending_' + endId, {
      bgMode: true,
      onEnd: () => {
        if (this.photos.length >= Story.photoCount) this.runScene('epilogue_secret', { bgMode: true, onEnd: () => this.showCredits() });
        else this.showCredits();
      },
    });
  },
  showCredits() { this.state_ = 'credits'; this.creditsT = 0; Music.play('ending'); },

  runScene(id, opts = {}) {
    const lines = typeof id === 'string' ? Story.scenes[id] : id;
    if (!lines) { console.warn('Missing scene', id); if (opts.onEnd) opts.onEnd(); return; }
    if (this.script && !this.script.done) { this.sceneQueue.push([id, opts]); return; }
    const prevState = this.state_;
    const world = opts.bgMode ? null : this.world;
    this.state_ = 'script';
    const mood = Music.mood;
    const sc = new Script(lines, {
      world,
      bg: opts.bgMode ? 'black' : null,
      onEnd: (res) => {
        this.script = null;
        if (this.state_ === 'script') this.state_ = world ? 'play' : prevState === 'script' ? 'play' : prevState;
        if (world && this.state_ === 'play' && Music.mood !== mood) Music.play(world.def.music || 'stealth');
        if (opts.onEnd) opts.onEnd(res);
        if (this.sceneQueue.length && !this.script) { const [nid, nopts] = this.sceneQueue.shift(); this.runScene(nid, nopts); }
      },
    });
    // a scene made only of instant commands finishes inside its constructor (and may
    // already have started the next queued scene) — only keep it if it is still running
    if (!sc.done) this.script = sc;
  },
  showLetter(title, text, style) { this.runScene([{ letter: { title, text, style } }]); },
  showMemory(id) { this.runScene([{ memory: id }]); },

  onPlayerDeath(reason, by) {
    this.state.deaths++;
    this.state_ = 'dead';
    this.deathInfo = { reason, by, t: 0, quote: U.pick(Story.deathQuotes), tip: U.pick(Story.tips) };
    if (this.state.deaths >= 25) this.unlock('persistent');
  },
  scriptDeath(reason) {
    if (this.world) { this.world.player.dead = true; }
    this.onPlayerDeath(reason);
  },
  fail(text) {
    if (this.state_ === 'dead') return;
    this.state.deaths++;
    this.state_ = 'dead';
    Sfx.siren(false);
    Music.play('silence');
    this.deathInfo = { reason: 'fail', text, t: 0, quote: U.pick(Story.deathQuotes), tip: U.pick(Story.tips) };
  },
  openKeypad(o) { this.state_ = 'keypad'; this.keypad = { o, entry: '', t: 0, msg: '' }; },

  // ---------------------------------------------------------------- persistence
  persist(chapterStart) {
    const s = this.save || {};
    s.chapter = this.chapter;
    s.run = this.stateSnapshot();
    s.chapterStarts = s.chapterStarts || {};
    if (chapterStart) s.chapterStarts[this.chapter] = this.stateSnapshot();
    s.settings = this.settings; s.meta = this.meta;
    s.savedAt = Date.now();
    this.save = s;
    Store.save(s);
  },
  autosave() { /* checkpoint progress lives in memory; chapter progress is saved */ },
  persistMeta() { const s = this.save || {}; s.meta = this.meta; s.settings = this.settings; this.save = s; Store.save(s); },

  // ---------------------------------------------------------------- update
  update(dt) {
    this.time += dt;
    Input.pollPads();
    for (const t of this.toasts) t.t -= dt;
    this.toasts = this.toasts.filter((t) => t.t > 0);
    if (Input.pressed.has('F1')) { this.showHelp = !this.showHelp; }
    switch (this.state_) {
      case 'title': UI.updateTitle(dt); break;
      case 'menu': UI.updateMenu(dt); break;
      case 'play': {
        if (this.script && !this.script.done) { this.state_ = 'script'; break; }
        if (Input.hit('pause')) { this.state_ = 'pause'; this.pauseSel = 0; Sfx.play('choice'); break; }
        if (Input.hit('journal')) { this.state_ = 'journal'; UI.journal.open(); break; }
        this.world.update(dt);
        break;
      }
      case 'script':
        if (this.world && !this.script.opts.bgMode) this.updateWorldScripted(dt);
        if (this.script) this.script.update(dt);
        break;
      case 'journal': UI.journal.update(dt); break;
      case 'pause': UI.updatePause(dt); break;
      case 'settings': UI.updateSettings(dt); break;
      case 'keypad': UI.updateKeypad(dt); break;
      case 'dead':
        this.deathInfo.t += dt;
        if (this.world) this.world.fx.update(dt, this.world);
        if (this.deathInfo.t > 1.0 && (Input.hit('confirm') || Input.mouse.click)) this.restoreCheckpoint();
        if (this.deathInfo.t > 1.0 && Input.hit('pause')) this.goTitle();
        break;
      case 'summary':
        this.summary.t += dt;
        if (this.summary.t > 1 && (Input.hit('confirm') || Input.mouse.click)) this.nextChapter();
        break;
      case 'credits':
        this.creditsT += dt;
        if ((Input.hit('confirm') && this.creditsT > 3) || Input.hit('pause')) { this.goTitle(); }
        break;
      case 'chapters': UI.updateChapters(dt); break;
      case 'extras': UI.updateExtras(dt); break;
      default: break;
    }
  },
  updateWorldScripted(dt) {
    const W = this.world;
    W.time += dt;
    for (const n of W.npcs) if (n.state === 'scripted') n.update(dt, W);
    for (const e of W.enemies) if (e.state === 'scripted') e.update(dt, W);
    for (const f of W.followers) if (f.state === 'scripted') f.update(dt, W);
    W.fx.update(dt, W);
    W.updateCamera(dt);
    W.updateWeather(dt);
  },

  // ---------------------------------------------------------------- draw
  draw() {
    const g = this.ctx;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.imageSmoothingEnabled = false;
    g.fillStyle = '#000'; g.fillRect(0, 0, UIW, UIH);
    const showWorld = this.world && ['play', 'script', 'journal', 'pause', 'keypad', 'dead', 'settings'].includes(this.state_) && !(this.state_ === 'script' && this.script && this.script.opts.bgMode);
    if (showWorld) {
      this.world.draw(this.bctx);
      g.drawImage(this.buf, 0, 0, VW, VH, 0, 0, UIW, UIH);
      if (this.settings.grain) { g.globalAlpha = 0.5; g.drawImage(this.grainC, (Math.random() * 40) | 0, (Math.random() * 40) | 0, UIW, UIH); g.globalAlpha = 1; }
      g.imageSmoothingEnabled = true;
      if (this.state_ === 'play' || this.state_ === 'dead') UI.drawWorldOverlay(g, this.world);
      if (this.state_ === 'play') UI.drawHUD(g, this.world);
    }
    g.imageSmoothingEnabled = true;
    switch (this.state_) {
      case 'title': UI.drawTitle(g); break;
      case 'menu': UI.drawTitle(g); break;
      case 'script': if (this.script) this.script.draw(g, this.time); break;
      case 'journal': UI.journal.draw(g); break;
      case 'pause': UI.drawPause(g); break;
      case 'settings': UI.drawSettings(g); break;
      case 'keypad': UI.drawKeypad(g); break;
      case 'dead': UI.drawDeath(g); break;
      case 'summary': UI.drawSummary(g); break;
      case 'credits': UI.drawCredits(g); break;
      case 'chapters': UI.drawChapters(g); break;
      case 'extras': UI.drawExtras(g); break;
      default: break;
    }
    UI.drawToasts(g);
    if (this.showHelp) UI.drawHelp(g);
    // cinematic vignette
    const vg = g.createRadialGradient(UIW / 2, UIH / 2, UIH * 0.45, UIW / 2, UIH / 2, UIH * 1.05);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.45)');
    g.fillStyle = vg; g.fillRect(0, 0, UIW, UIH);
  },

  drawPaper(g, title, text, style) {
    const w = 1080, h = 820, x = (UIW - w) / 2, y = (UIH - h) / 2 - 20;
    const pg = g.createLinearGradient(x, y, x + w, y + h);
    const tele = style === 'telegram', type = style === 'typed' || tele, poster = style === 'poster';
    pg.addColorStop(0, tele ? '#e8dcb0' : poster ? '#d8c090' : '#efe4c8'); pg.addColorStop(1, tele ? '#c8b888' : poster ? '#b09860' : '#d4c49c');
    g.save();
    g.shadowColor = 'rgba(0,0,0,0.6)'; g.shadowBlur = 40;
    g.fillStyle = pg; g.fillRect(x, y, w, h);
    g.restore();
    // stains and fibres
    const r = U.srand((title || '').length * 31 + 1);
    for (let i = 0; i < 8; i++) { const gr = g.createRadialGradient(x + r() * w, y + r() * h, 1, x + r() * w, y + r() * h, 80 + r() * 60); gr.addColorStop(0, 'rgba(120,90,40,0.08)'); gr.addColorStop(1, 'rgba(120,90,40,0)'); g.fillStyle = gr; g.fillRect(x, y, w, h); }
    g.strokeStyle = 'rgba(90,60,30,0.4)'; g.lineWidth = 2; g.strokeRect(x + 20, y + 20, w - 40, h - 40);
    if (poster) { g.fillStyle = '#9a1a14'; g.fillRect(x + 20, y + 20, w - 40, 90); }
    g.fillStyle = poster ? '#f4e8c8' : '#2a1a10';
    g.font = `700 44px ${type ? FONT_TYPE : FONT}`;
    g.textAlign = 'center'; g.fillText(title || '', UIW / 2, y + 80);
    g.textAlign = 'left';
    g.fillStyle = '#2a1e14';
    g.font = type ? `28px ${FONT_TYPE}` : `italic 32px ${FONT}`;
    const lines = U.wrap(g, text || '', w - 140);
    const lh = type ? 38 : 42;
    let yy = y + 150;
    for (const l of lines) { if (yy > y + h - 40) break; g.fillText(l, x + 70, yy); yy += lh; }
    if (tele) { g.fillStyle = 'rgba(160,30,20,0.6)'; g.font = `700 30px ${FONT_TYPE}`; g.save(); g.translate(x + w - 220, y + h - 90); g.rotate(-0.2); g.strokeStyle = 'rgba(160,30,20,0.6)'; g.lineWidth = 4; g.strokeRect(-20, -40, 200, 60); g.fillText('SECRET', 10, 0); g.restore(); }
  },
  drawPhoto(g, P, cx, cy, t) {
    const w = 760, h = 520;
    g.save();
    g.translate(cx, cy); g.rotate(-0.02 + Math.sin(t * 0.5) * 0.004);
    g.shadowColor = 'rgba(0,0,0,0.7)'; g.shadowBlur = 40;
    g.fillStyle = '#f2ecdc'; g.fillRect(-w / 2 - 30, -h / 2 - 30, w + 60, h + 130);
    g.shadowBlur = 0;
    const art = Art.get(P.art || 'memory');
    g.drawImage(art, 60, 20, 840, 500, -w / 2, -h / 2, w, h);
    g.globalCompositeOperation = 'color'; g.fillStyle = 'rgba(140,100,50,0.7)'; g.fillRect(-w / 2, -h / 2, w, h);
    g.globalCompositeOperation = 'multiply'; g.fillStyle = 'rgba(230,210,170,0.5)'; g.fillRect(-w / 2, -h / 2, w, h);
    g.globalCompositeOperation = 'source-over';
    // figures of the siblings drawn as soft silhouettes
    if (P.figures) {
      g.fillStyle = 'rgba(40,28,18,0.75)';
      P.figures.forEach((f, i) => { const fx = -80 + i * 120, fy = h / 2 - 20; g.beginPath(); g.arc(fx, fy - 170, 26, 0, Math.PI * 2); g.fill(); g.beginPath(); g.moveTo(fx - 38, fy - 140); g.lineTo(fx + 38, fy - 140); g.lineTo(fx + (f === 'lan' ? 50 : 34), fy); g.lineTo(fx - (f === 'lan' ? 50 : 34), fy); g.fill(); if (f === 'lan') { g.fillRect(fx - 28, fy - 196, 56, 34); } if (f === 'ming') { g.strokeStyle = 'rgba(40,28,18,0.9)'; g.lineWidth = 3; g.beginPath(); g.arc(fx - 10, fy - 172, 8, 0, Math.PI * 2); g.arc(fx + 10, fy - 172, 8, 0, Math.PI * 2); g.stroke(); } });
    }
    g.fillStyle = '#3a2a1a'; g.font = `italic 30px ${FONT}`; g.textAlign = 'center';
    g.fillText(P.title, 0, h / 2 + 60);
    g.restore();
    g.fillStyle = '#e8dcc0'; g.font = `italic 28px ${FONT}`; g.textAlign = 'center';
    const lines = U.wrap(g, P.text, 1300);
    lines.forEach((l, i) => g.fillText(l, UIW / 2, cy + h / 2 + 150 + i * 36));
    g.textAlign = 'left';
  },
};

window.addEventListener('load', () => Game.init());
