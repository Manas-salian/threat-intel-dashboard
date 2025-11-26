import { useEffect, useState } from 'react';
import { Shield, Users, Target, Database, TrendingUp, AlertTriangle, Activity } from 'lucide-react';
import { analyticsAPI } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [advancedStats, setAdvancedStats] = useState(null);
  const [topActors, setTopActors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setError(null);
      const dashboardRes = await analyticsAPI.getDashboard();
      const actorsRes = await analyticsAPI.getActorActivity();
      
      const dashData = dashboardRes.data;
      setStats(dashData);
      
      // Use indicator types from dashboard data for the chart
      const typeData = dashData.indicatorTypes?.map(t => ({
        type: t.type,
        indicator_count: t.count
      })) || [];
      setAdvancedStats(typeData);
      
      // Use actor activity for top actors
      setTopActors(actorsRes.data || []);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading dashboard...</div>;
  if (error) return <div className="error-state">{error}</div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Security Overview</h2>
        <p>Real-time threat intelligence monitoring</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card gradient-1">
          <div className="stat-header">
            <span className="stat-label">Total Indicators</span>
            <Shield className="stat-icon" size={24} />
          </div>
          <p className="stat-value">{stats?.totalIndicators || 0}</p>
          <p className="stat-change">+{stats?.newIndicatorsToday || 0} today</p>
        </div>

        <div className="stat-card gradient-2">
          <div className="stat-header">
            <span className="stat-label">Threat Actors</span>
            <Users className="stat-icon" size={24} />
          </div>
          <p className="stat-value">{stats?.totalActors || 0}</p>
          <p className="stat-change">{stats?.activeActors || 0} active</p>
        </div>

        <div className="stat-card gradient-3">
          <div className="stat-header">
            <span className="stat-label">Active Campaigns</span>
            <Target className="stat-icon" size={24} />
          </div>
          <p className="stat-value">{stats?.activeCampaigns || 0}</p>
          <p className="stat-change">{stats?.criticalCampaigns || 0} critical</p>
        </div>

        <div className="stat-card gradient-4">
          <div className="stat-header">
            <span className="stat-label">Data Sources</span>
            <Database className="stat-icon" size={24} />
          </div>
          <p className="stat-value">{stats?.totalSources || 0}</p>
          <p className="stat-change">{stats?.totalSources || 0} active</p>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card span-2">
          <div className="card-header">
            <h3 className="card-title">Threat Landscape (By Type)</h3>
            <Activity size={20} />
          </div>
          <div className="chart-container" style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={advancedStats}>
                <XAxis dataKey="type" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="indicator_count" fill="#6366f1" radius={[4, 4, 0, 0]}>
                  {advancedStats?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#6366f1', '#8b5cf6', '#ec4899', '#10b981'][index % 4]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Top Threat Actors</h3>
            <Users size={20} />
          </div>
          <div className="list-container">
            {topActors && topActors.length > 0 ? (
              topActors.map((actor, i) => (
                <div key={i} className="list-item">
                  <div className="list-item-info">
                    <span className="item-name">{actor.name}</span>
                    <span className="item-sub">{actor.last_activity ? new Date(actor.last_activity).toLocaleDateString() : 'No recent activity'}</span>
                  </div>
                  <div className="item-metric">
                    <span className="metric-value">{actor.indicator_count || 0}</span>
                    <span className="metric-label">indicators</span>
                  </div>
                </div>
              ))
            ) : (
              <div style={{padding: '1rem', textAlign: 'center', color: '#9ca3af'}}>No actor data available</div>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Recent High-Confidence Indicators</h3>
        </div>
        <div className="table-responsive">
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
                  <td><span className="badge badge-info">{indicator.type}</span></td>
                  <td className="font-mono">{indicator.value}</td>
                  <td>
                    <div className="confidence-wrapper">
                      <div className="confidence-bar-bg">
                        <div className="confidence-bar-fill" style={{ width: `${indicator.confidence_score * 100}%` }}></div>
                      </div>
                      <span className="confidence-text">{(indicator.confidence_score * 100).toFixed(0)}%</span>
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
    </div>
  );
}

export default Dashboard;
