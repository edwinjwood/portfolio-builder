
# Edwin J. Wood – Resume / Projects Site

A lightweight, modern personal resume + projects site built with **React + Vite + Tailwind CSS** and deployed to **GitHub Pages** (user site). Uses a **HashRouter** to avoid refresh 404s.

---

## 🚀 Features

- Fast dev experience (Vite)
- Responsive, minimalist layout (Tailwind)
- Resume and Projects pages via React Router
- Simple PowerShell deploy script (dev → main)
- Hash-based routing works on GitHub Pages
- 404 fallback (defensive safety net)

---

## 🗂 Branch & Deployment Model

| Branch | Purpose | `index.html` Form |
|--------|---------|------------------|
| `dev`  | Active development | References `/src/main.jsx` (source) |
| `main` | Deployed (Pages) | Built file referencing hashed `/assets/*.js` |

`deploy.ps1` (run from `dev`) will:

1. Ensure clean working tree
2. Build production bundle
3. Checkout `main` & merge `dev`
4. Copy built `index.html`, `assets/`, `vite.svg`
5. Create/refresh `404.html`
6. Commit & push, then switch back to `dev`

---

## 🛠 Prerequisites

- Node.js 18+ (LTS recommended)
- npm

Verify:

```powershell
node -v
npm -v
```

---

## 🔧 Install & First Run

```powershell
git clone https://github.com/<your-username>/<your-username>.github.io.git
cd <your-username>.github.io
npm install
git checkout -b dev   # create dev branch if needed
npm run dev
```

Visit the printed local URL (default <http://localhost:5173>).

---

## 🧪 Development Workflow

1. Stay on `dev` while editing.
2. Update resume (`src/App.jsx`) & projects (`src/Projects.jsx`).
3. Add routes in `App.jsx` (HashRouter in use).
4. Commit changes normally.
5. Deploy with:

```powershell
./deploy.ps1
```

Skip pulling remotes first:

```powershell
./deploy.ps1 -SkipPull
```

Site URL (user page):

```text
https://<your-username>.github.io/#/
```

Projects page:

```text
https://<your-username>.github.io/#/projects
```

---

## 📦 Manual Production Build

```powershell
npm run build
```

Outputs go to `dist/` (ignored by git). Deploy script selectively copies required files.

---

## 🌐 Routing Strategy

GitHub Pages can’t serve SPA history routes. `HashRouter` keeps the path client-side (`#/...`). If migrating to Netlify/Vercel you can switch to `BrowserRouter` and add rewrite rules.

---

## 🧩 Customization Guide

| Area | Where | Notes |
|------|-------|-------|
| Resume content | `src/App.jsx` | Replace sections / bullet points |
| Projects list | `src/Projects.jsx` | Edit the `projects` array |
| Styles / Theme | `tailwind.config.js`, `index.css` | Extend colors, fonts, etc. |
| Favicon | `vite.svg` | Replace file + link tag |
| SEO Meta | `index.html` | Update title + description |
| Navigation | `src/App.jsx` | Add `<Link>` + `<Route>` |
| Deployment msg | `deploy.ps1` | Adjust commit message template |

Dark mode: add `darkMode: 'class'` to tailwind config, toggle `classList` on `<html>`.

---

## 🔍 Quality & Accessibility

- Single `<h1>` per view
- Sufficient color contrast
- Keyboard check (Tab through nav)
- Descriptive link text

---

## 🔧 Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Empty production index.html | Built file copied over source earlier | Restore dev `index.html` (script tag to `/src/main.jsx`) then rebuild |
| Old content after deploy | Browser / Pages cache | Hard refresh (Ctrl+F5) or wait 1–2 min |
| 404 on deep route (no hash) | Switched to `BrowserRouter` on Pages | Use `HashRouter` or move hosting |
| Tailwind classes missing | Purge misconfig / missing directives | Ensure `@tailwind base; components; utilities;` in `index.css` |

---

## 🔄 Alternative Publication (gh-pages branch)

Prefer not committing build output on `main`? Publish `dist` to a `gh-pages` branch via GitHub Action or `gh-pages` npm package. (Not used here because user site root must be built content.)

---

## 📜 License

Personal use orientation. Fork and adapt freely for your own resume / portfolio.

---

## ✅ Quick Start TL;DR

```powershell
git clone https://github.com/<you>/<you>.github.io
cd <you>.github.io
npm install
git checkout -b dev
npm run dev
./deploy.ps1
```

Enjoy!
