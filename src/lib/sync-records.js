// Pure helpers for a versioned per-record sync model. No network or storage.
export const SYNC_SCHEMA_VERSION = 1;

function stable(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(stable).join(',') + ']';
  return '{' + Object.keys(value).sort().map(k => JSON.stringify(k)+':'+stable(value[k])).join(',') + '}';
}
export function recordsEqual(a,b) { return stable(a) === stable(b); }
const same=recordsEqual;
// null is an absent record, distinct from a record marked deleted.
export function reconcileRecord(base, local, remote) {
  if (same(local,remote)) return {status:'merged',value:local};
  if (same(local,base)) return {status:'merged',value:remote};
  if (same(remote,base)) return {status:'merged',value:local};
  return {status:'conflict',base,local,remote};
}
export function canEditSchema(version) {
  return Number.isInteger(version) && version === SYNC_SCHEMA_VERSION;
}
