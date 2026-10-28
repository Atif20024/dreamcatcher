// Round 2, WP1 (docs/redesign/round2/02_final_critique.md §10):
//   slope-<place>   walk, jog and run across every slope and stair join of a
//                   site, both ways: per frame |Δy − Δsurface| ≤ 2 px, no
//                   airborne frame, never a rise/apex/fall/land/push pose
//   shadow-jump     a jump from flat ground: the shadow stays at ground y
//                   (±0.5 px), its alpha never rises on the way up
//   shadow-gap      over a pit with no ground within reach it is hidden
//   shadow-slope    on a ramp the shadow sits on the surface under the feet
//   shadow-places   Jo has a ground shadow in every place
// Each returns its worst frames in `detail`.
import { getRun, clearRun } from '../../utils/save.js';

const T = 32;
const DREAM_IDS = ['chef', 'musician', 'astronaut', 'writer', 'painter', 'gambler'];
const BAD_ANIM = /^(rise|apex|fall|land|hard_land|push)$/;

function settle(dc) {
  for (let i = 0; i < 80; i++) {
    const sc = dc.scene();
    const modal = sc && sc.modals && sc.modals.state && sc.modals.state().length;
    if (!sc || !(sc.dialogActive || sc.tutorialActive || sc.cardActive || modal)) break;
    dc.press('action', 2);
    dc.press('Space', 2);
    dc.step(30);
  }
  dc.step(5);
}
const busy = (sc) => !!(sc.dialogActive || sc.tutorialActive || sc.cardActive || (sc.modals && sc.modals.state && sc.modals.state().length));
async function arrive(dc, dream, place) {
  dc.warp(dream, place);
  for (let i = 0; i < 300; i++) {
    const sc = dc.scene();
    if (sc && sc.player && sc.player.anim && sc.sys.settings.key !== 'Title') break;
    await new Promise((r) => setTimeout(r, 20));
    dc.step(2);
  }
  dc.step(90);
  settle(dc);
  const sc = dc.scene();
  if (sc.health) sc.health.setInvulnerable(sc.time.now, 1e9);
  sc.invulnUntil = Infinity;
  return sc;
}

// the scene's own idea of the surface under a column (slopes, live solids,
// one-way tops), independent of the solver it is checking
function surfaceNear(sc, x, y) {
  const sg = sc.slopeGrid || {};
  const so = sc.solidGrid || {};
  const ow = sc.oneWayGrid || (sc.built && sc.built.oneWayGrid) || {};
  const tx = Math.floor(x / T);
  let best = null;
  for (let ty = Math.floor((y - 40) / T); ty <= Math.floor((y + 40) / T); ty++) {
    let s = null;
    const role = sg[ty] && sg[ty][tx];
    if (role) {
      const f = Math.max(0, Math.min(1, x / T - tx));
      const base = role.replace('stair_', '').replace('ow_', '');
      const k = base === 'slope_r' ? 1 - f : base === 'slope_l' ? f : base === 'slope_r_low' ? 1 - f * 0.5 : base === 'slope_r_high' ? 0.5 - f * 0.5 : 0;
      s = ty * T + k * T;
    } else if (so[ty] && so[ty][tx] && !(so[ty - 1] && so[ty - 1][tx]) && !(sg[ty - 1] && sg[ty - 1][tx])) s = ty * T;
    else if (ow[ty] && ow[ty][tx]) s = typeof ow[ty][tx] === 'number' ? ow[ty][tx] : ty * T;
    if (s !== null && (best === null || Math.abs(s - y) < Math.abs(best - y))) best = s;
  }
  return best;
}
const feetX = (b) => b.x + b.width / 2;

// drop Jo on the ground at tile column c (world), searching down from row r
function placeAt(sc, c, r) {
  const p = sc.player;
  const x = c * T + T / 2;
  let s = null;
  for (let y = r * T; y < (r + 12) * T && s === null; y += 4) {
    const v = surfaceNear(sc, x, y);
    if (v !== null && v >= y - 4) s = v;
  }
  const b = p.body;
  const dy = p.y - b.bottom; // sprite y relative to the soles
  p.body.reset(x, (s ?? r * T) + dy - 1);
  p.body.setVelocity(0, 0);
  return s;
}

// one pass: hold a direction until Jo's centre passes `toX`
function pass(dc, sc, dir, toX, frames = 600) {
  const p = sc.player;
  const b = p.body;
  const log = [];
  dc.hold(dir);
  for (let f = 0; f < frames; f++) {
    p.controlLockUntil = 0;
    dc.step(1);
    if (busy(sc)) return { log, interrupted: true };
    log.push({ x: feetX(b), y: b.bottom, down: !!b.blocked.down, anim: p.anim.name });
    if (dir === 'right' ? feetX(b) >= toX : feetX(b) <= toX) break;
  }
  dc.releaseAll();
  return { log, interrupted: false };
}

