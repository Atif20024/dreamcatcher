import Phaser from 'phaser';
import { sfx } from '../systems/audio.js';

// The animals of the long evening: seven cats with routines, the old dog,
// pigeons, herons, a goat nobody explains, and the road's sheep, owl, deer,
// fireflies, bees, moths and swallows. None of them is a pickup or a hazard;
// all of them notice Jo, mostly by deciding he isn't very interesting.
const T = 32;

// ---------------------------------------------------------------------------
// Cats. Routines: sleeper (sleeps through everything), aloof (refuses to be
// touched), follower (follows Jo once he's been still near it), bakery
// (drifts toward the smell), wanderer, roof. Any cat but the aloof one and
// the sleeper comes to a Jo who has stood still for four seconds.
// ---------------------------------------------------------------------------
export class Cat {
  constructor(scene, x, y, routine, coat) {
    this.scene = scene;
    this.routine = routine;
    this.coat = coat;
    this.home = x;
    this.x = x;
    this.y = scene.groundY(x, y - 30);
    this.state = routine === 'sleeper' ? 'sleep' : 'sit';
    this.img = scene.add.image(x, this.y, `ev-cat${coat}-${this.state === 'sleep' ? 'sleep' : 'sit'}`).setOrigin(0.5, 1).setDepth(10.5);
    this.shadow = scene.add.image(x, this.y, 'ev-shadow').setOrigin(0.05, 0.5).setDepth(9).setScale(0.45, 0.6).setAlpha(0.25);
    this.target = null;
    this.walked = 0;
    this.frame = 0;
    this.speed = 48;
    this.next = scene.time.now + Phaser.Math.Between(3000, 9000);
    this.lookUntil = 0;
    this.following = false;
    this.sheltering = false;
    this.prints = 0;
  }

  goTo(x, speed = 48) {
    this.target = x;
    this.speed = speed;
    this.state = 'walk';
  }

  lookUp() {
    if (this.state !== 'sleep') this.lookUntil = this.scene.time.now + 1500;
  }

  update(time, delta, ctx) {
    const s = this.scene;
    const dt = delta / 1000;
    const p = ctx.player;
    const dist = Math.abs(p.x - this.x);
    const sameLevel = Math.abs(p.y + 24 - this.y) < 48;
    // routine decisions
    if (this.routine === 'aloof' && dist < 3 * T && sameLevel && this.state !== 'walk') {
      this.goTo(this.x + (this.x > p.x ? 1 : -1) * 5 * T, 90);
    }
    if (ctx.rain && this.routine !== 'sleeper' && !this.sheltering) {
      this.sheltering = true;
      this.goTo(ctx.shelterFor(this.x), 120);
    }
    if (!ctx.rain && this.sheltering) {
      this.sheltering = false;
      this.goTo(this.home, 40);
    }
    if (this.following && !ctx.rain) {
      const want = p.x + (p.flipX ? 1 : -1) * 1.8 * T;
      if (Math.abs(want - this.x) > 1.5 * T && sameLevel) this.goTo(want, 70 + Math.min(80, dist / 4));
    }
    if (ctx.stillFor > 4000 && !this.following && this.routine !== 'aloof' && this.routine !== 'sleeper' && dist < 12 * T && sameLevel && !ctx.rain && ctx.catComing === null) {
      ctx.claimCat(this);
      this.goTo(p.x + (this.x < p.x ? -1 : 1) * T, 55);
      if (this.routine === 'follower') this.following = true;
    }
    if (time > this.next && this.state !== 'walk' && !this.following && !this.sheltering) {
      this.next = time + Phaser.Math.Between(6000, 15000);
      if (this.routine === 'wanderer' || this.routine === 'roof') this.goTo(this.home + Phaser.Math.Between(-6, 6) * T);
      else if (this.routine === 'bakery' && ctx.bakeryX !== null) this.goTo(ctx.bakeryX + Phaser.Math.Between(-1, 1) * T, 40);
      else if (this.routine === 'follower' && Math.random() < 0.4) this.goTo(this.home + Phaser.Math.Between(-3, 3) * T);
    }
    // move
    if (this.state === 'walk' && this.target !== null) {
      const dx = this.target - this.x;
      const step = Math.sign(dx) * Math.min(Math.abs(dx), this.speed * dt);
      this.x += step;
      this.walked += Math.abs(step);
      if (this.walked > 7) {
        this.walked = 0;
        this.frame = 1 - this.frame;
        // tiny prints in the snow, which the cat hates
        if (ctx.snowy && ++this.prints % 2 === 0) ctx.print(this.x, this.y, 2);
      }
      this.img.setFlipX(dx < 0);
      this.y = s.groundY(this.x, this.y - 30);
      if (Math.abs(dx) < 1) {
        this.state = 'sit';
        this.target = null;
        if (ctx.snowy) {
          // shake a paw
          s.tweens.add({ targets: this.img, angle: 6, duration: 80, yoyo: true, repeat: 2 });
        }
      }
    }
    const up = time < this.lookUntil;
    const key = `ev-cat${this.coat}-${this.state === 'sleep' ? 'sleep' : this.state === 'walk' ? `walk${this.frame}` : up ? 'up' : 'sit'}`;
    if (this.img.texture.key !== key) this.img.setTexture(key);
    this.img.setPosition(this.x, this.y).setTint(ctx.light.ambient);
    this.shadow.setPosition(this.x - 3, this.y - 1).setTint(ctx.light.shadow).setAlpha(ctx.light.shadowAlpha * 0.8).setScale(0.35 * ctx.light.shadowLen, 0.6);
  }

