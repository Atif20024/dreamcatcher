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
  // two more things that answer the horn on the way down the street
  pane_rings: [{ sfx: 'bell' }, { say: { who: 'jo', text: 'The shelter glass hums back. Everything out here is in tune with something.' } }],
  bin_answers: [{ sfx: 'meow' }, { say: { who: 'jo', text: 'Something in the dumpster has opinions about my tone.' } }],
  // the neon plays back: the stage door is lit
  neon_done: [
    { set: 'neon_lit' },
    { sfx: 'buzz' },
    { camera: { push: 1.15, to: 'self', ms: 400 } },
    { if: 'neon_perfect', then: [{ say: { who: 'jo', text: 'There. Blue as a bruise. The stage door is lit.' } }], else: [{ say: { who: 'jo', text: 'It took some coaxing. Blue as a bruise. The stage door is lit.' } }] },
    { wait: 1200 },
    { camera: 'pop' },
    { objective: 'alley_in' },
    { sting: 'gate' },
  ],
  // the open mic, over: what the room did depends on how it went (Delphine
  // told him what to watch for); Ray puts his coat on and goes either way
  cellar_done: [
    { set: 'cellar_gig' },
    { music: 'quiet' },
    { sfx: 'clap' },
    {
      if: 'cellar_perfect',
      then: [{ say: { who: 'jo', text: 'Nine people clap. The bartender has stopped washing glasses.' } }],
      else: [
        {
          if: 'cellar_froze',
          then: [{ say: { who: 'jo', text: 'Nine people clap. Politely. The bartender never put the glass down.' } }],
          else: [{ say: { who: 'jo', text: 'Nine people clap. The bartender slows down. He does not stop.' } }],
        },
      ],
    },
    { wait: 2200 },
    { camera: { push: 1.3, to: 'npc:ray', ms: 600 } },
    {
      if: 'cellar_froze',
      then: [{ say: { who: 'jo', text: 'Ray looked up once, when I stopped. Now he is putting his coat on.' } }],
      else: [{ say: { who: 'jo', text: 'Ray has not looked up. He is putting his coat on.' } }],
    },
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
    // the camera finds her: a2, the second table (cellar origin 0,40: col 25, row 51)
    { camera: { push: 1.35, to: { x: 824, y: 1600 }, ms: 700 } },
    { say: { who: 'jo', text: 'Nine chairs. A woman with her coat on, eyes closed, still in hers.' } },
    { wait: 3000 },
    { say: { who: 'jo', text: "She'd stayed for the second song." } },
    { wait: 2600 },
    { camera: 'pop' },
    { lock: false },
  ],
  // Ray claps it; Jo answers it (the lesson played, not told)
  ray_drill_start: [{ call: 'afterTalk' }, { wait: 300 }, { encounter: 'ray_drill' }],
  ray_drill_done: [{ set: 'ray_lesson' }, { if: 'ray_drill_perfect', then: [{ say: { who: 'ray', text: 'There. Now it is a note.' } }], else: [{ say: { who: 'ray', text: 'Closer. Go on.' } }] }, { beat: 'ray_done' }],
  // the lesson is played: the gate to the dock opens
  ray_done: [
    { sting: 'gate' },
    { objective: 'to_dock' },
  ],
  // Saturday: Marcus calls Jo over as he comes through the door
  // (only if Jo is still in the room: walking back out inside the wait is no scene)
  marcus_calls: [{ wait: 900 }, { call: 'markRoom' }, { if: { all: [{ flag: '_in_backstage' }, { flag: 'marcus_left', not: true }] }, then: [{ talk: 'marcus_call' }] }],
  marcus_goes: [{ call: 'afterTalk' }, { say: { who: 'jo', text: 'He hugs me, hard, and goes out through the loading door.' } }, { wait: 1800 }, { fade: 'out', ms: 260 }, { set: 'marcus_gone' }, { fade: 'in', ms: 260 }],
  marcus_walks: [{ call: 'afterTalk' }, { say: { who: 'jo', text: 'He waits. Then he picks up his sticks and walks.' } }, { wait: 1800 }, { fade: 'out', ms: 260 }, { set: 'marcus_gone' }, { fade: 'in', ms: 260 }],
  // the things backstage that are not just furniture
  mirror: [{ say: { who: 'jo', text: "Tuesday's face. Saturday's jacket." } }],
  amp_answers: [{ sfx: 'buzz' }, { say: { who: 'tally', text: 'That amp is on my schedule, and you are not.' } }],
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
    { if: 'set_froze', then: [{ say: { who: 'jo', text: 'Eight thousand people. I think they forgave me.' } }], else: [{ say: { who: 'jo', text: 'Eight thousand people. All of them, at once.' } }] },
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
