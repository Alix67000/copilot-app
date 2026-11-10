export function importedItems(message, analysis) {
  const origin = `Gmail · ${message.subject || '(Sans objet)'}`;
  const tasks = (analysis.actions || []).filter(x => typeof x === 'string' && x.trim()).map((title,i)=>({id:`ai-${message.id}-task-${i}`,title:title.trim().slice(0,150),category:'E-mail',due:'',done:false,origin,sourceMessageId:message.id}));
  const deadlines = (analysis.echeances || []).filter(x=>x && typeof x === 'object' && typeof x.description==='string' && x.description && /^\d{4}-\d{2}-\d{2}$/.test(x.date||'')).map((d,i)=>({id:`ai-${message.id}-deadline-${i}`,title:d.description.slice(0,150),date:d.date,time:d.time||null,origin,sourceMessageId:message.id}));
  return {tasks,deadlines};
}
export function mergeById(existing,incoming){const ids=new Set(existing.map(x=>x.id));return [...incoming.filter(x=>!ids.has(x.id)),...existing];}
