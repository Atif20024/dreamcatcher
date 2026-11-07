// RoomGraph (plan 2.2): a dream's rooms as separate grids placed in one
// world, joined by portals. Pure JS (no Phaser) so it unit-tests in Node and
// the content lint can walk it.
//
//   const g = RoomGraph.fromDefinition(def)      // def.rooms: [roomData]
//   g.room('green')                              // { id, data, tx, ty, w, h, x0, y0, x1, y1 }
//   g.neighbours('green')                        // ids joined by a portal
//   g.crossing(x, y, 'green')                    // the seam frame Jo has walked through | null
//   g.viewX('green')                             // { x0, x1 } the camera may show (to the frames)
//   g.roomAt(wx, wy)                             // the room containing a world point
//   g.validate()                                 // [issue strings] (lint)
//
// Two portal kinds (4.3):
//   seam  rooms side by side, walked through a drawn frame (`seam.prop`: an
//         arch, a gate, an alley mouth standing at the shared edge). Jo
//         keeps walking; the screen dips through dark inside the frame and
//         the rooms swap at full dark (src/world/thresholds.js). Two rooms'
//         backdrops are never on screen together.
//   door  a fade through black on [E]; the rooms may sit anywhere in the world
// A portal is a room entity: { type:'portal', id, kind, x, y, to:{room, portal} }.
// Ids follow 'from>to' by convention; the pair must point at each other.

import { frameCrossing, dipFor } from './thresholds.js';

export const T = 32;
// a seam's frame must stand within this many px of the shared edge
export const FRAME_REACH = 6 * T;

const gridW = (grid) => Math.max(...grid.map((r) => r.length));

export class RoomGraph {
  // frameWidth(propName) → px (the scene's prop library); without it a
  // frame counts as 4 tiles wide
  constructor(rooms = [], { frameWidth = null } = {}) {
    this.rooms = new Map();
    this.portals = new Map();
    this.frameWidth = frameWidth;
    for (const data of rooms) this.add(data);
  }

  static fromDefinition(def, opts = {}) {
    return new RoomGraph(def.rooms || [], opts);
  }

  add(data) {
    if (!data || !data.id) throw new Error('RoomGraph: a room needs an id');
    if (this.rooms.has(data.id)) throw new Error(`RoomGraph: duplicate room "${data.id}"`);
    this._seams = null;
    const o = data.origin || { tx: 0, ty: 0 };
    const w = gridW(data.grid);
    const h = data.grid.length;
    const r = { id: data.id, data, tx: o.tx, ty: o.ty, w, h, x0: o.tx * T, y0: o.ty * T, x1: (o.tx + w) * T, y1: (o.ty + h) * T, portals: [] };
    this.rooms.set(data.id, r);
    for (const e of data.entities || []) {
      if (e.type !== 'portal') continue;
      const p = {
        ...e,
        room: data.id,
        kind: e.kind || 'door',
        wx: (o.tx + e.x) * T + T / 2,
        wy: (o.ty + e.y) * T + T / 2,
      };
      if (this.portals.has(p.id)) throw new Error(`RoomGraph: duplicate portal "${p.id}"`);
      this.portals.set(p.id, p);
      r.portals.push(p);
    }
    return r;
  }

  room(id) {
    return this.rooms.get(id) || null;
  }

  ids() {
    return [...this.rooms.keys()];
  }

  portal(id) {
    return this.portals.get(id) || null;
  }

  // the portal on the other side
  partner(portalId) {
    const p = this.portal(portalId);
    return p && p.to ? this.portal(p.to.portal) : null;
  }

  neighbours(id) {
    const r = this.room(id);
    if (!r) return [];
    return [...new Set(r.portals.filter((p) => p.to && this.rooms.has(p.to.room)).map((p) => p.to.room))];
  }

  // rooms joined to `id` by seams only (one continuous space for the camera)
  zone(id) {
    const out = new Set([id]);
    const q = [id];
    while (q.length) {
      const r = this.room(q.shift());
      for (const p of r ? r.portals : []) {
        if (p.kind !== 'seam' || !p.to || out.has(p.to.room) || !this.rooms.has(p.to.room)) continue;
        out.add(p.to.room);
        q.push(p.to.room);
      }
    }
    return out;
  }