function judge(sc, log, skip = 6) {
  let maxErr = 0;
  let maxStep = 0;
  let air = 0;
  const bad = new Set();
  const worst = [];
  for (let i = skip + 1; i < log.length; i++) {
    const a = log[i - 1];
    const c = log[i];
    const sa = surfaceNear(sc, a.x, a.y);
    const sb = surfaceNear(sc, c.x, a.y); // nearest to the last feet
    const dy = c.y - a.y;
    const ds = sa !== null && sb !== null ? sb - sa : 0;
    const err = Math.abs(dy - ds);
    maxStep = Math.max(maxStep, Math.abs(dy));
    if (err > maxErr) maxErr = err;
    if (err > 2) worst.push({ x: Math.round(c.x), dy: +dy.toFixed(1), ds: +ds.toFixed(1) });
    if (!c.down) air += 1;
    if (BAD_ANIM.test(c.anim)) bad.add(c.anim);
  }
  return { maxErr: +maxErr.toFixed(2), maxStep: +maxStep.toFixed(2), air, badAnims: [...bad], worst: worst.slice(0, 8), frames: log.length };
}

// a site: tile columns [c0, c1] around the joins, a row above the ground
// there, and an optional room (framework dreams: columns are room-local)
const SITES = [
  { id: 'hub-steps', dream: 'hub', c0: 3, c1: 17, row: 22 },
  { id: 'musician-d0', dream: 'musician', c0: 14, c1: 26, row: 30 },
  { id: 'chef-arrival', dream: 'chef', c0: 14, c1: 26, row: 28 },
  { id: 'chef-freezer-stairs', dream: 'chef', c0: 113, c1: 120, row: 30 },
  { id: 'writer-arrival', dream: 'writer', place: 'arrival', c0: 4, c1: 16, row: 28 },
  { id: 'writer-attic-stairs', dream: 'writer', place: 'attic', c0: 50, c1: 62, row: 23 },
  { id: 'painter-fields', dream: 'painter', place: 'fields', c0: 237, c1: 250, row: 26 },
  { id: 'painter-studio-stairs', dream: 'painter', place: 'studio', c0: 57, c1: 63, row: 31, row1: 28 },
  { id: 'gambler-floor-stairs', dream: 'gambler', place: 'floor', c0: 38, c1: 52, row: 30, row1: 22 },
  { id: 'gambler-carpark', dream: 'gambler', place: 'carpark', c0: 348, c1: 362, row: 22 },
  { id: 'evening-arch', dream: 'evening', place: 'arch', c0: 62, c1: 78, row: 27 },
  { id: 'evening-hill', dream: 'evening', place: 'hill', c0: 338, c1: 360, row: 26, row1: 13 },
  { id: 'proof-yard', dream: 'proof', place: 'yard', room: 'yard', c0: 4, c1: 22, row: 8 },
];
const SPEEDS = [120, 215, 280];

function origin(sc, site) {
  if (!site.room || !sc.graph) return 0;
  const r = sc.graph.rooms.get(site.room);
  return r ? r.tx : 0;
}

const slopeSites = SITES.map((site) => ({
  id: `slope-${site.id}`,
  async run(dc) {
    const sc = await arrive(dc, site.dream, site.place);
    const p = sc.player;
    const ox = origin(sc, site);
    const out = {};
    let pass_ = true;
    const speed0 = p.speed;
    for (const v of site.speeds || SPEEDS) {
      for (const dir of site.upOnly ? ['right'] : ['right', 'left']) {
        let res = null;
        for (let tries = 0; tries < 4; tries++) {
          dc.releaseAll();
          placeAt(sc, (dir === 'right' ? site.c0 : site.c1) + ox, dir === 'right' ? site.row : site.row1 ?? site.row);
          p.speed = v;
          dc.step(12);
          settle(dc);
          const r = pass(dc, sc, dir, ((dir === 'right' ? site.c1 : site.c0) + ox) * T + T / 2);
          if (!r.interrupted) {
            res = r;
            break;
          }
          settle(dc);
        }
        const j = res ? judge(sc, res.log) : { error: 'interrupted' };
        out[`${dir}@${v}`] = j;
        const covered = res && res.log.length && Math.abs(res.log[res.log.length - 1].x - ((dir === 'right' ? site.c1 : site.c0) + ox) * T - T / 2) < T;
        if (!res || j.maxErr > 2 || j.air > 0 || j.badAnims.length || !covered) pass_ = false;
        j.covered = !!covered;
      }
    }
    p.speed = speed0;
    dc.releaseAll();
    return { pass: pass_, detail: out };
  },
}));

// ---- the shadow ------------------------------------------------------------
const shadowOf = (p) => p.shadow && p.shadow.state && p.shadow.state();

