import React, {useState, useEffect, useCallback} from 'react';
import {
    Box, Paper, Typography, IconButton, Chip, Alert,
    CircularProgress, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, TablePagination, Avatar, Tooltip,
    FormControl, Select, MenuItem, Button, Grid,
    Menu, Divider, useTheme, useMediaQuery,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField,
} from '@mui/material';
import {
    Search as SearchIcon,  Refresh as RefreshIcon,
    CheckCircle as ApprovedIcon, Cancel as RejectedIcon, Pending as PendingIcon,
    Block as CancelledIcon, Visibility as ViewIcon, Edit as EditIcon,
    MoreVert as MoreIcon, Email as EmailIcon, Call as CallIcon,
    Person as PersonIcon, PhoneAndroid as DeviceIcon,
    BarChart as ChartIcon,
    Clear as ClearIcon,
    ShoppingCart as OrderIcon,
} from '@mui/icons-material';
import {deviceAPI} from '../../services/api';
import {useNavigate} from 'react-router-dom';
import ApplicationStatusDialog from './ApplicationStatusDialog';
import ApplicationDetailsDialog from './ApplicationDetailsDialog';
import {useToast} from '../../hooks/useToast';

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
    Pending:         {color: T.amber,  soft: T.amberSoft,  icon: PendingIcon,   label: 'Pending'},
    Pending_Finance: {color: T.purple, soft: T.purpleSoft, icon: PendingIcon,   label: 'Pending Finance'},
    Approved:        {color: T.green,  soft: T.greenSoft,  icon: ApprovedIcon,  label: 'Approved'},
    Rejected:        {color: T.rose,   soft: T.roseSoft,   icon: RejectedIcon,  label: 'Rejected'},
    Cancelled:       {color: T.muted,  soft: '#F1F5F9',    icon: CancelledIcon, label: 'Cancelled'},
};

const formatDate = (d) => {
    if (!d) return '—';
    try {
        return new Date(d).toLocaleDateString('en-ZA', {year: 'numeric', month: 'short', day: 'numeric'});
    } catch {
        return '—';
    }
};
const fmt = (n) => parseInt(n) || 0;
const fmtR = (a) => new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2
}).format(a || 0);

const StatusChip = ({status}) => {
    const m = STATUS_META[status] || {color: T.muted, soft: '#F1F5F9', icon: PendingIcon, label: status};
    const Icon = m.icon;
    return (
        <Box sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.7,
            px: 1.2,
            py: 0.4,
            borderRadius: '20px',
            bgcolor: m.soft,
            border: `1px solid ${m.color}28`
        }}>
            <Icon sx={{fontSize: 11, color: m.color}}/>
            <Typography sx={{fontSize: '0.72rem', fontWeight: 600, color: m.color}}>{status}</Typography>
        </Box>
    );
};

const MiniStatCard = ({label, value, sub, color, soft, Icon, delay}) => (
    <Paper elevation={0} sx={{
        p: 2.4, borderRadius: '14px', bgcolor: T.surface, border: `1px solid ${T.border}`,
        position: 'relative', overflow: 'hidden',
        animation: `fadeUp 0.45s ease-out ${delay}s both`,
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {transform: 'translateY(-2px)', boxShadow: `0 8px 24px ${color}22`, borderColor: `${color}44`},
    }}>
        <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            bgcolor: color,
            borderRadius: '14px 14px 0 0'
        }}/>
        <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mt: 0.5}}>
            <Box>
                <Typography sx={{
                    fontSize: '0.67rem',
                    fontWeight: 700,
                    color: T.muted,
                    letterSpacing: 1,
                    textTransform: 'uppercase',
                    mb: 0.8
                }}>{label}</Typography>
                <Typography className="mono" sx={{
                    fontSize: '2.1rem',
                    fontWeight: 500,
                    lineHeight: 1,
                    color,
                    mb: 0.6
                }}>{value}</Typography>
                <Typography sx={{fontSize: '0.7rem', color: T.muted}}>{sub}</Typography>
            </Box>
            <Box sx={{p: 1.2, borderRadius: '10px', bgcolor: soft}}><Icon sx={{fontSize: 20, color}}/></Box>
        </Box>
    </Paper>
);

