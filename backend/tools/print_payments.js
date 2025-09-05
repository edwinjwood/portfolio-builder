// Print recent payments and subscriptions for debugging
const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const conn = process.env.DATABASE_URL;
if (!conn) {
  console.error('No DATABASE_URL in backend/.env');
  process.exit(1);
}
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
(async () => {
  try {
    console.log('Connecting to', conn.split('@')[1].split('/')[0]);
    const subs = await pool.query('SELECT * FROM subscriptions ORDER BY id DESC LIMIT 50');
    console.log('\nsubscriptions (latest 50):');
    console.dir(subs.rows, { depth: 2 });

    const payments = await pool.query('SELECT * FROM payments ORDER BY id DESC LIMIT 50');
    console.log('\npayments (latest 50):');
    console.dir(payments.rows, { depth: 2 });
  } catch (err) {
    console.error('Error during inspect:', err);
  } finally {
    await pool.end();
  }
})();
