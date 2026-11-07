// The scale lint (round 2 WP2, critique §7): every character and prop the
// play plane shows, measured against src/data/scale.js.
//   people     the rigged cast's drawn height (public/atlas/index.json
//              castReport, written by the atlas bake) vs their body class
//   creatures  the opaque height of their baked placeholder frame
//   props      the prop kit's drawn grid (src/art/propKit.js) vs PROP_TABLE
// Anything outside its class range by more than TOL is an ERROR, unless it is
// listed in SCALE_EXCEPTIONS (then it is reported as owned elsewhere).
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const BODY_CLASS = { m: 'adult', f: 'adult', big: 'big', elderly: 'elderly', teen: 'teen', child: 'child' };

export async function scaleIssues(ROOT) {
  const imp = (p) => import(pathToFileURL(path.join(ROOT, p)).href);
  const S = await imp('src/data/scale.js');
  const { propRows } = await imp('src/art/propKit.js');
  const { decodePNG } = await imp('scripts/lib/png.js');
  const R = await imp('scripts/lib/raster.js');
  const out = { errors: [], exceptions: [], measured: [] };
  const within = (v, [lo, hi]) => v >= lo * (1 - S.TOL) && v <= hi * (1 + S.TOL);
  const check = (key, kind, cls, h, range) => {
    const ok = within(h, range);
    out.measured.push({ key, kind, cls, h, range, ok });
    if (ok) return;
    if (S.SCALE_EXCEPTIONS[key]) out.exceptions.push({ key, h, range, owner: S.SCALE_EXCEPTIONS[key] });
    else out.errors.push({ key, kind, cls, h, range });
  };

  // people
  const idx = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/atlas/index.json'), 'utf8'));
  if (!idx.castReport) out.errors.push({ key: '(atlas)', kind: 'people', cls: '-', h: 0, range: [0, 0], note: 'no castReport: run npm run atlas' });
  for (const r of idx.castReport || []) {
    const cls = BODY_CLASS[r.body] || 'adult';
    check(r.key, 'person', cls, r.h, S.CLASSES[cls].h);
  }

  // creatures: their baked placeholder frames
  const frames = new Map();
  for (const p of idx.packs) {
    if (p.kind !== 'placeholder') continue;
    const json = JSON.parse(fs.readFileSync(path.join(ROOT, 'public', p.json), 'utf8'));
    let img = null;
    for (const [name, f] of Object.entries(json.frames)) {
      const base = Object.keys(S.CREATURE_TABLE).find((k) => name === k || (name.startsWith(k) && /^[0-9-]/.test(name.slice(k.length))));
      if (!base || name.includes('#') || /-(fly|sleep|lie)$/.test(name)) continue;
      img ||= decodePNG(fs.readFileSync(path.join(ROOT, 'public', p.png)));
      const b = R.bbox(R.crop(img, f.frame.x, f.frame.y, f.frame.w, f.frame.h));
      if (!b) continue;
      const prev = frames.get(base);
      frames.set(base, Math.max(prev || 0, b.h));
    }
  }
  for (const [key, cls] of Object.entries(S.CREATURE_TABLE)) {
    const h = frames.get(key);
    if (h == null) continue;
    check(key, 'creature', cls, h, S.CLASSES[cls].h);
  }

  // props
  for (const [key, cls] of Object.entries(S.PROP_TABLE)) {
    const pr = propRows(key);
    if (!pr) {
      out.errors.push({ key, kind: 'prop', cls, h: 0, range: S.PROP_CLASSES[cls].h, note: 'no prop-kit drawing' });
      continue;
    }
    const filled = pr.rows.map((r) => [...r].some((c) => c !== '.'));
    const h = (filled.lastIndexOf(true) - filled.indexOf(true) + 1) * 2;
    check(key, 'prop', cls, h, S.PROP_CLASSES[cls].h);
  }
  await trainKitChecks(imp, S, check); // round 2 WP3
  await carKitChecks(imp, R, check);
  for (const [key, [, h, cls]] of Object.entries(S.CLOCK_PROP_SIZES)) check(key, 'prop', cls, h, S.PROP_CLASSES[cls].h);
  // the Evening's painted arch and rope swing (not kit grids)
  check('ev-arch', 'prop', 'gateArch', S.EVENING_ARCH.h, S.PROP_CLASSES.gateArch.h);
  check('ev-arch (opening / Jo)', 'prop', 'gateArch', +(S.EVENING_ARCH.openH / S.JO.withHat).toFixed(2), [1.25, 1.4]);
  check('rope swing (bough)', 'prop', 'swingBough', S.px(S.ROPE_SWING.boughM), S.PROP_CLASSES.swingBough.h);
  check('ev-wheat', 'prop', 'wheat', S.WHEAT_PX[1], S.PROP_CLASSES.wheat.h);
  check('rope swing (seat)', 'prop', 'swingSeat', S.px(S.ROPE_SWING.seatM), S.PROP_CLASSES.swingSeat.h);
  // round 2 WP4: trees, fronts and backdrop rows
  const { checkBackdrops } = await imp('scripts/lib/backdrop-check.js');
  checkBackdrops(S, check, out);
  // the rest of the listed exceptions (not measured here)
  for (const [key, owner] of Object.entries(S.SCALE_EXCEPTIONS)) if (!out.exceptions.some((e) => e.key === key)) out.exceptions.push({ key, h: null, range: null, owner });
  return out;
}

// THE LONG STRAIGHT's cars, measured off the baked frames: 3.8 m long, 1.1 m to
// the scuttle (the wheel sits on the frame's last row), the driver's head over it
async function carKitChecks(imp, R, check) {
  const { carFrames, CAR_SIZE, LIVERIES } = await imp('src/art/carKit.js');
  const frames = carFrames();
  for (const id of Object.keys(LIVERIES)) {
    const b = R.bbox(frames[`car-${id}`]);
    check(`car-${id} (length, px)`, 'prop', 'car', b.w, [160, 174]);
    check(`car-${id} (head over the road, px)`, 'prop', 'car', CAR_SIZE.frameH - b.y, [52, 64]);
  }
  const w = R.bbox(frames['wheel-0']);
  check('wheel (px)', 'prop', 'car', w.h, [26, 30]);
}

// round 2 WP3: the train kit and the station furniture are painted in code
// from metres (src/art/trainKit.js); each painted canvas is filled to its
// height, so the drawn size is the TRAIN_KIT_SIZES entry. Also checks the
// two §7.3 acceptance ratios: the carriage ≥ 2.1 × Jo, its door ≥ 1.15 × Jo.
async function trainKitChecks(imp, S, check) {
  const { TRAIN_KIT_SIZES } = await imp('src/art/trainKit.js');
  for (const [key, [w, h, cls]] of Object.entries(TRAIN_KIT_SIZES)) {
    const c = S.PROP_CLASSES[cls];
    check(key, 'prop', cls, h, c.h);
    if (c.w) check(`${key} (width)`, 'prop', cls, w, c.w);
  }
  check('hub-pigeon-16', 'creature', 'pigeon', 13, S.CLASSES.pigeon.h);
  const [, endH] = TRAIN_KIT_SIZES['hub-carriage-end'];
  const [, doorH] = TRAIN_KIT_SIZES['train-carriage-door'];
  check('train-scale (carriage / Jo)', 'prop', 'carriageEnd', +(endH / S.JO.withHat).toFixed(2), [2.1, 2.3]);
  check('train-scale (door / Jo body)', 'prop', 'carriageDoor', +(doorH / S.JO.body).toFixed(2), [1.15, 1.25]);
}
