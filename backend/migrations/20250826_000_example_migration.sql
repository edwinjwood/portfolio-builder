-- 20250826_000_example_migration.sql
-- Example: create a small table used for testing migration runner
BEGIN;

CREATE TABLE IF NOT EXISTS migration_test_table (
  id SERIAL PRIMARY KEY,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

COMMIT;
