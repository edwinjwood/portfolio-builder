// Lightweight Stripe client provider used by controllers so tests can mock at module level
module.exports = {
  getStripe() {
    try {
      const stripeLib = require('stripe');
      let stripe = null;
      if (typeof stripeLib === 'function') {
        try { stripe = stripeLib(process.env.STRIPE_SECRET_KEY || ''); } catch (e) { /* ignore */ }
        if (!stripe) {
          try { stripe = stripeLib(); } catch (e) { /* ignore */ }
        }
      } else if (stripeLib && stripeLib.checkout) {
        stripe = stripeLib;
      }
      return stripe || null;
    } catch (e) {
      return null;
    }
  }
};
