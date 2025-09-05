-- Migration: preserve invoice rows and add useful indexes
-- Adds columns to record merges and creates indexes on payment id columns to speed reconciliation

BEGIN;

-- Add audit columns to record merges (safe: IF NOT EXISTS)
ALTER TABLE payments ADD COLUMN IF NOT EXISTS merged_into_id INTEGER REFERENCES payments(id) ON DELETE SET NULL;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS merged_at TIMESTAMPTZ;

-- Add indexes to speed reconcile and lookups
CREATE INDEX IF NOT EXISTS idx_payments_stripe_payment_intent_id ON payments(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_charge_id ON payments(stripe_charge_id);

COMMIT;
