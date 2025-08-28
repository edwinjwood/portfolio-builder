const express = require('express');
const router = express.Router();
const portfolios = require('../controllers/portfoliosController');
const auth = require('../middleware/auth');

router.get('/', auth, portfolios.listPortfolios);
router.get('/:id', auth, portfolios.getPortfolio);
router.post('/', auth, portfolios.createPortfolio);
router.delete('/:id', auth, portfolios.deletePortfolio);

module.exports = router;
