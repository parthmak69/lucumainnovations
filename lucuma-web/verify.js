const CFG=window.CFG||{},API=(CFG.supabaseUrl||'').replace(/\/$/,''),$=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fd=s=>s?new Date(s+'T00:00').toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'}):'-';
const ICON={ok:'<svg viewBox="0 0 24 24" width="46" height="46"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
bad:'<svg viewBox="0 0 24 24" width="40" height="40"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>'};
function show(cls,title,sub,rows){$('vres').innerHTML=`<div class="vr ${cls}"><div class="vi">${ICON[cls=='ok'?'ok':'bad']}</div><h3>${title}</h3><p>${sub}</p>${rows?`<table class="vt">${rows}</table>`:''}</div>`}
async function check(no){no=(no||'').trim().toUpperCase();if(!no)return;$('vn').value=no;$('vres').innerHTML='<p class="vsub">Checking…</p>';
 try{if(!API)throw new Error('This site is not configured yet.');
  const r=await fetch(API+'/rest/v1/rpc/verify_certificate',{method:'POST',headers:{apikey:CFG.anonKey,Authorization:'Bearer '+CFG.anonKey,'Content-Type':'application/json'},body:JSON.stringify({p_no:no})});
  if(!r.ok)throw new Error('Verification service unavailable.');const c=await r.json();
  if(!c)return show('bad','Not verified','No certificate with this number was issued by Lucuma Innovations.');
  const rows=[['Awarded to',c.holder],['Programme',`Internship · ${c.role}`],['Period',`${c.period} (${fd(c.start)} to ${fd(c.end)})`],['Internship type',c.ptype],['Issued on',fd(c.issued)],['Certificate no.',c.number]].map(([a,b])=>`<tr><td>${a}</td><td>${esc(b)}</td></tr>`).join('');
  if(c.status!='valid')return show('bad','Certificate revoked','This certificate was issued by Lucuma Innovations but is no longer valid.',rows);
  show('ok','Verified certificate','This certificate was issued and signed by Lucuma Innovations.',rows)
 }catch(e){show('bad','Could not verify',esc(e.message))}}
$('vf').onsubmit=e=>{e.preventDefault();history.replaceState(null,'','?c='+encodeURIComponent($('vn').value.trim()));check($('vn').value)};
check(new URLSearchParams(location.search).get('c'));
