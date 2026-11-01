import Phaser from 'phaser';
import { sfx } from './audio.js';
import { uiText } from '../ui/text.js';
import { garble, keyOf, keyVerdict, tailText } from '../data/writer/economy.js';

// THE SECOND DRAFT §3.2 — the typing rhythm. The book's words fall like notes
// down a strip over the desk; press each word's first letter as it reaches the
// line and the word goes on the page at the foot of the box. A miss prints with
// its letters swapped: a typo, and typos come due in Chapter 6.
const FONT = { fontSize: '20px', color: '#e8e4d8' };
const REST = { fontSize: '11px', color: '#9a93b0' };

export default class Typing {
  constructor(scene, { words, bpm = 92, cat = false, onDone }) {
    this.scene = scene;
    this.words = words;
    this.count = words.length;
    this.printed = [];
    this.beatMs = 60000 / bpm;
    this.fall = 1500;
    this.window = 170;
    this.cat = cat;
    this.onDone = onDone;
    this.spawned = 0;
    this.hits = 0;
    this.typos = 0;
    this.pawed = 0; // the cat's: not Jo's fault, not on his score
    this.letters = [];
    this.done = false;
    const cam = scene.cameras.main;
    this.ui = scene.add.container(cam.width / 2, 40).setScrollFactor(0).setDepth(170);
    this.bg = scene.add.rectangle(0, 82, 420, 174, 0x14101c, 0.88).setStrokeStyle(2, 0x8a8aa8);
    this.lineY = 105;
    this.line = scene.add.rectangle(0, this.lineY, 380, 2, 0xf2d580);
    this.label = uiText(scene, 0, 8, 'each word: its first letter, on the line', { fontSize: '11px', color: '#c8c0b0' }).setOrigin(0.5);
    this.count_ = uiText(scene, 190, 8, '', { fontSize: '11px', color: '#c8c0b0' }).setOrigin(1, 0.5);
    this.page = uiText(scene, -198, 118, '', { fontSize: '11px', color: '#e8dcc8', wordWrap: { width: 396 } }).setOrigin(0, 0);
    this.ui.add([this.bg, this.line, this.label, this.count_, this.page]);
    this.nextAt = scene.time.now + 600;
    this.handler = (e) => this.key(e);
    scene.input.keyboard.on('keydown', this.handler);
    this.startedAt = scene.time.now;
  }

  // the word goes on the page, as it was typed
  print(l, word) {
    this.printed[l.i] = word;
    this.page.setText(tailText(this.printed.filter(Boolean).join(' ')));
    if (l.rest) l.rest.destroy();
    l.rest = null;
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
    const verdict = best ? keyVerdict(best.d, this.window) : 'ignore';
    if (verdict === 'judge' && !best.l.pawed) {
      best.l.judged = true;
      if (best.l.ch === ch) {
        this.hits += 1;
        this.print(best.l, best.l.word);
        best.l.t.setColor('#7ec87e');
        sfx('clack');
        this.scene.tweens.add({ targets: best.l.t, scale: 1.4, alpha: 0, duration: 200, onComplete: () => best.l.t.destroy() });
      } else {
        this.typo(best.l);
      }
    } else if (verdict === 'typo') {
      // just off the beat: a typo on the page, softly
      sfx('clack');
      this.typos += 1;
      this.count_.setText(`typos ${this.typos}`);
    }
  }

  typo(l) {
    this.typos += 1;
    l.judged = true;
    this.print(l, garble(l.word));
    l.t.setColor('#e86a6a');
    sfx('click');
    this.scene.tweens.add({ targets: l.t, angle: 20, alpha: 0, y: l.t.y + 20, duration: 320, onComplete: () => l.t.destroy() });
    this.count_.setText(`typos ${this.typos}`);
  }

  update(time) {
    if (this.done) return;
    if (this.spawned < this.count && time >= this.nextAt) {
      const i = this.spawned;
      this.spawned += 1;
      this.nextAt = time + this.beatMs * (this.spawned % 4 === 0 ? 2 : 1);
      const word = this.words[i];
      const ch = keyOf(word);
      const t = uiText(this.scene, 0, 22, ch, FONT).setOrigin(0.5);
      // the rest of the word trails the letter, so he reads the book he types
      const after = word.slice(word.toLowerCase().indexOf(ch) + 1);
      const rest = after ? uiText(this.scene, 0, 22, after, REST).setOrigin(0, 0.5) : null;
      const x = -180 + Phaser.Math.Between(0, Math.max(0, 340 - (rest ? rest.width : 0)));
      t.x = x;
      if (rest) rest.x = x + t.width / 2 + 1;
      this.ui.add(rest ? [t, rest] : t);
      const l = { ch, word, i, t, rest, born: time, hitAt: time + this.fall, judged: false, pawed: false };
      this.letters.push(l);
      // the garden cat: a paw knocks a letter off the line now and then
      if (this.cat && Math.random() < 0.2) {
        this.scene.time.delayedCall(this.fall * 0.5, () => {
          if (l.judged) return;
          l.pawed = true;
          l.judged = true;
          this.pawed += 1;
          this.print(l, l.word);
          t.setText('~').setColor('#c8c0b0');
          this.scene.tweens.add({ targets: t, x: t.x + 60, angle: 40, alpha: 0, duration: 400, onComplete: () => t.destroy() });
        });
      }
    }
    for (const l of this.letters) {
      if (l.judged) continue;
      const f = (time - l.born) / this.fall;
      l.t.y = 22 + f * (this.lineY - 22);
      if (l.rest) l.rest.y = l.t.y;
      if (time > l.hitAt + this.window) this.typo(l);
    }
    this.count_.setText(`${this.spawned}/${this.count}   typos ${this.typos}`);
    if (this.spawned >= this.count && this.letters.every((l) => l.judged)) {
      this.done = true;
      this.scene.time.delayedCall(400, () => {
        this.destroy();
        this.onDone(this.hits, this.typos, this.count - this.pawed);
      });
    }
  }

  destroy() {
    this.scene.input.keyboard.off('keydown', this.handler);
    this.ui.destroy();
  }
}
