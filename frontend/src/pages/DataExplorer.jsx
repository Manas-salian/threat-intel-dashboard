import { useState, useEffect } from 'react';
import { Globe, Users, Target, Shield } from 'lucide-react';
import { indicatorAPI, actorAPI } from '../services/api';

function DataExplorer() {
    const [view, setView] = useState('global'); // global, actors
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadData();
    }, [view]);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            if (view === 'global') {
                const res = await indicatorAPI.getAll();
                // Handle both direct array and paginated response
                const indicators = res.data.indicators || res.data || [];
                setData(indicators.slice(0, 100)); // Show first 100
            } else if (view === 'actors') {
                const res = await actorAPI.getAll();
                const actors = res.data.actors || res.data || [];
                setData(actors);
            }
        } catch (err) {
            console.error('Error loading data:', err);
            setError('Failed to load data');
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h2>Data Explorer</h2>
                <p>Explore unified views of the threat landscape</p>
            </div>

            <div className="explorer-controls" style={{ marginBottom: '2rem', display: 'flex', gap: '1rem' }}>
                <button
                    className={`btn ${view === 'global' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setView('global')}
                >
                    <Globe size={18} /> Global Threat Map
                </button>
                <button
                    className={`btn ${view === 'actors' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setView('actors')}
                >
                    <Users size={18} /> Actor Profiles
                </button>
            </div>

            {loading ? (
                <div className="loading">Loading view...</div>
            ) : error ? (
                <div className="card">
                    <div className="error-state">
                        <h3>Error</h3>
                        <p>{error}</p>
                        <button className="btn btn-primary" onClick={loadData}>Retry</button>
                    </div>
                </div>
            ) : (
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">
                            {view === 'global' ? 'Global Threat Indicators' : 'Threat Actor Profiles'}
                        </h3>
                        <span className="badge badge-info">{data?.length || 0} records</span>
                    </div>
                    <div className="table-container">
                        <table>
                            <thead>
                                {view === 'global' ? (
                                    <tr>
                                        <th>Type</th>
                                        <th>Indicator Value</th>
                                        <th>Confidence</th>
                                        <th>First Seen</th>
                                        <th>Last Seen</th>
                                    </tr>
                                ) : (
                                    <tr>
                                        <th>Actor Name</th>
                                        <th>Origin</th>
                                        <th>First Seen</th>
                                        <th>Last Seen</th>
                                        <th>Description</th>
                                    </tr>
                                )}
                            </thead>
                            <tbody>
                                {!data || data.length === 0 ? (
                                    <tr>
                                        <td colSpan={view === 'global' ? 5 : 5} style={{textAlign: 'center', padding: '2rem'}}>
                                            <div className="empty-state">
                                                <h3>No data available</h3>
                                                <p>No {view === 'global' ? 'indicators' : 'actors'} found in the database</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : data.map((row, i) => (
                                    <tr key={i}>
                                        {view === 'global' ? (
                                            <>
                                                <td><span className="badge badge-info">{row.type_name || row.type || 'Unknown'}</span></td>
                                                <td style={{fontFamily: 'monospace', fontSize: '13px'}}>{row.value}</td>
                                                <td>
                                                    <div style={{width: '80px'}}>
                                                        <div className="confidence-bar">
                                                            <div className="confidence-fill" style={{width: `${(row.confidence_score || 0) * 100}%`}}></div>
                                                        </div>
                                                        <small>{((row.confidence_score || 0) * 100).toFixed(0)}%</small>
                                                    </div>
                                                </td>
                                                <td>{row.first_seen ? new Date(row.first_seen).toLocaleDateString() : 'N/A'}</td>
                                                <td>{row.last_seen ? new Date(row.last_seen).toLocaleDateString() : 'N/A'}</td>
                                            </>
                                        ) : (
                                            <>
                                                <td style={{fontWeight: '600'}}>{row.name}</td>
                                                <td>{row.origin_country || 'Unknown'}</td>
                                                <td>{row.first_seen ? new Date(row.first_seen).toLocaleDateString() : 'N/A'}</td>
                                                <td>{row.last_seen ? new Date(row.last_seen).toLocaleDateString() : 'N/A'}</td>
                                                <td style={{maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis'}}>
                                                    {row.description || 'No description'}
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

export default DataExplorer;
