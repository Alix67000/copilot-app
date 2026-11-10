// Les dates sont extraites uniquement si le jour, le mois et l'année figurent dans le texte.
const MONTHS = {janvier:1,fevrier:2,mars:3,avril:4,mai:5,juin:6,juillet:7,aout:8,septembre:9,octobre:10,novembre:11,decembre:12};
const norm = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
function dateISO(y,m,d){const n=new Date(Date.UTC(y,m-1,d));return n.getUTCFullYear()===y&&n.getUTCMonth()===m-1&&n.getUTCDate()===d?`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`:null}
export function parseExplicitDate(s){
 if(typeof s!=='string')return null;const x=norm(s.trim());let m;
 if((m=x.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)))return dateISO(+m[1],+m[2],+m[3]);
 if((m=x.match(/^(\d{1,2})[/.](\d{1,2})[/.](\d{4})$/)))return dateISO(+m[3],+m[2],+m[1]);
 if((m=x.match(/^(\d{1,2})(?:er)?\s+(janvier|fevrier|mars|avril|mai|juin|juillet|aout|septembre|octobre|novembre|decembre)\s+(\d{4})$/)))return dateISO(+m[3],MONTHS[m[2]],+m[1]);
 return null;
}
export function validateDeadline(value, content){
 if(!value||typeof value!=='object'||typeof value.description!=='string'||typeof value.date_source!=='string')return null;
 const source=value.date_source.trim(), found=norm(content).includes(norm(source));
 const date=found?parseExplicitDate(source):null;
 let time=null;
 if(date && typeof value.heure_source==='string' && value.heure_source.trim()){
   const raw=value.heure_source.trim(), m=raw.match(/^(\d{1,2})\s*(?:h|:)\s*(\d{2})?$/i);
   if(m && norm(content).includes(norm(raw)) && +m[1]<24 && +(m[2]||'0')<60)time=`${m[1].padStart(2,'0')}:${m[2]||'00'}`;
 }
 return {description:value.description.trim().slice(0,500),date,source_date:source.slice(0,80),time};
}
