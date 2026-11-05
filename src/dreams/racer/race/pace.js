// Aldo's run on the sheet: where a tidy car is at each moment of a time gate, so the
// strip can carry his dot and each lamp can say how Jo stands against him. The real
// engine with a tidy driver, its clock stretched to the time on the sheet.
import { Race, STEP } from '../../../engines/race.js';

const LOOK = 90; // m: how far ahead the driver reads a thing in the road
const SAMPLE = 0.25; // s

function tidy(race) {
  const c = race.jo;
  const b = race.nextBend(c.d);
  const block = race.obstacles.find((o) => !o.gone && o.d > c.d && o.d - c.d < LOOK);
  let aim = 0;
  if (block) aim = block.x + (block.x > 0 ? -0.7 : 0.7);
  else if (b && b.from - c.d < LOOK) aim = -b.side * 0.5;
  return { throttle: !race.wantsBrake(c, { margin: 8 }), brake: race.wantsBrake(c, { margin: 8 }), steer: Math.max(-1, Math.min(1, (aim - c.x) * 4)) };
}

// null unless the gate is a time. at(d): his time at that road; dAt(t): his road at that time
export function sheetPace(track) {
  const time = track.gate && track.gate.time;
  if (time === undefined) return null;
  const race = new Race(track);
  const ds = [];
  let next = 0;
  for (let i = 0; i < 180 / STEP && !race.result; i++) {
    race.step(tidy(race));
    if (race.t >= next) {
      ds.push(race.jo.d);
      next += SAMPLE;
    }
  }
  const bot = race.result ? race.result.time : ds.length * SAMPLE;
  ds.push(track.length);
  const k = time / bot;
  const dAt = (t) => {
    const f = Math.max(0, t / k / SAMPLE);
    const i = Math.min(ds.length - 2, Math.floor(f));
    return Math.min(track.length, ds[i] + (ds[i + 1] - ds[i]) * Math.min(1, f - i));
  };
  const at = (d) => {
    let i = 0;
    while (i < ds.length - 2 && ds[i + 1] < d) i++;
    return (i + Math.min(1, (d - ds[i]) / Math.max(0.01, ds[i + 1] - ds[i]))) * SAMPLE * k;
  };
  return { time, dAt, at };
}
