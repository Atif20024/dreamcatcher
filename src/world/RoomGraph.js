// RoomGraph (plan 2.2): a dream's rooms as separate grids placed in one
// world, joined by portals. Pure JS (no Phaser) so it unit-tests in Node and
// the content lint can walk it.
//
//   const g = RoomGraph.fromDefinition(def)      // def.rooms: [roomData]
//   g.room('green')                              // { id, data, tx, ty, w, h, x0, y0, x1, y1 }
//   g.neighbours('green')                        // ids joined by a portal
//   g.blendAt(cx, cy, 'green')                   // { a, b, t, portal } | null (seams)
//   g.commitRoom(cx, cy, prevId)                 // the camera's room, with hysteresis
//   g.roomAt(wx, wy)                             // the room containing a world point
//   g.validate()                                 // [issue strings] (lint)
//
// Two portal kinds (4.3):
//   seam  rooms side by side, crossed continuously; the blend t runs over
//         `seam.width` px (half-width) either side of the shared edge
//   door  a fade through black; the rooms may sit anywhere in the world
// A portal is a room entity: { type:'portal', id, kind, x, y, to:{room, portal} }.
// Ids follow 'from>to' by convention; the pair must point at each other.

export const T = 32;
export const DEFAULT_SEAM_HALF = 300;

export const smoothstep = (e0, e1, x) => {
  const u = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
  return u * u * (3 - 2 * u);
};

const gridW = (grid) => Math.max(...grid.map((r) => r.length));

export class RoomGraph {
  constructor(rooms = []) {
    this.rooms = new Map();
    this.portals = new Map();
    for (const data of rooms) this.add(data);
  }

  static fromDefinition(def) {
    return new RoomGraph(def.rooms || []);
  }

  add(data) {
    if (!data || !data.id) throw new Error('RoomGraph: a room needs an id');
    if (this.rooms.has(data.id)) throw new Error(`RoomGraph: duplicate room "${data.id}"`);
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
        half: (e.seam && e.seam.width) || DEFAULT_SEAM_HALF,
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

  // every seam once, as { left, right, x, half, portal }
  seams() {
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
      const half = Math.min(p.half, 0.45 * left.w * T, 0.45 * right.w * T);
      out.push({ left: left.id, right: right.id, x: right.x0, half, portal: p.id });
    }
    return out;
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

  // The blend across a seam from the camera centre (F5.2): t = smoothstep
  // over [x - half, x + half]. Only seams touching the committed room's zone
  // count, so a far room at the same x (a door interior) never blends in.
  blendAt(cx, cy, currentId) {
    const zone = currentId ? this.zone(currentId) : null;
    let best = null;
    for (const s of this.seams()) {
      if (zone && !(zone.has(s.left) && zone.has(s.right))) continue;
      const d = Math.abs(cx - s.x);
      if (d >= s.half) continue;
      if (!best || d < best.d) best = { a: s.left, b: s.right, t: smoothstep(s.x - s.half, s.x + s.half, cx), portal: s.portal, d, x: s.x };
    }
    if (!best) return null;
    delete best.d;
    return best;
  }

  // The committed room (music, ambience, objective switch at t = 0.5):
  // the camera centre's room, but the previous room is kept until the
  // centre is `band` px past the shared edge, so a wobble on the line never
  // flickers. Rooms outside the previous room's zone are only taken when the
  // centre is inside them (a door moves the camera there directly).
  commitRoom(cx, cy, prevId, band = 1.5 * T) {
    const prev = prevId ? this.room(prevId) : null;
    if (prev) {
      if (this.contains(prev, cx, cy, band)) return prev.id;
      const zone = this.zone(prev.id);
      for (const id of zone) if (this.contains(this.room(id), cx, cy, 0)) return id;
    }
    const r = this.roomAt(cx, cy);
    return r ? r.id : prevId || null;
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
