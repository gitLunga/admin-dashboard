import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: `${API_BASE_URL}/admin`,
    headers: {'Content-Type': 'application/json'},
});

const notificationsApi = axios.create({
    baseURL: `${API_BASE_URL}`,
    headers: {'Content-Type': 'application/json'},
});

const authApi = axios.create({
    baseURL: `${API_BASE_URL}/auth`,
    headers: {'Content-Type': 'application/json'},
});

const deviceApi = axios.create({
    baseURL: API_BASE_URL,
    headers: {'Content-Type': 'application/json'},
});

export const adminAPI = {
    // Dashboard
    getDashboardData: () => api.get('/dashboard'),

    // Users
    getAllUsers: () => api.get('/all-users'),
    getClientUsers: () => api.get('/client-users'),
    getClientUserById: (id) => api.get(`/client-users/${id}`),
    updateUserStatus: (id, data) => api.patch(`/client-users/${id}/status`, data),

    // Operational Users
    getOperationalUsers: () => api.get('/operational-users'),
    getOperationalUserById: (id) => api.get(`/operational-users/${id}`),
    createOperationalUser: (userData) => api.post('/operational-users', userData),
    updateOperationalUser: (id, userData) => api.put(`/operational-users/${id}`, userData),
    deleteOperationalUser: (id) => api.delete(`/operational-users/${id}`),
    changeOperationalUserPassword: (id, data) =>
        api.patch(`/operational-users/${id}/change-password`, data),
    promoteToSuperAdmin: (id) => api.patch(`/operational-users/${id}/promote`),
    demoteSuperAdmin: (id) => api.patch(`/operational-users/${id}/demote`),

    // Statistics
    getStatistics: () => api.get('/statistics'),
    getRecentRegistrations: () => api.get('/recent-registrations'),
    getActivitySummary: () => api.get('/activity-summary'),
    getEnhancedStatistics: () => api.get('/statistics/enhanced'),
    getDashboardMetrics: () => api.get('/statistics/dashboard'),
    getPerformanceStats: () => api.get('/statistics/performance'),

    // Search
    searchUsers: (query) => api.get(`/search?query=${query}`),

    // ── Invoices — backend streams binary blob directly ──────────────────────
    // Returns the Blob (response.data) already unwrapped — callers get a Blob directly.
    viewInvoice: async (userId) => {
        const response = await api.get(
            `/client-users/${userId}/invoice/view`,
            { responseType: 'blob' }
        );
        return response.data; // ✅ Blob, not the full axios response object
    },
    downloadInvoice: async (userId) => {
        const response = await api.get(
            `/client-users/${userId}/invoice`,
            { responseType: 'blob' }
        );
        return response.data; // ✅ Blob
    },

    // ── Documents — backend streams binary blob directly ─────────────────────
    viewDocument: async (documentId) => {
        const response = await api.get(
            `/documents/${documentId}/view`,
            { responseType: 'blob' }
        );
        return response.data; // ✅ Blob
    },
    downloadDocument: async (documentId) => {
        const response = await api.get(
            `/documents/${documentId}/download`,
            { responseType: 'blob' }
        );
        return response.data; // ✅ Blob
    },

    updateDocumentStatus: (documentId, status, notes) =>
        api.patch(`/documents/${documentId}/status`, { status, notes }),
};

export const notificationsAPI = {
    getNotifications: () => notificationsApi.get('/notifications/all'),
    getUserNotifications: (userId, userType) =>
        notificationsApi.get('/notifications/user', { params: { user_id: userId, user_type: userType } }),
    getUnreadCount: (userId, userType) =>
        notificationsApi.get('/notifications/unread-count', { params: { user_id: userId, user_type: userType } }),
    markAsRead: (notificationId, userId, userType) =>
        notificationsApi.patch(`/notifications/${notificationId}/read`, { user_id: userId, user_type: userType }),
    markAllAsRead: (userId, userType) =>
        notificationsApi.patch('/notifications/mark-all-read', { user_id: userId, user_type: userType }),
    deleteNotification: (notificationId) => {
        const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
        const adminId = adminUser.op_user_id || adminUser.id;
        return notificationsApi.delete(`/notifications/${notificationId}`, {
            data: { user_id: adminId, user_type: 'Operational' }
        });
    },
};

export const deviceAPI = {
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

    getAllDevices: () => deviceApi.get('/devices'),
    getDeviceById: (deviceId) => deviceApi.get(`/devices/${deviceId}`),
    createDevice: (deviceData) => deviceApi.post('/devices', deviceData),
    updateDevice: (deviceId, deviceData) => deviceApi.put(`/devices/${deviceId}`, deviceData),
    deleteDevice: (deviceId) => deviceApi.delete(`/devices/${deviceId}`),
    searchDevices: (query) => deviceApi.get(`/devices/search?q=${query}`),
    getDevicesByStatus: (status) => deviceApi.get(`/devices/status/${status}`),
};

export const authAPI = {
    login: (loginData) => authApi.post('/login', loginData),
    registerOperational: (userData) => authApi.post('/register-operational', userData),
    testConnection: () => authApi.get('/test'),
};