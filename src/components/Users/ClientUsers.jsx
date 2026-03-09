import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Box, Paper, Typography,  IconButton, Chip, Alert,
    CircularProgress, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, TablePagination, Avatar, FormControl,
     Select, MenuItem,  Button, useMediaQuery, useTheme,
} from '@mui/material';
import {
    Search as SearchIcon,
    Edit as EditIcon,
    Visibility as ViewIcon,
    Clear as ClearIcon,
    People as PeopleIcon,
} from '@mui/icons-material';
import { adminAPI } from '../../services/api';
import StatusUpdateModal from './StatusUpdateModal';

/* ── Shared design tokens ── */
const T = {
    bg: '#F8F9FC', surface: '#FFFFFF', border: '#E8ECF4',
    text: '#0F1F3D', muted: '#6B7A99',
    accent: '#1E4FD8', accentSoft: '#EBF0FF',
    green: '#059669', greenSoft: '#D1FAE5',
    amber: '#D97706', amberSoft: '#FEF3C7',
    rose: '#DC2626', roseSoft: '#FEE2E2',
    purple: '#7C3AED', purpleSoft: '#EDE9FE',
};

const STATUS_META = {
    Verified: { color: T.green,  soft: T.greenSoft,  dot: '#059669' },
    Pending:  { color: T.amber,  soft: T.amberSoft,  dot: '#D97706' },
    Rejected: { color: T.rose,   soft: T.roseSoft,   dot: '#DC2626' },
};

const StatusChip = ({ status }) => {
    const meta = STATUS_META[status] || { color: T.muted, soft: '#F1F5F9', dot: T.muted };
    return (
        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.7,
            px: 1.2, py: 0.4, borderRadius: '20px',
            bgcolor: meta.soft, border: `1px solid ${meta.color}28` }}>
            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: meta.dot, flexShrink: 0 }} />
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: meta.color }}>{status}</Typography>
        </Box>
    );
};

