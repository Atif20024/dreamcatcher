import { createPixelTexture } from '../../utils/pixelart.js';
import { CAST, EXTRAS } from './cast.js';

// THE LONG EVENING — people, animals and things, as string art like the rest
// of the game. Grids are padded to their widest row so a typo can't shear one.
const RIM = { outline: 0x14141c };
const norm = (rows) => {
  const w = Math.max(...rows.map((r) => r.length));
  return rows.map((r) => r.padEnd(w, '.'));
};
function mk(scene, key, rows, pal, size = 3, rim = true) {
  return createPixelTexture(scene, key, norm(rows), pal, size, rim ? RIM : {});
}

// --- people: 16x24 @2 like Jo; kids are the same grid drawn at 0.72 --------
const HATS = {
  none: ['................', '................', '................', '................'],
  scarf: ['................', '................', '....HHHHHHHH....', '...HHHHHHHHHH...'],
  cap: ['................', '................', '....HHHHHHHH....', '..HHHHHHHHHHhh..'],
  broom: ['................', '................', '....HHHHHHHH....', '..HHHHHHHHHHhh..'],
  tuft: ['................', '................', '......HHHH......', '....HHHHHHHH....'],
  peaked: ['................', '....HHHHHHHH....', '...HHHHHHHHHH...', '..hhhhhhhhhhhh..'],
  bun: ['................', '.......HH.......', '.....HHHHHH.....', '....HHHHHHHH....'],
  beanie: ['................', '.....HHHHHH.....', '....HHHHHHHH....', '....hhhhhhhh....'],
  baker: ['.....HHHHHH.....', '....HHHHHHHH....', '....HHHHHHHH....', '....hhhhhhhh....'],
  straw: ['................', '.....HHHHHH.....', '....HHHHHHHH....', '.hhhhhhhhhhhhhh.'],
  bob: ['................', '.....HHHHHH.....', '....HHHHHHHH....', '...HHHHHHHHHH...'],
  veil: ['......HHHH......', '.....HHHHHH.....', '...HHHHHHHHHH...', '..H.HHHHHHHH.H..'],
};
const HEAD = ['.....SSSSSS.....', '....SSSSSSSS....', '....SbSSSSbS....', '....SSSSSSSS....', '.....SSSSSS.....'];
const HEAD_LAUGH = ['.....SSSSSS.....', '....SSSSSSSS....', '....SbbSSbbS....', '....SSSbbSSS....', '.....SSSSSS.....'];
const TORSO = ['....TTTTTTTT....', '..TTTTTTTTTTTT..', '.TTtTTTTTTTTtTT.', '.TTtTTTTTTTTtTT.', '.TTtTTTTTTTTtTT.', '.SSTTTTTTTTTTSS.', '....TTTTTTTT....'];
const LEGS = {
  stand: ['....PPPPPPPP....', '....PPPPPPPP....', '....PPP..PPP....', '....PPP..PPP....', '....ppp..ppp....', '....ppp..ppp....', '..BBBB....BBBB..', '..BBBB....BBBB..'],
  stride: ['....PPPPPPPP....', '...PPPPPPPPPP...', '...PPP....PPP...', '..PPP......PPP..', '..ppp......ppp..', '.ppp........ppp.', '.BBBB......BBBB.', 'BBBB........BBBB'],
  sit: ['................', '................', '....PPPPPPPP....', '..PPPPPPPPPPPP..', '..PPPPPPPPPPPP..', '..ppp......ppp..', '..ppp......ppp..', '..BBB......BBB..'],
};
const HELD = {
  basket: [[15, 11, 'aAAAa'], [16, 11, 'AAAAA'], [17, 12, 'AAA']],
  accordion: [[14, 11, 'AAAAA'], [15, 11, 'AaAaA'], [16, 11, 'AAAAA'], [17, 11, 'AaAaA']],
  rope: [[9, 13, 'aa'], [10, 14, 'a'], [11, 14, 'a'], [12, 14, 'a'], [13, 13, 'aa']],
  string: [[13, 14, '.A'], [12, 15, 'A']],
  tray: [[15, 12, 'AAAA'], [16, 12, 'aAAa']],
  rod: [[3, 15, 'a'], [4, 14, 'a'], [5, 14, 'a'], [6, 13, 'a'], [7, 13, 'a'], [8, 12, 'a'], [9, 12, 'a'], [10, 12, 'a'], [11, 11, 'a'], [12, 11, 'a'], [13, 11, 'a'], [14, 12, 'A']],
  book: [[14, 12, 'AAA'], [15, 12, 'AaA']],
  bass: [[9, 13, 'aa'], [10, 12, 'AAa'], [11, 12, 'AAA'], [12, 12, 'AAA'], [13, 12, 'AAA'], [14, 12, 'AAA'], [15, 13, 'A']],
  can: [[15, 12, 'AAa'], [16, 12, 'AAA'], [17, 12, 'AA']],
  brush: [[16, 13, 'AA.'], [17, 13, '.A.']],
  broom: [[13, 14, '.A'], [14, 14, '.A'], [15, 14, '.A'], [16, 14, '.A'], [17, 14, '.A'], [18, 13, 'aAa'], [19, 13, 'aaa']],
};
function person(hat, head, legs, held) {
  const rows = [...(HATS[hat] || HATS.none), ...head, ...TORSO, ...legs].map((r) => [...r]);
  if (held && HELD[held]) {
    for (const [y, x, chars] of HELD[held]) {
      [...chars].forEach((ch, i) => {
        if (ch !== '.' && rows[y] && rows[y][x + i] !== undefined) rows[y][x + i] = ch;
      });
    }
  }
  return rows.map((r) => r.join(''));
}
function personPal(pal) {
  return { H: pal.H, h: pal.h ?? pal.H, S: pal.S, b: 0x1a1a20, T: pal.T, t: pal.t, P: pal.P, p: pal.t, B: pal.B, A: pal.A ?? 0xe8e4d8, a: 0x6a5a4a };
}
export function createPersonTextures(scene, key, look) {
  const pal = personPal(look.pal);
  const hat = look.hat || 'none';
  createPixelTexture(scene, key, person(hat, HEAD, LEGS.stand, look.held), pal, 2, RIM);
  createPixelTexture(scene, `${key}#1`, person(hat, HEAD, LEGS.stride, look.held), pal, 2, RIM);
  createPixelTexture(scene, `${key}-sit`, person(hat, HEAD, LEGS.sit, look.held), pal, 2, RIM);
  createPixelTexture(scene, `${key}-laugh`, person(hat, HEAD_LAUGH, LEGS.stand, look.held), pal, 2, RIM);
  createPixelTexture(scene, `${key}-sitlaugh`, person(hat, HEAD_LAUGH, LEGS.sit, look.held), pal, 2, RIM);
  // the same person with empty hands, for when they put their thing down
  createPixelTexture(scene, `${key}-free`, person(hat, HEAD, LEGS.stand, null), pal, 2, RIM);
  createPixelTexture(scene, `${key}-free#1`, person(hat, HEAD, LEGS.stride, null), pal, 2, RIM);
}

