import Phaser from 'phaser';

// A2 — weather: clear | wind | rain | snow, on a slow ~20-minute cycle.
// The first visit is scripted — clear, rain, clear, snow — so every player
// sees both before they leave. Later visits wander, with a 1-in-6 chance of a
// sudden warm rain early on (§8).
//
// This file owns what falls and what settles; the scene owns how the town
// reacts (people, cats, sheets, the rainbow) through the on* callbacks.

const FIRST_VISIT = [
  ['clear', 230],
  ['wind', 25],
  ['rain', 80],
  ['clear', 250],
  ['wind', 22],
  ['snow', 110],
];
const CYCLE = [
  ['clear', 330],
  ['wind', 25],
  ['rain', 75],
  ['clear', 360],
  ['wind', 25],
  ['snow', 100],
  ['clear', 300],
];

export default class Weather {
  constructor(scene, { firstVisit, forced = null, depth = 70 }) {
    this.scene = scene;
    this.depth = depth;
    const plan = firstVisit ? [...FIRST_VISIT, ...CYCLE] : [...CYCLE];
    if (!firstVisit && Math.random() < 1 / 6) plan.splice(0, 1, ['clear', 90], ['rain', 60], ['clear', 200]);
    this.plan = plan;
    this.step = -1;
    this.stateT = 0;
    this.state = 'clear';
    this.forced = forced;
    this.rain = 0; // 0..1, how hard
    this.snow = 0;
    this.wind = 0.15;
    this.cover = 0; // settled snow, 0..1, persists until the next clear
    this.lastFlakeAt = 0;
    this.strips = new Map();
    this.cb = {};
    const cam = scene.cameras.main;
    this.camW = cam.width;
    this.camH = cam.height;
    this.drops = [];
    this.flakes = [];
    this.splashes = [];
    this.advance();
    // (a forced state is applied by the scene once it's listening: see
    // EveningScene.create, so the town reacts to it)
    void forced;
  }

  on(name, fn) {
    this.cb[name] = fn;
  }

  emit(name, ...a) {
    if (this.cb[name]) this.cb[name](...a);
  }

  advance() {
    this.step += 1;
    if (this.step >= this.plan.length) {
      this.plan = [...CYCLE];
      this.step = 0;
    }
    const [st, secs] = this.plan[this.step];
    this.enter(st, secs);
  }

  enter(st, secs) {
    const prev = this.state;
    this.state = st;
    this.stateT = 0;
    this.stateLen = secs * 1000;
    if (prev === 'rain' && st !== 'rain') this.emit('rainEnd');
    if (prev === 'snow' && st !== 'snow') this.emit('snowEnd');
    if (st === 'rain') this.emit('rainStart');
    if (st === 'snow') this.emit('snowStart');
    if (st === 'wind') this.emit('windStart');
    if (st === 'clear' && prev !== 'clear') this.emit('clear', prev);
  }

  // dev: ?weather=rain and the like
  force(st) {
    const map = { rain: 75, snow: 110, wind: 30, clear: 300 };
    if (!map[st]) return;
    this.enter(st, map[st]);
  }

  // the snow on the switchbacks under the aurora is the shot of the game:
  // if the road gets there and it has not snowed for a while, it snows
  requestSnow() {
    if (this.state === 'snow' || this.state === 'rain') return;
    this.enter('snow', 120);
  }

  update(time, delta, ctx) {
    const dt = delta / 1000;
    this.stateT += delta;
    if (this.stateT > this.stateLen) this.advance();
    const st = this.state;

    // intensity: rain eases in and stops dead (mid-bar); snow eases in,
    // and ends by simply stopping — the last flake falls alone
    const into = Math.min(1, this.stateT / 8000);
    const rainTarget = st === 'rain' ? into : 0;
    this.rain = rainTarget === 0 ? 0 : this.rain + (rainTarget - this.rain) * Math.min(1, dt * 0.8);
    const snowTarget = st === 'snow' ? Math.min(1, this.stateT / 15000) : 0;
    if (snowTarget === 0 && this.snow > 0) this.lastFlakeAt = time;
    this.snow = snowTarget;
    const windTarget = st === 'wind' ? 0.9 + Math.sin(time / 1300) * 0.1 : st === 'rain' ? 0.45 : st === 'snow' ? 0 : 0.15 + Math.sin(time / 9000) * 0.08;
    this.wind += (windTarget - this.wind) * Math.min(1, dt * 0.6);

    // snow settles on every upward face over ~90 s; the next clear melts it
    if (st === 'snow') this.cover = Math.min(1, this.cover + dt / 90);
    else if (st === 'clear') this.cover = Math.max(0, this.cover - dt / 50);

    this.updateRain(time, dt, ctx);
    this.updateSnow(time, dt, ctx);
    this.updateCover(ctx);
  }

  // ---- rain ------------------------------------------------------------------

