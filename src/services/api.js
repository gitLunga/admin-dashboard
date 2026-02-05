import axios from 'axios';

const API_BASE_URL = 'http://localhost:5001/api';


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

const deviceApi = axios.create({
    baseURL: API_BASE_URL, // Base without /admin prefix
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
    getEnhancedStatistics: () => axios.get('/api/admin/statistics/enhanced'),
    getDashboardMetrics: () => axios.get('/api/admin/statistics/dashboard'),
    getPerformanceStats: () => axios.get('/api/admin/statistics/performance'),
};

export const deviceAPI = {
    // Applications - CORRECTED: Remove duplicate /admin prefix
    getAllApplications: (queryParams = '') =>
        deviceApi.get(`/applications/admin/applications${queryParams ? '?' + queryParams : ''}`),

    getApplicationStatistics: () =>
        deviceApi.get('/applications/admin/applications/stats'),

    updateApplicationStatus: (applicationId, data) =>
        deviceApi.put(`/applications/admin/applications/${applicationId}/status`, data),



    getApplicationDetails: (applicationId) =>
        deviceApi.get(`/applications/admin/applications/${applicationId}`),

    searchApplications: (query) =>
        deviceApi.get(`/applications/admin/applications?search=${query}`),

};

export const authAPI = {
  login: (loginData) => authApi.post('/login', loginData),
    registerOperational: (userData) => authApi.post('/register-operational', userData),

  testConnection: () => authApi.get('/test'),
};
