
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

// JWT secret (use env var in production)
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
console.log('Connecting to DB with:', process.env.DATABASE_URL);
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Get all users route
app.get('/api/users', async (req, res) => {
  console.log('GET /api/users called');
  try {
    const result = await pool.query('SELECT * FROM users');
    console.log('DB query success:', result.rows.length, 'users found');
    res.json(result.rows);
  } catch (err) {
    console.error('DB error in /api/users:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// Login route
app.post('/api/login', async (req, res) => {
  console.log('POST /api/login called with:', req.body);
  const { email, password } = req.body;
  if (!email || !password) {
    console.log('Missing email or password');
    return res.status(400).json({ error: 'Email and password required.' });
  }
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!user) {
      console.log('User not found for email:', email);
      return res.status(401).json({ error: 'Invalid credentials.' });
    }
    // For demo: compare plaintext password (replace with hash in production)
    if (password !== user.password) {
      console.log('Password mismatch for user:', email);
      return res.status(401).json({ error: 'Invalid credentials.' });
    }
    // Create JWT
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
    console.log('Login success for user:', email);
    res.json({ token, user: { id: user.id, email: user.email, name: user.username, role: user.role } });
  } catch (err) {
    console.error('DB error in /api/login:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// Validate JWT route
app.post('/api/validate', async (req, res) => {
  console.log('POST /api/validate called');
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    console.log('No token provided');
    return res.status(401).json({ error: 'No token provided.' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [decoded.id]);
    const user = result.rows[0];
    if (!user) {
      console.log('User not found for id:', decoded.id);
      return res.status(404).json({ error: 'User not found.' });
    }
    console.log('Token validated for user:', user.email);
    res.json({ user: { id: user.id, email: user.email, name: user.username, role: user.role } });
  } catch (err) {
    console.error('JWT/DB error in /api/validate:', err);
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
