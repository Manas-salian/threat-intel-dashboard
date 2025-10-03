-- Sample Data for Threat Intelligence Management System
USE threat_intelligence;

-- Insert Sources
INSERT INTO sources (name, url, update_rate, auth_type) VALUES
('AlienVault OTX', 'https://otx.alienvault.com/api/v1/indicators', 'Hourly', 'API Key'),
('VirusTotal', 'https://www.virustotal.com/api/v3/', 'Real-time', 'API Key'),
('AbuseIPDB', 'https://api.abuseipdb.com/api/v2/', 'Daily', 'API Key'),
('MISP Community', 'https://misp-project.org/feeds/', 'Daily', 'None'),
('Abuse.ch', 'https://urlhaus.abuse.ch/api/', 'Hourly', 'None'),
('EmergingThreats', 'https://rules.emergingthreats.net/', '6 Hours', 'None');

-- Insert Threat Actors
INSERT INTO threat_actors (name, description, first_seen, last_activity, mitre_tactics) VALUES
('TA542 (Emotet)', 'Known for banking trojans and infrastructure-as-a-service. Targets financial institutions globally.', '2014-06-12', '2025-09-28', 'T1566,T1071,T1059,T1027'),
('APT28 (Fancy Bear)', 'Russian state-sponsored group targeting government and military organizations.', '2007-01-15', '2025-09-30', 'T1566,T1078,T1190,T1133'),
('Lazarus Group', 'North Korean APT group known for financially motivated attacks and espionage.', '2009-03-20', '2025-10-01', 'T1566,T1204,T1059,T1053'),
('APT29 (Cozy Bear)', 'Russian intelligence-linked group focused on government and diplomatic targets.', '2008-09-10', '2025-09-25', 'T1566,T1071,T1140,T1105'),
('FIN7', 'Financially motivated group targeting payment card data in retail and hospitality.', '2013-08-01', '2025-09-29', 'T1566,T1059,T1027,T1003');

-- Insert Campaigns
INSERT INTO campaigns (name, start_date, end_date, summary, severity) VALUES
('Operation Nightshade', '2025-07-01', '2025-08-20', 'Mass phishing campaign targeting finance sector with Emotet payloads', 'High'),
('SolarWinds Supply Chain Attack', '2020-03-01', '2020-12-31', 'Sophisticated supply chain compromise affecting multiple government agencies', 'Critical'),
('WannaCry Ransomware', '2017-05-12', '2017-05-15', 'Global ransomware outbreak exploiting EternalBlue vulnerability', 'Critical'),
('Operation Aurora', '2025-06-15', '2025-09-30', 'Targeted attacks against technology companies and defense contractors', 'High'),
('Carbanak Banking Heist', '2025-08-01', NULL, 'Ongoing campaign targeting financial institutions with custom malware', 'High'),
('NotPetya Outbreak', '2017-06-27', '2017-07-10', 'Destructive malware disguised as ransomware targeting Ukraine', 'Critical');

-- Insert Indicators (IP addresses, domains, hashes, etc.)
INSERT INTO indicators (type, value, first_seen, last_seen, confidence_score, description) VALUES
-- IP Addresses
('IPv4', '192.0.2.45', '2025-09-15 08:22:10', '2025-10-02 16:47:05', 0.87, 'Emotet C2 server'),
('IPv4', '198.51.100.23', '2025-08-20 14:35:22', '2025-09-28 10:12:33', 0.92, 'APT28 infrastructure'),
('IPv4', '203.0.113.67', '2025-09-01 09:45:11', '2025-10-01 18:22:45', 0.78, 'Lazarus Group C2'),
('IPv4', '185.220.101.42', '2025-07-15 11:20:00', '2025-09-30 15:30:20', 0.85, 'Suspected Cozy Bear node'),
('IPv4', '176.123.4.89', '2025-08-10 07:15:33', '2025-09-29 12:44:18', 0.90, 'FIN7 phishing infrastructure'),

