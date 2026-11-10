import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseExplicitDate, validateDeadline } from '../src/lib/deadline.js';
import { importedItems, mergeById } from '../src/lib/automation.js';
test('dates explicites avec année, jamais inventées',()=>{
 assert.equal(parseExplicitDate('3 décembre 2026'),'2026-12-03');
 assert.equal(parseExplicitDate('03/12/2026'),'2026-12-03');
 assert.equal(parseExplicitDate('2026-02-30'),null);
 assert.equal(parseExplicitDate('vendredi'),null);
 const body='Répondre avant le 3 décembre 2026 à 14h30.';
 assert.deepEqual(validateDeadline({description:'Répondre',date_source:'3 décembre 2026',heure_source:'14h30'},body),{description:'Répondre',date:'2026-12-03',source_date:'3 décembre 2026',time:'14:30'});
 assert.equal(validateDeadline({description:'Inventé',date_source:'4 décembre 2026'},body).date,null);
 assert.equal(validateDeadline({description:'Vérifier',date_source:'vendredi'},'avant vendredi').date,null);
 assert.equal(validateDeadline({description:'Répondre',date_source:'3 décembre 2026',heure_source:'12h00'},body).time,null);
});
test('importation et anti-doublon',()=>{
 const message={id:'123',subject:'Ouverture'};
 const result=importedItems(message,{actions:['Répondre'],echeances:[{description:'Réunion',date:'2026-12-03',time:null},{description:'À vérifier',date:null}]});
 assert.equal(result.tasks.length,1);assert.equal(result.deadlines.length,1);assert.equal(result.deadlines[0].time,null);
 assert.equal(mergeById(result.tasks,result.tasks).length,1);assert.equal(mergeById(result.deadlines,result.deadlines).length,1);
});
