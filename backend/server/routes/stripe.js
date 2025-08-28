const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/stripeController');

router.get('/prices', ctrl.getPrices);
router.get('/price-map', ctrl.getPriceMap);

module.exports = router;
