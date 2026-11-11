import {createRemoteJWKSet,jwtVerify} from 'jose';
import {sign,verify,cookie,cookieValue} from './nylas.js';

export const APP_COOKIE='pilotage_app';
export const FIREBASE_PROJECT='copilot-app-aa995';
const keys=createRemoteJWKSet(new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'));
const issuer=`https://securetoken.google.com/${FIREBASE_PROJECT}`;

// Verify the Firebase ID token, not the OAuth access token or client-supplied email.
export async function verifyFirebaseToken(token,keySet=keys){
 if(typeof token!=='string'||token.length>8192)throw Error('invalid-token');
 const {payload,protectedHeader}=await jwtVerify(token,keySet,{issuer,audience:FIREBASE_PROJECT,algorithms:['RS256'],requiredClaims:['exp','iat','sub','auth_time']});
 const now=Math.floor(Date.now()/1000),allowed=(process.env.ALLOWED_GOOGLE_EMAIL||'').trim().toLowerCase();
 if(!protectedHeader.kid || !allowed || typeof payload.sub!=='string'||!payload.sub||payload.sub.length>128 || typeof payload.iat!=='number'||payload.iat>now+30 || typeof payload.auth_time!=='number'||payload.auth_time>now+30 || payload.email_verified!==true || typeof payload.email!=='string' || payload.email.toLowerCase()!==allowed || payload.firebase?.sign_in_provider!=='google.com')throw Error('not-authorized');
 return {uid:payload.sub,email:allowed,expires:payload.exp};
}
export function appCookie(uid,email,tokenExpires){
 const expires=Math.min(tokenExpires*1000,Date.now()+60*60*1000);
 if(expires<=Date.now() || typeof uid!=='string'||!uid || uid.length>128)throw Error('invalid-session');
 return cookieValue(APP_COOKIE,sign({kind:'app',uid,email,exp:expires}),Math.max(0,Math.floor((expires-Date.now())/1000)));
}
export function appSession(req){
 const s=verify(cookie(req,APP_COOKIE)),allowed=(process.env.ALLOWED_GOOGLE_EMAIL||'').trim().toLowerCase();
 return s?.kind==='app'&&typeof s.uid==='string'&&s.uid.length>0&&s.uid.length<=128&&allowed&&s.email===allowed?s:null;
}
