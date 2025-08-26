-- Migration: add canonical payment id columns and dedupe existing payments
-- Adds helper columns to link related Stripe objects (invoice, payment_intent, charge)
-- Then populates those columns and collapses duplicate logical payments into one row

BEGIN;

ALTER TABLE payments ADD COLUMN IF NOT EXISTS stripe_canonical_id VARCHAR(255);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR(255);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS stripe_charge_id VARCHAR(255);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS stripe_invoice_id VARCHAR(255);

-- Populate helper id columns from existing stripe_id and raw_event JSON
UPDATE payments SET
  stripe_payment_intent_id = COALESCE(
    stripe_payment_intent_id,
    CASE WHEN stripe_id LIKE 'pi_%' THEN stripe_id ELSE NULL END,
    NULLIF(raw_event #>> '{payment_intent}', ''),
    NULLIF(raw_event #>> '{charges,data,0,payment_intent}', '')
  ),
  stripe_charge_id = COALESCE(
    stripe_charge_id,
    CASE WHEN stripe_id LIKE 'ch_%' THEN stripe_id ELSE NULL END,
    NULLIF(raw_event #>> '{charge}', ''),
    NULLIF(raw_event #>> '{charges,data,0,id}', '')
  ),
  stripe_invoice_id = COALESCE(
    stripe_invoice_id,
    CASE WHEN stripe_id LIKE 'in_%' THEN stripe_id ELSE NULL END,
    NULLIF(raw_event #>> '{invoice}', '')
  )
WHERE stripe_payment_intent_id IS NULL OR stripe_charge_id IS NULL OR stripe_invoice_id IS NULL;

-- Compute canonical id preference: prefer invoice -> payment_intent -> charge -> raw stripe_id
UPDATE payments SET stripe_canonical_id = COALESCE(stripe_invoice_id, stripe_payment_intent_id, stripe_charge_id, stripe_id)
WHERE stripe_canonical_id IS NULL;

-- Add unique index on the canonical id to prevent future duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_stripe_canonical_id ON payments(stripe_canonical_id);

-- Collapse duplicate logical payments: keep newest row per canonical id (by updated_at) and delete the rest
WITH ranked AS (
  SELECT id, stripe_canonical_id, ROW_NUMBER() OVER (PARTITION BY stripe_canonical_id ORDER BY updated_at DESC, id ASC) AS rn
  FROM payments
  WHERE stripe_canonical_id IS NOT NULL
)
DELETE FROM payments
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

COMMIT;
