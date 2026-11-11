import {test} from 'node:test';
import assert from 'node:assert/strict';
import {BACKUP_KEYS,createLocalBackup} from '../src/lib/sync-backup.js';
test('sauvegarde limitée aux données métier, même illisibles',()=>{
 const map=new Map([['pilotage.notes.v1','{illisible'],['auth-token','secret']]);
 const backup=createLocalBackup({getItem:k=>map.get(k)??null},new Date('2026-01-01Z'));
 assert.equal(backup.entries['pilotage.notes.v1'],'{illisible');assert.equal(Object.keys(backup.entries).length,BACKUP_KEYS.length);assert.ok(!JSON.stringify(backup).includes('secret'));
});
test('stockage indisponible : aucune sauvegarde incomplète présentée comme réussie',()=>{
 assert.throws(()=>createLocalBackup({getItem:()=>{throw Error('denied')}}),/denied/);
});
