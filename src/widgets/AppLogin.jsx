import React,{useEffect,useRef,useState} from 'react';
import {connectFirebase,disconnectFirebase,observeFirebaseTokens} from '../lib/firebase-client.js';
async function sessionFetch(url,options){const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),15000);try{return await fetch(url,{...options,signal:controller.signal})}finally{clearTimeout(timer)}}

export default function AppLogin({children}){
 const [state,setState]=useState('checking'),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
 const closing=useRef(false),pending=useRef(new Set()),closingPromise=useRef(null);
 async function clearServerSession(){
  if(closingPromise.current)return closingPromise.current;
  closing.current=true;
  closingPromise.current=(async()=>{
   await Promise.allSettled([...pending.current]);
   const r=await sessionFetch('/api/app-session?action=logout',{method:'POST'});
   if(!r.ok)throw Error('logout-failed');
  })();
  try{await closingPromise.current}finally{closingPromise.current=null}
 }
 useEffect(()=>{
  let stopped=false,sequence=0,current=null;
  function exchange(user){
   const turn=++sequence;current=user;
   if(!user){
    if(!stopped){setState('signed-out');setMessage('')}
    // A sign-out in another tab must not leave an app cookie behind. Wait for
    // any in-flight token exchanges before clearing it, so they cannot restore it.
    clearServerSession().catch(()=>{if(!stopped)setMessage('Déconnexion serveur non confirmée. Reconnecte-toi puis déconnecte-toi à nouveau.');});
    return;
   }
   if(closing.current)return;
   const task=(async()=>{try{
    const token=await user.getIdToken();
    const r=await sessionFetch('/api/app-session?action=login',{method:'POST',headers:{Authorization:'Bearer '+token}});
    if(!r.ok)throw Error(r.status===401?'Compte non autorisé ou session invalide. Vérifie que tu utilises le compte Google autorisé.':'Le serveur est momentanément indisponible.');
    if(!stopped&&!closing.current&&turn===sequence){setState('ready');setMessage('')}
   }catch(e){if(!stopped&&!closing.current&&turn===sequence){setState('error');setMessage(e.message||'Connexion impossible.')}}})();
   pending.current.add(task);task.finally(()=>pending.current.delete(task));
  }
  const stop=observeFirebaseTokens(exchange);
  const timer=setInterval(()=>{if(current)exchange(current)},10*60*1000);
  return()=>{stopped=true;sequence++;clearInterval(timer);stop()};
 },[]);
 async function login(){setBusy(true);setMessage('');try{if(closingPromise.current)await closingPromise.current;closing.current=false;await connectFirebase()}catch(e){setMessage(e?.code==='auth/popup-closed-by-user'?'Connexion annulée.':'Connexion Google impossible. Vérifie les fenêtres contextuelles et réessaie.');setState('signed-out')}finally{setBusy(false)}}
 async function logout(){setBusy(true);let failed=false;try{await clearServerSession()}catch{failed=true}try{await disconnectFirebase()}catch{failed=true}setBusy(false);if(failed)setMessage('La déconnexion complète n’a pas pu être confirmée. Réessaie avec une connexion Internet.')}
 if(state==='ready')return children({logout,busy});
 return <main className="login-screen"><section className="login-card"><div className="login-mark">p<span>.</span></div><div className="section-kicker">POSTE DE PILOTAGE</div><h1>Bienvenue dans ton espace</h1><p>Connecte-toi avec le compte Google autorisé pour accéder à l’application et à tes données.</p>{state==='checking'?<p role="status">Vérification de la connexion…</p>:<><button className="primary" type="button" disabled={busy} onClick={login}>Se connecter avec Google</button>{state==='error'&&<button className="secondary" type="button" disabled={busy} onClick={logout}>Changer de compte</button>}</>}{message&&<p className="login-error" role="alert">{message}</p>}<small>Cette connexion ne donne pas accès à Gmail. L’autorisation Gmail reste gérée séparément par Nylas.</small></section></main>
}
