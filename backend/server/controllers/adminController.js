const jwt = require('jsonwebtoken');
const pool = require('../db');
const path = require('path');
const config = require('../config');

exports.dbStatus = async (req, res) => {
  try {
    // In production require admin JWT
    if (process.env.NODE_ENV === 'production') {
      const auth = req.headers['authorization'];
      const token = auth && auth.split(' ')[1];
      if (!token) return res.status(401).json({ error: 'Unauthorized' });
      try {
        const decoded = jwt.verify(token, config.JWT_SECRET);
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
};

exports.runMigrations = async (req, res) => {
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
      const decoded = jwt.verify(token, config.JWT_SECRET);
      if (!decoded || decoded.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    } catch (e) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  }

  try {
    const { exec } = require('child_process');
    const cwd = path.resolve(__dirname, '..', '..');
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
};
