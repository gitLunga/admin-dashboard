import React, { useState, useEffect } from 'react';
import {
    Grid, Paper, Typography, Box, Alert, Button, Skeleton, Chip, Divider, Avatar,
} from '@mui/material';
import { adminAPI } from '../../services/api';
import RecentRegistrations from './RecentRegistrations';
import {
    People as PeopleIcon,
    Person as PersonIcon,
    Group as GroupIcon,
    Assignment as AssignmentIcon,
    CheckCircle as VerifiedIcon,
    PendingActions as PendingIcon,
    Block as RejectedIcon,
    Refresh as RefreshIcon,
    EmojiEvents as TrophyIcon,
    Timeline as TimelineIcon,
    KeyboardArrowUp as ArrowUpIcon,
} from '@mui/icons-material';

/* ─── Shared design tokens (keep in sync with Sidebar.jsx / Navbar.jsx) ─── */
const T = {
    bg:         '#F8F9FC',
    surface:    '#FFFFFF',
    border:     '#E8ECF4',
    text:       '#0F1F3D',
    muted:      '#6B7A99',
    accent:     '#1E4FD8',
    accentMid:  '#3366FF',
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

const CARDS = [
    { from: '#1E4FD8', soft: '#EBF0FF', shadow: 'rgba(30,79,216,0.12)' },
    { from: '#059669', soft: '#D1FAE5', shadow: 'rgba(5,150,105,0.12)'  },
    { from: '#D97706', soft: '#FEF3C7', shadow: 'rgba(217,119,6,0.12)'  },
    { from: '#7C3AED', soft: '#EDE9FE', shadow: 'rgba(124,58,237,0.12)' },
];

const STATUS_CFG = {
    Verified: { color: '#059669', soft: '#D1FAE5', Icon: VerifiedIcon  },
    Pending:  { color: '#D97706', soft: '#FEF3C7', Icon: PendingIcon   },
    Rejected: { color: '#DC2626', soft: '#FEE2E2', Icon: RejectedIcon  },
};

/* ─── Sub-components ─── */
const LiveDot = () => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7 }}>
        <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: T.green, animation: 'dotPulse 2s ease-in-out infinite' }} />
        <Typography sx={{ fontSize: '0.67rem', fontWeight: 700, color: T.green, letterSpacing: 1, textTransform: 'uppercase' }}>
            Live
        </Typography>
    </Box>
);

const StatCard = ({ label, value, sub, icon: Icon, palette, delay }) => (
    <Box sx={{ animation: `fadeUp 0.5s ease-out ${delay}s both` }}>
        <Paper elevation={0} sx={{
            p: 2.8, borderRadius: '14px',
            bgcolor: T.surface, border: `1px solid ${T.border}`,
            position: 'relative', overflow: 'hidden',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            '&:hover': {
                transform: 'translateY(-3px)',
                boxShadow: `0 12px 32px ${palette.shadow}`,
                borderColor: `${palette.from}44`,
            },
        }}>
            <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, bgcolor: palette.from, borderRadius: '14px 14px 0 0' }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mt: 0.5 }}>
                <Box>
                    <Typography sx={{ fontSize: '0.67rem', fontWeight: 700, color: T.muted, letterSpacing: 1, textTransform: 'uppercase', mb: 1.2 }}>
                        {label}
                    </Typography>
                    <Typography className="mono" sx={{ fontSize: '2.4rem', fontWeight: 500, lineHeight: 1, color: palette.from, mb: 0.8 }}>
                        {value ?? 0}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                        <ArrowUpIcon sx={{ fontSize: 13, color: palette.from }} />
                        <Typography sx={{ fontSize: '0.7rem', color: T.muted }}>{sub}</Typography>
                    </Box>
                </Box>
                <Box sx={{ p: 1.3, borderRadius: '12px', bgcolor: palette.soft }}>
                    <Icon sx={{ fontSize: 22, color: palette.from }} />
                </Box>
            </Box>
        </Paper>
    </Box>
);

const SectionCard = ({ title, subtitle, accent = T.accent, children, delay = 0, sx = {} }) => (
    <Paper elevation={0} sx={{
        p: 3, height: '100%', borderRadius: '14px',
        bgcolor: T.surface, border: `1px solid ${T.border}`,
        animation: `fadeUp 0.5s ease-out ${delay}s both`,
        transition: 'border-color 0.2s ease',
        '&:hover': { borderColor: `${accent}33` },
        ...sx,
    }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.3, mb: 2.5 }}>
            <Box sx={{ width: 3, height: 24, bgcolor: accent, borderRadius: 4, flexShrink: 0 }} />
            <Box>
                <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: T.text }}>{title}</Typography>
                {subtitle && <Typography sx={{ fontSize: '0.7rem', color: T.muted, mt: 0.1 }}>{subtitle}</Typography>}
            </Box>
        </Box>
        {children}
    </Paper>
);

