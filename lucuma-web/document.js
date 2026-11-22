(() => {
    "use strict";

    const CFG = window.CFG || {};
    const API = (CFG.supabaseUrl || "").replace(/\/$/, "");

    const $ = id => document.getElementById(id);

    const id = new URLSearchParams(location.search).get("id");

    const libraryState = {
    documents: [],
    filter: "all",
    search: ""
};

function libraryType(type) {
    return {
        letter: "Letter",
        certificate: "Certificate",
        invoice: "Invoice"
    }[type] || type;
}

function renderLibrary() {
    const rows = $("libraryRows");

    const filtered = libraryState.documents.filter(d => {
        const matchesType =
            libraryState.filter === "all" ||
            d.type === libraryState.filter;

        const searchText = [
            d.number,
            d.title,
            libraryType(d.type),
            d.status
        ].join(" ").toLowerCase();

        return matchesType &&
            searchText.includes(libraryState.search.toLowerCase());
    });

    rows.innerHTML = filtered.map(d => `
        <tr>
            <td>${esc(d.number)}</td>
            <td>${esc(libraryType(d.type))}</td>
            <td>${esc(d.title)}</td>
            <td>${esc(d.status)}</td>
            <td>${fd(d.created_at?.slice(0, 10))}</td>
            <td>
                <a href="document.html?id=${encodeURIComponent(d.id)}"
                   class="lib-open">View</a>
            </td>
        </tr>
    `).join("") || `
        <tr>
            <td colspan="6" style="text-align:center;padding:20px;">
                No documents found.
            </td>
        </tr>
    `;

    $("libraryMessage").textContent =
        `${filtered.length} of ${libraryState.documents.length} documents`;
}

async function loadLibrary() {
    $("loading").hidden = true;
    $("error").hidden = true;
    $("documentContent").hidden = true;
    $("library").hidden = false;

    const access = await getToken();

    // Verify the actual authenticated user and active status.
    const auth = getAuth();

    const profiles = await rest(
        "profiles?id=eq." +
        encodeURIComponent(auth.uid) +
        "&select=id,role,active",
        access
    );

    const profile = profiles[0];

    if (
        !profile ||
        !profile.active ||
        !["admin", "ceo", "cto"].includes(
            String(profile.role).toLowerCase()
        )
    ) {
        throw new Error(
            "Access denied. The document library is restricted to Admin, CEO and CTO."
        );
    }

    // Retrieve documents through the protected database function.
    const response = await fetch(
        API + "/rest/v1/rpc/get_document_library",
        {
            method: "POST",
            cache: "no-store",
            headers: {
                apikey: CFG.anonKey,
                Authorization: "Bearer " + access,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({})
        }
    );

    const result = await response.json();

    if (!response.ok) {
        throw new Error(
            result.message ||
            "Unable to retrieve the document library."
        );
    }

    libraryState.documents = result || [];

    renderLibrary();
}

    const esc = value =>
        String(value ?? "").replace(/[&<>"']/g, c => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        }[c]));

    const fd = value => {
        if (!value) return "-";

        const d = new Date(value + "T00:00:00");

        return isNaN(d)
            ? "-"
            : d.toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric"
            });
    };

    const root = (CFG.siteUrl || location.origin).replace(/\/$/, "");

    const documentUrl = id =>
        `${root}/document.html?id=${encodeURIComponent(id)}`;

    const verifyUrl = number =>
        `${root}/verify.html?c=${encodeURIComponent(number)}`;

    function qr(url) {
        if (typeof qrcode !== "function") {
            throw new Error("QR library is not loaded.");
        }

        const q = qrcode(0, "M");

        q.addData(url);
        q.make();

        return q.createSvgTag({
            cellSize: 4,
            margin: 1,
            scalable: true
        });
    }

    function fail(message) {
        $("loading").hidden = true;
        $("documentContent").hidden = true;
        $("error").hidden = false;
        $("errorMessage").textContent = message;
    }

    function show(html) {
        $("loading").hidden = true;
        $("error").hidden = true;
        $("documentContent").hidden = false;
        $("documentContent").innerHTML = html;
    }

    function header() {
        return `
            <div class="lh">
                <div class="logo">
                    <img src="assets/logo.png" alt="Lucuma Innovations">
                </div>

                <div>
                    <h1>LUCUMA INNOVATIONS</h1>
                    <div class="tag">
                        TECHNOLOGY | INNOVATION | SOLUTIONS
                    </div>
                </div>
            </div>
        `;
    }

    // =====================================================
    // LETTER VIEWER
    // =====================================================

    function letter(d, record, S, SIG) {

        const names = {
            offer: "OFFER LETTER",
            appt: "LETTER OF APPOINTMENT",
            intern: "INTERNSHIP OFFER LETTER"
        };

        const vars = {
            name: d.name || "",
            role: d.role || "",
            start: d.start ? fd(d.start) : "",
            end: d.end ? fd(d.end) : "",
            period: d.period || "",
            mode: d.mode || "",
            pay: d.pay || "",
            valid: d.valid ? fd(d.valid) : ""
        };

        const body = String(d.body || "")
            .split(/\n\s*\n/)
            .filter(p =>
                ![...p.matchAll(/\{(\w+)\}/g)]
                    .some(m => m[1] in vars && !vars[m[1]])
            )
            .map(p => `
                <p>
                    ${esc(p.replace(/\{(\w+)\}/g,
                        (m, k) => vars[k] ?? m
                    )).replace(/\n/g, "<br>")}
                </p>
            `)
            .join("");

        return `
            <article class="viewer-document page lt">

                ${header()}

                <div class="contact">
                    ${esc(S.city || "Mumbai, India")}
                    |
                    ${esc(S.web || "www.lucumainnovations.com")}
                    |
                    ${esc(S.email || "info@lucumainnovations.com")}
                </div>

                <hr class="rule">

                <div class="row">
                    <span>
                        <b>Ref. No.:</b>
                        ${esc(d.ref || record.number)}
                    </span>

                    <span>
                        <b>Date:</b>
                        ${fd(d.date)}
                    </span>
                </div>

                <div class="ttl">
                    ${esc(names[d.kind] || "OFFICIAL LETTER")}
                </div>

                <div class="viewer-letter-body">

                    <p><b>To:</b> ${esc(d.name)}</p>

                    <p>
                        <b>Subject:</b>
                        ${esc(names[d.kind] || "Official Letter")}
                    </p>

                    <p>Dear ${esc(d.name)},</p>

                    ${body}

                    <p>
                        Sincerely,<br>
                        <b>For Lucuma Innovations</b>
                    </p>

                </div>

                <div class="viewer-signatures">

                    <div>
                        ${SIG.s1 ? `<img src="${SIG.s1}" alt="">` : ""}
                        <br>
                        <b>${esc(d.s1n || "")}</b>
                        <br>
                        ${esc(d.s1t || "")}
                    </div>

                    <div>
                        ${SIG.s2 ? `<img src="${SIG.s2}" alt="">` : ""}
                        <br>
                        <b>${esc(d.s2n || "")}</b>
                        <br>
                        ${esc(d.s2t || "")}
                    </div>

                    <div>
                        <img src="assets/stamp.png" alt="Company stamp">
                    </div>

                </div>

                ${d.acc ? `
                    <div class="acc">
                        <h4>ACCEPTANCE</h4>

                        <p>
                            I, ${esc(d.name)}, hereby acknowledge
                            and accept this letter.
                        </p>

                        <div class="sl">
                            <span>Date: __________________</span>
                            <span>Signature: __________________</span>
                        </div>
                    </div>
                ` : ""}

                <div class="viewer-qr">
                    <div>
                        <b>Scan to view this letter</b>
                        <br>
                        <span class="viewer-meta">
                            Document link
                        </span>
                    </div>

                    <div class="qr">
                        ${qr(documentUrl(record.id))}
                    </div>
                </div>

            </article>
        `;
    }

    // =====================================================
    // CERTIFICATE VIEWER
    // =====================================================

function certificate(d, record, S, SIG) {

    const remarks = String(d.remarks || "")
        .replace(/\{name\}/g, d.name || "");

    return `
        <article class="page cert">

            <div class="ccorner a"></div>
            <div class="ccorner b"></div>
            <div class="cframe"></div>

            <div class="cin">

                <!-- COMPANY HEADER -->
                <div class="chead">

                    <img src="assets/logo.png"
                         alt="Lucuma Innovations Logo">

                    <div>
                        <b>LUCUMA INNOVATIONS</b>

                        <small>
                            TECHNOLOGY | INNOVATION | SOLUTIONS
                        </small>

                        ${S.reg ? `
                            <small>
                                Registration No: ${esc(S.reg)}
                            </small>
                        ` : ""}

                    </div>

                </div>

                <!-- CERTIFICATE TITLE -->
                <div class="ct">
                    CERTIFICATE OF COMPLETION
                </div>

                <i class="cu"></i>

                <!-- RECIPIENT -->
                <p class="cs">
                    This is to certify that
                </p>

                <div class="cn">
                    ${esc(d.name) || "&nbsp;"}
                </div>

                <!-- CERTIFICATE DESCRIPTION -->
                <p class="cb">
                    has successfully completed a
                    <b>${esc(d.period)}</b>
                    <b>${esc(d.ptype)}</b>
                    internship as
                    <b>${esc(d.role)}</b>
                    at Lucuma Innovations, from
                    <b>${fd(d.start)}</b>
                    to
                    <b>${fd(d.end)}</b>.
                </p>

                <p class="cb sm">
                    ${esc(remarks)}
                </p>

                <!-- SIGNATURES, STAMP AND QR -->
                <div class="cbot">

                    <div class="sg2">

                        ${SIG.s1 ? `
                            <img src="${SIG.s1}" alt="Signature">
                        ` : ""}

                        <span class="ln"></span>

                        <b>${esc(d.s1n || "")}</b>

                        <small>${esc(d.s1t || "")}</small>

                    </div>

                    <div class="sg2">

                        ${SIG.s2 ? `
                            <img src="${SIG.s2}" alt="Signature">
                        ` : ""}

                        <span class="ln"></span>

                        <b>${esc(d.s2n || "")}</b>

                        <small>${esc(d.s2t || "")}</small>

                    </div>

                    <img
                        class="cst"
                        src="assets/stamp.png"
                        alt="Company Stamp"
                    >

                    <div class="cq">

                        <div class="qr">
                            ${qr(verifyUrl(record.number))}
                        </div>

                        <small>Scan to verify</small>

                        <b>${esc(record.number)}</b>

                        <small>
                            Issued ${fd(d.date)}
                        </small>

                        <small class="issuer">
                            Issued by:
                            ${esc(d.issuerName || "Lucuma Innovations")}
                            <br>
                            ${esc(d.issuerEmail || "")}
                        </small>

                    </div>

                </div>

            </div>

                    </article>
        `;
}

    // =====================================================
    // INVOICE VIEWER
    // =====================================================

    function invoice(d, record, S, SIG) {

        const currency = d.cur || "INR";

        const money = value =>
            new Intl.NumberFormat(
                currency === "INR" ? "en-IN" : "en-US",
                {
                    style: "currency",
                    currency
                }
            ).format(Number(value) || 0);

        const items = Array.isArray(d.items) ? d.items : [];

        const subtotal = items.reduce(
            (sum, item) => sum + (Number(item.a) || 0),
            0
        );

        const tax = subtotal * (Number(d.tax) || 0) / 100;

        const total = subtotal + tax;

        const rows = items.map((item, index) => `
            <tr>
                <td>${index + 1}</td>

                <td>
                    <b>${esc(item.d)}</b>
                    ${item.s ? `<br><small>${esc(item.s)}</small>` : ""}
                </td>

                <td>${money(item.a)}</td>
            </tr>
        `).join("");

        return `
            <article class="viewer-document viewer-invoice page inv">

                <div class="ih">

                    <div class="logo">
                        <img src="assets/logo.png" alt="Logo">
                    </div>

                    <div>
                        <h1>LUCUMA INNOVATIONS</h1>
                        <div class="tag">
                            SOFTWARE DEVELOPMENT | IT SERVICES
                        </div>
                    </div>

                    <div class="big">INVOICE</div>

                </div>

                <hr class="rule">

                <div class="two">

                    <div class="box">
                        <b>BILL TO</b>

                        <p>
                            <b>${esc(d.cn)}</b><br>
                            Address: ${esc(d.ca || "NA")}<br>
                            Email: ${esc(d.ce || "NA")}<br>
                            Contact: ${esc(d.cc || "NA")}<br>
                            Tax ID: ${esc(d.ct || "NA")}
                        </p>
                    </div>

                    <div class="box">
                        <b>INVOICE DETAILS</b>

                        <p>
                            Invoice Number: ${esc(d.inum || record.number)}<br>
                            Invoice Date: ${fd(d.idate)}<br>
                            Due Date: ${fd(d.idue)}<br>
                            Invoice Type: ${esc(d.ity)}<br>
                            Currency: ${esc(currency)}
                        </p>
                    </div>

                </div>

                <h3>PROJECT INFORMATION</h3>

                <table>
                    <thead>
                        <tr>
                            <th>No.</th>
                            <th>Description</th>
                            <th>Amount (${esc(currency)})</th>
                        </tr>
                    </thead>

                    <tbody>
                        ${rows}
                    </tbody>
                </table>

                <div class="two">

                    <div class="box">
                        <b>PAYMENT INFORMATION</b>

                        <p>
                            Account Holder: ${esc(S.bh || "NA")}<br>
                            Bank: ${esc(S.bn || "NA")}<br>
                            Account Number: ${esc(S.ba || "NA")}<br>
                            IFSC: ${esc(S.bi || "NA")}<br>
                            SWIFT: ${esc(S.bs || "NA")}<br>
                            UPI: ${esc(S.bu || "NA")}
                        </p>
                    </div>

                    <div class="box">
                        <b>FINANCIAL BREAKDOWN</b>

                        <p>
                            Subtotal: ${money(subtotal)}<br>
                            Tax (${Number(d.tax) || 0}%): ${money(tax)}
                        </p>

                        <div class="total">
                            TOTAL: ${money(total)}
                        </div>

                        ${d.inote ? `<p>${esc(d.inote)}</p>` : ""}
                    </div>

                </div>

                <h3>TERMS & CONDITIONS</h3>

                <ol>
                    ${String(d.terms || "")
                        .split("\n")
                        .filter(Boolean)
                        .map(x => `<li>${esc(x)}</li>`)
                        .join("")}
                </ol>

                <div class="viewer-signatures">

                    <div>
                        <img src="assets/stamp.png" alt="Stamp">
                        <br>
                        Company Stamp
                    </div>

                    <div>
                        ${SIG.s3 ? `<img src="${SIG.s3}" alt="">` : ""}
                        <br>
                        Authorized Signatory
                    </div>

                </div>

                <div class="viewer-qr">

                    <div>
                        <b>Scan to open this invoice</b>
                        <br>
                        <span class="viewer-meta">
                            Sign-in required
                        </span>
                    </div>

                    <div class="qr">
                        ${qr(documentUrl(record.id))}
                    </div>

                </div>

                <div class="footer">
                    Thank you for choosing Lucuma Innovations.
                    <br>
                    ${esc(S.city || "")}
                    |
                    ${esc(S.email || "")}
                    |
                    ${esc(S.phone || "")}
                    |
                    ${esc(S.web || "")}
                </div>

            </article>
        `;
    }

    // =====================================================
    // AUTHENTICATION
    // =====================================================

    function getAuth() {
        try {
            return JSON.parse(
                localStorage.getItem("li_auth") || "null"
            );
        } catch {
            return null;
        }
    }

    async function getToken() {

        let auth = getAuth();

        if (!auth) {
            throw new Error(
                "Sign in to Lucuma Docs first to view this private invoice."
            );
        }

        if (auth.exp - 60 < Date.now() / 1000) {

            const response = await fetch(
                API + "/auth/v1/token?grant_type=refresh_token",
                {
                    method: "POST",

                    headers: {
                        apikey: CFG.anonKey,
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        refresh_token: auth.refresh
                    })
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    "Your session expired. Sign in again."
                );
            }

            auth = {
                access: result.access_token,
                refresh: result.refresh_token,
                exp: Math.floor(Date.now() / 1000) + result.expires_in,
                uid: result.user.id,
                email: result.user.email
            };

            localStorage.setItem(
                "li_auth",
                JSON.stringify(auth)
            );
        }

        return auth.access;
    }

    // =====================================================
    // SUPABASE REST API
    // =====================================================

    async function rest(path, token) {

        const response = await fetch(
            API + "/rest/v1/" + path,
            {
                cache: "no-store",

                headers: {
                    apikey: CFG.anonKey,
                    Authorization: "Bearer " + token
                }
            }
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.message || "Could not load document."
            );
        }

        return result;
    }

    // =====================================================
    // DOCUMENT LOADING & SYNCHRONIZATION
    // =====================================================

    let lastRenderedSignature = null;
    let refreshBusy = false;

    async function init(silent = false) {

        if (refreshBusy) return;

        refreshBusy = true;

        try {

            if (!API || !CFG.anonKey) {

                if (!silent) {
                    fail("Supabase configuration is missing.");
                }

                return;
            }

            if (!id) {
                try {
                    await loadLibrary();
                } catch (error) {
                    console.error("Library access error:", error);
                    fail(error.message || "Unable to access the document library.");
                }

                return;
            }

            // ---------------------------------------------
            // PUBLIC DOCUMENTS: LETTERS AND CERTIFICATES
            // ---------------------------------------------

            const publicResponse = await fetch(
                API + "/rest/v1/rpc/get_public_document",
                {
                    method: "POST",
                    cache: "no-store",

                    headers: {
                        apikey: CFG.anonKey,
                        "Content-Type": "application/json"
                    },

                    // IMPORTANT: SQL function expects p_id.
                    body: JSON.stringify({
                        p_id: id
                    })
                }
            );

            if (publicResponse.ok) {

                let record = await publicResponse.json();

                if (Array.isArray(record)) {
                    record = record[0] || null;
                }

                if (
                    record &&
                    record.id &&
                    ["letter", "certificate"].includes(record.type)
                ) {

                    if (record.status !== "valid") {
                        throw new Error(
                            "This document has been revoked."
                        );
                    }

                    const settings = record.company || {};
                    const signatures = settings.sig || {};
                    const data = record.data || {};

                    const signature = JSON.stringify({
                        record,
                        settings
                    });

                    if (signature !== lastRenderedSignature) {

                        if (record.type === "letter") {

                            show(
                                letter(
                                    data,
                                    record,
                                    settings,
                                    signatures
                                )
                            );

                        } else {

                            show(
                                certificate(
                                    data,
                                    record,
                                    settings,
                                    signatures
                                )
                            );

                        }

                        lastRenderedSignature = signature;
                    }

                    document.title =
                        record.number + " | Lucuma Innovations";

                    return;
                }
            }

            // If the public RPC fails or returns no public document,
            // continue to authenticated invoice retrieval.

            // ---------------------------------------------
            // PRIVATE DOCUMENTS: INVOICES
            // ---------------------------------------------

            const access = await getToken();

            const records = await rest(
                "documents?id=eq." +
                encodeURIComponent(id) +
                "&select=id,type,number,title,data,status,created_at",
                access
            );

            if (!records.length) {
                throw new Error(
                    "Document not found or you do not have permission to view it."
                );
            }

            const invoiceRecord = records[0];

            if (invoiceRecord.type !== "invoice") {
                throw new Error(
                    "This document is not available."
                );
            }

            if (invoiceRecord.status !== "valid") {
                throw new Error(
                    "This invoice is not currently valid."
                );
            }

            const settings = await rest(
                "settings?key=eq.company&select=value",
                access
            );

            let S = {};
            let SIG = {};

            if (settings.length) {
                S = settings[0].value || {};
                SIG = S.sig || {};
            }

            const signature = JSON.stringify({
                record: invoiceRecord,
                settings: S
            });

            if (signature !== lastRenderedSignature) {

                show(
                    invoice(
                        invoiceRecord.data || {},
                        invoiceRecord,
                        S,
                        SIG
                    )
                );

                lastRenderedSignature = signature;
            }

            document.title =
                invoiceRecord.number + " | Lucuma Innovations";

        } catch (error) {

            console.error(
                "Document synchronization error:",
                error
            );

            if (!silent) {
                fail(
                    error.message || "Unable to load this document."
                );
            }

        } finally {

            refreshBusy = false;

        }
    }

    // =====================================================
    // PRINT BUTTON
    // =====================================================

// BACK BUTTON
$("backBtn").addEventListener("click", (e) => {
    e.preventDefault();

    if (document.referrer &&
        new URL(document.referrer).origin === location.origin) {

        history.back();

    } else {

        location.href = "document.html";

    }
});


// PRINT BUTTON
$("printBtn").addEventListener("click", () => {

    if (!$("documentContent").hidden) {
        window.print();
    }

});

    $("librarySearch").addEventListener("input", e => {
    libraryState.search = e.target.value;
    renderLibrary();
    });

    document.querySelectorAll(".lib-filter").forEach(button => {
        button.addEventListener("click", () => {
            libraryState.filter = button.dataset.filter;
            renderLibrary();
        });
    });

    // =====================================================
    // INITIAL LOAD
    // =====================================================

    init();

    // =====================================================
    // AUTOMATIC DATABASE SYNCHRONIZATION
    // =====================================================

    setInterval(() => {

        if (!document.hidden) {
            init(true);
        }

    }, 3000);

})();