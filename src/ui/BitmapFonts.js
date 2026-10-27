// Bitmap fonts authored as string-art (src/ui/fonts/*), rasterised once at
// boot into canvas textures and registered as Phaser bitmap fonts. No font
// files are downloaded. Every glyph carries a baked 1-px `ink-shadow`
// outline, so white ink takes a tint (the colour) and the outline stays dark:
// text reads on a panel and over the world alike.
//
//   small    5×7 caps        labels, HUD, prompts, signs, numbers
//   body     cap 9, x 6      sentences: dialogue, cards, puzzle instructions
//   display  small at 2×     names and titles: a 2-px stroke with a bright
//                            inlay line top/left and a 2-px slab shadow
import SMALL from './fonts/small.js';
import BODY, { BODY_ROWS } from './fonts/body.js';
import { THEME } from './theme.js';

const OUTLINE = THEME['ink-shadow'];
const INK = 0xffffff; // tinted at draw time
const DISPLAY_STROKE = 0xd2d2d2; // ×tint: the stroke a shade under the inlay
const DISPLAY_SLAB = 0x4a4a4a; // ×tint: the slab shadow

// rows → 2-D array of colours (0 = empty)
function gridOf(rows, colour = INK) {
  return rows.map((r) => [...r].map((ch) => (ch === '#' ? colour : 0)));
}

function parseBody(spec) {
  const [start, body] = spec.split('|');
  const rows = body.split('/');
  const w = rows[0].length;
  const out = [];
  for (let y = 0; y < BODY_ROWS; y++) {
    const r = rows[y - Number(start)];
    out.push(r ? [...r].map((ch) => (ch === '#' ? INK : 0)) : new Array(w).fill(0));
  }
  return out;
}

// small → display: each pixel 2×2; the first row/column of every stroke run
// is the bright inlay; a 2-px slab shadow falls down-right.
function displayOf(rows) {
  const h = rows.length * 2;
  const w = rows[0].length * 2;
  const on = (x, y) => y >= 0 && x >= 0 && y < h && x < w && rows[y >> 1][x >> 1] === '#';
  const g = Array.from({ length: h + 2 }, () => new Array(w + 2).fill(0));
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!on(x, y)) continue;
      if (!on(x + 2, y + 2)) {
        g[y + 2][x + 2] = g[y + 2][x + 2] || DISPLAY_SLAB;
        g[y + 1][x + 2] = g[y + 1][x + 2] || DISPLAY_SLAB;
      }
    }
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!on(x, y)) continue;
      g[y][x] = !on(x, y - 1) || !on(x - 1, y) ? INK : DISPLAY_STROKE;
    }
  }
  return g;
}

export const FONT_DEFS = {
  small: {
    caps: true,
    cell: 7,
    lineHeight: 10,
    space: 4,
    glyphs: () => Object.fromEntries(Object.entries(SMALL).map(([k, v]) => [k, gridOf(v)])),
    advance: (w) => w + 1,
  },
  body: {
    caps: false,
    cell: BODY_ROWS,
    lineHeight: 13,
    space: 4,
    glyphs: () => Object.fromEntries(Object.entries(BODY).map(([k, v]) => [k, parseBody(v)])),
    advance: (w) => w + 1,
  },
  display: {
    caps: true,
    cell: 16,
    lineHeight: 19,
    space: 7,
    glyphs: () => Object.fromEntries(Object.entries(SMALL).map(([k, v]) => [k, displayOf(v)])),
    // the slab adds 2 px of width that is not part of the advance
    advance: (w) => w - 2 + 2,
  },
};

const charSets = {};
export const fontKey = (name) => `dc-${name}`;

// characters the font has no glyph for become their nearest relative
const FALLBACK = {
  '’': "'", '‘': "'", '“': '"', '”': '"', '\t': ' ', ' ': ' ',
  '✗': '×', '✕': '×', '►': '▸', '◄': '◂', '–': '–',
  'é': 'é', 'ê': 'ê',
};
const SMALL_FALLBACK = { é: 'E', ê: 'E', É: 'E', Ê: 'E', '⌘': '*' };

export function sanitize(text, name) {
  const set = charSets[name] || new Set(Object.keys(name === 'body' ? BODY : SMALL));
  const caps = FONT_DEFS[name].caps;
  let out = '';
  for (let ch of String(text)) {
    if (ch === '\u{1F512}') ch = '\uE000'; // the lock emoji → the lock glyph
    if (FALLBACK[ch]) ch = FALLBACK[ch];
    if (ch === '\n' || ch === ' ') {
      out += ch;
      continue;
    }
    if (caps) {
      if (SMALL_FALLBACK[ch]) ch = SMALL_FALLBACK[ch];
      ch = ch.toUpperCase();
    }
    if (!set.has(ch)) {
      const up = ch.toUpperCase();
      ch = set.has(up) ? up : set.has(ch.normalize('NFD')[0]) ? ch.normalize('NFD')[0] : '?';
    }
    out += ch;
  }
  return out;
}