const StatusRow = ({ label, count, total, cfg, delay }) => {
    const pct = total ? ((count / total) * 100).toFixed(1) : 0;
    const { color, soft, Icon } = cfg;
    return (
        <Box sx={{ mb: 2.5, animation: `fadeUp 0.4s ease-out ${delay}s both` }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.9 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 26, height: 26, borderRadius: '8px', bgcolor: soft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon sx={{ fontSize: 14, color }} />
                    </Box>
                    <Box>
                        <Typography sx={{ fontSize: '0.79rem', fontWeight: 600, color: T.text }}>{label}</Typography>
                        <Typography className="mono" sx={{ fontSize: '0.64rem', color: T.muted }}>{pct}%</Typography>
                    </Box>
                </Box>
                <Typography className="mono" sx={{ fontSize: '1.05rem', fontWeight: 600, color: T.text }}>{count}</Typography>
            </Box>
            <Box sx={{ height: 5, bgcolor: T.bg, borderRadius: 3, overflow: 'hidden', border: `1px solid ${T.border}` }}>
                <Box sx={{
                    width: `${pct}%`, height: '100%', bgcolor: color, borderRadius: 3,
                    animation: 'barGrow 0.8s ease-out', animationDelay: `${delay + 0.1}s`, animationFillMode: 'both',
                }} />
            </Box>
        </Box>
    );
};

const RankRow = ({ rank, name, id, count, accent, delay }) => (
    <Box sx={{
        display: 'flex', alignItems: 'center', gap: 1.5,
        p: 1.4, borderRadius: '10px', mb: 1,
        bgcolor: rank === 1 ? `${accent}0D` : 'transparent',
        border: `1px solid ${rank === 1 ? `${accent}28` : T.border}`,
        animation: `fadeUp 0.4s ease-out ${delay}s both`,
        transition: 'all 0.18s ease',
        '&:hover': { bgcolor: `${accent}0D`, transform: 'translateX(3px)', borderColor: `${accent}44` },
    }}>
        <Avatar sx={{
            width: 30, height: 30, fontSize: '0.73rem',
            fontFamily: 'JetBrains Mono, monospace', fontWeight: 700,
            borderRadius: '8px', flexShrink: 0,
            bgcolor: rank === 1 ? accent : T.bg,
            color: rank === 1 ? '#fff' : accent,
            border: `1px solid ${rank === 1 ? accent : T.border}`,
        }}>
            {rank}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontWeight: 600, fontSize: '0.82rem', color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {name}
            </Typography>
            <Typography className="mono" sx={{ fontSize: '0.65rem', color: T.muted }}>#{id}</Typography>
        </Box>
        <Chip label={count} size="small" sx={{
            height: 22, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, fontSize: '0.72rem',
            bgcolor: `${accent}10`, color: accent, border: `1px solid ${accent}28`,
        }} />
    </Box>
);

const DashSkeleton = () => (
    <Box sx={{ p: { xs: 2, md: 3.5 }, minHeight: '100vh', bgcolor: T.bg }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
            <Skeleton variant="text" width={220} height={42} sx={{ bgcolor: T.border, borderRadius: 2 }} />
            <Skeleton variant="rectangular" width={100} height={36} sx={{ bgcolor: T.border, borderRadius: '10px' }} />
        </Box>
        <Grid container spacing={2.5}>
            {[0,1,2,3].map(i => (
                <Grid item xs={12} sm={6} md={3} key={i}>
                    <Skeleton variant="rectangular" height={120} sx={{ bgcolor: T.border, borderRadius: '14px' }} />
                </Grid>
            ))}
            {[0,1].map(i => (
                <Grid item xs={12} md={i === 0 ? 8 : 4} key={`b${i}`}>
                    <Skeleton variant="rectangular" height={300} sx={{ bgcolor: T.border, borderRadius: '14px' }} />
                </Grid>
            ))}
        </Grid>
    </Box>
);

/* ─── Main Dashboard ─── */
const Dashboard = () => {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading]             = useState(true);
    const [error, setError]                 = useState(null);

    useEffect(() => { fetchDashboardData(); }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true); setError(null);
            const response = await adminAPI.getDashboardData();
            console.log(response);
            setDashboardData(response.data.data);
        } catch (err) {
            console.error('❌ Dashboard fetch error:', err);
            setError(err.response?.data?.message || err.message || 'Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <DashSkeleton />;

    if (error) return (
        <Box sx={{ minHeight: '100vh', bgcolor: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
            <Box sx={{ maxWidth: 420, width: '100%', animation: 'fadeUp 0.4s ease-out' }}>
                <Paper elevation={0} sx={{ p: 3.5, borderRadius: '14px', bgcolor: T.surface, border: `1px solid ${T.roseSoft}` }}>
                    <Typography sx={{ fontWeight: 700, color: T.rose, mb: 0.8, fontSize: '0.95rem' }}>Unable to load dashboard</Typography>
                    <Typography sx={{ color: T.muted, fontSize: '0.83rem', mb: 2.5 }}>{error}</Typography>
                    <Button variant="contained" onClick={fetchDashboardData} startIcon={<RefreshIcon />} sx={{
                        bgcolor: T.accent, borderRadius: '10px', textTransform: 'none',
                        fontWeight: 600, fontFamily: 'Plus Jakarta Sans', boxShadow: 'none',
                        '&:hover': { bgcolor: T.accentMid, boxShadow: `0 6px 18px ${T.accent}44` },
                    }}>Retry</Button>
                </Paper>
            </Box>
        </Box>
    );

    if (!dashboardData) return (
        <Box sx={{ minHeight: '100vh', bgcolor: T.bg, p: 3 }}>
            <Alert severity="warning" sx={{ borderRadius: '10px' }}>No dashboard data available</Alert>
        </Box>
    );

    const { statistics, recent_registrations, activity_summary } = dashboardData;

    const clientStats = statistics?.client_users?.stats || [];
    const verified    = clientStats.find(s => s.registration_status === 'Verified')?.count || 0;
    const pending     = clientStats.find(s => s.registration_status === 'Pending')?.count  || 0;
    const rejected    = clientStats.find(s => s.registration_status === 'Rejected')?.count || 0;

    const stats = [
        { label: 'Total Users',       value: statistics?.total_users              || 0, sub: 'All registered users',     icon: PeopleIcon,     palette: CARDS[0] },
        { label: 'Client Users',      value: statistics?.client_users?.total      || 0, sub: 'Judicial system users',    icon: PersonIcon,     palette: CARDS[1] },
        { label: 'Operational Users', value: statistics?.operational_users?.total || 0, sub: 'Admin & staff users',      icon: GroupIcon,      palette: CARDS[2] },
        { label: 'Active Contracts',  value: activity_summary?.active_contracts   || 0, sub: 'Active service contracts', icon: AssignmentIcon, palette: CARDS[3] },
    ];

    return (
        <Box sx={{ flexGrow: 1, p: { xs: 2, md: 3.5 }, minHeight: '100vh', bgcolor: T.bg }}>

            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3.5, animation: 'fadeUp 0.4s ease-out' }}>
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.3 }}>
                        <Typography sx={{ fontSize: { xs: '1.4rem', md: '1.7rem' }, fontWeight: 800, color: T.text, letterSpacing: '-0.3px' }}>
                            Dashboard Overview
                        </Typography>
                        <LiveDot />
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                        <TimelineIcon sx={{ fontSize: 14, color: T.muted }} />
                        <Typography sx={{ fontSize: '0.78rem', color: T.muted }}>Real-time system insights and analytics</Typography>
                    </Box>
                </Box>
                <Button variant="outlined" onClick={fetchDashboardData} startIcon={<RefreshIcon sx={{ fontSize: '16px !important' }} />} sx={{
                    borderRadius: '10px', textTransform: 'none', fontWeight: 600,
                    fontFamily: 'Plus Jakarta Sans', fontSize: '0.81rem',
                    color: T.accent, borderColor: T.border, bgcolor: T.surface, px: 2.5, py: 1,
                    '&:hover': { bgcolor: T.accentSoft, borderColor: T.accent },
                    transition: 'all 0.18s ease',
                }}>
                    Refresh
                </Button>
            </Box>

            <Grid container spacing={2.5}>

                {/* Stat Cards */}
                {stats.map((s, i) => (
                    <Grid item xs={12} sm={6} md={3} key={s.label}>
                        <StatCard {...s} delay={i * 0.07} />
                    </Grid>
                ))}

                {/* Recent Registrations */}
                <Grid item xs={12} md={8}>
                    <SectionCard title="Recent Registrations" subtitle="Last 7 days activity" accent={T.accent} delay={0.32}>
                        <RecentRegistrations data={recent_registrations || []} />
                    </SectionCard>
                </Grid>

                {/* Client User Status */}
                <Grid item xs={12} md={4}>
                    <SectionCard title="Client User Status" subtitle="Distribution analysis" accent={T.green} delay={0.38}>
                        {clientStats.length > 0 ? (
                            <>
                                <StatusRow label="Verified" count={verified} total={statistics?.client_users?.total} cfg={STATUS_CFG.Verified} delay={0.44} />
                                <StatusRow label="Pending"  count={pending}  total={statistics?.client_users?.total} cfg={STATUS_CFG.Pending}  delay={0.50} />
                                <StatusRow label="Rejected" count={rejected} total={statistics?.client_users?.total} cfg={STATUS_CFG.Rejected} delay={0.56} />
                            </>
                        ) : (
                            <Typography sx={{ textAlign: 'center', py: 4, color: T.muted, fontStyle: 'italic', fontSize: '0.83rem' }}>
                                No status data available
                            </Typography>
                        )}

                        {activity_summary && (
                            <>
                                <Divider sx={{ borderColor: T.border, my: 2.5 }} />
                                <Typography sx={{ fontSize: '0.67rem', fontWeight: 700, color: T.muted, letterSpacing: 1, textTransform: 'uppercase', mb: 1.5, display: 'flex', alignItems: 'center', gap: 0.7 }}>
                                    <TrophyIcon sx={{ fontSize: 13, color: T.amber }} /> System Highlights
                                </Typography>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, borderRadius: '10px', bgcolor: T.purpleSoft, border: `1px solid ${T.purple}22`, mb: 2 }}>
                                    <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: T.text }}>Active Contracts</Typography>
                                    <Typography className="mono" sx={{ fontSize: '1.4rem', fontWeight: 600, color: T.purple }}>
                                        {activity_summary.active_contracts || 0}
                                    </Typography>
                                </Box>
                                {activity_summary.top_applicants?.[0] && (
                                    <Box sx={{ p: 2, borderRadius: '10px', bgcolor: T.greenSoft, border: `1px solid ${T.green}22` }}>
                                        <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: T.green, letterSpacing: 1, textTransform: 'uppercase', mb: 0.8 }}>
                                            🏆 Top Applicant
                                        </Typography>
                                        <Typography sx={{ fontWeight: 700, fontSize: '0.87rem', color: T.text }}>
                                            {activity_summary.top_applicants[0].first_name} {activity_summary.top_applicants[0].last_name}
                                        </Typography>
                                        <Typography className="mono" sx={{ fontSize: '0.67rem', color: T.muted }}>
                                            #{activity_summary.top_applicants[0].client_user_id}
                                        </Typography>
                                    </Box>
                                )}
                            </>
                        )}
                    </SectionCard>
                </Grid>

                {/* Rankings */}
                {activity_summary && (
                    <>
                        <Grid item xs={12} md={6}>
                            <SectionCard title="Top Applicants" subtitle="By application count" accent={T.accent} delay={0.44}>
                                {activity_summary.top_applicants?.length > 0
                                    ? activity_summary.top_applicants.slice(0, 5).map((a, i) => (
                                        <RankRow key={a.client_user_id || i} rank={i + 1}
                                                 name={`${a.first_name} ${a.last_name}`}
                                                 id={a.client_user_id} count={a.application_count}
                                                 accent={T.accent} delay={0.48 + i * 0.06} />
                                    ))
                                    : <Typography sx={{ textAlign: 'center', py: 4, color: T.muted, fontStyle: 'italic', fontSize: '0.83rem' }}>No application data</Typography>
                                }
                            </SectionCard>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <SectionCard title="Top Ordered Users" subtitle="By order frequency" accent={T.green} delay={0.50}>
                                {activity_summary.top_ordered_users?.length > 0
                                    ? activity_summary.top_ordered_users.slice(0, 5).map((u, i) => (
                                        <RankRow key={u.client_user_id || i} rank={i + 1}
                                                 name={`${u.first_name} ${u.last_name}`}
                                                 id={u.client_user_id} count={u.order_count}
                                                 accent={T.green} delay={0.54 + i * 0.06} />
                                    ))
                                    : <Typography sx={{ textAlign: 'center', py: 4, color: T.muted, fontStyle: 'italic', fontSize: '0.83rem' }}>No order data</Typography>
                                }
                            </SectionCard>
                        </Grid>
                    </>
                )}
            </Grid>
        </Box>
    );
};

export default Dashboard;