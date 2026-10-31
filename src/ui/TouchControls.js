// Touch controls (phones, tablets): on-screen buttons drawn on the UI scene
// in the game's own style (night plates, one brass line, the bitmap font),
// shown only on a touch device or with ?touch=1 (src/input/touchState.js).
//
// - Every button is a key: the finger presses the very key the keyboard
//   would (src/input/virtualKeys.js, the harness's mechanism), so Player,
//   the InputMap, the modals and every scene hear one input path. Fingers
//   are tracked one by one (multitouch: hold ▶ and tap JUMP); a thumb can
//   slide across the d-pad.
// - Taps answer what is on screen: the top modal's own `tap` (a menu row, a
//   choice, a page), else its confirm key (X) for a dialogue, card or
//   tutorial; with no modal, a tap zone (src/input/touchTaps.js: the title,
//   the tables at THE LAST HAND). While a dialogue, card or menu is up the
//   play buttons step aside; pause stays.
// - Portrait: a "turn your phone sideways" card, the world paused under it.
// - The first tap on a real touch device asks for fullscreen and, once in,
//   a landscape lock (both may be refused: errors are swallowed).
// - The DOM listeners sit on window in the capture phase: a touch on a
//   button never reaches Phaser (the HUD footer is a music button there).
import { layoutTouch, controlsAt, TOUCH_KEYS, toGame, isPortrait, GAME_W, GAME_H } from '../input/touchLayout.js';
import { routeZoneTap, zonesHideControls } from '../input/touchTaps.js';
import { touchState } from '../input/touchState.js';
import { dispatchKey } from '../input/virtualKeys.js';
import { setHudInsets } from './hud.js';
import { ownerScene, UI } from './ui.js';
import { uiText } from './text.js';
import { drawPanel } from './Panel.js';
import { THEME } from './theme.js';

const DEPTH = 900;
// modals under which the play buttons step aside (a tap answers them)
const HIDE_UNDER = new Set(['dialogue', 'card', 'tutorial', 'pause', 'death', 'choice']);
// modals a plain tap confirms when they have no tap of their own
const TAP_CONFIRMS = new Set(['dialogue', 'card', 'tutorial']);
const PLATE_A = 0.42;
const PLATE_ON = 0.78;
const MOUSE_AFTER_TOUCH_MS = 800;

export default class TouchControls {
  constructor(ui) {
    this.ui = ui;
    this.game = ui.game;
    this.enabled = false;
    this.fingers = new Map(); // id → { x, y, keys: [] }
    this.held = new Set(); // codes the fingers hold down now
    this.pulses = []; // { code, frames } (a tap's confirm key)
    this.taps = [];
    this.play = true;
    this.portrait = false;
    this.lastTouch = -1e9;
    this.sig = '';
    this.g = ui.add.graphics().setScrollFactor(0).setDepth(DEPTH);
    this.g.name = 'touch-controls';
    this.labels = {};
    this.card = null;
    this.onTouch = (e) => this.handleTouch(e);
    this.onMouse = (e) => this.handleMouse(e);
    this.onBlur = () => this.releaseAll();
    touchState.controls = this;
    ui.events.once('shutdown', () => this.destroy());
  }

  // ---- on / off -------------------------------------------------------------
  setEnabled(on) {
    on = !!on;
    if (on === this.enabled) return;
    this.enabled = on;
    touchState.on = on;
    const w = typeof window !== 'undefined' ? window : null;
    if (on && w) {
      for (const t of ['touchstart', 'touchmove', 'touchend', 'touchcancel']) w.addEventListener(t, this.onTouch, { capture: true, passive: false });
      for (const t of ['mousedown', 'mousemove', 'mouseup']) w.addEventListener(t, this.onMouse, { capture: true });
      w.addEventListener('blur', this.onBlur);
      // iOS pinch-zoom on the page
      w.addEventListener('gesturestart', prevent, { passive: false });
    } else if (w) {
      for (const t of ['touchstart', 'touchmove', 'touchend', 'touchcancel']) w.removeEventListener(t, this.onTouch, { capture: true });
      for (const t of ['mousedown', 'mousemove', 'mouseup']) w.removeEventListener(t, this.onMouse, { capture: true });
      w.removeEventListener('blur', this.onBlur);
      w.removeEventListener('gesturestart', prevent);
    }
    if (!on) {
      this.releaseAll();
      this.setPortrait(false);
      setHudInsets();
      this.g.clear().setVisible(false);
      Object.values(this.labels).forEach((t) => t.setVisible(false));
    } else {
      this.g.setVisible(true);
      this.sig = '';
      this.layout = null;
    }
  }

