-- Threat Intelligence Database Schema v2 (Normalized)
DROP DATABASE IF EXISTS threat_intelligence;
CREATE DATABASE threat_intelligence;
USE threat_intelligence;

-- 1. Lookup Tables (Normalization)
CREATE TABLE severities (
    severity_id INT AUTO_INCREMENT PRIMARY KEY,
    level VARCHAR(50) NOT NULL UNIQUE, -- Low, Medium, High, Critical
    description VARCHAR(255)
);

CREATE TABLE indicator_types (
    type_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE, -- IP, Domain, URL, Hash
    description VARCHAR(255)
);

CREATE TABLE tactics (
    tactic_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE, -- e.g., Initial Access, Execution
    mitre_id VARCHAR(20), -- e.g., TA0001
    description TEXT
);

CREATE TABLE sources (
    source_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    url VARCHAR(500),
    reliability_score DECIMAL(3,2) DEFAULT 0.50,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Core Entities
CREATE TABLE threat_actors (
    actor_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    first_seen DATE,
    last_seen DATE,
    origin_country VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE campaigns (
    campaign_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    start_date DATE,
    end_date DATE,
    severity_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (severity_id) REFERENCES severities(severity_id)
);

CREATE TABLE indicators (
    indicator_id INT AUTO_INCREMENT PRIMARY KEY,
    value VARCHAR(500) NOT NULL,
    type_id INT NOT NULL,
    confidence_score DECIMAL(3,2) DEFAULT 0.00,
    first_seen DATETIME,
    last_seen DATETIME,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (type_id) REFERENCES indicator_types(type_id),
    UNIQUE KEY unique_indicator (value, type_id)
);

-- 3. Relationships (Junction Tables)
CREATE TABLE actor_tactics (
    actor_id INT,
    tactic_id INT,
    PRIMARY KEY (actor_id, tactic_id),
    FOREIGN KEY (actor_id) REFERENCES threat_actors(actor_id) ON DELETE CASCADE,
    FOREIGN KEY (tactic_id) REFERENCES tactics(tactic_id) ON DELETE CASCADE
);

CREATE TABLE indicator_actor (
    indicator_id INT,
    actor_id INT,
    PRIMARY KEY (indicator_id, actor_id),
    FOREIGN KEY (indicator_id) REFERENCES indicators(indicator_id) ON DELETE CASCADE,
    FOREIGN KEY (actor_id) REFERENCES threat_actors(actor_id) ON DELETE CASCADE
);

CREATE TABLE indicator_campaign (
    indicator_id INT,
    campaign_id INT,
    PRIMARY KEY (indicator_id, campaign_id),
    FOREIGN KEY (indicator_id) REFERENCES indicators(indicator_id) ON DELETE CASCADE,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(campaign_id) ON DELETE CASCADE
);

CREATE TABLE indicator_source (
    indicator_id INT,
    source_id INT,
    PRIMARY KEY (indicator_id, source_id),
    FOREIGN KEY (indicator_id) REFERENCES indicators(indicator_id) ON DELETE CASCADE,
    FOREIGN KEY (source_id) REFERENCES sources(source_id) ON DELETE CASCADE
);

-- 4. Advanced Views
CREATE VIEW v_global_threat_map AS
SELECT 
    i.indicator_id,
    i.value,
    it.name AS type,
    i.confidence_score,
    i.last_seen,
    GROUP_CONCAT(DISTINCT ta.name) as actors,
    GROUP_CONCAT(DISTINCT c.name) as campaigns,
    s.level as max_severity
FROM indicators i
JOIN indicator_types it ON i.type_id = it.type_id
LEFT JOIN indicator_actor ia ON i.indicator_id = ia.indicator_id
LEFT JOIN threat_actors ta ON ia.actor_id = ta.actor_id
LEFT JOIN indicator_campaign ic ON i.indicator_id = ic.indicator_id
LEFT JOIN campaigns c ON ic.campaign_id = c.campaign_id
LEFT JOIN severities s ON c.severity_id = s.severity_id
GROUP BY i.indicator_id;

CREATE VIEW v_actor_profile AS
SELECT 
    ta.actor_id,
    ta.name,
    ta.origin_country,
    COUNT(DISTINCT ia.indicator_id) as indicator_count,
    COUNT(DISTINCT ic.campaign_id) as campaign_count,
    GROUP_CONCAT(DISTINCT t.name) as tactics
FROM threat_actors ta
LEFT JOIN indicator_actor ia ON ta.actor_id = ia.actor_id
LEFT JOIN indicator_campaign ic ON ia.indicator_id = ic.indicator_id
LEFT JOIN actor_tactics at ON ta.actor_id = at.actor_id
LEFT JOIN tactics t ON at.tactic_id = t.tactic_id
GROUP BY ta.actor_id;

-- 5. Audit Log (Preserved from v1 but updated)
CREATE TABLE audit_logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    action_type VARCHAR(50),
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DELIMITER //
CREATE TRIGGER after_indicator_insert
AFTER INSERT ON indicators
FOR EACH ROW
BEGIN
    INSERT INTO audit_logs (action_type, details)
    VALUES ('INSERT', CONCAT('New indicator added: ', NEW.value));
END //
DELIMITER ;
