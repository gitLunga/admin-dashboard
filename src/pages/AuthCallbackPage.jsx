import React, { useEffect, useRef } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { saveSession, homeRouteFor } from '../utils/session';

const T = { bg: '#F8F9FC', text: '#0F1F3D', muted: '#6B7A99', accent: '#1E4FD8' };

// Where Microsoft sign-in lands. The server has already checked the person with Microsoft and sent the
// browser here with a one-time ticket (?ticket=) or an explanation (?error=). The ticket is swapped for the
// session, so access tokens never appear in an address bar or the browser history.
const AuthCallbackPage = () => {
    const navigate = useNavigate();
    const started = useRef(false);        // a ticket works once: never swap it twice (React may run effects twice in development)

    useEffect(() => {
        if (started.current) return;
        started.current = true;

        const params = new URLSearchParams(window.location.search);
        const ticket = params.get('ticket');
        const error = params.get('error');

        const backToLogin = (type, text) => {
            sessionStorage.setItem('auth_flash', JSON.stringify({ type, text, title: 'Sign-in Failed' }));
            navigate('/login', { replace: true });
        };

        if (!ticket) {
            backToLogin('error', params.get('error_description') ||
                (error ? 'Microsoft sign-in was not completed.' : 'This sign-in link is not valid. Please sign in again.'));
            return;
        }

        // Take the ticket out of the address bar straight away.
        window.history.replaceState(null, '', window.location.pathname);

        authAPI.exchangeTicket(ticket)
            .then((response) => {
                const user = saveSession(response.data?.data || response.data);
                navigate(homeRouteFor(user), { replace: true });
            })
            .catch((err) => {
                backToLogin('error', err.response?.data?.message || 'Sign-in could not be completed. Please try again.');
            });
    }, [navigate]);

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 2 }}>
            <CircularProgress size={28} sx={{ color: T.accent }} />
            <Typography sx={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '0.9rem', color: T.muted }}>
                Signing you in…
            </Typography>
        </Box>
    );
};

export default AuthCallbackPage;
