import express from 'express';
import crypto from 'node:crypto';
import nodemailer from 'nodemailer';
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import db from '../config/database.js';

const router = express.Router();
const SUPABASE_URL = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || '';
const ENC_KEY = process.env.MAIL_ENCRYPTION_KEY || '';
const SMTP_HOST = process.env.PURELYMAIL_SMTP_HOST || 'smtp.purelymail.com';
const IMAP_HOST = process.env.PURELYMAIL_IMAP_HOST || 'imap.purelymail.com';
const SMTP_PORT = Number(process.env.PURELYMAIL_SMTP_PORT || 465);
const IMAP_PORT = Number(process.env.PURELYMAIL_IMAP_PORT || 993);

function encrypt(value) {
  if (!/^[a-f0-9]{64}$/i.test(ENC_KEY)) throw new Error('MAIL_ENCRYPTION_KEY must be 64 hexadecimal characters.');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(ENC_KEY, 'hex'), iv);
  const data = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return [iv.toString('hex'), cipher.getAuthTag().toString('hex'), data.toString('hex')].join(':');
}
function decrypt(value) {
  const [iv, tag, data] = value.split(':');
  const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(ENC_KEY, 'hex'), Buffer.from(iv, 'hex'));
  decipher.setAuthTag(Buffer.from(tag, 'hex'));
  return Buffer.concat([decipher.update(Buffer.from(data, 'hex')), decipher.final()]).toString('utf8');
}
async function auth(req, res, next) {
  try {
    const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    if (!token || !SUPABASE_URL || !SUPABASE_KEY) return res.status(401).json({ error: 'Sign in to Lucuma Docs first.' });
    const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}` } });
    if (!response.ok) return res.status(401).json({ error: 'Your session is invalid or expired.' });
    const user = await response.json();
    const profileResponse = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}&select=id,email,name,active`, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}` } });
    if (!profileResponse.ok) return res.status(403).json({ error: 'Unable to verify your Lucuma team profile.' });
    const profiles = await profileResponse.json();
    if (!profiles.length || profiles[0].active === false || profiles[0].active === 0) return res.status(403).json({ error: 'Your Lucuma account is inactive.' });
    req.user = { id: user.id, email: user.email, profile: profiles[0] };
    next();
  } catch (e) { next(e); }
}
async function mailbox(userId) {
  const [rows] = await db.execute('SELECT email,password_enc FROM mail_accounts WHERE user_id=? AND provider=? LIMIT 1', [userId, 'purelymail']);
  if (!rows.length) return null;
  return { email: rows[0].email, password: decrypt(rows[0].password_enc) };
}
function addressList(value) {
  return (value?.value || []).map(x => ({ name: x.name || '', address: x.address || '' }));
}
router.use(auth);

router.get('/account', async (req, res, next) => {
  try {
    const [rows] = await db.execute('SELECT email,created_at,updated_at FROM mail_accounts WHERE user_id=? LIMIT 1', [req.user.id]);
    res.json({ connected: !!rows.length, email: rows[0]?.email || null });
  } catch (e) { next(e); }
});

router.post('/account', async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password || password.length > 512) return res.status(400).json({ error: 'Enter a valid Purelymail email address and mailbox password.' });
    // Verify the supplied mailbox credentials before storing them.
    const client = new ImapFlow({ host: IMAP_HOST, port: IMAP_PORT, secure: true, auth: { user: email, pass: password }, logger: false, connectionTimeout: 12000 });
    await client.connect();
    await client.logout();
    const encrypted = encrypt(password);
    await db.execute(`INSERT INTO mail_accounts(user_id,email,password_enc,provider) VALUES(?,?,?,'purelymail') ON CONFLICT(user_id) DO UPDATE SET email=excluded.email,password_enc=excluded.password_enc,updated_at=CURRENT_TIMESTAMP`, [req.user.id, email, encrypted]);
    res.json({ success: true, email });
  } catch (e) { if (e.code === 'EAUTH' || e.authenticationFailed) return res.status(400).json({ error: 'Purelymail rejected these credentials. Check the mailbox address and password.' }); next(e); }
});

router.delete('/account', async (req, res, next) => {
  try { await db.execute('DELETE FROM mail_accounts WHERE user_id=?', [req.user.id]); res.json({ success: true }); }
  catch (e) { next(e); }
});

router.get('/messages', async (req, res, next) => {
  let client;
  try {
    const box = await mailbox(req.user.id);
    if (!box) return res.status(409).json({ error: 'Connect your Purelymail mailbox first.' });
    const folder = String(req.query.folder || 'INBOX');
    if (!['INBOX', 'Sent', 'Drafts', 'Trash'].includes(folder)) return res.status(400).json({ error: 'Unsupported mailbox folder.' });
    if (folder === 'Sent' || folder === 'Drafts') {
      const [rows] = await db.execute('SELECT id,folder,from_email,to_email,subject,body_text,created_at,is_read FROM mail_items WHERE user_id=? AND folder=? AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 100', [req.user.id, folder]);
      return res.json({ messages: rows.map(r => ({ id: `local-${r.id}`, subject: r.subject, from: [{ address: r.from_email }], to: [{ address: r.to_email }], text: r.body_text, date: r.created_at, seen: !!r.is_read, localId: r.id })) });
    }
    client = new ImapFlow({ host: IMAP_HOST, port: IMAP_PORT, secure: true, auth: { user: box.email, pass: box.password }, logger: false, connectionTimeout: 15000 });
    await client.connect();
    const lock = await client.getMailboxLock(folder).catch(() => { throw new Error(`Mailbox folder '${folder}' is unavailable. Check the folder name in Purelymail.`); });
    const messages = [];
    try {
      const status = await client.status(folder, { messages: true });
      const start = Math.max(1, (status.messages || 0) - 49);
      for await (const msg of client.fetch(`${start}:*`, { uid: true, envelope: true, flags: true, internalDate: true, source: true })) {
        const parsed = await simpleParser(msg.source);
        messages.push({ id: msg.uid, subject: parsed.subject || '(no subject)', from: addressList(parsed.from), to: addressList(parsed.to), date: parsed.date || msg.internalDate, text: parsed.text || '', html: typeof parsed.html === 'string' ? parsed.html : '', seen: msg.flags?.has('\\Seen') || false, attachments: (parsed.attachments || []).map(a => ({ filename: a.filename, contentType: a.contentType, size: a.size })) });
      }
    } finally { lock.release(); }
    res.json({ messages: messages.reverse(), email: box.email });
  } catch (e) { next(e); }
  finally { if (client?.usable) await client.logout().catch(() => {}); }
});

router.post('/send', async (req, res, next) => {
  try {
    const box = await mailbox(req.user.id);
    if (!box) return res.status(409).json({ error: 'Connect your Purelymail mailbox first.' });
    const to = String(req.body.to || '').trim();
    const subject = String(req.body.subject || '').trim().slice(0, 998);
    const text = String(req.body.text || '');
    if (!to || !subject || !text.trim()) return res.status(400).json({ error: 'Recipient, subject and message are required.' });
    if (text.length > 100000) return res.status(413).json({ error: 'Message is too large (100 KB maximum).' });
    const supplied = Array.isArray(req.body.attachments) ? req.body.attachments : [];
    if (supplied.length > 5) return res.status(400).json({ error: 'You can attach up to 5 files.' });
    let totalBytes = 0;
    const attachments = supplied.map((file) => {
      const filename = String(file.filename || 'attachment').replace(/[\\/\r\n\0]/g, '_').slice(0, 180);
      const contentType = String(file.contentType || 'application/octet-stream').slice(0, 120);
      const encoded = String(file.content || '');
      if (!/^[A-Za-z0-9+/]*={0,2}$/.test(encoded) || encoded.length % 4 !== 0) throw new Error('An attachment has invalid encoded content.');
      const content = Buffer.from(encoded, 'base64');
      if (!content.length) throw new Error(`The attachment '${filename}' is empty or invalid.`);
      totalBytes += content.length;
      if (totalBytes > 9 * 1024 * 1024) throw new Error('Attachments must total 9 MB or less.');
      return { filename, contentType, content };
    });
    const transporter = nodemailer.createTransport({ host: SMTP_HOST, port: SMTP_PORT, secure: true, auth: { user: box.email, pass: box.password }, connectionTimeout: 12000, greetingTimeout: 12000, socketTimeout: 20000 });
    const info = await transporter.sendMail({ from: { name: req.user.profile.name || 'Lucuma Team', address: box.email }, to, subject, text, attachments });
    await db.execute('INSERT INTO mail_items(user_id,folder,from_email,to_email,subject,body_text,message_id) VALUES(?,?,?,?,?,?,?)', [req.user.id, 'Sent', box.email, to, subject, text, info.messageId || null]);
    res.json({ success: true, messageId: info.messageId });
  } catch (e) { if (e.code === 'EAUTH') return res.status(400).json({ error: 'Purelymail SMTP authentication failed. Verify your mailbox credentials.' }); next(e); }
});

router.post('/drafts', async (req, res, next) => {
  try {
    const to = String(req.body.to || '').slice(0, 1000), subject = String(req.body.subject || '').slice(0, 998), text = String(req.body.text || '');
    if (text.length > 100000) return res.status(413).json({ error: 'Draft is too large.' });
    const [result] = await db.execute('INSERT INTO mail_items(user_id,folder,from_email,to_email,subject,body_text) VALUES(?,?,?,?,?,?)', [req.user.id, 'Drafts', req.user.email, to, subject, text]);
    res.json({ success: true, id: result.insertId });
  } catch (e) { next(e); }
});

router.delete('/messages/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id)) return res.status(400).json({ error: 'Invalid message id.' });
    const [result] = await db.execute('UPDATE mail_items SET deleted_at=CURRENT_TIMESTAMP WHERE id=? AND user_id=?', [id, req.user.id]);
    if (!result.affectedRows) return res.status(404).json({ error: 'Message not found.' });
    res.json({ success: true });
  } catch (e) { next(e); }
});

router.get('/search', async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim().slice(0, 120);
    if (!q) return res.json({ messages: [] });
    const [rows] = await db.execute(`SELECT id,folder,from_email,to_email,subject,body_text,created_at FROM mail_items WHERE user_id=? AND deleted_at IS NULL AND (subject LIKE ? OR body_text LIKE ? OR from_email LIKE ? OR to_email LIKE ?) ORDER BY created_at DESC LIMIT 100`, [req.user.id, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`]);
    res.json({ messages: rows });
  } catch (e) { next(e); }
});

export default router;
