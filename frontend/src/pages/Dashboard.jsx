import { useEffect, useState } from 'react';
import { Shield, Users, Target, Database, TrendingUp, AlertTriangle } from 'lucide-react';
import { analyticsAPI } from '../services/api';

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setError(null);
      const response = await analyticsAPI.getDashboard();
      setStats(response.data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      setError(error.response?.data?.error || error.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  if (error) {
    return (
      <div className="error-state">
        <h3>Error Loading Dashboard</h3>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={loadDashboard}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h2>Dashboard</h2>
        <p>Overview of threat intelligence data</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Total Indicators</span>
            <Shield className="stat-icon" size={24} />
          </div>
          <p className="stat-value">{stats?.totalIndicators || 0}</p>
          <p className="stat-change">+{stats?.newIndicatorsToday || 0} today</p>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Threat Actors</span>
            <Users className="stat-icon" size={24} />
          </div>
          <p className="stat-value">{stats?.totalActors || 0}</p>
          <p className="stat-change">{stats?.activeActors || 0} active</p>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Active Campaigns</span>
            <Target className="stat-icon" size={24} />
          </div>
          <p className="stat-value">{stats?.activeCampaigns || 0}</p>
          <p className="stat-change">{stats?.criticalCampaigns || 0} critical</p>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Data Sources</span>
            <Database className="stat-icon" size={24} />
          </div>
          <p className="stat-value">{stats?.totalSources || 0}</p>
          <p className="stat-change">{stats?.activeSources || 0} active</p>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Recent High-Confidence Indicators</h3>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Value</th>
                <th>Confidence</th>
                <th>Last Seen</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {stats?.recentIndicators?.map((indicator) => (
                <tr key={indicator.indicator_id}>
                  <td>
                    <span className="badge badge-info">{indicator.type}</span>
                  </td>
                  <td style={{fontFamily: 'monospace'}}>{indicator.value}</td>
                  <td>
                    <div style={{width: '100px'}}>
                      <div className="confidence-bar">
                        <div 
                          className="confidence-fill" 
                          style={{width: `${indicator.confidence_score * 100}%`}}
                        />
                      </div>
                      <small>{(indicator.confidence_score * 100).toFixed(0)}%</small>
                    </div>
                  </td>
                  <td>{new Date(indicator.last_seen).toLocaleDateString()}</td>
                  <td>{indicator.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="stats-grid">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Indicator Types</h3>
          </div>
          <div style={{padding: '20px 0'}}>
            {stats?.indicatorTypes?.map((type) => (
              <div key={type.type} style={{marginBottom: '16px'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px'}}>
                  <span style={{color: '#9ca3af', textTransform: 'uppercase', fontSize: '13px'}}>
                    {type.type}
                  </span>
                  <span style={{color: '#fff', fontWeight: '600'}}>{type.count}</span>
                </div>
                <div className="confidence-bar">
                  <div 
                    className="confidence-fill" 
                    style={{width: `${(type.count / stats.totalIndicators) * 100}%`}}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Campaign Severity</h3>
          </div>
          <div style={{padding: '20px 0'}}>
            {stats?.campaignSeverity?.map((severity) => (
              <div key={severity.severity} style={{marginBottom: '16px'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px'}}>
                  <span className={`badge badge-${severity.severity.toLowerCase()}`}>
                    {severity.severity}
                  </span>
                  <span style={{color: '#fff', fontWeight: '600'}}>{severity.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
