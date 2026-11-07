import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import SMALL from '../src/ui/fonts/small.js';
import BODY, { BODY_ROWS } from '../src/ui/fonts/body.js';
import { sanitize, measure } from '../src/ui/BitmapFonts.js';
import { hud, fitToBudget, SLOTS } from '../src/ui/hud.js';

const walk = (d, out = []) => {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (p.endsWith('.js')) out.push(p);
  }
  return out;
};

describe('string-art fonts', () => {
  it('small glyphs are 7 rows of equal width', () => {
    for (const [ch, rows] of Object.entries(SMALL)) {
      expect(rows.length, ch).toBe(7);
      expect(new Set(rows.map((r) => r.length)).size, ch).toBe(1);
    }
  });
  it('body glyphs fit the 11-row cell with equal-width rows', () => {
    for (const [ch, spec] of Object.entries(BODY)) {
      const [start, body] = spec.split('|');
      const rows = body.split('/');
      expect(Number(start) + rows.length, ch).toBeLessThanOrEqual(BODY_ROWS);
      expect(new Set(rows.map((r) => r.length)).size, ch).toBe(1);
    }
  });
  it('covers printable ASCII (body) and every symbol the game strings use', () => {
    for (let c = 33; c < 127; c++) expect(BODY[String.fromCharCode(c)], String.fromCharCode(c)).toBeTruthy();
    const used = new Set();
    for (const f of walk(join(__dirname, '../src'))) {
      // string literals only (comments carry § and the like)
      const src = readFileSync(f, 'utf8');
      for (const m of src.matchAll(/'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`(?:[^`\\]|\\.)*`/g)) for (const ch of m[0]) if (ch.charCodeAt(0) > 126) used.add(ch);
    }
    const missing = [...used].filter((ch) => sanitize(ch, 'body') === '?');
    expect(missing).toEqual([]);
  });
  it('small and display upcase; unknown characters fall back', () => {
    expect(sanitize('hello — é', 'small')).toBe('HELLO — E');
    expect(sanitize('é', 'body')).toBe('é');
    expect(sanitize('\u{1F512}', 'body')).toBe('');
  });
  it('body reads at 2x: a 44-character line fits a 760 px card', () => {
    expect(measure('body', 'x'.repeat(44), 2).width).toBeLessThanOrEqual(760);
    expect(measure('body', 'A', 2).height).toBeGreaterThanOrEqual(18); // cap height 9 px at 1x
  });
});

describe('HUD layout budget', () => {
  it('cuts a line that overflows its slot and records it', () => {
    hud.overflows = [];
    const m = (l) => measure('small', l, 2).width;
    const out = fitToBudget('coins', 'x'.repeat(200), m);
    expect(m(out)).toBeLessThanOrEqual(SLOTS.coins.maxW);
    expect(out.endsWith('…')).toBe(true);
    expect(hud.overflows.length).toBe(1);
  });
  it('a tool line publishes to the tool slot', () => {
    hud.bind(null);
    hud.toolLine(0, '#fff').setText('INK ▮▮▯');
    hud.toolLine(1).setText('');
    expect(hud.get('tool')).toEqual([{ text: 'INK ▮▮▯', color: '#fff' }]);
  });
});
