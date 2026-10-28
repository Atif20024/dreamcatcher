// The trumpet (the Musician's verb, plan 2.1; design spec §3.1 PLAY):
// [Q] (act2) plays a note. A gold ring opens from the bell; anything
// resonant in reach answers (the horn in the shop window), people stop to
// listen (a roadie turns toward the sound: distract), and the feedback
// wisps fall silent. A short breath between notes.
import { trumpet as blow } from '../../../systems/audio.js';

const RADIUS = 150;
const BREATH_MS = 380;

export default {
  id: 'trumpet',
  keys: ['act2'],
  create(ctx) {
    ctx.state.notes = 0;
    ctx.state.next = 0;
  },
  update(ctx) {
    if (!ctx.input.justDown('act2')) return;
    const s = ctx.scene;
    const p = ctx.player;
    if (s.time.now < ctx.state.next) return;
    ctx.state.next = s.time.now + BREATH_MS;
    ctx.state.notes += 1;
    ctx.flags.played_note = true;
    blow([4, 7, 9, 11, 7][ctx.state.notes % 5], 0.35, 0.3);
    if (p.pose && p.body.blocked.down) p.pose('play_trumpet', { ms: 320 });
    const bx = p.x + (p.flipX ? -22 : 22);
    const by = p.y - 6;
    const ring = s.add.circle(bx, by, 10, 0xf2d580, 0).setStrokeStyle(3, 0xf2d580, 0.9).setDepth(13);
    s.tweens.add({ targets: ring, scale: RADIUS / 10, alpha: 0, duration: 520, ease: 'sine.out', onComplete: () => ring.destroy() });
    s.ringAt(bx, by, RADIUS);
  },
};
