import Phaser from 'phaser';
import { createJoTextures } from '../entities/jo.js';
import { drawCityBackdrop } from '../utils/backdrop.js';
import { toggleMusic, sfx } from '../systems/audio.js';
import { dreamById } from '../data/dreams.js';
import { arrivalTrain } from '../entities/Train.js';
import { stationTex } from '../art/trainArt.js';
import { hubTex } from '../art/hubArt.js';
import { uiText, PLATE } from '../ui/text.js';
import { characterManifest } from '../art/baked.js';

// Close-up entry shots: a zoomed street scene, Jo walks to the door, fade in.
const INTROS = {
  clockmaker: {
    ground: 0x4a4048, // the arrival platform's stone (round 2 WP3)
    caption: 'THE STOPPED HOUR',
    sub: 'A small town at dusk. Every lamp went out at six, and the clock with them.',
    doorX: 700,
    draw(scene) {
      const g = scene.add.graphics();
      g.fillGradientStyle(0x2a2a58, 0x2a2a58, 0xf2a676, 0xd88a78, 1);
      g.fillRect(0, 0, 960, 540);
      // low hills, then a row of houses with every window lit
      scene.add.ellipse(260, 470, 900, 220, 0x4a3a5a);
      scene.add.ellipse(820, 480, 700, 200, 0x3e3250);
      for (let x = 0; x < 960; x += 120) {
        const h = 120 + ((x / 120) % 3) * 22;
        scene.add.rectangle(x + 55, 470 - h / 2, 104, h, 0x3a3048);
        scene.add.triangle(x + 55, 470 - h - 26, -58, 26, 0, -10, 58, 26, 0x4a2e3e);
        for (let wy = 470 - h + 24; wy < 440; wy += 40) scene.add.rectangle(x + 34, wy, 16, 20, 0xffc870, 0.9);
      }
      // the clock tower over the roofs: its face stopped at six
      scene.add.rectangle(560, 250, 90, 440, 0x342a40);
      scene.add.triangle(560, 18, -54, 30, 0, -30, 54, 30, 0x4a2e3e);
      scene.add.circle(560, 110, 30, 0xf2e6cc);
      scene.add.circle(560, 110, 30).setStrokeStyle(3, 0xc8a050);
      scene.add.rectangle(560, 98, 3, 24, 0x2a2028);
      scene.add.rectangle(560, 124, 3, 26, 0x2a2028);
      // the lamp posts along the lane, dark
      for (const lx of [140, 420, 860]) {
        scene.add.rectangle(lx, 410, 5, 120, 0x2a2028);
        scene.add.rectangle(lx, 346, 16, 18, 0x4a4048);
      }
      // the lane, and a green door under a lit fanlight
      scene.add.rectangle(480, 505, 960, 70, 0x4a4048);
      scene.add.rectangle(480, 472, 960, 6, 0x5a5058);
      scene.add.rectangle(700, 400, 70, 150, 0x2a2028);
      scene.add.rectangle(700, 404, 58, 138, 0x2e4a3a);
      scene.add.rectangle(700, 330, 58, 10, 0xffc870, 0.9);
      scene.add.circle(714, 410, 3, 0xc8a050);
      return { groundY: 470 };
    },
  },
  painter: {
    ground: 0x6b4e2e, // the arrival platform's stone (round 2 WP3)
    caption: 'THE YELLOW HOUSE',
    sub: 'The south, at the first hour of light. A house with no curtains.',
    doorX: 700,
    draw(scene) {
      const g = scene.add.graphics();
      g.fillGradientStyle(0x4a5566, 0x4a5566, 0x6b4e2e, 0x6b4e2e, 1);
      g.fillRect(0, 0, 960, 540);
      // underpainting: a square of low houses blocked in umber, one of them yellow
      for (let x = 20; x < 960; x += 150) {
        const yellow = x === 620;
        scene.add.rectangle(x + 65, 360, 130, 220, yellow ? 0xe8b830 : 0x5a4530);
        scene.add.rectangle(x + 65, 240, 140, 24, yellow ? 0xc03a2a : 0x4a5566);
        for (let wy = 300; wy < 440; wy += 60) scene.add.rectangle(x + 40, wy, 22, 30, yellow ? 0x2e6a4a : 0x3a4455);
      }
      scene.add.circle(140, 120, 50, 0xf2d060, 0.95);
      scene.add.rectangle(480, 505, 960, 70, 0x6b4e2e);
      scene.add.rectangle(480, 472, 960, 6, 0x5b3a7a);
      scene.add.rectangle(700, 410, 60, 120, 0x1f3a5f);
      return { groundY: 470 };
    },
  },
  gambler: {
    ground: 0x1a1820, // the arrival platform's stone (round 2 WP3)
    caption: 'THE LAST HAND',
    sub: 'Rain on a parking structure. The sign is bigger than the sky.',
    doorX: 700,
    draw(scene) {
      const g = scene.add.graphics();
      g.fillGradientStyle(0x08060c, 0x08060c, 0x1a0e1e, 0x1a0e1e, 1);
      g.fillRect(0, 0, 960, 540);
      scene.add.rectangle(480, 150, 760, 150, 0x14101c);
      const t = uiText(scene, 480, 130, 'THE MERIDIAN', { decor: true, fontSize: '52px', color: '#ff3aa0' }).setOrigin(0.5);
      uiText(scene, 480, 185, 'OPEN', { decor: true, fontSize: '28px', color: '#ff3aa0' }).setOrigin(0.5);
      uiText(scene, 620, 188, '24 HRS', { decor: true, fontSize: '18px', color: '#3a2030' }).setOrigin(0.5);
      scene.tweens.add({ targets: t, alpha: 0.7, duration: 90, yoyo: true, repeat: -1, repeatDelay: 2200 });
      for (let i = 0; i < 4; i++) scene.add.rectangle(480, 290 + i * 45, 900, 8, 0x2a2430);
      scene.add.rectangle(300, 430, 60, 80, 0x3a2a3a);
      uiText(scene, 300, 400, 'VALET', { decor: true, fontSize: '10px', color: '#c8a0b0' }).setOrigin(0.5);
      scene.add.rectangle(700, 400, 90, 150, 0x2a1a2a);
      scene.add.rectangle(700, 400, 70, 138, 0xf2c078, 0.25);
      scene.add.rectangle(480, 505, 960, 70, 0x1a1820);
      scene.add.rectangle(480, 472, 960, 6, 0x2a2834);
      return { groundY: 470 };
    },
  },
  writer: {
    ground: 0x1c1a24, // the arrival platform's stone (round 2 WP3)
    caption: 'THE SECOND DRAFT',
    sub: 'Five a.m. One attic window lit. The rain has just stopped.',
    doorX: 700,
    draw(scene) {
      const g = scene.add.graphics();
      g.fillGradientStyle(0x0e1020, 0x0e1020, 0x2a2438, 0x2a2438, 1);
      g.fillRect(0, 0, 960, 540);
      // a row of tall thin houses, one window lit
      const rand = new Phaser.Math.RandomDataGenerator(['attic']);
      for (let x = 40; x < 960; x += 96) {
        const h = rand.between(220, 320);
        scene.add.rectangle(x + 40, 470 - h / 2, 80, h, x === 616 ? 0x2c2430 : 0x201a26);
        scene.add.rectangle(x + 40, 470 - h - 10, 84, 20, 0x181420);
        for (let wy = 470 - h + 30; wy < 440; wy += 46) {
          scene.add.rectangle(x + 40, wy, 22, 26, 0x14121c);
        }
      }
      const lit = scene.add.rectangle(656, 190, 22, 26, 0xf2c078);
      scene.tweens.add({ targets: lit, alpha: 0.75, duration: 1600, yoyo: true, repeat: -1 });
      scene.add.rectangle(480, 505, 960, 70, 0x1c1a24);
      scene.add.rectangle(480, 472, 960, 6, 0x2a2834);
      // the fire escape
      for (let y = 210; y < 470; y += 26) scene.add.rectangle(700, y, 40, 3, 0x3a3a44);
      scene.add.rectangle(682, 340, 3, 260, 0x3a3a44);
      scene.add.rectangle(718, 340, 3, 260, 0x3a3a44);
      return { groundY: 470 };
    },
  },
  chef: {
    ground: 0x2c2c38, // the arrival platform's stone (round 2 WP3)
    caption: 'FIVE-STAR DREAM',
    sub: 'The kitchen of Le Rêve. Tonight, the critics are in.',
    doorX: 700,
    draw(scene) {
      drawCityBackdrop(scene, 960, 540);
      // sidewalk + bistro facade close-up
      scene.add.rectangle(480, 505, 960, 70, 0x2c2c38);
      scene.add.rectangle(480, 472, 960, 6, 0x3c3c4a);
      scene.add.rectangle(660, 330, 420, 290, 0x3a2c28);
      for (let i = 0; i < 7; i++) {
        scene.add.rectangle(480 + i * 60, 210, 52, 40, i % 2 ? 0x8a2c2c : 0xe8e0d0);
      }
      scene.add.rectangle(660, 232, 420, 8, 0x241a16);
      const win = scene.add.rectangle(560, 340, 130, 110, 0xf2c078, 0.85);
      scene.tweens.add({ targets: win, alpha: 0.6, duration: 1200, yoyo: true, repeat: -1 });
      uiText(scene, 596, 260, 'LE  RÊVE', { decor: true, fontSize: '28px', color: '#f2d580' });
      scene.add.rectangle(700, 395, 70, 160, 0x241a16);
      scene.add.rectangle(700, 395, 58, 148, 0x4a3428);
      scene.add.circle(682, 400, 4, 0xd8b858);
      return { groundY: 470 };
    },
  },
  musician: {
    ground: 0x201014, // the arrival platform's stone (round 2 WP3)
    caption: 'THE BIG STAGE',
    sub: 'The half door. Every jazz great walked through it once.',
    doorX: 700,
    draw(scene) {
      const g = scene.add.graphics();
      g.fillGradientStyle(0x14090c, 0x14090c, 0x2a1218, 0x2a1218, 1);
      g.fillRect(0, 0, 960, 540);
      // brick alley wall
      const bricks = scene.add.graphics();
      bricks.lineStyle(2, 0x1e0e12, 1);
      for (let y = 60; y < 470; y += 26) {
        bricks.lineBetween(0, y, 960, y);
        for (let x = (y / 26) % 2 ? 0 : 30; x < 960; x += 60) bricks.lineBetween(x, y, x, y + 26);
      }
      scene.add.rectangle(480, 300, 960, 480, 0x3a1a20, 0.35);
      scene.add.rectangle(480, 505, 960, 70, 0x201014);
      // poster
      scene.add.rectangle(360, 310, 150, 200, 0xe8dcc8).setAngle(-3);
      uiText(scene, 310, 240, 'TONIGHT\n ONLY\n\n  JO', { decor: true, fontSize: '22px', color: '#2a1218', align: 'center' }).setAngle(-3);
      // caged stage-door lamp + metal door
      scene.add.rectangle(700, 395, 76, 160, 0x101014);
      scene.add.rectangle(700, 395, 64, 148, 0x2e3440);
      scene.add.circle(700, 290, 12, 0xf2d580);
      scene.add.circle(700, 292, 26, 0xf2c078, 0.15);
      uiText(scene, 646, 428, 'STAGE DOOR', { decor: true, fontSize: '13px', color: '#8a8aa8' });
      return { groundY: 470 };
    },
  },
  astronaut: {
    ground: 0x3c3c30, // the arrival platform's stone (round 2 WP3)
    caption: 'THE QUIET ABOVE',
    sub: "A municipal gym at dawn. Selection is in nine weeks.",
    doorX: 700,
    draw(scene) {
      const g = scene.add.graphics();
      g.fillGradientStyle(0x3a3560, 0x3a3560, 0xe0a074, 0x8a5a52, 1);
      g.fillRect(0, 0, 960, 540);
      // the low sun
      scene.add.circle(180, 400, 46, 0xf2c078, 0.9);
      scene.add.circle(180, 400, 90, 0xf2c078, 0.2);
      // the sports centre: brick box, high windows, one lit
      scene.add.rectangle(620, 340, 560, 280, 0x4a4a3c);
      scene.add.rectangle(620, 208, 576, 16, 0x34342a);
      for (let i = 0; i < 5; i++) {
        scene.add.rectangle(430 + i * 95, 260, 60, 40, i === 3 ? 0xf2d580 : 0x2a2a24, i === 3 ? 0.9 : 1);
      }
      // the hand-painted sign
      scene.add.rectangle(600, 320, 330, 54, 0x3a3428);
      uiText(scene, 600, 308, "ADAEZE'S", { decor: true, fontSize: '26px', color: '#f2d580' }).setOrigin(0.5);
      uiText(scene, 600, 334, 'BOXING · POOL · "COME AS YOU ARE."', { decor: true, fontSize: '11px', color: '#c8c0b0' }).setOrigin(0.5);
      // the recruitment poster on the fence
      scene.add.rectangle(330, 420, 120, 88, 0x2e3a52).setAngle(-2);
      uiText(scene, 330, 420, 'MERIDIAN\nORBITAL\nPROGRAM', { decor: true, fontSize: '11px', color: '#88b8d8', align: 'center' }).setOrigin(0.5).setAngle(-2);
      // door
      scene.add.rectangle(700, 400, 70, 150, 0x241a16);
      scene.add.rectangle(700, 400, 58, 138, 0x3a3428);
      scene.add.rectangle(480, 505, 960, 70, 0x3c3c30);
      return { groundY: 470 };
    },
  },
};

