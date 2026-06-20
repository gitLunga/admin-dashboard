import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Box, Typography, Grid, Paper, Chip, LinearProgress,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    CircularProgress, Avatar, Tooltip, IconButton, Select, MenuItem,
    FormControl, InputLabel,
} from '@mui/material';
import {
    Timer as TimerIcon,
    Warning as WarnIcon,
    CheckCircle as OkIcon,
    Error as BreachIcon,
    Refresh as RefreshIcon,
    TrendingUp as TrendIcon,
    Person as PersonIcon,
    PhoneAndroid as DeviceIcon,
    AccessTime as ClockIcon,
    Speed as SpeedIcon,
} from '@mui/icons-material';
import { slaAPI } from '../../services/api';

/* ── Design tokens ───────────────────────────────────────────────── */
const T = {
    bg:         '#F8F9FC',
    surface:    '#FFFFFF',
    border:     '#E8ECF4',
    text:       '#0F1F3D',
    muted:      '#6B7A99',
    accent:     '#1E4FD8',
    accentSoft: '#EBF0FF',
    green:      '#059669',
    greenSoft:  '#D1FAE5',
    amber:      '#D97706',
    amberSoft:  '#FEF3C7',
    rose:       '#DC2626',
    roseSoft:   '#FEE2E2',
    purple:     '#7C3AED',
    purpleSoft: '#EDE9FE',
};

/* ── SLA thresholds (mirrors slaConfig.js defaults) ─────────────── */
const SLA_CONFIG = {
    'Manager Review':   { days: 3,  color: T.purple, soft: T.purpleSoft },
    'Finance Review':   { days: 5,  color: T.accent, soft: T.accentSoft },
    'Order Placement':  { days: 2,  color: T.amber,  soft: T.amberSoft  },
};

/* ── Helpers ─────────────────────────────────────────────────────── */
function statusMeta(s) {
    if (s === 'breached')    return { color: T.rose,   soft: T.roseSoft,   dot: '#DC2626', label: 'Breached',    Icon: BreachIcon };
    if (s === 'approaching') return { color: T.amber,  soft: T.amberSoft,  dot: '#D97706', label: 'Approaching', Icon: WarnIcon   };
    return                          { color: T.green,  soft: T.greenSoft,  dot: '#059669', label: 'Within SLA',  Icon: OkIcon     };
}

function fmtDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' });
}

function Countdown({ daysInStage, slaDays, slaStatus }) {
    const daysLeft     = parseFloat((slaDays - daysInStage).toFixed(1));
    const isOverdue    = daysLeft < 0;
    const hoursLeft    = Math.abs(daysLeft * 24);
    const label        = hoursLeft < 24
        ? `${Math.round(hoursLeft)}h`
        : `${Math.abs(daysLeft).toFixed(1)}d`;

    const color = slaStatus === 'breached' ? T.rose : slaStatus === 'approaching' ? T.amber : T.green;
    const bg    = slaStatus === 'breached' ? T.roseSoft : slaStatus === 'approaching' ? T.amberSoft : T.greenSoft;

    return (
        <Box sx={{
            display: 'inline-flex', alignItems: 'center', gap: 0.5,
            px: 1.2, py: 0.4, borderRadius: '8px',
            bgcolor: bg, border: `1px solid ${color}28`,
        }}>
            <ClockIcon sx={{ fontSize: 11, color }} />
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color, fontFamily: 'JetBrains Mono, monospace' }}>
                {isOverdue ? `+${label} overdue` : `${label} left`}
            </Typography>
        </Box>
    );
}

function SlaBar({ pct, status }) {
    const color = status === 'breached' ? T.rose : status === 'approaching' ? T.amber : T.green;
    const clampedPct = Math.min(pct || 0, 100);
    return (
        <Box sx={{ width: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3 }}>
                <Typography sx={{ fontSize: '0.65rem', color: T.muted, fontFamily: 'JetBrains Mono, monospace' }}>
                    {clampedPct}% used
                </Typography>
                {pct > 100 && (
                    <Typography sx={{ fontSize: '0.65rem', color: T.rose, fontWeight: 700 }}>
                        {pct - 100}% over
                    </Typography>
                )}
            </Box>
            <Box sx={{ position: 'relative', height: 5, bgcolor: T.border, borderRadius: 4, overflow: 'hidden' }}>
                <Box sx={{
                    position: 'absolute', left: 0, top: 0, bottom: 0,
                    width: `${clampedPct}%`,
                    bgcolor: color,
                    borderRadius: 4,
                    transition: 'width 0.6s ease',
                }} />
            </Box>
        </Box>
    );
}

