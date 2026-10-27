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

describe('default text debt', () => {
  it('counts add.text( and monospace', () => {
    const c = countDefaultText("this.add.text(1,2,'x',{fontFamily:'monospace'}); scene.add\n.text(0,0,'y'); const q = 1;");
    expect(c).toEqual({ addText: 2, mono: 1 });
  });
});
