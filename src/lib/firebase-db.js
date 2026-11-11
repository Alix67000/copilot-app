import {getFirestore} from 'firebase/firestore';
import {app} from './firebase-client.js';
export const firestore=getFirestore(app);
