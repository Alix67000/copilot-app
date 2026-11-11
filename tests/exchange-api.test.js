import {test} from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/exchange-rates.js';
import {appCookie} from '../server/app-auth.js';
process.env.NYLAS_SESSION_SECRET='test-session-key-long-enough-for-testing';process.env.ALLOWED_GOOGLE_EMAIL='test@example.com';process.env.NAVASAN_API_KEY='une-cle-fictive-pour-le-test';
const ORIGIN='https://copilot-app-phi.vercel.app';
const cookie=()=>appCookie('uid-test','test@example.com',Math.floor(Date.now()/1000)+3600).split(';')[0];
function result(){return {code:200,headers:{},setHeader(k,v){this.headers[k]=v},status(code){this.code=code;return this},json(value){this.body=value;return this}}}
test('API sécurisée et traitement fournisseur fictif',async()=>{
 const realFetch=globalThis.fetch,realNow=Date.now;let calls=0,mode='ok',now=realNow();Date.now=()=>now;
 globalThis.fetch=async(url,opts)=>{calls++;assert.equal(new URL(url).origin,'https://api.navasan.tech');assert.equal(opts.redirect,'error');assert.equal(new URL(url).searchParams.get('api_key'),process.env.NAVASAN_API_KEY);if(mode==='fail')return {ok:false,status:503};if(mode==='bad')return {ok:true,json:async()=>({usd:{value:'0',timestamp:123}})};return {ok:true,json:async()=>({usd:{value:'100',timestamp:1700000000},eur:{value:'120',timestamp:1700000001},afn:{value:'2',timestamp:1700000002},api_key:'secret-interdit'})}};
 try{
  let r=result();await handler({method:'POST',headers:{origin:ORIGIN}},r);assert.equal(r.code,401);assert.equal(calls,0);
  r=result();await handler({method:'POST',headers:{origin:'https://evil.test',cookie:cookie()}},r);assert.equal(r.code,403);assert.equal(calls,0);
  r=result();await handler({method:'GET',headers:{origin:ORIGIN,cookie:cookie()}},r);assert.equal(r.code,405);assert.equal(calls,0);
  r=result();await handler({method:'POST',headers:{origin:ORIGIN,cookie:cookie()}},r);assert.equal(r.code,200);assert.equal(calls,1);assert.equal(r.body.quotes.eur.toman,120);assert(!JSON.stringify(r.body).includes('secret-interdit'));assert(!JSON.stringify(r.body).includes(process.env.NAVASAN_API_KEY));
  r=result();await handler({method:'POST',headers:{origin:ORIGIN,cookie:cookie()}},r);assert.equal(r.code,429);assert.equal(calls,1);
  now+=6000;mode='fail';r=result();await handler({method:'POST',headers:{origin:ORIGIN,cookie:cookie()}},r);assert.equal(r.code,503);assert(!JSON.stringify(r.body).includes(process.env.NAVASAN_API_KEY));
  now+=6000;mode='bad';r=result();await handler({method:'POST',headers:{origin:ORIGIN,cookie:cookie()}},r);assert.equal(r.code,502);
 }finally{globalThis.fetch=realFetch;Date.now=realNow}
});
