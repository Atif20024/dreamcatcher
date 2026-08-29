import Phaser from 'phaser';
import Player from '../entities/Player.js';
import { createPixelTexture } from '../utils/pixelart.js';
import { drawCityBackdrop } from '../utils/backdrop.js';
import { FIRST_STEPS } from '../data/levels.js';

const T = 32; // tile size in px

const TILE_ROWS = [
  'TTTTTTTT',
  'FFFFFFFF',
  'FEFFFEFF',
  'FFFFFFFF',
  'FFEFFFEF',
  'FFFFFFFF',
  'FEFFFEFF',
  'FFFFFFFF',
];
const TILE_PAL = { T: 0x8f8fb8, F: 0x565678, E: 0x3a3a55 };

const SPIKE_ROWS = [
  '...S...S',
  '...S...S',
  '..SSS.SS',
  '..SSS.SS',
  '.SSSSSSS',
  '.SSSSSSS',
  'SSSSSSSS',
  'SSSSSSSS',
];
const SPIKE_PAL = { S: 0x9a9ab8 };

const ORB_ROWS = [
  '..oooo..',
  '.oOOOOo.',
  'oOOWWOOo',
  'oOWWWWOo',
  'oOWWWWOo',
  'oOOWWOOo',
  '.oOOOOo.',
  '..oooo..',
];
const ORB_PAL = { o: 0x7ec8a9, O: 0xa9e8c9, W: 0xf0fff8 };

const ENEMY_ROWS = [
  '..gggg..',
  '.gggggg.',
  'gg.gg.gg',
  'gggggggg',
  'gggggggg',
  'g.gggg.g',
];
const ENEMY_PAL = { g: 0x6a4a7a };

const FLAG_ROWS = [
  'P.......',
  'Pffff...',
  'Pffffff.',
  'Pffff...',
  'P.......',
  'P.......',
  'P.......',
  'P.......',
];
const FLAG_PAL = { P: 0x8a8aa8, f: 0x88b8d8 };
const FLAG_LIT = { P: 0x8a8aa8, f: 0xf2c078 };

const HEART_ROWS = ['.hh.hh.', 'hhhhhhh', 'hhhhhhh', '.hhhhh.', '..hhh..', '...h...'];
const HEART_PAL = { h: 0xe86a6a };

export default class LevelScene extends Phaser.Scene {
  constructor() {
    super('Level');
  }

  create() {
    this.level = FIRST_STEPS;
    this.lives = 3;
    this.cardActive = false;

    const map = this.level.map;
    const worldW = Math.max(...map.map((r) => r.length)) * T;
    const worldH = map.length * T;
    this.worldH = worldH;

    createPixelTexture(this, 'tile', TILE_ROWS, TILE_PAL, 4);
    createPixelTexture(this, 'spike', SPIKE_ROWS, SPIKE_PAL, 4);
    createPixelTexture(this, 'orb', ORB_ROWS, ORB_PAL, 3);
    createPixelTexture(this, 'enemy', ENEMY_ROWS, ENEMY_PAL, 4);
    createPixelTexture(this, 'flag', FLAG_ROWS, FLAG_PAL, 4);
    createPixelTexture(this, 'flag-lit', FLAG_ROWS, FLAG_LIT, 4);
    createPixelTexture(this, 'heart', HEART_ROWS, HEART_PAL, 3);

    drawCityBackdrop(this, worldW, worldH);

    this.solids = this.physics.add.staticGroup();
    this.spikes = this.physics.add.staticGroup();
    this.orbs = this.physics.add.staticGroup();
    this.flags = this.physics.add.staticGroup();
    this.enemies = this.physics.add.group();

    let spawn = { x: 64, y: 64 };
    map.forEach((row, ty) => {
      [...row].forEach((ch, tx) => {
        const cx = tx * T + T / 2;
        const cy = ty * T + T / 2;
        if (ch === '#') {
          this.solids.add(this.add.image(cx, cy, 'tile'));
        } else if (ch === '^') {
          const s = this.spikes.create(cx, cy + 4, 'spike');
          s.body.setSize(24, 16).setOffset(4, 16);
        } else if (ch === 'O') {
          const o = this.orbs.create(cx, cy, 'orb');
          this.tweens.add({ targets: o, y: cy - 8, duration: 900, yoyo: true, repeat: -1, ease: 'sine.inout' });
        } else if (ch === 'C') {
          this.flags.create(cx, cy, 'flag');
        } else if (ch === 'E') {
          const e = this.enemies.create(cx, cy, 'enemy');
          e.setVelocityX(-60);
          e.body.setSize(28, 22).setOffset(2, 2);
        } else if (ch === 'S') {
          spawn = { x: cx, y: cy - 8 };
        }
      });
    });

    this.spawnPoint = spawn;
    this.checkpoint = spawn;

    this.physics.world.setBounds(0, 0, worldW, worldH + 200);
    this.player = new Player(this, spawn.x, spawn.y);

    this.physics.add.collider(this.player, this.solids);
    this.physics.add.collider(this.enemies, this.solids);
    this.physics.add.overlap(this.player, this.spikes, () => this.hurt());
    this.physics.add.overlap(this.player, this.enemies, () => this.hurt());
    this.physics.add.overlap(this.player, this.flags, (_p, flag) => {
      if (flag.texture.key === 'flag') {
        flag.setTexture('flag-lit');
        this.checkpoint = { x: flag.x, y: flag.y - 8 };
      }
    });
    this.physics.add.overlap(this.player, this.orbs, (_p, orb) => this.catchOrb(orb));

    this.cameras.main.setBounds(0, 0, worldW, worldH);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    this.invulnUntil = 0;

    this.hearts = [0, 1, 2].map((i) =>
      this.add.image(28 + i * 30, 30, 'heart').setScrollFactor(0).setDepth(50)
    );
    this.add
      .text(16, 52, this.level.name, { fontFamily: 'monospace', fontSize: '14px', color: '#e8dcc8' })
      .setScrollFactor(0)
      .setDepth(50);
  }