/* ── Summary stat card ───────────────────────────────────────────── */
function StatCard({ label, value, icon: Icon, color, soft, sub }) {
    return (
        <Paper elevation={0} sx={{
            p: 2.5, borderRadius: '14px',
            border: `1.5px solid ${color}28`,
            bgcolor: T.surface,
            animation: 'fadeUp 0.4s ease-out both',
        }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                <Box sx={{
                    width: 42, height: 42, borderRadius: '11px',
                    bgcolor: soft, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                    <Icon sx={{ fontSize: 20, color }} />
                </Box>
                <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: T.muted, mb: 0.3 }}>
                        {label}
                    </Typography>
                    <Typography sx={{ fontSize: '1.6rem', fontWeight: 800, color: T.text, lineHeight: 1.1 }}>
                        {value ?? '—'}
                    </Typography>
                    {sub && (
                        <Typography sx={{ fontSize: '0.69rem', color: T.muted, mt: 0.3 }}>
                            {sub}
                        </Typography>
                    )}
                </Box>
            </Box>
        </Paper>
    );
}

/* ── Per-stage breakdown card ────────────────────────────────────── */
function StageCard({ stage }) {
    const cfg        = SLA_CONFIG[stage.stage_name] || {};
    const total      = parseInt(stage.total || 0);
    const within     = parseInt(stage.within_sla || 0);
    const approaching = parseInt(stage.approaching_sla || 0);
    const breached   = parseInt(stage.breached_sla || 0);
    const compliancePct = total > 0 ? Math.round((within / total) * 100) : 100;

    return (
        <Paper elevation={0} sx={{
            p: 2.5, borderRadius: '14px',
            border: `1.5px solid ${cfg.color || T.border}28`,
            bgcolor: T.surface, height: '100%',
        }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box>
                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: T.text }}>
                        {stage.stage_name}
                    </Typography>
                    <Typography sx={{ fontSize: '0.68rem', color: T.muted, mt: 0.2 }}>
                        SLA: {cfg.days ?? stage.sla_threshold_days} days · {total} active
                    </Typography>
                </Box>
                <Box sx={{
                    px: 1.2, py: 0.4, borderRadius: '8px',
                    bgcolor: compliancePct >= 80 ? T.greenSoft : compliancePct >= 50 ? T.amberSoft : T.roseSoft,
                }}>
                    <Typography sx={{
                        fontSize: '0.78rem', fontWeight: 800,
                        color: compliancePct >= 80 ? T.green : compliancePct >= 50 ? T.amber : T.rose,
                    }}>
                        {compliancePct}%
                    </Typography>
                </Box>
            </Box>

            {/* Counts */}
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                {[
                    { label: 'Within', count: within,     color: T.green, soft: T.greenSoft },
                    { label: 'Approaching', count: approaching, color: T.amber, soft: T.amberSoft },
                    { label: 'Breached', count: breached,  color: T.rose,  soft: T.roseSoft  },
                ].map(({ label, count, color, soft }) => (
                    <Box key={label} sx={{
                        flex: 1, py: 1.2, borderRadius: '10px',
                        bgcolor: soft, textAlign: 'center',
                    }}>
                        <Typography sx={{ fontSize: '1.2rem', fontWeight: 800, color }}>{count}</Typography>
                        <Typography sx={{ fontSize: '0.62rem', fontWeight: 600, color, mt: 0.2 }}>{label}</Typography>
                    </Box>
                ))}
            </Box>

            {/* Avg / max days */}
            <Box sx={{ display: 'flex', gap: 2, pt: 1.5, borderTop: `1px solid ${T.border}` }}>
                <Box>
                    <Typography sx={{ fontSize: '0.62rem', color: T.muted, mb: 0.2 }}>Avg days</Typography>
                    <Typography sx={{ fontSize: '0.88rem', fontWeight: 700, color: T.text, fontFamily: 'JetBrains Mono, monospace' }}>
                        {parseFloat(stage.avg_days_in_stage || 0).toFixed(1)}
                    </Typography>
                </Box>
                <Box>
                    <Typography sx={{ fontSize: '0.62rem', color: T.muted, mb: 0.2 }}>Max days</Typography>
                    <Typography sx={{ fontSize: '0.88rem', fontWeight: 700,
                        color: parseFloat(stage.max_days_in_stage) > (cfg.days || 99) ? T.rose : T.text,
                        fontFamily: 'JetBrains Mono, monospace',
                    }}>
                        {parseFloat(stage.max_days_in_stage || 0).toFixed(1)}
                    </Typography>
                </Box>
                <Box>
                    <Typography sx={{ fontSize: '0.62rem', color: T.muted, mb: 0.2 }}>SLA cap</Typography>
                    <Typography sx={{ fontSize: '0.88rem', fontWeight: 700, color: cfg.color || T.muted, fontFamily: 'JetBrains Mono, monospace' }}>
                        {cfg.days ?? stage.sla_threshold_days}d
                    </Typography>
                </Box>
            </Box>
        </Paper>
    );
}