// --- animals -----------------------------------------------------------------
const CAT = {
  sit: ['......c.c', '......ccc', '.....cecc', 'c...ccccd', 'c..cccccd', '.ccccccd.', '..cc.cc..'],
  walk0: ['.......c.c', 'c......ccc', '.c.....cec', '..cccccccd', '..ccccccd.', '..c.c..c.c'],
  walk1: ['.......c.c', 'c......ccc', '.c.....cec', '..cccccccd', '..ccccccd.', '...c.cc.c.'],
  sleep: ['...cccc...', '.ccccdccc.', 'cccccccccc', '.cccccccc.'],
  up: ['......c.c', '......ccc', '.....ceec', 'c...ccccd', 'c..cccccd', '.ccccccd.', '..cc.cc..'],
};
export const CAT_COATS = [
  { c: 0xe8843a, d: 0xf8c890 }, // ginger
  { c: 0x2a2a30, d: 0x3a3a44 }, // black
  { c: 0x8a8a94, d: 0xb8b8c0 }, // grey
  { c: 0xf2ece0, d: 0xd8d0c0 }, // white
  { c: 0x9a7a52, d: 0x5a4a32 }, // tabby
  { c: 0xe8e0d0, d: 0xe8843a }, // calico
  { c: 0x1e1e26, d: 0xf2ece0 }, // tuxedo
];
const DOG = {
  lie: ['.........dd.', '........dddn', 'dddddddddddd', '.ddddddddd..', '.DD....DD...'],
  sit: ['......dd.', '.....dddn', '.....ddd.', '....dddd.', 'd..ddddd.', '.ddddddd.', '..DD.DD..', '..DD.DD..'],
  walk0: ['.........dd.', '........dddn', 'd.......ddd.', '.dddddddddd.', '.ddddddddd..', '.D..D...D..D', 'D....D.D....'],
  walk1: ['.........dd.', '........dddn', 'd.......ddd.', '.dddddddddd.', '.ddddddddd..', '..D.D....DD.', '..D..D...D..'],
};
const DOG_PAL = { d: 0x9a7a5a, D: 0x6a5040, n: 0x1a1a20 };

