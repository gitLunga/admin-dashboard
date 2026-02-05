import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    Alert,
    CircularProgress,
    Container,
    Avatar,
    InputAdornment,
    IconButton,
    FormControlLabel,
    Checkbox,
    Link,
    Divider,
} from '@mui/material';
import {
    Lock as LockIcon,
    Visibility,
    VisibilityOff,
    Email as EmailIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import logoImage from '../assets/logo.png'; // Adjust path based on where you save the image

const LoginPage = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        rememberMe: false,
    });

    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Pre-fill remembered email
    useEffect(() => {
        const rememberedEmail = localStorage.getItem('remember_email');
        if (rememberedEmail) {
            setFormData(prev => ({
                ...prev,
                email: rememberedEmail,
                rememberMe: true,
            }));
        }
    }, []);

    const handleChange = (e) => {
        const { name, value, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'rememberMe' ? checked : value,
        }));

        if (error) setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.email.trim()) {
            setError('Please enter your email');
            return;
        }

        if (!formData.password) {
            setError('Please enter your password');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            await authAPI.login({
                email: formData.email,
                password: formData.password,
            });

            setSuccess('Login successful! Redirecting...');

            if (formData.rememberMe) {
                localStorage.setItem('remember_email', formData.email);
            } else {
                localStorage.removeItem('remember_email');
            }

            setTimeout(() => {
                navigate('/dashboard');
            }, 1000);

        } catch (err) {
            setError(
                err.response?.data?.message || 'Invalid email or password'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = () => {
        navigate('/forgot-password');
    };

    const handleDontHaveAccount = () => {
        navigate('/register');
    };

    return (
        <>
            {/* Navigation Bar */}
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
                            onClick={() => navigate('/')}
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
                            <Link
                                component="button"
                                onClick={() => navigate('/')}
                                sx={{
                                    color: 'white',
                                    fontWeight: 600,
                                    fontSize: '0.9rem',
                                    textDecoration: 'none',
                                    '&:hover': { opacity: 0.9 },
                                }}
                            >
                                Home
                            </Link>
                            <Link
                                component="button"
                                onClick={() => navigate('/login')}
                                sx={{
                                    color: 'white',
                                    fontWeight: 600,
                                    fontSize: '0.9rem',
                                    textDecoration: 'none',
                                    '&:hover': { opacity: 0.9 },
                                }}
                            >
                                Login
                            </Link>
                            <Link
                                component="button"
                                onClick={() => navigate('/register')}
                                sx={{
                                    backgroundColor: 'white',
                                    color: 'primary.main',
                                    px: 2,
                                    py: 0.5,
                                    borderRadius: 20,
                                    fontWeight: 600,
                                    fontSize: '0.9rem',
                                    textDecoration: 'none',
                                    '&:hover': {
                                        backgroundColor: 'rgba(255,255,255,0.9)',
                                        transform: 'translateY(-1px)',
                                        boxShadow: 2,
                                    },
                                    transition: 'all 0.3s ease',
                                }}
                            >
                                Register
                            </Link>
                        </Box>
                    </Box>
                </Container>
            </Box>

            {/* Main Login Content */}
            <Container component="main" maxWidth="xs">
                <Box
                    sx={{
                        marginTop: 8,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                    }}
                >
                    <Paper
                        elevation={3}
                        sx={{
                            p: 4,
                            width: '100%',
                            borderRadius: 2,
                        }}
                    >
                        {/* Header */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
                            <Avatar sx={{ m: 1, bgcolor: 'primary.main', width: 56, height: 56 }}>
                                <LockIcon fontSize="large" />
                            </Avatar>
                            <Typography variant="h4" fontWeight="bold">
                                Judicial Admin
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Administrative Dashboard Login
                            </Typography>
                        </Box>

                        {error && (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                {error}
                            </Alert>
                        )}

                        {success && (
                            <Alert severity="success" sx={{ mb: 2 }}>
                                {success}
                            </Alert>
                        )}

                        <Box component="form" onSubmit={handleSubmit}>
                            <TextField
                                fullWidth
                                margin="normal"
                                label="Email Address"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                disabled={loading}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <EmailIcon />
                                        </InputAdornment>
                                    ),
                                }}
                            />

                            <TextField
                                fullWidth
                                margin="normal"
                                label="Password"
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                value={formData.password}
                                onChange={handleChange}
                                disabled={loading}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <LockIcon />
                                        </InputAdornment>
                                    ),
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                onClick={() => setShowPassword(prev => !prev)}
                                                edge="end"
                                            >
                                                {showPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            name="rememberMe"
                                            checked={formData.rememberMe}
                                            onChange={handleChange}
                                        />
                                    }
                                    label="Remember me"
                                />

                                <Link component="button" onClick={handleForgotPassword}>
                                    Forgot password?
                                </Link>

                                <Link component="button" onClick={handleDontHaveAccount}>
                                    Dont Have Account.
                                </Link>
                            </Box>

                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                sx={{ mt: 3, py: 1.5 }}
                                disabled={loading}
                            >
                                {loading ? <CircularProgress size={24} /> : 'Sign In'}
                            </Button>

                            <Divider sx={{ my: 3 }}>
                                <Typography variant="body2" color="text.secondary">
                                    System Access
                                </Typography>
                            </Divider>

                            <Typography variant="caption" display="block" align="center" color="text.secondary">
                                Authorized personnel only
                            </Typography>
                        </Box>
                    </Paper>
                </Box>
            </Container>
        </>
    );
};

export default LoginPage;