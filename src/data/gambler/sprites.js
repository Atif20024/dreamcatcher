import Phaser from 'phaser';
import { createPixelTexture } from '../../utils/pixelart.js';
import { createPersonTextures } from '../evening/sprites.js';
import { paintTexture, stamp, grain, rgba, fbm, hex, gradientV } from '../../art/paint.js';
import { PEOPLE } from './cast.js';

// THE LAST HAND — the things: string art like the rest of the game, then the
// level-art light pass (GamblerScene calls lightThemeProps on 'gm-').
const RIM = { outline: 0x14141c };
const norm = (rows) => {
  const w = Math.max(...rows.map((r) => r.length));
  return rows.map((r) => r.padEnd(w, '.'));
};
const mk = (scene, key, rows, pal, size = 3) => createPixelTexture(scene, key, norm(rows), pal, size, RIM);

const BRASS = { b: 0x8a5a24, B: 0xe9b84a, h: 0xf6d98a };
const PROPS = {
  'gm-valet': { rows: ['..BBBBBB..', '.BhhhhhhB.', '.BhhhhhhB.', '..BBBBBB..', '....bb....', '....bb....', '....bb....', '....bb....', '....bb....', '..bbbbbb..'], pal: { ...BRASS }, size: 3 },
  'gm-door': {
    rows: ['bbbbbbbbbbbbbb', 'bBBBBBBBBBBBBb', 'bBggggBBggggBb', 'bBggggBBggggBb', 'bBggggBBggggBb', 'bBggggBBggggBb', 'bBggggBBggggBb', 'bBggggBBggggBb', 'bBggggBBggggBb', 'bBggggBBggggBb', 'bBBBBBBBBBBBBb', 'bbbbbbbbbbbbbb'],
    pal: { ...BRASS, g: 0x2a1a30 }, size: 4,
  },
  'gm-crate': { rows: ['cccccccccc', 'cCCCCCCCCc', 'cCccccccCc', 'cCCCCCCCCc', 'cccccccccc'], pal: { c: 0x4a3a2a, C: 0x7a5a3a }, size: 3 },
  'gm-fountain': {
    rows: ['.......rr.......', '......rRRr......', '.....rRRRRr.....', '....rRRRRRRr....', '...rrRRRRRRrr...', '..rRRrrRRrrRRr..', '.rRRRRRRRRRRRRr.', 'rRrRrRrRrRrRrRrr', 'bbbbbbbbbbbbbbbb', '.bBBBBBBBBBBBBb.', '..bbbbbbbbbbbb..'],
    pal: { r: 0xa8243a, R: 0xe84a5a, b: 0x8a5a24, B: 0xe9b84a }, size: 4,
  },
  'gm-piano': {
    rows: ['pppppppppppppppppp', 'pPPPPPPPPPPPPPPPPp', 'pPPPPPPPPPPPPPPPPp', 'pppppppppppppppppp', 'pwkwkwwkwkwkwwkwkp', 'pwwwwwwwwwwwwwwwwp', 'pp..............pp', 'pp..............pp'],
    pal: { p: 0x1e1a20, P: 0x2e2a32, w: 0xe8e4d8, k: 0x1a1a20 }, size: 3,
  },
  'gm-videopoker': { rows: ['.gggggggg.', 'gGGGGGGGGg', 'gGssssssGg', 'gGsrsrssGg', 'gGssssssGg', 'gGGGGGGGGg', 'gGGBBBBGGg', 'gGGGGGGGGg', 'gggggggggg', '.gg....gg.'], pal: { g: 0x2a2a34, G: 0x4a4a56, s: 0x1a3a2a, r: 0xe84a5a, B: 0xe9b84a }, size: 3 },
  'gm-firedoor': { rows: ['rrrrrrrrrr', 'rRRRRRRRRr', 'rRRRRRRRRr', 'rRRwwwwRRr', 'rRRRRRRRRr', 'rRRRRkRRRr', 'rRRRRRRRRr', 'rRRRRRRRRr', 'rRRRRRRRRr', 'rrrrrrrrrr'], pal: { r: 0x4a4a52, R: 0x7a7a86, k: 0xe9b84a, w: 0xd8ecf8 }, size: 3 },
  'gm-car': {
    rows: ['......cccccccc......', '....ccwwwwwwwwcc....', '...cwwwwwwwwwwwwc...', '..ccccccccccccccc...', '.cCCCCCCCCCCCCCCCCc.', 'cCCCCCCCCCCCCCCCCCCc', 'cCCCCCCCCCCCCCCCCCCc', 'ccccccccccccccccccccc', '..kkk..........kkk..', '..kKk..........kKk..'],
    pal: { c: 0x2a2e3a, C: 0x4a5068, w: 0x6a8aa0, k: 0x1a1a20, K: 0x4a4a52 }, size: 3,
  },
  'gm-van': {
    rows: ['cccccccccccccccc....', 'cCCCCCCCCCCCCCCcc...', 'cCCCCCCCCCCCCCCwwc..', 'cCCCCCCCCCCCCCCwwcc.', 'cCCCCCCCCCCCCCCCCCc.', 'cCCCCCCCCCCCCCCCCCcr', 'cccccccccccccccccccc', '..kkk..........kkk..', '..kKk..........kKk..'],
    pal: { c: 0x3a3a40, C: 0xd8d0c0, w: 0x6a8aa0, k: 0x1a1a20, K: 0x4a4a52, r: 0xd5443c }, size: 3,
  },
  'gm-shelter': { rows: ['ssssssssssssssss', 'sSSSSSSSSSSSSSSs', 's..............s', 's..............s', 's..............s', 's..............s', 's..............s', 's..bbbbbbbbbb..s', 's..b........b..s', 's..b........b..s'], pal: { s: 0x4a5058, S: 0x7a8a90, b: 0x6a5a3a }, size: 3 },
  'gm-booth': { rows: ['bbbbbbbbbbbb', 'bBBBBBBBBBBb', 'bBwwwwwwwwBb', 'bBwwwwwwwwBb', 'bBwwwwwwwwBb', 'bBBBBBBBBBBb', 'bBBBBkBBBBBb', 'bBBBBBBBBBBb', 'bBBBBBBBBBBb', 'bbbbbbbbbbbb'], pal: { b: 0x3a3a40, B: 0x6a6a76, w: 0x8ab0c0, k: 0xe9b84a }, size: 3 },
  'gm-staffdoor': { rows: ['dddddddddd', 'dDDDDDDDDd', 'dDDDDDDDDd', 'dDDDDDDDDd', 'dDDDDkDDDd', 'dDDDDDDDDd', 'dDDDDDDDDd', 'dDDDDDDDDd', 'dDDDDDDDDd', 'dddddddddd'], pal: { d: 0x4a4a52, D: 0x8a8a96, k: 0xe9b84a }, size: 3 },
  'gm-umbrellas': { rows: ['u.r.b.u.r.', 'u.r.b.u.r.', 'U.R.B.U.R.', 'U.R.B.U.R.', 'U.R.B.U.R.'], pal: { u: 0x2a2a3a, U: 0x4a4a6a, r: 0x6a2a2a, R: 0xa03a2a, b: 0x1e1e28, B: 0x3a3a44 }, size: 3 },
  'gm-box': { rows: ['cccccccccccc', 'cCCCCCCCCCCc', 'cCCCCCCCCCCc', 'cCwwwwwwwwCc', 'cCCCCCCCCCCc', 'cccccccccccc'], pal: { c: 0x6a4a2a, C: 0xa88a5a, w: 0xe8e4d8 }, size: 3 },
  'gm-cup': { rows: ['..rrrr..', '.rRRRRr.', '.rRRRRr.', '.rRRRRr.', 'rrrrrrrr'], pal: { r: 0x8a2a2a, R: 0xd5443c }, size: 3 },
  'gm-ball': { rows: ['..ww..', '.wWWw.', 'wWWWWw', 'wWWWWw', '.wWWw.', '..ww..'], pal: { w: 0x8a8a90, W: 0xe8e4d8 }, size: 3 },
  'gm-pocket': { rows: ['..pppppp..', '.pPPPPPPp.', 'pPPkkkkPPp', 'pPkkkkkkPp', 'pppppppppp'], pal: { p: 0x1a3a2a, P: 0x2e6a4a, k: 0x0a0a12 }, size: 3 },
  'gm-barrier-post': { rows: ['.rr.', 'rRRr', 'rRRr', 'rRRr', 'rRRr', 'rRRr', 'rRRr', 'rRRr', 'rrrr'], pal: { r: 0x4a4a52, R: 0x8a8a96 }, size: 3 },
  'gm-barrier-arm': { rows: ['rrwwrrwwrrwwrrwwrrwwrrww', 'rrwwrrwwrrwwrrwwrrwwrrww'], pal: { r: 0xd5443c, w: 0xe8e4d8 }, size: 3 },
  'gm-lift': { rows: ['bbbbbbbbbbbbbbbbbbbbbb', 'bBBBBBBBBBBBBBBBBBBBBb', 'bbbbbbbbbbbbbbbbbbbbbb'], pal: { b: 0x8a5a24, B: 0xe9b84a }, size: 4 },
  'gm-chipstack': { rows: ['rrrrrr', 'wrrrrw', 'rrrrrr', 'wrrrrw', 'rrrrrr', 'wrrrrw'], pal: { r: 0xa8243a, w: 0xe8e4d8 }, size: 3 },
  'gm-chip': { rows: ['.rrrr.', 'rwrrwr', 'rrRRrr', 'rrRRrr', 'rwrrwr', '.rrrr.'], pal: { r: 0xa8243a, R: 0xe84a5a, w: 0xe8e4d8 }, size: 3 },
  'gm-cage': {
    rows: ['bbbbbbbbbbbbbbbbbb', 'bBBBBBBBBBBBBBBBBb', 'bBgbgbgbgbgbgbgbBb', 'bBgbgbgbgbgbgbgbBb', 'bBgbgbgbgbgbgbgbBb', 'bBgbgbgbgbgbgbgbBb', 'bBgbgbgbgbgbgbgbBb', 'bBBBBBBBBBBBBBBBBb', 'bBwwwwwwwwwwwwwwBb', 'bBBBBBBBBBBBBBBBBb', 'bbbbbbbbbbbbbbbbbb'],
    pal: { b: 0x8a5a24, B: 0xe9b84a, g: 0x1a1a22, w: 0x6a4a2a }, size: 3,
  },
  'gm-window': { rows: ['gggggggggggg', 'gGGGGGGGGGGg', 'gGkkkkkkkkGg', 'gGkkkkkkkkGg', 'gGkkkkkkkkGg', 'gGGGGGGGGGGg', 'gGssssssssGg', 'gGGGGGGGGGGg', 'gggggggggggg'], pal: { g: 0x3a3a40, G: 0x6a6a76, k: 0x0e0e14, s: 0x4a4a52 }, size: 3 },
  'gm-hatch': { rows: ['gggggggggggg', 'gGGGGGGGGGGg', 'gGssssssssGg', 'gGsBBBBBBsGg', 'gGssssssssGg', 'gGGGGGGGGGGg', 'gGGhhhhhhGGg', 'gGGGGGGGGGGg', 'gggggggggggg'], pal: { g: 0x3a3a40, G: 0x6a6a76, s: 0x1e1e28, B: 0xe9b84a, h: 0xc8c0b0 }, size: 3 },
  'gm-safe': { rows: ['ssssssssssss', 'sSSSSSSSSSSs', 'sSSSSkkSSSSs', 'sSSSkKKkSSSs', 'sSSSkKKkSSSs', 'sSSSSkkSSSSs', 'sSSSSSSSSSSs', 'sSSrrrrrrSSs', 'sSSSSSSSSSSs', 'ssssssssssss'], pal: { s: 0x2a2a30, S: 0x5a5a66, k: 0x8a5a24, K: 0xe9b84a, r: 0xd5443c }, size: 3 },
  'gm-wheel': { rows: ['...bbbbbb...', '..brRrRrRb..', '.bRrRrRrRrb.', 'brRrRrRrRrRb', 'brRrRrkkRrRb', 'bRrRrRkkrRrb', 'brRrRrRrRrRb', '.bRrRrRrRrb.', '..brRrRrRb..', '...bbbbbb...'], pal: { b: 0x8a5a24, r: 0xa8243a, R: 0x1a1a22, k: 0xe9b84a }, size: 4 },
  'gm-dice': { rows: ['wwwwww', 'wWkWWw', 'wWWWWw', 'wWWWWw', 'wWWkWw', 'wwwwww'], pal: { w: 0xc8c0b0, W: 0xf2eee4, k: 0x1a1a20 }, size: 3 },
  'gm-vent': { rows: ['vvvvvvvvvv', 'vVVVVVVVVv', 'vvvvvvvvvv', 'vVVVVVVVVv', 'vvvvvvvvvv'], pal: { v: 0x3a3a40, V: 0x1a1a22 }, size: 3 },
  'gm-bulb': { rows: ['..k..', '..k..', '..k..', '.yYy.', 'yYYYy', 'yYYYy', '.yyy.'], pal: { k: 0x2a2a30, y: 0xd8c070, Y: 0xfff2c0 }, size: 3 },
  'gm-lamp-post': { rows: ['..ggg..', '.gYYYg.', '.gYYYg.', '..ggg..', '...g...', '...g...', '...g...', '...g...', '...g...', '...g...', '...g...', '...g...', '...g...', '...g...', '..ggg..'], pal: { g: 0x2a2a30, Y: 0xf2b060 }, size: 3 },
  'gm-biglamp': { rows: ['....k....', '....k....', '..ggggg..', '.gGGGGGg.', 'gGGGGGGGg', 'ggggggggg'], pal: { k: 0x2a2a30, g: 0x8a5a24, G: 0xe9b84a }, size: 4 },
  'gm-bottle': { rows: ['.g.', '.g.', 'gGg', 'gGg', 'gGg', 'ggg'], pal: { g: 0x2a4a3a, G: 0x4a8a6a }, size: 2 },
  'gm-stool': { rows: ['bbbbbb', '.b..b.', '.b..b.', '.b..b.'], pal: { b: 0x4a3a2a }, size: 3 },
  'gm-note': { rows: ['pppppp', 'pPPPPp', 'pPkkPp', 'pPPPPp', 'pPkPPp', 'pppppp'], pal: { p: 0xd8d0c0, P: 0xf2eee4, k: 0x3a3a44 }, size: 2 },
  'tool-horn-case': { rows: ['........', '..cccccc', '.cCCCCCc', 'cCCCCCCc', 'cCCCCCCc', '.cccccc.', '........', '........'], pal: { c: 0x2a1a1a, C: 0x4a2a2a }, size: 2 },
};
export const PROP_KEYS = Object.keys(PROPS);

