// src/components/approver/FinanceDashboard.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Box, Paper, Typography, Grid, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, TablePagination, IconButton,
    Tooltip, CircularProgress, Dialog, DialogTitle, DialogContent,
    DialogActions, Button, TextField, Divider, Alert, Avatar,
    Drawer, List, ListItemButton, ListItemIcon, ListItemText, CssBaseline,
    useMediaQuery, useTheme, Badge, Popover,
} from '@mui/material';
import {
    Dashboard as DashboardIcon,
    Inbox as QueueIcon,
    CheckCircle as ApprovedIcon,
    Cancel as RejectedIcon,
    Pending as PendingIcon,
    Visibility as ViewIcon,
    ThumbUp as ApproveIcon,
    ThumbDown as RejectIcon,
    Refresh as RefreshIcon,
    Close as CloseIcon,
    Person as PersonIcon,
    AccountBalance as FinanceIcon,
    Logout as LogoutIcon,
    KeyboardArrowUp as ArrowUpIcon,
    AccessTime as TimeIcon,
    ChevronLeft as ChevronLeftIcon,
    Search as SearchIcon,
    TrendingUp as TrendingUpIcon,
    Notifications as BellIcon,
    NotificationsNone as BellEmptyIcon,
    Lock as LockIcon,
    Visibility as EyeIcon,
    VisibilityOff as EyeOffIcon,
    AccountCircle as ProfileIcon,
    MarkEmailRead as MarkReadIcon,
} from '@mui/icons-material';
import { approverAPI } from '../../services/approverApi';
import { useToast } from '../../hooks/useToast';

/* ── Design tokens ── */
const T = {
    bg:           '#F8F9FC',
    surface:      '#FFFFFF',
    border:       '#E8ECF4',
    text:         '#0F1F3D',
    muted:        '#6B7A99',
    accent:       '#1E4FD8',
    accentSoft:   '#EBF0FF',
    green:        '#059669',
    greenSoft:    '#D1FAE5',
    amber:        '#D97706',
    amberSoft:    '#FEF3C7',
    rose:         '#DC2626',
    roseSoft:     '#FEE2E2',
    purple:       '#7C3AED',
    purpleSoft:   '#EDE9FE',
    finance:      '#059669',
    financeSoft:  '#D1FAE5',
    financeDark:  '#047857',
};

const drawerWidth = 240;

