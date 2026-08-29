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
