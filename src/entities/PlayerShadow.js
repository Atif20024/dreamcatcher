// Round 2 (§10.1): a ground shadow that stays on the ground. Every frame,
// after physics and the ground solver, it looks for the first walkable
// surface under the owner's feet (slopes, solid tops, one-way tops, any
// bodies in `scene.shadowCasters`), lies on it, and shrinks and fades with
// the height above it. Over a gap with nothing in reach it is hidden.
//
//   new PlayerShadow(scene, owner, { texture, tint, alpha, length, offsetX,
//                                    originX, width, height, maxH, maxDrop })
//   shadow.set({...})   per-frame options (the Evening's light, a bench seat
//                        via `groundY`, the painter's sun via `length`)
//   shadow.state()      { x, y, groundY, h, alpha, scaleX, angle, visible }
//
// Reusable by NPCs and foes: the owner needs a body (or x / y and feet()).
import { gridsOf, groundAt, gradientAt } from './ground.js';

const KEY = 'dc-ground-shadow';

// the default: a soft 28×6 ellipse, white, tinted by the place
function ensureTexture(scene) {
  if (scene.textures.exists(KEY)) return;
  const w = 28;
  const h = 6;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  // three nested ellipses fake a soft edge at pixel scale
  g.fillStyle(0xffffff, 0.35);
  g.fillEllipse(w / 2, h / 2, w, h);
  g.fillStyle(0xffffff, 0.6);
  g.fillEllipse(w / 2, h / 2, w - 6, h - 2);
  g.fillStyle(0xffffff, 1);
  g.fillEllipse(w / 2, h / 2, w - 12, h - 3);
  g.generateTexture(KEY, w, h);
  g.destroy();
}

// height → look (pure; tested). Width halves and alpha falls to 45 % by
// `maxH` (160 px, about a full jump), then the last of it fades out by
// 1.5 × maxH, beyond which it is hidden. (§10.1 fades alpha to 0 at 160 px,
// but a full jump peaks at 150 px: the shadow vanished at every apex, which is
// the hub's "vanishes in the air" defect again. It stays readable now.)
export function shadowLook(h, { alpha = 0.35, maxH = 160 } = {}) {
  if (h === null || h === undefined || h < -8 || h > maxH * 1.5) return { visible: false, alpha: 0, scale: 0.5 };
  const k = Math.min(1, Math.max(0, h) / maxH);
  const tail = h > maxH ? 1 - (h - maxH) / (maxH * 0.5) : 1;
  const a = alpha * (1 - 0.55 * k) * tail;
  return { visible: a > 0.004, alpha: a, scale: 1 - 0.5 * k };
}

export default class PlayerShadow {
  constructor(scene, owner, opts = {}) {
    this.scene = scene;
    this.owner = owner;
    this.o = { texture: null, tint: 0x14101c, alpha: 0.45, length: 1, offsetX: 0, originX: 0.5, maxH: 160, maxDrop: 320, groundY: null, depth: null, ...opts };
    ensureTexture(scene);
    this.img = scene.add.image(owner.x, owner.y, this.o.texture || KEY).setOrigin(this.o.originX, 0.5).setVisible(false);
    this.applyLook();
    this.last = { x: owner.x, y: owner.y, groundY: null, h: null, alpha: 0, scaleX: 0, angle: 0, visible: false };
    this._u = () => this.update();
    scene.events.on('postupdate', this._u);
    scene.events.once('shutdown', () => this.destroy());
  }

  applyLook() {
    const o = this.o;
    const key = o.texture && this.scene.textures.exists(o.texture) ? o.texture : KEY;
    if (this.img.texture.key !== key) this.img.setTexture(key);
    this.img.setOrigin(o.originX, 0.5);
    if (o.tint === null || o.tint === undefined) this.img.clearTint();
    else this.img.setTint(o.tint);
  }

  set(opts = {}) {
    const look = 'texture' in opts || 'tint' in opts || 'originX' in opts;
    Object.assign(this.o, opts);
    if (look) this.applyLook();
    return this;
  }

  // the ground under one column, at or below the feet (null: nothing in reach)
  probe(g, x, feetY) {
    let s = g ? groundAt(g, x, feetY - 1, feetY + this.o.maxDrop) : null;
    for (const c of this.scene.shadowCasters || []) {
      const b = c && c.body;
      if (!b || !c.active || b.enable === false) continue;
      if (x < b.left || x > b.right) continue;
      if (b.top >= feetY - 1 && b.top <= feetY + this.o.maxDrop && (s === null || b.top < s)) s = b.top;
    }
    return s;
  }

  update() {
    const p = this.owner;
    const img = this.img;
    if (!img || !img.scene) return;
    const b = p && p.body;
    if (!p || !p.active) {
      img.setVisible(false);
      return;
    }
    const o = this.o;
    // a place texture painted after the player was made
    if (o.texture && img.texture.key !== o.texture && this.scene.textures.exists(o.texture)) this.applyLook();
    const x = b ? b.x + b.width / 2 : p.x;
    const feetY = b ? b.bottom : p.feet ? p.feet().y : p.y;
    let ground = null;
    let clip = 0; // −1 / +1: only the left / right probe found ground (a ledge)
    if (o.groundY !== null && o.groundY !== undefined) ground = o.groundY;
    else {
      const g = gridsOf(this.scene);
      ground = this.probe(g, x, feetY);
      // standing on something the grids don't know (a crate, a lift, a cart)
      if (b && (b.blocked.down || b.touching.down) && (ground === null || ground > feetY + 2)) ground = feetY;
      if (ground === null) {
        const l = this.probe(g, x - 8, feetY);
        const r = this.probe(g, x + 8, feetY);
        if (l !== null || r !== null) {
          clip = l !== null && (r === null || l <= r) ? -1 : 1;
          ground = clip < 0 ? l : r;
        }
      }
    }
    const h = ground === null ? null : ground - feetY;
    const look = shadowLook(h, o);
    // Jo is drawn by `art` and hidden by `shown`; a plain sprite by `visible`
    const shown = p.art ? p.shown !== false && p.art.visible !== false : p.visible !== false;
    const visible = look.visible && shown && !p.dead;
    let angle = 0;
    if (visible && o.groundY == null && !clip) {
      const g = gridsOf(this.scene);
      if (g) angle = (Math.atan(gradientAt(g, x, ground)) * 180) / Math.PI;
    }
    const sx = look.scale * o.length * (clip ? 0.5 : 1);
    const sy = 1 - (1 - look.scale) * 0.5;
    const ox = o.offsetX + clip * 6;
    img
      .setVisible(visible)
      .setPosition(x + ox, (ground ?? feetY) + 1) // on the lit lip of the ground, not over the backdrop behind it
      .setAlpha(look.alpha)
      .setScale(sx, sy)
      .setAngle(angle)
      .setDepth(o.depth ?? (p.art ? p.art.depth : p.depth || 12) - 0.6);
    this.last = { x: img.x, y: img.y, groundY: ground, h, alpha: visible ? look.alpha : 0, scaleX: sx, angle, visible };
  }

  state() {
    return { ...this.last };
  }

  destroy() {
    this.scene.events.off('postupdate', this._u);
    if (this.img) this.img.destroy();
    this.img = null;
  }
}
