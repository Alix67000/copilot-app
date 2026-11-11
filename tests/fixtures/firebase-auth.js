export const firebaseAuth={currentUser:null}, firestore={};let listener=null;
export function observeFirebaseUser(fn){listener=fn;setTimeout(()=>fn(firebaseAuth.currentUser),0);return()=>{listener=null}}
export async function connectFirebase(){firebaseAuth.currentUser={uid:'test-user',email:'test@example.test'};listener?.(firebaseAuth.currentUser)}
export async function disconnectFirebase(){firebaseAuth.currentUser=null;listener?.(null)}
