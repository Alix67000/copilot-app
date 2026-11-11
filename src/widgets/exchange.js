export const EXCHANGE_CACHE_KEY='pilotage.exchange.cache.v1';
export function validExchange(data){return data?.source==='Navasan'&&Number.isSafeInteger(data.fetchedAt)&&data.fetchedAt>0&&data.fetchedAt<=8640000000000000&&['usd','eur','afn'].every(k=>Number.isFinite(data.quotes?.[k]?.toman)&&data.quotes[k].toman>0&&Number.isSafeInteger(data.quotes[k].timestamp)&&data.quotes[k].timestamp>0&&data.quotes[k].timestamp<=253402300799)}
export function readExchange(){try{const data=JSON.parse(localStorage.getItem(EXCHANGE_CACHE_KEY));return validExchange(data)?data:null}catch{return null}}
export function calculateExchange(data){
 if(!validExchange(data))return null;
 const {usd,eur,afn}=data.quotes;
 return {eur:{USD:eur.toman/usd.toman,AFN:eur.toman/afn.toman,IRR:eur.toman*10},usd:{EUR:usd.toman/eur.toman,AFN:usd.toman/afn.toman,IRR:usd.toman*10}};
}
export function quoteTime(data){return Math.min(...['usd','eur','afn'].map(k=>data.quotes[k].timestamp))*1000}

// French decimal comma and optional grouping spaces; never silently interpret invalid input as zero.
export function parseAmount(value){
 if(typeof value!=='string')return null;
 const cleaned=value.trim().replace(/[\s\u00a0\u202f]/g,'');
 if(!/^(?:\d+(?:[.,]\d*)?|[.,]\d+)$/.test(cleaned))return null;
 const number=Number(cleaned.replace(',','.'));
 return Number.isFinite(number)&&number>=0&&number<=1_000_000_000?number:null;
}
