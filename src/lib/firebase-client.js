import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, onAuthStateChanged, onIdTokenChanged, signInWithPopup, signOut } from 'firebase/auth';
// Configuration web publique : la protection des données repose sur Auth et les règles Firestore.
const firebaseConfig={apiKey:'AIzaSyC3F8u3FXyHysoPLq4ezNXqO7q7wZa0oko',authDomain:'copilot-app-aa995.firebaseapp.com',projectId:'copilot-app-aa995',storageBucket:'copilot-app-aa995.firebasestorage.app',messagingSenderId:'236775067874',appId:'1:236775067874:web:0381cb23c6ea74bac0cebb'};
export const app=getApps().length ? getApp() : initializeApp(firebaseConfig);
export const firebaseAuth=getAuth(app);
export function observeFirebaseTokens(listener){return onIdTokenChanged(firebaseAuth,listener)}
export function observeFirebaseUser(listener){return onAuthStateChanged(firebaseAuth,listener)}
export function connectFirebase(){return signInWithPopup(firebaseAuth,new GoogleAuthProvider())}
export function disconnectFirebase(){return signOut(firebaseAuth)}
