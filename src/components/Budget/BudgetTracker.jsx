import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Card, Grid, Button, Chip, LinearProgress,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    TextField, MenuItem, Alert, CircularProgress,
    Dialog, DialogTitle, DialogContent, DialogActions,
    IconButton,
} from '@mui/material';
import {
    Add as AddIcon, Delete as DeleteIcon, Refresh as RefreshIcon,
} from '@mui/icons-material';
import { budgetAPI, adminAPI } from '../../services/api';
import { T } from '../Layout/Sidebar';

const STATUS_COLOR = {
    ok:        { bar: T.green,  label: 'OK',       bg: T.greenSoft,  color: T.green  },
    warning:   { bar: T.amber,  label: 'Near Limit', bg: T.amberSoft, color: T.amber  },
    over:      { bar: T.rose,   label: 'Over Budget', bg: T.roseSoft, color: T.rose   },
    no_budget: { bar: T.muted,  label: 'No Budget', bg: T.bg,         color: T.muted  },
};

function SpendBar({ pct, status }) {
    const c = STATUS_COLOR[status] || STATUS_COLOR.ok;
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LinearProgress variant="determinate" value={Math.min(pct ?? 0, 100)}
                sx={{ flex: 1, height: 8, borderRadius: 4, bgcolor: c.bar + '22',
                      '& .MuiLinearProgress-bar': { bgcolor: c.bar, borderRadius: 4 } }} />
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: c.bar, minWidth: 36 }}>
                {pct != null ? `${pct}%` : '—'}
            </Typography>
        </Box>
    );
}

function StatusChip({ status }) {
    const c = STATUS_COLOR[status] || STATUS_COLOR.no_budget;
    return <Chip label={c.label} size="small" sx={{ fontSize: '0.68rem', fontWeight: 700, bgcolor: c.bg, color: c.color }} />;
}

