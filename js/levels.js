'use strict';
// ---------------------------------------------------------------------------
// Level definitions. Maps are built with a tiny builder so geometry stays
// exact; entities with custom settings are placed with obj().
// Coordinates: x = column, y = the tile row an object/actor stands in
// (its feet are at the bottom of that tile).
// ---------------------------------------------------------------------------
class MB {
  constructor(w, h) { this.w = w; this.h = h; this.g = Array.from({ length: h }, () => Array(w).fill(' ')); this.ents = []; }
  set(x, y, ch) { if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.g[y][x] = ch; return this; }
  get(x, y) { return (x >= 0 && y >= 0 && x < this.w && y < this.h) ? this.g[y][x] : '#'; }
  fill(x, y, w, h, ch) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) this.set(i, j, ch); return this; }
  hline(x, y, w, ch) { return this.fill(x, y, w, 1, ch); }
  vline(x, y, h, ch) { return this.fill(x, y, 1, h, ch); }
  put(x, y, ch) { return this.set(x, y, ch); }
  obj(x, y, spec) { this.ents.push({ c: x, r: y, spec }); return this; }
  // interior x..x+w-1, rows y..y+h-1; walls/ceiling/floor around it
  room(x, y, w, h, o = {}) {
    const wall = o.wall || 'B', bg = o.bg || ',';
    this.fill(x - 1, y - 1, w + 2, 1, o.ceil || wall);
    this.fill(x - 1, y + h, w + 2, 1, o.floor || '#');
    this.fill(x, y, w, h, bg);
    if (!o.noL) this.vline(x - 1, y, h, wall);
    if (!o.noR) this.vline(x + w, y, h, wall);
    if (o.doorL) this.door(x - 1, y + h - 1, bg);
    if (o.doorR) this.door(x + w, y + h - 1, bg);
    if (o.openL) for (let j = 0; j < Math.min(h, o.openL); j++) this.set(x - 1, y + h - 1 - j, bg);
    if (o.openR) for (let j = 0; j < Math.min(h, o.openR); j++) this.set(x + w, y + h - 1 - j, bg);
    return this;
  }
  // wall with a door at (x, y = feet row); spec = optional door settings
  door(x, y, bg = ',', spec) {
    this.set(x, y - 1, bg);
    if (spec) { this.set(x, y, bg); this.obj(x, y, Object.assign({ type: 'door' }, spec)); } else this.set(x, y, 'D');
    return this;
  }
  wall(x, y1, y2, ch = 'B') { return this.vline(x, y1, y2 - y1 + 1, ch); }
  ladder(x, top, bottom) { return this.vline(x, top, bottom - top + 1, 'H'); }
  hint(x, y, text, tw = 3, th = 3) { return this.obj(x, y, { type: 'hint', text, tw, th }); }
  trig(x, y, scene, tw = 2, th = 3, extra) { return this.obj(x, y, Object.assign({ type: 'trigger', scene, tw, th }, extra || {})); }
  enemy(x, y, o = {}) { return this.obj(x, y, Object.assign({ type: 'enemy' }, o)); }
  npc(x, y, o) { return this.obj(x, y, Object.assign({ type: 'npc' }, o)); }
  item(x, y, id, o = {}) { return this.obj(x, y, Object.assign({ type: 'pickup', kind: o.kind || 'item', id }, o)); }
  doc(x, y, id, o = {}) { return this.obj(x, y, Object.assign({ type: 'pickup', kind: 'doc', id }, o)); }
  photo(x, y, id) { return this.obj(x, y, { type: 'pickup', kind: 'photo', id }); }
  deco(x, y, kind, o = {}) { return this.obj(x, y, Object.assign({ type: 'deco', kind }, o)); }
  rows() { return this.g.map((r) => r.join('')); }
  build(def) { def.map = this.rows(); def.entities = this.ents; return def; }
}

const Levels = {};

// Common barks
const JP_LINES = {
  alert: ['Dare da?! Who goes there?!', 'Tomare! Halt!', 'Shinnyūsha! Intruder!', 'There! Stop her!'],
  hear: ['Nan da? What was that?', '...Neko ka? A cat?', 'Who\'s there?', 'Something moved...'],
  giveup: ['Ki no sei ka. Just nerves.', 'Nothing. Back to post.', 'Rats. Only rats.', 'Keep your eyes open.'],
};
const JP_TALK = ['This cold eats into the bones...', 'Three years in China. My mother thinks I\'ll be home by New Year.', 'The Kempeitai are in a foul mood tonight.', 'Did you hear? Konoe is Prime Minister again.', 'Tojo at the War Ministry... more divisions for China, they say.', 'I miss rice from home.', 'Stay awake. Major Kageyama shoots sleepers.'];
const KMT_LINES = {
  alert: ['Halt! Hands where I can see them!', 'Stop! Identify yourself!', 'Intruder! Seize her!', 'Don\'t move!'],
  hear: ['Who\'s there?', 'Hm? Did something fall?', 'Show yourself!'],
  giveup: ['Nothing. Just the bombing rattling things.', 'Rats in the files again.', 'Back to post.'],
};
const KMT_TALK = ['Third raid this week. They say the Generalissimo will never surrender.', 'My family is in Hubei. No letters since spring.', 'Dai Li wants every file sealed before the next raid.', 'Ration rice is half sand again.', 'Another siren... another night in the tunnels.'];
const PUPPET_LINES = {
  alert: ['Stop right there!', 'Grab her!', 'Intruder in the building!', 'Hands up!'],
  hear: ['Who\'s creeping around?', 'Hm? Hello?', 'Somebody there?'],
  giveup: ['Nerves. This place gets to you.', 'Nothing. Director Li will never know.', 'Back to it.'],
};
const PUPPET_TALK = ['Pay\'s good. Better than starving.', 'Don\'t look at me like that — everyone has to eat.', 'Chongqing\'s assassins got another one of ours last week.', 'They say Chairman Wang barely sleeps.', 'Don\'t go down to the cells after dark.'];
const CCP_LINES = {
  alert: ['Halt! Who goes there?', 'Stop! Spy!', 'There — seize her!'],
  hear: ['Comrade? Is someone there?', 'Hm?', 'Who\'s moving about?'],
  giveup: ['Nothing. Keep watch.', 'The wind in the gullies...', 'Back to post.'],
};
const CCP_TALK = ['Chairman Mao was writing all night again.', 'The Security Department says there are spies everywhere.', 'Millet again. Always millet.', 'When the war ends I\'ll teach my village to read.'];

