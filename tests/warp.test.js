import { describe, it, expect } from 'vitest';
import { resolveWarp, firstSceneKey } from '../src/dev/warp.js';

describe('unified warp', () => {
  it('maps dream:place to the legacy param', () => {
    expect(resolveWarp('?warp=gambler:pit').legacy).toEqual({ gm: 'pit' });
    expect(resolveWarp('?warp=astronaut:eva').legacy).toEqual({ at: 'eva' });
    expect(resolveWarp('?warp=writer:cafe').legacy).toEqual({ wr: 'cafe' });
    expect(resolveWarp('?warp=painter:studio').legacy).toEqual({ pt: 'studio' });
    expect(resolveWarp('?warp=evening:ridge').legacy).toEqual({ ev: 'ridge' });
  });
  it('chef/musician/hub have no legacy param but pick the scene', () => {
    expect(resolveWarp('?warp=chef:start').legacy).toEqual({});
    expect(firstSceneKey('?warp=chef:start')).toBe('Chef');
    expect(firstSceneKey('?warp=hub')).toBe('Hub');
    expect(firstSceneKey('')).toBeNull(); // no warp: the title boots
  });
  it('THE BIG STAGE warps into the framework; ?legacy=1 keeps the old scene', () => {
    expect(firstSceneKey('?warp=musician')).toBe('Dream');
    expect(firstSceneKey('?warp=musician:cellar')).toBe('Dream');
    expect(firstSceneKey('?warp=musician&legacy=1')).toBe('Musician');
    expect(firstSceneKey('?warp=musician_legacy')).toBe('Musician');
  });
  it('THE STOPPED HOUR warps by its id and by the old proof alias', () => {
    expect(firstSceneKey('?warp=clockmaker:start')).toBe('Dream');
    expect(firstSceneKey('?warp=proof:start')).toBe('Dream');
  });
  it('old params keep working and unknown dreams are ignored', () => {
    expect(firstSceneKey('?gm=floor')).toBe('Gambler');
    expect(firstSceneKey('?at=pad')).toBe('Astronaut');
    expect(firstSceneKey('')).toBeNull();
    expect(resolveWarp('?warp=nope:x')).toBeNull();
  });
});
