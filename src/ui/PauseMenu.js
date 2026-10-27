// PauseMenu (plan §2.11): a self-contained menu panel. It knows nothing
// about levels: the host passes a title, info lines and items, and gets
// callbacks. It is a ModalManager modal ('pause', or 'death' when it cannot
// be closed): drawn on UIScene in bitmap type, keys only while it is on top,
// and the world frozen through the manager. The death card clears a stale
// tutorial card instead of drawing over it.
//
//   const m = new PauseMenu(scene);
//   m.open({ title, lines, items: [{ label, action, id }], canClose, onClose });
//
// Keys: Up/Down (W/S) move, X/E/Enter/Space choose, Esc closes (when
// canClose). The same module renders the death card (canClose: false).

const NAV_UP = ['ArrowUp', 'KeyW'];
const NAV_DOWN = ['ArrowDown', 'KeyS'];
const CHOOSE = ['KeyX', 'KeyE', 'Enter', 'Space'];

import ModalManager from './ModalManager.js';
import { uiText } from './text.js';
import { drawPanel, dim } from './Panel.js';

export default class PauseMenu {
  constructor(scene, { depth = 260 } = {}) {
    this.scene = scene;
    this.depth = depth;
    this.isOpen = false;
    this.objs = [];
    this.items = [];
    this.idx = 0;
    this.openedAt = 0;
  }

  open({ title = 'Paused', lines = [], items = [], canClose = true, onClose = null, guardMs = 0 } = {}) {
    if (this.isOpen) this._clear();
    if (this.handle) {
      const h = this.handle;
      this.handle = null;
      h.close('reopened');
    }
    this.title = title;
    this.lines = lines;
    this.items = items;
    this.canClose = canClose;
    this.onClose = onClose;
    this.idx = 0;
    this.isOpen = true;
    this.guardUntil = this.scene.time.now + guardMs; // a death card must not be confirmed by the mash that caused it
    const death = !canClose;
    const h = ModalManager.for(this.scene).open({
      kind: death ? 'death' : 'pause',
      freeze: 'world',
      clears: death ? ['tutorial'] : [],
      onKey: (e) => this._key(e),
      onClose: () => {
        if (this.handle === h) {
          this.handle = null;
          this.close();
        }
      },
    });
    this.handle = h;
    this._draw();
    return this;
  }

  // swap the items in place (settings submenu, toggles)
  setItems(items, { title, lines, keepIndex = false } = {}) {
    if (title !== undefined) this.title = title;
    if (lines !== undefined) this.lines = lines;
    this.items = items;
    if (!keepIndex) this.idx = 0;
    this.idx = Math.min(this.idx, items.length - 1);
    this._clear();
    this._draw();
  }

  close(fromEsc = false) {
    if (!this.isOpen) return;
    this.isOpen = false;
    this._clear();
    if (this.handle) {
      const h = this.handle;
      this.handle = null;
      h.close();
    }
    const fn = this.onClose;
    this.onClose = null;
    if (fn) fn(fromEsc);
  }

  destroy() {
    this.onClose = null;
    this.close();
  }

  // choose an item by id (harness / tests)
  choose(id) {
    const i = this.items.findIndex((it) => it.id === id);
    if (i < 0) return false;
    this.idx = i;
    this._choose();
    return true;
  }

  state() {
    return { open: this.isOpen, title: this.title, items: this.items.map((i) => i.id || i.label), index: this.idx };
  }

  _key(e) {
    if (!this.isOpen) return;
    if (this.scene.time.now < this.guardUntil) return;
    if (NAV_UP.includes(e.code)) this._move(-1);
    else if (NAV_DOWN.includes(e.code)) this._move(1);
    else if (CHOOSE.includes(e.code)) this._choose();
    else if (e.code === 'Escape' && this.canClose) this.close(true);
  }

  _move(d) {
    const n = this.items.length;
    if (!n) return;
    this.idx = (this.idx + d + n) % n;
    this._renderItems();
  }

  _choose() {
    const it = this.items[this.idx];
    if (it && it.action) it.action(this);
  }

  _clear() {
    this.objs.forEach((o) => o.destroy());
    this.objs = [];
    this.itemTexts = [];
  }

  _draw() {
    const s = this.scene;
    const cam = s.cameras.main;
    const cx = cam.width / 2;
    const cy = cam.height / 2;
    const W = 560;
    const add = (o) => {
      this.objs.push(o);
      if (this.handle) this.handle.add(o);
      return o;
    };
    const text = (y, str, opts) =>
      add(uiText(s, cx, y, str, { align: 'center', wrap: W - 60, ...opts }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(this.depth + 2));
    add(dim(s, 0.72, this.depth));
    const frame = add(s.add.graphics().setScrollFactor(0).setDepth(this.depth + 1));
    // lay the text out first, then size the panel to it
    let y = 0;
    const title = text(y, this.title, { size: 'body', color: 'accent' });
    y += title.height + 14;
    const lines = this.lines.map((l) => {
      const t = text(y, l, { size: 'small', color: 'ink-dim' });
      y += t.height + 8;
      return t;
    });
    y += 10;
    this.itemTexts = this.items.map((it) => {
      const t = text(y, it.label, { size: 'body', color: 'ink' });
      y += Math.max(t.height, 18) + 12;
      return t;
    });
    const h = y + 40;
    const top = Math.round(cy - h / 2);
    [title, ...lines, ...this.itemTexts].forEach((t) => t.setY(t.y + top + 24));
    frame.clear();
    this._frame = frame;
    this._drawFrame(frame, cx - W / 2, top, W, h);
    this._renderItems();
  }

  _drawFrame(g, x, y, w, h) {
    drawPanel(g, x, y, w, h);
  }

  _renderItems() {
    (this.itemTexts || []).forEach((t, i) => {
      const it = this.items[i];
      const on = i === this.idx;
      t.setText(on ? `→ ${it.label}` : it.label);
      t.setColor(on ? 'accent' : 'ink-dim');
    });
  }
}
