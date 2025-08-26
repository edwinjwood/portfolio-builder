// Backfill subscriptions for users missing a subscription
const dotenv = require('dotenv');
const path = require('path');
const { Pool } = require('pg');
const backendEnv = path.resolve(__dirname, '..', '.env');
dotenv.config({ path: backendEnv });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  const client = await pool.connect();
  try {
    console.log('Finding users without subscriptions...');
    const res = await client.query(`
      SELECT u.id, u.email FROM users u
      LEFT JOIN subscriptions s ON s.user_id = u.id
      WHERE s.id IS NULL
    `);
    console.log('Found', res.rows.length, 'users without subscriptions');
    for (const u of res.rows) {
      try {
        console.log('Backfilling', u.email);
        await client.query('INSERT INTO subscriptions (user_id, plan_key, status, created_at, updated_at) VALUES ($1,$2,$3,now(),now())', [u.id, 'individual', 'active']);
      } catch (e) {
        console.warn('Failed for', u.email, e.message || e);
      }
    }
    console.log('Backfill complete');
  } catch (err) {
    console.error('Backfill failed:', err.message || err);
  } finally {
    client.release();
    await pool.end();
  }
})();
