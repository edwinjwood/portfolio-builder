// ...existing code...
// ...existing code...
// ...existing code...

// Perform early bootstrap (env loading, lifecycle handlers)
require('./bootstrap');

const express = require('express');
const cors = require('cors');
const pool = require('./db');

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

// Resume Optimizer routes
app.use('/api/me', require('./routes/me'));
app.use('/api/resumes', require('./routes/resumes'));
app.use('/api/jobs', require('./routes/jobs'));

// Export app and pool for testing
module.exports = { app, pool };

// Only start listening if this file is the main module
if (require.main === module) {
	const PORT = process.env.PORT || 5001;
	app.listen(PORT, () => {
		console.log(`Server running on port ${PORT}`);
	});
}
