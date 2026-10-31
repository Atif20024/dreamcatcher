// The HUD keeps its on-screen size when the world camera zooms (F#7 / B3).
// Phase 1.2: the HUD and every screen-space object at a UI depth live on
// UIScene, whose camera is never zoomed.
export default {
  id: 'hud-scale-zoom',
  expect: 'pass',
  async run(dc) {
    dc.warp('chef', '');
    dc.step(40);
    const sc = dc.scene();
    const ui = window.game.scene.getScene('UI');
    if (!sc || !ui) return { pass: false, detail: 'no gameplay scene or no UIScene' };
    // a screen-space object made the old way, by gameplay code
    const probe = sc.add.rectangle(100, 100, 40, 20, 0xffffff).setScrollFactor(0).setDepth(150);
    dc.step(2);
    const heart = ui.hudGrid.hearts[0];
    const level = ui.hudGrid.texts.level;
    if (!heart) return { pass: false, detail: 'no HUD heart drawn' };
    const size = (o) => {
      const cam = o.displayList === ui.sys.displayList ? ui.cameras.main : sc.cameras.main;
      return [Math.round(o.displayWidth * cam.zoom * 100) / 100, Math.round((o.height || o.displayHeight) * cam.zoom * 100) / 100];
    };
    const before = [size(heart), size(level), size(probe)];
    const cam = sc.cameras.main;
    const z0 = cam.zoom;
    cam.setZoom(0.62);
    dc.step(3);
    const after = [size(heart), size(level), size(probe)];
    cam.setZoom(z0);
    dc.step(1);
    const onUI = probe.displayList === ui.sys.displayList;
    probe.destroy();
    const same = JSON.stringify(before) === JSON.stringify(after);
    return {
      pass: same && onUI && ui.cameras.main.zoom === 1,
      detail: `heart/level/probe on-screen size at zoom ${z0}: ${JSON.stringify(before)}, at 0.62: ${JSON.stringify(after)}; probe adopted by UIScene: ${onUI}; UI camera zoom ${ui.cameras.main.zoom}`,
    };
  },
};
