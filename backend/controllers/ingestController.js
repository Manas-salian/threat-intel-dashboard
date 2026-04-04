const ingestionService = require('../services/ingestionService');

// Trigger manual ingestion from all sources
exports.runIngestion = async (req, res) => {
  try {
    console.log('Starting manual ingestion from all sources...');
    const results = await ingestionService.runAllIngestions();

    res.json({
      message: 'Ingestion completed',
      results
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Trigger ingestion from specific source
exports.runSourceIngestion = async (req, res) => {
  try {
    const source = req.params.source;
    console.log(`Starting ingestion from ${source}...`);

    let result;
    switch (source.toLowerCase()) {
      case 'alienvault':
        result = await ingestionService.ingestFromAlienVault();
        break;
      case 'abuseipdb':
        result = await ingestionService.ingestFromAbuseIPDB();
        break;
      case 'virustotal':
        result = await ingestionService.ingestFromVirusTotal();
        break;
      default:
        return res.status(400).json({ error: 'Unknown source' });
    }

    res.json({
      message: `Ingestion from ${source} completed`,
      result
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get ingestion status and statistics
exports.getStatus = async (req, res) => {
  try {
    const status = await ingestionService.getIngestionStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get ingestion history
exports.getHistory = async (req, res) => {
  try {
    const history = await ingestionService.getIngestionHistory();
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
