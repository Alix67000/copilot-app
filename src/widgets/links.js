export const LINKS_KEY='pilotage.links.v1';
export const MAX_LINKS=200, MAX_LINK_TITLE=100, MAX_LINK_URL=2048;
export function cleanUrl(input){
 if(typeof input!=='string')return null;
 let value=input.trim();if(!value||value.length>MAX_LINK_URL||/[\s\u0000-\u001f\u007f]/.test(value))return null;
 if(!/^[a-z][a-z\d+.-]*:\/\//i.test(value)){if(/^[a-z][a-z\d+.-]*:/i.test(value))return null;value='https://'+value}
 try{const u=new URL(value);if(!['https:','http:'].includes(u.protocol)||!u.hostname||u.username||u.password||u.href.length>MAX_LINK_URL)return null;return u.href}catch{return null}
}
export function validLink(item){return !!item&&typeof item==='object'&&!Array.isArray(item)&&Object.keys(item).sort().join(',')==='id,title,updatedAt,url'&&typeof item.id==='string'&&item.id.length>0&&item.id.length<=1024&&typeof item.title==='string'&&item.title.trim()===item.title&&item.title.length>0&&item.title.length<=MAX_LINK_TITLE&&typeof item.url==='string'&&cleanUrl(item.url)===item.url&&Number.isSafeInteger(item.updatedAt)&&item.updatedAt>=0&&Number.isFinite(new Date(item.updatedAt).getTime())}
export function readLinks(){try{const raw=localStorage.getItem(LINKS_KEY);if(raw===null)return {links:[],error:false};const links=JSON.parse(raw);if(!Array.isArray(links)||links.length>MAX_LINKS||links.some(x=>!validLink(x))||new Set(links.map(x=>x.id)).size!==links.length)return {links:[],error:true};return {links,error:false}}catch{return {links:[],error:true}}}
export function saveLinks(links){try{if(!Array.isArray(links)||links.length>MAX_LINKS||links.some(x=>!validLink(x))||new Set(links.map(x=>x.id)).size!==links.length)return false;localStorage.setItem(LINKS_KEY,JSON.stringify(links));return true}catch{return false}}
export function buildLink(title,url,id,now=Date.now()){const clean=typeof title==='string'?title.trim():'';const address=cleanUrl(url);const link={id,title:clean,url:address,updatedAt:now};return validLink(link)?link:null}
