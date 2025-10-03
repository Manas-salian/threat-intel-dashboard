const db = require('../config/database');

// Get all threat actors
exports.getAll = async (req, res) => {
  try {
    const { page = 1, limit = 50, search } = req.query;
    const offset = (page - 1) * limit;
    
    let query = 'SELECT * FROM threat_actors WHERE 1=1';
    const params = [];
    
    if (search) {
      query += ' AND (name LIKE ? OR description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    
    query += ' ORDER BY last_activity DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);
    
    const [actors] = await db.query(query, params);
    
    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM threat_actors WHERE 1=1';
    const countParams = [];
    
    if (search) {
      countQuery += ' AND (name LIKE ? OR description LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`);
    }
    
    const [countResult] = await db.query(countQuery, countParams);
    const total = countResult[0].total;
    
    res.json({
      actors,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get single actor by ID
exports.getById = async (req, res) => {
  try {
    const [actors] = await db.query(
      'SELECT * FROM threat_actors WHERE actor_id = ?',
      [req.params.id]
    );
    
    if (actors.length === 0) {
      return res.status(404).json({ error: 'Actor not found' });
    }
    
    res.json(actors[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create new actor
exports.create = async (req, res) => {
  try {
    const { name, description, first_seen, last_activity, mitre_tactics } = req.body;
    
    const [result] = await db.query(
      `INSERT INTO threat_actors (name, description, first_seen, last_activity, mitre_tactics) 
       VALUES (?, ?, ?, ?, ?)`,
      [name, description, first_seen, last_activity, mitre_tactics]
    );
    
    res.status(201).json({
      actor_id: result.insertId,
      message: 'Threat actor created successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update actor
exports.update = async (req, res) => {
  try {
    const { name, description, first_seen, last_activity, mitre_tactics } = req.body;
    
    const [result] = await db.query(
      `UPDATE threat_actors 
       SET name = ?, description = ?, first_seen = ?, last_activity = ?, mitre_tactics = ?
       WHERE actor_id = ?`,
      [name, description, first_seen, last_activity, mitre_tactics, req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Actor not found' });
    }
    
    res.json({ message: 'Threat actor updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete actor
exports.delete = async (req, res) => {
  try {
    // Delete relationships first
    await db.query('DELETE FROM indicator_actor WHERE actor_id = ?', [req.params.id]);
    
    // Delete actor
    const [result] = await db.query(
      'DELETE FROM threat_actors WHERE actor_id = ?',
      [req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Actor not found' });
    }
    
    res.json({ message: 'Threat actor deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get indicators associated with an actor
exports.getIndicators = async (req, res) => {
  try {
    const [indicators] = await db.query(
      `SELECT i.* FROM indicators i
       JOIN indicator_actor ia ON i.indicator_id = ia.indicator_id
       WHERE ia.actor_id = ?
       ORDER BY i.last_seen DESC`,
      [req.params.id]
    );
    
    res.json(indicators);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get campaigns associated with an actor
exports.getCampaigns = async (req, res) => {
  try {
    const [campaigns] = await db.query(
      `SELECT DISTINCT c.* FROM campaigns c
       JOIN indicator_campaign ic ON c.campaign_id = ic.campaign_id
       JOIN indicator_actor ia ON ic.indicator_id = ia.indicator_id
       WHERE ia.actor_id = ?
       ORDER BY c.start_date DESC`,
      [req.params.id]
    );
    
    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get actor profile with statistics
exports.getProfile = async (req, res) => {
  try {
    // Get actor details
    const [actors] = await db.query(
      'SELECT * FROM threat_actors WHERE actor_id = ?',
      [req.params.id]
    );
    
    if (actors.length === 0) {
      return res.status(404).json({ error: 'Actor not found' });
    }
    
    const actor = actors[0];
    
    // Get indicator count
    const [indicatorCount] = await db.query(
      `SELECT COUNT(*) as count FROM indicator_actor WHERE actor_id = ?`,
      [req.params.id]
    );
    
    // Get campaign count
    const [campaignCount] = await db.query(
      `SELECT COUNT(DISTINCT ic.campaign_id) as count 
       FROM indicator_campaign ic
       JOIN indicator_actor ia ON ic.indicator_id = ia.indicator_id
       WHERE ia.actor_id = ?`,
      [req.params.id]
    );
    
    // Get indicator type distribution
    const [typeDistribution] = await db.query(
      `SELECT i.type, COUNT(*) as count 
       FROM indicators i
       JOIN indicator_actor ia ON i.indicator_id = ia.indicator_id
       WHERE ia.actor_id = ?
       GROUP BY i.type`,
      [req.params.id]
    );
    
    res.json({
      ...actor,
      statistics: {
        total_indicators: indicatorCount[0].count,
        total_campaigns: campaignCount[0].count,
        indicator_types: typeDistribution
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
