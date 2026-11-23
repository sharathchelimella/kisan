# Kisan Machinery Manager — AI Development Documentation

**Status:** Baseline specification v1.0 (2026-11-24)  
**Audience:** product owner, UI designer, MERN developer, coding agents, QA  
**Product:** Mobile-first multilingual agricultural machinery service business SaaS for Indian equipment owners.

## Start here
1. Read [`01-product/PRD.md`](01-product/PRD.md) for goals, scope, workflows and acceptance criteria.
2. Read [`02-design/DESIGN_MDR.md`](02-design/DESIGN_MDR.md) and [`02-design/SCREEN_SPEC.md`](02-design/SCREEN_SPEC.md) before designing or coding UI. They preserve the user's approved green-and-white SaaS visual direction.
3. Read [`03-architecture/HLD.md`](03-architecture/HLD.md), [`03-architecture/LLD.md`](03-architecture/LLD.md), [`03-architecture/DATABASE.md`](03-architecture/DATABASE.md), and [`03-architecture/API.md`](03-architecture/API.md) before backend development.
4. Apply [`04-engineering/BUSINESS_RULES.md`](04-engineering/BUSINESS_RULES.md), [`04-engineering/SECURITY.md`](04-engineering/SECURITY.md), and [`04-engineering/TEST_PLAN.md`](04-engineering/TEST_PLAN.md) on every relevant feature.
5. Execute in order using [`05-delivery/ROADMAP.md`](05-delivery/ROADMAP.md), [`05-delivery/BACKLOG.md`](05-delivery/BACKLOG.md), and [`06-ai/AGENTS.md`](06-ai/AGENTS.md).

## Documentation map

| Document | Role |
|---|---|
| `01-product/PRD.md` | Product requirements and acceptance criteria |
| `01-product/USER_FLOWS.md` | Real owner workflows and edge cases |
| `01-product/GLOSSARY.md` | Shared meaning of job, service, invoice, collections |
| `02-design/DESIGN_MDR.md` | **MDR = Master Design Requirements**; design tokens, accessibility and UI conventions |
| `02-design/SCREEN_SPEC.md` | Page-by-page UI content with no duplicated ownership |
| `02-design/COMPONENTS.md` | Reusable React components and interaction contracts |
| `03-architecture/HLD.md` | High-level design: systems, integrations, deployment |
| `03-architecture/LLD.md` | Low-level design: services, events, state and algorithms |
| `03-architecture/DATABASE.md` | MongoDB collections, indexes, invariants |
| `03-architecture/API.md` | Versioned REST endpoint contracts |
| `04-engineering/BUSINESS_RULES.md` | Pricing, invoices, receipts, allocations, totals |
| `04-engineering/SECURITY.md` | Authentication, authorization, privacy, backups |
| `04-engineering/TEST_PLAN.md` | Testing layers and acceptance scenarios |
| `05-delivery/ROADMAP.md` | MVP phases, milestones and exit criteria |
| `05-delivery/BACKLOG.md` | Prioritized work items with traceable IDs |
| `06-ai/AGENTS.md` | Repository coding-agent instructions |
| `06-ai/PROMPTS.md` | Ready-to-copy prompts for AI coding sessions |
| `06-ai/DECISIONS.md` | ADRs, defaults and questions needing validation |
| `06-ai/DOCUMENT_CHANGELOG.md` | Documentation updates |

## Key agreements
- **Only one owner per business in MVP;** each business's data is isolated by `businessId`.
- Pricing is **per hour, per acre, per trip, or custom agreed amount**. Weekly/monthly are **report periods, not wage units**.
- An owner can register many tractors/implements and one farmer can commission many jobs. A job may include multiple service lines.
- A default service rate never overwrites a job's **frozen agreed rate/amount**.
- Payments can be partial and repeated; invoice status is derived from allocated payments; customer-level totals aggregate invoices.
- Separate *total completed work value*, *payments received*, and *outstanding balance* without double counting.
- **No feature ownership duplication:** screen links and summary cards are allowed, but CRUD/entry flows live in their assigned page.
- Product language options: **Telugu, Hindi, English**. Must be usable by people with limited literacy: large touch targets, pictorial equipment, plain-language confirmations.

## Scope labels
`MVP`: committed first production release; `Next`: future enhancement; `Optional`: user choice after field validation. Feature suggestions do **not** imply they are built.

## Notes on visuals
The user provided six example screenshots for Dashboard, Farmers, Add Work, Bills, Payments and Reports. They establish **design direction**, not pixel-perfect source files. Other pages should match the same component system. These Markdown documents are authoritative for feature placement and financial rules; images are styling references. A screenshot's sample numbers and dates are illustrative, not business requirements.

## Definition of ready
Before coding a feature: identify backlog ID, component, routes, API, data model, acceptance tests, empty/loading/error states, and authorization boundary. An AI agent must avoid inventing interfaces without documenting changes.
