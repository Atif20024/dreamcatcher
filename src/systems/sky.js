import Phaser from 'phaser';

// B2 — the sky, the real protagonist of the second half.
//
// One float drives it all: `phase`, in road screens (0 = the gold of the town
// and the gap in the hedge, 10 = full night on the ridge). The gradient
// follows the walk with a ~20 s lag so the sky is always slightly behind
// him; the stars, the moon and the aurora follow `starPhase`, the furthest
// the gradient has ever got — so turning back runs the colours backwards
// but never takes the stars away (spec §B7: max(progress, time)).
//
// Everything here is screen-space (scrollFactor 0) and drawn wider than the
// view so the vista zooms (down to 0.55) never show bare canvas.

// eight authored gradients: [top, mid, horizon]
const STAGES = [
  [0x5a6aa0, 0xe8a868, 0xf8d890], // gold
  [0x4a5890, 0xe08a50, 0xf8c070], // amber
  [0x3e4a84, 0xd8705a, 0xf0a070], // coral
  [0x34407a, 0xb86a80, 0xe89a88], // rose
  [0x2a3068, 0x7a5a8a, 0xc08090], // violet
  [0x1a1e4a, 0x3a3a6a, 0x6a5a7a], // indigo
  [0x0e1230, 0x1a2048, 0x2e3458], // navy
  [0x060814, 0x0c1024, 0x161c34], // black-blue
];
const RAIN = [0x5a6070, 0x9a9090, 0xc0b0a0];
const SNOW = [0x8a8aa8, 0xe8c0c0, 0xf8e0d8];
// road screen (0-10) -> gradient stage (0-7)
const STAGE_AT = [0, 1, 2, 3, 4, 5, 6, 7, 7, 7, 7];

const lerpC = (a, b, t) => {
  const A = Phaser.Display.Color.IntegerToColor(a);
  const B = Phaser.Display.Color.IntegerToColor(b);
  const c = Phaser.Display.Color.Interpolate.ColorWithColor(A, B, 1000, Math.round(Phaser.Math.Clamp(t, 0, 1) * 1000));
  return Phaser.Display.Color.GetColor(c.r, c.g, c.b);
};
export { lerpC };

// hand-placed constellations (screen space over a 960x540 view): the Plough,
// Cassiopeia's W and Orion. Returning players recognise them.
const CONSTELLATIONS = [
  [[610, 70], [650, 78], [688, 92], [720, 108], [728, 150], [778, 156], [790, 116]],
  [[180, 60], [206, 88], [236, 70], [262, 96], [292, 74]],
  [[420, 150], [470, 146], [436, 190], [446, 192], [456, 194], [428, 236], [474, 232]],
];

export default class Sky {
  constructor(scene, depth) {
    this.scene = scene;
    this.depth = depth;
    const cam = scene.cameras.main;
    this.camW = cam.width;
    this.camH = cam.height;
    this.spanW = Math.ceil(this.camW / 0.55);
    this.spanH = Math.ceil(this.camH / 0.55);
    this.x0 = -(this.spanW - this.camW) / 2;
    this.y0 = -(this.spanH - this.camH) / 2;
    this.horizonY = this.camH * 0.62; // where the gradient meets the sea
    this.phase = 0;
    this.target = 0;
    this.starPhase = 0;
    this.weather = { rain: 0, snow: 0 };
    this.lastDrawn = -1;
    this.time = 0;
    this.onShootingStar = null;

    // gradient: a canvas redrawn when the phase moves
    this.canvas = scene.textures.exists('ev-sky') ? scene.textures.get('ev-sky') : scene.textures.createCanvas('ev-sky', 4, 256);
    this.gradImg = scene.add.image(this.x0, this.y0, 'ev-sky').setOrigin(0).setDisplaySize(this.spanW, this.spanH).setScrollFactor(0).setDepth(depth);

    // the low sun, rim-lighting everything from the west
    this.sunGlow = scene.add.image(0, 0, 'ev-glow').setScrollFactor(0).setDepth(depth + 0.2).setScale(9).setTint(0xf8d890).setAlpha(0.55);
    this.sun = scene.add.circle(0, 0, 26, 0xfff2c8).setScrollFactor(0).setDepth(depth + 0.3);

    this.buildClouds();
    this.buildStars();
    this.buildMoon();
    this.buildAurora();
    this.rainbow = scene.add.graphics().setScrollFactor(0).setDepth(depth + 2.2).setAlpha(0);
    this.balloon = null;
    this.nextShooting = 50000;
    this.nextSatellite = 30000;
    this.draw(true);
  }

