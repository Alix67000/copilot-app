import {test} from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {compareAndWrite,documentId,SyncConflict,UnsupportedSchema,validRecordInput} from '../src/lib/sync-store.js';
function mock(initial=null){let data=initial;return {run:async fn=>fn({get:async()=>({exists:()=>data!==null,data:()=>structuredClone(data)}),set:(_,v)=>{data=structuredClone(v)}}),get:()=>data}}
test('identifiants stables et utilisables dans Firestore',async()=>{
 const a=await documentId('message/à-tester',webcrypto);assert.match(a,/^i_[a-f0-9]{64}$/);assert.equal(a,await documentId('message/à-tester',webcrypto));assert.notEqual(a,await documentId('autre',webcrypto));await assert.rejects(documentId('',webcrypto));
});
test('écritures et suppressions versionnées : conflit sans écrasement',async()=>{
 const m=mock();const p={collection:'notes',expectedRevision:null,data:{text:'a'}};
 assert.equal((await compareAndWrite(m.run,'x',p)).revision,1);
 await assert.rejects(compareAndWrite(m.run,'x',p),SyncConflict);
 assert.equal(m.get().data.text,'a');
 const d=await compareAndWrite(m.run,'x',{...p,expectedRevision:1,data:{},deleted:true});assert.equal(d.revision,2);assert.equal(d.deleted,true);
 await assert.rejects(compareAndWrite(m.run,'x',{...p,expectedRevision:1}),SyncConflict);assert.equal(m.get().deleted,true);
});
test('version inconnue et données excessives refusées',async()=>{
 const m=mock({schemaVersion:2,revision:1,data:{},deleted:false});
 await assert.rejects(compareAndWrite(m.run,'x',{collection:'notes',expectedRevision:1,data:{}}),UnsupportedSchema);
 assert.equal(validRecordInput('notes',{text:'x'.repeat(70000)},false),false);assert.equal(validRecordInput('autre',{},false),false);assert.equal(validRecordInput('notes',{text:'x'},true),false);
});
