const express = require('express');
const router = express.Router();
const correlationController = require('../controllers/correlationController');

// Find campaigns associated with an indicator value
router.get('/indicator/:value/campaigns', correlationController.getCampaignsByIndicator);

// Find actors using a specific indicator
router.get('/indicator/:value/actors', correlationController.getActorsByIndicator);

// Find related indicators (common actors/campaigns)
router.get('/indicator/:id/related', correlationController.getRelatedIndicators);

// Find actor overlap between campaigns
router.get('/campaigns/actor-overlap', correlationController.getActorOverlap);

// Get complete threat context for an indicator
router.get('/indicator/:id/context', correlationController.getThreatContext);

module.exports = router;
