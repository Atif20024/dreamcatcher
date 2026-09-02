// D3 — tileset for Crossroads Station: cream stone, brass lips, iron for the
// shed and the undercroft cages. The hub is the warmest place in the game
// at 0 dreams; HubState desaturates it with an overlay, not by repainting.
export default {
  key: 'hub',
  tiles: {
    fill: 'F',
    dark: 'D',
    lipLight: 'T',
    lipDark: 'M',
    edge: 'E',
    deco: 'K',
  },
  palette: {
    F: 0xd8cbb0, // cream stone
    D: 0xb8a98c,
    T: 0xf2e6cc,
    M: 0xc9b894,
    E: 0xa08f70,
    K: 0xc4a25c, // brass inlay
  },
  support: 'bracket',
  noSupports: true, // the hall's balconies get real columns, drawn by the scene
  supportColors: [0x3e3a3c, 0x7a7078],
  ladderColor: 0x7a6a44,
  climbColor: 0x4a4650,
  climbDeco: 0x2a262c,
  hazardColor: 0xc0c4cc,
};
