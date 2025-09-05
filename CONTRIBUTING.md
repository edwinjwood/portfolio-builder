# Contributing to Faset

Thanks for helping improve Faset. This document explains the minimal workflow we expect from contributors and internal developers so contributions stay consistent and reviewable.

If you are an external contributor, this repository is currently private — contact the project owner for access and onboarding.

### Quick start (developers)

1. Clone the repository (internal access required) and install dependencies:

   ```powershell
   # from repo root
   npm install
   cd backend && npm install
   cd ../frontend && npm install
   ```

2. Run the app in development mode (concurrently starts frontend + backend):

   ```powershell
   npm run dev
   ```

3. Run backend tests:

   ```powershell
   cd backend
   npm test
   ```

### Branching & PRs

- Work on feature branches off `dev` named like `feature/short-description` or `fix/short-description`.
- Open a Pull Request against `dev` and include a short description of the change, any migration/runtime impact, and a screenshot if UI changed.
- Aim for small, focused PRs to simplify review.

### Commit messages

- Use conventional, imperative messages: `feat: add resume upload`, `fix: correct invoice reconciliation`.
- Include a brief body if the change needs explanation.

### Coding style

- JavaScript: follow project's ESLint rules. Run `npm run lint` at project root.
- Keep changes small and modular.

### Tests & CI

- Add unit tests for new behavior. Backend uses Jest; frontend uses Vite test setups where applicable.
- Run tests locally before opening a PR.

### Security & secrets

- Never commit secrets (API keys, DB passwords) to the repo. Use `.env` files locally and your deployment platform's secret manager in production.

### Reporting issues

- Open issues describing the problem, steps to reproduce, and expected vs observed behavior. Attach logs or screenshots where helpful.

### Need help?

Contact the project owner or an internal maintainer for access, onboarding, or architecture questions.
