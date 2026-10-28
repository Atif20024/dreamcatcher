// Framework dreams (plan 4.1): DreamDefinitions played by DreamScene.
// Phase 3: only the proof dream; Part B adds the Musician here.
import proof from './_proof/dream.js';

export const FRAMEWORK_DREAMS = { proof };

export function frameworkDream(id) {
  return FRAMEWORK_DREAMS[id] || null;
}
