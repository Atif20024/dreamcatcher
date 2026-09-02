import { createPixelTexture, createFrames } from '../utils/pixelart.js';

// The people and furniture of Crossroads Station. The workers keep full
// saturation while the hall drains (HubState never tints them), so their
// palettes are chosen warm on purpose.
const RIM = { outline: 0x14141c };

// --- people: same 16x24 frame set as the foes, warmer palettes -------------
const HEAD_TORSO = [
  '.....SSSSSS.....',
  '....SSSSSSSS....',
  '....SbSSSSbS....',
  '....SSSSSSSS....',
  '.....SSSSSS.....',
  '....TTTTTTTT....',
  '..TTTTTTTTTTTT..',
  '.TTtTTTTTTTTtTT.',
  '.TTtTTTTTTTTtTT.',
  '.TTtTTTTTTTTtTT.',
  '.SSTTTTTTTTTTSS.',
  '....TTTTTTTT....',
];
const LEGS_STAND = ['....PPPPPPPP....', '....PPPPPPPP....', '....PPP..PPP....', '....PPP..PPP....', '....ppp..ppp....', '....ppp..ppp....', '..BBBB....BBBB..', '..BBBB....BBBB..'];
const LEGS_STRIDE = ['....PPPPPPPP....', '...PPPPPPPPPP...', '...PPP....PPP...', '..PPP......PPP..', '..ppp......ppp..', '.ppp........ppp.', '.BBBB......BBBB.', 'BBBB........BBBB'];
const LEGS_SIT = ['....PPPPPPPP....', '..PPPPPPPPPPPP..', '..PPPPPPPPPPPP..', '..ppp......ppp..', '..ppp......ppp..', '..BBB......BBB..', '................', '................'];
const HATS = {
  none: ['................', '................', '................', '................'],
  peaked: ['................', '....HHHHHHHH....', '...HHHHHHHHHH...', '..hhhhhhhhhhhh..'],
  scarf: ['................', '................', '....HHHHHHHH....', '...HHHHHHHHHH...'],
  cap: ['................', '................', '....HHHHHHHH....', '..HHHHHHHHHHhh..'],
  wrap: ['................', '....HHHHHHHH....', '...HHHHHHHHHH...', '...HHHHHHHHHH...'],
  tuft: ['................', '................', '......HHHH......', '....HHHHHHHH....'],
  broom: ['................', '................', '....HHHHHHHH....', '...HHHHHHHHHH...'],
};
const HELD = {
  ledger: [[15, 0, 'AA'], [16, 0, 'AA'], [17, 0, 'AA']],
  brush: [[16, 13, 'AA.'], [17, 13, '.A.']],
  tray: [[15, 12, 'AAAA'], [16, 12, 'aAAa']],
  accordion: [[14, 11, 'AAAAA'], [15, 11, 'AaAaA'], [16, 11, 'AAAAA'], [17, 11, 'AaAaA']],
  kite_string: [[13, 14, '.A'], [12, 15, 'A']],
  broom: [[13, 14, '.A'], [14, 14, '.A'], [15, 14, '.A'], [16, 14, '.A'], [17, 14, '.A'], [18, 13, 'aAa'], [19, 13, 'aaa']],
  flower: [[15, 13, '.A.'], [16, 13, 'AAA'], [17, 13, '.a.']],
};
function paint(rows, held) {
  if (!held) return rows;
  const grid = rows.map((r) => [...r]);
  for (const [y, x, chars] of HELD[held]) {
    [...chars].forEach((ch, i) => {
      if (ch !== '.' && grid[y] && grid[y][x + i] !== undefined) grid[y][x + i] = ch;
    });
  }
  return grid.map((r) => r.join(''));
}
const person = (hat, held, legs = [LEGS_STAND, LEGS_STRIDE, LEGS_STAND]) =>
  legs.map((l) => paint([...HATS[hat], ...HEAD_TORSO, ...l], held));
const P = (H, S, T, t, Pp, B, A, h) => ({ H, h: h ?? H, S, b: 0x1a1a20, T, t, P: Pp, p: t, B, A: A ?? 0xe8e4d8, a: 0x8a8a90 });

