import React, { useState, useEffect } from 'react';
import {
    Box, Paper, Typography, Grid, FormControl, Select, MenuItem,
    CircularProgress, Alert, Button, useMediaQuery, useTheme,
} from '@mui/material';
import {
    BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
    Tooltip as RechartsTooltip, Legend, ResponsiveContainer, AreaChart, Area,
} from 'recharts';
import {
    Refresh as RefreshIcon, Download as DownloadIcon,
    People as PeopleIcon, Person as PersonIcon,
    CheckCircle as CheckCircleIcon, Pending as PendingIcon,
    TrendingUp as TrendingUpIcon, Timeline as TimelineIcon,
    LocationOn as LocationIcon, BarChart as ChartIcon,
} from '@mui/icons-material';
import { adminAPI } from '../../services/api';
import StatsCard from './StatsCard';

/* ── Shared tokens ── */
const T = {
    bg: '#F8F9FC', surface: '#FFFFFF', border: '#E8ECF4',
    text: '#0F1F3D', muted: '#6B7A99',
    accent: '#1E4FD8', accentSoft: '#EBF0FF',
    green: '#059669', greenSoft: '#D1FAE5',
    amber: '#D97706', amberSoft: '#FEF3C7',
    rose: '#DC2626', roseSoft: '#FEE2E2',
    purple: '#7C3AED', purpleSoft: '#EDE9FE',
    cyan: '#0891B2', cyanSoft: '#CFFAFE',
};

const CHART_COLORS = [T.accent, T.green, T.amber, T.rose, T.purple, T.cyan];

const STATUS_COLOR = {
    Verified:          T.green,
    Pending:           T.amber,
    Rejected:          T.rose,
    Profile_Completed: T.accent,
};

/* ── Reusable section card ── */
const SectionCard = ({ title, subtitle, children }) => (
    <Paper elevation={0} sx={{ borderRadius: '14px', border: `1px solid ${T.border}`, bgcolor: T.surface, p: { xs: 2, md: 3 }, height: '100%' }}>
        {(title || subtitle) && (
            <Box sx={{ mb: 2, pb: 1.5, borderBottom: `1px solid ${T.border}` }}>
                {title   && <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: T.text }}>{title}</Typography>}
                {subtitle && <Typography sx={{ fontSize: '0.75rem', color: T.muted, mt: 0.3 }}>{subtitle}</Typography>}
            </Box>
        )}
        {children}
    </Paper>
);

/* ── Tab button ── */
const TabBtn = ({ label, active, onClick }) => (
    <Button onClick={onClick} sx={{
        borderRadius: '8px', textTransform: 'none', fontFamily: 'Plus Jakarta Sans, sans-serif',
        fontWeight: active ? 700 : 500, fontSize: '0.83rem', px: 2, py: 0.9,
        color: active ? T.accent : T.muted,
        bgcolor: active ? T.accentSoft : 'transparent',
        position: 'relative',
        '&:hover': { bgcolor: active ? T.accentSoft : T.bg },
        transition: 'all 0.15s ease',
    }}>
        {label}
        {active && <Box sx={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 20, height: 2, bgcolor: T.accent, borderRadius: 2 }} />}
    </Button>
);

/* ── Metric highlight card ── */
const MetricCard = ({ icon: Icon, color, soft, label, value, sub, delay }) => (
    <Paper elevation={0} sx={{
        p: 2.5, borderRadius: '14px', border: `1px solid ${T.border}`, bgcolor: T.surface,
        animation: `fadeUp 0.4s ease-out ${delay}s both`,
        transition: 'border-color 0.2s', '&:hover': { borderColor: color },
    }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ width: 44, height: 44, borderRadius: '12px', bgcolor: soft, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon sx={{ fontSize: 22, color }} />
            </Box>
            <Box>
                <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: 0.8 }}>{label}</Typography>
                <Typography sx={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '1.5rem', fontWeight: 500, color, lineHeight: 1.2 }}>{value}</Typography>
                {sub && <Typography sx={{ fontSize: '0.72rem', color: T.muted, mt: 0.2 }}>{sub}</Typography>}
            </Box>
        </Box>
    </Paper>
);

