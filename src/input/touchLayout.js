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
  // the d-pad: four arms at d from the centre, one plate each. On a short
  // phone (under 420 CSS px tall) the pad is a size smaller, so it does not
  // sit over Jo near the left of the screen (never under 44 CSS px an arm)
  const pb = cssH < 420 ? Math.max(44 * k, b * 0.82) : b;
  const d = Math.round(pb * 0.86);
  const r = Math.round(pb / 2);
  const pad = { id: 'pad', cx: m + d + r, cy: H - m - d - r, d, r, dead: Math.round(pb * 0.22), reach: d + Math.round(r * 1.5) };
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
    g,
    rs,
    pad,
    buttons,
    context: [],
    clusters: {
      left: { x: 0, y: leftTop, w: pad.cx + d + r + m, h: H - leftTop },
      right: { x: interact.x - re - m, y: rightTop, w: W - (interact.x - re - m), h: H - rightTop },
    },
    // the HUD: the left column starts right of pause; the bottom-left line
    // (the satchel) sits over the d-pad; the footer's key hints go
    insets: { left: pause.x + rp + m - 16, contextBottom: Math.round(leftTop - 8), footer: false },
  };
}

// Driving (RaceScene, scene.touchProfile = 'race'): no d-pad. The right thumb has
// the pedals, a tall GAS at the edge and BRAKE beside it, so it rolls from one to
// the other without lifting; the left thumb has a wide steering slab, two halves
// with a dead strip between them: a thumb slides across and changes hands without
// lifting. The same keys as the keyboard: Up is the gas, Down the brake.
export function layoutRace(opts = {}) {
  const L = layoutTouch(opts);
  const { W = GAME_W, H = GAME_H } = opts;
  const { b, m, g } = L;
  const pw = Math.round(b * 1.2);
  const ph = Math.round(b * 2.2);
  const py = H - m - ph / 2;
  const gas = { id: 'up', shape: 'pedal', x: W - m - pw / 2, y: py, r: pw / 2, w: pw, h: ph, label: 'GAS' };
  const brake = { id: 'down', shape: 'pedal', x: gas.x - pw - g, y: py + Math.round(ph * 0.1), r: pw / 2, w: pw, h: Math.round(ph * 0.8), label: 'BRAKE' };
  const dead = 12;
  const sw = Math.round(b * 1.8); // one half of the slab
  const sh = Math.round(b * 1.6);
  const sy = H - m - sh / 2;
  const left = { id: 'left', shape: 'pedal', slab: true, x: m + sw / 2, y: sy, r: sw / 2, w: sw, h: sh, label: '', arrow: 'left' };
  const right = { id: 'right', shape: 'pedal', slab: true, x: m + sw + dead + sw / 2, y: sy, r: sw / 2, w: sw, h: sh, label: '', arrow: 'right' };
  const slab = { mid: m + sw + dead / 2, dead, x1: right.x + sw / 2, top: sy - sh / 2 };
  const pause = L.buttons.find((x) => x.id === 'pause');
  return {
    ...L,
    pad: null,
    slab,
    buttons: [gas, brake, left, right, pause],
    clusters: {
      left: { x: 0, y: slab.top, w: slab.x1 + m, h: H - slab.top },
      right: { x: brake.x - pw / 2 - m, y: gas.y - ph / 2, w: W - (brake.x - pw / 2 - m), h: H - (gas.y - ph / 2) },
    },
  };
}

