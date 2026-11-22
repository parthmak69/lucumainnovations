const CFG = window.CFG || {};
const API = (CFG.supabaseUrl || '').replace(/\/$/, '');
const $ = id => document.getElementById(id);

let verifiedCertificate = null;

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
}[c]));

const fd = s => {
    if (!s) return '-';

    const date = new Date(s + 'T00:00');

    return isNaN(date)
        ? '-'
        : date.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
};

const ICON = {
    ok: `
        <svg viewBox="0 0 24 24" width="46" height="46">
            <path d="M5 12.5l4.5 4.5L19 7.5"
                fill="none"
                stroke="currentColor"
                stroke-width="3"
                stroke-linecap="round"
                stroke-linejoin="round"/>
        </svg>
    `,

    bad: `
        <svg viewBox="0 0 24 24" width="40" height="40">
            <path d="M6 6l12 12M18 6L6 18"
                fill="none"
                stroke="currentColor"
                stroke-width="3"
                stroke-linecap="round"/>
        </svg>
    `
};

/* =========================================
   VERIFICATION RESULT
========================================= */

function show(cls, title, sub, rows, allowCertificateDownload = true) {
    $('vres').innerHTML = `
        <div class="vr ${cls}">
            <div class="vi">
                ${ICON[cls === 'ok' ? 'ok' : 'bad']}
            </div>

            <h3>${title}</h3>

            <p>${sub}</p>

            ${rows ? `<table class="vt">${rows}</table>` : ''}

            ${cls === 'ok' && allowCertificateDownload ? `
                <button
                    type="button"
                    id="downloadCertificate"
                    class="btn p"
                    style="width:100%;margin-top:20px">
                    Download Certificate PDF
                </button>
            ` : ''}
        </div>
    `;

    if (cls === 'ok') {
        $('downloadCertificate').addEventListener(
            'click',
            downloadCertificate
        );
    }
}

/* =========================================
   VERIFICATION URL
========================================= */

function verifyUrl(number) {
    const root = (CFG.siteUrl || location.origin).replace(/\/$/, '');

    return `${root}/verify.html?c=${encodeURIComponent(number)}`;
}

/* =========================================
   QR CODE GENERATOR
========================================= */

function generateQR(url) {
    if (typeof qrcode !== 'function') {
        throw new Error('QR code library is not loaded.');
    }

    const qr = qrcode(0, 'M');

    qr.addData(url);
    qr.make();

    return qr.createSvgTag({
        cellSize: 4,
        margin: 1,
        scalable: true
    });
}

/* =========================================
   CERTIFICATE HTML
========================================= */

