import Phaser from 'phaser';
import { createPixelTexture } from '../utils/pixelart.js';

const COUNTER_TILE = {
  rows: ['TTTTTTTT', 'SSSSSSSS', 'SSDSSSSS', 'SSSSSSSS', 'SSSSSDSS', 'SSSSSSSS', 'SDSSSSSS', 'SSSSSSSS'],
  pal: { T: 0xb8bcc8, S: 0x8a8e9a, D: 0x6a6e7a },
};
const BELT_R = {
  rows: ['BBBBBBBB', 'bbbbbbbb', 'b.A..A.b', 'b..A..Ab', 'b.A..A.b', 'bbbbbbbb', 'BBBBBBBB', 'BBBBBBBB'],
  pal: { B: 0x3a3a44, b: 0x50505c, A: 0xd8b858 },
};
const KNIVES = {
  rows: ['...S...S', '...S...S', '..SSS.SS', '..SSS.SS', '.SSSSSSS', '.SSSSSSS', 'SSSSSSSS', 'SSSSSSSS'],
  pal: { S: 0xc0c4cc },
};
const FLAME = {
  rows: ['...y....', '...yy...', '..yyy...', '..oyyy..', '.ooyyy..', '.oooyy..', 'oooooyy.', '.oooooo.', '..oooo..', '...oo...'],
  pal: { y: 0xf8e080, o: 0xf09040 },
};
const OIL = {
  rows: ['OOOOOOOO', 'OoOOOOoO', 'OOOOOOOO', 'OOOoOOOO', 'OOOOOOOO', 'OOoOOOOO', 'OOOOOoOO', 'OOOOOOOO'],
  pal: { O: 0x22242e, o: 0x4a5a6e },
};
const POT = {
  rows: ['...hhhh...', '..h....h..', '.HHHHHHHH.', 'hHWHHHHWHh', 'hHHHHHHHHh', '.HHHHHHHH.', '.HHHHHHHH.'],
  pal: { h: 0x3a3a40, H: 0x50525e, W: 0xe8e8f0 },
};
const CLOCHE = {
  rows: ['...ss...', '..ssss..', '.ssssss.', '.ssssss.', 'ssssssss', '...tt...', '..tttt..', 'tttttttt'],
  pal: { s: 0xc8ccd8, t: 0x6a4a32 },
};
const TABLE = {
  rows: ['............', '....pppp....', '...pppppp...', 'TTTTTTTTTTTT', 'TTTTTTTTTTTT', '..w......w..', '..w......w..', '..w......w..'],
  pal: { p: 0xe8e8e0, T: 0x7a583c, w: 0x4a3222 },
};

