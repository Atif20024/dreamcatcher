// HudGrid (plan §2.11): the HUD drawn by UIScene in fixed slots.
//
//   top-left     hearts, then the level name and heart shards (small)
//   top-centre   the goal line (objective), 2 lines max
//   top-right    coins / wallet, and under it the dream's tool slot
//                (ink, chips, O2 …: up to 4 small lines; bars a dream draws
//                itself sit in TOOL_BARS)
//   bottom-left  contextual readout (the satchel)
//   bottom-right [Esc] pause · [M] music
//   anywhere     the interact prompt, pinned over its world position
//
// Everything is at zoom 1 on the UI camera, so nothing here scales with the
// world camera. Profiles: 'default', 'hub' (no hearts), 'none' (hidden).
import { hud, SLOTS, TOOL_BARS, fitToBudget } from './hud.js';
import { uiText, PLATE } from './text.js';

// HUD lines drawn on a quiet plate (no brass line)
const QUIET = new Set(['level', 'shards', 'tool', 'context', 'caption', 'footer']);
import { measure } from './BitmapFonts.js';
import { THEME, toColor } from './theme.js';

const DEPTH = 150;

export default class HudGrid {
  constructor(ui) {
    this.ui = ui;
    this.v = -1;
    this.hearts = [];
    this.texts = {};
    for (const key of ['level', 'shards', 'objective', 'coins', 'tool', 'context', 'caption', 'footer', 'prompt']) {
      const s = SLOTS[key];
      const t = uiText(ui, s.x || 0, s.y || 0, '', { size: s.font, color: s.color, align: s.align || 'left', scale: 2 }).setDepth(DEPTH);
      t.name = `hud-${key}`;
      if (s.align === 'center') t.setOrigin(0.5, 0);
      else if (s.align === 'right') t.setOrigin(1, 0);
      if (key === 'context' || key === 'footer' || key === 'caption') t.setOrigin(t.originX, 1);
      if (key === 'objective') t.setMaxWidth(s.maxW);
      // §8: every HUD line sits on the ink plate (it is drawn over art)
      t.setBackgroundColor(PLATE.dark);
      // feedback 3 (the game now fills the screen; the HUD read heavy): the
      // secondary lines keep their plate but lose the brass line, so only
      // the goal, the coins and the prompt are framed
      if (QUIET.has(key) && t._bg) t._bg.setStrokeStyle();
      this.texts[key] = t;
    }
    this.texts.prompt.setOrigin(0.5, 1);
    this.meterRows = new Map();
    this.coinIcon = ui.add.image(0, 0, '__WHITE').setVisible(false).setDepth(DEPTH).setOrigin(1, 0.5);
    this.coinIcon.name = 'hud-coin-icon';
    // the footer doubles as the music button
    this.texts.footer.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
      const o = hud.owner;
      if (o && o.toggleMusicFromHud) o.toggleMusicFromHud();
    });
  }

  measureLine(key) {
    const s = SLOTS[key];
    return (line) => measure(s.font || 'small', line, 2).width;
  }

  // all HUD objects (scenarios read their on-screen size)
  objects() {
    return [...this.hearts, ...Object.values(this.texts), this.coinIcon, ...[...this.meterRows.values()].map((r) => r.plate), ...this.regionZones()];
  }

  // regions claimed by widgets a dream draws itself (hud.region)
  regionZones() {
    this.zones = this.zones || new Map();
    const want = (hud.owner && hud.s.profile !== 'none' && hud.s.regions) || {};
    for (const [id, z] of this.zones) {
      if (!want[id]) {
        z.destroy();
        this.zones.delete(id);
      }
    }
    for (const [id, r] of Object.entries(want)) {
      let z = this.zones.get(id);
      if (!z) {
        z = this.ui.add.zone(0, 0, 1, 1).setOrigin(0, 0);
        z.name = `hud-region-${id}`;
        this.zones.set(id, z);
      }
      z.setPosition(r.x, r.y).setSize(r.w, r.h);
    }
    return [...this.zones.values()];
  }

  // the meter stack (§8): label + bar on one plate per row, right-aligned
  // under the tool lines (or the coins). Drawn every frame: fills move.
  updateMeters(show) {
    const list = show ? (hud.s.meters || []).filter((m) => m.visible) : [];
    const keep = new Set(list.map((m) => m.id));
    for (const [id, r] of this.meterRows) {
      if (!keep.has(id)) {
        r.plate.destroy();
        r.label.destroy();
        r.back.destroy();
        r.bar.destroy();
        this.meterRows.delete(id);
      }
    }
    if (!list.length) return;
    const tool = this.texts.tool;
    const coins = this.texts.coins;
    const above = tool.visible && tool._text ? tool : coins.visible ? coins : null;
    const ab = above && above._bg ? above._bg.getBounds() : null;
    let y = ab ? ab.bottom + 8 : SLOTS.coins.y - PLATE.padY;
    const B = TOOL_BARS;
    for (const m of list) {
      let r = this.meterRows.get(m.id);
      if (!r) {
        // (a quiet plate: no brass line, feedback 3)
        const plate = this.ui.add.rectangle(0, 0, 10, 10, PLATE.dark, PLATE.alpha).setOrigin(0, 0).setDepth(DEPTH - 0.01);
        plate.name = `hud-meter-${m.id}`;
        const label = uiText(this.ui, 0, 0, '', { size: 'small', scale: 2, align: 'right' }).setOrigin(1, 0).setDepth(DEPTH);
        label.name = `hud-meter-label-${m.id}`;
        const back = this.ui.add.rectangle(0, 0, B.w, B.h, 0x2a2a34).setOrigin(0, 0.5).setDepth(DEPTH);
        const bar = this.ui.add.rectangle(0, 0, B.w, B.h, 0xffffff).setOrigin(0, 0.5).setDepth(DEPTH + 0.01);
        r = { plate, label, back, bar };
        this.meterRows.set(m.id, r);
      }
      const h = 14 + PLATE.padY * 2;
      const cy = y + h / 2;
      if (r.label.rawText !== m.label) r.label.setText(m.label);
      r.label.setColor(m.color).setPosition(B.right - B.w - 8, y + PLATE.padY);
      r.back.setPosition(B.right - B.w, cy);
      r.bar.setPosition(B.right - B.w, cy).setFillStyle(toColor(m.color)).setSize(Math.round(B.w * m.frac), B.h);
      const x0 = B.right - B.w - 8 - (m.label ? r.label.width : -8) - PLATE.padX;
      r.plate.setPosition(Math.round(x0), Math.round(y)).setSize(Math.round(B.right + PLATE.padX - x0), h);
      r.plate.setDisplaySize(r.plate.width, r.plate.height);
      y += h + 8;
    }
  }

  update() {
    const s = hud.s;
    const owner = hud.owner;
    const show = !!owner && s.profile !== 'none';
    // the prompt follows its world point every frame
    // a modal (dialogue, card, panel) owns the bottom of the screen: the
    // footer, caption, satchel line and prompt step aside while one is up
    const modal = !!(owner && owner.modals && owner.modals.active);
    this.updatePrompt(owner, show && !modal);
    this.updateMeters(show);
    if (modal !== this.modalUp) {
      this.modalUp = modal;
      this.v = -1;
    }
    if (hud.v === this.v) return;
    this.v = hud.v;

    // hearts
    const h = s.hearts;
    const wantHearts = show && s.profile !== 'hub' && h ? Math.max(h.max, h.n) : 0;
    while (this.hearts.length < wantHearts) {
      const img = this.ui.add.image(0, 0, '__WHITE').setOrigin(0, 0).setDepth(DEPTH);
      img.name = 'hud-heart';
      this.hearts.push(img);
    }
    while (this.hearts.length > wantHearts) this.hearts.pop().destroy();
    this.hearts.forEach((img, i) => {
      const tex = h.texture && this.ui.textures.exists(h.texture) ? h.texture : 'heart';
      if (this.ui.textures.exists(tex) && img.texture.key !== tex) img.setTexture(tex);
      img.setPosition(SLOTS.hearts.x + i * 28, SLOTS.hearts.y).setAlpha(i < h.n ? 1 : 0.25);
    });

    const setLine = (key, value) => {
      const t = this.texts[key];
      const list = Array.isArray(value)
        ? value
            .filter(Boolean)
            .map((l) => (typeof l === 'string' ? { text: l } : l))
            .flatMap((l) => String(l.text).split('\n').map((text) => ({ text, color: l.color })))
        : null;
      let text = list ? list.map((l) => l.text).join('\n') : value || '';
      if (key !== 'objective' && key !== 'prompt') text = fitToBudget(key, text, this.measureLine(key));
      t.setText(show ? text : '');
      t.setVisible(show && !!text);
      // per-line colours (the tool slot): tint each line's characters
      if (list && t._text.length) t.setCharacterTint(0, -1, false, -1);
      if (list && list.some((l) => l.color)) {
        const drawn = t._text.split('\n');
        let at = 0;
        drawn.forEach((ln, i) => {
          const c = list[i] && list[i].color;
          if (c && ln.length) t.setCharacterTint(at, ln.length, false, toColor(c));
          at += ln.length; // BitmapText tint indices skip the newline
        });
      }
    };
    setLine('level', s.level);
    setLine('shards', s.shards);
    setLine('tool', s.tool);
    setLine('context', modal ? '' : s.context);
    // the controls caption is contextual: it reads for a while, then goes
    const cap = this.texts.caption;
    if (s.caption !== this.lastCaption) {
      this.lastCaption = s.caption;
      this.ui.tweens.killTweensOf(cap);
      cap.setAlpha(1);
      if (s.caption) this.ui.tweens.add({ targets: cap, alpha: 0, delay: 9000, duration: 1200 });
    }
    setLine('caption', modal ? '' : s.caption);
    setLine('footer', modal ? '' : s.footer);

    // the goal line wraps to two lines; a third is cut
    const obj = this.texts.objective;
    obj.setText(show ? s.objective || '' : '');
    obj.setVisible(show && !!s.objective);
    if (show && s.objective) {
      const lines = obj.getTextBounds(false).lines;
      if (lines && lines.lengths && lines.lengths.length > SLOTS.objective.lines) hud.overflows.push({ key: 'objective', text: s.objective });
    }
    // a new goal flashes three times
    if (show && s.objective && s.objective !== this.lastObjective) {
      this.ui.tweens.killTweensOf(obj);
      obj.setAlpha(1);
      this.ui.tweens.add({ targets: obj, alpha: 0.2, duration: 120, yoyo: true, repeat: 2 });
    }
    this.lastObjective = show ? s.objective : this.lastObjective;
    // §8: no two HUD rects within 8 px. A two-line goal reaches down past the
    // level line's row, so the level line (and the shards under it) drop
    const objLines = show && s.objective ? (obj.getTextBounds(false).lines.lengths || []).length : 0;
    const levelY = objLines > 1 ? 64 : SLOTS.level.y;
    this.texts.level.setY(levelY);
    this.texts.shards.setY(this.texts.level.visible ? levelY + 36 : levelY);

    // coins: icon + count, right-aligned; the tool slot sits under it
    const c = show ? s.coins : null;
    const coins = this.texts.coins;
    if (c) {
      coins.setText(c.text).setVisible(true);
      const tex = c.icon && this.ui.textures.exists(c.icon) ? c.icon : null;
      if (tex) this.coinIcon.setTexture(tex).setScale(0.8).setVisible(true).setPosition(SLOTS.coins.x - coins.width - PLATE.padX - 4, SLOTS.coins.y + 7);
      else this.coinIcon.setVisible(false);
    } else {
      coins.setVisible(false);
      this.coinIcon.setVisible(false);
    }
    this.texts.tool.setY(c ? SLOTS.tool.y : SLOTS.coins.y);
  }

  updatePrompt(owner, show) {
    const t = this.texts.prompt;
    const p = hud.s.prompt;
    if (!show || !p.visible || !owner || !owner.cameras) {
      if (t.visible) t.setVisible(false);
      return;
    }
    const cam = owner.cameras.main;
    const wv = cam.worldView;
    const x = Math.round((p.x - wv.x) * cam.zoom + cam.x);
    const y = Math.round((p.y - wv.y) * cam.zoom + cam.y) + 10;
    if (t.rawText !== p.text) t.setText(p.text);
    t.setPosition(x, y).setVisible(true);
  }
}

export { THEME };
