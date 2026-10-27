// D3 — tileset for THE YELLOW HOUSE. Painted by levelArt (material 'stroke':
// every tile is four to eight ridged brushstrokes). The base palette is a
// warm cream so the paint state can TINT it: umber / grey-blue while the
// world is underpainting, the pigment's own colour once Jo has painted it.
export default {
  key: 'pt',
  material: 'stroke',
  tiles: {
    fill: 'F',
    dark: 'D',
    lipLight: 'T',
    lipDark: 'M',
    edge: 'E',
    deco: 'K',
  },
  palette: {
    F: 0xd8c8a0,
    D: 0x8a7a58,
    T: 0xf2e8c8,
    M: 0xb8a878,
    E: 0x6b4e2e,
    K: 0xc8b088,
  },
  support: 'bracket',
  supportColors: [0x1f3a5f, 0x5b3a7a],
  ladderColor: 0x6b4e2e,
  climbColor: 0x4a5566,
  climbDeco: 0x1f3a5f,
  hazardColor: 0xe8c060,
  liquid: 0x2e4a80,
  liquidTop: 0x88b8d8,
};