// ===========================================================================
// PROLOGUE — Nanjing, December 1939
// ===========================================================================
Levels.prologue = (() => {
  const m = new MB(152, 17);
  m.fill(0, 15, 152, 2, '#');
  // --- the Su family home
  m.room(1, 11, 20, 4, { doorR: true });
  m.wall(10, 11, 12); m.door(10, 14);
  m.put(3, 12, 'o'); m.put(14, 12, 'o');
  m.put(6, 11, 'l'); m.put(17, 11, 'l');
  m.put(3, 14, 'e'); m.put(5, 14, 'P'); m.put(7, 14, 't'); m.put(13, 14, 'b'); m.put(16, 14, 'f'); m.put(18, 14, 'C');
  m.doc(8, 14, 'ming_notebook');
  m.hint(4, 14, 'Move with [A]/[D]. Press [E] to pick up Ming\'s notebook from the table. [Tab] opens your journal. [F1] shows all controls.', 7);
  // --- the lane (gravel)
  m.hline(22, 15, 32, 'g');
  m.hint(24, 14, 'Kempeitai patrol the lane. Gravel crunches when you walk — press [C] to crouch and move silently. Stay out of the lamplight.', 4);
  m.put(28, 14, 'c'); m.put(33, 14, 'L');
  m.hint(29, 14, 'Crouch behind crates to break line of sight. The pale cone shows where a soldier is looking.', 2);
  m.enemy(40, 14, { role: 'S', patrolTiles: 6 });
  m.put(46, 14, 'Y');
  m.hint(46, 14, 'Stand at the haystack and press [E] to hide inside. Wait for the patrol to pass, then [E] again to climb out.', 2);
  m.put(51, 14, 'c');
  m.put(53, 14, 'X');
  // --- the tall house: climb over it
  m.fill(57, 9, 17, 6, 'B');
  m.ladder(56, 9, 14);
  m.hint(55, 14, 'Hold [W] at a ladder to climb.', 2);
  m.hint(65, 8, 'Crouch [C] before you step off an edge — a soft landing makes less noise.', 5);
  m.fill(74, 13, 1, 2, 'c');
  m.enemy(78, 14, { role: 'V', facing: 1, turns: false, name: 'sentry1' });
  m.hint(76, 14, 'He hasn\'t seen you. Creep up behind him: [F] silent kill or [V] knock out. Then press [E] on the body to drag it into the haystack — bodies left in the open will be found.', 3);
  m.put(81, 14, 'Y');
  m.put(83, 14, 'X');
  // --- barbed wire & tall grass
  m.fill(86, 11, 4, 3, 'B'); m.fill(86, 14, 4, 1, '^');
  m.hint(84, 14, 'Barbed wire blocks the way. Press [Z] to go prone and crawl underneath.', 2);
  m.fill(92, 14, 12, 1, '"');
  m.hint(92, 14, 'Tall grass hides you completely while you are prone or crouched in it.', 2);
  m.enemy(107, 14, { role: 'S', patrolTiles: 4 });
  m.put(110, 14, 'L');
  m.hint(102, 14, 'A sentry guards the path ahead. Throw a stone [Q] — soldiers go to investigate noises, leaving their posts.', 2);
  m.enemy(116, 14, { role: 'V', facing: -1, turns: true, turnEvery: 5 });
  m.put(118, 14, 'X');
  m.trig(118, 14, 'pro_studio', 2);
  // --- Ming's photo studio (two floors)
  m.room(120, 8, 24, 7, { doorL: true, doorR: true });
  m.hline(120, 12, 24, 'm');
  m.ladder(138, 12, 14);
  m.put(123, 8, 'l'); m.put(135, 8, 'l'); m.put(129, 13, 'l');
  m.put(122, 10, 'o'); m.put(141, 10, 'o');
  m.item(122, 11, 'ming_film', { scene: 'pro_film' });
  m.put(126, 11, 'C'); m.put(133, 11, 't'); m.obj(141, 11, { type: 'radio' });
  m.enemy(130, 11, { role: 'S', patrolTiles: 5 });
  m.put(123, 14, 'b'); m.put(142, 14, 'C');
  m.enemy(131, 14, { role: 'K', patrolTiles: 6 });
  m.hint(121, 14, 'Ming\'s darkroom is upstairs. His film may still be there — optional, but it could matter later. Old floorboards creak: crouch.', 3);
  m.photo(140, 11, 'p0');
  // --- the water gate
  m.fill(146, 8, 6, 3, 'B');
  m.obj(149, 14, { type: 'exit', tw: 3 });
  return m.build({
    id: 'prologue', theme: 'snow', backdrop: 'nanjing', sepia: true, weather: 'snow', amb: 0.3, faction: 'jp', guns: false,
    music: 'stealth', sound: 'wind', lines: JP_LINES, talk: JP_TALK, seed: 11, introScene: 'pro_start',
    objective: 'Reach the Tongji water gate where Ming is waiting.',
  });
})();

// ===========================================================================
// CHAPTER 1 — Chongqing: the Juntong archive during an air raid
// ===========================================================================
Levels.ch1 = (() => {
  const m = new MB(152, 17);
  m.fill(0, 15, 152, 2, '#');
  // bombed street
  m.put(2, 14, 'P');
  m.npc(8, 14, { id: 'courier', name: 'Wounded Courier', pal: 'civ_m1', pose: 'bound', scene: 'ch1_courier', once: true, portrait: 'civ', witness: false });
  m.put(13, 14, '*'); m.hline(17, 14, 1, 'x');
  m.hint(15, 14, 'The street is burning. Jump [Space] over the flames.', 2);
  m.fill(24, 13, 3, 2, '#'); m.put(29, 14, '*');
  m.hint(31, 14, 'Juntong guards are your own countrymen: you cannot kill them. Knock them out [V] or slip past. If they catch you, you will be arrested.', 4);
  m.put(35, 14, 'X');
  // Juntong compound, Luojiawan
  m.room(40, 4, 100, 11, {});
  m.fill(40, 4, 56, 3, 'B');
  m.hline(40, 7, 100, '#');
  m.hline(40, 11, 100, 'm');
  m.door(39, 14);
  // outside ladder to the 2nd-floor window
  m.ladder(38, 11, 14); m.set(39, 9, ','); m.set(39, 10, ',');
  m.hint(37, 14, 'The front door is guarded. An open window on the second floor... or cut the power somewhere inside.', 2);
  // F1 lobby
  m.enemy(45, 14, { role: 'V', facing: -1, turns: false });
  m.put(45, 12, 'l'); m.put(49, 14, 'k'); m.put(58, 14, 'A');
  m.wall(63, 12, 12); m.door(63, 14);
  // F1 records hall
  m.enemy(78, 14, { role: 'S', patrolTiles: 6 });
  m.put(67, 14, 'b'); m.put(71, 14, 'b'); m.put(70, 12, 'l'); m.put(86, 12, 'l'); m.put(84, 14, 'C');
  m.ladder(90, 11, 14);
  m.wall(93, 12, 12); m.door(93, 14);
  // F1 radio room
  m.enemy(112, 14, { role: 'S', patrolTiles: 7 });
  m.obj(98, 14, { type: 'radio' }); m.put(120, 14, 'C'); m.put(104, 12, 'l'); m.put(126, 12, 'l');
  m.obj(134, 14, { type: 'fuse', group: 'A' });
  // F2 offices (creaky floor)
  m.put(42, 10, 'X');
  m.enemy(56, 10, { role: 'S', patrolTiles: 5 });
  m.put(46, 10, 'k'); m.put(62, 10, 'k');
  m.obj(50, 8, { type: 'lamp', group: 'B' }); m.obj(65, 8, { type: 'lamp', group: 'B' });
  m.hint(44, 10, 'These old floorboards creak loudly — the guards below will hear you walking. Crouch.', 3);
  m.wall(71, 8, 8); m.door(71, 10);
  m.enemy(84, 10, { role: 'O', patrolTiles: 5 });
  m.put(76, 10, 'C'); m.obj(80, 8, { type: 'lamp', group: 'B' }); m.obj(95, 8, { type: 'lamp', group: 'B' });
  m.obj(98, 10, { type: 'fuse', group: 'B' });
  m.hint(97, 10, 'A fuse box. Cutting the power plunges this floor into darkness — but someone will come to fix it.', 2);
  m.wall(101, 8, 8); m.door(101, 10);
  m.obj(112, 10, { type: 'radio' }); m.put(116, 10, 'k'); m.put(126, 10, 'b');
  m.enemy(122, 10, { role: 'V', facing: -1, turns: true, turnEvery: 4 });
  m.obj(118, 8, { type: 'lamp', group: 'B' }); m.obj(132, 8, { type: 'lamp', group: 'B' });
  m.ladder(106, 7, 10);
  m.doc(128, 10, 'juntong_memo');
  // F3 corridor + archive
  m.put(98, 6, 'X');
  m.enemy(104, 6, { role: 'S', patrolTiles: 3 });
  m.obj(100, 4, { type: 'lamp', group: 'C' });
  m.wall(113, 4, 4);
  m.door(113, 6, ',', { locked: 'code', keypad: true, id: 'archive' });
  m.obj(111, 6, { type: 'keypad', code: '0707', opens: 'archive', label: 'Archive lock (4 digits)', hint: 'The courier whispered a date: "the night the war began".' });
  m.put(117, 6, 'b'); m.put(121, 6, 'b'); m.put(131, 6, 'b'); m.obj(125, 4, { type: 'lamp', group: 'C' });
  m.item(126, 6, 'juntong_file', { scene: 'ch1_file' });
  m.photo(136, 6, 'p1');
  // exit through the archive window, down the drainpipe
  m.set(140, 5, ','); m.set(140, 6, ',');
  m.ladder(141, 7, 14);
  m.obj(147, 14, { type: 'exit', tw: 3, need: 'item:juntong_file', msg: 'You can\'t leave without Ming\'s file.' });
  return m.build({
    id: 'ch1', theme: 'office', backdrop: 'chongqing', faction: 'kmt', nonlethal: true, guns: false, weather: 'embers', amb: 0.42,
    music: 'stealth', sound: 'fire', lines: KMT_LINES, talk: KMT_TALK, seed: 21, alarmFail: true,
    alarmFailText: 'The bell brings every guard in Luojiawan running. You are dragged into a cell and the file is locked away forever.',
    objective: 'Break into the Juntong archive on the top floor and find Ming\'s file.',
    onStart(W) { W.raidT = 4; },
    onUpdate(W, dt) {
      W.raidT -= dt;
      if (W.raidT < 0) {
        W.raidT = 9 + Math.random() * 10;
        Sfx.play('bomb_far'); W.shake = 0.35;
        for (let i = 0; i < 6; i++) W.fx.dust(W.player.x + U.rand(-150, 150), W.player.y - 60 - Math.random() * 40, 2);
        const lit = W.level.lights.filter((l) => l.on);
        lit.forEach((l) => { l.on = false; }); setTimeout(() => lit.forEach((l) => { l.on = true; }), 900);
      }
    },
  });
})();

