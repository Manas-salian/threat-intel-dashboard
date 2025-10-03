import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { sourceAPI } from '../services/api';

function Sources() {
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedSource, setSelectedSource] = useState(null);

  useEffect(() => {
    loadSources();
  }, []);

  const loadSources = async () => {
    try {
      setError(null);
      const response = await sourceAPI.getAll();
      const data = response.data;
      // Ensure data is an array
      if (Array.isArray(data)) {
        setSources(data);
      } else {
        console.warn('Expected array but got:', typeof data, data);
        setSources([]);
      }
    } catch (error) {
      console.error('Error loading sources:', error);
      setError(error.response?.data?.error || error.message || 'Failed to load sources');
      setSources([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this source?')) {
      try {
        await sourceAPI.delete(id);
        loadSources();
      } catch (error) {
        console.error('Error deleting source:', error);
      }
    }
  };

  if (loading) {
    return <div className="loading">Loading sources...</div>;
  }

  if (error) {
    return (
      <div>
        <div className="page-header">
          <h2>Data Sources</h2>
          <p>Manage threat intelligence feed sources</p>
        </div>
        <div className="card">
          <div className="error-state">
            <h3>Error Loading Sources</h3>
            <p>{error}</p>
            <button className="btn btn-primary" onClick={loadSources}>
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
        <h2>Data Sources</h2>
        <p>Manage threat intelligence feed sources</p>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">All Sources ({sources.length})</h3>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={18} />
            Add Source
          </button>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>URL</th>
                <th>Update Rate</th>
                <th>Auth Type</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((source) => (
                <tr key={source.source_id}>
                  <td style={{fontWeight: '600'}}>{source.name}</td>
                  <td style={{fontFamily: 'monospace', fontSize: '12px', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis'}}>
                    {source.url}
                  </td>
                  <td>{source.update_rate}</td>
                  <td>
                    <span className="badge badge-info">{source.auth_type}</span>
                  </td>
                  <td>
                    <span className={`badge ${source.is_active ? 'badge-low' : 'badge-medium'}`}>
                      {source.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="actions">
                      <button 
                        className="icon-btn" 
                        onClick={() => {
                          setSelectedSource(source);
                          setShowModal(true);
                        }}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        className="icon-btn" 
                        onClick={() => handleDelete(source.source_id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <SourceModal
          source={selectedSource}
          onClose={() => {
            setShowModal(false);
            setSelectedSource(null);
          }}
          onSave={() => {
            loadSources();
            setShowModal(false);
            setSelectedSource(null);
          }}
        />
      )}
    </div>
  );
}

function SourceModal({ source, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: source?.name || '',
    url: source?.url || '',
    update_rate: source?.update_rate || 'Daily',
    auth_type: source?.auth_type || 'API Key',
    is_active: source?.is_active !== undefined ? source.is_active : true,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (source) {
        await sourceAPI.update(source.source_id, formData);
      } else {
        await sourceAPI.create(formData);
      }
      onSave();
    } catch (error) {
      console.error('Error saving source:', error);
      alert('Failed to save source');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{source ? 'Edit Source' : 'Add New Source'}</h3>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              className="form-control"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label>URL</label>
            <input
              type="url"
              className="form-control"
              value={formData.url}
              onChange={(e) => setFormData({...formData, url: e.target.value})}
              placeholder="https://api.example.com/v1/indicators"
            />
          </div>

          <div className="form-group">
            <label>Update Rate</label>
            <input
              type="text"
              className="form-control"
              value={formData.update_rate}
              onChange={(e) => setFormData({...formData, update_rate: e.target.value})}
              placeholder="e.g., Hourly, Daily"
            />
          </div>

          <div className="form-group">
            <label>Auth Type</label>
            <select
              className="form-control"
              value={formData.auth_type}
              onChange={(e) => setFormData({...formData, auth_type: e.target.value})}
            >
              <option value="None">None</option>
              <option value="API Key">API Key</option>
              <option value="OAuth">OAuth</option>
              <option value="Basic Auth">Basic Auth</option>
            </select>
          </div>

          <div className="form-group">
            <label style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
              />
              Active
            </label>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {source ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Sources;
