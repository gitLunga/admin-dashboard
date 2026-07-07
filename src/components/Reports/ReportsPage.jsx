import React, { useState } from 'react';
import {
    Box, Typography, Grid, Card, CardContent, Button, Chip,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    CircularProgress, Alert, Tabs, Tab, TextField, MenuItem,
} from '@mui/material';
import {
    Download as DownloadIcon,
    Assessment as ReportIcon,
    Inventory as InventoryIcon,
    People as PeopleIcon,
    Speed as SlaIcon,
    Refresh as RefreshIcon,
} from '@mui/icons-material';
import { reportsAPI } from '../../services/api';
import { T } from '../Layout/Sidebar';

// ── Helper: trigger a CSV blob download ──────────────────────────────────────
function downloadBlob(blob, filename) {
    const url = window.URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href    = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
}

// ── Tab panel ─────────────────────────────────────────────────────────────────
function TabPanel({ children, value, index }) {
    return value === index ? <Box sx={{ pt: 3 }}>{children}</Box> : null;
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, color = T.accent }) {
    return (
        <Card sx={{ border: `1px solid ${T.border}`, borderRadius: '12px', boxShadow: 'none' }}>
            <CardContent sx={{ p: '16px !important' }}>
                <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</Typography>
                <Typography sx={{ fontSize: '1.6rem', fontWeight: 800, color, mt: 0.5 }}>{value ?? '—'}</Typography>
            </CardContent>
        </Card>
    );
}

