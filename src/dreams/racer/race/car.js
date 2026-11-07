// The car on the day: the base tune, the track's own overrides (track.tune: rain
// and the like, when a race needs them), then what the garage has fitted. Nuts buy
// tyres and chalk, never speed: nothing here may touch vMax, accel or a brake.
import { TUNE } from '../../../engines/race.js';

// the soft set stays nearer new as it wears: the same tyre on new, a fairer floor when bald
export const SOFT_TYRES = Object.freeze({ gripMin: 0.85 });

// Sable's clause, if it stood: thin oil. Tuned, she still runs hot, later and less than beating
export const SABLE_OIL = Object.freeze({ hotAfter: 0.85, hotTop: 0.98 });

export function carTune(track, F = {}) {
  const oil = F.tuned && F.oil_sable ? SABLE_OIL : null;
  return { ...TUNE, ...(track.tune || {}), ...(F.tyre_soft ? SOFT_TYRES : null), ...oil, chalk: !!F.buy_chalk, untuned: !F.tuned || !!oil };
}
