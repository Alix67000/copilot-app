import { ORIGIN,CALLBACK,READ_SCOPE,COOKIE,STATE_COOKIE,newState,stateCookie,session,nylas,nylasBase,allowedMessage,cookieValue } from '../server/nylas.js';
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');res.setHeader('Referrer-Policy','no-referrer');
 const action=req.query?.action;
 if(action==='start'&&req.method==='GET'){
  if(!process.env.NYLAS_API_KEY||!process.env.NYLAS_CLIENT_ID||!process.env.NYLAS_SESSION_SECRET||!process.env.ALLOWED_GOOGLE_EMAIL)return res.status(503).send('Connexion Nylas non configurée.');
  const s=newState();res.setHeader('Set-Cookie',stateCookie(s.state,s.verifier));
  const q=new URLSearchParams({client_id:process.env.NYLAS_CLIENT_ID,redirect_uri:CALLBACK,response_type:'code',provider:'google',access_type:'offline',scope:READ_SCOPE,state:s.state,code_challenge:s.challenge,code_challenge_method:'S256'});
  return res.redirect(302,nylasBase()+'/v3/connect/auth?'+q.toString());
 }
 if(action==='logout'&&req.method==='POST'){
  if(req.headers.origin!==ORIGIN)return res.status(403).json({error:'Requête non autorisée.'});
  res.setHeader('Set-Cookie',[cookieValue(COOKIE,'',0),cookieValue(STATE_COOKIE,'',0)]);return res.status(200).json({ok:true});
 }
 const s=session(req);if(!s)return res.status(401).json({error:'Connecte ton compte Gmail pour continuer.'});
 if(action==='session'&&req.method==='GET')return res.status(200).json({email:s.email});
 if(action==='messages'&&req.method==='GET'){
  try{
   const q=new URLSearchParams({limit:'50',search_query_native:'from:emmaus-scherwiller.fr after:'+Math.floor((Date.now()-72*60*60*1000)/1000)});
   const result=await nylas('/v3/grants/'+encodeURIComponent(s.grant)+'/messages?'+q);
   const messages=(Array.isArray(result.data)?result.data:[]).filter(allowedMessage).map(m=>({id:m.id,subject:m.subject||'',from:{emailAddress:{name:m.from[0].name?m.from[0].name+' <'+m.from[0].email+'>':m.from[0].email}},receivedDateTime:new Date(Number(m.date)*1000).toISOString(),bodyPreview:m.snippet||'',isRead:!m.unread}));
   return res.status(200).json({messages,more:Boolean(result.next_cursor)});
  }catch(e){return res.status(e.status===401||e.status===403?401:502).json({error:e.status===401||e.status===403?'La connexion Nylas a expiré. Reconnecte Gmail.':'Impossible de charger tes e-mails. Réessaie dans un instant.'})}
 }
 return res.status(405).json({error:'Action indisponible.'});
}
