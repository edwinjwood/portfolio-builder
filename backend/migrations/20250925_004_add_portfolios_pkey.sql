-- Ensure portfolios.id has a primary key so other migrations can reference it
BEGIN;

-- Add a primary key on portfolios(id) if it doesn't already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'portfolios_pkey'
  ) THEN
    ALTER TABLE portfolios ADD CONSTRAINT portfolios_pkey PRIMARY KEY (id);
  END IF;
END
$$;

COMMIT;
