# P90 integration and release gate

The production Express app binds the Mongo repositories for auth, farmers, catalog, jobs, invoices, payments, dashboard, reports and settings. `apps/api/src/server.ts` creates the required indexes at startup. MongoDB must be a replica set because registration, invoice issuance and payment posting use transactions.

## Verified locally

Build the API with `npm run build` before invoking the packaged reconciliation command.

Run `npm run test:integration` for the isolated one-node Mongo replica set. The test exercises two owner businesses, registration and login, tenant-scoped reads, a 3.5-acre custom-rate bill for INR 5,950, partial and final receipts, retry keys, overpayment rejection, concurrent receipts, a mixed-service invoice with estimated equipment dues, historical rate preservation, PDF text, work-date versus payment-date reporting, reversal and settings snapshots. The test also checks ledger reconciliation against valid and deliberately altered invoice data. It does not change the user's MongoDB service or application data.

Run `npm run reconcile -w @kisan/api` with a configured `MONGODB_URI` to read every business ledger. Each JSON line has a business ID and issue codes, without names or contact details. Exit code 0 means no issues were detected; exit code 1 means reconciliation or connectivity failed. Schedule it with alerts after deployment. It is read-only and uses a snapshot transaction per business.

Run `npm run drill:backup-restore -w @kisan/api` to test MongoDB Database Tools against a temporary local database. The drill archives four linked collections, restores into a second temporary database, compares every document and removes the archive. This local drill passed on Windows with MongoDB 8.2. It does not inspect a real backup or modify the configured application database.

The browser release checks cover Hindi Settings at 360px with 200% text scaling and a delayed failed Settings save. The form no longer overflows and retains entered values after the failed request. The screenshots are in `docs/screenshots/p90-settings-200-text.png`.

The API exposes `/api/v1/ready` for deployment readiness. It returns 503 without MongoDB, while `/api/v1/health` continues to report process liveness. Production configuration requires both a MongoDB URI and a registration secret. API responses send no-sniff, no-referrer and frame-denial headers; secure-cookie mode also sends HSTS. HTTPS termination and trusted proxy behavior must still be checked in staging.

## Release gate still requiring a real environment

- Production-like staging with HTTPS, secure cookies, monitoring and secret management.
- Encrypted daily MongoDB backups and a timed restore drill against the deployed backup; the isolated local drill passed, but no deployed backup destination or retention policy is configured.
- Controlled migration review and rollback on a copy of the real database.
- Pilot review of native Telugu/Hindi wording, a small Android device on poor connectivity, browser zoom and screen-reader use. The local check used 200% text scaling and an intercepted failed request.
- Deployment and legal/privacy review for the operating location.

The local integration suite is evidence for the data path, not a production-release approval.