  // ---- building ---------------------------------------------------------------

  buildClouds() {
    const s = this.scene;
    this.clouds = [];
    const rand = new Phaser.Math.RandomDataGenerator(['clouds']);
    for (let i = 0; i < 7; i++) {
      const c = s.add.container(rand.between(this.x0, this.x0 + this.spanW), rand.between(40, this.horizonY - 120)).setScrollFactor(0).setDepth(this.depth + 1);
      const parts = [];
      const n = rand.between(3, 6);
      for (let k = 0; k < n; k++) {
        const e = s.add.ellipse(k * 26 - n * 13, rand.between(-8, 8), rand.between(50, 90), rand.between(16, 26), 0xffffff, 1);
        parts.push(e);
        c.add(e);
      }
      // the underside catches the light
      const belly = s.add.ellipse(0, 10, n * 30, 10, 0xffffff, 1);
      parts.push(belly);
      c.add(belly);
      c.parts = parts;
      c.belly = belly;
      c.speed = rand.realInRange(2, 6);
      this.clouds.push(c);
    }
  }

  buildStars() {
    const s = this.scene;
    const rand = new Phaser.Math.RandomDataGenerator(['stars']);
    this.stars = [];
    // the one that shows first, then three, then a dozen, then everyone
    const first = [[520, 118]];
    const three = [[300, 150], [760, 90], [150, 190]];
    const pts = [...first, ...three];
    for (let i = 0; i < 12 - pts.length + 4; i++) pts.push([rand.between(40, 920), rand.between(30, 260)]);
    CONSTELLATIONS.forEach((c) => c.forEach((p) => pts.push(p)));
    for (let i = 0; i < 300; i++) pts.push([rand.between(-300, 1260), rand.between(-150, this.horizonY - 30)]);
    pts.forEach(([x, y], i) => {
      const bright = i < 4 || (i >= 16 && i < 16 + 19) ? 2 : rand.frac() < 0.15 ? 1 : 0;
      const img = s.add.image(x, y, 'ev-dot').setScrollFactor(0.01, 0.02).setDepth(this.depth + 0.5).setAlpha(0);
      img.setScale(bright === 2 ? 1.4 : bright === 1 ? 1 : 0.7);
      img.bright = bright;
      img.tw = rand.realInRange(0, Math.PI * 2);
      img.order = i;
      this.stars.push(img);
    });
    // the Milky Way: a soft diagonal band of faint dust
    const g = s.make.graphics({ x: 0, y: 0 }, false);
    const W = 900;
    const H = 260;
    for (let i = 0; i < 1400; i++) {
      const t = rand.frac();
      const off = (rand.frac() + rand.frac() + rand.frac() - 1.5) * 70;
      const x = t * W;
      const y = H * 0.85 - t * H * 0.7 + off;
      g.fillStyle(0xe8e4f8, rand.realInRange(0.1, 0.6));
      g.fillRect(x, y, 1, 1);
    }
    for (let i = 0; i < 40; i++) {
      const t = i / 40;
      g.fillStyle(0xb8b0e0, 0.035);
      g.fillEllipse(t * W, H * 0.85 - t * H * 0.7, 120, 60);
    }
    if (!s.textures.exists('ev-milky')) g.generateTexture('ev-milky', W, H);
    g.destroy();
    this.milky = s.add.image(this.camW / 2, 150, 'ev-milky').setScrollFactor(0).setDepth(this.depth + 0.45).setAlpha(0).setScale(1.3);
    this.satellites = [];
  }

