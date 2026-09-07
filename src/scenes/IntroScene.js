import Phaser from 'phaser';
import { createJoTextures } from '../entities/jo.js';
import { drawCityBackdrop } from '../utils/backdrop.js';
import { toggleMusic } from '../systems/audio.js';

// Close-up entry shots: a zoomed street scene, Jo walks to the door, fade in.
const INTROS = {
  chef: {
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
      scene.add.text(596, 260, 'LE  RÊVE', { fontFamily: 'monospace', fontSize: '28px', color: '#f2d580' });
      scene.add.rectangle(700, 395, 70, 160, 0x241a16);
      scene.add.rectangle(700, 395, 58, 148, 0x4a3428);
      scene.add.circle(682, 400, 4, 0xd8b858);
      return { groundY: 470 };
    },
  },
  musician: {
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
      scene.add.text(310, 240, 'TONIGHT\n ONLY\n\n  JO', { fontFamily: 'monospace', fontSize: '22px', color: '#2a1218', align: 'center' }).setAngle(-3);
      // caged stage-door lamp + metal door
      scene.add.rectangle(700, 395, 76, 160, 0x101014);
      scene.add.rectangle(700, 395, 64, 148, 0x2e3440);
      scene.add.circle(700, 290, 12, 0xf2d580);
      scene.add.circle(700, 292, 26, 0xf2c078, 0.15);
      scene.add.text(646, 428, 'STAGE DOOR', { fontFamily: 'monospace', fontSize: '13px', color: '#8a8aa8' });
      return { groundY: 470 };
    },
  },
  astronaut: {
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
      scene.add.text(600, 308, "ADAEZE'S", { fontFamily: 'monospace', fontSize: '26px', color: '#f2d580' }).setOrigin(0.5);
      scene.add.text(600, 334, 'BOXING · POOL · "COME AS YOU ARE."', { fontFamily: 'monospace', fontSize: '11px', color: '#c8c0b0' }).setOrigin(0.5);
      // the recruitment poster on the fence
      scene.add.rectangle(330, 420, 120, 88, 0x2e3a52).setAngle(-2);
      scene.add.text(330, 420, 'MERIDIAN\nORBITAL\nPROGRAM', { fontFamily: 'monospace', fontSize: '11px', color: '#88b8d8', align: 'center' }).setOrigin(0.5).setAngle(-2);
      // door
      scene.add.rectangle(700, 400, 70, 150, 0x241a16);
      scene.add.rectangle(700, 400, 58, 138, 0x3a3428);
      scene.add.rectangle(480, 505, 960, 70, 0x3c3c30);
      return { groundY: 470 };
    },
  },
};

const LEVEL_SCENES = { chef: 'Chef', musician: 'Musician', astronaut: 'Astronaut' };

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
    createJoTextures(this);
    const { groundY } = intro.draw(this);

    this.jo = this.add.image(120, groundY - 24, 'jo-stand');
    this.cameras.main.setZoom(1.5);
    this.cameras.main.centerOn(430, 360);
    this.cameras.main.fadeIn(500);

    this.add
      .text(480, 90, intro.caption, { fontFamily: 'monospace', fontSize: '34px', color: '#f2d580' })
      .setOrigin(0.5)
      .setDepth(10);
    this.add
      .text(480, 125, intro.sub, { fontFamily: 'monospace', fontSize: '15px', color: '#c8c0b0' })
      .setOrigin(0.5)
      .setDepth(10);
    this.add
      .text(480, 520, '[X] skip', { fontFamily: 'monospace', fontSize: '12px', color: '#8a8478' })
      .setOrigin(0.5)
      .setDepth(10);

    this.walkTimer = this.time.addEvent({
      delay: 130,
      loop: true,
      callback: () => this.jo.setTexture(this.jo.texture.key === 'jo-run' ? 'jo-stand' : 'jo-run'),
    });
    this.tweens.add({
      targets: this.jo,
      x: intro.doorX,
      duration: 3200,
      onComplete: () => this.enter(),
    });
    this.tweens.add({ targets: this.cameras.main, zoom: 1.15, duration: 3400, ease: 'sine.out' });

    this.keyX = this.input.keyboard.addKey('X');
    this.input.keyboard.on('keydown-M', () => toggleMusic());
    this.started = false;
  }

  enter() {
    if (this.started) return;
    this.started = true;
    this.walkTimer.remove();
    this.jo.setTexture('jo-stand');
    this.tweens.add({ targets: this.jo, alpha: 0, duration: 350 });
    this.cameras.main.fadeOut(500);
    this.time.delayedCall(550, () =>
      this.scene.start(LEVEL_SCENES[this.levelKey] || 'Musician', { levelKey: this.levelKey })
    );
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.keyX)) this.enter();
  }
}
