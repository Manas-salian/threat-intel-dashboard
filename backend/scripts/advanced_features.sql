USE threat_intelligence;

-- 1. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    action_type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INT,
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Stored Procedure: CheckIndicator
DROP PROCEDURE IF EXISTS CheckIndicator;
DELIMITER //
CREATE PROCEDURE CheckIndicator(IN p_value VARCHAR(500))
BEGIN
    SELECT 
        i.indicator_id,
        i.type,
        i.value,
        i.confidence_score,
        i.first_seen,
        i.last_seen,
        GROUP_CONCAT(DISTINCT ta.name) as related_actors,
        GROUP_CONCAT(DISTINCT c.name) as related_campaigns
    FROM indicators i
    LEFT JOIN indicator_actor ia ON i.indicator_id = ia.indicator_id
    LEFT JOIN threat_actors ta ON ia.actor_id = ta.actor_id
    LEFT JOIN indicator_campaign ic ON i.indicator_id = ic.indicator_id
    LEFT JOIN campaigns c ON ic.campaign_id = c.campaign_id
    WHERE i.value = p_value
    GROUP BY i.indicator_id;
END //
DELIMITER ;

-- 3. Trigger: Log Indicator Insertion
DROP TRIGGER IF EXISTS after_indicator_insert;
DELIMITER //
CREATE TRIGGER after_indicator_insert
AFTER INSERT ON indicators
FOR EACH ROW
BEGIN
    INSERT INTO audit_logs (action_type, entity_type, entity_id, details)
    VALUES ('INSERT', 'INDICATOR', NEW.indicator_id, CONCAT('New indicator added: ', NEW.value, ' (', NEW.type, ')'));
END //
DELIMITER ;

-- 4. View: Threat Summary
CREATE OR REPLACE VIEW v_threat_summary AS
SELECT 
    i.type,
    COUNT(DISTINCT i.indicator_id) as indicator_count,
    AVG(i.confidence_score) as avg_confidence,
    MAX(i.last_seen) as latest_activity
FROM indicators i
GROUP BY i.type;

-- 5. Additional Indexes
-- Using CREATE INDEX directly; if they exist it might fail, but IF NOT EXISTS is only available in newer MySQL versions (8.0+).
-- We'll wrap in a safe block or just attempt creation.
-- Assuming MySQL 8.0+ for IF NOT EXISTS, otherwise we'd need a procedure to check.
-- Given the context, we'll try standard creation and let it fail gracefully if dupes (or use a procedure).
-- For simplicity in this script, we'll assume they might not exist or use a safe approach.

DELIMITER //
CREATE PROCEDURE CreateIndexIfNotExists(IN indexName VARCHAR(64), IN tableName VARCHAR(64), IN columnNames VARCHAR(255))
BEGIN
    IF((SELECT COUNT(*) AS index_exists FROM information_schema.statistics WHERE TABLE_SCHEMA = DATABASE() AND table_name = tableName AND index_name = indexName) = 0) THEN
        SET @s = CONCAT('CREATE INDEX ', indexName, ' ON ', tableName, ' (', columnNames, ')');
        PREPARE stmt FROM @s;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END //
DELIMITER ;

CALL CreateIndexIfNotExists('idx_indicator_conf_type', 'indicators', 'type, confidence_score');
CALL CreateIndexIfNotExists('idx_actor_mitre', 'threat_actors', 'mitre_tactics(255)');

DROP PROCEDURE CreateIndexIfNotExists;
