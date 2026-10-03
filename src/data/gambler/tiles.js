// D3 — tileset for THE LAST HAND: red carpet with a gold pattern over the
// floor, brass on the lips, concrete under the back rooms (the carpet pass
// is the same tile everywhere; the rooms' washes change its temperature).
// Painted by levelArt (material 'carpet').
export default {
  key: 'gm',
  material: 'carpet',
  tiles: {
    fill: 'F',
    dark: 'D',
    lipLight: 'T',
    lipDark: 'M',
    edge: 'E',
    deco: 'K',
  },
  palette: {
    F: 0x6e1e2c,
    D: 0x3a0e18,
    T: 0xe9b84a,
    M: 0x8a5a24,
    E: 0x2a0a12,
    K: 0xc08a3a,
  },
  support: 'bracket',
  supportColors: [0x2a1a14, 0x8a6a2c],
  ladderColor: 0x8a6a2c,
  climbColor: 0x2a2230,
  climbDeco: 0xe9b84a,
  hazardColor: 0xd5443c,
  liquid: 0x101018,
  liquidTop: 0x2a2a3a,
};
