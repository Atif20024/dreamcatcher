// Title (plan §2.14, F#12): Boot → Title → the station.
//   Continue   the current save, at the station; a dream left mid-run shows
//              CONTINUE on its platform (the hub's own Continue flow)
//   New game   asks first when there is a save, then wipes slot 0
//   Settings   the music toggle (the pause menu's settings)
// Painted like the station at night, bitmap type only. Dev warps
// (?warp=, ?wr=, ?at= ...) boot their scene directly and never see this.
import Phaser from 'phaser';
import { uiText } from '../ui/text.js';
import PauseMenu from '../ui/PauseMenu.js';
import { saveStore } from '../meta/SaveStore.js';
import { getSave } from '../utils/save.js';
import { isMusicOff, toggleMusic } from '../systems/audio.js';

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
    const back = this.add.graphics().setDepth(19);
    back.fillStyle(0x14101c, 0.85).fillRoundedRect(W / 2 - 170, 244, 340, 54 + this.items.length * 26, 8);
    back.lineStyle(1, 0xc4a25c, 0.5).strokeRoundedRect(W / 2 - 170, 244, 340, 54 + this.items.length * 26, 8);
    this.itemTexts = this.items.map((it, i) =>
      uiText(this, W / 2, 298 + i * 26, it.label, { size: 'display', color: 'ink-dim', align: 'center', backing: 0x14101c }).setOrigin(0.5).setDepth(20)
    );
    const sub = this.canContinue
      ? `${s.dreamsCaught} caught${runs.length ? ' · a dream is waiting where you left it' : ''}`
      : 'nine o\'clock. every train leaves now.';
    this.subText = uiText(this, W / 2, 264, sub, { size: 'body', color: 'ink-dim', align: 'center', backing: 0x14101c }).setOrigin(0.5).setDepth(20);
    uiText(this, W / 2, H - 22, '[↑↓] choose   [Enter] / [E] go   [M] music', { size: 'body', color: 'ink', align: 'center' }).setOrigin(0.5).setDepth(20);
    this.render();
    this.input.keyboard.on('keydown', (e) => this.onKey(e));
    this.cameras.main.fadeIn(500);
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
    this.cameras.main.fadeOut(400);
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
    const items = () => [
      {
        id: 'music',
        label: `Music: ${isMusicOff() ? 'off' : 'on'}`,
        action: (m) => {
          toggleMusic();
          m.setItems(items(), { keepIndex: true });
        },
      },
      { id: 'back', label: 'Back', action: (m) => m.close() },
    ];
    this.menu.open({ title: 'Settings', lines: [], items: items(), canClose: true });
  }

  // ---- the painting: the station at night, a train waiting, the hoop -------
  paint() {
    const g = this.add.graphics();
    // sky
    g.fillGradientStyle(0x10142a, 0x10142a, 0x3a2440, 0x2a1a30, 1);
    g.fillRect(0, 0, W, H);
    const rnd = new Phaser.Math.RandomDataGenerator(['title']);
    for (let i = 0; i < 90; i++) {
      const a = rnd.realInRange(0.2, 0.9);
      g.fillStyle(0xf2e6cc, a).fillRect(rnd.between(0, W), rnd.between(0, 260), rnd.pick([1, 1, 2]), rnd.pick([1, 1, 2]));
    }
    // the moon, warm
    g.fillStyle(0xf2e6cc, 0.95).fillCircle(790, 92, 30);
    g.fillStyle(0x10142a, 0.9).fillCircle(802, 86, 26);
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
    g.fillStyle(0x7a2a2a, 1).fillRoundedRect(-40, 380, 620, 58, 10);
    g.fillStyle(0xf2e6cc, 1).fillRect(-40, 418, 620, 4);
    for (let i = 0; i < 11; i++) g.fillStyle(0xf2c078, 0.9).fillRect(-20 + i * 54, 392, 34, 18);
    g.fillStyle(0x2a1a1a, 1).fillCircle(60, 440, 9).fillCircle(240, 440, 9).fillCircle(420, 440, 9);
    // a lamp, its pool of light
    g.fillStyle(0x2a2a30, 1).fillRect(706, 330, 5, 110);
    g.fillStyle(0xf2c078, 1).fillCircle(708, 326, 7);
    [70, 52, 34].forEach((r, k) => g.fillStyle(0xf2c078, 0.035 * (k + 1)).fillEllipse(708, 436, r * 2.4, r * 0.7));
    // Jo, small, on the platform, looking at the train
    g.fillStyle(0x14101c, 1).fillRect(650, 404, 12, 26).fillCircle(656, 398, 7).fillRect(651, 430, 4, 10).fillRect(657, 430, 4, 10);
    // the dreamcatcher: hoop, web, beads, feathers
    const cx = W / 2;
    const cy = 92;
    const r = 46;
    g.lineStyle(5, 0xc4a25c, 1).strokeCircle(cx, cy, r);
    g.lineStyle(1, 0xe8dcc0, 0.8);
    const pts = 9;
    for (let ring = 0; ring < 3; ring++) {
      const rr = r * (1 - ring * 0.28);
      for (let i = 0; i < pts; i++) {
        const a1 = (i / pts) * Math.PI * 2 + ring * 0.35;
        const a2 = ((i + 1) / pts) * Math.PI * 2 + ring * 0.35;
        g.lineBetween(cx + Math.cos(a1) * rr, cy + Math.sin(a1) * rr, cx + Math.cos(a2) * rr * 0.72, cy + Math.sin(a2) * rr * 0.72);
      }
    }
    g.fillStyle(0xe03a8a, 1).fillCircle(cx, cy, 4);
    [-30, 0, 30].forEach((dx, i) => {
      const x = cx + dx;
      g.lineStyle(1, 0xe8dcc0, 0.8).lineBetween(x, cy + r - 6, x, cy + r + 24 + (i === 1 ? 10 : 0));
      g.fillStyle(0x88b8d8, 1).fillCircle(x, cy + r + 18 + (i === 1 ? 10 : 0), 3);
      g.fillStyle(0xf2e6cc, 0.9).fillEllipse(x, cy + r + 38 + (i === 1 ? 10 : 0), 8, 26);
    });
    this.hoop = g;
    uiText(this, W / 2, 214, 'DREAMCATCHER', { size: 'display', scale: 2, color: 'accent', align: 'center', plate: false }).setOrigin(0.5).setDepth(20);
  }
}
