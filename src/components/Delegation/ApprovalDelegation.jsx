import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Card, Grid, Button, Chip, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, TextField,
    MenuItem, Alert, CircularProgress,
    Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import { Add as AddIcon, Delete as RevokeIcon } from '@mui/icons-material';
import { delegationAPI } from '../../services/api';
import { T } from '../Layout/Sidebar';

function StatusChip({ isActive, startDate, endDate }) {
    const now   = new Date();
    const start = new Date(startDate);
    const end   = new Date(endDate);
    if (!isActive) return <Chip label="Revoked" size="small" sx={{ fontSize: '0.68rem', fontWeight: 700, bgcolor: T.bg, color: T.muted }} />;
    if (now < start) return <Chip label="Upcoming" size="small" sx={{ fontSize: '0.68rem', fontWeight: 700, bgcolor: T.amberSoft, color: T.amber }} />;
    if (now > end)   return <Chip label="Expired" size="small" sx={{ fontSize: '0.68rem', fontWeight: 700, bgcolor: T.roseSoft, color: T.rose }} />;
    return <Chip label="Active" size="small" sx={{ fontSize: '0.68rem', fontWeight: 700, bgcolor: T.greenSoft, color: T.green }} />;
}

function CreateDelegationDialog({ open, onClose, onSave }) {
    const [delegates, setDelegates] = useState([]);
    const [delegateId, setDelegateId] = useState('');
    const [startDate,  setStartDate]  = useState('');
    const [endDate,    setEndDate]    = useState('');
    const [reason,     setReason]     = useState('');
    const [loading,    setLoading]    = useState(false);
    const [error,      setError]      = useState(null);

    useEffect(() => {
        if (open) {
            delegationAPI.eligible().then(res => setDelegates(res.data.data)).catch(() => {});
            setDelegateId(''); setStartDate(''); setEndDate(''); setReason(''); setError(null);
        }
    }, [open]);

    const save = async () => {
        setLoading(true); setError(null);
        try {
            await delegationAPI.create({ delegate_id: delegateId, start_date: startDate, end_date: endDate, reason });
            onSave();
        } catch (e) { setError(e.response?.data?.message || e.message); }
        finally { setLoading(false); }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ fontWeight: 700 }}>Create Approval Delegation</DialogTitle>
            <DialogContent>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                <Typography sx={{ fontSize: '0.85rem', color: T.muted, mb: 2 }}>
                    Grant another user the ability to approve applications on your behalf for a defined period.
                </Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <TextField select fullWidth size="small" label="Delegate To" value={delegateId} onChange={e => setDelegateId(e.target.value)}>
                            <MenuItem value="">— Select user —</MenuItem>
                            {delegates.map(d => (
                                <MenuItem key={d.op_user_id} value={d.op_user_id}>
                                    {d.first_name} {d.last_name} ({d.user_role})
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                    <Grid item xs={6}>
                        <TextField fullWidth size="small" type="date" label="Start Date" InputLabelProps={{ shrink: true }}
                            value={startDate} onChange={e => setStartDate(e.target.value)} />
                    </Grid>
                    <Grid item xs={6}>
                        <TextField fullWidth size="small" type="date" label="End Date" InputLabelProps={{ shrink: true }}
                            value={endDate} onChange={e => setEndDate(e.target.value)} />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField fullWidth size="small" label="Reason (optional)" value={reason}
                            onChange={e => setReason(e.target.value)} placeholder="e.g. Annual leave" />
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={onClose} sx={{ textTransform: 'none' }}>Cancel</Button>
                <Button variant="contained" onClick={save} disabled={loading || !delegateId || !startDate || !endDate}
                    sx={{ bgcolor: T.accent, '&:hover': { bgcolor: T.accentMid }, textTransform: 'none', fontWeight: 700 }}>
                    {loading ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : 'Create Delegation'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default function ApprovalDelegation() {
    const [delegations, setDelegations] = useState([]);
    const [myDelegate,  setMyDelegate]  = useState(null);
    const [loading,     setLoading]     = useState(false);
    const [error,       setError]       = useState(null);
    const [createDlg,   setCreateDlg]   = useState(false);
    const [revokeLoading, setRevLoading] = useState(null);

    const load = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const [listRes, mineRes] = await Promise.all([
                delegationAPI.list(),
                delegationAPI.mine().catch(() => ({ data: { data: null } })),
            ]);
            setDelegations(listRes.data.data);
            setMyDelegate(mineRes.data.data);
        } catch (e) { setError(e.response?.data?.message || e.message); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const revoke = async (id) => {
        setRevLoading(id);
        try {
            await delegationAPI.revoke(id);
            await load();
        } catch (e) { setError(e.response?.data?.message || e.message); }
        finally { setRevLoading(null); }
    };

    const onCreated = () => { setCreateDlg(false); load(); };

    return (
        <Box sx={{ p: 3, bgcolor: T.bg, minHeight: '100vh' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                <Box>
                    <Typography sx={{ fontSize: '1.4rem', fontWeight: 800, color: T.text }}>Approval Delegation</Typography>
                    <Typography sx={{ fontSize: '0.85rem', color: T.muted, mt: 0.3 }}>
                        Grant temporary approval authority to another user during your absence.
                    </Typography>
                </Box>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateDlg(true)}
                    sx={{ bgcolor: T.accent, '&:hover': { bgcolor: T.accentMid }, borderRadius: '8px', textTransform: 'none', fontWeight: 700 }}>
                    Delegate Authority
                </Button>
            </Box>

            {/* Active delegation banner */}
            {myDelegate && (
                <Card sx={{ border: `2px solid ${T.green}`, borderRadius: '12px', boxShadow: 'none', p: 2, mb: 3, bgcolor: T.greenSoft }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: T.green }}>
                        You currently have an active delegation
                    </Typography>
                    <Typography sx={{ fontSize: '0.82rem', color: T.text, mt: 0.4 }}>
                        Approval authority from <strong>{myDelegate.delegator_first} {myDelegate.delegator_last}</strong> ({myDelegate.delegator_role}) is delegated to you
                        from {new Date(myDelegate.start_date).toLocaleDateString('en-ZA')} to {new Date(myDelegate.end_date).toLocaleDateString('en-ZA')}.
                    </Typography>
                </Card>
            )}

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Card sx={{ border: `1px solid ${T.border}`, borderRadius: '14px', boxShadow: 'none' }}>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                {['Delegator','Delegate','From','To','Reason','Status','Actions'].map(h => (
                                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', color: T.muted, bgcolor: T.bg }}>{h}</TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading && (
                                <TableRow><TableCell colSpan={7} sx={{ textAlign: 'center', py: 4 }}><CircularProgress size={24} /></TableCell></TableRow>
                            )}
                            {!loading && delegations.length === 0 && (
                                <TableRow><TableCell colSpan={7} sx={{ textAlign: 'center', color: T.muted, py: 4 }}>No delegations found.</TableCell></TableRow>
                            )}
                            {delegations.map(d => (
                                <TableRow key={d.delegation_id} hover sx={{ '&:last-child td': { border: 0 } }}>
                                    <TableCell sx={{ fontSize: '0.8rem', fontWeight: 600 }}>
                                        {d.delegator_first} {d.delegator_last}
                                        <Typography component="span" sx={{ ml: 0.5, fontSize: '0.68rem', color: T.muted }}>({d.delegator_role})</Typography>
                                    </TableCell>
                                    <TableCell sx={{ fontSize: '0.8rem', fontWeight: 600 }}>
                                        {d.delegate_first} {d.delegate_last}
                                        <Typography component="span" sx={{ ml: 0.5, fontSize: '0.68rem', color: T.muted }}>({d.delegate_role})</Typography>
                                    </TableCell>
                                    <TableCell sx={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{new Date(d.start_date).toLocaleDateString('en-ZA')}</TableCell>
                                    <TableCell sx={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{new Date(d.end_date).toLocaleDateString('en-ZA')}</TableCell>
                                    <TableCell sx={{ fontSize: '0.75rem', color: T.muted }}>{d.reason || '—'}</TableCell>
                                    <TableCell><StatusChip isActive={d.is_active} startDate={d.start_date} endDate={d.end_date} /></TableCell>
                                    <TableCell>
                                        {d.is_active && (
                                            <Button size="small" variant="outlined" startIcon={revokeLoading === d.delegation_id ? <CircularProgress size={12} /> : <RevokeIcon fontSize="small" />}
                                                onClick={() => revoke(d.delegation_id)} disabled={revokeLoading === d.delegation_id}
                                                sx={{ textTransform: 'none', fontSize: '0.72rem', fontWeight: 700, borderColor: T.rose + '80', color: T.rose, borderRadius: '6px' }}>
                                                Revoke
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Card>

            <CreateDelegationDialog open={createDlg} onClose={() => setCreateDlg(false)} onSave={onCreated} />
        </Box>
    );
}
