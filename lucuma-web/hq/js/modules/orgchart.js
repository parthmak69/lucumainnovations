import {db,emp,empName,DEPTS} from '../core/db.js';
import {esc,avatar,$,$$} from '../core/util.js';
import {ic} from '../core/icons.js';
import {badge,tabs} from '../core/ui.js';
export default function(host){
 host.innerHTML=`<div class="ph"><div><div class="eyebrow">People</div><h1>Organisation chart</h1><p>Reporting hierarchy, departments and teams. Click a person to open their profile.</p></div></div><div class="row"><div id="tb"></div><div class="sbox" style="position:relative;min-width:220px"><input id="oq" placeholder="Find a person…"></div></div><div class="card" style="overflow:auto"><div id="oc"></div></div>`;
 const E=()=>db.employees.all().filter(e=>e.status!=='Exited'),collapsed=new Set();let q='';
 const node=e=>`<div class="onode ${q&&e.name.toLowerCase().includes(q)?'hit':''}" data-id="${e.id}">${avatar(e.name,40)}<div style="margin-top:6px"><b>${esc(e.name)}</b></div><small class="mut">${esc(e.designation)}</small><div style="margin-top:4px"><span class="chip">${esc(e.dept)}</span></div></div>`;
 const tree=(e,all)=>{const kids=all.filter(x=>x.mgr===e.id);return`<li>${node(e)}${kids.length?`<button class="btn sm ghost" data-t="${e.id}" style="margin-top:4px">${collapsed.has(e.id)?`${ic('plus')}${kids.length}`:ic('chev-d')}</button>`:''}${kids.length&&!collapsed.has(e.id)?`<ul>${kids.map(k=>tree(k,all)).join('')}</ul>`:''}</li>`};
 const T={
  hier:()=>{const all=E();return`<div class="tree"><ul>${all.filter(e=>!e.mgr).map(r=>tree(r,all)).join('')}</ul></div>`},
  dept:()=>`<div class="g3">${DEPTS.map(d=>{const m=E().filter(e=>e.dept===d),head=m.find(e=>!m.some(x=>x.id===e.mgr))||m[0];return m.length?`<div class="card" style="background:var(--g)"><div class="hd"><h3>${d}</h3><div class="sp"><span class="chip">${m.length}</span></div></div><small class="mut">Department manager</small><div class="li click" data-id="${head.id}">${avatar(head.name,34)}<div class="grow"><b>${esc(head.name)}</b><br><small class="mut">${esc(head.designation)}</small></div></div><hr class="s">${m.filter(x=>x!==head).map(x=>`<div class="li click" data-id="${x.id}">${avatar(x.name,28)}<div class="grow">${esc(x.name)}<br><small class="mut">${esc(x.designation)}</small></div></div>`).join('')}</div>`:''}).join('')}</div>`,
  team:()=>{const all=E(),leads=all.filter(e=>all.some(x=>x.mgr===e.id));return`<div class="g3">${leads.map(l=>`<div class="card" style="background:var(--g)"><div class="row">${avatar(l.name,38)}<div><b>${esc(l.name)}</b><br><small class="mut">Team lead · ${esc(l.designation)}</small></div></div><hr class="s">${all.filter(x=>x.mgr===l.id).map(x=>`<div class="li click" data-id="${x.id}">${avatar(x.name,26)}<div class="grow">${esc(x.name)}<br><small class="mut">${esc(x.designation)}</small></div></div>`).join('')}</div>`).join('')}</div>`}};
 let cur='hier';const draw=()=>{$('#oc',host).innerHTML=T[cur]()};
 tabs($('#tb',host),[['hier','Reporting hierarchy','sitemap'],['dept','Departments','building'],['team','Teams','users']],{onChange:k=>{cur=k;draw()}});draw();
 host.onclick=e=>{const t=e.target.closest('[data-t]');if(t){const id=t.dataset.t;collapsed.has(id)?collapsed.delete(id):collapsed.add(id);draw();return}const n=e.target.closest('[data-id]');if(n)location.hash='#/employees/'+n.dataset.id};
 $('#oq',host).oninput=e=>{q=e.target.value.toLowerCase();draw()};
}
