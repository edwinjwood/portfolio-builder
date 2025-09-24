const { Client } = require('pg');
require('dotenv').config({ path: './.env' });

const conn = (process.env.DATABASE_URL || '').toString().trim();
console.log('Connecting with:', conn ? conn.replace(/:[^:@]+@/, ':*****@') : '(no DATABASE_URL)');

const client = new Client({ connectionString: conn, ssl: conn && !conn.includes('localhost') && !conn.includes('127.0.0.1') ? { rejectUnauthorized: false } : false });

(async () => {
  try {
    await client.connect();
    const r = await client.query('SELECT now()');
    console.log('Connected OK, time:', r.rows[0]);
    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('DB connect error:', err && (err.stack || err.message || err));
    try { await client.end(); } catch {}
    process.exit(1);
  }
})();
