// The clock's works (THE STOPPED HOUR; no keys of its own): what the state of
// the clock does to the world.
//   the loose pendulums (room.pendulums, tiles): swing and count nothing until
//     the clock is wound. A knock sends Jo off his ledge to the one below; the
//     first is free and none takes his last heart (logic.js pendulumToll): this
//     is where the first-time player learns that a thing can hurt, softly
//   the sound: no tick anywhere until the clock is wound, then it is in every
//     place (the *_going keys in music.js)
//   the stage: the first step out on the hill, the first step back on the
//     lit green (beats out_on_hill, green_lit)
import { bobAt, bobHits, pendulumToll } from '../logic.js';
import { sfx } from '../../../systems/audio.js';

const T = 32;
const GOING = { green: 'green_going', lane: 'lane_going', clockhouse: 'clockhouse_going', shaft: 'clockhouse_going', belfry: 'clockhouse_going' };

export default {
  id: 'works',
  keys: [],
  create(ctx) {
    const s = ctx.scene;
    ctx.state.rooms = [];
    ctx.state.hitAt = -1e9;
    for (const r of s.graph.rooms.values()) {
      if (!(r.data.pendulums || []).length) continue;
      ctx.state.rooms.push({ r, defs: r.data.pendulums, g: s.add.graphics().setDepth(-6) });
    }
  },
  update(ctx) {
    const s = ctx.scene;
    const F = ctx.flags;
    const now = s.time.now;
    const p = ctx.player;
    // no fail state for the room's own mood: a left encounter leaves no tension behind
    if (!s.encounterActive && s.music && s.music.state === 'tense' && s.graph.room(s.roomId).data.music) s.music.setState(s._roomMusicState || 'quiet');
    if (F.clock_wound && GOING[s.roomId] && s.music) s.music.setKey(GOING[s.roomId]);
    for (const { r, defs, g } of ctx.state.rooms) {
      g.clear();
      if (r.id !== s.roomId) continue;
      const ox = r.tx * T;
      const oy = r.ty * T;
      for (const d of defs) {
        const b = bobAt(d, now, !!F.clock_wound);
        // the rod from its pivot, the brass bob; the wound clock's are quiet
        g.lineStyle(4, 0x4a3a2a, 1).lineBetween(ox + (d.x + 0.5) * T, oy + d.row * T, ox + b.x, oy + b.y);
        g.fillStyle(0x8a6a2c, 1).fillCircle(ox + b.x, oy + b.y, 20);
        g.fillStyle(0xf2d580, 1).fillCircle(ox + b.x - 5, oy + b.y - 6, 9);
        if (F.clock_wound || s.encounterActive || now - ctx.state.hitAt < 1200) continue;
        const body = p.body;
        if (!bobHits(b, { left: body.left - ox, right: body.right - ox, top: body.top - oy, bottom: body.bottom - oy })) continue;
        ctx.state.hitAt = now;
        const hits = F.pendulum_hits || 0;
        F.pendulum_hits = hits + 1;
        if (pendulumToll(hits, s.health ? s.health.hearts : 3)) s.hurt({ sourceX: ox + b.x });
        else {
          sfx('hurt');
          s.knockback(ox + b.x);
          s.cameras.main.shake(120, 0.004);
        }
        if (!hits) s.caption.say('jo', "It doesn't hit hard. It doesn't stop, either. Wait for it.", { ms: 3200 });
      }
    }
    if (s.transitions.busy || s.beats.busy) return;
    // out of the belfry onto the hill: the whole job, once, from up here
    if (s.roomId === 'yard' && F.clock_wound && !F.struck && !F.yard_seen) {
      F.yard_seen = true;
      s.beats.play('out_on_hill').catch((e) => console.warn('[dream] beat', e));
    }
    // back through the gate: the town is lit, and Nell has one lamp left
    // (green_lit is set at the beat's end: a quit during it plays it again)
    if (s.roomId === 'green' && F.struck && !F.green_lit && !ctx.state.greenPlayed) {
      ctx.state.greenPlayed = true;
      F.child_waved = true;
      s.beats.play('green_lit').catch((e) => console.warn('[dream] beat', e));
    }
  },
};