const globalStyles = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
*, *::before, *::after { font-family: 'Plus Jakarta Sans', sans-serif; box-sizing: border-box; }
.mono { font-family: 'JetBrains Mono', monospace !important; }
@keyframes fadeUp   { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:none; } }
@keyframes slideIn  { from { opacity:0; transform:translateX(-10px); } to { opacity:1; transform:none; } }
@keyframes dotPulse { 0%,100%{opacity:1;transform:scale(1);} 50%{opacity:.5;transform:scale(.8);} }
`;

const fmtDate = (d) => {
    if (!d) return '—';
    try { return new Date(d).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' }); }
    catch { return '—'; }
};
const fmtDateTime = (d) => {
    if (!d) return '—';
    try { return new Date(d).toLocaleString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); }
    catch { return '—'; }
};
const fmtR = (n) => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', minimumFractionDigits: 2 }).format(n || 0);

const LiveDot = ({ color = T.finance }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7 }}>
        <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: color, animation: 'dotPulse 2s ease-in-out infinite' }} />
        <Typography sx={{ fontSize: '0.67rem', fontWeight: 700, color, letterSpacing: 1, textTransform: 'uppercase' }}>Live</Typography>
    </Box>
);

const StatCard = ({ label, value, sub, icon: Icon, color, soft, delay = 0 }) => (
    <Box sx={{ animation: `fadeUp 0.5s ease-out ${delay}s both` }}>
        <Paper elevation={0} sx={{
            p: 2.8, borderRadius: '14px', bgcolor: T.surface, border: `1px solid ${T.border}`,
            position: 'relative', overflow: 'hidden',
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': { transform: 'translateY(-3px)', boxShadow: `0 12px 32px ${color}22`, borderColor: `${color}44` },
        }}>
            <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, bgcolor: color, borderRadius: '14px 14px 0 0' }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mt: 0.5 }}>
                <Box>
                    <Typography sx={{ fontSize: '0.67rem', fontWeight: 700, color: T.muted, letterSpacing: 1, textTransform: 'uppercase', mb: 1.2 }}>{label}</Typography>
                    <Typography className="mono" sx={{ fontSize: '2.4rem', fontWeight: 500, lineHeight: 1, color, mb: 0.8 }}>{value ?? 0}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                        <ArrowUpIcon sx={{ fontSize: 13, color }} />
                        <Typography sx={{ fontSize: '0.7rem', color: T.muted }}>{sub}</Typography>
                    </Box>
                </Box>
                <Box sx={{ p: 1.3, borderRadius: '12px', bgcolor: soft }}><Icon sx={{ fontSize: 22, color }} /></Box>
            </Box>
        </Paper>
    </Box>
);

const StatusChip = ({ status }) => {
    const cfg = {
        Pending_Finance: { color: T.amber,   soft: T.amberSoft,   icon: PendingIcon  },
        Approved:        { color: T.green,   soft: T.greenSoft,   icon: ApprovedIcon },
        Rejected:        { color: T.rose,    soft: T.roseSoft,    icon: RejectedIcon },
    }[status] || { color: T.muted, soft: '#F1F5F9', icon: PendingIcon };
    const Icon = cfg.icon;
    return (
        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.7, px: 1.2, py: 0.4, borderRadius: '20px', bgcolor: cfg.soft, border: `1px solid ${cfg.color}28` }}>
            <Icon sx={{ fontSize: 11, color: cfg.color }} />
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: cfg.color }}>{status?.replace('_', ' ')}</Typography>
        </Box>
    );
};

const InfoRow = ({ label, value, mono = false }) => (
    <Box sx={{ display: 'flex', py: 1.2, borderBottom: `1px solid ${T.border}`, '&:last-child': { borderBottom: 'none' } }}>
        <Typography sx={{ fontSize: '0.76rem', fontWeight: 600, color: T.muted, width: 180, flexShrink: 0 }}>{label}</Typography>
        <Typography className={mono ? 'mono' : ''} sx={{ fontSize: '0.83rem', color: T.text, fontWeight: 500 }}>{value || '—'}</Typography>
    </Box>
);

// ── Notification Bell (identical pattern to ManagerDashboard) ─────────────────
const NotificationBell = ({ userId }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount,   setUnreadCount]   = useState(0);
    const [anchorEl,      setAnchorEl]      = useState(null);
    const [loading,       setLoading]       = useState(false);
    const intervalRef = useRef(null);

    const fetchUnread = useCallback(async () => {
        try {
            const res = await approverAPI.getUnreadCount(userId);
            setUnreadCount(res.data?.unreadCount || 0);
        } catch { /* silent */ }
    }, [userId]);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const res = await approverAPI.getNotifications(userId);
            setNotifications(res.data?.data || []);
            setUnreadCount(0);
        } catch { /* silent */ }
        finally { setLoading(false); }
    };

    useEffect(() => {
        if (!userId) return;
        fetchUnread();
        intervalRef.current = setInterval(fetchUnread, 30000);
        return () => clearInterval(intervalRef.current);
    }, [fetchUnread, userId]);

    const handleOpen = (e) => { setAnchorEl(e.currentTarget); fetchNotifications(); };

    const handleMarkAllRead = async () => {
        try {
            await approverAPI.markAllAsRead(userId);
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch { /* silent */ }
    };

    const handleMarkOne = async (notificationId) => {
        try {
            await approverAPI.markAsRead(notificationId, userId);
            setNotifications(prev => prev.map(n => n.notification_id === notificationId ? { ...n, is_read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch { /* silent */ }
    };

    const open = Boolean(anchorEl);

    return (
        <>
            <IconButton onClick={handleOpen} size="small"
                        sx={{ width: 34, height: 34, borderRadius: '10px', bgcolor: unreadCount > 0 ? T.financeSoft : T.bg, border: `1px solid ${T.border}`, color: unreadCount > 0 ? T.finance : T.muted, '&:hover': { bgcolor: T.financeSoft, borderColor: T.finance } }}>
                <Badge badgeContent={unreadCount > 0 ? (unreadCount > 99 ? '99+' : unreadCount) : null}
                       sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem', minWidth: 16, height: 16, bgcolor: T.rose, color: '#fff', fontFamily: 'Plus Jakarta Sans' } }}>
                    {unreadCount > 0 ? <BellIcon sx={{ fontSize: 18 }} /> : <BellEmptyIcon sx={{ fontSize: 18 }} />}
                </Badge>
            </IconButton>

            <Popover open={open} anchorEl={anchorEl} onClose={() => setAnchorEl(null)}
                     anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                     transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                     PaperProps={{ sx: { width: 360, borderRadius: '14px', border: `1px solid ${T.border}`, boxShadow: '0 16px 40px rgba(15,31,61,0.12)', mt: 1 } }}>
                <Box sx={{ px: 2.5, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${T.border}`, bgcolor: T.surface }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: T.text }}>Notifications</Typography>
                    {notifications.some(n => !n.is_read) && (
                        <Button size="small" startIcon={<MarkReadIcon sx={{ fontSize: 14 }} />} onClick={handleMarkAllRead}
                                sx={{ textTransform: 'none', fontSize: '0.75rem', color: T.finance, fontFamily: 'Plus Jakarta Sans', borderRadius: '8px', px: 1.5, '&:hover': { bgcolor: T.financeSoft } }}>
                            Mark all read
                        </Button>
                    )}
                </Box>
                <Box sx={{ maxHeight: 380, overflowY: 'auto' }}>
                    {loading ? (
                        <Box sx={{ py: 4, display: 'flex', justifyContent: 'center' }}><CircularProgress size={24} sx={{ color: T.finance }} /></Box>
                    ) : notifications.length === 0 ? (
                        <Box sx={{ py: 5, textAlign: 'center' }}>
                            <BellEmptyIcon sx={{ fontSize: 36, color: T.border, mb: 1 }} />
                            <Typography sx={{ fontSize: '0.82rem', color: T.muted }}>No notifications yet</Typography>
                        </Box>
                    ) : (
                        notifications.map((n) => (
                            <Box key={n.notification_id}
                                 onClick={() => !n.is_read && handleMarkOne(n.notification_id)}
                                 sx={{ px: 2.5, py: 1.8, borderBottom: `1px solid ${T.border}`, bgcolor: n.is_read ? T.surface : T.financeSoft, cursor: n.is_read ? 'default' : 'pointer',
                                     '&:hover': { bgcolor: T.bg }, '&:last-child': { borderBottom: 'none' } }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography sx={{ fontSize: '0.82rem', fontWeight: n.is_read ? 500 : 700, color: T.text, mb: 0.3 }}>{n.title}</Typography>
                                        <Typography sx={{ fontSize: '0.75rem', color: T.muted, lineHeight: 1.5 }}>{n.message}</Typography>
                                    </Box>
                                    {!n.is_read && <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: T.finance, flexShrink: 0, mt: 0.5 }} />}
                                </Box>
                                <Typography sx={{ fontSize: '0.68rem', color: T.muted, mt: 0.5 }}>{fmtDateTime(n.created_at)}</Typography>
                            </Box>
                        ))
                    )}
                </Box>
            </Popover>
        </>
    );
};

