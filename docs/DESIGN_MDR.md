# MDR — Master Design Requirements

**MDR means Master Design Requirements** in this pack (the user's request repeated "MDR"; we use one unambiguous design source). Corresponding implementation details live in SCREEN_SPEC and COMPONENTS.

## 1. Approved references
Six screenshot examples supplied by the user: **Dashboard, Farmers Management, Add Work, Bills & Invoices, Payments, Reports & Analytics**. Adopt their shared identity: professional green/white SaaS, agricultural icons and illustrations, left desktop sidebar, airy rounded cards, rich table organization, clear statuses and work wizard progress. Do **not** replicate duplicate financial cards/tables across unrelated pages; use final 9-page ownership map.

## 2. Design language
| Token | Value | Use |
|---|---|---|
| `--green-950` | `#064D2E` | Desktop sidebar, brand |
| `--green-700` | `#16803D` | Primary actions, active UI |
| `--green-100` | `#E8F5EA` | Selected row, helpful info |
| `--surface` | `#FFFFFF` | Main cards |
| `--canvas` | `#F5F7F6` | Page background |
| `--text` | `#1F3025` | Primary readable text |
| `--muted` | `#66766C` | Supporting labels |
| `--border` | `#DDE7DF` | Dividers/form borders |
| `--success` | `#16803D` | Paid, valid confirmation |
| `--warning` | `#A96A06` | Partial payment |
| `--danger` | `#B42332` | Unpaid and errors |

Check contrast before shipping; exact colors may be adjusted for WCAG readability while keeping visual identity.

## 3. Layout
- **Desktop >=1024px:** 248–268px fixed dark-green left sidebar; top utility header; maximum content width 1440px; cards in 12-column responsive grid.
- **Tablet 600–1023px:** compact navigation and 2-column layout where readable.
- **Mobile 320–599px:** fixed bottom navigation: Home, Farmers, prominent Add Work, Payments, More. Bills/Machinery/Reports/Settings in More. Single-column forms with sticky action footer; no tiny desktop tables without card equivalents.
- Minimum interactive touch target 48×48 CSS px, primary button height >=52px.
- Grid spacing: 8px increments; card radius 12–16px; section gaps ~24px; shadow subtle.

## 4. Typography and icons
- English: Inter or Manrope; Telugu: Noto Sans Telugu; Hindi: Noto Sans Devanagari (do not embed font binaries in design docs).
- Body 16px minimum for primary mobile content; supporting text at least 14px where practical; headings 22–28px; monetary headline 26–32px.
- Lucide style consistent stroke; all important icons paired with labels. Machinery uses recognizable thumbnails, not icon-only cryptic controls.
- INR shown as `₹1,500`, no ambiguous decimals; quantity may contain decimals (`3.5 acres`).

## 5. Accessibility and low-literacy UX
- Simple labels: `Money to Collect`, `Add Work`, `Paid`, `Partially Paid`; avoid accounting jargon.
- Farmer lookup supports recent farmers, large searchable cards and phone lookup; not just an alphabetic dropdown.
- Add Work uses steps with visible progress and summary; step back does not erase entered values.
- Read amounts aloud only if opt-in; voice input is Next scope, with review before financial save.
- Color is supplemental: statuses include words and icons. All forms have labels and clear errors. Keyboard and screen-reader semantics matter.
- Responsive translation: all strings via i18n keys, not string concatenation; test Telugu/Hindi wrapping.
- Destructive operations require explicit, plainly worded confirmation; provide feedback on successful saves and failures.

## 6. Shared interaction patterns
- Primary action: solid green button with text and optional icon; disabled state visually distinct.
- List controls: one search, context-specific filters, sort, pagination; no duplicate search bar at top and within table.
- Financial summaries: dashboard owns totals; invoices/payments show only context-needed amounts.
- Empty states: tell user what is missing and provide one clear next action.
- Loading: skeletons for lists; show saving spinner and disable double submit.
- Errors: local field errors plus optional global banner; never lose form inputs.
- Toaster after save + confirmation details; avoid success until API confirms.

## 7. Screenshots are not requirements for sample data
Names, locations, dates, amounts, percentages and decorative illustrations in references are visual placeholders only. Real displayed figures come from validated business data. Do not show 2025 demo dates as live values.

## 8. UI acceptance
- Baseline screenshots (360px and 1440px) for every major page.
- No sideways scroll for standard mobile actions (tables convert to cards).
- 200% text zoom remains usable.
- One customer can be found and a new work record added without advanced computer knowledge.
- Distinct payment states readable without color perception.
