import {kv} from './store.js';
import {ctx} from './ctx.js';
export const MODULES=[['dashboard','Dashboard'],['documents','Documents'],['employees','Employees'],['hr','HR'],['projects','Projects'],['tasks','Tasks'],['finance','Finance'],['invoices','Invoices'],['crm','CRM'],['procurement','Procurement'],['assets','Assets'],['support','Support'],['mail','Mail'],['chat','Chat'],['analytics','Analytics'],['administration','Administration']];
export const ACTIONS=[['view','View','v'],['create','Create','c'],['edit','Edit','e'],['delete','Delete','d'],['approve','Approve','a'],['export','Export','x'],['manage','Manage','m']];
const M=MODULES.map(m=>m[0]),all=s=>Object.fromEntries(M.map(m=>[m,s])),FULL='vcedaxm';
export const BUILTIN=[
 {id:'super_admin',label:'Super Administrator',desc:'Unrestricted access to every module and setting.',builtin:1},
 {id:'admin',label:'Administrator',desc:'Full operational access; cannot manage security policy ownership.',builtin:1},
 {id:'hr_manager',label:'HR Manager',desc:'People, leave, attendance, onboarding and HR documents.',builtin:1},
 {id:'finance_manager',label:'Finance Manager',desc:'Expenses, invoices, procurement approvals and financial reports.',builtin:1},
 {id:'project_manager',label:'Project Manager',desc:'Projects, tasks, timelines, resources and delivery reports.',builtin:1},
 {id:'department_manager',label:'Department Manager',desc:'Manages their team, approves team requests.',builtin:1},
 {id:'employee',label:'Employee',desc:'Day-to-day work: tasks, documents, leave, expenses, support.',builtin:1},
 {id:'intern',label:'Intern',desc:'Limited access: assigned tasks, learning material, chat.',builtin:1}];
export const DEFAULTS={
 super_admin:all(FULL),
 admin:{...all(FULL),administration:'vcedax'},
 hr_manager:{...all(''),dashboard:'vx',documents:'vcedax',employees:FULL,hr:FULL,projects:'v',tasks:'vce',procurement:'v',assets:'vce',support:'vcx',mail:'vc',chat:'vc',analytics:'vx'},
 finance_manager:{...all(''),dashboard:'vx',documents:'vcex',employees:'v',hr:'v',projects:'v',tasks:'vc',finance:FULL,invoices:FULL,crm:'v',procurement:'vcedax',assets:'v',support:'vc',mail:'vc',chat:'vc',analytics:'vx'},
 project_manager:{...all(''),dashboard:'vx',documents:'vcex',employees:'v',hr:'vc',projects:FULL,tasks:FULL,finance:'vc',invoices:'v',crm:'v',procurement:'vc',assets:'v',support:'vc',mail:'vc',chat:'vc',analytics:'vx'},
 department_manager:{...all(''),dashboard:'v',documents:'vce',employees:'v',hr:'vca',projects:'vce',tasks:'vcea',finance:'vc',procurement:'vca',assets:'v',support:'vc',mail:'vc',chat:'vc',analytics:'v'},
 employee:{...all(''),dashboard:'v',documents:'vc',employees:'v',hr:'vc',projects:'v',tasks:'vce',finance:'vc',procurement:'vc',assets:'v',support:'vc',mail:'vc',chat:'vc'},
 intern:{...all(''),dashboard:'v',documents:'v',employees:'v',hr:'v',projects:'v',tasks:'vce',support:'vc',mail:'vc',chat:'vc'}};
const store=kv('rbac',{matrix:{},custom:[],viewAs:null,assign:{}});
let S=store.get();const subs=new Set();
const save=()=>{store.set(S);subs.forEach(f=>f())};
export const rbac={
 on:f=>{subs.add(f)},
 roles:()=>[...BUILTIN,...S.custom],
 role:id=>rbac.roles().find(r=>r.id===id),
 label:id=>rbac.role(id)?.label||id,
 bits(role,mod){return S.matrix[role]?.[mod]??DEFAULTS[role]?.[mod]??(S.custom.find(c=>c.id===role)?DEFAULTS[S.custom.find(c=>c.id===role).base]?.[mod]:'')??''},
 has(role,mod,act){const k=ACTIONS.find(a=>a[0]===act)?.[2];return rbac.bits(role,mod).includes(k)},
 set(role,mod,act,on){const k=ACTIONS.find(a=>a[0]===act)[2];let b=rbac.bits(role,mod).split('').filter(x=>x!==k);if(on)b.push(k);if(act==='view'&&!on)b=[];if(on&&act!=='view'&&!b.includes('v'))b.push('v');(S.matrix[role]=S.matrix[role]||{})[mod]=ACTIONS.map(a=>a[2]).filter(c=>b.includes(c)).join('');save()},
 setAll(role,mod,on){(S.matrix[role]=S.matrix[role]||{})[mod]=on?FULL:'';save()},
 addCustom(label,desc,base){const id='custom_'+label.toLowerCase().replace(/[^a-z0-9]+/g,'_')+'_'+Math.random().toString(36).slice(2,5);S.custom.push({id,label,desc,base:base||'employee'});save();return id},
 removeCustom(id){S.custom=S.custom.filter(r=>r.id!==id);delete S.matrix[id];save()},
 resetRole(id){delete S.matrix[id];save()},
 viewAs:()=>S.viewAs,
 setViewAs(id){S.viewAs=id||null;save()},
 canSwitch:()=>['super_admin','admin'].includes(ctx.session?.role),
 effective:()=>(rbac.canSwitch()&&S.viewAs)||ctx.session?.role||'employee'};
export const can=(mod,act='view')=>rbac.has(rbac.effective(),mod,act);
// Map the live Supabase profile role onto the workspace role model.
export function mapRole(p){
 const r=String(p?.role||'member').toLowerCase(),l=String(p?.role_label||'').toLowerCase();
 if(r==='ceo')return'super_admin';if(r==='admin')return'admin';if(r==='cto')return'department_manager';
 if(/intern/.test(l))return'intern';if(/hr|human/.test(l))return'hr_manager';if(/financ|account/.test(l))return'finance_manager';if(/project|delivery/.test(l))return'project_manager';
 if(r==='member')return'employee';return'department_manager';
}
