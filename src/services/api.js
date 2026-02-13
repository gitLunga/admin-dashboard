import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';


const api = axios.create({
    baseURL: `${API_BASE_URL}/admin`,
    headers: {
        'Content-Type': 'application/json',
    },
});

const notificationsApi = axios.create({
    baseURL: `${API_BASE_URL}`,
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

    //notifications

    //invoices
    downloadInvoice: (userId) => api.get(`/client-users/${userId}/invoice`, {
        responseType: 'blob', // Important for file downloads
    }),

    viewInvoice: (userId) => api.get(`/client-users/${userId}/invoice/view`, {
        responseType: 'blob',
    }),

    getInvoiceInfo: (userId) => api.get(`/client-users/${userId}/invoice/info`),

    // Also update your getClientUserById to include invoice info
    getEnhancedStatistics: () => api.get('/statistics/enhanced'),
    getDashboardMetrics: () => api.get('/statistics/dashboard'),
    getPerformanceStats: () => api.get('/statistics/performance'),

// Get all documents for a client user
    getUserDocuments: (userId) => api.get(`/client-users/${userId}/documents`),

// Download any document by document ID
    downloadDocument: (documentId) => api.get(`/documents/${documentId}/download`, {
        responseType: 'blob',
    }),

// View any document inline
    viewDocument: (documentId) => api.get(`/documents/${documentId}/view`, {
        responseType: 'blob',
    }),

// Update document status
    updateDocumentStatus: (documentId, status, notes) =>
        api.patch(`/documents/${documentId}/status`, { status, notes }),
};

export const notificationsAPI = {
    // Get all notifications (Admin endpoint)
    getNotifications: () =>
        notificationsApi.get('/notifications/all'),

    // CORRECT: Your backend has '/api/notifications/user'
    getUserNotifications: (userId, userType) =>
        notificationsApi.get('/notifications/user', {
            params: { user_id: userId, user_type: userType }
        }),

    // CORRECT: Your backend has '/api/notifications/unread-count'
    getUnreadCount: (userId, userType) => {
        return notificationsApi.get('/notifications/unread-count', {
            params: { user_id: userId, user_type: userType }
        });
    },

    // Mark notification as read
    markAsRead: (notificationId, userId, userType) => {
        return notificationsApi.patch(`/notifications/${notificationId}/read`, {
            user_id: userId,
            user_type: userType
        });
    },

    // Mark all as read for logged-in admin
    markAllAsRead: (userId, userType) => {
        return notificationsApi.patch('/notifications/mark-all-read', {
            user_id: userId,
            user_type: userType
        });
    },

    // Delete notification
    deleteNotification: (notificationId) => {
        const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
        const adminId = adminUser.op_user_id || adminUser.id;

        return notificationsApi.delete(`/notifications/${notificationId}`, {
            data: {
                user_id: adminId,
                user_type: 'Operational'
            }
        });
    }
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
