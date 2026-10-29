// Feedback 3: the reading panel's layout, Jo's lights, the restart and
// volume settings (pure parts; the browser parts are scenarios in
// src/dev/scenarios/feedback3.js).
import { describe, it, expect } from 'vitest';
import { wrapWords, paginate, READING } from '../src/ui/readingLayout.js';
import { JO_LIGHTS, roomIsDark, kindsAreDistinct } from '../src/data/joLights.js';
import { PLACES } from '../src/ui/theme.js';
import { defaultSettings, migrate } from '../src/meta/SaveStore.js';
import { RunState } from '../src/play/RunState.js';

const mono = (s) => s.length * 16; // body ×2 is about 16 px a glyph

describe('reading panel layout', () => {
  it('wraps on spaces to the page width and keeps paragraphs', () => {
    const lines = wrapWords('one two three four five six seven eight nine ten\n\nsecond paragraph here', mono, 160);
    expect(Math.max(...lines.map(mono))).toBeLessThanOrEqual(160);
    expect(lines).toContain('');
    expect(lines.join(' ').replace(/\s+/g, ' ')).toBe('one two three four five six seven eight nine ten second paragraph here');
  });

  it('pages long text and never opens a page on a blank line', () => {
    const lines = Array.from({ length: 23 }, (_, i) => (i % 5 === 4 ? '' : `line ${i}`));
    const pages = paginate(lines, 6);
    expect(pages.length).toBeGreaterThan(3);
    for (const p of pages) {
      expect(p.length).toBeLessThanOrEqual(6);
      expect(p[0]).not.toBe('');
    }
  });

  it('is large and high contrast: body ×2 (cap 18), dark ink on paper at 7:1 or more', () => {
    expect(READING.scale).toBeGreaterThanOrEqual(2);
    expect(READING.minCap).toBeGreaterThanOrEqual(18);
    const lum = (c) => [16, 8, 0].map((k) => ((c >> k) & 255) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)).reduce((t, v, i) => t + v * [0.2126, 0.7152, 0.0722][i], 0);
    const [a, b] = [lum(READING.ink), lum(READING.paper)].sort((x, y) => y - x);
    expect((a + 0.05) / (b + 0.05)).toBeGreaterThanOrEqual(7);
  });
});

describe("Jo's light, dream by dream", () => {
  it('every place has one, and each is a different thing', () => {
    for (const p of Object.keys(PLACES)) expect(JO_LIGHTS[p], p).toBeTruthy();
    expect(kindsAreDistinct()).toBe(true);
  });

  it('is carried only where it is dark: per room, room data first', () => {
    expect(roomIsDark('chef', 'the_pass')).toBe(false); // the kitchen is bright
    expect(roomIsDark('chef', 'freezer')).toBe(true); // the cold store is not
    expect(roomIsDark('musician', 'cellar')).toBe(false);
    expect(roomIsDark('musician', 'alley')).toBe(true);
    expect(roomIsDark('painter', 'bottega')).toBe(false); // Florence by day
    expect(roomIsDark('painter', 'chapel')).toBe(true);
    expect(roomIsDark('painter', 'bottega', false)).toBe(true); // room.lit: false wins
    expect(roomIsDark('hub', null, true)).toBe(false); // room.lit: true wins
  });
});

describe('settings and runs', () => {
  it('the Music and Ambience sliders default to full and survive a migration', () => {
    expect(defaultSettings().volumes).toEqual({ music: 1, ambience: 1 });
    const s = migrate({ v: 2, activeSlot: 0, settings: { musicOff: false, volumes: { music: 0.4, ambience: 0.7 } }, slots: [] });
    expect(s.settings.volumes).toEqual({ music: 0.4, ambience: 0.7 });
  });

  it('a fresh run (a restart from the start) holds nothing of the old one', () => {
    const r = new RunState({ dreamId: 'chef' });
    expect(r.walletDelta).toBe(0);
    expect(r.inventory).toEqual([]);
    expect(r.flags).toEqual({});
    expect(r.lit).toEqual([]);
  });
});
