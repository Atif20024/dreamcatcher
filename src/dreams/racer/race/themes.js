// A track's world, as data (tracks.js sets `theme`): sky, land, the road's paint.
// RoadView paints from this; nothing here draws, so the node tests can read a track.
// The quay's rooms read the same land (dream.js).
//
// THE CALVESSA COAST, spring 1958: closed public roads through the pines. Crowned
// macadam with the wheel tracks worn dark, no painted lines; whitewash and brick only
// where a bend wants a kerb. A warm print grade.
export const COAST = {
  id: 'coast',
  background: 0xb4ccd0,
  sky: { top: 0x86aec4, mid: 0xb4ccd0, bottom: 0xeee4c8, clouds: 4, cloud: 0xf0e8d4, cloudLit: 0xfff8e8, seed: 21 },
  land: { sky: 0xb4ccd0, hill: 0xa89a80, house: 0xc0ae8c, roof: 0xa86a4a, window: 0x3a3430, light: 0xf2e6cc, rim: 0xf2e6cc, deep: 0x2a2a24, leaf: 0x34523a, trunk: 0x5a4030, sea: 0x4a8aa4, mist: 0xe6dcc0, mistA: 0.3, haze: 0.18, fade: 0.08 },
  layers: [
    { kind: 'coast_cliffs', f: 0.1, seed: 5, dy: 0 },
    { kind: 'coast_village', f: 0.35, seed: 9, dy: 4, land: { mistA: 0.16 } },
    { kind: 'coast_pines', f: 0.7, seed: 12, dy: 8, land: { haze: 0.06, mistA: 0.06 } },
  ],
  // the land at the end of the road (RoadView.paintLand)
  ridge: { far: 0x8fa6ac, cliff: 0xc8b89a, haze: 0xb4ccd0, sea: 0x5e9cb4, seaLit: 0xc4e0e4, ridge: 0x5e7a58, ridgeDark: 0x48644c, ridgeLit: 0x7a9264, wall: 0xd8ccb0, roof: 0xb4745a },
  // the view paints bands of these, faded towards `haze` with distance
  paint: {
    haze: 0xd8d4b4,
    road: [0x8e806a, 0x786c58], // the two tones that run under the car
    track: 0x71654f,
    tuft: 0x5e6838,
    tuftLit: 0xa4a25c,
    edge: 0xa8987a,
    stone: 0xd8cdb0,
    verge: [0x90924e, 0x767a40], // dry grass and pine duff
    shoulder: [0xb09c6e, 0xa08e62],
    kerb: [0xece4d0, 0xa8402e], // whitewash and brick
    shade: 0x2a3440, // what the pines' shadow mixes in
    lit: 0xfff0c0,
  },
  look: { vignette: 0.5, grain: 0.04 },
};
