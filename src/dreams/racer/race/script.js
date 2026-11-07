// What happens on the road because of the story: pure state machines, no Phaser
// (tests/script.test.js). A script rides in the race (`new Race(track, { script })`)
// and runs each step before anybody drives; it can hand Jo's input back changed, and
// give a rival an `order`. The scene does not run it: it reads events and fields.
//
//   raceFor(track, flags, { tune, seed, tries }): the race for a track, its grid and its script. tries: failed tries so far (the help below); r.track is then the track to read the gate from
//   r.script: { state, flags, lamp, board }
//     flags  what the run has earned, for the save: held_aldo, broke_orders, helped_cassian, passed_cassian, done_race2 …
//     air    race 2: true while Jo is holding Aldo's air, false once he has been out of it for airWarn, null before either
//     lamp   the Gull lamp: 'lit' | 'dark' (null on a road without one)
//     board  the pit board's word right now, or null: 'HOLD', 'SHORT', 'LONG', 'GO', 'TYRES'
//
// Events:
//   gull_lamp { state }            the lamp changes
//   aldo_wide, aldo_dark           his tail lamps drift for 1.5 s, then go out and his engine stops
//   air { held }                   race 2: Jo is in Aldo's air with the bar full, or has been out of it for airWarn. r.script.air says the same now (null until the first)
//   teo_through                    Teo goes by Jo at the hairpin's exit
//   race_over { flags }            race 2's end, in place of `finish`: 2 s on the dark are already held, go to the garage
//   board { text, gap }            Jo passing the slate on the pit wall
//   orders_broken                  Jo went by Dante with HOLD on the board
//   pit { how: 'box'|'short'|'long', secs }, pit_go, pit_through    the stop, the crew's word, or no stop
//   wheel { id, d, gap }           Cassian's wheel goes (gap: how far he was ahead of Jo)
//   choice { how: 'stop' | 'pass' }, stop_go    Jo stops for him (6 s on the clock), or does not
import { Race, CAR_LEN, STEP, brakeDistance, gripFactor } from '../../../engines/race.js';
import { stopAt, slew, holdOn, slowTo, SPEED_K } from '../../../engines/rivals.js';
import { carTune } from './car.js';

const STOP_V = 0.5; // m/s: a car this slow has stopped
const LAMP_SEEN = 70; // m: the Gull lamp lights this far ahead of Jo

// Jo stood still by the story: the brake is on, and nobody drives into a car in a box
const stood = (jo) => {
  jo.ghost = Math.max(jo.ghost, STEP * 2);
  return { throttle: false, brake: true, steer: 0 };
};

