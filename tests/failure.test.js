import { describe, it, expect, vi } from 'vitest';
import { EventBus } from '../src/core/events.js';
import { HealthModel, DEFAULT_HEALTH } from '../src/play/Health.js';
import { RunState, sanitizeFlags, convKey } from '../src/play/RunState.js';
import {
  SaveStore,
  memoryAdapter,
  migrate,
  normalizeLegacy,
  slotFromLegacy,
  legacyFromSlot,
  SAVE_VERSION,
  SLOT_COUNT,
} from '../src/meta/SaveStore.js';
import { checkpointIssues } from '../scripts/lib/content-checks.js';

describe('HealthModel', () => {
  it('a hit costs one heart and grants i-frames', () => {
    const h = new HealthModel({ max: 3 });
    expect(h.hit(1000)).toEqual({ applied: true, zero: false });
    expect(h.hearts).toBe(2);
    // inside the i-frame window: ignored
    expect(h.hit(1000 + DEFAULT_HEALTH.iframes - 1).applied).toBe(false);
    expect(h.hearts).toBe(2);
    expect(h.hit(1000 + DEFAULT_HEALTH.iframes).applied).toBe(true);
    expect(h.hearts).toBe(1);
  });

  it('reports zero once and emits health events', () => {
    const bus = new EventBus({ strict: true });
    const changed = vi.fn();
    const zero = vi.fn();
    bus.on('health:changed', changed);
    bus.on('health:zero', zero);
    const h = new HealthModel({ max: 2, bus });
    h.hit(0);
    const r = h.hit(5000);
    expect(r.zero).toBe(true);
    expect(h.isZero).toBe(true);
    expect(zero).toHaveBeenCalledTimes(1);
    expect(changed).toHaveBeenCalledTimes(2);
    h.lose(1); // already at zero: no second zero event
    expect(zero).toHaveBeenCalledTimes(1);
  });

  it('refill restores max; heal clamps to max; set may exceed (tea)', () => {
    const h = new HealthModel({ max: 4 });
    h.lose(3);
    h.heal(10);
    expect(h.hearts).toBe(4);
    h.lose(4);
    h.refill();
    expect(h.hearts).toBe(4);
    h.set(5);
    expect(h.hearts).toBe(5);
    h.setMax(6);
    expect(h.max).toBe(6);
  });

  it('knockback pushes away from the source, or against facing', () => {
    const h = new HealthModel({ max: 3 });
    expect(h.knockback(100, 140)).toEqual({ x: -180, y: -220 });
    expect(h.knockback(100, 60)).toEqual({ x: 180, y: -220 });
    expect(h.knockback(100, null, true).x).toBe(180);
    expect(h.knockback(100, null, false).x).toBe(-180);
  });

  it('the no-fail profile (THE LONG EVENING) cannot be hurt', () => {
    const h = new HealthModel({ max: 3, noFail: true });
    expect(h.canHit(99999)).toBe(false);
    expect(h.hit(99999).applied).toBe(false);
    expect(h.lose(2).applied).toBe(false);
    expect(h.hearts).toBe(3);
  });
});

describe('RunState', () => {
  it('round-trips through JSON', () => {
    const r = new RunState({ dreamId: 'chef', sceneKey: 'Chef' });
    r.lightCheckpoint('CP5', 'THE PASS', { x: 10.4, y: 20.6 });
    r.capture({ flags: { d0: true, choice: 'nia', obj: { no: 1 } }, inventory: ['SAFFRON', { bad: 1 }], hearts: 2, walletDelta: 7, extra: { a: [1] } });
    r.markConv('abc');
    const back = RunState.from(JSON.parse(JSON.stringify(r.toJSON())));
    expect(back.checkpointId).toBe('CP5');
    expect(back.checkpointLabel).toBe('THE PASS');
    expect(back.pos).toEqual({ x: 10, y: 21 });
    expect(back.lit).toEqual(['CP5']);
    expect(back.flags).toEqual({ d0: true, choice: 'nia' });
    expect(back.inventory).toEqual(['SAFFRON']);
    expect(back.hearts).toBe(2);
    expect(back.walletDelta).toBe(7);
    expect(back.extra).toEqual({ a: [1] });
  });

  it('only conversations heard before the resume are skippable', () => {
    const r = RunState.from({ dreamId: 'writer', seenConvs: ['old'] });
    r.markConv('new');
    expect(r.seenBeforeResume('old')).toBe(true);
    expect(r.seenBeforeResume('new')).toBe(false);
    expect(r.hasSeenConv('new')).toBe(true);
  });

  it('sanitizes flags and keys conversations stably', () => {
    expect(sanitizeFlags({ a: true, b: 2, c: 's', d: null, e: [], f: {} })).toEqual({ a: true, b: 2, c: 's', d: null });
    const e = [{ name: 'Nia', text: 'hi' }];
    expect(convKey(e)).toBe(convKey([{ name: 'Nia', text: 'hi' }]));
    expect(convKey(e)).not.toBe(convKey([{ name: 'Nia', text: 'hello' }]));
  });

  it('needs a dream id', () => {
    expect(() => new RunState({})).toThrow();
  });
});

