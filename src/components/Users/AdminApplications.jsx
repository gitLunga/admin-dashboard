import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Paper, Typography, TextField, IconButton, Chip, Alert,
    CircularProgress, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, TablePagination, Avatar, Tooltip,
    FormControl, Select, MenuItem, Button, Grid,
    Menu, ListItemIcon, ListItemText, Divider, Stack, useTheme, useMediaQuery,
} from '@mui/material';
import {
    Search as SearchIcon, FilterList as FilterIcon, Refresh as RefreshIcon,
    CheckCircle as ApprovedIcon, Cancel as RejectedIcon, Pending as PendingIcon,
    Block as CancelledIcon, Visibility as ViewIcon, Edit as EditIcon,
    MoreVert as MoreIcon, Email as EmailIcon, Call as CallIcon,
    Person as PersonIcon, PhoneAndroid as DeviceIcon,
    BarChart as ChartIcon, Groups as UsersIcon, TrendingUp as TrendingIcon,
    AccessTime as TimeIcon, Category as CategoryIcon, Store as StoreIcon,
    Clear as ClearIcon,
} from '@mui/icons-material';
import { deviceAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import ApplicationStatusDialog from './ApplicationStatusDialog';
import ApplicationDetailsDialog from './ApplicationDetailsDialog';

/* ── Shared tokens ── */
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

const STATUS_META = {
    Approved:  { color: T.green,  soft: T.greenSoft,  icon: ApprovedIcon  },
    Pending:   { color: T.amber,  soft: T.amberSoft,  icon: PendingIcon   },
    Rejected:  { color: T.rose,   soft: T.roseSoft,   icon: RejectedIcon  },
    Cancelled: { color: T.muted,  soft: '#F1F5F9',    icon: CancelledIcon },
};

const formatDate = (d) => {
    if (!d) return '—';
    try { return new Date(d).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' }); }
    catch { return '—'; }
};
const fmt  = (n) => parseInt(n) || 0;
const fmtR = (a) => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', minimumFractionDigits: 2 }).format(a || 0);

const StatusChip = ({ status }) => {
    const m = STATUS_META[status] || { color: T.muted, soft: '#F1F5F9', icon: PendingIcon };
    const Icon = m.icon;
    return (
        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.7,
            px: 1.2, py: 0.4, borderRadius: '20px', bgcolor: m.soft, border: `1px solid ${m.color}28` }}>
            <Icon sx={{ fontSize: 11, color: m.color }} />
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: m.color }}>{status}</Typography>
        </Box>
    );
};

const MiniStatCard = ({ label, value, sub, color, soft, Icon, delay }) => (
    <Paper elevation={0} sx={{
        p: 2.4, borderRadius: '14px', bgcolor: T.surface, border: `1px solid ${T.border}`,
        position: 'relative', overflow: 'hidden',
        animation: `fadeUp 0.45s ease-out ${delay}s both`,
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': { transform: 'translateY(-2px)', boxShadow: `0 8px 24px ${color}22`, borderColor: `${color}44` },
    }}>
        <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, bgcolor: color, borderRadius: '14px 14px 0 0' }} />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mt: 0.5 }}>
            <Box>
                <Typography sx={{ fontSize: '0.67rem', fontWeight: 700, color: T.muted, letterSpacing: 1, textTransform: 'uppercase', mb: 0.8 }}>{label}</Typography>
                <Typography className="mono" sx={{ fontSize: '2.1rem', fontWeight: 500, lineHeight: 1, color, mb: 0.6 }}>{value}</Typography>
                <Typography sx={{ fontSize: '0.7rem', color: T.muted }}>{sub}</Typography>
            </Box>
            <Box sx={{ p: 1.2, borderRadius: '10px', bgcolor: soft }}><Icon sx={{ fontSize: 20, color }} /></Box>
        </Box>
    </Paper>
);

