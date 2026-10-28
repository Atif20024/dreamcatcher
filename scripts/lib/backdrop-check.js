// Round 2 WP4: the scale lint for what stands behind and around Jo.
//   trees     every play-plane tree texture (TREE_TABLE) at its painted
//             height (treePx: the tree kit paints the canvas to it) vs its
//             class; never under 260 px (critique §7.2, "trees the size of Jo")
//   fronts    every play-plane house/shop front and door (FRONT_TABLE) at
//             3 m a storey (frontPx) vs its class
//   rows      every building row a backdrop paints (BACKDROP_ROWS): its storey
//             must be 132·s px (± 10 %) for the scroll factor of its layer,
//             and every row nearer than the far skyline must stand behind a
//             ground line
// `check(key, kind, cls, h, range)` is scale-check's: out of range is an ERROR.
export function checkBackdrops(S, check, out) {
  for (const [key, kind] of Object.entries(S.TREE_TABLE)) {
    const cls = S.TREE_CLASS[kind];
    const h = S.treePx(kind, 1).h;
    check(key, 'tree', cls, h, S.PROP_CLASSES[cls].h);
    if (h < S.PROP_CLASSES.treePlay.h[0]) out.errors.push({ key, kind: 'tree', cls: 'treePlay', h, range: S.PROP_CLASSES.treePlay.h, note: 'a tree on the play plane is never under 260 px' });
  }
  for (const [key, spec] of Object.entries(S.FRONT_TABLE)) check(key, 'front', spec.cls, S.frontPx(spec, 1), S.PROP_CLASSES[spec.cls].h);
  for (const [id, row] of Object.entries(S.BACKDROP_ROWS)) {
    const want = 132 * row.s;
    const got = S.facadeMetrics(row.s).storey;
    const ok = Math.abs(got - want) <= want * 0.1;
    out.measured.push({ key: id, kind: 'row', cls: 'storey', h: Math.round(got * 10) / 10, range: [want * 0.9, want * 1.1], ok });
    if (!ok) out.errors.push({ key: id, kind: 'row', cls: 'storey', h: got, range: [want * 0.9, want * 1.1], note: 'storey = 132·s' });
    if (row.s >= 0.2 && !row.groundLine) out.errors.push({ key: id, kind: 'row', cls: 'groundLine', h: 0, range: [0, 0], note: 'a row nearer than the far skyline needs a ground line in front of it' });
  }
}
