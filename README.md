# Kisan Machinery Manager

A multilingual workspace for agricultural machinery service businesses. Phase P00 provides the application shell and development foundation.

## Start locally

Use Node.js 24 LTS and npm. From the repository root:

```sh
npm ci
npm run dev
```

Open the web app at http://localhost:5173 and the API health endpoint at http://127.0.0.1:3000/api/v1/health. On Windows PowerShell with script execution restricted, use `npm.cmd`.

The local defaults work without configuration. Copy each app's `.env.example` to `.env` to customize its settings. Set `MONGODB_URI` in the API environment to connect to MongoDB. Production requires a URI. Health reports process liveness. Vite proxies same-origin `/api` calls to the API by default. Set `VITE_USE_MOCK_API=true` to use the demo health adapter in the frontend service layer.

## Checks

```sh
npm run lint
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

For an existing Edge installation, set `PLAYWRIGHT_CHANNEL=msedge` before running the browser suite. Page screenshots are written under `test-results/`. Use `npm run format` to apply Prettier.

## Project structure

```text
apps/
  api/src/             Express app and startup
    config/            Validated environment and Mongoose connection
    controllers/       HTTP response handling
    middleware/        Request IDs and errors
    models/            Reserved for feature-owned Mongoose models
    routes/            Versioned route registration
    services/          Reserved for feature-owned business logic
    validators/        Validation conventions and route-specific validation
    tests/             HTTP integration and environment checks
  web/src/             React entry point and router
    controllers/       View state hooks
    i18n/              English, Telugu and Hindi resources
    mocks/             DEMO fixtures and fake adapters
    models/            Client navigation metadata
    services/          API adapters
    tests/             Resource, component and browser checks
    views/
      components/      Navigation and reusable UI
      layouts/         App shell and header
      pages/           Shared purpose-only page template
packages/
  contracts/src/       v1 DTOs, validation schemas and module ports
  domain/src/          Exact paise and quantity arithmetic, derived status
  design-tokens/src/   Shared colors, spacing and visual constants
docs/                  Product, architecture, phase plan and P00 decisions
.github/workflows/     CI checks
```

Views render data and call controller hooks. Service adapters own transport and selection of mock responses. API routes delegate HTTP concerns to controllers, and future feature services own business rules and persistence through tenant-scoped models. Inter-feature access uses the typed ports in `@kisan/contracts`.

## Routes

| Page                | URL          |
| ------------------- | ------------ |
| Dashboard           | `/dashboard` |
| Farmers             | `/farmers`   |
| Machinery & Tools   | `/machinery` |
| Add Work            | `/jobs/new`  |
| Work Records        | `/jobs`      |
| Bills & Invoices    | `/invoices`  |
| Payments            | `/payments`  |
| Reports & Analytics | `/reports`   |
| Settings            | `/settings`  |

`/` redirects to `/dashboard`. The API exposes `GET /api/v1/health`.

Read the [phase plan](<docs/MVC_PHASEWISE_DEVELOPMENT_PLAN%20(1).md>), [API specification](docs/API.md), [screen specification](docs/SCREEN_SPEC.md), and [P00 decisions](docs/P00_DECISIONS.md) for implementation boundaries.

## Owner authentication

For actual sign-in, copy the API environment example to `apps/api/.env` and set `MONGODB_URI` to a MongoDB replica set and `AUTH_REGISTRATION_SECRET` to a random secret with at least 32 characters. The API initializes auth indexes on startup. Keep the secret on the server.

Issue a 24-hour registration code for an owner’s email address:

```sh
npm run auth:code -w @kisan/api -- owner@example.com
```

Deliver the code to that email address and direct the owner to `/register`. They can then sign in at `/login` and view their business details and sign out at `/profile`. The authenticated workspace uses the same origin for the web app and `/api`. Production requires HTTPS for the session cookie.

For isolated work on the nine placeholders, set `VITE_USE_MOCK_API=true` in `apps/web/.env` and restart Vite. Development mock mode opens an explicitly marked DEMO owner profile. Playwright uses a separate local API with an in-memory repository to exercise the same auth routes without MongoDB.

See [P01 decisions](docs/P01_DECISIONS.md) for the recovery plan.

## Farmer directory

P02 adds the farmer list at /farmers, entry form at /farmers/new and contact profile at /farmers/:id. Search covers name, phone and village with a village filter and pagination. Similar names within a village or matching phone numbers prompt a duplicate review. Archive keeps the record and makes it available through the Archived filter.

The server derives tenant scope from the owner session for every farmer operation. Farmer services own contact details. The module uses no financial models. Local development mock mode uses DEMO fixtures and an in-memory directory, which resets on page reload. Actual records use the configured MongoDB database.

The test suite includes a temporary MongoDB server. Its first run downloads a MongoDB binary and later runs reuse the local cache.

## Machinery & Tools

P03 adds the equipment and services catalog at /machinery. Equipment records identify physical machines and tools. Service records define a chargeable activity, pricing unit, default rate in integer paise, and equipment included in a package. Editing a rate appends the previous rate to server-side history. Archiving retains existing records and links.

To inspect a filled catalog without writing production data, set VITE_USE_MOCK_API=true in apps/web/.env and restart Vite. The DEMO catalog includes a tractor, rotavator and trolley plus two example services. These records reset on reload and are labeled DEMO.

## Add Work

P04 adds the four-step Add Work form at /jobs/new. Choose a farmer, select one or more services, enter work date and prices, then review the exact line totals before saving. In DEMO mode the sample farmer and service catalog are available and saved records are held in page memory. The server creates authoritative job snapshots when MongoDB is configured.
