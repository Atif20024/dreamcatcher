// Round 2 WP2 (critique §7, the scale system): `scale-<place>` in each of
// the nine places measures what is on the play plane, on screen, against Jo:
//   people/foes  the opaque height of the frame they show × their scale:
//                adults, teens, elderly and big bodies 0.82–1.12 × Jo (82 px
//                with his hat), children 0.58–0.78 × Jo, each also inside its
//                src/data/scale.js class range
//   doors        ≥ 1.15 × Jo (3 tiles)
//   kit props    inside their PROP_CLASSES range (benches, desks, lamps …)
// Seated, lying or tumbling frames and depth-band crowds (scale < 0.95) are
// listed, not judged. `detail.near` gives Jo's nearest neighbours' ratios.
import { CLASSES, CAST_BODIES, PROP_TABLE, PROP_CLASSES, CREATURE_TABLE, TOL, JO } from '../../data/scale.js';
import { atlasIndex } from '../../art/baked.js';

const PLACES = [
  ['hub', null], ['chef', null], ['musician', null], ['astronaut', 'gym'], ['writer', 'attic'], ['painter', 'arrival'], ['gambler', 'arrival'], ['evening', 'square'], ['clockmaker', 'start'],
];
const PERSON = /^(hub-|ev-p-|ev-x-|wr-p-|pt-p-|gm-p-|npc-|foe-|mus-critic)/;
const BODY = { m: 'adult', f: 'adult', big: 'big', elderly: 'elderly', teen: 'teen', child: 'child' };
const DOORS = new Set(Object.keys(PROP_TABLE).filter((k) => /door/.test(PROP_TABLE[k]) || PROP_TABLE[k] === 'door'));

