// Phase 3b: THE BIG STAGE on the framework (src/dreams/musician/).
//   musician-board        the hub's platform 2: [E] at the gate, the
//                         conductor, the walk-in, the arrival (IntroScene),
//                         then DreamScene plays 'musician' on the street with
//                         its title card, objective and busker-coin HUD
//   musician-places       every ?warp=musician:<place> lands in its room
//                         with an objective, a board title, under budget,
//                         only that room and its neighbours live
//   musician-coins        120–150 busker coins placed, worth 1 each
//   musician-set-variants the set list follows the choice: Nia keeps the
//                         rests, the bass blank and the held note; Tally's
//                         list fills every rest and plays the blank blind
//   musician-legacy       ?warp=musician_legacy (?legacy=1) still plays the
//                         old MusicianScene, for comparison
//   musician-playthrough  board → street (the horn) → alley (the neon, the
//                         stage door) → the Cellar (sign up, the open mic,
//                         Ray walks out) → the alley (Ray's lesson, the gate)
//                         → backstage (Marcus, the laminate on the catwalk,
//                         Tally's offer) → the fire stairs → the Big Stage
//                         (the set) → the wing → the orb → caught → the hub
// Real inputs where it matters (walking, [E], [Q], the rhythm played on the
// beat by an auto-player); the long platforming stretches are placed.
import { clearRun, getSave } from '../../utils/save.js';
import { dreamById } from '../../data/dreams.js';
import { uncatch } from './phase3.js';
import { BUDGET } from '../../core/PerfBudget.js';
import { bigSetPhrases } from '../../dreams/musician/encounters/sets.js';
import { rhythm } from '../../engines/rhythm.js';

const T = 32;
const keyOf = (dc) => dc.scene() && dc.scene().sys.settings.key;

async function boot(dc, place = 'start') {
  clearRun('musician');
  dc.warp('musician', place);
  await dc.run(40);
  const s = dc.scene();
  safe(s);
  return s;
}

// no hurt, no grabs: the playthrough tests the flow, not Jo's reflexes
function safe(s) {
  s.invulnUntil = Infinity;
  if (s.health && s.health.setInvulnerable) s.health.setInvulnerable(s.time.now, 1e9);
  for (const f of s.foes || []) f.passive = true;
}

function put(s, x, y) {
  s.player.setPosition(x, y);
  s.player.body.reset(x, y);
}

// a room's tile → world px (the standing tile's centre, feet on its floor)
const at = (s, room, tx, ty) => {
  const r = s.graph.room(room);
  return { x: (r.tx + tx) * T + T / 2, y: (r.ty + ty) * T + T - 22 };
};

async function walkTo(dc, s, x, { frames = 900, tol = 30 } = {}) {
  let stuck = 0;
  let lastX = s.player.x;
  for (let f = 0; f < frames; f++) {
    safe(s);
    const p = s.player;
    const d = x - p.x;
    const dir = d > 0 ? 'right' : 'left';
    if (Math.abs(d) < 56) {
      dc.releaseAll();
      for (let i = 0; i < 30 && Math.abs(p.body.velocity.x) > 5; i++) await dc.run(1);
      await dc.run(2);
      if (Math.abs(x - p.x) <= tol) return true;
      dc.hold(x - p.x > 0 ? 'right' : 'left');
      await dc.run(2);
      dc.releaseAll();
      continue;
    }
    for (const o of ['left', 'right']) if (o !== dir && dc.state().held.includes(o)) dc.release(o);
    dc.hold(dir);
    const b = p.body;
    const blocked = (d > 0 && b.blocked.right) || (d < 0 && b.blocked.left);
    stuck = Math.abs(p.x - lastX) < 0.5 ? stuck + 1 : 0;
    lastX = p.x;
    if ((blocked || stuck > 6) && (b.blocked.down || p.onSlope)) {
      dc.hold('jump');
      await dc.run(16);
      dc.release('jump');
    }
    await dc.run(1);
  }
  dc.releaseAll();
  return false;
}

// talk through a scene box; `pick` chooses by choice index at choice nodes
async function talkThrough(dc, s, pick = 0, limit = 1600) {
  for (let i = 0; i < limit && s.sceneBox.active; i += 12) {
    if (s.sceneBox.choosing && pick > 0) {
      for (let k = 0; k < pick; k++) dc.press('down', 2);
      pick = 0;
      await dc.run(4);
    }
    dc.press('action', 2);
    await dc.run(10);
  }
  return !s.sceneBox.active;
}

