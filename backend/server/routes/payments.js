const express = require('express');
const router = express.Router();
const payments = require('../controllers/paymentsController');

router.post('/create-payment-intent', payments.createPaymentIntent);

module.exports = router;
