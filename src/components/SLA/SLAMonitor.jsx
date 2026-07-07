import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Box, Typography, Grid, Paper, LinearProgress,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    CircularProgress, Avatar, Tooltip, IconButton, Select, MenuItem,
    FormControl, InputLabel, Drawer, Divider, Collapse,
} from '@mui/material';
import {
    Timer as TimerIcon,
    Warning as WarnIcon,
    CheckCircle as OkIcon,
    Error as BreachIcon,
    Refresh as RefreshIcon,
    TrendingUp as TrendIcon,
    AccessTime as ClockIcon,
    Speed as SpeedIcon,
    Close as CloseIcon,
    HelpOutline as HelpIcon,
    ExpandMore as ExpandIcon,
    ExpandLess as CollapseIcon,
    RadioButtonUnchecked as DotIcon,
    ArrowForward as ArrowIcon,
    Info as InfoIcon,
    OpenInNew as DetailIcon,
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
    'Manager Review':  { days: 3, color: T.purple, soft: T.purpleSoft },
    'Finance Review':  { days: 5, color: T.accent,  soft: T.accentSoft },
    'Order Placement': { days: 2, color: T.amber,   soft: T.amberSoft  },
};

/* ── How SLA works content ───────────────────────────────────────── */
const SLA_HELP = [
    {
        q: 'What is an SLA?',
        a: 'An SLA (Service Level Agreement) is a time limit set for each step of the device application process. It ensures applications are not left sitting unattended — every stage has a deadline so applicants get a decision within a reasonable time.',
    },
    {
        q: 'What are the 3 stages and their limits?',
        a: 'Stage 1 — Manager Review (3 days): After a client submits an application, the assigned Manager has 3 calendar days to approve or reject it.\n\nStage 2 — Finance Review (5 days): After the Manager approves, the Finance team has 5 days to check the budget and sign off.\n\nStage 3 — Order Placement (2 days): After Finance approves, the Admin has 2 days to place the device order with MTN.',
    },
    {
        q: 'What does "Approaching" mean?',
        a: 'When 80% of the SLA time has elapsed without action, the status turns Approaching (amber). For example, if the Manager SLA is 3 days, the application turns Approaching after 2.4 days. This is an early warning — action should be taken before a breach occurs.',
    },
    {
        q: 'What does "Breached" mean?',
        a: 'A breach means the SLA deadline has passed and no action was taken. The stage has been waiting longer than the allowed number of days. Breached applications show in red and should be treated as escalations — they represent delays that affect the applicant.',
    },
    {
        q: 'Why did an application breach?',
        a: 'Breaches happen when the responsible person (Manager, Finance, or Admin) did not act within the deadline. Click any application row to see its full stage-by-stage timeline, the exact days spent at each stage, and the breach reason with the number of days over the limit.',
    },
    {
        q: 'How is compliance % calculated?',
        a: 'Compliance = (Applications within SLA ÷ Total active applications) × 100. An application counts as "within SLA" only if it is currently in a stage where the deadline has not yet been reached. Breached and approaching applications both reduce your compliance score.',
    },
];

/* ── Helpers ─────────────────────────────────────────────────────── */
function statusMeta(s, isCompleted) {
    if (s === 'breached')    return { color: T.rose,  soft: T.roseSoft,  label: 'Breached',     Icon: BreachIcon };
    if (s === 'approaching') return { color: T.amber, soft: T.amberSoft, label: 'Approaching',  Icon: WarnIcon   };
    if (s === 'met')         return { color: T.green, soft: T.greenSoft, label: isCompleted ? 'Met SLA' : 'Within SLA', Icon: OkIcon };
    return                          { color: T.green, soft: T.greenSoft, label: 'Within SLA',   Icon: OkIcon     };
}

function fmtDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtDateTime(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function SlaBar({ pct, status, height = 5 }) {
    const color      = status === 'breached' ? T.rose : status === 'approaching' ? T.amber : T.green;
    const clampedPct = Math.min(pct || 0, 100);
    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.4 }}>
                <Typography sx={{ fontSize: '0.65rem', color: T.muted, fontFamily: 'JetBrains Mono, monospace' }}>
                    {Math.min(pct || 0, 999)}% used
                </Typography>
                {(pct || 0) > 100 && (
                    <Typography sx={{ fontSize: '0.65rem', color: T.rose, fontWeight: 700 }}>
                        {(pct - 100)}% over limit
                    </Typography>
                )}
            </Box>
            <Box sx={{ position: 'relative', height, bgcolor: T.border, borderRadius: 4, overflow: 'hidden' }}>
                <Box sx={{
                    position: 'absolute', left: 0, top: 0, bottom: 0,
                    width: `${clampedPct}%`, bgcolor: color, borderRadius: 4,
                    transition: 'width 0.7s ease',
                }} />
            </Box>
        </Box>
    );
}

