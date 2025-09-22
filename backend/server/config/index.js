const path = require('path');
// Load backend .env so other modules can rely on process.env values
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

module.exports = {
  JWT_SECRET: process.env.JWT_SECRET || 'your_jwt_secret',
  CHECKOUT_BASE_URL: process.env.CHECKOUT_BASE_URL || process.env.FRONTEND_URL || 'http://localhost:5173',
  FRONTEND_USE_HASH: process.env.FRONTEND_USE_HASH,
  RECONCILER_APPLY_ENABLED: process.env.RECONCILER_APPLY_ENABLED === 'true',
};
