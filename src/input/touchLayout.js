// Touch layout (phone / tablet controls): pure geometry, no Phaser, no DOM,
// so it is unit-tested (tests/touch.test.js). Everything is in game px (the
// 960 × 540 canvas); sizes are chosen in CSS px, so a button is the same
// size under the thumb on a phone and on a tablet.
//
//   touchWanted({ query, coarse, hover, maxTouchPoints })   should the controls show?
//   const L = layoutTouch({ cssW, cssH })                  where the buttons go
//   keysAt(L, x, y, { play })                               the keys one finger holds
//   pickRect(rects, x, y, slop)                             a tapped menu row
//   isPortrait(w, h)
//
// The left thumb has a d-pad (one round pad, read by angle: a thumb can roll
// from ▶ to ▲▶ without lifting), the right thumb JUMP and E with X and Q
// above them, and the pause button sits in the top-left corner (the HUD's
// left column moves over for it: hudInsets in src/ui/hud.js).

export const GAME_W = 960;
export const GAME_H = 540;

// what each control presses (KeyboardEvent.code: the keys the game reads)
export const TOUCH_KEYS = Object.freeze({
  left: 'ArrowLeft',
  right: 'ArrowRight',
  up: 'ArrowUp',
  down: 'ArrowDown',
  jump: 'Space',
  interact: 'KeyE',
  action: 'KeyX',
  alt: 'KeyQ',
  pause: 'Escape',
});

// ?touch=1 forces the controls on (desktop testing), ?touch=0 off. Otherwise
// a coarse primary pointer, or a touch screen with no hovering pointer (a
// laptop with a touch screen keeps its keyboard and looks as it always did).
export function touchWanted({ query = '', coarse = false, hover = true, maxTouchPoints = 0 } = {}) {
  const q = new URLSearchParams(query);
  if (q.get('touch') === '1') return true;
  if (q.get('touch') === '0') return false;
  return !!coarse || (maxTouchPoints > 0 && !hover);
}

export const isPortrait = (w, h) => h > w;

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// the button size in CSS px: about a sixth of the screen's height, 52–64 px
// (a short phone in landscape is ~320 px tall, a tablet 700+)
export function buttonCss(cssH) {
  return clamp(Math.round(cssH * 0.16), 52, 64);
}

export function layoutTouch({ cssW = GAME_W, cssH = GAME_H, W = GAME_W, H = GAME_H } = {}) {
  const k = W / Math.max(1, cssW); // game px per CSS px (FIT keeps the aspect)
  const b = buttonCss(cssH) * k; // one button's diameter, game px
  const m = Math.round(clamp(14 * k, 10, 28)); // the margin to the screen edge
  const g = Math.round(8 * k); // the gap between buttons
  // the d-pad: four arms at d from the centre, one plate each
  const d = Math.round(b * 0.86);
  const r = Math.round(b / 2);
  const pad = { id: 'pad', cx: m + d + r, cy: H - m - d - r, d, r, dead: Math.round(b * 0.22), reach: d + Math.round(r * 1.5) };
  pad.arms = [
    { id: 'left', x: pad.cx - d, y: pad.cy },
    { id: 'right', x: pad.cx + d, y: pad.cy },
    { id: 'up', x: pad.cx, y: pad.cy - d },
    { id: 'down', x: pad.cx, y: pad.cy + d },
  ];
  // the right thumb: JUMP in the corner, E beside it, X over JUMP, Q over E
  const rj = Math.round(b * 0.58);
  const re = r;
  const rs = Math.round(b * 0.42);
  const jump = { id: 'jump', x: W - m - rj, y: H - m - rj, r: rj, label: 'JUMP' };
  const interact = { id: 'interact', x: jump.x - rj - g - re, y: jump.y + Math.round(rj * 0.15), r: re, label: 'E' };
  const action = { id: 'action', x: jump.x, y: jump.y - rj - g - rs, r: rs, label: 'X' };
  const alt = { id: 'alt', x: interact.x, y: interact.y - re - g - rs, r: rs, label: 'Q' };
  // pause: the top-left corner (the HUD's left column steps right of it)
  const rp = Math.round(b * 0.4);
  const pause = { id: 'pause', x: m + rp, y: m + rp, r: rp, label: 'II' };
  const buttons = [jump, interact, action, alt, pause];
  // the area each cluster covers (the HUD's bottom lines sit over it)
  const leftTop = pad.cy - d - r;
  const rightTop = Math.min(action.y - rs, alt.y - rs);
  return {
    k,
    b,
    m,
    pad,
    buttons,
    clusters: {
      left: { x: 0, y: leftTop, w: pad.cx + d + r + m, h: H - leftTop },
      right: { x: interact.x - re - m, y: rightTop, w: W - (interact.x - re - m), h: H - rightTop },
    },
    // the HUD: the left column starts right of pause; the bottom-left line
    // (the satchel) sits over the d-pad; the footer's key hints go
    insets: { left: pause.x + rp + m - 16, contextBottom: Math.round(leftTop - 8), footer: false },
  };
}

