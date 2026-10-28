// THE BIG STAGE's beats (plan 2.1 BeatRunner): data, run on events.
export default {
  // the arrival: Jo's one line to himself (the lie the dream disproves)
  start: [
    { wait: 600 },
    { music: 'quiet' },
    { say: { who: 'jo', text: "Saturday. Big stage. That's… that's the whole thing." } },
    { wait: 3200 },
    { say: { who: 'jo', text: 'Everything before that is just waiting.' } },
  ],
  // [Q] at the shop window: the horn rings back (Jo's first note)
  horn_answers: [
    { sfx: 'bell' },
    { say: { who: 'jo', text: 'The horn in the window rang back.' } },
  ],
  // the neon plays back: the stage door is lit
  neon_done: [
    { set: 'neon_lit' },
    { sfx: 'buzz' },
    { camera: { push: 1.15, to: 'self', ms: 400 } },
    { say: { who: 'jo', text: 'There. Blue as a bruise. The stage door is lit.' } },
    { wait: 1200 },
    { camera: 'pop' },
    { objective: 'alley_in' },
    { sting: 'gate' },
  ],
  // the open mic, won: nine people clap; Ray puts his coat on and goes
  cellar_done: [
    { set: 'cellar_gig' },
    { music: 'quiet' },
    { say: { who: 'jo', text: 'Nine people clap. The bartender has stopped washing glasses.' } },
    { wait: 2200 },
    { camera: { push: 1.3, to: 'npc:ray', ms: 600 } },
    { say: { who: 'jo', text: 'Ray has not looked up. He is putting his coat on.' } },
    { wait: 1800 },
    { fade: 'out', ms: 300 },
    { set: 'ray_left' },
    { fade: 'in', ms: 300 },
    { camera: 'pop' },
    { talk: 'delphine_after' },
    { objective: 'follow_ray' },
  ],
  // Small Moment #1, "Nine": the stage edge after the gig
  moment_nine: [
    { lock: true },
    { anim: { who: 'jo', name: 'sit_down' } },
    { camera: { push: 1.35, to: 'self', ms: 700 } },
    { say: { who: 'jo', text: 'Nine chairs. A woman with her coat on, eyes closed, still in hers.' } },
    { wait: 3000 },
    { say: { who: 'jo', text: "She'd stayed for the second song." } },
    { wait: 2600 },
    { camera: 'pop' },
    { lock: false },
  ],
  // Ray said his piece: the gate to the dock opens
  ray_done: [
    { sting: 'gate' },
    { objective: 'to_dock' },
  ],
  // the laminate, and Tally's answer: both open the stage door
  got_laminate: [{ if: 'offer_heard', then: [{ set: 'stage_ready' }, { objective: 'up_stairs' }, { sting: 'gate' }] }],
  offer_done: [
    { set: 'offer_heard' },
    { if: 'laminate', then: [{ set: 'stage_ready' }, { objective: 'up_stairs' }, { sting: 'gate' }], else: [{ objective: 'get_laminate' }] },
  ],
  // the set is over: huge and short, then a hard cut to work lights
  set_done: [
    { set: 'set_played' },
    { camera: { vista: 0.85, to: 'self', ms: 500 } },
    { say: { who: 'jo', text: 'Eight thousand people. All of them, at once.' } },
    { wait: 2600 },
    { fade: 'out', ms: 120 },
    { set: 'set_done' },
    { music: 'quiet' },
    { if: 'choice_nia', then: [{ set: 'nia_after' }] },
    { wait: 900 },
    { fade: 'in', ms: 1400 },
    { camera: 'pop' },
    { objective: 'after' },
  ],
};
