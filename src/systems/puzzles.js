import Phaser from 'phaser';
import { sfx, trumpet } from './audio.js';

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

// P1 (musician) — Tuning: slide three valve slugs until each waveform matches
// the gold reference. Success when all three sit in tolerance.
export function tuning(scene) {
  return new Promise((resolve) => {
    const cam = scene.cameras.main;
    const m = new Modal(scene, 'TUNING', "Old Sol's bench. ↑/↓ pick a slug · ←/→ slide it.\nMatch every wave to the gold line — listen for the pure tone.");
    const cx = cam.width / 2;
    const cy = cam.height / 2 + 20;
    const targets = [64, 38, 78];
    const vals = [20, 80, 45];
    let sel = 0;
    const gfx = m.add(scene.add.graphics().setScrollFactor(0).setDepth(m.depth + 2));
    const cents = m.text(cx, cy + 140, '', 14);
    let matchedSince = 0;
    const draw = () => {
      gfx.clear();
      for (let i = 0; i < 3; i++) {
        const y = cy - 70 + i * 70;
        gfx.lineStyle(2, 0x8a6a20, 0.8);
        gfx.beginPath();
        for (let x = -220; x <= 220; x += 4) {
          const ref = Math.sin((x / 220) * Math.PI * (2 + targets[i] / 40)) * 18;
          x === -220 ? gfx.moveTo(cx + x, y + ref) : gfx.lineTo(cx + x, y + ref);
        }
        gfx.strokePath();
        const off = Math.abs(vals[i] - targets[i]);
        gfx.lineStyle(3, sel === i ? 0xf2d580 : off <= 4 ? 0x7ec87e : 0xe86a6a, 1);
        gfx.beginPath();
        for (let x = -220; x <= 220; x += 4) {
          const wv = Math.sin((x / 220) * Math.PI * (2 + vals[i] / 40)) * 18;
          x === -220 ? gfx.moveTo(cx + x, y + wv) : gfx.lineTo(cx + x, y + wv);
        }
        gfx.strokePath();
      }
      const dev = vals.reduce((a, v, i) => a + Math.abs(v - targets[i]), 0);
      cents.setText(`deviation: ${dev} cents ${dev <= 12 ? '— almost…' : ''}`);
    };
    draw();
    m.listen((code) => {
      if (code === 'ArrowUp') sel = (sel + 2) % 3;
      else if (code === 'ArrowDown') sel = (sel + 1) % 3;
      else if (code === 'ArrowLeft') vals[sel] = Math.max(0, vals[sel] - 2);
      else if (code === 'ArrowRight') vals[sel] = Math.min(100, vals[sel] + 2);
      else return;
      const off = Math.abs(vals[sel] - targets[sel]);
      trumpet(4, 0.12, Math.max(0.05, 0.3 - off / 200));
      draw();
      if (vals.every((v, i) => Math.abs(v - targets[i]) <= 4)) {
        if (!matchedSince) {
          matchedSince = 1;
          sfx('chime');
          cents.setText('PURE. The valve breathes again.').setColor('#7ec87e');
          scene.time.delayedCall(900, () => m.close(true, resolve));
        }
      }
    }, resolve);
  });
}

