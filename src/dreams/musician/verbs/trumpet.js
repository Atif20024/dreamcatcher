// The trumpet (the Musician's verb, plan 2.1; design spec §3.1 PLAY):
// [Q] (act2) plays a note, in the key of the band he can hear. A gold ring
// opens from the bell; anything resonant in reach answers (the horn in the
// shop window), people stop to listen (a roadie turns toward the sound:
// distract), and the feedback wisps fall silent. A short breath between notes.
// One place breaks the rule: room.roar, a stretch where the crowd comes through
// the wall so loud that the horn is drowned. Nothing answers; jump the wisp.
import { trumpetHz as blow, sfx } from '../../../systems/audio.js';
import { noteHz } from '../../../audio/modes.js';

const RADIUS = 150;
const BREATH_MS = 380;
const DROWNED_BREATH_MS = 1000;
const TUNE = [0, 2, 4, 7, 4];
const T = 32;

// inside room.roar { rows: [top, bottom] }? (room rows; py is world px)
export function drowned(room, py) {
  const roar = room && room.data && room.data.roar;
  if (!roar) return false;
  const row = Math.floor(py / T) - room.ty;
  return row >= roar.rows[0] && row <= roar.rows[1];
}

export default {
  id: 'trumpet',
  keys: ['act2'],
  create(ctx) {
    ctx.state.notes = 0;
    ctx.state.next = 0;
    ctx.state.inRoar = false;
  },
  update(ctx) {
    const s = ctx.scene;
    const p = ctx.player;
    const loud = drowned(s.graph.roomAt(p.x, p.y), p.y);
    if (loud && !ctx.state.inRoar) {
      sfx('roar');
      // (twice: he may have missed it the first time, on his way to a wisp)
      ctx.flags.roar_told = (ctx.flags.roar_told || 0) + 1;
      if (ctx.flags.roar_told <= 2) ctx.services.caption.say('jo', ctx.flags.roar_told === 1 ? "The crowd's right through this wall. I can't hear my own horn." : "Can't hear the horn up here. Jump it.", { ms: 2800 });
    }
    ctx.state.inRoar = loud;
    if (!ctx.input.justDown('act2')) return;
    if (s.time.now < ctx.state.next) return;
    ctx.state.next = s.time.now + (loud ? DROWNED_BREATH_MS : BREATH_MS);
    ctx.state.notes += 1;
    ctx.flags.played_note = true;
    const cur = (s.music && s.music.cur) || { root: 73.42, mode: 'dorian' };
    blow(noteHz({ root: cur.root, mode: cur.mode, oct: 2 }, TUNE[ctx.state.notes % TUNE.length]), loud ? 0.2 : 0.35, loud ? 0.08 : 0.3);
    if (p.pose && p.body.blocked.down) p.pose('play_trumpet', { ms: 320 });
    const bx = p.x + (p.flipX ? -22 : 22);
    const by = p.y - 6;
    const ring = s.add.circle(bx, by, 10, 0xf2d580, 0).setStrokeStyle(3, 0xf2d580, loud ? 0.35 : 0.9).setDepth(13);
    const radius = loud ? 34 : RADIUS;
    s.tweens.add({ targets: ring, scale: radius / 10, alpha: 0, duration: loud ? 260 : 520, ease: 'sine.out', onComplete: () => ring.destroy() });
    if (!loud) s.ringAt(bx, by, RADIUS);
  },
};
