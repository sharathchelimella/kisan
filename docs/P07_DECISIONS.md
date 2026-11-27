# P07 Payments decisions

Posting a receipt requires a stable `Idempotency-Key` header. The server validates a positive amount, atomically reduces the invoice due, inserts an immutable receipt and allocation, and rejects overpayment. A repeated key returns the existing receipt; reusing a key with different input is a conflict. MongoDB transactions require a replica set. Receipts are never deleted; reversal marks a receipt and allocation reversed with actor, time and reason, and restores the invoice due in one transaction.

Equipment-filtered dues split an invoice's due proportionally across its lines, then equally across each line's equipment IDs. Integer paise remainders go to the last line and equipment in sorted order. The filter shows an estimated equipment share while the collection form uses the exact invoice due. This prevents a mixed-service invoice from being counted in full for every equipment filter.

The DEMO Payments page starts from the sample unpaid invoice. DEMO receipts and reversals are held in page memory and reset on reload.
