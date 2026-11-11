import React,{useEffect,useRef,useState} from 'react';
import {collection,onSnapshot} from 'firebase/firestore';
import {observeFirebaseUser,connectFirebase,disconnectFirebase,firestore,firebaseAuth} from '../lib/firebase-client.js';
import {COLLECTIONS,firestoreWrite} from '../lib/sync-store.js';
import {createLocalBackup} from '../lib/sync-backup.js';
import {syncCycle,snapshotLocal} from '../lib/sync-cycle.js';
import {prepareSync} from '../lib/sync-engine.js';
import {recordsEqual} from '../lib/sync-records.js';
const OWNER='pilotage.sync.owner.v1';
const labels={idle:'Non activée',connecting:'Connexion à Firebase…',waiting:'En attente de connexion au serveur',working:'Synchronisation en cours…',synced:'Synchronisé avec Firebase',conflict:'Conflit détecté : synchronisation suspendue, aucune version n’a été choisie automatiquement.', 'invalid-local':'Certaines données locales sont illisibles : synchronisation suspendue.', 'invalid-baseline':'Historique local illisible : synchronisation suspendue.', 'recovery-required':'Synchronisation interrompue pendant l’écriture locale. Ne videz pas les données du navigateur ; une récupération est nécessaire.', 'local-changed':'Données modifiées pendant la synchronisation : nouvelle tentative…', 'refresh-required':'Les données sont enregistrées ; recharge la page pour actualiser l’affichage.', error:'Synchronisation impossible. Vérifie les règles Firebase et la connexion Internet.'};
function readOwner(){try{return localStorage.getItem(OWNER)}catch{return null}}
export default function SyncAccount({visible,onApplied}){
 const [user,setUser]=useState(undefined),[busy,setBusy]=useState(false),[error,setError]=useState(''),[owner,setOwner]=useState(readOwner),[backup,setBackup]=useState(false),[status,setStatus]=useState('idle'),[conflicts,setConflicts]=useState([]);
 const remoteRef=useRef(null),scheduleRef=useRef(null);const [conflictBackup,setConflictBackup]=useState(false);
 const onAppliedRef=useRef(onApplied);onAppliedRef.current=onApplied;
 useEffect(()=>observeFirebaseUser(setUser),[]);
 async function run(action){setBusy(true);setError('');try{await action()}catch(e){if(e?.code==='auth/popup-closed-by-user')setError('Connexion annulée.');else if(e?.code==='auth/unauthorized-domain')setError('Ce domaine doit être autorisé dans Firebase Authentication.');else setError('Connexion impossible. Vérifie la configuration Firebase et réessaie.')}finally{setBusy(false)}}
 function exportBackup(){try{const json=JSON.stringify(createLocalBackup(localStorage),null,2),url=URL.createObjectURL(new Blob([json],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='pilotage-sauvegarde-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);setBackup(true);setError('')}catch{setError('Sauvegarde impossible sur cet appareil. Synchronisation non activée.')}}
 function activate(){if(!backup)return;try{if(readOwner()&&readOwner()!==user.uid)throw Error();localStorage.setItem(OWNER,user.uid);setOwner(user.uid);setError('')}catch{setError('Impossible de préparer la synchronisation locale.')}}
 useEffect(()=>{
  if(!user || owner!==user.uid){setStatus('idle');return}
  let cancelled=false,timer=null,running=false,pending=false;const data={},ready={};
  setStatus('connecting');
  function schedule(){if(cancelled)return;if(running){pending=true;return}clearTimeout(timer);timer=setTimeout(cycle,900)}
  scheduleRef.current=schedule;
  async function cycle(){
   if(cancelled||COLLECTIONS.some(c=>!ready[c]))return;
   running=true;setStatus('working');
   try {
    const fn=()=>syncCycle({storage:localStorage,uid:user.uid,remote:COLLECTIONS.flatMap(c=>data[c]),write:r=>firestoreWrite(firestore,user.uid,r.collection,r.id,r),isActive:()=>!cancelled&&firebaseAuth.currentUser?.uid===user.uid&&readOwner()===user.uid,onApplied:()=>onAppliedRef.current?.()});
    // Cross-tab cycles must not overlap. Refuse rather than silently racing on unsupported browsers.
    if(!navigator.locks)throw Error('locks-unavailable');
    const result=await navigator.locks.request('pilotage-sync-'+user.uid,{mode:'exclusive'},fn);
    if(cancelled)return;
    setStatus(result.status);setConflicts(result.conflicts||[]);
    if(result.status==='local-changed')pending=true;
   }catch(e){if(!cancelled){if(e?.message==='sync-conflict'){pending=true;setStatus('waiting')}else {setStatus('error');setError(e?.message==='locks-unavailable'?'Ce navigateur ne permet pas de synchroniser sans risque entre onglets. Utilise une version récente de Chrome ou Edge.':e?.code==='permission-denied'?'Accès refusé par Firestore : vérifie le compte et les règles de sécurité.':'Synchronisation interrompue. Les données locales sont conservées.')}}}
   finally{running=false;if(pending&&!cancelled){pending=false;schedule()}}
  }
  const unsub=COLLECTIONS.map(c=>onSnapshot(collection(firestore,'pilotage_users',user.uid,c),{includeMetadataChanges:true},snap=>{
   if(cancelled)return;
   if(snap.metadata.fromCache || snap.metadata.hasPendingWrites){ready[c]=false;setStatus('waiting');return}
   data[c]=snap.docs.map(d=>({collection:c,id:d.id,...d.data()}));ready[c]=true;if(COLLECTIONS.every(k=>ready[k]))remoteRef.current=COLLECTIONS.flatMap(k=>data[k]);schedule();
  },e=>{ready[c]=false;setStatus('error');setError(e?.code==='permission-denied'?'Accès refusé par Firestore : vérifie le compte et les règles de sécurité.':'Connexion à Firebase interrompue. Les données locales sont conservées.')}));
  function localChanged(){schedule()}window.addEventListener('pilotage-local-change',localChanged);window.addEventListener('storage',localChanged);
  return()=>{cancelled=true;remoteRef.current=null;scheduleRef.current=null;clearTimeout(timer);unsub.forEach(fn=>fn());window.removeEventListener('pilotage-local-change',localChanged);window.removeEventListener('storage',localChanged)};
 },[user?.uid,owner]);
 function exportConflicts(){try{const blob=new Blob([JSON.stringify({format:'pilotage-conflicts',version:1,createdAt:new Date().toISOString(),conflicts},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='pilotage-conflits-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);setConflictBackup(true)}catch{setError('Impossible de sauvegarder les versions en conflit.')}}
 async function resolveConflict(conflict,choice){
  if(!conflictBackup||!window.confirm(choice==='local'?'Remplacer la version Firebase par celle de cet appareil ? Les deux versions ont été proposées au téléchargement.':'Remplacer la version de cet appareil par la version Firebase ? Les deux versions ont été proposées au téléchargement.'))return;
  setBusy(true);setError('');
  try{await navigator.locks.request('pilotage-sync-'+user.uid,{mode:'exclusive'},async()=>{
   if(firebaseAuth.currentUser?.uid!==user.uid||!remoteRef.current)throw Error('unavailable');
   const key='pilotage.sync.base.v1.'+user.uid,base=JSON.parse(localStorage.getItem(key)||'{}');
   const current=await prepareSync(snapshotLocal(localStorage),remoteRef.current,base);
   const match=current.conflicts.find(c=>c.key===conflict.key);
   if(!match||!recordsEqual(match.local,conflict.local)||!recordsEqual(match.remote,conflict.remote)||!recordsEqual(match.base,conflict.base))throw Error('changed');
   base[conflict.key]={data:choice==='local'?match.remote:match.local};
   localStorage.setItem(key,JSON.stringify(base));
  });setConflictBackup(false);scheduleRef.current?.();}
  catch{setError('Le conflit a changé ou la connexion est indisponible. Actualise et réessaie sans effacer tes données.')}
  finally{setBusy(false)}
 }
 return <div hidden={!visible}><section className="card settings-card"><div className="card-head"><div><div className="section-kicker">SYNCHRONISATION</div><h2>Compte de synchronisation</h2><p>Connexion indépendante de Gmail/Nylas, sans accès aux e-mails.</p></div></div><div className="settings-row"><div className="grow"><strong>Compte Google</strong><p>{user===undefined?'Vérification de la connexion…':user?user.email:'Non connecté'}</p><p role="status">{labels[status]||status}</p></div>{user?<button className="secondary" disabled={busy||status==='working'} onClick={()=>run(disconnectFirebase)}>Déconnecter</button>:<button className="primary" disabled={busy||user===undefined} onClick={()=>run(connectFirebase)}>Se connecter avec Google</button>}</div>
 {user&&owner&&owner!==user.uid&&<div className="notice" role="alert">Cet appareil contient des données associées à un autre compte. La synchronisation est bloquée pour éviter de mélanger les données. Reconnecte le compte initial.</div>}
 {user&&(!owner||owner===user.uid)&&<div className="notice neutral"><strong>{owner?'Sauvegarde locale':'Avant la première synchronisation'}</strong><p>Le fichier contient tes notes, tâches, échéances et réglages, sans e-mails ni mots de passe. Il n’est pas chiffré : conserve-le dans un endroit sûr.</p><button className="secondary" onClick={exportBackup}>Télécharger une sauvegarde</button>{!owner&&<><p>Après sauvegarde, l’activation ajoute les données locales à ton espace Firebase. Les divergences ne sont pas écrasées automatiquement.</p><button className="primary" disabled={!backup} onClick={activate}>Activer la synchronisation</button></>}</div>}
 {conflicts.length>0&&<div className="notice" role="alert"><strong>{conflicts.length} élément(s) en conflit</strong><p>Télécharge les deux versions, puis choisis celle à conserver pour chaque élément. Le choix de l’une remplacera l’autre après synchronisation.</p><button className="secondary" onClick={exportConflicts}>Sauvegarder les versions en conflit</button>{conflicts.map(c=><div key={c.key} className="sync-conflict"><p><strong>{c.key.split('/')[0]}</strong></p><p>Cet appareil : <code>{JSON.stringify(c.local)}</code></p><p>Firebase : <code>{JSON.stringify(c.remote)}</code></p><button className="secondary" disabled={!conflictBackup||busy} onClick={()=>resolveConflict(c,'local')}>Garder cet appareil</button>{' '}<button className="secondary" disabled={!conflictBackup||busy} onClick={()=>resolveConflict(c,'remote')}>Garder Firebase</button></div>)}</div>}
 {error&&<div className="notice" role="alert">{error}</div>}<div className="widget-settings-note">Firebase reçoit tes données de travail, y compris les tâches ou échéances issues d’analyses d’e-mails. Elles ne sont pas chiffrées de bout en bout. La déconnexion ne supprime pas la copie locale.</div></section></div>
}
