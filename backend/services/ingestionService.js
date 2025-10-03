const axios = require('axios');
const db = require('../config/database');
require('dotenv').config();

// Configuration
const ALIENVAULT_API_KEY = process.env.ALIENVAULT_API_KEY;
const ABUSEIPDB_API_KEY = process.env.ABUSEIPDB_API_KEY;
const VIRUSTOTAL_API_KEY = process.env.VIRUSTOTAL_API_KEY;
const MAX_INDICATORS = process.env.MAX_INDICATORS_PER_FEED || 1000;

// Ingestion statistics tracker
let ingestionStats = {
  lastRun: null,
  totalIngested: 0,
  sources: {}
};

// Extract and create threat actors from AlienVault OTX data
async function extractThreatActorsFromOTX(pulses) {
  let stats = { inserted: 0, updated: 0, errors: 0 };
  
  for (const pulse of pulses) {
    try {
      // Look for threat actor references in pulse data
      const actorName = pulse.adversary || extractActorFromTags(pulse.tags) || extractActorFromDescription(pulse.description);
      
      if (actorName) {
        // Check if actor exists
        const [existing] = await db.query(
          'SELECT actor_id FROM threat_actors WHERE name = ?',
          [actorName]
        );
        
        if (existing.length > 0) {
          // Update last_seen
          await db.query(
            'UPDATE threat_actors SET last_seen = NOW() WHERE actor_id = ?',
            [existing[0].actor_id]
          );
          stats.updated++;
        } else {
          // Insert new actor
          const origin = pulse.targeted_countries?.[0] || 'Unknown';
          const description = `Threat actor associated with ${pulse.name}. ${pulse.description?.substring(0, 200)}`;
          
          await db.query(
            `INSERT INTO threat_actors (name, description, origin, first_seen, last_seen, active_status) 
             VALUES (?, ?, ?, NOW(), NOW(), 'active')`,
            [actorName, description, origin]
          );
          stats.inserted++;
        }
      }
    } catch (error) {
      console.error('Error processing threat actor:', error.message);
      stats.errors++;
    }
  }
  
  return stats;
}

// Extract actor name from tags
function extractActorFromTags(tags) {
  if (!tags || !Array.isArray(tags)) return null;
  
  const actorPatterns = ['APT', 'Lazarus', 'Fancy Bear', 'Cozy Bear', 'Turla', 'OceanLotus', 'Equation', 'Carbanak'];
  for (const tag of tags) {
    for (const pattern of actorPatterns) {
      if (tag.toLowerCase().includes(pattern.toLowerCase())) {
        return tag;
      }
    }
    // Generic APT pattern
    if (/APT\d+/i.test(tag)) {
      return tag.toUpperCase();
    }
  }
  return null;
}

// Extract actor from description text
function extractActorFromDescription(description) {
  if (!description) return null;
  
  const actorPatterns = [
    /APT\d+/i,
    /Lazarus Group/i,
    /Fancy Bear/i,
    /Cozy Bear/i,
    /Turla/i,
    /OceanLotus/i,
    /Equation Group/i,
    /Carbanak/i
  ];
  
  for (const pattern of actorPatterns) {
    const match = description.match(pattern);
    if (match) return match[0];
  }
  return null;
}

