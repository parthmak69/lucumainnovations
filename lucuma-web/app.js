const CFG=window.CFG||{},API=(CFG.supabaseUrl||'').replace(/\/$/,'');
const $=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fd=s=>s?new Date(s+'T00:00').toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'}):'-';
const iso=()=>new Date().toISOString().slice(0,10),val=id=>$(id).value.trim();

const SF=[
 ['city','City line','Mumbai, India'],
 ['web','Website','www.lucumainnovations.com'],
 ['email','Email','info@lucumainnovations.com'],
 ['phone','Phones','+91 99300 80190 / +91 77388 31706'],
 ['reg','Registration no.',''],
 ['bh','Account holder',''],
 ['bn','Bank name',''],
 ['ba','Account number',''],
 ['bi','IFSC code',''],
 ['bs','SWIFT','NA'],
 ['bu','UPI ID',''],
 ['lstart','First auto letter number','2']
];

let S=Object.fromEntries(SF.map(f=>[f[0],f[2]]));
let SIG={},ME=null,DOCS=[],TEAM=[],cur=null,mode='letter';
let items=[{d:'',s:'',a:''}],bodyEdited=false;

function roleLabel(role) {
    const labels = {
        admin: 'Admin',
        ceo: 'CEO',
        cto: 'CTO',
        member: 'Team Member',
        core: 'Core Member'
    };

    return labels[role] || String(role || 'Team Member').replace(/_/g,' ').replace(/\b\w/g, c => c.toUpperCase());
}

const BODY={
 offer:"We are pleased to offer you the position of {role} at Lucuma Innovations, with effect from {start}.\n\nYour compensation will be {pay}. Your responsibilities, reporting structure and other terms of employment will be communicated separately in writing.\n\nThis offer is valid until {valid}. Please sign and return the acceptance below to confirm.\n\nWe look forward to welcoming you to Lucuma Innovations.",
 appt:"We are pleased to formally appoint you as {role} of Lucuma Innovations, effective from {start}.\n\nConsidering your capabilities, leadership and potential, we believe you will be a valuable addition to our team.\n\nYour responsibilities, reporting structure, remuneration and other terms of employment will be communicated separately in writing.\n\nWe congratulate you on your appointment and look forward to your contributions towards the growth and success of Lucuma Innovations.",
 intern_Paid:"We are pleased to offer you an internship as {role} at Lucuma Innovations for a period of {period}, from {start} to {end}.\n\nThis is a paid internship. You will receive a stipend of {pay}.\n\nYour mode of work will be {mode}. During the internship you will work on live projects, learn from our team and receive guidance from a mentor. On successful completion you will receive a certificate of completion.\n\nThis offer is valid until {valid}. Please sign and return the acceptance below to confirm.",
 intern_Unpaid:"We are pleased to offer you an internship as {role} at Lucuma Innovations for a period of {period}, from {start} to {end}.\n\nThis is an unpaid internship. It offers hands-on experience on live projects, mentorship from our team and a certificate of completion on successful completion.\n\nYour mode of work will be {mode}.\n\nThis offer is valid until {valid}. Please sign and return the acceptance below to confirm."
};

const defBody=()=>$('kind').value=='intern'?BODY['intern_'+$('ptype').value]:BODY[$('kind').value];
const REMARK="During this period, {name} showed dedication, a strong willingness to learn and made valuable contributions to the projects assigned.";
const TERMS="Payment is due by the date stated on this invoice.\nProject scope, timelines and deliverables are governed by the agreement between the client and Lucuma Innovations.\nApplicable taxes are calculated according to the relevant legal and tax requirements.";

const periodTxt=(a,b)=>{
 if(!a||!b)return'';
 const d=Math.round((new Date(b)-new Date(a))/864e5)+1;
 if(d<=0)return'';
 if(d>=45){const r=Math.round(d/30.44);return r+(r==1?' month':' months')}
 const w=Math.max(1,Math.round(d/7));
 return w+(w==1?' week':' weeks');
};

const genCert=()=>{
 const A='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
 let s='';
 crypto.getRandomValues(new Uint8Array(8)).forEach(b=>s+=A[b%A.length]);
 return`LI-C-${new Date().getFullYear()}-${s}`;
};

const siteRoot=()=>{const host=location.hostname;const local=host==='localhost'||host==='127.0.0.1'||host==='0.0.0.0';return (local?location.origin:(CFG.siteUrl||location.origin)).replace(/\/$/,'')};
const verifyUrl=no=>`${siteRoot()}/verify.html?c=${encodeURIComponent(no)}`;
const documentUrl=id=>`${siteRoot()}/document.html?id=${encodeURIComponent(id)}`;
const qrSvg=t=>{
 if(typeof qrcode!=='function')throw new Error('QR library missing. Check that vendor/qrcode.js loads before app.js.');
 const q=qrcode(0,'M');
 q.addData(t);
 q.make();
 return q.createSvgTag({cellSize:4,margin:1,scalable:true});
};
const qrBlock=(url,label)=>`<div class="doc-qr-print" style="display:flex;align-items:center;justify-content:flex-end;gap:12px;width:100%;margin:14px 0 0;padding:10px 14px;box-sizing:border-box;clear:both;break-inside:avoid;background:#fff"><small style="font-size:10px;line-height:1.4;text-align:right;max-width:180px">${esc(label)}</small><div class="qr" style="width:82px;height:82px;min-width:82px;display:flex;align-items:center;justify-content:center">${qrSvg(url)}</div></div>`;

/* AUTHENTICATION */

const AUTH=()=>JSON.parse(localStorage.getItem('li_auth')||'null');

async function authCall(grant,body){
 const r=await fetch(API+'/auth/v1/token?grant_type='+grant,{
  method:'POST',
  headers:{apikey:CFG.anonKey,'Content-Type':'application/json'},
  body:JSON.stringify(body)
 });
 const j=await r.json().catch(()=>({}));
 if(!r.ok)throw new Error(j.error_description||j.msg||'Sign-in failed');
 localStorage.setItem('li_auth',JSON.stringify({
  access:j.access_token,
  refresh:j.refresh_token,
  exp:Math.floor(Date.now()/1000)+j.expires_in,
  uid:j.user.id,
  email:j.user.email
 }));
 return j;
}

async function token(){
 let a=AUTH();
 if(!a)throw new Error('Not signed in');
 if(a.exp-60<Date.now()/1000){
  try{
   await authCall('refresh_token',{refresh_token:a.refresh});
   a=AUTH();
  }catch(e){
   logout();
    const err=new Error('Session expired. Sign in again.');
    err.cause=e;
    throw err;
  }
 }
 return a.access;
}

async function rest(p,o={}){
 const t=await token();
 const r=await fetch(API+'/rest/v1/'+p,{
  ...o,
  headers:{
   apikey:CFG.anonKey,
   Authorization:'Bearer '+t,
   'Content-Type':'application/json',
   Prefer:'return=representation',
   ...(o.headers||{})
  }
 });
 if(!r.ok){
  const j=await r.json().catch(()=>({}));
  throw new Error(/duplicate|23505/.test(JSON.stringify(j))?'That number is already used.':(j.message||r.statusText));
 }
 return r.status==204?null:r.json();
}

function logout(){
 localStorage.removeItem('li_auth');
 ME=null;
 $('shell').hidden=true;
 $('login').hidden=false;
}

const loadDocs=async()=>{
 DOCS=await rest('documents?select=id,type,number,title,data,status,created_at,created_by,approval_status,submitted_at&order=created_at.desc&limit=1000');
};

async function audit(action, entityType='system', entityId=null, details={}){
 try{ await rest('audit_logs',{method:'POST',body:JSON.stringify({actor_id:ME?.id||null,action,entity_type:entityType,entity_id:entityId,details})}); }catch(e){ console.warn('Audit log unavailable:',e.message); }
}

const isManager=()=>ME&&(['admin','ceo','cto'].includes(ME.role)||(Array.isArray(ME.permissions)&&ME.permissions.includes('team_view')));
const canAdmin=()=>ME&&['admin','ceo'].includes(ME.role);


/* APPLICATION BOOT */

