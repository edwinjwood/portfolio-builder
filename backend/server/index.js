// ...existing code...
// ...existing code...
// ...existing code...

// Perform early bootstrap (env loading, lifecycle handlers)
require('./bootstrap');

const express = require('express');
const cors = require('cors');
const pool = require('./db');
const { extractStripeIds, upsertPayment } = require('./services/stripeHelpers');
const path = require('path');

// Create Express app and common middleware
const app = express();
app.use(cors());
app.use(express.urlencoded({ extended: true }));
// capture raw body for Stripe webhooks
app.use(express.json({ verify: (req, res, buf) => { req.rawBody = buf; } }));

// Mount routers
app.use('/api/users', require('./routes/users'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/portfolios', require('./routes/portfolios'));
app.use('/api/templates', require('./routes/templates'));
app.use('/api/stripe', require('./routes/stripe'));
app.use('/api/checkout', require('./routes/checkout'));
app.use('/webhooks', require('./routes/webhooks'));
app.use('/admin', require('./routes/admin'));

// Serve developer-visible generated component JSON files under a predictable URL
// e.g. GET /generated_components/<portfolioId>/virtualbc.json
// This is intentionally only a static file serve; files are written by controllers
// Serve generated components from the backend folder where controllers write them
app.use('/generated_components', express.static(path.join(__dirname, '..', 'generated_components')));

// Export app and pool for testing
module.exports = { app, pool, extractStripeIds, upsertPayment };

// Only start listening if this file is the main module
if (require.main === module) {
	const PORT = process.env.PORT || 5001;
	app.listen(PORT, () => {
		console.log(`Server running on port ${PORT}`);
	});
}