  // the x where two seam-joined rooms meet (the right room's left edge)
  seamEdge(p) {
    const a = this.room(p.room);
    const b = this.room(p.to.room);
    return a.x0 < b.x0 ? b.x0 : a.x0;
  }

  // the world x of a seam's drawn frame: the centre of its `seam.prop` in
  // either room, the one nearest the shared edge (null: none drawn)
  frameX(p) {
    const name = p.seam && p.seam.prop;
    if (!name || !p.to) return null;
    const edge = this.seamEdge(p);
    let best = null;
    for (const id of [p.room, p.to.room]) {
      const r = this.room(id);
      for (const q of (r && r.data.props) || []) {
        if (q.prop !== name) continue;
        const x = r.x0 + (q.x + 0.5) * T + (q.dx || 0);
        if (best === null || Math.abs(x - edge) < Math.abs(best - edge)) best = x;
      }
    }
    return best;
  }

  outdoor(id) {
    const r = this.room(id);
    return !!(r && r.data.backdrop);
  }

  // every seam once, as { left, right, x (its drawn frame's centre), edge
  // (the shared edge), y0, y1 (the band both rooms share), dip, portal }
  seams() {
    if (this._seams) return this._seams;
    const out = [];
    const seen = new Set();
    for (const p of this.portals.values()) {
      if (p.kind !== 'seam' || !p.to || !this.rooms.has(p.to.room)) continue;
      const key = [p.room, p.to.room].sort().join('|');
      if (seen.has(key)) continue;
      seen.add(key);
      const a = this.room(p.room);
      const b = this.room(p.to.room);
      const [left, right] = a.x0 < b.x0 ? [a, b] : [b, a];
      const q = this.partner(p.id);
      const frame = this.frameX(p) ?? (q && this.frameX(q)) ?? right.x0;
      const dip = (p.seam && p.seam.dip) || dipFor(this.outdoor(left.id), this.outdoor(right.id));
      const w = (this.frameWidth && this.frameWidth(p.seam && p.seam.prop)) || 4 * T;
      out.push({ left: left.id, right: right.id, x: frame, half: w / 2, edge: right.x0, y0: Math.max(left.y0, right.y0) - 4 * T, y1: Math.min(left.y1, right.y1) + 4 * T, dip, portal: p.id });
    }
    this._seams = out;
    return out;
  }

  // the seam frame Jo has walked through, seen from the room on screen:
  // { from, to, x, dip, portal, dir } | null (thresholds.frameCrossing)
  crossing(x, y, currentId) {
    return frameCrossing(this.seams(), x, y, currentId);
  }

  contains(r, wx, wy, pad = 0) {
    return wx >= r.x0 - pad && wx < r.x1 + pad && wy >= r.y0 - pad && wy < r.y1 + pad;
  }

  // the room holding a world point (gameplay: where Jo stands)
  roomAt(wx, wy) {
    for (const r of this.rooms.values()) if (this.contains(r, wx, wy)) return r;
    // between rooms (a gap above a seam): the nearest by x within the band
    let best = null;
    let bd = Infinity;
    for (const r of this.rooms.values()) {
      if (wy < r.y0 - 4 * T || wy > r.y1 + 4 * T) continue;
      const d = wx < r.x0 ? r.x0 - wx : wx >= r.x1 ? wx - r.x1 : 0;
      if (d < bd) {
        bd = d;
        best = r;
      }
    }
    return best;
  }

  // what the camera may show of a room across: the room itself, out to the
  // far face of each seam frame it meets and no further, so nothing of the
  // next room shows past the frame until the dip has swapped them
  viewX(id) {
    const r = this.room(id);
    let x0 = r.x0;
    let x1 = r.x1;
    for (const s of this.seams()) {
      if (s.right === id) x0 = s.x - s.half;
      if (s.left === id) x1 = s.x + s.half;
    }
    return { x0, x1 };
  }

