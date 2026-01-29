import React, { useState, useEffect } from 'react';
import {
    Grid,
    Paper,
    Typography,
    Box,
    CircularProgress,
    Alert,
    Button, Skeleton,
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

            // ✅ Use the CORRECT endpoint - /dashboard
            const response = await adminAPI.getDashboardData();
            console.log(response);

            // Your backend returns: data.statistics, data.recent_registrations, data.activity_summary
            const data = response.data.data;
            setDashboardData(data);

        } catch (err) {
            console.error('❌ Dashboard fetch error:', err);

            // Try to get specific error message
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
            <Box sx={{ p: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Skeleton variant="text" width={200} height={40} />
                    <Skeleton variant="rectangular" width={100} height={36} />
                </Box>
                <Grid container spacing={3}>
                    {[1,2,3,4].map(i => (
                        <Grid item xs={12} sm={6} md={3} key={i}>
                            <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
                        </Grid>
                    ))}
                </Grid>
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
                <Button
                    variant="contained"
                    onClick={fetchDashboardData}
                    startIcon={<RefreshIcon />}
                >
                    Retry
                </Button>
            </Box>
        );
    }

    if (!dashboardData) {
        return (
            <Alert severity="warning" sx={{ m: 3 }}>
                No dashboard data available
            </Alert>
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
        <Box sx={{ flexGrow: 1, p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4">
                    Dashboard Overview
                </Typography>
                <Button
                    variant="outlined"
                    onClick={fetchDashboardData}
                    startIcon={<RefreshIcon />}
                    size="small"
                >
                    Refresh
                </Button>
            </Box>

            <Grid container spacing={3}>
                {/* Stats Cards */}
                <Grid item xs={12} sm={6} md={3}>
                    <StatsCard
                        title="Total Users"
                        value={derivedStats?.total_users || 0}
                        icon={<PeopleIcon />}
                        color="#1976d2"
                        description="All registered users in system"
                    />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <StatsCard
                        title="Client Users"
                        value={derivedStats?.client_users || 0}
                        icon={<PersonIcon />}
                        color="#2e7d32"
                        description="Judicial system users"
                    />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <StatsCard
                        title="Operational Users"
                        value={derivedStats?.operational_users || 0}
                        icon={<GroupIcon />}
                        color="#ed6c02"
                        description="Admin & staff users"
                    />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <StatsCard
                        title="Active Contracts"
                        value={derivedStats?.active_contracts || 0}
                        icon={<AssignmentIcon />}
                        color="#9c27b0"
                        description="Active service contracts"
                    />
                </Grid>

                {/* Recent Registrations */}
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 2, height: '100%' }}>
                        <Typography variant="h6" gutterBottom>
                            Recent Registrations (Last 7 Days)
                        </Typography>
                        <RecentRegistrations
                            data={recent_registrations || []}
                        />
                    </Paper>
                </Grid>

                {/* Client User Status Distribution */}
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2, height: '100%' }}>
                        <Typography variant="h6" gutterBottom>
                            Client User Status
                        </Typography>

                        {statistics?.client_users?.stats?.length > 0 ? (
                            statistics.client_users.stats.map((stat) => (
                                <Box key={stat.registration_status} sx={{ mb: 2 }}>
                                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                                        <Box display="flex" alignItems="center">
                                            {stat.registration_status === 'Verified' && (
                                                <VerifiedIcon color="success" fontSize="small" sx={{ mr: 1 }} />
                                            )}
                                            {stat.registration_status === 'Pending' && (
                                                <PendingIcon color="warning" fontSize="small" sx={{ mr: 1 }} />
                                            )}
                                            {stat.registration_status === 'Rejected' && (
                                                <RejectedIcon color="error" fontSize="small" sx={{ mr: 1 }} />
                                            )}
                                            <Typography variant="body2">
                                                {stat.registration_status}
                                            </Typography>
                                        </Box>
                                        <Typography variant="body2" fontWeight="bold">
                                            {stat.count} users
                                        </Typography>
                                    </Box>
                                    <Box
                                        sx={{
                                            height: 8,
                                            backgroundColor: '#e0e0e0',
                                            borderRadius: 4,
                                            overflow: 'hidden',
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                width: `${(stat.count / (statistics.client_users?.total || 1)) * 100}%`,
                                                height: '100%',
                                                backgroundColor: getStatusColor(stat.registration_status),
                                            }}
                                        />
                                    </Box>
                                </Box>
                            ))
                        ) : (
                            <Typography color="textSecondary">No status data available</Typography>
                        )}

                        {/* Quick Activity Summary */}
                        {activity_summary && (
                            <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                                <Typography variant="subtitle2" gutterBottom color="textSecondary">
                                    System Activity
                                </Typography>
                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                    <Typography variant="body2">Active Contracts</Typography>
                                    <Typography variant="body1" fontWeight="bold">
                                        {activity_summary.active_contracts || 0}
                                    </Typography>
                                </Box>
                                {activity_summary.top_applicants?.[0] && (
                                    <Box mt={1}>
                                        <Typography variant="caption" color="textSecondary" display="block">
                                            Top Applicant:
                                        </Typography>
                                        <Typography variant="body2">
                                            {activity_summary.top_applicants[0].first_name} {activity_summary.top_applicants[0].last_name}
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
                            <Paper sx={{ p: 2 }}>
                                <Typography variant="h6" gutterBottom>
                                    Top Applicants
                                </Typography>
                                {activity_summary.top_applicants?.length > 0 ? (
                                    activity_summary.top_applicants.slice(0, 5).map((applicant, index) => (
                                        <Box
                                            key={applicant.client_user_id || index}
                                            sx={{
                                                mb: 2,
                                                p: 1.5,
                                                borderRadius: 1,
                                                backgroundColor: index === 0 ? 'primary.50' : 'grey.50',
                                                '&:hover': { backgroundColor: index === 0 ? 'primary.100' : 'grey.100' }
                                            }}
                                        >
                                            <Box display="flex" alignItems="center">
                                                <Typography
                                                    variant="h6"
                                                    color="primary"
                                                    sx={{
                                                        mr: 2,
                                                        width: 32,
                                                        height: 32,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        backgroundColor: index === 0 ? 'primary.main' : 'primary.light',
                                                        color: 'white',
                                                        borderRadius: '50%',
                                                        fontSize: '0.875rem'
                                                    }}
                                                >
                                                    {index + 1}
                                                </Typography>
                                                <Box flex={1}>
                                                    <Typography variant="subtitle1" fontWeight="medium">
                                                        {applicant.first_name} {applicant.last_name}
                                                    </Typography>
                                                    <Typography variant="body2" color="textSecondary">
                                                        ID: {applicant.client_user_id}
                                                    </Typography>
                                                </Box>
                                                <Typography variant="h6" color="primary">
                                                    {applicant.application_count}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    ))
                                ) : (
                                    <Typography color="textSecondary">No application data available</Typography>
                                )}
                            </Paper>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Paper sx={{ p: 2 }}>
                                <Typography variant="h6" gutterBottom>
                                    Top Ordered Users
                                </Typography>
                                {activity_summary.top_ordered_users?.length > 0 ? (
                                    activity_summary.top_ordered_users.slice(0, 5).map((user, index) => (
                                        <Box
                                            key={user.client_user_id || index}
                                            sx={{
                                                mb: 2,
                                                p: 1.5,
                                                borderRadius: 1,
                                                backgroundColor: index === 0 ? 'success.50' : 'grey.50',
                                                '&:hover': { backgroundColor: index === 0 ? 'success.100' : 'grey.100' }
                                            }}
                                        >
                                            <Box display="flex" alignItems="center">
                                                <Typography
                                                    variant="h6"
                                                    color="success"
                                                    sx={{
                                                        mr: 2,
                                                        width: 32,
                                                        height: 32,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        backgroundColor: index === 0 ? 'success.main' : 'success.light',
                                                        color: 'white',
                                                        borderRadius: '50%',
                                                        fontSize: '0.875rem'
                                                    }}
                                                >
                                                    {index + 1}
                                                </Typography>
                                                <Box flex={1}>
                                                    <Typography variant="subtitle1" fontWeight="medium">
                                                        {user.first_name} {user.last_name}
                                                    </Typography>
                                                    <Typography variant="body2" color="textSecondary">
                                                        ID: {user.client_user_id}
                                                    </Typography>
                                                </Box>
                                                <Typography variant="h6" color="success.main">
                                                    {user.order_count}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    ))
                                ) : (
                                    <Typography color="textSecondary">No order data available</Typography>
                                )}
                            </Paper>
                        </Grid>
                    </>
                )}
            </Grid>
        </Box>
    );
};

// Helper function
const getStatusColor = (status) => {
    switch (status) {
        case 'Verified':
            return '#4caf50';
        case 'Pending':
            return '#ff9800';
        case 'Rejected':
            return '#f44336';
        default:
            return '#9e9e9e';
    }
};

export default Dashboard;