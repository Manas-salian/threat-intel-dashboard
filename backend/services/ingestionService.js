const axios = require('axios');
const Indicator = require('../models/Indicator');
const ThreatActor = require('../models/ThreatActor');
const Campaign = require('../models/Campaign');
const Source = require('../models/Source');
const AuditLog = require('../models/AuditLog');
require('dotenv').config();

// Configuration
const ALIENVAULT_API_KEY = process.env.ALIENVAULT_API_KEY;
const ABUSEIPDB_API_KEY = process.env.ABUSEIPDB_API_KEY;
const VIRUSTOTAL_API_KEY = process.env.VIRUSTOTAL_API_KEY;
const MAX_INDICATORS = parseInt(process.env.MAX_INDICATORS_PER_FEED) || 1000;

// Ingestion statistics tracker
let ingestionStats = {
  lastRun: null,
  totalIngested: 0,
  sources: {}
};

// Helper: Get or create source
async function getOrCreateSource(name, url) {
  let source = await Source.findOne({ name });
  if (source) return source._id;

  source = await Source.create({ name, url });
  return source._id;
}

// Helper: Process and deduplicate indicator
async function processIndicator({ type, value, description, confidence_score, sourceId }) {
  const existing = await Indicator.findOne({ type, value });

  if (existing) {
    const updates = { last_seen: new Date() };
    if (confidence_score > existing.confidence_score) {
      updates.confidence_score = confidence_score;
    }
    if (sourceId) {
      updates.$addToSet = { sources: sourceId };
    }
    await Indicator.findByIdAndUpdate(existing._id, updates);
    return 'updated';
  } else {
    await Indicator.create({
      type,
      value,
      confidence_score,
      description: description || '',
      sources: sourceId ? [sourceId] : []
    });
    return 'inserted';
  }
}

// Helper: Map indicator types to standard format
function mapIndicatorType(type) {
  const typeMap = {
    'IPv4': 'IPv4', 'IPv6': 'IPv6',
    'domain': 'domain', 'hostname': 'domain',
    'URL': 'URL', 'URI': 'URL',
    'FileHash-MD5': 'hash', 'FileHash-SHA1': 'hash', 'FileHash-SHA256': 'hash',
    'email': 'email'
  };
  return typeMap[type] || 'other';
}

// Helper: Calculate confidence score
function calculateConfidence(indicator, pulse) {
  let confidence = 0.5;
  if (pulse.TLP === 'white') confidence += 0.1;
  if (pulse.TLP === 'green') confidence += 0.2;
  if (indicator.is_active) confidence += 0.1;
  if (pulse.references?.length > 0) {
    confidence += Math.min(pulse.references.length * 0.05, 0.2);
  }
  return Math.min(confidence, 1.0);
}

// Extract actor name from tags
function extractActorFromTags(tags) {
  if (!tags || !Array.isArray(tags)) return null;
  const actorPatterns = ['APT', 'Lazarus', 'Fancy Bear', 'Cozy Bear', 'Turla', 'OceanLotus', 'Equation', 'Carbanak'];
  for (const tag of tags) {
    for (const pattern of actorPatterns) {
      if (tag.toLowerCase().includes(pattern.toLowerCase())) return tag;
    }
    if (/APT\d+/i.test(tag)) return tag.toUpperCase();
  }
  return null;
}

// Extract actor from description text
function extractActorFromDescription(description) {
  if (!description) return null;
  const patterns = [/APT\d+/i, /Lazarus Group/i, /Fancy Bear/i, /Cozy Bear/i, /Turla/i, /OceanLotus/i, /Equation Group/i, /Carbanak/i];
  for (const pattern of patterns) {
    const match = description.match(pattern);
    if (match) return match[0];
  }
  return null;
}

// Extract and create threat actors from AlienVault OTX data
async function extractThreatActorsFromOTX(pulses) {
  let stats = { inserted: 0, updated: 0, errors: 0 };

  for (const pulse of pulses) {
    try {
      const actorName = pulse.adversary || extractActorFromTags(pulse.tags) || extractActorFromDescription(pulse.description);
      if (!actorName) continue;

      const existing = await ThreatActor.findOne({ name: actorName });
      if (existing) {
        await ThreatActor.findByIdAndUpdate(existing._id, { last_seen: new Date() });
        stats.updated++;
      } else {
        const description = `Threat actor associated with ${pulse.name}. ${pulse.description?.substring(0, 200) || ''}`;
        await ThreatActor.create({
          name: actorName,
          description,
          origin_country: pulse.targeted_countries?.[0] || 'Unknown',
          first_seen: new Date(),
          last_seen: new Date()
        });
        stats.inserted++;
      }
    } catch (error) {
      console.error('Error processing threat actor:', error.message);
      stats.errors++;
    }
  }
  return stats;
}

// Ingest from AlienVault OTX
exports.ingestFromAlienVault = async () => {
  console.log('Ingesting from AlienVault OTX...');
  const stats = { total: 0, inserted: 0, updated: 0, skipped: 0, errors: 0 };

  try {
    const sourceId = await getOrCreateSource('AlienVault OTX', 'https://otx.alienvault.com/api/v1/pulses/subscribed');

    const response = await axios.get('https://otx.alienvault.com/api/v1/pulses/subscribed', {
      headers: { 'X-OTX-API-KEY': ALIENVAULT_API_KEY },
      params: { limit: 50 }
    });

    const pulses = response.data.results || [];

    for (const pulse of pulses) {
      for (const indicator of (pulse.indicators || [])) {
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
          stats.errors++;
        }
      }
      if (stats.total > MAX_INDICATORS) break;
    }

    ingestionStats.sources['AlienVault OTX'] = stats;
    return { ...stats, pulses };
  } catch (error) {
    console.error('AlienVault OTX ingestion error:', error.message);
    throw error;
  }
};

