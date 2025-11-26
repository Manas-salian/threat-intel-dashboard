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

    let query = `
      SELECT i.*, it.name as type 
      FROM indicators i
      JOIN indicator_types it ON i.type_id = it.type_id
      WHERE 1=1
    `;
    const params = [];

    if (type) {
      // type can be ID or Name
      if (isNaN(type)) {
        query += ' AND it.name = ?';
        params.push(type);
      } else {
        query += ' AND i.type_id = ?';
        params.push(type);
      }
    }

    if (minConfidence) {
      query += ' AND i.confidence_score >= ?';
      params.push(minConfidence);
    }

    if (search) {
      query += ' AND (i.value LIKE ? OR it.name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY i.last_seen DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [indicators] = await db.query(query, params);

    // Get total count
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM indicators i
      JOIN indicator_types it ON i.type_id = it.type_id
      WHERE 1=1
    `;
    const countParams = [];

    if (type) {
      if (isNaN(type)) {
        countQuery += ' AND it.name = ?';
        countParams.push(type);
      } else {
        countQuery += ' AND i.type_id = ?';
        countParams.push(type);
      }
    }
    if (minConfidence) {
      countQuery += ' AND i.confidence_score >= ?';
      countParams.push(minConfidence);
    }
    if (search) {
      countQuery += ' AND (i.value LIKE ? OR it.name LIKE ?)';
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
      `SELECT i.*, it.name as type 
       FROM indicators i
       JOIN indicator_types it ON i.type_id = it.type_id
       WHERE i.indicator_id = ?`,
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
    const { type_id, value, first_seen, last_seen, confidence_score } = req.body;

    // Check for duplicates
    const [existing] = await db.query(
      'SELECT indicator_id FROM indicators WHERE type_id = ? AND value = ?',
      [type_id, value]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Indicator already exists' });
    }

    const [result] = await db.query(
      `INSERT INTO indicators (type_id, value, first_seen, last_seen, confidence_score) 
       VALUES (?, ?, ?, ?, ?)`,
      [type_id, value, first_seen || new Date(), last_seen || new Date(), confidence_score]
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
    const { type_id, value, first_seen, last_seen, confidence_score } = req.body;

    const [result] = await db.query(
      `UPDATE indicators 
       SET type_id = ?, value = ?, first_seen = ?, last_seen = ?, confidence_score = ?
       WHERE indicator_id = ?`,
      [type_id, value, first_seen, last_seen, confidence_score, req.params.id]
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
    // Delete relationships first (handled by ON DELETE CASCADE in schema v2, but keeping for safety/explicit logic if needed)
    // Actually, schema v2 has CASCADE, so we can just delete the indicator.

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
    const { type } = req.params;
    let query = `
      SELECT i.*, it.name as type 
      FROM indicators i
      JOIN indicator_types it ON i.type_id = it.type_id
    `;
    const params = [];

    if (isNaN(type)) {
      query += ' WHERE it.name = ?';
      params.push(type);
    } else {
      query += ' WHERE i.type_id = ?';
      params.push(type);
    }

    query += ' ORDER BY i.last_seen DESC';

    const [indicators] = await db.query(query, params);

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
      `SELECT i.*, it.name as type 
       FROM indicators i
       JOIN indicator_types it ON i.type_id = it.type_id
       WHERE i.confidence_score BETWEEN ? AND ? 
       ORDER BY i.confidence_score DESC`,
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
      `SELECT c.*, s.level as severity_level
       FROM campaigns c
       JOIN indicator_campaign ic ON c.campaign_id = ic.campaign_id
       LEFT JOIN severities s ON c.severity_id = s.severity_id
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

// Bulk ingest indicators from JSON
exports.bulkIngest = async (req, res) => {
  try {
    const { indicators, sourceId } = req.body;

    if (!Array.isArray(indicators) || indicators.length === 0) {
      return res.status(400).json({ error: 'indicators must be a non-empty array' });
    }

    // Get indicator type mappings
    const [types] = await db.query('SELECT type_id, name FROM indicator_types');
    const typeMap = {};
    types.forEach(t => {
      typeMap[t.name.toLowerCase()] = t.type_id;
    });

    let inserted = 0;
    let skipped = 0;
    let errors = [];

    for (const indicator of indicators) {
      try {
        const { type, value, confidence_score, description } = indicator;

        // Map type name to type_id
        const typeName = type.toLowerCase();
        const type_id = typeMap[typeName];

        if (!type_id) {
          errors.push(`Unknown type: ${type} for value: ${value}`);
          skipped++;
          continue;
        }

        // Check for duplicates
        const [existing] = await db.query(
          'SELECT indicator_id FROM indicators WHERE type_id = ? AND value = ?',
          [type_id, value]
        );

        if (existing.length > 0) {
          // Update last_seen and confidence if better
          if (confidence_score && confidence_score > 0) {
            await db.query(
              `UPDATE indicators 
               SET last_seen = NOW(), 
                   confidence_score = GREATEST(confidence_score, ?),
                   description = COALESCE(?, description)
               WHERE indicator_id = ?`,
              [confidence_score, description || null, existing[0].indicator_id]
            );
          }
          skipped++;
          continue;
        }

        // Insert new indicator
        const [result] = await db.query(
          `INSERT INTO indicators (type_id, value, first_seen, last_seen, confidence_score, description) 
           VALUES (?, ?, NOW(), NOW(), ?, ?)`,
          [type_id, value, confidence_score || 0.5, description || null]
        );

        const indicator_id = result.insertId;

        // Link to source if provided
        if (sourceId) {
          await db.query(
            'INSERT IGNORE INTO indicator_source (indicator_id, source_id) VALUES (?, ?)',
            [indicator_id, sourceId]
          );
        }

        inserted++;
      } catch (err) {
        errors.push(`Error processing ${indicator.value}: ${err.message}`);
        skipped++;
      }
    }

    res.json({
      message: 'Bulk ingest completed',
      inserted,
      skipped,
      total: indicators.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
