import {esc,debounce,toCSV,download,$,$$} from './util.js';
import {ic} from './icons.js';
import {menu,toast,confirmDlg,empty} from './ui.js';
/* Reusable data table: search, filters, sort, pagination, selection, bulk actions, row menu, grid view, CSV export. */
export function dataTable(host,cfg){
 const st={q:'',sort:cfg.sort?{key:cfg.sort,dir:cfg.dir||1}:null,page:1,size:cfg.pageSize||10,sel:new Set(),f:{},view:cfg.view||'table'};
 const cols=cfg.columns,filters=cfg.filters||[];
 const rowsAll=()=>{
  let r=cfg.rows();
  if(st.q){const q=st.q.toLowerCase(),ks=cfg.search||cols.map(c=>c.key);r=r.filter(x=>ks.some(k=>String(typeof k==='function'?k(x):x[k]??'').toLowerCase().includes(q)))}
  for(const f of filters){const v=st.f[f.key];if(v)r=r.filter(x=>f.match?f.match(x,v):String(x[f.key])===v)}
  if(st.sort){const c=cols.find(c=>c.key===st.sort.key),g=c?.sortBy||(x=>x[st.sort.key]);r=[...r].sort((a,b)=>{let A=g(a),B=g(b);if(typeof A==='string')A=A.toLowerCase();if(typeof B==='string')B=B.toLowerCase();return(A>B?1:A<B?-1:0)*st.sort.dir})}
  return r;
 };
 host.innerHTML=`<div class="tbar"><div class="sbox">${ic('search')}<input type="search" placeholder="${esc(cfg.placeholder||'Search…')}" aria-label="Search"></div>${filters.map(f=>`<select data-f="${f.key}" aria-label="${esc(f.label)}"><option value="">${esc(f.label)}: All</option>${f.options.map(o=>{o=typeof o==='object'?o:{v:o,l:o};return`<option value="${esc(o.v)}">${esc(o.l)}</option>`}).join('')}</select>`).join('')}${cfg.card?`<div class="tabs" style="padding:2px"><button data-v="table" class="${st.view==='table'?'on':''}" aria-label="Table view">${ic('list')}</button><button data-v="grid" class="${st.view==='grid'?'on':''}" aria-label="Grid view">${ic('grid')}</button></div>`:''}<span class="grow"></span>${cfg.tools||''}${cfg.export!==false&&cfg.canExport!==false?`<button class="btn sm" data-x>${ic('download')}Export</button>`:''}</div><div class="tb-bulk"></div><div class="tb-body"></div><div class="pager"></div>`;
 const body=$('.tb-body',host),pager=$('.pager',host),bulk=$('.tb-bulk',host);
 function draw(){
  const all=rowsAll(),pages=Math.max(1,Math.ceil(all.length/st.size));st.page=Math.min(st.page,pages);
  const sl=all.slice((st.page-1)*st.size,st.page*st.size);
  const ids=new Set(cfg.rows().map(r=>r.id));st.sel.forEach(i=>{if(!ids.has(i))st.sel.delete(i)});
  const allSel=sl.length&&sl.every(r=>st.sel.has(r.id));
  const bl=cfg.bulk||[];
  bulk.innerHTML=st.sel.size&&bl.length?`<div class="bulk"><b>${st.sel.size} selected</b><button class="btn sm ghost" data-ba="all">Select all ${all.length}</button>${bl.filter(b=>b.show!==false).map((b,i)=>`<button class="btn sm ${b.cls||''}" data-b="${i}">${b.icon?ic(b.icon):''}${esc(b.label)}</button>`).join('')}<button class="btn sm ghost" data-ba="none">Clear</button></div>`:'';
  if(st.view==='grid'&&cfg.card){
   body.innerHTML=sl.length?`<div class="cards">${sl.map(r=>`<div class="card" data-id="${esc(r.id)}" tabindex="0">${cfg.card(r)}</div>`).join('')}</div>`:cfg.emptyHtml||empty('search','Nothing found','Try a different search or clear the filters.');
  }else{
   body.innerHTML=sl.length?`<div class="tw"><table class="tbl"><thead><tr>${bl.length?`<th style="width:38px"><input type="checkbox" data-all ${allSel?'checked':''} aria-label="Select all on page"></th>`:''}${cols.map(c=>`<th class="${c.sort===false?'':'sortable'}" data-s="${c.key}" ${c.w?`style="width:${c.w}"`:''}>${esc(c.label)}${st.sort?.key===c.key?(st.sort.dir>0?' ▲':' ▼'):''}</th>`).join('')}${cfg.actions?'<th style="width:46px"></th>':''}</tr></thead><tbody>${sl.map(r=>`<tr class="rw ${st.sel.has(r.id)?'sel':''}" data-id="${esc(r.id)}">${bl.length?`<td><input type="checkbox" data-sel ${st.sel.has(r.id)?'checked':''} aria-label="Select row"></td>`:''}${cols.map(c=>`<td class="${c.cls||''}">${c.render?c.render(r):esc(r[c.key]??'—')}</td>`).join('')}${cfg.actions?`<td><button class="btn ghost ico sm" data-m aria-label="Row actions">${ic('more')}</button></td>`:''}</tr>`).join('')}</tbody></table></div>`:cfg.emptyHtml||empty('search','Nothing found','Try a different search or clear the filters.');
  }
  const a=(st.page-1)*st.size+1,b=Math.min(all.length,st.page*st.size);
  pager.innerHTML=`<span>${all.length?`${a}–${b} of ${all.length}`:'0 results'}</span><span class="grow"></span><select data-size style="width:auto;padding:5px 8px">${[10,25,50].map(n=>`<option ${n===st.size?'selected':''} value="${n}">${n} / page</option>`).join('')}</select><button class="btn sm" data-p="-1" ${st.page<=1?'disabled':''}>${ic('chev-l')}</button><span>${st.page} / ${pages}</span><button class="btn sm" data-p="1" ${st.page>=pages?'disabled':''}>${ic('chevron')}</button>`;
  cfg.onDraw?.(all);
 }
 const rowOf=el=>cfg.rows().find(r=>String(r.id)===el.closest('[data-id]')?.dataset.id);
 host.addEventListener('input',debounce(e=>{if(e.target.matches('.sbox input')){st.q=e.target.value;st.page=1;draw()}},120));
 host.addEventListener('change',e=>{const t=e.target;
  if(t.matches('[data-f]')&&t.tagName==='SELECT'&&t.closest('.tbar')){st.f[t.dataset.f]=t.value;st.page=1;draw()}
  else if(t.matches('[data-size]')){st.size=+t.value;st.page=1;draw()}
  else if(t.matches('[data-all]')){const all=rowsAll().slice((st.page-1)*st.size,st.page*st.size);all.forEach(r=>t.checked?st.sel.add(r.id):st.sel.delete(r.id));draw()}
  else if(t.matches('[data-sel]')){const r=rowOf(t);t.checked?st.sel.add(r.id):st.sel.delete(r.id);draw()}});
 host.addEventListener('click',e=>{const t=e.target;
  const v=t.closest('[data-v]');if(v&&t.closest('.tbar')){st.view=v.dataset.v;$$('[data-v]',host).forEach(x=>x.classList.toggle('on',x===v));draw();return}
  if(t.closest('[data-x]')){const rows=rowsAll();download((cfg.exportName||'export')+'.csv',toCSV(rows,cols.filter(c=>c.csv!==false)));toast(`Exported ${rows.length} rows to CSV`);return}
  const th=t.closest('th.sortable');if(th){const k=th.dataset.s;st.sort=st.sort?.key===k?{key:k,dir:-st.sort.dir}:{key:k,dir:1};draw();return}
  const p=t.closest('[data-p]');if(p){st.page+=+p.dataset.p;draw();return}
  const ba=t.closest('[data-ba]');if(ba){if(ba.dataset.ba==='all')rowsAll().forEach(r=>st.sel.add(r.id));else st.sel.clear();draw();return}
  const bb=t.closest('[data-b]');if(bb){const b=(cfg.bulk||[]).filter(x=>x.show!==false)[+bb.dataset.b],ids=[...st.sel],rows=cfg.rows().filter(r=>st.sel.has(r.id));
   const run=()=>{b.run(ids,rows);st.sel.clear();draw();cfg.onChange?.()};
   b.confirm?confirmDlg({title:b.label,text:b.confirm.replace('{n}',ids.length),ok:b.label,danger:!!b.cls?.includes('d'),onOk:run}):run();return}
  if(t.closest('[data-m]')){e.stopPropagation();const r=rowOf(t);menu(e,cfg.actions(r).map(a=>a&&!a.sep?{...a,run:()=>{a.run(r);cfg.onChange?.()}}:a));return}
  if(t.closest('input,button,a,select,label'))return;
  const row=t.closest('[data-id]');if(row&&cfg.onOpen)cfg.onOpen(rowOf(row));
 });
 host.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.matches('.cards .card')&&cfg.onOpen)cfg.onOpen(rowOf(e.target))});
 draw();
 return{refresh:draw,selection:()=>[...st.sel],query:()=>st.q,setFilter(k,v){st.f[k]=v;const s=$(`[data-f="${k}"]`,host);if(s)s.value=v;st.page=1;draw()}};
}
