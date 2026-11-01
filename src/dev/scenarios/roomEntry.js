// SPEED_REPORT round 2: entering a room never hitches. Every framework seam
// and door, from a fresh scene (nothing painted but the warp's own rooms):
//   room-entry-budget  walks each seam there and back, and goes through each
//                      door, timing every frame, lit or dark: all stay under
//                      BUDGET.doorFrameMs. Lead is how many frames the rooms
//                      ahead took to paint (Jo was left to walk that long).
import { BUDGET } from '../../core/PerfBudget.js';

const T = 32;
const FLAGS = { clockmaker: { clock_wound: true, struck: true, yard_seen: true, green_lit: true, nell_lamp: true }, painter: { assistant: true } };
const DREAMS = ['clockmaker', 'musician', 'painter', 'chef', 'gambler'];

async function timed(dc, s, frames, until, each = null) {
  const cam = s.cameras.main;
  const fr = [];
  for (let f = 0; f < frames; f++) {
    if (each) each(f);
    const t0 = performance.now();
    dc.step(1);
    fr.push({ ms: performance.now() - t0, dark: cam.fadeEffect.alpha || 0 });
    for (let k = 0; k < 8; k++) await null;
    if (until(fr)) break;
  }
  return fr;
}

async function walk(dc, s, dir, done) {
  let hopUntil = -1;
  // hop a kerb or a bin in the way
  const hop = (f) => {
    const b = s.player.body;
    if (hopUntil < 0 && b.blocked.down && (dir === 'right' ? b.blocked.right : b.blocked.left)) {
      dc.hold('jump');
      hopUntil = f + 14;
    } else if (f === hopUntil) {
      dc.release('jump');
      hopUntil = -1;
    }
  };
  dc.hold(dir);
  const fr = await timed(dc, s, 420, (x) => done() && !x[x.length - 1].dark && x.some((e) => e.dark > 0), hop);
  dc.releaseAll();
  await dc.run(4);
  return fr;
}

async function arrive(dc, dream, room) {
  dc.warp(dream, room);
  await dc.run(5); // (a warp's own first frames draw everything for the first time)
  const s = dc.scene();
  s.invulnUntil = Infinity;
  Object.assign(s.F, FLAGS[dream] || {});
  while (s.sceneBox.active) {
    dc.press('enter', 2);
    await dc.run(10);
  }
  return s;
}

// let the rooms ahead finish, as a walk across the room would (these frames
// are lit, and count)
const lead = (dc, s) => timed(dc, s, 900, () => !s.streamer._ahead);

const sum = (name, fr, ahead) => {
  const lit = [...fr, ...ahead].filter((f) => f.dark < 0.99).map((f) => f.ms);
  return { name, lead: ahead.length, max: Math.round(Math.max(...fr.map((f) => f.ms))), lit: Math.round(Math.max(...lit, 0)), over33: lit.filter((ms) => ms > 33).length };
};

const roomEntry = {
  id: 'room-entry-budget',
  expect: 'pass',
  async run(dc, dreams = DREAMS) {
    const rows = [];
    for (const dream of dreams) {
      dc.warp(dream, 'start');
      await dc.run(5);
      const g = dc.scene().graph;
      const seams = g.seams();
      const doors = [...g.rooms.values()].flatMap((r) => r.portals.filter((p) => p.kind === 'door').map((p) => ({ room: r.id, id: p.id })));
      for (const seam of seams) {
        const s = await arrive(dc, dream, seam.left);
        const p = s.graph.portal(seam.portal);
        const y = s.transitions.standAt(p.room === seam.left ? p : s.graph.partner(seam.portal)).y;
        s.player.setPosition(seam.x - 5 * T, y);
        s.player.body.reset(seam.x - 5 * T, y);
        const n = await lead(dc, s);
        const there = await walk(dc, s, 'right', () => s.roomId === seam.right && s.player.x > seam.x + 80);
        const n2 = await lead(dc, s);
        const back = await walk(dc, s, 'left', () => s.roomId === seam.left && s.player.x < seam.x - 80);
        rows.push(sum(`${dream} ${seam.left}>${seam.right}`, there, n));
        rows.push(sum(`${dream} ${seam.right}>${seam.left}`, back, n2));
      }
      for (const d of doors) {
        const s = await arrive(dc, dream, d.room);
        const n = await lead(dc, s);
        s.transitions.go(d.id);
        rows.push(sum(`${dream} ${d.id}`, await timed(dc, s, 120, () => !s.transitions.busy), n));
      }
    }
    const bad = rows.filter((r) => r.lit > BUDGET.doorFrameMs || r.max > BUDGET.doorFrameMs);
    const worst = rows.reduce((a, r) => (r.max > a.max ? r : a), rows[0]);
    const worstLit = rows.reduce((a, r) => (r.lit > a.lit ? r : a), rows[0]);
    window.__roomEntry = rows; // the whole table, for the report
    return { pass: !bad.length, detail: { budget: BUDGET.doorFrameMs, crossings: rows.length, worst, worstLit, bad } };
  },
};

export default [roomEntry];