// --- props ---------------------------------------------------------------------
const WOOD = 0x7a5a3a;
const PROPS = {
  'ev-bench': { size: 4, pal: { B: WOOD, b: 0x5a4028 }, rows: ['BBBBBBBBBBBB', 'b..........b', 'BBBBBBBBBBBB', '.b........b.', '.b........b.'] },
  'ev-arch': {
    size: 4,
    pal: { S: 0xd8c8a8, s: 0xb8a482, v: 0x5a8a4a, V: 0x7aaa5a },
    rows: [
      '.....SSSSSSSSSS.....', '...SSSSSSvSSSSSSS...', '..SSSSSvVv.SSSSSSS..', '.SSSSSS......SSSSSS.', '.SSSSS........SSSSS.',
      'SSSSv..........SSSSS', 'SSSVv..........vSSSS', 'SSSSs..........VvSSS', 'SSSSs..........sSSSS', 'SSSvs..........sSSSS',
      'SSSSs..........sSSSS', 'SSSSs..........sSSvS', 'SSSSs..........sSVvS', 'SSSSs..........sSSSS', 'SSvSs..........sSSSS',
      'SVvSs..........sSSSS', 'SSSSs..........sSSSS', 'SSSSs..........sSSSS', 'SSSSs..........sSSvS', 'SSSSs..........sSSSS',
      'SSSSs..........sSSSS', 'SSSvs..........sSSSS', 'ssssss........ssssss',
    ],
  },
  'ev-tree': {
    size: 4,
    pal: { L: 0x6a9a4a, l: 0x4a7a3a, W: 0x5a4028, r: 0xd83a2a },
    rows: [
      '........LLLLLL..........', '.....LLLLLLLLLLLL.......', '...LLLLLlLLLLLLLLLL.....', '..LLLLLLLLLLlLLLLLLLL...',
      '.LLLLlLLLLLLLLLLLlLLLL..', '.LLLLLLLLLLLLLLLLLLLLLL.', 'LLLLLLLLLLLLlLLLLLLLLLLL', 'LLLlLLLLLLLLLLLLLLLLLLLL',
      '.LLLLLLLLLLLLLLLLLlLLLL.', '.LLLLLLlLLLLLLLLLLLLLL..', '..LLLLLLLLLWWLLLLLLLL...', '...llLLLLLLWWLLLLLll....',
      '.....llllWWWWlllll......', '..........WWW...........', '..........WWW...........', '..........WWW...........',
      '..........WWW...........', '..........WWWW..........', '.........WWWWW..........', '........WWW.WWW.........',
    ],
  },
  'ev-pine': {
    size: 4,
    pal: { N: 0x2e5a44, n: 0x1e4032, W: 0x4a3222 },
    rows: [
      '.....NN.....', '....NNNN....', '....NNNN....', '...NNNNNN...', '..NNnNNNNN..', '...NNNNNN...', '..NNNNNNNN..', '.NNNNnNNNNN.',
      '..NNNNNNNN..', '.NNNNNNNNNN.', 'NNNNNNNnNNNN', '.NNNNNNNNNN.', 'NNNNnNNNNNNN', 'NNNNNNNNNNNN', '.....WW.....', '.....WW.....',
    ],
  },
  'ev-fence': { size: 4, pal: { F: 0x8a6a4a }, rows: ['F.....F.....F...', 'FFFFFFFFF...F...', 'F.....F..FFFF...', 'F.....F.....F...', 'FFFFFFF.....F.FF', 'F.....F.....F...'] },
  'ev-post': { size: 4, pal: { P: 0x6a4a32 }, rows: ['PP', 'PP', 'PP', 'PP', 'PP', 'PP', 'PP', 'PP', 'PP', 'PP', 'PP', 'PP', 'PP', 'PP'] },
  'ev-sheet': { size: 3, pal: { W: 0xf2ece0, w: 0xd8d0c0, b: 0x88b8d8 }, rows: ['WWWWWWWWWW', 'WWWWWWWWWW', 'WbbWWWWWWW', 'WWWWWWWWWW', 'WWWWwWWWWW', 'WWWWWWWWbW', 'WWWWWWWWWW', 'wWWWWWWWWw', 'WWWWWWWWWW'] },
  'ev-sheet-b': { size: 3, pal: { W: 0xe8c060, w: 0xc89a3a, b: 0xc03a2a }, rows: ['WWWWWWWWWW', 'WbWbWbWbWb', 'WWWWWWWWWW', 'WWWWWWWWWW', 'WbWbWbWbWb', 'WWWWWWWWWW', 'WWWWWWWWWW', 'wWbWbWbWbw', 'WWWWWWWWWW'] },
  'ev-basket': { size: 3, pal: { A: 0xc8a870, a: 0x8a6a4a, W: 0xf2ece0 }, rows: ['.WWWW..', 'aAAAAAa', 'AaAaAaA', '.AAAAA.'] },
  'ev-door': { size: 4, pal: { D: 0x2e6a4a, d: 0x1e4a34, K: 0xc4a25c }, rows: ['DDDDDDDD', 'DddDDddD', 'DddDDddD', 'DDDDDDDD', 'DddDDddD', 'DddDDddD', 'DddDDddD', 'DDDDDDKD', 'DddDDddD', 'DddDDddD', 'DddDDddD', 'DDDDDDDD', 'DddDDddD', 'DDDDDDDD'] },
  'ev-awning': { size: 4, pal: { R: 0xc03a2a, W: 0xf2e6cc, p: 0x5a4a3a }, rows: ['pppppppppppppppppp', 'RRWWRRWWRRWWRRWWRR', 'RRWWRRWWRRWWRRWWRR', 'RRWWRRWWRRWWRRWWRR', '.R..W..R..W..R..W.'] },
  'ev-fountain': {
    size: 4,
    pal: { F: 0xe0d0b0, f: 0xb8a482, w: 0x88b8d8, k: 0x8a7a62, r: 0xe86a8a, g: 0x6a9a5a },
    rows: [
      '........FF........', '.......FFFF.......', '........FF........', '........FF........', '....FFFFFFFFFF....',
      'FFFFFFFFFFFFFFFFFF', 'Fk.k.k.krgkFwwwwwF', 'FwwwwwwwwwwwwwwwwF', 'FFFFFFFFFFFFFFFFFF', '.ffffffffffffffff.',
    ],
  },
  'ev-chess': { size: 4, pal: { T: 0x6a4a32, k: 0x1a1a20, w: 0xf2ece0 }, rows: ['..w.k..w.k', 'TTTTTTTTTT', '.T......T.', '.T......T.', '.T......T.', 'TT......TT'] },
  'ev-bakery': {
    size: 4,
    pal: { F: 0xe8c89a, f: 0xc8a070, W: 0x3a2a22, y: 0xd8a050, Y: 0xf2c878, d: 0x1e1612, D: 0x8a4a2a, K: 0xf2e6cc },
    rows: [
      'ffffffffffffffffffffffffff', 'FFFFFFFFFFFFFFFFFFFFFFFFFF', 'FKKKKKKKKKKKKKKKKKKKKKKKKF', 'FFFFFFFFFFFFFFFFFFFFFFFFFF',
      'FFFFFFFFFFFFFFFFFFFFFFFFFF', 'FWWWWWWWWWWWWFFFdddddddFFF', 'FWYyYyYyYyYyWFFFddddddDFFF', 'FWyYyYyYyYyYWFFFddddddDFFF',
      'FWWWWWWWWWWWWFFFddddddDDFF', 'FWYyYyYyYyYyWFFFddddddDDFF', 'FWyYyYyYyYyYWFFFddddddDDFF', 'FWWWWWWWWWWWWFFFddddddDDFF',
      'FFFFFFFFFFFFFFFFddddddDDFF', 'FFFFFFFFFFFFFFFFddddddDDFF', 'FFFFFFFFFFFFFFFFddddddDDFF', 'ffffffffffffffffffffffffff',
    ],
  },
  'ev-postbox': { size: 4, pal: { R: 0xc03a2a, r: 0x8a2a20, k: 0x1a1a20, y: 0xf2d580 }, rows: ['.RRR.', 'RRRRR', 'RkkkR', 'RRRRR', 'RRyRR', 'RRRRR', 'RRRRR', 'RRRRR', 'rrrrr', '.r.r.'] },
  'ev-teastall': {
    size: 4,
    pal: { G: 0x2e6a4a, g: 0x50c878, B: 0x6a4a32, w: 0xf2e6cc, K: 0xc4a25c, k: 0x2a2a30 },
    rows: ['GGGGGGGGGGGGGGGG', 'gGgGgGgGgGgGgGgG', '.B............B.', '.B...KK.......B.', '.B..KKKK..wwww.B', 'BBBBBBBBBBBBBBBB', 'B..............B', 'BBBBBBBBBBBBBBBB', '.k............k.'],
  },
  'ev-lamp': { size: 4, pal: { L: 0x2e2e38, Y: 0xf2d580 }, rows: ['.LLL.', 'LYYYL', 'LYYYL', '.LLL.', '..L..', '..L..', '..L..', '..L..', '..L..', '..L..', '..L..', '..L..', '..L..', '..L..', '..L..', '..L..', '..L..', '..L..', '..L..', '..L..', '.LLL.'] },
  'ev-narrowboat': {
    size: 4,
    pal: { G: 0x2e6a4a, g: 0x1e4a34, R: 0xc03a2a, w: 0xf2d580, Y: 0xd8b858 },
    rows: ['......GGGGGGGGGGGGGGG.....', '......GwwGGwwGGwwGGwG.....', '......GGGGGGGGGGGGGGG.....', 'RRRRRRRRRRRRRRRRRRRRRRRRRR', '.gggYggggggggggggggggYggg.', '...gggggggggggggggggggg...'],
  },
  'ev-rowboat': { size: 4, pal: { B: 0x8a5a34, b: 0x5a3a22, w: 0xf2e6cc }, rows: ['B............B', 'BBwBBBBBBBBwBB', '.bBBBBBBBBBBb.', '..bbbbbbbbbb..'] },
  'ev-bikestall': {
    size: 4,
    pal: { T: 0x6a4a32, k: 0x1a1a20, s: 0x8a8a94, R: 0xc03a2a },
    rows: ['TTTTTTTTTTTTTTTT', '.T............T.', '.T..s......s..T.', '.T.kkk.RR.kkk.T.', '.Tk.s.kRRk.s.kT.', '.Tk.s.RRRk.s.kT.', '.T.kkk....kkk.T.', '.T............T.'],
  },
  'ev-cart': { size: 4, pal: { B: 0x8a6a4a, b: 0x5a4028, k: 0x2a2a30, y: 0xe8a030 }, rows: ['.yy.yy.yy.', 'BBBBBBBBBB', 'B........B', 'BBBBBBBBBB', '.kk....kk.', '.kk....kk.'] },
  'ev-loft': { size: 4, pal: { B: 0x6a5a4a, b: 0x3a2e24 }, rows: ['....BBBB....', '..BBBBBBBB..', 'BBBBBBBBBBBB', 'BbbBBbbBBbbB', 'BbbBBbbBBbbB', 'BBBBBBBBBBBB', 'BbbBBbbBBbbB', 'BBBBBBBBBBBB', '.b........b.', '.b........b.'] },
  'ev-tank': { size: 4, pal: { T: 0x6a6e7a, t: 0x4a4c54, l: 0x3a3a44 }, rows: ['..TTTTTT..', '.TTTTTTTT.', 'TTTTTTTTTT', 'TtTTTTTTtT', 'TTTTTTTTTT', 'TtTTTTTTtT', 'TTTTTTTTTT', '.TTTTTTTT.', '.l..ll..l.', '.l..ll..l.', '.l..ll..l.'] },
  'ev-kite': { size: 3, pal: { r: 0xe86a6a, y: 0xf2d580, t: 0xf2e6cc }, rows: ['....r....', '...rry...', '..rrryy..', '.rrrryyy.', '..rrryy..', '...rry...', '....r....', '....t....', '...t.t...'] },
  'ev-chillies': { size: 3, pal: { s: 0xc8b890, r: 0xd83a2a, R: 0xa82a20 }, rows: ['ssssssssssss', 'r.R.r.R.r.R.', 'r.R.r.R.r.R.'] },
  'ev-charpoy': { size: 4, pal: { B: 0x8a6a4a, r: 0xd8c8a0 }, rows: ['BBBBBBBBBBBBBB', 'BrrrrrrrrrrrrB', 'B............B', 'B............B'] },
  'ev-ball': { size: 3, pal: { w: 0xf2ece0, k: 0x2a2a30 }, rows: ['.wk.', 'wwkw', 'kwww', '.ww.'] },
  'ev-swingset': { size: 4, pal: { F: 0x3a6a8a, r: 0x8a8a94, s: 0x8a5a34 }, rows: ['FFFFFFFFFFFFFF', 'F..r......r..F', 'F..r......r..F', 'F..r......r..F', 'F..r......r..F', 'F..r......r..F', 'F..ss.....r..F', 'F.........ss.F', 'F............F', 'F............F', 'F............F', 'F............F', 'FF..........FF'] },
  'ev-gate': { size: 4, pal: { G: 0x2e3a52 }, rows: ['G.G.G.G.G.', 'GGGGGGGGGG', 'G.G.G.G.G.', 'G.G.G.G.G.', 'G.G.G.G.G.', 'G.G.G.G.G.', 'GGGGGGGGGG', 'G.G.G.G.G.'] },
  'ev-greenhouse': {
    size: 4,
    pal: { g: 0xb8d8e0, G: 0x8ab8c8, F: 0xe8e4d8, p: 0x6a9a4a },
    rows: ['.........FF.........', '.......FFggFF.......', '.....FFggggggFF.....', '...FFggggGgggggFF...', '.FFggggggggggggggFF.', 'FgggFggggFggggFgggF.', 'FgggFggggFggggFgggF.', 'FgpgFgpggFggpgFgpgF.', 'FpppFpppgFgpppFpppF.', 'FFFFFFFFFFFFFFFFFFF.'],
  },
  'ev-hive': { size: 4, pal: { Y: 0xe8c060, y: 0xb8903a, k: 0x3a2a22 }, rows: ['.YYY.', 'YYYYY', 'yyyyy', 'YYkYY', 'yyyyy', 'YYYYY'] },
  'ev-scarecrow': {
    size: 4,
    pal: { H: 0xc8a050, S: 0xe8d8b0, C: 0x6a4a5a, c: 0x4a3240, W: 0x8a6a4a, k: 0x1a1a20 },
    rows: ['...HHHH...', '.HHHHHHHH.', '...SSSS...', '...SkSk...', '...SSSS...', 'CCCCCCCCCC', 'CcCCCCCCcC', 'C.CCCCCC.C', '...CCCC...', '...CcCC...', '...CCCC...', '....WW....', '....WW....', '....WW....', '....WW....', '...WWWW...'],
  },
  'ev-can': { size: 3, pal: { G: 0x3a7a5a, g: 0x2a5a42 }, rows: ['..GGG.', 'G.G.GG', '.GGGGG', '.GGGG.', '.gggg.'] },
  'ev-shed': { size: 4, pal: { B: 0x6a5a3a, b: 0x4a3a22, R: 0x8a8a94, k: 0x2a2a30 }, rows: ['RRRRRRRRRRRR', 'BBBBBBBBBBBB', 'B.bbbb.....B', 'B.bbbb.kkk.B', 'B......kkk.B', 'B......kkk.B', 'B......kkk.B', 'BBBBBBBBBBBB'] },
  'ev-board': { size: 4, pal: { F: 0x2a2a30, f: 0x14141c, K: 0xc4a25c }, rows: ['KKKKKKKKKKKKKKKKKK', 'KffffffffffffffffK', 'KffffffffffffffffK', 'KffffffffffffffffK', 'KKKKKKKKKKKKKKKKKK', '..F............F..', '..F............F..', '..F............F..', '..F............F..', '..F............F..', '..F............F..', '..F............F..'] },
  'ev-hedge': { size: 4, pal: { L: 0x3a6a3a, l: 0x2a5230, y: 0x5a8a4a }, rows: ['lLLyLlLL', 'LLLLLLyL', 'LyLLlLLL', 'LLLLLLLl', 'lLLyLLLL', 'LLLLLyLL', 'LlLLLLLl', 'LLLyLLLL'] },
  'ev-wheat': { size: 3, pal: { y: 0xe8c060, Y: 0xc89a3a }, rows: ['.y.', 'yYy', '.Y.', '.Y.', 'YY.', '.Y.'] },
  'ev-tractor': { size: 4, pal: { R: 0xc03a2a, r: 0x8a2a20, k: 0x1a1a20, w: 0x88b8d8 }, rows: ['.......RRR......', '.......RwR......', 'RRRRRRRRRR......', 'RRRRRRRRRRRRR...', 'rrrrrrrrrrrrr...', '.kk.....kkkkk...', 'kkkk...kkkkkkk..', '.kk.....kkkkk...'] },
  'ev-horsecart': { size: 4, pal: { B: 0x8a6a4a, b: 0x5a4028, k: 0x2a2a30 }, rows: ['BBBBBBBBBB....', 'B........B....', 'BBBBBBBBBBbbbb', '...kkk........', '..k.k.k.......', '...kkk........'] },
  'ev-mill': {
    size: 4,
    pal: { S: 0xc8b898, s: 0xa8987a, R: 0x6a3a2a, k: 0x2a2230, y: 0xf2d580 },
    rows: ['.....RRRRRR.....', '...RRRRRRRRRR...', '.RRRRRRRRRRRRRR.', '..SSSSSSSSSSSS..', '..SSSSSSSSSSSS..', '..SSykSSSSSykS..', '..SSSSSSSSSSSS..', '..SSSSSSSSSSSS..', '..SSSSSkkSSSSS..', '..SSSSSkkSSSSS..', '..ssssskksssss..'],
  },
  'ev-wheel': { size: 4, pal: { W: 0x5a4028 }, rows: ['...WWWW...', '.WW.WW.WW.', '.W..WW..W.', 'W...WW...W', 'WWWWWWWWWW', 'WWWWWWWWWW', 'W...WW...W', '.W..WW..W.', '.WW.WW.WW.', '...WWWW...'] },
  'ev-firering': { size: 4, pal: { s: 0x6a6a72, S: 0x8a8a94, W: 0x4a3222 }, rows: ['..W..W..', 'SsSWWsSs', 'sSsSsSsS'] },
  'ev-cairn': { size: 4, pal: { S: 0x9a9aa4, s: 0x6a6a72 }, rows: ['...SS...', '..SsSS..', '...SS...', '..SSSs..', '.SsSSSS.', '..SSSS..', '.SSsSSSs', 'SSSSSsSS', 'sSSSSSSs'] },
  'ev-stick': { size: 3, pal: { W: 0x6a4a2a }, rows: ['WWWWW.W.', '.....W..'] },
  'ev-camera': { size: 3, pal: { k: 0x2a2a30, s: 0x8a8a94, w: 0x88b8d8 }, rows: ['.k...', 'kkkkk', 'kswks', 'kkkkk'] },
  'ev-loaf': { size: 4, pal: { y: 0xd8a050, Y: 0xa87030 }, rows: ['.yyyy.', 'yYyYyy', 'YYYYYY'] },
  'ev-tray': { size: 3, pal: { T: 0x8a8a94, y: 0xd8a050 }, rows: ['.yy.yy.yy.', 'TTTTTTTTTT'] },
  'ev-shoes': { size: 3, pal: { B: 0x1e1e28 }, rows: ['.BBB..BBB.', 'BBBB.BBBB.'] },
  'ev-snowball': { size: 3, pal: { w: 0xf2f6ff, W: 0xd8e0f0 }, rows: ['.www.', 'wwwww', 'wwwwW', 'wwwWW', '.WWW.'] },
  'ev-snowbody': { size: 4, pal: { w: 0xf2f6ff, W: 0xd8e0f0, k: 0x2a2a30 }, rows: ['..wwww..', '.wwwwww.', 'wwwkwwww', 'wwwwwwww', 'wwwkwwwW', 'wwwwwwWW', '.wwwwWW.', '..WWWW..'] },
  'ev-umbrella': { size: 3, pal: { R: 0x3a5a80, r: 0x2a4460, k: 0x2a2a30 }, rows: ['...RRRRR...', '.RRRRRRRRR.', 'RRrRRrRRrRR', '.....k.....', '.....k.....', '.....k.....', '....kk.....'] },
  'ev-balloon': {
    size: 3,
    pal: { R: 0xe86a6a, Y: 0xf2d580, B: 0x3a5a80, k: 0x5a4028 },
    rows: ['...RYYBR...', '..RRYYBBR..', '.RRRYYBBRR.', 'RRRRYYBBRRR', 'RRRRYYBBRRR', 'RRRRYYBBRRR', '.RRRYYBBRR.', '..RRYYBBR..', '...RYYBR...', '....k.k....', '....k.k....', '...kkkkk...', '...kkkkk...'],
  },
  'ev-radio': { size: 3, pal: { R: 0x8a4a2a, k: 0x2a2a30, y: 0xf2d580 }, rows: ['..k..', 'RRRRR', 'RkRyR', 'RRRRR'] },
  'ev-owl': { size: 3, pal: { o: 0x8a6a4a, O: 0xb89a6a, e: 0xf2d580, b: 0x2a2230 }, rows: ['o...o', 'ooooo', 'oeoeo', 'OObOO', 'OOOOO', '.o.o.'] },
  'ev-deer': { size: 3, pal: { d: 0x9a6a42, a: 0x6a5a4a, e: 0x1a1a20, w: 0xe8dcc8 }, rows: ['.a.a.......', '..aa.......', '..ddd......', '.dde.......', '..dd.......', '..ddddddd..', '..dddddddw.', '...ddddddd.', '...d.d..d.d', '...d.d..d.d', '...d.d..d.d'] },
  'ev-sheep': { size: 3, pal: { w: 0xe8e4d8, W: 0xc8c4b8, k: 0x2a2a30 }, rows: ['.wwwwww..', 'wwwwwwwkk', 'wwwwwWWkk', '.wwwwWW..', '.k.k..k.k'] },
  'ev-heron': { size: 3, pal: { H: 0x9aa4b0, h: 0x6a7480, Y: 0xe8c060, l: 0x6a6a52 }, rows: ['..HH....', '.HHHYY..', '..HH....', '..H.....', '..H.....', '..HH....', '.HHHH...', 'HHhHHH..', '.HHhHH..', '..HHH...', '...l....', '...l....', '..ll....'] },
  'ev-heron-fly': { size: 3, pal: { H: 0x9aa4b0, h: 0x6a7480, Y: 0xe8c060 }, rows: ['HH.......HH..', '.hHH...HHh...', '..HHHHHHHHYY.', '.....HHH.....'] },
  'ev-goat': { size: 3, pal: { g: 0xe8e0d0, G: 0xb8b0a0, h: 0x8a7a62, e: 0x1a1a20 }, rows: ['.......hh', '......ggg', 'g....gge.', '.ggggggg.', '.gGGgggg.', '.g.g..g.g', '.g.g..g.g'] },
  'ev-pigeon': { size: 2, pal: { g: 0x8a8a98, k: 0xd8a840, G: 0x6a6a78 }, rows: ['..gg.', '.gggk', 'gGggg', '.gg..', '.k.k.'] },
  'ev-pigeon-fly': { size: 2, pal: { g: 0x8a8a98, G: 0x6a6a78 }, rows: ['g.....g', 'gg.g.gg', '.ggGgg.', '...g...'] },
  'ev-swallow': { size: 2, pal: { s: 0x2a2a3a, w: 0xe8dcc8 }, rows: ['s...s', '.sss.', '..w..'] },
  'ev-leaf-0': { size: 2, pal: { a: 0xe8a030, b: 0xb87020 }, rows: ['.a.', 'aab', '.b.'], rim: false },
  'ev-leaf-1': { size: 2, pal: { a: 0xc0602a, b: 0x8a3a1a }, rows: ['aa.', 'aba', '.a.'], rim: false },
  'ev-leaf-2': { size: 2, pal: { a: 0xe8c060, b: 0xc89a3a }, rows: ['.aa', 'ab.', 'a..'], rim: false },
  'ev-apple': { size: 2, pal: { r: 0xd83a2a, g: 0x5a8a4a }, rows: ['.g.', 'rrr', 'rrr'] },
  'ev-stone': { size: 2, pal: { s: 0x8a8a94 }, rows: ['sss', '.s.'] },
  'ev-bread': { size: 2, pal: { y: 0xd8a050 }, rows: ['yyy'] },
};

