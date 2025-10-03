const db = require('../config/database');

// Get all campaigns
exports.getAll = async (req, res) => {
  try {
    const { page = 1, limit = 50, severity, search } = req.query;
    const offset = (page - 1) * limit;
    
    let query = 'SELECT * FROM campaigns WHERE 1=1';
    const params = [];
    
    if (severity) {
      query += ' AND severity = ?';
      params.push(severity);
    }
    
    if (search) {
      query += ' AND (name LIKE ? OR summary LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    
    query += ' ORDER BY start_date DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);
    
    const [campaigns] = await db.query(query, params);
    
    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM campaigns WHERE 1=1';
    const countParams = [];
    
    if (severity) {
      countQuery += ' AND severity = ?';
      countParams.push(severity);
    }
    if (search) {
      countQuery += ' AND (name LIKE ? OR summary LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`);
    }
    
    const [countResult] = await db.query(countQuery, countParams);
    const total = countResult[0].total;
    
    res.json({
      campaigns,
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

// Get single campaign by ID
exports.getById = async (req, res) => {
  try {
    const [campaigns] = await db.query(
      'SELECT * FROM campaigns WHERE campaign_id = ?',
      [req.params.id]
    );
    
    if (campaigns.length === 0) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    res.json(campaigns[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create new campaign
exports.create = async (req, res) => {
  try {
    const { name, start_date, end_date, summary, severity } = req.body;
    
    const [result] = await db.query(
      `INSERT INTO campaigns (name, start_date, end_date, summary, severity) 
       VALUES (?, ?, ?, ?, ?)`,
      [name, start_date, end_date, summary, severity]
    );
    
    res.status(201).json({
      campaign_id: result.insertId,
      message: 'Campaign created successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update campaign
exports.update = async (req, res) => {
  try {
    const { name, start_date, end_date, summary, severity } = req.body;
    
    const [result] = await db.query(
      `UPDATE campaigns 
       SET name = ?, start_date = ?, end_date = ?, summary = ?, severity = ?
       WHERE campaign_id = ?`,
      [name, start_date, end_date, summary, severity, req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    res.json({ message: 'Campaign updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete campaign
exports.delete = async (req, res) => {
  try {
    // Delete relationships first
    await db.query('DELETE FROM indicator_campaign WHERE campaign_id = ?', [req.params.id]);
    
    // Delete campaign
    const [result] = await db.query(
      'DELETE FROM campaigns WHERE campaign_id = ?',
      [req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    res.json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get indicators in a campaign
exports.getIndicators = async (req, res) => {
  try {
    const [indicators] = await db.query(
      `SELECT i.* FROM indicators i
       JOIN indicator_campaign ic ON i.indicator_id = ic.indicator_id
       WHERE ic.campaign_id = ?
       ORDER BY i.last_seen DESC`,
      [req.params.id]
    );
    
    res.json(indicators);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get campaigns by severity
exports.getBySeverity = async (req, res) => {
  try {
    const [campaigns] = await db.query(
      'SELECT * FROM campaigns WHERE severity = ? ORDER BY start_date DESC',
      [req.params.severity]
    );
    
    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get active campaigns
exports.getActive = async (req, res) => {
  try {
    const [campaigns] = await db.query(
      `SELECT * FROM campaigns 
       WHERE start_date <= CURDATE() 
       AND (end_date IS NULL OR end_date >= CURDATE())
       ORDER BY start_date DESC`
    );
    
    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
