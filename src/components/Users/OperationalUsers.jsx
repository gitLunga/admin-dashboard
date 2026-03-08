import React, { useState, useEffect } from 'react';
import {
    Box, Paper, Typography, IconButton, Chip, Alert, CircularProgress,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    TablePagination, Avatar, Button, Dialog, DialogTitle, DialogContent,
    DialogActions, MenuItem, Select, FormControl, TextField,
    Tooltip, useMediaQuery, useTheme,
} from '@mui/material';
import {
    Search as SearchIcon, Edit as EditIcon, Visibility as ViewIcon,
    Add as AddIcon, Email as EmailIcon, Delete as DeleteIcon,
    Clear as ClearIcon, ManageAccounts as ManageIcon, Close as CloseIcon,
} from '@mui/icons-material';
import { adminAPI } from '../../services/api';
import { USER_ROLES } from '../../utils/constants';

const T = {
    bg: '#F8F9FC', surface: '#FFFFFF', border: '#E8ECF4',
    text: '#0F1F3D', muted: '#6B7A99',
    accent: '#1E4FD8', accentSoft: '#EBF0FF',
    green: '#059669', greenSoft: '#D1FAE5',
    amber: '#D97706', amberSoft: '#FEF3C7',
    rose: '#DC2626', roseSoft: '#FEE2E2',
    purple: '#7C3AED', purpleSoft: '#EDE9FE',
    cyan: '#0891B2', cyanSoft: '#CFFAFE',
};

const ROLE_META = {
    Admin:   { color: T.rose,  soft: T.roseSoft  },
    Manager: { color: T.amber, soft: T.amberSoft  },
    Support: { color: T.cyan,  soft: T.cyanSoft   },
};

const RoleBadge = ({ role }) => {
    const m = ROLE_META[role] || { color: T.muted, soft: '#F1F5F9' };
    return (
        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.6, px: 1.1, py: 0.3, borderRadius: '20px', bgcolor: m.soft, border: `1px solid ${m.color}28` }}>
            <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: m.color }} />
            <Typography sx={{ fontSize: '0.69rem', fontWeight: 600, color: m.color }}>{role}</Typography>
        </Box>
    );
};

const InputField = ({ label, name, value, onChange, type = 'text', required }) => (
    <Box>
        <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: 0.8, mb: 0.8 }}>
            {label}{required && <span style={{ color: T.rose }}> *</span>}
        </Typography>
        <TextField fullWidth size="small" name={name} value={value} onChange={onChange} type={type} required={required}
                   sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: T.bg, fontSize: '0.85rem', '& fieldset': { borderColor: T.border }, '&:hover fieldset': { borderColor: T.accent }, '&.Mui-focused fieldset': { borderColor: T.accent } }, '& input': { fontFamily: 'Plus Jakarta Sans, sans-serif' } }} />
    </Box>
);

