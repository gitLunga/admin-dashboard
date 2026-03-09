import React, {useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {authAPI} from '../services/api';
import {Box, Container, Typography, CircularProgress} from '@mui/material';
import {
    Person as PersonIcon, Email as EmailIcon, Lock as LockIcon,
    Visibility as VisibilityIcon, VisibilityOff as VisibilityOffIcon,
    AdminPanelSettings as AdminIcon, Build as StaffIcon,
    HowToReg as ApproverIcon, Gavel as GavelIcon, Check as CheckIcon,
} from '@mui/icons-material';
import Navbar from './Navbar';

const T = {
    bg: '#F8F9FC', surface: '#FFFFFF', border: '#E8ECF4',
    text: '#0F1F3D', muted: '#6B7A99',
    accent: '#1E4FD8', accentSoft: '#EBF0FF',
    green: '#059669', greenSoft: '#D1FAE5',
    amber: '#D97706', amberSoft: '#FEF3C7',
    rose: '#DC2626', roseSoft: '#FEE2E2',
    purple: '#7C3AED', purpleSoft: '#EDE9FE',
};

const TITLES = [
    {value: 'Mr', label: 'Mr'},
    {value: 'Mrs', label: 'Mrs'},
    {value: 'Miss', label: 'Miss'},
    {value: 'Ms', label: 'Ms'},
    {value: 'Dr', label: 'Dr'},
    {value: 'Prof', label: 'Professor'},
];

const USER_ROLES = [
    {
        value: 'Admin',
        label: 'Administrator',
        description: 'Full system access and management',
        Icon: AdminIcon,
        color: T.rose,
        soft: T.roseSoft
    },
    {
        value: 'MTN_Staff',
        label: 'MTN Staff',
        description: 'Device and order management',
        Icon: StaffIcon,
        color: T.amber,
        soft: T.amberSoft
    },
    {
        value: 'Approver',
        label: 'Approver',
        description: 'Application process approver',
        Icon: ApproverIcon,
        color: T.accent,
        soft: T.accentSoft
    },
];

/* ─────────────────────────────────────────────────────────────
   All sub-components defined OUTSIDE RegisterPage.
   Defining them inside would cause unmount/remount on every
   keystroke, breaking focus.
───────────────────────────────────────────────────────────── */

const FieldLabel = ({text, required}) => (
    <Typography sx={{
        fontSize: '0.7rem',
        fontWeight: 700,
        color: T.muted,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        mb: 0.8,
        fontFamily: 'Plus Jakarta Sans, sans-serif'
    }}>
        {text}{required && <span style={{color: T.rose}}> *</span>}
    </Typography>
);

const FieldError = ({msg}) =>
    msg ? <Typography sx={{
        fontSize: '0.7rem',
        color: T.rose,
        mt: 0.5,
        ml: 0.2,
        fontFamily: 'Plus Jakarta Sans, sans-serif'
    }}>{msg}</Typography> : null;

/* Text / email input — value & onChange come from props, no closure over parent */
const ModernInput = ({label, placeholder, value, onChange, onBlur, type = 'text', error, disabled, icon: Icon}) => {
    const [focused, setFocused] = useState(false);
    return (
        <Box sx={{mb: 2}}>
            <FieldLabel text={label} required/>
            <Box sx={{
                display: 'flex', alignItems: 'center', gap: 1, bgcolor: T.surface,
                border: `1.5px solid ${error ? T.rose : focused ? T.accent : T.border}`,
                borderRadius: '10px', px: 1.4, py: 0.85,
                boxShadow: focused ? `0 0 0 3px ${error ? T.roseSoft : T.accentSoft}` : 'none',
                transition: 'all 0.2s ease',
            }}>
                {Icon && <Icon sx={{fontSize: 16, color: focused ? T.accent : T.muted, flexShrink: 0}}/>}
                <input
                    type={type} placeholder={placeholder} value={value} disabled={disabled}
                    onChange={onChange} onBlur={onBlur}
                    onFocus={() => setFocused(true)}
                    onBlur={(e) => {
                        setFocused(false);
                        onBlur?.(e);
                    }}
                    autoCapitalize={type === 'email' ? 'off' : 'words'}
                    autoCorrect={type === 'email' ? 'off' : 'on'}
                    spellCheck={type === 'email' ? 'false' : 'true'}
                    style={{
                        border: 'none',
                        outline: 'none',
                        background: 'transparent',
                        width: '100%',
                        fontFamily: 'Plus Jakarta Sans, sans-serif',
                        fontSize: '0.87rem',
                        color: T.text
                    }}
                />
            </Box>
            <FieldError msg={error}/>
        </Box>
    );
};

/* Password input */
const PasswordInput = ({label, value, onChange, onBlur, error, showPassword, onToggleVisibility, disabled}) => {
    const [focused, setFocused] = useState(false);
    return (
        <Box sx={{mb: 2}}>
            <FieldLabel text={label} required/>
            <Box sx={{
                display: 'flex', alignItems: 'center', gap: 1, bgcolor: T.surface,
                border: `1.5px solid ${error ? T.rose : focused ? T.accent : T.border}`,
                borderRadius: '10px', px: 1.4, py: 0.85,
                boxShadow: focused ? `0 0 0 3px ${error ? T.roseSoft : T.accentSoft}` : 'none',
                transition: 'all 0.2s ease',
            }}>
                <LockIcon sx={{fontSize: 16, color: focused ? T.accent : T.muted, flexShrink: 0}}/>
                <input
                    type={showPassword ? 'text' : 'password'} placeholder="Enter password"
                    value={value} disabled={disabled} onChange={onChange}
                    onFocus={() => setFocused(true)}
                    onBlur={(e) => {
                        setFocused(false);
                        onBlur?.(e);
                    }}
                    autoCapitalize="off" autoCorrect="off" spellCheck="false"
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
                <Box component="button" type="button" onClick={onToggleVisibility} disabled={disabled}
                     sx={{
                         border: 'none',
                         background: 'transparent',
                         cursor: 'pointer',
                         display: 'flex',
                         p: 0.3,
                         borderRadius: '6px',
                         color: T.muted,
                         '&:hover': {color: T.accent, bgcolor: T.accentSoft},
                         transition: 'all 0.15s'
                     }}>
                    {showPassword ? <VisibilityOffIcon sx={{fontSize: 16}}/> : <VisibilityIcon sx={{fontSize: 16}}/>}
                </Box>
            </Box>
            {error && <FieldError msg={error}/>}
            {!error && label === 'Password' && value && (
                <Typography sx={{
                    fontSize: '0.7rem',
                    color: T.muted,
                    mt: 0.5,
                    ml: 0.2,
                    fontFamily: 'Plus Jakarta Sans, sans-serif'
                }}>
                    Must be at least 8 characters
                </Typography>
            )}
        </Box>
    );
};

/* Custom select */
const SelectInput = ({label, value, placeholder, onSelect, disabled, options, error}) => {
    const [open, setOpen] = useState(false);
    const selectedLabel = options.find(o => o.value === value)?.label || '';
    return (
        <Box sx={{mb: 2, position: 'relative'}}>
            <FieldLabel text={label} required/>
            <Box component="button" type="button" onClick={() => !disabled && setOpen(!open)} disabled={disabled}
                 sx={{
                     width: '100%',
                     display: 'flex',
                     justifyContent: 'space-between',
                     alignItems: 'center',
                     bgcolor: T.surface,
                     border: `1.5px solid ${error ? T.rose : open ? T.accent : T.border}`,
                     borderRadius: '10px',
                     px: 1.6,
                     py: 1.05,
                     cursor: disabled ? 'not-allowed' : 'pointer',
                     boxShadow: open ? `0 0 0 3px ${T.accentSoft}` : 'none',
                     transition: 'all 0.2s ease',
                     fontFamily: 'Plus Jakarta Sans, sans-serif'
                 }}>
                <Typography sx={{fontSize: '0.87rem', color: value ? T.text : T.muted}}>
                    {selectedLabel || placeholder}
                </Typography>
                <Typography sx={{
                    fontSize: '0.7rem',
                    color: T.muted,
                    transition: 'transform 0.2s',
                    transform: open ? 'rotate(180deg)' : 'none'
                }}>▼</Typography>
            </Box>
            {open && (
                <>
                    <Box onClick={() => setOpen(false)} sx={{position: 'fixed', inset: 0, zIndex: 998}}/>
                    <Box sx={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        mt: 0.5,
                        bgcolor: T.surface,
                        border: `1px solid ${T.border}`,
                        borderRadius: '12px',
                        boxShadow: '0 12px 32px rgba(15,31,61,0.12)',
                        zIndex: 999,
                        overflow: 'hidden'
                    }}>
                        {options.map(opt => (
                            <Box key={opt.value} component="button" type="button"
                                 onClick={() => {
                                     onSelect(opt.value);
                                     setOpen(false);
                                 }}
                                 sx={{
                                     width: '100%',
                                     display: 'flex',
                                     justifyContent: 'space-between',
                                     alignItems: 'center',
                                     px: 2,
                                     py: 1.1,
                                     border: 'none',
                                     bgcolor: value === opt.value ? T.accentSoft : 'transparent',
                                     cursor: 'pointer',
                                     fontFamily: 'Plus Jakarta Sans, sans-serif',
                                     '&:hover': {bgcolor: T.bg},
                                     transition: 'background-color 0.1s'
                                 }}>
                                <Typography sx={{
                                    fontSize: '0.85rem',
                                    fontWeight: value === opt.value ? 700 : 500,
                                    color: value === opt.value ? T.accent : T.text
                                }}>
                                    {opt.label}
                                </Typography>
                                {value === opt.value && <CheckIcon sx={{fontSize: 14, color: T.accent}}/>}
                            </Box>
                        ))}
                    </Box>
                </>
            )}
            <FieldError msg={error}/>
        </Box>
    );
};

