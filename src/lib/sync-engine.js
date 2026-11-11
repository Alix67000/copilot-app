import {planLegacyImport} from './sync-migration.js';
import {recordsEqual,reconcileRecord,canEditSchema} from './sync-records.js';
import {COLLECTIONS} from './sync-store.js';

const collectionsToKey={notes:'pilotage.notes.v1',links:'pilotage.links.v1',tasks:'pilotage.tasks.v1',deadlines:'pilotage.deadlines.v1',imports:'pilotage.imported.v1'};
function recordKey(r){return `${r.collection}/${r.id}`}
function validateRemote(r) {
 if(!COLLECTIONS.includes(r.collection) || !/^i_[a-f0-9]{64}$/.test(r.id) || !canEditSchema(r.schemaVersion) || !Number.isSafeInteger(r.revision) || r.revision<1 || typeof r.deleted!=='boolean' || !r.data || typeof r.data!=='object' || Array.isArray(r.data)) throw Error('invalid-remote-record');
}
// Dry run: record-level three-way reconciliation, no mutations or IO beyond hashing.
export async function prepareSync(raw,remoteRecords,baseline={},crypt=globalThis.crypto){
 const legacy=await planLegacyImport(raw,crypt);
 if(Object.keys(legacy.errors).length) return {errors:legacy.errors,conflicts:[],writes:[],merged:[]};
 const local=new Map(),remote=new Map();
 for(const batch of Object.values(legacy.batches))for(const item of batch)local.set(recordKey(item),item);
 for(const record of remoteRecords){validateRemote(record);const k=recordKey(record);if(remote.has(k))throw Error('duplicate-remote');remote.set(k,record)}
 const keys=new Set([...local.keys(),...remote.keys(),...Object.keys(baseline)]),merged=[],writes=[],conflicts=[];
 for(const k of keys){
  const l=local.get(k),r=remote.get(k),base=baseline[k];
  if(base!==undefined && (!base || typeof base!=='object' || !('data' in base))) throw Error('invalid-baseline');
  const localValue=l?.data ?? null,remoteValue=r&&!r.deleted?r.data:null,baseValue=base?.data??null;
  // No common history plus a deletion is ambiguous: never resurrect silently.
  let result=base===undefined && r?.deleted && l ? {status:'conflict'} : reconcileRecord(baseValue,localValue,remoteValue);
  if(result.status==='conflict') {conflicts.push({key:k,local:localValue,remote:remoteValue,base:baseValue});continue}
  const value=result.value, collection=l?.collection||r?.collection||k.split('/')[0],id=l?.id||r?.id||k.split('/')[1];
  if(!COLLECTIONS.includes(collection)||!/^i_[a-f0-9]{64}$/.test(id))throw Error('invalid-baseline');
  if(!recordsEqual(value,remoteValue))writes.push({collection,id,expectedRevision:r?.revision??null,data:value??{},deleted:value===null});
  if(value!==null)merged.push({collection,id,data:value});
 }
 return {errors:{},conflicts,writes,merged};
}
// Prepare localStorage replacements; never writes them. Reject bad server data.
export function buildLocalChanges(merged,raw){
 const result={}, groups={notes:[],links:[],tasks:[],deadlines:[],imports:[]};
 for(const r of merged){
  if(r.collection==='settings') {
   if(r.data?.name==='widgets')result['pilotage.widgets.v1']=JSON.stringify(r.data.value);
   else if(r.data?.name==='weather')result['pilotage.weather.city.v1']=JSON.stringify(r.data.value);
   else throw Error('unknown-remote-setting');
  } else if(r.collection==='imports') {
   if(typeof r.data?.sourceId!=='string'||!r.data.sourceId)throw Error('invalid-remote-import');groups.imports.push(r.data.sourceId);
  } else if(groups[r.collection])groups[r.collection].push(r.data);
  else throw Error('invalid-remote-collection');
 }
 for(const [c,key] of Object.entries(collectionsToKey))result[key]=JSON.stringify(groups[c]);
 // Preserve absent settings as absent unless they were explicitly deleted.
 for(const key of ['pilotage.widgets.v1','pilotage.weather.city.v1'])if(!(key in result) && raw[key]!=null)result[key]=null;
 return result;
}

export async function validateMerged(merged,changes,crypt=globalThis.crypto) {
 const plan=await planLegacyImport(changes,crypt);
 if(Object.keys(plan.errors).length) throw Error('invalid-remote-data');
 const reconstructed=new Map(Object.values(plan.batches).flat().map(r=>[recordKey(r),r]));
 if(reconstructed.size!==merged.length)throw Error('invalid-remote-data');
 for(const r of merged){const match=reconstructed.get(recordKey(r));if(!match || !recordsEqual(match.data,r.data))throw Error('invalid-remote-data')}
}
