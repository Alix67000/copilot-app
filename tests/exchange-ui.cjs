const esbuild=require('esbuild'),{JSDOM}=require('jsdom'),assert=require('assert');
const wait=t=>new Promise(r=>setTimeout(r,t));
(async()=>{
 const out=await esbuild.build({stdin:{contents:`import React from 'react';import {createRoot} from 'react-dom/client';import ExchangeRates from './src/widgets/ExchangeRates.jsx';createRoot(document.getElementById('root')).render(<ExchangeRates/>);`,resolveDir:process.cwd(),loader:'jsx'},bundle:true,platform:'browser',format:'iife',write:false});
 const d=new JSDOM('<div id="root"></div>',{url:'https://example.test',runScripts:'dangerously',pretendToBeVisual:true}),w=d.window;
 let calls=0,mode='success',resolve;
 const payload={source:'Navasan',fetchedAt:Date.now(),quotes:{usd:{toman:100,timestamp:1700000000},eur:{toman:120,timestamp:1700000001},afn:{toman:2,timestamp:1700000002}}};
 w.fetch=(url,options)=>{assert.equal(url,'/api/exchange-rates');assert.equal(options.method,'POST');calls++;return new Promise(r=>{resolve=()=>r(mode==='success'?{ok:true,json:async()=>payload}:{ok:false,json:async()=>({error:'Quota atteint'})})})};
 try{
  w.eval(out.outputFiles[0].text);await wait(80);assert.equal(calls,0);assert(w.document.body.textContent.includes('Aucun taux enregistré'));
  let btn=w.document.querySelector('.exchange-refresh');btn.click();await wait(40);assert.equal(calls,1);assert(btn.disabled);assert(w.document.body.textContent.includes('Actualisation des taux'));btn.click();assert.equal(calls,1);resolve();await wait(60);
  assert.equal(w.document.querySelector('#exchange-amount-eur').value,'1');assert.equal(w.document.querySelector('#exchange-amount-usd').value,'1');assert(w.document.body.textContent.includes('Toman iranien'));assert(!w.document.body.textContent.includes('Rial iranien'));assert.deepEqual([...w.document.querySelectorAll('.exchange-base')].map(box=>box.querySelectorAll('.exchange-line strong')[2].textContent),['120','100']);assert(w.document.body.textContent.includes('Taux anciens'));assert.deepEqual(JSON.parse(w.localStorage.getItem('pilotage.exchange.cache.v1')),payload);
  const input=(id,value)=>{const el=w.document.querySelector(id);Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype,'value').set.call(el,value);el.dispatchEvent(new w.Event('input',{bubbles:true}))};
  input('#exchange-amount-eur','150');await wait(30);let boxes=w.document.querySelectorAll('.exchange-base');assert.deepEqual([...boxes[0].querySelectorAll('.exchange-line strong')].map(e=>e.textContent),['180','9 000','18 000']);assert.deepEqual([...boxes[1].querySelectorAll('.exchange-line strong')].map(e=>e.textContent),['0,8333','50','100']);assert.equal(calls,1);
  input('#exchange-amount-usd','2,5');await wait(30);assert.deepEqual([...boxes[1].querySelectorAll('.exchange-line strong')].map(e=>e.textContent),['2,0833','125','250']);assert.equal(calls,1);
  input('#exchange-amount-eur','');await wait(30);assert.deepEqual([...boxes[0].querySelectorAll('.exchange-line strong')].map(e=>e.textContent),['—','—','—']);
  input('#exchange-amount-eur','-12');await wait(30);assert.equal(w.document.querySelector('#exchange-amount-eur').getAttribute('aria-invalid'),'true');assert(w.document.body.textContent.includes('Saisis un montant positif'));
  input('#exchange-amount-eur','0');await wait(30);assert.deepEqual([...boxes[0].querySelectorAll('.exchange-line strong')].map(e=>e.textContent),['0','0','0']);
  mode='error';btn.click();await wait(30);resolve();await wait(60);assert.equal(calls,2);assert(w.document.body.textContent.includes('Quota atteint'));assert.equal(w.document.querySelector('#exchange-amount-usd').value,'2,5');assert.deepEqual(JSON.parse(w.localStorage.getItem('pilotage.exchange.cache.v1')),payload);
  w.document.getElementById('root').innerHTML=''; // test persistence via fresh window below
  const d2=new JSDOM('<div id="root"></div>',{url:'https://example.test',runScripts:'dangerously'});try{d2.window.localStorage.setItem('pilotage.exchange.cache.v1',JSON.stringify(payload));let count=0;d2.window.fetch=()=>{count++;throw Error('unexpected')};d2.window.eval(out.outputFiles[0].text);await wait(50);assert.equal(count,0);assert.equal(d2.window.document.querySelector('#exchange-amount-eur').value,'1');assert.deepEqual([...d2.window.document.querySelectorAll('.exchange-base')].map(box=>box.querySelectorAll('.exchange-line strong')[2].textContent),['120','100'])}finally{d2.window.close()}
  console.log('Devises UI : aucun appel au démarrage, actualisation, double clic, calculs, cache et erreur OK');
 }finally{d.window.close()}
})().catch(e=>{console.error(e);process.exit(1)});