const ICE_TILE = {
  rows: ['TTTTTTTT', 'IIIIIIII', 'IIiIIIII', 'IIIIIIII', 'IIIIiIII', 'IiIIIIII', 'IIIIIIII', 'IIIIIIII'],
  pal: { T: 0xd8ecf8, I: 0x9ac4dc, i: 0xc0dcec },
};
const CRATE = {
  rows: ['WWWWWWWW', 'WbbbbbbW', 'WbWWWWbW', 'WbWWWWbW', 'WbWWWWbW', 'WbWWWWbW', 'WbbbbbbW', 'WWWWWWWW'],
  pal: { W: 0x8a6844, b: 0x6a4a32 },
};
const VENT = {
  rows: ['s.s.s.s.', '.s.s.s.s', 'GGGGGGGG', 'GGGGGGGG'],
  pal: { G: 0x6a6e7a, s: 0xd8ecf8 },
};
const PAN = {
  rows: ['...hh...', '...hh...', '.HHHHHH.', 'HHHHHHHH', 'HHHHHHHH', '.HHHHHH.'],
  pal: { h: 0x3a3a40, H: 0xb87333 },
};
const ICICLE = {
  rows: ['IIIIII', 'IIIIII', '.IIII.', '.IIII.', '..II..', '..II..', '...I..'],
  pal: { I: 0xc0dcec },
};
const SAFFRON = {
  rows: ['..tttt..', '.tTTTTt.', '.tTrrTt.', '.tTrrTt.', '.tTTTTt.', '..tttt..'],
  pal: { t: 0xb8862c, T: 0xd8a840, r: 0xc03a2a },
};
const GOLD_LEAF = {
  rows: ['..gggg..', '.gGGGGg.', '.gGGGGg.', '.gGGGGg.', '..gggg..'],
  pal: { g: 0xb8862c, G: 0xf2d580 },
};
const HEAT_LAMP = {
  rows: ['HHHHHHHH', '.YYYYYY.', '..YYYY..'],
  pal: { H: 0x3a3a40, Y: 0xf09040 },
};
const CRAWLER = {
  rows: ['.b....b.', '..bbbb..', '.bBBBBb.', 'bBBBBBBb', '.b.bb.b.'],
  pal: { b: 0x3a2a20, B: 0x5a3a28 },
};
const PEPPER_MILL = {
  rows: ['..MMMM..', '..mMMm..', '.MMMMMM.', '.MMMMMM.', '.MmMMmM.', '.MMMMMM.', '.MMMMMM.', 'MMMMMMMM'],
  pal: { M: 0x6a4a32, m: 0x4a3222 },
};
const CART = {
  rows: ['SSSSSSSSSS', 'SsssssssaS', 'SSSSSSSSSS', '.w..ww..w.', '.w..ww..w.'],
  pal: { S: 0x8a8e9a, s: 0xb8bcc8, a: 0xc03a2a, w: 0x2a2a30 },
};
const DOUGH = {
  rows: ['..dddd..', '.dDDDDd.', 'dDDDDDDd', 'dDDDDDDd', '.dDDDDd.'],
  pal: { d: 0xd8c8a0, D: 0xf0e4c8 },
};
const SUGAR = {
  rows: ['SSSSSSSS', '.S.SS.S.', '..S..S..'],
  pal: { S: 0xf0e8f8 },
};
const CREAM = {
  rows: ['..cc..', '.cccc.', 'cccccc', '.cccc.'],
  pal: { c: 0xf8f4ec },
};
const MERINGUE = {
  rows: ['..mmm...', '.mmmmm..', 'mmWmmWm.', 'mmmmmmm.', '.mmmmm..'],
  pal: { m: 0xf0e8e0, W: 0x2a2a30 },
};
const CAT = {
  rows: ['.c...c..', '.cc.cc..', '.cccccc.', '.cCccCc.', '.cccccccc', '..cc..c.'],
  pal: { c: 0x8a6844, C: 0x2a2a30 },
};
const BELL = {
  rows: ['...bb...', '..BBBB..', '.BBBBBB.', '.BBBBBB.', 'BBBBBBBB', '...bb...'],
  pal: { b: 0x8a6844, B: 0xd8a840 },
};
const PORTRAIT_M = {
  rows: [
    '..HHHHHH..',
    '.HHHHHHHH.',
    '.HSSSSSSH.',
    '..SSSSSS..',
    '..SbSSbS..',
    '..SSSSSS..',
    '..SssssS..',
    '...SSSS...',
    '..WWWWWW..',
    '.WWWWWWWW.',
  ],
  pal: { H: 0x6a5a80, S: 0xc8a888, b: 0x2a2a30, s: 0xb08868, W: 0xe8e4d8 },
};
const PORTRAIT_A = {
  rows: [
    '..TTTTTT..',
    '..TTTTTT..',
    '..TTTTTT..',
    '.TTTTTTTT.',
    '..dddddd..',
    '..dddddd..',
    '..dSSSSd..',
    '...SSSS...',
    '..JJJJJJ..',
    '.JJJJJJJJ.',
  ],
  pal: { T: 0xe8e4d8, d: 0x2a2230, S: 0x8a6a50, J: 0xe8e4d8 },
};

