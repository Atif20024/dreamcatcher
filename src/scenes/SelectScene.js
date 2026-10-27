import Phaser from 'phaser';
import { getSave } from '../utils/save.js';
import { uiText } from '../ui/text.js';

const DREAMS = [
  { key: 'musician', name: 'The Big Stage' },
  { key: 'chef', name: 'Five-Star Dream' },
];

// Temporary dream picker — replaced by the walkable Crossroads Station in M3.
export default class SelectScene extends Phaser.Scene {
  constructor() {
    super('Select');
  }

  create() {
    const g = this.add.graphics();
    g.fillGradientStyle(0x1b1b3a, 0x1b1b3a, 0x3a2434, 0x2a1a28, 1);
    g.fillRect(0, 0, 960, 540);

    const save = getSave();
    uiText(this, 480, 120, 'DREAMCATCHER', { fontSize: '42px', color: '#f2d580' })
      .setOrigin(0.5);
    uiText(this, 480, 165, 'which dream calls to you?', { fontSize: '16px', color: '#c8c0b0' })
      .setOrigin(0.5);

    DREAMS.forEach((d, i) => {
      const caught = save.dreams[d.key];
      uiText(this, 480, 260 + i * 50, `[${i + 1}]  ${d.name}${caught ? '   ✓ caught' : ''}`, {
          fontSize: '22px',
          color: caught ? '#8a8478' : '#e8dcc8',
        })
        .setOrigin(0.5);
      this.input.keyboard.addKey(['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE'][i]).on('down', () => {
        this.scene.start('Intro', { levelKey: d.key });
      });
    });

    if (save.dreamsCaught > 0) {
      uiText(this, 480, 380, `dreams caught: ${save.dreamsCaught} — the world grows darker`, {
          fontSize: '13px',
          color: '#a08a9a',
        })
        .setOrigin(0.5);
    }
    uiText(this, 480, 440, '[F] fullscreen  ·  [Esc] pause inside a dream', {
        fontSize: '13px',
        color: '#8a8478',
      })
      .setOrigin(0.5);
    uiText(this, 480, 470, 'Crossroads Station opens in M3', { fontSize: '12px', color: '#6a6478' })
      .setOrigin(0.5);

    this.input.keyboard.on('keydown-F', () => {
      if (this.scale.isFullscreen) this.scale.stopFullscreen();
      else this.scale.startFullscreen();
    });
  }
}
