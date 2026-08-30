import Phaser from 'phaser';
import { getSave } from '../utils/save.js';

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
    this.add
      .text(480, 120, 'DREAMCATCHER', { fontFamily: 'monospace', fontSize: '42px', color: '#f2d580' })
      .setOrigin(0.5);
    this.add
      .text(480, 165, 'which dream calls to you?', { fontFamily: 'monospace', fontSize: '16px', color: '#c8c0b0' })
      .setOrigin(0.5);

    DREAMS.forEach((d, i) => {
      const caught = save.dreams[d.key];
      this.add
        .text(480, 260 + i * 50, `[${i + 1}]  ${d.name}${caught ? '   ✓ caught' : ''}`, {
          fontFamily: 'monospace',
          fontSize: '22px',
          color: caught ? '#8a8478' : '#e8dcc8',
        })
        .setOrigin(0.5);
      this.input.keyboard.addKey(['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE'][i]).on('down', () => {
        this.scene.start('Intro', { levelKey: d.key });
      });
    });

    if (save.dreamsCaught > 0) {
      this.add
        .text(480, 380, `dreams caught: ${save.dreamsCaught} — the world grows darker`, {
          fontFamily: 'monospace',
          fontSize: '13px',
          color: '#a08a9a',
        })
        .setOrigin(0.5);
    }
    this.add
      .text(480, 440, '[F] fullscreen  ·  [Esc] pause inside a dream', {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#8a8478',
      })
      .setOrigin(0.5);
    this.add
      .text(480, 470, 'Crossroads Station opens in M3', { fontFamily: 'monospace', fontSize: '12px', color: '#6a6478' })
      .setOrigin(0.5);

    this.input.keyboard.on('keydown-F', () => {
      if (this.scale.isFullscreen) this.scale.stopFullscreen();
      else this.scale.startFullscreen();
    });
  }
}
