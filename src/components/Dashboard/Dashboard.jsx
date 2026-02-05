import React, { useState, useEffect } from 'react';
import {
    Grid,
    Paper,
    Typography,
    Box,
    CircularProgress,
    Alert,
    Button,
    Skeleton,
} from '@mui/material';
import { adminAPI } from '../../services/api';
import StatsCard from './StatsCard';
import RecentRegistrations from './RecentRegistrations';
import {
    People as PeopleIcon,
    Person as PersonIcon,
    Group as GroupIcon,
    Assignment as AssignmentIcon,
    CheckCircle as VerifiedIcon,
    PendingActions as PendingIcon,
    Block as RejectedIcon,
    Refresh as RefreshIcon,
    TrendingUp as TrendingUpIcon,
    EmojiEvents as TrophyIcon,
    Timeline as TimelineIcon,
} from '@mui/icons-material';

const Dashboard = () => {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await adminAPI.getDashboardData();
            console.log(response);

            const data = response.data.data;
            setDashboardData(data);

        } catch (err) {
            console.error('❌ Dashboard fetch error:', err);

            const errorMessage = err.response?.data?.message ||
                err.message ||
                'Failed to load dashboard data';

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{
                p: 3,
                background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                minHeight: '100vh'
            }}>
                <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    mb={3}
                    sx={{ animation: 'fadeInUp 0.5s ease-out' }}
                >
                    <Skeleton
                        variant="text"
                        width={200}
                        height={40}
                        sx={{
                            bgcolor: 'rgba(255,255,255,0.5)',
                            borderRadius: 2,
                            backdropFilter: 'blur(10px)'
                        }}
                    />
                    <Skeleton
                        variant="rectangular"
                        width={100}
                        height={36}
                        sx={{
                            borderRadius: 8,
                            bgcolor: 'rgba(255,255,255,0.5)',
                            backdropFilter: 'blur(10px)'
                        }}
                    />
                </Box>
                <Grid container spacing={3}>
                    {[1,2,3,4].map(i => (
                        <Grid item xs={12} sm={6} md={3} key={i}>
                            <Box sx={{ position: 'relative' }}>
                                <Skeleton
                                    variant="rectangular"
                                    height={120}
                                    sx={{
                                        borderRadius: 4,
                                        bgcolor: 'rgba(255,255,255,0.7)',
                                        backdropFilter: 'blur(10px)',
                                        border: '1px solid rgba(255,255,255,0.2)',
                                    }}
                                />
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                                        animation: 'shimmer 2s infinite',
                                    }}
                                />
                            </Box>
                        </Grid>
                    ))}
                </Grid>
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{
                p: 3,
                background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center'
            }}>
                <Box sx={{
                    maxWidth: 500,
                    animation: 'fadeInUp 0.5s ease-out'
                }}>
                    <Alert
                        severity="error"
                        sx={{
                            mb: 3,
                            borderRadius: 3,
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            '& .MuiAlert-icon': {
                                animation: 'pulse 1s infinite'
                            }
                        }}
                    >
                        {error}
                    </Alert>
                    <Button
                        variant="contained"
                        onClick={fetchDashboardData}
                        startIcon={<RefreshIcon />}
                        sx={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            borderRadius: 8,
                            px: 3,
                            py: 1,
                            textTransform: 'none',
                            fontWeight: 600,
                            boxShadow: '0 4px 14px 0 rgba(102, 126, 234, 0.3)',
                            '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: '0 8px 20px 0 rgba(102, 126, 234, 0.4)',
                            }
                        }}
                    >
                        Try Again
                    </Button>
                </Box>
            </Box>
        );
    }

    if (!dashboardData) {
        return (
            <Box sx={{
                p: 3,
                background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                minHeight: '100vh'
            }}>
                <Alert
                    severity="warning"
                    sx={{
                        m: 3,
                        borderRadius: 3,
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        animation: 'fadeInUp 0.5s ease-out'
                    }}
                >
                    No dashboard data available
                </Alert>
            </Box>
        );
    }

    // Destructure the data from your backend
    const {
        statistics,
        recent_registrations,
        activity_summary
    } = dashboardData;

    // Calculate derived stats
    const getDerivedStats = () => {
        if (!statistics) return null;

        const clientStats = statistics.client_users?.stats || [];
        const verifiedCount = clientStats.find(s => s.registration_status === 'Verified')?.count || 0;
        const pendingCount = clientStats.find(s => s.registration_status === 'Pending')?.count || 0;
        const rejectedCount = clientStats.find(s => s.registration_status === 'Rejected')?.count || 0;

        return {
            total_users: statistics.total_users || 0,
            client_users: statistics.client_users?.total || 0,
            operational_users: statistics.operational_users?.total || 0,
            verified_users: verifiedCount,
            pending_users: pendingCount,
            rejected_users: rejectedCount,
            active_contracts: activity_summary?.active_contracts || 0,
        };
    };

    const derivedStats = getDerivedStats();

    return (
        <Box sx={{
            flexGrow: 1,
            p: 3,
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
            minHeight: '100vh'
        }}>
            {/* Header */}
            <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={4}
                sx={{
                    animation: 'fadeInUp 0.5s ease-out',
                    position: 'relative'
                }}
            >
                <Box>
                    <Typography
                        variant="h3"
                        sx={{
                            fontWeight: 800,
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
                            mb: 0.5
                        }}
                    >
                        Dashboard Overview
                    </Typography>
                    <Typography
                        variant="subtitle1"
                        sx={{
                            color: 'text.secondary',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                        }}
                    >
                        <TimelineIcon fontSize="small" />
                        Real-time system insights and analytics
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    onClick={fetchDashboardData}
                    startIcon={<RefreshIcon />}
                    size="medium"
                    sx={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        borderRadius: 8,
                        px: 3,
                        py: 1,
                        textTransform: 'none',
                        fontWeight: 600,
                        boxShadow: '0 4px 14px 0 rgba(102, 126, 234, 0.3)',
                        '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: '0 8px 20px 0 rgba(102, 126, 234, 0.4)',
                        },
                        animation: 'pulse 3s infinite'
                    }}
                >
                    Refresh Data
                </Button>
            </Box>

            {/* Stats Grid */}
            <Grid container spacing={3}>
                {/* Stats Cards with Modern Styling */}
                <Grid item xs={12} sm={6} md={3}>
                    <Box
                        sx={{
                            animation: 'fadeInUp 0.5s ease-out 0.1s both',
                            opacity: 0,
                            transform: 'translateY(20px)',
                        }}
                    >
                        <Paper
                            className="hover-lift"
                            sx={{
                                p: 3,
                                height: '100%',
                                borderRadius: 4,
                                background: 'rgba(255, 255, 255, 0.9)',
                                backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                position: 'relative',
                                overflow: 'hidden',
                                '&:before': {
                                    content: '""',
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    height: 4,
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                },
                                boxShadow: '0 8px 32px rgba(102, 126, 234, 0.1)',
                            }}
                        >
                            <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                                <Box>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            fontWeight: 600,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px',
                                            fontSize: '0.75rem',
                                            color: '#667eea'
                                        }}
                                    >
                                        Total Users
                                    </Typography>
                                    <Typography
                                        variant="h2"
                                        sx={{
                                            fontWeight: 800,
                                            mt: 1,
                                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent',
                                        }}
                                    >
                                        {derivedStats?.total_users || 0}
                                    </Typography>
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            color: 'text.secondary',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 0.5,
                                            mt: 0.5
                                        }}
                                    >
                                        <TrendingUpIcon fontSize="small" />
                                        All registered users in system
                                    </Typography>
                                </Box>
                                <Box
                                    sx={{
                                        p: 1.5,
                                        borderRadius: 3,
                                        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                                    }}
                                >
                                    <PeopleIcon sx={{ fontSize: 28, color: '#667eea' }} />
                                </Box>
                            </Box>
                        </Paper>
                    </Box>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Box
                        sx={{
                            animation: 'fadeInUp 0.5s ease-out 0.2s both',
                            opacity: 0,
                            transform: 'translateY(20px)',
                        }}
                    >
                        <Paper
                            className="hover-lift"
                            sx={{
                                p: 3,
                                height: '100%',
                                borderRadius: 4,
                                background: 'rgba(255, 255, 255, 0.9)',
                                backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                position: 'relative',
                                overflow: 'hidden',
                                '&:before': {
                                    content: '""',
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    height: 4,
                                    background: 'linear-gradient(135deg, #4ade80 0%, #22d3ee 100%)',
                                },
                                boxShadow: '0 8px 32px rgba(74, 222, 128, 0.1)',
                            }}
                        >
                            <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                                <Box>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            fontWeight: 600,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px',
                                            fontSize: '0.75rem',
                                            color: '#4ade80'
                                        }}
                                    >
                                        Client Users
                                    </Typography>
                                    <Typography
                                        variant="h2"
                                        sx={{
                                            fontWeight: 800,
                                            mt: 1,
                                            background: 'linear-gradient(135deg, #4ade80 0%, #22d3ee 100%)',
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent',
                                        }}
                                    >
                                        {derivedStats?.client_users || 0}
                                    </Typography>
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            color: 'text.secondary',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 0.5,
                                            mt: 0.5
                                        }}
                                    >
                                        <TrendingUpIcon fontSize="small" />
                                        Judicial system users
                                    </Typography>
                                </Box>
                                <Box
                                    sx={{
                                        p: 1.5,
                                        borderRadius: 3,
                                        background: 'linear-gradient(135deg, rgba(74, 222, 128, 0.1) 0%, rgba(34, 211, 238, 0.1) 100%)',
                                    }}
                                >
                                    <PersonIcon sx={{ fontSize: 28, color: '#4ade80' }} />
                                </Box>
                            </Box>
                        </Paper>
                    </Box>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Box
                        sx={{
                            animation: 'fadeInUp 0.5s ease-out 0.3s both',
                            opacity: 0,
                            transform: 'translateY(20px)',
                        }}
                    >
                        <Paper
                            className="hover-lift"
                            sx={{
                                p: 3,
                                height: '100%',
                                borderRadius: 4,
                                background: 'rgba(255, 255, 255, 0.9)',
                                backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                position: 'relative',
                                overflow: 'hidden',
                                '&:before': {
                                    content: '""',
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    height: 4,
                                    background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
                                },
                                boxShadow: '0 8px 32px rgba(245, 158, 11, 0.1)',
                            }}
                        >
                            <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                                <Box>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            fontWeight: 600,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px',
                                            fontSize: '0.75rem',
                                            color: '#f59e0b'
                                        }}
                                    >
                                        Operational Users
                                    </Typography>
                                    <Typography
                                        variant="h2"
                                        sx={{
                                            fontWeight: 800,
                                            mt: 1,
                                            background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent',
                                        }}
                                    >
                                        {derivedStats?.operational_users || 0}
                                    </Typography>
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            color: 'text.secondary',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 0.5,
                                            mt: 0.5
                                        }}
                                    >
                                        <TrendingUpIcon fontSize="small" />
                                        Admin & staff users
                                    </Typography>
                                </Box>
                                <Box
                                    sx={{
                                        p: 1.5,
                                        borderRadius: 3,
                                        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(239, 68, 68, 0.1) 100%)',
                                    }}
                                >
                                    <GroupIcon sx={{ fontSize: 28, color: '#f59e0b' }} />
                                </Box>
                            </Box>
                        </Paper>
                    </Box>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Box
                        sx={{
                            animation: 'fadeInUp 0.5s ease-out 0.4s both',
                            opacity: 0,
                            transform: 'translateY(20px)',
                        }}
                    >
                        <Paper
                            className="hover-lift"
                            sx={{
                                p: 3,
                                height: '100%',
                                borderRadius: 4,
                                background: 'rgba(255, 255, 255, 0.9)',
                                backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                position: 'relative',
                                overflow: 'hidden',
                                '&:before': {
                                    content: '""',
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    height: 4,
                                    background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
                                },
                                boxShadow: '0 8px 32px rgba(139, 92, 246, 0.1)',
                            }}
                        >
                            <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                                <Box>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            fontWeight: 600,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px',
                                            fontSize: '0.75rem',
                                            color: '#8b5cf6'
                                        }}
                                    >
                                        Active Contracts
                                    </Typography>
                                    <Typography
                                        variant="h2"
                                        sx={{
                                            fontWeight: 800,
                                            mt: 1,
                                            background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent',
                                        }}
                                    >
                                        {derivedStats?.active_contracts || 0}
                                    </Typography>
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            color: 'text.secondary',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 0.5,
                                            mt: 0.5
                                        }}
                                    >
                                        <TrendingUpIcon fontSize="small" />
                                        Active service contracts
                                    </Typography>
                                </Box>
                                <Box
                                    sx={{
                                        p: 1.5,
                                        borderRadius: 3,
                                        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%)',
                                    }}
                                >
                                    <AssignmentIcon sx={{ fontSize: 28, color: '#8b5cf6' }} />
                                </Box>
                            </Box>
                        </Paper>
                    </Box>
                </Grid>

                {/* Recent Registrations */}
                <Grid item xs={12} md={8}>
                    <Paper
                        className="hover-lift"
                        sx={{
                            p: 3,
                            height: '100%',
                            borderRadius: 4,
                            background: 'rgba(255, 255, 255, 0.9)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            animation: 'fadeInUp 0.6s ease-out 0.5s both',
                            opacity: 0,
                            transform: 'translateY(20px)',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                        }}
                    >
                        <Typography
                            variant="h6"
                            gutterBottom
                            sx={{
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 2,
                                mb: 3
                            }}
                        >
                            <Box
                                sx={{
                                    width: 4,
                                    height: 32,
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    borderRadius: 2
                                }}
                            />
                            <Box>
                                Recent Registrations
                                <Typography variant="caption" display="block" color="textSecondary">
                                    Last 7 Days Activity
                                </Typography>
                            </Box>
                        </Typography>
                        <RecentRegistrations
                            data={recent_registrations || []}
                        />
                    </Paper>
                </Grid>

                {/* Client User Status Distribution */}
                <Grid item xs={12} md={4}>
                    <Paper
                        className="hover-lift"
                        sx={{
                            p: 3,
                            height: '100%',
                            borderRadius: 4,
                            background: 'rgba(255, 255, 255, 0.9)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            animation: 'fadeInUp 0.6s ease-out 0.6s both',
                            opacity: 0,
                            transform: 'translateY(20px)',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                        }}
                    >
                        <Typography
                            variant="h6"
                            gutterBottom
                            sx={{
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 2,
                                mb: 3
                            }}
                        >
                            <Box
                                sx={{
                                    width: 4,
                                    height: 32,
                                    background: 'linear-gradient(135deg, #4ade80 0%, #22d3ee 100%)',
                                    borderRadius: 2
                                }}
                            />
                            <Box>
                                Client User Status
                                <Typography variant="caption" display="block" color="textSecondary">
                                    Distribution Analysis
                                </Typography>
                            </Box>
                        </Typography>

                        {statistics?.client_users?.stats?.length > 0 ? (
                            <Box sx={{ mb: 4 }}>
                                {statistics.client_users.stats.map((stat, index) => (
                                    <Box
                                        key={stat.registration_status}
                                        sx={{
                                            mb: 2.5,
                                            animation: `fadeInUp 0.5s ease-out ${0.7 + index * 0.1}s both`,
                                            opacity: 0,
                                            transform: 'translateY(20px)',
                                        }}
                                    >
                                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                                            <Box display="flex" alignItems="center" gap={1.5}>
                                                <Box
                                                    sx={{
                                                        p: 1,
                                                        borderRadius: '50%',
                                                        background: getStatusColor(stat.registration_status) + '15',
                                                        border: `1px solid ${getStatusColor(stat.registration_status)}30`,
                                                    }}
                                                >
                                                    {stat.registration_status === 'Verified' && (
                                                        <VerifiedIcon
                                                            sx={{
                                                                fontSize: 18,
                                                                color: getStatusColor(stat.registration_status)
                                                            }}
                                                        />
                                                    )}
                                                    {stat.registration_status === 'Pending' && (
                                                        <PendingIcon
                                                            sx={{
                                                                fontSize: 18,
                                                                color: getStatusColor(stat.registration_status)
                                                            }}
                                                        />
                                                    )}
                                                    {stat.registration_status === 'Rejected' && (
                                                        <RejectedIcon
                                                            sx={{
                                                                fontSize: 18,
                                                                color: getStatusColor(stat.registration_status)
                                                            }}
                                                        />
                                                    )}
                                                </Box>
                                                <Box>
                                                    <Typography variant="subtitle2" fontWeight={700}>
                                                        {stat.registration_status}
                                                    </Typography>
                                                    <Typography variant="caption" color="textSecondary">
                                                        {((stat.count / (statistics.client_users?.total || 1)) * 100).toFixed(1)}%
                                                    </Typography>
                                                </Box>
                                            </Box>
                                            <Typography variant="h6" fontWeight={800} color="text.primary">
                                                {stat.count}
                                            </Typography>
                                        </Box>
                                        <Box
                                            sx={{
                                                height: 10,
                                                backgroundColor: 'rgba(0,0,0,0.05)',
                                                borderRadius: 5,
                                                overflow: 'hidden',
                                                position: 'relative',
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    width: `${(stat.count / (statistics.client_users?.total || 1)) * 100}%`,
                                                    height: '100%',
                                                    background: `linear-gradient(90deg, ${getStatusColor(stat.registration_status)}, ${getStatusColor(stat.registration_status)}aa)`,
                                                    borderRadius: 5,
                                                    position: 'relative',
                                                    '&:after': {
                                                        content: '""',
                                                        position: 'absolute',
                                                        top: 0,
                                                        right: 0,
                                                        bottom: 0,
                                                        width: '20%',
                                                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3))',
                                                    }
                                                }}
                                            />
                                        </Box>
                                    </Box>
                                ))}
                            </Box>
                        ) : (
                            <Typography
                                color="textSecondary"
                                sx={{
                                    textAlign: 'center',
                                    py: 4,
                                    fontStyle: 'italic'
                                }}
                            >
                                No status data available
                            </Typography>
                        )}

                        {/* Quick Activity Summary */}
                        {activity_summary && (
                            <Box
                                sx={{
                                    mt: 3,
                                    pt: 3,
                                    borderTop: '2px dashed',
                                    borderColor: 'divider',
                                    animation: 'fadeInUp 0.5s ease-out 1s both',
                                    opacity: 0,
                                    transform: 'translateY(20px)',
                                }}
                            >
                                <Typography
                                    variant="subtitle2"
                                    gutterBottom
                                    sx={{
                                        fontWeight: 700,
                                        color: 'text.primary',
                                        mb: 2,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1
                                    }}
                                >
                                    <TrophyIcon fontSize="small" />
                                    System Highlights
                                </Typography>
                                <Box
                                    display="flex"
                                    justifyContent="space-between"
                                    alignItems="center"
                                    sx={{
                                        mb: 2,
                                        p: 2,
                                        borderRadius: 3,
                                        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
                                        border: '1px solid rgba(102, 126, 234, 0.1)',
                                    }}
                                >
                                    <Typography variant="body2" fontWeight={600}>Active Contracts</Typography>
                                    <Typography variant="h4" fontWeight={800} color="primary">
                                        {activity_summary.active_contracts || 0}
                                    </Typography>
                                </Box>
                                {activity_summary.top_applicants?.[0] && (
                                    <Box
                                        mt={2}
                                        p={2}
                                        sx={{
                                            borderRadius: 3,
                                            background: 'linear-gradient(135deg, rgba(74, 222, 128, 0.05) 0%, rgba(34, 211, 238, 0.05) 100%)',
                                            border: '1px solid rgba(74, 222, 128, 0.1)',
                                        }}
                                    >
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                fontWeight: 700,
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px',
                                                color: '#4ade80',
                                                display: 'block',
                                                mb: 0.5
                                            }}
                                        >
                                            🏆 Top Applicant
                                        </Typography>
                                        <Typography variant="body1" fontWeight={700} sx={{ mb: 0.5 }}>
                                            {activity_summary.top_applicants[0].first_name} {activity_summary.top_applicants[0].last_name}
                                        </Typography>
                                        <Typography variant="caption" color="textSecondary">
                                            ID: {activity_summary.top_applicants[0].client_user_id}
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                        )}
                    </Paper>
                </Grid>

                {/* Activity Summary - Detailed View */}
                {activity_summary && (
                    <>
                        <Grid item xs={12} md={6}>
                            <Paper
                                className="hover-lift"
                                sx={{
                                    p: 3,
                                    borderRadius: 4,
                                    background: 'rgba(255, 255, 255, 0.9)',
                                    backdropFilter: 'blur(10px)',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    animation: 'fadeInUp 0.6s ease-out 0.7s both',
                                    opacity: 0,
                                    transform: 'translateY(20px)',
                                    boxShadow: '0 8px 32px rgba(102, 126, 234, 0.1)',
                                }}
                            >
                                <Typography
                                    variant="h6"
                                    gutterBottom
                                    sx={{
                                        fontWeight: 700,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 2,
                                        mb: 3
                                    }}
                                >
                                    <Box
                                        sx={{
                                            width: 4,
                                            height: 32,
                                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                            borderRadius: 2
                                        }}
                                    />
                                    <Box>
                                        Top Applicants
                                        <Typography variant="caption" display="block" color="textSecondary">
                                            By Application Count
                                        </Typography>
                                    </Box>
                                </Typography>
                                {activity_summary.top_applicants?.length > 0 ? (
                                    activity_summary.top_applicants.slice(0, 5).map((applicant, index) => (
                                        <Box
                                            key={applicant.client_user_id || index}
                                            sx={{
                                                mb: 2,
                                                p: 2,
                                                borderRadius: 3,
                                                backgroundColor: index === 0
                                                    ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%)'
                                                    : 'rgba(0,0,0,0.02)',
                                                border: `1px solid ${index === 0 ? 'rgba(102, 126, 234, 0.2)' : 'rgba(0,0,0,0.05)'}`,
                                                transition: 'all 0.3s ease',
                                                '&:hover': {
                                                    transform: 'translateX(4px)',
                                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                                    backgroundColor: index === 0
                                                        ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%)'
                                                        : 'rgba(0,0,0,0.04)',
                                                }
                                            }}
                                        >
                                            <Box display="flex" alignItems="center">
                                                <Typography
                                                    variant="h6"
                                                    sx={{
                                                        mr: 2,
                                                        width: 40,
                                                        height: 40,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        background: index === 0
                                                            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                                            : 'linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%)',
                                                        color: 'white',
                                                        borderRadius: '50%',
                                                        fontSize: '1rem',
                                                        fontWeight: 800,
                                                        boxShadow: index === 0 ? '0 4px 12px rgba(102, 126, 234, 0.3)' : 'none',
                                                    }}
                                                >
                                                    {index + 1}
                                                </Typography>
                                                <Box flex={1}>
                                                    <Typography variant="subtitle1" fontWeight={700}>
                                                        {applicant.first_name} {applicant.last_name}
                                                    </Typography>
                                                    <Typography variant="body2" color="textSecondary">
                                                        ID: {applicant.client_user_id}
                                                    </Typography>
                                                </Box>
                                                <Box
                                                    sx={{
                                                        px: 2,
                                                        py: 0.5,
                                                        borderRadius: 4,
                                                        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                                                        border: '1px solid rgba(102, 126, 234, 0.2)',
                                                    }}
                                                >
                                                    <Typography variant="h6" fontWeight={800} color="primary">
                                                        {applicant.application_count}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </Box>
                                    ))
                                ) : (
                                    <Typography
                                        color="textSecondary"
                                        sx={{
                                            textAlign: 'center',
                                            py: 4,
                                            fontStyle: 'italic'
                                        }}
                                    >
                                        No application data available
                                    </Typography>
                                )}
                            </Paper>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Paper
                                className="hover-lift"
                                sx={{
                                    p: 3,
                                    borderRadius: 4,
                                    background: 'rgba(255, 255, 255, 0.9)',
                                    backdropFilter: 'blur(10px)',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    animation: 'fadeInUp 0.6s ease-out 0.8s both',
                                    opacity: 0,
                                    transform: 'translateY(20px)',
                                    boxShadow: '0 8px 32px rgba(74, 222, 128, 0.1)',
                                }}
                            >
                                <Typography
                                    variant="h6"
                                    gutterBottom
                                    sx={{
                                        fontWeight: 700,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 2,
                                        mb: 3
                                    }}
                                >
                                    <Box
                                        sx={{
                                            width: 4,
                                            height: 32,
                                            background: 'linear-gradient(135deg, #4ade80 0%, #22d3ee 100%)',
                                            borderRadius: 2
                                        }}
                                    />
                                    <Box>
                                        Top Ordered Users
                                        <Typography variant="caption" display="block" color="textSecondary">
                                            By Order Frequency
                                        </Typography>
                                    </Box>
                                </Typography>
                                {activity_summary.top_ordered_users?.length > 0 ? (
                                    activity_summary.top_ordered_users.slice(0, 5).map((user, index) => (
                                        <Box
                                            key={user.client_user_id || index}
                                            sx={{
                                                mb: 2,
                                                p: 2,
                                                borderRadius: 3,
                                                backgroundColor: index === 0
                                                    ? 'linear-gradient(135deg, rgba(74, 222, 128, 0.15) 0%, rgba(34, 211, 238, 0.15) 100%)'
                                                    : 'rgba(0,0,0,0.02)',
                                                border: `1px solid ${index === 0 ? 'rgba(74, 222, 128, 0.2)' : 'rgba(0,0,0,0.05)'}`,
                                                transition: 'all 0.3s ease',
                                                '&:hover': {
                                                    transform: 'translateX(4px)',
                                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                                    backgroundColor: index === 0
                                                        ? 'linear-gradient(135deg, rgba(74, 222, 128, 0.2) 0%, rgba(34, 211, 238, 0.2) 100%)'
                                                        : 'rgba(0,0,0,0.04)',
                                                }
                                            }}
                                        >
                                            <Box display="flex" alignItems="center">
                                                <Typography
                                                    variant="h6"
                                                    sx={{
                                                        mr: 2,
                                                        width: 40,
                                                        height: 40,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        background: index === 0
                                                            ? 'linear-gradient(135deg, #4ade80 0%, #22d3ee 100%)'
                                                            : 'linear-gradient(135deg, rgba(74, 222, 128, 0.2) 0%, rgba(34, 211, 238, 0.2) 100%)',
                                                        color: 'white',
                                                        borderRadius: '50%',
                                                        fontSize: '1rem',
                                                        fontWeight: 800,
                                                        boxShadow: index === 0 ? '0 4px 12px rgba(74, 222, 128, 0.3)' : 'none',
                                                    }}
                                                >
                                                    {index + 1}
                                                </Typography>
                                                <Box flex={1}>
                                                    <Typography variant="subtitle1" fontWeight={700}>
                                                        {user.first_name} {user.last_name}
                                                    </Typography>
                                                    <Typography variant="body2" color="textSecondary">
                                                        ID: {user.client_user_id}
                                                    </Typography>
                                                </Box>
                                                <Box
                                                    sx={{
                                                        px: 2,
                                                        py: 0.5,
                                                        borderRadius: 4,
                                                        background: 'linear-gradient(135deg, rgba(74, 222, 128, 0.1) 0%, rgba(34, 211, 238, 0.1) 100%)',
                                                        border: '1px solid rgba(74, 222, 128, 0.2)',
                                                    }}
                                                >
                                                    <Typography variant="h6" fontWeight={800} color="#4ade80">
                                                        {user.order_count}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </Box>
                                    ))
                                ) : (
                                    <Typography
                                        color="textSecondary"
                                        sx={{
                                            textAlign: 'center',
                                            py: 4,
                                            fontStyle: 'italic'
                                        }}
                                    >
                                        No order data available
                                    </Typography>
                                )}
                            </Paper>
                        </Grid>
                    </>
                )}
            </Grid>
        </Box>
    );
};

// Enhanced Helper function with gradients
const getStatusColor = (status) => {
    switch (status) {
        case 'Verified':
            return '#4ade80';
        case 'Pending':
            return '#f59e0b';
        case 'Rejected':
            return '#ef4444';
        default:
            return '#9ca3af';
    }
};

export default Dashboard;