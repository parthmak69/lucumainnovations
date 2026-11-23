const json = (data, status = 200, origin = '*') => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'access-control-allow-origin': origin, 'access-control-allow-methods': 'GET,POST,OPTIONS', 'access-control-allow-headers': 'Authorization,Content-Type', 'vary': 'Origin' } });
const fail = (message, status = 400) => { const e = new Error(message); e.status = status; throw e; };
const id32 = () => Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2,'0')).join('');

async function authenticate(request, env) {
  const token = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim();
  if (!token) fail('Please sign in to Lucuma Docs first.', 401);
  const base = env.SUPABASE_URL.replace(/\/$/, '');
  const headers = { apikey: env.SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` };
  const u = await fetch(`${base}/auth/v1/user`, { headers });
  if (!u.ok) fail('Your Lucuma session is invalid or expired.', 401);
  const user = await u.json();
  const p = await fetch(`${base}/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}&select=id,name,email,role,active`, { headers });
  if (!p.ok) fail('Unable to verify your Lucuma team profile.', 403);
  const profiles = await p.json();
  const profile = profiles[0];
  if (!profile || profile.active === false || profile.active === 0) fail('Your Lucuma account is inactive.', 403);
  return { id: user.id, email: user.email, profile, headers, base };
}
const member = async (db, cid, uid) => !!(await db.prepare('SELECT 1 FROM lucuma_chat_members WHERE conversation_id=? AND user_id=? LIMIT 1').bind(cid,uid).first());

async function chat(request, env, user) {
  const input = await request.json();
  const action = input.action;
  const db = env.DB;
  await db.prepare('INSERT INTO lucuma_chat_profiles(id,name,email) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,email=excluded.email').bind(user.id,user.profile.name||null,user.email||null).run();
  if (action === 'list_conversations') {
    const result = await db.prepare(`SELECT c.id,c.name,c.kind,c.created_at,CASE WHEN c.kind='direct' THEN COALESCE(p.name,p.email,'Team member') ELSE c.name END AS display_name,om.user_id AS other_user_id FROM lucuma_chat_conversations c JOIN lucuma_chat_members cm ON cm.conversation_id=c.id LEFT JOIN lucuma_chat_members om ON om.conversation_id=c.id AND om.user_id<>? LEFT JOIN lucuma_chat_profiles p ON p.id=om.user_id WHERE cm.user_id=? AND cm.hidden_at IS NULL ORDER BY c.created_at DESC`).bind(user.id,user.id).all();
    return { conversations: result.results || [] };
  }
  if (action === 'create_conversation') {
    const kind = input.kind === 'group' ? 'group' : 'direct';
    const name = String(input.name || '').trim();
    let members = [...new Set(Array.isArray(input.members) ? input.members.filter(x => typeof x === 'string' && x) : [])].filter(x => x !== user.id);
    if (!members.length || (kind === 'direct' && members.length !== 1) || members.length > 30 || (kind === 'group' && !name)) fail('Choose valid conversation participants.');
    for (const uid of members) {
      const r = await fetch(`${user.base}/rest/v1/profiles?id=eq.${encodeURIComponent(uid)}&select=id,name,email,active`, { headers: user.headers });
      const rows = r.ok ? await r.json() : [];
      if (!rows[0] || rows[0].active === false || rows[0].active === 0) fail('A selected participant is inactive or unavailable.',403);
      await db.prepare('INSERT INTO lucuma_chat_profiles(id,name,email) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,email=excluded.email').bind(uid,rows[0].name||null,rows[0].email||null).run();
    }
    const cid=id32();
    const stmts=[db.prepare('INSERT INTO lucuma_chat_conversations(id,name,kind,created_by) VALUES(?,?,?,?)').bind(cid,name,kind,user.id),db.prepare('INSERT INTO lucuma_chat_members(conversation_id,user_id) VALUES(?,?)').bind(cid,user.id),...members.map(uid=>db.prepare('INSERT INTO lucuma_chat_members(conversation_id,user_id) VALUES(?,?)').bind(cid,uid))];
    await db.batch(stmts);
    return { ok:true, conversation:{id:cid,name,kind} };
  }
  if (action === 'delete_conversation') {
    const cid=String(input.conversation_id||''); if (!/^[a-f0-9]{32}$/i.test(cid)) fail('Invalid conversation.');
    if (!await member(db,cid,user.id)) fail('Conversation access denied.',403);
    await db.prepare('UPDATE lucuma_chat_members SET hidden_at=CURRENT_TIMESTAMP WHERE conversation_id=? AND user_id=?').bind(cid,user.id).run(); return {ok:true};
  }
  if (action === 'list_messages') {
    const cid=String(input.conversation_id||''); const after=Number(input.after_id||0);
    if (!Number.isSafeInteger(after)||after<0) fail('Invalid message cursor.'); if(!await member(db,cid,user.id)) fail('Conversation access denied.',403);
    const r=await db.prepare(`SELECT m.id,m.conversation_id,m.sender_id,m.body,m.created_at,m.edited_at,m.deleted_for_everyone_at,COALESCE(p.name,p.email,'Team member') AS sender_name FROM lucuma_chat_messages m LEFT JOIN lucuma_chat_profiles p ON p.id=m.sender_id LEFT JOIN lucuma_chat_message_deletions d ON d.message_id=m.id AND d.user_id=? WHERE m.conversation_id=? AND m.id>? AND d.message_id IS NULL ORDER BY m.id ASC LIMIT 300`).bind(user.id,cid,after).all(); return {messages:r.results||[]};
  }
  if (action === 'send_message') {
    const cid=String(input.conversation_id||''); const body=String(input.body||'').trim(); if(!await member(db,cid,user.id)) fail('Conversation access denied.',403); if(!body||body.length>5000) fail('Message must contain 1–5000 characters.');
    await db.prepare('UPDATE lucuma_chat_members SET hidden_at=NULL WHERE conversation_id=?').bind(cid).run();
    const ins=await db.prepare('INSERT INTO lucuma_chat_messages(conversation_id,sender_id,body) VALUES(?,?,?)').bind(cid,user.id,body).run();
    const m=await db.prepare(`SELECT m.id,m.conversation_id,m.sender_id,m.body,m.created_at,m.edited_at,m.deleted_for_everyone_at,COALESCE(p.name,p.email,'Team member') AS sender_name FROM lucuma_chat_messages m LEFT JOIN lucuma_chat_profiles p ON p.id=m.sender_id WHERE m.id=?`).bind(ins.meta.last_row_id).first(); return {ok:true,message:m};
  }
  if (action === 'edit_message') {
    const mid=Number(input.message_id), body=String(input.body||'').trim(); if(!Number.isSafeInteger(mid)||mid<1||!body||body.length>5000) fail('Message must contain 1–5000 characters.');
    const m=await db.prepare('SELECT conversation_id,sender_id,deleted_for_everyone_at FROM lucuma_chat_messages WHERE id=?').bind(mid).first(); if(!m||!await member(db,m.conversation_id,user.id)) fail('Message not found or access denied.',404); if(m.sender_id!==user.id) fail('You can only edit messages you sent.',403); if(m.deleted_for_everyone_at) fail('A deleted message cannot be edited.');
    await db.prepare('UPDATE lucuma_chat_messages SET body=?,edited_at=CURRENT_TIMESTAMP WHERE id=? AND sender_id=? AND deleted_for_everyone_at IS NULL').bind(body,mid,user.id).run(); return {ok:true};
  }
  if (action === 'delete_message') {
    const mid=Number(input.message_id), mode=String(input.mode||'for_me'); if(!Number.isSafeInteger(mid)||mid<1||!['for_me','for_everyone'].includes(mode)) fail('Invalid message deletion request.');
    const m=await db.prepare('SELECT conversation_id,sender_id,deleted_for_everyone_at FROM lucuma_chat_messages WHERE id=?').bind(mid).first(); if(!m||!await member(db,m.conversation_id,user.id)) fail('Message not found or access denied.',404);
    if(mode==='for_everyone') { if(m.sender_id!==user.id) fail('You can only delete your own messages for everyone.',403); if(!m.deleted_for_everyone_at) await db.prepare('UPDATE lucuma_chat_messages SET body=?,deleted_for_everyone_at=CURRENT_TIMESTAMP,deleted_by=?,edited_at=NULL WHERE id=? AND sender_id=?').bind('',user.id,mid,user.id).run(); }
    else await db.prepare('INSERT OR IGNORE INTO lucuma_chat_message_deletions(message_id,user_id) VALUES(?,?)').bind(mid,user.id).run(); return {ok:true};
  }
  fail('Unknown chat action.',404);
}

async function storage(request, env, user) {
  const url=new URL(request.url); const key=url.pathname.replace(/^\/storage\/?/, '');
  if(request.method==='POST') {
    const body=await request.json(); const name=String(body.name||'file').replace(/[^a-zA-Z0-9._-]/g,'_').slice(0,120); const content=body.content;
    if(typeof content!=='string'||content.length>12_000_000) fail('Invalid file or file too large.');
    const bytes=Uint8Array.from(atob(content),c=>c.charCodeAt(0)); const objectKey=`${user.id}/${crypto.randomUUID()}-${name}`;
    await env.LUCUMA_STORAGE.put(objectKey,bytes,{httpMetadata:{contentType:body.contentType||'application/octet-stream'}}); return {ok:true,key:objectKey};
  }
  if(request.method==='GET') {
    if(!key.startsWith(`${user.id}/`)) fail('File access denied.',403); const obj=await env.LUCUMA_STORAGE.get(key); if(!obj) fail('File not found.',404);
    return new Response(obj.body,{headers:{'content-type':obj.httpMetadata?.contentType||'application/octet-stream','cache-control':'private, no-store','access-control-allow-origin':env.ALLOWED_ORIGIN||'*'}});
  }
  fail('Method not allowed.',405);
}


// Private Railway -> D1 bridge. Only mail tables are accessible.
async function internalMailDb(request, env) {
  const expected = env.MAIL_DB_INTERNAL_TOKEN || '';
  const supplied = request.headers.get('x-internal-token') || '';
  if (!expected || supplied.length !== expected.length) fail('Unauthorized.', 401);
  const a = new TextEncoder().encode(supplied);
  const b = new TextEncoder().encode(expected);
  let diff = 0; for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  if (diff !== 0) fail('Unauthorized.', 401);
  if (request.method !== 'POST') fail('Method not allowed.', 405);
  const body = await request.json();
  const sql = String(body.sql || '').trim();
  const params = Array.isArray(body.params) ? body.params : [];
  if (!sql || sql.length > 8000 || /;|--|\/\*|\*\//.test(sql)) fail('Invalid query.', 400);
  const normalized = sql.replace(/\s+/g, ' ').trim();
  const tableMatches = [...normalized.matchAll(/\b(?:FROM|JOIN|INTO|UPDATE)\s+([a-z_][a-z0-9_]*)/ig)].map(m => m[1].toLowerCase());
  if (!tableMatches.length || tableMatches.some(t => !['mail_accounts','mail_items'].includes(t))) fail('Only mail tables are available.', 403);
  if (!/^(SELECT|INSERT|UPDATE|DELETE)\b/i.test(normalized)) fail('Query type not allowed.', 403);
  if (/\b(ATTACH|DETACH|PRAGMA|DROP|ALTER|CREATE|REPLACE|VACUUM|TRIGGER|VIEW)\b/i.test(normalized)) fail('Query operation not allowed.', 403);
  const stmt = env.DB.prepare(sql).bind(...params);
  if (/^\s*SELECT\b/i.test(sql)) {
    const result = await stmt.all();
    return { rows: result.results || [], meta: result.meta || {} };
  }
  const result = await stmt.run();
  return { rows: [], meta: result.meta || {} };
}

export default {
  async fetch(request, env) {
    const origin=request.headers.get('Origin')||''; const allowed=(env.ALLOWED_ORIGINS||'https://docs.lucumainnovations.com,http://localhost:5500,http://localhost:5173').split(',').map(x=>x.trim());
    if(request.method==='OPTIONS') return new Response(null,{status:204,headers:{'access-control-allow-origin':allowed.includes(origin)?origin:'null','access-control-allow-methods':'GET,POST,OPTIONS','access-control-allow-headers':'Authorization,Content-Type,x-internal-token','access-control-max-age':'86400','vary':'Origin'}});
    if(origin&&!allowed.includes(origin)) return json({error:'Origin not allowed.'},403,'null');
    try {
      const pathname = new URL(request.url).pathname.replace(/\/+$/, '') || '/';

      if (pathname === '/health' && request.method === 'GET') {
        return json({ ok: true, service: 'lucuma-api', database: !!env.DB, storage: !!env.LUCUMA_STORAGE }, 200, origin || '*');
      }

      // Private Railway -> D1 route. Dispatch BEFORE Supabase browser authentication.
      // Railway authenticates this route with x-internal-token.
      if (pathname === '/internal/mail-db') {
        return json(await internalMailDb(request, env), 200, origin || '*');
      }

      const user=await authenticate(request,env);
      if(new URL(request.url).pathname==='/chat-api' && request.method==='POST') return json(await chat(request,env,user),200,origin||'*');
      if(new URL(request.url).pathname.startsWith('/storage/')) { const result=await storage(request,env,user); if(result instanceof Response) return result; return json(result,200,origin||'*'); }
      return json({error:'Not found.'},404,origin||'*');
    } catch(e) { return json({error:e.message||'Worker error.'},e.status||500,origin||'*'); }
  }
};
