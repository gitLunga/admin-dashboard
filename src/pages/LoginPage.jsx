import React, {useState, useEffect} from 'react';
import {Box, Container, Typography, CircularProgress} from '@mui/material';
import {Lock as LockIcon, Visibility, VisibilityOff, Email as EmailIcon} from '@mui/icons-material';
import {useNavigate} from 'react-router-dom';
import {authAPI} from '../services/api';
import {useToast} from '../hooks/useToast';
import Navbar from '../components/Navigation/Navbar';

const T = {
    bg: '#F8F9FC', surface: '#FFFFFF', border: '#E8ECF4',
    text: '#0F1F3D', muted: '#6B7A99',
    accent: '#1E4FD8', accentSoft: '#EBF0FF',
};

/* ─────────────────────────────────────────────────────────────
   Sub-components OUTSIDE LoginPage — prevents unmount/remount
   on every keystroke which causes focus loss
───────────────────────────────────────────────────────────── */
const FieldLabel = ({text}) => (
    <Typography sx={{
        fontSize: '0.7rem',
        fontWeight: 700,
        color: T.muted,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        mb: 0.75,
        fontFamily: 'Plus Jakarta Sans, sans-serif'
    }}>
        {text}
    </Typography>
);

const InputRow = ({label, name, type, placeholder, icon: Icon, value, onChange, disabled, suffix}) => {
    const [focused, setFocused] = useState(false);
    return (
        <Box sx={{mb: 2}}>
            <FieldLabel text={label}/>
            <Box sx={{
                display: 'flex', alignItems: 'center', gap: 1, bgcolor: T.surface,
                border: `1.5px solid ${focused ? T.accent : T.border}`,
                borderRadius: '10px', px: 1.4, py: 0.9,
                boxShadow: focused ? `0 0 0 3px ${T.accentSoft}` : 'none',
                transition: 'all 0.2s ease',
            }}>
                {Icon && <Icon sx={{fontSize: 16, color: focused ? T.accent : T.muted, flexShrink: 0}}/>}
                <input
                    name={name} type={type || 'text'} placeholder={placeholder}
                    value={value} onChange={onChange} disabled={disabled}
                    onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
                    style={{
                        border: 'none',
                        outline: 'none',
                        background: 'transparent',
                        flex: 1,
                        fontFamily: 'Plus Jakarta Sans, sans-serif',
                        fontSize: '0.87rem',
                        color: T.text
                    }}
                />
                {suffix}
            </Box>
        </Box>
    );
};

