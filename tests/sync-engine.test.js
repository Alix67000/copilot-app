import {test} from 'node:test';import assert from 'node:assert/strict';import {webcrypto} from 'node:crypto';
import {prepareSync,buildLocalChanges} from '../src/lib/sync-engine.js';import {documentId} from '../src/lib/sync-store.js';
const raw=n=>({'pilotage.notes.v1':JSON.stringify(n),'pilotage.tasks.v1':'[]','pilotage.deadlines.v1':'[]','pilotage.imported.v1':'[]'});
const note=(id,text)=>({id,text,updatedAt:1});
async function server(n,rev=1,deleted=false){return {collection:'notes',id:await documentId(n.id,webcrypto),schemaVersion:1,revision:rev,deleted,data:deleted?{}:n}}
test('migration depuis chaque appareil sans écraser les documents existants',async()=>{
 const a=note('a','a'),b=note('b','b'),r=await server(b);const plan=await prepareSync(raw([a]),[r],{},webcrypto);
 assert.equal(plan.writes.length,1);assert.deepEqual(plan.writes[0].data,a);assert.equal(plan.conflicts.length,0);
 assert.equal(JSON.parse(buildLocalChanges(plan.merged,raw([a]))['pilotage.notes.v1']).length,2);
});
test('conflit et suppression ne font aucune écriture aveugle',async()=>{
 const old=note('a','ancien'),l=note('a','local'),r=await server(note('a','distant'),2);const key=`notes/${r.id}`;
 const plan=await prepareSync(raw([l]),[r],{[key]:{data:old}},webcrypto);assert.equal(plan.conflicts.length,1);assert.equal(plan.writes.length,0);
 const tomb=await server(old,3,true),p=await prepareSync(raw([old]),[tomb],{},webcrypto);assert.equal(p.conflicts.length,1);
 const p2=await prepareSync(raw([]),[await server(old)],{[key]:{data:old}},webcrypto);assert.equal(p2.writes[0].deleted,true);
});
test('schéma inconnu et données locales illisibles empêchent toute opération',async()=>{
 const r=await server(note('a','x'));r.schemaVersion=2;await assert.rejects(prepareSync(raw([]),[r],{},webcrypto));
 const p=await prepareSync({'pilotage.notes.v1':'{'},[],{},webcrypto);assert.ok(p.errors['pilotage.notes.v1']);assert.deepEqual(p.writes,[]);
});
test('résolution explicite : garder la version locale ou distante',async()=>{
 const old=note('a','ancien'),l=note('a','local'),r=await server(note('a','distant'),2),key=`notes/${r.id}`;
 let p=await prepareSync(raw([l]),[r],{[key]:{data:r.data}},webcrypto);assert.equal(p.conflicts.length,0);assert.deepEqual(p.writes[0].data,l);assert.equal(p.writes[0].expectedRevision,2);
 p=await prepareSync(raw([l]),[r],{[key]:{data:l}},webcrypto);assert.equal(p.conflicts.length,0);assert.equal(p.writes.length,0);assert.equal(p.merged[0].data.text,'distant');
});
