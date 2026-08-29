import { sfx } from './audio.js';

// Bottom-screen dialogue with letterbox bars, portrait, name tag and
// typewriter text (40 cps). Advance with X/E/Space. scene.dialogActive
// gates the scene's update loop while a conversation runs.
export default class DialogueBox {
  constructor(scene) {
    this.scene = scene;
    this.active = false;
  }

  // entries: [{name, text, portrait}] — portrait is a texture key or null
  show(entries) {
    return new Promise((resolve) => {
      const s = this.scene;
      const cam = s.cameras.main;
      this.active = true;
      s.dialogActive = true;
      s.physics.pause();

      const depth = 200;
      this.bars = [
        s.add.rectangle(cam.width / 2, 24, cam.width, 48, 0x000000).setScrollFactor(0).setDepth(depth),
        s.add.rectangle(cam.width / 2, cam.height - 24, cam.width, 48, 0x000000).setScrollFactor(0).setDepth(depth),
      ];
      this.box = s.add
        .rectangle(cam.width / 2, cam.height - 92, cam.width - 80, 108, 0x14101c, 0.94)
        .setScrollFactor(0)
        .setDepth(depth)
        .setStrokeStyle(2, 0x8a8aa8);
      this.nameText = s.add
        .text(78, cam.height - 138, '', { fontFamily: 'monospace', fontSize: '14px', color: '#f2d580' })
        .setScrollFactor(0)
        .setDepth(depth + 1);
      this.bodyText = s.add
        .text(150, cam.height - 118, '', {
          fontFamily: 'monospace',
          fontSize: '15px',
          color: '#e8dcc8',
          wordWrap: { width: cam.width - 250 },
          lineSpacing: 5,
        })
        .setScrollFactor(0)
        .setDepth(depth + 1);
      this.hint = s.add
        .text(cam.width - 60, cam.height - 52, '[X] ▸', { fontFamily: 'monospace', fontSize: '12px', color: '#8a8478' })
        .setScrollFactor(0)
        .setDepth(depth + 1);
      this.portrait = s.add.image(105, cam.height - 92, '__WHITE').setScrollFactor(0).setDepth(depth + 1).setVisible(false);

      this.entries = entries;
      this.idx = 0;
      this.resolve = resolve;
      this.startEntry();

      this.keyHandler = (e) => {
        if (['KeyX', 'KeyE', 'Space'].includes(e.code)) this.advance();
      };
      s.input.keyboard.on('keydown', this.keyHandler);
    });
  }

  startEntry() {
    const e = this.entries[this.idx];
    this.nameText.setText(e.name || '');
    if (e.portrait && this.scene.textures.exists(e.portrait)) {
      this.portrait.setTexture(e.portrait).setVisible(true);
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
    this.idx += 1;
    if (this.idx < this.entries.length) {
      this.startEntry();
    } else {
      this.close();
    }
  }

  close() {
    const s = this.scene;
    s.input.keyboard.off('keydown', this.keyHandler);
    [...this.bars, this.box, this.nameText, this.bodyText, this.hint, this.portrait].forEach((o) => o.destroy());
    this.active = false;
    s.dialogActive = false;
    if (!s.cardActive && !s.puzzleActive) s.physics.resume();
    this.resolve();
  }
}
