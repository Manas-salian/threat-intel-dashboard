const db = require('../config/database');

// Dashboard overview
exports.getDashboard = async (req, res) => {
  try {
    // Total counts
    const [indicatorCount] = await db.query('SELECT COUNT(*) as count FROM indicators');
    const [actorCount] = await db.query('SELECT COUNT(*) as count FROM threat_actors');
    const [campaignCount] = await db.query('SELECT COUNT(*) as count FROM campaigns');
    const [sourceCount] = await db.query('SELECT COUNT(*) as count FROM sources');
    
    // New indicators today
    const [newToday] = await db.query(
      `SELECT COUNT(*) as count FROM indicators 
       WHERE DATE(first_seen) = CURDATE()`
    );
    
    // Active actors (with activity in last 30 days)
    const [activeActors] = await db.query(
      `SELECT COUNT(*) as count FROM threat_actors 
       WHERE last_activity >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`
    );
    
    // Active campaigns
    const [activeCampaigns] = await db.query(
      `SELECT COUNT(*) as count FROM campaigns 
       WHERE start_date <= CURDATE() 
       AND (end_date IS NULL OR end_date >= CURDATE())`
    );
    
    // Critical campaigns
    const [criticalCampaigns] = await db.query(
      `SELECT COUNT(*) as count FROM campaigns WHERE severity = 'critical'`
    );
    
    // Recent high-confidence indicators
    const [recentIndicators] = await db.query(
      `SELECT * FROM indicators 
       WHERE confidence_score >= 0.7
       ORDER BY last_seen DESC 
       LIMIT 10`
    );
    
    // Indicator type distribution
    const [indicatorTypes] = await db.query(
      `SELECT type, COUNT(*) as count 
       FROM indicators 
       GROUP BY type 
       ORDER BY count DESC`
    );
    
    // Campaign severity distribution
    const [campaignSeverity] = await db.query(
      `SELECT severity, COUNT(*) as count 
       FROM campaigns 
       GROUP BY severity 
       ORDER BY 
         CASE severity
           WHEN 'critical' THEN 1
           WHEN 'high' THEN 2
           WHEN 'medium' THEN 3
           WHEN 'low' THEN 4
         END`
    );
    
    res.json({
      totalIndicators: indicatorCount[0].count,
      totalActors: actorCount[0].count,
      totalCampaigns: campaignCount[0].count,
      totalSources: sourceCount[0].count,
      newIndicatorsToday: newToday[0].count,
      activeActors: activeActors[0].count,
      activeCampaigns: activeCampaigns[0].count,
      criticalCampaigns: criticalCampaigns[0].count,
      recentIndicators: recentIndicators,
      indicatorTypes: indicatorTypes,
      campaignSeverity: campaignSeverity
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Trend data - new indicators over time
exports.getIndicatorTrends = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    const [trends] = await db.query(
      `SELECT DATE(first_seen) as date, COUNT(*) as count 
       FROM indicators 
       WHERE first_seen >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       GROUP BY DATE(first_seen)
       ORDER BY date`,
      [days]
    );
    
    res.json(trends);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Actor activity trends
exports.getActorTrends = async (req, res) => {
  try {
    const [activity] = await db.query(
      `SELECT 
         a.actor_id,
         a.name,
         a.last_activity,
         COUNT(ia.indicator_id) as indicator_count
       FROM threat_actors a
       LEFT JOIN indicator_actor ia ON a.actor_id = ia.actor_id
       GROUP BY a.actor_id, a.name, a.last_activity
       HAVING indicator_count > 0
       ORDER BY indicator_count DESC
       LIMIT 10`
    );
    
    res.json(activity);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Indicator type distribution
exports.getTypeDistribution = async (req, res) => {
  try {
    const [distribution] = await db.query(
      `SELECT type, COUNT(*) as count 
       FROM indicators 
       GROUP BY type 
       ORDER BY count DESC`
    );
    
    res.json(distribution);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Source reliability heatmap
exports.getSourceHeatmap = async (req, res) => {
  try {
    const [heatmap] = await db.query(
      `SELECT 
         s.name as source,
         COUNT(i.indicator_id) as total_indicators,
         AVG(i.confidence_score) as avg_confidence,
         SUM(CASE WHEN i.confidence_score >= 0.8 THEN 1 ELSE 0 END) as high_confidence_count
       FROM sources s
       LEFT JOIN indicator_source isrc ON s.source_id = isrc.source_id
       LEFT JOIN indicators i ON isrc.indicator_id = i.indicator_id
       GROUP BY s.source_id, s.name
       ORDER BY avg_confidence DESC`
    );
    
    res.json(heatmap);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Top actors by indicator count
exports.getTopActors = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const [topActors] = await db.query(
      `SELECT 
         a.actor_id,
         a.name,
         a.description,
         COUNT(ia.indicator_id) as indicator_count,
         MAX(i.last_seen) as most_recent_activity
       FROM threat_actors a
       LEFT JOIN indicator_actor ia ON a.actor_id = ia.actor_id
       LEFT JOIN indicators i ON ia.indicator_id = i.indicator_id
       GROUP BY a.actor_id, a.name, a.description
       ORDER BY indicator_count DESC
       LIMIT ?`,
      [parseInt(limit)]
    );
    
    res.json(topActors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Campaign timeline
exports.getCampaignTimeline = async (req, res) => {
  try {
    const [timeline] = await db.query(
      `SELECT 
         campaign_id,
         name,
         start_date,
         end_date,
         severity,
         DATEDIFF(COALESCE(end_date, CURDATE()), start_date) as duration_days
       FROM campaigns
       ORDER BY start_date DESC`
    );
    
    res.json(timeline);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Severity distribution
exports.getSeverityDistribution = async (req, res) => {
  try {
    const [distribution] = await db.query(
      `SELECT severity, COUNT(*) as count 
       FROM campaigns 
       GROUP BY severity 
       ORDER BY 
         CASE severity
           WHEN 'Critical' THEN 1
           WHEN 'High' THEN 2
           WHEN 'Medium' THEN 3
           WHEN 'Low' THEN 4
         END`
    );
    
    res.json(distribution);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
