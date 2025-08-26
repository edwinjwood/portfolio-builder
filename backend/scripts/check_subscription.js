// Check subscriptions for a given user email
const dotenv = require('dotenv');
const path = require('path');
const { Pool } = require('pg');

const backendEnv = path.resolve(__dirname, '..', '.env');
dotenv.config({ path: backendEnv });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const email = process.argv[2];
if (!email) {
  console.error('Usage: node check_subscription.js <email>');
  process.exit(1);
}

(async () => {
  const client = await pool.connect();
  try {
    const u = await client.query('SELECT id,email,first_name FROM users WHERE email = $1', [email]);
    if (!u.rows[0]) {
      console.log('No user found for', email);
      return;
    }
    const user = u.rows[0];
    console.log('User:', user);
    const subs = await client.query('SELECT * FROM subscriptions WHERE user_id = $1', [user.id]);
    console.log('Subscriptions:', subs.rows);
  } catch (err) {
    console.error('Error checking subscription:', err.message || err);
  } finally {
    client.release();
    await pool.end();
  }
})();