/* ── Application row ─────────────────────────────────────────────── */
function AppRow({ app, idx }) {
    const meta  = statusMeta(app.sla_status);
    const stageColor = (SLA_CONFIG[app.stage_name] || {}).color || T.accent;

    return (
        <TableRow sx={{
            animation: `fadeUp 0.35s ease-out ${idx * 0.04}s both`,
            '&:hover': { bgcolor: T.bg },
            borderBottom: `1px solid ${T.border}`,
        }}>
            {/* # */}
            <TableCell sx={{ py: 1.5, pl: 2, width: 56 }}>
                <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: T.muted, fontFamily: 'JetBrains Mono, monospace' }}>
                    #{app.application_id}
                </Typography>
            </TableCell>

            {/* Applicant */}
            <TableCell sx={{ py: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                    <Avatar sx={{ width: 30, height: 30, bgcolor: T.accentSoft, fontSize: '0.7rem', fontWeight: 700, color: T.accent }}>
                        {(app.applicant_first_name?.[0] || '') + (app.applicant_last_name?.[0] || '')}
                    </Avatar>
                    <Box>
                        <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: T.text }}>
                            {app.applicant_first_name} {app.applicant_last_name}
                        </Typography>
                        <Typography sx={{ fontSize: '0.67rem', color: T.muted }}>
                            {app.applicant_region || '—'}
                        </Typography>
                    </Box>
                </Box>
            </TableCell>

            {/* Device */}
            <TableCell sx={{ py: 1.5 }}>
                <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: T.text }}>
                    {app.device_name}
                </Typography>
                <Typography sx={{ fontSize: '0.67rem', color: T.muted }}>
                    R{parseFloat(app.monthly_cost || 0).toFixed(0)}/mo
                </Typography>
            </TableCell>

            {/* Stage */}
            <TableCell sx={{ py: 1.5 }}>
                <Box sx={{
                    display: 'inline-flex', alignItems: 'center', gap: 0.6,
                    px: 1, py: 0.35, borderRadius: '7px',
                    bgcolor: (SLA_CONFIG[app.stage_name] || {}).soft || T.accentSoft,
                }}>
                    <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: stageColor }} />
                    <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: stageColor }}>
                        {app.stage_name}
                    </Typography>
                </Box>
                <Typography sx={{ fontSize: '0.65rem', color: T.muted, mt: 0.4 }}>
                    Since {fmtDate(app.stage_entry_date)}
                </Typography>
            </TableCell>

            {/* Days in stage */}
            <TableCell sx={{ py: 1.5 }}>
                <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: T.text, fontFamily: 'JetBrains Mono, monospace' }}>
                    {parseFloat(app.days_in_stage || 0).toFixed(1)}d
                </Typography>
                <Typography sx={{ fontSize: '0.65rem', color: T.muted }}>
                    of {app.sla_days}d SLA
                </Typography>
            </TableCell>

            {/* Countdown */}
            <TableCell sx={{ py: 1.5 }}>
                <Countdown
                    daysInStage={parseFloat(app.days_in_stage || 0)}
                    slaDays={parseInt(app.sla_days || 3)}
                    slaStatus={app.sla_status}
                />
            </TableCell>

            {/* SLA bar */}
            <TableCell sx={{ py: 1.5, minWidth: 120 }}>
                <SlaBar pct={app.sla_percent_used} status={app.sla_status} />
            </TableCell>

            {/* Status */}
            <TableCell sx={{ py: 1.5 }}>
                <Box sx={{
                    display: 'inline-flex', alignItems: 'center', gap: 0.6,
                    px: 1.2, py: 0.4, borderRadius: '8px',
                    bgcolor: meta.soft, border: `1px solid ${meta.color}28`,
                }}>
                    <meta.Icon sx={{ fontSize: 12, color: meta.color }} />
                    <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: meta.color }}>
                        {meta.label}
                    </Typography>
                </Box>
            </TableCell>
        </TableRow>
    );
}

