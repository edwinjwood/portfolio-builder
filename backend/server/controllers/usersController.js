const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const pool = require('../db');
const config = require('../config');
const mailer = require('../mailer');
const { verifyCaptcha } = require('../services/captcha');

const JWT_SECRET = config.JWT_SECRET;


exports.listUsers = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users');
    res.json(result.rows.map(u => ({ id: u.id, email: u.email, username: u.username, role: u.role, first_name: u.first_name, last_name: u.last_name })));
  } catch (err) {
    console.error('listUsers error:', err && (err.stack || err.message || err));
    // If the error is a connection refusal to the DB (common with transient network issues
    // or when running concurrently with a DB that hasn't become available yet), return
    // an empty array for development convenience so the frontend can still load.
    const msg = (err && (err.message || err.stack || '')).toString();
    if (msg.includes('ECONNREFUSED') || (err && err.name === 'AggregateError')) {
      console.warn('Database unreachable (ECONNREFUSED). Returning empty users list for dev.');
      return res.json([]);
    }
    res.status(500).json({ error: 'Server error.' });
  }
};

exports.createUser = async (req, res) => {
  const { name, email, password, plan } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required.' });
  try {
    const exists = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (exists.rows[0]) return res.status(409).json({ error: 'Email already registered.' });

    const names = (name || '').split(' ');
    const first_name = names.shift() || null;
    const last_name = names.join(' ') || null;
    let username = (first_name && last_name) ? `${first_name}.${last_name}` : null;
    if (!username) username = (email || '').split('@')[0];
    username = username.toString().toLowerCase().replace(/[^a-z0-9._-]/g, '').slice(0, 30) || null;

    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query(`INSERT INTO users (username, email, password, first_name, last_name, role) VALUES ($1,$2,$3,$4,$5,'user') RETURNING id, email, username, role, first_name, last_name`, [username, email, hashed, first_name, last_name]);
    const user = result.rows[0];

    // Create initial subscription row (best-effort)
    try {
      const key = plan ? plan.toString().toLowerCase() : 'individual';
      let priceId = null;
      try { const pm = await pool.query('SELECT price_id FROM plan_price_map WHERE plan_key = $1 AND active = true', [key]); if (pm.rows[0]) priceId = pm.rows[0].price_id; } catch(e) {}
      await pool.query(`INSERT INTO subscriptions (user_id, plan_key, price_id, status, created_at, updated_at) VALUES ($1,$2,$3,$4, now(), now())`, [user.id, key, priceId, 'pending']);
    } catch (subErr) { console.warn('Failed to create subscription row at signup:', subErr.message); }

    // Try to create checkout session (best-effort) — the original index.js logged warnings on failure
    let checkout = null;
    try {
      const stripe = require('../services/stripeClient').getStripe();
      const key = plan ? plan.toString().toLowerCase() : null;
      if (key) {
        let priceId = null;
        try { const pm = await pool.query('SELECT price_id FROM plan_price_map WHERE plan_key = $1 AND active = true', [key]); if (pm.rows[0]) priceId = pm.rows[0].price_id; } catch (e) {}
        if (priceId) {
          let mode = 'payment';
          try { const priceObj = await stripe.prices.retrieve(priceId, { expand: ['product'] }); if (priceObj && priceObj.recurring) mode = 'subscription'; } catch (e) {}
          try {
            const successBase = process.env.CHECKOUT_BASE_URL || process.env.FRONTEND_URL || 'http://localhost:5173';
            const hashPrefix = process.env.FRONTEND_USE_HASH === 'false' ? '' : '/#';
            const session = await stripe.checkout.sessions.create({ mode, payment_method_types: ['card'], line_items: [{ price: priceId, quantity: 1 }], success_url: `${successBase}${hashPrefix}/checkout-success?session_id={CHECKOUT_SESSION_ID}`, cancel_url: `${successBase}${hashPrefix}/checkout-cancel`, customer_email: user.email, metadata: { userId: String(user.id), plan: key } });
            checkout = { url: session.url, id: session.id, mode };
            console.log('Created Checkout session at signup:', session.id, session.url);
          } catch (e) { console.warn('Failed to create checkout session at signup:', e.message || e); }
        }
      }
    } catch (err) { console.warn('Error while attempting to create checkout session at signup:', err.message || err); }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
    const resp = { token, user: { id: user.id, email: user.email, username: user.username, role: user.role, first_name: user.first_name, last_name: user.last_name } };
    if (checkout) resp.checkout = checkout;
    res.json(resp);
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({ error: 'Failed to create user.' });
  }
};

