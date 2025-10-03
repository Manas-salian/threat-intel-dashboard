import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Eye } from 'lucide-react';
import { actorAPI } from '../services/api';

function ThreatActors() {
  const [actors, setActors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedActor, setSelectedActor] = useState(null);

  useEffect(() => {
    loadActors();
  }, []);

  const loadActors = async () => {
    try {
      setError(null);
      const response = await actorAPI.getAll();
      const data = response.data;
      // Handle paginated response
      if (data.actors && Array.isArray(data.actors)) {
        setActors(data.actors);
      } else if (Array.isArray(data)) {
        setActors(data);
      } else {
        console.warn('Expected array but got:', typeof data, data);
        setActors([]);
      }
    } catch (error) {
      console.error('Error loading actors:', error);
      setError(error.response?.data?.error || error.message || 'Failed to load threat actors');
      setActors([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this threat actor?')) {
      try {
        await actorAPI.delete(id);
        loadActors();
      } catch (error) {
        console.error('Error deleting actor:', error);
        alert('Failed to delete actor');
      }
    }
  };

  const filteredActors = actors.filter(actor =>
    actor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    actor.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="loading">Loading threat actors...</div>;
  }

  if (error) {
    return (
      <div>
        <div className="page-header">
          <h2>Threat Actors</h2>
          <p>Track and analyze adversary groups and their tactics</p>
        </div>
        <div className="card">
          <div className="error-state">
            <h3>Error Loading Threat Actors</h3>
            <p>{error}</p>
            <button className="btn btn-primary" onClick={loadActors}>
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
        <h2>Threat Actors</h2>
        <p>Track and analyze adversary groups and their tactics</p>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">All Threat Actors ({filteredActors.length})</h3>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={18} />
            Add Threat Actor
          </button>
        </div>

        <div className="filters">
          <input
            type="text"
            className="form-control filter-input"
            placeholder="Search threat actors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>First Seen</th>
                <th>Last Activity</th>
                <th>MITRE Tactics</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredActors.map((actor) => (
                <tr key={actor.actor_id}>
                  <td style={{fontWeight: '600'}}>{actor.name}</td>
                  <td>{actor.first_seen ? new Date(actor.first_seen).toLocaleDateString() : 'N/A'}</td>
                  <td>{actor.last_activity ? new Date(actor.last_activity).toLocaleDateString() : 'N/A'}</td>
                  <td>
                    <div style={{display: 'flex', gap: '4px', flexWrap: 'wrap'}}>
                      {actor.mitre_tactics?.split(',').slice(0, 3).map((tactic, i) => (
                        <span key={i} className="badge badge-info" style={{fontSize: '10px'}}>
                          {tactic.trim()}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td style={{maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                    {actor.description}
                  </td>
                  <td>
                    <div className="actions">
                      <button 
                        className="icon-btn" 
                        onClick={() => {
                          setSelectedActor(actor);
                          setShowModal(true);
                        }}
                      >
                        <Eye size={16} />
                      </button>
                      <button 
                        className="icon-btn" 
                        onClick={() => {
                          setSelectedActor(actor);
                          setShowModal(true);
                        }}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        className="icon-btn" 
                        onClick={() => handleDelete(actor.actor_id)}
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
        <ActorModal
          actor={selectedActor}
          onClose={() => {
            setShowModal(false);
            setSelectedActor(null);
          }}
          onSave={() => {
            loadActors();
            setShowModal(false);
            setSelectedActor(null);
          }}
        />
      )}
    </div>
  );
}

function ActorModal({ actor, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: actor?.name || '',
    description: actor?.description || '',
    first_seen: actor?.first_seen?.split('T')[0] || '',
    last_activity: actor?.last_activity?.split('T')[0] || '',
    mitre_tactics: actor?.mitre_tactics || '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (actor) {
        await actorAPI.update(actor.actor_id, formData);
      } else {
        await actorAPI.create(formData);
      }
      onSave();
    } catch (error) {
      console.error('Error saving actor:', error);
      alert('Failed to save threat actor');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{actor ? 'Edit Threat Actor' : 'Add New Threat Actor'}</h3>
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
            <label>Description</label>
            <textarea
              className="form-control"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows="4"
            />
          </div>

          <div className="form-group">
            <label>First Seen</label>
            <input
              type="date"
              className="form-control"
              value={formData.first_seen}
              onChange={(e) => setFormData({...formData, first_seen: e.target.value})}
            />
          </div>

          <div className="form-group">
            <label>Last Activity</label>
            <input
              type="date"
              className="form-control"
              value={formData.last_activity}
              onChange={(e) => setFormData({...formData, last_activity: e.target.value})}
            />
          </div>

          <div className="form-group">
            <label>MITRE ATT&CK Tactics (comma-separated)</label>
            <input
              type="text"
              className="form-control"
              value={formData.mitre_tactics}
              onChange={(e) => setFormData({...formData, mitre_tactics: e.target.value})}
              placeholder="e.g., T1566,T1071,T1059"
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {actor ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ThreatActors;
