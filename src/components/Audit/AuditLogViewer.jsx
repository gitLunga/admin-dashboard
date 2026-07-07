import React, { useState, useCallback } from 'react';
import {
    Box, Typography, Card, Button, Chip, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, TablePagination, TextField,
    MenuItem, Grid, Alert, CircularProgress, Tooltip, Tabs, Tab,
    Collapse, IconButton,
} from '@mui/material';
import {
    Refresh as RefreshIcon,
    ExpandMore as ExpandIcon,
    ExpandLess as CollapseIcon,
    Security as SecurityIcon,
    Login as LoginIcon,
} from '@mui/icons-material';
import { auditAPI } from '../../services/api';
import { T } from '../Layout/Sidebar';

function TabPanel({ children, value, index }) {
    return value === index ? <Box sx={{ pt: 2 }}>{children}</Box> : null;
}

// ── Action colour mapping ─────────────────────────────────────────────────────
const ACTION_COLOR = {
    LOGIN:                  { bg: T.greenSoft,  color: T.green  },
    LOGOUT:                 { bg: T.bg,         color: T.muted  },
    REGISTRATION:           { bg: '#EDE9FE',    color: '#7C3AED'},
    APPROVAL:               { bg: T.accentSoft, color: T.accent },
    REJECTION:              { bg: T.roseSoft,   color: T.rose   },
    DELETE:                 { bg: T.roseSoft,   color: T.rose   },
    RETURN_INITIATED:       { bg: T.amberSoft,  color: T.amber  },
    RETURN_STATUS_CHANGED:  { bg: T.amberSoft,  color: T.amber  },
    DELEGATION_CREATED:     { bg: '#EDE9FE',    color: '#7C3AED'},
    DELEGATION_REVOKED:     { bg: T.roseSoft,   color: T.rose   },
    BUDGET_UPSERTED:        { bg: T.greenSoft,  color: T.green  },
    BUDGET_DELETED:         { bg: T.roseSoft,   color: T.rose   },
};

function actionChip(action) {
    const c = Object.entries(ACTION_COLOR).find(([k]) => action?.toUpperCase().includes(k))?.[1]
           || { bg: T.bg, color: T.muted };
    return (
        <Chip label={action} size="small"
            sx={{ fontSize: '0.68rem', fontWeight: 700, bgcolor: c.bg, color: c.color, border: 'none' }} />
    );
}

// ── Expandable JSON diff cell ─────────────────────────────────────────────────
function DiffCell({ old_value, new_value }) {
    const [open, setOpen] = useState(false);
    if (!old_value && !new_value) return <Typography sx={{ color: T.muted, fontSize: '0.75rem' }}>—</Typography>;

    return (
        <Box>
            <IconButton size="small" onClick={() => setOpen(o => !o)}>
                {open ? <CollapseIcon fontSize="small" /> : <ExpandIcon fontSize="small" />}
            </IconButton>
            <Collapse in={open}>
                {old_value && (
                    <Box sx={{ mb: 0.5 }}>
                        <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: T.rose }}>BEFORE</Typography>
                        <Box sx={{ bgcolor: T.roseSoft, borderRadius: '6px', p: 1, fontFamily: 'monospace', fontSize: '0.7rem', whiteSpace: 'pre-wrap', maxWidth: 280 }}>
                            {typeof old_value === 'string' ? old_value : JSON.stringify(old_value, null, 2)}
                        </Box>
                    </Box>
                )}
                {new_value && (
                    <Box>
                        <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: T.green }}>AFTER</Typography>
                        <Box sx={{ bgcolor: T.greenSoft, borderRadius: '6px', p: 1, fontFamily: 'monospace', fontSize: '0.7rem', whiteSpace: 'pre-wrap', maxWidth: 280 }}>
                            {typeof new_value === 'string' ? new_value : JSON.stringify(new_value, null, 2)}
                        </Box>
                    </Box>
                )}
            </Collapse>
        </Box>
    );
}

