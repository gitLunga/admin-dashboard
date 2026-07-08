import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Card, Grid, Chip, CircularProgress, Alert,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    LinearProgress,
} from '@mui/material';
import {
    People as PeopleIcon,
    Assignment as AppIcon,
    Speed as SlaIcon,
    Warning as WarningIcon,
} from '@mui/icons-material';
import { adminAPI, slaAPI, contractsAPI, budgetAPI } from '../../services/api';
import { T } from '../Layout/Sidebar';

// ── KPI card ──────────────────────────────────────────────────────────────────
function KpiCard({ icon, label, value, sub, color = T.accent, trend }) {
    return (
        <Card sx={{ border: `1px solid ${T.border}`, borderRadius: '14px', boxShadow: 'none', p: '20px', height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Box sx={{ p: '6px', borderRadius: '8px', bgcolor: color + '18', display: 'flex' }}>
                            {React.cloneElement(icon, { sx: { fontSize: 18, color } })}
                        </Box>
                        <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            {label}
                        </Typography>
                    </Box>
                    <Typography sx={{ fontSize: '2rem', fontWeight: 800, color: T.text, lineHeight: 1 }}>{value ?? '—'}</Typography>
                    {sub && <Typography sx={{ fontSize: '0.78rem', color: T.muted, mt: 0.6 }}>{sub}</Typography>}
                </Box>
                {trend != null && (
                    <Box sx={{ textAlign: 'right' }}>
                        <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: trend >= 0 ? T.green : T.rose }}>
                            {trend >= 0 ? '+' : ''}{trend}%
                        </Typography>
                    </Box>
                )}
            </Box>
        </Card>
    );
}

// ── Section header ────────────────────────────────────────────────────────────
function Section({ title, children }) {
    return (
        <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Box sx={{ width: 4, height: 18, borderRadius: 2, bgcolor: T.accent }} />
                <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: T.text }}>{title}</Typography>
            </Box>
            {children}
        </Box>
    );
}

