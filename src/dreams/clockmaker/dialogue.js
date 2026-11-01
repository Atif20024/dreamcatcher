// THE STOPPED HOUR's lines (plan 4.8). Scene conversations (channel 'scene')
// open only by [E] on someone or from a beat; barks (channel 'caption') ride
// the caption bar and never take control. Every name is invented.
export const CAST = {
  jo: { name: 'JO', portrait: 'portrait-jo', voicePitch: 1 },
  nell: { name: 'NELL', portrait: 'portrait-nell', voicePitch: 1.3 },
  watch: { name: 'A MAN WITH A WATCH', portrait: 'portrait-sh-watch', face: 'npc-sh-watch', voicePitch: 0.85 },
  pie: { name: 'A WOMAN WITH A PIE', portrait: 'portrait-sh-pie', face: 'npc-sh-pie', voicePitch: 1.1 },
  child: { name: 'A CHILD', portrait: 'portrait-sh-child', face: 'ev-p-waiting_kid', voicePitch: 1.5 },
};

const once = (id, who, text, expr) => ({ id, channel: 'scene', camera: 'talk', replayable: true, cast: [who], nodes: { start: { who, expr, text, end: true } } });

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
      w3: { who: 'nell', text: 'The clock house is up the steps. One gear at the dial, one up the weight shaft, one under the bell. Then strike seven in the yard, and the gate opens.', next: 'w5' },
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
      w2: { who: 'nell', text: 'Now it is seven. Go on up to the bell. Something is waiting by it for you.', end: true },
    },
  },
  // ---- the town: everyone stopped at six ----
  watch: once('watch', 'watch', 'Six o\'clock. It has been six o\'clock for an hour. I did not miss the train. The train missed me.'),
  watch_after: once('watch_after', 'watch', 'Seven! The train will come now. Thank you, whoever you are.'),
  pie: once('pie', 'pie', 'The oven bell never rang. The pie is perfect and cold.'),
  pie_after: once('pie_after', 'pie', 'Warm again. You do not know how that feels.'),
};

export const BARKS = [
  { id: 'jo_lane', channel: 'caption', who: 'jo', text: 'Every window lit, and every lamp out.', when: { room: 'lane' } },
  { id: 'nell_hello', channel: 'caption', who: 'nell', text: 'Evening! Over here, by the dark lamp.', when: { near: 'npc:nell', r: 420, unless: 'met_nell' } },
];
