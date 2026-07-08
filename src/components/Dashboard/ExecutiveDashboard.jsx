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
    Devices as DevicesIcon,
    AssignmentReturn as ReturnIcon,
    TrendingUp as TrendIcon,
    CheckCircle as ActiveIcon,
    Schedule as PendingIcon,
    AttachMoney as MoneyIcon,
    Description as ContractIcon,
    Today as TodayIcon,
    Refresh as RefreshIcon,
} from '@mui/icons-material';
import { adminAPI, slaAPI, contractsAPI, budgetAPI, returnsAPI } from '../../services/api';
import { T } from '../Layout/Sidebar';

// ── KPI card (large) ──────────────────────────────────────────────────────────
function KpiCard({ icon, label, value, sub, color = T.accent, trend, alert }) {
    return (
        <Card sx={{ border: `1px solid ${alert ? color + '60' : T.border}`, borderRadius: '14px', boxShadow: 'none', p: '20px', height: '100%', bgcolor: alert ? color + '06' : T.surface }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                        <Box sx={{ p: '7px', borderRadius: '9px', bgcolor: color + '18', display: 'flex', flexShrink: 0 }}>
                            {React.cloneElement(icon, { sx: { fontSize: 18, color } })}
                        </Box>
                        <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                            {label}
                        </Typography>
                    </Box>
                    <Typography sx={{ fontSize: '2.1rem', fontWeight: 800, color: T.text, lineHeight: 1 }}>{value ?? '—'}</Typography>
                    {sub && <Typography sx={{ fontSize: '0.78rem', color: T.muted, mt: 0.7 }}>{sub}</Typography>}
                </Box>
                {trend != null && (
                    <Chip label={`${trend >= 0 ? '+' : ''}${trend}%`} size="small"
                        sx={{ bgcolor: trend >= 0 ? T.greenSoft : T.roseSoft, color: trend >= 0 ? T.green : T.rose,
                              fontWeight: 700, fontSize: '0.72rem', height: 24, mt: 0.5 }} />
                )}
            </Box>
        </Card>
    );
}

// ── Pulse card (small, "today") ───────────────────────────────────────────────
function PulseCard({ icon, label, value, sub, color = T.accent }) {
    return (
        <Card sx={{ border: `1px solid ${T.border}`, borderRadius: '12px', boxShadow: 'none', p: '16px', height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ p: '8px', borderRadius: '9px', bgcolor: color + '15', flexShrink: 0 }}>
                    {React.cloneElement(icon, { sx: { fontSize: 20, color } })}
                </Box>
                <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, color: T.text, lineHeight: 1 }}>{value ?? '—'}</Typography>
                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.05em', mt: 0.3 }}>{label}</Typography>
                    {sub && <Typography sx={{ fontSize: '0.72rem', color: T.muted, mt: 0.2 }}>{sub}</Typography>}
                </Box>
            </Box>
        </Card>
    );
}

// ── Section header ────────────────────────────────────────────────────────────
function Section({ title, sub, children }) {
    return (
        <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: sub ? 0.5 : 2 }}>
                <Box sx={{ width: 4, height: 18, borderRadius: 2, bgcolor: T.accent, flexShrink: 0 }} />
                <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: T.text }}>{title}</Typography>
            </Box>
            {sub && <Typography sx={{ fontSize: '0.78rem', color: T.muted, mb: 2, ml: '20px' }}>{sub}</Typography>}
            {children}
        </Box>
    );
}

// ── Application status config ─────────────────────────────────────────────────
const APP_STATUS = {
    Pending:           { color: T.amber,  label: 'Pending Review'  },
    'Manager Approved':{ color: '#7C3AED', label: 'Manager Approved'},
    'Finance Approved':{ color: '#0891B2', label: 'Finance Approved'},
    Approved:          { color: T.green,  label: 'Approved'        },
    Rejected:          { color: T.rose,   label: 'Rejected'        },
    Cancelled:         { color: T.muted,  label: 'Cancelled'       },
};

