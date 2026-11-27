# Architecture Decision Records (ADRs) and Open Questions

## Accepted baseline decisions
| ID | Decision | Reason |
|---|---|---|
| ADR-001 | MERN modular monolith | Fast iteration, one deployment boundary for financial logic |
| ADR-002 | React + TypeScript + Vite + Tailwind | Consistent approved SaaS UI and type safety |
| ADR-003 | Nine-page information architecture | Prevent feature duplication |
| ADR-004 | Multi-language en/te/hi | Accessibility for intended users |
| ADR-005 | Integer paise & decimal-safe quantities | Avoid floating money errors |
| ADR-006 | Per-job frozen custom pricing | Real rate changes by land/location |
| ADR-007 | One invoice per job for MVP | Simpler reconciliation and numbering |
| ADR-008 | One invoice allocation per receipt for MVP | Clear user decisions for partial payments |
| ADR-009 | Read-only estimated proportion for mixed-line equipment dues | Avoid double counting in early reports; later exact line allocations possible |
| ADR-010 | Online-first MVP, offline financial sync later | Safer than partial implementation |
| ADR-011 | PDF/WhatsApp handoff via user intent | Avoid unverified automatic messaging claims |
| ADR-012 | Receipts reversible, never destructively edited | Auditability |

## Questions to validate with machinery owners before production
1. Is one job normally one field visit, or can it span multiple dates? Current default: one work date with optional multiple service lines.
2. Does the same equipment have seasonal/village-specific price lists? Current default: one standard rate per service; job override handles exceptions.
3. Should owners combine several jobs into one monthly bill? Current MVP: one invoice per job; future batch billing.
4. Can one cash collection be allocated across multiple invoices in a single entry? MVP requires explicit split; future multi-allocation UI.
5. Should owners track driver or diesel expenses on day one? Moved to Next release pending pilot.
6. Are invoices formal tax documents or simple service receipts? MVP: service bill; consult compliance expert before GST support.
7. Is offline creation essential for first pilot? Current MVP online-first; reassess with connectivity research.
8. Should voice entry launch with Telugu first? Next release pending real speech recognition accuracy tests.

## Change discipline
Before changing an accepted ADR: record alternative, trade-offs, migration impact, owner sign-off and matching updates to PRD/HLD/LLD/database/API/tests. Avoid silent architecture drift during AI-assisted coding.
