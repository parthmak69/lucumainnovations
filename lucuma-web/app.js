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
let items=[{d:'',s:'',a:''}],bodyEdited=false,requestedRole=null;

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

const siteRoot=()=>((CFG.siteUrl||location.origin).replace(/\/$/,''));
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
   throw new Error('Session expired. Sign in again.');
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
 DOCS=await rest('documents?select=id,type,number,title,data,status,created_at,created_by&order=created_at.desc&limit=1000');
};

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
   $('lm').textContent='Your access is not active. Ask a core member.';
   return logout();
  }
  if(requestedRole && ME.role!==requestedRole){
   const actual=ME.role=='core'?'Core Member':'Team Member';
   logout();
   $('lm').textContent='This account is registered as '+actual+'. Select the matching role to sign in.';
   requestedRole=null;
   return;
  }
  requestedRole=null;
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
  $('who').textContent=(ME.name||ME.email)+' · '+(ME.role=='core'?'Core member':'Team member');
  go('letter');
 }catch(e){
  $('lm').textContent=e.message;
  logout();
 }
}

async function persist(rec){
 if(cur){
  const r=await rest('documents?id=eq.'+cur,{method:'PATCH',body:JSON.stringify(rec)});
  if(!r||!r[0])throw new Error('The document update returned no record. Check your Supabase UPDATE policy.');
  cur=r[0].id;
 }else{
  const r=await rest('documents',{method:'POST',body:JSON.stringify(rec)});
  if(!r||!r[0])throw new Error('The document was not returned after saving. Check your Supabase INSERT policy.');
  cur=r[0].id;
 }
 await loadDocs();
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
<div class="contact">${esc(S.city)} | ${esc(S.web)} | ${esc(S.email)}</div><hr class="rule">
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
<div class="chead"><img src="assets/logo.png"><div><b>LUCUMA INNOVATIONS</b><small>TECHNOLOGY | INNOVATION | SOLUTIONS</small></div></div>
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

     ${fb}

     <div class="tot">
      <span>TOTAL AMOUNT DUE</span>
      <span>${m(tot)} ${d.cur}</span>
     </div>

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

  ['cn','ce','cc','ca','ct','agr','inote','idue']
   .forEach(k=>$(k).value='');

  $('idate').value=iso();
  $('tax').value=0;
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

 $('app').style.display=ed?'':'none';
 $('hist').hidden=m!='hist';
 $('team').hidden=m!='team';
 $('set').hidden=m!='set';

 if(ed){
  $('f-letter').hidden=m!='letter';
  $('f-cert').hidden=m!='cert';
  $('f-invoice').hidden=m!='invoice';
  fresh();
 }

 if(m=='hist')histDraw();
 if(m=='team')teamLoad();
 if(m=='set')setDraw();
}

const KL={
 offer:'Offer letter',
 appt:'Appointment letter',
 intern:'Internship offer'
};

function histDraw(){
 const core=ME&&ME.role=='core';

 $('hmsg').textContent=DOCS.length+' document'+(DOCS.length==1?'':'s');

 $('ht').innerHTML=
  '<tr><th>Number</th><th>Type</th><th>Name</th><th>Saved</th><th></th></tr>'+
  (DOCS.map(d=>{
   const c=d.type=='certificate';

   return`<tr>
    <td>${esc(d.number)}</td>
    <td>
     ${d.type=='letter'?KL[d.data.kind]||'Letter':d.type=='invoice'?'Invoice':'Certificate'}
     ${d.status!='valid'?' <b style="color:#c0264b">(revoked)</b>':''}
    </td>
    <td>${esc(d.title)}</td>
    <td>${new Date(d.created_at).toLocaleDateString('en-GB')}</td>
    <td>
     <button class="btn sm" data-open="${d.id}">Open / QR</button>
     ${c?`<button class="btn sm" data-copy="${esc(d.number)}">Copy verify link</button>`:''}
     ${c&&core?`<button class="btn sm" data-rev="${d.id}">${d.status=='valid'?'Revoke':'Restore'}</button>`:''}
     ${core?`<button class="btn sm danger" data-rm="${d.id}">Delete ${c?'certificate':'document'}</button>`:''}
    </td>
   </tr>`;
  }).join('')||'<tr><td colspan="5">Nothing saved yet.</td></tr>');
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
      <select data-r="${p.id}" ${me?'disabled':''}>
       <option value="member" ${p.role=='member'?'selected':''}>Team member</option>
       <option value="core" ${p.role=='core'?'selected':''}>Core member</option>
      </select>
     </td>
     <td>
      <input type="checkbox" data-a="${p.id}" ${p.active?'checked':''} ${me?'disabled':''} style="width:auto">
     </td>
     <td><button class="btn sm" data-ts="${p.id}">Save</button></td>
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

  $('smsg').textContent='Settings saved for the whole team.';

 }catch(e){
  $('smsg').textContent='Could not save: '+e.message;
 }
}

/* EVENT HANDLERS */

$('nav').onclick=e=>e.target.dataset.m&&go(e.target.dataset.m);
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

 const n=(
  mode=='letter'
   ?val('lref')+' '+val('name')
   :mode=='cert'
    ?val('cno')+' '+val('cname')
    :val('inum')+' '+val('cn')
 ).replace(/[\/\\:*?"<>|]/g,'-').trim()||'Lucuma document';

 const t=document.title;
 document.title=n;
 window.print();
 document.title=t;
};

/* HISTORY */

$('ht').onclick=async e=>{
 const b=e.target.dataset;
 const id=b.open||b.rm||b.rev;

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
   histDraw();
  }

  if(b.rm&&confirm('Delete this document permanently?')){
   await rest('documents?id=eq.'+id,{method:'DELETE'});
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
  await rest('profiles?id=eq.'+id,{
   method:'PATCH',
   body:JSON.stringify({
    name:document.querySelector(`[data-n="${id}"]`).value.trim(),
    role:document.querySelector(`[data-r="${id}"]`).value,
    active:document.querySelector(`[data-a="${id}"]`).checked
   })
  });

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

 $('rsub').textContent=recovery
  ?'Choose a new password for your account.'
  :'Enter your work email. If an account exists, we will send a password reset link.';
};

const showLogin=()=>{
 $('rf').hidden=true;
 $('lf').hidden=false;
 $('rm').textContent='';
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

  const redirect=(CFG.siteUrl||location.origin).replace(/\/$/,'')+'/';

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
 requestedRole=$('lr').value;

 try{
  await authCall('password',{
   email:$('le').value.trim(),
   password:$('lp').value
  });

  $('lp').value='';
  await boot();

 }catch(er){
  requestedRole=null;
  $('lm').textContent=er.message;
 }
};

window.onresize=()=>$('shell').hidden||draw();

initialiseRecovery().finally(()=>{
 if($('rf').hidden)boot();
    if($('rf').hidden)boot();
});