// a v1 save as players have it on disk today
const V1 = {
  dreamsCaught: 2,
  dreams: { chef: true, musician: true },
  seen: ['trumpet', 'bet'],
  flags: { hub: { moment1: true, visits: 7 }, wr: { x: 1 }, pt: {}, gm: { y: true }, zz: { custom: 1 } },
  stationSeconds: 321,
  lastDream: 'musician',
  wallet: { total: 40, byDream: { chef: 12 }, marker: 3 },
  shards: 4,
  shop: { shardsBought: 1, postcards: { chef: true }, tea: true, ticket: false, hats: ['beret'], hat: 'beret' },
  moments: { chef: ['m1'] },
  met: { chef: true },
  cast: { chef: { nia: 1 } },
  evening: { visited: true, map: { a: 1 }, finished: false, finds: {} },
  somethingNew: { kept: true },
};

describe('SaveStore migration v1 → v2', () => {
  it('maps the flat save into the v2 sections', () => {
    const v2 = migrate(V1);
    expect(v2.v).toBe(SAVE_VERSION);
    expect(v2.activeSlot).toBe(0);
    expect(v2.slots).toHaveLength(SLOT_COUNT);
    const s = v2.slots[0];
    expect(s.progress).toMatchObject({ dreamsCaught: 2, caught: { chef: true, musician: true }, shards: 4, lastDream: 'musician' });
    expect(s.hub).toEqual({ flags: { moment1: true, moment2: false, moment3: false, gateOpened: false, gateSpoke: false, visits: 7 }, stationSeconds: 321 });
    expect(s.seen.cards['*']).toEqual(['trumpet', 'bet']);
    expect(s.flags.wr).toEqual({ x: 1 });
    expect(s.wallet.marker).toBe(3);
    expect(s.runs).toEqual({});
    expect(s.extra).toEqual({ somethingNew: { kept: true } });
    expect(v2.slots[1]).toBeNull();
  });

  it('is lossless: the flat view equals what v1 load() returned', () => {
    const view = legacyFromSlot(migrate(V1).slots[0]);
    expect(view).toEqual(normalizeLegacy(V1));
    // and every original key and value survived
    for (const [k, v] of Object.entries(V1)) expect(view[k]).toMatchObject(v);
  });

  it('round-trips legacy → slot → legacy for defaults and odd input', () => {
    for (const raw of [{}, { shards: 1 }, { flags: { hub: { visits: 2 } } }]) {
      expect(legacyFromSlot(slotFromLegacy(raw))).toEqual(normalizeLegacy(raw));
    }
  });

  it('garbage or missing data becomes an empty v2 save', () => {
    for (const raw of [null, 'x', 7, []]) {
      const v2 = migrate(raw);
      expect(v2.v).toBe(2);
      expect(legacyFromSlot(v2.slots[0]).dreamsCaught).toBe(0);
    }
  });

  it('refuses a save from a newer build', () => {
    expect(() => migrate({ v: 99 })).toThrow();
  });

  it('a v2 save loads as itself', () => {
    const v2 = migrate(V1);
    expect(migrate(JSON.parse(JSON.stringify(v2)))).toEqual(v2);
  });
});

describe('SaveStore', () => {
  it('migrates on load and writes v2 back through the adapter', () => {
    const ad = memoryAdapter(V1);
    const st = new SaveStore(ad);
    expect(st.legacy().shards).toBe(4);
    st.updateLegacy((s) => (s.shards += 1));
    const disk = JSON.parse(ad.read());
    expect(disk.v).toBe(2);
    expect(disk.slots[0].progress.shards).toBe(5);
    expect(disk.slots[0].extra.somethingNew).toEqual({ kept: true });
  });

  it('keeps runs per dream across legacy writes, and clears them', () => {
    const st = new SaveStore(memoryAdapter());
    const r = new RunState({ dreamId: 'gambler' });
    r.lightCheckpoint('CP4', 'THE CAR PARK', { x: 1, y: 2 });
    st.setRun('gambler', r);
    st.updateLegacy((s) => (s.stationSeconds = 9)); // an unrelated v1-style write
    expect(st.run('gambler').checkpointLabel).toBe('THE CAR PARK');
    expect(Object.keys(st.runs())).toEqual(['gambler']);
    st.clearRun('gambler');
    expect(st.run('gambler')).toBeNull();
  });

  it('has three slots and global settings; slot 0 by default', () => {
    const st = new SaveStore(memoryAdapter());
    st.updateLegacy((s) => (s.shards = 2));
    st.updateSettings((x) => (x.musicOff = true));
    st.selectSlot(2);
    expect(st.legacy().shards).toBe(0);
    expect(st.settings().musicOff).toBe(true); // settings are global
    st.selectSlot(0);
    expect(st.legacy().shards).toBe(2);
    expect(() => st.selectSlot(3)).toThrow();
  });

  it('exports and imports JSON', () => {
    const a = new SaveStore(memoryAdapter(V1));
    const b = new SaveStore(memoryAdapter());
    b.importJSON(a.exportJSON());
    expect(b.legacy()).toEqual(a.legacy());
  });
});

describe('checkpoint lint', () => {
  it('flags missing labels, missing ids and duplicates', () => {
    const rooms = {
      d: [
        { id: 'r1', objects: [{ type: 'checkpoint', x: 1, id: 'A', label: 'THE A' }, { type: 'checkpoint', x: 2, id: 'A', label: 'X' }] },
        { id: 'r2', objects: [{ type: 'checkpoint', x: 3, id: 'B' }, { type: 'checkpoint', x: 4, label: 'Y' }] },
      ],
    };
    const out = checkpointIssues(rooms);
    expect(out.some((m) => /duplicate checkpoint id A/.test(m))).toBe(true);
    expect(out.some((m) => /B has no label/.test(m))).toBe(true);
    expect(out.some((m) => /no id/.test(m))).toBe(true);
  });
});
