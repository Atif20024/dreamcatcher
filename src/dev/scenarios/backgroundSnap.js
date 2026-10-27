// F#4: crossing a room boundary swaps the backdrop and every parallax layer's
// y jumps (832 -> 1088 in one frame). Correct behaviour: no layer moves more
// than 8 px between consecutive frames while walking across the boundary.
export default {
  id: 'background-snap',
  expect: 'fail',
  async run(dc) {
    dc.warp('gambler', 'floor');
    dc.step(30);
    dc.press('Enter', 2); // dismiss any first-time tutorial card
    dc.step(20);
    const sc = dc.scene();
    const layers = () => sc.parallax.slots.flatMap(([name, slot]) => slot.pair.map((s, i) => [`${name}${i}`, s.y]));
    let prev = Object.fromEntries(layers());
    const room0 = dc.state().room;
    let worst = { d: 0, layer: null, frame: -1 };
    dc.hold('left');
    let crossed = false;
    for (let f = 0; f < 400; f++) {
      dc.step(1);
      const cur = Object.fromEntries(layers());
      for (const k of Object.keys(cur)) {
        const d = Math.abs(cur[k] - (prev[k] ?? cur[k]));
        if (d > worst.d) worst = { d, layer: k, frame: f };
      }
      prev = cur;
      if (dc.state().room !== room0) crossed = true;
      if (crossed && f > worst.frame + 30) break;
    }
    dc.release('left');
    if (!crossed) return { pass: false, detail: `never left room ${room0}; harness walk failed` };
    return { pass: worst.d <= 8, detail: `${room0} -> ${dc.state().room}: largest one-frame layer y change ${worst.d}px (${worst.layer}, frame ${worst.frame}); limit 8px` };
  },
};
