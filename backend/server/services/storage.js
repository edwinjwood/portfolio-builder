const path = require('path');
const fs = require('fs');

const APP_STORAGE_ROOT = process.env.APP_STORAGE_ROOT || path.resolve(__dirname, '..', '..', 'storage', 'private');

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function getUserUploadsDir(userId) {
  const p = path.join(APP_STORAGE_ROOT, 'uploads', String(userId));
  ensureDir(p);
  return p;
}

function getJobsDir(jobId) {
  const p = path.join(APP_STORAGE_ROOT, 'jobs', String(jobId));
  ensureDir(p);
  return p;
}

function getPeerSetsDir() {
  const p = path.join(APP_STORAGE_ROOT, 'peer_sets');
  ensureDir(p);
  return p;
}

module.exports = {
  APP_STORAGE_ROOT,
  ensureDir,
  getUserUploadsDir,
  getJobsDir,
  getPeerSetsDir,
};