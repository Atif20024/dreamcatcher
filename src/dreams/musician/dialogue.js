// THE BIG STAGE's lines (plan 4.8; the design spec docs/dream_musician_big_stage.md).
// The seven "days" are one night here: the Cellar on a Tuesday, then
// through the loading door it is Saturday. Scene conversations open only on
// [E] or from a beat; barks ride the caption bar.
// Portraits: the cast's own faces, cut from their rigs (dreamAdapters
// castPortrait: `face` names the cast key).
// How Jo played reads through the gig flags (encounters/sets.js gigFlags): a
// node's `if` fails over to its `else`, so a line is only ever said when true.
// Narration is Jo's own caption (beats.js), never spoken by someone else.
export const CAST = {
  jo: { name: 'JO', portrait: 'portrait-jo', voicePitch: 1 },
  delphine: { name: 'DELPHINE', portrait: 'portrait-mus-delphine', face: 'npc-delphine', voicePitch: 0.85 },
  ray: { name: 'RAY', portrait: 'portrait-mus-ray', face: 'npc-ray', voicePitch: 0.7 },
  nia: { name: 'NIA', portrait: 'portrait-mus-nia', face: 'npc-nia', voicePitch: 1.15 },
  marcus: { name: 'MARCUS', portrait: 'portrait-mus-marcus', face: 'npc-marcus', voicePitch: 0.8 },
  tally: { name: 'MR. TALLY', portrait: 'portrait-mus-tally', face: 'npc-tally', voicePitch: 1.05 },
  bouncer: { name: 'DOOR', portrait: 'portrait-mus-bouncer', face: 'foe-bouncer', voicePitch: 0.6 },
  barkeep: { name: 'BARTENDER', portrait: 'portrait-mus-barkeep', face: 'npc-sol', voicePitch: 0.9 },
  stagehand: { name: 'STAGEHAND', portrait: 'portrait-mus-stagehand', face: 'npc-roadie', voicePitch: 0.95 },
  crew: { name: 'OTHER STAGEHAND', portrait: 'portrait-mus-crew', face: 'foe-roadie', voicePitch: 0.75 },
  session: { name: 'SESSION GUY', portrait: 'portrait-mus-session', face: 'npc-scalper', voicePitch: 0.9 },
  sweeper: { name: 'SWEEPER', portrait: 'portrait-mus-sweeper', face: 'ev-p-sweeper', voicePitch: 0.8 },
};

const conv = (id, cast, nodes, extra = {}) => ({ id, channel: 'scene', camera: 'talk', cast, nodes, ...extra });