/* ── Custom chart tooltip ── */
const ChartTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <Box sx={{ bgcolor: T.surface, border: `1px solid ${T.border}`, borderRadius: '10px', p: 1.5, boxShadow: '0 8px 24px rgba(15,31,61,0.12)' }}>
            {label && <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: T.text, mb: 0.8 }}>{label}</Typography>}
            {payload.map((p, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.3 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: p.color }} />
                    <Typography sx={{ fontSize: '0.75rem', color: T.muted }}>{p.name}:</Typography>
                    <Typography className="mono" sx={{ fontSize: '0.75rem', fontWeight: 700, color: T.text }}>{p.value?.toLocaleString()}</Typography>
                </Box>
            ))}
        </Box>
    );
};

/* ── Progress bar row for client analysis ── */
const ProgressRow = ({ name, value, total, color }) => {
    const pct = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
    return (
        <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.8 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} />
                    <Typography sx={{ fontSize: '0.82rem', color: T.text, fontWeight: 500 }}>{name}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.8 }}>
                    <Typography className="mono" sx={{ fontSize: '0.85rem', fontWeight: 700, color: T.text }}>{value?.toLocaleString()}</Typography>
                    <Typography sx={{ fontSize: '0.7rem', color: T.muted }}>({pct}%)</Typography>
                </Box>
            </Box>
            <Box sx={{ height: 7, bgcolor: T.bg, borderRadius: 4, overflow: 'hidden', border: `1px solid ${T.border}` }}>
                <Box sx={{ height: '100%', width: `${pct}%`, bgcolor: color, borderRadius: 4, transition: 'width 0.6s ease' }} />
            </Box>
        </Box>
    );
};

