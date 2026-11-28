import {collection,kv,hydrateCollections} from './store.js';
import {tISO,uid} from './util.js';import {ctx} from './ctx.js';
// All HQ business collections start empty and are hydrated exclusively from Supabase.
const names=['employees','projects','tasks','clients','invoices','expenses','leads','vendors','purchaseRequests','assets','tickets','announcements','documents','approvals','leaves','holidays','meetings','events','channels','messages','mails','kb','workflows','contracts','okrs','risks','subscriptions','bookings','travel','decisions','policies','certIssued','notifications','activity','auditLog','attendance','reviews','recognition','hrRequests','checklists'];
export const db=Object.fromEntries(names.map(k=>[k,collection(k)]));
export const initDB=()=>hydrateCollections(db);
export const emp=id=>db.employees.get(id);export const empName=id=>emp(id)?.name||id||'—';
export const empOpts=(f=e=>e.status!=='Exited')=>db.employees.all().filter(f).map(e=>({v:e.id,l:e.name}));
export const projOpts=()=>db.projects.all().map(p=>({v:p.id,l:p.name}));export const proj=id=>db.projects.get(id);
export const clientOpts=()=>db.clients.all().map(c=>({v:c.name,l:c.name}));
export const DEPTS=['Leadership','Engineering','Design','Delivery','HR','Finance','Sales & Marketing','IT & Support'];
const rec=kv('recent',[]),fav=kv('favs',{});
export const recent={list:()=>rec.get(),add(type,id,label,route){let l=rec.get().filter(x=>!(x.type===type&&x.id===id));l.unshift({type,id,label,route,t:tISO()});rec.set(l.slice(0,15))}};
export const favs={all:()=>fav.get(),has:(t,i)=>!!fav.get()[t+':'+i],toggle(type,id,label,route){const f=fav.get(),k=type+':'+id;if(f[k])delete f[k];else f[k]={type,id,label,route};fav.set(f);return!!f[k]}};
ctx.log=(text,module)=>{const u=ctx.me?.name||'You';db.activity.add({id:uid('AC'),cat:module,who:ctx.me?.id,verb:text,what:'',t:tISO()});db.auditLog.add({id:uid('AUD'),user:u,action:text,module,resource:'',t:tISO(),status:'Success'})};
