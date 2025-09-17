const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

(async () => {
  const inDir = path.resolve(__dirname, '..', 'wiki', 'design', 'screenshots');
  const outDir = path.resolve(inDir, 'annotated');
  fs.mkdirSync(outDir, { recursive: true });

  const files = fs.readdirSync(inDir).filter(f => /\.(png|jpg|jpeg)$/i.test(f));
  for (const f of files) {
    const inputPath = path.join(inDir, f);
    const outPath = path.join(outDir, f.replace(/\.(png|jpg|jpeg)$/i, '-annotated.png'));
    // Label text: filename without extension
    const label = f.replace(/\.(png|jpg|jpeg)$/i, '');

    const img = sharp(inputPath);
    const meta = await img.metadata();
    const width = meta.width || 1200;
    const overlayHeight = Math.round(Math.max(36, width * 0.04));

    // Create overlay PNG with semi-transparent background and white text
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${overlayHeight}">
      <rect x="0" y="0" width="100%" height="100%" fill="rgba(17,24,39,0.6)"/>
      <text x="16" y="${overlayHeight - 12}" font-family="Arial, Helvetica, sans-serif" font-size="${Math.round(overlayHeight*0.5)}" fill="#ffffff">${label}</text>
    </svg>`;

    const overlay = Buffer.from(svg);
    await img.composite([{ input: overlay, top: 0, left: 0 }]).toFile(outPath);
    console.log('Wrote', outPath);
  }
})();