// the rhythm auto-player: a press on each note beat, nothing on a rest,
// held through a long note
export async function playRhythm(dc, s, limit = 9000) {
  let presses = 0;
  const pressed = new Set();
  let holding = false;
  for (let i = 0; i < limit && s.encounters.busy; i++) {
    const a = s.encounters.active;
    const e = a && a.engine;
    const d = e && !a.ending && a.t > 300 ? e.due() : null;
    if (d) {
      const st = e.state();
      if (d.hold) {
        if (!holding && st.hits[0] === null && d.t >= -10) {
          dc.hold('interact');
          holding = true;
          presses += 1;
        }
      } else {
        const k = Math.round(d.t / d.beatMs);
        const id = `${st.idx}:${st.tries}:${k}`;
        if (k >= 0 && k < d.beats.length && d.beats[k] === 1 && d.hits[k] === null && !pressed.has(id) && Math.abs(d.t - k * d.beatMs) < 30) {
          pressed.add(id);
          dc.press('interact', 1);
          presses += 1;
          continue;
        }
      }
    } else if (holding && e && e.state().phase !== 'play') {
      dc.release('interact');
      holding = false;
    }
    await dc.run(1);
  }
  if (holding) dc.release('interact');
  return presses;
}

async function startEncounterOnE(dc, s) {
  dc.press('interact', 3);
  await dc.run(20);
  return s.encounters.busy;
}

async function door(dc, s, want) {
  dc.press('interact', 3);
  for (let i = 0; i < 120 && s.roomId !== want; i++) await dc.run(1);
  await dc.run(10);
  return s.roomId === want;
}

async function waitBeats(dc, s, limit = 900) {
  for (let i = 0; i < limit && (s.beats.busy || s.sceneBox.active); i++) {
    if (s.sceneBox.active) await talkThrough(dc, s);
    await dc.run(1);
  }
}

async function hub(dc) {
  dc.warp('hub', null);
  dc.step(4);
  for (let i = 0; i < 300; i++) {
    const sc = dc.scene();
    if (sc && sc.player && keyOf(dc) === 'Hub' && sc.trains && sc.interacts && sc.sys.isActive()) break;
    await new Promise((r) => setTimeout(r, 20));
    dc.step(2);
  }
  dc.step(60);
  const sc = dc.scene();
  if (sc.openingSkip) sc.openingSkip();
  return sc;
}

const board = {
  id: 'musician-board',
  async run(dc) {
    uncatch('musician');
    clearRun('musician');
    const sc = await hub(dc);
    const d = dreamById('musician');
    const t = sc.trains.musician;
    const row = sc.board.rows.find((r) => r.platform === 2);
    sc.player.setPosition(t.gateX - 10, sc.player.y);
    dc.step(20);
    const show = sc.dialog.show.bind(sc.dialog);
    let asked = null;
    sc.dialog.show = async (pages) => {
      asked = pages && pages[0] && pages[0].text;
      return 'board';
    };
    const it = sc.interacts.find((i) => i.label === 'train' && Math.abs(i.x - t.gateX) < 4);
    const prompted = !!it && it.when();
    it.cb();
    await Promise.resolve();
    for (let i = 0; i < 400 && keyOf(dc) === 'Hub'; i++) await dc.run(1);
    sc.dialog.show = show;
    const intro = keyOf(dc) === 'Intro' && dc.scene().levelKey === 'musician';
    for (let i = 0; i < 900 && keyOf(dc) === 'Intro'; i++) await dc.run(1);
    for (let i = 0; i < 200 && !(dc.scene() && dc.scene().roomId); i++) await dc.run(1);
    await dc.run(20);
    const ds = dc.scene();
    const inDream = keyOf(dc) === 'Dream' && ds.dreamId === 'musician' && ds.roomId === 'street';
    const title = inDream && !!ds._titleCard;
    const coinHud = inDream && !!ds.coinMgr && ds.coinIcon === 'coin-musician-0';
    const trumpet = inDream && ds.player.tool.texture.key === 'tool-trumpet';
    clearRun('musician');
    const pass = !!row && row.title === d.title && /BOARDING/.test(row.status) && prompted && asked === d.conductor && intro && inDream && title && coinHud && trumpet;
    return { pass, detail: { row, prompted, conductor: asked === d.conductor, intro, inDream, title, coinHud, trumpet } };
  },
};

