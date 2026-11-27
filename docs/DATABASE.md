# Database Design — MongoDB

## Shared conventions
- MongoDB `_id` ObjectId internally; public IDs are opaque identifiers. Every tenant-scoped record has `businessId`.
- All monetary fields: integer **paise** (`Number` safe integer within app bounds, validated). `quantity` stored as decimal string or Decimal128; use a decimal arithmetic library.
- Timestamp fields `createdAt`, `updatedAt` UTC; domain `workDate`/`paymentDate` as business-local date, plus timezone.
- Soft deletion/archival or reversible state for financially referenced entities; never cascade-delete issued invoices/payments.
- Source of truth for invoice payment is receipt allocations/reversals; invoice `paidPaise` may be transactionally maintained cache, reconciled to ledger.

## Collections

### `users`
`{_id, businessId, displayName, email?, mobile?, passwordHash, role:'OWNER', preferredLanguage:'en'|'te'|'hi', createdAt}`. Do not store raw passwords.

### `businesses`
`{_id, name, ownerUserId, phone?, village, address?, timezone:'Asia/Kolkata', invoicePrefix:'KMM', nextInvoiceSequence, createdAt}`.

### `farmers`
`{_id,businessId,name,normalizedName,mobile?,village,notes?,archivedAt?,createdAt,updatedAt}`. Farmer's financial balance is derived, not independently edited.

### `equipment`
`{_id,businessId,name,kind,displayIcon?,serialOrRegistration?,active,createdAt}`.

### `services`
`{_id,businessId,name,unit:'HOUR'|'ACRE'|'TRIP'|'FIXED', defaultRatePaise, equipmentIds:[], active, createdAt,updatedAt}`. Service bundles link equipment explicitly; one billable line represents one charge.

### `jobs`
```json
{
 "_id":"...", "businessId":"...", "farmerId":"...",
 "workDate":"2026-11-24", "village":"Ramapuram", "fieldLocation":"South field",
 "state":"COMPLETED", "notes":"Sandy soil",
 "lines":[{
   "lineId":"uuid", "serviceId":"...", "serviceNameSnapshot":"Rotavator",
   "equipmentIds":["..."], "unit":"ACRE", "quantity":"3.5",
   "pricingMode":"CUSTOM_RATE", "defaultRateSnapshotPaise":150000,
   "agreedRatePaise":170000, "totalPaise":595000, "reason":"Difficult soil"
 }],
 "totalPaise":595000, "invoiceId":null, "completedAt":"...",
 "createdBy":"...", "createdAt":"...", "updatedAt":"..."
}
```

### `invoices`
`{_id,businessId,jobId,invoiceNumber,sequence,issuedAt,workDate,farmerSnapshot:{name,mobile?,village},ownerSnapshot:{name,phone?,address?},lines:[{lineId,serviceId,serviceName,unit,quantity,ratePaise?,amountPaise}],totalPaise,paidPaise,duePaise,lifecycle:'ISSUED'|'VOID',version,voidReason?,createdAt}`.

### `receipts`
`{_id,businessId,invoiceId,farmerId,amountPaise,method:'CASH'|'UPI'|'BANK'|'OTHER',paymentDate,reference?,note?,idempotencyKey,status:'POSTED'|'REVERSED',reversedByReceiptId?,createdBy,createdAt}`.

### `allocations`
`{_id,businessId,receiptId,invoiceId,lineId?,amountPaise,createdAt}`. MVP one receipt -> one invoice; preserve allocation model for future multiple bill settlement.

### `auditEvents`
`{_id,businessId,actorUserId,entityType,entityId,action,reason?,beforeHash?,afterHash?,createdAt,requestId}`. Avoid logging PII payloads.

## Required indexes
- `farmers`: `(businessId,normalizedName)`, `(businessId,mobile)`, `(businessId,village,normalizedName)`.
- `services`: `(businessId,active,name)`.
- `jobs`: `(businessId,workDate desc)`, `(businessId,farmerId,workDate desc)`, `(businessId,lines.serviceId,workDate desc)`.
- `invoices`: unique `(businessId,invoiceNumber)`, unique `(businessId,jobId)` if exactly one invoice/job in MVP, `(businessId,issuedAt desc)`, `(businessId,farmerId/status...)` if farmerId included, `(businessId,lines.serviceId)` for filtering.
- `receipts`: unique `(businessId,idempotencyKey)`, `(businessId,invoiceId,createdAt desc)`, `(businessId,paymentDate desc)`.
- `allocations`: `(businessId,invoiceId)`, `(businessId,receiptId)`.
- `auditEvents`: `(businessId,entityType,entityId,createdAt)`.

## Validation/invariants
- `quantity > 0` for unit-based service; trips integer; amounts nonnegative.
- For issued invoices, `totalPaise = sum(lines.amountPaise)`.
- `0 <= paidPaise <= totalPaise`, `duePaise = totalPaise - paidPaise`.
- Sum valid allocations minus reversals matches paid cache; nightly reconciliation checks.
- Nonvoid issued invoice retains frozen line snapshots regardless of later service edits.
- Tenant IDs in linked records agree, including all nested service/equipment references.

## Data lifecycle and migrations
Versioned schema migrations; seed only demo environments; archive old customers without deleting financial history; encrypted managed backups plus regular restore tests. Use replica set/Atlas deployment supporting transactions.
