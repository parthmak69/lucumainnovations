(() => {
  const CFG = window.CFG || {};
  const API = String(CFG.supabaseUrl || '').replace(/\/$/, '');
  const result = document.getElementById('verifyResult');
  const params = new URLSearchParams(location.search);
  const code = params.get('code');
  const esc = value => String(value ?? '-').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const date = value => {
    if (!value) return '-';
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? esc(value) : parsed.toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'});
  };
  const fail = (title, message) => {
    result.innerHTML = `<strong>✕ ${esc(title)}</strong><p>${esc(message)}</p>`;
    result.style.border = '1px solid rgba(255,90,110,.65)';
  };
  async function verify() {
    if (!API) return fail('Verification unavailable', 'Supabase configuration is missing.');
    if (!code) return fail('Invalid verification link', 'Scan the QR code printed on the original document.');
    try {
      const response = await fetch(`${API}/functions/v1/process-imported-pdf`, {
        method: 'POST',
        headers: {'apikey': CFG.anonKey, 'Content-Type':'application/json'},
        body: JSON.stringify({action:'verify', code})
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok && response.status !== 404) throw new Error(data.error || `Verification service returned ${response.status}.`);
      if (data.verified !== true) return fail('Document not verified', data.error || 'This document is not approved or the QR code is invalid.');
      const rows = [
        ['Document type', data.document_type],
        ['Document number', data.document_number],
        ['Issued to / Recipient', data.recipient],
        ['Issue date', date(data.issue_date)],
        ['Registered on', date(data.registered_at)]
      ].map(([label,value]) => `<tr><td>${esc(label)}</td><td>${esc(value)}</td></tr>`).join('');
      result.style.border = '1px solid rgba(90,220,160,.65)';
      result.innerHTML = `<strong>✓ Authentic document</strong><p>This ${esc(data.document_type || 'document')} has been approved and registered by Lucuma Innovations.</p><table class="vtable">${rows}</table>`;
    } catch (error) {
      fail('Could not verify document', error.message || 'Please try again later.');
    }
  }
  verify();
})();