const OperationalUsers = () => {
    const theme    = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const [users,        setUsers]        = useState([]);
    const [loading,      setLoading]      = useState(true);
    const [error,        setError]        = useState(null);
    const [searchTerm,   setSearchTerm]   = useState('');
    const [page,         setPage]         = useState(0);
    const [rowsPerPage,  setRowsPerPage]  = useState(10);
    const [dialogOpen,   setDialogOpen]   = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [formData,     setFormData]     = useState({ first_name: '', last_name: '', email: '', user_role: 'Admin' });

    useEffect(() => { fetchOperationalUsers(); }, []);

    const fetchOperationalUsers = async () => {
        try {
            setLoading(true);
            const response = await adminAPI.getOperationalUsers();
            setUsers(response.data.data.users);
        } catch (err) { setError(err.message || 'Failed to fetch operational users'); }
        finally { setLoading(false); }
    };

    const handleSearch = async () => {
        if (searchTerm.length < 2) { fetchOperationalUsers(); return; }
        try {
            setLoading(true);
            const response = await adminAPI.searchUsers(searchTerm);
            setUsers(response.data.data.users.filter(u => u.user_type === 'operational'));
        } catch (err) { setError(err.message || 'Search failed'); }
        finally { setLoading(false); }
    };

    const handleOpenDialog = (user = null) => {
        if (user) {
            setFormData({ first_name: user.first_name, last_name: user.last_name, email: user.email, user_role: user.user_role });
            setSelectedUser(user);
        } else {
            setFormData({ first_name: '', last_name: '', email: '', user_role: 'Admin' });
            setSelectedUser(null);
        }
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false); setSelectedUser(null);
        setFormData({ first_name: '', last_name: '', email: '', user_role: 'Admin' });
    };

    const handleFormChange = e => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        try { handleCloseDialog(); fetchOperationalUsers(); }
        catch (err) { setError(err.message || 'Operation failed'); }
    };

    const handleDelete = async (userId) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            try { fetchOperationalUsers(); }
            catch (err) { setError(err.message || 'Delete failed'); }
        }
    };

    const filteredUsers = users.filter(u =>
        u.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.user_role?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400, bgcolor: T.bg }}><CircularProgress sx={{ color: T.accent }} /></Box>;

    return (
        <Box sx={{ p: { xs: 2, md: 3.5 }, bgcolor: T.bg, minHeight: '100vh' }}>

            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 1.5, animation: 'fadeUp 0.4s ease-out' }}>
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 0.3 }}>
                        <Box sx={{ p: 1, borderRadius: '10px', bgcolor: T.purpleSoft }}>
                            <ManageIcon sx={{ fontSize: 20, color: T.purple }} />
                        </Box>
                        <Typography sx={{ fontSize: { xs: '1.25rem', md: '1.6rem' }, fontWeight: 800, color: T.text, letterSpacing: '-0.3px' }}>
                            Operational Users
                        </Typography>
                    </Box>
                    <Typography sx={{ fontSize: '0.78rem', color: T.muted, ml: 0.5 }}>
                        Manage system administrators and staff
                    </Typography>
                </Box>
                <Button variant="contained" startIcon={<AddIcon sx={{ fontSize: '16px !important' }} />} onClick={() => handleOpenDialog()}
                        sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '0.83rem', bgcolor: T.accent, boxShadow: 'none', '&:hover': { bgcolor: '#1641B8', boxShadow: `0 4px 14px ${T.accent}44` } }}>
                    Add User
                </Button>
            </Box>

            {/* Search */}
            <Paper elevation={0} sx={{ p: { xs: 2, md: 2.5 }, mb: 2.5, borderRadius: '14px', border: `1px solid ${T.border}`, bgcolor: T.surface }}>
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: T.bg, border: `1px solid ${T.border}`, borderRadius: '10px', px: 1.5, py: 0.7, flex: 1, minWidth: { xs: '100%', sm: 240 }, '&:focus-within': { borderColor: T.accent, boxShadow: `0 0 0 3px ${T.accentSoft}` }, transition: 'all 0.2s' }}>
                        <SearchIcon sx={{ fontSize: 16, color: T.muted, flexShrink: 0 }} />
                        <input
                            placeholder="Search by name, email, or role…"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            onKeyPress={e => e.key === 'Enter' && handleSearch()}
                            style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%', fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '0.83rem', color: T.text }}
                        />
                        {searchTerm && <IconButton size="small" onClick={() => setSearchTerm('')} sx={{ p: 0.3, color: T.muted }}><ClearIcon sx={{ fontSize: 13 }} /></IconButton>}
                    </Box>
                    <Chip label={`${filteredUsers.length} user${filteredUsers.length !== 1 ? 's' : ''}`} size="small"
                          sx={{ height: 28, fontSize: '0.75rem', fontWeight: 700, bgcolor: T.purpleSoft, color: T.purple, fontFamily: 'JetBrains Mono, monospace' }} />
                </Box>
            </Paper>

            {error && <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2, borderRadius: '10px', fontSize: '0.83rem' }}>{error}</Alert>}

            {/* Table */}
            <Paper elevation={0} sx={{ borderRadius: '14px', border: `1px solid ${T.border}`, bgcolor: T.surface, overflow: 'hidden' }}>
                <TableContainer>
                    <Table size={isMobile ? 'small' : 'medium'}>
                        <TableHead>
                            <TableRow sx={{ bgcolor: T.bg }}>
                                {['User', !isMobile && 'Email', 'Role', 'Actions'].filter(Boolean).map(h => (
                                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.7rem', color: T.muted, letterSpacing: 0.8, textTransform: 'uppercase', py: 1.6, borderBottom: `1px solid ${T.border}` }}>{h}</TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredUsers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((user, i) => (
                                <TableRow key={user.op_user_id} hover sx={{ '&:hover': { bgcolor: T.bg }, transition: 'background-color 0.15s ease', animation: `fadeUp 0.35s ease-out ${i * 0.03}s both` }}>
                                    <TableCell sx={{ py: 1.8, borderBottom: `1px solid ${T.border}` }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <Avatar sx={{ width: 34, height: 34, borderRadius: '10px', bgcolor: T.purpleSoft, color: T.purple, fontSize: '0.73rem', fontWeight: 700, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                                                {user.first_name?.[0]}{user.last_name?.[0]}
                                            </Avatar>
                                            <Box>
                                                <Typography sx={{ fontSize: '0.83rem', fontWeight: 600, color: T.text }}>{user.first_name} {user.last_name}</Typography>
                                                <Typography className="mono" sx={{ fontSize: '0.67rem', color: T.muted }}>#{user.op_user_id}</Typography>
                                                {isMobile && <Typography sx={{ fontSize: '0.71rem', color: T.muted, mt: 0.2 }}>{user.email}</Typography>}
                                            </Box>
                                        </Box>
                                    </TableCell>
                                    {!isMobile && (
                                        <TableCell sx={{ py: 1.8, borderBottom: `1px solid ${T.border}` }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                                <EmailIcon sx={{ fontSize: 13, color: T.muted }} />
                                                <Typography sx={{ fontSize: '0.8rem', color: T.text }}>{user.email}</Typography>
                                            </Box>
                                        </TableCell>
                                    )}
                                    <TableCell sx={{ py: 1.8, borderBottom: `1px solid ${T.border}` }}>
                                        <RoleBadge role={user.user_role} />
                                    </TableCell>
                                    <TableCell sx={{ py: 1.8, borderBottom: `1px solid ${T.border}` }}>
                                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                                            <Tooltip title="Edit">
                                                <IconButton size="small" onClick={() => handleOpenDialog(user)}
                                                            sx={{ width: 28, height: 28, borderRadius: '8px', bgcolor: T.amberSoft, color: T.amber, '&:hover': { bgcolor: '#FDE68A' } }}>
                                                    <EditIcon sx={{ fontSize: 14 }} />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="View">
                                                <IconButton size="small" onClick={() => window.location.href = `/operational-users/${user.op_user_id}`}
                                                            sx={{ width: 28, height: 28, borderRadius: '8px', bgcolor: T.accentSoft, color: T.accent, '&:hover': { bgcolor: '#DBEAFE' } }}>
                                                    <ViewIcon sx={{ fontSize: 14 }} />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete">
                                                <IconButton size="small" onClick={() => handleDelete(user.op_user_id)}
                                                            sx={{ width: 28, height: 28, borderRadius: '8px', bgcolor: T.roseSoft, color: T.rose, '&:hover': { bgcolor: '#FECACA' } }}>
                                                    <DeleteIcon sx={{ fontSize: 14 }} />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filteredUsers.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} sx={{ py: 7, textAlign: 'center', borderBottom: 'none' }}>
                                        <ManageIcon sx={{ fontSize: 44, color: T.border, mb: 1.5 }} />
                                        <Typography sx={{ fontSize: '0.88rem', fontWeight: 600, color: T.muted }}>No operational users found</Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25]} component="div"
                    count={filteredUsers.length} rowsPerPage={rowsPerPage} page={page}
                    onPageChange={(e, p) => setPage(p)}
                    onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                    sx={{ borderTop: `1px solid ${T.border}`, '& *': { fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '0.8rem' } }}
                />
            </Paper>

            {/* Add / Edit Dialog */}
            <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth
                    PaperProps={{ sx: { borderRadius: '16px', border: `1px solid ${T.border}`, boxShadow: '0 24px 60px rgba(15,31,61,0.14)', bgcolor: T.bg } }}>
                <DialogTitle sx={{ p: 0 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 3, py: 2.2, bgcolor: T.surface, borderBottom: `1px solid ${T.border}` }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                            <Box sx={{ width: 30, height: 30, borderRadius: '9px', bgcolor: selectedUser ? T.amberSoft : T.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {selectedUser ? <EditIcon sx={{ fontSize: 15, color: T.amber }} /> : <AddIcon sx={{ fontSize: 15, color: T.accent }} />}
                            </Box>
                            <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: T.text }}>
                                {selectedUser ? 'Edit Operational User' : 'Add New Operational User'}
                            </Typography>
                        </Box>
                        <Button onClick={handleCloseDialog} sx={{ minWidth: 0, p: 0.7, borderRadius: '8px', color: T.muted, '&:hover': { bgcolor: T.bg, color: T.rose } }}>
                            <CloseIcon sx={{ fontSize: 17 }} />
                        </Button>
                    </Box>
                </DialogTitle>
                <DialogContent sx={{ p: 3, bgcolor: T.bg }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
                            <Box sx={{ flex: 1 }}><InputField label="First Name" name="first_name" value={formData.first_name} onChange={handleFormChange} required /></Box>
                            <Box sx={{ flex: 1 }}><InputField label="Last Name"  name="last_name"  value={formData.last_name}  onChange={handleFormChange} required /></Box>
                        </Box>
                        <InputField label="Email" name="email" value={formData.email} onChange={handleFormChange} type="email" required />
                        <Box>
                            <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: 0.8, mb: 0.8 }}>
                                Role <span style={{ color: T.rose }}>*</span>
                            </Typography>
                            <Select name="user_role" value={formData.user_role} onChange={handleFormChange} fullWidth size="small"
                                    sx={{ borderRadius: '10px', bgcolor: T.bg, fontSize: '0.85rem', '& .MuiOutlinedInput-notchedOutline': { borderColor: T.border }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: T.accent }, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: T.accent } }}>
                                {USER_ROLES.map(role => (
                                    <MenuItem key={role.value} value={role.value} sx={{ fontSize: '0.85rem' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                                            <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: ROLE_META[role.value]?.color || T.muted }} />
                                            {role.label}
                                        </Box>
                                    </MenuItem>
                                ))}
                            </Select>
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2.2, bgcolor: T.surface, borderTop: `1px solid ${T.border}`, gap: 1.5 }}>
                    <Button onClick={handleCloseDialog}
                            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '0.83rem', color: T.muted, border: `1px solid ${T.border}`, bgcolor: T.bg, '&:hover': { bgcolor: T.border } }}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} variant="contained"
                            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '0.83rem', bgcolor: T.accent, boxShadow: 'none', '&:hover': { bgcolor: '#1641B8', boxShadow: `0 4px 14px ${T.accent}44` } }}>
                        {selectedUser ? 'Save Changes' : 'Create User'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default OperationalUsers;