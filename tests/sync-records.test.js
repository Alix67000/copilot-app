import test from 'node:test';
import assert from 'node:assert/strict';
import {reconcileRecord, canEditSchema} from '../src/lib/sync-records.js';
const a={text:'avant',deleted:false}, b={text:'après',deleted:false}, c={text:'autre',deleted:false}, tomb={deleted:true};
test('un changement non concurrent est conservé',()=>{
 assert.deepEqual(reconcileRecord(a,a,b),{status:'merged',value:b});
 assert.deepEqual(reconcileRecord(a,b,a),{status:'merged',value:b});
});
test('changements concurrents et suppressions ne sont pas écrasés',()=>{
 assert.equal(reconcileRecord(a,b,c).status,'conflict');
 assert.equal(reconcileRecord(a,tomb,c).status,'conflict');
 assert.equal(reconcileRecord(null,b,c).status,'conflict');
});
test('objets identiques indépendamment de l’ordre des champs',()=>{
 assert.equal(reconcileRecord(null,{x:1,y:2},{y:2,x:1}).status,'merged');
});
test('un ancien client ne modifie pas un schéma inconnu',()=>{
 assert.equal(canEditSchema(1),true); assert.equal(canEditSchema(2),false); assert.equal(canEditSchema(null),false);
});
