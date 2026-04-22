// components/Layout/Navbar.jsx
import React, { useState, useEffect } from 'react';
import {
    AppBar,
    Toolbar,
    IconButton,
    Typography,
    Badge,
    Box,
    Avatar,
    Menu,
    MenuItem,
    Tooltip,
    InputBase,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Divider,
    Button,
    CircularProgress,
    Chip,
    Alert,
} from '@mui/material';
import {
    Menu as MenuIcon,
    Notifications as NotificationsIcon,
    Search as SearchIcon,
    AccountCircle,
    Logout,
    Settings,
    CheckCircle as CheckCircleIcon,
    Info as InfoIcon,
    Warning as WarningIcon,
    Error as ErrorIcon,
    Check as CheckIcon,
    Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { notificationsAPI } from '../../services/api';
import { formatDistanceToNow, parseISO } from 'date-fns';

/* ─── Shared tokens (keep in sync with Sidebar.jsx) ─── */
const T = {
    bg:         '#F8F9FC',
    surface:    '#FFFFFF',
    border:     '#E8ECF4',
    text:       '#0F1F3D',
    muted:      '#6B7A99',
    accent:     '#1E4FD8',
    accentMid:  '#3366FF',
    accentSoft: '#EBF0FF',
    green:      '#059669',
    amber:      '#D97706',
    rose:       '#DC2626',
};

const drawerWidth = 256;

const Navbar = ({ onDrawerToggle }) => {
    const [anchorEl, setAnchorEl]                     = useState(null);
    const [notificationAnchorEl, setNotificationAnchorEl] = useState(null);
    const [searchTerm, setSearchTerm]                 = useState('');
    const [notifications, setNotifications]           = useState([]);
    const [unreadCount, setUnreadCount]               = useState(0);
    const [loading, setLoading]                       = useState(false);
    const [refreshing, setRefreshing]                 = useState(false);
    const [notificationError, setNotificationError]   = useState(null);

    // Lightweight — only fetches the badge count. Runs on interval.
    const fetchUnreadCount = async () => {
        try {
            const adminUserStr = localStorage.getItem('adminUser');
            if (!adminUserStr) return;
            const adminUser = JSON.parse(adminUserStr);
            const adminId   = adminUser.op_user_id || adminUser.id;
            if (!adminId) return;
            const res = await notificationsAPI.getUnreadCount(adminId, 'Operational');
            setUnreadCount(res.data?.unreadCount ?? 0);
        } catch {
            // Silently fail — badge is non-critical
        }
    };

    // Full fetch — loads the list. Only runs when the panel is opened.
    const fetchNotifications = async () => {
        try {
            setLoading(true);
            setNotificationError(null);

            const adminUserStr = localStorage.getItem('adminUser');
            if (!adminUserStr) { setNotifications([]); setUnreadCount(0); return; }

            const adminUser = JSON.parse(adminUserStr);
            const adminId   = adminUser.op_user_id || adminUser.id;
            if (!adminId)   { setNotifications([]); setUnreadCount(0); return; }

            const [notificationsRes, unreadRes] = await Promise.all([
                notificationsAPI.getUserNotifications(adminId, 'Operational'),
                notificationsAPI.getUnreadCount(adminId, 'Operational'),
            ]);

            setNotifications(notificationsRes.data.data || []);
            setUnreadCount(unreadRes.data.unreadCount || 0);
        } catch (error) {
            setNotificationError(error.message || 'Failed to load notifications');
            setNotifications([]); setUnreadCount(0);
        } finally {
            setLoading(false); setRefreshing(false);
        }
    };

    useEffect(() => {
        // Fetch badge count immediately, then every 60 seconds.
        // Do NOT fetch the full list here — only when the panel opens.
        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 60000);
        return () => clearInterval(interval);
    }, []);

    const handleProfileMenuOpen    = (e) => setAnchorEl(e.currentTarget);
    const handleMenuClose          = () => setAnchorEl(null);
    const handleNotificationClick  = (e) => { setNotificationAnchorEl(e.currentTarget); fetchNotifications(); }; // full fetch on open
    const handleNotificationClose  = () => setNotificationAnchorEl(null);
    const handleSearch             = (e) => { if (e.key === 'Enter' && searchTerm.trim().length >= 2) window.location.href = `/search?q=${encodeURIComponent(searchTerm)}`; };
    const handleLogout             = () => { localStorage.removeItem('adminToken'); window.location.href = '/login'; };
    const handleRefreshNotifications = () => { setRefreshing(true); fetchNotifications(); };

    const handleMarkAsRead = async (notificationId, event) => {
        event?.stopPropagation();
        try {
            const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
            const adminId   = adminUser.op_user_id || adminUser.id;
            if (!adminId) return;
            await notificationsAPI.markAsRead(notificationId, adminId, 'Operational');
            setNotifications(prev => prev.map(n => n.notification_id === notificationId ? { ...n, is_read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) { console.error('Error marking as read:', error); }
    };

    const handleMarkAllAsRead = async () => {
        try {
            const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
            const adminId   = adminUser.op_user_id || adminUser.id;
            if (!adminId) return;
            await notificationsAPI.markAllAsRead(adminId, 'Operational');
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (error) { console.error('Error marking all as read:', error); }
    };

    const getNotificationIcon = (title) => {
        if (!title) return <InfoIcon sx={{ fontSize: 16, color: T.accent }} />;
        const t = title.toLowerCase();
        if (t.includes('warning') || t.includes('alert'))    return <WarningIcon sx={{ fontSize: 16, color: T.amber }} />;
        if (t.includes('error')   || t.includes('failed'))   return <ErrorIcon   sx={{ fontSize: 16, color: T.rose  }} />;
        if (t.includes('success') || t.includes('completed'))return <CheckCircleIcon sx={{ fontSize: 16, color: T.green }} />;
        return <InfoIcon sx={{ fontSize: 16, color: T.accent }} />;
    };

    const getTimeAgo = (dateString) => {
        if (!dateString) return '';
        try { return formatDistanceToNow(parseISO(dateString), { addSuffix: true }); }
        catch { return ''; }
    };

    const getInitials = () => {
        const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
        const name = adminUser.name || 'Admin';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    };

    return (
        <>
            <AppBar position="fixed" elevation={0} sx={{
                width: { sm: `calc(100% - ${drawerWidth}px)` },
                ml:    { sm: `${drawerWidth}px` },
                zIndex: (theme) => theme.zIndex.drawer + 1,
                bgcolor: T.surface,
                borderBottom: `1px solid ${T.border}`,
                color: T.text,
            }}>
                <Toolbar sx={{ gap: 1.5, minHeight: '60px !important' }}>
                    <IconButton onClick={onDrawerToggle} edge="start"
                                sx={{ display: { sm: 'none' }, color: T.muted, '&:hover': { bgcolor: T.accentSoft } }}>
                        <MenuIcon />
                    </IconButton>

                    {/* Page title */}
                    <Typography sx={{
                        flexGrow: 1, fontWeight: 700, fontSize: '1rem',
                        color: T.text, display: { xs: 'none', sm: 'block' },
                    }}>
                        Admin Dashboard
                    </Typography>

                    {/* Search bar */}
                    <Box sx={{
                        display: 'flex', alignItems: 'center', gap: 1,
                        bgcolor: T.bg, border: `1px solid ${T.border}`,
                        borderRadius: '10px', px: 1.5, py: 0.6,
                        width: { xs: '100%', sm: 220 },
                        '&:focus-within': { borderColor: T.accent, boxShadow: `0 0 0 3px ${T.accentSoft}` },
                        transition: 'all 0.2s ease',
                    }}>
                        <SearchIcon sx={{ fontSize: 17, color: T.muted }} />
                        <InputBase
                            placeholder="Search users…"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyPress={handleSearch}
                            sx={{ fontSize: '0.83rem', color: T.text, width: '100%',
                                '& input::placeholder': { color: T.muted, opacity: 1 },
                            }}
                        />
                    </Box>

                    {/* Notification bell */}
                    <Tooltip title="Notifications">
                        <IconButton onClick={handleNotificationClick} sx={{
                            width: 38, height: 38, borderRadius: '10px',
                            bgcolor: T.bg, border: `1px solid ${T.border}`, color: T.muted,
                            '&:hover': { bgcolor: T.accentSoft, color: T.accent, borderColor: T.accent },
                            transition: 'all 0.18s ease',
                        }}>
                            <Badge badgeContent={unreadCount} sx={{
                                '& .MuiBadge-badge': {
                                    bgcolor: T.rose, color: '#fff', fontSize: '0.6rem',
                                    fontWeight: 700, minWidth: 16, height: 16, borderRadius: 8,
                                }
                            }}>
                                <NotificationsIcon sx={{ fontSize: 19 }} />
                            </Badge>
                        </IconButton>
                    </Tooltip>

                    {/* Profile avatar */}
                    <Tooltip title="Account settings">
                        <IconButton onClick={handleProfileMenuOpen} sx={{
                            p: 0.3, borderRadius: '10px',
                            border: `1px solid ${T.border}`,
                            '&:hover': { borderColor: T.accent },
                            transition: 'border-color 0.18s ease',
                        }}>
                            <Avatar sx={{
                                width: 30, height: 30, borderRadius: '8px',
                                bgcolor: T.accentSoft, color: T.accent,
                                fontWeight: 700, fontSize: '0.75rem',
                                fontFamily: 'Plus Jakarta Sans',
                            }}>
                                {getInitials()}
                            </Avatar>
                        </IconButton>
                    </Tooltip>
                </Toolbar>
            </AppBar>

            {/* ── Notifications panel ── */}
            <Menu
                anchorEl={notificationAnchorEl}
                open={Boolean(notificationAnchorEl)}
                onClose={handleNotificationClose}
                PaperProps={{
                    elevation: 0,
                    sx: {
                        width: 380, maxWidth: '92vw', maxHeight: '80vh',
                        borderRadius: '14px', mt: 1,
                        border: `1px solid ${T.border}`,
                        boxShadow: '0 8px 40px rgba(15,31,61,0.10)',
                        overflow: 'hidden',
                    }
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
                {/* Header */}
                <Box sx={{
                    px: 2.5, py: 2, bgcolor: T.surface, borderBottom: `1px solid ${T.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: T.text }}>
                            Notifications
                        </Typography>
                        {unreadCount > 0 && (
                            <Chip label={unreadCount} size="small" sx={{
                                height: 20, fontSize: '0.68rem', fontWeight: 700,
                                bgcolor: T.accentSoft, color: T.accent,
                            }} />
                        )}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Refresh">
                            <IconButton size="small" onClick={handleRefreshNotifications} disabled={refreshing}
                                        sx={{ color: T.muted, '&:hover': { color: T.accent, bgcolor: T.accentSoft } }}>
                                {refreshing ? <CircularProgress size={15} /> : <ScheduleIcon sx={{ fontSize: 17 }} />}
                            </IconButton>
                        </Tooltip>
                        {unreadCount > 0 && (
                            <Tooltip title="Mark all as read">
                                <IconButton size="small" onClick={handleMarkAllAsRead}
                                            sx={{ color: T.muted, '&:hover': { color: T.green, bgcolor: '#D1FAE5' } }}>
                                    <CheckIcon sx={{ fontSize: 17 }} />
                                </IconButton>
                            </Tooltip>
                        )}
                    </Box>
                </Box>

                {notificationError && (
                    <Alert severity="error" sx={{ m: 2, borderRadius: '8px', fontSize: '0.8rem' }}>
                        {notificationError}
                    </Alert>
                )}

                {/* List */}
                <Box sx={{ maxHeight: 380, overflow: 'auto', bgcolor: T.bg }}>
                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                            <CircularProgress size={28} sx={{ color: T.accent }} />
                        </Box>
                    ) : notifications.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 6 }}>
                            <NotificationsIcon sx={{ fontSize: 40, color: T.border, mb: 1 }} />
                            <Typography sx={{ fontSize: '0.83rem', color: T.muted }}>No notifications yet</Typography>
                        </Box>
                    ) : (
                        <List disablePadding>
                            {notifications.slice(0, 10).map((n, i) => (
                                <React.Fragment key={n.notification_id || i}>
                                    <ListItem
                                        onClick={(e) => handleMarkAsRead(n.notification_id, e)}
                                        sx={{
                                            px: 2.5, py: 1.5, cursor: 'pointer',
                                            bgcolor: n.is_read ? 'transparent' : T.accentSoft,
                                            borderLeft: n.is_read ? '3px solid transparent' : `3px solid ${T.accent}`,
                                            '&:hover': { bgcolor: n.is_read ? T.bg : '#DDE9FF' },
                                            transition: 'background-color 0.15s ease',
                                        }}
                                    >
                                        <ListItemAvatar sx={{ minWidth: 44 }}>
                                            <Avatar sx={{
                                                width: 34, height: 34, borderRadius: '10px',
                                                bgcolor: n.is_read ? T.border : T.surface,
                                                border: `1px solid ${n.is_read ? T.border : T.accentSoft}`,
                                            }}>
                                                {getNotificationIcon(n.title)}
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={
                                                <Typography sx={{
                                                    fontWeight: n.is_read ? 500 : 700,
                                                    fontSize: '0.82rem',
                                                    color: n.is_read ? T.text : T.accent,
                                                }}>
                                                    {n.title || 'Notification'}
                                                </Typography>
                                            }
                                            secondary={
                                                <Box>
                                                    <Typography sx={{
                                                        fontSize: '0.77rem', color: T.muted,
                                                        display: '-webkit-box', WebkitLineClamp: 2,
                                                        WebkitBoxOrient: 'vertical', overflow: 'hidden', mb: 0.5,
                                                    }}>
                                                        {n.message || 'No message'}
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                        <Typography sx={{ fontSize: '0.7rem', color: T.muted, display: 'flex', alignItems: 'center', gap: 0.4 }}>
                                                            <ScheduleIcon sx={{ fontSize: 11 }} />
                                                            {getTimeAgo(n.created_at)}
                                                        </Typography>
                                                        {!n.is_read && (
                                                            <IconButton size="small"
                                                                        onClick={(e) => { e.stopPropagation(); handleMarkAsRead(n.notification_id, e); }}
                                                                        sx={{ color: T.accent, p: 0.4, '&:hover': { bgcolor: T.accentSoft } }}>
                                                                <CheckIcon sx={{ fontSize: 13 }} />
                                                            </IconButton>
                                                        )}
                                                    </Box>
                                                </Box>
                                            }
                                        />
                                    </ListItem>
                                    {i < Math.min(notifications.length, 10) - 1 && (
                                        <Divider sx={{ borderColor: T.border }} />
                                    )}
                                </React.Fragment>
                            ))}
                        </List>
                    )}
                </Box>

                {/* Footer */}
                {notifications.length > 0 && (
                    <Box sx={{ px: 2.5, py: 2, bgcolor: T.surface, borderTop: `1px solid ${T.border}` }}>
                        <Button fullWidth size="small" onClick={handleNotificationClose} sx={{
                            borderRadius: '8px', textTransform: 'none', fontWeight: 600,
                            fontFamily: 'Plus Jakarta Sans', fontSize: '0.8rem',
                            color: T.accent, border: `1px solid ${T.border}`, bgcolor: T.bg,
                            '&:hover': { bgcolor: T.accentSoft, borderColor: T.accent },
                        }}>
                            View All Notifications
                        </Button>
                    </Box>
                )}
            </Menu>

            {/* ── Profile menu ── */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                PaperProps={{
                    elevation: 0,
                    sx: {
                        width: 190, borderRadius: '12px', mt: 1,
                        border: `1px solid ${T.border}`,
                        boxShadow: '0 8px 30px rgba(15,31,61,0.10)',
                    }
                }}
            >
                <Box sx={{ px: 2, py: 1.5, borderBottom: `1px solid ${T.border}` }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.82rem', color: T.text }}>{getInitials()}</Typography>
                    <Typography sx={{ fontSize: '0.7rem', color: T.muted }}>Administrator</Typography>
                </Box>
                <MenuItem onClick={handleMenuClose} sx={{ gap: 1.5, py: 1.2, '&:hover': { bgcolor: T.accentSoft } }}>
                    <AccountCircle sx={{ fontSize: 18, color: T.muted }} />
                    <Typography sx={{ fontSize: '0.83rem', fontWeight: 500, color: T.text }}>Profile</Typography>
                </MenuItem>
                <MenuItem onClick={handleMenuClose} sx={{ gap: 1.5, py: 1.2, '&:hover': { bgcolor: T.accentSoft } }}>
                    <Settings sx={{ fontSize: 18, color: T.muted }} />
                    <Typography sx={{ fontSize: '0.83rem', fontWeight: 500, color: T.text }}>Settings</Typography>
                </MenuItem>
                <Divider sx={{ borderColor: T.border }} />
                <MenuItem onClick={handleLogout} sx={{ gap: 1.5, py: 1.2, '&:hover': { bgcolor: '#FEE2E2' } }}>
                    <Logout sx={{ fontSize: 18, color: T.rose }} />
                    <Typography sx={{ fontSize: '0.83rem', fontWeight: 500, color: T.rose }}>Logout</Typography>
                </MenuItem>
            </Menu>
        </>
    );
};

export default Navbar;