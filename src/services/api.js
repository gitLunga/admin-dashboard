import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';


const api = axios.create({
  baseURL: `${API_BASE_URL}/admin`,
  headers: {
    'Content-Type': 'application/json',
  },
});

const authApi = axios.create({
  baseURL: `${API_BASE_URL}/auth`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const adminAPI = {

    
  // Dashboard
  getDashboardData: () => api.get('/dashboard'),

  // Users
  getAllUsers: () => api.get('/all-users'),
  getClientUsers: () => api.get('/client-users'),
  getClientUserById: (id) => api.get(`/client-users/${id}`),
  updateUserStatus: (id, data) =>
    api.put(`/client-users/${id}/status`, data),

  // Operational Users
  getOperationalUsers: () => api.get('/operational-users'),
  getOperationalUserById: (id) =>
    api.get(`/operational-users/${id}`),

  // Statistics
  getStatistics: () => api.get('/statistics'),
  getRecentRegistrations: () => api.get('/recent-registrations'),
  getActivitySummary: () => api.get('/activity-summary'),

  // Search
  searchUsers: (query) => api.get(`/search?query=${query}`),
};

export const authAPI = {
  login: (loginData) => authApi.post('/login', loginData),
  testConnection: () => authApi.get('/test'),
};
