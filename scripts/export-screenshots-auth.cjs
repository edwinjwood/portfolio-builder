const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Load frontend/.env.local if present so credentials can be kept in the frontend env file
function loadFrontendEnv() {
  try {
    const envPath = path.resolve(__dirname, '..', 'frontend', '.env.local');
    if (!fs.existsSync(envPath)) return;
    const src = fs.readFileSync(envPath, 'utf8');
    src.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const idx = trimmed.indexOf('=');
      if (idx === -1) return;
      const key = trimmed.substring(0, idx).trim();
      let val = trimmed.substring(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.substring(1, val.length - 1);
      }
      // Do not overwrite existing env vars so CLI overrides still work
      if (process.env[key] === undefined) process.env[key] = val;
    });
    console.log('Loaded frontend/.env.local');
  } catch (e) {
    console.warn('Failed to load frontend/.env.local:', e.message || e);
  }
}

loadFrontendEnv();

(async () => {
  const outDir = path.resolve(__dirname, '..', 'wiki', 'design', 'screenshots', process.env.EXPORT_OUTPUT_DIR || 'auth');
  fs.mkdirSync(outDir, { recursive: true });

  // Base URL for your running frontend. Change or set via EXPORT_BASE_URL env var.
  const base = process.env.EXPORT_BASE_URL || 'http://localhost:5173';
  // Backend API base (for login). Change or set via EXPORT_API_URL env var.
  const apiBase = process.env.EXPORT_API_URL || 'http://localhost:5001';

  // Pages to capture. Add or remove routes as needed.
  const routes = (process.env.EXPORT_ROUTES || '/,/dashboard,/editor,/profile').split(',').map(r => r.trim()).filter(Boolean);

  const viewports = [
    { name: 'desktop', width: 1440, height: 900 },
    { name: 'mobile', width: 390, height: 844 }
  ];

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Helper to do a programmatic login against the API (preferred)
  async function loginViaApi(email, password) {
    try {
      const res = await fetch(`${apiBase}/api/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (!res.ok) {
        const err = await res.text().catch(() => '');
        console.warn('Login API failed:', res.status, err);
        return null;
      }
      const data = await res.json();
      return data; // { token, user }
    } catch (e) {
      console.warn('Login API request failed:', e.message || e);
      return null;
    }
  }

  // If credentials were supplied, try to log in once and set localStorage for pages
  let auth = null;
  const authEmail = process.env.EXPORT_AUTH_EMAIL;
  const authPassword = process.env.EXPORT_AUTH_PASSWORD;
  if (authEmail && authPassword) {
    auth = await loginViaApi(authEmail, authPassword);
    if (!auth) console.warn('Auth requested but login failed; continuing without auth.');
  }

  for (const route of routes) {
    const url = new URL(route, base).toString();
    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });

      // If we have an authenticated session, set localStorage token + current user before navigation
      // Use the frontend origin (base) so localStorage is accessible (about:blank is restricted)
      if (auth && auth.token && auth.user) {
        await page.goto(base, { waitUntil: 'domcontentloaded' });
        await page.evaluate(({ token, user }) => {
          localStorage.setItem('pb:token', token);
          localStorage.setItem('pb:currentUser', JSON.stringify(user));
        }, { token: auth.token, user: auth.user });
      } else {
        // Ensure any auth keys are cleared for unauthenticated screenshots
        await page.goto(base, { waitUntil: 'domcontentloaded' });
        await page.evaluate(() => {
          localStorage.removeItem('pb:token');
          localStorage.removeItem('pb:currentUser');
        });
      }

      console.log('Navigating to', url, 'viewport', vp.name);
      await page.goto(url, { waitUntil: 'networkidle' });
      // Optionally wait for an element that indicates page is ready. Update selector if available.
      // await page.waitForSelector('#app-ready', { timeout: 5000 }).catch(()=>{});

      const name = route === '/' ? 'home' : route.replace(/\//g,'_').replace(/^_+/, '');
      const fileName = `${name}-${vp.name}${auth ? '-auth' : '-anon'}.png`;
      const outPath = path.join(outDir, fileName);
      console.log('Capturing', url, '->', outPath);
      await page.screenshot({ path: outPath, fullPage: true });
    }
  }

  await browser.close();
  console.log('Screenshots saved to', outDir);
})();