const shadowJump = {
  id: 'shadow-jump',
  async run(dc) {
    const sc = await arrive(dc, 'chef');
    const p = sc.player;
    placeAt(sc, 8, 28);
    dc.step(20);
    const g0 = p.body.bottom;
    dc.press('jump', 14);
    const log = [];
    for (let f = 0; f < 70; f++) {
      dc.step(1);
      const s = shadowOf(p);
      if (!s) return { pass: false, detail: { error: 'no player.shadow' } };
      log.push({ h: +(s.groundY - p.body.bottom).toFixed(1), y: s.y, a: +s.alpha.toFixed(3), vy: Math.round(p.body.velocity.y), visible: s.visible });
      if (p.body.blocked.down && f > 10) break;
    }
    const ys = log.map((l) => l.y);
    const yDrift = Math.max(...ys.map((y) => Math.abs(y - ys[0])));
    let alphaUp = 0;
    for (let i = 1; i < log.length; i++) if (log[i].vy < 0 && log[i].a > log[i - 1].a + 1e-6) alphaUp += 1;
    const maxH = Math.max(...log.map((l) => l.h));
    const minAlpha = Math.min(...log.map((l) => l.a));
    return { pass: yDrift <= 0.5 && alphaUp === 0 && maxH > 60 && minAlpha < log[0].a, detail: { ground: g0, yDrift, alphaUp, maxH, minAlpha, strip: log.filter((_, i) => i % 4 === 0) } };
  },
};

// over the musician's d0 hole / any pit: no ground within 320 px → hidden
const shadowGap = {
  id: 'shadow-gap',
  async run(dc) {
    const sc = await arrive(dc, 'chef');
    const p = sc.player;
    // find a column with no surface within 320 px below a point in the air
    const y = 20 * T;
    let col = null;
    for (let c = 4; c < 200 && col === null; c++) {
      const x = c * T + T / 2;
      let any = false;
      for (let yy = y; yy <= y + 330; yy += 8) if (surfaceNear(sc, x, yy) !== null && surfaceNear(sc, x, yy) >= y) any = true;
      if (!any) col = c;
    }
    const s0 = shadowOf(p);
    if (!s0) return { pass: false, detail: { error: 'no player.shadow' } };
    // a far drop: Jo held in the air over flat ground 260 px up → hidden too
    p.body.setAllowGravity(false);
    placeAt(sc, 8, 28);
    dc.step(5);
    const floor = p.body.bottom;
    p.body.reset(p.x, p.y - 260);
    dc.step(2);
    const high = shadowOf(p);
    let gap = null;
    if (col !== null) {
      p.body.reset(col * T + T / 2, y);
      dc.step(2);
      gap = shadowOf(p);
    }
    p.body.setAllowGravity(true);
    placeAt(sc, 8, 28);
    dc.step(10);
    return { pass: !high.visible && (gap === null || !gap.visible), detail: { floor, high, gapCol: col, gap } };
  },
};

const shadowSlope = {
  id: 'shadow-slope',
  async run(dc) {
    const sc = await arrive(dc, 'musician');
    const p = sc.player;
    placeAt(sc, 14, 30);
    p.speed = 120;
    dc.step(10);
    dc.hold('right');
    let worst = 0;
    let onRamp = 0;
    for (let f = 0; f < 200 && feetX(p.body) < 24 * T; f++) {
      dc.step(1);
      const s = shadowOf(p);
      if (!s) return { pass: false, detail: { error: 'no player.shadow' } };
      const surf = surfaceNear(sc, feetX(p.body), p.body.bottom);
      if (surf !== null && (sc.slopeGrid[Math.floor((surf - 1) / T)] || {})[Math.floor(feetX(p.body) / T)]) onRamp += 1;
      if (surf !== null) worst = Math.max(worst, Math.abs(s.groundY - surf));
    }
    dc.releaseAll();
    p.speed = 280;
    return { pass: worst <= 1 && onRamp > 5, detail: { worst, onRamp } };
  },
};

const PLACES = [
  ['hub', null], ['chef', null], ['musician', null], ['astronaut', 'gym'], ['writer', 'attic'], ['painter', 'arrival'], ['gambler', 'arrival'], ['evening', 'arch'], ['proof', 'start'],
];
const shadowPlaces = {
  id: 'shadow-places',
  async run(dc) {
    const out = {};
    let ok = true;
    for (const [d, place] of PLACES) {
      const sc = await arrive(dc, d, place);
      const p = sc.player;
      dc.step(20);
      const s = shadowOf(p);
      out[d] = s ? { visible: s.visible, h: +(s.groundY - p.body.bottom).toFixed(1), alpha: +s.alpha.toFixed(2) } : null;
      if (!s || (p.shown !== false && p.body.blocked.down && !s.visible)) ok = false;
    }
    return { pass: ok, detail: out };
  },
};

const tidy = (sc) => ({
  ...sc,
  async run(dc) {
    const had = Object.fromEntries(DREAM_IDS.map((d) => [d, !!getRun(d)]));
    try {
      return await sc.run(dc);
    } finally {
      for (const d of DREAM_IDS) if (!had[d] && getRun(d)) clearRun(d);
    }
  },
});

export default [...slopeSites, shadowJump, shadowGap, shadowSlope, shadowPlaces].map(tidy);