// portraits (10x10 @5), and a second frame for everyone who has a tell
const SKIN = { S: 0xc8a888, b: 0x1a1a20 };
const PORTRAITS = {
  'portrait-favour': { rows: ['..HHHHHH..', '.HHHHHHHH.', '.HSSSSSSH.', '..SSSSSS..', '..SbSSbS..', '..SSSSSS..', '..SssssS..', '...SSSS...', '..TTkkTT..', '.TTTkkTTT.'], pal: { H: 0x1a1a22, S: 0xd8b8a0, b: 0x1a1a20, s: 0xb09080, T: 0x1c1c26, k: 0xe8e4d8 } },
  // Favour's tell: his left hand comes up to rest on the table edge
  'portrait-favour-tell': { rows: ['..HHHHHH..', '.HHHHHHHH.', '.HSSSSSSH.', '..SSSSSS..', '..SbSSbS..', '..SSSSSS..', '..SssssS..', '...SSSS...', 'SSTTkkTT..', 'SSTTkkTTT.'], pal: { H: 0x1a1a22, S: 0xd8b8a0, b: 0x1a1a20, s: 0xb09080, T: 0x1c1c26, k: 0xe8e4d8 } },
  'portrait-lou': { rows: ['..HHHHHH..', '.HHHHHHHH.', '.HSSSSSSH.', '..SSSSSS..', '..SbSSbS..', '..SSSSSS..', '..SssssS..', '...SSSS...', '..TTTTTT..', '.TTTTTTTT.'], pal: { H: 0x8a8a90, S: 0x6a4630, b: 0x1a1a20, s: 0x4a3020, T: 0x3a2a3a } },
  // Lou's tell: the cufflink. His right hand touches the left cuff.
  'portrait-lou-tell': { rows: ['..HHHHHH..', '.HHHHHHHH.', '.HSSSSSSH.', '..SSSSSS..', '..SbSSbS..', '..SSSSSS..', '..SssssS..', '...SSSS...', '..TTTTTT..', '.TTkSTTTT.'], pal: { H: 0x8a8a90, S: 0x6a4630, b: 0x1a1a20, s: 0x4a3020, T: 0x3a2a3a, k: 0xe9b84a } },
  'portrait-dede': { rows: ['...HHHH...', '..HHHHHH..', '.HSSSSSSH.', '.HSSSSSSH.', '..SbSSbS..', '..SSSSSS..', '..SrrrrS..', '...SSSS...', '..TTTTTT..', '.TTTTTTTT.'], pal: { H: 0x2a1a1a, S: 0xc09070, b: 0x1a1a20, r: 0xa03a2a, T: 0x6e1e2c } },
  'portrait-cashier': { rows: ['...HHHH...', '..HHHHHH..', '.HSSSSSSH.', '.HSSSSSSH.', '..SbSSbS..', '..SSSSSS..', '..SrrrrS..', '...SSSS...', '..CCCCCC..', '.CCCCCCCC.'], pal: { H: 0x2a1a1a, S: 0xc09070, b: 0x1a1a20, r: 0xa03a2a, C: 0x4a4a52 } },
  'portrait-sal': { rows: ['..........', '..HH..HH..', '.HSSSSSSH.', '..SSSSSS..', '..SbSSbS..', '..SSSSSS..', '..SssssS..', '...SSSS...', '..TTTTTT..', '.TTTTTTTT.'], pal: { H: 0xd8d0c0, S: 0xc8a888, b: 0x1a1a20, s: 0xa88868, T: 0x8a6a3a } },
  'portrait-security': { rows: ['..HHHHHH..', '.HHHHHHHH.', '.hhhhhhhh.', '..SSSSSS..', '..SbSSbS..', '..SSSSSS..', '..SssssS..', '...SSSS...', '..TTTTTT..', '.TTTTTTTT.'], pal: { H: 0x1e1e2a, h: 0x0e0e14, S: 0x9a6a48, b: 0x1a1a20, s: 0x7a5038, T: 0x2a2a36 } },
  'portrait-collector': { rows: ['.HHHHHHHH.', '..HHHHHH..', '.HSSSSSSH.', '..SSSSSS..', '..SbSSbS..', '..SSSSSS..', '..SssssS..', '...SSSS...', '..TTTTTT..', '.TTTTTTTT.'], pal: { H: 0x2a2a30, S: 0xb08868, b: 0x1a1a20, s: 0x8a6848, T: 0x4a4a56 } },
  'portrait-pawn': { rows: ['..........', '..........', '..........', '..........', 'gggggggggg', 'gGGGGGGGGg', 'gGSSSSGGGg', 'gGSSSSSGGg', 'gGGGGGGGGg', 'gggggggggg'], pal: { g: 0x3a3a40, G: 0x1e1e28, S: 0xb08868 } },
  'portrait-dealer': { rows: ['..HHHHHH..', '.HHHHHHHH.', '.HSSSSSSH.', '..SSSSSS..', '..SbSSbS..', '..SSSSSS..', '..SssssS..', '...SSSS...', '..TTTTTT..', '.TTTTTTTT.'], pal: { H: 0x4a3a2a, S: 0xc09070, b: 0x1a1a20, s: 0xa07858, T: 0x3a4a3a } },
  // the dealer's tell: a glance. Both eyes slide one cell toward the cup.
  'portrait-dealer-tell-l': { rows: ['..HHHHHH..', '.HHHHHHHH.', '.HSSSSSSH.', '..SSSSSS..', '..bSSbSS..', '..SSSSSS..', '..SssssS..', '...SSSS...', '..TTTTTT..', '.TTTTTTTT.'], pal: { H: 0x4a3a2a, S: 0xc09070, b: 0x1a1a20, s: 0xa07858, T: 0x3a4a3a } },
  'portrait-dealer-tell-r': { rows: ['..HHHHHH..', '.HHHHHHHH.', '.HSSSSSSH.', '..SSSSSS..', '..SSbSSb..', '..SSSSSS..', '..SssssS..', '...SSSS...', '..TTTTTT..', '.TTTTTTTT.'], pal: { H: 0x4a3a2a, S: 0xc09070, b: 0x1a1a20, s: 0xa07858, T: 0x3a4a3a } },
  'portrait-widow': { rows: ['.HHHHHHHH.', '.HHHHHHHH.', '.HSSSSSSH.', '.HSSSSSSH.', '.HSbSSbSH.', '.HSSSSSSH.', '.HSssssSH.', '..HSSSSH..', '..TTTTTT..', '.TTTTTTTT.'], pal: { H: 0x1a1a20, S: 0xe0c0a8, b: 0x1a1a20, s: 0xb09080, T: 0x1a1a20 } },
  'portrait-kid': { rows: ['..........', '..HHHHHH..', '.HHHHHHHH.', '..SSSSSS..', '..SbSSbS..', '..SSSSSS..', '..SsSSsS..', '...SSSS...', '..TTTTTT..', '.TTTTTTTT.'], pal: { H: 0xd5443c, S: 0xc8a080, b: 0x1a1a20, s: 0xa88060, T: 0x88b8d8 } },
  'portrait-accountant': { rows: ['..HHHHHH..', '.HHHHHHHH.', '.HSSSSSSH.', '..SSSSSS..', '.gSbggbSg.', '..SSSSSS..', '..SssssS..', '...SSSS...', '..TTTTTT..', '.TTTTTTTT.'], pal: { H: 0x6a6a72, S: 0xd8b8a0, b: 0x1a1a20, g: 0x3a3a44, s: 0xb09080, T: 0x8a8a96 } },
  // the accountant's tell: a hand up to the glasses
  'portrait-accountant-tell': { rows: ['..HHHHHH..', '.HHHHHHHH.', '.HSSSSSSH.', '..SSSSSS..', '.gSbggbSS.', '..SSSSSSS.', '..SssssS..', '...SSSS...', '..TTTTTT..', '.TTTTTTTT.'], pal: { H: 0x6a6a72, S: 0xd8b8a0, b: 0x1a1a20, g: 0x3a3a44, s: 0xb09080, T: 0x8a8a96 } },
  'portrait-jo': { rows: ['..HHHHHH..', '.HHHHHHHH.', '.HSSSSSSH.', '..SSSSSS..', '..SbSSbS..', '..SSSSSS..', '..SssssS..', '...SSSS...', '..JJJJJJ..', '.JJJJJJJJ.'], pal: { H: 0x6a4a32, ...SKIN, s: 0xb08868, J: 0x3a5a80 } },
  // Jo's own tell: the eyebrow lifts when the hand is good
  'portrait-jo-brow': { rows: ['..HHHHHH..', '.HHHHHHHH.', '.HSSSSSSH.', '..SSSbSS..', '..SbSSSS..', '..SSSSSS..', '..SssssS..', '...SSSS...', '..JJJJJJ..', '.JJJJJJJJ.'], pal: { H: 0x6a4a32, ...SKIN, s: 0xb08868, J: 0x3a5a80 } },
};

