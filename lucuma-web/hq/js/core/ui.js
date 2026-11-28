import {esc,$,$$} from './util.js';
import {ic} from './icons.js';
const ov=()=>document.getElementById('ov');
const stack=[];
export const closeTop=()=>{const t=stack.pop();if(t){t.el.remove();t.scrim?.remove();t.onClose?.()}};
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&stack.length){e.stopPropagation();closeTop()}},true);
export function toast(msg,type='ok',ms=3200){
 let box=$('.toasts');if(!box){box=document.createElement('div');box.className='toasts';box.setAttribute('role','status');box.setAttribute('aria-live','polite');document.body.appendChild(box)}
 const t=document.createElement('div');t.className='toast '+type;t.innerHTML=`${ic(type==='ok'?'check-c':type==='bad'?'alert':type==='warn'?'alert':'info',20)}<span>${esc(msg)}</span>`;
 box.appendChild(t);setTimeout(()=>{t.style.opacity=0;t.style.transition='.3s';setTimeout(()=>t.remove(),300)},ms);
}
const mount=(cls,inner,{w,onClose,dismiss=true}={})=>{
 const scrim=document.createElement('div');scrim.className='scrim';const el=document.createElement('div');el.className=cls;el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');if(w)el.style.setProperty('--w',w);
 el.innerHTML=inner;ov().append(scrim,el);const rec={el,scrim,onClose};stack.push(rec);
 if(dismiss)scrim.onclick=()=>{const i=stack.indexOf(rec);if(i>=0){stack.splice(i,1);el.remove();scrim.remove();onClose?.()}};
 el.addEventListener('click',e=>{if(e.target.closest('[data-close]')){const i=stack.indexOf(rec);if(i>=0){stack.splice(i,1);el.remove();scrim.remove();onClose?.()}}});
 const f=el.querySelector('input:not([type=hidden]),select,textarea');f&&setTimeout(()=>f.focus(),60);
 return{el,close:()=>{const i=stack.indexOf(rec);if(i>=0){stack.splice(i,1);el.remove();scrim.remove();onClose?.()}}};
};
export const modal=({title,body,foot='',w='640px',onClose})=>mount('modal',`<div class="mh"><h3>${title}</h3><button class="btn ghost ico x" data-close aria-label="Close">${ic('x')}</button></div><div class="mb">${body}</div>${foot?`<div class="mf">${foot}</div>`:''}`,{w,onClose});
export const drawer=({title,body,w='580px',head='',onClose})=>mount('drawer',`<div class="mh"><div class="grow"><h3>${title}</h3>${head}</div><button class="btn ghost ico x" data-close aria-label="Close">${ic('x')}</button></div><div class="mb">${body}</div>`,{w,onClose});
export const confirmDlg=({title='Are you sure?',text='',ok='Confirm',danger=true,onOk})=>{
 const m=modal({title,w:'440px',body:`<p class="mut" style="margin:0">${text}</p>`,foot:`<button class="btn" data-close>Cancel</button><button class="btn ${danger?'d':'p'}" id="cf-ok">${ok}</button>`});
 m.el.querySelector('#cf-ok').onclick=()=>{m.close();onOk()};return m;
};
export const tone=s=>{
 const k=String(s||'').toLowerCase();
 const T={ok:'active approved paid completed done published resolved closed available won received reimbursed present issued delivered online verified low good healthy success on-track healthy fulfilled signed accepted in-stock',
 warn:'pending waiting planning on-hold probation partial medium ordered submitted draft-review review in-review under-review scheduled expiring renewal at-risk away high negotiation trial maintenance',
 bad:'rejected overdue cancelled blocked critical lost revoked failed exited absent escalated expired terminated suspended breach denied lapsed',
 info:'in-progress sent assigned open proposal qualified contacted new quoted contacted ongoing active-project meeting live testing',
 acc:'backlog to-do todo draft published-draft new-lead'};
 const kk=k.replace(/\s+/g,'-');
 for(const[t,l]of Object.entries(T)){if(l.split(' ').includes(kk))return t}
 if(/pending|review|partial|under|on hold/.test(k))return'warn';if(/paid|approv|complete|resolved|active/.test(k))return'ok';if(/reject|overdue|cancel|block|lost|fail/.test(k))return'bad';return'mut';
};
export const badge=(s,t)=>s?`<span class="badge b-${t||tone(s)}">${esc(s)}</span>`:'';
export const prio=p=>`<span class="chip"><i class="pri p-${String(p).toLowerCase()}"></i>${esc(p)}</span>`;
export function menu(e,items){
 document.querySelectorAll('.menu').forEach(m=>m.remove());
 const el=document.createElement('div');el.className='menu';
 el.innerHTML=items.filter(i=>i&&i.show!==false).map((i,n)=>i.sep?'<hr>':`<button data-i="${n}" class="${i.danger?'dng':''}">${i.icon?ic(i.icon):''}${esc(i.label)}</button>`).join('');
 document.body.appendChild(el);
 const r=(e.currentTarget||e.target).getBoundingClientRect?.(),x=e.clientX||r.left,y=e.clientY||r.bottom;
 const W=el.offsetWidth,H=el.offsetHeight;el.style.left=Math.min(Math.max(8,e.clientX&&e.clientX>0?e.clientX:r.right-W),innerWidth-W-8)+'px';el.style.top=Math.min((r?r.bottom+4:y),innerHeight-H-8)+'px';
 const vis=items.filter(i=>i&&i.show!==false);
 el.onclick=ev=>{const b=ev.target.closest('button');if(!b)return;const it=vis[+b.dataset.i];el.remove();it?.run?.()};
 setTimeout(()=>{const off=ev=>{if(!el.contains(ev.target)){el.remove();document.removeEventListener('click',off,true)}};document.addEventListener('click',off,true)},0);
}
/* ---------- forms ---------- */
const opt=o=>typeof o==='object'?o:{v:o,l:o};
export function fieldHTML(f,v){
 const id='ff_'+f.name,val=v??f.value??'',req=f.required?' required':'',ph=f.placeholder?` placeholder="${esc(f.placeholder)}"`:'';
 let inp;
 if(f.type==='textarea')inp=`<textarea id="${id}" name="${f.name}" rows="${f.rows||3}"${req}${ph}>${esc(val)}</textarea>`;
 else if(f.type==='select'){const os=(typeof f.options==='function'?f.options():f.options).map(opt);inp=`<select id="${id}" name="${f.name}"${req}>${f.blank?'<option value="">— Select —</option>':''}${os.map(o=>`<option value="${esc(o.v)}"${String(o.v)===String(val)?' selected':''}>${esc(o.l)}</option>`).join('')}</select>`}
 else if(f.type==='multiselect'){const os=(typeof f.options==='function'?f.options():f.options).map(opt),sel=new Set(Array.isArray(val)?val:[]);inp=`<div id="${id}" data-multi="${f.name}" style="display:flex;flex-wrap:wrap;gap:6px;max-height:130px;overflow:auto;padding:6px;border:1px solid var(--bd);border-radius:10px">${os.map(o=>`<label class="chip" style="cursor:pointer"><input type="checkbox" value="${esc(o.v)}"${sel.has(o.v)?' checked':''}>${esc(o.l)}</label>`).join('')}</div>`}
 else if(f.type==='checkbox')return`<label class="f ${f.span===2?'s2':''}" style="flex-direction:row;align-items:center;gap:9px"><input type="checkbox" name="${f.name}" ${val?'checked':''}> ${esc(f.label)}</label>`;
 else if(f.type==='tags')inp=`<input id="${id}" name="${f.name}" value="${esc(Array.isArray(val)?val.join(', '):val)}"${ph||' placeholder="comma, separated"'}>`;
 else if(f.type==='file')inp=`<input id="${id}" name="${f.name}" type="file" ${f.accept?`accept="${f.accept}"`:''}${f.multiple?' multiple':''}><small class="dim">${esc(val?'Current: '+val:'File upload handling must be configured for storage; metadata only')}</small>`;
 else inp=`<input id="${id}" name="${f.name}" type="${f.type||'text'}" value="${esc(val)}"${req}${ph}${f.min!=null?` min="${f.min}"`:''}${f.max!=null?` max="${f.max}"`:''}${f.step?` step="${f.step}"`:''}${f.maxlength?` maxlength="${f.maxlength}"`:''}${f.readonly?' readonly':''}>`;
 return`<label class="f ${f.span===2?'s2':''}" for="${id}" data-f="${f.name}">${esc(f.label)}${f.required?' *':''}${inp}${f.help?`<small class="dim">${esc(f.help)}</small>`:''}<span class="err"></span></label>`;
}
export function readForm(root,fields){
 const out={},errs={};
 for(const f of fields){
  const lab=root.querySelector(`[data-f="${f.name}"]`);let v;
  if(f.type==='checkbox'){v=!!root.querySelector(`[name="${f.name}"]`).checked}
  else if(f.type==='multiselect'){v=[...root.querySelectorAll(`[data-multi="${f.name}"] input:checked`)].map(i=>i.value)}
  else{const el=root.querySelector(`[name="${f.name}"]`);if(!el)continue;
   if(f.type==='file'){v=el.files?.length?[...el.files].map(x=>x.name).join(', '):(f.value||'')}
   else{v=el.value.trim();if(f.type==='number')v=v===''?'':+v;if(f.type==='tags')v=v?v.split(',').map(s=>s.trim()).filter(Boolean):[]}}
  let m='';
  const empty=v===''||v==null||(Array.isArray(v)&&!v.length);
  if(f.required&&empty&&f.type!=='checkbox')m='This field is required';
  else if(!empty&&f.type==='email'&&!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v))m='Enter a valid email address';
  else if(!empty&&f.type==='tel'&&!/^[+\d][\d\s()-]{6,}$/.test(v))m='Enter a valid phone number';
  else if(!empty&&f.type==='number'&&(f.min!=null&&v<f.min||f.max!=null&&v>f.max))m=`Must be between ${f.min??'−∞'} and ${f.max??'∞'}`;
  else if(!empty&&f.pattern&&!new RegExp(f.pattern).test(v))m=f.patternMsg||'Invalid format';
  else if(f.validate){m=f.validate(v,out)||''}
  if(lab){lab.classList.toggle('bad',!!m);const e=lab.querySelector('.err');if(e)e.textContent=m}
  if(m)errs[f.name]=m;out[f.name]=v;
 }
 return{values:out,errors:errs,ok:!Object.keys(errs).length};
}
export function formDialog({title,fields,values={},submit='Save',w='680px',onSubmit,extra='',cancel='Cancel'}){
 const m=modal({title,w,body:`<form id="fd" novalidate><div class="fg">${fields.map(f=>fieldHTML(f,values[f.name])).join('')}</div>${extra}</form>`,foot:`<button class="btn" data-close>${cancel}</button><button class="btn p" id="fd-ok">${submit}</button>`});
 const go=()=>{const r=readForm(m.el,fields);if(!r.ok){toast('Please fix the highlighted fields','warn');m.el.querySelector('.bad input,.bad select,.bad textarea')?.focus();return}if(onSubmit(r.values,m)!==false)m.close()};
 m.el.querySelector('#fd-ok').onclick=go;m.el.querySelector('#fd').onsubmit=e=>{e.preventDefault();go()};
 return m;
}
export const empty=(icon,title,sub='')=>`<div class="empty">${ic(icon)}<b>${esc(title)}</b><div>${esc(sub)}</div></div>`;
export const skeleton=(n=4)=>Array.from({length:n},()=>'<div class="skel" style="height:44px;margin-bottom:10px"></div>').join('');
export const tabs=(host,list,{cur,onChange,cls=''}={})=>{
 let c=cur||list[0][0];host.innerHTML=`<div class="tabs ${cls}" role="tablist">${list.map(([k,l,i])=>`<button role="tab" data-t="${k}" class="${k===c?'on':''}">${i?ic(i):''}${esc(l)}</button>`).join('')}</div>`;
 host.onclick=e=>{const b=e.target.closest('[data-t]');if(!b)return;c=b.dataset.t;$$('[data-t]',host).forEach(x=>x.classList.toggle('on',x.dataset.t===c));onChange(c)};
 return{get:()=>c,set:k=>{c=k;$$('[data-t]',host).forEach(x=>x.classList.toggle('on',x.dataset.t===c));onChange(c)}};
};
export const sw=(name,on,attrs='')=>`<label class="switch"><input type="checkbox" name="${name}" ${on?'checked':''} ${attrs}><i></i></label>`;