export const HUB_PEOPLE = {
  pemberton: { art: person('peaked', 'ledger'), pal: P(0x2e3a52, 0xc8a080, 0x2e3a52, 0x1f2a3c, 0x2e3a52, 0x1a1a20, 0xf2e6cc, 0xc4a25c) },
  ro: { art: person('wrap', 'brush', [LEGS_SIT, LEGS_SIT, LEGS_SIT]), pal: P(0xc0503a, 0x7a4a30, 0xd88a4a, 0xa8683a, 0x5a3a44, 0x2a1a20, 0x8a6844) },
  bilal: { art: person('cap', 'tray'), pal: P(0xf2e6cc, 0x9a6a48, 0x6a8a5a, 0x4e6a44, 0x3a3a44, 0x2a2a30, 0xf2d580) },
  busker: { art: person('scarf', 'accordion'), pal: P(0x8a3a3a, 0xb08868, 0x5a4a3a, 0x40342a, 0x3a3a44, 0x1e1e28, 0xc03a2a) },
  sleeper: { art: person('none', null, [LEGS_SIT, LEGS_SIT, LEGS_SIT]), pal: P(0x8a8478, 0xb09070, 0x6a6a62, 0x50504a, 0x4a4a44, 0x2a2a28, 0x8a8478) },
  kite: { art: person('tuft', 'kite_string'), pal: P(0x2a2230, 0x8a5a3b, 0xf2c078, 0xc89a5a, 0x3a5a80, 0x2a2a32, 0xe8e4d8) },
  sweeper: { art: person('broom', 'broom'), pal: P(0x3a3a44, 0x6a4630, 0x4a5a6a, 0x36444f, 0x3a3a44, 0x1e1e28, 0xb8a06a) },
  flower: { art: person('scarf', 'flower', [LEGS_SIT, LEGS_SIT, LEGS_SIT]), pal: P(0x6a8a5a, 0xc8a080, 0x9a5a6a, 0x74434f, 0x4a4a52, 0x2a2a30, 0xe86a8a) },
};

// --- silhouette travelers (one pooled texture, tinted) --------------------
const TRAVELER = [
  ['....HHHHHH......', '....HHHHHH......', '.....SSSS.......', '....TTTTTT......', '...TTTTTTTT.....', '...TTTTTTTT..AAA', '...TTTTTTTT..AAA', '....PPPPPP...AAA', '....PP..PP......', '....PP..PP......', '...BB....BB.....'],
  ['....HHHHHH......', '....HHHHHH......', '.....SSSS.......', '....TTTTTT......', '...TTTTTTTT.....', '...TTTTTTTT..AAA', '...TTTTTTTT..AAA', '....PPPPPP...AAA', '...PP....PP.....', '..PP......PP....', '.BB........BB...'],
];
const TRAVELER_PAL = { H: 0x2a2a34, S: 0x3a3a44, T: 0x2a2a34, P: 0x24242c, B: 0x1a1a20, A: 0x3a3226 };

