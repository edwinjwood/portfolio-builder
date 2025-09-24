module.exports = function requireRole(role) {
  return function(req, res, next) {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    if (user.role !== role && user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
};