const PLACES = [['start', 'street'], ['street', 'street'], ['alley', 'alley'], ['cellar', 'cellar'], ['backstage', 'backstage'], ['escape', 'escape'], ['stage', 'stage']];
const places = {
  id: 'musician-places',
  async run(dc) {
    const out = [];
    let ok = true;
    for (const [place, room] of PLACES) {
      const s = await boot(dc, place);
      await dc.run(30);
      const p = s.perf.sample();
      const live = [...s.streamer.live.keys()];
      const allowed = new Set([s.roomId, ...s.graph.neighbours(s.roomId)]);
      const obj = (s.objectiveText && s.objectiveText.text) || s._objective || '';
      const good = s.roomId === room && !!obj && p.objects + p.ui <= BUDGET.objects && p.drawCalls <= BUDGET.drawCalls && live.every((id) => allowed.has(id)) && !!s.graph.room(room).data.titleCard;
      ok = ok && good;
      out.push(`${place}→${s.roomId}${good ? '' : ' FAIL'}: "${obj}", ${p.objects + p.ui} obj, ~${p.drawCalls} dc, paint ${s.streamer.paintMs[room]} ms`);
    }
    clearRun('musician');
    return { pass: ok, detail: out.join('; ') };
  },
};

const coins = {
  id: 'musician-coins',
  async run(dc) {
    const s = await boot(dc, 'start');
    const d = dreamById('musician');
    const placed = (s.placedCoins || []).length;
    const before = getSave().wallet.total;
    const c = s.placedCoins[0];
    put(s, c.img.x, c.img.y + 10);
    await dc.run(10);
    const gained = getSave().wallet.total - before;
    clearRun('musician');
    const pass = placed >= d.coin.budget[0] && placed <= d.coin.budget[1] && s.levelCoins >= 1 && gained === s.levelCoins * d.coin.worth;
    return { pass, detail: { placed, budget: d.coin.budget, gained, levelCoins: s.levelCoins } };
  },
};

const variants = {
  id: 'musician-set-variants',
  async run() {
    const nia = rhythm({ phrases: bigSetPhrases({ choice_nia: true }), rests: true });
    const tally = rhythm({ phrases: bigSetPhrases({ choice_tally: true }), rests: false });
    const has = (e, f) => e.phrases.some(f);
    const restN = (e) => e.phrases.filter((p) => p.beats.includes(0) && !p.silent).length;
    const d = {
      niaRests: restN(nia),
      niaSilentBass: has(nia, (p) => p.silent && p.voice === 'bass'),
      niaBlind: has(nia, (p) => p.blind),
      niaHold: has(nia, (p) => p.hold === 4),
      tallyRests: restN(tally),
      tallySilent: has(tally, (p) => p.silent),
      tallyBlind: tally.phrases.filter((p) => p.blind).length,
      tallyHold: has(tally, (p) => p.hold === 4),
    };
    const pass = d.niaRests >= 8 && d.niaSilentBass && d.niaBlind && d.niaHold && d.tallyRests === 0 && !d.tallySilent && d.tallyBlind >= 2 && d.tallyHold;
    return { pass, detail: d };
  },
};

const legacy = {
  id: 'musician-legacy',
  async run(dc) {
    dc.warp('musician_legacy', null);
    for (let i = 0; i < 100 && keyOf(dc) !== 'Musician'; i++) await dc.run(2);
    await dc.run(30);
    const k = keyOf(dc);
    clearRun('musician');
    return { pass: k === 'Musician', detail: { scene: k } };
  },
};