// --- furniture ---------------------------------------------------------------
const PROPS = {
  'hub-train': {
    rows: [
      '..RRRRRRRRRRRRRRRRRRRRRRRRRRRR..',
      '.RRRRRRRRRRRRRRRRRRRRRRRRRRRRRR.',
      'RRWWWWRRWWWWRRDDDDRRWWWWRRWWWWRR',
      'RRWWWWRRWWWWRRDDDDRRWWWWRRWWWWRR',
      'RRRRRRRRRRRRRRDDDDRRRRRRRRRRRRRR',
      'RrrrrrrrrrrrrrDDDDrrrrrrrrrrrrrR',
      'RrrrrrrrrrrrrrDDDDrrrrrrrrrrrrrR',
      'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR',
      '..kk..kk..............kk..kk....',
    ],
    pal: { R: 0x7a3a3a, r: 0x9a4a44, W: 0xf2e6cc, D: 0x2a1e1e, k: 0x2a2a30 },
    size: 4,
  },
  'hub-bench': { rows: ['BBBBBBBBBBBB', 'B..........B', 'BBBBBBBBBBBB', '.B........B.', '.B........B.'], pal: { B: 0x5a4632 }, size: 4 },
  'hub-lamp': { rows: ['..LLLL..', '.LYYYYL.', '.LYYYYL.', '..LLLL..', '...ii...', '...ii...', '...ii...', '...ii...', '...ii...', '...ii...', '..iiii..'], pal: { L: 0x3a3a44, Y: 0xf2d580, i: 0x2e2e38 }, size: 3 },
  'hub-lamp-off': { rows: ['..LLLL..', '.LddddL.', '.LddddL.', '..LLLL..', '...ii...', '...ii...', '...ii...', '...ii...', '...ii...', '...ii...', '..iiii..'], pal: { L: 0x3a3a44, d: 0x4a4a52, i: 0x2e2e38 }, size: 3 },
  'hub-post': { rows: ['BBBBBBBB', 'BwwwwwwB', 'BwwwwwwB', 'BBBBBBBB', '...ii...', '...ii...', '...ii...', '...ii...', '...ii...'], pal: { B: 0x2e3440, w: 0x1a1e26, i: 0x3a3a44 }, size: 3 },
  'hub-desk': { rows: ['..............', 'KKKKKKKKKKKKKK', 'KwwwwwwwwwwwwK', 'KKKKKKKKKKKKKK', 'K............K', 'K............K', 'KKKKKKKKKKKKKK'], pal: { K: 0xc4a25c, w: 0x2a2230 }, size: 4 },
  'hub-booth': { rows: ['..GGGG..', '.GggggG.', 'BBBBBBBB', 'BwwwwwwB', 'BwwwwwwB', 'BBBBBBBB', 'B......B', 'B......B', 'BBBBBBBB'], pal: { G: 0x2e6a4a, g: 0x50c878, B: 0x4a3a2a, w: 0xf2e6cc }, size: 4 },
  'hub-phone': { rows: ['BBBBBB', 'BbbbbB', 'BbGGbB', 'BbbbbB', 'BBBBBB', 'B....B', 'B....B', 'B....B'], pal: { B: 0x8a2c2c, b: 0xa83a3a, G: 0x88b8d8 }, size: 4 },
  'hub-fountain': { rows: ['....ww....', '...wwww...', '..wwWWww..', 'FFFFFFFFFF', 'FwwwwwwwwF', 'FFFFFFFFFF', '.FFFFFFFF.', '..FFFFFF..'], pal: { w: 0x88b8d8, W: 0xf0fff8, F: 0xd8cbb0 }, size: 4 },
  'hub-fountain-dry': { rows: ['..........', '..........', '..........', 'FFFFFFFFFF', 'FddddddddF', 'FFFFFFFFFF', '.FFFFFFFF.', '..FFFFFF..'], pal: { d: 0x8a8478, F: 0xb8a98c }, size: 4 },
  'hub-cart': { rows: ['BBBBBBBBBB', 'B........B', 'BBBBBBBBBB', '.kk....kk.'], pal: { B: 0x6a5a3a, k: 0x2a2a30 }, size: 4 },
  'hub-flowers': { rows: ['.rrr.yyy.pp.', 'rrrryyyypppp', '.gg..gg..gg.', 'BBBBBBBBBBBB', 'B..........B', 'BBBBBBBBBBBB', '.kk......kk.'], pal: { r: 0xe86a6a, y: 0xf2d580, p: 0xc88ad8, g: 0x6a9a5a, B: 0x6a5a3a, k: 0x2a2a30 }, size: 3 },
  'hub-kiosk': { rows: ['GGGGGGGGGGGG', 'GggggggggggG', 'BBBBBBBBBBBB', 'BwwBwwBwwBwB', 'BwwBwwBwwBwB', 'BBBBBBBBBBBB', 'B..........B', 'B..........B'], pal: { G: 0x2e6a4a, g: 0x50c878, B: 0x4a3a2a, w: 0xf2e6cc }, size: 4 },
  'hub-shoeshine': { rows: ['..BBBBBB..', '..B....B..', 'BBBBBBBBBB', 'B........B', 'BBBBBBBBBB', '.b......b.', '.b......b.'], pal: { B: 0x8a3a3a, b: 0x3a2a22 }, size: 4 },
  'hub-door': { rows: ['KKKKKKKKKKKK', 'KggggKKggggK', 'KggggKKggggK', 'KggggKKggggK', 'KggggKKggggK', 'KggggKKggggK', 'KggggKKggggK', 'KggggKKggggK', 'KggggKKggggK', 'KKKKKKKKKKKK'], pal: { K: 0xc4a25c, g: 0x88b8d8 }, size: 4 },
  'hub-chain': { rows: ['c..c..c..c..c', '.cc.cc.cc.cc.'], pal: { c: 0x8a8a90 }, size: 3 },
  'hub-cafe': { rows: ['RRRRRRRRRRRRRRRR', 'rRrRrRrRrRrRrRrR', '....BBBBBBBB....', '....B......B....', '....BBBBBBBB....', '.....b....b.....'], pal: { R: 0xc03a2a, r: 0xf2e6cc, B: 0x5a4632, b: 0x3a2a22 }, size: 4 },
  'hub-dumbwaiter': { rows: ['BBBBBB', 'BwwwwB', 'BwwwwB', 'BwwwwB', 'BBBBBB', '..ii..'], pal: { B: 0x4a3a2a, w: 0x2a2230, i: 0x8a8a90 }, size: 4 },
  'hub-cage': { rows: ['BBBBBBBBBB', 'B.B.B.B.BB', 'B.B.B.B.BB', 'B.B.B.B.BB', 'B.B.B.B.BB', 'BBBBBBBBBB'], pal: { B: 0x4a4a52 }, size: 4 },
  'hub-suitcase': { rows: ['..hh..', 'BBBBBB', 'BbbbbB', 'BbbbbB', 'BBBBBB'], pal: { h: 0x2a2a30, B: 0x6a5a3a, b: 0x8a7a52 }, size: 3 },
  'hub-suitcase-tag': { rows: ['..hh..', 'BBBBBB', 'BbbbbB', 'BbbbTB', 'BBBBBB'], pal: { h: 0x2a2a30, B: 0x6a5a3a, b: 0x8a7a52, T: 0xf2e6cc }, size: 3 },
  'hub-lever': { rows: ['...r..', '...r..', '...r..', 'BBBBBB', 'BBBBBB'], pal: { r: 0xc03a2a, B: 0x3a3a44 }, size: 4 },
  'hub-turnstile': { rows: ['..ii..', 'iiiiii', '..ii..', 'iiiiii', '..ii..', '..ii..', '..ii..'], pal: { i: 0x6a6a72 }, size: 4 },
  'hub-counter': { rows: ['BBBBBBBBBB', 'BwwBwwBwwB', 'BwwBwwBwwB', 'BBBBBBBBBB'], pal: { B: 0x2a2a30, w: 0xf2e6cc }, size: 3 },
  'hub-loft': { rows: ['..BBBBBB..', '.BBBBBBBB.', 'BB.BB.BB.B', 'BBBBBBBBBB', 'BB.BB.BB.B', 'BBBBBBBBBB'], pal: { B: 0x5a4632 }, size: 4 },
  'hub-watertower': { rows: ['..TTTTTT..', '.TTTTTTTT.', 'TTTTTTTTTT', 'TTTTTTTTTT', 'TTTTTTTTTT', '.TTTTTTTT.', '.l..ll..l.', '.l..ll..l.', '.l..ll..l.'], pal: { T: 0x6a5a4a, l: 0x3a3a44 }, size: 4 },
  'hub-kite': { rows: ['....r....', '...rrr...', '..rrrrr..', '.rrrrrrr.', '..rrrrr..', '...rrr...', '....r....', '....t....', '...t.t...'], pal: { r: 0xe86a6a, t: 0xf2d580 }, size: 3 },
  'hub-pigeon': { rows: ['..gg.', '.gggg', 'ggggg', '.gg..', '.k.k.'], pal: { g: 0x8a8a98, k: 0xd8a840 }, size: 2 },
  'hub-clock': { rows: ['..BBBBBB..', '.BwwwwwwB.', 'BwwwwwwwwB', 'BwwwhwwwwB', 'BwwwhhhwwB', 'BwwwwwwwwB', '.BwwwwwwB.', '..BBBBBB..'], pal: { B: 0x4a3a2a, w: 0xf2e6cc, h: 0x2a2230 }, size: 4 },
  'hub-hatch': { rows: ['BBBBBBBB', 'B......B', 'B......B', 'BBBBBBBB'], pal: { B: 0x3a3a44 }, size: 4 },
  'hub-rain': { rows: ['r', 'r', 'r', 'r', 'r', 'r', 'r', 'r', 'r', 'r'], pal: { r: 0xb8c8d8 }, size: 1 },
  'hub-teapot': { rows: ['..BB..', '.BBBB.', 'BBBBBB', 'BBBBBB', '.BBBB.'], pal: { B: 0xc4a25c }, size: 3 },
};

