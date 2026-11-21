# Lucuma Docs (web)

Letters (offer, appointment, internship), completion certificates with QR verification, invoices.
Team login with roles. Runs on any static hosting; data lives in Supabase.

## 1. Database (once)
1. Create a project at supabase.com (free plan is enough).
2. SQL editor: paste and run `setup.sql`.
3. Authentication → Providers → Email: turn OFF "Allow new users to sign up".
4. Authentication → Users → Add user: create your own login (email + password).
5. SQL editor: `update public.profiles set role='core' where email='YOUR EMAIL';`

## 2. Configure
Open `config.js` and fill in: Supabase project URL, anon key (Project settings → API), and your live site address
(e.g. https://docs.yourdomain.com). The site address goes inside certificate QR codes, so set it before issuing any.

## 3. Upload
Upload everything in this folder to a subdomain such as docs.yourdomain.com (cPanel: File Manager → public_html/docs,
or create a subdomain). HTTPS must be on. The included `.htaccess` forces HTTPS and adds security headers.

## 4. Use
- Sign in → Settings (core members): enter company and bank details, upload signatures. Shared with the whole team.
- Team (core members): add teammates in Supabase → Authentication → Users; they appear in the Team tab. Set Team member or Core member, or switch someone off.
- Certificates: pressing Print / Save as PDF saves the certificate first, so its QR code verifies at /verify.html.
- Core members can revoke a certificate in History; the verify page then shows "Certificate revoked".

## Security notes
- Anyone can download the site files, so none contain secrets. Documents, bank details and signatures are only readable by signed-in, active team members (Supabase row-level security).
- The anon key is public by design. Never put the service_role key in config.js.
- The public verify page can only look up one exact certificate number and returns name, role, period, type, issue date and status.
- For an extra layer, put the site behind Cloudflare Access or host password protection.
