const express = require('express');
const router = express.Router();
const users = require('../controllers/usersController');

// Route for getting current user's profile
router.get('/profile', users.getProfile);

module.exports = router;