  // world rect of a zone (union of its rooms)
  zoneRect(id) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const z of this.zone(id)) {
      const r = this.room(z);
      x0 = Math.min(x0, r.x0);
      y0 = Math.min(y0, r.y0);
      x1 = Math.max(x1, r.x1);
      y1 = Math.max(y1, r.y1);
    }
    return { x0, y0, x1, y1 };
  }

  // the union of every room (physics world bounds)
  worldRect() {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const r of this.rooms.values()) {
      x0 = Math.min(x0, r.x0);
      y0 = Math.min(y0, r.y0);
      x1 = Math.max(x1, r.x1);
      y1 = Math.max(y1, r.y1);
    }
    return { x0, y0, x1, y1 };
  }

  // rooms reachable from `start` through portals (lint: every room reachable)
  reachable(start) {
    const out = new Set();
    const q = [start];
    while (q.length) {
      const id = q.shift();
      if (out.has(id) || !this.rooms.has(id)) continue;
      out.add(id);
      q.push(...this.neighbours(id));
    }
    return out;
  }

  // world char lookup across every room (the collision grid, '.' outside)
  charAt(tx, ty) {
    for (const r of this.rooms.values()) {
      if (tx < r.tx || ty < r.ty || tx >= r.tx + r.w || ty >= r.ty + r.h) continue;
      const row = r.data.grid[ty - r.ty];
      return (row && row[tx - r.tx]) || '.';
    }
    return '.';
  }

  // structural issues (the content lint reports them as failures)
  validate() {
    const out = [];
    for (const p of this.portals.values()) {
      const where = `portal ${p.id} (${p.room})`;
      if (!['seam', 'door'].includes(p.kind)) out.push(`${where}: kind must be seam or door`);
      if (!p.to || !p.to.room || !p.to.portal) {
        out.push(`${where}: no destination`);
        continue;
      }
      if (!this.rooms.has(p.to.room)) out.push(`${where}: room "${p.to.room}" does not exist`);
      const q = this.portal(p.to.portal);
      if (!q) out.push(`${where}: partner portal "${p.to.portal}" does not exist`);
      else {
        if (q.room !== p.to.room) out.push(`${where}: partner ${q.id} is in ${q.room}, not ${p.to.room}`);
        if (!q.to || q.to.portal !== p.id || q.to.room !== p.room) out.push(`${where}: partner ${q.id} does not point back`);
        if (q.kind !== p.kind) out.push(`${where}: partner ${q.id} is a ${q.kind}, this is a ${p.kind}`);
      }
      if (p.kind === 'seam' && this.rooms.has(p.to.room)) {
        const a = this.room(p.room);
        const b = this.room(p.to.room);
        if (!(a.x1 === b.x0 || b.x1 === a.x0)) out.push(`${where}: seam rooms ${a.id} and ${b.id} do not share an edge`);
        const ov = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0);
        if (ov < 4 * T) out.push(`${where}: seam rooms overlap vertically by less than 4 tiles`);
        if (!p.seam || !p.seam.prop) out.push(`${where}: a seam needs a physical seam prop (arch, tunnel, fog)`);
        else {
          // the dip happens inside the frame: it has to be drawn, at the seam
          const q = this.portal(p.to.portal);
          const fx = this.frameX(p) ?? (q && this.frameX(q));
          const d = fx === null || fx === undefined ? null : Math.abs(fx - this.seamEdge(p));
          if (d === null) out.push(`${where}: seam prop "${p.seam.prop}" is not placed in ${a.id} or ${b.id}`);
          else if (d > FRAME_REACH) out.push(`${where}: seam prop "${p.seam.prop}" stands ${Math.round(d / T)} tiles from the seam (max ${FRAME_REACH / T})`);
        }
      }
    }
    // rooms must not overlap in the world
    const list = [...this.rooms.values()];
    for (let i = 0; i < list.length; i++)
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i];
        const b = list[j];
        if (a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1) out.push(`rooms ${a.id} and ${b.id} overlap in the world`);
      }
    return out;
  }
}

export default RoomGraph;