async function boot(){
 if(!API||!CFG.anonKey){
  $('lm').textContent='Setup needed: add your Supabase URL and anon key to config.js.';
  return;
 }
 const a=AUTH();
 if(!a){
  $('login').hidden=false;
  $('shell').hidden=true;
  return;
 }
 try{
  const p=await rest('profiles?id=eq.'+a.uid);
  ME=p[0];
  if(!ME||!ME.active){
   $('lm').textContent='Your access is not active. Ask an administrator.';
   return logout();
  }
  const st=await rest('settings?key=eq.company');
  if(st[0]){
   const v=st[0].value||{};
   SIG=v.sig||{};
   for(const k in v)if(k!='sig')S[k]=v[k];
  }
  await loadDocs();
  $('lm').textContent='';
  $('login').hidden=true;
  $('shell').hidden=false;
  document.body.dataset.role=ME.role;
  $('who').textContent = (ME.name || ME.email) + ' · ' + (ME.role_label || roleLabel(ME.role));
  document.querySelector('[data-m=team]').hidden=!isManager();
  document.querySelector('[data-m=set]').hidden=!canAdmin();
  if($('teamAdminLink')) $('teamAdminLink').hidden=!canAdmin();
  go('dashboard');
  await audit('login','auth',ME.id,{email:ME.email});
 }catch(e){
  $('lm').textContent=e.message;
  logout();
 }
}

async function persist(rec){
 rec.created_by=cur?(DOCS.find(x=>x.id===cur)?.created_by||ME.id):ME.id;
 if(cur){
  const previous=DOCS.find(x=>x.id===cur);
  if(previous){
   const versions=await rest('document_versions?select=version_no&document_id=eq.'+cur+'&order=version_no.desc&limit=1').catch(()=>[]);
   await rest('document_versions',{method:'POST',body:JSON.stringify({document_id:cur,version_no:(versions[0]?.version_no||0)+1,snapshot:previous,changed_by:ME.id,change_note:'Automatic snapshot before edit'})}).catch(e=>console.warn('Version snapshot unavailable:',e.message));
  }
  const r=await rest('documents?id=eq.'+cur,{method:'PATCH',body:JSON.stringify(rec)});
  if(!r||!r[0])throw new Error('The document update returned no record. Check your Supabase UPDATE policy.');
  cur=r[0].id;
 }else{
  const r=await rest('documents',{method:'POST',body:JSON.stringify(rec)});
  if(!r||!r[0])throw new Error('The document was not returned after saving. Check your Supabase INSERT policy.');
  cur=r[0].id;
 }
 await loadDocs();
 await audit(cur?'document_updated':'document_created','document',cur,{type:rec.type,number:rec.number});
}

/* DOCUMENT NUMBER GENERATION */

function nextNo(){
 if(mode=='letter'){
  const y=($('ldate').value||iso()).slice(0,4),p=`LI/${y}/`;
  const n=Math.max(+S.lstart-1||0,...DOCS.filter(d=>d.type=='letter'&&d.number.startsWith(p)).map(d=>+d.number.slice(p.length)||0));
  return p+String(n+1).padStart(3,'0');
 }
 const dt=new Date(($('idate').value||iso())+'T00:00'),y=dt.getMonth()>=3?dt.getFullYear():dt.getFullYear()-1,p=`LI/${y}-${String((y+1)%100).padStart(2,'0')}/`;
 const n=Math.max(0,...DOCS.filter(d=>d.type=='invoice'&&d.number.startsWith(p)).map(d=>+d.number.slice(p.length)||0));
 return p+String(n+1).padStart(3,'0');
}

/* LETTERS */

const LID={ref:'lref',date:'ldate'};
const CID={name:'cname',role:'crole',start:'cstart',end:'cend',period:'cperiod',ptype:'cptype',date:'cdate',certNo:'cno',remarks:'cremarks',s1n:'cs1n',s1t:'cs1t',s2n:'cs2n',s2t:'cs2t'};

function rdL(){
 const k=$('kind').value,pt=$('ptype').value;
 return{
  kind:k,name:val('name'),role:val('role'),start:val('start'),end:val('end'),
  period:val('period'),ptype:pt,mode:$('mode').value,valid:val('valid'),
  pay:k=='intern'&&pt=='Unpaid'?'':val('pay'),
  ref:val('lref'),date:val('ldate'),body:$('body').value,
  s1n:val('s1n'),s1t:val('s1t'),s2n:val('s2n'),s2t:val('s2t'),
  acc:$('acc').checked
 };
}

function fill(d,M){
 for(const k in d){
  const el=$(M[k]||k);
  if(el)el.type=='checkbox'?el.checked=d[k]:el.value=d[k];
 }
}

const applyKind=()=>{
 $('f-letter').dataset.kind=$('kind').value;
 $('f-letter').dataset.ptype=$('ptype').value;
};

function letterPage(d){
 const v={
  name:d.name,role:d.role,start:d.start?fd(d.start):'',end:d.end?fd(d.end):'',
  period:d.period,mode:d.mode,pay:d.pay,valid:d.valid?fd(d.valid):''
 };
 const paras=d.body.split(/\n\s*\n/)
  .filter(p=>![...p.matchAll(/\{(\w+)\}/g)].some(m=>m[1] in v&&!v[m[1]]))
  .map(p=>`<p>${esc(p.replace(/\{(\w+)\}/g,(m,k)=>v[k]??m))}</p>`).join('');
 const plain=d.name.replace(/^(mr|ms|mrs|miss|dr)\.?\s+/i,'');
 const T={
  offer:['OFFER LETTER','Offer of Employment – '+d.role,'ACCEPTANCE OF OFFER','the offer of'],
  appt:['LETTER OF APPOINTMENT','Appointment as '+d.role,'ACCEPTANCE OF APPOINTMENT','my appointment as'],
  intern:['INTERNSHIP OFFER LETTER',`Internship Offer – ${d.role} (${d.ptype})`,'ACCEPTANCE OF INTERNSHIP OFFER','the internship offer as']
 }[d.kind];
 return`<div class="page lt"><div class="lh"><div class="logo"><img src="assets/logo.png"></div><div><h1>LUCUMA INNOVATIONS</h1><div class="tag">TECHNOLOGY | INNOVATION | SOLUTIONS</div></div></div>
<div class="contact">${esc(S.city)} | ${esc(S.web)} | ${esc(S.email)}</div>
${S.reg ? `<div class="contact">Registration No: ${esc(S.reg)}</div>` : ''}
<hr class="rule">
<div class="lbody"><div class="row"><span><b>Ref. No.:</b> ${esc(d.ref)}</span><span><b>Date:</b> ${fd(d.date)}</span></div>
<div class="ttl">${T[0]}</div><i></i><p><b>To:</b> ${esc(d.name)}</p><p><b>Subject:</b> ${esc(T[1])}</p><p>Dear ${esc(d.name)},</p>${paras}
<p style="margin-bottom:0">Sincerely,<br><b>For Lucuma Innovations</b></p>
<div class="sigs"><div class="sg">${SIG.s1?`<img src="${SIG.s1}">`:''}<b>${esc(d.s1n)}</b>${esc(d.s1t)}</div><div class="sg">${SIG.s2?`<img src="${SIG.s2}">`:''}<b>${esc(d.s2n)}</b>${esc(d.s2t)}</div><img class="stamp" src="assets/stamp.png"></div></div>
${d.acc?`<div class="acc"><h4>${T[2]}</h4><p>I, ${esc(plain)}, hereby acknowledge and accept ${T[3]} ${esc(d.role)} at Lucuma Innovations and agree to the terms stated above.</p><div class="sl"><span>Date:</span><span style="width:300px">Signature:</span></div></div>`:''}
<div class="bar"></div>${cur?qrBlock(documentUrl(cur),'Scan to open this letter'):'<div class="doc-qr-print"><small>Save this letter to generate its QR code.</small></div>'}</div>`;
}

/* CERTIFICATES */

const rdC=()=>({
 name:val('cname'),role:val('crole'),start:val('cstart'),end:val('cend'),
 period:val('cperiod'),ptype:$('cptype').value,date:val('cdate'),
 certNo:val('cno'),remarks:$('cremarks').value,
 s1n:val('cs1n'),s1t:val('cs1t'),s2n:val('cs2n'),s2t:val('cs2t'),
 issuerName:ME?.name||ME?.email||'',issuerEmail:ME?.email||''
});

