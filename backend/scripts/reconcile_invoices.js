const dotenv = require('dotenv');
const path = require('path');
const { Pool } = require('pg');

// Load backend .env by default so DATABASE_URL and STRIPE_SECRET_KEY are available
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const stripeClient = require('../server/services/stripeClient');
const stripe = stripeClient.getStripe();
if (!stripe) {
  console.error('Stripe client not configured. Aborting.');
  process.exit(1);
}


const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const argv = require('minimist')(process.argv.slice(2));
const APPLY = !!argv.apply || !!argv.a;
const APPLY_HEUR = !!argv['apply-heuristic'] || !!argv.h;
const TARGET = argv.invoice || argv.i || null; // single invoice id optional
const LIMIT = argv.limit || argv.l || null;
const FORCE = !!argv.force || !!argv.f;

async function reconcileInvoiceRow(row, { apply, applyHeuristic }) {
  const invoiceId = row.stripe_invoice_id;
  const res = { rowId: row.id, invoiceId, found: false, actions: [] };
  try {
    const inv = await stripe.invoices.retrieve(invoiceId, { expand: ['payment_intent'] });
    if (inv && inv.payment_intent) {
      const pi = inv.payment_intent;
      const chargeId = (pi && pi.latest_charge) ? pi.latest_charge : (pi.charges && pi.charges.data && pi.charges.data[0] && pi.charges.data[0].id) || null;
      res.found = true;
      res.actions.push({ type: 'link_via_invoice', payment_intent: pi.id, charge: chargeId, status: pi.status });
      if (apply) {
        // If a canonical row for this payment_intent already exists elsewhere,
        // merge invoice data into that canonical row and remove this invoice-only row.
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          // find existing canonical by payment_intent or canonical id
          const candQ = await client.query(`SELECT id FROM payments WHERE stripe_payment_intent_id = $1 OR stripe_canonical_id = $1 LIMIT 1`, [pi.id]);
            if (candQ.rows.length > 0) {
            const candId = candQ.rows[0].id;
            await client.query(`
              UPDATE payments
              SET stripe_payment_intent_id = COALESCE(stripe_payment_intent_id, $1),
                  stripe_charge_id = COALESCE(stripe_charge_id, $2),
                  status = COALESCE(NULLIF($3,''), status),
                  updated_at = now()
              WHERE id = $4
            `, [pi.id, chargeId, (pi.status || ''), candId]);
            // preserve the invoice row for auditability: mark it as merged
            await client.query(`
              UPDATE payments
              SET stripe_canonical_id = $1,
                  merged_into_id = $2,
                  merged_at = now(),
                  updated_at = now()
              WHERE id = $3
            `, [pi.id, candId, row.id]);
            res.actions.push({ applied_merge_into: candId });
          } else {
            // no existing canonical: update this invoice row to include the PI and become canonical
            await client.query(`
              UPDATE payments
              SET stripe_payment_intent_id = COALESCE(stripe_payment_intent_id, $1),
                  stripe_charge_id = COALESCE(stripe_charge_id, $2),
                  stripe_canonical_id = COALESCE($1, stripe_canonical_id),
                  status = COALESCE(NULLIF($3,''), status),
                  updated_at = now()
              WHERE id = $4
            `, [pi.id, chargeId, (pi.status || ''), row.id]);
            res.actions.push({ applied: true });
          }
          await client.query('COMMIT');
        } catch (e) {
          try { await client.query('ROLLBACK'); } catch(_) {}
          throw e;
        } finally {
          client.release();
        }
      }
      return res;
    }
  } catch (e) {
    // Preserve the message for the summary, but also emit detailed logs so
    // Railway cron output contains the Stripe error fields (statusCode, code,
    // requestId, etc.) for debugging network/auth issues.
    const errMsg = e && (e.message || e.stack || String(e));
    res.error = errMsg;
    try {
      console.error('Stripe error details:', {
        message: e && e.message,
        type: e && e.type,
        code: e && e.code,
        statusCode: e && e.statusCode,
        requestId: e && e.requestId,
        raw: e && e.raw,
        stack: e && e.stack
      });
    } catch (logErr) {
      // Fallback to simple logging if structured logging fails
      console.error('Stripe error (string):', String(e));
    }
    return res;
  }

  // If no direct PI found on invoice, optionally attempt conservative heuristic
  if (applyHeuristic) {
    // Attempt to find a candidate payment by matching amount and recent time window
    try {
      const candQ = await pool.query(`
        SELECT id, stripe_payment_intent_id, stripe_charge_id, amount, stripe_canonical_id, created_at
        FROM payments
        WHERE stripe_payment_intent_id IS NOT NULL AND amount = $1
        ORDER BY updated_at DESC
        LIMIT 10
      `, [row.amount]);
      const candidates = candQ.rows || [];
      if (candidates.length > 0) {
        // pick the most recent candidate
        const c = candidates[0];
        res.actions.push({ type: 'heuristic_match', candidate: c });
        if (apply) {
          // Merge the invoice row into the candidate canonical payment inside a transaction
          const client = await pool.connect();
          try {
            await client.query('BEGIN');
            // update candidate with any missing info
            await client.query(`
              UPDATE payments
              SET stripe_payment_intent_id = COALESCE(stripe_payment_intent_id, $1),
                  stripe_charge_id = COALESCE(stripe_charge_id, $2),
                  status = COALESCE(NULLIF($3,''), status),
                  updated_at = now()
              WHERE id = $4
            `, [c.stripe_payment_intent_id, c.stripe_charge_id, 'succeeded', c.id]);
            // delete invoice-only row
            await client.query('DELETE FROM payments WHERE id = $1', [row.id]);
            await client.query('COMMIT');
            res.actions.push({ applied_heuristic_merge_into: c.id });
          } catch (e) {
            try { await client.query('ROLLBACK'); } catch(_) {}
            throw e;
          } finally {
            client.release();
          }
        }
      } else {
        res.actions.push({ type: 'heuristic_no_match' });
      }
    } catch (he) {
      res.error = he && (he.message || he.stack || String(he));
    }
  } else {
    res.actions.push({ type: 'no_pi_on_invoice', reason: 'no direct link, heuristic disabled' });
  }

  return res;
}

