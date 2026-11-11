import {ORIGIN,COOKIE,STATE_COOKIE,cookieValue} from '../server/nylas.js';
import {APP_COOKIE,appCookie,verifyFirebaseToken} from '../server/app-auth.js';
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST')return res.status(405).json({error:'Méthode non autorisée.'});
 if(req.headers.origin!==ORIGIN)return res.status(403).json({error:'Origine non autorisée.'});
 if(req.query?.action==='logout'){
  res.setHeader('Set-Cookie',[cookieValue(APP_COOKIE,'',0),cookieValue(COOKIE,'',0),cookieValue(STATE_COOKIE,'',0)]);
  return res.status(200).json({ok:true});
 }
 if(req.query?.action!=='login')return res.status(400).json({error:'Action non autorisée.'});
 const match=String(req.headers.authorization||'').match(/^Bearer ([A-Za-z0-9._-]+)$/);
 if(!match)return res.status(401).json({error:'Connexion Google requise.'});
 try{const identity=await verifyFirebaseToken(match[1]);res.setHeader('Set-Cookie',appCookie(identity.uid,identity.email,identity.expires));return res.status(200).json({ok:true})}
 catch{return res.status(401).json({error:'Compte non autorisé ou connexion invalide.'})}
}
