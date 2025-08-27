// Ensure payments.id is primary key (safe operation if no duplicates/nulls)
const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  try {
    console.log('Checking payments.id duplicates and nulls...');
    const dup = await pool.query("SELECT id, count(*) FROM payments GROUP BY id HAVING count(*)>1");
    const nulls = await pool.query("SELECT count(*) as null_count FROM payments WHERE id IS NULL");
    const total = await pool.query("SELECT count(*) as total FROM payments");
    console.log('duplicates:', dup.rows);
    console.log('null ids:', nulls.rows[0]);
    console.log('total rows:', total.rows[0]);

    if (dup.rows.length > 0) {
      console.error('Found duplicate id values. Cannot safely add primary key. Aborting.');
      process.exit(1);
    }
    if (Number(nulls.rows[0].null_count) > 0) {
      console.error('Found NULL id values. Cannot safely add primary key. Aborting.');
      process.exit(1);
    }

    // Check if primary key already exists
    const pk = await pool.query("SELECT a.attname as column_name FROM pg_index i JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey) WHERE i.indrelid = 'public.payments'::regclass AND i.indisprimary");
    if (pk.rows.length > 0) {
      console.log('Primary key already present on payments:', pk.rows.map(r => r.column_name));
      await pool.end();
      process.exit(0);
    }

    console.log('Adding PRIMARY KEY (id) to payments...');
    await pool.query('ALTER TABLE payments ADD PRIMARY KEY (id)');
    console.log('Primary key added.');
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message || err);
    process.exit(1);
  }
})();
