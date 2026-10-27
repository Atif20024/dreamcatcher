// Dev harness: window.__dc. Loaded only when import.meta.env.DEV (see main.js).
// Deterministic fixed-step stepping that works with the Browser pane hidden:
// the rAF loop is put to sleep and game.step(t, dt) is driven from a synthetic
// clock. Keys are real KeyboardEvents on window (keyCode defined), so Phaser's
// KeyboardPlugin and the modal `e.code` handlers both see them.
import { DREAM_WARP } from './warp.js';

const KEYCODES = {
  left: ['ArrowLeft', 37], right: ['ArrowRight', 39], up: ['ArrowUp', 38], down: ['ArrowDown', 40],
  jump: ['Space', 32], interact: ['KeyE', 69], action: ['KeyX', 88], shove: ['KeyX', 88],
  trumpet: ['KeyQ', 81], tether: ['KeyF', 70], esc: ['Escape', 27], enter: ['Enter', 13],
  ArrowLeft: 37, ArrowRight: 39, ArrowUp: 38, ArrowDown: 40, Space: 32, Enter: 13, Escape: 27, Tab: 9,
};
const codeInfo = (a) => {
  const v = KEYCODES[a];
  if (Array.isArray(v)) return { code: v[0], keyCode: v[1] };
  if (typeof v === 'number') return { code: a, keyCode: v };
  if (/^Key[A-Z]$/.test(a)) return { code: a, keyCode: a.charCodeAt(3) };
  if (/^Digit[0-9]$/.test(a)) return { code: a, keyCode: a.charCodeAt(5) };
  throw new Error(`__dc: unknown action/code "${a}"`);
};

const game = () => window.game;
let clock = 0;
const held = new Map();

function key(type, a) {
  const { code, keyCode } = codeInfo(a);
  const ev = new KeyboardEvent(type, { code, key: code, bubbles: true, cancelable: true });
  Object.defineProperty(ev, 'keyCode', { value: keyCode });
  Object.defineProperty(ev, 'which', { value: keyCode });
  window.dispatchEvent(ev);
}

const dc = {
  // stop the rAF loop (idempotent); step() calls this itself
  pause() {
    const g = game();
    if (!g.loop.running && clock) return;
    g.loop.sleep();
    if (!clock) clock = g.loop.now || performance.now();
  },
  resume() {
    clock = 0;
    game().loop.wake();
  },
  step(n = 1, dtMs = 16.67) {
    dc.pause();
    const g = game();
    for (let i = 0; i < n; i++) {
      clock += dtMs;
      g.step(clock, dtMs);
    }
    return clock;
  },
  hold(a) {
    if (held.has(a)) return;
    held.set(a, true);
    key('keydown', a);
  },
  release(a) {
    held.delete(a);
    key('keyup', a);
  },
  releaseAll() {
    [...held.keys()].forEach((a) => dc.release(a));
  },
  // down, step `frames`, up, then one more step so the keyup is processed
  press(a, frames = 4) {
    key('keydown', a);
    dc.step(Math.max(1, frames));
    key('keyup', a);
    dc.step(1);
  },
  scene() {
    const s = game().scene.getScenes(true).filter((x) => x.sys.settings.key !== 'UI');
    return s[0] || null;
  },
  state() {
    const s = dc.scene();
    if (!s) return { scene: null };
    const p = s.player;
    const modals = [];
    for (const k of ['puzzleActive', 'cardActive', 'dialogActive', 'tutorialActive', 'paused']) if (s[k]) modals.push(k);
    return {
      scene: s.sys.settings.key,
      t: Math.round(clock),
      player: p ? { x: Math.round(p.x), y: Math.round(p.y), vx: Math.round(p.body ? p.body.velocity.x : 0), vy: Math.round(p.body ? p.body.velocity.y : 0) } : null,
      hearts: s.lives === undefined ? null : s.lives,
      maxHearts: s.maxLives === undefined ? null : s.maxLives,
      room: (s._room && s._room.id) || null,
      objective: s.objectiveText ? s.objectiveText.text : null,
      modals,
      held: [...held.keys()],
    };
  },
  // PNG data URL of the canvas (rendered by one extra step so it is current)
  snap() {
    return new Promise((resolve) => {
      game().renderer.snapshot((img) => resolve(img.src));
      dc.step(1);
    });
  },
  // in-session warp: same effect as loading ?warp=<dream>:<place>
  warp(dream, place) {
    const d = DREAM_WARP[dream];
    if (!d) throw new Error(`__dc.warp: unknown dream "${dream}"`);
    dc.releaseAll();
    const url = new URL(window.location.href);
    ['at', 'wr', 'pt', 'gm', 'ev', 'warp'].forEach((k) => url.searchParams.delete(k));
    if (d.param) url.searchParams.set(d.param, place || d.fallback);
    window.history.replaceState(null, '', url);
    const g = game();
    g.scene.getScenes(true).forEach((s) => g.scene.stop(s.sys.settings.key));
    g.scene.start(d.scene);
    dc.step(2);
    return dc.state();
  },
  async runScenarios(only) {
    const { SCENARIOS } = await import('./scenarios/index.js');
    const out = [];
    for (const sc of SCENARIOS) {
      if (only && sc.id !== only) continue;
      let r;
      try {
        r = await sc.run(dc);
      } catch (e) {
        r = { pass: false, detail: `threw: ${e.message}` };
      }
      dc.releaseAll();
      out.push({ id: sc.id, expect: sc.expect, pass: !!r.pass, detail: r.detail });
    }
    return { passed: out.filter((o) => o.pass).length, failed: out.filter((o) => !o.pass).length, results: out };
  },
};

window.__dc = dc;

// ?scenarios=1 runs every scenario on load; the JSON lands in window.__dcResults
if (new URLSearchParams(window.location.search).has('scenarios')) {
  const go = async () => {
    window.__dcResults = await dc.runScenarios();
    console.log('[dc:scenarios]', JSON.stringify(window.__dcResults));
  };
  setTimeout(go, 500);
}
