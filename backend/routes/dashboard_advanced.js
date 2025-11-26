const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Threat Summary
router.get('/stats', async (req, res) => {
    try {
        // Get accurate counts from tables
        const [counts] = await db.query(`
            SELECT 
                (SELECT COUNT(*) FROM indicators) as totalIndicators,
                (SELECT COUNT(*) FROM threat_actors) as totalActors,
                (SELECT COUNT(*) FROM campaigns) as totalCampaigns,
                (SELECT COUNT(*) FROM sources) as totalSources,
                (SELECT COUNT(*) FROM indicators WHERE DATE(first_seen) = CURDATE()) as newIndicatorsToday
        `);

        // Indicator Types
        const [types] = await db.query(`
            SELECT it.name as type, COUNT(*) as count
            FROM indicators i
            JOIN indicator_types it ON i.type_id = it.type_id
            GROUP BY it.name
            ORDER BY count DESC
        `);

        // Recent High-Confidence Indicators
        const [recent] = await db.query(`
            SELECT 
                i.indicator_id,
                it.name as type,
                i.value,
                i.confidence_score,
                i.last_seen,
                i.description
            FROM indicators i
            JOIN indicator_types it ON i.type_id = it.type_id
            WHERE i.confidence_score >= 0.7
            ORDER BY i.last_seen DESC 
            LIMIT 10
        `);

        // Campaign Severity Distribution
        const [severities] = await db.query(`
            SELECT s.level as severity, COUNT(*) as count
            FROM campaigns c
            JOIN severities s ON c.severity_id = s.severity_id
            GROUP BY s.level
            ORDER BY 
                CASE s.level
                    WHEN 'critical' THEN 1
                    WHEN 'high' THEN 2
                    WHEN 'medium' THEN 3
                    WHEN 'low' THEN 4
                    ELSE 5
                END
        `);

        res.json({
            ...counts[0],
            indicatorTypes: types,
            recentIndicators: recent,
            campaignSeverity: severities
        });
    } catch (err) {
        console.error('Error fetching stats:', err);
        res.status(500).json({ error: err.message });
    }
});

// Audit Logs
router.get('/audit-logs', async (req, res) => {
    try {
        // Since audit_logs table may not exist in the schema, return empty array or recent indicators as activity
        const [rows] = await db.query(`
            SELECT 
                indicator_id as id,
                'indicator' as entity_type,
                'created' as action,
                CONCAT('New ', it.name, ' indicator added: ', SUBSTRING(i.value, 1, 50)) as description,
                i.created_at
            FROM indicators i
            JOIN indicator_types it ON i.type_id = it.type_id
            ORDER BY i.created_at DESC 
            LIMIT 50
        `);
        res.json(rows);
    } catch (err) {
        console.error('Error fetching audit logs:', err);
        res.status(500).json({ error: err.message });
    }
});

// Top Threat Actors
router.get('/top-actors', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT 
                a.actor_id,
                a.name,
                a.description,
                COUNT(ia.indicator_id) as indicator_count,
                a.last_seen
            FROM threat_actors a
            LEFT JOIN indicator_actor ia ON a.actor_id = ia.actor_id
            GROUP BY a.actor_id, a.name, a.description, a.last_seen
            HAVING indicator_count > 0
            ORDER BY indicator_count DESC 
            LIMIT 5
        `);
        res.json(rows);
    } catch (err) {
        console.error('Error fetching top actors:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