// ── Upsert dialog ─────────────────────────────────────────────────────────────
function UpsertBudgetDialog({ open, onClose, onSave }) {
    const [deptId,   setDeptId]   = useState('');
    const [depts,    setDepts]    = useState([]);
    const [year,     setYear]     = useState(new Date().getFullYear().toString());
    const [ceiling,  setCeiling]  = useState('');
    const [notes,    setNotes]    = useState('');
    const [loading,  setLoading]  = useState(false);
    const [error,    setError]    = useState(null);

    useEffect(() => {
        if (!open) return;
        setDeptId(''); setYear(new Date().getFullYear().toString()); setCeiling(''); setNotes(''); setError(null);
        adminAPI.getDepartments().then(res => setDepts(res.data.data || [])).catch(() => {});
    }, [open]);

    const save = async () => {
        setLoading(true); setError(null);
        try {
            await budgetAPI.upsert({ department_id: deptId, fiscal_year: year, monthly_ceiling: ceiling, notes });
            onSave();
        } catch (e) { setError(e.response?.data?.message || e.message); }
        finally { setLoading(false); }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ fontWeight: 700 }}>Set Department Budget</DialogTitle>
            <DialogContent>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                <Typography sx={{ fontSize: '0.85rem', color: T.muted, mb: 2 }}>
                    Set the monthly device spend ceiling for a department. If a record already exists for the same department and year it will be updated.
                </Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <TextField select fullWidth size="small" label="Department" value={deptId}
                            onChange={e => setDeptId(e.target.value)}>
                            <MenuItem value="">— Select department —</MenuItem>
                            {depts.map(d => (
                                <MenuItem key={d.id} value={d.code || d.name}>
                                    {d.name}{d.code ? ` (${d.code})` : ''}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                    <Grid item xs={6}>
                        <TextField fullWidth size="small" label="Fiscal Year" type="number" value={year}
                            onChange={e => setYear(e.target.value)} />
                    </Grid>
                    <Grid item xs={6}>
                        <TextField fullWidth size="small" label="Monthly Ceiling (R)" type="number" value={ceiling}
                            onChange={e => setCeiling(e.target.value)} />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField fullWidth size="small" label="Notes (optional)" value={notes}
                            onChange={e => setNotes(e.target.value)} />
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={onClose} sx={{ textTransform: 'none' }}>Cancel</Button>
                <Button variant="contained" onClick={save} disabled={loading || !deptId || !ceiling}
                    sx={{ bgcolor: T.accent, '&:hover': { bgcolor: T.accentMid }, textTransform: 'none', fontWeight: 700 }}>
                    {loading ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : 'Save Budget'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default function BudgetTracker() {
    const [spendData, setSpendData] = useState(null);
    const [budgets,   setBudgets]   = useState([]);
    const [loading,   setLoading]   = useState(false);
    const [error,     setError]     = useState(null);
    const [year,      setYear]      = useState(new Date().getFullYear().toString());
    const [upsertDlg, setUpsertDlg] = useState(false);
    const [delLoading, setDelLoad]  = useState(null);

    const loadSpend = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const [spendRes, budgetRes] = await Promise.all([
                budgetAPI.spend(year),
                budgetAPI.list(`fiscal_year=${year}`),
            ]);
            setSpendData(spendRes.data.data);
            setBudgets(budgetRes.data.data);
        } catch (e) { setError(e.response?.data?.message || e.message); }
        finally { setLoading(false); }
    }, [year]);

    useEffect(() => { loadSpend(); }, [loadSpend]);

    const deleteBudget = async (id) => {
        setDelLoad(id);
        try {
            await budgetAPI.remove(id);
            await loadSpend();
        } catch (e) { setError(e.response?.data?.message || e.message); }
        finally { setDelLoad(null); }
    };

    const onSaved = () => { setUpsertDlg(false); loadSpend(); };

    const totalSpend = spendData?.departments?.reduce((s, d) => s + d.monthly_spend, 0) || 0;
    const overCount  = spendData?.over_budget || 0;
    const warnCount  = spendData?.near_limit  || 0;

    return (
        <Box sx={{ p: 3, bgcolor: T.bg, minHeight: '100vh' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                <Box>
                    <Typography sx={{ fontSize: '1.4rem', fontWeight: 800, color: T.text }}>Budget Tracker</Typography>
                    <Typography sx={{ fontSize: '0.85rem', color: T.muted, mt: 0.3 }}>
                        Monitor departmental device spend against allocated budgets.
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                    <TextField select size="small" label="Fiscal Year" value={year} onChange={e => setYear(e.target.value)} sx={{ minWidth: 110 }}>
                        {[0,1,2].map(offset => {
                            const y = (new Date().getFullYear() - offset).toString();
                            return <MenuItem key={y} value={y}>{y}</MenuItem>;
                        })}
                    </TextField>
                    <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadSpend} disabled={loading}
                        sx={{ borderColor: T.border, color: T.text, borderRadius: '8px', textTransform: 'none', fontWeight: 700 }}>
                        Refresh
                    </Button>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => setUpsertDlg(true)}
                        sx={{ bgcolor: T.accent, '&:hover': { bgcolor: T.accentMid }, borderRadius: '8px', textTransform: 'none', fontWeight: 700 }}>
                        Set Budget
                    </Button>
                </Box>
            </Box>

            {/* Summary cards */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6} sm={3}>
                    <Card sx={{ border: `1px solid ${T.border}`, borderRadius: '12px', boxShadow: 'none', p: '16px' }}>
                        <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total Monthly Spend</Typography>
                        <Typography sx={{ fontSize: '1.4rem', fontWeight: 800, color: T.text, mt: 0.4 }}>
                            R {totalSpend.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                        </Typography>
                    </Card>
                </Grid>
                <Grid item xs={6} sm={3}>
                    <Card sx={{ border: `1px solid ${T.border}`, borderRadius: '12px', boxShadow: 'none', p: '16px' }}>
                        <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Departments</Typography>
                        <Typography sx={{ fontSize: '1.4rem', fontWeight: 800, color: T.text, mt: 0.4 }}>
                            {spendData?.departments?.length ?? '—'}
                        </Typography>
                    </Card>
                </Grid>
                <Grid item xs={6} sm={3}>
                    <Card sx={{ border: `1px solid ${overCount > 0 ? T.rose : T.border}`, borderRadius: '12px', boxShadow: 'none', p: '16px', bgcolor: overCount > 0 ? T.roseSoft : undefined }}>
                        <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Over Budget</Typography>
                        <Typography sx={{ fontSize: '1.4rem', fontWeight: 800, color: overCount > 0 ? T.rose : T.text, mt: 0.4 }}>
                            {overCount}
                        </Typography>
                    </Card>
                </Grid>
                <Grid item xs={6} sm={3}>
                    <Card sx={{ border: `1px solid ${warnCount > 0 ? T.amber : T.border}`, borderRadius: '12px', boxShadow: 'none', p: '16px', bgcolor: warnCount > 0 ? T.amberSoft : undefined }}>
                        <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Near Limit (85%+)</Typography>
                        <Typography sx={{ fontSize: '1.4rem', fontWeight: 800, color: warnCount > 0 ? T.amber : T.text, mt: 0.4 }}>
                            {warnCount}
                        </Typography>
                    </Card>
                </Grid>
            </Grid>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {/* Spend vs Budget table */}
            <Card sx={{ border: `1px solid ${T.border}`, borderRadius: '14px', boxShadow: 'none', mb: 3 }}>
                <Box sx={{ p: 2, borderBottom: `1px solid ${T.border}` }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: T.text }}>Spend vs Budget — FY {year}</Typography>
                </Box>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                {['Department','Active Contracts','Monthly Spend','Monthly Ceiling','Annual Projection','Utilisation','Status'].map(h => (
                                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', color: T.muted, bgcolor: T.bg }}>{h}</TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading && (
                                <TableRow><TableCell colSpan={7} sx={{ textAlign: 'center', py: 4 }}><CircularProgress size={24} /></TableCell></TableRow>
                            )}
                            {!loading && !spendData?.departments?.length && (
                                <TableRow><TableCell colSpan={7} sx={{ textAlign: 'center', color: T.muted, py: 4 }}>No spend data available.</TableCell></TableRow>
                            )}
                            {spendData?.departments?.map(d => (
                                <TableRow key={d.department_id} hover sx={{ '&:last-child td': { border: 0 } }}>
                                    <TableCell sx={{ fontSize: '0.8rem', fontWeight: 600 }}>{d.department_id}</TableCell>
                                    <TableCell sx={{ fontSize: '0.8rem', textAlign: 'center' }}>{d.active_contracts}</TableCell>
                                    <TableCell sx={{ fontSize: '0.8rem', fontWeight: 700 }}>
                                        R {Number(d.monthly_spend).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                                    </TableCell>
                                    <TableCell sx={{ fontSize: '0.8rem', color: T.muted }}>
                                        {d.monthly_ceiling ? `R ${Number(d.monthly_ceiling).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}` : '—'}
                                    </TableCell>
                                    <TableCell sx={{ fontSize: '0.8rem', color: T.muted }}>
                                        R {Number(d.projected_annual_spend).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                                    </TableCell>
                                    <TableCell sx={{ minWidth: 160 }}>
                                        <SpendBar pct={d.utilisation_pct} status={d.status} />
                                    </TableCell>
                                    <TableCell><StatusChip status={d.status} /></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Card>

            {/* Budget ceilings management */}
            <Card sx={{ border: `1px solid ${T.border}`, borderRadius: '14px', boxShadow: 'none' }}>
                <Box sx={{ p: 2, borderBottom: `1px solid ${T.border}` }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: T.text }}>Configured Budget Ceilings — FY {year}</Typography>
                </Box>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                {['Department','Fiscal Year','Monthly Ceiling','Annual Ceiling','Notes','Set By','Actions'].map(h => (
                                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', color: T.muted, bgcolor: T.bg }}>{h}</TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {budgets.length === 0 && !loading && (
                                <TableRow><TableCell colSpan={7} sx={{ textAlign: 'center', color: T.muted, py: 3 }}>No budgets configured for this year.</TableCell></TableRow>
                            )}
                            {budgets.map(b => (
                                <TableRow key={b.budget_id} hover sx={{ '&:last-child td': { border: 0 } }}>
                                    <TableCell sx={{ fontSize: '0.8rem', fontWeight: 600 }}>{b.department_id}</TableCell>
                                    <TableCell sx={{ fontSize: '0.8rem' }}>{b.fiscal_year}</TableCell>
                                    <TableCell sx={{ fontSize: '0.8rem', fontWeight: 700 }}>
                                        R {Number(b.monthly_ceiling).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                                    </TableCell>
                                    <TableCell sx={{ fontSize: '0.8rem', color: T.muted }}>
                                        R {Number(b.annual_ceiling).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                                    </TableCell>
                                    <TableCell sx={{ fontSize: '0.75rem', color: T.muted }}>{b.notes || '—'}</TableCell>
                                    <TableCell sx={{ fontSize: '0.75rem', color: T.muted }}>{b.created_by_first} {b.created_by_last}</TableCell>
                                    <TableCell>
                                        <IconButton size="small" onClick={() => deleteBudget(b.budget_id)}
                                            disabled={delLoading === b.budget_id}
                                            sx={{ color: T.rose }}>
                                            {delLoading === b.budget_id ? <CircularProgress size={16} /> : <DeleteIcon fontSize="small" />}
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Card>

            <UpsertBudgetDialog open={upsertDlg} onClose={() => setUpsertDlg(false)} onSave={onSaved} />
        </Box>
    );
}