export const CONVERSATIONS = {
  // ---- the street ----
  bouncer: conv('bouncer', ['bouncer', 'jo'], {
    start: { who: 'bouncer', text: 'Case like that, you are a musician. Musicians go round the back.', next: 'b2' },
    b2: { who: 'bouncer', text: 'The alley. Stage door, under the blue sign. If the sign is dead, wake it up.', set: { met_bouncer: true }, end: true },
  }),
  bouncer_again: conv('bouncer_again', ['bouncer'], { start: { who: 'bouncer', text: 'The alley. Under the blue sign.', end: true } }, { replayable: true }),
  sweeper: conv('sweeper', ['sweeper'], { start: { who: 'sweeper', text: 'Last bus went by at ten. I stay for the roof.', end: true } }, { replayable: true }),
  sweeper_glass: conv('sweeper_glass', ['sweeper'], { start: { who: 'sweeper', text: 'Do that to the glass again and I bill you for it.', end: true } }, { replayable: true }),

  // ---- the Blue Cellar ----
  delphine_first: conv('delphine_first', ['delphine', 'jo'], {
    start: { who: 'delphine', text: 'Open mic. Two songs. If the bartender stops washing glasses, you were good.', next: 'd2' },
    d2: { who: 'delphine', expr: 'smile', text: 'If Ray looks up, you were very good.', next: 'j1' },
    j1: {
      who: 'jo',
      text: '…',
      choices: [
        { text: 'Put me down.', next: 'd3' },
        { text: 'Which one is Ray?', next: 'd4' },
      ],
    },
    d4: { who: 'delphine', text: 'End of the bar. The one who has not looked up since nineteen sixty-one.', next: 'd3' },
    d3: { who: 'delphine', text: "You're on. The stage is a foot high. Mind it.", set: { signed_up: true }, effects: [{ objective: 'cellar_play' }], end: true },
  }),
  delphine_wait: conv('delphine_wait', ['delphine'], { start: { who: 'delphine', text: 'Stage is yours, honey. Nine chairs. Make them turn around.', end: true } }, { replayable: true }),
  delphine_after: conv('delphine_after', ['delphine', 'jo'], {
    start: { who: 'delphine', if: 'cellar_froze', text: "You came back from it. That's the job, honey. Come back Tuesday.", next: 'j1', else: 'plain' },
    plain: { who: 'delphine', text: 'Come back Tuesday.', next: 'j1' },
    j1: { who: 'jo', expr: 'doubt', text: "That's it?", next: 'd2' },
    d2: { who: 'delphine', expr: 'smile', text: "That's everything, honey. Tuesday's the whole job.", end: true },
  }, { replayable: true }),
  barkeep: conv('barkeep', ['barkeep'], { start: { who: 'barkeep', text: 'Glasses do not wash themselves. Play something worth stopping for.', end: true } }, { replayable: true }),
  barkeep_after: conv('barkeep_after', ['barkeep'], {
    start: { who: 'barkeep', if: 'cellar_perfect', text: "I stopped. Don't tell anyone.", end: true, else: 'still' },
    still: { who: 'barkeep', text: 'Still washing. No offence.', end: true },
  }, { replayable: true }),
  ray_bar: conv('ray_bar', ['ray'], { start: { who: 'ray', text: '…', end: true } }, { replayable: true }),
  nia_rush: conv('nia_rush', ['nia', 'jo'], {
    start: { who: 'nia', if: 'cellar_rushed', text: 'You rush the third bar.', next: 'j1', else: 'held' },
    held: { who: 'nia', text: 'You held the third bar. Once.', next: 'j1' },
    j1: { who: 'jo', expr: 'doubt', text: 'Who are you?', next: 'n2' },
    n2: { who: 'nia', text: "Someone who's going to keep listening for it. Bring the horn, not the ego.", set: { met_nia: true }, end: true },
  }),
  nia_after: conv('nia_after', ['nia'], {
    start: { who: 'nia', if: 'cellar_rushed', text: 'Third bar. Every time.', end: true, else: 'held' },
    held: { who: 'nia', text: 'Third bar. Do that on Saturday.', end: true },
  }, { replayable: true }),

  // ---- the alley: Ray's lesson ----
  ray_lesson: conv('ray_lesson', ['ray', 'jo'], {
    // only a clean gig hears the famous line; each way in lands on the same lesson
    start: { who: 'ray', if: 'cellar_perfect', text: 'You played every note right.', next: 'j1', else: 'froze' },
    j1: { who: 'jo', expr: 'smile', text: '…Thank you?', next: 'r2' },
    r2: { who: 'ray', text: "Wasn't a compliment. A player piano plays every note right.", next: 'r3' },
    froze: { who: 'ray', if: 'cellar_froze', text: 'You stopped, up there. Whole room leaned in.', next: 'jf', else: 'most' },
    jf: { who: 'jo', expr: 'doubt', text: 'I froze.', next: 'rf' },
    rf: { who: 'ray', text: "I know. Best thing you played all night, and you didn't mean it.", next: 'r3' },
    most: { who: 'ray', text: "You played most of the notes. Get them all and you're a player piano.", next: 'r3' },
    r3: { who: 'ray', text: "You're playing notes, son. Play the room. A rest is a note too.", next: 'r4' },
    r4: { who: 'ray', text: 'I clap, you answer. Where I leave a hole, you leave a hole.', set: { ray_talked: true }, effects: [{ beat: 'ray_drill_start' }], end: true },
  }),
  ray_again: conv('ray_again', ['ray'], { start: { who: 'ray', text: 'Again. I clap, you answer.', effects: [{ beat: 'ray_drill_start' }], end: true } }, { replayable: true }),
  ray_after: conv('ray_after', ['ray'], {
    start: { who: 'ray', if: 'ray_drill_perfect', text: 'Hollow ring, you leave it alone. Go on. Saturday is through that door.', end: true, else: 'rough' },
    rough: { who: 'ray', if: 'ray_drill_played', text: "You played through it. You'll hear it when you hear it. Saturday is through that door.", end: true, else: 'plain' },
    plain: { who: 'ray', text: 'Go on. Saturday is through that door.', end: true },
  }, { replayable: true }),

  // ---- backstage, Saturday ----
  marcus_call: conv('marcus_call', ['marcus', 'jo'], {
    start: { who: 'marcus', expr: 'smile', text: 'Jo! Some roadie slung your laminate up on the catwalk with the cable. Get it before Tally finds you without.', next: 'm2' },
    m2: { who: 'marcus', text: 'Listen. I got the call. The warehouse job. Days, benefits. Starts Monday.', next: 'j1' },
    j1: { who: 'jo', expr: 'doubt', text: "We've got the set in twenty—", next: 'm3' },
    m3: { who: 'marcus', text: "You've got the set. I've got a kid with our first set list on his wall. I wrote it on a napkin. He thinks daddy's a drummer. I'm telling you what I need.", next: 'j2' },
    j2: {
      who: 'jo',
      text: '…',
      choices: [
        { text: '"Then go."', next: 'go', set: { marcus_left: 'go' } },
        { text: '"Play this one. Then go."', next: 'stay', set: { marcus_left: 'stay', marcus_stays: true } },
        { text: '[say nothing]', next: 'silent', set: { marcus_left: 'silent' } },
      ],
    },
    go: { who: 'marcus', text: "Then I'm gone, Jo. You keep the set. The kid's got the napkin.", effects: [{ beat: 'marcus_goes' }], end: true },
    stay: { who: 'marcus', expr: 'smile', text: "One more. Then I'm gone. Don't rush the third bar.", end: true },
    silent: { who: 'marcus', text: '…Okay.', effects: [{ beat: 'marcus_walks' }], end: true },
  }),
  marcus_after: conv('marcus_after', ['marcus'], { start: { who: 'marcus', text: 'Go on. They are waiting on you, not me.', end: true } }, { replayable: true }),
  nia_backstage: conv('nia_backstage', ['nia'], { start: { who: 'nia', text: 'Tally wants a word. He always wants a word. Count your fingers after.', end: true } }, { replayable: true }),
  nia_backstage_after: conv('nia_backstage_after', ['nia'], {
    start: { who: 'nia', text: 'Rush the third bar and I will end you.', if: 'choice_nia', next: 'n2' },
    n2: { who: 'nia', text: "So. I'm not television.", if: 'choice_tally', end: true },
  }, { replayable: true }),
  tally_offer: conv('tally_offer', ['tally', 'jo'], {
    start: { who: 'tally', if: 'cellar_froze', text: "Nine people at the Cellar. You stopped dead and came back. I count. It's what I'm for.", next: 't2', else: 'clean' },
    clean: { who: 'tally', if: 'cellar_perfect', text: "Nine people at the Cellar, and not one wrong note. I count. It's what I'm for.", next: 't2', else: 'plain' },
    plain: { who: 'tally', text: "Nine people at the Cellar. I count. It's what I'm for.", next: 't2' },
    t2: { who: 'tally', text: 'The Big Stage. Eleven minutes, right before the headliner. Eight thousand people.', next: 't3' },
    t3: { who: 'tally', text: 'Two conditions. The set list is mine: crowd-pleasers, no rests, no silences. And the bass player. She is not television. I have a session guy.', next: 'j1' },
    j1: {
      who: 'jo',
      text: '…',
      choices: [
        { text: '"Deal."', next: 'deal', set: { choice: 'tally', choice_tally: true } },
        { text: '"Nia plays or I don\'t."', next: 'nia', set: { choice: 'nia', choice_nia: true } },
      ],
    },
    deal: { who: 'tally', expr: 'smile', text: 'Sensible. No rests. Fill every bar and they will love you for eleven minutes.', effects: [{ beat: 'offer_done' }], end: true },
    nia: { who: 'tally', text: 'Then you go on after the headliner. Half the crowd will have left. Your rests, your problem.', effects: [{ beat: 'offer_done' }], end: true },
  }),
  tally_after: conv('tally_after', ['tally'], { start: { who: 'tally', text: 'Stage door. Laminate. I do not do favours, I do schedules.', end: true } }, { replayable: true }),

  // ---- the Big Stage ----
  nia_wing: conv('nia_wing', ['nia'], { start: { who: 'nia', text: 'Rush the third bar and I will end you. Go on.', end: true } }, { replayable: true }),
  session_bass: conv('session_bass', ['session'], { start: { who: 'session', text: 'Count me in. I read the chart, I play the chart.', end: true } }, { replayable: true }),
  marcus_drums: conv('marcus_drums', ['marcus'], { start: { who: 'marcus', expr: 'smile', text: 'One more. Make it a good one.', end: true } }, { replayable: true }),
  session_drums: conv('session_drums', ['stagehand'], { start: { who: 'stagehand', text: "Click track's on. I do weddings.", end: true } }, { replayable: true }),
  stagehand: conv('stagehand', ['stagehand', 'crew'], {
    start: { who: 'stagehand', text: 'Who was that?', next: 's2' },
    s2: { who: 'crew', text: 'Dunno. Trumpet guy.', end: true },
  }, { replayable: true }),
  stagehand2: conv('stagehand2', ['crew'], { start: { who: 'crew', text: 'Mind your back. Headliner changeover.', end: true } }, { replayable: true }),
  nia_coffee: conv('nia_coffee', ['nia', 'jo'], {
    start: { who: 'nia', if: 'set_rushed', text: 'Third bar.', next: 'c' },
    c: { who: 'jo', text: 'She hands me a coffee and says nothing else. She nods at the chair.', end: true },
  }, { replayable: true }),
};

