import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Eye } from 'lucide-react';
import { campaignAPI } from '../services/api';

function Campaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      setError(null);
      const response = await campaignAPI.getAll();
      const data = response.data;
      // Handle paginated response
      if (data.campaigns && Array.isArray(data.campaigns)) {
        setCampaigns(data.campaigns);
      } else if (Array.isArray(data)) {
        setCampaigns(data);
      } else {
        console.warn('Expected array but got:', typeof data, data);
        setCampaigns([]);
      }
    } catch (error) {
      console.error('Error loading campaigns:', error);
      setError(error.response?.data?.error || error.message || 'Failed to load campaigns');
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this campaign?')) {
      try {
        await campaignAPI.delete(id);
        loadCampaigns();
      } catch (error) {
        console.error('Error deleting campaign:', error);
        alert('Failed to delete campaign');
      }
    }
  };

  const filteredCampaigns = campaigns.filter(campaign =>
    campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    campaign.summary?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="loading">Loading campaigns...</div>;
  }

  if (error) {
    return (
      <div>
        <div className="page-header">
          <h2>Campaigns</h2>
          <p>Monitor coordinated threat activities and attack waves</p>
        </div>
        <div className="card">
          <div className="error-state">
            <h3>Error Loading Campaigns</h3>
            <p>{error}</p>
            <button className="btn btn-primary" onClick={loadCampaigns}>
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
        <h2>Campaigns</h2>
        <p>Monitor coordinated threat activities and attack waves</p>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">All Campaigns ({filteredCampaigns.length})</h3>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={18} />
            Add Campaign
          </button>
        </div>

        <div className="filters">
          <input
            type="text"
            className="form-control filter-input"
            placeholder="Search campaigns..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Severity</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Status</th>
                <th>Summary</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCampaigns.map((campaign) => {
                const isActive = !campaign.end_date || new Date(campaign.end_date) > new Date();
                return (
                  <tr key={campaign.campaign_id}>
                    <td style={{fontWeight: '600'}}>{campaign.name}</td>
                    <td>
                      <span className={`badge badge-${campaign.severity?.toLowerCase() || 'medium'}`}>
                        {campaign.severity || 'Medium'}
                      </span>
                    </td>
                    <td>{campaign.start_date ? new Date(campaign.start_date).toLocaleDateString() : 'N/A'}</td>
                    <td>{campaign.end_date ? new Date(campaign.end_date).toLocaleDateString() : 'Ongoing'}</td>
                    <td>
                      <span className={`badge ${isActive ? 'badge-high' : 'badge-low'}`}>
                        {isActive ? 'Active' : 'Completed'}
                      </span>
                    </td>
                    <td style={{maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                      {campaign.summary}
                    </td>
                    <td>
                      <div className="actions">
                        <button 
                          className="icon-btn" 
                          onClick={() => {
                            setSelectedCampaign(campaign);
                            setShowModal(true);
                          }}
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          className="icon-btn" 
                          onClick={() => {
                            setSelectedCampaign(campaign);
                            setShowModal(true);
                          }}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          className="icon-btn" 
                          onClick={() => handleDelete(campaign.campaign_id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <CampaignModal
          campaign={selectedCampaign}
          onClose={() => {
            setShowModal(false);
            setSelectedCampaign(null);
          }}
          onSave={() => {
            loadCampaigns();
            setShowModal(false);
            setSelectedCampaign(null);
          }}
        />
      )}
    </div>
  );
}

function CampaignModal({ campaign, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: campaign?.name || '',
    start_date: campaign?.start_date?.split('T')[0] || '',
    end_date: campaign?.end_date?.split('T')[0] || '',
    summary: campaign?.summary || '',
    severity: campaign?.severity || 'Medium',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (campaign) {
        await campaignAPI.update(campaign.campaign_id, formData);
      } else {
        await campaignAPI.create(formData);
      }
      onSave();
    } catch (error) {
      console.error('Error saving campaign:', error);
      alert('Failed to save campaign');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{campaign ? 'Edit Campaign' : 'Add New Campaign'}</h3>
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
            <label>Severity</label>
            <select
              className="form-control"
              value={formData.severity}
              onChange={(e) => setFormData({...formData, severity: e.target.value})}
              required
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>

          <div className="form-group">
            <label>Start Date</label>
            <input
              type="date"
              className="form-control"
              value={formData.start_date}
              onChange={(e) => setFormData({...formData, start_date: e.target.value})}
            />
          </div>

          <div className="form-group">
            <label>End Date (leave empty for ongoing)</label>
            <input
              type="date"
              className="form-control"
              value={formData.end_date}
              onChange={(e) => setFormData({...formData, end_date: e.target.value})}
            />
          </div>

          <div className="form-group">
            <label>Summary</label>
            <textarea
              className="form-control"
              value={formData.summary}
              onChange={(e) => setFormData({...formData, summary: e.target.value})}
              rows="4"
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {campaign ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Campaigns;
