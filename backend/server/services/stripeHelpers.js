const pool = require('../db');

const extractStripeIds = (obj) => {
  if (!obj) return { paymentIntentId: null, chargeId: null, invoiceId: null, canonicalId: null };
  // Unwrap common wrapper shapes like event.data.object
  if (obj.data && obj.data.object) obj = obj.data.object;
  let paymentIntentId = null, chargeId = null, invoiceId = null;
  // PaymentIntent
  if (obj.object === 'payment_intent') {
    paymentIntentId = obj.id;
    chargeId = (obj.charges && obj.charges.data && obj.charges.data[0] && obj.charges.data[0].id) || null;
    invoiceId = obj.invoice || null;
  } else if (obj.object === 'charge') {
    paymentIntentId = obj.payment_intent || null;
    chargeId = obj.id;
    invoiceId = obj.invoice || null;
  } else if (obj.object === 'invoice') {
    paymentIntentId = obj.payment_intent || null;
    chargeId = (obj.charge && obj.charge.id) || null;
    invoiceId = obj.id;
  } else if (obj.payment_intent) {
    paymentIntentId = obj.payment_intent;
    chargeId = obj.charge || null;
    invoiceId = obj.invoice || null;
  }
  const canonicalId = paymentIntentId || chargeId || invoiceId || null;
  return { paymentIntentId, chargeId, invoiceId, canonicalId };
};

const upsertPayment = async ({ canonicalId, stripeId, stripePaymentIntentId = null, stripeChargeId = null, stripeInvoiceId = null, userId = null, amount = 0, currency = 'usd', status = null, paymentMethod = null, receiptEmail = null, description = null, metadata = null, raw = null }) => {
  // Keep compatibility with the original function signature in index.js
  try {
    // Basic upsert heuristic: attempt update by stripe id or create new row
    if (!canonicalId) canonicalId = null;
    // First, try to find an existing canonical payment by stripe ids
    const whereClauses = [];
    const params = [];
    if (stripeId) { params.push(stripeId); whereClauses.push(`stripe_id = $${params.length}`); }
    if (stripePaymentIntentId) { params.push(stripePaymentIntentId); whereClauses.push(`stripe_payment_intent_id = $${params.length}`); }
    if (stripeChargeId) { params.push(stripeChargeId); whereClauses.push(`stripe_charge_id = $${params.length}`); }
    if (stripeInvoiceId) { params.push(stripeInvoiceId); whereClauses.push(`stripe_invoice_id = $${params.length}`); }

    let existing = null;
    if (whereClauses.length > 0) {
      const q = `SELECT * FROM payments WHERE ${whereClauses.join(' OR ')} LIMIT 1`;
      const r = await pool.query(q, params);
      existing = r.rows[0];
    }

    if (existing) {
      // update existing
      const updParams = [amount, currency, status, paymentMethod, receiptEmail, description, metadata ? JSON.stringify(metadata) : null, raw ? JSON.stringify(raw) : null, existing.id];
      await pool.query(`UPDATE payments SET amount = $1, currency = $2, status = $3, payment_method = $4, receipt_email = $5, description = $6, metadata = $7, raw_event = $8, updated_at = now() WHERE id = $9`, updParams);
      return existing.id;
    }

    // Insert new payment
  const insertParams = [canonicalId, stripeId, stripePaymentIntentId, stripeChargeId, stripeInvoiceId, userId, amount, currency, status, paymentMethod, receiptEmail, description, metadata ? JSON.stringify(metadata) : null, raw ? JSON.stringify(raw) : null];
  const insertSql = `INSERT INTO payments (stripe_canonical_id, stripe_id, stripe_payment_intent_id, stripe_charge_id, stripe_invoice_id, user_id, amount, currency, status, payment_method, receipt_email, description, metadata, raw_event, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14, now(), now()) RETURNING id`;
    const res = await pool.query(insertSql, insertParams);
    return res.rows[0] && res.rows[0].id;
  } catch (err) {
    console.error('upsertPayment failed:', err);
    throw err;
  }
};

module.exports = { extractStripeIds, upsertPayment };
