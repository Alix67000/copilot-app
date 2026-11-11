export const firebaseAuth={currentUser:null},app={};const authListeners=new Set(),tokenListeners=new Set();
export function observeFirebaseUser(fn){authListeners.add(fn);setTimeout(()=>fn(firebaseAuth.currentUser),0);return()=>authListeners.delete(fn)}
export function observeFirebaseTokens(fn){tokenListeners.add(fn);setTimeout(()=>fn(firebaseAuth.currentUser),0);return()=>tokenListeners.delete(fn)}
export async function connectFirebase(){firebaseAuth.currentUser={uid:'test-user',email:'test@example.test',getIdToken:async()=> 'mock-token'};for(const fn of [...authListeners,...tokenListeners])fn(firebaseAuth.currentUser)}
export async function disconnectFirebase(){firebaseAuth.currentUser=null;for(const fn of [...authListeners,...tokenListeners])fn(null)}
