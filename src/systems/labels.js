import Phaser from 'phaser';
import { sfx } from './audio.js';
import ModalManager from '../ui/ModalManager.js';
import { uiText } from '../ui/text.js';
import { panel } from '../ui/Panel.js';

// THE SECOND DRAFT §3.1 — the world is labelled, and labels can be edited.
// A label is a typewriter word over a thing: `adj noun`. The pen strikes the
// adjective and writes one Jo has collected. Bound words are underlined and
// cannot be changed; nouns never can. Each edit costs one ink.
// body ×1 on the label's own ink strip (§8: the strip is its plate)
const FONT = { size: 'body', scale: 1, color: '#e8e4d8', backing: 0x14101c };
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
    const strip = s.add.rectangle(x, y, 10, 18, 0x14101c, 0.88).setStrokeStyle(1, 0xc8a24a, 0.8).setDepth(40).setOrigin(0.5);
    const adjText = uiText(s, x, y, adj, { ...FONT, color: bound ? '#c8c0b0' : '#f2e0a0' }).setOrigin(0, 0.5).setDepth(41);
    const nounText = uiText(s, x, y, noun, FONT).setOrigin(0, 0.5).setDepth(41);
    const line = s.add.rectangle(x, y + 7, 10, 1, 0xc8c0b0).setOrigin(0, 0.5).setDepth(41).setVisible(bound);
    const label = { id, x, y, noun, adj, orig: adj, bound, to, follow, strip, adjText, nounText, line, changed: false, hidden: false };
    this.layout(label);
    // §8: two labels never print over each other; a later one steps up
    const box = (l) => l.strip.getBounds();
    for (let k = 0; k < 4 && !follow; k++) {
      const hit = this.list.find((o) => !o.follow && Phaser.Geom.Intersects.RectangleToRectangle(box(o), box(label)));
      if (!hit) break;
      label.y = hit.y - 22;
      this.layout(label);
    }
    this.list.push(label);
    return label;
  }

  layout(l) {
    const gap = 5;
    const w = l.adjText.width + gap + l.nounText.width;
    l.strip.setSize(w + 12, 18).setPosition(l.x, l.y);
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
    const handle = ModalManager.for(s).open({ kind: 'encounter', name: 'pen', freeze: 'physics', onKey: (e) => handler(e) });
    let idx = Math.max(0, words.indexOf(label.to));
    const cam = s.cameras.main;
    const cx = cam.width / 2;
    const cy = 110;
    const objs = [];
    const add = (o) => (objs.push(o), handle.add(o));
    add(panel(s, cx, cy, 640, 110, { depth: 300, accent: 0xd8b858 }));
    const adjT = add(uiText(s, cx, cy - 32, `${label.adj} `, { size: 'body', color: '#c8c0b0' }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(301));
    const nounT = add(uiText(s, cx, cy - 32, label.noun, { size: 'body', color: '#c8c0b0' }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(301));
    const lw = adjT.width + nounT.width;
    adjT.setX(Math.round(cx - lw / 2));
    nounT.setX(Math.round(cx - lw / 2 + adjT.width));
    const strike = add(s.add.rectangle(adjT.x, cy - 32, Math.max(4, adjT.width - 8), 2, 0xc03a2a).setScrollFactor(0).setDepth(302).setOrigin(0, 0.5));
    const choice = add(uiText(s, cx, cy + 2, '', { size: 'body', color: '#f2e0a0' }).setOrigin(0.5).setScrollFactor(0).setDepth(301));
    add(uiText(s, cx, cy + 34, `←/→ choose   [Enter] write (1 ink of ${s.ink})   [Esc] leave it`, { size: 'small', color: 'ink-dim' }).setOrigin(0.5).setScrollFactor(0).setDepth(301));
    const render = () => {
      choice.setText(`◂ ${words[idx]} ▸`);
      strike.setPosition(adjT.x, cy - 32);
    };
    render();
    const close = () => {
      handle.close();
      s.puzzleActive = !!s.modals.has('encounter');
      this.editing = null;
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
