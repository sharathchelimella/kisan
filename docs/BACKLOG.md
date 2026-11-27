# Prioritized Product Backlog

Use IDs in tickets/AI prompts and mark status in project board, not in this specification. All tasks inherit tenant isolation, validation, translation and responsive requirements.

| ID | Epic | Deliverable | Priority | Dependency |
|---|---|---|---|---|
| UI-01 | Design | Tokens, typography, layout, icon set | P0 | none |
| UI-02 | Design | AppShell, responsive sidebar/bottom nav | P0 | UI-01 |
| UI-03 | Design | Forms, data tables/cards, search/filter, badges | P0 | UI-01 |
| UI-04 | Design | Nine static routes with approved screenshot styling | P0 | UI-02,UI-03 |
| AUTH-01 | Auth | Session registration/login/logout | P0 | API-01 |
| AUTH-02 | Auth | Business isolation middleware + tests | P0 | AUTH-01 |
| API-01 | Platform | Express, MongoDB, validation, error contract | P0 | none |
| FARM-01 | Farmers | Farmer model, CRUD, search, duplicate hints | P0 | AUTH-02 |
| CAT-01 | Catalog | Equipment and services CRUD/rates | P0 | AUTH-02 |
| JOB-01 | Jobs | Wizard with multi-line custom price | P0 | FARM-01,CAT-01 |
| JOB-02 | Jobs | Completed jobs, history, correction rules | P0 | JOB-01 |
| INV-01 | Billing | Sequence + immutable invoice snapshots | P0 | JOB-02 |
| INV-02 | Billing | Invoice view/list/filters, PDF, share handoff | P0 | INV-01 |
| PAY-01 | Payments | Receipt and allocation transaction engine | P0 | INV-01 |
| PAY-02 | Payments | Receipt UI, payment history and reversal | P0 | PAY-01 |
| PAY-03 | Payments | Filter dues by service/farmer/village/status | P0 | PAY-01 |
| RPT-01 | Reports | Dashboard aggregated API + summary UI | P0 | JOB-02,PAY-01 |
| RPT-02 | Reports | Revenue/equipment charts and CSV export | P0 | RPT-01 |
| I18N-01 | UX | EN/TE/HI reviewed translation files | P0 | UI-04 |
| QA-01 | Quality | Financial, isolation and e2e test suite | P0 | All P0 |
| OPS-01 | Deploy | Staging/prod, backup, monitoring, restore drill | P0 | API-01 |
| UX-01 | Research | Pilot sessions and iteration | P0 | UI-04 |
| OFF-01 | Next | PWA offline mutations/sync reconciliation | P1 | PAY-01,INV-01 |
| VOICE-01 | Next | Voice entry and confirmation | P1 | I18N-01,JOB-01 |
| MAINT-01 | Next | Maintenance/expenses/profit | P1 | CAT-01,RPT-02 |
| MSG-01 | Next | Consent-based WhatsApp reminders | P2 | INV-02 |

## Ticket definition of done
- Acceptance scenario and owner page recorded.
- API schema/client and tests created or updated.
- Correct financial rules and tenant guard verified.
- Mobile 360px and English/Telugu/Hindi states reviewed.
- No duplicate feature UI added to another page.
- Error/loading/empty state present; documentation updated.
