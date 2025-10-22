const path = require('path');
const fs = require('fs');

// Base storage directory for user uploads
const STORAGE_BASE = process.env.STORAGE_BASE || path.join(__dirname, '../../storage');

// Base directory for job data
const JOBS_BASE = process.env.JOBS_BASE || path.join(__dirname, '../../jobs');

/**
 * Get the uploads directory for a specific user
 * @param {number|string} userId - The user ID
 * @returns {string} The absolute path to the user's uploads directory
 */
function getUserUploadsDir(userId) {
  const dir = path.join(STORAGE_BASE, 'users', String(userId), 'uploads');
  // Ensure directory exists
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

/**
 * Get the jobs directory for a specific job
 * @param {number|string} jobId - The job ID
 * @returns {string} The absolute path to the job directory
 */
function getJobsDir(jobId) {
  const dir = path.join(JOBS_BASE, String(jobId));
  // Ensure directory exists
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

module.exports = {
  getUserUploadsDir,
  getJobsDir,
  STORAGE_BASE,
  JOBS_BASE
};
