// Content checks for framework dreams (src/dreams/<id>/dream.js), run by
// `npm run lint:content`. Pure (no fs, no Phaser): the unit tests call it.
// Every issue returned here FAILS the lint:
//   graph       portals pair up and point back, seams share an edge and carry
//               a physical seam prop, rooms do not overlap
//   reach       every room is reachable from the start through portals; in each
//               room every portal, NPC, encounter, checkpoint and orb can be
//               reached on foot from the room's entrances (a jump model:
//               up to 4 tiles up, 5 across)
//   headroom    standing spots under a ceiling have ≥ 3 clear tiles (80 px Jo)
//   stand       spawns, portals, NPCs, checkpoints, encounters stand on a floor
//   refs        materials, props, decor rules, backdrop sets, conversations,
//               barks' speakers, encounters, beats all exist; objectives resolve
//   rules       objective per room (≤ 64 chars, first entry unconditional),
//               checkpoint id + label, requirement gates have hints, verbs ≤ 2 keys
//   perf        per room: live dynamic objects ≤ 800, painted height ≤ 2048 px,
//               backdrop layers ≤ 2× the viewport wide
import { RoomGraph } from '../../src/world/RoomGraph.js';
import { headroomSpans, gridView, DECOR_WHEN } from '../../src/world/terrainRules.js';
import { conversationIssues } from '../../src/narrative/DialogueRunner.js';
import { roleOf, isSolidChar, isSlopeChar } from '../../src/builders/legend.js';

export const T = 32;
export const ROOM_DYNAMIC_MAX = 800;
export const MAX_ROOM_PX = 2048;
export const BACKDROP_LAYER_MAX = 1920;
export const OBJECTIVE_MAX = 64;
export const CHECKPOINT_LABEL_MAX = 24;
export const GATE_HINT_MAX = 40;
export const HEADROOM = 3;
const JUMP_UP = 4;
const JUMP_ACROSS = 5;

const floorAt = (v, x, y) => v.solid(x, y) || v.role(x, y) === 'oneway' || isSlopeChar(v.ch(x, y) || '.');
const standable = (v, x, y) => y >= 0 && y < v.h && x >= 0 && x < v.w && !v.solid(x, y) && floorAt(v, x, y + 1);

// tiles Jo can reach on foot in one room from `starts` ([x, y] standing tiles)
export function reachableTiles(grid, starts) {
  const v = gridView(grid);
  const seen = new Set();
  const key = (x, y) => `${x},${y}`;
  const q = [];
  for (const [x, y] of starts) {
    // an entrance may be authored on a tile that is in the air: fall to the floor
    let yy = y;
    while (yy < v.h - 1 && !standable(v, x, yy) && !v.solid(x, yy)) yy++;
    if (standable(v, x, yy)) q.push([x, yy]);
  }
  // the column under (x, y) down to the first floor
  const fall = (x, y) => {
    let yy = y;
    while (yy < v.h - 1 && !floorAt(v, x, yy + 1)) {
      yy++;
      if (v.solid(x, yy)) return null;
    }
    return standable(v, x, yy) ? [x, yy] : null;
  };
  // ladders ('H', THE MASTER'S LADDER's scaffolds): Jo climbs a ladder column
  // up and down, and steps or drops off it sideways
  const ladder = (x, y) => v.role(x, y) === 'ladder';
  while (q.length) {
    const [x, y] = q.shift();
    const k = key(x, y);
    if (seen.has(k)) continue;
    seen.add(k);
    const next = [];
    if (ladder(x, y) || ladder(x, y + 1) || ladder(x, y + 2)) {
      // up a rung; out of the top through a deck plank, standing on it
      if (ladder(x, y) && y > 0 && !v.solid(x, y - 1)) next.push(v.role(x, y - 1) === 'oneway' && standable(v, x, y - 2) ? [x, y - 2] : [x, y - 1]);
      // down a rung, or down through the deck plank Jo stands on
      if (ladder(x, y + 1)) next.push([x, y + 1]);
      else if (v.role(x, y + 1) === 'oneway' && ladder(x, y + 2)) next.push([x, y + 2]);
      for (const dx of [-1, 1]) {
        if (v.solid(x + dx, y)) continue;
        if (standable(v, x + dx, y)) next.push([x + dx, y]);
        else {
          const f = fall(x + dx, y);
          if (f) next.push(f);
        }
      }
      if (!standable(v, x, y)) {
        for (const n of next) if (!seen.has(key(n[0], n[1]))) q.push(n);
        continue;
      }
    }
    for (const dx of [-1, 1]) {
      if (!v.solid(x + dx, y)) {
        if (standable(v, x + dx, y)) next.push([x + dx, y]);
        else {
          const f = fall(x + dx, y);
          if (f) next.push(f);
        }
      }
      // a slope or step: one tile up beside
      if (standable(v, x + dx, y - 1)) next.push([x + dx, y - 1]);
    }
    // jumps: any standable tile up to 4 up and 5 across with a clear column above Jo
    for (let dy = 0; dy <= JUMP_UP; dy++) {
      if (v.solid(x, y - dy)) break;
      for (let dx = -JUMP_ACROSS; dx <= JUMP_ACROSS; dx++) {
        const tx = x + dx;
        const ty = y - dy;
        if (standable(v, tx, ty)) next.push([tx, ty]);
        // landing lower after the jump
        if (dy === 0 && dx !== 0 && !v.solid(tx, ty)) {
          const f = fall(tx, ty);
          if (f) next.push(f);
        }
      }
    }
    for (const n of next) if (!seen.has(key(n[0], n[1]))) q.push(n);
  }
  return seen;
}

