const path = require('path');
const dotenv = require('dotenv');

// Load backend .env (project-level then server-level) early so modules that depend on
// environment variables (db, stripe, etc.) always see them regardless of require order.
try {
  const envPaths = [path.resolve(__dirname, '..', '..', '.env'), path.resolve(__dirname, '..', '.env')];
  for (const p of envPaths) {
    try {
      const r = dotenv.config({ path: p });
      if (!r.error) break;
    } catch {
      // ignore and try next
    }
  }
} catch {
  // ignore
}

// Centralized process lifecycle logging for easier debugging during development.
process.on('exit', (code) => {
  try { console.error('Process exiting with code:', code); } catch {}
});
process.on('uncaughtException', (err) => {
  try { console.error('Uncaught exception:', err && (err.stack || err)); } catch {}
});
process.on('unhandledRejection', (reason) => {
  try { console.error('Unhandled rejection:', reason && (reason.stack || reason)); } catch {}
});

// No exports; requiring this module performs early setup.
