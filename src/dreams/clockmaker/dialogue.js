// THE STOPPED HOUR's lines (plan 4.8). Scene conversations (channel 'scene')
// open only by [E] on someone or from a beat; barks (channel 'caption') ride
// the caption bar and never take control. Every name is invented.
export const CAST = {
  jo: { name: 'JO', portrait: 'portrait-jo', voicePitch: 1 },
  nell: { name: 'NELL', portrait: 'portrait-nell', voicePitch: 1.3 },
  watch: { name: 'A MAN WITH A WATCH', portrait: 'portrait-sh-watch', face: 'npc-sh-watch', voicePitch: 0.85 },
  pie: { name: 'A WOMAN WITH A PIE', portrait: 'portrait-sh-pie', face: 'npc-sh-pie', voicePitch: 1.1 },
  keeper: { name: 'ANSEL DUNMARROW', portrait: 'portrait-sh-keeper', face: 'npc-sh-keeper', voicePitch: 0.8 },
  child: { name: 'A CHILD', portrait: 'portrait-sh-child', face: 'ev-p-waiting_kid', voicePitch: 1.5 },
};

const once = (id, who, text, expr) => ({ id, channel: 'scene', camera: 'talk', replayable: true, cast: [who], nodes: { start: { who, expr, text, end: true } } });
// two lines from one person
const twice = (id, who, a, b) => ({ id, channel: 'scene', camera: 'talk', replayable: true, cast: [who], nodes: { start: { who, text: a, next: 'b' }, b: { who, text: b, end: true } } });