export const PROP_KEYS = Object.keys(PROPS);

export function createEveningTextures(scene) {
  for (const [key, p] of Object.entries(PROPS)) mk(scene, key, p.rows, p.pal, p.size, p.rim !== false);
  for (const [id, def] of Object.entries(CAST)) createPersonTextures(scene, `ev-p-${id}`, def.look);
  EXTRAS.forEach((look, i) => createPersonTextures(scene, `ev-x-${i}`, look));
  CAT_COATS.forEach((coat, i) => {
    const pal = { c: coat.c, d: coat.d, e: 0xa8d850 };
    for (const [frame, rows] of Object.entries(CAT)) mk(scene, `ev-cat${i}-${frame}`, rows, pal, 3);
  });
  for (const [frame, rows] of Object.entries(DOG)) mk(scene, `ev-dog-${frame}`, rows, DOG_PAL, 3);

  // soft round things: a light puddle, a glow, a dot — drawn, not gridded
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  if (!scene.textures.exists('ev-dot')) {
    g.fillStyle(0xffffff, 1).fillRect(0, 0, 2, 2);
    g.generateTexture('ev-dot', 2, 2);
    g.clear();
  }
  if (!scene.textures.exists('ev-glow')) {
    for (let r = 16; r > 0; r--) {
      g.fillStyle(0xffffff, 0.06 + (1 - r / 16) * 0.1);
      g.fillCircle(16, 16, r);
    }
    g.generateTexture('ev-glow', 32, 32);
    g.clear();
  }
  // the long shadow: the sun is low in the west, so every shadow lies east
  if (!scene.textures.exists('ev-shadow')) {
    g.fillStyle(0xffffff, 1);
    g.fillPoints([{ x: 0, y: 2 }, { x: 10, y: 0 }, { x: 64, y: 3 }, { x: 64, y: 6 }, { x: 10, y: 8 }, { x: 0, y: 6 }], true);
    g.generateTexture('ev-shadow', 64, 8);
    g.clear();
  }
  if (!scene.textures.exists('ev-flake')) {
    g.fillStyle(0xffffff, 1).fillCircle(3, 3, 3);
    g.generateTexture('ev-flake', 6, 6);
    g.clear();
  }
  if (!scene.textures.exists('ev-drop')) {
    g.fillStyle(0xffffff, 1).fillRect(0, 0, 1, 9);
    g.generateTexture('ev-drop', 1, 9);
    g.clear();
  }
  g.destroy();
}