const LEVEL_SCENES = { clockmaker: 'Dream', chef: 'Chef', musician: 'Musician', astronaut: 'Astronaut', writer: 'Writer', painter: 'Painter', gambler: 'Gambler' };

export default class IntroScene extends Phaser.Scene {
  constructor() {
    super('Intro');
  }

  init(data) {
    this.levelKey = data.levelKey;
  }

  create() {
    const intro = INTROS[this.levelKey];
    if (!intro) {
      this.scene.start('Level', { levelKey: this.levelKey });
      return;
    }
    const { groundY } = intro.draw(this);
    this.groundY = groundY;

    // ---- the arrival (round 2 WP3, critique §7.3): the dream opens on a
    // platform with a full-scale train standing at it (1 m = 44 px, the same
    // scale as Jo). Jo steps down from its door, it pulls away, the platform
    // lamp comes on, and the street behind it is there.
    const dream = dreamById(this.levelKey);
    const livery = (dream && dream.livery) || { body: 0x7a3a3a, trim: 0xf2e6cc, window: 0xf2c078, emblem: 'stripe' };
    const startX = 200;
    // a low platform (0.55 m): the bogies and the tops of the wheels show
    // over its edge, and the coach floor is two steps up
    const railY = groundY + 24;
    this.train = arrivalTrain(this, startX, railY, livery, { depth: 1 });
    this.platform(intro.ground || 0x2c2c38, groundY);
    this.lamp = this.add.image(330, groundY, stationTex(this, 'hub-platform-lamp', { num: dream ? dream.platform : '', on: false })).setOrigin(0.5, 1).setDepth(3);
    this.lampGlow = this.add.image(330, groundY - 146, hubTex(this, 'glow', 64, 64)).setDisplaySize(150, 150).setTint(0xf2d580).setAlpha(0).setDepth(3).setBlendMode(Phaser.BlendModes.ADD);

    // Jo from the atlas (pivot = his feet), the walk stepped by ground covered
    const atlas = this.textures.exists('jo');
    if (!atlas) createJoTextures(this);
    this.jo = atlas ? this.add.image(startX, this.train.sillY, 'jo', 'jo/street/side/idle/00') : this.add.image(startX, this.train.sillY - 24, 'jo-stand');
    this.joHat = atlas && this.textures.get('jo').has('jo/street/side/idle/00/hat') ? this.add.image(startX, this.train.sillY, 'jo', 'jo/street/side/idle/00/hat') : null;
    this.jo.setDepth(5).setAlpha(0);
    if (this.joHat) this.joHat.setDepth(6).setAlpha(0);
    this.cameras.main.setZoom(1.3);
    this.cameras.main.centerOn(400, 360);
    this.cameras.main.fadeIn(500);

    // the caption is screen text (UIScene, zoom 1): the street shot is zoomed
    // §8: captions on painted art sit on a scrim; the skip hint on the plate
    uiText(this, 480, 60, intro.caption, { size: 'display', scale: 2, color: '#f2d580' })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(150)
      .setScrim(0x0e0b14);
    uiText(this, 480, 100, intro.sub, { size: 'body', color: '#c8c0b0', align: 'center', wrap: 860 })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(150)
      .setScrim(0x0e0b14);
    uiText(this, 944, 524, '[E] skip', { size: 'small', color: 'ink-dim', bg: PLATE.dark })
      .setOrigin(1, 1)
      .setScrollFactor(0)
      .setDepth(150);

    // Jo appears in the lit door, steps down two steps, and the train goes
    this.time.delayedCall(450, () => this.tweens.add({ targets: [this.jo, this.joHat].filter(Boolean), alpha: 1, duration: 250 }));
    this.time.delayedCall(800, () => this.stepDown(atlas, startX));
    this.time.delayedCall(1450, () =>
      this.train.depart(() => this.walkToDoor(atlas, startX, intro.doorX), 2500)
    );
    // the platform lamp comes on as the last coach clears it
    this.time.delayedCall(3700, () => {
      this.lamp.setTexture(stationTex(this, 'hub-platform-lamp', { num: dream ? dream.platform : '', on: true }));
      this.tweens.add({ targets: this.lampGlow, alpha: 0.45, duration: 300 });
      sfx('click');
    });

    this.keyX = this.input.keyboard.addKey('X');
    this.keyE = this.input.keyboard.addKey('E');
    this.input.keyboard.on('keydown-M', () => toggleMusic());
    this.started = false;
  }

