# Ready-to-Use AI Development Prompts

Use these with an AI coding assistant that has repository access. Attach/reference the `docs/` folder and only ask for one milestone at a time.

## Prompt 0 — Scaffold
> Read `docs/README.md`, PRD, DESIGN_MDR, SCREEN_SPEC, HLD, AGENTS. Scaffold a TypeScript monorepo with React+Vite+Tailwind frontend and Express API, shared schema package, lint/format/test setup. Implement the approved sidebar/header/mobile nav, design tokens, and all nine placeholder routes. Use sample data only for presentation; mark it as demo. Do not implement backend business logic yet. Provide changed files and test output.

## Prompt 1 — Farmers & Machinery
> Implement FARM-01 and CAT-01 using API.md and DATABASE.md. Create tenant-scoped MongoDB models, Zod validation, CRUD/search APIs, corresponding React pages with no duplicated payment/job form. Include pagination, duplicate hints, tests for cross-business access, 360px mobile states, English/Telugu/Hindi keys. Report exact tests run.

## Prompt 2 — Work wizard
> Implement JOB-01/JOB-02 using PRD, USER_FLOWS, SCREEN_SPEC, BUSINESS_RULES and LLD. Four-step Add Work wizard with multiple service lines, per-hour/per-acre/per-trip/fixed/custom total pricing. Show review before save. Freeze job-specific amounts. Use integer paise and decimal-safe calculations. Add financial unit tests and a complete workflow e2e test. Do not add invoice/payment forms to Add Work.

## Prompt 3 — Invoicing
> Implement INV-01/INV-02 using API.md, LLD, DATABASE, BUSINESS_RULES. Create atomic unique invoice numbers scoped per business; immutable issue snapshots, list/search/status filters, PDF route and user-initiated share. Add tests for rate immutability, duplicate issue prevention, and permissions. No receipt entry form on invoice page.

## Prompt 4 — Payments
> Implement PAY-01/02/03 with MongoDB transactions and unique idempotency keys. Post partial/full receipts to chosen invoice, prevent overpayment and double submit, support reversal audit and farmer/equipment filters. For mixed-service invoice equipment analytics use the documented proportional attribution; never duplicate entire invoice dues by equipment. Test concurrency and balance integrity.

## Prompt 5 — Dashboard & Reports
> Implement RPT-01/02. Dashboard summary only (work value, collections, open balance, total farmers, completed jobs, latest activity, quick links). Reports page owns detailed trends and machinery financial charts. Calculate work value by work date, collections by receipt date, current dues as-of cutoff. Provide CSV export and reconciliation tests. Do not duplicate advanced charts on Dashboard.

## Prompt 6 — Ship-readiness
> Audit against PRD FR-01..FR-15 and TEST_PLAN T-01..T-20. Fix accessibility on 360px Android, missing Telugu/Hindi strings, tenant isolation, auth/session configuration, backup and logging gaps, PDF correctness and transaction race conditions. Do not claim production ready until tests, restore drill and usability pilot results are documented.

## Prompt template for any future task
> Goal: [one backlog ID and user outcome]. Read these exact docs: [paths]. Follow AGENTS. Before code, list assumptions and files affected. Implement with minimal scope. Add unit/API/UI tests. Run relevant commands. Summarize functionality, test results, unresolved risks, and document changes.