  buildMoon() {
    const s = this.scene;
    if (!s.textures.exists('ev-moon')) {
      const g = s.make.graphics({ x: 0, y: 0 }, false);
      // a thin crescent; the rest of the disc is earthshine, faintly there
      for (let y = 0; y < 48; y++) {
        for (let x = 0; x < 48; x++) {
          if ((x - 24) ** 2 + (y - 24) ** 2 > 22 * 22) continue;
          const shade = (x - 31) ** 2 + (y - 20) ** 2 <= 21 * 21;
          g.fillStyle(shade ? 0x3a4468 : 0xfff6e0, 1).fillRect(x, y, 1, 1);
        }
      }
      g.generateTexture('ev-moon', 48, 48);
      g.destroy();
    }
    this.moonGlow = s.add.image(0, 0, 'ev-glow').setScrollFactor(0).setDepth(this.depth + 0.6).setScale(5).setTint(0xb8c8f0).setAlpha(0);
    this.moon = s.add.image(0, 0, 'ev-moon').setScrollFactor(0).setDepth(this.depth + 0.7).setAngle(-24).setAlpha(0);
    this.moonUp = 0;
  }

  buildAurora() {
    const s = this.scene;
    if (!s.textures.exists('ev-aurora')) {
      const g = s.make.graphics({ x: 0, y: 0 }, false);
      for (let y = 0; y < 128; y++) {
        const t = y / 127; // 0 top .. 1 bottom
        const a = t < 0.75 ? Math.pow(t / 0.75, 1.6) : 1 - (t - 0.75) / 0.25 * 0.9;
        g.fillStyle(0xffffff, Math.max(0, a) * 0.9);
        g.fillRect(0, y, 8, 1);
      }
      g.generateTexture('ev-aurora', 8, 128);
      g.destroy();
    }
    this.ribbons = [];
    const tints = [0xc07ae8, 0x60f0a0, 0x7af8b0, 0x50e890, 0x60f0a0, 0xf08ab0];
    const rand = new Phaser.Math.RandomDataGenerator(['aurora']);
    for (let r = 0; r < tints.length; r++) {
      const cols = [];
      const N = 46;
      for (let i = 0; i < N; i++) {
        const img = s.add
          .image(this.x0 + (i / N) * this.spanW, 0, 'ev-aurora')
          .setOrigin(0.5, 1)
          .setScrollFactor(0)
          .setDepth(this.depth + 0.8)
          .setTint(tints[r])
          .setBlendMode(Phaser.BlendModes.ADD)
          .setDisplaySize(this.spanW / N + 2, 140)
          .setAlpha(0);
        cols.push(img);
      }
      this.ribbons.push({ cols, base: 150 + r * 18 - (r === 0 ? 30 : 0), phase: rand.realInRange(0, 6), speed: rand.realInRange(0.25, 0.6), amp: rand.realInRange(20, 46), flare: 0 });
    }
    this.aurora = 0;
    this.nextFlare = 25000;
  }

  // ---- per-frame ------------------------------------------------------------------

  setTarget(p) {
    this.target = Phaser.Math.Clamp(p, 0, 10);
  }

  // the sky's current colours: [top, mid, horizon]
  colours() {
    const p = Math.min(10, Math.max(0, this.phase));
    const i = Math.floor(p);
    const f = p - i;
    const a = STAGES[STAGE_AT[i]];
    const b = STAGES[STAGE_AT[Math.min(10, i + 1)]];
    let c = a.map((col, k) => lerpC(col, b[k], f));
    if (this.weather.rain > 0) c = c.map((col, k) => lerpC(col, RAIN[k], this.weather.rain * 0.75));
    if (this.weather.snow > 0) c = c.map((col, k) => lerpC(col, SNOW[k], this.weather.snow * 0.7 * Math.max(0, 1 - p / 6)));
    return c;
  }

