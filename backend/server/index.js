// ...existing code...
// ...existing code...
// ...existing code...

const express = require('express');
const cors = require('cors');
const logoUpload = require('./logoUpload');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const crypto = require('crypto');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api', logoUpload);

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const pool = new Pool({ connectionString: process.env.DATABASE_URL });


// Get all users route
app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
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
    // For demo: compare plaintext password (replace with hash in production)
    if (password !== user.password) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }
    // Create JWT
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, user: { id: user.id, email: user.email, name: user.username, role: user.role } });
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
    res.json({ user: { id: user.id, email: user.email, name: user.username, role: user.role } });
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

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