async function main() {
  try {
    // Safety guard: prevent accidental destructive runs in production unless explicitly enabled
    if (APPLY && process.env.RECONCILER_APPLY_ENABLED !== 'true' && !FORCE) {
      console.error('RECONCILER_APPLY_ENABLED is not true. Destructive apply prevented. Set env RECONCILER_APPLY_ENABLED=true or pass --force to override.');
      process.exit(3);
    }
    const qText = `SELECT id, stripe_id, stripe_invoice_id, stripe_payment_intent_id, stripe_charge_id, amount FROM payments WHERE stripe_invoice_id IS NOT NULL AND (stripe_payment_intent_id IS NULL OR stripe_charge_id IS NULL)`;
    let q;
    if (TARGET) {
      q = await pool.query(qText + ' AND stripe_invoice_id = $1', [TARGET]);
    } else {
      // apply optional limit to the number of invoice rows processed per run
      if (LIMIT) {
        // ensure LIMIT is an integer
        const n = parseInt(LIMIT, 10);
        if (isNaN(n) || n <= 0) {
          console.error('Invalid --limit value, must be a positive integer');
          process.exit(4);
        }
        q = await pool.query(qText + ' LIMIT ' + n);
      } else {
        q = await pool.query(qText);
      }
    }
    const rows = q.rows || [];
    console.log('Found', rows.length, 'invoice rows to inspect');
    const results = [];
    for (const r of rows) {
      const out = await reconcileInvoiceRow(r, { apply: APPLY, applyHeuristic: APPLY_HEUR });
      console.log('Invoice', r.stripe_invoice_id, '->', out.actions);
      results.push(out);
    }
    await pool.end();
    console.log('Done. Summary:');
    console.log(JSON.stringify(results, null, 2));
    process.exit(0);
  } catch (e) {
    console.error('Reconcile script failed:', e && (e.stack || e.message || e));
    try { await pool.end(); } catch(_) {}
    process.exit(2);
  }
}

main();
