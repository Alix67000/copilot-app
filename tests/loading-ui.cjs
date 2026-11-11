const esbuild=require('esbuild'),{JSDOM}=require('jsdom'),{webcrypto}=require('crypto'),assert=require('assert'),path=require('path');
const wait=t=>new Promise(r=>setTimeout(r,t));
function click(w,text){const b=[...w.document.querySelectorAll('button')].find(x=>x.textContent.trim()===text&&!x.disabled);assert(b,'bouton '+text);b.click()}
(async()=>{
 const result=await esbuild.build({entryPoints:['src/main.jsx'],bundle:true,platform:'browser',format:'iife',write:false,loader:{'.css':'empty'},define:{'import.meta.env.VITE_MICROSOFT_CLIENT_ID':'undefined','import.meta.env.VITE_MICROSOFT_TENANT_ID':'undefined'},plugins:[{name:'fake',setup(b){b.onResolve({filter:/firebase-client\.js$/},()=>({path:path.resolve('tests/fixtures/firebase-auth.js')}));b.onResolve({filter:/firebase-db\.js$/},()=>({path:path.resolve('tests/fixtures/firebase-db.js')}));b.onResolve({filter:/^firebase\/firestore$/},()=>({path:path.resolve('tests/fixtures/firebase-firestore.js')}))}}]});
 for(const mode of ['disconnected','connected','failure']){
  const d=new JSDOM('<div id="root"></div>',{url:'https://example.test',runScripts:'dangerously',pretendToBeVisual:true}),w=d.window;
  w.fakeCloud={data:new Map(),watchers:[]};w.structuredClone=structuredClone;w.TextEncoder=TextEncoder;Object.defineProperty(w,'crypto',{value:webcrypto});Object.defineProperty(w.navigator,'locks',{value:{request:async(n,o,f)=>f()}});w.URL.createObjectURL=()=> 'blob:fake';w.URL.revokeObjectURL=()=>{};
  const existing=[{id:'preserved',text:'Une note existante',updatedAt:100}];w.localStorage.setItem('pilotage.notes.v1',JSON.stringify(existing));
  let resolveSession,first=true;w.fetch=async(url)=>{
   if(String(url).startsWith('/api/app-session'))return {ok:true,status:200};
   if(String(url)==='/api/nylas?action=session'&&first){first=false;return new Promise(r=>{resolveSession=r})}
   if(String(url)==='/api/nylas?action=session')return {ok:true,status:200,json:async()=>({email:'test@example.test'})};
   if(String(url)==='/api/nylas?action=messages')return {ok:true,status:200,json:async()=>({messages:[{id:'fictif',subject:'Message fictif pour QA',from:{emailAddress:{name:'Test'}},receivedDateTime:new Date().toISOString(),bodyPreview:'Fictif',isRead:true}]})};
   return {ok:false,status:401};
  };
  w.eval(result.outputFiles[0].text);await wait(100);click(w,'Se connecter avec Google');await wait(200);
  assert(resolveSession,'requête session non démarrée');assert(w.document.body.textContent.includes('Chargement des e-mails…'));assert(w.document.querySelector('.spinner'));assert(!w.document.body.textContent.includes('Équipe support'));assert(!w.document.body.textContent.includes('Point équipe informatique'));assert(w.document.body.textContent.includes('Une note existante'));
  resolveSession(mode==='connected'?{ok:true,status:200}:mode==='failure'?{ok:false,status:503}:{ok:false,status:401});await wait(200);
  if(mode==='connected'){assert(w.document.body.textContent.includes('Message fictif pour QA'));assert(!w.document.body.textContent.includes('Chargement des e-mails…'))}
  if(mode==='disconnected'){assert(w.document.body.textContent.includes('Ta messagerie n’est pas connectée'));assert(!w.document.body.textContent.includes('Chargement des e-mails…'))}
  if(mode==='failure'){assert(w.document.body.textContent.includes('Impossible de vérifier la connexion Gmail'));assert(!w.document.body.textContent.includes('Ta messagerie n’est pas connectée'))}
  assert.equal(JSON.parse(w.localStorage.getItem('pilotage.notes.v1'))[0].text,'Une note existante');d.window.close();
 }
 console.log('Chargement interface : attente, absence de données fictives, connexion, déconnexion et erreur réseau OK');
})().catch(e=>{console.error(e);process.exitCode=1});
