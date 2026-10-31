// Objectives as data (plan §2.7): each room declares `objective`, either a
// string or a list [{ text, flag?, unless? }]. The last entry whose `flag` is
// set (and whose `unless` is not) wins; the first entry is unconditional.
// Pure, so the lint and the unit tests use it too.
export function roomObjective(room, flags = {}) {
  const o = room && room.objective;
  if (o === undefined || o === null) return null;
  if (typeof o === 'string') return o;
  let out = null;
  for (const e of o) {
    const entry = typeof e === 'string' ? { text: e } : e;
    if (entry.flag && !flags[entry.flag]) continue;
    if (entry.unless && flags[entry.unless]) continue;
    out = entry.text;
  }
  return out;
}
