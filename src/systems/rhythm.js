import Phaser from 'phaser';
import { sfx, trumpet } from './audio.js';

// Call & Response engine. A phrase is an array of beats: 1 = play a note,
// 0 = rest (do NOT play). Flow per phrase: one LISTEN bar (icons pulse with
// audio preview), then one PLAY bar (cursor sweeps; judge each beat).
//
// new Phrases(scene, {bpm, phrases, window, enforceRests, onPhrase, onDone,
//   onBeatHit, label}) — call update(time) every frame; feed Q presses via
// notePressed(time). destroy() removes UI.
export default class Phrases {
  constructor(scene, opts) {
    this.scene = scene;
    this.bpm = opts.bpm || 100;
    this.beatMs = 60000 / this.bpm;
    this.phrases = opts.phrases;
    this.window = opts.window || 140;
    this.enforceRests = opts.enforceRests !== false;
    this.invertRests = !!opts.invertRests; // studio: rests must be FILLED
    this.hideIcons = !!opts.hideIcons; // day 6 blind recovery
    this.onRestFilled = opts.onRestFilled || (() => {});
    this.onPhrase = opts.onPhrase || (() => {});
    this.onDone = opts.onDone || (() => {});
    this.onBeatHit = opts.onBeatHit || (() => {});
    this.pitchStep = 0;

    this.phraseIdx = 0;
    this.state = 'idle';
    this.passes = 0;

    const cam = scene.cameras.main;
    this.ui = scene.add.container(cam.width / 2, 96).setScrollFactor(0).setDepth(170);
    this.bg = scene.add.rectangle(0, 0, 360, 76, 0x14101c, 0.85).setStrokeStyle(2, 0x8a8aa8);
    this.label = scene.add
      .text(0, -26, opts.label || '', { fontFamily: 'monospace', fontSize: '12px', color: '#c8c0b0' })
      .setOrigin(0.5);
    this.cursor = scene.add.rectangle(0, 8, 4, 40, 0xf2d580).setVisible(false);
    this.ui.add([this.bg, this.label, this.cursor]);
    this.icons = [];
    this.destroyed = false;
  }

  start() {
    this.phraseIdx = 0;
    this.passes = 0;
    this.startPhrase();
  }

  startPhrase() {
    const pattern = this.phrases[this.phraseIdx];
    this.pattern = pattern;
    this.icons.forEach((i) => i.destroy());
    this.required = pattern.map((v) => (this.invertRests ? 1 : v));
    this.icons = pattern.map((v, i) => {
      const x = (i - (pattern.length - 1) / 2) * 44;
      const icon =
        v === 1
          ? this.scene.add.circle(x, 8, 10, 0xf2d580)
          : this.scene.add.circle(x, 8, 10).setStrokeStyle(3, 0x8a8aa8);
      if (this.hideIcons) icon.setAlpha(0.12);
      this.ui.add(icon);
      return icon;
    });
    this.label.setText(`phrase ${this.phraseIdx + 1}/${this.phrases.length} — listen…`);
    this.state = 'listen';
    this.stateStart = this.scene.time.now;
    this.hits = pattern.map(() => null); // null = unjudged, true/false
    this.previewed = pattern.map(() => false);
  }

  notePressed(time) {
    if (this.state !== 'play') return;
    const tIn = time - this.playStart;
    let best = -1;
    let bestD = 1e9;
    this.pattern.forEach((v, i) => {
      const d = Math.abs(tIn - i * this.beatMs);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    if (best >= 0 && bestD <= this.window && this.required[best] === 1 && this.hits[best] === null) {
      this.hits[best] = true;
      if (this.pattern[best] === 0) {
        // filled a rest on the producer's orders — it should feel wrong
        this.icons[best].setFillStyle(0xa0c860);
        trumpet(9, 0.25, 0.3);
        this.onRestFilled(best);
      } else {
        this.icons[best].setFillStyle(0x7ec87e);
        trumpet(this.pitchStep++ % 12, 0.3);
      }
      this.onBeatHit(best);
    } else if (best >= 0 && this.pattern[best] === 0 && this.enforceRests && !this.invertRests && bestD <= this.window) {
      this.hits[best] = false; // played over a rest
      this.icons[best].setStrokeStyle(3, 0xe86a6a);
      sfx('fail');
    } else {
      trumpet(this.pitchStep % 12, 0.15, 0.15); // stray note, no judgement
    }
  }

  update(time) {
    if (this.destroyed || this.state === 'idle' || this.state === 'done') return;
    const barLen = this.pattern.length * this.beatMs;

    if (this.state === 'listen') {
      const t = time - this.stateStart;
      const beat = Math.floor(t / this.beatMs);
      if (beat < this.pattern.length && !this.previewed[beat]) {
        this.previewed[beat] = true;
        const icon = this.icons[beat];
        this.scene.tweens.add({ targets: icon, scale: 1.5, duration: 90, yoyo: true });
        if (this.pattern[beat] === 1) trumpet(beat % 12, 0.25, 0.18);
        else sfx('click');
      }
      if (t >= barLen + this.beatMs * 0.5) {
        this.state = 'play';
        this.playStart = time;
        this.label.setText(`phrase ${this.phraseIdx + 1}/${this.phrases.length} — PLAY!`);
        this.cursor.setVisible(true);
      }
      return;
    }

    // play state
    const t = time - this.playStart;
    const frac = Phaser.Math.Clamp(t / barLen, 0, 1);
    this.cursor.x = (frac - 0.5) * (this.pattern.length - 1) * 44 + (frac - 0.5) * 44;
    // judge passed required beats that were never hit
    this.required.forEach((v, i) => {
      if (v === 1 && this.hits[i] === null && t > i * this.beatMs + this.window) {
        this.hits[i] = false;
        this.icons[i].setFillStyle(0xe86a6a);
      }
    });
    if (t >= barLen + this.window + 60) {
      const ok = this.hits.every((h, i) => (this.required[i] === 1 ? h === true : h !== false));
      this.passes += ok ? 1 : 0;
      this.cursor.setVisible(false);
      this.onPhrase(ok, this.phraseIdx);
      this.phraseIdx += 1;
      if (this.phraseIdx >= this.phrases.length) {
        this.state = 'done';
        this.onDone(this.passes, this.phrases.length);
      } else {
        this.startPhrase();
      }
    }
  }

  destroy() {
    this.destroyed = true;
    this.ui.destroy();
  }
}
