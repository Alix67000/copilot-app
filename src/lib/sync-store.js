import { doc, runTransaction } from 'firebase/firestore';
import { SYNC_SCHEMA_VERSION } from './sync-records.js';

export const COLLECTIONS = Object.freeze(['notes','links','tasks','deadlines','imports','settings']);
const MAX_DATA_BYTES=64*1024;
const encoder = new TextEncoder();

// IDs from external sources can contain slashes or be too long for Firestore.
// Hashing also avoids revealing external message IDs in Firestore paths.
export async function documentId(id, crypt = globalThis.crypto) {
  if(typeof id !== 'string' || !id.length || encoder.encode(id).length > 4096) throw new Error('invalid-id');
  const digest = await crypt.subtle.digest('SHA-256',encoder.encode(id));
  return 'i_' + Array.from(new Uint8Array(digest), x=>x.toString(16).padStart(2,'0')).join('');
}
export function validRecordInput(collection, data, deleted) {
  if (!COLLECTIONS.includes(collection) || typeof deleted !== 'boolean') return false;
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  if (deleted && Object.keys(data).length) return false;
  try { return encoder.encode(JSON.stringify(data)).length <= MAX_DATA_BYTES; } catch { return false; }
}
export class SyncConflict extends Error {constructor(remote){super('sync-conflict');this.remote=remote}}
export class UnsupportedSchema extends Error {constructor(){super('unsupported-schema')}}

// run() must execute the callback atomically; read and write are transaction methods.
// expectedRevision=null means the record must not exist. Offline transactions fail
// rather than falsely reporting a successful sync.
export async function compareAndWrite(run, ref, {collection,expectedRevision,data,deleted=false}) {
  if (!validRecordInput(collection,data,deleted) || !(expectedRevision === null || (Number.isSafeInteger(expectedRevision) && expectedRevision >= 1))) throw new Error('invalid-record');
  return run(async tx => {
    const snap = await tx.get(ref);
    const previous = snap.exists() ? snap.data() : null;
    if(previous && previous.schemaVersion !== SYNC_SCHEMA_VERSION) throw new UnsupportedSchema();
    if(previous && (!Number.isSafeInteger(previous.revision) || previous.revision < 1)) throw new Error('invalid-remote-record');
    if((previous?.revision ?? null) !== expectedRevision) throw new SyncConflict(previous);
    const next={schemaVersion:SYNC_SCHEMA_VERSION,revision:(previous?.revision ?? 0)+1,deleted,data};
    tx.set(ref,next);
    return next;
  });
}
export function firestoreWrite(db,uid,collection,id,options) {
  if(typeof uid !== 'string' || !uid || uid.includes('/') || !COLLECTIONS.includes(collection) || !/^i_[0-9a-f]{64}$/.test(id)) throw new Error('invalid-path');
  const ref=doc(db,'pilotage_users',uid,collection,id);
  return compareAndWrite(fn=>runTransaction(db,fn),ref,{...options,collection});
}