// Extract and create campaigns from indicators
async function extractCampaignsFromIndicators() {
  let stats = { inserted: 0, updated: 0, errors: 0 };
  
  try {
    // Find indicator clusters that could represent campaigns
    // Group by time window and similar descriptions
    const [indicatorGroups] = await db.query(`
      SELECT 
        CONCAT('Campaign_', DATE_FORMAT(first_seen, '%Y%m')) as campaign_name,
        MIN(first_seen) as start_date,
        MAX(last_seen) as end_date,
        COUNT(*) as indicator_count,
        GROUP_CONCAT(DISTINCT type) as indicator_types,
        SUBSTRING_INDEX(GROUP_CONCAT(description), ',', 1) as sample_description
      FROM indicators
      WHERE first_seen >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(first_seen, '%Y%m')
      HAVING COUNT(*) >= 5
    `);
    
    for (const group of indicatorGroups) {
      try {
        // Check if campaign exists
        const [existing] = await db.query(
          'SELECT campaign_id FROM campaigns WHERE name = ?',
          [group.campaign_name]
        );
        
        if (existing.length > 0) {
          // Update end date
          await db.query(
            'UPDATE campaigns SET end_date = ?, active_status = ? WHERE campaign_id = ?',
            [group.end_date, 'active', existing[0].campaign_id]
          );
          stats.updated++;
        } else {
          // Insert new campaign
          const description = `Detected campaign with ${group.indicator_count} indicators of types: ${group.indicator_types}`;
          
          await db.query(
            `INSERT INTO campaigns (name, description, start_date, end_date, active_status) 
             VALUES (?, ?, ?, ?, 'active')`,
            [group.campaign_name, description, group.start_date, group.end_date]
          );
          stats.inserted++;
        }
      } catch (error) {
        console.error('Error processing campaign:', error.message);
        stats.errors++;
      }
    }
  } catch (error) {
    console.error('Error extracting campaigns:', error.message);
    stats.errors++;
  }
  
  return stats;
}

// Link indicators to campaigns based on time proximity
async function linkIndicatorsToCampaigns() {
  let stats = { linked: 0, errors: 0 };
  
  try {
    const [campaigns] = await db.query('SELECT campaign_id, start_date, end_date FROM campaigns WHERE active_status = "active"');
    
    for (const campaign of campaigns) {
      try {
        // Find indicators within campaign timeframe
        const [indicators] = await db.query(
          `SELECT indicator_id FROM indicators 
           WHERE first_seen BETWEEN ? AND ?
           AND indicator_id NOT IN (SELECT indicator_id FROM indicator_campaign WHERE campaign_id = ?)`,
          [campaign.start_date, campaign.end_date, campaign.campaign_id]
        );
        
        // Link indicators to campaign
        for (const indicator of indicators) {
          await db.query(
            'INSERT IGNORE INTO indicator_campaign (indicator_id, campaign_id) VALUES (?, ?)',
            [indicator.indicator_id, campaign.campaign_id]
          );
          stats.linked++;
        }
      } catch (error) {
        console.error('Error linking indicators to campaign:', error.message);
        stats.errors++;
      }
    }
  } catch (error) {
    console.error('Error in linkIndicatorsToCampaigns:', error.message);
    stats.errors++;
  }
  
  return stats;
}

// Main function to run all ingestions
exports.runAllIngestions = async () => {
  const results = [];
  let otxPulses = [];
  
  try {
    console.log('Starting full ingestion pipeline...');
    
    // Step 1: Ingest indicators from all sources
    
    // AlienVault OTX - Indicators + Threat Actors + Campaigns
    if (ALIENVAULT_API_KEY) {
      console.log('Ingesting from AlienVault OTX...');
      const alienVaultResult = await this.ingestFromAlienVault();
      results.push({ source: 'AlienVault OTX', ...alienVaultResult });
      otxPulses = alienVaultResult.pulses || [];
    }
    
    // AbuseIPDB - IP Indicators
    if (ABUSEIPDB_API_KEY) {
      console.log('Ingesting from AbuseIPDB...');
      const abuseIPDBResult = await this.ingestFromAbuseIPDB();
      results.push({ source: 'AbuseIPDB', ...abuseIPDBResult });
    }
    
    // VirusTotal - File Hashes, Domains, URLs
    if (VIRUSTOTAL_API_KEY) {
      console.log('Ingesting from VirusTotal...');
      const virusTotalResult = await this.ingestFromVirusTotal();
      results.push({ source: 'VirusTotal', ...virusTotalResult });
    }
    
    // Step 2: Extract threat actors from OTX data
    if (otxPulses.length > 0) {
      console.log('Extracting threat actors from OTX pulses...');
      const actorStats = await extractThreatActorsFromOTX(otxPulses);
      results.push({ source: 'Threat Actor Extraction', ...actorStats });
    }
    
    // Step 3: Extract campaigns from indicator patterns
    console.log('Extracting campaigns from indicators...');
    const campaignStats = await extractCampaignsFromIndicators();
    results.push({ source: 'Campaign Detection', ...campaignStats });
    
    // Step 4: Link indicators to campaigns
    console.log('Linking indicators to campaigns...');
    const linkStats = await linkIndicatorsToCampaigns();
    results.push({ source: 'Indicator-Campaign Linking', ...linkStats });
    
    ingestionStats.lastRun = new Date();
    
    console.log('Full ingestion pipeline complete!');
    return results;
  } catch (error) {
    console.error('Error during ingestion:', error);
    throw error;
  }
};

