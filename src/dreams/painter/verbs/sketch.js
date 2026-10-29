// The silverpoint (THE MASTER'S LADDER's verb, plan 2.1): [Q] (act2) Jo
// draws what is in front of him on his little prepared tablet. A pale ring
// of the stylus opens from his hand; a study in reach is taken (the antique
// torso, the beggar's hands, the dome's centering: optional, remembered at
// the end), and people stop to watch a boy drawing (a foe in reach is
// distracted and turns to look). A moment between drawings.
// It also keeps the commission's contract on the HUD once it is signed
// (src/dreams/painter/contract.js); the giornata spends it.
import { busTone } from '../../../audio/AudioBus.js';
import { showContract, contractLeft, resetContract } from '../contract.js';

const RADIUS = 130;
const REST_MS = 420;

export default {
  id: 'sketch',
  keys: ['act2'],
  create(ctx) {
    ctx.state.next = 0;
    ctx.state.studies = 0;
    resetContract();
  },
  update(ctx) {
    const s = ctx.scene;
    const F = ctx.flags;
    // the contract, once it is signed (the giornata's presenter spends it)
    if (!(s.encounters && s.encounters.busy)) showContract(F.commission && !F.judged ? contractLeft(0) : null);
    if (!ctx.input.justDown('act2')) return;
    const p = ctx.player;
    if (s.time.now < ctx.state.next || s.encounters.busy) return;
    ctx.state.next = s.time.now + REST_MS;
    F.sketched = true;
    // the stylus on the tablet: two dry little scratches
    busTone('sfx', 2600, 0.05, 'triangle', 0.03);
    busTone('sfx', 3100, 0.04, 'triangle', 0.025, 0.07);
    if (p.pose && p.body.blocked.down) p.pose('pen', { ms: 360 });
    const bx = p.x + (p.flipX ? -20 : 20);
    const by = p.y - 10;
    const ring = s.add.circle(bx, by, 8, 0xe8e0d0, 0).setStrokeStyle(2, 0xe8e0d0, 0.85).setDepth(13);
    s.tweens.add({ targets: ring, scale: RADIUS / 8, alpha: 0, duration: 560, ease: 'sine.out', onComplete: () => ring.destroy() });
    const hit = s.ringAt(bx, by, RADIUS);
    ctx.state.studies += hit.filter((id) => String(id).startsWith('study_')).length;
  },
};
