# Faset — Resume & Portfolio SaaS

[![License: MIT](https://img.shields.io/badge/license-MIT-yellow.svg)](./LICENSE)

Faset helps people and organizations create, publish, and manage professional resumés and digital portfolios. This repository contains the internal full-stack app: a React + Vite frontend, a Node.js + Postgres backend, Stripe billing, and background jobs for reconciliation and integrations.

## Quick internal developer start (no secrets)

> This project is private. Request access from the project owner before running locally.

1. Install dependencies (from repository root):

```powershell
npm install
cd backend && npm install
cd ../frontend && npm install
```

2. Provide environment variables for the backend (example placeholders):

Create `backend/.env` with at least:

```
DATABASE_URL=postgres://user:pass@localhost:5432/dbname
STRIPE_SECRET_KEY=sk_test_xxx
```

3. Start development (concurrently runs frontend + backend):

```powershell
npm run dev
```

4. Run backend tests:

```powershell
cd backend
npm test
```

## What Faset does

- Guided resume builder and resume upload
- Digital portfolio pages combining resume, projects, and media
- One-click publish to a hosted URL and exportable static output
- AI features (planned): resume scanning, keyword optimization, and interactive chat assistant
- QR code generation and downloadable share cards
- Multiple templates, color themes, and simple styling controls
- Individual plans and tenant (white-label) deployments for universities and bootcamps

## Architecture (high level)

- Frontend: React + Vite + Tailwind CSS
- Backend: Node.js, Express, PostgreSQL
- Payments: Stripe (billing, subscriptions, invoices)
- Background jobs: cron scripts and workers for reconciliation and webhooks
- Optional integrations: SSO, LMS, placement systems

## Running a single maintenance script

To run the invoice reconciler locally (inspect only):

```powershell
node backend/scripts/reconcile_invoices.js --limit 10
```

Add `--apply` to modify DB rows only after verifying behaviour and setting `RECONCILER_APPLY_ENABLED=true` in your backend env.

# Faset — Resume & Portfolio SaaS

[![License: MIT](https://img.shields.io/badge/license-MIT-yellow.svg)](./LICENSE)

Faset helps people and organizations create, publish, and manage professional resumés and digital portfolios. This repository contains the internal full-stack app: a React + Vite frontend, a Node.js + Postgres backend, Stripe billing, and background jobs for reconciliation and integrations.

## Quick internal developer start (no secrets)

> This project is private. Request access from the project owner before running locally.

1. Install dependencies (from repository root):

```powershell
npm install
cd backend && npm install
cd ../frontend && npm install
```

1. Provide environment variables for the backend (example placeholders):

Create `backend/.env` with at least:

```bash
DATABASE_URL=postgres://user:pass@localhost:5432/dbname
STRIPE_SECRET_KEY=sk_test_xxx
```

1. Start development (concurrently runs frontend + backend):

```powershell
npm run dev
```

1. Run backend tests:

```powershell
cd backend
npm test
```

## What Faset does

- Guided resume builder and resume upload
- Digital portfolio pages combining resume, projects, and media
- One-click publish to a hosted URL and exportable static output
- AI features (planned): resume scanning, keyword optimization, and interactive chat assistant
- QR code generation and downloadable share cards
- Multiple templates, color themes, and simple styling controls
- Individual plans and tenant (white-label) deployments for universities and bootcamps

## Architecture (high level)

- Frontend: React + Vite + Tailwind CSS
- Backend: Node.js, Express, PostgreSQL
- Payments: Stripe (billing, subscriptions, invoices)
- Background jobs: cron scripts and workers for reconciliation and webhooks
- Optional integrations: SSO, LMS, placement systems

## Running a single maintenance script

To run the invoice reconciler locally (inspect only):

```powershell
node backend/scripts/reconcile_invoices.js --limit 10
```

Add `--apply` to modify DB rows only after verifying behaviour and setting `RECONCILER_APPLY_ENABLED=true` in your backend env.

## Contributing & Code of Conduct

See `CONTRIBUTING.md` and `CODE_OF_CONDUCT.md` for contribution guidelines and expected behavior.

## License

This project is licensed under the MIT License — see the `LICENSE` file for details.

## Contact

For access, questions, or operational runbooks, contact the project owner.

---

Would you like a README badge for build/test status (CI), or a short developer troubleshooting section (common env vars, database migrations)?