function certificateHTML(c) {
    const signatures = c.signatures || {};

    const remarks = String(c.remarks || '')
        .replace(/\{name\}/g, c.holder || '');

    const qr = generateQR(verifyUrl(c.number));

    const logo = new URL('assets/logo.png', location.href).href;
    const stamp = new URL('assets/stamp.png', location.href).href;
    const fonts = new URL('fonts.css', location.href).href;
    const styles = new URL('styles.css', location.href).href;

    return `
        <!doctype html>
        <html lang="en">

        <head>
            <meta charset="UTF-8">

            <meta name="viewport"
                  content="width=device-width,initial-scale=1">

            <title>Certificate - ${esc(c.number)}</title>

            <link rel="stylesheet" href="${fonts}">
            <link rel="stylesheet" href="${styles}">

            <style>
                @page {
                    size: A4 landscape;
                    margin: 0;
                }

                html,
                body {
                    margin: 0 !important;
                    padding: 0 !important;
                    width: 1123px;
                    height: 794px;
                    background: #fff !important;
                    overflow: hidden;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                }

                body {
                    display: block !important;
                }

                .page.cert {
                    width: 1123px !important;
                    height: 794px !important;
                    margin: 0 !important;
                    box-shadow: none !important;
                    page: cert;
                    break-after: avoid;
                    page-break-after: avoid;
                }

                .chead img {
                    height: 62px;
                }

                .certificate-print {
                    width: 1123px;
                    height: 794px;
                    overflow: hidden;
                }

                .print-toolbar {
                    position: fixed;
                    top: 15px;
                    right: 15px;
                    z-index: 999999;
                }

                .print-toolbar button {
                    background: #6d28d9;
                    color: #fff;
                    border: 0;
                    padding: 13px 22px;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 700;
                    cursor: pointer;
                }

                @media print {
                    html,
                    body {
                        width: 1123px !important;
                        height: 794px !important;
                        overflow: hidden !important;
                    }

                    .page.cert {
                        margin: 0 !important;
                        box-shadow: none !important;
                    }

                    .print-toolbar {
                        display: none !important;
                    }
                }
            </style>
        </head>

        <body>

            <div class="certificate-print">

                <article class="page cert">

                    <div class="ccorner a"></div>
                    <div class="ccorner b"></div>
                    <div class="cframe"></div>

                    <div class="cin">

                        <div class="chead">

                            <img src="${logo}"
                                 alt="Lucuma Innovations">

                            <div>
                                <b>LUCUMA INNOVATIONS</b>

                                <small>
                                    TECHNOLOGY | INNOVATION | SOLUTIONS
                                </small>

                                ${c.company_reg ? `
                                    <small>
                                        Registration No:
                                        ${esc(c.company_reg)}
                                    </small>
                                ` : ''}
                            </div>

                        </div>

                        <div class="ct">
                            CERTIFICATE OF COMPLETION
                        </div>

                        <i class="cu"></i>

                        <p class="cs">
                            This is to certify that
                        </p>

                        <div class="cn">
                            ${esc(c.holder) || '&nbsp;'}
                        </div>

                        <p class="cb">
                            has successfully completed a

                            <b>${esc(c.period)}</b>

                            <b>${esc(c.ptype)}</b>

                            internship as

                            <b>${esc(c.role)}</b>

                            at Lucuma Innovations, from

                            <b>${fd(c.start)}</b>

                            to

                            <b>${fd(c.end)}</b>.
                        </p>

                        <p class="cb sm">
                            ${esc(remarks)}
                        </p>

                        <div class="cbot">

                            <div class="sg2">

                                ${signatures.s1 ? `
                                    <img src="${esc(signatures.s1)}"
                                         alt="Signature 1">
                                ` : ''}

                                <span class="ln"></span>

                                <b>${esc(c.s1n || '')}</b>

                                <small>${esc(c.s1t || '')}</small>

                            </div>

                            <div class="sg2">

                                ${signatures.s2 ? `
                                    <img src="${esc(signatures.s2)}"
                                         alt="Signature 2">
                                ` : ''}

                                <span class="ln"></span>

                                <b>${esc(c.s2n || '')}</b>

                                <small>${esc(c.s2t || '')}</small>

                            </div>

                            <img
                                class="cst"
                                src="${stamp}"
                                alt="Company Stamp"
                            >

                            <div class="cq">

                                <div class="qr">
                                    ${qr}
                                </div>

                                <small>Scan to verify</small>

                                <b>${esc(c.number)}</b>

                                <small>
                                    Issued ${fd(c.issued)}
                                </small>

                                <small class="issuer">
                                    Issued by:
                                    ${esc(c.issuer_name || 'Lucuma Innovations')}

                                    <br>

                                    ${esc(c.issuer_email || '')}
                                </small>

                            </div>

                        </div>

                    </div>

                </article>

            </div>

            <div class="print-toolbar">
                <button type="button" id="printCertificate">
                    Print / Save as PDF
                </button>
            </div>

        </body>
        </html>
    `;
}

/* =========================================
   DOWNLOAD / PRINT CERTIFICATE
========================================= */

function downloadCertificate() {
    if (
        !verifiedCertificate ||
        String(verifiedCertificate.status).toLowerCase() !== 'valid'
    ) {
        return;
    }

    const popup = window.open('', '_blank');

    if (!popup) {
        alert('Please allow pop-ups to download your certificate.');
        return;
    }

    popup.document.open();

    popup.document.write(
        certificateHTML(verifiedCertificate)
    );

    // Attach the event listener without inline JavaScript.
    const printButton = popup.document.getElementById(
        'printCertificate'
    );

    if (!printButton) {
        popup.close();
        alert('Print button could not be loaded.');
        return;
    }

    printButton.addEventListener('click', async () => {
        try {
            const images = Array.from(popup.document.images);

            await Promise.all(images.map(img => {
                if (img.complete) {
                    return Promise.resolve();
                }

                return new Promise(resolve => {
                    img.onload = resolve;
                    img.onerror = resolve;
                });
            }));

            if (popup.document.fonts) {
                await popup.document.fonts.ready;
            }

            popup.focus();
            popup.print();

        } catch (error) {
            console.error('Certificate printing error:', error);
            alert('Unable to print the certificate.');
        }
    });

    popup.document.close();
}