-- Domains
('domain', 'malicious-update.com', '2025-09-10 10:00:00', '2025-10-02 14:20:15', 0.95, 'Emotet payload delivery'),
('domain', 'secure-login-verify.net', '2025-08-25 16:30:45', '2025-09-27 09:15:22', 0.88, 'APT28 phishing domain'),
('domain', 'crypto-wallet-secure.org', '2025-09-05 13:22:11', '2025-10-01 11:45:30', 0.82, 'Lazarus cryptocurrency theft'),
('domain', 'gov-update-portal.com', '2025-07-20 08:44:55', '2025-09-28 16:10:40', 0.91, 'APT29 spear-phishing'),
('domain', 'payment-processor-update.biz', '2025-08-15 14:05:20', '2025-09-29 10:30:15', 0.86, 'FIN7 POS malware C2'),

-- File Hashes (SHA256)
('hash', 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2', '2025-09-12 12:00:00', '2025-10-02 08:30:22', 0.94, 'Emotet DLL loader'),
('hash', 'f2e1d0c9b8a7z6y5x4w3v2u1t0s9r8q7p6o5n4m3l2k1j0i9h8g7f6e5d4c3b2a1', '2025-08-22 10:15:33', '2025-09-28 14:22:10', 0.89, 'APT28 credential stealer'),
('hash', 'b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2f3g4', '2025-09-03 15:45:20', '2025-10-01 12:10:45', 0.91, 'Lazarus ransomware variant'),
('hash', 'c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2f3g4h5', '2025-07-18 09:30:15', '2025-09-25 11:20:30', 0.87, 'APT29 backdoor'),
('hash', 'd5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2f3g4h5i6', '2025-08-12 11:22:40', '2025-09-29 16:15:55', 0.93, 'FIN7 PowerShell payload'),

-- URLs
('url', 'http://malicious-update.com/download/update.exe', '2025-09-11 10:30:00', '2025-10-02 15:45:20', 0.96, 'Emotet malware download URL'),
('url', 'https://secure-login-verify.net/auth/verify.php', '2025-08-26 12:20:15', '2025-09-27 10:30:45', 0.90, 'APT28 credential harvesting'),
('url', 'http://crypto-wallet-secure.org/wallet/transfer', '2025-09-06 14:10:30', '2025-10-01 09:22:15', 0.84, 'Lazarus fake wallet'),

-- Email addresses
('email', 'admin@malicious-update.com', '2025-09-10 08:00:00', '2025-10-02 12:30:00', 0.88, 'Emotet phishing sender'),
('email', 'support@secure-login-verify.net', '2025-08-25 10:15:22', '2025-09-27 14:20:35', 0.85, 'APT28 phishing sender');

-- Link Indicators to Actors
INSERT INTO indicator_actor (indicator_id, actor_id) VALUES
-- Emotet (TA542)
(1, 1), (6, 1), (11, 1), (16, 1), (19, 1),
-- APT28
(2, 2), (7, 2), (12, 2), (17, 2), (20, 2),
-- Lazarus
(3, 3), (8, 3), (13, 3), (18, 3),
-- APT29
(4, 4), (9, 4), (14, 4),
-- FIN7
(5, 5), (10, 5), (15, 5);

-- Link Indicators to Campaigns
INSERT INTO indicator_campaign (indicator_id, campaign_id) VALUES
-- Operation Nightshade (Emotet)
(1, 1), (6, 1), (11, 1), (16, 1), (19, 1),
-- SolarWinds (APT29)
(4, 2), (9, 2), (14, 2),
-- Operation Aurora (APT28)
(2, 4), (7, 4), (12, 4), (17, 4), (20, 4),
-- Carbanak Banking (FIN7)
(5, 5), (10, 5), (15, 5),
-- Additional cross-campaign indicators
(3, 3), (8, 3), (13, 6);

-- Link Indicators to Sources
INSERT INTO indicator_source (indicator_id, source_id) VALUES
-- Multiple sources reporting same indicators
(1, 1), (1, 2), (1, 3),
(2, 1), (2, 4),
(3, 1), (3, 2), (3, 5),
(4, 1), (4, 6),
(5, 2), (5, 3),
(6, 1), (6, 2),
(7, 1), (7, 4),
(8, 2), (8, 5),
(9, 1), (9, 6),
(10, 2), (10, 3),
(11, 1), (11, 2), (11, 3),
(12, 1), (12, 4),
(13, 2), (13, 5),
(14, 1), (14, 6),
(15, 2), (15, 3),
(16, 1), (16, 2),
(17, 1), (17, 4),
(18, 2), (18, 5),
(19, 1), (19, 2),
(20, 1), (20, 4);
