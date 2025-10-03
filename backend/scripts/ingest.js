const db = require('../config/database');
require('dotenv').config();

// Generate random date within range
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Generate random IP address
function randomIP() {
  return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
}

// Generate random hash
function randomHash(length = 32) {
  const chars = '0123456789abcdef';
  let hash = '';
  for (let i = 0; i < length; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
}

// Generate mock data generators
const mockData = {
  sources: [
    { name: 'AlienVault OTX', url: 'https://otx.alienvault.com/api/v1', update_rate: 'Hourly', auth_type: 'API Key' },
    { name: 'AbuseIPDB', url: 'https://api.abuseipdb.com/api/v2', update_rate: 'Daily', auth_type: 'API Key' },
    { name: 'VirusTotal', url: 'https://www.virustotal.com/api/v3', update_rate: 'Hourly', auth_type: 'API Key' },
    { name: 'Shodan', url: 'https://api.shodan.io', update_rate: 'Daily', auth_type: 'API Key' },
    { name: 'ThreatCrowd', url: 'https://www.threatcrowd.org/api/v2', update_rate: 'Daily', auth_type: 'None' },
    { name: 'URLhaus', url: 'https://urlhaus-api.abuse.ch/v1', update_rate: 'Hourly', auth_type: 'None' },
    { name: 'PhishTank', url: 'https://checkurl.phishtank.com/checkurl/', update_rate: 'Daily', auth_type: 'API Key' },
    { name: 'Malware Bazaar', url: 'https://mb-api.abuse.ch/api/v1', update_rate: 'Hourly', auth_type: 'None' }
  ],
  
  actorNames: [
    'APT28 (Fancy Bear)', 'APT29 (Cozy Bear)', 'APT32 (OceanLotus)', 'APT33', 'APT34 (OilRig)',
    'APT37', 'APT38', 'APT39', 'APT40', 'APT41', 'Lazarus Group', 'Kimsuky', 'Turla',
    'Equation Group', 'Carbanak', 'FIN7', 'FIN8', 'TA505', 'TA542 (Emotet)', 'TA551',
    'Wizard Spider', 'Sandworm', 'Hafnium', 'Nobelium', 'Dark Halo', 'SolarWinds Attackers',
    'Conti Gang', 'REvil', 'DarkSide', 'BlackMatter'
  ],
  
  actorOrigins: ['Russia', 'China', 'North Korea', 'Iran', 'Unknown', 'Eastern Europe', 'Southeast Asia'],
  
  actorDescriptions: [
    'State-sponsored cyber espionage group targeting government entities',
    'Financially motivated cybercrime organization specializing in ransomware',
    'Advanced persistent threat group focused on intellectual property theft',
    'Cyber warfare unit conducting disruptive operations against critical infrastructure',
    'Sophisticated hacking collective involved in large-scale data breaches',
    'Organized crime group distributing banking trojans and malware',
    'Nation-state actor conducting surveillance and reconnaissance operations',
    'Hacktivist group targeting corporations and government agencies'
  ],
  
  campaignPrefixes: [
    'Operation', 'Project', 'Campaign', 'Wave', 'Storm', 'Shadow', 'Dark', 'Silent', 
    'Ghost', 'Phantom', 'Viper', 'Dragon', 'Eagle', 'Falcon', 'Tiger', 'Wolf'
  ],
  
  campaignSuffixes: [
    'Thunder', 'Strike', 'Blade', 'Shield', 'Lotus', 'Venom', 'Frost', 'Fire',
    'Night', 'Dawn', 'Eclipse', 'Nexus', 'Prism', 'Quantum', 'Cipher', 'Vector'
  ],
  
  domains: [
    'malware-download.com', 'phishing-site.net', 'fake-bank-login.com', 'credential-harvester.org',
    'c2-server.net', 'exploit-kit.com', 'trojan-dropper.net', 'ransomware-panel.com',
    'botnet-controller.org', 'data-exfiltration.net', 'command-control.com', 'payload-delivery.net'
  ],
  
  mitreTactics: [
    'T1566,T1071,T1059', 'T1190,T1133,T1078', 'T1053,T1547,T1543', 'T1027,T1036,T1055',
    'T1003,T1082,T1083', 'T1041,T1048,T1071', 'T1486,T1490,T1489', 'T1204,T1105,T1059'
  ]
};

async function clearAllData() {
  console.log('Clearing existing data...');
  try {
    await db.query('SET FOREIGN_KEY_CHECKS = 0');
    await db.query('TRUNCATE TABLE indicator_campaign');
    await db.query('TRUNCATE TABLE indicator_actor');
    await db.query('TRUNCATE TABLE indicator_source');
    await db.query('TRUNCATE TABLE indicators');
    await db.query('TRUNCATE TABLE campaigns');
    await db.query('TRUNCATE TABLE threat_actors');
    await db.query('TRUNCATE TABLE sources');
    await db.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('✓ All existing data cleared\n');
  } catch (error) {
    console.error('Error clearing data:', error.message);
    throw error;
  }
}

async function insertMockData() {
  try {
    console.log('='.repeat(60));
    console.log('INSERTING LARGE MOCK DATA SET');
    console.log('='.repeat(60));
    console.log();
    
    // Clear existing data first
    await clearAllData();
    
    // Insert sources
    console.log('Inserting sources...');
    const sourceIds = [];
    for (const source of mockData.sources) {
      const [result] = await db.query(
        'INSERT INTO sources (name, url, update_rate, auth_type) VALUES (?, ?, ?, ?)',
        [source.name, source.url, source.update_rate, source.auth_type]
      );
      sourceIds.push(result.insertId);
    }
    console.log(`✓ Inserted ${sourceIds.length} sources\n`);
    
    // Insert threat actors (30 actors)
    console.log('Inserting threat actors...');
    const actorIds = [];
    for (let i = 0; i < 30; i++) {
      const name = mockData.actorNames[i % mockData.actorNames.length] + (i >= mockData.actorNames.length ? ` Variant ${Math.floor(i / mockData.actorNames.length)}` : '');
      const description = mockData.actorDescriptions[i % mockData.actorDescriptions.length];
      const mitre = mockData.mitreTactics[i % mockData.mitreTactics.length];
      const firstSeen = randomDate(new Date(2020, 0, 1), new Date(2024, 0, 1));
      const lastActivity = randomDate(new Date(2024, 6, 1), new Date());
      
      const [result] = await db.query(
        `INSERT INTO threat_actors (name, description, first_seen, last_activity, mitre_tactics) 
         VALUES (?, ?, ?, ?, ?)`,
        [name, description, firstSeen, lastActivity, mitre]
      );
      actorIds.push(result.insertId);
    }
    console.log(`✓ Inserted ${actorIds.length} threat actors\n`);
    
    // Insert campaigns (50 campaigns)
    console.log('Inserting campaigns...');
    const campaignIds = [];
    const campaignSeverities = ['low', 'medium', 'high', 'critical'];
    
    for (let i = 0; i < 50; i++) {
      const prefix = mockData.campaignPrefixes[Math.floor(Math.random() * mockData.campaignPrefixes.length)];
      const suffix = mockData.campaignSuffixes[Math.floor(Math.random() * mockData.campaignSuffixes.length)];
      const name = `${prefix} ${suffix} ${i + 1}`; // Add index to ensure uniqueness
      const startDate = randomDate(new Date(2024, 0, 1), new Date(2025, 8, 1));
      const endDate = Math.random() > 0.4 ? randomDate(startDate, new Date()) : null;
      const severity = campaignSeverities[Math.floor(Math.random() * campaignSeverities.length)];
      const description = `${name} campaign detected targeting multiple sectors with ${severity} severity indicators`;
      
      const [result] = await db.query(
        `INSERT INTO campaigns (name, summary, start_date, end_date, severity) 
         VALUES (?, ?, ?, ?, ?)`,
        [name, description, startDate, endDate, severity]
      );
      campaignIds.push(result.insertId);
    }
    console.log(`✓ Inserted ${campaignIds.length} campaigns\n`);
    
    // Insert indicators (2000 indicators)
    console.log('Inserting indicators (this may take a moment)...');
    const indicatorIds = [];
    const types = ['IPv4', 'IPv6', 'domain', 'URL', 'hash', 'email'];
    const indicatorSeverities = ['low', 'medium', 'high', 'critical'];
    
    const batchSize = 100;
    for (let batch = 0; batch < 2000 / batchSize; batch++) {
      const indicatorValues = [];
      
      for (let i = 0; i < batchSize; i++) {
        const type = types[Math.floor(Math.random() * types.length)];
        let value;
        
        switch (type) {
          case 'IPv4':
            value = randomIP();
            break;
          case 'IPv6':
            value = `2001:0db8:${randomHash(4)}:${randomHash(4)}:${randomHash(4)}:${randomHash(4)}:${randomHash(4)}:${randomHash(4)}`;
            break;
          case 'domain':
            value = `${randomHash(8)}.${mockData.domains[Math.floor(Math.random() * mockData.domains.length)]}`;
            break;
          case 'URL':
            value = `http://${randomHash(8)}.com/${randomHash(12)}`;
            break;
          case 'hash':
            value = randomHash(64);
            break;
          case 'email':
            value = `${randomHash(8)}@${randomHash(6)}.com`;
            break;
        }
        
        const confidence = (Math.random() * 0.5 + 0.5).toFixed(2); // 0.5 to 1.0
        const firstSeen = randomDate(new Date(2024, 0, 1), new Date(2025, 8, 1));
        const lastSeen = randomDate(firstSeen, new Date());
        const description = `${type} indicator detected (confidence: ${confidence})`;
        
        indicatorValues.push([type, value, firstSeen, lastSeen, parseFloat(confidence), description]);
      }
      
      const placeholders = indicatorValues.map(() => '(?, ?, ?, ?, ?, ?)').join(',');
      const flatValues = indicatorValues.flat();
      
      const [result] = await db.query(
        `INSERT INTO indicators (type, value, first_seen, last_seen, confidence_score, description) 
         VALUES ${placeholders}`,
        flatValues
      );
      
      const startId = result.insertId;
      for (let i = 0; i < batchSize; i++) {
        indicatorIds.push(startId + i);
      }
      
      if ((batch + 1) % 5 === 0) {
        console.log(`  Inserted ${(batch + 1) * batchSize} / 2000 indicators...`);
      }
    }
    console.log(`✓ Inserted ${indicatorIds.length} indicators\n`);
    
    // Create relationships
    console.log('Creating relationships...');
    
    // Link indicators to sources (each indicator has 1-2 sources)
    console.log('  Linking indicators to sources...');
    for (let i = 0; i < indicatorIds.length; i++) {
      const sourceId = sourceIds[Math.floor(Math.random() * sourceIds.length)];
      await db.query(
        'INSERT IGNORE INTO indicator_source (indicator_id, source_id) VALUES (?, ?)',
        [indicatorIds[i], sourceId]
      );
      
      // 30% chance of second source
      if (Math.random() > 0.7) {
        const sourceId2 = sourceIds[Math.floor(Math.random() * sourceIds.length)];
        await db.query(
          'INSERT IGNORE INTO indicator_source (indicator_id, source_id) VALUES (?, ?)',
          [indicatorIds[i], sourceId2]
        );
      }
      
      if ((i + 1) % 500 === 0) {
        console.log(`    Linked ${i + 1} / ${indicatorIds.length} indicators to sources...`);
      }
    }
    console.log('  ✓ Indicator-Source relationships complete');
    
    // Link indicators to actors (40% of indicators have actor attribution)
    console.log('  Linking indicators to threat actors...');
    let actorLinks = 0;
    for (let i = 0; i < indicatorIds.length; i++) {
      if (Math.random() > 0.6) {
        const actorId = actorIds[Math.floor(Math.random() * actorIds.length)];
        await db.query(
          'INSERT IGNORE INTO indicator_actor (indicator_id, actor_id) VALUES (?, ?)',
          [indicatorIds[i], actorId]
        );
        actorLinks++;
      }
      
      if ((i + 1) % 500 === 0) {
        console.log(`    Processed ${i + 1} / ${indicatorIds.length} indicators...`);
      }
    }
    console.log(`  ✓ Created ${actorLinks} Indicator-Actor relationships`);
    
    // Link indicators to campaigns (50% of indicators belong to campaigns)
    console.log('  Linking indicators to campaigns...');
    let campaignLinks = 0;
    for (let i = 0; i < indicatorIds.length; i++) {
      if (Math.random() > 0.5) {
        const campaignId = campaignIds[Math.floor(Math.random() * campaignIds.length)];
        await db.query(
          'INSERT IGNORE INTO indicator_campaign (indicator_id, campaign_id) VALUES (?, ?)',
          [indicatorIds[i], campaignId]
        );
        campaignLinks++;
      }
      
      if ((i + 1) % 500 === 0) {
        console.log(`    Processed ${i + 1} / ${indicatorIds.length} indicators...`);
      }
    }
    console.log(`  ✓ Created ${campaignLinks} Indicator-Campaign relationships`);
    
    console.log('\n✓ Mock data insertion complete!');
  } catch (error) {
    console.error('Error inserting mock data:', error.message);
    throw error;
  }
}

async function runIngestion() {
  console.log('='.repeat(60));
  console.log('THREAT INTELLIGENCE DATABASE POPULATION');
  console.log('='.repeat(60));
  console.log();
  
  try {
    await insertMockData();
    
    // Display summary
    const [indicatorCount] = await db.query('SELECT COUNT(*) as count FROM indicators');
    const [actorCount] = await db.query('SELECT COUNT(*) as count FROM threat_actors');
    const [campaignCount] = await db.query('SELECT COUNT(*) as count FROM campaigns');
    const [sourceCount] = await db.query('SELECT COUNT(*) as count FROM sources');
    
    console.log('\n' + '='.repeat(60));
    console.log('DATABASE SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Indicators: ${indicatorCount[0].count}`);
    console.log(`Total Threat Actors: ${actorCount[0].count}`);
    console.log(`Total Campaigns: ${campaignCount[0].count}`);
    console.log(`Total Sources: ${sourceCount[0].count}`);
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    process.exit(0);
  }
}

// Run the script
runIngestion();
