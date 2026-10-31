// Touch controls: the pure half (src/input/touchLayout.js, touchTaps.js).
import { describe, it, expect, beforeEach } from 'vitest';
import { touchWanted, layoutTouch, buttonCss, padDirections, controlsAt, keysAt, pickRect, toGame, isPortrait, TOUCH_KEYS, GAME_W, GAME_H } from '../src/input/touchLayout.js';
import { addTapZone, routeZoneTap, zonesHideControls, _clearZones } from '../src/input/touchTaps.js';
import { HUD_INSETS_NONE, hudInsets, setHudInsets } from '../src/ui/hud.js';

// canvas sizes as FIT draws 960 × 540 into common screens (CSS px)
const VIEWPORTS = {
  'iPhone SE landscape (568×320)': { cssW: 568, cssH: 320 },
  'iPhone 14 landscape (844×390 → 693×390)': { cssW: 693, cssH: 390 },
  'Pixel 7 landscape (915×412 → 732×412)': { cssW: 732, cssH: 412 },
  'iPad landscape (1024×768 → 1024×576)': { cssW: 1024, cssH: 576 },
  'desktop ?touch=1 (1280×720)': { cssW: 1280, cssH: 720 },
};

const inside = (b) => b.x - b.r >= 0 && b.y - b.r >= 0 && b.x + b.r <= GAME_W && b.y + b.r <= GAME_H;
const circles = (L) => [...L.pad.arms.map((a) => ({ id: a.id, x: a.x, y: a.y, r: L.pad.r })), ...L.buttons];

describe('touchWanted', () => {
  it('a phone (coarse pointer) gets the controls', () => expect(touchWanted({ coarse: true })).toBe(true));
  it('a touch screen with no hover gets them', () => expect(touchWanted({ maxTouchPoints: 5, hover: false })).toBe(true));
  it('a desktop does not', () => expect(touchWanted({ coarse: false, hover: true, maxTouchPoints: 0 })).toBe(false));
  it('a laptop with a touch screen and a mouse does not', () => expect(touchWanted({ maxTouchPoints: 10, hover: true })).toBe(false));
  it('?touch=1 forces them on, ?touch=0 off', () => {
    expect(touchWanted({ query: '?touch=1' })).toBe(true);
    expect(touchWanted({ query: '?warp=hub&touch=0', coarse: true })).toBe(false);
  });
});

describe('layoutTouch', () => {
  for (const [name, v] of Object.entries(VIEWPORTS)) {
    describe(name, () => {
      const L = layoutTouch(v);
      it('buttons are 52–64 CSS px', () => {
        const css = L.b / L.k;
        expect(css).toBeGreaterThanOrEqual(52);
        expect(css).toBeLessThanOrEqual(64);
      });
      it('every plate is on screen', () => {
        for (const c of circles(L)) expect(inside(c), c.id).toBe(true);
      });
      it('no two plates overlap', () => {
        const all = circles(L);
        for (let i = 0; i < all.length; i++)
          for (let j = i + 1; j < all.length; j++) {
            const a = all[i];
            const b = all[j];
            expect(Math.hypot(a.x - b.x, a.y - b.y), `${a.id}/${b.id}`).toBeGreaterThan(a.r + b.r);
          }
      });
      it('the clusters stay in the bottom corners, clear of the middle third', () => {
        expect(L.clusters.left.x + L.clusters.left.w).toBeLessThan(GAME_W / 3 + 20);
        expect(L.clusters.right.x).toBeGreaterThan((GAME_W * 2) / 3 - 20);
        expect(L.clusters.left.y).toBeGreaterThan(GAME_H * 0.35);
      });
      it('pause sits in the top-left corner and the HUD column moves right of it', () => {
        const p = L.buttons.find((b) => b.id === 'pause');
        expect(p.x).toBeLessThan(80);
        expect(p.y).toBeLessThan(80);
        expect(16 + L.insets.left).toBeGreaterThanOrEqual(p.x + p.r);
        expect(L.insets.contextBottom).toBeLessThanOrEqual(L.clusters.left.y);
      });
      it('every arm and button answers at its own centre', () => {
        for (const a of L.pad.arms) expect(controlsAt(L, a.x, a.y)).toEqual([a.id]);
        for (const b of L.buttons) expect(controlsAt(L, b.x, b.y)).toEqual([b.id]);
      });
    });
  }

  it('the button size follows the screen height, clamped', () => {
    expect(buttonCss(200)).toBe(52);
    expect(buttonCss(390)).toBe(62);
    expect(buttonCss(1000)).toBe(64);
  });
});

describe('the d-pad by angle', () => {
  const L = layoutTouch(VIEWPORTS['iPhone 14 landscape (844×390 → 693×390)']);
  const P = L.pad;
  const at = (deg, dist = P.d) => padDirections(P, P.cx + Math.cos((deg * Math.PI) / 180) * dist, P.cy - Math.sin((deg * Math.PI) / 180) * dist);
  it('the four arms', () => {
    expect(at(0)).toEqual(['right']);
    expect(at(180)).toEqual(['left']);
    expect(at(90)).toEqual(['up']);
    expect(at(-90)).toEqual(['down']);
  });
  it('a thumb running east may drift 35° without pressing up', () => {
    expect(at(35)).toEqual(['right']);
    expect(at(-35)).toEqual(['right']);
  });
  it('the diagonals press both', () => {
    expect(at(50)).toEqual(['right', 'up']);
    expect(at(130)).toEqual(['left', 'up']);
    expect(at(-130)).toEqual(['left', 'down']);
  });
  it('the dead centre and far outside press nothing', () => {
    expect(at(0, 2)).toEqual([]);
    expect(at(0, P.reach + 5)).toEqual([]);
  });
});