/* ═══════════════════════════ MAIN PAGE ═══════════════════════════ */
const LoginPage = () => {
    const navigate = useNavigate();
    const {success, error: toastError, warning} = useToast();

    const [formData, setFormData] = useState({email: '', password: '', rememberMe: false});
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const remembered = localStorage.getItem('remember_email');
        if (remembered) setFormData(prev => ({...prev, email: remembered, rememberMe: true}));
    }, []);

    const handleChange = (e) => {
        const {name, value, checked} = e.target;
        setFormData(prev => ({...prev, [name]: name === 'rememberMe' ? checked : value}));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.email.trim()) {
            warning('Please enter your email address.', 'Email Required');
            return;
        }
        if (!formData.password) {
            warning('Please enter your password.', 'Password Required');
            return;
        }

        setLoading(true);
        try {
            const response = await authAPI.login({email: formData.email, password: formData.password});
            const responseData = response.data?.data || response.data;
            const {user, token} = responseData;

            if (token) localStorage.setItem('adminToken', token);
            localStorage.setItem('adminUser', JSON.stringify({
                id:             user.id,
                op_user_id:     user.op_user_id,
                first_name:     user.first_name,
                last_name:      user.last_name,
                name:           user.name || `${user.first_name} ${user.last_name}`.trim(),
                email:          user.email,
                user_role:      user.user_role,
                is_super_admin: user.is_super_admin ?? false,  // ✅ this is the key one
            }));

            if (formData.rememberMe) {
                localStorage.setItem('remember_email', formData.email);
            } else {
                localStorage.removeItem('remember_email');
            }

            const msg = response.data?.message || `Welcome back, ${user.name?.split(' ')[0] || 'Admin'}!`;
            const route = user.user_role === 'Manager' ? '/manager/dashboard'
                : user.user_role === 'Finance'  ? '/finance/dashboard'
                    : '/dashboard';

            success(msg, 'Login Successful');
            setTimeout(() => navigate(route), 900);
           // setTimeout(() => navigate('/dashboard'), 900);
        } catch (err) {
            const status = err.response?.status;
            const msg = err.response?.data?.message || 'Invalid email or password';
            if (status === 401) toastError(msg, 'Login Failed');
            else if (status === 404) toastError(msg, 'Account Not Found');
            else if (!err.response) toastError('No response from server. Please check your connection.', 'Connection Error');
            else toastError(msg, 'Login Failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{minHeight: '100vh', bgcolor: T.bg, fontFamily: 'Plus Jakarta Sans, sans-serif'}}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600;700&display=swap');
                @keyframes fadeUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
            `}</style>

            <Navbar/>

            <Container maxWidth="xs" sx={{py: {xs: 5, md: 8}}}>
                <Box sx={{
                    bgcolor: T.surface,
                    borderRadius: '16px',
                    border: `1px solid ${T.border}`,
                    overflow: 'hidden',
                    boxShadow: '0 8px 32px rgba(15,31,61,0.08)',
                    animation: 'fadeUp 0.45s ease-out'
                }}>
                    <Box sx={{height: 4, bgcolor: T.accent}}/>

                    <Box sx={{p: {xs: 3, md: 4}}}>
                        {/* Header */}
                        <Box sx={{textAlign: 'center', mb: 3.5}}>
                            <Box sx={{
                                width: 52,
                                height: 52,
                                borderRadius: '14px',
                                bgcolor: T.accentSoft,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mx: 'auto',
                                mb: 1.5
                            }}>
                                <LockIcon sx={{fontSize: 24, color: T.accent}}/>
                            </Box>
                            <Typography sx={{
                                fontWeight: 800,
                                fontSize: '1.4rem',
                                color: T.text,
                                letterSpacing: '-0.3px',
                                mb: 0.4,
                                fontFamily: 'Plus Jakarta Sans, sans-serif'
                            }}>
                                Welcome Back
                            </Typography>
                            <Typography
                                sx={{fontSize: '0.82rem', color: T.muted, fontFamily: 'Plus Jakarta Sans, sans-serif'}}>
                                Sign in to your administrative dashboard
                            </Typography>
                        </Box>

                        <Box component="form" onSubmit={handleSubmit} noValidate>
                            <InputRow
                                label="Email Address" name="email" type="email"
                                placeholder="Enter your email" icon={EmailIcon}
                                value={formData.email} onChange={handleChange} disabled={loading}
                            />

                            <InputRow
                                label="Password" name="password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Enter your password" icon={LockIcon}
                                value={formData.password} onChange={handleChange} disabled={loading}
                                suffix={
                                    <Box component="button" type="button" onClick={() => setShowPassword(p => !p)}
                                         disabled={loading}
                                         sx={{
                                             border: 'none',
                                             background: 'transparent',
                                             cursor: 'pointer',
                                             display: 'flex',
                                             p: 0.3,
                                             borderRadius: '6px',
                                             color: T.muted,
                                             flexShrink: 0,
                                             '&:hover': {color: T.accent, bgcolor: T.accentSoft},
                                             transition: 'all 0.15s'
                                         }}>
                                        {showPassword ? <VisibilityOff sx={{fontSize: 16}}/> :
                                            <Visibility sx={{fontSize: 16}}/>}
                                    </Box>
                                }
                            />

                            {/* Remember me + Forgot */}
                            <Box sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                mb: 2.5,
                                flexWrap: 'wrap',
                                gap: 1
                            }}>
                                <Box sx={{display: 'flex', alignItems: 'center', gap: 0.9, cursor: 'pointer'}}
                                     onClick={() => !loading && handleChange({
                                         target: {
                                             name: 'rememberMe',
                                             checked: !formData.rememberMe
                                         }
                                     })}>
                                    <Box sx={{
                                        width: 16,
                                        height: 16,
                                        borderRadius: '4px',
                                        flexShrink: 0,
                                        border: `2px solid ${formData.rememberMe ? T.accent : T.border}`,
                                        bgcolor: formData.rememberMe ? T.accent : 'transparent',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'all 0.15s'
                                    }}>
                                        {formData.rememberMe && <Box sx={{
                                            width: 8,
                                            height: 5,
                                            borderLeft: '2px solid #fff',
                                            borderBottom: '2px solid #fff',
                                            transform: 'rotate(-45deg) translateY(-1px)'
                                        }}/>}
                                    </Box>
                                    <Typography sx={{
                                        fontSize: '0.8rem',
                                        color: T.text,
                                        userSelect: 'none',
                                        fontFamily: 'Plus Jakarta Sans, sans-serif'
                                    }}>Remember me</Typography>
                                </Box>
                                <Box component="button" type="button" onClick={() => navigate('/forgot-password')}
                                     sx={{
                                         border: 'none',
                                         bgcolor: 'transparent',
                                         cursor: 'pointer',
                                         fontFamily: 'Plus Jakarta Sans, sans-serif',
                                         fontSize: '0.8rem',
                                         color: T.accent,
                                         fontWeight: 600,
                                         p: 0,
                                         '&:hover': {textDecoration: 'underline'}
                                     }}>
                                    Forgot password?
                                </Box>
                            </Box>

                            {/* Submit */}
                            <Box component="button" type="submit" disabled={loading}
                                 sx={{
                                     width: '100%',
                                     py: 1.4,
                                     border: 'none',
                                     borderRadius: '12px',
                                     cursor: loading ? 'not-allowed' : 'pointer',
                                     fontFamily: 'Plus Jakarta Sans, sans-serif',
                                     fontWeight: 700,
                                     fontSize: '0.9rem',
                                     bgcolor: loading ? T.border : T.accent,
                                     color: loading ? T.muted : '#fff',
                                     display: 'flex',
                                     alignItems: 'center',
                                     justifyContent: 'center',
                                     gap: 1,
                                     boxShadow: loading ? 'none' : `0 4px 14px ${T.accent}44`,
                                     transition: 'all 0.2s ease',
                                     '&:hover': {bgcolor: loading ? T.border : '#1641B8'}
                                 }}>
                                {loading ? <><CircularProgress size={16} sx={{color: T.muted}}/> Signing
                                    in…</> : 'Sign In'}
                            </Box>

                            {/* Divider */}
                            <Box sx={{display: 'flex', alignItems: 'center', gap: 1.5, my: 2.5}}>
                                <Box sx={{flex: 1, height: 1, bgcolor: T.border}}/>
                                <Typography sx={{
                                    fontSize: '0.68rem',
                                    color: T.muted,
                                    fontWeight: 600,
                                    textTransform: 'uppercase',
                                    letterSpacing: 0.8,
                                    fontFamily: 'Plus Jakarta Sans, sans-serif'
                                }}>Authorized access only</Typography>
                                <Box sx={{flex: 1, height: 1, bgcolor: T.border}}/>
                            </Box>

                            <Typography sx={{
                                textAlign: 'center',
                                fontSize: '0.82rem',
                                color: T.muted,
                                fontFamily: 'Plus Jakarta Sans, sans-serif'
                            }}>
                                Need an account?{' '}
                                <Box component="button" type="button" onClick={() => navigate('/register')}
                                     sx={{
                                         border: 'none',
                                         bgcolor: 'transparent',
                                         cursor: 'pointer',
                                         fontFamily: 'Plus Jakarta Sans, sans-serif',
                                         fontWeight: 700,
                                         fontSize: '0.82rem',
                                         color: T.accent,
                                         p: 0,
                                         '&:hover': {textDecoration: 'underline'}
                                     }}>
                                    Register here
                                </Box>
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            </Container>
        </Box>
    );
};

export default LoginPage;