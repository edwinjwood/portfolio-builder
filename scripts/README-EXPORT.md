# Automated Screenshot Exporter

This script captures screenshots of your running frontend app at multiple routes and viewports using Playwright and saves them to `wiki/design/screenshots`.

Usage

1. Install dev dependencies (from repo root):

```powershell
npm install
npx playwright install
```

2. Start the frontend dev server (Vite) or serve a production build. Example (from repo root):

```powershell
# Run concurrently in the repo's existing script setup, or start only frontend
npm run dev
# or from the frontend folder
cd frontend; npm run dev
```

3. Run the exporter (from repo root):

```powershell
# If your dev server is at a different URL, set EXPORT_BASE_URL
$env:EXPORT_BASE_URL = 'http://localhost:5173'
node .\scripts\export-screenshots.cjs
```

4. Output

Screenshots are saved in `wiki/design/screenshots` with filenames like `home-desktop.png` and `dashboard-mobile.png`.

Customizing routes

Edit `scripts/export-screenshots.cjs` and update the `routes` array to include the routes you want to capture. Use your app's route names.
