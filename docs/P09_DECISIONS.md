# P09 Reports & Analytics decisions

The report endpoint reads tenant-scoped jobs, invoices, receipts and equipment names, then produces one typed report for the chart, tables and CSV. Work value uses workDate and frozen job line amounts. Collections use paymentDate and nonreversed receipts. Outstanding is calculated separately from issued invoices and receipts through the requested as-of date. It is not work value minus period collections.

Equipment attribution splits each line equally among its linked equipment IDs, with integer paise remainders assigned in sorted order. Receipt and due attribution first splits an invoice amount proportionally by line amount, then by equipment. This keeps mixed-service and package totals from being counted in full for every machine. Service rows count distinct jobs containing the service. No utilization rate is shown because machine operating hours and capacity are not captured reliably.

The export includes the same summary, series, service, equipment and method amounts returned to the UI, in integer paise. CSV uses a UTF-8 BOM for spreadsheet compatibility. Date ranges are inclusive and limited to five years. Historical void timing remains approximate until invoice void timestamps are stored. DEMO reports use a standalone fixture matching the initial sample work and invoice, and do not recalculate after page-memory actions elsewhere.
