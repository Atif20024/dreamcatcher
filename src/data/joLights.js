// What light Jo carries, dream by dream and room by room (feedback 3).
//
// The owner: "carried lantern sounds good, but each level lantern could be
// boring; each level it should be different. Places where the light is
// sufficient, we don't need a lantern there." So Jo is drawn plain (no
// halo, rim or outline) and carries a real light of the place and era in
// his front hand, only in rooms that are dark. In a lit room he puts it
// away; at a dark room's seam he raises it (300 ms).
//
//   kind     the prop (src/entities/JoLight.js draws each one)
//   light    'pool' (a flame or bulb: light all round, on the floor and the
//            wall behind) or 'cone' (a torch or a lens: a beam ahead)
//   color    the light's colour; radius (px) its reach; strength its alpha
//   dark     the dream's default: true = carry it unless a room says lit
//   rooms    per-room overrides: true = dark (carry it), false = lit
//
// A room in a framework dream may also say `lit: true | false` itself
// (room data); that wins over this table.
export const JO_LIGHTS = Object.freeze({
  // Crossroads at nine o'clock: a conductor's oil lantern, brass and glass
  hub: { kind: 'oil_lantern', light: 'pool', color: 0xffc070, radius: 120, strength: 0.42, dark: true, rooms: {} },
  // the kitchen is bright; the cold store and the night kerb are not: a
  // candle stub in an enamel saucer from the pass
  chef: { kind: 'candle', light: 'pool', color: 0xffb860, radius: 100, strength: 0.4, dark: false, rooms: { freezer: true, arrival: true, alley_dock: true, rooftop: true } },
  // a wet night in the fifties: a brass petrol lighter, lid flipped. The
  // cellar and the stage have their own lights
  musician: { kind: 'lighter', light: 'pool', color: 0xffb050, radius: 95, strength: 0.4, dark: true, rooms: { cellar: false, stage: false } },
  // the station in orbit and the campus at night: a wrist torch (a cone)
  astronaut: { kind: 'wrist_torch', light: 'cone', color: 0xe8f0ff, radius: 170, strength: 0.5, dark: true, rooms: { p1_study: false, p3_sim: false } },
  // the second draft, written at night: a bare bulb on its flex, carried
  writer: { kind: 'bulb', light: 'pool', color: 0xffe0a0, radius: 120, strength: 0.48, dark: true, rooms: { copyshop: false, cafe: false, library: false, postoffice: false, bookshop: false, press: false } },
  // Florence by day: the bottega, the street and the piazza are in
  // daylight; the chapel vault and the palazzo's back rooms need a lamp: a
  // terracotta oil lamp (a lucerna)
  painter: { kind: 'oil_lamp', light: 'pool', color: 0xffb860, radius: 105, strength: 0.4, dark: false, rooms: { chapel: true, speziale: true } },
  // the last hand, 1884: a tin bull's-eye lantern off the deckhand's hook,
  // for the purser's corridor (its lamp dims a notch a marker) and the
  // hurricane deck before the dawn; the quay has its gas lamps, the saloons
  // their chandeliers (the old casino's rooms keep their own dark)
  gambler: { kind: 'bullseye', light: 'cone', color: 0xffe0a0, radius: 150, strength: 0.45, dark: false, rooms: { office: true, deck: true, backrooms: true, carpark: true, lasthand: true, arrival: true, lostfound: true } },
  // the stopped hour: a watchmaker's loupe lamp, a brass cup with a lens,
  // its beam narrow and warm
  clockmaker: { kind: 'loupe_lamp', light: 'cone', color: 0xffd890, radius: 150, strength: 0.4, dark: true, rooms: { clockhouse: false } },
  // the Evening: a jar of fireflies, once the sky is dark enough to need it
  evening: { kind: 'firefly_jar', light: 'pool', color: 0xd8f070, radius: 105, strength: 0.36, dark: 'night', rooms: {} },
});

// is this room dark for Jo? (room data `lit` wins, then the table, then the
// dream's default)
export function roomIsDark(place, roomId, roomLit) {
  const d = JO_LIGHTS[place];
  if (!d) return false;
  if (roomLit === true) return false;
  if (roomLit === false) return true;
  if (roomId && Object.prototype.hasOwnProperty.call(d.rooms, roomId)) return !!d.rooms[roomId];
  return d.dark === true;
}

// every kind is different (the owner: "each level it should be different")
export function kindsAreDistinct() {
  const ks = Object.values(JO_LIGHTS).map((d) => d.kind);
  return new Set(ks).size === ks.length;
}
