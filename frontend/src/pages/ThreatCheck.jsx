import { useState } from 'react';
import { Search, Shield, AlertTriangle, CheckCircle, Activity, Globe } from 'lucide-react';
import { toolsAPI } from '../services/api';

function ThreatCheck() {
    const [value, setValue] = useState('');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleCheck = async (e) => {
        e.preventDefault();
        if (!value) return;

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const response = await toolsAPI.checkIndicator(value);
            setResult(response.data);
        } catch (err) {
            // If 404 or just not found logic depending on API
            if (err.response && err.response.data && err.response.data.found === false) {
                setResult({ found: false });
            } else {
                setError('Failed to check indicator. Please try again.');
                console.error(err);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container">
            <div className="page-header" style={{textAlign: 'center'}}>
                <h2>Threat Check</h2>
                <p>Verify if an IP address, domain, or file hash is malicious</p>
            </div>

            <div className="check-container" style={{maxWidth: '900px', margin: '2rem auto', padding: '0 1rem'}}>
                <form onSubmit={handleCheck} style={{marginBottom: '2rem'}}>
                    <div style={{display: 'flex', gap: '16px', alignItems: 'stretch'}}>
                        {/* Search Input */}
                        <div style={{flex: 1, position: 'relative'}}>
                            <Search 
                                size={20} 
                                style={{
                                    position: 'absolute', 
                                    left: '16px', 
                                    top: '50%', 
                                    transform: 'translateY(-50%)', 
                                    color: '#64748b',
                                    pointerEvents: 'none'
                                }} 
                            />
                            <input
                                type="text"
                                placeholder="Enter IP address, domain, URL, or file hash..."
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                                className="form-control"
                                style={{
                                    width: '100%',
                                    height: '32px',
                                    paddingLeft: '40px',
                                    paddingRight: '0px',
                                    fontSize: '16px',
                                    backgroundColor: '#1e293b',
                                    border: '2px solid #334155',
                                    color: '#fff',
                                    borderRadius: '8px'
                                }}
                            />
                        </div>
                        
                        {/* Button */}
                        <button 
                            type="submit" 
                            disabled={loading || !value.trim()}
                            style={{
                                width: '160px',
                                marginLeft: '40px',
                                height: '56px',
                                fontSize: '16px',
                                fontWeight: '600',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                backgroundColor: loading || !value.trim() ? '#475569' : '#6366f1',
                                color: '#fff',
                                border: 'none',
                                cursor: loading || !value.trim() ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {loading ? (
                                <>
                                    <Activity size={20} style={{animation: 'spin 1s linear infinite'}} />
                                    Checking...
                                </>
                            ) : (
                                <>
                                    <Shield size={20} />
                                    Check Threat
                                </>
                            )}
                        </button>
                    </div>
                </form>

                <div style={{
                    textAlign: 'center', 
                    marginBottom: '2rem',
                    color: '#64748b',
                    fontSize: '14px'
                }}>
                    <p style={{margin: 0}}>
                        Try examples: <code style={{
                            backgroundColor: '#1e293b', 
                            padding: '2px 8px', 
                            borderRadius: '4px',
                            marginLeft: '8px',
                            marginRight: '4px',
                            color: '#94a3b8'
                        }}>192.168.1.1</code> 
                        <code style={{
                            backgroundColor: '#1e293b', 
                            padding: '2px 8px', 
                            borderRadius: '4px',
                            marginLeft: '4px',
                            marginRight: '4px',
                            color: '#94a3b8'
                        }}>malicious-site.com</code>
                        <code style={{
                            backgroundColor: '#1e293b', 
                            padding: '2px 8px', 
                            borderRadius: '4px',
                            marginLeft: '4px',
                            color: '#94a3b8'
                        }}>d131dd0...</code>
                    </p>
                </div>

                {error && <div className="error-message" style={{padding: '1rem', backgroundColor: '#7f1d1d', color: '#fca5a5', borderRadius: '8px', marginBottom: '1rem'}}>{error}</div>}

                {result && (
                    <div className={`result-card ${result.found ? 'danger' : 'safe'}`} style={{
                        padding: '2rem',
                        borderRadius: '12px',
                        backgroundColor: result.found ? '#7f1d1d' : '#065f46',
                        border: `2px solid ${result.found ? '#dc2626' : '#10b981'}`,
                        color: '#fff'
                    }}>
                        <div className="result-header" style={{display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem'}}>
                            {result.found ? (
                                <AlertTriangle size={48} className="result-icon danger" style={{color: '#fca5a5'}} />
                            ) : (
                                <CheckCircle size={48} className="result-icon safe" style={{color: '#6ee7b7'}} />
                            )}
                            <div>
                                <h3 style={{margin: 0, marginBottom: '0.5rem'}}>{result.found ? 'Malicious Indicator Detected' : 'No Threats Found'}</h3>
                                <p style={{margin: 0, opacity: 0.9}}>{result.found ? 'This indicator is present in our threat database.' : 'This indicator was not found in our database.'}</p>
                            </div>
                        </div>

                        {result.found && result.data && (
                            <div className="result-details" style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                                <div className="detail-row" style={{display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '6px'}}>
                                    <span className="label" style={{fontWeight: '600'}}>Type:</span>
                                    <span className="value badge badge-info">{result.data.type}</span>
                                </div>
                                <div className="detail-row" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '6px'}}>
                                    <span className="label" style={{fontWeight: '600'}}>Confidence Score:</span>
                                    <div className="confidence-wrapper" style={{display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, maxWidth: '300px'}}>
                                        <div className="confidence-bar" style={{flex: 1, height: '8px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '4px', overflow: 'hidden'}}>
                                            <div className="confidence-fill" style={{ 
                                                width: `${result.data.confidence_score * 100}%`,
                                                height: '100%',
                                                backgroundColor: result.data.confidence_score >= 0.7 ? '#dc2626' : result.data.confidence_score >= 0.5 ? '#f59e0b' : '#10b981',
                                                transition: 'width 0.3s ease'
                                            }}></div>
                                        </div>
                                        <span className="value" style={{minWidth: '50px', textAlign: 'right', fontWeight: '600'}}>{(result.data.confidence_score * 100).toFixed(0)}%</span>
                                    </div>
                                </div>
                                <div className="detail-row" style={{display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '6px'}}>
                                    <span className="label" style={{fontWeight: '600'}}>First Seen:</span>
                                    <span className="value">{new Date(result.data.first_seen).toLocaleDateString()}</span>
                                </div>
                                <div className="detail-row" style={{display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '6px'}}>
                                    <span className="label" style={{fontWeight: '600'}}>Last Seen:</span>
                                    <span className="value">{new Date(result.data.last_seen).toLocaleDateString()}</span>
                                </div>
                                {result.data.actors && (
                                    <div className="detail-row" style={{display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '6px'}}>
                                        <span className="label" style={{fontWeight: '600'}}>Related Actors:</span>
                                        <span className="value">{result.data.actors}</span>
                                    </div>
                                )}
                                {result.data.campaigns && (
                                    <div className="detail-row" style={{display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '6px'}}>
                                        <span className="label" style={{fontWeight: '600'}}>Related Campaigns:</span>
                                        <span className="value">{result.data.campaigns}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default ThreatCheck;
