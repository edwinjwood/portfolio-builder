-- Migration: add unique constraint on payments.stripe_id
-- This migration is safe to run multiple times; it checks for existence first.

DO $$
BEGIN
  -- If payments table doesn't exist, skip
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments') THEN
    RAISE NOTICE 'payments table not found, skipping unique constraint creation';
  ELSE
    -- If the constraint already exists, skip
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'payments_stripe_id_unique'
    ) THEN
      ALTER TABLE payments ADD CONSTRAINT payments_stripe_id_unique UNIQUE (stripe_id);
      RAISE NOTICE 'Added payments_stripe_id_unique constraint';
    ELSE
      RAISE NOTICE 'payments_stripe_id_unique already exists, skipping';
    END IF;
  END IF;
END$$;
