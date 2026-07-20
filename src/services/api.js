import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// ── Token helpers ─────────────────────────────────────────────────────────────
const getToken = () => localStorage.getItem('adminToken');

const attachToken = (config) => {
    const token = getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
};

const handle401 = (error) => {
    if (error.response?.status === 401) {
        const msg = error.response?.data?.message || 'Your session has expired. Please sign in again.';
        sessionStorage.setItem('auth_flash', JSON.stringify({ type: 'warning', text: msg }));
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminRefreshToken');
        localStorage.removeItem('adminUser');
        window.location.href = '/login';
    }
    return Promise.reject(error);
};

// ── Axios instances ───────────────────────────────────────────────────────────
const api = axios.create({
    baseURL: `${API_BASE_URL}/admin`,
    headers: { 'Content-Type': 'application/json' },
});

const notificationsApi = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Content-Type': 'application/json' },
});

const authApi = axios.create({
    baseURL: `${API_BASE_URL}/auth`,
    headers: { 'Content-Type': 'application/json' },
});

const deviceApi = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Content-Type': 'application/json' },
});

const slaApi = axios.create({
    baseURL: `${API_BASE_URL}/sla`,
    headers: { 'Content-Type': 'application/json' },
});

const reportsApi = axios.create({
    baseURL: `${API_BASE_URL}/reports`,
    headers: { 'Content-Type': 'application/json' },
});

const contractsApi = axios.create({
    baseURL: `${API_BASE_URL}/contracts`,
    headers: { 'Content-Type': 'application/json' },
});

const auditApi = axios.create({
    baseURL: `${API_BASE_URL}/audit`,
    headers: { 'Content-Type': 'application/json' },
});

const profileApi = axios.create({
    baseURL: `${API_BASE_URL}/profile`,
    headers: { 'Content-Type': 'application/json' },
});

// Apply interceptors to every instance
// authApi is excluded from handle401 — a 401 from login/refresh is an expected error
// the component handles it; the global redirect would swallow the error before catch fires
[api, notificationsApi, deviceApi, slaApi, reportsApi, contractsApi, auditApi, profileApi].forEach(inst => {
    inst.interceptors.request.use(attachToken, (err) => Promise.reject(err));
    inst.interceptors.response.use((res) => res, handle401);
});

authApi.interceptors.request.use(attachToken, (err) => Promise.reject(err));

// ── Auth API ──────────────────────────────────────────────────────────────────
export const authAPI = {
    login:               (data)             => authApi.post('/login-operational', data),
    registerOperational: (data)             => authApi.post('/register-operational', data),
    testConnection:      ()                 => authApi.get('/test'),
    forgotPassword:      (email)            => authApi.post('/forgot-password', { email }),
    resetPassword:       (token, newPw)     => authApi.post('/reset-password', { token, new_password: newPw }),
    changePassword:      (currentPw, newPw) =>
        authApi.post('/change-password', { current_password: currentPw, new_password: newPw }),
    refresh:             (refreshToken)     => authApi.post('/refresh', { refreshToken }),
    logout:              (refreshToken)     => authApi.post('/logout', { refreshToken }),
};

// ── Admin API ─────────────────────────────────────────────────────────────────
export const adminAPI = {
    // Dashboard
    getDashboardData:      ()               => api.get('/dashboard'),

    // Client users
    getAllUsers:           ()               => api.get('/all-users'),
    getClientUsers:        ()               => api.get('/client-users'),
    getClientUserById:     (id)             => api.get(`/client-users/${id}`),
    updateUserStatus:      (id, data)       => api.patch(`/client-users/${id}/status`, data),
    updateClientUser:      (id, data)       => api.put(`/client-users/${id}`, data),
    deleteClientUser:      (id)             => api.delete(`/client-users/${id}`),

    // Operational users
    getOperationalUsers:            ()          => api.get('/operational-users'),
    getOperationalUserById:         (id)        => api.get(`/operational-users/${id}`),
    createOperationalUser:          (data)      => api.post('/operational-users', data),
    updateOperationalUser:          (id, data)  => api.put(`/operational-users/${id}`, data),
    deleteOperationalUser:          (id)        => api.delete(`/operational-users/${id}`),
    changeOperationalUserPassword:  (id, data)  =>
        api.patch(`/operational-users/${id}/change-password`, data),
    promoteToSuperAdmin:            (id)        => api.patch(`/operational-users/${id}/promote`),
    demoteSuperAdmin:               (id)        => api.patch(`/operational-users/${id}/demote`),
    setGlobalAccess:                (id, val)   => api.patch(`/operational-users/${id}/global-access`, { has_global_access: val }),

    // Departments
    getDepartments:   ()             => api.get('/departments'),
    createDepartment: (data)         => api.post('/departments', data),
    deleteDepartment: (id)           => api.delete(`/departments/${id}`),

    // System overview (Admin settings panel)
    getSystemOverview:       ()             => api.get('/system-overview'),

    // Statistics
    getStatistics:          ()              => api.get('/statistics'),
    getRecentRegistrations: ()              => api.get('/recent-registrations'),
    getActivitySummary:     ()              => api.get('/activity-summary'),
    getEnhancedStatistics:  ()              => api.get('/statistics/enhanced'),
    getDashboardMetrics:    ()              => api.get('/statistics/dashboard'),
    getPerformanceStats:    ()              => api.get('/statistics/performance'),

    // Search
    searchUsers:            (q)             => api.get(`/search?query=${q}`),

    // Invoices
    viewInvoice:            (userId)        => api.get(`/client-users/${userId}/invoice/view`),
    downloadInvoice:        (userId)        => api.get(`/client-users/${userId}/invoice`),
    getInvoiceInfo:         (userId)        => api.get(`/client-users/${userId}/invoice/info`),

    // Documents
    getUserDocuments:       (userId)        => api.get(`/client-users/${userId}/documents`),
    viewDocument:           (docId)         => api.get(`/documents/${docId}/view`),
    downloadDocument:       (docId)         => api.get(`/documents/${docId}/download`),
    updateDocumentStatus:   (docId, status, notes) =>
        api.patch(`/documents/${docId}/status`, { status, notes }),
};

