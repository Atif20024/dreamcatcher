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
import { hud, SLOTS, fitToBudget } from './hud.js';
import { uiText } from './text.js';
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
      this.texts[key] = t;
    }
    this.texts.prompt.setOrigin(0.5, 1).setBackgroundColor('#14101ce0').setPadding({ x: 6, y: 4 });
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
    return [...this.hearts, ...Object.values(this.texts), this.coinIcon];
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
          at += ln.length + 1;
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

    // coins: icon + count, right-aligned; the tool slot sits under it
    const c = show ? s.coins : null;
    const coins = this.texts.coins;
    if (c) {
      coins.setText(c.text).setVisible(true);
      const tex = c.icon && this.ui.textures.exists(c.icon) ? c.icon : null;
      if (tex) this.coinIcon.setTexture(tex).setScale(0.8).setVisible(true).setPosition(SLOTS.coins.x - coins.width - 6, SLOTS.coins.y + 7);
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
