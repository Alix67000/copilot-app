export const NOTES_KEY='pilotage.notes.v1';
export const MAX_NOTES=200;
export const MAX_NOTE_LENGTH=2000;
export function validateNoteText(text){if(typeof text!=='string')return null;const clean=text.trim();return clean.length&&clean.length<=MAX_NOTE_LENGTH?clean:null}
export function readNotes(){try{const raw=localStorage.getItem(NOTES_KEY);if(!raw)return {notes:[],error:false};const notes=JSON.parse(raw);if(!Array.isArray(notes)||notes.some(n=>!n||typeof n.id!=='string'||typeof n.text!=='string'||!Number.isFinite(n.updatedAt)||!Number.isFinite(new Date(n.updatedAt).getTime())))return {notes:[],error:true};return {notes,error:false}}catch{return {notes:[],error:true}}}
export function saveNotes(notes){try{localStorage.setItem(NOTES_KEY,JSON.stringify(notes));return true}catch{return false}}
export function createNote(text,id,now=Date.now()){const clean=validateNoteText(text);if(!clean||!id)return null;return {id,text:clean,updatedAt:now}}
export function updateNote(notes,id,text,now=Date.now()){const clean=validateNoteText(text);if(!clean||!notes.some(n=>n.id===id))return null;return notes.map(n=>n.id===id?{...n,text:clean,updatedAt:now}:n)}