// A train body in a dream's livery. The emblem sits on the middle car so the
// train can be told apart from its neighbours at a glance.
const TRAIN_ROWS = [
  '..RRRRRRRRRRRRRRRRRRRRRRRRRRRR..',
  '.RttttttttttttttttttttttttttttR.',
  'RRWWWWRRWWWWRReeeeRRWWWWRRWWWWRR',
  'RRWWWWRRWWWWRReeeeRRWWWWRRWWWWRR',
  'RRRRRRRRRRRRRReeeeRRRRRRRRRRRRRR',
  'RttttttttttttteeeetttttttttttttR',
  'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR',
  '..kk..kk..............kk..kk....',
];
const EMBLEMS = {
  cloche: ['.ee.', 'eEEe', 'EEEE', 'eeee'],
  trumpet: ['..EE', '.EEE', 'EEE.', 'eE..'],
  stripe: ['EEEE', 'eeee', 'EEEE', 'eeee'],
  palette: ['eEEe', 'EeEE', 'EEeE', 'eEEe'],
  chart: ['e..E', 'e.EE', 'eEEE', 'EEEE'],
  wings: ['E..E', 'EEEE', '.EE.', '..e.'],
  star: ['.eE.', 'eEEe', 'EEEE', 'e..e'],
  cross: ['.EE.', 'EEEE', 'EEEE', '.EE.'],
};
export function createTrainTexture(scene, id, livery) {
  const key = `hub-train-${id}`;
  if (scene.textures.exists(key)) return key;
  const emblem = EMBLEMS[livery.emblem] || EMBLEMS.stripe;
  const rows = TRAIN_ROWS.map((r, y) => {
    if (y < 2 || y > 5) return r;
    const er = emblem[y - 2];
    return r.slice(0, 14) + er + r.slice(18);
  });
  return createPixelTexture(scene, key, rows, { R: livery.body, t: livery.trim, W: livery.window, e: livery.trim, E: livery.window, k: 0x2a2a30 }, 4);
}
// a dark, unlit version for lines that are not running
export function createDeadTrainTexture(scene, id) {
  const key = `hub-train-${id}-dark`;
  if (scene.textures.exists(key)) return key;
  return createPixelTexture(scene, key, TRAIN_ROWS, { R: 0x2e2e36, t: 0x3a3a44, W: 0x1e1e26, e: 0x2e2e36, E: 0x3a3a44, k: 0x1a1a20 }, 4);
}

export function createHubTextures(scene) {
  for (const [who, def] of Object.entries(HUB_PEOPLE)) {
    createFrames(scene, `hub-${who}`, def.art, def.pal, 2, RIM);
  }
  createFrames(scene, 'hub-traveler', TRAVELER, TRAVELER_PAL, 2);
  for (const [key, p] of Object.entries(PROPS)) {
    createPixelTexture(scene, key, p.rows, p.pal, p.size, key === 'hub-train' || key === 'hub-rain' ? {} : RIM);
  }
}