// ── Profile / Change Password ─────────────────────────────────────────────────
const ProfileView = ({ user }) => {
    const { success, error: toastError } = useToast();
    const [current, setCurrent] = useState('');
    const [newPass, setNewPass] = useState('');
    const [confirm, setConfirm] = useState('');
    const [showCur, setShowCur] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showCon, setShowCon] = useState(false);
    const [saving,  setSaving]  = useState(false);
    const [err,     setErr]     = useState('');

    const handleSave = async () => {
        setErr('');
        if (!current || !newPass || !confirm) { setErr('All fields are required.'); return; }
        if (newPass !== confirm) { setErr('New password and confirmation do not match.'); return; }
        if (newPass.length < 8) { setErr('New password must be at least 8 characters.'); return; }
        setSaving(true);
        try {
            await approverAPI.changePassword(user.op_user_id, current, newPass, confirm);
            success('Password changed successfully.', 'Password Updated');
            setCurrent(''); setNewPass(''); setConfirm('');
        } catch (e) {
            const msg = e.response?.data?.message || 'Failed to change password.';
            setErr(msg);
            toastError(msg, 'Error');
        } finally {
            setSaving(false);
        }
    };

    const PasswordField = ({ label, value, onChange, show, onToggle }) => (
        <Box sx={{ mb: 2 }}>
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: 0.8, mb: 0.8 }}>{label}</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', borderRadius: '10px', border: `1px solid ${T.border}`, bgcolor: T.surface, overflow: 'hidden', '&:focus-within': { borderColor: T.finance } }}>
                <input type={show ? 'text' : 'password'} value={value} onChange={e => onChange(e.target.value)}
                       style={{ flex: 1, border: 'none', outline: 'none', padding: '10px 14px', fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '0.85rem', color: T.text, background: 'transparent' }} />
                <IconButton size="small" onClick={onToggle} sx={{ mr: 0.5, color: T.muted }}>
                    {show ? <EyeOffIcon sx={{ fontSize: 18 }} /> : <EyeIcon sx={{ fontSize: 18 }} />}
                </IconButton>
            </Box>
        </Box>
    );

    return (
        <Box>
            <Typography sx={{ fontSize: '1.7rem', fontWeight: 800, color: T.text, mb: 0.5 }}>My Profile</Typography>
            <Typography sx={{ fontSize: '0.78rem', color: T.muted, mb: 3 }}>Manage your account settings</Typography>
            <Grid container spacing={2.5}>
                <Grid item xs={12} md={5}>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: '14px', border: `1px solid ${T.border}`, bgcolor: T.surface }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2.5, pb: 2.5, borderBottom: `1px solid ${T.border}` }}>
                            <Avatar sx={{ width: 52, height: 52, bgcolor: T.financeSoft, color: T.finance, fontSize: '1.2rem', fontWeight: 700 }}>
                                {user.first_name?.[0]}{user.last_name?.[0]}
                            </Avatar>
                            <Box>
                                <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: T.text }}>{user.first_name} {user.last_name}</Typography>
                                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.6, px: 1.2, py: 0.3, borderRadius: '20px', bgcolor: T.financeSoft, border: `1px solid ${T.finance}22`, mt: 0.3 }}>
                                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: T.finance }}>Finance · Approver 2</Typography>
                                </Box>
                            </Box>
                        </Box>
                        {[
                            { label: 'Email',   value: user.email || '—' },
                            { label: 'User ID', value: `#${user.op_user_id}` },
                            { label: 'Role',    value: user.user_role || 'Finance' },
                        ].map(({ label, value }) => (
                            <Box key={label} sx={{ display: 'flex', py: 1.2, borderBottom: `1px solid ${T.border}`, '&:last-child': { borderBottom: 'none' } }}>
                                <Typography sx={{ fontSize: '0.76rem', fontWeight: 600, color: T.muted, width: 80, flexShrink: 0 }}>{label}</Typography>
                                <Typography className={label === 'User ID' ? 'mono' : ''} sx={{ fontSize: '0.83rem', color: T.text }}>{value}</Typography>
                            </Box>
                        ))}
                    </Paper>
                </Grid>
                <Grid item xs={12} md={7}>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: '14px', border: `1px solid ${T.border}`, bgcolor: T.surface }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 2.5, pb: 1.5, borderBottom: `1px solid ${T.border}` }}>
                            <Box sx={{ width: 30, height: 30, borderRadius: '9px', bgcolor: T.amberSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <LockIcon sx={{ fontSize: 16, color: T.amber }} />
                            </Box>
                            <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: T.text }}>Change Password</Typography>
                        </Box>
                        {err && (
                            <Box sx={{ mb: 2, px: 2, py: 1.5, borderRadius: '10px', bgcolor: T.roseSoft, border: `1px solid ${T.rose}28` }}>
                                <Typography sx={{ fontSize: '0.82rem', color: T.rose, fontWeight: 600 }}>{err}</Typography>
                            </Box>
                        )}
                        <PasswordField label="Current Password"      value={current} onChange={setCurrent} show={showCur} onToggle={() => setShowCur(p => !p)} />
                        <PasswordField label="New Password"          value={newPass} onChange={setNewPass} show={showNew} onToggle={() => setShowNew(p => !p)} />
                        <PasswordField label="Confirm New Password"  value={confirm} onChange={setConfirm} show={showCon} onToggle={() => setShowCon(p => !p)} />
                        <Box sx={{ mt: 1 }}>
                            <Typography sx={{ fontSize: '0.72rem', color: T.muted, mb: 2 }}>Password must be at least 8 characters and different from your current password.</Typography>
                            <Button onClick={handleSave} disabled={saving} variant="contained"
                                    sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, fontFamily: 'Plus Jakarta Sans', fontSize: '0.85rem', px: 3, boxShadow: 'none', bgcolor: T.finance, '&:hover': { bgcolor: T.financeDark, boxShadow: `0 4px 14px ${T.finance}44` }, '&.Mui-disabled': { bgcolor: T.border, color: T.muted } }}>
                                {saving ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : 'Update Password'}
                            </Button>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

