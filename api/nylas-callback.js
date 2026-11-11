import { ORIGIN,CALLBACK,STATE_COOKIE,cookie,verify,cookieValue,sessionCookie,nylas,safeGrant } from '../server/nylas.js';
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');res.setHeader('Referrer-Policy','no-referrer');
 const finish=(name)=>res.redirect(302,ORIGIN+'/?nylas='+name);
 if(req.method!=='GET')return res.status(405).end();
 const state=verify(cookie(req,STATE_COOKIE));res.setHeader('Set-Cookie',cookieValue(STATE_COOKIE,'',0));
 if(!state||state.kind!=='state'||typeof req.query?.state!=='string'||req.query.state!==state.state||typeof req.query?.code!=='string'||req.query.code.length>4096)return finish('echec');
 try{
  const r=await nylas('/v3/connect/token',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({client_id:process.env.NYLAS_CLIENT_ID,client_secret:process.env.NYLAS_API_KEY,grant_type:'authorization_code',code:req.query.code,redirect_uri:CALLBACK,code_verifier:state.verifier})});
  const grant=r.grant_id;if(typeof grant!=='string'||!/^[a-zA-Z0-9_-]{1,128}$/.test(grant))return finish('echec');
  const info=await nylas('/v3/grants/'+encodeURIComponent(grant));
  if(!safeGrant(info.data||{}))return finish('permissions');
  res.setHeader('Set-Cookie',[cookieValue(STATE_COOKIE,'',0),sessionCookie(grant,info.data.email.toLowerCase())]);return finish('ok');
 }catch{return finish('echec')}
}