/* ── Compact countdown badge ─────────────────────────────────────── */
function Countdown({ daysInStage, slaDays, slaStatus }) {
    const daysLeft  = parseFloat((slaDays - daysInStage).toFixed(1));
    const overdue   = daysLeft < 0;
    const hrs       = Math.abs(daysLeft * 24);
    const label     = hrs < 24 ? `${Math.round(hrs)}h` : `${Math.abs(daysLeft).toFixed(1)}d`;
    const color     = slaStatus === 'breached' ? T.rose : slaStatus === 'approaching' ? T.amber : T.green;
    const bg        = slaStatus === 'breached' ? T.roseSoft : slaStatus === 'approaching' ? T.amberSoft : T.greenSoft;
    return (
        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, px: 1.2, py: 0.4, borderRadius: '8px', bgcolor: bg }}>
            <ClockIcon sx={{ fontSize: 11, color }} />
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color, fontFamily: 'JetBrains Mono, monospace' }}>
                {overdue ? `+${label} overdue` : `${label} left`}
            </Typography>
        </Box>
    );
}

/* ── Stat card ───────────────────────────────────────────────────── */
function StatCard({ label, value, icon: Icon, color, soft, sub }) {
    return (
        <Paper elevation={0} sx={{ p: 2.5, borderRadius: '14px', border: `1.5px solid ${color}28`, bgcolor: T.surface }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                <Box sx={{ width: 42, height: 42, borderRadius: '11px', bgcolor: soft, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon sx={{ fontSize: 20, color }} />
                </Box>
                <Box>
                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: T.muted, mb: 0.3 }}>{label}</Typography>
                    <Typography sx={{ fontSize: '1.6rem', fontWeight: 800, color: T.text, lineHeight: 1.1 }}>{value ?? '—'}</Typography>
                    {sub && <Typography sx={{ fontSize: '0.69rem', color: T.muted, mt: 0.3 }}>{sub}</Typography>}
                </Box>
            </Box>
        </Paper>
    );
}

/* ── Stage breakdown card ────────────────────────────────────────── */
function StageCard({ stage }) {
    const cfg   = SLA_CONFIG[stage.stage_name] || {};
    const total = parseInt(stage.total || 0);
    const within = parseInt(stage.within_sla || 0);
    const comp  = total > 0 ? Math.round((within / total) * 100) : 100;
    return (
        <Paper elevation={0} sx={{ p: 2.5, borderRadius: '14px', border: `1.5px solid ${cfg.color || T.border}28`, bgcolor: T.surface, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box>
                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: T.text }}>{stage.stage_name}</Typography>
                    <Typography sx={{ fontSize: '0.68rem', color: T.muted, mt: 0.2 }}>SLA: {cfg.days ?? stage.sla_threshold_days} days · {total} active</Typography>
                </Box>
                <Box sx={{ px: 1.2, py: 0.4, borderRadius: '8px', bgcolor: comp >= 80 ? T.greenSoft : comp >= 50 ? T.amberSoft : T.roseSoft }}>
                    <Typography sx={{ fontSize: '0.78rem', fontWeight: 800, color: comp >= 80 ? T.green : comp >= 50 ? T.amber : T.rose }}>{comp}%</Typography>
                </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                {[
                    { label: 'Within',      count: within,                              color: T.green, soft: T.greenSoft },
                    { label: 'Approaching', count: parseInt(stage.approaching_sla || 0), color: T.amber, soft: T.amberSoft },
                    { label: 'Breached',    count: parseInt(stage.breached_sla   || 0), color: T.rose,  soft: T.roseSoft  },
                ].map(({ label, count, color, soft }) => (
                    <Box key={label} sx={{ flex: 1, py: 1.2, borderRadius: '10px', bgcolor: soft, textAlign: 'center' }}>
                        <Typography sx={{ fontSize: '1.2rem', fontWeight: 800, color }}>{count}</Typography>
                        <Typography sx={{ fontSize: '0.62rem', fontWeight: 600, color, mt: 0.2 }}>{label}</Typography>
                    </Box>
                ))}
            </Box>
            <Box sx={{ display: 'flex', gap: 2, pt: 1.5, borderTop: `1px solid ${T.border}` }}>
                {[
                    { label: 'Avg days', value: parseFloat(stage.avg_days_in_stage || 0).toFixed(1), color: T.text },
                    { label: 'Max days', value: parseFloat(stage.max_days_in_stage || 0).toFixed(1), color: parseFloat(stage.max_days_in_stage) > (cfg.days || 99) ? T.rose : T.text },
                    { label: 'SLA cap',  value: `${cfg.days ?? stage.sla_threshold_days}d`,          color: cfg.color || T.muted },
                ].map(({ label, value, color }) => (
                    <Box key={label}>
                        <Typography sx={{ fontSize: '0.62rem', color: T.muted, mb: 0.2 }}>{label}</Typography>
                        <Typography sx={{ fontSize: '0.88rem', fontWeight: 700, color, fontFamily: 'JetBrains Mono, monospace' }}>{value}</Typography>
                    </Box>
                ))}
            </Box>
        </Paper>
    );
}

/* ── Application table row ───────────────────────────────────────── */
function AppRow({ app, idx, onSelect }) {
    const meta       = statusMeta(app.sla_status);
    const stageColor = (SLA_CONFIG[app.stage_name] || {}).color || T.accent;
    return (
        <TableRow
            onClick={() => onSelect(app.application_id)}
            sx={{
                cursor: 'pointer',
                animation: `fadeUp 0.35s ease-out ${idx * 0.04}s both`,
                '&:hover': { bgcolor: T.accentSoft },
                borderBottom: `1px solid ${T.border}`,
            }}
        >
            <TableCell sx={{ py: 1.5, pl: 2, width: 56 }}>
                <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: T.muted, fontFamily: 'JetBrains Mono, monospace' }}>#{app.application_id}</Typography>
            </TableCell>
            <TableCell sx={{ py: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                    <Avatar sx={{ width: 30, height: 30, bgcolor: T.accentSoft, fontSize: '0.7rem', fontWeight: 700, color: T.accent }}>
                        {(app.applicant_first_name?.[0] || '') + (app.applicant_last_name?.[0] || '')}
                    </Avatar>
                    <Box>
                        <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: T.text }}>{app.applicant_first_name} {app.applicant_last_name}</Typography>
                        <Typography sx={{ fontSize: '0.67rem', color: T.muted }}>{app.applicant_region || '—'}</Typography>
                    </Box>
                </Box>
            </TableCell>
            <TableCell sx={{ py: 1.5 }}>
                <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: T.text }}>{app.device_name}</Typography>
                <Typography sx={{ fontSize: '0.67rem', color: T.muted }}>R{parseFloat(app.monthly_cost || 0).toFixed(0)}/mo</Typography>
            </TableCell>
            <TableCell sx={{ py: 1.5 }}>
                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.6, px: 1, py: 0.35, borderRadius: '7px', bgcolor: (SLA_CONFIG[app.stage_name] || {}).soft || T.accentSoft }}>
                    <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: stageColor }} />
                    <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: stageColor }}>{app.stage_name}</Typography>
                </Box>
                <Typography sx={{ fontSize: '0.65rem', color: T.muted, mt: 0.4 }}>Since {fmtDate(app.stage_entry_date)}</Typography>
            </TableCell>
            <TableCell sx={{ py: 1.5 }}>
                <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: T.text, fontFamily: 'JetBrains Mono, monospace' }}>{parseFloat(app.days_in_stage || 0).toFixed(1)}d</Typography>
                <Typography sx={{ fontSize: '0.65rem', color: T.muted }}>of {app.sla_days}d SLA</Typography>
            </TableCell>
            <TableCell sx={{ py: 1.5 }}>
                <Countdown daysInStage={parseFloat(app.days_in_stage || 0)} slaDays={parseInt(app.sla_days || 3)} slaStatus={app.sla_status} />
            </TableCell>
            <TableCell sx={{ py: 1.5, minWidth: 120 }}>
                <SlaBar pct={app.sla_percent_used} status={app.sla_status} />
            </TableCell>
            <TableCell sx={{ py: 1.5 }}>
                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.6, px: 1.2, py: 0.4, borderRadius: '8px', bgcolor: meta.soft }}>
                    <meta.Icon sx={{ fontSize: 12, color: meta.color }} />
                    <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: meta.color }}>{meta.label}</Typography>
                </Box>
            </TableCell>
        </TableRow>
    );
}

