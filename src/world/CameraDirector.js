// CameraDirector (plan 2.12): the camera as data. A base follow shot
// (look-ahead in the facing/moving direction, a vertical bias so Jo sits low
// in frame, eased) clamped to the current room: across to the far faces of
// the seam frames it meets (RoomGraph.viewX: the next room never shows past
// a frame), in y to the room itself. The room only changes at the full dark
// of a frame's dip, so the clamp and the zoom snap there, unseen (snap()).
// Pushed shots sit on top (talk push-in, vista pull-out, encounter close-up,
// the ending), each eased in and out by its weight.
//
//   cam.push({ zoom: 1.3, focus: {x,y} | () => ({x,y}), ms: 600 }) → handle
//   cam.pop(handle, ms)
//   cam.snap()      after a teleport (door, respawn)
// Zoom = base zoom (dream profile) × room zoom × shots.

import { perFrame } from '../entities/motion.js';
import { getSettings } from '../utils/save.js';

// the Reduced shake setting, as a multiplier every shake goes through
export function shakeScale() {
  try {
    return getSettings().reducedShake ? 0.4 : 1;
  } catch {
    return 1;
  }
}

// a jump (145 px) stays inside this: the view holds still while Jo is in the air
const AIR_BAND = 120;

// The older scenes' follow (Phaser's own, per render frame), made dt-correct.
// Call once a frame after startFollow(target, true, 0.1, 0.1): at 60 Hz the
// lerp is that 0.1. The look-ahead eases, and flips on where he is moving; the
// deadzone opens while he is in the air, and closing it on landing eases the
// view back to him. (cam.setDeadzone would snap the camera: set the height.)
export function easeFollow(cam, p, delta) {
  const dt = Math.min(delta, 50);
  const l = perFrame(0.1, dt);
  cam.setLerp(l, l);
  const vx = p.body.velocity.x;
  const want = Math.abs(vx) > 40 ? (vx > 0 ? -48 : 48) : p.flipX ? 48 : -48;
  cam.followOffset.x += (want - cam.followOffset.x) * perFrame(0.06, dt);
  const air = !p.body.onFloor() && !p.onSlope && !p.climbing && !p.floating;
  if (cam.deadzone) cam.deadzone.height = air ? AIR_BAND * 2 : 60;
}

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
  }

  // settings: reduced shake → 0.4 (main.js applies it to every camera shake)
  get shake() {
    return shakeScale();
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

  // keepLook: a walk through a frame (Jo is still moving the same way, so
  // the look-ahead carries on instead of easing back out after the dip)
  snap({ keepLook = false } = {}) {
    this.pos = null;
    this.footY = null;
    if (!keepLook) this.look = 0;
  }

  focusOf(h) {
    if (!h.focus) return null;
    return typeof h.focus === 'function' ? h.focus() : h.focus;
  }

  // the clamp rect: out to the room's frames across, the room up and down
  bounds(roomId) {
    const g = this.graph;
    const r = g.room(roomId);
    const v = g.viewX(roomId);
    return { x0: v.x0, x1: v.x1, y0: r.y0, y1: r.y1 };
  }

  update(dt, { roomId, roomZoom = 1, frozen = false } = {}) {
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
    if (!frozen) this.look += (want - this.look) * perFrame(16.667 / 600, dt);
    // the feet line follows him on the ground; in the air only past the band,
    // so the screen does not bob on every jump
    const air = p.body && !p.body.onFloor() && !p.onSlope && !p.climbing && !p.floating;
    this.footY = !air || this.footY == null ? p.y : Math.max(p.y - AIR_BAND, Math.min(p.y + AIR_BAND, this.footY));
    let fx = p.x + this.look;
    let fy = this.footY + 22 - this.cam.height * (this.bias - 0.5);
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
      this.pos.x += (fx - this.pos.x) * perFrame(16.667 / 110, dt);
      this.pos.y += (fy - this.pos.y) * perFrame(16.667 / 160, dt);
    }
    // clamp the view inside the room
    const b = this.bounds(roomId);
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
