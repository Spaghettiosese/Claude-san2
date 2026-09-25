'use strict';
// ---------------------------------------------------------------------------
// Fully synthesized audio: sound effects, ambience and adaptive music.
// No audio files are needed; everything is generated with WebAudio.
// ---------------------------------------------------------------------------
const Sfx = {
  ctx: null, master: null, sfxBus: null, musicBus: null, ambBus: null,
  noiseBuf: null, vol: { master: 0.8, sfx: 0.9, music: 0.55 },
  unlocked: false, ambNodes: [], sirenNode: null,

  unlock() {
    if (this.unlocked) { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      const c = this.ctx;
      this.master = c.createGain(); this.master.gain.value = this.vol.master; this.master.connect(c.destination);
      const comp = c.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4;
      comp.connect(this.master);
      this.sfxBus = c.createGain(); this.sfxBus.gain.value = this.vol.sfx; this.sfxBus.connect(comp);
      this.musicBus = c.createGain(); this.musicBus.gain.value = this.vol.music; this.musicBus.connect(comp);
      this.ambBus = c.createGain(); this.ambBus.gain.value = 0.5; this.ambBus.connect(comp);
      // shared noise buffer
      const len = c.sampleRate * 2;
      this.noiseBuf = c.createBuffer(1, len, c.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      // simple reverb (feedback delay)
      this.verb = c.createDelay(); this.verb.delayTime.value = 0.23;
      const fb = c.createGain(); fb.gain.value = 0.32;
      const vf = c.createBiquadFilter(); vf.type = 'lowpass'; vf.frequency.value = 2200;
      this.verb.connect(vf); vf.connect(fb); fb.connect(this.verb);
      const vout = c.createGain(); vout.gain.value = 0.35; vf.connect(vout); vout.connect(comp);
      this.unlocked = true;
      Music.onUnlock();
    } catch (e) { this.ctx = null; }
  },
  setVolumes(v) {
    Object.assign(this.vol, v);
    if (!this.ctx) return;
    this.master.gain.value = this.vol.master;
    this.sfxBus.gain.value = this.vol.sfx;
    this.musicBus.gain.value = this.vol.music;
  },
  t() { return this.ctx ? this.ctx.currentTime : 0; },

  // --- primitives -------------------------------------------------------
  tone(freq, dur, { type = 'sine', vol = 0.3, attack = 0.005, bus = null, when = 0, slide = 0, verb = false, detune = 0 } = {}) {
    if (!this.ctx) return;
    const c = this.ctx, t0 = c.currentTime + when;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t0); o.detune.value = detune;
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq * slide), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(bus || this.sfxBus);
    if (verb) g.connect(this.verb);
    o.start(t0); o.stop(t0 + dur + 0.05);
  },
  noise(dur, { vol = 0.3, freq = 1200, q = 1, type = 'bandpass', when = 0, bus = null, attack = 0.002, slide = 0 } = {}) {
    if (!this.ctx) return;
    const c = this.ctx, t0 = c.currentTime + when;
    const s = c.createBufferSource(); s.buffer = this.noiseBuf;
    s.playbackRate.value = 0.8 + Math.random() * 0.4;
    const f = c.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(freq, t0); f.Q.value = q;
    if (slide) f.frequency.exponentialRampToValueAtTime(Math.max(40, freq * slide), t0 + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(f); f.connect(g); g.connect(bus || this.sfxBus);
    s.start(t0, Math.random()); s.stop(t0 + dur + 0.05);
  },

  // --- named effects ----------------------------------------------------
  play(name, vol = 1) {
    if (!this.ctx) return;
    const v = vol;
    switch (name) {
      case 'step': this.noise(0.06, { vol: 0.05 * v, freq: 600 + Math.random() * 300, q: 1.5 }); break;
      case 'stepWood': this.noise(0.09, { vol: 0.09 * v, freq: 350, q: 2 }); this.tone(140 + Math.random() * 40, 0.15, { type: 'triangle', vol: 0.05 * v, slide: 0.7 }); break;
      case 'stepGravel': this.noise(0.1, { vol: 0.1 * v, freq: 2500, q: 0.6 }); break;
      case 'stepWater': this.noise(0.18, { vol: 0.12 * v, freq: 900, q: 0.8, slide: 0.5 }); break;
      case 'stepSnow': this.noise(0.12, { vol: 0.06 * v, freq: 1800, q: 0.4, type: 'highpass' }); break;
      case 'land': this.noise(0.12, { vol: 0.15 * v, freq: 300, q: 1 }); break;
      case 'jump': this.noise(0.05, { vol: 0.04 * v, freq: 900 }); break;
      case 'crouch': this.noise(0.08, { vol: 0.04 * v, freq: 500, q: 0.5 }); break;
      case 'stone': this.tone(900, 0.06, { type: 'square', vol: 0.06 * v }); this.noise(0.08, { vol: 0.1 * v, freq: 3000, when: 0.02 }); break;
      case 'throw': this.noise(0.15, { vol: 0.05 * v, freq: 1500, slide: 0.4 }); break;
      case 'firecracker':
        for (let i = 0; i < 14; i++) this.noise(0.05, { vol: 0.25 * v, freq: 1500 + Math.random() * 2000, when: i * 0.09 + Math.random() * 0.05 });
        break;
      case 'gun':
        this.noise(0.35, { vol: 0.7 * v, freq: 900, q: 0.5, slide: 0.2, type: 'lowpass' });
        this.tone(90, 0.25, { type: 'square', vol: 0.3 * v, slide: 0.3 });
        this.noise(0.9, { vol: 0.08 * v, freq: 500, when: 0.1, type: 'lowpass' });
        break;
      case 'click': this.tone(1400, 0.03, { type: 'square', vol: 0.05 * v }); break;
      case 'stab': this.noise(0.12, { vol: 0.2 * v, freq: 700, q: 3, slide: 0.3 }); this.tone(200, 0.2, { type: 'sawtooth', vol: 0.06 * v, slide: 0.5 }); break;
      case 'choke': this.noise(0.8, { vol: 0.08 * v, freq: 400, q: 2, slide: 0.6 }); break;
      case 'thud': this.tone(70, 0.3, { type: 'sine', vol: 0.3 * v, slide: 0.5 }); this.noise(0.15, { vol: 0.1 * v, freq: 200 }); break;
      case 'door': this.tone(220, 0.3, { type: 'sawtooth', vol: 0.03 * v, slide: 1.4 }); this.noise(0.2, { vol: 0.05 * v, freq: 400 }); break;
      case 'locked': this.tone(160, 0.08, { type: 'square', vol: 0.06 * v }); this.tone(130, 0.1, { type: 'square', vol: 0.06 * v, when: 0.09 }); break;
      case 'unlock': this.tone(600, 0.05, { type: 'square', vol: 0.05 * v }); this.tone(900, 0.08, { type: 'square', vol: 0.05 * v, when: 0.06 }); break;
      case 'pickup': [784, 988, 1175].forEach((f, i) => this.tone(f, 0.25, { type: 'triangle', vol: 0.09 * v, when: i * 0.06, verb: true })); break;
      case 'doc': this.noise(0.25, { vol: 0.08 * v, freq: 4000, q: 0.5 }); break;
      case 'photo': [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.6, { type: 'sine', vol: 0.08 * v, when: i * 0.1, verb: true })); break;
      case 'hide': this.noise(0.25, { vol: 0.06 * v, freq: 600, q: 0.7 }); break;
      case 'suspicious': this.tone(520, 0.12, { type: 'triangle', vol: 0.08 * v }); this.tone(620, 0.16, { type: 'triangle', vol: 0.07 * v, when: 0.1 }); break;
      case 'alert':
        this.tone(880, 0.12, { type: 'square', vol: 0.12 * v });
        this.tone(1320, 0.3, { type: 'square', vol: 0.1 * v, when: 0.1 });
        this.noise(0.4, { vol: 0.1 * v, freq: 3000, q: 4, when: 0.05 });
        break;
      case 'bell':
        for (let i = 0; i < 3; i++) {
          this.tone(1250, 0.7, { type: 'triangle', vol: 0.12 * v, when: i * 0.22, verb: true });
          this.tone(1873, 0.5, { type: 'sine', vol: 0.06 * v, when: i * 0.22 });
        }
        break;
      case 'heartbeat': this.tone(55, 0.14, { type: 'sine', vol: 0.3 * v }); this.tone(50, 0.16, { type: 'sine', vol: 0.22 * v, when: 0.18 }); break;
      case 'death':
        this.tone(220, 1.5, { type: 'sawtooth', vol: 0.08 * v, slide: 0.4 });
        this.tone(110, 2.0, { type: 'sine', vol: 0.2 * v, slide: 0.5 });
        break;
      case 'checkpoint': [659, 880].forEach((f, i) => this.tone(f, 0.5, { type: 'sine', vol: 0.08 * v, when: i * 0.12, verb: true })); break;
      case 'blip': this.tone(300 + Math.random() * 60, 0.03, { type: 'square', vol: 0.018 * v }); break;
      case 'choice': this.tone(660, 0.08, { type: 'triangle', vol: 0.08 * v }); break;
      case 'select': this.tone(880, 0.1, { type: 'triangle', vol: 0.1 * v }); this.tone(1320, 0.12, { type: 'triangle', vol: 0.06 * v, when: 0.05 }); break;
      case 'fuse': this.noise(0.4, { vol: 0.15 * v, freq: 5000, q: 1 }); this.tone(60, 0.5, { type: 'sawtooth', vol: 0.06 * v, slide: 0.5 }); break;
      case 'explosion':
        this.noise(1.8, { vol: 0.9 * v, freq: 400, type: 'lowpass', slide: 0.1 });
        this.tone(50, 1.2, { type: 'sine', vol: 0.5 * v, slide: 0.4 });
        break;
      case 'bomb_far': this.noise(2.5, { vol: 0.35 * v, freq: 180, type: 'lowpass', attack: 0.05 }); this.tone(40, 2, { vol: 0.25 * v, slide: 0.6 }); break;
      case 'plane': this.tone(90, 3, { type: 'sawtooth', vol: 0.05 * v, attack: 1, slide: 0.85 }); this.tone(93, 3, { type: 'sawtooth', vol: 0.05 * v, attack: 1, slide: 0.85 }); break;
      case 'bark': this.noise(0.12, { vol: 0.3 * v, freq: 700, q: 2, slide: 0.6 }); this.tone(300, 0.1, { type: 'sawtooth', vol: 0.1 * v, slide: 0.6 }); break;
      case 'scream': this.tone(900, 0.8, { type: 'sawtooth', vol: 0.05 * v, slide: 0.7 }); this.noise(0.6, { vol: 0.05 * v, freq: 1500, q: 3 }); break;
      case 'shout': this.noise(0.3, { vol: 0.12 * v, freq: 500, q: 3, slide: 1.3 }); this.tone(180, 0.3, { type: 'sawtooth', vol: 0.06 * v, slide: 1.2 }); break;
      case 'train': this.noise(0.3, { vol: 0.07 * v, freq: 250, q: 2 }); this.noise(0.2, { vol: 0.05 * v, freq: 250, q: 2, when: 0.18 }); break;
      case 'whistle': this.tone(740, 1.2, { type: 'sine', vol: 0.15 * v, attack: 0.05 }); this.tone(622, 1.2, { type: 'sine', vol: 0.12 * v, attack: 0.05 }); break;
      case 'qte': this.tone(1000, 0.05, { type: 'square', vol: 0.06 * v }); break;
      case 'splash': this.noise(0.6, { vol: 0.3 * v, freq: 700, slide: 0.3, type: 'lowpass' }); break;
      case 'typewriter': this.noise(0.03, { vol: 0.08 * v, freq: 3500, q: 2 }); break;
      case 'match': this.noise(0.3, { vol: 0.1 * v, freq: 3000, slide: 0.4 }); break;
      case 'lightning': this.noise(2.5, { vol: 0.5 * v, freq: 200, type: 'lowpass', attack: 0.02 }); break;
      default: break;
    }
  },

  // --- sustained sounds --------------------------------------------------
  siren(on) {
    if (!this.ctx) return;
    if (on && !this.sirenNode) {
      const c = this.ctx;
      const o = c.createOscillator(); o.type = 'sawtooth';
      const lfo = c.createOscillator(); lfo.frequency.value = 0.25;
      const lg = c.createGain(); lg.gain.value = 180;
      lfo.connect(lg); lg.connect(o.frequency); o.frequency.value = 520;
      const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1400;
      const g = c.createGain(); g.gain.value = 0.0001; g.gain.exponentialRampToValueAtTime(0.06, c.currentTime + 0.6);
      o.connect(f); f.connect(g); g.connect(this.sfxBus);
      o.start(); lfo.start();
      this.sirenNode = { o, lfo, g };
    } else if (!on && this.sirenNode) {
      const n = this.sirenNode; this.sirenNode = null;
      n.g.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.5);
      setTimeout(() => { try { n.o.stop(); n.lfo.stop(); } catch (e) { /* stopped */ } }, 700);
    }
  },
  ambience(kind) {
    if (!this.ctx) { this.pendingAmb = kind; return; }
    for (const n of this.ambNodes) { try { n.g.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 1); const s = n.s; setTimeout(() => { try { s.stop(); } catch (e) { /* */ } }, 1200); } catch (e) { /* */ } }
    this.ambNodes = [];
    if (!kind || kind === 'none') return;
    const c = this.ctx;
    const mk = (freq, type, vol, q = 0.7) => {
      const s = c.createBufferSource(); s.buffer = this.noiseBuf; s.loop = true;
      const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
      const g = c.createGain(); g.gain.value = 0.0001; g.gain.exponentialRampToValueAtTime(vol, c.currentTime + 2);
      s.connect(f); f.connect(g); g.connect(this.ambBus); s.start();
      this.ambNodes.push({ s, g });
    };
    if (kind === 'rain') { mk(2500, 'highpass', 0.08); mk(800, 'bandpass', 0.05); }
    else if (kind === 'wind') { mk(400, 'bandpass', 0.07, 0.4); mk(150, 'lowpass', 0.05); }
    else if (kind === 'train') { mk(120, 'lowpass', 0.25); mk(900, 'bandpass', 0.03); }
    else if (kind === 'city') { mk(300, 'lowpass', 0.05); }
    else if (kind === 'fire') { mk(600, 'bandpass', 0.06, 0.3); mk(90, 'lowpass', 0.1); }
    else if (kind === 'river') { mk(500, 'lowpass', 0.09); mk(1500, 'bandpass', 0.02); }
    else if (kind === 'indoor') { mk(180, 'lowpass', 0.03); }
  },
};

