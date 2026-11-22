# Lucuma Docs

### Document Management, Certificate Generation & Verification Platform

Lucuma Docs is a document management and certificate verification platform developed by **Lucuma Innovations**.

The platform provides an integrated workspace for managing organizational documents, generating certificates, administering team access, and verifying certificates through QR codes.

It is designed to simplify document workflows while maintaining controlled access to sensitive organizational information.

---

## 1. Overview

Lucuma Docs brings document management and certificate operations into a centralized web application.

The platform includes:

- Document management and viewing.
- Certificate generation and management.
- QR-based certificate verification.
- Team administration and access management.
- Imported PDF management.
- Certificate approval and revocation workflows.
- Organization profile and company information management.
- Shared organizational resources.

---

## 2. Core Features

### 2.1 Document Management

- Centralized document management.
- Document viewing through the integrated document viewer.
- Support for uploaded and imported PDF documents.
- Document approval workflows.
- Access-controlled document visibility.
- Document-related information management.

### 2.2 Certificate Management

- Generate professional digital certificates.
- Save generated certificates as PDF documents.
- Generate QR codes for certificate verification.
- Verify certificates using their unique verification information.
- Manage certificate records.
- Revoke certificates when necessary.
- Display certificate verification status.

### 2.3 QR-Based Verification

Lucuma Docs provides QR-based certificate verification.

Each generated certificate includes a QR code that directs users to the certificate verification page.

The verification system allows users to:

- Scan a certificate QR code.
- Open the verification page.
- Retrieve certificate information.
- Check certificate authenticity.
- Identify revoked certificates.

### 2.4 Team Management

The platform supports organizational team administration.

Features include:

- Adding team members.
- Managing team access.
- Assigning organizational roles.
- Managing core members.
- Providing centralized team administration.

Team members are managed through Supabase Authentication and the application's role-management functionality.

### 2.5 Organization Settings

Core members can manage organizational information, including:

- Company information.
- Bank details.
- Organizational signatures.
- Shared company resources.

### 2.6 Imported PDF Management

The platform supports imported PDF documents and associated approval workflows.

Features include:

- Importing PDF documents.
- Managing imported document records.
- Approval-related visibility controls.
- Viewing approved documents.
- Maintaining document status information.

---

## 3. Technology Stack

| Technology | Purpose |
|---|---|
| HTML5 | Application structure |
| CSS3 | Styling and responsive interface |
| JavaScript | Frontend functionality |
| Supabase | Authentication and database services |
| PostgreSQL | Application data storage |
| QR Code Library | QR code generation |
| PDF Tools | Certificate and document handling |
| Vercel | Deployment configuration |

---

## 4. Project Structure

```text
lucuma-web/
│
├── assets/
│   └── Application assets
│
├── fonts/
│   └── Custom fonts
│
├── supabase/
│   └── Database configuration and migrations
│
├── vendor/
│   └── Third-party libraries
│
├── app.js
├── config.js
├── document.html
├── document.js
├── fonts.css
├── index.html
├── qr.html
├── qr.js
├── styles.css
├── team-admin.html
├── team-admin.js
├── verify.html
├── verify.js
├── verify-imported.html
├── verify-imported.js
├── .htaccess
├── robots.txt
├── vercel.json
└── README.md
```

---

## 5. Installation and Setup

### Prerequisites

- Git
- Python or another local development server
- Supabase account
- Modern web browser

### Step 1: Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/lucuma-docs.git
```

### Step 2: Open the Project

```bash
cd lucuma-docs
```

### Step 3: Configure Supabase

Open `config.js`.

Configure:

- Supabase project URL.
- Supabase publishable/anon key.
- Application website URL.

Use the appropriate project credentials.

Never expose a Supabase service-role key in frontend code.

### Step 4: Configure the Database

Open the Supabase SQL Editor.

Execute the database setup SQL and any required migrations included in the repository.

### Step 5: Configure Authentication

In Supabase:

1. Open Authentication.
2. Configure the required authentication providers.
3. Configure authorized redirect URLs.
4. Configure custom SMTP if required.
5. Create and manage authorized users.

### Step 6: Run Locally

Start a local development server:

```bash
python -m http.server 5500
```

Open:

```text
http://localhost:5500
```

---

## 6. Environment Configuration

Lucuma Docs supports separate local and production environments.

| Environment | Example |
|---|---|
| Local | http://localhost:5500 |
| Production | https://docs.yourdomain.com |

Configure the appropriate URLs in the application and Supabase Authentication URL Configuration.

For password recovery, ensure that the redirect URL is included in the allowed redirect URL list.

---

## 7. Deployment

The application can be deployed using a static hosting provider.

Deployment options include:

- Vercel
- Hostinger
- Other compatible static hosting services

### Deployment Checklist

1. Configure Supabase credentials.
2. Configure the production website URL.
3. Configure Supabase redirect URLs.
4. Upload the application files.
5. Enable HTTPS.
6. Verify authentication.
7. Test document viewing.
8. Test certificate generation.
9. Test QR verification.
10. Test team administration.

---

## 8. Security

Security is an important consideration in Lucuma Docs.

The application uses Supabase Authentication and database access policies to manage user access.

Security considerations include:

- Role-based access management.
- Supabase Row Level Security.
- Authorized authentication.
- Controlled document visibility.
- Certificate verification.
- Certificate revocation.
- HTTPS deployment.
- Protection of private credentials.

**Important:** Frontend role checks alone are not sufficient security. Sensitive database operations must be protected using server-side authorization and appropriate Row Level Security policies.

---

## 9. Repository Maintenance

### Check Git Status

```bash
git status
```

### Stage Changes

```bash
git add .
```

### Commit Changes

```bash
git commit -m "Describe your changes"
```

### Push Changes

```bash
git push origin main
```

---

## 10. Project Information

**Project:** Lucuma Docs  
**Organization:** Lucuma Innovations  
**Category:** Document Management and Certificate Verification  
**Repository:** GitHub  
**Database and Authentication:** Supabase  

---

## 11. License

Copyright © Lucuma Innovations.

All rights reserved.

This project is proprietary software developed by Lucuma Innovations. Unauthorized copying, redistribution, or commercial use is not permitted without prior authorization.