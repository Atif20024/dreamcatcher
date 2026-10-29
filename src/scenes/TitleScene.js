// Title (plan §2.14, F#12): Boot → Title → the station.
//   Continue   the current save, at the station; a dream left mid-run shows
//              CONTINUE on its platform (the hub's own Continue flow)
//   New game   asks first when there is a save, then wipes slot 0
//   Settings   the music toggle (the pause menu's settings)
// Painted like the station at night, bitmap type only. Dev warps
// (?warp=, ?wr=, ?at= ...) boot their scene directly and never see this.
import Phaser from 'phaser';
import { uiText } from '../ui/text.js';
import { settingsItems } from '../ui/settingsItems.js';
import PauseMenu from '../ui/PauseMenu.js';
import { saveStore } from '../meta/SaveStore.js';
import { getSave } from '../utils/save.js';
import { toggleMusic, sfx } from '../systems/audio.js';
import { drawPanel } from '../ui/Panel.js';
import { IDENTITY } from '../ui/theme.js';
import { dreamcatcherTexture, caughtRounds, WEB_ORDER } from '../art/identityArt.js';

const W = 960;
const H = 540;

export function hasProgress(s = getSave()) {
  const runs = saveStore.runs();
  return s.dreamsCaught > 0 || (s.flags.hub.visits || 0) > 0 || Object.keys(runs).length > 0 || (s.stationSeconds || 0) > 0;
}

