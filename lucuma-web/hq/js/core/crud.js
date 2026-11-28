import {esc,fmtD,fmtDT,ago,tISO,$,parseCSV,uid,fmtDT as _f} from './util.js';
import {ic} from './icons.js';
import {ctx} from './ctx.js';
import {can} from './rbac.js';
import {dataTable} from './table.js';
import {toast,modal,drawer,formDialog,confirmDlg,badge,empty,menu} from './ui.js';
/* Generic CRUD page engine: header, stat strip, table/grid, create/edit dialog with validation, detail drawer with comments + history,
   bulk actions, approve/reject, CSV import/export. Everything runs on a local collection (swap `store` for an API client later). */
export function crudPage(host,cfg){
 const P=cfg.perm,store=cfg.store;
 const scoped=()=>{let r=store.all();if(cfg.scope&&!can(P,cfg.scopeUnless||'approve'))r=r.filter(x=>cfg.scope(x,ctx.me));return r};
 const rows=()=>cfg.filter?scoped().filter(cfg.filter):scoped();
 host.innerHTML=`${cfg.noHeader?'':`<div class="ph"><div><div class="eyebrow">${esc(cfg.eyebrow||'')}</div><h1>${esc(cfg.title)}</h1>${cfg.subtitle?`<p>${esc(cfg.subtitle)}</p>`:''}</div><div class="acts"><span data-hx>${cfg.headerHtml||''}</span>${!cfg.readonly&&can(P,'create')&&cfg.import!==false?`<button class="btn" data-imp>${ic('upload')}Import</button>`:''}${!cfg.readonly&&can(P,'create')?`<button class="btn p" data-new>${ic('plus')}${esc(cfg.newLabel||'New')}</button>`:''}</div></div>`}<div class="stats" data-st></div><div class="card" data-tb></div>`;
 const drawStats=()=>{const s=cfg.stats?.(rows())||[];$('[data-st]',host).innerHTML=s.map(x=>`<div class="stat">${x.icon?`<span class="ic big">${ic(x.icon).replace(/<svg[^>]*>|<\/svg>/g,'')?ic(x.icon):''}</span>`:''}<small>${esc(x.label)}</small><b>${x.value}</b>${x.sub?`<span class="d ${x.tone||''}">${x.sub}</span>`:''}</div>`).join('')};
 const refreshAll=()=>{drawStats();tbl.refresh();cfg.onChange?.()};
 const canEdit=r=>!cfg.readonly&&can(P,'edit')&&(cfg.canEdit?cfg.canEdit(r):true);
 const canDel=r=>!cfg.readonly&&can(P,'delete')&&(cfg.canDelete?cfg.canDelete(r):true);
 const ap=cfg.approve,canAp=r=>ap&&(cfg.canApprove?cfg.canApprove(r):can(P,'approve'))&&(ap.from||[]).includes(r[ap.field||'status']);
 const label=r=>cfg.titleOf?cfg.titleOf(r):r.title||r.name||r.id;
 const stamp=(r,text)=>{(r.history=r.history||[]).unshift({t:tISO(),by:ctx.me?.name||'You',text});};
 const setStatus=(r,s,note)=>{const old=r[ap?.field||cfg.statusField||'status'];stamp(r,`Status changed: ${old} → ${s}${note?` — ${note}`:''}`);store.update(r.id,{[ap?.field||cfg.statusField||'status']:s,history:r.history});cfg.onStatus?.(r,s,note);ctx.log(`${s}: ${label(r)}`,cfg.logModule||cfg.title)};
 function form(r){
  if(cfg.customForm)return cfg.customForm(r,refreshAll);
  const isNew=!r,fields=typeof cfg.fields==='function'?cfg.fields(r):cfg.fields;
  formDialog({title:`${isNew?'New':'Edit'} ${esc(cfg.singular||cfg.title)}`,fields,values:r||cfg.defaults?.()||{},w:cfg.formWidth||'700px',submit:isNew?'Create':'Save changes',extra:cfg.formExtra?.(r)||'',
   onSubmit:v=>{
    let rec={...(r||{}),...v};
    if(cfg.beforeSave){rec=cfg.beforeSave(rec,isNew);if(!rec)return false}
    if(isNew){rec.id=rec.id||uid(store.name.slice(0,3));rec.createdAt=tISO();rec.createdBy=ctx.me?.name;stamp(rec,'Created');store.add(rec);ctx.log(`Created ${cfg.singular||cfg.title}: ${label(rec)}`,cfg.logModule||cfg.title);toast(`${cfg.singular||cfg.title} created`)}
    else{stamp(rec,'Edited');store.update(r.id,rec);ctx.log(`Updated ${cfg.singular||cfg.title}: ${label(rec)}`,cfg.logModule||cfg.title);toast('Changes saved')}
    cfg.afterSave?.(rec,isNew);refreshAll();
   }});
 }
 function del(r){confirmDlg({title:`Delete ${esc(cfg.singular||cfg.title)}?`,text:`“${esc(label(r))}” will be permanently removed from the database.`,ok:'Delete',onOk:()=>{store.remove(r.id);ctx.log(`Deleted ${cfg.singular||cfg.title}: ${label(r)}`,cfg.logModule||cfg.title);toast('Deleted','info');refreshAll()}})}
 function reject(r,onDone){const m=modal({title:'Reject / request changes',w:'460px',body:`<label class="f">Comment<textarea id="rj" rows="3" placeholder="Explain what needs to change"></textarea></label>`,foot:`<button class="btn" data-close>Cancel</button><button class="btn d" id="rj-ok">Reject</button>`});$('#rj-ok',m.el).onclick=()=>{setStatus(r,ap.reject||'Rejected',$('#rj',m.el).value.trim());m.close();toast('Rejected','warn');refreshAll();onDone?.()}}
 function open(r){
  r=store.get(r.id)||r;
  const cols=cfg.columns,flds=(cfg.detailFields||cfg.fields&&(typeof cfg.fields==='function'?cfg.fields(r):cfg.fields)||[]).filter(f=>f.type!=='file'||r[f.name]);
  const cl=n=>cols.find(c=>c.key===n);
  const val=f=>{const c=cl(f.name);const v=r[f.name];return c?.render?c.render(r):Array.isArray(v)?esc(v.join(', ')):f.type==='date'?fmtD(v):v===true?'Yes':v===false?'No':esc(v??'—')||'—'};
  const d=drawer({title:esc(label(r)),w:cfg.drawerWidth||'600px',head:`<div class="row" style="margin-top:4px">${cfg.statusField?badge(r[cfg.statusField]):''}<small class="mut">${esc(r.id)}</small></div>`,
   body:`<div class="row" style="margin-bottom:14px" data-da>${canAp(r)?`<button class="btn ok" data-ap>${ic('check')}${esc(ap.label||'Approve')}</button><button class="btn d" data-rj>${ic('x')}Reject</button>`:''}${canEdit(r)?`<button class="btn" data-ed>${ic('edit')}Edit</button>`:''}${(cfg.drawerActions?.(r)||[]).map((a,i)=>`<button class="btn ${a.cls||''}" data-xa="${i}">${a.icon?ic(a.icon):''}${esc(a.label)}</button>`).join('')}${canDel(r)?`<button class="btn d" data-dl>${ic('trash')}Delete</button>`:''}</div>
   ${cfg.detail?cfg.detail(r):''}<dl class="kv">${flds.map(f=>`<dt>${esc(f.label)}</dt><dd>${val(f)}</dd>`).join('')}</dl>
   ${cfg.comments!==false?`<hr class="s"><h4 style="margin-bottom:8px">Comments</h4><div data-cm>${(r.comments||[]).map(c=>`<div class="li"><div class="grow"><b>${esc(c.by)}</b> <small>${ago(c.t)}</small><div>${esc(c.text)}</div></div></div>`).join('')||'<small class="dim">No comments yet.</small>'}</div><div class="row mt"><input data-ci placeholder="Add a comment…" aria-label="Comment" style="flex:1"><button class="btn sm p" data-ca>Post</button></div>`:''}
   ${cfg.history!==false?`<hr class="s"><h4 style="margin-bottom:8px">History</h4><div class="tl">${(r.history||[{t:r.createdAt||tISO(),by:'System',text:'Record created'}]).slice(0,12).map(h=>`<div><b>${esc(h.text)}</b><br><small>${esc(h.by)} · ${fmtDT(h.t)}</small></div>`).join('')}</div>`:''}`});
  const E=d.el,reopen=()=>{d.close();open(r)};
  E.onclick=ev=>{const t=ev.target;
   if(t.closest('[data-ap]')){setStatus(r,ap.approve||'Approved');toast('Approved');refreshAll();reopen()}
   else if(t.closest('[data-rj]'))reject(r,()=>{});
   else if(t.closest('[data-ed]')){d.close();form(r)}
   else if(t.closest('[data-dl]')){d.close();del(r)}
   else if(t.closest('[data-ca]')){const i=$('[data-ci]',E),x=i.value.trim();if(!x)return;const cm=[...(store.get(r.id).comments||[]),{by:ctx.me?.name||'You',t:tISO(),text:x}];store.update(r.id,{comments:cm});toast('Comment added');reopen()}
   else if(t.closest('[data-xa]'))cfg.drawerActions(r)[+t.closest('[data-xa]').dataset.xa].run(r,{close:d.close,refresh:refreshAll,reopen});};
 }
 const acts=r=>[{label:'Open',icon:'eye',run:open},canEdit(r)&&{label:'Edit',icon:'edit',run:form},canAp(r)&&{label:ap.label||'Approve',icon:'check',run:r=>{setStatus(r,ap.approve||'Approved');toast('Approved');refreshAll()}},canAp(r)&&{label:'Reject',icon:'x',run:r=>reject(r)},...(cfg.rowActions?.(r)||[]).map(a=>({...a,run:x=>a.run(x,{refresh:refreshAll})})),canDel(r)&&{sep:1},canDel(r)&&{label:'Delete',icon:'trash',danger:1,run:del}].filter(Boolean);
 const st=cfg.statuses,sf=cfg.statusField||'status';
 const bulk=[
  ap&&(cfg.canApprove||can(P,'approve'))&&{label:'Approve',icon:'check',cls:'ok',run:(ids,rs)=>{rs.filter(canAp).forEach(r=>setStatus(r,ap.approve||'Approved'));toast(`Approved ${rs.filter(canAp).length} item(s)`)}},
  !cfg.readonly&&can(P,'edit')&&st&&{label:'Set status',icon:'flag',run:(ids,rs)=>{const m=modal({title:'Change status',w:'380px',body:`<label class="f">New status<select id="bs">${st.map(s=>`<option>${esc(s)}</option>`).join('')}</select></label>`,foot:`<button class="btn" data-close>Cancel</button><button class="btn p" id="bs-ok">Apply to ${ids.length}</button>`});$('#bs-ok',m.el).onclick=()=>{rs.forEach(r=>setStatus(r,$('#bs',m.el).value));m.close();toast('Status updated');refreshAll()}}},
  !cfg.readonly&&can(P,'edit')&&cfg.assignField&&{label:'Assign',icon:'user',run:(ids,rs)=>{const m=modal({title:'Bulk assign',w:'380px',body:`<label class="f">Assign to<select id="ba">${cfg.assignOptions().map(o=>`<option value="${esc(o.v)}">${esc(o.l)}</option>`).join('')}</select></label>`,foot:`<button class="btn" data-close>Cancel</button><button class="btn p" id="ba-ok">Assign ${ids.length}</button>`});$('#ba-ok',m.el).onclick=()=>{rs.forEach(r=>{stamp(r,'Reassigned');store.update(r.id,{[cfg.assignField]:$('#ba',m.el).value,history:r.history})});m.close();toast('Assigned');refreshAll()}}},
  !cfg.readonly&&can(P,'edit')&&cfg.archiveStatus&&{label:'Archive',icon:'archive',run:(ids,rs)=>{rs.forEach(r=>setStatus(r,cfg.archiveStatus));toast('Archived')}},
  ...(cfg.extraBulk||[]),
  !cfg.readonly&&can(P,'delete')&&{label:'Delete',icon:'trash',cls:'d',confirm:'Delete {n} selected record(s)? This cannot be undone.',run:ids=>{store.removeMany(ids);ctx.log(`Bulk deleted ${ids.length} ${cfg.title}`,cfg.logModule||cfg.title);toast(`Deleted ${ids.length}`,'info')}}
 ].filter(Boolean);
 const tbl=dataTable($('[data-tb]',host),{rows,columns:cfg.columns,search:cfg.search,filters:cfg.filters,sort:cfg.sort,dir:cfg.dir,pageSize:cfg.pageSize,card:cfg.card,view:cfg.view,tools:cfg.tools,exportName:cfg.exportName||cfg.title?.toLowerCase().replace(/\W+/g,'-'),canExport:can(P,'export'),bulk:bulk.length?bulk:undefined,actions:acts,onOpen:cfg.onOpen||open,onChange:refreshAll,onDraw:()=>{},emptyHtml:cfg.emptyHtml,placeholder:cfg.placeholder});
 host.addEventListener('click',e=>{
  if(e.target.closest('[data-new]'))form();
  else if(e.target.closest('[data-imp]'))importDlg();
 });
 function importDlg(){
  const fields=cfg.fields&&(typeof cfg.fields==='function'?cfg.fields():cfg.fields);
  const m=modal({title:`Import ${esc(cfg.title)}`,w:'560px',body:`<p class="mut" style="margin-top:0">Upload a CSV with a header row. Columns are matched by name: <code>${esc(fields.map(f=>f.name).join(', '))}</code>. Imported rows will be saved to the Supabase database.</p><input type="file" accept=".csv,text/csv" id="imf"><div id="imp" class="mt"></div>`,foot:`<button class="btn" data-close>Cancel</button><button class="btn p" id="im-ok" disabled>Import</button>`});
  let parsed=[];$('#imf',m.el).onchange=async e=>{const t=await e.target.files[0].text(),r=parseCSV(t),h=r[0]?.map(x=>x.trim());parsed=r.slice(1).map(c=>Object.fromEntries(h.map((k,i)=>[k,c[i]]))).filter(o=>fields.some(f=>o[f.name]));$('#imp',m.el).innerHTML=parsed.length?`<span class="badge b-ok">${parsed.length} valid row(s) found</span>`:`<span class="badge b-bad">No rows matched the expected columns</span>`;$('#im-ok',m.el).disabled=!parsed.length};
  $('#im-ok',m.el).onclick=()=>{parsed.forEach(o=>{const rec={...(cfg.defaults?.()||{})};fields.forEach(f=>{if(o[f.name]!=null)rec[f.name]=f.type==='number'?+o[f.name]:o[f.name]});rec.id=uid('imp');rec.createdAt=tISO();stamp(rec,'Imported from CSV');store.add(rec)});m.close();toast(`Imported ${parsed.length} row(s)`);refreshAll()};
 }
 drawStats();
 return{refresh:refreshAll,open,form,store};
}
