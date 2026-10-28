// The proof dream's lines (plan 4.8). Scene conversations (channel 'scene')
// open only by [E] on Wren or from a beat; barks (channel 'caption') ride
// the caption bar and never take control.
export const CAST = {
  jo: { name: 'JO', portrait: 'portrait-jo', voicePitch: 1 },
  wren: { name: 'WREN', portrait: 'portrait-wren', voicePitch: 1.3 },
};

export const CONVERSATIONS = {
  wren_first: {
    id: 'wren_first',
    channel: 'scene',
    camera: 'talk',
    cast: ['jo', 'wren'],
    nodes: {
      start: { who: 'wren', expr: 'smile', text: 'There you are. Every lamp on the green went out at six, and the clock with them.', next: 'j1' },
      j1: { who: 'jo', expr: 'doubt', text: 'The clock runs the lamps?', next: 'w2' },
      w2: { who: 'wren', text: 'Everything here runs on that clock. Three gears slipped. It wants steady hands.', next: 'j2' },
      j2: {
        who: 'jo',
        text: '…',
        choices: [
          { text: "I'll seat them.", next: 'w3' },
          { text: 'Why me?', next: 'w4' },
        ],
      },
      w4: { who: 'wren', expr: 'smile', text: "You're the only one awake.", next: 'w3' },
      w3: { who: 'wren', text: 'The clock house is up the steps. Wind it, and the gate to the bell opens.', set: { met_wren: true }, effects: [{ objective: 'wind_clock' }], end: true },
    },
  },
  wren_after: {
    id: 'wren_after',
    channel: 'scene',
    replayable: true,
    cast: ['wren'],
    nodes: { start: { who: 'wren', expr: 'worried', text: 'Up the steps, the door under the clock. Three gears. Watch for the brass.', end: true } },
  },
  wren_done: {
    id: 'wren_done',
    channel: 'scene',
    replayable: true,
    cast: ['wren', 'jo'],
    nodes: {
      start: { who: 'wren', expr: 'smile', text: "Listen. That's the town breathing again.", next: 'j1' },
      j1: { who: 'jo', expr: 'smile', text: 'And the gate?', next: 'w2' },
      w2: { who: 'wren', text: 'Open. Go on up to the bell.', end: true },
    },
  },
};

export const BARKS = [
  { id: 'jo_lane', channel: 'caption', who: 'jo', text: 'Every window lit, and every lamp out.', when: { room: 'lane' } },
  { id: 'wren_hello', channel: 'caption', who: 'wren', text: 'Evening! Over here, by the dark lamp.', when: { near: 'npc:wren', r: 420, unless: 'met_wren' } },
  { id: 'wren_lamps', channel: 'caption', who: 'wren', text: 'There! The lamps!', when: { room: 'green', flag: 'clock_wound' } },
];
