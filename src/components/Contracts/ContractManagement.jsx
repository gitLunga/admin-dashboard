import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Card, Grid, Button, Chip, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, TablePagination,
    TextField, MenuItem, Alert, CircularProgress, Tooltip,
    Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import {
    Refresh as RefreshIcon,
    PictureAsPdf as PdfIcon,
    Email as EmailIcon,
    Warning as WarningIcon,
} from '@mui/icons-material';
import { contractsAPI, pdfAPI } from '../../services/api';
import { T } from '../Layout/Sidebar';

function downloadBlob(blob, filename) {
    const url = window.URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href    = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
}

function StatCard({ label, value, color = T.accent, sub }) {
    return (
        <Card sx={{ border: `1px solid ${T.border}`, borderRadius: '12px', boxShadow: 'none' }}>
            <Box sx={{ p: '16px' }}>
                <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</Typography>
                <Typography sx={{ fontSize: '1.7rem', fontWeight: 800, color, mt: 0.4 }}>{value ?? '—'}</Typography>
                {sub && <Typography sx={{ fontSize: '0.72rem', color: T.muted, mt: 0.2 }}>{sub}</Typography>}
            </Box>
        </Card>
    );
}

const EXPIRY_COLOR = {
    expired:    { bg: T.roseSoft,  color: T.rose  },
    expiring_30:{ bg: T.roseSoft,  color: T.rose  },
    expiring_60:{ bg: T.amberSoft, color: T.amber },
    expiring_90:{ bg: T.amberSoft, color: T.amber },
    active:     { bg: T.greenSoft, color: T.green },
};

function StatusChip({ status }) {
    const c = EXPIRY_COLOR[status] || { bg: T.bg, color: T.muted };
    const labels = { expired: 'Expired', expiring_30: '< 30 days', expiring_60: '< 60 days', expiring_90: '< 90 days', active: 'Active' };
    return <Chip label={labels[status] || status} size="small" sx={{ fontSize: '0.68rem', fontWeight: 700, bgcolor: c.bg, color: c.color }} />;
}

