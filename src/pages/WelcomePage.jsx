import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Container, Typography, Grid } from '@mui/material';
import {
    Security as SecurityIcon,
    Speed as SpeedIcon,
    ManageAccounts as ManageIcon,
    ArrowForward as ArrowIcon,
    CheckCircle as CheckIcon,
    Gavel as GavelIcon,
} from '@mui/icons-material';
// import logoImage from '../assets/logo.png';
import Navbar from '../components/Navigation/Navbar';

/* ── Design tokens ── */
const T = {
    bg: '#F8F9FC', surface: '#FFFFFF', border: '#E8ECF4',
    text: '#0F1F3D', muted: '#6B7A99',
    accent: '#1E4FD8', accentSoft: '#EBF0FF',
    green: '#059669', greenSoft: '#D1FAE5',
    amber: '#D97706', amberSoft: '#FEF3C7',
    purple: '#7C3AED', purpleSoft: '#EDE9FE',
};

const FEATURES = [
    {
        icon: SpeedIcon, color: T.accent, soft: T.accentSoft,
        title: 'Fast & Efficient',
        desc: 'Streamlined processes for judicial administration with real-time updates and instant access to critical data.',
    },
    {
        icon: SecurityIcon, color: T.green, soft: T.greenSoft,
        title: 'Secure & Compliant',
        desc: 'Enterprise-grade security meeting judicial standards. Role-based access control with full audit trails.',
    },
    {
        icon: ManageIcon, color: T.purple, soft: T.purpleSoft,
        title: 'Powerful Management',
        desc: 'Comprehensive tools for user management, document verification, device tracking and application approvals.',
    },
];

const BULLETS = [
    'Real-time dashboard analytics',
    'Document verification workflow',
    'Multi-region user management',
    'Automated status notifications',
];

