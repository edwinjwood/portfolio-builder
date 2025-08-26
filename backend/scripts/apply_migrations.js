// Apply SQL migrations from backend/migrations in filename order
// Records applied migrations in schema_migrations (must exist already)
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const dotenv = require('dotenv');

const backendEnv = path.resolve(__dirname, '..', '.env');
dotenv.config({ path: backendEnv });

const conn = process.env.DATABASE_URL;
if (!conn) {
  console.error('No DATABASE_URL found in backend/.env');
  process.exit(1);
}

const pool = new Pool({ connectionString: conn });

async function ensureMigrationsTable() {
  // The user already created this table in prod/staging; create if missing
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      description TEXT,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}

async function getApplied() {
  const res = await pool.query('SELECT version FROM schema_migrations');
  return new Set(res.rows.map(r => r.version));
}

async function applyMigration(filePath, fileName) {
  const sql = fs.readFileSync(filePath, 'utf8');
  const client = await pool.connect();
  try {
    console.log('Applying', fileName);
    // Run each migration inside a transaction by default; migrations that cannot
    // run inside a transaction should document that and the SQL can handle it.
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('INSERT INTO schema_migrations (version, description) VALUES ($1,$2)', [fileName, fileName]);
    await client.query('COMMIT');
    console.log('Applied', fileName);
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (e) {}
    throw err;
  } finally {
    client.release();
  }
}

(async () => {
  try {
    await ensureMigrationsTable();
    const applied = await getApplied();
    const migrationsDir = path.resolve(__dirname, '..', 'migrations');
    if (!fs.existsSync(migrationsDir)) {
      console.log('No migrations directory found at', migrationsDir);
      process.exit(0);
    }
    let files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));
    files = files.sort();
    for (const f of files) {
      if (applied.has(f)) continue;
      const p = path.join(migrationsDir, f);
      await applyMigration(p, f);
    }
    console.log('All migrations applied.');
    await pool.end();
  } catch (err) {
    console.error('Migration failed:', err.message || err);
    process.exit(1);
  }
})();
