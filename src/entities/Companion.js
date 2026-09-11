import Phaser from 'phaser';
import { HER_LINES } from '../data/evening/talk.js';
import { sfx } from '../systems/audio.js';

// B3 — her, on the road. The walk-mode companion controller: no puzzles, no
// call button. Behaviours: follow_abreast | ahead | behind | catch_up |
// hold_hand | sit | point_at. She never teleports: left behind, she jogs,
// calls out, and catches up slightly out of breath. Her talk is an ambient
// pool on a distance-and-silence timer — floating text, no panel, no pause.
const T = 32;

export default class Companion {
  constructor(scene, folk, { roasts = [] } = {}) {
    this.scene = scene;
    this.f = folk;
    folk.companion = true;
    folk.busy = this;
    this.hand = false;
    this.handCool = 0;
    this.awayT = 0;
    this.aheadUntil = 0;
    this.nextAhead = scene.time.now + 20000;
    this.called = false;
    this.lagging = false;
    this.nextLine = scene.time.now + Phaser.Math.Between(40000, 70000);
    this.lastSpoke = scene.time.now;
    this.walkIdx = 0;
    this.roasts = [...roasts];
    this.pointed = new Set();
    this.side = -1;
    this.handG = scene.add.rectangle(0, 0, 4, 3, 0x9a6a48).setDepth(11.8).setVisible(false);
    this.lastStride = 0;
    this.lastX = folk.x;
    this.walked = 0;
  }

  // say something, if she hasn't just
  line(text, force = false) {
    const now = this.scene.time.now;
    if (!force && now - this.lastSpoke < 6000) return false;
    this.lastSpoke = now;
    this.f.say(text, null, { slow: 1.2 });
    return true;
  }

  // she points things out: the first star, the owl, the moon, the deer, "look"
  point(kind) {
    if (this.pointed.has(kind)) return;
    const text = HER_LINES.point[kind];
    if (!text) return;
    this.pointed.add(kind);
    this.line(text, true);
    const f = this.f;
    this.scene.tweens.add({ targets: f.art, angle: f.art.flipX ? 6 : -6, duration: 300, yoyo: true, hold: 900 });
  }

  update(time, delta) {
    const s = this.scene;
    const f = this.f;
    const p = s.player;
    const dt = delta / 1000;
    if (s.ending && s.ridgeEnded) return;

    // --- sitting when he sits
    if (s.joSitting || s.joSeated) {
      this.hand = false;
      this.handG.setVisible(false);
      const bench = s.sitBench;
      const side = f.x < p.x ? -1 : 1;
      const want = p.x + side * (bench ? 22 : 26);
      if (f.state !== 'sit') {
        if (Math.abs(want - f.x) > 3) {
          f.target = want;
          f.walkSpeed = 90;
          f.state = 'walk';
        } else {
          f.sitDown();
          if (bench) f.y = bench.y - 8;
          f.look(p.x);
        }
      }
      // on the ridge bench she leans on his shoulder
      if (f.state === 'sit' && bench && bench.id === 'ridge_bench') {
        f.x += (p.x + side * 16 - f.x) * Math.min(1, dt * 2);
        f.art.setAngle(side * -9);
      }
      return;
    }
    if (f.state === 'sit') {
      f.stand();
      f.art.setAngle(0);
      f.y = s.groundY(f.x, f.y - 40);
    }

    const dir = p.flipX ? -1 : 1;
    const moving = Math.abs(p.body.velocity.x) > 30;

    // --- holding hands: walk into her, and they do; press away, and they don't
    if (this.hand) {
      const left = p.cursors.left.isDown || p.keys.A.isDown;
      const right = p.cursors.right.isDown || p.keys.D.isDown;
      const away = (this.side < 0 && right && !left) || (this.side > 0 && left && !right);
      // (walking away from her side means pulling the hand away)
      const pulling = this.side < 0 ? left && p.x - f.x > 22 : right && f.x - p.x > 22;
      this.awayT = away || pulling ? this.awayT + delta : 0;
      if (this.awayT > 420 || !p.body.onFloor() && p.body.velocity.y < -200) {
        this.hand = false;
        this.handCool = time + 1500;
        this.handG.setVisible(false);
      } else {
        f.x = p.x + this.side * 16;
        f.y = s.groundY(f.x, p.y - 20);
        f.state = moving ? 'walk' : 'idle';
        f.target = null;
        f.art.setFlipX(p.flipX);
        // the walk cycles sync
        f.stride = p.art.texture.key.startsWith('jo-run') && moving ? 1 : 0;
        this.handG.setVisible(true).setPosition((p.x + f.x) / 2, p.y + 4);
        this.footsteps();
        return;
      }
    } else if (time > this.handCool && Math.abs(f.x - p.x) < 15 && moving && Math.sign(p.body.velocity.x) === Math.sign(f.x - p.x) && p.body.onFloor()) {
      this.hand = true;
      this.side = f.x < p.x ? -1 : 1;
      return;
    }

    // --- where to be: beside him; behind on the climbs; ahead on the flat
    const climbing = p.body.velocity.y < -40 || (s.slopeUnder && s.slopeUnder());
    if (!this.aheadUntil && time > this.nextAhead && !climbing && moving) {
      this.aheadUntil = time + Phaser.Math.Between(5000, 9000);
      this.nextAhead = time + Phaser.Math.Between(25000, 45000);
    }
    if (this.aheadUntil && time > this.aheadUntil) this.aheadUntil = 0;
    let want = p.x - dir * 30;
    if (climbing) want = p.x - dir * 70;
    else if (this.aheadUntil) want = p.x + dir * 60;
    const gap = Math.abs(p.x - f.x);
    let speed = moving ? 205 : 110;
    if (gap > 9 * T) {
      // left behind: she jogs, and calls out
      speed = 275;
      if (!this.lagging) {
        this.lagging = true;
        this.line(HER_LINES.call_out[Phaser.Math.Between(0, HER_LINES.call_out.length - 1)], true);
      }
    } else if (this.lagging && gap < 2 * T) {
      this.lagging = false;
      this.scene.time.delayedCall(600, () => this.line(HER_LINES.caught_up[Phaser.Math.Between(0, HER_LINES.caught_up.length - 1)], true));
    }
    if (Math.abs(want - f.x) > 6) {
      f.target = want;
      f.walkSpeed = speed;
      f.state = 'walk';
    } else if (!moving) {
      f.state = 'idle';
      f.target = null;
      f.look(p.x);
    }
    this.footsteps();

    // --- talk: fragments, with long comfortable silences between
    if (time > this.nextLine && gap < 5 * T && !s.talkingHere) {
      this.nextLine = time + Phaser.Math.Between(70000, 140000);
      let text = null;
      if (this.roasts.length && Math.random() < 0.4) text = this.roasts.shift();
      else if (this.walkIdx < HER_LINES.walk.length) text = HER_LINES.walk[this.walkIdx++];
      if (text) this.line(text);
    }
  }

  // a second footstep, slightly out of phase with his
  footsteps() {
    const f = this.f;
    const d = Math.abs(f.x - this.lastX);
    this.lastX = f.x;
    this.walked += d;
    if (this.walked > 30) {
      this.walked = 0;
      if (this.scene.canHear(f.x, 8)) sfx(this.scene.weather.cover > 0.25 || f.x > 638 * T ? 'crunch' : 'step');
    }
  }

  release() {
    this.hand = false;
    this.handG.setVisible(false);
  }
}
