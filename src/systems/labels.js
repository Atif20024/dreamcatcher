import Phaser from 'phaser';
import { sfx } from './audio.js';

// THE SECOND DRAFT §3.1 — the world is labelled, and labels can be edited.
// A label is a typewriter word over a thing: `adj noun`. The pen strikes the
// adjective and writes one Jo has collected. Bound words are underlined and
// cannot be changed; nouns never can. Each edit costs one ink.
const FONT = { fontFamily: 'monospace', fontSize: '11px', color: '#e8e4d8' };
const NONSENSE = 'qzxjvkwyfbgh';

export default class Labels {
  constructor(scene) {
    this.scene = scene;
    this.list = [];
    this.editing = null;
    this.scrambled = false;
  }

  add({ id, x, y, noun, adj, bound = false, to = null, follow = null }) {
    const s = this.scene;
    const strip = s.add.rectangle(x, y, 10, 16, 0x14101c, 0.72).setDepth(40).setOrigin(0.5);
    const adjText = s.add.text(x, y, adj, { ...FONT, fontStyle: 'italic', color: bound ? '#c8c0b0' : '#f2e0a0' }).setOrigin(0, 0.5).setDepth(41);
    const nounText = s.add.text(x, y, noun, FONT).setOrigin(0, 0.5).setDepth(41);
    const line = s.add.rectangle(x, y + 7, 10, 1, 0xc8c0b0).setOrigin(0, 0.5).setDepth(41).setVisible(bound);
    const label = { id, x, y, noun, adj, orig: adj, bound, to, follow, strip, adjText, nounText, line, changed: false, hidden: false };
    this.layout(label);
    this.list.push(label);
    return label;
  }

  layout(l) {
    const gap = 5;
    const w = l.adjText.width + gap + l.nounText.width;
    l.strip.setSize(w + 10, 16).setPosition(l.x, l.y);
    l.adjText.setPosition(l.x - w / 2, l.y);
    l.nounText.setPosition(l.x - w / 2 + l.adjText.width + gap, l.y);
    l.line.setSize(l.adjText.width, 1).setPosition(l.x - w / 2, l.y + 7);
  }

  get(id) {
    return this.list.find((l) => l.id === id);
  }

  hide(id, on = true) {
    const l = this.get(id);
    if (!l) return;
    l.hidden = on;
    [l.strip, l.adjText, l.nounText, l.line].forEach((o) => o.setVisible(!on && !(o === l.line && !l.bound)));
  }

  // the label that could be edited from here, if any
  nearest(px, py) {
    let best = null;
    for (const l of this.list) {
      if (l.bound || l.hidden) continue;
      let d = Phaser.Math.Distance.Between(px, py, l.x, l.y + 24);
      // a tall thing (the trunk, a machine) carries its word high up
      if (Math.abs(px - l.x) < 36 && py > l.y && py < l.y + 140) d = Math.min(d, 30 + Math.abs(px - l.x));
      if (d < 64 && (!best || d < best.d)) best = { l, d };
    }
    return best ? best.l : null;
  }

  update(time) {
    for (const l of this.list) {
      if (l.follow) {
        l.x = l.follow.x;
        l.y = l.follow.y - (l.follow.displayHeight || 32) / 2 - 16;
        this.layout(l);
      }
      // §3.3 — above the noise threshold the words won't hold still
      const noisy = this.scene.noise !== undefined && this.scene.noise > this.scene.noiseThreshold;
      if (noisy && !l.bound) {
        if (Math.floor(time / 90) % 2 === 0) {
          const n = l.adj.length;
          let s = '';
          for (let i = 0; i < n; i++) s += NONSENSE[Math.floor((time / 90 + i * 7 + l.id.length) % NONSENSE.length)];
          l.adjText.setText(s);
        }
      } else if (l.adjText.text !== l.adj && !l.striking) {
        l.adjText.setText(l.adj);
        this.layout(l);
      }
    }
    this.scrambled = this.scene.noise !== undefined && this.scene.noise > this.scene.noiseThreshold;
  }

