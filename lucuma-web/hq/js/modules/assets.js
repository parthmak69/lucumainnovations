import {db,empName,empOpts} from '../core/db.js';
import {crudPage} from '../core/crud.js';
import {ctx} from '../core/ctx.js';
import {can} from '../core/rbac.js';
import {esc,fmtD,daysTo,tISO,nextNo} from '../core/util.js';
import {badge,toast,formDialog} from '../core/ui.js';
import {who} from '../core/cells.js';
const CATS=['Laptops','Monitors','Mobile phones','Hardware','Software licences','Office equipment'],ST=['Available','Assigned','Under Maintenance','Retired','Lost'];
export default function(host,{id}){
 const hist=(a,text)=>[{t:tISO(),by:ctx.me.name,text},...(a.history||[])];
 const c=crudPage(host,{title:'Asset management',eyebrow:'Business',subtitle:'Hardware, licences and equipment across their full lifecycle — purchase to retirement.',store:db.assets,perm:'assets',singular:'Asset',newLabel:'Add asset',logModule:'Assets',
  columns:[{key:'name',label:'Asset',render:a=>`<b>${esc(a.name)}</b><br><small class="mut">${esc(a.id)} · ${esc(a.serial)}</small>`},{key:'category',label:'Category'},{key:'assignee',label:'Assigned to',render:a=>a.assignee?who(a.assignee,{sub:false,size:26}):'<span class="dim">—</span>',csv:a=>empName(a.assignee)},{key:'loc',label:'Location'},{key:'warranty',label:'Warranty',render:a=>a.warranty?`${fmtD(a.warranty)}<br><small class="${daysTo(a.warranty)<0?'dn':daysTo(a.warranty)<60?'':'mut'}">${daysTo(a.warranty)<0?'Expired':daysTo(a.warranty)+' days left'}</small>`:'—'},{key:'status',label:'Status',render:a=>badge(a.status)}],
  fields:[{name:'name',label:'Asset name',required:true,span:2},{name:'category',label:'Category',type:'select',options:CATS},{name:'serial',label:'Serial number',required:true},{name:'purchased',label:'Purchase date',type:'date',required:true},{name:'warranty',label:'Warranty until',type:'date'},{name:'status',label:'Status',type:'select',options:ST},{name:'assignee',label:'Assigned employee',type:'select',blank:true,options:()=>empOpts()},{name:'loc',label:'Location',required:true}],
  defaults:()=>({category:'Laptops',status:'Available',loc:'Mumbai HQ',purchased:tISO().slice(0,10)}),
  beforeSave:(a,n)=>{if(n)a.id=nextNo(db.assets.all(),'AST-','id',3);if(a.assignee&&a.status==='Available')a.status='Assigned';if(!a.assignee&&a.status==='Assigned')a.status='Available';return a},
  filters:[{key:'category',label:'Category',options:CATS},{key:'status',label:'Status',options:ST}],search:['name','serial','id','loc',a=>empName(a.assignee)],sort:'id',statusField:'status',statuses:ST,assignField:'assignee',assignOptions:()=>empOpts(),
  stats:rs=>[{label:'Total assets',value:rs.length,icon:'laptop'},{label:'Assigned',value:rs.filter(a=>a.status==='Assigned').length,icon:'user'},{label:'Available',value:rs.filter(a=>a.status==='Available').length,icon:'check-c'},{label:'Warranty ending <60d',value:rs.filter(a=>a.warranty&&daysTo(a.warranty)>=0&&daysTo(a.warranty)<60).length,icon:'alert'}],
  drawerActions:a=>can('assets','edit')?[a.assignee?{label:'Return asset',icon:'restore',run:(a,h)=>{db.assets.update(a.id,{assignee:'',status:'Available',history:hist(a,'Returned by '+empName(a.assignee))});toast('Asset returned');h.close();h.refresh()}}:{label:'Assign',icon:'user',run:(a,h)=>formDialog({title:'Assign asset',w:'440px',fields:[{name:'who',label:'Employee',type:'select',options:()=>empOpts(),required:true}],submit:'Assign',onSubmit:v=>{db.assets.update(a.id,{assignee:v.who,status:'Assigned',history:hist(a,'Assigned to '+empName(v.who))});toast('Assigned to '+empName(v.who));h.close();h.refresh()}})},{label:'Log maintenance',icon:'cog',run:(a,h)=>formDialog({title:'Log maintenance',w:'480px',fields:[{name:'n',label:'Issue / work done',type:'textarea',required:true}],submit:'Log',onSubmit:v=>{db.assets.update(a.id,{status:'Under Maintenance',history:hist(a,'Maintenance: '+v.n)});toast('Marked under maintenance','warn');h.close();h.refresh()}})}]:[]});
 if(id==='new')c.form();
}
