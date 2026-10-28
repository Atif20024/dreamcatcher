// uiText: the one way text is put on screen (ui-type skill). Phaser's
// default Text is banned by lint-content; this returns a BitmapText on the
// string-art fonts in src/ui/BitmapFonts.js.
//
//   uiText(scene, x, y, 'Come back Tuesday.', { size: 'body', color: 'accent', align: 'center', wrap: 420 })
//
// Options: size 'small'|'body'|'display'; color (token or '#rrggbb');
// align; wrap (px); scale (integer; default 2 on screen, 1 in the world);
// screen (true for screen-space text inside a container); lineSpacing (px);
// bg / padding (a plate behind the text). For old call sites, the Phaser
// Text style keys (fontSize, color, align, wordWrap, backgroundColor,
// padding, lineSpacing) are understood too, so a conversion is mechanical;
// stroke and fontFamily are ignored (every glyph has a baked outline).
//
// The returned object keeps the Text methods old code calls: setColor,
// setFill, setStyle, setFontSize, setWordWrapWidth, setAlign, setStroke,
// setShadow, setPadding, setBackgroundColor (no-ops where meaningless).
import Phaser from 'phaser';
import { ensureFonts, fontKey, sanitize, FONT_DEFS } from './BitmapFonts.js';
import { toColor, toAlpha } from './theme.js';

const CAP = { small: 7, body: 9, display: 14 };

function pxOf(v) {
  if (v === undefined || v === null) return null;
  const n = parseFloat(String(v));
  return Number.isFinite(n) ? n : null;
}

// legacy pixel size (+ the text) → a font
function fontForPx(px, text) {
  if (px === null) return 'body';
  if (px <= 13) return 'small';
  if (px >= 22 && String(text || '').length <= 24 && !String(text || '').includes('\n')) return 'display';
  return 'body';
}

export class DCText extends Phaser.GameObjects.BitmapText {
  constructor(scene, x, y, text = '', opts = {}) {
    ensureFonts(scene.sys.game);
    super(scene, x, y, fontKey('body'), '', 2);
    this.isDCText = true;
    this.dc = { size: 'body', scale: null, px: null, screen: !!opts.screen, padding: { x: 0, y: 0 }, lineSpacingPx: 0 };
    const px = pxOf(opts.fontSize);
    this.dc.px = px;
    this.dc.size = opts.size || fontForPx(px, text);
    if (opts.scale) this.dc.scale = opts.scale;
    this._applyFont();
    this.setStyle(opts);
    this.setText(text);
  }

  // ---- font / scale
  _scale() {
    if (this.dc.scale) return this.dc.scale;
    const cap = CAP[this.dc.size];
    const fromPx = this.dc.px ? Math.max(1, Math.round((this.dc.px * 0.72) / cap)) : 1;
    return this.dc.screen ? Math.max(2, fromPx) : fromPx;
  }

  _applyFont() {
    const scale = this._scale();
    const key = fontKey(this.dc.size);
    if (this.font !== key) this.setFont(key, scale);
    else Phaser.GameObjects.BitmapText.prototype.setFontSize.call(this, scale);
    this.setLineSpacing(this.dc.lineSpacingPx);
    if (this._raw !== undefined) this.setText(this._raw);
    return this;
  }

  setSize(size) {
    this.dc.size = size;
    return this._applyFont();
  }

  setScaleStep(n) {
    this.dc.scale = n;
    return this._applyFont();
  }

  // ---- text: `.text` is what is drawn (Phaser lays out from it; the small
  // and display fonts upcase); `.rawText` is the string as given
  get rawText() {
    return this._raw !== undefined ? this._raw : this._text;
  }

  setText(value) {
    if (!value && value !== 0) value = '';
    if (Array.isArray(value)) value = value.join('\n');
    value = String(value);
    this._raw = value;
    const drawn = this.dc ? sanitize(value, this.dc.size) : value;
    if (drawn !== this._text) {
      this._text = drawn;
      this._dirty = true;
      this.updateDisplayOrigin();
    }
    return this;
  }

  // ---- Text-compatible styling
  setStyle(s = {}) {
    if (s.fontSize !== undefined && !s.size) this.setFontSize(s.fontSize);
    const c = s.color !== undefined ? s.color : s.fill;
    if (c !== undefined) this.setColor(c);
    if (s.align) this.setAlign(s.align);
    const wrap = s.wrap !== undefined ? s.wrap : s.wordWrap && s.wordWrap.width;
    if (wrap) this.setWordWrapWidth(wrap);
    if (s.lineSpacing !== undefined) this.setLineSpacing(s.lineSpacing);
    if (s.padding !== undefined) this.setPadding(s.padding);
    const bg = s.bg !== undefined ? s.bg : s.backgroundColor;
    if (bg) this.setBackgroundColor(bg);
    if (s.shadow === true) this.setDropShadow(1, 1, 0x0e0b14, 1);
    return this;
  }

