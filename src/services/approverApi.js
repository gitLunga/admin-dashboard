import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const getToken = () => localStorage.getItem('adminToken');

const attachToken = (config) => {
    const token = getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
};

const handle401 = (error) => {
    if (error.response?.status === 401) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminRefreshToken');
        localStorage.removeItem('adminUser');
        window.location.href = '/login';
    }
    return Promise.reject(error);
};

const approverApi = axios.create({
    baseURL: `${API_BASE_URL}/approver`,
    headers: { 'Content-Type': 'application/json' },
});

const rootApi = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Content-Type': 'application/json' },
});

[approverApi, rootApi].forEach(inst => {
    inst.interceptors.request.use(attachToken, (err) => Promise.reject(err));
    inst.interceptors.response.use((res) => res, handle401);
});

export const approverAPI = {
    // ── Shared ────────────────────────────────────────────────────────────────
    getApplicationDetail:  (id)      => approverApi.get(`/applications/${id}`),
    getApplicationHistory: (id)      => approverApi.get(`/applications/${id}/history`),
    getMyClients:          (qs = '') => approverApi.get(`/my-clients${qs ? '?' + qs : ''}`),

    // ── Manager ───────────────────────────────────────────────────────────────
    // user_id removed from all calls — backend reads actor from JWT
    getManagerQueue:       (qs = '') => approverApi.get(`/manager/queue${qs ? '?' + qs : ''}`),
    getManagerStats:       ()        => approverApi.get('/manager/stats'),
    managerApprove:        (id, data)=> approverApi.post(`/manager/applications/${id}/approve`, data),
    managerReject:         (id, data)=> approverApi.post(`/manager/applications/${id}/reject`, data),

    bulkManagerApprove:    (ids, notes)            =>
        approverApi.post('/manager/bulk-approve', { application_ids: ids, notes }),
    bulkManagerReject:     (ids, rejection_reason) =>
        approverApi.post('/manager/bulk-reject',  { application_ids: ids, rejection_reason }),

    // ── Finance ───────────────────────────────────────────────────────────────
    getFinanceQueue:       (qs = '') => approverApi.get(`/finance/queue${qs ? '?' + qs : ''}`),
    getFinanceStats:       ()        => approverApi.get('/finance/stats'),
    financeApprove:        (id, data)=> approverApi.post(`/finance/applications/${id}/approve`, data),
    financeReject:         (id, data)=> approverApi.post(`/finance/applications/${id}/reject`, data),

    bulkFinanceApprove:    (ids, notes)            =>
        approverApi.post('/finance/bulk-approve', { application_ids: ids, notes }),
    bulkFinanceReject:     (ids, rejection_reason) =>
        approverApi.post('/finance/bulk-reject',  { application_ids: ids, rejection_reason }),

    // ── Notifications — identity from JWT, no user_id params ──────────────────
    getNotifications:      ()    => rootApi.get('/notifications/user'),
    getUnreadCount:        ()    => rootApi.get('/notifications/unread-count'),
    markAsRead:            (id)  => rootApi.patch(`/notifications/${id}/read`),
    markAllAsRead:         ()    => rootApi.patch('/notifications/mark-all-read'),
    deleteNotification:    (id)  => rootApi.delete(`/notifications/${id}`),

    // ── SLA (read-only, available to Manager and Finance) ─────────────────────
    getSlaBreached:        (qs = '') => rootApi.get(`/sla/breached${qs ? '?' + qs : ''}`),
    getSlaApproaching:     (qs = '') => rootApi.get(`/sla/approaching${qs ? '?' + qs : ''}`),
    getSlaDetail:          (id)      => rootApi.get(`/sla/applications/${id}`),

    // ── Password — self-service via auth endpoint ─────────────────────────────
    changePassword: (currentPw, newPw) =>
        rootApi.post('/auth/change-password', {
            current_password: currentPw,
            new_password:     newPw,
        }),

    // ── Documents (for manager document review before approving) ──────────────
    getUserDocuments: (userId) => rootApi.get(`/admin/client-users/${userId}/documents`),
    viewDocument:     (docId)  => rootApi.get(`/admin/documents/${docId}/view`),
    downloadDocument: (docId)  => rootApi.get(`/admin/documents/${docId}/download`),
};

export default approverApi;
