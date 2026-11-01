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

// A save that hasn't seen a dream's cards opens them mid-trial, and a card freezes
// physics until it is closed: he can't step in, Jo can't run. This was the one
// failure on a fresh origin (a new port has an empty save), then passes after.
const clearCards = (s) => {
  if (s.modals.has('tutorial')) s.modals.closeAll();
};

// side: which side of Jo he stands on (+1 right); Jo runs the other way
async function trial(dc, s, kind, act, gap = 66, side = 1) {
  const p = s.player;
  for (const f of s.foes) f.passive = true;
  const foe = s.addFoe({ kind, wx: p.x + side * gap, wy: p.y, human: true, patrol: null });
  foe.y = p.y - 10; // clear of the floor: he hovers for the test, and his feet must not snag a tile
  foe.body.setAllowGravity(false);
  foe.body.setVelocity(0, 0);
  foe.setFlipX(side > 0);
  foe.def = { ...foe.def, hears: false, homing: false }; // the guard's ear and the proofreader's typos aren't the test
  let thrown = 0;
  const real = s.throwOut;
  s.throwOut = () => (thrown += 1);
  // wind-up (0.4 s) + grab (0.25 s) + a margin; the player reacts 0.25 s into the tell
  // ('held': Down was already pressed when the tell began, so it doesn't count)
  if (act === 'held') {
    dc.hold('down');
    for (let f = 0; f < 3; f++) {
      clearCards(s);
      await dc.run(1);
    }
    foe.body.setVelocity(0, 0);
  }
  foe.enter('windup', 400);
  foe.lastTick = s.time.now;
  for (let f = 0; f < 45 && !thrown; f++) {
    if (f === 15 && act === 'duck') dc.hold('down');
    if (f === 15 && act === 'away') dc.hold(side > 0 ? 'left' : 'right');
    clearCards(s);
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
      // an arrival can be against a wall: he stands on the side Jo can't run to
      dc.hold('left');
      for (let f = 0; f < 45; f++) {
        clearCards(s);
        await dc.run(1);
      }
      dc.releaseAll();
      const side = home.x - s.player.x > 120 ? 1 : -1;
      for (const kind of kinds) {
        const r = {};
        // (close gaps: after a miss or a conversation he can be right on top of Jo)
        for (const [act, name, gap] of [['stand', 'stand'], ['duck', 'duck'], ['held', 'held'], ['away', 'away'], ['away', 'away30', 30], ['away', 'away10', 10]]) {
          s.player.setPosition(home.x, home.y);
          s.player.body.reset(home.x, home.y);
          await dc.run(10);
          r[name] = await trial(dc, s, kind, act, gap, side);
        }
        out[`${dream}/${kind}`] = r;
        pass = pass && r.stand && !r.duck && r.held && !r.away && !r.away30 && !r.away10;
      }
      clearRun(dream);
    }
    return { pass, detail: out };
  },
};

// A pause during the tell is no dodge; a card still gives its grace, but a second
// one straight after doesn't; a respawn and a throw-out find every hand down.
const foePauseFair = {
  id: 'foe-pause-fair',
  async run(dc) {
    clearRun('chef');
    dc.warp('chef', 'prep');
    await dc.run(60);
    for (let k = 0; k < 3 && !dc.scene().player; k++) await dc.run(40);
    const s = dc.scene();
    const live = s.foes.find((f) => f.human);
    for (let k = 0; live && k < 60; k++) {
      const t = live.lastTick;
      await dc.run(5);
      if (live.lastTick !== t) break;
      dc.press('interact', 2);
      await dc.run(30);
    }
    for (const f of s.foes) f.passive = true;
    const p = s.player;
    const foe = s.addFoe({ kind: 'sous_chef', wx: p.x + 66, wy: p.y, human: true, patrol: null });
    foe.y = p.y - 10;
    foe.body.setAllowGravity(false);
    foe.setFlipX(true);
    let thrown = 0;
    const real = s.throwOut;
    s.throwOut = () => (thrown += 1);
    const lines = [];
    let pass = true;
    const check = (name, ok, extra = '') => {
      lines.push(`${ok ? 'ok' : 'FAIL'} ${name}${extra ? ` (${extra})` : ''}`);
      pass = pass && ok;
    };
    const go = async (n) => {
      for (let f = 0; f < n; f++) {
        clearCards(s);
        await dc.run(1);
      }
    };
    await go(2);

    // the pause menu, with the real key, in the middle of the tell
    foe.enter('windup', 400);
    await go(10);
    const left = foe.stateUntil - s.time.now;
    dc.press('esc', 2);
    check('paused', s.paused === true);
    await dc.run(90);
    check('frozen in the pause', foe.state === 'windup');
    s.pauseMenu.destroy();
    s.freezeWorld(false);
    await dc.run(1);
    check('still winding up after it', foe.state === 'windup', `${Math.round(left)} ms left before, ${Math.round(foe.stateUntil - s.time.now)} after`);
    check('no grace from a pause', !(foe.calmUntil > s.time.now));
    for (let f = 0; f < 45 && !thrown; f++) await go(1);
    check('the grab still lands', thrown === 1);
    foe.enter('patrol', 0);
    foe.calmUntil = 0;
    thrown = 0;

    // a card: the wind-up is dropped and he leaves Jo be for 0.9 s
    foe.calmUntil = s.time.now + 100;
    await go(2);
    foe.calmUntil = 0;
    foe.enter('windup', 400);
    await go(5);
    s.tutorialActive = true;
    await dc.run(30);
    s.tutorialActive = false;
    await dc.run(1);
    check('a card drops the wind-up', foe.state === 'patrol');
    const calm = foe.calmUntil - s.time.now;
    check('and gives its grace', calm > 800 && calm <= 900, `${Math.round(calm)} ms`);

    // the same card again at once buys nothing: the calm he had is what's left
    s.tutorialActive = true;
    await dc.run(30);
    s.tutorialActive = false;
    await dc.run(1);
    const calm2 = foe.calmUntil - s.time.now;
    check('a second card straight after adds nothing', calm2 <= calm + 1, `${Math.round(calm2)} ms`);
    // and a wind-up isn't dropped by one
    foe.calmUntil = 0;
    foe.enter('windup', 400);
    await go(5);
    s.tutorialActive = true;
    await dc.run(30);
    s.tutorialActive = false;
    await dc.run(1);
    check('nor does it drop a wind-up', foe.state === 'windup');
    foe.enter('patrol', 0);

    // a respawn: hands down, and 1.5 s to stand up in
    foe.enter('windup', 400);
    s.respawnAtCheckpoint();
    check('respawn drops the wind-up', foe.state === 'patrol');
    check('respawn calms him', foe.calmUntil - s.time.now > 1400);

    // a throw-out: the same once Jo is back at the lamp
    s.throwOut = real;
    foe.calmUntil = 0;
    foe.enter('patrol', 0);
    const lives = s.lives;
    s.throwOut(foe);
    foe.enter('windup', 99999);
    await dc.run(70);
    check('thrown out: hands down at the lamp', foe.state !== 'windup' && foe.calmUntil > s.time.now);
    s.lives = lives;
    await dc.run(40);

    foe.destroy();
    s.foes = s.foes.filter((f) => f !== foe);
    clearRun('chef');
    return { pass, detail: lines.join('; ') };
  },
};

export default [foeGrabFair, foePauseFair];
