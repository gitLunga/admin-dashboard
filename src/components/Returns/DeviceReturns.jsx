import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Card, Grid, Button, Chip, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, TablePagination,
    TextField, MenuItem, Alert, CircularProgress,
    Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import {
    Refresh as RefreshIcon,
    Add as AddIcon,
} from '@mui/icons-material';
import { returnsAPI } from '../../services/api';
import { T } from '../Layout/Sidebar';

const STATUSES = ['Requested', 'Approved', 'Collected', 'Assessed', 'Completed', 'Cancelled'];

const STATUS_COLOR = {
    Requested: { bg: T.accentSoft,  color: T.accent },
    Approved:  { bg: T.greenSoft,   color: T.green  },
    Collected: { bg: '#EDE9FE',     color: '#7C3AED'},
    Assessed:  { bg: T.amberSoft,   color: T.amber  },
    Completed: { bg: T.greenSoft,   color: T.green  },
    Cancelled: { bg: T.bg,          color: T.muted  },
};

const GRADE_COLOR = {
    A: T.green, B: T.accent, C: T.amber, D: T.rose,
};

function StatusChip({ status }) {
    const c = STATUS_COLOR[status] || { bg: T.bg, color: T.muted };
    return <Chip label={status} size="small" sx={{ fontSize: '0.68rem', fontWeight: 700, bgcolor: c.bg, color: c.color }} />;
}

function StatCard({ label, value, color = T.accent }) {
    return (
        <Card sx={{ border: `1px solid ${T.border}`, borderRadius: '12px', boxShadow: 'none' }}>
            <Box sx={{ p: '16px' }}>
                <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</Typography>
                <Typography sx={{ fontSize: '1.7rem', fontWeight: 800, color, mt: 0.4 }}>{value ?? '—'}</Typography>
            </Box>
        </Card>
    );
}

