import React from 'react';
import {
    Drawer,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Box,
    Typography,
    IconButton,
    useMediaQuery,
    useTheme,
    Divider,
} from '@mui/material';
import {
    Dashboard as DashboardIcon,
    People as PeopleIcon,
    Person as PersonIcon,
    Group as GroupIcon,
    BarChart as ChartIcon,
    Search as SearchIcon,
    ChevronLeft as ChevronLeftIcon,
    PhoneAndroid as PhoneAndroidIcon,
    Gavel as GavelIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const drawerWidth = 256;

/* ─── Design tokens (shared across all files) ─── */
export const T = {
    bg:         '#F8F9FC',
    surface:    '#FFFFFF',
    border:     '#E8ECF4',
    text:       '#0F1F3D',
    muted:      '#6B7A99',
    accent:     '#1E4FD8',      // strong cobalt blue
    accentMid:  '#3366FF',
    accentSoft: '#EBF0FF',
    green:      '#059669',
    greenSoft:  '#D1FAE5',
    amber:      '#D97706',
    amberSoft:  '#FEF3C7',
    rose:       '#DC2626',
    roseSoft:   '#FEE2E2',
    slate:      '#475569',
};

const menuItems = [
    { text: 'Dashboard',          icon: <DashboardIcon />,    path: '/dashboard' },
    // { text: 'All Users',          icon: <PeopleIcon />,       path: '/users' },
    { text: 'Applications',       icon: <PhoneAndroidIcon />, path: '/admin/applications' },
    { text: 'Client Users',       icon: <PersonIcon />,       path: '/client-users' },
    { text: 'Operational Users',  icon: <GroupIcon />,        path: '/operational-users' },
    { text: 'Statistics',         icon: <ChartIcon />,        path: '/statistics' },
    { text: 'Search Users',       icon: <SearchIcon />,       path: '/search' },
];

const globalStyles = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

*, *::before, *::after { font-family: 'Plus Jakarta Sans', sans-serif; box-sizing: border-box; }
.mono { font-family: 'JetBrains Mono', monospace !important; }

@keyframes fadeUp   { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:none; } }
@keyframes slideIn  { from { opacity:0; transform:translateX(-10px); } to { opacity:1; transform:none; } }
@keyframes barGrow  { from { width:0; } }
@keyframes dotPulse { 0%,100%{opacity:1;transform:scale(1);} 50%{opacity:.5;transform:scale(.8);} }
@keyframes shimmer  { 0%{transform:translateX(-100%);} 100%{transform:translateX(200%);} }
`;

if (!document.getElementById('ja-styles')) {
    const s = document.createElement('style');
    s.id = 'ja-styles';
    s.textContent = globalStyles;
    document.head.appendChild(s);
}

const Sidebar = ({ mobileOpen, onDrawerToggle }) => {
    const theme   = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const navigate  = useNavigate();
    const location  = useLocation();


    const drawerContent = (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: T.surface }}>

            {/* ── Logo ── */}
            <Box sx={{
                px: 3, py: 2.5,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                borderBottom: `1px solid ${T.border}`,
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                    <Box sx={{
                        width: 34, height: 34, borderRadius: '10px',
                        bgcolor: T.accent, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: `0 4px 12px ${T.accent}44`,
                    }}>
                        <GavelIcon sx={{ fontSize: 18, color: '#fff' }} />
                    </Box>
                    <Box>
                        <Typography sx={{ fontSize: '0.95rem', fontWeight: 800, color: T.text, lineHeight: 1.1 }}>
                            Judicial
                        </Typography>
                        <Typography sx={{ fontSize: '0.68rem', fontWeight: 600, color: T.muted, letterSpacing: 0.5 }}>
                            Admin Portal
                        </Typography>
                    </Box>
                </Box>
                {isMobile && (
                    <IconButton onClick={onDrawerToggle} size="small"
                                sx={{ color: T.muted, '&:hover': { bgcolor: T.accentSoft, color: T.accent } }}>
                        <ChevronLeftIcon fontSize="small" />
                    </IconButton>
                )}
            </Box>

            {/* ── Nav ── */}
            <Box sx={{ px: 2, py: 2.5, flex: 1 }}>
                <Typography sx={{
                    fontSize: '0.67rem', fontWeight: 700, color: T.muted,
                    letterSpacing: 1.2, textTransform: 'uppercase', px: 1.5, mb: 1,
                }}>
                    Navigation
                </Typography>

                <List disablePadding>
                    {menuItems.map((item, i) => {
                        const active = location.pathname.startsWith(item.path);
                        return (
                            <ListItem
                                button
                                key={item.text}
                                selected={active}

                                onClick={() => { navigate(item.path); if (isMobile) onDrawerToggle(); }}
                                sx={{
                                    borderRadius: '10px', mb: 0.5, px: 1.5, py: 1,
                                    animation: `slideIn 0.4s ease-out ${i * 0.05}s both`,
                                    transition: 'all 0.18s ease',
                                    bgcolor: active ? T.accentSoft : 'transparent',
                                    '&:hover': {
                                        bgcolor: active ? T.accentSoft : T.bg,
                                        transform: 'translateX(3px)',
                                    },
                                    '&.Mui-selected': { bgcolor: T.accentSoft },
                                    '&.Mui-selected:hover': { bgcolor: T.accentSoft },
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: 36 }}>
                                    {React.cloneElement(item.icon, {
                                        sx: { fontSize: 19, color: active ? T.accent : T.muted }
                                    })}
                                </ListItemIcon>
                                <ListItemText
                                    primary={item.text}
                                    primaryTypographyProps={{
                                        fontSize: '0.855rem',
                                        fontWeight: active ? 700 : 500,
                                        color: active ? T.accent : T.text,
                                        fontFamily: 'Plus Jakarta Sans',
                                    }}
                                />
                                {active && (
                                    <Box sx={{
                                        width: 6, height: 6, borderRadius: '50%',
                                        bgcolor: T.accent, flexShrink: 0,
                                        animation: 'dotPulse 2s ease-in-out infinite',
                                    }} />
                                )}
                            </ListItem>
                        );
                    })}
                </List>
            </Box>

            {/* ── Footer ── */}
            <Box sx={{ px: 2, pb: 2.5 }}>
                <Divider sx={{ borderColor: T.border, mb: 2 }} />
                <Box sx={{
                    px: 2, py: 1.5, borderRadius: '10px',
                    bgcolor: T.bg, border: `1px solid ${T.border}`,
                }}>
                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: T.muted }}>
                        Version 1.0.0
                    </Typography>
                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: T.accent, mt: 0.2 }}>
                        Premium Edition
                    </Typography>
                </Box>
            </Box>
        </Box>
    );

    const paperSx = {
        boxSizing: 'border-box',
        width: drawerWidth,
        bgcolor: T.surface,
        borderRight: `1px solid ${T.border}`,
        boxShadow: 'none',
    };

    return (
        <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
            {isMobile ? (
                <Drawer variant="temporary" open={mobileOpen} onClose={onDrawerToggle}
                        ModalProps={{ keepMounted: true }}
                        sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': paperSx }}>
                    {drawerContent}
                </Drawer>
            ) : (
                <Drawer variant="permanent" open
                        sx={{ display: { xs: 'none', sm: 'block' }, '& .MuiDrawer-paper': paperSx }}>
                    {drawerContent}
                </Drawer>
            )}
        </Box>
    );
};

export default Sidebar;