/* ── Stage timeline item (inside the detail drawer) ─────────────── */
function StageTimelineItem({ stage, isLast }) {
    const meta        = statusMeta(stage.sla_status, !!stage.completed_at);
    const cfg         = SLA_CONFIG[stage.stage] || {};
    const daysOver    = parseFloat((stage.days_taken - stage.sla_days).toFixed(1));
    const daysLeft    = parseFloat((stage.sla_days - stage.days_taken).toFixed(1));
    const isCompleted = !!stage.completed_at;
    const isBreached  = stage.sla_status === 'breached';
    const isApproach  = stage.sla_status === 'approaching';
    const pct         = Math.min(Math.round((stage.days_taken / stage.sla_days) * 100), 100);

    return (
        <Box sx={{ display: 'flex', gap: 1.5, pb: isLast ? 0 : 3 }}>
            {/* Connector line + icon */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: 28 }}>
                <Box sx={{
                    width: 28, height: 28, borderRadius: '50%',
                    bgcolor: isBreached ? T.roseSoft : isApproach ? T.amberSoft : T.greenSoft,
                    border: `2px solid ${meta.color}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                    <meta.Icon sx={{ fontSize: 14, color: meta.color }} />
                </Box>
                {!isLast && <Box sx={{ width: 2, flex: 1, mt: 0.5, bgcolor: T.border, borderRadius: 1 }} />}
            </Box>

            {/* Content */}
            <Box sx={{ flex: 1, pb: 0.5 }}>
                {/* Stage name + status */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.6 }}>
                    <Typography sx={{ fontSize: '0.84rem', fontWeight: 700, color: T.text }}>{stage.stage}</Typography>
                    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, px: 1, py: 0.3, borderRadius: '7px', bgcolor: meta.soft }}>
                        <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: meta.color }} />
                        <Typography sx={{ fontSize: '0.67rem', fontWeight: 700, color: meta.color }}>{meta.label}</Typography>
                    </Box>
                </Box>

                {/* Dates */}
                <Typography sx={{ fontSize: '0.72rem', color: T.muted, mb: 0.5 }}>
                    Started: {fmtDateTime(stage.started_at)}
                    {isCompleted && ` · Completed: ${fmtDateTime(stage.completed_at)}`}
                </Typography>

                {/* Approver */}
                {stage.approver && (
                    <Typography sx={{ fontSize: '0.72rem', color: T.muted, mb: 0.5 }}>
                        Actioned by: <strong style={{ color: T.text }}>{stage.approver}</strong> ({stage.status})
                    </Typography>
                )}
                {stage.notes && (
                    <Typography sx={{ fontSize: '0.72rem', color: T.muted, mb: 0.8, fontStyle: 'italic' }}>"{stage.notes}"</Typography>
                )}

                {/* SLA bar */}
                <Box sx={{ mb: 0.8 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.4 }}>
                        <Typography sx={{ fontSize: '0.68rem', color: T.muted }}>
                            {stage.days_taken.toFixed(1)} days {isCompleted ? 'taken' : 'elapsed'} of {stage.sla_days}-day SLA
                        </Typography>
                        <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace',
                            color: isBreached ? T.rose : isApproach ? T.amber : T.green }}>
                            {Math.round((stage.days_taken / stage.sla_days) * 100)}%
                        </Typography>
                    </Box>
                    <Box sx={{ position: 'relative', height: 6, bgcolor: T.border, borderRadius: 4, overflow: 'hidden' }}>
                        <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct}%`, bgcolor: meta.color, borderRadius: 4 }} />
                    </Box>
                </Box>

                {/* Breach / approach explanation */}
                {isBreached && (
                    <Box sx={{ mt: 0.8, p: 1.4, borderRadius: '10px', bgcolor: T.roseSoft, border: `1px solid ${T.rose}22` }}>
                        <Box sx={{ display: 'flex', gap: 0.8, alignItems: 'flex-start' }}>
                            <BreachIcon sx={{ fontSize: 14, color: T.rose, mt: 0.2, flexShrink: 0 }} />
                            <Typography sx={{ fontSize: '0.74rem', color: T.rose, fontWeight: 600, lineHeight: 1.5 }}>
                                {isCompleted
                                    ? `Completed in ${stage.days_taken.toFixed(1)} days — exceeded the ${stage.sla_days}-day SLA by ${daysOver.toFixed(1)} day${daysOver !== 1 ? 's' : ''}.`
                                    : `Still waiting — ${stage.days_taken.toFixed(1)} days elapsed with no action. SLA of ${stage.sla_days} days was breached ${daysOver.toFixed(1)} day${daysOver !== 1 ? 's' : ''} ago.`
                                }
                            </Typography>
                        </Box>
                    </Box>
                )}
                {isApproach && !isCompleted && (
                    <Box sx={{ mt: 0.8, p: 1.4, borderRadius: '10px', bgcolor: T.amberSoft, border: `1px solid ${T.amber}22` }}>
                        <Box sx={{ display: 'flex', gap: 0.8, alignItems: 'flex-start' }}>
                            <WarnIcon sx={{ fontSize: 14, color: T.amber, mt: 0.2, flexShrink: 0 }} />
                            <Typography sx={{ fontSize: '0.74rem', color: T.amber, fontWeight: 600, lineHeight: 1.5 }}>
                                {daysLeft.toFixed(1)} day{daysLeft !== 1 ? 's' : ''} remaining before the {stage.sla_days}-day SLA is breached. Action needed soon.
                            </Typography>
                        </Box>
                    </Box>
                )}
                {!isBreached && !isApproach && isCompleted && (
                    <Box sx={{ mt: 0.8, p: 1.2, borderRadius: '10px', bgcolor: T.greenSoft, border: `1px solid ${T.green}22` }}>
                        <Typography sx={{ fontSize: '0.72rem', color: T.green, fontWeight: 600 }}>
                            ✓ Completed within SLA — took {stage.days_taken.toFixed(1)} of {stage.sla_days} allotted days.
                        </Typography>
                    </Box>
                )}
            </Box>
        </Box>
    );
}

