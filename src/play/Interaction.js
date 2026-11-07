// Interaction (plan 2.6): one prompt at a time. Interactables register a
// point, a radius and what [E] does; the nearest one in reach (and on Jo's
// floor) wins and shows its prompt above it, labelled for the device in use.
// Nothing happens by proximity alone: only the act1 press calls onUse.
//
//   const off = interaction.register({ id, x, y, radius, prompt: 'talk', onUse, enabled })
import { hud } from '../ui/hud.js';

export class Interaction {
  constructor(scene, { input, player } = {}) {
    this.scene = scene;
    this.input = input;
    this.player = player;
    this.items = new Map();
    this.current = null;
    this.prompt = hud.prompt();
    this.uses = 0;
  }

  register(item) {
    const it = { radius: 56, dy: 90, prompt: 'use', ...item };
    this.items.set(it.id, it);
    return { destroy: () => this.items.delete(it.id), item: it };
  }

  nearest() {
    const p = this.player;
    let best = null;
    let bd = Infinity;
    for (const it of this.items.values()) {
      if (it.enabled && !it.enabled()) continue;
      const pos = typeof it.at === 'function' ? it.at() : it;
      const dx = Math.abs(pos.x - p.x);
      const dy = Math.abs(pos.y - (p.y + 22));
      if (dx > it.radius || dy > it.dy) continue;
      if (dx < bd) {
        bd = dx;
        best = it;
      }
    }
    return best;
  }

  update(active = true) {
    const it = active ? this.nearest() : null;
    this.current = it;
    if (!it) {
      if (this.prompt.visible) this.prompt.setVisible(false);
      return null;
    }
    const pos = typeof it.at === 'function' ? it.at() : it;
    // world coords: the HUD pins the prompt over its world point at zoom 1
    const sx = pos.x;
    const sy = pos.y - (it.promptDy ?? 96);
    this.prompt.setText(`[${this.input ? this.input.label('act1') : 'E'}] ${it.prompt}`).setPosition(Math.round(sx), Math.round(sy)).setVisible(true);
    if (this.input && this.input.justDown('act1')) {
      this.uses += 1;
      it.onUse(it);
    }
    return it;
  }

  hide() {
    this.prompt.setVisible(false);
  }
}

export default Interaction;
