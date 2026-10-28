// A verb module (plan 2.1): the smallest one, to show the shape.
//   { id, keys (≤ 2 actions), create(ctx), update(ctx, dt), onEvent?(ctx, evt), hudWidget?, teach? }
// [Q] (act2): Jo whistles. Anyone near turns to look; it does nothing else.
import { busTone } from '../../../audio/AudioBus.js';

export default {
  id: 'whistle',
  keys: ['act2'],
  create(ctx) {
    ctx.state.whistles = 0;
  },
  update(ctx) {
    if (!ctx.input.justDown('act2')) return;
    ctx.state.whistles += 1;
    [988, 1319].forEach((f, i) => busTone('sfx', f, 0.16, 'sine', 0.08, i * 0.12, f * 1.02));
    for (const npc of ctx.npcs()) if (Math.abs(npc.x - ctx.player.x) < 400) npc.facing = Math.sign(ctx.player.x - npc.x) || npc.facing;
  },
};
