// src/components/approver/ManagerDashboard.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Box, Paper, Typography, Grid, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, TablePagination, IconButton,
    Tooltip, CircularProgress, Dialog, DialogTitle, DialogContent,
    DialogActions, Button, TextField, Divider, Alert, Avatar,
    Drawer, List, ListItemButton, ListItemIcon, ListItemText,
    CssBaseline, useMediaQuery, useTheme, Badge, Popover,
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
    PhoneAndroid as DeviceIcon,

    Logout as LogoutIcon,
    Gavel as GavelIcon,
    KeyboardArrowUp as ArrowUpIcon,
    AccessTime as TimeIcon,
    ChevronLeft as ChevronLeftIcon,
    Search as SearchIcon,
    Notifications as BellIcon,
    NotificationsNone as BellEmptyIcon,
    Description as DocIcon,
    Lock as LockIcon,
    Visibility as EyeIcon,
    VisibilityOff as EyeOffIcon,
    AccountCircle as ProfileIcon,
    MarkEmailRead as MarkReadIcon,
    Edit as EditIcon,
    Public as GlobalIcon,
    Domain as DeptIcon,
} from '@mui/icons-material';
import { approverAPI } from '../../services/approverApi';
import { adminAPI, profileAPI } from '../../services/api';
import { useToast } from '../../hooks/useToast';

/* ── Design tokens ── */
const T = {
    bg:         '#F8F9FC',
    surface:    '#FFFFFF',
    border:     '#E8ECF4',
    text:       '#0F1F3D',
    muted:      '#6B7A99',
    accent:     '#1E4FD8',
    accentSoft: '#EBF0FF',
    green:      '#059669',
    greenSoft:  '#D1FAE5',
    amber:      '#D97706',
    amberSoft:  '#FEF3C7',
    rose:       '#DC2626',
    roseSoft:   '#FEE2E2',
    purple:     '#7C3AED',
    purpleSoft: '#EDE9FE',
    manager:    '#1E4FD8',
    managerSoft:'#EBF0FF',
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

/* ── Sub-components ── */
const LiveDot = () => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7 }}>
        <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: T.green, animation: 'dotPulse 2s ease-in-out infinite' }} />
        <Typography sx={{ fontSize: '0.67rem', fontWeight: 700, color: T.green, letterSpacing: 1, textTransform: 'uppercase' }}>Live</Typography>
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
        Pending:         { color: T.amber,  soft: T.amberSoft,  icon: PendingIcon  },
        Pending_Finance: { color: T.purple, soft: T.purpleSoft, icon: ApprovedIcon },
        Approved:        { color: T.green,  soft: T.greenSoft,  icon: ApprovedIcon },
        Rejected:        { color: T.rose,   soft: T.roseSoft,   icon: RejectedIcon },
        Cancelled:       { color: T.muted,  soft: '#F1F5F9',    icon: RejectedIcon },
    }[status] || { color: T.muted, soft: '#F1F5F9', icon: PendingIcon };
    const Icon = cfg.icon;
    return (
        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.7, px: 1.2, py: 0.4, borderRadius: '20px', bgcolor: cfg.soft, border: `1px solid ${cfg.color}28` }}>
            <Icon sx={{ fontSize: 11, color: cfg.color }} />
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: cfg.color }}>{status?.replace('_', ' ')}</Typography>
        </Box>
    );
};

const InfoRow = ({ label, value }) => (
    <Box sx={{ display: 'flex', py: 1.2, borderBottom: `1px solid ${T.border}`, '&:last-child': { borderBottom: 'none' } }}>
        <Typography sx={{ fontSize: '0.76rem', fontWeight: 600, color: T.muted, width: 160, flexShrink: 0 }}>{label}</Typography>
        <Typography sx={{ fontSize: '0.83rem', color: T.text, fontWeight: 500 }}>{value || '—'}</Typography>
    </Box>
);