/* ═══ Main Component ═══ */
const Statistics = () => {
    const theme    = useTheme();
    // const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const [basicStats,      setBasicStats]      = useState(null);
    const [enhancedStats,   setEnhancedStats]   = useState(null);
    const [dashboardMetrics,setDashboardMetrics]= useState(null);
    const [loading,         setLoading]         = useState(true);
    const [error,           setError]           = useState(null);
    const [timeRange,       setTimeRange]       = useState('month');
    const [activeTab,       setActiveTab]       = useState(0);

    useEffect(() => { fetchAllStatistics(); }, []);

    const fetchAllStatistics = async () => {
        try {
            setLoading(true);
            const [basicRes, enhancedRes, dashRes] = await Promise.allSettled([
                adminAPI.getStatistics(),
                adminAPI.getEnhancedStatistics(),
                adminAPI.getDashboardMetrics(),
            ]);
            if (basicRes.status    === 'fulfilled') setBasicStats(basicRes.value.data.data.statistics);
            if (enhancedRes.status === 'fulfilled') setEnhancedStats(enhancedRes.value.data.data.statistics);
            if (dashRes.status     === 'fulfilled') setDashboardMetrics(dashRes.value.data.data.metrics);
        } catch (err) { setError(err.message || 'Failed to fetch statistics'); }
        finally { setLoading(false); }
    };

    const handleExportData = () => {
        const data = { basic: basicStats, enhanced: enhancedStats, dashboard: dashboardMetrics, exportedAt: new Date().toISOString() };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `statistics-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // Chart data
    const clientStatusData = basicStats?.client_users?.stats?.map(s => ({
        name: s.registration_status, value: s.count, color: STATUS_COLOR[s.registration_status] || T.muted,
    })) || [];

    const operationalRoleData = basicStats?.operational_users?.stats?.map(s => ({ name: s.user_role, value: s.count })) || [];
    const regionData          = enhancedStats?.region_stats?.map(s => ({ name: s.region, value: s.count })) || [];
    const monthlyTrends       = enhancedStats?.monthly_trends || [];

    const TABS = ['Overview', 'Client Analysis', 'Regions', ...(monthlyTrends.length > 0 ? ['Trends'] : [])];

    if (loading && !basicStats) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400, bgcolor: T.bg }}>
            <CircularProgress sx={{ color: T.accent }} />
        </Box>
    );

    if (error) return (
        <Box sx={{ p: 3, bgcolor: T.bg }}>
            <Alert severity="error" sx={{ borderRadius: '10px' }} action={
                <Button color="inherit" size="small" onClick={fetchAllStatistics} sx={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700 }}>Retry</Button>
            }>{error}</Alert>
        </Box>
    );

    return (
        <Box sx={{ p: { xs: 2, md: 3.5 }, bgcolor: T.bg, minHeight: '100vh' }}>

            {/* ── Header ── */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2, animation: 'fadeUp 0.4s ease-out' }}>
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 0.3 }}>
                        <Box sx={{ p: 1, borderRadius: '10px', bgcolor: T.purpleSoft }}>
                            <ChartIcon sx={{ fontSize: 20, color: T.purple }} />
                        </Box>
                        <Typography sx={{ fontSize: { xs: '1.25rem', md: '1.6rem' }, fontWeight: 800, color: T.text, letterSpacing: '-0.3px' }}>
                            Statistics & Analytics
                        </Typography>
                    </Box>
                    {dashboardMetrics && (
                        <Typography sx={{ fontSize: '0.75rem', color: T.muted, ml: 0.5 }}>
                            Last updated: {new Date(dashboardMetrics.timestamp || Date.now()).toLocaleString()}
                        </Typography>
                    )}
                </Box>
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
                    <FormControl size="small">
                        <Select value={timeRange} displayEmpty onChange={e => setTimeRange(e.target.value)} renderValue={v => ({ week: 'Last Week', month: 'Last Month', quarter: 'Last Quarter', year: 'Last Year' }[v])}
                                sx={{ borderRadius: '10px', fontSize: '0.82rem', bgcolor: T.surface, minWidth: 130, '& .MuiOutlinedInput-notchedOutline': { borderColor: T.border }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: T.accent }, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: T.accent } }}>
                            {[['week','Last Week'],['month','Last Month'],['quarter','Last Quarter'],['year','Last Year']].map(([v,l]) => <MenuItem key={v} value={v} sx={{ fontSize: '0.83rem' }}>{l}</MenuItem>)}
                        </Select>
                    </FormControl>
                    <Button onClick={handleExportData} startIcon={<DownloadIcon sx={{ fontSize: '16px !important' }} />} variant="outlined" size="small"
                            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '0.81rem', color: T.accent, borderColor: T.border, bgcolor: T.surface, '&:hover': { bgcolor: T.accentSoft, borderColor: T.accent } }}>
                        Export
                    </Button>
                    <Button onClick={fetchAllStatistics} startIcon={<RefreshIcon sx={{ fontSize: '16px !important' }} />} variant="outlined" size="small"
                            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '0.81rem', color: T.muted, borderColor: T.border, bgcolor: T.surface, '&:hover': { bgcolor: T.bg, borderColor: T.accent, color: T.accent } }}>
                        Refresh
                    </Button>
                </Box>
            </Box>

            {/* ── Stats Cards Row ── */}
            <Grid container spacing={2.5} sx={{ mb: 3 }}>
                {[
                    { title: 'Total Users',        value: basicStats?.total_users || 0,                                      icon: PeopleIcon,       color: T.accent, soft: T.accentSoft, delay: 0.06 },
                    { title: 'Client Users',        value: basicStats?.client_users?.total || 0,                              icon: PersonIcon,       color: T.green,  soft: T.greenSoft,  delay: 0.12 },
                    { title: 'Verified Clients',    value: clientStatusData.find(s => s.name === 'Verified')?.value || 0,     icon: CheckCircleIcon,  color: T.cyan,   soft: T.cyanSoft,   delay: 0.18, description: 'Approved clients' },
                    { title: 'Pending Approvals',   value: clientStatusData.find(s => s.name === 'Pending')?.value || 0,      icon: PendingIcon,      color: T.amber,  soft: T.amberSoft,  delay: 0.24, description: 'Awaiting verification' },
                ].map(s => (
                    <Grid item xs={6} md={3} key={s.title}>
                        <StatsCard {...s} />
                    </Grid>
                ))}
            </Grid>

            {/* ── Dashboard Metric Highlights ── */}
            {dashboardMetrics && (
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12} sm={4}>
                        <MetricCard icon={TrendingUpIcon} color={dashboardMetrics.daily_growth > 0 ? T.green : T.rose} soft={dashboardMetrics.daily_growth > 0 ? T.greenSoft : T.roseSoft}
                                    label="Today's Registrations" value={dashboardMetrics.todays_registrations || 0}
                                    sub={`${dashboardMetrics.daily_growth > 0 ? '+' : ''}${dashboardMetrics.daily_growth || 0}% from yesterday`} delay={0.28} />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <MetricCard icon={TimelineIcon} color={T.accent} soft={T.accentSoft}
                                    label="Avg. Verification Time" value={`${dashboardMetrics.avg_verification_days || '—'}`}
                                    sub={`${dashboardMetrics.recently_verified || 0} recently verified`} delay={0.33} />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <MetricCard icon={LocationIcon} color={T.purple} soft={T.purpleSoft}
                                    label="Most Active Region" value={dashboardMetrics.most_active_region || '—'}
                                    sub={`${dashboardMetrics.region_user_count || 0} users`} delay={0.38} />
                    </Grid>
                </Grid>
            )}

            {/* ── Tab bar ── */}
            <Paper elevation={0} sx={{ borderRadius: '14px', border: `1px solid ${T.border}`, bgcolor: T.surface, p: 0.8, mb: 2.5, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                {TABS.map((tab, i) => <TabBtn key={tab} label={tab} active={activeTab === i} onClick={() => setActiveTab(i)} />)}
            </Paper>

            {/* ── Tab 0: Overview ── */}
            {activeTab === 0 && (
                <Grid container spacing={2.5}>
                    {/* Pie chart */}
                    <Grid item xs={12} md={6}>
                        <SectionCard title="Client Status Distribution" subtitle={`Total: ${basicStats?.client_users?.total || 0} clients`}>
                            <Box sx={{ height: 280 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={clientStatusData} cx="50%" cy="50%" outerRadius={95} innerRadius={45} dataKey="value" labelLine={false}
                                             label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                            {clientStatusData.map((entry, i) => <Cell key={i} fill={entry.color || CHART_COLORS[i % CHART_COLORS.length]} />)}
                                        </Pie>
                                        <RechartsTooltip content={<ChartTooltip />} />
                                        <Legend iconType="circle" iconSize={8} formatter={v => <span style={{ fontSize: '0.78rem', color: T.text, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{v}</span>} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </Box>
                        </SectionCard>
                    </Grid>

                    {/* Bar chart */}
                    <Grid item xs={12} md={6}>
                        <SectionCard title="Operational User Roles" subtitle={`Total: ${basicStats?.operational_users?.total || 0} operational users`}>
                            <Box sx={{ height: 280 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={operationalRoleData} barSize={32}>
                                        <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
                                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: T.muted, fontFamily: 'Plus Jakarta Sans, sans-serif' }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 11, fill: T.muted, fontFamily: 'Plus Jakarta Sans, sans-serif' }} axisLine={false} tickLine={false} />
                                        <RechartsTooltip content={<ChartTooltip />} />
                                        <Bar dataKey="value" name="Users" radius={[6, 6, 0, 0]}>
                                            {operationalRoleData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </Box>
                        </SectionCard>
                    </Grid>
                </Grid>
            )}

            {/* ── Tab 1: Client Analysis ── */}
            {activeTab === 1 && (
                <Grid container spacing={2.5}>
                    <Grid item xs={12} md={7}>
                        <SectionCard title="Client Status Breakdown">
                            <Box sx={{ pt: 1 }}>
                                {clientStatusData.map(stat => (
                                    <ProgressRow key={stat.name} name={stat.name} value={stat.value} total={basicStats?.client_users?.total || 1} color={stat.color} />
                                ))}
                                <Box sx={{ pt: 2, borderTop: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: T.muted }}>Total Clients</Typography>
                                    <Typography className="mono" sx={{ fontSize: '1.4rem', fontWeight: 500, color: T.text }}>{basicStats?.client_users?.total?.toLocaleString() || 0}</Typography>
                                </Box>
                            </Box>
                        </SectionCard>
                    </Grid>
                    <Grid item xs={12} md={5}>
                        <SectionCard title="Verification Rate">
                            <Box sx={{ height: 240 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={clientStatusData} cx="50%" cy="50%" outerRadius={85} innerRadius={50} dataKey="value" paddingAngle={3}>
                                            {clientStatusData.map((entry, i) => <Cell key={i} fill={entry.color || CHART_COLORS[i % CHART_COLORS.length]} />)}
                                        </Pie>
                                        <RechartsTooltip content={<ChartTooltip />} />
                                        <Legend iconType="circle" iconSize={7} formatter={v => <span style={{ fontSize: '0.75rem', color: T.text, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{v}</span>} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </Box>
                        </SectionCard>
                    </Grid>
                </Grid>
            )}

            {/* ── Tab 2: Regions ── */}
            {activeTab === 2 && (
                <Grid container spacing={2.5}>
                    {regionData.length > 0 ? (
                        <Grid item xs={12}>
                            <SectionCard title="User Distribution by Region" subtitle={`${regionData.length} regions with registered users`}>
                                <Box sx={{ height: 340 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={regionData} barSize={28}>
                                            <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
                                            <XAxis dataKey="name" tick={{ fontSize: 11, fill: T.muted, fontFamily: 'Plus Jakarta Sans, sans-serif' }} axisLine={false} tickLine={false} />
                                            <YAxis tick={{ fontSize: 11, fill: T.muted, fontFamily: 'Plus Jakarta Sans, sans-serif' }} axisLine={false} tickLine={false} />
                                            <RechartsTooltip content={<ChartTooltip />} />
                                            <Bar dataKey="value" name="Users" radius={[6, 6, 0, 0]}>
                                                {regionData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </Box>
                            </SectionCard>
                        </Grid>
                    ) : (
                        <Grid item xs={12}>
                            <Paper elevation={0} sx={{ p: 5, textAlign: 'center', borderRadius: '14px', border: `1px solid ${T.border}` }}>
                                <LocationIcon sx={{ fontSize: 44, color: T.border, mb: 1.5 }} />
                                <Typography sx={{ fontSize: '0.88rem', color: T.muted }}>No regional data available</Typography>
                            </Paper>
                        </Grid>
                    )}
                </Grid>
            )}

            {/* ── Tab 3: Trends ── */}
            {activeTab === 3 && monthlyTrends.length > 0 && (
                <Grid container spacing={2.5}>
                    <Grid item xs={12}>
                        <SectionCard title="Registration Trends" subtitle="Last 6 months · Client &amp; operational registrations">
                            <Box sx={{ height: 360 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={monthlyTrends}>
                                        <defs>
                                            <linearGradient id="colorClients" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={T.accent} stopOpacity={0.18} />
                                                <stop offset="95%" stopColor={T.accent} stopOpacity={0.01} />
                                            </linearGradient>
                                            <linearGradient id="colorOp" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={T.green} stopOpacity={0.18} />
                                                <stop offset="95%" stopColor={T.green} stopOpacity={0.01} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
                                        <XAxis dataKey="month" tick={{ fontSize: 11, fill: T.muted, fontFamily: 'Plus Jakarta Sans, sans-serif' }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 11, fill: T.muted, fontFamily: 'Plus Jakarta Sans, sans-serif' }} axisLine={false} tickLine={false} />
                                        <RechartsTooltip content={<ChartTooltip />} />
                                        <Legend iconType="circle" iconSize={8} formatter={v => <span style={{ fontSize: '0.78rem', color: T.text, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{v}</span>} />
                                        <Area type="monotone" dataKey="clients"     stroke={T.accent} strokeWidth={2} fill="url(#colorClients)" name="Client Registrations" dot={{ r: 3, fill: T.accent }} activeDot={{ r: 5 }} />
                                        <Area type="monotone" dataKey="operational" stroke={T.green}  strokeWidth={2} fill="url(#colorOp)"      name="Operational Registrations" dot={{ r: 3, fill: T.green }} activeDot={{ r: 5 }} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </Box>
                        </SectionCard>
                    </Grid>
                </Grid>
            )}
        </Box>
    );
};

export default Statistics;