#!/usr/bin/env node
/**
 * Build peer-set top_words_<domain>.csv files from a corpus of PDFs.
 *
 * For each immediate subdirectory under the scan roots (colon-separated),
 * this script runs the existing Python pipeline to extract text and compute
 * top_words_overall.csv, then writes a domain-named CSV into that folder.
 *
 * Usage:
 *   node backend/scripts/build_peer_sets.js
 *   PEERSETS_SCAN_DIRS="/path/A:/path/B" node backend/scripts/build_peer_sets.js
 *   DRY_RUN=1 node backend/scripts/build_peer_sets.js
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

// Location of the Python toolkit already used by the analyzer
const PY_ROOT = process.env.RESUME_AI_ROOT || '/home/droski/Desktop/School/Fall25/AI/resume_ai';
const KEYWORDS_CSV = path.join(PY_ROOT, 'resume_keywords.csv');

// Where to stage intermediate outputs
const storage = require('../server/services/storage');
const PEER_TMP_ROOT = path.join(storage.getPeerSetsDir(), 'build_tmp');
fs.mkdirSync(PEER_TMP_ROOT, { recursive: true });

const DEFAULT_SCAN_DIRS = process.env.PEERSETS_SCAN_DIRS || '/home/droski/Desktop/School/Fall25/Capstone/data';
const DRY_RUN = String(process.env.DRY_RUN || '').trim() === '1' || String(process.env.DRY_RUN || '').toLowerCase() === 'true';

function splitDirs(val) {
  return String(val || '').split(':').map(s => s.trim()).filter(Boolean);
}

function listImmediateDirs(root) {
  try {
    return fs.readdirSync(root, { withFileTypes: true })
      .filter(e => e.isDirectory())
      .map(e => path.join(root, e.name));
  } catch { return []; }
}

function countPdfs(dir) {
  try {
    return fs.readdirSync(dir).filter(f => f.toLowerCase().endsWith('.pdf')).length;
  } catch { return 0; }
}

function slugify(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

// Map folder names to domain tokens used by peers.js pickDomain()
function mapFolderToDomainToken(folderName) {
  const n = String(folderName || '').toLowerCase();
  if (/(health\s*care|healthcare|nurs)/.test(n)) return 'nursing';
  if (/business/.test(n)) return 'business';
  if (/civil/.test(n)) return 'civil';
  if (/mechanical/.test(n)) return 'mechanical';
  if (/(electrical|power)/.test(n)) return 'electrical';
  if (/(information[-_ ]technology|it)/.test(n)) return 'csce';
  if (/engineer/.test(n)) return 'engineering';
  if (/chef|culinary|cook/.test(n)) return 'chef';
  if (/account/.test(n)) return 'accounting';
  if (/aviation|aircraft|pilot/.test(n)) return 'aviation';
  if (/bank/.test(n)) return 'banking';
  if (/human[-_ ]resources|\bhr\b/.test(n)) return 'hr';
  if (/construction/.test(n)) return 'construction';
  if (/design|designer|ux|ui/.test(n)) return 'designer';
  // Fallback to sanitized folder name
  return slugify(folderName || 'generic');
}

function run(cmd, args, opts={}) {
  const res = spawnSync(cmd, args, { encoding: 'utf-8', stdio: ['ignore','pipe','pipe'], ...opts });
  return res;
}

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function buildForFolder(dir) {
  const folderName = path.basename(dir);
  const pdfCount = countPdfs(dir);
  if (pdfCount < 2) {
    console.log(`- Skipping ${folderName}: only ${pdfCount} PDFs`);
    return { skipped: true, reason: 'too_few_pdfs' };
  }
  const domainToken = mapFolderToDomainToken(folderName);
  const jobSlug = slugify(`${folderName}-${Date.now()}`);
  const jobDir = path.join(PEER_TMP_ROOT, jobSlug);
  const outDir = path.join(jobDir, 'out');
  ensureDir(outDir);

  console.log(`- Processing ${folderName} -> domain token: ${domainToken} (${pdfCount} PDFs)`);

  if (DRY_RUN) return { skipped: true, reason: 'dry_run' };

  // 1) Extract texts and keyword scores across corpus
  const kwArgs = [path.join(PY_ROOT, 'keywords.py'), '--root', dir, '--outdir', outDir, '--keywords', KEYWORDS_CSV];
  const kw = run('python3', kwArgs);
  if (kw.status !== 0) {
    console.error(`  keywords.py failed for ${folderName}:`, (kw.stderr || kw.stdout || '').toString().slice(0, 600));
    return { error: 'keywords_failed' };
  }

  // 2) Run sklearn analysis to produce cluster info + top_words_overall.csv
  const ras = run('python3', [path.join(PY_ROOT, 'resume_analysis_sklearn.py')], { cwd: jobDir });
  if (ras.status !== 0) {
    console.warn(`  resume_analysis_sklearn.py non-zero for ${folderName} (continuing):`, (ras.stderr || ras.stdout || '').toString().slice(0, 600));
  }

  const overallPath = path.join(outDir, 'top_words_overall.csv');
  if (!fs.existsSync(overallPath)) {
    console.error(`  top_words_overall.csv missing for ${folderName}`);
    return { error: 'top_words_missing' };
  }

  const destPath = path.join(dir, `top_words_${domainToken}.csv`);
  try { fs.copyFileSync(overallPath, destPath); } catch (e) {
    console.error(`  failed to write ${destPath}:`, e && (e.message || e));
    return { error: 'copy_failed' };
  }

  console.log(`  wrote ${destPath}`);
  return { ok: true, dest: destPath };
}

(function main(){
  const roots = splitDirs(DEFAULT_SCAN_DIRS);
  if (!roots.length) {
    console.error('No scan roots provided. Set PEERSETS_SCAN_DIRS or edit DEFAULT_SCAN_DIRS.');
    process.exit(2);
  }
  console.log('Building peer-set top words from roots:', roots.join(' : '));
  let built = 0, skipped = 0, errors = 0;
  for (const root of roots) {
    const subdirs = listImmediateDirs(root);
    console.log(`Scanning ${root} (${subdirs.length} subdirs)`);
    for (const d of subdirs) {
      const r = buildForFolder(d);
      if (r && r.ok) built++; else if (r && r.skipped) skipped++; else errors++;
    }
  }
  console.log(`Done. Built: ${built} | Skipped: ${skipped} | Errors: ${errors}`);
})();
