import React, { useState, useEffect } from 'react';
import {
    Box, Paper, Typography, IconButton, Chip, Alert, CircularProgress,
    Grid, Button, Divider, Avatar,
} from '@mui/material';
import {
    Search as SearchIcon, Email as EmailIcon, Phone as PhoneIcon,
    LocationOn as LocationIcon, Person as PersonIcon, Clear as ClearIcon,
} from '@mui/icons-material';
import { useLocation } from 'react-router-dom';
import { adminAPI } from '../../services/api';

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
    Verified: { color: T.green, soft: T.greenSoft },
    Pending:  { color: T.amber, soft: T.amberSoft },
    Rejected: { color: T.rose,  soft: T.roseSoft  },
};

const StatusBadge = ({ status }) => {
    const m = STATUS_META[status] || { color: T.muted, soft: '#F1F5F9' };
    return (
        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.6, px: 1.1, py: 0.3, borderRadius: '20px', bgcolor: m.soft, border: `1px solid ${m.color}28` }}>
            <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: m.color }} />
            <Typography sx={{ fontSize: '0.69rem', fontWeight: 600, color: m.color }}>{status || 'Active'}</Typography>
        </Box>
    );
};

const FILTER_GROUPS = [
    { key: 'userType', opts: [{ v: 'all', l: 'All Types' }, { v: 'client', l: 'Client Users', color: T.accent, soft: T.accentSoft }, { v: 'operational', l: 'Operational', color: T.purple, soft: T.purpleSoft }] },
    { key: 'status',   opts: [{ v: 'all', l: 'All Status' }, { v: 'Verified', l: 'Verified', color: T.green, soft: T.greenSoft }, { v: 'Pending', l: 'Pending', color: T.amber, soft: T.amberSoft }] },
];

