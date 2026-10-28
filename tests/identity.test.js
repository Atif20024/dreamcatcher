// Round 2 WP6: the identity tokens and the ui-frame-single lint
import { describe, it, expect } from 'vitest';
import { THEME, IDENTITY, PLACES, PANEL_ALPHA, placeOf, accentOf, rimOf } from '../src/ui/theme.js';
import { frameIssues } from '../scripts/lib/content-checks.js';

describe('identity (critique §9)', () => {
  it('has no pure black and no pure white in the tokens', () => {
    for (const v of [...Object.values(THEME), ...Object.values(IDENTITY)]) {
      expect(v).not.toBe(0x000000);
      expect(v).not.toBe(0xffffff);
    }
    expect(THEME.panel).toBe(IDENTITY.night);
    expect(PANEL_ALPHA).toBe(0.88);
  });
  it('gives every place a shadow, a warm practical and an accent', () => {
    for (const id of ['hub', 'chef', 'musician', 'astronaut', 'writer', 'painter', 'gambler', 'clockmaker', 'evening']) {
      const p = PLACES[id];
      expect(p, id).toBeTruthy();
      for (const k of ['shadow', 'warm', 'accent']) expect(typeof p[k], `${id}.${k}`).toBe('number');
    }
    // the critique's accents
    expect(PLACES.chef.accent).toBe(0xc0392b);
    expect(PLACES.musician.accent).toBe(0x2e7d9a);
    expect(PLACES.astronaut.accent).toBe(0xbfe6ef);
    expect(PLACES.writer.accent).toBe(0x2c3e75);
    expect(PLACES.painter.accent).toBe(0xe8b830);
    expect(PLACES.gambler.accent).toBe(0x2f7a4a);
    expect(PLACES.evening.accent).toBe(0xf0b45a);
  });
  it('maps scenes and dream ids to places', () => {
    expect(placeOf('Chef')).toBe('chef');
    expect(placeOf('clockmaker')).toBe('clockmaker');
    expect(placeOf({ sys: { settings: { key: 'Dream' } }, dreamId: 'clockmaker' })).toBe('clockmaker');
    expect(placeOf({ sys: { settings: { key: 'Intro' } }, levelKey: 'gambler' })).toBe('gambler');
    expect(placeOf('Nowhere')).toBe('hub');
    expect(accentOf('Painter')).toBe(0xe8b830);
    const r = rimOf('hub');
    expect(r).toBeGreaterThan(PLACES.hub.warm & 0xff0000);
  });
  it('ui-frame-single: rounded-rect frames only in Panel.js', () => {
    const src = "g.fillRoundedRect(0, 0, 10, 10, 3);\n// lint-allow frame: a test\ng.strokeRoundedRect(0, 0, 1, 1, 1);";
    expect(frameIssues(src, 'src/scenes/X.js')).toHaveLength(1);
    expect(frameIssues(src, 'src/ui/Panel.js')).toHaveLength(0);
    expect(frameIssues(src, 'src/art/trainArt.js')).toHaveLength(0);
  });
});
