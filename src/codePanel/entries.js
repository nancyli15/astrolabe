// Builds one "log entry" for the code panel: a module's action description
// (see its actions.js) joined with the real source snippet that action points at.
import { getRegion } from './regions.js';

let nextEntryId = 0;

export function makeEntry(actions, name, details = []) {
  const action = actions[name];
  return {
    id: nextEntryId++,
    time: new Date().toISOString(),
    status: action.status,
    details,
    note: action.note,
    region: getRegion(...action.region),
  };
}
