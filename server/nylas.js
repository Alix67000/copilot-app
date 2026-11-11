import { createHmac, randomBytes, timingSafeEqual, createHash } from 'node:crypto';
export const ORIGIN='https://copilot-app-phi.vercel.app';
export const CALLBACK=ORIGIN+'/api/nylas-callback';
export const READ_SCOPE='https://www.googleapis.com/auth/gmail.readonly';
export const COOKIE='pilotage_nylas';
export const STATE_COOKIE='pilotage_nylas_state';
const duration=30*24*3600;
function secret(){if(!process.env.NYLAS_API_KEY)throw Error('not_configured'); return process.env.NYLAS_API_KEY;}
function signature(text){const key=process.env.NYLAS_SESSION_SECRET;if(!key||key.length<32)throw Error('session_not_configured');return createHmac('sha256',key).update('pilotage-nylas-v1:'+text).digest('base64url')}
export function sign(data){const s=Buffer.from(JSON.stringify(data)).toString('base64url');return s+'.'+signature(s)}
export function verify(value){try {const [payload,mac,...extra]=(value||'').split('.');if(extra.length||!payload||!mac)return null;const a=Buffer.from(mac),b=Buffer.from(signature(payload));if(a.length!==b.length||!timingSafeEqual(a,b))return null;const parsed=JSON.parse(Buffer.from(payload,'base64url').toString());if(!Number.isFinite(parsed.exp)||parsed.exp<Date.now())return null;return parsed}catch{return null}}
export function cookie(req,name){const x=(req.headers?.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(name+'='));return x?x.slice(name.length+1):''}
export function cookieValue(name,value,maxAge){return `${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`}
// Nylas Node SDK encodes the lowercase hex digest as unpadded base64, not RFC 7636's raw digest.
export function nylasChallenge(verifier){const hex=createHash('sha256').update(verifier).digest('hex');return Buffer.from(hex,'ascii').toString('base64').replace(/=+$/,'')}
export function newState(){const state=randomBytes(32).toString('base64url'),verifier=randomBytes(32).toString('base64url');return {state,verifier,challenge:nylasChallenge(verifier)}}
export function session(req){const s=verify(cookie(req,COOKIE));return s?.kind==='session'&&s.email===(process.env.ALLOWED_GOOGLE_EMAIL||'').trim().toLowerCase()&&/^[a-zA-Z0-9_-]{1,128}$/.test(s.grant||'')?s:null}
export function sessionCookie(grant,email){return cookieValue(COOKIE,sign({kind:'session',grant,email,exp:Date.now()+duration*1000}),duration)}
export function stateCookie(state,verifier){return cookieValue(STATE_COOKIE,sign({kind:'state',state,verifier,exp:Date.now()+10*60*1000}),600)}
export function nylasBase(){const x=process.env.NYLAS_API_URI;return x==='https://api.eu.nylas.com'||x==='https://api.us.nylas.com'?x:'https://api.eu.nylas.com'}
export async function nylas(path,opts={}){const r=await fetch(nylasBase()+path,{...opts,headers:{...(opts.headers||{}),Authorization:'Bearer '+secret()}});if(!r.ok){const e=Error('nylas_error');e.status=r.status;if(path==='/v3/connect/token'){try{const data=await r.json();const known=['invalid_grant','invalid_request','invalid_client','unauthorized_client','unsupported_grant_type'];if(known.includes(data.error))e.oauthType=data.error;if(Number.isSafeInteger(data.error_code)&&data.error_code>=0&&data.error_code<=999999)e.oauthCode=data.error_code;const desc=String(data.error_description||'').toLowerCase();if(desc.includes('code verifier')||desc.includes('code_verifier')||desc.includes('code challenge'))e.reason='pkce';else if(desc.includes('expired')||desc.includes('already used')||desc.includes('not valid'))e.reason='code';else if(desc.includes('redirect'))e.reason='redirect'}catch{}}throw e}return r.json()}
export const EMAIL_PERIODS=[2,24,48,72];
export function parseEmailHours(value){if(value===undefined)return 72;const str=String(value);return EMAIL_PERIODS.includes(Number(str))&&/^(2|24|48|72)$/.test(str)?Number(str):null}
export function allowedMessage(msg,hours=72){const from=msg.from||[];const email=from.length===1&&typeof from[0]?.email==='string'?from[0].email.trim().toLowerCase():'';const date=Number(msg.date)*1000;return email.endsWith('@emmaus-scherwiller.fr')&&Number.isFinite(date)&&date>=Date.now()-hours*60*60*1000&&date<=Date.now()+5*60*1000}
export function plain(html){return String(html||'').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;/gi,' ').replace(/&amp;/gi,'&').replace(/&lt;/gi,'<').replace(/&gt;/gi,'>').replace(/&#39;/gi,"'").replace(/&quot;/gi,'"')}
export function safeGrant(g){const scopes=Array.isArray(g.scope)?g.scope:[];const identity=['openid','https://www.googleapis.com/auth/userinfo.email','https://www.googleapis.com/auth/userinfo.profile'];return g.provider==='google'&&g.grant_status==='valid'&&String(g.email||'').toLowerCase()===(process.env.ALLOWED_GOOGLE_EMAIL||'').trim().toLowerCase()&&scopes.includes(READ_SCOPE)&&scopes.every(x=>x===READ_SCOPE||identity.includes(x))}
