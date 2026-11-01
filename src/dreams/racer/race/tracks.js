// The tracks (data only: the engine and the node tests read it). Stage 1 has
// one test road, flat, on the Pinewood stretch of the Calvessa Coast. A bend's
// `safe` is the speed it holds in m/s on new tyres; `side` is where it throws
// you (1 towards the near verge, -1 towards the far one); `outside` is what
// is there (straw is soft, a wall spins you back to the lamp).
export const TRACKS = {
  test: {
    id: 'test',
    title: 'PINEWOOD STRETCH',
    length: 1200,
    countdown: 3,
    gridLane: 1,
    passPlace: 1, // one placeholder rival: the real races pass on a top 3 (design §3)
    prize: { 1: 12, 2: 6 }, // brass nuts
    lamps: [600],
    bends: [
      { from: 340, to: 430, safe: 24, side: 1, outside: 'straw' },
      { from: 850, to: 935, safe: 19, side: -1, outside: 'wall' },
    ],
    obstacles: [
      { d: 540, lane: 2, kind: 'cart' },
      { d: 700, lane: 0, kind: 'bale' },
      { d: 760, lane: 1, kind: 'bale' },
      { d: 1040, lane: 0, kind: 'cart' },
    ],
    rival: { id: 'roche', livery: 'roche', d: 9, lane: 1, pull: 1.04, top: 0.96 },
  },
};
