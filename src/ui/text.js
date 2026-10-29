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
import { toColor, toAlpha, THEME } from './theme.js';

export const CAP = { small: 7, body: 9, display: 14 };
// Conversation (captions, the scene box, the dialogue box): body at 1.6×,
// cap 14.4 on the 960 × 540 canvas (the §8 screen minimum is 14). The game
// now fills the browser (FIT), so on a laptop this reads at 20–28 px; at
// 2× it was oversized (feedback 3: "now that we have full screen, you can
// reduce the font size of conversation"). Notes and letters keep 2×
// (src/ui/ReadingPanel.js).
export const CONVERSATION_SCALE = 1.6;

// Readability (round 2 §8). Canvas px at 960×540, measured on screen (the
// world camera's zoom included).
export const READ = Object.freeze({
  world: 9, // in-world information text (signs, labels, barks)
  screen: 14, // HUD, prompts, cards, menus, dialogue
  zoomFloor: 0.9, // below this camera zoom, world text is counter-scaled
  contrast: 4.5, // glyph vs plate
});
// the §8 plate: ink-dark at 88 % with a 1-px brass line; a cream variant
// carries dark text
const SCRIM_ALPHA = 0.72;
const LINE_PX = { small: 10, body: 13, display: 19 };
export const PLATE = Object.freeze({ dark: 0x14122a, light: 0xf2e6cc, alpha: 0.88, edge: 0xc8a24a, padX: 6, padY: 4 });

// WCAG relative luminance and contrast ratio of two 0xrrggbb colours
export function luminance(c) {
  const ch = [(c >> 16) & 255, (c >> 8) & 255, c & 255].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}

