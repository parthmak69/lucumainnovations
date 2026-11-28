import {ctx} from './core/ctx.js';
import {$,$$,esc,avatar,ago,debounce} from './core/util.js';
import {ic} from './core/icons.js';
import {can,rbac} from './core/rbac.js';
import {db,favs,recent} from './core/db.js';
import {menu,modal,toast,confirmDlg,closeTop} from './core/ui.js';
import {searchAll,hl} from './core/search.js';
import {resetDemoData} from './core/store.js';
import {signOut} from './core/session.js';
export const NAV=[
 ['Workspace',[['dashboard','Dashboard','home','dashboard'],['activity','Activity feed','bolt','dashboard'],['notifications','Notifications','bell','dashboard'],['favorites','Favorites & recent','star','dashboard']]],
 ['People',[['employees','Employees','users','employees'],['orgchart','Org chart','sitemap','employees'],['hr','HR hub','heart','hr']]],
 ['Work',[['projects','Projects','briefcase','projects'],['tasks','Tasks','check-c','tasks'],['calendar','Calendar','calendar','dashboard'],['meetings','Meetings','clock','dashboard'],['announcements','Announcements','flag','dashboard']]],
 ['Documents',[['documents','Documents','file','documents'],['approvals','Approvals','check','dashboard'],['certificates','Certificates & letters','award','documents'],['knowledge','Knowledge base','book','dashboard']]],
 ['Communicate',[['chat','Chat','chat','chat'],['mail','Mail','mail','mail'],['ai','AI assistant','spark','dashboard']]],
 ['Business',[['finance','Finance','wallet','finance'],['invoices','Invoices & clients','receipt','invoices'],['crm','CRM','target','crm'],['procurement','Procurement','truck','procurement'],['assets','Assets','laptop','assets'],['support','Support desk','ticket','support'],['business','Business hub','layers','dashboard']]],
 ['Platform',[['workflows','Workflow automation','flow','administration'],['analytics','Analytics','chart','analytics'],['security','Security center','shield','administration'],['roles','Roles & access','key','administration'],['settings','Settings','cog','administration']]]];