  destroy() {
    this.setEnabled(false);
    Object.values(this.labels).forEach((t) => t.destroy());
    this.labels = {};
    if (touchState.controls === this) touchState.controls = null;
  }

  // ---- the DOM side ---------------------------------------------------------
  rect() {
    const c = this.game.canvas;
    const r = c && c.getBoundingClientRect ? c.getBoundingClientRect() : null;
    // (a hidden page lays the canvas out at 0 × 0: read it at 1:1)
    if (!r || !r.width || !r.height) return { left: r ? r.left : 0, top: r ? r.top : 0, width: GAME_W, height: GAME_H };
    return r;
  }

  ensureLayout() {
    const r = this.rect();
    const key = `${Math.round(r.width)}x${Math.round(r.height)}`;
    if (!this.layout || this.layoutKey !== key) {
      this.layoutKey = key;
      this.layout = layoutTouch({ cssW: r.width || GAME_W, cssH: r.height || GAME_H });
      this.sig = '';
      setHudInsets(this.layout.insets);
    }
    return this.layout;
  }

  // a finger down / moved / up: what does it hold now?
  finger(id, type, clientX, clientY) {
    const L = this.ensureLayout();
    const p = toGame(this.rect(), clientX, clientY);
    if (type === 'end') {
      const had = this.fingers.get(id);
      this.fingers.delete(id);
      this.sync();
      return !!(had && had.onControl);
    }
    const keys = this.portrait ? [] : controlsAt(L, p.x, p.y, { play: this.play }).map((c) => TOUCH_KEYS[c]);
    const prev = this.fingers.get(id);
    const onControl = (prev && prev.onControl) || (type === 'start' && keys.length > 0);
    this.fingers.set(id, { x: p.x, y: p.y, keys, onControl });
    // a finger landing off the buttons is a tap on the screen
    if (type === 'start' && !keys.length && !this.portrait) this.taps.push(p);
    this.sync();
    return onControl;
  }

  handleTouch(e) {
    if (!this.enabled) return;
    this.lastTouch = now();
    const type = e.type === 'touchstart' ? 'start' : e.type === 'touchmove' ? 'move' : 'end';
    let control = false;
    for (const t of e.changedTouches || []) control = this.finger(`t${t.identifier}`, type, t.clientX, t.clientY) || control;
    // no scroll, no zoom, no long-press menu on the game
    if (e.cancelable) e.preventDefault();
    if (control) e.stopPropagation();
    if (type === 'end') this.firstTap();
  }

  // the mouse stands in for a finger (?touch=1 on a desktop); the mouse
  // events a browser makes up after a touch are ignored
  handleMouse(e) {
    if (!this.enabled || now() - this.lastTouch < MOUSE_AFTER_TOUCH_MS) return;
    if (e.type === 'mousedown' && e.button !== 0) return;
    if (e.type === 'mousemove' && !this.fingers.has('mouse')) return;
    const type = e.type === 'mousedown' ? 'start' : e.type === 'mousemove' ? 'move' : 'end';
    if (type === 'end' && !this.fingers.has('mouse')) return;
    if (this.finger('mouse', type, e.clientX, e.clientY)) e.stopPropagation();
  }

  // the first tap on a phone: fullscreen, then (once in) landscape
  firstTap() {
    if (this.fsTried || touchState.forced) return;
    this.fsTried = true;
    const scale = this.game.scale;
    try {
      if (scale && !scale.isFullscreen && scale.fullscreen && scale.fullscreen.available) {
        scale.once('enterfullscreen', () => lockLandscape());
        scale.startFullscreen();
      } else lockLandscape();
    } catch {
      /* refused: play on in the browser */
    }
  }

  // the keys every finger holds, against the keys held down now
  sync() {
    const want = new Set();
    for (const f of this.fingers.values()) for (const k of f.keys) want.add(k);
    for (const k of [...this.held]) {
      if (!want.has(k)) {
        this.held.delete(k);
        dispatchKey('keyup', k);
      }
    }
    for (const k of want) {
      if (!this.held.has(k)) {
        this.held.add(k);
        dispatchKey('keydown', k);
      }
    }
  }

