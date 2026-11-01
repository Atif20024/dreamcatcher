import { describe, it, expect } from 'vitest';
import { heartsMax, heartsFull, PRICES, HEARTS_CAP, addCoins, abandonRun, coinWorth, getWallet, spend, deductWorth } from '../src/systems/wallet.js';
import { getSave, updateSave, getRun, setRun, clearRun } from '../src/utils/save.js';
import { HATS } from '../src/data/hats.js';

describe("Bilal's stall", () => {
  it('caught dreams give five hearts at most; a whole heart of shards adds one on top, up to the cap', () => {
    expect(heartsMax(0, 0)).toBe(3);
    expect(heartsMax(0, 3)).toBe(4);
    expect(heartsMax(2, 0)).toBe(5);
    expect(heartsMax(3, 0)).toBe(5);
    expect(heartsMax(5, 0)).toBe(5);
    expect(heartsMax(5, 2)).toBe(5);
    expect(heartsMax(5, 3)).toBe(6);
    expect(heartsMax(5, 9)).toBe(HEARTS_CAP);
    expect(heartsMax(5, 99)).toBe(HEARTS_CAP);
  });

  it('Bilal only calls it full when another shard really buys nothing', () => {
    expect(heartsFull(5, 8)).toBe(false); // the ninth shard is the last heart
    expect(heartsFull(5, 9)).toBe(true);
    expect(heartsFull(0, 11)).toBe(false); // three hearts of shards on three: six, and catches still to come
    expect(heartsFull(2, 11)).toBe(true); // every shard there is (8 found + 3 bought), base 5
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

// (Node: the store has no localStorage and keeps the save in memory)
describe('Board from the start takes the old run back', () => {
  const W = coinWorth('chef');
  const start = (coins, shards, extraFields) => {
    updateSave((s) => {
      s.wallet = { total: 0, byDream: {} };
      s.shards = shards;
    });
    addCoins('chef', coins);
    setRun('chef', { dreamId: 'chef', sceneKey: 'Dream', walletDelta: coins, extra: { walletAtSave: coins * W, shardsTaken: ['1,1', '2,2'], ...extraFields } });
  };

  it('coins and shards come out, the run is gone', () => {
    start(10, 5);
    abandonRun('chef');
    expect(getWallet().total).toBe(0);
    expect(getWallet().byDream.chef).toBe(0);
    expect(getSave().shards).toBe(3);
    expect(getRun('chef')).toBe(null);
  });

  it("money from elsewhere stays; money spent at Bilal's since floors the wallet at zero", () => {
    start(10, 1);
    updateSave((s) => (s.wallet.total += 7));
    abandonRun('chef');
    expect(getWallet().total).toBe(7);
    start(10, 1);
    expect(spend(4 * W)).toBe(true);
    abandonRun('chef');
    expect(getWallet().total).toBe(0);
    expect(getSave().shards).toBe(0);
  });

  it('coins taken or dropped after the last save count too', () => {
    start(10, 2);
    addCoins('chef', 3);
    abandonRun('chef');
    expect(getWallet().total).toBe(0);
    start(10, 2);
    deductWorth('chef', 4 * W);
    abandonRun('chef');
    expect(getWallet().total).toBe(0);
  });

  it('an old run with no stored figure takes back nothing, and still clears', () => {
    start(10, 5, { walletAtSave: undefined });
    abandonRun('chef');
    expect(getWallet().total).toBe(10 * W);
    expect(getSave().shards).toBe(5);
    expect(getRun('chef')).toBe(null);
  });

  it('no run: nothing happens', () => {
    clearRun('chef');
    updateSave((s) => (s.wallet = { total: 9, byDream: { chef: 9 } }));
    abandonRun('chef');
    expect(getWallet().total).toBe(9);
  });
});
