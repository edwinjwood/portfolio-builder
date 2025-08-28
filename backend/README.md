# Backend service (backend/)

This folder contains the server-side code and helper scripts for the Portfolio Builder backend. It is a standalone Node.js service (Express + PG + Stripe + utilities) that includes tests, scripts, and tools used for operational tasks and data migrations.

Quick layout

- `server/` — Express app and application code (controllers, routes, services, middleware, db, config).

- `tests/` — Jest + supertest unit and integration tests for the server code.

- `scripts/` — Operational scripts meant to be run from the repository (invoice reconciliation, price map sync, etc.). These are CLI-style node scripts and may exit the process on error.

- `tools/` — One-off utilities and helper scripts used for maintenance, backfills, or developer tooling.

- `migrations/` — SQL migration files used to evolve the database schema.

- `coverage/` — Test coverage output (ignored by source control in most workflows).

- `package.json` — Backend package manifest (dev/test dependencies, scripts like `test`, `start`).

## server/ folder (dive)

- `server/index.js` — App bootstrapping and Express app creation. Exports the `app` for tests.

- `server/config/` — Environment and configuration helpers (JWT secret, DB URL, feature flags).

- `server/db/` — Database client wrapper (exports a `pg` Pool). Tests often mock this to avoid network calls.

- `server/controllers/` — Route handlers organized by feature (checkout, payments, users, webhooks, templates, etc.). Keep business logic thin and push logic into `services/` where practical.

- `server/services/` — Reusable services (mailer, captcha, stripe helpers, central `stripeClient` provider). Good place for pure functions and small integrations.

- `server/middleware/` — Express middleware (auth guards, rate-limiting, body parsers that preserve raw body for webhooks).

- `server/routes/` — Minimal wiring from routes to controllers (keeps `index.js` clean).

- `server/tools/` — Internal server-side scripts that operate against the same codebase (may be separate from top-level `scripts/`).

## tests/ folder

- Unit tests for small units (services, helpers) and route-level tests using `supertest`. Tests mock external services (DB, Stripe) using the `server/services/stripeClient` provider so they remain hermetic.

## scripts/ and tools/

- Scripts are intended to be run from the repo (example: `node backend/scripts/reconcile_invoices.js`). They perform non-interactive maintenance tasks and are safe-guarded with env checks for destructive operations.

- Tools are usually developer utilities or backfill helpers (may require local DB access and valid Stripe keys).

## migrations/

- SQL files, ordered with numeric or timestamp prefixes. Apply using your migration runner or the provided scripts in `server/scripts/`.

## How to run tests

- From the repo root or the `backend/` folder run:

```powershell
cd "backend"
npm install
npm test -- --runInBand
```



