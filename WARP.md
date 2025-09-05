# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Project: Faset — Resume & Portfolio SaaS (full-stack: React + Vite frontend, Node.js/Express + PostgreSQL backend, Stripe billing)

Commands you’ll use most

- Install dependencies
  - Root + subsystems (one-time):
    - npm install
    - npm install --prefix backend
    - npm install --prefix frontend

- Run both apps in local dev (recommended)
  - From repo root: npm run dev
    - Starts backend (backend/npm start) and frontend (frontend/npm run dev) concurrently

- Frontend (frontend/)
  - Dev server: npm run dev
  - Build: npm run build
  - Preview built site: npm run preview

- Backend (backend/)
  - Start API: npm start
  - Test suite (Jest): npm test -- --runInBand
  - Watch tests: npm run test:watch
  - Coverage: npm run coverage
  - Lint (backend only): npm run lint

- Lint (entire repo)
  - From repo root: npm run lint

- Run a single backend test (Jest)
  - By file path (exact match):
    - cd backend && npm test -- server/controllers/payments.test.js
  - By test name (pattern):
    - cd backend && npm test -- -t "payments controller"

- Database migrations (PostgreSQL)
  - Create new migration: node backend/scripts/new_migration.js <short_description>
  - Apply pending migrations: node backend/scripts/apply_migrations.js

- Stripe local webhooks (optional, for payments flows)
  - Forward events to backend (default backend port ~5001):
    - stripe listen --forward-to http://localhost:5001/webhooks/stripe
  - Ensure STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET are set in backend/.env

High-level architecture

- Monorepo layout
  - frontend/ — Vite + React SPA. Expects API at /api or configured via VITE_API_URL. Build outputs static assets in frontend/dist.
  - backend/ — Node.js/Express service with layered structure and Jest tests. Key directories:
    - server/ — Express app and application code
      - config/ — env and configuration helpers
      - db/ — pg Pool setup/wrapper
      - controllers/ — route handlers (webhooks, auth, users, templates, payments)
      - services/ — reusable domain/integration logic (Stripe client, mailer, captcha)
      - middleware/ — cross-cutting Express middleware
      - routes/ — route wiring kept thin, delegates to controllers
    - scripts/ — operational CLI scripts (e.g., sync Stripe price map, migrations)
    - tools/ — dev utilities and one-offs
    - migrations/ — forward-only SQL migrations applied in lexical order

- Data flow
  - Browser -> frontend (Vite dev server or static files) -> backend /api routes -> services -> db
  - Stripe -> backend /webhooks/stripe (raw-body middleware) -> signature verify using STRIPE_WEBHOOK_SECRET -> service handlers

- Environments & configuration (backend)
  - DATABASE_URL — Postgres connection string
  - JWT_SECRET — signing key for auth tokens
  - STRIPE_SECRET_KEY — server-side Stripe key
  - STRIPE_WEBHOOK_SECRET — verify webhook signatures (set when using Stripe CLI or in hosted env)

- Linting & formatting
  - ESLint configured at repo root via eslint.config.js (ESM). Lints JS/JSX across the repo. Use npm run lint at root for repo-wide linting.

Notes pulled from project docs

- Root README outlines quick-start and Stripe webhook setup for local dev.
- Backend README details the server layering, test strategy (Jest + supertest), and env vars.
- Frontend README covers Vite dev/build/preview and API base URL expectations.
- Migrations README documents naming and the apply/new scripts.

Operational hints

- CI/CD references in wiki suggest Railway hosting. Build frontend separately and deploy static assets; deploy backend as an Express service. Apply DB migrations during deploy via backend/scripts/apply_migrations.js.
- For local payments testing, run Stripe CLI and update STRIPE_WEBHOOK_SECRET accordingly.