  teleport(dx) {
    this.x += dx;
    this.home += dx;
    if (this.target !== null) this.target += dx;
  }
}

// ---------------------------------------------------------------------------
// The old dog. Asleep in the square until Jo stops by him; then he follows,
// for as long as Jo likes — and, since the road, he stays.
// ---------------------------------------------------------------------------
export class Dog {
  constructor(scene, x, y) {
    this.scene = scene;
    this.x = x;
    this.home = x;
    this.y = scene.groundY(x, y - 30);
    this.state = 'lie';
    this.img = scene.add.image(x, this.y, 'ev-dog-lie').setOrigin(0.5, 1).setDepth(10.6);
    this.shadow = scene.add.image(x, this.y, 'ev-shadow').setOrigin(0.05, 0.5).setDepth(9).setScale(0.6, 0.7).setAlpha(0.25);
    this.following = false;
    this.walked = 0;
    this.frame = 0;
    this.vx = 0;
    this.ahead = 0;
    this.fetch = null; // a thrown stick
    this.zoomUntil = 0;
    this.rollUntil = 0;
    this.drinkUntil = 0;
    this.nextRun = scene.time.now + 8000;
  }

  wake() {
    if (this.following) return;
    this.following = true;
    sfx('woof');
    this.state = 'sit';
  }

  update(time, delta, ctx) {
    const dt = delta / 1000;
    const s = this.scene;
    const p = ctx.player;
    let targetX = null;
    let speed = 70;
    if (this.fetch && this.fetch.active) {
      targetX = this.fetch.x;
      speed = 180;
      if (Math.abs(this.fetch.x - this.x) < 10 && this.fetch.landed) {
        // bring it back, drop it at his feet
        ctx.dogHasStick(this.fetch);
        this.fetch = null;
      }
    } else if (this.following) {
      const sitting = ctx.joSitting;
      if (sitting) {
        targetX = p.x + (p.flipX ? -1 : 1) * 20;
        speed = 60;
      } else if (time < this.zoomUntil) {
        // snow: he loses his mind with joy
        targetX = p.x + Math.sin(time / 300) * 5 * T;
        speed = 210;
      } else {
        // the road: runs ahead and comes back, the whole way
        if (ctx.onRoad && time > this.nextRun) {
          this.nextRun = time + Phaser.Math.Between(9000, 16000);
          this.ahead = this.ahead ? 0 : (p.flipX ? -1 : 1) * Phaser.Math.Between(4, 7) * T;
        }
        targetX = p.x - (p.flipX ? -1 : 1) * 1.6 * T + this.ahead;
        const d = Math.abs(targetX - this.x);
        speed = this.ahead ? 150 : 60 + Math.min(160, d * 0.8);
        if (d < 1.5 * T && !this.ahead) targetX = null;
        if (this.ahead && d < 20) this.ahead = 0;
      }
    }
    if (time < this.drinkUntil || time < this.rollUntil) targetX = null;
    if (targetX !== null && Math.abs(targetX - this.x) > 3) {
      const dx = targetX - this.x;
      const step = Math.sign(dx) * Math.min(Math.abs(dx), speed * dt);
      this.x += step;
      this.walked += Math.abs(step);
      if (this.walked > 9) {
        this.walked = 0;
        this.frame = 1 - this.frame;
        if (ctx.snowy) ctx.print(this.x, this.y, 3);
      }
      this.img.setFlipX(dx < 0);
      this.state = 'walk';
    } else if (this.following) {
      this.state = ctx.joSitting || time < this.drinkUntil ? (ctx.joSitting ? 'lie' : 'sit') : 'sit';
    }
    this.y = s.groundY(this.x, this.y - 30);
    const key = this.state === 'walk' ? `ev-dog-walk${this.frame}` : this.state === 'lie' ? 'ev-dog-lie' : 'ev-dog-sit';
    if (this.img.texture.key !== key) this.img.setTexture(key);
    // rolling in the snow
    this.img.setAngle(time < this.rollUntil ? Math.sin(time / 90) * 60 : 0);
    // the lean against Jo's leg is a two-pixel tilt toward him
    if (ctx.joSitting && this.following && Math.abs(p.x - this.x) < 30) this.img.setAngle(this.x < p.x ? 6 : -6);
    this.img.setPosition(this.x, this.y + (time < this.drinkUntil ? 3 : 0)).setTint(ctx.light.ambient);
    this.shadow.setPosition(this.x - 5, this.y - 1).setTint(ctx.light.shadow).setAlpha(ctx.light.shadowAlpha * 0.85).setScale(0.55 * ctx.light.shadowLen, 0.7);
  }

