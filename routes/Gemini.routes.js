const express = require('express');
const router = express.Router();
const geminiController = require('../controllers/Gemini.controller');
// Rate limiters disabled
// const { generalLimiter } = require('../middleware/rateLimiter');

// Rate limiting disabled
// router.use(generalLimiter);

// Generate text using Gemini API
router.post('/generate', geminiController.generateText);

// Generate medical advice
router.post('/medical-advice', geminiController.generateMedicalAdvice);

// Generate radiology summary
router.post('/radiology-summary', geminiController.generateRadiologySummary);

// Explain radiology report in simple Egyptian Arabic
router.post('/explain-report', geminiController.explainReport);

module.exports = router;
