// Run SQL migration file against DATABASE_URL in backend/.env
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const dotenv = require('dotenv');

const backendEnv = path.resolve(__dirname, '..', '.env');
dotenv.config({ path: backendEnv });

const conn = process.env.DATABASE_URL;
if (!conn) {
  console.error('DATABASE_URL not found in backend/.env');
  process.exit(1);
}

const pool = new Pool({ connectionString: conn });
const migrationFile = path.resolve(__dirname, '..', 'migrations', '002_create_subscriptions_table.sql');
if (!fs.existsSync(migrationFile)) {
  console.error('Migration file not found:', migrationFile);
  process.exit(1);
}

const sql = fs.readFileSync(migrationFile, 'utf8');

(async () => {
  const client = await pool.connect();
  try {
    console.log('Applying migration:', migrationFile);
    await client.query(sql);
    console.log('Migration applied successfully.');
  } catch (err) {
    console.error('Migration failed:', err.message || err);
    process.exitCode = 2;
  } finally {
    client.release();
    await pool.end();
  }
})();