// ===========================================================================
// CHAPTER 2 — Huangshan: the Generalissimo's reception
// ===========================================================================
Levels.ch2 = (() => {
  const m = new MB(160, 17);
  m.fill(0, 15, 160, 2, '#');
  m.put(2, 14, 'P');
  m.put(6, 14, 'L'); m.put(20, 14, 'L');
  m.enemy(13, 14, { kind: 'kmt_mp', facing: -1, turns: false, stationary: true });
  m.hint(4, 14, 'In a servant\'s uniform you can walk among guests and soldiers — as long as you behave. Crouching, running, or entering the private wing (upstairs, east) draws attention. Military police look closer.', 5);
  m.put(9, 14, 'q'); m.put(23, 14, 'q');
  // villa
  m.room(26, 4, 110, 11, {});
  m.door(25, 14);
  m.hline(26, 8, 110, 'r');
  // ground floor reception hall
  for (const x of [36, 56, 76]) m.obj(x, 9, { type: 'lamp', r: 90, i: 0.9 });
  m.put(30, 14, 'i'); m.put(50, 14, 'i'); m.put(70, 14, 'i'); m.put(90, 14, 'i');
  m.deco(84, 14, 'piano');
  m.put(40, 14, 't'); m.put(62, 14, 't');
  m.npc(34, 14, { pal: 'civ_f2', wander: true, witness: true });
  m.npc(46, 14, { pal: 'civ_m1', wander: true });
  m.npc(52, 14, { pal: 'waiter', wander: true });
  m.npc(66, 14, { pal: 'civ_f1', wander: true });
  m.npc(74, 14, { pal: 'civ_m2', wander: true });
  m.npc(58, 14, { id: 'colhu', name: 'Colonel Hu', pal: 'kmt', pickpocket: 'study_key', facing: 1, wander: false, witness: false, scene: 'ch2_hu', prompt: 'Pickpocket Colonel Hu' });
  m.hint(54, 14, 'Colonel Hu is boasting to the guests. He carries the key to the private wing — approach from behind and press [E] to lift it.', 3);
  m.enemy(44, 14, { kind: 'kmt_mp', facing: 1, turns: true, turnEvery: 6, stationary: true });
  m.enemy(88, 14, { kind: 'kmt', facing: -1, turns: false, stationary: true });
  m.npc(80, 14, { id: 'meiling_aide', name: 'Madame Chiang\'s Aide', pal: 'civ_f2', scene: 'ch2_aide', once: true, portrait: 'civ_f', wander: false });
  m.ladder(31, 8, 14);
  m.ladder(92, 8, 14);
  m.wall(96, 9, 12); m.door(96, 14);
  // servants' kitchen
  m.deco(104, 14, 'stove'); m.put(110, 14, 't'); m.put(118, 14, 'C'); m.put(124, 12, 'o');
  m.npc(112, 14, { pal: 'waiter', wander: true, witness: false, scene: 'ch2_cook', name: 'Old Cook', once: true, portrait: 'civ' });
  m.obj(114, 9, { type: 'lamp' });
  m.enemy(128, 14, { kind: 'kmt', patrolTiles: 5 });
  m.put(133, 14, 'A');
  // upper west gallery (public)
  m.put(36, 7, 'q'); m.put(46, 7, 'f'); m.put(54, 7, 'b'); m.put(40, 5, 'o');
  m.obj(44, 4, { type: 'lamp' });
  m.npc(50, 7, { pal: 'civ_m1', wander: true });
  m.put(58, 7, 'X');
  // private wing (restricted)
  m.wall(62, 4, 6); m.door(62, 7, ',', { locked: 'study_key', id: 'wing', lockMsg: 'Locked. The private wing — Colonel Hu has the key.' });
  m.enemy(76, 7, { kind: 'kmt_mp', patrolTiles: 6 });
  m.put(68, 7, 'U'); m.put(86, 7, 'U'); m.put(72, 5, 'o'); m.put(82, 5, 'o');
  m.obj(74, 4, { type: 'lamp', group: 'W' }); m.obj(90, 4, { type: 'lamp', group: 'W' });
  m.obj(93, 7, { type: 'fuse', group: 'W' });
  m.wall(96, 4, 6); m.door(96, 7);
  m.put(100, 7, 'k'); m.doc(101, 7, 'secretary_note'); m.put(108, 7, 'b'); m.put(112, 7, 'U');
  m.enemy(106, 7, { kind: 'kmt_mp', facing: -1, turns: true, turnEvery: 4.5, stationary: true });
  m.obj(104, 4, { type: 'lamp', group: 'W' });
  m.wall(116, 4, 6); m.door(116, 7);
  // the study
  m.put(119, 7, 'b'); m.put(123, 7, '&'); m.deco(126, 7, 'flag_roc'); m.put(130, 7, 'k');
  m.doc(121, 7, 'sun_testament');
  m.obj(133, 7, { type: 'keypad', safe: true, code: '1911', gives: 'blank_pass', scene: 'ch2_chiang', label: 'Open the safe (4 digits)', hint: 'The secretary\'s note: "the year the Qing fell — he never lets us forget it."' });
  m.photo(127, 7, 'p2');
  m.obj(128, 4, { type: 'lamp', group: 'S' });
  m.put(142, 14, 'L'); m.put(156, 14, 'L');
  return m.build({
    id: 'ch2', theme: 'mansion', backdrop: 'mansion', faction: 'kmt', nonlethal: true, guns: false, amb: 0.35,
    music: 'stealth', sound: 'indoor', lines: KMT_LINES, talk: KMT_TALK, seed: 31, disguise: true, outfit: 'lan_servant', alarmFail: true,
    restricted: [[62, 140]], dropChance: 0,
    alarmFailText: 'The alarm bell rings through Yunxiu Lodge. Military police seal every door. You will not see the Generalissimo — only a cell.',
    objective: 'Get into the private wing and find a travel pass in the Generalissimo\'s study.',
  });
})();

// ===========================================================================
// CHAPTER 3 — The blockade line, Shaanxi
// ===========================================================================
Levels.ch3 = (() => {
  const m = new MB(172, 22);
  m.fill(0, 20, 172, 2, '#');
  // plateau west & east
  m.fill(0, 10, 62, 10, '#'); m.fill(110, 10, 62, 10, '#');
  // road embankment & gully
  m.fill(62, 10, 48, 2, '#');
  m.put(3, 9, 'P');
  m.obj(5, 9, { type: 'follower', id: 'han', pal: 'han', name: 'Han Tie' });
  m.hint(7, 9, 'Han Tie follows your lead: he crouches and crawls when you do. Press [R] to tell him to wait or follow.', 3);
  m.fill(14, 9, 8, 1, '"');
  m.enemy(26, 9, { role: 'S', patrolTiles: 6 });
  m.put(34, 9, 'Y');
  m.fill(40, 9, 3, 1, '^'); m.fill(40, 6, 3, 3, 'B');
  m.hint(38, 9, 'Wire strung across the ruins — crawl under [Z].', 2);
  m.fill(46, 9, 6, 1, '"');
  m.enemy(54, 9, { role: 'V', facing: -1, turns: true, turnEvery: 4 });
  m.put(59, 9, 'X');
  // checkpoint on the road
  m.trig(72, 9, 'ch3_checkpoint', 2);
  m.enemy(82, 9, { role: 'V', facing: -1, turns: false, id: 'gate1', noAlarm: true });
  m.enemy(90, 9, { role: 'V', facing: 1, turns: true, turnEvery: 5, id: 'gate2' });
  m.put(84, 9, 'L');
  m.wall(86, 6, 7); m.door(86, 9, ' ', { gate: true, id: 'gate' });
  m.fill(85, 5, 3, 1, 'B');
  // the gully
  m.ladder(64, 10, 19);
  m.hint(64, 9, 'The road is blocked by a checkpoint. A gully runs beneath it — [S] to climb down the ladder.', 2);
  m.item(66, 19, 'firecracker', { kind: 'firecracker', count: 3 });
  m.hint(67, 19, 'Firecrackers [T] make a racket — soldiers come running, and dogs bolt in terror.', 2);
  m.fill(70, 19, 6, 1, '"');
  m.fill(78, 19, 3, 1, '^'); m.fill(78, 16, 3, 3, '#');
  m.fill(83, 19, 5, 1, '"');
  m.enemy(86, 19, { kind: 'dog', patrolTiles: 5 });
  m.fill(91, 19, 4, 1, '"');
  m.enemy(97, 19, { role: 'S', patrolTiles: 3 });
  m.obj(101, 19, { type: 'searchlight', dir: -1, a1: 0.15, a2: 0.8, speed: 0.3, len: 260 });
  m.hint(71, 19, 'A searchlight sweeps the gully. If the beam touches you, the whole line wakes. Lie prone in the grass while it passes.', 3);
  m.ladder(107, 10, 19);
  m.put(104, 19, 'X');
  // east plateau
  m.put(113, 9, 'X');
  m.enemy(124, 9, { role: 'S', patrolTiles: 6 });
  m.fill(129, 9, 7, 1, '"');
  m.put(139, 9, '*');
  m.enemy(142, 9, { role: 'V', facing: -1, turns: true, turnEvery: 3.5 });
  m.put(147, 9, 'Y');
  m.enemy(155, 9, { role: 'S', patrolTiles: 4 });
  m.put(150, 9, 'A');
  m.photo(116, 9, 'p3');
  m.obj(167, 9, { type: 'exit', tw: 3 });
  return m.build({
    id: 'ch3', theme: 'loess', backdrop: 'loess', faction: 'kmt', nonlethal: true, guns: false, amb: 0.2, music: 'stealth', sound: 'wind',
    lines: KMT_LINES, talk: ['The Reds are just over those hills.', 'Hu Zongnan wants a flea not to cross this line.', 'They say in Yan\'an the officers eat the same millet as the men. Hah.', 'Cold for August.'],
    seed: 41, reinforce: [{ x: 168, y: 9, kind: 'kmt' }, { x: 112, y: 9, kind: 'kmt' }],
    objective: 'Cross the Nationalist blockade into the Border Region with Han Tie.',
  });
})();

