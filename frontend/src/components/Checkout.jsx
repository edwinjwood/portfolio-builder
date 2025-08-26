import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

// Load stripe using publishable key from Vite env (must be prefixed with VITE_)
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const [amount, setAmount] = useState(5000); // cents
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!stripe || !elements) return;
    setLoading(true);

    try {
      const apiBase = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL
        ? import.meta.env.VITE_API_URL.replace(/\/$/, '')
        : 'http://localhost:5001';

      const token = localStorage.getItem('token');
      const res = await fetch(`${apiBase}/api/payments/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ amount: Number(amount), currency: 'usd' }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to create payment intent');
      }
      const { clientSecret } = await res.json();

      const card = elements.getElement(CardElement);
      if (!card) throw new Error('CardElement not found');

      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card },
      });

      if (result.error) {
        setError(result.error.message || 'Payment failed');
      } else if (result.paymentIntent && result.paymentIntent.status === 'succeeded') {
        setSuccess('Payment succeeded — thank you!');
      } else {
        setError('Payment did not succeed.');
      }
    } catch (err) {
      setError(err.message || 'Payment error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-6 bg-white rounded shadow">
      <h2 className="text-lg font-medium mb-4">Checkout</h2>

      <label className="block text-sm mb-2">Amount (USD cents)</label>
      <input
        type="number"
        min="1"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="w-full mb-4 px-3 py-2 border rounded"
      />

      <label className="block text-sm mb-2">Card details</label>
      <div className="mb-4 p-3 border rounded bg-gray-50">
        <CardElement options={{ hidePostalCode: true }} />
      </div>

      {error && <div className="mb-3 text-sm text-red-600">{error}</div>}
      {success && <div className="mb-3 text-sm text-green-600">{success}</div>}

      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full px-4 py-2 bg-brand-600 text-white rounded disabled:opacity-60"
      >
        {loading ? 'Processing…' : 'Pay'}
      </button>
    </form>
  );
}

export default function Checkout() {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm />
    </Elements>
  );
}
