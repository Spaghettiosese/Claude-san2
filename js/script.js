'use strict';
// ---------------------------------------------------------------------------
// Cutscene & dialogue runner. Scenes are arrays of commands:
//   'text'                         narration
//   ['id:expr', 'text']            spoken line with portrait
//   {choice:[{t, go, need, set, aff, give}], timer, timeout}
//   {label}, {go}, {if:'cond', go}, {bg}, {title}, {wait}, {fade}, {qte},
//   {hold}, {timing}, {letter}, {memory}, {music}, {sfx}, {amb}, {set},
//   {aff}, {give}, {take}, {doc}, {photo}, {obj}, {call}, {npc}, {cam},
//   {die}, {fail}, {end}, {shake}, {flash}, {ach}
// ---------------------------------------------------------------------------
const FONT = '"Noto Serif SC", "Songti SC", Georgia, "Times New Roman", serif';
const FONT_UI = '"Noto Sans SC", "Segoe UI", Arial, sans-serif';
const FONT_TYPE = '"Special Elite", "Courier New", monospace';

class Script {
  constructor(lines, opts = {}) {
    this.lines = lines || [];
    this.opts = opts;
    this.world = opts.world || null;
    this.i = 0; this.done = false; this.cur = null; this.t = 0;
    this.labels = {};
    this.lines.forEach((l, i) => { if (l && l.label) this.labels[l.label] = i; });
    this.bg = opts.bg !== undefined ? opts.bg : null; this.bgT = 0;
    this.fade = opts.fadeIn ? 1 : 0; this.fadeTarget = 0; this.fadeSpeed = 1;
    this.left = null; this.right = null; this.speaking = null;
    this.flash = 0; this.hover = -1; this.sel = 0;
    this.advance();
  }
  jump(label) {
    if (!(label in this.labels)) { console.warn('Missing label', label); this.done = true; return; }
    this.i = this.labels[label] + 1;
  }
  advance() {
    // run instant commands until a blocking one
    let guard = 0;
    while (!this.done && guard++ < 500) {
      if (this.i >= this.lines.length) { this.finish(); return; }
      const raw = this.lines[this.i++];
      const c = this.normalize(raw);
      if (!c) continue;
      if (this.instant(c)) continue;
      this.cur = c; this.t = 0; this.chars = 0; this.sel = 0;
      if (c.type === 'say') this.onSay(c);
      if (c.type === 'choice') this.prepChoice(c);
      return;
    }
  }
  normalize(raw) {
    if (raw === null || raw === undefined) return null;
    if (typeof raw === 'string') return { type: 'say', who: 'narr', text: raw };
    if (Array.isArray(raw)) {
      const [spk, text, extra] = raw;
      const [who, expr] = spk.split(':');
      return Object.assign({ type: 'say', who, expr: expr || 'neutral', text }, extra || {});
    }
    if (raw.choice) return Object.assign({ type: 'choice' }, raw);
    if (raw.title) return Object.assign({ type: 'title' }, raw);
    if (raw.wait !== undefined) return { type: 'wait', dur: raw.wait };
    if (raw.fade) return { type: 'fade', dir: raw.fade, dur: raw.t || 1 };
    if (raw.qte) return Object.assign({ type: 'qte' }, raw);
    if (raw.hold) return Object.assign({ type: 'hold' }, raw);
    if (raw.timing) return Object.assign({ type: 'timing' }, raw);
    if (raw.letter) return Object.assign({ type: 'letter' }, raw.letter, { raw });
    if (raw.memory) return { type: 'memory', id: raw.memory };
    if (raw.say) return Object.assign({ type: 'say', who: raw.say, expr: raw.e || 'neutral', text: raw.t }, raw);
    if (raw.npcWait) return { type: 'npcWait', id: raw.npcWait };
    return Object.assign({ type: 'instant' }, raw);
  }
  instant(c) {
    if (c.type !== 'instant') return false;
    const G = Game;
    if (c.label) return true;
    if (c.go) { this.jump(c.go); return true; }
    if (c.if !== undefined) { if (G.cond(c.if)) { if (c.then) this.jump(c.then); } else if (c.else) this.jump(c.else); return true; }
    if (c.bg !== undefined) { this.bg = c.bg; this.bgT = 0; }
    if (c.music) Music.play(c.music);
    if (c.sfx) Sfx.play(c.sfx);
    if (c.amb !== undefined) Sfx.ambience(c.amb);
    if (c.siren !== undefined) Sfx.siren(c.siren);
    if (c.set) Object.assign(G.flags, c.set);
    if (c.aff) G.addAff(c.aff);
    if (c.give) G.give(c.give, c.count);
    if (c.take) G.take(c.take);
    if (c.doc) G.addDoc(c.doc, true);
    if (c.photo) G.addPhoto(c.photo, true);
    if (c.obj) G.setObjective(c.obj);
    if (c.ach) G.unlock(c.ach);
    if (c.romance) G.flags.romance = c.romance;
    if (c.shake) { if (this.world) this.world.shake = c.shake; this.shakeT = c.shake; }
    if (c.flash) this.flash = 1;
    if (c.call) { try { c.call(G, this.world, this); } catch (e) { console.error(e); } }
    if (c.npc && this.world) {
      const n = this.world.npcs.find((q) => q.id === c.npc.id) || this.world.followers.find((q) => q.id === c.npc.id) || this.world.enemies.find((q) => q.id === c.npc.id);
      if (n) {
        if (c.npc.to !== undefined) { n.state = 'scripted'; n.target = c.npc.to * TILE + 8; n.runScript = !!c.npc.run; if (n instanceof Enemy) n.target = { x: c.npc.to * TILE + 8, y: n.y }; }
        if (c.npc.face) n.facing = c.npc.face;
        if (c.npc.remove) { n.removed = true; this.world.followers = this.world.followers.filter((q) => q !== n); }
        if (c.npc.release) { n.state = n instanceof Enemy ? 'return' : 'idle'; }
      }
    }
    if (c.cam !== undefined && this.world) this.world.camTarget = c.cam ? { x: c.cam.x * TILE, y: c.cam.y * TILE } : null;
    if (c.portrait) { if (c.portrait.left !== undefined) this.left = c.portrait.left; if (c.portrait.right !== undefined) this.right = c.portrait.right; }
    if (c.die) { this.finish(); G.scriptDeath(c.die); return true; }
    if (c.fail) { this.finish(); G.fail(c.fail); return true; }
    if (c.end) { this.finish(c.end); return true; }
    if (c.complete) { this.finish('complete'); setTimeout(() => Game.completeLevel(), 0); return true; }
    return true;
  }
  onSay(c) {
    const who = c.who;
    if (who === 'narr' || who === 'sign') { this.speaking = null; return; }
    const pid = Game.portraitFor(who);
    c.pid = pid;
    if (who === 'lan' || who === 'lan_think') { this.left = pid; this.speaking = 'left'; }
    else { this.right = pid; this.speaking = 'right'; }
  }
  prepChoice(c) {
    c.opts = c.choice.map((o) => {
      const ok = !o.need || Game.cond(o.need);
      return Object.assign({}, o, { locked: !ok, show: ok || !o.hideLocked });
    }).filter((o) => o.show && (!o.if || Game.cond(o.if)));
    c.timeLeft = c.timer || 0;
    this.sel = c.opts.findIndex((o) => !o.locked);
  }
  pick(o) {
    if (!o || o.locked) { Sfx.play('locked'); return; }
    Sfx.play('select');
    Game.logChoice(this.cur.id || this.cur.choice[0].t, o.t);
    if (o.set) Object.assign(Game.flags, o.set);
    if (o.aff) Game.addAff(o.aff);
    if (o.give) Game.give(o.give);
    if (o.take) Game.take(o.take);
    if (o.ach) Game.unlock(o.ach);
    if (o.romance) Game.flags.romance = o.romance;
    this.cur = null;
    if (o.go) this.jump(o.go);
    this.advance();
  }
  finish(res) {
    if (this.done) return;
    this.done = true; this.result = res;
    if (this.world) this.world.camTarget = null;
    if (this.opts.onEnd) this.opts.onEnd(res);
  }

