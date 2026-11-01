import { describe, it, expect } from 'vitest';
import { CAST } from '../src/data/evening/cast.js';
import * as rooms from '../src/data/evening/rooms.js';
import { CAST_BODIES } from '../src/data/scale.js';

describe("the Evening's people from every dream", () => {
  const src = JSON.stringify(rooms);
  it.each([
    ['nell', 'clockmaker'],
    ['bice', 'painter'],
    ['gualtiero', 'painter'],
    ['lou', 'gambler'],
    ['fenn', 'gambler'],
    ['marguerite', 'chef'],
    ['bastien', 'chef'],
  ])('%s of the %s is placed, has a body, and only comes if Jo met them', (id, dream) => {
    expect(CAST[id].knows).toBe(dream);
    expect(CAST[id].idle.length).toBeGreaterThan(0);
    expect(CAST_BODIES[`ev-p-${id}`]).toBeTruthy();
    expect(src).toContain(`"who":"${id}"`);
  });

  it('nobody remembers the old kitchen', () => {
    expect(JSON.stringify(CAST)).not.toMatch(/souffl/i);
  });
});