const AdminApplications = () => {
    const theme   = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const navigate = useNavigate();

    const [applications, setApplications] = useState([]);
    const [loading, setLoading]           = useState(true);
    const [statsLoading, setStatsLoading] = useState(false);
    const [error, setError]               = useState(null);
    const [searchTerm, setSearchTerm]     = useState('');
    const [page, setPage]                 = useState(0);
    const [rowsPerPage, setRowsPerPage]   = useState(10);
    const [filters, setFilters]           = useState({ status: 'all', user_type: 'all', region: 'all' });
    const [stats, setStats]               = useState(null);
    const [statusDialog, setStatusDialog] = useState({ open: false, application: null });
    const [detailsDialog, setDetailsDialog] = useState({ open: false, application: null });
    const [anchorEl, setAnchorEl]         = useState(null);
    const [selectedApp, setSelectedApp]   = useState(null);

    const fetchApplications = useCallback(async (customFilters = {}) => {
        try {
            setLoading(true);
            const all = { ...filters, ...customFilters };
            const params = Object.keys(all).filter(k => all[k] && all[k] !== 'all').map(k => `${k}=${encodeURIComponent(all[k])}`);
            const q = params.length ? '?' + params.join('&') : '';
            const response = await deviceAPI.getAllApplications(q);
            setApplications(response.data?.data.applications || []);
            setError(null);
        } catch (err) {
            setError(err.message || 'Failed to fetch applications');
        } finally {
            setLoading(false);
        }
    }, [filters]);

    const fetchStatistics = useCallback(async () => {
        try {
            setStatsLoading(true);
            const response = await deviceAPI.getApplicationStatistics();
            setStats(response.data?.data || null);
        } catch { setStats(null); }
        finally { setStatsLoading(false); }
    }, []);

    useEffect(() => { fetchApplications(); fetchStatistics(); }, [fetchApplications, fetchStatistics]);

    const handleFilterChange = (name, value) => {
        const next = { ...filters, [name]: value };
        setFilters(next); setPage(0);
        fetchApplications(next);
    };

    const handleClearFilters = () => {
        const cleared = { status: 'all', user_type: 'all', region: 'all' };
        setFilters(cleared); setSearchTerm('');
        fetchApplications(cleared);
    };

    const handleRefresh = () => {
        setSearchTerm('');
        fetchApplications(); fetchStatistics();
    };

    const handleStatusUpdate = async (appId, statusData) => {
        try {
            const response = await deviceAPI.updateApplicationStatus(appId, statusData);
            if (response.data?.success) {
                fetchApplications(); fetchStatistics();
                setStatusDialog({ open: false, application: null });
            } else { setError(response.data?.message || 'Failed to update status'); }
        } catch (err) { setError(err.message || 'Failed to update status'); }
    };

    const approvalRate = () => {
        if (!stats?.summary) return 0;
        const total = fmt(stats.summary.total_applications);
        return total > 0 ? Math.round((fmt(stats.summary.approved) / total) * 100) : 0;
    };

    const getInitials = (a) => `${a.first_name?.[0] || ''}${a.last_name?.[0] || ''}`.toUpperCase();

    if (loading && applications.length === 0) return (
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
                        <Box sx={{ p: 1, borderRadius: '10px', bgcolor: T.purpleSoft }}>
                            <DeviceIcon sx={{ fontSize: 20, color: T.purple }} />
                        </Box>
                        <Typography sx={{ fontSize: { xs: '1.25rem', md: '1.6rem' }, fontWeight: 800, color: T.text, letterSpacing: '-0.3px' }}>
                            Application Management
                        </Typography>
                    </Box>
                    <Typography sx={{ fontSize: '0.78rem', color: T.muted, ml: 0.5 }}>
                        Manage and review all device applications
                        {stats?.summary && <> · <span style={{ fontFamily: 'JetBrains Mono, monospace', color: T.accent }}>{fmt(stats.summary.total_applications)}</span> total</>}
                    </Typography>
                </Box>
                <Button onClick={handleRefresh} startIcon={<RefreshIcon sx={{ fontSize: '16px !important' }} />}
                        variant="outlined" size="small" sx={{
                    borderRadius: '10px', textTransform: 'none', fontWeight: 600,
                    fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '0.81rem',
                    color: T.accent, borderColor: T.border, bgcolor: T.surface,
                    '&:hover': { bgcolor: T.accentSoft, borderColor: T.accent },
                }}>
                    Refresh
                </Button>
            </Box>

            {/* ── Stats Cards ── */}
            {stats?.summary && (
                <Grid container spacing={2.5} sx={{ mb: 3 }}>
                    {[
                        { label: 'Total Applications', value: fmt(stats.summary.total_applications), sub: `${fmt(stats.summary.unique_users)} unique users`, color: T.accent, soft: T.accentSoft, Icon: ChartIcon, delay: 0.06 },
                        { label: 'Approved',           value: fmt(stats.summary.approved),           sub: `${approvalRate()}% approval rate`,             color: T.green, soft: T.greenSoft, Icon: ApprovedIcon, delay: 0.12 },
                        { label: 'Pending Review',     value: fmt(stats.summary.pending),            sub: 'Need attention',                               color: T.amber, soft: T.amberSoft, Icon: PendingIcon,  delay: 0.18 },
                        { label: 'Avg Processing',     value: parseFloat(stats.summary.avg_processing_days || 0).toFixed(1), sub: 'Days to process', color: T.cyan, soft: T.cyanSoft, Icon: TimeIcon, delay: 0.24 },
                    ].map(s => (
                        <Grid item xs={6} md={3} key={s.label}>
                            <MiniStatCard {...s} />
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* Quick Insights */}
            {stats?.device_stats?.length > 0 && (
                <Paper elevation={0} sx={{ p: 2, mb: 2.5, borderRadius: '14px', border: `1px solid ${T.border}`, bgcolor: T.surface, animation: 'fadeUp 0.4s ease-out 0.28s both' }}>
                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: T.muted, letterSpacing: 1, textTransform: 'uppercase', mb: 1.5 }}>
                        Quick Insights
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                        {[
                            { Icon: StoreIcon,   color: T.accent, label: 'Top Device',    value: stats.device_stats?.[0]?.device_name || '—' },
                            { Icon: UsersIcon,   color: T.purple, label: 'Top User Type', value: stats.user_type_stats?.[0]?.user_type || '—' },
                            { Icon: CategoryIcon,color: T.amber,  label: 'Device Types',  value: `${stats.device_stats?.length || 0} devices` },
                            { Icon: TrendingIcon,color: T.green,  label: 'Last 30 Days',  value: stats.trend?.reduce((s, d) => s + fmt(d.applications), 0) || 0 },
                        ].map(({ Icon, color, label, value }) => (
                            <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ width: 28, height: 28, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: `${color}12` }}>
                                    <Icon sx={{ fontSize: 15, color }} />
                                </Box>
                                <Box>
                                    <Typography sx={{ fontSize: '0.67rem', color: T.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8 }}>{label}</Typography>
                                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: T.text }}>{value}</Typography>
                                </Box>
                            </Box>
                        ))}
                    </Box>
                </Paper>
            )}

            {/* ── Filters ── */}
            <Paper elevation={0} sx={{ p: { xs: 2, md: 2.5 }, mb: 2.5, borderRadius: '14px', border: `1px solid ${T.border}`, bgcolor: T.surface }}>
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
                    {/* Search */}
                    <Box sx={{
                        display: 'flex', alignItems: 'center', gap: 1,
                        bgcolor: T.bg, border: `1px solid ${T.border}`, borderRadius: '10px',
                        px: 1.5, py: 0.7, flex: 1, minWidth: { xs: '100%', md: 220 },
                        '&:focus-within': { borderColor: T.accent, boxShadow: `0 0 0 3px ${T.accentSoft}` },
                        transition: 'all 0.2s',
                    }}>
                        <SearchIcon sx={{ fontSize: 16, color: T.muted, flexShrink: 0 }} />
                        <input
                            placeholder="Search by name, email, device…"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            onKeyPress={e => e.key === 'Enter' && fetchApplications({ search: searchTerm })}
                            style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%', fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '0.83rem', color: T.text }}
                        />
                        {searchTerm && <IconButton size="small" onClick={() => setSearchTerm('')} sx={{ p: 0.3, color: T.muted }}><ClearIcon sx={{ fontSize: 13 }} /></IconButton>}
                    </Box>

                    {/* Dropdowns */}
                    {[
                        { key: 'status',    label: 'Status',    opts: [['all','All Status'],['Pending','Pending'],['Approved','Approved'],['Rejected','Rejected'],['Cancelled','Cancelled']] },
                        { key: 'user_type', label: 'User Type', opts: [['all','All Types'],['Advocate','Advocate'],['Magistrate','Magistrate'],['Prosecutor','Prosecutor']] },
                        { key: 'region',    label: 'Region',    opts: [['all','All Regions'],['Gauteng','Gauteng'],['Western Cape','Western Cape'],['KwaZulu-Natal','KZN'],['Eastern Cape','Eastern Cape'],['Free State','Free State'],['Limpopo','Limpopo'],['Mpumalanga','Mpumalanga'],['North West','North West'],['Northern Cape','Northern Cape']] },
                    ].map(({ key, label, opts }) => (
                        <FormControl key={key} size="small" sx={{ minWidth: { xs: '100%', sm: 140 } }}>
                            <Select value={filters[key]} displayEmpty onChange={e => handleFilterChange(key, e.target.value)}
                                    renderValue={v => v === 'all' ? label : opts.find(o => o[0] === v)?.[1] || v}
                                    sx={{ borderRadius: '10px', fontSize: '0.82rem', bgcolor: T.bg,
                                        '& .MuiOutlinedInput-notchedOutline': { borderColor: T.border },
                                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: T.accent },
                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: T.accent },
                                    }}>
                                {opts.map(([v, l]) => <MenuItem key={v} value={v} sx={{ fontSize: '0.82rem' }}>{l}</MenuItem>)}
                            </Select>
                        </FormControl>
                    ))}

                    <Button onClick={handleClearFilters} size="small" startIcon={<FilterIcon sx={{ fontSize: '14px !important' }} />}
                            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, fontFamily: 'Plus Jakarta Sans, sans-serif',
                                fontSize: '0.8rem', color: T.muted, border: `1px solid ${T.border}`, bgcolor: T.bg, px: 2,
                                '&:hover': { color: T.rose, borderColor: T.rose, bgcolor: T.roseSoft } }}>
                        Clear
                    </Button>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1.5 }}>
                    <Typography sx={{ fontSize: '0.71rem', color: T.muted }}>
                        Showing <span style={{ fontFamily: 'JetBrains Mono, monospace', color: T.accent, fontWeight: 600 }}>{applications.length}</span> applications
                    </Typography>
                </Box>
            </Paper>

            {error && <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2, borderRadius: '10px', fontSize: '0.83rem' }}>{error}</Alert>}

            {/* ── Table ── */}
            <Paper elevation={0} sx={{ borderRadius: '14px', border: `1px solid ${T.border}`, bgcolor: T.surface, overflow: 'hidden' }}>
                <TableContainer>
                    <Table size={isMobile ? 'small' : 'medium'}>
                        <TableHead>
                            <TableRow sx={{ bgcolor: T.bg }}>
                                {['ID', 'Applicant', !isMobile && 'Device & Plan', 'Status', !isMobile && 'Submitted', 'Actions'].filter(Boolean).map(h => (
                                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.7rem', color: T.muted, letterSpacing: 0.8, textTransform: 'uppercase', py: 1.6, borderBottom: `1px solid ${T.border}` }}>{h}</TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {applications.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} sx={{ py: 8, textAlign: 'center', borderBottom: 'none' }}>
                                        <DeviceIcon sx={{ fontSize: 44, color: T.border, mb: 1.5 }} />
                                        <Typography sx={{ fontSize: '0.88rem', fontWeight: 600, color: T.muted, mb: 0.5 }}>No applications found</Typography>
                                        <Typography sx={{ fontSize: '0.78rem', color: T.muted }}>Try adjusting your filters</Typography>
                                        <Button onClick={handleRefresh} size="small" sx={{ mt: 2, color: T.accent, textTransform: 'none', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Refresh</Button>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                applications.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((app, i) => (
                                    <TableRow key={app.application_id} hover sx={{
                                        '&:hover': { bgcolor: T.bg }, transition: 'background-color 0.15s ease',
                                        animation: `fadeUp 0.35s ease-out ${i * 0.025}s both`,
                                    }}>
                                        {/* ID */}
                                        <TableCell sx={{ py: 1.8, borderBottom: `1px solid ${T.border}` }}>
                                            <Typography className="mono" sx={{ fontSize: '0.78rem', fontWeight: 600, color: T.accent }}>#{app.application_id}</Typography>
                                            <Typography className="mono" sx={{ fontSize: '0.65rem', color: T.muted }}>Dev: {app.device_id}</Typography>
                                        </TableCell>
                                        {/* Applicant */}
                                        <TableCell sx={{ py: 1.8, borderBottom: `1px solid ${T.border}` }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                                                <Avatar sx={{ width: 34, height: 34, borderRadius: '10px', bgcolor: T.accentSoft, color: T.accent, fontSize: '0.73rem', fontWeight: 700, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                                                    {getInitials(app)}
                                                </Avatar>
                                                <Box>
                                                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: T.text }}>{app.first_name} {app.last_name}</Typography>
                                                    <Typography sx={{ fontSize: '0.7rem', color: T.muted }}>{app.email}</Typography>
                                                    <Box sx={{ display: 'flex', gap: 0.5, mt: 0.4, flexWrap: 'wrap' }}>
                                                        {app.user_type && <Chip label={app.user_type} size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600, bgcolor: T.purpleSoft, color: T.purple }} />}
                                                        {app.region && <Chip label={app.region} size="small" sx={{ height: 18, fontSize: '0.65rem', bgcolor: T.bg, color: T.muted, border: `1px solid ${T.border}` }} />}
                                                    </Box>
                                                </Box>
                                            </Box>
                                        </TableCell>
                                        {/* Device */}
                                        {!isMobile && (
                                            <TableCell sx={{ py: 1.8, borderBottom: `1px solid ${T.border}` }}>
                                                <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: T.text }}>{app.device_name || '—'}</Typography>
                                                <Typography sx={{ fontSize: '0.7rem', color: T.muted }}>{app.manufacturer}{app.model ? ` · ${app.model}` : ''}</Typography>
                                                <Box sx={{ display: 'flex', gap: 0.5, mt: 0.4, alignItems: 'center' }}>
                                                    {app.plan_name && <Chip label={app.plan_name} size="small" sx={{ height: 18, fontSize: '0.65rem', bgcolor: T.cyanSoft, color: T.cyan }} />}
                                                    <Typography className="mono" sx={{ fontSize: '0.7rem', fontWeight: 600, color: T.accent }}>{fmtR(app.monthly_cost)}</Typography>
                                                </Box>
                                                {app.contract_duration_months && <Typography sx={{ fontSize: '0.68rem', color: T.muted }}>{app.contract_duration_months} mo contract</Typography>}
                                            </TableCell>
                                        )}
                                        {/* Status */}
                                        <TableCell sx={{ py: 1.8, borderBottom: `1px solid ${T.border}` }}>
                                            <StatusChip status={app.application_status} />
                                            {app.rejection_reason && app.application_status === 'Rejected' && (
                                                <Tooltip title={app.rejection_reason} arrow>
                                                    <Typography sx={{ fontSize: '0.67rem', color: T.rose, mt: 0.4, cursor: 'help', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {app.rejection_reason.substring(0, 25)}…
                                                    </Typography>
                                                </Tooltip>
                                            )}
                                        </TableCell>
                                        {/* Date */}
                                        {!isMobile && (
                                            <TableCell sx={{ py: 1.8, borderBottom: `1px solid ${T.border}` }}>
                                                <Typography sx={{ fontSize: '0.8rem', color: T.text }}>{formatDate(app.submission_date)}</Typography>
                                                {app.last_updated && app.last_updated !== app.submission_date && (
                                                    <Typography sx={{ fontSize: '0.68rem', color: T.muted }}>Upd: {formatDate(app.last_updated)}</Typography>
                                                )}
                                            </TableCell>
                                        )}
                                        {/* Actions */}
                                        <TableCell sx={{ py: 1.8, borderBottom: `1px solid ${T.border}` }}>
                                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                <Tooltip title="View Details">
                                                    <IconButton size="small" onClick={() => setDetailsDialog({ open: true, application: app })}
                                                                sx={{ width: 28, height: 28, borderRadius: '8px', bgcolor: T.accentSoft, color: T.accent, '&:hover': { bgcolor: '#DBEAFE' } }}>
                                                        <ViewIcon sx={{ fontSize: 14 }} />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Update Status">
                                                    <span>
                                                        <IconButton size="small"
                                                                    onClick={() => setStatusDialog({ open: true, application: app })}
                                                                    disabled={app.application_status === 'Cancelled'}
                                                                    sx={{ width: 28, height: 28, borderRadius: '8px',
                                                                        bgcolor: app.application_status === 'Cancelled' ? T.bg : T.amberSoft,
                                                                        color: app.application_status === 'Cancelled' ? T.muted : T.amber,
                                                                        '&:hover': { bgcolor: app.application_status !== 'Cancelled' ? '#FDE68A' : undefined } }}>
                                                            <EditIcon sx={{ fontSize: 14 }} />
                                                        </IconButton>
                                                    </span>
                                                </Tooltip>
                                                <Tooltip title="More">
                                                    <IconButton size="small" onClick={e => { setAnchorEl(e.currentTarget); setSelectedApp(app); }}
                                                                sx={{ width: 28, height: 28, borderRadius: '8px', bgcolor: T.bg, color: T.muted, border: `1px solid ${T.border}`, '&:hover': { bgcolor: T.border } }}>
                                                        <MoreIcon sx={{ fontSize: 14 }} />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                {applications.length > 0 && (
                    <TablePagination
                        rowsPerPageOptions={[10, 25, 50, 100]} component="div"
                        count={applications.length} rowsPerPage={rowsPerPage} page={page}
                        onPageChange={(e, p) => setPage(p)}
                        onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                        sx={{ borderTop: `1px solid ${T.border}`, '& *': { fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '0.8rem' } }}
                    />
                )}
            </Paper>

            {/* Device Stats Breakdown */}
            {stats?.device_stats?.length > 0 && (
                <Paper elevation={0} sx={{ mt: 2.5, p: 3, borderRadius: '14px', border: `1px solid ${T.border}`, bgcolor: T.surface, animation: 'fadeUp 0.4s ease-out 0.35s both' }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: T.text, mb: 2 }}>Device Breakdown</Typography>
                    <Grid container spacing={2}>
                        {stats.device_stats.slice(0, 4).map((d, i) => (
                            <Grid item xs={6} md={3} key={i}>
                                <Box sx={{ p: 2, borderRadius: '10px', bgcolor: T.bg, border: `1px solid ${T.border}`, transition: 'border-color 0.2s', '&:hover': { borderColor: T.accent } }}>
                                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: T.text, mb: 0.3 }}>{d.device_name}</Typography>
                                    <Typography sx={{ fontSize: '0.7rem', color: T.muted, mb: 1 }}>{d.manufacturer}</Typography>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                        <Typography sx={{ fontSize: '0.7rem', color: T.muted }}>Total</Typography>
                                        <Typography className="mono" sx={{ fontSize: '0.78rem', fontWeight: 600, color: T.text }}>{fmt(d.total_applications)}</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                        <Typography sx={{ fontSize: '0.7rem', color: T.muted }}>Approved</Typography>
                                        <Typography className="mono" sx={{ fontSize: '0.78rem', fontWeight: 600, color: T.green }}>{fmt(d.approved_count)}</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography sx={{ fontSize: '0.7rem', color: T.muted }}>Pending</Typography>
                                        <Typography className="mono" sx={{ fontSize: '0.78rem', fontWeight: 600, color: T.amber }}>{fmt(d.pending_count)}</Typography>
                                    </Box>
                                </Box>
                            </Grid>
                        ))}
                    </Grid>
                </Paper>
            )}

            {/* Dialogs */}
            <ApplicationStatusDialog open={statusDialog.open} application={statusDialog.application}
                                     onClose={() => setStatusDialog({ open: false, application: null })} onUpdate={handleStatusUpdate} />
            <ApplicationDetailsDialog open={detailsDialog.open} application={detailsDialog.application}
                                      onClose={() => setDetailsDialog({ open: false, application: null })} />

            {/* Context Menu */}
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => { setAnchorEl(null); setSelectedApp(null); }}
                  PaperProps={{ elevation: 0, sx: { borderRadius: '12px', border: `1px solid ${T.border}`, boxShadow: '0 8px 30px rgba(15,31,61,0.10)', minWidth: 190 } }}>
                {selectedApp && [
                    { Icon: ViewIcon, color: T.accent, label: 'View Details', action: () => setDetailsDialog({ open: true, application: selectedApp }) },
                    selectedApp.client_user_id && { Icon: PersonIcon, color: T.purple, label: 'View User Profile', action: () => navigate(`/client-users/${selectedApp.client_user_id}`) },
                    selectedApp.email && { Icon: EmailIcon, color: T.muted, label: 'Email User', action: () => window.open(`mailto:${selectedApp.email}`, '_blank') },
                    selectedApp.phone_number && { Icon: CallIcon, color: T.muted, label: 'Call User', action: () => window.open(`tel:${selectedApp.phone_number}`, '_blank') },
                    'divider',
                    { Icon: EditIcon, color: T.amber, label: 'Update Status', action: () => setStatusDialog({ open: true, application: selectedApp }) },
                ].filter(Boolean).map((item, i) => item === 'divider' ? <Divider key={i} sx={{ borderColor: T.border }} /> : (
                    <MenuItem key={item.label} onClick={() => { item.action(); setAnchorEl(null); setSelectedApp(null); }}
                              sx={{ gap: 1.5, py: 1.2, fontSize: '0.83rem', color: T.text, '&:hover': { bgcolor: T.bg } }}>
                        <item.Icon sx={{ fontSize: 16, color: item.color }} />
                        {item.label}
                    </MenuItem>
                ))}
            </Menu>
        </Box>
    );
};

export default AdminApplications;