  // ---------------------------------------------------------------- update
  update(dt) {
    if (this.done) return;
    this.t += dt; this.bgT += dt;
    this.flash = Math.max(0, this.flash - dt * 2);
    if (this.fade !== this.fadeTarget) this.fade = U.approach(this.fade, this.fadeTarget, dt / Math.max(0.05, this.fadeSpeed));
    const c = this.cur;
    if (!c) { this.advance(); return; }
    const conf = Input.hit('confirm') || Input.mouse.click;
    const ff = Input.is('run');
    switch (c.type) {
      case 'say': {
        const len = c.text.length;
        const cps = Game.settings.textSpeed || 55;
        const prev = Math.floor(this.chars);
        this.chars = Math.min(len, this.chars + dt * cps * (ff ? 6 : 1));
        if (Math.floor(this.chars) !== prev && Math.floor(this.chars) % 3 === 0 && c.who !== 'narr') Sfx.play('blip', 0.7);
        if (conf || (ff && this.chars >= len && this.t > 0.15)) {
          if (this.chars < len) this.chars = len;
          else { this.cur = null; this.advance(); }
        }
        break;
      }
      case 'choice': {
        const n = c.opts.length;
        if (Input.hit('down')) { do { this.sel = (this.sel + 1) % n; } while (c.opts[this.sel].locked && c.opts.some((o) => !o.locked)); Sfx.play('choice'); }
        if (Input.hit('up')) { do { this.sel = (this.sel - 1 + n) % n; } while (c.opts[this.sel].locked && c.opts.some((o) => !o.locked)); Sfx.play('choice'); }
        const d = Input.digit();
        if (d && +d >= 1 && +d <= n) { this.pick(c.opts[+d - 1]); break; }
        if (Input.mouse.click && this.hover >= 0) { this.pick(c.opts[this.hover]); break; }
        if (Input.hit('interact') || Input.pressed.has('Enter')) { this.pick(c.opts[this.sel]); break; }
        if (c.timer) {
          c.timeLeft -= dt;
          if (c.timeLeft <= 0) {
            const idx = c.timeout !== undefined ? c.timeout : c.opts.length - 1;
            const o = c.opts[Math.min(idx, c.opts.length - 1)];
            Game.toast('Too slow...', 1.5);
            this.pick(o.locked ? c.opts.find((q) => !q.locked) : o);
          }
        }
        break;
      }
      case 'title': {
        const dur = c.dur || 5.5;
        if ((conf && this.t > 1.2) || this.t > dur) { this.cur = null; this.advance(); }
        break;
      }
      case 'wait': if (this.t >= c.dur) { this.cur = null; this.advance(); } break;
      case 'fade':
        this.fadeTarget = c.dir === 'out' ? 1 : 0; this.fadeSpeed = c.dur;
        if (this.t >= c.dur) { this.fade = this.fadeTarget; this.cur = null; this.advance(); }
        break;
      case 'letter': case 'memory':
        if (conf && this.t > 0.6) { this.cur = null; this.advance(); }
        break;
      case 'npcWait': {
        const W = this.world;
        const n = W && (W.npcs.find((q) => q.id === c.id) || W.enemies.find((q) => q.id === c.id));
        if (!n || n.target === null || n.target === undefined || (n.target && n.target.x !== undefined && Math.abs(n.target.x - n.x) < 4) || this.t > 8) { this.cur = null; this.advance(); }
        break;
      }
      case 'qte': {
        const q = c.qte;
        c.prog = c.prog || 0;
        const keyHit = q.key ? Input.pressed.has(q.key) : Input.hit('interact');
        if (keyHit) { c.prog++; Sfx.play('qte'); this.shakeT = 0.1; }
        c.prog = Math.max(0, c.prog - dt * (q.decay || 1.5));
        if (c.prog >= q.count) { this.cur = null; if (c.win) this.jump(c.win); this.advance(); }
        else if (this.t > q.time) { this.cur = null; if (c.fail) this.jump(c.fail); else if (c.die) { this.finish(); Game.scriptDeath(c.die); return; } this.advance(); }
        break;
      }
      case 'hold': {
        const h = c.hold;
        c.prog = c.prog || 0;
        const held = Input.down.has(h.key || 'Space');
        if (held) c.prog += dt; else c.prog = Math.max(0, c.prog - dt * (h.decay || 2));
        if (this.t > 0.8 && !held && c.prog > 0 && h.strict) { this.cur = null; if (c.fail) this.jump(c.fail); this.advance(); break; }
        if (c.prog >= h.time) { this.cur = null; this.advance(); }
        else if (this.t > (h.limit || h.time * 3)) { this.cur = null; if (c.fail) this.jump(c.fail); this.advance(); }
        break;
      }
      case 'timing': {
        const tm = c.timing;
        c.pos = (Math.sin(this.t * (tm.speed || 3) - Math.PI / 2) + 1) / 2;
        const zone = [tm.at || 0.5, tm.size || 0.14];
        if (Input.hit('interact') || Input.hit('kill') || Input.hit('jump')) {
          const ok = Math.abs(c.pos - zone[0]) < zone[1] / 2;
          Sfx.play(ok ? 'select' : 'locked');
          this.cur = null;
          if (ok) { if (c.win) this.jump(c.win); } else if (c.fail) this.jump(c.fail);
          this.advance();
        } else if (this.t > (tm.limit || 6)) { this.cur = null; if (c.fail) this.jump(c.fail); this.advance(); }
        break;
      }
      default: this.cur = null; this.advance();
    }
    this.shakeT = Math.max(0, (this.shakeT || 0) - dt);
  }