  updateRain(time, dt, ctx) {
    const s = this.scene;
    const cam = s.cameras.main;
    // three layers of drops at three speeds
    const want = Math.floor(this.rain * 220);
    while (this.drops.length < want) {
      const layer = Phaser.Math.Between(0, 2);
      const d = s.add
        .image(Phaser.Math.Between(-60, this.camW + 60), Phaser.Math.Between(-this.camH, 0), 'ev-drop')
        .setScrollFactor(0)
        .setDepth(layer === 2 ? this.depth + 2 : layer === 1 ? this.depth : -24)
        .setTint(0xc8d8e8)
        .setAlpha(layer === 2 ? 0.55 : layer === 1 ? 0.4 : 0.25)
        .setScale(layer === 2 ? 1.4 : 1, layer === 2 ? 1.3 : layer === 1 ? 1 : 0.7);
      d.layer = layer;
      d.vy = [520, 760, 980][layer];
      this.drops.push(d);
    }
    if (this.drops.length > want) {
      // it stops mid-bar: all at once
      this.drops.splice(want).forEach((d) => d.destroy());
    }
    for (const d of this.drops) {
      d.y += d.vy * dt;
      d.x -= d.vy * 0.12 * dt * (0.5 + this.wind);
      d.setAngle(8 * (0.5 + this.wind));
      if (d.y > this.camH + 10) {
        // the near layer lands on something and splashes
        if (d.layer >= 1 && Math.random() < 0.5) this.splashAt(d.x + cam.scrollX, ctx);
        d.y = Phaser.Math.Between(-80, -10);
        d.x = Phaser.Math.Between(-60, this.camW + 60);
      }
    }
    if (this.rain > 0.05) {
      // roofs drip at their edges; the canal gets rings
      if (Math.random() < dt * 8 * this.rain && ctx.edges) {
        const e = ctx.edges(cam);
        if (e) {
          const drip = s.add.image(e.x, e.y, 'ev-drop').setDepth(this.depth - 1).setTint(0xd8e8f8).setAlpha(0.8);
          s.tweens.add({ targets: drip, y: e.y + 60, alpha: 0, duration: 380, onComplete: () => drip.destroy() });
        }
      }
      if (Math.random() < dt * 10 * this.rain && ctx.water) {
        const w = ctx.water(cam);
        if (w) {
          const ring = s.add.ellipse(w.x, w.y, 4, 2).setStrokeStyle(1, 0xe8f0f8, 0.7).setDepth(-8.5);
          s.tweens.add({ targets: ring, scaleX: 5, scaleY: 3, alpha: 0, duration: 900, onComplete: () => ring.destroy() });
        }
      }
    }
  }

  splashAt(worldX, ctx) {
    if (!ctx.surfaceY) return;
    const y = ctx.surfaceY(worldX);
    if (y === null) return;
    const s = this.scene;
    const sp = s.add.ellipse(worldX, y, 5, 2, 0xe8f0f8, 0.7).setDepth(this.depth - 1);
    s.tweens.add({ targets: sp, scaleX: 2.2, alpha: 0, duration: 260, onComplete: () => sp.destroy() });
  }

  // ---- snow ------------------------------------------------------------------

  updateSnow(time, dt) {
    const s = this.scene;
    // big slow flakes at four depths; a few lift on the eddies
    const lingering = this.snow === 0 && time - this.lastFlakeAt < 3000 ? 1 : 0;
    const want = this.snow > 0 ? Math.floor(this.snow * 170) : lingering && this.flakes.length ? 1 : 0;
    while (this.flakes.length < want) {
      const layer = Phaser.Math.Between(0, 3);
      const f = s.add
        .image(Phaser.Math.Between(-40, this.camW + 40), Phaser.Math.Between(-this.camH * 0.6, -5), 'ev-flake')
        .setScrollFactor(0)
        .setDepth([-24, -9, this.depth, this.depth + 2][layer])
        .setScale([0.35, 0.55, 0.8, 1.2][layer])
        .setAlpha([0.4, 0.6, 0.85, 0.9][layer]);
      f.vy = [16, 24, 34, 46][layer];
      f.ph = Math.random() * 6;
      f.eddy = Math.random() < 0.08;
      this.flakes.push(f);
    }
    if (this.flakes.length > want) this.flakes.splice(Math.max(1, want)).forEach((f) => f.destroy());
    if (want === 0 && this.flakes.length) {
      this.flakes.forEach((f) => f.destroy());
      this.flakes = [];
    }
    const t = time / 1000;
    for (const f of this.flakes) {
      const up = f.eddy && Math.sin(t * 0.7 + f.ph) > 0.6 ? -1.6 : 1;
      f.y += f.vy * dt * up;
      f.x += Math.sin(t * 0.9 + f.ph) * 12 * dt;
      if (f.y > this.camH + 10) {
        f.y = Phaser.Math.Between(-60, -5);
        f.x = Phaser.Math.Between(-40, this.camW + 40);
      }
    }
  }

  // settled snow: a white lip on every upward face near the camera
  updateCover(ctx) {
    if (this.cover <= 0.001) {
      if (this.strips.size) {
        this.strips.forEach((r) => r.destroy());
        this.strips.clear();
      }
      return;
    }
    if (!ctx.tops) return;
    const cam = this.scene.cameras.main;
    const tx0 = Math.floor(cam.scrollX / 32) - 8;
    const tx1 = Math.floor((cam.scrollX + this.camW) / 32) + 8;
    for (const top of ctx.tops(tx0, tx1)) {
      const key = top.tx * 1000 + top.ty;
      if (this.strips.has(key)) continue;
      const r = this.scene.add
        .rectangle(top.x, top.y, top.slope ? 46 : 32, 6, 0xf4f8ff, 1)
        .setOrigin(0.5, 1)
        .setDepth(-9.4)
        .setAngle(top.slope === 'r' ? -45 : top.slope === 'l' ? 45 : 0);
      r.base = top;
      this.strips.set(key, r);
    }
    const h = 1 + this.cover * 5;
    this.strips.forEach((r) => {
      r.scaleY = h / 6;
      r.setAlpha(Math.min(1, this.cover * 2.2));
    });
  }

  // the fraction of the surface under x that is snowed on (footprints)
  snowy() {
    return this.cover > 0.25;
  }
}
