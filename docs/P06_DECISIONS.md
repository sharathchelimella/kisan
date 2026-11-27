# P06 Bills & Invoices decisions

Issuance accepts only a completed, unbilled job. The server reads a tenant-scoped work snapshot, verifies that line amounts sum to the stored total, then atomically allocates the next business sequence, creates an immutable invoice snapshot, and marks the job billed. Unique indexes protect the business/sequence, business/number and business/job pairs. Repeated issuance returns the existing invoice. MongoDB transactions require a replica set in a deployed database.

Invoice line names, prices, farmer identity and owner identity are frozen at issuance. The issued amount cannot be edited. An issued invoice with no recorded payments can be voided with a reason; its sequence number remains used. Correction after voiding requires replacement work and a new invoice. Later payment work must prevent voiding when posted receipts exist. The PDF renders amounts from the stored invoice, including paid and due amounts.

DEMO mode starts with two farmers, three jobs (billed, draft, completed), and one unpaid invoice. The unbilled completed job has two service lines and can be used to issue a second invoice. DEMO supports issue, list, detail, print/share and void in page memory. PDF download requires the live API; the DEMO Open PDF action uses browser print. DEMO changes reset on reload.
