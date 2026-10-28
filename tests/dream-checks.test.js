import { describe, it, expect, vi } from 'vitest';

// the proof dream imports painters that import phaser (browser-only)
vi.mock('phaser', () => ({ default: { Math: { RandomDataGenerator: class {} }, Display: { Color: {} } } }));

const { dreamIssues, reachableTiles } = await import('../scripts/lib/dream-checks.js');
const { SHARED_MATERIALS, SHARED_DECOR_RULES } = await import('../src/world/MaterialLibrary.js');
const { PROP_IDS } = await import('../src/art/props.js');
const { default: proof } = await import('../src/dreams/clockmaker/dream.js');

const opts = { materials: SHARED_MATERIALS, decorRules: SHARED_DECOR_RULES, props: Object.fromEntries(PROP_IDS.map((k) => [k, {}])) };
const clone = (d) => ({ ...d, rooms: d.rooms.map((r) => ({ ...r, grid: [...r.grid], entities: (r.entities || []).map((e) => ({ ...e })) })) });

describe('framework dream lint', () => {
  it('the proof dream is clean', () => {
    expect(dreamIssues(proof, opts)).toEqual([]);
  });
  it('catches an unpaired portal, an unreachable room and a missing seam prop', () => {
    const d = clone(proof);
    const green = d.rooms.find((r) => r.id === 'green');
    green.entities = green.entities.filter((e) => e.id !== 'green>clock');
    const lane = d.rooms.find((r) => r.id === 'lane');
    lane.entities.find((e) => e.id === 'lane>green').seam = { width: 300 };
    const out = dreamIssues(d, opts).join('\n');
    expect(out).toMatch(/clock>green.*partner portal "green>clock" does not exist/);
    expect(out).toMatch(/clockhouse: not reachable/);
    expect(out).toMatch(/physical seam prop/);
  });
  it('catches 2-tile headroom, a floating spawn, an unreachable NPC and unknown refs', () => {
    const d = clone(proof);
    const lane = d.rooms.find((r) => r.id === 'lane');
    lane.grid[13] = '##########' + lane.grid[13].slice(10);
    lane.entities.find((e) => e.type === 'spawn').y = 5;
    lane.props = [...lane.props, { prop: 'spaceship', x: 2, y: 16 }];
    const green = d.rooms.find((r) => r.id === 'green');
    green.entities.find((e) => e.type === 'npc').y = 2;
    green.objective = [{ text: 'x', flag: 'f' }];
    const out = dreamIssues(d, opts).join('\n');
    expect(out).toMatch(/lane: \d+ standing tile\(s\) with < 3 tiles of headroom/);
    expect(out).toMatch(/spawn start: \(3,5\) is not a standing tile/);
    expect(out).toMatch(/unknown prop "spaceship"/);
    expect(out).toMatch(/npc wren: \(18,2\) is not a standing tile/);
    expect(out).toMatch(/first objective entry must be unconditional/);
  });
  it('on-foot reachability: a 4-tile step is a jump, a 6-tile wall is not', () => {
    const g = ['..........', '..........', '..........', '......####', '......####', '......####', '..........', '##########'];
    // standing row 6, the block top is row 3 (standing row 2): 4 up → reachable
    expect(reachableTiles(g, [[1, 6]]).has('7,2')).toBe(true);
    const tall = ['..........', '......####', '......####', '......####', '......####', '......####', '..........', '##########'];
    expect(reachableTiles(tall, [[1, 6]]).has('7,0')).toBe(false);
  });
});