/* ── Application SLA detail drawer ──────────────────────────────── */
function SlaDetailDrawer({ appId, onClose }) {
    const [detail,  setDetail]  = useState(null);
    const [loading, setLoading] = useState(true);
    const [err,     setErr]     = useState(null);

    useEffect(() => {
        if (!appId) return;
        setLoading(true); setErr(null); setDetail(null);
        slaAPI.getApplicationDetail(appId)
            .then(res => setDetail(res.data?.data || res.data))
            .catch(e  => setErr(e.response?.data?.message || e.message))
            .finally(() => setLoading(false));
    }, [appId]);

    const app    = detail?.application;
    const stages = detail?.stages || [];
    const order  = detail?.order;

    const totalDays   = detail?.total_days ?? 0;
    const anyBreached = stages.some(s => s.sla_status === 'breached');

    return (
        <Drawer
            anchor="right"
            open={!!appId}
            onClose={onClose}
            PaperProps={{ sx: { width: { xs: '100vw', sm: 460 }, bgcolor: T.bg, border: 'none', boxShadow: '-4px 0 32px rgba(0,0,0,0.08)' } }}
        >
            {/* Header */}
            <Box sx={{ px: 3, py: 2.5, bgcolor: T.surface, borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SpeedIcon sx={{ fontSize: 18, color: T.accent }} />
                    <Typography sx={{ fontWeight: 700, fontSize: '0.92rem', color: T.text }}>SLA Stage Breakdown</Typography>
                </Box>
                <IconButton size="small" onClick={onClose} sx={{ color: T.muted }}>
                    <CloseIcon fontSize="small" />
                </IconButton>
            </Box>

            <Box sx={{ p: 3, overflowY: 'auto', flex: 1 }}>
                {loading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', pt: 6 }}>
                        <CircularProgress size={28} sx={{ color: T.accent }} />
                    </Box>
                )}
                {err && (
                    <Box sx={{ p: 2.5, borderRadius: '12px', bgcolor: T.roseSoft, border: `1px solid ${T.rose}28` }}>
                        <Typography sx={{ fontSize: '0.82rem', color: T.rose, fontWeight: 600 }}>Could not load: {err}</Typography>
                    </Box>
                )}

                {detail && app && (
                    <>
                        {/* Application summary card */}
                        <Paper elevation={0} sx={{ p: 2.5, borderRadius: '14px', border: `1.5px solid ${anyBreached ? T.rose : T.border}28`, bgcolor: T.surface, mb: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                                <Avatar sx={{ width: 38, height: 38, bgcolor: T.accentSoft, fontWeight: 700, color: T.accent, fontSize: '0.82rem' }}>
                                    {(app.first_name?.[0] || '') + (app.last_name?.[0] || '')}
                                </Avatar>
                                <Box>
                                    <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: T.text }}>{app.first_name} {app.last_name}</Typography>
                                    <Typography sx={{ fontSize: '0.7rem', color: T.muted }}>App #{app.application_id} · {app.region || '—'}</Typography>
                                </Box>
                            </Box>
                            <Divider sx={{ borderColor: T.border, mb: 1.5 }} />
                            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                                {[
                                    { label: 'Device',    value: app.device_name },
                                    { label: 'Plan',      value: app.plan_name },
                                    { label: 'Cost',      value: `R${parseFloat(app.monthly_cost || 0).toFixed(0)}/mo` },
                                    { label: 'Submitted', value: fmtDate(app.submission_date) },
                                    { label: 'Status',    value: app.application_status },
                                    { label: 'Total age', value: `${totalDays.toFixed(1)} days` },
                                ].map(({ label, value }) => (
                                    <Box key={label}>
                                        <Typography sx={{ fontSize: '0.62rem', color: T.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.6 }}>{label}</Typography>
                                        <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: T.text }}>{value || '—'}</Typography>
                                    </Box>
                                ))}
                            </Box>
                        </Paper>

                        {/* SLA breach summary banner */}
                        {anyBreached && (
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', p: 2, borderRadius: '12px', bgcolor: T.roseSoft, border: `1px solid ${T.rose}28`, mb: 3 }}>
                                <BreachIcon sx={{ fontSize: 18, color: T.rose, flexShrink: 0, mt: 0.1 }} />
                                <Box>
                                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: T.rose }}>SLA Breached</Typography>
                                    <Typography sx={{ fontSize: '0.72rem', color: T.rose, lineHeight: 1.5 }}>
                                        One or more stages exceeded their deadline. See the timeline below for the exact stage and reason.
                                    </Typography>
                                </Box>
                            </Box>
                        )}

                        {/* Stage-by-stage timeline */}
                        <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: 1, mb: 2 }}>
                            Stage-by-Stage Timeline
                        </Typography>

                        <Box>
                            {stages.map((stage, i) => (
                                <StageTimelineItem key={stage.stage} stage={stage} isLast={i === stages.length - 1 && !order} />
                            ))}

                            {/* Order node */}
                            {order && (
                                <Box sx={{ display: 'flex', gap: 1.5, mt: stages.length ? 3 : 0 }}>
                                    <Box sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: T.greenSoft, border: `2px solid ${T.green}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <OkIcon sx={{ fontSize: 14, color: T.green }} />
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography sx={{ fontSize: '0.84rem', fontWeight: 700, color: T.text, mb: 0.4 }}>Order Placed</Typography>
                                        <Typography sx={{ fontSize: '0.72rem', color: T.muted }}>Order #{order.order_id} · {order.order_status} · {fmtDate(order.order_date)}</Typography>
                                        <Box sx={{ mt: 1, p: 1.2, borderRadius: '10px', bgcolor: T.greenSoft }}>
                                            <Typography sx={{ fontSize: '0.72rem', color: T.green, fontWeight: 600 }}>✓ Application fully processed and order placed.</Typography>
                                        </Box>
                                    </Box>
                                </Box>
                            )}
                        </Box>

                        {/* Total journey */}
                        <Paper elevation={0} sx={{ p: 2, borderRadius: '12px', border: `1px solid ${T.border}`, bgcolor: T.surface, mt: 3 }}>
                            <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: 0.8, mb: 1 }}>Total Journey</Typography>
                            <Typography sx={{ fontSize: '0.82rem', color: T.text }}>
                                Application submitted on <strong>{fmtDate(app.submission_date)}</strong> and has been in the system for{' '}
                                <strong style={{ color: anyBreached ? T.rose : T.green }}>{totalDays.toFixed(1)} days</strong>.
                            </Typography>
                        </Paper>
                    </>
                )}
            </Box>
        </Drawer>
    );
}

/* ── How SLA Works collapsible panel ────────────────────────────── */
function SlaHelpPanel() {
    const [open,        setOpen]        = useState(false);
    const [expandedIdx, setExpandedIdx] = useState(null);

    return (
        <Paper elevation={0} sx={{ borderRadius: '14px', border: `1.5px solid ${T.accent}28`, bgcolor: T.surface, mb: 3, overflow: 'hidden' }}>
            {/* Toggle header */}
            <Box
                onClick={() => setOpen(o => !o)}
                sx={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    px: 2.5, py: 1.8, cursor: 'pointer',
                    '&:hover': { bgcolor: T.accentSoft },
                    transition: 'background 0.18s ease',
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                    <Box sx={{ width: 30, height: 30, borderRadius: '8px', bgcolor: T.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <HelpIcon sx={{ fontSize: 16, color: T.accent }} />
                    </Box>
                    <Box>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.88rem', color: T.text }}>How does SLA work?</Typography>
                        <Typography sx={{ fontSize: '0.7rem', color: T.muted }}>Click to understand stages, thresholds and breach reasons</Typography>
                    </Box>
                </Box>
                {open ? <CollapseIcon sx={{ color: T.accent }} /> : <ExpandIcon sx={{ color: T.muted }} />}
            </Box>

            <Collapse in={open}>
                <Divider sx={{ borderColor: T.border }} />
                <Box sx={{ p: 2.5 }}>
                    {/* Quick-reference chips */}
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2.5 }}>
                        {[
                            { label: 'Manager Review: 3 days',  color: T.purple, soft: T.purpleSoft },
                            { label: 'Finance Review: 5 days',  color: T.accent, soft: T.accentSoft },
                            { label: 'Order Placement: 2 days', color: T.amber,  soft: T.amberSoft  },
                            { label: 'Warning at 80% elapsed',  color: T.rose,   soft: T.roseSoft   },
                        ].map(({ label, color, soft }) => (
                            <Box key={label} sx={{ px: 1.4, py: 0.5, borderRadius: '8px', bgcolor: soft, border: `1px solid ${color}28` }}>
                                <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color }}>{label}</Typography>
                            </Box>
                        ))}
                    </Box>

                    {/* Flow diagram */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 2.5, flexWrap: 'wrap' }}>
                        {[
                            { label: 'Client submits', color: T.muted,   soft: T.bg       },
                            null,
                            { label: 'Manager reviews', sublabel: '≤ 3 days', color: T.purple, soft: T.purpleSoft },
                            null,
                            { label: 'Finance reviews', sublabel: '≤ 5 days', color: T.accent, soft: T.accentSoft },
                            null,
                            { label: 'Admin orders',    sublabel: '≤ 2 days', color: T.amber,  soft: T.amberSoft  },
                            null,
                            { label: 'Done ✓',          color: T.green,  soft: T.greenSoft },
                        ].map((step, i) =>
                            step === null ? (
                                <ArrowIcon key={i} sx={{ fontSize: 14, color: T.border, flexShrink: 0 }} />
                            ) : (
                                <Box key={i} sx={{ px: 1.2, py: 0.8, borderRadius: '9px', bgcolor: step.soft, border: `1px solid ${step.color}28`, textAlign: 'center' }}>
                                    <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: step.color }}>{step.label}</Typography>
                                    {step.sublabel && <Typography sx={{ fontSize: '0.62rem', color: step.color, opacity: 0.8 }}>{step.sublabel}</Typography>}
                                </Box>
                            )
                        )}
                    </Box>

                    {/* FAQ */}
                    {SLA_HELP.map((item, i) => (
                        <Box key={i} sx={{ mb: 1, borderRadius: '10px', border: `1px solid ${T.border}`, overflow: 'hidden' }}>
                            <Box
                                onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}
                                sx={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    px: 2, py: 1.4, cursor: 'pointer',
                                    bgcolor: expandedIdx === i ? T.accentSoft : T.surface,
                                    '&:hover': { bgcolor: T.accentSoft },
                                    transition: 'background 0.15s',
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <InfoIcon sx={{ fontSize: 14, color: T.accent, flexShrink: 0 }} />
                                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: T.text }}>{item.q}</Typography>
                                </Box>
                                {expandedIdx === i ? <CollapseIcon sx={{ fontSize: 18, color: T.accent }} /> : <ExpandIcon sx={{ fontSize: 18, color: T.muted }} />}
                            </Box>
                            <Collapse in={expandedIdx === i}>
                                <Box sx={{ px: 2, py: 1.5, bgcolor: T.bg, borderTop: `1px solid ${T.border}` }}>
                                    {item.a.split('\n\n').map((para, pi) => (
                                        <Typography key={pi} sx={{ fontSize: '0.78rem', color: T.muted, lineHeight: 1.7, mb: pi < item.a.split('\n\n').length - 1 ? 1 : 0 }}>
                                            {para}
                                        </Typography>
                                    ))}
                                </Box>
                            </Collapse>
                        </Box>
                    ))}
                </Box>
            </Collapse>
        </Paper>
    );
}

/* ── Main component ──────────────────────────────────────────────── */
export default function SLAMonitor() {
    const [dashboard,    setDashboard]    = useState(null);
    const [applications, setApplications] = useState([]);
    const [total,        setTotal]        = useState(0);
    const [slaFilter,    setSlaFilter]    = useState('');
    const [stageFilter,  setStageFilter]  = useState('');
    const [loading,      setLoading]      = useState(true);
    const [appsLoading,  setAppsLoading]  = useState(false);
    const [lastRefresh,  setLastRefresh]  = useState(null);
    const [error,        setError]        = useState(null);
    const [selectedId,   setSelectedId]   = useState(null);
    const timerRef = useRef(null);

    const fetchDashboard = useCallback(async () => {
        const res = await slaAPI.getDashboard();
        setDashboard(res.data?.data || res.data);
    }, []);

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
        } finally {
            setAppsLoading(false);
        }
    }, [slaFilter, stageFilter]);

    const refresh = useCallback(async () => {
        setError(null);
        try {
            await Promise.all([fetchDashboard(), fetchApplications()]);
            setLastRefresh(new Date());
        } catch (err) {
            const status = err.response?.status;
            if (status === 401)      setError('Session expired — please log in again.');
            else if (status === 403) setError('Access denied. SLA Monitor requires Admin role.');
            else                     setError(`Failed to load SLA data: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }, [fetchDashboard, fetchApplications]);

    useEffect(() => {
        refresh();
        timerRef.current = setInterval(refresh, 60_000);
        return () => clearInterval(timerRef.current);
    }, [refresh]);

    const overall = dashboard?.overall || {};
    const stages  = dashboard?.stages  || [];

    if (loading) return (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
            <CircularProgress sx={{ color: T.accent }} />
        </Box>
    );

    if (error) return (
        <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, minHeight: '60vh', justifyContent: 'center' }}>
            <BreachIcon sx={{ fontSize: 48, color: T.rose }} />
            <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: T.text }}>{error}</Typography>
            <Box component="button" onClick={refresh} sx={{ mt: 1, px: 3, py: 1.2, borderRadius: '10px', border: 'none', cursor: 'pointer', bgcolor: T.accent, color: '#fff', fontFamily: 'Plus Jakarta Sans', fontSize: '0.82rem', fontWeight: 700 }}>
                Try again
            </Box>
        </Box>
    );

    return (
        <Box sx={{ p: { xs: 2, sm: 3 }, bgcolor: T.bg, minHeight: '100vh' }}>

            {/* Page header */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2.5 }}>
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: T.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <SpeedIcon sx={{ fontSize: 19, color: T.accent }} />
                        </Box>
                        <Typography sx={{ fontSize: '1.25rem', fontWeight: 800, color: T.text }}>SLA Monitor</Typography>
                    </Box>
                    <Typography sx={{ fontSize: '0.8rem', color: T.muted }}>
                        Real-time SLA tracking · click any application row to see its stage breakdown
                        {lastRefresh && ` · refreshed ${lastRefresh.toLocaleTimeString('en-ZA')}`}
                    </Typography>
                </Box>
                <Tooltip title="Refresh now">
                    <IconButton onClick={refresh} sx={{ bgcolor: T.surface, border: `1px solid ${T.border}`, '&:hover': { bgcolor: T.accentSoft } }}>
                        <RefreshIcon sx={{ fontSize: 18, color: T.accent }} />
                    </IconButton>
                </Tooltip>
            </Box>

            {/* How SLA works help panel */}
            <SlaHelpPanel />

            {/* Summary stat cards */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                {[
                    { label: 'Active Applications', value: overall.total ?? 0,        icon: TrendIcon,  color: T.accent, soft: T.accentSoft, sub: 'In workflow right now'      },
                    { label: 'Within SLA',          value: overall.within ?? 0,       icon: OkIcon,     color: T.green,  soft: T.greenSoft,  sub: `Compliance: ${overall.compliance_pct ?? 100}%` },
                    { label: 'Approaching Breach',  value: overall.approaching ?? 0,  icon: WarnIcon,   color: T.amber,  soft: T.amberSoft,  sub: 'Action needed soon'         },
                    { label: 'SLA Breached',        value: overall.breached ?? 0,     icon: BreachIcon, color: T.rose,   soft: T.roseSoft,   sub: 'Escalation required'        },
                ].map(c => (
                    <Grid item xs={6} sm={3} key={c.label}>
                        <StatCard {...c} />
                    </Grid>
                ))}
            </Grid>

            {/* Compliance bar */}
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: '14px', border: `1.5px solid ${T.border}`, bgcolor: T.surface, mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: T.text }}>Overall Compliance</Typography>
                    <Typography sx={{ fontSize: '1rem', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', color: (overall.compliance_pct ?? 100) >= 80 ? T.green : (overall.compliance_pct ?? 100) >= 50 ? T.amber : T.rose }}>
                        {overall.compliance_pct ?? 100}%
                    </Typography>
                </Box>
                <LinearProgress variant="determinate" value={overall.compliance_pct ?? 100} sx={{ height: 8, borderRadius: 4, bgcolor: T.border, '& .MuiLinearProgress-bar': { borderRadius: 4, bgcolor: (overall.compliance_pct ?? 100) >= 80 ? T.green : (overall.compliance_pct ?? 100) >= 50 ? T.amber : T.rose } }} />
                <Typography sx={{ fontSize: '0.69rem', color: T.muted, mt: 0.8 }}>
                    {overall.within ?? 0} of {overall.total ?? 0} active applications within their SLA deadline
                </Typography>
            </Paper>

            {/* Per-stage breakdown */}
            <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: T.muted, letterSpacing: 1, textTransform: 'uppercase', mb: 1.5 }}>Stage Breakdown</Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
                {stages.length === 0 ? (
                    <Grid item xs={12}>
                        <Paper elevation={0} sx={{ p: 3, borderRadius: '14px', border: `1px solid ${T.border}`, textAlign: 'center' }}>
                            <OkIcon sx={{ fontSize: 32, color: T.green, mb: 1 }} />
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

            {/* Application table */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, gap: 2, flexWrap: 'wrap' }}>
                <Box>
                    <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: T.muted, letterSpacing: 1, textTransform: 'uppercase' }}>
                        Application Queue — {total} record{total !== 1 ? 's' : ''}
                    </Typography>
                    <Typography sx={{ fontSize: '0.69rem', color: T.muted }}>Click a row to view stage-by-stage SLA breakdown</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel sx={{ fontSize: '0.78rem' }}>SLA Status</InputLabel>
                        <Select value={slaFilter} label="SLA Status" onChange={e => setSlaFilter(e.target.value)} sx={{ fontSize: '0.78rem', bgcolor: T.surface }}>
                            <MenuItem value="">All statuses</MenuItem>
                            <MenuItem value="breached">Breached</MenuItem>
                            <MenuItem value="approaching">Approaching</MenuItem>
                            <MenuItem value="within">Within SLA</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 155 }}>
                        <InputLabel sx={{ fontSize: '0.78rem' }}>Stage</InputLabel>
                        <Select value={stageFilter} label="Stage" onChange={e => setStageFilter(e.target.value)} sx={{ fontSize: '0.78rem', bgcolor: T.surface }}>
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
                                    <TableCell key={h} sx={{ fontSize: '0.68rem', fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: 0.8, py: 1.5, pl: h === '#' ? 2 : undefined, borderBottom: `2px solid ${T.border}` }}>
                                        {h}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {appsLoading ? (
                                <TableRow><TableCell colSpan={8} sx={{ textAlign: 'center', py: 6 }}><CircularProgress size={24} sx={{ color: T.accent }} /></TableCell></TableRow>
                            ) : applications.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} sx={{ textAlign: 'center', py: 6 }}>
                                        <OkIcon sx={{ fontSize: 40, color: T.green, mb: 1, display: 'block', mx: 'auto' }} />
                                        <Typography sx={{ fontWeight: 600, color: T.text, mb: 0.5 }}>All clear</Typography>
                                        <Typography sx={{ fontSize: '0.8rem', color: T.muted }}>No applications match the current filter.</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                applications.map((app, idx) => (
                                    <AppRow key={app.application_id} app={app} idx={idx} onSelect={setSelectedId} />
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* Detail drawer */}
            <SlaDetailDrawer appId={selectedId} onClose={() => setSelectedId(null)} />
        </Box>
    );
}
