// Quick helper: print plan_price_map rows
const path = require('path');
const dotenv = require('dotenv');
const { Pool } = require('pg');

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  try {
    const r = await pool.query('SELECT * FROM plan_price_map ORDER BY plan_key');
    console.log('plan_price_map:');
    console.dir(r.rows, { depth: 2 });
  } catch (e) {
    console.error('Failed to read plan_price_map:', e.message || e);
  } finally {
    await pool.end();
  }
})();
