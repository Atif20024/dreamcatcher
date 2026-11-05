// The race's hand-off to the walk-in places. No Phaser: tests/raceResult.test.js.
// The result goes into the dream's saved run as plain flags (nothing new in the
// save format) at the finish line, before any card, so closing the tab on the
// card loses nothing. The prize is paid later, in the garage, once: a Continue
// that lands there with the result saved and no `paid` flag pays it; one with
// the flag does not (src/dreams/racer/verbs/garage.js).
//
//   flags: race_<id>_best     best place so far
//          race_<id>_time     the time of that place
//          race_<id>_passed   true once the gate was passed
//          race_<id>_prize    what the best place earned, in coins
//          race_<id>_paid     coins already paid for this race
//          race_<id>_tries    runs that ended short of the gate, or were restarted
//          done_<hook>        the season's stand-in for that race has been driven (season.js)
import { gatePassed } from '../../../engines/race.js';

export const flagOf = (trackId, what) => `race_${trackId}_${what}`;

// the run's flags → the run's flags with this finish in them (a worse run never
// takes away a better one)
export function applyResult(flags, track, { place, time }) {
  const f = (w) => flagOf(track.id, w);
  const out = { ...flags };
  const best = out[f('best')];
  if (best === undefined || place < best || (place === best && time < out[f('time')])) {
    out[f('best')] = place;
    out[f('time')] = Math.round(time * 100) / 100;
    // (a time gate has no second place to pay: the tin opens under the time)
    out[f('prize')] = (track.gate?.time === undefined || time <= track.gate.time) && track.prize ? track.prize[place] || 0 : 0;
  }
  if (gatePassed(track.gate, { place, time })) out[f('passed')] = true;
  else out[f('tries')] = (out[f('tries')] || 0) + 1;
  // shortcut: a STAND-IN opens the story on any finish; a real race will bring its own gate
  if (out.season_pending) {
    out[`done_${out.season_pending}`] = true;
    delete out.season_pending;
  }
  return out;
}

export const restarted = (flags, track) => ({ ...flags, [flagOf(track.id, 'tries')]: (flags[flagOf(track.id, 'tries')] || 0) + 1 });

// coins still owed for this race, gate or no gate: second place pays second's
// money (a better place on a later run pays the difference)
export function prizeOwed(flags, trackId) {
  const f = (w) => flagOf(trackId, w);
  return Math.max(0, (flags[f('prize')] || 0) - (flags[f('paid')] || 0));
}

// after three runs short of the gate, Ottavia whispers the brake marks (design §3)
export const SOFT_AID_AFTER = 3;
export const softAid = (flags, trackId) => (flags[flagOf(trackId, 'tries')] || 0) >= SOFT_AID_AFTER;

// the seconds, said aloud as a timekeeper says them: 33.8 is "Thirty-three eight"
const TENS = { 2: 'Twenty', 3: 'Thirty', 4: 'Forty', 5: 'Fifty' };
const UNITS = ['', '-one', '-two', '-three', '-four', '-five', '-six', '-seven', '-eight', '-nine'];
const WORDS = ['nought', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
export function spoken(t) {
  const tenths = Math.round(t * 10);
  const s = Math.floor(tenths / 10);
  const tens = TENS[Math.floor(s / 10)];
  return `${tens ? `${tens}${UNITS[s % 10]}` : s} ${WORDS[tenths % 10]}`;
}

// a miss by less than the clock's tenth must not read as the time on the sheet
export const shownTime = (time, gate, passed) => (!passed && gate?.time !== undefined && Math.round(time * 10) <= Math.round(gate.time * 10) ? gate.time + 0.1 : time);

export const clock = (t) => {
  const s = Math.max(0, t);
  const m = Math.floor(s / 60);
  return `${m}:${(s - m * 60).toFixed(1).padStart(4, '0')}`;
};

// about what each costs on the clock, from the bots (RACER_STAGE1_R2_REPORT.md, Round 3; the lamp and the straw re-measured on the four tracks)
const COST = { lamp: 4.5, straw: 1.2, rub: 0.3, launch: 0.4, underPerMs: 0.07 };
const WORTH_SAYING = 0.15;

// the card's one lesson: what this run gave away the most of ('' when it gave little)
export function costliest({ resets = 0, offroads = 0, rubs = 0, launched = true, slowest = null }) {
  const [cost, line] = [
    [resets * COST.lamp, 'Going back to the lamp cost you the most.'],
    [offroads * COST.straw, 'The straw cost you the most.'],
    [rubs * COST.rub, 'Rubbing the Corsa cost you the most.'],
    [launched ? 0 : COST.launch, `Missing the green cost you the most: it is worth ${COST.launch} s.`],
    [slowest ? slowest.under * COST.underPerMs : 0, slowest && `Slowest into the ${slowest.name}: ${Math.round(slowest.under * 3.6)} km/h under. That cost you the most.`],
  ].reduce((w, c) => (c[0] > w[0] ? c : w));
  return cost >= WORTH_SAYING ? line : '';
}
