# LLD — Low-Level Design

## 1. Monorepo structure
```text
apps/
  web/src/{app,pages,features,components,styles,i18n,lib}
  api/src/{app,middleware,modules,db,lib,jobs}
packages/
  shared/{schemas,types,constants}
docs/  (this documentation pack)
```

## 2. Module layering
For each API domain: `routes.ts -> controller.ts -> service.ts -> repository.ts -> MongoDB`. Controllers parse/validate, services implement business rules and transactions, repositories always scope by `businessId`. Keep PDF generation separate from payment write logic.

## 3. Core document lifecycle
- **Job:** `DRAFT -> COMPLETED -> BILLED`; `CANCELLED` allowed before issue with reason. A completed job price is frozen.
- **Invoice:** `DRAFT -> ISSUED -> PAID` computed by balance; `VOID` requires authorization/reason and restrictions on already-paid invoices.
- **Receipt:** `POSTED -> REVERSED`, reversal references original, reason and actor.

### Job total pseudocode
```text
for each service line:
  if pricingMode = CUSTOM_TOTAL: validate agreedTotalPaise >= 0
  else: compute quantityDecimal * agreedRatePaise using decimal-safe arithmetic
  round once at line level to nearest paise using consistent policy
jobTotalPaise = sum(lineTotalPaise)
```
Quantity may be decimal for acre/hour, integral for trip. No floating-point money computations in JS.

### Invoice issue transaction
1. Validate authenticated business and completed, unbilled job.
2. Validate lines and snapshots; reject invalid/negative totals.
3. Transaction: atomically increment per-business invoice sequence; create invoice with frozen line snapshots; mark job billed; create audit event.
4. Return invoice and number; retry uses idempotency key.

### Receipt entry transaction
1. Validate invoice belongs to authenticated business, issued and not void.
2. Parse amount integer paise > 0; validate <= outstanding as of transaction.
3. Enforce unique receipt idempotency key.
4. Transaction: insert receipt, insert invoice allocation, update invoice paid snapshot/ledger aggregate, append audit event.
5. Return current paid, remaining and derived status; invalidate dashboard, invoice, customer and report queries.

### Receipt reversal
1. Verify role/ownership and posted original receipt.
2. Require reason, reference original receipt.
3. Transactionally add reversal, change receipt status and update allocation sums; keep historical record.
4. Show updated invoice due; no deletion of original ledger evidence.

## 4. Status derivation
```text
if invoice.lifecycle = VOID -> VOID
else if paidPaise == 0 -> UNPAID
else if paidPaise < invoice.totalPaise -> PARTIAL
else if paidPaise == invoice.totalPaise -> PAID
else -> invariant violation
```
Do not store separate independently-editable status fields.

## 5. Reports and query correctness
- `GET /reports/dashboard?asOf=...` returns current overall balance and period-specific work/collection totals, with explicit field names.
- `GET /reports/equipment?...` uses job-line aggregation grouped by service ID or equipment ID, with a single attribution policy. For packages choose one primary reporting category or explicitly split amount by service lines; never count same amount twice.
- Date filtering accepts inclusive local-date start and exclusive next-day end converted to UTC using business timezone.

## 6. Frontend data flows
- App shell owns navigation, language and session.
- TanStack Query keys include business context, filters and pagination, e.g. `['invoices',businessId,{status,equipmentId,page}]`.
- `AddWorkWizard`: local draft state; state persists between steps; save mutation returns `jobId`, then guided invoice issue action.
- `ReceiptForm`: server-calculated balance displayed and refreshed immediately before submit; conflict (`409`) triggers refresh and explanation.
- Filters represented in URL search params; clearing a filter updates route and query.

## 7. Failure modes
| Scenario | Handling |
|---|---|
| Concurrent receipts against same invoice | database transaction + balance check, one conflict response |
| Network timeout after payment success | retry same idempotency key; return same receipt |
| PDF rendering failure | invoice remains issued; allow retry of PDF generation |
| Duplicate farmer warning | soft warning, not unconditional block; two farmers may share phone |
| Unauthorized entity ID | respond 404 or 403 without disclosing other business |
| Invalid custom total | inline form validation and server 422 |
| Invoice with partial payment needs correction | authorized reversal/credit/refund workflow, not silent edit |

## 8. Example response DTO
```json
{
  "invoiceId": "inv_abc",
  "invoiceNumber": "KMM-2026-00042",
  "totalPaise": 595000,
  "paidPaise": 200000,
  "duePaise": 395000,
  "status": "PARTIAL"
}
```
