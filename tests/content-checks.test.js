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
  it('real tutorial.js shape: 43 cards', async () => {
    const { readFileSync } = await import('node:fs');
    const src = readFileSync(new URL('../src/systems/tutorial.js', import.meta.url), 'utf8');
    expect(parseCardIds(src).length).toBe(43);
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