// ── Notification Bell ─────────────────────────────────────────────────────────
const NotificationBell = ({ userId }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount]     = useState(0);
    const [anchorEl, setAnchorEl]           = useState(null);
    const [loading, setLoading]             = useState(false);
    const intervalRef = useRef(null);

    const fetchUnread = useCallback(async () => {
        try {
            const res = await approverAPI.getUnreadCount();
            setUnreadCount(res.data?.unreadCount || 0);
        } catch { /* silent */ }
    }, []);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const res = await approverAPI.getNotifications();
            setNotifications(res.data?.data || []);
            setUnreadCount(0);
        } catch { /* silent */ }
        finally { setLoading(false); }
    };

    useEffect(() => {
        if (!userId) return;
        fetchUnread();
        intervalRef.current = setInterval(fetchUnread, 30000); // poll every 30s
        return () => clearInterval(intervalRef.current);
    }, [fetchUnread, userId]);

    const handleOpen = (e) => {
        setAnchorEl(e.currentTarget);
        fetchNotifications();
    };

    const handleMarkAllRead = async () => {
        try {
            await approverAPI.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch { /* silent */ }
    };

    const handleMarkOne = async (notificationId) => {
        try {
            await approverAPI.markAsRead(notificationId);
            setNotifications(prev => prev.map(n => n.notification_id === notificationId ? { ...n, is_read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch { /* silent */ }
    };

    const open = Boolean(anchorEl);

    return (
        <>
            <IconButton onClick={handleOpen} size="small"
                        sx={{ width: 34, height: 34, borderRadius: '10px', bgcolor: unreadCount > 0 ? T.accentSoft : T.bg, border: `1px solid ${T.border}`, color: unreadCount > 0 ? T.accent : T.muted, '&:hover': { bgcolor: T.accentSoft, borderColor: T.accent } }}>
                <Badge badgeContent={unreadCount > 0 ? (unreadCount > 99 ? '99+' : unreadCount) : null}
                       sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem', minWidth: 16, height: 16, bgcolor: T.rose, color: '#fff', fontFamily: 'Plus Jakarta Sans' } }}>
                    {unreadCount > 0 ? <BellIcon sx={{ fontSize: 18 }} /> : <BellEmptyIcon sx={{ fontSize: 18 }} />}
                </Badge>
            </IconButton>

            <Popover open={open} anchorEl={anchorEl} onClose={() => setAnchorEl(null)}
                     anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                     transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                     PaperProps={{ sx: { width: 360, borderRadius: '14px', border: `1px solid ${T.border}`, boxShadow: '0 16px 40px rgba(15,31,61,0.12)', mt: 1 } }}>

                {/* Header */}
                <Box sx={{ px: 2.5, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${T.border}`, bgcolor: T.surface }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: T.text }}>Notifications</Typography>
                    {notifications.some(n => !n.is_read) && (
                        <Button size="small" startIcon={<MarkReadIcon sx={{ fontSize: 14 }} />} onClick={handleMarkAllRead}
                                sx={{ textTransform: 'none', fontSize: '0.75rem', color: T.accent, fontFamily: 'Plus Jakarta Sans', borderRadius: '8px', px: 1.5, '&:hover': { bgcolor: T.accentSoft } }}>
                            Mark all read
                        </Button>
                    )}
                </Box>

                {/* List */}
                <Box sx={{ maxHeight: 380, overflowY: 'auto' }}>
                    {loading ? (
                        <Box sx={{ py: 4, display: 'flex', justifyContent: 'center' }}><CircularProgress size={24} sx={{ color: T.accent }} /></Box>
                    ) : notifications.length === 0 ? (
                        <Box sx={{ py: 5, textAlign: 'center' }}>
                            <BellEmptyIcon sx={{ fontSize: 36, color: T.border, mb: 1 }} />
                            <Typography sx={{ fontSize: '0.82rem', color: T.muted }}>No notifications yet</Typography>
                        </Box>
                    ) : (
                        notifications.map((n) => (
                            <Box key={n.notification_id}
                                 onClick={() => !n.is_read && handleMarkOne(n.notification_id)}
                                 sx={{ px: 2.5, py: 1.8, borderBottom: `1px solid ${T.border}`, bgcolor: n.is_read ? T.surface : T.accentSoft, cursor: n.is_read ? 'default' : 'pointer',
                                     '&:hover': { bgcolor: T.bg }, '&:last-child': { borderBottom: 'none' } }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography sx={{ fontSize: '0.82rem', fontWeight: n.is_read ? 500 : 700, color: T.text, mb: 0.3 }}>{n.title}</Typography>
                                        <Typography sx={{ fontSize: '0.75rem', color: T.muted, lineHeight: 1.5 }}>{n.message}</Typography>
                                    </Box>
                                    {!n.is_read && <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: T.accent, flexShrink: 0, mt: 0.5 }} />}
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

// ── Profile / Change Password View ────────────────────────────────────────────
const ProfileView = ({ user: initialUser }) => {
    const { success, error: toastError } = useToast();

    // ── Personal info state ──────────────────────────────────────────
    const [profile,  setProfile]  = useState(null);
    const [editing,  setEditing]  = useState(false);
    const [form,     setForm]     = useState({ title: '', first_name: '', last_name: '', email: '' });
    const [savingInfo, setSavingInfo] = useState(false);

    // ── Password state ───────────────────────────────────────────────
    const [current,  setCurrent]  = useState('');
    const [newPass,  setNewPass]  = useState('');
    const [confirm,  setConfirm]  = useState('');
    const [showCur,  setShowCur]  = useState(false);
    const [showNew,  setShowNew]  = useState(false);
    const [showCon,  setShowCon]  = useState(false);
    const [saving,   setSaving]   = useState(false);
    const [err,      setErr]      = useState('');

    useEffect(() => {
        profileAPI.getMe()
            .then(r => {
                const p = r.data?.data || r.data;
                setProfile(p);
                setForm({ title: p.title || '', first_name: p.first_name || '', last_name: p.last_name || '', email: p.email || '' });
            })
            .catch(() => {
                // fallback to passed-in user
                setProfile(initialUser);
                setForm({ title: initialUser.title || '', first_name: initialUser.first_name || '', last_name: initialUser.last_name || '', email: initialUser.email || '' });
            });
    }, [initialUser]);

    const handleSaveInfo = async () => {
        if (!form.first_name || !form.last_name || !form.email) { toastError('Name and email are required.', 'Validation'); return; }
        setSavingInfo(true);
        try {
            const res = await profileAPI.updateMe(form);
            const updated = res.data?.data || res.data;
            setProfile(p => ({ ...p, ...updated }));
            // sync localStorage so sidebar name updates on next render
            const stored = JSON.parse(localStorage.getItem('adminUser') || '{}');
            localStorage.setItem('adminUser', JSON.stringify({ ...stored, first_name: updated.first_name, last_name: updated.last_name, name: `${updated.first_name} ${updated.last_name}`.trim(), email: updated.email }));
            success('Profile updated.', 'Saved');
            setEditing(false);
        } catch (e) {
            toastError(e.response?.data?.message || 'Failed to save changes.', 'Error');
        } finally {
            setSavingInfo(false);
        }
    };

    const handleSavePassword = async () => {
        setErr('');
        if (!current || !newPass || !confirm) { setErr('All fields are required.'); return; }
        if (newPass !== confirm) { setErr('New password and confirmation do not match.'); return; }
        setSaving(true);
        try {
            await approverAPI.changePassword(current, newPass);
            success('Password changed successfully. Please use your new password next time you log in.', 'Password Updated');
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
            <Box sx={{ display: 'flex', alignItems: 'center', borderRadius: '10px', border: `1px solid ${T.border}`, bgcolor: T.surface, overflow: 'hidden', '&:focus-within': { borderColor: T.accent } }}>
                <input type={show ? 'text' : 'password'} value={value} onChange={e => onChange(e.target.value)}
                       style={{ flex: 1, border: 'none', outline: 'none', padding: '10px 14px', fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '0.85rem', color: T.text, background: 'transparent' }} />
                <IconButton size="small" onClick={onToggle} sx={{ mr: 0.5, color: T.muted }}>
                    {show ? <EyeOffIcon sx={{ fontSize: 18 }} /> : <EyeIcon sx={{ fontSize: 18 }} />}
                </IconButton>
            </Box>
        </Box>
    );

    const displayName = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : `${initialUser.first_name || ''} ${initialUser.last_name || ''}`.trim();

    return (
        <Box>
            <Typography sx={{ fontSize: '1.7rem', fontWeight: 800, color: T.text, mb: 0.5 }}>My Profile</Typography>
            <Typography sx={{ fontSize: '0.78rem', color: T.muted, mb: 3 }}>Manage your personal information and account security</Typography>

            <Grid container spacing={2.5}>
                {/* Personal info card */}
                <Grid item xs={12} md={5}>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: '14px', border: `1px solid ${T.border}`, bgcolor: T.surface }}>
                        {/* Header */}
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5, pb: 2.5, borderBottom: `1px solid ${T.border}` }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Avatar sx={{ width: 48, height: 48, bgcolor: T.purpleSoft, color: T.purple, fontSize: '1.1rem', fontWeight: 700 }}>
                                    {(form.first_name?.[0] || '').toUpperCase()}{(form.last_name?.[0] || '').toUpperCase()}
                                </Avatar>
                                <Box>
                                    <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: T.text }}>{displayName}</Typography>
                                    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.6, px: 1.2, py: 0.3, borderRadius: '20px', bgcolor: T.purpleSoft, mt: 0.3 }}>
                                        <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: T.purple }} />
                                        <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: T.purple }}>{(profile || initialUser).user_role || 'Manager'}</Typography>
                                    </Box>
                                </Box>
                            </Box>
                            <IconButton size="small" onClick={() => setEditing(e => !e)}
                                        sx={{ bgcolor: editing ? T.roseSoft : T.accentSoft, color: editing ? T.rose : T.accent, '&:hover': { opacity: 0.8 } }}>
                                {editing ? <CloseIcon sx={{ fontSize: 16 }} /> : <EditIcon sx={{ fontSize: 16 }} />}
                            </IconButton>
                        </Box>

                        {editing ? (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                <Box>
                                    <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: 0.8, mb: 0.6 }}>Title</Typography>
                                    <Box sx={{ borderRadius: '9px', border: `1.5px solid ${T.accent}50`, overflow: 'hidden', bgcolor: T.surface }}>
                                        <select value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                                style={{ width: '100%', border: 'none', outline: 'none', padding: '9px 12px', background: 'transparent', fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '0.83rem', color: T.text }}>
                                            {['', 'Mr', 'Ms', 'Mrs', 'Dr', 'Prof'].map(t => <option key={t} value={t}>{t || '—'}</option>)}
                                        </select>
                                    </Box>
                                </Box>
                                {[
                                    { label: 'First Name', key: 'first_name' },
                                    { label: 'Last Name',  key: 'last_name'  },
                                    { label: 'Email',      key: 'email', type: 'email' },
                                ].map(({ label, key, type = 'text' }) => (
                                    <Box key={key}>
                                        <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: 0.8, mb: 0.6 }}>{label}</Typography>
                                        <Box sx={{ borderRadius: '9px', border: `1.5px solid ${T.accent}50`, bgcolor: T.surface, '&:focus-within': { borderColor: T.accent } }}>
                                            <input type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                                                   style={{ width: '100%', border: 'none', outline: 'none', padding: '9px 12px', background: 'transparent', fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '0.83rem', color: T.text, boxSizing: 'border-box' }} />
                                        </Box>
                                    </Box>
                                ))}
                                <Button onClick={handleSaveInfo} disabled={savingInfo} variant="contained"
                                        sx={{ mt: 0.5, borderRadius: '9px', textTransform: 'none', fontWeight: 700, fontFamily: 'Plus Jakarta Sans', fontSize: '0.83rem', boxShadow: 'none', bgcolor: T.accent, '&:hover': { opacity: 0.9 } }}>
                                    {savingInfo ? <CircularProgress size={14} sx={{ color: '#fff' }} /> : 'Save Changes'}
                                </Button>
                            </Box>
                        ) : (
                            <>
                                {[
                                    { label: 'Email',  value: (profile || initialUser).email || '—' },
                                    { label: 'User ID',value: `#${(profile || initialUser).op_user_id}`, mono: true },
                                    { label: 'Role',   value: (profile || initialUser).user_role || 'Manager' },
                                    { label: 'Dept',   value: (profile || initialUser).department_id || '—' },
                                ].map(({ label, value, mono }) => (
                                    <Box key={label} sx={{ display: 'flex', py: 1.2, borderBottom: `1px solid ${T.border}`, '&:last-child': { borderBottom: 'none' } }}>
                                        <Typography sx={{ fontSize: '0.76rem', fontWeight: 600, color: T.muted, width: 70, flexShrink: 0 }}>{label}</Typography>
                                        <Typography className={mono ? 'mono' : ''} sx={{ fontSize: '0.83rem', color: T.text }}>{value}</Typography>
                                    </Box>
                                ))}
                            </>
                        )}
                    </Paper>
                </Grid>

                {/* Change password card */}
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

                        <PasswordField label="Current Password" value={current} onChange={setCurrent} show={showCur} onToggle={() => setShowCur(p => !p)} />
                        <PasswordField label="New Password" value={newPass} onChange={setNewPass} show={showNew} onToggle={() => setShowNew(p => !p)} />
                        <PasswordField label="Confirm New Password" value={confirm} onChange={setConfirm} show={showCon} onToggle={() => setShowCon(p => !p)} />

                        <Box sx={{ mt: 1 }}>
                            <Typography sx={{ fontSize: '0.72rem', color: T.muted, mb: 2 }}>Minimum 8 characters. Your session stays active — use the new password on next login.</Typography>
                            <Button onClick={handleSavePassword} disabled={saving} variant="contained"
                                    sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, fontFamily: 'Plus Jakarta Sans', fontSize: '0.85rem', px: 3, boxShadow: 'none', bgcolor: T.accent, '&:hover': { bgcolor: '#1641B8', boxShadow: `0 4px 14px ${T.accent}44` }, '&.Mui-disabled': { bgcolor: T.border, color: T.muted } }}>
                                {saving ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : 'Update Password'}
                            </Button>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

// ── Full-screen document viewer overlay ──────────────────────────────────────
const DocViewerOverlay = ({ open, url, docType, mimeType, onClose }) => (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth
            PaperProps={{ sx: { borderRadius: '16px', height: '88vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: `1px solid ${T.border}` } }}>
        <Box sx={{ px: 3, py: 1.8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: T.surface, borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ width: 30, height: 30, borderRadius: '9px', bgcolor: T.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <DocIcon sx={{ fontSize: 16, color: T.accent }} />
                </Box>
                <Typography sx={{ fontWeight: 700, fontSize: '0.92rem', color: T.text }}>{docType}</Typography>
            </Box>
            <IconButton onClick={onClose} size="small" sx={{ color: T.muted, '&:hover': { bgcolor: T.roseSoft, color: T.rose } }}>
                <CloseIcon fontSize="small" />
            </IconButton>
        </Box>
        <Box sx={{ flex: 1, overflow: 'hidden', bgcolor: '#0F1F3D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {!url ? (
                <CircularProgress sx={{ color: 'rgba(255,255,255,0.5)' }} />
            ) : mimeType?.startsWith('image/') ? (
                <img src={url} alt={docType}
                     style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 8, boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }} />
            ) : (
                <iframe src={url} title={docType}
                        style={{ width: '100%', height: '100%', border: 'none' }} />
            )}
        </Box>
    </Dialog>
);

// ── Application Detail Dialog ─────────────────────────────────────────────────
const AppDetailDialog = ({ open, app, onClose, onApprove, onReject, submitting }) => {
    const [notes,        setNotes]        = useState('');
    const [rejReason,    setRejReason]    = useState('');
    const [view,         setView]         = useState('detail');
    const [documents,    setDocuments]    = useState([]);
    const [docLoading,   setDocLoading]   = useState(false);
    const [docStatus,    setDocStatus]    = useState({});
    const [confirmingAll,setConfirmingAll]= useState(false);
    // document viewer state
    const [viewerOpen,   setViewerOpen]   = useState(false);
    const [viewerUrl,    setViewerUrl]    = useState(null);
    const [viewerDocType,setViewerDocType]= useState('');
    const [viewerMime,   setViewerMime]   = useState('');

    const { success, error: toastError } = useToast();

    useEffect(() => {
        if (open) {
            setView('detail'); setNotes(''); setRejReason('');
            setDocuments([]); setDocStatus({}); setViewerOpen(false);
        }
    }, [open]);

    const fetchDocuments = useCallback(async () => {
        if (!app?.client_user_id) return;
        setDocLoading(true);
        try {
            const res = await approverAPI.getUserDocuments(app.client_user_id);
            setDocuments(res.data?.data?.documents || []);
        } catch { /* silent */ }
        finally { setDocLoading(false); }
    }, [app]);

    useEffect(() => {
        if (view === 'docs') fetchDocuments();
    }, [view, fetchDocuments]);

    // Opens the fullscreen viewer for a single document
    const handleOpenViewer = async (docId, docType) => {
        setViewerDocType(docType?.replace(/_/g, ' ') || 'Document');
        setViewerUrl(null);
        setViewerMime('');
        setViewerOpen(true);
        try {
            const res  = await approverAPI.viewDocument(docId);
            const url  = res.data?.url  || res.data?.data?.url;
            const mime = res.data?.mimeType || res.data?.data?.mimeType || 'application/pdf';
            setViewerUrl(url);
            setViewerMime(mime);
        } catch {
            toastError('Could not load document.', 'Error');
            setViewerOpen(false);
        }
    };

    const handleUpdateDocStatus = async (docId, status) => {
        try {
            await adminAPI.updateDocumentStatus(docId, status, '');
            setDocStatus(prev => ({ ...prev, [docId]: status }));
        } catch { toastError('Failed to update document status.', 'Error'); }
    };

    // Verifies all pending docs in one go, then moves straight to the approve step
    const handleConfirmAllDocs = async () => {
        setConfirmingAll(true);
        try {
            const pending = documents.filter(d => {
                const s = docStatus[d.document_id] || d.document_status;
                return s !== 'Verified' && s !== 'Rejected';
            });
            await Promise.all(pending.map(d => handleUpdateDocStatus(d.document_id, 'Verified')));
            success('All documents confirmed valid.', 'Documents Verified');
            setView('approve');
        } catch { toastError('Could not confirm documents.', 'Error'); }
        finally { setConfirmingAll(false); }
    };

    if (!app) return null;
    const canAct       = app.application_status === 'Pending';
    const verifiedCount = documents.filter(d => (docStatus[d.document_id] || d.document_status) === 'Verified').length;
    const allVerified   = documents.length > 0 && verifiedCount === documents.length;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth
                PaperProps={{ sx: { borderRadius: '16px', border: `1px solid ${T.border}`, boxShadow: '0 24px 60px rgba(15,31,61,0.14)', bgcolor: T.bg } }}>

            <DialogTitle sx={{ p: 0 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 3, py: 2.2, bgcolor: T.surface, borderBottom: `1px solid ${T.border}` }}>
                    <Box>
                        <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: T.text }}>Application #{app.application_id}</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.4 }}>
                            <StatusChip status={app.application_status} />
                            <Typography sx={{ fontSize: '0.72rem', color: T.muted }}>Submitted {fmtDate(app.submission_date)}</Typography>
                        </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {/* Tab buttons */}
                        {['detail', 'docs'].map(v => (
                            <Button key={v} size="small" onClick={() => setView(v)}
                                    sx={{ borderRadius: '8px', textTransform: 'none', fontFamily: 'Plus Jakarta Sans', fontWeight: 600, fontSize: '0.78rem', px: 1.5,
                                        ...(view === v ? { bgcolor: T.accentSoft, color: T.accent } : { color: T.muted, '&:hover': { bgcolor: T.bg } }) }}>
                                {v === 'detail' ? 'Details' : 'Documents'}
                            </Button>
                        ))}
                        <IconButton onClick={onClose} size="small" sx={{ color: T.muted, '&:hover': { bgcolor: T.roseSoft, color: T.rose } }}>
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </Box>
                </Box>
            </DialogTitle>

            <DialogContent sx={{ p: 3 }}>
                {/* ── Detail view ── */}
                {view === 'detail' && (
                    <Grid container spacing={2.5}>
                        <Grid item xs={12} md={6}>
                            <Paper elevation={0} sx={{ p: 2.5, borderRadius: '12px', border: `1px solid ${T.border}`, bgcolor: T.surface }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 2, pb: 1.5, borderBottom: `1px solid ${T.border}` }}>
                                    <Box sx={{ width: 30, height: 30, borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: T.accentSoft }}>
                                        <PersonIcon sx={{ fontSize: 16, color: T.accent }} />
                                    </Box>
                                    <Typography sx={{ fontWeight: 700, fontSize: '0.88rem', color: T.text }}>Applicant Information</Typography>
                                </Box>
                                <InfoRow label="Full name"   value={`${app.applicant_title || ''} ${app.applicant_first_name} ${app.applicant_last_name}`} />
                                <InfoRow label="Email"       value={app.applicant_email} />
                                <InfoRow label="Phone"       value={app.applicant_phone} />
                                <InfoRow label="Persal ID"   value={app.persal_id} />
                                <InfoRow label="Department"  value={app.department_id} />
                                <InfoRow label="Region"      value={app.applicant_region} />
                                <InfoRow label="User type"   value={app.applicant_type} />
                            </Paper>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Paper elevation={0} sx={{ p: 2.5, borderRadius: '12px', border: `1px solid ${T.border}`, bgcolor: T.surface }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 2, pb: 1.5, borderBottom: `1px solid ${T.border}` }}>
                                    <Box sx={{ width: 30, height: 30, borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: T.purpleSoft }}>
                                        <DeviceIcon sx={{ fontSize: 16, color: T.purple }} />
                                    </Box>
                                    <Typography sx={{ fontWeight: 700, fontSize: '0.88rem', color: T.text }}>Requested Device</Typography>
                                </Box>
                                <InfoRow label="Device"        value={app.device_name} />
                                <InfoRow label="Model"         value={app.model} />
                                <InfoRow label="Manufacturer"  value={app.manufacturer} />
                                <InfoRow label="Plan"          value={app.plan_name} />
                                <InfoRow label="Monthly cost"  value={fmtR(app.monthly_cost)} />
                                <InfoRow label="Contract"      value={`${app.contract_duration_months || '—'} months`} />
                                <InfoRow label="Total value"   value={fmtR((app.monthly_cost || 0) * (app.contract_duration_months || 0))} />
                            </Paper>
                        </Grid>
                        {app.approval_history?.length > 0 && (
                            <Grid item xs={12}>
                                <Paper elevation={0} sx={{ p: 2.5, borderRadius: '12px', border: `1px solid ${T.border}`, bgcolor: T.surface }}>
                                    <Typography sx={{ fontWeight: 700, fontSize: '0.88rem', color: T.text, mb: 1.5 }}>Approval History</Typography>
                                    {app.approval_history.map((h, i) => (
                                        <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1, borderBottom: i < app.approval_history.length - 1 ? `1px solid ${T.border}` : 'none' }}>
                                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: h.approval_status === 'Approved' ? T.green : T.rose, flexShrink: 0 }} />
                                            <Typography sx={{ fontSize: '0.8rem', color: T.text, fontWeight: 600 }}>{h.approval_stage?.toUpperCase()} — {h.approval_status}</Typography>
                                            <Typography sx={{ fontSize: '0.76rem', color: T.muted }}>by {h.approver_first_name} {h.approver_last_name}</Typography>
                                            <Typography sx={{ fontSize: '0.72rem', color: T.muted, ml: 'auto' }}>{fmtDate(h.approval_date)}</Typography>
                                        </Box>
                                    ))}
                                </Paper>
                            </Grid>
                        )}
                    </Grid>
                )}

                {/* ── Documents carousel view ── */}
                {view === 'docs' && (
                    <Box>
                        {/* Header row */}
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
                            <Box>
                                <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: T.text }}>Supporting Documents</Typography>
                                <Typography sx={{ fontSize: '0.74rem', color: T.muted, mt: 0.3 }}>
                                    Tap a card to open the document, then confirm all are valid before approving.
                                </Typography>
                            </Box>
                            {documents.length > 0 && (
                                <Box sx={{ px: 1.5, py: 0.5, borderRadius: '8px',
                                    bgcolor: allVerified ? T.greenSoft : T.amberSoft,
                                    border: `1px solid ${allVerified ? T.green : T.amber}28` }}>
                                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 700,
                                        color: allVerified ? T.green : T.amber }}>
                                        {verifiedCount} / {documents.length} verified
                                    </Typography>
                                </Box>
                            )}
                        </Box>

                        {docLoading ? (
                            <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
                                <CircularProgress size={28} sx={{ color: T.accent }} />
                            </Box>
                        ) : documents.length === 0 ? (
                            <Box sx={{ py: 6, textAlign: 'center' }}>
                                <DocIcon sx={{ fontSize: 44, color: T.border, mb: 1.5 }} />
                                <Typography sx={{ fontWeight: 600, color: T.text, mb: 0.5 }}>No documents found</Typography>
                                <Typography sx={{ fontSize: '0.82rem', color: T.muted }}>This applicant has not uploaded any supporting documents.</Typography>
                            </Box>
                        ) : (
                            <>
                                {/* ── Horizontal sliding carousel ── */}
                                <Box sx={{
                                    display: 'flex',
                                    gap: 2,
                                    overflowX: 'auto',
                                    pb: 2,
                                    scrollSnapType: 'x mandatory',
                                    scrollBehavior: 'smooth',
                                    '&::-webkit-scrollbar': { height: 5 },
                                    '&::-webkit-scrollbar-track': { bgcolor: T.bg, borderRadius: 4 },
                                    '&::-webkit-scrollbar-thumb': { bgcolor: T.border, borderRadius: 4, '&:hover': { bgcolor: T.muted } },
                                }}>
                                    {documents.map((doc, idx) => {
                                        const status     = docStatus[doc.document_id] || doc.document_status || 'Pending';
                                        const isVerified = status === 'Verified';
                                        const isRejected = status === 'Rejected';
                                        const borderCol  = isVerified ? T.green : isRejected ? T.rose : T.border;
                                        const bgCol      = isVerified ? T.greenSoft : isRejected ? T.roseSoft : T.surface;
                                        const iconCol    = isVerified ? T.green : T.accent;
                                        const iconBg     = isVerified ? `${T.green}1A` : T.accentSoft;

                                        return (
                                            <Box key={doc.document_id} sx={{
                                                minWidth: 196,
                                                maxWidth: 196,
                                                flexShrink: 0,
                                                scrollSnapAlign: 'start',
                                                animation: `slideIn 0.35s ease-out ${idx * 0.08}s both`,
                                            }}>
                                                {/* ── Document card — tap to open viewer ── */}
                                                <Paper elevation={0} onClick={() => handleOpenViewer(doc.document_id, doc.document_type)}
                                                       sx={{
                                                           p: 2.5, borderRadius: '14px',
                                                           border: `2px solid ${borderCol}`,
                                                           bgcolor: bgCol,
                                                           cursor: 'pointer',
                                                           transition: 'all 0.22s ease',
                                                           position: 'relative', overflow: 'hidden',
                                                           '&:hover': {
                                                               transform: 'translateY(-4px)',
                                                               boxShadow: `0 10px 28px ${T.accent}22`,
                                                               borderColor: T.accent,
                                                           },
                                                       }}>

                                                    {/* Verified tick (top-right corner) */}
                                                    {isVerified && (
                                                        <Box sx={{ position: 'absolute', top: 9, right: 9 }}>
                                                            <ApprovedIcon sx={{ fontSize: 18, color: T.green }} />
                                                        </Box>
                                                    )}

                                                    {/* Doc icon */}
                                                    <Box sx={{ width: 50, height: 50, borderRadius: '13px', bgcolor: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                                                        <DocIcon sx={{ fontSize: 26, color: iconCol }} />
                                                    </Box>

                                                    {/* Doc name */}
                                                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: T.text, mb: 0.4, lineHeight: 1.3, pr: isVerified ? 2.5 : 0 }}>
                                                        {doc.document_type?.replace(/_/g, ' ')}
                                                    </Typography>

                                                    {/* Upload date */}
                                                    <Typography sx={{ fontSize: '0.68rem', color: T.muted, mb: 1.5 }}>
                                                        {fmtDate(doc.upload_date)}
                                                    </Typography>

                                                    {/* Status pill */}
                                                    <Box sx={{
                                                        display: 'inline-flex', alignItems: 'center', gap: 0.5,
                                                        px: 1, py: 0.3, borderRadius: '20px', mb: 1.5,
                                                        bgcolor: isVerified ? `${T.green}1A` : isRejected ? `${T.rose}1A` : `${T.amber}1A`,
                                                    }}>
                                                        <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: isVerified ? T.green : isRejected ? T.rose : T.amber }} />
                                                        <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: isVerified ? T.green : isRejected ? T.rose : T.amber }}>
                                                            {status}
                                                        </Typography>
                                                    </Box>

                                                    {/* Tap hint */}
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                        <EyeIcon sx={{ fontSize: 12, color: T.accent }} />
                                                        <Typography sx={{ fontSize: '0.68rem', fontWeight: 600, color: T.accent }}>Tap to view</Typography>
                                                    </Box>
                                                </Paper>

                                                {/* Flag-as-invalid button below the card */}
                                                {!isRejected && (
                                                    <Button size="small" fullWidth
                                                            onClick={e => { e.stopPropagation(); handleUpdateDocStatus(doc.document_id, 'Rejected'); }}
                                                            sx={{ mt: 0.8, borderRadius: '8px', textTransform: 'none', fontFamily: 'Plus Jakarta Sans', fontSize: '0.71rem', fontWeight: 600, color: T.rose, border: `1px solid ${T.rose}33`, '&:hover': { bgcolor: T.roseSoft } }}>
                                                        Flag invalid
                                                    </Button>
                                                )}
                                            </Box>
                                        );
                                    })}
                                </Box>

                                {documents.length > 2 && (
                                    <Typography sx={{ fontSize: '0.69rem', color: T.muted, textAlign: 'center', mt: 0.5 }}>
                                        ← scroll to see all documents →
                                    </Typography>
                                )}
                            </>
                        )}

                        {/* ── Full-screen document viewer overlay ── */}
                        <DocViewerOverlay
                            open={viewerOpen}
                            url={viewerUrl}
                            docType={viewerDocType}
                            mimeType={viewerMime}
                            onClose={() => setViewerOpen(false)}
                        />
                    </Box>
                )}

                {/* ── Approve confirm view ── */}
                {view === 'approve' && (
                    <Box sx={{ py: 1 }}>
                        <Alert severity="info" sx={{ mb: 2.5, borderRadius: '10px', fontSize: '0.82rem' }}>
                            You are approving Application #{app.application_id} for <strong>{app.applicant_first_name} {app.applicant_last_name}</strong> — {app.device_name}. This will forward the application to Finance for budget approval.
                        </Alert>
                        <Typography sx={{ fontSize: '0.76rem', fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: 0.8, mb: 0.8 }}>Notes (optional)</Typography>
                        <TextField fullWidth multiline rows={3} placeholder="Add any notes for the Finance approver…"
                                   value={notes} onChange={e => setNotes(e.target.value)}
                                   sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', fontSize: '0.85rem' } }} />
                    </Box>
                )}

                {/* ── Reject confirm view ── */}
                {view === 'reject' && (
                    <Box sx={{ py: 1 }}>
                        <Alert severity="warning" sx={{ mb: 2.5, borderRadius: '10px', fontSize: '0.82rem' }}>
                            You are rejecting Application #{app.application_id}. The applicant will be notified with your reason.
                        </Alert>
                        <Typography sx={{ fontSize: '0.76rem', fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: 0.8, mb: 0.8 }}>
                            Rejection reason <span style={{ color: T.rose }}>*</span>
                        </Typography>
                        <TextField fullWidth multiline rows={3} placeholder="Explain why this application is being rejected…"
                                   value={rejReason} onChange={e => setRejReason(e.target.value)}
                                   sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', fontSize: '0.85rem' } }} />
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2, bgcolor: T.surface, borderTop: `1px solid ${T.border}`, gap: 1 }}>
                {view === 'detail' && (
                    <>
                        <Button onClick={onClose} sx={{ color: T.muted, textTransform: 'none', fontFamily: 'Plus Jakarta Sans', borderRadius: '10px' }}>Close</Button>
                        {canAct && (
                            <>
                                <Button onClick={() => setView('reject')} variant="outlined"
                                        sx={{ borderRadius: '10px', textTransform: 'none', fontFamily: 'Plus Jakarta Sans', fontWeight: 600, color: T.rose, borderColor: T.rose, '&:hover': { bgcolor: T.roseSoft, borderColor: T.rose } }}>
                                    Reject
                                </Button>
                                <Button onClick={() => setView('approve')} variant="contained"
                                        sx={{ borderRadius: '10px', textTransform: 'none', fontFamily: 'Plus Jakarta Sans', fontWeight: 600, bgcolor: T.green, '&:hover': { bgcolor: '#047857' }, boxShadow: `0 4px 14px ${T.green}44` }}>
                                    Approve & Forward
                                </Button>
                            </>
                        )}
                    </>
                )}
                {view === 'docs' && (
                    <>
                        <Button onClick={onClose} sx={{ color: T.muted, textTransform: 'none', fontFamily: 'Plus Jakarta Sans', borderRadius: '10px' }}>Close</Button>
                        <Box sx={{ flex: 1 }} />
                        {canAct && documents.length > 0 && !docLoading && (
                            <Button onClick={handleConfirmAllDocs} disabled={confirmingAll} variant="contained"
                                    startIcon={confirmingAll ? <CircularProgress size={14} sx={{ color: '#fff' }} /> : <ApprovedIcon sx={{ fontSize: 16 }} />}
                                    sx={{ borderRadius: '10px', textTransform: 'none', fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '0.85rem', px: 2.5,
                                        bgcolor: allVerified ? T.green : T.accent,
                                        '&:hover': { bgcolor: allVerified ? '#047857' : '#1641B8' },
                                        boxShadow: `0 4px 14px ${allVerified ? T.green : T.accent}44` }}>
                                {confirmingAll ? 'Confirming…' : allVerified ? 'Documents Confirmed — Proceed to Approve' : 'Confirm Documents Valid & Proceed'}
                            </Button>
                        )}
                    </>
                )}
                {view === 'approve' && (
                    <>
                        <Button onClick={() => setView('detail')} sx={{ color: T.muted, textTransform: 'none', fontFamily: 'Plus Jakarta Sans', borderRadius: '10px' }}>Back</Button>
                        <Button onClick={() => onApprove(app.application_id, notes)} disabled={submitting} variant="contained"
                                sx={{ borderRadius: '10px', textTransform: 'none', fontFamily: 'Plus Jakarta Sans', fontWeight: 700, bgcolor: T.green, '&:hover': { bgcolor: '#047857' }, minWidth: 140 }}>
                            {submitting ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : 'Confirm Approval'}
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

/* ── Sidebar ── */
const ManagerSidebar = ({ mobileOpen, onClose, activeView, setActiveView }) => {
    const theme    = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const user = JSON.parse(localStorage.getItem('adminUser') || '{}');

    const nav = [
        { id: 'queue',   label: 'Application Queue', icon: <QueueIcon /> },
        { id: 'stats',   label: 'My Statistics',     icon: <DashboardIcon /> },
        { id: 'profile', label: 'My Profile',        icon: <ProfileIcon /> },
    ];

    const drawerContent = (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: T.surface }}>
            <Box sx={{ px: 3, py: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${T.border}` }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                    <Box sx={{ width: 34, height: 34, borderRadius: '10px', bgcolor: T.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 12px ${T.accent}44` }}>
                        <GavelIcon sx={{ fontSize: 18, color: '#fff' }} />
                    </Box>
                    <Box>
                        <Typography sx={{ fontSize: '0.95rem', fontWeight: 800, color: T.text, lineHeight: 1.1 }}>Judicial</Typography>
                        <Typography sx={{ fontSize: '0.68rem', fontWeight: 600, color: T.muted, letterSpacing: 0.5 }}>Manager Portal</Typography>
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
                                            sx={{ borderRadius: '10px', mb: 0.5, px: 1.5, py: 1, animation: `slideIn 0.4s ease-out ${i * 0.05}s both`, transition: 'all 0.18s ease', bgcolor: active ? T.accentSoft : 'transparent', '&:hover': { bgcolor: active ? T.accentSoft : T.bg, transform: 'translateX(3px)' } }}>
                                <ListItemIcon sx={{ minWidth: 36 }}>{React.cloneElement(item.icon, { sx: { fontSize: 19, color: active ? T.accent : T.muted } })}</ListItemIcon>
                                <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: '0.855rem', fontWeight: active ? 700 : 500, color: active ? T.accent : T.text, fontFamily: 'Plus Jakarta Sans' }} />
                                {active && <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: T.accent, animation: 'dotPulse 2s ease-in-out infinite' }} />}
                            </ListItemButton>
                        );
                    })}
                </List>
            </Box>

            <Box sx={{ px: 2, pb: 2.5 }}>
                <Divider sx={{ borderColor: T.border, mb: 2 }} />
                <Box sx={{ px: 2, py: 1.5, borderRadius: '10px', bgcolor: T.bg, border: `1px solid ${T.border}`, mb: 1.5 }}>
                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: T.text }}>{user.first_name} {user.last_name}</Typography>
                    <Typography sx={{ fontSize: '0.7rem', color: T.accent, fontWeight: 600 }}>Manager · Approver 1</Typography>
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
const ManagerDashboard = () => {
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
                approverAPI.getManagerQueue(),
                approverAPI.getManagerStats(),
            ]);
            setQueue(qRes.data?.data?.applications || []);
            setStats(sRes.data?.data?.stats || null);
        } catch (err) {
            toastError(err.response?.data?.message || 'Failed to load queue', 'Load Error');
        } finally {
            setLoading(false);
        }
    }, [toastError]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const filtered = queue.filter(a => {
        if (!search) return true;
        const s = search.toLowerCase();
        return (
            `${a.applicant_first_name} ${a.applicant_last_name}`.toLowerCase().includes(s) ||
            a.persal_id?.toLowerCase().includes(s) ||
            a.device_name?.toLowerCase().includes(s) ||
            a.applicant_region?.toLowerCase().includes(s)
        );
    });

    const handleApprove = async (id, notes) => {
        setSubmitting(true);
        try {
            await approverAPI.managerApprove(id, { notes });
            success(`Application #${id} approved and forwarded to Finance.`, 'Approved');
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
            await approverAPI.managerReject(id, { rejection_reason });
            success(`Application #${id} has been rejected.`, 'Rejected');
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
                        <Typography sx={{ fontSize: { xs: '1.4rem', md: '1.7rem' }, fontWeight: 800, color: T.text, letterSpacing: '-0.3px' }}>Application Queue</Typography>
                        <LiveDot />
                    </Box>
                    <Typography sx={{ fontSize: '0.78rem', color: T.muted }}>Applications awaiting your review · Manager stage</Typography>
                </Box>
                <Button onClick={fetchData} variant="outlined" startIcon={<RefreshIcon sx={{ fontSize: '16px !important' }} />}
                        sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, fontFamily: 'Plus Jakarta Sans', fontSize: '0.81rem', color: T.accent, borderColor: T.border, bgcolor: T.surface, px: 2.5, py: 1, '&:hover': { bgcolor: T.accentSoft, borderColor: T.accent } }}>
                    Refresh
                </Button>
            </Box>

            {stats && (
                <Grid container spacing={2.5} sx={{ mb: 3 }}>
                    {[
                        { label: 'Awaiting review',  value: stats.pending_in_queue, sub: 'In your queue',       color: T.amber,  soft: T.amberSoft,  icon: PendingIcon,  delay: 0    },
                        { label: 'Total approved',    value: stats.total_approved,   sub: 'By you, all time',   color: T.green,  soft: T.greenSoft,  icon: ApprovedIcon, delay: 0.07 },
                        { label: 'Total rejected',    value: stats.total_rejected,   sub: 'By you, all time',   color: T.rose,   soft: T.roseSoft,   icon: RejectedIcon, delay: 0.14 },
                        { label: 'Avg decision time', value: `${stats.avg_decision_days}d`, sub: 'Days per decision', color: T.purple, soft: T.purpleSoft, icon: TimeIcon, delay: 0.21 },
                    ].map(s => (
                        <Grid item xs={6} md={3} key={s.label}>
                            <StatCard {...s} />
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* Department scope indicator */}
            {(() => {
                const hasGlobal = user.has_global_access;
                const dept      = user.department_id;
                const scopeColor = hasGlobal ? T.purple : T.accent;
                const scopeSoft  = hasGlobal ? T.purpleSoft : T.accentSoft;
                return (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, px: 1.5, py: 1, borderRadius: '10px', bgcolor: scopeSoft, border: `1px solid ${scopeColor}28` }}>
                        {hasGlobal
                            ? <GlobalIcon sx={{ fontSize: 14, color: scopeColor }} />
                            : <DeptIcon   sx={{ fontSize: 14, color: scopeColor }} />}
                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: scopeColor }}>
                            {hasGlobal ? 'Viewing: All Departments' : dept ? `Viewing: ${dept}` : 'Viewing: All Departments'}
                        </Typography>
                        {!hasGlobal && dept && (
                            <Typography sx={{ fontSize: '0.68rem', color: scopeColor, opacity: 0.7, ml: 0.5 }}>
                                · Contact Admin to enable cross-department access
                            </Typography>
                        )}
                    </Box>
                );
            })()}

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5, p: 1.5, bgcolor: T.surface, borderRadius: '12px', border: `1px solid ${T.border}` }}>
                <SearchIcon sx={{ fontSize: 18, color: T.muted, flexShrink: 0 }} />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, persal ID, device, region…"
                       style={{ border: 'none', outline: 'none', background: 'transparent', flex: 1, fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '0.87rem', color: T.text }} />
                {search && <IconButton size="small" onClick={() => setSearch('')} sx={{ color: T.muted }}><CloseIcon fontSize="small" /></IconButton>}
            </Box>

            <Paper elevation={0} sx={{ borderRadius: '14px', border: `1px solid ${T.border}`, overflow: 'hidden', animation: 'fadeUp 0.5s ease-out 0.1s both' }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
                        <CircularProgress size={32} sx={{ color: T.accent }} />
                    </Box>
                ) : filtered.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 8 }}>
                        <QueueIcon sx={{ fontSize: 48, color: T.border, mb: 1.5 }} />
                        <Typography sx={{ fontWeight: 700, color: T.text, mb: 0.5 }}>Queue is empty</Typography>
                        <Typography sx={{ fontSize: '0.83rem', color: T.muted }}>No applications are currently waiting for your review.</Typography>
                    </Box>
                ) : (
                    <>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: T.bg }}>
                                        {['Applicant', 'Region / Dept', 'Device', 'Monthly cost', 'Days waiting', 'Status', 'Actions'].map(h => (
                                            <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.72rem', color: T.muted, textTransform: 'uppercase', letterSpacing: 0.8, borderBottom: `1px solid ${T.border}`, py: 1.5 }}>{h}</TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((app, i) => (
                                        <TableRow key={app.application_id} sx={{ animation: `fadeUp 0.4s ease-out ${i * 0.04}s both`, '&:hover': { bgcolor: T.bg }, '&:last-child td': { borderBottom: 'none' } }}>
                                            <TableCell sx={{ py: 1.5 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                    <Avatar sx={{ width: 32, height: 32, bgcolor: T.accentSoft, color: T.accent, fontSize: '0.75rem', fontWeight: 700 }}>
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
                                                <Typography className="mono" sx={{ fontSize: '0.85rem', fontWeight: 600, color: T.accent }}>{fmtR(app.monthly_cost)}</Typography>
                                                <Typography sx={{ fontSize: '0.7rem', color: T.muted }}>{app.contract_duration_months}mo contract</Typography>
                                            </TableCell>
                                            <TableCell sx={{ py: 1.5 }}>
                                                {(() => {
                                                    const s     = app.sla_status || (app.days_waiting > (app.sla_days || 3) ? 'breached' : 'within');
                                                    const color = s === 'breached' ? T.rose : s === 'approaching' ? T.amber : T.green;
                                                    const bg    = s === 'breached' ? T.roseSoft : s === 'approaching' ? T.amberSoft : T.greenSoft;
                                                    const label = s === 'breached' ? 'Breached' : s === 'approaching' ? 'Approaching' : 'On Track';
                                                    const daysLeft = (app.sla_days || 3) - (app.days_waiting || 0);
                                                    return (
                                                        <Box>
                                                            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.6, px: 1, py: 0.4, borderRadius: '8px', bgcolor: bg, mb: 0.4 }}>
                                                                <TimeIcon sx={{ fontSize: 11, color }} />
                                                                <Typography className="mono" sx={{ fontSize: '0.72rem', fontWeight: 700, color }}>{app.days_waiting || 0}d</Typography>
                                                            </Box>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} />
                                                                <Typography sx={{ fontSize: '0.66rem', fontWeight: 700, color }}>
                                                                    {label}{s === 'breached' ? ` (+${Math.abs(daysLeft).toFixed(1)}d over)` : s !== 'within' ? ` (${daysLeft.toFixed(1)}d left)` : ''}
                                                                </Typography>
                                                            </Box>
                                                        </Box>
                                                    );
                                                })()}
                                            </TableCell>
                                            <TableCell sx={{ py: 1.5 }}><StatusChip status={app.application_status} /></TableCell>
                                            <TableCell sx={{ py: 1.5 }}>
                                                <Box sx={{ display: 'flex', gap: 0.8 }}>
                                                    <Tooltip title="View details">
                                                        <IconButton size="small" onClick={() => setDetailApp(app)}
                                                                    sx={{ width: 28, height: 28, borderRadius: '8px', bgcolor: T.accentSoft, color: T.accent, '&:hover': { bgcolor: '#DBEAFE' } }}>
                                                            <ViewIcon sx={{ fontSize: 14 }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Approve & forward to Finance">
                                                        <IconButton size="small" onClick={() => setDetailApp(app)}
                                                                    sx={{ width: 28, height: 28, borderRadius: '8px', bgcolor: T.greenSoft, color: T.green, '&:hover': { bgcolor: '#A7F3D0' } }}>
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
            <Typography sx={{ fontSize: '0.78rem', color: T.muted, mb: 3 }}>Your personal approval performance</Typography>
            {stats ? (
                <Grid container spacing={2.5}>
                    {[
                        { label: 'In queue',          value: stats.pending_in_queue,  sub: 'Awaiting review',     color: T.amber,  soft: T.amberSoft,  icon: PendingIcon  },
                        { label: 'Total approved',    value: stats.total_approved,    sub: 'All time',            color: T.green,  soft: T.greenSoft,  icon: ApprovedIcon },
                        { label: 'Total rejected',    value: stats.total_rejected,    sub: 'All time',            color: T.rose,   soft: T.roseSoft,   icon: RejectedIcon },
                        { label: 'Avg decision days', value: `${stats.avg_decision_days}`, sub: 'Per application', color: T.purple, soft: T.purpleSoft, icon: TimeIcon     },
                    ].map((s, i) => (
                        <Grid item xs={6} md={3} key={s.label}>
                            <StatCard {...s} delay={i * 0.07} />
                        </Grid>
                    ))}
                    <Grid item xs={12}>
                        <Paper elevation={0} sx={{ p: 3, borderRadius: '14px', border: `1px solid ${T.border}`, bgcolor: T.surface }}>
                            <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: T.text, mb: 2 }}>Performance summary</Typography>
                            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                                {[
                                    { label: 'Approval rate', value: stats.total_approved + stats.total_rejected > 0 ? `${Math.round((stats.total_approved / (stats.total_approved + stats.total_rejected)) * 100)}%` : '—', color: T.green },
                                    { label: 'Total decisions', value: stats.total_approved + stats.total_rejected, color: T.accent },
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
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress sx={{ color: T.accent }} /></Box>
            )}
        </Box>
    );

    return (
        <Box sx={{ display: 'flex', bgcolor: T.bg, minHeight: '100vh' }}>
            <style>{globalStyles}</style>
            <CssBaseline />
            <ManagerSidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} activeView={activeView} setActiveView={setActiveView} />
            <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 3.5 }, width: { sm: `calc(100% - ${drawerWidth}px)` }, minHeight: '100vh' }}>
                {/* Top bar */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, pb: 2, borderBottom: `1px solid ${T.border}` }}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        {[{ id: 'queue', label: 'Queue' }, { id: 'stats', label: 'My Stats' }, { id: 'profile', label: 'Profile' }].map(v => (
                            <Button key={v.id} onClick={() => setActiveView(v.id)} variant={activeView === v.id ? 'contained' : 'outlined'}
                                    sx={{ borderRadius: '10px', textTransform: 'none', fontFamily: 'Plus Jakarta Sans', fontWeight: 600, fontSize: '0.83rem', px: 2,
                                        ...(activeView === v.id ? { bgcolor: T.accent, '&:hover': { bgcolor: '#1641B8' } } : { color: T.muted, borderColor: T.border, bgcolor: T.surface, '&:hover': { bgcolor: T.accentSoft, borderColor: T.accent, color: T.accent } }) }}>
                                {v.label}
                            </Button>
                        ))}
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        {/* ── Notification Bell ── */}
                        <NotificationBell userId={user.op_user_id} />

                        <Box sx={{ px: 1.5, py: 0.5, borderRadius: '8px', bgcolor: T.accentSoft, border: `1px solid ${T.accent}22` }}>
                            <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: T.accent }}>Manager · Approver 1</Typography>
                        </Box>
                        <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: T.text }}>{user.first_name} {user.last_name}</Typography>
                    </Box>
                </Box>

                {activeView === 'queue'   && <QueueView />}
                {activeView === 'stats'   && <StatsView />}
                {activeView === 'profile' && <ProfileView user={user} />}
            </Box>

            <AppDetailDialog open={!!detailApp} app={detailApp} onClose={() => setDetailApp(null)} onApprove={handleApprove} onReject={handleReject} submitting={submitting} />
        </Box>
    );
};

export default ManagerDashboard;