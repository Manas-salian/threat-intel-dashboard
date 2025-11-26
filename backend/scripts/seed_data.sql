USE threat_intelligence;

-- 1. Seed Lookups
INSERT INTO severities (level, description) VALUES 
('Low', 'Minimal impact, routine threats'),
('Medium', 'Moderate impact, requires attention'),
('High', 'Significant impact, immediate action required'),
('Critical', 'Severe impact, potential breach or data loss');

INSERT INTO indicator_types (name, description) VALUES 
('IP', 'Internet Protocol Address'),
('Domain', 'Domain Name'),
('URL', 'Uniform Resource Locator'),
('Hash', 'File Hash (MD5/SHA256)');

INSERT INTO tactics (name, mitre_id, description) VALUES 
('Initial Access', 'TA0001', 'Techniques to get into the network'),
('Execution', 'TA0002', 'Techniques that result in adversary-controlled code running'),
('Persistence', 'TA0003', 'Techniques to keep access to systems across restarts'),
('Privilege Escalation', 'TA0004', 'Techniques to gain higher-level permissions'),
('Defense Evasion', 'TA0005', 'Techniques to avoid detection'),
('Credential Access', 'TA0006', 'Techniques for stealing account names and passwords'),
('Discovery', 'TA0007', 'Techniques to figure out your environment'),
('Lateral Movement', 'TA0008', 'Techniques to move through your environment'),
('Collection', 'TA0009', 'Techniques to gather data of interest'),
('Exfiltration', 'TA0010', 'Techniques to steal data');

INSERT INTO sources (name, url, reliability_score) VALUES 
('AlienVault OTX', 'https://otx.alienvault.com', 0.95),
('Abuse.ch', 'https://abuse.ch', 0.90),
('PhishTank', 'https://phishtank.com', 0.85),
('Internal Honeypot', 'internal', 1.00);

-- 2. Seed Actors
INSERT INTO threat_actors (name, description, first_seen, last_seen, origin_country) VALUES 
('APT28', 'Fancy Bear - Russian cyber espionage group', '2004-01-01', '2023-12-01', 'Russia'),
('Lazarus Group', 'North Korean state-sponsored cyber threat group', '2009-01-01', '2024-01-15', 'North Korea'),
('Equation Group', 'Highly sophisticated threat actor suspected to be tied to the NSA', '2001-01-01', '2021-01-01', 'USA'),
('OilRig', 'Iranian threat group targeting Middle East', '2016-01-01', '2023-11-20', 'Iran');

-- 3. Seed Campaigns
INSERT INTO campaigns (name, description, start_date, end_date, severity_id) VALUES 
('Operation GhostWriter', 'Disinformation campaign targeting Eastern Europe', '2017-03-01', NULL, 3),
('WannaCry', 'Global ransomware attack', '2017-05-12', '2017-05-15', 4),
('SolarWinds Hack', 'Supply chain attack via SolarWinds Orion', '2020-03-01', '2020-12-13', 4),
('Log4Shell Exploitation', 'Mass exploitation of Log4j vulnerability', '2021-12-09', NULL, 4);

-- 4. Seed Indicators
-- IPs
INSERT INTO indicators (value, type_id, confidence_score, first_seen, last_seen) VALUES 
('185.163.45.23', 1, 0.95, '2023-01-01', '2024-02-01'), -- APT28
('103.23.12.55', 1, 0.88, '2023-06-15', '2024-01-20'), -- Lazarus
('45.33.22.11', 1, 0.75, '2023-11-01', '2023-11-05');

-- Domains
INSERT INTO indicators (value, type_id, confidence_score, first_seen, last_seen) VALUES 
('update-microsoft-security.com', 2, 0.99, '2023-09-01', '2024-02-10'),
('secure-login-bank.net', 2, 0.92, '2023-12-01', '2024-02-15'),
('malicious-payload-delivery.org', 2, 0.95, '2024-01-01', '2024-01-02');

-- Hashes
INSERT INTO indicators (value, type_id, confidence_score, first_seen, last_seen) VALUES 
('e5c324567890abcdef1234567890abcdef', 4, 1.00, '2017-05-12', '2017-05-12'), -- WannaCry
('a1b2c3d4e5f678901234567890abcdef', 4, 0.98, '2020-12-13', '2020-12-13'); -- SolarWinds

-- 5. Seed Relationships
-- Actor Tactics
INSERT INTO actor_tactics (actor_id, tactic_id) VALUES 
(1, 1), (1, 6), (1, 9), -- APT28: Initial Access, Credential Access, Collection
(2, 1), (2, 2), (2, 10), -- Lazarus: Initial Access, Execution, Exfiltration
(4, 1), (4, 3); -- OilRig

-- Indicator Actor
INSERT INTO indicator_actor (indicator_id, actor_id) VALUES 
(1, 1), -- IP -> APT28
(2, 2), -- IP -> Lazarus
(4, 1), -- Domain -> APT28
(7, 2); -- Hash -> Lazarus (Simulated)

-- Indicator Campaign
INSERT INTO indicator_campaign (indicator_id, campaign_id) VALUES 
(7, 2), -- Hash -> WannaCry
(8, 3), -- Hash -> SolarWinds
(4, 1); -- Domain -> GhostWriter

-- Indicator Source
INSERT INTO indicator_source (indicator_id, source_id) VALUES 
(1, 1), (1, 2),
(2, 1),
(4, 3),
(7, 4);
