# Lucuma API — Cloudflare deployment

This package deploys the existing Lucuma chat API logic as a Cloudflare Worker using your existing D1 and R2 resources. The PHP chat endpoint has been ported to JavaScript because the current PHP API depends on outbound cURL calls to Supabase; the current community PHP-on-Workers WASM runtime documents that outbound HTTP from PHP is not available. This is therefore a Cloudflare-native API replacement, not a PHP runtime deployment.

## 1. Place the files

Copy the `lucuma-web/` folder from this ZIP into the existing repository, merging it with the existing `lucuma-web/` folder. Do not replace or delete other website files. The Worker folder must be:

`lucuma-web/cloudflare-worker/`

The package also includes `lucuma-web/config.js`, with `chatApiBaseUrl` set to the Worker endpoint. Merge that file only if it matches your current config; preserve any newer settings you have added.

## 2. Deploy from the Worker folder

Open a terminal in:

`<repository>/lucuma-web/cloudflare-worker`

Run:

```bash
npm install
npx wrangler login
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_ANON_KEY
npx wrangler deploy
```

When prompted, enter the existing Supabase project URL and its publishable/anon key. Do not paste a service-role key. The secret values are stored in Cloudflare and are not written into Git.

The `wrangler.toml` already binds:
- D1 `DB` → `lucuma-docs-prod`
- R2 `LUCUMA_STORAGE` → `lucuma-docs-storage`

It targets the existing Worker name `lucuma-api`. Do not create a second database or bucket.

## 3. Verify

Open:

`https://lucuma-api.lucumainnovations.workers.dev/health`

Expected JSON includes `ok: true`, `database: true`, and `storage: true`.

## 4. Frontend and existing services

`config.js` points `chatApiBaseUrl` to:

`https://lucuma-api.lucumainnovations.workers.dev/chat-api`

Keep `backendApiBaseUrl` unchanged for now. The separate mail backend uses IMAPFlow/Nodemailer and is not included in this Worker deployment. Do not point mail to this Worker.

## Notes

- This deploys the Worker code; it does not import old MySQL records into D1.
- The D1 schema must already be present (your existing `lucuma-docs-prod` schema).
- Test chat create/list/send/edit/delete and R2 upload/download before production use.
- Do not commit `.dev.vars`, `.env` files, `chat-api/config.php`, or credentials.
- The Worker is JavaScript. Cloudflare does not provide a first-party native PHP runtime. The community PHP WASM route is not compatible with this current PHP API's direct cURL-to-Supabase flow without redesign.
