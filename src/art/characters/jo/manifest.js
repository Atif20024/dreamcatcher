// Jo's character manifest (plan §4.6–4.7). The atlas build composes every
// animation from the rig + pose tables; the runtime reads this (via the
// atlas's index.json) to drive the AnimationController.
//
// Animation entry: { fps | mode:'stride' + step, loop, next?, fallback?,
//   events?: {frame: name}, rotatable? }. `step` is the ground (1× px) the
// body covers per frame: the planted foot moves exactly that far back per
// frame in the pose tables, so playback locked to distance never slides.

export default {
  id: 'jo',
  class: 'adult',
  source: 'rig',
  rig: 'jo',
  scale: 2, // authored 1×, drawn 2× (about 82 px tall)
  frame: [64, 64], // work canvas; frames are trimmed in the atlas
  anchor: [32, 58], // the boundary the soles stand on
  outfits: ['street', 'bare'],
  views: ['side', 'portrait'],
  portraits: ['neutral', 'smile', 'doubt', 'tired'],
  attach: ['hand_f', 'hand_b', 'head', 'hat', 'mouth'],
  animations: {
    idle: { fps: 5, loop: true },
    idle_fidget: { fps: 7, loop: false, next: 'idle', fallback: 'idle' },
    pockets: { fps: 4, loop: true, fallback: 'idle' },
    walk: { mode: 'stride', step: 4, loop: true, events: { 0: 'footstep', 4: 'footstep' }, fallback: 'idle' },
    jog: { mode: 'stride', step: 7, loop: true, events: { 0: 'footstep', 4: 'footstep' }, fallback: 'run' },
    run: { mode: 'stride', step: 7, loop: true, events: { 0: 'footstep', 4: 'footstep' }, fallback: 'walk' },
    run_start: { mode: 'stride', step: 4, loop: false, maxMs: 260, next: 'run', fallback: 'run' },
    skid: { fps: 16, loop: false, fallback: 'run', events: { 0: 'skid', 1: 'skid' } },
    turn: { fps: 20, loop: false, fallback: 'skid', events: { 0: 'skid' } },
    jump_anticipate: { fps: 30, loop: false, next: 'rise', fallback: 'rise' },
    rise: { fps: 12, loop: false, fallback: 'fall' },
    apex: { fps: 8, loop: true, fallback: 'rise' },
    fall: { fps: 10, loop: true, fallback: 'idle' },
    land: { fps: 22, loop: false, fallback: 'idle', events: { 0: 'land' } },
    hard_land: { fps: 14, loop: false, fallback: 'land', events: { 0: 'land' } },
    crouch: { fps: 24, loop: false, fallback: 'idle' },
    crouch_walk: { mode: 'stride', step: 3, loop: true, fallback: 'walk' },
    climb: { mode: 'stride', axis: 'y', step: 4, loop: true, fallback: 'idle' },
    climb_idle: { fps: 1, loop: true, fallback: 'climb' },
    wall_slide: { fps: 8, loop: true, fallback: 'fall' },
    wall_jump: { fps: 16, loop: false, next: 'rise', fallback: 'rise' },
    push: { fps: 8, loop: true, fallback: 'walk' },
    carry_idle: { fps: 4, loop: true, fallback: 'idle' },
    carry_walk: { mode: 'stride', step: 4, loop: true, events: { 0: 'footstep', 4: 'footstep' }, fallback: 'walk' },
    interact: { fps: 14, loop: false, fallback: 'idle' },
    hurt: { fps: 12, loop: false, fallback: 'fall' },
    caught: { fps: 10, loop: false, fallback: 'hurt' },
    death: { fps: 9, loop: false, fallback: 'hurt' },
    wake: { fps: 7, loop: false, fallback: 'idle' },
    celebrate: { fps: 10, loop: false, fallback: 'idle' },
    float: { fps: 3, loop: true, rotatable: true, fallback: 'fall' },
    play_trumpet: { fps: 5, loop: true, fallback: 'idle' },
    swing: { fps: 24, loop: false, fallback: 'interact' },
    pen: { fps: 16, loop: false, fallback: 'swing' },
    type: { fps: 10, loop: true, fallback: 'interact' },
    brush: { fps: 20, loop: false, fallback: 'swing' },
    brush_hold: { mode: 'stride', step: 7, loop: true, fallback: 'run' },
    sit_down: { fps: 10, loop: false, next: 'sit', fallback: 'sit' },
    sit: { fps: 1.5, loop: true, fallback: 'idle' },
    sit_ground: { fps: 1.5, loop: true, fallback: 'sit' },
    sit_up: { fps: 1.5, loop: true, fallback: 'sit' },
    sleep: { fps: 1, loop: true, fallback: 'sit' },
    look_up: { fps: 1.5, loop: true, fallback: 'idle' },
    laugh: { fps: 8, loop: true, fallback: 'idle' },
    shrug: { fps: 12, loop: false, fallback: 'idle' },
    wave: { fps: 8, loop: true, fallback: 'idle' },
  },
};