// Ingest from AlienVault OTX
exports.ingestFromAlienVault = async () => {
  console.log('Ingesting from AlienVault OTX...');
  
  const stats = {
    total: 0,
    inserted: 0,
    updated: 0,
    skipped: 0,
    errors: 0
  };
  
  try {
    // Get or create source
    const sourceId = await getOrCreateSource(
      'AlienVault OTX',
      'https://otx.alienvault.com/api/v1/pulses/subscribed',
      'Hourly',
      'API Key'
    );
    
    // Fetch pulses from AlienVault
    const response = await axios.get(
      'https://otx.alienvault.com/api/v1/pulses/subscribed',
      {
        headers: {
          'X-OTX-API-KEY': ALIENVAULT_API_KEY
        },
        params: {
          limit: 50
        }
      }
    );
    
    const pulses = response.data.results || [];
    
    for (const pulse of pulses) {
      // Process indicators from pulse
      for (const indicator of pulse.indicators || []) {
        stats.total++;
        
        if (stats.total > MAX_INDICATORS) break;
        
        try {
          const result = await processIndicator({
            type: mapIndicatorType(indicator.type),
            value: indicator.indicator,
            description: pulse.name || pulse.description || '',
            confidence_score: calculateConfidence(indicator, pulse),
            sourceId
          });
          
          if (result === 'inserted') stats.inserted++;
          else if (result === 'updated') stats.updated++;
          else stats.skipped++;
          
        } catch (error) {
          console.error(`Error processing indicator: ${error.message}`);
          stats.errors++;
        }
      }
      
      if (stats.total > MAX_INDICATORS) break;
    }
    
    ingestionStats.sources['AlienVault OTX'] = stats;
    console.log(`AlienVault OTX ingestion complete:`, stats);
    
    // Return stats and pulses for actor extraction
    return { ...stats, pulses };
  } catch (error) {
    console.error('AlienVault OTX ingestion error:', error.message);
    throw error;
  }
};

// Ingest from AbuseIPDB
exports.ingestFromAbuseIPDB = async () => {
  console.log('Ingesting from AbuseIPDB...');
  
  const stats = {
    total: 0,
    inserted: 0,
    updated: 0,
    skipped: 0,
    errors: 0
  };
  
  try {
    // Get or create source
    const sourceId = await getOrCreateSource(
      'AbuseIPDB',
      'https://api.abuseipdb.com/api/v2/blacklist',
      'Daily',
      'API Key'
    );
    
    // Fetch blacklist from AbuseIPDB
    const response = await axios.get(
      'https://api.abuseipdb.com/api/v2/blacklist',
      {
        headers: {
          'Key': ABUSEIPDB_API_KEY,
          'Accept': 'application/json'
        },
        params: {
          confidenceMinimum: 75,
          limit: MAX_INDICATORS
        }
      }
    );
    
    const blacklist = response.data.data || [];
    
    for (const item of blacklist) {
      stats.total++;
      
      try {
        const result = await processIndicator({
          type: 'IPv4',
          value: item.ipAddress,
          description: `AbuseIPDB - Abuse Confidence: ${item.abuseConfidenceScore}%, Reports: ${item.totalReports}`,
          confidence_score: item.abuseConfidenceScore / 100,
          sourceId
        });
        
        if (result === 'inserted') stats.inserted++;
        else if (result === 'updated') stats.updated++;
        else stats.skipped++;
        
      } catch (error) {
        console.error(`Error processing IP: ${error.message}`);
        stats.errors++;
      }
    }
    
    ingestionStats.sources['AbuseIPDB'] = stats;
    console.log(`AbuseIPDB ingestion complete:`, stats);
    
    return stats;
  } catch (error) {
    console.error('AbuseIPDB ingestion error:', error.message);
    throw error;
  }
};

