// Round 2 WP5 (docs/redesign/round2/02_final_critique.md §8):
//   readability-<place>  in each of the nine places the camera sweeps the
//                        whole world (a grid of screens) and every screen
//                        must pass the audit in src/dev/readability.js:
//                        min-cap, no-plate, contrast, plate-clash,
//                        hud-overlap. The low-zoom moments are checked at
//                        their zoom (hub vista 0.62, Evening ridge 0.6).
//   bark-one-at-a-time   two townsfolk side by side both speak: only the
//                        newer bubble shows, in body type on a plate
import { auditText } from '../readability.js';

const PLACES = [
  ['hub', null], ['chef', null], ['musician', null], ['astronaut', 'gym'], ['writer', 'attic'], ['painter', 'via'], ['gambler', 'quay'], ['evening', 'arch'], ['clockmaker', 'start'],
];
const ZOOMS = { hub: [0.62], evening: [0.6] };

const busy = (sc) => !!(sc.dialogActive || sc.tutorialActive || sc.cardActive || (sc.modals && sc.modals.state && sc.modals.state().length));
function settle(dc) {
  for (let i = 0; i < 80; i++) {
    const sc = dc.scene();
    if (!sc || !busy(sc)) break;
    dc.press('action', 2);
    dc.press('Space', 2);
    dc.step(30);
  }
  dc.step(5);
}
async function arrive(dc, dream, place) {
  dc.warp(dream, place);
  for (let i = 0; i < 300; i++) {
    const sc = dc.scene();
    if (sc && sc.player && sc.sys.settings.key !== 'Title' && sc.cameras && sc.cameras.main) break;
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

// sweep the camera over the world: a grid of screens (the camera's own
// follow is paused and restored)
function sweep(dc, sc, zoom = null) {
  const cam = sc.cameras.main;
  const follow = cam._follow;
  const z0 = cam.zoom;
  const b = cam.getBounds ? cam.getBounds() : { x: 0, y: 0, width: 960, height: 540 };
  cam.stopFollow();
  if (zoom) cam.setZoom(zoom);
  const vw = 960 / cam.zoom;
  const vh = 540 / cam.zoom;
  const found = new Map();
  let screens = 0;
  const bw = cam.useBounds ? b.width : 4000;
  const bh = cam.useBounds ? b.height : 1200;
  const bx = cam.useBounds ? b.x : cam.scrollX - 2000;
  const by = cam.useBounds ? b.y : cam.scrollY - 600;
  for (let y = by; y < by + bh; y += vh * 0.9) {
    for (let x = bx; x < bx + bw; x += vw * 0.9) {
      cam.centerOn(x + vw / 2, y + vh / 2);
      if (zoom) cam.setZoom(zoom);
      dc.step(2);
      screens++;
      for (const v of auditText(sc)) {
        const k = `${v.rule}:${v.text}`;
        if (!found.has(k)) found.set(k, { ...v, at: [Math.round(cam.midPoint.x), Math.round(cam.midPoint.y)], zoom: +cam.zoom.toFixed(2) });
      }
    }
  }
  cam.setZoom(z0);
  if (follow) cam.startFollow(follow, true, cam.lerp.x, cam.lerp.y);
  dc.step(10);
  return { screens, found: [...found.values()] };
}

function placeScenario([dream, place]) {
  return {
    id: `readability-${dream}`,
    expect: 'pass',
    async run(dc) {
      const sc = await arrive(dc, dream, place);
      const res = sweep(dc, sc);
      let screens = res.screens;
      const found = res.found;
      for (const z of ZOOMS[dream] || []) {
        const r = sweep(dc, sc, z);
        screens += r.screens;
        found.push(...r.found);
      }
      return { pass: found.length === 0, detail: { screens, violations: found.slice(0, 30), count: found.length } };
    },
  };
}

const barkOne = {
  id: 'bark-one-at-a-time',
  expect: 'pass',
  async run(dc) {
    const sc = await arrive(dc, 'evening', 'square');
    const folk = Object.values(sc.folk || {}).filter((f) => f.visible && !f.inside);
    if (folk.length < 2) return { pass: false, detail: 'fewer than two townsfolk in the square' };
    const p = sc.player;
    const [a, b] = folk.sort((m, n) => Math.abs(m.x - p.x) - Math.abs(n.x - p.x));
    a.say('First, the one about the cat.');
    dc.step(2);
    b.say('Then the one about the lentils.');
    dc.step(4);
    const live = folk.filter((f) => f.bubble && f.bubble.active && f.bubble.visible);
    const near = live.filter((f) => Math.abs(f.x - b.x) < 300);
    const bb = b.bubble;
    const ok = near.length <= 1 && bb && bb.visible && bb.dc.size === 'body' && !!bb.backingColor();
    return { pass: ok, detail: { visibleNear: near.map((f) => f.id), newest: bb && { size: bb.dc.size, plate: !!bb.backingColor(), visible: bb.visible } } };
  },
};

export default [...PLACES.map(placeScenario), barkOne];
