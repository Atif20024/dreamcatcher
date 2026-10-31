import Phaser from 'phaser';
import { createPixelTexture } from '../../utils/pixelart.js';
import { createPersonTextures } from '../evening/sprites.js';
import { paintTexture, stamp, grain, rgba, fbm } from '../../art/paint.js';
import { PEOPLE } from './cast.js';

// THE SECOND DRAFT — the things: string art like the rest of the game, then
// the level-art light pass (WriterScene calls lightThemeProps on 'wr-').
const RIM = { outline: 0x14141c };
const norm = (rows) => {
  const w = Math.max(...rows.map((r) => r.length));
  return rows.map((r) => r.padEnd(w, '.'));
};
const mk = (scene, key, rows, pal, size = 3) => createPixelTexture(scene, key, norm(rows), pal, size, RIM);

const WOOD = { w: 0x7a5a3a, W: 0xa88a68, d: 0x4a3222 };
const PROPS = {
  'wr-typewriter': {
    rows: ['..kkkkkkkk..', '.kKKKKKKKKk.', '.kKkKkKkKKk.', 'kkkkkkkkkkkk', 'kKkKkKkKkKkk', 'kkkkkkkkkkkk', '.kkkkkkkkkk.', '..pppppppp..'],
    pal: { k: 0x2a2a30, K: 0x4a4a52, p: 0xe8e4d8 }, size: 3,
  },
  'wr-desk': { rows: ['WWWWWWWWWWWWWWWW', 'wwwwwwwwwwwwwwww', 'dd............dd', 'dd............dd', 'dd............dd'], pal: WOOD, size: 3 },
  'wr-mattress': { rows: ['..mmmmmmmmmmmmmm..', '.mMMMMMMMMMMMMMMm.', 'mMMmMMmMMmMMmMMMMm', 'mmmmmmmmmmmmmmmmmm'], pal: { m: 0x6a6a7a, M: 0x9a9aaa }, size: 3 },
  'wr-trunk': {
    rows: ['.bbbbbbbbbb.', 'bBBBBBBBBBBb', 'bBsBBBBBBsBb', 'bBBBBBBBBBBb', 'bbbbbbbbbbbb', 'bBBBBkkBBBBb', 'bBBBBkkBBBBb', 'bBsBBBBBBsBb', 'bBBBBBBBBBBb', 'bbbbbbbbbbbb', 'bBBBBBBBBBBb', 'bBsBBBBBBsBb', 'bBBBBBBBBBBb', '.bbbbbbbbbb.'],
    pal: { b: 0x4a3222, B: 0x6a4a32, s: 0xb8862c, k: 0x2a2a30 }, size: 3,
  },
  'wr-machine': {
    rows: ['..gggggggggggg..', '.gGGGGGGGGGGGGg.', '.gGwwwwwwwwwwGg.', '.gGGGGGGGGGGGGg.', 'gggggggggggggggg', 'gGGGGGGGGrGGGGGg', 'gGGGGGGGGGGGGGGg', 'gGGGGGGGGGGGGGGg', 'gggggggggggggggg', '.gg..........gg.'],
    pal: { g: 0x6a6e7a, G: 0xb8bcc8, w: 0xe8e4d8, r: 0xc03a2a }, size: 3,
  },
  'wr-toner': { rows: ['.kkkkkk.', 'kKKKKKKk', 'kKbbbbKk', 'kKbbbbKk', 'kKKKKKKk', '.kkkkkk.'], pal: { k: 0x2a2a30, K: 0x4a4a52, b: 0x3a5a80 }, size: 3 },
  'wr-espresso': {
    rows: ['..bbbbbbbb..', '.bBBBBBBBBb.', 'bBBsBBBBsBBb', 'bBBBBBBBBBBb', 'bbbbbbbbbbbb', '.bBBBBBBBBb.', '.bBBkBBkBBb.', '.bbbbbbbbbb.', '..cc....cc..'],
    pal: { b: 0x8a6a2c, B: 0xd8a840, s: 0xf2e0a0, k: 0x2a2a30, c: 0xe8e4d8 }, size: 3,
  },
  'wr-piano': {
    rows: ['pppppppppppppppppp', 'pPPPPPPPPPPPPPPPPp', 'pPPPPPPPPPPPPPPPPp', 'pppppppppppppppppp', 'pwkwkwwkwkwkwwkwkp', 'pwwwwwwwwwwwwwwwwp', 'pp..............pp', 'pp..............pp'],
    pal: { p: 0x1e1a20, P: 0x2e2a32, w: 0xe8e4d8, k: 0x1a1a20 }, size: 3,
  },
  'wr-table': { rows: ['WWWWWWWWWWWW', 'wwwwwwwwwwww', '.d........d.', '.d........d.', '.d........d.'], pal: WOOD, size: 3 },
  'wr-bench': { rows: ['WWWWWWWWWWWWWWWW', 'wwwwwwwwwwwwwwww', '.d............d.', '.dd..........dd.', '.d............d.'], pal: WOOD, size: 3 },
  'wr-dog': { rows: ['.........dd.', 'dDDDDDDDDDDd', 'dDDDDDDDDnDd', '.DDDDDDDDDD.', '.dd......dd.', '.dd......dd.'], pal: { d: 0x6a5040, D: 0x9a7a5a, n: 0x1a1a20 }, size: 3 },
  'wr-cart': { rows: ['bbbbbbbbbbbbbbbb', 'bBBBBbBBBBbBBBBb', 'bBBBBbBBBBbBBBBb', 'bbbbbbbbbbbbbbbb', 'sssssssssssssss.', '.ww..........ww.', '.ww..........ww.'], pal: { b: 0x4a3a2a, B: 0x8a6a4a, s: 0x6a6e7a, w: 0x2a2a30 }, size: 3 },
  'wr-key': { rows: ['.gg..', 'g..g.', 'g..g.', '.gg..', '.g...', '.gg..', '.g...', '.gg..'], pal: { g: 0xd8a840 }, size: 3 },
  'wr-cabinet': { rows: ['oooooooooooo', 'oOOOOOOOOOOo', 'oOOOOkOOOOOo', 'oOOOOOOOOOOo', 'oooooooooooo', 'oOOOOOOOOOOo', 'oOOOOkOOOOOo', 'oOOOOOOOOOOo', 'oooooooooooo'], pal: { o: 0x3a2a1e, O: 0x6a4a32, k: 0xd8a840 }, size: 3 },
  'wr-bag': { rows: ['....hhhh....', '...h....h...', '.bbbbbbbbbb.', 'bBBBBBBBBBBb', 'bBBBBBBBBBBb', 'bBBBBBBBBBBb', '.bbbbbbbbbb.'], pal: { h: 0x4a3222, b: 0x5a3a22, B: 0x8a6a42 }, size: 3 },
  'wr-cards': { rows: ['cc.cc.cc.cc.cc', 'CC.CC.CC.CC.CC', '..............', 'cc.cc.cc.cc.cc', 'CC.CC.CC.CC.CC', '..............', 'cc.cc.cc.cc.cc', 'CC.CC.CC.CC.CC'], pal: { c: 0xe8e4d8, C: 0xd0c8b8 }, size: 3 },
  'wr-washer': { rows: ['.wwwwwwwwww.', 'wWWWWWWWWWWw', 'wWWWggggWWWw', 'wWWgGGGGgWWw', 'wWWgGGGGgWWw', 'wWWWggggWWWw', 'wWWWWWWWWWWw', '.wwwwwwwwww.'], pal: { w: 0x9a9ea8, W: 0xd8dce0, g: 0x3a3a44, G: 0x88b8d8 }, size: 3 },
  'wr-desk-big': { rows: ['WWWWWWWWWWWWWWWWWWWW', 'wwwwwwwwwwwwwwwwwwww', 'dd................dd', 'dd................dd', 'dd................dd'], pal: { w: 0x2a2a30, W: 0x4a4a52, d: 0x22222a }, size: 3 },
  'wr-fire-door': { rows: ['rrrrrrrrrr', 'rRRRRRRRRr', 'rRRRRRRRRr', 'rRRRRRRRRr', 'rRRRRkRRRr', 'rRRRRRRRRr', 'rRRRRRRRRr', 'rRRRRRRRRr', 'rRRRRRRRRr', 'rrrrrrrrrr'], pal: { r: 0x6a2a22, R: 0xa03a2a, k: 0xd8a840 }, size: 3 },
  'wr-tray': { rows: ['s..............s', 's..............s', 'ssssssssssssssss'], pal: { s: 0x6a6e7a }, size: 3 },
  'wr-chair': { rows: ['.dddd.', '.d..d.', '.dddd.', 'dddddd', 'd....d', 'd....d'], pal: { d: 0x4a3a2a }, size: 3 },
  'wr-lectern': { rows: ['WWWWWWWW', 'wwwwwwww', '...dd...', '...dd...', '...dd...', '...dd...', '.dddddd.'], pal: WOOD, size: 3 },
  'wr-book': { rows: ['rrrrrrr', 'rRRRRRr', 'rRRRRRr', 'rRRRRRr', 'rRRRRRr', 'rrrrrrr'], pal: { r: 0x6a2a22, R: 0xa03a2a }, size: 3 },
  'wr-book-bound': { rows: ['..gggggggg..', '.gGGGGGGGGg.', '.gGGwwwwGGg.', '.gGGGGGGGGg.', '.gGGGGGGGGg.', '.gggggggggg.'], pal: { g: 0x2e3a5a, G: 0x3a5a80, w: 0xd8a840 }, size: 3 },
  'wr-inkwell': { rows: ['...kk...', '..kkkk..', '.bbbbbb.', 'bBBBBBBb', 'bBBBBBBb', '.bbbbbb.'], pal: { k: 0x2a2a30, b: 0x1e2a4a, B: 0x2e4a80 }, size: 3 },
  'wr-lamp-post': { rows: ['..ggg..', '.gYYYg.', '.gYYYg.', '..ggg..', '...g...', '...g...', '...g...', '...g...', '...g...', '...g...', '...g...', '...g...', '...g...', '...g...', '..ggg..'], pal: { g: 0x2a2a30, Y: 0xf2c078 }, size: 3 },
  'wr-shop-door': { rows: ['gggggggggg', 'gGGGGGGGGg', 'gGwwwwwwGg', 'gGwwwwwwGg', 'gGwwwwwwGg', 'gGGGGGGGGg', 'gGGGGkGGGg', 'gGGGGGGGGg', 'gGGGGGGGGg', 'gggggggggg'], pal: { g: 0x2e3440, G: 0x3a5a80, w: 0xd8ecf8, k: 0xd8a840 }, size: 3 },
  'wr-plate': { rows: ['..pppppp..', 'pppppppppp'], pal: { p: 0xb8862c }, size: 3 },
  'wr-lever': { rows: ['....r.', '...r..', '..r...', '.gggg.', 'gggggg'], pal: { r: 0xc03a2a, g: 0x6a6e7a }, size: 3 },
  'wr-pencil': { rows: ['rrrrrrrrrrrrrr..', 'RRRRRRRRRRRRRRw.', 'rrrrrrrrrrrrrrww', 'RRRRRRRRRRRRRRw.', 'rrrrrrrrrrrrrr..'], pal: { r: 0xa03a2a, R: 0xc84a3a, w: 0xe8e4d8 }, size: 3 },
  'wr-crane': { rows: ['ssssssssssssssss', 'sSSSSSSSSSSSSSSs', 'ssssssssssssssss', '.....s....s.....'], pal: { s: 0x8a6a2c, S: 0xd8a840 }, size: 3 },
  'wr-lift': { rows: ['wwwwwwwwwwww', 'wWWWWWWWWWWw', 'wwwwwwwwwwww'], pal: { w: 0x3a3a44, W: 0x6a6e7a }, size: 3 },
  'wr-glass': { rows: ['gggggggg', 'gGGGGGGg', 'gGGGGGGg', 'gggggggg'], pal: { g: 0x8ab0c0, G: 0xc0dcec }, size: 4 },
  'wr-roller': { rows: ['.ssssss.', 'sSSSSSSs', 'sSkSSkSs', 'sSSSSSSs', 'sSkSSkSs', 'sSSSSSSs', '.ssssss.'], pal: { s: 0x3a3a44, S: 0x6a6e7a, k: 0x2a2a30 }, size: 4 },
  'wr-folder': { rows: ['.b.', 'bBb', 'bBb', 'bBb', 'bBb', 'bBb', '.b.'], pal: { b: 0x8a8e9a, B: 0xd8dce0 }, size: 4 },
  'wr-envelope': { rows: ['eeeeeeee', 'eEeeeeEe', 'eeEeeEee', 'eeeEEeee', 'eeeeeeee'], pal: { e: 0xe8e4d8, E: 0xc03a2a }, size: 2 },
  'wr-soup': { rows: ['.bbbbbb.', 'bBBBBBBb', 'bBsssBBb', '.bbbbbb.'], pal: { b: 0x8a6a2c, B: 0xd8a840, s: 0xe86a3a }, size: 3 },
  'wr-page': { rows: ['pppppp', 'pPPPPp', 'pPkkPp', 'pPPPPp', 'pPkkPp', 'pppppp'], pal: { p: 0xd8d0c0, P: 0xf2eee4, k: 0x8a8480 }, size: 2 },
  // Jo's tools this dream: the fountain pen, then the red pencil
  'tool-pen': { rows: ['......gg', '.....gGg', '....gGg.', '...gGg..', '..bBg...', '.bBb....', 'bBb.....', 'nb......'], pal: { g: 0xd8a840, G: 0xf2e0a0, b: 0x1e2a4a, B: 0x2e4a80, n: 0xe8e4d8 }, size: 2 },
  'tool-pencil': { rows: ['......rr', '.....rRr', '....rRr.', '...rRr..', '..rRr...', '.rRr....', 'wrr.....', 'w.......'], pal: { r: 0xa03a2a, R: 0xc84a3a, w: 0xe8e4d8 }, size: 2 },
};
export const PROP_KEYS = Object.keys(PROPS);

