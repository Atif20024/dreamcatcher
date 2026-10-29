// ReadingPanel (feedback 3, "text written in notes and stuff is not very
// readable"): every document Jo reads in the world (a letter, a note, a
// contract, a notebook, a newspaper, a list) opens here, not as small text
// in the world or on a tilted card.
//
//   await readDocument(scene, { title: "Isak's letter", text: 'Dear…\n\n…', ink: 0x1f3a5f })
//
// - Paper (cream, the §9 frame's brass line) under a dim; the ink is dark,
//   at 7:1 or better against the paper.
// - Body type at ×2 (cap 18, the dialogue size), the title at ×2 in the
//   accent's dark ink; never rotated, never bobbing.
// - Wrapped to the page and paged when long: [E]/[Space]/[→] next,
//   [←] back, [Esc] closes. A footer says where you are ("2 / 3").
// - A ModalManager modal ('card' priority): keys go to it alone and the
//   world is frozen under it.
import { uiText, contrast, CAP } from './text.js';
import { drawPanel, dim } from './Panel.js';
import ModalManager from './ModalManager.js';
import { READING, wrapWords, paginate } from './readingLayout.js';

export { READING, wrapWords, paginate };

export class ReadingPanel {
  constructor(scene) {
    this.scene = scene;
    this.isOpen = false;
    this.handle = null;
    this.page = 0;
    this.pages = [];
  }

  open({ title = '', text = '', pages = null, freeze = 'world', ink = READING.ink, paper = READING.paper, onClose = null, name = 'read' } = {}) {
    const s = this.scene;
    if (this.isOpen) this.close('reopened');
    this.title = title;
    this.ink = contrast(ink, paper) >= READING.minContrast ? ink : READING.ink;
    this.paper = paper;
    this.onClose = onClose;
    this.isOpen = true;
    this.page = 0;
    // lay the text out: measure with one throwaway text in the same font
    const W = READING.width;
    const probe = uiText(s, 0, 0, '', { size: 'body', scale: READING.scale, screen: true }).setScrollFactor(0).setVisible(false);
    const measure = (str) => {
      probe.setText(str);
      return probe.width;
    };
    // `pages`: the document's own pages (a notebook), each wrapped and,
    // if it is still too long, paged again
    const docs = pages && pages.length ? pages : [text];
    const wrapped = docs.map((t) => wrapWords(t, measure, W - READING.padX * 2));
    this.lines = wrapped.flat();
    probe.setText('Ag');
    this.lineH = Math.ceil(probe.height) + READING.lineGap;
    probe.destroy();
    const titleH = title ? CAP.body * READING.scale + 26 : 0;
    const per = Math.max(3, Math.floor((READING.maxHeight - READING.padY * 2 - titleH - 30) / this.lineH));
    this.pages = wrapped.flatMap((ls) => paginate(ls, per));
    this.per = per;
    const h = ModalManager.for(s).open({
      kind: 'card',
      name: `read:${name}`,
      freeze, // ('none' when the host has already frozen its world)
      guardMs: 250,
      onKey: (e) => this._key(e),
      onClose: () => {
        if (this.handle === h) {
          this.handle = null;
          this._finish();
        }
      },
    });
    this.handle = h;
    this._draw();
    ReadingPanel.last = this;
    return new Promise((resolve) => {
      this._resolve = resolve;
    });
  }

  _key(e) {
    const c = e.code;
    if (c === 'Escape') return this.close('esc');
    if (c === 'ArrowLeft' || c === 'KeyA') {
      if (this.page > 0) {
        this.page -= 1;
        this._draw();
      }
      return;
    }
    if (['KeyE', 'KeyX', 'Space', 'Enter', 'ArrowRight', 'KeyD'].includes(c)) this.next();
  }

  next() {
    if (this.page < this.pages.length - 1) {
      this.page += 1;
      this._draw();
    } else this.close('done');
  }

  close(reason = 'closed') {
    if (!this.isOpen) return;
    const h = this.handle;
    this.handle = null;
    if (h) h.close(reason);
    this._finish(reason);
  }

