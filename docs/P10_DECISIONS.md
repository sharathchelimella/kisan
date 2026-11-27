# P10 Settings decisions

Settings reads and updates tenant-scoped owner and business records. Business name, village, phone, address, owner name/mobile, preferred language, notification opt-in and text size are editable. Invoice prefix, next sequence and timezone are read-only because prefix changes need safe numbering rules. Business contact fields are used only when a future invoice snapshot is issued; already-issued invoices remain immutable.

The language picker persists through the existing local language preference; saving Settings also updates the owner preference on the server. Large text is stored on the owner and applied locally on reload. Notification opt-in is stored as a preference; sending reminders is outside this phase. DEMO settings persist in the browser's local storage for checking the flow without a database.