// ===========================================================================
// CHAPTER 4 — Yan'an: the spy in the caves
// ===========================================================================
Levels.ch4 = (() => {
  const m = new MB(164, 22);
  m.fill(0, 20, 164, 2, '#');
  m.fill(40, 14, 124, 6, '#');
  m.fill(100, 8, 64, 6, '#');
  m.fill(0, 19, 7, 1, '~');
  m.put(9, 19, 'P');
  m.hint(10, 19, 'The guards think YOU are the spy. They won\'t shoot a guest of the Chairman — but if they catch you, Old Xu escapes. Knock-outs only.', 4);
  m.npc(30, 19, { id: 'xu', name: 'Old Xu', pal: 'xu', wander: false, witness: false });
  m.trig(20, 19, 'ch4_run1', 2);
  m.enemy(24, 19, { role: 'S', patrolTiles: 5 });
  m.put(16, 19, 'L'); m.put(34, 19, 'Y');
  // cave carved under the middle terrace
  m.room(41, 16, 12, 4, { doorL: true, ceil: '#', wall: '#' });
  m.put(44, 19, '%'); m.put(48, 18, 'u'); m.deco(50, 19, 'chair');
  m.npc(46, 19, { id: 'granny', name: 'Granny Liu', pal: 'qin', scene: 'ch4_granny', once: true, portrait: 'qin', wander: false });
  m.photo(51, 19, 'p4');
  m.ladder(39, 14, 19);
  m.put(37, 19, 'X');
  // middle terrace
  m.enemy(60, 13, { role: 'S', patrolTiles: 6 });
  m.put(66, 13, 'L');
  m.enemy(78, 13, { role: 'V', facing: -1, turns: true, turnEvery: 4 });
  m.fill(70, 13, 4, 1, '"');
  m.put(84, 13, 'Y');
  m.trig(62, 13, 'ch4_run2', 2);
  m.put(93, 13, 'X');
  // archive cave in the upper mass
  m.room(101, 10, 12, 4, { doorL: true, ceil: '#', wall: '#' });
  m.put(104, 13, 'b'); m.put(108, 13, 'k'); m.put(106, 11, 'u');
  m.doc(110, 13, 'archive_log');
  m.ladder(99, 8, 13);
  // top terrace
  m.enemy(122, 7, { role: 'S', patrolTiles: 6 });
  m.put(128, 7, 'L');
  m.fill(131, 7, 5, 1, '"');
  m.enemy(140, 7, { role: 'O', patrolTiles: 4 });
  m.trig(117, 7, 'ch4_run3', 2);
  m.put(114, 7, 'X');
  m.deco(158, 7, 'banner', { color: '#b02020' });
  m.trig(152, 7, 'ch4_pagoda', 3);
  return m.build({
    id: 'ch4', theme: 'yanan', backdrop: 'yanan', faction: 'ccp', nonlethal: true, guns: false, amb: 0.24, music: 'tense', sound: 'wind',
    lines: CCP_LINES, talk: CCP_TALK, seed: 51,
    nonlethalMsg: 'These are Eighth Route soldiers, Han\'s comrades. Knock them out [V] — nothing more.',
    objective: 'Chase the real spy, Old Xu, before he escapes Yan\'an.',
  });
})();

// ===========================================================================
// CHAPTER 5 — The Hundred Regiments Offensive: Zhengtai railway
// ===========================================================================
Levels.ch5 = (() => {
  const m = new MB(184, 17);
  m.fill(0, 15, 184, 2, '#');
  m.put(2, 14, 'P');
  m.fill(6, 14, 6, 1, '"');
  m.hint(4, 14, 'Tonight the Eighth Route Army strikes every railway in North China. In the chaos, you can reach the blockhouse where Mori is held. Here, the enemy shoots to kill — and you may kill too. Rifles can be taken, but every gunshot brings the whole garrison.', 5);
  // blockhouse A (two storeys)
  m.room(20, 10, 14, 5, { doorL: true, doorR: true, wall: 'B', ceil: 'B' });
  m.hline(20, 12, 14, '#'); m.ladder(24, 12, 14); m.ladder(31, 9, 11);
  m.set(19, 11, ','); m.set(34, 11, ',');
  m.enemy(28, 14, { role: 'S', patrolTiles: 4 });
  m.enemy(27, 11, { role: 'V', facing: -1, turns: true, turnEvery: 4 });
  m.obj(32, 8, { type: 'searchlight', dir: 1, a1: 0.18, a2: 0.75, speed: 0.28, len: 240 });
  m.obj(22, 13, { type: 'lamp' });
  m.put(17, 14, 'X');
  m.hint(16, 14, 'The blockhouse straddles the line. Slip through its ground floor, or climb the embrasures and cross the roof — the searchlight up there sweeps the tracks ahead.', 3);
  // rail yard
  m.fill(44, 11, 10, 4, 'B'); m.ladder(43, 11, 14);
  m.put(40, 14, 'c'); m.put(58, 14, 'c'); m.put(59, 14, 'c'); m.fill(59, 13, 1, 1, 'c');
  m.enemy(66, 14, { role: 'S', patrolTiles: 6 });
  m.enemy(76, 14, { kind: 'dog', patrolTiles: 6 });
  m.put(63, 14, 'L'); m.put(83, 14, 'L');
  m.obj(71, 14, { type: 'fuse', group: 'street' });
  m.deco(88, 14, 'truck');
  m.put(92, 14, 'Y');
  m.enemy(100, 14, { role: 'S', patrolTiles: 5 });
  m.put(96, 14, 'A');
  m.obj(103, 14, { type: 'pickup', kind: 'rifle', ammo: 5 });
  m.put(106, 14, '*');
  m.put(108, 14, 'X');
  // blockhouse B: Mori's prison
  m.room(112, 6, 30, 9, { doorL: true, doorR: true, wall: 'B', ceil: 'B' });
  m.hline(112, 10, 30, '#');
  m.ladder(116, 10, 14); m.ladder(138, 10, 14);
  m.obj(118, 12, { type: 'lamp' }); m.obj(132, 12, { type: 'lamp' });
  m.enemy(126, 14, { role: 'O', patrolTiles: 7, carry: 'cell_key', name: 'Lieutenant' });
  m.hint(114, 14, 'The lieutenant carries the key to the cells. Kill him and search the body — or pickpocket him [E] from behind.', 3);
  m.put(122, 14, 'k'); m.put(135, 14, 'C');
  m.obj(128, 14, { type: 'radio', lines: ['📻 (Japanese) "...all units: the Chinese are attacking the Zhengtai line at Niangziguan..."', '📻 (Japanese) "...Shijiazhuang command requests reinforcements..."', '📻 (Japanese) "...trains halted between Yangquan and Jingxing..."'] });
  // upper floor: infirmary + cells
  m.wall(124, 6, 7); m.door(124, 9);
  m.item(114, 9, 'medicine');
  m.put(118, 9, 'e'); m.obj(120, 7, { type: 'lamp' });
  m.enemy(130, 9, { role: 'S', patrolTiles: 3 });
  m.wall(134, 6, 7); m.door(134, 9, ',', { locked: 'cell_key', id: 'cell', lockMsg: 'Locked. The lieutenant has the key.' });
  m.deco(136, 9, 'cell');
  m.npc(137, 9, { id: 'mori', name: 'Mori Takeshi', pal: 'mori', pose: 'bound', scene: 'ch5_mori', once: true, portrait: 'mori', wander: false, witness: false });
  m.photo(140, 9, 'p5');
  m.put(144, 14, 'X');
  // escape into the fields
  m.fill(150, 14, 8, 1, '"');
  m.enemy(162, 14, { role: 'S', patrolTiles: 5 });
  m.put(166, 14, 'L');
  m.fill(170, 14, 5, 1, '"');
  m.obj(180, 14, { type: 'exit', tw: 3, need: 'flag:moriFreed', msg: 'You can\'t leave without Mori.' });
  return m.build({
    id: 'ch5', theme: 'railway', backdrop: 'railway', faction: 'jp', amb: 0.16, music: 'stealth', sound: 'wind', weather: 'embers',
    lines: JP_LINES, talk: ['The Reds hit the Niangziguan tunnel!', 'This isn\'t a raid. It\'s everywhere at once.', 'Where\'s the armoured train?!', 'I haven\'t slept in two days.'],
    seed: 61, reinforce: [{ x: 110, y: 14 }, { x: 146, y: 14 }, { x: 36, y: 14 }],
    objective: 'Free Mori Takeshi from the second blockhouse.',
    onStart(W) { W.boomT = 6; },
    onUpdate(W, dt) {
      W.boomT -= dt;
      if (W.boomT < 0) { W.boomT = 12 + Math.random() * 14; Sfx.play('explosion', 0.35); W.level.flash = 0.5; W.shake = 0.25; }
    },
  });
})();

