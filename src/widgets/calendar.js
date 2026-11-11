// All dates in the internal agenda and task deadlines are calendar dates, not UTC timestamps.
export function dayKey(year,month,day){return `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`}
export function validDay(value){
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
 const [y,m,d]=value.split('-').map(Number);if(y<100||m<1||m>12||d<1)return false;
 const date=new Date(y,m-1,d);return date.getFullYear()===y&&date.getMonth()===m-1&&date.getDate()===d;
}
export function localDay(date){return dayKey(date.getFullYear(),date.getMonth(),date.getDate())}
export function monthGrid(year,month){
 const first=new Date(year,month,1),offset=(first.getDay()+6)%7,days=new Date(year,month+1,0).getDate();
 const count=Math.ceil((offset+days)/7)*7;
 return Array.from({length:count},(_,i)=>i<offset||i>=offset+days?null:dayKey(year,month,i-offset+1));
}
export function eventDay(value,allDay=false){
 if(typeof value!=='string')return null;
 // Microsoft returns local wall time without an offset, or ISO with an offset.
 const prefix=value.slice(0,10);if(!validDay(prefix))return null;
 if(!allDay&&/(?:Z|[+-]\d{2}:?\d{2})$/i.test(value)){const date=new Date(value);return Number.isFinite(date.getTime())?localDay(date):null}
 return prefix;
}
export function calendarItems(deadlines,tasks,events){
 const items=[];
 for(const d of deadlines||[])if(validDay(d.date))items.push({key:'deadline:'+d.id,day:d.date,title:d.title||'Échéance sans titre',kind:'deadline',time:d.time||null});
 for(const t of tasks||[])if(validDay(t.due)&&!t.done)items.push({key:'task:'+t.id,day:t.due,title:t.title||'Tâche sans titre',kind:'task',time:null});
 for(const e of events||[]){const date=e.start?.dateTime,day=eventDay(date,e.isAllDay);let time=null;if(!e.isAllDay&&typeof date==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d/.test(date)){if(/(?:Z|[+-]\d{2}:?\d{2})$/i.test(date)){const parsed=new Date(date);if(Number.isFinite(parsed.getTime()))time=`${String(parsed.getHours()).padStart(2,'0')}:${String(parsed.getMinutes()).padStart(2,'0')}`}else time=date.slice(11,16)}if(day)items.push({key:'event:'+e.id,day,title:e.subject||'Rendez-vous sans titre',kind:'event',time});}
 return items.sort((a,b)=>a.day.localeCompare(b.day)||(a.time||'').localeCompare(b.time||'')||a.title.localeCompare(b.title,'fr'));
}
