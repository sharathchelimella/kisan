# P08 Dashboard decisions

The dashboard reads a single tenant-scoped summary endpoint. Completed work value uses job work dates; collections use receipt payment dates; outstanding is independently calculated from issued invoice amounts and receipts posted as of the selected date. The page labels the outstanding as-of date and avoids showing a detailed payments list or analytics chart. The empty state links to Add Work.

Recent activity combines up to five work, invoice and receipt events. The DEMO adapter uses one aggregate fixture and returns an empty period when outside its sample dates. The live repository treats the business day boundary as Asia/Kolkata. Historical as-of values for invoices voided later cannot be reconstructed until invoice void timestamps are stored; current-date outstanding remains authoritative.