// portraits (10x10 @5)
const PORTRAITS = {
  'portrait-jo': { rows: ['..HHHHHH..', '.HHHHHHHH.', '.HSSSSSSH.', '..SSSSSS..', '..SbSSbS..', '..SSSSSS..', '..SssssS..', '...SSSS...', '..JJJJJJ..', '.JJJJJJJJ.'], pal: { H: 0x6a4a32, S: 0xc8a888, b: 0x1a1a20, s: 0xb08868, J: 0x3a5a80 } },
  'portrait-wren': { rows: ['..HHHHHH..', '.HHHHHHHH.', '.HSSSSSSH.', '..SSSSSS..', '..SbSSbS..', '..SSSSSS..', '..SssssS..', '...SSSS...', '..TTTTTT..', '.TTTTTTTT.'], pal: { H: 0x8a4a5a, S: 0xc09070, b: 0x1a1a20, s: 0xa07858, T: 0x5a6a4a } },
  'portrait-emmerich': { rows: ['..HHHHHH..', '.HHHHHHHH.', '.HSSSSSSH.', '..SgSSgS..', '..SbSSbS..', '..SSSSSS..', '..SssssS..', '...SSSS...', '..TTTTTT..', '.TTTTTTTT.'], pal: { H: 0xd8d0c0, S: 0xd8b8a0, g: 0x8a8a90, b: 0x1a1a20, s: 0xb09080, T: 0x6a6a72 } },
  'portrait-tomasz': { rows: ['..HHHHHH..', '.HHHHHHHH.', '.HSSSSSSH.', '..SSSSSS..', '..SbSSbS..', '..SSSSSS..', '..SssssS..', '...SSSS...', '..TTTTTT..', '.TTTTTTTT.'], pal: { H: 0x3a5a80, S: 0xc8a080, b: 0x1a1a20, s: 0xa88060, T: 0x88b8d8 } },
  'portrait-isolde': { rows: ['..HHHHHH..', '.HHHHHHHH.', '.HHSSSSHH.', '.HSSSSSSH.', '.HSbSSbSH.', '..SSSSSS..', '..SrrrrS..', '...SSSS...', '..TTTTTT..', '.TTTTTTTT.'], pal: { H: 0x2a2230, S: 0xe0c0a8, b: 0x1a1a20, r: 0xc03a2a, T: 0xc03a2a } },
  'portrait-landlady': { rows: ['..HHHHHH..', '.HHHHHHHH.', '.HSSSSSSH.', '.HSSSSSSH.', '.HSbSSbSH.', '.HSSSSSSH.', '.HSssssSH.', '..HSSSSH..', '..TTTTTT..', '.TTTTTTTT.'], pal: { H: 0xc86a90, S: 0x8a5a3b, b: 0x1a1a20, s: 0x6a4230, T: 0x6a4a5a } },
  'portrait-guard': { rows: ['..HHHHHH..', '.HHHHHHHH.', '.hhhhhhhh.', '..SSSSSS..', '..SbSSbS..', '..SSSSSS..', '..SssssS..', '...SSSS...', '..TTTTTT..', '.TTTTTTTT.'], pal: { H: 0x2e4a3a, h: 0x1e3a2a, S: 0xc09070, b: 0x1a1a20, s: 0xa07858, T: 0x2e4a3a } },
};

