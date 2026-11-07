// ReadingPanel (feedback 3, "text written in notes and stuff is not very
// readable"; feedback 4, "texts still unreadable in notes"): every document
// Jo reads in the world (a letter, a note, a contract, a notebook, a
// newspaper, a list) opens here, not as small text in the world or on a
// tilted card.
//
//   await readDocument(scene, { title: "Isak's letter", text: 'Dear…\n\n…', ink: 0x1f3a5f })
//
// - Paper (cream, a brass line) under a dim; the ink is dark, at 7:1 or
//   better against the paper (a document's own ink is kept only then).
// - The page is the game's own font (the body face), painted onto a canvas
//   laid over the game at the screen's real pixels, at a whole-number
//   scale and without the baked outline. The layout is chosen per screen
//   (src/ui/readingLayout.js#layoutFor): the cap is at least 14 CSS px on
//   a desktop window and 11 on a phone, lines run near 55 characters (40
//   on a small phone), the leading is 16 font px for a cap of 9.
// - The canvas lives beside the game's canvas (its parent), so it is seen
//   in fullscreen too ([F], or a phone's first tap): appended to <body> it
//   stayed outside the fullscreen element and the page vanished, leaving
//   only the dim.
// - Wrapped to the page and paged when long: [E]/[Space]/[→] next,
//   [←] back, [Esc] closes. A footer says where you are ("2 / 3"), and on
//   a touch screen says "tap".
// - A ModalManager modal ('card' priority): keys go to it alone and the
//   world is frozen under it.
import { contrast } from './text.js';
import { measure, paintGlyphs } from './BitmapFonts.js';
import { dim } from './Panel.js';
import ModalManager from './ModalManager.js';
import { touchState } from '../input/touchState.js';
import { READING, wrapWords, paginate, layoutFor, pageSize, placeOnDevice, footerText, pitch } from './readingLayout.js';

export { READING, wrapWords, paginate };

