import React, { useState, useEffect, useMemo } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    Card,
    CardContent,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    CircularProgress,
    Alert,
    Tabs,
    Tab,
    IconButton,
    Tooltip,
    Button,
} from '@mui/material';
import {
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    Legend,
    ResponsiveContainer,
    LineChart,
    Line,
    AreaChart,
    Area,
} from 'recharts';
import {
    Refresh as RefreshIcon,
    Download as DownloadIcon,
    People as PeopleIcon,
    Person as PersonIcon,
    CheckCircle as CheckCircleIcon,
    Pending as PendingIcon,
    Block as BlockIcon,
    TrendingUp as TrendingUpIcon,
    Equalizer as EqualizerIcon,
    Info as InfoIcon,
    LocationOn as LocationIcon,
    Timeline as TimelineIcon,
} from '@mui/icons-material';
import { adminAPI } from '../../services/api';

// Custom StatsCard Component (keep only one)
const StatsCard = ({ title, value, icon, color, change, changeText, description }) => {
    const getTrendIcon = () => {
        if (!change) return <EqualizerIcon sx={{ color: 'text.secondary', fontSize: 16 }} />;
        return change > 0 ? (
            <TrendingUpIcon sx={{ color: '#4caf50', fontSize: 16 }} />
        ) : (
            <TrendingUpIcon sx={{ color: '#f44336', fontSize: 16, transform: 'rotate(180deg)' }} />
        );
    };

    const formatValue = (val) => {
        if (typeof val === 'number') {
            return val.toLocaleString();
        }
        return val;
    };

    return (
        <Card
            sx={{
                height: '100%',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 6,
                },
            }}
        >
            <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                        <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                            {title}
                        </Typography>
                        <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', color }}>
                            {formatValue(value)}
                        </Typography>

                        {change !== undefined && (
                            <Box display="flex" alignItems="center" mt={1}>
                                {getTrendIcon()}
                                <Typography
                                    variant="body2"
                                    sx={{
                                        ml: 0.5,
                                        color: change > 0 ? '#4caf50' : change < 0 ? '#f44336' : 'text.secondary',
                                        fontWeight: 'medium',
                                    }}
                                >
                                    {change > 0 ? '+' : ''}{change}%
                                </Typography>
                                <Typography variant="body2" color="textSecondary" sx={{ ml: 0.5 }}>
                                    {changeText || 'from last month'}
                                </Typography>
                            </Box>
                        )}
                    </Box>

                    <Box
                        sx={{
                            backgroundColor: `${color}15`,
                            borderRadius: 2,
                            p: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Box sx={{ color, fontSize: 28 }}>{icon}</Box>
                    </Box>
                </Box>

                {description && (
                    <Box mt={2} display="flex" alignItems="center">
                        <Tooltip title={description}>
                            <IconButton size="small" sx={{ p: 0, mr: 0.5 }}>
                                <InfoIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        <Typography variant="caption" color="textSecondary">
                            {description}
                        </Typography>
                    </Box>
                )}
            </CardContent>
        </Card>
    );
};

const Statistics = () => {
    const [basicStats, setBasicStats] = useState(null);
    const [enhancedStats, setEnhancedStats] = useState(null);
    const [dashboardMetrics, setDashboardMetrics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [timeRange, setTimeRange] = useState('month');
    const [activeTab, setActiveTab] = useState(0);

    useEffect(() => {
        fetchAllStatistics();
    }, []);

    const fetchAllStatistics = async () => {
        try {
            setLoading(true);

            // Fetch all statistics
            const [basicResponse, enhancedResponse, dashboardResponse] = await Promise.allSettled([
                adminAPI.getStatistics(),
                adminAPI.getEnhancedStatistics(),
                adminAPI.getDashboardMetrics()
            ]);

            // Handle basic stats
            if (basicResponse.status === 'fulfilled') {
                setBasicStats(basicResponse.value.data.data.statistics);
            } else {
                console.error('Basic stats error:', basicResponse.reason);
            }

            // Handle enhanced stats
            if (enhancedResponse.status === 'fulfilled') {
                setEnhancedStats(enhancedResponse.value.data.data.statistics);
            } else {
                console.log('Enhanced stats not available');
            }

            // Handle dashboard metrics
            if (dashboardResponse.status === 'fulfilled') {
                setDashboardMetrics(dashboardResponse.value.data.data.metrics);
            } else {
                console.log('Dashboard metrics not available');
            }

        } catch (err) {
            setError(err.message || 'Failed to fetch statistics');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Verified': return '#4caf50';
            case 'Pending': return '#ff9800';
            case 'Rejected': return '#f44336';
            case 'Profile_Completed': return '#2196f3';
            default: return '#9e9e9e';
        }
    };

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

    if (loading && !basicStats) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Alert
                severity="error"
                sx={{ mt: 2 }}
                action={
                    <Button color="inherit" size="small" onClick={fetchAllStatistics}>
                        Retry
                    </Button>
                }
            >
                {error}
            </Alert>
        );
    }

    // Prepare chart data from basic stats
    const clientStatusData = basicStats?.client_users?.stats?.map(stat => ({
        name: stat.registration_status,
        value: stat.count,
        color: getStatusColor(stat.registration_status),
    })) || [];

    const operationalRoleData = basicStats?.operational_users?.stats?.map(stat => ({
        name: stat.user_role,
        value: stat.count,
    })) || [];

    // Prepare region data from enhanced stats
    const regionData = enhancedStats?.region_stats?.map(stat => ({
        name: stat.region,
        value: stat.count,
    })) || [];

    // Prepare monthly trends from enhanced stats
    const monthlyTrends = enhancedStats?.monthly_trends || [];

    // Handle export
    const handleExportData = () => {
        const data = {
            basic: basicStats,
            enhanced: enhancedStats,
            dashboard: dashboardMetrics,
            exportedAt: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `statistics-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box>
                    <Typography variant="h4" gutterBottom>
                        Statistics & Analytics Dashboard
                    </Typography>
                    {dashboardMetrics && (
                        <Typography variant="body2" color="textSecondary">
                            Last updated: {new Date(dashboardMetrics.timestamp || Date.now()).toLocaleString()}
                        </Typography>
                    )}
                </Box>
                <Box display="flex" gap={2}>
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel>Time Range</InputLabel>
                        <Select
                            value={timeRange}
                            label="Time Range"
                            onChange={(e) => setTimeRange(e.target.value)}
                        >
                            <MenuItem value="week">Last Week</MenuItem>
                            <MenuItem value="month">Last Month</MenuItem>
                            <MenuItem value="quarter">Last Quarter</MenuItem>
                            <MenuItem value="year">Last Year</MenuItem>
                        </Select>
                    </FormControl>
                    <Button
                        variant="outlined"
                        startIcon={<DownloadIcon />}
                        onClick={handleExportData}
                    >
                        Export Data
                    </Button>
                    <IconButton onClick={fetchAllStatistics} title="Refresh all data">
                        <RefreshIcon />
                    </IconButton>
                </Box>
            </Box>

            {/* Dashboard Metrics Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <StatsCard
                        title="Total Users"
                        value={basicStats?.total_users || 0}
                        icon={<PeopleIcon />}
                        color="#1976d2"
                        description="All registered users"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatsCard
                        title="Client Users"
                        value={basicStats?.client_users?.total || 0}
                        icon={<PersonIcon />}
                        color="#2e7d32"
                        description="Registered clients"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatsCard
                        title="Verified Clients"
                        value={clientStatusData.find(s => s.name === 'Verified')?.value || 0}
                        icon={<CheckCircleIcon />}
                        color="#4caf50"
                        description="Approved clients"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatsCard
                        title="Pending Approvals"
                        value={clientStatusData.find(s => s.name === 'Pending')?.value || 0}
                        icon={<PendingIcon />}
                        color="#ff9800"
                        description="Awaiting verification"
                    />
                </Grid>
            </Grid>

            {/* Enhanced Metrics (if available) */}
            {dashboardMetrics && (
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} md={4}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Today's Activity
                                </Typography>
                                <Box display="flex" alignItems="center" gap={2}>
                                    <TrendingUpIcon sx={{ color: dashboardMetrics.daily_growth > 0 ? '#4caf50' : '#f44336', fontSize: 40 }} />
                                    <Box>
                                        <Typography variant="h4">
                                            {dashboardMetrics.todays_registrations || 0}
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            New registrations today
                                        </Typography>
                                    </Box>
                                </Box>
                                {dashboardMetrics.daily_growth !== undefined && (
                                    <Typography variant="body2" sx={{ mt: 2, color: dashboardMetrics.daily_growth > 0 ? '#4caf50' : '#f44336' }}>
                                        {dashboardMetrics.daily_growth > 0 ? '+' : ''}{dashboardMetrics.daily_growth}% from yesterday
                                    </Typography>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Verification Speed
                                </Typography>
                                <Box display="flex" alignItems="center" gap={2}>
                                    <TimelineIcon sx={{ color: '#2196f3', fontSize: 40 }} />
                                    <Box>
                                        <Typography variant="h4">
                                            {dashboardMetrics.avg_verification_days || 'N/A'}
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            Average days to verify
                                        </Typography>
                                    </Box>
                                </Box>
                                <Typography variant="body2" sx={{ mt: 2 }}>
                                    {dashboardMetrics.recently_verified || 0} recently verified
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Most Active Region
                                </Typography>
                                <Box display="flex" alignItems="center" gap={2}>
                                    <LocationIcon sx={{ color: '#9c27b0', fontSize: 40 }} />
                                    <Box>
                                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                            {dashboardMetrics.most_active_region || 'N/A'}
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            {dashboardMetrics.region_user_count || 0} users
                                        </Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {/* Tabs */}
            <Paper sx={{ mb: 3 }}>
                <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
                    <Tab label="Overview" />
                    <Tab label="Client Analysis" />
                    <Tab label="Regions" />
                    {monthlyTrends.length > 0 && <Tab label="Trends" />}
                </Tabs>
            </Paper>

            {/* Tab 0: Overview */}
            {activeTab === 0 && (
                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Client User Status Distribution
                                </Typography>
                                <Typography variant="body2" color="textSecondary" gutterBottom>
                                    Total: {basicStats?.client_users?.total || 0} clients
                                </Typography>
                                <Box height={300}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={clientStatusData}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                                outerRadius={80}
                                                fill="#8884d8"
                                                dataKey="value"
                                            >
                                                {clientStatusData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip formatter={(value) => [`${value} users`, 'Count']} />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Operational User Roles
                                </Typography>
                                <Typography variant="body2" color="textSecondary" gutterBottom>
                                    Total: {basicStats?.operational_users?.total || 0} operational users
                                </Typography>
                                <Box height={300}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={operationalRoleData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" />
                                            <YAxis />
                                            <RechartsTooltip />
                                            <Legend />
                                            <Bar
                                                dataKey="value"
                                                fill="#82ca9d"
                                                name="User Count"
                                                radius={[4, 4, 0, 0]}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {/* Tab 1: Client Analysis */}
            {activeTab === 1 && (
                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Client Status Details
                                </Typography>
                                <Box>
                                    {clientStatusData.map((stat, index) => (
                                        <Box key={stat.name} mb={2}>
                                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                                                <Box display="flex" alignItems="center" gap={1}>
                                                    <Box
                                                        sx={{
                                                            width: 12,
                                                            height: 12,
                                                            borderRadius: '50%',
                                                            backgroundColor: stat.color,
                                                        }}
                                                    />
                                                    <Typography variant="body2">{stat.name}</Typography>
                                                </Box>
                                                <Typography variant="body2" fontWeight="bold">
                                                    {stat.value} users
                                                    <Typography
                                                        component="span"
                                                        variant="caption"
                                                        color="textSecondary"
                                                        sx={{ ml: 1 }}
                                                    >
                                                        ({((stat.value / (basicStats?.client_users?.total || 1)) * 100).toFixed(1)}%)
                                                    </Typography>
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
                                                        width: `${(stat.value / (basicStats?.client_users?.total || 1)) * 100}%`,
                                                        height: '100%',
                                                        backgroundColor: stat.color,
                                                    }}
                                                />
                                            </Box>
                                        </Box>
                                    ))}
                                    <Box mt={3} pt={2} borderTop={1} borderColor="divider">
                                        <Typography variant="h6">
                                            Total Client Users: {basicStats?.client_users?.total || 0}
                                        </Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {/* Tab 2: Regions */}
            {activeTab === 2 && regionData.length > 0 && (
                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    User Distribution by Region
                                </Typography>
                                <Box height={350}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={regionData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" />
                                            <YAxis />
                                            <RechartsTooltip />
                                            <Legend />
                                            <Bar
                                                dataKey="value"
                                                fill="#8884d8"
                                                name="User Count"
                                                radius={[4, 4, 0, 0]}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {/* Tab 3: Trends */}
            {activeTab === 3 && monthlyTrends.length > 0 && (
                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Registration Trends (Last 6 Months)
                                </Typography>
                                <Box height={400}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={monthlyTrends}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="month" />
                                            <YAxis />
                                            <RechartsTooltip />
                                            <Legend />
                                            <Area
                                                type="monotone"
                                                dataKey="clients"
                                                stackId="1"
                                                stroke="#8884d8"
                                                fill="#8884d8"
                                                name="Client Registrations"
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="operational"
                                                stackId="1"
                                                stroke="#82ca9d"
                                                fill="#82ca9d"
                                                name="Operational Registrations"
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}
        </Box>
    );
};

export default Statistics;