/* =========================================
   VERIFY CERTIFICATE
========================================= */

async function check(no, importedCode = null) {
    if (importedCode) {
        $('vn').value = 'IMPORTED PDF';
        $('vres').innerHTML = '<p class="vsub">Checking imported document…</p>';
        try {
            const r = await fetch(API + '/functions/v1/process-imported-pdf', {
                method: 'POST',
                headers: {
                    apikey: CFG.anonKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ action: 'verify', code: importedCode })
            });
            const d = await r.json();
            if (!r.ok || !d) throw new Error(d?.error || 'Verification record not found.');
            const valid = d.verified === true;
            const table = [
                ['Document type', d.document_type],
                ['Document number', d.document_number],
                ['Recipient', d.recipient],
                ['Issue date', fd(d.issue_date)],
                ['Registered on', fd(d.registered_at?.slice(0, 10))]
            ].map(([a, b]) => `<tr><td>${esc(a)}</td><td>${esc(b || '-')}</td></tr>`).join('');
            show(
                valid ? 'ok' : 'bad',
                valid ? 'Verified document' : 'Document not valid',
                valid ? 'This document has been approved and authenticated by Lucuma Innovations.' : (d.error || 'This document is not approved or its verification code is invalid.'),
                table,
                false
            );
        } catch(err) { show('bad','Could not verify',esc(err.message)); }
        return;
    }
    no = (no || '').trim().toUpperCase();

    if (!no) return;

    verifiedCertificate = null;

    $('vn').value = no;

    $('vres').innerHTML =
        '<p class="vsub">Checking certificate...</p>';

    try {
        if (!API) {
            throw new Error('This site is not configured yet.');
        }

        const response = await fetch(
            API + '/rest/v1/rpc/verify_certificate',
            {
                method: 'POST',

                headers: {
                    apikey: CFG.anonKey,
                    Authorization: 'Bearer ' + CFG.anonKey,
                    'Content-Type': 'application/json'
                },

                body: JSON.stringify({
                    p_no: no
                })
            }
        );

        if (!response.ok) {
            const detail = await response.text().catch(() => '');

            throw new Error(
                'Verification service error (' +
                response.status + '). ' +
                detail.slice(0, 240)
            );
        }

        let c = await response.json();

        if (Array.isArray(c)) {
            c = c[0] || null;
        }

        if (!c) {
            return show(
                'bad',
                'Not verified',
                'No certificate with this number was issued by Lucuma Innovations.'
            );
        }

        const rows = [
            ['Awarded to', c.holder],
            ['Programme', `Internship · ${c.role}`],
            [
                'Period',
                `${c.period} (${fd(c.start)} to ${fd(c.end)})`
            ],
            ['Internship type', c.ptype],
            ['Issued on', fd(c.issued)],
            ['Certificate no.', c.number],
            ['Issued by', c.issuer_name || 'Lucuma Innovations'],
            ['Issuer email', c.issuer_email || '']
        ].map(([label, value]) => `
            <tr>
                <td>${esc(label)}</td>
                <td>${esc(value)}</td>
            </tr>
        `).join('');

        if (String(c.status).toLowerCase() !== 'valid') {
            return show(
                'bad',
                'Certificate revoked',
                'This certificate was issued by Lucuma Innovations but is no longer valid.',
                rows
            );
        }

        verifiedCertificate = c;

        show(
            'ok',
            'Verified certificate',
            'This certificate was issued and signed by Lucuma Innovations.',
            rows
        );

    } catch (error) {

        verifiedCertificate = null;

        show(
            'bad',
            'Could not verify',
            esc(error.message)
        );
    }
}

/* =========================================
   FORM SUBMISSION
========================================= */

$('vf').onsubmit = event => {
    event.preventDefault();

    const number = $('vn').value.trim();

    history.replaceState(
        null,
        '',
        '?c=' + encodeURIComponent(number)
    );

    check(number);
};

/* =========================================
   INITIAL VERIFICATION
========================================= */

const query = new URLSearchParams(location.search);
if (query.get('import')) check('', query.get('import'));
else check(query.get('c'));