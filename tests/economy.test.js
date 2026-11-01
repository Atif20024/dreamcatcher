import { describe, it, expect } from 'vitest';
import { heartsMax, PRICES, HEARTS_CAP } from '../src/systems/wallet.js';
import { HATS } from '../src/data/hats.js';

describe("Bilal's stall", () => {
  it('a whole heart of shards always adds a heart, even when caught dreams have filled the row', () => {
    expect(heartsMax(0, 0)).toBe(3);
    expect(heartsMax(0, 3)).toBe(4);
    expect(heartsMax(3, 0)).toBe(6);
    expect(heartsMax(5, 2)).toBe(6);
    expect(heartsMax(5, 3)).toBe(7);
    expect(heartsMax(5, 99)).toBe(HEARTS_CAP);
  });

  it('the shelf costs more than a full run pays, and a heart is within one good dream or two', () => {
    const INCOME = 1855; // every coin placed in the seven running dreams (coin count × worth)
    const heart = PRICES.shards.reduce((a, b) => a + b, 0);
    const shelf = heart + PRICES.postcard * 7 + PRICES.ticket + PRICES.tea + HATS.reduce((a, h) => a + h.cost, 0);
    expect(heart).toBeLessThanOrEqual(INCOME / 4);
    expect(shelf).toBeGreaterThan(INCOME);
    // what changes play (heart, every postcard, a ticket, a tea) fits inside a real run's 60 %
    expect(heart + PRICES.postcard * 7 + PRICES.ticket + PRICES.tea).toBeLessThan(INCOME * 0.7);
  });
});
