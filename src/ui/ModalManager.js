// ModalManager (plan §2.11): one stack for every modal in a scene: cards,
// tutorial cards, the dialogue box, puzzle and card-game panels, the death
// card and the pause menu.
//
// - Only the top modal is drawn; the ones under it are hidden (by camera
//   filter, so their own code can keep toggling visibility) and come back
//   when it closes.
// - A modal opening under a higher priority one waits underneath: a BET card
//   opened while the stake selector is up goes on top (card > encounter); a
//   card asked for during the death card waits for it.
// - Keys go to the top modal only (one keydown listener per scene).
// - The world freeze (physics, tweens, the scene clock) is computed from the
//   whole stack in one place and released when the last modal closes.
//
//   const h = scene.modals.open({ kind: 'tutorial', freeze: 'physics', onKey: (e) => h.close() });
//   h.add(obj)            // the modal's display objects (destroyed on close)
//   h.close()
import Phaser from 'phaser';
import { UI } from './ui.js';
import { buses } from '../audio/AudioBus.js';

export const PRIORITY = Object.freeze({ death: 50, pause: 40, tutorial: 30, card: 30, dialogue: 20, choice: 20, puzzle: 10, encounter: 10 });
const FREEZE_LEVEL = { none: 0, physics: 1, tweens: 2, world: 3 };

class ModalHandle {
  constructor(mgr, spec) {
    this.mgr = mgr;
    this.kind = spec.kind || 'card';
    this.name = spec.name || this.kind;
    this.priority = spec.priority ?? PRIORITY[this.kind] ?? 20;
    this.freeze = spec.freeze || 'physics';
    this.onKey = spec.onKey || null;
    // touch screens: (x, y) in game px, the modal's own answer to a tap
    // (a menu row, a choice). Without one, a tap on a dialogue, card or
    // tutorial is its confirm key (src/ui/TouchControls.js).
    this.tap = spec.tap || null;
    this.onClose = spec.onClose || null;
    this.onShow = spec.onShow || null;
    this.guardMs = spec.guardMs || 0;
    this.objs = [];
    this.shown = false;
    this.closed = false;
    this.topSince = 0;
  }

  add(obj) {
    if (!obj) return obj;
    this.objs.push(obj);
    this._apply(obj);
    return obj;
  }

  _apply(obj) {
    const cam = UI.scene && UI.scene.cameras.main;
    if (!cam) return;
    if (this.shown) obj.cameraFilter &= ~cam.id;
    else obj.cameraFilter |= cam.id;
    if (obj._bg) obj._bg.cameraFilter = obj.cameraFilter;
  }

  setShown(on) {
    if (this.shown === on) return;
    this.shown = on;
    this.objs.forEach((o) => o && o.active !== false && this._apply(o));
    if (on) {
      this.topSince = this.mgr.now();
      if (this.onShow) this.onShow();
    }
  }

  get isTop() {
    return this.mgr.top === this;
  }

  close(reason = 'closed') {
    if (this.closed) return;
    this.closed = true;
    this.objs.forEach((o) => o && o.destroy && o.destroy());
    this.objs = [];
    this.mgr._remove(this);
    const fn = this.onClose;
    this.onClose = null;
    if (fn) fn(reason);
  }
}

export default class ModalManager {
  static for(scene) {
    if (!scene.modals || scene.modals.scene !== scene || scene.modals.dead) scene.modals = new ModalManager(scene);
    return scene.modals;
  }

  constructor(scene) {
    this.scene = scene;
    this.stack = [];
    this.frozen = { physics: false, tweens: false, time: false };
    this.onKeyDown = (e) => this.dispatch(e);
    scene.input.keyboard.on('keydown', this.onKeyDown);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());
  }

  now() {
    return this.scene.time ? this.scene.time.now : 0;
  }

  get top() {
    return this.stack[this.stack.length - 1] || null;
  }

  get active() {
    return this.stack.length > 0;
  }

  isTop(h) {
    return !!h && this.top === h;
  }

  has(kind) {
    return this.stack.some((h) => h.kind === kind);
  }

  open(spec = {}) {
    const h = new ModalHandle(this, spec);
    for (const o of [...this.stack]) if ((spec.clears || []).includes(o.kind)) o.close('cleared');
    let i = this.stack.length;
    while (i > 0 && this.stack[i - 1].priority > h.priority) i--;
    this.stack.splice(i, 0, h);
    this._refresh();
    return h;
  }

  // a tap for the top modal (touch screens). 'guarded' inside its guardMs,
  // 'taken' when the modal answered it, 'default' when it has no tap of
  // its own (the caller presses its confirm key), null with no modal
  tapTop(x, y) {
    const t = this.top;
    if (!t) return null;
    if (this.now() - t.topSince < t.guardMs) return 'guarded';
    if (!t.tap) return 'default';
    t.tap(x, y);
    return 'taken';
  }

  _remove(h) {
    const i = this.stack.indexOf(h);
    if (i >= 0) this.stack.splice(i, 1);
    this._refresh();
  }

  dispatch(e) {
    const t = this.top;
    if (!t || !t.onKey) return;
    if (this.now() - t.topSince < t.guardMs) return;
    t.onKey(e);
    // the key belongs to the modal: the scene's own polling (Esc opens the
    // pause menu, X confirms a card) must not see it again this frame
    const k = this.scene.input.keyboard && this.scene.input.keyboard.keys[e.keyCode];
    if (k) k._justDown = false;
  }

  _refresh() {
    const top = this.top;
    this.stack.forEach((h) => h.setShown(h === top));
    this.applyFreeze();
    // the music (-4 dB) and the ambience (-3 dB) step back while anyone talks
    buses.duckDialogue(this.has('dialogue'));
  }

  // the one place the world is frozen and released for modals
  applyFreeze() {
    const s = this.scene;
    const lvl = this.stack.reduce((m, h) => Math.max(m, FREEZE_LEVEL[h.freeze] || 0), 0);
    const want = { physics: lvl >= 1, tweens: lvl >= 2, time: lvl >= 3 };
    if (s.physics && s.physics.world) {
      if (want.physics && !this.frozen.physics) s.physics.pause();
      else if (!want.physics && this.frozen.physics) s.physics.resume();
    }
    if (want.tweens && !this.frozen.tweens) s.tweens.pauseAll();
    else if (!want.tweens && this.frozen.tweens) s.tweens.resumeAll();
    if (want.time !== this.frozen.time) s.time.paused = want.time;
    this.frozen = want;
  }

  closeAll() {
    for (const h of [...this.stack].reverse()) h.close('cleared');
  }

  state() {
    return this.stack.map((h) => ({ kind: h.kind, name: h.name, shown: h.shown }));
  }

  destroy() {
    this.dead = true;
    this.stack = [];
    buses.duckDialogue(false);
    if (this.scene.input && this.scene.input.keyboard) this.scene.input.keyboard.off('keydown', this.onKeyDown);
  }
}