export function createWriterTextures(scene) {
  for (const [key, def] of Object.entries(PROPS)) mk(scene, key, def.rows, def.pal, def.size);
  for (const [key, def] of Object.entries(PORTRAITS)) createPixelTexture(scene, key, def.rows, def.pal, 5);
  for (const [id, look] of Object.entries(PEOPLE)) createPersonTextures(scene, `wr-p-${id}`, look);

  // the Inner Editor: not a person. Ink, three tiles tall, edges that
  // never quite hold still. Painted, never gridded.
  paintTexture(scene, 'wr-editor', 48, 96, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    for (let y = 0; y < h; y++) {
      const t = y / h;
      const width = 6 + 14 * Math.sin(Math.PI * Math.min(1, t * 1.3)) + (t > 0.85 ? (t - 0.85) * 60 : 0);
      const wob = fbm(y / 9, 3.1, 7, 2) * 5;
      const g = ctx.createLinearGradient(w / 2 - width, 0, w / 2 + width, 0);
      g.addColorStop(0, 'rgba(10,8,16,0)');
      g.addColorStop(0.25, 'rgba(12,10,20,0.92)');
      g.addColorStop(0.75, 'rgba(12,10,20,0.92)');
      g.addColorStop(1, 'rgba(10,8,16,0)');
      ctx.fillStyle = g;
      ctx.fillRect(w / 2 - width + wob, y, width * 2, 1);
    }
    // the head
    stamp(ctx, w / 2, 12, 9, 0x0c0a14, 0.95, 0.35);
    // drips at the hem
    for (let i = 0; i < 5; i++) {
      const x = 8 + i * 8 + fbm(i, 2, 5, 1) * 4;
      ctx.fillStyle = rgba(0x0c0a14, 0.8);
      ctx.fillRect(x, h - 12, 2, 6 + (i % 3) * 3);
    }
    grain(ctx, 0, 0, w, h, 0.05, 77, 1);
  }, 5);
  scene.textures.get('wr-editor').setFilter(Phaser.Textures.FilterMode.LINEAR);

  // rain: a tileable sheet of streaks
  paintTexture(scene, 'wr-rain', 128, 256, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    for (let i = 0; i < 90; i++) {
      const x = (i * 37) % w;
      const y = (i * 91) % h;
      const len = 10 + (i % 5) * 4;
      const g = ctx.createLinearGradient(x, y, x - 2, y + len);
      g.addColorStop(0, 'rgba(200,210,230,0)');
      g.addColorStop(0.6, 'rgba(200,210,230,0.45)');
      g.addColorStop(1, 'rgba(200,210,230,0)');
      ctx.strokeStyle = g;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 2, y + len);
      ctx.stroke();
    }
  }, 3);
  // a soft glow for lamps and the desk's pool of light
  paintTexture(scene, 'wr-glow', 64, 64, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    stamp(ctx, w / 2, h / 2, 30, 0xf2c078, 0.9, 0.05);
  }, 1);
  scene.textures.get('wr-glow').setFilter(Phaser.Textures.FilterMode.LINEAR);
  // a contact shadow
  paintTexture(scene, 'wr-shadow', 48, 12, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const g = ctx.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w / 2);
    g.addColorStop(0, 'rgba(10,8,14,0.5)');
    g.addColorStop(1, 'rgba(10,8,14,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }, 1);
}
