import Phaser from 'phaser';
import { Modal } from './puzzles.js';
import { sfx } from './audio.js';
import { FLASHCARDS, BOARD_QUESTIONS } from '../data/astronautData.js';

// THE QUIET ABOVE — the four puzzle-boxes. Each resolves a result object.

const shuffle = (rand, arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = rand.between(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// ---------------------------------------------------------------------------
// P1 "Systems" — the study flashcards. Ten cards, pick 1-4. Resolves the
// number answered correctly first try.
// ---------------------------------------------------------------------------
export function systemsCards(scene) {
  return new Promise((resolve) => {
    const cam = scene.cameras.main;
    const m = new Modal(scene, 'SYSTEMS — FLASHCARDS', "Priya's cards. [1–4] answer · they are all in the notebook");
    const rand = new Phaser.Math.RandomDataGenerator(['study']);
    const cx = cam.width / 2;
    const cy = cam.height / 2;
    let i = 0;
    let right = 0;
    const qText = m.text(cx, cy - 60, '', 18, '#e8dcc8');
    const opts = [0, 1, 2, 3].map((k) => m.text(cx, cy - 8 + k * 30, '', 14));
    const score = m.text(cx, cy + 140, '', 13, '#8a8aa8');
    let order = [];
    const show = () => {
      const [q, a, ...wrong] = FLASHCARDS[i];
      order = shuffle(rand, [a, ...wrong]);
      qText.setText(`${i + 1}/10 — ${q}`);
      order.forEach((o, k) => opts[k].setText(`[${k + 1}]  ${o}`).setColor('#e8dcc8'));
      score.setText(`${right} right`);
    };
    show();
    m.listen((code) => {
      const k = ['Digit1', 'Digit2', 'Digit3', 'Digit4'].indexOf(code);
      if (k < 0 || k >= order.length) return;
      const correct = order[k] === FLASHCARDS[i][1];
      if (correct) {
        right += 1;
        sfx('chime');
      } else {
        sfx('fail');
        opts[k].setColor('#e86a6a');
      }
      scene.time.delayedCall(correct ? 120 : 500, () => {
        i += 1;
        if (i >= FLASHCARDS.length) m.close(right, resolve);
        else show();
      });
    }, resolve);
  });
}

// ---------------------------------------------------------------------------
// P2 "Selection" — the Board. Seven questions, three strikes. The first
// attempt also fails on stats < minStat (the letter). Resolves
// { passed, strikes } — the stat gate is the scene's business.
// ---------------------------------------------------------------------------
export function selectionBoard(scene, { attempt = 1 } = {}) {
  return new Promise((resolve) => {
    const cam = scene.cameras.main;
    const m = new Modal(
      scene,
      'THE SELECTION BOARD',
      attempt === 1 ? 'Three silhouettes. Seven questions. Three wrong and the light goes red.' : 'The same room. The same chairs. You know more now.'
    );
    const rand = new Phaser.Math.RandomDataGenerator(['board', String(attempt)]);
    const cx = cam.width / 2;
    const cy = cam.height / 2;
    // the three silhouettes
    [-140, 0, 140].forEach((dx) => {
      m.add(scene.add.circle(cx + dx, cy - 104, 14, 0x0c0c12).setScrollFactor(0).setDepth(m.depth + 1));
      m.add(scene.add.rectangle(cx + dx, cy - 76, 52, 26, 0x0c0c12).setScrollFactor(0).setDepth(m.depth + 1));
    });
    const light = m.add(scene.add.circle(cx + 250, cy - 150, 8, 0x50c878).setScrollFactor(0).setDepth(m.depth + 1));
    let i = 0;
    let strikes = 0;
    const qText = m.text(cx, cy - 40, '', 16, '#e8dcc8');
    const opts = [0, 1, 2, 3].map((k) => m.text(cx, cy + 10 + k * 28, '', 13));
    const strikeText = m.text(cx, cy + 150, '', 13, '#e86a6a');
    let order = [];
    const show = () => {
      const q = BOARD_QUESTIONS[i];
      order = shuffle(rand, [q.a, ...q.o]);
      qText.setText(`${i + 1}/7 — ${q.q}`);
      opts.forEach((o, k) => o.setText(`[${k + 1}]  ${order[k]}`).setColor('#e8dcc8'));
      strikeText.setText('✕ '.repeat(strikes));
    };
    show();
    m.listen((code) => {
      const k = ['Digit1', 'Digit2', 'Digit3', 'Digit4'].indexOf(code);
      if (k < 0) return;
      const q = BOARD_QUESTIONS[i];
      if (order[k] === q.a) {
        sfx('chime');
        i += 1;
        if (i >= BOARD_QUESTIONS.length) m.close({ passed: true, strikes }, resolve);
        else show();
      } else {
        strikes += 1;
        sfx('fail');
        light.setFillStyle(0xe83a2a);
        scene.time.delayedCall(250, () => light.setFillStyle(0x50c878));
        strikeText.setText('✕ '.repeat(strikes));
        qText.setText(`${i + 1}/7 — ${q.q}\n\n(it was ${q.src})`);
        if (strikes >= 3) scene.time.delayedCall(900, () => m.close({ passed: false, strikes }, resolve));
      }
    }, resolve);
  });
}

// ---------------------------------------------------------------------------
// P3 "Docking" — a momentum crosshair. Six thrusters = arrows and W/S for
// closing rate. No braking except the opposite press. Fuel is finite.
// Resolves true on a clean dock.
// ---------------------------------------------------------------------------
export function docking(scene, { label = 'DOCKING SIMULATOR', fuel = 30 } = {}) {
  return new Promise((resolve) => {
    const cam = scene.cameras.main;
    const m = new Modal(scene, label, 'arrows: translate · W/S: close/brake · each press ADDS velocity\ncentre the cross, closing slow, before the fuel runs out');
    const cx = cam.width / 2;
    const cy = cam.height / 2 + 20;
    m.add(scene.add.circle(cx, cy, 60, 0x1e2a3c).setScrollFactor(0).setDepth(m.depth + 1).setStrokeStyle(2, 0x88b8d8));
    m.add(scene.add.circle(cx, cy, 24, 0x2a3a52).setScrollFactor(0).setDepth(m.depth + 1).setStrokeStyle(1, 0xf2d580));
    const cross = m.add(scene.add.text(cx, cy, '+', { fontFamily: 'monospace', fontSize: '26px', color: '#f2d580' }).setOrigin(0.5).setScrollFactor(0).setDepth(m.depth + 3));
    const fuelText = m.text(cx, cy + 130, '', 14, '#e8a030');
    const rangeText = m.text(cx, cy - 130, '', 14, '#88b8d8');
    const state = { x: 160, y: -90, vx: 0, vy: 0, range: 40, vr: 0, fuel };
    const IMP = 14;
    let done = false;
    const tick = scene.time.addEvent({
      delay: 50,
      loop: true,
      callback: () => {
        if (done) return;
        state.x += state.vx * 0.05;
        state.y += state.vy * 0.05;
        state.range = Math.max(0, state.range + state.vr * 0.05);
        cross.setPosition(cx + state.x, cy + state.y);
        const sc = 0.6 + Math.max(0, (40 - state.range) / 40) * 1.4;
        cross.setScale(sc);
        fuelText.setText(`FUEL ${'▮'.repeat(Math.max(0, Math.ceil(state.fuel)))}`);
        rangeText.setText(`RANGE ${state.range.toFixed(1)} m   CLOSING ${(-state.vr).toFixed(1)} m/s`);
        if (state.range <= 0) {
          done = true;
          tick.remove();
          const centred = Math.abs(state.x) < 24 && Math.abs(state.y) < 24;
          const gentle = -state.vr < 3.2;
          if (centred && gentle) {
            sfx('chime');
            m.text(cx, cy - 160, 'CAPTURE. soft dock.', 16, '#7ec87e');
            scene.time.delayedCall(900, () => m.close(true, resolve));
          } else {
            sfx('clang');
            m.text(cx, cy - 160, centred ? 'too fast. wave-off.' : 'off centre. wave-off.', 16, '#e86a6a');
            scene.time.delayedCall(1100, () => m.close(false, resolve));
          }
        } else if (state.fuel <= 0) {
          done = true;
          tick.remove();
          m.text(cx, cy - 160, 'fuel out. drifting.', 16, '#e86a6a');
          scene.time.delayedCall(1100, () => m.close(false, resolve));
        }
      },
    });
    m.objs.push({ destroy: () => tick.remove() });
    m.listen((code) => {
      if (done || state.fuel <= 0) return;
      const burn = () => (state.fuel -= 1, sfx('click'));
      if (code === 'ArrowLeft') (state.vx -= IMP), burn();
      else if (code === 'ArrowRight') (state.vx += IMP), burn();
      else if (code === 'ArrowUp') (state.vy -= IMP), burn();
      else if (code === 'ArrowDown') (state.vy += IMP), burn();
      else if (code === 'KeyW') (state.vr -= 1.6), burn();
      else if (code === 'KeyS') (state.vr += 1.6), burn();
    }, resolve);
  });
}

// ---------------------------------------------------------------------------
// P4 "Hinge" — six bolts, one right order (printed on the code plate and in
// the notebook). A wrong bolt floats off once and can be caught again.
// Resolves true when all six are out.
// ---------------------------------------------------------------------------
export const BOLT_ORDER = [3, 1, 5, 2, 6, 4];

export function hinge(scene) {
  return new Promise((resolve) => {
    const cam = scene.cameras.main;
    const m = new Modal(scene, 'THE HINGE', `six bolts, one order. the code plate reads ${BOLT_ORDER.join(' ')}.\n[1–6] torque a bolt — a wrong bolt floats away`);
    const cx = cam.width / 2;
    const cy = cam.height / 2 + 10;
    const bolts = BOLT_ORDER.map((_, i) => {
      const bx = cx - 125 + (i % 3) * 125;
      const by = cy - 30 + Math.floor(i / 3) * 80;
      const c = m.add(scene.add.circle(bx, by, 16, 0x6a6e7a).setScrollFactor(0).setDepth(m.depth + 1).setStrokeStyle(2, 0xb8bcc8));
      const t = m.text(bx, by, String(i + 1), 14, '#14101c');
      return { c, t, out: false, bx, by };
    });
    const status = m.text(cx, cy + 130, 'next: ?', 14, '#88b8d8');
    let step = 0;
    let floating = null;
    m.listen((code) => {
      const k = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6'].indexOf(code);
      if (k < 0) return;
      const b = bolts[k];
      if (floating) {
        // any key catches the floating bolt back
        sfx('pickup');
        scene.tweens.add({ targets: [floating.c, floating.t], x: `-=${floating.dx}`, y: `+=${60}`, alpha: 1, duration: 300 });
        floating = null;
        status.setText('caught it. breathe.');
        return;
      }
      if (b.out) return;
      if (k + 1 === BOLT_ORDER[step]) {
        b.out = true;
        step += 1;
        sfx('chime');
        b.c.setFillStyle(0x2e6a4a);
        scene.tweens.add({ targets: [b.c, b.t], angle: 360, duration: 300 });
        status.setText(`${step}/6`);
        if (step >= 6) {
          m.text(cx, cy - 120, 'the hinge gives. the array is free.', 15, '#7ec87e');
          scene.time.delayedCall(900, () => m.close(true, resolve));
        }
      } else {
        sfx('fail');
        const dx = 40 + Math.random() * 60;
        floating = { ...b, dx };
        bolts[k] = floating;
        scene.tweens.add({ targets: [b.c, b.t], x: `+=${dx}`, y: '-=60', alpha: 0.5, duration: 500 });
        status.setText('a bolt floats off — press anything to catch it');
      }
    }, resolve);
  });
}
