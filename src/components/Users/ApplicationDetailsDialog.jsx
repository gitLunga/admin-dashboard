// src/components/admin/Users/ApplicationDetailsDialog.jsx
import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, IconButton, Typography,
    Box, Grid, Chip, CircularProgress,
} from '@mui/material';
import {
    Close as CloseIcon, Person as PersonIcon, PhoneAndroid as DeviceIcon,
    Email as EmailIcon, Phone as PhoneIcon, LocationOn as LocationIcon,
    Business as BusinessIcon, Badge as BadgeIcon, CalendarToday as CalendarIcon,
    CheckCircle as ApprovedIcon, Cancel as RejectedIcon,
    Timeline as TimelineIcon,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import { deviceAPI } from '../../services/api';

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

const STATUS_META = {
    Approved:        { color: T.green,  soft: T.greenSoft  },
    Rejected:        { color: T.rose,   soft: T.roseSoft   },
    Pending:         { color: T.amber,  soft: T.amberSoft  },
    Pending_Finance: { color: T.purple, soft: T.purpleSoft },
    Cancelled:       { color: T.muted,  soft: '#F1F5F9'    },
    Verified:        { color: T.green,  soft: T.greenSoft  },
};

// Stage label map — converts DB stage string to human-readable
const STAGE_LABELS = {
    manager: 'Manager Review',
    finance: 'Finance Review',
    admin:   'Admin Review',
};

const StatusBadge = ({ status }) => {
    const m = STATUS_META[status] || { color: T.muted, soft: '#F1F5F9' };
    return (
        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.7,
            px: 1.2, py: 0.4, borderRadius: '20px', bgcolor: m.soft, border: `1px solid ${m.color}28` }}>
            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: m.color }} />
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: m.color }}>{status}</Typography>
        </Box>
    );
};

const InfoRow = ({ label, children }) => (
    <Box sx={{ display: 'flex', py: 1.3, borderBottom: `1px solid ${T.border}`, '&:last-child': { borderBottom: 'none' } }}>
        <Typography sx={{ fontSize: '0.76rem', fontWeight: 600, color: T.muted, width: 140, flexShrink: 0 }}>{label}</Typography>
        <Box sx={{ flex: 1 }}>{children}</Box>
    </Box>
);

const SectionHeader = ({ icon: Icon, label, color = T.accent }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 1.5, pb: 1.5, borderBottom: `1px solid ${T.border}` }}>
        <Box sx={{ width: 30, height: 30, borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: `${color}12` }}>
            <Icon sx={{ fontSize: 16, color }} />
        </Box>
        <Typography sx={{ fontWeight: 700, fontSize: '0.88rem', color: T.text }}>{label}</Typography>
    </Box>
);

const fmtR = (a) => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', minimumFractionDigits: 2 }).format(a || 0);

