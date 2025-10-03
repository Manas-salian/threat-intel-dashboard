import { useEffect, useState } from 'react';
import { analyticsAPI } from '../services/api';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f97316', '#eab308', '#10b981'];

function Analytics() {
  const [timeline, setTimeline] = useState([]);
  const [actorActivity, setActorActivity] = useState([]);
  const [severityDist, setSeverityDist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setError(null);
      const [timelineRes, actorRes, severityRes] = await Promise.all([
        analyticsAPI.getIndicatorTimeline(30),
        analyticsAPI.getActorActivity(),
        analyticsAPI.getCampaignSeverity(),
      ]);
      setTimeline(timelineRes.data || []);
      setActorActivity(actorRes.data || []);
      setSeverityDist(severityRes.data || []);
    } catch (error) {
      console.error('Error loading analytics:', error);
      setError(error.response?.data?.error || error.message || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading analytics...</div>;
  }

  if (error) {
    return (
      <div>
        <div className="page-header">
          <h2>Analytics</h2>
          <p>Visualize threat intelligence trends and patterns</p>
        </div>
        <div className="card">
          <div className="error-state">
            <h3>Error Loading Analytics</h3>
            <p>{error}</p>
            <button className="btn btn-primary" onClick={loadAnalytics}>
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h2>Analytics</h2>
        <p>Visualize threat intelligence trends and patterns</p>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Indicator Timeline (Last 30 Days)</h3>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={timeline}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d3548" />
            <XAxis dataKey="date" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip 
              contentStyle={{background: '#1a1f35', border: '1px solid #2d3548', borderRadius: '8px'}}
            />
            <Legend />
            <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} name="New Indicators" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px'}}>
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Top Threat Actors by Indicators</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={actorActivity.slice(0, 5)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d3548" />
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{background: '#1a1f35', border: '1px solid #2d3548', borderRadius: '8px'}}
              />
              <Bar dataKey="indicator_count" fill="#6366f1" name="Indicators" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Campaign Severity Distribution</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={severityDist}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
                nameKey="severity"
              >
                {severityDist.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{background: '#1a1f35', border: '1px solid #2d3548', borderRadius: '8px'}}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Threat Actor Activity Details</h3>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Actor Name</th>
                <th>Total Indicators</th>
                <th>Last Activity</th>
                <th>Activity Level</th>
              </tr>
            </thead>
            <tbody>
              {actorActivity.map((actor) => (
                <tr key={actor.actor_id}>
                  <td style={{fontWeight: '600'}}>{actor.name}</td>
                  <td>{actor.indicator_count}</td>
                  <td>{actor.last_activity ? new Date(actor.last_activity).toLocaleDateString() : 'N/A'}</td>
                  <td>
                    <span className={`badge ${
                      actor.indicator_count > 10 ? 'badge-critical' :
                      actor.indicator_count > 5 ? 'badge-high' :
                      'badge-medium'
                    }`}>
                      {actor.indicator_count > 10 ? 'Very High' :
                       actor.indicator_count > 5 ? 'High' : 'Medium'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Analytics;