  // ---------------------------------------------------------------- draw (UI canvas 1920x1080)
  draw(g, time) {
    const c = this.cur;
    const sx = this.shakeT > 0 ? (Math.random() - 0.5) * 24 * this.shakeT : 0;
    // background art
    if (this.bg) {
      const a = Math.min(1, this.bgT * 2);
      g.save(); g.globalAlpha = 1;
      g.drawImage(Art.get(this.bg), sx - 20 - Math.sin(time * 0.05) * 20, -10, UIW + 40, UIH + 20);
      Art.overlay(g, this.bg, time, sx - 20, -10, UIW + 40, UIH + 20);
      g.restore(); void a;
    } else if (c && (c.type === 'say' || c.type === 'choice')) {
      g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(0, 0, UIW, UIH);
    }
    if (!c) { this.drawFade(g); return; }
    if (c.type === 'title') this.drawTitle(g, c);
    if (c.type === 'say' || c.type === 'choice') this.drawDialogue(g, c, time);
    if (c.type === 'letter') this.drawLetter(g, c);
    if (c.type === 'memory') this.drawMemory(g, c);
    if (c.type === 'qte' || c.type === 'hold' || c.type === 'timing') this.drawQTE(g, c, time);
    this.drawFade(g);
    if (this.flash > 0) { g.fillStyle = `rgba(255,250,235,${this.flash})`; g.fillRect(0, 0, UIW, UIH); }
  }
  drawFade(g) { if (this.fade > 0) { g.fillStyle = `rgba(0,0,0,${this.fade})`; g.fillRect(0, 0, UIW, UIH); } }

