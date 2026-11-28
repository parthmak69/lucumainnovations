import {db} from './db.js';
import {ctx} from './ctx.js';
import {tISO} from './util.js';
export const TYPE_MOD={Leave:'hr',Expense:'finance',Purchase:'procurement',Document:'documents',Invoice:'invoices',Project:'projects',HR:'hr',Administrative:'administration'};
const MAP={Expense:['expenses',{Approved:'Approved',Rejected:'Rejected'}],Purchase:['purchaseRequests',{Approved:'Approved',Rejected:'Rejected'}],Document:['documents',{Approved:'Approved',Rejected:'Draft'}],Invoice:['invoices',{Approved:'Sent',Rejected:'Cancelled'}],Project:['projects',{Approved:'Active',Rejected:'Cancelled'}],Leave:['leaves',{Approved:'Approved',Rejected:'Rejected'}]};
export function syncSource(a,status){const m=MAP[a.type];if(m&&a.ref&&['Approved','Rejected'].includes(status)){const to=m[1][status];db[m[0]].update(a.ref,{status:to})}}
export function setApproval(a,status,note=''){
 const by=ctx.me?.name||'You',hist=[{t:tISO(),by,text:`${status}${note?': '+note:''}`},...(a.history||[])];
 const patch={status,history:hist};if(status==='Approved')patch.stage='Done';
 if(status==='Changes Requested')patch.status='Pending Approval',patch.stage='Revision';
 db.approvals.update(a.id,patch);
 syncSource(a,status);
 ctx.log(`${status}: ${a.title}`,'Approvals');
}
export const pendingFor=()=>db.approvals.all().filter(a=>a.status==='Pending Approval');