export default class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  create() {
    this.paint();
    this.menu = new PauseMenu(this, { depth: 260 });
    this.canContinue = hasProgress();
    const s = getSave();
    const runs = Object.keys(saveStore.runs());
    this.items = [
      ...(this.canContinue ? [{ id: 'continue', label: 'Continue', action: () => this.continueGame() }] : []),
      { id: 'new', label: 'New game', action: () => this.newGame() },
      { id: 'settings', label: 'Settings', action: () => this.settings() },
    ];
    this.idx = 0;
    // the menu sits in the one frame (WP6, §9 "UI frame")
    const mh = 54 + this.items.length * 26;
    const back = this.add.graphics().setDepth(19);
    drawPanel(back, W / 2 - 170, 244, 340, mh);
    this.itemTexts = this.items.map((it, i) =>
      uiText(this, W / 2, 298 + i * 26, it.label, { size: 'display', color: 'ink-dim', align: 'center', backing: IDENTITY.night }).setOrigin(0.5).setDepth(20)
    );
    const sub = this.canContinue
      ? `${s.dreamsCaught} caught${runs.length ? ' · a dream is waiting where you left it' : ''}`
      : 'nine o\'clock. every train leaves now.';
    this.subText = uiText(this, W / 2, 264, sub, { size: 'body', color: 'ink-dim', align: 'center', backing: IDENTITY.night }).setOrigin(0.5).setDepth(20);
    uiText(this, W / 2, H - 22, '[↑↓] choose   [Enter] / [E] go   [M] music', { size: 'body', color: 'ink', align: 'center' }).setOrigin(0.5).setDepth(20);
    this.render();
    this.input.keyboard.on('keydown', (e) => this.onKey(e));
    this.cameras.main.fadeIn(500, 0x14, 0x12, 0x2a);
  }

  onKey(e) {
    if (this.leaving || this.menu.isOpen) return;
    if (e.code === 'ArrowUp' || e.code === 'KeyW') this.move(-1);
    else if (e.code === 'ArrowDown' || e.code === 'KeyS') this.move(1);
    else if (['Enter', 'Space', 'KeyX', 'KeyE'].includes(e.code)) this.items[this.idx].action();
    else if (e.code === 'KeyM') toggleMusic();
  }

  move(d) {
    this.idx = (this.idx + d + this.items.length) % this.items.length;
    this.render();
  }

  render() {
    this.itemTexts.forEach((t, i) => {
      const on = i === this.idx;
      t.setText(on ? `→ ${this.items[i].label} ←` : this.items[i].label);
      t.setColor(on ? 'accent' : 'ink-dim');
    });
  }

  // harness: what the title offers
  state() {
    return { items: this.items.map((i) => i.id), index: this.idx, menu: this.menu.state() };
  }

  choose(id) {
    const i = this.items.findIndex((x) => x.id === id);
    if (i < 0) return false;
    this.idx = i;
    this.items[i].action();
    return true;
  }

  go(data = {}) {
    if (this.leaving) return;
    this.leaving = true;
    this.cameras.main.fadeOut(400, 0x14, 0x12, 0x2a);
    this.time.delayedCall(420, () => this.scene.start('Hub', data));
  }

  continueGame() {
    this.go();
  }

  newGame() {
    if (!this.canContinue) return this.go();
    this.menu.open({
      title: 'Start a new game?',
      lines: ['This wipes the saved game: dreams caught, coins, and any dream in progress. Settings stay.'],
      items: [
        { id: 'no', label: 'No, keep it', action: (m) => m.close() },
        {
          id: 'yes',
          label: 'Yes, start over',
          action: (m) => {
            m.close();
            saveStore.resetSlot();
            this.go();
          },
        },
      ],
      canClose: true,
    });
  }

  settings() {
    const items = () => settingsItems({ back: { id: 'back', label: 'Back', action: (m) => m.close() } });
    this.menu.open({ title: 'Settings', lines: ['←/→ change a volume'], items: items(), canClose: true });
  }

  // ---- the painting: the station at night, a train waiting, the hoop -------
  paint() {
    const g = this.add.graphics();
    // sky
    g.fillGradientStyle(0x14122a, 0x14122a, 0x3a2440, 0x2a1a30, 1);
    g.fillRect(0, 0, W, H);
    const rnd = new Phaser.Math.RandomDataGenerator(['title']);
    for (let i = 0; i < 90; i++) {
      const a = rnd.realInRange(0.2, 0.9);
      g.fillStyle(0xf2e6cc, a).fillRect(rnd.between(0, W), rnd.between(0, 260), rnd.pick([1, 1, 2]), rnd.pick([1, 1, 2]));
    }
    // the moon, warm
    g.fillStyle(0xf2e6cc, 0.95).fillCircle(790, 92, 30);
    g.fillStyle(0x14122a, 0.9).fillCircle(802, 86, 26);
    // the far city
    for (let x = 0; x < W; x += rnd.between(28, 60)) {
      const h = rnd.between(40, 130);
      g.fillStyle(0x1a1830, 1).fillRect(x, 330 - h, rnd.between(24, 56), h);
      for (let k = 0; k < 4; k++) if (rnd.frac() < 0.4) g.fillStyle(0xf2c078, 0.5).fillRect(x + 6 + k * 8, 330 - h + 12 + rnd.between(0, h - 24), 3, 4);
    }
    // the station shed: an iron arch and its glass
    g.fillStyle(0x221c2a, 1).fillRect(0, 330, W, 210);
    g.lineStyle(6, 0x3a3040, 1);
    g.beginPath();
    g.arc(W / 2, 470, 470, Math.PI * 1.08, Math.PI * 1.92);
    g.strokePath();
    g.lineStyle(2, 0x3a3040, 0.8);
    for (let i = 1; i < 10; i++) {
      const a = Math.PI * (1.08 + (0.84 * i) / 10);
      g.lineBetween(W / 2 + Math.cos(a) * 470, 470 + Math.sin(a) * 470, W / 2 + Math.cos(a) * 300, 470 + Math.sin(a) * 300);
    }
    // the platform and a waiting train, windows lit
    g.fillStyle(0x3a3034, 1).fillRect(0, 440, W, 100);
    g.fillStyle(0xc4a25c, 0.5).fillRect(0, 440, W, 3);
    g.fillStyle(0x7a2a2a, 1).fillRect(-40, 380, 620, 58);
    g.fillStyle(0x5a1e22, 1).fillRect(-40, 380, 620, 6);
    g.fillStyle(0xf2e6cc, 1).fillRect(-40, 418, 620, 4);
    for (let i = 0; i < 11; i++) g.fillStyle(0xf2c078, 0.9).fillRect(-20 + i * 54, 392, 34, 18);
    g.fillStyle(0x2a1a1a, 1).fillCircle(60, 440, 9).fillCircle(240, 440, 9).fillCircle(420, 440, 9);
    // a lamp, its pool of light
    g.fillStyle(0x2a2a30, 1).fillRect(706, 330, 5, 110);
    g.fillStyle(0xf2c078, 1).fillCircle(708, 326, 7);
    [70, 52, 34].forEach((r, k) => g.fillStyle(0xf2c078, 0.035 * (k + 1)).fillEllipse(708, 436, r * 2.4, r * 0.7));
    // Jo, small, on the platform, looking at the train
    g.fillStyle(0x14122a, 1).fillRect(650, 404, 12, 26).fillCircle(656, 398, 7).fillRect(651, 430, 4, 10).fillRect(657, 430, 4, 10);
    // the emblem (WP6, §9 "Motifs"): the same dreamcatcher that hangs in
    // the station hall, woven as far as this save has caught dreams
    const caught = caughtRounds(getSave().dreams || {});
    const key = dreamcatcherTexture(this, 'title-dreamcatcher', 96, { rounds: caught, ghost: WEB_ORDER.length - caught.length });
    this.hoop = this.add.image(W / 2, 38, key).setOrigin(0.5, 0).setDepth(5);
    this.tweens.add({ targets: this.hoop, angle: { from: -1.5, to: 1.5 }, duration: 3600, yoyo: true, repeat: -1, ease: 'sine.inout' });
    // the wordmark lights letter by letter, the board's flip (60 ms a glyph)
    const word = 'DREAMCATCHER';
    const logo = uiText(this, W / 2, 216, word, { size: 'display', scale: 2, color: 'accent', align: 'center', plate: false }).setOrigin(0.5).setDepth(20);
    const lw = logo.width;
    logo.setOrigin(0, 0.5).setX(Math.round(W / 2 - lw / 2)).setText('');
    const flaps = 'AECRTHMD';
    for (let i = 0; i <= word.length * 2; i++) {
      this.time.delayedCall(250 + i * 30, () => {
        const n = Math.floor(i / 2);
        logo.setText(word.slice(0, n) + (i % 2 && n < word.length ? flaps[(i * 3) % flaps.length] : ''));
        if (i % 2 === 0 && n > 0) sfx('clack');
      });
    }
    this.logo = logo;
  }
}
