# User Flows

## U1. First-run onboarding
Launch -> language select (native-language labels) -> phone/email sign-up -> verify identity -> owner business name, village, optional address -> dashboard onboarding state with `Add Farmer`, `Add Machinery`, `Add Work`.

## U2. Register farmer
Farmers -> Add Farmer -> name (required), village (required), mobile (optional) -> duplicate warning if match -> confirm/save -> optional `Add Work for this farmer`. Avoid assuming each farmer has a phone.

## U3. Add equipment/service
Machinery -> Add -> name, picture/icon, equipment type, base unit, default rate -> optionally associate tractor + implement as service package -> save. An individual work entry may change rates without changing catalog defaults.

## U4. Record a job
1. Open large `Add Work` button.
2. Choose existing farmer (recent list + search) or quick-add.
3. Choose one or more service lines (rotavator, plough, trolley mud trips etc.).
4. Enter actual work date and location; for each line enter unit (hour/acre/trip/fixed), quantity and selected pricing mode.
5. Show default price; user may override unit rate or enter agreed total. If changed, optionally record why (distance, land condition, negotiation).
6. Readable summary of all lines, totals and farmer name; owner confirms.
7. Save work; offer `Issue Bill` and `Add another work` (create job and invoice are separate backend operations but may be one guided UI flow).

## U5. Invoice issue/share
Work Records -> completed job -> Issue Bill -> server creates immutable invoice snapshot with unique number; preview -> download PDF or system/WhatsApp sharing. Bill includes owner identity, farmer, work date, location, line items, amount due, receipt total, remaining balance, status.

## U6. Partial payments
Payments -> Dues -> search/filter -> select invoice -> display total/paid/due -> enter receipt amount <= due -> payment method/date/reference -> show review modal -> save atomically -> server returns receipt number, new invoice status, farmer balance. If duplicate network request, same idempotency key returns existing receipt, not a second collection.

## U7. One customer, several invoices
Farmer profile -> view linked work/invoices -> click `Collect` -> Payments prefiltered by that farmer -> allocate exact receipt to chosen invoice. MVP **does not** silently apply a single lump payment to multiple invoices; multi-invoice allocation can be a Next feature.

## U8. Equipment-specific dues
Payments -> Equipment filter = Rotavator -> status Pending or Partial -> result shows invoice plus matching service line(s) and remaining balance. If mixed-equipment invoice exists, equipment attribution is based on service-line balance allocation (see Business Rules), not the whole invoice duplicated under every equipment category.

## U9. Corrections
Draft job: edit freely with save confirmation. Issued invoice: no destructive edit; correction/void action creates audit entry and replacement invoice if needed. Receipt correction: reverse receipt with reason and make fresh receipt; no silent overwrite.

## U10. Errors/empty states
- No farmers: illustration + `Add your first farmer` button.
- No machinery: `Add equipment` prompt before job creation.
- No dues: encouraging `All caught up` state.
- Network loss during save: show unsaved state and retry; don't show success until server confirms.
- Permission failure: show safe generic error; do not reveal other business data.
- Invalid amount: prevent negative, zero (for receipts), excess or incorrectly rounded values.
