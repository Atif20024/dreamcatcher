// MaterialLibrary (plan 2.3.2): material definitions → painted sheets,
// painted once per page and cached. Shared materials live here; a dream adds
// its own in dreams/<id>/materials.js (same shape) and they shadow these.
//
// Material = { id, kind: 'cobble'|'meadow'|'stone'|'boards'|'plaster',
//   surface: 'stone'|'grass'|'wood'|'tile'|'carpet'|'metal' (footsteps),
//   palette: { body, lit, deep, mortar, stone, moss, grass, grassLit, grassDeep, wood, brick, root },
//   variants: 4, decor: [rule ids] (the fringe this material grows) }
import { paintMaterialSheet } from '../art/materials/painters.js';

export const SHARED_MATERIALS = {
  cobble_lane: {
    id: 'cobble_lane', kind: 'cobble', surface: 'stone',
    palette: { body: 0x4a3a34, stone: 0x8a7a72, mortar: 0x2e2630, lit: 0xf2d0a0, deep: 0x1a1420, moss: 0x6a7a3a, root: 0x4a3428 },
    decor: ['weeds', 'pebbles', 'puddles', 'roots'],
  },
  meadow: {
    id: 'meadow', kind: 'meadow', surface: 'grass',
    palette: { body: 0x4a3428, stone: 0x7a6a5a, lit: 0xf2d8a0, deep: 0x1a1218, grass: 0x5a7a34, grassLit: 0xb0c458, grassDeep: 0x34502a, root: 0x5a3e2a },
    decor: ['tufts', 'flowers', 'roots', 'leaves'],
  },
  mossy_stone: {
    id: 'mossy_stone', kind: 'stone', surface: 'stone',
    palette: { body: 0x6a6258, stone: 0x9a9080, mortar: 0x2e2a2e, lit: 0xf0dcb0, deep: 0x1c1822, moss: 0x5a7a34, grassLit: 0xa8c058 },
    decor: ['moss_edges', 'ivy', 'tufts_sparse'],
  },
  oak_boards: {
    id: 'oak_boards', kind: 'boards', surface: 'wood',
    palette: { body: 0x3a2620, wood: 0x8a5a34, lit: 0xf8d8a0, deep: 0x140e12 },
    decor: ['dust', 'webs'],
  },
  plaster_wall: {
    id: 'plaster_wall', kind: 'plaster', surface: 'stone',
    palette: { body: 0xb8a284, brick: 0x8a4a34, mortar: 0x5a4a40, wood: 0x5a3a26, lit: 0xf8e0b0, deep: 0x1c1418 },
    decor: ['webs'],
  },
};

// the shared fringe rules (4.4); a dream may add or override by id
export const SHARED_DECOR_RULES = {
  tufts: { id: 'tufts', when: 'topExposed', place: 'tuft_*', variants: 3, chance: 0.75, layer: 'mid', materials: ['meadow'] },
  tufts_front: { id: 'tufts_front', when: 'topExposed', place: 'tuft_*', variants: 3, chance: 0.22, layer: 'fg', materials: ['meadow'], every: 3 },
  tufts_sparse: { id: 'tufts_sparse', when: 'topExposed', place: 'tuft_*', variants: 2, chance: 0.3, layer: 'mid', materials: ['mossy_stone'] },
  flowers: { id: 'flowers', when: 'topExposed', place: 'flower_*', variants: 3, chance: 0.18, layer: 'mid', materials: ['meadow'], every: 2 },
  leaves: { id: 'leaves', when: 'topExposed', place: 'leaves_*', variants: 2, chance: 0.12, layer: 'mid', materials: ['meadow', 'cobble_lane'], every: 4 },
  weeds: { id: 'weeds', when: 'topExposed', place: 'weed_*', variants: 2, chance: 0.18, layer: 'mid', materials: ['cobble_lane'], every: 3 },
  pebbles: { id: 'pebbles', when: 'wallBase', place: 'pebble_*', variants: 3, chance: 0.8, layer: 'mid' },
  puddles: { id: 'puddles', when: 'hollow', place: 'puddle_*', variants: 2, chance: 0.9, layer: 'mid', materials: ['cobble_lane'], every: 3 },
  roots: { id: 'roots', when: 'ceilingExposed', place: 'roots_*', variants: 3, chance: 0.55, layer: 'mid', materials: ['meadow', 'cobble_lane'] },
  ivy: { id: 'ivy', when: 'ceilingExposed', place: 'ivy_*', variants: 2, chance: 0.4, layer: 'mid', materials: ['mossy_stone'], every: 2 },
  moss_edges: { id: 'moss_edges', when: 'ledgeEdge', place: 'moss_edge_*', variants: 2, chance: 0.9, layer: 'mid', materials: ['mossy_stone', 'meadow'] },
  webs: { id: 'webs', when: 'cornerTop', place: 'web_*', variants: 2, chance: 0.9, layer: 'mid', materials: ['plaster_wall', 'oak_boards'] },
  dust: { id: 'dust', when: 'wallBase', place: 'dust_*', variants: 2, chance: 0.9, layer: 'mid', materials: ['oak_boards'] },
};

const sheets = new Map();

export class MaterialLibrary {
  constructor(extra = {}, extraRules = {}) {
    this.defs = { ...SHARED_MATERIALS, ...extra };
    this.rules = { ...SHARED_DECOR_RULES, ...extraRules };
  }

  def(id) {
    const d = this.defs[id];
    if (!d) throw new Error(`MaterialLibrary: no material "${id}"`);
    return d;
  }

  sheet(id) {
    const d = this.def(id);
    const key = `${id}|${JSON.stringify(d.palette)}|${d.kind}`;
    if (!sheets.has(key)) sheets.set(key, paintMaterialSheet(d));
    return sheets.get(key);
  }

  // the decor rules a room grows: its materials' fringe + its own `decor` ids
  rulesFor(materialIds, extraIds = []) {
    const ids = new Set(extraIds);
    for (const m of materialIds) for (const r of this.def(m).decor || []) ids.add(r);
    return [...ids].map((id) => this.rules[id]).filter(Boolean);
  }
}