/* ── Finance Application Detail Dialog ── */
const FinanceDetailDialog = ({ open, app, onClose, onApprove, onReject, submitting }) => {
    const [notes,     setNotes]    = useState('');
    const [rejReason, setRejReason]= useState('');
    const [view,      setView]     = useState('detail');

    useEffect(() => { if (open) { setView('detail'); setNotes(''); setRejReason(''); } }, [open]);

    if (!app) return null;
    const totalValue = (app.monthly_cost || 0) * (app.contract_duration_months || 0);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth
                PaperProps={{ sx: { borderRadius: '16px', border: `1px solid ${T.border}`, boxShadow: '0 24px 60px rgba(15,31,61,0.14)', bgcolor: T.bg } }}>
            <DialogTitle sx={{ p: 0 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 3, py: 2.2, bgcolor: T.surface, borderBottom: `1px solid ${T.border}` }}>
                    <Box>
                        <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: T.text }}>Financial Review — Application #{app.application_id}</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.4 }}>
                            <StatusChip status={app.application_status} />
                            <Typography sx={{ fontSize: '0.72rem', color: T.muted }}>Submitted {fmtDate(app.submission_date)}</Typography>
                        </Box>
                    </Box>
                    <IconButton onClick={onClose} size="small" sx={{ color: T.muted, '&:hover': { bgcolor: T.roseSoft, color: T.rose } }}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </Box>
            </DialogTitle>

            <DialogContent sx={{ p: 3 }}>
                {view === 'detail' && (
                    <Grid container spacing={2.5}>
                        {/* Budget Summary */}
                        <Grid item xs={12}>
                            <Paper elevation={0} sx={{ p: 2.5, borderRadius: '12px', border: `1px solid ${T.finance}33`, bgcolor: T.financeSoft }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 2 }}>
                                    <Box sx={{ width: 30, height: 30, borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: T.finance + '22' }}>
                                        <FinanceIcon sx={{ fontSize: 16, color: T.finance }} />
                                    </Box>
                                    <Typography sx={{ fontWeight: 700, fontSize: '0.88rem', color: T.text }}>Budget Summary</Typography>
                                </Box>
                                <Grid container spacing={2}>
                                    {[
                                        { label: 'Monthly cost',         value: fmtR(app.monthly_cost) },
                                        { label: 'Contract duration',    value: `${app.contract_duration_months || '—'} months` },
                                        { label: 'Total contract value', value: fmtR(totalValue) },
                                        { label: 'Device',               value: `${app.device_name} (${app.model || '—'})` },
                                    ].map(m => (
                                        <Grid item xs={6} md={3} key={m.label}>
                                            <Box sx={{ p: 1.5, borderRadius: '10px', bgcolor: T.surface, border: `1px solid ${T.border}` }}>
                                                <Typography sx={{ fontSize: '0.67rem', fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: 0.8, mb: 0.5 }}>{m.label}</Typography>
                                                <Typography className="mono" sx={{ fontSize: '1rem', fontWeight: 700, color: T.finance }}>{m.value}</Typography>
                                            </Box>
                                        </Grid>
                                    ))}
                                </Grid>
                            </Paper>
                        </Grid>

                        {/* Applicant */}
                        <Grid item xs={12} md={6}>
                            <Paper elevation={0} sx={{ p: 2.5, borderRadius: '12px', border: `1px solid ${T.border}`, bgcolor: T.surface }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 2, pb: 1.5, borderBottom: `1px solid ${T.border}` }}>
                                    <Box sx={{ width: 30, height: 30, borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: T.accentSoft }}>
                                        <PersonIcon sx={{ fontSize: 16, color: T.accent }} />
                                    </Box>
                                    <Typography sx={{ fontWeight: 700, fontSize: '0.88rem', color: T.text }}>Applicant</Typography>
                                </Box>
                                <InfoRow label="Full name"  value={`${app.applicant_title || ''} ${app.applicant_first_name} ${app.applicant_last_name}`} />
                                <InfoRow label="Persal ID"  value={app.persal_id} />
                                <InfoRow label="Department" value={app.department_id} />
                                <InfoRow label="Region"     value={app.applicant_region} />
                                <InfoRow label="User type"  value={app.applicant_type} />
                            </Paper>
                        </Grid>

                        {/* Manager approval */}
                        <Grid item xs={12} md={6}>
                            <Paper elevation={0} sx={{ p: 2.5, borderRadius: '12px', border: `1px solid ${T.border}`, bgcolor: T.surface }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 2, pb: 1.5, borderBottom: `1px solid ${T.border}` }}>
                                    <Box sx={{ width: 30, height: 30, borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: T.greenSoft }}>
                                        <ApprovedIcon sx={{ fontSize: 16, color: T.green }} />
                                    </Box>
                                    <Typography sx={{ fontWeight: 700, fontSize: '0.88rem', color: T.text }}>Manager Approval</Typography>
                                </Box>
                                <InfoRow label="Approved by"   value={`${app.manager_first_name || '—'} ${app.manager_last_name || ''}`} />
                                <InfoRow label="Manager notes" value={app.manager_notes} />
                                <InfoRow label="Days waiting"  value={`${app.days_waiting || 0} days since submission`} />
                            </Paper>
                        </Grid>

                        {/* Approval trail */}
                        {app.approval_history?.length > 0 && (
                            <Grid item xs={12}>
                                <Paper elevation={0} sx={{ p: 2.5, borderRadius: '12px', border: `1px solid ${T.border}`, bgcolor: T.surface }}>
                                    <Typography sx={{ fontWeight: 700, fontSize: '0.88rem', color: T.text, mb: 1.5 }}>Approval trail</Typography>
                                    {app.approval_history.map((h, i) => (
                                        <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1, borderBottom: i < app.approval_history.length - 1 ? `1px solid ${T.border}` : 'none' }}>
                                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: h.approval_status === 'Approved' ? T.green : T.rose, flexShrink: 0 }} />
                                            <Typography sx={{ fontSize: '0.8rem', color: T.text, fontWeight: 600 }}>{h.approval_stage?.toUpperCase()} — {h.approval_status}</Typography>
                                            <Typography sx={{ fontSize: '0.76rem', color: T.muted }}>by {h.approver_first_name} {h.approver_last_name} ({h.approver_role})</Typography>
                                            <Typography sx={{ fontSize: '0.72rem', color: T.muted, ml: 'auto' }}>{fmtDate(h.approval_date)}</Typography>
                                        </Box>
                                    ))}
                                </Paper>
                            </Grid>
                        )}
                    </Grid>
                )}

                {view === 'approve' && (
                    <Box sx={{ py: 1 }}>
                        <Alert severity="success" sx={{ mb: 2.5, borderRadius: '10px', fontSize: '0.82rem' }}>
                            You are giving <strong>final financial approval</strong> to Application #{app.application_id} for <strong>{app.applicant_first_name} {app.applicant_last_name}</strong> — {app.device_name} ({fmtR(app.monthly_cost)}/month · {fmtR(totalValue)} total). The Admin will be notified to place the MTN order.
                        </Alert>
                        <Typography sx={{ fontSize: '0.76rem', fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: 0.8, mb: 0.8 }}>Budget notes (optional)</Typography>
                        <TextField fullWidth multiline rows={3} placeholder="e.g. Budget code DOJ-2026-Q2. Approved within allocation."
                                   value={notes} onChange={e => setNotes(e.target.value)}
                                   sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', fontSize: '0.85rem' } }} />
                    </Box>
                )}

                {view === 'reject' && (
                    <Box sx={{ py: 1 }}>
                        <Alert severity="warning" sx={{ mb: 2.5, borderRadius: '10px', fontSize: '0.82rem' }}>
                            You are rejecting Application #{app.application_id} at the finance stage. The applicant and the approving manager will both be notified.
                        </Alert>
                        <Typography sx={{ fontSize: '0.76rem', fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: 0.8, mb: 0.8 }}>
                            Rejection reason <span style={{ color: T.rose }}>*</span>
                        </Typography>
                        <TextField fullWidth multiline rows={3} placeholder="e.g. Q2 budget exhausted for this department. Reapply in Q3."
                                   value={rejReason} onChange={e => setRejReason(e.target.value)}
                                   sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', fontSize: '0.85rem' } }} />
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2, bgcolor: T.surface, borderTop: `1px solid ${T.border}`, gap: 1 }}>
                {view === 'detail' && (
                    <>
                        <Button onClick={onClose} sx={{ color: T.muted, textTransform: 'none', fontFamily: 'Plus Jakarta Sans', borderRadius: '10px' }}>Close</Button>
                        <Button onClick={() => setView('reject')} variant="outlined"
                                sx={{ borderRadius: '10px', textTransform: 'none', fontFamily: 'Plus Jakarta Sans', fontWeight: 600, color: T.rose, borderColor: T.rose, '&:hover': { bgcolor: T.roseSoft } }}>
                            Reject
                        </Button>
                        <Button onClick={() => setView('approve')} variant="contained"
                                sx={{ borderRadius: '10px', textTransform: 'none', fontFamily: 'Plus Jakarta Sans', fontWeight: 700, bgcolor: T.finance, '&:hover': { bgcolor: T.financeDark }, boxShadow: `0 4px 14px ${T.finance}44` }}>
                            Final Approval
                        </Button>
                    </>
                )}
                {view === 'approve' && (
                    <>
                        <Button onClick={() => setView('detail')} sx={{ color: T.muted, textTransform: 'none', fontFamily: 'Plus Jakarta Sans', borderRadius: '10px' }}>Back</Button>
                        <Button onClick={() => onApprove(app.application_id, notes)} disabled={submitting} variant="contained"
                                sx={{ borderRadius: '10px', textTransform: 'none', fontFamily: 'Plus Jakarta Sans', fontWeight: 700, bgcolor: T.finance, '&:hover': { bgcolor: T.financeDark }, minWidth: 160 }}>
                            {submitting ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : 'Confirm Final Approval'}
                        </Button>
                    </>
                )}
                {view === 'reject' && (
                    <>
                        <Button onClick={() => setView('detail')} sx={{ color: T.muted, textTransform: 'none', fontFamily: 'Plus Jakarta Sans', borderRadius: '10px' }}>Back</Button>
                        <Button onClick={() => onReject(app.application_id, rejReason)} disabled={submitting || !rejReason.trim()} variant="contained"
                                sx={{ borderRadius: '10px', textTransform: 'none', fontFamily: 'Plus Jakarta Sans', fontWeight: 700, bgcolor: T.rose, '&:hover': { bgcolor: '#B91C1C' }, minWidth: 140 }}>
                            {submitting ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : 'Confirm Rejection'}
                        </Button>
                    </>
                )}
            </DialogActions>
        </Dialog>
    );
};

