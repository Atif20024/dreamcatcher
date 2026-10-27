// Tutorial `bet` card renders UNDER the stake selector (depth 240 vs modal
// 300) so it is never seen. Correct behaviour: when the BET card shows, its
// objects are drawn above the stake selector.
export default {
  id: 'bet-card-hidden',
  expect: 'fail',
  async run(dc) {
    // un-see the card only (leave the rest of the dev save alone)
    try {
      const sv = JSON.parse(localStorage.getItem('dreamcatcher.save') || '{}');
      sv.seen = (sv.seen || []).filter((id) => id !== 'bet');
      localStorage.setItem('dreamcatcher.save', JSON.stringify(sv));
    } catch {}
    dc.warp('gambler', 'pit');
    dc.step(30);
    dc.press('Enter', 2);
    dc.step(20);
    const sc = dc.scene();
    const table = (sc.tables || []).find((t) => t.game === 'wheel') || (sc.tables || [])[0];
    if (!table) return { pass: false, detail: 'no table found in gm=pit' };
    sc.openTable(table);
    dc.step(20);
    const texts = sc.children.list.filter((o) => o.type === 'Text');
    const card = texts.find((t) => t.text === 'BET');
    const modal = texts.find((t) => /^BET — /.test(t.text));
    if (!card) return { pass: false, detail: `BET card not shown (tutorialActive=${!!sc.tutorialActive})` };
    if (!modal) return { pass: false, detail: 'stake selector not open' };
    const above = card.depth > modal.depth && card.visible;
    return { pass: above, detail: `BET card text depth ${card.depth} vs stake selector title depth ${modal.depth}; card must be above` };
  },
};
