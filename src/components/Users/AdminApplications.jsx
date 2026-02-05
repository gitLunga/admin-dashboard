import React, { useState, useEffect , useCallback} from 'react';
import {
    Box,
    Paper,
    Typography,
    TextField,
    IconButton,
    Chip,
    Alert,
    CircularProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Avatar,
    Tooltip,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Button,
    Grid,
    Card,
    CardContent,
    Menu,
    ListItemIcon,
    ListItemText,
    Divider,
    Stack,
    LinearProgress,
    useTheme,
} from '@mui/material';
import {
    Search as SearchIcon,
    FilterList as FilterIcon,
    Person as PersonIcon,
    PhoneAndroid as DeviceIcon,
    Refresh as RefreshIcon,
    CheckCircle as ApprovedIcon,
    Cancel as RejectedIcon,
    Pending as PendingIcon,
    Block as CancelledIcon,
    Visibility as ViewIcon,
    Edit as EditIcon,
    MoreVert as MoreIcon,
    Email as EmailIcon,
    Call as CallIcon,
    BarChart as ChartIcon,
    Groups as UsersIcon,
    TrendingUp as TrendingIcon,
    AccessTime as TimeIcon,
    Category as CategoryIcon,
    Store as StoreIcon,
} from '@mui/icons-material';
import { deviceAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import ApplicationStatusDialog from './ApplicationStatusDialog';
import ApplicationDetailsDialog from './ApplicationDetailsDialog';

const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    } catch (error) {
        return 'Invalid Date';
    }
};

const formatNumber = (num) => {
    return parseInt(num) || 0;
};

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ZA', {
        style: 'currency',
        currency: 'ZAR',
        minimumFractionDigits: 2,
    }).format(amount || 0);
};