function certPage(d){
 const rm=esc((d.remarks||'').replace(/\{name\}/g,d.name));
 return`<div class="page cert"><div class="ccorner a"></div><div class="ccorner b"></div><div class="cframe"></div><div class="cin">
<div class="chead"><img src="assets/logo.png"><div><b>LUCUMA INNOVATIONS</b><small>TECHNOLOGY | INNOVATION | SOLUTIONS</small>
${S.reg ? `<small>Registration No: ${esc(S.reg)}</small>` : ''}</div></div>
<div class="ct">CERTIFICATE OF COMPLETION</div><i class="cu"></i><p class="cs">This is to certify that</p><div class="cn">${esc(d.name)||'&nbsp;'}</div>
<p class="cb">has successfully completed a <b>${esc(d.period)}</b> <b>${esc(d.ptype)}</b> internship as <b>${esc(d.role)}</b> at Lucuma Innovations, from <b>${fd(d.start)}</b> to <b>${fd(d.end)}</b>.</p><p class="cb sm">${rm}</p>
<div class="cbot"><div class="sg2">${SIG.s1?`<img src="${SIG.s1}">`:''}<span class="ln"></span><b>${esc(d.s1n)}</b><small>${esc(d.s1t)}</small></div><div class="sg2">${SIG.s2?`<img src="${SIG.s2}">`:''}<span class="ln"></span><b>${esc(d.s2n)}</b><small>${esc(d.s2t)}</small></div>
<img class="cst" src="assets/stamp.png"><div class="cq"><div class="qr">${qrSvg(verifyUrl(d.certNo))}</div><small>Scan to verify</small><b>${esc(d.certNo)}</b><small>Issued ${fd(d.date)}</small><small class="issuer">Issued by: ${esc(d.issuerName||ME?.name||'Lucuma Innovations')}<br>${esc(d.issuerEmail||ME?.email||'')}</small></div></div></div></div>`;
}
/* INVOICES — PRIVATE DOCUMENT QR */

const rdI=()=>({
 cn:val('cn'),
 ce:val('ce'),
 cc:val('cc'),
 ca:val('ca'),
 ct:val('ct'),
 inum:val('inum'),
 ity:$('ity').value,
 idate:val('idate'),
 idue:val('idue'),
 cur:$('cur').value,
 tax:+$('tax').value||0,
 agr:+$('agr').value||0,
 plab:val('plab'),
 amountPaid:+$('amountPaid').value||0,
 paymentRef:val('paymentRef'),
 paymentNote:val('paymentNote'),
 inote:val('inote'),
 terms:$('terms').value,
 items:items.map(x=>({...x}))
});

function invPage(d){
 const m=n=>new Intl.NumberFormat(
  d.cur=='INR'?'en-IN':'en-US',
  {style:'currency',currency:d.cur}
 ).format(n);

 const sub=d.items.reduce((s,x)=>s+(+x.a||0),0);
 const tx=sub*d.tax/100;
 const tot=sub+tx;
 const paid=Math.max(0,Math.min(tot,+d.amountPaid||0));
 const balance=Math.max(0,tot-paid);
 const sg=SIG.s3;
 const na=v=>esc(v||'NA');

 const rows=d.items.map((x,i)=>
  `<div class="it">
   <span><b>${i+1}</b></span>
   <div>
    <b>${esc(x.d)}</b>
    ${x.s?`<div class="d">${esc(x.s)}</div>`:''}
   </div>
   <span class="a">${m(+x.a||0)}</span>
  </div>`
 ).join('');

 const fb=(d.agr
  ?`<div class="fb"><span>Total Project Value</span><span>${m(d.agr)}</span></div>
    <div class="fb s"><span>${esc(d.plab)}</span><span>${m(sub)}</span></div>
    <div class="fb s"><span>Remaining Project Balance</span><span>${m(d.agr-sub)}</span></div>`
  :`<div class="fb"><span>Subtotal</span><span>${m(sub)}</span></div>`
 )+`<div class="fb">
  <span>${d.tax?`Tax (${d.tax}%)`:'Tax: NIL'}</span>
  <span>${d.tax?m(tx):'NIL'}</span>
 </div>`;

 const paymentRows=`<div class="fb s"><span>Amount Paid</span><span>${m(paid)}</span></div><div class="fb s"><span>Balance Due</span><b>${m(balance)}</b></div>`;
 const kv=(a,b)=>`<div class="kv"><span>${a}</span><b>${b}</b></div>`;

 return`<div class="page inv">
  <div class="ih">
   <div class="logo"><img src="assets/logo.png"></div>
   <div>
    <h1>LUCUMA INNOVATIONS</h1>
    <div class="tag">SOFTWARE DEVELOPMENT | IT SERVICES</div>
    ${S.reg?`<small>Registration No: ${esc(S.reg)}</small>`:''}
   </div>
   <div class="big">INVOICE</div>
  </div>
  <hr class="rule">
  <div class="ib">
   <div class="two">
    <div class="bx">
     <div>BILL TO</div>
     <div>
      <b style="font-size:14px">${esc(d.cn)}</b><br>
      Address: ${na(d.ca)}<br>
      Email: ${na(d.ce)}<br>
      Contact: ${na(d.cc)}<br>
      Tax ID: ${na(d.ct)}
     </div>
    </div>
    <div class="bx">
     <div>INVOICE DETAILS</div>
     <div>
      ${kv('Invoice Number',esc(d.inum))}
      ${kv('Invoice Date',fd(d.idate))}
      ${kv('Payment Due Date',d.idue?fd(d.idue):'-')}
      ${kv('Invoice Type',esc(d.ity))}
      ${kv('Currency',d.cur)}
     </div>
    </div>
   </div>
   <div class="sec">PROJECT INFORMATION</div>
   <div class="th">
    <span>NO.</span>
    <span>DESCRIPTION</span>
    <span>AMOUNT (${d.cur})</span>
   </div>
   ${rows}
<div class="pay">
    <div>
     <div class="hd">PAYMENT INFORMATION</div>
     <table class="pt">
      <tr><td>Account Holder Name</td><td>${esc(S.bh)}</td></tr>
      <tr><td>Bank Name</td><td>${esc(S.bn)}</td></tr>
      <tr><td>Account Number</td><td>${esc(S.ba)}</td></tr>
      <tr><td>IFSC Code</td><td>${esc(S.bi)}</td></tr>
      <tr><td>SWIFT</td><td>${esc(S.bs)}</td></tr>
      <tr><td>UPI ID</td><td>${esc(S.bu)}</td></tr>
     </table>
    </div>

    <div>
     <div class="hd" style="display:flex;justify-content:space-between">
      <span>FINANCIAL BREAKDOWN</span>
      <span>AMOUNT</span>
     </div>

     ${fb}${paymentRows}

     <div class="tot">
      <span>INVOICE TOTAL</span>
      <span>${m(tot)} ${d.cur}</span>
     </div>

     ${d.paymentRef?`<div class="note"><b>Payment reference:</b> ${esc(d.paymentRef)}</div>`:''}
     ${d.paymentNote?`<div class="note">${esc(d.paymentNote)}</div>`:''}
     ${d.inote?`<div class="note">${esc(d.inote)}</div>`:''}
    </div>
</div>

<div class="sec">TERMS &amp; CONDITIONS</div>

<ol class="tc">
    ${d.terms.split('\n').filter(Boolean).map(t=>`<li>${esc(t)}</li>`).join('')}
</ol>

<div class="fs">
    <div>
     <img src="assets/stamp.png">
     <span class="cap">Company Stamp</span>
    </div>

    <div>
     ${sg?`<img src="${sg}">`:''}
     <span class="cap">Authorized Signatory</span>
    </div>
</div>

</div>

<div class="invoice-bottom">

    <div class="foot">
        <b>Thank you for choosing Lucuma Innovations.</b>
        <br>
        ${esc(S.city)} |
        ${esc(S.email)} |
        ${esc(S.phone)} |
        ${esc(S.web)}
    </div>

    <div class="viewer-qr">
        <div class="qr-label">
            <b>Scan to Open This Invoice</b>
            <br>
            <span class="viewer-meta">
                Secure document access — Sign-in required
            </span>
        </div>

        <div class="qr">
            ${cur ? qrSvg(documentUrl(cur)) : ''}
        </div>
    </div>

</div>
</div>`;
}

/* USER INTERFACE */

function draw(){
 const s=$('stage');

 s.innerHTML=mode=='letter'
  ?letterPage(rdL())
  :mode=='cert'
   ?certPage(rdC())
   :invPage(rdI());

 const w=s.firstChild.offsetWidth;
 s.style.zoom=Math.min(1,(s.clientWidth-44)/w);
}