// Ingest from AbuseIPDB
exports.ingestFromAbuseIPDB = async () => {
  console.log('Ingesting from AbuseIPDB...');
  const stats = { total: 0, inserted: 0, updated: 0, skipped: 0, errors: 0 };

  try {
    const sourceId = await getOrCreateSource('AbuseIPDB', 'https://api.abuseipdb.com/api/v2/blacklist');

    const response = await axios.get('https://api.abuseipdb.com/api/v2/blacklist', {
      headers: { 'Key': ABUSEIPDB_API_KEY, 'Accept': 'application/json' },
      params: { confidenceMinimum: 75, limit: MAX_INDICATORS }
    });

    for (const item of (response.data.data || [])) {
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
        stats.errors++;
      }
    }

    ingestionStats.sources['AbuseIPDB'] = stats;
    return stats;
  } catch (error) {
    console.error('AbuseIPDB ingestion error:', error.message);
    throw error;
  }
};

// Ingest from VirusTotal
exports.ingestFromVirusTotal = async () => {
  console.log('Starting VirusTotal ingestion...');
  const stats = { inserted: 0, updated: 0, errors: 0 };
  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
  const requestDelay = 16000;

  try {
    const sourceId = await getOrCreateSource('VirusTotal', 'https://www.virustotal.com/api/v3');

    // Malicious files
    try {
      const filesRes = await axios.get('https://www.virustotal.com/api/v3/intelligence/search', {
        headers: { 'x-apikey': VIRUSTOTAL_API_KEY },
        params: { query: 'type:file positives:10+', limit: 10 }
      });
      for (const file of (filesRes.data.data || [])) {
        try {
          const s = file.attributes.last_analysis_stats || {};
          const malicious = s.malicious || 0;
          const total = Object.values(s).reduce((a, b) => a + b, 0);
          const result = await processIndicator({
            type: 'hash', value: file.attributes.sha256,
            description: `Malicious file detected by ${malicious}/${total} engines. ${file.attributes.meaningful_name || ''}`,
            confidence_score: total > 0 ? malicious / total : 0,
            sourceId
          });
          if (result === 'inserted') stats.inserted++;
          else if (result === 'updated') stats.updated++;
        } catch (err) { stats.errors++; }
        await delay(requestDelay);
      }
    } catch (err) {
      console.error('VirusTotal files API error:', err.response?.data?.error || err.message);
    }

    // Malicious domains
    try {
      await delay(requestDelay);
      const domainsRes = await axios.get('https://www.virustotal.com/api/v3/intelligence/search', {
        headers: { 'x-apikey': VIRUSTOTAL_API_KEY },
        params: { query: 'type:domain positives:5+', limit: 10 }
      });
      for (const domain of (domainsRes.data.data || [])) {
        try {
          const s = domain.attributes.last_analysis_stats || {};
          const malicious = s.malicious || 0;
          const total = Object.values(s).reduce((a, b) => a + b, 0);
          const result = await processIndicator({
            type: 'domain', value: domain.id,
            description: `Malicious domain flagged by ${malicious}/${total} engines`,
            confidence_score: total > 0 ? malicious / total : 0,
            sourceId
          });
          if (result === 'inserted') stats.inserted++;
          else if (result === 'updated') stats.updated++;
        } catch (err) { stats.errors++; }
        await delay(requestDelay);
      }
    } catch (err) {
      console.error('VirusTotal domains API error:', err.response?.data?.error || err.message);
    }

    ingestionStats.sources['VirusTotal'] = stats;
    return stats;
  } catch (error) {
    console.error('VirusTotal ingestion error:', error.message);
    throw error;
  }
};

// Main function to run all ingestions
exports.runAllIngestions = async () => {
  const results = [];
  let otxPulses = [];

  try {
    console.log('Starting full ingestion pipeline...');

    if (ALIENVAULT_API_KEY) {
      const alienVaultResult = await exports.ingestFromAlienVault();
      results.push({ source: 'AlienVault OTX', ...alienVaultResult });
      otxPulses = alienVaultResult.pulses || [];
    }

    if (ABUSEIPDB_API_KEY) {
      const abuseIPDBResult = await exports.ingestFromAbuseIPDB();
      results.push({ source: 'AbuseIPDB', ...abuseIPDBResult });
    }

    if (VIRUSTOTAL_API_KEY) {
      const virusTotalResult = await exports.ingestFromVirusTotal();
      results.push({ source: 'VirusTotal', ...virusTotalResult });
    }

    if (otxPulses.length > 0) {
      const actorStats = await extractThreatActorsFromOTX(otxPulses);
      results.push({ source: 'Threat Actor Extraction', ...actorStats });
    }

    ingestionStats.lastRun = new Date();
    console.log('Full ingestion pipeline complete!');
    return results;
  } catch (error) {
    console.error('Error during ingestion:', error);
    throw error;
  }
};

// Get ingestion status
exports.getIngestionStatus = async () => {
  const totalIndicators = await Indicator.countDocuments();
  const recentCount = await Indicator.countDocuments({
    last_seen: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
  });

  return {
    lastRun: ingestionStats.lastRun,
    totalIndicators,
    recentIndicators24h: recentCount,
    sources: ingestionStats.sources
  };
};

// Get ingestion history
exports.getIngestionHistory = async () => {
  return {
    lastRun: ingestionStats.lastRun,
    totalIngested: ingestionStats.totalIngested,
    sourceStats: ingestionStats.sources
  };
};
