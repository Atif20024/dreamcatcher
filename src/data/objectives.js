// Attach per-room objectives and per-gate hints (plan §2.7) to a dream's room
// list. Each rooms.js keeps its OBJECTIVES / GATE_HINTS tables beside the rooms
// they describe; the lint fails on a room with no objective or a
// requirement-bearing gate with no hint.
export function withObjectives(rooms, objectives = {}, hints = {}) {
  for (const r of rooms) {
    if (objectives[r.id] !== undefined && r.objective === undefined) r.objective = objectives[r.id];
    for (const o of r.objects || []) if (o.type === 'gate' && hints[o.id] && !o.hint) o.hint = hints[o.id];
  }
  return rooms;
}