// ===========================================================================
// CHAPTER 6 — The Iron Rooster: a train through occupied China
// ===========================================================================
Levels.ch6 = (() => {
  const m = new MB(196, 17);
  const cars = [[4, 38], [42, 38], [84, 38], [126, 38]];
  cars.forEach(([x, w], i) => {
    m.fill(x, 5, w, 1, 'B'); // roof
    m.fill(x, 6, w, 4, ',');
    m.fill(x, 10, w, 1, 'm'); // floor
    m.fill(x, 11, w, 1, 'B'); // undercarriage
    m.vline(x, 6, 4, 'B'); m.vline(x + w - 1, 6, 4, 'B');
    m.door(x, 9); m.door(x + w - 1, 9);
    // gap to next car: coupling walkway + ladder to the roof
    const gx = x + w;
    if (i < cars.length) { m.hline(gx, 10, 4, '='); m.ladder(gx + 1, 5, 9); m.ladder(gx + 2, 5, 9); }
    for (let k = 0; k < 3; k++) m.put(x + 6 + k * 11, 6, 'l');
    for (let k = 0; k < 4; k++) m.put(x + 3 + k * 9, 7, 'o');
  });
  // locomotive
  m.fill(168, 4, 26, 1, 'B'); m.fill(168, 5, 26, 5, ','); m.fill(168, 10, 26, 2, 'B'); m.vline(168, 5, 4, 'B'); m.door(168, 9);
  m.vline(193, 4, 7, 'B'); m.put(172, 5, 'l');
  m.put(0, 10, ' ');
  m.fill(0, 10, 4, 1, '='); m.ladder(1, 5, 9);
  m.put(2, 9, 'P');
  m.hint(3, 9, 'Mori\'s transit papers and a nurse\'s uniform make you "Nurse Sato" of the Red Cross — soldiers ignore you. Kempeitai officers inspect faces closely. First class and the guard car are off-limits.', 3);
  // car 1 (3rd class)
  for (const x of [8, 14, 20, 28, 34]) m.put(x, 9, 'n');
  m.npc(11, 9, { pal: 'civ_f1', wander: false });
  m.npc(24, 9, { pal: 'worker', wander: true });
  m.npc(31, 9, { pal: 'civ_m1', wander: false, scene: 'ch6_old', name: 'Old Farmer', once: true, portrait: 'civ' });
  m.enemy(18, 9, { role: 'S', patrolTiles: 8 });
  // car 2 (3rd class) — the inspection
  for (const x of [48, 54, 62, 68, 74]) m.put(x, 9, 'n');
  m.npc(52, 9, { pal: 'civ_f2', wander: false });
  m.npc(66, 9, { pal: 'civ_m2', wander: true });
  m.trig(46, 9, 'ch6_inspect', 2);
  m.enemy(60, 9, { role: 'K', patrolTiles: 7, id: 'inspector' });
  m.put(44, 9, 'X');
  m.hint(46, 4, 'On the roof the wind hides your footsteps — but tunnels come without warning. Crouch or lie flat when you hear the whistle.', 4);
  // car 3 (1st class, restricted)
  m.put(86, 9, 'X');
  for (const x of [92, 104, 116]) { m.put(x, 9, 't'); m.put(x + 3, 9, 'y'); }
  m.npc(94, 9, { pal: 'jp_officer', wander: false, witness: true });
  m.npc(107, 9, { pal: 'civ_f2', wander: false, witness: true });
  m.enemy(100, 9, { role: 'O', patrolTiles: 6, carry: 'guard_key' });
  m.enemy(112, 9, { role: 'K', facing: -1, turns: true, turnEvery: 5, stationary: true });
  m.put(120, 9, 'C');
  m.hint(90, 9, 'The officer patrolling first class wears the guard-car key on his belt. [E] from behind to pickpocket.', 3);
  m.photo(118, 9, 'p6');
  // car 4 (guard car) — Han
  m.put(128, 9, 'X');
  m.door(126, 9, ',', { locked: 'guard_key', id: 'guardcar', lockMsg: 'The guard car. Locked — an officer in first class has the key.' });
  m.enemy(140, 9, { role: 'S', patrolTiles: 5 });
  m.put(134, 9, 'd'); m.put(148, 9, 'd'); m.put(152, 9, 'C');
  m.npc(158, 9, { id: 'han', name: 'Han Tie', pal: 'han', pose: 'bound', scene: 'ch6_han', once: true, portrait: 'han', wander: false, witness: false });
  m.obj(0, 0, { type: 'tunnels', roofY: 80, period: 13 });
  return m.build({
    id: 'ch6', theme: 'train', backdrop: 'train', faction: 'jp', amb: 0.25, music: 'stealth', sound: 'train', scroll: 380,
    lines: JP_LINES, talk: ['Papers! Everyone have papers ready!', 'Pukou by dawn, if the Reds haven\'t torn up the line.', 'Tianjin was a mess.', 'Sit down and keep quiet.'],
    seed: 71, disguise: true, outfit: 'lan_nurse', restricted: [[84, 166]], guns: false,
    objective: 'Find Han Tie. The Kempeitai dragged him into the guard car at the front.',
  });
})();

