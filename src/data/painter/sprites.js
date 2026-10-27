import Phaser from 'phaser';
import { createPixelTexture } from '../../utils/pixelart.js';
import { createPersonTextures } from '../evening/sprites.js';
import { paintTexture, stamp, dab, grain, rgba, hex, fbm, mix, shade } from '../../art/paint.js';
import { PEOPLE, BLUE, VIOLET } from './cast.js';
import { PIGMENTS } from '../../systems/paint.js';

// THE YELLOW HOUSE — everything painted. Gridded things get a Prussian-blue
// rim (never black, §5.2); the big things are brushed onto canvases.
const RIM = { outline: BLUE };
const norm = (rows) => {
  const w = Math.max(...rows.map((r) => r.length));
  return rows.map((r) => r.padEnd(w, '.'));
};
const mk = (scene, key, rows, pal, size = 3) => createPixelTexture(scene, key, norm(rows), pal, size, RIM);

const WOOD = { w: 0x8a6a3a, W: 0xc8a060, d: 0x5a4028 };
const PROPS = {
  'pt-plane_tree': {
    rows: ['......LLLLLL......', '....LLLLLLLLLL....', '..LLLLlLLLLLlLLL..', '.LLLLLLLLLLLLLLLL.', '.LLlLLLLLLLLLLlLL.', '..LLLLLLLlLLLLLL..', '...LLLLLLLLLLLL...', '.....LLLWWLLL.....', '........WW........', '........WW........', '.......WWW........', '.......WWW........', '......WWWW........', '......WWWWW.......'],
    pal: { L: 0x7a9a4a, l: 0xa8c060, W: 0xc8c0a0 }, size: 4,
  },
  'pt-cypress': {
    rows: ['....N....', '...NNN...', '...NnN...', '..NNNNN..', '..NNnNN..', '.NNNNNNN.', '.NNnNNNN.', '.NNNNNnN.', '.NNNNNNN.', '..NNNNN..', '..NnNNN..', '..NNNNN..', '...NNN...', '....W....', '....W....'],
    pal: { N: 0x2e5a3a, n: 0x4a7a4a, W: 0x5a4028 }, size: 4,
  },
  'pt-cypress_tall': {
    rows: ['....N....', '...NNN...', '...NnN...', '..NNNNN..', '..NNnNN..', '.NNNNNNN.', '.NNnNNNN.', '.NNNNNnN.', '.NNNNNNN.', '..NNNNN..', '..NnNNN..', '..NNNNN..', '...NNN...'],
    pal: { N: 0x1e4a30, n: 0x3a6a44 }, size: 4,
  },
  'pt-sleeper': { rows: ['....HHHH....', '...SSSSSS...', '..TTTTTTTT..', 'TTTTTTTTTTTT', 'TTTTTTTTTTTT', '.PPPPPPPPPP.', '..BB....BB..'], pal: { H: 0x6b4e2e, S: 0xb08868, T: 0x6b5a48, P: 0x4a5566, B: 0x1f3a5f }, size: 3 },
  'pt-dog': { rows: ['.........dd.', 'dDDDDDDDDDDd', 'dDDDDDDDDnDd', '.DDDDDDDDDD.', '.dd......dd.'], pal: { d: 0x6a5040, D: 0x9a7a5a, n: BLUE }, size: 3 },
  'pt-cafe_shut': { rows: ['gggggggggggggggg', 'gGGGGGGGGGGGGGGg', 'gG.G.G.G.G.G.G.g', 'gG.G.G.G.G.G.G.g', 'gG.G.G.G.G.G.G.g', 'gG.G.G.G.G.G.G.g', 'gG.G.G.G.G.G.G.g', 'gggggggggggggggg'], pal: { g: 0x4a5566, G: 0x6a7a8a }, size: 3 },
  'pt-cafe_front': { rows: ['yyyyyyyyyyyyyyyyyyyy', 'yYYYYYYYYYYYYYYYYYYy', 'yYgggYYYYYYYYYgggYYy', 'yYgggYYYYYYYYYgggYYy', 'yYYYYYYYYYYYYYYYYYYy', 'yYYYYYYYdddYYYYYYYYy', 'yYYYYYYYdddYYYYYYYYy', 'yYYYYYYYdddYYYYYYYYy', 'yyyyyyyyyyyyyyyyyyyy'], pal: { y: 0xb8862c, Y: 0xe8c060, g: 0x4a5566, d: 0x6b4e2e }, size: 3 },
  'pt-shop': { rows: ['bbbbbbbbbbbbbbbb', 'bBBBBBBBBBBBBBBb', 'bBwwwwwwBBBBBBBb', 'bBwrybvwBBBdddBb', 'bBwwwwwwBBBdddBb', 'bBBBBBBBBBBdddBb', 'bBBBBBBBBBBdddBb', 'bbbbbbbbbbbbbbbb'], pal: { b: 0x3a5a6a, B: 0x5a8a9a, w: 0xe8e4d8, r: 0xc03a2a, y: 0xe8c060, v: VIOLET, d: 0x6b4e2e }, size: 3 },
  'pt-bed': { rows: ['h..............h', 'hhhhhhhhhhhhhhhh', 'hPPPPPPPPPPPPPPh', 'hPPPPPPPPPPPPPPh', 'hhhhhhhhhhhhhhhh', 'h..............h'], pal: { h: 0x8a6a3a, P: 0xd8d0c0 }, size: 3 },
  'pt-chair': { rows: ['.dddd.', '.d..d.', '.dddd.', 'dddddd', 'd....d', 'd....d'], pal: { d: 0xd8c8a0 }, size: 3 },
  'pt-window': { rows: ['ffffffffff', 'fssssfssssf'.slice(0, 10), 'fssssfssssf'.slice(0, 10), 'ffffffffff', 'fssssfssssf'.slice(0, 10), 'fssssfssssf'.slice(0, 10), 'ffffffffff'], pal: { f: 0x6b4e2e, s: 0x88b8d8 }, size: 3 },
  'pt-stove': { rows: ['..kkkk..', '..kKKk..', 'kkkkkkkk', 'kKKKKKKk', 'kKkkkkKk', 'kKkkkkKk', 'kKKKKKKk', 'kkkkkkkk', '.k....k.'], pal: { k: 0x3a4455, K: 0x4a5566 }, size: 3 },
  'pt-stove_north': { rows: ['...kk...', '...kk...', 'kkkkkkkk', 'kKKKKKKk', 'kKrrrrKk', 'kKrrrrKk', 'kKKKKKKk', 'kkkkkkkk', '.k....k.'], pal: { k: 0x3a3a44, K: 0x5a5a66, r: 0xe8762a }, size: 3 },
  'pt-house_front': {
    rows: ['..rrrrrrrrrrrrrrrr..', '.rrrrrrrrrrrrrrrrrr.', 'YYYYYYYYYYYYYYYYYYYY', 'YYgggYYYYYYYYYgggYYY', 'YYgggYYYYYYYYYgggYYY', 'YYYYYYYYYYYYYYYYYYYY', 'YYYYYYYYYYYYYYYYYYYY', 'YYgggYYYYdddYYgggYYY', 'YYgggYYYYdddYYgggYYY', 'YYYYYYYYYdddYYYYYYYY', 'YYYYYYYYYdddYYYYYYYY'],
    pal: { r: 0xc03a2a, Y: 0xe8c060, g: 0x2e6a4a, d: 0x6b4e2e }, size: 4,
  },
  'pt-haystack': { rows: ['....yyyy....', '..yyyyyyyy..', '.yyYyyyyYyy.', 'yyyyyyYyyyyy', 'yyYyyyyyyYyy', 'yyyyyyyyyyyy'], pal: { y: 0xd8b858, Y: 0xe8d080 }, size: 3 },
  'pt-easel': { rows: ['.....w.....', '....w.w....', '...wwwww...', '...w...w...', '..w.....w..', '..w.....w..', '.w.......w.', '.w.......w.', 'w.........w'], pal: { w: 0x8a6a3a }, size: 3 },
  'pt-canvas_blank': { rows: ['cccccccc', 'cCCCCCCc', 'cCCCCCCc', 'cCCCCCCc', 'cCCCCCCc', 'cccccccc'], pal: { c: 0xb8a888, C: 0xe8e0d0 }, size: 3 },
  'pt-crate': { rows: ['bbbbbbbbbb', 'bBBBBBBBBb', 'bBbBBBBbBb', 'bBBBBBBBBb', 'bbbbbbbbbb'], pal: { b: 0x6b4e2e, B: 0xa88a58 }, size: 3 },
  'pt-letter': { rows: ['eeeeeeee', 'eEeeeeEe', 'eeEeeEee', 'eeeEEeee', 'eeeeeeee'], pal: { e: 0xf2ece0, E: 0xc03a2a }, size: 3 },
  'pt-lamp': { rows: ['.LLL.', 'LYYYL', 'LYYYL', '.LLL.', '..L..', '..L..', '..L..', '..L..', '..L..', '..L..', '..L..', '..L..', '..L..', '..L..', '.LLL.'], pal: { L: 0x1f3a5f, Y: 0xf2d060 }, size: 3 },
  'pt-shutter': { rows: ['ffffffffff', 'fssssfssssf'.slice(0, 10), 'fsssyfyssssf'.slice(0, 10), 'fssssfssssf'.slice(0, 10), 'ffffffffff', 'fssssfssssf'.slice(0, 10), 'fssssfssssf'.slice(0, 10), 'ffffffffff'], pal: { f: 0x6b4e2e, s: 0xf2d060, y: 0xfff2a0 }, size: 3 },
  'pt-shutter_shut': { rows: ['ffffffffff', 'fggggfggggf'.slice(0, 10), 'fggggfggggf'.slice(0, 10), 'fgggggggggf'.slice(0, 10), 'ffffffffff', 'fggggfggggf'.slice(0, 10), 'fggggfggggf'.slice(0, 10), 'ffffffffff'], pal: { f: 0x6b4e2e, g: 0x2e6a4a }, size: 3 },
  'pt-bell': { rows: ['...bb...', '..bBBb..', '.bBBBBb.', '.bBBBBb.', 'bBBBBBBb', 'bbbbbbbb', '...bb...'], pal: { b: 0x8a6a2c, B: 0xd8a840 }, size: 3 },
  'pt-train': { rows: ['......kkkkkkkkkkkkkkkkkkk', '......kKKKKKKKKKKKKKKKKKk', 'kkkkkkkKwwKKwwKKwwKKwwKKk', 'kKKKKKKKKKKKKKKKKKKKKKKKk', 'kkkkkkkkkkkkkkkkkkkkkkkkk', '.ww..ww......ww......ww..'], pal: { k: 0x2a3650, K: 0x3a4a6a, w: 0xf2d060 }, size: 3 },
  'pt-dead_sunflower': { rows: ['.ddd.', 'ddddd', '.ddd.', '..s..', '..s..', '.s...', '.s...', '.s...'], pal: { d: 0x4a5566, s: 0x6b4e2e }, size: 3 },
  'pt-bud': { rows: ['..gg..', '.gGGg.', 'gGGGGg', '.gGGg.', '..ss..', '..ss..', '..ss..', '..ss..'], pal: { g: 0x4a6a3a, G: 0x6a8a4a, s: 0x3e5a34 }, size: 3 },
  'pt-bloom': { rows: ['...yyyyyy...', '..yYYYYYYy..', '.yYYkkkkYYy.', 'yYYkkkkkkYYy', 'yYYkkkkkkYYy', '.yYYkkkkYYy.', '..yYYYYYYy..', '...yyyyyy...', '.....ss.....', '.....ss.....', '.....ss.....', '.....ss.....'], pal: { y: 0xd8a830, Y: 0xf2d060, k: 0x6b4e2e, s: 0x3e5a34 }, size: 3 },
  'pt-planks': { rows: ['pppppppp', '........', 'pppppppp', '........', 'pppppppp', '........', 'pppppppp'], pal: { p: 0x8a6a3a }, size: 3 },
  'pt-iris_bed': { rows: ['v.v.v.v.v.v', 'VvVvVvVvVvV', '.g.g.g.g.g.', '.g.g.g.g.g.', '.g.g.g.g.g.'], pal: { v: 0x6a6a7a, V: 0x8a8a9a, g: 0x5a6a5a }, size: 3 },
  'pt-iris': { rows: ['.v.v.', 'vVvVv', '.VVV.', '..g..', '..g..', '..g..', '.g.g.'], pal: { v: VIOLET, V: 0x9a6ab8, g: 0x4a8a5a }, size: 3 },
  'pt-fountain': { rows: ['........FF........', '.......FFFF.......', '........FF........', '....FFFFFFFFFF....', 'FFFFFFFFFFFFFFFFFF', 'Fk.k.k.k.k.k.k.k.F', 'FFFFFFFFFFFFFFFFFF'], pal: { F: 0xc8c0b0, k: 0x8a8a94 }, size: 3 },
  'pt-can': { rows: ['..GGG.', 'G.G.GG', '.GGGGG', '.GGGG.', '.gggg.'], pal: { G: 0x3a7a5a, g: 0x2a5a42 }, size: 3 },
  'pt-bench': { rows: ['BBBBBBBBBBBB', 'b..........b', 'BBBBBBBBBBBB', '.b........b.', '.b........b.'], pal: { B: 0x9a9aa4, b: 0x6a6a72 }, size: 4 },
  'pt-poppies': { rows: ['r.r.r.r', 'RrRrRrR', '.g.g.g.', '.g.g.g.'], pal: { r: 0xc03a2a, R: 0xe85a3a, g: 0x4a7a4a }, size: 3 },
  'pt-tree_grey': { rows: ['....LLLL....', '..LLLLLLLL..', '.LLLLLLLLLL.', '.LLLLLLLLLL.', '..LLLLLLLL..', '....LWWL....', '.....WW.....', '.....WW.....', '.....WW.....', '....WWWW....'], pal: { L: 0x6a7080, W: 0x5a5560 }, size: 4 },
  'pt-desk': { rows: ['WWWWWWWWWWWWWWWW', 'wwwwwwwwwwwwwwww', 'dd............dd', 'dd............dd', 'dd............dd'], pal: WOOD, size: 3 },
  'pt-table': { rows: ['WWWWWWWWWWWW', 'wwwwwwwwwwww', '.d........d.', '.d........d.', '.d........d.'], pal: WOOD, size: 3 },
  'pt-cot': { rows: ['h........h', 'hhhhhhhhhh', 'hPPPPPPPPh', 'hhhhhhhhhh', 'h........h', 'h........h'], pal: { h: 0x8a6a3a, P: 0xe8e4d8 }, size: 3 },
  'pt-cart': { rows: ['.yy.yy.yy.', 'BBBBBBBBBB', 'B........B', 'BBBBBBBBBB', '.kk....kk.', '.kk....kk.'], pal: { B: 0x8a6a4a, k: 0x2a3650, y: 0xe8a030 }, size: 4 },
  'pt-tube_cap': { rows: ['.cc.', 'cCCc', 'cCCc', '.cc.'], pal: { c: 0xb8862c, C: 0xf2d060 }, size: 2 },
  'pt-sundial': { rows: ['....s....', '...sss...', '..sssss..', '.ssssSss.', 'sssssssss', '.........', '...ddd...', '..ddddd..'], pal: { s: 0xc8c0b0, S: 0x1f3a5f, d: 0x8a8a94 }, size: 3 },
  // Jo's tool this dream: a brush with a yellow-loaded tip
  'tool-brush': { rows: ['......yy', '.....yYy', '....sSs.', '...sSs..', '..sSs...', '.sSs....', 'sSs.....', 'bb......'], pal: { y: 0xe8c060, Y: 0xfff2a0, s: 0x8a6a3a, S: 0xc8a060, b: 0x1f3a5f }, size: 2 },
};

