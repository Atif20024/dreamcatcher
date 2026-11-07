// The board line (round 2 WP6, critique §9 "Type" and "Motifs"): every place
// title, every dream's CAUGHT and the station's big words arrive the way the
// departure board in the hall says things — one split-flap cell per letter,
// flipping through a few letters and settling left to right, 60 ms a glyph,
// with the clack of the board and, when the line has landed, the place's
// two-note chime.
//
//   boardTitle(scene, 'FIVE-STAR DREAM', { sub: 'PLATFORM 1', place: 'chef' })
//
// It is screen text (on the UI scene): display ×1 (cap 14) in gold on dark
// cells, a brass rim, the place's accent as the rule under it.
import { uiText } from './text.js';
import { IDENTITY, PLACES, placeOf } from './theme.js';
import { chime, sfx } from '../systems/audio.js';

export const FLIP_MS = 60; // per glyph (§9)
const CELL_W = 18;
const CELL_H = 26;
const GAP = 2;
const FLAPS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

export function boardTitle(scene, text, opts = {}) {
  const place = opts.place || placeOf(scene);
  const P = PLACES[place] || PLACES.hub;
  const cam = scene.cameras.main;
  const x = opts.x ?? cam.width / 2;
  const y = opts.y ?? 112;
  const depth = opts.depth ?? 150;
  const chars = [...String(text).toUpperCase()];
  const w = chars.length * (CELL_W + GAP) - GAP;
  const c = scene.add.container(Math.round(x), Math.round(y)).setScrollFactor(0).setDepth(depth);
  c.name = opts.name || 'board-title';
  c.dcReadable = true;
  c.boardText = chars.join('');
  // the board's housing: the night fill, a brass rim, the accent rule
  const pad = 8;
  const housing = scene.add.rectangle(0, 0, w + pad * 2, CELL_H + pad * 2, IDENTITY.night, 0.92).setStrokeStyle(1, IDENTITY.brass, 1);
  const rule = scene.add.rectangle(0, CELL_H / 2 + pad - 2, w + pad * 2 - 4, 2, P.accent, 1);
  c.add([housing, rule]);
  const cells = [];
  chars.forEach((ch, i) => {
    const cx = -w / 2 + i * (CELL_W + GAP) + CELL_W / 2;
    if (ch === ' ') return;
    const back = scene.add.rectangle(cx, 0, CELL_W, CELL_H, 0x1e1b36, 1);
    const split = scene.add.rectangle(cx, 0, CELL_W, 1, IDENTITY.night, 1);
    const t = uiText(scene, cx, 1, ' ', { size: 'display', scale: 1, color: IDENTITY.gold, screen: true, backing: 0x1e1b36 }).setOrigin(0.5);
    c.add([back, t, split]);
    cells.push({ t, ch, i });
  });
  let sub = null;
  if (opts.sub) {
    sub = uiText(scene, 0, CELL_H / 2 + pad + 14, opts.sub, { size: 'small', scale: 2, color: IDENTITY.cream, align: 'center', screen: true, backing: IDENTITY.night }).setOrigin(0.5, 0);
    sub.setAlpha(0);
    c.add(sub);
  }
  // the flip: each cell runs through a few letters, then lands on its own
  const rand = (k) => FLAPS[(k * 7 + chars.length * 13) % FLAPS.length];
  let landed = 0;
  let clackAt = -1e9;
  const done = () => {
    if (sub) scene.tweens.add({ targets: sub, alpha: 1, duration: 240 });
    if (opts.chime !== false) chime(opts.event || 'board', place);
    if (opts.onLanded) opts.onLanded(c);
  };
  if (!cells.length) done();
  cells.forEach((cell, n) => {
    const flips = 3;
    for (let k = 0; k <= flips; k++) {
      scene.time.delayedCall(n * FLIP_MS + k * 45, () => {
        if (!cell.t.scene) return;
        cell.t.setText(k === flips ? cell.ch : rand(n + k));
        cell.t.setScale(1, k === flips ? 1 : 0.55);
        const now = scene.time.now;
        if (now - clackAt > 45) {
          clackAt = now;
          sfx('clack');
        }
        if (k === flips) {
          landed += 1;
          if (landed === cells.length) done();
        }
      });
    }
  });
  c.flipMs = cells.length ? (cells.length - 1) * FLIP_MS + 3 * 45 : 0;
  // hold, then fold away (persist: the caller destroys it)
  if (!opts.persist) {
    const hold = opts.hold ?? 2200;
    scene.time.delayedCall(c.flipMs + hold, () => {
      if (!c.scene) return;
      scene.tweens.add({ targets: c, alpha: 0, duration: 400, onComplete: () => c.destroy() });
    });
  }
  return c;
}
