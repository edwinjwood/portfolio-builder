const express = require('express');
const router = express.Router();
const admin = require('../controllers/adminController');
const payments = require('../controllers/paymentsController');

router.get('/debug/db-status', admin.dbStatus);
router.post('/debug/run-migrations', admin.runMigrations);

// Payments grouped listing moved under admin
router.get('/payments/grouped', payments.groupedPayments);

module.exports = router;
