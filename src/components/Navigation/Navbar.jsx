import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Box, Container, Typography } from '@mui/material';
import { Gavel as GavelIcon } from '@mui/icons-material';
import logoImage from '../../assets/logo.png';

/* ── Design tokens ── */
const T = {
    bg: '#F8F9FC', surface: '#FFFFFF', border: '#E8ECF4',
    text: '#0F1F3D', muted: '#6B7A99',
    accent: '#1E4FD8', accentSoft: '#EBF0FF',
};

const NAV_LINKS = [
    { label: 'Home',           path: '/'                },
    { label: 'Login',          path: '/login'           },
    { label: 'Register',       path: '/register'        },
    { label: 'Reset Password', path: '/forgot-password' },
];

const Navbar = () => {
    const location = useLocation();

    return (
        <Box
            component="nav"
            sx={{
                bgcolor: T.surface,
                borderBottom: `1px solid ${T.border}`,
                position: 'sticky', top: 0, zIndex: 100,
            }}
        >
            <Container maxWidth="lg">
                <Box sx={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', py: 1.4,
                }}>

                    {/* ── Logo ── */}
                    <Box
                        component={Link} to="/"
                        sx={{ display: 'flex', alignItems: 'center', gap: 1.5, textDecoration: 'none' }}
                    >
                        {/* SA Gov badge box */}
                        <Box sx={{
                            px: 1.2, py: 0.55, borderRadius: '9px',
                            bgcolor: T.accentSoft, border: `1px solid ${T.border}`,
                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                            minWidth: 56,
                        }}>
                            <Box
                                component="img" src={logoImage} alt="Logo"
                                sx={{ height: 20, width: 'auto', objectFit: 'contain' }}
                                onError={e => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                }}
                            />
                            <GavelIcon sx={{
                                display: 'none', fontSize: 16, color: T.accent,
                                alignItems: 'center', justifyContent: 'center',
                            }} />
                            <Typography sx={{
                                fontSize: '0.5rem', fontWeight: 800, color: T.accent,
                                letterSpacing: 0.8, textTransform: 'uppercase',
                                lineHeight: 1, mt: 0.35,
                                fontFamily: 'Plus Jakarta Sans, sans-serif',
                            }}>
                                RSA
                            </Typography>
                        </Box>

                        {/* Wordmark */}
                        <Box>
                            <Typography sx={{
                                fontWeight: 800, fontSize: '0.92rem', color: T.text,
                                letterSpacing: '-0.2px', lineHeight: 1.2,
                                fontFamily: 'Plus Jakarta Sans, sans-serif',
                            }}>
                                Judicial Admin
                            </Typography>
                            <Typography sx={{
                                fontSize: '0.62rem', color: T.muted, letterSpacing: 0.3,
                                fontFamily: 'Plus Jakarta Sans, sans-serif',
                            }}>
                                Management System
                            </Typography>
                        </Box>
                    </Box>

                    {/* ── Nav links ── */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {NAV_LINKS.map(({ label, path }) => {
                            const active   = location.pathname === path;
                            const isAction = label === 'Register';
                            return (
                                <Box
                                    key={path}
                                    component={Link} to={path}
                                    sx={{
                                        textDecoration: 'none',
                                        fontFamily: 'Plus Jakarta Sans, sans-serif',
                                        fontWeight: active ? 700 : 600,
                                        fontSize: '0.82rem',
                                        px: 1.5, py: 0.8,
                                        borderRadius: '9px',
                                        transition: 'all 0.15s ease',
                                        ...(isAction ? {
                                            bgcolor: T.accent, color: '#fff',
                                            border: `1.5px solid ${T.accent}`,
                                            '&:hover': { bgcolor: '#1641B8' },
                                        } : active ? {
                                            color: T.accent, bgcolor: T.accentSoft,
                                            borderBottom: `2px solid ${T.accent}`,
                                            borderRadius: '9px 9px 4px 4px',
                                        } : {
                                            color: T.muted,
                                            '&:hover': { bgcolor: T.bg, color: T.text },
                                        }),
                                    }}
                                >
                                    {label}
                                </Box>
                            );
                        })}
                    </Box>
                </Box>
            </Container>
        </Box>
    );
};

export default Navbar;