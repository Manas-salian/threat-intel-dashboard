const Indicator = require('../models/Indicator');
const ThreatActor = require('../models/ThreatActor');
const Campaign = require('../models/Campaign');
const Source = require('../models/Source');
const AuditLog = require('../models/AuditLog');

// Dashboard overview
exports.getDashboard = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalIndicators,
      totalActors,
      totalCampaigns,
      totalSources,
      newIndicatorsToday,
      activeActors,
      activeCampaigns,
      criticalCampaigns,
      recentIndicators,
      indicatorTypes,
      campaignSeverity
    ] = await Promise.all([
      Indicator.countDocuments(),
      ThreatActor.countDocuments(),
      Campaign.countDocuments(),
      Source.countDocuments(),
      Indicator.countDocuments({ first_seen: { $gte: today } }),
      ThreatActor.countDocuments({ last_seen: { $gte: thirtyDaysAgo } }),
      Campaign.countDocuments({
        start_date: { $lte: new Date() },
        $or: [{ end_date: null }, { end_date: { $gte: new Date() } }]
      }),
      Campaign.countDocuments({ severity: 'critical' }),
      Indicator.find({ confidence_score: { $gte: 0.7 } })
        .sort({ last_seen: -1 })
        .limit(10)
        .lean(),
      Indicator.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } },
        { $project: { type: '$_id', count: 1, _id: 0 } },
        { $sort: { count: -1 } }
      ]),
      Campaign.aggregate([
        { $group: { _id: '$severity', count: { $sum: 1 } } },
        { $project: { severity: '$_id', count: 1, _id: 0 } },
        { $sort: { count: -1 } }
      ])
    ]);

    res.json({
      totalIndicators,
      totalActors,
      totalCampaigns,
      totalSources,
      newIndicatorsToday,
      activeActors,
      activeCampaigns,
      criticalCampaigns,
      recentIndicators,
      indicatorTypes,
      campaignSeverity
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Trend data — new indicators over time
exports.getIndicatorTrends = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const trends = await Indicator.aggregate([
      { $match: { first_seen: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$first_seen' } },
          count: { $sum: 1 }
        }
      },
      { $project: { date: '$_id', count: 1, _id: 0 } },
      { $sort: { date: 1 } }
    ]);

    res.json(trends);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Actor activity trends
exports.getActorTrends = async (req, res) => {
  try {
    const actors = await ThreatActor.find()
      .sort({ last_seen: -1 })
      .limit(10)
      .lean();

    // Count indicators per actor
    const result = await Promise.all(
      actors.map(async (actor) => {
        const indicator_count = await Indicator.countDocuments({ actors: actor._id });
        return {
          _id: actor._id,
          name: actor.name,
          last_activity: actor.last_seen,
          indicator_count
        };
      })
    );

    // Sort by indicator count desc and filter out zeros
    res.json(result.filter(a => a.indicator_count > 0).sort((a, b) => b.indicator_count - a.indicator_count));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Indicator type distribution
exports.getTypeDistribution = async (req, res) => {
  try {
    const distribution = await Indicator.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $project: { type: '$_id', count: 1, _id: 0 } },
      { $sort: { count: -1 } }
    ]);
    res.json(distribution);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Source reliability heatmap
exports.getSourceHeatmap = async (req, res) => {
  try {
    const sources = await Source.find().lean();

    const result = await Promise.all(
      sources.map(async (source) => {
        const indicators = await Indicator.find({ sources: source._id }).lean();
        const totalIndicators = indicators.length;
        const avgConfidence = totalIndicators > 0
          ? indicators.reduce((sum, i) => sum + (i.confidence_score || 0), 0) / totalIndicators
          : 0;
        const highConfidenceCount = indicators.filter(i => i.confidence_score >= 0.8).length;

        return {
          source: source.name,
          total_indicators: totalIndicators,
          avg_confidence: avgConfidence,
          high_confidence_count: highConfidenceCount
        };
      })
    );

    res.json(result.sort((a, b) => b.avg_confidence - a.avg_confidence));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Top actors by indicator count
exports.getTopActors = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const actors = await ThreatActor.find().lean();

    const result = await Promise.all(
      actors.map(async (actor) => {
        const indicator_count = await Indicator.countDocuments({ actors: actor._id });
        const mostRecent = await Indicator.findOne({ actors: actor._id })
          .sort({ last_seen: -1 }).lean();
        return {
          _id: actor._id,
          name: actor.name,
          description: actor.description,
          indicator_count,
          most_recent_activity: mostRecent?.last_seen || null
        };
      })
    );

    res.json(
      result
        .sort((a, b) => b.indicator_count - a.indicator_count)
        .slice(0, parseInt(limit))
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Campaign timeline
exports.getCampaignTimeline = async (req, res) => {
  try {
    const campaigns = await Campaign.find().sort({ start_date: -1 }).lean();

    const timeline = campaigns.map(c => {
      const end = c.end_date || new Date();
      const durationDays = Math.ceil((end - c.start_date) / (1000 * 60 * 60 * 24));
      return {
        _id: c._id,
        name: c.name,
        start_date: c.start_date,
        end_date: c.end_date,
        severity: c.severity,
        duration_days: durationDays
      };
    });

    res.json(timeline);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Severity distribution
exports.getSeverityDistribution = async (req, res) => {
  try {
    const distribution = await Campaign.aggregate([
      { $group: { _id: '$severity', count: { $sum: 1 } } },
      { $project: { severity: '$_id', count: 1, _id: 0 } },
      { $sort: { count: -1 } }
    ]);
    res.json(distribution);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Audit logs
exports.getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find()
      .sort({ created_at: -1 })
      .limit(50)
      .lean();
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
