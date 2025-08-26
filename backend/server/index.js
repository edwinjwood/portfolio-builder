// ...existing code...
// ...existing code...
// ...existing code...

const express = require('express');
const cors = require('cors');
const logoUpload = require('./logoUpload');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const crypto = require('crypto');
const { Pool } = require('pg');
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');
const path = require('path');
const dotenv = require('dotenv');
// Load the canonical backend .env located at backend/.env (one source of truth)
const backendEnv = path.resolve(__dirname, '..', '.env');
dotenv.config({ path: backendEnv });

const app = express();
app.use(cors());
// Parse JSON bodies but keep a copy of the raw buffer for webhook verification
app.use(express.json({
  verify: (req, res, buf) => {
    // Save raw body buffer for routes that need the exact signed payload (Stripe webhooks)
    req.rawBody = buf;
  }
}));
app.use('/api', logoUpload);

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Configure mailer (optional). Provide SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in backend/.env
let mailer = null;
if (process.env.SMTP_HOST && process.env.SMTP_USER) {
  mailer = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
} else {
  console.warn('SMTP not configured. Password reset emails will be logged to console.');
}

// Stripe setup (requires STRIPE_SECRET_KEY in env)
let stripe;
try {
  const Stripe = require('stripe');
  stripe = Stripe(process.env.STRIPE_SECRET_KEY || '');
} catch (err) {
  console.warn('Stripe package not available or not configured. Payments will be disabled.');
  stripe = null;
}