/* ══════════════════════════════════════════════════════════ */
const WelcomePage = () => {

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: T.bg, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600;700&display=swap');
                @keyframes fadeUp  { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
                @keyframes dotPulse { 0%,100%{ transform:scale(1); opacity:1; } 50%{ transform:scale(1.5); opacity:0.6; } }
            `}</style>

            <Navbar />

            {/* ══ Hero ══ */}
            <Box sx={{ bgcolor: T.surface, borderBottom: `1px solid ${T.border}` }}>
                <Container maxWidth="lg" sx={{ py: { xs: 6, md: 9 } }}>
                    <Grid container spacing={5} alignItems="center">

                        {/* Left — text */}
                        <Grid item xs={12} md={6}>
                            <Box sx={{ animation: 'fadeUp 0.5s ease-out' }}>
                                {/* Badge */}
                                <Box sx={{
                                    display: 'inline-flex', alignItems: 'center', gap: 0.8,
                                    px: 1.4, py: 0.6, borderRadius: '20px',
                                    bgcolor: T.accentSoft, border: `1px solid ${T.accent}22`, mb: 2.5,
                                }}>
                                    <GavelIcon sx={{ fontSize: 12, color: T.accent }} />
                                    <Typography sx={{
                                        fontSize: '0.7rem', fontWeight: 700, color: T.accent,
                                        letterSpacing: 0.8, textTransform: 'uppercase',
                                        fontFamily: 'Plus Jakarta Sans, sans-serif',
                                    }}>
                                        Republic of South Africa
                                    </Typography>
                                </Box>

                                <Typography sx={{
                                    fontWeight: 800, color: T.text,
                                    fontSize: { xs: '2rem', md: '2.6rem' },
                                    letterSpacing: '-0.5px', lineHeight: 1.2, mb: 1.5,
                                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                                }}>
                                    Judicial Admin
                                    <Box component="span" sx={{ color: T.accent }}> System</Box>
                                </Typography>

                                <Typography sx={{
                                    fontSize: '0.97rem', color: T.muted,
                                    lineHeight: 1.75, mb: 3.5, maxWidth: 460,
                                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                                }}>
                                    Your comprehensive solution for judicial administration, user management and document verification — built for the demands of modern governance.
                                </Typography>

                                {/* Bullet list */}
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 4 }}>
                                    {BULLETS.map(b => (
                                        <Box key={b} sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                                            <CheckIcon sx={{ fontSize: 15, color: T.green, flexShrink: 0 }} />
                                            <Typography sx={{
                                                fontSize: '0.85rem', color: T.text,
                                                fontFamily: 'Plus Jakarta Sans, sans-serif',
                                            }}>
                                                {b}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Box>

                                {/* CTAs */}
                                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                                    <Box
                                        component={Link} to="/register"
                                        sx={{
                                            textDecoration: 'none',
                                            display: 'inline-flex', alignItems: 'center', gap: 0.8,
                                            px: 3, py: 1.4, borderRadius: '12px',
                                            bgcolor: T.accent, color: '#fff',
                                            fontWeight: 700, fontSize: '0.9rem',
                                            fontFamily: 'Plus Jakarta Sans, sans-serif',
                                            boxShadow: `0 4px 14px ${T.accent}44`,
                                            '&:hover': { bgcolor: '#1641B8' },
                                            transition: 'background-color 0.15s ease',
                                        }}
                                    >
                                        Get Started <ArrowIcon sx={{ fontSize: 16 }} />
                                    </Box>
                                    <Box
                                        component={Link} to="/login"
                                        sx={{
                                            textDecoration: 'none',
                                            display: 'inline-flex', alignItems: 'center',
                                            px: 3, py: 1.4, borderRadius: '12px',
                                            color: T.accent, fontWeight: 700, fontSize: '0.9rem',
                                            fontFamily: 'Plus Jakarta Sans, sans-serif',
                                            border: `1.5px solid ${T.border}`,
                                            '&:hover': { bgcolor: T.accentSoft, borderColor: T.accent },
                                            transition: 'all 0.15s ease',
                                        }}
                                    >
                                        Sign In
                                    </Box>
                                </Box>
                            </Box>
                        </Grid>

                        {/* Right — decorative stat panel */}
                        <Grid item xs={12} md={6} sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'center' }}>
                            <Box sx={{ animation: 'fadeUp 0.55s ease-out 0.1s both' }}>
                                <Box sx={{
                                    width: 330, p: 3, borderRadius: '20px',
                                    bgcolor: T.bg, border: `1px solid ${T.border}`,
                                    boxShadow: '0 20px 60px rgba(15,31,61,0.09)',
                                }}>
                                    {/* Mini stat rows */}
                                    {[
                                        { label: 'Active Users',        value: '2,847',  color: T.accent, soft: T.accentSoft },
                                        { label: 'Documents Verified',  value: '14,203', color: T.green,  soft: T.greenSoft  },
                                        { label: 'Pending Approvals',   value: '38',     color: T.amber,  soft: T.amberSoft  },
                                    ].map(({ label, value, color, soft }, i) => (
                                        <Box key={label} sx={{
                                            p: 2, mb: i < 2 ? 1.5 : 0,
                                            borderRadius: '12px', bgcolor: T.surface,
                                            border: `1px solid ${T.border}`,
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        }}>
                                            <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: T.muted, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                                                {label}
                                            </Typography>
                                            <Box sx={{ px: 1.2, py: 0.4, borderRadius: '8px', bgcolor: soft }}>
                                                <Typography sx={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.85rem', fontWeight: 700, color }}>
                                                    {value}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    ))}

                                    {/* Status bar */}
                                    <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box sx={{
                                            width: 8, height: 8, borderRadius: '50%', bgcolor: T.green,
                                            animation: 'dotPulse 1.8s ease-in-out infinite',
                                        }} />
                                        <Typography sx={{ fontSize: '0.74rem', color: T.muted, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                                            All systems operational
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                        </Grid>
                    </Grid>
                </Container>
            </Box>

            {/* ══ Features ══ */}
            <Container maxWidth="lg" sx={{ py: { xs: 6, md: 8 } }}>
                <Box sx={{ textAlign: 'center', mb: 5 }}>
                    <Typography sx={{
                        fontWeight: 800, color: T.text, letterSpacing: '-0.3px', mb: 1,
                        fontSize: { xs: '1.5rem', md: '1.85rem' },
                        fontFamily: 'Plus Jakarta Sans, sans-serif',
                    }}>
                        Everything you need to manage your system
                    </Typography>
                    <Typography sx={{ fontSize: '0.9rem', color: T.muted, maxWidth: 480, mx: 'auto', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                        Built specifically for judicial administration with compliance, security and efficiency in mind.
                    </Typography>
                </Box>

                <Grid container spacing={2.5}>
                    {FEATURES.map(({ icon: Icon, color, soft, title, desc }, i) => (
                        <Grid item xs={12} md={4} key={title}>
                            <Box sx={{
                                p: 3, borderRadius: '14px',
                                bgcolor: T.surface, border: `1px solid ${T.border}`,
                                height: '100%',
                                animation: `fadeUp 0.45s ease-out ${i * 0.1}s both`,
                                transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
                                '&:hover': {
                                    transform: 'translateY(-4px)',
                                    boxShadow: '0 12px 32px rgba(15,31,61,0.09)',
                                    borderColor: `${color}44`,
                                },
                            }}>
                                <Box sx={{
                                    width: 46, height: 46, borderRadius: '12px',
                                    bgcolor: soft, display: 'flex',
                                    alignItems: 'center', justifyContent: 'center', mb: 2,
                                }}>
                                    <Icon sx={{ fontSize: 22, color }} />
                                </Box>
                                <Typography sx={{
                                    fontWeight: 700, fontSize: '0.97rem', color: T.text, mb: 0.8,
                                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                                }}>
                                    {title}
                                </Typography>
                                <Typography sx={{
                                    fontSize: '0.82rem', color: T.muted, lineHeight: 1.65,
                                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                                }}>
                                    {desc}
                                </Typography>
                            </Box>
                        </Grid>
                    ))}
                </Grid>
            </Container>

            {/* ══ CTA banner ══ */}
            <Box sx={{ bgcolor: T.accent, py: { xs: 5, md: 6 } }}>
                <Container maxWidth="md">
                    <Box sx={{ textAlign: 'center' }}>
                        <Typography sx={{
                            fontWeight: 800, color: '#fff', letterSpacing: '-0.3px', mb: 1.2,
                            fontSize: { xs: '1.5rem', md: '2rem' },
                            fontFamily: 'Plus Jakarta Sans, sans-serif',
                        }}>
                            Ready to get started?
                        </Typography>
                        <Typography sx={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.72)', mb: 3.5, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                            Already have an account? Sign in, or register for system access.
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center', flexWrap: 'wrap' }}>
                            <Box
                                component={Link} to="/login"
                                sx={{
                                    textDecoration: 'none', px: 3, py: 1.3, borderRadius: '11px',
                                    bgcolor: '#fff', color: T.accent,
                                    fontWeight: 700, fontSize: '0.88rem',
                                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                                    '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' },
                                    transition: 'background-color 0.15s',
                                }}
                            >
                                Sign In
                            </Box>
                            <Box
                                component={Link} to="/register"
                                sx={{
                                    textDecoration: 'none', px: 3, py: 1.3, borderRadius: '11px',
                                    bgcolor: 'transparent', color: '#fff',
                                    fontWeight: 700, fontSize: '0.88rem',
                                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                                    border: '1.5px solid rgba(255,255,255,0.4)',
                                    '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
                                    transition: 'background-color 0.15s',
                                }}
                            >
                                Register
                            </Box>
                        </Box>
                    </Box>
                </Container>
            </Box>

            {/* ══ Footer ══ */}
            <Box sx={{ bgcolor: T.surface, borderTop: `1px solid ${T.border}`, py: 2.5 }}>
                <Container maxWidth="lg">
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                        <Typography sx={{ fontSize: '0.74rem', color: T.muted, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                            © {new Date().getFullYear()} Department of Justice — Judicial Admin System
                        </Typography>
                        <Typography sx={{ fontSize: '0.74rem', color: T.muted, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                            Authorized personnel only
                        </Typography>
                    </Box>
                </Container>
            </Box>
        </Box>
    );
};

export default WelcomePage;