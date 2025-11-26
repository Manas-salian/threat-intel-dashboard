const db = require('../config/database');

// Get all threat actors
exports.getAll = async (req, res) => {
  try {
    const { page = 1, limit = 50, search } = req.query;
    const offset = (page - 1) * limit;

    let query = `
        SELECT ta.*, GROUP_CONCAT(t.name) as tactics
        FROM threat_actors ta
        LEFT JOIN actor_tactics at ON ta.actor_id = at.actor_id
        LEFT JOIN tactics t ON at.tactic_id = t.tactic_id
        WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ' AND (ta.name LIKE ? OR ta.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' GROUP BY ta.actor_id ORDER BY ta.last_seen DESC LIMIT ? OFFSET ?';
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
      `SELECT ta.*, GROUP_CONCAT(t.name) as tactics, GROUP_CONCAT(t.tactic_id) as tactic_ids
       FROM threat_actors ta
       LEFT JOIN actor_tactics at ON ta.actor_id = at.actor_id
       LEFT JOIN tactics t ON at.tactic_id = t.tactic_id
       WHERE ta.actor_id = ?
       GROUP BY ta.actor_id`,
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
    const { name, description, first_seen, last_seen, origin_country, tactic_ids } = req.body;

    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      const [result] = await connection.query(
        `INSERT INTO threat_actors (name, description, first_seen, last_seen, origin_country) 
        VALUES (?, ?, ?, ?, ?)`,
        [name, description, first_seen, last_seen, origin_country]
      );

      const actorId = result.insertId;

      if (tactic_ids && Array.isArray(tactic_ids)) {
        for (const tacticId of tactic_ids) {
          await connection.query(
            'INSERT INTO actor_tactics (actor_id, tactic_id) VALUES (?, ?)',
            [actorId, tacticId]
          );
        }
      }

      await connection.commit();

      res.status(201).json({
        actor_id: actorId,
        message: 'Threat actor created successfully'
      });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update actor
exports.update = async (req, res) => {
  try {
    const { name, description, first_seen, last_seen, origin_country, tactic_ids } = req.body;

    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      const [result] = await connection.query(
        `UPDATE threat_actors 
        SET name = ?, description = ?, first_seen = ?, last_seen = ?, origin_country = ?
        WHERE actor_id = ?`,
        [name, description, first_seen, last_seen, origin_country, req.params.id]
      );

      if (result.affectedRows === 0) {
        await connection.rollback();
        return res.status(404).json({ error: 'Actor not found' });
      }

      if (tactic_ids && Array.isArray(tactic_ids)) {
        // Replace tactics
        await connection.query('DELETE FROM actor_tactics WHERE actor_id = ?', [req.params.id]);
        for (const tacticId of tactic_ids) {
          await connection.query(
            'INSERT INTO actor_tactics (actor_id, tactic_id) VALUES (?, ?)',
            [req.params.id, tacticId]
          );
        }
      }

      await connection.commit();
      res.json({ message: 'Threat actor updated successfully' });

    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete actor
exports.delete = async (req, res) => {
  try {
    // Cascade delete handles relationships
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
      `SELECT i.*, it.name as type_name 
       FROM indicators i
       JOIN indicator_types it ON i.type_id = it.type_id
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
      `SELECT DISTINCT c.*, s.level as severity_level
       FROM campaigns c
       LEFT JOIN severities s ON c.severity_id = s.severity_id
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
    // Use the View v_actor_profile
    const [profiles] = await db.query(
      'SELECT * FROM v_actor_profile WHERE actor_id = ?',
      [req.params.id]
    );

    if (profiles.length === 0) {
      return res.status(404).json({ error: 'Actor not found' });
    }

    res.json(profiles[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