export const BARKS = [
  { id: 'jo_horn', channel: 'caption', who: 'jo', text: '[Q] plays the horn. That one in the window might answer.', when: { room: 'street', unless: 'horn_rang' } },
  { id: 'jo_neon', channel: 'caption', who: 'jo', text: 'A dead sign. Play it back, note for note.', when: { room: 'alley', unless: 'neon_lit' } },
  { id: 'ray_here', channel: 'caption', who: 'ray', text: 'Kid. Out here.', when: { room: 'alley', flag: 'ray_left', unless: 'ray_lesson' } },
  // (one voice at a time: the roadies wait until Marcus has had his say)
  { id: 'roadie_mind', channel: 'caption', who: 'stagehand', text: 'Mind yourself! Coming through!', when: { room: 'backstage', flag: 'marcus_left' } },
  { id: 'jo_climb', channel: 'caption', who: 'jo', text: 'Nine floors of iron in the rain. The crowd is up there somewhere.', when: { room: 'escape' } },
  { id: 'nia_set', channel: 'caption', who: 'nia', text: 'Rush the third bar and I will end you.', when: { room: 'stage', flag: 'choice_nia', unless: 'set_done' } },
  { id: 'crew_who', channel: 'caption', who: 'stagehand', text: 'Who was that?', when: { room: 'stage', flag: 'set_done' } },
];
