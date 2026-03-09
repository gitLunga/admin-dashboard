import React, { useState } from 'react';
import { Box, CssBaseline } from '@mui/material';
import Navbar from './Navbar';        // admin Navbar (Sidebar/Navbar from the dashboard)
import Sidebar from './Sidebar';

/* Must match Sidebar's drawerWidth = 256 */
const drawerWidth = 256;

const MainLayout = ({ children }) => {
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleDrawerToggle = () => setMobileOpen(prev => !prev);

    return (
        <Box sx={{ display: 'flex', bgcolor: '#F8F9FC', minHeight: '100vh' }}>
            <CssBaseline />
            <Navbar onDrawerToggle={handleDrawerToggle} />
            <Sidebar mobileOpen={mobileOpen} onDrawerToggle={handleDrawerToggle} />
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: { xs: 2, md: 3 },
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    mt: '64px',   /* AppBar height */
                    minHeight: 'calc(100vh - 64px)',
                }}
            >
                {children}
            </Box>
        </Box>
    );
};

export default MainLayout;