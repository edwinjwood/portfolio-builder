/* Quick DB inspect script for users & subscriptions */
const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const conn = process.env.DATABASE_URL;
if (!conn) {
  console.error('No DATABASE_URL in backend/.env');
  process.exit(1);
}
const pool = new Pool({ connectionString: conn, ssl: { rejectUnauthorized: false } });
(async () => {
  try {
    console.log('Connecting to', conn.split('@')[1].split('/')[0]);
    const colsUsers = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position");
    const colsSubs = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'subscriptions' ORDER BY ordinal_position");
    console.log('users_columns:');
    console.table(colsUsers.rows);
    console.log('\nsubscriptions_columns:');
    console.table(colsSubs.rows);

    const users = await pool.query('SELECT * FROM users ORDER BY id DESC LIMIT 10');
    console.log('\nusers_sample (up to 10 rows):');
    console.dir(users.rows, { depth: 2, maxArrayLength: null });

    const subs = await pool.query('SELECT * FROM subscriptions ORDER BY id DESC LIMIT 20');
    console.log('\nsubscriptions_sample (up to 20 rows):');
    console.dir(subs.rows, { depth: 2, maxArrayLength: null });

    const counts = await pool.query("SELECT (SELECT count(*) FROM users) AS users_count, (SELECT count(*) FROM subscriptions) AS subscriptions_count");
    console.log('\ncounts:', counts.rows[0]);
  } catch (err) {
    console.error('Error during inspect:', err);
  } finally {
    await pool.end();
  }
})();
