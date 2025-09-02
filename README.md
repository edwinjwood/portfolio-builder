# Faset — Resume & Portfolio SaaS

[![License: MIT](https://img.shields.io/badge/license-MIT-yellow.svg)](./LICENSE)

Faset helps people and organizations create, publish, and manage professional resumés and digital portfolios. This repository contains the full-stack application: a React + Vite frontend, a Node.js + Postgres backend, Stripe billing, and maintenance scripts.

## Overview

Root docs are intentionally concise; subsystem details are in their respective READMEs:

- `backend/README.md` — server, scripts, tests, and how to run the backend.
- `frontend/README.md` — Vite/React app, build, and local dev instructions.

## Technologies

- Frontend: React, Vite, Tailwind CSS
- Backend: Node.js, Express, PostgreSQL (pg)
- Payments: Stripe (server SDK and Checkout)
- Testing: Jest, Supertest
- Infra/hosting: Railway (deployment), optional static hosts for frontend

Purpose: provide a small SaaS for building and publishing resumés and portfolios with subscription billing and simple templates.


## Quick start (developer)

> This project is private. Request access from the project owner before running locally.

1. Install repository-level dependencies and subsystem dependencies:

```powershell
npm install
cd backend && npm install
cd ../frontend && npm install
```

2. Configure backend environment variables in `backend/.env` (examples):

```text
DATABASE_URL=postgres://user:pass@localhost:5432/dbname
STRIPE_SECRET_KEY=sk_test_xxx
```

3. For subsystem-specific run/build/test commands see the respective README files listed above.

## Repository layout

- `backend/` — Express app, DB client, scripts, tests. See `backend/README.md`.
- `frontend/` — Vite + React app and static assets. See `frontend/README.md`.
- `migrations/` and `server/scripts/` — SQL migrations and maintenance scripts.
- `wiki/` — Project documentation and decision log.

## Contributing & license

See `CONTRIBUTING.md` and `CODE_OF_CONDUCT.md` for contribution guidelines. The project is licensed under MIT — see `LICENSE`.

## Contact

For access or operational questions contact the project owner.

