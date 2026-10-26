import React, { useEffect, useState } from 'react';
import {
    Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Typography,
} from '@mui/material';
import { adminAPI } from '../../services/api';

const T = {
    bg: '#F8F9FC', surface: '#FFFFFF', border: '#E8ECF4', text: '#0F1F3D', muted: '#6B7A99',
    accent: '#1E4FD8', accentSoft: '#EBF0FF', green: '#059669', rose: '#DC2626', roseSoft: '#FEE2E2',
    amber: '#D97706', amberSoft: '#FEF3C7',
};

const Stat = ({ label, value, color }) => (
    <Box sx={{ flex: 1, p: 1.5, borderRadius: '10px', border: `1px solid ${T.border}`, textAlign: 'center' }}>
        <Typography sx={{ fontWeight: 800, fontSize: '1.4rem', color }}>{value}</Typography>
        <Typography sx={{ fontSize: '0.7rem', color: T.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.6 }}>{label}</Typography>
    </Box>
);

// Pulls the people in the directory's staff groups into the system. Always shows a preview first (a dry run
// that changes nothing), then applies it only when the Admin confirms.
const DirectorySyncDialog = ({ open, onClose, onApplied }) => {
    const [phase, setPhase] = useState('previewing');      // previewing | ready | applying | done | failed
    const [result, setResult] = useState(null);
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!open) return undefined;
        let active = true;
        setPhase('previewing'); setResult(null); setMessage('');
        adminAPI.syncDirectory(true)
            .then((res) => { if (active) { setResult(res.data?.data); setPhase('ready'); } })
            .catch((err) => { if (active) { setMessage(err.response?.data?.message || 'Could not read the directory.'); setPhase('failed'); } });
        return () => { active = false; };
    }, [open]);

    const apply = async () => {
        setPhase('applying');
        try {
            const res = await adminAPI.syncDirectory(false);
            setResult(res.data?.data);
            setPhase('done');
            onApplied?.();
        } catch (err) {
            setMessage(err.response?.data?.message || 'The sync failed.');
            setPhase('failed');
        }
    };

    const nothing = result && !result.created && !result.updated && !result.revoked;

    return (
        <Dialog open={open} onClose={phase === 'applying' ? undefined : onClose} maxWidth="xs" fullWidth
                PaperProps={{ sx: { borderRadius: '16px' } }}>
            <DialogTitle sx={{ fontWeight: 800, fontSize: '1.05rem', color: T.text, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                Sync staff from the directory
            </DialogTitle>
            <DialogContent>
                <Typography sx={{ fontSize: '0.8rem', color: T.muted, mb: 2, lineHeight: 1.6 }}>
                    Reads the members of your staff groups (Admin, Manager, Finance…) and creates or updates their accounts.
                    Staff whose role came from a group they have since left are switched off.
                </Typography>

                {(phase === 'previewing' || phase === 'applying') && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, py: 2 }}>
                        <CircularProgress size={18} />
                        <Typography sx={{ fontSize: '0.82rem', color: T.muted }}>
                            {phase === 'previewing' ? 'Checking what would change…' : 'Syncing…'}
                        </Typography>
                    </Box>
                )}

                {phase === 'failed' && (
                    <Box role="alert" sx={{ p: 1.5, borderRadius: '10px', bgcolor: T.roseSoft, color: T.rose, fontSize: '0.8rem', fontWeight: 600 }}>
                        {message}
                    </Box>
                )}

                {(phase === 'ready' || phase === 'done') && result && (
                    <>
                        <Typography sx={{ fontSize: '0.74rem', fontWeight: 700, color: phase === 'done' ? T.green : T.accent, textTransform: 'uppercase', letterSpacing: 0.8, mb: 1 }}>
                            {phase === 'done' ? 'Done' : 'Preview: nothing has changed yet'}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
                            <Stat label="To create" value={result.created} color={T.green} />
                            <Stat label="To update" value={result.updated} color={T.accent} />
                            <Stat label="Switched off" value={result.revoked} color={T.amber} />
                        </Box>
                        {nothing && <Typography sx={{ fontSize: '0.8rem', color: T.muted }}>Everything is already up to date.</Typography>}
                        {result.errors?.length > 0 && (
                            <Box sx={{ p: 1.5, borderRadius: '10px', bgcolor: T.amberSoft, fontSize: '0.76rem', color: T.text }}>
                                {result.errors.map((e) => <div key={`${e.account}-${e.message}`}><b>{e.account}</b>: {e.message}</div>)}
                            </Box>
                        )}
                    </>
                )}
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
                <Button onClick={onClose} disabled={phase === 'applying'} sx={{ textTransform: 'none', fontWeight: 600, color: T.muted }}>
                    {phase === 'done' ? 'Close' : 'Cancel'}
                </Button>
                {phase === 'ready' && !nothing && (
                    <Button onClick={apply} variant="contained" sx={{ textTransform: 'none', fontWeight: 700, bgcolor: T.accent, boxShadow: 'none' }}>
                        Apply sync
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default DirectorySyncDialog;