// Get all users route
app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users');
    // Map users to include first_name and last_name
    res.json(result.rows.map(u => ({
      id: u.id,
      email: u.email,
      username: u.username,
      role: u.role,
      first_name: u.first_name,
      last_name: u.last_name
    })));
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// Create user (signup)
app.post('/api/users', async (req, res) => {
  const { name, email, password, plan } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required.' });
  try {
    // Check existing
    const exists = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (exists.rows[0]) return res.status(409).json({ error: 'Email already registered.' });

    const names = (name || '').split(' ');
    const first_name = names.shift() || null;
    const last_name = names.join(' ') || null;
    // Derive a username: prefer provided name parts, fallback to email local-part
    let username = (first_name && last_name) ? `${first_name}.${last_name}` : null;
    if (!username) {
      username = (email || '').split('@')[0];
    }
    // Sanitize username: allow letters, numbers, dot, underscore, hyphen; lowercase; trim to 30 chars
    username = username.toString().toLowerCase().replace(/[^a-z0-9._-]/g, '').slice(0, 30) || null;

    // Hash password before storing
    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query(`
      INSERT INTO users (username, email, password, first_name, last_name, role)
      VALUES ($1,$2,$3,$4,$5,'user')
      RETURNING id, email, username, role, first_name, last_name
    `, [username, email, hashed, first_name, last_name]);

    const user = result.rows[0];
    // Ensure every user has an initial subscription row. Default to 'individual' when not specified.
    try {
      const key = plan ? plan.toString().toLowerCase() : 'individual';
      let priceId = null;
      try {
        const pm = await pool.query('SELECT price_id FROM plan_price_map WHERE plan_key = $1 AND active = true', [key]);
        if (pm.rows[0]) priceId = pm.rows[0].price_id;
      } catch (e) {
        // ignore
      }
      await pool.query(`
        INSERT INTO subscriptions (user_id, plan_key, price_id, status, created_at, updated_at)
        VALUES ($1,$2,$3,$4, now(), now())
      `, [user.id, key, priceId, 'pending']);
    } catch (subErr) {
      console.warn('Failed to create subscription row at signup:', subErr.message);
    }
    // Optionally create a Stripe Checkout session for the selected plan so the user can complete payment
    let checkout = null;
    try {
      const key = plan ? plan.toString().toLowerCase() : null;
      if (stripe && key) {
        // try to resolve a priceId: prefer plan_price_map value we inserted/read above
        let priceId = null;
        try {
          const pm = await pool.query('SELECT price_id FROM plan_price_map WHERE plan_key = $1 AND active = true', [key]);
          if (pm.rows[0]) priceId = pm.rows[0].price_id;
        } catch (e) {
          // ignore
        }

        if (priceId) {
          // determine mode (subscription vs payment) by inspecting the price object
          let mode = 'payment';
          try {
            const priceObj = await stripe.prices.retrieve(priceId, { expand: ['product'] });
            if (priceObj && priceObj.recurring) mode = 'subscription';
          } catch (e) {
            // if retrieving price fails, default to payment
          }

          try {
            const successBase = process.env.CHECKOUT_BASE_URL || process.env.FRONTEND_URL || 'http://localhost:5173';
            // If the frontend is using a HashRouter, Stripe must redirect to a URL containing the hash
            const hashPrefix = process.env.FRONTEND_USE_HASH === 'false' ? '' : '/#';
            const session = await stripe.checkout.sessions.create({
              mode,
              payment_method_types: ['card'],
              line_items: [{ price: priceId, quantity: 1 }],
              success_url: `${successBase}${hashPrefix}/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
              cancel_url: `${successBase}${hashPrefix}/checkout-cancel`,
              customer_email: user.email,
              metadata: { userId: String(user.id), plan: key },
            });
            checkout = { url: session.url, id: session.id, mode };
            console.log('Created Checkout session at signup:', session.id, session.url);
          } catch (e) {
            console.warn('Failed to create checkout session at signup:', e.message || e);
          }
        }
      }
    } catch (err) {
      console.warn('Error while attempting to create checkout session at signup:', err.message || err);
    }

    // Sign JWT
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
    const resp = { token, user: { id: user.id, email: user.email, username: user.username, role: user.role, first_name: user.first_name, last_name: user.last_name } };
    if (checkout) resp.checkout = checkout;
    res.json(resp);
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({ error: 'Failed to create user.' });
  }
});

// Apply rate limiter middleware specifically to password reset requests
const resetIpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 6, // limit each IP to 6 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});

// Password reset request with IP limiter and per-account throttle
app.post('/api/password-reset/request', resetIpLimiter, async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required.' });
  try {
  // captcha verification is progressive and will be applied later if thresholds are met
    // Look up user once
    const r = await pool.query('SELECT id, email, first_name FROM users WHERE email = $1', [email]);
    if (!r.rows[0]) return res.status(200).json({ success: true }); // don't reveal existence
    const user = r.rows[0];

    // Per-account throttle: count recent tokens created for this user in last hour
    const countRow = await pool.query("SELECT count(*) FROM password_resets WHERE user_id = $1 AND created_at > now() - interval '1 hour'", [user.id]);
    const count = parseInt(countRow.rows[0].count || '0', 10);
    if (count >= 3) {
      // Too many requests for this account recently
      return res.status(429).json({ error: 'Too many password reset requests for this account. Try again later.' });
    }

    // Progressive CAPTCHA: require captcha only after a small number of recent requests (e.g., >=2)
    const captchaSecret = process.env.CAPTCHA_SECRET;
    const captchaProvider = (process.env.CAPTCHA_PROVIDER || 'recaptcha').toLowerCase();
    if (captchaSecret && count >= 2) {
      const token = req.body.captchaToken;
      if (!token) return res.status(400).json({ error: 'Captcha token required.' });
      let verified = false;
      try {
        let resp;
        if (captchaProvider === 'hcaptcha') {
          resp = await fetch('https://hcaptcha.com/siteverify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `secret=${encodeURIComponent(captchaSecret)}&response=${encodeURIComponent(token)}`,
          });
        } else {
          resp = await fetch('https://www.google.com/recaptcha/api/siteverify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `secret=${encodeURIComponent(captchaSecret)}&response=${encodeURIComponent(token)}`,
          });
        }
        const j = await resp.json().catch(() => null);
        if (!resp.ok) {
          console.warn('Captcha provider returned non-OK status', resp.status, j || '(no json)');
          return res.status(401).json({ error: 'Captcha provider rejected the verification request.', details: j });
        }
        verified = !!(j && j.success);
        if (!verified) {
          console.warn('Captcha verification failed', j);
          return res.status(401).json({ error: 'Captcha verification failed.', details: j });
        }
      } catch (e) {
        console.warn('Captcha verification error:', e.message || e);
        return res.status(400).json({ error: 'Captcha verification failed (exception).' });
      }
      if (!verified) return res.status(400).json({ error: 'Captcha verification failed.' });
    }

  const token = crypto.randomBytes(24).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour
  // Store only the token hash in DB for security
  await pool.query('INSERT INTO password_resets (user_id, token, expires_at) VALUES ($1,$2,$3)', [user.id, tokenHash, expiresAt]);

  const resetUrl = `${process.env.FRONTEND_URL || process.env.CHECKOUT_BASE_URL || 'http://localhost:5173'}/reset-password?token=${token}`;
    const subject = 'Password reset request';
    const text = `Hi ${user.first_name || ''},\n\nWe received a request to reset your password. Click the link below to reset it (expires in 1 hour):\n\n${resetUrl}\n\nIf you didn't request this, you can ignore this message.`;

    if (mailer) {
      await mailer.sendMail({ from: process.env.SMTP_FROM || 'no-reply@example.com', to: user.email, subject, text });
      return res.json({ success: true });
    }

  // If no SMTP configured, log the token for local debugging but do not return it to the client.
  console.log('Password reset token (no SMTP):', token, 'for user', user.email);
    return res.json({ success: true });
  } catch (err) {
    console.error('Password reset request failed:', err);
    res.status(500).json({ error: 'Failed to create reset token.' });
  }
});

// Confirm password reset: verifies token and sets new password
app.post('/api/password-reset/confirm', async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ error: 'Token and new password required.' });
  try {
  // Hash incoming token to compare with stored hash
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const r = await pool.query('SELECT id, user_id, expires_at FROM password_resets WHERE token = $1', [tokenHash]);
    const row = r.rows[0];
    if (!row) return res.status(400).json({ error: 'Invalid or expired token.' });
    if (new Date(row.expires_at) < new Date()) return res.status(400).json({ error: 'Token expired.' });

    const hashed = await bcrypt.hash(password, 10);
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashed, row.user_id]);
    // delete token
    await pool.query('DELETE FROM password_resets WHERE id = $1', [row.id]);
    return res.json({ success: true });
  } catch (err) {
    console.error('Password reset confirm failed:', err);
    res.status(500).json({ error: 'Failed to reset password.' });
  }
});

// Login route
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required.' });
  }
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }
    // Compare hashed password
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }
    // Create JWT
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// Validate JWT route
app.post('/api/validate', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided.' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [decoded.id]);
    const user = result.rows[0];
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name
      }
    });
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
});

