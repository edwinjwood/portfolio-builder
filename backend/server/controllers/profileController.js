const pool = require('../db');

exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const r = await pool.query('SELECT * FROM profiles WHERE user_id = $1', [userId]);
    const p = r.rows[0] || null;
    res.json(p || {});
  } catch (e) {
    console.error('getProfile error:', e.message || e);
    res.status(500).json({ error: 'Failed to load profile' });
  }
};

exports.upsertProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { degree, target_title, target_industry, strengths, about, certs, accomplishments } = req.body;
    const certs_json = Array.isArray(certs) ? certs : (typeof certs === 'string' ? null : certs);
    const accomplishments_json = Array.isArray(accomplishments) ? accomplishments : (typeof accomplishments === 'string' ? null : accomplishments);
    const sql = `INSERT INTO profiles (user_id, degree, target_title, target_industry, strengths, about, certs_json, accomplishments_json, created_at, updated_at)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8, now(), now())
                 ON CONFLICT (user_id) DO UPDATE SET
                   degree = EXCLUDED.degree,
                   target_title = EXCLUDED.target_title,
                   target_industry = EXCLUDED.target_industry,
                   strengths = EXCLUDED.strengths,
                   about = EXCLUDED.about,
                   certs_json = EXCLUDED.certs_json,
                   accomplishments_json = EXCLUDED.accomplishments_json,
                   updated_at = now()
                 RETURNING *`;
    const vals = [userId, degree || null, target_title || null, target_industry || null, strengths || null, about || null, certs_json || null, accomplishments_json || null];
    const r = await pool.query(sql, vals);
    res.json(r.rows[0]);
  } catch (e) {
    console.error('upsertProfile error:', e.message || e);
    res.status(500).json({ error: 'Failed to save profile' });
  }
};