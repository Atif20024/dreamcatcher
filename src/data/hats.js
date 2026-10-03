// Bilal sells six hats. Cosmetic: a tint on Jo's porkpie; Auntie Ro has an
// opinion about every one of them (collectibles skill §2).
export const HATS = [
  { id: 'porkpie', name: 'the old porkpie', cost: 50, tint: 0xffffff, ro: 'That hat has seen things. Keep it.' },
  { id: 'sunday', name: 'Sunday cream', cost: 100, tint: 0xf2e6cc, ro: 'A cream hat. In a kitchen town. Brave.' },
  { id: 'brass', name: 'brass band', cost: 150, tint: 0xf2d580, ro: 'You look like a bandstand. I mean that kindly.' },
  { id: 'rust', name: 'boxcar rust', cost: 200, tint: 0xc86a4a, ro: 'Rust suits people who keep moving.' },
  { id: 'midnight', name: 'midnight blue', cost: 300, tint: 0x4a6aa8, ro: 'Midnight blue. Your mother would approve. I approve.' },
  { id: 'stationmaster', name: "the stationmaster's", cost: 400, tint: 0x2e6a4a, ro: "Where did you get— no. Don't tell me." },
];
export function hatById(id) {
  return HATS.find((h) => h.id === id);
}