// P2 (musician) — Play the Room: audio-only phrases; the last bar is a rest.
// Space/Q taps; the lesson is discovering that silence is the answer.
export function playTheRoom(scene) {
  return new Promise((resolve) => {
    const cam = scene.cameras.main;
    const m = new Modal(scene, 'PLAY THE ROOM', 'No icons this time. Listen. Answer.\n[Space] to play a note — when it needs one.');
    const cx = cam.width / 2;
    const cy = cam.height / 2 + 30;
    const ROUNDS = [
      [1, 1, 1, 0],
      [1, 0, 1, 0],
      [1, 0, 0, 0],
    ];
    const BEAT = 600;
    const WIN = 170;
    let round = 0;
    let state = 'listen';
    let t0 = scene.time.now;
    let hits = [];
    let previewed = [];
    const spot = m.add(scene.add.circle(cx, cy, 40, 0xf2e0a0, 0.15).setScrollFactor(0).setDepth(m.depth + 1));
    const pulse = m.add(scene.add.circle(cx, cy, 6, 0xf2d580).setScrollFactor(0).setDepth(m.depth + 2));
    const status = m.text(cx, cy + 120, 'listen…', 14);
    const beginRound = () => {
      state = 'listen';
      t0 = scene.time.now;
      hits = ROUNDS[round].map(() => null);
      previewed = ROUNDS[round].map(() => false);
      status.setText(`round ${round + 1}/3 — listen…`).setColor('#c8c0b0');
      scene._ptr = { get state() { return state; }, get t0() { return t0; }, get round() { return round; }, ROUNDS, BEAT, WIN };
    };
    beginRound();
    const tick = scene.time.addEvent({
      delay: 30,
      loop: true,
      callback: () => {
        const pat = ROUNDS[round];
        const t = scene.time.now - t0;
        if (state === 'listen') {
          const b = Math.floor(t / BEAT);
          if (b < pat.length && !previewed[b]) {
            previewed[b] = true;
            scene.tweens.add({ targets: pulse, scale: 2, duration: 90, yoyo: true });
            if (pat[b] === 1) trumpet(b * 2, 0.3, 0.2);
          }
          if (t > pat.length * BEAT + 400) {
            state = 'play';
            t0 = scene.time.now;
            status.setText('answer.');
          }
          return;
        }
        pat.forEach((v, i) => {
          if (v === 1 && hits[i] === null && t > i * BEAT + WIN) hits[i] = false;
        });
        if (t > pat.length * BEAT + WIN + 80) {
          const ok = hits.every((h, i) => (pat[i] === 1 ? h === true : h !== false));
          if (ok) {
            sfx('chime');
            scene.tweens.add({ targets: spot, radius: spot.radius + 45, duration: 500 });
            spot.setAlpha(0.15 + round * 0.08);
            round += 1;
            if (round >= 3) {
              tick.remove();
              status.setText('…the room breathes. He nods, once.').setColor('#7ec87e');
              scene.time.delayedCall(1200, () => m.close(true, resolve));
            } else beginRound();
          } else {
            sfx('fail');
            status.setText(round === 0 ? 'again. (did it need that last note?)' : 'again.').setColor('#e86a6a');
            beginRound();
          }
        }
      },
    });
    m.listen((code) => {
      if (code !== 'Space' && code !== 'KeyQ') return;
      if (state !== 'play') return;
      const pat = ROUNDS[round];
      const t = scene.time.now - t0;
      let best = -1;
      let bestD = 1e9;
      pat.forEach((v, i) => {
        const d = Math.abs(t - i * BEAT);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      });
      if (bestD <= WIN && pat[best] === 1 && hits[best] === null) {
        hits[best] = true;
        trumpet(best * 2, 0.3);
      } else if (bestD <= WIN && pat[best] === 0) {
        hits[best] = false;
        trumpet(9, 0.2, 0.25);
      }
    }, resolve);
    const origClose = m.close.bind(m);
    m.close = (r, res) => {
      tick.remove(false);
      origClose(r, res);
    };
  });
}

// P3 (musician) — The Mix: six faders; the only way to 100% approval is to
// bury the trumpet. Success should feel like a defeat.
export function theMix(scene) {
  return new Promise((resolve) => {
    const cam = scene.cameras.main;
    const m = new Modal(scene, 'THE MIX', '←/→ pick a fader · ↑/↓ move it · CLIENT APPROVAL must hit 100%\n[Enter] print the mix');
    const cx = cam.width / 2;
    const cy = cam.height / 2 + 30;
    const names = ['Trumpet', 'Bass', 'Drums', 'Click', 'V.O.', 'Jingle'];
    const vals = [8, 5, 5, 5, 3, 2];
    let sel = 0;
    const gfx = m.add(scene.add.graphics().setScrollFactor(0).setDepth(m.depth + 2));
    const labels = names.map((n, i) => m.text(cx - 200 + i * 80, cy + 95, n, 11, '#8a8aa8'));
    const approvalText = m.text(cx, cy - 105, '', 16);
    const approval = () => Phaser.Math.Clamp(vals[4] * 5 + vals[5] * 5 - Math.max(0, vals[0] - 1) * 6, 0, 100);
    const draw = () => {
      gfx.clear();
      names.forEach((_, i) => {
        const x = cx - 200 + i * 80;
        gfx.fillStyle(0x2a2a34, 1);
        gfx.fillRect(x - 6, cy - 70, 12, 150);
        gfx.fillStyle(i === sel ? 0xf2d580 : 0x8a8aa8, 1);
        gfx.fillRect(x - 14, cy + 80 - vals[i] * 15 - 5, 28, 10);
      });
      const a = approval();
      approvalText.setText(`CLIENT APPROVAL: ${a}%`).setColor(a >= 100 ? '#7ec87e' : a > 60 ? '#f2d580' : '#e86a6a');
    };
    draw();
    m.listen((code) => {
      if (code === 'ArrowLeft') sel = (sel + 5) % 6;
      else if (code === 'ArrowRight') sel = (sel + 1) % 6;
      else if (code === 'ArrowUp') vals[sel] = Math.min(10, vals[sel] + 1);
      else if (code === 'ArrowDown') vals[sel] = Math.max(0, vals[sel] - 1);
      else if (code === 'Enter') {
        if (approval() >= 100) {
          sfx('chime');
          approvalText.setText("\"Perfect. Nobody'll even notice you.\"").setColor('#7ec87e');
          scene.time.delayedCall(1300, () => m.close(true, resolve));
        } else {
          sfx('fail');
        }
        return;
      } else return;
      if (sel === 0) trumpet(4, 0.15, Math.max(0.02, vals[0] / 40));
      else sfx('click');
      draw();
    }, resolve);
  });
}
