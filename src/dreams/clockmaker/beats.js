// THE STOPPED HOUR's beats (plan 2.1 BeatRunner): data, run on events.
export default {
  // the dream opens on action: a line on the caption bar, no box
  start: [{ wait: 400 }, { music: 'quiet' }],
  // the first gear, at the dial: the hatch drops
  dial_done: [
    { set: 'gear1' },
    { music: 'quiet' },
    { camera: { push: 1.2, to: 'anchor:clockwork', ms: 500 } },
    { say: { who: 'jo', text: 'One gear, seated. Something dropped open behind the shelves: the hatch to the shaft.' } },
    { wait: 1800 },
    { camera: 'pop' },
    { objective: 'to_shaft' },
    { sting: 'gate' },
  ],
  got_gear2: [
    { say: { who: 'jo', text: 'The second gear, off its arbor and lying on the plank. It goes up, under the bell.' } },
    { objective: 'to_belfry' },
  ],
  // the third gear, under the bell: it is going. The tick starts here, and
  // from here on it is in every room (verbs/works.js)
  clock_done: [
    { set: 'clock_wound' },
    { call: 'seated' },
    { music: 'quiet' },
    { camera: { push: 1.2, to: 'anchor:escapement', ms: 500 } },
    { say: { who: 'jo', text: 'Three gears, seated. Listen to it go.' } },
    { wait: 2200 },
    { say: { who: 'jo', text: 'It runs. It has not struck. The town does not know yet.' } },
    { wait: 1800 },
    { camera: 'pop' },
    { objective: 'strike_seven' },
    { sting: 'gate' },
  ],
  // out of the belfry onto the hill: the camera goes down to the shut gate and
  // back, past seven dark lamps, so the player knows what the rope will do
  out_on_hill: [
    { lock: true },
    { camera: { vista: 0.9, to: 'anchor:strike', ms: 1400 } },
    { say: { who: 'jo', text: 'Down the hill, the gate. Seven dark lamps on the way to it. And here, the rope.' } },
    { wait: 3000 },
    { camera: 'pop' },
    { wait: 500 },
    { lock: false },
  ],
  // the seventh strike (each strike lit a lamp, gate end first: strike's onRender)
  seven_struck: [
    // (gates only move outside an encounter: the shot holds on this one as it swings)
    { lock: true },
    // (world px, between the gate and the rope: the anchor alone leaves Jo off the edge)
    { camera: { vista: 0.9, to: { x: 3660, y: 340 }, ms: 400 } },
    { set: 'struck' },
    { music: 'setpiece' },
    { say: { who: 'jo', text: 'Seven, an hour late. Hear that? The whole town heard that.' } },
    { wait: 2400 },
    { camera: 'pop' },
    { lock: false },
    { objective: 'to_green' },
    { sting: 'gate' },
  ],
  // back through the gate, the first time: every lamp on the green is lit but
  // hers, and she takes the pole down and lights it herself
  green_lit: [
    { lock: true },
    { camera: { push: 1.1, to: 'npc:nell', ms: 1100 } },
    { wait: 900 },
    { say: { who: 'nell', text: 'There! The lamps!' } },
    { wait: 1600 },
    { say: { who: 'jo', text: 'She reaches up with the pole and lights the last one herself. She could have left it to the clock.' } },
    { wait: 1200 },
    { set: 'nell_lamp' },
    { sfx: 'click' },
    { wait: 2200 },
    { camera: 'pop' },
    { lock: false },
    { set: 'green_lit' },
    { objective: 'catch_dream' },
  ],
};
