const { extractStripeIds } = require('../server/index');

describe('extractStripeIds', () => {
  test('reads payment_intent and charge from checkout.session', () => {
    const obj = {
      object: 'checkout.session',
      payment_intent: 'pi_123',
      payment_method_types: ['card'],
      customer: 'cus_1',
      metadata: { order: '42' },
    };
    const ids = extractStripeIds(obj);
    expect(ids.paymentIntentId).toBe('pi_123');
  expect(ids.chargeId).toBeNull();
    expect(ids.canonicalId).toBe('pi_123');
  });

  test('reads charge id when present', () => {
    const obj = { object: 'charge', id: 'ch_1', payment_intent: 'pi_99' };
    const ids = extractStripeIds(obj);
    expect(ids.chargeId).toBe('ch_1');
    expect(ids.paymentIntentId).toBe('pi_99');
    expect(ids.canonicalId).toBe('pi_99');
  });

  test('falls back to invoice id when present and no pi/charge', () => {
    const obj = { object: 'invoice', id: 'in_1' };
    const ids = extractStripeIds(obj);
    expect(ids.invoiceId).toBe('in_1');
    expect(ids.canonicalId).toBe('in_1');
  });

  test('handles nested invoice.payment_intent on invoice', () => {
    const obj = { object: 'invoice', id: 'in_2', payment_intent: 'pi_777' };
    const ids = extractStripeIds(obj);
    expect(ids.paymentIntentId).toBe('pi_777');
    expect(ids.canonicalId).toBe('pi_777');
  });

  test('handles generic event with data.object', () => {
    const obj = { data: { object: { id: 'ch_abc', object: 'charge' } } };
    const ids = extractStripeIds(obj);
  expect(ids.chargeId).toBe('ch_abc');
  expect(ids.canonicalId).toBe('ch_abc');
  });
});
