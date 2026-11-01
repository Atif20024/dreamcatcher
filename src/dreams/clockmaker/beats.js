// THE STOPPED HOUR's beats (plan 2.1 BeatRunner): data, run on events.
export default {
  // the dream opens on action: a line on the caption bar, no box
  start: [{ wait: 400 }, { music: 'quiet' }],
  // a look in at his window (a Small Moment)
  moment_table: [{ say: { who: 'jo', text: "A table laid for two, and a chair pulled out. It's six o'clock in there too." } }],
  // the bench train runs: the drawer slides, and there is the dial's gear
  bench_open: [
    { say: { who: 'keeper', text: 'There she goes. Drawer is open, and that is your first gear. Up to the dial.' } },
    { objective: 'wind_clock' },
    { sting: 'gate' },
  ],
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
  // the shaft's train runs: the cage comes up
  cage_up: [
    { say: { who: 'jo', text: "The cage lifts. The gear is on a stand, oiled. Gears don't slip onto stands." } },
    { objective: 'take_gear' },
    { sting: 'gate' },
  ],
  got_gear2: [
    { say: { who: 'jo', text: 'The second gear. Somebody took this off with a spanner, and wiped it. It goes up, under the bell.' } },
    { objective: 'to_belfry' },
  ],
  // his going train, hung back
  going_train: [
    { say: { who: 'keeper', text: 'That is my train. Hung back. Well. You had better come up.' } },
    { objective: 'hear_keeper' },
    { sting: 'gate' },
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
    { say: { who: 'keeper', text: 'There. I could tell you that sound with my eyes shut.' } },
    { wait: 2400 },
    { say: { who: 'jo', text: 'It runs. It has not struck. The town does not know yet.' } },
    { wait: 1800 },
    { camera: 'pop' },
    { objective: 'strike_seven' },
    { sting: 'gate' },
    // he gets up off the chair and goes out ahead of Jo
    { set: 'keeper_up' },
    { wait: 120 },
    { call: 'keeperToHill' },
    { set: 'keeper_out' },
  ],
  // out of the belfry onto the hill: the camera goes down to the shut gate and
  // back, past seven dark lamps, so the player knows what the rope will do
  out_on_hill: [
    { lock: true },
    { camera: { vista: 0.9, to: 'anchor:strike', ms: 1400 } },
    { say: { who: 'jo', text: 'Down the hill, the gate. Seven dark lamps on the way to it. And here, the rope.' } },
    { wait: 3000 },
    {
      if: 'keeper_goes',
      then: [{ say: { who: 'keeper', text: 'You will have to start without me. I have a way to go.' } }],
      else: [{ say: { who: 'keeper', text: 'Take the rope. I will count. I always counted.' } }],
    },
    { wait: 2200 },
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
    {
      if: 'keeper_goes',
      then: [{ call: 'keeperThroughGate' }],
      else: [{ say: { who: 'keeper', text: 'That is it, then. That is seven. You go on down. I know the short way.' } }, { wait: 2800 }],
    },
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
    { say: { who: 'jo', text: 'She takes down the pole, goes over, and lights the last one herself. She could have left it to the clock.' } },
    { call: 'nellToLamp' },
    { set: 'nell_lamp' },
    { sfx: 'click' },
    { wait: 1500 },
    { say: { who: 'nell', text: "You're late, Ansel." } },
    { wait: 1800 },
    {
      if: 'keeper_stays',
      then: [{ say: { who: 'keeper', text: 'I know. I had a second man on the rope.' } }],
      else: [{ say: { who: 'keeper', text: 'I know.' } }],
    },
    { wait: 2000 },
    { say: { who: 'nell', expr: 'smile', text: "Slipped, I said. It's what you say." } },
    { wait: 2200 },
    { call: 'keeperOnHome' },
    { camera: 'pop' },
    { lock: false },
    { set: 'green_lit' },
    { objective: 'see_him_home' },
  ],
  // the lane, at his door: what Jo asked for under the bell
  at_his_door: [
    { lock: true },
    { camera: { push: 1.15, to: { x: 5 * 32 + 40, y: 420 }, ms: 900 } },
    {
      if: 'keeper_stays',
      then: [
        { talk: 'keeper_door' },
        { call: 'keeperIn' },
        { set: 'home' },
        { sfx: 'click' },
        { say: { who: 'jo', text: 'He shut it gently. It is warm through the crack, and somebody kept his plate.' } },
      ],
      else: [
        { set: 'home' },
        { say: { who: 'jo', text: 'His door, on the latch, and warm. He went in ahead of me. Nobody saw.' } },
      ],
    },
    { wait: 2600 },
    { camera: 'pop' },
    { lock: false },
    { objective: 'catch_dream' },
    { sting: 'gate' },
  ],
};
