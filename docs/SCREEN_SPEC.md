# Screen-by-Screen UI Specification

**Navigation order** (single ownership): Dashboard -> Farmers -> Machinery & Tools -> Add Work -> Work Records -> Bills & Invoices -> Payments -> Reports & Analytics -> Settings.

## Global shell
- Logo and dark-green sidebar (desktop); bottom nav (mobile); top bar with language, notifications, profile.
- Context breadcrumb/back; synchronized filter state where appropriate; no redundant nested sidebar.
- All values from API/store, not hardcoded screenshot sample amounts.

## 1. Dashboard (`/dashboard`)
**Owner:** summary only.  
**Sections:** heading `Business Overview`; date filter; prominent KPI cards (completed work value, collections, outstanding, total farmers, completed jobs); compact latest-activity feed; three quick links `Add Work`, `Farmers`, `Payments`; optional today snapshot.  
**Do not add:** revenue analytics charts, machinery CRUD, detailed unpaid table, receipt entry. Those belong elsewhere.  
**Empty state:** `Record your first job` with CTA.  
**Mobile:** stack 2-column mini-KPIs with readable labels and one-column action cards.

## 2. Farmers (`/farmers`, `/farmers/:id`)
**Owner:** farmer CRUD and identity.  
**Sections:** Add Farmer, name/mobile/village search, village filter, directory table on desktop and list cards on mobile; farmer profile with contact details and links to scoped Work Records / Payments / Bills.  
**Forms:** name required, village required, phone optional; duplicate check.  
**Do not add:** inline receipt form or new job form. Route to respective page with farmer preselected.

## 3. Machinery & Tools (`/machinery`)
**Owner:** catalog and default rates.  
**Sections:** equipment picture/name, service type/unit/rate, active indicator, add/edit modal, packages/linked equipment.  
**Do not add:** machine revenue analytics or equipment dues list.  
**Mobile:** large pictorial equipment cards and a large `Add Equipment` button.

## 4. Add Work (`/jobs/new`)
**Owner:** create work and freeze agreed prices.  
**Wizard:** (1) choose farmer (2) choose service line(s)/equipment (3) date, village/field, quantity and rate mode (4) review/final confirm; show saved state with `Issue Bill`.  
**Pricing variants:** default unit rate, custom unit rate, explicit agreed line total. Allow decimal acres/hours, integer trips.  
**Review:** each line quantity × rate or agreed total; no automatic charge duplication for tractor + implement packages.  
**Do not add:** work-history table, invoice list, payment history.

## 5. Work Records (`/jobs`, `/jobs/:id`)
**Owner:** find completed/draft/cancelled jobs and permitted corrections.  
**Sections:** search job/farmer, date/village/equipment/status filters, sortable history, job detail, controlled edit/void and `Issue Bill` link.  
**Do not add:** bill PDF creation forms or actual payment entry.

## 6. Bills & Invoices (`/invoices`, `/invoices/:id`)
**Owner:** invoice records, preview, PDF/print/share.  
**Sections:** unique bill numbers, all/paid/partial/unpaid filters, search number/farmer, date/equipment filters, invoice detail drawer, work line table, totals, paid, balance, issue/share actions.  
**Do not add:** receipt form; optional `Collect Payment` deep link routes to Payments preselected.  
**Invariant:** issued invoice preserves original rates, line amounts, date and identity snapshots; subsequent receipts update live paid/balance only.

## 7. Payments (`/payments`)
**Owner:** due collection and receipt history.  
**Sections:** dues list, search, filters (farmer/village/equipment/date/Unpaid/Partial/Paid), due details, `Collect` form and history table. Form shows invoice total/paid/balance, receipt amount, method (cash/UPI/bank), date, optional notes, confirmation.  
**Special:** equipment-wise dues filter must never double count combined invoice.  
**Do not add:** separate report charts or farmer editing.

## 8. Reports & Analytics (`/reports`)
**Owner:** detailed aggregated analysis.  
**Tabs:** Revenue, Machinery, Collections, Work Volume; date range day/week/month/custom. Charts: work value vs receipts by period; equipment-wise line value; collections by equipment; work count by service; CSV exports.  
**Do not add:** duplicate dashboard summary grid (limited context totals in chart annotations acceptable).

## 9. Settings (`/settings`)
**Owner:** company profile/business name/contact/address, preferred language, bill numbering/prefix, business timezone, text-size, notification choices, secure logout, export account data.  
**Do not add:** equipment rate editing or farmer details.

## Navigation intents
- Dashboard `Amount to Collect` -> `/payments?status=outstanding`.
- Farmers `Add Work` -> `/jobs/new?farmerId=...`.
- Work Record `Issue Bill` -> `/invoices/new?jobId=...` (action can be invoked from its page; server validates draft/unbilled state).
- Bills `Collect` -> `/payments?invoiceId=...`.
- Reports equipment bars -> `/payments?equipmentId=...` only if user chooses to inspect dues; drill-down retains filter and does not duplicate the payment screen.

## UI state checklist for each page
Loading, populated, empty, filtered-empty, network error, authorization failure, save-in-progress, save-success, invalid input and mobile overflow. Screen review must include long Telugu/Hindi text.
