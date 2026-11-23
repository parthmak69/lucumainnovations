import "dotenv/config";

const endpoint = process.env.CLOUDFLARE_D1_PROXY_URL || "";
const token = process.env.MAIL_DB_INTERNAL_TOKEN || "";

async function execute(sql, params = []) {
  if (!endpoint || !token) throw new Error("Cloudflare D1 bridge is not configured.");
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json", "x-internal-token": token },
    body: JSON.stringify({ sql, params })
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || `D1 query failed (${response.status}).`);
  const meta = payload.meta || {};
  const rows = payload.rows || [];
  return [rows, {
    insertId: Number(meta.last_row_id || 0),
    affectedRows: Number(meta.changes || 0),
    changedRows: Number(meta.changes || 0),
    warningStatus: 0
  }];
}

const db = { execute, query: execute };
export default db;
