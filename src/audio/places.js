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
  // the service gate: no PA, no crowd, one counter clicking over
  gate_hum: bed(['turnstile', 20, 40, 0.35]),
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
  // the scene-built dreams
  kitchen: bed(['pan_clatter', 5, 10], ['ticket_bell', 12, 20], ['chop', 9, 16], ['order_call', 14, 24], ['steam', 10, 18, 0.8]),
  chef_street: bed(['traffic', 10, 18, 0.7], ['drain', 8, 16, 0.7]),
  writer: bed(['carriage_bell', 15, 30], ['paper', 8, 15], ['crumple', 20, 40, 0.8], ['clock_hour', 60, 90, 0.7]),
  writer_street: bed(['traffic', 9, 16, 0.7], ['horn', 25, 50, 0.5], ['drain', 15, 30, 0.6]),
  orbit: bed(['console_beep', 4, 9], ['relay', 10, 20], ['airlock', 25, 45, 0.8], ['radio_chirp', 15, 30]),
  campus: bed(['bird', 6, 12, 0.7], ['console_beep', 10, 20, 0.6], ['door', 15, 30, 0.6]),
  // THE LAST HAND: the Lantern Queen. On deck the river; below, the wheel through the hull
  river: bed(['paddle_wheel', 14, 28, 0.7], ['steam_whistle', 40, 80, 0.7], ['deck_bell', 35, 70, 0.6], ['bird', 8, 16, 0.7], ['swifts', 20, 40, 0.5]),
  boat_saloon: bed(['glass_clink', 5, 11], ['chips', 8, 16, 0.8], ['shuffle', 14, 26, 0.7], ['laugh', 12, 24, 0.7], ['paddle_wheel', 20, 40, 0.5], ['steam_whistle', 60, 110, 0.4]),
  boat_cards: bed(['shuffle', 7, 14], ['chips', 6, 12, 0.8], ['chair_scrape', 18, 34, 0.6], ['paddle_wheel', 25, 45, 0.4]),
  boat_cabin: bed(['paddle_wheel', 16, 30, 0.5], ['deck_bell', 40, 80, 0.4], ['steam_whistle', 50, 90, 0.5]),
  // the unlaunched dreams' loops have their beds ready too
  stadium: bed(['starter_pistol', 20, 40], ['cheer', 8, 16]),
  ward: bed(['pager', 15, 30], ['door', 20, 40, 0.6], ['trolley', 25, 50, 0.6]),
};

// the legacy dreams, room by room: acoustics, wall, bed
const R = (acoustics, events, wall = false) => ({ acoustics, events, wall });
export const LEGACY_ROOMS = {
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
  // the station: the steps are outside, the rest is the great hall
  hub: {
    steps: R('open', 'hub', 1600),
    hall: R('hall', 'hub'),
    platforms_a: R('hall', 'hub'),
    platforms_b: R('hall', 'hub'),
    gate: R('hall', 'gate_hum'),
  },
};

// a place's default bed, when a room names none
export const PLACE_BED = { hub: 'hub', chef: 'kitchen', writer: 'writer', astronaut: 'orbit', gambler: 'river', clockmaker: 'green', musician: 'rain', painter: null, evening: null };

export function legacyRoom(place, roomId) {
  const t = LEGACY_ROOMS[place];
  return (t && t[roomId]) || null;
}
