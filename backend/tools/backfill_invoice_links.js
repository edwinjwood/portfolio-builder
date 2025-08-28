const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const { Pool } = require('pg');

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('No STRIPE_SECRET_KEY in backend/.env. Aborting backfill.');
  process.exit(1);
}
const stripeClient = require('../server/services/stripeClient');
const stripe = stripeClient.getStripe();
if (!stripe) {
  console.error('Stripe client could not be initialized. Aborting backfill.');
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async function main() {
  try {
    console.log('Querying payments with invoice ids missing PI/charge...');
    const res = await pool.query("SELECT id, stripe_id, stripe_invoice_id, stripe_payment_intent_id, stripe_charge_id FROM payments WHERE stripe_invoice_id IS NOT NULL AND (stripe_payment_intent_id IS NULL OR stripe_charge_id IS NULL)");
    const rows = res.rows || [];
    console.log('Found', rows.length, 'rows to inspect');
    let updated = 0;

    for (const r of rows) {
      const { id, stripe_invoice_id } = r;
      if (!stripe_invoice_id) continue;
      try {
  // latest_charge can't be expanded on some invoice shapes; expand payment_intent and lines only
  const invoice = await stripe.invoices.retrieve(stripe_invoice_id, { expand: ['payment_intent', 'lines.data'] });
        // extract payment_intent id
        let pi = invoice.payment_intent;
        if (pi && typeof pi === 'object') pi = pi.id || null;
  // try invoice.charge (string) first; some invoices expose charge id here
  let charge = invoice.charge || null;
        if (charge && typeof charge === 'object') charge = charge.id || null;

        // if we have pi but no charge, fetch PI to get a charge id
        if (!charge && pi) {
          try {
            const piObj = await stripe.paymentIntents.retrieve(pi);
            if (piObj && piObj.charges && piObj.charges.data && piObj.charges.data[0]) {
              charge = piObj.charges.data[0].id;
            } else if (piObj && piObj.latest_charge) {
              charge = typeof piObj.latest_charge === 'string' ? piObj.latest_charge : (piObj.latest_charge && piObj.latest_charge.id) || null;
            }
          } catch (e) {
            // ignore per-row fetch errors
            console.warn('Failed to fetch PaymentIntent for', pi, e && e.message);
          }
        }

        // If neither found, try to inspect invoice.lines for hints (some SDKs embed metadata)
        if (!pi && !charge && invoice.lines && invoice.lines.data && invoice.lines.data[0]) {
          const first = invoice.lines.data[0];
          if (first && first.parent && first.parent.subscription) {
            // nothing to do here for PI/charge, but could be useful later
          }
        }

        if (pi || charge) {
          // update the payments row conservatively: only set if NULL
          const upd = await pool.query(`
            UPDATE payments SET
              stripe_payment_intent_id = COALESCE(stripe_payment_intent_id, $1),
              stripe_charge_id = COALESCE(stripe_charge_id, $2),
              stripe_canonical_id = COALESCE($1, stripe_invoice_id, $2, stripe_id),
              updated_at = now()
            WHERE id = $3
            RETURNING id, stripe_payment_intent_id, stripe_charge_id, stripe_invoice_id, stripe_canonical_id
          `, [pi, charge, id]);
          if (upd.rows && upd.rows[0]) {
            updated++;
            console.log('Updated payment id', id, '->', upd.rows[0]);
          }
        } else {
          console.log('No PI/charge found for invoice', stripe_invoice_id);
        }
      } catch (e) {
        console.warn('Error retrieving invoice', stripe_invoice_id, e && e.message);
      }
    }

    console.log('Backfill complete. Updated rows:', updated);

    // final dedupe pass: ensure unique canonical index and remove duplicates keeping newest
    try {
      await pool.query(`WITH ranked AS (
        SELECT id, stripe_canonical_id, ROW_NUMBER() OVER (PARTITION BY stripe_canonical_id ORDER BY updated_at DESC, id ASC) AS rn
        FROM payments
        WHERE stripe_canonical_id IS NOT NULL
      )
      DELETE FROM payments WHERE id IN (SELECT id FROM ranked WHERE rn > 1)`);
      console.log('Dedupe pass complete.');
    } catch (e) {
      console.warn('Dedupe pass failed:', e && e.message);
    }

    // show final counts
    const final = await pool.query('SELECT count(*) AS total FROM payments');
    console.log('Payments total after backfill/dedupe:', final.rows[0].total);
  } catch (err) {
    console.error('Backfill failed:', err && err.stack || err);
  } finally {
    await pool.end();
  }
})();
