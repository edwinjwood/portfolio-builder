const rateLimit = require('express-rate-limit');

// Limit requests from the same IP to sensitive endpoints (e.g., password reset)
const resetIpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 6, // limit each IP to 6 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { resetIpLimiter };
