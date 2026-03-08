import React, { useState, useEffect } from 'react';
import {
    Box, Paper, Typography, IconButton, Chip, Alert, CircularProgress,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    TablePagination, Avatar, Tooltip, FormControl, Select, MenuItem,
    Button, useMediaQuery, useTheme,
} from '@mui/material';
import {
    Search as SearchIcon, FilterList as FilterIcon, Refresh as RefreshIcon, Clear as ClearIcon,
    People as PeopleIcon,
} from '@mui/icons-material';
import { adminAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';

const T = {
    bg: '#F8F9FC', surface: '#FFFFFF', border: '#E8ECF4',
    text: '#0F1F3D', muted: '#6B7A99',
    accent: '#1E4FD8', accentSoft: '#EBF0FF',
    green: '#059669', greenSoft: '#D1FAE5',
    amber: '#D97706', amberSoft: '#FEF3C7',
    rose: '#DC2626', roseSoft: '#FEE2E2',
    purple: '#7C3AED', purpleSoft: '#EDE9FE',
    cyanSoft: '#CFFAFE', // Added missing color
};

const STATUS_META = {
    Verified: { color: T.green, soft: T.greenSoft },
    Pending:  { color: T.amber, soft: T.amberSoft },
    Rejected: { color: T.rose,  soft: T.roseSoft  },
};

const StatusBadge = ({ status }) => {
    const m = STATUS_META[status] || { color: T.muted, soft: '#F1F5F9' };
    return (
        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.6, px: 1.1, py: 0.3, borderRadius: '20px', bgcolor: m.soft, border: `1px solid ${m.color}28` }}>
            <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: m.color }} />
            <Typography sx={{ fontSize: '0.69rem', fontWeight: 600, color: m.color }}>{status}</Typography>
        </Box>
    );
};

