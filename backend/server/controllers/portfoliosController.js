const pool = require('../db');

exports.listPortfolios = async (req, res) => {
  const userId = req.user && req.user.id;
  try {
    const result = await pool.query('SELECT * FROM portfolios WHERE user_id = $1', [userId]);
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'Server error.' });
  }
};

exports.getPortfolio = async (req, res) => {
  const userId = req.user && req.user.id;
  const portfolioId = req.params.id;
  try {
    const result = await pool.query(
      'SELECT * FROM portfolios WHERE id = $1 AND user_id = $2',
      [portfolioId, userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Portfolio not found.' });
    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Server error.' });
  }
};

exports.createPortfolio = async (req, res) => {
  const userId = req.user && req.user.id;
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Portfolio name required.' });
  try {
    const result = await pool.query(
      'INSERT INTO portfolios (user_id, name) VALUES ($1, $2) RETURNING *',
      [userId, name]
    );
    res.status(201).json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Server error.' });
  }
};

exports.deletePortfolio = async (req, res) => {
  const userId = req.user && req.user.id;
  const portfolioId = req.params.id;
  try {
    const result = await pool.query(
      'DELETE FROM portfolios WHERE id = $1 AND user_id = $2 RETURNING *',
      [portfolioId, userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Portfolio not found or not owned by user.' });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Server error.' });
  }
};