  hurt() {
    if (this.cardActive || this.time.now < this.invulnUntil) return;
    this.lives -= 1;
    this.hearts.forEach((h, i) => h.setAlpha(i < this.lives ? 1 : 0.25));
    if (this.lives <= 0) {
      this.showCard(
        ['You gave everything… and it slipped away.', '', 'Do you really want to pursue this dream?', '', '[X] Try again        (the station comes in M3)'],
        () => this.scene.restart()
      );
      return;
    }
    this.player.setPosition(this.checkpoint.x, this.checkpoint.y);
    this.player.setVelocity(0, 0);
    this.invulnUntil = this.time.now + 2000;
    this.tweens.add({ targets: this.player, alpha: 0.3, duration: 150, yoyo: true, repeat: 6, onComplete: () => this.player.setAlpha(1) });
  }

  catchOrb(orb) {
    if (this.cardActive) return;
    this.tweens.add({ targets: orb, scale: 2, alpha: 0, duration: 500 });
    this.showCard([...this.level.message.split('\n'), '', '[X] Continue'], () => this.scene.restart());
  }

  showCard(lines, onConfirm) {
    this.cardActive = true;
    this.physics.pause();
    const cam = this.cameras.main;
    this.add.rectangle(cam.width / 2, cam.height / 2, cam.width, cam.height, 0x000000, 0.7).setScrollFactor(0).setDepth(100);
    this.add
      .text(cam.width / 2, cam.height / 2, lines.join('\n'), {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#e8dcc8',
        align: 'center',
        lineSpacing: 6,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(101);
    this.cardConfirm = onConfirm;
  }

  update(time, delta) {
    if (this.cardActive) {
      if (Phaser.Input.Keyboard.JustDown(this.player.keys.X)) this.cardConfirm();
      return;
    }

    this.player.update(time, delta);

    // patrollers turn at walls and at platform edges
    this.enemies.children.iterate((e) => {
      if (!e || !e.body) return;
      const dir = Math.sign(e.body.velocity.x) || -1;
      if (e.body.blocked.left) e.setVelocityX(60);
      else if (e.body.blocked.right) e.setVelocityX(-60);
      else if (e.body.onFloor()) {
        const aheadX = e.x + dir * (e.width / 2 + 4);
        const footY = e.y + e.height / 2 + 8;
        const hasGround = this.solids.getChildren().some(
          (s) => Math.abs(s.x - aheadX) <= T / 2 && Math.abs(s.y - footY) <= T / 2
        );
        if (!hasGround) e.setVelocityX(-dir * 60);
      }
    });

    if (this.player.y > this.worldH + 60) {
      this.player.setPosition(this.checkpoint.x, this.checkpoint.y);
      this.player.setVelocity(0, 0);
      this.hurt();
    }
  }
}