export const CONVERSATIONS = {
  nell_first: {
    id: 'nell_first',
    channel: 'scene',
    camera: 'talk',
    cast: ['jo', 'nell'],
    nodes: {
      start: { who: 'nell', expr: 'smile', text: 'There you are. Every lamp on the green went out at six, and the clock with them.', next: 'j1' },
      j1: { who: 'jo', expr: 'doubt', text: 'The clock runs the lamps?', next: 'w2' },
      w2: { who: 'nell', text: 'Everything here runs on that clock. Three gears slipped. It wants steady hands.', next: 'j2' },
      j2: {
        who: 'jo',
        text: '…',
        choices: [
          { text: "I'll seat them.", next: 'w3' },
          { text: 'Why me?', next: 'w4', set: { asked_why: true } },
        ],
      },
      w4: { who: 'nell', expr: 'smile', text: "You're the only one awake.", next: 'w3' },
      w3: { who: 'nell', text: 'The clock house is up the steps. One gear at the dial, one up the weight shaft, one under the bell. Then strike seven in the yard, and the gate opens.', next: 'w6' },
      w6: { who: 'nell', expr: 'worried', text: "Mr Dunmarrow is up there. Forty-one years he's kept it. He won't come down for me. Be kind.", next: 'w5' },
      w5: { who: 'nell', text: "Mind the pendulums in the shaft. They swing loose and count nothing. They don't hit hard, and they don't stop for anyone.", set: { met_nell: true }, effects: [{ objective: 'wind_clock' }], end: true },
    },
  },
  nell_after: once('nell_after', 'nell', 'Up the steps, the door under the clock. Three gears. Watch for the brass.', 'worried'),
  nell_wound: once('nell_wound', 'nell', "I can hear it from here. It has not struck yet. Back up through the clock house, and out on the hill: the rope is by the old bell.", 'smile'),
  nell_done: {
    id: 'nell_done',
    channel: 'scene',
    replayable: true,
    cast: ['nell', 'jo'],
    nodes: {
      start: { if: 'asked_why', who: 'nell', expr: 'smile', text: 'Because you were awake. That is all anyone is, at the start.', next: 's2' },
      s2: { if: '!asked_why', who: 'nell', expr: 'smile', text: "Listen. That's the town breathing again.", next: 'j1' },
      j1: { who: 'jo', expr: 'smile', text: 'And now?', next: 'w2' },
      w2: { who: 'nell', text: 'Now it is seven. Go on, down the lane. See him in.', end: true },
    },
  },
  // ---- the town: everyone stopped at six ----
  watch: twice('watch', 'watch', 'Six o\'clock. It has been six o\'clock for an hour. I did not miss the train. The train missed me.', 'Mr Dunmarrow set this by the clock himself. It has never once been wrong. That is what worries me.'),
  watch_after: once('watch_after', 'watch', 'Seven! The train will come now. Thank you, whoever you are.'),
  pie: twice('pie', 'pie', 'The oven bell never rang. The pie is perfect and cold.', 'Ida Dunmarrow sent me up with it at five, for him. He has not come down since.'),
  pie_after: once('pie_after', 'pie', 'Warm again. You do not know how that feels.'),
  // ---- the keeper: Ansel Dunmarrow, whose hour this is (docs/dream_clockmaker_dreamer.md) ----
  keeper_first: {
    id: 'keeper_first',
    channel: 'scene',
    camera: 'talk',
    cast: ['jo', 'keeper'],
    nodes: {
      start: { who: 'keeper', text: 'Door was open, was it. Mind the floor, I have the train down.', next: 'j1' },
      j1: { who: 'jo', text: 'You keep the clock?', next: 'k1' },
      k1: { who: 'keeper', text: 'Ansel Dunmarrow. Forty-one years. And you are the steady hands. Nell has been telling people things.', next: 'j2' },
      j2: { if: 'asked_why', who: 'jo', expr: 'doubt', text: 'She said I was the only one awake.', next: 'k2' },
      k2: { if: 'asked_why', who: 'keeper', text: 'She would. She has never once told me I look tired.', next: 'k3' },
      k3: { who: 'keeper', text: 'The dial wants a gear. The gear is in my drawer, and the drawer runs off that train, there on the wall. It is two wheels short.', next: 'k4' },
      k4: { who: 'keeper', text: 'Take a wheel on your back and hang it on a peg, {act1} both ways. Wheels that touch turn each other. That is all a clock is.', set: { met_keeper: true }, effects: [{ objective: 'bench_train' }], end: true },
    },
  },
  keeper_wait: once('keeper_wait', 'keeper', 'One on the floor, one up on the shelf. The ratchet only goes the way of its arrow. Lift them off and try again; they have been lifted off before.'),
  keeper_dial: once('keeper_dial', 'keeper', 'There is your gear. Up on the mezzanine, at the dial. I would do it myself, but I have this to look at.'),
  keeper_shaft_on: once('keeper_shaft_on', 'keeper', 'That is the dial. The next is up the shaft, past the loose ones. Go on. I will be along.'),
  keeper_up_here: once('keeper_up_here', 'keeper', 'Those are mine. Four wheels, about the room. If you mean to do this, hang them. Even count; you know why now.'),
  // the confession, in three parts: between them Jo looks at what is in the room (beats.js keeper_why_on)
  keeper_why: {
    id: 'keeper_why',
    channel: 'scene',
    camera: 'talk',
    replayable: true,
    cast: ['jo', 'keeper'],
    nodes: {
      start: { who: 'keeper', text: 'All four. You hang a wheel like a man who was told. Nobody told you why they were down.', next: 'j1' },
      j1: { who: 'jo', text: 'Nell said they slipped.', next: 'k1' },
      k1: { who: 'keeper', text: 'They did not slip.', next: 'k2' },
      k2: { who: 'keeper', text: 'I took them off. After. I went back up the hill and took them off, one by one, and put the hands back to six. This one I kept.', set: { why_told: true }, end: true },
    },
  },
  keeper_why_b: {
    id: 'keeper_why_b',
    channel: 'scene',
    replayable: true,
    cast: ['jo', 'keeper'],
    nodes: {
      start: { who: 'jo', expr: 'doubt', text: 'Why?', next: 'k3' },
      k3: { who: 'keeper', text: 'Ida had supper on for six. A table for two. Six is winding, so I came up.', next: 'k3b' },
      k3b: { who: 'keeper', text: 'The weight stuck. An hour, it took. I could have left it. Nobody looks up.', next: 'k4' },
      k4: { who: 'keeper', text: 'She went at half past six, the doctor said. Quiet, at the table. Two plates. I came down the hill at seven.', end: true },
    },
  },
  keeper_why_c: {
    id: 'keeper_why_c',
    channel: 'scene',
    replayable: true,
    cast: ['jo', 'keeper'],
    nodes: {
      start: { who: 'keeper', text: 'So it is not seven. It does not get to be. If it never gets to seven, I am not late.', next: 'j3' },
      j3: {
        who: 'jo',
        text: '…',
        choices: [
          { text: "Go home. I'll strike it.", next: 'g1', set: { keeper_goes: true } },
          { text: 'Strike it with me.', next: 's1', set: { keeper_stays: true } },
        ],
      },
      g1: { who: 'keeper', text: 'You would let a stranger strike my clock.', next: 'g2' },
      g2: { who: 'keeper', text: 'Well. It wants someone who is not me.', next: 'give' },
      s1: { who: 'keeper', text: 'It is a two-man rope, you know. Forty-one years, and I never had the second man.', next: 'give' },
      give: { who: 'keeper', text: 'Here. On the beat, mind. It slips.', set: { gear3_given: true }, effects: [{ objective: 'seat_third' }], end: true },
    },
  },
  keeper_given: once('keeper_given', 'keeper', 'On the beat. I will watch. I have had a lot of practice at watching it.'),
  keeper_door: {
    id: 'keeper_door',
    channel: 'scene',
    camera: 'talk',
    cast: ['jo', 'keeper'],
    nodes: {
      start: { who: 'keeper', text: 'I got this far. Forty-one years I have come in at this door, and tonight I stopped to knock, if you can believe it.', next: 'j1' },
      j1: { who: 'jo', text: 'Go on.', next: 'k1' },
      k1: { who: 'keeper', text: 'Stand there a minute. That is all. Till I have got it shut.', end: true },
    },
  },
};

export const BARKS = [
  { id: 'jo_lane', channel: 'caption', who: 'jo', text: 'Every window lit, and every lamp out.', when: { room: 'lane' } },
  { id: 'keeper_hello', channel: 'caption', who: 'keeper', text: 'In here, by the bench. Mind the wheels.', when: { near: 'npc:keeper_bench', r: 420, unless: 'met_keeper' } },
  { id: 'jo_shaft', channel: 'caption', who: 'jo', text: 'More wheels on the floor. He took the whole train down.', when: { room: 'shaft' } },
  { id: 'jo_belfry', channel: 'caption', who: 'jo', text: 'He is up there already, under the bell. I did not pass him.', when: { room: 'belfry' } },
  { id: 'nell_hello', channel: 'caption', who: 'nell', text: 'Evening! Over here, by the dark lamp.', when: { near: 'npc:nell', r: 420, unless: 'met_nell' } },
];