export function contrast(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

// the colour over `back` at alpha `a` (a plate over the scene's average)
export function over(c, back, a) {
  const m = (s) => Math.round(((c >> s) & 255) * a + ((back >> s) & 255) * (1 - a));
  return (m(16) << 16) | (m(8) << 8) | m(0);
}

// move a text colour toward white (on a dark plate) or ink (on a light one)
// until it reads at READ.contrast
export function readableOn(col, plate) {
  if (contrast(col, plate) >= READ.contrast) return col;
  const to = luminance(plate) < 0.2 ? 0xffffff : PLATE.dark;
  for (let k = 0.1; k <= 1.001; k += 0.1) {
    const c = over(to, col, k);
    if (contrast(c, plate) >= READ.contrast) return c;
  }
  return to;
}

// world text that carries information (≥ 2 letters or digits); single
// symbols (a suit, a ○ mark, a 'z') are decoration
export function isInfo(text) {
  return (String(text || '').match(/[A-Za-z0-9]/g) || []).length >= 2;
}

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
    // §8: no 7-px world text. Information text in the world that would
    // resolve to small ×1 is set in body ×1 (cap 9) instead; it goes back to
    // small if it turns out to be screen-space (small ×2 = cap 14 there).
    this.dc.decor = !!opts.decor;
    this.dc.backing = opts.backing != null ? toColor(opts.backing) : null; // drawn on its own board of this colour
    this.dc.autoPlate = opts.plate !== false;
    if (!this.dc.screen && !this.dc.decor && this.dc.size === 'small' && this._scale() === 1 && isInfo(text)) {
      this.dc.size = 'body';
      this.dc.promoted = true;
    }
    this._applyFont();
    // every world text is known to its scene (the readability pass below and
    // the `readability` scenario walk this set) and runs preUpdate
    const set = (scene.__dcTexts ||= new Set());
    set.add(this);
    this.once('destroy', () => set.delete(this));
    scene.sys.updateList.add(this);
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
    if (!this.scene) return this; // destroyed (a late timer): nothing to lay out
    // a world text that gets its words later is judged again for a plate
    if (this.dc && this.dc.decided && !this._bg && !this.dc.screen && isInfo(value)) this.dc.decided = false;
    // world text made empty and filled later is promoted when it gets words
    if (this.dc && !this.dc.screen && !this.dc.decor && !this.dc.promoted && this.dc.size === 'small' && !this._applying && this._scale() === 1 && isInfo(value)) {
      this.dc.size = 'body';
      this.dc.promoted = true;
      this._applying = true;
      this._applyFont();
      this._applying = false;
    }
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
    this.dc.wantColor = col;
    this.dc.color = col;
    this.setTint(col);
    if (this._bg || this.dc.backing !== null) this._fitColor();
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
    // the §8 plates (numbers) are drawn at the plate alpha
    const alpha = c === PLATE.dark || c === PLATE.light ? PLATE.alpha : toAlpha(c);
    if (!this._bg) {
      this._bg = this.scene.add.rectangle(this.x, this.y, 1, 1, toColor(c), alpha).setOrigin(0, 0);
      this._bg.isTextPlate = true;
      this._bg.setStrokeStyle(1, PLATE.edge, 1);
      this.once('destroy', () => this._bg && this._bg.destroy());
      this.scene.sys.updateList.add(this);
      if (!this.dc.padding.x && !this.dc.padding.y) this.dc.padding = { x: PLATE.padX, y: PLATE.padY };
    } else this._bg.setFillStyle(toColor(c), alpha);
    this._fitColor();
    this._syncBg();
    return this;
  }

  // the colour the glyphs sit on: a plate, a scrim, a declared board, or null
  backingColor() {
    if (this._bg) return this._bg.fillColor;
    if (this._scrim) return this._scrim.worst;
    return this.dc.backing;
  }

  // §8 scrim for a line placed straight on sky or art (ending cards, vista
  // titles): a soft horizontal band of the scene's darkest colour behind the
  // line, 2.2 line heights tall, feathered at both ends. Its worst case (the
  // band over the palest sky, cream) is what the contrast rule is held to.
  setScrim(color = 0x14101c, alpha = SCRIM_ALPHA) {
    if (!this._scrim) {
      const g = this.scene.add.graphics();
      g.isTextScrim = true;
      this._scrim = g;
      this.once('destroy', () => g.destroy());
      this.scene.sys.updateList.add(this);
    }
    this._scrim.color = toColor(color);
    this._scrim.a = alpha;
    this._scrim.worst = over(this._scrim.color, PLATE.light, alpha);
    this._scrim.key = null;
    this._fitColor();
    this._syncScrim();
    return this;
  }

  _syncScrim() {
    const g = this._scrim;
    if (!g || !g.active) return;
    const b = this.getTextBounds(false).global;
    const lh = LINE_PX[this.dc.size] * this.fontSize * Math.abs(this.scaleY);
    const lines = Math.max(1, (this._text.match(/\n/g) || []).length + 1);
    const h = Math.round(lh * 2.2 + (lines - 1) * lh);
    const w = Math.round(b.width + 220);
    const key = `${w},${h}`;
    if (g.key !== key) {
      g.key = key;
      g.clear();
      // feathered ends: 1-px slices ramp up over 110 px each side
      const feather = 110;
      const n = feather;
      for (let i = 0; i < n; i++) {
        const k = (i + 1) / n;
        const sw = feather / n;
        g.fillStyle(g.color, g.a * k * k);
        g.fillRect(-w / 2 + i * sw, -h / 2, sw + 0.5, h);
        g.fillRect(w / 2 - (i + 1) * sw, -h / 2, sw + 0.5, h);
      }
      g.fillStyle(g.color, g.a);
      g.fillRect(-w / 2 + feather, -h / 2, w - feather * 2, h);
      // the band is soft top and bottom too
      g.fillStyle(g.color, g.a * 0.5);
      g.fillRect(-w / 2 + feather, -h / 2 - 4, w - feather * 2, 4);
      g.fillRect(-w / 2 + feather, h / 2, w - feather * 2, 4);
    }
    g.setPosition(Math.round(b.x + b.width / 2), Math.round(b.y + b.height / 2));
    g.setVisible(this.visible && !!this._text);
    g.setAlpha(this.alpha);
    if (g.scrollFactorX !== this.scrollFactorX || g.scrollFactorY !== this.scrollFactorY) g.setScrollFactor(this.scrollFactorX, this.scrollFactorY);
    if (g.depth !== this.depth - 0.002) g.setDepth(this.depth - 0.002);
    if (this.displayList && g.displayList !== this.displayList) g.addToDisplayList(this.displayList);
  }

  // keep the glyphs at READ.contrast against what is behind them
  _fitColor() {
    const back = this.backingColor();
    if (back === null || back === undefined || this.dc.color === undefined) return;
    const want = this.dc.wantColor ?? this.dc.color;
    const fit = readableOn(want, back);
    if (fit !== this.dc.color) {
      this.dc.color = fit;
      this.setTint(fit);
    }
  }

  // §8 for world text, decided on the first frame (when its container and
  // colour are known): information text not drawn on a board gets the plate
  _decidePlate() {
    this.dc.decided = true;
    if (this.dc.screen || this.dc.decor || !this.dc.autoPlate || this._bg || this.dc.backing !== null) return;
    if (this.parentContainer || !isInfo(this._raw)) return;
    const col = this.dc.color ?? THEME.ink;
    const plate = luminance(col) < 0.18 ? PLATE.light : PLATE.dark;
    this.setBackgroundColor(plate);
  }

  // §8 zoom rule: world information text whose cap would fall under
  // READ.world at the camera's zoom is counter-scaled (a board container
  // that opts in with `dcReadable` scales as one; text on a board or in any
  // other container hides until the camera comes back)
  _zoomRule() {
    if (this.dc.screen || this.dc.decor || !isInfo(this._raw)) return;
    const cam = this.scene.cameras && this.scene.cameras.main;
    if (!cam) return;
    const z = cam.zoom;
    const box = this.parentContainer;
    const own = this.dc.zoomScale || 1;
    const k = box ? box.scaleY / (box.dcZoomScale || 1) : 1;
    const cap = CAP[this.dc.size] * this.fontSize * k * z;
    const need = cap < READ.world - 0.01 ? READ.world / cap : 1;
    // below the zoom floor, lettering on its own board (or in a container
    // that is not a readable board) would outgrow it: it hides instead
    const low = z < READ.zoomFloor;
    if (box && box.dcReadable) {
      const cur = box.dcZoomScale || 1;
      if (Math.abs(cur - need) > 0.001) {
        box.setScale((box.scaleX / cur) * need, (box.scaleY / cur) * need);
        box.dcZoomScale = need;
      }
      return;
    }
    const hide = low && need > 1 && (!!box || this.dc.backing !== null);
    this._zoomHide(hide);
    const want = hide ? 1 : need;
    if (Math.abs(own - want) > 0.001) {
      this.setScale((this.scaleX / own) * want, (this.scaleY / own) * want);
      this.dc.zoomScale = want;
      this._bgAt = null;
    }
  }

  _zoomHide(on) {
    if (on && this.visible) {
      this.setVisible(false);
      this.dc.zoomHidden = true;
    } else if (!on && this.dc.zoomHidden) {
      this.setVisible(true);
      this.dc.zoomHidden = false;
    }
  }

  preUpdate() {
    if (!this.dc.decided) this._decidePlate();
    if (!this.dc.screen) this._zoomRule();
    this._syncBg();
    if (this._scrim) this._syncScrim();
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
      if (screen && this.dc.promoted) {
        this.dc.size = 'small';
        this.dc.promoted = false;
      }
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
