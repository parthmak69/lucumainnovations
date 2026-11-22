// Deploy: supabase functions deploy process-imported-pdf --use-api
// SUPABASE_URL, SUPABASE_SECRET_KEYS and SUPABASE_PUBLISHABLE_KEYS are read as Edge Function secrets.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { extractText } from 'npm:unpdf@0.12.1';
import { PDFDocument, rgb, StandardFonts } from 'npm:pdf-lib@1.17.1';
import QRCode from 'npm:qrcode@1.5.4';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...cors, 'Content-Type': 'application/json' },
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const url = Deno.env.get('SUPABASE_URL')!;
    const secretKeys = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')!);
    const publishableKeys = JSON.parse(Deno.env.get('SUPABASE_PUBLISHABLE_KEYS')!);
    const service = secretKeys.default;
    const anon = publishableKeys.default;
    if (!url || !service || !anon) throw new Error('Supabase Edge Function secrets are not configured.');

    const admin = createClient(url, service);
    const body = await req.json();

    // Public QR verification: disclose verification metadata only, never the PDF or storage path.
    if (body.action === 'verify') {
      const code = String(body.code || '').trim();
      if (!code || code.length > 100) return json({ verified: false, error: 'Invalid verification code.' }, 400);
      const { data: doc, error: verifyError } = await admin
        .from('imported_pdfs')
        .select('detected_type,detected_number,detected_recipient,detected_issue_date,approval_status,created_at')
        .eq('verification_code', code)
        .maybeSingle();
      if (verifyError) throw verifyError;
      if (!doc) return json({ verified: false, error: 'No matching document was found.' }, 404);
      const approved = String(doc.approval_status || '').toLowerCase() === 'approved';
      return json({
        verified: approved,
        document_type: doc.detected_type || 'document',
        document_number: doc.detected_number || null,
        recipient: doc.detected_recipient || null,
        issue_date: doc.detected_issue_date || null,
        registered_at: doc.created_at || null,
        error: approved ? null : 'This document has not been approved by Lucuma Innovations.'
      });
    }

    const auth = req.headers.get('Authorization');
    if (!auth) return json({ error: 'Authentication required' }, 401);
    const userClient = createClient(url, anon, { global: { headers: { Authorization: auth } } });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) return json({ error: 'Invalid session' }, 401);
    const { data: profile, error: profileErr } = await admin.from('profiles').select('id,role,active').eq('id', user.id).single();
    if (profileErr || !profile?.active) return json({ error: 'Account inactive' }, 403);

    if (body.action === 'delete') {
      if (!['admin', 'ceo'].includes(profile.role)) return json({ error: 'Only Admin or CEO can delete imported PDFs' }, 403);
      const { data: doc, error } = await admin.from('imported_pdfs').select('id,storage_path').eq('id', body.id).maybeSingle();
      if (error || !doc) return json({ error: 'Imported PDF not found' }, 404);
      const { error: storageError } = await admin.storage.from('lucuma-imported-pdfs').remove([doc.storage_path]);
      if (storageError) throw storageError;
      const { error: deleteError } = await admin.from('imported_pdfs').delete().eq('id', body.id);
      if (deleteError) throw deleteError;
      return json({ success: true });
    }

    if (body.action === 'download') {
      const { data: doc, error } = await admin.from('imported_pdfs').select('storage_path,file_name,uploaded_by').eq('id', body.id).maybeSingle();
      if (error || !doc) return json({ error: 'Imported PDF not found' }, 404);
      if (doc.uploaded_by !== user.id && !['admin', 'ceo', 'cto'].includes(profile.role)) return json({ error: 'Not permitted' }, 403);
      const { data: link, error: linkErr } = await admin.storage.from('lucuma-imported-pdfs').createSignedUrl(doc.storage_path, 90);
      if (linkErr) throw linkErr;
      return json({ url: link.signedUrl, name: doc.file_name });
    }

    const name = String(body.name || 'import.pdf').slice(0, 180);
    const b64 = String(body.base64 || '');
    if (!b64 || b64.length > 36_000_000) return json({ error: 'PDF is missing or exceeds the 25 MB limit' }, 400);
    const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    if (new TextDecoder().decode(bytes.slice(0, 5)) !== '%PDF-') return json({ error: 'File is not a valid PDF' }, 400);

    const digest = await crypto.subtle.digest('SHA-256', bytes);
    const fileSha256 = [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
    const parsed = await extractText(bytes);
    const extracted = Array.isArray(parsed.text) ? parsed.text.join('\n') : String(parsed.text || '');
    const pick = (patterns: RegExp[]) => {
      for (const p of patterns) { const m = extracted.match(p); if (m?.[1]) return m[1].trim().slice(0, 240); }
      return null;
    };
    const number = pick([/(?:invoice|certificate|reference|document)\s*(?:no\.?|number|#)\s*[:\-]?\s*([A-Z0-9\/-]{4,})/i, /(LI\/[0-9]{4}\/\d{3,}|LI-C-[A-Z0-9-]+)/i]);
    const recipient = pick([/(?:to|candidate|name|recipient|bill to)\s*[:\-]\s*([^\n]+)/i]);
    const type = /invoice|tax invoice/i.test(extracted) ? 'invoice' : /certificate of|certificate/i.test(extracted) ? 'certificate' : /offer letter|appointment|internship/i.test(extracted) ? 'letter' : 'unknown';
    const issue = pick([/(?:date of issue|issue date|issued on|date)\s*[:\-]?\s*(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}|\d{4}-\d{2}-\d{2})/i]);
    const verificationCode = crypto.randomUUID();
    const requestedSite = String(body.siteUrl || '').trim();
    const site = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(requestedSite)
      ? requestedSite.replace(/\/+$/, '')
      : 'https://docs.lucumainnovations.com';
    const verifyUrl = `${site}/verify-imported.html?code=${verificationCode}`;

    const pdf = await PDFDocument.load(bytes);
    const pages = pdf.getPages();
    if (!pages.length) return json({ error: 'PDF contains no pages' }, 400);
    const page = pages[pages.length - 1];
    {
      const qr = await QRCode.toBuffer(verifyUrl, { type: 'png', width: 220, margin: 1 });
      const png = await pdf.embedPng(qr);
      const font = await pdf.embedFont(StandardFonts.Helvetica);
      const { width } = page.getSize();
      page.drawImage(png, { x: width - 112, y: 28, width: 76, height: 76 });
      page.drawText('Scan to verify after approval', { x: width - 155, y: 18, size: 6, font, color: rgb(0.2, 0.2, 0.2) });
    }

    const stamped = await pdf.save();
    const path = `${user.id}/${verificationCode}.pdf`;
    const up = await admin.storage.from('lucuma-imported-pdfs').upload(path, stamped, { contentType: 'application/pdf', upsert: false });
    if (up.error) throw up.error;
    const { data: record, error: dbErr } = await admin.from('imported_pdfs').insert({
      file_name: name,
      storage_path: path,
      file_sha256: fileSha256,
      extracted_text: extracted.slice(0, 30000),
      detected_type: type,
      detected_number: number,
      detected_recipient: recipient,
      detected_issue_date: normalizeDate(issue),
      verification_code: verificationCode,
      status: 'needs_review',
      uploaded_by: user.id,
    }).select().single();
    if (dbErr) {
      await admin.storage.from('lucuma-imported-pdfs').remove([path]);
      throw dbErr;
    }

    let encoded = '';
    for (let i = 0; i < stamped.length; i += 0x8000) encoded += String.fromCharCode(...stamped.subarray(i, i + 0x8000));
    return json({ record, verifyUrl, privateDocument: true, recognized: { type, number, recipient, issueDate: issue }, stampedPdfBase64: btoa(encoded) });
  } catch (e) {
    console.error(e);
    return json({ error: e instanceof Error ? e.message : 'PDF processing failed' }, 500);
  }
});

function normalizeDate(v: string | null) {
  if (!v) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  const p = v.split(/[\/.-]/);
  if (p.length !== 3) return null;
  let [d, m, y] = p;
  if (y.length === 2) y = '20' + y;
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}
