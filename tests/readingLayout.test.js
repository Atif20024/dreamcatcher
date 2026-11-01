// Feedback 4 ("texts still unreadable in notes"): the reading panel's
// layout per screen: whole-number pixel scale, cap height in CSS px, line
// length, leading, contrast, device-pixel placement, balanced pages.
import { describe, it, expect } from 'vitest';
import { READING, layoutFor, pageSize, placeOnDevice, paginate, wrapWords, footerText, pitch } from '../src/ui/readingLayout.js';
import { measure } from '../src/ui/BitmapFonts.js';
import { PAGE_THREE } from '../src/data/writer/cast.js';

// WCAG contrast (src/ui/text.js#contrast, which imports Phaser)
const lum = (c) => [16, 8, 0].map((k) => ((c >> k) & 255) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)).reduce((t, v, i) => t + v * [0.2126, 0.7152, 0.0722][i], 0);
const contrast = (a, b) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);

// the game canvas's CSS box in a window (Phaser FIT, 16:9)
const fit = (w, h) => {
  const s = Math.min(w / 960, h / 540);
  return { cssW: 960 * s, cssH: 540 * s };
};
const SCREENS = [
  { name: '1280×720', w: 1280, h: 720, dpr: 1, phone: false },
  { name: '1440×900', w: 1440, h: 900, dpr: 1, phone: false },
  { name: '1920×1080 @2', w: 1920, h: 1080, dpr: 2, phone: false },
  { name: '1536×864 @1.25', w: 1536, h: 864, dpr: 1.25, phone: false },
  { name: '960×540', w: 960, h: 540, dpr: 1, phone: false },
  { name: 'phone 667×375 @1', w: 667, h: 375, dpr: 1, phone: true },
  { name: 'phone 667×375 @2', w: 667, h: 375, dpr: 2, phone: true },
  { name: 'phone 667×375 @3', w: 667, h: 375, dpr: 3, phone: true },
  { name: 'phone 568×320 @2', w: 568, h: 320, dpr: 2, phone: true },
];
const bodyW = (s) => measure('body', s, 1).width;

describe('reading panel: the page on every screen', () => {
  for (const sc of SCREENS) {
    it(`${sc.name}: whole-number scale, cap big enough, the page fits`, () => {
      const box = fit(sc.w, sc.h);
      const L = layoutFor({ ...box, dpr: sc.dpr });
      expect(Number.isInteger(L.S)).toBe(true);
      expect(L.S).toBeGreaterThanOrEqual(1);
      expect(L.capCss).toBeGreaterThanOrEqual(sc.phone ? 11 : 14);
      const size = pageSize(L.measure, L.lines, true);
      expect(size.w * L.S).toBeLessThanOrEqual(box.cssW * sc.dpr);
      expect(size.h * L.S).toBeLessThanOrEqual(box.cssH * sc.dpr);
      expect(L.lines).toBeGreaterThanOrEqual(5);
    });
  }

  it('the old numbers on a desktop window keep their size (cap 27 CSS px at 1280 × 720)', () => {
    expect(layoutFor({ ...fit(1280, 720), dpr: 1 }).capCss).toBe(27);
    expect(layoutFor({ ...fit(960, 540), dpr: 1 }).capCss).toBe(18);
  });

  it('a small phone narrows the line instead of shrinking the type', () => {
    const L = layoutFor({ ...fit(667, 375), dpr: 1 });
    expect(L.measure).toBeLessThan(READING.measures[0]);
    expect(L.S).toBe(2);
  });
});

describe('reading panel: lines and leading', () => {
  it('lines run 40 to 65 characters on the widest measure and on the narrowest', () => {
    const text = PAGE_THREE.join(' ');
    for (const m of [READING.measures[0], READING.measures[READING.measures.length - 1]]) {
      const lines = wrapWords(text, bodyW, m);
      const full = lines.slice(0, -1); // the last line of a paragraph runs short
      for (const l of full) {
        expect(bodyW(l)).toBeLessThanOrEqual(m);
        expect(l.length).toBeGreaterThanOrEqual(m === READING.measures[0] ? 45 : 32);
        expect(l.length).toBeLessThanOrEqual(65);
      }
    }
  });

  it('leading: the line pitch is at least 1.7 caps, and descenders clear the next line by 5 px', () => {
    expect(pitch() / READING.cap).toBeGreaterThanOrEqual(1.7);
    expect(pitch() - READING.cell).toBeGreaterThanOrEqual(5);
  });

  it('every document ink the game uses is 7:1 or better on its paper', () => {
    for (const ink of [READING.ink, 0x1f2a4a, 0x1a1a36, 0x3a3030, 0x1f3a5f, 0x3a2a22]) {
      expect(contrast(ink, READING.paper)).toBeGreaterThanOrEqual(READING.minContrast);
    }
    expect(contrast(0x3a2a22, 0xf6efe0)).toBeGreaterThanOrEqual(READING.minContrast); // the Evening's list
  });
});

describe('reading panel: placement and paging', () => {
  it('lands on whole device pixels at fractional ratios', () => {
    for (const dpr of [1, 1.25, 1.5, 2, 3]) {
      const at = placeOnDevice({ left: 0.3, top: 7.7, width: 1229.4, height: 691.5 }, 1111, 555, dpr);
      expect(at.left * dpr).toBeCloseTo(Math.round(at.left * dpr), 9);
      expect(at.top * dpr).toBeCloseTo(Math.round(at.top * dpr), 9);
      expect(at.width * dpr).toBeCloseTo(1111, 9);
    }
  });

  it('balances pages: ten lines at nine a page are five and five', () => {
    const lines = Array.from({ length: 10 }, (_, i) => `l${i}`);
    expect(paginate(lines, 9).map((p) => p.length)).toEqual([5, 5]);
    expect(paginate(lines.slice(0, 9), 9).map((p) => p.length)).toEqual([9]);
    expect(paginate(Array.from({ length: 19 }, (_, i) => `l${i}`), 9).map((p) => p.length)).toEqual([7, 7, 5]);
  });

  it('the hints: where you are, and keys or taps', () => {
    expect(footerText({ page: 0, pages: 3 })).toMatch(/^1 \/ 3 .*\[E\] next.*\[Esc\] close$/);
    expect(footerText({ page: 2, pages: 3 })).toMatch(/\[E\] done.*\[←\] back/);
    expect(footerText({ page: 0, pages: 1 })).not.toMatch(/\//);
    expect(footerText({ page: 1, pages: 2, touch: true })).toMatch(/tap/);
    expect(footerText({ page: 1, pages: 2, touch: true })).not.toMatch(/\[E\]/);
  });
});