const ClientUsers = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const [users, setUsers]               = useState([]);
    const [loading, setLoading]           = useState(true);
    const [error, setError]               = useState(null);
    const [searchTerm, setSearchTerm]     = useState('');
    const [page, setPage]                 = useState(0);
    const [rowsPerPage, setRowsPerPage]   = useState(10);
    const [selectedUser, setSelectedUser] = useState(null);
    const [modalOpen, setModalOpen]       = useState(false);
    const [selectedRegion, setSelectedRegion] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');

    const fetchClientUsers = useCallback(async () => {
        try {
            setLoading(true);
            const response = await adminAPI.getClientUsers();
            setUsers(response.data.data.users);
        } catch (err) {
            setError(err.message || 'Failed to fetch client users');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchClientUsers(); }, [fetchClientUsers]);

    const handleSearch = async () => {
        if (searchTerm.length < 2) { fetchClientUsers(); return; }
        try {
            setLoading(true);
            const response = await adminAPI.searchUsers(searchTerm);
            setUsers(response.data.data.users.filter(u => u.user_type === 'client'));
        } catch (err) {
            setError(err.message || 'Search failed');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (status, notes) => {
        if (!selectedUser) return;
        try {
            await adminAPI.updateUserStatus(selectedUser.client_user_id, { status, notes });
            fetchClientUsers();
            setModalOpen(false);
            setSelectedUser(null);
        } catch (err) {
            setError(err.message || 'Failed to update status');
        }
    };

    const uniqueRegions = useMemo(() => {
        const r = users.map(u => u.region).filter(r => r?.trim());
        return [...new Set(r)].sort();
    }, [users]);

    const filteredUsers = useMemo(() => users.filter(u => {
        const s = searchTerm.toLowerCase();
        const matchSearch = !s || u.first_name?.toLowerCase().includes(s) || u.last_name?.toLowerCase().includes(s) || u.email?.toLowerCase().includes(s) || u.persal_id?.toLowerCase().includes(s);
        const matchRegion = selectedRegion === 'all' || u.region === selectedRegion;
        const matchStatus = selectedStatus === 'all' || u.registration_status === selectedStatus;
        return matchSearch && matchRegion && matchStatus;
    }), [users, searchTerm, selectedRegion, selectedStatus]);

    const hasFilters = selectedRegion !== 'all' || selectedStatus !== 'all' || searchTerm.trim() !== '';
    const clearAll   = () => { setSelectedRegion('all'); setSelectedStatus('all'); setSearchTerm(''); setPage(0); };

    const getInitials = (u) => `${u.first_name?.[0] || ''}${u.last_name?.[0] || ''}`.toUpperCase();

    if (loading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400, bgcolor: T.bg }}>
            <CircularProgress sx={{ color: T.accent }} />
        </Box>
    );

    return (
        <Box sx={{ p: { xs: 2, md: 3.5 }, bgcolor: T.bg, minHeight: '100vh' }}>

            {/* ── Header ── */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 1.5, animation: 'fadeUp 0.4s ease-out' }}>
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 0.3 }}>
                        <Box sx={{ p: 1, borderRadius: '10px', bgcolor: T.accentSoft }}>
                            <PeopleIcon sx={{ fontSize: 20, color: T.accent }} />
                        </Box>
                        <Typography sx={{ fontSize: { xs: '1.25rem', md: '1.6rem' }, fontWeight: 800, color: T.text, letterSpacing: '-0.3px' }}>
                            Client Users
                        </Typography>
                    </Box>
                    <Typography sx={{ fontSize: '0.78rem', color: T.muted, ml: 0.5 }}>
                        Manage and review all judicial system client users
                    </Typography>
                </Box>
                <Chip
                    label={`${filteredUsers.length} user${filteredUsers.length !== 1 ? 's' : ''}`}
                    sx={{ bgcolor: T.accentSoft, color: T.accent, fontWeight: 700, fontSize: '0.78rem', height: 32, fontFamily: 'JetBrains Mono, monospace' }}
                />
            </Box>

            {/* ── Search & Filters ── */}
            <Paper elevation={0} sx={{ p: { xs: 2, md: 2.5 }, mb: 2.5, borderRadius: '14px', border: `1px solid ${T.border}`, bgcolor: T.surface }}>
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 2 }}>
                    {/* Search */}
                    <Box sx={{
                        display: 'flex', alignItems: 'center', gap: 1,
                        bgcolor: T.bg, border: `1px solid ${T.border}`, borderRadius: '10px',
                        px: 1.5, py: 0.6, flex: 1, minWidth: { xs: '100%', sm: 240 },
                        '&:focus-within': { borderColor: T.accent, boxShadow: `0 0 0 3px ${T.accentSoft}` },
                        transition: 'all 0.2s ease',
                    }}>
                        <SearchIcon sx={{ fontSize: 17, color: T.muted, flexShrink: 0 }} />
                        <input
                            placeholder="Search by name, email, or Persal ID…"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            onKeyPress={e => e.key === 'Enter' && handleSearch()}
                            style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%', fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '0.83rem', color: T.text }}
                        />
                        {searchTerm && (
                            <IconButton size="small" onClick={() => setSearchTerm('')} sx={{ p: 0.3, color: T.muted }}>
                                <ClearIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                        )}
                    </Box>

                    {/* Region Filter */}
                    <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 160 } }}>
                        <Select
                            value={selectedRegion}
                            displayEmpty
                            onChange={e => { setSelectedRegion(e.target.value); setPage(0); }}
                            sx={{ borderRadius: '10px', fontSize: '0.83rem', bgcolor: T.bg,
                                '& .MuiOutlinedInput-notchedOutline': { borderColor: T.border },
                                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: T.accent },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: T.accent },
                            }}
                            renderValue={v => v === 'all' ? 'All Regions' : v}
                        >
                            <MenuItem value="all" sx={{ fontSize: '0.83rem' }}>All Regions</MenuItem>
                            {uniqueRegions.map(r => <MenuItem key={r} value={r} sx={{ fontSize: '0.83rem' }}>{r}</MenuItem>)}
                        </Select>
                    </FormControl>

                    {/* Status Filter */}
                    <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 160 } }}>
                        <Select
                            value={selectedStatus}
                            displayEmpty
                            onChange={e => { setSelectedStatus(e.target.value); setPage(0); }}
                            sx={{ borderRadius: '10px', fontSize: '0.83rem', bgcolor: T.bg,
                                '& .MuiOutlinedInput-notchedOutline': { borderColor: T.border },
                                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: T.accent },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: T.accent },
                            }}
                            renderValue={v => v === 'all' ? 'All Statuses' : v}
                        >
                            <MenuItem value="all" sx={{ fontSize: '0.83rem' }}>All Statuses</MenuItem>
                            {['Verified','Pending','Rejected'].map(s => (
                                <MenuItem key={s} value={s} sx={{ fontSize: '0.83rem' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: STATUS_META[s]?.dot || T.muted }} />
                                        {s}
                                    </Box>
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>

                {/* Active filter chips */}
                {hasFilters && (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
                        <Typography sx={{ fontSize: '0.71rem', color: T.muted, fontWeight: 600 }}>Active:</Typography>
                        {selectedRegion !== 'all' && (
                            <Chip label={`Region: ${selectedRegion}`} size="small" onDelete={() => setSelectedRegion('all')}
                                  sx={{ bgcolor: T.accentSoft, color: T.accent, border: `1px solid ${T.accent}28`, fontSize: '0.72rem', fontWeight: 600, height: 24 }} />
                        )}
                        {selectedStatus !== 'all' && (
                            <Chip label={`Status: ${selectedStatus}`} size="small" onDelete={() => setSelectedStatus('all')}
                                  sx={{ bgcolor: STATUS_META[selectedStatus]?.soft, color: STATUS_META[selectedStatus]?.color, fontSize: '0.72rem', fontWeight: 600, height: 24 }} />
                        )}
                        {searchTerm && (
                            <Chip label={`"${searchTerm}"`} size="small" onDelete={() => setSearchTerm('')}
                                  sx={{ bgcolor: T.purpleSoft, color: T.purple, fontSize: '0.72rem', fontWeight: 600, height: 24 }} />
                        )}
                        <Button size="small" onClick={clearAll} sx={{ fontSize: '0.71rem', color: T.muted, textTransform: 'none', py: 0, fontFamily: 'Plus Jakarta Sans, sans-serif',
                            '&:hover': { color: T.rose } }}>
                            Clear all
                        </Button>
                    </Box>
                )}
            </Paper>

            {error && (
                <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2, borderRadius: '10px', fontSize: '0.83rem' }}>
                    {error}
                </Alert>
            )}

            {/* ── Table ── */}
            <Paper elevation={0} sx={{ borderRadius: '14px', border: `1px solid ${T.border}`, bgcolor: T.surface, overflow: 'hidden' }}>
                <TableContainer>
                    <Table size={isMobile ? 'small' : 'medium'}>
                        <TableHead>
                            <TableRow sx={{ bgcolor: T.bg }}>
                                {['User', !isMobile && 'Contact', !isMobile && 'Region', 'Status', 'Actions'].filter(Boolean).map(h => (
                                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.72rem', color: T.muted, letterSpacing: 0.8, textTransform: 'uppercase', py: 1.6, borderBottom: `1px solid ${T.border}` }}>
                                        {h}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredUsers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} sx={{ py: 8, textAlign: 'center', borderBottom: 'none' }}>
                                        <PeopleIcon sx={{ fontSize: 44, color: T.border, mb: 1.5 }} />
                                        <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, color: T.muted, mb: 0.5 }}>
                                            No users found
                                        </Typography>
                                        {hasFilters && (
                                            <Button onClick={clearAll} size="small" sx={{ mt: 1, color: T.accent, textTransform: 'none', fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '0.8rem' }}>
                                                Clear filters
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredUsers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((user, i) => (
                                    <TableRow key={user.client_user_id} hover sx={{
                                        '&:hover': { bgcolor: T.bg },
                                        transition: 'background-color 0.15s ease',
                                        animation: `fadeUp 0.35s ease-out ${i * 0.03}s both`,
                                    }}>
                                        <TableCell sx={{ py: 1.8, borderBottom: `1px solid ${T.border}` }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                <Avatar sx={{ width: 34, height: 34, borderRadius: '10px', bgcolor: T.accentSoft, color: T.accent, fontSize: '0.73rem', fontWeight: 700, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                                                    {getInitials(user)}
                                                </Avatar>
                                                <Box>
                                                    <Typography sx={{ fontSize: '0.83rem', fontWeight: 600, color: T.text }}>
                                                        {user.title} {user.first_name} {user.last_name}
                                                    </Typography>
                                                    <Typography className="mono" sx={{ fontSize: '0.67rem', color: T.muted }}>
                                                        #{user.client_user_id}
                                                    </Typography>
                                                    {isMobile && (
                                                        <Typography sx={{ fontSize: '0.72rem', color: T.muted, mt: 0.2 }}>{user.email}</Typography>
                                                    )}
                                                </Box>
                                            </Box>
                                        </TableCell>
                                        {!isMobile && (
                                            <TableCell sx={{ py: 1.8, borderBottom: `1px solid ${T.border}` }}>
                                                <Typography sx={{ fontSize: '0.8rem', color: T.text }}>{user.email}</Typography>
                                                {user.phone_number && <Typography sx={{ fontSize: '0.71rem', color: T.muted }}>{user.phone_number}</Typography>}
                                            </TableCell>
                                        )}
                                        {!isMobile && (
                                            <TableCell sx={{ py: 1.8, borderBottom: `1px solid ${T.border}` }}>
                                                <Typography sx={{ fontSize: '0.8rem', color: T.text }}>{user.region || '—'}</Typography>
                                            </TableCell>
                                        )}
                                        <TableCell sx={{ py: 1.8, borderBottom: `1px solid ${T.border}` }}>
                                            <StatusChip status={user.registration_status} />
                                        </TableCell>
                                        <TableCell sx={{ py: 1.8, borderBottom: `1px solid ${T.border}` }}>
                                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                <IconButton size="small" onClick={() => { setSelectedUser(user); setModalOpen(true); }}
                                                            sx={{ width: 30, height: 30, borderRadius: '8px', bgcolor: T.amberSoft, color: T.amber, '&:hover': { bgcolor: '#FDE68A' } }}>
                                                    <EditIcon sx={{ fontSize: 15 }} />
                                                </IconButton>
                                                <IconButton size="small" onClick={() => window.location.href = `/client-users/${user.client_user_id}`}
                                                            sx={{ width: 30, height: 30, borderRadius: '8px', bgcolor: T.accentSoft, color: T.accent, '&:hover': { bgcolor: '#DBEAFE' } }}>
                                                    <ViewIcon sx={{ fontSize: 15 }} />
                                                </IconButton>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                {filteredUsers.length > 0 && (
                    <TablePagination
                        rowsPerPageOptions={[5, 10, 25]}
                        component="div"
                        count={filteredUsers.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={(e, p) => setPage(p)}
                        onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                        sx={{ borderTop: `1px solid ${T.border}`, '& *': { fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '0.8rem' } }}
                    />
                )}
            </Paper>

            {selectedUser && (
                <StatusUpdateModal open={modalOpen} user={selectedUser}
                                   onClose={() => { setModalOpen(false); setSelectedUser(null); }}
                                   onSubmit={handleStatusUpdate}
                />
            )}
        </Box>
    );
};

export default ClientUsers;