// ── Audit logs tab ────────────────────────────────────────────────────────────
function AuditLogsTab() {
    const [rows,    setRows]    = useState([]);
    const [total,   setTotal]   = useState(0);
    const [loading, setLoading] = useState(false);
    const [error,   setError]   = useState(null);
    const [page,    setPage]    = useState(0);
    const [rowsPP,  setRowsPP]  = useState(50);

    const [filters, setFilters] = useState({
        action:      '',
        entity_type: '',
        actor_type:  '',
        date_from:   '',
        date_to:     '',
    });

    const load = useCallback(async (p = page, rpp = rowsPP) => {
        setLoading(true); setError(null);
        try {
            const qs = new URLSearchParams({
                ...Object.fromEntries(Object.entries(filters).filter(([,v]) => v)),
                limit:  rpp,
                offset: p * rpp,
            }).toString();
            const res = await auditAPI.getLogs(qs);
            setRows(res.data.data.logs);
            setTotal(res.data.data.total);
        } catch (e) { setError(e.response?.data?.message || e.message); }
        finally { setLoading(false); }
    }, [filters, page, rowsPP]);

    const handlePageChange = (_, newPage) => {
        setPage(newPage);
        load(newPage, rowsPP);
    };

    const handleRowsChange = (e) => {
        const rpp = parseInt(e.target.value);
        setRowsPP(rpp);
        setPage(0);
        load(0, rpp);
    };

    return (
        <Box>
            {/* Filters */}
            <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={3}>
                    <TextField fullWidth size="small" label="Action keyword" value={filters.action}
                        onChange={e => setFilters(f => ({ ...f, action: e.target.value }))} />
                </Grid>
                <Grid item xs={6} sm={2}>
                    <TextField select fullWidth size="small" label="Entity Type" value={filters.entity_type}
                        onChange={e => setFilters(f => ({ ...f, entity_type: e.target.value }))}>
                        <MenuItem value="">All</MenuItem>
                        {['application','client_user','operational_user','device_return','approval_delegation','department_budget'].map(t => (
                            <MenuItem key={t} value={t}>{t}</MenuItem>
                        ))}
                    </TextField>
                </Grid>
                <Grid item xs={6} sm={2}>
                    <TextField select fullWidth size="small" label="Actor Type" value={filters.actor_type}
                        onChange={e => setFilters(f => ({ ...f, actor_type: e.target.value }))}>
                        <MenuItem value="">All</MenuItem>
                        <MenuItem value="operational_user">Operational</MenuItem>
                        <MenuItem value="client_user">Client</MenuItem>
                        <MenuItem value="system">System</MenuItem>
                    </TextField>
                </Grid>
                <Grid item xs={6} sm={2}>
                    <TextField fullWidth size="small" type="date" label="From" InputLabelProps={{ shrink: true }}
                        value={filters.date_from} onChange={e => setFilters(f => ({ ...f, date_from: e.target.value }))} />
                </Grid>
                <Grid item xs={6} sm={2}>
                    <TextField fullWidth size="small" type="date" label="To" InputLabelProps={{ shrink: true }}
                        value={filters.date_to} onChange={e => setFilters(f => ({ ...f, date_to: e.target.value }))} />
                </Grid>
                <Grid item xs={12} sm={1}>
                    <Button fullWidth variant="contained" onClick={() => { setPage(0); load(0, rowsPP); }} disabled={loading}
                        sx={{ bgcolor: T.accent, '&:hover': { bgcolor: T.accentMid }, borderRadius: '8px', textTransform: 'none', fontWeight: 700, height: 40 }}>
                        {loading ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : <RefreshIcon />}
                    </Button>
                </Grid>
            </Grid>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <TableContainer sx={{ border: `1px solid ${T.border}`, borderRadius: '10px', maxHeight: 500 }}>
                <Table stickyHeader size="small">
                    <TableHead>
                        <TableRow>
                            {['ID','Actor','Actor Type','Action','Entity','Entity ID','Changes','Timestamp'].map(h => (
                                <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', color: T.muted, bgcolor: T.bg }}>{h}</TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {rows.length === 0 && !loading && (
                            <TableRow>
                                <TableCell colSpan={8} sx={{ textAlign: 'center', color: T.muted, py: 4 }}>
                                    Click the refresh button to load audit logs.
                                </TableCell>
                            </TableRow>
                        )}
                        {rows.map(r => (
                            <TableRow key={r.log_id} hover sx={{ '&:last-child td': { border: 0 } }}>
                                <TableCell sx={{ fontSize: '0.75rem', color: T.muted }}>{r.log_id}</TableCell>
                                <TableCell sx={{ fontSize: '0.8rem' }}>{r.actor_id ?? '—'}</TableCell>
                                <TableCell><Chip label={r.actor_type} size="small" sx={{ fontSize: '0.68rem', fontWeight: 600 }} /></TableCell>
                                <TableCell>{actionChip(r.action)}</TableCell>
                                <TableCell sx={{ fontSize: '0.8rem', color: T.muted }}>{r.entity_type ?? '—'}</TableCell>
                                <TableCell sx={{ fontSize: '0.8rem', color: T.muted }}>{r.entity_id ?? '—'}</TableCell>
                                <TableCell><DiffCell old_value={r.old_value} new_value={r.new_value} /></TableCell>
                                <TableCell sx={{ fontSize: '0.75rem', color: T.muted, whiteSpace: 'nowrap' }}>
                                    {new Date(r.created_at).toLocaleString('en-ZA')}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <TablePagination
                component="div" count={total} page={page} rowsPerPage={rowsPP}
                rowsPerPageOptions={[25, 50, 100]}
                onPageChange={handlePageChange}
                onRowsPerPageChange={handleRowsChange}
                sx={{ borderTop: `1px solid ${T.border}` }}
            />
        </Box>
    );
}

// ── Login attempts tab ────────────────────────────────────────────────────────
function LoginAttemptsTab() {
    const [rows,    setRows]    = useState([]);
    const [total,   setTotal]   = useState(0);
    const [loading, setLoading] = useState(false);
    const [error,   setError]   = useState(null);
    const [page,    setPage]    = useState(0);
    const [filters, setFilters] = useState({ email: '', success: '', date_from: '', date_to: '' });

    const load = useCallback(async (p = 0) => {
        setLoading(true); setError(null);
        try {
            const qs = new URLSearchParams({
                ...Object.fromEntries(Object.entries(filters).filter(([,v]) => v)),
                limit: 50, offset: p * 50,
            }).toString();
            const res = await auditAPI.getLogins(qs);
            setRows(res.data.data.attempts);
            setTotal(res.data.data.total);
        } catch (e) { setError(e.response?.data?.message || e.message); }
        finally { setLoading(false); }
    }, [filters]);

    return (
        <Box>
            <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={4}>
                    <TextField fullWidth size="small" label="Email" value={filters.email}
                        onChange={e => setFilters(f => ({ ...f, email: e.target.value }))} />
                </Grid>
                <Grid item xs={6} sm={2}>
                    <TextField select fullWidth size="small" label="Result" value={filters.success}
                        onChange={e => setFilters(f => ({ ...f, success: e.target.value }))}>
                        <MenuItem value="">All</MenuItem>
                        <MenuItem value="true">Success</MenuItem>
                        <MenuItem value="false">Failed</MenuItem>
                    </TextField>
                </Grid>
                <Grid item xs={6} sm={2}>
                    <TextField fullWidth size="small" type="date" label="From" InputLabelProps={{ shrink: true }}
                        value={filters.date_from} onChange={e => setFilters(f => ({ ...f, date_from: e.target.value }))} />
                </Grid>
                <Grid item xs={6} sm={2}>
                    <TextField fullWidth size="small" type="date" label="To" InputLabelProps={{ shrink: true }}
                        value={filters.date_to} onChange={e => setFilters(f => ({ ...f, date_to: e.target.value }))} />
                </Grid>
                <Grid item xs={6} sm={2}>
                    <Button fullWidth variant="contained" onClick={() => { setPage(0); load(0); }} disabled={loading}
                        sx={{ bgcolor: T.accent, '&:hover': { bgcolor: T.accentMid }, borderRadius: '8px', textTransform: 'none', fontWeight: 700, height: 40 }}>
                        {loading ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : <RefreshIcon />}
                    </Button>
                </Grid>
            </Grid>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <TableContainer sx={{ border: `1px solid ${T.border}`, borderRadius: '10px', maxHeight: 500 }}>
                <Table stickyHeader size="small">
                    <TableHead>
                        <TableRow>
                            {['Email','IP Address','Result','Timestamp'].map(h => (
                                <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', color: T.muted, bgcolor: T.bg }}>{h}</TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {rows.length === 0 && !loading && (
                            <TableRow>
                                <TableCell colSpan={4} sx={{ textAlign: 'center', color: T.muted, py: 4 }}>
                                    Apply filters and click refresh.
                                </TableCell>
                            </TableRow>
                        )}
                        {rows.map(r => (
                            <TableRow key={r.attempt_id} hover sx={{ '&:last-child td': { border: 0 } }}>
                                <TableCell sx={{ fontSize: '0.8rem' }}>{r.email}</TableCell>
                                <TableCell sx={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>{r.ip_address ?? '—'}</TableCell>
                                <TableCell>
                                    <Chip label={r.success ? 'Success' : 'Failed'} size="small"
                                        sx={{ fontSize: '0.68rem', fontWeight: 700,
                                            bgcolor: r.success ? T.greenSoft  : T.roseSoft,
                                            color:   r.success ? T.green      : T.rose }} />
                                </TableCell>
                                <TableCell sx={{ fontSize: '0.75rem', color: T.muted, whiteSpace: 'nowrap' }}>
                                    {new Date(r.created_at).toLocaleString('en-ZA')}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <TablePagination component="div" count={total} page={page} rowsPerPage={50}
                rowsPerPageOptions={[50]} onPageChange={(_, p) => { setPage(p); load(p); }}
                sx={{ borderTop: `1px solid ${T.border}` }} />
        </Box>
    );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function AuditLogViewer() {
    const [tab, setTab] = useState(0);

    return (
        <Box sx={{ p: 3, bgcolor: T.bg, minHeight: '100vh' }}>
            <Box sx={{ mb: 3 }}>
                <Typography sx={{ fontSize: '1.4rem', fontWeight: 800, color: T.text }}>Audit Log Viewer</Typography>
                <Typography sx={{ fontSize: '0.85rem', color: T.muted, mt: 0.3 }}>
                    Full tamper-evident audit trail of system actions and login attempts.
                </Typography>
            </Box>

            <Card sx={{ border: `1px solid ${T.border}`, borderRadius: '14px', boxShadow: 'none' }}>
                <Box sx={{ borderBottom: `1px solid ${T.border}`, px: 2 }}>
                    <Tabs value={tab} onChange={(_, v) => setTab(v)}
                        TabIndicatorProps={{ style: { backgroundColor: T.accent, height: 3 } }}
                        sx={{ '& .MuiTab-root': { fontWeight: 700, fontSize: '0.82rem', textTransform: 'none', color: T.muted }, '& .Mui-selected': { color: T.accent } }}>
                        <Tab label="System Actions" icon={<SecurityIcon fontSize="small" />} iconPosition="start" />
                        <Tab label="Login Attempts"  icon={<LoginIcon    fontSize="small" />} iconPosition="start" />
                    </Tabs>
                </Box>
                <Box sx={{ p: 3 }}>
                    <TabPanel value={tab} index={0}><AuditLogsTab /></TabPanel>
                    <TabPanel value={tab} index={1}><LoginAttemptsTab /></TabPanel>
                </Box>
            </Card>
        </Box>
    );
}
