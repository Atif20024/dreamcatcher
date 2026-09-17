import Phaser from 'phaser';
import { sfx } from './audio.js';

// THE SECOND DRAFT §3.2 — the typing rhythm. Letters fall like notes down a
// strip over the desk; press the letter as it reaches the line. A miss or a
// wrong key is a typo, and typos come due in Chapter 6.
const FONT = { fontFamily: 'monospace', fontSize: '20px', color: '#e8e4d8' };
const WORDS = 'the page was there and it was the only hour nobody wanted from him morning tin of pens stuck key skimmed milk copies moods tide'.split(' ');

export default class Typing {
  constructor(scene, { count = 16, bpm = 92, cat = false, onDone }) {
    this.scene = scene;
    this.count = count;
    this.beatMs = 60000 / bpm;
    this.fall = 1500;
    this.window = 170;
    this.cat = cat;
    this.onDone = onDone;
    this.spawned = 0;
    this.hits = 0;
    this.typos = 0;
    this.letters = [];
    this.done = false;
    const cam = scene.cameras.main;
    this.ui = scene.add.container(cam.width / 2, 40).setScrollFactor(0).setDepth(170);
    this.bg = scene.add.rectangle(0, 60, 420, 130, 0x14101c, 0.88).setStrokeStyle(2, 0x8a8aa8);
    this.lineY = 105;
    this.line = scene.add.rectangle(0, this.lineY, 380, 2, 0xf2d580);
    this.label = scene.add.text(0, 8, 'type the letters as they reach the line', { fontFamily: 'monospace', fontSize: '11px', color: '#c8c0b0' }).setOrigin(0.5);
    this.count_ = scene.add.text(190, 8, '', { fontFamily: 'monospace', fontSize: '11px', color: '#c8c0b0' }).setOrigin(1, 0.5);
    this.ui.add([this.bg, this.line, this.label, this.count_]);
    this.text = WORDS.join(' ');
    this.ti = Phaser.Math.Between(0, this.text.length - 1);
    this.nextAt = scene.time.now + 600;
    this.handler = (e) => this.key(e);
    scene.input.keyboard.on('keydown', this.handler);
    this.startedAt = scene.time.now;
  }

  nextChar() {
    let ch = ' ';
    while (ch === ' ') {
      ch = this.text[this.ti % this.text.length];
      this.ti += 1;
    }
    return ch;
  }

  key(e) {
    if (this.done) return;
    if (!/^Key[A-Z]$/.test(e.code)) return;
    const ch = e.code[3].toLowerCase();
    const now = this.scene.time.now;
    // the letter nearest the line
    let best = null;
    for (const l of this.letters) {
      if (l.judged) continue;
      const d = Math.abs(now - l.hitAt);
      if (!best || d < best.d) best = { l, d };
    }
    if (best && best.d <= this.window && !best.l.pawed) {
      best.l.judged = true;
      if (best.l.ch === ch) {
        this.hits += 1;
        best.l.t.setColor('#7ec87e');
        sfx('clack');
        this.scene.tweens.add({ targets: best.l.t, scale: 1.4, alpha: 0, duration: 200, onComplete: () => best.l.t.destroy() });
      } else {
        this.typo(best.l);
      }
    } else {
      // a stray key: a typo on the page, softly
      sfx('clack');
      this.typos += 1;
      this.count_.setText(`typos ${this.typos}`);
    }
  }

  typo(l) {
    this.typos += 1;
    l.judged = true;
    l.t.setColor('#e86a6a');
    sfx('click');
    this.scene.tweens.add({ targets: l.t, angle: 20, alpha: 0, y: l.t.y + 20, duration: 320, onComplete: () => l.t.destroy() });
    this.count_.setText(`typos ${this.typos}`);
  }

  update(time) {
    if (this.done) return;
    if (this.spawned < this.count && time >= this.nextAt) {
      this.spawned += 1;
      this.nextAt = time + this.beatMs * (this.spawned % 4 === 0 ? 2 : 1);
      const ch = this.nextChar();
      const x = -150 + Phaser.Math.Between(0, 300);
      const t = this.scene.add.text(x, 22, ch, FONT).setOrigin(0.5);
      this.ui.add(t);
      const l = { ch, t, born: time, hitAt: time + this.fall, judged: false, pawed: false };
      this.letters.push(l);
      // the garden cat: a paw knocks a letter off the line now and then
      if (this.cat && Math.random() < 0.2) {
        this.scene.time.delayedCall(this.fall * 0.5, () => {
          if (l.judged) return;
          l.pawed = true;
          l.judged = true;
          t.setText('~').setColor('#c8c0b0');
          this.scene.tweens.add({ targets: t, x: t.x + 60, angle: 40, alpha: 0, duration: 400, onComplete: () => t.destroy() });
        });
      }
    }
    for (const l of this.letters) {
      if (l.judged) continue;
      const f = (time - l.born) / this.fall;
      l.t.y = 22 + f * (this.lineY - 22);
      if (time > l.hitAt + this.window) this.typo(l);
    }
    this.count_.setText(`${this.spawned}/${this.count}   typos ${this.typos}`);
    if (this.spawned >= this.count && this.letters.every((l) => l.judged)) {
      this.done = true;
      this.scene.time.delayedCall(400, () => {
        this.destroy();
        this.onDone(this.hits, this.typos);
      });
    }
  }

  destroy() {
    this.scene.input.keyboard.off('keydown', this.handler);
    this.ui.destroy();
  }
}
