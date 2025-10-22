# Faset — Resume & Portfolio SaaS

[![License: MIT](https://img.shields.io/badge/license-MIT-yellow.svg)](./LICENSE)

Short description
-----------------

Facet is a PoC web application for building and publishing lightweight public portfolios and resumes. The frontend is a Vite + React SPA; the backend is a Node/Express API with a PostgreSQL database. The app is hosted for the PoC on Railway (frontend static service, Node backend, managed Postgres).

See the project architecture: ../wiki-publish/Architecture.md


External Requirements
---------------------

This README documents the developer-facing steps for Windows (PowerShell) using the versions we used while building the project.

Prerequisites (install these first):

- Node.js (LTS 18+ recommended)
  - Install from https://nodejs.org
  - Verify: `node -v` and `npm -v`
- Git: `git` (use Git for Windows)
  - Verify: `git --version`
- PostgreSQL client (psql) for local DB inspection (optional)
  - Install via https://www.postgresql.org/download/windows/


Setup (one-time)
-----------------

1. Clone the repo:

```powershell
git clone <repo-url>
cd "C:\VS Projects\Portfolio Builder\portfolio-builder"
```

2. Copy the example env and edit values (`backend/.env`):

```powershell
cd backend
copy .env.example .env
# Edit .env to set DATABASE_URL and any secrets
notepad .env
```

- For the PoC we host services on Railway; the project already contains a `backend/.env` that points to the Railway Postgres instance. DO NOT commit production secrets.

3. Install dependencies

```powershell
cd ..\
npm install
cd backend
npm install
```


Running (development)
---------------------

Open two PowerShell terminals.

Terminal A — frontend dev server:

```powershell
cd "C:\VS Projects\Portfolio Builder\portfolio-builder\frontend"
npm run dev
```

Terminal B — backend API server:

```powershell
cd "C:\VS Projects\Portfolio Builder\portfolio-builder\backend"
npm run dev
```

Notes:
- The backend reads `DATABASE_URL` from `backend/.env`.
- If you want to run a local Postgres, update `DATABASE_URL` to `postgres://user:pass@localhost:5432/dbname` and run migrations.


Deployment
----------

PoC uses Railway for hosting. High-level steps:

1. Create a Railway project and add the frontend static service and a Node backend service.
2. Add a Postgres plugin to Railway and copy the `DATABASE_URL` into `backend/.env` (or set Railway environment variables).
3. Configure build commands:
   - Frontend: `npm run build` (Vite outputs `dist/`)
   - Backend: `npm start` or the Dockerfile if using a container.
4. Add any secrets (JWT_SECRET, STRIPE keys) via Railway env UI.

Do not store secrets in git.


Testing
-------

Unit tests (backend):

```powershell
cd backend
npm test
```

If you add frontend tests, describe the test runner here (e.g., Vitest/Jest).


Helpful scripts
---------------

- `backend/scripts/apply_migrations.js` — applies SQL files in `backend/migrations` to `DATABASE_URL`.
- `deploy.ps1` — helper script for simple deploy flows used earlier in the project.


Authors
-------

- Terdoo Achu <tachu@email.sc.edu>

Contact: team email or GitHub handles