function buildFont(game, name) {
  const def = FONT_DEFS[name];
  const glyphs = def.glyphs();
  charSets[name] = new Set(Object.keys(glyphs));
  const entries = Object.entries(glyphs);
  const ATLAS_W = 512;
  // layout pass (each glyph padded by the 1-px outline)
  let x = 0;
  let y = 0;
  let rowH = 0;
  const placed = [];
  for (const [ch, g] of entries) {
    const w = g[0].length + 2;
    const h = g.length + 2;
    if (x + w > ATLAS_W) {
      x = 0;
      y += rowH + 1;
      rowH = 0;
    }
    placed.push({ ch, g, x, y, w, h });
    x += w + 1;
    rowH = Math.max(rowH, h);
  }
  const H = y + rowH + 1;
  const canvas = document.createElement('canvas');
  canvas.width = ATLAS_W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  const hex = (c) => `#${c.toString(16).padStart(6, '0')}`;
  for (const p of placed) {
    const gh = p.g.length;
    const gw = p.g[0].length;
    const ink = (gx, gy) => gx >= 0 && gy >= 0 && gx < gw && gy < gh && p.g[gy][gx];
    // outline: every empty pixel touching ink (8-neighbourhood)
    ctx.fillStyle = hex(OUTLINE);
    for (let oy = -1; oy <= gh; oy++) {
      for (let ox = -1; ox <= gw; ox++) {
        if (ink(ox, oy)) continue;
        let near = false;
        for (let dy = -1; dy <= 1 && !near; dy++) for (let dx = -1; dx <= 1 && !near; dx++) if (ink(ox + dx, oy + dy)) near = true;
        if (near) ctx.fillRect(p.x + ox + 1, p.y + oy + 1, 1, 1);
      }
    }
    for (let gy = 0; gy < gh; gy++) {
      for (let gx = 0; gx < gw; gx++) {
        const c = p.g[gy][gx];
        if (!c) continue;
        ctx.fillStyle = hex(c);
        ctx.fillRect(p.x + gx + 1, p.y + gy + 1, 1, 1);
      }
    }
  }
  const key = fontKey(name);
  if (game.textures.exists(key)) game.textures.remove(key);
  game.textures.addCanvas(key, canvas);
  const data = { retroFont: true, font: key, size: 1, lineHeight: def.lineHeight, chars: {} };
  const glyph = (code, x0, y0, w, h, xOffset, yOffset, xAdvance) => ({
    x: x0, y: y0, width: w, height: h, centerX: Math.floor(w / 2), centerY: Math.floor(h / 2),
    xOffset, yOffset, xAdvance, data: {}, kerning: {},
    u0: x0 / ATLAS_W, v0: y0 / H, u1: (x0 + w) / ATLAS_W, v1: (y0 + h) / H,
  });
  for (const p of placed) {
    data.chars[p.ch.charCodeAt(0)] = glyph(p.ch.charCodeAt(0), p.x, p.y, p.w, p.h, -1, -1, def.advance(p.g[0].length));
  }
  // space and newline: an empty 1×1 cell (the corner pixel is transparent)
  data.chars[32] = glyph(32, ATLAS_W - 1, H - 1, 1, 1, 0, 0, def.space);
  game.cache.bitmapFont.add(key, { data, texture: key, frame: null });
}

export function ensureFonts(game) {
  if (game.cache.bitmapFont.exists(fontKey('body')) && game.textures.exists(fontKey('body'))) return;
  for (const name of Object.keys(FONT_DEFS)) buildFont(game, name);
}

// pixel metrics at scale 1 (used by layout code and tests)
export function measure(name, text, scale = 1) {
  const def = FONT_DEFS[name];
  const glyphs = def.glyphs();
  const lines = sanitize(text, name).split('\n');
  const width = Math.max(...lines.map((l) => [...l].reduce((s, ch) => s + (ch === ' ' ? def.space : glyphs[ch] ? def.advance(glyphs[ch][0].length) : 0), 0)));
  return { width: width * scale, height: (lines.length * def.lineHeight - (def.lineHeight - def.cell)) * scale };
}

// paint text straight into a canvas texture (card faces, painted signs):
// the same glyphs, multiplied by `color`, no outline unless asked.
// baseline 'top' | 'middle'; align 'left' | 'center' | 'right'.
const glyphCache = {};
export function paintGlyphs(ctx, text, x, y, { size = 'small', scale = 1, color = 0xffffff, align = 'left', baseline = 'top', outline = null } = {}) {
  const def = FONT_DEFS[size];
  const glyphs = (glyphCache[size] ||= def.glyphs());
  const str = sanitize(text, size);
  const { width } = measure(size, str, scale);
  let cx = Math.round(align === 'center' ? x - width / 2 : align === 'right' ? x - width : x);
  const cy = Math.round(baseline === 'middle' ? y - (def.cell * scale) / 2 : y);
  const col = typeof color === 'string' ? parseInt(color.replace('#', ''), 16) : color;
  const mul = (c) => {
    const k = (c & 0xff) / 255;
    const r = Math.round(((col >> 16) & 0xff) * k);
    const g = Math.round(((col >> 8) & 0xff) * k);
    const b = Math.round((col & 0xff) * k);
    return `rgb(${r},${g},${b})`;
  };
  for (const ch of str) {
    if (ch === ' ') {
      cx += def.space * scale;
      continue;
    }
    const g = glyphs[ch];
    if (!g) continue;
    if (outline !== null) {
      ctx.fillStyle = typeof outline === 'string' ? outline : `#${outline.toString(16).padStart(6, '0')}`;
      g.forEach((row, gy) => row.forEach((c, gx) => c && ctx.fillRect(cx + (gx - 1) * scale, cy + (gy - 1) * scale, scale * 3, scale * 3)));
    }
    g.forEach((row, gy) =>
      row.forEach((c, gx) => {
        if (!c) return;
        ctx.fillStyle = mul(c);
        ctx.fillRect(cx + gx * scale, cy + gy * scale, scale, scale);
      })
    );
    cx += def.advance(g[0].length) * scale;
  }
  return width;
}