// ---------------------------------------------------------------------------
// Music: a lookahead step sequencer playing procedurally composed pieces in
// Chinese pentatonic modes (gong/shang/jue/zhi/yu) plus a Shanghai jazz mode.
// ---------------------------------------------------------------------------
const Music = {
  mood: null, nextNoteTime: 0, step: 0, timer: null, pieces: {}, intensity: 0, targetMood: null,
  // pentatonic note sets (semitones from root)
  scales: {
    gong: [0, 2, 4, 7, 9], yu: [0, 3, 5, 7, 10], shang: [0, 2, 5, 7, 10], jue: [0, 3, 5, 8, 10], zhi: [0, 2, 5, 7, 9],
  },
  mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); },
  compose(seed, scale, root, len, density) {
    const r = U.srand(seed); const sc = this.scales[scale];
    const notes = [];
    let deg = 5;
    for (let i = 0; i < len; i++) {
      if (r() < density) {
        deg += Math.floor(r() * 5) - 2;
        deg = U.clamp(deg, 0, 11);
        const oct = Math.floor(deg / 5), d = deg % 5;
        notes.push(root + oct * 12 + sc[d]);
      } else notes.push(null);
    }
    // cadence on root
    notes[len - 2] = root + 12; notes[len - 1] = null;
    return notes;
  },
  onUnlock() { if (this.targetMood) { const m = this.targetMood; this.mood = null; this.play(m); } if (Sfx.pendingAmb) { Sfx.ambience(Sfx.pendingAmb); Sfx.pendingAmb = null; } },
  play(mood) {
    this.targetMood = mood;
    if (!Sfx.ctx || this.mood === mood) return;
    this.mood = mood;
    this.step = 0;
    this.nextNoteTime = Sfx.t() + 0.1;
    if (!this.timer) this.timer = setInterval(() => this.tick(), 50);
    const P = {
      title: { bpm: 64, scale: 'yu', root: 57, seed: 7, len: 32, dens: 0.55, inst: 'erhu', drone: true, pluck: true },
      calm: { bpm: 84, scale: 'gong', root: 62, seed: 11, len: 32, dens: 0.6, inst: 'pluck', drone: true },
      sad: { bpm: 58, scale: 'yu', root: 57, seed: 23, len: 32, dens: 0.45, inst: 'erhu', drone: true },
      tense: { bpm: 72, scale: 'jue', root: 50, seed: 31, len: 16, dens: 0.3, inst: 'pluck', pulse: true },
      stealth: { bpm: 76, scale: 'yu', root: 52, seed: 41, len: 32, dens: 0.28, inst: 'pluck', pulse: true, drone: true },
      alert: { bpm: 138, scale: 'jue', root: 50, seed: 53, len: 16, dens: 0.8, inst: 'pluck', drums: true, pulse: true },
      jazz: { bpm: 118, scale: 'gong', root: 60, seed: 61, len: 32, dens: 0.55, inst: 'piano', jazz: true },
      heroic: { bpm: 96, scale: 'zhi', root: 55, seed: 71, len: 32, dens: 0.65, inst: 'erhu', drums: true, drone: true },
      memory: { bpm: 60, scale: 'gong', root: 64, seed: 83, len: 32, dens: 0.5, inst: 'music_box' },
      yanan: { bpm: 90, scale: 'zhi', root: 60, seed: 97, len: 32, dens: 0.6, inst: 'suona', drone: true },
      ending: { bpm: 62, scale: 'gong', root: 60, seed: 101, len: 32, dens: 0.5, inst: 'erhu', drone: true, pluck: true },
      silence: { bpm: 60, silent: true },
    };
    const p = P[mood] || P.calm;
    if (!p.silent && !p.notes) p.notes = this.compose(p.seed, p.scale, p.root, p.len, p.dens);
    this.piece = p;
  },
  stop() { this.play('silence'); },
  tick() {
    if (!Sfx.ctx || !this.piece || this.piece.silent) return;
    const p = this.piece;
    const spb = 60 / p.bpm / 2; // eighth notes
    while (this.nextNoteTime < Sfx.t() + 0.15) {
      this.playStep(p, this.step, this.nextNoteTime - Sfx.t(), spb);
      this.step++;
      this.nextNoteTime += spb * (p.jazz && this.step % 2 === 1 ? 1.3 : p.jazz ? 0.7 : 1);
    }
  },
  playStep(p, s, when, spb) {
    const bus = Sfx.musicBus;
    const i = s % p.len;
    const n = p.notes[i];
    const f = n !== null ? this.mtof(n) : 0;
    if (n !== null) {
      switch (p.inst) {
        case 'pluck': // guzheng-ish
          Sfx.tone(f, 1.2, { type: 'triangle', vol: 0.12, bus, when, verb: true });
          Sfx.tone(f * 2, 0.4, { type: 'sine', vol: 0.04, bus, when });
          break;
        case 'erhu':
          this.erhu(f, spb * 2.2, when);
          break;
        case 'piano':
          Sfx.tone(f, 0.9, { type: 'triangle', vol: 0.1, bus, when, verb: true });
          Sfx.tone(f * 1.5, 0.5, { type: 'sine', vol: 0.03, bus, when });
          break;
        case 'music_box':
          Sfx.tone(f * 2, 1.4, { type: 'sine', vol: 0.09, bus, when, verb: true });
          Sfx.tone(f * 4, 0.5, { type: 'sine', vol: 0.02, bus, when });
          break;
        case 'suona':
          Sfx.tone(f, spb * 1.6, { type: 'square', vol: 0.035, bus, when, attack: 0.03 });
          Sfx.tone(f * 1.003, spb * 1.6, { type: 'sawtooth', vol: 0.03, bus, when, attack: 0.03 });
          break;
        default: break;
      }
    }
    if (p.pluck && s % 4 === 0) {
      const bn = p.notes[(i + 8) % p.len] || p.root + 12;
      Sfx.tone(this.mtof(bn - 12), 1.5, { type: 'triangle', vol: 0.06, bus, when, verb: true });
    }
    if (p.drone && s % 16 === 0) {
      Sfx.tone(this.mtof(p.root - 12), spb * 16, { type: 'sine', vol: 0.07, bus, when, attack: 1.2 });
      Sfx.tone(this.mtof(p.root - 5), spb * 16, { type: 'sine', vol: 0.03, bus, when, attack: 1.5 });
    }
    if (p.pulse && s % 2 === 0) {
      Sfx.tone(this.mtof(p.root - 12), 0.25, { type: 'sine', vol: s % 8 === 0 ? 0.16 : 0.08, bus, when });
    }
    if (p.drums) {
      if (s % 4 === 0) { Sfx.tone(70, 0.3, { type: 'sine', vol: 0.3, bus, when, slide: 0.5 }); }
      if (s % 4 === 2) Sfx.noise(0.08, { vol: 0.08, freq: 3000, bus, when });
      if (s % 8 === 7) Sfx.noise(0.2, { vol: 0.06, freq: 5000, q: 0.5, bus, when }); // cymbal
    }
    if (p.jazz) {
      // walking bass + brushed snare + chords
      const bass = [0, 4, 7, 9, 12, 9, 7, 4][s % 8] + p.root - 24 + (Math.floor(s / 16) % 2 ? 5 : 0);
      Sfx.tone(this.mtof(bass), spb * 0.9, { type: 'sine', vol: 0.16, bus, when });
      if (s % 2 === 1) Sfx.noise(0.12, { vol: 0.04, freq: 6000, q: 0.3, bus, when });
      if (s % 8 === 0) {
        const r = p.root + (Math.floor(s / 16) % 2 ? 5 : 0);
        [0, 4, 7, 11].forEach((d) => Sfx.tone(this.mtof(r + d), 1.2, { type: 'triangle', vol: 0.035, bus, when, verb: true }));
      }
    }
  },
  erhu(f, dur, when) {
    const c = Sfx.ctx; const t0 = c.currentTime + Math.max(0, when);
    const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f;
    const vib = c.createOscillator(); vib.frequency.value = 5.5;
    const vg = c.createGain(); vg.gain.value = f * 0.012;
    vib.connect(vg); vg.connect(o.frequency);
    const fl = c.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = f * 3.5; fl.Q.value = 2;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.07, t0 + 0.12);
    g.gain.setValueAtTime(0.06, t0 + dur * 0.7);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(fl); fl.connect(g); g.connect(Sfx.musicBus); g.connect(Sfx.verb);
    o.start(t0); vib.start(t0); o.stop(t0 + dur + 0.1); vib.stop(t0 + dur + 0.1);
  },
};
