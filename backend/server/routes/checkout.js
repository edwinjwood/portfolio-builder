const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/checkoutController');

router.post('/create-session', ctrl.createSession);
router.get('/session', ctrl.getSession);

module.exports = router;
