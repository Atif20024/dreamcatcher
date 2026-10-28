import { describe, it, expect } from 'vitest';
import { parseCardIds, findTriggeredIds, deadCards, countDefaultText } from '../scripts/lib/content-checks.js';

const TUT = `
const CARDS = {
  a_card: { name: 'A', hint: 'x', key: '' },
  b_card: { name: 'B', hint: 'x', key: '' },
  // a comment
  c_card: { name: 'C', hint: 'x', key: '' },
};
export function showTutorial() {}
`;

describe('tutorial trigger detector', () => {
  it('parses card ids', () => {
    expect(parseCardIds(TUT)).toEqual(['a_card', 'b_card', 'c_card']);
  });
  it('finds showTutorial, showTutorialSafe and multi-quote forms', () => {
    const ids = findTriggeredIds([
      "showTutorial(this, 'a_card');",
      'this.showTutorialSafe("b_card")',
      'if (x) showTutorial(scene,`c_card`)',
    ]);
    expect([...ids].sort()).toEqual(['a_card', 'b_card', 'c_card']);
  });
  it('reports untriggered cards as dead', () => {
    expect(deadCards(TUT, ["showTutorial(this, 'a_card')", "// not a call: 'b_card'"])).toEqual(['b_card', 'c_card']);
  });
  it('cards are data: 39 cards (the 4 with no mechanic were deleted), each with a trigger', async () => {
    const { CARDS } = await import('../src/data/teach.js');
    expect(Object.keys(CARDS).length).toBe(39);
    for (const id of ['ledge_grab', 'hang_drop', 'careful_step', 'loose_tile']) expect(CARDS[id]).toBeUndefined();
    for (const c of Object.values(CARDS)) expect(c.triggers.length).toBeGreaterThan(0);
  });
});

describe('default text (an error since phase 1.2)', () => {
  it('counts add.text(, make.text(, monospace and canvas text', () => {
    const c = countDefaultText("this.add.text(1,2,'x',{fontFamily:'monospace'}); scene.add\n.text(0,0,'y'); this.make.text({}); ctx.font = '9px x'; ctx.fillText('a', 0, 0);");
    expect(c).toEqual({ addText: 3, mono: 1, canvas: 2 });
  });
  it('skips a line that is allowlisted with a reason', () => {
    const c = countDefaultText("ctx.fillText('a', 0, 0); // lint-allow default-text: a measured reason");
    expect(c).toEqual({ addText: 0, mono: 0, canvas: 0 });
  });
});

describe('phase 1.4 content rules', async () => {
  const m = await import('../scripts/lib/content-checks.js');
  const { roomObjective } = await import('../src/play/Objectives.js');
  const rooms = { d: [{ id: 'a', grid: ['....'], objects: [{ type: 'spawn', x: 0 }, { type: 'foe', kind: 'rat', x: 3 }, { type: 'gate', id: 'g', requires: ['f'] }] }] };
  it('a card with no trigger, a zone in a missing room, an event nobody fires: errors', () => {
    const out = m.teachIssues({ a: { triggers: [] }, b: { triggers: [{ dream: 'd', zone: { room: 'nope' } }] }, c: { triggers: [{ dream: 'd', event: 'x' }] } }, ["showTutorial(this, 'z')"], rooms);
    expect(out.length).toBe(4);
  });
  it('rooms without an objective, gates without a hint, foes near spawn: errors', () => {
    expect(m.objectiveIssues(rooms).length).toBe(1);
    expect(m.gateIssues(rooms).length).toBe(1);
    expect(m.spawnSafetyIssues(rooms).length).toBe(1);
  });
  it('the last objective entry whose flag is set wins', () => {
    const r = { objective: ['find it', { flag: 'got', text: 'bring it' }, { flag: 'gone', unless: 'got', text: 'x' }] };
    expect(roomObjective(r, {})).toBe('find it');
    expect(roomObjective(r, { got: true })).toBe('bring it');
    expect(roomObjective(r, { gone: true })).toBe('x');
  });
});
