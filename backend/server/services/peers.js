const fs = require('fs');
const path = require('path');

function splitDirs(envVal) {
  if (!envVal) return [];
  return envVal.split(':').map(s => s.trim()).filter(Boolean);
}

function listTopWordCsvs(dir) {
  const found = [];
  if (!dir || !fs.existsSync(dir)) return found;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      found.push(...listTopWordCsvs(p));
    } else if (/^top_words_.*\.csv$/i.test(e.name)) {
      found.push(p);
    }
  }
  return found;
}

// Expanded domain keywords. Keep tokens simple and inclusive; match against
// target title + industry + extracted resume text (callers pass a composite string).
const DOMAIN_KEYWORDS = [
  { domain: 'nursing', keys: ['nurse', 'nursing', 'rn', 'lpn', 'bsn', 'msn', 'clinical', 'clinic', 'health', 'healthcare', 'hospital', 'patient', 'icu', 'er', 'emr', 'epic'] },
  { domain: 'business', keys: ['business', 'business development', 'analyst', 'marketing', 'operations', 'manager', 'sales'] },
  { domain: 'civil', keys: ['civil', 'structural', 'transportation', 'pavement', 'geotech'] },
  { domain: 'mechanical', keys: ['mechanical', 'mechatronics'] },
  { domain: 'electrical', keys: ['electrical', 'power systems', 'substation', 'pcb'] },
  { domain: 'csce', keys: ['computer engineering', 'computer science', 'software', 'cs', 'embedded', 'it', 'information technology'] },
  { domain: 'engineering', keys: ['engineering', 'engineer'] },
  { domain: 'chef', keys: ['chef', 'culinary', 'kitchen', 'cook', 'line cook', 'sous chef', 'pastry'] },
  { domain: 'accounting', keys: ['accountant', 'accounting', 'cpa', 'audit'] },
  { domain: 'aviation', keys: ['aviation', 'aircraft', 'pilot', 'airline', 'faa'] },
  { domain: 'banking', keys: ['bank', 'banking', 'loan', 'mortgage'] },
  { domain: 'hr', keys: ['human resources', 'hr', 'recruiting', 'talent acquisition', 'payroll'] },
  { domain: 'construction', keys: ['construction', 'estimator', 'superintendent', 'foreman'] },
  { domain: 'designer', keys: ['designer', 'graphic design', 'ux', 'ui', 'product design'] },
];

function pickDomain(text = '') {
  const t = String(text).toLowerCase();
  for (const d of DOMAIN_KEYWORDS) {
    if (d.keys.some(k => t.includes(k))) return d.domain;
  }
  return null;
}

function findPeerCsvForTitle(text) {
  const domain = pickDomain(text) || 'generic';
  // Directories to scan
  const dirs = [];
  if (process.env.PEERSET_OUT_DIR) dirs.push(process.env.PEERSET_OUT_DIR);
  if (process.env.CAPSTONE_DIR) dirs.push(process.env.CAPSTONE_DIR);
  const extra = splitDirs(process.env.PEERSETS_EXTRA_DIRS || '/home/droski/Desktop/School/Fall25/Capstone/data:/home/droski/Desktop/School/Fall25/Capstone/data/More:/home/droski/Desktop/School/Fall25/Capstone/csv');
  dirs.push(...extra);

  // Scan for top_words_*.csv
  const candidates = [];
  for (const d of dirs) candidates.push(...listTopWordCsvs(d));
  if (!candidates.length) return null;

  // Choose by domain token if possible; do NOT fall back to unrelated file
  for (const p of candidates) {
    const low = p.toLowerCase();
    if (domain !== 'generic' && low.includes(domain)) { return p; }
  }
  // If domain is CS/CE, allow heuristic fallback to student resumes
  if (domain === 'csce') {
    for (const p of candidates) {
      const low = p.toLowerCase();
      if (low.includes('student') || low.includes('resume')) return p;
    }
  }
  return null;
}

module.exports = { findPeerCsvForTitle, pickDomain };
