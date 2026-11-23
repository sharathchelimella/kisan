# Domain Glossary

| Term | Meaning |
|---|---|
| Business/Owner | One account-controlled service business, owner of all scoped records |
| Farmer | Customer commissioning machinery services |
| Equipment | Physical tractor, trolley, rotavator, plough, harvester etc. |
| Service Catalog Item | Billable operation with unit and default rate, optionally involving multiple equipment items |
| Job / Work Record | One visit/booking/service event for a farmer, with date/location and lines |
| Job Line | One service within a job; own quantity, unit, agreed price and equipment mapping |
| Default Rate | Suggested catalog price; does not change historical job prices |
| Agreed Rate | Price per unit accepted for a specific job line |
| Agreed Line Amount | Final frozen monetary amount for that line (unit rate × quantity or fixed custom override) |
| Invoice / Bill | Numbered financial demand for payment against one or more job lines |
| Receipt / Payment | Actual collection record (cash, UPI, bank) from a farmer |
| Allocation | Portion of a payment applied to a specific invoice or line; MVP uses one invoice per receipt |
| Outstanding / Due | Invoice total minus allocated, nonreversed payments |
| Paid | Remaining due = zero |
| Partially paid | Some payment received but balance remains |
| Unpaid | No nonreversed payment allocated |
| Work value | Value of completed/issued work attributed by work completion date |
| Collections | Receipts posted during selected period, regardless of job date |
| Report period | Day, week, month or custom date range; **not** a wage/pricing unit |
| Machinery revenue | Value of explicitly tagged service lines; cannot count an invoice twice |
| Void | Invalidate an erroneous invoice with auditable reason |
| Reversal | Compensating entry for an incorrect receipt, with audit reference |
| Business date | Date interpreted in business timezone (default Asia/Kolkata; configurable) |
