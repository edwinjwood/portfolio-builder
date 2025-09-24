const jwt = require('jsonwebtoken');
const pool = require('../db');
const config = require('../config');

exports.createSession = async (req, res) => {
  const { priceId, mode = 'payment', successUrl, cancelUrl } = req.body;
  if (!priceId) return res.status(400).json({ error: 'priceId is required.' });
  const stripeClient = require('../services/stripeClient');
  const stripe = stripeClient.getStripe();
  if (!stripe) return res.status(503).json({ error: 'Payments not configured.' });
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  let userId = null;
  let customerEmail = null;
  if (token) {
    try {
      const decoded = jwt.verify(token, config.JWT_SECRET);
      userId = decoded.id;
      const u = await pool.query('SELECT email FROM users WHERE id = $1', [userId]);
      if (u.rows[0]) customerEmail = u.rows[0].email;
    } catch { userId = null; }
  }
  try {
    const successBase = process.env.CHECKOUT_BASE_URL || process.env.FRONTEND_URL || 'http://localhost:5173';
    const hashPrefix = process.env.FRONTEND_USE_HASH === 'false' ? '' : '/#';
    const defaultSuccess = `${successBase}${hashPrefix}/checkout?session_id={CHECKOUT_SESSION_ID}`;
    const defaultCancel = `${successBase}${hashPrefix}/checkout`;
    let planKey = null;
    try { const pmRes = await pool.query('SELECT plan_key FROM plan_price_map WHERE price_id = $1 AND active = true', [priceId]); if (pmRes.rows[0]) planKey = pmRes.rows[0].plan_key; } catch {}
  const session = await stripe.checkout.sessions.create({ mode, payment_method_types: ['card'], line_items: [{ price: priceId, quantity: 1 }], locale: 'en', success_url: successUrl || process.env.CHECKOUT_SUCCESS_URL || defaultSuccess, cancel_url: cancelUrl || process.env.CHECKOUT_CANCEL_URL || defaultCancel, customer_email: customerEmail || undefined, metadata: { userId: userId ? String(userId) : null, priceId, plan: planKey } });
    res.json({ url: session.url, id: session.id });
  } catch (err) {
    console.error('Error creating Checkout session:', err);
    res.status(500).json({ error: 'Failed to create checkout session.' });
  }
};

exports.getSession = async (req, res) => {
  const sessionId = req.query.session_id;
  if (!sessionId) return res.status(400).json({ error: 'session_id required' });
  const stripeClient = require('../services/stripeClient');
  const stripe = stripeClient.getStripe();
  if (!stripe) return res.status(503).json({ error: 'Payments not configured' });
  try {
  const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['subscription', 'payment_intent'] });
    const metadata = session.metadata || {};
    let user = null;
    let token = null;
    if (metadata.userId) {
      try {
        const r = await pool.query('SELECT id, email, username, role, first_name, last_name FROM users WHERE id = $1', [metadata.userId]);
        user = r.rows[0] || null;
        if (user) token = jwt.sign({ id: user.id, email: user.email, role: user.role }, config.JWT_SECRET, { expiresIn: '1h' });
      } catch (e) { console.warn('Failed to load user for checkout session:', e.message || e); }
    }
    res.json({ session, user, token });
  } catch (err) {
    console.error('Error fetching checkout session:', err.message || err);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
};
