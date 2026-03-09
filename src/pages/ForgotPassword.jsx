import React, { useState } from 'react';
import { Box, Container, Typography, CircularProgress } from '@mui/material';
import {
    Email as EmailIcon, ArrowBack as ArrowBackIcon,
    Lock as LockIcon, MarkEmailRead as MarkEmailReadIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';

const T = {
    bg: '#F8F9FC', surface: '#FFFFFF', border: '#E8ECF4',
    text: '#0F1F3D', muted: '#6B7A99',
    accent: '#1E4FD8', accentSoft: '#EBF0FF',
    green: '#059669', greenSoft: '#D1FAE5',
    rose: '#DC2626', roseSoft: '#FEE2E2',
    amber: '#D97706', amberSoft: '#FEF3C7',
};

/* ─────────────────────────────────────────────────────────────
   EmailInput defined OUTSIDE — prevents focus loss on re-render
───────────────────────────────────────────────────────────── */
const EmailInput = ({ value, onChange, disabled, hasError }) => {
    const [focused, setFocused] = useState(false);
    return (
        <Box sx={{
            display: 'flex', alignItems: 'center', gap: 1, bgcolor: T.surface,
            border: `1.5px solid ${hasError ? T.rose : focused ? T.accent : T.border}`,
            borderRadius: '10px', px: 1.4, py: 0.9,
            boxShadow: focused ? `0 0 0 3px ${hasError ? T.roseSoft : T.accentSoft}` : 'none',
            transition: 'all 0.2s ease',
        }}>
            <EmailIcon sx={{ fontSize: 16, color: focused ? T.accent : T.muted, flexShrink: 0 }} />
            <input
                type="email" placeholder="Enter your admin email"
                value={value} disabled={disabled} onChange={onChange}
                onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
                style={{ border: 'none', outline: 'none', background: 'transparent', flex: 1, fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '0.87rem', color: T.text }}
            />
        </Box>
    );
};

/* ═══════════════════════════ MAIN PAGE ═══════════════════════════ */
const ForgotPasswordPage = () => {
    const navigate = useNavigate();
    const [email,          setEmail]          = useState('');
    const [loading,        setLoading]        = useState(false);
    const [error,          setError]          = useState('');
    const [success,        setSuccess]        = useState(false);
    const [submittedEmail, setSubmittedEmail] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email.trim()) { setError('Please enter your email address'); return; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Please enter a valid email address'); return; }

        setLoading(true); setError('');
        try {
            await new Promise(resolve => setTimeout(resolve, 1500));
            setSuccess(true); setSubmittedEmail(email); setEmail('');
        } catch {
            setError('Failed to send reset email. Please try again.');
        } finally { setLoading(false); }
    };

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: T.bg, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600;700&display=swap');
                @keyframes fadeUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
            `}</style>

            <Navbar />

            <Container maxWidth="xs" sx={{ py: { xs: 5, md: 8 } }}>
                <Box sx={{ bgcolor: T.surface, borderRadius: '16px', border: `1px solid ${T.border}`, overflow: 'hidden', boxShadow: '0 8px 32px rgba(15,31,61,0.08)', animation: 'fadeUp 0.45s ease-out' }}>
                    <Box sx={{ height: 4, bgcolor: success ? T.green : T.accent }} />

                    <Box sx={{ p: { xs: 3, md: 4 } }}>
                        {/* Back button */}
                        <Box component="button" type="button" onClick={() => navigate('/login')}
                             sx={{ border: 'none', bgcolor: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 0.7, mb: 3, p: 0, fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '0.8rem', fontWeight: 600, color: T.muted, '&:hover': { color: T.accent }, transition: 'color 0.15s' }}>
                            <ArrowBackIcon sx={{ fontSize: 14 }} />
                            Back to Login
                        </Box>

                        {success ? (
                            /* ── Success state ── */
                            <Box sx={{ textAlign: 'center' }}>
                                <Box sx={{ width: 58, height: 58, borderRadius: '16px', bgcolor: T.greenSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
                                    <MarkEmailReadIcon sx={{ fontSize: 30, color: T.green }} />
                                </Box>
                                <Typography sx={{ fontWeight: 800, fontSize: '1.3rem', color: T.text, letterSpacing: '-0.3px', mb: 0.6, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                                    Check Your Email
                                </Typography>
                                <Typography sx={{ fontSize: '0.82rem', color: T.muted, mb: 2.5, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                                    We've sent password reset instructions to:
                                </Typography>
                                <Box sx={{ p: 1.8, borderRadius: '10px', bgcolor: T.accentSoft, border: `1px solid ${T.accent}22`, mb: 3 }}>
                                    <Typography sx={{ fontWeight: 700, fontSize: '0.87rem', color: T.accent, fontFamily: 'JetBrains Mono, monospace' }}>
                                        {submittedEmail}
                                    </Typography>
                                </Box>
                                <Typography sx={{ fontSize: '0.79rem', color: T.muted, mb: 3.5, lineHeight: 1.6, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                                    Check your inbox and follow the instructions. The reset link expires in 1 hour.
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
                                    <Box component="button" type="button" onClick={() => navigate('/login')}
                                         sx={{ width: '100%', py: 1.3, border: 'none', borderRadius: '11px', cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, fontSize: '0.87rem', bgcolor: T.accent, color: '#fff', boxShadow: `0 4px 14px ${T.accent}44`, '&:hover': { bgcolor: '#1641B8' }, transition: 'background-color 0.15s' }}>
                                        Return to Login
                                    </Box>
                                    <Box component="button" type="button" onClick={() => { setSuccess(false); setEmail(submittedEmail); }}
                                         sx={{ width: '100%', py: 1.3, border: `1.5px solid ${T.border}`, borderRadius: '11px', cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 600, fontSize: '0.87rem', bgcolor: T.bg, color: T.muted, '&:hover': { bgcolor: T.border }, transition: 'background-color 0.15s' }}>
                                        Resend Email
                                    </Box>
                                </Box>
                            </Box>
                        ) : (
                            /* ── Request form ── */
                            <>
                                <Box sx={{ textAlign: 'center', mb: 3.5 }}>
                                    <Box sx={{ width: 52, height: 52, borderRadius: '14px', bgcolor: T.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 1.5 }}>
                                        <LockIcon sx={{ fontSize: 24, color: T.accent }} />
                                    </Box>
                                    <Typography sx={{ fontWeight: 800, fontSize: '1.35rem', color: T.text, letterSpacing: '-0.3px', mb: 0.4, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                                        Forgot Password?
                                    </Typography>
                                    <Typography sx={{ fontSize: '0.82rem', color: T.muted, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                                        Enter your email and we'll send reset instructions
                                    </Typography>
                                </Box>

                                {error && (
                                    <Box sx={{ mb: 2.5, p: 1.8, borderRadius: '10px', bgcolor: T.roseSoft, border: `1px solid ${T.rose}22` }}>
                                        <Typography sx={{ fontSize: '0.8rem', color: T.rose, fontWeight: 600, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{error}</Typography>
                                    </Box>
                                )}

                                <Box component="form" onSubmit={handleSubmit} noValidate>
                                    <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: 0.8, mb: 0.75, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                                        Email Address
                                    </Typography>

                                    <EmailInput
                                        value={email}
                                        onChange={e => { setEmail(e.target.value); setError(''); }}
                                        disabled={loading}
                                        hasError={!!error}
                                    />

                                    <Typography sx={{ fontSize: '0.71rem', color: T.muted, mt: 0.8, mb: 2.5, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                                        Enter the email address associated with your admin account
                                    </Typography>

                                    <Box component="button" type="submit" disabled={loading || !email.trim()}
                                         sx={{ width: '100%', py: 1.4, border: 'none', borderRadius: '12px', cursor: loading || !email.trim() ? 'not-allowed' : 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, fontSize: '0.9rem', bgcolor: loading || !email.trim() ? T.border : T.accent, color: loading || !email.trim() ? T.muted : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, boxShadow: loading || !email.trim() ? 'none' : `0 4px 14px ${T.accent}44`, transition: 'all 0.2s ease', '&:hover': { bgcolor: loading || !email.trim() ? T.border : '#1641B8' } }}>
                                        {loading ? <><CircularProgress size={16} sx={{ color: T.muted }} /> Sending…</> : 'Send Reset Instructions'}
                                    </Box>

                                    <Box sx={{ mt: 2.5, p: 1.7, borderRadius: '10px', bgcolor: T.amberSoft, border: `1px solid ${T.amber}22` }}>
                                        <Typography sx={{ fontSize: '0.74rem', color: T.amber, fontWeight: 600, lineHeight: 1.55, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                                            The reset link will expire in 1 hour for security purposes.
                                        </Typography>
                                    </Box>
                                </Box>
                            </>
                        )}
                    </Box>
                </Box>

                <Typography sx={{ textAlign: 'center', mt: 3, fontSize: '0.77rem', color: T.muted, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                    Need help? Contact your system administrator.
                </Typography>
            </Container>
        </Box>
    );
};

export default ForgotPasswordPage;