# Reusable React Components & Contracts

## Architecture
`src/components/{layout,common,farmer,machinery,job,invoice,payment,report}`; `src/pages/*`; `src/features/*` for hooks/services; `src/i18n/*`; `src/lib/{money,dates,api}`.

## Shared components
| Component | Props / expected behavior |
|---|---|
| `AppShell` | `children`, current route; responsive nav/top bar |
| `SidebarNav` / `BottomNav` | active route, accessible links; 5-tab mobile layout |
| `PageHeader` | title, description, optional action and breadcrumb |
| `Button` | variant, loading, disabled, onClick; min 48px touch target |
| `Amount` | integer paise, `currency='INR'`, format with Intl |
| `MoneySummaryCard` | label, amount, optional icon and link; used only dashboard/context summaries |
| `StatusBadge` | derived status (`UNPAID`, `PARTIAL`, `PAID`, `VOID`), icon+word |
| `SearchField` | controlled value, debounce, clear, accessible label |
| `FilterBar` | schema-defined filters and reset; route-query persistence |
| `DataTable` | desktop sorting/pagination, mobile card alternative |
| `ConfirmDialog` | action, warnings, cancel/confirm; focus trap |
| `FormField` | label, error, hint, input ID and aria-describedby |
| `EmptyState` | simple text, illustration, single CTA |
| `SyncIndicator` | next-release offline state only; not misleading if unsupported |

## Domain components
| Component | Page owner | Contract |
|---|---|---|
| `FarmerSearchList` | Farmers / wizard picker | `query, onSelect, recentFarmerIds` |
| `FarmerForm` | Farmers | `initialValues, onSubmit`; dedupe warnings |
| `EquipmentCard` | Machinery / wizard selection | `equipment, isSelected, onSelect` |
| `PricingEditor` | Add Work | `unit, quantity, defaultRatePaise, mode, agreedRatePaise, agreedTotalPaise, onChange`; returns exact derived amount |
| `JobWizard` | Add Work | `initialFarmerId, initialLines, onSave`, guarded steps |
| `JobLineSummary` | Add Work / Job detail | read-only line and amounts |
| `InvoicePreview` | Bills | immutable invoice snapshot + live receipt totals |
| `InvoiceList` | Bills | query results, sort/pagination/filter |
| `ReceiptForm` | Payments only | `invoiceId, duePaise, onSubmit`, idempotency key |
| `DueList` | Payments only | filters; equipment line attribution |
| `PaymentHistory` | Payments | reversals visibly annotated |
| `RevenueChart` | Reports | dates, series, tooltip, accessible table fallback |

## Patterns
- Presentational components should not fetch from API directly; feature hooks own data queries.
- Money math stays in one shared financial module and is still validated server-side; never duplicate logic in component render.
- `useTranslation()` for all UI strings; never include fixed copy in reusable component internals beyond i18n keys.
- React Hook Form + Zod for validation; TanStack Query for server data; React Router route params and search params for filters.
- Show an explicit reviewed amount before mutation; disable submit while pending; on error retain input.

## Sample TypeScript model (recommended even if starting with JSX)
```ts
type PricingUnit = 'HOUR' | 'ACRE' | 'TRIP' | 'FIXED';
type PricingMode = 'DEFAULT' | 'CUSTOM_RATE' | 'CUSTOM_TOTAL';
interface WorkLineInput {
  serviceId: string;
  equipmentIds: string[];
  unit: PricingUnit;
  quantity: string; // decimal as string, validated server-side
  pricingMode: PricingMode;
  agreedRatePaise?: number;
  agreedTotalPaise?: number;
}
```

## Storybook/test cases
Include standard, loading, empty, error, mobile, large font, Telugu, Hindi and zero-balance variants. For invoices and receipts test negative, 0, overpayment and unexpected `null` input.