const UserList = () => {
    const theme    = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const navigate = useNavigate();

    const [users,         setUsers]         = useState([]);
    const [loading,       setLoading]       = useState(true);
    const [error,         setError]         = useState(null);
    const [searchTerm,    setSearchTerm]    = useState('');
    const [page,          setPage]          = useState(0);
    const [rowsPerPage,   setRowsPerPage]   = useState(10);
    const [filterType,    setFilterType]    = useState('all');
    const [filterStatus,  setFilterStatus]  = useState('all');

    useEffect(() => { fetchAllUsers(); }, []);

    const fetchAllUsers = async () => {
        try {
            setLoading(true);
            const response = await adminAPI.getAllUsers();
            // Ensure we're setting an array
            const usersData = response.data?.data;
            setUsers(Array.isArray(usersData) ? usersData : []);
        } catch (err) {
            setError(err.message || 'Failed to fetch users');
            setUsers([]); // Reset to empty array on error
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        if (searchTerm.length < 2) {
            fetchAllUsers();
            return;
        }
        try {
            setLoading(true);
            const response = await adminAPI.searchUsers(searchTerm);
            // Ensure we're setting an array
            const usersData = response.data?.data?.users;
            setUsers(Array.isArray(usersData) ? usersData : []);
        } catch (err) {
            setError(err.message || 'Search failed');
            setUsers([]); // Reset to empty array on error
        } finally {
            setLoading(false);
        }
    };

    // Add safety check for users.filter
    const filteredUsers = (Array.isArray(users) ? users : []).filter(user => {
        if (filterType !== 'all' && user.user_category !== filterType) return false;
        if (filterStatus !== 'all' && user.registration_status !== filterStatus) return false;
        const s = searchTerm.toLowerCase();
        return !s || user.first_name?.toLowerCase().includes(s) ||
            user.last_name?.toLowerCase().includes(s) ||
            user.email?.toLowerCase().includes(s) ||
            user.phone_number?.toLowerCase().includes(s) ||
            user.region?.toLowerCase().includes(s);
    });

    const hasFilters = filterType !== 'all' || filterStatus !== 'all' || searchTerm.trim() !== '';
    const clearAll   = () => {
        setFilterType('all');
        setFilterStatus('all');
        setSearchTerm('');
        setPage(0);
        fetchAllUsers(); // Refresh the list
    };

    if (loading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400, bgcolor: T.bg }}>
            <CircularProgress sx={{ color: T.accent }} />
        </Box>
    );

    return (
        <Box sx={{ p: { xs: 2, md: 3.5 }, bgcolor: T.bg, minHeight: '100vh' }}>

            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 1.5, animation: 'fadeUp 0.4s ease-out' }}>
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 0.3 }}>
                        <Box sx={{ p: 1, borderRadius: '10px', bgcolor: T.accentSoft }}>
                            <PeopleIcon sx={{ fontSize: 20, color: T.accent }} />
                        </Box>
                        <Typography sx={{ fontSize: { xs: '1.25rem', md: '1.6rem' }, fontWeight: 800, color: T.text, letterSpacing: '-0.3px' }}>
                            All Users
                        </Typography>
                    </Box>
                    <Typography sx={{ fontSize: '0.78rem', color: T.muted, ml: 0.5 }}>
                        Combined view of all client and operational users
                    </Typography>
                </Box>
                <Tooltip title="Refresh">
                    <IconButton onClick={fetchAllUsers} size="small"
                                sx={{ borderRadius: '10px', border: `1px solid ${T.border}`, bgcolor: T.surface, color: T.muted, '&:hover': { bgcolor: T.accentSoft, color: T.accent, borderColor: T.accent } }}>
                        <RefreshIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                </Tooltip>
            </Box>

            {/* Filters */}
            <Paper elevation={0} sx={{ p: { xs: 2, md: 2.5 }, mb: 2.5, borderRadius: '14px', border: `1px solid ${T.border}`, bgcolor: T.surface }}>
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
                    {/* Search input */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: T.bg, border: `1px solid ${T.border}`, borderRadius: '10px', px: 1.5, py: 0.7, flex: 1, minWidth: { xs: '100%', sm: 220 }, '&:focus-within': { borderColor: T.accent, boxShadow: `0 0 0 3px ${T.accentSoft}` }, transition: 'all 0.2s' }}>
                        <SearchIcon sx={{ fontSize: 16, color: T.muted, flexShrink: 0 }} />
                        <input
                            placeholder="Search users…"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            onKeyPress={e => e.key === 'Enter' && handleSearch()}
                            style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%', fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '0.83rem', color: T.text }}
                        />
                        {searchTerm && <IconButton size="small" onClick={() => setSearchTerm('')} sx={{ p: 0.3, color: T.muted }}><ClearIcon sx={{ fontSize: 13 }} /></IconButton>}
                    </Box>

                    {[
                        { val: filterType,   set: setFilterType,   opts: [['all','All Types'],['client','Client Users'],['operational','Operational']], label: 'Type' },
                        { val: filterStatus, set: setFilterStatus, opts: [['all','All Status'],['Verified','Verified'],['Pending','Pending'],['Rejected','Rejected']], label: 'Status' },
                    ].map(({ val, set, opts, label }) => (
                        <FormControl key={label} size="small" sx={{ minWidth: { xs: '100%', sm: 140 } }}>
                            <Select
                                value={val}
                                displayEmpty
                                onChange={e => {
                                    set(e.target.value);
                                    setPage(0);
                                }}
                                renderValue={v => v === 'all' ? label : opts.find(o => o[0] === v)?.[1] || v}
                                sx={{
                                    borderRadius: '10px',
                                    fontSize: '0.83rem',
                                    bgcolor: T.bg,
                                    '& .MuiOutlinedInput-notchedOutline': { borderColor: T.border },
                                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: T.accent },
                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: T.accent }
                                }}>
                                {opts.map(([v, l]) => <MenuItem key={v} value={v} sx={{ fontSize: '0.83rem' }}>{l}</MenuItem>)}
                            </Select>
                        </FormControl>
                    ))}

                    {hasFilters && (
                        <Button onClick={clearAll} size="small" startIcon={<FilterIcon sx={{ fontSize: '14px !important' }} />}
                                sx={{
                                    borderRadius: '10px',
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                                    fontSize: '0.8rem',
                                    color: T.muted,
                                    border: `1px solid ${T.border}`,
                                    bgcolor: T.bg,
                                    '&:hover': { color: T.rose, borderColor: T.rose, bgcolor: T.roseSoft }
                                }}>
                            Clear
                        </Button>
                    )}
                </Box>
                <Box sx={{ mt: 1.5 }}>
                    <Typography sx={{ fontSize: '0.71rem', color: T.muted }}>
                        Showing <span style={{ fontFamily: 'JetBrains Mono, monospace', color: T.accent, fontWeight: 600 }}>{filteredUsers.length}</span> user{filteredUsers.length !== 1 ? 's' : ''}
                    </Typography>
                </Box>
            </Paper>

            {error && <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2, borderRadius: '10px', fontSize: '0.83rem' }}>{error}</Alert>}

            {/* Table */}
            <Paper elevation={0} sx={{ borderRadius: '14px', border: `1px solid ${T.border}`, bgcolor: T.surface, overflow: 'hidden' }}>
                <TableContainer>
                    <Table size={isMobile ? 'small' : 'medium'}>
                        <TableHead>
                            <TableRow sx={{ bgcolor: T.bg }}>
                                {['User', 'Type', !isMobile && 'Role / Status', !isMobile && 'Region', 'Actions'].filter(Boolean).map(h => (
                                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.7rem', color: T.muted, letterSpacing: 0.8, textTransform: 'uppercase', py: 1.6, borderBottom: `1px solid ${T.border}` }}>{h}</TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredUsers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((user, i) => (
                                <TableRow key={`${user.user_category}-${user.id}`} hover sx={{ '&:hover': { bgcolor: T.bg }, transition: 'background-color 0.15s ease', animation: `fadeUp 0.35s ease-out ${i * 0.025}s both` }}>
                                    <TableCell sx={{ py: 1.8, borderBottom: `1px solid ${T.border}` }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <Avatar sx={{ width: 34, height: 34, borderRadius: '10px', bgcolor: user.user_category === 'client' ? T.accentSoft : T.purpleSoft, color: user.user_category === 'client' ? T.accent : T.purple, fontSize: '0.73rem', fontWeight: 700, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                                                {user.first_name?.[0]}{user.last_name?.[0]}
                                            </Avatar>
                                            <Box>
                                                <Typography sx={{ fontSize: '0.83rem', fontWeight: 600, color: T.text }}>{user.first_name} {user.last_name}</Typography>
                                                <Typography sx={{ fontSize: '0.71rem', color: T.muted }}>{user.email}</Typography>
                                                {isMobile && user.registration_status && <Box sx={{ mt: 0.4 }}><StatusBadge status={user.registration_status} /></Box>}
                                            </Box>
                                        </Box>
                                    </TableCell>
                                    <TableCell sx={{ py: 1.8, borderBottom: `1px solid ${T.border}` }}>
                                        <Chip label={user.user_category === 'client' ? 'Client' : 'Operational'} size="small"
                                              sx={{ height: 22, fontSize: '0.69rem', fontWeight: 600, bgcolor: user.user_category === 'client' ? T.accentSoft : T.purpleSoft, color: user.user_category === 'client' ? T.accent : T.purple }} />
                                    </TableCell>
                                    {!isMobile && (
                                        <TableCell sx={{ py: 1.8, borderBottom: `1px solid ${T.border}` }}>
                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                                {user.role && <Chip label={user.role} size="small" sx={{ height: 20, fontSize: '0.67rem', width: 'fit-content', bgcolor: T.cyanSoft, color: '#0891B2' }} />}
                                                {user.registration_status && <StatusBadge status={user.registration_status} />}
                                            </Box>
                                        </TableCell>
                                    )}
                                    {!isMobile && (
                                        <TableCell sx={{ py: 1.8, borderBottom: `1px solid ${T.border}` }}>
                                            <Typography sx={{ fontSize: '0.8rem', color: T.text }}>{user.region || '—'}</Typography>
                                        </TableCell>
                                    )}
                                    <TableCell sx={{ py: 1.8, borderBottom: `1px solid ${T.border}` }}>
                                        <IconButton size="small"
                                                    onClick={() => navigate(user.user_category === 'client' ? `/client-users/${user.id}` : `/operational-users/${user.id}`)}
                                                    sx={{ width: 30, height: 30, borderRadius: '8px', bgcolor: T.accentSoft, color: T.accent, '&:hover': { bgcolor: '#DBEAFE' } }}>
                                            <SearchIcon sx={{ fontSize: 15 }} />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filteredUsers.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} sx={{ py: 7, textAlign: 'center', borderBottom: 'none' }}>
                                        <PeopleIcon sx={{ fontSize: 44, color: T.border, mb: 1.5 }} />
                                        <Typography sx={{ fontSize: '0.88rem', fontWeight: 600, color: T.muted }}>No users found</Typography>
                                        {hasFilters && <Button onClick={clearAll} size="small" sx={{ mt: 1, color: T.accent, textTransform: 'none', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Clear filters</Button>}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25]}
                    component="div"
                    count={filteredUsers.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={(e, p) => setPage(p)}
                    onRowsPerPageChange={e => {
                        setRowsPerPage(parseInt(e.target.value, 10));
                        setPage(0);
                    }}
                    sx={{ borderTop: `1px solid ${T.border}`, '& *': { fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '0.8rem' } }}
                />
            </Paper>
        </Box>
    );
};

export default UserList;