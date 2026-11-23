# Test Strategy and Acceptance Matrix

## Levels
- **Unit:** money rounding, pricing mode, invoice total, payment status, equipment attribution, date-period boundaries.
- **Component:** React forms, translations, disabled submit, keyboard/touch and empty states.
- **API integration:** CRUD, isolation, validation, PDF, pagination and query filters.
- **End-to-end:** pilot scenarios through UI and real staging backend.
- **Concurrency:** two simultaneous receipts, retry after timeout, duplicate clicks.
- **Nonfunctional:** mobile responsiveness, slow network, security, backups and restore.

## Must-pass scenarios
| ID | Setup / action | Expected |
|---|---|---|
| T-01 | Create farmer name/village, no phone | Success, contact optional |
| T-02 | Search farmer by partial name, number and village | Only matching business records |
| T-03 | 3.5 acres × ₹1,700 custom rate | Bill line ₹5,950 |
| T-04 | Change equipment default price after invoice | Old invoice unchanged |
| T-05 | 2 trolley trips × ₹500 | ₹1,000, quantity integer enforced |
| T-06 | Multi-service invoice lines sum | Grand total equals line sum |
| T-07 | ₹7,500 invoice, ₹3,000 receipt | Paid ₹3,000 / due ₹4,500 / PARTIAL |
| T-08 | Second ₹4,500 receipt | Paid ₹7,500 / due ₹0 / PAID |
| T-09 | Retry same receipt request+idempotency key | Single receipt recorded |
| T-10 | Concurrent receipts exceed remaining due | One succeeds; other conflict/rejected; never negative due |
| T-11 | Reversal of posted receipt | Audit retained; due increases correctly |
| T-12 | Farmer with three jobs/invoices | Profile reflects accurate distinct and aggregate histories |
| T-13 | Equipment due filter on mixed invoice | Amount never duplicated across equipment |
| T-14 | Work in October paid in November | October work value, November collection; no November work inflation |
| T-15 | Invoice PDF print/share | Accurate names, amounts, status and number |
| T-16 | Owner A requests Owner B farmer/invoice ID | Denied, no leaked data |
| T-17 | Telugu/Hindi string expansion on 360px width | No overlap, essential buttons reachable |
| T-18 | Save fails due to network | User sees failure/retry, no false success |
| T-19 | Search and filter 1000 farmers | Paginated, responsive and usable |
| T-20 | Archive customer with issued invoices | Financial records preserved |

## Test data factories
Make isolated fixtures: business A and B, 10 farmers, 5 services, 15 jobs, 15 invoices, partial/full receipts, multi-service invoice, reversed receipt, long Unicode names, zero dues, cross-business ID.

## UI test snapshots
At 360×800, 390×844, 768×1024 and 1440×900. Test English/Telugu/Hindi, 200% zoom, dark OS preference if supported, keyboard focus and screen-reader labels.

## Performance targets (pilot budgets)
- Main mobile screen usable under ~2.5s for typical 4G midrange hardware.
- Search response perceived <=300ms where data local, reasonable remote debounce.
- Page size 20 by default; no unbounded tables.

## Exit gate
All T-01..T-20 pass on staging, no critical/high security findings, invoice/receipt reconciliation succeeds, restore tested, pilot users complete priority flows with minimal help.
