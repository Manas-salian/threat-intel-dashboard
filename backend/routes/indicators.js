const express = require('express');
const router = express.Router();
const indicatorController = require('../controllers/indicatorController');

// Get all indicators with pagination and filters
router.get('/', indicatorController.getAll);

// Get indicators by type (must be before /:id)
router.get('/type/:type', indicatorController.getByType);

// Get indicators by confidence score range
router.get('/confidence/:min/:max', indicatorController.getByConfidence);

// Get single indicator by ID
router.get('/:id', indicatorController.getById);

// Get actors associated with an indicator
router.get('/:id/actors', indicatorController.getActors);

// Get campaigns associated with an indicator
router.get('/:id/campaigns', indicatorController.getCampaigns);

// Get sources for an indicator
router.get('/:id/sources', indicatorController.getSources);

// Create new indicator
router.post('/', indicatorController.create);

// Bulk ingest indicators
router.post('/bulk', indicatorController.bulkIngest);

// Update indicator
router.put('/:id', indicatorController.update);

// Delete indicator
router.delete('/:id', indicatorController.delete);

module.exports = router;
