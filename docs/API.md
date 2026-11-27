# REST API Specification (v1)

Base: `/api/v1` Ã‚Â· JSON Ã‚Â· session cookie authentication Ã‚Â· UTC timestamps and business-local dates. All endpoints automatically filter by authenticated `businessId`. Write APIs validate with shared schemas; return consistent error payload.

## Common response patterns
```json
{"data":{},"meta":{"requestId":"req-123"}}
```
```json
{"error":{"code":"VALIDATION_ERROR","message":"Check the entered details","fields":{"amountPaise":"Must be greater than zero"}},"requestId":"req-123"}
```
List endpoints use `page`, `pageSize` (default 20, max 100) or cursor if supported; filters explicit. Don't send `businessId` to clients as a writable field.

## Authentication
| Method | Path | Behavior |
|---|---|---|
| POST | `/auth/register` | Create owner/business after verification |
| POST | `/auth/login` | Start session |
| POST | `/auth/logout` | End session |
| GET | `/auth/me` | Current owner, business, language |
| POST | `/auth/forgot-password` | Rate-limited recovery |

### P01 owner session contract

Auth POST requests send JSON and the `X-Kisan-Request: 1` header. Use the same origin as the web app. Auth responses include `Cache-Control: no-store`.

- `POST /auth/register` takes `email`, `password` (12Ã¢â‚¬â€œ128 characters), `displayName`, `businessName`, `village`, `preferredLanguage` and `verificationCode`. A valid email-bound code creates the owner and business and returns `201` with `data.registered: true`.
- `POST /auth/login` takes `email` and `password`, returns the public `Session` DTO and sets the HttpOnly session cookie. Incorrect credentials return the same `401` response for known and unknown accounts.
- `GET /auth/me` requires a current session and returns its public owner and business DTOs.
- `POST /auth/logout` revokes the server-side session and clears the cookie. Success returns `data.signedOut: true`.
- `POST /auth/forgot-password` takes `email` and returns the same `202` response across accounts. P01 runs no recovery delivery or password mutation. See [P01 decisions](P01_DECISIONS.md).

## Farmers
| Method | Path | Description |
|---|---|---|
| GET | `/farmers?q=&village=&page=` | Search scoped farmer directory |
| POST | `/farmers` | Create farmer; duplicate hints |
| GET | `/farmers/:id` | Profile and read-only derived balance summary |
| PATCH | `/farmers/:id` | Update contact details |
| POST | `/farmers/:id/archive` | Archive, preserve ledger |

## Catalog
`GET /equipment`, `POST /equipment`, `PATCH /equipment/:id`, `GET /services`, `POST /services`, `PATCH /services/:id` with unit and defaultRatePaise validation. Historical lines are not rewritten.

## Jobs
| Method | Path | Description |
|---|---|---|
| GET | `/jobs?farmerId=&serviceId=&from=&to=&status=` | Work list |
| POST | `/jobs` | Create draft or completed work; prices supplied as validated line snapshots |
| GET | `/jobs/:id` | Job details |
| PATCH | `/jobs/:id` | Edit draft only |
| POST | `/jobs/:id/complete` | Finalize pricing and dates |
| POST | `/jobs/:id/cancel` | Cancel permitted state, reason required |

## Invoices
| Method | Path | Description |
|---|---|---|
| GET | `/invoices?q=&status=&serviceId=&from=&to=` | Invoice listing |
| POST | `/invoices` | Issue from completed unbilled job; idempotent |
| GET | `/invoices/:id` | Frozen invoice plus derived paid/due |
| GET | `/invoices/:id/pdf` | Authorized PDF download |
| POST | `/invoices/:id/void` | Protected action with reason; payment restrictions |

## Payments
| Method | Path | Description |
|---|---|---|
| GET | `/payments/dues?farmerId=&serviceId=&village=&status=&from=&to=` | Due invoices with filters |
| POST | `/payments/receipts` | Post a receipt to a single invoice |
| GET | `/payments/receipts?invoiceId=&farmerId=&from=&to=` | Receipt history |
| POST | `/payments/receipts/:id/reverse` | Reversal with audit reason |

`POST /payments/receipts` request:
```json
{
 "invoiceId":"inv_abc",
 "amountPaise":200000,
 "method":"CASH",
 "paymentDate":"2026-11-24",
 "note":"Paid at farm"
}
```
Required request header: `Idempotency-Key: <client-generated UUID>`. `201 Created` returns receipt and fresh invoice balance. Same key + same request returns previous result; same key + conflicting request -> `409`.

## Reports and settings
| Method | Path | Description |
|---|---|---|
| GET | `/reports/dashboard?from=&to=&asOf=` | Work-period, receipt-period and as-of snapshot |
| GET | `/reports/revenue?from=&to=&groupBy=day` | Charts |
| GET | `/reports/equipment?from=&to=` | Service-line aggregation |
| GET | `/reports/collections?from=&to=` | Payment breakdown |
| GET | `/reports/export.csv?...` | Authorized export |
| GET | `/settings` | Business settings |
| PATCH | `/settings` | Update preferences with validation |

