-- 20250925_001_add_portfolio_components.sql
-- Add a components JSONB column and updated_at timestamp to portfolios for onboarding persistence
BEGIN;

-- Add components column to store portfolio component JSON (MVP, can be migrated later)
ALTER TABLE IF EXISTS portfolios
  ADD COLUMN IF NOT EXISTS components JSONB;

-- Add an updated_at column to track last modification time
ALTER TABLE IF EXISTS portfolios
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- For existing rows that have a NULL components value, initialize to an empty object
UPDATE portfolios SET components = '{}'::jsonb WHERE components IS NULL;

COMMIT;
