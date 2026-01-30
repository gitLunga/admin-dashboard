import React, { useState, useEffect, useMemo } from 'react';
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
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Stack,
} from '@mui/material';
import {
    Search as SearchIcon,
    Edit as EditIcon,
    Visibility as ViewIcon,
    FilterList as FilterListIcon,
} from '@mui/icons-material';
import { adminAPI } from '../../services/api';
import StatusUpdateModal from './StatusUpdateModal';

const ClientUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [selectedUser, setSelectedUser] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedRegion, setSelectedRegion] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all'); // New state for status filter

    useEffect(() => {
        fetchClientUsers();
    }, []);

    const fetchClientUsers = async () => {
        try {
            setLoading(true);
            const response = await adminAPI.getClientUsers();
            setUsers(response.data.data.users);
        } catch (err) {
            setError(err.message || 'Failed to fetch client users');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        if (searchTerm.length < 2) {
            fetchClientUsers();
            return;
        }

        try {
            setLoading(true);
            const response = await adminAPI.searchUsers(searchTerm);
            const filtered = response.data.data.users.filter(
                (user) => user.user_type === 'client'
            );
            setUsers(filtered);
        } catch (err) {
            setError(err.message || 'Search failed');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (status, notes) => {
        if (!selectedUser) return;

        try {
            console.log('Updating user status:', {
                userId: selectedUser.client_user_id,
                status,
                notes
            });

            await adminAPI.updateUserStatus(selectedUser.client_user_id, { status, notes });
            // Refresh users list
            fetchClientUsers();
            setModalOpen(false);
            setSelectedUser(null);
        } catch (err) {
            console.error('Error updating status:', err);
            setError(err.message || 'Failed to update status');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Verified':
                return 'success';
            case 'Pending':
                return 'warning';
            case 'Rejected':
                return 'error';
            default:
                return 'default';
        }
    };

    // Get unique regions from users for the filter dropdown
    const uniqueRegions = useMemo(() => {
        const regions = users
            .map(user => user.region)
            .filter(region => region && region.trim() !== '');
        return ['All Regions', ...new Set(regions)].sort();
    }, [users]);

    // Get unique statuses from users
    const uniqueStatuses = useMemo(() => {
        const statuses = users
            .map(user => user.registration_status)
            .filter(status => status && status.trim() !== '');
        return ['All Statuses', ...new Set(statuses)].sort();
    }, [users]);

    // Filter users based on search term, region, AND status
    const filteredUsers = useMemo(() => {
        return users.filter((user) => {
            // Search filter
            const matchesSearch =
                user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.persal_id?.toLowerCase().includes(searchTerm.toLowerCase());

            // Region filter
            const matchesRegion =
                selectedRegion === 'all' ||
                selectedRegion === 'All Regions' ||
                user.region === selectedRegion;

            // Status filter
            const matchesStatus =
                selectedStatus === 'all' ||
                selectedStatus === 'All Statuses' ||
                user.registration_status === selectedStatus;

            return matchesSearch && matchesRegion && matchesStatus;
        });
    }, [users, searchTerm, selectedRegion, selectedStatus]);

    // Clear all filters
    const clearAllFilters = () => {
        setSelectedRegion('all');
        setSelectedStatus('all');
        setSearchTerm('');
        setPage(0);
    };

    // Check if any filter is active
    const hasActiveFilters = selectedRegion !== 'all' || selectedStatus !== 'all' || searchTerm.trim() !== '';

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Client Users Management
            </Typography>

            {/* Search and Filter Section */}
            <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                    <TextField
                        placeholder="Search by name, email, or Persal ID..."
                        variant="outlined"
                        size="small"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        sx={{ flexGrow: 1, minWidth: '300px' }}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <IconButton onClick={handleSearch}>
                        <SearchIcon />
                    </IconButton>
                </Box>

                {/* Filter Controls */}
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FilterListIcon color="action" />
                        <Typography variant="body2" color="textSecondary">
                            Filters:
                        </Typography>
                    </Box>

                    {/* Region Filter */}
                    <FormControl sx={{ minWidth: 180 }} size="small">
                        <InputLabel>Region</InputLabel>
                        <Select
                            value={selectedRegion}
                            label="Region"
                            onChange={(e) => {
                                setSelectedRegion(e.target.value);
                                setPage(0);
                            }}
                        >
                            <MenuItem value="all">All Regions</MenuItem>
                            {uniqueRegions.filter(region => region !== 'All Regions').map((region) => (
                                <MenuItem key={region} value={region}>
                                    {region || 'N/A'}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {/* Status Filter */}
                    <FormControl sx={{ minWidth: 180 }} size="small">
                        <InputLabel>Status</InputLabel>
                        <Select
                            value={selectedStatus}
                            label="Status"
                            onChange={(e) => {
                                setSelectedStatus(e.target.value);
                                setPage(0);
                            }}
                        >
                            <MenuItem value="all">All Statuses</MenuItem>
                            {uniqueStatuses.filter(status => status !== 'All Statuses').map((status) => (
                                <MenuItem key={status} value={status}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box
                                            sx={{
                                                width: 8,
                                                height: 8,
                                                borderRadius: '50%',
                                                bgcolor: status === 'Verified' ? 'success.main' :
                                                    status === 'Pending' ? 'warning.main' :
                                                        status === 'Rejected' ? 'error.main' : 'grey.500'
                                            }}
                                        />
                                        {status}
                                    </Box>
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {/* Clear Filters Button */}
                    {hasActiveFilters && (
                        <Chip
                            label="Clear All Filters"
                            variant="outlined"
                            size="small"
                            onClick={clearAllFilters}
                            sx={{ ml: 1 }}
                        />
                    )}
                </Box>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* Active Filters Display */}
            {hasActiveFilters && (
                <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                        Active Filters:
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                        {selectedRegion !== 'all' && (
                            <Chip
                                label={`Region: ${selectedRegion}`}
                                color="primary"
                                variant="outlined"
                                size="small"
                                onDelete={() => setSelectedRegion('all')}
                            />
                        )}
                        {selectedStatus !== 'all' && (
                            <Chip
                                label={`Status: ${selectedStatus}`}
                                color={getStatusColor(selectedStatus)}
                                variant="outlined"
                                size="small"
                                onDelete={() => setSelectedStatus('all')}
                            />
                        )}
                        {searchTerm.trim() !== '' && (
                            <Chip
                                label={`Search: "${searchTerm}"`}
                                color="info"
                                variant="outlined"
                                size="small"
                                onDelete={() => setSearchTerm('')}
                            />
                        )}
                        <Typography variant="caption" color="textSecondary" sx={{ alignSelf: 'center' }}>
                            {filteredUsers.length} user(s) found
                        </Typography>
                    </Stack>
                </Box>
            )}

            {/* Table Section */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>User</TableCell>
                            <TableCell>Contact</TableCell>
                            <TableCell>Region</TableCell>
                            <TableCell>User Type</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredUsers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                                    <Typography color="textSecondary">
                                        {hasActiveFilters ? (
                                            <>
                                                No users found matching your filters.
                                                <br />
                                                <Typography
                                                    component="span"
                                                    color="primary"
                                                    sx={{ cursor: 'pointer' }}
                                                    onClick={clearAllFilters}
                                                >
                                                    Clear all filters
                                                </Typography>
                                            </>
                                        ) : 'No users found'}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredUsers
                                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                .map((user) => (
                                    <TableRow key={user.client_user_id} hover>
                                        <TableCell>
                                            <Box display="flex" alignItems="center">
                                                <Avatar sx={{ width: 32, height: 32, mr: 2, bgcolor: 'primary.main' }}>
                                                    {user.first_name?.[0]}{user.last_name?.[0]}
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="body2" fontWeight="medium">
                                                        {user.title} {user.first_name} {user.last_name}
                                                    </Typography>
                                                    <Typography variant="caption" color="textSecondary">
                                                        ID: {user.client_user_id}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">{user.email}</Typography>
                                            {user.phone_number && (
                                                <Typography variant="caption" color="textSecondary">
                                                    {user.phone_number}
                                                </Typography>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {user.region || 'N/A'}
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={user.user_type}
                                                size="small"
                                                color="primary"
                                                variant="outlined"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={user.registration_status}
                                                color={getStatusColor(user.registration_status)}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <IconButton
                                                size="small"
                                                onClick={() => {
                                                    setSelectedUser(user);
                                                    setModalOpen(true);
                                                }}
                                                title="Update Status"
                                            >
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={() =>
                                                    (window.location.href = `/client-users/${user.client_user_id}`)
                                                }
                                                title="View Details"
                                            >
                                                <ViewIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))
                        )}
                    </TableBody>
                </Table>
                {filteredUsers.length > 0 && (
                    <TablePagination
                        rowsPerPageOptions={[5, 10, 25]}
                        component="div"
                        count={filteredUsers.length}
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

            {selectedUser && (
                <StatusUpdateModal
                    open={modalOpen}
                    user={selectedUser}
                    onClose={() => {
                        setModalOpen(false);
                        setSelectedUser(null);
                    }}
                    onSubmit={handleStatusUpdate}
                />
            )}
        </Box>
    );
};

export default ClientUsers;