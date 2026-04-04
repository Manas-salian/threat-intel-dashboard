import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Indicators API
export const indicatorAPI = {
  getAll: (params) => api.get('/indicators', { params }),
  getById: (id) => api.get(`/indicators/${id}`),
  getByType: (type) => api.get(`/indicators/type/${type}`),
  create: (data) => api.post('/indicators', data),
  bulkIngest: (data) => api.post('/indicators/bulk', data),
  update: (id, data) => api.put(`/indicators/${id}`, data),
  delete: (id) => api.delete(`/indicators/${id}`),
};

// Threat Actors API
export const actorAPI = {
  getAll: (params) => api.get('/actors', { params }),
  getById: (id) => api.get(`/actors/${id}`),
  create: (data) => api.post('/actors', data),
  update: (id, data) => api.put(`/actors/${id}`, data),
  delete: (id) => api.delete(`/actors/${id}`),
};

// Campaigns API
export const campaignAPI = {
  getAll: (params) => api.get('/campaigns', { params }),
  getById: (id) => api.get(`/campaigns/${id}`),
  getActive: () => api.get('/campaigns/active'),
  create: (data) => api.post('/campaigns', data),
  update: (id, data) => api.put(`/campaigns/${id}`, data),
  delete: (id) => api.delete(`/campaigns/${id}`),
};

// Sources API
export const sourceAPI = {
  getAll: () => api.get('/sources'),
  getById: (id) => api.get(`/sources/${id}`),
  create: (data) => api.post('/sources', data),
  update: (id, data) => api.put(`/sources/${id}`, data),
  delete: (id) => api.delete(`/sources/${id}`),
};

// Analytics API
export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getIndicatorTimeline: (days = 30) => api.get(`/analytics/indicators/timeline?days=${days}`),
  getActorActivity: () => api.get('/analytics/actors/activity'),
  getCampaignSeverity: () => api.get('/analytics/campaigns/severity'),
  getSourceReliability: () => api.get('/analytics/sources/reliability'),
  getTopActors: (limit = 5) => api.get(`/analytics/top-actors?limit=${limit}`),
  getAuditLogs: () => api.get('/analytics/audit-logs'),
};

// Correlations API
export const correlationAPI = {
  getCampaignsByIndicator: (value) => api.get(`/correlations/indicator/${value}/campaigns`),
  getActorsByIndicator: (value) => api.get(`/correlations/indicator/${value}/actors`),
  getRelatedIndicators: (id) => api.get(`/correlations/indicator/${id}/related`),
  getThreatContext: (id) => api.get(`/correlations/indicator/${id}/context`),
};

// Ingestion API
export const ingestAPI = {
  runAll: () => api.post('/ingest/run'),
  runSource: (source) => api.post(`/ingest/run/${source}`),
  getStatus: () => api.get('/ingest/status'),
  getHistory: () => api.get('/ingest/history'),
};

// Tools API
export const toolsAPI = {
  checkIndicator: (value) => api.post('/tools/check', { value }),
};

export default api;
