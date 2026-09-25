'use strict';
// ---------------------------------------------------------------------------
// UI: title & menus, HUD, world overlays (barks, alert icons, prompts),
// journal, keypad, pause/settings, death, chapter summary, credits.
// All drawn at 1920x1080 on top of the 4x-scaled pixel world.
// ---------------------------------------------------------------------------
const UI = {
  // ---------------------------------------------------------------- helpers
  panel(g, x, y, w, h, a = 0.92) {
    g.fillStyle = `rgba(14,10,9,${a})`; g.fillRect(x, y, w, h);
    g.strokeStyle = '#8a7040'; g.lineWidth = 3; g.strokeRect(x + 5, y + 5, w - 10, h - 10);
    g.strokeStyle = 'rgba(200,170,100,0.25)'; g.lineWidth = 1; g.strokeRect(x + 12, y + 12, w - 24, h - 24);
  },
  text(g, s, x, y, size = 32, col = '#f0e6d0', align = 'left', font = FONT, weight = '') {
    g.font = `${weight} ${size}px ${font}`; g.fillStyle = col; g.textAlign = align; g.fillText(s, x, y); g.textAlign = 'left';
  },
  menuList(g, items, sel, x, y, w, h = 70, gap = 12) {
    let hov = -1;
    items.forEach((it, i) => {
      const yy = y + i * (h + gap);
      const over = Input.mouse.x > x && Input.mouse.x < x + w && Input.mouse.y > yy && Input.mouse.y < yy + h;
      if (over) hov = i;
      const s = i === sel;
      const dis = it.disabled;
      g.fillStyle = dis ? 'rgba(20,18,16,0.6)' : s ? 'rgba(120,32,24,0.92)' : 'rgba(16,12,10,0.75)';
      g.fillRect(x, yy, w, h);
      g.strokeStyle = s ? '#f0c060' : '#6a5838'; g.lineWidth = s ? 3 : 2; g.strokeRect(x + 3, yy + 3, w - 6, h - 6);
      this.text(g, it.label, x + w / 2, yy + h / 2 + 12, 34, dis ? '#6a6058' : s ? '#fff4dc' : '#e0d4bc', 'center', FONT, '600');
      if (it.sub) this.text(g, it.sub, x + w - 20, yy + h / 2 + 10, 22, '#a89878', 'right', FONT_UI, 'italic');
    });
    return hov;
  },
  navList(n, selKey, obj) {
    if (Input.hit('down')) { obj[selKey] = (obj[selKey] + 1) % n; Sfx.play('choice'); }
    if (Input.hit('up')) { obj[selKey] = (obj[selKey] - 1 + n) % n; Sfx.play('choice'); }
  },

  // ---------------------------------------------------------------- title
  titleItems() {
    const hasSave = Game.save && Game.save.run && Game.save.chapter !== undefined;
    return [
      { label: hasSave ? 'Continue' : 'New Game', act: () => (hasSave ? Game.continueGame() : Game.newGame()), sub: hasSave ? Story.chapters[Game.save.chapter].name : '' },
      { label: hasSave ? 'New Game' : 'Chapter Select', act: () => (hasSave ? (this.confirmNew = true) : (Game.state_ = 'chapters', this.chSel = 0)), disabled: false },
      { label: 'Chapter Select', act: () => { Game.state_ = 'chapters'; this.chSel = 0; }, hide: !hasSave },
      { label: 'Endings & Achievements', act: () => { Game.state_ = 'extras'; this.exSel = 0; } },
      { label: 'Settings', act: () => { this.settingsBack = 'title'; Game.state_ = 'settings'; this.setSel = 0; } },
      { label: 'Credits & History', act: () => Game.showCredits() },
    ].filter((i) => !i.hide);
  },
  updateTitle(dt) {
    const items = this.titleItems();
    if (this.confirmNew) {
      if (Input.hit('confirm') || Input.pressed.has('KeyY')) { this.confirmNew = false; Game.newGame(); }
      if (Input.hit('pause') || Input.pressed.has('KeyN')) this.confirmNew = false;
      return;
    }
    Game.menu.sel = Math.min(Game.menu.sel, items.length - 1);
    this.navList(items.length, 'sel', Game.menu);
    if (this.titleHover >= 0 && Input.mouse.moved) Game.menu.sel = this.titleHover;
    if (Input.hit('confirm') || (Input.mouse.click && this.titleHover >= 0)) { Sfx.play('select'); items[Game.menu.sel].act(); }
  },
  drawTitle(g) {
    const t = Game.time;
    g.drawImage(Art.get('title'), -30 - Math.sin(t * 0.07) * 30, -20, UIW + 60, UIH + 40);
    Art.overlay(g, 'nanjing_night', t, 0, 0, UIW, UIH);
    // title
    g.save();
    g.shadowColor = 'rgba(0,0,0,0.8)'; g.shadowBlur = 30;
    this.text(g, '半 玉', UIW / 2, 250, 120, '#d8b060', 'center', FONT, '700');
    this.text(g, 'HALF OF JADE', UIW / 2, 360, 104, '#f4ead4', 'center', FONT, '700');
    this.text(g, 'A Sister\'s War  ·  1939 – 1940', UIW / 2, 420, 36, '#c8a060', 'center', FONT, 'italic');
    g.restore();
    const items = this.titleItems();
    this.titleHover = this.menuList(g, items, Game.menu.sel, UIW / 2 - 300, 520, 600, 66, 12);
    this.text(g, 'Arrows/WASD + Enter · Mouse · F1: controls', UIW / 2, 1040, 22, '#a89878', 'center', FONT_UI);
    if (!Sfx.unlocked) this.text(g, '(click or press any key to enable sound)', UIW / 2, 1005, 22, '#8a7a68', 'center', FONT_UI, 'italic');
    if (this.confirmNew) {
      this.panel(g, UIW / 2 - 420, 420, 840, 220);
      this.text(g, 'Start a new game?', UIW / 2, 500, 44, '#f0e6d0', 'center', FONT, '700');
      this.text(g, 'Your current story progress will be replaced. [Enter] Yes · [Esc] No', UIW / 2, 570, 26, '#c8b898', 'center', FONT_UI);
    }
  },

  // ---------------------------------------------------------------- chapter select
  updateChapters() {
    const n = Story.chapters.length;
    if (Input.hit('down') || Input.hit('right')) { this.chSel = (this.chSel + 1) % n; Sfx.play('choice'); }
    if (Input.hit('up') || Input.hit('left')) { this.chSel = (this.chSel - 1 + n) % n; Sfx.play('choice'); }
    if (this.chHover >= 0 && Input.mouse.moved) this.chSel = this.chHover;
    if (Input.hit('pause')) { Game.goTitle(); return; }
    if (Input.hit('confirm') || (Input.mouse.click && this.chHover >= 0)) {
      const unlocked = this.chSel <= (Game.meta.unlocked || 0) || Game.meta.allUnlocked;
      if (unlocked) { Sfx.play('select'); Game.playChapter(this.chSel); } else Sfx.play('locked');
    }
    if (Input.pressed.has('KeyU') && Input.down.has('ShiftLeft')) { Game.meta.allUnlocked = true; Game.toast('All chapters unlocked'); }
  },
  drawChapters(g) {
    g.drawImage(Art.get('nanjing_snow'), 0, 0, UIW, UIH);
    g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(0, 0, UIW, UIH);
    this.text(g, 'Chapter Select', UIW / 2, 110, 64, '#f0e6d0', 'center', FONT, '700');
    this.chHover = -1;
    Story.chapters.forEach((c, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const x = 180 + col * 800, y = 170 + row * 118, w = 760, h = 104;
      const unlocked = i <= (Game.meta.unlocked || 0) || Game.meta.allUnlocked;
      const over = Input.mouse.x > x && Input.mouse.x < x + w && Input.mouse.y > y && Input.mouse.y < y + h;
      if (over) this.chHover = i;
      const s = this.chSel === i;
      g.fillStyle = s ? 'rgba(120,32,24,0.9)' : 'rgba(16,12,10,0.8)'; g.fillRect(x, y, w, h);
      g.strokeStyle = s ? '#f0c060' : '#6a5838'; g.lineWidth = 2; g.strokeRect(x + 3, y + 3, w - 6, h - 6);
      this.text(g, unlocked ? c.kicker : '— Locked —', x + 30, y + 40, 24, '#c8a060', 'left', FONT_UI, '600');
      this.text(g, unlocked ? c.name : '???', x + 30, y + 80, 34, unlocked ? '#f0e6d0' : '#6a6058', 'left', FONT, '700');
      if (unlocked) this.text(g, c.place, x + w - 24, y + 40, 20, '#a89878', 'right', FONT_UI, 'italic');
    });
    this.text(g, '[Enter] Play · [Esc] Back — progress is saved at the start of every chapter', UIW / 2, 1050, 24, '#a89878', 'center', FONT_UI);
  },

  // ---------------------------------------------------------------- extras
  updateExtras() { if (Input.hit('pause') || Input.hit('confirm') || Input.mouse.click) Game.goTitle(); },
  drawExtras(g) {
    g.drawImage(Art.get('river_dawn'), 0, 0, UIW, UIH);
    g.fillStyle = 'rgba(0,0,0,0.7)'; g.fillRect(0, 0, UIW, UIH);
    this.text(g, 'Endings', 480, 110, 56, '#f0e6d0', 'center', FONT, '700');
    Story.endingList.forEach((e, i) => {
      const seen = Game.meta.endings[e.id];
      this.text(g, (seen ? '◆ ' : '◇ ') + (seen ? e.name : '???'), 140, 200 + i * 62, 32, seen ? '#e8d8b0' : '#6a6058', 'left', FONT, '600');
      if (seen) this.text(g, e.hint, 170, 228 + i * 62, 20, '#a89878', 'left', FONT_UI, 'italic');
      else this.text(g, e.lock, 170, 228 + i * 62, 20, '#7a6a58', 'left', FONT_UI, 'italic');
    });
    this.text(g, 'Achievements', 1400, 110, 56, '#f0e6d0', 'center', FONT, '700');
    const ach = Object.entries(Story.achievements);
    ach.forEach(([id, a], i) => {
      const got = Game.meta.achievements[id];
      const y = 180 + i * 40;
      this.text(g, (got ? '★ ' : '☆ ') + a.name, 1000, y, 28, got ? '#f0d080' : '#6a6058', 'left', FONT, '600');
      this.text(g, got || !a.secret ? a.desc : 'Secret', 1340, y, 20, got ? '#c8b898' : '#6a6058', 'left', FONT_UI, 'italic');
    });
    const photos = Object.keys(Game.meta.photosEver || {}).length;
    this.text(g, `Memories ever found: ${photos} / ${Story.photoCount}`, 480, 1000, 28, '#c8a060', 'center', FONT_UI);
    this.text(g, '[Esc] Back', UIW / 2, 1050, 24, '#a89878', 'center', FONT_UI);
  },

  // ---------------------------------------------------------------- HUD
  drawHUD(g, W) {
    const p = W.player, L = W.level;
    // objective
    if (Game.objective) {
      g.font = `26px ${FONT}`;
      const objL = U.wrap(g, Game.objective, 700).slice(0, 2);
      const oh = 54 + objL.length * 32;
      g.fillStyle = 'rgba(10,8,6,0.62)'; g.fillRect(24, 24, 760, oh);
      g.fillStyle = '#8a1a14'; g.fillRect(24, 24, 8, oh);
      this.text(g, Story.chapters[Game.chapter].kicker.toUpperCase(), 50, 56, 20, '#c8a060', 'left', FONT_UI, '600');
      objL.forEach((l, i) => this.text(g, l, 50, 92 + i * 32, 26, '#f0e6d0', 'left', FONT));
    }
    // status pill
    let status = 'UNSEEN', col = '#8a9a8a';
    if (L.alarm) { status = 'ALARM'; col = Math.floor(Game.time * 4) % 2 ? '#ff3020' : '#a01810'; }
    else if (W.anyAlert()) { status = 'ALERT'; col = '#e03a2a'; }
    else if (W.enemies.some((e) => e.alive && (e.state === 'search'))) { status = 'SEARCHING'; col = '#e08a2a'; }
    else if (W.enemies.some((e) => e.alive && e.sus > 0.25)) { status = 'SUSPICIOUS'; col = '#e0c040'; }
    else if (p.hidden) { status = 'HIDDEN'; col = '#6ab0e0'; }
    g.fillStyle = 'rgba(10,8,6,0.7)'; g.fillRect(UIW - 344, 24, 320, 70);
    g.fillStyle = col; g.fillRect(UIW - 344, 24, 10, 70);
    this.text(g, status, UIW - 184, 72, 36, col, 'center', FONT_UI, '700');
    if (W.def.alarmFail && !L.alarm) this.text(g, 'Do not let them raise the alarm', UIW - 184, 118, 20, '#c8a060', 'center', FONT_UI, 'italic');
    if (W.def.noAlert) this.text(g, 'You must not be seen', UIW - 184, 118, 20, '#c8a060', 'center', FONT_UI, 'italic');

    // visibility gem + stance
    const light = L.lightAt(p.x, p.y - p.h / 2);
    const vis = p.hidden ? 0 : U.clamp(light, 0, 1);
    const gx = 74, gy = UIH - 78;
    g.fillStyle = 'rgba(10,8,6,0.62)'; g.fillRect(20, UIH - 138, 420, 118);
    const gg = g.createRadialGradient(gx, gy, 4, gx, gy, 48);
    gg.addColorStop(0, `rgba(255,${200 + vis * 55},${120 + vis * 100},${0.15 + vis * 0.85})`); gg.addColorStop(1, `rgba(60,40,20,${0.3 + vis * 0.4})`);
    g.fillStyle = gg; g.beginPath(); g.arc(gx, gy, 38, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#c8a050'; g.lineWidth = 3; g.beginPath(); g.arc(gx, gy, 40, 0, Math.PI * 2); g.stroke();
    this.text(g, p.hidden ? 'HIDDEN' : vis < 0.3 ? 'SHADOW' : vis < 0.65 ? 'DIM' : 'LIT', gx, gy + 7, 16, vis > 0.5 ? '#3a2410' : '#e8dcc0', 'center', FONT_UI, '700');
    const stanceLbl = p.hidden ? 'Hidden' : p.onLadder ? 'Climbing' : p.drag ? 'Dragging body' : p.stance === 'prone' ? 'Prone' : p.stance === 'crouch' ? 'Crouched' : p.running ? 'Running' : 'Standing';
    this.text(g, stanceLbl, 132, UIH - 100, 28, '#f0e6d0', 'left', FONT, '600');
    if (p.disguise) this.text(g, W.disguiseBurned ? 'Disguise: BLOWN' : 'Disguise: intact', 290, UIH - 100, 20, W.disguiseBurned ? '#e05040' : '#80c080', 'left', FONT_UI, '600');
    // noise meter
    const nz = U.clamp((p.lastNoise || 0) / 150, 0, 1);
    p.lastNoise = Math.max(0, (p.lastNoise || 0) - 3);
    this.text(g, 'NOISE', 132, UIH - 52, 16, '#a89878', 'left', FONT_UI, '600');
    g.fillStyle = 'rgba(255,255,255,0.1)'; g.fillRect(196, UIH - 66, 224, 16);
    g.fillStyle = nz > 0.6 ? '#e04030' : nz > 0.3 ? '#e0b040' : '#80b080'; g.fillRect(196, UIH - 66, 224 * nz, 16);

    // equipment
    const ex = UIW - 440, ey = UIH - 138;
    g.fillStyle = 'rgba(10,8,6,0.62)'; g.fillRect(ex, ey, 420, 118);
    const gunTxt = p.gun ? `${p.gun.kind === 'rifle' ? 'Arisaka rifle' : 'Pistol'}  ${p.gun.ammo} rds${p.gunDrawn ? ' — DRAWN' : ''}` : 'Unarmed';
    this.text(g, '⚔ ' + gunTxt, ex + 20, ey + 34, 22, p.gun ? (p.gunDrawn ? '#ff8a60' : '#f0e6d0') : '#8a8070', 'left', FONT_UI, '600');
    this.text(g, `◉ Stones ${p.throwCD > 0 ? '(…)' : 'ready'} [Q]`, ex + 20, ey + 66, 20, '#d8ccb0', 'left', FONT_UI);
    this.text(g, `✹ Firecrackers ×${Game.state.firecrackers} [T]`, ex + 210, ey + 66, 20, Game.state.firecrackers ? '#f0b070' : '#7a7060', 'left', FONT_UI);
    if (Game.has('medicine')) this.text(g, `✚ Medicine ×${Game.items.medicine}`, ex + 20, ey + 98, 20, '#e0a0a0', 'left', FONT_UI);
    if (W.followers.length) {
      const f = W.followers[0];
      this.text(g, `${f.name}: ${f.waiting ? 'waiting' : 'following'} [R]`, ex + 210, ey + 98, 20, '#a0c0e0', 'left', FONT_UI);
    }

    // prompts
    const prompts = [];
    if (W.takedown) prompts.push(W.def.nonlethal ? '[V] Knock out' : '[F] Kill   ·   [V] Knock out');
    if (W.focus) prompts.push('[E] ' + W.focus.prompt);
    if (p.drag && (!W.focus || !W.focus.hideSpot)) prompts.push('[E] Drop body');
    if (p.hidden) {
      prompts.push('[E] Leave hiding spot');
      const near = W.enemies.find((e) => e.alive && e.kind !== 'dog' && Math.abs(e.x - p.x) < 20 && Math.abs(e.y - p.y) < 12 && e.state !== 'alert');
      if (near) prompts.push(W.def.nonlethal ? '[V] Ambush from hiding' : '[F]/[V] Ambush from hiding');
    }
    if (p.gunDrawn && !W.takedown) prompts.push('[F] Fire   ·   [G] Holster');
    if (p.action && p.action.kind === 'work') prompts.push(p.action.label || 'Working...');
    prompts.forEach((s, i) => {
      g.font = `600 30px ${FONT_UI}`;
      const w = g.measureText(s).width + 50;
      const x = UIW / 2 - w / 2, y = UIH - 120 - i * 58;
      g.fillStyle = 'rgba(10,8,6,0.78)'; g.fillRect(x, y, w, 48);
      g.strokeStyle = '#c8a050'; g.lineWidth = 2; g.strokeRect(x + 2, y + 2, w - 4, 44);
      this.text(g, s, UIW / 2, y + 35, 30, '#f8ecd0', 'center', FONT_UI, '600');
    });
    if (p.action && p.action.kind === 'work') {
      g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(UIW / 2 - 200, UIH - 90, 400, 16);
      g.fillStyle = '#e0b040'; g.fillRect(UIW / 2 - 200, UIH - 90, 400 * (p.action.t / p.action.dur), 16);
    }
    // breath
    if (p.hidden) {
      const checking = W.enemies.some((e) => e.alive && e.checkObj === p.hidden && Math.abs(e.x - p.x) < 40);
      const close = W.enemies.some((e) => e.alive && (e.state === 'search') && Math.abs(e.x - p.x) < 80);
      if (checking || close || p.breath < 1) {
        const bx = UIW / 2 - 250, by = 220;
        g.fillStyle = 'rgba(10,8,6,0.8)'; g.fillRect(bx, by, 500, 90);
        this.text(g, checking ? 'THEY\'RE CHECKING — HOLD [SPACE] TO HOLD YOUR BREATH' : 'Hold [SPACE] to hold your breath', UIW / 2, by + 36, checking ? 22 : 22, checking ? '#ff9070' : '#c8d8e8', 'center', FONT_UI, '700');
        g.fillStyle = 'rgba(255,255,255,0.1)'; g.fillRect(bx + 30, by + 54, 440, 16);
        g.fillStyle = p.breath < 0.25 ? '#e04030' : '#60a0e0'; g.fillRect(bx + 30, by + 54, 440 * p.breath, 16);
      }
    }
    // level hints
    if (W.hintText && Game.settings.hints) {
      g.font = `italic 28px ${FONT}`;
      const lines = U.wrap(g, W.hintText, 1000);
      const h = 30 + lines.length * 38;
      g.fillStyle = 'rgba(12,10,8,0.8)'; g.fillRect(UIW / 2 - 540, 158, 1080, h);
      g.strokeStyle = '#6a5838'; g.strokeRect(UIW / 2 - 536, 162, 1072, h - 8);
      lines.forEach((l, i) => this.text(g, l, UIW / 2, 196 + i * 38, 28, '#e8dcc0', 'center', FONT, 'italic'));
    }
  },

  drawWorldOverlay(g, W) {
    const cam = W.lastCam || W.cam;
    const toUI = (x, y) => [(x - cam.x) * SC, (y - cam.y) * SC];
    // enemy icons
    for (const e of W.enemies) {
      if (!e.alive || !e.icon) continue;
      let [x, y] = toUI(e.x, e.y - e.h - 8);
      const off = x < 0 || x > UIW || y < 0 || y > UIH;
      if (off) {
        if (e.sus < 0.3 && e.state !== 'alert') continue;
        x = U.clamp(x, 40, UIW - 40); y = U.clamp(y, 160, UIH - 220);
      }
      const red = e.icon === '!';
      g.fillStyle = 'rgba(10,8,6,0.8)'; g.beginPath(); g.arc(x, y - 14, 24, 0, Math.PI * 2); g.fill();
      if (!red) { g.strokeStyle = '#e0c040'; g.lineWidth = 5; g.beginPath(); g.arc(x, y - 14, 24, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * U.clamp(e.sus, 0, 1)); g.stroke(); }
      else { g.strokeStyle = '#ff3a2a'; g.lineWidth = 5; g.beginPath(); g.arc(x, y - 14, 24, 0, Math.PI * 2); g.stroke(); }
      this.text(g, e.icon, x, y - 1, 36, red ? '#ff5040' : '#f0d050', 'center', FONT_UI, '900');
      if (e.state === 'toAlarm') this.text(g, '🔔', x + 36, y - 4, 28, '#fff', 'center', FONT_UI);
    }
    // barks
    for (const b of W.barks) {
      const a = b.actor;
      const [x, y] = toUI(a.x, a.y - (a.h || 22) - 16);
      if (x < -200 || x > UIW + 200) continue;
      g.font = `italic 26px ${FONT}`;
      const w = Math.min(640, g.measureText(b.text).width + 36);
      const bx = U.clamp(x - w / 2, 10, UIW - w - 10), by = y - 86;
      g.globalAlpha = Math.min(1, b.t * 2);
      g.fillStyle = 'rgba(245,238,220,0.94)'; g.fillRect(bx, by, w, 46);
      g.beginPath(); g.moveTo(x - 10, by + 46); g.lineTo(x + 10, by + 46); g.lineTo(x, by + 60); g.fill();
      this.text(g, b.text, bx + w / 2, by + 32, 26, '#2a1a10', 'center', FONT, 'italic');
      g.globalAlpha = 1;
    }
    // NPC talk markers
    for (const n of W.npcs) {
      if (n.removed || !n.scene || (n.talkOnce && n.talked) || n.scared || n.pickpocket) continue;
      const [x, y] = toUI(n.x, n.y - 30);
      const bob = Math.sin(Game.time * 3) * 6;
      g.fillStyle = '#f0d070'; g.beginPath(); g.arc(x, y + bob - 20, 14, 0, Math.PI * 2); g.fill();
      this.text(g, '…', x, y + bob - 12, 28, '#3a2a10', 'center', FONT_UI, '900');
    }
  },

  // ---------------------------------------------------------------- toasts / help
  drawToasts(g) {
    let ty = 330;
    Game.toasts.forEach((t, i) => {
      const a = Math.min(1, t.t * 2, (t.max - t.t) * 4 + 0.2);
      g.globalAlpha = U.clamp(a, 0, 1);
      g.font = `600 24px ${FONT_UI}`;
      const lines = U.wrap(g, t.text, 1000);
      const w = Math.min(1100, Math.max(...lines.map((l) => g.measureText(l).width)) + 60), h = 16 + lines.length * 32;
      const y = ty; ty += h + 10;
      g.fillStyle = 'rgba(12,10,8,0.82)'; g.fillRect(UIW / 2 - w / 2, y, w, h);
      g.fillStyle = '#c8a050'; g.fillRect(UIW / 2 - w / 2, y, 6, h);
      lines.forEach((l, k) => this.text(g, l, UIW / 2, y + 34 + k * 32, 24, '#f4ead4', 'center', FONT_UI, '600'));
      g.globalAlpha = 1;
    });
  },
  drawHelp(g) {
    this.panel(g, 360, 120, 1200, 840, 0.96);
    this.text(g, 'Controls', UIW / 2, 200, 56, '#f0e6d0', 'center', FONT, '700');
    const rows = [
      ['A / D  or  ← →', 'Move'], ['Shift', 'Run (loud)'], ['W / Space', 'Jump · climb ladders · stand up'], ['C  or  S', 'Crouch (quiet, low profile)'], ['Z', 'Go prone (silent crawl, hide in tall grass, slip under wire)'],
      ['E', 'Interact · hide · talk · drag bodies'], ['F', 'Lethal takedown (from behind / unseen) · fire weapon'], ['V', 'Non-lethal knockout'], ['Q', 'Throw a stone (distraction)'], ['T', 'Throw firecrackers (big distraction, scares dogs)'],
      ['G', 'Draw / holster firearm'], ['R', 'Order companion to wait / follow'], ['Space (while hidden)', 'Hold your breath when searched'], ['Tab / J', 'Journal: objectives, items, documents, memories, people'], ['Esc / P', 'Pause'], ['Shift (in dialogue)', 'Fast-forward text'],
    ];
    rows.forEach(([k, v], i) => { this.text(g, k, 800, 280 + i * 40, 26, '#e0c070', 'right', FONT_UI, '700'); this.text(g, v, 830, 280 + i * 40, 26, '#e8dcc0', 'left', FONT_UI); });
    this.text(g, 'Gamepad: A jump · B crouch · X interact · Y kill · LB knockout · RB throw · LT run · RT prone · Start pause', UIW / 2, 915, 22, '#a8a080', 'center', FONT_UI);
    this.text(g, 'One shot kills Lan. Shadows hide you. Noise travels through walls. [F1] to close.', UIW / 2, 945, 24, '#c8a060', 'center', FONT, 'italic');
  },

  // ---------------------------------------------------------------- pause & settings
  pauseItems() {
    return [
      { label: 'Resume', act: () => { Game.state_ = 'play'; } },
      { label: 'Journal', act: () => { Game.state_ = 'journal'; this.journal.open(); } },
      { label: 'Controls', act: () => { Game.showHelp = true; } },
      { label: 'Settings', act: () => { this.settingsBack = 'pause'; Game.state_ = 'settings'; this.setSel = 0; } },
      { label: 'Restart from checkpoint', act: () => Game.restoreCheckpoint() },
      { label: 'Restart chapter', act: () => Game.restartLevel() },
      { label: 'Save & quit to title', act: () => { Game.persist(false); Game.goTitle(); } },
    ];
  },
  updatePause() {
    const items = this.pauseItems();
    this.navList(items.length, 'pauseSel', Game);
    if (this.pauseHover >= 0 && Input.mouse.moved) Game.pauseSel = this.pauseHover;
    if (Input.hit('pause')) { Game.state_ = 'play'; return; }
    if (Input.hit('confirm') || (Input.mouse.click && this.pauseHover >= 0)) { Sfx.play('select'); items[Game.pauseSel].act(); }
  },
  drawPause(g) {
    g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(0, 0, UIW, UIH);
    this.text(g, 'Paused', UIW / 2, 220, 72, '#f0e6d0', 'center', FONT, '700');
    const ch = Story.chapters[Game.chapter];
    this.text(g, `${ch.kicker} — ${ch.name}`, UIW / 2, 280, 30, '#c8a060', 'center', FONT, 'italic');
    this.pauseHover = this.menuList(g, this.pauseItems(), Game.pauseSel, UIW / 2 - 320, 340, 640, 66, 10);
  },
  settingRows() {
    const S = Game.settings;
    const diffs = ['story', 'normal', 'hard'];
    return [
      { label: 'Difficulty', val: { story: 'Story (forgiving)', normal: 'Normal', hard: 'Hard (unforgiving)' }[S.difficulty], left: () => { S.difficulty = diffs[(diffs.indexOf(S.difficulty) + 2) % 3]; }, right: () => { S.difficulty = diffs[(diffs.indexOf(S.difficulty) + 1) % 3]; } },
      { label: 'Vision cones', val: S.cones ? 'Shown' : 'Hidden', toggle: () => { S.cones = !S.cones; } },
      { label: 'Noise rings', val: S.noiseRings ? 'Shown' : 'Hidden', toggle: () => { S.noiseRings = !S.noiseRings; } },
      { label: 'Tutorial hints', val: S.hints ? 'On' : 'Off', toggle: () => { S.hints = !S.hints; } },
      { label: 'Text speed', val: S.textSpeed + ' cps', left: () => { S.textSpeed = Math.max(20, S.textSpeed - 10); }, right: () => { S.textSpeed = Math.min(200, S.textSpeed + 10); } },
      { label: 'Master volume', val: Math.round(S.master * 100) + '%', left: () => { S.master = Math.max(0, +(S.master - 0.1).toFixed(1)); }, right: () => { S.master = Math.min(1, +(S.master + 0.1).toFixed(1)); } },
      { label: 'Music volume', val: Math.round(S.music * 100) + '%', left: () => { S.music = Math.max(0, +(S.music - 0.1).toFixed(1)); }, right: () => { S.music = Math.min(1, +(S.music + 0.1).toFixed(1)); } },
      { label: 'Effects volume', val: Math.round(S.sfx * 100) + '%', left: () => { S.sfx = Math.max(0, +(S.sfx - 0.1).toFixed(1)); }, right: () => { S.sfx = Math.min(1, +(S.sfx + 0.1).toFixed(1)); } },
      { label: 'Film grain', val: S.grain ? 'On' : 'Off', toggle: () => { S.grain = !S.grain; } },
      { label: 'Fullscreen', val: document.fullscreenElement ? 'On' : 'Off', toggle: () => { if (document.fullscreenElement) document.exitFullscreen(); else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen(); } },
      { label: 'Back', back: true },
    ];
  },
  updateSettings() {
    const rows = this.settingRows();
    this.navList(rows.length, 'setSel', this);
    if (this.setHover >= 0 && Input.mouse.moved) this.setSel = this.setHover;
    const r = rows[this.setSel];
    const back = () => { Game.persistMeta(); Game.state_ = this.settingsBack || 'title'; };
    if (Input.hit('pause')) { back(); return; }
    if (Input.hit('left') && (r.left || r.toggle)) { (r.left || r.toggle)(); Sfx.play('choice'); }
    if (Input.hit('right') && (r.right || r.toggle)) { (r.right || r.toggle)(); Sfx.play('choice'); }
    if (Input.hit('confirm') || (Input.mouse.click && this.setHover >= 0)) {
      if (r.back) back(); else if (r.toggle) r.toggle(); else if (r.right) r.right();
      Sfx.play('choice');
    }
    Sfx.setVolumes({ master: Game.settings.master, music: Game.settings.music, sfx: Game.settings.sfx });
  },
  drawSettings(g) {
    if (this.settingsBack === 'title') g.drawImage(Art.get('title'), 0, 0, UIW, UIH);
    g.fillStyle = 'rgba(0,0,0,0.7)'; g.fillRect(0, 0, UIW, UIH);
    this.text(g, 'Settings', UIW / 2, 160, 64, '#f0e6d0', 'center', FONT, '700');
    const rows = this.settingRows();
    this.setHover = -1;
    rows.forEach((r, i) => {
      const x = UIW / 2 - 500, y = 220 + i * 66, w = 1000, h = 56;
      const over = Input.mouse.x > x && Input.mouse.x < x + w && Input.mouse.y > y && Input.mouse.y < y + h;
      if (over) this.setHover = i;
      const s = this.setSel === i;
      g.fillStyle = s ? 'rgba(120,32,24,0.9)' : 'rgba(16,12,10,0.8)'; g.fillRect(x, y, w, h);
      this.text(g, r.label, x + 30, y + 38, 30, '#f0e6d0', 'left', FONT, '600');
      if (r.val !== undefined) this.text(g, `◂  ${r.val}  ▸`, x + w - 30, y + 38, 28, '#e0c070', 'right', FONT_UI, '600');
    });
    this.text(g, '← → change · Enter select · Esc back', UIW / 2, 1010, 24, '#a89878', 'center', FONT_UI);
  },

  // ---------------------------------------------------------------- keypad
  updateKeypad(dt) {
    const K = Game.keypad; K.t += dt;
    const d = Input.digit();
    if (d !== null && K.entry.length < (K.o.code || '').length) { K.entry += d; Sfx.play('click'); }
    if (Input.pressed.has('Backspace')) K.entry = K.entry.slice(0, -1);
    if (this.kpHover !== undefined && this.kpHover !== null && Input.mouse.click) {
      const k = this.kpHover;
      if (k === 'C') K.entry = ''; else if (k === 'OK') this.submitKeypad(); else if (K.entry.length < K.o.code.length) K.entry += k;
      Sfx.play('click');
    }
    if (Input.pressed.has('Enter') || (K.entry.length === K.o.code.length && !K.checked)) { this.submitKeypad(); }
    if (K.entry.length < K.o.code.length) K.checked = false;
    if (Input.hit('pause') || Input.pressed.has('KeyE') && K.t > 0.3) { Game.state_ = 'play'; }
  },
  submitKeypad() {
    const K = Game.keypad, o = K.o;
    K.checked = true;
    if (K.entry === o.code) {
      Sfx.play('unlock');
      o.solved = true;
      const W = Game.world;
      if (o.opens) for (const d of W.objects) if (d.type === 'door' && d.id === o.opens) { d.locked = null; d.setOpen(W, true); }
      if (o.gives) (Array.isArray(o.gives) ? o.gives : [o.gives]).forEach((id) => Game.give(id));
      if (o.docGive) Game.addDoc(o.docGive, true);
      if (o.flag) Game.flags[o.flag] = true;
      Game.state_ = 'play';
      Game.toast(o.safe ? 'The safe clicks open.' : 'The lock releases.', 2.5);
      if (o.scene) W.runScene(o.scene, o);
    } else {
      Sfx.play('locked'); K.msg = 'Wrong combination'; K.entry = '';
      Game.world.level.noise(o.x, o.y - 10, 30, 'keypad', 'noise');
    }
  },
  drawKeypad(g) {
    const K = Game.keypad, o = K.o;
    g.fillStyle = 'rgba(0,0,0,0.65)'; g.fillRect(0, 0, UIW, UIH);
    const x = UIW / 2 - 260, y = 180, w = 520, h = 720;
    g.fillStyle = o.safe ? '#3a3a42' : '#2a2a2a'; g.fillRect(x, y, w, h);
    g.strokeStyle = '#8a8a90'; g.lineWidth = 4; g.strokeRect(x + 8, y + 8, w - 16, h - 16);
    this.text(g, o.safe ? 'SAFE' : 'COMBINATION LOCK', UIW / 2, y + 60, 30, '#d8d8d0', 'center', FONT_TYPE, '700');
    g.fillStyle = '#1a2a1a'; g.fillRect(x + 60, y + 90, w - 120, 90);
    const disp = K.entry.padEnd(o.code.length, '_').split('').join(' ');
    this.text(g, disp, UIW / 2, y + 152, 56, '#60e080', 'center', FONT_TYPE, '700');
    if (K.msg) this.text(g, K.msg, UIW / 2, y + 215, 24, '#e06050', 'center', FONT_UI, '600');
    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', 'OK'];
    this.kpHover = null;
    keys.forEach((k, i) => {
      const kx = x + 70 + (i % 3) * 130, ky = y + 250 + Math.floor(i / 3) * 105;
      const over = Input.mouse.x > kx && Input.mouse.x < kx + 110 && Input.mouse.y > ky && Input.mouse.y < ky + 85;
      if (over) this.kpHover = k;
      g.fillStyle = over ? '#6a6a60' : '#4a4a44'; g.fillRect(kx, ky, 110, 85);
      g.strokeStyle = '#1a1a1a'; g.strokeRect(kx, ky, 110, 85);
      this.text(g, k, kx + 55, ky + 56, 38, '#f0f0e8', 'center', FONT_TYPE, '700');
    });
    this.text(g, o.hint || 'Type digits · Backspace · Esc to leave', UIW / 2, y + h + 50, 24, '#c8b898', 'center', FONT_UI, 'italic');
  },

  // ---------------------------------------------------------------- death / fail
  drawDeath(g) {
    const D = Game.deathInfo;
    const a = Math.min(1, D.t * 0.9);
    g.fillStyle = `rgba(40,4,4,${a * 0.55})`; g.fillRect(0, 0, UIW, UIH);
    g.fillStyle = `rgba(0,0,0,${a * 0.5})`; g.fillRect(0, 380, UIW, 400);
    g.globalAlpha = a;
    const titles = { shot: 'Shot', dog: 'Mauled', fall: 'Fallen', fire: 'Burned', found: 'Found', captured: 'Captured', tunnel: 'Struck by the tunnel', follower: 'They killed your companion', fail: 'Mission failed', script: 'Dead' };
    const reason = D.reason;
    const title = titles[reason] || (typeof reason === 'string' && reason.length > 12 ? 'Dead' : 'Dead');
    this.text(g, title.toUpperCase(), UIW / 2, 480, 96, '#e8d0c0', 'center', FONT, '700');
    let sub = '';
    if (reason === 'fail') sub = D.text;
    else if (reason === 'captured') sub = `${Game.world && Game.world.def.faction === 'ccp' ? 'The Eighth Route sentries march you off as a spy' : 'The guards drag you away to a cell'}. Nobody will find Ming now.`;
    else if (reason === 'follower') sub = 'Without them, there is no reason to go on.';
    else if (Story.deathText[reason]) sub = Story.deathText[reason];
    else if (typeof reason === 'string' && reason.length > 12) sub = reason;
    if (sub) { g.font = `italic 32px ${FONT}`; U.wrap(g, sub, 1300).forEach((l, i) => this.text(g, l, UIW / 2, 550 + i * 42, 32, '#d8b8a8', 'center', FONT, 'italic')); }
    this.text(g, `“${D.quote.q}”`, UIW / 2, 680, 28, '#b8a898', 'center', FONT, 'italic');
    this.text(g, `— ${D.quote.a}`, UIW / 2, 720, 22, '#8a7a6a', 'center', FONT);
    this.text(g, 'Tip: ' + D.tip, UIW / 2, 850, 24, '#c8a060', 'center', FONT_UI);
    if (D.t > 1) this.text(g, '[Enter] Retry from checkpoint    ·    [Esc] Title', UIW / 2, 940, 30, '#f0e6d0', 'center', FONT_UI, '600');
    g.globalAlpha = 1;
  },

  // ---------------------------------------------------------------- chapter summary
  rank(s) {
    if (!s.alerts && !s.kills && !s.kos && !s.bodies && !s.spotted) return ['Ghost of Jinling', 'Unseen. Untouched. Like smoke on the river.'];
    if (!s.alerts && !s.kills) return ['Lantern in the Fog', 'Never raised the alarm, and no blood on your hands.'];
    if (!s.alerts) return ['Silent Blade', 'They never saw you coming.'];
    if (s.kills > 8) return ['Tiger of the Yangtze', 'You fought your way through.'];
    if (s.alerts <= 2) return ['Survivor', 'A few close calls — but you made it.'];
    return ['Storm Swallow', 'Loud, reckless, alive.'];
  },
  drawSummary(g) {
    const S = Game.summary;
    g.drawImage(Art.get(S.ch.art || 'black'), 0, 0, UIW, UIH);
    g.fillStyle = 'rgba(0,0,0,0.7)'; g.fillRect(0, 0, UIW, UIH);
    const a = Math.min(1, S.t * 1.5); g.globalAlpha = a;
    this.text(g, `${S.ch.kicker} Complete`, UIW / 2, 170, 34, '#c8a060', 'center', FONT_UI, '600');
    this.text(g, S.ch.name, UIW / 2, 250, 72, '#f0e6d0', 'center', FONT, '700');
    const s = S.stats;
    const [rk, rd] = this.rank(s);
    this.panel(g, UIW / 2 - 520, 310, 1040, 560);
    const rows = [['Time', U.fmtTime(s.time || 0)], ['Times spotted', s.spotted || 0], ['Alerts raised', s.alerts || 0], ['Bodies discovered', s.bodies || 0], ['Kills', s.kills || 0], ['Knockouts', s.kos || 0], ['Shots fired', s.shots || 0], ['Memories found', `${Game.photos.length} / ${Story.photoCount}`]];
    rows.forEach(([k, v], i) => { this.text(g, k, UIW / 2 - 440, 380 + i * 50, 30, '#d8ccb0', 'left', FONT); this.text(g, String(v), UIW / 2 + 440, 380 + i * 50, 30, '#f4ead8', 'right', FONT_UI, '700'); });
    this.text(g, rk, UIW / 2, 800, 44, '#f0c060', 'center', FONT, '700');
    this.text(g, rd, UIW / 2, 840, 24, '#c8b898', 'center', FONT, 'italic');
    if (S.t > 1) this.text(g, '[Enter] Continue — progress saved', UIW / 2, 960, 28, '#f0e6d0', 'center', FONT_UI, '600');
    g.globalAlpha = 1;
    if (!s.alerts && !S.achChecked) { S.achChecked = true; Game.unlock('ghost'); if (!s.kills && !s.kos) Game.unlock('pacifist_ghost'); }
  },

  // ---------------------------------------------------------------- credits
  drawCredits(g) {
    g.drawImage(Art.get('river_dawn'), 0, 0, UIW, UIH);
    g.fillStyle = 'rgba(0,0,0,0.72)'; g.fillRect(0, 0, UIW, UIH);
    const y0 = UIH - Game.creditsT * 55;
    let y = y0;
    for (const l of Story.credits) {
      const [size, col, st] = l.h ? [54, '#f0c060', '700'] : l.s ? [30, '#c8a060', 'italic'] : [28, '#e8dcc0', ''];
      g.font = `${st} ${size}px ${FONT}`;
      const lines = U.wrap(g, l.t, 1300);
      for (const ln of lines) { if (y > -60 && y < UIH + 60) this.text(g, ln, UIW / 2, y, size, col, 'center', FONT, st); y += size * 1.35; }
      y += l.h ? 30 : 12;
    }
    if (y < 0) Game.creditsT = 0;
    this.text(g, '[Esc] Title', UIW - 40, 1050, 22, '#a89878', 'right', FONT_UI);
  },

  // ---------------------------------------------------------------- journal
  journal: {
    tabs: ['Objective', 'Items', 'Documents', 'Memories', 'People', 'Record'],
    tab: 0, sel: 0, reading: null,
    open() { this.tab = 0; this.sel = 0; this.reading = null; Sfx.play('doc'); },
    list() {
      switch (this.tabs[this.tab]) {
        case 'Items': return Object.keys(Game.items).filter((k) => Game.items[k] > 0).map((k) => ({ id: k, label: (Story.items[k] ? Story.items[k].name : k) + (Game.items[k] > 1 ? ` ×${Game.items[k]}` : ''), desc: Story.items[k] ? Story.items[k].desc : '' }));
        case 'Documents': return Game.docs.map((d) => ({ id: d, label: Story.docs[d] ? Story.docs[d].title : d, doc: true }));
        case 'Memories': return Object.keys(Story.photos).map((p) => ({ id: p, label: Game.photos.includes(p) ? Story.photos[p].title : '— not yet found —', locked: !Game.photos.includes(p), photo: true }));
        case 'People': return Story.people.filter((p) => !p.cond || Game.cond(p.cond)).map((p) => ({ id: p.id, label: p.name, person: p }));
        default: return [];
      }
    },
    update() {
      if (this.reading) { if (Input.hit('confirm') || Input.hit('pause') || Input.mouse.click) this.reading = null; return; }
      if (Input.hit('journal') || Input.hit('pause')) { Game.state_ = 'play'; return; }
      if (Input.hit('right')) { this.tab = (this.tab + 1) % this.tabs.length; this.sel = 0; Sfx.play('choice'); }
      if (Input.hit('left')) { this.tab = (this.tab - 1 + this.tabs.length) % this.tabs.length; this.sel = 0; Sfx.play('choice'); }
      if (Input.mouse.click && this.tabHover >= 0) { this.tab = this.tabHover; this.sel = 0; }
      const L = this.list();
      if (L.length) {
        if (Input.hit('down')) { this.sel = (this.sel + 1) % L.length; Sfx.play('choice'); }
        if (Input.hit('up')) { this.sel = (this.sel - 1 + L.length) % L.length; Sfx.play('choice'); }
        if (Input.mouse.click && this.itemHover >= 0) this.sel = this.itemHover;
        const it = L[this.sel];
        if (Input.pressed.has('Enter') || Input.pressed.has('KeyE') || (Input.mouse.click && this.itemHover >= 0)) {
          if (it && it.doc) this.reading = { doc: it.id };
          if (it && it.photo && !it.locked) this.reading = { photo: it.id };
        }
      }
    },
    draw(g) {
      g.fillStyle = 'rgba(8,6,5,0.9)'; g.fillRect(0, 0, UIW, UIH);
      // tabs
      this.tabHover = -1;
      this.tabs.forEach((t, i) => {
        const x = 120 + i * 280, y = 40, w = 260, h = 64;
        const over = Input.mouse.x > x && Input.mouse.x < x + w && Input.mouse.y > y && Input.mouse.y < y + h;
        if (over) this.tabHover = i;
        g.fillStyle = i === this.tab ? '#6a1a14' : 'rgba(30,22,18,0.9)'; g.fillRect(x, y, w, h);
        g.strokeStyle = i === this.tab ? '#f0c060' : '#5a4830'; g.lineWidth = 2; g.strokeRect(x + 3, y + 3, w - 6, h - 6);
        UI.text(g, t, x + w / 2, y + 43, 30, '#f0e6d0', 'center', FONT, '600');
      });
      UI.text(g, '← → tabs · ↑ ↓ select · Enter read · Tab close', UIW / 2, 1050, 22, '#8a7a68', 'center', FONT_UI);
      const tab = this.tabs[this.tab];
      if (tab === 'Objective') this.drawObjective(g);
      else if (tab === 'Record') this.drawRecord(g);
      else this.drawList(g);
      if (this.reading) {
        g.fillStyle = 'rgba(0,0,0,0.75)'; g.fillRect(0, 0, UIW, UIH);
        if (this.reading.doc) { const d = Story.docs[this.reading.doc]; Game.drawPaper(g, d.title, d.text, d.style); }
        if (this.reading.photo) Game.drawPhoto(g, Story.photos[this.reading.photo], UIW / 2, 470, Game.time);
      }
    },
    drawObjective(g) {
      const ch = Story.chapters[Game.chapter];
      UI.panel(g, 120, 140, 1680, 860);
      UI.text(g, ch.kicker, 180, 220, 30, '#c8a060', 'left', FONT_UI, '600');
      UI.text(g, ch.name, 180, 290, 64, '#f0e6d0', 'left', FONT, '700');
      UI.text(g, ch.place, 180, 340, 28, '#a89878', 'left', FONT, 'italic');
      UI.text(g, 'Current objective', 180, 440, 26, '#c8a060', 'left', FONT_UI, '600');
      g.font = `36px ${FONT}`;
      U.wrap(g, Game.objective || '—', 1500).forEach((l, i) => UI.text(g, l, 180, 495 + i * 46, 36, '#f4ead8', 'left', FONT));
      if (ch.summary) { g.font = `italic 28px ${FONT}`; U.wrap(g, ch.summary, 1500).forEach((l, i) => UI.text(g, l, 180, 640 + i * 40, 28, '#c8b898', 'left', FONT, 'italic')); }
      UI.text(g, 'Brother Su Ming — last seen: ' + (Game.flags.mingLead || 'Nanjing, December 1939'), 180, 930, 26, '#e0b070', 'left', FONT_UI, '600');
    },
    drawList(g) {
      const L = this.list();
      UI.panel(g, 120, 140, 700, 860);
      this.itemHover = -1;
      if (!L.length) UI.text(g, 'Nothing yet.', 470, 300, 30, '#8a7a68', 'center', FONT, 'italic');
      const start = Math.max(0, this.sel - 13);
      L.slice(start, start + 15).forEach((it, k) => {
        const i = start + k;
        const x = 150, y = 170 + k * 54, w = 640, h = 48;
        const over = Input.mouse.x > x && Input.mouse.x < x + w && Input.mouse.y > y && Input.mouse.y < y + h;
        if (over) this.itemHover = i;
        if (i === this.sel) { g.fillStyle = 'rgba(120,32,24,0.85)'; g.fillRect(x, y, w, h); }
        g.font = `28px ${FONT}`;
        const lbl = U.wrap(g, it.label, 600)[0];
        UI.text(g, lbl, x + 20, y + 34, 28, it.locked ? '#6a6058' : '#f0e6d0', 'left', FONT);
      });
      const it = L[this.sel];
      UI.panel(g, 860, 140, 940, 860);
      if (!it) return;
      if (it.person) {
        const p = it.person;
        Portraits.draw(g, p.portrait || p.id, 'neutral', 900, 180, 320, 400);
        UI.text(g, p.name, 1260, 230, 44, '#f0e6d0', 'left', FONT, '700');
        UI.text(g, p.role, 1260, 280, 24, '#c8a060', 'left', FONT_UI, 'italic');
        if (p.aff) { const v = Game.aff[p.aff] || 0; UI.text(g, 'Bond: ' + '♥'.repeat(U.clamp(v, 0, 8)) + '♡'.repeat(Math.max(0, 5 - U.clamp(v, 0, 5))), 1260, 340, 30, '#e06070', 'left', FONT_UI); }
        g.font = `26px ${FONT}`;
        U.wrap(g, p.bio, 860).forEach((l, i) => UI.text(g, l, 900, 640 + i * 36, 26, '#e0d4bc', 'left', FONT));
      } else if (it.photo) {
        if (!it.locked) { const P = Story.photos[it.id]; const art = Art.get(P.art || 'memory'); g.drawImage(art, 920, 180, 820, 460); g.globalCompositeOperation = 'color'; g.fillStyle = 'rgba(140,100,50,0.7)'; g.fillRect(920, 180, 820, 460); g.globalCompositeOperation = 'source-over'; g.font = `italic 28px ${FONT}`; U.wrap(g, P.text, 820).forEach((l, i) => UI.text(g, l, 920, 700 + i * 38, 28, '#e0d4bc', 'left', FONT, 'italic')); }
        else UI.text(g, 'A memory still waiting somewhere in the war.', 1330, 500, 30, '#7a6a58', 'center', FONT, 'italic');
      } else if (it.doc) {
        const d = Story.docs[it.id];
        UI.text(g, d.title, 900, 210, 36, '#f0e6d0', 'left', FONT, '700');
        g.font = `26px ${FONT}`;
        U.wrap(g, d.text, 860).slice(0, 20).forEach((l, i) => UI.text(g, l, 900, 270 + i * 36, 26, '#d8ccb0', 'left', FONT));
        UI.text(g, '[Enter] read in full', 1330, 970, 22, '#a89878', 'center', FONT_UI);
      } else {
        UI.text(g, it.label, 900, 220, 38, '#f0e6d0', 'left', FONT, '700');
        g.font = `28px ${FONT}`;
        U.wrap(g, it.desc || '', 860).forEach((l, i) => UI.text(g, l, 900, 290 + i * 40, 28, '#d8ccb0', 'left', FONT));
      }
    },
    drawRecord(g) {
      UI.panel(g, 120, 140, 1680, 860);
      const s = Game.state;
      const rows = [['Chapter', `${Game.chapter + 1} / ${Story.chapters.length}`], ['Kills', s.kills], ['Knockouts', s.kos], ['Alerts raised (completed chapters)', s.alerts], ['Deaths', s.deaths], ['Memories', `${Game.photos.length} / ${Story.photoCount}`], ['Documents', Game.docs.length], ['Romance', Game.flags.romance ? Story.names[Game.flags.romance] : '—']];
      rows.forEach(([k, v], i) => { UI.text(g, k, 200, 240 + i * 56, 30, '#d8ccb0', 'left', FONT); UI.text(g, String(v), 900, 240 + i * 56, 30, '#f4ead8', 'right', FONT_UI, '700'); });
      UI.text(g, 'Choices that shaped the road', 1000, 240, 30, '#c8a060', 'left', FONT_UI, '600');
      Game.choices.slice(-14).forEach((c, i) => { g.font = `22px ${FONT}`; const t = U.wrap(g, `Ch.${c.ch}: ${c.a}`, 740)[0]; UI.text(g, t, 1000, 290 + i * 42, 22, '#e0d4bc', 'left', FONT); });
    },
  },
};
