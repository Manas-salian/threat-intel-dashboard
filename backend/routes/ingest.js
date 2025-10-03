const express = require('express');
const router = express.Router();
const ingestController = require('../controllers/ingestController');

// Trigger manual ingestion from all sources
router.post('/run', ingestController.runIngestion);

// Trigger ingestion from specific source
router.post('/run/:source', ingestController.runSourceIngestion);

// Get ingestion status and statistics
router.get('/status', ingestController.getStatus);

// Get ingestion history
router.get('/history', ingestController.getHistory);

module.exports = router;
