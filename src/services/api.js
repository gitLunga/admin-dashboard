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
    api.patch(`/client-users/${id}/status`, data),

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

    downloadInvoice: (userId) => api.get(`/client-users/${userId}/invoice`, {
        responseType: 'blob', // Important for file downloads
    }),

    viewInvoice: (userId) => api.get(`/client-users/${userId}/invoice/view`, {
        responseType: 'blob',
    }),

    getInvoiceInfo: (userId) => api.get(`/client-users/${userId}/invoice/info`),

    // Also update your getClientUserById to include invoice info
};

export const authAPI = {
  login: (loginData) => authApi.post('/login', loginData),
  testConnection: () => authApi.get('/test'),
};
