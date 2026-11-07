// The train kit's measurements (round 2 WP3, critique §7.3). One carriage
// drawing in real metres, read by the painters (src/art/trainArt.js), the
// hub bays, the dream arrivals and `npm run lint:scale`. Pure data: no
// Phaser, so the lint can import it headless.
//
// A main-line coach: 20 m long, 2.8 m wide, 3.9 m from rail to roof, its
// floor 1.15 m above the rail. At 1 m = 44 px that is 880 × 172 side-on and
// 123 × 172 end-on, a 50 × 88 door, against Jo's 76 px (82 with his hat).
import { px } from '../data/scale.js';

export const CARRIAGE = {
  lenM: 20,
  widthM: 2.8,
  heightM: 3.9, // rail to roof
  floorM: 1.15, // rail to floor (the door sill)
  door: { wM: 1.14, hM: 2.0 }, // a side door, 50 × 88
  gangway: { wM: 0.8, hM: 1.95, frameM: 1.15 }, // the end door and its bellows frame
  window: { wM: 1.45, hM: 0.85, sillM: 0.95 }, // above the floor
  buffer: { atM: 1.06, spanM: 1.75, headM: 0.45 }, // above the rail; centre to centre
  wheelM: 0.92,
  bogieM: 2.6, // wheelbase
  bogieCentresM: 14.2,
};

// px, derived once
export const TRAIN = {
  len: px(CARRIAGE.lenM), // 880
  width: px(CARRIAGE.widthM), // 123
  height: px(CARRIAGE.heightM), // 172
  floor: px(CARRIAGE.floorM), // 51 above the rail
  doorW: px(CARRIAGE.door.wM), // 50
  doorH: px(CARRIAGE.door.hM), // 88
  wheel: px(CARRIAGE.wheelM), // 40
  pit: 40, // the hub track pit: the rail sits 0.9 m under the concourse
};

// the hub bay furniture and the station's other big things, in metres
export const STATION = {
  lampPlatform: { m: 3.5, w: 0.5 }, // 154
  bufferStop: { m: 1.35, w: 3.2 },
  platformGate: { m: 1.1, w: 1.6 },
  ticketBooth: { m: 2.6, w: 2.7, counterM: 1.1 }, // 120 × 114
  kiosk: { m: 2.5, w: 2.5 }, // 110 × 110
  phoneBox: { m: 2.3, w: 0.9 }, // 40 × 100
  revolvingDoor: { m: 2.4, w: 2.0 }, // 88 × 106
  doubleDoor: { m: 2.6, w: 1.8 }, // 80 × 114
};

// texture key → [drawn w, drawn h, class] for the lint: every painted
// train-kit and station prop, sized from the metres above. The painters
// fill their canvas to exactly this height (the opaque bottom is the floor
// or the rail), so the canvas height is the drawn height.
const S = (o) => [px(o.w), px(o.m)];
export const TRAIN_KIT_SIZES = {
  'hub-carriage-end': [TRAIN.width, TRAIN.height, 'carriageEnd'],
  'train-carriage-side': [TRAIN.len, TRAIN.height, 'carriageSide'],
  'train-carriage-door': [TRAIN.doorW, TRAIN.doorH, 'carriageDoor'],
  'hub-platform-lamp': [...S(STATION.lampPlatform), 'lampPlatform'],
  'hub-buffer-stop': [...S(STATION.bufferStop), 'bufferStop'],
  'hub-platform-gate': [...S(STATION.platformGate), 'platformGate'],
  'hub-ticket-booth': [...S(STATION.ticketBooth), 'ticketBooth'],
  'hub-news-kiosk': [...S(STATION.kiosk), 'kiosk'],
  'hub-phone-box': [...S(STATION.phoneBox), 'phoneBooth'],
  'hub-revolving-door': [...S(STATION.revolvingDoor), 'revolvingDoor'],
  'hub-double-door': [...S(STATION.doubleDoor), 'doubleDoor'],
};
