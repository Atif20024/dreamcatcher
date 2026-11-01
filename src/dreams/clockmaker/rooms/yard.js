// THE BELL YARD: the ground climbs from the gate to the old bell frame; the
// tower stands in the backdrop with its belfry lit. Jo first comes out on it
// from above, by the belfry's little door: the rope is at his hand, the seven
// dark lamps run down the hill to the shut gate. Seven strikes light them, in
// order, up toward him, and the gate opens. The keeper is out here too: he goes
// on down the hill as Jo strikes, or he stays at the rope, as Jo asked him.
export default {
  id: 'yard',
  origin: { tx: 100, ty: 0 },
  grid: [
    '..................................',
    '..................................',
    '..................................',
    '..................................',
    '..................................',
    '..................................',
    '..................................',
    '..................................',
    '..................................',
    '..................................',
    '..................................',
    '..................................',
    '..................../#############',
    '................./################',
    '............./####################',
    '........./########################',
    '##################################',
    '##################################',
    '##################################',
    '##################################',
  ],
  material: 'meadow',
  decor: ['tufts_front'],
  props: [
    { prop: 'fence', x: 7, y: 16 },
    { prop: 'bell_frame', x: 28, y: 12 },
    { prop: 'tower_foot', x: 32, y: 12 },
    ...[[4, 16], [8, 16], [12, 15], [15, 14], [18, 13], [22, 12], [25, 12]].flatMap(([x, y], i) => [
      { prop: 'lamp_post_dark', x, y, unless: `lamp_${i + 1}`, live: true },
      { prop: 'lamp_post', x, y, when: `lamp_${i + 1}`, live: true },
    ]),
    { prop: 'bush', x: 12, y: 15, scale: 0.9 },
  ],
  enclosure: { fgFoliage: [{ x: -1, w: 4 }] },
  backdrop: { set: 'night_yard', horizon: 14 },
  ambience: 'bell_yard',
  acoustics: 'open',
  events: 'green_still',
  music: { state: 'setpiece', key: 'yard' },
  objective: [
    { text: 'strike_seven' },
    { text: 'to_green', flag: 'struck' },
  ],
  titleCard: 'THE BELL YARD',
  entities: [
    { type: 'portal', id: 'yard<green', kind: 'seam', x: 0, y: 15, to: { room: 'green', portal: 'green>yard' }, seam: { prop: 'yard_lychgate' } },
    { type: 'checkpoint', id: 'cp_yard', label: 'THE BELL YARD', x: 5, y: 15 },
    // the far side of the green's gate, opening on the seventh strike
    { type: 'gate', id: 'g_yard_in', x: 2, y: 10, h: 6, requires: ['struck'], hint: 'OPENS WHEN THE CLOCK STRIKES' },
    { type: 'portal', id: 'yard>belfry', kind: 'door', x: 32, y: 11, to: { room: 'belfry', portal: 'belfry>yard' }, door: { prompt: 'in to the bell chamber', fade: 300 } },
    // the rope; the camera's anchor is the gate, so the shot holds both
    { type: 'encounter', id: 'strike', x: 27, y: 11, anchor: { x: 1, y: 10 }, prompt: 'strike the hour', when: 'clock_wound', unless: 'struck' },
    // coins: a hop at the foot of the hill, and the hilltop behind the bell
    { type: 'coin', id: 'c_hop1', x: 4, y: 13 },
    { type: 'coins', id: 'c_hop2', x: 5, y: 12, n: 2 },
    { type: 'coin', id: 'c_hop3', x: 7, y: 13 },
    { type: 'coins', id: 'c_top', x: 31, y: 10, n: 2 },
    { type: 'npc', id: 'keeper_hill', cast: 'npc-sh-keeper', x: 25, y: 11, walks: true, facing: -1, when: 'clock_wound', unless: 'keeper_left' },
  ],
};
