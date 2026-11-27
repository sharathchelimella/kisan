# Financial Business Rules — Authoritative

**Important:** A financial record is a business ledger, not an editable number in a UI card.

## BR-01 Pricing units
`HOUR`, `ACRE`, `TRIP`, `FIXED` only in MVP. Weekly/monthly apply **only to reports**; no weekly or monthly wage unit. Hours/acre quantities may be decimals; trips are whole numbers.

## BR-02 Custom prices
Default price is a starting suggestion. Owner can override **rate per unit** or **agreed total** for each job service line. Save `pricingMode`, default snapshot, agreed rate (when relevant), final line amount, optional explanation. Changing a catalog rate never affects completed job/invoice snapshots.

## BR-03 Money representation
Store integer paise. Parse user INR amount using decimal arithmetic, reject more than 2 decimal places for amounts, round consistently at line level. Do not use JS `0.1 + 0.2` money math. Totals are sum of saved final line amounts.

## BR-04 Multi-service jobs
A farmer can request multiple distinct services and receive multiple jobs over time. One job can include several service lines; each line has its own charged amount. When tractor + rotavator together represents a single negotiated service, record one billable service line linked to both equipment, not two automatically charged lines.

## BR-05 Invoice status
```text
due = max(0, invoiceTotal - sum(nonreversed allocated receipts))
UNPAID: paid = 0
PARTIAL: 0 < paid < invoiceTotal
PAID: paid = invoiceTotal
VOID: authorized cancellation state (not a payment state)
```
Do not manually toggle invoice status or edit `paid` amount.

## BR-06 Receipts
Every payment creates a separate receipt with farmer, invoice, amount, method, date, actor, timestamp and idempotency key. In MVP a receipt targets **one invoice**; if customer pays ₹5,000 for multiple bills, user must explicitly split into receipts (enhanced multiple-invoice allocation is Next). Never silently apply money to a different invoice.

## BR-07 Overpayment
Reject receipt amount above outstanding (`422` or conflict on changed outstanding). Credit balance/refunds are out of MVP; do not silently turn extra money into negative due.

## BR-08 Atomicity and retries
Receipt creation and balance update in one database transaction; unique idempotency key protects retries; concurrent payments must lock/recheck amount through transaction/optimistic concurrency and return conflict appropriately.

## BR-09 Work-value vs cash receipts
**Work value** = billed value from completed, nonvoid work tied to **work date**. **Collections** = nonreversed receipts tied to **payment date**. **Outstanding** = unpaid balance of all open issued invoices as-of a selected date. For arbitrary date ranges, do not calculate period outstanding as period work value minus period receipts; receipts may relate to older work.

## BR-10 Equipment-wise outstanding
Core rule: **Never duplicate an entire mixed-service invoice in each equipment filter.** To support accurate per-equipment totals either (A) allocate receipts explicitly to invoice lines or (B) use a documented deterministic proportional distribution of outstanding by original line amount. MVP chooses **B for analytics/filter summaries**, with a clear tooltip `Estimated allocation`; invoice-level due remains exact. Example invoice lines Plough ₹3,000, Rotavator ₹2,000, paid ₹2,500, due ₹2,500 => attributed due Plough ₹1,500; Rotavator ₹1,000. Rounding remainder assigned deterministically to the last line. For user collection, show exact invoice due regardless of filter. Future line-level allocations can replace estimate.

## BR-11 Date and report periods
Use business timezone, default Asia/Kolkata. Daily/weekly/monthly reports aggregate activity by explicitly labeled workDate or paymentDate. For as-of reporting, exclude receipts posted after cutoff even if work occurred earlier.

## BR-12 Cancel/void/reverse
- Draft job editable; completed job correction needs version/history.
- Issued invoice immutable; void only with reason and no unreconciled posted receipts (otherwise use refund/reversal workflow).
- Posted receipt cannot be deleted/edited; create reversal linked to original with reason and actor.

## BR-13 Reconciliation
At least daily in production: sum invoice line totals, valid receipt allocations and stored cached balances; alert on invariant failures. Dashboard and PDF must derive from the same authoritative data.

## BR-14 Formula examples
- 3.5 acres × ₹1,700/acre = ₹5,950.
- ₹7,500 invoice; ₹3,000 first receipt; due ₹4,500 -> `PARTIAL`. ₹4,500 later receipt -> due ₹0 -> `PAID`.
- Ramesh has invoices ₹5,950, ₹2,000, ₹3,000 with collections ₹2,000, ₹0, ₹3,000 -> total due ₹5,950.
