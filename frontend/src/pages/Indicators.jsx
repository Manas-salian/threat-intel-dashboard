import { useEffect, useState } from 'react';
import { Plus, Search, Edit2, Trash2, Eye } from 'lucide-react';
import { indicatorAPI } from '../services/api';

function Indicators() {
  const [indicators, setIndicators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedIndicator, setSelectedIndicator] = useState(null);

  useEffect(() => {
    loadIndicators();
  }, []);

  const loadIndicators = async () => {
    try {
      setError(null);
      const response = await indicatorAPI.getAll();
      const data = response.data;
      // Handle paginated response
      if (data.indicators && Array.isArray(data.indicators)) {
        setIndicators(data.indicators);
      } else if (Array.isArray(data)) {
        setIndicators(data);
      } else {
        console.warn('Expected array but got:', typeof data, data);
        setIndicators([]);
      }
    } catch (error) {
      console.error('Error loading indicators:', error);
      setError(error.response?.data?.error || error.message || 'Failed to load indicators');
      setIndicators([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this indicator?')) {
      try {
        await indicatorAPI.delete(id);
        loadIndicators();
      } catch (error) {
        console.error('Error deleting indicator:', error);
        alert('Failed to delete indicator');
      }
    }
  };

  const filteredIndicators = indicators.filter(indicator => {
    const matchesSearch = indicator.value.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         indicator.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || indicator.type === filterType;
    return matchesSearch && matchesType;
  });

  const indicatorTypes = ['all', ...new Set(indicators.map(i => i.type))];

  if (loading) {
    return <div className="loading">Loading indicators...</div>;
  }

  if (error) {
    return (
      <div>
        <div className="page-header">
          <h2>Indicators</h2>
          <p>Manage threat indicators (IPs, domains, hashes, URLs)</p>
        </div>
        <div className="card">
          <div className="error-state">
            <h3>Error Loading Indicators</h3>
            <p>{error}</p>
            <button className="btn btn-primary" onClick={loadIndicators}>
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
        <h2>Indicators</h2>
        <p>Manage threat indicators (IPs, domains, hashes, URLs)</p>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">All Indicators ({filteredIndicators.length})</h3>
          <button className="btn btn-primary" onClick={() => {
            setSelectedIndicator(null);
            setShowModal(true);
          }}>
            <Plus size={18} />
            Add Indicator
          </button>
        </div>

        <div className="filters">
          <div className="filter-input">
            <input
              type="text"
              className="form-control"
              placeholder="Search indicators..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="form-control" 
            style={{width: 'auto', minWidth: '150px'}}
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            {indicatorTypes.map(type => (
              <option key={type} value={type}>
                {type === 'all' ? 'All Types' : type}
              </option>
            ))}
          </select>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Value</th>
                <th>Confidence</th>
                <th>First Seen</th>
                <th>Last Seen</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredIndicators.length === 0 ? (
                <tr>
                  <td colSpan="7">
                    <div className="empty-state">
                      <h3>No indicators found</h3>
                      <p>Try adjusting your search or filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredIndicators.map((indicator) => (
                  <tr key={indicator.indicator_id}>
                    <td>
                      <span className="badge badge-info">{indicator.type}</span>
                    </td>
                    <td style={{fontFamily: 'monospace', fontSize: '13px'}}>
                      {indicator.value}
                    </td>
                    <td>
                      <div style={{width: '80px'}}>
                        <div className="confidence-bar">
                          <div 
                            className="confidence-fill" 
                            style={{width: `${indicator.confidence_score * 100}%`}}
                          />
                        </div>
                        <small style={{fontSize: '11px'}}>
                          {(indicator.confidence_score * 100).toFixed(0)}%
                        </small>
                      </div>
                    </td>
                    <td>{new Date(indicator.first_seen).toLocaleDateString()}</td>
                    <td>{new Date(indicator.last_seen).toLocaleDateString()}</td>
                    <td style={{maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                      {indicator.description}
                    </td>
                    <td>
                      <div className="actions">
                        <button 
                          className="icon-btn" 
                          title="View Details"
                          onClick={() => {
                            setSelectedIndicator(indicator);
                            setShowModal(true);
                          }}
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          className="icon-btn" 
                          title="Edit"
                          onClick={() => {
                            setSelectedIndicator(indicator);
                            setShowModal(true);
                          }}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          className="icon-btn" 
                          title="Delete"
                          onClick={() => handleDelete(indicator.indicator_id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <IndicatorModal
          indicator={selectedIndicator}
          onClose={() => {
            setShowModal(false);
            setSelectedIndicator(null);
          }}
          onSave={() => {
            loadIndicators();
            setShowModal(false);
            setSelectedIndicator(null);
          }}
        />
      )}
    </div>
  );
}

function IndicatorModal({ indicator, onClose, onSave }) {
  const [formData, setFormData] = useState({
    type: indicator?.type || 'IPv4',
    value: indicator?.value || '',
    first_seen: indicator?.first_seen?.split('T')[0] || new Date().toISOString().split('T')[0],
    last_seen: indicator?.last_seen?.split('T')[0] || new Date().toISOString().split('T')[0],
    confidence_score: indicator?.confidence_score || 0.5,
    description: indicator?.description || '',
  });

  // Map type names to type_ids (based on normalized schema)
  const typeMap = {
    'IPv4': 1,
    'IPv6': 2,
    'domain': 3,
    'url': 4,
    'hash': 5,
    'email': 6
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Convert type name to type_id for backend
      const dataToSend = {
        ...formData,
        type_id: typeMap[formData.type],
        type: undefined // Remove type field
      };
      delete dataToSend.type;

      if (indicator) {
        await indicatorAPI.update(indicator.indicator_id, dataToSend);
      } else {
        await indicatorAPI.create(dataToSend);
      }
      onSave();
    } catch (error) {
      console.error('Error saving indicator:', error);
      alert(error.response?.data?.error || 'Failed to save indicator');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{indicator ? 'Edit Indicator' : 'Add New Indicator'}</h3>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Type</label>
            <select
              className="form-control"
              value={formData.type}
              onChange={(e) => setFormData({...formData, type: e.target.value})}
              required
            >
              <option value="IPv4">IPv4</option>
              <option value="IPv6">IPv6</option>
              <option value="domain">Domain</option>
              <option value="url">URL</option>
              <option value="hash">Hash</option>
              <option value="email">Email</option>
            </select>
          </div>

          <div className="form-group">
            <label>Value</label>
            <input
              type="text"
              className="form-control"
              value={formData.value}
              onChange={(e) => setFormData({...formData, value: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label>Confidence Score ({(formData.confidence_score * 100).toFixed(0)}%)</label>
            <input
              type="range"
              className="form-control"
              min="0"
              max="1"
              step="0.01"
              value={formData.confidence_score}
              onChange={(e) => setFormData({...formData, confidence_score: parseFloat(e.target.value)})}
            />
          </div>

          <div className="form-group">
            <label>First Seen</label>
            <input
              type="date"
              className="form-control"
              value={formData.first_seen}
              onChange={(e) => setFormData({...formData, first_seen: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label>Last Seen</label>
            <input
              type="date"
              className="form-control"
              value={formData.last_seen}
              onChange={(e) => setFormData({...formData, last_seen: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              className="form-control"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows="3"
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {indicator ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Indicators;