// ===========================================================================
// CHAPTER 7 — The Solitary Island: a Shanghai ballroom
// ===========================================================================
Levels.ch7 = (() => {
  const m = new MB(156, 17);
  m.fill(0, 15, 156, 2, '#');
  m.put(2, 14, 'P');
  m.put(5, 14, 'L'); m.put(12, 14, 'L');
  m.npc(9, 14, { id: 'lu', name: 'Lu Zhiyuan', pal: 'lu', scene: 'ch7_lu', once: true, portrait: 'lu', wander: false, witness: false });
  // ballroom
  m.room(16, 4, 80, 11, {});
  m.door(15, 14);
  m.hline(16, 8, 50, 'r');
  m.hline(16, 15, 80, 'r');
  m.fill(80, 13, 14, 2, 'r');
  for (const x of [26, 44, 62]) m.obj(x, 9, { type: 'lamp', r: 95, i: 0.95, col: '#ffe0b0' });
  m.put(20, 14, 'i'); m.put(40, 14, 'i'); m.put(60, 14, 'i'); m.put(78, 14, 'i');
  m.deco(30, 14, 'bar');
  for (const x of [48, 52, 56]) m.npc(x, 14, { pal: U.pick(['civ_f2', 'civ_m1', 'waiter']), wander: true });
  for (const x of [83, 86, 89]) m.npc(x, 12, { pal: 'waiter', wander: false, witness: false });
  m.deco(92, 12, 'piano');
  m.npc(36, 14, { id: 'fang', name: 'Fang Yu', pal: 'fang', scene: 'ch7_fang', once: true, portrait: 'fang', wander: false, witness: false });
  m.npc(24, 14, { pal: 'waiter', wander: true, witness: false });
  m.enemy(44, 14, { role: 'K', patrolTiles: 6 });
  m.enemy(70, 14, { role: 'K', facing: -1, turns: true, turnEvery: 6, stationary: true });
  m.hint(18, 14, 'In a silk qipao you blend with the dancers. 76 agents (dark suits) watch the room — they study faces up close. Upstairs boxes and backstage are off-limits.', 4);
  m.ladder(18, 8, 14);
  // upper gallery with private boxes
  m.put(24, 7, 'q'); m.put(30, 5, 'o');
  m.npc(34, 7, { pal: 'civ_m2', wander: true });
  m.put(40, 7, 'X');
  m.enemy(50, 7, { role: 'K', patrolTiles: 4 });
  m.put(46, 7, 'U'); m.put(58, 7, 'U');
  m.npc(62, 7, { id: 'bai', name: 'Madame Bai', pal: 'bai', scene: 'ch7_bai', once: true, portrait: 'bai', wander: false, witness: false });
  m.obj(56, 4, { type: 'lamp', col: '#ffb0c0' });
  m.fill(66, 4, 1, 4, 'B');
  // backstage & office (restricted)
  m.room(97, 4, 42, 11, {});
  m.door(96, 14);
  m.hline(97, 8, 42, '#');
  m.ladder(100, 8, 14);
  m.enemy(114, 14, { role: 'K', patrolTiles: 7 });
  m.put(106, 14, 'd'); m.put(122, 14, 'C'); m.obj(110, 12, { type: 'lamp' }); m.obj(128, 12, { type: 'lamp' });
  m.put(98, 14, 'X');
  m.enemy(118, 7, { role: 'O', patrolTiles: 5 });
  m.put(106, 7, 'k'); m.put(126, 7, 'b'); m.put(111, 7, 'U');
  m.obj(132, 7, { type: 'keypad', safe: true, code: '0513', docGive: 'bai_ledger', flag: 'hasLedger', label: 'Madame Bai\'s safe', hint: 'The dressing-room note said: "Same as my stage debut — Paramount, the thirteenth of May."' });
  m.doc(102, 7, 'bai_note');
  m.obj(116, 4, { type: 'lamp' });
  m.photo(134, 7, 'p7');
  m.door(139, 14);
  m.put(144, 14, 'L');
  m.obj(152, 14, { type: 'exit', tw: 3, need: 'flag:baiDone', msg: 'You haven\'t dealt with Madame Bai yet.' });
  return m.build({
    id: 'ch7', theme: 'shanghai', backdrop: 'shanghai', faction: 'puppet', amb: 0.4, music: 'jazz', sound: 'city', guns: false,
    lines: PUPPET_LINES, talk: PUPPET_TALK, seed: 81, disguise: true, outfit: 'lan_qipao', restricted: [[58, 66], [96, 140]],
    objective: 'Find Madame Bai in the upstairs boxes. She knows where 76 keeps its prisoners.',
  });
})();

// ===========================================================================
// CHAPTER 8 — No. 76 Jessfield Road
// ===========================================================================
Levels.ch8 = (() => {
  const m = new MB(170, 20);
  m.fill(0, 19, 170, 1, '#');
  m.put(2, 18, 'P');
  // outer wall with a drain culvert
  m.fill(10, 12, 3, 6, 'B'); m.fill(10, 11, 3, 1, '^');
  m.fill(10, 18, 3, 1, '~');
  m.hint(6, 18, 'The drain under the wall is the only way in. Crawl [Z] through the water. If they ring the alarm, it\'s over — silence anyone who runs for the bell.', 4);
  // yard
  m.enemy(24, 18, { kind: 'dog', patrolTiles: 6 });
  m.obj(34, 18, { type: 'searchlight', dir: -1, a1: 0.12, a2: 0.7, speed: 0.33, len: 230 });
  m.put(18, 18, 'Y'); m.put(28, 18, 'c'); m.put(29, 18, 'c'); m.put(41, 18, 'd');
  m.item(16, 18, 'firecracker', { kind: 'firecracker', count: 2 });
  m.enemy(44, 18, { role: 'S', patrolTiles: 4 });
  m.put(47, 18, 'A');
  m.put(38, 18, 'L');
  m.put(50, 18, 'X');
  // main building: 3 floors
  m.room(54, 5, 104, 14, {});
  m.hline(54, 9, 104, '#'); m.hline(54, 14, 104, 'm');
  m.door(53, 18);
  // F1: cell block
  m.obj(60, 16, { type: 'lamp' }); m.obj(90, 16, { type: 'lamp' }); m.obj(120, 16, { type: 'lamp' }); m.obj(146, 16, { type: 'lamp' });
  m.enemy(66, 18, { role: 'K', patrolTiles: 6, carry: 'cell_keys_76' });
  m.put(58, 18, 'k');
  for (const x of [74, 80, 86]) m.deco(x, 18, 'cell');
  m.wall(90, 15, 16); m.door(90, 18);
  m.npc(78, 18, { pal: 'prisoner', pose: 'bound', wander: false, witness: false, scene: 'ch8_prisoner', once: true, name: 'Prisoner', portrait: 'prisoner' });
  m.obj(84, 18, { type: 'read', title: 'Scratched into the wall', text: 'Beneath the bunk, in small careful characters, someone has scratched: 苏明 SU MING. And below it, an arrow pointing to a loose brick.', label: 'Examine the wall', look: 'note' });
  m.item(85, 18, 'ming_letter', { kind: 'doc', id: 'ming_letter' });
  m.enemy(104, 18, { kind: 'dog', patrolTiles: 5 });
  m.enemy(118, 18, { role: 'S', patrolTiles: 6 });
  m.door(124, 18, ',', { locked: 'cell_keys_76', id: 'fangcell', lockMsg: 'A cell door. Locked — the jailer on this floor carries the keys.' });
  m.wall(124, 15, 16);
  m.npc(128, 18, { id: 'fang', name: 'Fang Yu', pal: 'fang', pose: 'bound', scene: 'ch8_fang', once: true, portrait: 'fang', wander: false, witness: false });
  m.wall(133, 15, 16); m.door(133, 18);
  m.ladder(62, 14, 18); m.ladder(150, 14, 18);
  m.put(140, 18, 'C');
  // F2: offices (creaky)
  m.put(58, 13, 'X');
  m.enemy(76, 13, { role: 'O', patrolTiles: 6 });
  m.put(70, 13, 'k'); m.put(82, 13, 'b'); m.put(88, 13, 'C');
  m.obj(72, 11, { type: 'lamp', group: 'B' }); m.obj(100, 11, { type: 'lamp', group: 'B' }); m.obj(130, 11, { type: 'lamp', group: 'B' });
  m.wall(94, 10, 11); m.door(94, 13);
  m.enemy(110, 13, { role: 'K', facing: 1, turns: true, turnEvery: 4, stationary: true });
  m.obj(104, 13, { type: 'fuse', group: 'B' });
  m.obj(120, 13, { type: 'keypad', safe: true, code: '1022', gives: 'transfer_order', docGive: 'transfer_order', label: 'Records safe', hint: 'From Madame Bai\'s floor plan: "Records safe — the Director\'s \'lucky number\', ten-twenty-two."' });
  m.put(126, 13, 'A');
  m.enemy(138, 13, { role: 'S', patrolTiles: 5 });
  m.ladder(146, 9, 13);
  // F3: the director's office
  m.put(142, 8, 'X');
  m.enemy(122, 8, { role: 'K', patrolTiles: 6 });
  m.put(112, 8, 'k'); m.put(104, 8, 'b'); m.put(96, 8, 'f'); m.obj(108, 6, { type: 'lamp' });
  m.doc(113, 8, 'li_memo');
  m.photo(100, 8, 'p8');
  m.set(158, 7, ','); m.set(158, 8, ',');
  m.ladder(159, 9, 18);
  m.obj(165, 18, { type: 'exit', tw: 3, need: 'item:transfer_order', msg: 'You still don\'t know where they took Ming. The records safe is on the second floor.' });
  return m.build({
    id: 'ch8', theme: 'no76', backdrop: 'shanghai', faction: 'puppet', amb: 0.22, music: 'stealth', sound: 'rain', weather: 'rain',
    lines: PUPPET_LINES, talk: PUPPET_TALK, seed: 91, alarmFail: true, guns: true,
    alarmFailText: 'The bells of 76 ring out. Doors slam across the compound. Somewhere below, a dog finds your scent — and there is nowhere left to run.',
    objective: 'Find out where 76 sent Ming. Records are kept in the second-floor safe.',
  });
})();

