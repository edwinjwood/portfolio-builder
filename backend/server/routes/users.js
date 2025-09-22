const express = require('express');
const router = express.Router();
const users = require('../controllers/usersController');
const { resetIpLimiter } = require('../middleware/rateLimit');

// simple rate limiter for username checks (lighter than password reset)
const usernameLimiter = require('express-rate-limit')({ windowMs: 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false });

router.get('/', users.listUsers);
router.post('/', users.createUser);
router.post('/login', users.login);
router.get('/username-available', usernameLimiter, users.checkUsernameAvailable);
router.post('/validate', users.validate);
router.post('/password-reset/request', resetIpLimiter, users.requestPasswordReset);
router.post('/password-reset/confirm', users.confirmPasswordReset);

module.exports = router;