const playthrough = {
  id: 'musician-playthrough',
  async run(dc) {
    uncatch('musician');
    const log = [];
    const ok = (k, v) => log.push(`${k}:${v ? 'ok' : 'FAIL'}`) && v;
    const s = await boot(dc, 'start');
    const t0 = s.time.now;
    // 1. the street: Jo's first note at the shop window
    let p = at(s, 'street', 20, 15);
    ok('reach-horn', await walkTo(dc, s, p.x, { frames: 700 }));
    dc.press('trumpet', 3);
    await dc.run(30);
    ok('horn-rang', !!s.F.horn_rang);
    // 2. through the alley mouth (the seam) to the neon
    p = at(s, 'alley', 25, 21);
    ok('reach-neon', await walkTo(dc, s, p.x, { frames: 1800 }));
    ok('in-alley', s.roomId === 'alley');
    // the door is locked first
    p = at(s, 'alley', 28, 21);
    await walkTo(dc, s, p.x, { frames: 200, tol: 20 });
    dc.press('interact', 3);
    await dc.run(30);
    ok('door-locked', s.roomId === 'alley');
    p = at(s, 'alley', 25, 21);
    await walkTo(dc, s, p.x, { frames: 200, tol: 20 });
    ok('neon-started', await startEncounterOnE(dc, s));
    const neonPresses = await playRhythm(dc, s);
    await waitBeats(dc, s);
    ok('neon-lit', !!s.F.neon_lit);
    p = at(s, 'alley', 28, 21);
    await walkTo(dc, s, p.x, { frames: 200, tol: 20 });
    ok('into-cellar', await door(dc, s, 'cellar'));
    // 3. the Cellar: Delphine, the open mic
    p = at(s, 'cellar', 9, 11);
    await walkTo(dc, s, p.x + 40, { frames: 400, tol: 24 });
    dc.press('interact', 3);
    await dc.run(10);
    await talkThrough(dc, s);
    ok('signed-up', !!s.F.signed_up);
    p = at(s, 'cellar', 38, 10);
    ok('on-stage', await walkTo(dc, s, p.x, { frames: 900, tol: 24 }));
    ok('gig-started', await startEncounterOnE(dc, s));
    const audience0 = s.audience.filter((a) => a.turned).length;
    const gigPresses = await playRhythm(dc, s);
    const turned = s.audience.filter((a) => a.turned).length;
    await waitBeats(dc, s, 1500);
    ok('cellar-gig', !!s.F.cellar_gig && !!s.F.ray_left);
    ok('audience-turned', turned > audience0);
    // 4. back out: Ray in the alley, his lesson, the gate
    p = at(s, 'cellar', 3, 11);
    await walkTo(dc, s, p.x, { frames: 1200, tol: 20 });
    ok('back-to-alley', await door(dc, s, 'alley'));
    p = at(s, 'alley', 38, 21);
    await walkTo(dc, s, p.x, { frames: 900, tol: 24 });
    await dc.run(10);
    const rayPrompt = s.interaction.current && s.interaction.current.id;
    dc.press('interact', 3);
    await dc.run(10);
    await talkThrough(dc, s);
    await waitBeats(dc, s);
    if (!ok('ray-lesson', !!s.F.ray_lesson)) log.push(`(ray: prompt ${rayPrompt}, jo ${Math.round(s.player.x)},${Math.round(s.player.y)}, room ${s.roomId}, ray ${!!s.npcs.get('ray_alley')}, modal ${JSON.stringify({ enc: s.encounterActive, card: s.cardActive, tut: s.tutorialActive, dlg: s.dialogActive, puz: s.puzzleActive, beats: s.beats.busy, susp: s.inputs.suspended, box: s.sceneBox.active, trans: s.transitions.busy, paused: s.paused, resp: s.respawning })})`);
    await dc.run(40);
    ok('dock-gate-open', s.gates.filter((g) => g.id === 'g_dock').length === 1 && s.gates.filter((g) => g.id === 'g_dock').every((g) => g.open));
    p = at(s, 'alley', 51, 21);
    await walkTo(dc, s, p.x, { frames: 900, tol: 20 });
    ok('into-backstage', await door(dc, s, 'backstage'));
    // 5. backstage: Marcus (he stays for one), the laminate, Tally (Nia plays)
    safe(s);
    p = at(s, 'backstage', 9, 14);
    await walkTo(dc, s, p.x + 40, { frames: 400, tol: 24 });
    dc.press('interact', 3);
    await dc.run(10);
    await talkThrough(dc, s, 1);
    ok('marcus-stays', s.F.marcus_left === 'stay' && !!s.F.marcus_stays && getSave().cast.marcus_left === 'stay');
    // up onto the case stack and the catwalk (real jumps), along to the laminate
    p = at(s, 'backstage', 24, 12);
    put(s, p.x, p.y);
    await dc.run(20);
    dc.hold('jump');
    await dc.run(18);
    dc.release('jump');
    await dc.run(30);
    const onCatwalk = s.player.y < (60 + 9) * T;
    ok('on-catwalk', onCatwalk);
    p = at(s, 'backstage', 43, 8);
    await walkTo(dc, s, p.x, { frames: 700, tol: 16 });
    await dc.run(20);
    ok('laminate', !!s.F.laminate && !!s.F['item:laminate']);
    p = at(s, 'backstage', 52, 14);
    put(s, p.x, p.y);
    await dc.run(20);
    dc.press('interact', 3);
    await dc.run(10);
    await talkThrough(dc, s, 1);
    await waitBeats(dc, s);
    ok('tally-nia', !!s.F.choice_nia && !!s.F.offer_heard && !!s.F.stage_ready);
    await dc.run(40);
    p = at(s, 'backstage', 60, 14);
    await walkTo(dc, s, p.x, { frames: 600, tol: 20 });
    ok('into-stairs', await door(dc, s, 'escape'));
    // 6. the fire stairs: the first two landings by real jumps, then the top
    safe(s);
    p = at(s, 'escape', 17, 45);
    await walkTo(dc, s, p.x, { frames: 400, tol: 20 });
    dc.hold('jump');
    await dc.run(20);
    dc.release('jump');
    await dc.run(30);
    const climbed = s.player.y < (-30 + 42) * T;
    ok('first-landing', climbed);
    p = at(s, 'escape', 26, 5);
    put(s, p.x, p.y);
    await dc.run(20);
    p = at(s, 'escape', 27, 5);
    await walkTo(dc, s, p.x, { frames: 200, tol: 18 });
    ok('onto-stage', await door(dc, s, 'stage'));
    // 7. the set
    safe(s);
    ok('nia-on-bass', !!s.npcs.get('nia_set') && !s.npcs.get('session'));
    ok('marcus-on-drums', !!s.npcs.get('marcus_set'));
    p = at(s, 'stage', 29, 15);
    await walkTo(dc, s, p.x, { frames: 900, tol: 24 });
    ok('set-started', await startEncounterOnE(dc, s));
    const setPresses = await playRhythm(dc, s, 20000);
    const res = s.encounters.busy ? null : true;
    await waitBeats(dc, s, 1500);
    ok('set-done', !!res && !!s.F.set_done);
    await dc.run(30);
    ok('crowd-gone', s.streamer.room('stage').props.filter((pr) => pr.propDef.prop === 'crowd_front').every((pr) => !pr.visible));
    ok('after-gate', s.gates.every((g) => g.open));
    // 8. the wing: the chair, the orb, caught
    p = at(s, 'stage', 63, 15);
    await walkTo(dc, s, p.x, { frames: 900, tol: 12 });
    for (let i = 0; i < 40 && !s.ending.active; i++) {
      dc.hold('jump');
      await dc.run(10);
      dc.release('jump');
      await dc.run(10);
    }
    ok('ending', s.ending.active);
    for (let i = 0; i < 1200 && !s.ending.waitingForReturn; i++) await dc.run(1);
    ok('ending-card', !!s.ending.waitingForReturn && s.ending.caught);
    const minutes = (s.time.now - t0) / 60000;
    dc.press('action', 3);
    for (let i = 0; i < 120 && keyOf(dc) !== 'Hub'; i++) await dc.run(1);
    await dc.run(2);
    const hubSc = dc.scene();
    ok('back-at-station', keyOf(dc) === 'Hub');
    ok('caught-flag', !!getSave().dreams.musician);
    ok('returned-from', hubSc && hubSc.returnedFrom === 'musician');
    uncatch('musician');
    clearRun('musician');
    const pass = log.every((l) => l.endsWith(':ok'));
    return { pass, detail: `${log.join(' ')}; presses neon ${neonPresses}, gig ${gigPresses}, set ${setPresses}; scripted run ${minutes.toFixed(1)} min of game time` };
  },
};

export default [board, places, coins, variants, legacy, playthrough];
