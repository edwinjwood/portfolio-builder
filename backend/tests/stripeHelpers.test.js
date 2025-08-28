const { extractStripeIds } = require('../server/services/stripeHelpers');

describe('stripeHelpers.extractStripeIds', () => {
  test('returns null ids for falsy input', () => {
    expect(extractStripeIds(null)).toEqual({ paymentIntentId: null, chargeId: null, invoiceId: null, canonicalId: null });
  });

  test('unwraps event.data.object and extracts payment_intent', () => {
    const evt = { data: { object: { object: 'payment_intent', id: 'pi_123', charges: { data: [{ id: 'ch_1' }] }, invoice: 'in_1' } } };
    expect(extractStripeIds(evt)).toEqual({ paymentIntentId: 'pi_123', chargeId: 'ch_1', invoiceId: 'in_1', canonicalId: 'pi_123' });
  });

  test('handles charge object', () => {
    const ch = { object: 'charge', id: 'ch_99', payment_intent: 'pi_9', invoice: 'in_9' };
    expect(extractStripeIds(ch)).toEqual({ paymentIntentId: 'pi_9', chargeId: 'ch_99', invoiceId: 'in_9', canonicalId: 'pi_9' });
  });

  test('handles invoice object', () => {
    const inv = { object: 'invoice', id: 'in_x', payment_intent: 'pi_x', charge: { id: 'ch_x' } };
    expect(extractStripeIds(inv)).toEqual({ paymentIntentId: 'pi_x', chargeId: 'ch_x', invoiceId: 'in_x', canonicalId: 'pi_x' });
  });
});