const AdminApplications = () => {
    const theme = useTheme();
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statsLoading, setStatsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [filters, setFilters] = useState({
        status: 'all',
        user_type: 'all',
        region: 'all',
    });
    const [stats, setStats] = useState(null);
    const [statusDialog, setStatusDialog] = useState({
        open: false,
        application: null,
    });
    const [detailsDialog, setDetailsDialog] = useState({
        open: false,
        application: null,
    });
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedApp, setSelectedApp] = useState(null);
    // const [activeStatsTab, setActiveStatsTab] = useState('overview');
    const navigate = useNavigate();



    const fetchApplications = useCallback(async (customFilters = {}) => {
        try {
            setLoading(true);
            const allFilters = { ...filters, ...customFilters };
            let queryParams = '';
            const params = [];

            Object.keys(allFilters).forEach(key => {
                if (allFilters[key] && allFilters[key] !== 'all') {
                    params.push(`${key}=${encodeURIComponent(allFilters[key])}`);
                }
            });

            if (params.length > 0) {
                queryParams = '?' + params.join('&');
            }

            const response = await deviceAPI.getAllApplications(queryParams);
            setApplications(response.data?.data || []);
            setError(null);
        } catch (err) {
            setError(err.message || 'Failed to fetch applications');
            console.error('Error fetching applications:', err);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    const fetchStatistics = useCallback(async () => {
        try {
            setStatsLoading(true);
            const response = await deviceAPI.getApplicationStatistics();
            console.log('Statistics response:', response.data);
            setStats(response.data?.data || {
                summary: {
                    total_applications: 0,
                    pending: 0,
                    approved: 0,
                    rejected: 0,
                    cancelled: 0,
                    unique_users: 0,
                    avg_processing_days: 0
                },
                device_stats: [],
                user_type_stats: [],
                trend: []
            });
        } catch (err) {
            console.error('Failed to fetch statistics:', err);
            setStats({
                summary: {
                    total_applications: 0,
                    pending: 0,
                    approved: 0,
                    rejected: 0,
                    cancelled: 0,
                    unique_users: 0,
                    avg_processing_days: 0
                },
                device_stats: [],
                user_type_stats: [],
                trend: []
            });
        } finally {
            setStatsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchApplications();
        fetchStatistics();
    }, [fetchApplications, fetchStatistics]);

    const handleSearch = (e) => {
        if (e.key === 'Enter') {
            fetchApplications({ search: searchTerm });
        }
    };

    const handleRefresh = () => {
        setSearchTerm('');
        fetchApplications();
        fetchStatistics();
    };

    const handleFilterChange = (filterName, value) => {
        const newFilters = { ...filters, [filterName]: value };
        setFilters(newFilters);
        setPage(0);
        fetchApplications(newFilters);
    };

    const handleClearFilters = () => {
        const clearedFilters = {
            status: 'all',
            user_type: 'all',
            region: 'all',
        };
        setFilters(clearedFilters);
        setSearchTerm('');
        fetchApplications(clearedFilters);
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Approved':
                return <ApprovedIcon fontSize="small" />;
            case 'Rejected':
                return <RejectedIcon fontSize="small" />;
            case 'Pending':
                return <PendingIcon fontSize="small" />;
            case 'Cancelled':
                return <CancelledIcon fontSize="small" />;
            default:
                return <PendingIcon fontSize="small" />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Approved':
                return 'success';
            case 'Rejected':
                return 'error';
            case 'Pending':
                return 'warning';
            case 'Cancelled':
                return 'default';
            default:
                return 'default';
        }
    };

    const calculateApprovalRate = () => {
        if (!stats?.summary) return 0;
        const total = formatNumber(stats.summary.total_applications);
        const approved = formatNumber(stats.summary.approved);
        return total > 0 ? Math.round((approved / total) * 100) : 0;
    };

    const getTopDevice = () => {
        if (!stats?.device_stats || stats.device_stats.length === 0) return 'N/A';
        const topDevice = stats.device_stats.reduce((prev, current) =>
            formatNumber(prev.total_applications) > formatNumber(current.total_applications) ? prev : current
        );
        return topDevice.device_name;
    };

    const getTopUserType = () => {
        if (!stats?.user_type_stats || stats.user_type_stats.length === 0) return 'N/A';
        const topType = stats.user_type_stats.reduce((prev, current) =>
            formatNumber(prev.total_applications) > formatNumber(current.total_applications) ? prev : current
        );
        return topType.user_type;
    };

    const handleStatusUpdate = async (applicationId, statusData) => {
        try {
            const response = await deviceAPI.updateApplicationStatus(applicationId, statusData);
            if (response.data?.success) {
                fetchApplications();
                fetchStatistics();
                setStatusDialog({ open: false, application: null });
            } else {
                setError(response.data?.message || 'Failed to update status');
            }
        } catch (err) {
            setError(err.message || 'Failed to update status');
        }
    };

    const handleMenuClick = (event, application) => {
        setAnchorEl(event.currentTarget);
        setSelectedApp(application);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedApp(null);
    };

    if (loading && applications.length === 0) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                <Box>
                    <Typography variant="h4" gutterBottom fontWeight="bold">
                        Application Management
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        Manage and review all device applications • Total: {formatNumber(stats?.summary?.total_applications) || 0} applications
                    </Typography>
                </Box>
                <Box display="flex" gap={1}>
                    <Tooltip title="Refresh Data">
                        <IconButton onClick={handleRefresh} sx={{ bgcolor: 'primary.50' }}>
                            <RefreshIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            {/* Statistics Section */}
            {stats && !statsLoading && (
                <Box sx={{ mb: 4 }}>
                    {/* Main Stats Cards */}
                    <Grid container spacing={3} sx={{ mb: 3 }}>
                        <Grid item xs={12} sm={6} md={3}>
                            <Card sx={{
                                height: '100%',
                                bgcolor: 'primary.50',
                                borderLeft: `4px solid ${theme.palette.primary.main}`,
                            }}>
                                <CardContent>
                                    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                                        <Box>
                                            <Typography color="textSecondary" variant="caption" gutterBottom>
                                                Total Applications
                                            </Typography>
                                            <Typography variant="h3" component="div" fontWeight="bold">
                                                {formatNumber(stats.summary?.total_applications)}
                                            </Typography>
                                            <Typography variant="caption" color="textSecondary">
                                                From {formatNumber(stats.summary?.unique_users)} unique users
                                            </Typography>
                                        </Box>
                                        <Avatar sx={{
                                            bgcolor: 'primary.100',
                                            color: 'primary.main',
                                            width: 48,
                                            height: 48
                                        }}>
                                            <ChartIcon />
                                        </Avatar>
                                    </Box>
                                    <LinearProgress
                                        variant="determinate"
                                        value={100}
                                        sx={{
                                            mt: 2,
                                            height: 6,
                                            borderRadius: 3,
                                            bgcolor: 'primary.50'
                                        }}
                                    />
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid item xs={12} sm={6} md={3}>
                            <Card sx={{
                                height: '100%',
                                bgcolor: 'success.50',
                                borderLeft: `4px solid ${theme.palette.success.main}`,
                            }}>
                                <CardContent>
                                    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                                        <Box>
                                            <Typography color="textSecondary" variant="caption" gutterBottom>
                                                Approved
                                            </Typography>
                                            <Typography variant="h3" component="div" fontWeight="bold" color="success.main">
                                                {formatNumber(stats.summary?.approved)}
                                            </Typography>
                                            <Typography variant="caption" color="textSecondary">
                                                {calculateApprovalRate()}% approval rate
                                            </Typography>
                                        </Box>
                                        <Avatar sx={{
                                            bgcolor: 'success.100',
                                            color: 'success.main',
                                            width: 48,
                                            height: 48
                                        }}>
                                            <ApprovedIcon />
                                        </Avatar>
                                    </Box>
                                    <LinearProgress
                                        variant="determinate"
                                        value={calculateApprovalRate()}
                                        sx={{
                                            mt: 2,
                                            height: 6,
                                            borderRadius: 3,
                                            bgcolor: 'success.100'
                                        }}
                                    />
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid item xs={12} sm={6} md={3}>
                            <Card sx={{
                                height: '100%',
                                bgcolor: 'warning.50',
                                borderLeft: `4px solid ${theme.palette.warning.main}`,
                            }}>
                                <CardContent>
                                    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                                        <Box>
                                            <Typography color="textSecondary" variant="caption" gutterBottom>
                                                Pending Review
                                            </Typography>
                                            <Typography variant="h3" component="div" fontWeight="bold" color="warning.main">
                                                {formatNumber(stats.summary?.pending)}
                                            </Typography>
                                            <Typography variant="caption" color="textSecondary">
                                                Need attention
                                            </Typography>
                                        </Box>
                                        <Avatar sx={{
                                            bgcolor: 'warning.100',
                                            color: 'warning.main',
                                            width: 48,
                                            height: 48
                                        }}>
                                            <PendingIcon />
                                        </Avatar>
                                    </Box>
                                    <LinearProgress
                                        variant="determinate"
                                        value={(formatNumber(stats.summary?.pending) / formatNumber(stats.summary?.total_applications)) * 100 || 0}
                                        sx={{
                                            mt: 2,
                                            height: 6,
                                            borderRadius: 3,
                                            bgcolor: 'warning.100'
                                        }}
                                    />
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid item xs={12} sm={6} md={3}>
                            <Card sx={{
                                height: '100%',
                                bgcolor: 'info.50',
                                borderLeft: `4px solid ${theme.palette.info.main}`,
                            }}>
                                <CardContent>
                                    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                                        <Box>
                                            <Typography color="textSecondary" variant="caption" gutterBottom>
                                                Avg. Processing Time
                                            </Typography>
                                            <Typography variant="h3" component="div" fontWeight="bold" color="info.main">
                                                {parseFloat(stats.summary?.avg_processing_days || 0).toFixed(1)}
                                            </Typography>
                                            <Typography variant="caption" color="textSecondary">
                                                Days to process
                                            </Typography>
                                        </Box>
                                        <Avatar sx={{
                                            bgcolor: 'info.100',
                                            color: 'info.main',
                                            width: 48,
                                            height: 48
                                        }}>
                                            <TimeIcon />
                                        </Avatar>
                                    </Box>
                                    <LinearProgress
                                        variant="determinate"
                                        value={Math.min(parseFloat(stats.summary?.avg_processing_days || 0) * 10, 100)}
                                        sx={{
                                            mt: 2,
                                            height: 6,
                                            borderRadius: 3,
                                            bgcolor: 'info.100'
                                        }}
                                    />
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>

                    {/* Quick Insights */}
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid item xs={12}>
                            <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                                <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                                    Quick Insights
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={6} md={3}>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <StoreIcon color="primary" fontSize="small" />
                                            <Typography variant="body2">
                                                Top Device: <strong>{getTopDevice()}</strong>
                                            </Typography>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={6} md={3}>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <UsersIcon color="secondary" fontSize="small" />
                                            <Typography variant="body2">
                                                Top User Type: <strong>{getTopUserType()}</strong>
                                            </Typography>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={6} md={3}>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <CategoryIcon color="warning" fontSize="small" />
                                            <Typography variant="body2">
                                                Available Devices: <strong>{stats.device_stats?.length || 0}</strong>
                                            </Typography>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={6} md={3}>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <TrendingIcon color="success" fontSize="small" />
                                            <Typography variant="body2">
                                                Last 30 Days: <strong>{stats.trend?.reduce((sum, day) => sum + formatNumber(day.applications), 0) || 0}</strong>
                                            </Typography>
                                        </Box>
                                    </Grid>
                                </Grid>
                            </Paper>
                        </Grid>
                    </Grid>
                </Box>
            )}

            {/* Filters and Search */}
            <Paper sx={{ mb: 3, p: 2.5, borderRadius: 2, boxShadow: 1 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={4}>
                        <TextField
                            fullWidth
                            placeholder="Search by name, email, device..."
                            variant="outlined"
                            size="small"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyPress={handleSearch}
                            InputProps={{
                                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                                sx: { borderRadius: 2 }
                            }}
                        />
                    </Grid>
                    <Grid item xs={6} md={2}>
                        <FormControl fullWidth size="small">
                            <InputLabel shrink>Status</InputLabel>
                            <Select
                                value={filters.status}
                                label="Status"
                                onChange={(e) => handleFilterChange('status', e.target.value)}
                                sx={{ borderRadius: 2 }}
                            >
                                <MenuItem value="all">All Status</MenuItem>
                                <MenuItem value="Pending">
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <PendingIcon fontSize="small" color="warning" />
                                        Pending
                                    </Box>
                                </MenuItem>
                                <MenuItem value="Approved">
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <ApprovedIcon fontSize="small" color="success" />
                                        Approved
                                    </Box>
                                </MenuItem>
                                <MenuItem value="Rejected">
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <RejectedIcon fontSize="small" color="error" />
                                        Rejected
                                    </Box>
                                </MenuItem>
                                <MenuItem value="Cancelled">
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <CancelledIcon fontSize="small" color="default" />
                                        Cancelled
                                    </Box>
                                </MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={6} md={2}>
                        <FormControl fullWidth size="small">
                            <InputLabel shrink>User Type</InputLabel>
                            <Select
                                value={filters.user_type}
                                label="User Type"
                                onChange={(e) => handleFilterChange('user_type', e.target.value)}
                                sx={{ borderRadius: 2 }}
                            >
                                <MenuItem value="all">All Types</MenuItem>
                                <MenuItem value="Advocate">Advocate</MenuItem>
                                <MenuItem value="Magistrate">Magistrate</MenuItem>
                                <MenuItem value="Prosecutor">Prosecutor</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={6} md={2}>
                        <FormControl fullWidth size="small">
                            <InputLabel shrink>Region</InputLabel>
                            <Select
                                value={filters.region}
                                label="Region"
                                onChange={(e) => handleFilterChange('region', e.target.value)}
                                sx={{ borderRadius: 2 }}
                            >
                                <MenuItem value="all">All Regions</MenuItem>
                                <MenuItem value="Gauteng">Gauteng</MenuItem>
                                <MenuItem value="Western Cape">Western Cape</MenuItem>
                                <MenuItem value="KwaZulu-Natal">KZN</MenuItem>
                                <MenuItem value="Eastern Cape">Eastern Cape</MenuItem>
                                <MenuItem value="Free State">Free State</MenuItem>
                                <MenuItem value="Limpopo">Limpopo</MenuItem>
                                <MenuItem value="Mpumalanga">Mpumalanga</MenuItem>
                                <MenuItem value="North West">North West</MenuItem>
                                <MenuItem value="Northern Cape">Northern Cape</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={6} md={2}>
                        <Button
                            fullWidth
                            variant="contained"
                            onClick={handleRefresh}
                            size="small"
                            startIcon={<RefreshIcon />}
                            sx={{ borderRadius: 2, py: 1 }}
                        >
                            Refresh
                        </Button>
                    </Grid>
                </Grid>
                <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
                    <Typography variant="caption" color="textSecondary">
                        Showing {applications.length} applications
                    </Typography>
                    <Button
                        variant="outlined"
                        onClick={handleClearFilters}
                        size="small"
                        startIcon={<FilterIcon />}
                        sx={{ borderRadius: 2 }}
                    >
                        Clear Filters
                    </Button>
                </Box>
            </Paper>

            {error && (
                <Alert
                    severity="error"
                    sx={{ mb: 2, borderRadius: 2 }}
                    onClose={() => setError(null)}
                >
                    {error}
                </Alert>
            )}

            {/* Applications Table */}
            <Paper sx={{ borderRadius: 2, overflow: 'hidden', boxShadow: 2 }}>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{
                                bgcolor: theme.palette.mode === 'light' ? 'primary.50' : 'primary.900',
                            }}>
                                <TableCell sx={{ fontWeight: 'bold', py: 2 }}>Application ID</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', py: 2 }}>Applicant Details</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', py: 2 }}>Device & Plan</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', py: 2 }}>Status</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', py: 2 }}>Submitted</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', py: 2 }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {applications.length > 0 ? (
                                applications
                                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                    .map((app) => (
                                        <TableRow
                                            key={app.application_id}
                                            hover
                                            sx={{
                                                '&:hover': { bgcolor: 'action.hover' },
                                                transition: 'background-color 0.2s'
                                            }}
                                        >
                                            <TableCell>
                                                <Box>
                                                    <Typography variant="body2" fontWeight="bold" color="primary">
                                                        #{app.application_id}
                                                    </Typography>
                                                    <Typography variant="caption" color="textSecondary">
                                                        Device ID: {app.device_id}
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Box display="flex" alignItems="center">
                                                    <Avatar
                                                        sx={{
                                                            width: 40,
                                                            height: 40,
                                                            mr: 2,
                                                            bgcolor: app.user_type === 'Advocate' ? 'primary.main' : 'secondary.main',
                                                            fontWeight: 'bold'
                                                        }}
                                                    >
                                                        {app.first_name?.[0]}{app.last_name?.[0]}
                                                    </Avatar>
                                                    <Box>
                                                        <Typography variant="body2" fontWeight="medium">
                                                            {app.first_name} {app.last_name}
                                                        </Typography>
                                                        <Stack direction="row" spacing={0.5} alignItems="center">
                                                            <Typography variant="caption" color="textSecondary">
                                                                {app.email}
                                                            </Typography>
                                                            {app.phone_number && (
                                                                <Typography variant="caption" color="textSecondary">
                                                                    • {app.phone_number}
                                                                </Typography>
                                                            )}
                                                        </Stack>
                                                        <Stack direction="row" spacing={1} mt={0.5}>
                                                            <Chip
                                                                label={app.user_type || 'N/A'}
                                                                size="small"
                                                                color={app.user_type === 'Advocate' ? 'primary' : 'secondary'}
                                                                variant="outlined"
                                                                sx={{ height: 20, fontSize: '0.7rem' }}
                                                            />
                                                            {app.region && (
                                                                <Chip
                                                                    label={app.region}
                                                                    size="small"
                                                                    variant="outlined"
                                                                    sx={{ height: 20, fontSize: '0.7rem' }}
                                                                />
                                                            )}
                                                        </Stack>
                                                    </Box>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Box>
                                                    <Typography variant="body2" fontWeight="medium">
                                                        {app.device_name || 'N/A'}
                                                    </Typography>
                                                    <Typography variant="caption" color="textSecondary" display="block">
                                                        {app.manufacturer || ''} {app.model ? '• ' + app.model : ''}
                                                    </Typography>
                                                    <Stack direction="row" spacing={1} mt={0.5} alignItems="center">
                                                        <Chip
                                                            label={app.plan_name || 'N/A'}
                                                            size="small"
                                                            color="info"
                                                            variant="outlined"
                                                            sx={{ height: 20, fontSize: '0.7rem' }}
                                                        />
                                                        <Typography variant="caption" fontWeight="medium" color="primary">
                                                            {formatCurrency(app.monthly_cost)}
                                                        </Typography>
                                                    </Stack>
                                                    {app.contract_duration_months && (
                                                        <Typography variant="caption" color="textSecondary" display="block">
                                                            {app.contract_duration_months} months contract
                                                        </Typography>
                                                    )}
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    icon={getStatusIcon(app.application_status)}
                                                    label={app.application_status}
                                                    color={getStatusColor(app.application_status)}
                                                    size="small"
                                                    sx={{
                                                        minWidth: 100,
                                                        fontWeight: 'medium',
                                                        boxShadow: 1
                                                    }}
                                                />
                                                {app.rejection_reason && app.application_status === 'Rejected' && (
                                                    <Tooltip title={app.rejection_reason} arrow>
                                                        <Typography
                                                            variant="caption"
                                                            color="error"
                                                            display="block"
                                                            sx={{
                                                                mt: 0.5,
                                                                cursor: 'help'
                                                            }}
                                                        >
                                                            Reason: {app.rejection_reason.substring(0, 30)}...
                                                        </Typography>
                                                    </Tooltip>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Box>
                                                    <Typography variant="body2" fontWeight="medium">
                                                        {formatDate(app.submission_date)}
                                                    </Typography>
                                                    {app.last_updated && app.last_updated !== app.submission_date && (
                                                        <Typography variant="caption" color="textSecondary">
                                                            Updated: {formatDate(app.last_updated)}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Stack direction="row" spacing={0.5}>
                                                    <Tooltip title="View Details">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => setDetailsDialog({ open: true, application: app })}
                                                            sx={{
                                                                bgcolor: 'primary.50',
                                                                '&:hover': { bgcolor: 'primary.100' }
                                                            }}
                                                        >
                                                            <ViewIcon fontSize="small" color="primary" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Update Status">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => setStatusDialog({ open: true, application: app })}
                                                            disabled={app.application_status === 'Cancelled'}
                                                            sx={{
                                                                bgcolor: app.application_status === 'Cancelled' ? 'grey.100' : 'warning.50',
                                                                '&:hover': {
                                                                    bgcolor: app.application_status === 'Cancelled' ? 'grey.100' : 'warning.100'
                                                                }
                                                            }}
                                                        >
                                                            <EditIcon fontSize="small" color={app.application_status === 'Cancelled' ? 'disabled' : 'warning'} />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="More Options">
                                                        <IconButton
                                                            size="small"
                                                            onClick={(e) => handleMenuClick(e, app)}
                                                            sx={{
                                                                bgcolor: 'grey.50',
                                                                '&:hover': { bgcolor: 'grey.100' }
                                                            }}
                                                        >
                                                            <MoreIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                                        <DeviceIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2, opacity: 0.5 }} />
                                        <Typography variant="h6" color="textSecondary" gutterBottom>
                                            No applications found
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            {searchTerm
                                                ? 'Try adjusting your search criteria'
                                                : 'Try applying different filters or refresh the page'}
                                        </Typography>
                                        <Button
                                            variant="outlined"
                                            sx={{ mt: 2 }}
                                            onClick={handleRefresh}
                                            startIcon={<RefreshIcon />}
                                        >
                                            Refresh Data
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                {applications.length > 0 && (
                    <TablePagination
                        rowsPerPageOptions={[10, 25, 50, 100]}
                        component="div"
                        count={applications.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={(e, newPage) => setPage(newPage)}
                        onRowsPerPageChange={(e) => {
                            setRowsPerPage(parseInt(e.target.value, 10));
                            setPage(0);
                        }}
                        sx={{
                            borderTop: `1px solid ${theme.palette.divider}`,
                            '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                                fontWeight: 'medium'
                            }
                        }}
                    />
                )}
            </Paper>

            {/* Status Update Dialog */}
            <ApplicationStatusDialog
                open={statusDialog.open}
                application={statusDialog.application}
                onClose={() => setStatusDialog({ open: false, application: null })}
                onUpdate={handleStatusUpdate}
            />

            {/* Application Details Dialog */}
            <ApplicationDetailsDialog
                open={detailsDialog.open}
                application={detailsDialog.application}
                onClose={() => setDetailsDialog({ open: false, application: null })}
            />

            {/* More Options Menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                PaperProps={{
                    sx: {
                        minWidth: 200,
                        borderRadius: 2,
                        boxShadow: 3
                    }
                }}
            >
                {selectedApp && (
                    <>
                        <MenuItem
                            onClick={() => {
                                setDetailsDialog({ open: true, application: selectedApp });
                                handleMenuClose();
                            }}
                            sx={{ py: 1.5 }}
                        >
                            <ListItemIcon>
                                <ViewIcon fontSize="small" color="primary" />
                            </ListItemIcon>
                            <ListItemText primary="View Details" />
                        </MenuItem>
                        {selectedApp.client_user_id && (
                            <MenuItem
                                onClick={() => {
                                    navigate(`/client-users/${selectedApp.client_user_id}`);
                                    handleMenuClose();
                                }}
                                sx={{ py: 1.5 }}
                            >
                                <ListItemIcon>
                                    <PersonIcon fontSize="small" color="info" />
                                </ListItemIcon>
                                <ListItemText primary="View User Profile" />
                            </MenuItem>
                        )}
                        {selectedApp.email && (
                            <MenuItem
                                onClick={() => {
                                    window.open(`mailto:${selectedApp.email}`, '_blank');
                                    handleMenuClose();
                                }}
                                sx={{ py: 1.5 }}
                            >
                                <ListItemIcon>
                                    <EmailIcon fontSize="small" color="action" />
                                </ListItemIcon>
                                <ListItemText primary="Email User" />
                            </MenuItem>
                        )}
                        {selectedApp.phone_number && (
                            <MenuItem
                                onClick={() => {
                                    window.open(`tel:${selectedApp.phone_number}`, '_blank');
                                    handleMenuClose();
                                }}
                                sx={{ py: 1.5 }}
                            >
                                <ListItemIcon>
                                    <CallIcon fontSize="small" color="action" />
                                </ListItemIcon>
                                <ListItemText primary="Call User" />
                            </MenuItem>
                        )}
                        <Divider />
                        <MenuItem
                            onClick={() => {
                                setStatusDialog({ open: true, application: selectedApp });
                                handleMenuClose();
                            }}
                            sx={{ py: 1.5 }}
                        >
                            <ListItemIcon>
                                <EditIcon fontSize="small" color="warning" />
                            </ListItemIcon>
                            <ListItemText primary="Update Status" />
                        </MenuItem>
                    </>
                )}
            </Menu>

            {/* Additional Stats Section */}
            {stats && stats.device_stats && stats.device_stats.length > 0 && (
                <Paper sx={{ mt: 3, p: 3, borderRadius: 2 }}>
                    <Typography variant="h6" gutterBottom fontWeight="bold">
                        Device Statistics
                    </Typography>
                    <Grid container spacing={2}>
                        {stats.device_stats.slice(0, 4).map((device, index) => (
                            <Grid item xs={12} sm={6} md={3} key={index}>
                                <Card variant="outlined" sx={{ height: '100%' }}>
                                    <CardContent>
                                        <Typography variant="subtitle2" fontWeight="medium" gutterBottom>
                                            {device.device_name}
                                        </Typography>
                                        <Typography variant="caption" color="textSecondary" display="block" gutterBottom>
                                            {device.manufacturer}
                                        </Typography>
                                        <Stack spacing={1} mt={1}>
                                            <Box display="flex" justifyContent="space-between">
                                                <Typography variant="caption">Total:</Typography>
                                                <Typography variant="caption" fontWeight="bold">
                                                    {formatNumber(device.total_applications)}
                                                </Typography>
                                            </Box>
                                            <Box display="flex" justifyContent="space-between">
                                                <Typography variant="caption">Approved:</Typography>
                                                <Typography variant="caption" color="success.main" fontWeight="bold">
                                                    {formatNumber(device.approved_count)}
                                                </Typography>
                                            </Box>
                                            <Box display="flex" justifyContent="space-between">
                                                <Typography variant="caption">Pending:</Typography>
                                                <Typography variant="caption" color="warning.main" fontWeight="bold">
                                                    {formatNumber(device.pending_count)}
                                                </Typography>
                                            </Box>
                                        </Stack>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Paper>
            )}
        </Box>
    );
};

export default AdminApplications;