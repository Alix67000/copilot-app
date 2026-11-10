import { test } from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/analyze.js';
process.env.GEMINI_API_KEY='fake';process.env.VITE_GOOGLE_CLIENT_ID='test-client';process.env.ALLOWED_GOOGLE_EMAIL='test@example.com';
let fakeFrom='Équipe <service@emmaus-scherwiller.fr>', fakeTimestamp=Date.now(), fakeEmail='test@example.com', aiCalls=0;
globalThis.fetch=async url=>{let obj;
 if(url.includes('tokeninfo'))obj={aud:'test-client',expires_in:'300',scope:'https://www.googleapis.com/auth/gmail.readonly'};
 else if(url.includes('/profile'))obj={emailAddress:fakeEmail};
 else if(url.includes('/messages/'))obj={internalDate:String(fakeTimestamp),payload:{mimeType:'text/plain',headers:[{name:'From',value:fakeFrom},{name:'Subject',value:'Test fictif'}],body:{data:Buffer.from('Merci de vérifier la sauvegarde avant le 3 décembre 2026 à 14h30.').toString('base64url')}}};
 else if(url.includes('generativelanguage')){aiCalls++;obj={candidates:[{content:{parts:[{text:JSON.stringify({resume:'Vérifier la sauvegarde.',actions:['Vérifier la sauvegarde'],echeances:[{description:'Vérification',date_source:'3 décembre 2026',heure_source:'14h30'}]})}]}}]}}
 else throw Error('URL inattendue');return {ok:true,json:async()=>obj};
};
async function invoke(){let status=200,body;const req={method:'POST',headers:{authorization:'Bearer test-token'},body:{messageId:'abc123'}},res={setHeader(){},status(s){status=s;return this},json(b){body=b;return this}};await handler(req,res);return {status,body}}
test('analyse fictive et contrôles de sécurité',async()=>{
 let r=await invoke();assert.equal(r.status,200);assert.equal(r.body.echeances[0].date,'2026-12-03');assert.equal(r.body.echeances[0].time,'14:30');assert.equal(aiCalls,1);
 fakeFrom='personne@emmaus-scherwiller.fr.autre.fr';r=await invoke();assert.equal(r.status,403);assert.equal(aiCalls,1);
 fakeFrom='Équipe <service@emmaus-scherwiller.fr>';fakeTimestamp=Date.now()-73*60*60*1000;r=await invoke();assert.equal(r.status,403);assert.equal(aiCalls,1);
 fakeTimestamp=Date.now();fakeEmail='autre@example.com';r=await invoke();assert.equal(r.status,403);assert.equal(aiCalls,1);
});