  // the colour of the light everything stands in (terrain, people, shadows)
  ambient() {
    const p = this.phase;
    let col = p < 4 ? lerpC(0xfff2dc, 0xf0c8c8, p / 4) : p < 7 ? lerpC(0xf0c8c8, 0x7a84b0, (p - 4) / 3) : lerpC(0x7a84b0, 0x6a78a8, (p - 7) / 3);
    if (this.weather.rain > 0) col = lerpC(col, 0xc8c8d0, this.weather.rain * 0.5);
    if (this.weather.snow > 0 && p < 6) col = lerpC(col, 0xf8e8e8, this.weather.snow * 0.5);
    if (this.aurora > 0.05) col = lerpC(col, this.auroraGround || 0x8af0c0, this.aurora * 0.35);
    return col;
  }

  // the rim-light colour: gold from the sun, blue under the moon
  rim() {
    return this.phase < 6 ? 0xffd890 : lerpC(0xffd890, 0xa8c8ff, (this.phase - 6) / 2);
  }

  draw(force) {
    if (!force && Math.abs(this.phase - this.lastDrawn) < 0.01 && !this.weatherDirty) return;
    this.lastDrawn = this.phase;
    this.weatherDirty = false;
    const [top, mid, hor] = this.colours();
    const ctx = this.canvas.getContext();
    const H = 256;
    // the horizon sits at horizonY in view space; map that into the span
    const hY = Math.round(((this.horizonY - this.y0) / this.spanH) * H);
    for (let y = 0; y < H; y++) {
      let col;
      if (y < hY * 0.55) col = lerpC(top, mid, y / (hY * 0.55));
      else if (y < hY) col = lerpC(mid, hor, (y - hY * 0.55) / (hY * 0.45));
      else col = hor;
      ctx.fillStyle = `#${col.toString(16).padStart(6, '0')}`;
      ctx.fillRect(0, y, 4, 1);
    }
    this.canvas.refresh();
    this.skyCols = [top, mid, hor];
  }

