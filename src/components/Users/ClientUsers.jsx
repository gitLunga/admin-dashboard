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
} from '@mui/material';
import {
    Search as SearchIcon,
    Edit as EditIcon,
    Visibility as ViewIcon,
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

    const filteredUsers = users.filter((user) =>
        user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.persal_id?.toLowerCase().includes(searchTerm.toLowerCase())
    );

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

            <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
                <TextField
                    placeholder="Search by name, email, or Persal ID..."
                    variant="outlined"
                    size="small"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    sx={{ flexGrow: 1 }}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <IconButton onClick={handleSearch}>
                    <SearchIcon />
                </IconButton>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

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
                        {filteredUsers
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
                                    <TableCell>{user.region || 'N/A'}</TableCell>
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
                            ))}
                    </TableBody>
                </Table>
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