// ── Notifications — identity from JWT, no user_id params ─────────────────────
export const notificationsAPI = {
    getNotifications:     ()    => notificationsApi.get('/notifications/all'),
    getUserNotifications: ()    => notificationsApi.get('/notifications/user'),
    getUnreadCount:       ()    => notificationsApi.get('/notifications/unread-count'),
    markAsRead:           (id)  => notificationsApi.patch(`/notifications/${id}/read`),
    markAllAsRead:        ()    => notificationsApi.patch('/notifications/mark-all-read'),
    deleteNotification:   (id)  => notificationsApi.delete(`/notifications/${id}`),
};

// ── Device / Application API ──────────────────────────────────────────────────
export const deviceAPI = {
    // Applications (admin view)
    getAllApplications:       (qs = '')      =>
        deviceApi.get(`/applications/admin/applications${qs ? '?' + qs : ''}`),
    getApplicationStatistics: ()             => deviceApi.get('/applications/admin/applications/stats'),
    getApplicationDetails:    (id)           => deviceApi.get(`/applications/admin/applications/${id}`),
    updateApplicationStatus:  (id, data)     => deviceApi.put(`/applications/admin/applications/${id}/status`, data),
    placeOrder:               (id, data)     => deviceApi.post(`/applications/admin/applications/${id}/place-order`, data),
    dispatchOrder:            (orderId, data) => deviceApi.post(`/applications/admin/orders/${orderId}/dispatch`, data),
    deliverOrder:             (orderId, data) => deviceApi.post(`/applications/admin/orders/${orderId}/deliver`, data),

    // Device catalog
    getAllDevices:             ()             => deviceApi.get('/devices'),
    getDeviceById:            (id)           => deviceApi.get(`/devices/${id}`),
    createDevice:             (data)         => deviceApi.post('/devices', data),
    updateDevice:             (id, data)     => deviceApi.put(`/devices/${id}`, data),
    deleteDevice:             (id)           => deviceApi.delete(`/devices/${id}`),
    searchDevices:            (q)            => deviceApi.get(`/devices/search?q=${q}`),
    getDevicesByStatus:       (status)       => deviceApi.get(`/devices/status/${status}`),
    getInventory:             ()             => deviceApi.get('/devices/inventory'),
    updateDeviceStock:        (id, qty)      => deviceApi.patch(`/devices/${id}/stock`, { stock_quantity: qty }),
};

// ── SLA API ───────────────────────────────────────────────────────────────────
export const slaAPI = {
    getDashboard:         ()              => slaApi.get('/dashboard'),
    getApplications:      (qs = '')       => slaApi.get(`/applications${qs ? '?' + qs : ''}`),
    getBreached:          (qs = '')       => slaApi.get(`/breached${qs ? '?' + qs : ''}`),
    getApproaching:       (qs = '')       => slaApi.get(`/approaching${qs ? '?' + qs : ''}`),
    getApplicationDetail: (id)            => slaApi.get(`/applications/${id}`),
};