// ── Status update dialog ──────────────────────────────────────────────────────
function UpdateStatusDialog({ open, row, onClose, onSave }) {
    const [status,  setStatus]  = useState('');
    const [grade,   setGrade]   = useState('');
    const [notes,   setNotes]   = useState('');
    const [loading, setLoading] = useState(false);
    const [error,   setError]   = useState(null);

    useEffect(() => {
        if (row) { setStatus(row.return_status); setGrade(''); setNotes(''); setError(null); }
    }, [row]);

    const save = async () => {
        setLoading(true); setError(null);
        try {
            await returnsAPI.updateStatus(row.return_id, {
                status, condition_grade: grade || undefined, condition_notes: notes || undefined,
            });
            onSave();
        } catch (e) { setError(e.response?.data?.message || e.message); }
        finally { setLoading(false); }
    };

    const nextStatuses = row
        ? STATUSES.slice(STATUSES.indexOf(row.return_status) + 1)
        : [];

    const showGrade = ['Assessed', 'Completed'].includes(status);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ fontWeight: 700 }}>Update Return Status</DialogTitle>
            <DialogContent>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                {row && (
                    <Box sx={{ mb: 2 }}>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.9rem' }}>{row.first_name} {row.last_name}</Typography>
                        <Typography sx={{ color: T.muted, fontSize: '0.8rem' }}>{row.device_name} — {row.imei}</Typography>
                    </Box>
                )}
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                        <TextField select fullWidth label="New Status" size="small" value={status} onChange={e => setStatus(e.target.value)}>
                            {nextStatuses.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                            <MenuItem value="Cancelled">Cancelled</MenuItem>
                        </TextField>
                    </Grid>
                    {showGrade && (
                        <Grid item xs={12} sm={6}>
                            <TextField select fullWidth label="Condition Grade" size="small" value={grade} onChange={e => setGrade(e.target.value)}>
                                <MenuItem value="">— Select —</MenuItem>
                                {['A','B','C','D'].map(g => (
                                    <MenuItem key={g} value={g}>{g} — {g === 'A' ? 'Excellent' : g === 'B' ? 'Good' : g === 'C' ? 'Fair' : 'Poor'}</MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                    )}
                    <Grid item xs={12}>
                        <TextField fullWidth multiline rows={3} label="Notes" size="small" value={notes} onChange={e => setNotes(e.target.value)} />
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={onClose} sx={{ textTransform: 'none' }}>Cancel</Button>
                <Button variant="contained" onClick={save} disabled={loading || !status}
                    sx={{ bgcolor: T.accent, '&:hover': { bgcolor: T.accentMid }, textTransform: 'none', fontWeight: 700 }}>
                    {loading ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : 'Save'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

// ── Initiate return dialog ─────────────────────────────────────────────────────
function InitiateReturnDialog({ open, onClose, onSave }) {
    const [contractId, setContractId] = useState('');
    const [reason,     setReason]     = useState('');
    const [loading,    setLoading]    = useState(false);
    const [error,      setError]      = useState(null);

    const save = async () => {
        setLoading(true); setError(null);
        try {
            await returnsAPI.initiate({ contract_id: parseInt(contractId), return_reason: reason });
            onSave();
        } catch (e) { setError(e.response?.data?.message || e.message); }
        finally { setLoading(false); }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ fontWeight: 700 }}>Initiate Device Return</DialogTitle>
            <DialogContent>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                <Grid container spacing={2} sx={{ mt: 0 }}>
                    <Grid item xs={12}>
                        <TextField fullWidth size="small" label="Contract ID" type="number" value={contractId}
                            onChange={e => setContractId(e.target.value)} helperText="Find the contract ID from the Contract Management page." />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField fullWidth multiline rows={3} size="small" label="Return Reason" value={reason}
                            onChange={e => setReason(e.target.value)} />
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={onClose} sx={{ textTransform: 'none' }}>Cancel</Button>
                <Button variant="contained" onClick={save} disabled={loading || !contractId || !reason}
                    sx={{ bgcolor: T.accent, '&:hover': { bgcolor: T.accentMid }, textTransform: 'none', fontWeight: 700 }}>
                    {loading ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : 'Initiate'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function DeviceReturns() {
    const [returns,   setReturns]   = useState([]);
    const [summary,   setSummary]   = useState([]);
    const [total,     setTotal]     = useState(0);
    const [loading,   setLoading]   = useState(false);
    const [error,     setError]     = useState(null);
    const [page,      setPage]      = useState(0);
    const [statusFlt, setStatusFlt] = useState('');
    const [selected,  setSelected]  = useState(null);
    const [initDlg,   setInitDlg]   = useState(false);

    const loadSummary = useCallback(async () => {
        try {
            const res = await returnsAPI.summary();
            setSummary(res.data.data);
        } catch (_) {}
    }, []);

    const load = useCallback(async (p = 0) => {
        setLoading(true); setError(null);
        try {
            const qs = new URLSearchParams({
                ...(statusFlt ? { status: statusFlt } : {}),
                limit: 50, offset: p * 50,
            }).toString();
            const res = await returnsAPI.list(qs);
            setReturns(res.data.data.returns);
            setTotal(res.data.data.total);
        } catch (e) { setError(e.response?.data?.message || e.message); }
        finally { setLoading(false); }
    }, [statusFlt]);

    useEffect(() => { loadSummary(); load(0); }, [load, loadSummary]);

    const onSaved = () => {
        setSelected(null);
        setInitDlg(false);
        loadSummary();
        load(page);
    };

    const statusTotals = STATUSES.reduce((acc, s) => {
        acc[s] = parseInt(summary.find(r => r.return_status === s)?.total || 0);
        return acc;
    }, {});

    return (
        <Box sx={{ p: 3, bgcolor: T.bg, minHeight: '100vh' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                <Box>
                    <Typography sx={{ fontSize: '1.4rem', fontWeight: 800, color: T.text }}>Device Returns</Typography>
                    <Typography sx={{ fontSize: '0.85rem', color: T.muted, mt: 0.3 }}>
                        Manage the end-to-end return lifecycle for devices at contract expiry or early termination.
                    </Typography>
                </Box>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => setInitDlg(true)}
                    sx={{ bgcolor: T.accent, '&:hover': { bgcolor: T.accentMid }, borderRadius: '8px', textTransform: 'none', fontWeight: 700 }}>
                    Initiate Return
                </Button>
            </Box>

            {/* Summary cards */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6} sm={2}><StatCard label="Requested"  value={statusTotals.Requested}  color={T.accent} /></Grid>
                <Grid item xs={6} sm={2}><StatCard label="Approved"   value={statusTotals.Approved}   color={T.green} /></Grid>
                <Grid item xs={6} sm={2}><StatCard label="Collected"  value={statusTotals.Collected}  color="#7C3AED" /></Grid>
                <Grid item xs={6} sm={2}><StatCard label="Assessed"   value={statusTotals.Assessed}   color={T.amber} /></Grid>
                <Grid item xs={6} sm={2}><StatCard label="Completed"  value={statusTotals.Completed}  color={T.green} /></Grid>
                <Grid item xs={6} sm={2}><StatCard label="Cancelled"  value={statusTotals.Cancelled}  color={T.muted} /></Grid>
            </Grid>

            {/* Filters + refresh */}
            <Card sx={{ border: `1px solid ${T.border}`, borderRadius: '14px', boxShadow: 'none', p: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                    <TextField select size="small" label="Status" value={statusFlt} onChange={e => setStatusFlt(e.target.value)} sx={{ minWidth: 150 }}>
                        <MenuItem value="">All Statuses</MenuItem>
                        {STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                    </TextField>
                    <Button variant="contained" onClick={() => load(0)} disabled={loading}
                        startIcon={loading ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : <RefreshIcon />}
                        sx={{ bgcolor: T.accent, '&:hover': { bgcolor: T.accentMid }, borderRadius: '8px', textTransform: 'none', fontWeight: 700 }}>
                        {loading ? 'Loading…' : 'Refresh'}
                    </Button>
                </Box>
            </Card>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {/* Table */}
            <Card sx={{ border: `1px solid ${T.border}`, borderRadius: '14px', boxShadow: 'none' }}>
                <TableContainer sx={{ maxHeight: 500 }}>
                    <Table stickyHeader size="small">
                        <TableHead>
                            <TableRow>
                                {['Return ID','Name','Department','Device','IMEI','Reason','Condition','Status','Initiated','Actions'].map(h => (
                                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', color: T.muted, bgcolor: T.bg }}>{h}</TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {returns.length === 0 && !loading && (
                                <TableRow>
                                    <TableCell colSpan={10} sx={{ textAlign: 'center', color: T.muted, py: 4 }}>No returns found.</TableCell>
                                </TableRow>
                            )}
                            {returns.map(r => (
                                <TableRow key={r.return_id} hover sx={{ '&:last-child td': { border: 0 } }}>
                                    <TableCell sx={{ fontSize: '0.75rem', color: T.muted }}>#{r.return_id}</TableCell>
                                    <TableCell sx={{ fontSize: '0.8rem', fontWeight: 600 }}>{r.first_name} {r.last_name}</TableCell>
                                    <TableCell sx={{ fontSize: '0.75rem' }}>{r.department_id ?? '—'}</TableCell>
                                    <TableCell sx={{ fontSize: '0.8rem' }}>{r.device_name}</TableCell>
                                    <TableCell sx={{ fontSize: '0.72rem', fontFamily: 'monospace', color: T.muted }}>{r.imei}</TableCell>
                                    <TableCell sx={{ fontSize: '0.75rem', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {r.return_reason}
                                    </TableCell>
                                    <TableCell>
                                        {r.condition_grade ? (
                                            <Chip label={r.condition_grade} size="small"
                                                sx={{ fontSize: '0.72rem', fontWeight: 800, color: GRADE_COLOR[r.condition_grade], bgcolor: GRADE_COLOR[r.condition_grade] + '22' }} />
                                        ) : '—'}
                                    </TableCell>
                                    <TableCell><StatusChip status={r.return_status} /></TableCell>
                                    <TableCell sx={{ fontSize: '0.75rem', color: T.muted, whiteSpace: 'nowrap' }}>
                                        {new Date(r.initiated_at).toLocaleDateString('en-ZA')}
                                    </TableCell>
                                    <TableCell>
                                        {!['Completed','Cancelled'].includes(r.return_status) && (
                                            <Button size="small" variant="outlined" onClick={() => setSelected(r)}
                                                sx={{ textTransform: 'none', fontSize: '0.72rem', fontWeight: 700, borderColor: T.border, color: T.accent, borderRadius: '6px' }}>
                                                Update
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination component="div" count={total} page={page} rowsPerPage={50} rowsPerPageOptions={[50]}
                    onPageChange={(_, p) => { setPage(p); load(p); }}
                    sx={{ borderTop: `1px solid ${T.border}` }} />
            </Card>

            <UpdateStatusDialog open={!!selected} row={selected} onClose={() => setSelected(null)} onSave={onSaved} />
            <InitiateReturnDialog open={initDlg} onClose={() => setInitDlg(false)} onSave={onSaved} />
        </Box>
    );
}