// portraits (10x10 @5)
const PORTRAITS = {
  'portrait-jo': { rows: ['..HHHHHH..', '.HHHHHHHH.', '.HSSSSSSH.', '..SSSSSS..', '..SbSSbS..', '..SSSSSS..', '..SssssS..', '...SSSS...', '..JJJJJJ..', '.JJJJJJJJ.'], pal: { H: 0xd8b858, S: 0xc8a888, b: BLUE, s: 0xb08868, J: 0x3a5a80 } },
  'portrait-clerk': { rows: ['..HHHHHH..', '.HHHHHHHH.', '.hhhhhhhh.', '..SSSSSS..', '..SbSSbS..', '..SSSSSS..', '..SssssS..', '...SSSS...', '..TTTTTT..', '.TTTTTTTT.'], pal: { H: 0x3a4a6a, h: 0x2a3650, S: 0xc8a080, b: BLUE, s: 0xa88060, T: 0x3a4a6a } },
  'portrait-roulin': { rows: ['..HHHHHH..', '.HHhhhhHH.', '.HSSSSSSH.', '..SSSSSS..', '..SbSSbS..', '..SSSSSS..', '.BBBBBBBB.', '.BBBBBBBB.', '..TTTTTT..', '.TTTTTTTT.'], pal: { H: 0x2e4a80, h: 0xd8b858, S: 0xd8a888, b: BLUE, B: 0xd8d0c0, T: 0x2e4a80 } },
  'portrait-paul': { rows: ['..HHHHHH..', '.HHHHHHHH.', '.HSSSSSSH.', '..SSSSSS..', '..SbSSbS..', '..SSSSSS..', '.RRRRRRRR.', '.RRRRRRRR.', '..TTTTTT..', '.TTTTTTTT.'], pal: { H: 0xc03a2a, S: 0xd8b090, b: BLUE, R: 0xc03a2a, T: 0x3a5a6a } },
  'portrait-rey': { rows: ['..HHHHHH..', '.HHHHHHHH.', '.HSSSSSSH.', '..SgSSgS..', '..SbSSbS..', '..SSSSSS..', '..SssssS..', '...SSSS...', '..TTTTTT..', '.TTTTTTTT.'], pal: { H: 0x2a2230, S: 0xe0c0a8, g: 0x8a8a90, b: BLUE, s: 0xb09080, T: 0xe8e4d8 } },
  'portrait-ginoux': { rows: ['..HHHHHH..', '.HHHHHHHH.', '.HHSSSSHH.', '.HSSSSSSH.', '.HSbSSbSH.', '..SSSSSS..', '..SrrrrS..', '...SSSS...', '..TTTTTT..', '.TTTTTTTT.'], pal: { H: 0x2a1e2a, S: 0xd8b090, b: BLUE, r: 0xa03a2a, T: 0x2e6a4a } },
  'portrait-vautrin': { rows: ['..HHHHHH..', '.HHHHHHHH.', '.hhhhhhhh.', '..SSSSSS..', '..SbSSbS..', '..SSSSSS..', '..SssssS..', '...SSSS...', '..TTTTTT..', '.TTTTTTTT.'], pal: { H: 0x4a4a52, h: 0x33333d, S: 0xd8c0a8, b: BLUE, s: 0xb09080, T: 0x4a4a52 } },
  'portrait-visitor': { rows: ['..HHHHHH..', '.HHHHHHHH.', '.HHSSSSHH.', '.HSSSSSSH.', '.HSbSSbSH.', '..SSSSSS..', '..SssssS..', '..HHHHHH..', '..TTTTTT..', '.TTTTTTTT.'], pal: { H: 0xc03a2a, S: 0xe0c0a8, b: BLUE, s: 0xb09080, T: 0x6a4a5a } },
  'portrait-isak': { rows: ['..HHHHHH..', '.HHHHHHHH.', '.HSSSSSSH.', '..SSSSSS..', '..SbSSbS..', '..SSSSSS..', '..SssssS..', '...SSSS...', '..TTTTTT..', '.TTTTTTTT.'], pal: { H: 0x8a5a3b, S: 0xd8b090, b: BLUE, s: 0xb08868, T: 0x3a3a44 } },
  'portrait-shopkeeper': { rows: ['..HHHHHH..', '.HHHHHHHH.', '.HSSSSSSH.', '..SSSSSS..', '..SbSSbS..', '..SSSSSS..', '..SssssS..', '...SSSS...', '..TTTTTT..', '.TTTTTTTT.'], pal: { H: 0x3a5a6a, S: 0xd8b090, b: BLUE, s: 0xb08868, T: 0x5a8a9a } },
  'portrait-farmer': { rows: ['..HHHHHH..', '.HHHHHHHH.', '.hhhhhhhh.', '..SSSSSS..', '..SbSSbS..', '..SSSSSS..', '..SssssS..', '...SSSS...', '..TTTTTT..', '.TTTTTTTT.'], pal: { H: 0xd8b858, h: 0xb8903a, S: 0xb08868, b: BLUE, s: 0x8a6848, T: 0x6b4e2e } },
  'portrait-gendarme': { rows: ['..HHHHHH..', '.HHHHHHHH.', '.hhhhhhhh.', '..SSSSSS..', '..SbSSbS..', '..SSSSSS..', '..SssssS..', '...SSSS...', '..TTTTTT..', '.TTTTTTTT.'], pal: { H: 0x1e2a4a, h: 0x14203a, S: 0xc09070, b: BLUE, s: 0xa07858, T: 0x1e2a4a } },
};

