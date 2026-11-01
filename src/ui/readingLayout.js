// The reading panel's layout (src/ui/ReadingPanel.js), pure so it
// unit-tests in Node: the page, its type, word wrap, paging, and the
// whole-number pixel scale the page is painted at on a given screen.
//
// Units: the page is laid out in FONT PIXELS (one pixel of the body face at
// scale 1: cap 9, x-height 6, cell 11) and painted at S device pixels per
// font pixel, S a whole number, so every glyph pixel is the same size and
// lands on the screen's own pixel grid (never blurred, never uneven).
import { IDENTITY } from './theme.js';

export const READING = Object.freeze({
  paper: IDENTITY.cream,
  ink: IDENTITY.night,
  minContrast: 7, // a document's own ink is kept only at 7:1 on its paper
  // the body face's metrics (src/ui/fonts/body.js)
  cap: 9,
  cell: 11,
  // feedback 4 ("texts still unreadable in notes"): looser leading, a
  // line length near 55 characters, and a cap of at least 14 CSS px on a
  // desktop window (11 on a phone)
  lineGap: 5, // font px between a line's cell and the next: pitch 16 (cap × 1.78)
  measures: [312, 276, 240], // text width in font px, widest first (≈ 55 / 48 / 42 characters)
  padX: 20,
  padY: 14,
  titleBlock: 26, // the title line, a gap, the rule and a gap
  footBlock: 16, // the gap above the hints and the hints (small face)
  minLines: 6, // a page holds at least this many lines on any screen it fits
  maxLines: 10,
  fill: 0.94, // the page fits in this share of the game's box (width)
  fillH: 0.96, // and of its height
  capCss: { desktop: 14, phone: 11 }, // the smallest cap height, in CSS px
  phoneBelow: 900, // a game box narrower than this (CSS px) is a phone's
  gameW: 960,
  dim: 0.8,
  // kept for older callers: the body at ×2 of the 960 × 540 game is cap 18
  scale: 2,
  minCap: 18,
});

export const pitch = () => READING.cell + READING.lineGap;
export const fixedH = () => READING.padY * 2 + READING.titleBlock + READING.footBlock;

// the page on a screen. box: the game canvas's CSS box; dpr: device px per
// CSS px. Returns S (device px per font px), the text measure (font px),
// lines per page and the cap height in CSS px.
export function layoutFor({ cssW, cssH, dpr = 1 }) {
  const R = READING;
  const W = cssW * dpr * R.fill;
  const H = cssH * dpr * R.fillH;
  const k = (cssW * dpr) / R.gameW; // device px per game px
  const pref = Math.max(1, Math.round(R.scale * k)); // body ×2 of the game, as the rest of the UI
  const phone = cssW < R.phoneBelow;
  const capMin = phone ? R.capCss.phone : R.capCss.desktop;
  const minS = Math.max(1, Math.ceil((capMin * dpr) / R.cap));
  const fitOf = (m) => Math.floor(Math.min(W / (m + R.padX * 2), H / (fixedH() + R.minLines * pitch())));
  let pick = null;
  for (const m of R.measures) {
    const fit = fitOf(m);
    if (fit >= minS) {
      // a phone is held close and small: as large as fits; a window keeps
      // the page in proportion to the game (body ×2), never under the minimum
      pick = { S: phone ? fit : Math.min(fit, Math.max(pref, minS)), measure: m };
      break;
    }
  }
  if (!pick) {
    // nothing reaches the minimum: the narrowest measure at the largest scale that fits
    const m = R.measures[R.measures.length - 1];
    pick = { S: Math.max(1, fitOf(m)), measure: m };
  }
  const lines = Math.max(3, Math.min(R.maxLines, Math.floor((H / pick.S - fixedH()) / pitch())));
  return { ...pick, lines, capCss: (R.cap * pick.S) / dpr, phone };
}

// the page's size in font px for `n` lines (title optional)
export function pageSize(measure, n, title = true) {
  return {
    w: measure + READING.padX * 2,
    h: READING.padY * 2 + (title ? READING.titleBlock : 0) + Math.max(3, n) * pitch() + READING.footBlock,
  };
}

// a whole-device-pixel rectangle of Wd × Hd device px centred on the CSS
// box: CSS left/top/width/height that land exactly on device pixels
export function placeOnDevice(box, Wd, Hd, dpr = 1) {
  const left = Math.round((box.left + box.width / 2) * dpr - Wd / 2);
  const top = Math.round((box.top + box.height / 2) * dpr - Hd / 2);
  return { left: left / dpr, top: top / dpr, width: Wd / dpr, height: Hd / dpr };
}

// greedy word wrap with a measure function (px); paragraphs on '\n'
export function wrapWords(text, measure, maxW) {
  const out = [];
  for (const para of String(text || '').split('\n')) {
    if (!para.trim()) {
      out.push('');
      continue;
    }
    let line = '';
    for (const word of para.split(/\s+/).filter(Boolean)) {
      const next = line ? `${line} ${word}` : word;
      if (!line || measure(next) <= maxW) line = next;
      else {
        out.push(line);
        line = word;
      }
    }
    if (line) out.push(line);
  }
  // no blank line at a page's top or the end
  while (out.length && out[out.length - 1] === '') out.pop();
  return out;
}

// lines → pages of at most `per` lines (a blank line never opens a page).
// Balanced: a document that needs n pages gets about the same number of
// lines on each (ten lines at nine a page are 5 + 5, not 9 + 1)
export function paginate(lines, per) {
  const first = fill(lines, per);
  if (first.length < 2) return first;
  for (let p = Math.ceil(lines.length / first.length); p < per; p++) {
    const even = fill(lines, p);
    if (even.length === first.length) return even;
  }
  return first;
}

function fill(lines, per) {
  const pages = [];
  let cur = [];
  for (const l of lines) {
    if (cur.length >= per) {
      pages.push(cur);
      cur = [];
    }
    if (!cur.length && l === '') continue;
    cur.push(l);
  }
  if (cur.length) pages.push(cur);
  return pages.length ? pages : [['']];
}

// the hints under the page: where you are and what the keys (or a finger) do
export function footerText({ page, pages, touch = false }) {
  const more = page < pages - 1;
  const where = pages > 1 ? `${page + 1} / ${pages}` : '';
  const parts = touch
    ? [more ? 'tap: next ▸' : 'tap: done', page > 0 ? '◂ tap left: back' : '']
    : [more ? '[E] next ▸' : '[E] done', page > 0 ? '[←] back' : '', '[Esc] close'];
  return [where, ...parts].filter(Boolean).join('    ');
}
