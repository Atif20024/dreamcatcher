// SceneBox (plan 2.6, critique F5.5): real conversations. Opened only by
// [E] on a speaker or by a beat — never by walking near someone. A bottom
// panel with letterbox bars, the speaker's portrait (expression per node),
// a name tag, typewriter text (40 cps, punctuation pauses, a soft tick at
// the speaker's pitch) and choices with a → cursor. Driven by the
// DialogueRunner; read through the InputMap so a gamepad works.
//
//   const r = await box.run(conv, { flags, onSet, onEffect })   → { chosen, trail }
import ModalManager from '../ui/ModalManager.js';
import { uiText, CONVERSATION_SCALE } from '../ui/text.js';
import { drawPanel } from '../ui/Panel.js';
import { resolveArt } from '../art/baked.js';
import { DialogueRunner } from './DialogueRunner.js';
import { playTone } from '../systems/audio.js';
import { events } from '../core/events.js';

const DEPTH = 200;
const CPS = 40;
const PAUSE = { ',': 80, '.': 220, '?': 220, '!': 220, '…': 500 };

export class SceneBox {
  constructor(scene, { cast = {}, input } = {}) {
    this.scene = scene;
    this.cast = cast;
    this.input = input;
    this.active = false;
    this.opened = 0;
  }

  run(conv, { flags = () => ({}), onSet = null, onEffect = null } = {}) {
    if (this.active) return Promise.resolve(null);
    const s = this.scene;
    this.runner = new DialogueRunner(conv, { flags, onSet, onEffect });
    this.conv = conv;
    this.active = true;
    this.opened += 1;
    s.dialogActive = true;
    events.emit('conv:start', { id: conv.id });
    return new Promise((resolve) => {
      this.resolve = resolve;
      this.handle = ModalManager.for(s).open({ kind: 'dialogue', name: `conv:${conv.id}`, freeze: 'physics' });
      const cam = s.cameras.main;
      const add = (o) => this.handle.add(o);
      this.W = cam.width;
      this.H = cam.height;
      this.bars = [add(s.add.rectangle(cam.width / 2, 18, cam.width, 36, 0x000000).setScrollFactor(0).setDepth(DEPTH)), add(s.add.rectangle(cam.width / 2, cam.height - 6, cam.width, 12, 0x000000).setScrollFactor(0).setDepth(DEPTH))];
      this.box = add(s.add.graphics().setScrollFactor(0).setDepth(DEPTH));
      this.portrait = add(s.add.image(0, 0, '__WHITE').setScrollFactor(0).setDepth(DEPTH + 1).setVisible(false));
      this.nameText = add(uiText(s, 0, 0, '', { size: 'small', color: 'accent' }).setScrollFactor(0).setDepth(DEPTH + 1));
      this.bodyText = add(uiText(s, 0, 0, '', { size: 'body', scale: CONVERSATION_SCALE, color: 'ink', wrap: 640, lineSpacing: 4 }).setScrollFactor(0).setDepth(DEPTH + 1));
      this.more = add(uiText(s, 0, 0, '▼', { size: 'small', color: 'ink-dim' }).setScrollFactor(0).setDepth(DEPTH + 1));
      this.choiceTexts = [];
      this.t = 0;
      this.show();
    });
  }

  speaker(who) {
    return this.cast[who] || { name: String(who || '').toUpperCase() };
  }