const drawItems=()=>{
 $('items').innerHTML=items.map((x,i)=>
  `<div class="item">
   <input data-i="${i}" data-k="d" placeholder="Description" value="${esc(x.d)}">
   <input data-i="${i}" data-k="s" placeholder="Detail (optional)" value="${esc(x.s)}" style="margin-top:4px">
   <div class="g2" style="margin-top:4px">
    <input data-i="${i}" data-k="a" type="number" placeholder="Amount" value="${esc(x.a)}">
    <button class="btn sm" data-del="${i}">Remove</button>
   </div>
  </div>`
 ).join('');
};

const SIG1={
 s1n:'Siddhi Dantala',
 s1t:'Owner / Founder',
 s2n:'Parth Makwana',
 s2t:'Chief Executive Officer (CEO)'
};

function fresh(){
 cur=null;
 $('msg').textContent='';

 if(mode=='letter'){
  bodyEdited=false;

  fill({
   kind:'offer',
   name:'',
   role:'',
   start:'',
   end:'',
   period:'',
   valid:'',
   pay:'',
   ptype:'Unpaid',
   mode:'Remote',
   date:iso(),
   body:BODY.offer,
   acc:true,
   ...SIG1
  },LID);

  applyKind();
  $('lref').value=nextNo();

 }else if(mode=='cert'){

  fill({
   name:'',
   role:'',
   start:'',
   end:'',
   period:'',
   ptype:'Unpaid',
   date:iso(),
   certNo:genCert(),
   remarks:REMARK,
   ...SIG1
  },CID);

 }else{

  items=[{d:'',s:'',a:''}];
  drawItems();

  ['cn','ce','cc','ca','ct','agr','inote','idue','paymentRef','paymentNote']
   .forEach(k=>$(k).value='');

  $('idate').value=iso();
  $('tax').value=0;
  $('amountPaid').value=0;
  $('terms').value=TERMS;
  $('inum').value=nextNo();
 }

 draw();
}

function go(m){
 mode=m;

 document.querySelectorAll('#nav button[data-m]')
  .forEach(b=>b.classList.toggle('on',b.dataset.m==m));

 const ed=['letter','cert','invoice'].includes(m);
 $('dashboard').hidden=m!='dashboard';

 $('app').style.display=ed?'':'none';
 $('hist').hidden=m!='hist';
 $('team').hidden=m!='team';
 $('set').hidden=m!='set';
 if(m=='dashboard')dashboardDraw();

 if(ed){
  $('f-letter').hidden=m!='letter';
  $('f-cert').hidden=m!='cert';
  $('f-invoice').hidden=m!='invoice';
  fresh();
 }

 if(m=='hist'){histDraw();advancedLoad();drawImportedPdfs();}
 if(m=='team'&&isManager())teamLoad();
 if(m=='set'&&canAdmin())setDraw();
}


async function dashboardDraw(){
 const count=DOCS.length,letters=DOCS.filter(d=>d.type==='letter').length,certs=DOCS.filter(d=>d.type==='certificate').length,invoices=DOCS.filter(d=>d.type==='invoice').length;
 const invoiceTotals=DOCS.filter(d=>d.type==='invoice').reduce((a,d)=>{const x=d.data||{},subtotal=(x.items||[]).reduce((n,i)=>n+(+i.a||0),0),total=subtotal+subtotal*(+x.tax||0)/100;a.total+=total;a.paid+=Math.min(total,Math.max(0,+x.amountPaid||0));return a;},{total:0,paid:0});
 const money=n=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(n);
 $('dashStats').innerHTML=[['Total documents',count,'Across your workspace'],['Letters',letters,'Offer and appointment'],['Certificates',certs,'Issued certificates'],['Invoices',invoices,'Tracked invoices'],['Invoice value',money(invoiceTotals.total),'Saved invoice totals'],['Amount received',money(invoiceTotals.paid),'Recorded payments']].map(x=>`<article class="stat-card"><span>${x[0]}</span><strong>${x[1]}</strong><small>${x[2]}</small></article>`).join('');
 $('recentDocs').innerHTML=DOCS.slice(0,6).map(d=>`<div class="recent-row"><div><b>${esc(d.number)}</b><small>${esc(d.title||d.type)} · ${new Date(d.created_at).toLocaleDateString('en-IN')}</small></div><span class="status-pill ${d.status==='valid'?'good':'warn'}">${esc(d.status||'valid')}</span></div>`).join('')||'<p class="msg">No documents yet.</p>';
 const due=DOCS.filter(d=>d.type==='invoice').map(d=>{const x=d.data||{},sub=(x.items||[]).reduce((n,i)=>n+(+i.a||0),0),total=sub+sub*(+x.tax||0)/100;return {d,balance:Math.max(0,total-(+x.amountPaid||0))}}).filter(x=>x.balance>0);
 let notifications=[];
 try{notifications=await rest('notifications?select=id,title,message,category,created_at,read_at&user_id=eq.'+ME.id+'&order=created_at.desc&limit=6')}catch(e){console.warn('Notifications table not available until migration is applied:',e.message)}
 const realNotes=notifications.map(n=>`<div class="recent-row"><div><b>${esc(n.title)}</b><small>${esc(n.message)} · ${new Date(n.created_at).toLocaleDateString('en-IN')}</small></div><span class="status-pill ${n.read_at?'good':'warn'}">${n.read_at?'Read':'New'}</span></div>`).join('');
 const pending=due.slice(0,4).map(x=>`<div class="recent-row"><div><b>${esc(x.d.number)} · Payment pending</b><small>${esc(x.d.title)} · ${money(x.balance)} outstanding</small></div><span class="status-pill warn">Due</span></div>`).join('');
 $('dashNotifications').innerHTML=(realNotes+pending)||'<p class="msg">No notifications or outstanding invoice balances.</p>';
}

const KL={
 offer:'Offer letter',
 appt:'Appointment letter',
 intern:'Internship offer'
};

function histDraw(){
const search=($('historySearch')?.value||'').toLowerCase();
const typeFilter=$('historyType')?.value||'';
const statusFilter=$('historyStatus')?.value||'';
const filtered=DOCS.filter(d=>(!typeFilter||d.type===typeFilter)&&(!statusFilter||d.status===statusFilter)&&(!search||[d.number,d.title,d.type,d.data?.cn,d.data?.name].join(' ').toLowerCase().includes(search)));
const canManageLibrary = isManager();

 $('hmsg').textContent=filtered.length+' of '+DOCS.length+' documents';

 $('ht').innerHTML=
  '<tr><th><input type="checkbox" id="selectAllDocs" aria-label="Select all documents" style="width:auto"></th><th>Number</th><th>Type</th><th>Name</th><th>Saved</th><th></th></tr>'+
  (filtered.map(d=>{
   const c=d.type=='certificate';

   return`<tr>
    <td><input type="checkbox" class="doc-export-check" value="${esc(d.id)}" aria-label="Select ${esc(d.number)}" style="width:auto"></td>
    <td>${esc(d.number)}</td>
    <td>
     ${d.type=='letter'?KL[d.data.kind]||'Letter':d.type=='invoice'?'Invoice':'Certificate'}
     ${d.status!='valid'?' <b style="color:#c0264b">(revoked)</b>':''}
    </td>
    <td>${esc(d.title)}</td>
    <td>${new Date(d.created_at).toLocaleDateString('en-GB')}</td>
    <td>
     <button class="btn sm" data-open="${d.id}">Open / QR</button>
     <button class="btn sm" data-submit-approval="${d.id}" ${d.approval_status==='pending'?'disabled':''}>Submit for approval</button>
     <button class="btn sm" data-export-pdf="${d.id}">Export PDF</button>
     ${c?`<button class="btn sm" data-copy="${esc(d.number)}">Copy verify link</button>`:''}
     ${c&&canManageLibrary?`<button class="btn sm" data-rev="${d.id}">${d.status=='valid'?'Revoke':'Restore'}</button>`:''}
     ${canAdmin()?`<button class="btn sm danger" data-rm="${d.id}">Delete ${c?'certificate':'document'}</button>`:''}
    </td>
   </tr>`;
  }).join('')||'<tr><td colspan="6">Nothing saved yet.</td></tr>');
}

