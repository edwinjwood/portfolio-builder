const express = require('express');
const router = express.Router();
const templates = require('../controllers/templatesController');

router.get('/', templates.listTemplates);

module.exports = router;
