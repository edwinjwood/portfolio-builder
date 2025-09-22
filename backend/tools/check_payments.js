const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
(async () => {
  try {
    const cols = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='payments' ORDER BY ordinal_position");
    console.log('COLUMNS:', cols.rows);
    const dup = await pool.query("SELECT stripe_canonical_id, count(*) FROM payments GROUP BY stripe_canonical_id HAVING count(*)>1 ORDER BY count DESC LIMIT 20");
    console.log('DUPLICATES:', dup.rows);
    const total = await pool.query('SELECT count(*) AS total FROM payments');
    console.log('TOTAL:', total.rows[0]);
    const sample = await pool.query("SELECT id, stripe_id, stripe_canonical_id, stripe_payment_intent_id, stripe_charge_id, stripe_invoice_id, amount, status, updated_at FROM payments ORDER BY updated_at DESC LIMIT 10");
    console.log('SAMPLE:', sample.rows);
  } catch (e) {
    console.error('ERROR:', e);
  } finally {
    await pool.end();
  }
})();