// ── Place Order Confirmation Dialog ───────────────────────────────────────────
const PlaceOrderDialog = ({open, application, onClose, onConfirm, submitting}) => {
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (open) setNotes('');
    }, [open]);

    if (!application) return null;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
                PaperProps={{sx: {borderRadius: '16px', border: `1px solid ${T.border}`, boxShadow: '0 24px 60px rgba(15,31,61,0.14)', bgcolor: T.bg}}}>
            <DialogTitle sx={{p: 0}}>
                <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 3, py: 2.2, bgcolor: T.surface, borderBottom: `1px solid ${T.border}`}}>
                    <Box sx={{display: 'flex', alignItems: 'center', gap: 1.2}}>
                        <Box sx={{width: 30, height: 30, borderRadius: '9px', bgcolor: T.cyanSoft, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                            <OrderIcon sx={{fontSize: 16, color: T.cyan}}/>
                        </Box>
                        <Box>
                            <Typography sx={{fontWeight: 700, fontSize: '0.95rem', color: T.text}}>Place MTN Order</Typography>
                            <Typography className="mono" sx={{fontSize: '0.68rem', color: T.muted}}>#{application.application_id}</Typography>
                        </Box>
                    </Box>
                    <IconButton onClick={onClose} size="small" disabled={submitting}
                                sx={{color: T.muted, '&:hover': {bgcolor: T.roseSoft, color: T.rose}}}>
                        <ClearIcon sx={{fontSize: 17}}/>
                    </IconButton>
                </Box>
            </DialogTitle>

            <DialogContent sx={{p: 3, bgcolor: T.bg}}>
                {/* Application summary */}
                <Box sx={{p: 2, mb: 2.5, borderRadius: '12px', bgcolor: T.surface, border: `1px solid ${T.border}`}}>
                    <Grid container spacing={1.5}>
                        {[
                            {label: 'Applicant', value: `${application.first_name} ${application.last_name}`},
                            {label: 'Device', value: application.device_name},
                            {label: 'Plan', value: application.plan_name},
                            {label: 'Monthly Cost', value: fmtR(application.monthly_cost)},
                            {label: 'Contract', value: `${application.contract_duration_months} months`},
                            {label: 'Total Value', value: fmtR((application.monthly_cost || 0) * (application.contract_duration_months || 0))},
                        ].map(({label, value}) => (
                            <Grid item xs={6} key={label}>
                                <Typography sx={{fontSize: '0.67rem', fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: 0.8, mb: 0.2}}>{label}</Typography>
                                <Typography sx={{fontSize: '0.85rem', fontWeight: 600, color: T.text}}>{value}</Typography>
                            </Grid>
                        ))}
                    </Grid>
                </Box>

                {/* Confirmation callout */}
                <Box sx={{mb: 2.5, px: 2, py: 1.5, borderRadius: '10px', bgcolor: T.cyanSoft, border: `1px solid ${T.cyan}33`}}>
                    <Typography sx={{fontSize: '0.82rem', color: T.cyan, fontWeight: 600}}>
                        This will place the MTN order for this application. The applicant will be notified.
                        This action cannot be undone.
                    </Typography>
                </Box>

                {/* Optional notes */}
                <Typography sx={{fontSize: '0.72rem', fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: 0.8, mb: 1}}>
                    Order Notes <span style={{fontWeight: 400, textTransform: 'none', letterSpacing: 0}}>(optional)</span>
                </Typography>
                <TextField fullWidth multiline rows={2}
                           placeholder="Reference number, special instructions, etc."
                           value={notes} onChange={e => setNotes(e.target.value)}
                           sx={{'& .MuiOutlinedInput-root': {borderRadius: '10px', bgcolor: T.surface, fontSize: '0.83rem', '& fieldset': {borderColor: T.border}, '&:hover fieldset': {borderColor: T.cyan}, '&.Mui-focused fieldset': {borderColor: T.cyan}}, '& textarea': {fontFamily: 'Plus Jakarta Sans, sans-serif'}}}/>
            </DialogContent>

            <DialogActions sx={{px: 3, py: 2.2, bgcolor: T.surface, borderTop: `1px solid ${T.border}`, gap: 1.5}}>
                <Button onClick={onClose} disabled={submitting}
                        sx={{borderRadius: '10px', textTransform: 'none', fontWeight: 600, fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '0.83rem', color: T.muted, border: `1px solid ${T.border}`, bgcolor: T.bg, px: 2.5, '&:hover': {bgcolor: T.border}}}>
                    Cancel
                </Button>
                <Button onClick={() => onConfirm(application.application_id, notes)} disabled={submitting} variant="contained"
                        sx={{borderRadius: '10px', textTransform: 'none', fontWeight: 700, fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '0.83rem', px: 2.5, boxShadow: 'none',
                            bgcolor: T.cyan, '&:hover': {bgcolor: '#0E7490', boxShadow: `0 4px 14px ${T.cyan}44`},
                            '&.Mui-disabled': {bgcolor: T.border, color: T.muted}}}>
                    {submitting ? 'Placing Order…' : 'Confirm & Place Order'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

const getInitials = (app) => {
    const f = app.first_name?.[0] || '';
    const l = app.last_name?.[0] || '';
    return `${f}${l}`.toUpperCase();
};

const AdminApplications = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const navigate = useNavigate();
    const {success, error: toastError, warning, info} = useToast();

    const [allApplications, setAllApplications] = useState([]);
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [filters, setFilters] = useState({status: 'all', user_type: 'all', region: 'all'});
    const [stats, setStats] = useState(null);
    const [statusDialog, setStatusDialog] = useState({open: false, application: null});
    const [detailsDialog, setDetailsDialog] = useState({open: false, application: null});
    const [orderDialog, setOrderDialog] = useState({open: false, application: null});
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedApp, setSelectedApp] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [orderSubmitting, setOrderSubmitting] = useState(false);

    const fetchApplications = useCallback(async () => {
        try {
            setLoading(true);
            const response = await deviceAPI.getAllApplications('');
            const data = response.data?.data?.applications || response.data?.data || [];
            setAllApplications(Array.isArray(data) ? data : []);
            setError(null);
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to fetch applications';
            setError(msg);
            toastError(msg, 'Failed to Load');
        } finally {
            setLoading(false);
        }
    }, [toastError]);

    // Client-side filtering
    useEffect(() => {
        let result = [...allApplications];

        if (filters.status !== 'all')
            result = result.filter(a => a.application_status === filters.status);
        if (filters.user_type !== 'all')
            result = result.filter(a => a.user_type === filters.user_type);
        if (filters.region !== 'all')
            result = result.filter(a => a.region === filters.region);
        if (searchTerm.trim()) {
            const q = searchTerm.trim().toLowerCase();
            result = result.filter(a =>
                `${a.first_name} ${a.last_name}`.toLowerCase().includes(q) ||
                a.email?.toLowerCase().includes(q) ||
                a.device_name?.toLowerCase().includes(q) ||
                a.plan_name?.toLowerCase().includes(q) ||
                String(a.application_id).includes(q)
            );
        }

        setApplications(result);
        setPage(0);
    }, [allApplications, filters, searchTerm]);

    const fetchStatistics = useCallback(async () => {
        try {
            const response = await deviceAPI.getApplicationStatistics();
            setStats(response.data?.data || null);
        } catch {
            // stats are non-critical — silent fail
        }
    }, []);

    useEffect(() => {
        fetchApplications();
        fetchStatistics();
    }, [fetchApplications, fetchStatistics]);

    const handleFilterChange = (name, value) => {
        setFilters(prev => ({...prev, [name]: value}));
    };

    const handleStatusUpdate = async (applicationId, updateData) => {
        setSubmitting(true);
        try {
            await deviceAPI.updateApplicationStatus(applicationId, updateData);
            success('Application status updated successfully.', 'Status Updated');
            setStatusDialog({open: false, application: null});
            await fetchApplications();
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to update status';
            toastError(msg, 'Update Failed');
        } finally {
            setSubmitting(false);
        }
    };

    // ── Place MTN Order handler ────────────────────────────────────────────────
    const handlePlaceOrder = async (applicationId, notes) => {
        setOrderSubmitting(true);
        try {
            const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
            const adminId = adminUser.op_user_id || adminUser.id;

            if (!adminId) {
                toastError('Could not determine admin user ID. Please log in again.', 'Auth Error');
                return;
            }

            await deviceAPI.placeOrder(applicationId, {
                admin_op_user_id: adminId,
                notes: notes || null,
            });

            success(
                `MTN order placed successfully for Application #${applicationId}. The applicant has been notified.`,
                'Order Placed'
            );
            setOrderDialog({open: false, application: null});
            await fetchApplications();
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to place order';
            toastError(msg, 'Order Failed');
        } finally {
            setOrderSubmitting(false);
        }
    };

    const uniqueRegions = [...new Set(allApplications.map(a => a.region).filter(Boolean))];
    const uniqueUserTypes = [...new Set(allApplications.map(a => a.user_type).filter(Boolean))];

    return (
        <Box sx={{animation: 'fadeUp 0.4s ease-out', fontFamily: 'Plus Jakarta Sans, sans-serif'}}>
            <style>{`
                @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
                * { font-family: 'Plus Jakarta Sans', sans-serif; }
                .mono { font-family: 'JetBrains Mono', monospace !important; }
            `}</style>

            {/* ── Page header ── */}
            <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3}}>
                <Box>
                    <Typography sx={{fontSize: {xs: '1.4rem', md: '1.7rem'}, fontWeight: 800, color: T.text, letterSpacing: '-0.3px'}}>
                        Applications
                    </Typography>
                    <Typography sx={{fontSize: '0.78rem', color: T.muted, mt: 0.3}}>
                        Manage and track all device applications
                    </Typography>
                </Box>
                <Button onClick={fetchApplications} variant="outlined"
                        startIcon={loading ? <CircularProgress size={14} sx={{color: T.accent}}/> : <RefreshIcon sx={{fontSize: '16px !important'}}/>}
                        disabled={loading}
                        sx={{borderRadius: '10px', textTransform: 'none', fontWeight: 600, fontFamily: 'Plus Jakarta Sans', fontSize: '0.81rem', color: T.accent, borderColor: T.border, bgcolor: T.surface, px: 2.5, py: 1, '&:hover': {bgcolor: T.accentSoft, borderColor: T.accent}}}>
                    Refresh
                </Button>
            </Box>

            {/* ── Stats strip ── */}
            {stats?.summary && (
                <Grid container spacing={2} sx={{mb: 3}}>
                    {[
                        {label: 'Total', value: fmt(stats.summary.total_applications), sub: 'All applications', color: T.accent, soft: T.accentSoft, Icon: ChartIcon, delay: 0},
                        {label: 'Pending', value: fmt(stats.summary.pending), sub: 'Awaiting review', color: T.amber, soft: T.amberSoft, Icon: PendingIcon, delay: 0.05},
                        {label: 'Approved', value: fmt(stats.summary.approved), sub: 'Fully approved', color: T.green, soft: T.greenSoft, Icon: ApprovedIcon, delay: 0.1},
                        {label: 'Rejected', value: fmt(stats.summary.rejected), sub: 'Not approved', color: T.rose, soft: T.roseSoft, Icon: RejectedIcon, delay: 0.15},
                    ].map(s => (
                        <Grid item xs={6} md={3} key={s.label}>
                            <MiniStatCard {...s} />
                        </Grid>
                    ))}
                </Grid>
            )}

            {error && (
                <Alert severity="error" sx={{mb: 2.5, borderRadius: '10px'}} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* ── Filters & Search ── */}
            <Paper elevation={0} sx={{p: 2, mb: 2.5, borderRadius: '12px', border: `1px solid ${T.border}`, bgcolor: T.surface}}>
                <Box sx={{display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center'}}>
                    {/* Search */}
                    <Box sx={{display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 200, p: 1, borderRadius: '8px', bgcolor: T.bg, border: `1px solid ${T.border}`}}>
                        <SearchIcon sx={{fontSize: 16, color: T.muted, flexShrink: 0}}/>
                        <input
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder="Search by name, email, device, ID…"
                            style={{border: 'none', outline: 'none', background: 'transparent', flex: 1, fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '0.85rem', color: T.text}}
                        />
                        {searchTerm && (
                            <IconButton size="small" onClick={() => setSearchTerm('')} sx={{color: T.muted}}>
                                <ClearIcon sx={{fontSize: 14}}/>
                            </IconButton>
                        )}
                    </Box>

                    {/* Status filter */}
                    <FormControl size="small" sx={{minWidth: 140}}>
                        <Select value={filters.status} onChange={e => handleFilterChange('status', e.target.value)}
                                sx={{borderRadius: '8px', fontSize: '0.83rem', bgcolor: T.bg, '& .MuiOutlinedInput-notchedOutline': {borderColor: T.border}}}>
                            <MenuItem value="all">All Statuses</MenuItem>
                            {Object.keys(STATUS_META).map(s => (
                                <MenuItem key={s} value={s}>{STATUS_META[s].label}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {/* User type filter */}
                    {uniqueUserTypes.length > 0 && (
                        <FormControl size="small" sx={{minWidth: 130}}>
                            <Select value={filters.user_type} onChange={e => handleFilterChange('user_type', e.target.value)}
                                    sx={{borderRadius: '8px', fontSize: '0.83rem', bgcolor: T.bg, '& .MuiOutlinedInput-notchedOutline': {borderColor: T.border}}}>
                                <MenuItem value="all">All Types</MenuItem>
                                {uniqueUserTypes.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                            </Select>
                        </FormControl>
                    )}

                    {/* Region filter */}
                    {uniqueRegions.length > 0 && (
                        <FormControl size="small" sx={{minWidth: 130}}>
                            <Select value={filters.region} onChange={e => handleFilterChange('region', e.target.value)}
                                    sx={{borderRadius: '8px', fontSize: '0.83rem', bgcolor: T.bg, '& .MuiOutlinedInput-notchedOutline': {borderColor: T.border}}}>
                                <MenuItem value="all">All Regions</MenuItem>
                                {uniqueRegions.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                            </Select>
                        </FormControl>
                    )}

                    {(filters.status !== 'all' || filters.user_type !== 'all' || filters.region !== 'all' || searchTerm) && (
                        <Button size="small" onClick={() => { setFilters({status: 'all', user_type: 'all', region: 'all'}); setSearchTerm(''); }}
                                sx={{borderRadius: '8px', textTransform: 'none', color: T.muted, fontSize: '0.8rem', px: 1.5}}>
                            Clear filters
                        </Button>
                    )}
                </Box>
            </Paper>

            {/* ── Results count ── */}
            <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, px: 0.5}}>
                <Typography sx={{fontSize: '0.8rem', color: T.muted}}>
                    {applications.length} application{applications.length !== 1 ? 's' : ''} found
                </Typography>
            </Box>

            {/* ── Table ── */}
            <Paper elevation={0} sx={{borderRadius: '14px', border: `1px solid ${T.border}`, overflow: 'hidden'}}>
                {loading ? (
                    <Box sx={{display: 'flex', justifyContent: 'center', alignItems: 'center', py: 10}}>
                        <CircularProgress size={32} sx={{color: T.accent}}/>
                    </Box>
                ) : applications.length === 0 ? (
                    <Box sx={{textAlign: 'center', py: 10}}>
                        <DeviceIcon sx={{fontSize: 48, color: T.border, mb: 1.5}}/>
                        <Typography sx={{fontWeight: 700, color: T.text, mb: 0.5}}>No applications found</Typography>
                        <Typography sx={{fontSize: '0.83rem', color: T.muted}}>Try adjusting your filters or search term.</Typography>
                    </Box>
                ) : (
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow sx={{bgcolor: T.bg}}>
                                    {['ID', 'Applicant', !isMobile && 'Device & Plan', 'Status', !isMobile && 'Submitted', 'Actions'].filter(Boolean).map(h => (
                                        <TableCell key={h} sx={{fontWeight: 700, fontSize: '0.72rem', color: T.muted, textTransform: 'uppercase', letterSpacing: 0.8, borderBottom: `1px solid ${T.border}`, py: 1.5}}>
                                            {h}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {applications
                                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                    .map((app, i) => {
                                        const isLocked = ['Approved', 'Rejected', 'Cancelled'].includes(app.application_status);
                                        const isApproved = app.application_status === 'Approved';
                                        const hasOrder = !!app.order_id;

                                        return (
                                            <TableRow key={app.application_id} sx={{
                                                animation: `fadeUp 0.4s ease-out ${i * 0.03}s both`,
                                                '&:hover': {bgcolor: T.bg},
                                                '&:last-child td': {borderBottom: 'none'},
                                            }}>
                                                {/* ID */}
                                                <TableCell sx={{py: 1.8, borderBottom: `1px solid ${T.border}`}}>
                                                    <Typography className="mono" sx={{fontSize: '0.78rem', fontWeight: 600, color: T.accent}}>#{app.application_id}</Typography>
                                                    <Typography className="mono" sx={{fontSize: '0.65rem', color: T.muted}}>Dev: {app.device_id}</Typography>
                                                </TableCell>

                                                {/* Applicant */}
                                                <TableCell sx={{py: 1.8, borderBottom: `1px solid ${T.border}`}}>
                                                    <Box sx={{display: 'flex', alignItems: 'center', gap: 1.2}}>
                                                        <Avatar sx={{width: 34, height: 34, borderRadius: '10px', bgcolor: T.accentSoft, color: T.accent, fontSize: '0.73rem', fontWeight: 700, fontFamily: 'Plus Jakarta Sans, sans-serif'}}>
                                                            {getInitials(app)}
                                                        </Avatar>
                                                        <Box>
                                                            <Typography sx={{fontSize: '0.82rem', fontWeight: 600, color: T.text}}>{app.first_name} {app.last_name}</Typography>
                                                            <Typography sx={{fontSize: '0.7rem', color: T.muted}}>{app.email}</Typography>
                                                            <Box sx={{display: 'flex', gap: 0.5, mt: 0.4, flexWrap: 'wrap'}}>
                                                                {app.user_type && <Chip label={app.user_type} size="small" sx={{height: 18, fontSize: '0.65rem', fontWeight: 600, bgcolor: T.purpleSoft, color: T.purple}}/>}
                                                                {app.region && <Chip label={app.region} size="small" sx={{height: 18, fontSize: '0.65rem', bgcolor: T.bg, color: T.muted, border: `1px solid ${T.border}`}}/>}
                                                            </Box>
                                                        </Box>
                                                    </Box>
                                                </TableCell>

                                                {/* Device */}
                                                {!isMobile && (
                                                    <TableCell sx={{py: 1.8, borderBottom: `1px solid ${T.border}`}}>
                                                        <Typography sx={{fontSize: '0.82rem', fontWeight: 600, color: T.text}}>{app.device_name || '—'}</Typography>
                                                        <Typography sx={{fontSize: '0.7rem', color: T.muted}}>{app.manufacturer}{app.model ? ` · ${app.model}` : ''}</Typography>
                                                        <Box sx={{display: 'flex', gap: 0.5, mt: 0.4, alignItems: 'center'}}>
                                                            {app.plan_name && <Chip label={app.plan_name} size="small" sx={{height: 18, fontSize: '0.65rem', bgcolor: T.cyanSoft, color: T.cyan}}/>}
                                                            <Typography className="mono" sx={{fontSize: '0.7rem', fontWeight: 600, color: T.accent}}>{fmtR(app.monthly_cost)}</Typography>
                                                        </Box>
                                                        {app.contract_duration_months && <Typography sx={{fontSize: '0.68rem', color: T.muted}}>{app.contract_duration_months} mo contract</Typography>}
                                                    </TableCell>
                                                )}

                                                {/* Status */}
                                                <TableCell sx={{py: 1.8, borderBottom: `1px solid ${T.border}`}}>
                                                    <StatusChip status={app.application_status}/>
                                                    {/* Show "Order Placed" badge if order exists */}
                                                    {hasOrder && (
                                                        <Box sx={{mt: 0.5, display: 'inline-flex', alignItems: 'center', gap: 0.5, px: 1, py: 0.3, borderRadius: '12px', bgcolor: T.cyanSoft, border: `1px solid ${T.cyan}33`}}>
                                                            <OrderIcon sx={{fontSize: 10, color: T.cyan}}/>
                                                            <Typography sx={{fontSize: '0.64rem', fontWeight: 700, color: T.cyan}}>Order Placed</Typography>
                                                        </Box>
                                                    )}
                                                    {app.rejection_reason && app.application_status === 'Rejected' && (
                                                        <Tooltip title={app.rejection_reason} arrow>
                                                            <Typography sx={{fontSize: '0.67rem', color: T.rose, mt: 0.4, cursor: 'help', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                                                                {app.rejection_reason.substring(0, 25)}…
                                                            </Typography>
                                                        </Tooltip>
                                                    )}
                                                </TableCell>

                                                {/* Date */}
                                                {!isMobile && (
                                                    <TableCell sx={{py: 1.8, borderBottom: `1px solid ${T.border}`}}>
                                                        <Typography sx={{fontSize: '0.8rem', color: T.text}}>{formatDate(app.submission_date)}</Typography>
                                                        {app.last_updated && app.last_updated !== app.submission_date && (
                                                            <Typography sx={{fontSize: '0.68rem', color: T.muted}}>Upd: {formatDate(app.last_updated)}</Typography>
                                                        )}
                                                    </TableCell>
                                                )}

                                                {/* Actions */}
                                                <TableCell sx={{py: 1.8, borderBottom: `1px solid ${T.border}`}}>
                                                    <Box sx={{display: 'flex', gap: 0.5}}>
                                                        {/* View */}
                                                        <Tooltip title="View Details">
                                                            <IconButton size="small" onClick={() => setDetailsDialog({open: true, application: app})}
                                                                        sx={{width: 28, height: 28, borderRadius: '8px', bgcolor: T.accentSoft, color: T.accent, '&:hover': {bgcolor: '#DBEAFE'}}}>
                                                                <ViewIcon sx={{fontSize: 14}}/>
                                                            </IconButton>
                                                        </Tooltip>

                                                        {/* Update Status — hidden for already-final apps */}
                                                        <Tooltip title={isLocked ? `Status is ${app.application_status} — cannot change` : 'Update Status'}>
                                                            <span>
                                                                <IconButton size="small"
                                                                            onClick={() => {
                                                                                if (isLocked) {
                                                                                    warning(`This application is already ${app.application_status} and cannot be changed.`, 'Status Locked');
                                                                                    return;
                                                                                }
                                                                                setStatusDialog({open: true, application: app});
                                                                            }}
                                                                            sx={{width: 28, height: 28, borderRadius: '8px', bgcolor: isLocked ? T.bg : T.amberSoft, color: isLocked ? T.muted : T.amber, '&:hover': {bgcolor: isLocked ? T.bg : '#FDE68A'}}}>
                                                                    <EditIcon sx={{fontSize: 14}}/>
                                                                </IconButton>
                                                            </span>
                                                        </Tooltip>

                                                        {/* ── Place MTN Order — only for Approved, only if no order yet ── */}
                                                        {isApproved && (
                                                            <Tooltip title={hasOrder ? 'Order already placed' : 'Place MTN Order'}>
                                                                <span>
                                                                    <IconButton size="small"
                                                                                onClick={() => {
                                                                                    if (hasOrder) {
                                                                                        info(`An order has already been placed for Application #${app.application_id}.`, 'Already Ordered');
                                                                                        return;
                                                                                    }
                                                                                    setOrderDialog({open: true, application: app});
                                                                                }}
                                                                                sx={{width: 28, height: 28, borderRadius: '8px',
                                                                                    bgcolor: hasOrder ? T.bg : T.cyanSoft,
                                                                                    color: hasOrder ? T.muted : T.cyan,
                                                                                    '&:hover': {bgcolor: hasOrder ? T.bg : '#A5F3FC'},
                                                                                }}>
                                                                        <OrderIcon sx={{fontSize: 14}}/>
                                                                    </IconButton>
                                                                </span>
                                                            </Tooltip>
                                                        )}

                                                        {/* More */}
                                                        <Tooltip title="More">
                                                            <IconButton size="small" onClick={e => { setAnchorEl(e.currentTarget); setSelectedApp(app); }}
                                                                        sx={{width: 28, height: 28, borderRadius: '8px', bgcolor: T.bg, color: T.muted, border: `1px solid ${T.border}`, '&:hover': {bgcolor: T.border}}}>
                                                                <MoreIcon sx={{fontSize: 14}}/>
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                }
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
                {applications.length > 0 && (
                    <TablePagination
                        rowsPerPageOptions={[10, 25, 50, 100]} component="div"
                        count={applications.length} rowsPerPage={rowsPerPage} page={page}
                        onPageChange={(e, p) => setPage(p)}
                        onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                        sx={{borderTop: `1px solid ${T.border}`, '& *': {fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '0.8rem'}}}
                    />
                )}
            </Paper>

            {/* ── Dialogs ── */}
            <ApplicationStatusDialog
                open={statusDialog.open}
                application={statusDialog.application}
                submitting={submitting}
                onClose={() => setStatusDialog({open: false, application: null})}
                onUpdate={handleStatusUpdate}
            />
            <ApplicationDetailsDialog
                open={detailsDialog.open}
                application={detailsDialog.application}
                onClose={() => setDetailsDialog({open: false, application: null})}
            />
            <PlaceOrderDialog
                open={orderDialog.open}
                application={orderDialog.application}
                submitting={orderSubmitting}
                onClose={() => setOrderDialog({open: false, application: null})}
                onConfirm={handlePlaceOrder}
            />

            {/* ── Context Menu ── */}
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => { setAnchorEl(null); setSelectedApp(null); }}
                  PaperProps={{elevation: 0, sx: {borderRadius: '12px', border: `1px solid ${T.border}`, boxShadow: '0 8px 30px rgba(15,31,61,0.10)', minWidth: 190}}}>
                {selectedApp && [
                    {Icon: ViewIcon, color: T.accent, label: 'View Details', action: () => setDetailsDialog({open: true, application: selectedApp})},
                    selectedApp.client_user_id && {Icon: PersonIcon, color: T.purple, label: 'View User Profile', action: () => navigate(`/client-users/${selectedApp.client_user_id}`)},
                    selectedApp.email && {Icon: EmailIcon, color: T.muted, label: 'Email User', action: () => window.open(`mailto:${selectedApp.email}`, '_blank')},
                    selectedApp.phone_number && {Icon: CallIcon, color: T.muted, label: 'Call User', action: () => window.open(`tel:${selectedApp.phone_number}`, '_blank')},
                    'divider',
                    {Icon: EditIcon, color: T.amber, label: 'Update Status', action: () => setStatusDialog({open: true, application: selectedApp})},
                    // Show Place Order in context menu too, only for Approved + no order yet
                    selectedApp.application_status === 'Approved' && !selectedApp.order_id && {
                        Icon: OrderIcon, color: T.cyan, label: 'Place MTN Order',
                        action: () => setOrderDialog({open: true, application: selectedApp}),
                    },
                ].filter(Boolean).map((item, i) => item === 'divider'
                    ? <Divider key={i} sx={{borderColor: T.border}}/>
                    : (
                        <MenuItem key={item.label} onClick={() => { item.action(); setAnchorEl(null); setSelectedApp(null); }}
                                  sx={{gap: 1.5, py: 1.2, fontSize: '0.83rem', color: T.text, '&:hover': {bgcolor: T.bg}}}>
                            <item.Icon sx={{fontSize: 16, color: item.color}}/>
                            {item.label}
                        </MenuItem>
                    )
                )}
            </Menu>
        </Box>
    );
};

export default AdminApplications;