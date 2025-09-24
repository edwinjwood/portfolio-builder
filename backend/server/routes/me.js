const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const profile = require('../controllers/profileController');

router.get('/profile', auth, profile.getProfile);
router.put('/profile', auth, express.json(), profile.upsertProfile);

module.exports = router;