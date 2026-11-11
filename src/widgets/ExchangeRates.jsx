import React,{useRef,useState} from 'react';
import {ArrowDownUp,RefreshCw,Info} from 'lucide-react';
import Loading from './Loading.jsx';
import {EXCHANGE_CACHE_KEY,readExchange,validExchange,calculateExchange,quoteTime} from './exchange.js';
const formatter=(n,c)=>new Intl.NumberFormat('fr-FR',{maximumFractionDigits:c==='IRR'?0:c==='AFN'?2:4}).format(n);
const timeLabel=t=>new Intl.DateTimeFormat('fr-FR',{dateStyle:'medium',timeStyle:'short'}).format(new Date(t));
export default function ExchangeRates(){
 const requesting=useRef(false);
 const [data,setData]=useState(readExchange),[loading,setLoading]=useState(false),[error,setError]=useState(''),[storageWarning,setStorageWarning]=useState(false);
 async function refresh(){if(requesting.current)return;requesting.current=true;setLoading(true);setError('');try{
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);let r;try{r=await fetch('/api/exchange-rates',{method:'POST',headers:{'Content-Type':'application/json'},signal:controller.signal})}finally{clearTimeout(timer)}
  let payload;try{payload=await r.json()}catch{throw Error('Réponse du service illisible. Réessaie plus tard.')}
  if(!r.ok)throw Error(payload?.error||'Actualisation indisponible. Réessaie plus tard.');
  if(!validExchange(payload))throw Error('Les taux reçus sont incomplets ou invalides.');
  setData(payload);try{localStorage.setItem(EXCHANGE_CACHE_KEY,JSON.stringify(payload));setStorageWarning(false)}catch{setStorageWarning(true)}
 }catch(e){setError(e.name==='AbortError'?'Délai dépassé. Réessaie plus tard.':e.message||'Actualisation indisponible.')}finally{requesting.current=false;setLoading(false)}}
 const rates=data?calculateExchange(data):null;
 return <section className="card exchange-card" aria-labelledby="exchange-title"><div className="exchange-head"><div className="exchange-title-wrap"><div className="exchange-symbol"><ArrowDownUp size={19}/></div><div><div className="section-kicker">TAUX DE CHANGE</div><h2 id="exchange-title">Devises</h2><p>Euro et dollar face aux principales devises</p></div></div><button type="button" className="secondary exchange-refresh" onClick={refresh} disabled={loading}><RefreshCw size={15}/> Actualiser</button></div>
 {loading&&<Loading className="exchange-loading" label="Actualisation des taux…"/>}{error&&<p className="exchange-error" role="alert">{error}{data?' Les derniers taux enregistrés restent affichés.':''}</p>}{storageWarning&&<p className="exchange-error" role="status">Les taux sont affichés mais n’ont pas pu être enregistrés sur cet appareil.</p>}
 {rates?<><div className="exchange-grid">{[['eur','EUR','Euro'],['usd','USD','Dollar américain']].map(([key,code,label])=><div className="exchange-base" key={key}><div className="exchange-base-head"><span className="exchange-code">{code==='EUR'?'€':'$'}</span><div><strong>1 {code}</strong><small>{label}</small></div></div><div className="exchange-lines">{Object.entries(rates[key]).map(([currency,value])=><div className="exchange-line" key={currency}><span>{currency==='IRR'?'Rial iranien':currency==='AFN'?'Afghani afghan':currency==='USD'?'Dollar américain':'Euro'} <small>{currency}</small></span><strong>{formatter(value,currency)}</strong></div>)}</div></div>)}</div><div className="exchange-meta"><span>Dernière cotation source : {timeLabel(quoteTime(data))}{Date.now()-quoteTime(data)>24*60*60*1000&&<strong className="exchange-stale"> · Taux anciens</strong>}</span><span>Actualisé sur cet appareil : {timeLabel(data.fetchedAt)}</span></div></>:<div className="exchange-empty"><ArrowDownUp size={21}/><strong>Aucun taux enregistré</strong><span>Clique sur « Actualiser » pour récupérer les taux Navasan.</span></div>}
 <div className="exchange-foot"><Info size={14}/><span>Taux indicatifs, conversions croisées calculées à partir des cours Navasan. Cours vendeur espèces en tomans convertis en rials (1 toman = 10 IRR). Actualisation manuelle : chaque appel peut compter dans le quota gratuit. <a href="https://www.navasan.tech/en/api" target="_blank" rel="noreferrer">Source : Navasan</a></span></div>
 </section>
}