// ── NEW: Approval History Timeline ───────────────────────────────────────────
// Renders a vertical timeline of every approval event for this application.
// Handles the full workflow: Pending → Manager → Finance → Approved/Rejected.
const ApprovalTimeline = ({ application }) => {
    // Build timeline from approval_history array + current application state
    const history = Array.isArray(application.approval_history) ? application.approval_history : [];

    // Determine which workflow steps are shown based on the application status
    const steps = [
        {
            key: 'submitted',
            stage: 'Submitted',
            label: 'Application Submitted',
            date: application.submission_date,
            status: 'Completed',
            actor: `${application.first_name} ${application.last_name}`,
            notes: null,
            color: T.accent,
        },
        // Inject actual approval history entries
        ...history.map((h) => ({
            key: `approval_${h.approval_id}`,
            stage: STAGE_LABELS[h.approval_stage] || h.approval_stage,
            label: `${STAGE_LABELS[h.approval_stage] || h.approval_stage} — ${h.approval_status}`,
            date: h.approval_date,
            status: h.approval_status,
            actor: `${h.approver_first_name} ${h.approver_last_name}${h.approver_role ? ` (${h.approver_role})` : ''}`,
            notes: h.notes,
            color: h.approval_status === 'Approved' ? T.green : T.rose,
        })),
    ];

    // Add a final "Order Placed" step if an order exists
    if (application.order_id) {
        steps.push({
            key: 'order',
            stage: 'Order Placed',
            label: 'MTN Order Placed',
            date: application.order_date,
            status: 'Ordered',
            actor: application.mtn_staff_first_name
                ? `${application.mtn_staff_first_name} ${application.mtn_staff_last_name}`
                : 'Admin',
            notes: `Order #${application.order_id} · Status: ${application.order_status || 'Processing'}`,
            color: T.cyan,
        });
    }

    if (steps.length === 0) return null;

    const dotColor = (status) => {
        if (status === 'Approved' || status === 'Completed' || status === 'Ordered') return T.green;
        if (status === 'Rejected') return T.rose;
        return T.amber;
    };

    return (
        <Box sx={{ bgcolor: T.surface, borderRadius: '12px', p: 2.5, border: `1px solid ${T.border}` }}>
            <SectionHeader icon={TimelineIcon} label="Approval Journey" color={T.purple} />
            <Box sx={{ position: 'relative', pl: 2 }}>
                {/* Vertical line */}
                <Box sx={{
                    position: 'absolute', left: '7px', top: 8, bottom: 8,
                    width: 2, bgcolor: T.border, borderRadius: 1,
                }} />

                {steps.map((step, idx) => (
                    <Box key={step.key} sx={{
                        position: 'relative', mb: idx < steps.length - 1 ? 2.5 : 0,
                        pl: 2.5,
                    }}>
                        {/* Timeline dot */}
                        <Box sx={{
                            position: 'absolute', left: -1, top: 3,
                            width: 14, height: 14, borderRadius: '50%',
                            bgcolor: dotColor(step.status),
                            border: `2px solid ${T.surface}`,
                            boxShadow: `0 0 0 2px ${dotColor(step.status)}44`,
                            zIndex: 1,
                        }} />

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 0.5 }}>
                            <Box sx={{ flex: 1 }}>
                                <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: T.text }}>
                                    {step.label}
                                </Typography>
                                <Typography sx={{ fontSize: '0.74rem', color: T.muted, mt: 0.2 }}>
                                    {step.actor}
                                </Typography>
                                {step.notes && (
                                    <Box sx={{ mt: 0.7, px: 1.5, py: 0.8, borderRadius: '8px',
                                        bgcolor: step.status === 'Rejected' ? T.roseSoft : T.bg,
                                        border: `1px solid ${step.status === 'Rejected' ? T.rose + '33' : T.border}`,
                                    }}>
                                        <Typography sx={{ fontSize: '0.74rem', color: step.status === 'Rejected' ? T.rose : T.muted }}>
                                            {step.notes}
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                            {step.date && (
                                <Typography className="mono" sx={{ fontSize: '0.7rem', color: T.muted, flexShrink: 0, mt: 0.2 }}>
                                    {dayjs(step.date).format('DD MMM YYYY HH:mm')}
                                </Typography>
                            )}
                        </Box>
                    </Box>
                ))}
            </Box>
        </Box>
    );
};

