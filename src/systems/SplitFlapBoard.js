import Phaser from 'phaser';
import { sfx } from './audio.js';
import { D } from '../builders/depths.js';

// The departure board: the loudest thing in the room, and it only ever says
// where you could be. Each cell is a glyph that flips (4-frame scaleY) when
// its character changes, with one clack per cell, throttled so a full-row
// update sounds like a board and not a drum roll.
const COLS = { platform: 0, title: 5, departs: 28, status: 38 };
const CELL_W = 11;
const ROW_H = 20;

export default class SplitFlapBoard {
  constructor(scene, x, y, rows) {
    this.scene = scene;
    this.rows = rows; // [{ platform, title, departs, status, dim }]
    this.cells = [];
    this.width = 56 * CELL_W + 24;
    this.height = (rows.length + 1) * ROW_H + 30;
    this.container = scene.add.container(x, y).setDepth(D.INTERACT - 1);
    this.container.add(
      scene.add.rectangle(0, 0, this.width, this.height, 0x141418).setStrokeStyle(3, 0xc4a25c)
    );
    const header = scene.add.text(-this.width / 2 + 12, -this.height / 2 + 6, 'PLATFORM   DESTINATION            DEPARTS   STATUS', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#c4a25c',
    });
    this.container.add(header);
    this.clackAt = 0;
    rows.forEach((r, i) => this.buildRow(i));
    rows.forEach((r, i) => this.setRow(i, r, true));
  }

  buildRow(i) {
    const y = -this.height / 2 + 30 + i * ROW_H;
    const x0 = -this.width / 2 + 12;
    const cells = [];
    for (let c = 0; c < 56; c++) {
      const t = this.scene.add
        .text(x0 + c * CELL_W, y, ' ', { fontFamily: 'monospace', fontSize: '13px', color: '#f2e6cc' })
        .setOrigin(0, 0.5);
      cells.push(t);
      this.container.add(t);
    }
    this.cells[i] = cells;
  }

  rowString(r) {
    const s = new Array(56).fill(' ');
    const put = (col, str) => [...String(str)].forEach((ch, k) => (s[col + k] = ch));
    put(COLS.platform, `  ${r.platform}`.slice(-3));
    put(COLS.title, r.title.slice(0, 22));
    put(COLS.departs, r.departs.slice(0, 9));
    put(COLS.status, r.status.slice(0, 18));
    return s;
  }

  setRow(i, r, instant = false) {
    this.rows[i] = r;
    const chars = this.rowString(r);
    const color = r.dim ? '#6a6478' : r.hot ? '#f2d580' : '#f2e6cc';
    chars.forEach((ch, c) => {
      const cell = this.cells[i][c];
      if (cell.text === ch && cell.style.color === color) return;
      if (instant) {
        cell.setText(ch).setColor(color);
        return;
      }
      this.flip(cell, ch, color, c * 18);
    });
  }

  flip(cell, ch, color, delay) {
    this.scene.tweens.add({
      targets: cell,
      scaleY: 0,
      duration: 60,
      delay,
      onComplete: () => {
        cell.setText(ch).setColor(color);
        const now = this.scene.time.now;
        if (now - this.clackAt > 45) {
          this.clackAt = now;
          sfx('clack');
        }
        this.scene.tweens.add({ targets: cell, scaleY: 1, duration: 60 });
      },
    });
  }

  // an idle clack somewhere on the board, so it is never quite still
  idleClack() {
    const i = Phaser.Math.Between(0, this.rows.length - 1);
    if (this.rows[i].dim) return;
    const cells = this.cells[i].filter((c) => c.text !== ' ');
    if (!cells.length) return;
    const cell = Phaser.Utils.Array.GetRandom(cells);
    this.flip(cell, cell.text, cell.style.color, 0);
  }

  destroy() {
    this.container.destroy();
  }
}
