const express = require('express');
const router = express.Router();
const portfolios = require('../controllers/portfoliosController');
const auth = require('../middleware/auth');

router.get('/', auth, portfolios.listPortfolios);
router.get('/:id', auth, portfolios.getPortfolio);
// Public read-only portfolio endpoint for published pages
router.get('/public/:id', portfolios.getPortfolioPublic);
// Update or create component rows (protected)
router.patch('/:id/components/:componentId', auth, portfolios.updateComponent);
router.patch('/:id/components', auth, portfolios.updateComponent);
// Resume upload (multipart/form-data)
router.post('/:id/resume', auth, portfolios.uploadResume);
// Synchronous onboarding generation (AI-driven draft)
router.post('/:id/onboarding', auth, portfolios.onboardPortfolio);
router.post('/', auth, portfolios.createPortfolio);
router.delete('/:id', auth, portfolios.deletePortfolio);

module.exports = router;
