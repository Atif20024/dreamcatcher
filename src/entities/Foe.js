import Phaser from 'phaser';
import { sfx } from '../systems/audio.js';
import { dreamDust, hitStop } from '../systems/effects.js';
import { showTutorial } from '../systems/tutorial.js';
import { frameKeys } from '../utils/pixelart.js';
import { D } from '../builders/depths.js';

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
    this.setDepth(D.FOE);
    if (def.big) this.setScale(1.2);

    // C1.2 — frames are stepped by distance travelled, never by a timer, so a
    // foe's legs always match the speed it is actually moving at.
    this.walkFrames = frameKeys(scene, texture, 3);
    this.walkPhase = 0;
    this.frameStep = def.human ? 26 : 18;
    // a contact shadow: without one, a foe reads as pasted onto the backdrop
    this.shadow = scene.add.ellipse(this.x, this.y, 26, 8, 0x000000, 0.35).setDepth(D.FOE - 1);
    this.alertMark = null;

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
      // an actual cone, not a slab: a rectangle at this size reads as a
      // floating panel now that the foreground is brighter
      const r = this.sightRange;
      this.sightCone = scene.add
        .triangle(this.x, this.y, 0, 0, r, -r * 0.42, r, r * 0.42, 0xf2e0a0, 0.07)
        .setDepth(D.FOE - 2);
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
    this.destroy(); // destroy() takes the shadow, mark and cone with it
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

  // called first thing each update: walk cycle, shadow, alert mark
  animate(time) {
    const vx = this.body.velocity.x;
    if (this.walkFrames.length > 1) {
      this.walkPhase += Math.abs(vx) * 0.016;
      if (Math.abs(vx) < 4) this.walkPhase = 0;
      const f = Math.floor(this.walkPhase / this.frameStep) % this.walkFrames.length;
      const key = Math.abs(vx) < 4 ? this.walkFrames[0] : this.walkFrames[f];
      if (this.texture.key !== key) this.setTexture(key);
    }
    // the grab telegraph leans in. (A stagger has its own tween on `angle`,
    // so don't write to it here or the shove wobble gets flattened.)
    if (this.state === 'windup') this.setAngle(this.flipX ? -9 : 9);
    else if (this.state !== 'staggered' && this.angle !== 0 && !this.scene.tweens.isTweening(this)) this.setAngle(0);
    if (this.shadow) {
      this.shadow.setPosition(this.x, this.y + this.displayHeight / 2 - 1);
      this.shadow.setVisible(this.visible);
    }
    const alert = this.state === 'alert' || this.state === 'windup';
    if (alert && !this.alertMark) {
      this.alertMark = this.scene.add
        .text(this.x, this.y - 34, '!', { fontFamily: 'monospace', fontSize: '18px', color: '#f2d580' })
        .setOrigin(0.5)
        .setDepth(D.FOE + 1);
    } else if (!alert && this.alertMark) {
      this.alertMark.destroy();
      this.alertMark = null;
    }
    if (this.alertMark) this.alertMark.setPosition(this.x, this.y - 34 - Math.sin(time / 120) * 3);
  }

  destroy(fromScene) {
    if (this.shadow) this.shadow.destroy();
    if (this.alertMark) this.alertMark.destroy();
    if (this.sightCone) this.sightCone.destroy();
    super.destroy(fromScene);
  }

  update(time, player) {
    if (!this.body) return;
    this.animate(time);

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
      this.sightCone.setPosition(this.x + facing * 6, this.y - 4).setScale(facing, 1);
      this.sightCone.setFillStyle(
        this.state === 'windup' ? 0xf2a060 : 0xf2e0a0,
        this.state === 'alert' || this.state === 'windup' ? 0.14 : 0.06
      );
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
      const ducking = player.crouching; // slipping under the grab
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
