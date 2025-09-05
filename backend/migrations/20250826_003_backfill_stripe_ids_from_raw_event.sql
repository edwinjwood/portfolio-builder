-- Migration: backfill stripe_payment_intent_id, stripe_charge_id, stripe_invoice_id from raw_event JSON
BEGIN;

-- Populate payment_intent id when present in raw_event.id or raw_event.latest_charge/payment_intent fields
UPDATE payments SET
  stripe_payment_intent_id = COALESCE(stripe_payment_intent_id, NULLIF(raw_event->>'id',''))
WHERE stripe_payment_intent_id IS NULL AND (raw_event->>'id') IS NOT NULL AND (raw_event->>'id') LIKE 'pi_%';

-- If raw_event has a nested payment_intent id inside JSON (as string in object id), try to extract
UPDATE payments SET
  stripe_payment_intent_id = COALESCE(stripe_payment_intent_id, NULLIF(raw_event#>>'{payment_intent}',''))
WHERE stripe_payment_intent_id IS NULL AND raw_event#>>'{payment_intent}' IS NOT NULL;

-- For charges, extract top-level id or nested charges.data[0].id
UPDATE payments SET
  stripe_charge_id = COALESCE(stripe_charge_id, NULLIF(raw_event->>'id',''))
WHERE stripe_charge_id IS NULL AND (raw_event->>'id') IS NOT NULL AND (raw_event->>'id') LIKE 'ch_%';

UPDATE payments SET
  stripe_charge_id = COALESCE(stripe_charge_id, NULLIF(raw_event#>>'{charges,data,0,id}',''))
WHERE stripe_charge_id IS NULL AND raw_event#>>'{charges,data,0,id}' IS NOT NULL;

-- For invoices, extract top-level id
UPDATE payments SET
  stripe_invoice_id = COALESCE(stripe_invoice_id, NULLIF(raw_event->>'id',''))
WHERE stripe_invoice_id IS NULL AND (raw_event->>'id') IS NOT NULL AND (raw_event->>'id') LIKE 'in_%';

-- Some payment_intent objects have latest_charge field; populate charge id
UPDATE payments SET
  stripe_charge_id = COALESCE(stripe_charge_id, NULLIF(raw_event->>'latest_charge',''))
WHERE stripe_charge_id IS NULL AND raw_event->>'latest_charge' IS NOT NULL;

-- Recompute canonical id and dedupe again
UPDATE payments SET stripe_canonical_id = COALESCE(stripe_invoice_id, stripe_payment_intent_id, stripe_charge_id, stripe_id)
WHERE stripe_canonical_id IS NULL OR stripe_canonical_id = '';

-- Ensure unique index exists
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_stripe_canonical_id ON payments(stripe_canonical_id);

-- Remove duplicates keeping newest
WITH ranked AS (
  SELECT id, stripe_canonical_id, ROW_NUMBER() OVER (PARTITION BY stripe_canonical_id ORDER BY updated_at DESC, id ASC) AS rn
  FROM payments
  WHERE stripe_canonical_id IS NOT NULL
)
DELETE FROM payments
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

COMMIT;