// the pad by angle: right inside ±60° of east, up inside 40–140°, so a
// thumb running east can drift a little without pressing up (Up is a jump
// in most dreams), and the diagonals give both
export function padDirections(pad, x, y) {
  const dx = x - pad.cx;
  const dy = y - pad.cy;
  const dist = Math.hypot(dx, dy);
  if (dist > pad.reach || dist < pad.dead) return [];
  const ang = (Math.atan2(-dy, dx) * 180) / Math.PI; // east 0, north 90
  const out = [];
  if (Math.abs(ang) < 60) out.push('right');
  if (Math.abs(ang) > 120) out.push('left');
  if (ang > 40 && ang < 140) out.push('up');
  if (ang < -40 && ang > -140) out.push('down');
  return out;
}

// the controls one finger at (x, y) holds. `play` false: only pause (a
// dialogue, a card or a menu is on screen and taps answer it instead).
// A button's hit circle is 1.3× its plate; overlapping circles go to the
// nearest centre.
export function controlsAt(L, x, y, { play = true } = {}) {
  if (play) {
    const dirs = padDirections(L.pad, x, y);
    if (dirs.length) return dirs;
  }
  let best = null;
  let bestD = Infinity;
  for (const btn of L.buttons) {
    if (!play && btn.id !== 'pause') continue;
    const dd = Math.hypot(x - btn.x, y - btn.y);
    if (dd <= btn.r * 1.3 && dd < bestD) {
      best = btn.id;
      bestD = dd;
    }
  }
  return best ? [best] : [];
}

export const keysAt = (L, x, y, opts) => controlsAt(L, x, y, opts).map((id) => TOUCH_KEYS[id]);

// a tapped menu row: the rect under the finger, else the nearest one within
// `slop` px (menu rows are 18–26 px apart: smaller than a fingertip)
export function pickRect(rects, x, y, slop = 24) {
  let best = -1;
  let bestD = Infinity;
  rects.forEach((r, i) => {
    if (!r) return;
    const dx = x < r.x ? r.x - x : x > r.x + r.w ? x - (r.x + r.w) : 0;
    const dy = y < r.y ? r.y - y : y > r.y + r.h ? y - (r.y + r.h) : 0;
    const dd = Math.hypot(dx, dy);
    // inside two rects (padded rows): the one whose centre is nearer
    const tie = dd === 0 ? Math.hypot(x - (r.x + r.w / 2), y - (r.y + r.h / 2)) / 1e4 : 0;
    if (dd <= slop && dd + tie < bestD) {
      best = i;
      bestD = dd + tie;
    }
  });
  return best;
}

// client (CSS) coordinates → game px over the canvas's on-screen rect
export function toGame(rect, clientX, clientY, W = GAME_W, H = GAME_H) {
  return { x: ((clientX - rect.left) / rect.width) * W, y: ((clientY - rect.top) / rect.height) * H };
}
