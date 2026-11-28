import {db,empName,empOpts,DEPTS} from '../core/db.js';
import {crudPage} from '../core/crud.js';
import {ctx} from '../core/ctx.js';
import {can} from '../core/rbac.js';
import {esc,fmtD,dISO,tISO} from '../core/util.js';
import {badge,toast} from '../core/ui.js';
import {ring} from '../core/charts.js';
import {who} from '../core/cells.js';
const CATS=['General','HR','Management','Emergency','IT','Finance','Events'];
const st=a=>a.publish>dISO()?'Scheduled':a.expires<dISO()?'Expired':'Active';
export default function(host,{id}){
 const post=can('hr','edit')||can('administration','create');
 const c=crudPage(host,{title:'Announcements',eyebrow:'Work',subtitle:'Company-wide and department notices with scheduling, acknowledgements and analytics.',store:db.announcements,perm:'dashboard',readonly:!post,newLabel:'New announcement',singular:'Announcement',logModule:'Announcements',
  columns:[{key:'title',label:'Announcement',render:a=>`${a.pinned?'📌 ':''}<b>${esc(a.title)}</b><br><small class="mut">${esc(a.category)} · ${esc(a.audience)}</small>`},{key:'priority',label:'Priority',render:a=>badge(a.priority,a.priority==='Critical'?'bad':a.priority==='High'?'warn':'mut')},{key:'publish',label:'Publish',render:a=>fmtD(a.publish)},{key:'expires',label:'Expires',render:a=>fmtD(a.expires)},{key:'state',label:'State',render:a=>badge(st(a)),sortBy:st,csv:st},{key:'ack',label:'Acknowledged',render:a=>`${a.ack}/${a.total}`,sortBy:a=>a.ack/a.total}],
  fields:[{name:'title',label:'Title',required:true,span:2,maxlength:140},{name:'category',label:'Category',type:'select',options:CATS},{name:'audience',label:'Audience',type:'select',options:['Company-wide',...DEPTS.map(d=>d+' department')]},{name:'priority',label:'Priority',type:'select',options:['Critical','High','Medium','Low']},{name:'pinned',label:'Pin to top',type:'checkbox'},{name:'publish',label:'Publish on (schedule)',type:'date',required:true},{name:'expires',label:'Expires on',type:'date',required:true,validate:(v,o)=>o.publish&&v<o.publish?'Expiry must be after the publish date':''},{name:'body',label:'Message',type:'textarea',rows:5,required:true,span:2},{name:'attachment',label:'Attachment',type:'file',span:2}],
  defaults:()=>({category:'General',audience:'Company-wide',priority:'Medium',publish:dISO(),expires:dISO(30)}),
  beforeSave:(a,n)=>{if(n){a.by=ctx.me.id;a.ack=0;a.total=24;a.views=0;a.ackBy=[]}return a},
  filters:[{key:'category',label:'Category',options:CATS},{key:'state',label:'State',options:['Active','Scheduled','Expired'],match:(a,v)=>st(a)===v}],search:['title','body','category'],sort:'publish',dir:-1,
  stats:rs=>[{label:'Active',value:rs.filter(a=>st(a)==='Active').length,icon:'flag'},{label:'Scheduled',value:rs.filter(a=>st(a)==='Scheduled').length,icon:'clock'},{label:'Pinned',value:rs.filter(a=>a.pinned).length,icon:'pin'},{label:'Avg. acknowledgement',value:Math.round(rs.reduce((t,a)=>t+a.ack/a.total,0)/Math.max(1,rs.length)*100)+'%',icon:'check-c'}],
  rowActions:a=>[{label:a.pinned?'Unpin':'Pin',icon:'pin',run:(a,h)=>{db.announcements.update(a.id,{pinned:!a.pinned});h.refresh()}}],
  bulkExtra:[],
  detail:a=>{const done=(a.ackBy||[]).includes(ctx.me.id);return`<div class="card" style="background:var(--g)"><p style="margin:0 0 10px">${esc(a.body)}</p><div class="row sp-b"><div class="row">${ring(Math.round(a.ack/a.total*100),64)}<div><b>${a.ack} of ${a.total}</b> acknowledged<br><small class="mut">${a.views} views · by ${esc(empName(a.by))}</small></div></div><button class="btn ${done?'':'p'}" data-ackb ${done?'disabled':''}>${done?'Acknowledged ✓':'Acknowledge'}</button></div></div><hr class="s">`}});
 document.addEventListener('click',function h(e){if(!host.isConnected){document.removeEventListener('click',h);return}const b=e.target.closest('[data-ackb]');if(!b)return;const t=document.querySelector('.drawer h3')?.textContent,a=db.announcements.all().find(x=>x.title===t);if(!a)return;db.announcements.update(a.id,{ack:a.ack+1,ackBy:[...(a.ackBy||[]),ctx.me.id]});b.disabled=true;b.textContent='Acknowledged ✓';toast('Thanks — acknowledged');c.refresh()});
 if(id==='new'&&post)c.form();else if(id){const a=db.announcements.get(id);a&&c.open(a)}
}
