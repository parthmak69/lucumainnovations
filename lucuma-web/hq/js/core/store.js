// Supabase-backed HQ record collections. Browser localStorage is not used for company records.
const CFG=window.CFG||{},API=(CFG.supabaseUrl||'').replace(/\/$/,'');
const PFX='lw1:';let authCache=null;
const getAuth=()=>{if(authCache)return authCache;try{return authCache=JSON.parse(localStorage.getItem('li_auth')||'null')}catch{return null}};
const headers=()=>{const a=getAuth();if(!a?.access||!CFG.anonKey)throw new Error('No authenticated Supabase session');return{apikey:CFG.anonKey,Authorization:'Bearer '+a.access,'Content-Type':'application/json'}};
const endpoint=()=>API+'/rest/v1/hq_records';
export const collection=(name,seed=()=>[])=>{
 let data=[],ready=false;const subs=new Set();
 const saveLocal=()=>subs.forEach(f=>f());
 const persist=async(method,body,query='')=>{try{const h=headers();if(method==='POST')h.Prefer='resolution=merge-duplicates';const r=await fetch(endpoint()+query,{method,headers:h,body:body?JSON.stringify(body):undefined});if(!r.ok){const t=await r.text();throw new Error(t||'Database write failed')}return true}catch(e){console.error(`[HQ:${name}] database write failed`,e);window.dispatchEvent(new CustomEvent('hq-db-error',{detail:{module:name,message:e.message}}));return false}};
 const load=()=>data;
 return{name,all:()=>load(),get:id=>load().find(x=>x.id===id),
  add(r){r.id=r.id||crypto.randomUUID();data.unshift(r);saveLocal();persist('POST',[{module:name,record_id:r.id,payload:r}]);return r},
  update(id,p){const r=data.find(x=>x.id===id);if(r){Object.assign(r,typeof p==='function'?p(r):p);saveLocal();persist('PATCH',{payload:r},`?module=eq.${encodeURIComponent(name)}&record_id=eq.${encodeURIComponent(id)}`)}return r},
  remove(id){data=data.filter(x=>x.id!==id);saveLocal();persist('DELETE',null,`?module=eq.${encodeURIComponent(name)}&record_id=eq.${encodeURIComponent(id)}`)},
  removeMany(ids){const s=new Set(ids);data=data.filter(x=>!s.has(x.id));saveLocal();if(ids.length)persist('DELETE',null,`?module=eq.${encodeURIComponent(name)}&record_id=in.(${ids.map(encodeURIComponent).join(',')})`)},
  replace(list){data=list;saveLocal();persist('DELETE',null,`?module=eq.${encodeURIComponent(name)}`).then(()=>list.length&&persist('POST',list.map(r=>({module:name,record_id:r.id,payload:r}))) )},
  reset(){data=[];saveLocal();persist('DELETE',null,`?module=eq.${encodeURIComponent(name)}`)},on(f){subs.add(f);return()=>subs.delete(f)},
  _hydrate(list){data=list;ready=true;saveLocal()},_ready:()=>ready};
};
export const kv=(name,def)=>{const k=PFX+'kv:'+name;return{get(){try{const r=localStorage.getItem(k);return r?JSON.parse(r):structuredClone(def)}catch{return structuredClone(def)}},set(v){try{localStorage.setItem(k,JSON.stringify(v))}catch{}return v},clear(){localStorage.removeItem(k)}}};
export const resetDemoData=()=>{Object.keys(localStorage).filter(k=>k.startsWith(PFX)).forEach(k=>localStorage.removeItem(k))};
export async function hydrateCollections(collections){const h=headers(),r=await fetch(endpoint()+'?select=module,record_id,payload',{headers:h});if(!r.ok)throw new Error('HQ database read failed: '+await r.text());const rows=await r.json();for(const c of Object.values(collections)){c._hydrate(rows.filter(x=>x.module===c.name).map(x=>x.payload))}}
