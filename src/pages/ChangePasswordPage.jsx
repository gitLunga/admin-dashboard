import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Box, Typography, CircularProgress } from '@mui/material';
import {
    Lock as LockIcon,
    CheckCircle as CheckIcon,
    RadioButtonUnchecked as UncheckedIcon,
    Visibility as ShowIcon,
    VisibilityOff as HideIcon,
} from '@mui/icons-material';
import { authAPI } from '../services/api';

const T = {
    bg: '#F8F9FC', surface: '#FFFFFF', border: '#E8ECF4',
    text: '#0F1F3D', muted: '#6B7A99',
    accent: '#1E4FD8', accentSoft: '#EBF0FF',
    green: '#059669', rose: '#DC2626', roseSoft: '#FEE2E2',
};

// Same rules the server enforces (dojcd-connect-backend/src/utils/passwordPolicy.js).
export const PASSWORD_RULES = [
    { label: 'At least 8 characters',                 test: (p) => p.length >= 8 },
    { label: 'One uppercase letter',                  test: (p) => /[A-Z]/.test(p) },
    { label: 'One lowercase letter',                  test: (p) => /[a-z]/.test(p) },
    { label: 'One number',                            test: (p) => /[0-9]/.test(p) },
    { label: 'One special character (e.g. @ # $ !)',  test: (p) => /[^A-Za-z0-9]/.test(p) },
];

const SESSION_KEYS = ['adminToken', 'adminRefreshToken', 'adminUser'];

const Field = ({ label, value, onChange, show, disabled, autoComplete }) => {
    const [focused, setFocused] = useState(false);
    return (
        <Box sx={{ mb: 1.8 }}>
            <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: 0.8, mb: 0.7 }}>
                {label}
            </Typography>
            <Box sx={{
                display: 'flex', alignItems: 'center', bgcolor: T.surface, borderRadius: '10px', px: 1.4, py: 0.9,
                border: `1.5px solid ${focused ? T.accent : T.border}`,
                boxShadow: focused ? `0 0 0 3px ${T.accentSoft}` : 'none',
                transition: 'all 0.2s ease',
            }}>
                <input
                    type={show ? 'text' : 'password'} value={value} disabled={disabled}
                    aria-label={label} autoComplete={autoComplete}
                    onChange={(e) => onChange(e.target.value)}
                    onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
                    style={{ border: 'none', outline: 'none', background: 'transparent', flex: 1, fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '0.9rem', color: T.text }}
                />
            </Box>
        </Box>
    );
};

/**
 * Shown right after the first sign-in with a temporary password. The API refuses every
 * other request on that session until the password has been changed (see the server's
 * authenticate middleware), and global interceptors send people here if they wander off.
 */
const ChangePasswordPage = () => {
    const navigate = useNavigate();
    const [form, setForm]       = useState({ current: '', next: '', confirm: '' });
    const [show, setShow]       = useState(false);
    const [saving, setSaving]   = useState(false);
    const [error, setError]     = useState('');

    if (!localStorage.getItem('adminToken')) return <Navigate to="/login" replace />;

    const set = (key) => (value) => { setForm((f) => ({ ...f, [key]: value })); setError(''); };
    const allRulesMet = PASSWORD_RULES.every((r) => r.test(form.next));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.current || !form.next || !form.confirm) return setError('All fields are required.');
        if (form.next !== form.confirm)  return setError('The new password and its confirmation do not match.');
        if (form.next === form.current)  return setError('Choose a password different from the temporary one.');
        if (!allRulesMet)                return setError('The new password does not meet all of the requirements below.');

        setSaving(true);
        try {
            await authAPI.changePassword(form.current, form.next);

            // The session we hold was issued while the password was still temporary, so end it
            // (best effort on the server) and sign in again with the new password.
            try { await authAPI.logout(localStorage.getItem('adminRefreshToken')); } catch (_) { /* already changed */ }
            SESSION_KEYS.forEach((k) => localStorage.removeItem(k));
            sessionStorage.setItem('auth_flash', JSON.stringify({
                type: 'success', text: 'Your password has been changed. Please sign in with your new password.',
            }));
            navigate('/login', { replace: true });
        } catch (err) {
            setError(err.response?.data?.message || 'Could not change your password. Please try again.');
            setSaving(false);
        }
    };

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            <Box component="form" onSubmit={handleSubmit} noValidate sx={{
                width: '100%', maxWidth: 440, bgcolor: T.surface, border: `1px solid ${T.border}`,
                borderRadius: '18px', p: { xs: 3, sm: 4 }, boxShadow: '0 10px 40px rgba(15,31,61,0.08)',
            }}>
                <Box sx={{ width: 48, height: 48, borderRadius: '14px', bgcolor: T.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                    <LockIcon sx={{ color: T.accent }} />
                </Box>
                <Typography sx={{ fontWeight: 800, fontSize: '1.3rem', color: T.text, mb: 0.5 }}>Set a new password</Typography>
                <Typography sx={{ fontSize: '0.84rem', color: T.muted, mb: 2.5, lineHeight: 1.5 }}>
                    You signed in with a temporary password. Choose your own to continue.
                </Typography>

                <Field label="Temporary password" value={form.current} onChange={set('current')} show={show} disabled={saving} autoComplete="current-password" />
                <Field label="New password"       value={form.next}    onChange={set('next')}    show={show} disabled={saving} autoComplete="new-password" />
                <Field label="Confirm new password" value={form.confirm} onChange={set('confirm')} show={show} disabled={saving} autoComplete="new-password" />

                <Box component="ul" sx={{ listStyle: 'none', p: 0, m: '0 0 1.5rem' }} aria-label="Password requirements">
                    {PASSWORD_RULES.map((rule) => {
                        const met = rule.test(form.next);
                        return (
                            <Box component="li" key={rule.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.8, fontSize: '0.78rem', color: met ? T.green : T.muted, mb: 0.4 }}>
                                {met ? <CheckIcon sx={{ fontSize: 15 }} /> : <UncheckedIcon sx={{ fontSize: 15 }} />}
                                {rule.label}
                            </Box>
                        );
                    })}
                </Box>

                {error && (
                    <Box role="alert" sx={{ bgcolor: T.roseSoft, color: T.rose, borderRadius: '10px', px: 1.5, py: 1, fontSize: '0.8rem', fontWeight: 600, mb: 1.5 }}>
                        {error}
                    </Box>
                )}

                <Box sx={{ display: 'flex', gap: 1.2, alignItems: 'center' }}>
                    <Box component="button" type="submit" disabled={saving} sx={{
                        flex: 1, border: 'none', cursor: saving ? 'default' : 'pointer', bgcolor: T.accent, color: '#fff', borderRadius: '12px',
                        py: 1.3, fontWeight: 700, fontSize: '0.9rem', fontFamily: 'inherit', opacity: saving ? 0.7 : 1,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1,
                    }}>
                        {saving ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : null}
                        {saving ? 'Saving…' : 'Change password'}
                    </Box>
                    <Box component="button" type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide passwords' : 'Show passwords'} sx={{
                        border: `1.5px solid ${T.border}`, bgcolor: T.surface, borderRadius: '12px', cursor: 'pointer', width: 46, height: 46,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.muted,
                    }}>
                        {show ? <HideIcon sx={{ fontSize: 19 }} /> : <ShowIcon sx={{ fontSize: 19 }} />}
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};

export default ChangePasswordPage;
