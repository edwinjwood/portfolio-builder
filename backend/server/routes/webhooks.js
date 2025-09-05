const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/webhooksController');

// Stripe webhooks expect the raw body; index.js already preserves req.rawBody via express.json verify
router.post('/stripe', ctrl.handleStripe);

module.exports = router;
