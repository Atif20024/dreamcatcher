import { sfx } from './audio.js';
import { convKey } from '../play/RunState.js';
import ModalManager from '../ui/ModalManager.js';
import { uiText } from '../ui/text.js';
import { resolveArt } from '../art/baked.js';
import { panel, drawPanel } from '../ui/Panel.js';

// Bottom-screen dialogue with letterbox bars, portrait, name tag and
// typewriter text (40 cps). Advance with X/E/Space. scene.dialogActive
// gates the scene's update loop while a conversation runs.
export default class DialogueBox {
  constructor(scene) {
    this.scene = scene;
    this.active = false;
  }

  // entries: [{name, text, portrait, choices?: [{label, value}]}]
  // Resolves with the value of the last choice made (or null).
  show(entries) {
    // C3: a resumed run does not replay a conversation it already heard
    // (only plain ones: a conversation with a choice always plays)
    const run = this.scene.run;
    if (run && entries && entries.length) {
      const key = convKey(entries);
      if (!entries.some((e) => e.choices) && run.seenBeforeResume(key)) return Promise.resolve(null);
      run.markConv(key);
    }
    this.choiceValue = null;
    return new Promise((resolve) => {
      const s = this.scene;
      const cam = s.cameras.main;
      this.active = true;
      s.dialogActive = true;
      // one modal among the others (ModalManager): keys only while on top
      this.handle = ModalManager.for(s).open({ kind: 'dialogue', freeze: 'physics', onKey: (e) => this.keyHandler && this.keyHandler(e) });
      const add = (o) => this.handle.add(o);

      const depth = 200;
      const boxH = 132;
      const boxY = cam.height - 16 - boxH / 2;
      this.bars = [
        add(s.add.rectangle(cam.width / 2, 20, cam.width, 40, 0x000000).setScrollFactor(0).setDepth(depth)),
        add(s.add.rectangle(cam.width / 2, cam.height - 8, cam.width, 16, 0x000000).setScrollFactor(0).setDepth(depth)),
      ];
      this.box = add(panel(s, cam.width / 2, boxY, cam.width - 48, boxH, { depth }));
      this.nameText = add(uiText(s, 152, boxY - boxH / 2 + 14, '', { size: 'small', color: 'accent' }).setScrollFactor(0).setDepth(depth + 1));
      this.bodyText = add(
        uiText(s, 152, boxY - boxH / 2 + 38, '', { size: 'body', color: 'ink', wrap: cam.width - 48 - 152 - 40, lineSpacing: 4 })
          .setScrollFactor(0)
          .setDepth(depth + 1)
      );
      this.hint = add(uiText(s, cam.width - 40, boxY + boxH / 2 - 12, '[X] ▼', { size: 'small', color: 'ink-dim' }).setOrigin(1, 1).setScrollFactor(0).setDepth(depth + 1));
      this.portrait = add(s.add.image(88, boxY, '__WHITE').setScrollFactor(0).setDepth(depth + 1).setVisible(false));

      this.entries = entries;
      this.idx = 0;
      this.resolve = resolve;
      this.startEntry();

      this.choiceTexts = [];
      this.choiceIdx = 0;
      this.keyHandler = (e) => {
        if (this.choosing) {
          const entry = this.entries[this.idx];
          if (['ArrowUp', 'ArrowLeft'].includes(e.code)) {
            this.choiceIdx = (this.choiceIdx + entry.choices.length - 1) % entry.choices.length;
            this.renderChoices();
          } else if (['ArrowDown', 'ArrowRight'].includes(e.code)) {
            this.choiceIdx = (this.choiceIdx + 1) % entry.choices.length;
            this.renderChoices();
          } else if (['KeyX', 'KeyE', 'Space', 'Enter'].includes(e.code)) {
            this.choiceValue = entry.choices[this.choiceIdx].value;
            this.choosing = false;
            this.choiceTexts.forEach((t) => t.destroy());
            this.choiceTexts = [];
            this.idx += 1;
            if (this.idx < this.entries.length) this.startEntry();
            else this.close();
          }
          return;
        }
        if (['KeyX', 'KeyE', 'Space'].includes(e.code)) this.advance();
      };
    });
  }

