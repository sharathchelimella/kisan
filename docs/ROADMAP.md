# Development Roadmap

**Rule:** Each phase produces a running, testable slice. Do not ask AI to generate the entire app in one pass.

## Phase 0 — Foundation and design (M0)
- Set up TypeScript monorepo, lint/format, routing, i18n, Tailwind tokens.
- Build approved AppShell/sidebar/mobile bottom nav, buttons, fields and status chips.
- Create static high-fidelity versions of Dashboard, Farmers, Machinery, Add Work, Work Records, Bills, Payments, Reports, Settings using mock data.
- Verify 360px/mobile, keyboard and translated layouts.
**Exit:** all 9 routes work, UI fidelity reviewed, components reusable, no duplicate operation UIs.

## Phase 1 — Authentication and farmer/catalog CRUD (M1)
- Express + MongoDB connection, business/user session, tenant isolation.
- Farmer CRUD/search and equipment/service CRUD/rates.
- API tests and UI integration.
**Exit:** owner can log in and add/search farmers and services persistently.

## Phase 2 — Work and pricing engine (M2)
- 4-step Add Work wizard; multiple lines; custom rate/total; work history.
- Decimal-safe money rules, completed-job snapshot, corrections.
**Exit:** acceptance tests T-03..T-06 pass.

## Phase 3 — Invoices and receipts (M3)
- Atomic number generation, immutable issued invoice, PDF and share.
- Payment entry, partial/full, reversal, idempotency, concurrency.
- Due list filtered by farmer, service, village, status.
**Exit:** T-07..T-13 pass, balances reconcile.

## Phase 4 — Dashboard and reports (M4)
- Backend summary endpoints; dashboard cards, activity, report charts.
- Date filters, equipment attribution, CSV export.
**Exit:** T-14 plus report consistency tests pass.

## Phase 5 — Polish and release (M5)
- Telugu/Hindi native review, usability field test with machinery owners, loading/errors.
- Access control, backups/restore, production telemetry and performance.
- Release staging -> production after QA gate.
**Exit:** T-01..T-20 pass; at least 4 of 5 pilot users can perform core tasks.

## Next release (not committed to MVP)
- True offline write/sync and conflict handling.
- Speech-to-text entry and optional spoken confirmation.
- Maintenance and diesel expenses/profit reports.
- WhatsApp Business automatic reminders with opt-in.
- Staff accounts, fine-grained role permission, customer payment allocation across invoices.

## Suggested sprint sequencing
1. Week 1: design system, app shell, UI routes.
2. Week 2: farmer + catalog and backend auth.
3. Week 3: jobs and pricing.
4. Week 4: invoices and receipts.
5. Week 5: dashboard/reports, testing.
6. Week 6+: multilingual QA, field pilot, security/reliability and launch.
Timing is an **illustrative planning estimate**, not a delivery promise; scope/experience will change it.
