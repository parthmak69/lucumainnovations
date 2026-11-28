import {db} from '../core/db.js';
import {kv} from '../core/store.js';
import {esc,ago,fmtD,dISO,groupBy} from '../core/util.js';
import {ic} from '../core/icons.js';
import {badge,toast,sw,empty,confirmDlg} from '../core/ui.js';
const CATS=['Tasks','Projects','Messages','Mail','Meetings','HR','Finance','Approvals','Security','Announcements'];
const prefs=kv('notifprefs',Object.fromEntries(CATS.map(c=>[c,{app:true,email:c!=='Messages',push:['Approvals','Security','Tasks'].includes(c)}])));
export default function(host){
 let cat='',tab='all',group=true;
 const draw=()=>{
  const all=db.notifications.all(),vis=all.filter(n=>(!cat||n.cat===cat)&&(tab==='all'||(tab==='unread'?!n.read:n.read)));
  const g=group?Object.entries(groupBy(vis,n=>n.t.slice(0,10)===dISO()?'Today':'Earlier')):[['All',vis]];
  host.innerHTML=`<div class="ph"><div><div class="eyebrow">Workspace</div><h1>Notification center</h1><p>${all.filter(n=>!n.read).length} unread · ${all.length} total</p></div><div class="acts"><button class="btn" id="mr">${ic('check')}Mark all as read</button><button class="btn" id="pf">${ic('cog')}Preferences</button></div></div>
  <div class="card"><div class="row sp-b" style="margin-bottom:12px"><div class="tabs">${[['all','All'],['unread','Unread'],['read','History']].map(([k,l])=>`<button data-tab="${k}" class="${tab===k?'on':''}">${l}</button>`).join('')}</div><div class="row"><select id="cf" style="width:auto"><option value="">All categories</option>${CATS.map(c=>`<option ${c===cat?'selected':''}>${c}</option>`).join('')}</select><label class="row" style="gap:6px"><input type="checkbox" id="gr" ${group?'checked':''}> Group by day</label></div></div>
  ${vis.length?g.map(([k,l])=>`<h4 class="mut" style="margin:14px 0 4px;font-size:12px;letter-spacing:.1em;text-transform:uppercase">${k}</h4><div class="list">${l.map(n=>`<div class="li"><span class="chip">${n.cat}</span><div class="grow ${n.read?'mut':''}"><b style="font-weight:${n.read?500:700}">${esc(n.text)}</b><br><small class="dim">${ago(n.t)}</small></div>${badge(n.priority,n.priority==='High'?'bad':n.priority==='Medium'?'warn':'mut')}<button class="btn sm ghost" data-r="${n.id}">${n.read?'Mark unread':'Mark read'}</button><button class="btn sm ghost ico" data-x="${n.id}" aria-label="Dismiss">${ic('x')}</button></div>`).join('')}</div>`).join(''):empty('bell','You’re all caught up','No notifications match this filter.')}</div>`;
 };
 draw();
 host.onclick=e=>{const t=e.target;let b;
  if(t.closest('#mr')){db.notifications.all().forEach(n=>db.notifications.update(n.id,{read:true}));toast('All notifications marked as read');draw()}
  else if(b=t.closest('[data-tab]')){tab=b.dataset.tab;draw()}
  else if(b=t.closest('[data-r]')){const n=db.notifications.get(b.dataset.r);db.notifications.update(n.id,{read:!n.read});draw()}
  else if(b=t.closest('[data-x]')){db.notifications.remove(b.dataset.x);draw()}
  else if(t.closest('#pf')){const p=prefs.get();import('../core/ui.js').then(({modal})=>{const m=modal({title:'Notification preferences',w:'620px',body:`<div class="tw"><table class="tbl"><thead><tr><th>Category</th><th>In-app</th><th>Email</th><th>Push</th></tr></thead><tbody>${CATS.map(c=>`<tr><td>${c}</td>${['app','email','push'].map(k=>`<td>${sw(c+'|'+k,p[c][k])}</td>`).join('')}</tr>`).join('')}</tbody></table></div><small class="dim">Preferences are stored locally in this demo.</small>`,foot:`<button class="btn" data-close>Cancel</button><button class="btn p" id="ps">Save</button>`});m.el.querySelector('#ps').onclick=()=>{m.el.querySelectorAll('input[type=checkbox]').forEach(i=>{const[c,k]=i.name.split('|');p[c][k]=i.checked});prefs.set(p);m.close();toast('Preferences saved')}})}
 };
 host.onchange=e=>{if(e.target.id==='cf'){cat=e.target.value;draw()}if(e.target.id==='gr'){group=e.target.checked;draw()}};
 return db.notifications.on(draw);
}
