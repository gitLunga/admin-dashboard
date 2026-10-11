import React from 'react';
import { Box, Container, Typography } from '@mui/material';
import { Lock as LockIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Navbar from '../Navigation/Navbar';

const T = {
    bg: '#F8F9FC', surface: '#FFFFFF', border: '#E8ECF4', text: '#0F1F3D', muted: '#6B7A99',
    accent: '#1E4FD8', accentSoft: '#EBF0FF',
};

const MESSAGE = 'Your password is managed by your organisation, not by this system. ' +
    'To change or reset it, use your Microsoft / Windows account (or contact your service desk).';

// Shown wherever this system would otherwise offer to change or reset a password, when people sign in through
// the organisation's directory (Active Directory / Entra ID).
export const DirectoryPasswordCard = () => (
    <Box role="note" sx={{ display: 'flex', gap: 1.4, p: 2, borderRadius: '12px', bgcolor: T.accentSoft, border: `1px solid ${T.accent}22` }}>
        <LockIcon sx={{ fontSize: 18, color: T.accent, mt: '2px', flexShrink: 0 }} />
        <Box>
            <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: T.text, mb: 0.4 }}>Password managed by your organisation</Typography>
            <Typography sx={{ fontSize: '0.8rem', color: T.muted, lineHeight: 1.6 }}>{MESSAGE}</Typography>
        </Box>
    </Box>
);

const DirectoryPasswordPage = () => {
    const navigate = useNavigate();
    return (
        <Box sx={{ minHeight: '100vh', bgcolor: T.bg, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            <Navbar />
            <Container maxWidth="xs" sx={{ py: { xs: 5, md: 8 } }}>
                <Box sx={{ bgcolor: T.surface, borderRadius: '16px', border: `1px solid ${T.border}`, overflow: 'hidden', boxShadow: '0 8px 32px rgba(15,31,61,0.08)' }}>
                    <Box sx={{ height: 4, bgcolor: T.accent }} />
                    <Box sx={{ p: { xs: 3, md: 4 } }}>
                        <Box component="button" type="button" onClick={() => navigate('/login')}
                             sx={{ border: 'none', bgcolor: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 0.7, mb: 3, p: 0, fontFamily: 'inherit', fontSize: '0.8rem', fontWeight: 600, color: T.muted, '&:hover': { color: T.accent } }}>
                            <ArrowBackIcon sx={{ fontSize: 14 }} />
                            Back to Login
                        </Box>
                        <DirectoryPasswordCard />
                    </Box>
                </Box>
            </Container>
        </Box>
    );
};

export default DirectoryPasswordPage;
