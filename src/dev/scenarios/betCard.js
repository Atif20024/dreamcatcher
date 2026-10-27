// Tutorial `bet` card rendered UNDER the stake selector (depth 240 vs modal
// 300) so it was never seen. Correct behaviour (phase 1.2, ModalManager):
// the BET card is the top modal and drawn; the stake selector waits hidden
// under it and comes back when the card is dismissed.
export default {
  id: 'bet-card-hidden',
  expect: 'pass',
  async run(dc) {
    // un-see the card only (leave the rest of the dev save alone)
    // (the save is v2 now: go through the save module, not the raw key)
    const { unmarkSeen } = await import('../../utils/save.js');
    unmarkSeen('bet');
    dc.warp('gambler', 'pit');
    dc.step(30);
    dc.press('Enter', 2);
    dc.step(20);
    const sc = dc.scene();
    const table = (sc.tables || []).find((t) => t.game === 'wheel') || (sc.tables || [])[0];
    if (!table) return { pass: false, detail: 'no table found in gm=pit' };
    sc.openTable(table);
    dc.step(20);
    // phase 1.2: one ModalManager stack; only its top is drawn
    const stack = sc.modals ? sc.modals.state() : [];
    const top = stack[stack.length - 1];
    const sel = stack.find((m) => /^BET — /.test(m.name));
    if (!top || top.name !== 'tutorial:bet') return { pass: false, detail: `BET card not on top (stack: ${JSON.stringify(stack)})` };
    if (!sel) return { pass: false, detail: 'stake selector not open' };
    // the card's text is on the UI camera and drawn; the selector waits hidden
    const ui = window.game.scene.getScene('UI');
    const cam = ui.cameras.main;
    const card = ui.children.list.find((o) => o.isDCText && o.text === 'BET' && o.name === 'tutorial-name');
    const drawn = !!card && card.visible && !(card.cameraFilter & cam.id);
    const hidden = !sel.shown;
    // dismiss the card: the selector comes back on top
    dc.step(20);
    dc.press('KeyX', 2);
    dc.step(4);
    const after = sc.modals.state();
    const back = after.length && /^BET — /.test(after[after.length - 1].name) && after[after.length - 1].shown;
    return { pass: drawn && hidden && !!back, detail: `card drawn on top: ${drawn}; stake selector hidden under it: ${hidden}; selector back after the card: ${!!back}` };
  },
};
