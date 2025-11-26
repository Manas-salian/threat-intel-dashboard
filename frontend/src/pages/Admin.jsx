import { useState, useEffect } from 'react';
import { Database, RotateCcw, FileText, Download, Upload } from 'lucide-react';
import { toolsAPI, advancedDashboardAPI } from '../services/api';

function Admin() {
    const [backups, setBackups] = useState([]);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [backupsRes, logsRes] = await Promise.all([
                toolsAPI.listBackups(),
                advancedDashboardAPI.getAuditLogs()
            ]);
            setBackups(backupsRes.data);
            setLogs(logsRes.data);
        } catch (err) {
            console.error('Error loading admin data:', err);
        }
    };

    const handleBackup = async () => {
        setLoading(true);
        setMessage(null);
        try {
            const res = await toolsAPI.backup();
            setMessage({ type: 'success', text: 'Backup created successfully!' });
            loadData();
        } catch (err) {
            setMessage({ type: 'error', text: 'Backup failed.' });
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async (filename) => {
        if (!window.confirm(`Are you sure you want to restore ${filename}? This will overwrite current data.`)) return;

        setLoading(true);
        setMessage(null);
        try {
            await toolsAPI.restore(filename);
            setMessage({ type: 'success', text: 'Database restored successfully!' });
        } catch (err) {
            setMessage({ type: 'error', text: 'Restore failed.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h2>System Administration</h2>
                <p>Manage database backups and view system logs</p>
            </div>

            {message && (
                <div className={`alert alert-${message.type}`}>
                    {message.text}
                </div>
            )}

            <div className="admin-grid">
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Database Management</h3>
                        <Database size={20} />
                    </div>
                    <div className="card-content">
                        <button className="btn btn-primary full-width" onClick={handleBackup} disabled={loading}>
                            <Download size={18} />
                            Create New Backup
                        </button>

                        <div className="backup-list">
                            <h4>Available Backups</h4>
                            {backups.length === 0 ? (
                                <p className="empty-text">No backups found.</p>
                            ) : (
                                <ul>
                                    {backups.map((backup) => (
                                        <li key={backup.filename} className="backup-item">
                                            <div className="backup-info">
                                                <span className="backup-name">{backup.filename}</span>
                                                <span className="backup-date">{new Date(backup.created).toLocaleString()}</span>
                                            </div>
                                            <button
                                                className="btn btn-sm btn-outline-danger"
                                                onClick={() => handleRestore(backup.filename)}
                                                disabled={loading}
                                            >
                                                <RotateCcw size={14} /> Restore
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Audit Logs</h3>
                        <FileText size={20} />
                    </div>
                    <div className="card-content logs-container">
                        <table className="table-sm">
                            <thead>
                                <tr>
                                    <th>Time</th>
                                    <th>Action</th>
                                    <th>Details</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log) => (
                                    <tr key={log.log_id}>
                                        <td className="text-muted">{new Date(log.created_at).toLocaleString()}</td>
                                        <td><span className="badge badge-secondary">{log.action_type}</span></td>
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
