import Phaser from 'phaser';

// M0 playground: a rectangle "Jo" that runs, jumps, and crouches on platforms.
// This scene exists to prove the engine + deploy pipeline; real scenes replace it.
export default class PlaygroundScene extends Phaser.Scene {
  constructor() {
    super('Playground');
  }

  create() {
    const platforms = this.physics.add.staticGroup();
    const makePlatform = (x, y, w, h) => {
      const p = this.add.rectangle(x, y, w, h, 0x4a4a6a);
      this.physics.add.existing(p, true);
      platforms.add(p);
    };
    makePlatform(480, 530, 960, 20); // ground
    makePlatform(300, 400, 160, 16);
    makePlatform(600, 300, 160, 16);
    makePlatform(850, 420, 120, 16);

    this.player = this.add.rectangle(100, 450, 24, 40, 0xf2b880);
    this.physics.add.existing(this.player);
    this.player.body.setCollideWorldBounds(true);
    this.physics.add.collider(this.player, platforms);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('W,A,S,D,SPACE');

    this.add
      .text(16, 16, 'Dreamcatcher — M0 playground\n←/→ or A/D move · ↑/W/Space jump · ↓/S crouch', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#c8c8e0',
      })
      .setScrollFactor(0);
  }

  update() {
    const body = this.player.body;
    const left = this.cursors.left.isDown || this.keys.A.isDown;
    const right = this.cursors.right.isDown || this.keys.D.isDown;
    const jump = this.cursors.up.isDown || this.keys.W.isDown || this.keys.SPACE.isDown;
    const crouch = this.cursors.down.isDown || this.keys.S.isDown;

    body.setVelocityX(left ? -220 : right ? 220 : 0);

    if (jump && body.onFloor()) {
      body.setVelocityY(-560);
    }

    // Crouch: shrink the hitbox while held (visual + collision).
    if (crouch && body.onFloor()) {
      this.player.setScale(1, 0.6);
      body.setSize(24, 24, false);
      body.setOffset(0, 16);
    } else if (!crouch) {
      this.player.setScale(1, 1);
      body.setSize(24, 40, false);
      body.setOffset(0, 0);
    }
  }
}