const box = new Map();
// opaque height of a texture frame (cached)
function opaqueH(o) {
  const f = o.frame;
  const id = `${o.texture.key}|${f.name}`;
  if (box.has(id)) return box.get(id);
  const src = f.source.image;
  const c = document.createElement('canvas');
  c.width = f.cutWidth;
  c.height = f.cutHeight;
  const ctx = c.getContext('2d');
  let h = f.cutHeight;
  try {
    ctx.drawImage(src, f.cutX, f.cutY, f.cutWidth, f.cutHeight, 0, 0, f.cutWidth, f.cutHeight);
    const d = ctx.getImageData(0, 0, c.width, c.height).data;
    let top = -1;
    let bot = -1;
    for (let y = 0; y < c.height; y++) {
      for (let x = 0; x < c.width; x++)
        if (d[(y * c.width + x) * 4 + 3] > 40) {
          if (top < 0) top = y;
          bot = y;
          break;
        }
    }
    h = top < 0 ? 0 : bot - top + 1;
  } catch {
    /* cross-origin or empty: fall back to the frame */
  }
  box.set(id, h);
  return h;
}
const baseKey = (k) => k.replace(/#\d+$/, '').replace(/-(free|stand|walk|run|idle|talk|wave|alert|windup|grab|throw|search|stagger)(#\d+)?$/, '').replace(/-free$/, '').replace(/~b$/, '');
function personClass(key) {
  if (key === 'wren' || key === 'jo') return 'adult';
  const b = baseKey(key);
  const spec = CAST_BODIES[b];
  if (spec && spec.body) return BODY[spec.body] || 'adult';
  if (/kid/.test(b) && !/gm-p-kid/.test(b)) return 'child';
  return 'adult';
}

export function measureScale(sc) {
  const p = sc.player;
  const joH = JO.withHat;
  const people = [];
  const props = [];
  const skipped = [];
  const bad = [];
  const idx = atlasIndex();
  const seated = new Set(((idx && idx.castReport) || []).flatMap((r) => r.seated || []));
  const creature = (k) => Object.keys(CREATURE_TABLE).find((c) => k === c || (k.startsWith(c) && /^[0-9#-]/.test(k.slice(c.length))));
  for (const o of sc.children.list) {
    if (o.texture && o.visible && o.scrollFactorX === 1 && !/-(fly|sleep|lie)$/.test(o.texture.key)) {
      const c = creature(o.texture.key);
      if (c) {
        const h = Math.round(opaqueH(o) * Math.abs(o.scaleY));
        const [lo, hi] = CLASSES[CREATURE_TABLE[c]].h;
        const rec = { key: o.texture.key, x: Math.round(o.x), y: Math.round(o.y), h, cls: CREATURE_TABLE[c], ratio: +(h / JO.withHat).toFixed(2), d: Math.round(Math.abs(o.x - sc.player.x)) };
        props.push(rec);
        if (h < lo * (1 - TOL) - 1 || h > hi * (1 + TOL) + 1) bad.push({ ...rec, range: [lo, hi] });
        continue;
      }
    }
    if (!o.texture || !o.visible || o.alpha < 0.3 || o.scrollFactorX !== 1 || o === p) continue;
    const key = o.texture.key;
    // a rigged person: a cast key whose frame carries the bake's foot pivot
    const isPerson = !PROP_TABLE[key] && ((PERSON.test(key) && o.frame && o.frame.customPivot) || key === 'wren');
    const cls = PROP_TABLE[key];
    if (!isPerson && !cls) continue;
    if (isPerson && /^foe-/.test(key) && !o.body) continue; // creature-only frames
    if (isPerson && /^(foe-(rat|crawler|pigeon|crow|grease|mill|meringue|cart|walker|wisp|slip))/.test(key)) continue;
    if (o.isTinted && o.tintFill) continue; // rim-light copies
    const h = Math.round(opaqueH(o) * Math.abs(o.scaleY));
    const at = { key, x: Math.round(o.x), y: Math.round(o.y), h };
    if (isPerson) {
      if (seated.has(key) || /\/hat$/.test((o.frame && o.frame.name) || '') || /-(sit|sitlaugh)$|^mus-critic|-throw|-windup|-grab/.test(key) || Math.abs(o.angle) > 12 || (o.frame && /sit|sleep|death|float/.test(o.frame.name))) {
        skipped.push({ ...at, why: 'pose' });
        continue;
      }
      if (Math.abs(o.scaleX) < 0.95) {
        skipped.push({ ...at, why: `depth band ×${o.scaleX.toFixed(2)}` });
        continue;
      }
      const pc = personClass(key);
      const r = h / joH;
      const [lo, hi] = CLASSES[pc].h;
      const ratioOk = pc === 'child' ? r >= 0.58 && r <= 0.78 : r >= 0.82 && r <= 1.12;
      const rangeOk = h >= lo * (1 - TOL) && h <= hi * (1 + TOL);
      const rec = { ...at, cls: pc, ratio: +r.toFixed(2), d: Math.round(Math.abs(o.x - p.x)) };
      people.push(rec);
      if (!ratioOk || !rangeOk) bad.push({ ...rec, want: pc === 'child' ? '0.58–0.78×Jo' : '0.82–1.12×Jo', range: [lo, hi] });
    } else {
      const [lo, hi] = PROP_CLASSES[cls].h;
      const rec = { ...at, cls, ratio: +(h / joH).toFixed(2), d: Math.round(Math.abs(o.x - p.x)) };
      props.push(rec);
      const okRange = h >= lo * (1 - TOL) && h <= hi * (1 + TOL);
      const okDoor = !DOORS.has(key) || h >= 1.15 * joH;
      if (!okRange || !okDoor) bad.push({ ...rec, range: [lo, hi] });
    }
  }
  const near = [...people, ...props].sort((a, b) => a.d - b.d).slice(0, 8).map((r) => `${r.key} ${r.h}px ×${r.ratio}`);
  return { people: people.length, props: props.length, bad, near, skipped: skipped.length };
}

async function arrive(dc, dream, place) {
  dc.warp(dream, place);
  for (let i = 0; i < 300; i++) {
    const sc = dc.scene();
    if (sc && sc.player && sc.sys.settings.key !== 'Title' && sc.cameras && sc.cameras.main) break;
    await new Promise((r) => setTimeout(r, 20));
    dc.step(2);
  }
  dc.step(120);
  return dc.scene();
}

const placeScenario = ([dream, place]) => ({
  id: `scale-${dream}`,
  expect: 'pass',
  async run(dc) {
    const sc = await arrive(dc, dream, place);
    const m = measureScale(sc);
    return { pass: m.bad.length === 0 && m.people + m.props > 0, detail: { jo: JO.withHat, ...m, bad: m.bad.slice(0, 20) } };
  },
});

export default PLACES.map(placeScenario);