async function save(){
 try{
  let d,num,type,title;

  if(mode=='letter'){
   d=rdL();
   if(!d.name)return $('msg').textContent='Add the name first.',false;
   type='letter';
   num=d.ref;
   title=d.name+' — '+d.role;

  }else if(mode=='cert'){
   d=rdC();
   if(!d.name||!d.start||!d.end)
    return $('msg').textContent='Add the intern name and both dates first.',false;

   type='certificate';
   num=d.certNo;
   title=d.name+' — '+d.role;

  }else{
   d=rdI();
   if(!d.cn)return $('msg').textContent='Add the client name first.',false;

   const invoiceSubtotal=d.items.reduce((n,x)=>n+(+x.a||0),0);
   const invoiceTotal=invoiceSubtotal+invoiceSubtotal*(+d.tax||0)/100;
   if((+d.amountPaid||0)>invoiceTotal)return $('msg').textContent='Amount paid cannot exceed the invoice total.',false;
   type='invoice';
   num=d.inum;
   title=d.cn;
  }

  if(DOCS.some(x=>x.type==type&&x.number==num&&x.id!=cur))
   return $('msg').textContent=num+' is already used. Change the number or press New.',false;

  await persist({type,number:num,title,data:d});

  draw();

  $('msg').textContent='Saved as '+num+'.';
  return true;

 }catch(e){
  $('msg').textContent='Save failed: '+e.message;
  return false;
 }
}

async function teamLoad(){
 try{
  TEAM=await rest('profiles?select=*&order=created_at');

  $('tt').innerHTML=
   '<tr><th>Email</th><th>Name</th><th>Role</th><th>Active</th><th></th></tr>'+
   TEAM.map(p=>{
    const me=p.id==ME.id;

    return`<tr>
     <td>${esc(p.email)}</td>
     <td><input data-n="${p.id}" value="${esc(p.name||'')}"></td>
     <td>
    <select data-r="${p.id}" ${me||ME.role!=='admin'?'disabled':''}>
        <option value="member" ${p.role==='member'?'selected':''}>Team Member</option>
        <option value="admin" ${p.role==='admin'?'selected':''}>Admin</option>
        <option value="ceo" ${p.role==='ceo'?'selected':''}>CEO</option>
        <option value="cto" ${p.role==='cto'?'selected':''}>CTO</option>
    </select>
     </td>
     <td>
      <input type="checkbox" data-a="${p.id}" ${p.active?'checked':''} ${me||ME.role!=='admin'?'disabled':''} style="width:auto">
     </td>
     <td><button class="btn sm" data-ts="${p.id}" ${isManager()?'':'disabled'}>Save</button></td>
    </tr>`;
   }).join('');

 }catch(e){
  $('tmsg').textContent=e.message;
 }
}

function setDraw(){
 $('sf').innerHTML=SF.map(f=>
  `<label>${f[1]}</label><input data-s="${f[0]}" value="${esc(S[f[0]])}">`
 ).join('');
}

const shrink=f=>new Promise(r=>{
 const im=new Image,u=URL.createObjectURL(f);

 im.onload=()=>{
  const k=Math.min(1,500/im.width);
  const c=document.createElement('canvas');

  c.width=im.width*k;
  c.height=im.height*k;

  c.getContext('2d').drawImage(im,0,0,c.width,c.height);

  URL.revokeObjectURL(u);
  r(c.toDataURL('image/png'));
 };

 im.src=u;
});

async function saveSet(){
 try{
  document.querySelectorAll('[data-s]')
   .forEach(i=>S[i.dataset.s]=i.value.trim());

  for(const[id,k]of[['sig1','s1'],['sig2','s2'],['sig3','s3']]){
   const f=$(id).files[0];
   if(f)SIG[k]=await shrink(f);
  }

  await rest('settings?on_conflict=key',{
   method:'POST',
   headers:{Prefer:'resolution=merge-duplicates,return=representation'},
   body:JSON.stringify({key:'company',value:{...S,sig:SIG}})
  });

  await audit('company_settings_updated','settings','company',{});
  $('smsg').textContent='Settings saved for the whole team.';

 }catch(e){
  $('smsg').textContent='Could not save: '+e.message;
 }
}

/* EVENT HANDLERS */

$('nav').onclick=e=>e.target.dataset.m&&go(e.target.dataset.m);
$('quickCreate').onclick=()=>go('letter');
$('historySearch').oninput=()=>histDraw();
$('historyType').onchange=()=>histDraw();
$('historyStatus').onchange=()=>histDraw();
$('out').onclick=logout;

$('f-letter').oninput=e=>{
 const id=e.target.id;

 if(id=='body')bodyEdited=true;

 if((id=='kind'||id=='ptype')&&!bodyEdited)
  $('body').value=defBody();

 if(id=='kind'||id=='ptype')applyKind();

 if(id=='start'||id=='end')
  $('period').value=periodTxt(val('start'),val('end'));

 if(id=='ldate'&&!cur)
  $('lref').value=nextNo();

 draw();
};

$('f-cert').oninput=e=>{
 if(e.target.id=='cstart'||e.target.id=='cend')
  $('cperiod').value=periodTxt(val('cstart'),val('cend'));

 draw();
};

$('f-invoice').oninput=e=>{
 const t=e.target;

 if(t.dataset.i!=null)
  items[t.dataset.i][t.dataset.k]=t.value;

 if(t.id=='idate'&&!cur)
  $('inum').value=nextNo();

 draw();
};

$('f-invoice').onclick=e=>{
 if(e.target.id=='addit'){
  items.push({d:'',s:'',a:''});
  drawItems();
 }

 if(e.target.dataset.del!=null&&items.length>1){
  items.splice(e.target.dataset.del,1);
  drawItems();
  draw();
 }
};

$('new').onclick=fresh;
$('save').onclick=save;