// Get portfolios for current user
app.get('/api/portfolios', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided.' });
  }
  let userId;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    userId = decoded.id;
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
  try {
    const result = await pool.query('SELECT * FROM portfolios WHERE user_id = $1', [userId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// Get a single portfolio by ID for the current user
app.get('/api/portfolios/:id', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided.' });
  }
  let userId;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    userId = decoded.id;
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
  const portfolioId = req.params.id;
  try {
    const result = await pool.query(
      'SELECT * FROM portfolios WHERE id = $1 AND user_id = $2',
      [portfolioId, userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Portfolio not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// Create portfolio route
app.post('/api/portfolios', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided.' });
  }
  let userId;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    userId = decoded.id;
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Portfolio name required.' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO portfolios (user_id, name) VALUES ($1, $2) RETURNING *',
      [userId, name]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// Delete portfolio route
app.delete('/api/portfolios/:id', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided.' });
  }
  let userId;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    userId = decoded.id;
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
  const portfolioId = req.params.id;
  try {
    // Only delete if the portfolio belongs to the user
    const result = await pool.query(
      'DELETE FROM portfolios WHERE id = $1 AND user_id = $2 RETURNING *',
      [portfolioId, userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Portfolio not found or not owned by user.' });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// Get all templates with their components
app.get('/api/templates', async (req, res) => {
  try {
    const templates = await pool.query('SELECT * FROM templates ORDER BY id');
    const templateIds = templates.rows.map(t => t.id);
    let components = [];
    if (templateIds.length > 0) {
      const compResult = await pool.query(
        'SELECT * FROM template_components WHERE template_id = ANY($1::int[]) ORDER BY position',
        [templateIds]
      );
      components = compResult.rows;
    }
    // Group components by template_id
    const componentsByTemplate = {};
    components.forEach(c => {
      if (!componentsByTemplate[c.template_id]) componentsByTemplate[c.template_id] = [];
      componentsByTemplate[c.template_id].push(c);
    });
    // Attach components to templates
    const result = templates.rows.map(t => ({
      ...t,
      components: componentsByTemplate[t.id] || []
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// Return active Stripe prices with expanded product info
app.get('/api/stripe/prices', async (req, res) => {
  if (!stripe) return res.status(503).json({ error: 'Payments not configured.' });
  try {
    const prices = await stripe.prices.list({ limit: 100, active: true, expand: ['data.product'] });
    const mapped = prices.data.map(p => ({
      id: p.id,
      unit_amount: p.unit_amount,
      currency: p.currency,
      recurring: p.recurring || null,
      nickname: p.nickname || null,
      product: p.product ? {
        id: p.product.id,
        name: p.product.name,
        description: p.product.description,
      } : null
    }));

    // Allow fallback price IDs set in backend/.env for development or when prices
    // are managed outside Stripe listing. Configure these in backend/.env as:
    // PRICE_ID_INDIVIDUAL=price_...
    // PRICE_ID_TEAM=price_...
    // PRICE_ID_ENTERPRISE=price_...
    const fallbackEnvPrices = [];
    if (process.env.PRICE_ID_INDIVIDUAL) {
      fallbackEnvPrices.push({ id: process.env.PRICE_ID_INDIVIDUAL, unit_amount: null, currency: 'usd', recurring: null, nickname: null, product: { id: null, name: 'Individual' } });
    }
    if (process.env.PRICE_ID_TEAM) {
      fallbackEnvPrices.push({ id: process.env.PRICE_ID_TEAM, unit_amount: null, currency: 'usd', recurring: null, nickname: null, product: { id: null, name: 'Team' } });
    }
    if (process.env.PRICE_ID_ENTERPRISE) {
      fallbackEnvPrices.push({ id: process.env.PRICE_ID_ENTERPRISE, unit_amount: null, currency: 'usd', recurring: null, nickname: null, product: { id: null, name: 'Enterprise' } });
    }

    // Merge and dedupe
    const merged = mapped.slice();
    for (const fp of fallbackEnvPrices) {
      if (!merged.find(m => m.id === fp.id)) merged.push(fp);
    }

    res.json(merged);
  } catch (err) {
    console.error('Failed to fetch Stripe prices', err);
    res.status(500).json({ error: 'Failed to fetch prices' });
  }
});

// Return a mapped set of price IDs for known plans (individual, team, enterprise)
app.get('/api/stripe/price-map', async (req, res) => {
  if (!stripe) return res.status(503).json({ error: 'Payments not configured.' });
  try {
    // First, attempt to read canonical mappings from DB table `plan_price_map`
    // Expected rows: plan_key (text) PRIMARY KEY, price_id (text), active boolean
    const dbMap = {};
    try {
      const r = await pool.query('SELECT plan_key, price_id FROM plan_price_map WHERE active = true');
      r.rows.forEach(row => {
        if (row.plan_key && row.price_id) dbMap[row.plan_key.toLowerCase()] = row.price_id;
      });
    } catch (dbErr) {
      // If table doesn't exist or query fails, continue to Stripe lookup
      console.warn('plan_price_map read failed or not present:', dbErr.message);
    }

    // If DB contains all required keys, return it immediately
    const requiredKeys = ['individual', 'team', 'enterprise'];
    const hasAll = requiredKeys.every(k => !!dbMap[k]);
    if (hasAll) return res.json(dbMap);

    // Otherwise, fetch Stripe prices and try to derive missing keys
    const prices = await stripe.prices.list({ limit: 200, active: true, expand: ['data.product'] });
    const data = prices.data || [];

    const normalize = (s) => (s || '').toString().toLowerCase().trim();
    const candidates = { individual: [], team: [], enterprise: [] };

    data.forEach((p) => {
      const prod = p.product || {};
      const prodName = prod.name ? normalize(prod.name) : '';
      const nick = p.nickname ? normalize(p.nickname) : '';
      const planTag = prod.metadata && prod.metadata.plan ? normalize(prod.metadata.plan) : null;
      const id = p.id;
      const recurring = p.recurring || null;

      const tests = [];
      if (planTag) tests.push(planTag);
      if (prodName) tests.push(prodName);
      if (nick) tests.push(nick);

      ['individual', 'team', 'enterprise'].forEach((key) => {
        if (tests.some(t => t.includes(key))) candidates[key].push({ id, recurring, raw: p });
      });
    });

    const choose = (list) => {
      if (!list || list.length === 0) return null;
      const monthly = list.find(l => l.recurring && l.recurring.interval === 'month');
      if (monthly) return monthly.id;
      const anyRec = list.find(l => l.recurring);
      if (anyRec) return anyRec.id;
      return list[0].id;
    };

    const stripeMap = {
      individual: choose(candidates.individual) || null,
      team: choose(candidates.team) || null,
      enterprise: choose(candidates.enterprise) || null,
    };

    // Build final map: prefer DB values, then Stripe-derived, then env fallback
    const finalMap = {};
    for (const key of requiredKeys) {
      finalMap[key] = dbMap[key] || stripeMap[key] || process.env[`PRICE_ID_${key.toUpperCase()}`] || null;
    }

    // Upsert any discovered Stripe-derived mappings into DB for caching
    try {
      for (const key of requiredKeys) {
        const priceId = finalMap[key];
        if (!priceId) continue;
        // If DB already had it, skip
        if (dbMap[key] && dbMap[key] === priceId) continue;
        await pool.query(`
          INSERT INTO plan_price_map (plan_key, price_id, active, updated_at)
          VALUES ($1,$2,true,now())
          ON CONFLICT (plan_key) DO UPDATE SET price_id = EXCLUDED.price_id, active = EXCLUDED.active, updated_at = now()
        `, [key, priceId]);
      }
    } catch (upErr) {
      console.warn('Failed to upsert plan_price_map entries:', upErr.message);
    }

    res.json(finalMap);
  } catch (err) {
    console.error('Failed to build price map', err);
    res.status(500).json({ error: 'Failed to build price map' });
  }
});

// Create PaymentIntent for authenticated users
app.post('/api/payments/create-payment-intent', async (req, res) => {
  if (!stripe) return res.status(503).json({ error: 'Payments not configured.' });
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided.' });
  let userId;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    userId = decoded.id;
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
  const { amount, currency = 'usd' } = req.body;
  if (!amount || typeof amount !== 'number') {
    return res.status(400).json({ error: 'Amount (in cents) required as a number.' });
  }
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      metadata: { userId: String(userId) }
    });
    res.json({ clientSecret: paymentIntent.client_secret, id: paymentIntent.id });
  } catch (err) {
    console.error('Error creating PaymentIntent:', err);
    res.status(500).json({ error: 'Payment creation failed.' });
  }
});

// Admin: grouped payments view (non-destructive). Shows logical payment groups by
// stripe_canonical_id / payment_intent / charge / invoice and a heuristic fallback.
// In production this endpoint requires an admin JWT; in non-production it's open for convenience.
app.get('/admin/payments/grouped', async (req, res) => {
  try {
    // Simple admin guard: require role=admin in production
    if (process.env.NODE_ENV === 'production') {
      const auth = req.headers['authorization'];
      const token = auth && auth.split(' ')[1];
      if (!token) return res.status(401).json({ error: 'Unauthorized' });
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (!decoded || decoded.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
      } catch (e) {
        return res.status(401).json({ error: 'Invalid token' });
      }
    }

    const q = await pool.query(`SELECT id, stripe_id, stripe_canonical_id, stripe_payment_intent_id, stripe_charge_id, stripe_invoice_id, amount, status, metadata, raw_event, created_at, updated_at, user_id FROM payments ORDER BY updated_at DESC`);
    const rows = q.rows || [];

    // Initial grouping by explicit ids or heuristic
    const groups = new Map();
    const addToGroup = (key, reason, row) => {
      if (!groups.has(key)) groups.set(key, { key, reasons: new Set([reason]), payments: [], ids: new Set() });
      const g = groups.get(key);
      g.reasons.add(reason);
      g.payments.push(row);
      ['stripe_canonical_id','stripe_payment_intent_id','stripe_charge_id','stripe_invoice_id','stripe_id'].forEach(f => { if (row[f]) g.ids.add(row[f]); });
    };

    for (const r of rows) {
      if (r.stripe_canonical_id) {
        addToGroup(`canonical:${r.stripe_canonical_id}`, 'canonical', r);
        continue;
      }
      if (r.stripe_payment_intent_id) {
        addToGroup(`pi:${r.stripe_payment_intent_id}`, 'payment_intent', r);
        continue;
      }
      if (r.stripe_charge_id) {
        addToGroup(`ch:${r.stripe_charge_id}`, 'charge', r);
        continue;
      }
      if (r.stripe_invoice_id) {
        addToGroup(`in:${r.stripe_invoice_id}`, 'invoice', r);
        continue;
      }
      // heuristic: customer + amount + 5-min bucket
      let customer = null;
      try { customer = (r.raw_event && r.raw_event.customer) || (r.metadata && (r.metadata.userId || r.metadata.customer)) || null; } catch(e) { customer = null; }
      const ts = r.created_at ? Math.floor(new Date(r.created_at).getTime() / 1000 / 300) : 'no_ts';
      const hkey = `heur:${customer||'anon'}:${r.amount || 0}:${ts}`;
      addToGroup(hkey, 'heuristic', r);
    }

    // Merge groups that share any stripe ids (connected components)
    const groupKeys = Array.from(groups.keys());
    const adj = new Map();
    // build adjacency
    for (let i=0;i<groupKeys.length;i++) {
      const a = groupKeys[i];
      const aids = groups.get(a).ids;
      for (let j=i+1;j<groupKeys.length;j++) {
        const b = groupKeys[j];
        const bids = groups.get(b).ids;
        // check intersection
        let intersect = false;
        for (const id of aids) { if (bids.has(id)) { intersect = true; break; } }
        if (intersect) {
          if (!adj.has(a)) adj.set(a, new Set());
          if (!adj.has(b)) adj.set(b, new Set());
          adj.get(a).add(b); adj.get(b).add(a);
        }
      }
    }

    // find connected components
    const visited = new Set();
    const merged = [];
    for (const start of groupKeys) {
      if (visited.has(start)) continue;
      const stack = [start];
      const comp = new Set();
      while (stack.length) {
        const k = stack.pop();
        if (visited.has(k)) continue;
        visited.add(k); comp.add(k);
        const neighbors = adj.get(k);
        if (neighbors) for (const n of neighbors) if (!visited.has(n)) stack.push(n);
      }
      // merge component groups
      const mergedGroup = { keys: Array.from(comp), reasons: new Set(), payments: [], ids: new Set() };
      for (const k of comp) {
        const g = groups.get(k);
        if (!g) continue;
        g.reasons.forEach(r => mergedGroup.reasons.add(r));
        for (const p of g.payments) mergedGroup.payments.push(p);
        for (const id of g.ids) mergedGroup.ids.add(id);
      }
      // aggregate
      const total_amount = mergedGroup.payments.reduce((s,p)=>s + (p.amount||0), 0);
      const count = mergedGroup.payments.length;
      const users = Array.from(new Set(mergedGroup.payments.map(p=>p.user_id).filter(Boolean)));
      const statuses = Array.from(new Set(mergedGroup.payments.map(p=>p.status).filter(Boolean)));
      merged.push({ keys: mergedGroup.keys, reasons: Array.from(mergedGroup.reasons), count, total_amount, users, statuses, payments: mergedGroup.payments });
    }

    res.json({ groups: merged, total_payments: rows.length });
  } catch (err) {
    console.error('Failed to build grouped payments:', err);
    res.status(500).json({ error: 'Failed to build grouped payments' });
  }
});

// Admin debug: DB status and lightweight inspection
app.get('/admin/debug/db-status', async (req, res) => {
  try {
    // In production require admin JWT
    if (process.env.NODE_ENV === 'production') {
      const auth = req.headers['authorization'];
      const token = auth && auth.split(' ')[1];
      if (!token) return res.status(401).json({ error: 'Unauthorized' });
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (!decoded || decoded.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
      } catch (e) {
        return res.status(401).json({ error: 'Invalid token' });
      }
    }

    const paymentsCountR = await pool.query('SELECT count(*) FROM payments');
    const subsCountR = await pool.query("SELECT count(*) FROM subscriptions WHERE status = 'pending'");
    const recentPayments = await pool.query('SELECT id, stripe_id, stripe_canonical_id, amount, status, created_at FROM payments ORDER BY created_at DESC LIMIT 10');
    const recentSubs = await pool.query('SELECT id, user_id, plan_key, status, stripe_subscription_id, updated_at FROM subscriptions ORDER BY updated_at DESC LIMIT 10');

    res.json({ payments_total: paymentsCountR.rows[0].count, subscriptions_pending: subsCountR.rows[0].count, recentPayments: recentPayments.rows, recentSubscriptions: recentSubs.rows });
  } catch (err) {
    console.error('admin debug db-status failed:', err && (err.stack || err.message || err));
    res.status(500).json({ error: 'Failed to inspect DB' });
  }
});

// Admin debug: run migrations remotely when explicitly allowed via env var
app.post('/admin/debug/run-migrations', async (req, res) => {
  // safety: only allow when ALLOW_REMOTE_MIGRATIONS === 'true'
  if (process.env.ALLOW_REMOTE_MIGRATIONS !== 'true') {
    return res.status(403).json({ error: 'Remote migrations not enabled' });
  }
  // admin guard in production
  if (process.env.NODE_ENV === 'production') {
    const auth = req.headers['authorization'];
    const token = auth && auth.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (!decoded || decoded.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    } catch (e) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  }

  try {
    const { exec } = require('child_process');
    const cwd = path.resolve(__dirname, '..');
    exec('node ./scripts/apply_migrations.js', { cwd, maxBuffer: 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) {
        console.error('Remote migrations failed:', err && (err.stack || err.message || err));
        return res.status(500).json({ error: 'Migration runner failed', details: stderr || err.message });
      }
      res.json({ success: true, out: stdout });
    });
  } catch (e) {
    console.error('Failed to start migration process:', e && (e.stack || e.message || e));
    res.status(500).json({ error: 'Failed to start migrations' });
  }
});

// Create a Stripe Checkout Session for price-based purchases/subscriptions
app.post('/api/checkout/create-session', async (req, res) => {
  if (!stripe) return res.status(503).json({ error: 'Payments not configured.' });
  const { priceId, mode = 'payment', successUrl, cancelUrl } = req.body;
  if (!priceId) return res.status(400).json({ error: 'priceId is required.' });

  // Try to identify user from JWT if present
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  let userId = null;
  let customerEmail = null;
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      userId = decoded.id;
      const u = await pool.query('SELECT email FROM users WHERE id = $1', [userId]);
      if (u.rows[0]) customerEmail = u.rows[0].email;
    } catch (err) {
      // ignore token errors; session can be created without user
      userId = null;
    }
  }

  try {
    // Determine base URL for frontend callbacks. Prefer explicit CHECKOUT_BASE_URL, then FRONTEND_URL,
    // fallback to localhost for local development.
    const successBase = process.env.CHECKOUT_BASE_URL || process.env.FRONTEND_URL || 'http://localhost:5173';
    const hashPrefix = process.env.FRONTEND_USE_HASH === 'false' ? '' : '/#';
    const defaultSuccess = `${successBase}${hashPrefix}/checkout?session_id={CHECKOUT_SESSION_ID}`;
    const defaultCancel = `${successBase}${hashPrefix}/checkout`;

    // Try to resolve a canonical plan_key for this priceId so webhooks can update subscriptions
    let planKey = null;
    try {
      const pmRes = await pool.query('SELECT plan_key FROM plan_price_map WHERE price_id = $1 AND active = true', [priceId]);
      if (pmRes.rows[0]) planKey = pmRes.rows[0].plan_key;
    } catch (e) {
      // ignore lookup errors
    }

    const session = await stripe.checkout.sessions.create({
      mode: mode, // 'payment' or 'subscription'
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      // Force a stable locale to avoid dynamic locale module resolution on Stripe's side
      locale: 'en',
      success_url: successUrl || process.env.CHECKOUT_SUCCESS_URL || defaultSuccess,
      cancel_url: cancelUrl || process.env.CHECKOUT_CANCEL_URL || defaultCancel,
      customer_email: customerEmail || undefined,
  metadata: { userId: userId ? String(userId) : null, priceId, plan: planKey },
    });

    res.json({ url: session.url, id: session.id });
  } catch (err) {
    console.error('Error creating Checkout session:', err);
    res.status(500).json({ error: 'Failed to create checkout session.' });
  }
});

// Fetch a checkout session and return session metadata + user token if available
app.get('/api/checkout/session', async (req, res) => {
  const sessionId = req.query.session_id;
  if (!sessionId) return res.status(400).json({ error: 'session_id required' });
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
        if (user) {
          token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
        }
      } catch (e) {
        console.warn('Failed to load user for checkout session:', e.message || e);
      }
    }
    res.json({ session, user, token });
  } catch (err) {
    console.error('Error fetching checkout session:', err.message || err);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

// Stripe webhook endpoint - uses raw body for signature verification
app.post('/webhooks/stripe', async (req, res) => {
  if (!stripe) return res.status(503).send('Payments not configured.');
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    const payload = req.rawBody || (req.body && JSON.stringify(req.body));
    if (!payload) {
      console.error('No raw payload available for webhook signature verification.');
      return res.status(400).send('No payload for webhook verification.');
    }
    // Construct event using raw payload (Buffer or string)
    event = stripe.webhooks.constructEvent(payload, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Helper: compute a canonical id for related Stripe objects so different events map to the same payment row
  // Extract Stripe ids from an event object and compute a canonical id
  const extractStripeIds = (obj) => {
    if (!obj) return { canonicalId: null, paymentIntentId: null, chargeId: null, invoiceId: null };
    let paymentIntentId = null;
    let chargeId = null;
    let invoiceId = null;

    // top-level shapes
    if (typeof obj.id === 'string') {
      const id = obj.id;
      if (id.startsWith('pi_')) paymentIntentId = id;
      if (id.startsWith('ch_')) chargeId = id;
      if (id.startsWith('in_')) invoiceId = id;
    }

    // common fields
    if (!paymentIntentId && obj.payment_intent) {
      if (typeof obj.payment_intent === 'string') paymentIntentId = obj.payment_intent;
      else if (obj.payment_intent && obj.payment_intent.id) paymentIntentId = obj.payment_intent.id;
    }
    if (!chargeId && obj.charge) chargeId = obj.charge;
    if (!invoiceId && obj.invoice) invoiceId = obj.invoice;

    // nested charges array
    try {
      if (!chargeId && obj.charges && obj.charges.data && obj.charges.data[0]) {
        const c = obj.charges.data[0];
        if (c && c.id) chargeId = c.id;
        if (c && c.payment_intent) paymentIntentId = paymentIntentId || c.payment_intent;
        if (c && c.invoice) invoiceId = invoiceId || c.invoice;
      }
    } catch (e) {
      // ignore
    }

    // invoice objects sometimes embed a charge in different fields
    if (!chargeId && obj.charge) chargeId = obj.charge;

    // Determine canonical: prefer invoice -> payment_intent -> charge -> fallback to top-level id
    const canonicalId = invoiceId || paymentIntentId || chargeId || (obj && obj.id ? obj.id : null);
    return { canonicalId, paymentIntentId, chargeId, invoiceId };
  };

  // Helper: upsert a payment record using a canonical id to avoid duplicates
  const upsertPayment = async ({ canonicalId, stripeId, stripePaymentIntentId = null, stripeChargeId = null, stripeInvoiceId = null, userId = null, amount = 0, currency = 'usd', status = null, paymentMethod = null, receiptEmail = null, description = null, metadata = null, raw = null }) => {
    if (!canonicalId) canonicalId = stripeId || null;
    if (!canonicalId) return;
    try {
      // Debug: log intent to upsert so production logs surface inputs when something fails
      if (process.env.DEBUG_STRIPE_EVENTS === 'true') {
        try { console.log('upsertPayment params:', { canonicalId, stripeId, stripePaymentIntentId, stripeChargeId, stripeInvoiceId, userId, amount, currency, status }); } catch(e) { /* ignore logging errors */ }
      }

      await pool.query(`
        INSERT INTO payments (stripe_id, stripe_canonical_id, stripe_payment_intent_id, stripe_charge_id, stripe_invoice_id, user_id, amount, currency, status, payment_method, receipt_email, description, metadata, raw_event, created_at, updated_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14, now(), now())
        ON CONFLICT (stripe_canonical_id) DO UPDATE SET
          stripe_id = COALESCE(payments.stripe_id, EXCLUDED.stripe_id),
          stripe_payment_intent_id = COALESCE(payments.stripe_payment_intent_id, EXCLUDED.stripe_payment_intent_id),
          stripe_charge_id = COALESCE(payments.stripe_charge_id, EXCLUDED.stripe_charge_id),
          stripe_invoice_id = COALESCE(payments.stripe_invoice_id, EXCLUDED.stripe_invoice_id),
          user_id = COALESCE(EXCLUDED.user_id, payments.user_id),
          amount = EXCLUDED.amount,
          currency = EXCLUDED.currency,
          status = EXCLUDED.status,
          payment_method = COALESCE(EXCLUDED.payment_method, payments.payment_method),
          receipt_email = COALESCE(EXCLUDED.receipt_email, payments.receipt_email),
          description = COALESCE(EXCLUDED.description, payments.description),
          metadata = COALESCE(EXCLUDED.metadata, payments.metadata),
          raw_event = EXCLUDED.raw_event,
          updated_at = now()
      `, [stripeId, canonicalId, stripePaymentIntentId, stripeChargeId, stripeInvoiceId, userId, amount, currency, status, paymentMethod, receiptEmail, description, metadata, raw]);
      if (process.env.DEBUG_STRIPE_EVENTS === 'true') {
        try { console.log('upsertPayment succeeded for canonicalId:', canonicalId); } catch(e){ }
      }
    } catch (e) {
      // Log full error with stack so Railway logs capture DB constraint/permission errors
      console.error('Failed to upsert payment by canonical id:', canonicalId, 'error:', e && (e.stack || e.message || e));
    }
  };

  // Handle the event types you care about
  try {
    // Surface every event so we can debug missing upserts in production
    try {
      if (event && event.type) {
        console.log('Stripe webhook received:', event.type, event.id || '(no id)');
      }
    } catch (e) { /* ignore logging errors */ }
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const pi = event.data.object;
        console.log('PaymentIntent succeeded:', pi.id, 'amount:', pi.amount);
        const raw = JSON.stringify(pi);
        const metadata = pi.metadata || null;
        const paymentMethod = pi.payment_method || (pi.charges && pi.charges.data && pi.charges.data[0] && (pi.charges.data[0].payment_method || (pi.charges.data[0].payment_method_details && pi.charges.data[0].payment_method_details.type))) || null;
        const receiptEmail = pi.receipt_email || (pi.charges && pi.charges.data && pi.charges.data[0] && pi.charges.data[0].receipt_email) || null;
        const description = pi.description || null;
  const ids = extractStripeIds(pi);
  const canonicalId = ids.canonicalId || pi.id;
  await upsertPayment({ canonicalId, stripeId: pi.id, stripePaymentIntentId: ids.paymentIntentId, stripeChargeId: ids.chargeId, stripeInvoiceId: ids.invoiceId, userId: pi.metadata?.userId || null, amount: pi.amount, currency: pi.currency, status: pi.status, paymentMethod, receiptEmail, description, metadata, raw });
        break;
      }
      case 'payment_intent.payment_failed': {
        const pi = event.data.object;
        console.log('PaymentIntent failed:', pi.id, pi.last_payment_error && pi.last_payment_error.message);
        const raw = JSON.stringify(pi);
        const metadata = pi.metadata || null;
        const paymentMethod = pi.payment_method || null;
        const receiptEmail = pi.receipt_email || null;
        const description = pi.description || null;
  const ids = extractStripeIds(pi);
  const canonicalId = ids.canonicalId || pi.id;
  await upsertPayment({ canonicalId, stripeId: pi.id, stripePaymentIntentId: ids.paymentIntentId, stripeChargeId: ids.chargeId, stripeInvoiceId: ids.invoiceId, userId: pi.metadata?.userId || null, amount: pi.amount || 0, currency: pi.currency || 'usd', status: pi.status || 'failed', paymentMethod, receiptEmail, description, metadata, raw });
        break;
      }
      case 'checkout.session.completed': {
        const session = event.data.object;
  console.log('Checkout session completed:', session.id);
  try { console.log('  session.metadata:', session.metadata || {}); } catch(e){}
        try {
          const metadata = session.metadata || {};
          const userId = metadata.userId || null;
          const planKey = metadata.plan || null;
          // If we have a user and plan, mark the matching subscription active
          if (userId && planKey) {
            await pool.query(`
              UPDATE subscriptions
              SET status = $1, stripe_subscription_id = $2, updated_at = now()
              WHERE user_id = $3 AND plan_key = $4
            `, ['active', session.subscription || null, userId, planKey]);
          }
        } catch (e) {
          console.warn('Failed to activate subscription from checkout.session.completed:', e.message);
        }
        break;
      }
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
  console.log('Invoice payment succeeded:', invoice.id);
  try { console.log('  invoice.subscription:', invoice.subscription, 'invoice.metadata:', invoice.metadata || {}, 'amount_paid:', invoice.amount_paid); } catch(e){}
        try {
          const metadata = invoice.metadata || {};
          const userId = metadata.userId || null;
          const planKey = metadata.plan || null;
          // If subscription id is present, try to activate subscription rows matching subscription id
          const subId = invoice.subscription || null;
          if (userId && planKey) {
            await pool.query(`
              UPDATE subscriptions
              SET status = $1, updated_at = now(), stripe_subscription_id = COALESCE(stripe_subscription_id, $2)
              WHERE user_id = $3 AND plan_key = $4
            `, ['active', subId, userId, planKey]);
          } else if (subId) {
            await pool.query(`
              UPDATE subscriptions
              SET status = $1, updated_at = now()
              WHERE stripe_subscription_id = $2
            `, ['active', subId]);
          }
        } catch (e) {
          console.warn('Failed to activate subscription from invoice.payment_succeeded:', e.message);
        }
        break;
      }
  case 'invoice.paid': {
        // Some integrations emit invoice.paid; handle same as invoice.payment_succeeded
        const invoice = event.data.object;
  console.log('Invoice paid:', invoice.id);
  try { console.log('  invoice.subscription:', invoice.subscription, 'invoice.metadata:', invoice.metadata || {}, 'amount_paid:', invoice.amount_paid); } catch(e){}
        try {
          const metadata = invoice.metadata || {};
          const userId = metadata.userId || null;
          const planKey = metadata.plan || null;
          const subId = invoice.subscription || null;
          const raw = JSON.stringify(invoice);
          const amount = invoice.amount_paid || invoice.total || 0;
          const currency = invoice.currency || 'usd';
          const ids = extractStripeIds(invoice);
          const canonicalId = ids.canonicalId || invoice.id;
          await upsertPayment({ canonicalId, stripeId: invoice.id, stripePaymentIntentId: ids.paymentIntentId, stripeChargeId: ids.chargeId, stripeInvoiceId: ids.invoiceId, userId, amount, currency, status: invoice.paid ? 'succeeded' : 'pending', description: invoice.description || null, metadata, raw });

          if (userId && planKey) {
            await pool.query(`
              UPDATE subscriptions
              SET status = $1, updated_at = now(), stripe_subscription_id = COALESCE(stripe_subscription_id, $2)
              WHERE user_id = $3 AND plan_key = $4
            `, ['active', subId, userId, planKey]);
          } else if (subId) {
            await pool.query(`
              UPDATE subscriptions
              SET status = $1, updated_at = now()
              WHERE stripe_subscription_id = $2
            `, ['active', subId]);
          }
        } catch (e) {
          console.warn('Failed to persist invoice.paid:', e.message || e);
        }
        break;
      }
      case 'charge.succeeded': {
        const charge = event.data.object;
        console.log('Charge succeeded:', charge.id, 'amount:', charge.amount);
        try {
          const raw = JSON.stringify(charge);
          const metadata = charge.metadata || null;
          const receiptEmail = charge.receipt_email || null;
          const paymentMethod = charge.payment_method || (charge.payment_method_details && charge.payment_method_details.type) || null;
          const ids = extractStripeIds(charge);
          const canonicalId = ids.canonicalId || charge.id;
          await upsertPayment({ canonicalId, stripeId: charge.id, stripePaymentIntentId: ids.paymentIntentId, stripeChargeId: ids.chargeId, stripeInvoiceId: ids.invoiceId, userId: charge.metadata?.userId || null, amount: charge.amount, currency: charge.currency, status: charge.status || 'succeeded', paymentMethod, receiptEmail, description: charge.description || null, metadata, raw });
        } catch (e) {
          console.warn('Failed to persist charge.succeeded:', e.message || e);
        }
        break;
      }
      case 'charge.refunded': {
        const charge = event.data.object;
        console.log('Charge refunded:', charge.id);
        try {
          const raw = JSON.stringify(charge);
          const metadata = charge.metadata || null;
          const ids = extractStripeIds(charge);
          const canonicalId = ids.canonicalId || charge.id;
          await upsertPayment({ canonicalId, stripeId: charge.id, stripePaymentIntentId: ids.paymentIntentId, stripeChargeId: ids.chargeId, stripeInvoiceId: ids.invoiceId, userId: charge.metadata?.userId || null, amount: charge.amount || 0, currency: charge.currency || 'usd', status: 'refunded', description: charge.description || null, metadata, raw });
        } catch (e) {
          console.warn('Failed to persist charge.refunded:', e.message || e);
        }
        break;
      }
      case 'customer.subscription.created': {
        const sub = event.data.object;
        console.log('Customer subscription created:', sub.id);
        try {
          const metadata = sub.metadata || {};
          const userId = metadata.userId || null;
          const planKey = metadata.plan || null;
          if (userId && planKey) {
            await pool.query(`
              UPDATE subscriptions
              SET status = $1, updated_at = now(), stripe_subscription_id = $2
              WHERE user_id = $3 AND plan_key = $4
            `, ['active', sub.id, userId, planKey]);
          } else {
            // Fallback: mark any subscription with matching stripe id active
            await pool.query(`
              UPDATE subscriptions
              SET status = $1, updated_at = now()
              WHERE stripe_subscription_id = $2
            `, ['active', sub.id]);
          }
        } catch (e) {
          console.warn('Failed to activate subscription from customer.subscription.created:', e.message);
        }
        break;
      }
      default:
        // Quiet by default: only emit unhandled event logs during development
        if (process.env.NODE_ENV !== 'production' || process.env.DEBUG_STRIPE_EVENTS === 'true') {
          console.debug(`Unhandled Stripe event type: ${event.type}`);
        }
    }
  } catch (procErr) {
    console.error('Error processing webhook event:', procErr);
  }

  res.json({ received: true });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
