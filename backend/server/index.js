// ...existing code up to first duplicate...
const express = require('express');
const cors = require('cors');
const logoUpload = require('./logoUpload');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api', logoUpload);

// JWT secret (use env var in production)
const JWT_SECRET = 'your_jwt_secret';

// Login route
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required.' });
  }
  // Load users
  const users = JSON.parse(fs.readFileSync(__dirname + '/users.json'));
  const user = users.find(u => u.email === email);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }
  // Hash password and compare
  const hash = crypto.createHash('sha256').update(password).digest('hex');
  if (hash !== user.passwordHash) {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }
  // Create JWT
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
  res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
});

// Validate JWT route
app.post('/api/validate', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided.' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // Load users
    const users = JSON.parse(fs.readFileSync(__dirname + '/users.json'));
    const user = users.find(u => u.id === decoded.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