  update(time, delta, { sitting = false } = {}) {
    const dt = delta / 1000;
    this.time += delta;
    // ~20 s behind the walk
    this.phase += (this.target - this.phase) * Math.min(1, dt / 20);
    if (Math.abs(this.target - this.phase) < 0.002) this.phase = this.target;
    this.starPhase = Math.max(this.starPhase, this.phase);
    this.draw(false);
    const cam = this.scene.cameras.main;
    const p = this.phase;
    const sp = this.starPhase;

    // sun: low in the west, sinking as the road goes east
    const sunX = this.camW * 0.16 - cam.scrollX * 0.004;
    const sink = Phaser.Math.Clamp(p / 4, 0, 1);
    const sunY = this.horizonY - 34 + sink * 80;
    this.sun.setPosition(sunX, sunY).setAlpha(1 - Phaser.Math.Clamp((p - 3.2) / 0.8, 0, 1));
    this.sun.setFillStyle(lerpC(0xfff2c8, 0xf87848, sink));
    this.sunGlow.setPosition(sunX, sunY).setTint(lerpC(0xf8d890, 0xe86a58, sink)).setAlpha(0.55 * (1 - Phaser.Math.Clamp((p - 4) / 1.5, 0, 1)) * (1 - this.weather.rain * 0.7));
    this.sunPos = { x: sunX, y: sunY, up: this.sun.alpha };

    // clouds catch the light from underneath: white, gold, pink, grey, gone
    const [, mid, hor] = this.skyCols;
    const cloudA = (1 - Phaser.Math.Clamp((p - 5) / 1.5, 0, 1)) * (0.5 + this.weather.rain * 0.4);
    for (const c of this.clouds) {
      c.x += c.speed * dt * (1 + this.weather.rain * 2);
      if (c.x > this.x0 + this.spanW + 100) c.x = this.x0 - 160;
      const body = this.weather.rain > 0.2 ? lerpC(0xd8d0d8, 0x7a7a88, this.weather.rain) : lerpC(0xfff4e8, mid, Math.min(1, p / 4));
      c.parts.forEach((e) => e.setFillStyle(body, 1));
      c.belly.setFillStyle(lerpC(hor, 0xf8a878, Math.min(1, p / 3)), 1);
      c.setAlpha(cloudA);
    }

    // stars: one, then three, then a dozen, then everyone
    const count = sp < 4 ? 0 : sp < 4.5 ? 1 : sp < 5 ? 4 : sp < 5.8 ? 16 : sp < 6.5 ? 16 + 19 + 60 : this.stars.length;
    const starA = Phaser.Math.Clamp((p - 3.6) / 2, 0, 1) * (1 - this.weather.snow * 0.6);
    const t = this.time / 1000;
    for (const st of this.stars) {
      if (st.order >= count) {
        st.setAlpha(Math.max(0, st.alpha - dt));
        continue;
      }
      const base = st.bright === 2 ? 1 : st.bright === 1 ? 0.75 : 0.45;
      const tw = 0.8 + 0.2 * Math.sin(t * (1.3 + st.bright) + st.tw);
      st.setAlpha(Math.min(st.alpha + dt * 0.5, base * tw * Math.max(starA, st.order === 0 ? Math.min(1, (sp - 4) * 3) : 0)));
    }
    this.milky.setAlpha(Phaser.Math.Clamp((sp - 6.5) / 1.5, 0, 1) * 0.8 * Math.min(1, p / 6));

    // satellites and shooting stars
    if (sp > 6.5) {
      this.nextSatellite -= delta;
      if (this.nextSatellite <= 0) {
        this.nextSatellite = Phaser.Math.Between(30000, 60000);
        const sat = this.scene.add.image(-20, Phaser.Math.Between(40, 200), 'ev-dot').setScrollFactor(0).setDepth(this.depth + 0.55).setAlpha(0.8);
        this.scene.tweens.add({ targets: sat, x: this.camW + 20, y: sat.y + Phaser.Math.Between(-40, 60), duration: 16000, onComplete: () => sat.destroy() });
      }
    }
    if (sp > 5.5) {
      this.nextShooting -= delta;
      if (this.nextShooting <= 0) {
        this.nextShooting = Phaser.Math.Between(40000, 90000);
        this.shootingStar();
      }
    }

    // the crescent moon, rising at screen 19
    this.moonUp = Phaser.Math.Clamp((sp - 7) / 1.2, 0, 1);
    const mx = this.camW * 0.72;
    const my = this.horizonY + 30 - this.moonUp * (this.horizonY - 70);
    this.moon.setPosition(mx, my).setAlpha(this.moonUp > 0 ? Math.min(1, this.moonUp * 3) * Math.min(1, p / 6) : 0);
    this.moonGlow.setPosition(mx, my).setAlpha(this.moon.alpha * 0.35);
    this.moonPos = { x: mx, y: my, up: this.moon.alpha };

    // the aurora (screens 21-22): silent, and never the same twice
    const target = Phaser.Math.Clamp((sp - 8.8) / 1.0, 0, 1) * Math.min(1, p / 8);
    this.aurora += (target - this.aurora) * Math.min(1, dt / 4);
    if (this.aurora > 0.02) {
      this.nextFlare -= delta;
      if (this.nextFlare <= 0) {
        this.nextFlare = Phaser.Math.Between(18000, 40000);
        const rb = this.ribbons[Phaser.Math.Between(0, this.ribbons.length - 1)];
        rb.flare = 1;
      }
    }
    const swell = 0.65 + 0.35 * Math.sin(t / 9) * Math.sin(t / 23 + 1);
    let groundR = 0;
    let groundG = 0;
    let groundB = 0;
    this.ribbons.forEach((rb, r) => {
      rb.flare = Math.max(0, rb.flare - dt / 3);
      const spd = rb.speed * (1 + rb.flare * 4);
      rb.phase += dt * spd;
      const n = rb.cols.length;
      rb.cols.forEach((col, i) => {
        if (this.aurora <= 0.01) {
          col.setAlpha(0);
          return;
        }
        const k = i / n;
        const y = rb.base + Math.sin(rb.phase + k * 7) * rb.amp + Math.sin(t * 0.3 + k * 3 + r) * 18;
        const h = 120 + 50 * Math.sin(rb.phase * 0.7 + k * 5 + r);
        const race = rb.flare > 0 ? Math.max(0, 1 - Math.abs(k - (1 - rb.flare)) * 6) : 0;
        const a = this.aurora * swell * (0.22 + 0.16 * Math.sin(rb.phase * 1.3 + k * 9)) + race * 0.6 * this.aurora;
        col.setPosition(col.x, y + 60).setDisplaySize(col.displayWidth, Math.max(40, h)).setAlpha(Math.max(0, a));
      });
      const c = Phaser.Display.Color.IntegerToColor(rb.cols[0].tintTopLeft);
      groundR += c.r;
      groundG += c.g;
      groundB += c.b;
    });
    const n = this.ribbons.length;
    // the ground under it shifts green and violet
    const wob = Math.sin(t / 7);
    this.auroraGround = lerpC(Phaser.Display.Color.GetColor(groundR / n, groundG / n, groundB / n), wob > 0 ? 0x9a70d8 : 0x60e8a0, Math.abs(wob) * 0.5);

    // the balloon, if today is a balloon day
    if (this.balloon) {
      this.balloon.x += dt * 6;
      this.balloon.y = 150 + Math.sin(t / 5) * 6;
      if (this.balloon.x > this.camW + 80) {
        this.balloon.destroy();
        this.balloon = null;
      }
    }
    void sitting;
  }

