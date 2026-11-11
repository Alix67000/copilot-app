import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validDay,monthGrid,dayKey,localDay,eventDay,calendarItems} from '../src/widgets/calendar.js';
test('grille mensuelle lundi à dimanche, années bissextiles et changement d’année',()=>{
 assert.equal(monthGrid(2024,1).length,35);assert.equal(monthGrid(2024,1)[3],'2024-02-01');assert.equal(monthGrid(2024,1).filter(Boolean).length,29);
 assert.equal(monthGrid(2025,1).filter(Boolean).length,28);assert.equal(monthGrid(2026,10)[6],'2026-11-01');assert.equal(monthGrid(2026,10).length,42);
 assert.equal(monthGrid(2027,0)[4],'2027-01-01');assert.equal(dayKey(2026,11,31),'2026-12-31');
});
test('validation des dates locales et calendrier Outlook',()=>{
 for(const s of ['2026-02-29','2026-04-31','2026-1-01','2026-13-10','invalide',''])assert.equal(validDay(s),false);
 assert.equal(validDay('2024-02-29'),true);assert.equal(eventDay('2026-11-07T09:30:00.0000000'),'2026-11-07');assert.equal(eventDay('pas-une-date'),null);
 const z='2026-11-07T23:30:00Z';assert.equal(eventDay(z),localDay(new Date(z)));assert.equal(eventDay(z,true),'2026-11-07');
});
test('échéances et tâches datées existantes sans toucher aux sources',()=>{
 const deadlines=[{id:'d1',date:'2026-11-07',title:'Échéance fictive',time:null},{id:'bad',date:'2026-02-30',title:'Impossible'}];
 const tasks=[{id:'t1',due:'2026-11-07',title:'Tâche fictive',done:false},{id:'t2',due:'2026-11-07',title:'Tâche terminée',done:true},{id:'t3',due:'',title:'Sans date',done:false}];
 const events=[{id:'e1',subject:'Rendez-vous fictif',start:{dateTime:'2026-11-07T09:30:00'},isAllDay:false}];
 const original=JSON.stringify({deadlines,tasks,events}),items=calendarItems(deadlines,tasks,events);assert.equal(items.length,3);assert.equal(items.find(i=>i.kind==='event').time,'09:30');assert.equal(items.find(i=>i.kind==='deadline').time,null);assert.equal(JSON.stringify({deadlines,tasks,events}),original);
});
