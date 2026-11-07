// Unified dev warp: ?warp=<dream>:<place> maps onto the existing per-scene
// devWarp params (?at= ?wr= ?ev=). The old params keep working.
// Pure function so it unit-tests in Node.

export const DREAM_WARP = {
  hub: { scene: 'Hub', param: null },
  chef: { scene: 'Dream', param: null, framework: true },
  musician: { scene: 'Dream', param: null, framework: true },
  astronaut: { scene: 'Astronaut', param: 'at', fallback: 'gym' },
  writer: { scene: 'Writer', param: 'wr', fallback: 'attic' },
  painter: { scene: 'Dream', param: null, framework: true },
  gambler: { scene: 'Dream', param: null, framework: true },
  racer: { scene: 'Dream', param: null, framework: true },
  evening: { scene: 'Evening', param: 'ev', fallback: 'arch' },
  // framework dreams (DreamScene reads ?warp= itself: dream:room[:spawn])
  clockmaker: { scene: 'Dream', param: null, framework: true },
  proof: { scene: 'Dream', param: null, framework: true }, // alias: THE STOPPED HOUR's old id
};

// returns { dream, place, scene, legacy: {param: value} } or null
export function resolveWarp(search) {
  const sp = new URLSearchParams(search);
  const w = sp.get('warp');
  if (!w) return null;
  const [dream, place] = w.split(':');
  const d = DREAM_WARP[dream];
  if (!d) return null;
  const legacy = {};
  if (d.param && !sp.get(d.param)) legacy[d.param] = place || d.fallback;
  return { dream, place: place || null, scene: d.scene, legacy };
}

// which scene should boot first, honouring the legacy params too
export function firstSceneKey(search) {
  const w = resolveWarp(search);
  if (w) return w.scene; // ?warp=hub too: a dev warp never shows the title
  const sp = new URLSearchParams(search);
  if (sp.get('wr')) return 'Writer';
  if (sp.get('ev')) return 'Evening';
  if (sp.get('at')) return 'Astronaut';
  // the scenario runner and ?notitle start at the station like a warp
  if (sp.has('scenarios') || sp.has('notitle')) return 'Hub';
  return null;
}

// Scenes read window.location.search directly, so the unified param is
// rewritten into the legacy one in place (history.replaceState, no reload).
export function applyWarpToLocation() {
  const w = resolveWarp(window.location.search);
  if (!w) return;
  const url = new URL(window.location.href);
  for (const [k, v] of Object.entries(w.legacy)) url.searchParams.set(k, v);
  window.history.replaceState(null, '', url);
}
