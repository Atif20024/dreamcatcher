// PauseMenu (plan §2.11): a self-contained menu panel. It knows nothing
// about levels: the host passes a title, info lines and items, and gets
// callbacks. Today it draws on the host scene's camera with Phaser text;
// a later workstream re-hosts it on UIScene with bitmap fonts (only
// `_draw` changes).
//
//   const m = new PauseMenu(scene);
//   m.open({ title, lines, items: [{ label, action, id }], canClose, onClose });
//
// Keys: Up/Down (W/S) move, X/E/Enter/Space choose, Esc closes (when
// canClose). The same module renders the death card (canClose: false).

const NAV_UP = ['ArrowUp', 'KeyW'];
const NAV_DOWN = ['ArrowDown', 'KeyS'];
const CHOOSE = ['KeyX', 'KeyE', 'Enter', 'Space'];

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
    this.title = title;
    this.lines = lines;
    this.items = items;
    this.canClose = canClose;
    this.onClose = onClose;
    this.idx = 0;
    this.isOpen = true;
    this.guardUntil = this.scene.time.now + guardMs; // a death card must not be confirmed by the mash that caused it
    this._draw();
    if (!this.keyHandler) {
      this.keyHandler = (e) => this._key(e);
      this.scene.input.keyboard.on('keydown', this.keyHandler);
    }
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
    if (this.keyHandler) {
      this.scene.input.keyboard.off('keydown', this.keyHandler);
      this.keyHandler = null;
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
    const text = (x, y, str, style) =>
      s.add
        .text(x, y, str, { fontFamily: 'monospace', color: '#e8dcc8', align: 'center', ...style })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(this.depth + 1);
    const h = 120 + this.lines.length * 20 + this.items.length * 30;
    this.objs.push(s.add.rectangle(cx, cy, cam.width, cam.height, 0x000000, 0.72).setScrollFactor(0).setDepth(this.depth));
    this.objs.push(
      s.add.rectangle(cx, cy, 460, h, 0x14101c, 0.96).setStrokeStyle(2, 0x8a8aa8).setScrollFactor(0).setDepth(this.depth)
    );
    let y = cy - h / 2 + 34;
    this.objs.push(text(cx, y, this.title, { fontSize: '20px', color: '#f2d580', wordWrap: { width: 420 } }));
    y += 34;
    for (const l of this.lines) {
      this.objs.push(text(cx, y, l, { fontSize: '13px', color: '#c8c0b0', wordWrap: { width: 420 } }));
      y += 20;
    }
    y += 10;
    this.itemTexts = this.items.map((it, i) => {
      const t = text(cx, y + i * 30, it.label, { fontSize: '16px' });
      this.objs.push(t);
      return t;
    });
    this._renderItems();
  }

  _renderItems() {
    (this.itemTexts || []).forEach((t, i) => {
      const it = this.items[i];
      const on = i === this.idx;
      t.setText(on ? `▸ ${it.label} ◂` : it.label);
      t.setColor(on ? '#f2d580' : '#a8a090');
    });
  }
}
