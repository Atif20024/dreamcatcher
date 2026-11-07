// Wren's pose tables: Jo's adult cycles (the same skeleton and metrics, so
// the walk's planted foot moves exactly `step` px a frame, no slide), plus
// her own `talk` loop: she talks with her hands — an open palm on the
// stressed beat, the back hand on her hip, the head nodding on the phrase.
import { POSES as JO } from './jo.poses.js';

const STAND = { fF: [1, 0, 'flat'], fB: [-1, 0, 'flat'], aF: [-4, 10], aB: [6, 12] };
const P = (o = {}) => ({ ...STAND, ...o });

const TALK = [
  P({ aF: [30, 60], aB: [-20, 90], head: 'talk', chest: 0 }),
  P({ aF: [55, 50], aB: [-20, 90], head: 'base', chest: 1, handF: 'flat' }),
  P({ aF: [70, 40], aB: [-20, 90], head: 'talk', chest: 1, handF: 'flat', headDy: 1 }),
  P({ aF: [50, 55], aB: [-20, 90], head: 'base', chest: 0 }),
  P({ aF: [25, 70], aB: [-20, 90], head: 'talk', chest: 0, lean: 1 }),
  P({ aF: [10, 40], aB: [-20, 90], head: 'base', chest: 0 }),
];

export const POSES = {
  idle: JO.idle,
  idle_fidget: JO.idle_fidget,
  walk: JO.walk,
  talk: TALK,
  wave: JO.wave,
  laugh: JO.laugh,
  shrug: JO.shrug,
  interact: JO.interact,
  look_up: JO.look_up,
};