/* ── Finance Sidebar ── */
const FinanceSidebar = ({ mobileOpen, onClose, activeView, setActiveView }) => {
    const theme    = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const user     = JSON.parse(localStorage.getItem('adminUser') || '{}');

    const nav = [
        { id: 'queue',   label: 'Finance Queue',  icon: <QueueIcon /> },
        { id: 'stats',   label: 'My Statistics',  icon: <DashboardIcon /> },
        { id: 'profile', label: 'My Profile',     icon: <ProfileIcon /> },
    ];

    const drawerContent = (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: T.surface }}>
            <Box sx={{ px: 3, py: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${T.border}` }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                    <Box sx={{ width: 34, height: 34, borderRadius: '10px', bgcolor: T.finance, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 12px ${T.finance}44` }}>
                        <FinanceIcon sx={{ fontSize: 18, color: '#fff' }} />
                    </Box>
                    <Box>
                        <Typography sx={{ fontSize: '0.95rem', fontWeight: 800, color: T.text, lineHeight: 1.1 }}>Judicial</Typography>
                        <Typography sx={{ fontSize: '0.68rem', fontWeight: 600, color: T.muted, letterSpacing: 0.5 }}>Finance Portal</Typography>
                    </Box>
                </Box>
                {isMobile && <IconButton onClick={onClose} size="small" sx={{ color: T.muted }}><ChevronLeftIcon fontSize="small" /></IconButton>}
            </Box>
            <Box sx={{ px: 2, py: 2.5, flex: 1 }}>
                <Typography sx={{ fontSize: '0.67rem', fontWeight: 700, color: T.muted, letterSpacing: 1.2, textTransform: 'uppercase', px: 1.5, mb: 1 }}>Navigation</Typography>
                <List disablePadding>
                    {nav.map((item, i) => {
                        const active = activeView === item.id;
                        return (
                            <ListItemButton key={item.id} onClick={() => { setActiveView(item.id); if (isMobile) onClose(); }}
                                            sx={{ borderRadius: '10px', mb: 0.5, px: 1.5, py: 1, animation: `slideIn 0.4s ease-out ${i * 0.05}s both`, transition: 'all 0.18s ease',
                                                bgcolor: active ? T.financeSoft : 'transparent',
                                                '&:hover': { bgcolor: active ? T.financeSoft : T.bg, transform: 'translateX(3px)' } }}>
                                <ListItemIcon sx={{ minWidth: 36 }}>{React.cloneElement(item.icon, { sx: { fontSize: 19, color: active ? T.finance : T.muted } })}</ListItemIcon>
                                <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: '0.855rem', fontWeight: active ? 700 : 500, color: active ? T.finance : T.text, fontFamily: 'Plus Jakarta Sans' }} />
                                {active && <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: T.finance, animation: 'dotPulse 2s ease-in-out infinite' }} />}
                            </ListItemButton>
                        );
                    })}
                </List>
            </Box>
            <Box sx={{ px: 2, pb: 2.5 }}>
                <Divider sx={{ borderColor: T.border, mb: 2 }} />
                <Box sx={{ px: 2, py: 1.5, borderRadius: '10px', bgcolor: T.bg, border: `1px solid ${T.border}`, mb: 1.5 }}>
                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: T.text }}>{user.first_name} {user.last_name}</Typography>
                    <Typography sx={{ fontSize: '0.7rem', color: T.finance, fontWeight: 600 }}>Finance · Approver 2</Typography>
                </Box>
                <ListItemButton onClick={() => { localStorage.clear(); window.location.href = '/login'; }}
                                sx={{ borderRadius: '10px', px: 1.5, py: 1, '&:hover': { bgcolor: T.roseSoft } }}>
                    <ListItemIcon sx={{ minWidth: 36 }}><LogoutIcon sx={{ fontSize: 18, color: T.rose }} /></ListItemIcon>
                    <ListItemText primary="Sign out" primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 600, color: T.rose }} />
                </ListItemButton>
            </Box>
        </Box>
    );

    return (
        <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
            {isMobile ? (
                <Drawer variant="temporary" open={mobileOpen} onClose={onClose} ModalProps={{ keepMounted: true }}
                        sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box', bgcolor: T.surface, borderRight: `1px solid ${T.border}` } }}>
                    {drawerContent}
                </Drawer>
            ) : (
                <Drawer variant="permanent" open sx={{ display: { xs: 'none', sm: 'block' }, '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box', bgcolor: T.surface, borderRight: `1px solid ${T.border}` } }}>
                    {drawerContent}
                </Drawer>
            )}
        </Box>
    );
};