  setColor(c) {
    const col = toColor(c);
    this.dc.color = col;
    this.setTint(col);
    return this;
  }

  setFill(c) {
    return this.setColor(c);
  }

  // a pixel size from old code ('14px'); the integer scale step otherwise
  setFontSize(v) {
    if (typeof v === 'string' || (this.dc && v > 4)) {
      this.dc.px = pxOf(v);
      this.dc.scale = null;
      return this._applyFont();
    }
    return super.setFontSize(v);
  }

  setWordWrapWidth(w) {
    this.setMaxWidth(w || 0);
    return this;
  }

  setAlign(a) {
    if (a === 'center' || a === 1) this.setCenterAlign();
    else if (a === 'right' || a === 2) this.setRightAlign();
    else this.setLeftAlign();
    return this;
  }

  // px between lines (old Text semantics); BitmapText counts font units
  setLineSpacing(px) {
    if (!this.dc) return super.setLineSpacing(px);
    this.dc.lineSpacingPx = px || 0;
    return super.setLineSpacing(Math.round((px || 0) / (this.fontSize || 1)));
  }

  setStroke() {
    return this;
  }

  setShadow() {
    return this;
  }

  setFontStyle() {
    return this;
  }

  setFontFamily() {
    return this;
  }

  setResolution() {
    return this;
  }

  setFixedSize() {
    return this;
  }

  setPadding(p) {
    if (typeof p === 'number') this.dc.padding = { x: p, y: p };
    else if (p) this.dc.padding = { x: p.x ?? p.left ?? 0, y: p.y ?? p.top ?? 0 };
    return this;
  }

  // ---- a plate behind the text (old backgroundColor)
  setBackgroundColor(c) {
    if (!c) {
      if (this._bg) this._bg.destroy();
      this._bg = null;
      return this;
    }
    if (!this._bg) {
      this._bg = this.scene.add.rectangle(this.x, this.y, 1, 1, toColor(c), toAlpha(c)).setOrigin(0, 0);
      this._bg.isTextPlate = true;
      this.once('destroy', () => this._bg && this._bg.destroy());
      this.scene.sys.updateList.add(this);
      if (!this.dc.padding.x && !this.dc.padding.y) this.dc.padding = { x: 4, y: 2 };
    } else this._bg.setFillStyle(toColor(c), toAlpha(c));
    this._syncBg();
    return this;
  }

  preUpdate() {
    this._syncBg();
  }

  _syncBg() {
    const bg = this._bg;
    if (!bg || !bg.active) return;
    // Phaser caches the global bounds until the text changes: a plate under
    // a moving text (the interact prompt) went stale at the old position
    if (this._bgAt !== `${this.x},${this.y}`) {
      this._bgAt = `${this.x},${this.y}`;
      this._dirty = true;
    }
    const b = this.getTextBounds(false).global;
    const pad = this.dc.padding;
    bg.setPosition(Math.round(b.x - pad.x), Math.round(b.y - pad.y));
    bg.setSize(Math.round(b.width + pad.x * 2), Math.round(b.height + pad.y * 2));
    bg.setDisplaySize(bg.width, bg.height);
    bg.setVisible(this.visible && !!this._text);
    bg.setAlpha(this.alpha);
    bg.cameraFilter = this.cameraFilter;
    if (bg.scrollFactorX !== this.scrollFactorX || bg.scrollFactorY !== this.scrollFactorY) bg.setScrollFactor(this.scrollFactorX, this.scrollFactorY);
    if (bg.depth !== this.depth - 0.001) bg.setDepth(this.depth - 0.001);
    if (this.displayList && bg.displayList !== this.displayList) bg.addToDisplayList(this.displayList);
  }

  setScrollFactor(x, y) {
    super.setScrollFactor(x, y);
    const screen = this.scrollFactorX === 0 && this.scrollFactorY === 0;
    if (this.dc && screen !== this.dc.screen) {
      this.dc.screen = screen;
      this._applyFont();
    }
    return this;
  }
}

export function uiText(scene, x, y, text = '', opts = {}) {
  const t = new DCText(scene, Math.round(x), Math.round(y), text, opts);
  scene.add.existing(t);
  return t;
}

// sizes for layout code (scale 1 metrics live in BitmapFonts.measure)
export const LINE_HEIGHT = Object.fromEntries(Object.entries(FONT_DEFS).map(([k, v]) => [k, v.lineHeight]));
