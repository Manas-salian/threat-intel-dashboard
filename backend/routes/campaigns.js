const express = require('express');
const router = express.Router();
const campaignController = require('../controllers/campaignController');

// Get all campaigns
router.get('/', campaignController.getAll);

// Get campaigns by severity (must be before /:id)
router.get('/severity/:severity', campaignController.getBySeverity);

// Get active campaigns (must be before /:id)
router.get('/active', campaignController.getActive);

// Get single campaign by ID
router.get('/:id', campaignController.getById);

// Get indicators in a campaign
router.get('/:id/indicators', campaignController.getIndicators);

// Create new campaign
router.post('/', campaignController.create);

// Update campaign
router.put('/:id', campaignController.update);

// Delete campaign
router.delete('/:id', campaignController.delete);

module.exports = router;
