# Security, Privacy, and Operational Requirements

## Identity and authorization
- One `OWNER` role per business in MVP; future roles explicitly documented before adding.
- User/password or OTP sign-in must be rate-limited, protected against enumeration and include secure recovery.
- Hash passwords with Argon2id or similarly reputable password hashing method; no plaintext passwords.
- Secure session cookies: HttpOnly, Secure, SameSite appropriate to deployment, CSRF protection for cookie-authenticated writes.
- Do not trust `businessId` or financial calculation values supplied by frontend; derive business context from session and validate server-side.

## Tenant isolation
Every read, update and aggregate filters by authenticated `businessId`. Nested references (farmer/equipment/job/invoice/receipt) also checked for same business. Test ID enumeration and mixed-tenant mutation attempts.

## Data handling
- Farmers' names, phone numbers and villages are personal data. Collect only necessary details; make phone optional if not required.
- Treat PDF invoices and export files as sensitive. Require authorized download; avoid public permanent URLs. Use short-lived signed links if file storage later added.
- Encrypt in transit (HTTPS); encrypt managed DB/backups at rest; use secret manager/host env settings.
- Avoid putting phone numbers, private notes, passwords or account secrets in application logs and analytics events.
- Configurable data retention/deletion policy needs local legal and accounting review before real deployment.

## Financial integrity
- Transactions and idempotency on receipts and invoice numbering.
- Audit all sensitive mutations with actor, reason, before/after fingerprint or changed fields without unnecessary PII.
- Require confirmation for full payment, void, reversal and cancellations.
- For browser exports and print, warn about shared-device privacy.

## Input and interface safety
- Zod/server validation on length, type, value range, Unicode, dates and decimal money fields.
- Escape all user-provided text in HTML/PDF; prevent XSS and injection.
- Sanitize PDF HTML template; do not fetch arbitrary remote URLs during PDF rendering.
- Apply CSP, CORS allowlist, HTTPS redirect, security headers and upload limits.

## Reliability and backups
- Automated daily encrypted database backup; retention and restore drills.
- Staging production-like tests on transaction/receipt race conditions.
- Controlled migrations with rollback plan; production errors to monitoring without secrets.
- Alerts for failed backup, failed reconciliation, unusual login bursts and payment-write errors.

## Legal and integration note
This is engineering guidance, not a claim of compliance with any tax/privacy regulation. Before production launch in India, verify applicable privacy and invoicing requirements, business tax treatment and WhatsApp messaging terms with qualified sources.
