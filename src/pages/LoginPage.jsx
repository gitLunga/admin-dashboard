import React, { useState, useEffect } from 'react';
import {
    Box, Paper, Typography, TextField, Button, CircularProgress,
    Container, Avatar, InputAdornment, IconButton, FormControlLabel,
    Checkbox, Link, Divider,
} from '@mui/material';
import { Lock as LockIcon, Visibility, VisibilityOff, Email as EmailIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import logoImage from '../assets/logo.png';
import { useToast } from '../hooks/useToast';

const LoginPage = () => {
    const navigate = useNavigate();
    const { success, error: toastError, warning } = useToast();

    const [formData, setFormData]           = useState({ email: '', password: '', rememberMe: false });
    const [showPassword, setShowPassword]   = useState(false);
    const [loading, setLoading]             = useState(false);

    useEffect(() => {
        const remembered = localStorage.getItem('remember_email');
        if (remembered) setFormData(prev => ({ ...prev, email: remembered, rememberMe: true }));
    }, []);

    const handleChange = (e) => {
        const { name, value, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'rememberMe' ? checked : value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.email.trim()) { warning('Please enter your email address.', 'Email Required'); return; }
        if (!formData.password)     { warning('Please enter your password.',       'Password Required'); return; }

        setLoading(true);
        try {
            const response = await authAPI.login({ email: formData.email, password: formData.password });
            const responseData = response.data?.data || response.data;
            const { user, token } = responseData;

            if (token) localStorage.setItem('adminToken', token);
            localStorage.setItem('adminUser', JSON.stringify({
                id: user.id,
                op_user_id: user.op_user_id,
                name: user.name || 'Admin User',
                email: user.email,
            }));

            if (formData.rememberMe) {
                localStorage.setItem('remember_email', formData.email);
            } else {
                localStorage.removeItem('remember_email');
            }

            const msg = response.data?.message || `Welcome back, ${user.name?.split(' ')[0] || 'Admin'}!`;
            success(msg, 'Login Successful');

            setTimeout(() => navigate('/dashboard'), 900);

        } catch (err) {
            const status = err.response?.status;
            const msg = err.response?.data?.message || 'Invalid email or password';
            if (status === 401) {
                toastError(msg, 'Login Failed');
            } else if (status === 404) {
                toastError(msg, 'Account Not Found');
            } else if (!err.response) {
                toastError('No response from server. Please check your connection.', 'Connection Error');
            } else {
                toastError(msg, 'Login Failed');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Navigation Bar */}
            <Box component="nav" sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', boxShadow: 3, py: 1.5, position: 'sticky', top: 0, zIndex: 1000 }}>
                <Container maxWidth="lg">
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer' }} onClick={() => navigate('/')}>
                            <Box component="img" src={logoImage} alt="System Logo" sx={{ height: 40, width: 'auto', borderRadius: 1, boxShadow: 2 }} />
                            <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold', textShadow: '1px 1px 3px rgba(0,0,0,0.3)' }}>
                                Judicial Admin System
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                            <Link component="button" onClick={() => navigate('/')} sx={{ color: 'white', fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none', '&:hover': { opacity: 0.9 } }}>Home</Link>
                            <Link component="button" onClick={() => navigate('/login')} sx={{ color: 'white', fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none', '&:hover': { opacity: 0.9 } }}>Login</Link>
                            <Link component="button" onClick={() => navigate('/register')} sx={{ backgroundColor: 'white', color: 'primary.main', px: 2, py: 0.5, borderRadius: 20, fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none', '&:hover': { backgroundColor: 'rgba(255,255,255,0.9)' }, transition: 'all 0.3s ease' }}>Register</Link>
                        </Box>
                    </Box>
                </Container>
            </Box>

            <Container component="main" maxWidth="xs">
                <Box sx={{ marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Paper elevation={3} sx={{ p: 4, width: '100%', borderRadius: 2 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
                            <Avatar sx={{ m: 1, bgcolor: 'primary.main', width: 56, height: 56 }}>
                                <LockIcon fontSize="large" />
                            </Avatar>
                            <Typography variant="h4" fontWeight="bold">Judicial Admin</Typography>
                            <Typography variant="body2" color="text.secondary">Administrative Dashboard Login</Typography>
                        </Box>

                        <Box component="form" onSubmit={handleSubmit}>
                            <TextField fullWidth margin="normal" label="Email Address" name="email"
                                       value={formData.email} onChange={handleChange} disabled={loading}
                                       InputProps={{ startAdornment: (<InputAdornment position="start"><EmailIcon /></InputAdornment>) }} />

                            <TextField fullWidth margin="normal" label="Password" name="password"
                                       type={showPassword ? 'text' : 'password'} value={formData.password} onChange={handleChange} disabled={loading}
                                       InputProps={{
                                           startAdornment: (<InputAdornment position="start"><LockIcon /></InputAdornment>),
                                           endAdornment: (
                                               <InputAdornment position="end">
                                                   <IconButton onClick={() => setShowPassword(prev => !prev)} edge="end">
                                                       {showPassword ? <VisibilityOff /> : <Visibility />}
                                                   </IconButton>
                                               </InputAdornment>
                                           ),
                                       }} />

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, flexWrap: 'wrap', gap: 1 }}>
                                <FormControlLabel
                                    control={<Checkbox name="rememberMe" checked={formData.rememberMe} onChange={handleChange} />}
                                    label="Remember me" />
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <Link component="button" type="button" onClick={() => navigate('/forgot-password')} sx={{ fontSize: '0.85rem' }}>
                                        Forgot password?
                                    </Link>
                                    <Link component="button" type="button" onClick={() => navigate('/register')} sx={{ fontSize: '0.85rem' }}>
                                        Register
                                    </Link>
                                </Box>
                            </Box>

                            <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, py: 1.5 }} disabled={loading}>
                                {loading ? <CircularProgress size={24} /> : 'Sign In'}
                            </Button>

                            <Divider sx={{ my: 3 }}>
                                <Typography variant="body2" color="text.secondary">System Access</Typography>
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