  show() {
    const n = this.runner.node;
    if (!n) return this.close();
    const sp = this.speaker(n.who);
    this.full = n.text || '';
    this.shown = 0;
    this.wait = 0;
    this.choosing = false;
    this.choiceIdx = 0;
    this.choiceTexts.forEach((t) => t.destroy());
    this.choiceTexts = [];
    // layout grows to the text (and its choices)
    this.bodyText.setText(this.full);
    const th = this.bodyText.height;
    this.bodyText.setText('');
    const nCh = this.runner.choices().length;
    const boxW = 880;
    const boxH = Math.max(132, 44 + th + (nCh ? nCh * 20 + 12 : 0) + 22);
    const x0 = Math.round((this.W - boxW) / 2);
    const y0 = this.H - 18 - boxH;
    this.box.clear();
    drawPanel(this.box, x0, y0, boxW, boxH, { accent: 0xe9b84a });
    this.layout = { x0, y0, boxW, boxH, tx: x0 + 132 };
    const ref = sp.portrait ? (n.expr ? `${sp.portrait}-${n.expr}` : sp.portrait) : null;
    const art = (ref && resolveArt(this.scene, ref)) || (sp.portrait && resolveArt(this.scene, sp.portrait));
    if (art) {
      this.portrait.setTexture(art[0], art[1]).setVisible(true).setOrigin(0.5);
      this.portrait.setScale(Math.min(1, 104 / Math.max(this.portrait.frame.realWidth, this.portrait.frame.realHeight)));
      this.portrait.setPosition(x0 + 66, y0 + Math.min(boxH, 132) / 2);
      // the listener's face is turned away: speakers face the text
      this.portrait.setFlipX(false);
    } else this.portrait.setVisible(false);
    this.nameText.setText(sp.name || '').setPosition(this.layout.tx, y0 + 14);
    this.bodyText.setPosition(this.layout.tx, y0 + 36);
    this.more.setPosition(x0 + boxW - 28, y0 + boxH - 24).setVisible(false);
    this.pitch = sp.voicePitch || 1;
    if (this.onSpeaker) this.onSpeaker(n.who, n);
  }

  renderChoices() {
    const ch = this.runner.choices();
    this.choiceTexts.forEach((t) => t.destroy());
    const top = this.bodyText.y + this.bodyText.height + 12;
    this.choiceTexts = ch.map((c, i) =>
      this.handle.add(
        uiText(this.scene, this.layout.tx, top + i * 20, `${i === this.choiceIdx ? '→ ' : '  '}${c.text}`, { size: 'small', color: i === this.choiceIdx ? 'accent' : 'ink-dim' })
          .setScrollFactor(0)
          .setDepth(DEPTH + 2)
      )
    );
  }

  tick() {
    if (this.shown % 2 === 0) {
      try {
        playTone(520 * this.pitch * (0.95 + Math.random() * 0.1), 0.025, 'triangle', 0.03);
      } catch {
        /* no audio */
      }
    }
  }

  update(dt) {
    if (!this.active) return;
    this.t += dt;
    const I = this.input;
    const go = this.t > 250 && I && I.justDown('confirm');
    if (this.shown < this.full.length) {
      if (go) {
        this.shown = this.full.length;
        this.bodyText.setText(this.full);
      } else {
        this.wait -= dt;
        while (this.wait <= 0 && this.shown < this.full.length) {
          const ch = this.full[this.shown];
          this.shown += 1;
          this.wait += 1000 / CPS + (PAUSE[ch] || 0);
          this.tick();
        }
        this.bodyText.setText(this.full.slice(0, this.shown));
      }
      if (this.shown >= this.full.length && this.runner.choices().length) {
        this.choosing = true;
        this.renderChoices();
      }
      return;
    }
    this.more.setVisible(!this.choosing && Math.floor(this.t / 250) % 2 === 0);
    if (this.choosing) {
      const n = this.runner.choices().length;
      if (I.justDown('up') || I.justDown('left')) {
        this.choiceIdx = (this.choiceIdx + n - 1) % n;
        this.renderChoices();
      } else if (I.justDown('down') || I.justDown('right')) {
        this.choiceIdx = (this.choiceIdx + 1) % n;
        this.renderChoices();
      } else if (go) {
        this.runner.next(this.choiceIdx);
        this.show();
      }
      return;
    }
    if (go) {
      this.runner.next();
      this.show();
    }
  }

  close() {
    const s = this.scene;
    const h = this.handle;
    this.handle = null;
    this.active = false;
    s.dialogActive = false;
    if (h) h.close();
    events.emit('conv:end', { id: this.conv.id });
    const r = { chosen: this.runner.chosen, trail: this.runner.trail };
    if (this.resolve) this.resolve(r);
  }

  state() {
    return { active: this.active, opened: this.opened, node: this.active && this.runner.node ? this.runner.node.id : null, shown: this.active ? this.shown : 0 };
  }
}

export default SceneBox;
