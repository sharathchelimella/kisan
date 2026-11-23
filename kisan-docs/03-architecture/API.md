# REST API Specification (v1)

Base: `/api/v1` · JSON · session cookie authentication · UTC timestamps and business-local dates. All endpoints automatically filter by authenticated `businessId`. Write APIs validate with shared schemas; return consistent error payload.

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