export const chefTheme = {
  tileKey: 'chef-tile',
  spikeKey: 'chef-knives',
  enemyKey: 'chef-pot',
  enemySpeed: 80,

  createTextures(scene) {
    createPixelTexture(scene, 'chef-tile', COUNTER_TILE.rows, COUNTER_TILE.pal, 4);
    createPixelTexture(scene, 'chef-belt', BELT_R.rows, BELT_R.pal, 4);
    createPixelTexture(scene, 'chef-knives', KNIVES.rows, KNIVES.pal, 4);
    createPixelTexture(scene, 'chef-flame', FLAME.rows, FLAME.pal, 4);
    createPixelTexture(scene, 'chef-oil', OIL.rows, OIL.pal, 4);
    createPixelTexture(scene, 'chef-pot', POT.rows, POT.pal, 4);
    createPixelTexture(scene, 'chef-cloche', CLOCHE.rows, CLOCHE.pal, 4);
    createPixelTexture(scene, 'chef-table', TABLE.rows, TABLE.pal, 4);
    createPixelTexture(scene, 'chef-ice', ICE_TILE.rows, ICE_TILE.pal, 4);
    createPixelTexture(scene, 'chef-crate', CRATE.rows, CRATE.pal, 4);
    createPixelTexture(scene, 'chef-vent', VENT.rows, VENT.pal, 4);
    createPixelTexture(scene, 'chef-pan', PAN.rows, PAN.pal, 4);
    createPixelTexture(scene, 'chef-icicle', ICICLE.rows, ICICLE.pal, 4);
    createPixelTexture(scene, 'chef-saffron', SAFFRON.rows, SAFFRON.pal, 3);
    createPixelTexture(scene, 'chef-gold', GOLD_LEAF.rows, GOLD_LEAF.pal, 3);
    createPixelTexture(scene, 'chef-lamp', HEAT_LAMP.rows, HEAT_LAMP.pal, 4);
    createPixelTexture(scene, 'chef-crawler', CRAWLER.rows, CRAWLER.pal, 3);
    createPixelTexture(scene, 'chef-mill', PEPPER_MILL.rows, PEPPER_MILL.pal, 4);
    createPixelTexture(scene, 'chef-cart', CART.rows, CART.pal, 4);
    createPixelTexture(scene, 'chef-dough', DOUGH.rows, DOUGH.pal, 5);
    createPixelTexture(scene, 'chef-sugar', SUGAR.rows, SUGAR.pal, 4);
    createPixelTexture(scene, 'chef-cream', CREAM.rows, CREAM.pal, 3);
    createPixelTexture(scene, 'chef-meringue', MERINGUE.rows, MERINGUE.pal, 4);
    createPixelTexture(scene, 'chef-cat', CAT.rows, CAT.pal, 3);
    createPixelTexture(scene, 'chef-bell', BELL.rows, BELL.pal, 3);
    createPixelTexture(scene, 'portrait-marguerite', PORTRAIT_M.rows, PORTRAIT_M.pal, 5);
    createPixelTexture(scene, 'portrait-aurelio', PORTRAIT_A.rows, PORTRAIT_A.pal, 5);
  },

  drawBackdrop(scene, worldW, worldH) {
    const cam = scene.cameras.main;
    const g = scene.add.graphics().setScrollFactor(0);
    g.fillGradientStyle(0x2e2a34, 0x2e2a34, 0x6a5f55, 0x5a4f45, 1);
    g.fillRect(0, 0, cam.width, cam.height);

    const par = 0.25;
    const coverW = cam.width + Math.max(0, worldW - cam.width) * par + 200;

    // wall tile lines
    const lines = scene.add.graphics().setScrollFactor(par, 0);
    lines.lineStyle(2, 0x4a4340, 0.5);
    for (let y = 60; y < worldH; y += 46) {
      lines.lineBetween(0, y, coverW, y);
    }
    // hanging pans and shelf
    const rand = new Phaser.Math.RandomDataGenerator(['five-star']);
    for (let x = 60; x < coverW; x += 150) {
      scene.add.rectangle(x, 40, 2, 50, 0x2a2a30).setScrollFactor(par, 0);
      scene.add.circle(x, 95, 22, 0x3e3a44).setScrollFactor(par, 0);
      scene.add.circle(x, 95, 15, 0x55505e).setScrollFactor(par, 0);
    }
    // big stove/counter silhouettes
    for (let x = 0; x < coverW; ) {
      const bw = rand.between(90, 160);
      scene.add.rectangle(x + bw / 2, worldH - 70, bw, 140, 0x37323c).setScrollFactor(par, 0);
      scene.add.rectangle(x + bw / 2, worldH - 138, bw - 16, 8, 0x4a4550).setScrollFactor(par, 0);
      x += bw + rand.between(20, 60);
    }
    // steam puffs
    for (let i = 0; i < 14; i++) {
      const c = scene.add
        .circle(rand.between(0, coverW), rand.between(120, worldH - 200), rand.between(14, 30), 0xd8d8e0, 0.07)
        .setScrollFactor(par, 0);
      scene.tweens.add({ targets: c, y: c.y - 40, alpha: 0.02, duration: rand.between(3000, 6000), yoyo: true, repeat: -1 });
    }
  },
};