  releaseAll() {
    this.fingers.clear();
    this.sync();
    for (const p of this.pulses) dispatchKey('keyup', p.code);
    this.pulses = [];
  }

  // a confirm key pressed for a few frames (a tap on a card)
  pulse(code, frames = 3) {
    if (this.held.has(code) || this.pulses.some((p) => p.code === code)) return;
    dispatchKey('keydown', code);
    this.pulses.push({ code, frames });
  }

  // ---- taps -------------------------------------------------------------------
  tap(x, y) {
    const owner = ownerScene(this.game);
    if (!owner) return 'none';
    const mm = owner.modals;
    if (mm && !mm.dead && mm.active) {
      const r = mm.tapTop(x, y);
      if (r === 'default' && TAP_CONFIRMS.has(mm.top.kind)) this.pulse('KeyX');
      return r;
    }
    return routeZoneTap(owner, x, y) ? 'zone' : 'none';
  }

  // the play buttons step aside under a dialogue, card or menu
  wantPlay(owner) {
    if (!owner) return false;
    const mm = owner.modals;
    if (mm && !mm.dead && mm.active && HIDE_UNDER.has(mm.top.kind)) return false;
    return !zonesHideControls(owner);
  }

  // ---- every frame (UIScene.update) ------------------------------------------
  update() {
    if (!this.enabled) return;
    this.ensureLayout();
    const w = typeof window !== 'undefined' ? window : null;
    this.setPortrait(!!w && isPortrait(w.innerWidth, w.innerHeight));
    for (const p of this.pulses) p.frames -= 1;
    for (const p of this.pulses.filter((q) => q.frames <= 0)) dispatchKey('keyup', p.code);
    this.pulses = this.pulses.filter((p) => p.frames > 0);
    const taps = this.taps;
    this.taps = [];
    for (const t of taps) this.tap(t.x, t.y);
    const owner = ownerScene(this.game);
    const play = !this.portrait && this.wantPlay(owner);
    if (play !== this.play) {
      this.play = play;
      // a hidden button lets go of its key
      for (const f of this.fingers.values()) f.keys = f.keys.filter((k) => k === TOUCH_KEYS.pause || play);
      this.sync();
    }
    this.draw();
  }

  // ---- drawing ------------------------------------------------------------------
  label(id, text, x, y, size) {
    let t = this.labels[id];
    if (!t) {
      t = uiText(this.ui, 0, 0, text, { size, scale: 2, screen: true, plate: false, color: 'ink', align: 'center' }).setOrigin(0.5).setScrollFactor(0).setDepth(DEPTH + 1);
      t.name = `touch-${id}`;
      this.labels[id] = t;
    }
    return t.setPosition(Math.round(x), Math.round(y));
  }

  draw() {
    const L = this.layout;
    const sig = `${this.layoutKey}|${this.play}|${this.portrait}|${[...this.held].sort().join(',')}`;
    if (sig === this.sig) return;
    this.sig = sig;
    const g = this.g.clear();
    const on = (id) => this.held.has(TOUCH_KEYS[id]);
    const show = !this.portrait;
    const plate = (x, y, r, lit) => {
      g.fillStyle(THEME.panel, lit ? PLATE_ON : PLATE_A).fillCircle(x, y, r);
      g.lineStyle(Math.max(1, Math.round(r / 22)), lit ? THEME['brass-light'] : THEME['panel-edge'], lit ? 1 : 0.75).strokeCircle(x, y, r - 0.5);
    };
    if (show && this.play) {
      const P = L.pad;
      // the pad's well, then the four arms with their arrows
      g.fillStyle(THEME.panel, 0.18).fillCircle(P.cx, P.cy, P.d + P.r * 0.7);
      for (const a of P.arms) {
        plate(a.x, a.y, P.r, on(a.id));
        arrow(g, a.x, a.y, P.r * 0.42, a.id, on(a.id) ? THEME['brass-light'] : THEME.ink);
      }
    }
    for (const b of L.buttons) {
      const vis = show && (this.play || b.id === 'pause');
      const t = this.label(b.id, b.label, b.x, b.y + 1, b.id === 'jump' ? 'small' : 'body');
      t.setVisible(vis && b.id !== 'pause');
      if (b.id !== 'pause') t.setColor(on(b.id) ? 'brass-light' : 'ink');
      // a label wider than its plate drops to the small face
      if (t.width > b.r * 1.7 && t.scaleX > 1) t.setScale(1);
      if (!vis) continue;
      plate(b.x, b.y, b.r, on(b.id));
      if (b.id === 'pause') {
        // two bars: pause (Esc)
        const h = b.r * 0.8;
        const w = Math.max(3, b.r * 0.22);
        g.fillStyle(on('pause') ? THEME['brass-light'] : THEME.ink, 1);
        g.fillRect(b.x - w * 1.6, b.y - h / 2, w, h).fillRect(b.x + w * 0.6, b.y - h / 2, w, h);
      }
    }
    this.drawCard();
  }

