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

const mockData = {
  severities: [
    { level: 'low', description: 'Low severity threat' },
    { level: 'medium', description: 'Medium severity threat' },
    { level: 'high', description: 'High severity threat' },
    { level: 'critical', description: 'Critical severity threat' }
  ],
  
  indicatorTypes: [
    { name: 'IPv4', description: 'IPv4 Address' },
    { name: 'IPv6', description: 'IPv6 Address' },
    { name: 'domain', description: 'Domain Name' },
    { name: 'URL', description: 'Uniform Resource Locator' },
    { name: 'hash', description: 'File Hash (MD5/SHA1/SHA256)' },
    { name: 'email', description: 'Email Address' }
  ],
  
  tactics: [
    { name: 'Initial Access', mitre_id: 'TA0001', description: 'Techniques used to gain initial access' },
    { name: 'Execution', mitre_id: 'TA0002', description: 'Techniques used to run malicious code' },
    { name: 'Persistence', mitre_id: 'TA0003', description: 'Techniques used to maintain presence' },
    { name: 'Privilege Escalation', mitre_id: 'TA0004', description: 'Techniques used to gain higher permissions' },
    { name: 'Defense Evasion', mitre_id: 'TA0005', description: 'Techniques used to avoid detection' },
    { name: 'Credential Access', mitre_id: 'TA0006', description: 'Techniques used to steal credentials' },
    { name: 'Discovery', mitre_id: 'TA0007', description: 'Techniques used to explore environment' },
    { name: 'Lateral Movement', mitre_id: 'TA0008', description: 'Techniques used to move through network' },
    { name: 'Collection', mitre_id: 'TA0009', description: 'Techniques used to gather data' },
    { name: 'Exfiltration', mitre_id: 'TA0010', description: 'Techniques used to steal data' }
  ],
  
  sources: [
    { name: 'AlienVault OTX', url: 'https://otx.alienvault.com/api/v1', reliability_score: 0.85 },
    { name: 'AbuseIPDB', url: 'https://api.abuseipdb.com/api/v2', reliability_score: 0.90 },
    { name: 'VirusTotal', url: 'https://www.virustotal.com/api/v3', reliability_score: 0.95 },
    { name: 'Shodan', url: 'https://api.shodan.io', reliability_score: 0.80 },
    { name: 'ThreatCrowd', url: 'https://www.threatcrowd.org/api/v2', reliability_score: 0.75 },
    { name: 'URLhaus', url: 'https://urlhaus-api.abuse.ch/v1', reliability_score: 0.88 },
    { name: 'PhishTank', url: 'https://checkurl.phishtank.com/checkurl/', reliability_score: 0.82 },
    { name: 'Malware Bazaar', url: 'https://mb-api.abuse.ch/api/v1', reliability_score: 0.87 }
  ],
  
  actorNames: [
    'APT28 (Fancy Bear)', 'APT29 (Cozy Bear)', 'APT32 (OceanLotus)', 'APT33', 'APT34 (OilRig)',
    'APT37', 'APT38', 'APT39', 'APT40', 'APT41', 'Lazarus Group', 'Kimsuky', 'Turla',
    'Equation Group', 'Carbanak', 'FIN7', 'FIN8', 'TA505', 'TA542 (Emotet)', 'TA551',
    'Wizard Spider', 'Sandworm', 'Hafnium', 'Nobelium', 'Dark Halo', 'SolarWinds Attackers',
    'Conti Gang', 'REvil', 'DarkSide', 'BlackMatter'
  ],
  
  countries: ['Russia', 'China', 'North Korea', 'Iran', 'Unknown', 'Eastern Europe', 'Southeast Asia'],
  
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
  ]
};