// ── Reports API ───────────────────────────────────────────────────────────────
export const reportsAPI = {
    getHistory:           ()              => reportsApi.get('/history'),
    getApplications:      (qs = '')       => reportsApi.get(`/applications${qs ? '?' + qs : ''}`),
    exportApplications:   (qs = '')       => reportsApi.get(`/applications/export${qs ? '?' + qs : ''}`, { responseType: 'blob' }),
    getUsers:             (qs = '')       => reportsApi.get(`/users${qs ? '?' + qs : ''}`),
    exportUsers:          (qs = '')       => reportsApi.get(`/users/export${qs ? '?' + qs : ''}`, { responseType: 'blob' }),
    getInventory:         ()              => reportsApi.get('/inventory'),
    exportInventory:      ()              => reportsApi.get('/inventory/export', { responseType: 'blob' }),
    getSla:               ()              => reportsApi.get('/sla'),
    exportSla:            ()              => reportsApi.get('/sla/export', { responseType: 'blob' }),
};

// ── Contracts API ─────────────────────────────────────────────────────────────
export const contractsAPI = {
    getSummary:           ()              => contractsApi.get('/summary'),
    getList:              (qs = '')       => contractsApi.get(`/${qs ? '?' + qs : ''}`),
    getExpiring:          (days = 30, qs = '') =>
        contractsApi.get(`/expiring?days=${days}${qs ? '&' + qs : ''}`),
    sendReminders:        (days = 30)     => contractsApi.post(`/send-reminders?days=${days}`),
};

// ── Audit API ─────────────────────────────────────────────────────────────────
export const auditAPI = {
    getLogs:              (qs = '')       => auditApi.get(`/logs${qs ? '?' + qs : ''}`),
    getLogins:            (qs = '')       => auditApi.get(`/logins${qs ? '?' + qs : ''}`),
};

// ── Profile API (any authenticated operational user) ─────────────────────────
export const profileAPI = {
    getMe:    ()     => profileApi.get('/me'),
    updateMe: (data) => profileApi.patch('/me', data),
};

// ── PDF API ───────────────────────────────────────────────────────────────────
const pdfApi = axios.create({ baseURL: `${API_BASE_URL}/pdf`, headers: { 'Content-Type': 'application/json' } });
pdfApi.interceptors.request.use(attachToken, (err) => Promise.reject(err));
pdfApi.interceptors.response.use((res) => res, handle401);

export const pdfAPI = {
    allocationLetter: (applicationId) => pdfApi.get(`/allocation-letter/${applicationId}`, { responseType: 'blob' }),
    contractSummary:  (contractId)    => pdfApi.get(`/contract/${contractId}`,              { responseType: 'blob' }),
    orderConfirmation:(orderId)       => pdfApi.get(`/order/${orderId}`,                    { responseType: 'blob' }),
};

// ── Device Returns API ────────────────────────────────────────────────────────
const returnsApi = axios.create({ baseURL: `${API_BASE_URL}/returns`, headers: { 'Content-Type': 'application/json' } });
returnsApi.interceptors.request.use(attachToken, (err) => Promise.reject(err));
returnsApi.interceptors.response.use((res) => res, handle401);

export const returnsAPI = {
    list:         (qs = '')       => returnsApi.get(`/${qs ? '?' + qs : ''}`),
    summary:      ()              => returnsApi.get('/summary'),
    getOne:       (id)            => returnsApi.get(`/${id}`),
    initiate:     (data)          => returnsApi.post('/', data),
    updateStatus: (id, data)      => returnsApi.patch(`/${id}/status`, data),
};

// ── Delegation API ────────────────────────────────────────────────────────────
const delegationApi = axios.create({ baseURL: `${API_BASE_URL}/delegation`, headers: { 'Content-Type': 'application/json' } });
delegationApi.interceptors.request.use(attachToken, (err) => Promise.reject(err));
delegationApi.interceptors.response.use((res) => res, handle401);

export const delegationAPI = {
    list:             (qs = '')   => delegationApi.get(`/${qs ? '?' + qs : ''}`),
    mine:             ()          => delegationApi.get('/mine'),
    eligible:         ()          => delegationApi.get('/eligible'),
    create:           (data)      => delegationApi.post('/', data),
    revoke:           (id)        => delegationApi.delete(`/${id}`),
};

// ── Budget API ────────────────────────────────────────────────────────────────
const budgetApi = axios.create({ baseURL: `${API_BASE_URL}/budget`, headers: { 'Content-Type': 'application/json' } });
budgetApi.interceptors.request.use(attachToken, (err) => Promise.reject(err));
budgetApi.interceptors.response.use((res) => res, handle401);

export const budgetAPI = {
    list:   (qs = '')   => budgetApi.get(`/${qs ? '?' + qs : ''}`),
    spend:  (year)      => budgetApi.get(`/spend${year ? '?fiscal_year=' + year : ''}`),
    upsert: (data)      => budgetApi.post('/', data),
    remove: (id)        => budgetApi.delete(`/${id}`),
};