## HTTP semantics
`400` malformed request; `401` unauthenticated; `403` unauthorized; `404` unavailable/out-of-scope resource; `409` concurrency/idempotency conflict; `422` semantic validation failure; `429` rate-limited; `500` internal error without private details.

## Contract testing
Every endpoint needs: success, validation, unauthenticated, cross-business isolation, concurrency where applicable, and pagination/filter test. Version changes require update to this file before implementation.

## P02 farmer directory additions

All farmer endpoints require the current owner session. Mutations require the same-origin custom header documented under P01.

- GET /farmers accepts q, village, page, pageSize and archived=true|false. Active records are the default. Village is an exact normalized filter. q searches name, village and phone. The response data contains items, total, page and pageSize.
- GET /farmers/:id returns active or archived identity/contact data scoped to the current business.
- POST /farmers creates contact data. PATCH /farmers/:id updates supplied fields on an active record. Empty mobile or notes clears that optional text.
- POST /farmers/duplicates accepts name, village, optional mobile and optional excludeId. Returns up to ten same-business candidates, including archived records. This is an advisory lookup, and intentional duplicate creation is allowed.
- POST /farmers/:id/archive preserves the record and returns its archive timestamp. Repeating the request returns the existing archived record.
- Responses expose no normalized search fields or writable businessId. Unavailable, cross-business and non-editable archived IDs return 404.

Name and village accept up to 120 characters. Optional mobile accepts up to 30 characters consisting of digits, spaces and +()- punctuation. Notes accept up to 2000 characters.

## P03 catalog additions

GET /equipment and GET /services accept page, pageSize and active=true|false|all. They return the shared paginated response data. POST and PATCH use the existing v1 paths and the P01 same-origin request header. Every operation derives businessId from the authenticated session.

Equipment fields are name, kind, optional displayIcon, optional serialOrRegistration and active. Service fields are name, unit (HOUR, ACRE, TRIP or FIXED), nonnegative integer defaultRatePaise, unique equipmentIds and active. Linked equipment must belong to the owner business. Invalid references return 422. No records are deleted by archival, and service rate changes append an internal prior-rate history.

## P04 Add Work

POST /jobs accepts farmerId, workDate, village, optional fieldLocation and notes, state DRAFT or COMPLETED, and one or more service lines. Each line supplies serviceId, equipmentIds, unit, decimal-string quantity, pricingMode and the corresponding agreed amount in integer paise. The server validates tenant ownership, reads the current active service and recalculates amount from its default or agreed rate. The 201 response returns the job ID, frozen lines and total. The operation requires the authenticated session and same-origin request header.
P05 Work Records: GET /api/v1/jobs (q, farmerId, from, to, village, serviceId, equipmentId, state, sort, page, pageSize); GET /api/v1/jobs/:id; POST /api/v1/jobs/:id/cancel with {reason}. All require a session; cancellation also requires the authenticated request header. Cancellation is limited to unbilled draft/completed work and records an audit revision.
## P06 Bills & Invoices

`POST /api/v1/invoices` accepts `{ "jobId": "..." }` and returns an issued invoice or the existing invoice for that job. `GET /api/v1/invoices` supports `q`, `status`, `from`, `to`, `page` and `pageSize`. `GET /api/v1/invoices/:id` returns the invoice; `GET /api/v1/invoices/:id/pdf` returns its PDF. `POST /api/v1/invoices/:id/void` accepts `{ "reason": "..." }`. All routes require a session; POST routes also require the authenticated request header.

## P07 Payments

`GET /api/v1/payments/dues` lists invoice balances and supports `q`, `farmerId`, `equipmentId`, `status`, `from`, `to`, `page`, `pageSize`. `GET /api/v1/payments/receipts` lists receipts. `POST /api/v1/payments/receipts` accepts the receipt input contract and requires `Idempotency-Key`. `POST /api/v1/payments/receipts/:id/reverse` accepts `{ "reason": "..." }`. All routes require a session; POST routes require the authenticated request header.

## P08 Dashboard

`GET /api/v1/dashboard` accepts optional `from`, `to` and `asOf` business dates. It returns period work value, period collections, as-of outstanding, active farmer count, period completed job count, today's work and collections, and a compact recent activity list. Session required.

## P09 Reports & Analytics

`GET /api/v1/reports` returns a typed report with `from`, `to`, `asOf`, `groupBy=day|week|month` and optional `farmerId`, `equipmentId`, `serviceId`. `GET /api/v1/reports/export.csv` returns the same figures as CSV. Both require a session. Work and receipt dates are distinct dimensions; as-of outstanding is calculated independently.

## P10 Settings

`GET /api/v1/settings` returns the owner and business settings. `PATCH /api/v1/settings` accepts editable profile, contact, language, notification and text-size fields. It requires the authenticated request header. Invoice prefix, next sequence and timezone are read-only.

## P90 Operational readiness

`GET /api/v1/health` is a liveness check and remains available without MongoDB. `GET /api/v1/ready` returns 200 only when the MongoDB connection is ready; otherwise it returns 503 with `DATABASE_UNAVAILABLE`. Neither endpoint requires a session. Responses include `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer` and `X-Frame-Options: DENY`. Production responses also include HSTS when secure cookies are enabled.


