import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, TextField, Box, Typography, Alert,
} from '@mui/material';
import {
    CheckCircle as VerifiedIcon,
    Pending as PendingIcon,
    Block as RejectedIcon,
    Edit as EditIcon,
    Close as CloseIcon,
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
    { value: 'Verified', label: 'Verify',  desc: 'User has met all registration requirements.',    color: T.green, soft: T.greenSoft, Icon: VerifiedIcon  },
    { value: 'Pending',  label: 'Pending', desc: 'Keep under review — no action taken yet.',       color: T.amber, soft: T.amberSoft, Icon: PendingIcon   },
    { value: 'Rejected', label: 'Reject',  desc: 'Registration does not meet requirements. Notes required.', color: T.rose, soft: T.roseSoft,  Icon: RejectedIcon },
];

const StatusUpdateModal = ({ open, user, onClose, onSubmit }) => {
    const [status, setStatus] = useState(user?.registration_status || 'Pending');
    const [notes,  setNotes]  = useState(user?.verification_notes  || '');
    const [error,  setError]  = useState('');

    useEffect(() => {
        if (user) {
            setStatus(user.registration_status || 'Pending');
            setNotes(user.verification_notes   || '');
            setError('');
        }
    }, [user]);

    const handleSubmit = () => {
        if (!status)                                  { setError('Please select a status');                    return; }
        if (status === 'Rejected' && !notes.trim())   { setError('Please provide a reason for rejection');    return; }
        onSubmit(status, notes.trim());
    };

    const selectedMeta = STATUS_OPTIONS.find(o => o.value === status) || STATUS_OPTIONS[1];

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
                PaperProps={{ sx: {
                        borderRadius: '16px', border: `1px solid ${T.border}`,
                        boxShadow: '0 24px 60px rgba(15,31,61,0.14)', bgcolor: T.bg,
                    }}}>

            {/* ── Header ── */}
            <DialogTitle sx={{ p: 0 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    px: 3, py: 2.2, bgcolor: T.surface, borderBottom: `1px solid ${T.border}` }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                        <Box sx={{ width: 30, height: 30, borderRadius: '9px', bgcolor: T.accentSoft,
                            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <EditIcon sx={{ fontSize: 16, color: T.accent }} />
                        </Box>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: T.text }}>
                            Update Registration Status
                        </Typography>
                    </Box>
                    <Button onClick={onClose} size="small"
                            sx={{ minWidth: 0, p: 0.7, borderRadius: '8px', color: T.muted,
                                '&:hover': { bgcolor: T.bg, color: T.rose } }}>
                        <CloseIcon sx={{ fontSize: 17 }} />
                    </Button>
                </Box>
            </DialogTitle>

            <DialogContent sx={{ p: 3, bgcolor: T.bg }}>

                {/* User summary */}
                {user && (
                    <Box sx={{ p: 2, mb: 3, borderRadius: '12px', bgcolor: T.surface, border: `1px solid ${T.border}` }}>
                        <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: T.muted,
                            textTransform: 'uppercase', letterSpacing: 0.8, mb: 0.5 }}>User</Typography>
                        <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: T.text, mb: 0.3 }}>
                            {user.title} {user.first_name} {user.last_name}
                        </Typography>
                        <Typography sx={{ fontSize: '0.78rem', color: T.muted }}>{user.email}</Typography>
                    </Box>
                )}

                {error && (
                    <Alert severity="error" onClose={() => setError('')}
                           sx={{ mb: 2.5, borderRadius: '10px', fontSize: '0.82rem' }}>
                        {error}
                    </Alert>
                )}

                {/* Status selection cards */}
                <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: T.muted,
                    textTransform: 'uppercase', letterSpacing: 0.8, mb: 1.2 }}>
                    Select Status
                </Typography>
                <Box sx={{ display: 'flex', gap: 1.2, mb: 2.5, flexWrap: 'wrap' }}>
                    {STATUS_OPTIONS.map(opt => {
                        const selected = status === opt.value;
                        return (
                            <Box key={opt.value} onClick={() => { setStatus(opt.value); setError(''); }}
                                 sx={{
                                     flex: 1, minWidth: 100, p: 1.6, borderRadius: '12px', cursor: 'pointer',
                                     border: `2px solid ${selected ? opt.color : T.border}`,
                                     bgcolor: selected ? opt.soft : T.surface,
                                     transition: 'all 0.16s ease',
                                     '&:hover': { borderColor: opt.color, bgcolor: opt.soft },
                                 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.4 }}>
                                    <opt.Icon sx={{ fontSize: 16, color: selected ? opt.color : T.muted }} />
                                    <Typography sx={{ fontWeight: 700, fontSize: '0.84rem',
                                        color: selected ? opt.color : T.text }}>
                                        {opt.label}
                                    </Typography>
                                </Box>
                                <Typography sx={{ fontSize: '0.69rem', color: T.muted, lineHeight: 1.4 }}>
                                    {opt.desc}
                                </Typography>
                            </Box>
                        );
                    })}
                </Box>

                {/* Notes field */}
                <Box>
                    <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: T.muted,
                        textTransform: 'uppercase', letterSpacing: 0.8, mb: 1 }}>
                        Verification Notes
                        {status === 'Rejected'
                            ? <span style={{ color: T.rose }}> *</span>
                            : <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}> (optional)</span>
                        }
                    </Typography>
                    <TextField
                        fullWidth multiline rows={4}
                        placeholder={status === 'Rejected'
                            ? 'Provide a clear reason for rejection…'
                            : 'Add notes about this verification…'}
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        required={status === 'Rejected'}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '10px', bgcolor: T.surface, fontSize: '0.83rem',
                                '& fieldset': { borderColor: T.border },
                                '&:hover fieldset': { borderColor: status === 'Rejected' ? T.rose : T.accent },
                                '&.Mui-focused fieldset': { borderColor: status === 'Rejected' ? T.rose : T.accent },
                            },
                            '& textarea': { fontFamily: 'Plus Jakarta Sans, sans-serif' },
                        }}
                    />
                    {status === 'Rejected' && (
                        <Typography sx={{ fontSize: '0.71rem', color: T.rose, mt: 0.6, ml: 0.5 }}>
                            Required: Please provide a clear reason for rejection
                        </Typography>
                    )}
                </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2.2, bgcolor: T.surface,
                borderTop: `1px solid ${T.border}`, gap: 1.5 }}>
                <Button onClick={onClose}
                        sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600,
                            fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '0.83rem',
                            color: T.muted, border: `1px solid ${T.border}`, bgcolor: T.bg, px: 2.5,
                            '&:hover': { bgcolor: T.border } }}>
                    Cancel
                </Button>
                <Button onClick={handleSubmit} variant="contained"
                        sx={{
                            borderRadius: '10px', textTransform: 'none', fontWeight: 700,
                            fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '0.83rem',
                            px: 2.5, boxShadow: 'none',
                            bgcolor: selectedMeta.color,
                            '&:hover': {
                                bgcolor: status === 'Verified' ? '#047857'
                                    : status === 'Rejected' ? '#B91C1C'
                                        : '#B45309',
                                boxShadow: `0 4px 14px ${selectedMeta.color}44`,
                            },
                        }}>
                    {status === 'Verified' ? 'Verify User'
                        : status === 'Rejected' ? 'Reject User'
                            : 'Set as Pending'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default StatusUpdateModal;