exports.requestPasswordReset = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required.' });
  try {
    const r = await pool.query('SELECT id, email, first_name FROM users WHERE email = $1', [email]);
    if (!r.rows[0]) return res.status(200).json({ success: true });
    const user = r.rows[0];
    const countRow = await pool.query("SELECT count(*) FROM password_resets WHERE user_id = $1 AND created_at > now() - interval '1 hour'", [user.id]);
    const count = parseInt(countRow.rows[0].count || '0', 10);
    if (count >= 3) return res.status(429).json({ error: 'Too many password reset requests for this account. Try again later.' });

    if (process.env.CAPTCHA_SECRET && count >= 2) {
      try {
        await verifyCaptcha(req.body.captchaToken);
      } catch (e) {
        const details = e.details || e.message || null;
        return res.status(401).json({ error: 'Captcha verification failed.', details });
      }
    }

    const token = crypto.randomBytes(24).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60);
    await pool.query('INSERT INTO password_resets (user_id, token, expires_at) VALUES ($1,$2,$3)', [user.id, tokenHash, expiresAt]);
    const resetUrl = `${process.env.FRONTEND_URL || process.env.CHECKOUT_BASE_URL || 'http://localhost:5173'}/reset-password?token=${token}`;
    const subject = 'Password reset request';
    const text = `Hi ${user.first_name || ''},\n\nWe received a request to reset your password. Click the link below to reset it (expires in 1 hour):\n\n${resetUrl}\n\nIf you didn't request this, you can ignore this message.`;
    try {
      await mailer.sendMail({ from: process.env.SMTP_FROM || 'no-reply@example.com', to: user.email, subject, text });
      return res.json({ success: true });
    } catch (e) {
      // mailer may be a noop or fail; log and return success to avoid exposing existence
      console.log('Password reset token (no SMTP):', token, 'for user', user.email);
      return res.json({ success: true });
    }
  } catch (err) {
    console.error('Password reset request failed:', err);
    res.status(500).json({ error: 'Failed to create reset token.' });
  }
};

exports.confirmPasswordReset = async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ error: 'Token and new password required.' });
  try {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const r = await pool.query('SELECT id, user_id, expires_at FROM password_resets WHERE token = $1', [tokenHash]);
    const row = r.rows[0];
    if (!row) return res.status(400).json({ error: 'Invalid or expired token.' });
    if (new Date(row.expires_at) < new Date()) return res.status(400).json({ error: 'Token expired.' });
    const hashed = await bcrypt.hash(password, 10);
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashed, row.user_id]);
    await pool.query('DELETE FROM password_resets WHERE id = $1', [row.id]);
    return res.json({ success: true });
  } catch (err) {
    console.error('Password reset confirm failed:', err);
    res.status(500).json({ error: 'Failed to reset password.' });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required.' });
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid credentials.' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials.' });
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, user: { id: user.id, email: user.email, username: user.username, role: user.role, first_name: user.first_name, last_name: user.last_name } });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
};

exports.validate = async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided.' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [decoded.id]);
    const user = result.rows[0];
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ user: { id: user.id, email: user.email, username: user.username, role: user.role, first_name: user.first_name, last_name: user.last_name } });
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
};
