import {ctx} from './core/ctx.js';
import {loadSession} from './core/session.js';
import {mapRole,can,rbac} from './core/rbac.js';
import {db,recent,initDB} from './core/db.js';
import {$,esc} from './core/util.js';
import {ic} from './core/icons.js';
import {build,ROUTES,setActive} from './shell.js';
const MODS={dashboard:'dashboard',activity:'activity',notifications:'notifications',favorites:'favorites',search:'search',employees:'employees',orgchart:'orgchart',hr:'hr',projects:'projects',tasks:'tasks',calendar:'calendar',meetings:'meetings',announcements:'announcements',documents:'documents',approvals:'approvals',certificates:'certificates',knowledge:'knowledge',chat:'chat',mail:'mail',ai:'ai',finance:'finance',invoices:'invoices',crm:'crm',procurement:'procurement',assets:'assets',support:'support',business:'business',workflows:'workflows',analytics:'analytics',security:'security',roles:'roles',settings:'settings'};
let cleanup=null,token=0;
async function route(){
 const h=location.hash.replace(/^#\/?/,'')||'dashboard',[path,query]=h.split('?'),[id,...args]=path.split('/'),view=$('#view');
 const mod=MODS[id]?id:'dashboard',R=ROUTES[mod],t=++token;
 cleanup?.();cleanup=null;setActive();document.body.classList.remove('navopen');
 const banner=rbac.canSwitch()&&rbac.viewAs()?`<div class="overlay-note row sp-b" style="margin:0 0 14px"><span>${ic('eye')} Previewing the workspace as <b>${esc(rbac.label(rbac.viewAs()))}</b>. Actions follow that role's permissions.</span><button class="btn sm" id="exitprev">Exit preview</button></div>`:'';
 if(!can(R.perm,'view')){view.innerHTML=`<div class="page">${banner}<div class="card" style="max-width:560px;margin:8vh auto;text-align:center;padding:36px"><div style="font-size:46px;opacity:.7">${ic('lock')}</div><h2 style="margin:10px 0 6px">Access restricted</h2><p class="mut">Your role (<b>${esc(rbac.label(rbac.effective()))}</b>) doesn’t include access to <b>${esc(R.label)}</b>. Ask a Super Administrator to grant the <i>View</i> permission for this module.</p><a class="btn p" href="#/dashboard">Back to dashboard</a></div></div>`;$('#exitprev')&&($('#exitprev').onclick=()=>rbac.setViewAs(null));return}
 view.innerHTML=`<div class="page">${banner}<div class="skel" style="height:90px"></div><div class="g3"><div class="skel" style="height:200px"></div><div class="skel" style="height:200px"></div><div class="skel" style="height:200px"></div></div></div>`;
 try{
  const m=await import(`./modules/${MODS[mod]}.js`);if(t!==token)return;
  const host=document.createElement('div');host.className='page';host.innerHTML=banner;const body=document.createElement('div');body.className='col';body.style.gap='16px';host.appendChild(body);
  view.replaceChildren(host);view.scrollTop=0;
  cleanup=(await m.default(body,{args,query:new URLSearchParams(query||''),id:args[0]}))||null;
  $('#exitprev')&&($('#exitprev').onclick=()=>rbac.setViewAs(null));
 }catch(e){console.error(e);view.innerHTML=`<div class="page"><div class="card" style="max-width:560px;margin:8vh auto;text-align:center"><h3>Something went wrong</h3><p class="mut">${esc(e.message)}</p><a class="btn" href="#/dashboard">Back to dashboard</a></div></div>`}
}
rbac.on(()=>{const h=location.hash;route()});
(async function boot(){
 try{
  const s=await loadSession();
  if(!s){location.replace('index.html');return}
  s.role=mapRole({role:s.liRole,role_label:s.roleLabel});ctx.session=s;
  await initDB();
  const es=db.employees.all();
  ctx.me=es.find(e=>e.email===s.email)||{id:s.uid||s.id||'current-user',name:s.name,email:s.email,designation:s.roleLabel||s.liRole,dept:'',status:'Active',type:'User'};
  build();window.addEventListener('hashchange',route);route();
 }catch(e){
  $('#boot').innerHTML=`<div class="card" style="max-width:460px;text-align:center"><h3>Couldn’t start the workspace</h3><p class="mut">${esc(e.message)}</p><a class="btn p" href="index.html">Back to sign in</a></div>`;
 }
})();