/* ══════════════════ MAIN DASHBOARD ══════════════════ */
const FinanceDashboard = () => {
    const { success, error: toastError, warning } = useToast();

    const [queue,      setQueue]      = useState([]);
    const [stats,      setStats]      = useState(null);
    const [loading,    setLoading]    = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [detailApp,  setDetailApp]  = useState(null);
    const [page,       setPage]       = useState(0);
    const [rowsPerPage,setRowsPerPage]= useState(10);
    const [search,     setSearch]     = useState('');
    const [mobileOpen, setMobileOpen] = useState(false);
    const [activeView, setActiveView] = useState('queue');

    const user = JSON.parse(localStorage.getItem('adminUser') || '{}');

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [qRes, sRes] = await Promise.all([
                approverAPI.getFinanceQueue(),
                approverAPI.getFinanceStats(user.op_user_id),
            ]);
            setQueue(qRes.data?.data?.applications || []);
            setStats(sRes.data?.data?.stats || null);
        } catch (err) {
            toastError(err.response?.data?.message || 'Failed to load queue', 'Load Error');
        } finally {
            setLoading(false);
        }
    }, [toastError, user.op_user_id]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const filtered = queue.filter(a => {
        if (!search) return true;
        const s = search.toLowerCase();
        return (
            `${a.applicant_first_name} ${a.applicant_last_name}`.toLowerCase().includes(s) ||
            a.persal_id?.toLowerCase().includes(s) ||
            a.device_name?.toLowerCase().includes(s) ||
            a.applicant_region?.toLowerCase().includes(s) ||
            `${a.manager_first_name} ${a.manager_last_name}`.toLowerCase().includes(s)
        );
    });

    const totalBudgetInQueue = filtered.reduce((sum, a) => sum + ((a.monthly_cost || 0) * (a.contract_duration_months || 0)), 0);

    const handleApprove = async (id, notes) => {
        setSubmitting(true);
        try {
            await approverAPI.financeApprove(id, { notes }, user.op_user_id);
            success(`Application #${id} has been fully approved. Admin notified.`, 'Final Approval Granted');
            setDetailApp(null);
            await fetchData();
        } catch (err) {
            toastError(err.response?.data?.message || 'Failed to approve', 'Error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleReject = async (id, rejection_reason) => {
        if (!rejection_reason?.trim()) { warning('Rejection reason is required.'); return; }
        setSubmitting(true);
        try {
            await approverAPI.financeReject(id, { rejection_reason }, user.op_user_id);
            success(`Application #${id} has been rejected at the finance stage.`, 'Rejected');
            setDetailApp(null);
            await fetchData();
        } catch (err) {
            toastError(err.response?.data?.message || 'Failed to reject', 'Error');
        } finally {
            setSubmitting(false);
        }
    };

    const QueueView = () => (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, animation: 'fadeUp 0.4s ease-out' }}>
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.3 }}>
                        <Typography sx={{ fontSize: { xs: '1.4rem', md: '1.7rem' }, fontWeight: 800, color: T.text, letterSpacing: '-0.3px' }}>Finance Queue</Typography>
                        <LiveDot />
                    </Box>
                    <Typography sx={{ fontSize: '0.78rem', color: T.muted }}>Applications approved by managers · awaiting financial review</Typography>
                </Box>
                <Button onClick={fetchData} variant="outlined" startIcon={<RefreshIcon sx={{ fontSize: '16px !important' }} />}
                        sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, fontFamily: 'Plus Jakarta Sans', fontSize: '0.81rem', color: T.finance, borderColor: T.border, bgcolor: T.surface, px: 2.5, py: 1, '&:hover': { bgcolor: T.financeSoft, borderColor: T.finance } }}>
                    Refresh
                </Button>
            </Box>

            {stats && (
                <Grid container spacing={2.5} sx={{ mb: 3 }}>
                    {[
                        { label: 'Awaiting review',   value: stats.pending_in_queue,       sub: 'In finance queue',    color: T.amber,   soft: T.amberSoft,   icon: PendingIcon,  delay: 0    },
                        { label: 'Fully approved',    value: stats.total_approved,          sub: 'By you, all time',   color: T.finance, soft: T.financeSoft, icon: ApprovedIcon, delay: 0.07 },
                        { label: 'Rejected',          value: stats.total_rejected,          sub: 'By you, all time',   color: T.rose,    soft: T.roseSoft,    icon: RejectedIcon, delay: 0.14 },
                        { label: 'Avg decision time', value: `${stats.avg_decision_days}d`, sub: 'Days per decision',  color: T.purple,  soft: T.purpleSoft,  icon: TimeIcon,     delay: 0.21 },
                    ].map(s => (
                        <Grid item xs={6} md={3} key={s.label}><StatCard {...s} /></Grid>
                    ))}
                </Grid>
            )}

            {filtered.length > 0 && (
                <Paper elevation={0} sx={{ p: 2, mb: 2.5, borderRadius: '12px', border: `1px solid ${T.finance}33`, bgcolor: T.financeSoft, display: 'flex', alignItems: 'center', gap: 2, animation: 'fadeUp 0.4s ease-out 0.1s both' }}>
                    <TrendingUpIcon sx={{ fontSize: 22, color: T.finance }} />
                    <Box>
                        <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: T.finance, textTransform: 'uppercase', letterSpacing: 0.8 }}>Total budget value in queue</Typography>
                        <Typography className="mono" sx={{ fontSize: '1.4rem', fontWeight: 700, color: T.finance }}>{fmtR(totalBudgetInQueue)}</Typography>
                    </Box>
                    <Typography sx={{ fontSize: '0.76rem', color: T.muted, ml: 'auto' }}>{filtered.length} application{filtered.length !== 1 ? 's' : ''}</Typography>
                </Paper>
            )}

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5, p: 1.5, bgcolor: T.surface, borderRadius: '12px', border: `1px solid ${T.border}` }}>
                <SearchIcon sx={{ fontSize: 18, color: T.muted, flexShrink: 0 }} />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, persal ID, device, region, manager…"
                       style={{ border: 'none', outline: 'none', background: 'transparent', flex: 1, fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '0.87rem', color: T.text }} />
                {search && <IconButton size="small" onClick={() => setSearch('')} sx={{ color: T.muted }}><CloseIcon fontSize="small" /></IconButton>}
            </Box>

            <Paper elevation={0} sx={{ borderRadius: '14px', border: `1px solid ${T.border}`, overflow: 'hidden', animation: 'fadeUp 0.5s ease-out 0.15s both' }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress size={32} sx={{ color: T.finance }} /></Box>
                ) : filtered.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 8 }}>
                        <FinanceIcon sx={{ fontSize: 48, color: T.border, mb: 1.5 }} />
                        <Typography sx={{ fontWeight: 700, color: T.text, mb: 0.5 }}>Finance queue is empty</Typography>
                        <Typography sx={{ fontSize: '0.83rem', color: T.muted }}>No applications are pending financial review.</Typography>
                    </Box>
                ) : (
                    <>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: T.bg }}>
                                        {['Applicant', 'Region / Dept', 'Device', 'Monthly', 'Total value', 'Manager approved', 'Days waiting', 'Actions'].map(h => (
                                            <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.72rem', color: T.muted, textTransform: 'uppercase', letterSpacing: 0.8, borderBottom: `1px solid ${T.border}`, py: 1.5 }}>{h}</TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((app, i) => (
                                        <TableRow key={app.application_id} sx={{ animation: `fadeUp 0.4s ease-out ${i * 0.04}s both`, '&:hover': { bgcolor: T.bg }, '&:last-child td': { borderBottom: 'none' } }}>
                                            <TableCell sx={{ py: 1.5 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                    <Avatar sx={{ width: 32, height: 32, bgcolor: T.financeSoft, color: T.finance, fontSize: '0.75rem', fontWeight: 700 }}>
                                                        {app.applicant_first_name?.[0]}{app.applicant_last_name?.[0]}
                                                    </Avatar>
                                                    <Box>
                                                        <Typography sx={{ fontSize: '0.83rem', fontWeight: 600, color: T.text }}>{app.applicant_first_name} {app.applicant_last_name}</Typography>
                                                        <Typography sx={{ fontSize: '0.7rem', color: T.muted }}>{app.applicant_type} · {app.persal_id}</Typography>
                                                    </Box>
                                                </Box>
                                            </TableCell>
                                            <TableCell sx={{ py: 1.5 }}>
                                                <Typography sx={{ fontSize: '0.82rem', color: T.text }}>{app.applicant_region || '—'}</Typography>
                                                <Typography sx={{ fontSize: '0.7rem', color: T.muted }}>{app.department_id || '—'}</Typography>
                                            </TableCell>
                                            <TableCell sx={{ py: 1.5 }}>
                                                <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: T.text }}>{app.device_name}</Typography>
                                                <Typography sx={{ fontSize: '0.7rem', color: T.muted }}>{app.model}</Typography>
                                            </TableCell>
                                            <TableCell sx={{ py: 1.5 }}>
                                                <Typography className="mono" sx={{ fontSize: '0.85rem', fontWeight: 700, color: T.finance }}>{fmtR(app.monthly_cost)}</Typography>
                                            </TableCell>
                                            <TableCell sx={{ py: 1.5 }}>
                                                <Typography className="mono" sx={{ fontSize: '0.85rem', fontWeight: 700, color: T.text }}>{fmtR((app.monthly_cost || 0) * (app.contract_duration_months || 0))}</Typography>
                                                <Typography sx={{ fontSize: '0.7rem', color: T.muted }}>{app.contract_duration_months}mo</Typography>
                                            </TableCell>
                                            <TableCell sx={{ py: 1.5 }}>
                                                <Typography sx={{ fontSize: '0.8rem', color: T.text }}>{app.manager_first_name} {app.manager_last_name}</Typography>
                                                {app.manager_notes && <Typography sx={{ fontSize: '0.7rem', color: T.muted, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{app.manager_notes}</Typography>}
                                            </TableCell>
                                            <TableCell sx={{ py: 1.5 }}>
                                                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.6, px: 1, py: 0.4, borderRadius: '8px', bgcolor: (app.days_waiting || 0) > 5 ? T.roseSoft : T.amberSoft }}>
                                                    <TimeIcon sx={{ fontSize: 11, color: (app.days_waiting || 0) > 5 ? T.rose : T.amber }} />
                                                    <Typography className="mono" sx={{ fontSize: '0.75rem', fontWeight: 700, color: (app.days_waiting || 0) > 5 ? T.rose : T.amber }}>{app.days_waiting || 0}d</Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell sx={{ py: 1.5 }}>
                                                <Box sx={{ display: 'flex', gap: 0.8 }}>
                                                    <Tooltip title="View full detail">
                                                        <IconButton size="small" onClick={() => setDetailApp(app)}
                                                                    sx={{ width: 28, height: 28, borderRadius: '8px', bgcolor: T.accentSoft, color: T.accent, '&:hover': { bgcolor: '#DBEAFE' } }}>
                                                            <ViewIcon sx={{ fontSize: 14 }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Grant final approval">
                                                        <IconButton size="small" onClick={() => setDetailApp(app)}
                                                                    sx={{ width: 28, height: 28, borderRadius: '8px', bgcolor: T.financeSoft, color: T.finance, '&:hover': { bgcolor: '#A7F3D0' } }}>
                                                            <ApproveIcon sx={{ fontSize: 14 }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Reject">
                                                        <IconButton size="small" onClick={() => setDetailApp(app)}
                                                                    sx={{ width: 28, height: 28, borderRadius: '8px', bgcolor: T.roseSoft, color: T.rose, '&:hover': { bgcolor: '#FECACA' } }}>
                                                            <RejectIcon sx={{ fontSize: 14 }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        {filtered.length > rowsPerPage && (
                            <TablePagination
                                rowsPerPageOptions={[10, 25, 50]} component="div"
                                count={filtered.length} rowsPerPage={rowsPerPage} page={page}
                                onPageChange={(e, p) => setPage(p)}
                                onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                                sx={{ borderTop: `1px solid ${T.border}`, '& *': { fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '0.8rem' } }}
                            />
                        )}
                    </>
                )}
            </Paper>
        </Box>
    );

    const StatsView = () => (
        <Box>
            <Typography sx={{ fontSize: '1.7rem', fontWeight: 800, color: T.text, mb: 0.5 }}>My Statistics</Typography>
            <Typography sx={{ fontSize: '0.78rem', color: T.muted, mb: 3 }}>Your financial approval performance</Typography>
            {stats ? (
                <Grid container spacing={2.5}>
                    {[
                        { label: 'In finance queue', value: stats.pending_in_queue,       sub: 'Awaiting your review',  color: T.amber,   soft: T.amberSoft,   icon: PendingIcon  },
                        { label: 'Fully approved',   value: stats.total_approved,          sub: 'Final approvals given', color: T.finance, soft: T.financeSoft, icon: ApprovedIcon },
                        { label: 'Rejected',         value: stats.total_rejected,          sub: 'All time',              color: T.rose,    soft: T.roseSoft,    icon: RejectedIcon },
                        { label: 'Avg decision days',value: `${stats.avg_decision_days}`, sub: 'Per application',       color: T.purple,  soft: T.purpleSoft,  icon: TimeIcon     },
                    ].map((s, i) => (
                        <Grid item xs={6} md={3} key={s.label}><StatCard {...s} delay={i * 0.07} /></Grid>
                    ))}
                    <Grid item xs={12}>
                        <Paper elevation={0} sx={{ p: 3, borderRadius: '14px', border: `1px solid ${T.border}`, bgcolor: T.surface }}>
                            <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: T.text, mb: 2 }}>Performance summary</Typography>
                            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                                {[
                                    { label: 'Approval rate',    value: stats.total_approved + stats.total_rejected > 0 ? `${Math.round((stats.total_approved / (stats.total_approved + stats.total_rejected)) * 100)}%` : '—', color: T.finance },
                                    { label: 'Total decisions',  value: stats.total_approved + stats.total_rejected, color: T.accent },
                                    { label: 'Avg days to decide', value: `${stats.avg_decision_days} days`, color: T.purple },
                                ].map(m => (
                                    <Box key={m.label} sx={{ p: 2, borderRadius: '10px', bgcolor: T.bg, border: `1px solid ${T.border}`, minWidth: 160 }}>
                                        <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: 0.8, mb: 0.5 }}>{m.label}</Typography>
                                        <Typography className="mono" sx={{ fontSize: '1.8rem', fontWeight: 600, color: m.color }}>{m.value}</Typography>
                                    </Box>
                                ))}
                            </Box>
                        </Paper>
                    </Grid>
                </Grid>
            ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress sx={{ color: T.finance }} /></Box>
            )}
        </Box>
    );

    return (
        <Box sx={{ display: 'flex', bgcolor: T.bg, minHeight: '100vh' }}>
            <style>{globalStyles}</style>
            <CssBaseline />
            <FinanceSidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} activeView={activeView} setActiveView={setActiveView} />
            <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 3.5 }, width: { sm: `calc(100% - ${drawerWidth}px)` }, minHeight: '100vh' }}>
                {/* Top bar */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, pb: 2, borderBottom: `1px solid ${T.border}` }}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        {[{ id: 'queue', label: 'Finance Queue' }, { id: 'stats', label: 'My Stats' }, { id: 'profile', label: 'Profile' }].map(v => (
                            <Button key={v.id} onClick={() => setActiveView(v.id)} variant={activeView === v.id ? 'contained' : 'outlined'}
                                    sx={{ borderRadius: '10px', textTransform: 'none', fontFamily: 'Plus Jakarta Sans', fontWeight: 600, fontSize: '0.83rem', px: 2,
                                        ...(activeView === v.id ? { bgcolor: T.finance, '&:hover': { bgcolor: T.financeDark } } : { color: T.muted, borderColor: T.border, bgcolor: T.surface, '&:hover': { bgcolor: T.financeSoft, borderColor: T.finance, color: T.finance } }) }}>
                                {v.label}
                            </Button>
                        ))}
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        {/* ── Notification Bell ── */}
                        <NotificationBell userId={user.op_user_id} />

                        <Box sx={{ px: 1.5, py: 0.5, borderRadius: '8px', bgcolor: T.financeSoft, border: `1px solid ${T.finance}22` }}>
                            <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: T.finance }}>Finance · Approver 2</Typography>
                        </Box>
                        <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: T.text }}>{user.first_name} {user.last_name}</Typography>
                    </Box>
                </Box>

                {activeView === 'queue'   && <QueueView />}
                {activeView === 'stats'   && <StatsView />}
                {activeView === 'profile' && <ProfileView user={user} />}
            </Box>

            <FinanceDetailDialog open={!!detailApp} app={detailApp} onClose={() => setDetailApp(null)} onApprove={handleApprove} onReject={handleReject} submitting={submitting} />
        </Box>
    );
};

export default FinanceDashboard;