import { useState, useEffect } from 'react';
import { Database, FileText, Activity } from 'lucide-react';
import { analyticsAPI, ingestAPI } from '../services/api';

function Admin() {
    const [logs, setLogs] = useState([]);
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [logsRes, statusRes] = await Promise.all([
                analyticsAPI.getAuditLogs(),
                ingestAPI.getStatus()
            ]);
            setLogs(logsRes.data);
            setStatus(statusRes.data);
        } catch (err) {
            console.error('Error loading admin data:', err);
        }
    };

    const handleRunIngestion = async () => {
        setLoading(true);
        setMessage(null);
        try {
            await ingestAPI.runAll();
            setMessage({ type: 'success', text: 'Ingestion pipeline completed successfully!' });
            loadData();
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.error || 'Ingestion failed.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h2>System Administration</h2>
                <p>System status, ingestion controls, and audit logs</p>
            </div>

            {message && (
                <div style={{
                    padding: '16px',
                    borderRadius: '8px',
                    marginBottom: '16px',
                    background: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    border: `1px solid ${message.type === 'success' ? '#10b981' : '#ef4444'}`,
                    color: message.type === 'success' ? '#10b981' : '#ef4444'
                }}>
                    {message.text}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '24px' }}>
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">System Status</h3>
                        <Database size={20} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #2d3548' }}>
                            <span style={{ color: '#9ca3af' }}>Total Indicators</span>
                            <span style={{ color: '#fff', fontWeight: 600 }}>{status?.totalIndicators ?? '—'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #2d3548' }}>
                            <span style={{ color: '#9ca3af' }}>Recent (24h)</span>
                            <span style={{ color: '#fff', fontWeight: 600 }}>{status?.recentIndicators24h ?? '—'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                            <span style={{ color: '#9ca3af' }}>Last Ingestion</span>
                            <span style={{ color: '#fff', fontWeight: 600 }}>
                                {status?.lastRun ? new Date(status.lastRun).toLocaleString() : 'Never'}
                            </span>
                        </div>

                        <button
                            className="btn btn-primary"
                            onClick={handleRunIngestion}
                            disabled={loading}
                            style={{ marginTop: '16px' }}
                        >
                            <Activity size={18} />
                            {loading ? 'Running...' : 'Run Full Ingestion Pipeline'}
                        </button>
                    </div>
                </div>

                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Audit Logs</h3>
                        <FileText size={20} />
                    </div>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Time</th>
                                    <th>Action</th>
                                    <th>Details</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
                                            No audit logs yet
                                        </td>
                                    </tr>
                                ) : logs.map((log) => (
                                    <tr key={log._id}>
                                        <td style={{ color: '#9ca3af', fontSize: '13px' }}>
                                            {new Date(log.created_at).toLocaleString()}
                                        </td>
                                        <td>
                                            <span className="badge badge-info">{log.action_type}</span>
                                        </td>
                                        <td>{log.details}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Admin;
