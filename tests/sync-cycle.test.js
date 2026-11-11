import {test} from 'node:test';import assert from 'node:assert/strict';import {webcrypto} from 'node:crypto';import {syncCycle} from '../src/lib/sync-cycle.js';import {documentId} from '../src/lib/sync-store.js';
function store(obj={}){const m=new Map(Object.entries(obj));return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),m}}
const n={id:'x',text:'Test',updatedAt:1};const local={'pilotage.notes.v1':JSON.stringify([n])};
test('synchronisation crée une note puis devient idempotente',async()=>{
 const s=store(local),remote=[];let writes=0;
 const write=async r=>{writes++;remote.push({collection:r.collection,id:r.id,schemaVersion:1,revision:1,deleted:r.deleted,data:r.data})};
 assert.equal((await syncCycle({storage:s,uid:'u',remote,write,crypt:webcrypto})).status,'synced');assert.equal(writes,1);
 assert.equal((await syncCycle({storage:s,uid:'u',remote,write,crypt:webcrypto})).status,'synced');assert.equal(writes,1);
});
test('modification locale pendant la synchronisation conservée',async()=>{
 const s=store(local);const write=async()=>s.setItem('pilotage.notes.v1',JSON.stringify([{...n,text:'nouveau'}]));
 const r=await syncCycle({storage:s,uid:'u',remote:[],write,crypt:webcrypto});assert.equal(r.status,'local-changed');assert.match(s.getItem('pilotage.notes.v1'),/nouveau/);assert.equal(s.getItem('pilotage.sync.base.v1.u'),null);
});
test('reprise après interruption signale le journal sans rien écraser',async()=>{
 const s=store({...local,'pilotage.sync.journal.v1.u':'{}'});let called=false;
 const r=await syncCycle({storage:s,uid:'u',remote:[],write:async()=>{called=true},crypt:webcrypto});assert.equal(r.status,'recovery-required');assert.equal(called,false);assert.equal(s.getItem('pilotage.notes.v1'),local['pilotage.notes.v1']);
});
test('erreur stockage pendant application garde journal de récupération',async()=>{
 const s=store();let fail=true;const orig=s.setItem;s.setItem=(k,v)=>{if(k==='pilotage.notes.v1' && fail){fail=false;throw Error('quota')}orig(k,v)};
 const id=await documentId('x',webcrypto);const remote=[{collection:'notes',id,schemaVersion:1,revision:1,deleted:false,data:n}];
 const r=await syncCycle({storage:s,uid:'u',remote,write:async()=>{},crypt:webcrypto});assert.equal(r.status,'recovery-required');assert.ok(s.getItem('pilotage.sync.journal.v1.u'));
});
