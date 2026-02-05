import React from 'react';
import '../styles/WelcomePage.css';
import { Link } from 'react-router-dom';
import logoImage from '../assets/logo.png';
import {
    Box,
    Container,
    Typography,
    Link as MuiLink,
    Button,
} from '@mui/material';

const WelcomePage = () => {
    return (
        <>
            {/* Navigation Bar - Same as other pages */}
            <Box
                component="nav"
                sx={{
                    backgroundColor: 'primary.main',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    boxShadow: 3,
                    py: 1.5,
                    position: 'sticky',
                    top: 0,
                    zIndex: 1000,
                }}
            >
                <Container maxWidth="lg">
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}
                    >
                        {/* Logo Section */}
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 2,
                                textDecoration: 'none',
                                cursor: 'pointer',
                            }}
                            component={Link}
                            to="/"
                        >
                            <Box
                                component="img"
                                src={logoImage}
                                alt="System Logo"
                                sx={{
                                    height: 40,
                                    width: 'auto',
                                    borderRadius: 1,
                                    boxShadow: 2,
                                }}
                            />
                            <Typography
                                variant="h6"
                                sx={{
                                    color: 'white',
                                    fontWeight: 'bold',
                                    textShadow: '1px 1px 3px rgba(0,0,0,0.3)',
                                }}
                            >
                                Judicial Admin System
                            </Typography>
                        </Box>

                        {/* Navigation Links */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                            <MuiLink
                                component={Link}
                                to="/"
                                sx={{
                                    color: 'white',
                                    fontWeight: 600,
                                    fontSize: '0.9rem',
                                    textDecoration: 'none',
                                    borderBottom: '3px solid white',
                                    pb: 0.5,
                                    '&:hover': { opacity: 0.9 },
                                }}
                            >
                                Home
                            </MuiLink>
                            <MuiLink
                                component={Link}
                                to="/login"
                                sx={{
                                    color: 'white',
                                    fontWeight: 600,
                                    fontSize: '0.9rem',
                                    textDecoration: 'none',
                                    '&:hover': { opacity: 0.9 },
                                }}
                            >
                                Login
                            </MuiLink>
                            <Button
                                component={Link}
                                to="/register"
                                variant="contained"
                                sx={{
                                    backgroundColor: 'white',
                                    color: 'primary.main',
                                    px: 2,
                                    py: 0.5,
                                    borderRadius: 20,
                                    fontWeight: 600,
                                    fontSize: '0.9rem',
                                    textTransform: 'none',
                                    '&:hover': {
                                        backgroundColor: 'rgba(255,255,255,0.9)',
                                        transform: 'translateY(-1px)',
                                        boxShadow: 2,
                                    },
                                    transition: 'all 0.3s ease',
                                }}
                            >
                                Register
                            </Button>
                        </Box>
                    </Box>
                </Container>
            </Box>

            {/* Main Welcome Content */}
            <div className="welcome-container">
                <div className="welcome-content">
                    <div className="welcome-header">
                        <div className="logo-display">
                            <img src={logoImage} alt="System Logo" className="welcome-logo" />
                        </div>
                        <h1 className="welcome-title">Welcome to Judicial Admin System</h1>
                        <p className="welcome-subtitle">
                            Your comprehensive solution for judicial administration and management
                        </p>
                    </div>

                    <div className="welcome-features">
                        <div className="feature-card">
                            <div className="feature-icon">⚡</div>
                            <h3>Fast & Efficient</h3>
                            <p>Streamlined processes for judicial administration</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">🔒</div>
                            <h3>Secure & Compliant</h3>
                            <p>Top-level security meeting judicial standards</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">🚀</div>
                            <h3>Powerful Management</h3>
                            <p>Advanced features for case and user management</p>
                        </div>
                    </div>

                    <div className="welcome-actions">
                        <Link to="/register" className="primary-button">
                            Get Started
                        </Link>
                        <Link to="/login" className="secondary-button">
                            Sign In
                        </Link>
                    </div>

                    <div className="welcome-footer">
                        <p>Already have an account? <Link to="/login">Sign in here</Link></p>
                    </div>
                </div>
            </div>
        </>
    );
};

export default WelcomePage;