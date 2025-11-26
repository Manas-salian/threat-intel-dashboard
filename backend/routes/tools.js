const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { exec } = require('child_process');
const path = require('path');

// Check Indicator
router.post('/check', async (req, res) => {
  try {
    const { value } = req.body;
    if (!value) {
      return res.status(400).json({ error: 'Value is required' });
    }

    // Query indicators table directly with joins
    const [rows] = await db.query(`
      SELECT 
        i.indicator_id,
        i.value,
        it.name as type,
        i.confidence_score,
        i.first_seen,
        i.last_seen,
        GROUP_CONCAT(DISTINCT ta.name) as actors,
        GROUP_CONCAT(DISTINCT c.name) as campaigns
      FROM indicators i
      JOIN indicator_types it ON i.type_id = it.type_id
      LEFT JOIN indicator_actor ia ON i.indicator_id = ia.indicator_id
      LEFT JOIN threat_actors ta ON ia.actor_id = ta.actor_id
      LEFT JOIN indicator_campaign ic ON i.indicator_id = ic.indicator_id
      LEFT JOIN campaigns c ON ic.campaign_id = c.campaign_id
      WHERE i.value = ?
      GROUP BY i.indicator_id
      LIMIT 1
    `, [value]);

    if (rows.length > 0) {
      res.json({ found: true, data: rows[0] });
    } else {
      res.json({ found: false, message: 'Indicator not found in database' });
    }
  } catch (err) {
    console.error('Error checking indicator:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// Backup Database
router.post('/backup', (req, res) => {
  const scriptPath = path.join(__dirname, '../scripts/backup.sh');
  const { DB_USER, DB_PASSWORD } = process.env;

  const cmd = `"${scriptPath}" "${DB_USER}" "${DB_PASSWORD}"`;

  exec(cmd, (error, stdout, stderr) => {
    if (error) {
      console.error(`Backup error: ${error}`);
      return res.status(500).json({ error: 'Backup failed', details: stderr });
    }
    try {
      const match = stdout.match(/\{.*\}/);
      if (match) {
        res.json(JSON.parse(match[0]));
      } else {
        res.json({ status: 'success', message: 'Backup completed', output: stdout });
      }
    } catch (e) {
      res.json({ status: 'success', output: stdout });
    }
  });
});

// Restore Database
router.post('/restore', (req, res) => {
  const { filename } = req.body;
  if (!filename) {
    return res.status(400).json({ error: 'Filename is required' });
  }

  const scriptPath = path.join(__dirname, '../scripts/restore.sh');
  const safeFilename = path.basename(filename);
  const backupPath = path.join(__dirname, '../backups', safeFilename);

  const { DB_USER, DB_PASSWORD } = process.env;
  const cmd = `"${scriptPath}" "${backupPath}" "${DB_USER}" "${DB_PASSWORD}"`;

  exec(cmd, (error, stdout, stderr) => {
    if (error) {
      console.error(`Restore error: ${error}`);
      return res.status(500).json({ error: 'Restore failed', details: stderr });
    }
    res.json({ status: 'success', message: 'Restore completed' });
  });
});

// List Backups
router.get('/backups', (req, res) => {
  const fs = require('fs');
  const backupDir = path.join(__dirname, '../backups');

  if (!fs.existsSync(backupDir)) {
    return res.json([]);
  }

  fs.readdir(backupDir, (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to list backups' });
    }
    const backups = files.filter(f => f.endsWith('.sql')).map(f => ({
      filename: f,
      created: fs.statSync(path.join(backupDir, f)).birthtime
    }));
    res.json(backups);
  });
});

module.exports = router;