  // the platform: the dream's own stone, a pale coping at the far edge where
  // the train stands, the yellow line, and the platform's face in front of
  // the wheels (drawn over the train, so only the bogie tops show)
  platform(ground, groundY) {
    const face = this.add.graphics().setDepth(2);
    face.fillStyle(ground, 1).fillRect(-200, groundY, 1360, 540 - groundY + 100);
    face.fillStyle(0xd8d0c0, 1).fillRect(-200, groundY, 1360, 3);
    face.fillStyle(0x000000, 0.25).fillRect(-200, groundY + 3, 1360, 2);
    face.fillStyle(0xe8c040, 0.9).fillRect(-200, groundY + 8, 1360, 2);
    // flagstone joints
    face.fillStyle(0x000000, 0.18);
    for (let x = -200; x < 1160; x += 62) face.fillRect(x, groundY + 12, 1, 540 - groundY);
  }

  // Jo steps down from the coach floor (two steps, 0.6 m) onto the platform
  stepDown(atlas, x) {
    const parts = [this.jo, this.joHat].filter(Boolean);
    const sill = this.train.sillY;
    const frame = (f) => {
      if (!atlas) return;
      this.jo.setFrame(`jo/street/side/${f}`);
      if (this.joHat && this.textures.get('jo').has(`jo/street/side/${f}/hat`)) this.joHat.setFrame(`jo/street/side/${f}/hat`);
    };
    const mid = sill + (this.groundY - sill) / 2;
    frame('walk/02');
    this.tweens.add({
      targets: parts,
      y: mid,
      x: x + 4,
      duration: 200,
      ease: 'sine.in',
      onComplete: () => {
        frame('walk/06');
        this.tweens.add({ targets: parts, y: this.groundY, x: x + 9, duration: 200, ease: 'sine.in', onComplete: () => frame('idle/00') });
      },
    });
  }

