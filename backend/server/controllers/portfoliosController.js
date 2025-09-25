const pool = require('../db');

function normalizePortfolio(row) {
  if (!row) return null;
  const createdAt = row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at;
  const updatedAt = row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at;
  return {
    id: row.id,
    name: row.name,
    templateId: row.template_id || null,
    components: Array.isArray(row.components) ? row.components : [],
    data: row.data || {},
    created_at: createdAt,
    updated_at: updatedAt,
    // Preserve previous naming for any existing consumers
    created: createdAt,
  };
}

function sanitizeComponents(components) {
  if (!Array.isArray(components)) return [];
  return components
    .map((item) => {
      if (typeof item === 'string') return item.trim();
      if (item === null || item === undefined) return '';
      return String(item).trim();
    })
    .filter(Boolean);
}

function sanitizeData(data) {
  if (!data || typeof data !== 'object') return {};
  try {
    JSON.stringify(data);
    return data;
  } catch (err) {
    console.warn('Discarding unserializable portfolio data payload', err);
    return {};
  }
}

exports.listPortfolios = async (req, res) => {
  const userId = req.user && req.user.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized.' });
  try {
    const result = await pool.query(
      `SELECT id, name, template_id, components, data, created_at, updated_at
         FROM portfolios
        WHERE user_id = $1
        ORDER BY created_at DESC`,
      [userId]
    );
    res.json(result.rows.map(normalizePortfolio));
  } catch (err) {
    console.error('Error listing portfolios', err);
    res.status(500).json({ error: 'Server error.' });
  }
};

exports.getPortfolio = async (req, res) => {
  const userId = req.user && req.user.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized.' });
  const portfolioId = req.params.id;
  try {
    const result = await pool.query(
      `SELECT id, name, template_id, components, data, created_at, updated_at
         FROM portfolios
        WHERE id = $1 AND user_id = $2`,
      [portfolioId, userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Portfolio not found.' });
    res.json(normalizePortfolio(result.rows[0]));
  } catch (err) {
    console.error('Error fetching portfolio', err);
    res.status(500).json({ error: 'Server error.' });
  }
};

exports.createPortfolio = async (req, res) => {
  const userId = req.user && req.user.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized.' });
  const { name, templateId = null, components = [], data = {} } = req.body || {};
  if (!name || !name.toString().trim()) return res.status(400).json({ error: 'Portfolio name required.' });
  const displayName = name.toString().trim();
  const normalizedComponents = sanitizeComponents(components);
  const normalizedData = sanitizeData(data);
  try {
    const result = await pool.query(
      `INSERT INTO portfolios (user_id, name, template_id, components, data)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, template_id, components, data, created_at, updated_at`,
      [userId, displayName, templateId || null, normalizedComponents, normalizedData]
    );
    res.status(201).json(normalizePortfolio(result.rows[0]));
  } catch (err) {
    console.error('Error creating portfolio', err);
    res.status(500).json({ error: 'Server error.' });
  }
};

exports.deletePortfolio = async (req, res) => {
  const userId = req.user && req.user.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized.' });
  const portfolioId = req.params.id;
  try {
    const result = await pool.query(
      'DELETE FROM portfolios WHERE id = $1 AND user_id = $2 RETURNING id',
      [portfolioId, userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Portfolio not found or not owned by user.' });
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting portfolio', err);
    res.status(500).json({ error: 'Server error.' });
  }
};
