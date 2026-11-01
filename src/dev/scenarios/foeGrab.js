// Every placed kind of person, in a room of its own dream, with the real Foe and
// the real Jo: standing still is grabbed, a duck slips it, a step away beats it.
import { clearRun } from '../../utils/save.js';

const PLACES = [
  ['chef', 'prep', ['sous_chef']],
  ['musician', 'backstage', ['roadie']],
  ['painter', 'via', ['rival', 'inspector', 'foreman', 'porter']],
  ['gambler', 'office', ['crake']],
  ['astronaut', 'gym', ['gym_rat', 'cleaner', 'security']],
  ['writer', 'library', ['landlady', 'guard', 'proofreader']],
];

async function trial(dc, s, kind, act) {
  const p = s.player;
  for (const f of s.foes) f.passive = true;
  const foe = s.addFoe({ kind, wx: p.x + 66, wy: p.y, human: true, patrol: null });
  foe.y = p.y - 10; // clear of the floor: he hovers for the test, and his feet must not snag a tile
  foe.body.setAllowGravity(false);
  foe.body.setVelocity(0, 0);
  foe.setFlipX(true);
  foe.def = { ...foe.def, hears: false, homing: false }; // the guard's ear and the proofreader's typos aren't the test
  let thrown = 0;
  const real = s.throwOut;
  s.throwOut = () => (thrown += 1);
  // wind-up (0.4 s) + grab (0.25 s) + a margin; the player reacts 0.25 s into the tell
  foe.enter('windup', 400);
  foe.lastTick = s.time.now;
  for (let f = 0; f < 45 && !thrown; f++) {
    if (f === 15 && act === 'duck') dc.hold('down');
    if (f === 15 && act === 'away') dc.hold('left');
    s.tutorialActive = false;
    await dc.run(1);
  }
  dc.releaseAll();
  s.throwOut = real;
  foe.destroy();
  s.foes = s.foes.filter((f) => f !== foe);
  await dc.run(20);
  return thrown > 0;
}

const foeGrabFair = {
  id: 'foe-grab-fair',
  async run(dc) {
    const out = {};
    let pass = true;
    for (const [dream, place, kinds] of PLACES) {
      clearRun(dream);
      dc.warp(dream, place);
      await dc.run(60);
      for (let k = 0; k < 3 && !dc.scene().player; k++) await dc.run(40);
      const s = dc.scene();
      // an arrival scene or a desk holds the foes: click through until one is awake
      const live = s.foes.find((f) => f.human);
      for (let k = 0; live && k < 60; k++) {
        const t = live.lastTick;
        await dc.run(5);
        if (live.lastTick !== t) break;
        dc.press('interact', 2);
        await dc.run(30);
      }
      if (s.health && s.health.setInvulnerable) s.health.setInvulnerable(s.time.now, 1e9);
      await dc.run(30);
      const home = { x: s.player.x, y: s.player.y };
      for (const kind of kinds) {
        const r = {};
        for (const act of ['stand', 'duck', 'away']) {
          s.player.setPosition(home.x, home.y);
          s.player.body.reset(home.x, home.y);
          await dc.run(10);
          r[act] = await trial(dc, s, kind, act);
        }
        out[`${dream}/${kind}`] = r;
        pass = pass && r.stand && !r.duck && !r.away;
      }
      clearRun(dream);
    }
    return { pass, detail: out };
  },
};

export default [foeGrabFair];