const ApplicationDetailsDialog = ({ open, application, onClose }) => {
    const [detail, setDetail]   = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!open || !application?.application_id) return;
        setDetail(null);
        setLoading(true);
        deviceAPI.getApplicationDetails(application.application_id)
            .then(res => setDetail(res.data?.data?.application || res.data?.data || null))
            .catch(() => setDetail(application))
            .finally(() => setLoading(false));
    }, [open, application?.application_id]);

    const app = detail || application;

    if (!app) return null;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth
                PaperProps={{ sx: {
                        borderRadius: '16px', border: `1px solid ${T.border}`,
                        boxShadow: '0 24px 60px rgba(15,31,61,0.14)',
                        bgcolor: T.bg,
                    }}}>

            {/* ── Title bar ── */}
            <DialogTitle sx={{ p: 0 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    px: 3, py: 2.2, bgcolor: T.surface, borderBottom: `1px solid ${T.border}` }}>
                    <Box>
                        <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: T.text }}>
                            Application Details
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.3 }}>
                            <Typography className="mono" sx={{ fontSize: '0.7rem', color: T.muted }}>
                                #{app.application_id}
                            </Typography>
                            <StatusBadge status={app.application_status} />
                        </Box>
                    </Box>
                    <IconButton onClick={onClose} size="small"
                                sx={{ color: T.muted, borderRadius: '8px', '&:hover': { bgcolor: T.bg, color: T.rose } }}>
                        <CloseIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                </Box>
            </DialogTitle>

            <DialogContent sx={{ p: 3, bgcolor: T.bg }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
                        <CircularProgress size={28} sx={{ color: T.accent }} />
                    </Box>
                ) : (
                <Grid container spacing={2.5}>

                    {/* ── Applicant Information ── */}
                    <Grid item xs={12} md={6}>
                        <Box sx={{ bgcolor: T.surface, borderRadius: '12px', p: 2.5, border: `1px solid ${T.border}`, height: '100%' }}>
                            <SectionHeader icon={PersonIcon} label="Applicant Information" color={T.accent} />

                            <InfoRow label="Full Name">
                                <Typography sx={{ fontSize: '0.83rem', fontWeight: 600, color: T.text }}>
                                    {app.first_name} {app.last_name}
                                </Typography>
                            </InfoRow>
                            <InfoRow label="Email">
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7 }}>
                                    <EmailIcon sx={{ fontSize: 14, color: T.muted }} />
                                    <Typography sx={{ fontSize: '0.82rem', color: T.text }}>{app.email}</Typography>
                                </Box>
                            </InfoRow>
                            {app.phone_number && (
                                <InfoRow label="Phone">
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7 }}>
                                        <PhoneIcon sx={{ fontSize: 14, color: T.muted }} />
                                        <Typography sx={{ fontSize: '0.82rem', color: T.text }}>{app.phone_number}</Typography>
                                    </Box>
                                </InfoRow>
                            )}
                            <InfoRow label="User Type">
                                <Chip label={app.user_type} size="small"
                                      sx={{ height: 22, fontSize: '0.71rem', fontWeight: 600, bgcolor: T.purpleSoft, color: T.purple }} />
                            </InfoRow>
                            <InfoRow label="Region">
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7 }}>
                                    <LocationIcon sx={{ fontSize: 14, color: T.muted }} />
                                    <Typography sx={{ fontSize: '0.82rem', color: T.text }}>{app.region || '—'}</Typography>
                                </Box>
                            </InfoRow>
                            <InfoRow label="Persal ID">
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7 }}>
                                    <BadgeIcon sx={{ fontSize: 14, color: T.muted }} />
                                    <Typography className="mono" sx={{ fontSize: '0.8rem', color: T.text }}>{app.persal_id || '—'}</Typography>
                                </Box>
                            </InfoRow>
                            <InfoRow label="Department">
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7 }}>
                                    <BusinessIcon sx={{ fontSize: 14, color: T.muted }} />
                                    <Typography sx={{ fontSize: '0.82rem', color: T.text }}>{app.department_id || '—'}</Typography>
                                </Box>
                            </InfoRow>
                            <InfoRow label="Reg. Status">
                                <StatusBadge status={app.registration_status} />
                            </InfoRow>
                        </Box>
                    </Grid>

                    {/* ── Device & Application ── */}
                    <Grid item xs={12} md={6}>
                        <Box sx={{ bgcolor: T.surface, borderRadius: '12px', p: 2.5, border: `1px solid ${T.border}`, mb: 2.5 }}>
                            <SectionHeader icon={DeviceIcon} label="Device & Plan Details" color={T.purple} />

                            <InfoRow label="Device">
                                <Typography sx={{ fontSize: '0.83rem', fontWeight: 600, color: T.text }}>{app.device_name}</Typography>
                            </InfoRow>
                            <InfoRow label="Model">
                                <Typography sx={{ fontSize: '0.82rem', color: T.text }}>{app.model}</Typography>
                            </InfoRow>
                            <InfoRow label="Manufacturer">
                                <Typography sx={{ fontSize: '0.82rem', color: T.text }}>{app.manufacturer}</Typography>
                            </InfoRow>
                            <InfoRow label="Plan">
                                <Chip label={app.plan_name} size="small"
                                      sx={{ height: 22, fontSize: '0.71rem', fontWeight: 600, bgcolor: T.cyanSoft, color: T.cyan }} />
                            </InfoRow>
                            <InfoRow label="Monthly Cost">
                                <Typography className="mono" sx={{ fontSize: '0.85rem', fontWeight: 700, color: T.accent }}>
                                    {fmtR(app.monthly_cost)}
                                </Typography>
                            </InfoRow>
                            <InfoRow label="Contract">
                                <Typography sx={{ fontSize: '0.82rem', color: T.text }}>{app.contract_duration_months} months</Typography>
                            </InfoRow>
                            <InfoRow label="Total Value">
                                <Typography className="mono" sx={{ fontSize: '0.82rem', fontWeight: 700, color: T.text }}>
                                    {fmtR((app.monthly_cost || 0) * (app.contract_duration_months || 0))}
                                </Typography>
                            </InfoRow>
                        </Box>

                        <Box sx={{ bgcolor: T.surface, borderRadius: '12px', p: 2.5, border: `1px solid ${T.border}` }}>
                            <SectionHeader icon={CalendarIcon} label="Application Timeline" color={T.green} />

                            <InfoRow label="Status">
                                <StatusBadge status={app.application_status} />
                            </InfoRow>
                            <InfoRow label="Submitted">
                                <Typography className="mono" sx={{ fontSize: '0.8rem', color: T.text }}>
                                    {dayjs(app.submission_date).format('DD MMM YYYY HH:mm')}
                                </Typography>
                            </InfoRow>
                            <InfoRow label="Last Updated">
                                <Typography className="mono" sx={{ fontSize: '0.8rem', color: T.text }}>
                                    {dayjs(app.last_updated).format('DD MMM YYYY HH:mm')}
                                </Typography>
                            </InfoRow>
                            {app.rejection_reason && (
                                <InfoRow label="Rejection Reason">
                                    <Box sx={{ p: 1.2, bgcolor: T.roseSoft, borderRadius: '8px', border: `1px solid ${T.rose}22` }}>
                                        <Typography sx={{ fontSize: '0.78rem', color: T.rose }}>
                                            {app.rejection_reason}
                                        </Typography>
                                    </Box>
                                </InfoRow>
                            )}

                            {/* Order info if placed */}
                            {app.order_id && (
                                <>
                                    <InfoRow label="Order ID">
                                        <Typography className="mono" sx={{ fontSize: '0.82rem', fontWeight: 700, color: T.cyan }}>
                                            #{app.order_id}
                                        </Typography>
                                    </InfoRow>
                                    <InfoRow label="Order Status">
                                        <Chip label={app.order_status || 'Processing'} size="small"
                                              sx={{ height: 22, fontSize: '0.71rem', fontWeight: 600, bgcolor: T.cyanSoft, color: T.cyan }} />
                                    </InfoRow>
                                    {app.order_date && (
                                        <InfoRow label="Order Date">
                                            <Typography className="mono" sx={{ fontSize: '0.8rem', color: T.text }}>
                                                {dayjs(app.order_date).format('DD MMM YYYY HH:mm')}
                                            </Typography>
                                        </InfoRow>
                                    )}
                                </>
                            )}
                        </Box>
                    </Grid>

                    {/* ── Approval Journey Timeline ── */}
                    <Grid item xs={12}>
                        <ApprovalTimeline application={app} />
                    </Grid>

                </Grid>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default ApplicationDetailsDialog;