// RACE 2. Follow him. At the Gull Bend he goes wide, and there is no finish.
function harbour() {
  const s = { state: 'race', flags: {}, lamp: 'lit', board: null, t: 0, air: null, airT: 0, outT: 0, heldAt: -Infinity };
  s.start = (race) => {
    const teo = race.rivals.find((c) => c.id === 'teo');
    if (teo) teo.order = (r, c) => holdOn(r, c, -4.5, -3.5, r.jo.x + Math.sin(r.t * r.tune.weaveRate) * r.tune.weave);
  };
  s.step = (race, input) => {
    const t = race.tune;
    const jo = race.jo;
    const aldo = race.rivals.find((c) => c.id === 'aldo');
    const teo = race.rivals.find((c) => c.id === 'teo');
    const { gull, hairpin, gullCue, patience } = race.track.script;
    const lamp = () => {
      s.lamp = 'dark';
      race.emit('gull_lamp', { state: 'dark' });
    };
    // Teo goes by on the way out of the hairpin: the late move Jo "saw"
    if (teo && !s.teoLet && jo.d >= race.track.bends.find((b) => b.name === hairpin).to) {
      s.teoLet = true;
      teo.order = null;
      teo.top = t.teoPassTop;
      teo.pull = t.teoPassPull;
      s.teoGoing = true;
    }
    if (s.teoGoing && teo.d > jo.d) {
      s.teoGoing = false;
      race.emit('teo_through', { id: 'teo' });
    }
    if (teo && s.teoLet && teo.d > aldo.d + CAR_LEN * 3) {
      teo.top = Math.min(teo.top, race.track.rivals.find((c) => c.id === 'teo').top);
      teo.pull = 1;
    }

    if (s.state === 'race') {
      // in his air with the bar full, at a racing pace, long enough: that is holding it, and the HUD and the radio can say so
      const inAir = jo.inDraft && jo.draftOf === aldo && jo.draft >= 1 && jo.v >= t.heldV;
      s.airT = inAir ? s.airT + STEP : 0;
      s.outT = inAir ? 0 : s.outT + STEP;
      if (s.airT >= t.airHold) s.heldAt = race.t;
      const held = s.airT >= t.airHold ? true : s.outT >= t.airWarn ? false : s.air;
      if (held !== s.air) {
        s.air = held;
        race.emit('air', { held });
      }
      // (a car that never comes: he drives on, and it happens up the road all the same)
      if (race.t >= patience && aldo.style === 'station') {
        aldo.style = 'clean';
        aldo.top = 1;
        aldo.line = 0;
        aldo.v = Math.max(aldo.v, jo.v);
      }
      if (jo.d >= gullCue || aldo.d >= gullCue) {
        s.state = 'wide';
        s.t = 0;
        // (the air, at a racing pace: the mentor nursing a car at a crawl is no air to have been in)
        s.flags.held_aldo = race.t - s.heldAt <= t.airWindow && jo.v >= t.heldV;
        const b = race.track.bends.find((q) => q.name === gull);
        aldo.style = 'clean';
        aldo.order = slew(b.side * 1.1);
        Object.assign(jo, { armed: false, draft: 0, draftOf: null }); // (no sling out of this)
        race.emit('aldo_wide', { id: 'aldo' });
        if (teo) teo.order = stopAt(race.track.length - 40);
      }
      return input;
    }
    s.t += STEP;
    if (s.state === 'wide' && s.t >= t.aldoDrift) {
      s.state = 'dark';
      s.t = 0;
      lamp();
      race.emit('aldo_dark', { id: 'aldo' });
    }
    if (s.state === 'dark' && s.t >= t.darkStop && !s.done) {
      s.done = true;
      s.flags.done_race2 = true;
      s.state = 'over';
      race.emit('race_over', { flags: s.flags });
    }
    // The last seconds: the brake is all he has, and she stops by the verge on her own
    const b = race.bendAt(jo.d) ?? race.track.bends.find((q) => q.name === gull);
    return { throttle: false, brake: true, steer: Math.max(-1, Math.min(1, (-b.side * 0.8 - jo.x) / 0.1)) };
  };
  return s;
}

// RACE 3. The sheet pays. If the orders stood, the slate says HOLD while Dante is ahead
function salt(F) {
  const s = { state: 'race', flags: {}, lamp: null, board: null, boards: 0 };
  s.start = (race) => {
    if (F.tyres_short) race.jo.grip = race.tune.wornStart;
  };
  s.step = (race, input) => {
    const jo = race.jo;
    const dante = race.rivals.find((c) => c.id === 'dante');
    if (F.sable_orders) {
      const ahead = dante.d > jo.d;
      s.board = ahead ? 'HOLD' : null;
      const slate = race.track.script.boards[s.boards];
      if (slate !== undefined && jo.d >= slate) {
        s.boards += 1;
        if (ahead) race.emit('board', { text: 'HOLD' });
      }
      if (!ahead && !s.flags.broke_orders && jo.state === 'run') {
        s.flags.broke_orders = true;
        race.emit('orders_broken');
      }
    }
    return input;
  };
  return s;
}

