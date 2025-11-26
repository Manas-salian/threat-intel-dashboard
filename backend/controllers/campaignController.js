const db = require('../config/database');

// Get all campaigns
exports.getAll = async (req, res) => {
  try {
    const { page = 1, limit = 50, severity, search } = req.query;
    const offset = (page - 1) * limit;

    let query = `
        SELECT c.*, s.level as severity_level 
        FROM campaigns c
        LEFT JOIN severities s ON c.severity_id = s.severity_id
        WHERE 1=1
    `;
    const params = [];

    if (severity) {
      // severity can be ID or Level Name
      if (isNaN(severity)) {
        query += ' AND s.level = ?';
        params.push(severity);
      } else {
        query += ' AND c.severity_id = ?';
        params.push(severity);
      }
    }

    if (search) {
      query += ' AND (c.name LIKE ? OR c.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY c.start_date DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [campaigns] = await db.query(query, params);

    // Get total count
    let countQuery = `
        SELECT COUNT(*) as total 
        FROM campaigns c
        LEFT JOIN severities s ON c.severity_id = s.severity_id
        WHERE 1=1
    `;
    const countParams = [];

    if (severity) {
      if (isNaN(severity)) {
        countQuery += ' AND s.level = ?';
        countParams.push(severity);
      } else {
        countQuery += ' AND c.severity_id = ?';
        countParams.push(severity);
      }
    }
    if (search) {
      countQuery += ' AND (c.name LIKE ? OR c.description LIKE ?)';
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
      `SELECT c.*, s.level as severity_level 
       FROM campaigns c
       LEFT JOIN severities s ON c.severity_id = s.severity_id
       WHERE c.campaign_id = ?`,
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
    const { name, start_date, end_date, description, severity_id } = req.body;

    const [result] = await db.query(
      `INSERT INTO campaigns (name, start_date, end_date, description, severity_id) 
       VALUES (?, ?, ?, ?, ?)`,
      [name, start_date, end_date, description, severity_id]
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
    const { name, start_date, end_date, description, severity_id } = req.body;

    const [result] = await db.query(
      `UPDATE campaigns 
       SET name = ?, start_date = ?, end_date = ?, description = ?, severity_id = ?
       WHERE campaign_id = ?`,
      [name, start_date, end_date, description, severity_id, req.params.id]
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
    // Cascade delete handles relationships
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
      `SELECT i.*, it.name as type_name 
       FROM indicators i
       JOIN indicator_types it ON i.type_id = it.type_id
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
    const { severity } = req.params;
    let query = `
        SELECT c.*, s.level as severity_level 
        FROM campaigns c
        LEFT JOIN severities s ON c.severity_id = s.severity_id
    `;
    const params = [];

    if (isNaN(severity)) {
      query += ' WHERE s.level = ?';
      params.push(severity);
    } else {
      query += ' WHERE c.severity_id = ?';
      params.push(severity);
    }

    query += ' ORDER BY c.start_date DESC';

    const [campaigns] = await db.query(query, params);

    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get active campaigns
exports.getActive = async (req, res) => {
  try {
    const [campaigns] = await db.query(
      `SELECT c.*, s.level as severity_level 
       FROM campaigns c
       LEFT JOIN severities s ON c.severity_id = s.severity_id
       WHERE c.start_date <= CURDATE() 
       AND (c.end_date IS NULL OR c.end_date >= CURDATE())
       ORDER BY c.start_date DESC`
    );

    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
