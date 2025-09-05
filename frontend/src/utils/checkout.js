// Lightweight helper to create a Stripe Checkout Session via your backend
export async function createCheckoutSession({ priceId, mode = 'subscription', successUrl, cancelUrl }) {
  if (!priceId) throw new Error('priceId is required');

  const apiBase = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace(/\/$/, '')
    : (typeof process !== 'undefined' && process.env && process.env.API_URL) || 'http://localhost:5001';

  const token = localStorage.getItem('token');
  const res = await fetch(`${apiBase}/api/checkout/create-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ priceId, mode, successUrl, cancelUrl }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Failed to create checkout session');
  }

  const body = await res.json();
  return body; // { url, id }
}
