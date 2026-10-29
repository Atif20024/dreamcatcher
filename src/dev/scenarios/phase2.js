// Phase 2 scenarios (character pipeline): Jo's AnimationController in play.
//   jo-walk          slow input → walk frames advance with ground covered
//   jo-skid          release at full run → skid, then idle
//   jo-turn          reverse at full run → turn, then run the other way
//   jo-jump-arc      jump: anticipation → rise → apex → fall → land
//   jo-land-soft-hard  a hop lands soft; a long drop (≥ 4 tiles) lands hard
//   jo-float         the astronaut's zero-g plays `float` (not the run pose)
//   jo-foot-slide    on stride frames, a planted foot's world x drifts < 2 px
//   jo-route-<dream> a short run right from the spawn in every dream: he
//                    keeps moving, and under a low ceiling he ducks
// Each returns the frame strip it saw (frame names) in `detail.strip`.
import { getRun, clearRun } from '../../utils/save.js';

const T = 32;
const DREAM_IDS = ['chef', 'musician', 'astronaut', 'writer', 'painter', 'gambler'];

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
// a warp may wait on the loader (real time): step until the scene has Jo
async function arrive(dc, dream, place) {
  dc.warp(dream, place);
  for (let i = 0; i < 300; i++) {
    const sc = dc.scene();
    if (sc && sc.player && sc.player.anim && sc.sys.settings.key !== 'Title') break;
    await new Promise((r) => setTimeout(r, 20));
    dc.step(2);
  }
}
const safe = (sc) => {
  if (sc.health) sc.health.setInvulnerable(sc.time.now, 1e9);
  sc.invulnUntil = Infinity;
};
function strip(p, n, dc, every = 1) {
  const out = [];
  for (let i = 0; i < n; i++) {
    dc.step(1);
    if (i % every === 0) out.push(`${p.anim.name}/${p.anim.frame}`);
  }
  return out;
}
const names = (s) => [...new Set(s.map((x) => x.split('/')[0]))];
// a flat stretch of floor in the Chef street, away from the spawn's dialogue
async function chefFloor(dc) {
  await arrive(dc, 'chef');
  dc.step(150);
  settle(dc);
  dc.step(60);
  settle(dc);
  const sc = dc.scene();
  safe(sc);
  dc.releaseAll();
  dc.step(10);
  return sc;
}

const walk = {
  id: 'jo-walk',
  async run(dc) {
    const sc = await chefFloor(dc);
    const p = sc.player;
    p.speed = 90; // a stroll: below the walk/jog line
    dc.hold('right');
    const s = strip(p, 60, dc, 2);
    dc.releaseAll();
    p.speed = 280;
    const frames = new Set(s.filter((x) => x.startsWith('walk/')));
    return { pass: frames.size >= 6, detail: { strip: s, walkFrames: frames.size } };
  },
};

const skid = {
  id: 'jo-skid',
  async run(dc) {
    const sc = await chefFloor(dc);
    const p = sc.player;
    dc.hold('right');
    dc.step(30);
    dc.release('right');
    const s = strip(p, 30, dc);
    const n = names(s);
    return { pass: n[0] === 'skid' && n.includes('idle'), detail: { strip: s } };
  },
};

const turn = {
  id: 'jo-turn',
  async run(dc) {
    const sc = await chefFloor(dc);
    const p = sc.player;
    dc.hold('right');
    dc.step(30);
    dc.release('right');
    dc.hold('left');
    const s = strip(p, 24, dc);
    dc.releaseAll();
    const n = names(s);
    return { pass: n[0] === 'turn' && (n.includes('run') || n.includes('jog')) && p.flipX, detail: { strip: s } };
  },
};

const jumpArc = {
  id: 'jo-jump-arc',
  async run(dc) {
    const sc = await chefFloor(dc);
    const p = sc.player;
    dc.hold('jump');
    const s = strip(p, 70, dc);
    dc.releaseAll();
    const n = names(s);
    const order = ['jump_anticipate', 'rise', 'apex', 'fall', 'land'];
    const idx = order.map((a) => n.indexOf(a));
    const ok = idx.every((i) => i >= 0) && idx.every((v, i) => i === 0 || v > idx[i - 1]);
    return { pass: ok, detail: { strip: s, order: n } };
  },
};

const landing = {
  id: 'jo-land-soft-hard',
  async run(dc) {
    const sc = await chefFloor(dc);
    const p = sc.player;
    // soft: a standing hop
    dc.press('jump', 4);
    const soft = strip(p, 60, dc);
    // hard: dropped from six tiles up over the same floor
    const x = p.x;
    const y = p.y;
    p.setPosition(x, y - 6 * T);
    p.body.reset(x, y - 6 * T);
    p.airTopY = y - 6 * T;
    const hard = strip(p, 70, dc);
    const ok = names(soft).includes('land') && !names(soft).includes('hard_land') && names(hard).includes('hard_land');
    return { pass: ok, detail: { soft, hard } };
  },
};

