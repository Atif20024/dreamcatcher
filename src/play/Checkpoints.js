// CheckpointService (plan §2.8): labelled flags. Touching one lights it,
// shows its name ("THE PASS"), sets the respawn point and autosaves (the
// scene listens for `checkpoint:lit`). Scripted respawn points (a cutscene
// that moves Jo) go through setRespawn and keep the last label.
//
// The scene owns the flag sprites (its static group); this service tags
// them with { cpId, cpLabel } and owns the lit state.

export default class CheckpointService {
  constructor(scene, { spawn, bus = null, onLit = null } = {}) {
    this.scene = scene;
    this.bus = bus;
    this.onLit = onLit;
    this.point = { x: spawn.x, y: spawn.y, id: null, label: null };
    this.lit = new Set();
    this.byId = new Map();
  }

  get respawn() {
    return this.point;
  }

  get label() {
    return this.point.label;
  }

  // the room objects of type 'checkpoint' → flag sprites in `group`.
  // Round 2 WP6 (§9 "the lamp"): the 'flag' texture is a platform lamp
  // (src/art/identityArt.js). It stands on the floor of its tile (the old
  // 32 px flag's foot), and its touch zone stays the old flag's tile.
  place(group, objects, filter = () => true) {
    objects
      .filter((o) => o.type === 'checkpoint' && filter(o))
      .forEach((c) => {
        const f = group.create(c.wx, c.wy, 'flag');
        if (f.height > 32) {
          f.setOrigin(0.5, 1 - 16 / f.height).setDepth(11.1); // a practical: over the night grade, under Jo
          if (f.body) {
            f.body.setSize(32, 48, false);
            f.body.setOffset((f.width - 32) / 2, f.height - 48);
          }
        }
        f.cpId = c.id;
        f.cpLabel = c.label || null;
        this.byId.set(c.id, f);
      });
  }

  // a lit lamp's light: a warm glow at the lantern and a pool on the room
  // around it (the practicals warm by about 10 %, §9)
  glow(f, instant = false) {
    if (!f || f.dcGlow || !f.scene || f.alpha === 0 || !f.visible) return;
    const s = f.scene;
    if (!s.textures.exists('dc-id-glow')) return;
    const head = f.getTopLeft();
    const x = f.x;
    const y = head.y + 15;
    const lamp = s.add.image(x, y, 'dc-id-glow').setBlendMode('ADD').setTint(0xffc870).setDepth(11.2).setScale(0.55); // over the night grade
    const pool = s.add.image(x, y + 40, 'dc-id-glow').setBlendMode('ADD').setTint(0xf2a860).setDepth(f.depth - 0.5).setScale(3.4, 2.4);
    f.dcGlow = { lamp, pool };
    if (instant) {
      lamp.setAlpha(0.8);
      pool.setAlpha(0.1);
    } else {
      lamp.setAlpha(0);
      pool.setAlpha(0);
      s.tweens.add({ targets: lamp, alpha: 0.8, duration: 260 });
      s.tweens.add({ targets: pool, alpha: 0.1, duration: 900 });
    }
    // the flame breathes
    s.tweens.add({ targets: lamp, scale: 0.62, duration: 1300, yoyo: true, repeat: -1, ease: 'sine.inout', delay: 300 });
    f.once('destroy', () => [lamp, pool].forEach((o) => o.destroy()));
  }

  spriteFor(id) {
    return this.byId.get(id) || null;
  }

  pointFor(id) {
    const f = this.byId.get(id);
    return f ? { x: f.x, y: f.y - 8, id, label: f.cpLabel } : null;
  }

  // touch → light (once per flag per run)
  light(flag, { silent = false } = {}) {
    if (!flag || this.lit.has(flag.cpId || flag)) return false;
    if (flag.texture && flag.texture.key !== 'flag') return false;
    if (flag.setTexture) flag.setTexture('flag-lit');
    if (flag.setTexture) this.glow(flag);
    const id = flag.cpId || null;
    this.lit.add(id || flag);
    this.point = { x: flag.x, y: flag.y - 8, id, label: flag.cpLabel || null };
    const payload = { id, label: this.point.label, x: this.point.x, y: this.point.y, silent };
    if (this.bus) this.bus.emit('checkpoint:lit', payload);
    if (this.onLit) this.onLit(payload);
    return true;
  }

  // relight flags restored from a saved run, without fanfare or autosave
  restoreLit(ids = []) {
    for (const id of ids) {
      const f = this.byId.get(id);
      if (f && f.setTexture) {
        f.setTexture('flag-lit');
        this.glow(f, true);
      }
      this.lit.add(id);
    }
  }

  // a scripted respawn point (cutscenes, warps)
  setRespawn(pos, meta = {}) {
    if (!pos) return;
    const id = meta.id !== undefined ? meta.id : pos.id !== undefined ? pos.id : this.point.id;
    const label = meta.label !== undefined ? meta.label : pos.label !== undefined ? pos.label : this.point.label;
    this.point = { x: pos.x, y: pos.y, id, label };
  }
}
