// CaptionBar (plan 2.6, critique F5.5): the slim channel for barks, radio
// and passers-by. Never stops play, never takes input: a queued line at the
// bottom centre with a small portrait chip and the speaker's name, shown
// for a time that grows with its length, then the next. Screen space on
// UIScene (depth ≥ 100 is adopted by src/ui/ui.js).
import { uiText } from '../ui/text.js';
import { drawPanel } from '../ui/Panel.js';
import { resolveArt } from '../art/baked.js';

const DEPTH = 150;

export class CaptionBar {
  constructor(scene, { cast = {} } = {}) {
    this.scene = scene;
    this.cast = cast;
    this.queue = [];
    this.cur = null;
    this.log = [];
    const cam = scene.cameras.main;
    this.cx = cam.width / 2;
    this.y = cam.height - 64;
    this.bg = scene.add.graphics().setScrollFactor(0).setDepth(DEPTH);
    this.chip = scene.add.image(0, 0, '__WHITE').setScrollFactor(0).setDepth(DEPTH + 1).setVisible(false);
    this.name = uiText(scene, 0, 0, '', { size: 'small', color: 'accent' }).setScrollFactor(0).setDepth(DEPTH + 1);
    this.text = uiText(scene, 0, 0, '', { size: 'body', color: 'ink', wrap: 560 }).setScrollFactor(0).setDepth(DEPTH + 1);
    this.objs = [this.bg, this.chip, this.name, this.text];
    this.setAlpha(0);
    scene.events.once('shutdown', () => this.objs.forEach((o) => o.destroy()));
  }

  setAlpha(a) {
    this.alpha = a;
    this.objs.forEach((o) => o.setAlpha(a));
  }

  // say('wren', 'Mind the lamps.') — never blocks
  say(who, text, opts = {}) {
    const line = { who, text: String(text), ms: opts.ms || Math.min(6000, 1600 + text.length * 48), portrait: opts.portrait };
    this.queue.push(line);
    this.log.push(line);
    return line;
  }

  clear() {
    this.queue = [];
    this.cur = null;
    this.setAlpha(0);
  }

  get showing() {
    return !!this.cur;
  }

  layout(line) {
    const c = this.cast[line.who] || { name: String(line.who || '').toUpperCase() };
    this.name.setText(c.name || '');
    this.text.setText(line.text);
    const ref = line.portrait || c.portrait;
    const art = ref ? resolveArt(this.scene, ref) : null;
    const chipW = art ? 52 : 0;
    const w = Math.max(220, Math.min(680, Math.max(this.text.width, this.name.width) + 40 + chipW));
    const h = Math.max(54, this.text.height + this.name.height + 26);
    const x0 = Math.round(this.cx - w / 2);
    const y0 = Math.round(this.y - h / 2);
    this.bg.clear();
    drawPanel(this.bg, x0, y0, w, h, { alpha: 0.88 });
    if (art) {
      this.chip.setTexture(art[0], art[1]).setVisible(true);
      const s = 40 / Math.max(this.chip.frame.realWidth, this.chip.frame.realHeight);
      this.chip.setScale(s).setPosition(x0 + 30, y0 + h / 2);
    } else this.chip.setVisible(false);
    this.name.setPosition(x0 + 16 + chipW, y0 + 9);
    this.text.setPosition(x0 + 16 + chipW, y0 + 9 + this.name.height + 4);
  }

  update(dt) {
    if (!this.cur && this.queue.length) {
      this.cur = this.queue.shift();
      this.cur.t = 0;
      this.layout(this.cur);
    }
    if (!this.cur) return;
    const c = this.cur;
    c.t += dt;
    const fade = 220;
    const a = c.t < fade ? c.t / fade : c.t > c.ms - fade ? Math.max(0, (c.ms - c.t) / fade) : 1;
    this.setAlpha(a);
    if (c.t >= c.ms) {
      this.cur = null;
      this.setAlpha(0);
    }
  }

  state() {
    return { showing: this.showing, who: this.cur && this.cur.who, text: this.cur && this.cur.text, queued: this.queue.length, said: this.log.length };
  }
}

export default CaptionBar;
