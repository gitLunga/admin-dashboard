// src/services/approverApi.js
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const approverApi = axios.create({
    baseURL: `${API_BASE_URL}/approver`,
    headers: { 'Content-Type': 'application/json' },
});

// Separate instance that hits the root /api prefix (for notifications + admin password)
const rootApi = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Content-Type': 'application/json' },
});

export const approverAPI = {
    // ── Shared ──────────────────────────────────────────────────────────────
    getApplicationDetail:  (id) => approverApi.get(`/applications/${id}`),
    getApplicationHistory: (id) => approverApi.get(`/applications/${id}/history`),

    // ── Manager (Approver 1) ─────────────────────────────────────────────────
    getManagerQueue:  (params = '') => approverApi.get(`/manager/queue${params ? '?' + params : ''}`),
    getManagerStats:  (userId)      => approverApi.get(`/manager/stats?user_id=${userId}`),
    managerApprove:   (id, data, userId) => approverApi.post(`/manager/applications/${id}/approve?user_id=${userId}`, data),
    managerReject:    (id, data, userId) => approverApi.post(`/manager/applications/${id}/reject?user_id=${userId}`, data),

    // ── Finance (Approver 2) ─────────────────────────────────────────────────
    getFinanceQueue:  (params = '') => approverApi.get(`/finance/queue${params ? '?' + params : ''}`),
    getFinanceStats:  (userId)      => approverApi.get(`/finance/stats?user_id=${userId}`),
    financeApprove:   (id, data, userId) => approverApi.post(`/finance/applications/${id}/approve?user_id=${userId}`, data),
    financeReject:    (id, data, userId) => approverApi.post(`/finance/applications/${id}/reject?user_id=${userId}`, data),

    // ── Notifications (Operational users — Manager & Finance) ─────────────────
    // Uses /api/notifications/* which is shared with the admin notification system.
    // user_type is always 'Operational' for approver-role users.
    getNotifications: (userId) =>
        rootApi.get('/notifications/user', { params: { user_id: userId, user_type: 'Operational' } }),

    getUnreadCount: (userId) =>
        rootApi.get('/notifications/unread-count', { params: { user_id: userId, user_type: 'Operational' } }),

    markAsRead: (notificationId, userId) =>
        rootApi.patch(`/notifications/${notificationId}/read`, { user_id: userId, user_type: 'Operational' }),

    markAllAsRead: (userId) =>
        rootApi.patch('/notifications/mark-all-read', { user_id: userId, user_type: 'Operational' }),

    deleteNotification: (notificationId, userId) =>
        rootApi.delete(`/notifications/${notificationId}`, {
            data: { user_id: userId, user_type: 'Operational' }
        }),

    // ── Profile — password change ─────────────────────────────────────────────
    // Hits the same endpoint the admin uses for operational users.
    // Manager / Finance call this with their own op_user_id.
    changePassword: (userId, currentPassword, newPassword, confirmPassword) =>
        rootApi.patch(`/admin/operational-users/${userId}/change-password`, {
            current_password: currentPassword,
            new_password: newPassword,
            confirm_password: confirmPassword,
        }),
};

export default approverApi;