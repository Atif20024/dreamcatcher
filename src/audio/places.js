// Sound by place (audio pass): the one table for what a place does besides
// its music and loop. Data, so a later pass can retune it by ear.
//
//   BEDS.<key>     the one-shots a place fires (src/audio/events.js EventBed):
//                  [shot, lo s, hi s, level?] — at random intervals, panned
//                  and placed at a random distance
//   LEGACY_ROOMS   the legacy dreams' rooms (src/data/<dream>/rooms.js):
//                  acoustics (inside / outside), a wall (the music heard
//                  through one: true or a cutoff in Hz) and the event bed.
//                  Framework rooms carry the same fields themselves
//                  (room.acoustics, room.events, room.music.wall).
const bed = (...rows) => ({ events: rows.map(([shot, lo, hi, level = 1]) => ({ shot, every: [lo, hi], level })) });

export const BEDS = {
  // Crossroads: the PA, pigeons in the roof, a train somewhere, a trolley
  // (spaced out and softer: now and then, not all the time)
  hub: bed(['announce', 50, 100, 0.7], ['pigeon', 15, 40, 0.8], ['wings', 30, 70, 0.6], ['train_far', 40, 90, 0.8], ['trolley', 35, 80, 0.6], ['door', 25, 60, 0.5], ['turnstile', 25, 60, 0.45]),
  // the clockmaker's green and lane: birds, swifts, a far dog, the church
  green: bed(['bird', 4, 9], ['swifts', 12, 25], ['dog_far', 25, 50, 0.7], ['church_bell', 40, 60, 0.8]),
  dusk: bed(['bird', 7, 14, 0.7], ['dog_far', 20, 40, 0.6], ['cat', 30, 60, 0.6]),
  clockhouse: bed(['cuckoo', 30, 50], ['spring_creak', 10, 20], ['gear_whirr', 14, 28], ['strike_hour', 45, 70, 0.8]),
  // the musician's rain-night streets, the cellar, the PA side
  rain: bed(['traffic', 8, 15], ['horn', 20, 40, 0.7], ['drain', 12, 25, 0.8], ['siren', 60, 120, 0.6]),
  cellar: bed(['glass_clink', 4, 9], ['chair_scrape', 10, 20, 0.8], ['laugh', 8, 16, 0.8], ['applause', 40, 70, 0.7]),
  backstage: bed(['cheer', 10, 20, 0.7], ['check_one_two', 20, 40], ['feedback', 40, 80], ['case_latch', 12, 25]),
  arena: bed(['cheer', 6, 14], ['feedback', 50, 90, 0.8]),
  // THE MASTER'S LADDER: the piazza's bell for the hour (the rest is baked)
  piazza: bed(['church_bell', 50, 80, 0.8], ['swifts', 15, 30, 0.6]),
  // the legacy dreams
  kitchen: bed(['pan_clatter', 5, 10], ['ticket_bell', 12, 20], ['chop', 9, 16], ['order_call', 14, 24], ['steam', 10, 18, 0.8]),
  chef_street: bed(['traffic', 10, 18, 0.7], ['horn', 25, 45, 0.6], ['bird', 8, 16, 0.6]),
  writer: bed(['carriage_bell', 15, 30], ['paper', 8, 15], ['crumple', 20, 40, 0.8], ['clock_hour', 60, 90, 0.7]),
  writer_street: bed(['traffic', 9, 16, 0.7], ['horn', 25, 50, 0.5], ['drain', 15, 30, 0.6]),
  orbit: bed(['console_beep', 4, 9], ['relay', 10, 20], ['airlock', 25, 45, 0.8], ['radio_chirp', 15, 30]),
  campus: bed(['bird', 6, 12, 0.7], ['console_beep', 10, 20, 0.6], ['door', 15, 30, 0.6]),
  casino: bed(['chips', 3, 7], ['slot_jingle', 8, 15], ['win_bell', 25, 45, 0.8], ['shuffle', 10, 20], ['dice', 12, 24], ['cheer', 30, 50, 0.5]),
  carpark: bed(['traffic', 10, 20, 0.6], ['door', 20, 40, 0.5]),
  // the unlaunched dreams' loops have their beds ready too
  stadium: bed(['starter_pistol', 20, 40], ['cheer', 8, 16]),
  ward: bed(['pager', 15, 30], ['door', 20, 40, 0.6], ['trolley', 25, 50, 0.6]),
};

// the legacy dreams, room by room: acoustics, wall, bed
const R = (acoustics, events, wall = false) => ({ acoustics, events, wall });
export const LEGACY_ROOMS = {
  chef: {
    // out on the kerb the wireless is inside; the walk-in hears nearly nothing
    arrival: R('open', 'chef_street', true),
    alley_dock: R('open', 'chef_street', 1200),
    freezer: R('room', null, 400),
    the_line: R('room', 'kitchen'),
    loft: R('room', 'kitchen', 1400),
    the_pass: R('room', 'kitchen'),
    rooftop: R('open', 'chef_street', 700),
  },
  writer: {
    arrival: R('open', 'writer_street'),
    attic: R('room', 'writer'),
    copyshop: R('room', 'writer'),
    cafe: R('room', 'writer'),
    library: R('hall', 'writer'),
    postoffice: R('hall', 'writer'),
    bus: R('room', 'writer_street'),
    rain: R('open', 'writer_street'),
    rewrite: R('room', 'writer'),
    editor: R('room', 'writer'),
    agent: R('room', 'writer'),
    city: R('open', 'writer_street'),
    press: R('hall', 'writer'),
    bookshop: R('room', 'writer'),
  },
  astronaut: {
    p0_arrival: R('open', 'campus'),
    p1_track: R('hall', 'campus'),
    p1_pool: R('hall', 'campus'),
    p1_wall_ring: R('hall', 'campus'),
    p1_study: R('room', 'campus'),
    p2_gate: R('open', 'campus'),
    p3_centrifuge: R('hall', 'orbit'),
    p3_nbpool: R('hall', 'orbit'),
    p3_sim: R('room', 'orbit'),
    p3_survival: R('open', 'green'),
    p4_pad: R('open', 'orbit'),
    p4_station: R('hull', 'orbit'),
  },
  gambler: {
    arrival: R('open', 'carpark', true),
    floor: R('room', 'casino'),
    lounge: R('lounge', 'casino'),
    backrooms: R('room', null, 900),
    carpark: R('open', 'carpark', true),
    lasthand: R('open', 'carpark', 700),
    lostfound: R('room', null, 700),
  },
  // the station: the steps are outside, the rest is the great hall
  hub: {
    steps: R('open', 'hub', 1600),
    hall: R('hall', 'hub'),
    platforms_a: R('hall', 'hub'),
    platforms_b: R('hall', 'hub'),
    gate: R('hall', 'hub'),
  },
};

// a place's default bed, when a room names none
export const PLACE_BED = { hub: 'hub', chef: 'kitchen', writer: 'writer', astronaut: 'orbit', gambler: 'casino', clockmaker: 'green', musician: 'rain', painter: null, evening: null };

export function legacyRoom(place, roomId) {
  const t = LEGACY_ROOMS[place];
  return (t && t[roomId]) || null;
}
