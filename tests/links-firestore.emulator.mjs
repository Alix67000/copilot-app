import fs from 'node:fs';import assert from 'node:assert/strict';import {webcrypto} from 'node:crypto';
import {initializeTestEnvironment,assertFails,assertSucceeds} from '@firebase/rules-unit-testing';
import {collection,getDocsFromServer,doc,setDoc,getDoc,deleteDoc} from 'firebase/firestore';
import {syncCycle} from '../src/lib/sync-cycle.js';import {COLLECTIONS,firestoreWrite} from '../src/lib/sync-store.js';import {buildLink} from '../src/widgets/links.js';
function store(o={}){const m=new Map(Object.entries(o));return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)}}
const rules=fs.readFileSync('docs/firestore-regles-v3-liens.rules','utf8').replaceAll('TON_ADRESSE_GOOGLE','owner@example.test');
const env=await initializeTestEnvironment({projectId:'demo-pilotage-tests',firestore:{rules}});
try{
 const token={email:'owner@example.test',email_verified:true,firebase:{sign_in_provider:'google.com'}};
 const db=env.authenticatedContext('owner',token).firestore(), no=env.unauthenticatedContext().firestore(),other=env.authenticatedContext('other',{...token,email:'other@example.test'}).firestore();
 const link=buildLink('Portail fictif','https://example.test/','example-id',100),key='pilotage.links.v1',a=store({[key]:JSON.stringify([link])}),b=store();
 async function run(s){const remote=(await Promise.all(COLLECTIONS.map(async c=>(await getDocsFromServer(collection(db,'pilotage_users','owner',c))).docs.map(d=>({collection:c,id:d.id,...d.data()}))))).flat();return syncCycle({storage:s,uid:'owner',remote,write:r=>firestoreWrite(db,'owner',r.collection,r.id,r),crypt:webcrypto})}
 assert.equal((await run(a)).status,'synced');assert.equal((await run(b)).status,'synced');assert.deepEqual(JSON.parse(b.getItem(key)),[link]);
 b.setItem(key,JSON.stringify([{...link,title:'Modifié',updatedAt:101}]));assert.equal((await run(b)).status,'synced');assert.equal((await run(a)).status,'synced');assert.equal(JSON.parse(a.getItem(key))[0].title,'Modifié');
 a.setItem(key,'[]');assert.equal((await run(a)).status,'synced');assert.equal((await run(b)).status,'synced');assert.deepEqual(JSON.parse(b.getItem(key)),[]);
 const id='i_'+'b'.repeat(64),path='pilotage_users/owner/links/'+id,record={schemaVersion:1,revision:1,deleted:false,data:link};
 await assertFails(getDoc(doc(no,path)));await assertFails(setDoc(doc(other,path),record));await assertFails(setDoc(doc(db,path),{...record,data:{...link,url:'javascript:alert(1)'}}));await assertFails(setDoc(doc(db,path),{...record,data:{...link,title:'a'.repeat(101)}}));
 await assertSucceeds(setDoc(doc(db,path),record));await assertFails(setDoc(doc(db,path),{...record,revision:3}));await assertFails(deleteDoc(doc(db,path)));
 console.log('Firestore émulé : ajout, modification, suppression, deux appareils, isolation et validation OK');
}finally{await env.cleanup()}
