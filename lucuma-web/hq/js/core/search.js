import {db,empName} from './db.js';
import {esc} from './util.js';
import {can} from './rbac.js';
export function searchAll(q,limit=5){
 const t=q.trim().toLowerCase();if(!t)return[];
 const m=(...a)=>a.some(x=>String(x??'').toLowerCase().includes(t));
 const S=[
  ['Documents','file','documents',can('documents'),d=>m(d.title,d.category,d.tags?.join(' ')),d=>({l:d.title,s:`${d.category} · ${d.status}`,r:'#/documents/'+d.id})],
  ['Employees','users','employees',can('employees'),e=>m(e.name,e.designation,e.dept,e.email),e=>({l:e.name,s:`${e.designation} · ${e.dept}`,r:'#/employees/'+e.id})],
  ['Projects','briefcase','projects',can('projects'),p=>m(p.name,p.client,p.desc),p=>({l:p.name,s:`${p.client} · ${p.status}`,r:'#/projects/'+p.id})],
  ['Tasks','check-c','tasks',can('tasks'),x=>m(x.title,x.id,x.labels?.join(' ')),x=>({l:x.title,s:`${x.id} · ${x.status}`,r:'#/tasks/'+x.id})],
  ['Messages','chat','messages',can('chat'),x=>m(x.text),x=>({l:x.text.slice(0,70),s:`#${x.chan} · ${empName(x.by)}`,r:'#/chat/'+x.chan})],
  ['Emails','mail','mails',can('mail'),x=>m(x.subject,x.from,x.body),x=>({l:x.subject,s:x.from.split('<')[0],r:'#/mail/'+x.id})],
  ['Meetings','calendar','meetings',true,x=>m(x.title,x.type),x=>({l:x.title,s:`${x.date} · ${x.time}`,r:'#/meetings/'+x.id})],
  ['Clients','building','clients',can('invoices')||can('crm'),x=>m(x.name,x.contact,x.industry),x=>({l:x.name,s:`${x.industry} · ${x.city}`,r:'#/invoices/clients'})],
  ['Invoices','receipt','invoices',can('invoices'),x=>m(x.no,x.client,x.status),x=>({l:x.no+' — '+x.client,s:x.status,r:'#/invoices/'+x.id})],
  ['Knowledge base','book','kb',true,x=>m(x.title,x.category,x.tags?.join(' ')),x=>({l:x.title,s:x.category,r:'#/knowledge/'+x.id})]];
 return S.filter(s=>s[3]).map(s=>({label:s[0],icon:s[1],items:db[s[2]].all().filter(s[4]).slice(0,limit).map(s[5])})).filter(g=>g.items.length);
}
export const hl=(txt,q)=>{const s=esc(txt);if(!q)return s;return s.replace(new RegExp('('+q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')','ig'),'<mark style="background:rgba(139,123,255,.45);color:#fff;border-radius:3px">$1</mark>')};