  // the pen's micro-UI: pick a word from the satchel, strike, write
  open(label) {
    const s = this.scene;
    if (this.editing) return;
    if (this.scrambled) {
      s.floatText(label.x, label.y - 20, "can't hear himself think.", '#c8c0b0');
      return;
    }
    const words = s.words.filter((w) => w !== label.adj);
    if (!words.length) {
      s.floatText(label.x, label.y - 20, 'no words yet.', '#c8c0b0');
      return;
    }
    if (s.ink <= 0) {
      s.floatText(label.x, label.y - 20, 'the pen is dry.', '#c8c0b0');
      return;
    }
    s.puzzleActive = true;
    s.physics.pause();
    let idx = Math.max(0, words.indexOf(label.to));
    const cam = s.cameras.main;
    const cx = cam.width / 2;
    const cy = 110;
    const objs = [];
    objs.push(s.add.rectangle(cx, cy, 380, 84, 0x14101c, 0.95).setScrollFactor(0).setDepth(300).setStrokeStyle(1, 0xd8b858));
    objs.push(s.add.text(cx, cy - 28, `${label.adj} ${label.noun}`, { fontFamily: 'monospace', fontSize: '15px', color: '#c8c0b0' }).setOrigin(0.5).setScrollFactor(0).setDepth(301));
    const strike = s.add.rectangle(cx - 60, cy - 28, 40, 2, 0xc03a2a).setScrollFactor(0).setDepth(302).setOrigin(0, 0.5);
    objs.push(strike);
    const choice = s.add.text(cx, cy + 4, '', { fontFamily: 'monospace', fontSize: '17px', color: '#f2e0a0', fontStyle: 'italic' }).setOrigin(0.5).setScrollFactor(0).setDepth(301);
    objs.push(choice);
    objs.push(s.add.text(cx, cy + 30, `←/→ choose   [Enter] write (1 ink of ${s.ink})   [Esc] leave it`, { fontFamily: 'monospace', fontSize: '10px', color: '#8a8478' }).setOrigin(0.5).setScrollFactor(0).setDepth(301));
    const render = () => {
      choice.setText(`◂ ${words[idx]} ▸`);
      const adjW = label.adj.length * 9;
      strike.setSize(adjW, 2).setPosition(cx - (label.adj.length + 1 + label.noun.length) * 4.5, cy - 28);
    };
    render();
    const close = () => {
      s.input.keyboard.off('keydown', handler);
      objs.forEach((o) => o.destroy());
      s.puzzleActive = false;
      this.editing = null;
      if (!s.cardActive && !s.dialogActive) s.physics.resume();
    };
    const handler = (e) => {
      if (e.code === 'Escape') return close();
      if (e.code === 'ArrowLeft') {
        idx = (idx + words.length - 1) % words.length;
        sfx('click');
        render();
      } else if (e.code === 'ArrowRight') {
        idx = (idx + 1) % words.length;
        sfx('click');
        render();
      } else if (e.code === 'Enter' || e.code === 'KeyE' || e.code === 'KeyX') {
        const word = words[idx];
        close();
        this.apply(label, word);
      }
    };
    this.editing = label;
    s.input.keyboard.on('keydown', handler);
  }

  apply(label, word, { free = false, revert = false } = {}) {
    const s = this.scene;
    if (!free && !revert) {
      if (!s.spendInk(1)) return false;
    }
    const prev = label.adj;
    // the strike: a red line grows across the old word, then the new one
    // types in
    label.striking = true;
    const line = s.add.rectangle(label.adjText.x, label.adjText.y, 1, 2, revert ? 0x14101c : 0xc03a2a).setOrigin(0, 0.5).setDepth(42);
    sfx(revert ? 'scratch' : 'scratch');
    s.tweens.add({
      targets: line,
      width: label.adjText.width,
      duration: 220,
      onUpdate: () => line.setSize(line.width, 2),
      onComplete: () => {
        line.destroy();
        label.adj = word;
        label.changed = word !== label.orig;
        label.adjText.setText('');
        this.layout(label);
        let i = 0;
        s.time.addEvent({
          delay: 45,
          repeat: word.length - 1,
          callback: () => {
            i += 1;
            label.adjText.setText(word.slice(0, i));
            sfx('clack');
            this.layout(label);
            if (i >= word.length) label.striking = false;
          },
        });
      },
    });
    s.onEdit(label.id, word, prev, { revert });
    return true;
  }

  // the Inner Editor walks past: the word goes back to what it was
  revert(label) {
    if (!label.changed || label.striking) return;
    this.apply(label, label.orig, { revert: true });
  }

  revertBehind(x) {
    for (const l of this.list) if (l.x < x) this.revert(l);
  }
}
