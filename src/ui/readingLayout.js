// The reading panel's layout (src/ui/ReadingPanel.js), pure so it
// unit-tests in Node: the page, its type, word wrap and paging.
import { IDENTITY } from './theme.js';

export const READING = Object.freeze({
  paper: IDENTITY.cream,
  ink: IDENTITY.night,
  scale: 2, // body ×2: cap 18 on a 960 × 540 canvas
  minCap: 18,
  // the page is the game's own pixel font, painted on a canvas laid over
  // the game at the screen's real resolution, without the baked outline
  // (src/ui/ReadingPanel.js): crisp at any window size, and still the game
  width: 720, // the page
  maxHeight: 420,
  padX: 40,
  padY: 30,
  lineGap: 6, // extra px between lines, over the font's own
});

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

// lines → pages of at most `per` lines (a blank line never opens a page)
export function paginate(lines, per) {
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