  drawTitle(g, c) {
    const a = Math.min(1, this.t * 1.2);
    g.fillStyle = `rgba(4,3,4,${Math.min(0.94, a)})`; g.fillRect(0, 0, UIW, UIH);
    g.save(); g.globalAlpha = a; g.textAlign = 'center';
    if (c.kicker) { g.fillStyle = '#b89a58'; g.font = `600 30px ${FONT}`; g.fillText(c.kicker.toUpperCase().split('').join(' '), UIW / 2, 330); }
    g.fillStyle = '#f0e6d0'; g.font = `700 96px ${FONT}`; g.fillText(c.title, UIW / 2, 450);
    if (c.sub) { g.fillStyle = '#c8a860'; g.font = `italic 48px ${FONT}`; g.fillText(c.sub, UIW / 2, 530); }
    g.strokeStyle = '#8a7040'; g.lineWidth = 2; g.beginPath(); g.moveTo(UIW / 2 - 300, 580); g.lineTo(UIW / 2 + 300, 580); g.stroke();
    if (c.place) {
      const n = Math.min(c.place.length, Math.floor(Math.max(0, this.t - 0.8) * 30));
      g.fillStyle = '#d8d0c0'; g.font = `32px ${FONT_TYPE}`; g.fillText(c.place.slice(0, n), UIW / 2, 640);
    }
    if (c.note && this.t > 1.6) {
      g.globalAlpha = Math.min(1, (this.t - 1.6) * 1.2) * a;
      g.fillStyle = '#9a9080'; g.font = `italic 28px ${FONT}`;
      const lines = U.wrap(g, c.note, 1200);
      lines.forEach((l, i) => g.fillText(l, UIW / 2, 740 + i * 40));
    }
    g.restore();
  }

  drawPortraits(g, time) {
    const pw = 420, ph = 525, py = 300;
    const draw = (id, side) => {
      if (!id) return;
      const active = this.speaking === side;
      const bob = active ? Math.sin(time * 2) * 3 : 0;
      const x = side === 'left' ? 30 : UIW - pw - 30;
      const expr = (active && this.cur && this.cur.expr) ? this.cur.expr : (side === 'left' ? this.leftExpr : this.rightExpr) || 'neutral';
      if (active && this.cur && this.cur.expr) { if (side === 'left') this.leftExpr = this.cur.expr; else this.rightExpr = this.cur.expr; }
      g.save();
      g.shadowColor = 'rgba(0,0,0,0.6)'; g.shadowBlur = 30;
      Portraits.draw(g, id, expr, x, py + (active ? -10 : 10) + bob, pw, ph, false, active ? 1 : 0.55);
      g.restore();
    };
    draw(this.left, 'left'); draw(this.right, 'right');
  }