  zoomies(ms = 7000) {
    this.zoomUntil = this.scene.time.now + ms;
    sfx('woof');
  }

  roll() {
    this.rollUntil = this.scene.time.now + 1800;
  }

  drink() {
    this.drinkUntil = this.scene.time.now + 3000;
  }

  teleport(dx) {
    this.x += dx;
    this.home += dx;
  }
}

// ---------------------------------------------------------------------------
// Pigeons (a flock on a ledge) and swallows (a flock that never lands).
// ---------------------------------------------------------------------------
export class Flock {
  constructor(scene, x, y, n, kind = 'pigeon') {
    this.scene = scene;
    this.kind = kind;
    this.x = x;
    this.y = y;
    this.birds = [];
    for (let i = 0; i < n; i++) {
      const b = scene.add.image(x + (i - n / 2) * 7, y, kind === 'swallow' ? 'ev-swallow' : 'ev-pigeon').setDepth(10.4);
      b.hx = b.x;
      b.hy = b.y;
      b.ph = Math.random() * 6;
      this.birds.push(b);
    }
    this.up = kind === 'swallow';
    this.upUntil = 0;
  }

  lift() {
    if (this.kind === 'swallow' || this.up) return;
    this.up = true;
    this.upUntil = this.scene.time.now + Phaser.Math.Between(5000, 8000);
    sfx('flap');
    this.birds.forEach((b) => b.setTexture('ev-pigeon-fly'));
  }

  update(time, delta, ctx) {
    const t = time / 1000;
    if (this.kind === 'pigeon' && !this.up && ctx.near(this.x, this.y, 3 * T) && ctx.running) this.lift();
    if (this.kind === 'pigeon' && this.up && time > this.upUntil) {
      this.up = false;
      this.birds.forEach((b) => {
        b.setTexture('ev-pigeon');
        b.x = b.hx;
        b.y = b.hy;
      });
    }
    this.birds.forEach((b, i) => {
      if (this.kind === 'swallow') {
        b.x = this.x + Math.sin(t * 0.8 + b.ph) * 180 + Math.sin(t * 2.1 + i) * 30;
        b.y = this.y + Math.sin(t * 1.7 + b.ph * 2) * 40;
        b.setFlipX(Math.cos(t * 0.8 + b.ph) < 0);
      } else if (this.up) {
        b.x = this.x + Math.cos(t * 1.4 + b.ph) * 90;
        b.y = this.y - 60 + Math.sin(t * 2.2 + b.ph) * 26;
        b.setFlipX(Math.sin(t * 1.4 + b.ph) > 0);
      } else if (Math.random() < 0.004) {
        b.setFlipX(!b.flipX); // a pigeon turns round, as pigeons do
      }
      b.setTint(ctx.light.ambient);
    });
  }

  teleport(dx) {
    this.x += dx;
    this.birds.forEach((b) => {
      b.x += dx;
      b.hx += dx;
    });
  }
}

// ---------------------------------------------------------------------------
// A heron: stands in the shallows like a coat on a hook; takes off if you sit
// long enough or play at it, and comes back later, unbothered.
// ---------------------------------------------------------------------------
export class Heron {
  constructor(scene, x, y) {
    this.scene = scene;
    this.x = x;
    this.y = scene.groundY(x, y - 30);
    this.home = { x, y: this.y };
    this.img = scene.add.image(x, this.y, 'ev-heron').setOrigin(0.5, 1).setDepth(10.3);
    this.flying = false;
  }

  takeOff() {
    if (this.flying) return;
    this.flying = true;
    sfx('flap');
    this.img.setTexture('ev-heron-fly').setOrigin(0.5, 0.5);
    this.scene.tweens.add({
      targets: this.img,
      x: this.x + 600,
      y: this.y - 280,
      duration: 6000,
      ease: 'sine.in',
      onComplete: () => {
        this.img.setVisible(false);
        this.scene.time.delayedCall(Phaser.Math.Between(40000, 90000), () => {
          this.img.setTexture('ev-heron').setOrigin(0.5, 1).setPosition(this.home.x, this.home.y).setVisible(true).setAlpha(0);
          this.scene.tweens.add({ targets: this.img, alpha: 1, duration: 2000 });
          this.flying = false;
        });
      },
    });
  }

