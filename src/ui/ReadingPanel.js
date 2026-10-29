// ReadingPanel (feedback 3, "text written in notes and stuff is not very
// readable"): every document Jo reads in the world (a letter, a note, a
// contract, a notebook, a newspaper, a list) opens here, not as small text
// in the world or on a tilted card.
//
//   await readDocument(scene, { title: "Isak's letter", text: 'Dear…\n\n…', ink: 0x1f3a5f })
//
// - Paper (cream, a brass line) under a dim; the ink is dark, at 7:1 or
//   better against the paper.
// - The page is the game's own font (the body face), painted onto a canvas
//   laid over the game at the screen's real pixels, at a whole-number
//   scale and without the baked outline. Drawn into the 960 × 540 canvas
//   and stretched to fill the browser, dark ink on cream with that outline
//   turned to blobs ("no human would be able to read notes like that"); a
//   book face read well but looked like another game.
// - Wrapped to the page and paged when long: [E]/[Space]/[→] next,
//   [←] back, [Esc] closes. A footer says where you are ("2 / 3").
// - A ModalManager modal ('card' priority): keys go to it alone and the
//   world is frozen under it.
import { contrast } from './text.js';
import { measure, paintGlyphs } from './BitmapFonts.js';
import { dim } from './Panel.js';
import ModalManager from './ModalManager.js';
import { READING, wrapWords, paginate } from './readingLayout.js';

export { READING, wrapWords, paginate };

const hex = (c) => `#${(c >>> 0).toString(16).padStart(6, '0').slice(-6)}`;
const BRASS = 0xc8a24a;
// widths in canvas px (the 960 × 540 game), at the page's scale
const widthOf = (str, size = 'body', scale = READING.scale) => measure(size, str, scale).width;

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
    // lay the text out in canvas px
    const W = READING.width;
    // `pages`: the document's own pages (a notebook), each wrapped and,
    // if it is still too long, paged again
    const docs = pages && pages.length ? pages : [text];
    const wrapped = docs.map((t) => wrapWords(t, (str) => widthOf(str), W - READING.padX * 2));
    this.lines = wrapped.flat();
    this.lineH = measure('body', 'Ag', READING.scale).height + READING.lineGap;
    const titleH = title ? this._titleH() : 0;
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
    if (this.layer) this.layer.remove();
    this.layer = null;
    this.bodyEl = null;
    if (this._unfit) this._unfit();
    this._unfit = null;
  }

  _titleH() {
    return measure('body', 'Ag', READING.scale).height + 26;
  }

  // the page's canvas: centred on the game, at the screen's own pixels.
  // `u` is screen px per game px, rounded so the body face lands on a
  // whole-number pixel scale (every glyph pixel the same size)
  _paint() {
    const r0 = this.rect;
    const game = this.scene.game.canvas;
    const L = this.layer;
    if (!L || !game || !r0) return;
    const box = game.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const cam = this.scene.cameras.main;
    const k = (box.width / cam.width) * dpr;
    const S = Math.max(READING.scale, Math.round(READING.scale * k)); // body glyph pixel, device px
    const u = S / READING.scale;
    const Wd = Math.round(r0.w * u);
    const Hd = Math.round(r0.h * u);
    L.width = Wd;
    L.height = Hd;
    L.style.width = `${Wd / dpr}px`;
    L.style.height = `${Hd / dpr}px`;
    L.style.left = `${Math.round(box.left + box.width / 2 - Wd / dpr / 2)}px`;
    L.style.top = `${Math.round(box.top + box.height / 2 - Hd / dpr / 2)}px`;
    const ctx = L.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    // the paper: a dark edge, the brass line, cream
    const e = Math.max(1, Math.round(u));
    ctx.fillStyle = '#2a2340';
    ctx.fillRect(0, 0, Wd, Hd);
    ctx.fillStyle = hex(BRASS);
    ctx.fillRect(e, e, Wd - 2 * e, Hd - 2 * e);
    ctx.fillStyle = hex(this.paper);
    ctx.fillRect(3 * e, 3 * e, Wd - 6 * e, Hd - 6 * e);
    const at = (v) => Math.round(v * u);
    let y = READING.padY;
    if (this.title) {
      paintGlyphs(ctx, this.title, at(r0.w / 2), at(y), { size: 'body', scale: S, color: this.ink, align: 'center' });
      y += measure('body', 'Ag', READING.scale).height + 12;
      const tw = Math.min(r0.w - 120, Math.max(120, widthOf(this.title) + 40));
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = hex(this.ink);
      ctx.fillRect(at(r0.w / 2 - tw / 2), at(y), at(tw), Math.max(1, at(2)));
      ctx.globalAlpha = 1;
      y += 14;
    }
    const lines = this.pages[this.page] || [''];
    lines.forEach((ln, i) => paintGlyphs(ctx, ln, at(READING.padX), at(y + i * this.lineH), { size: 'body', scale: S, color: this.ink }));
    const n = this.pages.length;
    const more = this.page < n - 1;
    const foot = `${n > 1 ? `${this.page + 1} / ${n}     ` : ''}${more ? '[E] next' : '[E] done'}${this.page > 0 ? '   [←] back' : ''}   [Esc] close`;
    const fs = Math.max(1, Math.round(u * 1.5));
    paintGlyphs(ctx, foot, at(r0.w - 18), at(r0.h - 12) - measure('small', 'A', fs).height, { size: 'small', scale: fs, color: this.ink, align: 'right' });
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
    const titleH = this.title ? this._titleH() : 0;
    const bodyH = Math.max(lines.length, 3) * this.lineH;
    const H = Math.min(READING.maxHeight + 40, READING.padY * 2 + titleH + bodyH + 30);
    const x0 = Math.round(cam.width / 2 - W / 2);
    const y0 = Math.round(cam.height / 2 - H / 2);
    add(dim(s, 0.7, 300));
    this.rect = { x: x0, y: y0, w: W, h: H };
    this.widest = Math.max(0, ...lines.map((l) => widthOf(l)));

    const L = document.createElement('canvas');
    L.className = 'dc-reading';
    L.style.cssText = 'position:fixed;pointer-events:none;z-index:10;image-rendering:pixelated';
    document.body.appendChild(L);
    this.layer = L;
    this.bodyEl = L;
    this._paint();
    const fit = () => this._paint();
    window.addEventListener('resize', fit);
    s.scale.on('resize', fit);
    const gone = () => this.close('scene');
    s.events.once('shutdown', gone);
    this._unfit = () => {
      window.removeEventListener('resize', fit);
      s.scale.off('resize', fit);
      s.events.off('shutdown', gone);
    };
  }

  // for scenarios: what is on the page, at what size, at what contrast
  state() {
    const r = this.rect;
    const cam = this.scene.cameras.main;
    return {
      open: this.isOpen,
      title: this.title,
      page: this.page,
      pages: this.pages.length,
      lines: (this.pages[this.page] || []).length,
      text: (this.pages[this.page] || []).join('\n'),
      cap: this.bodyEl ? 9 * READING.scale : 0,
      contrast: +contrast(this.ink, this.paper).toFixed(2),
      angle: 0,
      dom: !!(this.layer && this.layer.isConnected),
      fits: !!(this.bodyEl && r && this.widest <= r.w - READING.padX * 2 + 1 && r.y + r.h <= cam.height - 10),
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
