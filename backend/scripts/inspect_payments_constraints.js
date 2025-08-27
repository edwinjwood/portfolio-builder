// Inspect payments table constraints to debug migration error
const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  try {
    console.log('Connected to DB:', !!process.env.DATABASE_URL);

    const cols = await pool.query("SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name='payments' ORDER BY ordinal_position");
    console.log('\nColumns:');
    console.log(cols.rows);

    const pk = await pool.query("SELECT a.attname as column_name FROM pg_index i JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey) WHERE i.indrelid = 'public.payments'::regclass AND i.indisprimary");
    console.log('\nPrimary key columns:');
    console.log(pk.rows);

    const indexes = await pool.query("SELECT indexname, indexdef FROM pg_indexes WHERE tablename='payments'");
    console.log('\nIndexes:');
    console.log(indexes.rows);

    const fks = await pool.query("SELECT conname, pg_get_constraintdef(oid) as def FROM pg_constraint WHERE contype='f' AND conrelid = 'public.payments'::regclass");
    console.log('\nForeign keys FROM payments (outgoing):');
    console.log(fks.rows);

    const incoming = await pool.query("SELECT conname, pg_get_constraintdef(oid) as def FROM pg_constraint WHERE contype='f' AND confrelid = 'public.payments'::regclass");
    console.log('\nForeign keys TO payments (incoming):');
    console.log(incoming.rows);

    await pool.end();
  } catch (err) {
    console.error('Error:', err.message || err);
    process.exit(1);
  }
})();