  _finish(reason = 'closed') {
    if (!this.isOpen) return;
    this.isOpen = false;
    this._clear();
    const fn = this.onClose;
    this.onClose = null;
    if (fn) fn(reason);
    const r = this._resolve;
    this._resolve = null;
    if (r) r(reason);
  }

  _clear() {
    (this.objs || []).forEach((o) => o && o.scene && o.destroy());
    this.objs = [];
  }

  _draw() {
    const s = this.scene;
    this._clear();
    const cam = s.cameras.main;
    const W = READING.width;
    const add = (o) => {
      this.objs.push(o);
      if (this.handle) this.handle.add(o);
      return o;
    };
    const lines = this.pages[this.page] || [''];
    const titleH = this.title ? CAP.body * READING.scale + 26 : 0;
    const bodyH = Math.max(lines.length, 3) * this.lineH;
    const H = Math.min(READING.maxHeight + 40, READING.padY * 2 + titleH + bodyH + 30);
    const x0 = Math.round(cam.width / 2 - W / 2);
    const y0 = Math.round(cam.height / 2 - H / 2);
    const depth = 300;
    add(dim(s, 0.7, depth));
    const g = add(s.add.graphics().setScrollFactor(0).setDepth(depth + 1));
    drawPanel(g, x0, y0, W, H, { fill: this.paper, alpha: 1 });
    g.panelRect = { x: x0, y: y0, w: W, h: H };
    g.isDCPanel = true;
    g.isReadingPaper = true;
    let y = y0 + READING.padY;
    const text = (str, x, yy, opts) => add(uiText(s, x, yy, str, { size: 'body', scale: READING.scale, screen: true, backing: this.paper, ...opts }).setScrollFactor(0).setDepth(depth + 2));
    if (this.title) {
      const t = text(this.title, cam.width / 2, y, { color: this.ink, align: 'center' }).setOrigin(0.5, 0);
      t.isReadingTitle = true;
      y += CAP.body * READING.scale + 12;
      const rule = add(s.add.rectangle(cam.width / 2, y, Math.min(W - 120, Math.max(120, t.width + 40)), 2, this.ink, 0.5).setScrollFactor(0).setDepth(depth + 2));
      rule.isReadingRule = true;
      y += 14;
    }
    this.bodyText = text(lines.join('\n'), x0 + READING.padX, y, { color: this.ink, lineSpacing: READING.lineGap });
    this.bodyText.isReadingBody = true;
    const n = this.pages.length;
    const more = this.page < n - 1;
    const foot = `${n > 1 ? `${this.page + 1} / ${n}     ` : ''}${more ? '[E] next' : '[E] done'}${this.page > 0 ? '   [←] back' : ''}   [Esc] close`;
    const f = add(uiText(s, x0 + W - 18, y0 + H - 12, foot, { size: 'small', screen: true, color: this.ink, backing: this.paper }).setOrigin(1, 1).setScrollFactor(0).setDepth(depth + 2));
    f.isReadingFoot = true;
  }

  // for scenarios: what is on the page, at what size, at what contrast
  state() {
    const b = this.bodyText && this.bodyText.scene ? this.bodyText : null;
    const cam = this.scene.cameras.main;
    return {
      open: this.isOpen,
      title: this.title,
      page: this.page,
      pages: this.pages.length,
      lines: (this.pages[this.page] || []).length,
      text: (this.pages[this.page] || []).join('\n'),
      cap: b ? CAP[b.dc.size] * (b.dc.scale || READING.scale) : 0,
      contrast: +contrast(this.ink, this.paper).toFixed(2),
      angle: b ? b.angle : 0,
      fits: b ? b.y + b.height <= cam.height - 10 && b.x + b.width <= cam.width - 10 : false,
    };
  }
}

ReadingPanel.last = null;

// one panel per scene
export function readerFor(scene) {
  if (!scene.reader || scene.reader.scene !== scene) scene.reader = new ReadingPanel(scene);
  return scene.reader;
}

// open a document; resolves when it is closed
export function readDocument(scene, doc) {
  return readerFor(scene).open(doc);
}
