import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseNavasan} from '../server/navasan.js';
import {validExchange,calculateExchange,quoteTime} from '../src/widgets/exchange.js';
const stamp=1700000000;
const fake={usd:{value:'100',timestamp:stamp},eur:{value:'120',timestamp:stamp+5},afn:{value:'2',timestamp:stamp+10},api_key:'SECRET-FAUX'};
test('récupération de trois cours fictifs, pas de clé ni de champs inattendus',()=>{
 const result=parseNavasan(fake);assert(result);assert(!JSON.stringify(result).includes('SECRET-FAUX'));assert.deepEqual(result.quotes.usd,{toman:100,timestamp:stamp});assert(validExchange(result));
 const rates=calculateExchange(result);assert.deepEqual(rates.eur,{USD:1.2,AFN:60,IRR:1200});assert.deepEqual(rates.usd,{EUR:100/120,AFN:50,IRR:1000});assert.equal(quoteTime(result),stamp*1000);
});
test('refuser données incomplètes, zéro et chiffres invalides',()=>{
 for(const value of [null,0,-5,'','invalid','Infinity','1e6','1,000'])assert.equal(parseNavasan({...fake,usd:{value,timestamp:stamp}}),null);
 assert.equal(parseNavasan({...fake,eur:undefined}),null);assert.equal(parseNavasan({...fake,afn:{value:'3',timestamp:0}}),null);assert.equal(validExchange({source:'Navasan',fetchedAt:1e30,quotes:{}}),false);assert.equal(calculateExchange(null),null);
});
