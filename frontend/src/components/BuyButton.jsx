import React, { useState } from 'react';
import { createCheckoutSession } from '../utils/checkout';

export default function BuyButton({ priceId, mode = 'subscription', label = 'Buy', className = '' }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleClick = async () => {
    setError('');
    setLoading(true);
    try {
      // Guard against placeholder price IDs left from development
      if (!priceId || priceId.includes('placeholder')) {
        throw new Error('This plan is not available for purchase (no price configured).');
      }
      const { url } = await createCheckoutSession({ priceId, mode });
      if (url) window.location.href = url;
    } catch (err) {
      setError(err.message || 'Failed to start checkout');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {error && <div className="mb-2 text-sm text-red-600">{error}</div>}
      <button onClick={handleClick} disabled={loading} className={`px-4 py-2 rounded bg-brand-600 text-white ${className}`}>
        {loading ? 'Redirecting…' : label}
      </button>
    </div>
  );
}
