// THE CLOCK HOUSE: an interior behind a door. Panelled back wall, beams and
// pillars in the foreground, a mezzanine reached by two shelves, and the
// great clock on the wall: the first gear's encounter is staged in the room.
// When it is seated the hatch at the end of the mezzanine opens on the shaft.
// Under the mezzanine, Ansel Dunmarrow's bench and the train that teaches the
// wheels: the dial's gear is in a drawer it runs. No hazard here, on purpose.
// the bench train (room px): pegs on a triangle of big-wheel pitch. One wheel on
// the top peg reaches, and turns the ratchet the wrong way; two on the lower pegs is right
const ROW = 320;
const LOW = ROW + 55.43;
export const BENCH_TRAIN = {
  id: 'bench',
  flag: 'bench_done',
  needs: 'met_keeper',
  onRun: 'bench_open',
  who: 'keeper',
  wrongWay: 'Hear the pawl? A wheel turns its neighbour the other way. Count them.',
  bound: 'Three that all touch can\'t turn at all. Lift one off.',
  drive: { x: 608, y: ROW, r: 32 },
  output: { x: 736, y: ROW, r: 32, turns: -1 },
  arbors: [{ id: 'a', x: 672, y: ROW }, { id: 'b', x: 640, y: LOW }, { id: 'c', x: 704, y: LOW }],
  wheels: [{ id: 'bench1', size: 'big', x: 480, y: 384 }, { id: 'bench2', size: 'big', x: 512, y: 320 }],
};

export default {
  id: 'clockhouse',
  origin: { tx: 0, ty: 30 },
  grid: [
    '################################',
    '################################',
    '##............................##',
    '##............................##',
    '##............................##',
    '##............................##',
    '##............................##',
    '##............................##',
    '##..................=========.##',
    '##............................##',
    '##............................##',
    '##............====............##',
    '##............................##',
    '################################',
    '################################',
    '################################',
  ],
  material: 'oak_boards',
  regions: [
    { rect: [0, 0, 31, 1], material: 'plaster_wall' },
    { rect: [0, 2, 1, 12], material: 'plaster_wall' },
    { rect: [30, 2, 31, 12], material: 'plaster_wall' },
  ],
  decor: [],
  props: [
    { prop: 'door_wood', x: 4, y: 13 },
    { prop: 'window_night', x: 8, y: 6 },
    { prop: 'shelf_jars', x: 13, y: 6, dx: 8 },
    { prop: 'pendulum_case', x: 4, y: 13, dx: 40, layer: 'back' },
    { prop: 'rug', x: 10, y: 13 },
    { prop: 'table_set', x: 10, y: 13 },
    { prop: 'chair', x: 13, y: 13, dx: 4 },
    { prop: 'workbench', x: 26, y: 13 },
    { prop: 'bench_drawer', x: 25, y: 13, when: 'bench_done', live: true },
    { prop: 'cupboard', x: 27, y: 8, dx: 8, scale: 0.85 },
    { prop: 'hanging_lamp', x: 9, y: 2 },
    { prop: 'hanging_lamp', x: 17, y: 2 },
    { prop: 'wall_clock', x: 24, y: 4, live: true },
    { prop: 'door_wood', x: 21, y: 8 },
  ],
  lights: [{ x: 24, y: 4, r: 110, color: 0xffd890 }],
  enclosure: { backWall: 'panelled', wainscot: true, posts: 7, ceiling: true, pillars: true, frames: [{ x: 3, y: 9, w: 2, h: 4 }], palette: { wall: 0xc4a47c, wood: 0x6a4428, accent: 0x9a5a4a } },
  light: { tint: 0xfff0e0 },
  backdrop: null,
  ambience: 'gm_office', // a stopped clock does not tick: the tick comes with the music key
  acoustics: 'room',
  events: 'clock_still',
  music: { state: 'quiet', key: 'clockhouse' },
  trains: [BENCH_TRAIN],
  objective: [
    { text: 'meet_keeper' },
    { text: 'bench_train', flag: 'met_keeper' },
    { text: 'wind_clock', flag: 'bench_done' },
    { text: 'to_shaft', flag: 'gear1' },
    { text: 'back_up', flag: 'clock_wound' },
  ],
  titleCard: 'THE CLOCK HOUSE',
  entities: [
    { type: 'portal', id: 'clock>green', kind: 'door', x: 4, y: 12, to: { room: 'green', portal: 'green>clock' }, door: { prompt: 'go out', fade: 250 } },
    { type: 'checkpoint', id: 'cp_clock', label: 'THE CLOCK HOUSE', x: 7, y: 12 },
    // coins: one breadcrumb on the shelf (the way up), three over the table
    // for a jump from the floor, and both ends of the mezzanine
    { type: 'coin', id: 'c_shelf', x: 16, y: 9 },
    { type: 'coins', id: 'c_table', x: 10, y: 9, n: 3 },
    { type: 'coin', id: 'c_mezz1', x: 21, y: 6 },
    { type: 'coin', id: 'c_mezz2', x: 28, y: 6 },
    { type: 'npc', id: 'keeper_bench', cast: 'npc-sh-keeper', x: 27, y: 12, pace: [25, 28], facing: -1, unless: 'gear2', talk: [{ conv: 'keeper_shaft_on', if: 'gear1' }, { conv: 'keeper_dial', if: 'bench_done' }, { conv: 'keeper_wait', if: 'met_keeper' }, { conv: 'keeper_first' }] },
    { type: 'encounter', id: 'clockwork', x: 24, y: 7, anchor: { x: 24, y: 4 }, prompt: 'seat the first gear', when: 'bench_done', unless: 'gear1' },
    { type: 'portal', id: 'clock>shaft', kind: 'door', x: 21, y: 7, to: { room: 'shaft', portal: 'shaft>clock' }, door: { prompt: 'through the hatch', fade: 250, requires: ['gear1'], locked: 'the dial first', lockedLine: 'Shut. The dial first: it holds the latch.' } },
  ],
};