// VirusTotal Ingestion
exports.ingestFromVirusTotal = async () => {
  try {
    console.log('Starting VirusTotal ingestion...');
    const sourceId = await getOrCreateSource('VirusTotal', 'https://www.virustotal.com/api/v3', 'hourly', 'api_key');
    
    let stats = { inserted: 0, updated: 0, errors: 0 };
    
    // Rate limiting for VirusTotal (free tier: 4 requests per minute)
    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
    const requestDelay = 16000; // 16 seconds between requests
    
    // Fetch recent malicious files
    try {
      const filesResponse = await axios.get('https://www.virustotal.com/api/v3/intelligence/search', {
        headers: { 'x-apikey': VIRUSTOTAL_API_KEY },
        params: { query: 'type:file positives:10+', limit: 10 }
      });
      
      if (filesResponse.data.data) {
        for (const file of filesResponse.data.data) {
          try {
            const analStats = file.attributes.last_analysis_stats || {};
            const malicious = analStats.malicious || 0;
            const total = Object.values(analStats).reduce((a, b) => a + b, 0);
            const confidence = total > 0 ? (malicious / total) : 0;
            
            const result = await processIndicator({
              type: 'hash',
              value: file.attributes.sha256,
              description: `Malicious file detected by ${malicious}/${total} engines. ${file.attributes.meaningful_name || 'Unknown'}`,
              confidence_score: confidence,
              sourceId: sourceId
            });
            
            if (result === 'inserted') stats.inserted++;
            else if (result === 'updated') stats.updated++;
          } catch (err) {
            console.error('Error processing file:', err.message);
            stats.errors++;
          }
          await delay(requestDelay);
        }
      }
    } catch (error) {
      console.error('VirusTotal files API error:', error.response?.data?.error || error.message);
    }
    
    // Fetch recent malicious domains
    try {
      await delay(requestDelay);
      const domainsResponse = await axios.get('https://www.virustotal.com/api/v3/intelligence/search', {
        headers: { 'x-apikey': VIRUSTOTAL_API_KEY },
        params: { query: 'type:domain positives:5+', limit: 10 }
      });
      
      if (domainsResponse.data.data) {
        for (const domain of domainsResponse.data.data) {
          try {
            const analStats = domain.attributes.last_analysis_stats || {};
            const malicious = analStats.malicious || 0;
            const total = Object.values(analStats).reduce((a, b) => a + b, 0);
            const confidence = total > 0 ? (malicious / total) : 0;
            
            const result = await processIndicator({
              type: 'domain',
              value: domain.id,
              description: `Malicious domain flagged by ${malicious}/${total} engines`,
              confidence_score: confidence,
              sourceId: sourceId
            });
            
            if (result === 'inserted') stats.inserted++;
            else if (result === 'updated') stats.updated++;
          } catch (err) {
            console.error('Error processing domain:', err.message);
            stats.errors++;
          }
          await delay(requestDelay);
        }
      }
    } catch (error) {
      console.error('VirusTotal domains API error:', error.response?.data?.error || error.message);
    }
    
    ingestionStats.sources['VirusTotal'] = stats;
    console.log(`VirusTotal ingestion complete:`, stats);
    
    return stats;
  } catch (error) {
    console.error('VirusTotal ingestion error:', error.message);
    throw error;
  }
};

