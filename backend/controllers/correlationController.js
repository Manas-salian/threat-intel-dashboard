const db = require('../config/database');

// Find campaigns associated with an indicator value
exports.getCampaignsByIndicator = async (req, res) => {
  try {
    const [campaigns] = await db.query(
      `SELECT DISTINCT c.* 
       FROM campaigns c
       JOIN indicator_campaign ic ON c.campaign_id = ic.campaign_id
       JOIN indicators i ON ic.indicator_id = i.indicator_id
       WHERE i.value = ?
       ORDER BY c.start_date DESC`,
      [req.params.value]
    );
    
    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Find actors using a specific indicator
exports.getActorsByIndicator = async (req, res) => {
  try {
    const [actors] = await db.query(
      `SELECT DISTINCT a.* 
       FROM threat_actors a
       JOIN indicator_actor ia ON a.actor_id = ia.actor_id
       JOIN indicators i ON ia.indicator_id = i.indicator_id
       WHERE i.value = ?
       ORDER BY a.last_seen DESC`,
      [req.params.value]
    );
    
    res.json(actors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Find related indicators (common actors/campaigns)
exports.getRelatedIndicators = async (req, res) => {
  try {
    const [related] = await db.query(
      `SELECT DISTINCT i2.*, 
         COUNT(DISTINCT ia2.actor_id) as common_actors,
         COUNT(DISTINCT ic2.campaign_id) as common_campaigns
       FROM indicators i1
       LEFT JOIN indicator_actor ia1 ON i1.indicator_id = ia1.indicator_id
       LEFT JOIN indicator_campaign ic1 ON i1.indicator_id = ic1.indicator_id
       JOIN indicator_actor ia2 ON ia1.actor_id = ia2.actor_id
       JOIN indicator_campaign ic2 ON ic1.campaign_id = ic2.campaign_id
       JOIN indicators i2 ON (ia2.indicator_id = i2.indicator_id OR ic2.indicator_id = i2.indicator_id)
       WHERE i1.indicator_id = ? AND i2.indicator_id != ?
       GROUP BY i2.indicator_id
       ORDER BY common_actors DESC, common_campaigns DESC
       LIMIT 20`,
      [req.params.id, req.params.id]
    );
    
    res.json(related);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Find actor overlap between campaigns
exports.getActorOverlap = async (req, res) => {
  try {
    const [overlap] = await db.query(
      `SELECT 
         c1.campaign_id as campaign1_id,
         c1.name as campaign1_name,
         c2.campaign_id as campaign2_id,
         c2.name as campaign2_name,
         COUNT(DISTINCT a.actor_id) as common_actors
       FROM campaigns c1
       JOIN indicator_campaign ic1 ON c1.campaign_id = ic1.campaign_id
       JOIN indicator_actor ia ON ic1.indicator_id = ia.indicator_id
       JOIN threat_actors a ON ia.actor_id = a.actor_id
       JOIN indicator_actor ia2 ON a.actor_id = ia2.actor_id
       JOIN indicator_campaign ic2 ON ia2.indicator_id = ic2.indicator_id
       JOIN campaigns c2 ON ic2.campaign_id = c2.campaign_id
       WHERE c1.campaign_id < c2.campaign_id
       GROUP BY c1.campaign_id, c1.name, c2.campaign_id, c2.name
       HAVING common_actors > 0
       ORDER BY common_actors DESC
       LIMIT 50`
    );
    
    res.json(overlap);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get complete threat context for an indicator
exports.getThreatContext = async (req, res) => {
  try {
    // Get indicator details
    const [indicators] = await db.query(
      'SELECT * FROM indicators WHERE indicator_id = ?',
      [req.params.id]
    );
    
    if (indicators.length === 0) {
      return res.status(404).json({ error: 'Indicator not found' });
    }
    
    const indicator = indicators[0];
    
    // Get associated actors
    const [actors] = await db.query(
      `SELECT a.* FROM threat_actors a
       JOIN indicator_actor ia ON a.actor_id = ia.actor_id
       WHERE ia.indicator_id = ?`,
      [req.params.id]
    );
    
    // Get associated campaigns
    const [campaigns] = await db.query(
      `SELECT c.* FROM campaigns c
       JOIN indicator_campaign ic ON c.campaign_id = ic.campaign_id
       WHERE ic.indicator_id = ?`,
      [req.params.id]
    );
    
    // Get sources
    const [sources] = await db.query(
      `SELECT s.* FROM sources s
       JOIN indicator_source isrc ON s.source_id = isrc.source_id
       WHERE isrc.indicator_id = ?`,
      [req.params.id]
    );
    
    // Get related indicators
    const [related] = await db.query(
      `SELECT DISTINCT i2.indicator_id, i2.type, i2.value, i2.confidence_score
       FROM indicators i1
       LEFT JOIN indicator_actor ia1 ON i1.indicator_id = ia1.indicator_id
       LEFT JOIN indicator_campaign ic1 ON i1.indicator_id = ic1.indicator_id
       JOIN indicator_actor ia2 ON ia1.actor_id = ia2.actor_id
       JOIN indicator_campaign ic2 ON ic1.campaign_id = ic2.campaign_id
       JOIN indicators i2 ON (ia2.indicator_id = i2.indicator_id OR ic2.indicator_id = i2.indicator_id)
       WHERE i1.indicator_id = ? AND i2.indicator_id != ?
       GROUP BY i2.indicator_id
       LIMIT 10`,
      [req.params.id, req.params.id]
    );
    
    res.json({
      indicator,
      actors,
      campaigns,
      sources,
      related_indicators: related
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
