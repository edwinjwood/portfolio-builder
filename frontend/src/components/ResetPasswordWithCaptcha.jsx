import React, { useState, useEffect, useRef } from 'react';

// Example using Google reCAPTCHA v2 invisible or v3 token retrieval via grecaptcha
// This is a minimal example; adapt to your app's captcha setup (reCAPTCHA or hCaptcha)

export default function ResetPasswordWithCaptcha() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const widgetIdRef = useRef(null);
  const hcaptchaContainerRef = useRef(null);

  // Helper to execute hcaptcha widget and return token
  const executeHcaptcha = () => new Promise((resolve, reject) => {
    try {
      if (widgetIdRef.current == null) return reject(new Error('hCaptcha widget not rendered'));
      window.hcaptcha.execute(widgetIdRef.current).then((token) => resolve(token)).catch(reject);
    } catch (e) {
      reject(e);
    }
  });

  useEffect(() => {
    const hcaptchaKey = import.meta.env.VITE_HCAPTCHA_SITE_KEY;
    if (!hcaptchaKey) return;
    // render hCaptcha widget explicitly into hidden container
    const renderWidget = async () => {
      try {
        if (!window.hcaptcha) {
          const s = document.createElement('script');
          s.src = 'https://hcaptcha.com/1/api.js?render=explicit';
          s.async = true;
          document.head.appendChild(s);
          await new Promise(r => { s.onload = r; s.onerror = r; });
        }
        if (!hcaptchaContainerRef.current) return;
        try {
          const id = window.hcaptcha.render(hcaptchaContainerRef.current, { sitekey: hcaptchaKey, size: 'invisible' });
          widgetIdRef.current = id;
        } catch (e) {
          // ignore render errors
        }
      } catch (e) {
        // ignore load/render failures
      }
    };
    renderWidget();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);
    try {
      // Obtain captcha token from configured provider (reCAPTCHA or hCaptcha)
      let captchaToken = null;
      const recaptchaKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
      const hcaptchaKey = import.meta.env.VITE_HCAPTCHA_SITE_KEY;

      // Helper to load a script dynamically
      const loadScript = (src) => new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) return resolve();
        const s = document.createElement('script');
        s.src = src;
        s.async = true;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error(`Failed to load script: ${src}`));
        document.head.appendChild(s);
      });

      // If reCAPTCHA is configured and available, use it
      if (recaptchaKey && window.grecaptcha && window.grecaptcha.execute) {
        captchaToken = await window.grecaptcha.execute(recaptchaKey, { action: 'password_reset' });
      } else if (hcaptchaKey) {
        // Use hCaptcha: ensure script loaded and widget rendered
        // widgetIdRef and containerRef are set up in useEffect
        if (!window.hcaptcha) {
          try {
            // render=explicit ensures we can programmatically render a widget
            await loadScript('https://hcaptcha.com/1/api.js?render=explicit');
          } catch (e) {
            throw new Error('Failed to load hCaptcha script');
          }
        }
        // Wait for widget to be ready (rendered by useEffect)
        const waitForWidget = () => new Promise((resolve, reject) => {
          const start = Date.now();
          (function poll() {
            if (widgetIdRef.current != null) return resolve();
            if (Date.now() - start > 5000) return reject(new Error('hCaptcha widget not ready'));
            setTimeout(poll, 100);
          })();
        });
        await waitForWidget();
        captchaToken = await executeHcaptcha();
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
      {/* Hidden container for hCaptcha widget (rendered only if site key present) */}
      <div ref={hcaptchaContainerRef} style={{ display: 'none' }} id="hcaptcha-container" />
      <label className="block mb-2">Email</label>
      <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-2 border rounded mb-4" required />
      <button type="submit" disabled={loading} className="px-4 py-2 bg-brand-600 text-white rounded">{loading ? 'Sending…' : 'Send reset link'}</button>
      {message && <p className="mt-4 text-sm">{message}</p>}
    </form>
  );
}