// Helper: Get or create source
async function getOrCreateSource(name, url, updateRate, authType) {
  const [existing] = await db.query(
    'SELECT source_id FROM sources WHERE name = ?',
    [name]
  );
  
  if (existing.length > 0) {
    return existing[0].source_id;
  }
  
  const [result] = await db.query(
    'INSERT INTO sources (name, url, update_rate, auth_type) VALUES (?, ?, ?, ?)',
    [name, url, updateRate, authType]
  );
  
  return result.insertId;
}

// Helper: Process and deduplicate indicator
async function processIndicator({ type, value, description, confidence_score, sourceId }) {
  // Check if indicator exists
  const [existing] = await db.query(
    'SELECT indicator_id, last_seen, confidence_score FROM indicators WHERE type = ? AND value = ?',
    [type, value]
  );
  
  if (existing.length > 0) {
    // Update existing indicator
    const indicatorId = existing[0].indicator_id;
    const newConfidence = Math.max(existing[0].confidence_score, confidence_score);
    
    await db.query(
      'UPDATE indicators SET last_seen = NOW(), confidence_score = ? WHERE indicator_id = ?',
      [newConfidence, indicatorId]
    );
    
    // Add source relationship if not exists
    await db.query(
      'INSERT IGNORE INTO indicator_source (indicator_id, source_id) VALUES (?, ?)',
      [indicatorId, sourceId]
    );
    
    return 'updated';
  } else {
    // Insert new indicator
    const [result] = await db.query(
      `INSERT INTO indicators (type, value, first_seen, last_seen, confidence_score, description) 
       VALUES (?, ?, NOW(), NOW(), ?, ?)`,
      [type, value, confidence_score, description]
    );
    
    const indicatorId = result.insertId;
    
    // Add source relationship
    await db.query(
      'INSERT INTO indicator_source (indicator_id, source_id) VALUES (?, ?)',
      [indicatorId, sourceId]
    );
    
    return 'inserted';
  }
}

// Helper: Map indicator types to standard format
function mapIndicatorType(type) {
  const typeMap = {
    'IPv4': 'IPv4',
    'IPv6': 'IPv6',
    'domain': 'domain',
    'hostname': 'domain',
    'URL': 'URL',
    'URI': 'URL',
    'FileHash-MD5': 'hash',
    'FileHash-SHA1': 'hash',
    'FileHash-SHA256': 'hash',
    'email': 'email'
  };
  
  return typeMap[type] || 'other';
}

// Helper: Calculate confidence score
function calculateConfidence(indicator, pulse) {
  // Base confidence
  let confidence = 0.5;
  
  // Increase based on pulse validation
  if (pulse.TLP === 'white') confidence += 0.1;
  if (pulse.TLP === 'green') confidence += 0.2;
  
  // Increase based on indicator attributes
  if (indicator.is_active) confidence += 0.1;
  
  // Increase based on references
  if (pulse.references && pulse.references.length > 0) {
    confidence += Math.min(pulse.references.length * 0.05, 0.2);
  }
  
  return Math.min(confidence, 1.0);
}

// Get ingestion status
exports.getIngestionStatus = async () => {
  const [indicatorCount] = await db.query('SELECT COUNT(*) as count FROM indicators');
  const [recentCount] = await db.query(
    'SELECT COUNT(*) as count FROM indicators WHERE last_seen >= DATE_SUB(NOW(), INTERVAL 24 HOUR)'
  );
  
  return {
    lastRun: ingestionStats.lastRun,
    totalIndicators: indicatorCount[0].count,
    recentIndicators24h: recentCount[0].count,
    sources: ingestionStats.sources
  };
};

// Get ingestion history
exports.getIngestionHistory = async () => {
  // This is a simple implementation - you could enhance it with a dedicated history table
  return {
    lastRun: ingestionStats.lastRun,
    totalIngested: ingestionStats.totalIngested,
    sourceStats: ingestionStats.sources
  };
};