const float = {
  id: 'jo-float',
  async run(dc) {
    await arrive(dc, 'astronaut', 'station');
    dc.step(120);
    settle(dc);
    const sc = dc.scene();
    safe(sc);
    // the warp wakes him in the station module (phys 'zero')
    const zr = sc.roomPhys ? sc.roomPhys().room : null;
    dc.hold('right');
    const s = strip(sc.player, 40, dc);
    dc.releaseAll();
    const n = names(s);
    return { pass: n.includes('float') && !n.includes('run'), detail: { room: zr && zr.id, strip: s } };
  },
};

// the ground-speed lock: at each stride-frame boundary, the planted foot's
// world x (body x at the exact boundary + the frame's contact offset) must
// stay where it was put down
const footSlide = {
  id: 'jo-foot-slide',
  async run(dc) {
    const sc = await chefFloor(dc);
    const p = sc.player;
    const data = p.anim.m.frameData;
    p.anim.plantLog = [];
    const report = {};
    for (const [speed, label] of [[280, 'run'], [90, 'walk'], [200, 'jog']]) {
      p.speed = speed;
      p.anim.plantLog.length = 0;
      dc.hold('right');
      dc.step(150);
      dc.release('right');
      dc.step(20);
      // walk back to the start so every speed gets the same floor
      dc.hold('left');
      dc.step(150);
      dc.release('left');
      dc.step(20);
      let worst = 0;
      let n = 0;
      const log = p.anim.plantLog.filter((e) => e.anim === label);
      for (let i = 1; i < log.length; i++) {
        const a = log[i - 1];
        const b = log[i];
        const n2 = p.anim.m.animations[a.anim].frames;
        if (b.seq !== a.seq + 1 || b.facing !== a.facing || b.frame !== (a.frame + 1) % n2) continue;
        const ca = data[a.anim][a.frame].contacts;
        const cb = data[b.anim][b.frame].contacts;
        for (const foot of ['f', 'b']) {
          if (ca[foot] == null || cb[foot] == null) continue;
          const wa = a.x + a.facing * ca[foot];
          const wb = b.x + b.facing * cb[foot];
          worst = Math.max(worst, Math.abs(wb - wa));
          n += 1;
        }
      }
      report[label] = { plants: n, worstDriftPx: +worst.toFixed(2) };
    }
    p.speed = 280;
    p.anim.plantLog = null;
    const ok = Object.values(report).every((r) => r.plants > 3 && r.worstDriftPx < 2);
    return { pass: ok, detail: report };
  },
};

// a short route in each dream: run right from the spawn, hop when blocked
const ROUTES = [
  ['hub', null], ['chef', null], ['musician', null], ['astronaut', 'gym'], ['writer', 'attic'], ['painter_legacy', 'arrival'], ['gambler', 'arrival'], ['evening', 'arch'],
];
const routes = ROUTES.map(([dream, place]) => ({
  id: `jo-route-${dream}`,
  async run(dc) {
    await arrive(dc, dream, place);
    dc.step(90);
    settle(dc);
    const sc = dc.scene();
    safe(sc);
    const p = sc.player;
    const x0 = p.x;
    let ceilingClips = 0;
    let wasLow = false;
    const clipAnims = new Set();
    let ducks = 0;
    let stuck = 0;
    let lastX = p.x;
    dc.hold('right');
    for (let f = 0; f < 420; f++) {
      dc.step(1);
      if (sc.dialogActive || sc.cardActive || sc.tutorialActive) {
        dc.releaseAll();
        settle(dc);
        dc.hold('right');
      }
      // (the landing tick itself is still an air frame: the controller
      // sees the floor on the next update, so a clip must last two ticks)
      const low = p.body.blocked.down && p.lowCeiling && p.lowCeiling();
      if (low) {
        ducks += 1;
        if (!/crouch/.test(p.anim.name) && wasLow) {
          ceilingClips += 1;
          clipAnims.add(p.anim.name);
        }
      }
      wasLow = low;
      if (p.body.blocked.right && p.body.blocked.down) {
        stuck += 1;
        if (stuck % 20 === 5) dc.press('jump', 10);
      }
      if (Math.abs(p.x - lastX) > 0.5) stuck = 0;
      lastX = p.x;
    }
    dc.releaseAll();
    const progress = (p.x - x0) / T;
    // he moved (a gate, a wall or the dream's own edge may stop him: that
    // is level content), and never stood with his drawn head in a ceiling
    return { pass: ceilingClips === 0 && (progress > 4 || p.body.blocked.right), detail: { progressTiles: +progress.toFixed(1), ducks, ceilingClips, clipAnims: [...clipAnims], anim: p.anim.name } };
  },
}));

// a scenario that lights a flag saves an in-dream run: leave the save as found
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

export default [walk, skid, turn, jumpArc, landing, float, footSlide, ...routes].map(tidy);
