import {test} from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {planLegacyImport} from '../src/lib/sync-migration.js';
test('inventaire sans écriture, documents stables par catégorie',async()=>{
 const raw={'pilotage.notes.v1':JSON.stringify([{id:'n/1',text:'bonjour',updatedAt:100}]),'pilotage.tasks.v1':JSON.stringify([{id:'t',title:'Tâche',done:false,custom:'préserver'}]),'pilotage.widgets.v1':JSON.stringify({visible:{notes:true}})};
 const original=structuredClone(raw), p=await planLegacyImport(raw,webcrypto);
 assert.deepEqual(raw,original);assert.deepEqual(p.errors,{});assert.equal(p.batches['pilotage.tasks.v1'][0].data.custom,'préserver');assert.equal(p.batches['pilotage.notes.v1'][0].collection,'notes');
 assert.deepEqual(p,await planLegacyImport(raw,webcrypto));
});
test('données illisibles ou doublons bloquent uniquement leur catégorie',async()=>{
 const p=await planLegacyImport({'pilotage.notes.v1':'{','pilotage.tasks.v1':JSON.stringify([{id:'x',title:'a',done:false},{id:'x',title:'b',done:false}]),'pilotage.imported.v1':JSON.stringify(['email-id'])},webcrypto);
 assert.ok(p.errors['pilotage.notes.v1']);assert.equal(p.errors['pilotage.tasks.v1'],'duplicate-id');assert.equal(p.batches['pilotage.notes.v1'],undefined);assert.equal(p.batches['pilotage.tasks.v1'],undefined);assert.equal(p.batches['pilotage.imported.v1'].length,1);
});
test('ville absente ne supprime pas la ville distante',async()=>{
 const p=await planLegacyImport({'pilotage.weather.city.v1':'null'},webcrypto);assert.deepEqual(p.batches['pilotage.weather.city.v1'],[]);
});
test('import reprenable : aucune réécriture et conflits conservés',async()=>{
 const {executeLegacyImport}=await import('../src/lib/sync-migration.js');
 const {SyncConflict}=await import('../src/lib/sync-store.js');
 const raw={'pilotage.notes.v1':JSON.stringify([{id:'1',text:'A',updatedAt:1},{id:'2',text:'B',updatedAt:2}])};
 const plan=await planLegacyImport(raw,webcrypto), map=new Map();let fail=true;
 const write=async (r)=>{if(r.data.id==='2' && fail)throw Error('offline');if(map.has(r.id))throw new SyncConflict(map.get(r.id));map.set(r.id,{schemaVersion:1,revision:1,deleted:false,data:r.data})};
 let first=await executeLegacyImport(plan,write);assert.equal(first.created.length,1);assert.equal(first.interrupted.error,'offline');
 fail=false;let second=await executeLegacyImport(plan,write);assert.equal(second.alreadyPresent.length,1);assert.equal(second.created.length,1);assert.equal(second.interrupted,null);
 const id=plan.batches['pilotage.notes.v1'][0].id;map.set(id,{schemaVersion:1,revision:2,deleted:false,data:{id:'1',text:'autre',updatedAt:3}});
 let third=await executeLegacyImport(plan,write);assert.equal(third.conflicts.length,1);assert.equal(map.get(id).data.text,'autre');
});
test('document distant invalide ne doit pas être déclaré identique',async()=>{
 const {executeLegacyImport}=await import('../src/lib/sync-migration.js');const {SyncConflict}=await import('../src/lib/sync-store.js');
 const p=await planLegacyImport({'pilotage.imported.v1':'["x"]'},webcrypto);
 const r=await executeLegacyImport(p,async()=>{throw new SyncConflict({schemaVersion:1,revision:1,deleted:false,data:null})});
 assert.equal(r.conflicts.length,1);assert.equal(r.alreadyPresent.length,0);
});
