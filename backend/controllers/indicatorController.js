const db = require('../config/database');

// Get all indicators with pagination and filters
exports.getAll = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      type, 
      minConfidence, 
      search 
    } = req.query;
    
    const offset = (page - 1) * limit;
    
    let query = 'SELECT * FROM indicators WHERE 1=1';
    const params = [];
    
    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }
    
    if (minConfidence) {
      query += ' AND confidence_score >= ?';
      params.push(minConfidence);
    }
    
    if (search) {
      query += ' AND (value LIKE ? OR description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    
    query += ' ORDER BY last_seen DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);
    
    const [indicators] = await db.query(query, params);
    
    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM indicators WHERE 1=1';
    const countParams = [];
    
    if (type) {
      countQuery += ' AND type = ?';
      countParams.push(type);
    }
    if (minConfidence) {
      countQuery += ' AND confidence_score >= ?';
      countParams.push(minConfidence);
    }
    if (search) {
      countQuery += ' AND (value LIKE ? OR description LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`);
    }
    
    const [countResult] = await db.query(countQuery, countParams);
    const total = countResult[0].total;
    
    res.json({
      indicators,
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

// Get single indicator by ID
exports.getById = async (req, res) => {
  try {
    const [indicators] = await db.query(
      'SELECT * FROM indicators WHERE indicator_id = ?',
      [req.params.id]
    );
    
    if (indicators.length === 0) {
      return res.status(404).json({ error: 'Indicator not found' });
    }
    
    res.json(indicators[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create new indicator
exports.create = async (req, res) => {
  try {
    const { type, value, first_seen, last_seen, confidence_score, description } = req.body;
    
    // Check for duplicates
    const [existing] = await db.query(
      'SELECT indicator_id FROM indicators WHERE type = ? AND value = ?',
      [type, value]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Indicator already exists' });
    }
    
    const [result] = await db.query(
      `INSERT INTO indicators (type, value, first_seen, last_seen, confidence_score, description) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [type, value, first_seen || new Date(), last_seen || new Date(), confidence_score, description]
    );
    
    res.status(201).json({
      indicator_id: result.insertId,
      message: 'Indicator created successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update indicator
exports.update = async (req, res) => {
  try {
    const { type, value, first_seen, last_seen, confidence_score, description } = req.body;
    
    const [result] = await db.query(
      `UPDATE indicators 
       SET type = ?, value = ?, first_seen = ?, last_seen = ?, 
           confidence_score = ?, description = ?
       WHERE indicator_id = ?`,
      [type, value, first_seen, last_seen, confidence_score, description, req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Indicator not found' });
    }
    
    res.json({ message: 'Indicator updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete indicator
exports.delete = async (req, res) => {
  try {
    // Delete relationships first
    await db.query('DELETE FROM indicator_actor WHERE indicator_id = ?', [req.params.id]);
    await db.query('DELETE FROM indicator_campaign WHERE indicator_id = ?', [req.params.id]);
    await db.query('DELETE FROM indicator_source WHERE indicator_id = ?', [req.params.id]);
    
    // Delete indicator
    const [result] = await db.query(
      'DELETE FROM indicators WHERE indicator_id = ?',
      [req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Indicator not found' });
    }
    
    res.json({ message: 'Indicator deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get indicators by type
exports.getByType = async (req, res) => {
  try {
    const [indicators] = await db.query(
      'SELECT * FROM indicators WHERE type = ? ORDER BY last_seen DESC',
      [req.params.type]
    );
    
    res.json(indicators);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get indicators by confidence score range
exports.getByConfidence = async (req, res) => {
  try {
    const { min, max } = req.params;
    
    const [indicators] = await db.query(
      'SELECT * FROM indicators WHERE confidence_score BETWEEN ? AND ? ORDER BY confidence_score DESC',
      [min, max]
    );
    
    res.json(indicators);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get actors associated with an indicator
exports.getActors = async (req, res) => {
  try {
    const [actors] = await db.query(
      `SELECT a.* FROM threat_actors a
       JOIN indicator_actor ia ON a.actor_id = ia.actor_id
       WHERE ia.indicator_id = ?`,
      [req.params.id]
    );
    
    res.json(actors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get campaigns associated with an indicator
exports.getCampaigns = async (req, res) => {
  try {
    const [campaigns] = await db.query(
      `SELECT c.* FROM campaigns c
       JOIN indicator_campaign ic ON c.campaign_id = ic.campaign_id
       WHERE ic.indicator_id = ?`,
      [req.params.id]
    );
    
    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get sources for an indicator
exports.getSources = async (req, res) => {
  try {
    const [sources] = await db.query(
      `SELECT s.* FROM sources s
       JOIN indicator_source isrc ON s.source_id = isrc.source_id
       WHERE isrc.indicator_id = ?`,
      [req.params.id]
    );
    
    res.json(sources);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