// RACE 4. Two laps, the box at the end of the first, the wheel at the Bend on the second
function coppa(F) {
  const s = { state: 'lap1', flags: {}, lamp: 'dark', board: null, t: 0, pit: 'ahead', holdT: 0, wheel: 'wait' };
  s.step = (race, input) => {
    const t = race.tune;
    const jo = race.jo;
    const { box, lamp, gull, stalls } = race.track.script;
    // (it lights as he comes up the hill to it, so the light is ahead of him and he sees it come up, not at his elbow)
    if (s.lamp === 'dark' && jo.d >= lamp - LAMP_SEEN) {
      s.lamp = 'lit';
      race.emit('gull_lamp', { state: 'lit' });
    }

    // everybody stops on the same lap, for the same 3 s, at their own stall
    for (const c of race.rivals) {
      const stall = stalls[c.id];
      if (stall && !c.pitted && !c.out && c.d >= stall - t.pitLook) {
        c.pitted = true;
        if (c.newTyres) c.grip = 1;
        c.order = stopAt(stall, t.pitBox, t.pitLine);
      }
    }

    let out = input;
    // JO'S STOP. Nose in the 12 m, or the crew runs. Drive through and there is no second lap in them
    const nose = jo.d + CAR_LEN / 2;
    if (s.pit === 'ahead' && nose >= box.d - box.zone) {
      if (jo.v < STOP_V && jo.state === 'run' && nose <= box.d + box.len + box.zone) {
        const how = nose < box.d ? 'short' : nose > box.d + box.len ? 'long' : 'box';
        s.pit = 'in';
        s.holdT = how !== 'box' ? t.pitMiss : F.pit_clean ? t.pitClean : t.pitBox;
        s.board = how === 'box' ? null : how.toUpperCase();
        race.emit('pit', { how, secs: s.holdT });
      } else if (nose > box.d + box.len + box.zone) {
        s.pit = 'through';
        jo.grip = Math.min(jo.grip, t.pitThrough);
        race.tune = { ...t, gripMin: t.pitThroughMin }; // (what is left of a soft set is not soft)
        s.board = 'TYRES';
        race.emit('pit_through');
      }
    }
    if (s.pit === 'in') {
      s.holdT -= STEP;
      if (s.holdT <= 0) {
        s.pit = 'done';
        s.board = 'GO';
        jo.grip = 1;
        race.emit('pit_go');
      } else out = stood(jo);
    }

    // THE WHEEL. It waits until he is near Jo, up to the bend's exit
    const cassian = race.rivals.find((c) => c.id === 'cassian');
    const b = race.track.bends.filter((q) => q.name === gull)[1];
    if (s.wheel === 'wait' && cassian && cassian.d >= b.from) {
      const gap = cassian.d - jo.d;
      if (Math.abs(gap) <= t.wheelNear || cassian.d >= b.to - t.wheelExit) {
        s.wheel = 'off';
        cassian.out = true;
        cassian.ghost = Infinity; // (he is the story now, not traffic)
        s.passBy = Math.max(t.stopNear, -gap + brakeDistance(jo.v, 0, gripFactor(jo.grip, t), t) + t.stopNear / 4); // (if he went off behind Jo, Jo can still stop)
        cassian.order = slew(-b.side * 1.15); // into the straw by the lamp, on the inside
        race.emit('wheel', { id: cassian.id, d: cassian.d, gap });
      }
    }
    if (s.wheel === 'off') {
      if (jo.v < STOP_V && jo.state === 'run' && Math.abs(jo.d - cassian.d) <= s.passBy) {
        s.wheel = 'helping';
        s.holdT = t.stopHelp;
        s.flags.helped_cassian = true;
        race.emit('choice', { how: 'stop' });
        s.yellow = race.rivals.filter((c) => !c.out && c.d < cassian.d);
      } else if (jo.d > cassian.d + s.passBy) {
        s.wheel = 'passed';
        s.flags.passed_cassian = true;
        race.emit('choice', { how: 'pass' });
      }
    }
    if (s.wheel === 'helping') {
      s.holdT -= STEP;
      if (s.holdT <= 0) {
        s.wheel = 'helped';
        race.emit('stop_go');
      } else out = stood(jo);
    }
    // the marshals are out for a car on the road: whoever has yet to come by does it slowly, so the kind choice costs the clock and not the race
    s.yellow = s.yellow?.filter((c) => {
      if (c.d < cassian.d - t.yellowLook) return true;
      if (c.state === 'run') c.order = slowTo(cassian.d + t.yellowPast, t.yellowV);
      return false;
    });
    return out;
  };
  return s;
}

const SCRIPTS = { harbour, salt, coppa };

// A race given up counts as a try (and buys the help below) only once it was a real attempt: past half its road.
// A finish short of the gate is always one (result.js applyResult); a restart in the first half never is
export const triedIt = (race) => !race.result && race.jo.d >= race.track.length / 2;

// The help a failed try buys, never announced: the rivals a little off their pace, or a little more time on the sheet.
// Same track object at tries 0; r.track carries the eased gate, so whoever reads the number agrees with the check.
export function raceFor(track, F = {}, { tune = carTune(track, F), seed = 1, tries = 0 } = {}) {
  const script = SCRIPTS[track.id]?.(F) ?? null;
  const n = Math.min(tries, tune.easeMax);
  const road = n && track.gate?.time !== undefined ? { ...track, gate: { ...track.gate, time: track.gate.time + n * tune.easeTime } } : track;
  const ease = n && track.gate?.place !== undefined ? Math.max(tune.easeFloor, 1 - n * (track.ease ?? tune.easePace)) : 1;
  const rivals = (track.rivals ?? (track.rival ? [track.rival] : [])).map((r) => (ease === 1 || r.doomed ? r : { ...r, top: (r.top ?? 1) * ease, k: (r.k ?? SPEED_K) * ease }));
  return new Race(road, { rivals, tune, seed, script });
}
