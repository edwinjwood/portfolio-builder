const express = require('express');
const router = express.Router();
const users = require('../controllers/usersController');
const { resetIpLimiter } = require('../middleware/rateLimit');

router.get('/', users.listUsers);
router.post('/', users.createUser);
router.post('/login', users.login);
router.post('/validate', users.validate);
router.post('/password-reset/request', resetIpLimiter, users.requestPasswordReset);
router.post('/password-reset/confirm', users.confirmPasswordReset);

module.exports = router;
