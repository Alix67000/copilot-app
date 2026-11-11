const esbuild=require('esbuild'),{JSDOM}=require('jsdom'),{webcrypto}=require('crypto'),assert=require('assert'),path=require('path');
const wait=t=>new Promise(r=>setTimeout(r,t));
function click(w,text){const b=[...w.document.querySelectorAll('button')].find(x=>x.textContent.trim()===text&&!x.disabled);assert(b,'bouton '+text);b.click()}
const dateKey=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
(async()=>{
 const out=await esbuild.build({entryPoints:['src/main.jsx'],bundle:true,platform:'browser',format:'iife',write:false,loader:{'.css':'empty'},define:{'import.meta.env.VITE_MICROSOFT_CLIENT_ID':'undefined','import.meta.env.VITE_MICROSOFT_TENANT_ID':'undefined'},plugins:[{name:'fake',setup(b){b.onResolve({filter:/firebase-client\.js$/},()=>({path:path.resolve('tests/fixtures/firebase-auth.js')}));b.onResolve({filter:/firebase-db\.js$/},()=>({path:path.resolve('tests/fixtures/firebase-db.js')}));b.onResolve({filter:/^firebase\/firestore$/},()=>({path:path.resolve('tests/fixtures/firebase-firestore.js')}))}}]});
 const d=new JSDOM('<div id="root"></div>',{url:'https://example.test',runScripts:'dangerously',pretendToBeVisual:true}),w=d.window;
 w.fakeCloud={data:new Map(),watchers:[]};w.structuredClone=structuredClone;w.TextEncoder=TextEncoder;Object.defineProperty(w,'crypto',{value:webcrypto});Object.defineProperty(w.navigator,'locks',{value:{request:async(n,o,f)=>f()}});w.URL.createObjectURL=()=> 'blob:fake';w.URL.revokeObjectURL=()=>{};w.fetch=async(url)=>String(url).startsWith('/api/app-session')?{ok:true,status:200}:{ok:false,status:401};
 try{
  w.eval(out.outputFiles[0].text);await wait(100);click(w,'Se connecter avec Google');await wait(300);
  assert(w.document.querySelector('.links-card'));click(w,'Paramètres');await wait(80);
  const toggle=[...w.document.querySelectorAll('.widget-toggle')].find(x=>x.textContent.includes('Liens utiles'));assert(toggle);toggle.querySelector('input').click();await wait(40);click(w,'Enregistrer les modifications');await wait(40);assert(w.document.querySelector('[role=dialog]').textContent.includes('Liens utiles : masqué'));click(w,'Oui, enregistrer');await wait(100);assert(w.document.body.textContent.includes('Enregistrement effectué'));assert.equal(JSON.parse(w.localStorage.getItem('pilotage.widgets.v1')).visible.usefulLinks,false);
  click(w,'Vue d’ensemble');await wait(80);assert(!w.document.querySelector('.links-card'));
  click(w,'Paramètres');await wait(60);[...w.document.querySelectorAll('.widget-toggle')].find(x=>x.textContent.includes('Liens utiles')).querySelector('input').click();await wait(30);click(w,'Enregistrer les modifications');await wait(30);click(w,'Oui, enregistrer');await wait(100);click(w,'Vue d’ensemble');await wait(80);assert(w.document.querySelector('.links-card'));
  console.log('Liens paramètres UI : masquer et réafficher avec confirmation OK');
 }finally{d.window.close()}
})().catch(e=>{console.error(e);process.exit(1)});
