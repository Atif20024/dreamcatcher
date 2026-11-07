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
import { uiText } from '../../../ui/text.js';
import { hud } from '../../../ui/hud.js';
import { sfx } from '../../../systems/audio.js';

const WORDS = ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven'];

// "Strike it with me": his count is the beat. At the top of each swing the next
// number comes up and a ring closes on it as the bob comes down; his word and the
// tick come as the window opens, so the strike is on his word. The windows are the
// same as alone (tuning.js): this only says when. A number he has called is called
// again until it is struck.
function keeperCount(scene, st, n) {
  const a = scene.encounters.active;
  let c = a.count;
  if (!c) {
    c = a.count = { ring: scene.add.graphics().setDepth(40), num: uiText(scene, 0, 0, '', { size: 'display', scale: 2, color: 'accent' }).setOrigin(0.5).setDepth(41), called: 0, top: false, said: false, struck: 0 };
    hud.set('context', '[E] on his count: strike the hour');
  }
  if (c.over) return;
  const call = () => {
    c.called = st.count + 1;
    c.said = false;
    c.num.setText(String(c.called));
  };
  if (st.count > c.struck) {
    c.struck = st.count;
    // his weight on the rope too
    scene.tweens.add({ targets: n, y: n.y + 4, duration: 110, yoyo: true, ease: 'Sine.easeOut' });
  }
  if (st.count >= 7) {
    c.over = true;
    c.ring.destroy();
    scene.tweens.add({ targets: c.num, alpha: 0, delay: 500, duration: 500, onComplete: () => c.num.destroy() });
    return;
  }
  const top = Math.abs(st.x) > 0.98;
  if (top && !c.top) call();
  c.top = top;
  // 0.5, a frame or two ahead of the window (it opens at |x| 0.43): an idle auto-strike
  // lands on the window's first frame, and must not beat his word
  if (c.called > st.count && !c.said && Math.abs(st.x) < 0.5) {
    c.said = true;
    scene.caption.say('keeper', `${WORDS[st.count]}.`, { ms: 900 });
    sfx('tick');
    n.setTalking(true);
    scene.time.delayedCall(350, () => n.setTalking(false));
  }
  const x = n.x - 104;
  const y = scene.player.y - 112;
  c.num.setPosition(x, y);
  c.ring.clear();
  if (c.called > st.count) c.ring.lineStyle(3, st.inWindow ? 0xf6d98a : 0xc8963a, 1).strokeCircle(x, y, 26 + 26 * Math.abs(st.x));
}

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
    // the keeper, as Jo asked him under the bell: counting, or on his way down the hill
    const F = scene.F;
    const n = scene.npcs.get('keeper_hill');
    if (n && F.keeper_stays) return keeperCount(scene, st, n);
    if ((F.strikes_seen || 0) === st.count) return;
    F.strikes_seen = st.count;
    if (!n || !st.count) return;
    const r = scene.graph.room('yard');
    n.walkTo((r.tx + keeperAtStrike(st.count)) * 32, 130, (x) => r.ty * 32 + hillFloor(x - r.tx * 32));
  },
  onWin: 'seven_struck',
};
