const fs = require('fs');
const path = require('path');

function scanFile(filePath) {
  const src = fs.readFileSync(filePath, 'utf8');
  const decls = new Set();
  // find function foo(...), async function foo(...)
  const funcRe = /(?:^|[\n;\s])(?:async\s+function|function)\s+([A-Za-z_$][0-9A-Za-z_$]*)\s*\(/g;
  let m;
  while ((m = funcRe.exec(src))) decls.add(m[1]);
  // find const/let/var name =
  const varRe = /(?:^|[\n;\s])(const|let|var)\s+([A-Za-z_$][0-9A-Za-z_$]*)\s*[=:]/g;
  while ((m = varRe.exec(src))) decls.add(m[2]);

  const results = [];
  for (const name of Array.from(decls).sort()) {
    const regex = new RegExp('\\b' + name + '\\b', 'g');
    const count = (src.match(regex) || []).length;
    results.push({ name, count, file: filePath });
  }
  return results;
}

function listJsFiles(dir) {
  const out = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name === 'coverage') continue;
      out.push(...listJsFiles(full));
    } else if (e.isFile() && full.endsWith('.js')) {
      out.push(full);
    }
  }
  return out;
}

const backendRoot = path.resolve(__dirname, '..');
console.log('Scanning JS files under', backendRoot);
const files = listJsFiles(backendRoot);
const allDecls = {};
for (const f of files) {
  try {
    const r = scanFile(f);
    for (const item of r) {
      if (!allDecls[item.name]) allDecls[item.name] = { name: item.name, count: 0, files: new Set() };
      allDecls[item.name].count += item.count;
      allDecls[item.name].files.add(item.file);
    }
  } catch (e) {
    console.warn('Failed to scan', f, e && e.message);
  }
}

const declared = Object.values(allDecls).map(x => ({ name: x.name, count: x.count, files: Array.from(x.files) }));
declared.sort((a, b) => a.name.localeCompare(b.name));
const unused = declared.filter(d => d.count <= 1);

console.log('\nTotal symbols found:', declared.length);
console.log('Likely unused (count <= 1):', unused.length);

const outPath = path.join(__dirname, 'unused_report.json');
fs.writeFileSync(outPath, JSON.stringify({ scannedFiles: files, declared, unused }, null, 2));
console.log('Wrote', outPath);
