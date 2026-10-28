// CameraDirector (plan 2.12): the camera as data. A base follow shot
// (look-ahead in the facing/moving direction, a vertical bias so Jo sits low
// in frame, eased) clamped to the current room — or, across a seam, to the
// two rooms' rects blended on the RoomGraph's t, so the clamp never snaps.
// Pushed shots sit on top (talk push-in, vista pull-out, encounter close-up,
// the ending), each eased in and out by its weight.
//
//   cam.push({ zoom: 1.3, focus: {x,y} | () => ({x,y}), ms: 600 }) → handle
//   cam.pop(handle, ms)
//   cam.snap()      after a teleport (door, respawn)
// Zoom = base zoom (dream profile) × room zoom (lerped on t) × shots.

const ease = (u) => (u < 0.5 ? 2 * u * u : 1 - (-2 * u + 2) ** 2 / 2);
const lerp = (a, b, t) => a + (b - a) * t;

export class CameraDirector {
  constructor(scene, { graph, target, zoom = 1, lookAhead = 72, lead = 0.12, bias = 0.62 } = {}) {
    this.scene = scene;
    this.cam = scene.cameras.main;
    this.graph = graph;
    this.target = target;
    this.baseZoom = zoom;
    this.lookAhead = lookAhead;
    this.lead = lead;
    this.bias = bias; // where Jo's feet sit vertically (0 top, 1 bottom)
    this.shots = [];
    this.look = 0;
    this.pos = null;
    this.zoom = zoom;
    this.shake = 1; // settings: reduced shake → 0.4
  }

  push({ zoom = 1, focus = null, ms = 600, weight = 1, hold = false } = {}) {
    const h = { zoom, focus, ms, w: 0, target: weight, dir: 1, t0: this.scene.time.now, hold };
    this.shots.push(h);
    return h;
  }

  pop(h, ms = 500) {
    if (!h) return;
    h.dir = -1;
    h.ms = ms;
    h.t0 = this.scene.time.now;
    h.from = h.w;
  }

  popAll(ms = 400) {
    for (const h of this.shots) this.pop(h, ms);
  }

  snap() {
    this.pos = null;
    this.look = 0;
  }

  focusOf(h) {
    if (!h.focus) return null;
    return typeof h.focus === 'function' ? h.focus() : h.focus;
  }

  // the clamp rect: the room, or across a seam both rooms blended on t
  bounds(roomId, blend) {
    const g = this.graph;
    const rect = (id) => {
      const r = g.room(id);
      return { x0: r.x0, y0: r.y0, x1: r.x1, y1: r.y1 };
    };
    if (blend) {
      const A = rect(blend.a);
      const B = rect(blend.b);
      const z = g.zoneRect(blend.a);
      return { x0: z.x0, x1: z.x1, y0: lerp(A.y0, B.y0, blend.t), y1: lerp(A.y1, B.y1, blend.t) };
    }
    const r = rect(roomId);
    const z = g.zoneRect(roomId);
    return { x0: z.x0, x1: z.x1, y0: r.y0, y1: r.y1 };
  }

  update(dt, { roomId, blend, roomZoom = 1, frozen = false } = {}) {
    const now = this.scene.time.now;
    // shot weights
    for (const h of this.shots) {
      const u = Math.min(1, (now - h.t0) / Math.max(1, h.ms));
      h.w = h.dir > 0 ? ease(u) * h.target : (h.from ?? 1) * (1 - ease(u));
    }
    this.shots = this.shots.filter((h) => !(h.dir < 0 && h.w <= 0.001));
    const p = this.target;
    if (!p) return;
    // base follow: feet low in frame, a look-ahead that eases toward where he faces/moves
    const vx = p.body ? p.body.velocity.x : 0;
    const want = Math.abs(vx) > 40 ? Math.sign(vx) * this.lookAhead : (p.flipX ? -1 : 1) * this.lookAhead * 0.5;
    if (!frozen) this.look += (want - this.look) * Math.min(1, dt / 600);
    let fx = p.x + this.look;
    let fy = p.y + 22 - this.cam.height * (this.bias - 0.5);
    let zoom = this.baseZoom * roomZoom;
    for (const h of this.shots) {
      const f = this.focusOf(h);
      if (f) {
        fx = lerp(fx, f.x, h.w);
        fy = lerp(fy, f.y, h.w);
      }
      zoom *= lerp(1, h.zoom, h.w);
    }
    // ease position (a teleport snaps)
    if (!this.pos || Math.hypot(fx - this.pos.x, fy - this.pos.y) > this.cam.width * 1.2) this.pos = { x: fx, y: fy };
    else {
      const k = Math.min(1, dt / 110);
      this.pos.x += (fx - this.pos.x) * k;
      this.pos.y += (fy - this.pos.y) * Math.min(1, dt / 160);
    }
    // clamp the view inside the room (or blended rooms)
    const b = this.bounds(roomId, blend);
    // never show the void past a small room: zoom in until the room fills the view
    zoom = Math.max(zoom, this.cam.height / Math.max(1, b.y1 - b.y0), this.cam.width / Math.max(1, b.x1 - b.x0));
    const hw = this.cam.width / (2 * zoom);
    const hh = this.cam.height / (2 * zoom);
    let cx = this.pos.x;
    let cy = this.pos.y;
    cx = b.x1 - b.x0 <= 2 * hw ? (b.x0 + b.x1) / 2 : Math.max(b.x0 + hw, Math.min(b.x1 - hw, cx));
    cy = b.y1 - b.y0 <= 2 * hh ? (b.y0 + b.y1) / 2 : Math.max(b.y0 + hh, Math.min(b.y1 - hh, cy));
    this.zoom = zoom;
    this.cam.setZoom(zoom);
    this.cam.centerOn(cx, cy);
    this.center = { x: cx, y: cy };
  }
}

export default CameraDirector;