function objectiveText(def, entry) {
  return (def.objectives && def.objectives[entry]) || entry;
}

export function dreamIssues(def, { materials = {}, props = {}, decorRules = {}, viewW = 960 } = {}) {
  const out = [];
  const id = def.id;
  let graph;
  try {
    graph = RoomGraph.fromDefinition(def);
  } catch (e) {
    return [`${id}: ${e.message}`];
  }
  for (const i of graph.validate()) out.push(`${id}: ${i}`);
  // the graph: every room reachable from the start
  if (!def.start || !graph.room(def.start.room)) out.push(`${id}: start room "${def.start && def.start.room}" does not exist`);
  else {
    const reach = graph.reachable(def.start.room);
    for (const rid of graph.ids()) if (!reach.has(rid)) out.push(`${id}/${rid}: not reachable from ${def.start.room} through portals`);
  }
  const mats = { ...materials, ...(def.materials || {}) };
  const allProps = { ...props, ...(def.props || {}) };
  const rules = { ...decorRules, ...(def.decorRules || {}) };
  const convs = def.conversations || {};
  const cast = def.cast || {};
  const beats = def.beats || {};
  const cpSeen = new Set();
  for (const r of graph.rooms.values()) {
    const room = r.data;
    const where = `${id}/${room.id}`;
    const v = gridView(room.grid);
    if (new Set(room.grid.map((g) => g.length)).size > 1) out.push(`${where}: grid rows differ in length`);
    // headroom for the 80 px Jo (an error in framework rooms)
    const low = headroomSpans(room.grid, HEADROOM);
    if (low.length) out.push(`${where}: ${low.length} standing tile(s) with < ${HEADROOM} tiles of headroom (first at col ${low[0][0]} row ${low[0][1]})`);
    // materials, decor, props, backdrop
    for (const m of [room.material, ...(room.regions || []).map((g) => g.material)]) if (!mats[m]) out.push(`${where}: unknown material "${m}"`);
    for (const d of room.decor || []) {
      if (!rules[d]) out.push(`${where}: unknown decor rule "${d}"`);
      else if (!DECOR_WHEN.includes(rules[d].when)) out.push(`${where}: decor rule ${d} has an unknown 'when'`);
    }
    for (const p of room.props || []) if (!allProps[p.prop]) out.push(`${where}: unknown prop "${p.prop}"`);
    if (room.backdrop && !(def.backdrops || {})[room.backdrop.set]) out.push(`${where}: unknown backdrop set "${room.backdrop.set}"`);
    // objective
    const o = room.objective;
    const list = typeof o === 'string' ? [{ text: o }] : Array.isArray(o) ? o.map((e) => (typeof e === 'string' ? { text: e } : e)) : null;
    if (!list || !list.length) out.push(`${where}: room has no objective`);
    else {
      if (list[0].flag) out.push(`${where}: the first objective entry must be unconditional`);
      for (const e of list) {
        const t = objectiveText(def, e.text);
        if (!t) out.push(`${where}: an objective entry has no text`);
        else if (t.length > OBJECTIVE_MAX) out.push(`${where}: objective "${t}" is over ${OBJECTIVE_MAX} chars`);
      }
    }
    // entities
    const starts = [];
    const targets = [];
    for (const e of room.entities || []) {
      const at = `${where} ${e.type} ${e.id || ''}`.trim();
      if (['spawn', 'portal', 'npc', 'checkpoint', 'encounter'].includes(e.type)) {
        if (!standable(v, e.x, e.y)) out.push(`${at}: (${e.x},${e.y}) is not a standing tile (open, with a floor under it)`);
        if (e.type === 'spawn' || e.type === 'portal') starts.push([e.x, e.y]);
        targets.push(e);
      }
      if (e.type === 'orb') targets.push({ ...e, reachAbove: 4 });
      if (e.type === 'checkpoint') {
        if (!e.id) out.push(`${at}: checkpoint has no id`);
        else if (cpSeen.has(e.id)) out.push(`${at}: duplicate checkpoint id`);
        cpSeen.add(e.id);
        if (!e.label) out.push(`${at}: checkpoint has no label`);
        else if (e.label.length > CHECKPOINT_LABEL_MAX) out.push(`${at}: label over ${CHECKPOINT_LABEL_MAX} chars`);
      }
      if (e.type === 'gate' && e.requires && e.requires.length) {
        if (!e.hint) out.push(`${at}: no hint (what opens it?)`);
        else if (e.hint.length > GATE_HINT_MAX) out.push(`${at}: hint over ${GATE_HINT_MAX} chars`);
      }
      if (e.type === 'npc') {
        if (!e.rig && !e.cast) out.push(`${at}: no rig (or cast key)`);
        for (const t of e.talk || []) if (!convs[t.conv]) out.push(`${at}: conversation "${t.conv}" does not exist`);
      }
      if (e.type === 'encounter' && !(def.encounters || {})[e.id]) out.push(`${at}: encounter "${e.id}" is not defined`);
    }
    // on-foot reachability inside the room, from its entrances
    if (starts.length) {
      const seen = reachableTiles(room.grid, starts);
      for (const e of targets) {
        let ok = seen.has(`${e.x},${e.y}`);
        if (!ok && e.reachAbove) for (let dy = 1; dy <= e.reachAbove && !ok; dy++) for (let dx = -2; dx <= 2 && !ok; dx++) ok = seen.has(`${e.x + dx},${e.y + dy}`);
        if (!ok) out.push(`${where} ${e.type} ${e.id || ''}: not reachable on foot from the room's entrances`);
      }
    }
    // perf: dynamic objects (live props, lights, entities) and painted size
    const live = (room.props || []).filter((p) => p.live || p.when || p.unless || (allProps[p.prop] && allProps[p.prop].live)).length;
    const lights = (room.props || []).filter((p) => allProps[p.prop] && allProps[p.prop].light).length + (room.lights || []).length;
    const ents = (room.entities || []).length * 4;
    const chunks = 3 * Math.ceil((v.w * T) / 1024);
    const dyn = live + lights + ents + chunks;
    if (dyn > ROOM_DYNAMIC_MAX) out.push(`${where}: ~${dyn} dynamic objects (budget ${ROOM_DYNAMIC_MAX})`);
    if (v.h * T > MAX_ROOM_PX) out.push(`${where}: ${v.h * T} px tall: a baked layer would exceed ${MAX_ROOM_PX} px`);
  }
  // narrative and beats
  for (const c of Object.values(convs)) for (const i of conversationIssues(c)) out.push(`${id}: ${i}`);
  for (const c of Object.values(convs)) for (const n of Object.values(c.nodes || {})) if (n.who && !cast[n.who]) out.push(`${id}: conversation ${c.id} speaker "${n.who}" is not in the cast`);
  for (const b of def.barks || []) {
    if (!cast[b.who]) out.push(`${id}: bark ${b.id} speaker "${b.who}" is not in the cast`);
    if (b.channel !== 'caption') out.push(`${id}: bark ${b.id} must be on the caption channel`);
    if (b.when && b.when.room && !graph.room(b.when.room)) out.push(`${id}: bark ${b.id} names room "${b.when.room}"`);
  }
  for (const [eid, e] of Object.entries(def.encounters || {})) {
    if (typeof e.engine !== 'function') out.push(`${id}: encounter ${eid} has no engine`);
    if (e.onWin && !beats[e.onWin]) out.push(`${id}: encounter ${eid} onWin beat "${e.onWin}" does not exist`);
  }
  if (def.onStart && !beats[def.onStart]) out.push(`${id}: onStart beat "${def.onStart}" does not exist`);
  for (const [bid, steps] of Object.entries(beats)) {
    for (const st of steps) {
      if (st.talk && !convs[st.talk]) out.push(`${id}: beat ${bid} talks "${st.talk}" which does not exist`);
      if (st.encounter && !(def.encounters || {})[st.encounter]) out.push(`${id}: beat ${bid} starts encounter "${st.encounter}" which does not exist`);
      if (st.objective && !(def.objectives || {})[st.objective] && st.objective.length > OBJECTIVE_MAX) out.push(`${id}: beat ${bid} objective is over ${OBJECTIVE_MAX} chars`);
    }
  }
  for (const vb of def.verbs || []) if ((vb.keys || []).length > 2) out.push(`${id}: verb ${vb.id} uses ${vb.keys.length} action keys (max 2)`);
  // backdrops: layers are LAYER_W wide (tiled), within 2× the viewport
  for (const [sid, set] of Object.entries(def.backdrops || {})) if ((set.layerW || 1024) > BACKDROP_LAYER_MAX || (set.layerW || 1024) > 2 * viewW) out.push(`${id}: backdrop ${sid} layer too wide`);
  return out;
}

void roleOf;
void isSolidChar;
