const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const resumes = require('../controllers/resumesController');

router.get('/:id', auth, resumes.getJob);

module.exports = router;