export default function ContractManagement() {
    const [summary,   setSummary]   = useState(null);
    const [contracts, setContracts] = useState([]);
    const [total,     setTotal]     = useState(0);
    const [loading,   setLoading]   = useState(false);
    const [error,     setError]     = useState(null);
    const [page,      setPage]      = useState(0);
    const [rowsPP,    setRowsPP]    = useState(50);
    const [statusFilter, setStatus] = useState('');
    const [daysFilter,   setDays]   = useState(30);
    const [mode,      setMode]      = useState('all');      // 'all' | 'expiring'
    const [pdfLoading, setPdf]      = useState(null);
    const [reminderDlg, setReminderDlg] = useState(false);
    const [reminderLoading, setRlLoading] = useState(false);
    const [reminderResult,  setRlResult]  = useState(null);

    const loadSummary = useCallback(async () => {
        try {
            const res = await contractsAPI.getSummary();
            setSummary(res.data.data);
        } catch (_) {}
    }, []);

    const loadContracts = useCallback(async (p = page, rpp = rowsPP) => {
        setLoading(true); setError(null);
        try {
            let res;
            if (mode === 'expiring') {
                res = await contractsAPI.getExpiring(daysFilter);
                setContracts(res.data.data.contracts);
                setTotal(res.data.data.contracts.length);
            } else {
                const qs = new URLSearchParams({
                    ...(statusFilter ? { status: statusFilter } : {}),
                    limit: rpp, offset: p * rpp,
                }).toString();
                res = await contractsAPI.getList(qs);
                setContracts(res.data.data.contracts);
                setTotal(res.data.data.total);
            }
        } catch (e) { setError(e.response?.data?.message || e.message); }
        finally { setLoading(false); }
    }, [mode, daysFilter, statusFilter, page, rowsPP]);

    useEffect(() => { loadSummary(); }, [loadSummary]);

    const downloadContractPdf = async (contractId) => {
        setPdf(contractId);
        try {
            const res = await pdfAPI.contractSummary(contractId);
            downloadBlob(res.data, `contract_${contractId}.pdf`);
        } catch (_) {}
        finally { setPdf(null); }
    };

    const sendReminders = async () => {
        setRlLoading(true); setRlResult(null);
        try {
            const res = await contractsAPI.sendReminders(daysFilter);
            setRlResult(res.data.data);
        } catch (e) { setError(e.response?.data?.message || e.message); }
        finally { setRlLoading(false); }
    };

    return (
        <Box sx={{ p: 3, bgcolor: T.bg, minHeight: '100vh' }}>
            <Box sx={{ mb: 3 }}>
                <Typography sx={{ fontSize: '1.4rem', fontWeight: 800, color: T.text }}>Contract Management</Typography>
                <Typography sx={{ fontSize: '0.85rem', color: T.muted, mt: 0.3 }}>
                    Monitor active contracts, track expiry dates, and send renewal reminders.
                </Typography>
            </Box>

            {/* Summary cards */}
            {summary && (
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={6} sm={3}>
                        <StatCard label="Total Contracts" value={summary.total} />
                    </Grid>
                    <Grid item xs={6} sm={3}>
                        <StatCard label="Active" value={summary.active} color={T.green} />
                    </Grid>
                    <Grid item xs={6} sm={3}>
                        <StatCard label="Expiring in 30 days" value={summary.expiring_30} color={T.rose}
                            sub={summary.expiring_30 > 0 ? 'Action required' : undefined} />
                    </Grid>
                    <Grid item xs={6} sm={3}>
                        <StatCard label="Expired" value={summary.expired} color={T.muted} />
                    </Grid>
                </Grid>
            )}

            {/* Controls */}
            <Card sx={{ border: `1px solid ${T.border}`, borderRadius: '14px', boxShadow: 'none', p: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                    <TextField select size="small" label="View" value={mode} onChange={e => setMode(e.target.value)} sx={{ minWidth: 130 }}>
                        <MenuItem value="all">All Contracts</MenuItem>
                        <MenuItem value="expiring">Expiring Soon</MenuItem>
                    </TextField>

                    {mode === 'all' && (
                        <TextField select size="small" label="Status" value={statusFilter} onChange={e => setStatus(e.target.value)} sx={{ minWidth: 130 }}>
                            <MenuItem value="">All</MenuItem>
                            <MenuItem value="active">Active</MenuItem>
                            <MenuItem value="expired">Expired</MenuItem>
                        </TextField>
                    )}

                    {mode === 'expiring' && (
                        <TextField select size="small" label="Within (days)" value={daysFilter} onChange={e => setDays(e.target.value)} sx={{ minWidth: 130 }}>
                            <MenuItem value={30}>30 days</MenuItem>
                            <MenuItem value={60}>60 days</MenuItem>
                            <MenuItem value={90}>90 days</MenuItem>
                        </TextField>
                    )}

                    <Button variant="contained" onClick={() => loadContracts(0, rowsPP)} disabled={loading}
                        startIcon={loading ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : <RefreshIcon />}
                        sx={{ bgcolor: T.accent, '&:hover': { bgcolor: T.accentMid }, borderRadius: '8px', textTransform: 'none', fontWeight: 700 }}>
                        {loading ? 'Loading…' : 'Load'}
                    </Button>

                    {mode === 'expiring' && (
                        <Button variant="outlined" startIcon={<EmailIcon />} onClick={() => setReminderDlg(true)}
                            sx={{ borderColor: T.amber, color: T.amber, borderRadius: '8px', textTransform: 'none', fontWeight: 700 }}>
                            Send Reminders
                        </Button>
                    )}
                </Box>
            </Card>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {/* Table */}
            <Card sx={{ border: `1px solid ${T.border}`, borderRadius: '14px', boxShadow: 'none' }}>
                <TableContainer sx={{ maxHeight: 480 }}>
                    <Table stickyHeader size="small">
                        <TableHead>
                            <TableRow>
                                {['Name','PERSAL','Department','Device','Plan','Monthly Cost','End Date','Status','Actions'].map(h => (
                                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', color: T.muted, bgcolor: T.bg }}>{h}</TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {contracts.length === 0 && !loading && (
                                <TableRow>
                                    <TableCell colSpan={9} sx={{ textAlign: 'center', color: T.muted, py: 4 }}>
                                        Click Load to fetch contracts.
                                    </TableCell>
                                </TableRow>
                            )}
                            {contracts.map((c, i) => (
                                <TableRow key={c.contract_id || i} hover sx={{ '&:last-child td': { border: 0 } }}>
                                    <TableCell sx={{ fontSize: '0.8rem', fontWeight: 600 }}>{c.first_name} {c.last_name}</TableCell>
                                    <TableCell sx={{ fontSize: '0.75rem', color: T.muted, fontFamily: 'monospace' }}>{c.persal_id ?? '—'}</TableCell>
                                    <TableCell sx={{ fontSize: '0.75rem' }}>{c.department_id ?? '—'}</TableCell>
                                    <TableCell sx={{ fontSize: '0.8rem' }}>{c.device_name ?? '—'}</TableCell>
                                    <TableCell sx={{ fontSize: '0.75rem', color: T.muted }}>{c.plan_name ?? '—'}</TableCell>
                                    <TableCell sx={{ fontSize: '0.8rem', fontWeight: 700 }}>
                                        {c.monthly_cost ? `R ${Number(c.monthly_cost).toFixed(2)}` : '—'}
                                    </TableCell>
                                    <TableCell sx={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                                        {c.contract_end_date ? new Date(c.contract_end_date).toLocaleDateString('en-ZA') : '—'}
                                        {c.days_until_expiry != null && c.days_until_expiry <= 30 && (
                                            <Tooltip title={`${c.days_until_expiry} days left`}>
                                                <WarningIcon sx={{ fontSize: 14, color: T.rose, ml: 0.5, verticalAlign: 'middle' }} />
                                            </Tooltip>
                                        )}
                                    </TableCell>
                                    <TableCell><StatusChip status={c.contract_status} /></TableCell>
                                    <TableCell>
                                        {c.contract_id && (
                                            <Tooltip title="Download Contract PDF">
                                                <Button size="small" variant="outlined" onClick={() => downloadContractPdf(c.contract_id)}
                                                    disabled={pdfLoading === c.contract_id}
                                                    sx={{ minWidth: 0, p: '4px 8px', borderColor: T.border, color: T.accent, borderRadius: '6px' }}>
                                                    {pdfLoading === c.contract_id ? <CircularProgress size={14} /> : <PdfIcon fontSize="small" />}
                                                </Button>
                                            </Tooltip>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
                {mode === 'all' && (
                    <TablePagination component="div" count={total} page={page} rowsPerPage={rowsPP}
                        rowsPerPageOptions={[25, 50, 100]}
                        onPageChange={(_, p) => { setPage(p); loadContracts(p, rowsPP); }}
                        onRowsPerPageChange={e => { const r = parseInt(e.target.value); setRowsPP(r); setPage(0); loadContracts(0, r); }}
                        sx={{ borderTop: `1px solid ${T.border}` }} />
                )}
            </Card>

            {/* Send reminders dialog */}
            <Dialog open={reminderDlg} onClose={() => { setReminderDlg(false); setRlResult(null); }} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>Send Expiry Reminders</DialogTitle>
                <DialogContent>
                    {reminderResult ? (
                        <Alert severity="success">
                            Sent {reminderResult.reminders_sent} reminder{reminderResult.reminders_sent !== 1 ? 's' : ''} for contracts expiring within {daysFilter} days.
                        </Alert>
                    ) : (
                        <Typography sx={{ fontSize: '0.9rem', color: T.muted }}>
                            Send email reminders to all users whose contracts expire within <strong>{daysFilter} days</strong>.
                            This will notify them and their managers.
                        </Typography>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => { setReminderDlg(false); setRlResult(null); }} sx={{ textTransform: 'none' }}>Close</Button>
                    {!reminderResult && (
                        <Button variant="contained" onClick={sendReminders} disabled={reminderLoading}
                            sx={{ bgcolor: T.amber, '&:hover': { bgcolor: '#B45309' }, textTransform: 'none', fontWeight: 700 }}>
                            {reminderLoading ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : 'Send Reminders'}
                        </Button>
                    )}
                </DialogActions>
            </Dialog>
        </Box>
    );
}
