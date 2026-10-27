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

  // the room objects of type 'checkpoint' → flag sprites in `group`
  place(group, objects, filter = () => true) {
    objects
      .filter((o) => o.type === 'checkpoint' && filter(o))
      .forEach((c) => {
        const f = group.create(c.wx, c.wy, 'flag');
        f.cpId = c.id;
        f.cpLabel = c.label || null;
        this.byId.set(c.id, f);
      });
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
      if (f && f.setTexture) f.setTexture('flag-lit');
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