  drawDialogue(g, c, time) {
    const say = c.type === 'say' ? c : this.lastSay;
    if (c.type === 'say') this.lastSay = c;
    this.drawPortraits(g, time);
    const bx = 300, by = 790, bw = 1320, bh = 260;
    if (say) {
      const narr = say.who === 'narr';
      const think = say.who === 'lan_think';
      g.save();
      const bgr = g.createLinearGradient(0, by, 0, by + bh);
      bgr.addColorStop(0, 'rgba(18,14,12,0.94)'); bgr.addColorStop(1, 'rgba(8,6,6,0.96)');
      g.fillStyle = bgr; g.fillRect(bx, by, bw, bh);
      g.strokeStyle = '#8a7040'; g.lineWidth = 3; g.strokeRect(bx + 6, by + 6, bw - 12, bh - 12);
      g.strokeStyle = 'rgba(200,170,100,0.3)'; g.lineWidth = 1; g.strokeRect(bx + 14, by + 14, bw - 28, bh - 28);
      if (!narr) {
        const name = say.name || Game.nameOf(say.who);
        g.font = `700 36px ${FONT}`;
        const nw = g.measureText(name).width + 60;
        const nx = this.speaking === 'right' ? bx + bw - nw - 40 : bx + 40;
        g.fillStyle = '#6a1a14'; g.fillRect(nx, by - 30, nw, 56);
        g.strokeStyle = '#c8a050'; g.lineWidth = 2; g.strokeRect(nx + 4, by - 26, nw - 8, 48);
        g.fillStyle = '#f4e4c0'; g.textAlign = 'left'; g.fillText(name, nx + 30, by + 10);
      }
      g.fillStyle = narr ? '#d8ccb0' : think ? '#b8c8d8' : '#f2eadc';
      g.font = `${narr || think ? 'italic ' : ''}38px ${FONT}`;
      const txt = say === c ? say.text.slice(0, Math.floor(this.chars)) : say.text;
      const lines = U.wrap(g, say.text, bw - 120);
      let shown = txt.length, y = by + 80;
      for (const l of lines) {
        if (shown <= 0) break;
        g.fillText(l.slice(0, shown), bx + 60, y);
        shown -= l.length + 1; y += 50;
      }
      if (c.type === 'say' && this.chars >= say.text.length) {
        g.fillStyle = '#c8a050';
        const tri = by + bh - 34 + Math.sin(time * 6) * 4;
        g.beginPath(); g.moveTo(bx + bw - 60, tri); g.lineTo(bx + bw - 40, tri); g.lineTo(bx + bw - 50, tri + 12); g.fill();
      }
      g.restore();
    }
    if (c.type === 'choice') this.drawChoices(g, c, time);
  }

  drawChoices(g, c, time) {
    const n = c.opts.length;
    const w = 1100, h = 74, gap = 16;
    const x = (UIW - w) / 2;
    const y0 = 760 - n * (h + gap);
    this.hover = -1;
    if (c.prompt) {
      g.fillStyle = 'rgba(0,0,0,0.7)'; g.fillRect(x, y0 - 70, w, 56);
      g.fillStyle = '#e8d8b0'; g.font = `italic 32px ${FONT}`; g.textAlign = 'center'; g.fillText(c.prompt, UIW / 2, y0 - 32); g.textAlign = 'left';
    }
    c.opts.forEach((o, i) => {
      const y = y0 + i * (h + gap);
      const mx = Input.mouse.x, my = Input.mouse.y;
      const over = mx > x && mx < x + w && my > y && my < y + h;
      if (over) { this.hover = i; if (Input.mouse.moved && !o.locked) this.sel = i; }
      const sel = this.sel === i;
      g.fillStyle = o.locked ? 'rgba(20,18,18,0.85)' : sel ? 'rgba(110,30,22,0.95)' : 'rgba(22,16,14,0.92)';
      g.fillRect(x, y, w, h);
      g.strokeStyle = o.locked ? '#4a4038' : sel ? '#f0c060' : '#8a7040'; g.lineWidth = sel ? 3 : 2; g.strokeRect(x + 3, y + 3, w - 6, h - 6);
      g.font = `600 32px ${FONT}`;
      g.fillStyle = o.locked ? '#6a6058' : '#c8a050';
      g.fillText(String(i + 1), x + 28, y + 48);
      g.fillStyle = o.locked ? '#7a7068' : '#f4ead8';
      g.font = `${o.tone === 'thought' ? 'italic ' : ''}32px ${FONT}`;
      let label = o.t;
      if (o.locked) label = '🔒 ' + o.t;
      g.fillText(label, x + 72, y + 48);
      if (o.locked && o.lockText !== false) {
        g.font = `italic 22px ${FONT_UI}`; g.fillStyle = '#9a6a50';
        const need = o.lockText || Game.describeNeed(o.need);
        g.textAlign = 'right'; g.fillText(need, x + w - 24, y + 46); g.textAlign = 'left';
      } else if (o.tag) {
        g.font = `italic 22px ${FONT_UI}`; g.fillStyle = '#a8a070'; g.textAlign = 'right'; g.fillText(o.tag, x + w - 24, y + 46); g.textAlign = 'left';
      }
    });
    if (c.timer) {
      const k = Math.max(0, c.timeLeft / c.timer);
      g.fillStyle = 'rgba(0,0,0,0.7)'; g.fillRect(x, y0 - 24, w, 12);
      g.fillStyle = k < 0.3 ? '#e04030' : '#e0b040'; g.fillRect(x, y0 - 24, w * k, 12);
    }
  }