  // the train has gone: the street is there, and the dream's door
  walkToDoor(atlas, x0, doorX) {
    if (this.started) return;
    const parts = [this.jo, this.joHat].filter(Boolean);
    const from = this.jo.x;
    // one frame per step of Jo's walk (manifest step × scale: 8 px), so the
    // planted foot stays planted (phase 2 motion, as Train.walkIn does)
    const jm = characterManifest('jo');
    const stepPx = jm ? jm.animations.walk.step * (jm.scale || 2) : 8;
    this.walkTimer = this.time.addEvent({
      delay: 30,
      loop: true,
      callback: () => {
        const f = `walk/${String(Math.floor((this.jo.x - from) / stepPx) % 8).padStart(2, '0')}`;
        if (!atlas) return this.jo.setTexture(this.jo.texture.key === 'jo-run' ? 'jo-stand' : 'jo-run');
        this.jo.setFrame(`jo/street/side/${f}`);
        if (this.joHat) this.joHat.setFrame(`jo/street/side/${f}/hat`);
      },
    });
    this.tweens.add({ targets: parts, x: doorX, duration: ((doorX - from) / 500) * 2600, onComplete: () => this.enter() });
    this.tweens.add({ targets: this.cameras.main, scrollX: this.cameras.main.scrollX + 90, zoom: 1.3, duration: 2600, ease: 'sine.inout' });
  }

  enter() {
    if (this.started) return;
    this.started = true;
    if (this.walkTimer) this.walkTimer.remove();
    if (this.textures.exists('jo')) this.jo.setFrame('jo/street/side/idle/00');
    else this.jo.setTexture('jo-stand');
    this.tweens.add({ targets: [this.jo, this.joHat].filter(Boolean), alpha: 0, duration: 350 });
    this.cameras.main.fadeOut(500);
    this.time.delayedCall(550, () =>
      this.scene.start(LEVEL_SCENES[this.levelKey] || 'Musician', { levelKey: this.levelKey })
    );
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.keyX) || Phaser.Input.Keyboard.JustDown(this.keyE)) this.enter();
  }
}