const hex = (c) => `#${(c >>> 0).toString(16).padStart(6, '0').slice(-6)}`;
const BRASS = 0xc8a24a;
// widths in font px (the body face at scale 1)
const widthOf = (str, size = 'body') => measure(size, str, 1).width;

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
    // `pages`: the document's own pages (a notebook), each wrapped and,
    // if it is still too long, paged again (per screen, in _layout)
    this.docs = pages && pages.length ? pages : [text];
    this.layoutKey = null;
    this._layout(this._screen());
    const h = ModalManager.for(s).open({
      kind: 'card',
      name: `read:${name}`,
      freeze, // ('none' when the host has already frozen its world)
      guardMs: 250,
      onKey: (e) => this._key(e),
      // a tap (touch screens): the left third turns back a page, anywhere
      // else the next page (or closes on the last)
      tap: (x) => (x < s.cameras.main.width / 3 && this.page > 0 ? this._key({ code: 'ArrowLeft' }) : this.next()),
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

  // the game canvas's CSS box and the device pixel ratio
  _screen() {
    const game = this.scene.game && this.scene.game.canvas;
    const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
    const b = game && game.getBoundingClientRect ? game.getBoundingClientRect() : null;
    const box = b && b.width ? { left: b.left, top: b.top, width: b.width, height: b.height } : { left: 0, top: 0, width: READING.gameW, height: READING.gameW * 0.5625 };
    return { box, dpr };
  }

  // wrap and page the document for this screen's layout; keeps the reader
  // on the page holding the line they were reading
  _layout({ box, dpr }) {
    const L = layoutFor({ cssW: box.width, cssH: box.height, dpr });
    const key = `${L.S}:${L.measure}:${L.lines}`;
    if (key === this.layoutKey) return L;
    const firstLine = this.pages && this.pages.length ? this.pages.slice(0, this.page).reduce((n, p) => n + p.length, 0) : 0;
    const wrapped = this.docs.map((t) => wrapWords(t, (str) => widthOf(str), L.measure));
    this.pages = wrapped.flatMap((ls) => paginate(ls, L.lines));
    this.per = L.lines;
    // the page height is the document's tallest page, so it does not jump
    this.rows = Math.max(3, ...this.pages.map((p) => p.length));
    let n = 0;
    this.page = 0;
    for (let i = 0; i < this.pages.length; i++) {
      if (n > firstLine) break;
      this.page = i;
      n += this.pages[i].length;
    }
    this.layoutKey = key;
    this.L = L;
    return L;
  }

  _key(e) {
    if (e.repeat) return; // a held key must not page through and close the note
    const c = e.code;
    if (c === 'Escape') return this.close('esc');
    if (c === 'ArrowLeft' || c === 'KeyA') {
      if (this.page > 0) {
        this.page -= 1;
        this._paint();
      }
      return;
    }
    if (['KeyE', 'KeyX', 'Space', 'Enter', 'ArrowRight', 'KeyD'].includes(c)) this.next();
  }

  next() {
    if (this.page < this.pages.length - 1) {
      this.page += 1;
      this._paint();
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

  // the page's canvas: centred on the game, at the screen's own pixels,
  // each font pixel S × S device pixels
  _paint() {
    const L0 = this.layer;
    const game = this.scene.game && this.scene.game.canvas;
    if (!L0 || !game) return;
    // beside the game's canvas: inside the fullscreen element when there is one
    const host = game.parentNode || document.body;
    if (L0.parentNode !== host) host.appendChild(L0);
    const scr = this._screen();
    const { box, dpr } = scr;
    const lay = this._layout(scr);
    if (this.page > this.pages.length - 1) this.page = this.pages.length - 1;
    const S = lay.S;
    const size = pageSize(lay.measure, this.rows, !!this.title);
    const Wd = size.w * S;
    const Hd = size.h * S;
    L0.width = Wd;
    L0.height = Hd;
    const at = placeOnDevice(box, Wd, Hd, dpr);
    L0.style.width = `${at.width}px`;
    L0.style.height = `${at.height}px`;
    L0.style.left = `${at.left}px`;
    L0.style.top = `${at.top}px`;
    this.placed = { ...at, Wd, Hd, S, dpr, box };
    const ctx = L0.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    // the paper: a dark edge, the brass line, cream
    const e = Math.max(1, Math.round(S / 2));
    ctx.fillStyle = '#2a2340';
    ctx.fillRect(0, 0, Wd, Hd);
    ctx.fillStyle = hex(BRASS);
    ctx.fillRect(e, e, Wd - 2 * e, Hd - 2 * e);
    ctx.fillStyle = hex(this.paper);
    ctx.fillRect(3 * e, 3 * e, Wd - 6 * e, Hd - 6 * e);
    let y = READING.padY;
    if (this.title) {
      paintGlyphs(ctx, this.title, (size.w / 2) * S, y * S, { size: 'body', scale: S, color: this.ink, align: 'center' });
      y += READING.cell + 6;
      const tw = Math.min(size.w - 40, Math.max(60, widthOf(this.title) + 20));
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = hex(this.ink);
      ctx.fillRect(Math.round(size.w / 2 - tw / 2) * S, y * S, tw * S, S);
      ctx.globalAlpha = 1;
      y = READING.padY + READING.titleBlock;
    }
    const lines = this.pages[this.page] || [''];
    lines.forEach((ln, i) => paintGlyphs(ctx, ln, READING.padX * S, (y + i * pitch()) * S, { size: 'body', scale: S, color: this.ink }));
    this.widest = Math.max(0, ...lines.map((l) => widthOf(l)));
    // the hints: the small face at the body's pixel (they say how to close)
    const foot = footerText({ page: this.page, pages: this.pages.length, touch: !!touchState.on });
    const fs = S;
    const fh = measure('small', 'A', fs).height;
    paintGlyphs(ctx, foot, Wd - READING.padX * S, Hd - Math.round(READING.padY * S * 0.6) - fh, { size: 'small', scale: fs, color: this.ink, align: 'right' });
  }

  _draw() {
    const s = this.scene;
    this._clear();
    const add = (o) => {
      this.objs.push(o);
      if (this.handle) this.handle.add(o);
      return o;
    };
    add(dim(s, READING.dim, 300));
    const L = document.createElement('canvas');
    L.className = 'dc-reading';
    L.style.cssText = 'position:fixed;pointer-events:none;z-index:10;image-rendering:pixelated;margin:0';
    const game = s.game && s.game.canvas;
    (game && game.parentNode ? game.parentNode : document.body).appendChild(L);
    this.layer = L;
    this.bodyEl = L;
    this._paint();
    const fit = () => this._paint();
    window.addEventListener('resize', fit);
    document.addEventListener('fullscreenchange', fit);
    s.scale.on('resize', fit);
    const gone = () => this.close('scene');
    s.events.once('shutdown', gone);
    this._unfit = () => {
      window.removeEventListener('resize', fit);
      document.removeEventListener('fullscreenchange', fit);
      s.scale.off('resize', fit);
      s.events.off('shutdown', gone);
    };
  }

  // for scenarios: what is on the page, at what size, at what contrast
  state() {
    const p = this.placed;
    const L = this.L || {};
    const lines = this.pages[this.page] || [];
    const fsEl = typeof document !== 'undefined' ? document.fullscreenElement : null;
    const visible = !!(this.layer && this.layer.isConnected && (!fsEl || fsEl.contains(this.layer)));
    const inBox = !!(p && p.left >= p.box.left - 0.5 && p.top >= p.box.top - 0.5 && p.left + p.width <= p.box.left + p.box.width + 0.5 && p.top + p.height <= p.box.top + p.box.height + 0.5);
    const onGrid = !!(p && Number.isInteger(p.S) && Math.abs(p.left * p.dpr - Math.round(p.left * p.dpr)) < 1e-6 && Math.abs(p.top * p.dpr - Math.round(p.top * p.dpr)) < 1e-6);
    return {
      open: this.isOpen,
      title: this.title,
      page: this.page,
      pages: this.pages.length,
      lines: lines.length,
      text: lines.join('\n'),
      cap: p ? +((READING.cap * p.S) / p.dpr).toFixed(2) : 0, // CSS px
      S: L.S || 0,
      measure: L.measure || 0,
      chars: lines.length ? Math.max(...lines.map((l) => l.length)) : 0,
      phone: !!L.phone,
      contrast: +contrast(this.ink, this.paper).toFixed(2),
      angle: 0,
      dom: visible,
      onGrid,
      fits: !!(this.bodyEl && inBox && this.widest <= (L.measure || 0)),
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
