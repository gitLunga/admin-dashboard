import React, {useState, useEffect, useMemo} from 'react';
import * as XLSX from 'xlsx';
import {
    Box, Paper, Typography, Grid, CircularProgress, Button, Chip, Divider,
} from '@mui/material';
import {
    BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
    Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
    AreaChart, Area, LineChart, Line,
} from 'recharts';
import {
    Refresh as RefreshIcon, Download as DownloadIcon,
    People as PeopleIcon, Person as PersonIcon,
    CheckCircle as CheckCircleIcon, Pending as PendingIcon,
    TrendingUp as TrendingUpIcon, Timeline as TimelineIcon,
    LocationOn as LocationIcon, Assessment as AssessmentIcon,
    Warning as WarningIcon, Insights as InsightsIcon,
    GroupWork as GroupWorkIcon, PhoneAndroid as DeviceIcon,
    Assignment as AppIcon, Receipt as ContractIcon,
    Speed as SlaIcon, AssignmentReturn as ReturnIcon,
    AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import {adminAPI, slaAPI, contractsAPI, budgetAPI, returnsAPI} from '../../services/api';
import StatsCard from './StatsCard';

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
    bg: '#F8F9FC', surface: '#FFFFFF', border: '#E8ECF4',
    text: '#0F1F3D', muted: '#6B7A99',
    accent: '#1E4FD8', accentSoft: '#EBF0FF',
    green: '#059669', greenSoft: '#D1FAE5',
    amber: '#D97706', amberSoft: '#FEF3C7',
    rose: '#DC2626', roseSoft: '#FEE2E2',
    purple: '#7C3AED', purpleSoft: '#EDE9FE',
    cyan: '#0891B2', cyanSoft: '#CFFAFE',
    indigo: '#4338CA', indigoSoft: '#EEF2FF',
    orange: '#EA580C', orangeSoft: '#FFF7ED',
};

const COLORS = [T.accent, T.green, T.amber, T.rose, T.purple, T.cyan, T.indigo, T.orange];

const STATUS_COLOR = {
    Verified: T.green, Pending: T.amber,
    Rejected: T.rose, Profile_Completed: T.accent,
};

