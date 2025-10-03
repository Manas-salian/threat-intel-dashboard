const db = require('../config/database');

// Get all sources
exports.getAll = async (req, res) => {
  try {
    const [sources] = await db.query('SELECT * FROM sources ORDER BY name');
    res.json(sources);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get single source by ID
exports.getById = async (req, res) => {
  try {
    const [sources] = await db.query(
      'SELECT * FROM sources WHERE source_id = ?',
      [req.params.id]
    );
    
    if (sources.length === 0) {
      return res.status(404).json({ error: 'Source not found' });
    }
    
    res.json(sources[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create new source
exports.create = async (req, res) => {
  try {
    const { name, url, update_rate, auth_type } = req.body;
    
    const [result] = await db.query(
      `INSERT INTO sources (name, url, update_rate, auth_type) 
       VALUES (?, ?, ?, ?)`,
      [name, url, update_rate, auth_type]
    );
    
    res.status(201).json({
      source_id: result.insertId,
      message: 'Source created successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update source
exports.update = async (req, res) => {
  try {
    const { name, url, update_rate, auth_type } = req.body;
    
    const [result] = await db.query(
      `UPDATE sources 
       SET name = ?, url = ?, update_rate = ?, auth_type = ?
       WHERE source_id = ?`,
      [name, url, update_rate, auth_type, req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Source not found' });
    }
    
    res.json({ message: 'Source updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete source
exports.delete = async (req, res) => {
  try {
    // Delete relationships first
    await db.query('DELETE FROM indicator_source WHERE source_id = ?', [req.params.id]);
    
    // Delete source
    const [result] = await db.query(
      'DELETE FROM sources WHERE source_id = ?',
      [req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Source not found' });
    }
    
    res.json({ message: 'Source deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get indicators from a source
exports.getIndicators = async (req, res) => {
  try {
    const [indicators] = await db.query(
      `SELECT i.* FROM indicators i
       JOIN indicator_source isrc ON i.indicator_id = isrc.indicator_id
       WHERE isrc.source_id = ?
       ORDER BY i.last_seen DESC`,
      [req.params.id]
    );
    
    res.json(indicators);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