  update(time, delta, ctx) {
    if (!this.flying && Math.random() < 0.002) this.img.setFlipX(!this.img.flipX);
    this.img.setTint(ctx.light.ambient);
  }

  teleport() {}
}

// ---------------------------------------------------------------------------
// Things that mostly stand there: the goat, sheep with bells, the owl, deer.
// ---------------------------------------------------------------------------
export class Stander {
  constructor(scene, x, y, key, { wander = 0, depth = 10.2, faceJo = false, chew = false } = {}) {
    this.scene = scene;
    this.x = x;
    this.home = x;
    this.y = scene.groundY(x, y - 30);
    this.img = scene.add.image(x, this.y, key).setOrigin(0.5, 1).setDepth(depth);
    this.wander = wander;
    this.faceJo = faceJo;
    this.chew = chew;
    this.target = null;
    this.next = scene.time.now + Phaser.Math.Between(4000, 10000);
  }

  update(time, delta, ctx) {
    const dt = delta / 1000;
    if (this.wander && time > this.next) {
      this.next = time + Phaser.Math.Between(5000, 12000);
      this.target = this.home + Phaser.Math.Between(-this.wander, this.wander) * T;
    }
    if (this.target !== null) {
      const dx = this.target - this.x;
      this.x += Math.sign(dx) * Math.min(Math.abs(dx), 20 * dt);
      this.img.setFlipX(dx < 0);
      if (Math.abs(dx) < 1) this.target = null;
      this.y = this.scene.groundY(this.x, this.y - 30);
    }
    // deer watch and don't run
    if (this.faceJo) this.img.setFlipX(ctx.player.x < this.x);
    const chewY = this.chew ? Math.sin(time / 180) * 0.5 : 0;
    this.img.setPosition(this.x, this.y + chewY).setTint(ctx.light.ambient);
  }

  teleport(dx) {
    this.x += dx;
    this.home += dx;
  }
}

// ---------------------------------------------------------------------------
// Little lights and little lives: fireflies gather round a still Jo and
// scatter if he plays; bees orbit the hives; moths orbit the lamps.
// ---------------------------------------------------------------------------
export class Motes {
  constructor(scene, x, y, n, kind) {
    this.scene = scene;
    this.kind = kind;
    this.x = x;
    this.y = y;
    this.m = [];
    const col = kind === 'firefly' ? 0xd8f870 : kind === 'bee' ? 0xe8c040 : 0xe8e0c8;
    for (let i = 0; i < n; i++) {
      const d = scene.add.circle(x, y, kind === 'firefly' ? 1.6 : 1.2, col, 1).setDepth(kind === 'firefly' ? 64 : 10.8);
      d.ph = Math.random() * 6;
      d.r = Phaser.Math.Between(8, kind === 'firefly' ? 90 : 26);
      d.ox = x;
      d.oy = y;
      if (kind === 'firefly') {
        d.glow = scene.add.image(x, y, 'ev-glow').setDepth(63).setScale(0.35).setTint(0xd8f870).setBlendMode(Phaser.BlendModes.ADD);
      }
      this.m.push(d);
    }
    this.scatterUntil = 0;
  }

  scatter() {
    this.scatterUntil = this.scene.time.now + 5000;
  }

  update(time, delta, ctx) {
    const t = time / 1000;
    const p = ctx.player;
    const gather = this.kind === 'firefly' && ctx.stillFor > 2500 && Math.abs(p.x - this.x) < 12 * T && time > this.scatterUntil;
    this.m.forEach((d) => {
      let cx = this.x;
      let cy = this.y;
      let r = d.r;
      if (gather) {
        cx = p.x;
        cy = p.y - 10;
        r = Math.min(r, 40);
      }
      if (time < this.scatterUntil) r *= 2.4;
      const tx = cx + Math.cos(t * (0.5 + (d.ph % 1)) + d.ph) * r;
      const ty = cy + Math.sin(t * (0.7 + (d.ph % 0.5)) + d.ph * 2) * r * 0.5;
      d.ox += (tx - d.ox) * 0.03;
      d.oy += (ty - d.oy) * 0.03;
      d.setPosition(d.ox, d.oy);
      if (this.kind === 'firefly') {
        const on = 0.5 + 0.5 * Math.sin(t * 2 + d.ph * 3);
        const dark = ctx.dark;
        d.setAlpha(on * dark);
        d.glow.setPosition(d.ox, d.oy).setAlpha(on * dark * 0.8);
      }
    });
  }

  teleport(dx) {
    this.x += dx;
    this.m.forEach((d) => (d.ox += dx));
  }
}
