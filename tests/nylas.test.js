import {test} from 'node:test';
import assert from 'node:assert/strict';
import {sign,verify,sessionCookie,READ_SCOPE,allowedMessage,plain,nylasChallenge} from '../server/nylas.js';
import handler from '../api/nylas.js';
import callback from '../api/nylas-callback.js';
import analyze from '../api/analyze.js';
import {appCookie} from '../server/app-auth.js';
process.env.NYLAS_API_KEY='secret-test-seulement';process.env.NYLAS_SESSION_SECRET='secret-de-test-dedie-et-assez-long';process.env.NYLAS_CLIENT_ID='client-test';process.env.NYLAS_API_URI='https://api.eu.nylas.com';process.env.ALLOWED_GOOGLE_EMAIL='owner@example.com';process.env.GEMINI_API_KEY='fake';
const from=[{email:'staff@emmaus-scherwiller.fr',name:'Service'}];
const sample={id:'abc123',date:Math.floor(Date.now()/1000),subject:'Test',from,body:'<p>Vérifier la sauvegarde avant le 3 décembre 2026 à 14h30.</p>',snippet:'Test',unread:true};
let calls=[], expectedVerifier, mode='ok', grantScope=[READ_SCOPE,'openid','https://www.googleapis.com/auth/userinfo.email','https://www.googleapis.com/auth/userinfo.profile'];
globalThis.fetch=async(url,opts={})=>{calls.push({url:String(url),method:opts.method||'GET'});let data;
 if(String(url).includes('/connect/token')){assert.equal(JSON.parse(opts.body).code_verifier,expectedVerifier);if(mode==='exchange-fail')return {ok:false,status:400,json:async()=>({error:'invalid_grant',error_code:45004,error_description:'Code verifier challenge failed'})};if(mode==='code-fail')return {ok:false,status:400,json:async()=>({error:'invalid_grant',error_description:"Given code not valid or expired"})};data={grant_id:mode==='no-grant'?'!':'grant-test'};}
 else if(String(url).includes('/grants/grant-test/messages/'))data={data:sample};
 else if(String(url).includes('/grants/grant-test/messages?'))data={data:[sample,{...sample,id:'other',from:[{email:'bad@emmaus-scherwiller.fr.evil.test'}]}]};
 else if(String(url).includes('/grants/grant-test')){if(mode==='lookup-fail')return {ok:false,status:503};data={data:{provider:'google',email:'owner@example.com',grant_status:'valid',scope:grantScope}};}
 else if(String(url).includes('generativelanguage'))data={candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify({resume:'Test',actions:['Vérifier'],echeances:[{description:'Vérifier',date_source:'3 décembre 2026',heure_source:'14h30'}]})}]}}]};
 else throw Error('unexpected URL');return {ok:true,status:200,json:async()=>data};};
function response(){return {statusCode:200,headers:{},setHeader(k,v){this.headers[k]=v},status(s){this.statusCode=s;return this},json(x){this.body=x;return this},send(x){this.body=x;return this},end(){return this},redirect(s,l){this.statusCode=s;this.location=l;return this}}}
const app=()=>appCookie('uid-test','owner@example.com',Math.floor(Date.now()/1000)+3600).split(';')[0];
const value=(header)=>Array.isArray(header)?header[0].split(';')[0]:header.split(';')[0];
test('cookie signé et protection des messages',()=>{let val=sign({kind:'x',exp:Date.now()+10000});assert.equal(verify(val).kind,'x');assert.equal(verify(val+'x'),null);assert.equal(verify(sign({exp:Date.now()-1})),null);assert.equal(allowedMessage(sample),true);assert.equal(allowedMessage({...sample,from:[{email:'a@emmaus-scherwiller.fr.evil.test'}]}),false);assert.equal(plain('<p>bonjour &amp; salut</p>'),' bonjour & salut ')});
test('connexion, permissions et analyse avec Nylas simulé',async()=>{
 let r=response();await handler({method:'GET',query:{action:'start'},headers:{cookie:app()}},r);assert.equal(r.statusCode,302);const u=new URL(r.location);assert.equal(u.searchParams.get('scope'),READ_SCOPE);assert.equal(u.searchParams.get('code_challenge_method'),'s256');const stateCookie=value(r.headers['Set-Cookie']);const state=u.searchParams.get('state');const payload=verify(stateCookie.split('=')[1]);expectedVerifier=payload.verifier;assert.equal(u.searchParams.get('code_challenge'),nylasChallenge(payload.verifier));assert.equal(nylasChallenge('nylas'),'ZTk2YmY2Njg2YTNjMzUxMGU5ZTkyN2RiNzA2OWNiMWNiYTliOTliMDIyZjQ5NDgzYTZjZTMyNzA4MDllNjhhMg');
 r=response();await callback({method:'GET',headers:{cookie:app()+'; '+stateCookie},query:{code:'test-code',state:'autre'}},r);assert.match(r.location,/nylas=session/);

 r=response();await callback({method:'GET',headers:{cookie:app()+'; '+stateCookie},query:{error:'access_denied',state}},r);assert.match(r.location,/nylas=refus/);
 r=response();await callback({method:'GET',headers:{cookie:app()+'; '+stateCookie},query:{state}},r);assert.match(r.location,/nylas=code/);
 const oldError=console.error;console.error=()=>{};
 try{for(const [m,expected] of [['exchange-fail','echange-pkce'],['code-fail','echange-code'],['no-grant','grant'],['lookup-fail','verification']]){mode=m;r=response();await callback({method:'GET',headers:{cookie:app()+'; '+stateCookie},query:{code:'test-code',state}},r);assert.match(r.location,new RegExp('nylas='+expected))}}finally{mode='ok';console.error=oldError}
 r=response();grantScope=[READ_SCOPE,'https://www.googleapis.com/auth/calendar'];await callback({method:'GET',headers:{cookie:app()+'; '+stateCookie},query:{code:'test-code',state}},r);assert.match(r.location,/permissions/);assert.ok(!JSON.stringify(r.headers).includes('pilotage_nylas='));
 r=response();grantScope=[READ_SCOPE,'openid','https://www.googleapis.com/auth/userinfo.email','https://www.googleapis.com/auth/userinfo.profile'];await callback({method:'GET',headers:{cookie:app()+'; '+stateCookie},query:{code:'test-code',state}},r);assert.match(r.location,/nylas=ok/);const signed=r.headers['Set-Cookie'].find(x=>x.startsWith('pilotage_nylas='));assert.match(signed,/HttpOnly; Secure; SameSite=Lax/);
 const c=value(signed);r=response();await handler({method:'GET',query:{action:'messages'},headers:{cookie:app()+'; '+c}},r);assert.equal(r.statusCode,200);assert.equal(r.body.messages.length,1);assert.equal(r.body.messages[0].id,'abc123');assert.equal(r.body.messages[0].body,undefined);
 r=response();await analyze({method:'POST',headers:{cookie:app()+'; '+c,origin:'https://copilot-app-phi.vercel.app'},body:{messageId:'abc123'}},r);assert.equal(r.statusCode,200);assert.equal(r.body.echeances[0].date,'2026-12-03');
 r=response();await handler({method:'GET',query:{action:'messages'},headers:{cookie:app()+'; '+c+'altered'}},r);assert.equal(r.statusCode,401);
 r=response();await handler({method:'POST',query:{action:'logout'},headers:{cookie:app()+'; '+c,origin:'https://example.com'}},r);assert.equal(r.statusCode,403);
});