  drawLetter(g, c) {
    g.fillStyle = 'rgba(0,0,0,0.7)'; g.fillRect(0, 0, UIW, UIH);
    Game.drawPaper(g, c.title, c.text, c.style);
    g.fillStyle = '#a89878'; g.font = `italic 24px ${FONT}`; g.textAlign = 'center'; g.fillText('[E / Enter] continue', UIW / 2, 1050); g.textAlign = 'left';
  }
  drawMemory(g, c) {
    const P = Story.photos[c.id];
    g.fillStyle = 'rgba(0,0,0,0.8)'; g.fillRect(0, 0, UIW, UIH);
    if (P) Game.drawPhoto(g, P, UIW / 2, 470, this.t);
    g.fillStyle = '#a89878'; g.font = `italic 24px ${FONT}`; g.textAlign = 'center'; g.fillText('[E / Enter] continue', UIW / 2, 1050); g.textAlign = 'left';
  }
  drawQTE(g, c, time) {
    g.fillStyle = 'rgba(0,0,0,0.45)'; g.fillRect(0, 0, UIW, UIH);
    const x = UIW / 2 - 400, y = 700, w = 800;
    g.textAlign = 'center';
    g.fillStyle = '#f0e0c0'; g.font = `700 44px ${FONT}`;
    g.fillText(c.text || (c.type === 'qte' ? 'Struggle!' : c.type === 'hold' ? 'Hold your breath...' : 'Now!'), UIW / 2, y - 90);
    let k = 0, label = '';
    if (c.type === 'qte') { k = (c.prog || 0) / c.qte.count; label = `Mash [${c.qte.label || 'E'}]`; }
    if (c.type === 'hold') { k = (c.prog || 0) / c.hold.time; label = `Hold [${c.hold.label || 'SPACE'}]`; }
    g.fillStyle = 'rgba(20,14,12,0.9)'; g.fillRect(x, y, w, 40);
    g.strokeStyle = '#c8a050'; g.lineWidth = 3; g.strokeRect(x, y, w, 40);
    if (c.type === 'timing') {
      const tm = c.timing; const zc = tm.at || 0.5, zs = tm.size || 0.14;
      g.fillStyle = 'rgba(80,200,90,0.6)'; g.fillRect(x + w * (zc - zs / 2), y, w * zs, 40);
      g.fillStyle = '#fff4d0'; g.fillRect(x + w * (c.pos || 0) - 4, y - 10, 8, 60);
      label = `Press [E] in the green`;
    } else {
      g.fillStyle = '#c83a2a'; g.fillRect(x + 4, y + 4, (w - 8) * U.clamp(k, 0, 1), 32);
    }
    const lim = c.type === 'qte' ? c.qte.time : c.type === 'hold' ? (c.hold.limit || c.hold.time * 3) : (c.timing.limit || 6);
    g.fillStyle = '#e0b040'; g.fillRect(x, y + 50, w * Math.max(0, 1 - this.t / lim), 6);
    const pulse = 1 + Math.sin(time * 12) * 0.06;
    g.font = `700 ${Math.round(40 * pulse)}px ${FONT_UI}`; g.fillStyle = '#fff'; g.fillText(label, UIW / 2, y + 120);
    g.textAlign = 'left';
  }
}