const SearchPage = () => {
    const location = useLocation();
    // const theme    = useTheme();

    const [searchTerm, setSearchTerm] = useState('');
    const [users,      setUsers]      = useState([]);
    const [loading,    setLoading]    = useState(false);
    const [error,      setError]      = useState('');
    const [filters,    setFilters]    = useState({ userType: 'all', status: 'all' });

    useEffect(() => {
        const q = new URLSearchParams(location.search).get('q');
        if (q) { setSearchTerm(q); performSearch(q); }
    }, [location]);

    const performSearch = async (term) => {
        if (term.trim().length < 2) { setUsers([]); return; }
        try {
            setLoading(true);
            const response = await adminAPI.searchUsers(term);
            setUsers(response.data.data.users);
        } catch (err) { setError(err.message || 'Search failed'); }
        finally { setLoading(false); }
    };

    const handleClear = () => { setSearchTerm(''); setUsers([]); setFilters({ userType: 'all', status: 'all' }); };

    const filteredUsers = users.filter(u => {
        if (filters.userType !== 'all' && u.user_type !== filters.userType) return false;
        if (filters.status   !== 'all' && u.registration_status !== filters.status) return false;
        return true;
    });

    return (
        <Box sx={{ p: { xs: 2, md: 3.5 }, bgcolor: T.bg, minHeight: '100vh' }}>

            {/* Header */}
            <Box sx={{ mb: 3, animation: 'fadeUp 0.4s ease-out' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 0.3 }}>
                    <Box sx={{ p: 1, borderRadius: '10px', bgcolor: T.accentSoft }}>
                        <SearchIcon sx={{ fontSize: 20, color: T.accent }} />
                    </Box>
                    <Typography sx={{ fontSize: { xs: '1.25rem', md: '1.6rem' }, fontWeight: 800, color: T.text, letterSpacing: '-0.3px' }}>
                        Search Users
                    </Typography>
                </Box>
                <Typography sx={{ fontSize: '0.78rem', color: T.muted, ml: 0.5 }}>
                    Find users by name, email, phone, or Persal ID
                </Typography>
            </Box>

            {/* Search panel */}
            <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, mb: 3, borderRadius: '14px', border: `1px solid ${T.border}`, bgcolor: T.surface }}>
                {/* Search bar */}
                <Box sx={{ display: 'flex', gap: 1.5, mb: 2.5, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: T.bg, border: `1px solid ${T.border}`, borderRadius: '12px', px: 1.8, py: 0.9, flex: 1, '&:focus-within': { borderColor: T.accent, boxShadow: `0 0 0 3px ${T.accentSoft}` }, transition: 'all 0.2s' }}>
                        <SearchIcon sx={{ fontSize: 17, color: T.muted, flexShrink: 0 }} />
                        <input
                            placeholder="Search by name, email, phone, or Persal ID…"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            onKeyPress={e => e.key === 'Enter' && performSearch(searchTerm)}
                            style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%', fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '0.87rem', color: T.text }}
                        />
                        {searchTerm && <IconButton size="small" onClick={handleClear} sx={{ p: 0.3, color: T.muted }}><ClearIcon sx={{ fontSize: 14 }} /></IconButton>}
                    </Box>
                    <Button variant="contained" onClick={() => performSearch(searchTerm)} disabled={searchTerm.trim().length < 2}
                            sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 700, fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '0.87rem', px: 3, bgcolor: T.accent, boxShadow: 'none', flexShrink: 0, '&:hover': { bgcolor: '#1641B8', boxShadow: `0 4px 14px ${T.accent}44` }, '&.Mui-disabled': { bgcolor: T.border, color: T.muted } }}>
                        Search
                    </Button>
                </Box>

                {/* Filter chips */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
                    {FILTER_GROUPS.map(({ key, opts }) => (
                        <Box key={key} sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap', alignItems: 'center' }}>
                            {opts.map(({ v, l, color, soft }) => {
                                const active = filters[key] === v;
                                return (
                                    <Box key={v} onClick={() => setFilters(f => ({ ...f, [key]: v }))} sx={{
                                        px: 1.3, py: 0.5, borderRadius: '20px', cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: active ? 700 : 500,
                                        border: `1.5px solid ${active ? (color || T.accent) : T.border}`,
                                        bgcolor: active ? (soft || T.accentSoft) : T.bg,
                                        color: active ? (color || T.accent) : T.muted,
                                        transition: 'all 0.15s ease',
                                        '&:hover': { borderColor: color || T.accent, bgcolor: soft || T.accentSoft, color: color || T.accent },
                                    }}>{l}</Box>
                                );
                            })}
                            {key !== FILTER_GROUPS[FILTER_GROUPS.length - 1].key && <Box sx={{ width: 1, height: 18, bgcolor: T.border, mx: 0.5 }} />}
                        </Box>
                    ))}
                </Box>
            </Paper>

            {error && <Alert severity="error" sx={{ mb: 2.5, borderRadius: '10px', fontSize: '0.83rem' }}>{error}</Alert>}

            {/* Results */}
            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                    <CircularProgress sx={{ color: T.accent }} />
                </Box>
            ) : (
                <>
                    {users.length > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                            <Typography sx={{ fontSize: '0.88rem', fontWeight: 700, color: T.text }}>
                                Results
                                <span style={{ fontFamily: 'JetBrains Mono, monospace', color: T.accent, marginLeft: 8 }}>
                                    {filteredUsers.length}
                                </span>
                                <span style={{ color: T.muted, fontWeight: 400 }}> users found</span>
                            </Typography>
                            {searchTerm && <Typography sx={{ fontSize: '0.76rem', color: T.muted }}>for "{searchTerm}"</Typography>}
                        </Box>
                    )}

                    {filteredUsers.length === 0 ? (
                        <Paper elevation={0} sx={{ p: { xs: 4, md: 6 }, textAlign: 'center', borderRadius: '14px', border: `1px solid ${T.border}`, bgcolor: T.surface }}>
                            <SearchIcon sx={{ fontSize: 48, color: T.border, mb: 2 }} />
                            <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: T.text, mb: 0.6 }}>
                                {searchTerm ? 'No users found' : 'Start your search'}
                            </Typography>
                            <Typography sx={{ fontSize: '0.82rem', color: T.muted }}>
                                {searchTerm ? 'Try a different term or adjust your filters' : 'Enter at least 2 characters to search'}
                            </Typography>
                        </Paper>
                    ) : (
                        <Grid container spacing={2}>
                            {filteredUsers.map((user, i) => (
                                <Grid item xs={12} sm={6} lg={4} key={`${user.user_type}-${user.id}`}>
                                    <Paper elevation={0} sx={{
                                        p: 2.5, borderRadius: '14px', border: `1px solid ${T.border}`, bgcolor: T.surface,
                                        animation: `fadeUp 0.35s ease-out ${i * 0.04}s both`,
                                        transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
                                        '&:hover': { transform: 'translateY(-3px)', boxShadow: `0 12px 32px rgba(15,31,61,0.09)`, borderColor: T.accent },
                                    }}>
                                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 2 }}>
                                            <Avatar sx={{ width: 44, height: 44, borderRadius: '12px', bgcolor: user.user_type === 'client' ? T.accentSoft : T.purpleSoft, color: user.user_type === 'client' ? T.accent : T.purple, fontSize: '0.88rem', fontWeight: 700, fontFamily: 'Plus Jakarta Sans, sans-serif', flexShrink: 0 }}>
                                                {user.first_name?.[0]}{user.last_name?.[0]}
                                            </Avatar>
                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1, flexWrap: 'wrap' }}>
                                                    <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: T.text, lineHeight: 1.3 }}>
                                                        {user.first_name} {user.last_name}
                                                    </Typography>
                                                    <StatusBadge status={user.registration_status} />
                                                </Box>
                                                <Chip label={user.user_type === 'client' ? 'Client User' : 'Operational'} size="small"
                                                      sx={{ mt: 0.5, height: 20, fontSize: '0.67rem', fontWeight: 600, bgcolor: user.user_type === 'client' ? T.accentSoft : T.purpleSoft, color: user.user_type === 'client' ? T.accent : T.purple }} />
                                            </Box>
                                        </Box>

                                        <Divider sx={{ borderColor: T.border, mb: 1.8 }} />

                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <EmailIcon sx={{ fontSize: 13, color: T.muted, flexShrink: 0 }} />
                                                <Typography sx={{ fontSize: '0.78rem', color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</Typography>
                                            </Box>
                                            {user.phone_number && (
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <PhoneIcon sx={{ fontSize: 13, color: T.muted }} />
                                                    <Typography sx={{ fontSize: '0.78rem', color: T.text }}>{user.phone_number}</Typography>
                                                </Box>
                                            )}
                                            {user.region && (
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <LocationIcon sx={{ fontSize: 13, color: T.muted }} />
                                                    <Typography sx={{ fontSize: '0.78rem', color: T.text }}>{user.region}</Typography>
                                                </Box>
                                            )}
                                            {user.persal_id && (
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <PersonIcon sx={{ fontSize: 13, color: T.muted }} />
                                                    <Typography sx={{ fontSize: '0.78rem', color: T.text }}>Persal: </Typography>
                                                    <Typography className="mono" sx={{ fontSize: '0.76rem', color: T.accent, fontWeight: 600 }}>{user.persal_id}</Typography>
                                                </Box>
                                            )}
                                        </Box>

                                        <Box sx={{ mt: 2.5, display: 'flex', justifyContent: 'flex-end' }}>
                                            <Button size="small"
                                                    onClick={() => window.location.href = user.user_type === 'client' ? `/client-users/${user.id}` : `/operational-users/${user.id}`}
                                                    sx={{ borderRadius: '9px', textTransform: 'none', fontWeight: 700, fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '0.78rem', color: T.accent, border: `1.5px solid ${T.accentSoft}`, bgcolor: T.accentSoft, px: 2, '&:hover': { bgcolor: '#DBEAFE', borderColor: T.accent } }}>
                                                View Profile →
                                            </Button>
                                        </Box>
                                    </Paper>
                                </Grid>
                            ))}
                        </Grid>
                    )}
                </>
            )}
        </Box>
    );
};

export default SearchPage;