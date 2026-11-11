export const SETTINGS_KEY='pilotage.widgets.v1';
export const widgetDefinitions=[
 ['statEmails','Compteur d’e-mails'],['statAgenda','Compteur de rendez-vous'],['statTasks','Compteur de tâches'],['statLate','Compteur d’échéances dépassées'],
 ['weather','Météo'],['notes','Notes rapides'],['briefing','Briefing intelligent'],['emails','E-mails récents'],['agenda','Mon agenda'],['tasks','Mes tâches']
];
export const defaults={visible:Object.fromEntries(widgetDefinitions.map(([key])=>[key,true])),weatherUnit:'celsius',weatherRefresh:30};
export function normalizeSettings(value){const visible={...defaults.visible};if(value&&typeof value==='object'&&value.visible&&typeof value.visible==='object')for(const [key] of widgetDefinitions)if(typeof value.visible[key]==='boolean')visible[key]=value.visible[key];return {visible,weatherUnit:['celsius','fahrenheit'].includes(value?.weatherUnit)?value.weatherUnit:'celsius',weatherRefresh:[0,15,30,60].includes(value?.weatherRefresh)?value.weatherRefresh:30}}
export function readWidgetSettings(){try{return normalizeSettings(JSON.parse(localStorage.getItem(SETTINGS_KEY)))}catch{return normalizeSettings(null)}}
export function saveWidgetSettings(value){try{localStorage.setItem(SETTINGS_KEY,JSON.stringify(normalizeSettings(value)));return true}catch{return false}}
