// src/components/admin/Users/ApplicationStatusDialog.jsx
import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Button, Box, Typography, Alert,
} from '@mui/material';
import {
    CheckCircle as ApprovedIcon,
    Cancel as RejectedIcon,
    Close as CloseIcon,
    Edit as EditIcon,
} from '@mui/icons-material';

/* ── Shared tokens ── */
const T = {
    bg: '#F8F9FC', surface: '#FFFFFF', border: '#E8ECF4',
    text: '#0F1F3D', muted: '#6B7A99',
    accent: '#1E4FD8', accentSoft: '#EBF0FF',
    green: '#059669', greenSoft: '#D1FAE5',
    amber: '#D97706', amberSoft: '#FEF3C7',
    rose: '#DC2626', roseSoft: '#FEE2E2',
};

const STATUS_OPTIONS = [
    { value: 'Approved', label: 'Approve', color: T.green, soft: T.greenSoft, Icon: ApprovedIcon,
        desc: 'Application meets all requirements and will be processed.' },
    { value: 'Rejected', label: 'Reject',  color: T.rose,  soft: T.roseSoft,  Icon: RejectedIcon,
        desc: 'Application does not meet requirements. Reason required.' },
];

const ApplicationStatusDialog = ({ open, application, onClose, onUpdate }) => {
    const [status, setStatus]                 = useState('Approved');
    const [rejectionReason, setRejectionReason] = useState('');
    const [notes, setNotes]                   = useState('');
    const [loading, setLoading]               = useState(false);
    const [error, setError]                   = useState('');

    useEffect(() => {
        if (application) setStatus(application.application_status === 'Rejected' ? 'Rejected' : 'Approved');
    }, [application]);

    const handleSubmit = async () => {
        if (status === 'Rejected' && !rejectionReason.trim()) {
            setError('A rejection reason is required'); return;
        }
        setLoading(true);
        try {
            await onUpdate(application.application_id, { status, rejection_reason: rejectionReason, notes, approver_id: 1 });
            handleClose();
        } catch (err) {
            setError(err.message || 'Failed to update status');
        } finally { setLoading(false); }
    };

    const handleClose = () => {
        setStatus('Approved'); setRejectionReason(''); setNotes(''); setError('');
        onClose();
    };

    if (!application) return null;

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth
                PaperProps={{ sx: {
                        borderRadius: '16px', border: `1px solid ${T.border}`,
                        boxShadow: '0 24px 60px rgba(15,31,61,0.14)',
                        bgcolor: T.bg,
                    }}}>

            {/* ── Header ── */}
            <DialogTitle sx={{ p: 0 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    px: 3, py: 2.2, bgcolor: T.surface, borderBottom: `1px solid ${T.border}` }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                        <Box sx={{ width: 30, height: 30, borderRadius: '9px', bgcolor: T.amberSoft,
                            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <EditIcon sx={{ fontSize: 16, color: T.amber }} />
                        </Box>
                        <Box>
                            <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: T.text }}>
                                Update Application Status
                            </Typography>
                            <Typography className="mono" sx={{ fontSize: '0.68rem', color: T.muted }}>
                                #{application.application_id}
                            </Typography>
                        </Box>
                    </Box>
                    <Button onClick={handleClose} size="small"
                            sx={{ minWidth: 0, p: 0.7, borderRadius: '8px', color: T.muted, '&:hover': { bgcolor: T.bg, color: T.rose } }}>
                        <CloseIcon sx={{ fontSize: 17 }} />
                    </Button>
                </Box>
            </DialogTitle>

            <DialogContent sx={{ p: 3, bgcolor: T.bg }}>

                {/* Application summary */}
                <Box sx={{ p: 2, mb: 3, borderRadius: '12px', bgcolor: T.surface, border: `1px solid ${T.border}` }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                        <Box>
                            <Typography sx={{ fontSize: '0.69rem', fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: 0.8, mb: 0.3 }}>Applicant</Typography>
                            <Typography sx={{ fontSize: '0.87rem', fontWeight: 600, color: T.text }}>
                                {application.first_name} {application.last_name}
                            </Typography>
                        </Box>
                        <Box>
                            <Typography sx={{ fontSize: '0.69rem', fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: 0.8, mb: 0.3 }}>Device</Typography>
                            <Typography sx={{ fontSize: '0.87rem', fontWeight: 600, color: T.text }}>{application.device_name}</Typography>
                        </Box>
                        <Box>
                            <Typography sx={{ fontSize: '0.69rem', fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: 0.8, mb: 0.3 }}>Current Status</Typography>
                            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.6, px: 1.1, py: 0.35, borderRadius: '20px',
                                bgcolor: application.application_status === 'Approved' ? T.greenSoft : application.application_status === 'Rejected' ? T.roseSoft : T.amberSoft,
                            }}>
                                <Box sx={{ width: 6, height: 6, borderRadius: '50%',
                                    bgcolor: application.application_status === 'Approved' ? T.green : application.application_status === 'Rejected' ? T.rose : T.amber }} />
                                <Typography sx={{ fontSize: '0.71rem', fontWeight: 600,
                                    color: application.application_status === 'Approved' ? T.green : application.application_status === 'Rejected' ? T.rose : T.amber }}>
                                    {application.application_status}
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                </Box>

                {error && <Alert severity="error" sx={{ mb: 2.5, borderRadius: '10px', fontSize: '0.82rem' }}>{error}</Alert>}

                {/* Status selection */}
                <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: 0.8, mb: 1.2 }}>
                    Select New Status
                </Typography>
                <Box sx={{ display: 'flex', gap: 1.5, mb: 2.5, flexWrap: 'wrap' }}>
                    {STATUS_OPTIONS.map(opt => {
                        const selected = status === opt.value;
                        return (
                            <Box key={opt.value} onClick={() => setStatus(opt.value)} sx={{
                                flex: 1, minWidth: 140, p: 2, borderRadius: '12px', cursor: 'pointer',
                                border: `2px solid ${selected ? opt.color : T.border}`,
                                bgcolor: selected ? opt.soft : T.surface,
                                transition: 'all 0.18s ease',
                                '&:hover': { borderColor: opt.color, bgcolor: opt.soft },
                            }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                    <opt.Icon sx={{ fontSize: 18, color: selected ? opt.color : T.muted }} />
                                    <Typography sx={{ fontWeight: 700, fontSize: '0.87rem', color: selected ? opt.color : T.text }}>
                                        {opt.label}
                                    </Typography>
                                </Box>
                                <Typography sx={{ fontSize: '0.71rem', color: T.muted, lineHeight: 1.4 }}>{opt.desc}</Typography>
                            </Box>
                        );
                    })}
                </Box>

                {/* Rejection reason */}
                {status === 'Rejected' && (
                    <Box sx={{ mb: 2 }}>
                        <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: 0.8, mb: 1 }}>
                            Rejection Reason <span style={{ color: T.rose }}>*</span>
                        </Typography>
                        <TextField
                            fullWidth multiline rows={3}
                            placeholder="Provide a clear and specific reason for rejection…"
                            value={rejectionReason}
                            onChange={e => setRejectionReason(e.target.value)}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '10px', bgcolor: T.surface, fontSize: '0.83rem',
                                    '& fieldset': { borderColor: T.border },
                                    '&:hover fieldset': { borderColor: T.rose },
                                    '&.Mui-focused fieldset': { borderColor: T.rose },
                                },
                                '& textarea': { fontFamily: 'Plus Jakarta Sans, sans-serif' },
                            }}
                        />
                    </Box>
                )}

                {/* Admin notes */}
                <Box>
                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: 0.8, mb: 1 }}>
                        Admin Notes <span style={{ color: T.muted, fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
                    </Typography>
                    <TextField
                        fullWidth multiline rows={2}
                        placeholder="Add internal notes or instructions…"
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '10px', bgcolor: T.surface, fontSize: '0.83rem',
                                '& fieldset': { borderColor: T.border },
                                '&:hover fieldset': { borderColor: T.accent },
                                '&.Mui-focused fieldset': { borderColor: T.accent },
                            },
                            '& textarea': { fontFamily: 'Plus Jakarta Sans, sans-serif' },
                        }}
                    />
                </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2.2, bgcolor: T.surface, borderTop: `1px solid ${T.border}`, gap: 1.5 }}>
                <Button onClick={handleClose} disabled={loading}
                        sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, fontFamily: 'Plus Jakarta Sans, sans-serif',
                            fontSize: '0.83rem', color: T.muted, border: `1px solid ${T.border}`, bgcolor: T.bg, px: 2.5,
                            '&:hover': { bgcolor: T.border } }}>
                    Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={loading} variant="contained"
                        sx={{
                            borderRadius: '10px', textTransform: 'none', fontWeight: 700, fontFamily: 'Plus Jakarta Sans, sans-serif',
                            fontSize: '0.83rem', px: 2.5, boxShadow: 'none',
                            bgcolor: status === 'Approved' ? T.green : T.rose,
                            '&:hover': {
                                bgcolor: status === 'Approved' ? '#047857' : '#B91C1C',
                                boxShadow: `0 4px 14px ${status === 'Approved' ? T.green : T.rose}44`,
                            },
                            '&.Mui-disabled': { bgcolor: T.border, color: T.muted },
                        }}>
                    {loading ? 'Updating…' : status === 'Approved' ? 'Approve Application' : 'Reject Application'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ApplicationStatusDialog;