# AGENTS.md — Instructions for AI Coding Agents

This file can be copied to the repository root as `AGENTS.md`. It is a developer instruction file and is not a replacement for tests.

## Mission
Build Kisan Machinery Manager: mobile-first English/Telugu/Hindi SaaS for agricultural machinery owners using React, TypeScript, Vite, Tailwind, Node.js, Express, MongoDB.

## Mandatory reading order
`docs/README.md` -> `docs/01-product/PRD.md` -> `docs/02-design/DESIGN_MDR.md` -> `docs/02-design/SCREEN_SPEC.md` -> relevant architecture/business rules/test docs.

## Nonnegotiable rules
1. Implement **one backlog item** or well-defined vertical slice at a time; don't rebuild unrelated features.
2. Match approved dark-green agricultural SaaS visual design. Responsive mobile interactions take priority.
3. Feature ownership: Dashboard summary; Farmers CRUD; Machinery rates; Add Work new jobs; Work Records history; Bills invoices; Payments receipts/dues; Reports detailed analytics; Settings preferences. Do not duplicate operation forms.
4. No hardcoded live financial totals or fake 'saved' success messages.
5. Store INR money in integer paise and use decimal-safe quantity arithmetic. Rates freeze into completed jobs and issued invoices.
6. Receipts and invoice issuance are idempotent and transactional. Never edit posted receipts silently.
7. Every database query/write is scoped by authenticated business ID and tested.
8. Translatable strings use i18n; support Telugu/Hindi labels, long strings and 360px screens.
9. Forms have clear labels, understandable validation, 48px touch targets and a review step before financial posting.
10. Preserve user's existing code and visual components unless explicitly asked to refactor. Check and run tests before finishing.

## Change procedure
Before writing: state target files, tests, expected API shape and relevant backlog IDs. Implement; test with exact command; report what passed/failed; update docs if assumptions changed. No claims of verified behavior without executing tests.

## Files and module boundaries
Keep `apps/web` page components separate from `apps/api` business services. Components must not directly manipulate MongoDB; frontend performs API calls. Financial algorithms are server-authoritative with unit-tested pure functions.

## Do not implement without explicit scope
Payment gateway, farmer portal, marketplace, automatic WhatsApp sending, GST/tax computation, voice assistant, offline posted-payments sync or staff roles; those are future features.

## Sample completion report
`Implemented PAY-01: receipt creation transaction + idempotency; tests: 8 passed, 0 failed; tested cross-tenant 404; remaining: API docs adjustment; UI not yet connected.`