export default function ExecutiveDashboard() {
    const [metrics,  setMetrics]  = useState(null);
    const [enhanced, setEnhanced] = useState(null);
    const [sla,      setSla]      = useState(null);
    const [contracts,setContracts]= useState(null);
    const [budget,   setBudget]   = useState(null);
    const [returns,  setReturns]  = useState([]);
    const [loading,  setLoading]  = useState(true);
    const [error,    setError]    = useState(null);

    const load = async () => {
        setLoading(true); setError(null);
        try {
            const [metricsRes, enhancedRes, slaRes, contractRes] = await Promise.all([
                adminAPI.getDashboardMetrics().catch(() => null),
                adminAPI.getEnhancedStatistics().catch(() => null),
                slaAPI.getDashboard().catch(() => null),
                contractsAPI.getSummary().catch(() => null),
            ]);

            setMetrics(metricsRes?.data?.data ?? null);
            setEnhanced(enhancedRes?.data ?? null);
            setSla(slaRes?.data?.data ?? null);
            setContracts(contractRes?.data?.data ?? null);

            const yr = new Date().getFullYear();
            budgetAPI.spend(yr).then(r => setBudget(r.data.data)).catch(() => {});
            returnsAPI.summary().then(r => setReturns(r.data.data || [])).catch(() => {});
        } catch (e) {
            setError(e.response?.data?.message || 'Some data could not be loaded.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    if (loading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
            <CircularProgress />
        </Box>
    );

    // ── Derived values ──────────────────────────────────────────────────────
    const slaOverall   = sla?.overall;
    const slaStages    = sla?.stages || [];
    const budgetDepts  = budget?.departments || [];
    const overBudget   = budget?.over_budget || 0;
    const nearLimit    = budget?.near_limit  || 0;

    const appStats     = enhanced?.application_stats || {};
    const deviceStats  = enhanced?.device_stats      || {};
    const appByStatus  = (appStats.by_status || []).filter(s => s.status);
    const totalApps    = appStats.total || metrics?.total_applications || 0;

    // Open returns = anything not Completed or Cancelled
    const openReturns  = returns
        .filter(r => !['Completed','Cancelled'].includes(r.return_status))
        .reduce((s, r) => s + parseInt(r.total || 0), 0);

    const fulfilmentRate = metrics?.contract_fulfilment_rate;
    const slaCompliance  = slaOverall?.compliance_pct;

    return (
        <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: T.bg, minHeight: '100vh' }}>

            {/* ── Header ── */}
            <Box sx={{ mb: 3.5, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                        <Typography sx={{ fontSize: '1.5rem', fontWeight: 900, color: T.text }}>Executive Dashboard</Typography>
                        <Chip label="Live" size="small" sx={{ fontSize: '0.68rem', fontWeight: 700, bgcolor: T.greenSoft, color: T.green }} />
                    </Box>
                    <Typography sx={{ fontSize: '0.83rem', color: T.muted }}>
                        System-wide operational health — applications, contracts, SLA, devices, budget &amp; returns.
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: T.muted }}>
                    <RefreshIcon sx={{ fontSize: 15 }} />
                    <Typography sx={{ fontSize: '0.75rem', color: T.muted }}>
                        {new Date().toLocaleTimeString('en-ZA')}
                    </Typography>
                </Box>
            </Box>

            {error && <Alert severity="warning" sx={{ mb: 3, borderRadius: '10px' }}>Some data could not be loaded: {error}</Alert>}

            {/* ── Section 1: Core KPIs ── */}
            <Section title="Key Performance Indicators">
                <Grid container spacing={2}>
                    <Grid item xs={6} md={3}>
                        <KpiCard icon={<AppIcon />} label="Total Applications"
                            value={totalApps || '—'}
                            sub={fulfilmentRate != null ? `${fulfilmentRate}% fulfilment rate` : undefined}
                            color="#7C3AED" />
                    </Grid>
                    <Grid item xs={6} md={3}>
                        <KpiCard icon={<SlaIcon />} label="SLA Compliance"
                            value={slaCompliance != null ? `${slaCompliance}%` : '—'}
                            sub={slaOverall ? `${slaOverall.breached ?? 0} stage${slaOverall.breached !== 1 ? 's' : ''} breached` : undefined}
                            color={slaCompliance >= 80 ? T.green : slaCompliance >= 60 ? T.amber : T.rose}
                            alert={slaCompliance != null && slaCompliance < 80} />
                    </Grid>
                    <Grid item xs={6} md={3}>
                        <KpiCard icon={<ContractIcon />} label="Contracts Expiring"
                            value={contracts?.expiring_30 ?? '—'}
                            sub="Within the next 30 days"
                            color={contracts?.expiring_30 > 5 ? T.rose : contracts?.expiring_30 > 0 ? T.amber : T.green}
                            alert={contracts?.expiring_30 > 0} />
                    </Grid>
                    <Grid item xs={6} md={3}>
                        <KpiCard icon={<PendingIcon />} label="Pending Verifications"
                            value={metrics?.pending_approvals ?? '—'}
                            sub={metrics?.avg_verification_days != null ? `Avg ${metrics.avg_verification_days} days to verify` : undefined}
                            color={T.amber}
                            alert={metrics?.pending_approvals > 10} />
                    </Grid>
                </Grid>
            </Section>

            {/* ── Section 2: Today's Pulse ── */}
            <Section title="Today's Pulse" sub="Live counts for the current day">
                <Grid container spacing={2}>
                    <Grid item xs={6} sm={3}>
                        <PulseCard icon={<TodayIcon />} label="Registrations Today"
                            value={metrics?.todays_registrations ?? 0}
                            sub={metrics?.daily_growth != null ? `${metrics.daily_growth >= 0 ? '+' : ''}${metrics.daily_growth}% vs yesterday` : undefined}
                            color={T.accent} />
                    </Grid>
                    <Grid item xs={6} sm={3}>
                        <PulseCard icon={<AppIcon />} label="Applications Today"
                            value={metrics?.todays_applications ?? 0}
                            color="#7C3AED" />
                    </Grid>
                    <Grid item xs={6} sm={3}>
                        <PulseCard icon={<ActiveIcon />} label="Active Contracts"
                            value={contracts?.active ?? metrics?.active_contracts ?? '—'}
                            sub="Devices currently deployed"
                            color={T.green} />
                    </Grid>
                    <Grid item xs={6} sm={3}>
                        <PulseCard icon={<ReturnIcon />} label="Open Returns"
                            value={openReturns}
                            sub="Awaiting collection / assessment"
                            color={openReturns > 0 ? T.rose : T.green} />
                    </Grid>
                </Grid>
            </Section>

            {/* ── Section 3: Application Pipeline ── */}
            {appByStatus.length > 0 && (
                <Section title="Application Pipeline" sub="Current count per workflow stage">
                    <Grid container spacing={1.5}>
                        {appByStatus.map(s => {
                            const meta   = APP_STATUS[s.status] || { color: T.muted, label: s.status };
                            const count  = parseInt(s.count || 0);
                            const pct    = totalApps > 0 ? Math.round((count / totalApps) * 100) : 0;
                            return (
                                <Grid item xs={6} sm={4} md={2} key={s.status}>
                                    <Card sx={{ border: `1px solid ${T.border}`, borderRadius: '12px', boxShadow: 'none', p: '14px' }}>
                                        <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: meta.color, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.8 }}>
                                            {meta.label}
                                        </Typography>
                                        <Typography sx={{ fontSize: '1.6rem', fontWeight: 800, color: T.text, lineHeight: 1 }}>{count}</Typography>
                                        <Box sx={{ mt: 1 }}>
                                            <LinearProgress variant="determinate" value={pct}
                                                sx={{ height: 4, borderRadius: 2, bgcolor: meta.color + '22',
                                                      '& .MuiLinearProgress-bar': { bgcolor: meta.color } }} />
                                            <Typography sx={{ fontSize: '0.68rem', color: T.muted, mt: 0.4 }}>{pct}% of total</Typography>
                                        </Box>
                                    </Card>
                                </Grid>
                            );
                        })}
                    </Grid>
                </Section>
            )}

            {/* ── Section 4: Device Catalogue Health ── */}
            {(deviceStats.total > 0 || deviceStats.total === 0) && (
                <Section title="Device Catalogue" sub="Inventory status across all device models">
                    <Grid container spacing={2}>
                        {[
                            { label: 'Total Models',    value: deviceStats.total,    color: T.accent, icon: <DevicesIcon /> },
                            { label: 'Active',          value: deviceStats.active,   color: T.green,  icon: <ActiveIcon />  },
                            { label: 'Inactive',        value: deviceStats.inactive, color: T.muted,  icon: <PendingIcon /> },
                            { label: 'Discontinued',    value: deviceStats.discontinued, color: T.rose, icon: <WarningIcon /> },
                        ].map(item => (
                            <Grid item xs={6} sm={3} key={item.label}>
                                <Card sx={{ border: `1px solid ${T.border}`, borderRadius: '12px', boxShadow: 'none', p: '16px' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                        <Box sx={{ p: '5px', borderRadius: '7px', bgcolor: item.color + '18', display: 'flex' }}>
                                            {React.cloneElement(item.icon, { sx: { fontSize: 15, color: item.color } })}
                                        </Box>
                                        <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            {item.label}
                                        </Typography>
                                    </Box>
                                    <Typography sx={{ fontSize: '1.6rem', fontWeight: 800, color: item.color }}>{item.value ?? '—'}</Typography>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                    {(deviceStats.avg_monthly_cost > 0) && (
                        <Box sx={{ mt: 1.5, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                            <Chip icon={<MoneyIcon sx={{ fontSize: '14px !important' }} />}
                                label={`Avg monthly cost: R ${Number(deviceStats.avg_monthly_cost).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`}
                                size="small" sx={{ bgcolor: T.accentSoft, color: T.accent, fontWeight: 700, fontSize: '0.75rem' }} />
                            {deviceStats.min_cost > 0 && (
                                <Chip label={`Range: R ${Number(deviceStats.min_cost).toLocaleString('en-ZA')} – R ${Number(deviceStats.max_cost).toLocaleString('en-ZA')} / month`}
                                    size="small" sx={{ bgcolor: T.bg, color: T.muted, fontWeight: 600, fontSize: '0.75rem', border: `1px solid ${T.border}` }} />
                            )}
                        </Box>
                    )}
                </Section>
            )}

            {/* ── Section 5: SLA by Stage ── */}
            <Section title="SLA Status by Stage">
                {slaStages.length === 0 ? (
                    <Card sx={{ border: `1px solid ${T.border}`, borderRadius: '12px', boxShadow: 'none', p: 3, textAlign: 'center' }}>
                        <Typography sx={{ color: T.muted, fontSize: '0.85rem' }}>No active applications in SLA tracking.</Typography>
                    </Card>
                ) : (
                    <Grid container spacing={2}>
                        {slaStages.map(stage => {
                            const total     = parseInt(stage.total) || 1;
                            const withinPct = Math.round((parseInt(stage.within_sla) / total) * 100);
                            const c         = withinPct >= 80 ? T.green : withinPct >= 60 ? T.amber : T.rose;
                            return (
                                <Grid item xs={12} sm={4} key={stage.application_status}>
                                    <Card sx={{ border: `1px solid ${T.border}`, borderRadius: '12px', boxShadow: 'none', p: 2 }}>
                                        <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: T.text, mb: 1.5 }}>{stage.stage_name}</Typography>
                                        <Grid container spacing={1} sx={{ mb: 1.5 }}>
                                            {[
                                                { label: 'Total',       value: stage.total,           color: T.text  },
                                                { label: 'Approaching', value: stage.approaching_sla, color: T.amber },
                                                { label: 'Breached',    value: stage.breached_sla,    color: T.rose  },
                                            ].map(s => (
                                                <Grid item xs={4} key={s.label}>
                                                    <Typography sx={{ fontSize: '0.65rem', color: s.color === T.text ? T.muted : s.color, fontWeight: 600 }}>{s.label}</Typography>
                                                    <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: s.color }}>{s.value}</Typography>
                                                </Grid>
                                            ))}
                                        </Grid>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                            <Typography sx={{ fontSize: '0.72rem', color: T.muted }}>Compliance</Typography>
                                            <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: c }}>{withinPct}%</Typography>
                                        </Box>
                                        <LinearProgress variant="determinate" value={withinPct}
                                            sx={{ height: 6, borderRadius: 3, bgcolor: T.border,
                                                  '& .MuiLinearProgress-bar': { bgcolor: c } }} />
                                        <Typography sx={{ fontSize: '0.7rem', color: T.muted, mt: 0.8 }}>
                                            Avg {stage.avg_days_in_stage} days in stage · SLA: {stage.sla_threshold_days} days
                                        </Typography>
                                    </Card>
                                </Grid>
                            );
                        })}
                    </Grid>
                )}
            </Section>

            {/* ── Section 6: Contract Lifecycle ── */}
            <Section title="Contract Lifecycle">
                <Grid container spacing={2}>
                    {[
                        { label: 'Total Contracts',  value: contracts?.total,       color: T.accent },
                        { label: 'Active',           value: contracts?.active,       color: T.green  },
                        { label: 'Expiring 30 days', value: contracts?.expiring_30,  color: T.rose   },
                        { label: 'Expiring 60 days', value: contracts?.expiring_60,  color: T.amber  },
                        { label: 'Expiring 90 days', value: contracts?.expiring_90,  color: T.amber  },
                        { label: 'Expired',          value: contracts?.expired,      color: T.muted  },
                    ].map(item => (
                        <Grid item xs={6} sm={2} key={item.label}>
                            <Card sx={{ border: `1px solid ${T.border}`, borderRadius: '12px', boxShadow: 'none', p: '14px' }}>
                                <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</Typography>
                                <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, color: item.color, mt: 0.3 }}>{item.value ?? '—'}</Typography>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Section>

            {/* ── Section 7: Departmental Budget ── */}
            {budgetDepts.length > 0 && (
                <Section title={`Departmental Spend — FY ${budget?.fiscal_year}`}>
                    {(overBudget > 0 || nearLimit > 0) && (
                        <Alert severity={overBudget > 0 ? 'error' : 'warning'} sx={{ mb: 2, borderRadius: '10px' }}>
                            {overBudget > 0 && <span><strong>{overBudget} dept{overBudget > 1 ? 's' : ''}</strong> over budget. </span>}
                            {nearLimit  > 0 && <span><strong>{nearLimit} dept{nearLimit > 1 ? 's' : ''}</strong> nearing monthly ceiling.</span>}
                        </Alert>
                    )}
                    <Card sx={{ border: `1px solid ${T.border}`, borderRadius: '14px', boxShadow: 'none' }}>
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        {['Department','Contracts','Monthly Spend','Ceiling','Utilisation'].map(h => (
                                            <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.68rem', textTransform: 'uppercase', color: T.muted, bgcolor: T.bg, letterSpacing: '0.05em' }}>{h}</TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {budgetDepts.map(d => {
                                        const c = d.status === 'over' ? T.rose : d.status === 'warning' ? T.amber : T.green;
                                        return (
                                            <TableRow key={d.department_id} hover sx={{ '&:last-child td': { border: 0 } }}>
                                                <TableCell sx={{ fontSize: '0.8rem', fontWeight: 600 }}>
                                                    {d.status === 'over' && <WarningIcon sx={{ fontSize: 13, color: T.rose, mr: 0.5, verticalAlign: 'middle' }} />}
                                                    {d.department_id}
                                                </TableCell>
                                                <TableCell sx={{ fontSize: '0.8rem', textAlign: 'center' }}>{d.active_contracts}</TableCell>
                                                <TableCell sx={{ fontSize: '0.8rem', fontWeight: 700 }}>
                                                    R {Number(d.monthly_spend).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                                                </TableCell>
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
                                                    ) : (
                                                        <Typography sx={{ fontSize: '0.75rem', color: T.muted }}>No ceiling set</Typography>
                                                    )}
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
