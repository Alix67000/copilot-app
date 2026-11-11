// Navasan's usd, eur and afn cash rates are quoted in toman; 1 toman = 10 IRR.
// Return only the fields required by the client; never proxy unknown provider fields.
export function parseNavasan(data){
 const quotes={};
 for(const name of ['usd','eur','afn']){
  const item=data?.[name];const raw=item?.value;
  if(!(typeof raw==='string'&&/^\d+(?:\.\d+)?$/.test(raw))&&!(typeof raw==='number'&&Number.isFinite(raw)))return null;
  const toman=Number(raw),timestamp=Number(item?.timestamp);
  if(!Number.isFinite(toman)||toman<=0||toman>1e12||!Number.isSafeInteger(timestamp)||timestamp<=0||timestamp>253402300799)return null;
  quotes[name]={toman,timestamp};
 }
 return {source:'Navasan',quotes,fetchedAt:Date.now()};
}