// Jo with his hands in his pockets: the carry-idle after the pawn
const JO_POCKETS = [
  '................', '................', '................', '................',
  '.....SSSSSS.....', '....SSSSSSSS....', '..GGLLSSSLLGG...', '....SSSSSSSS....', '....sSSSSSSs....', '.....SSSSSS.....',
  '....JJJJJJJJ....', '..JJJJJJJJJJJJ..', '.JJjWWWWWWWWjJJ.', '.JJjWWWWWWWWjJJ.', '.JJjWWWWWWWWjJJ.', '..JJJJJJJJJJJJ..',
  '...PPPPPPPPPP...', '...PPPPPPPPPP...', '....PPP..PPP....', '....PPP..PPP....', '....ppp..ppp....', '....ppp..ppp....', '..BBBB....BBBB..', '..BBBB....BBBB..',
];
const JO_PAL = { H: 0x23233a, S: 0x8a5a3b, s: 0x6f4630, G: 0x1a1a24, L: 0x9ac8d8, W: 0xe8e4d8, J: 0x3d5a80, j: 0x2f4766, P: 0x494356, p: 0x3a3547, B: 0x1e1e28 };

export function createGamblerTextures(scene) {
  for (const [key, def] of Object.entries(PROPS)) mk(scene, key, def.rows, def.pal, def.size);
  for (const [key, def] of Object.entries(PORTRAITS)) createPixelTexture(scene, key, def.rows, def.pal, 5);
  for (const [id, look] of Object.entries(PEOPLE)) createPersonTextures(scene, `gm-p-${id}`, look);
  createPixelTexture(scene, 'jo-pockets', JO_POCKETS, JO_PAL, 2, RIM);
  createPixelTexture(scene, 'gm-none', ['.'], {}, 1); // nothing in his hands

  // the sign: THE MERIDIAN in neon magenta on black, 24 HRS burnt out
  paintTexture(scene, 'gm-sign', 360, 120, (ctx, w, h) => {
    ctx.fillStyle = hex(0x0a0810);
    ctx.fillRect(0, 0, w, h);
    gradientV(ctx, 0, 0, w, h, [[0, 0x1a1020, 0.6], [1, 0x0a0810, 0]]);
    const neon = (text, x, y, size, col, glow) => {
      ctx.font = `bold ${size}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (glow) {
        ctx.shadowColor = rgba(col, 0.9);
        ctx.shadowBlur = 18;
        ctx.fillStyle = rgba(col, 0.55);
        ctx.fillText(text, x, y);
        ctx.shadowBlur = 8;
      }
      ctx.fillStyle = glow ? hex(0xffd8f0) : hex(col);
      ctx.fillText(text, x, y);
      ctx.shadowBlur = 0;
    };
    neon('THE MERIDIAN', w / 2, 42, 40, 0xff3aa0, true);
    neon('OPEN', w / 2 - 70, 90, 26, 0xff3aa0, true);
    neon('24 HRS', w / 2 + 80, 92, 18, 0x3a2030, false);
    // the frame and its drips of rain
    ctx.strokeStyle = rgba(0x4a3a50, 0.9);
    ctx.lineWidth = 3;
    ctx.strokeRect(2, 2, w - 4, h - 4);
    grain(ctx, 0, 0, w, h, 0.06, 5, 1);
  }, 11);
  scene.textures.get('gm-sign').setFilter(Phaser.Textures.FilterMode.LINEAR);

  // a card back: magenta lattice on oxblood
  paintTexture(scene, 'gm-card-back', 28, 40, (ctx, w, h) => {
    ctx.fillStyle = hex(0xf2eee4);
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = hex(0x6e1e2c);
    ctx.fillRect(2, 2, w - 4, h - 4);
    ctx.strokeStyle = rgba(0xe03a8a, 0.8);
    ctx.lineWidth = 1;
    for (let i = -h; i < w + h; i += 5) {
      ctx.beginPath();
      ctx.moveTo(i, 2);
      ctx.lineTo(i + h, h - 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(i + h, 2);
      ctx.lineTo(i, h - 2);
      ctx.stroke();
    }
    ctx.fillStyle = hex(0xf2eee4);
    ctx.fillRect(0, 0, w, 2);
    ctx.fillRect(0, h - 2, w, 2);
    ctx.fillRect(0, 0, 2, h);
    ctx.fillRect(w - 2, 0, 2, h);
  }, 3);

  // a glow for lamps, the single lamp over baize, the sodium ones
  paintTexture(scene, 'gm-glow', 64, 64, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    stamp(ctx, w / 2, h / 2, 30, 0xf2c078, 0.9, 0.05);
  }, 1);
  scene.textures.get('gm-glow').setFilter(Phaser.Textures.FilterMode.LINEAR);
  paintTexture(scene, 'gm-glow-pink', 64, 64, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    stamp(ctx, w / 2, h / 2, 30, 0xff3aa0, 0.9, 0.05);
  }, 1);
  scene.textures.get('gm-glow-pink').setFilter(Phaser.Textures.FilterMode.LINEAR);
  // a contact shadow
  paintTexture(scene, 'gm-shadow', 48, 12, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const g = ctx.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w / 2);
    g.addColorStop(0, 'rgba(10,8,14,0.5)');
    g.addColorStop(1, 'rgba(10,8,14,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }, 1);
  // cigar smoke: a soft drifting sheet
  paintTexture(scene, 'gm-smoke', 128, 96, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    for (let i = 0; i < 14; i++) {
      const x = (i * 41) % w;
      const y = 20 + ((i * 29) % (h - 40));
      stamp(ctx, x, y, 22 + (i % 4) * 6, 0xd8c8b8, 0.08 + fbm(i, 2, 3, 2) * 0.06, 0.1);
    }
  }, 2);
  scene.textures.get('gm-smoke').setFilter(Phaser.Textures.FilterMode.LINEAR);
  // rain, for the arrival
  paintTexture(scene, 'gm-rain', 128, 256, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    for (let i = 0; i < 90; i++) {
      const x = (i * 37) % w;
      const y = (i * 91) % h;
      const len = 10 + (i % 5) * 4;
      const g = ctx.createLinearGradient(x, y, x - 2, y + len);
      g.addColorStop(0, 'rgba(220,200,230,0)');
      g.addColorStop(0.6, 'rgba(220,200,230,0.45)');
      g.addColorStop(1, 'rgba(220,200,230,0)');
      ctx.strokeStyle = g;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 2, y + len);
      ctx.stroke();
    }
  }, 3);
  // the mirror ceiling: a band of dark glass with brass seams
  paintTexture(scene, 'gm-mirror', 256, 48, (ctx, w, h) => {
    gradientV(ctx, 0, 0, w, h, [[0, 0x2a1a30, 1], [0.6, 0x3a2a44, 1], [1, 0x1a1020, 1]]);
    ctx.fillStyle = rgba(0xe9b84a, 0.5);
    for (let x = 0; x < w; x += 64) ctx.fillRect(x, 0, 2, h);
    ctx.fillStyle = rgba(0xffffff, 0.08);
    ctx.fillRect(0, h - 8, w, 2);
    grain(ctx, 0, 0, w, h, 0.05, 9, 1);
  }, 4);
}
