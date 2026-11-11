import {test} from 'node:test';
import assert from 'node:assert/strict';
import {cleanUrl,buildLink,validLink,readLinks,saveLinks,LINKS_KEY} from '../src/widgets/links.js';
test('validation des adresses et des données',()=>{
 assert.equal(cleanUrl('exemple.fr'), 'https://exemple.fr/');assert.equal(cleanUrl('https://example.test/path?a=b'), 'https://example.test/path?a=b');assert.equal(cleanUrl('http://example.test'), 'http://example.test/');
 for(const x of ['javascript:alert(1)','data:text/html,abc','https://user:pass@example.test','file:///etc/passwd','https://','https://x y.test',''])assert.equal(cleanUrl(x),null,x);
 const item=buildLink('  Mon site  ','exemple.fr','id',42);assert.deepEqual(item,{id:'id',title:'Mon site',url:'https://exemple.fr/',updatedAt:42});assert(validLink(item));assert.equal(buildLink('','example.test','id'),null);assert(!validLink({...item,url:'javascript:alert(1)'}));assert(!validLink({...item,extra:'unsafe'}));
});
test('stockage et corruption : aucune écriture aveugle',()=>{
 let raw=null;globalThis.localStorage={getItem:()=>raw,setItem:(key,val)=>{assert.equal(key,LINKS_KEY);raw=val}};
 const link=buildLink('Site','example.test','id',1);assert(saveLinks([link]));assert.deepEqual(readLinks(),{links:[link],error:false});raw='{illlisible';assert.deepEqual(readLinks(),{links:[],error:true});assert(!saveLinks([link,link]));assert.equal(raw,'{illlisible');delete globalThis.localStorage;
});
