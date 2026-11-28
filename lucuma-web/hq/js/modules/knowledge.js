import {db,empName,recent,favs} from '../core/db.js';
import {crudPage} from '../core/crud.js';
import {ctx} from '../core/ctx.js';
import {can} from '../core/rbac.js';
import {badge,toast,formDialog,confirmDlg,tabs} from '../core/ui.js';
import {esc,fmtD,fmtDT,tISO,$,ago,debounce,avatar} from '../core/util.js';
import {who,favBtn} from '../core/cells.js';
import {ic} from '../core/icons.js';
const CATS=['Policies','SOPs','IT documentation','HR documentation','Technical documentation','Project documentation','Tutorials','FAQs','Company guidelines'];
export default function(host,{args}){
 const id=args[0];if(id&&id!=='new'&&db.kb.get(id))return article(host,id);
 let cat='',fav=false;
 host.innerHTML=`<div class="g12"><div class="card" style="grid-column:span 3" id="sd"></div><div style="grid-column:span 9" id="mn"></div></div>`;
 const side=()=>{$('#sd',host).innerHTML=`<h4 style="margin-bottom:8px">Knowledge base</h4><div class="nav" style="padding:0"><a data-c="" class="${!cat&&!fav?'on':''}">${ic('book')}<span>All articles</span></a><a data-f="1" class="${fav?'on':''}">${ic('star')}<span>Favorites</span></a></div><h4 style="margin:14px 0 8px">Categories</h4><div class="nav" style="padding:0">${CATS.map(c=>`<a data-c="${c}" class="${cat===c?'on':''}">${ic('folder')}<span>${c}</span><em class="cnt" style="font-style:normal;background:var(--g3)">${db.kb.all().filter(a=>a.category===c).length}</em></a>`).join('')}</div>`};
 const c=crudPage($('#mn',host),{title:'Company wiki',eyebrow:'Documents',subtitle:'Policies, SOPs, tutorials and technical documentation — searchable and versioned.',store:db.kb,perm:'dashboard',readonly:!can('documents','create'),singular:'Article',newLabel:'New article',logModule:'Knowledge',view:'grid',onOpen:a=>location.hash='#/knowledge/'+a.id,
  filter:a=>(!cat||a.category===cat)&&(!fav||a.fav)&&(a.status==='Published'||a.author===ctx.me.id||can('documents','approve')),
  columns:[{key:'title',label:'Article',render:a=>`<b>${a.fav?'★ ':''}${esc(a.title)}</b><br><small class="mut">${esc(a.category)}</small>`},{key:'author',label:'Author',render:a=>who(a.author,{sub:false,size:26}),csv:a=>empName(a.author)},{key:'views',label:'Views'},{key:'updated',label:'Updated',render:a=>ago(a.updated)},{key:'status',label:'Status',render:a=>badge(a.status)}],
  card:a=>`<div class="row sp-b">${ic('book',22)}${badge(a.status)}</div><b style="display:block;margin:10px 0 4px">${esc(a.title)}</b><small class="mut">${esc(a.category)}</small><div class="row sp-b mt"><small class="dim">${a.views} views</small><small class="dim">${ago(a.updated)}</small></div>`,
  fields:[{name:'title',label:'Title',required:true,span:2},{name:'category',label:'Category',type:'select',options:CATS},{name:'tags',label:'Tags',type:'tags'}],defaults:()=>({category:'SOPs',tags:[]}),
  beforeSave:(a,n)=>{if(n){a.id='KB-'+String(db.kb.all().length+1).padStart(2,'0');a.author=ctx.me.id;a.status='Draft';a.views=0;a.fav=false;a.updated=tISO();a.content=`<h2>${esc(a.title)}</h2><p>Start writing…</p>`;a.versions=[];a.comments=[]}return a},afterSave:(a,n)=>{if(n)location.hash='#/knowledge/'+a.id},
  filters:[{key:'status',label:'Status',options:['Draft','In Review','Published']}],search:['title','category',a=>(a.tags||[]).join(' ')],sort:'updated',dir:-1,statusField:'status',statuses:['Draft','In Review','Published'],comments:false,import:false,
  stats:rs=>[{label:'Articles',value:rs.length,icon:'book'},{label:'Published',value:rs.filter(a=>a.status==='Published').length,icon:'check-c'},{label:'In review',value:rs.filter(a=>a.status==='In Review').length,icon:'clock'},{label:'Total views',value:rs.reduce((t,a)=>t+a.views,0),icon:'eye'}]});
 side();host.addEventListener('click',e=>{const k=e.target.closest('[data-c]'),f=e.target.closest('[data-f]');if(k){cat=k.dataset.c;fav=false;side();c.refresh()}else if(f){fav=true;cat='';side();c.refresh()}},true);
 if(id==='new'&&can('documents','create'))setTimeout(()=>c.form(),30);
}
function article(host,id){
 const A=()=>db.kb.get(id);let edit=false,panel='cm';recent.add('kb',id,A().title,'#/knowledge/'+id);
 if(!window.__kbv||window.__kbv!==id){db.kb.update(id,{views:A().views+1});window.__kbv=id}
 const canEdit=()=>can('documents','edit')||A().author===ctx.me.id;
 const draw=()=>{const a=A();host.innerHTML=`<div class="ph"><div class="row" style="flex-wrap:nowrap"><a class="btn ghost ico" href="#/knowledge">${ic('chev-l')}</a><div><div class="eyebrow">${esc(a.category)} · ${esc(a.id)}</div><h1>${esc(a.title)}</h1><p>By ${esc(empName(a.author))} · updated ${ago(a.updated)} · ${a.views} views</p></div></div><div class="acts">${badge(a.status)}${favBtn('kb',a.id,a.title,'#/knowledge/'+a.id)}${canEdit()?`<button class="btn ${edit?'p':''}" id="ed">${ic(edit?'check':'edit')}${edit?'Save':'Edit'}</button>`:''}${a.status==='Draft'&&canEdit()?`<button class="btn" id="rv">Submit for review</button>`:''}${a.status==='In Review'&&can('documents','approve')?`<button class="btn ok" id="pb">${ic('check')}Publish</button><button class="btn d" id="rj">Send back</button>`:''}</div></div><div class="g12"><div class="card" style="grid-column:span 8">${edit?`<div class="toolbar">${[['bold','bold'],['italic','italic'],['insertUnorderedList','ulist']].map(([c,i])=>`<button class="btn sm" data-cmd="${c}">${ic(i)}</button>`).join('')}<button class="btn sm" data-cmd="formatBlock:h2">H2</button><button class="btn sm" data-cmd="formatBlock:h3">H3</button><button class="btn sm" data-cmd="formatBlock:p">¶</button></div>`:''}<div class="editor" id="ar" contenteditable="${edit}" style="min-height:360px;${edit?'':'border-color:transparent;background:transparent'}">${a.content}</div></div><div style="grid-column:span 4" class="col"><div id="tb"></div><div class="card" id="pn"></div></div></div>`;
  tabs($('#tb',host),[['cm','Comments','chat'],['ver','Versions','clock']],{cur:panel,onChange:k=>{panel=k;pn()}});pn()};
 const pn=()=>{const a=A();$('#pn',host).innerHTML=panel==='cm'?`${(a.comments||[]).map(c=>`<div class="li">${avatar(c.by,28)}<div class="grow"><b>${esc(c.by)}</b> <small class="dim">${ago(c.t)}</small><br>${esc(c.text)}</div></div>`).join('')||'<small class="dim">No comments yet.</small>'}<div class="row mt"><input id="ci" placeholder="Add a comment…" style="flex:1"><button class="btn sm p" id="ca">Post</button></div>`:`<div class="list"><div class="li"><div class="grow"><b>Current</b><br><small class="mut">${fmtDT(a.updated)}</small></div></div>${(a.versions||[]).map((v,i)=>`<div class="li"><div class="grow"><b>v${v.v}</b><br><small class="mut">${esc(v.by)} · ${fmtDT(v.t)}</small></div>${canEdit()?`<button class="btn sm" data-rs="${i}">Restore</button>`:''}</div>`).join('')}</div>`};
 draw();
 host.onclick=e=>{const t=e.target;let b;const a=A();
  if(b=t.closest('[data-cmd]')){const[c,v]=b.dataset.cmd.split(':');$('#ar',host).focus();document.execCommand(c,false,v||null)}
  else if(t.closest('#ed')){if(edit){const c=$('#ar',host).innerHTML;db.kb.update(id,{content:c,updated:tISO(),versions:[{v:(a.versions||[]).length+1,t:a.updated,by:ctx.me.name,content:a.content},...(a.versions||[])]});toast('Article saved — previous version kept')}edit=!edit;draw()}
  else if(t.closest('#rv')){db.kb.update(id,{status:'In Review'});toast('Submitted for review');draw()}
  else if(t.closest('#pb')){db.kb.update(id,{status:'Published'});toast('Article published');draw()}
  else if(t.closest('#rj')){db.kb.update(id,{status:'Draft'});toast('Sent back to author','warn');draw()}
  else if(t.closest('#ca')){const v=$('#ci',host).value.trim();if(!v)return;db.kb.update(id,{comments:[...(a.comments||[]),{by:ctx.me.name,t:tISO(),text:v}]});pn()}
  else if(b=t.closest('[data-rs]')){const v=a.versions[+b.dataset.rs];confirmDlg({title:'Restore version v'+v.v+'?',text:'The current text is kept as a new version.',ok:'Restore',danger:false,onOk:()=>{db.kb.update(id,{content:v.content,updated:tISO(),versions:[{v:a.versions.length+1,t:a.updated,by:ctx.me.name,content:a.content},...a.versions]});toast('Restored');draw()}})}};
}
