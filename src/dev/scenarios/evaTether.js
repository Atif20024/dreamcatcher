// A1/F#6: in the EVA, the first push-off without the tether is an instant,
// untaught death ("no tether. Earth does not get closer.", lose a heart).
// Correct behaviour: the first unclipped push-off is blocked/taught (card or
// hint), never a drift-away that costs a heart.
export default {
  id: 'eva-tether-trap',
  expect: 'fail',
  async run(dc) {
    dc.warp('astronaut', 'eva');
    dc.step(60);
    const sc = dc.scene();
    const hearts0 = sc.lives;
    const info = { tether: !!sc.tether, room: sc.roomPhys && sc.roomPhys().room.id };
    dc.hold('right');
    dc.step(20);
    dc.release('right');
    dc.press('Space', 3);
    dc.step(60);
    const drifting = !!sc.drifting;
    dc.step(240); // drift-away lasts ~3.4 s then costs a heart
    const lost = hearts0 - sc.lives;
    const pass = !drifting && lost === 0;
    return { pass, detail: `room ${info.room}, tether ${info.tether}; after first unclipped push-off: drifting=${drifting}, hearts lost=${lost} (want no drift, no loss)` };
  },
};
