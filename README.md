# Edwin J. Wood – Resume / Projects Site

A lightweight, modern personal resume + projects site built with React, Vite, and Tailwind CSS, deployed to GitHub Pages (user site). Uses a HashRouter to avoid refresh 404s.

---

## 🔧 Install & First Run

```powershell
git clone https://github.com/YOUR_USERNAME/YOUR_USERNAME.github.io.git
cd YOUR_USERNAME.github.io
npm install
git checkout -b dev   # create dev branch if needed
npm run dev
```

Visit the printed local URL (default <http://localhost:5173>).

---

## 🧪 Development Workflow

1. Stay on dev while editing.
1. Update resume (`src/Resume.jsx`), projects (`src/Projects.jsx`), and the home business card (`src/App.jsx`).
1. Add routes in `src/App.jsx` (HashRouter in use).
1. Commit changes normally.
1. Deploy using the script (see Deploy section below).

---

## 🚀 Deploy

Production is served from the main branch. Run the script from dev.

Deploy:

```powershell
./deploy.ps1
```

Skip pulling remotes first:

```powershell
./deploy.ps1 -SkipPull
```

Auto-stage/commit when prompted (optional):

```powershell
./deploy.ps1 -AutoCommit
```

URLs:

- User page: <https://YOUR_USERNAME.github.io/#/>
- Resume page: <https://YOUR_USERNAME.github.io/#/resume>
- Projects page: <https://YOUR_USERNAME.github.io/#/projects>
- Filtered view: <https://YOUR_USERNAME.github.io/#/projects?cat=Automation>

---

## 📦 Manual Production Build

```powershell
npm run build
```

Outputs go to dist/ (ignored by git). The deploy script selectively copies required files.

Preview the production build locally (no deploy):

```powershell
npm run build
npm run preview
```

Then open the printed URL (default <http://localhost:4173/#/projects>) to validate before pushing. You can also check the resume at <http://localhost:4173/#/resume>.

---

## 🌐 Routing Strategy

GitHub Pages can’t serve SPA history routes. HashRouter keeps the path client-side (#/...). If migrating to Netlify or Vercel you can switch to BrowserRouter and add rewrite rules.

---

## 🧩 Customization Guide

| Area | Where | Notes |
|------|-------|-------|
| Resume content | `src/Resume.jsx` | Replace sections / bullet points |
| Home business card | `src/components/App.jsx` | Edit HomeCard (name, subtitle, layout) |
| Projects list | `src/components/Projects.jsx` | Edit the projects array or update `src/data/projects.json` |
| Home card data | `src/data/homecard.json` | Update the JSON file for home card details |
| Styles / Theme | tailwind.config.js, index.css | Extend colors, fonts, etc. |
| Card texture | `src/styles/App.css` | Tweak `.paper-texture` / `.paper-card` or remove |
| Favicon | vite.svg | Replace file + link tag |
| SEO Meta | index.html | Update title + description |
| Navigation | `src/components/App.jsx` | Add `Link` + `Route` |
| Deployment msg | deploy.ps1 | Adjust commit message template |

Dark mode: add `darkMode: 'class'` to tailwind config, toggle `classList` on the html element.

---

## 🔍 Quality & Accessibility

- Single h1 per view
- Sufficient color contrast
- Keyboard check (Tab through nav)
- Descriptive link text

Behavior notes

- Export PDF button is shown on the Resume page only (hidden on Home and Projects).
- The Home card is fully clickable (opens Resume) and includes quick links in the top-right.


---

## 🔄 Alternative Publication (gh-pages branch)

Prefer not committing build output on main? Publish dist/ to a gh-pages branch via GitHub Action or the gh-pages npm package. (Not used here because a user site root must be built content.)

---

## 📜 License

Personal use orientation. Fork and adapt freely for your own resume / portfolio.

---

## ✅ Quick Start TL;DR

```powershell
git clone https://github.com/YOUR_USERNAME/YOUR_USERNAME.github.io.git
cd YOUR_USERNAME.github.io
npm install
git checkout -b dev
npm run dev
./deploy.ps1
```

Cheers.
