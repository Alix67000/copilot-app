import {BACKUP_KEYS} from './sync-backup.js';
import {prepareSync,buildLocalChanges,validateMerged} from './sync-engine.js';
const PREFIX='pilotage.sync.';
export function snapshotLocal(storage){return Object.fromEntries(BACKUP_KEYS.map(k=>[k,storage.getItem(k)]))}
function equalRaw(a,b){return BACKUP_KEYS.every(k=>a[k]===b[k])}
// Writes are conditional at the server. A durable journal records local state
// before applying a multi-key update, so an interrupted apply is never hidden.
export async function syncCycle({storage,uid,remote,write,crypt=globalThis.crypto,onApplied=()=>{},isActive=()=>true}){
 const journalKey=PREFIX+'journal.v1.'+uid,baseKey=PREFIX+'base.v1.'+uid;
 if(storage.getItem(journalKey)!==null)return {status:'recovery-required'};
 const raw=snapshotLocal(storage);let baseline={};
 const encoded=storage.getItem(baseKey);if(encoded!==null){try{baseline=JSON.parse(encoded);if(!baseline||typeof baseline!=='object'||Array.isArray(baseline))throw Error()}catch{return {status:'invalid-baseline'}}}
 const plan=await prepareSync(raw,remote,baseline,crypt);
 if(Object.keys(plan.errors).length)return {status:'invalid-local',errors:plan.errors};
 if(plan.conflicts.length)return {status:'conflict',conflicts:plan.conflicts};
 const changes=buildLocalChanges(plan.merged,raw);await validateMerged(plan.merged,changes,crypt);
 for(const record of plan.writes) {if(!isActive())throw Error('sync-cancelled');await write(record)}
 if(!isActive())throw Error('sync-cancelled');
 if(!equalRaw(raw,snapshotLocal(storage)))return {status:'local-changed'};
 const nextBase={};
 for(const item of plan.merged) nextBase[item.collection+'/'+item.id]={data:item.data};
 for(const item of remote)if(item.deleted && !nextBase[item.collection+'/'+item.id])nextBase[item.collection+'/'+item.id]={data:null};
 for(const item of plan.writes)if(item.deleted)nextBase[item.collection+'/'+item.id]={data:null};
 const journal=JSON.stringify({version:1,before:raw,after:changes,baselineBefore:encoded});
 storage.setItem(journalKey,journal);
 try {
  let changed=false;
  for(const [key,value] of Object.entries(changes)){if(value!==raw[key]){if(value===null)storage.removeItem(key);else storage.setItem(key,value);changed=true}}
  storage.setItem(baseKey,JSON.stringify(nextBase));
  storage.removeItem(journalKey);
  if(changed){try{onApplied()}catch{ return {status:'refresh-required'} }}
  return {status:'synced',written:plan.writes.length};
 }catch(error){return {status:'recovery-required',error:error?.message||'local-write-failed'}}
}
