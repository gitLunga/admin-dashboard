import React from 'react';
import {
    Drawer,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Box,
    Typography,
    Divider,
    IconButton,
    useMediaQuery,
    useTheme,
} from '@mui/material';
import {
    Dashboard as DashboardIcon,
    People as PeopleIcon,
    Person as PersonIcon,
    Group as GroupIcon,
    BarChart as ChartIcon,
    Search as SearchIcon,
    ChevronLeft as ChevronLeftIcon,
    PhoneAndroid as PhoneAndroidIcon, // Add this import
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import  {useState} from "react";

const drawerWidth = 240;

const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'All Users', icon: <PeopleIcon />, path: '/users' }, // Changed text from 'Applications' to 'All Users'
    { text: 'Applications', icon: <PhoneAndroidIcon />, path: '/admin/applications' }, // NEW: Add Applications item
    { text: 'Client Users', icon: <PersonIcon />, path: '/client-users' },
    { text: 'Operational Users', icon: <GroupIcon />, path: '/operational-users' },
    { text: 'Statistics', icon: <ChartIcon />, path: '/statistics' },
    { text: 'Search Users', icon: <SearchIcon />, path: '/search' },
];

const Sidebar = ({ mobileOpen, onDrawerToggle }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const navigate = useNavigate();
    const location = useLocation();
    const [hoveredItem, setHoveredItem] = useState(null);

    const drawerContent = (
        <>
            <Box
                sx={{
                    p: 3,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    position: 'relative',
                    overflow: 'hidden',
                    '&:before': {
                        content: '""',
                        position: 'absolute',
                        top: -50,
                        right: -50,
                        width: 100,
                        height: 100,
                        background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)',
                        borderRadius: '50%',
                    }
                }}
            >
                <Typography
                    variant="h6"
                    sx={{
                        fontWeight: 800,
                        color: 'white',
                        zIndex: 1,
                        textShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}
                >
                    <Box component="span" sx={{ color: '#fbbf24' }}>J</Box>
                    udicial
                    <Box component="span" sx={{ color: '#fbbf24' }}>A</Box>
                    dmin
                </Typography>
                {isMobile && (
                    <IconButton
                        onClick={onDrawerToggle}
                        sx={{
                            color: 'white',
                            zIndex: 1,
                            '&:hover': {
                                background: 'rgba(255,255,255,0.1)',
                            }
                        }}
                    >
                        <ChevronLeftIcon />
                    </IconButton>
                )}
            </Box>
            <Box sx={{ px: 2, py: 3 }}>
                <Typography
                    variant="caption"
                    sx={{
                        color: 'text.secondary',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        px: 2,
                        display: 'block',
                        mb: 1
                    }}
                >
                    Main Menu
                </Typography>
                <List sx={{ mt: 2 }}>
                    {menuItems.map((item, index) => {
                        const isSelected = location.pathname.startsWith(item.path);
                        return (
                            <ListItem
                                button
                                key={item.text}
                                selected={isSelected}
                                onMouseEnter={() => setHoveredItem(index)}
                                onMouseLeave={() => setHoveredItem(null)}
                                onClick={() => {
                                    navigate(item.path);
                                    if (isMobile) onDrawerToggle();
                                }}
                                sx={{
                                    mb: 1,
                                    mx: 1,
                                    borderRadius: 3,
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    animation: `slideInLeft 0.5s ease-out ${index * 0.1}s both`,
                                    opacity: 0,
                                    transform: 'translateX(-20px)',
                                    '&.Mui-selected': {
                                        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%)',
                                        color: theme.palette.primary.main,
                                        borderLeft: `4px solid ${theme.palette.primary.main}`,
                                        '&:hover': {
                                            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.25) 0%, rgba(118, 75, 162, 0.25) 100%)',
                                        },
                                        '& .MuiListItemIcon-root': {
                                            color: theme.palette.primary.main,
                                        },
                                    },
                                    '&:hover:not(.Mui-selected)': {
                                        background: 'rgba(0, 0, 0, 0.04)',
                                        transform: hoveredItem === index ? 'translateX(8px)' : 'none',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                                    },
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: 40 }}>
                                    {React.cloneElement(item.icon, {
                                        sx: {
                                            fontSize: 20,
                                            color: isSelected ? theme.palette.primary.main : 'text.secondary'
                                        }
                                    })}
                                </ListItemIcon>
                                <ListItemText
                                    primary={item.text}
                                    primaryTypographyProps={{
                                        fontWeight: isSelected ? 700 : 600,
                                        fontSize: '0.875rem',
                                    }}
                                />
                                {isSelected && (
                                    <Box
                                        sx={{
                                            width: 8,
                                            height: 8,
                                            borderRadius: '50%',
                                            background: theme.palette.primary.main,
                                            animation: 'pulse 2s infinite',
                                        }}
                                    />
                                )}
                            </ListItem>
                        );
                    })}
                </List>
            </Box>
            <Box sx={{ flexGrow: 1 }} />
            <Box
                sx={{
                    p: 2,
                    mx: 2,
                    mb: 2,
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
                    border: '1px solid rgba(102, 126, 234, 0.1)',
                }}
            >
                <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600 }}>
                    Version 1.0.0
                </Typography>
                <Typography variant="caption" color="primary" display="block" sx={{ fontWeight: 600 }}>
                    Premium Edition
                </Typography>
            </Box>
        </>
    );

    return (
        <Box
            component="nav"
            sx={{
                width: { sm: drawerWidth },
                flexShrink: { sm: 0 },
                '& .MuiDrawer-paper': {
                    background: 'white',
                    boxShadow: '4px 0 20px rgba(0,0,0,0.05)',
                    borderRight: '1px solid rgba(0,0,0,0.05)',
                }
            }}
        >
            {isMobile ? (
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={onDrawerToggle}
                    ModalProps={{
                        keepMounted: true,
                        BackdropProps: {
                            sx: {
                                background: 'rgba(0,0,0,0.3)',
                                backdropFilter: 'blur(4px)',
                            }
                        }
                    }}
                    sx={{
                        display: { xs: 'block', sm: 'none' },
                        '& .MuiDrawer-paper': {
                            boxSizing: 'border-box',
                            width: drawerWidth,
                            background: 'white',
                        },
                    }}
                >
                    {drawerContent}
                </Drawer>
            ) : (
                <Drawer
                    variant="permanent"
                    sx={{
                        display: { xs: 'none', sm: 'block' },
                        '& .MuiDrawer-paper': {
                            boxSizing: 'border-box',
                            width: drawerWidth,
                            background: 'white',
                        },
                    }}
                    open
                >
                    {drawerContent}
                </Drawer>
            )}
        </Box>
    );
};

export default Sidebar;