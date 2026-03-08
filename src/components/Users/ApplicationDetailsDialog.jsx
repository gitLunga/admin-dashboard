// src/components/admin/Users/ApplicationDetailsDialog.jsx
import React from 'react';
import {
    Dialog, DialogTitle, DialogContent, IconButton, Typography,
    Box, Grid, Chip, Divider,
} from '@mui/material';
import {
    Close as CloseIcon, Person as PersonIcon, PhoneAndroid as DeviceIcon,
    Email as EmailIcon, Phone as PhoneIcon, LocationOn as LocationIcon,
    Business as BusinessIcon, Badge as BadgeIcon, CalendarToday as CalendarIcon,
    CheckCircle as ApprovedIcon, Cancel as RejectedIcon,
} from '@mui/icons-material';
import dayjs from 'dayjs';

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
    Approved:  { color: T.green, soft: T.greenSoft },
    Rejected:  { color: T.rose,  soft: T.roseSoft  },
    Pending:   { color: T.amber, soft: T.amberSoft  },
    Cancelled: { color: T.muted, soft: '#F1F5F9'   },
    Verified:  { color: T.green, soft: T.greenSoft  },
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

const ApplicationDetailsDialog = ({ open, application, onClose }) => {
    if (!application) return null;

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
                                #{application.application_id}
                            </Typography>
                            <StatusBadge status={application.application_status} />
                        </Box>
                    </Box>
                    <IconButton onClick={onClose} size="small"
                                sx={{ color: T.muted, borderRadius: '8px', '&:hover': { bgcolor: T.bg, color: T.rose } }}>
                        <CloseIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                </Box>
            </DialogTitle>

            <DialogContent sx={{ p: 3, bgcolor: T.bg }}>
                <Grid container spacing={2.5}>

                    {/* ── Applicant Information ── */}
                    <Grid item xs={12} md={6}>
                        <Box sx={{ bgcolor: T.surface, borderRadius: '12px', p: 2.5, border: `1px solid ${T.border}`, height: '100%' }}>
                            <SectionHeader icon={PersonIcon} label="Applicant Information" color={T.accent} />

                            <InfoRow label="Full Name">
                                <Typography sx={{ fontSize: '0.83rem', fontWeight: 600, color: T.text }}>
                                    {application.first_name} {application.last_name}
                                </Typography>
                            </InfoRow>
                            <InfoRow label="Email">
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7 }}>
                                    <EmailIcon sx={{ fontSize: 14, color: T.muted }} />
                                    <Typography sx={{ fontSize: '0.82rem', color: T.text }}>{application.email}</Typography>
                                </Box>
                            </InfoRow>
                            {application.phone_number && (
                                <InfoRow label="Phone">
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7 }}>
                                        <PhoneIcon sx={{ fontSize: 14, color: T.muted }} />
                                        <Typography sx={{ fontSize: '0.82rem', color: T.text }}>{application.phone_number}</Typography>
                                    </Box>
                                </InfoRow>
                            )}
                            <InfoRow label="User Type">
                                <Chip label={application.user_type} size="small"
                                      sx={{ height: 22, fontSize: '0.71rem', fontWeight: 600, bgcolor: T.purpleSoft, color: T.purple }} />
                            </InfoRow>
                            <InfoRow label="Region">
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7 }}>
                                    <LocationIcon sx={{ fontSize: 14, color: T.muted }} />
                                    <Typography sx={{ fontSize: '0.82rem', color: T.text }}>{application.region || '—'}</Typography>
                                </Box>
                            </InfoRow>
                            <InfoRow label="Persal ID">
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7 }}>
                                    <BadgeIcon sx={{ fontSize: 14, color: T.muted }} />
                                    <Typography className="mono" sx={{ fontSize: '0.8rem', color: T.text }}>{application.persal_id || '—'}</Typography>
                                </Box>
                            </InfoRow>
                            <InfoRow label="Department">
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7 }}>
                                    <BusinessIcon sx={{ fontSize: 14, color: T.muted }} />
                                    <Typography sx={{ fontSize: '0.82rem', color: T.text }}>{application.department_id || '—'}</Typography>
                                </Box>
                            </InfoRow>
                            <InfoRow label="Reg. Status">
                                <StatusBadge status={application.registration_status} />
                            </InfoRow>
                        </Box>
                    </Grid>

                    {/* ── Device & Application ── */}
                    <Grid item xs={12} md={6}>
                        <Box sx={{ bgcolor: T.surface, borderRadius: '12px', p: 2.5, border: `1px solid ${T.border}`, mb: 2.5 }}>
                            <SectionHeader icon={DeviceIcon} label="Device & Plan Details" color={T.purple} />

                            <InfoRow label="Device">
                                <Typography sx={{ fontSize: '0.83rem', fontWeight: 600, color: T.text }}>{application.device_name}</Typography>
                            </InfoRow>
                            <InfoRow label="Model">
                                <Typography sx={{ fontSize: '0.82rem', color: T.text }}>{application.model}</Typography>
                            </InfoRow>
                            <InfoRow label="Manufacturer">
                                <Typography sx={{ fontSize: '0.82rem', color: T.text }}>{application.manufacturer}</Typography>
                            </InfoRow>
                            <InfoRow label="Plan">
                                <Chip label={application.plan_name} size="small"
                                      sx={{ height: 22, fontSize: '0.71rem', fontWeight: 600, bgcolor: T.cyanSoft, color: T.cyan }} />
                            </InfoRow>
                            <InfoRow label="Monthly Cost">
                                <Typography className="mono" sx={{ fontSize: '0.85rem', fontWeight: 700, color: T.accent }}>
                                    {fmtR(application.monthly_cost)}
                                </Typography>
                            </InfoRow>
                            <InfoRow label="Contract">
                                <Typography sx={{ fontSize: '0.82rem', color: T.text }}>{application.contract_duration_months} months</Typography>
                            </InfoRow>
                        </Box>

                        <Box sx={{ bgcolor: T.surface, borderRadius: '12px', p: 2.5, border: `1px solid ${T.border}` }}>
                            <SectionHeader icon={CalendarIcon} label="Application Timeline" color={T.green} />

                            <InfoRow label="Status">
                                <StatusBadge status={application.application_status} />
                            </InfoRow>
                            <InfoRow label="Submitted">
                                <Typography className="mono" sx={{ fontSize: '0.8rem', color: T.text }}>
                                    {dayjs(application.submission_date).format('DD MMM YYYY HH:mm')}
                                </Typography>
                            </InfoRow>
                            <InfoRow label="Last Updated">
                                <Typography className="mono" sx={{ fontSize: '0.8rem', color: T.text }}>
                                    {dayjs(application.last_updated).format('DD MMM YYYY HH:mm')}
                                </Typography>
                            </InfoRow>
                            {application.rejection_reason && (
                                <InfoRow label="Rejection Reason">
                                    <Box sx={{ p: 1.2, bgcolor: T.roseSoft, borderRadius: '8px', border: `1px solid ${T.rose}22` }}>
                                        <Typography sx={{ fontSize: '0.78rem', color: T.rose }}>
                                            {application.rejection_reason}
                                        </Typography>
                                    </Box>
                                </InfoRow>
                            )}
                            {application.approval_status && (
                                <InfoRow label="Approval Status">
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7 }}>
                                        {application.approval_status === 'Approved'
                                            ? <ApprovedIcon sx={{ fontSize: 15, color: T.green }} />
                                            : <RejectedIcon sx={{ fontSize: 15, color: T.rose }} />
                                        }
                                        <Typography sx={{ fontSize: '0.82rem', fontWeight: 600,
                                            color: application.approval_status === 'Approved' ? T.green : T.rose }}>
                                            {application.approval_status}
                                        </Typography>
                                    </Box>
                                </InfoRow>
                            )}
                            {application.approver_first_name && (
                                <InfoRow label="Processed By">
                                    <Typography sx={{ fontSize: '0.82rem', color: T.text }}>
                                        {application.approver_first_name} {application.approver_last_name}
                                    </Typography>
                                </InfoRow>
                            )}
                        </Box>
                    </Grid>
                </Grid>
            </DialogContent>
        </Dialog>
    );
};

export default ApplicationDetailsDialog;