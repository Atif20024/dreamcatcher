// THE CLOCK HOUSE: an interior behind a door. Panelled back wall, beams and
// pillars in the foreground, a mezzanine reached by two shelves, and the
// great clock on the wall: the first gear's encounter is staged in the room.
// When it is seated the hatch at the end of the mezzanine opens on the shaft.
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
    { prop: 'workbench', x: 24, y: 13 },
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
  objective: [
    { text: 'wind_clock' },
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
    { type: 'encounter', id: 'clockwork', x: 24, y: 7, anchor: { x: 24, y: 4 }, prompt: 'seat the first gear', unless: 'gear1' },
    { type: 'portal', id: 'clock>shaft', kind: 'door', x: 21, y: 7, to: { room: 'shaft', portal: 'shaft>clock' }, door: { prompt: 'through the hatch', fade: 250, requires: ['gear1'], locked: 'the dial first', lockedLine: 'Shut. The dial first: it holds the latch.' } },
  ],
};
