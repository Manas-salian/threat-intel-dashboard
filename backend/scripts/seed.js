#!/usr/bin/env node
/**
 * MongoDB Seed Script for Threat Intelligence Dashboard
 * Populates the database with sample data for development/testing.
 *
 * Usage: node backend/scripts/seed.js
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const Indicator = require('../models/Indicator');
const ThreatActor = require('../models/ThreatActor');
const Campaign = require('../models/Campaign');
const Source = require('../models/Source');
const AuditLog = require('../models/AuditLog');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/threat_intelligence';

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  // Clear existing data
  await Promise.all([
    Indicator.deleteMany({}),
    ThreatActor.deleteMany({}),
    Campaign.deleteMany({}),
    Source.deleteMany({}),
    AuditLog.deleteMany({})
  ]);
  console.log('Cleared existing data');

  // Sources
  const sources = await Source.insertMany([
    { name: 'AlienVault OTX', url: 'https://otx.alienvault.com', reliability_score: 0.85 },
    { name: 'AbuseIPDB', url: 'https://abuseipdb.com', reliability_score: 0.90 },
    { name: 'VirusTotal', url: 'https://virustotal.com', reliability_score: 0.95 },
    { name: 'MISP Community', url: 'https://misp-project.org', reliability_score: 0.80 },
    { name: 'Internal Honeypot', url: 'internal://honeypot-cluster', reliability_score: 0.70 }
  ]);
  console.log(`Created ${sources.length} sources`);

  // Threat Actors
  const actors = await ThreatActor.insertMany([
    {
      name: 'APT28 (Fancy Bear)',
      description: 'Russian state-sponsored cyber espionage group, also known as Sofacy. Known for targeting government and military institutions.',
      origin_country: 'Russia',
      first_seen: new Date('2014-01-01'),
      last_seen: new Date('2026-03-15'),
      tactics: ['Initial Access', 'Execution', 'Credential Access', 'Lateral Movement']
    },
    {
      name: 'APT29 (Cozy Bear)',
      description: 'Russian threat group attributed to SVR. Known for SolarWinds supply chain attack.',
      origin_country: 'Russia',
      first_seen: new Date('2015-06-01'),
      last_seen: new Date('2026-03-20'),
      tactics: ['Initial Access', 'Persistence', 'Defense Evasion', 'Collection']
    },
    {
      name: 'Lazarus Group',
      description: 'North Korean state-sponsored threat group. Known for WannaCry, Sony hack, and cryptocurrency theft.',
      origin_country: 'North Korea',
      first_seen: new Date('2009-01-01'),
      last_seen: new Date('2026-04-01'),
      tactics: ['Execution', 'Impact', 'Resource Development', 'Initial Access']
    },
    {
      name: 'APT41 (Double Dragon)',
      description: 'Chinese state-sponsored group conducting both espionage and financially motivated attacks.',
      origin_country: 'China',
      first_seen: new Date('2012-01-01'),
      last_seen: new Date('2026-02-28'),
      tactics: ['Supply Chain Compromise', 'Exploitation', 'Persistence']
    },
    {
      name: 'Turla',
      description: 'Sophisticated Russian cyber espionage group targeting government entities globally, also known as Snake.',
      origin_country: 'Russia',
      first_seen: new Date('2008-01-01'),
      last_seen: new Date('2026-01-15'),
      tactics: ['Initial Access', 'Command and Control', 'Exfiltration']
    },
    {
      name: 'Carbanak',
      description: 'Financially motivated threat group targeting banking and financial institutions worldwide.',
      origin_country: 'Unknown',
      first_seen: new Date('2013-01-01'),
      last_seen: new Date('2025-12-01'),
      tactics: ['Credential Access', 'Lateral Movement', 'Impact']
    }
  ]);
  console.log(`Created ${actors.length} threat actors`);

  // Campaigns
  const campaigns = await Campaign.insertMany([
    {
      name: 'Operation SolarStorm',
      description: 'Large-scale supply chain attack targeting government agencies via compromised software updates.',
      start_date: new Date('2025-11-01'),
      end_date: null,
      severity: 'critical'
    },
    {
      name: 'DarkGate Malware Distribution',
      description: 'Widespread phishing campaign distributing DarkGate RAT through Teams messages and email.',
      start_date: new Date('2025-09-15'),
      end_date: new Date('2026-02-01'),
      severity: 'high'
    },
    {
      name: 'Crypto Harvest',
      description: 'Lazarus-linked cryptocurrency exchange compromise campaign.',
      start_date: new Date('2026-01-01'),
      end_date: null,
      severity: 'critical'
    },
    {
      name: 'Phishing Wave Q1-2026',
      description: 'Coordinated phishing campaign targeting financial sector, delivering credential stealers.',
      start_date: new Date('2026-01-15'),
      end_date: new Date('2026-03-30'),
      severity: 'medium'
    },
    {
      name: 'Watering Hole - Defense Sector',
      description: 'Strategic web compromises targeting defense contractor websites to deliver exploits.',
      start_date: new Date('2025-08-01'),
      end_date: new Date('2025-12-15'),
      severity: 'high'
    },
    {
      name: 'Ransomware Blitz',
      description: 'Mass ransomware deployment targeting healthcare sector via exposed RDP.',
      start_date: new Date('2026-02-01'),
      end_date: null,
      severity: 'critical'
    },
    {
      name: 'Low-Priority Scanning',
      description: 'Automated scanning activity from known botnets, no targeted payloads detected.',
      start_date: new Date('2026-03-01'),
      end_date: null,
      severity: 'low'
    }
  ]);
  console.log(`Created ${campaigns.length} campaigns`);

  // Indicators — linked to sources, actors, campaigns
  const indicatorData = [
    { value: '185.220.101.34', type: 'IPv4', confidence_score: 0.95, description: 'C2 server for APT28 operations', sources: [sources[0]._id, sources[1]._id], actors: [actors[0]._id], campaigns: [campaigns[0]._id], first_seen: new Date('2025-11-15'), last_seen: new Date('2026-03-20') },
    { value: '91.219.238.41', type: 'IPv4', confidence_score: 0.88, description: 'AbuseIPDB blacklisted - brute force attempts', sources: [sources[1]._id], actors: [], campaigns: [campaigns[5]._id], first_seen: new Date('2026-02-01'), last_seen: new Date('2026-04-01') },
    { value: '45.33.32.156', type: 'IPv4', confidence_score: 0.72, description: 'Suspected proxy for Lazarus operations', sources: [sources[0]._id], actors: [actors[2]._id], campaigns: [campaigns[2]._id], first_seen: new Date('2026-01-10'), last_seen: new Date('2026-03-25') },
    { value: '103.224.182.250', type: 'IPv4', confidence_score: 0.65, description: 'Scanning activity from Asian botnet', sources: [sources[4]._id], actors: [], campaigns: [campaigns[6]._id], first_seen: new Date('2026-03-05'), last_seen: new Date('2026-04-02') },
    { value: '198.51.100.23', type: 'IPv4', confidence_score: 0.90, description: 'Ransomware C2 endpoint', sources: [sources[1]._id, sources[2]._id], actors: [], campaigns: [campaigns[5]._id], first_seen: new Date('2026-02-10'), last_seen: new Date('2026-03-30') },
    { value: 'evil-updates.com', type: 'domain', confidence_score: 0.93, description: 'Malicious update server used in supply chain attack', sources: [sources[0]._id, sources[2]._id], actors: [actors[1]._id], campaigns: [campaigns[0]._id], first_seen: new Date('2025-11-01'), last_seen: new Date('2026-03-18') },
    { value: 'darkgate-panel.xyz', type: 'domain', confidence_score: 0.88, description: 'DarkGate RAT panel domain', sources: [sources[2]._id], actors: [actors[3]._id], campaigns: [campaigns[1]._id], first_seen: new Date('2025-09-20'), last_seen: new Date('2026-01-15') },
    { value: 'phish-bank-login.com', type: 'domain', confidence_score: 0.78, description: 'Banking phishing domain mimicking legitimate login page', sources: [sources[3]._id], actors: [actors[5]._id], campaigns: [campaigns[3]._id], first_seen: new Date('2026-01-20'), last_seen: new Date('2026-03-15') },
    { value: 'crypto-wallet-verify.net', type: 'domain', confidence_score: 0.85, description: 'Cryptocurrency phishing domain linked to Lazarus', sources: [sources[0]._id], actors: [actors[2]._id], campaigns: [campaigns[2]._id], first_seen: new Date('2026-01-05'), last_seen: new Date('2026-04-01') },
    { value: 'https://evil-updates.com/payload/stage2.exe', type: 'URL', confidence_score: 0.97, description: 'Second stage payload delivery URL', sources: [sources[2]._id], actors: [actors[1]._id], campaigns: [campaigns[0]._id], first_seen: new Date('2025-12-01'), last_seen: new Date('2026-02-28') },
    { value: 'https://phish-bank-login.com/auth/verify', type: 'URL', confidence_score: 0.75, description: 'Credential harvesting page', sources: [sources[3]._id], actors: [actors[5]._id], campaigns: [campaigns[3]._id], first_seen: new Date('2026-02-01'), last_seen: new Date('2026-03-20') },
    { value: 'd131dd02c5e6eec4693d9a0698aff95c', type: 'hash', confidence_score: 0.99, description: 'Trojanized software update binary — Operation SolarStorm', sources: [sources[0]._id, sources[2]._id], actors: [actors[0]._id, actors[1]._id], campaigns: [campaigns[0]._id], first_seen: new Date('2025-11-10'), last_seen: new Date('2026-03-01') },
    { value: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6', type: 'hash', confidence_score: 0.82, description: 'DarkGate RAT sample — variant B', sources: [sources[2]._id], actors: [actors[3]._id], campaigns: [campaigns[1]._id], first_seen: new Date('2025-10-01'), last_seen: new Date('2026-01-20') },
    { value: 'ff5e3b2a1c4d6e8f0a2b4c6d8e0f1a3b', type: 'hash', confidence_score: 0.91, description: 'Ransomware binary — encrypted payload', sources: [sources[1]._id, sources[2]._id], actors: [], campaigns: [campaigns[5]._id], first_seen: new Date('2026-02-05'), last_seen: new Date('2026-03-28') },
    { value: 'spear-phish@evil-updates.com', type: 'email', confidence_score: 0.86, description: 'Spear phishing sender used in initial compromise', sources: [sources[3]._id], actors: [actors[0]._id], campaigns: [campaigns[0]._id], first_seen: new Date('2025-11-05'), last_seen: new Date('2026-01-30') },
    { value: 'support@crypto-wallet-verify.net', type: 'email', confidence_score: 0.79, description: 'Social engineering email for cryptocurrency theft', sources: [sources[0]._id], actors: [actors[2]._id], campaigns: [campaigns[2]._id], first_seen: new Date('2026-01-08'), last_seen: new Date('2026-03-22') },
    { value: '2001:db8:85a3::8a2e:370:7334', type: 'IPv6', confidence_score: 0.60, description: 'IPv6 endpoint observed in reconnaissance activity', sources: [sources[4]._id], actors: [actors[4]._id], campaigns: [], first_seen: new Date('2026-01-01'), last_seen: new Date('2026-02-15') },
    { value: '10.0.0.1', type: 'IPv4', confidence_score: 0.45, description: 'Internal honeypot trigger — likely automated scan', sources: [sources[4]._id], actors: [], campaigns: [campaigns[6]._id], first_seen: new Date('2026-03-10'), last_seen: new Date('2026-04-03') },
  ];

  const indicators = await Indicator.insertMany(indicatorData);
  console.log(`Created ${indicators.length} indicators`);

  // Audit logs for the seed
  await AuditLog.create({
    action_type: 'INGEST',
    entity_type: 'system',
    details: `Database seeded with ${indicators.length} indicators, ${actors.length} actors, ${campaigns.length} campaigns, ${sources.length} sources`
  });

  console.log('\n✓ Seed complete!');
  console.log(`  ${sources.length} sources`);
  console.log(`  ${actors.length} threat actors`);
  console.log(`  ${campaigns.length} campaigns`);
  console.log(`  ${indicators.length} indicators`);

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
