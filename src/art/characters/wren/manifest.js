// Wren, the lamplighter (proof dream NPC). Same scale class as Jo (2× rig,
// about 82 px tall). Her task loop is the fidget; `talk` plays while she is
// the speaker in a scene box (src/actors/Npc.js).
export default {
  id: 'wren',
  class: 'adult',
  source: 'rig',
  rig: 'wren',
  scale: 2,
  frame: [64, 64],
  anchor: [32, 58],
  outfits: ['street'],
  views: ['side', 'portrait'],
  portraits: ['neutral', 'smile', 'worried'],
  attach: ['hand_f', 'hand_b', 'head', 'hat', 'mouth'],
  animations: {
    idle: { fps: 5, loop: true },
    idle_fidget: { fps: 7, loop: false, next: 'idle', fallback: 'idle' },
    walk: { mode: 'stride', step: 3, loop: true, events: { 0: 'footstep', 4: 'footstep' }, fallback: 'idle' },
    talk: { fps: 6, loop: true, fallback: 'idle' },
    wave: { fps: 8, loop: true, fallback: 'idle' },
    laugh: { fps: 8, loop: true, fallback: 'idle' },
    shrug: { fps: 12, loop: false, fallback: 'idle' },
    interact: { fps: 14, loop: false, fallback: 'idle' },
    look_up: { fps: 1.5, loop: true, fallback: 'idle' },
  },
};
