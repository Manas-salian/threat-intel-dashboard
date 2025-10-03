const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

// Dashboard overview
router.get('/dashboard', analyticsController.getDashboard);

// Indicator timeline (called by frontend)
router.get('/indicators/timeline', analyticsController.getIndicatorTrends);

// Actor activity (called by frontend)
router.get('/actors/activity', analyticsController.getActorTrends);

// Campaign severity (called by frontend)
router.get('/campaigns/severity', analyticsController.getSeverityDistribution);

// Source reliability (called by frontend)
router.get('/sources/reliability', analyticsController.getSourceHeatmap);

// Legacy routes (keep for backward compatibility)
router.get('/trends/indicators', analyticsController.getIndicatorTrends);
router.get('/trends/actors', analyticsController.getActorTrends);
router.get('/distribution/types', analyticsController.getTypeDistribution);
router.get('/heatmap/sources', analyticsController.getSourceHeatmap);
router.get('/top/actors', analyticsController.getTopActors);
router.get('/timeline/campaigns', analyticsController.getCampaignTimeline);
router.get('/distribution/severity', analyticsController.getSeverityDistribution);

module.exports = router;
