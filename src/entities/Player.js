import Phaser from 'phaser';
import { createJoTextures } from './jo.js';

const SPEED = 220;
const JUMP = 560;

export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    createJoTextures(scene);
    super(scene, x, y, 'jo-stand');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.setSize(24, 44).setOffset(4, 2);
    this.setCollideWorldBounds(true);

    this.cursors = scene.input.keyboard.createCursorKeys();
    this.keys = scene.input.keyboard.addKeys('W,A,S,D,SPACE,X');
    this.runFrameTimer = 0;
    this.slippery = false; // set by the scene when standing on oil
  }

  update(_time, delta) {
    const body = this.body;
    const left = this.cursors.left.isDown || this.keys.A.isDown;
    const right = this.cursors.right.isDown || this.keys.D.isDown;
    const jump = this.cursors.up.isDown || this.keys.W.isDown || this.keys.SPACE.isDown;
    const crouch = this.cursors.down.isDown || this.keys.S.isDown;

    const target = left ? -SPEED : right ? SPEED : 0;
    if (this.slippery && body.onFloor()) {
      body.setVelocityX(Phaser.Math.Linear(body.velocity.x, target, 0.06));
    } else {
      body.setVelocityX(target);
    }
    if (left) this.setFlipX(true);
    if (right) this.setFlipX(false);

    if (jump && body.onFloor()) {
      body.setVelocityY(-JUMP);
    }

    const moving = left || right;
    if (moving && body.onFloor()) {
      this.runFrameTimer += delta;
      if (this.runFrameTimer > 120) {
        this.runFrameTimer = 0;
        this.setTexture(this.texture.key === 'jo-run' ? 'jo-stand' : 'jo-run');
      }
    } else if (!body.onFloor()) {
      this.setTexture('jo-run');
    } else {
      this.setTexture('jo-stand');
    }

    if (crouch && body.onFloor()) {
      this.setScale(1, 0.7);
      body.setSize(24, 32, false).setOffset(4, 14);
    } else if (!crouch && this.scaleY !== 1) {
      this.setScale(1, 1);
      body.setSize(24, 44, false).setOffset(4, 2);
    }
  }
}
