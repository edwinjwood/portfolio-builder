# Team Organization

This page records team decisions and operational guidance for the Portfolio Builder project. It should be updated as decisions change. It also collects the answers to the project questions (interpreted here as items about branching/workflow, CI/CD/deploy, and issue/tracking/code review).

Decisions (questions 2–4)

- Question 2 (team meeting time): We will meet Fridays @ 1:30PM
- Question 3 (chat service): Discord — use Discord for informal/organizational discussion; important technical or product decisions must be recorded in GitHub Issues.
- Question 4 (message frequency): Everyone should check messages at least once per day and reply within 24 hours for routine questions.

If these interpretations are incorrect, update this section or tell me how you'd like the questions represented.

## High-level roles
- Product Owner / Project Lead: Edwin J. Wood — overall roadmap, stakeholder & vendor liaison.
- Tech Lead / Architect: (assign) — architecture reviews, major decisions.
- Backend Engineer(s): responsible for `backend/` services, DB migrations, API contracts.
- Frontend Engineer(s): responsible for `frontend/` app, UI, accessibility, and build pipeline.
- QA / Test Owner: (assign) — test suites, smoke tests, regression testing.
- DevOps / Release Owner: (assign) — CI/CD, environment configuration, deploys, secrets.

Contact details and on-call escalation should be kept in the Runbook wiki page.

## Repo & branching strategy
- Repo layout: monorepo with these top-level folders:
  - `frontend/` — React/Vite site
  - `backend/` — Express services, scripts, migrations
  - `tools/`, `wiki/`, `resume/`, etc.
- Branching model: GitHub Flow (short‑lived feature branches)
  - `main` — protected; deployable production code only. Require passing CI + 1 reviewer before merge.
  - `dev` — integration branch for the current sprint; merges from feature branches happen here.
  - Feature branches: `feature/<short-name>` or `feat/<jira-id>-short`.
  - Hotfixes: `hotfix/<short>` merged directly to `main` and `dev`.
- PR policy:
  - Open PR from feature -> `dev` (or `main` for small fixes).
  - Include description, linked issue/milestone, test steps, and screenshots if UI change.
  - Require at least one approving review and passing CI checks.

## CI/CD & deployment
- CI:
  - GitHub Actions runs on PRs and pushes. Standard jobs:
    - install deps, lint, unit tests (Jest), integration tests (Supertest) where fast, build frontend.
    - smoke tests job that runs quick sanity checks against staging.
- CD:
  - On push to `dev`: build and deploy to `staging` environment on Railway (or preview deploy).
  - On merge to `main`: publish production build and deploy to `production` Railway service.
  - Docker images (if used) tagged with commit SHA.
- Secrets & configuration: use GitHub Secrets + Railway environment variables. Do not store secrets in repo; use `dotenv` for local dev only.
- DB migrations: managed via `backend/migrations` and `backend/scripts/apply_migrations.js` (or equivalent). Migrations are applied as part of the deploy pipeline or via a manual ops step documented in the Runbook.
- Rollbacks: deployments are versioned; rollbacks follow Railway/GitHub Actions workflow. Post‑deploy smoke checks validate health; if failing, trigger rollback and alert on-call contact.

## Development workflow & code review
- Issue tracking:
  - Use GitHub Issues. Label with `bug`, `feature`, `chore`, `infra`, `priority/1` etc.
  - Milestones map to release/sprint goals. Early milestones will be authored as wiki pages (see Wiki structure below).
- Definition of done for a ticket:
  - Unit tests added for new logic.
  - Linting passes; basic integration or e2e tests where applicable.
  - Documentation updated (README, API docs, or Wiki milestone page).
  - PR accepted and merged with no unresolved comments.
- Code review checklist for reviewers:
  - Does the change implement the ticket and not much else?
  - Are there tests covering the change? Are edge cases considered?
  - Is the API backward compatible where necessary? Any DB migration impact documented?
  - Security considerations (env vars, secret handling, user input validation).
  - Performance and scalability notes for large public endpoints.
- Testing & mocks:
  - Mock external services (Stripe, captcha) for unit tests.
  - Use a small suite of smoke tests to validate the happy path before/after deploy.

## Wiki organization & milestones
- Top-level wiki pages (suggested):
  - `Project Description` (done)
  - `Team Organization` (this page)
  - `Architecture` (system diagrams, data flows)
  - `API Docs` (open API surface, endpoints)
  - `Runbook` (deploy steps, secrets, incident process)
  - `Milestones/` (folder or naming prefix for milestone pages)
  - `Decision Log` (formal log of architectural or product decisions)
- Milestone pages:
  - Each early milestone is a standalone wiki page `Milestone - <number> - <title>` and contains acceptance criteria, tasks, owner, and due date.
  - Link milestone pages from the Wiki index and the GitHub milestone object if used.

## Onboarding checklist for new contributors
1. Clone repo and install Node/npm (node >= 18 recommended).
2. Copy `.env.example` to `.env` and populate local DB and Stripe test keys.
3. `cd backend && npm ci` and `cd ../frontend && npm ci`.
4. Run local DB (Postgres) or use Railway dev connection; run migrations.
5. Start backend: `node server/index.js` (or use `npm run dev` if defined).
6. Start frontend: `npm run dev` in `frontend/` and visit local URL.
7. Run tests: `npm test` in `backend` and `frontend` as applicable.

## Communication & cadence
- Weekly sync: 30‑minute engineering standup + 30‑minute product sync.
- Emergency/incident channel: Slack (or email). On-call to be listed in `Runbook`.
- Decision reviews: major changes require an architecture review meeting and an entry in `Decision Log`.

### Meetings & Communication
- Regular team meeting: We will meet Fridays @ ....
- Chat service: Discord — use Discord for informal/organizational discussion; important technical or product decisions must be recorded in GitHub Issues (for example: which backend should we use?).
- Message frequency: Everyone should check messages at least once per day and react within 24 hours. We will react in less than 24 hours via text for routine questions.

## Runbook & incident handling (summary)
- Health checks and logs: monitor Railway logs and set alerts for 5xx spikes and DB connection failures.
- Quick recovery steps listed in `Runbook` (link here once created): how to promote previous release, temporarily pause webhook processing, and apply DB migration rollbacks if necessary.

## Governance & housekeeping
- Linting: ESLint + Prettier enforced in CI; use `lint-staged` to run on commits.
- Commit messages: Conventional Commits recommended (feat:, fix:, chore:).
- Security: rotate API keys regularly, store secrets in Railway/GitHub secrets, audit deps with `npm audit` regularly.

---

Update this page as decisions evolve. For any change that materially affects the team (branching, deploy policy, secret storage), add an entry to the `Decision Log` and link it here.
