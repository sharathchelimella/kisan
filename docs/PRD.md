# Product Requirements Document (PRD)

**ID:** PRD-001 · **Version:** 1.0 · **Status:** Approved working baseline

## 1. Problem
Agricultural machinery owners provide tractor, rotavator, plough, harvester and trolley services to multiple farmers. Manual registers make it hard to track who used which tool, where/when work happened, agreed charges, separate bills, multiple installments, and farmer/equipment-wise outstanding amounts. Existing options may feel difficult to navigate or do not present the dashboard and filters the owner wants.

## 2. Product vision
A **visual, multilingual, mobile-first** digital register and collection assistant for machinery-service owners. A user can record a job with a flexible agreed price, send a clear bill and instantly see money earned, received and left to collect.

## 3. Primary personas
- **Owner/operator:** manages farmers, machinery, jobs, invoices and collections; may have limited literacy or internet access.
- **Helper/employee:** potential future delegated data entry; out of MVP.
- **Farmer/customer:** receives a bill externally (PDF, WhatsApp share sheet); no farmer login in MVP.

## 4. Goals and measurable success
| Goal | Initial target (validate with pilot) |
|---|---|
| Fast job entry | Typical single-service job in <= 60 seconds after onboarding |
| Find farmer | Search and open record in <= 10 seconds |
| Financial trust | 100% correct invoice and balance math for tested scenarios |
| Ease of use | 4/5 pilot users complete common tasks unaided after brief onboarding |
| Mobile usability | Pass touch/readability testing on a 360px Android viewport |
| Collection clarity | See all due bills and filter by equipment within 2 interactions |

## 5. MVP scope / functional requirements
| ID | Requirement | Priority | Acceptance condition |
|---|---|---|---|
| FR-01 | Owner account and business profile | Must | Owner can sign in; records isolated by business |
| FR-02 | Language switch: English/Telugu/Hindi | Must | UI labels, validation and navigation switch; selection persists |
| FR-03 | Farmer directory and profile | Must | Create/edit/search by name/mobile/village; duplicate hints |
| FR-04 | Equipment and service catalog | Must | Configure equipment, optional package, units and default rates |
| FR-05 | Job entry wizard | Must | Select farmer, service(s), date, location and quantity |
| FR-06 | Variable job-specific price | Must | Choose default, override unit rate or enter agreed line total; freeze snapshot |
| FR-07 | Work records | Must | Search/sort/filter job history; preserve revisions |
| FR-08 | Invoice issuance | Must | Unique sequential invoice number per business; line items and PDF |
| FR-09 | Bill listing / sharing | Must | Search and filter; download/print and use native share/WhatsApp link |
| FR-10 | Partial/full payment entry | Must | Accept multiple receipts; cannot exceed open invoice balance without explicit credit handling |
| FR-11 | Outstanding collection | Must | Filter due invoices by farmer, tool/service, village, date and status |
| FR-12 | Dashboard summary | Must | Work value, collected, current dues, farmer count, completed jobs, recent events |
| FR-13 | Reports | Must | Daily/weekly/monthly/custom-period work value, receipts and equipment-wise results |
| FR-14 | Corrections and audit trail | Must | Issued invoice edits handled via revision/void workflow; payments via reversal |
| FR-15 | Responsive usability | Must | Mobile-first, semantic inputs and large accessible controls |

## 6. Release boundaries
**MVP:** authenticated responsive web app (installable PWA optional until offline is robust), owner-managed customer and service data, jobs, PDF bills, allocated payments, filtered collections, reports, multilingual UI.  
**Next:** offline write/sync, voice entry, automatic reminders, expense/maintenance ledger, employee roles, real WhatsApp Business messaging integration, SMS integrations.  
**Not MVP:** marketplace for machinery rental discovery, farmer self-service accounts, payment processing/gateway, GST tax engine, loans, ERP inventory and GPS tracking.

## 7. Nonfunctional requirements
- 360px mobile viewport support; desktop dashboard at >=1024px.
- Buttons/touch targets >=48×48 CSS px; text labels accompany icons; no meaning conveyed only with color.
- Aim for <= 2.5s initial meaningful render on typical mid-range Android over 4G (performance budget, not guarantee).
- Money represented in **integer paise** (not binary floats); configurable INR formatting; input validation and server-side authoritative calculation.
- Financial mutations atomic/idempotent; retries must not duplicate invoices or payments.
- Sensitive owner/farmer information protected in storage, transport, logs and exports.
- No invented invoice amounts or dates; offline input explicitly marked unsynced until confirmed by server.

## 8. Detailed feature ownership
| Page | Sole primary owner of operations |
|---|---|
| Dashboard | Financial *summary* and deep links only |
| Farmers | Farmer CRUD, profile/contact lookup |
| Machinery & Tools | Equipment/service setup and default pricing |
| Add Work | Job creation wizard and price agreement |
| Work Records | Work search, details, correction workflow |
| Bills & Invoices | Invoice issuance/history/preview/download/share |
| Payments | Receipt entry, invoice allocation, dues and payment history |
| Reports & Analytics | Detailed charts, trends and exports |
| Settings | Business identity, language, user preferences |

A summary value can appear in many places, but it must come from the same source of truth. Do not repeat editable forms or copies of financial business logic.

## 9. Representative acceptance journeys
1. Owner signs in, adds farmer Ramesh with village and mobile, selects rotavator, records 3.5 acres at custom ₹1,700/acre and generates an invoice for ₹5,950.
2. Owner receives ₹2,000 cash, records a receipt; invoice remains `PARTIAL`, balance ₹3,950. Later receives ₹3,950 by UPI; balance becomes ₹0, invoice `PAID`.
3. Ramesh requests a trolley job and a plough job on separate dates; each job retains separate service lines and invoice while his profile aggregates balances.
4. Owner filters pending payments for `Rotavator` only; app shows due invoices with rotavator service lines and accurate totals without double counting combined services.
5. Owner changes default rotavator rate; issued invoices retain old agreed rate and quantity.
6. Owner picks `This Month` report; *work value* follows completed-job dates and *collected* follows payment dates; displays both dimensions clearly rather than pretending they are identical.

## 10. Risks / mitigations
- Variable local language terms: pilot with actual owners; translations reviewed by native speakers.
- Weak connectivity: launch online-first with clear failures; enable offline financial writes only with sync/idempotency tests.
- Complex combined jobs: normalize service lines, assign revenue to explicit line items.
- User error in cash collection: require confirmation with amount, farmer, invoice and remaining balance; implement reversal audit.
- PDF compliance/taxes: keep invoice template simple initially; tax/GST feature requires local compliance review before launch.

## 11. Product acceptance gate
MVP is not complete until all Must features have tests, core financial reconciliation passes, mobile usability pilot succeeds, and audit/backup/recovery processes are documented.