describe('controlsAt / keysAt', () => {
  const L = layoutTouch(VIEWPORTS['iPhone 14 landscape (844×390 → 693×390)']);
  const jump = L.buttons.find((b) => b.id === 'jump');
  const pause = L.buttons.find((b) => b.id === 'pause');
  it('the hit circle is generous (1.3× the plate)', () => {
    expect(controlsAt(L, jump.x + jump.r * 1.2, jump.y)).toEqual(['jump']);
    expect(controlsAt(L, jump.x - jump.r * 2.5, jump.y - jump.r * 3)).not.toContain('jump');
  });
  it('the middle of the screen is no button (a tap)', () => expect(controlsAt(L, GAME_W / 2, GAME_H / 2)).toEqual([]));
  it('under a dialogue only pause answers', () => {
    expect(controlsAt(L, jump.x, jump.y, { play: false })).toEqual([]);
    expect(controlsAt(L, L.pad.arms[1].x, L.pad.arms[1].y, { play: false })).toEqual([]);
    expect(controlsAt(L, pause.x, pause.y, { play: false })).toEqual(['pause']);
  });
  it('the keys are the keyboard\'s own', () => {
    expect(keysAt(L, jump.x, jump.y)).toEqual(['Space']);
    expect(keysAt(L, L.pad.arms[0].x, L.pad.arms[0].y)).toEqual(['ArrowLeft']);
    expect(TOUCH_KEYS.interact).toBe('KeyE');
    expect(TOUCH_KEYS.pause).toBe('Escape');
  });
});

describe('pickRect (menu rows)', () => {
  const rows = [0, 1, 2].map((i) => ({ x: 300, y: 200 + i * 20, w: 200, h: 26 }));
  it('the row under the finger; overlapping rows go to the nearer centre', () => {
    expect(pickRect(rows, 400, 213)).toBe(0);
    expect(pickRect(rows, 400, 236)).toBe(1);
    expect(pickRect(rows, 400, 258)).toBe(2);
  });
  it('a little off the row still counts, far off does not', () => {
    expect(pickRect(rows, 290, 210, 24)).toBe(0);
    expect(pickRect(rows, 100, 210, 24)).toBe(-1);
  });
  it('skips missing rects', () => expect(pickRect([null, { x: 0, y: 0, w: 10, h: 10 }], 5, 5)).toBe(1));
});

describe('toGame / isPortrait', () => {
  it('client px to game px over a letterboxed canvas', () => {
    const rect = { left: 75, top: 0, width: 693, height: 390 };
    expect(toGame(rect, 75, 0)).toEqual({ x: 0, y: 0 });
    const p = toGame(rect, 75 + 693, 390);
    expect(p.x).toBeCloseTo(960);
    expect(p.y).toBeCloseTo(540);
  });
  it('portrait is taller than wide', () => {
    expect(isPortrait(390, 844)).toBe(true);
    expect(isPortrait(844, 390)).toBe(false);
  });
});

describe('tap zones', () => {
  beforeEach(() => _clearZones());
  const scene = (active = true) => ({ sys: { isActive: () => active }, events: { once() {} } });

  it('a tap on a row calls the zone with that row', () => {
    const s = scene();
    const got = [];
    addTapZone(s, { rects: () => [{ x: 0, y: 0, w: 100, h: 30 }, { x: 0, y: 40, w: 100, h: 30 }], onTap: (i) => got.push(i) });
    expect(routeZoneTap(s, 50, 50)).toBe(true);
    expect(routeZoneTap(s, 500, 500)).toBe(false);
    expect(got).toEqual([1]);
  });
  it('only the owner scene\'s live zones answer, newest first', () => {
    const a = scene();
    const b = scene();
    const got = [];
    let open = true;
    addTapZone(a, { onTap: () => got.push('a1') });
    addTapZone(a, { onTap: () => got.push('a2'), when: () => open });
    addTapZone(b, { onTap: () => got.push('b') });
    routeZoneTap(a, 1, 1);
    open = false;
    routeZoneTap(a, 1, 1);
    expect(got).toEqual(['a2', 'a1']);
    expect(zonesHideControls(a)).toBe(true);
  });
  it('a stopped scene\'s zones are not live; removing one works', () => {
    const s = scene(false);
    addTapZone(s, { onTap: () => {} });
    expect(zonesHideControls(s)).toBe(false);
    const t = scene();
    const off = addTapZone(t, { onTap: () => {} });
    off();
    expect(routeZoneTap(t, 1, 1)).toBe(false);
  });
});

describe('HUD insets', () => {
  it('are zero on desktop, set and cleared by the controls', () => {
    expect({ ...hudInsets }).toEqual(HUD_INSETS_NONE);
    setHudInsets({ left: 80, contextBottom: 300, footer: false });
    expect(hudInsets.left).toBe(80);
    setHudInsets();
    expect({ ...hudInsets }).toEqual(HUD_INSETS_NONE);
  });
});