$('pdf').onclick=async()=>{
 if(mode=='cert'&&!(cur&&DOCS.some(x=>x.id==cur))){
  if(!await save())return;
 }

const n = (
    mode == 'letter'
        ? val('lref') + ' ' + val('name')
        : mode == 'cert'
            ? val('cno') + ' ' + val('cname')
            : val('inum') + ' ' + val('cn')
).replace(/[\\/:*?"<>|]/g, '-').trim() || 'Lucuma document';

 const t=document.title;
 document.title=n;
 window.print();
 document.title=t;
};

/* HISTORY */

$('ht').onclick=async e=>{
 const b=e.target.dataset;
 const id=b.open||b.rm||b.rev;

 if(b.exportPdf){
  const u=new URL('document.html',location.href);u.searchParams.set('id',b.exportPdf);
  window.open(u.href,'_blank','noopener');
  return;
 }

 if(b.copy){
  const u=verifyUrl(b.copy);

  try{
   await navigator.clipboard.writeText(u);
   $('hmsg').textContent='Link copied: '+u;
  }catch(_){
   $('hmsg').textContent=u;
  }

  return;
 }

 const d=DOCS.find(x=>x.id==id);
 if(!d)return;

 if(b.open){
  const m=d.type=='letter'
   ?'letter'
   :d.type=='certificate'
    ?'cert'
    :'invoice';

  go(m);
  cur=d.id;

  if(m=='letter'){
   bodyEdited=true;
   fill(d.data,LID);
   applyKind();

  }else if(m=='cert'){
   fill(d.data,CID);

  }else{
   const x=d.data;

   items=x.items;
   drawItems();

   Object.entries({
    cn:x.cn,
    ce:x.ce,
    cc:x.cc,
    ca:x.ca,
    ct:x.ct,
    inum:x.inum,
    ity:x.ity,
    idate:x.idate,
    idue:x.idue,
    cur:x.cur,
    tax:x.tax,
    agr:x.agr||'',
    plab:x.plab,
    amountPaid:x.amountPaid||0,
    paymentRef:x.paymentRef||'',
    paymentNote:x.paymentNote||'',
    inote:x.inote,
    terms:x.terms
   }).forEach(([k,v])=>$(k).value=v);
  }

  draw();
 }

 try{
  if(b.rev){
   await rest('documents?id=eq.'+id,{
    method:'PATCH',
    body:JSON.stringify({
     status:d.status=='valid'?'revoked':'valid'
    })
   });

   await loadDocs();
   await audit('document_status_changed','document',id,{status:d.status=='valid'?'revoked':'valid'});
   histDraw();
  }

  if(b.rm&&confirm('Delete this document permanently?')){
   await rest('documents?id=eq.'+id,{method:'DELETE'});
   await audit('document_deleted','document',id,{number:d.number,type:d.type});
   await loadDocs();
   histDraw();
  }

 }catch(er){
  $('hmsg').textContent=er.message;
 }
};

/* TEAM MANAGEMENT */

$('tt').onclick=async e=>{
 const id=e.target.dataset.ts;
 if(!id)return;

 try{
  const name=document.querySelector(`[data-n="${id}"]`).value.trim();
  const role=document.querySelector(`[data-r="${id}"]`).value;
  const active=document.querySelector(`[data-a="${id}"]`).checked;
  await rest('rpc/manager_update_profile',{method:'POST',body:JSON.stringify({p_id:id,p_name:name,p_role:role,p_active:active})});

  await audit('team_member_updated','profile',id,{role});
  $('tmsg').textContent='Saved.';
  teamLoad();

 }catch(er){
  $('tmsg').textContent=er.message;
 }
};

$('sset').onclick=saveSet;

$('clrsig').onclick=()=>{
 SIG={};
 $('smsg').textContent='Signatures cleared. Press Save settings to apply.';
};

/* PASSWORD RECOVERY — SUPABASE PKCE */

let recoveryAccess=null;

const b64url=bytes=>btoa(String.fromCharCode(...bytes))
 .replace(/\+/g,'-')
 .replace(/\//g,'_')
 .replace(/=+$/,'');

async function createPkcePair(){
 const bytes=crypto.getRandomValues(new Uint8Array(32));
 const verifier=b64url(bytes);

 const digest=await crypto.subtle.digest(
  'SHA-256',
  new TextEncoder().encode(verifier)
 );

 return{
  verifier,
  challenge:b64url(new Uint8Array(digest))
 };
}

const showReset=(recovery=false)=>{
 $('lf').hidden=true;
 $('rf').hidden=false;
 $('rm').textContent='';
 $('request-reset').hidden=recovery;
 $('choose-password').hidden=!recovery;

 // Disabled controls inside the hidden section must not participate in form validation.
 $('re').disabled=recovery;
 $('rp').disabled=!recovery;
 $('rc').disabled=!recovery;

 $('rsub').textContent=recovery
  ?'Choose a new password for your account.'
  :'Enter your work email. If an account exists, we will send a password reset link.';
};

const showLogin=()=>{
 $('rf').hidden=true;
 $('lf').hidden=false;
 $('rm').textContent='';
 $('re').disabled=false;
 $('rp').disabled=true;
 $('rc').disabled=true;
};

$('forgot').onclick=()=>{
 const email=$('le').value.trim();
 $('re').value=email;
 showReset(false);
};

$('back-login').onclick=showLogin;

async function exchangeRecoveryCode(){
 const url=new URL(location.href);
 const code=url.searchParams.get('code');

 if(!code)return false;

 const verifier=localStorage.getItem('li_recovery_verifier');

 if(!verifier){
  showReset(false);
  $('rm').textContent='This reset link was opened in a different browser/device, or the recovery request was started in another browser. Request a new link from this same browser.';
  return true;
 }

 const r=await fetch(API+'/auth/v1/token?grant_type=pkce',{
  method:'POST',
  headers:{
   apikey:CFG.anonKey,
   'Content-Type':'application/json'
  },
  body:JSON.stringify({
   auth_code:code,
   code_verifier:verifier
  })
 });

 const j=await r.json().catch(()=>({}));

 if(!r.ok)
  throw new Error(j.msg||j.message||j.error_description||'The reset link is invalid or expired. Request a new one.');

 recoveryAccess=j.access_token;

 localStorage.removeItem('li_recovery_verifier');
 history.replaceState(null,'',url.pathname+url.hash);

 showReset(true);
 return true;
}

async function initialiseRecovery(){
 const hash=new URLSearchParams(location.hash.slice(1));

 if(hash.get('error')){
  showReset(false);
  $('rm').textContent=hash.get('error_description')||'The reset link is invalid or expired. Request a new one.';
  return;
 }

 if(hash.get('type')==='recovery'&&hash.get('access_token')){
  recoveryAccess=hash.get('access_token');
  showReset(true);
  return;
 }

 try{
  await exchangeRecoveryCode();
 }catch(e){
  showReset(false);
  $('rm').textContent=e.message;
 }
}

$('rf').onsubmit=async e=>{
 e.preventDefault();
 $('rm').textContent='';

 if(!$('choose-password').hidden){

  if(!$('rp').value||$('rp').value.length<8){
   $('rm').textContent='Use a password with at least 8 characters.';
   return;
  }

  if($('rp').value!==$('rc').value){
   $('rm').textContent='Passwords do not match.';
   return;
  }

  if(!recoveryAccess){
   $('rm').textContent='Your recovery session is missing or expired. Request a new reset link.';
   return;
  }

  try{
   const r=await fetch(API+'/auth/v1/user',{
    method:'PUT',
    headers:{
     apikey:CFG.anonKey,
     Authorization:'Bearer '+recoveryAccess,
     'Content-Type':'application/json'
    },
    body:JSON.stringify({password:$('rp').value})
   });

   const j=await r.json().catch(()=>({}));

   if(!r.ok)
    throw new Error(j.msg||j.message||'Could not update the password. Request a new reset link.');

   recoveryAccess=null;

   localStorage.removeItem('li_recovery_verifier');
   localStorage.removeItem('li_auth');

   $('rp').value='';
   $('rc').value='';

   history.replaceState(null,'',location.pathname);

   showLogin();
   $('lm').textContent='Password updated. Sign in with your new password.';

  }catch(er){
   $('rm').textContent=er.message;
  }

  return;
 }

 const email=$('re').value.trim();

 if(!email){
  $('rm').textContent='Enter your work email.';
  return;
 }

 try{
  const{verifier,challenge}=await createPkcePair();

  localStorage.setItem('li_recovery_verifier',verifier);

  const redirect=siteRoot()+'/';

  const r=await fetch(
   API+'/auth/v1/recover?redirect_to='+encodeURIComponent(redirect),
   {
    method:'POST',
    headers:{
     apikey:CFG.anonKey,
     'Content-Type':'application/json'
    },
    body:JSON.stringify({
     email,
     code_challenge:challenge,
     code_challenge_method:'s256'
    })
   }
  );

  const j=await r.json().catch(()=>({}));

  if(!r.ok){
   localStorage.removeItem('li_recovery_verifier');
   throw new Error(j.msg||j.message||'Unable to request a reset link. Try again.');
  }

  $('rm').textContent='If an account exists for this email, password reset instructions have been sent. Open the email link in this same browser.';

 }catch(er){
  $('rm').textContent=er.message;
 }
};

/* LOGIN */

$('lf').onsubmit=async e=>{
 e.preventDefault();
 $('lm').textContent='';

 try{
  await authCall('password',{
   email:$('le').value.trim(),
   password:$('lp').value
  });

  // The selected role is a sign-in check only; it never grants permissions.
  // The role stored in the Supabase profile remains authoritative.
  const account=AUTH();
  const profiles=await rest('profiles?id=eq.'+account.uid);
  const profile=profiles[0];
  if(!profile || !profile.active){
   logout();
   throw new Error('Your account is not active. Ask a Lucuma administrator.');
  }
  if(![...$('lr').options].some(o=>o.value===profile.role)){
   $('lr').add(new Option(profile.role_label || roleLabel(profile.role), profile.role));
   $('lr').value = profile.role;
  }
  if(profile.role !== $('lr').value){
   logout();
   throw new Error('Selected role does not match your assigned account role. Please select '+(profile.role_label || roleLabel(profile.role))+'.');
  }

  $('lp').value='';
  await boot();

 }catch(er){
  $('lm').textContent=er.message;
 }
};

window.onresize=()=>$('shell').hidden||draw();



/* PASSWORD VISIBILITY TOGGLES */
document.querySelectorAll('[data-password-toggle]').forEach(button=>{
 button.addEventListener('click',()=>{
  const input=$(button.dataset.passwordToggle);
  if(!input)return;
  const reveal=input.type==='password';
  input.type=reveal?'text':'password';
  button.setAttribute('aria-label',reveal?'Hide password':'Show password');
  button.setAttribute('title',reveal?'Hide password':'Show password');
  button.setAttribute('aria-pressed',String(reveal));
  button.classList.toggle('is-visible',reveal);
  button.innerHTML=reveal
   ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.2A10.8 10.8 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.1 3.8M6.2 6.2C3.5 8 2 12 2 12s3.6 7 10 7c1.2 0 2.3-.2 3.3-.6"/></svg>'
   : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>';
 });
});

/* LOCAL PDF LIBRARY — imported PDFs stay in this browser/device. */
const PDF_DB='lucuma_docs_pdf_library',PDF_STORE='pdfs';
function openPdfDb(){return new Promise((resolve,reject)=>{
 const req=indexedDB.open(PDF_DB,1);
 req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains(PDF_STORE))db.createObjectStore(PDF_STORE,{keyPath:'id'});};
 req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
});}
async function pdfStore(mode,work){const db=await openPdfDb();return new Promise((resolve,reject)=>{
 const tx=db.transaction(PDF_STORE,mode),store=tx.objectStore(PDF_STORE);let result;
 try{result=work(store);}catch(e){reject(e);return;}
 tx.oncomplete=()=>{db.close();resolve(result?.result??result);};tx.onerror=()=>{db.close();reject(tx.error);};tx.onabort=()=>{db.close();reject(tx.error);};
});}
async function drawImportedPdfs(){
 const box=$('importedPdfList'),queue=$('importApprovalQueue'),approved=$('approvedImportedPdfList');
 if(!box)return;
 try{
  const rows=await rest('imported_pdfs?select=id,file_name,detected_type,detected_number,detected_recipient,verification_code,status,approval_status,submitted_at,review_note,created_at,uploaded_by&order=created_at.desc&limit=200');
  const mine=rows.filter(f=>f.uploaded_by===ME.id);
  const visible=rows.filter(f=>isManager()||f.uploaded_by===ME.id);
  const card=f=>{
   const canVerify=f.approval_status==='approved'&&!!f.verification_code;
   return `<div class="imported-pdf"><span><b>${esc(f.file_name||'Imported PDF')}</b><small>${esc(f.detected_type||'unknown')} · ${esc(f.detected_number||'number not detected')} · ${esc(f.approval_status||'draft')}${f.review_note?' · '+esc(f.review_note):''}</small></span><span class="imported-pdf-actions"><button class="btn sm" type="button" data-import-open="${esc(f.id)}">Open</button><button class="btn sm" type="button" data-import-download="${esc(f.id)}">Download</button>${canVerify?`<a class="btn sm" href="${esc(siteRoot()+'/verify-imported.html?code='+encodeURIComponent(f.verification_code))}" target="_blank" rel="noopener">Verify</a>`:''}${canAdmin()?`<button class="btn sm danger" type="button" data-import-delete="${esc(f.id)}">Delete</button>`:''}${f.approval_status!=='pending'&&f.approval_status!=='approved'&&f.uploaded_by===ME.id?`<button class="btn sm p" type="button" data-import-submit="${esc(f.id)}">Send for approval</button>`:''}${canAdmin()&&f.approval_status==='pending'?`<button class="btn sm" type="button" data-import-review="approve" data-import-id="${esc(f.id)}">Approve</button><button class="btn sm danger" type="button" data-import-review="reject" data-import-id="${esc(f.id)}">Reject</button>`:''}</span></div>`;
  };
  const state=f=>String(f.approval_status||'draft').trim().toLowerCase();
  box.innerHTML=visible.filter(f=>!['pending','approved'].includes(state(f))).map(card).join('')||'<p class="msg">No imported PDF drafts.</p>';
  if(queue)queue.innerHTML=(canAdmin()?visible.filter(f=>state(f)==='pending'):mine.filter(f=>state(f)==='pending')).map(card).join('')||'<p class="msg">No imported PDFs pending approval.</p>';
  if(approved)approved.innerHTML=visible.filter(f=>state(f)==='approved').map(card).join('')||'<p class="msg">No approved imported PDFs yet.</p>';
 }catch(e){
  console.error('Imported PDF registry:',e);
  box.textContent='PDF registry unavailable: '+e.message;
 }
}
$('pdfImport')?.addEventListener('change',async e=>{
 const files=[...e.target.files||[]];if(!files.length)return;
 const status=$('advancedMsg');
 for(const file of files){
  if(file.type!=='application/pdf'&&!file.name.toLowerCase().endsWith('.pdf')){alert(`${file.name} is not a PDF.`);continue;}
  if(file.size>25*1024*1024){alert(`${file.name} exceeds the 25 MB limit.`);continue;}
  try{
   status.textContent=`Recognising ${file.name}…`;
   const bytes=new Uint8Array(await file.arrayBuffer());let binary='';for(let i=0;i<bytes.length;i+=0x8000)binary+=String.fromCharCode(...bytes.subarray(i,i+0x8000));
   const response=await fetch(API+'/functions/v1/process-imported-pdf',{method:'POST',headers:{apikey:CFG.anonKey,Authorization:'Bearer '+await token(),'Content-Type':'application/json'},body:JSON.stringify({name:file.name,base64:btoa(binary),siteUrl:siteRoot()})});
   const result=await response.json();if(!response.ok)throw new Error(result.error||'PDF processing failed');
   const pdfBytes=Uint8Array.from(atob(result.stampedPdfBase64),c=>c.charCodeAt(0));const blob=new Blob([pdfBytes],{type:'application/pdf'});const link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download=file.name.replace(/\.pdf$/i,'')+'-verified.pdf';link.click();setTimeout(()=>URL.revokeObjectURL(link.href),30000);
   await audit('imported_pdf_registered','imported_pdf',result.record.id,{name:file.name,verification_code:result.record.verification_code,recognized:result.recognized});
   status.textContent=`${file.name}: imported as draft. Review the PDF details, then select Send for approval.`;
  }catch(err){status.textContent=`Could not process ${file.name}: ${err.message}`;}
 }
 e.target.value='';await drawImportedPdfs();
});
async function handleImportedPdfAction(e){
 const openBtn=e.target.closest('[data-import-open]');
 const downloadBtn=e.target.closest('[data-import-download]');
 const submitBtn=e.target.closest('[data-import-submit]');
 const reviewBtn=e.target.closest('[data-import-review]');
 const deleteBtn=e.target.closest('[data-import-delete]');
 const button=openBtn||downloadBtn||submitBtn||reviewBtn||deleteBtn;
 if(!button)return;
 const id=button.dataset.importOpen||button.dataset.importDownload||button.dataset.importSubmit||button.dataset.importId||button.dataset.importDelete;
 const status=$('advancedMsg');
 try{
  if(submitBtn){
   await rest('rpc/submit_imported_document_for_approval',{method:'POST',body:JSON.stringify({p_document_id:id})});
   await audit('imported_pdf_submitted_for_approval','imported_document',id,{});
   status.textContent='Imported PDF sent for approval.';
   await drawImportedPdfs();return;
  }
  if(deleteBtn){
   if(!canAdmin())throw new Error('Only Admin or CEO can delete imported PDFs.');
   if(!confirm('Permanently delete this imported PDF and its stored file? This cannot be undone.'))return;
   const response=await fetch(API+'/functions/v1/process-imported-pdf',{
    method:'POST',headers:{apikey:CFG.anonKey,Authorization:'Bearer '+await token(),'Content-Type':'application/json'},
    body:JSON.stringify({action:'delete',id})
   });
   const data=await response.json().catch(()=>({}));
   if(!response.ok||!data.success)throw new Error(data.error||'Unable to delete imported PDF.');
   status.textContent='Imported PDF deleted successfully.';
   await drawImportedPdfs();return;
  }
  if(reviewBtn){
   if(!canAdmin())throw new Error('Only Admin or CEO can review imported PDFs.');
   let note='';
   if(reviewBtn.dataset.importReview==='reject'){
    note=prompt('Enter the rejection reason:')||'Rejected by reviewer';
   }else{
    note=prompt('Optional approval note:')||'';
   }
   await rest('rpc/review_imported_document',{method:'POST',body:JSON.stringify({p_document_id:id,p_decision:reviewBtn.dataset.importReview,p_note:note})});
   await audit('imported_pdf_'+reviewBtn.dataset.importReview,'imported_document',id,{note});
   status.textContent='Imported PDF '+reviewBtn.dataset.importReview+'d.';
   await drawImportedPdfs();return;
  }
  const response=await fetch(API+'/functions/v1/process-imported-pdf',{
   method:'POST',headers:{apikey:CFG.anonKey,Authorization:'Bearer '+await token(),'Content-Type':'application/json'},
   body:JSON.stringify({action:'download',id})
  });
  const data=await response.json();
  if(!response.ok)throw new Error(data.error||'Unable to access imported PDF.');
  if(openBtn){window.open(data.url,'_blank','noopener');}
  else{const a=document.createElement('a');a.href=data.url;a.download=data.name||'imported-document.pdf';document.body.appendChild(a);a.click();a.remove();}
 }catch(err){status.textContent=err.message;}
}
$('importedPdfList')?.addEventListener('click',handleImportedPdfAction);
$('importApprovalQueue')?.addEventListener('click',handleImportedPdfAction);
$('approvedImportedPdfList')?.addEventListener('click',handleImportedPdfAction);
$('ht')?.addEventListener('change',e=>{if(e.target.id==='selectAllDocs')document.querySelectorAll('.doc-export-check').forEach(c=>c.checked=e.target.checked);});
$('exportAllPdf')?.addEventListener('click',()=>{
 const ids=[...document.querySelectorAll('.doc-export-check:checked')].map(x=>x.value);
 if(!ids.length){alert('Select at least one saved document first.');return;}
 ids.forEach((id,i)=>{const u=new URL('document.html',location.href);u.searchParams.set('id',id);setTimeout(()=>window.open(u.href,'_blank','noopener'),i*180);});
});


/* ADVANCED WORKSPACE FEATURES */
async function advancedLoad(){
 const msg=$('advancedMsg');
 try{
  const approvals=await rest('documents?select=id,number,title,type,approval_status,created_by,submitted_at,review_note&approval_status=eq.pending&order=submitted_at.desc');
  $('approvalQueue').innerHTML=approvals.length?approvals.map(d=>`<div class="recent-row"><div><b>${esc(d.number)} · ${esc(d.title)}</b><small>${esc(d.type)} · submitted ${d.submitted_at?new Date(d.submitted_at).toLocaleDateString('en-IN'):'date unavailable'}</small></div><span>${canAdmin()?`<button class="btn sm" data-approve="${d.id}">Approve</button><button class="btn sm danger" data-reject="${d.id}">Reject</button>`:'Pending'}</span></div>`).join(''):'<p class="msg">No documents awaiting approval.</p>';
  const docs=DOCS.filter(d=>d.type==='invoice');const totals=docs.reduce((a,d)=>{const x=d.data||{},sub=(x.items||[]).reduce((n,i)=>n+(+i.a||0),0),total=sub+sub*(+x.tax||0)/100;a.revenue+=total;a.paid+=Math.min(total,+x.amountPaid||0);return a;},{revenue:0,paid:0});
  $('advancedAnalytics').innerHTML=[['Documents',DOCS.length],['Invoices',docs.length],['Invoice value',money(totals.revenue)],['Received',money(totals.paid)],['Outstanding',money(totals.revenue-totals.paid)],['Certificates',DOCS.filter(d=>d.type==='certificate').length]].map(x=>`<article class="stat-card"><span>${x[0]}</span><strong>${x[1]}</strong></article>`).join('');
  const versions=await rest('document_versions?select=id,document_id,version_no,change_note,created_at&order=created_at.desc&limit=12').catch(()=>[]);
  $('versionHistory').innerHTML=versions.length?versions.map(v=>{const d=DOCS.find(x=>x.id===v.document_id);return `<div class="recent-row"><div><b>${esc(d?.number||'Document')} · Version ${v.version_no}</b><small>${esc(v.change_note||'Saved version')} · ${new Date(v.created_at).toLocaleString('en-IN')}</small></div><button class="btn sm" data-restore-version="${v.id}">Restore</button></div>`}).join(''):'<p class="msg">No saved versions yet. Versions are captured automatically before document edits.</p>';
 }catch(e){if(msg)msg.textContent=e.message;}
}
$('hist')?.addEventListener('click',async e=>{
 const b=e.target.closest('button');if(!b)return;
 try{
  if(b.dataset.approve||b.dataset.reject){const id=b.dataset.approve||b.dataset.reject;const note=b.dataset.reject?prompt('Reason for rejection:')||'Rejected':'';await rest('rpc/review_document',{method:'POST',body:JSON.stringify({p_document_id:id,p_decision:b.dataset.approve?'approved':'rejected',p_note:note})});await audit(b.dataset.approve?'document_approved':'document_rejected','document',id,{note});await advancedLoad();}
  if(b.dataset.restoreVersion){const rows=await rest('document_versions?select=*&id=eq.'+b.dataset.restoreVersion);const v=rows[0];if(!v||!confirm('Restore this saved version? Current content will be saved as another version first.'))return;const d=DOCS.find(x=>x.id===v.document_id);if(!d)throw new Error('Document not available');const snap=v.snapshot;await persist({type:snap.type,number:snap.number,title:snap.title,data:snap.data,status:snap.status});await rest('documents?id=eq.'+d.id,{method:'PATCH',body:JSON.stringify({type:snap.type,number:snap.number,title:snap.title,data:snap.data,status:snap.status})});await loadDocs();await histDraw();await advancedLoad();}
 }catch(err){$('advancedMsg').textContent=err.message;}
});
$('ht')?.addEventListener('click',async e=>{const b=e.target.closest('[data-submit-approval]');if(!b)return;const d=DOCS.find(x=>x.id===b.dataset.submitApproval);if(!d)return;try{await rest('rpc/submit_document_for_approval',{method:'POST',body:JSON.stringify({p_document_id:d.id})});await audit('document_submitted_for_approval','document',d.id,{});await loadDocs();histDraw();advancedLoad();$('advancedMsg').textContent='Document submitted for approval.';}catch(err){$('advancedMsg').textContent=err.message;}});
$('backupExport')?.addEventListener('click',async()=>{try{const payload={format:'lucuma-docs-backup-v1',createdAt:new Date().toISOString(),documents:DOCS,settings:await rest('settings?key=eq.company'),payments:await rest('invoice_payments?select=*&order=created_at.asc').catch(()=>[]),versions:await rest('document_versions?select=*&order=created_at.asc').catch(()=>[]),importedPdfs:await rest('imported_pdfs?select=id,document_id,file_name,storage_path,file_sha256,extracted_text,detected_type,detected_number,detected_recipient,detected_issue_date,verification_code,status,uploaded_by,created_at').catch(()=>[])};const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='lucuma-docs-backup-'+iso()+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),30000);$('advancedMsg').textContent='Backup exported. Store it securely; it contains company and document information.';}catch(e){$('advancedMsg').textContent=e.message;}});
$('backupImport')?.addEventListener('change',async e=>{const f=e.target.files?.[0];if(!f)return;try{if(!canAdmin())throw new Error('Only Admin/CEO can restore a backup.');const data=JSON.parse(await f.text());if(data.format!=='lucuma-docs-backup-v1'||!Array.isArray(data.documents))throw new Error('Unsupported or invalid backup file.');if(!confirm(`Restore ${data.documents.length} documents? Existing records will not be deleted; duplicate numbers will be skipped.`))return;let restored=0;for(const d of data.documents){try{await rest('documents',{method:'POST',body:JSON.stringify({type:d.type,number:d.number,title:d.title,data:d.data,status:d.status||'valid',created_by:ME.id})});restored++;}catch(err){console.warn('Skipped backup record',d.number,err.message);}}if(Array.isArray(data.settings)&&data.settings[0])await rest('settings?on_conflict=key',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=representation'},body:JSON.stringify(data.settings[0])}).catch(()=>{});await loadDocs();histDraw();await audit('workspace_backup_restored','backup',null,{restored,total:data.documents.length});$('advancedMsg').textContent=`Restored ${restored} of ${data.documents.length} records. Existing duplicates were skipped.`;}catch(err){$('advancedMsg').textContent=err.message;}e.target.value='';});
$('bulkArchive')?.addEventListener('click',async()=>{const ids=[...document.querySelectorAll('.doc-export-check:checked')].map(x=>x.value);if(!ids.length)return alert('Select documents first.');if(!isManager())return alert('Manager access required.');for(const id of ids)await rest('documents?id=eq.'+id,{method:'PATCH',body:JSON.stringify({status:'archived',archived_at:new Date().toISOString()})});await loadDocs();histDraw();await audit('documents_archived','document',null,{ids});$('advancedMsg').textContent=`Archived ${ids.length} documents.`;});
$('bulkRevoke')?.addEventListener('click',async()=>{const ids=[...document.querySelectorAll('.doc-export-check:checked')].map(x=>x.value).filter(id=>DOCS.find(d=>d.id===id)?.type==='certificate');if(!ids.length)return alert('Select certificates first.');if(!isManager())return alert('Manager access required.');for(const id of ids)await rest('documents?id=eq.'+id,{method:'PATCH',body:JSON.stringify({status:'revoked'})});await loadDocs();histDraw();await audit('certificates_revoked','document',null,{ids});$('advancedMsg').textContent=`Revoked ${ids.length} certificates.`;});

initialiseRecovery().finally(()=>{
 if($('rf').hidden)boot();
});