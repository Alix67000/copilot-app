import {readdir,readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {loadEnv} from 'vite';

// Only scan public build output. Never print secret values or file contents.
const serverSecrets=['GEMINI_API_KEY','NYLAS_API_KEY','NYLAS_SESSION_SECRET','GITHUB_TOKEN'];
export async function checkClientSecrets(directory,env){
 const problems=[];
 if(Object.keys(env).some(k=>/^VITE_.*(?:GEMINI|NYLAS).*(?:KEY|SECRET|TOKEN)/i.test(k)))problems.push('Variable sensible exposable par Vite détectée.');
 const secrets=serverSecrets.map(name=>({name,value:env[name]})).filter(x=>typeof x.value==='string'&&x.value.length>=12);
 async function scan(dir){for(const entry of await readdir(dir,{withFileTypes:true})){const p=join(dir,entry.name);if(entry.isDirectory())await scan(p);else if(entry.isFile()){
  const data=await readFile(p);for(const {name,value} of secrets){if(data.includes(Buffer.from(value))||data.includes(Buffer.from(encodeURIComponent(value))))problems.push(`Une valeur sensible ${name} apparaît dans les fichiers publics.`)}
  if(data.includes(Buffer.from('generativelanguage.googleapis.com')))problems.push('Un accès direct à Gemini apparaît dans les fichiers publics.');
 }}}
 await scan(directory);return [...new Set(problems)];
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const env=loadEnv(process.env.MODE||'production',process.cwd(),'');
 const problems=await checkClientSecrets('dist',env);
 if(problems.length){for(const p of problems)console.error('Sécurité : '+p);process.exitCode=1}
 else {console.log('Sécurité : aucun secret serveur disponible détecté dans le client ; aucun appel Gemini direct.');console.log(env.GEMINI_API_KEY?.length>=12?'Clé Gemini serveur : comparaison avec les fichiers publics effectuée.':'Clé Gemini serveur absente du contexte de compilation : comparaison de sa valeur impossible.')}
}
