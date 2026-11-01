// A verb module (plan 2.1): the smallest one, to show the shape.
//   { id, keys (≤ 2 actions), create(ctx), update(ctx, dt), onEvent?(ctx, evt), hudWidget?, teach? }
// [Q] (act2): Jo whistles. Anyone near turns to look, and the child at the
// window in the lane, who asks him to, whistles back and drops him a coin.
import { busTone } from '../../../audio/AudioBus.js';
import { CHILD } from '../rooms/lane.js';

const T = 32;
const NEAR = 5 * T;
const HEARS = 10 * T;

export default {
  id: 'whistle',
  keys: ['act2'],
  create(ctx) {
    ctx.state.whistles = 0;
  },
  update(ctx) {
    const s = ctx.scene;
    const F = ctx.flags;
    const r = s.graph.room('lane');
    const cx = (r.tx + CHILD.x) * T;
    const d = s.roomId === 'lane' ? Math.abs(ctx.player.x - cx) : Infinity;
    // she only speaks when Jo is under her window
    if (d < NEAR && !F.child_asked) {
      F.child_asked = true;
      s.caption.say('child', 'Why did the lamps go out?', { ms: 2400 });
      s.caption.say('child', 'Can you whistle? My brother can. [Q]', { ms: 2800 });
    }
    if (d < NEAR && F.struck && !F.child_after) {
      F.child_after = true;
      s.caption.say('child', 'They came back! I told you they came back!', { ms: 2800 });
    }
    if (!ctx.input.justDown('act2')) return;
    ctx.state.whistles += 1;
    [988, 1319].forEach((f, i) => busTone('sfx', f, 0.16, 'sine', 0.08, i * 0.12, f * 1.02));
    for (const npc of ctx.npcs()) if (Math.abs(npc.x - ctx.player.x) < 400) npc.facing = Math.sign(ctx.player.x - npc.x) || npc.facing;
    if (d < HEARS && !F.child_coin) {
      F.child_coin = true;
      F.child_waved = true;
      [1319, 988].forEach((f, i) => busTone('sfx', f, 0.14, 'sine', 0.05, 0.5 + i * 0.12, f * 1.02));
      s.caption.say('child', 'Not bad! Catch!', { ms: 2000 });
      s.spawnPickups([{ type: 'coin', wx: cx, wy: (r.ty + 14) * T + T / 2 }]);
    }
  },
};
