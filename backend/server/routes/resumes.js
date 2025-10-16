const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const resumes = require('../controllers/resumesController');

router.post('/', auth, resumes.uploadMiddleware, resumes.uploadResume);
router.post('/:id/analyze', auth, express.json(), resumes.analyzeResume);
router.get('/:id/result', auth, resumes.getResult);
router.get('/:id/pdf', auth, resumes.renderPdf);
router.post('/new-from-profile', auth, resumes.newFromProfile);
router.put('/:id/draft', auth, express.json(), resumes.saveDraft);
router.delete('/:id/draft', auth, resumes.resetDraft);

module.exports = router;