const CLASSIC=[['index.html','Classic Dashboard (Lucuma Docs)','file'],['workspace.html','Company workspace (live DB)','layers'],['collaboration.html','Tasks & Connect (live)','chat'],['mail.html','Lucuma Mail (live)','mail'],['team-admin.html','Team admin (live)','users']];
export const ROUTES=Object.fromEntries(NAV.flatMap(s=>s[1]).map(i=>[i[0],{label:i[1],icon:i[2],perm:i[3]}]));
ROUTES.search={label:'Search',icon:'search',perm:'dashboard'};
export function build(){
 const app=$('#app');app.hidden=false;$('#boot')?.remove();
 app.innerHTML=`<aside class="side" id="side" aria-label="Main navigation"><div class="brand"><img src="assets/logo.png" alt="Lucuma"><div>LUCUMA<small>HQ</small></div></div><nav class="nav" id="nav"></nav><div class="side-foot"><button class="btn sm ghost grow" id="collapse" data-tip="Collapse sidebar">${ic('menu')}<span class="hide-m"></span></button></div></aside>
 <div class="main"><header class="top"><button class="btn ghost ico burger" id="burger" aria-label="Open menu">${ic('menu')}</button><div class="srch" id="srch" role="button" tabindex="0" aria-label="Search">${ic('search')}<span class="hide-m">Search everything…</span><kbd class="hide-m">Ctrl K</kbd></div><span class="grow"></span><button class="btn p sm" id="qc">${ic('plus')}<span class="hide-m">New</span></button><button class="btn ghost ico" id="bell" aria-label="Notifications" style="position:relative">${ic('bell')}<span id="bellc" class="cnt badge b-bad" style="position:absolute;top:-3px;right:-3px;padding:0 6px;font-size:10px"></span></button><button class="btn ghost" id="me" style="padding:4px 10px 4px 4px">${avatar(ctx.session.name,34)}<span class="hide-m" style="text-align:left;line-height:1.15"><b style="display:block;font-size:12.5px">${esc(ctx.session.name)}</b><small id="rl"></small></span></button></header><main class="view" id="view" tabindex="-1"></main></div>`;
 nav();$('#collapse').onclick=()=>{document.body.classList.toggle('collapsed');localStorage.setItem('lw-col',document.body.classList.contains('collapsed')?'1':'')};
 if(localStorage.getItem('lw-col'))document.body.classList.add('collapsed');
 $('#burger').onclick=()=>document.body.classList.toggle('navopen');
 $('#nav').addEventListener('click',()=>document.body.classList.remove('navopen'));
 $('#srch').onclick=openPalette;$('#srch').onkeydown=e=>{if(e.key==='Enter')openPalette()};
 $('#qc').onclick=quick;$('#bell').onclick=bell;$('#me').onclick=userMenu;
 document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openPalette()}});
 rbac.on(()=>{nav();roleBadge()});roleBadge();counts();db.notifications.on(counts);db.approvals.on(nav);
 ctx.openSearch=openPalette;
 document.addEventListener('click',e=>{const b=e.target.closest('[data-fav]');if(!b)return;e.stopPropagation();const [t,i,l,r]=JSON.parse(b.dataset.fav);const on=favs.toggle(t,i,l,r);b.classList.toggle('on',on);toast(on?'Added to favorites':'Removed from favorites','info',1800)},true);
}
function roleBadge(){const el=$('#rl');if(!el)return;const v=rbac.viewAs()&&rbac.canSwitch();el.innerHTML=`${esc(rbac.label(rbac.effective()))}${v?' · preview':''}`;}
function counts(){const n=db.notifications.all().filter(x=>!x.read).length,e=$('#bellc');if(e){e.textContent=n||'';e.style.display=n?'':'none'}}
export function nav(){
 const cur=location.hash.split('/')[1]||'dashboard',pend=db.approvals.all().filter(a=>a.status==='Pending Approval').length;
 $('#nav').innerHTML=NAV.map(([sec,items])=>{const v=items.filter(i=>can(i[3],'view'));return v.length?`<h6>${sec}</h6>`+v.map(i=>`<a href="#/${i[0]}" class="${cur===i[0]?'on':''}" data-tip="${esc(i[1])}">${ic(i[2])}<span>${esc(i[1])}</span>${i[0]==='approvals'&&pend?`<em class="cnt" style="font-style:normal">${pend}</em>`:''}</a>`).join(''):''}).join('')+`<h6>Classic tools</h6>`+CLASSIC.map(c=>`<a href="${c[0]}">${ic(c[2])}<span>${esc(c[1])}</span></a>`).join('');
}
export const setActive=()=>nav();
function quick(e){
 const it=[['Document','file','#/documents/new','documents','create'],['Task','check-c','#/tasks/new','tasks','create'],['Project','briefcase','#/projects/new','projects','create'],['Meeting','calendar','#/meetings/new','tasks','create'],['Announcement','flag','#/announcements/new','hr','edit'],['Invoice','receipt','#/invoices/new','invoices','create'],['Expense','wallet','#/finance/new','finance','create'],['Support ticket','ticket','#/support/new','support','create'],['Employee','users','#/employees/new','employees','create'],['Certificate','award','#/certificates','documents','create']];
 menu(e,it.filter(i=>can(i[3],i[4])).map(i=>({label:i[0],icon:i[1],run:()=>{if(location.hash===i[2]){location.hash='#/dashboard';setTimeout(()=>location.hash=i[2],20)}else location.hash=i[2]}})));
}
function bell(e){
 menu(e,[]);const m=document.querySelector('.menu');if(!m)return;
 const l=db.notifications.all().slice(0,7);m.style.width='360px';m.style.padding='8px';
 m.innerHTML=`<div class="row sp-b" style="padding:6px 8px"><b>Notifications</b><button class="btn sm ghost" id="mr">Mark all read</button></div>`+(l.map(n=>`<div class="li click" data-n="${n.id}" style="padding:8px"><span class="chip">${esc(n.cat)}</span><div class="grow ${n.read?'mut':''}" style="font-size:12.5px">${esc(n.text)}<br><small class="dim">${ago(n.t)}</small></div>${n.read?'':'<i class="pri" style="background:var(--acc2)"></i>'}</div>`).join(''))+`<a class="btn sm w100 mt" href="#/notifications" style="justify-content:center">Open notification center</a>`;
 m.onclick=ev=>{if(ev.target.closest('#mr')){db.notifications.all().forEach(n=>db.notifications.update(n.id,{read:true}));m.remove();toast('All notifications marked as read')}else if(ev.target.closest('[data-n]')){db.notifications.update(ev.target.closest('[data-n]').dataset.n,{read:true});m.remove()}else if(ev.target.closest('a'))m.remove()};
}
function userMenu(e){
 menu(e,[{label:'Back to Lucuma Docs',icon:'arrow',run:()=>location.href='index.html'},{label:'My profile',icon:'user',run:()=>location.hash='#/employees/'+ctx.me.id,show:!!db.employees.get(ctx.me.id)},{label:'Settings',icon:'cog',run:()=>location.hash='#/settings',show:can('administration')},{sep:1},{label:'Reset demo data',icon:'restore',run:()=>confirmDlg({title:'Reset demo data?',text:'All changes you made in this workspace preview are cleared and sample data is restored.',ok:'Reset',onOk:()=>{resetDemoData();location.reload()}})},{label:'Sign out',icon:'logout',danger:1,run:signOut}]);
}
export function openPalette(){
 const cmds=[['Create document','file','#/documents/new','documents','create'],['Create task','check-c','#/tasks/new','tasks','create'],['Create project','briefcase','#/projects/new','projects','create'],['Schedule meeting','calendar','#/meetings/new','tasks','create'],['Create invoice','receipt','#/invoices/new','invoices','create'],['Open mail','mail','#/mail','mail','view'],['Open calendar','calendar','#/calendar','dashboard','view'],['Open employees','users','#/employees','employees','view'],['Open dashboard','home','#/dashboard','dashboard','view'],['Open approvals','check','#/approvals','dashboard','view'],['Open analytics','chart','#/analytics','analytics','view'],['Open AI assistant','spark','#/ai','dashboard','view'],['Generate certificate','award','#/certificates','documents','create'],['Open security center','shield','#/security','administration','view']].filter(c=>can(c[3],c[4]));
 const m=document.createElement('div');m.className='pal';m.setAttribute('role','dialog');m.innerHTML=`<input id="pq" placeholder="Type a command or search documents, people, projects, tasks…" aria-label="Command palette" autocomplete="off"><div class="res" id="pr"></div>`;
 const sc=document.createElement('div');sc.className='scrim';document.getElementById('ov').append(sc,m);
 let items=[],cur=0;const close=()=>{m.remove();sc.remove();document.removeEventListener('keydown',kd,true)};
 const draw=()=>{const q=$('#pq',m).value.trim();items=[];let h='';
  const cm=cmds.filter(c=>!q||c[0].toLowerCase().includes(q.toLowerCase()));
  if(cm.length){h+='<h6>Commands</h6>'+cm.slice(0,q?5:8).map(c=>{items.push(c[2]);return`<div class="it" data-i="${items.length-1}">${ic(c[1])}<span>${esc(c[0])}</span><small>Command</small></div>`}).join('')}
  if(q)for(const g of searchAll(q,4)){h+=`<h6>${g.label}</h6>`+g.items.map(i=>{items.push(i.r);return`<div class="it" data-i="${items.length-1}">${ic(g.icon)}<span>${hl(i.l,q)}</span><small>${esc(i.s)}</small></div>`}).join('')}
  if(q&&items.length===cm.length)h+=`<div class="empty">${ic('search')}No matches for “${esc(q)}”</div>`;
  if(q){items.push('#/search?q='+encodeURIComponent(q));h+=`<div class="it" data-i="${items.length-1}">${ic('arrow')}<span>See all results for “${esc(q)}”</span></div>`}
  $('#pr',m).innerHTML=h;cur=0;hi()};
 const hi=()=>$$('.it',m).forEach((e,i)=>{e.classList.toggle('on',i===cur);if(i===cur)e.scrollIntoView({block:'nearest'})});
 const go=i=>{const r=items[i];if(!r)return;close();if(location.hash===r){location.hash='#/dashboard';setTimeout(()=>location.hash=r,20)}else location.hash=r};
 const kd=e=>{if(e.key==='Escape'){e.stopPropagation();close()}else if(e.key==='ArrowDown'){e.preventDefault();cur=Math.min(items.length-1,cur+1);hi()}else if(e.key==='ArrowUp'){e.preventDefault();cur=Math.max(0,cur-1);hi()}else if(e.key==='Enter'&&document.activeElement===$('#pq',m)){e.preventDefault();go(cur)}};
 document.addEventListener('keydown',kd,true);sc.onclick=close;$('#pq',m).oninput=debounce(draw,90);m.onclick=e=>{const it=e.target.closest('.it');if(it)go(+it.dataset.i)};draw();$('#pq',m).focus();
}