const RETURN_COLOR = {
    Completed: T.green, Cancelled: T.muted,
    Pending: T.amber, 'In Progress': T.accent,
    Returned: T.cyan, Assessed: T.purple,
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const SectionCard = ({title, subtitle, badge, accent, children}) => (
    <Paper elevation={0} sx={{
        borderRadius: '14px', border: `1px solid ${T.border}`,
        bgcolor: T.surface, p: {xs: 2, md: 2.5}, height: '100%',
        position: 'relative', overflow: 'hidden',
    }}>
        {accent && (
            <Box sx={{position: 'absolute', top: 0, left: 0, right: 0, height: 3, bgcolor: accent, borderRadius: '14px 14px 0 0'}}/>
        )}
        {(title || subtitle) && (
            <Box sx={{mb: 2, pb: 1.5, borderBottom: `1px solid ${T.border}`, mt: accent ? 0.5 : 0}}>
                <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                    {title && <Typography sx={{fontWeight: 700, fontSize: '0.88rem', color: T.text}}>{title}</Typography>}
                    {badge && (
                        <Chip label={badge.label} size="small" sx={{
                            height: 20, fontSize: '0.65rem', fontWeight: 700,
                            bgcolor: badge.soft, color: badge.color,
                            fontFamily: 'JetBrains Mono, monospace',
                        }}/>
                    )}
                </Box>
                {subtitle && <Typography sx={{fontSize: '0.72rem', color: T.muted, mt: 0.3}}>{subtitle}</Typography>}
            </Box>
        )}
        {children}
    </Paper>
);

const TabBtn = ({label, active, onClick, count}) => (
    <Button onClick={onClick} sx={{
        borderRadius: '8px', textTransform: 'none', fontFamily: 'Plus Jakarta Sans, sans-serif',
        fontWeight: active ? 700 : 500, fontSize: '0.83rem', px: 2, py: 0.9,
        color: active ? T.accent : T.muted,
        bgcolor: active ? T.accentSoft : 'transparent',
        position: 'relative', gap: 0.8,
        '&:hover': {bgcolor: active ? T.accentSoft : T.bg},
        transition: 'all 0.15s ease',
    }}>
        {label}
        {count !== undefined && (
            <Box sx={{
                px: 0.8, py: 0.1, borderRadius: '20px', lineHeight: 1.6,
                bgcolor: active ? T.accent : T.border,
                color: active ? '#fff' : T.muted,
                fontSize: '0.6rem', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace',
            }}>{count}</Box>
        )}
        {active && (
            <Box sx={{position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 20, height: 2, bgcolor: T.accent, borderRadius: 2}}/>
        )}
    </Button>
);

const InsightCard = ({type, title, message, value, color, soft}) => (
    <Box sx={{p: 2, borderRadius: '10px', bgcolor: soft, border: `1px solid ${color}28`, display: 'flex', gap: 1.5}}>
        <Box sx={{width: 32, height: 32, borderRadius: '9px', bgcolor: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
            {type === 'warning'  ? <WarningIcon   sx={{fontSize: 16, color}}/>
                : type === 'positive' ? <TrendingUpIcon sx={{fontSize: 16, color}}/>
                    :                       <InsightsIcon   sx={{fontSize: 16, color}}/>}
        </Box>
        <Box sx={{flex: 1}}>
            <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.3}}>
                <Typography sx={{fontSize: '0.78rem', fontWeight: 700, color}}>{title}</Typography>
                {value !== undefined && (
                    <Typography sx={{fontFamily: 'JetBrains Mono, monospace', fontSize: '0.85rem', fontWeight: 700, color}}>{value}</Typography>
                )}
            </Box>
            <Typography sx={{fontSize: '0.72rem', color: T.muted, lineHeight: 1.5}}>{message}</Typography>
        </Box>
    </Box>
);

const KpiRow = ({label, value, max, color, sub}) => {
    const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
    return (
        <Box sx={{mb: 1.8, '&:last-child': {mb: 0}}}>
            <Box sx={{display: 'flex', justifyContent: 'space-between', mb: 0.6}}>
                <Typography sx={{fontSize: '0.78rem', color: T.text, fontWeight: 500}}>{label}</Typography>
                <Box sx={{display: 'flex', alignItems: 'baseline', gap: 0.5}}>
                    <Typography sx={{fontFamily: 'JetBrains Mono, monospace', fontSize: '0.82rem', fontWeight: 700, color}}>
                        {typeof value === 'number' ? value.toLocaleString() : value}
                    </Typography>
                    {sub && <Typography sx={{fontSize: '0.68rem', color: T.muted}}>{sub}</Typography>}
                </Box>
            </Box>
            <Box sx={{height: 5, bgcolor: T.bg, borderRadius: 4, overflow: 'hidden', border: `1px solid ${T.border}`}}>
                <Box sx={{height: '100%', width: `${pct}%`, bgcolor: color, borderRadius: 4, transition: 'width 0.7s ease'}}/>
            </Box>
        </Box>
    );
};

const Tt = ({active, payload, label}) => {
    if (!active || !payload?.length) return null;
    return (
        <Box sx={{bgcolor: T.surface, border: `1px solid ${T.border}`, borderRadius: '10px', p: 1.5, boxShadow: '0 8px 24px rgba(15,31,61,0.12)'}}>
            {label && <Typography sx={{fontSize: '0.75rem', fontWeight: 700, color: T.text, mb: 0.8}}>{label}</Typography>}
            {payload.map((p, i) => (
                <Box key={i} sx={{display: 'flex', alignItems: 'center', gap: 1, mb: 0.3}}>
                    <Box sx={{width: 8, height: 8, borderRadius: '50%', bgcolor: p.color}}/>
                    <Typography sx={{fontSize: '0.75rem', color: T.muted}}>{p.name}:</Typography>
                    <Typography sx={{fontSize: '0.75rem', fontWeight: 700, color: T.text, fontFamily: 'JetBrains Mono, monospace'}}>
                        {p.value?.toLocaleString()}
                    </Typography>
                </Box>
            ))}
        </Box>
    );
};

const SnapTile = ({label, value, color, sub}) => (
    <Box sx={{p: 2, borderRadius: '10px', bgcolor: T.bg, border: `1px solid ${T.border}`, textAlign: 'center'}}>
        <Typography sx={{fontFamily: 'JetBrains Mono, monospace', fontSize: '1.5rem', fontWeight: 500, color, lineHeight: 1.1, mb: 0.5}}>
            {value ?? '—'}
        </Typography>
        <Typography sx={{fontSize: '0.72rem', fontWeight: 700, color: T.text}}>{label}</Typography>
        {sub && <Typography sx={{fontSize: '0.67rem', color: T.muted, mt: 0.2}}>{sub}</Typography>}
    </Box>
);

const GrowthTile = ({label, value, color, soft, sub}) => (
    <Box sx={{p: 2, borderRadius: '12px', bgcolor: soft, border: `1px solid ${color}28`, textAlign: 'center'}}>
        <Typography sx={{fontFamily: 'JetBrains Mono, monospace', fontSize: '1.6rem', fontWeight: 500, color, lineHeight: 1.1, mb: 0.4}}>
            {typeof value === 'number' && value > 0 ? '+' : ''}{value}{typeof value === 'number' ? '%' : ''}
        </Typography>
        <Typography sx={{fontSize: '0.72rem', fontWeight: 700, color: T.text}}>{label}</Typography>
        <Typography sx={{fontSize: '0.67rem', color: T.muted, mt: 0.2}}>{sub}</Typography>
    </Box>
);

const LegendLabel = v => (
    <span style={{fontSize: '0.73rem', color: T.text, fontFamily: 'Plus Jakarta Sans, sans-serif'}}>{v}</span>
);

// ─── Main ─────────────────────────────────────────────────────────────────────
const Statistics = () => {
    const [basicStats,    setBasicStats]    = useState(null);
    const [enhancedStats, setEnhancedStats] = useState(null);
    const [dashMetrics,   setDashMetrics]   = useState(null);
    const [slaData,       setSlaData]       = useState(null);
    const [returnsData,   setReturnsData]   = useState(null);
    const [contractsData, setContractsData] = useState(null);
    const [budgetData,    setBudgetData]    = useState(null);
    const [loading,       setLoading]       = useState(true);
    const [error,         setError]         = useState(null);
    const [activeTab,     setActiveTab]     = useState(0);
    const [exporting,     setExporting]     = useState(false);

    const fetchAll = async () => {
        try {
            setLoading(true);
            setError(null);
            const yr = new Date().getFullYear();
            const [basicRes, enhRes, dashRes, slaRes, returnsRes, contractsRes, budgetRes] = await Promise.allSettled([
                adminAPI.getStatistics(),
                adminAPI.getEnhancedStatistics(),
                adminAPI.getDashboardMetrics(),
                slaAPI.getDashboard(),
                returnsAPI.summary(),
                contractsAPI.getSummary(),
                budgetAPI.spend(yr),
            ]);
            if (basicRes.status     === 'fulfilled') setBasicStats(basicRes.value.data.data.statistics);
            if (enhRes.status       === 'fulfilled') setEnhancedStats(enhRes.value.data.data.statistics);
            if (dashRes.status      === 'fulfilled') setDashMetrics(dashRes.value.data.data.metrics);
            if (slaRes.status       === 'fulfilled') setSlaData(slaRes.value.data.data);
            if (returnsRes.status   === 'fulfilled') setReturnsData(returnsRes.value.data.data || []);
            if (contractsRes.status === 'fulfilled') setContractsData(contractsRes.value.data.data);
            if (budgetRes.status    === 'fulfilled') setBudgetData(budgetRes.value.data.data);
        } catch (err) {
            setError(err.message || 'Failed to fetch statistics');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAll(); }, []); // eslint-disable-line

    const A = useMemo(() => {
        if (!basicStats || !enhancedStats) return null;

        // ── User stats ────────────────────────────────────────────────────────
        const clientStats  = basicStats.client_users?.stats   || [];
        const totalClients = basicStats.client_users?.total   || 0;
        const totalOp      = basicStats.operational_users?.total || 0;
        const totalUsers   = basicStats.total_users            || 0;

        const verified  = parseInt(clientStats.find(s => s.registration_status === 'Verified')?.count          || 0);
        const pending   = parseInt(clientStats.find(s => s.registration_status === 'Pending')?.count           || 0);
        const rejected  = parseInt(clientStats.find(s => s.registration_status === 'Rejected')?.count          || 0);
        const completed = parseInt(clientStats.find(s => s.registration_status === 'Profile_Completed')?.count || 0);

        const verificationRate = totalClients > 0 ? ((verified / totalClients) * 100).toFixed(1) : 0;
        const pendingRate      = totalClients > 0 ? ((pending  / totalClients) * 100).toFixed(1) : 0;
        const rejectionRate    = totalClients > 0 ? ((rejected / totalClients) * 100).toFixed(1) : 0;

        const statusData = clientStats.map(s => ({
            name:  s.registration_status,
            value: parseInt(s.count),
            color: STATUS_COLOR[s.registration_status] || T.muted,
        }));

        const roleData = (basicStats.operational_users?.stats || []).map(s => ({
            name: s.user_role, value: parseInt(s.count),
        }));

        // ── Growth ────────────────────────────────────────────────────────────
        const gm = enhancedStats.growth_metrics || {};
        const clientGrowth    = gm.client_growth_percentage      || 0;
        const opGrowth        = gm.operational_growth_percentage || 0;
        const totalGrowth     = gm.total_growth_percentage       || 0;
        const newClientsMonth = gm.new_clients_this_month        || 0;
        const newOpMonth      = gm.new_operational_this_month    || 0;

        const regionData = (enhancedStats.region_stats || [])
            .map(r => ({name: r.region, value: parseInt(r.count)}))
            .sort((a, b) => b.value - a.value);

        const trends = enhancedStats.monthly_trends || [];

        // ── Applications ──────────────────────────────────────────────────────
        const appStats        = enhancedStats.application_stats || {};
        const appTotal        = appStats.total          || 0;
        const appByStatus     = (appStats.by_status || []).map(s => ({
            name: s.status, value: s.count,
            color: ({Pending: T.amber, Approved: T.green, Rejected: T.rose, Processing: T.cyan, Completed: T.indigo, Cancelled: T.rose}[s.status]) || T.muted,
        }));
        const topApplicants   = appStats.top_applicants  || [];
        const activeContracts = appStats.active_contracts || 0;
        const contractRate    = appTotal > 0 ? ((activeContracts / appTotal) * 100).toFixed(0) : 0;

        // ── Devices ───────────────────────────────────────────────────────────
        const ds            = enhancedStats.device_stats || {};
        const totalDevices  = ds.total            || 0;
        const activeDevices = ds.active           || 0;
        const avgCost       = ds.avg_monthly_cost || '0.00';
        const deviceMfrData = (ds.by_manufacturer || []).map(r => ({name: r.manufacturer, value: r.count}));

        // ── Recent ────────────────────────────────────────────────────────────
        const recentAll     = enhancedStats.recent_registrations || [];
        const recentClients = recentAll.filter(r => r.user_type === 'client').slice(0, 5);
        const recentOp      = recentAll.filter(r => r.user_type === 'operational').slice(0, 5);

        const funnel = [
            {name: 'Registered',        value: totalClients,        fill: T.accent},
            {name: 'Profile Completed', value: completed + verified, fill: T.cyan},
            {name: 'Verified',          value: verified,             fill: T.green},
        ].filter(f => f.value > 0);

        const dm = dashMetrics || {};

        // ── SLA ───────────────────────────────────────────────────────────────
        const slaOverall    = slaData?.overall  || {};
        const slaStages     = slaData?.stages   || [];
        const slaCompliance = slaOverall.compliance_pct ?? null;
        const slaBreached   = slaOverall.breached ?? 0;

        // ── Returns ───────────────────────────────────────────────────────────
        const returnsArr = returnsData || [];
        const openReturns = returnsArr
            .filter(r => !['Completed', 'Cancelled'].includes(r.return_status))
            .reduce((s, r) => s + parseInt(r.total || 0), 0);
        const totalReturns = returnsArr.reduce((s, r) => s + parseInt(r.total || 0), 0);
        const returnsByStatus = returnsArr.map(r => ({
            name:  r.return_status,
            value: parseInt(r.total || 0),
            color: RETURN_COLOR[r.return_status] || T.muted,
        }));

        // ── Contracts ─────────────────────────────────────────────────────────
        const contractsTotal   = contractsData?.total       || 0;
        const contractsActive  = contractsData?.active      || activeContracts;
        const contractsExp30   = contractsData?.expiring_30 || 0;
        const contractsExp60   = contractsData?.expiring_60 || 0;
        const contractsExp90   = contractsData?.expiring_90 || 0;
        const contractsExpired = contractsData?.expired     || 0;

        // ── Budget ────────────────────────────────────────────────────────────
        const budgetDepts  = budgetData?.departments || [];
        const overBudget   = budgetData?.over_budget  || 0;
        const nearLimit    = budgetData?.near_limit   || 0;
        const fiscalYear   = budgetData?.fiscal_year;

        // ── Insights ──────────────────────────────────────────────────────────
        const insights = [];
        if (parseFloat(pendingRate) > 30)
            insights.push({type: 'warning', color: T.amber, soft: T.amberSoft, title: 'High Pending Rate', message: `${pendingRate}% of registrations are pending. Verification backlog is ${dm.pending_approvals || 0} clients. Avg turnaround: ${dm.avg_verification_days || '—'} days.`, value: `${pendingRate}%`});
        if (parseFloat(rejectionRate) > 15)
            insights.push({type: 'warning', color: T.rose, soft: T.roseSoft, title: 'Elevated Rejection Rate', message: `${rejectionRate}% of registrations are rejected. This may indicate friction in the document submission or guidance process.`, value: `${rejectionRate}%`});
        if (clientGrowth > 20)
            insights.push({type: 'positive', color: T.green, soft: T.greenSoft, title: 'Strong Client Growth', message: `Client registrations grew ${clientGrowth}% this month (${newClientsMonth} new clients). Plan for increased verification workload.`, value: `+${clientGrowth}%`});
        if (clientGrowth < 0)
            insights.push({type: 'warning', color: T.rose, soft: T.roseSoft, title: 'Registration Decline', message: `New client registrations dropped ${Math.abs(clientGrowth)}% vs last month. Review outreach and onboarding friction points.`, value: `${clientGrowth}%`});
        if (parseFloat(verificationRate) > 70)
            insights.push({type: 'positive', color: T.green, soft: T.greenSoft, title: 'Healthy Verification Rate', message: `${verificationRate}% of clients are verified — above the 70% health benchmark. Pipeline is performing well.`, value: `${verificationRate}%`});
        if (dm.pending_approvals > 20)
            insights.push({type: 'neutral', color: T.amber, soft: T.amberSoft, title: 'Approval Queue Growing', message: `${dm.pending_approvals} approvals pending. Avg verification time is ${dm.avg_verification_days} days — consider setting SLA targets.`, value: dm.pending_approvals});
        if (totalDevices > 0 && activeDevices < totalDevices * 0.6)
            insights.push({type: 'warning', color: T.orange, soft: T.orangeSoft, title: 'Low Active Device Ratio', message: `Only ${activeDevices} of ${totalDevices} catalog devices are active. Review inactive/discontinued devices.`, value: `${activeDevices}/${totalDevices}`});
        if (appTotal > 0 && parseFloat(contractRate) > 50)
            insights.push({type: 'positive', color: T.indigo, soft: T.indigoSoft, title: 'Strong Contract Conversion', message: `${contractRate}% of applications have resulted in active contracts. Fulfilment pipeline is healthy.`, value: `${contractRate}%`});
        if (slaCompliance != null && slaCompliance < 80)
            insights.push({type: 'warning', color: T.rose, soft: T.roseSoft, title: 'SLA Compliance Below Target', message: `SLA compliance is at ${slaCompliance}% — target is 80%. ${slaBreached} stage${slaBreached !== 1 ? 's' : ''} currently breached. Review processing times per stage.`, value: `${slaCompliance}%`});
        if (slaCompliance != null && slaCompliance >= 80)
            insights.push({type: 'positive', color: T.green, soft: T.greenSoft, title: 'SLA Compliance On Track', message: `SLA compliance is ${slaCompliance}% — meeting the 80% benchmark. Continue monitoring stage processing times.`, value: `${slaCompliance}%`});
        if (openReturns > 5)
            insights.push({type: 'warning', color: T.orange, soft: T.orangeSoft, title: 'Open Device Returns', message: `${openReturns} device return${openReturns !== 1 ? 's' : ''} awaiting collection or assessment. Delays here can block device reallocation.`, value: openReturns});
        if (overBudget > 0)
            insights.push({type: 'warning', color: T.rose, soft: T.roseSoft, title: 'Departments Over Budget', message: `${overBudget} department${overBudget > 1 ? 's are' : ' is'} over monthly spending ceiling. Immediate review and approval required.`, value: overBudget});
        if (contractsExp30 > 5)
            insights.push({type: 'warning', color: T.amber, soft: T.amberSoft, title: 'Contracts Expiring Soon', message: `${contractsExp30} contract${contractsExp30 > 1 ? 's expire' : ' expires'} within 30 days. Coordinate renewals to avoid service gaps.`, value: contractsExp30});

        return {
            totalUsers, totalClients, totalOp,
            verified, pending, rejected, completed,
            verificationRate, pendingRate, rejectionRate,
            statusData, roleData,
            clientGrowth, opGrowth, totalGrowth, newClientsMonth, newOpMonth,
            regionData, trends,
            appTotal, appByStatus, topApplicants, activeContracts, contractRate,
            totalDevices, activeDevices, avgCost, deviceMfrData,
            recentClients, recentOp,
            funnel, insights, dm,
            slaCompliance, slaBreached, slaStages,
            openReturns, totalReturns, returnsByStatus,
            contractsTotal, contractsActive, contractsExp30, contractsExp60, contractsExp90, contractsExpired,
            budgetDepts, overBudget, nearLimit, fiscalYear,
        };
    }, [basicStats, enhancedStats, dashMetrics, slaData, returnsData, contractsData, budgetData]);

    // ── Excel export ──────────────────────────────────────────────────────────
    const handleExport = () => {
        if (!A) return;
        setExporting(true);
        try {
            const wb  = XLSX.utils.book_new();
            const now = new Date();
            const dateStr = now.toLocaleDateString('en-ZA');
            const timeStr = now.toLocaleTimeString('en-ZA');
            const addSheet = (name, rows) => {
                const ws = XLSX.utils.aoa_to_sheet(rows);
                ws['!cols'] = Array(10).fill({wch: 28});
                XLSX.utils.book_append_sheet(wb, ws, name);
            };

            addSheet('Executive Summary', [
                ['JUDICIAL ADMIN PORTAL — ANALYTICS REPORT'],
                [`Generated: ${dateStr} at ${timeStr}`],
                [],
                ['SECTION', 'METRIC', 'VALUE'],
                ['Users', 'Total Users', A.totalUsers], ['Users', 'Client Users', A.totalClients], ['Users', 'Staff Members', A.totalOp],
                ['Users', 'Verified', A.verified], ['Users', 'Pending', A.pending], ['Users', 'Rejected', A.rejected],
                [],
                ['Rates', 'Verification Rate (%)', parseFloat(A.verificationRate)],
                ['Rates', 'Pending Rate (%)', parseFloat(A.pendingRate)],
                ['Rates', 'Rejection Rate (%)', parseFloat(A.rejectionRate)],
                [],
                ['Growth', 'Client Growth MoM (%)', A.clientGrowth], ['Growth', 'Staff Growth MoM (%)', A.opGrowth],
                ['Growth', 'New Clients This Month', A.newClientsMonth], ['Growth', 'New Staff This Month', A.newOpMonth],
                [],
                ['Applications', 'Total', A.appTotal], ['Applications', 'Active Contracts', A.contractsActive], ['Applications', 'Contract Rate (%)', parseFloat(A.contractRate)],
                [],
                ['Contracts', 'Total', A.contractsTotal], ['Contracts', 'Active', A.contractsActive],
                ['Contracts', 'Expiring 30d', A.contractsExp30], ['Contracts', 'Expiring 60d', A.contractsExp60], ['Contracts', 'Expired', A.contractsExpired],
                [],
                ['SLA', 'Overall Compliance (%)', A.slaCompliance ?? 'N/A'], ['SLA', 'Stages Breached', A.slaBreached],
                [],
                ['Returns', 'Total', A.totalReturns], ['Returns', 'Open', A.openReturns],
                [],
                ['Devices', 'Total', A.totalDevices], ['Devices', 'Active', A.activeDevices], ['Devices', 'Avg Cost (R)', parseFloat(A.avgCost)],
                [],
                ['Live', "Today's Registrations", A.dm.todays_registrations ?? 0],
                ['Live', 'Pending Approvals', A.dm.pending_approvals ?? 0],
                ['Live', 'Verified This Week', A.dm.recently_verified ?? 0],
                ['Live', "Today's Applications", A.dm.todays_applications ?? 0],
            ]);

            addSheet('Client Status & Roles', [
                ['CLIENT STATUS'], [], ['Status', 'Count', 'Percentage (%)'],
                ...A.statusData.map(s => [s.name, s.value, A.totalClients > 0 ? parseFloat(((s.value / A.totalClients) * 100).toFixed(2)) : 0]),
                [], ['OPERATIONAL ROLES'], [], ['Role', 'Count', 'Percentage (%)'],
                ...A.roleData.map(r => [r.name, r.value, A.totalOp > 0 ? parseFloat(((r.value / A.totalOp) * 100).toFixed(2)) : 0]),
            ]);

            addSheet('Applications & Contracts', [
                ['APPLICATIONS'], [], ['Metric', 'Value'],
                ['Total', A.appTotal], ['Active Contracts', A.contractsActive], ['Contract Rate (%)', parseFloat(A.contractRate)],
                [], ['APPLICATION STATUS'], ['Status', 'Count', '%'],
                ...A.appByStatus.map(s => [s.name, s.value, A.appTotal > 0 ? parseFloat(((s.value / A.appTotal) * 100).toFixed(2)) : 0]),
                [], ['CONTRACT LIFECYCLE'], ['Metric', 'Value'],
                ['Total', A.contractsTotal], ['Active', A.contractsActive], ['Expiring 30d', A.contractsExp30],
                ['Expiring 60d', A.contractsExp60], ['Expiring 90d', A.contractsExp90], ['Expired', A.contractsExpired],
                [], ['TOP APPLICANTS'], ['Rank', 'Name', 'Client ID', 'Count'],
                ...A.topApplicants.map((u, i) => [i + 1, `${u.first_name} ${u.last_name}`, u.client_user_id, u.application_count]),
            ]);

            addSheet('Device Catalog', [
                ['DEVICE SUMMARY'], [], ['Metric', 'Value'],
                ['Total', A.totalDevices], ['Active', A.activeDevices], ['Inactive/Disc', A.totalDevices - A.activeDevices],
                ['Active Ratio (%)', A.totalDevices > 0 ? parseFloat(((A.activeDevices / A.totalDevices) * 100).toFixed(1)) : 0],
                ['Avg Cost (R)', parseFloat(A.avgCost)],
                [], ['BY MANUFACTURER'], ['Manufacturer', 'Count', 'Share (%)'],
                ...A.deviceMfrData.map(d => [d.name, d.value, A.totalDevices > 0 ? parseFloat(((d.value / A.totalDevices) * 100).toFixed(2)) : 0]),
            ]);

            addSheet('Growth & Trends', [
                ['MONTHLY TRENDS'], [], ['Month', 'New Clients', 'New Staff', 'Total'],
                ...A.trends.map(t => [t.month, t.clients, t.operational, t.total]),
                [], ['GROWTH SUMMARY'], ['Metric', 'Value'],
                ['Client Growth MoM (%)', A.clientGrowth], ['Staff Growth MoM (%)', A.opGrowth],
                ['Total Growth MoM (%)', A.totalGrowth], ['New Clients', A.newClientsMonth], ['New Staff', A.newOpMonth],
            ]);

            addSheet('Regional Breakdown', [
                ['CLIENT USERS BY REGION'], [`Total: ${A.totalClients}`], [],
                ['Rank', 'Region', 'Count', 'Share (%)'],
                ...A.regionData.map((r, i) => [i + 1, r.name, r.value, A.totalClients > 0 ? parseFloat(((r.value / A.totalClients) * 100).toFixed(2)) : 0]),
                [], ['Most Active Today', A.dm.most_active_region ?? 'N/A'],
            ]);

            addSheet('Recent Registrations', [
                ['RECENT CLIENTS'], [], ['Full Name', 'Email', 'Status', 'Date'],
                ...A.recentClients.map(r => [`${r.first_name} ${r.last_name}`, r.email, r.registration_status, new Date(r.created_at).toLocaleDateString('en-ZA')]),
                [], ['RECENT STAFF'], [], ['Full Name', 'Email', 'Date'],
                ...A.recentOp.map(r => [`${r.first_name} ${r.last_name}`, r.email, new Date(r.created_at).toLocaleDateString('en-ZA')]),
            ]);

            addSheet('SLA & Returns', [
                ['SLA COMPLIANCE'], [], ['Metric', 'Value'],
                ['Overall Compliance (%)', A.slaCompliance ?? 'N/A'], ['Stages Breached', A.slaBreached],
                [], ['SLA BY STAGE'], ['Stage', 'Total', 'Within SLA', 'Approaching', 'Breached', 'Avg Days', 'SLA Days', 'Compliance (%)'],
                ...A.slaStages.map(s => {
                    const total = parseInt(s.total) || 1;
                    return [s.stage_name, s.total, s.within_sla, s.approaching_sla, s.breached_sla, s.avg_days_in_stage, s.sla_threshold_days, Math.round((parseInt(s.within_sla) / total) * 100)];
                }),
                [], ['DEVICE RETURNS'], ['Status', 'Total', 'Completed Count'],
                ...(returnsData || []).map(r => [r.return_status, r.total, r.completed_count || 0]),
                [], ['Open Returns', A.openReturns], ['Total Returns', A.totalReturns],
            ]);

            addSheet('Budget', [
                [`DEPARTMENTAL BUDGET — FY ${A.fiscalYear || new Date().getFullYear()}`], [],
                ['Departments Over Budget', A.overBudget], ['Departments Near Limit', A.nearLimit],
                [], ['SPEND BY DEPARTMENT'], ['Department', 'Contracts', 'Monthly Spend (R)', 'Ceiling (R)', 'Utilisation (%)', 'Status'],
                ...A.budgetDepts.map(d => [d.department_id, d.active_contracts, parseFloat(d.monthly_spend || 0), d.monthly_ceiling ? parseFloat(d.monthly_ceiling) : 'None', d.utilisation_pct ?? 'N/A', d.status || 'ok']),
            ]);

            addSheet('System Health & Insights', [
                ['SYSTEM HEALTH KPIs'], [], ['KPI', 'Value', 'Status', 'Note'],
                ['Verification Rate', `${A.verificationRate}%`, parseFloat(A.verificationRate) >= 60 ? 'PASS' : 'WARN', 'Target: ≥ 60%'],
                ['Rejection Rate', `${A.rejectionRate}%`, parseFloat(A.rejectionRate) <= 15 ? 'PASS' : 'WARN', 'Target: ≤ 15%'],
                ['Client Growth MoM', `${A.clientGrowth}%`, A.clientGrowth >= 0 ? 'PASS' : 'WARN', 'Positive is good'],
                ['Pending Backlog', `${A.pendingRate}%`, parseFloat(A.pendingRate) <= 25 ? 'PASS' : 'WARN', 'Target: ≤ 25%'],
                ['Avg Verify Time', `${A.dm.avg_verification_days ?? '—'}d`, parseFloat(A.dm.avg_verification_days) <= 3 ? 'PASS' : 'WARN', 'Target: ≤ 3 days'],
                ['SLA Compliance', A.slaCompliance != null ? `${A.slaCompliance}%` : 'N/A', A.slaCompliance == null || A.slaCompliance >= 80 ? 'PASS' : 'WARN', 'Target: ≥ 80%'],
                ['Open Returns', A.openReturns, A.openReturns <= 5 ? 'PASS' : 'WARN', 'Target: ≤ 5'],
                ['Over-budget Depts', A.overBudget, A.overBudget === 0 ? 'PASS' : 'WARN', 'Target: 0'],
                ['Device Catalog', `${A.activeDevices}/${A.totalDevices}`, A.totalDevices === 0 || A.activeDevices >= A.totalDevices * 0.6 ? 'PASS' : 'WARN', 'Target: ≥ 60% active'],
                ['Contract Fulfilment', `${A.contractRate}%`, parseFloat(A.contractRate) >= 30 ? 'PASS' : 'WARN', 'Target: ≥ 30%'],
                [], ['INSIGHTS'], A.insights.length === 0 ? ['All metrics healthy'] : ['Type', 'Title', 'Detail', 'Value'],
                ...A.insights.map(ins => [ins.type.toUpperCase(), ins.title, ins.message, ins.value ?? '']),
            ]);

            XLSX.writeFile(wb, `judicial-analytics-${now.toISOString().split('T')[0]}.xlsx`);
        } finally {
            setExporting(false);
        }
    };

    const TABS = [
        {label: 'Executive Summary'},
        {label: 'Registration Health'},
        {label: 'Applications & Contracts'},
        {label: 'Device Catalog'},
        {label: 'Growth & Trends'},
        {label: 'Regional Breakdown'},
        {label: 'Recent Activity'},
        {label: 'SLA & Returns'},
        {label: 'Budget'},
        {label: 'Insights', count: A?.insights?.length || 0},
    ];

    if (loading && !basicStats) return (
        <Box sx={{display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400, bgcolor: T.bg}}>
            <CircularProgress sx={{color: T.accent}}/>
        </Box>
    );

    if (error) return (
        <Box sx={{p: 3, bgcolor: T.bg}}>
            <Box sx={{borderRadius: '10px', p: 2.5, bgcolor: T.roseSoft, border: `1px solid ${T.rose}28`}}>
                <Typography sx={{fontSize: '0.85rem', color: T.rose, fontWeight: 600}}>{error}</Typography>
                <Button onClick={fetchAll} size="small" sx={{mt: 1, borderRadius: '8px', textTransform: 'none', fontWeight: 700, color: T.rose}}>Retry</Button>
            </Box>
        </Box>
    );

    return (
        <Box sx={{p: {xs: 2, md: 3.5}, bgcolor: T.bg, minHeight: '100vh'}}>
            <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>

            {/* ── Header ────────────────────────────────────────────────── */}
            <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2, animation: 'fadeUp 0.4s ease-out'}}>
                <Box>
                    <Box sx={{display: 'flex', alignItems: 'center', gap: 1.2, mb: 0.3}}>
                        <Box sx={{p: 1, borderRadius: '10px', bgcolor: T.purpleSoft}}>
                            <AssessmentIcon sx={{fontSize: 20, color: T.purple}}/>
                        </Box>
                        <Typography sx={{fontSize: {xs: '1.25rem', md: '1.6rem'}, fontWeight: 800, color: T.text, letterSpacing: '-0.3px'}}>
                            System Statistics & Metrics
                        </Typography>
                    </Box>
                    <Typography sx={{fontSize: '0.75rem', color: T.muted, ml: 0.5}}>
                        Full-system decision-support · Users · Applications · Devices · Contracts · SLA · Returns · Budget
                        {A?.dm?.timestamp && ` · Updated ${new Date(A.dm.timestamp).toLocaleTimeString()}`}
                    </Typography>
                </Box>
                <Box sx={{display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center'}}>
                    <Button onClick={handleExport} disabled={!A || exporting}
                        startIcon={<DownloadIcon sx={{fontSize: '16px !important'}}/>} variant="outlined" size="small"
                        sx={{borderRadius: '10px', textTransform: 'none', fontWeight: 600, fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '0.81rem',
                            color: T.green, borderColor: T.green, bgcolor: T.surface,
                            '&:hover': {bgcolor: T.greenSoft, borderColor: T.green}, '&:disabled': {opacity: 0.5}}}>
                        {exporting ? 'Exporting…' : 'Export Excel'}
                    </Button>
                    <Button onClick={fetchAll} startIcon={<RefreshIcon sx={{fontSize: '16px !important'}}/>} variant="outlined" size="small"
                        sx={{borderRadius: '10px', textTransform: 'none', fontWeight: 600, fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '0.81rem',
                            color: T.muted, borderColor: T.border, bgcolor: T.surface,
                            '&:hover': {bgcolor: T.bg, borderColor: T.accent, color: T.accent}}}>
                        Refresh
                    </Button>
                </Box>
            </Box>

            {/* ── 8 KPI cards ────────────────────────────────────────────── */}
            {A && (
                <Grid container spacing={2} sx={{mb: 3}}>
                    {[
                        {title: 'Total Users',       value: A.totalUsers,       icon: PeopleIcon,    color: T.accent, soft: T.accentSoft, change: A.totalGrowth},
                        {title: 'Client Users',      value: A.totalClients,     icon: PersonIcon,    color: T.green,  soft: T.greenSoft,  change: A.clientGrowth, description: `${A.newClientsMonth} new this month`},
                        {title: 'Verification Rate', value: `${A.verificationRate}%`, icon: CheckCircleIcon, color: T.cyan, soft: T.cyanSoft, description: `${A.verified} of ${A.totalClients}`},
                        {title: 'SLA Compliance',    value: A.slaCompliance != null ? `${A.slaCompliance}%` : '—', icon: SlaIcon,
                            color: A.slaCompliance == null ? T.muted : A.slaCompliance >= 80 ? T.green : A.slaCompliance >= 60 ? T.amber : T.rose,
                            soft: A.slaCompliance == null ? T.bg : A.slaCompliance >= 80 ? T.greenSoft : A.slaCompliance >= 60 ? T.amberSoft : T.roseSoft,
                            description: `${A.slaBreached} stages breached`},
                        {title: 'Applications',      value: A.appTotal || '—',  icon: AppIcon,       color: T.orange, soft: T.orangeSoft, description: 'total submitted'},
                        {title: 'Active Contracts',  value: A.contractsActive || A.activeContracts, icon: ContractIcon, color: T.indigo, soft: T.indigoSoft,
                            description: `${A.contractsExp30 > 0 ? A.contractsExp30 + ' expiring 30d' : 'none expiring soon'}`},
                        {title: 'Open Returns',      value: A.openReturns,      icon: ReturnIcon,
                            color: A.openReturns > 0 ? T.rose : T.green, soft: A.openReturns > 0 ? T.roseSoft : T.greenSoft, description: `of ${A.totalReturns} total`},
                        {title: 'Staff Members',     value: A.totalOp,          icon: GroupWorkIcon, color: T.purple, soft: T.purpleSoft, change: A.opGrowth, description: `${A.newOpMonth} added this month`},
                    ].map(s => (
                        <Grid item xs={6} sm={4} md={3} key={s.title}><StatsCard {...s}/></Grid>
                    ))}
                </Grid>
            )}

            {/* ── Tab bar ────────────────────────────────────────────────── */}
            <Paper elevation={0} sx={{borderRadius: '14px', border: `1px solid ${T.border}`, bgcolor: T.surface, p: 0.8, mb: 2.5, display: 'flex', gap: 0.5, flexWrap: 'wrap'}}>
                {TABS.map((tab, i) => (
                    <TabBtn key={tab.label} label={tab.label} active={activeTab === i} count={tab.count} onClick={() => setActiveTab(i)}/>
                ))}
            </Paper>

            {/* ════════ TAB 0 — EXECUTIVE SUMMARY ════════ */}
            {activeTab === 0 && A && (
                <Grid container spacing={2.5}>
                    <Grid item xs={12} md={4}>
                        <SectionCard title="Registration Pipeline" subtitle="Client journey from sign-up to verified" accent={T.accent}>
                            {A.funnel.map(stage => (
                                <KpiRow key={stage.name} label={stage.name} value={stage.value} max={A.totalClients} color={stage.fill}
                                        sub={A.totalClients > 0 ? `${((stage.value / A.totalClients) * 100).toFixed(0)}%` : ''}/>
                            ))}
                            <Divider sx={{borderColor: T.border, my: 2}}/>
                            <Box sx={{display: 'flex', justifyContent: 'space-between'}}>
                                <Box>
                                    <Typography sx={{fontSize: '0.68rem', color: T.muted, textTransform: 'uppercase', letterSpacing: 0.7}}>Conversion</Typography>
                                    <Typography sx={{fontFamily: 'JetBrains Mono, monospace', fontSize: '1.4rem', fontWeight: 500, color: T.green}}>{A.verificationRate}%</Typography>
                                </Box>
                                <Box sx={{textAlign: 'right'}}>
                                    <Typography sx={{fontSize: '0.68rem', color: T.muted, textTransform: 'uppercase', letterSpacing: 0.7}}>Drop-off</Typography>
                                    <Typography sx={{fontFamily: 'JetBrains Mono, monospace', fontSize: '1.4rem', fontWeight: 500, color: parseFloat(A.rejectionRate) > 15 ? T.rose : T.amber}}>{A.rejectionRate}%</Typography>
                                </Box>
                            </Box>
                        </SectionCard>
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <SectionCard title="Client Status Distribution" subtitle={`${A.totalClients.toLocaleString()} total clients`} accent={T.green}>
                            <Box sx={{height: 220}}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={A.statusData} cx="50%" cy="50%" outerRadius={85} innerRadius={52} dataKey="value" paddingAngle={3}>
                                            {A.statusData.map((e, i) => <Cell key={i} fill={e.color || COLORS[i % COLORS.length]}/>)}
                                        </Pie>
                                        <RechartsTooltip content={<Tt/>}/>
                                        <Legend iconType="circle" iconSize={7} formatter={LegendLabel}/>
                                    </PieChart>
                                </ResponsiveContainer>
                            </Box>
                        </SectionCard>
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <SectionCard title="System-Wide Activity" subtitle="Applications · contracts · SLA · devices · returns" accent={T.purple}>
                            <Box sx={{display: 'flex', flexDirection: 'column', gap: 1}}>
                                {[
                                    {label: 'Total Applications',   value: A.appTotal,                              max: A.appTotal || 1,      color: T.orange},
                                    {label: 'Active Contracts',     value: A.contractsActive || A.activeContracts,  max: A.appTotal || 1,      color: T.indigo},
                                    {label: 'Active Devices',       value: A.activeDevices,                         max: A.totalDevices || 1,  color: T.purple},
                                    {label: 'SLA Compliance',       value: A.slaCompliance != null ? `${A.slaCompliance}%` : '—', max: 100,   color: A.slaCompliance >= 80 ? T.green : T.amber},
                                    {label: 'Open Returns',         value: A.openReturns,                           max: Math.max(A.totalReturns, 1), color: A.openReturns > 0 ? T.rose : T.green},
                                ].map(r => <KpiRow key={r.label} {...r}/>)}
                            </Box>
                        </SectionCard>
                    </Grid>

                    {A.dm.todays_registrations !== undefined && (
                        <Grid item xs={12}>
                            <SectionCard title="Today's Snapshot" subtitle="Live metrics from the backend"
                                         accent={T.cyan} badge={{label: 'LIVE', color: T.green, soft: T.greenSoft}}>
                                <Grid container spacing={2}>
                                    {[
                                        {label: "Today's Registrations", value: A.dm.todays_registrations,  color: T.accent, sub: `${A.dm.daily_growth > 0 ? '+' : ''}${A.dm.daily_growth}% vs yesterday`},
                                        {label: 'Pending Approvals',     value: A.dm.pending_approvals,     color: T.amber,  sub: 'awaiting review'},
                                        {label: 'Verified This Week',    value: A.dm.recently_verified,     color: T.green,  sub: 'last 7 days'},
                                        {label: "Today's Applications",  value: A.dm.todays_applications,   color: T.orange, sub: 'submitted today'},
                                        {label: 'Active Contracts',      value: A.dm.active_contracts,      color: T.indigo, sub: `${A.dm.contract_fulfilment_rate}% fulfilment`},
                                        {label: 'SLA Compliance',        value: A.slaCompliance != null ? `${A.slaCompliance}%` : '—', color: A.slaCompliance >= 80 ? T.green : T.amber, sub: `${A.slaBreached} breached`},
                                        {label: 'Open Returns',          value: A.openReturns,              color: A.openReturns > 0 ? T.rose : T.green, sub: 'pending action'},
                                        {label: 'Avg. Verify Time',      value: `${A.dm.avg_verification_days}d`, color: T.purple, sub: 'days per client'},
                                    ].map(m => (
                                        <Grid item xs={6} sm={4} md={3} key={m.label}><SnapTile {...m}/></Grid>
                                    ))}
                                </Grid>
                            </SectionCard>
                        </Grid>
                    )}
                </Grid>
            )}

            {/* ════════ TAB 1 — REGISTRATION HEALTH ════════ */}
            {activeTab === 1 && A && (
                <Grid container spacing={2.5}>
                    <Grid item xs={12} md={4}>
                        <SectionCard title="Health Score" subtitle="Verification, rejection & pending rates" accent={T.green}>
                            <Box sx={{display: 'flex', flexDirection: 'column', gap: 1.5, pt: 0.5}}>
                                {[
                                    {label: 'Verified',          value: A.verified,  max: A.totalClients, color: T.green,  sub: `${A.verificationRate}%`},
                                    {label: 'Pending',           value: A.pending,   max: A.totalClients, color: T.amber,  sub: `${A.pendingRate}%`},
                                    {label: 'Profile Completed', value: A.completed, max: A.totalClients, color: T.accent, sub: A.totalClients > 0 ? `${((A.completed / A.totalClients) * 100).toFixed(1)}%` : '0%'},
                                    {label: 'Rejected',          value: A.rejected,  max: A.totalClients, color: T.rose,   sub: `${A.rejectionRate}%`},
                                ].map(r => <KpiRow key={r.label} {...r}/>)}
                                <Box sx={{mt: 1, p: 1.5, borderRadius: '8px', textAlign: 'center', bgcolor: parseFloat(A.verificationRate) >= 60 ? T.greenSoft : T.amberSoft, border: `1px solid ${parseFloat(A.verificationRate) >= 60 ? T.green : T.amber}28`}}>
                                    <Typography sx={{fontSize: '0.7rem', fontWeight: 700, color: parseFloat(A.verificationRate) >= 60 ? T.green : T.amber}}>
                                        {parseFloat(A.verificationRate) >= 60 ? '✓ Pipeline is healthy' : '⚠ Verification rate below 60%'}
                                    </Typography>
                                </Box>
                            </Box>
                        </SectionCard>
                    </Grid>
                    <Grid item xs={12} md={8}>
                        <SectionCard title="Status Breakdown" subtitle="Volume per registration status" accent={T.accent}>
                            <Box sx={{height: 300}}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={A.statusData} barSize={44}>
                                        <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false}/>
                                        <XAxis dataKey="name" tick={{fontSize: 11, fill: T.muted}} axisLine={false} tickLine={false}/>
                                        <YAxis tick={{fontSize: 11, fill: T.muted}} axisLine={false} tickLine={false}/>
                                        <RechartsTooltip content={<Tt/>}/>
                                        <Bar dataKey="value" name="Clients" radius={[7, 7, 0, 0]}>
                                            {A.statusData.map((e, i) => <Cell key={i} fill={e.color || COLORS[i % COLORS.length]}/>)}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </Box>
                        </SectionCard>
                    </Grid>
                    <Grid item xs={12} md={5}>
                        <SectionCard title="Operational User Roles" subtitle={`${A.totalOp} staff members`} accent={T.purple}>
                            <Box sx={{height: 220}}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={A.roleData} cx="50%" cy="50%" outerRadius={80} innerRadius={45} dataKey="value" paddingAngle={4}>
                                            {A.roleData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>)}
                                        </Pie>
                                        <RechartsTooltip content={<Tt/>}/>
                                        <Legend iconType="circle" iconSize={7} formatter={LegendLabel}/>
                                    </PieChart>
                                </ResponsiveContainer>
                            </Box>
                        </SectionCard>
                    </Grid>
                    <Grid item xs={12} md={7}>
                        <SectionCard title="Role Headcount" subtitle="Staff per role" accent={T.indigo}>
                            <Box sx={{height: 220}}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={A.roleData} barSize={40} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" stroke={T.border} horizontal={false}/>
                                        <XAxis type="number" tick={{fontSize: 11, fill: T.muted}} axisLine={false} tickLine={false}/>
                                        <YAxis type="category" dataKey="name" tick={{fontSize: 11, fill: T.muted}} axisLine={false} tickLine={false} width={70}/>
                                        <RechartsTooltip content={<Tt/>}/>
                                        <Bar dataKey="value" name="Staff" radius={[0, 7, 7, 0]}>
                                            {A.roleData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>)}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </Box>
                        </SectionCard>
                    </Grid>
                </Grid>
            )}

            {/* ════════ TAB 2 — APPLICATIONS & CONTRACTS ════════ */}
            {activeTab === 2 && A && (
                <Grid container spacing={2.5}>
                    <Grid item xs={12}>
                        <Grid container spacing={2}>
                            {[
                                {label: 'Total Applications', value: A.appTotal,                              color: T.orange, soft: T.orangeSoft, sub: 'ever submitted'},
                                {label: 'Active Contracts',   value: A.contractsActive || A.activeContracts,  color: T.green,  soft: T.greenSoft,  sub: 'delivered orders'},
                                {label: 'Expiring 30 days',  value: A.contractsExp30,                         color: A.contractsExp30 > 5 ? T.rose : T.amber, soft: A.contractsExp30 > 5 ? T.roseSoft : T.amberSoft, sub: 'need renewal soon'},
                                {label: 'Total Contracts',   value: A.contractsTotal,                         color: T.indigo, soft: T.indigoSoft, sub: 'in system'},
                            ].map(m => (
                                <Grid item xs={6} sm={3} key={m.label}>
                                    <Box sx={{p: 2, borderRadius: '12px', bgcolor: m.soft, border: `1px solid ${m.color}28`, textAlign: 'center'}}>
                                        <Typography sx={{fontFamily: 'JetBrains Mono, monospace', fontSize: '1.6rem', fontWeight: 500, color: m.color, lineHeight: 1.1, mb: 0.4}}>{m.value ?? '—'}</Typography>
                                        <Typography sx={{fontSize: '0.72rem', fontWeight: 700, color: T.text}}>{m.label}</Typography>
                                        <Typography sx={{fontSize: '0.67rem', color: T.muted, mt: 0.2}}>{m.sub}</Typography>
                                    </Box>
                                </Grid>
                            ))}
                        </Grid>
                    </Grid>
                    <Grid item xs={12}>
                        <SectionCard title="Contract Lifecycle" subtitle="Full status breakdown across all contracts" accent={T.indigo}>
                            <Grid container spacing={2}>
                                {[
                                    {label: 'Total',        value: A.contractsTotal,    color: T.accent},
                                    {label: 'Active',       value: A.contractsActive,   color: T.green},
                                    {label: 'Expiring 30d', value: A.contractsExp30,    color: A.contractsExp30 > 0 ? T.rose : T.muted},
                                    {label: 'Expiring 60d', value: A.contractsExp60,    color: T.amber},
                                    {label: 'Expiring 90d', value: A.contractsExp90,    color: T.amber},
                                    {label: 'Expired',      value: A.contractsExpired,  color: T.muted},
                                ].map(m => (
                                    <Grid item xs={6} sm={2} key={m.label}>
                                        <Box sx={{p: 1.5, borderRadius: '10px', bgcolor: T.bg, border: `1px solid ${T.border}`, textAlign: 'center'}}>
                                            <Typography sx={{fontFamily: 'JetBrains Mono, monospace', fontSize: '1.4rem', fontWeight: 500, color: m.color, lineHeight: 1.1, mb: 0.3}}>{m.value ?? '—'}</Typography>
                                            <Typography sx={{fontSize: '0.68rem', fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.04em'}}>{m.label}</Typography>
                                        </Box>
                                    </Grid>
                                ))}
                            </Grid>
                        </SectionCard>
                    </Grid>
                    {A.appByStatus.length > 0 ? (
                        <>
                            <Grid item xs={12} md={5}>
                                <SectionCard title="Applications by Status" subtitle="Current pipeline distribution" accent={T.orange}>
                                    <Box sx={{height: 260}}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie data={A.appByStatus} cx="50%" cy="50%" outerRadius={90} innerRadius={50} dataKey="value" paddingAngle={3}>
                                                    {A.appByStatus.map((e, i) => <Cell key={i} fill={e.color || COLORS[i % COLORS.length]}/>)}
                                                </Pie>
                                                <RechartsTooltip content={<Tt/>}/>
                                                <Legend iconType="circle" iconSize={7} formatter={LegendLabel}/>
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </Box>
                                </SectionCard>
                            </Grid>
                            <Grid item xs={12} md={7}>
                                <SectionCard title="Status Volume" subtitle="Applications per status" accent={T.orange}>
                                    <Box sx={{height: 260}}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={A.appByStatus} barSize={36}>
                                                <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false}/>
                                                <XAxis dataKey="name" tick={{fontSize: 11, fill: T.muted}} axisLine={false} tickLine={false}/>
                                                <YAxis tick={{fontSize: 11, fill: T.muted}} axisLine={false} tickLine={false}/>
                                                <RechartsTooltip content={<Tt/>}/>
                                                <Bar dataKey="value" name="Applications" radius={[6, 6, 0, 0]}>
                                                    {A.appByStatus.map((e, i) => <Cell key={i} fill={e.color || COLORS[i % COLORS.length]}/>)}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </Box>
                                </SectionCard>
                            </Grid>
                        </>
                    ) : (
                        <Grid item xs={12}>
                            <Paper elevation={0} sx={{p: 5, textAlign: 'center', borderRadius: '14px', border: `1px solid ${T.border}`}}>
                                <AppIcon sx={{fontSize: 44, color: T.border, mb: 1.5}}/>
                                <Typography sx={{fontSize: '0.88rem', color: T.muted}}>Application status data unavailable</Typography>
                            </Paper>
                        </Grid>
                    )}
                    {A.topApplicants.length > 0 && (
                        <Grid item xs={12} md={6}>
                            <SectionCard title="Top Applicants" subtitle="Clients with the most applications" accent={T.accent}>
                                {A.topApplicants.map((u, i) => (
                                    <Box key={u.client_user_id} sx={{display: 'flex', alignItems: 'center', gap: 1.5, py: 1.3, borderBottom: i < A.topApplicants.length - 1 ? `1px solid ${T.border}` : 'none'}}>
                                        <Box sx={{width: 24, height: 24, borderRadius: '7px', bgcolor: i === 0 ? T.amberSoft : T.bg, border: `1px solid ${i === 0 ? T.amber : T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
                                            <Typography sx={{fontSize: '0.65rem', fontWeight: 800, color: i === 0 ? T.amber : T.muted, fontFamily: 'JetBrains Mono, monospace'}}>{i + 1}</Typography>
                                        </Box>
                                        <Typography sx={{flex: 1, fontSize: '0.8rem', fontWeight: 600, color: T.text}}>{u.first_name} {u.last_name}</Typography>
                                        <Typography sx={{fontFamily: 'JetBrains Mono, monospace', fontSize: '0.82rem', fontWeight: 700, color: T.accent}}>{u.application_count} apps</Typography>
                                    </Box>
                                ))}
                            </SectionCard>
                        </Grid>
                    )}
                </Grid>
            )}

            {/* ════════ TAB 3 — DEVICE CATALOG ════════ */}
            {activeTab === 3 && A && (
                <Grid container spacing={2.5}>
                    <Grid item xs={12}>
                        <Grid container spacing={2}>
                            {[
                                {label: 'Total Devices',     value: A.totalDevices,               color: T.accent, soft: T.accentSoft, sub: 'in catalog'},
                                {label: 'Active Devices',    value: A.activeDevices,              color: T.green,  soft: T.greenSoft,  sub: 'available'},
                                {label: 'Inactive / Disc.',  value: A.totalDevices - A.activeDevices, color: T.amber, soft: T.amberSoft, sub: 'not available'},
                                {label: 'Avg. Monthly Cost', value: `R${A.avgCost}`,              color: T.indigo, soft: T.indigoSoft, sub: 'across catalog'},
                            ].map(m => (
                                <Grid item xs={6} sm={3} key={m.label}>
                                    <Box sx={{p: 2, borderRadius: '12px', bgcolor: m.soft, border: `1px solid ${m.color}28`, textAlign: 'center'}}>
                                        <Typography sx={{fontFamily: 'JetBrains Mono, monospace', fontSize: '1.6rem', fontWeight: 500, color: m.color, lineHeight: 1.1, mb: 0.4}}>{m.value}</Typography>
                                        <Typography sx={{fontSize: '0.72rem', fontWeight: 700, color: T.text}}>{m.label}</Typography>
                                        <Typography sx={{fontSize: '0.67rem', color: T.muted, mt: 0.2}}>{m.sub}</Typography>
                                    </Box>
                                </Grid>
                            ))}
                        </Grid>
                    </Grid>
                    {A.deviceMfrData.length > 0 ? (
                        <>
                            <Grid item xs={12} md={7}>
                                <SectionCard title="Devices by Manufacturer" subtitle="Distribution across catalog" accent={T.purple}>
                                    <Box sx={{height: 260}}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={A.deviceMfrData} barSize={36}>
                                                <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false}/>
                                                <XAxis dataKey="name" tick={{fontSize: 11, fill: T.muted}} axisLine={false} tickLine={false}/>
                                                <YAxis tick={{fontSize: 11, fill: T.muted}} axisLine={false} tickLine={false}/>
                                                <RechartsTooltip content={<Tt/>}/>
                                                <Bar dataKey="value" name="Devices" radius={[6, 6, 0, 0]}>
                                                    {A.deviceMfrData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>)}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </Box>
                                </SectionCard>
                            </Grid>
                            <Grid item xs={12} md={5}>
                                <SectionCard title="Manufacturer Share" subtitle="Proportion of catalog" accent={T.cyan}>
                                    <Box sx={{height: 260}}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie data={A.deviceMfrData} cx="50%" cy="50%" outerRadius={90} innerRadius={50} dataKey="value" paddingAngle={3}>
                                                    {A.deviceMfrData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>)}
                                                </Pie>
                                                <RechartsTooltip content={<Tt/>}/>
                                                <Legend iconType="circle" iconSize={7} formatter={LegendLabel}/>
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </Box>
                                </SectionCard>
                            </Grid>
                        </>
                    ) : (
                        <Grid item xs={12}>
                            <Paper elevation={0} sx={{p: 5, textAlign: 'center', borderRadius: '14px', border: `1px solid ${T.border}`}}>
                                <DeviceIcon sx={{fontSize: 44, color: T.border, mb: 1.5}}/>
                                <Typography sx={{fontSize: '0.88rem', color: T.muted}}>No devices in catalog yet</Typography>
                            </Paper>
                        </Grid>
                    )}
                </Grid>
            )}

            {/* ════════ TAB 4 — GROWTH & TRENDS ════════ */}
            {activeTab === 4 && A && (
                <Grid container spacing={2.5}>
                    <Grid item xs={12}>
                        <Grid container spacing={2}>
                            {[
                                {label: 'Client Growth MoM',     value: A.clientGrowth, color: A.clientGrowth >= 0 ? T.green : T.rose, soft: A.clientGrowth >= 0 ? T.greenSoft : T.roseSoft, sub: `${A.newClientsMonth} new clients`},
                                {label: 'Staff Growth MoM',      value: A.opGrowth,     color: A.opGrowth >= 0 ? T.green : T.rose,     soft: A.opGrowth >= 0 ? T.greenSoft : T.roseSoft,     sub: `${A.newOpMonth} new staff`},
                                {label: 'Total Growth MoM',      value: A.totalGrowth,  color: A.totalGrowth >= 0 ? T.accent : T.rose, soft: A.totalGrowth >= 0 ? T.accentSoft : T.roseSoft, sub: 'across all users'},
                                {label: 'Verification Velocity', value: `${A.dm.recently_verified || 0}`, color: T.cyan, soft: T.cyanSoft, sub: 'verified last 7 days'},
                            ].map(m => (<Grid item xs={6} sm={3} key={m.label}><GrowthTile {...m}/></Grid>))}
                        </Grid>
                    </Grid>
                    {A.trends.length > 0 ? (
                        <>
                            <Grid item xs={12}>
                                <SectionCard title="6-Month Registration Trend" subtitle="Client and staff registrations over time" accent={T.accent}>
                                    <Box sx={{height: 320}}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={A.trends}>
                                                <defs>
                                                    <linearGradient id="gcl" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={T.accent} stopOpacity={0.2}/><stop offset="95%" stopColor={T.accent} stopOpacity={0.01}/></linearGradient>
                                                    <linearGradient id="gop" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={T.green} stopOpacity={0.2}/><stop offset="95%" stopColor={T.green} stopOpacity={0.01}/></linearGradient>
                                                    <linearGradient id="gtot" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={T.purple} stopOpacity={0.15}/><stop offset="95%" stopColor={T.purple} stopOpacity={0.01}/></linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false}/>
                                                <XAxis dataKey="month" tick={{fontSize: 11, fill: T.muted}} axisLine={false} tickLine={false}/>
                                                <YAxis tick={{fontSize: 11, fill: T.muted}} axisLine={false} tickLine={false}/>
                                                <RechartsTooltip content={<Tt/>}/>
                                                <Legend iconType="circle" iconSize={8} formatter={LegendLabel}/>
                                                <Area type="monotone" dataKey="total"       stroke={T.purple} strokeWidth={1.5} fill="url(#gtot)" name="Total"  dot={false} strokeDasharray="4 2"/>
                                                <Area type="monotone" dataKey="clients"     stroke={T.accent} strokeWidth={2}   fill="url(#gcl)"  name="Clients" dot={{r: 3, fill: T.accent}} activeDot={{r: 5}}/>
                                                <Area type="monotone" dataKey="operational" stroke={T.green}  strokeWidth={2}   fill="url(#gop)"  name="Staff"   dot={{r: 3, fill: T.green}}  activeDot={{r: 5}}/>
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </Box>
                                </SectionCard>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <SectionCard title="Month-on-Month Totals" subtitle="Total new users per month" accent={T.purple}>
                                    <Box sx={{height: 240}}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={A.trends}>
                                                <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false}/>
                                                <XAxis dataKey="month" tick={{fontSize: 11, fill: T.muted}} axisLine={false} tickLine={false}/>
                                                <YAxis tick={{fontSize: 11, fill: T.muted}} axisLine={false} tickLine={false}/>
                                                <RechartsTooltip content={<Tt/>}/>
                                                <Line type="monotone" dataKey="total" stroke={T.purple} strokeWidth={2.5} dot={{r: 4, fill: T.purple, strokeWidth: 0}} activeDot={{r: 6}} name="Total"/>
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </Box>
                                </SectionCard>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <SectionCard title="Clients vs Staff" subtitle="Side-by-side monthly comparison" accent={T.cyan}>
                                    <Box sx={{height: 240}}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={A.trends} barSize={16}>
                                                <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false}/>
                                                <XAxis dataKey="month" tick={{fontSize: 11, fill: T.muted}} axisLine={false} tickLine={false}/>
                                                <YAxis tick={{fontSize: 11, fill: T.muted}} axisLine={false} tickLine={false}/>
                                                <RechartsTooltip content={<Tt/>}/>
                                                <Legend iconType="circle" iconSize={7} formatter={LegendLabel}/>
                                                <Bar dataKey="clients"     name="Clients" fill={T.accent} radius={[4, 4, 0, 0]}/>
                                                <Bar dataKey="operational" name="Staff"   fill={T.green}  radius={[4, 4, 0, 0]}/>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </Box>
                                </SectionCard>
                            </Grid>
                        </>
                    ) : (
                        <Grid item xs={12}>
                            <Paper elevation={0} sx={{p: 5, textAlign: 'center', borderRadius: '14px', border: `1px solid ${T.border}`}}>
                                <TimelineIcon sx={{fontSize: 44, color: T.border, mb: 1.5}}/>
                                <Typography sx={{fontSize: '0.88rem', color: T.muted}}>Trend data will appear as registrations accumulate over months</Typography>
                            </Paper>
                        </Grid>
                    )}
                </Grid>
            )}

            {/* ════════ TAB 5 — REGIONAL BREAKDOWN ════════ */}
            {activeTab === 5 && A && (
                <Grid container spacing={2.5}>
                    {A.regionData.length > 0 ? (
                        <>
                            <Grid item xs={12} md={8}>
                                <SectionCard title="User Distribution by Region" subtitle={`${A.regionData.length} regions · sorted by volume`} accent={T.cyan}>
                                    <Box sx={{height: 360}}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={A.regionData.slice(0, 12)} barSize={28}>
                                                <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false}/>
                                                <XAxis dataKey="name" tick={{fontSize: 10, fill: T.muted}} axisLine={false} tickLine={false} interval={0} angle={-30} textAnchor="end" height={50}/>
                                                <YAxis tick={{fontSize: 11, fill: T.muted}} axisLine={false} tickLine={false}/>
                                                <RechartsTooltip content={<Tt/>}/>
                                                <Bar dataKey="value" name="Users" radius={[6, 6, 0, 0]}>
                                                    {A.regionData.slice(0, 12).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>)}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </Box>
                                </SectionCard>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <SectionCard title="Top 5 Regions" subtitle="Ranked by user count" accent={T.purple}>
                                    {A.regionData.slice(0, 5).map((r, i) => (
                                        <Box key={r.name} sx={{display: 'flex', alignItems: 'center', gap: 1.5, py: 1.4, borderBottom: i < 4 ? `1px solid ${T.border}` : 'none'}}>
                                            <Box sx={{width: 24, height: 24, borderRadius: '7px', bgcolor: i === 0 ? T.amberSoft : T.bg, border: `1px solid ${i === 0 ? T.amber : T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
                                                <Typography sx={{fontSize: '0.65rem', fontWeight: 800, color: i === 0 ? T.amber : T.muted, fontFamily: 'JetBrains Mono, monospace'}}>{i + 1}</Typography>
                                            </Box>
                                            <Box sx={{flex: 1, minWidth: 0}}>
                                                <Typography sx={{fontSize: '0.8rem', fontWeight: 600, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{r.name}</Typography>
                                                <Box sx={{height: 3, bgcolor: T.bg, borderRadius: 2, mt: 0.5, overflow: 'hidden'}}>
                                                    <Box sx={{height: '100%', borderRadius: 2, bgcolor: COLORS[i % COLORS.length], width: `${(r.value / A.regionData[0].value) * 100}%`, transition: 'width 0.6s ease'}}/>
                                                </Box>
                                            </Box>
                                            <Typography sx={{fontFamily: 'JetBrains Mono, monospace', fontSize: '0.82rem', fontWeight: 700, color: COLORS[i % COLORS.length], flexShrink: 0}}>
                                                {r.value.toLocaleString()}
                                            </Typography>
                                        </Box>
                                    ))}
                                    {A.dm.most_active_region && (
                                        <Box sx={{mt: 2, p: 1.5, borderRadius: '8px', bgcolor: T.accentSoft, border: `1px solid ${T.accent}28`}}>
                                            <Typography sx={{fontSize: '0.7rem', color: T.accent, fontWeight: 600}}>
                                                Most active today: {A.dm.most_active_region} ({A.dm.region_user_count} users)
                                            </Typography>
                                        </Box>
                                    )}
                                </SectionCard>
                            </Grid>
                        </>
                    ) : (
                        <Grid item xs={12}>
                            <Paper elevation={0} sx={{p: 5, textAlign: 'center', borderRadius: '14px', border: `1px solid ${T.border}`}}>
                                <LocationIcon sx={{fontSize: 44, color: T.border, mb: 1.5}}/>
                                <Typography sx={{fontSize: '0.88rem', color: T.muted}}>No regional data available yet</Typography>
                            </Paper>
                        </Grid>
                    )}
                </Grid>
            )}

            {/* ════════ TAB 6 — RECENT ACTIVITY ════════ */}
            {activeTab === 6 && A && (
                <Grid container spacing={2.5}>
                    {[
                        {key: 'recentClients', title: 'Recent Client Registrations', accent: T.green,  color: T.green,  soft: T.greenSoft,  badge: 'new clients'},
                        {key: 'recentOp',      title: 'Recent Staff Added',          accent: T.purple, color: T.purple, soft: T.purpleSoft, badge: 'new staff'},
                    ].map(col => (
                        <Grid item xs={12} md={6} key={col.key}>
                            <SectionCard title={col.title} subtitle="Last 7 days" accent={col.accent}
                                         badge={{label: `${A[col.key].length} ${col.badge}`, color: col.color, soft: col.soft}}>
                                {A[col.key].length > 0 ? A[col.key].map((r, i) => (
                                    <Box key={r.id} sx={{display: 'flex', alignItems: 'center', gap: 1.5, py: 1.3, borderBottom: i < A[col.key].length - 1 ? `1px solid ${T.border}` : 'none'}}>
                                        <Box sx={{width: 32, height: 32, borderRadius: '10px', bgcolor: col.soft, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
                                            <Typography sx={{fontSize: '0.7rem', fontWeight: 800, color: col.color}}>{r.first_name?.[0]}{r.last_name?.[0]}</Typography>
                                        </Box>
                                        <Box sx={{flex: 1, minWidth: 0}}>
                                            <Typography sx={{fontSize: '0.8rem', fontWeight: 600, color: T.text}}>{r.first_name} {r.last_name}</Typography>
                                            <Typography sx={{fontSize: '0.67rem', color: T.muted}}>{r.email}</Typography>
                                        </Box>
                                        <Box sx={{textAlign: 'right', flexShrink: 0}}>
                                            <Box sx={{px: 1, py: 0.2, borderRadius: '20px', bgcolor: col.soft, border: `1px solid ${col.color}28`}}>
                                                <Typography sx={{fontSize: '0.65rem', fontWeight: 700, color: col.color}}>{r.registration_status || 'Verified'}</Typography>
                                            </Box>
                                            <Typography sx={{fontSize: '0.65rem', color: T.muted, mt: 0.3}}>{new Date(r.created_at).toLocaleDateString('en-ZA')}</Typography>
                                        </Box>
                                    </Box>
                                )) : (
                                    <Typography sx={{fontSize: '0.83rem', color: T.muted, py: 3, textAlign: 'center'}}>No recent entries</Typography>
                                )}
                            </SectionCard>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* ════════ TAB 7 — SLA & RETURNS ════════ */}
            {activeTab === 7 && A && (
                <Grid container spacing={2.5}>
                    <Grid item xs={12} md={4}>
                        <SectionCard title="SLA Overall Compliance" subtitle="Application processing vs. time thresholds"
                            accent={A.slaCompliance == null ? T.muted : A.slaCompliance >= 80 ? T.green : A.slaCompliance >= 60 ? T.amber : T.rose}>
                            {A.slaCompliance != null ? (
                                <>
                                    <Box sx={{textAlign: 'center', py: 2.5}}>
                                        <Typography sx={{fontFamily: 'JetBrains Mono, monospace', fontSize: '3.5rem', fontWeight: 500, lineHeight: 1,
                                            color: A.slaCompliance >= 80 ? T.green : A.slaCompliance >= 60 ? T.amber : T.rose}}>
                                            {A.slaCompliance}%
                                        </Typography>
                                        <Typography sx={{fontSize: '0.75rem', color: T.muted, mt: 1}}>overall compliance rate</Typography>
                                    </Box>
                                    <Box sx={{height: 8, bgcolor: T.bg, borderRadius: 4, overflow: 'hidden', border: `1px solid ${T.border}`}}>
                                        <Box sx={{height: '100%', width: `${A.slaCompliance}%`, bgcolor: A.slaCompliance >= 80 ? T.green : A.slaCompliance >= 60 ? T.amber : T.rose, borderRadius: 4, transition: 'width 0.7s ease'}}/>
                                    </Box>
                                    <Box sx={{display: 'flex', justifyContent: 'space-between', mt: 1}}>
                                        <Typography sx={{fontSize: '0.7rem', color: T.muted}}>Target: 80%</Typography>
                                        <Typography sx={{fontSize: '0.7rem', fontWeight: 700, color: A.slaBreached > 0 ? T.rose : T.green}}>
                                            {A.slaBreached} stage{A.slaBreached !== 1 ? 's' : ''} breached
                                        </Typography>
                                    </Box>
                                </>
                            ) : (
                                <Box sx={{py: 5, textAlign: 'center'}}>
                                    <SlaIcon sx={{fontSize: 40, color: T.border, mb: 1}}/>
                                    <Typography sx={{fontSize: '0.83rem', color: T.muted}}>No SLA data available</Typography>
                                    <Typography sx={{fontSize: '0.72rem', color: T.muted, mt: 0.5}}>Tracking starts once applications are in progress</Typography>
                                </Box>
                            )}
                        </SectionCard>
                    </Grid>

                    <Grid item xs={12} md={8}>
                        <SectionCard title="Device Returns Overview" subtitle={`${A.totalReturns} total returns tracked`} accent={T.orange}
                            badge={A.openReturns > 0 ? {label: `${A.openReturns} OPEN`, color: T.rose, soft: T.roseSoft} : {label: 'ALL CLOSED', color: T.green, soft: T.greenSoft}}>
                            {A.returnsByStatus.length > 0 ? (
                                <>
                                    <Grid container spacing={1.5} sx={{mb: 2}}>
                                        {A.returnsByStatus.map(r => (
                                            <Grid item xs={6} sm={4} key={r.name}>
                                                <Box sx={{p: 1.5, borderRadius: '10px', bgcolor: T.bg, border: `1px solid ${T.border}`, textAlign: 'center'}}>
                                                    <Typography sx={{fontFamily: 'JetBrains Mono, monospace', fontSize: '1.5rem', fontWeight: 500, color: r.color, lineHeight: 1, mb: 0.3}}>{r.value}</Typography>
                                                    <Typography sx={{fontSize: '0.7rem', fontWeight: 700, color: T.text}}>{r.name}</Typography>
                                                </Box>
                                            </Grid>
                                        ))}
                                    </Grid>
                                    <Box sx={{p: 1.5, borderRadius: '10px', bgcolor: A.openReturns > 0 ? T.roseSoft : T.greenSoft, border: `1px solid ${A.openReturns > 0 ? T.rose : T.green}28`, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                        <Box>
                                            <Typography sx={{fontSize: '0.8rem', fontWeight: 700, color: A.openReturns > 0 ? T.rose : T.green}}>Open Returns (pending action)</Typography>
                                            <Typography sx={{fontSize: '0.68rem', color: T.muted}}>Excludes Completed and Cancelled</Typography>
                                        </Box>
                                        <Typography sx={{fontFamily: 'JetBrains Mono, monospace', fontSize: '1.4rem', fontWeight: 700, color: A.openReturns > 0 ? T.rose : T.green}}>{A.openReturns}</Typography>
                                    </Box>
                                </>
                            ) : (
                                <Box sx={{py: 5, textAlign: 'center'}}>
                                    <ReturnIcon sx={{fontSize: 40, color: T.border, mb: 1}}/>
                                    <Typography sx={{fontSize: '0.83rem', color: T.muted}}>No returns recorded yet</Typography>
                                </Box>
                            )}
                        </SectionCard>
                    </Grid>

                    {A.slaStages.length > 0 ? (
                        <Grid item xs={12}>
                            <SectionCard title="SLA Status by Processing Stage" subtitle="Compliance, approaching, and breached counts per workflow stage" accent={T.purple}>
                                <Grid container spacing={2}>
                                    {A.slaStages.map(stage => {
                                        const total     = parseInt(stage.total) || 1;
                                        const withinPct = Math.round((parseInt(stage.within_sla) / total) * 100);
                                        const c         = withinPct >= 80 ? T.green : withinPct >= 60 ? T.amber : T.rose;
                                        return (
                                            <Grid item xs={12} sm={6} md={4} key={stage.application_status}>
                                                <Box sx={{p: 2, borderRadius: '12px', bgcolor: T.bg, border: `1px solid ${T.border}`}}>
                                                    <Typography sx={{fontWeight: 700, fontSize: '0.85rem', color: T.text, mb: 1.5}}>{stage.stage_name}</Typography>
                                                    <Grid container spacing={1} sx={{mb: 1.5}}>
                                                        {[
                                                            {label: 'Total',       value: stage.total,           color: T.text},
                                                            {label: 'Approaching', value: stage.approaching_sla, color: T.amber},
                                                            {label: 'Breached',    value: stage.breached_sla,    color: T.rose},
                                                        ].map(s => (
                                                            <Grid item xs={4} key={s.label}>
                                                                <Typography sx={{fontSize: '0.63rem', color: s.color === T.text ? T.muted : s.color, fontWeight: 600}}>{s.label}</Typography>
                                                                <Typography sx={{fontWeight: 800, fontSize: '1.1rem', color: s.color}}>{s.value}</Typography>
                                                            </Grid>
                                                        ))}
                                                    </Grid>
                                                    <Box sx={{display: 'flex', justifyContent: 'space-between', mb: 0.5}}>
                                                        <Typography sx={{fontSize: '0.72rem', color: T.muted}}>Compliance</Typography>
                                                        <Typography sx={{fontSize: '0.72rem', fontWeight: 700, color: c}}>{withinPct}%</Typography>
                                                    </Box>
                                                    <Box sx={{height: 6, bgcolor: T.border, borderRadius: 3, overflow: 'hidden'}}>
                                                        <Box sx={{height: '100%', width: `${withinPct}%`, bgcolor: c, borderRadius: 3, transition: 'width 0.6s ease'}}/>
                                                    </Box>
                                                    <Typography sx={{fontSize: '0.7rem', color: T.muted, mt: 0.8}}>
                                                        Avg {stage.avg_days_in_stage} days in stage · SLA: {stage.sla_threshold_days} days
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                        );
                                    })}
                                </Grid>
                            </SectionCard>
                        </Grid>
                    ) : (
                        <Grid item xs={12}>
                            <Paper elevation={0} sx={{p: 5, textAlign: 'center', borderRadius: '14px', border: `1px solid ${T.border}`}}>
                                <SlaIcon sx={{fontSize: 44, color: T.border, mb: 1.5}}/>
                                <Typography sx={{fontSize: '0.88rem', color: T.muted}}>No SLA stage data — tracking begins once applications enter processing</Typography>
                            </Paper>
                        </Grid>
                    )}

                    {A.returnsByStatus.length > 0 && (
                        <Grid item xs={12} md={5}>
                            <SectionCard title="Returns Distribution" subtitle="By status" accent={T.cyan}>
                                <Box sx={{height: 220}}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={A.returnsByStatus} cx="50%" cy="50%" outerRadius={80} innerRadius={45} dataKey="value" paddingAngle={3}>
                                                {A.returnsByStatus.map((e, i) => <Cell key={i} fill={e.color || COLORS[i % COLORS.length]}/>)}
                                            </Pie>
                                            <RechartsTooltip content={<Tt/>}/>
                                            <Legend iconType="circle" iconSize={7} formatter={LegendLabel}/>
                                        </PieChart>
                                    </ResponsiveContainer>
                                </Box>
                            </SectionCard>
                        </Grid>
                    )}
                </Grid>
            )}

            {/* ════════ TAB 8 — BUDGET ════════ */}
            {activeTab === 8 && A && (
                <Grid container spacing={2.5}>
                    {(A.overBudget > 0 || A.nearLimit > 0) && (
                        <Grid item xs={12}>
                            <Box sx={{p: 2, borderRadius: '12px', bgcolor: A.overBudget > 0 ? T.roseSoft : T.amberSoft, border: `1px solid ${A.overBudget > 0 ? T.rose : T.amber}28`, display: 'flex', alignItems: 'center', gap: 1.5}}>
                                <WarningIcon sx={{fontSize: 20, color: A.overBudget > 0 ? T.rose : T.amber}}/>
                                <Typography sx={{fontSize: '0.83rem', fontWeight: 600, color: A.overBudget > 0 ? T.rose : T.amber}}>
                                    {A.overBudget > 0 && `${A.overBudget} department${A.overBudget > 1 ? 's are' : ' is'} over budget. `}
                                    {A.nearLimit > 0 && `${A.nearLimit} department${A.nearLimit > 1 ? 's are' : ' is'} nearing the monthly ceiling.`}
                                </Typography>
                            </Box>
                        </Grid>
                    )}
                    <Grid item xs={12}>
                        <Grid container spacing={2}>
                            {[
                                {label: 'Departments',  value: A.budgetDepts.length, color: T.accent, soft: T.accentSoft, sub: 'with budget data'},
                                {label: 'Over Budget',  value: A.overBudget, color: A.overBudget > 0 ? T.rose : T.green, soft: A.overBudget > 0 ? T.roseSoft : T.greenSoft, sub: A.overBudget > 0 ? 'need review' : 'all within limit'},
                                {label: 'Near Limit',   value: A.nearLimit,  color: A.nearLimit > 0 ? T.amber : T.green, soft: A.nearLimit > 0 ? T.amberSoft : T.greenSoft, sub: 'within 10% of ceiling'},
                                {label: 'Fiscal Year',  value: A.fiscalYear || new Date().getFullYear(), color: T.indigo, soft: T.indigoSoft, sub: 'current period'},
                            ].map(m => (
                                <Grid item xs={6} sm={3} key={m.label}>
                                    <Box sx={{p: 2, borderRadius: '12px', bgcolor: m.soft, border: `1px solid ${m.color}28`, textAlign: 'center'}}>
                                        <Typography sx={{fontFamily: 'JetBrains Mono, monospace', fontSize: '1.6rem', fontWeight: 500, color: m.color, lineHeight: 1.1, mb: 0.4}}>{m.value}</Typography>
                                        <Typography sx={{fontSize: '0.72rem', fontWeight: 700, color: T.text}}>{m.label}</Typography>
                                        <Typography sx={{fontSize: '0.67rem', color: T.muted, mt: 0.2}}>{m.sub}</Typography>
                                    </Box>
                                </Grid>
                            ))}
                        </Grid>
                    </Grid>
                    {A.budgetDepts.length > 0 ? (
                        <Grid item xs={12}>
                            <SectionCard title={`Departmental Spend — FY ${A.fiscalYear || new Date().getFullYear()}`} subtitle="Monthly spend vs. ceiling per department" accent={A.overBudget > 0 ? T.rose : T.green}>
                                {A.budgetDepts.map(d => {
                                    const c   = d.status === 'over' ? T.rose : d.status === 'warning' ? T.amber : T.green;
                                    const pct = Math.min(d.utilisation_pct || 0, 100);
                                    return (
                                        <Box key={d.department_id} sx={{display: 'flex', alignItems: 'center', gap: 2, py: 1.8, borderBottom: `1px solid ${T.border}`, '&:last-child': {borderBottom: 'none'}}}>
                                            <Box sx={{flex: 1, minWidth: 0}}>
                                                <Box sx={{display: 'flex', alignItems: 'center', gap: 0.6}}>
                                                    {d.status === 'over' && <WarningIcon sx={{fontSize: 13, color: T.rose}}/>}
                                                    <Typography sx={{fontSize: '0.82rem', fontWeight: 600, color: T.text}}>{d.department_id}</Typography>
                                                </Box>
                                                <Typography sx={{fontSize: '0.68rem', color: T.muted}}>{d.active_contracts} active contract{d.active_contracts !== 1 ? 's' : ''}</Typography>
                                            </Box>
                                            <Box sx={{textAlign: 'right', flexShrink: 0}}>
                                                <Typography sx={{fontFamily: 'JetBrains Mono, monospace', fontSize: '0.88rem', fontWeight: 700, color: c}}>
                                                    R {Number(d.monthly_spend || 0).toLocaleString('en-ZA', {minimumFractionDigits: 2})}
                                                </Typography>
                                                {d.monthly_ceiling ? (
                                                    <Typography sx={{fontSize: '0.67rem', color: T.muted}}>of R {Number(d.monthly_ceiling).toLocaleString('en-ZA', {minimumFractionDigits: 2})}</Typography>
                                                ) : (
                                                    <Typography sx={{fontSize: '0.67rem', color: T.muted}}>no ceiling set</Typography>
                                                )}
                                            </Box>
                                            {d.utilisation_pct != null ? (
                                                <Box sx={{width: 120, flexShrink: 0}}>
                                                    <Box sx={{height: 5, bgcolor: T.bg, borderRadius: 3, overflow: 'hidden', border: `1px solid ${T.border}`}}>
                                                        <Box sx={{height: '100%', width: `${pct}%`, bgcolor: c, borderRadius: 3, transition: 'width 0.6s ease'}}/>
                                                    </Box>
                                                    <Typography sx={{fontSize: '0.68rem', fontWeight: 700, color: c, mt: 0.3, textAlign: 'right'}}>{d.utilisation_pct}%</Typography>
                                                </Box>
                                            ) : <Box sx={{width: 80}}/>}
                                        </Box>
                                    );
                                })}
                            </SectionCard>
                        </Grid>
                    ) : (
                        <Grid item xs={12}>
                            <Paper elevation={0} sx={{p: 5, textAlign: 'center', borderRadius: '14px', border: `1px solid ${T.border}`}}>
                                <MoneyIcon sx={{fontSize: 44, color: T.border, mb: 1.5}}/>
                                <Typography sx={{fontSize: '0.88rem', color: T.muted}}>No budget data for this fiscal year</Typography>
                                <Typography sx={{fontSize: '0.78rem', color: T.muted, mt: 0.5}}>Configure department budgets in the Budget Tracker to see spend here</Typography>
                            </Paper>
                        </Grid>
                    )}
                </Grid>
            )}

            {/* ════════ TAB 9 — INSIGHTS ════════ */}
            {activeTab === 9 && A && (
                <Grid container spacing={2.5}>
                    <Grid item xs={12} md={7}>
                        <SectionCard title="Actionable Insights" subtitle="Cross-system analysis: users · applications · SLA · returns · devices · contracts · budget" accent={T.amber}>
                            {A.insights.length > 0 ? (
                                <Box sx={{display: 'flex', flexDirection: 'column', gap: 1.5}}>
                                    {A.insights.map((ins, i) => <InsightCard key={i} {...ins}/>)}
                                </Box>
                            ) : (
                                <Box sx={{py: 5, textAlign: 'center'}}>
                                    <CheckCircleIcon sx={{fontSize: 44, color: T.green, mb: 1.5, opacity: 0.6}}/>
                                    <Typography sx={{fontSize: '0.88rem', fontWeight: 600, color: T.green}}>All metrics look healthy</Typography>
                                    <Typography sx={{fontSize: '0.78rem', color: T.muted, mt: 0.5}}>No actionable insights at this time</Typography>
                                </Box>
                            )}
                        </SectionCard>
                    </Grid>
                    <Grid item xs={12} md={5}>
                        <SectionCard title="System Health Summary" subtitle="KPIs with pass/fail thresholds" accent={T.green}>
                            <Box sx={{display: 'flex', flexDirection: 'column', gap: 1.5}}>
                                {[
                                    {label: 'Verification Rate',   value: `${A.verificationRate}%`,  status: parseFloat(A.verificationRate) >= 60 ? 'good' : 'warn', note: 'Target: ≥ 60%'},
                                    {label: 'Rejection Rate',      value: `${A.rejectionRate}%`,     status: parseFloat(A.rejectionRate) <= 15 ? 'good' : 'warn',    note: 'Target: ≤ 15%'},
                                    {label: 'Client Growth MoM',   value: `${A.clientGrowth > 0 ? '+' : ''}${A.clientGrowth}%`, status: A.clientGrowth >= 0 ? 'good' : 'warn', note: 'Positive is good'},
                                    {label: 'Pending Backlog',     value: A.pending.toLocaleString(), status: parseFloat(A.pendingRate) <= 25 ? 'good' : 'warn',     note: `${A.pendingRate}% of clients`},
                                    {label: 'Avg. Verify Time',    value: `${A.dm.avg_verification_days || '—'}d`, status: parseFloat(A.dm.avg_verification_days) <= 3 ? 'good' : 'warn', note: 'Target: ≤ 3 days'},
                                    {label: 'SLA Compliance',      value: A.slaCompliance != null ? `${A.slaCompliance}%` : 'N/A', status: A.slaCompliance == null || A.slaCompliance >= 80 ? 'good' : 'warn', note: 'Target: ≥ 80%'},
                                    {label: 'Open Returns',        value: A.openReturns,              status: A.openReturns <= 5 ? 'good' : 'warn',                  note: 'Target: ≤ 5'},
                                    {label: 'Over-budget Depts',   value: A.overBudget,               status: A.overBudget === 0 ? 'good' : 'warn',                  note: 'Target: 0'},
                                    {label: 'Device Catalog',      value: `${A.activeDevices}/${A.totalDevices}`, status: A.totalDevices === 0 || A.activeDevices >= A.totalDevices * 0.6 ? 'good' : 'warn', note: 'Target: ≥ 60% active'},
                                    {label: 'Contract Fulfilment', value: `${A.contractRate}%`,       status: A.appTotal === 0 || parseFloat(A.contractRate) >= 30 ? 'good' : 'warn', note: 'Target: ≥ 30%'},
                                ].map(item => (
                                    <Box key={item.label} sx={{p: 1.5, borderRadius: '8px', bgcolor: item.status === 'good' ? T.greenSoft : T.amberSoft, border: `1px solid ${item.status === 'good' ? T.green : T.amber}28`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1}}>
                                        <Box>
                                            <Typography sx={{fontSize: '0.75rem', fontWeight: 700, color: item.status === 'good' ? T.green : T.amber}}>{item.label}</Typography>
                                            <Typography sx={{fontSize: '0.68rem', color: T.muted}}>{item.note}</Typography>
                                        </Box>
                                        <Typography sx={{fontFamily: 'JetBrains Mono, monospace', fontSize: '0.95rem', fontWeight: 700, color: item.status === 'good' ? T.green : T.amber, flexShrink: 0}}>
                                            {item.value}
                                        </Typography>
                                    </Box>
                                ))}
                            </Box>
                        </SectionCard>
                    </Grid>
                </Grid>
            )}
        </Box>
    );
};

export default Statistics;