/* ═══════════════════════════ MAIN PAGE ═══════════════════════════ */
const RegisterPage = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        title: '', firstName: '', lastName: '', email: '',
        userRole: 'Admin', password: '', confirmPassword: '',
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const validateField = (field, value) => {
        switch (field) {
            case 'email':
                if (!value) return 'Email is required';
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email address';
                return '';
            case 'password':
                if (!value) return 'Password is required';
                if (value.length < 8) return 'Password must be at least 8 characters';
                return '';
            case 'confirmPassword':
                if (!value) return 'Please confirm your password';
                if (value !== formData.password) return 'Passwords do not match';
                return '';
            case 'title':
            case 'firstName':
            case 'lastName':
                if (!value) return 'This field is required';
                return '';
            default:
                return '';
        }
    };

    const handleBlur = (field) => (e) => {
        setErrors(prev => ({...prev, [field]: validateField(field, e?.target?.value ?? formData[field])}));
    };

    const handleFieldChange = (field) => (e) => {
        setFormData(prev => ({...prev, [field]: e.target.value}));
        setErrors(prev => ({...prev, [field]: ''}));
    };

    const handleRegister = async (e) => {
        e?.preventDefault();
        const newErrors = {};
        Object.keys(formData).forEach(k => {
            const err = validateField(k, formData[k]);
            if (err) newErrors[k] = err;
        });
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setLoading(true);
        try {
            const response = await authAPI.registerOperational({
                title: formData.title, first_name: formData.firstName, last_name: formData.lastName,
                email: formData.email, user_role: formData.userRole, password: formData.password,
            });
            if (response.data.success) {
                navigate('/login');
            } else {
                throw new Error(response.data.message || 'Registration failed');
            }
        } catch (error) {
            const msg = error.response?.data?.message || error.response?.statusText || error.message || 'Registration failed';
            setErrors(prev => ({...prev, _form: msg}));
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

            <Container maxWidth="sm" sx={{py: {xs: 4, md: 6}}}>
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
                        <Box sx={{mb: 3.5, textAlign: 'center'}}>
                            <Box sx={{
                                width: 50,
                                height: 50,
                                borderRadius: '14px',
                                bgcolor: T.accentSoft,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mx: 'auto',
                                mb: 1.5
                            }}>
                                <PersonIcon sx={{fontSize: 24, color: T.accent}}/>
                            </Box>
                            <Typography sx={{
                                fontWeight: 800,
                                fontSize: '1.35rem',
                                color: T.text,
                                letterSpacing: '-0.3px',
                                mb: 0.5,
                                fontFamily: 'Plus Jakarta Sans, sans-serif'
                            }}>
                                Operational Registration
                            </Typography>
                            <Typography
                                sx={{fontSize: '0.83rem', color: T.muted, fontFamily: 'Plus Jakarta Sans, sans-serif'}}>
                                Create your staff account to access the system
                            </Typography>
                        </Box>

                        {/* Form-level error */}
                        {errors._form && (
                            <Box sx={{
                                mb: 2.5,
                                p: 1.8,
                                borderRadius: '10px',
                                bgcolor: T.roseSoft,
                                border: `1px solid ${T.rose}22`
                            }}>
                                <Typography sx={{
                                    fontSize: '0.8rem',
                                    color: T.rose,
                                    fontWeight: 600,
                                    fontFamily: 'Plus Jakarta Sans, sans-serif'
                                }}>{errors._form}</Typography>
                            </Box>
                        )}

                        <Box component="form" onSubmit={handleRegister} noValidate>
                            {/* Title */}
                            <SelectInput
                                label="Title" value={formData.title} placeholder="Select your title"
                                onSelect={v => {
                                    setFormData(prev => ({...prev, title: v}));
                                    setErrors(prev => ({...prev, title: ''}));
                                }}
                                disabled={loading} options={TITLES} error={errors.title}
                            />

                            {/* First + Last name */}
                            <Box sx={{display: 'flex', gap: 1.5, flexWrap: {xs: 'wrap', sm: 'nowrap'}}}>
                                <Box sx={{flex: 1}}>
                                    <ModernInput label="First Name" placeholder="First name" value={formData.firstName}
                                                 icon={PersonIcon}
                                                 onChange={handleFieldChange('firstName')}
                                                 onBlur={handleBlur('firstName')}
                                                 disabled={loading} error={errors.firstName}/>
                                </Box>
                                <Box sx={{flex: 1}}>
                                    <ModernInput label="Last Name" placeholder="Last name" value={formData.lastName}
                                                 icon={PersonIcon}
                                                 onChange={handleFieldChange('lastName')}
                                                 onBlur={handleBlur('lastName')}
                                                 disabled={loading} error={errors.lastName}/>
                                </Box>
                            </Box>

                            {/* Email */}
                            <ModernInput label="Email Address" placeholder="Enter your work email" type="email"
                                         value={formData.email} icon={EmailIcon}
                                         onChange={handleFieldChange('email')} onBlur={handleBlur('email')}
                                         disabled={loading} error={errors.email}/>

                            {/* Role cards */}
                            <Box sx={{mb: 2.5}}>
                                <FieldLabel text="User Role" required/>
                                <Box sx={{display: 'flex', flexDirection: 'column', gap: 1}}>
                                    {USER_ROLES.map(role => {
                                        const selected = formData.userRole === role.value;
                                        return (
                                            <Box key={role.value} component="button" type="button"
                                                 onClick={() => !loading && setFormData(prev => ({
                                                     ...prev,
                                                     userRole: role.value
                                                 }))}
                                                 disabled={loading}
                                                 sx={{
                                                     display: 'flex',
                                                     alignItems: 'center',
                                                     gap: 1.5,
                                                     width: '100%',
                                                     textAlign: 'left',
                                                     p: 1.6,
                                                     borderRadius: '12px',
                                                     cursor: loading ? 'not-allowed' : 'pointer',
                                                     border: `2px solid ${selected ? role.color : T.border}`,
                                                     bgcolor: selected ? role.soft : T.bg,
                                                     transition: 'all 0.16s ease',
                                                     '&:hover': {borderColor: role.color, bgcolor: role.soft}
                                                 }}>
                                                <Box sx={{
                                                    width: 36,
                                                    height: 36,
                                                    borderRadius: '10px',
                                                    bgcolor: selected ? role.color : T.border,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    flexShrink: 0,
                                                    transition: 'background-color 0.16s'
                                                }}>
                                                    <role.Icon sx={{fontSize: 18, color: selected ? '#fff' : T.muted}}/>
                                                </Box>
                                                <Box sx={{flex: 1}}>
                                                    <Typography sx={{
                                                        fontWeight: 700,
                                                        fontSize: '0.85rem',
                                                        color: selected ? role.color : T.text,
                                                        lineHeight: 1.3,
                                                        fontFamily: 'Plus Jakarta Sans, sans-serif'
                                                    }}>{role.label}</Typography>
                                                    <Typography sx={{
                                                        fontSize: '0.72rem',
                                                        color: T.muted,
                                                        lineHeight: 1.4,
                                                        fontFamily: 'Plus Jakarta Sans, sans-serif'
                                                    }}>{role.description}</Typography>
                                                </Box>
                                                <Box sx={{
                                                    width: 18,
                                                    height: 18,
                                                    borderRadius: '50%',
                                                    border: `2px solid ${selected ? role.color : T.border}`,
                                                    bgcolor: selected ? role.color : 'transparent',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    flexShrink: 0,
                                                    transition: 'all 0.15s'
                                                }}>
                                                    {selected && <CheckIcon sx={{fontSize: 11, color: '#fff'}}/>}
                                                </Box>
                                            </Box>
                                        );
                                    })}
                                </Box>
                            </Box>

                            {/* Passwords */}
                            <PasswordInput label="Password" value={formData.password}
                                           onChange={handleFieldChange('password')} onBlur={handleBlur('password')}
                                           error={errors.password} showPassword={showPassword}
                                           onToggleVisibility={() => setShowPassword(!showPassword)}
                                           disabled={loading}/>

                            <PasswordInput label="Confirm Password" value={formData.confirmPassword}
                                           onChange={handleFieldChange('confirmPassword')}
                                           onBlur={handleBlur('confirmPassword')}
                                           error={errors.confirmPassword} showPassword={showConfirmPassword}
                                           onToggleVisibility={() => setShowConfirmPassword(!showConfirmPassword)}
                                           disabled={loading}/>

                            {/* Submit */}
                            <Box component="button" type="submit" disabled={loading}
                                 sx={{
                                     width: '100%',
                                     mt: 1,
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
                                {loading ? <><CircularProgress size={16} sx={{color: T.muted}}/> Creating
                                    Account…</> : 'Create Staff Account'}
                            </Box>

                            <Typography sx={{
                                textAlign: 'center',
                                mt: 2.5,
                                fontSize: '0.82rem',
                                color: T.muted,
                                fontFamily: 'Plus Jakarta Sans, sans-serif'
                            }}>
                                Already have an account?{' '}
                                <Box component={Link} to="/login"
                                     sx={{
                                         color: T.accent,
                                         fontWeight: 700,
                                         textDecoration: 'none',
                                         '&:hover': {textDecoration: 'underline'}
                                     }}>
                                    Sign In
                                </Box>
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            </Container>
        </Box>
    );
};

export default RegisterPage;