const { extractStripeIds, upsertPayment } = require('../services/stripeHelpers');
const pool = require('../db');
const stripeClient = require('../services/stripeClient');

module.exports.handleStripe = async (req, res) => {
  const stripe = stripeClient.getStripe();
  if (!stripe) return res.status(503).send('Payments not configured.');
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    const payload = req.rawBody || (req.body && JSON.stringify(req.body));
    if (!payload) return res.status(400).send('No payload for webhook verification.');
    event = stripe.webhooks.constructEvent(payload, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  try {
    try { if (event && event.type) console.log('Stripe webhook received:', event.type, event.id || '(no id)'); } catch {}
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const pi = event.data.object;
        console.log('PaymentIntent succeeded:', pi.id, 'amount:', pi.amount);
        try {
          const metadata = pi.metadata || null;
          const ids = extractStripeIds(pi);
          const canonicalId = ids.canonicalId || (pi && pi.id);
          const chargeId = ids.chargeId || (pi && pi.charges && pi.charges.data && pi.charges.data[0] && pi.charges.data[0].id) || null;
          const amount = (pi && pi.amount) || (pi && pi.charges && pi.charges.data && pi.charges.data[0] && pi.charges.data[0].amount) || 0;
          const currency = (pi && pi.currency) || 'usd';
          const status = (pi && pi.status) || 'succeeded';
          const userForPayment = metadata.userId || (pi && pi.metadata && pi.metadata.userId) || null;
          await upsertPayment({ canonicalId, stripeId: (pi && pi.id), stripePaymentIntentId: ids.paymentIntentId || (pi && pi.id) || null, stripeChargeId: chargeId, stripeInvoiceId: ids.invoiceId || null, userId: userForPayment, amount, currency, status, paymentMethod: (pi && pi.payment_method) || null, receiptEmail: (pi && pi.receipt_email) || null, description: (pi && pi.description) || null, metadata: metadata || (pi && pi.metadata) || null, raw: JSON.stringify(pi) });
        } catch (_e) { console.warn('Failed to upsert payment from payment_intent.succeeded:', _e && (_e.stack || _e.message || _e)); }
        break;
      }
      case 'invoice.payment_succeeded':
      case 'invoice.paid': {
        const invoice = event.data.object;
        console.log('Invoice succeeded/paid:', invoice.id);
        try {
          const metadata = invoice.metadata || {};
          const userId = metadata.userId || null;
          const planKey = metadata.plan || null;
          const subId = invoice.subscription || null;
          const raw = JSON.stringify(invoice);
          const amount = invoice.amount_paid || invoice.total || 0;
          const currency = invoice.currency || 'usd';
          const ids = extractStripeIds(invoice);
          const canonicalId = ids.canonicalId || invoice.id;
          await upsertPayment({ canonicalId, stripeId: invoice.id, stripePaymentIntentId: ids.paymentIntentId, stripeChargeId: ids.chargeId, stripeInvoiceId: ids.invoiceId, userId, amount, currency, status: invoice.paid ? 'succeeded' : 'pending', description: invoice.description || null, metadata, raw });
          if (userId && planKey) {
            await pool.query(`UPDATE subscriptions SET status = $1, updated_at = now(), stripe_subscription_id = COALESCE(stripe_subscription_id, $2) WHERE user_id = $3 AND plan_key = $4`, ['active', subId, userId, planKey]);
          } else if (subId) {
            await pool.query(`UPDATE subscriptions SET status = $1, updated_at = now() WHERE stripe_subscription_id = $2`, ['active', subId]);
          }
        } catch (_e) { console.warn('Failed to persist invoice event:', _e.message || _e); }
        break;
      }
      case 'charge.succeeded': {
        const charge = event.data.object;
        console.log('Charge succeeded:', charge.id, 'amount:', charge.amount);
        try {
          const raw = JSON.stringify(charge);
          const metadata = charge.metadata || null;
          const receiptEmail = charge.receipt_email || null;
          const paymentMethod = charge.payment_method || (charge.payment_method_details && charge.payment_method_details.type) || null;
          const ids = extractStripeIds(charge);
          const canonicalId = ids.canonicalId || charge.id;
          let userIdForCharge = charge.metadata?.userId || null;
          if (!userIdForCharge) {
            try {
              if (ids.paymentIntentId || charge.payment_intent) {
                const piId = ids.paymentIntentId || charge.payment_intent;
                const piObj = await stripe.paymentIntents.retrieve(piId);
                userIdForCharge = piObj && piObj.metadata && piObj.metadata.userId ? piObj.metadata.userId : userIdForCharge;
                if (!userIdForCharge && piObj && piObj.customer) {
                  const cust = await stripe.customers.retrieve(piObj.customer);
                  userIdForCharge = cust && cust.metadata && cust.metadata.userId ? cust.metadata.userId : userIdForCharge;
                }
              } else if (charge.customer) {
                const cust = await stripe.customers.retrieve(charge.customer);
                userIdForCharge = cust && cust.metadata && cust.metadata.userId ? cust.metadata.userId : userIdForCharge;
              }
            } catch { /* ignore lookup failures */ }
          }
          await upsertPayment({ canonicalId, stripeId: charge.id, stripePaymentIntentId: ids.paymentIntentId, stripeChargeId: ids.chargeId, stripeInvoiceId: ids.invoiceId, userId: userIdForCharge, amount: charge.amount, currency: charge.currency, status: charge.status || 'succeeded', paymentMethod, receiptEmail, description: charge.description || null, metadata, raw });
        } catch (_e) { console.warn('Failed to persist charge.succeeded:', _e.message || _e); }
        break;
      }
      case 'charge.refunded': {
        const charge = event.data.object;
        try {
          const raw = JSON.stringify(charge);
          const metadata = charge.metadata || null;
          const ids = extractStripeIds(charge);
          const canonicalId = ids.canonicalId || charge.id;
          await upsertPayment({ canonicalId, stripeId: charge.id, stripePaymentIntentId: ids.paymentIntentId, stripeChargeId: ids.chargeId, stripeInvoiceId: ids.invoiceId, userId: charge.metadata?.userId || null, amount: charge.amount || 0, currency: charge.currency || 'usd', status: 'refunded', description: charge.description || null, metadata, raw });
        } catch (_e) { console.warn('Failed to persist charge.refunded:', _e.message || _e); }
        break;
      }
      case 'customer.subscription.created': {
        const sub = event.data.object;
        try {
          const metadata = sub.metadata || {};
          const userId = metadata.userId || null;
          const planKey = metadata.plan || null;
          if (userId && planKey) {
            await pool.query(`UPDATE subscriptions SET status = $1, updated_at = now(), stripe_subscription_id = $2 WHERE user_id = $3 AND plan_key = $4`, ['active', sub.id, userId, planKey]);
          } else {
            await pool.query(`UPDATE subscriptions SET status = $1, updated_at = now() WHERE stripe_subscription_id = $2`, ['active', sub.id]);
          }
        } catch (_e) { console.warn('Failed to activate subscription from customer.subscription.created:', _e.message); }
        break;
      }
      default:
        if (process.env.NODE_ENV !== 'production' || process.env.DEBUG_STRIPE_EVENTS === 'true') console.debug(`Unhandled Stripe event type: ${event.type}`);
    }
  } catch (procErr) {
    console.error('Error processing webhook event:', procErr);
  }
  res.json({ received: true });
};
