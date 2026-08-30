import Phaser from 'phaser';
import { createPixelTexture } from '../utils/pixelart.js';

const STAGE_TILE = {
  rows: ['TTTTTTTT', 'BBBBBBBB', 'BBKBBBBB', 'BBBBBBBB', 'BBBBBKBB', 'BBBBBBBB', 'KBBBBBBB', 'BBBBBBBB'],
  pal: { T: 0x8a6844, B: 0x6a4a32, K: 0x4a3222 },
};
const PIANO_KEY = {
  rows: ['WWWWWWWW', 'WWWWWWWW', 'WWWWWWWW', 'WWWWWWWW', 'WWWWWWWW', 'GGGGGGGG', 'BBBBBBBB', 'BBBBBBBB'],
  pal: { W: 0xe8e8e0, G: 0xb8b8b0, B: 0x2a2a2a },
};
const BROKEN_BOARDS = {
  rows: ['...S...S', '...S...S', '..SSS.SS', '..SSS.SS', '.SSSSSSS', '.SSSSSSS', 'SSSSSSSS', 'SSSSSSSS'],
  pal: { S: 0x8a5a38 },
};
const SOUR_NOTE = {
  rows: ['....gg..', '....g.g.', '....g..g', '....g...', '....g...', '.ggggg..', 'gWggWg..', '.gggg...'],
  pal: { g: 0x3a2a4a, W: 0xe8e0f0 },
};
const CRITIC = {
  rows: ['..HHHH..', '..HHHH..', '.GGSSGG.', '..SSSS..', '.JJJJJJ.', 'JJJJJJJJ', 'JJWWWWJJ', 'JJJJJJJJ', '..P..P..', '..P..P..'],
  pal: { H: 0x9a9aa8, S: 0xc8a888, G: 0x222228, J: 0x4a4a5a, W: 0xd8d8d8, P: 0x2a2a34 },
};
const WORD_SHARD = {
  rows: ['..r...', '.rrr..', 'rrrrrr', '.rrr..', '..r...'],
  pal: { r: 0xd85858 },
};
const LAMP = {
  rows: ['..HHHH..', '.HHHHHH.', 'HHHHHHHH', '.YYYYYY.', '..YYYY..'],
  pal: { H: 0x2a2a30, Y: 0xf2d580 },
};
const BEAT_STRIP = {
  rows: ['YYYYYYYY', 'YyyyyyyY', 'YyyyyyyY', 'YYYYYYYY'],
  pal: { Y: 0xd8a840, y: 0xf2d580 },
};

