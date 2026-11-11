import {appSession} from '../server/app-auth.js';
import { ORIGIN,CALLBACK,STATE_COOKIE,cookie,verify,cookieValue,sessionCookie,nylas,safeGrant } from '../server/nylas.js';
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');res.setHeader('Referrer-Policy','no-referrer');
 const finish=(name)=>res.redirect(302,ORIGIN+'/?nylas='+name);
 if(req.method!=='GET')return res.status(405).end();
 if(!appSession(req))return finish('session');
 const state=verify(cookie(req,STATE_COOKIE));res.setHeader('Set-Cookie',cookieValue(STATE_COOKIE,'',0));
 if(!state||state.kind!=='state'||typeof req.query?.state!=='string'||req.query.state!==state.state)return finish('session');
 if(req.query?.error)return finish(req.query.error==='access_denied'?'refus':'fournisseur');
 if(typeof req.query?.code!=='string'||!req.query.code||req.query.code.length>4096)return finish('code');
 let result;
 try{result=await nylas('/v3/connect/token',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({client_id:process.env.NYLAS_CLIENT_ID,client_secret:process.env.NYLAS_API_KEY,grant_type:'authorization_code',code:req.query.code,redirect_uri:CALLBACK,code_verifier:state.verifier})})}
 catch(e){const type=e.oauthType||'unknown',reason=e.reason||'unknown';console.error('Nylas callback: token exchange failed',Number.isInteger(e.status)?e.status:'network',type,Number.isInteger(e.oauthCode)?e.oauthCode:'no-code',reason);return finish(reason==='pkce'?'echange-pkce':reason==='code'?'echange-code':reason==='redirect'?'echange-redirection':type==='invalid_client'?'echange-client':type==='invalid_request'?'echange-requete':'echange')}
 const grant=result.grant_id;if(typeof grant!=='string'||!/^[a-zA-Z0-9_-]{1,128}$/.test(grant))return finish('grant');
 let info;try{info=await nylas('/v3/grants/'+encodeURIComponent(grant))}catch(e){console.error('Nylas callback: grant lookup failed',Number.isInteger(e.status)?e.status:'network');return finish('verification')}
 if(!safeGrant(info.data||{}))return finish('permissions');
 res.setHeader('Set-Cookie',[cookieValue(STATE_COOKIE,'',0),sessionCookie(grant,info.data.email.toLowerCase())]);return finish('ok');
}