  shootingStar() {
    const s = this.scene;
    const x = Phaser.Math.Between(120, 800);
    const y = Phaser.Math.Between(40, 160);
    const streak = s.add.rectangle(x, y, 60, 1.5, 0xffffff, 0.9).setScrollFactor(0).setDepth(this.depth + 0.9).setAngle(18).setOrigin(1, 0.5);
    s.tweens.add({ targets: streak, x: x + 180, y: y + 58, alpha: 0, duration: 700, onComplete: () => streak.destroy() });
    if (this.onShootingStar) this.onShootingStar();
  }

  // §A2 — after rain on the Hill: a doubled rainbow over the sea
  showRainbow(on) {
    const g = this.rainbow;
    if (on) {
      g.clear();
      const cx = this.camW * 0.3;
      const cy = this.horizonY + 40;
      const bands = [0xe86a6a, 0xf2a060, 0xf2d580, 0x7ec87e, 0x7aa8e8, 0xa88ad8];
      bands.forEach((c, i) => {
        g.lineStyle(5, c, 0.5);
        g.beginPath();
        g.arc(cx, cy, 260 - i * 5, Math.PI, 0);
        g.strokePath();
        g.lineStyle(3, bands[bands.length - 1 - i], 0.22);
        g.beginPath();
        g.arc(cx, cy, 320 - i * 4, Math.PI, 0);
        g.strokePath();
      });
      this.scene.tweens.add({ targets: g, alpha: 1, duration: 4000 });
    } else {
      this.scene.tweens.add({ targets: g, alpha: 0, duration: 6000 });
    }
  }

  // §8 rare: a hot-air balloon so slow only a sitting player sees it cross
  launchBalloon() {
    if (this.balloon) return;
    this.balloon = this.scene.add.image(-60, 150, 'ev-balloon').setScrollFactor(0).setDepth(this.depth + 1.2).setAlpha(0.9);
  }

  setWeather(rain, snow) {
    if (Math.abs(rain - this.weather.rain) > 0.01 || Math.abs(snow - this.weather.snow) > 0.01) this.weatherDirty = true;
    this.weather.rain = rain;
    this.weather.snow = snow;
  }
}
