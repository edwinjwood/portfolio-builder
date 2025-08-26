import React, { useState } from 'react';

// Example using Google reCAPTCHA v2 invisible or v3 token retrieval via grecaptcha
// This is a minimal example; adapt to your app's captcha setup (reCAPTCHA or hCaptcha)

export default function ResetPasswordWithCaptcha() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);
    try {
      // Obtain captcha token from grecaptcha (client must have loaded the widget)
      let captchaToken = null;
      const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
      if (siteKey && window.grecaptcha && window.grecaptcha.execute) {
        captchaToken = await window.grecaptcha.execute(siteKey, { action: 'password_reset' });
      }

      const body = { email };
      if (captchaToken) body.captchaToken = captchaToken;

  const apiBase = import.meta.env.VITE_API_URL || (typeof process !== 'undefined' && process.env.API_URL) || 'http://localhost:5001';
      const res = await fetch(`${apiBase}/api/password-reset/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Request failed');
      setMessage('If an account exists for that email, a reset link has been sent.');
    } catch (err) {
      setMessage(err.message || 'Failed to request reset');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto">
      <label className="block mb-2">Email</label>
      <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-2 border rounded mb-4" required />
      <button type="submit" disabled={loading} className="px-4 py-2 bg-brand-600 text-white rounded">{loading ? 'Sending…' : 'Send reset link'}</button>
      {message && <p className="mt-4 text-sm">{message}</p>}
    </form>
  );
}
