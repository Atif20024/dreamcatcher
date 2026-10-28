// RoomStreamer (plan 2.2): only the current room and its portal neighbours
// are live. A live room is its baked layers (StaticBaker chunks: back wall +
// props behind, terrain + fringe, foreground frame), merged colliders, live
// props and lights, and the entities the scene spawns for it. Leaving a room
// destroys all of that; its textures stay cached so coming back is instant.
//
//   const rs = new RoomStreamer(scene, { graph, lib, baker, ... })
//   rs.focus('green')     // build green + neighbours, drop the rest
//   rs.live               // Map id → LiveRoom
import Phaser from 'phaser';
import { Terrain } from './Terrain.js';
import { D } from '../builders/depths.js';

export const LAYER_DEPTH = { back: -16, mid: D.TERRAIN, fg: 30 };
const LIVE_DEPTH = { back: -15, mid: -11.5, fg: 31 };

export function ensureGlowTexture(scene) {
  if (scene.textures.exists('dc-glow')) return 'dc-glow';
  const ct = scene.textures.createCanvas('dc-glow', 256, 256);
  const ctx = ct.getContext();
  const g = ctx.createRadialGradient(128, 128, 4, 128, 128, 128);
  g.addColorStop(0, 'rgba(255,255,255,0.9)');
  g.addColorStop(0.25, 'rgba(255,255,255,0.35)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  ct.refresh();
  ct.setFilter(Phaser.Textures.FilterMode.LINEAR);
  return 'dc-glow';
}

export class RoomStreamer {
  constructor(scene, { graph, lib, baker, propsExtra = {}, palette = {}, onSpawn = null, onBuilt = null, onDrop = null, flags = () => ({}) } = {}) {
    this.scene = scene;
    this.graph = graph;
    this.lib = lib;
    this.baker = baker;
    this.propsExtra = propsExtra;
    this.palette = palette;
    this.onSpawn = onSpawn;
    this.onBuilt = onBuilt;
    this.onDrop = onDrop;
    this.flags = flags;
    this.live = new Map();
    this.current = null;
    this.paintMs = {};
    this.grids = { ladderGrid: {}, climbGrid: {}, slopeGrid: {}, solidGrid: {}, surfaceGrid: {} };
    for (const r of graph.rooms.values()) Terrain.fillGrids(this.grids, r);
    ensureGlowTexture(scene);
    scene.events.once('shutdown', () => {
      for (const id of [...this.live.keys()]) this.drop(id);
    });
  }

  build(id) {
    if (this.live.has(id)) return this.live.get(id);
    const r = this.graph.room(id);
    if (!r) throw new Error(`RoomStreamer: no room "${id}"`);
    const s = this.scene;
    const t0 = performance.now();
    const key = `room:${s.dreamId || 'dream'}:${id}`;
    let painted = null;
    if (!this.baker.has(`${key}:mid`)) {
      painted = Terrain.paint(r.data, this.lib, { propsExtra: this.propsExtra, palette: this.palette });
      this.baker.bake(`${key}:back`, painted.back);
      this.baker.bake(`${key}:mid`, painted.mid);
      this.baker.bake(`${key}:fg`, painted.fg);
      this._paintCache = this._paintCache || new Map();
      this._paintCache.set(id, { live: painted.live, lights: painted.lights });
    }
    const meta = (this._paintCache && this._paintCache.get(id)) || { live: [], lights: [] };
    const chunks = (layer) => {
      const out = [];
      for (let i = 0; s.textures.exists(`${key}:${layer}#${i}`); i++) out.push({ key: `${key}:${layer}#${i}`, x: i * 1024 });
      return out;
    };
    const tint = (r.data.light && r.data.light.tint) || 0xffffff;
    const images = [];
    for (const layer of ['back', 'mid', 'fg']) {
      for (const img of this.baker.images(chunks(layer), r.x0, r.y0, LAYER_DEPTH[layer])) {
        if (tint !== 0xffffff) img.setTint(tint);
        if (layer === 'fg' && r.data.enclosure && r.data.enclosure.fgAlpha) img.setAlpha(r.data.enclosure.fgAlpha);
        images.push(img);
      }
    }
    const colliders = Terrain.colliders(s, r);
    const room = { id, r, images, colliders, props: [], lights: [], entities: [], handles: [], surfaceAt: Terrain.surfaceAt(r, this.lib) };
    // live props (lamps that come on, the clock face an encounter animates)
    for (const p of meta.live) {
      const tk = `prop:${p.prop}`;
      if (!s.textures.exists(tk)) s.textures.addCanvas(tk, p.canvas);
      const img = s.add.image(r.x0 + p.rect.x, r.y0 + p.rect.y, tk).setOrigin(0, 0).setDisplaySize(p.rect.w, p.rect.h).setDepth(LIVE_DEPTH[p.layer || 'mid']).setFlipX(!!p.flip);
      if (tint !== 0xffffff) img.setTint(tint);
      img.propDef = p;
      room.props.push(img);
    }
    // lights: additive glows that breathe a little; `when` gates them on a flag
    for (const l of meta.lights) {
      const g = s.add.image(r.x0 + l.x, r.y0 + l.y, 'dc-glow').setBlendMode(Phaser.BlendModes.ADD).setTint(l.color).setDepth(14).setScale((l.r * 2) / 256);
      g.base = 0.42;
      g.when = l.prop && l.prop.when;
      g.unless = l.prop && l.prop.unless;
      g.phase = Math.random() * 10;
      room.lights.push(g);
    }
    this.live.set(id, room);
    for (const e of r.data.entities || []) {
      if (!this.onSpawn) break;
      const made = this.onSpawn(e, room);
      if (made) room.entities.push(made);
    }
    if (this.onBuilt) this.onBuilt(room);
    this.paintMs[id] = Math.round(performance.now() - t0);
    void painted;
    return room;
  }

  drop(id) {
    const room = this.live.get(id);
    if (!room) return;
    if (this.onDrop) this.onDrop(room);
    for (const h of room.handles) if (h && h.destroy) h.destroy();
    for (const e of room.entities) if (e && e.destroy) e.destroy();
    for (const o of [...room.images, ...room.props, ...room.lights]) o.destroy();
    room.colliders.destroy();
    this.live.delete(id);
  }

  // current + neighbours live; everything else dropped
  focus(id) {
    if (!id) return;
    this.current = id;
    const want = new Set([id, ...this.graph.neighbours(id)]);
    for (const k of [...this.live.keys()]) if (!want.has(k)) this.drop(k);
    this.build(id);
    for (const k of want) this.build(k);
  }

  room(id) {
    return this.live.get(id) || null;
  }

  surfaceAt(tx, ty) {
    for (const room of this.live.values()) {
      const s = room.surfaceAt(tx, ty);
      if (s) return s;
    }
    return null;
  }

  // flag-driven props and lights, the lamp flicker
  update(time) {
    const F = this.flags() || {};
    const on = (o) => (!o.when || F[o.when]) && (!o.unless || !F[o.unless]);
    for (const room of this.live.values()) {
      for (const p of room.props) {
        const d = p.propDef;
        p.setVisible(on(d));
      }
      for (const g of room.lights) {
        const vis = on(g);
        g.setVisible(vis);
        if (vis) g.setAlpha(g.base + Math.sin(time / 170 + g.phase) * 0.03 + Math.sin(time / 53 + g.phase * 2) * 0.015);
      }
    }
  }

  stats() {
    let images = 0;
    for (const r of this.live.values()) images += r.images.length + r.props.length + r.lights.length;
    return { live: [...this.live.keys()], images, paintMs: { ...this.paintMs } };
  }
}

export default RoomStreamer;
