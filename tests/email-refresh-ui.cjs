const esbuild=require('esbuild'),{JSDOM}=require('jsdom'),{webcrypto}=require('crypto'),assert=require('assert'),path=require('path');
const wait=t=>new Promise(r=>setTimeout(r,t));
function click(w,text){const b=[...w.document.querySelectorAll('button')].find(x=>x.textContent.trim()===text&&!x.disabled);assert(b,'bouton '+text);b.click()}
(async()=>{
 const out=await esbuild.build({entryPoints:['src/main.jsx'],bundle:true,platform:'browser',format:'iife',write:false,loader:{'.css':'empty'},define:{'import.meta.env.VITE_MICROSOFT_CLIENT_ID':'undefined','import.meta.env.VITE_MICROSOFT_TENANT_ID':'undefined'},plugins:[{name:'fake',setup(b){b.onResolve({filter:/firebase-client\.js$/},()=>({path:path.resolve('tests/fixtures/firebase-auth.js')}));b.onResolve({filter:/firebase-db\.js$/},()=>({path:path.resolve('tests/fixtures/firebase-db.js')}));b.onResolve({filter:/^firebase\/firestore$/},()=>({path:path.resolve('tests/fixtures/firebase-firestore.js')}))}}]});
 const d=new JSDOM('<div id="root"></div>',{url:'https://example.test',runScripts:'dangerously',pretendToBeVisual:true}),w=d.window;
 w.fakeCloud={data:new Map(),watchers:[]};w.structuredClone=structuredClone;w.TextEncoder=TextEncoder;Object.defineProperty(w,'crypto',{value:webcrypto});Object.defineProperty(w.navigator,'locks',{value:{request:async(n,o,f)=>f()}});w.URL.createObjectURL=()=> 'blob:fake';w.URL.revokeObjectURL=()=>{};
 let requests=[],analyses=[],failNext=false,release;w.fetch=async(url,opts={})=>{
  url=String(url);
  if(url.startsWith('/api/app-session'))return {ok:true,status:200};
  if(url==='/api/nylas?action=session')return {ok:true,status:200,json:async()=>({email:'test@example.test'})};
  if(url.startsWith('/api/nylas?action=messages')){requests.push(url);return {ok:true,status:200,json:async()=>({messages:[{id:'fictif',subject:'Sujet de test',from:{emailAddress:{name:'Fictif'}},receivedDateTime:new Date().toISOString(),bodyPreview:'Contenu fictif',isRead:true}]})}}
  if(url==='/api/analyze'){const data=JSON.parse(opts.body);analyses.push(data);if(failNext){failNext=false;return {ok:false,status:429,json:async()=>({code:'AI_QUOTA',error:'Quota de test atteint'})}}return {ok:true,status:200,json:async()=>({resume:'Résumé de test',actions:['Action fictive'],echeances:[]})}}
  return {ok:false,status:401};
 };
 try{
  w.eval(out.outputFiles[0].text);await wait(100);click(w,'Se connecter avec Google');await wait(400);
  assert.equal(analyses.length,0,'aucune analyse au démarrage');assert.match(requests[0],/hours=72/);
  click(w,'Paramètres');await wait(80);const sel=w.document.querySelector('select[aria-label="Période à récupérer"]');assert(sel);sel.value='24';sel.dispatchEvent(new w.Event('change',{bubbles:true}));await wait(80);assert.equal(JSON.parse(w.localStorage.getItem('pilotage.widgets.v1')||'{}').emailHours,undefined,'brouillon non enregistré');assert(w.document.body.textContent.includes('Modifications non enregistrées'));click(w,'Enregistrer les modifications');await wait(40);click(w,'Oui, enregistrer');await wait(100);assert(w.document.body.textContent.includes('Enregistrement effectué sur cet appareil'));assert.equal(JSON.parse(w.localStorage.getItem('pilotage.widgets.v1')).emailHours,24);
  click(w,'E-mails');await wait(80);failNext=true;click(w,'Actualiser');await wait(200);assert.equal(analyses.length,1);assert.equal(analyses[0].hours,24);assert.match(requests.at(-1),/hours=24/);assert(w.document.body.textContent.includes('Quota de test atteint'));
  click(w,'Actualiser');await wait(200);assert.equal(analyses.length,2);click(w,'Vue d’ensemble');await wait(100);assert(w.document.body.textContent.includes('Résumé de test'));assert(w.document.body.textContent.includes('24 dernières heures'));
  click(w,'E-mails');await wait(50);click(w,'Actualiser');await wait(150);assert.equal(analyses.length,2,'message déjà analysé non retraité');
  assert.equal(JSON.parse(w.localStorage.getItem('pilotage.tasks.v1')).filter(t=>t.title==='Action fictive').length,1,'aucune tâche dupliquée');
  console.log('UI e-mails : réglage 24 h, actualisation, analyse automatique, erreur et reprise, anti-doublon OK');
 }finally{d.window.close()}
})().catch(e=>{console.error(e);process.exit(1)});