  // ---- portrait -------------------------------------------------------------------
  setPortrait(on) {
    if (on === this.portrait) return;
    this.portrait = on;
    if (on) {
      this.releaseAll();
      const owner = ownerScene(this.game);
      // (not Boot, still loading the atlases; not the title, where nothing moves)
      if (owner && owner.sys.isActive() && !['Boot', 'Title'].includes(owner.sys.settings.key)) {
        this.pausedKey = owner.sys.settings.key;
        this.game.scene.pause(this.pausedKey);
      }
    } else if (this.pausedKey) {
      if (this.game.scene.isPaused(this.pausedKey)) this.game.scene.resume(this.pausedKey);
      this.pausedKey = null;
    }
    this.sig = '';
  }

  drawCard() {
    if (!this.portrait) {
      if (this.card) this.card.forEach((o) => o.setVisible(false));
      return;
    }
    if (!this.card) {
      const g = this.ui.add.graphics().setScrollFactor(0).setDepth(DEPTH + 2);
      g.name = 'touch-portrait-card';
      g.fillStyle(THEME.panel, 1).fillRect(0, 0, GAME_W, GAME_H);
      drawPanel(g, 60, 30, GAME_W - 120, GAME_H - 60, { accent: THEME.accent });
      // a phone turning on its side
      g.lineStyle(6, THEME['panel-edge'], 1).strokeRect(GAME_W / 2 - 150, 64, 62, 108);
      g.lineStyle(6, THEME.accent, 1).strokeRect(GAME_W / 2 + 40, 87, 108, 62);
      g.fillStyle(THEME.accent, 1).fillTriangle(GAME_W / 2 - 46, 103, GAME_W / 2 - 46, 133, GAME_W / 2 - 2, 118);
      // three short lines at 4×: a phone held upright shows the canvas
      // 375 px wide, so the words must be big (cap ≈ 22 CSS px there)
      const word = (y, str, i) => {
        const t = uiText(this.ui, GAME_W / 2, y, str, { size: 'display', scale: 4, screen: true, color: 'accent', align: 'center' }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(DEPTH + 3);
        t.name = `touch-portrait-${i}`;
        return t;
      };
      const lines = [word(200, 'TURN YOUR', 1), word(280, 'PHONE', 2), word(360, 'SIDEWAYS', 3)];
      this.card = [g, ...lines];
    }
    this.card.forEach((o) => o.setVisible(true));
  }
}

// switch the controls on or off (boot: UIScene.create; a scenario at will)
export function enableTouch(on = true, ui = UI.scene) {
  if (on && !touchState.controls && ui) new TouchControls(ui);
  if (touchState.controls) touchState.controls.setEnabled(on);
  else touchState.on = false;
  return touchState.controls;
}

function prevent(e) {
  if (e.cancelable) e.preventDefault();
}

function now() {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

function lockLandscape() {
  try {
    const o = typeof screen !== 'undefined' && screen.orientation;
    if (o && o.lock) o.lock('landscape').catch(() => {});
  } catch {
    /* not allowed here */
  }
}

// a solid arrow inside a plate
function arrow(g, x, y, s, dir, color) {
  g.fillStyle(color, 1);
  if (dir === 'left') g.fillTriangle(x - s, y, x + s * 0.7, y - s, x + s * 0.7, y + s);
  else if (dir === 'right') g.fillTriangle(x + s, y, x - s * 0.7, y - s, x - s * 0.7, y + s);
  else if (dir === 'up') g.fillTriangle(x, y - s, x - s, y + s * 0.7, x + s, y + s * 0.7);
  else g.fillTriangle(x, y + s, x - s, y - s * 0.7, x + s, y - s * 0.7);
}
