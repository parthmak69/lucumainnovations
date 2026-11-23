# Lucuma Docs — Lucuma Innovations

Existing document, letter, invoice, certificate, QR verification, imported-PDF and team administration workflows are retained. This package adds a collaboration workspace as an additive extension.

## New collaboration workspace

Open **Tasks & Connect** from the main navigation (or `collaboration.html`).

- Task assignment for authorized management roles (admin, CEO, CTO).
- Per-user task progress updates with mandatory remarks and timestamps.
- Task activity history and priority/deadline tracking.
- Individual and group conversations with membership-scoped database access and periodic refresh (6-second polling; Supabase Realtime subscriptions are not enabled yet).
- Responsive glassmorphism workspace for desktop, tablet and mobile.

## Required Supabase migration

Before using the new workspace, apply:

`supabase/migrations/202611230001_collaboration.sql`

Use the Supabase SQL Editor or your migration workflow. This migration creates new tables and policies; it does not replace existing tables. Review the policies against your actual production role model before deployment.

The application expects the existing `profiles` table to contain `id`, `name`, `email`, `role`, and `active`, as used by the current app. The current role values are `admin`, `ceo`, `cto`, `member`, and `core`.

## Important messaging security status

The chat in this package uses authenticated Supabase access and HTTPS transport. **It is not end-to-end encrypted.** Do not describe it to staff as E2EE or use it for highly sensitive secrets. True E2EE requires an audited protocol, client-side cryptographic implementation, device identity/key enrollment, group key rotation, recovery design and independent security testing. That is not safely achieved by simply encrypting a database column, so it has not been falsely represented as completed here.

## Authentication and sessions

The existing app stores its Supabase session in browser `localStorage` under `li_auth`. That means accounts share a session in the same browser profile/origin: sign out before switching accounts, or use separate browser profiles for simultaneous accounts. Different devices/browsers have independent storage. This release does not claim to provide per-device session inventory or automatic cross-device revocation.

## Configuration and deployment

`config.js` is downloaded by the browser and therefore cannot be made private using `.htaccess`. It must contain only the Supabase project URL, public publishable/anon key and public site URL. Never put service-role keys, SMTP passwords or other secrets in it.

- Apache/cPanel: `.htaccess` enforces HTTPS, disables directory listing and denies access to common server-side secret/backup files.
- Vercel: `vercel.json` adds baseline security headers. `.htaccess` is ignored by Vercel.
- Keep Supabase service-role keys and SMTP credentials in server-side environment variables/Edge Function secrets only.

## Run locally

```bash
python -m http.server 5500
```

Open `http://localhost:5500`. Configure the Supabase redirect allow-list for both localhost and the production origin.

## Validation before production

1. Apply the SQL migration in a staging project first.
2. Test task creation as admin/CEO/CTO.
3. Test task updates as each assigned employee.
4. Verify users cannot read tasks they are not assigned to.
5. Verify users cannot read conversations unless they are members.
6. Test group membership and direct-message membership.
7. Test existing document creation, PDF viewing, certificates, QR verification and imported PDFs.
8. Review Supabase RLS policies and database advisor findings.
9. Test mobile layouts and production deployment headers.

## Existing platform

Lucuma Docs remains a document management, certificate generation and verification platform developed by **Lucuma Innovations**. The new collaboration workspace is additive and does not replace the existing document workflows.


## November 23 dashboard and collaboration repair
- Run `supabase/fixes/20261123_conversations_rls_repair.sql` in the Supabase SQL Editor. This is a focused repair script; do not rerun the original migration just to repair this policy.
- The repair makes the conversation insert check compare `created_by` directly with `auth.uid()` and uses a SECURITY DEFINER helper for creator-authorized participant inserts.
- Task managers (Admin, CEO, CTO) can now edit task title, description and due date or delete a task from the task card. Database RLS still enforces management roles.
- Dashboard now greets the signed-in user by time of day and displays their role, task counts, recent tasks and quick actions.
- The app must be refreshed after deploying these files. SQL changes must be applied separately in Supabase.
- If the conversation insert still fails, inspect the diagnostic query result included at the bottom of the repair script. The authenticated user id must equal the profile id.

## November 23 complete repair package
- **Run `supabase/fixes/20261123_full_rls_repair.sql`** in Supabase SQL Editor. This is the required latest repair for chat creation and membership visibility, plus manager task update/delete permissions. It is safe to re-run.
- A database trigger now adds the conversation creator as the first member atomically. This is important because PostgREST's `return=representation` must pass the conversation SELECT policy immediately after INSERT.
- The browser no longer tries to add the creator a second time; it adds only the selected participants.
- Task deletion is verified after refresh. If the row remains, the UI reports a database permission failure rather than showing a false success.
- Activity history is rendered as an animated chronological vertical timeline.
- Dashboard KPI cards include visual icons.
- Document library loading falls back to a normal RLS-protected `documents` query if the optional `get_document_library` RPC is not deployed. The document viewer also accepts a one-row array response from `get_public_document`.
- JavaScript syntax was checked locally. SQL must still be applied and tested against your own Supabase project; it has not been executed against production from this package build.


## Lucuma Connect chat storage (Hostinger MySQL)

Chat messages and conversation records are now stored in a separate MySQL database on your hosting account, not in Supabase Postgres. Supabase Auth remains in use to validate the signed-in Lucuma user and retrieve active team identities.

1. In Hostinger hPanel, create a MySQL database and user.
2. Open phpMyAdmin and import `chat-api/schema.mysql.sql`.
3. Copy `chat-api/config.example.php` to `chat-api/config.php`.
4. Fill in the Supabase project URL, public anon/publishable key, and Hostinger MySQL credentials in `config.php`.
5. Set `allowed_origin` to your exact app origin (for local testing, temporarily use `http://localhost:5500`; use your production HTTPS origin after deployment).
6. Upload the `chat-api` folder beside `collaboration.html`. Confirm PHP cURL and PDO MySQL extensions are enabled.
7. Keep `config.php` private. The included Apache rules deny direct access to it.

Chat API endpoint defaults to `chat-api/api.php`. Override `chatApiBaseUrl` in `config.js` if your API is hosted elsewhere. When developing with `python -m http.server`, the PHP endpoint will not execute; use PHP's local server or your Hostinger deployment for chat testing.

**Privacy/security:** chat content is stored in Hostinger MySQL; Supabase is used for authentication/profile validation only. HTTPS protects transport, but this is not end-to-end encryption. Do not use it for highly sensitive secrets. Restrict database credentials, enforce HTTPS, back up the MySQL database, and periodically review/delete old messages according to your retention policy.
