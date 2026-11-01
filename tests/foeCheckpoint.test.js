import { describe, it, expect, vi } from 'vitest';

vi.mock('phaser', () => ({ default: { Math: { RandomDataGenerator: class {} }, Display: { Color: {} } } }));

const { FOES } = await import('../src/data/kinds.js');
const { default: writer } = await import('../src/data/writer/rooms.js');
const { default: astronaut } = await import('../src/data/astronaut/rooms.js');
const { FRAMEWORK_DREAMS, loadAllFrameworkDreams } = await import('../src/dreams/index.js');
await loadAllFrameworkDreams();

const T = 32;
const kindOf = (name) => Object.values(FOES).map((d) => d[name]).find(Boolean) || {};
const grabs = (f) => {
  const k = kindOf(f.kind);
  return (f.human || k.human) && !k.pushes && !k.ranged && !k.passive;
};

// a person who walks within about 80 px of a lamp, on its floor
function nearLamps(dream, room, objects) {
  const out = [];
  for (const c of objects.filter((o) => o.type === 'checkpoint')) {
    for (const f of objects.filter((o) => o.type === 'foe' && grabs(o))) {
      const span = [f.x, ...(f.patrol || [])];
      const a = Math.min(...span);
      const b = Math.max(...span);
      const d = c.x < a ? a - c.x : c.x > b ? c.x - b : 0;
      if (d * T < 80 && Math.abs(c.y - f.y) <= 2) out.push(`${dream}/${room}: ${c.id}, ${f.kind}`);
    }
  }
  return out;
}

// Known, and left: each walks a long floor the lamp happens to stand on, so he
// passes it now and then. A respawn or a throw-out calms him for 1.5 s (calmFoes).
const WALK_PAST = ['astronaut/p1_track: CP1a, cleaner', 'painter/via: cp_via, rival'];

describe('nobody stands at a lamp', () => {
  it('no new person patrols within about 80 px of a checkpoint', () => {
    const found = [
      ...writer.flatMap((r) => nearLamps('writer', r.id, r.objects || [])),
      ...astronaut.flatMap((r) => nearLamps('astronaut', r.id, r.objects || [])),
      ...Object.entries(FRAMEWORK_DREAMS).flatMap(([id, d]) => d.rooms.flatMap((r) => nearLamps(id, r.id, r.entities || []))),
    ];
    expect(found).toEqual(WALK_PAST);
  });
});
