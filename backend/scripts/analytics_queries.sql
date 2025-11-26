-- Useful Analytics Queries for Threat Intelligence System

USE threat_intelligence;

-- 1. Find all campaigns associated with a specific indicator
SELECT DISTINCT c.name, c.severity, c.start_date, c.end_date, c.summary
FROM indicators i
JOIN indicator_campaign ic ON i.indicator_id = ic.indicator_id
JOIN campaigns c ON ic.campaign_id = c.campaign_id
WHERE i.value = '192.0.2.45';

-- 2. Get all indicators associated with a specific threat actor
SELECT i.type, i.value, i.confidence_score, i.first_seen, i.last_seen, i.description
FROM indicators i
JOIN indicator_actor ia ON i.indicator_id = ia.indicator_id
JOIN threat_actors ta ON ia.actor_id = ta.actor_id
WHERE ta.name = 'APT28 (Fancy Bear)'
ORDER BY i.confidence_score DESC;

-- 3. Find threat actors involved in a specific campaign
SELECT DISTINCT ta.name, ta.description, ta.mitre_tactics
FROM threat_actors ta
JOIN indicator_actor ia ON ta.actor_id = ia.actor_id
JOIN indicator_campaign ic ON ia.indicator_id = ic.indicator_id
JOIN campaigns c ON ic.campaign_id = c.campaign_id
WHERE c.name = 'Operation Nightshade';

-- 4. Get indicator counts by type
SELECT type, COUNT(*) as count, 
       AVG(confidence_score) as avg_confidence
FROM indicators
GROUP BY type
ORDER BY count DESC;

-- 5. Most active threat actors (by number of indicators)
SELECT ta.name, 
       COUNT(DISTINCT ia.indicator_id) as indicator_count,
       ta.last_seen
FROM threat_actors ta
JOIN indicator_actor ia ON ta.actor_id = ia.actor_id
GROUP BY ta.actor_id, ta.name, ta.last_seen
ORDER BY indicator_count DESC;

-- 6. Most reported sources
SELECT s.name, 
       COUNT(DISTINCT is_table.indicator_id) as indicators_reported,
       s.update_rate
FROM sources s
JOIN indicator_source is_table ON s.source_id = is_table.source_id
GROUP BY s.source_id, s.name, s.update_rate
ORDER BY indicators_reported DESC;

-- 7. Recent high-confidence indicators (last 30 days)
SELECT i.type, i.value, i.confidence_score, i.last_seen, i.description
FROM indicators i
WHERE i.last_seen >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
  AND i.confidence_score >= 0.85
ORDER BY i.last_seen DESC, i.confidence_score DESC;

-- 8. Campaign severity distribution
SELECT severity, COUNT(*) as campaign_count
FROM campaigns
GROUP BY severity
ORDER BY FIELD(severity, 'Critical', 'High', 'Medium', 'Low');

-- 9. Indicators with multiple sources (high reliability)
SELECT i.type, i.value, i.confidence_score, 
       COUNT(DISTINCT is_table.source_id) as source_count
FROM indicators i
JOIN indicator_source is_table ON i.indicator_id = is_table.indicator_id
GROUP BY i.indicator_id, i.type, i.value, i.confidence_score
HAVING source_count >= 2
ORDER BY source_count DESC, i.confidence_score DESC;

-- 10. MITRE ATT&CK tactics distribution
SELECT 
    SUBSTRING_INDEX(SUBSTRING_INDEX(ta.mitre_tactics, ',', numbers.n), ',', -1) as tactic,
    COUNT(*) as usage_count
FROM threat_actors ta
JOIN (
    SELECT 1 n UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5
) numbers ON CHAR_LENGTH(ta.mitre_tactics) - CHAR_LENGTH(REPLACE(ta.mitre_tactics, ',', '')) >= numbers.n - 1
WHERE ta.mitre_tactics IS NOT NULL
GROUP BY tactic
ORDER BY usage_count DESC;

-- 11. Timeline of new indicators per day (last 30 days)
SELECT DATE(first_seen) as date, 
       COUNT(*) as new_indicators,
       AVG(confidence_score) as avg_confidence
FROM indicators
WHERE first_seen >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
GROUP BY DATE(first_seen)
ORDER BY date DESC;

-- 12. Active campaigns (ongoing or recent)
SELECT name, start_date, end_date, severity, summary,
       DATEDIFF(COALESCE(end_date, CURDATE()), start_date) as duration_days
FROM campaigns
WHERE end_date IS NULL OR end_date >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)
ORDER BY start_date DESC;

-- 13. Cross-campaign indicators (shared IOCs)
SELECT i.type, i.value, 
       COUNT(DISTINCT ic.campaign_id) as campaign_count,
       GROUP_CONCAT(DISTINCT c.name SEPARATOR '; ') as campaigns
FROM indicators i
JOIN indicator_campaign ic ON i.indicator_id = ic.indicator_id
JOIN campaigns c ON ic.campaign_id = c.campaign_id
GROUP BY i.indicator_id, i.type, i.value
HAVING campaign_count >= 2
ORDER BY campaign_count DESC;

-- 14. Threat actor activity timeline
SELECT ta.name,
       MIN(i.first_seen) as first_indicator,
       MAX(i.last_seen) as last_indicator,
       COUNT(DISTINCT i.indicator_id) as total_indicators
FROM threat_actors ta
JOIN indicator_actor ia ON ta.actor_id = ia.actor_id
JOIN indicators i ON ia.indicator_id = i.indicator_id
GROUP BY ta.actor_id, ta.name
ORDER BY last_indicator DESC;

-- 15. Low confidence indicators that need review
SELECT i.type, i.value, i.confidence_score, i.description,
       COUNT(DISTINCT is_table.source_id) as source_count
FROM indicators i
LEFT JOIN indicator_source is_table ON i.indicator_id = is_table.indicator_id
WHERE i.confidence_score < 0.70
GROUP BY i.indicator_id, i.type, i.value, i.confidence_score, i.description
ORDER BY i.confidence_score ASC;
