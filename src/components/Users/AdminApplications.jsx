import React, { useState, useEffect } from 'react';
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
} from '@mui/icons-material';
import { deviceAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import ApplicationStatusDialog from './ApplicationStatusDialog';
import ApplicationDetailsDialog from './ApplicationDetailsDialog';

// Simple date formatting
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

const AdminApplications = () => {
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
    const navigate = useNavigate();

    useEffect(() => {
        fetchApplications();
        fetchStatistics();
    }, []);

    const fetchApplications = async (customFilters = {}) => {
        try {
            setLoading(true);
            const allFilters = { ...filters, ...customFilters };
            let queryParams = '';
            const params = [];

            // Build query string
            Object.keys(allFilters).forEach(key => {
                if (allFilters[key] && allFilters[key] !== 'all') {
                    params.push(`${key}=${encodeURIComponent(allFilters[key])}`);
                }
            });

            if (params.length > 0) {
                queryParams = '?' + params.join('&');
            }

            console.log('Fetching applications with query:', queryParams);
            const response = await deviceAPI.getAllApplications(queryParams);
            console.log('Applications response:', response.data);
            setApplications(response.data?.data || []);
        } catch (err) {
            setError(err.message || 'Failed to fetch applications');
            console.error('Error fetching applications:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchStatistics = async () => {
        try {
            setStatsLoading(true);
            const response = await deviceAPI.getApplicationStatistics();
            console.log('Statistics response:', response.data);
            setStats(response.data?.data);
        } catch (err) {
            console.error('Failed to fetch statistics:', err);
        } finally {
            setStatsLoading(false);
        }
    };

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

    const handleEmailUser = (email) => {
        window.open(`mailto:${email}`, '_blank');
    };

    const handleCallUser = (phone) => {
        window.open(`tel:${phone}`, '_blank');
    };

    const handleViewUser = (userId) => {
        navigate(`/client-users/${userId}`);
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
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box>
                    <Typography variant="h4" gutterBottom>
                        Application Management
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        Manage and review all device applications
                    </Typography>
                </Box>
                <Box display="flex" gap={1}>
                    <Tooltip title="Refresh">
                        <IconButton onClick={handleRefresh}>
                            <RefreshIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            {/* Statistics Cards */}
            {stats && !statsLoading && (
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                                    <Box>
                                        <Typography color="textSecondary" variant="caption" gutterBottom>
                                            Total Applications
                                        </Typography>
                                        <Typography variant="h4" component="div">
                                            {stats.summary?.total_applications || 0}
                                        </Typography>
                                    </Box>
                                    <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main' }}>
                                        <PendingIcon />
                                    </Avatar>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                                    <Box>
                                        <Typography color="textSecondary" variant="caption" gutterBottom>
                                            Pending
                                        </Typography>
                                        <Typography variant="h4" component="div">
                                            {stats.summary?.pending || 0}
                                        </Typography>
                                    </Box>
                                    <Avatar sx={{ bgcolor: 'warning.light', color: 'warning.main' }}>
                                        <PendingIcon />
                                    </Avatar>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                                    <Box>
                                        <Typography color="textSecondary" variant="caption" gutterBottom>
                                            Approved
                                        </Typography>
                                        <Typography variant="h4" component="div">
                                            {stats.summary?.approved || 0}
                                        </Typography>
                                    </Box>
                                    <Avatar sx={{ bgcolor: 'success.light', color: 'success.main' }}>
                                        <ApprovedIcon />
                                    </Avatar>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                                    <Box>
                                        <Typography color="textSecondary" variant="caption" gutterBottom>
                                            Rejected
                                        </Typography>
                                        <Typography variant="h4" component="div">
                                            {stats.summary?.rejected || 0}
                                        </Typography>
                                    </Box>
                                    <Avatar sx={{ bgcolor: 'error.light', color: 'error.main' }}>
                                        <RejectedIcon />
                                    </Avatar>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {/* Filters and Search */}
            <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={4}>
                        <TextField
                            fullWidth
                            placeholder="Search applications..."
                            variant="outlined"
                            size="small"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyPress={handleSearch}
                            InputProps={{
                                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                            }}
                        />
                    </Grid>
                    <Grid item xs={6} md={2}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Status</InputLabel>
                            <Select
                                value={filters.status}
                                label="Status"
                                onChange={(e) => handleFilterChange('status', e.target.value)}
                            >
                                <MenuItem value="all">All Status</MenuItem>
                                <MenuItem value="Pending">Pending</MenuItem>
                                <MenuItem value="Approved">Approved</MenuItem>
                                <MenuItem value="Rejected">Rejected</MenuItem>
                                <MenuItem value="Cancelled">Cancelled</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={6} md={2}>
                        <FormControl fullWidth size="small">
                            <InputLabel>User Type</InputLabel>
                            <Select
                                value={filters.user_type}
                                label="User Type"
                                onChange={(e) => handleFilterChange('user_type', e.target.value)}
                            >
                                <MenuItem value="all">All Types</MenuItem>
                                <MenuItem value="Advocate">Advocate</MenuItem>
                                <MenuItem value="Magistrate">Magistrate</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={6} md={2}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Region</InputLabel>
                            <Select
                                value={filters.region}
                                label="Region"
                                onChange={(e) => handleFilterChange('region', e.target.value)}
                            >
                                <MenuItem value="all">All Regions</MenuItem>
                                <MenuItem value="Gauteng">Gauteng</MenuItem>
                                <MenuItem value="Western Cape">Western Cape</MenuItem>
                                <MenuItem value="KwaZulu-Natal">KwaZulu-Natal</MenuItem>
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
                            variant="outlined"
                            onClick={handleClearFilters}
                            size="small"
                            startIcon={<FilterIcon />}
                        >
                            Clear Filters
                        </Button>
                    </Grid>
                </Grid>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* Applications Table */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Application ID</TableCell>
                            <TableCell>Applicant</TableCell>
                            <TableCell>Device Details</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Submission Date</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {applications.length > 0 ? (
                            applications
                                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                .map((app) => (
                                    <TableRow key={app.application_id} hover>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight="medium">
                                                #{app.application_id}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Box display="flex" alignItems="center">
                                                <Avatar sx={{ width: 32, height: 32, mr: 2, bgcolor: 'primary.main' }}>
                                                    {app.first_name?.[0] || <PersonIcon />}
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="body2" fontWeight="medium">
                                                        {app.first_name} {app.last_name}
                                                    </Typography>
                                                    <Typography variant="caption" color="textSecondary" display="block">
                                                        {app.email}
                                                    </Typography>
                                                    <Box display="flex" gap={0.5} mt={0.5}>
                                                        <Chip
                                                            label={app.user_type || 'N/A'}
                                                            size="small"
                                                            color={app.user_type === 'Advocate' ? 'primary' : 'secondary'}
                                                            variant="outlined"
                                                        />
                                                        {app.region && (
                                                            <Chip
                                                                label={app.region}
                                                                size="small"
                                                                variant="outlined"
                                                            />
                                                        )}
                                                    </Box>
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
                                                <Typography variant="caption" display="block">
                                                    Plan: {app.plan_name || 'N/A'} • R{app.monthly_cost || 0}/month
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                icon={getStatusIcon(app.application_status)}
                                                label={app.application_status}
                                                color={getStatusColor(app.application_status)}
                                                size="small"
                                                sx={{ minWidth: 100 }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {formatDate(app.submission_date)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Box display="flex" gap={1}>
                                                <Tooltip title="View Details">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => setDetailsDialog({ open: true, application: app })}
                                                    >
                                                        <ViewIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Update Status">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => setStatusDialog({ open: true, application: app })}
                                                        disabled={app.application_status === 'Cancelled'}
                                                    >
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="More Options">
                                                    <IconButton
                                                        size="small"
                                                        onClick={(e) => handleMenuClick(e, app)}
                                                    >
                                                        <MoreIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                                    <DeviceIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                                    <Typography color="textSecondary" gutterBottom>
                                        No applications found
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">
                                        {searchTerm ? 'Try a different search term' : 'Try adjusting your filters'}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
                {applications.length > 0 && (
                    <TablePagination
                        rowsPerPageOptions={[5, 10, 25, 50]}
                        component="div"
                        count={applications.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={(e, newPage) => setPage(newPage)}
                        onRowsPerPageChange={(e) => {
                            setRowsPerPage(parseInt(e.target.value, 10));
                            setPage(0);
                        }}
                    />
                )}
            </TableContainer>

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
            >
                {selectedApp && (
                    <>
                        <MenuItem onClick={() => {
                            setDetailsDialog({ open: true, application: selectedApp });
                            handleMenuClose();
                        }}>
                            <ListItemIcon>
                                <ViewIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText>View Details</ListItemText>
                        </MenuItem>
                        {selectedApp.client_user_id && (
                            <MenuItem onClick={() => {
                                handleViewUser(selectedApp.client_user_id);
                                handleMenuClose();
                            }}>
                                <ListItemIcon>
                                    <PersonIcon fontSize="small" />
                                </ListItemIcon>
                                <ListItemText>View User Profile</ListItemText>
                            </MenuItem>
                        )}
                        {selectedApp.email && (
                            <MenuItem onClick={() => {
                                handleEmailUser(selectedApp.email);
                                handleMenuClose();
                            }}>
                                <ListItemIcon>
                                    <EmailIcon fontSize="small" />
                                </ListItemIcon>
                                <ListItemText>Email User</ListItemText>
                            </MenuItem>
                        )}
                        {selectedApp.phone_number && (
                            <MenuItem onClick={() => {
                                handleCallUser(selectedApp.phone_number);
                                handleMenuClose();
                            }}>
                                <ListItemIcon>
                                    <CallIcon fontSize="small" />
                                </ListItemIcon>
                                <ListItemText>Call User</ListItemText>
                            </MenuItem>
                        )}
                        <Divider />
                        <MenuItem onClick={() => {
                            setStatusDialog({ open: true, application: selectedApp });
                            handleMenuClose();
                        }}>
                            <ListItemIcon>
                                <EditIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText>Update Status</ListItemText>
                        </MenuItem>
                    </>
                )}
            </Menu>
        </Box>
    );
};

export default AdminApplications;