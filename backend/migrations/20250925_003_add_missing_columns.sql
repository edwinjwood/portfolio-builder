-- Migration: add missing columns expected by the controller
-- Safe (uses IF EXISTS / IF NOT EXISTS) so it is okay to run multiple times.
BEGIN;

-- Ensure users has common name fields used by the code
ALTER TABLE IF EXISTS users
  ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE IF EXISTS users
  ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE IF EXISTS users
  ADD COLUMN IF NOT EXISTS last_name TEXT;
-- email is usually present; add if missing to be safe
ALTER TABLE IF EXISTS users
  ADD COLUMN IF NOT EXISTS email TEXT;

-- Ensure portfolios has template_id plus components (components migration exists but add as safe fallback)
ALTER TABLE IF EXISTS portfolios
  ADD COLUMN IF NOT EXISTS template_id INTEGER;

ALTER TABLE IF EXISTS portfolios
  ADD COLUMN IF NOT EXISTS components JSONB DEFAULT '{}'::jsonb;

ALTER TABLE IF EXISTS portfolios
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

COMMIT;
