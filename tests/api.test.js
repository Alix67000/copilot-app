import { test } from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/analyze.js';
import {sessionCookie} from '../server/nylas.js';
process.env.GEMINI_API_KEY='fake';process.env.NYLAS_API_KEY='fake';process.env.NYLAS_SESSION_SECRET='test-session-key-long-enough-for-testing';process.env.ALLOWED_GOOGLE_EMAIL='test@example.com';
let fakeFrom='service@emmaus-scherwiller.fr', fakeTimestamp=Date.now(), aiCalls=0, aiMode='ok', aiConfig;
globalThis.fetch=async (url,options)=>{let obj;
 if(url.includes('/messages/'))obj={data:{date:Math.floor(fakeTimestamp/1000),from:[{email:fakeFrom}],subject:'Test fictif',body:'Merci de vérifier la sauvegarde avant le 3 décembre 2026 à 14h30.'}};
 else if(url.includes('generativelanguage')){aiCalls++;aiConfig=JSON.parse(options.body).generationConfig;if(aiMode==='quota')return {ok:false,status:429};if(aiMode==='forbidden')return {ok:false,status:403};if(aiMode==='max')return {ok:true,json:async()=>({candidates:[{finishReason:'MAX_TOKENS',content:{parts:[{text:'{broken'}]}}]})};if(aiMode==='invalid')return {ok:true,json:async()=>({candidates:[{finishReason:'STOP',content:{parts:[{text:'{broken'}]}}]})};obj={candidates:[{content:{parts:[{text:JSON.stringify({resume:'Vérifier la sauvegarde.',actions:['Vérifier la sauvegarde'],echeances:[{description:'Vérification',date_source:'3 décembre 2026',heure_source:'14h30'}]})}]}}]}}
 else throw Error('URL inattendue');return {ok:true,json:async()=>obj};
};
async function invoke(cookie=sessionCookie('grant-test','test@example.com').split(';')[0]){let status=200,body;const req={method:'POST',headers:{cookie},body:{messageId:'abc123'}},res={setHeader(){},status(s){status=s;return this},json(b){body=b;return this}};await handler(req,res);return {status,body}}
test('analyse Nylas et contrôles de sécurité',async()=>{
 let r=await invoke();assert.equal(r.status,200);assert.equal(r.body.echeances[0].date,'2026-12-03');assert.equal(r.body.echeances[0].time,'14:30');assert.equal(aiCalls,1);assert.equal(aiConfig.maxOutputTokens,4096);assert.equal(aiConfig.thinkingConfig.thinkingLevel,'MINIMAL');
 fakeFrom='personne@emmaus-scherwiller.fr.autre.fr';r=await invoke();assert.equal(r.status,403);assert.equal(aiCalls,1);
 fakeFrom='service@emmaus-scherwiller.fr';fakeTimestamp=Date.now()-73*60*60*1000;r=await invoke();assert.equal(r.status,403);assert.equal(aiCalls,1);
 fakeTimestamp=Date.now();r=await invoke(sessionCookie('grant-test','autre@example.com').split(';')[0]);assert.equal(r.status,401);assert.equal(aiCalls,1);
 r=await invoke('');assert.equal(r.status,401);
});
test('diagnostics explicites sans contenu confidentiel',async()=>{
 fakeTimestamp=Date.now();fakeFrom='personne@emmaus-scherwiller.fr';
 aiMode='max';let r=await invoke();assert.equal(r.status,422);assert.equal(r.body.code,'AI_OUTPUT_LIMIT');
 aiMode='invalid';r=await invoke();assert.equal(r.status,422);assert.equal(r.body.code,'AI_INVALID');
 aiMode='quota';r=await invoke();assert.equal(r.status,429);assert.equal(r.body.code,'AI_QUOTA');
 aiMode='forbidden';r=await invoke();assert.equal(r.status,503);assert.equal(r.body.code,'AI_AUTH');
});
