import {test} from 'node:test';import assert from 'node:assert/strict';import {webcrypto} from 'node:crypto';
import {syncCycle} from '../src/lib/sync-cycle.js';import {documentId} from '../src/lib/sync-store.js';
import {planLegacyImport} from '../src/lib/sync-migration.js';import {buildLink} from '../src/widgets/links.js';
function store(obj={}){const m=new Map(Object.entries(obj));return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)}}
const key='pilotage.links.v1',item=buildLink('Intranet','https://example.test/','id',1);
test('synchronisation de liens par enregistrement et conflits sans perte',async()=>{
 const a=store({[key]:JSON.stringify([item])}),b=store(),remote=[];
 const write=async r=>{let i=remote.findIndex(x=>x.collection===r.collection&&x.id===r.id);const next={collection:r.collection,id:r.id,schemaVersion:1,revision:(r.expectedRevision||0)+1,deleted:r.deleted,data:r.data};if(i<0)remote.push(next);else remote[i]=next};
 const run=s=>syncCycle({storage:s,uid:'owner',remote,write,crypt:webcrypto});
 assert.equal((await run(a)).status,'synced');assert.equal((await run(b)).status,'synced');assert.deepEqual(JSON.parse(b.getItem(key)),[item]);
 b.setItem(key,JSON.stringify([{...item,title:'Lien B',updatedAt:2}]));assert.equal((await run(b)).status,'synced');assert.equal((await run(a)).status,'synced');assert.equal(JSON.parse(a.getItem(key))[0].title,'Lien B');
 a.setItem(key,JSON.stringify([{...item,title:'Conflit A',updatedAt:3}]));b.setItem(key,JSON.stringify([{...item,title:'Conflit B',updatedAt:4}]));assert.equal((await run(a)).status,'synced');assert.equal((await run(b)).status,'conflict');assert.equal(JSON.parse(b.getItem(key))[0].title,'Conflit B');
 b.setItem(key,JSON.stringify([{...item,title:'Conflit A',updatedAt:3}]));assert.equal((await run(b)).status,'synced');a.setItem(key,'[]');assert.equal((await run(a)).status,'synced');assert.equal((await run(b)).status,'synced');assert.deepEqual(JSON.parse(b.getItem(key)),[]);assert(remote.find(x=>x.collection==='links').deleted);
});
test('liens illisibles ou dangereux suspendent la synchronisation',async()=>{
 let r=await planLegacyImport({[key]:JSON.stringify([{...item,url:'javascript:alert(1)'}])},webcrypto);assert(r.errors[key]);
 r=await planLegacyImport({[key]:JSON.stringify(Array.from({length:201},(_,i)=>({...item,id:String(i)})))},webcrypto);assert.equal(r.errors[key],'too-many-links');
 const id=await documentId(item.id,webcrypto),s=store();await assert.rejects(syncCycle({storage:s,uid:'u',remote:[{collection:'links',id,schemaVersion:1,revision:1,deleted:false,data:{...item,url:'javascript:alert(1)'}}],write:async()=>{},crypt:webcrypto}));assert.equal(s.getItem(key),null);
});