export default function ExecutiveDashboard() {
    const [stats,     setStats]     = useState(null);
    const [sla,       setSla]       = useState(null);
    const [contracts, setContracts] = useState(null);
    const [budget,    setBudget]    = useState(null);
    const [loading,   setLoading]   = useState(true);
    const [error,     setError]     = useState(null);

    useEffect(() => {
        const load = async () => {
            setLoading(true); setError(null);
            try {
                const [statsRes, slaRes, contractRes] = await Promise.all([
                    adminAPI.getDashboardMetrics().catch(() => ({ data: { data: null } })),
                    slaAPI.getDashboard().catch(() => ({ data: { data: null } })),
                    contractsAPI.getSummary().catch(() => ({ data: { data: null } })),
                ]);

                setStats(statsRes.data.data);
                setSla(slaRes.data.data);
                setContracts(contractRes.data.data);

                // Budget spend (non-blocking)
                const yr = new Date().getFullYear();
                budgetAPI.spend(yr)
                    .then(res => setBudget(res.data.data))
                    .catch(() => {});
            } catch (e) { setError(e.response?.data?.message || 'Failed to load dashboard data. Please try again.'); }
            finally { setLoading(false); }
        };
        load();
    }, []);

    if (loading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
            <CircularProgress />
        </Box>
    );

    const slaOverall   = sla?.overall;
    const slaStages    = sla?.stages || [];
    const budgetDepts  = budget?.departments || [];
    const overBudget   = budget?.over_budget || 0;
    const nearLimit    = budget?.near_limit  || 0;

    return (
        <Box sx={{ p: 3, bgcolor: T.bg, minHeight: '100vh' }}>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                    <Typography sx={{ fontSize: '1.5rem', fontWeight: 900, color: T.text }}>Executive Dashboard</Typography>
                    <Chip label="Read Only" size="small" sx={{ fontSize: '0.68rem', fontWeight: 700, bgcolor: T.accentSoft, color: T.accent }} />
                </Box>
                <Typography sx={{ fontSize: '0.85rem', color: T.muted }}>
                    High-level overview of system health, SLA compliance, contract lifecycle, and departmental spend.
                    Last refreshed: {new Date().toLocaleTimeString('en-ZA')}.
                </Typography>
            </Box>

            {error && <Alert severity="warning" sx={{ mb: 3 }}>Some data could not be loaded: {error}</Alert>}

            {/* ── KPI row ── */}
            <Section title="Key Performance Indicators">
                <Grid container spacing={2}>
                    <Grid item xs={6} sm={3}>
                        <KpiCard icon={<PeopleIcon />} label="Total Client Users"
                            value={stats?.total_users ?? stats?.client_users ?? '—'}
                            sub="Advocates & Magistrates" color={T.accent} />
                    </Grid>
                    <Grid item xs={6} sm={3}>
                        <KpiCard icon={<AppIcon />} label="Active Applications"
                            value={stats?.pending_applications ?? '—'}
                            sub="Pending + Finance review" color="#7C3AED" />
                    </Grid>
                    <Grid item xs={6} sm={3}>
                        <KpiCard icon={<SlaIcon />} label="SLA Compliance"
                            value={slaOverall ? `${slaOverall.compliance_pct}%` : '—'}
                            sub={slaOverall ? `${slaOverall.breached} breached` : undefined}
                            color={slaOverall?.compliance_pct >= 80 ? T.green : T.rose} />
                    </Grid>
                    <Grid item xs={6} sm={3}>
                        <KpiCard icon={<WarningIcon />} label="Contracts Expiring"
                            value={contracts?.expiring_30 ?? '—'}
                            sub="Within 30 days" color={contracts?.expiring_30 > 0 ? T.rose : T.green} />
                    </Grid>
                </Grid>
            </Section>

            {/* ── SLA breakdown ── */}
            <Section title="SLA Status by Stage">
                {slaStages.length === 0 ? (
                    <Typography sx={{ color: T.muted, fontSize: '0.85rem' }}>No active applications in SLA tracking.</Typography>
                ) : (
                    <Grid container spacing={2}>
                        {slaStages.map(stage => {
                            const total = parseInt(stage.total) || 1;
                            const withinPct = Math.round((parseInt(stage.within_sla) / total) * 100);
                            return (
                                <Grid item xs={12} sm={4} key={stage.application_status}>
                                    <Card sx={{ border: `1px solid ${T.border}`, borderRadius: '12px', boxShadow: 'none', p: 2 }}>
                                        <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: T.text, mb: 1 }}>{stage.stage_name}</Typography>
                                        <Grid container spacing={1}>
                                            <Grid item xs={4}>
                                                <Typography sx={{ fontSize: '0.68rem', color: T.muted }}>Total</Typography>
                                                <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: T.text }}>{stage.total}</Typography>
                                            </Grid>
                                            <Grid item xs={4}>
                                                <Typography sx={{ fontSize: '0.68rem', color: T.amber }}>Approaching</Typography>
                                                <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: T.amber }}>{stage.approaching_sla}</Typography>
                                            </Grid>
                                            <Grid item xs={4}>
                                                <Typography sx={{ fontSize: '0.68rem', color: T.rose }}>Breached</Typography>
                                                <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: T.rose }}>{stage.breached_sla}</Typography>
                                            </Grid>
                                        </Grid>
                                        <Box sx={{ mt: 1.5 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                                <Typography sx={{ fontSize: '0.72rem', color: T.muted }}>Compliance</Typography>
                                                <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: withinPct >= 80 ? T.green : T.rose }}>{withinPct}%</Typography>
                                            </Box>
                                            <LinearProgress variant="determinate" value={withinPct}
                                                sx={{ height: 6, borderRadius: 3, bgcolor: T.border,
                                                      '& .MuiLinearProgress-bar': { bgcolor: withinPct >= 80 ? T.green : T.rose } }} />
                                        </Box>
                                        <Typography sx={{ fontSize: '0.72rem', color: T.muted, mt: 1 }}>
                                            Avg {stage.avg_days_in_stage} days in stage · SLA: {stage.sla_threshold_days} days
                                        </Typography>
                                    </Card>
                                </Grid>
                            );
                        })}
                    </Grid>
                )}
            </Section>

            {/* ── Contract lifecycle ── */}
            <Section title="Contract Lifecycle">
                <Grid container spacing={2}>
                    {[
                        { label: 'Total Contracts',       value: contracts?.total,        color: T.accent },
                        { label: 'Active',                value: contracts?.active,        color: T.green  },
                        { label: 'Expiring 30 days',      value: contracts?.expiring_30,   color: T.rose   },
                        { label: 'Expiring 60 days',      value: contracts?.expiring_60,   color: T.amber  },
                        { label: 'Expiring 90 days',      value: contracts?.expiring_90,   color: T.amber  },
                        { label: 'Expired',               value: contracts?.expired,       color: T.muted  },
                    ].map(item => (
                        <Grid item xs={6} sm={2} key={item.label}>
                            <Card sx={{ border: `1px solid ${T.border}`, borderRadius: '12px', boxShadow: 'none', p: '14px' }}>
                                <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</Typography>
                                <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, color: item.color, mt: 0.3 }}>{item.value ?? '—'}</Typography>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Section>

            {/* ── Budget overview ── */}
            {budgetDepts.length > 0 && (
                <Section title={`Departmental Spend — FY ${budget?.fiscal_year}`}>
                    {(overBudget > 0 || nearLimit > 0) && (
                        <Alert severity={overBudget > 0 ? 'error' : 'warning'} sx={{ mb: 2 }}>
                            {overBudget > 0 && <span><strong>{overBudget} department{overBudget > 1 ? 's' : ''}</strong> are over budget. </span>}
                            {nearLimit > 0 && <span><strong>{nearLimit} department{nearLimit > 1 ? 's' : ''}</strong> are nearing their monthly ceiling.</span>}
                        </Alert>
                    )}
                    <Card sx={{ border: `1px solid ${T.border}`, borderRadius: '14px', boxShadow: 'none' }}>
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        {['Department','Contracts','Monthly Spend','Ceiling','Utilisation'].map(h => (
                                            <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', color: T.muted, bgcolor: T.bg }}>{h}</TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {budgetDepts.slice(0, 10).map(d => {
                                        const c = d.status === 'over' ? T.rose : d.status === 'warning' ? T.amber : T.green;
                                        return (
                                            <TableRow key={d.department_id} hover sx={{ '&:last-child td': { border: 0 } }}>
                                                <TableCell sx={{ fontSize: '0.8rem', fontWeight: 600 }}>
                                                    {d.status === 'over' && <WarningIcon sx={{ fontSize: 14, color: T.rose, mr: 0.5, verticalAlign: 'middle' }} />}
                                                    {d.department_id}
                                                </TableCell>
                                                <TableCell sx={{ fontSize: '0.8rem', textAlign: 'center' }}>{d.active_contracts}</TableCell>
                                                <TableCell sx={{ fontSize: '0.8rem', fontWeight: 700 }}>R {Number(d.monthly_spend).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</TableCell>
                                                <TableCell sx={{ fontSize: '0.8rem', color: T.muted }}>
                                                    {d.monthly_ceiling ? `R ${Number(d.monthly_ceiling).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}` : '—'}
                                                </TableCell>
                                                <TableCell sx={{ minWidth: 140 }}>
                                                    {d.utilisation_pct != null ? (
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <LinearProgress variant="determinate" value={Math.min(d.utilisation_pct, 100)}
                                                                sx={{ flex: 1, height: 6, borderRadius: 3, bgcolor: c + '22',
                                                                      '& .MuiLinearProgress-bar': { bgcolor: c } }} />
                                                            <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: c, minWidth: 34 }}>{d.utilisation_pct}%</Typography>
                                                        </Box>
                                                    ) : <Typography sx={{ fontSize: '0.75rem', color: T.muted }}>No ceiling set</Typography>}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Card>
                </Section>
            )}
        </Box>
    );
}
