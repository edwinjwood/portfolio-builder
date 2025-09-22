-- Migration: conservative reconciliation of invoice -> payment_intent/charge relationships
-- Strategy:
-- 1) For invoice rows missing a linked payment_intent, try to find a payments row whose raw_event contains the payment_intent or charge id referenced in the invoice (text containment).
-- 2) If that fails, attempt a match by customer + amount + created timestamp within a small window (5 minutes).
-- 3) Recompute stripe_canonical_id preferring payment_intent, then invoice, then charge, then stripe_id.
-- 4) Remove duplicates keeping newest row per canonical id.

BEGIN;

-- 1) Direct containment match: if invoice raw JSON references a known payment_intent or charge, adopt that payment's ids
UPDATE payments inv
SET
  stripe_payment_intent_id = COALESCE(inv.stripe_payment_intent_id, pay.stripe_payment_intent_id),
  stripe_charge_id = COALESCE(inv.stripe_charge_id, pay.stripe_charge_id),
  stripe_canonical_id = COALESCE(inv.stripe_canonical_id, pay.stripe_payment_intent_id, pay.stripe_invoice_id, pay.stripe_charge_id)
FROM payments pay
WHERE inv.stripe_invoice_id IS NOT NULL
  AND (inv.stripe_payment_intent_id IS NULL OR inv.stripe_payment_intent_id = '')
  AND pay.id <> inv.id
  AND (
    (inv.raw_event::text ILIKE '%' || pay.stripe_payment_intent_id || '%' AND pay.stripe_payment_intent_id IS NOT NULL)
    OR (inv.raw_event::text ILIKE '%' || pay.stripe_charge_id || '%' AND pay.stripe_charge_id IS NOT NULL)
    OR (pay.raw_event::text ILIKE '%' || inv.stripe_id || '%' )
  );

-- 2) Customer + amount + timestamp proximity matching (conservative):
UPDATE payments inv
SET
  stripe_payment_intent_id = COALESCE(inv.stripe_payment_intent_id, pay.stripe_payment_intent_id),
  stripe_charge_id = COALESCE(inv.stripe_charge_id, pay.stripe_charge_id),
  stripe_canonical_id = COALESCE(inv.stripe_canonical_id, pay.stripe_payment_intent_id, pay.stripe_invoice_id, pay.stripe_charge_id)
FROM payments pay
WHERE inv.stripe_invoice_id IS NOT NULL
  AND (inv.stripe_payment_intent_id IS NULL OR inv.stripe_payment_intent_id = '')
  AND pay.id <> inv.id
  AND (inv.raw_event->>'customer') IS NOT NULL
  AND (pay.raw_event->>'customer') IS NOT NULL
  AND inv.raw_event->>'customer' = pay.raw_event->>'customer'
  AND (COALESCE((inv.raw_event->>'amount_paid')::bigint, (inv.raw_event->>'total')::bigint, inv.amount::bigint) = COALESCE(pay.amount::bigint, (pay.raw_event->>'amount')::bigint))
  AND (
    CASE WHEN (inv.raw_event->>'created') IS NOT NULL AND (pay.raw_event->>'created') IS NOT NULL
         THEN abs( (inv.raw_event->>'created')::bigint - (pay.raw_event->>'created')::bigint ) < 300
         ELSE false END
  );

-- 3) Recompute canonical id where missing or inconsistent
UPDATE payments SET stripe_canonical_id = COALESCE(stripe_payment_intent_id, stripe_invoice_id, stripe_charge_id, stripe_id)
WHERE stripe_canonical_id IS NULL OR stripe_canonical_id = '';

-- 4) Ensure unique index exists and remove duplicates keeping newest
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_stripe_canonical_id ON payments(stripe_canonical_id);

WITH ranked AS (
  SELECT id, stripe_canonical_id, ROW_NUMBER() OVER (PARTITION BY stripe_canonical_id ORDER BY updated_at DESC, id ASC) AS rn
  FROM payments
  WHERE stripe_canonical_id IS NOT NULL
)
DELETE FROM payments
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

COMMIT;