// ===========================================================================
// CHAPTER 9 — Return to Jinling: snow-bound Nanjing
// ===========================================================================
Levels.ch9 = (() => {
  const m = new MB(176, 17);
  m.fill(0, 15, 176, 2, '#');
  m.put(2, 14, 'P');
  m.hint(4, 14, 'Fresh snow. Your footprints stay behind you — patrols who spot them will follow the trail. Walk where they have already walked, or keep moving.', 4);
  m.put(10, 14, 'L'); m.put(16, 14, 'c');
  m.enemy(22, 14, { role: 'S', patrolTiles: 7 });
  m.obj(19, 14, { type: 'read', look: 'poster', title: 'Poster: "Peace, Anti-Communism, National Reconstruction"', text: 'A bright poster of the Reorganized National Government: Chairman Wang Jingwei beneath the old flag — with a yellow pennant added. "Sino-Japanese friendship builds the New Order in East Asia!" Someone has scrawled beneath it in charcoal: 漢奸 — traitor.', label: 'Read poster' });
  m.put(30, 14, 'Y');
  m.enemy(38, 14, { kind: 'dog', patrolTiles: 5 });
  m.item(33, 14, 'firecracker', { kind: 'firecracker', count: 2 });
  m.put(44, 14, 'L');
  m.put(48, 14, 'X');
  // puppet police post (two floors)
  m.room(52, 9, 22, 6, { doorL: true, doorR: true });
  m.hline(52, 11, 22, 'm'); m.ladder(70, 11, 14); m.ladder(55, 11, 14);
  m.enemy(62, 14, { kind: 'puppet', patrolTiles: 6 });
  m.enemy(64, 10, { kind: 'puppet', facing: -1, turns: true, turnEvery: 5, stationary: true });
  m.obj(58, 12, { type: 'lamp' }); m.put(66, 14, 'k'); m.put(60, 9, 'o');
  m.put(72, 10, 'C');
  m.obj(59, 10, { type: 'radio', lines: ['📻 "...Chairman Wang declares that peace with Japan is the only road to China\'s survival..."', '📻 "...the Imperial envoy, Ambassador Abe Nobuyuki, will arrive for the historic ceremony at month\'s end..."', '📻 "...bandits of Chongqing and Yan\'an continue to resist the New Order..."'] });
  // the old lane — home
  m.put(78, 14, 'L');
  m.enemy(86, 14, { role: 'S', patrolTiles: 5 });
  m.put(92, 14, 'X');
  m.room(96, 11, 22, 4, { doorL: true, doorR: true });
  m.wall(106, 11, 12); m.door(106, 14);
  m.put(99, 12, 'o'); m.put(112, 12, 'o');
  m.put(98, 14, 'e'); m.put(102, 14, 't'); m.put(110, 14, 'b'); m.put(114, 14, 'C'); m.put(101, 11, 'u');
  m.trig(98, 14, 'ch9_home', 2);
  m.obj(113, 14, { type: 'keypad', safe: true, code: '1927', gives: 'negatives', scene: 'ch9_cache', label: 'Loose floorboard — a combination box', hint: 'Ming\'s notebook: "the year Father planted the plum tree." Look at the tree in the courtyard.' });
  m.obj(121, 14, { type: 'read', look: 'grave', title: 'The plum tree', text: 'A gnarled plum tree, bare in the snow. At its foot, a little stone Father set when he came to Nanjing: 苏文华 植 · 民国十六年 — "Planted by Su Wenhua, Republic Year 16" — 1927.', label: 'Look at the plum tree' });
  m.photo(116, 14, 'p9');
  // to the temple
  m.enemy(132, 14, { role: 'K', patrolTiles: 6 });
  m.put(128, 14, 'L'); m.put(138, 14, 'Y');
  m.enemy(146, 14, { role: 'V', facing: -1, turns: true, turnEvery: 4 });
  m.put(150, 14, 'X');
  m.fill(156, 8, 18, 1, 'B'); m.vline(156, 9, 3, 'B'); m.vline(173, 9, 6, 'B');
  m.put(160, 14, 'h'); m.put(168, 14, 'h');
  m.npc(166, 14, { id: 'xu', name: 'Old Xu', pal: 'xu', wander: false, witness: false });
  m.trig(160, 14, 'ch9_xu', 2);
  return m.build({
    id: 'ch9', theme: 'snow', backdrop: 'nanjing', faction: 'jp', amb: 0.28, music: 'sad', sound: 'wind', weather: 'snow',
    lines: JP_LINES, talk: JP_TALK, seed: 101, reinforce: [{ x: 90, y: 14 }, { x: 150, y: 14, kind: 'kempei' }],
    objective: 'Return home. Ming hid something beneath the floor.',
  });
})();

// ===========================================================================
// CHAPTER 10 — The Puppet's Palace: 30 November 1940
// ===========================================================================
Levels.ch10 = (() => {
  const m = new MB(170, 17);
  m.fill(0, 15, 170, 2, '#');
  m.put(2, 14, 'P');
  m.put(6, 14, 'L');
  m.deco(10, 14, 'flag_wang'); m.deco(16, 14, 'flag_jp');
  m.enemy(13, 14, { kind: 'puppet', facing: -1, turns: false, stationary: true });
  // government hall
  m.room(22, 4, 110, 11, {});
  m.door(21, 14); m.door(132, 14);
  m.hline(22, 8, 110, 'r');
  for (const x of [30, 50, 70, 90, 110]) { m.put(x, 14, 'i'); m.obj(x + 8, 9, { type: 'lamp', r: 90 }); }
  m.deco(64, 14, 'banner', { color: '#c8a030' });
  m.npc(40, 14, { pal: 'civ_m1', wander: true });
  m.npc(56, 14, { pal: 'jp_officer', wander: true, witness: true });
  m.npc(76, 14, { pal: 'civ_m2', wander: true });
  m.npc(84, 14, { pal: 'waiter', wander: true });
  m.npc(46, 14, { id: 'fangpress', name: 'Fang Yu', pal: 'fang', scene: 'ch10_fang', once: true, portrait: 'fang', wander: false, witness: false, cond: 'flag:fang_rescued' });
  m.enemy(60, 14, { role: 'O', patrolTiles: 6, kind: 'officer' });
  m.enemy(96, 14, { kind: 'agent', patrolTiles: 6 });
  m.enemy(104, 14, { kind: 'puppet', facing: -1, turns: false, stationary: true });
  m.put(124, 14, 'A');
  m.ladder(26, 8, 14); m.ladder(118, 8, 14);
  m.hint(24, 14, 'The ceremony hall. With press credentials you may walk freely — otherwise keep to the shadows. The inner offices upstairs are off-limits.', 4);
  // upper floor: offices & attic access
  m.put(30, 7, 'X');
  m.enemy(48, 7, { kind: 'agent', patrolTiles: 6 });
  m.put(40, 7, 'b'); m.put(56, 7, 'U'); m.obj(44, 4, { type: 'lamp', group: 'U' }); m.obj(72, 4, { type: 'lamp', group: 'U' });
  m.wall(62, 4, 6); m.door(62, 7);
  m.put(66, 7, 'k'); m.doc(67, 7, 'wang_poem');
  m.enemy(78, 7, { kind: 'puppet', patrolTiles: 5 });
  m.obj(86, 7, { type: 'fuse', group: 'U' });
  m.wall(92, 4, 6); m.door(92, 7);
  m.trig(100, 7, 'ch10_lu', 2);
  m.npc(104, 7, { id: 'lu', name: 'Lu Zhiyuan', pal: 'lu', wander: false, witness: false });
  m.put(98, 5, 'o'); m.put(110, 5, 'o');
  m.photo(112, 7, 'p10');
  m.put(126, 7, 'C');
  // winter garden
  m.put(136, 14, 'X');
  m.deco(144, 14, 'plant'); m.deco(150, 14, 'plant');
  m.put(140, 14, 'L'); m.put(160, 14, 'L');
  m.npc(152, 14, { id: 'wang', name: 'Wang Jingwei', pal: 'wang', wander: false, witness: false });
  m.trig(146, 14, 'ch10_wang', 2);
  m.obj(166, 14, { type: 'exit', tw: 3, need: 'flag:wangMet', msg: 'Someone is standing alone in the garden...' });
  return m.build({
    id: 'ch10', theme: 'palace', backdrop: 'palace', faction: 'puppet', amb: 0.4, music: 'stealth', sound: 'wind', weather: 'snow',
    lines: PUPPET_LINES, talk: ['Ambassador Abe arrives within the hour.', 'Every Chongqing assassin in China would love to be here today.', 'Smile for the newsreels, gentlemen.', 'Today we become a real government.'],
    seed: 111, restricted: [[62, 132]], reinforce: [{ x: 24, y: 14 }, { x: 128, y: 14 }],
    objective: 'Find a way to reach Ming — someone in this hall knows where he is.',
    onStart(W) {
      if (Game.has('press_pass')) { W.player.disguise = true; W.player.pal = 'lan'; Game.flags.outfit = 'lan'; W.toast('Fang Yu\'s press credentials: you can walk the hall openly — stay out of the inner offices.', 5); }
    },
  });
})();

