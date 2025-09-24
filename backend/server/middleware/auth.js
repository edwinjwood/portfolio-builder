const jwt = require('jsonwebtoken');
const config = require('../config');

module.exports = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided.' });
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    req.user = decoded; // { id, email, role }
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};
