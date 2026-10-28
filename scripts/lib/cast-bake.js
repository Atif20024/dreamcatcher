// The cast bake (round 2 WP2): every person texture the scenes use — hub
// regulars, the Evening's town, the writer's/painter's/gambler's people,
// musician and astronaut NPCs, every human foe — rebuilt as a rig at Jo's
// scale (src/art/rig/cast.js) and baked under the SAME keys, plus the new
// animation frames (idle, talk, wave; for foes alert, windup, grab, throw,
// search). Frames of one character share one canvas whose bottom edge is the
// ground and whose centre is the foot anchor.
//
// Pivots: scenes that place a person with origin (0.5, 1) get a foot pivot;
// the older center-origin callers (hub, musician/astronaut NPCs, foes) get a
// pivot that keeps the feet exactly where the old 48 px image put them, so
// the figure grows upward from the same floor.
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import * as R from './raster.js';

const SIL = [0x1c1e26, 0x262a34, 0x30323e, 0x3a3c4a];

export async function bakeCast(ROOT, store) {
  const imp = (p) => import(pathToFileURL(path.join(ROOT, p)).href);
  const { castRig, castPoses, composeCast } = await imp('src/art/rig/cast.js');
  const { CAST_BODIES } = await imp('src/data/scale.js');
  const ev = await imp('src/data/evening/cast.js');
  const wr = await imp('src/data/writer/cast.js');
  const pt = await imp('src/data/painter/cast.js');
  const gm = await imp('src/data/gambler/cast.js');
  const { HUB_PEOPLE, HUB_PROP_KEYS } = await imp('src/entities/hubArt.js');
  const props = new Set(HUB_PROP_KEYS); // 'hub-kite' is the kite, not the kid
  const { PEOPLE: FOE_PEOPLE } = await imp('src/entities/foeArt.js');
  const { NPCS: MUS } = await imp('src/themes/musician.js');
  const { NPCS: AST } = await imp('src/themes/astronaut.js');

  // [key, look, family] — family picks the frame map and pivot rule
  const list = [];
  for (const [id, def] of Object.entries(ev.CAST)) list.push([`ev-p-${id}`, def.look, 'people']);
  ev.EXTRAS.forEach((look, i) => list.push([`ev-x-${i}`, look, 'people']));
  for (const [id, look] of Object.entries(wr.PEOPLE)) list.push([`wr-p-${id}`, look, 'people']);
  for (const [id, look] of Object.entries(pt.PEOPLE)) list.push([`pt-p-${id}`, look, 'people']);
  for (const [id, look] of Object.entries(gm.PEOPLE)) list.push([`gm-p-${id}`, look, 'people']);
  for (const [id, def] of Object.entries(HUB_PEOPLE)) list.push([`hub-${id}`, def, 'hub']);
  list.push(['hub-traveler', { hat: 'cap', held: 'case', pal: { H: 0x3a3a44, S: 0x9a8a80, T: 0x4a4a56, P: 0x3a3a44, B: 0x1e1e28, A: 0x5a4a3a } }, 'traveler']);
  for (const [key, def] of Object.entries(FOE_PEOPLE)) list.push([key, { ...def.art.look, pal: def.pal }, 'foe']);
  for (const [key, pal] of Object.entries({ ...MUS, ...AST })) list.push([key, { pal: { ...pal, B: pal.B ?? 0x1e1e28 } }, 'npc']);
  list.push(['npc-kid', { kid: true, pal: { H: 0xc03a2a, S: 0x8a5a3b, T: 0xe8a030, t: 0xb87820, P: 0x3a5a80, B: 0x2a2a32 } }, 'npc']);
  list.push(['mus-critic', { pal: { H: 0x9a9aa8, S: 0xc8a888, T: 0x4a4a5a, t: 0xd8d8d8, P: 0x2a2a34, B: 0x1e1e28 } }, 'npc']);

  const out = []; // { name, img, pivot, pack }
  const report = [];
  const gaits = {};
  const { NO_RUN, IDLE_FPS } = await imp('src/art/rig/gaits.js');
  const RUNNERS = new Set(['pt-p-paul']);
  // foes get a second look (variant 'b') so a line of them never reads as clones
  const variants = [];
  for (const [key, look, family] of list) if (family === 'foe') variants.push([`${key}~b`, look, 'foe', key]);
  for (const [key, look, family, baseKey] of [...list, ...variants]) {
    const specKey = baseKey || key;
    const base = (!props.has(specKey) && store.get(specKey)) || store.get(`${specKey}#1`);
    const oldH = base ? base.img.height : 48;
    const spec = { ...(CAST_BODIES[specKey] || {}), ...(baseKey ? { variant: 'b' } : {}) };
    const rig = castRig(look, spec);
    const held = spec.held || look.held || null;
    const P = castPoses(rig, held, { key: specKey });
    // runs: every foe that moves, the npc movers and the painter's Paul
    const hasRun = (family === 'foe' && !NO_RUN.has(specKey)) || family === 'npc' || RUNNERS.has(specKey);
    const seq = (name, poses, h = held) => poses.map((p) => ({ pose: p, held: h, name }));
    // the frame map: [texture key, pose, held]
    const frames = [];
    const add = (k, f) => frames.push({ key: k, ...f });
    if (family === 'people') {
      add(key, seq(0, P.idle)[0]);
      P.walk.forEach((p, i) => add(`${key}#${i + 1}`, { pose: p, held }));
      add(`${key}-sit`, { pose: P.sit[0], held });
      add(`${key}-laugh`, { pose: P.laugh[0], held });
      add(`${key}-sitlaugh`, { pose: P.sitlaugh[0], held });
      add(`${key}-free`, { pose: P.free[0], held: null });
      P.freewalk.forEach((p, i) => add(`${key}-free#${i + 1}`, { pose: p, held: null }));
    } else if (family === 'hub') {
      if (look.sit) {
        add(key, { pose: P.sit[0], held });
        add(`${key}#1`, { pose: P.sit[1], held });
        add(`${key}-stand`, { pose: P.idle[0], held });
        P.walk.forEach((p, i) => add(`${key}-walk#${i + 1}`, { pose: p, held }));
      } else {
        add(key, { pose: P.idle[0], held });
        P.walk.forEach((p, i) => add(`${key}#${i + 1}`, { pose: p, held }));
      }
    } else if (family === 'traveler') {
      add(key, { pose: P.idle[0], held });
      P.walk.forEach((p, i) => add(`${key}#${i + 1}`, { pose: p, held }));
    } else if (family === 'foe') {
      // the base frame is the first of the signature idle
      add(key, { pose: P.sig[0], held });
      P.walk.forEach((p, i) => add(`${key}#${i + 1}`, { pose: p, held }));
      P.sig.forEach((p, i) => add(`${key}-idle#${i + 1}`, { pose: p, held }));
      for (const a of ['alert', 'windup', 'grab', 'throw', 'search', 'stagger']) P[a].forEach((p, i) => add(`${key}-${a}#${i + 1}`, { pose: p, held: null }));
    } else {
      add(key, { pose: spec.sit ? P.sit[0] : P.idle[0], held });
      P.walk.forEach((p, i) => add(`${key}#${i + 1}`, { pose: p, held }));
    }
    if (hasRun) P.run.forEach((p, i) => add(`${key}-run#${i + 1}`, { pose: p, held }));
    if (family !== 'foe' && family !== 'traveler') {
      // the idle is a task loop: the world looks employed
      P.task.forEach((p, i) => add(`${key}-idle#${i + 1}`, { pose: p, held }));
      P.talk.forEach((p, i) => add(`${key}-talk#${i + 1}`, { pose: p, held }));
      P.wave.forEach((p, i) => add(`${key}-wave#${i + 1}`, { pose: p, held: null }));
    }
    // compose every frame, then one canvas for the character
    if (props.has(key)) frames.splice(0, frames.length, ...frames.filter((f) => f.key !== key));
    const comps = frames.map((f) => composeCast(rig, f.pose, f.held));
    const grids = comps.map((c) => c.grid);
    const M = rig.metrics;
    let minX = M.W, maxX = 0, minY = M.H;
    for (const g of grids)
      for (let y = 0; y < g.h; y++)
        for (let x = 0; x < g.w; x++)
          if (g.px[y * g.w + x]) {
            minX = Math.min(minX, x);
            maxX = Math.max(maxX, x);
            minY = Math.min(minY, y);
          }
    const half = Math.max(M.ax - minX, maxX + 1 - M.ax);
    const x0 = M.ax - half;
    const W = half * 2;
    const H = M.ay - minY;
    const S = 2;
    const Hn = H * S;
    const pivot = family === 'people' ? { x: 0.5, y: 1 } : { x: 0.5, y: +((Hn - oldH / 2) / Hn).toFixed(4) };
    let tall = 0;
    frames.forEach((f, i) => {
      const g = grids[i];
      const img = R.image(W * S, Hn);
      for (let y = 0; y < H; y++)
        for (let x = 0; x < W; x++) {
          const ch = g.px[(y + minY) * g.w + (x + x0)];
          if (!ch) continue;
          let c = rig.palette[ch];
          if (c === undefined) throw new Error(`${key}: no colour for '${ch}'`);
          if (family === 'traveler') {
            const l = ((c >> 16) & 255) * 0.3 + ((c >> 8) & 255) * 0.59 + (c & 255) * 0.11;
            c = ch === 'k' ? SIL[0] : SIL[Math.min(3, 1 + Math.floor(l / 90))];
          }
          for (let dy = 0; dy < S; dy++) for (let dx = 0; dx < S; dx++) R.setPx(img, x * S + dx, y * S + dy, c);
        }
      const ct = comps[i].contacts;
      const contacts = [ct.f, ct.b].filter((c) => c != null).map((c) => (c + M.ax - x0) * S);
      out.push({ name: f.key, img, pivot, foe: family === 'foe', contacts, trim: true });
    });
    // the standing height: the plain standing pose, whatever the base frame is
    {
      const g = composeCast(rig, family === 'foe' ? P.sig[0] : P.idle[0], held).grid;
      let top = g.h;
      let bot = 0;
      for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) if (g.px[y * g.w + x]) (top = Math.min(top, y)), (bot = Math.max(bot, y));
      tall = (bot - top + 1) * S;
    }
    // keys whose frame is a seated pose (a sitter's base, -sit, -sitlaugh)
    const seated = frames.filter((f) => f.pose === P.sit[0] || f.pose === P.sit[1] || f.pose === P.sitlaugh[0]).map((f) => f.key);
    report.push({ key, body: rig.body, h: tall, w: W * S, frames: frames.length, oldH, seated });
    // how the runtime plays it (src/art/stride.js): frames and screen px a frame
    gaits[key] = { gait: P.gait, walk: [P.walk.length, P.walkStep * S], run: hasRun ? [P.run.length, P.runStep * S] : null, runAbove: P.runAbove, idle: [family === 'foe' ? P.sig.length : P.task.length, IDLE_FPS] };
  }
  return { frames: out, report, gaits };
}
