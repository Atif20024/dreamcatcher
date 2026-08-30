import Phaser from 'phaser';
import { sfx } from '../systems/audio.js';
import { dreamDust, hitStop } from '../systems/effects.js';
import { showTutorial } from '../systems/tutorial.js';

const T = 32;

// D6 — two foe classes.
//
// PEOPLE (human: true) have a job and you are in their way. They cannot be
// killed. Their grab telegraphs for 400ms; if it connects you are THROWN OUT
// (cinematic, back to the checkpoint, -1 heart). You get past them by
// shoving, slipping under the grab, distracting them, hiding, outrunning
// them, or tripping them onto a hazard — never by hurting them.
//
// CREATURES & THINGS (human: false) are stomped or swatted into dream-dust.
export default class Foe extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, def, texture) {
    super(scene, def.wx, def.wy, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(12);

    this.def = def;
    this.kind = def.kind;
    this.human = !!def.human;
    this.big = !!def.big; // bouncers/cops: a shove just clangs off
    this.unkillable = !!def.unkillable;
    this.speedBase = (def.speed || (this.human ? 70 : 60)) * (1 + 0.08 * (scene.difficulty || 0));
    this.patrol = def.patrol ? def.patrol.map((t) => t * T + T / 2) : null;
    this.homeX = def.wx;
    this.dir = -1;

    this.state = 'patrol';
    this.stateUntil = 0;
    this.grabAt = 0;
    this.lureX = null;
    this.seenPlayerAt = 0;

    if (this.human) {
      this.sightCone = scene.add.rectangle(this.x, this.y, 140, 70, 0xf2e0a0, 0.09).setDepth(11);
    }
  }

  get sightRange() {
    return this.def.sight || 150;
  }

  // --- what the player can do to a person -----------------------------

  shove(fromX) {
    if (!this.human) return false;
    if (this.big) {
      sfx('clang');
      this.scene.floatText(this.x, this.y - 40, 'he does not move.', '#c8c0b0');
      return false;
    }
    sfx('clang');
    hitStop(this.scene, 60);
    const away = Math.sign(this.x - fromX) || 1;
    this.setVelocityX(away * 160);
    this.enter('staggered', 1500);
    this.scene.tweens.add({ targets: this, angle: away * 14, duration: 120, yoyo: true });
    return true;
  }

  distract(x) {
    if (!this.human || this.state === 'thrown') return;
    this.lureX = x;
    this.enter('distracted', 3000);
    this.setFlipX(x < this.x);
  }

  // knocked onto a hazard / liquid / loose tile / conveyor -> removed
  trip() {
    if (this.state === 'thrown') return;
    this.enter('thrown', 99999);
    sfx('fail');
    this.scene.floatText(this.x, this.y - 40, this.human ? 'thrown out himself.' : '', '#c8c0b0');
    this.scene.tweens.add({
      targets: this,
      y: this.y + 90,
      alpha: 0,
      angle: 90,
      duration: 700,
      onComplete: () => this.cleanup(),
    });
  }

  die() {
    if (this.human || this.unkillable) return false;
    dreamDust(this.scene, this, { colors: this.def.dustColors });
    sfx('squish');
    this.cleanup();
    return true;
  }

  cleanup() {
    if (this.sightCone) this.sightCone.destroy();
    this.destroy();
  }

  enter(state, ms) {
    this.state = state;
    this.stateUntil = this.scene.time.now + ms;
  }

  // --- perception ------------------------------------------------------

  canSee(player) {
    if (!this.human) return false;
    if (this.scene.playerHidden) return false;
    const dx = player.x - this.x;
    const dy = Math.abs(player.y - this.y);
    if (dy > 60) return false;
    if (Math.abs(dx) > this.sightRange) return false;
    return Math.sign(dx) === (this.flipX ? -1 : 1) || Math.abs(dx) < 40;
  }

  update(time, player) {
    if (!this.body) return;

    // creatures: simple patrol, contact handled by the scene
    if (!this.human) {
      if (this.patrol) {
        if (this.x < this.patrol[0]) this.dir = 1;
        if (this.x > this.patrol[1]) this.dir = -1;
      } else if (this.homeX !== undefined) {
        if (this.x < this.homeX - 70) this.dir = 1;
        else if (this.x > this.homeX + 70) this.dir = -1;
      }
      if (this.body.blocked.left) this.dir = 1;
      if (this.body.blocked.right) this.dir = -1;
      this.setVelocityX(this.dir * this.speedBase);
      this.setFlipX(this.dir < 0);
      return;
    }

    // people
    if (this.sightCone) {
      const facing = this.flipX ? -1 : 1;
      this.sightCone.setPosition(this.x + facing * 70, this.y);
      this.sightCone.setFillStyle(0xf2e0a0, this.state === 'alert' || this.state === 'windup' ? 0.16 : 0.07);
    }

    if (this.state === 'thrown') return;
    if (this.state === 'staggered') {
      this.setVelocityX(this.body.velocity.x * 0.9);
      if (time > this.stateUntil) this.enter('patrol', 0);
      return;
    }
    if (this.state === 'distracted') {
      const d = this.lureX - this.x;
      this.setVelocityX(Math.abs(d) > 20 ? Math.sign(d) * this.speedBase : 0);
      this.setFlipX(d < 0);
      if (time > this.stateUntil) this.enter('patrol', 0);
      return;
    }
    if (this.state === 'windup') {
      this.setVelocityX(0);
      this.setTint(0xffa0a0);
      if (time > this.stateUntil) {
        this.clearTint();
        this.enter('grabbing', 250);
      }
      return;
    }
    if (this.state === 'grabbing') {
      const reach = Math.abs(player.x - this.x) < 42 && Math.abs(player.y - this.y) < 50;
      const ducking = player.scaleY < 1; // slipping under the grab
      if (reach && !ducking) {
        this.scene.throwOut(this);
        this.enter('staggered', 900);
        return;
      }
      if (time > this.stateUntil) this.enter('alert', 600);
      return;
    }

    if (this.canSee(player)) {
      this.seenPlayerAt = time;
      const dx = player.x - this.x;
      if (Math.abs(dx) < 70) {
        showTutorial(this.scene, 'slide_under');
        this.enter('windup', 400);
        sfx('click');
        return;
      }
      this.enter('alert', 0);
      this.setVelocityX(Math.sign(dx) * this.speedBase * 0.9);
      this.setFlipX(dx < 0);
      return;
    }

    // lost sight -> back to patrol after 2s
    if (this.state === 'alert' && time - this.seenPlayerAt > 2000) this.enter('patrol', 0);
    if (this.patrol) {
      if (this.x < this.patrol[0]) this.dir = 1;
      if (this.x > this.patrol[1]) this.dir = -1;
    }
    if (this.body.blocked.left) this.dir = 1;
    if (this.body.blocked.right) this.dir = -1;
    this.setVelocityX(this.dir * this.speedBase * 0.6);
    this.setFlipX(this.dir < 0);
  }
}
