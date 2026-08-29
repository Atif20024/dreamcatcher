import Phaser from 'phaser';
import { sfx } from './audio.js';

// Full-screen modal puzzle overlays. Keyboard-driven. Each puzzle resolves
// true on success; Esc closes (retry later). scene.puzzleActive gates update.

class Modal {
  constructor(scene, title, instruction) {
    this.scene = scene;
    const cam = scene.cameras.main;
    this.objs = [];
    scene.puzzleActive = true;
    scene.physics.pause();
    const depth = 300;
    this.depth = depth;
    this.add(scene.add.rectangle(cam.width / 2, cam.height / 2, cam.width, cam.height, 0x000000, 0.8).setScrollFactor(0).setDepth(depth));
    this.add(
      scene.add
        .rectangle(cam.width / 2, cam.height / 2, 620, 400, 0x181420, 0.98)
        .setScrollFactor(0)
        .setDepth(depth)
        .setStrokeStyle(2, 0xd8b858)
    );
    this.add(
      scene.add
        .text(cam.width / 2, cam.height / 2 - 170, title, { fontFamily: 'monospace', fontSize: '22px', color: '#f2d580' })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(depth + 1)
    );
    this.add(
      scene.add
        .text(cam.width / 2, cam.height / 2 - 140, instruction, {
          fontFamily: 'monospace',
          fontSize: '13px',
          color: '#c8c0b0',
          align: 'center',
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(depth + 1)
    );
    this.add(
      scene.add
        .text(cam.width / 2, cam.height / 2 + 180, '[Esc] step away', { fontFamily: 'monospace', fontSize: '11px', color: '#6a6478' })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(depth + 1)
    );
  }

  add(o) {
    this.objs.push(o);
    return o;
  }

  text(x, y, str, size = 15, color = '#e8dcc8') {
    return this.add(
      this.scene.add
        .text(x, y, str, { fontFamily: 'monospace', fontSize: `${size}px`, color, align: 'center' })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(this.depth + 2)
    );
  }

  close(result, resolve) {
    this.scene.input.keyboard.off('keydown', this.keyHandler);
    this.objs.forEach((o) => o.destroy());
    this.scene.puzzleActive = false;
    if (!this.scene.cardActive && !this.scene.dialogActive) this.scene.physics.resume();
    resolve(result);
  }

  listen(fn, resolve) {
    this.keyHandler = (e) => {
      if (e.code === 'Escape') {
        this.close(false, resolve);
        return;
      }
      fn(e.code);
    };
    this.scene.input.keyboard.on('keydown', this.keyHandler);
  }
}

// P1 — Freezer Valve: rotate a dial (8 positions) until all three gauges
// sit in the green band. Exactly one position works.
const GAUGES = [
  [1, 6, 2],
  [7, 2, 3],
  [3, 7, 6],
  [0, 4, 1],
  [6, 1, 7],
  [4, 4, 5],
  [2, 0, 0],
  [5, 3, 7],
];
const GREEN = [3, 5];

export function freezerValve(scene) {
  return new Promise((resolve) => {
    const cam = scene.cameras.main;
    const m = new Modal(scene, 'FREEZER VALVE', '←/→ rotate the dial · every pipe gauge must sit in the GREEN band\n[Enter] engage compressor override');
    let pos = 0;
    const cx = cam.width / 2;
    const cy = cam.height / 2 + 30;
    const dialText = m.text(cx, cy + 90, '', 20, '#f2d580');
    const needles = [0, 1, 2].map((i) => {
      m.text(cx - 160 + i * 160, cy - 70, `PIPE ${i + 1}`, 12, '#8a8aa8');
      m.add(scene.add.rectangle(cx - 160 + i * 160, cy - 20, 120, 18, 0x2a2a34).setScrollFactor(0).setDepth(m.depth + 1));
      m.add(
        scene.add
          .rectangle(cx - 160 + i * 160 - 60 + (GREEN[0] * 120) / 8 + ((GREEN[1] - GREEN[0] + 1) * 120) / 16, cy - 20, ((GREEN[1] - GREEN[0] + 1) * 120) / 8, 18, 0x3a6a3a)
          .setScrollFactor(0)
          .setDepth(m.depth + 1)
      );
      return m.add(scene.add.rectangle(cx - 160 + i * 160 - 60, cy - 20, 6, 26, 0xe86a6a).setScrollFactor(0).setDepth(m.depth + 2));
    });
    const render = () => {
      dialText.setText(`◄ DIAL: ${pos} ►`);
      GAUGES[pos].forEach((v, i) => {
        scene.tweens.add({ targets: needles[i], x: cx - 160 + i * 160 - 60 + (v * 120) / 8 + 7, duration: 250 });
        needles[i].fillColor = v >= GREEN[0] && v <= GREEN[1] ? 0x7ec87e : 0xe86a6a;
      });
    };
    render();
    const status = m.text(cx, cy + 130, '', 14);
    m.listen((code) => {
      if (code === 'ArrowLeft') {
        pos = (pos + 7) % 8;
        sfx('click');
        render();
      } else if (code === 'ArrowRight') {
        pos = (pos + 1) % 8;
        sfx('click');
        render();
      } else if (code === 'Enter') {
        if (GAUGES[pos].every((v) => v >= GREEN[0] && v <= GREEN[1])) {
          sfx('chime');
          status.setText('PRESSURE STABLE — compressor stopped.').setColor('#7ec87e');
          scene.time.delayedCall(900, () => m.close(true, resolve));
        } else {
          sfx('fail');
          status.setText('OVERSHOOT — panel rebooting…').setColor('#e86a6a');
          scene.time.delayedCall(1200, () => status.setText(''));
        }
      }
    }, resolve);
  });
}

// P2 — Ticket Rail: arrange six tickets into the one viable fire order.
const CORRECT = ['Risotto', 'Soufflé', 'Steak', 'Fish', 'Soup', 'Salad'];
const TIMES = { Risotto: 18, Soufflé: 14, Steak: 12, Fish: 8, Soup: 4, Salad: 2 };

export function ticketRail(scene) {
  return new Promise((resolve) => {
    const cam = scene.cameras.main;
    const m = new Modal(
      scene,
      'THE TICKET RAIL',
      'Longest cook fires first or dishes die under the lamp.\n←/→ select · [Space] grab/swap · [Enter] fire the order'
    );
    let order = ['Soup', 'Salad', 'Fish', 'Risotto', 'Steak', 'Soufflé'];
    let sel = 0;
    let grabbed = -1;
    const cx = cam.width / 2;
    const cy = cam.height / 2 + 10;
    const cards = order.map((_, i) =>
      m.add(scene.add.rectangle(cx - 250 + i * 100, cy, 88, 110, 0xe8e0d0).setScrollFactor(0).setDepth(m.depth + 1))
    );
    const labels = order.map((_, i) => m.text(cx - 250 + i * 100, cy - 15, '', 12, '#2a2218'));
    const times = order.map((_, i) => m.text(cx - 250 + i * 100, cy + 25, '', 14, '#8a4a2a'));
    const status = m.text(cx, cy + 110, '', 14);
    const render = () => {
      order.forEach((dish, i) => {
        labels[i].setText(dish);
        times[i].setText(`${TIMES[dish]} min`);
        cards[i].setStrokeStyle(3, i === sel ? (grabbed === i ? 0xe86a6a : 0xf2d580) : 0x8a8478);
        cards[i].y = cy + (grabbed === i ? -14 : 0);
        labels[i].y = cards[i].y - 15;
        times[i].y = cards[i].y + 25;
      });
    };
    render();
    m.listen((code) => {
      if (code === 'ArrowLeft') {
        sel = (sel + 5) % 6;
        sfx('click');
      } else if (code === 'ArrowRight') {
        sel = (sel + 1) % 6;
        sfx('click');
      } else if (code === 'Space') {
        if (grabbed === -1) grabbed = sel;
        else {
          [order[grabbed], order[sel]] = [order[sel], order[grabbed]];
          grabbed = -1;
          sfx('clang');
        }
      } else if (code === 'Enter') {
        const firstWrong = order.findIndex((d, i) => d !== CORRECT[i]);
        if (firstWrong === -1) {
          sfx('chime');
          status.setText('SERVICE! Every dish lands hot.').setColor('#7ec87e');
          scene.time.delayedCall(900, () => m.close(true, resolve));
        } else {
          sfx('fail');
          status.setText(`✗ the ${order[firstWrong]} died under the lamp — refire`).setColor('#e86a6a');
          cards[firstWrong].setFillStyle(0xe8b0a0);
          scene.time.delayedCall(1400, () => {
            cards[firstWrong].setFillStyle(0xe8e0d0);
            status.setText('');
          });
        }
      }
      render();
    }, resolve);
  });
}

// P3 — Piping: trace the rosette in one unbroken stroke, no cell twice.
const ROSETTE = [
  [1, 1], [1, 2], [1, 3],
  [2, 1], [2, 2], [2, 3],
  [3, 1], [3, 2], [3, 3],
];

export function piping(scene) {
  return new Promise((resolve) => {
    const cam = scene.cameras.main;
    const m = new Modal(scene, 'THE PLATE', 'Pipe the rosette in ONE stroke — arrows to move,\nnever cross your own line. Start anywhere on the pattern.');
    const cx = cam.width / 2;
    const cy = cam.height / 2 + 25;
    const size = 46;
    const key = (r, c) => `${r},${c}`;
    const marked = new Set(ROSETTE.map(([r, c]) => key(r, c)));
    let visited = new Set();
    let cur = null;
    const cells = {};
    m.add(scene.add.circle(cx, cy, 130, 0xe8e0d0).setScrollFactor(0).setDepth(m.depth + 1));
    for (const [r, c] of ROSETTE) {
      cells[key(r, c)] = m.add(
        scene.add.rectangle(cx + (c - 2) * size, cy + (r - 2) * size, size - 8, size - 8, 0xd8d0c0).setScrollFactor(0).setDepth(m.depth + 2)
      );
    }
    const status = m.text(cx, cy + 160, 'move onto the plate to begin', 13);
    const wipe = () => {
      visited = new Set();
      cur = null;
      Object.values(cells).forEach((c) => c.setFillStyle(0xd8d0c0));
      sfx('fail');
      status.setText('the plate is wiped — again');
    };
    const enter = (r, c) => {
      const k = key(r, c);
      if (!marked.has(k)) return;
      if (visited.has(k)) {
        wipe();
        return;
      }
      cur = [r, c];
      visited.add(k);
      cells[k].setFillStyle(0xd88a5a);
      sfx('squish');
      if (visited.size === ROSETTE.length) {
        sfx('chime');
        status.setText('…perfect. The drawer clicks open.').setColor('#7ec87e');
        scene.time.delayedCall(900, () => m.close(true, resolve));
      }
    };
    m.listen((code) => {
      const dirs = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
      if (!dirs[code]) return;
      if (!cur) {
        enter(2, 2);
        return;
      }
      const [dr, dc] = dirs[code];
      const nr = cur[0] + dr;
      const nc = cur[1] + dc;
      if (!marked.has(key(nr, nc))) {
        wipe();
        return;
      }
      enter(nr, nc);
    }, resolve);
  });
}
