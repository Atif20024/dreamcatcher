import { describe, it, expect } from 'vitest';
import { resolveWarp, firstSceneKey } from '../src/dev/warp.js';
import { dreamById } from '../src/data/dreams.js';

describe('unified warp', () => {
  it('maps dream:place to the legacy param', () => {
    expect(resolveWarp('?warp=astronaut:eva').legacy).toEqual({ at: 'eva' });
    expect(resolveWarp('?warp=writer:cafe').legacy).toEqual({ wr: 'cafe' });
    expect(resolveWarp('?warp=evening:ridge').legacy).toEqual({ ev: 'ridge' });
  });
  it("THE MASTER'S LADDER warps into the framework", () => {
    expect(firstSceneKey('?warp=painter:chapel')).toBe('Dream');
    expect(resolveWarp('?warp=painter:chapel').legacy).toEqual({});
  });
  it('THE LAST HAND warps into the framework', () => {
    expect(firstSceneKey('?warp=gambler:cards')).toBe('Dream');
    expect(resolveWarp('?warp=gambler:cards').legacy).toEqual({});
  });
  it('chef/musician/hub have no legacy param but pick the scene', () => {
    expect(resolveWarp('?warp=chef:start').legacy).toEqual({});
    expect(firstSceneKey('?warp=chef:start')).toBe('Chef');
    expect(firstSceneKey('?warp=hub')).toBe('Hub');
    expect(firstSceneKey('')).toBeNull(); // no warp: the title boots
  });
  it('THE BIG STAGE warps into the framework', () => {
    expect(firstSceneKey('?warp=musician')).toBe('Dream');
    expect(firstSceneKey('?warp=musician:cellar')).toBe('Dream');
    expect(resolveWarp('?warp=musician_legacy')).toBeNull(); // the old scenes are gone
  });
  it('the rebuilt dreams board DreamScene from the hub', () => {
    for (const id of ['musician', 'painter', 'gambler']) expect(dreamById(id).scene).toBe('Dream');
  });
  it('THE STOPPED HOUR warps by its id and by the old proof alias', () => {
    expect(firstSceneKey('?warp=clockmaker:start')).toBe('Dream');
    expect(firstSceneKey('?warp=proof:start')).toBe('Dream');
  });
  it('old params keep working and unknown dreams are ignored', () => {
    expect(firstSceneKey('?wr=cafe')).toBe('Writer');
    expect(firstSceneKey('?at=pad')).toBe('Astronaut');
    expect(firstSceneKey('')).toBeNull();
    expect(resolveWarp('?warp=nope:x')).toBeNull();
  });
});
