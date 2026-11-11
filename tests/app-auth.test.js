import {test} from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPair,exportJWK,createLocalJWKSet,SignJWT} from 'jose';
import {verifyFirebaseToken,appCookie,appSession,FIREBASE_PROJECT} from '../server/app-auth.js';
import appSessionHandler from '../api/app-session.js';
import nylas from '../api/nylas.js';
import callback from '../api/nylas-callback.js';
import analyze from '../api/analyze.js';
process.env.NYLAS_SESSION_SECRET='a-test-secret-long-enough-to-be-valid';process.env.ALLOWED_GOOGLE_EMAIL='owner@example.test';
const now=()=>Math.floor(Date.now()/1000);
function response(){return {statusCode:200,headers:{},setHeader(k,v){this.headers[k]=v},status(s){this.statusCode=s;return this},json(x){this.body=x;return this},end(){return this},redirect(s,l){this.statusCode=s;this.location=l;return this}}}
test('jeton Firebase : signature, expiration, projet, e-mail et fournisseur vérifiés',async()=>{
 const {privateKey,publicKey}=await generateKeyPair('RS256',{extractable:true});const jwk=await exportJWK(publicKey);jwk.kid='test-key';jwk.alg='RS256';const ks=createLocalJWKSet({keys:[jwk]});
 const make=(p={},headers={})=>new SignJWT({email:'owner@example.test',email_verified:true,auth_time:now()-30,firebase:{sign_in_provider:'google.com'},...p}).setProtectedHeader({alg:'RS256',kid:'test-key',...headers}).setIssuer(`https://securetoken.google.com/${FIREBASE_PROJECT}`).setAudience(FIREBASE_PROJECT).setSubject('uid-test').setIssuedAt().setExpirationTime('1h').sign(privateKey);
 assert.equal((await verifyFirebaseToken(await make(),ks)).uid,'uid-test');
 for(const claims of [{email:'wrong@example.test'},{email_verified:false},{firebase:{sign_in_provider:'password'}},{auth_time:now()+100}])await assert.rejects(verifyFirebaseToken(await make(claims),ks));
 const expired=await new SignJWT({email:'owner@example.test',email_verified:true,auth_time:now()-200,firebase:{sign_in_provider:'google.com'}}).setProtectedHeader({alg:'RS256',kid:'test-key'}).setIssuer(`https://securetoken.google.com/${FIREBASE_PROJECT}`).setAudience(FIREBASE_PROJECT).setSubject('uid').setIssuedAt(now()-200).setExpirationTime(now()-1).sign(privateKey);await assert.rejects(verifyFirebaseToken(expired,ks));
 const impostor=await generateKeyPair('RS256');const forged=await new SignJWT({email:'owner@example.test',email_verified:true,auth_time:now()-1,firebase:{sign_in_provider:'google.com'}}).setProtectedHeader({alg:'RS256',kid:'test-key'}).setIssuer(`https://securetoken.google.com/${FIREBASE_PROJECT}`).setAudience(FIREBASE_PROJECT).setSubject('uid').setIssuedAt().setExpirationTime('1h').sign(impostor.privateKey);await assert.rejects(verifyFirebaseToken(forged,ks));
 const wrong=await new SignJWT({email:'owner@example.test',email_verified:true,auth_time:now()-1,firebase:{sign_in_provider:'google.com'}}).setProtectedHeader({alg:'RS256',kid:'test-key'}).setIssuer('https://securetoken.google.com/other').setAudience('other').setSubject('uid').setIssuedAt().setExpirationTime('1h').sign(privateKey);await assert.rejects(verifyFirebaseToken(wrong,ks));
});
test('cookie distinct, signé, borné dans le temps et contrôlé sur chaque API',async()=>{
 const app=appCookie('u','owner@example.test',now()+3600).split(';')[0];assert.equal(appSession({headers:{cookie:app}}).uid,'u');assert.equal(appSession({headers:{cookie:app+'x'}}),null);assert.equal(appSession({headers:{cookie:''}}),null);
 let r=response();await nylas({method:'GET',query:{action:'start'},headers:{}},r);assert.equal(r.statusCode,401);
 r=response();await callback({method:'GET',headers:{},query:{}},r);assert.match(r.location,/nylas=session/);
 r=response();await analyze({method:'POST',headers:{origin:'https://copilot-app-phi.vercel.app'},body:{}},r);assert.equal(r.statusCode,401);
 r=response();await appSessionHandler({method:'POST',query:{action:'logout'},headers:{origin:'https://evil.test'}},r);assert.equal(r.statusCode,403);
 r=response();await appSessionHandler({method:'POST',query:{action:'logout'},headers:{origin:'https://copilot-app-phi.vercel.app'}},r);assert.equal(r.statusCode,200);assert.ok(r.headers['Set-Cookie'].some(x=>x.startsWith('pilotage_app=;')));
});
