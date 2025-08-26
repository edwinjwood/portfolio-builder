import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function CheckoutSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const [message, setMessage] = useState('Finalizing your purchase...');

  useEffect(() => {
    // Try to read session_id from the normal query string or from the hash when using HashRouter
    let sessionId = null;
    try {
      const q = new URLSearchParams(location.search || '');
      sessionId = q.get('session_id');
    } catch (e) {
      sessionId = null;
    }
    if (!sessionId) {
      // Fallback: parse from location.hash (e.g. #/checkout-success?session_id=...)
      const h = location.hash || window.location.hash || '';
      const idx = h.indexOf('?');
      if (idx !== -1) {
        const qs = h.slice(idx + 1);
        try {
          const q2 = new URLSearchParams(qs);
          sessionId = q2.get('session_id');
        } catch (e) {
          sessionId = null;
        }
      }
    }
    if (!sessionId) {
      setMessage('No session id found. Redirecting...');
      setTimeout(() => navigate('/'), 1000);
      return;
    }

    (async () => {
      try {
  const apiBase = import.meta.env.VITE_API_URL || (typeof process !== 'undefined' && process.env.API_URL) || 'http://localhost:5001';
        const res = await fetch(`${apiBase}/api/checkout/session?session_id=${encodeURIComponent(sessionId)}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to verify session');
        // If server returned a token, store it
        if (json.token) {
          localStorage.setItem('pb:token', json.token);
        }
        setMessage('Payment complete — redirecting to your dashboard...');
        setTimeout(() => navigate('/dashboard'), 800);
      } catch (err) {
        console.error('Checkout confirmation failed:', err);
        setMessage('Could not confirm checkout. Redirecting to dashboard...');
        setTimeout(() => navigate('/dashboard'), 1200);
      }
    })();
  }, [location, navigate]);

  return (
    <main className="w-full h-full grid place-items-center">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">{message}</h2>
        <p className="text-sm text-gray-600">If you are not redirected automatically, <button className="text-brand-600" onClick={() => navigate('/dashboard')}>click here</button>.</p>
      </div>
    </main>
  );
}
