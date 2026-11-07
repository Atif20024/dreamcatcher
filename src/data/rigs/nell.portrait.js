// Wren's dialogue portrait (32×32 drawn 3×): Jo's face construction (the
// same proportions, src/data/rigs/jo.portrait.js) with her own features
// patched in — no glasses, open eyes under a brow, rosy cheeks, auburn hair
// falling to the collar — and her palette (cap, coat, skin) from her rig.
import { portraitRows as joRows } from './jo.portrait.js';

export const PORTRAIT_SCALE = 3;

const FACE = [
  [15, 6, 'ksRSSSSSSSSSSSSSSsk'],
  [16, 6, 'kRRSleeSSSSSSeelSsk'],
  [17, 6, 'ksSSSeeSSSSSSeeSSsk'],
  [18, 6, 'kkSSSSSSSSSSSSSSSsk'],
  [19, 9, 'TTS'],
  [19, 19, 'STT'],
];

const EXPR = {
  neutral: [],
  smile: [
    [22, 13, 'SSmmmmSS'],
    [21, 13, 'mS'],
    [21, 19, 'Sm'],
  ],
  worried: [
    [14, 9, 'RSSaaSSSSaaSs'],
    [22, 13, 'SSmmmmSS'],
    [23, 13, 'SmSSSSmS'],
  ],
};

export const PORTRAIT_EXPRESSIONS = Object.keys(EXPR);

export function portraitRows(expr = 'neutral') {
  const rows = joRows('neutral').map((r) => [...r]);
  const put = ([y, x, s]) => [...s].forEach((ch, i) => (rows[y][x + i] = ch));
  FACE.forEach(put);
  // hair falls past the jaw on both sides, outlined
  for (let y = 12; y <= 27; y++) {
    for (const x of [5, 6, 25, 26]) if (rows[y][x] === '.' || rows[y][x] === 'k') rows[y][x] = y === 27 ? 'k' : 'a';
    if (rows[y][4] === '.') rows[y][4] = 'k';
    if (rows[y][27] === '.') rows[y][27] = 'k';
  }
  // the cap has no band: the band rows take the cap colour, a brass button
  for (const y of [7, 8]) rows[y] = rows[y].map((ch) => (ch === 'y' || ch === 'r' || ch === 'n' ? 'H' : ch));
  rows[5][15] = 'y';
  (EXPR[expr] || []).forEach(put);
  return rows.map((r) => r.join(''));
}
