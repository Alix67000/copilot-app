import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm,mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {checkClientSecrets} from '../scripts/check-client-secrets.mjs';
test('détection d’une valeur secrète sans jamais l’afficher',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'client-secrets-test-'));
 try{
  await mkdir(join(dir,'assets'));const file=join(dir,'assets','test.js'),secret='cle-fictive-de-test-tres-longue';
  await writeFile(file,'public code');assert.deepEqual(await checkClientSecrets(dir,{GEMINI_API_KEY:secret}),[]);
  await writeFile(file,'prefix '+secret);let problems=await checkClientSecrets(dir,{GEMINI_API_KEY:secret});assert.equal(problems.length,1);assert(!problems.join(' ').includes(secret));
  await writeFile(file,'prefix '+encodeURIComponent('cle-fictive/avec+caracteres'));problems=await checkClientSecrets(dir,{GEMINI_API_KEY:'cle-fictive/avec+caracteres'});assert.equal(problems.length,1);
  await writeFile(file,'https://generativelanguage.googleapis.com/v1beta/models');problems=await checkClientSecrets(dir,{});assert.equal(problems.length,1);
  await writeFile(file,'prefix '+secret);problems=await checkClientSecrets(dir,{NAVASAN_API_KEY:secret});assert.equal(problems.length,1);assert(!problems.join(' ').includes(secret));
  await writeFile(file,'aucun secret');problems=await checkClientSecrets(dir,{VITE_NAVASAN_API_KEY:secret});assert.equal(problems.length,1);
  await writeFile(file,'aucun secret');problems=await checkClientSecrets(dir,{VITE_GEMINI_API_KEY:secret});assert.equal(problems.length,1);assert(!problems.join(' ').includes(secret));
 }finally{await rm(dir,{recursive:true,force:true})}
});
