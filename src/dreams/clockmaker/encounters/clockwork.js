// The clock's three jobs (THE STOPPED HOUR). One place each:
//   clockwork   the dial in the clock house (src/engines/clockwork.js; the
//               'world' presenter stages the dial over the wall clock): gear 1
//   gear 2 is a thing on a plank at the top of the weight shaft (a key item)
//   escapement  the bell chamber: seat gear 3 on the bob's beat; off it, the
//               escapement slips one back (src/engines/escapement.js)
//   strike      the yard: strike seven as the bob crosses. Each strike lights
//               a lamp up the hill, gate end first, and the camera holds the
//               gate and Jo together. Left alone, the clock strikes by itself:
//               the payoff cannot be missed, only played or watched.
import { clockwork } from '../../../engines/clockwork.js';
import { escapement as escapementEngine } from '../../../engines/escapement.js';
import { lampFlags, keeperAtStrike, hillFloor } from '../logic.js';

export default {
  id: 'clockwork',
  title: 'THE CLOCK',
  engine: clockwork,
  params: { gears: 1, speed: 140, window: 38 },
  presenter: 'world',
  view: 'clockwork',
  gearTotal: 3,
  radius: 54,
  camera: { zoom: 1.3 },
  hud: 'encounter',
  hint: '[E] when the hand is in the brass',
  pose: 'interact',
  // the danger stem is the tick-tock quickening (music.js clockhouse)
  onRender(scene) {
    if (scene.music) scene.music.setState('tense');
  },
  onWin: 'dial_done',
};

export const escapement = {
  id: 'escapement',
  title: 'THE THIRD GEAR',
  engine: escapementEngine,
  params: { beats: 4, period: 1800, window: 0.16, slip: true, assist: 0.25 },
  presenter: 'world',
  view: 'escapement',
  camera: { zoom: 1.25 },
  hint: '[E] as the bob crosses. Off the beat, it slips',
  pose: 'interact',
  onRender(scene) {
    if (scene.music) scene.music.setState('tense');
  },
  onWin: 'clock_done',
};

export const strike = {
  id: 'strike',
  title: 'SEVEN',
  engine: escapementEngine,
  params: { beats: 7, period: 2200, window: 0.14, patient: 3400 },
  presenter: 'world',
  view: 'escapement',
  sound: 'bell',
  canLeave: false, // it finishes by itself: nothing to walk away from
  outroMs: 1400,
  camera: { zoom: 0.9 },
  hint: '[E] as the bob crosses: strike the hour',
  pose: 'interact',
  onRender(scene, st) {
    if (scene.music) scene.music.setState('silent'); // nothing but the bell
    lampFlags(scene.F, st.count);
    // the keeper, as Jo asked him under the bell: on his way down the hill, or counting
    const F = scene.F;
    if ((F.strikes_seen || 0) === st.count) return;
    F.strikes_seen = st.count;
    const n = scene.npcs.get('keeper_hill');
    if (!n || !st.count) return;
    if (F.keeper_stays) scene.caption.say('keeper', `${['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven'][st.count - 1]}.`, { ms: 1000 });
    else {
      const r = scene.graph.room('yard');
      n.walkTo((r.tx + keeperAtStrike(st.count)) * 32, 130, (x) => r.ty * 32 + hillFloor(x - r.tx * 32));
    }
  },
  onWin: 'seven_struck',
};
