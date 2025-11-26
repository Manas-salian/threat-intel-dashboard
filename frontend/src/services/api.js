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
  getAll: () => api.get('/indicators'),
  getById: (id) => api.get(`/indicators/${id}`),
  getByType: (type) => api.get(`/indicators/type/${type}`),
  create: (data) => api.post('/indicators', data),
  bulkIngest: (data) => api.post('/indicators/bulk', data),
  update: (id, data) => api.put(`/indicators/${id}`, data),
  delete: (id) => api.delete(`/indicators/${id}`),
};

// Threat Actors API
export const actorAPI = {
  getAll: () => api.get('/actors'),
  getById: (id) => api.get(`/actors/${id}`),
  create: (data) => api.post('/actors', data),
  update: (id, data) => api.put(`/actors/${id}`, data),
  delete: (id) => api.delete(`/actors/${id}`),
};

// Campaigns API
export const campaignAPI = {
  getAll: () => api.get('/campaigns'),
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
};

// Correlations API
export const correlationAPI = {
  getIndicatorCorrelations: (id) => api.get(`/correlations/indicator/${id}`),
  getCampaignActors: (id) => api.get(`/correlations/campaign/${id}/actors`),
  getActorCampaigns: (id) => api.get(`/correlations/actor/${id}/campaigns`),
  linkEntities: (data) => api.post('/correlations/link', data),
};

// Ingestion API
export const ingestAPI = {
  ingestIndicators: (data) => api.post('/ingest/indicators', data),
  ingestExternal: (data) => api.post('/ingest/external', data),
  getStatus: () => api.get('/ingest/status'),
};

// Tools API
export const toolsAPI = {
  checkIndicator: (value) => api.post('/tools/check', { value }),
  backup: () => api.post('/tools/backup'),
  restore: (filename) => api.post('/tools/restore', { filename }),
  listBackups: () => api.get('/tools/backups'),
};

// Advanced Dashboard API
export const advancedDashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getAuditLogs: () => api.get('/dashboard/audit-logs'),
  getTopActors: () => api.get('/dashboard/top-actors'),
};

export default api;
