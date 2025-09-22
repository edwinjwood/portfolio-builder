const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const outDir = path.resolve(__dirname, '..', 'wiki', 'design', 'screenshots');
  fs.mkdirSync(outDir, { recursive: true });

  // Base URL for your running frontend. Change or set via EXPORT_BASE_URL env var.
  const base = process.env.EXPORT_BASE_URL || 'http://localhost:5173';

  // Pages to capture. Add or remove routes as needed.
  const routes = ['/', '/dashboard', '/editor', '/profile'];

  const viewports = [
    { name: 'desktop', width: 1440, height: 900 },
    { name: 'mobile', width: 390, height: 844 }
  ];

  const browser = await chromium.launch();
  const page = await browser.newPage();

  for (const route of routes) {
    const url = new URL(route, base).toString();
    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      console.log('Navigating to', url);
      await page.goto(url, { waitUntil: 'networkidle' });
      // Optionally wait for an element that indicates page is ready. Update selector if available.
      // await page.waitForSelector('#app-ready', { timeout: 5000 }).catch(()=>{});
      const name = route === '/' ? 'home' : route.replace(/\//g,'_').replace(/^_+/,'');
      const fileName = `${name}-${vp.name}.png`;
      const outPath = path.join(outDir, fileName);
      console.log('Capturing', url, '->', outPath);
      await page.screenshot({ path: outPath, fullPage: true });
    }
  }

  await browser.close();
  console.log('Screenshots saved to', outDir);
})();