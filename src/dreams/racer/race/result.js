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
    out[f('prize')] = (track.prize && track.prize[place]) || 0;
  }
  if (place <= track.passPlace) out[f('passed')] = true;
  else out[f('tries')] = (out[f('tries')] || 0) + 1;
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

export const clock = (t) => {
  const s = Math.max(0, t);
  const m = Math.floor(s / 60);
  return `${m}:${(s - m * 60).toFixed(1).padStart(4, '0')}`;
};