/* ── Main component ──────────────────────────────────────────────── */
export default function SLAMonitor() {
    const [dashboard,    setDashboard]   = useState(null);
    const [applications, setApplications] = useState([]);
    const [total,        setTotal]        = useState(0);
    const [slaFilter,    setSlaFilter]    = useState('');           // '' | 'breached' | 'approaching' | 'within'
    const [stageFilter,  setStageFilter]  = useState('');           // '' | 'Pending' | 'Pending_Finance' | 'Approved'
    const [loading,      setLoading]      = useState(true);
    const [appsLoading,  setAppsLoading]  = useState(false);
    const [lastRefresh,  setLastRefresh]  = useState(null);
    const timerRef = useRef(null);

    /* ── Fetch dashboard summary ── */
    const fetchDashboard = useCallback(async () => {
        try {
            const res = await slaAPI.getDashboard();
            setDashboard(res.data?.data || res.data);
        } catch (err) {
            console.error('SLA dashboard error:', err);
        }
    }, []);

    /* ── Fetch application list ── */
    const fetchApplications = useCallback(async () => {
        setAppsLoading(true);
        try {
            const params = new URLSearchParams();
            if (slaFilter)   params.set('sla_status',         slaFilter);
            if (stageFilter) params.set('application_status', stageFilter);
            params.set('limit', '100');
            const res = await slaAPI.getApplications(params.toString());
            const d   = res.data?.data || res.data;
            setApplications(d?.applications || []);
            setTotal(d?.total || 0);
        } catch (err) {
            console.error('SLA applications error:', err);
        } finally {
            setAppsLoading(false);
        }
    }, [slaFilter, stageFilter]);

    /* ── Initial load + refresh cycle ── */
    const refresh = useCallback(async () => {
        await Promise.all([fetchDashboard(), fetchApplications()]);
        setLastRefresh(new Date());
        setLoading(false);
    }, [fetchDashboard, fetchApplications]);

    useEffect(() => {
        refresh();
        timerRef.current = setInterval(refresh, 60_000);   // auto-refresh every 60s
        return () => clearInterval(timerRef.current);
    }, [refresh]);

    /* ── Overall stats ── */
    const overall = dashboard?.overall || {};
    const stages  = dashboard?.stages  || [];

    /* ── Filter tabs ── */
    const filterTabs = [
        { key: '',           label: `All (${total})` },
        { key: 'breached',   label: `Breached (${overall.breached ?? 0})`,   color: T.rose  },
        { key: 'approaching',label: `Approaching (${overall.approaching ?? 0})`, color: T.amber },
        { key: 'within',     label: `Within SLA (${overall.within ?? 0})`,   color: T.green },
    ];

    if (loading) {
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                <CircularProgress sx={{ color: T.accent }} />
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 2, sm: 3 }, bgcolor: T.bg, minHeight: '100vh' }}>

            {/* ── Page header ── */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3 }}>
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Box sx={{
                            width: 36, height: 36, borderRadius: '10px',
                            bgcolor: T.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <SpeedIcon sx={{ fontSize: 19, color: T.accent }} />
                        </Box>
                        <Typography sx={{ fontSize: '1.25rem', fontWeight: 800, color: T.text }}>
                            SLA Monitor
                        </Typography>
                    </Box>
                    <Typography sx={{ fontSize: '0.8rem', color: T.muted }}>
                        Real-time SLA tracking across all active application stages
                        {lastRefresh && ` · Last updated ${lastRefresh.toLocaleTimeString('en-ZA')}`}
                    </Typography>
                </Box>
                <Tooltip title="Refresh now">
                    <IconButton onClick={refresh} sx={{ bgcolor: T.surface, border: `1px solid ${T.border}`, '&:hover': { bgcolor: T.accentSoft } }}>
                        <RefreshIcon sx={{ fontSize: 18, color: T.accent }} />
                    </IconButton>
                </Tooltip>
            </Box>

            {/* ── SLA thresholds legend ── */}
            <Box sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
                {Object.entries(SLA_CONFIG).map(([name, cfg]) => (
                    <Box key={name} sx={{
                        display: 'flex', alignItems: 'center', gap: 0.8,
                        px: 1.5, py: 0.6, borderRadius: '8px',
                        bgcolor: cfg.soft, border: `1px solid ${cfg.color}28`,
                    }}>
                        <TimerIcon sx={{ fontSize: 13, color: cfg.color }} />
                        <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: cfg.color }}>
                            {name}: {cfg.days} day{cfg.days !== 1 ? 's' : ''} SLA
                        </Typography>
                    </Box>
                ))}
                <Box sx={{
                    display: 'flex', alignItems: 'center', gap: 0.8,
                    px: 1.5, py: 0.6, borderRadius: '8px',
                    bgcolor: T.amberSoft, border: `1px solid ${T.amber}28`,
                }}>
                    <WarnIcon sx={{ fontSize: 13, color: T.amber }} />
                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: T.amber }}>
                        Warning threshold: 80% elapsed
                    </Typography>
                </Box>
            </Box>

            {/* ── Summary stat cards ── */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6} sm={3}>
                    <StatCard
                        label="Active Applications"
                        value={overall.total ?? 0}
                        icon={TrendIcon}
                        color={T.accent}
                        soft={T.accentSoft}
                        sub="In workflow right now"
                    />
                </Grid>
                <Grid item xs={6} sm={3}>
                    <StatCard
                        label="Within SLA"
                        value={overall.within ?? 0}
                        icon={OkIcon}
                        color={T.green}
                        soft={T.greenSoft}
                        sub={`Compliance: ${overall.compliance_pct ?? 100}%`}
                    />
                </Grid>
                <Grid item xs={6} sm={3}>
                    <StatCard
                        label="Approaching Breach"
                        value={overall.approaching ?? 0}
                        icon={WarnIcon}
                        color={T.amber}
                        soft={T.amberSoft}
                        sub="Action needed soon"
                    />
                </Grid>
                <Grid item xs={6} sm={3}>
                    <StatCard
                        label="SLA Breached"
                        value={overall.breached ?? 0}
                        icon={BreachIcon}
                        color={T.rose}
                        soft={T.roseSoft}
                        sub="Escalation required"
                    />
                </Grid>
            </Grid>

            {/* ── Compliance bar ── */}
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: '14px', border: `1.5px solid ${T.border}`, bgcolor: T.surface, mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: T.text }}>
                        Overall Compliance
                    </Typography>
                    <Typography sx={{
                        fontSize: '1rem', fontWeight: 800,
                        color: (overall.compliance_pct ?? 100) >= 80 ? T.green : (overall.compliance_pct ?? 100) >= 50 ? T.amber : T.rose,
                        fontFamily: 'JetBrains Mono, monospace',
                    }}>
                        {overall.compliance_pct ?? 100}%
                    </Typography>
                </Box>
                <LinearProgress
                    variant="determinate"
                    value={overall.compliance_pct ?? 100}
                    sx={{
                        height: 8, borderRadius: 4,
                        bgcolor: T.border,
                        '& .MuiLinearProgress-bar': {
                            borderRadius: 4,
                            bgcolor: (overall.compliance_pct ?? 100) >= 80 ? T.green
                                   : (overall.compliance_pct ?? 100) >= 50 ? T.amber
                                   : T.rose,
                        },
                    }}
                />
                <Typography sx={{ fontSize: '0.69rem', color: T.muted, mt: 0.8 }}>
                    {overall.within ?? 0} of {overall.total ?? 0} active applications within their SLA deadline
                </Typography>
            </Paper>

            {/* ── Per-stage breakdown ── */}
            <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: T.muted, letterSpacing: 1, textTransform: 'uppercase', mb: 1.5 }}>
                Stage Breakdown
            </Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
                {stages.length === 0 ? (
                    <Grid item xs={12}>
                        <Paper elevation={0} sx={{ p: 3, borderRadius: '14px', border: `1px solid ${T.border}`, textAlign: 'center' }}>
                            <Typography sx={{ color: T.muted, fontSize: '0.82rem' }}>No active applications — all stages clear.</Typography>
                        </Paper>
                    </Grid>
                ) : (
                    stages.map(stage => (
                        <Grid item xs={12} sm={4} key={stage.application_status}>
                            <StageCard stage={stage} />
                        </Grid>
                    ))
                )}
            </Grid>

            {/* ── Application table ── */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, gap: 2, flexWrap: 'wrap' }}>
                <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: T.muted, letterSpacing: 1, textTransform: 'uppercase' }}>
                    Application Queue — {total} record{total !== 1 ? 's' : ''}
                </Typography>

                <Box sx={{ display: 'flex', gap: 1.5 }}>
                    {/* SLA status filter */}
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel sx={{ fontSize: '0.78rem' }}>SLA Status</InputLabel>
                        <Select
                            value={slaFilter}
                            label="SLA Status"
                            onChange={e => setSlaFilter(e.target.value)}
                            sx={{ fontSize: '0.78rem', bgcolor: T.surface }}
                        >
                            <MenuItem value="">All statuses</MenuItem>
                            <MenuItem value="breached">Breached</MenuItem>
                            <MenuItem value="approaching">Approaching</MenuItem>
                            <MenuItem value="within">Within SLA</MenuItem>
                        </Select>
                    </FormControl>

                    {/* Stage filter */}
                    <FormControl size="small" sx={{ minWidth: 155 }}>
                        <InputLabel sx={{ fontSize: '0.78rem' }}>Stage</InputLabel>
                        <Select
                            value={stageFilter}
                            label="Stage"
                            onChange={e => setStageFilter(e.target.value)}
                            sx={{ fontSize: '0.78rem', bgcolor: T.surface }}
                        >
                            <MenuItem value="">All stages</MenuItem>
                            <MenuItem value="Pending">Manager Review</MenuItem>
                            <MenuItem value="Pending_Finance">Finance Review</MenuItem>
                            <MenuItem value="Approved">Order Placement</MenuItem>
                        </Select>
                    </FormControl>
                </Box>
            </Box>

            <Paper elevation={0} sx={{ borderRadius: '14px', border: `1.5px solid ${T.border}`, bgcolor: T.surface, overflow: 'hidden' }}>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: T.bg }}>
                                {['#', 'Applicant', 'Device', 'Stage', 'Days in Stage', 'Countdown', 'SLA Usage', 'Status'].map(h => (
                                    <TableCell key={h} sx={{
                                        fontSize: '0.68rem', fontWeight: 700, color: T.muted,
                                        textTransform: 'uppercase', letterSpacing: 0.8,
                                        py: 1.5, pl: h === '#' ? 2 : undefined,
                                        borderBottom: `2px solid ${T.border}`,
                                    }}>
                                        {h}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {appsLoading ? (
                                <TableRow>
                                    <TableCell colSpan={8} sx={{ textAlign: 'center', py: 6 }}>
                                        <CircularProgress size={24} sx={{ color: T.accent }} />
                                    </TableCell>
                                </TableRow>
                            ) : applications.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} sx={{ textAlign: 'center', py: 6 }}>
                                        <OkIcon sx={{ fontSize: 40, color: T.green, mb: 1, display: 'block', mx: 'auto' }} />
                                        <Typography sx={{ fontWeight: 600, color: T.text, mb: 0.5 }}>All clear</Typography>
                                        <Typography sx={{ fontSize: '0.8rem', color: T.muted }}>
                                            No applications match the current filter.
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                applications.map((app, idx) => (
                                    <AppRow key={app.application_id} app={app} idx={idx} />
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Box>
    );
}