  renderChoices() {
    const s = this.scene;
    const cam = s.cameras.main;
    const entry = this.entries[this.idx];
    this.choiceTexts.forEach((t) => t.destroy());
    const gap = Math.min(220, Math.floor((cam.width - 100) / Math.max(1, entry.choices.length)));
    // choices: rows under the line, the cursor in accent (several choices
    // side by side only when they fit)
    const n = entry.choices.length;
    const labels = entry.choices.map((c, i) => `${i === this.choiceIdx ? '→ ' : '  '}${c.label}`);
    const across = this.choicesAcross(entry);
    const top = this.bodyText.y + this.bodyText.height + 14;
    this.choiceTexts = labels.map((l, i) =>
      this.handle.add(
        uiText(s, across ? cam.width / 2 + (i - (n - 1) / 2) * gap : 152, across ? this.boxTop + this.boxH - 26 : top + i * 18, l, {
          size: 'small',
          color: i === this.choiceIdx ? 'accent' : 'ink-dim',
        })
          .setOrigin(across ? 0.5 : 0, 0.5)
          .setScrollFactor(0)
          .setDepth(202)
      )
    );
  }

  choicesAcross(entry) {
    if (!entry.choices) return false;
    const total = entry.choices.reduce((w, c) => w + (c.label.length + 2) * 12 + 40, 0);
    return total < this.scene.cameras.main.width - 220;
  }

  // the box grows to the entry: its full text and its choices always fit
  layoutFor(entry) {
    const cam = this.scene.cameras.main;
    this.bodyText.setText(entry.text || '');
    const th = this.bodyText.height;
    this.bodyText.setText('');
    const choiceH = entry.choices ? (this.choicesAcross(entry) ? 30 : entry.choices.length * 18 + 14) : 0;
    const boxH = Math.max(132, 38 + th + choiceH + 30);
    const top = cam.height - 16 - boxH;
    this.boxTop = top;
    this.boxH = boxH;
    this.box.clear();
    drawPanel(this.box, 24, top, cam.width - 48, boxH);
    this.nameText.setY(top + 14);
    this.bodyText.setY(top + 38);
    this.hint.setY(top + boxH - 10);
    this.portrait.setY(Math.round(top + boxH / 2));
  }

  startEntry() {
    const e = this.entries[this.idx];
    this.layoutFor(e);
    this.nameText.setText(e.name || '');
    // Jo speaks with his own face (an atlas portrait; `mood` picks the
    // expression: smile, doubt, tired); everyone else by texture key
    const isJo = !e.portrait && /^jo$/i.test(e.name || '');
    const ref = isJo ? `portrait-jo${e.mood ? `-${e.mood}` : ''}` : e.portrait === 'portrait-jo' && e.mood ? `portrait-jo-${e.mood}` : e.portrait;
    const art = resolveArt(this.scene, ref) || (isJo ? resolveArt(this.scene, 'portrait-jo') : null);
    if (art) {
      this.portrait.setTexture(art[0], art[1]).setVisible(true);
      // big faces (the 96 px atlas portraits) are fitted to the box's left column
      const fit = Math.min(1, 104 / Math.max(this.portrait.frame.realWidth, this.portrait.frame.realHeight));
      this.portrait.setScale(fit).setOrigin(0.5);
    } else {
      this.portrait.setVisible(false);
    }
    this.full = e.text;
    this.shown = 0;
    this.bodyText.setText('');
    sfx('click');
    this.typer = this.scene.time.addEvent({
      delay: 25,
      loop: true,
      callback: () => {
        this.shown += 1;
        this.bodyText.setText(this.full.slice(0, this.shown));
        if (this.shown >= this.full.length) this.typer.remove();
      },
    });
  }

  advance() {
    if (this.shown < this.full.length) {
      this.typer.remove();
      this.shown = this.full.length;
      this.bodyText.setText(this.full);
      return;
    }
    const entry = this.entries[this.idx];
    if (entry.choices && !this.choosing) {
      this.choosing = true;
      this.choiceIdx = 0;
      this.renderChoices();
      return;
    }
    this.idx += 1;
    if (this.idx < this.entries.length) {
      this.startEntry();
    } else {
      this.close();
    }
  }

  close() {
    const s = this.scene;
    this.keyHandler = null;
    if (this.typer) this.typer.remove();
    const h = this.handle;
    this.handle = null;
    if (h) h.close();
    this.active = false;
    s.dialogActive = false;
    this.resolve(this.choiceValue);
  }
}