export function createPainterTextures(scene) {
  for (const [key, def] of Object.entries(PROPS)) mk(scene, key, def.rows, def.pal, def.size);
  for (const [key, def] of Object.entries(PORTRAITS)) createPixelTexture(scene, key, def.rows, def.pal, 5);
  for (const [id, look] of Object.entries(PEOPLE)) createPersonTextures(scene, `pt-p-${id}`, look);

  // a tube per pigment: a cap, a body in the colour, a crimped foot
  for (const [name, c] of Object.entries(PIGMENTS)) {
    mk(scene, `pt-tube-${name}`, ['.cc.', 'cccc', 'PPPP', 'PpPP', 'PPPP', 'PpPP', 'PPPP', 'ffff'], { c: 0xb8b8c0, P: c.hex, p: shade(c.hex, 1.25), f: 0x9a9aa4 }, 3);
    // the stroke: a ribbon tile, thick paint with a ridge on its lit edge
    paintTexture(scene, `pt-stroke-${name}`, 32, 14, (ctx, w, h, rand) => {
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < 7; i++) dab(ctx, 2 + i * 4.6 + rand.frac() * 2, h / 2 + (rand.frac() - 0.5) * 3, 6, 4.5, 0.1, c.hex, 0.95, 0.3);
      ctx.fillStyle = rgba(shade(c.hex, 1.35), 0.9);
      ctx.fillRect(1, 2, w - 2, 1);
      ctx.fillStyle = rgba(mix(c.hex, VIOLET, 0.5), 0.7);
      ctx.fillRect(1, h - 3, w - 2, 1);
      grain(ctx, 0, 0, w, h, 0.07, 3);
    });
    // the well: a smear of this colour for the HUD
    paintTexture(scene, `pt-well-${name}`, 40, 22, (ctx, w, h, rand) => {
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < 5; i++) dab(ctx, 8 + i * 6, h / 2 + (rand.frac() - 0.5) * 4, 8, 6, -0.3, c.hex, 0.95, 0.35);
      ctx.fillStyle = rgba(shade(c.hex, 1.4), 0.8);
      ctx.fillRect(4, 5, w - 8, 1);
    });
  }

  // a halo: three rings of short radial strokes, the light's colour and its
  // complement alternating (§5.4). Rotated by the scene at 1 rpm.
  for (const [name, c] of Object.entries(PIGMENTS)) {
    paintTexture(scene, `pt-halo-${name}`, 128, 128, (ctx, w, h, rand) => {
      ctx.clearRect(0, 0, w, h);
      const comp = PIGMENTS[c.complement] ? PIGMENTS[c.complement].hex : VIOLET;
      for (let ring = 0; ring < 3; ring++) {
        const r0 = 18 + ring * 16;
        const n = 18 + ring * 8;
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2 + rand.frac() * 0.1;
          const len = 8 + rand.frac() * 6;
          const col = (i + ring) % 2 ? c.hex : comp;
          ctx.strokeStyle = rgba(col, (i + ring) % 2 ? 0.75 : 0.4);
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.moveTo(w / 2 + Math.cos(a) * r0, h / 2 + Math.sin(a) * r0);
          ctx.lineTo(w / 2 + Math.cos(a) * (r0 + len), h / 2 + Math.sin(a) * (r0 + len));
          ctx.stroke();
        }
      }
      stamp(ctx, w / 2, h / 2, 16, c.hex, 0.5, 0.2);
    });
    scene.textures.get(`pt-halo-${name}`).setFilter(Phaser.Textures.FilterMode.LINEAR);
  }

  // a star: a knot of yellow with a soft centre (the canvas thumbnail sits in it)
  paintTexture(scene, 'pt-star', 40, 40, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    stamp(ctx, w / 2, h / 2, 19, 0xf2d060, 0.95, 0.5);
    stamp(ctx, w / 2, h / 2, 9, 0xfff6c0, 1, 0.3);
  });
  // the moon: a disc of thick pale strokes
  paintTexture(scene, 'pt-moon', 160, 96, (ctx, w, h, rand) => {
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(w / 2, h, w / 2 - 2, h - 4, 0, Math.PI, 0);
    ctx.clip();
    ctx.fillStyle = hex(0xe8dca0);
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 90; i++) dab(ctx, rand.frac() * w, rand.frac() * h, 9, 4, rand.frac() * 0.6 - 0.3, rand.frac() < 0.5 ? 0xf6f0c8 : 0xd8c888, 0.8, 0.4);
    ctx.restore();
    ctx.strokeStyle = rgba(BLUE, 0.9);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(w / 2, h, w / 2 - 2, h - 4, 0, Math.PI, 0);
    ctx.stroke();
    grain(ctx, 0, 0, w, h, 0.06, 9);
  });
  scene.textures.get('pt-moon').setFilter(Phaser.Textures.FilterMode.LINEAR);

  // the swirling sky: a tileable field of stroke-arcs along spiral paths.
  // The scene scrolls it (parallax 0.1) and slides a second copy against it,
  // so the strokes advance along their curves.
  for (const [key, base, lit] of [['pt-sky-day', 0x88b8d8, 0xe8f0f8], ['pt-sky-night', 0x1f3a5f, 0x6a8ac8]]) {
    paintTexture(scene, key, 512, 256, (ctx, w, h, rand) => {
      ctx.clearRect(0, 0, w, h);
      for (let s = 0; s < 9; s++) {
        const cx = (s * 61) % w;
        const cy = 30 + ((s * 97) % (h - 60));
        const turns = 1.6 + rand.frac();
        for (let t = 0; t < 70; t++) {
          const a = (t / 70) * Math.PI * 2 * turns;
          const r = 6 + t * 0.9;
          const x = ((cx + Math.cos(a) * r * 1.6) % w + w) % w;
          const y = cy + Math.sin(a) * r * 0.7;
          const col = t % 3 === 0 ? lit : mix(base, lit, 0.3 + rand.frac() * 0.3);
          dab(ctx, x, y, 7, 2.6, a + Math.PI / 2, col, 0.55, 0.35);
          if (x < 10) dab(ctx, x + w, y, 7, 2.6, a + Math.PI / 2, col, 0.55, 0.35);
          if (x > w - 10) dab(ctx, x - w, y, 7, 2.6, a + Math.PI / 2, col, 0.55, 0.35);
        }
      }
    });
    scene.textures.get(key).setFilter(Phaser.Textures.FilterMode.LINEAR);
  }
  // a soft glow and a violet contact shadow
  paintTexture(scene, 'pt-glow', 64, 64, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    stamp(ctx, w / 2, h / 2, 30, 0xf2d060, 0.9, 0.05);
  });
  scene.textures.get('pt-glow').setFilter(Phaser.Textures.FilterMode.LINEAR);
  paintTexture(scene, 'pt-shadow', 64, 10, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const g = ctx.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w / 2);
    g.addColorStop(0, rgba(VIOLET, 0.6));
    g.addColorStop(1, rgba(VIOLET, 0));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
  // the canvas swatch fallback: a small painted rectangle of two colours
  paintTexture(scene, 'pt-canvas-swatch', 48, 36, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = hex(0xd8c8a0);
    ctx.fillRect(0, 0, w, h);
  });
  void fbm;
}

// a thumbnail texture from two colours (used when a snapshot is not possible
// and as the first frame while one is being taken)
export function swatchTexture(scene, key, colours, seed) {
  const [a, b] = [PIGMENTS[colours[0]] ? PIGMENTS[colours[0]].hex : 0xd8c8a0, PIGMENTS[colours[1]] ? PIGMENTS[colours[1]].hex : 0x6b4e2e];
  return paintTexture(scene, key, 48, 36, (ctx, w, h, rand) => {
    ctx.fillStyle = hex(mix(a, 0xffffff, 0.2));
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 26; i++) dab(ctx, rand.frac() * w, h * 0.55 + rand.frac() * h * 0.45, 7, 3, 0.4, i % 3 ? a : b, 0.8, 0.35);
    for (let i = 0; i < 18; i++) dab(ctx, rand.frac() * w, rand.frac() * h * 0.5, 8, 3, -0.4, i % 2 ? b : mix(b, 0xffffff, 0.3), 0.7, 0.35);
    ctx.strokeStyle = rgba(BLUE, 0.8);
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, w - 2, h - 2);
  }, seed);
}
