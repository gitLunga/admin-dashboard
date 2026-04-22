import React, {useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {authAPI} from '../services/api';
import {Box, Container, Typography, CircularProgress} from '@mui/material';
import {
    Person as PersonIcon, Email as EmailIcon, Lock as LockIcon,
    Visibility as VisibilityIcon, VisibilityOff as VisibilityOffIcon,
    AdminPanelSettings as AdminIcon, Build as StaffIcon,
    HowToReg as ApproverIcon, Check as CheckIcon,
    Gavel as ManagerIcon, AccountBalance as FinanceIcon,
    ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import Navbar from '../components/Navigation/Navbar';

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

// Top-level role cards shown to every registrant
const USER_ROLES = [
    {
        value: 'Admin',
        label: 'Administrator',
        description: 'Full system access and management',
        Icon: AdminIcon,
        color: T.rose,
        soft: T.roseSoft,
    },
    {
        value: 'MTN_Staff',
        label: 'MTN Staff',
        description: 'Device and order management',
        Icon: StaffIcon,
        color: T.amber,
        soft: T.amberSoft,
    },
    {
        // Selecting 'Approver' reveals the sub-role picker below.
        // The actual value sent to the API will be 'Manager' or 'Finance',
        // never the literal string 'Approver'.
        value: 'Approver',
        label: 'Approver',
        description: 'Application process approver — Manager or Finance',
        Icon: ApproverIcon,
        color: T.accent,
        soft: T.accentSoft,
    },
];

// Sub-roles shown only when Approver card is selected
const APPROVER_SUB_ROLES = [
    {
        value: 'Manager',
        label: 'Manager',
        description: 'Stage 1 approver — reviews applications and forwards to Finance',
        Icon: ManagerIcon,
        color: T.accent,
        soft: T.accentSoft,
    },
    {
        value: 'Finance',
        label: 'Finance',
        description: 'Stage 2 approver — gives final financial approval',
        Icon: FinanceIcon,
        color: T.green,
        soft: T.greenSoft,
    },
];

/* ─── Sub-components (defined OUTSIDE to prevent remount on every keystroke) ── */

const FieldLabel = ({text, required}) => (
    <Typography sx={{
        fontSize: '0.7rem', fontWeight: 700, color: T.muted,
        textTransform: 'uppercase', letterSpacing: 0.8, mb: 0.8,
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

const ModernInput = ({label, placeholder, value, onChange, onBlur, type = 'text', error, disabled, icon: Icon}) => {
    const [focused, setFocused] = useState(false);

    return (
        <Box sx={{mb: 2}}>
            <FieldLabel text={label} required/>
            <Box sx={{
                display: 'flex', alignItems: 'center', gap: 1.2,
                px: 1.6, py: 1.1,
                border: `1.5px solid ${error ? T.rose : focused ? T.accent : T.border}`,
                borderRadius: '10px', bgcolor: T.surface,
                transition: 'border-color 0.18s',
            }}>
                {Icon && <Icon sx={{fontSize: 17, color: focused ? T.accent : T.muted, flexShrink: 0}}/>}
                <input
                    type={type}
                    value={value}
                    onChange={onChange}
                    onBlur={(e) => {
                        setFocused(false);
                        onBlur?.(e);
                    }}
                    onFocus={() => setFocused(true)}
                    placeholder={placeholder}
                    disabled={disabled}
                    style={{
                        border: 'none', outline: 'none', background: 'transparent',
                        flex: 1, fontFamily: 'Plus Jakarta Sans, sans-serif',
                        fontSize: '0.87rem', color: T.text,
                    }}
                />
            </Box>
            <FieldError msg={error}/>
        </Box>
    );
};

const PasswordInput = ({label, value, onChange, onBlur, error, showPassword, onToggleVisibility, disabled}) => {
    const [focused, setFocused] = useState(false);
    return (
        <Box sx={{mb: 2}}>
            <FieldLabel text={label} required/>
            <Box sx={{
                display: 'flex', alignItems: 'center', gap: 1.2,
                px: 1.6, py: 1.1,
                border: `1.5px solid ${error ? T.rose : focused ? T.accent : T.border}`,
                borderRadius: '10px', bgcolor: T.surface, transition: 'border-color 0.18s',
            }}>
                <LockIcon sx={{fontSize: 17, color: focused ? T.accent : T.muted, flexShrink: 0}}/>
                <input
                    type={showPassword ? 'text' : 'password'}
                    value={value}
                    onChange={onChange}
                    onBlur={(e) => {
                        setFocused(false);
                        onBlur?.(e);
                    }}
                    onFocus={() => setFocused(true)}
                    placeholder="Enter password"
                    disabled={disabled}
                    style={{
                        border: 'none', outline: 'none', background: 'transparent',
                        flex: 1, fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '0.87rem', color: T.text,
                    }}
                />
                <Box component="button" type="button" onClick={onToggleVisibility} disabled={disabled}
                     sx={{
                         border: 'none',
                         bgcolor: 'transparent',
                         cursor: 'pointer',
                         p: 0,
                         display: 'flex',
                         alignItems: 'center'
                     }}>
                    {showPassword
                        ? <VisibilityOffIcon sx={{fontSize: 17, color: T.muted}}/>
                        : <VisibilityIcon sx={{fontSize: 17, color: T.muted}}/>}
                </Box>
            </Box>
            <FieldError msg={error}/>
        </Box>
    );
};

const SelectInput = ({label, value, placeholder, onSelect, options, error, disabled}) => {
    const [open, setOpen] = useState(false);
    const selected = options.find(o => o.value === value);
    return (
        <Box sx={{mb: 2, position: 'relative'}}>
            <FieldLabel text={label} required/>
            <Box component="button" type="button" onClick={() => !disabled && setOpen(o => !o)} disabled={disabled}
                 sx={{
                     width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                     px: 1.6, py: 1.1, border: `1.5px solid ${error ? T.rose : open ? T.accent : T.border}`,
                     borderRadius: '10px', bgcolor: T.surface, cursor: disabled ? 'not-allowed' : 'pointer',
                     fontFamily: 'Plus Jakarta Sans, sans-serif', transition: 'border-color 0.18s',
                 }}>
                <Typography sx={{fontSize: '0.87rem', color: selected ? T.text : T.muted}}>
                    {selected ? selected.label : placeholder}
                </Typography>
                <ExpandMoreIcon sx={{
                    fontSize: 18,
                    color: T.muted,
                    transform: open ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.2s'
                }}/>
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
                                     cursor: 'pointer',
                                     bgcolor: value === opt.value ? T.accentSoft : 'transparent',
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
        // userRole holds the top-level card selection ('Admin','MTN_Staff','Approver')
        userRole: 'Admin',
        // approverSubRole holds 'Manager' or 'Finance' — only used when userRole === 'Approver'
        approverSubRole: '',
        password: '', confirmPassword: '',
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Derives the actual role value to send to the API:
    // - 'Approver' card selected → send approverSubRole ('Manager' or 'Finance')
    // - anything else → send userRole directly
    const resolvedRole = formData.userRole === 'Approver'
        ? formData.approverSubRole
        : formData.userRole;

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

        // Validate all fields
        const newErrors = {};
        ['title', 'firstName', 'lastName', 'email', 'password', 'confirmPassword'].forEach(k => {
            const err = validateField(k, formData[k]);
            if (err) newErrors[k] = err;
        });

        // Extra validation: if Approver is selected, a sub-role must be chosen
        if (formData.userRole === 'Approver' && !formData.approverSubRole) {
            newErrors.approverSubRole = 'Please select Manager or Finance';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setLoading(true);
        try {
            const response = await authAPI.registerOperational({
                title: formData.title,
                first_name: formData.firstName,
                last_name: formData.lastName,
                email: formData.email,
                user_role: resolvedRole,   // 'Manager', 'Finance', 'Admin', or 'MTN_Staff'
                password: formData.password,
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
                @keyframes slideDown { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
            `}</style>

            <Navbar/>

            <Container maxWidth="sm" sx={{py: {xs: 4, md: 6}}}>
                <Box sx={{
                    bgcolor: T.surface, borderRadius: '16px', border: `1px solid ${T.border}`,
                    overflow: 'hidden', boxShadow: '0 8px 32px rgba(15,31,61,0.08)',
                    animation: 'fadeUp 0.45s ease-out'
                }}>
                    <Box sx={{height: 4, bgcolor: T.accent}}/>

                    <Box sx={{p: {xs: 3, md: 4}}}>
                        {/* Header */}
                        <Box sx={{mb: 3.5, textAlign: 'center'}}>
                            <Box sx={{
                                width: 50, height: 50, borderRadius: '14px', bgcolor: T.accentSoft,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                mx: 'auto', mb: 1.5
                            }}>
                                <PersonIcon sx={{fontSize: 24, color: T.accent}}/>
                            </Box>
                            <Typography sx={{
                                fontWeight: 800, fontSize: '1.35rem', color: T.text,
                                letterSpacing: '-0.3px', mb: 0.5, fontFamily: 'Plus Jakarta Sans, sans-serif'
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
                                }}>
                                    {errors._form}
                                </Typography>
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
                                                 icon={PersonIcon} onChange={handleFieldChange('firstName')}
                                                 onBlur={handleBlur('firstName')} disabled={loading}
                                                 error={errors.firstName}/>
                                </Box>
                                <Box sx={{flex: 1}}>
                                    <ModernInput label="Last Name" placeholder="Last name" value={formData.lastName}
                                                 icon={PersonIcon} onChange={handleFieldChange('lastName')}
                                                 onBlur={handleBlur('lastName')} disabled={loading}
                                                 error={errors.lastName}/>
                                </Box>
                            </Box>

                            {/* Email */}
                            <ModernInput label="Email Address" placeholder="Enter your work email" type="email"
                                         value={formData.email} icon={EmailIcon}
                                         onChange={handleFieldChange('email')} onBlur={handleBlur('email')}
                                         disabled={loading} error={errors.email}/>

                            {/* ── Role Cards ───────────────────────────────── */}
                            <Box sx={{mb: 2.5}}>
                                <FieldLabel text="User Role" required/>
                                <Box sx={{display: 'flex', flexDirection: 'column', gap: 1}}>
                                    {USER_ROLES.map(role => {
                                        const selected = formData.userRole === role.value;
                                        const isApprover = role.value === 'Approver';
                                        return (
                                            <Box key={role.value}>
                                                {/* Role card */}
                                                <Box component="button" type="button"
                                                     onClick={() => !loading && setFormData(prev => ({
                                                         ...prev,
                                                         userRole: role.value,
                                                         // Reset sub-role when switching away from Approver
                                                         approverSubRole: role.value === 'Approver' ? prev.approverSubRole : '',
                                                     }))}
                                                     disabled={loading}
                                                     sx={{
                                                         display: 'flex', alignItems: 'center', gap: 1.5,
                                                         width: '100%', textAlign: 'left', p: 1.6,
                                                         borderRadius: selected && isApprover ? '12px 12px 0 0' : '12px',
                                                         cursor: loading ? 'not-allowed' : 'pointer',
                                                         border: `2px solid ${selected ? role.color : T.border}`,
                                                         borderBottom: selected && isApprover ? `2px solid ${role.color}` : undefined,
                                                         bgcolor: selected ? role.soft : T.bg,
                                                         transition: 'all 0.16s ease',
                                                         '&:hover': {borderColor: role.color, bgcolor: role.soft},
                                                     }}>
                                                    <Box sx={{
                                                        width: 36, height: 36, borderRadius: '10px',
                                                        bgcolor: selected ? role.color : T.border,
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        flexShrink: 0, transition: 'background-color 0.16s'
                                                    }}>
                                                        <role.Icon
                                                            sx={{fontSize: 18, color: selected ? '#fff' : T.muted}}/>
                                                    </Box>
                                                    <Box sx={{flex: 1}}>
                                                        <Typography sx={{
                                                            fontWeight: 700, fontSize: '0.85rem',
                                                            color: selected ? role.color : T.text,
                                                            lineHeight: 1.3, fontFamily: 'Plus Jakarta Sans, sans-serif'
                                                        }}>{role.label}</Typography>
                                                        <Typography sx={{
                                                            fontSize: '0.72rem', color: T.muted,
                                                            lineHeight: 1.4, fontFamily: 'Plus Jakarta Sans, sans-serif'
                                                        }}>{role.description}</Typography>
                                                    </Box>
                                                    <Box sx={{
                                                        width: 18, height: 18, borderRadius: '50%',
                                                        border: `2px solid ${selected ? role.color : T.border}`,
                                                        bgcolor: selected ? role.color : 'transparent',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        flexShrink: 0, transition: 'all 0.15s'
                                                    }}>
                                                        {selected && <CheckIcon sx={{fontSize: 11, color: '#fff'}}/>}
                                                    </Box>
                                                </Box>

                                                {/* ── Approver sub-role picker — only when Approver is selected ── */}
                                                {isApprover && selected && (
                                                    <Box sx={{
                                                        border: `2px solid ${role.color}`,
                                                        borderTop: 'none',
                                                        borderRadius: '0 0 12px 12px',
                                                        bgcolor: T.accentSoft,
                                                        p: 1.8,
                                                        animation: 'slideDown 0.2s ease-out',
                                                    }}>
                                                        <Typography sx={{
                                                            fontSize: '0.68rem', fontWeight: 700, color: T.accent,
                                                            textTransform: 'uppercase', letterSpacing: 0.8, mb: 1.2,
                                                            fontFamily: 'Plus Jakarta Sans, sans-serif'
                                                        }}>
                                                            Select Approver Type
                                                        </Typography>
                                                        <Box sx={{display: 'flex', gap: 1, flexWrap: 'wrap'}}>
                                                            {APPROVER_SUB_ROLES.map(sub => {
                                                                const subSelected = formData.approverSubRole === sub.value;
                                                                return (
                                                                    <Box key={sub.value} component="button"
                                                                         type="button"
                                                                         onClick={() => !loading && setFormData(prev => ({
                                                                             ...prev,
                                                                             approverSubRole: sub.value,
                                                                         }))}
                                                                         disabled={loading}
                                                                         sx={{
                                                                             flex: 1,
                                                                             minWidth: 140,
                                                                             display: 'flex',
                                                                             alignItems: 'flex-start',
                                                                             gap: 1.2,
                                                                             p: 1.4,
                                                                             borderRadius: '10px',
                                                                             textAlign: 'left',
                                                                             cursor: loading ? 'not-allowed' : 'pointer',
                                                                             border: `2px solid ${subSelected ? sub.color : T.border}`,
                                                                             bgcolor: subSelected ? sub.soft : T.surface,
                                                                             transition: 'all 0.15s ease',
                                                                             '&:hover': {
                                                                                 borderColor: sub.color,
                                                                                 bgcolor: sub.soft
                                                                             },
                                                                         }}>
                                                                        <Box sx={{
                                                                            width: 30,
                                                                            height: 30,
                                                                            borderRadius: '8px',
                                                                            bgcolor: subSelected ? sub.color : T.border,
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'center',
                                                                            flexShrink: 0,
                                                                            transition: 'background-color 0.15s'
                                                                        }}>
                                                                            <sub.Icon sx={{
                                                                                fontSize: 15,
                                                                                color: subSelected ? '#fff' : T.muted
                                                                            }}/>
                                                                        </Box>
                                                                        <Box sx={{flex: 1}}>
                                                                            <Typography sx={{
                                                                                fontWeight: 700,
                                                                                fontSize: '0.82rem',
                                                                                color: subSelected ? sub.color : T.text,
                                                                                lineHeight: 1.2,
                                                                                fontFamily: 'Plus Jakarta Sans, sans-serif'
                                                                            }}>{sub.label}</Typography>
                                                                            <Typography sx={{
                                                                                fontSize: '0.69rem', color: T.muted,
                                                                                lineHeight: 1.35, mt: 0.3,
                                                                                fontFamily: 'Plus Jakarta Sans, sans-serif'
                                                                            }}>{sub.description}</Typography>
                                                                        </Box>
                                                                        {subSelected && (
                                                                            <CheckIcon sx={{
                                                                                fontSize: 14,
                                                                                color: sub.color,
                                                                                flexShrink: 0,
                                                                                mt: 0.2
                                                                            }}/>
                                                                        )}
                                                                    </Box>
                                                                );
                                                            })}
                                                        </Box>
                                                        {/* Sub-role validation error */}
                                                        {errors.approverSubRole && (
                                                            <Typography sx={{
                                                                fontSize: '0.7rem', color: T.rose, mt: 1,
                                                                fontFamily: 'Plus Jakarta Sans, sans-serif'
                                                            }}>
                                                                {errors.approverSubRole}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                )}
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
                                     width: '100%', mt: 1, py: 1.4, border: 'none',
                                     borderRadius: '12px', cursor: loading ? 'not-allowed' : 'pointer',
                                     fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, fontSize: '0.9rem',
                                     bgcolor: loading ? T.border : T.accent,
                                     color: loading ? T.muted : '#fff',
                                     display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1,
                                     boxShadow: loading ? 'none' : `0 4px 14px ${T.accent}44`,
                                     transition: 'all 0.2s ease',
                                     '&:hover': {bgcolor: loading ? T.border : '#1641B8'}
                                 }}>
                                {loading
                                    ? <><CircularProgress size={16} sx={{color: T.muted}}/> Creating Account…</>
                                    : 'Create Staff Account'}
                            </Box>

                            <Typography sx={{
                                textAlign: 'center', mt: 2.5, fontSize: '0.82rem',
                                color: T.muted, fontFamily: 'Plus Jakarta Sans, sans-serif'
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