// ===========================================================================
// CHAPTER 11 — The House of Shadows: Kempeitai headquarters
// ===========================================================================
Levels.ch11 = (() => {
  const m = new MB(176, 20);
  m.fill(0, 19, 176, 1, '#');
  m.put(2, 18, 'P');
  m.hint(4, 18, 'Kempeitai headquarters. Find Ming in the cells below, then get him out alive. He is wounded — he will follow your trail [R to wait/follow].', 4);
  // courtyard
  m.obj(28, 18, { type: 'searchlight', dir: 1, a1: 0.1, a2: 0.65, speed: 0.36, len: 250 });
  m.enemy(18, 18, { kind: 'dog', patrolTiles: 5 });
  m.put(12, 18, 'Y'); m.put(36, 18, 'c'); m.put(37, 18, 'c'); m.fill(37, 17, 1, 1, 'c'); m.put(44, 18, 'Y');
  m.enemy(48, 18, { role: 'S', patrolTiles: 4 });
  m.put(52, 18, 'L');
  m.put(56, 18, 'X');
  // main block
  m.room(60, 5, 104, 14, {});
  m.hline(60, 10, 104, '#'); m.hline(60, 14, 104, '#');
  m.door(59, 18);
  // ground: guard hall
  m.enemy(72, 18, { role: 'K', patrolTiles: 6 });
  m.enemy(92, 18, { role: 'K', facing: -1, turns: true, turnEvery: 4, stationary: true });
  m.put(66, 18, 'k'); m.put(80, 18, 'C'); m.obj(70, 16, { type: 'lamp' }); m.obj(100, 16, { type: 'lamp' }); m.obj(130, 16, { type: 'lamp' });
  m.obj(84, 18, { type: 'fuse', group: 'A' });
  m.wall(104, 15, 16); m.door(104, 18);
  m.enemy(120, 18, { role: 'O', patrolTiles: 6, carry: 'cell_key' });
  m.put(112, 18, 'A');
  m.put(140, 18, 'C');
  m.enemy(150, 18, { kind: 'dog', patrolTiles: 4 });
  m.ladder(64, 14, 18); m.ladder(156, 14, 18);
  // middle: interrogation / offices
  m.put(66, 13, 'X');
  m.enemy(84, 13, { role: 'K', patrolTiles: 6 });
  m.put(76, 13, 'k'); m.put(90, 13, 'b'); m.obj(80, 11, { type: 'lamp', group: 'B' }); m.obj(110, 11, { type: 'lamp', group: 'B' });
  m.item(96, 13, 'medicine');
  m.doc(77, 13, 'kageyama_report');
  m.wall(100, 11, 12); m.door(100, 13);
  m.enemy(122, 13, { role: 'S', patrolTiles: 6 });
  m.put(116, 13, 'A');
  m.ladder(150, 10, 13);
  m.put(140, 13, 'C');
  // top: cells
  m.put(148, 9, 'X');
  m.enemy(126, 9, { role: 'K', patrolTiles: 5 });
  for (const x of [84, 90]) m.deco(x, 9, 'cell');
  m.wall(104, 5, 7); m.door(104, 9, ',', { locked: 'cell_key', id: 'mingcell', lockMsg: 'Ming\'s cell. Locked — the duty officer on the ground floor has the key.' });
  m.npc(98, 9, { id: 'ming', name: 'Su Ming', pal: 'ming_prison', pose: 'bound', scene: 'ch11_ming', once: true, portrait: 'ming_prison', wander: false, witness: false });
  m.obj(96, 7, { type: 'lamp', col: '#c8d0a0' });
  m.photo(92, 9, 'p11');
  m.put(80, 9, 'e');
  // exit: the back gate
  m.set(164, 17, ','); m.set(164, 18, ',');
  m.put(168, 18, 'L');
  m.trig(170, 18, 'ch11_gate', 2, 3, { cond: 'flag:mingFreed' });
  m.obj(174, 18, { type: 'exit', tw: 2, need: 'flag:gateDone', msg: 'The back gate.' });
  return m.build({
    id: 'ch11', theme: 'prison', backdrop: 'nanjing', faction: 'jp', amb: 0.16, music: 'tense', sound: 'wind', guns: true,
    lines: JP_LINES, talk: ['The photographer won\'t talk. The Major says: tomorrow, then.', 'Two nights of screaming in cell nine.', 'Wang\'s people want the prisoner handed over. The Major refused.', 'Keep the dogs hungry.'],
    seed: 121, reinforce: [{ x: 58, y: 18, kind: 'kempei' }, { x: 162, y: 18, kind: 'kempei' }, { x: 62, y: 13, kind: 'kempei' }],
    objective: 'Break Ming out of the Kempeitai cells.',
  });
})();

// ===========================================================================
// CHAPTER 12 — The River of Farewell: Xiaguan docks
// ===========================================================================
Levels.ch12 = (() => {
  const m = new MB(184, 17);
  m.fill(0, 15, 184, 2, '#');
  m.put(2, 14, 'P');
  m.obj(4, 14, { type: 'follower', id: 'ming', pal: 'ming_prison', name: 'Ming' });
  m.hint(6, 14, 'The last night. Get Ming to the boat at the end of the pier.', 3);
  m.put(10, 14, 'L'); m.put(14, 14, 'd');
  m.enemy(24, 14, { role: 'S', patrolTiles: 6 });
  m.put(30, 14, 'Y'); m.put(36, 14, 'c'); m.put(37, 14, 'c');
  // warehouse
  m.room(42, 9, 30, 6, { doorL: true, doorR: true });
  m.hline(42, 11, 30, '='); m.ladder(46, 11, 14); m.ladder(68, 11, 14);
  m.enemy(58, 14, { role: 'S', patrolTiles: 7 });
  m.enemy(56, 10, { role: 'V', facing: -1, turns: true, turnEvery: 4 });
  m.put(50, 14, 'd'); m.put(52, 14, 'd'); m.put(62, 14, 'C'); m.obj(50, 12, { type: 'lamp', group: 'W' }); m.obj(64, 12, { type: 'lamp', group: 'W' });
  m.obj(70, 14, { type: 'fuse', group: 'W' });
  m.put(76, 14, 'X');
  // quay with shallow water
  m.fill(80, 14, 10, 1, '~');
  m.enemy(94, 14, { kind: 'dog', patrolTiles: 5 });
  m.put(98, 14, 'L');
  m.enemy(106, 14, { role: 'K', patrolTiles: 6 });
  m.put(112, 14, 'Y'); m.put(116, 14, 'A');
  m.obj(124, 14, { type: 'searchlight', dir: 1, a1: 0.1, a2: 0.6, speed: 0.3, len: 240 });
  m.put(120, 14, 'X');
  m.fill(128, 14, 6, 1, '"');
  m.enemy(140, 14, { role: 'S', patrolTiles: 5 });
  m.put(146, 14, 'd'); m.put(147, 14, 'd');
  m.photo(150, 14, 'p12');
  m.enemy(158, 14, { role: 'V', facing: -1, turns: true, turnEvery: 4 });
  m.put(154, 14, 'L');
  // pier and boat
  m.fill(164, 15, 20, 2, '~');
  m.hline(164, 15, 12, '=');
  m.deco(178, 16, 'boat');
  m.trig(172, 14, 'ch12_final', 2, 3);
  return m.build({
    id: 'ch12', theme: 'docks', backdrop: 'docks', faction: 'jp', amb: 0.24, music: 'stealth', sound: 'river', weather: 'snow', guns: true,
    lines: JP_LINES, talk: ['The river will freeze at the edges tonight.', 'The Major wants every boat searched.', 'Nobody leaves Xiaguan tonight.', 'Cold... so cold.'],
    seed: 131, reinforce: [{ x: 78, y: 14 }, { x: 160, y: 14, kind: 'kempei' }],
    objective: 'Reach the boat at the end of the pier with Ming.',
    onStart(W) { const f = W.followers[0]; if (f) f.slow = Game.flags.mingHealed ? 1 : 0.62; },
  });
})();