// ── Row table ─────────────────────────────────────────────────────────────────
function DataTable({ columns, rows }) {
    if (!rows?.length) return (
        <Typography sx={{ color: T.muted, textAlign: 'center', py: 4 }}>No data available.</Typography>
    );
    return (
        <TableContainer sx={{ border: `1px solid ${T.border}`, borderRadius: '10px', maxHeight: 380 }}>
            <Table stickyHeader size="small">
                <TableHead>
                    <TableRow>
                        {columns.map(c => (
                            <TableCell key={c.key} sx={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', color: T.muted, bgcolor: T.bg }}>
                                {c.label}
                            </TableCell>
                        ))}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {rows.map((row, i) => (
                        <TableRow key={i} hover sx={{ '&:last-child td': { border: 0 } }}>
                            {columns.map(c => (
                                <TableCell key={c.key} sx={{ fontSize: '0.8rem', color: T.text }}>
                                    {c.render ? c.render(row[c.key], row) : (row[c.key] ?? '—')}
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
}

// ── Applications tab ──────────────────────────────────────────────────────────
function ApplicationsReport() {
    const [data,    setData]    = useState(null);
    const [loading, setLoading] = useState(false);
    const [error,   setError]   = useState(null);
    const [status,  setStatus]  = useState('');
    const [exporting, setExp]   = useState(false);

    const load = async () => {
        setLoading(true); setError(null);
        try {
            const qs  = status ? `status=${status}` : '';
            const res = await reportsAPI.getApplications(qs);
            setData(res.data.data);
        } catch (e) { setError(e.response?.data?.message || e.message); }
        finally { setLoading(false); }
    };

    const exportCsv = async () => {
        setExp(true);
        try {
            const qs  = status ? `status=${status}` : '';
            const res = await reportsAPI.exportApplications(qs);
            downloadBlob(res.data, `applications_report_${Date.now()}.csv`);
        } catch (e) { setError('Export failed.'); }
        finally { setExp(false); }
    };

    const COLS = [
        { key: 'application_id',     label: 'ID' },
        { key: 'applicant_first_name', label: 'Applicant', render: (v, r) => `${r.applicant_first_name} ${r.applicant_last_name}` },
        { key: 'department_id',      label: 'Department' },
        { key: 'device_name',        label: 'Device' },
        { key: 'application_status', label: 'Status', render: v => <Chip label={v} size="small" sx={{ fontSize: '0.7rem', fontWeight: 700 }} /> },
        { key: 'submission_date',    label: 'Submitted', render: v => v ? new Date(v).toLocaleDateString('en-ZA') : '—' },
        { key: 'monthly_cost',       label: 'Monthly Cost', render: v => v ? `R ${Number(v).toFixed(2)}` : '—' },
    ];

    return (
        <Box>
            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
                <TextField select label="Status Filter" size="small" value={status} onChange={e => setStatus(e.target.value)} sx={{ minWidth: 160 }}>
                    <MenuItem value="">All Statuses</MenuItem>
                    {['Pending','Pending_Finance','Approved','Rejected','Cancelled'].map(s => (
                        <MenuItem key={s} value={s}>{s}</MenuItem>
                    ))}
                </TextField>
                <Button variant="contained" onClick={load} disabled={loading} startIcon={loading ? <CircularProgress size={16} /> : <RefreshIcon />}
                    sx={{ bgcolor: T.accent, '&:hover': { bgcolor: T.accentMid }, borderRadius: '8px', textTransform: 'none', fontWeight: 700 }}>
                    {loading ? 'Loading…' : 'Generate Report'}
                </Button>
                <Button variant="outlined" onClick={exportCsv} disabled={exporting || !data} startIcon={<DownloadIcon />}
                    sx={{ borderColor: T.accent, color: T.accent, borderRadius: '8px', textTransform: 'none', fontWeight: 700 }}>
                    {exporting ? 'Exporting…' : 'Export CSV'}
                </Button>
            </Box>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {data && (
                <>
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid item xs={6} sm={3}><StatCard label="Total" value={data.count} /></Grid>
                        {data.report && Object.entries(data.report).slice(0, 3).map(([k, v]) => (
                            <Grid item xs={6} sm={3} key={k}><StatCard label={k.replace(/_/g,' ')} value={v} /></Grid>
                        ))}
                    </Grid>
                    <DataTable columns={COLS} rows={data.rows} />
                </>
            )}
        </Box>
    );
}

// ── Users tab ─────────────────────────────────────────────────────────────────
function UsersReport() {
    const [data, setData]       = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState(null);
    const [exporting, setExp]   = useState(false);

    const load = async () => {
        setLoading(true); setError(null);
        try {
            const res = await reportsAPI.getUsers();
            setData(res.data.data);
        } catch (e) { setError(e.response?.data?.message || e.message); }
        finally { setLoading(false); }
    };

    const exportCsv = async () => {
        setExp(true);
        try {
            const res = await reportsAPI.exportUsers();
            downloadBlob(res.data, `users_report_${Date.now()}.csv`);
        } catch (e) { setError('Export failed.'); }
        finally { setExp(false); }
    };

    const COLS = [
        { key: 'client_user_id', label: 'ID' },
        { key: 'full_name',      label: 'Name' },
        { key: 'email',          label: 'Email' },
        { key: 'user_type',      label: 'Type' },
        { key: 'department_id',  label: 'Department' },
        { key: 'region',         label: 'Region' },
        { key: 'persal_id',      label: 'PERSAL' },
    ];

    return (
        <Box>
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <Button variant="contained" onClick={load} disabled={loading} startIcon={loading ? <CircularProgress size={16} /> : <RefreshIcon />}
                    sx={{ bgcolor: T.accent, '&:hover': { bgcolor: T.accentMid }, borderRadius: '8px', textTransform: 'none', fontWeight: 700 }}>
                    {loading ? 'Loading…' : 'Generate Report'}
                </Button>
                <Button variant="outlined" onClick={exportCsv} disabled={exporting || !data} startIcon={<DownloadIcon />}
                    sx={{ borderColor: T.accent, color: T.accent, borderRadius: '8px', textTransform: 'none', fontWeight: 700 }}>
                    {exporting ? 'Exporting…' : 'Export CSV'}
                </Button>
            </Box>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {data && (
                <>
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid item xs={6} sm={3}><StatCard label="Total Users" value={data.count} /></Grid>
                    </Grid>
                    <DataTable columns={COLS} rows={data.rows} />
                </>
            )}
        </Box>
    );
}

// ── Inventory tab ─────────────────────────────────────────────────────────────
function InventoryReport() {
    const [data, setData]       = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState(null);
    const [exporting, setExp]   = useState(false);

    const load = async () => {
        setLoading(true); setError(null);
        try {
            const res = await reportsAPI.getInventory();
            setData(res.data.data);
        } catch (e) { setError(e.response?.data?.message || e.message); }
        finally { setLoading(false); }
    };

    const exportCsv = async () => {
        setExp(true);
        try {
            const res = await reportsAPI.exportInventory();
            downloadBlob(res.data, `inventory_report_${Date.now()}.csv`);
        } catch (e) { setError('Export failed.'); }
        finally { setExp(false); }
    };

    const COLS = [
        { key: 'device_name',     label: 'Device' },
        { key: 'model',           label: 'Model' },
        { key: 'manufacturer',    label: 'Manufacturer' },
        { key: 'plan_name',       label: 'Plan' },
        { key: 'monthly_cost',    label: 'Monthly Cost', render: v => v ? `R ${Number(v).toFixed(2)}` : '—' },
        { key: 'stock_quantity',  label: 'In Stock' },
        { key: 'status',          label: 'Status', render: v => <Chip label={v} size="small" color={v === 'active' ? 'success' : 'default'} sx={{ fontSize: '0.7rem', fontWeight: 700 }} /> },
    ];

    return (
        <Box>
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <Button variant="contained" onClick={load} disabled={loading} startIcon={loading ? <CircularProgress size={16} /> : <RefreshIcon />}
                    sx={{ bgcolor: T.accent, '&:hover': { bgcolor: T.accentMid }, borderRadius: '8px', textTransform: 'none', fontWeight: 700 }}>
                    {loading ? 'Loading…' : 'Generate Report'}
                </Button>
                <Button variant="outlined" onClick={exportCsv} disabled={exporting || !data} startIcon={<DownloadIcon />}
                    sx={{ borderColor: T.accent, color: T.accent, borderRadius: '8px', textTransform: 'none', fontWeight: 700 }}>
                    {exporting ? 'Exporting…' : 'Export CSV'}
                </Button>
            </Box>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {data && <DataTable columns={COLS} rows={data.rows} />}
        </Box>
    );
}

// ── SLA tab ───────────────────────────────────────────────────────────────────
function SlaReport() {
    const [data, setData]       = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState(null);
    const [exporting, setExp]   = useState(false);

    const load = async () => {
        setLoading(true); setError(null);
        try {
            const res = await reportsAPI.getSla();
            setData(res.data.data);
        } catch (e) { setError(e.response?.data?.message || e.message); }
        finally { setLoading(false); }
    };

    const exportCsv = async () => {
        setExp(true);
        try {
            const res = await reportsAPI.exportSla();
            downloadBlob(res.data, `sla_report_${Date.now()}.csv`);
        } catch (e) { setError('Export failed.'); }
        finally { setExp(false); }
    };

    const SLA_COLOR = { breached: T.rose, approaching: T.amber, within: T.green, met: T.green };

    const COLS = [
        { key: 'application_id',     label: 'App ID' },
        { key: 'first_name',         label: 'Applicant', render: (v, r) => `${r.first_name || ''} ${r.last_name || ''}`.trim() },
        { key: 'application_status', label: 'Stage' },
        { key: 'days_in_stage',      label: 'Days in Stage' },
        { key: 'sla_days',           label: 'SLA Days' },
        { key: 'sla_percent_used',   label: '% Used', render: (v, r) => r.sla_days && r.days_in_stage != null ? `${Math.round(r.days_in_stage / r.sla_days * 100)}%` : '—' },
        { key: 'sla_status',         label: 'Status', render: v => v ? <Chip label={v} size="small" sx={{ fontSize: '0.7rem', fontWeight: 700, bgcolor: SLA_COLOR[v] + '22', color: SLA_COLOR[v] }} /> : '—' },
    ];

    return (
        <Box>
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <Button variant="contained" onClick={load} disabled={loading} startIcon={loading ? <CircularProgress size={16} /> : <RefreshIcon />}
                    sx={{ bgcolor: T.accent, '&:hover': { bgcolor: T.accentMid }, borderRadius: '8px', textTransform: 'none', fontWeight: 700 }}>
                    {loading ? 'Loading…' : 'Generate Report'}
                </Button>
                <Button variant="outlined" onClick={exportCsv} disabled={exporting || !data} startIcon={<DownloadIcon />}
                    sx={{ borderColor: T.accent, color: T.accent, borderRadius: '8px', textTransform: 'none', fontWeight: 700 }}>
                    {exporting ? 'Exporting…' : 'Export CSV'}
                </Button>
            </Box>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {data && <DataTable columns={COLS} rows={data.rows} />}
        </Box>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────
const TABS = [
    { label: 'Applications', icon: <ReportIcon   fontSize="small" /> },
    { label: 'Users',        icon: <PeopleIcon    fontSize="small" /> },
    { label: 'Inventory',    icon: <InventoryIcon fontSize="small" /> },
    { label: 'SLA',          icon: <SlaIcon       fontSize="small" /> },
];

export default function ReportsPage() {
    const [tab, setTab] = useState(0);

    return (
        <Box sx={{ p: 3, bgcolor: T.bg, minHeight: '100vh' }}>
            {/* Header */}
            <Box sx={{ mb: 3 }}>
                <Typography sx={{ fontSize: '1.4rem', fontWeight: 800, color: T.text }}>Reports & Exports</Typography>
                <Typography sx={{ fontSize: '0.85rem', color: T.muted, mt: 0.3 }}>
                    Generate and download CSV reports for applications, users, inventory, and SLA compliance.
                </Typography>
            </Box>

            {/* Tabs */}
            <Card sx={{ border: `1px solid ${T.border}`, borderRadius: '14px', boxShadow: 'none' }}>
                <Box sx={{ borderBottom: `1px solid ${T.border}`, px: 2 }}>
                    <Tabs value={tab} onChange={(_, v) => setTab(v)}
                        TabIndicatorProps={{ style: { backgroundColor: T.accent, height: 3 } }}
                        sx={{ '& .MuiTab-root': { fontWeight: 700, fontSize: '0.82rem', textTransform: 'none', color: T.muted }, '& .Mui-selected': { color: T.accent } }}>
                        {TABS.map((t, i) => <Tab key={i} label={t.label} icon={t.icon} iconPosition="start" />)}
                    </Tabs>
                </Box>
                <Box sx={{ p: 3 }}>
                    <TabPanel value={tab} index={0}><ApplicationsReport /></TabPanel>
                    <TabPanel value={tab} index={1}><UsersReport /></TabPanel>
                    <TabPanel value={tab} index={2}><InventoryReport /></TabPanel>
                    <TabPanel value={tab} index={3}><SlaReport /></TabPanel>
                </Box>
            </Card>
        </Box>
    );
}