// generic 16x24 person, palette-swapped per NPC
const PERSON = [
  '.....HHHHHH.....',
  '....HHHHHHHH....',
  '....hhhhhhhh....',
  '...HHHHHHHHHH...',
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
  '....PPPPPPPP....',
  '....PPPPPPPP....',
  '....PPP..PPP....',
  '....PPP..PPP....',
  '....ppp..ppp....',
  '....ppp..ppp....',
  '..BBBB....BBBB..',
  '..BBBB....BBBB..',
];
const NPCS = {
  'npc-delphine': { H: 0xb8b8c0, h: 0xb8b8c0, S: 0x9a6a48, b: 0x222228, T: 0x6a3a4a, t: 0x4a2a36, P: 0x3a3a44, p: 0x2e2e36, B: 0x1e1e28 },
  'npc-nia': { H: 0x2a2230, h: 0x2a2230, S: 0x7a4a30, b: 0x222228, T: 0x3a6a5a, t: 0x2a5044, P: 0x2e2e40, p: 0x242432, B: 0x1e1e28 },
  'npc-marcus': { H: 0x1a1a20, h: 0x1a1a20, S: 0x5a3a26, b: 0x222228, T: 0xb8683a, t: 0x96502c, P: 0x44444e, p: 0x36363e, B: 0x1e1e28 },
  'npc-ray': { H: 0x3a3a44, h: 0x8a3a3a, S: 0x6a4630, b: 0x222228, T: 0x50505c, t: 0x3e3e48, P: 0x3a3a44, p: 0x2e2e36, B: 0x1e1e28 },
  'npc-tally': { H: 0x2e3440, h: 0x2e3440, S: 0xc0a088, b: 0x222228, T: 0x2e3440, t: 0x232834, P: 0x2e3440, p: 0x232834, B: 0x14161c },
  'npc-sol': { H: 0xd8d8dc, h: 0xd8d8dc, S: 0xb08868, b: 0x222228, T: 0x6a5a40, t: 0x54462f, P: 0x4a4a52, p: 0x3a3a42, B: 0x1e1e28 },
  'npc-scalper': { H: 0x3a4436, h: 0x3a4436, S: 0x8a6a4a, b: 0x222228, T: 0x3a4436, t: 0x2c3428, P: 0x2e2e36, p: 0x24242c, B: 0x1e1e28 },
  'npc-roadie': { H: 0x1a1a20, h: 0x1a1a20, S: 0x9a6a48, b: 0x222228, T: 0x2a2a32, t: 0x202028, P: 0x2a2a32, p: 0x202028, B: 0x1e1e28 },
};
const KID = {
  rows: ['..HHHH..', '..hhhh..', '..SSSS..', '..SbbS..', '.RRRRRR.', '.RRRRRR.', '.RRRRRR.', '..P..P..', '..P..P..', '.BB..BB.'],
  pal: { H: 0x2a2230, h: 0x8a3a5a, S: 0x8a5a3b, b: 0x222228, R: 0xa04a5a, P: 0x3a3a50, B: 0x2a2a32 },
};
const ANCHOR = {
  rows: ['...gg...', '..g..g..', '..g.gg..', '...gg.g.', '..gg..g.', '.g.gg.g.', '.g..gg..', '..gg....', '...g....', '..gg....'],
  pal: { g: 0xf2d580 },
};
const COIN = { rows: ['.cc.', 'cCCc', 'cCCc', '.cc.'], pal: { c: 0xb8862c, C: 0xf2d580 } };
const CASE = {
  rows: ['..hh..hh..', '.hhhhhhhh.', 'WWWWWWWWWW', 'WwwwwwwwwW', 'WwwwwwwwwW', 'WWWWWWWWWW'],
  pal: { h: 0x3a3222, W: 0x5a4632, w: 0x6f5840 },
};
const WISP = {
  rows: ['.w..w..w.', '..wwwww..', '.wwWwWww.', 'wwwwwwwww', '.wwwwwww.', '..w.w.w..'],
  pal: { w: 0xa0a8d8, W: 0x2a2a40 },
};
const WALKER = {
  rows: ['..MMMM..', '.MMMMMM.', '.MmMMmM.', '.MMMMMM.', '..M..M..', '..M..M..', '.MM..MM.'],
  pal: { M: 0x8a8494, m: 0xe86a6a },
};
const BOTTLE = { rows: ['.g.', '.g.', 'ggg', 'ggg', 'ggg'], pal: { g: 0x5a8a6a } };
const CHAIR = {
  rows: ['tttttttt', 't......t', 't......t', 'tttttttt', '.t....t.', '.t....t.'],
  pal: { t: 0x8a8494 },
};
const LANTERN = { rows: ['..h..', '.YYY.', 'YYYYY', 'YYYYY', '.YYY.'], pal: { h: 0x3a3222, Y: 0xf2d580 } };
const PHONE = {
  rows: ['BBBBBB', 'BbbbbB', 'BbGGbB', 'BbbbbB', 'BBBBBB', 'B....B', 'B....B'],
  pal: { B: 0x2e3440, b: 0x3e4450, G: 0x88b8d8 },
};
const PORTRAITS = {
  'portrait-delphine': { rows: ['.HHHHHHHH.', 'HHHHHHHHHH', 'HSSSSSSSSH', '.SGGSSGGS.', '.SSSSSSSS.', '.SSssssSS.', '..SSSSSS..', '.TTTTTTTT.', 'TTTTTTTTTT', 'TTTTTTTTTT'], pal: { H: 0xb8b8c0, S: 0x9a6a48, G: 0xd8d8b8, s: 0x7a5238, T: 0x6a3a4a } },
  'portrait-nia': { rows: ['.HHHHHHHH.', 'HHHHHHHHHH', 'HHSSSSSSHH', '.SSbSSbSS.', '.SSSSSSSS.', '.SSssssSS.', '..SSSSSS..', '.TTTTTTTT.', 'TTTTTTTTTT', 'TTTTTTTTTT'], pal: { H: 0x2a2230, S: 0x7a4a30, b: 0x222228, s: 0x633a24, T: 0x3a6a5a } },
  'portrait-marcus': { rows: ['.HHHHHHHH.', '.HHHHHHHH.', 'HSSSSSSSSH', '.SbSSSSbS.', '.SSSSSSSS.', '.SSssssSS.', '..SSSSSS..', '.TTTTTTTT.', 'TTTTTTTTTT', 'TTTTTTTTTT'], pal: { H: 0x1a1a20, S: 0x5a3a26, b: 0x222228, s: 0x4a2f1e, T: 0xb8683a } },
  'portrait-ray': { rows: ['.HHHHHHHH.', 'Hhhhhhhhh.', 'HHHHHHHHHH', '.SSSSSSSS.', '.SbSSSSbS.', '.SSSSSSSS.', '.SSssssSS.', '..SSSSSS..', '.TTTTTTTT.', 'TTTTTTTTTT'], pal: { H: 0x3a3a44, h: 0x8a3a3a, S: 0x6a4630, b: 0x222228, s: 0x54371f, T: 0x50505c } },
  'portrait-tally': { rows: ['.HHHHHHHH.', '.HHHHHHHH.', 'HSSSSSSSSH', '.SbSSSSbS.', '.SSSSSSSS.', '.SSSSSSSS.', '..SSSSSS..', '.TTTWWTTT.', 'TTTTWWTTTT', 'TTTTTTTTTT'], pal: { H: 0x2e3440, S: 0xc0a088, b: 0x222228, T: 0x2e3440, W: 0xe8e4d8 } },
  'portrait-sol': { rows: ['.HHHHHHHH.', 'HHHHHHHHHH', 'HSSSSSSSSH', '.SGGSSGGS.', '.SSSSSSSS.', '.SSssssSS.', '.SSSHHSSS.', '.TTTTTTTT.', 'TTTTTTTTTT', 'TTTTTTTTTT'], pal: { H: 0xd8d8dc, S: 0xb08868, G: 0xc8d8e0, s: 0x96704f, T: 0x6a5a40 } },
  'portrait-jo': { rows: ['..HHHHHH..', '..hhhhhh..', '.HHHHHHHH.', '.SSSSSSSS.', '.GLSSSSLG.', '.SSSSSSSS.', '.SSssssSS.', '..SSSSSS..', '.JJJJJJJJ.', 'JJJJJJJJJJ'], pal: { H: 0x23233a, h: 0x8a3a3a, S: 0x8a5a3b, G: 0x1a1a24, L: 0x9ac8d8, s: 0x6f4630, J: 0x3d5a80 } },
};