// a thumb on the slab, with room to wander: it reads by which side of the dead strip
// it is on, so sliding off the plate's edge does not let go of the wheel
function slabAt(L, x, y) {
  const S = L.slab;
  const slop = L.b * 0.6;
  if (x > S.x1 + slop || y < S.top - slop) return null;
  if (Math.abs(x - S.mid) <= S.dead / 2) return [];
  return [x < S.mid ? 'left' : 'right'];
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
  if (play && L.pad) {
    const dirs = padDirections(L.pad, x, y);
    if (dirs.length) return dirs;
  }
  if (play && L.slab) {
    const side = slabAt(L, x, y);
    if (side) return side;
  }
  let best = null;
  let bestD = Infinity;
  for (const btn of [...L.buttons, ...(L.context || [])]) {
    if (btn.slab || (!play && btn.id !== 'pause')) continue;
    // a pedal is a tall plate: its hit area is its own rectangle, a little large
    if (btn.w && Math.abs(x - btn.x) <= btn.w * 0.56 && Math.abs(y - btn.y) <= btn.h * 0.56) {
      const dp = Math.abs(x - btn.x);
      if (dp < bestD) {
        best = btn.id;
        bestD = dp;
      }
      continue;
    }
    if (btn.w) continue;
    const dd = Math.hypot(x - btn.x, y - btn.y);
    if (dd <= btn.r * 1.3 && dd < bestD) {
      best = btn.id;
      bestD = dd;
    }
  }
  return best ? [best] : [];
}

export const keysAt = (L, x, y, opts) => controlsAt(L, x, y, opts).map(keyOf);

// ---- context buttons ---------------------------------------------------------
// Keys the pad and the four buttons do not cover (F, C, V, 1–6, R, L, Y, N,
// Tab, Enter …) get a small button only while the scene in front uses them:
// the scene says so (scene.touchKeys(), a modal's spec.touchKeys), or a
// puzzle panel's own instructions name them ("[1–4] answer", "[Enter] spin").
// A context button's id is `ctx:<code>`; the soft keyboard's is ctx:Keyboard.

// what a context button presses: the KeyboardEvent.code after `ctx:`
export const keyOf = (id) => TOUCH_KEYS[id] || (id.startsWith('ctx:') ? id.slice(4) : id);

const ON_PAD = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', 'KeyE', 'KeyX', 'KeyQ', 'Escape']);
const LABELS = { Enter: 'OK', Tab: 'TAB', Backspace: 'DEL', Keyboard: 'ABC' };
export const contextLabel = (code) => LABELS[code] || code.replace(/^(Key|Digit)/, '');

// one bracketed hint token → codes: [F] [Tab] [Enter] [1] [1–4] [1-3]
function tokenCodes(tok) {
  const t = tok.trim();
  const range = t.match(/^([1-9])\s*[–-]\s*([1-9])$/);
  if (range) {
    const out = [];
    for (let i = Number(range[1]); i <= Number(range[2]); i++) out.push(`Digit${i}`);
    return out;
  }
  if (/^[1-9]$/.test(t)) return [`Digit${t}`];
  if (/^[A-Za-z]$/.test(t)) return [`Key${t.toUpperCase()}`];
  const word = { tab: 'Tab', enter: 'Enter', return: 'Enter', backspace: 'Backspace' }[t.toLowerCase()];
  return word ? [word] : [];
}

// the keys a line of instructions names that the pad does not have
export function keysFromHint(text = '') {
  const out = [];
  for (const m of String(text).matchAll(/\[([^\]]{1,9})\]/g)) for (const c of tokenCodes(m[1])) if (!ON_PAD.has(c) && !out.includes(c)) out.push(c);
  return out;
}

// where the context buttons go: rows of three over the right thumb's
// cluster, right-aligned to JUMP, rising (at most six)
export function layoutContext(L, codes = []) {
  const list = codes.filter((c) => !ON_PAD.has(c)).slice(0, 6);
  const r = L.rs;
  const top = Math.min(...L.buttons.filter((b) => b.id !== 'pause').map((b) => b.y - b.r));
  const jump = L.buttons.find((b) => b.id === 'jump');
  return list.map((code, i) => {
    const row = Math.floor(i / 3);
    const col = i % 3;
    return { id: `ctx:${code}`, code, label: contextLabel(code), r, x: Math.round(jump.x - col * (r * 2 + L.g)), y: Math.round(top - L.g - r - row * (r * 2 + L.g)) };
  });
}

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
