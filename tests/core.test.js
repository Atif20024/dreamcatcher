import { describe, it, expect, vi } from 'vitest';
import { EventBus, EVENTS } from '../src/core/events.js';
import { Services } from '../src/core/services.js';
import { parseFlags, initFlags, flag, setFlag, resetFlags, allFlags } from '../src/core/flags.js';

describe('EventBus', () => {
  it('emits payloads to listeners and returns an unsubscribe', () => {
    const b = new EventBus();
    const fn = vi.fn();
    const off = b.on('room:enter', fn);
    b.emit('room:enter', { id: 'a' });
    expect(fn).toHaveBeenCalledWith({ id: 'a' }, 'room:enter');
    off();
    b.emit('room:enter', { id: 'b' });
    expect(fn).toHaveBeenCalledTimes(1);
  });
  it('once fires once', () => {
    const b = new EventBus();
    const fn = vi.fn();
    b.once('item:get', fn);
    b.emit('item:get');
    b.emit('item:get');
    expect(fn).toHaveBeenCalledTimes(1);
  });
  it('safe when a listener unsubscribes during emit', () => {
    const b = new EventBus();
    const calls = [];
    const a = () => { calls.push('a'); b.off('gate:open', a); };
    b.on('gate:open', a);
    b.on('gate:open', () => calls.push('b'));
    b.emit('gate:open');
    b.emit('gate:open');
    expect(calls).toEqual(['a', 'b', 'b']);
  });
  it('respects ctx when removing and counts listeners', () => {
    const b = new EventBus();
    const fn = () => {};
    b.on('verb:use', fn, 1);
    b.on('verb:use', fn, 2);
    b.off('verb:use', fn, 1);
    expect(b.listenerCount('verb:use')).toBe(1);
  });
  it('strict mode rejects unknown events; canonical list has the plan events', () => {
    const b = new EventBus({ strict: true });
    expect(() => b.emit('nope')).toThrow();
    expect(() => b.on('dream:complete', () => {})).not.toThrow();
    expect(EVENTS).toContain('portal:cross');
    expect(EVENTS.length).toBe(18);
  });
});

describe('Services', () => {
  it('registers, gets, and refuses duplicates', () => {
    const s = new Services();
    const svc = {};
    s.register('save', svc);
    expect(s.get('save')).toBe(svc);
    expect(s.has('save')).toBe(true);
    expect(() => s.register('save', {})).toThrow();
    s.register('save', 1, { replace: true });
    expect(s.get('save')).toBe(1);
  });
  it('get throws for missing, maybe returns null', () => {
    const s = new Services();
    expect(() => s.get('x')).toThrow(/not registered/);
    expect(s.maybe('x')).toBeNull();
    s.register('x', 1);
    expect(s.names()).toEqual(['x']);
    s.unregister('x');
    expect(s.has('x')).toBe(false);
  });
});

describe('flags', () => {
  it('parses on/off lists', () => {
    expect(parseFlags('a,-b, c')).toEqual({ a: true, b: false, c: true });
  });
  it('defaults off; URL turns on; setFlag overrides', () => {
    resetFlags();
    expect(flag('teach')).toBe(false);
    initFlags('?flags=teach,-uiScene');
    expect(flag('teach')).toBe(true);
    expect(allFlags().uiScene).toBe(false);
    setFlag('uiScene');
    expect(flag('uiScene')).toBe(true);
    resetFlags();
  });
});
