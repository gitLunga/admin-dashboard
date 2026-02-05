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
    alpha,
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
import { styled } from '@mui/material/styles';
import { notificationsAPI } from '../../services/api'; // Your existing API
import { formatDistanceToNow, parseISO } from 'date-fns';

const Search = styled('div')(({ theme }) => ({
    position: 'relative',
    borderRadius: theme.shape.borderRadius,
    backgroundColor: alpha(theme.palette.common.white, 0.15),
    '&:hover': {
        backgroundColor: alpha(theme.palette.common.white, 0.25),
    },
    marginLeft: 0,
    marginRight: theme.spacing(2),
    width: '100%',
    [theme.breakpoints.up('sm')]: {
        marginLeft: theme.spacing(3),
        width: 'auto',
    },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
    padding: theme.spacing(0, 2),
    height: '100%',
    position: 'absolute',
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
    color: 'inherit',
    '& .MuiInputBase-input': {
        padding: theme.spacing(1, 1, 1, 0),
        paddingLeft: `calc(1em + ${theme.spacing(4)})`,
        transition: theme.transitions.create('width'),
        width: '100%',
        [theme.breakpoints.up('md')]: {
            width: '20ch',
        },
    },
}));

const Navbar = ({ onDrawerToggle }) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const [notificationAnchorEl, setNotificationAnchorEl] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Notification states
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [notificationError, setNotificationError] = useState(null);

    // Fetch notifications and unread count
    const fetchNotifications = async () => {
        try {
            setLoading(true);
            setNotificationError(null);

            // Get current admin user
            const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
            const adminId = adminUser.op_user_id || adminUser.id;

            if (!adminId) {
                console.warn('No admin user ID found');
                setNotifications([]);
                setUnreadCount(0);
                return;
            }

            // FIX: Call the correct functions with parameters
            const [notificationsRes, unreadRes] = await Promise.all([
                notificationsAPI.getUserNotifications(adminId, 'Operational'), // Get notifications for THIS admin
                notificationsAPI.getUnreadCount(adminId, 'Operational')        // Get unread count for THIS admin
            ]);

            console.log('Notifications response:', notificationsRes.data);
            console.log('Unread count response:', unreadRes.data);

            // Handle the response format your backend returns
            // Your backend returns: { success: true, data: [...], count: X }
            setNotifications(notificationsRes.data.data || []);
            setUnreadCount(unreadRes.data.unreadCount || 0);

        } catch (error) {
            console.error('Error fetching notifications:', error);
            setNotificationError(error.message || 'Failed to load notifications');
            setNotifications([]);
            setUnreadCount(0);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        // Initial fetch
        fetchNotifications();

        // Set up polling for real-time updates every 30 seconds
        const interval = setInterval(fetchNotifications, 100000);

        return () => clearInterval(interval);
    }, []);

    const handleProfileMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleNotificationClick = (event) => {
        setNotificationAnchorEl(event.currentTarget);
        fetchNotifications(); // Refresh when opening
    };

    const handleNotificationClose = () => {
        setNotificationAnchorEl(null);
    };

    const handleSearch = (e) => {
        if (e.key === 'Enter' && searchTerm.trim().length >= 2) {
            window.location.href = `/search?q=${encodeURIComponent(searchTerm)}`;
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        window.location.href = '/login';
    };

    const handleMarkAsRead = async (notificationId, event) => {
        event?.stopPropagation();
        try {
            const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
            const adminId = adminUser.op_user_id || adminUser.id;

            if (!adminId) return;

            // FIX: Pass all required parameters
            await notificationsAPI.markAsRead(notificationId, adminId, 'Operational');

            // Update local state
            setNotifications(prev =>
                prev.map(notification =>
                    notification.notification_id === notificationId
                        ? { ...notification, is_read: true }
                        : notification
                )
            );

            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
            const adminId = adminUser.op_user_id || adminUser.id;

            if (!adminId) return;

            // FIX: Use the correct API function
            await notificationsAPI.markAllAsRead(adminId, 'Operational');

            // Update local state
            setNotifications(prev =>
                prev.map(notification => ({
                    ...notification,
                    is_read: true
                }))
            );

            setUnreadCount(0);
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const handleRefreshNotifications = () => {
        setRefreshing(true);
        fetchNotifications();
    };

    const getNotificationIcon = (title) => {
        if (!title) return <InfoIcon color="info" />;

        const lowerTitle = title.toLowerCase();
        if (lowerTitle.includes('warning') || lowerTitle.includes('alert')) {
            return <WarningIcon color="warning" />;
        }
        if (lowerTitle.includes('error') || lowerTitle.includes('failed')) {
            return <ErrorIcon color="error" />;
        }
        if (lowerTitle.includes('success') || lowerTitle.includes('completed')) {
            return <CheckCircleIcon color="success" />;
        }
        return <InfoIcon color="info" />;
    };

    const getTimeAgo = (dateString) => {
        if (!dateString) return '';
        try {
            return formatDistanceToNow(parseISO(dateString), { addSuffix: true });
        } catch (error) {
            return '';
        }
    };

    const getInitials = () => {
        const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
        const name = adminUser.name || 'Admin';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    };

    // Add token to API requests
    useEffect(() => {
        // Add authorization token to all requests
        const token = localStorage.getItem('adminToken');
        if (token) {
            // This should already be handled by your axios interceptors in services/api.js
            // If not, you can add it here:
            notificationsAPI.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
    }, []);

    return (
        <>
            <AppBar
                position="fixed"
                sx={{
                    width: { sm: `calc(100% - 240px)` },
                    ml: { sm: `240px` },
                    zIndex: (theme) => theme.zIndex.drawer + 1,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)',
                }}
            >
                <Toolbar>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        edge="start"
                        onClick={onDrawerToggle}
                        sx={{ mr: 2, display: { sm: 'none' } }}
                    >
                        <MenuIcon />
                    </IconButton>

                    <Typography
                        variant="h6"
                        noWrap
                        component="div"
                        sx={{
                            flexGrow: 1,
                            display: { xs: 'none', sm: 'block' },
                            fontWeight: 700,
                            letterSpacing: '0.5px',
                        }}
                    >
                        Admin Dashboard
                    </Typography>

                    <Search>
                        <SearchIconWrapper>
                            <SearchIcon />
                        </SearchIconWrapper>
                        <StyledInputBase
                            placeholder="Search users…"
                            inputProps={{ 'aria-label': 'search' }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyPress={handleSearch}
                        />
                    </Search>

                    <Box sx={{ flexGrow: 0, display: 'flex', alignItems: 'center', gap: 1 }}>
                        {/* Enhanced Notification Bell */}
                        <Tooltip title="Notifications">
                            <IconButton
                                color="inherit"
                                onClick={handleNotificationClick}
                                sx={{
                                    position: 'relative',
                                    background: 'rgba(255,255,255,0.1)',
                                    width: 44,
                                    height: 44,
                                    borderRadius: 2,
                                    '&:hover': {
                                        background: 'rgba(255,255,255,0.2)',
                                        transform: 'translateY(-1px)',
                                    },
                                    transition: 'all 0.2s ease',
                                }}
                            >
                                <Badge
                                    badgeContent={unreadCount}
                                    color="error"
                                    sx={{
                                        '& .MuiBadge-badge': {
                                            fontSize: '0.65rem',
                                            fontWeight: 'bold',
                                            minWidth: '18px',
                                            height: '18px',
                                            borderRadius: '9px',
                                            animation: unreadCount > 0 ? 'pulse 2s infinite' : 'none',
                                            boxShadow: '0 0 0 2px rgba(102, 126, 234, 0.8)',
                                        }
                                    }}
                                >
                                    <NotificationsIcon />
                                </Badge>
                            </IconButton>
                        </Tooltip>

                        {/* User Profile */}
                        <Tooltip title="Account settings">
                            <IconButton
                                onClick={handleProfileMenuOpen}
                                sx={{
                                    p: 0,
                                    ml: 1,
                                    background: 'rgba(255,255,255,0.1)',
                                    width: 44,
                                    height: 44,
                                    borderRadius: 2,
                                    '&:hover': {
                                        background: 'rgba(255,255,255,0.2)',
                                        transform: 'translateY(-1px)',
                                    },
                                    transition: 'all 0.2s ease',
                                }}
                            >
                                <Avatar
                                    alt="Admin User"
                                    sx={{
                                        background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)',
                                        color: '#667eea',
                                        fontWeight: 700,
                                        fontSize: '0.9rem',
                                    }}
                                >
                                    {getInitials()}
                                </Avatar>
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Toolbar>
            </AppBar>

            {/* Enhanced Notifications Menu */}
            <Menu
                anchorEl={notificationAnchorEl}
                open={Boolean(notificationAnchorEl)}
                onClose={handleNotificationClose}
                PaperProps={{
                    sx: {
                        width: 400,
                        maxWidth: '90vw',
                        maxHeight: '80vh',
                        borderRadius: 2,
                        boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                        border: '1px solid rgba(0,0,0,0.08)',
                        overflow: 'hidden',
                        mt: 1,
                    }
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
                {/* Header */}
                <Box sx={{
                    p: 2,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="h6" fontWeight={700}>
                            Notifications
                            {unreadCount > 0 && (
                                <Chip
                                    label={`${unreadCount} unread`}
                                    size="small"
                                    sx={{
                                        ml: 1,
                                        fontSize: '0.7rem',
                                        height: 20,
                                        fontWeight: 600,
                                        background: 'rgba(255,255,255,0.2)',
                                        color: 'white',
                                    }}
                                />
                            )}
                        </Typography>
                        <Box display="flex" gap={0.5}>
                            <Tooltip title="Refresh">
                                <IconButton
                                    size="small"
                                    onClick={handleRefreshNotifications}
                                    disabled={refreshing}
                                    sx={{
                                        color: 'white',
                                        background: 'rgba(255,255,255,0.1)',
                                        '&:hover': { background: 'rgba(255,255,255,0.2)' }
                                    }}
                                >
                                    {refreshing ? (
                                        <CircularProgress size={18} color="inherit" />
                                    ) : (
                                        <ScheduleIcon fontSize="small" />
                                    )}
                                </IconButton>
                            </Tooltip>
                            {unreadCount > 0 && (
                                <Tooltip title="Mark all as read">
                                    <IconButton
                                        size="small"
                                        onClick={handleMarkAllAsRead}
                                        sx={{
                                            color: 'white',
                                            background: 'rgba(255,255,255,0.1)',
                                            '&:hover': { background: 'rgba(255,255,255,0.2)' }
                                        }}
                                    >
                                        <CheckIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            )}
                        </Box>
                    </Box>
                </Box>

                {/* Error Alert */}
                {notificationError && (
                    <Alert
                        severity="error"
                        sx={{
                            m: 2,
                            borderRadius: 1,
                            '& .MuiAlert-icon': { animation: 'pulse 1s infinite' }
                        }}
                    >
                        {notificationError}
                    </Alert>
                )}

                {/* Notifications List */}
                <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                    {loading ? (
                        <Box display="flex" justifyContent="center" p={4}>
                            <CircularProgress />
                        </Box>
                    ) : notifications.length === 0 ? (
                        <Box textAlign="center" p={4}>
                            <NotificationsIcon
                                sx={{
                                    fontSize: 48,
                                    color: 'text.secondary',
                                    opacity: 0.3,
                                    mb: 2
                                }}
                            />
                            <Typography variant="body2" color="textSecondary">
                                No notifications yet
                            </Typography>
                        </Box>
                    ) : (
                        <List dense sx={{ p: 0 }}>
                            {notifications.slice(0, 10).map((notification, index) => {
                                // Extract user info from notification
                                // const userName = notification.user_first_name
                                //     ? `${notification.user_first_name} ${notification.user_last_name}`
                                //     : `User #${notification.user_id}`;

                                return (
                                    <React.Fragment key={notification.notification_id || index}>
                                        <ListItem
                                            sx={{
                                                px: 2,
                                                py: 1.5,
                                                background: notification.is_read
                                                    ? 'transparent'
                                                    : 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
                                                borderLeft: notification.is_read
                                                    ? 'none'
                                                    : '4px solid #667eea',
                                                transition: 'all 0.2s ease',
                                                '&:hover': {
                                                    background: notification.is_read
                                                        ? 'rgba(0,0,0,0.02)'
                                                        : 'linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%)',
                                                },
                                                cursor: 'pointer',
                                            }}
                                            onClick={(e) => handleMarkAsRead(notification.notification_id, e)}
                                        >
                                            <ListItemAvatar sx={{ minWidth: 48 }}>
                                                <Avatar
                                                    sx={{
                                                        background: notification.is_read
                                                            ? 'rgba(0,0,0,0.08)'
                                                            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                        color: notification.is_read ? 'text.primary' : 'white',
                                                        width: 36,
                                                        height: 36,
                                                    }}
                                                >
                                                    {getNotificationIcon(notification.title)}
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={
                                                    <Typography
                                                        variant="subtitle2"
                                                        fontWeight={notification.is_read ? 500 : 700}
                                                        sx={{
                                                            color: notification.is_read ? 'text.primary' : '#667eea',
                                                        }}
                                                    >
                                                        {notification.title || 'Notification'}
                                                    </Typography>
                                                }
                                                secondary={
                                                    <>
                                                        <Typography
                                                            variant="body2"
                                                            color="text.secondary"
                                                            sx={{
                                                                display: '-webkit-box',
                                                                WebkitLineClamp: 2,
                                                                WebkitBoxOrient: 'vertical',
                                                                overflow: 'hidden',
                                                                mb: 0.5,
                                                            }}
                                                        >
                                                            {notification.message || 'No message'}
                                                        </Typography>
                                                        <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap">
                                                            <Box display="flex" alignItems="center" gap={1}>
                                                                <Typography
                                                                    variant="caption"
                                                                    color="text.secondary"
                                                                    display="flex"
                                                                    alignItems="center"
                                                                    gap={0.5}
                                                                >
                                                                    <ScheduleIcon fontSize="inherit" />
                                                                    {getTimeAgo(notification.created_at)}
                                                                </Typography>
                                                                {notification.user_first_name && (
                                                                    <Chip
                                                                        label={`${notification.user_first_name} ${notification.user_last_name}`}
                                                                        size="small"
                                                                        variant="outlined"
                                                                        sx={{
                                                                            height: 20,
                                                                            fontSize: '0.7rem',
                                                                            borderColor: '#667eea',
                                                                            color: '#667eea'
                                                                        }}
                                                                    />
                                                                )}
                                                            </Box>
                                                            {!notification.is_read && (
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleMarkAsRead(notification.notification_id, e);
                                                                    }}
                                                                    sx={{
                                                                        color: '#667eea',
                                                                        '&:hover': {
                                                                            background: 'rgba(102, 126, 234, 0.1)',
                                                                        }
                                                                    }}
                                                                >
                                                                    <CheckIcon fontSize="small" />
                                                                </IconButton>
                                                            )}
                                                        </Box>
                                                    </>
                                                }
                                            />
                                        </ListItem>
                                        {index < notifications.length - 1 && index < 9 && (
                                            <Divider sx={{ mx: 2 }} />
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </List>
                    )}
                </Box>
                {/* Footer */}
                {notifications.length > 0 && (
                    <Box sx={{
                        p: 2,
                        borderTop: '1px solid rgba(0,0,0,0.08)',
                        background: 'rgba(0,0,0,0.02)',
                    }}>
                        <Button
                            fullWidth
                            variant="outlined"
                            size="small"
                            onClick={handleNotificationClose}
                            sx={{
                                borderRadius: 1,
                                textTransform: 'none',
                                fontWeight: 600,
                                borderColor: 'rgba(102, 126, 234, 0.3)',
                                color: '#667eea',
                                '&:hover': {
                                    borderColor: '#667eea',
                                    background: 'rgba(102, 126, 234, 0.05)',
                                }
                            }}
                        >
                            View All Notifications
                        </Button>
                    </Box>
                )}
            </Menu>

            {/* Profile Menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                PaperProps={{
                    sx: {
                        width: 200,
                        borderRadius: 2,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                        border: '1px solid rgba(0,0,0,0.08)',
                    }
                }}
            >
                <MenuItem onClick={handleMenuClose}>
                    <AccountCircle sx={{ mr: 2, color: '#667eea' }} />
                    <Typography variant="body2" fontWeight={500}>
                        Profile
                    </Typography>
                </MenuItem>
                <MenuItem onClick={handleMenuClose}>
                    <Settings sx={{ mr: 2, color: '#667eea' }} />
                    <Typography variant="body2" fontWeight={500}>
                        Settings
                    </Typography>
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout} sx={{ color: '#ef4444' }}>
                    <Logout sx={{ mr: 2 }} />
                    <Typography variant="body2" fontWeight={500}>
                        Logout
                    </Typography>
                </MenuItem>
            </Menu>
        </>
    );
};

export default Navbar;