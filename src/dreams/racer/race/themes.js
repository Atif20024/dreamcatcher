// A track's world, as data (tracks.js sets `theme`): sky, land, road paint, kerb,
// what stands at the roadside. RaceRoad paints from this; nothing here draws, so
// the node tests can read a track. Each theme's textures are named by its id and
// freed on leaving the race (RaceRoad.freeTheme).
//
// The land is real scale at its distance: 1 m = 44 px at the road, and each layer's
// kind in src/art/backdrops/painted.js is drawn at the px/m its parallax implies.
//
// THE CALVESSA COAST, spring 1958: closed public roads. Crowned dust with the wheel
// tracks worn dark, no painted lines and no rumble strip. A warm print grade.
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
  road: { dust: 0xa8946c, crown: 0xb8a47c, track: 0x7a6a4e, edge: 0x8a7856, stone: 0xd2c6a8 },
  verge: { ground: 0xb29c68, specks: [0x8e7c4e, 0x6e7c4a, 0x9a8a60] },
  farVerge: { ground: 0x9c8e60, speck: 0x7a7a4c },
  kerb: { wall: 0x7c7262, wallLit: 0xa89c86, gap: 0x3e3830, weed: 0x5a6a3a },
  // what stands at the road's edge, on the road's own scale (frames in src/art/carKit.js;
  // `painted`: one of the theme's own textures, RaceRoad.paintSteps)
  scenery: [
    { frame: 'pole', painted: true, at: 20, every: 50, side: 'far', wires: true }, // telegraph poles, 7 m, along the far verge
    { frame: 'milestone', at: 100, every: 100, side: 'near' }, // whitewashed stones, one each hectometre
    { frame: 'rope', at: 6, every: 14, to: 60, side: 'near' }, // rope and posts along the start
  ],
  look: { vignette: 0.5, grain: 0.04 },
};
