export const BACKUP_KEYS = Object.freeze([
 'pilotage.notes.v1','pilotage.links.v1','pilotage.tasks.v1','pilotage.deadlines.v1',
 'pilotage.imported.v1','pilotage.widgets.v1','pilotage.weather.city.v1'
]);
// Preserve the original raw contents, including data a newer app cannot parse.
// Never include sessionStorage, mail, auth tokens, or unrelated site storage.
export function createLocalBackup(storage, now = new Date()) {
 if (!Number.isFinite(now.getTime())) throw Error('invalid-date');
 const entries={};
 for(const key of BACKUP_KEYS) entries[key]=storage.getItem(key);
 return {format:'pilotage-local-backup',version:1,createdAt:now.toISOString(),entries};
}
