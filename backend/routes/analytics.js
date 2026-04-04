const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

// Dashboard overview
router.get('/dashboard', analyticsController.getDashboard);

// Indicator timeline
router.get('/indicators/timeline', analyticsController.getIndicatorTrends);

// Actor activity
router.get('/actors/activity', analyticsController.getActorTrends);

// Campaign severity
router.get('/campaigns/severity', analyticsController.getSeverityDistribution);

// Source reliability
router.get('/sources/reliability', analyticsController.getSourceHeatmap);

// Top actors
router.get('/top-actors', analyticsController.getTopActors);

// Audit logs
router.get('/audit-logs', analyticsController.getAuditLogs);

// Campaign timeline
router.get('/timeline/campaigns', analyticsController.getCampaignTimeline);

// Type distribution
router.get('/distribution/types', analyticsController.getTypeDistribution);

module.exports = router;