export const musicianTheme = {
  tileKey: 'mus-tile',
  spikeKey: 'mus-boards',
  enemyKey: 'mus-note',
  enemySpeed: 60,

  createTextures(scene) {
    createPixelTexture(scene, 'mus-tile', STAGE_TILE.rows, STAGE_TILE.pal, 4);
    createPixelTexture(scene, 'mus-key', PIANO_KEY.rows, PIANO_KEY.pal, 4);
    createPixelTexture(scene, 'mus-boards', BROKEN_BOARDS.rows, BROKEN_BOARDS.pal, 4);
    createPixelTexture(scene, 'mus-note', SOUR_NOTE.rows, SOUR_NOTE.pal, 4);
    createPixelTexture(scene, 'mus-critic', CRITIC.rows, CRITIC.pal, 4);
    createPixelTexture(scene, 'mus-shard', WORD_SHARD.rows, WORD_SHARD.pal, 3);
    createPixelTexture(scene, 'mus-lamp', LAMP.rows, LAMP.pal, 4);
    createPixelTexture(scene, 'mus-beat', BEAT_STRIP.rows, BEAT_STRIP.pal, 4);
    Object.entries(NPCS).forEach(([key, pal]) => createPixelTexture(scene, key, PERSON, pal, 2));
    createPixelTexture(scene, 'npc-kid', KID.rows, KID.pal, 2);
    createPixelTexture(scene, 'mus-anchor', ANCHOR.rows, ANCHOR.pal, 3);
    createPixelTexture(scene, 'mus-coin', COIN.rows, COIN.pal, 3);
    createPixelTexture(scene, 'mus-case', CASE.rows, CASE.pal, 3);
    createPixelTexture(scene, 'mus-wisp', WISP.rows, WISP.pal, 3);
    createPixelTexture(scene, 'mus-walker', WALKER.rows, WALKER.pal, 4);
    createPixelTexture(scene, 'mus-bottle', BOTTLE.rows, BOTTLE.pal, 3);
    createPixelTexture(scene, 'mus-chair', CHAIR.rows, CHAIR.pal, 3);
    createPixelTexture(scene, 'mus-lantern', LANTERN.rows, LANTERN.pal, 3);
    createPixelTexture(scene, 'mus-phone', PHONE.rows, PHONE.pal, 4);
    Object.entries(PORTRAITS).forEach(([key, p]) => createPixelTexture(scene, key, p.rows, p.pal, 5));
  },

  drawBackdrop(scene, worldW, worldH) {
    const cam = scene.cameras.main;
    const g = scene.add.graphics().setScrollFactor(0);
    g.fillGradientStyle(0x160a10, 0x160a10, 0x3a1820, 0x2a1218, 1);
    g.fillRect(0, 0, cam.width, cam.height);

    const par = 0.25;
    const coverW = cam.width + Math.max(0, worldW - cam.width) * par + 200;

    // velance + hanging stage lamps
    scene.add.rectangle(coverW / 2, 30, coverW, 60, 0x4a1420).setScrollFactor(par, 0);
    for (let x = 80; x < coverW; x += 180) {
      scene.add.rectangle(x, 80, 3, 60, 0x1a1a20).setScrollFactor(par, 0);
      scene.add.circle(x, 115, 12, 0xf2d580, 0.9).setScrollFactor(par, 0);
      scene.add.circle(x, 122, 26, 0xf2c078, 0.15).setScrollFactor(par, 0);
    }
    // curtain folds
    for (let x = 0; x < coverW; x += 90) {
      scene.add.rectangle(x, worldH / 2, 34, worldH, 0x421020, 0.5).setScrollFactor(par, 0);
    }
    // audience silhouettes
    const rand = new Phaser.Math.RandomDataGenerator(['big-stage']);
    for (let x = 20; x < coverW; x += 34) {
      scene.add.circle(x, worldH - 26 - rand.between(0, 10), 14, 0x0e0609, 0.9).setScrollFactor(par, 0);
      scene.add.circle(x + 17, worldH - 60 - rand.between(0, 10), 13, 0x120a0e, 0.85).setScrollFactor(par, 0);
    }
  },
};
