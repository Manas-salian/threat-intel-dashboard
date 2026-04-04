import { useState, useEffect } from 'react';
import { Upload, Database, CheckCircle, XCircle } from 'lucide-react';
import { indicatorAPI, sourceAPI } from '../services/api';

function Ingestion() {
  const [jsonData, setJsonData] = useState('');
  const [sourceId, setSourceId] = useState('');
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    sourceAPI.getAll().then(res => {
      setSources(res.data || []);
      if (res.data?.length > 0) setSourceId(res.data[0]._id);
    }).catch(() => {});
  }, []);

  const handleBulkIngest = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const indicators = JSON.parse(jsonData);
      const response = await indicatorAPI.bulkIngest({
        indicators: Array.isArray(indicators) ? indicators : [indicators],
        sourceId: sourceId || undefined
      });
      
      setResult({
        success: true,
        message: `Successfully ingested ${response.data.inserted} indicators (${response.data.skipped} skipped/updated, ${response.data.total} total)`
      });
      setJsonData('');
    } catch (error) {
      console.error('Error ingesting data:', error);
      setResult({
        success: false,
        message: error.response?.data?.error || 'Failed to ingest data. Check JSON format.'
      });
    } finally {
      setLoading(false);
    }
  };

  const sampleData = `[
  {
    "type": "IPv4",
    "value": "192.168.1.100",
    "confidence_score": 0.85,
    "description": "Suspicious C2 server"
  },
  {
    "type": "domain",
    "value": "malicious-site.com",
    "confidence_score": 0.92,
    "description": "Phishing domain"
  }
]`;

  return (
    <div>
      <div className="page-header">
        <h2>Data Ingestion</h2>
        <p>Bulk import threat indicators from external sources</p>
      </div>

      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '24px'}}>
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Bulk JSON Upload</span>
            <Database className="stat-icon" size={24} />
          </div>
          <p style={{color: '#9ca3af', fontSize: '14px', marginTop: '12px'}}>
            Upload indicators in JSON format for batch processing
          </p>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Automated Feeds</span>
            <Upload className="stat-icon" size={24} />
          </div>
          <p style={{color: '#9ca3af', fontSize: '14px', marginTop: '12px'}}>
            Configure automatic ingestion from AlienVault, VirusTotal, and more
          </p>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Bulk JSON Upload</h3>
        </div>

        <form onSubmit={handleBulkIngest}>
          <div className="form-group">
            <label>Source ID</label>
            <select
              className="form-control"
              value={sourceId}
              onChange={(e) => setSourceId(e.target.value)}
            >
              <option value="">No source</option>
              {sources.map(s => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>JSON Data</label>
            <textarea
              className="form-control"
              value={jsonData}
              onChange={(e) => setJsonData(e.target.value)}
              rows="12"
              placeholder={sampleData}
              required
              style={{fontFamily: 'monospace', fontSize: '13px'}}
            />
          </div>

          {result && (
            <div style={{
              padding: '16px',
              borderRadius: '8px',
              marginBottom: '16px',
              background: result.success ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              border: `1px solid ${result.success ? '#10b981' : '#ef4444'}`,
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              {result.success ? (
                <CheckCircle size={20} color="#10b981" />
              ) : (
                <XCircle size={20} color="#ef4444" />
              )}
              <span style={{color: result.success ? '#10b981' : '#ef4444'}}>
                {result.message}
              </span>
            </div>
          )}

          <div style={{display: 'flex', gap: '12px'}}>
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading}
            >
              <Upload size={18} />
              {loading ? 'Ingesting...' : 'Ingest Data'}
            </button>
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={() => setJsonData(sampleData)}
            >
              Load Sample Data
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">JSON Format Guide</h3>
        </div>
        <div style={{padding: '0 4px'}}>
          <p style={{color: '#9ca3af', marginBottom: '16px'}}>
            Upload indicators as a JSON array with the following structure:
          </p>
          <pre style={{
            background: '#0f1220',
            padding: '16px',
            borderRadius: '8px',
            overflow: 'auto',
            fontSize: '13px',
            fontFamily: 'monospace',
            color: '#e5e7eb'
          }}>
{`{
  "type": "IPv4 | IPv6 | domain | url | hash | email",
  "value": "indicator value",
  "confidence_score": 0.0-1.0,
  "description": "optional description"
}`}
          </pre>
        </div>
      </div>
    </div>
  );
}

export default Ingestion;
