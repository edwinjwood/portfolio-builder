# Frontend (frontend/)

This folder contains the client-side React application built with Vite and Tailwind CSS. The app is intended to be served as a static site after building, or run locally in development using the Vite dev server.

## Quick layout

- `src/` — React source code (components, pages, hooks, contexts, assets).
- `public/` — Static assets copied to the build output.
- `index.html`, `index.dev.html` — HTML entry points used for production and development builds.
- `package.json` — Frontend package manifest and npm scripts (dev, build, preview).
- `vite.config.js` — Vite configuration.
- `tailwind.config.js`, `postcss.config.js` — CSS toolchain config for Tailwind.

## How to run locally

- Install dependencies and start the dev server (from repo root or `frontend/`):

```powershell
cd "frontend"
npm install
npm run dev
```

- The dev server will typically run on `http://localhost:5173` unless configured otherwise in `vite.config.js` or by the `VITE_PORT` environment variable.

## How to build and preview

- Build the production bundle and preview the static output:

```powershell
cd "frontend"
npm run build
npm run preview
```

- The `dist/` directory contains the production-ready static files. Deploy these to your static host or configure Railway to run `npm run build` from the `frontend/` folder.

## Environment and API endpoints

- The frontend expects a backend API under `/api/` (see `server/routes/`). During development you can set `VITE_API_URL` or use a proxy configured in `vite.config.js` to forward requests to the backend server.

## Testing

- If the frontend includes unit tests or integration tests, run them with the configured test runner (Jest, Vitest, etc.). Example:

```powershell
cd "frontend"
npm test
```

## Deployment notes

- For Railway or other hosts that build from the repo, point the service root to the `frontend/` folder and use `npm run build` as the build command.
- After making API route changes in the backend, rebuild the frontend so compiled bundles don't contain stale endpoints.

## Quick tips

- Keep runtime API base URLs configurable via `VITE_API_URL` so builds can target staging or production backends without code changes.
- Ensure CAPTCHA keys, Stripe publishable keys, and similar public config are injected via environment variables at build time and not hard-coded.

