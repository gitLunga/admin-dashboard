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

const COPY = {
    staff: {
        title: 'Sync staff from the directory',
        intro: 'Reads the members of your staff groups (Admin, Manager, Finance…) and creates or updates their accounts. ' +
               'Staff whose role came from a group they have since left are switched off.',
        apply: 'Apply sync',
    },
    clients: {
        title: 'Import clients from the directory',
        intro: 'Adds the people in your directory as clients, so they exist before their first sign-in. They arrive as ' +
               'Pending: each still completes their profile and you verify them. No emails are sent. Staff, disabled ' +
               'accounts and accounts with no email address are left out. Anyone who already registered here with the ' +
               'same email is linked to their directory account, keeping their documents and applications.',
        apply: 'Import clients',
    },
};

// Pulls people from the directory into the system. Always shows a preview first (a dry run that changes
// nothing), then applies it only when the Admin confirms. scope: 'staff' (default) or 'clients'.
const DirectorySyncDialog = ({ open, onClose, onApplied, scope = 'staff' }) => {
    const [phase, setPhase] = useState('previewing');      // previewing | ready | applying | done | failed
    const [result, setResult] = useState(null);
    const [message, setMessage] = useState('');
    const clientScope = scope === 'clients';
    const copy = COPY[clientScope ? 'clients' : 'staff'];

    // An older server ignores the scope and answers with the staff result: say so instead of showing wrong numbers.
    const understood = (data) => !clientScope || !!data?.clients;
    const NOT_SUPPORTED = 'This server does not support importing clients yet. Update the backend first.';

    useEffect(() => {
        if (!open) return undefined;
        let active = true;
        setPhase('previewing'); setResult(null); setMessage('');
        adminAPI.syncDirectory(true, clientScope ? 'clients' : undefined)
            .then((res) => {
                if (!active) return;
                const data = res.data?.data;
                if (!understood(data)) { setMessage(NOT_SUPPORTED); setPhase('failed'); return; }
                setResult(data); setPhase('ready');
            })
            .catch((err) => { if (active) { setMessage(err.response?.data?.message || 'Could not read the directory.'); setPhase('failed'); } });
        return () => { active = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, scope]);

    const apply = async () => {
        setPhase('applying');
        try {
            const res = await adminAPI.syncDirectory(false, clientScope ? 'clients' : undefined);
            const data = res.data?.data;
            if (!understood(data)) { setMessage(NOT_SUPPORTED); setPhase('failed'); return; }
            setResult(data);
            setPhase('done');
            onApplied?.();
        } catch (err) {
            setMessage(err.response?.data?.message || 'The sync failed.');
            setPhase('failed');
        }
    };

    const c = result?.clients;
    const nothing = result && (clientScope
        ? !c.created && !c.linked && !c.updated
        : !result.created && !result.updated && !result.revoked);
    const skipped = c && [
        c.skippedStaff && `${c.skippedStaff} staff`,
        c.skippedDeactivated && `${c.skippedDeactivated} deactivated`,
        c.skippedNoEmail && `${c.skippedNoEmail} without an email address`,
    ].filter(Boolean);

    return (
        <Dialog open={open} onClose={phase === 'applying' ? undefined : onClose} maxWidth="xs" fullWidth
                PaperProps={{ sx: { borderRadius: '16px' } }}>
            <DialogTitle sx={{ fontWeight: 800, fontSize: '1.05rem', color: T.text, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                {copy.title}
            </DialogTitle>
            <DialogContent>
                <Typography sx={{ fontSize: '0.8rem', color: T.muted, mb: 2, lineHeight: 1.6 }}>{copy.intro}</Typography>

                {(phase === 'previewing' || phase === 'applying') && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, py: 2 }}>
                        <CircularProgress size={18} />
                        <Typography sx={{ fontSize: '0.82rem', color: T.muted }}>
                            {phase === 'previewing' ? 'Checking what would change…' : (clientScope ? 'Importing…' : 'Syncing…')}
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
                        {clientScope ? (
                            <>
                                <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
                                    <Stat label={phase === 'done' ? 'Added' : 'To add'} value={c.created} color={T.green} />
                                    <Stat label={phase === 'done' ? 'Linked' : 'To link'} value={c.linked} color={T.accent} />
                                    <Stat label={phase === 'done' ? 'Updated' : 'To update'} value={c.updated} color={T.amber} />
                                </Box>
                                <Typography sx={{ fontSize: '0.76rem', color: T.muted, mb: 1 }}>
                                    Found {c.found} {c.source === 'clients group' ? 'in the clients group' : 'in the directory'}.
                                    {skipped?.length > 0 && ` Left out: ${skipped.join(', ')}.`}
                                </Typography>
                            </>
                        ) : (
                            <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
                                <Stat label="To create" value={result.created} color={T.green} />
                                <Stat label="To update" value={result.updated} color={T.accent} />
                                <Stat label="Switched off" value={result.revoked} color={T.amber} />
                            </Box>
                        )}
                        {nothing && <Typography sx={{ fontSize: '0.8rem', color: T.muted }}>Everything is already up to date.</Typography>}
                        {result.errors?.length > 0 && (
                            <Box sx={{ p: 1.5, borderRadius: '10px', bgcolor: T.amberSoft, fontSize: '0.76rem', color: T.text, maxHeight: 160, overflow: 'auto' }}>
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
                        {copy.apply}
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default DirectorySyncDialog;
