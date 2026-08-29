import Phaser from 'phaser';
import { createJoTextures } from '../entities/jo.js';
import { createPixelTexture } from '../utils/pixelart.js';

const W = 960;
const H = 540;

const TILE_PALETTE = { E: 0x3a3a55, F: 0x565678, T: 0x8f8fb8 };
const TILE = [
  'TTTTTTTTTTTTTTTT',
  'FFFFFFFFFFFFFFFF',
  'FEEFFFFFEEFFFFFF',
  'FFFFFFFFFFFFFFFF',
  'FFFFFEEFFFFFEEFF',
  'FFFFFFFFFFFFFFFF',
  'FEEFFFFFFEEFFFFF',
  'FFFFFFFFFFFFFFFF',
];

// M1-lead-in playground: dusk city backdrop, pixel-art Jo, tiled platforms.
export default class PlaygroundScene extends Phaser.Scene {
  constructor() {
    super('Playground');
  }

  create() {
    this.drawBackdrop();

    createJoTextures(this);
    createPixelTexture(this, 'platform-tile', TILE, TILE_PALETTE, 2);

    const platforms = this.physics.add.staticGroup();
    const makePlatform = (x, y, width) => {
      const p = this.add.tileSprite(x, y, width, 16, 'platform-tile');
      this.physics.add.existing(p, true);
      platforms.add(p);
    };
    makePlatform(W / 2, 530, W); // ground
    makePlatform(300, 400, 160);
    makePlatform(600, 300, 160);
    makePlatform(850, 420, 120);

    this.player = this.physics.add.sprite(100, 440, 'jo-stand');
    this.player.body.setSize(22, 36).setOffset(1, 0);
    this.player.setCollideWorldBounds(true);
    this.physics.add.collider(this.player, platforms);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('W,A,S,D,SPACE');
    this.runFrameTimer = 0;

    this.add
      .text(16, 16, 'Dreamcatcher — playground\n←/→ or A/D move · ↑/W/Space jump · ↓/S crouch', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#e8dcc8',
      })
      .setScrollFactor(0);
  }

  drawBackdrop() {
    const g = this.add.graphics();
    g.fillGradientStyle(0x1b1b3a, 0x1b1b3a, 0x8a4a5e, 0xb56a52, 1);
    g.fillRect(0, 0, W, H);

    // low dusk sun
    this.add.circle(720, 430, 60, 0xf2c078, 0.9);
    this.add.circle(720, 430, 80, 0xf2c078, 0.25);

    // far skyline silhouettes with lit windows
    const rand = new Phaser.Math.RandomDataGenerator(['dreamcatcher']);
    for (let x = 0; x < W; ) {
      const bw = rand.between(50, 110);
      const bh = rand.between(120, 300);
      this.add.rectangle(x + bw / 2, H - 20 - bh / 2, bw, bh, 0x232342);
      for (let wy = H - 30 - bh; wy < H - 50; wy += 26) {
        for (let wx = x + 10; wx < x + bw - 10; wx += 20) {
          if (rand.frac() < 0.35) {
            this.add.rectangle(wx, wy, 8, 10, 0xf2d590, 0.8);
          }
        }
      }
      x += bw + rand.between(8, 30);
    }
  }

  update(_time, delta) {
    const body = this.player.body;
    const left = this.cursors.left.isDown || this.keys.A.isDown;
    const right = this.cursors.right.isDown || this.keys.D.isDown;
    const jump = this.cursors.up.isDown || this.keys.W.isDown || this.keys.SPACE.isDown;
    const crouch = this.cursors.down.isDown || this.keys.S.isDown;

    body.setVelocityX(left ? -220 : right ? 220 : 0);
    if (left) this.player.setFlipX(true);
    if (right) this.player.setFlipX(false);

    if (jump && body.onFloor()) {
      body.setVelocityY(-560);
    }

    const moving = left || right;
    if (moving && body.onFloor()) {
      this.runFrameTimer += delta;
      if (this.runFrameTimer > 120) {
        this.runFrameTimer = 0;
        this.player.setTexture(this.player.texture.key === 'jo-run' ? 'jo-stand' : 'jo-run');
      }
    } else if (!body.onFloor()) {
      this.player.setTexture('jo-run'); // legs-out frame doubles as the jump pose
    } else {
      this.player.setTexture('jo-stand');
    }

    if (crouch && body.onFloor()) {
      this.player.setScale(1, 0.7);
      body.setSize(22, 26, false).setOffset(1, 10);
    } else if (!crouch && this.player.scaleY !== 1) {
      this.player.setScale(1, 1);
      body.setSize(22, 36, false).setOffset(1, 0);
    }
  }
}
