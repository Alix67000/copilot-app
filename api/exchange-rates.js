import {appSession} from '../server/app-auth.js';
import {ORIGIN} from '../server/nylas.js';
import {parseNavasan} from '../server/navasan.js';

// No upstream URLs, credentials, or provider response bodies in logs/errors.
let lastRequest=0,inFlight=false;
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');res.setHeader('Referrer-Policy','no-referrer');
 if(req.method!=='POST')return res.status(405).json({error:'Méthode non autorisée.'});
 if(req.headers.origin!==ORIGIN)return res.status(403).json({error:'Origine non autorisée.'});
 if(!appSession(req))return res.status(401).json({error:'Connecte-toi à l’application.'});
 const key=process.env.NAVASAN_API_KEY;if(!key)return res.status(503).json({error:'Le service de taux de change n’est pas configuré.'});
 if(inFlight||Date.now()-lastRequest<5000)return res.status(429).json({error:'Patiente quelques secondes avant de réessayer.'});
 inFlight=true;lastRequest=Date.now();
 try{
  const url=new URL('https://api.navasan.tech/latest/');url.searchParams.set('api_key',key);
  const response=await fetch(url.toString(),{headers:{Accept:'application/json'},redirect:'error',signal:AbortSignal.timeout(15000)});
  if(!response.ok){if(response.status===429||response.status===503)return res.status(503).json({error:'Navasan est indisponible ou le quota est atteint. Réessaie plus tard.'});return res.status(502).json({error:'Impossible de récupérer les taux Navasan. Vérifie la clé ou réessaie plus tard.'})}
  const data=await response.json();const result=parseNavasan(data);if(!result)return res.status(502).json({error:'Les taux fournis par Navasan sont incomplets ou invalides.'});
  return res.status(200).json(result);
 }catch{return res.status(502).json({error:'Navasan est momentanément inaccessible. Réessaie plus tard.'})}finally{inFlight=false}
}