async function clearAllData() {
  console.log('Clearing existing data...');
  try {
    await db.query('SET FOREIGN_KEY_CHECKS = 0');
    await db.query('TRUNCATE TABLE indicator_campaign');
    await db.query('TRUNCATE TABLE indicator_actor');
    await db.query('TRUNCATE TABLE indicator_source');
    await db.query('TRUNCATE TABLE actor_tactics');
    await db.query('TRUNCATE TABLE indicators');
    await db.query('TRUNCATE TABLE campaigns');
    await db.query('TRUNCATE TABLE threat_actors');
    await db.query('TRUNCATE TABLE sources');
    await db.query('TRUNCATE TABLE tactics');
    await db.query('TRUNCATE TABLE indicator_types');
    await db.query('TRUNCATE TABLE severities');
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
    console.log('INSERTING MOCK DATA (NORMALIZED SCHEMA)');
    console.log('='.repeat(60));
    console.log();
    
    await clearAllData();
    
    // 1. Insert lookup tables
    console.log('Inserting lookup tables...');
    
    // Severities
    const severityIds = {};
    for (const severity of mockData.severities) {
      const [result] = await db.query(
        'INSERT INTO severities (level, description) VALUES (?, ?)',
        [severity.level, severity.description]
      );
      severityIds[severity.level] = result.insertId;
    }
    console.log(`✓ Inserted ${Object.keys(severityIds).length} severities`);
    
    // Indicator Types
    const typeIds = {};
    for (const type of mockData.indicatorTypes) {
      const [result] = await db.query(
        'INSERT INTO indicator_types (name, description) VALUES (?, ?)',
        [type.name, type.description]
      );
      typeIds[type.name] = result.insertId;
    }
    console.log(`✓ Inserted ${Object.keys(typeIds).length} indicator types`);
    
    // Tactics
    const tacticIds = [];
    for (const tactic of mockData.tactics) {
      const [result] = await db.query(
        'INSERT INTO tactics (name, mitre_id, description) VALUES (?, ?, ?)',
        [tactic.name, tactic.mitre_id, tactic.description]
      );
      tacticIds.push(result.insertId);
    }
    console.log(`✓ Inserted ${tacticIds.length} tactics`);
    
    // Sources
    const sourceIds = [];
    for (const source of mockData.sources) {
      const [result] = await db.query(
        'INSERT INTO sources (name, url, reliability_score) VALUES (?, ?, ?)',
        [source.name, source.url, source.reliability_score]
      );
      sourceIds.push(result.insertId);
    }
    console.log(`✓ Inserted ${sourceIds.length} sources\n`);
    
    // 2. Insert threat actors (30 actors)
    console.log('Inserting threat actors...');
    const actorIds = [];
    for (let i = 0; i < 30; i++) {
      const name = mockData.actorNames[i % mockData.actorNames.length] + (i >= mockData.actorNames.length ? ` V${Math.floor(i / mockData.actorNames.length) + 1}` : '');
      const description = mockData.actorDescriptions[i % mockData.actorDescriptions.length];
      const country = mockData.countries[i % mockData.countries.length];
      const firstSeen = randomDate(new Date(2020, 0, 1), new Date(2024, 0, 1));
      const lastSeen = randomDate(new Date(2024, 6, 1), new Date());
      
      const [result] = await db.query(
        `INSERT INTO threat_actors (name, description, first_seen, last_seen, origin_country) 
         VALUES (?, ?, ?, ?, ?)`,
        [name, description, firstSeen, lastSeen, country]
      );
      actorIds.push(result.insertId);
      
      // Link 2-4 random tactics to each actor
      const numTactics = 2 + Math.floor(Math.random() * 3);
      for (let j = 0; j < numTactics; j++) {
        const tacticId = tacticIds[Math.floor(Math.random() * tacticIds.length)];
        await db.query(
          'INSERT IGNORE INTO actor_tactics (actor_id, tactic_id) VALUES (?, ?)',
          [result.insertId, tacticId]
        );
      }
    }
    console.log(`✓ Inserted ${actorIds.length} threat actors\n`);
    
    // 3. Insert campaigns (50 campaigns)
    console.log('Inserting campaigns...');
    const campaignIds = [];
    const severityLevels = ['low', 'medium', 'high', 'critical'];
    
    for (let i = 0; i < 50; i++) {
      const prefix = mockData.campaignPrefixes[Math.floor(Math.random() * mockData.campaignPrefixes.length)];
      const suffix = mockData.campaignSuffixes[Math.floor(Math.random() * mockData.campaignSuffixes.length)];
      const name = `${prefix} ${suffix} ${i + 1}`;
      const startDate = randomDate(new Date(2024, 0, 1), new Date(2025, 8, 1));
      const endDate = Math.random() > 0.4 ? randomDate(startDate, new Date()) : null;
      const severityLevel = severityLevels[Math.floor(Math.random() * severityLevels.length)];
      const description = `${name} campaign detected targeting multiple sectors`;
      
      const [result] = await db.query(
        `INSERT INTO campaigns (name, description, start_date, end_date, severity_id) 
         VALUES (?, ?, ?, ?, ?)`,
        [name, description, startDate, endDate, severityIds[severityLevel]]
      );
      campaignIds.push(result.insertId);
    }
    console.log(`✓ Inserted ${campaignIds.length} campaigns\n`);
    
    // 4. Insert indicators (2000 indicators)
    console.log('Inserting indicators (this may take a moment)...');
    const indicatorIds = [];
    const types = ['IPv4', 'IPv6', 'domain', 'URL', 'hash', 'email'];
    
    for (let i = 0; i < 2000; i++) {
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
          value = `${randomHash(8)}.malicious-site.com`;
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
      const description = `${type} indicator detected - ${value.substring(0, 30)}`;
      
      try {
        const [result] = await db.query(
          `INSERT INTO indicators (value, type_id, confidence_score, first_seen, last_seen, description) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [value, typeIds[type], parseFloat(confidence), firstSeen, lastSeen, description]
        );
        indicatorIds.push(result.insertId);
      } catch (error) {
        // Skip duplicates
        if (error.code !== 'ER_DUP_ENTRY') {
          console.error('Error inserting indicator:', error.message);
        }
      }
      
      if ((i + 1) % 500 === 0) {
        console.log(`  Inserted ${i + 1} / 2000 indicators...`);
      }
    }
    console.log(`✓ Inserted ${indicatorIds.length} indicators\n`);
    
    // 5. Create relationships
    console.log('Creating relationships...');
    
    // Link indicators to sources (each indicator has 1-2 sources)
    console.log('  Linking indicators to sources...');
    for (let i = 0; i < indicatorIds.length; i++) {
      const sourceId = sourceIds[Math.floor(Math.random() * sourceIds.length)];
      await db.query(
        'INSERT IGNORE INTO indicator_source (indicator_id, source_id) VALUES (?, ?)',
        [indicatorIds[i], sourceId]
      );
      
      if ((i + 1) % 500 === 0) {
        console.log(`    Linked ${i + 1} / ${indicatorIds.length} indicators...`);
      }
    }
    console.log('  ✓ Indicator-Source relationships complete');
    
    // Link indicators to actors (40% of indicators)
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
    
    // Link indicators to campaigns (50% of indicators)
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
