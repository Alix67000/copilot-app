import {recordsEqual} from './sync-records.js';
import { documentId, validRecordInput } from './sync-store.js';
import { cityIsValid } from '../widgets/weather.js';

const definitions = [
  ['pilotage.notes.v1','notes'], ['pilotage.tasks.v1','tasks'],
  ['pilotage.deadlines.v1','deadlines'], ['pilotage.imported.v1','imports'],
  ['pilotage.widgets.v1','settings'], ['pilotage.weather.city.v1','settings']
];
function validItem(collection,item){
 if(collection==='imports') return typeof item==='string' && !!item && item.length<=1024;
 if(!item || typeof item!=='object' || Array.isArray(item) || typeof item.id!=='string' || !item.id || item.id.length>1024) return false;
 if(collection==='notes') return typeof item.text==='string' && item.text.trim().length>0 && item.text.length<=2000 && Number.isFinite(item.updatedAt) && Number.isFinite(new Date(item.updatedAt).getTime());
 if(collection==='tasks') return typeof item.title==='string' && item.title.length>0 && item.title.length<=150 && typeof item.done==='boolean';
 if(collection==='deadlines') return typeof item.title==='string' && item.title.length>0 && item.title.length<=150 && typeof item.date==='string' && /^\d{4}-\d{2}-\d{2}$/.test(item.date);
 return false;
}
// Pure dry-run: no writes, and every category error is reported rather than
// overwriting or silently omitting its local input. Keep raw input for backup.
export async function planLegacyImport(raw, crypt=globalThis.crypto) {
 const batches={},errors={};
 for(const [key,collection] of definitions){
  const value=raw[key];
  if(value === null || value === undefined) {batches[key]=[];continue}
  try {
   if(typeof value!=='string') throw Error('invalid-storage');
   const parsed=JSON.parse(value);let records=[];
   if(collection==='settings') {
    if(key==='pilotage.weather.city.v1' && parsed!==null && !cityIsValid(parsed)) throw Error('invalid-city');
    if(key==='pilotage.widgets.v1' && (!parsed || typeof parsed!=='object' || Array.isArray(parsed))) throw Error('invalid-settings');
    // Null city means nothing to import; do not erase a remote setting.
    if(parsed!==null){const name=key==='pilotage.widgets.v1'?'widgets':'weather';records=[{id:await documentId(name,crypt),data:{name,value:parsed}}]}
   } else {
    if(!Array.isArray(parsed)) throw Error('not-an-array');
    const seen=new Set();
    for(const item of parsed){
     if(!validItem(collection,item)) throw Error('invalid-item');
     const rawId=collection==='imports'?item:item.id;
     if(seen.has(rawId)) throw Error('duplicate-id');seen.add(rawId);
     const data=collection==='imports'?{sourceId:item}:item;
     records.push({id:await documentId(rawId,crypt),data});
    }
   }
   if(records.some(r=>!validRecordInput(collection,r.data,false))) throw Error('record-too-large');
   batches[key]=records.map(r=>({...r,collection}));
  } catch(e){errors[key]=e.message || 'invalid-data';}
 }
 return {batches,errors};
}

// Import only explicitly planned documents. Never updates an existing remote
// document: identical documents are idempotent skips, all others are conflicts.
// Failure stops the job; retrying the same plan safely resumes from the start.
export async function executeLegacyImport(plan, write) {
 const summary={created:[],alreadyPresent:[],conflicts:[],errors:{...plan.errors},interrupted:null};
 for(const [key,records] of Object.entries(plan.batches)) {
  for(const record of records){
   try {
    await write(record,{expectedRevision:null,data:record.data,deleted:false});
    summary.created.push({key,id:record.id});
   } catch(e){
    if(e?.message==='sync-conflict' && e.remote) {
     const r=e.remote;
     if(r.schemaVersion===1 && r.deleted===false && recordsEqual(record.data,r.data)) summary.alreadyPresent.push({key,id:record.id});
     else summary.conflicts.push({key,id:record.id,local:record.data,remote:r});
    } else {
     summary.interrupted={key,id:record.id,error:e?.message||'write-failed'};
     return summary;
    }
   }
  }
 }
 return summary;
}
