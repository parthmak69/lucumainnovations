// Reads the EXISTING Lucuma Docs login (li_auth in localStorage) and loads the profile row.
// Read-only use of the existing auth + REST API; nothing here changes auth or the backend.
const CFG=window.CFG||{},API=(CFG.supabaseUrl||'').replace(/\/$/,'');
const AUTH=()=>{try{return JSON.parse(localStorage.getItem('li_auth')||'null')}catch(e){return null}};
async function fresh(a){
 if(a.exp-60>Date.now()/1000)return a;
 const r=await fetch(API+'/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:{apikey:CFG.anonKey,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:a.refresh})});
 const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error('Session expired');
 const n={access:j.access_token,refresh:j.refresh_token,exp:Math.floor(Date.now()/1000)+j.expires_in,uid:j.user.id,email:j.user.email};
 localStorage.setItem('li_auth',JSON.stringify(n));return n;
}
export async function loadSession(){
 // Local-only preview helper so the UI can be explored without Supabase: workspace.html?preview=ceo (localhost only)
 const q=new URLSearchParams(location.search).get('preview');
 if(q&&['localhost','127.0.0.1','0.0.0.0'].includes(location.hostname)){
  const m={ceo:['ceo','Parth Makwana','parth.makwana@lucumainnovations.com'],admin:['admin','Admin User','admin@lucumainnovations.com'],cto:['cto','Chaitanya Pankar','chaitanya.pankar@lucumainnovations.com'],member:['member','Aditya Rao','aditya.rao@lucumainnovations.com'],hr:['core','Ananya Iyer','ananya.iyer@lucumainnovations.com','HR Manager'],finance:['core','Rohan Deshmukh','rohan.deshmukh@lucumainnovations.com','Finance Manager'],intern:['member','Dev Thakkar','dev.thakkar@lucumainnovations.com','Intern']}[q];
  if(m)return{id:'preview',email:m[2],name:m[1],liRole:m[0],roleLabel:m[3]||'',preview:true};
 }
 const a=AUTH();if(!a)return null;
 const t=await fresh(a);
 const r=await fetch(API+'/rest/v1/profiles?id=eq.'+t.uid,{headers:{apikey:CFG.anonKey,Authorization:'Bearer '+t.access}});
 if(!r.ok)throw new Error('Could not load your profile');
 const p=(await r.json())[0];if(!p||!p.active)return null;
 const email=(p.email||t.email||'').toLowerCase();const allowed=['siddhi@lucumainnovations.com','parth@lucumainnovations.com','chaitanya@lucumainnovations.com'];if(!allowed.includes(email))return null;const forced=email==='parth@lucumainnovations.com'?'ceo':email==='chaitanya@lucumainnovations.com'?'cto':'admin';return{id:p.id,email,name:p.name||t.email,liRole:forced,roleLabel:email==='chaitanya@lucumainnovations.com'?'CTO':'',permissions:p.permissions||[]};
}
export const signOut=()=>{localStorage.removeItem('li_auth');location.href='index.html'};
