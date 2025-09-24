let fetchImpl = null;
if (typeof fetch !== 'undefined') {
  fetchImpl = fetch;
} else {
  try {
    fetchImpl = require('node-fetch');
  } catch {
    fetchImpl = null;
  }
}

async function verifyCaptcha(token) {
  const captchaSecret = process.env.CAPTCHA_SECRET;
  const provider = (process.env.CAPTCHA_PROVIDER || 'recaptcha').toLowerCase();
  if (!captchaSecret) throw new Error('Captcha not configured');
  if (!token) throw new Error('Captcha token required');

  let url;
  let body;
  if (provider === 'hcaptcha') {
    url = 'https://hcaptcha.com/siteverify';
    body = `secret=${encodeURIComponent(captchaSecret)}&response=${encodeURIComponent(token)}`;
  } else {
    url = 'https://www.google.com/recaptcha/api/siteverify';
    body = `secret=${encodeURIComponent(captchaSecret)}&response=${encodeURIComponent(token)}`;
  }

  if (!fetchImpl) throw new Error('No fetch implementation available for captcha verification');
  const resp = await fetchImpl(url, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
  if (!resp.ok) throw new Error('Captcha provider rejected request');
  const j = await resp.json().catch(() => null);
  if (!j || !j.success) {
    const err = new Error('Captcha verification failed');
    err.details = j;
    throw err;
  }
  return true;
}

module.exports = { verifyCaptcha };
