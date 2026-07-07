import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Paper, Grid, Avatar, Divider,
    CircularProgress, IconButton, Tooltip, Collapse,
    Table, TableBody, TableCell, TableHead, TableRow,
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    TextField, Select, MenuItem, FormControl, InputLabel,
} from '@mui/material';
import {
    Person as PersonIcon,
    Lock as LockIcon,
    Group as TeamIcon,
    BarChart as OverviewIcon,
    Edit as EditIcon,
    Save as SaveIcon,
    Close as CloseIcon,
    Visibility as EyeIcon,
    VisibilityOff as EyeOffIcon,
    CheckCircle as OkIcon,
    Error as ErrIcon,
    Add as AddIcon,
    Delete as DeleteIcon,
    AdminPanelSettings as AdminIcon,
    Speed as SlaIcon,
    History as AuditIcon,
    Public as GlobalIcon,
    Domain as DeptIcon,
} from '@mui/icons-material';
import Switch from '@mui/material/Switch';
import { profileAPI, adminAPI, authAPI, auditAPI } from '../../services/api';
import { useToast } from '../../hooks/useToast';

/* ── Design tokens ───────────────────────────────────────────────── */
const T = {
    bg:         '#F8F9FC',
    surface:    '#FFFFFF',
    border:     '#E8ECF4',
    text:       '#0F1F3D',
    muted:      '#6B7A99',
    accent:     '#1E4FD8',
    accentSoft: '#EBF0FF',
    green:      '#059669',
    greenSoft:  '#D1FAE5',
    amber:      '#D97706',
    amberSoft:  '#FEF3C7',
    rose:       '#DC2626',
    roseSoft:   '#FEE2E2',
    purple:     '#7C3AED',
    purpleSoft: '#EDE9FE',
};

const ROLE_COLORS = {
    Admin:     { color: T.accent,  soft: T.accentSoft  },
    Manager:   { color: T.purple,  soft: T.purpleSoft  },
    Finance:   { color: T.green,   soft: T.greenSoft   },
    Approver:  { color: T.amber,   soft: T.amberSoft   },
    MTN_Staff: { color: T.muted,   soft: T.bg          },
};

function roleStyle(role) {
    return ROLE_COLORS[role] || { color: T.muted, soft: T.bg };
}

/* ── Shared field input ──────────────────────────────────────────── */
function Field({ label, value, onChange, disabled, type = 'text' }) {
    return (
        <Box>
            <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: 0.8, mb: 0.7 }}>{label}</Typography>
            <Box sx={{
                display: 'flex', alignItems: 'center',
                borderRadius: '10px', border: `1.5px solid ${disabled ? T.border : T.accent + '60'}`,
                bgcolor: disabled ? T.bg : T.surface,
                transition: 'border-color 0.18s',
                '&:focus-within': { borderColor: T.accent },
            }}>
                <input
                    type={type}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    disabled={disabled}
                    style={{
                        flex: 1, border: 'none', outline: 'none', background: 'transparent',
                        padding: '10px 14px', fontFamily: 'Plus Jakarta Sans, sans-serif',
                        fontSize: '0.85rem', color: disabled ? T.muted : T.text,
                    }}
                />
            </Box>
        </Box>
    );
}

/* ── Password field ──────────────────────────────────────────────── */
function PasswordField({ label, value, onChange }) {
    const [show, setShow] = useState(false);
    return (
        <Box>
            <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: 0.8, mb: 0.7 }}>{label}</Typography>
            <Box sx={{
                display: 'flex', alignItems: 'center',
                borderRadius: '10px', border: `1.5px solid ${T.border}`,
                bgcolor: T.surface,
                '&:focus-within': { borderColor: T.accent },
                transition: 'border-color 0.18s',
            }}>
                <input
                    type={show ? 'text' : 'password'}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', padding: '10px 14px', fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '0.85rem', color: T.text }}
                />
                <IconButton size="small" onClick={() => setShow(s => !s)} sx={{ mr: 0.5, color: T.muted }}>
                    {show ? <EyeOffIcon sx={{ fontSize: 17 }} /> : <EyeIcon sx={{ fontSize: 17 }} />}
                </IconButton>
            </Box>
        </Box>
    );
}

/* ── Tab button ──────────────────────────────────────────────────── */
function TabBtn({ id, label, icon: Icon, active, onClick, adminOnly }) {
    return (
        <Box
            onClick={() => onClick(id)}
            sx={{
                display: 'flex', alignItems: 'center', gap: 1,
                px: 2, py: 1.2, borderRadius: '10px', cursor: 'pointer',
                bgcolor: active ? T.accentSoft : 'transparent',
                border: `1.5px solid ${active ? T.accent + '40' : 'transparent'}`,
                transition: 'all 0.15s',
                '&:hover': { bgcolor: T.accentSoft },
                mb: 0.5,
            }}
        >
            <Icon sx={{ fontSize: 17, color: active ? T.accent : T.muted, flexShrink: 0 }} />
            <Typography sx={{ fontSize: '0.83rem', fontWeight: active ? 700 : 500, color: active ? T.accent : T.text }}>
                {label}
            </Typography>
            {adminOnly && (
                <Box sx={{ ml: 'auto', px: 0.8, py: 0.2, borderRadius: '5px', bgcolor: T.accentSoft, border: `1px solid ${T.accent}28` }}>
                    <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: T.accent }}>ADMIN</Typography>
                </Box>
            )}
        </Box>
    );
}

/* ── Personal info tab ───────────────────────────────────────────── */
function PersonalInfoTab({ profile, onSaved }) {
    const { success, error: toastErr } = useToast();
    const [editing,  setEditing]  = useState(false);
    const [saving,   setSaving]   = useState(false);
    const [form,     setForm]     = useState({ title: '', first_name: '', last_name: '', email: '' });

    useEffect(() => {
        if (profile) setForm({ title: profile.title || '', first_name: profile.first_name || '', last_name: profile.last_name || '', email: profile.email || '' });
    }, [profile]);

    const set = (k) => (v) => setForm(f => ({ ...f, [k]: v }));

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await profileAPI.updateMe(form);
            const updated = res.data?.data || res.data;
            // sync localStorage so the sidebar/other parts reflect the new name immediately
            const stored = JSON.parse(localStorage.getItem('adminUser') || '{}');
            localStorage.setItem('adminUser', JSON.stringify({
                ...stored,
                first_name: updated.first_name,
                last_name:  updated.last_name,
                name:       `${updated.first_name} ${updated.last_name}`.trim(),
                email:      updated.email,
            }));
            success('Profile updated successfully.', 'Saved');
            setEditing(false);
            onSaved(updated);
        } catch (e) {
            toastErr(e.response?.data?.message || 'Failed to save changes.', 'Error');
        } finally {
            setSaving(false);
        }
    };

    const rs = roleStyle(profile?.user_role);

    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box>
                    <Typography sx={{ fontWeight: 800, fontSize: '1.05rem', color: T.text }}>Personal Information</Typography>
                    <Typography sx={{ fontSize: '0.76rem', color: T.muted, mt: 0.3 }}>Your name and contact details visible to the system</Typography>
                </Box>
                {!editing ? (
                    <Box onClick={() => setEditing(true)} sx={{ display: 'flex', alignItems: 'center', gap: 0.8, px: 2, py: 1, borderRadius: '9px', bgcolor: T.accentSoft, cursor: 'pointer', border: `1px solid ${T.accent}28`, '&:hover': { bgcolor: T.accent, '& *': { color: '#fff !important' } }, transition: 'all 0.15s' }}>
                        <EditIcon sx={{ fontSize: 15, color: T.accent }} />
                        <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: T.accent }}>Edit</Typography>
                    </Box>
                ) : (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Box onClick={() => { setEditing(false); setForm({ title: profile.title || '', first_name: profile.first_name || '', last_name: profile.last_name || '', email: profile.email || '' }); }}
                             sx={{ display: 'flex', alignItems: 'center', gap: 0.6, px: 1.5, py: 0.8, borderRadius: '9px', border: `1px solid ${T.border}`, cursor: 'pointer', '&:hover': { bgcolor: T.bg } }}>
                            <CloseIcon sx={{ fontSize: 14, color: T.muted }} />
                            <Typography sx={{ fontSize: '0.78rem', color: T.muted, fontWeight: 600 }}>Cancel</Typography>
                        </Box>
                        <Box onClick={handleSave}
                             sx={{ display: 'flex', alignItems: 'center', gap: 0.6, px: 1.5, py: 0.8, borderRadius: '9px', bgcolor: T.accent, cursor: 'pointer', '&:hover': { opacity: 0.9 }, opacity: saving ? 0.7 : 1 }}>
                            {saving ? <CircularProgress size={12} sx={{ color: '#fff' }} /> : <SaveIcon sx={{ fontSize: 14, color: '#fff' }} />}
                            <Typography sx={{ fontSize: '0.78rem', color: '#fff', fontWeight: 700 }}>Save</Typography>
                        </Box>
                    </Box>
                )}
            </Box>

            {/* Avatar + role badge */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, p: 2.5, borderRadius: '14px', bgcolor: T.bg, border: `1px solid ${T.border}` }}>
                <Avatar sx={{ width: 62, height: 62, bgcolor: rs.soft, color: rs.color, fontSize: '1.3rem', fontWeight: 800, border: `3px solid ${rs.color}28` }}>
                    {(form.first_name?.[0] || '').toUpperCase()}{(form.last_name?.[0] || '').toUpperCase()}
                </Avatar>
                <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: T.text }}>{form.first_name} {form.last_name}</Typography>
                    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.6, px: 1.2, py: 0.35, borderRadius: '20px', bgcolor: rs.soft, mt: 0.4 }}>
                        <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: rs.color }} />
                        <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: rs.color }}>{profile?.user_role}</Typography>
                        {profile?.is_super_admin && <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: T.amber, ml: 0.4 }}>· Super Admin</Typography>}
                    </Box>
                </Box>
                <Box sx={{ ml: 'auto', textAlign: 'right' }}>
                    <Typography sx={{ fontSize: '0.68rem', color: T.muted }}>User ID</Typography>
                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: T.text, fontFamily: 'JetBrains Mono, monospace' }}>#{profile?.op_user_id}</Typography>
                    <Typography sx={{ fontSize: '0.68rem', color: T.muted, mt: 0.5 }}>Member since</Typography>
                    <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: T.text }}>
                        {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </Typography>
                </Box>
            </Box>

            <Grid container spacing={2}>
                <Grid item xs={12} sm={3}>
                    <Box>
                        <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: 0.8, mb: 0.7 }}>Title</Typography>
                        {editing ? (
                            <Box sx={{ borderRadius: '10px', border: `1.5px solid ${T.accent}60`, overflow: 'hidden', bgcolor: T.surface }}>
                                <select value={form.title} onChange={e => set('title')(e.target.value)}
                                        style={{ width: '100%', border: 'none', outline: 'none', padding: '10px 14px', background: 'transparent', fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '0.85rem', color: T.text }}>
                                    {['', 'Mr', 'Ms', 'Mrs', 'Dr', 'Prof'].map(t => <option key={t} value={t}>{t || '—'}</option>)}
                                </select>
                            </Box>
                        ) : (
                            <Typography sx={{ fontSize: '0.88rem', color: T.text, fontWeight: 500, p: '10px 0' }}>{form.title || '—'}</Typography>
                        )}
                    </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Field label="First Name" value={form.first_name} onChange={set('first_name')} disabled={!editing} />
                </Grid>
                <Grid item xs={12} sm={5}>
                    <Field label="Last Name" value={form.last_name} onChange={set('last_name')} disabled={!editing} />
                </Grid>
                <Grid item xs={12}>
                    <Field label="Email Address" value={form.email} onChange={set('email')} disabled={!editing} type="email" />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <Box>
                        <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: 0.8, mb: 0.7 }}>Role</Typography>
                        <Typography sx={{ fontSize: '0.88rem', color: T.text, p: '10px 0' }}>{profile?.user_role} {profile?.department_id ? `· Dept ${profile.department_id}` : ''}</Typography>
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
}

/* ── Security tab ────────────────────────────────────────────────── */
function SecurityTab() {
    const { success, error: toastErr } = useToast();
    const [form,    setForm]    = useState({ current: '', newPw: '', confirm: '' });
    const [saving,  setSaving]  = useState(false);
    const [errMsg,  setErrMsg]  = useState('');

    const set = (k) => (v) => setForm(f => ({ ...f, [k]: v }));

    const handleSave = async () => {
        setErrMsg('');
        if (!form.current || !form.newPw || !form.confirm) { setErrMsg('All fields are required.'); return; }
        if (form.newPw !== form.confirm) { setErrMsg('New password and confirmation do not match.'); return; }
        if (form.newPw.length < 8) { setErrMsg('Password must be at least 8 characters.'); return; }
        setSaving(true);
        try {
            await authAPI.changePassword(form.current, form.newPw);
            success('Password changed. Use your new password next time you log in.', 'Password Updated');
            setForm({ current: '', newPw: '', confirm: '' });
        } catch (e) {
            const msg = e.response?.data?.message || 'Failed to change password.';
            setErrMsg(msg);
            toastErr(msg, 'Error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Box>
            <Typography sx={{ fontWeight: 800, fontSize: '1.05rem', color: T.text, mb: 0.4 }}>Security Settings</Typography>
            <Typography sx={{ fontSize: '0.76rem', color: T.muted, mb: 3 }}>Update your login credentials</Typography>

            <Paper elevation={0} sx={{ p: 3, borderRadius: '14px', border: `1px solid ${T.border}`, bgcolor: T.surface, maxWidth: 480 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 2.5, pb: 2, borderBottom: `1px solid ${T.border}` }}>
                    <Box sx={{ width: 32, height: 32, borderRadius: '9px', bgcolor: T.amberSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <LockIcon sx={{ fontSize: 16, color: T.amber }} />
                    </Box>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: T.text }}>Change Password</Typography>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <PasswordField label="Current Password" value={form.current} onChange={set('current')} />
                    <PasswordField label="New Password" value={form.newPw} onChange={set('newPw')} />
                    <PasswordField label="Confirm New Password" value={form.confirm} onChange={set('confirm')} />
                </Box>

                {errMsg && (
                    <Box sx={{ display: 'flex', gap: 0.8, alignItems: 'center', mt: 2, p: 1.2, borderRadius: '9px', bgcolor: T.roseSoft }}>
                        <ErrIcon sx={{ fontSize: 14, color: T.rose }} />
                        <Typography sx={{ fontSize: '0.76rem', color: T.rose, fontWeight: 600 }}>{errMsg}</Typography>
                    </Box>
                )}

                <Box onClick={handleSave}
                     sx={{ mt: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, py: 1.2, borderRadius: '10px', bgcolor: T.accent, cursor: 'pointer', '&:hover': { opacity: 0.9 }, opacity: saving ? 0.7 : 1 }}>
                    {saving ? <CircularProgress size={14} sx={{ color: '#fff' }} /> : <LockIcon sx={{ fontSize: 16, color: '#fff' }} />}
                    <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#fff' }}>Update Password</Typography>
                </Box>

                <Box sx={{ mt: 2.5, p: 1.5, borderRadius: '10px', bgcolor: T.bg, border: `1px solid ${T.border}` }}>
                    <Typography sx={{ fontSize: '0.72rem', color: T.muted, lineHeight: 1.6 }}>
                        Requirements: minimum 8 characters, mix of letters, numbers and symbols recommended.
                        Your session remains active after the change — use the new password on your next login.
                    </Typography>
                </Box>
            </Paper>
        </Box>
    );
}

/* ── Admin: System overview tab ──────────────────────────────────── */
function SystemTab() {
    const [overview, setOverview] = useState(null);
    const [loading,  setLoading]  = useState(true);

    useEffect(() => {
        adminAPI.getSystemOverview()
            .then(r => setOverview(r.data?.data || r.data))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', pt: 6 }}><CircularProgress size={26} sx={{ color: T.accent }} /></Box>;
    if (!overview) return null;

    const SLA_CONFIG = {
        'Manager Review':  { days: 3,  color: T.purple },
        'Finance Review':  { days: 5,  color: T.accent },
        'Order Placement': { days: 2,  color: T.amber  },
        'Warning at':      { days: '80%', color: T.rose },
    };

    return (
        <Box>
            <Typography sx={{ fontWeight: 800, fontSize: '1.05rem', color: T.text, mb: 0.4 }}>System Overview</Typography>
            <Typography sx={{ fontSize: '0.76rem', color: T.muted, mb: 3 }}>Platform-wide snapshot — counts update live</Typography>

            {/* Stat cards */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                {[
                    { label: 'Operational Users', value: overview.operational_users?.total ?? '—', color: T.accent, soft: T.accentSoft },
                    { label: 'Client Users',       value: overview.client_users?.total ?? '—',       color: T.purple, soft: T.purpleSoft },
                    { label: 'Total Applications', value: overview.applications?.total ?? '—',       color: T.green,  soft: T.greenSoft  },
                ].map(c => (
                    <Grid item xs={12} sm={4} key={c.label}>
                        <Paper elevation={0} sx={{ p: 2.5, borderRadius: '13px', border: `1.5px solid ${c.color}20`, bgcolor: T.surface }}>
                            <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: T.muted, mb: 0.4 }}>{c.label}</Typography>
                            <Typography sx={{ fontSize: '1.8rem', fontWeight: 800, color: c.color }}>{c.value}</Typography>
                        </Paper>
                    </Grid>
                ))}
            </Grid>

            <Grid container spacing={2.5}>
                {/* Team breakdown */}
                <Grid item xs={12} md={6}>
                    <Paper elevation={0} sx={{ p: 2.5, borderRadius: '14px', border: `1px solid ${T.border}`, bgcolor: T.surface }}>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.88rem', color: T.text, mb: 1.5 }}>Team by Role</Typography>
                        {(overview.operational_users?.by_role || []).map(row => {
                            const rs = roleStyle(row.user_role);
                            return (
                                <Box key={row.user_role} sx={{ display: 'flex', alignItems: 'center', py: 1, borderBottom: `1px solid ${T.border}`, '&:last-child': { borderBottom: 'none' } }}>
                                    <Box sx={{ px: 1.2, py: 0.3, borderRadius: '7px', bgcolor: rs.soft, mr: 1.5, minWidth: 100 }}>
                                        <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: rs.color }}>{row.user_role}</Typography>
                                    </Box>
                                    <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: T.text, fontFamily: 'JetBrains Mono, monospace' }}>{row.count}</Typography>
                                    {parseInt(row.super_admins) > 0 && <Typography sx={{ fontSize: '0.68rem', color: T.amber, fontWeight: 700, ml: 1 }}>· {row.super_admins} super</Typography>}
                                </Box>
                            );
                        })}
                    </Paper>
                </Grid>

                {/* SLA config display */}
                <Grid item xs={12} md={6}>
                    <Paper elevation={0} sx={{ p: 2.5, borderRadius: '14px', border: `1px solid ${T.border}`, bgcolor: T.surface }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                            <SlaIcon sx={{ fontSize: 16, color: T.accent }} />
                            <Typography sx={{ fontWeight: 700, fontSize: '0.88rem', color: T.text }}>SLA Configuration</Typography>
                        </Box>
                        <Typography sx={{ fontSize: '0.72rem', color: T.muted, mb: 1.5 }}>Current SLA thresholds (configured server-side)</Typography>
                        {Object.entries(SLA_CONFIG).map(([stage, { days, color }]) => (
                            <Box key={stage} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1, borderBottom: `1px solid ${T.border}`, '&:last-child': { borderBottom: 'none' } }}>
                                <Typography sx={{ fontSize: '0.8rem', color: T.text, fontWeight: 500 }}>{stage}</Typography>
                                <Box sx={{ px: 1.4, py: 0.35, borderRadius: '7px', bgcolor: color + '18', border: `1px solid ${color}30` }}>
                                    <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color, fontFamily: 'JetBrains Mono, monospace' }}>{days}{typeof days === 'number' ? ' days' : ''}</Typography>
                                </Box>
                            </Box>
                        ))}
                    </Paper>
                </Grid>

                {/* Application status breakdown */}
                <Grid item xs={12}>
                    <Paper elevation={0} sx={{ p: 2.5, borderRadius: '14px', border: `1px solid ${T.border}`, bgcolor: T.surface }}>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.88rem', color: T.text, mb: 1.5 }}>Application Pipeline</Typography>
                        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                            {(overview.applications?.by_status || []).map(row => {
                                const colorMap = { Pending: T.amber, Pending_Finance: T.purple, Approved: T.green, Rejected: T.rose, Completed: T.green };
                                const c = colorMap[row.application_status] || T.muted;
                                return (
                                    <Box key={row.application_status} sx={{ p: 2, borderRadius: '12px', bgcolor: c + '12', border: `1px solid ${c}28`, textAlign: 'center', minWidth: 100 }}>
                                        <Typography sx={{ fontSize: '1.3rem', fontWeight: 800, color: c }}>{row.count}</Typography>
                                        <Typography sx={{ fontSize: '0.68rem', fontWeight: 600, color: c, mt: 0.2 }}>{row.application_status}</Typography>
                                    </Box>
                                );
                            })}
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}

/* ── Admin: Team management tab ──────────────────────────────────── */
const DEPT_REQUIRED_ROLES = ['Manager', 'Finance'];

function TeamTab() {
    const { success, error: toastErr } = useToast();
    const [users,       setUsers]       = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading,     setLoading]     = useState(true);
    const [open,        setOpen]        = useState(false);
    const [form,        setForm]        = useState({ title: '', first_name: '', last_name: '', email: '', user_role: 'Manager', department_id: '' });
    const [saving,      setSaving]      = useState(false);
    const [delId,       setDelId]       = useState(null);
    const [togglingId,  setTogglingId]  = useState(null);

    const deptRequired = DEPT_REQUIRED_ROLES.includes(form.user_role);

    const load = useCallback(() => {
        Promise.all([
            adminAPI.getOperationalUsers(),
            adminAPI.getDepartments(),
        ]).then(([uRes, dRes]) => {
            setUsers(uRes.data?.data || []);
            setDepartments(dRes.data?.data || []);
        }).catch(() => {}).finally(() => setLoading(false));
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleCreate = async () => {
        if (!form.first_name || !form.last_name || !form.email || !form.user_role) {
            toastErr('First name, last name, email and role are required.', 'Validation'); return;
        }
        if (deptRequired && !form.department_id) {
            toastErr(`Department is required for the ${form.user_role} role.`, 'Validation'); return;
        }
        setSaving(true);
        try {
            await adminAPI.createOperationalUser(form);
            success(`${form.first_name} ${form.last_name} created. Credentials sent to their email.`, 'User Created');
            setOpen(false);
            setForm({ title: '', first_name: '', last_name: '', email: '', user_role: 'Manager', department_id: '' });
            load();
        } catch (e) {
            toastErr(e.response?.data?.message || 'Failed to create user.', 'Error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await adminAPI.deleteOperationalUser(id);
            success('User removed.', 'Deleted');
            setDelId(null);
            load();
        } catch (e) {
            toastErr(e.response?.data?.message || 'Cannot delete this user.', 'Error');
            setDelId(null);
        }
    };

    const handleToggleGlobal = async (user) => {
        setTogglingId(user.op_user_id);
        try {
            const newVal = !user.has_global_access;
            await adminAPI.setGlobalAccess(user.op_user_id, newVal);
            success(
                newVal
                    ? `${user.first_name} can now view all departments.`
                    : `${user.first_name} is now scoped to their department only.`,
                'Access Updated'
            );
            load();
        } catch (e) {
            toastErr(e.response?.data?.message || 'Failed to update access.', 'Error');
        } finally {
            setTogglingId(null);
        }
    };

    const showGlobalToggle = (u) => DEPT_REQUIRED_ROLES.includes(u.user_role);

    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box>
                    <Typography sx={{ fontWeight: 800, fontSize: '1.05rem', color: T.text }}>Operational Users</Typography>
                    <Typography sx={{ fontSize: '0.76rem', color: T.muted, mt: 0.3 }}>Manage team members, roles and department access</Typography>
                </Box>
                <Box onClick={() => setOpen(true)} sx={{ display: 'flex', alignItems: 'center', gap: 0.8, px: 2, py: 1, borderRadius: '9px', bgcolor: T.accent, cursor: 'pointer', '&:hover': { opacity: 0.9 } }}>
                    <AddIcon sx={{ fontSize: 16, color: '#fff' }} />
                    <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff' }}>Add User</Typography>
                </Box>
            </Box>

            <Paper elevation={0} sx={{ borderRadius: '14px', border: `1px solid ${T.border}`, bgcolor: T.surface, overflow: 'hidden' }}>
                <Table size="small">
                    <TableHead>
                        <TableRow sx={{ bgcolor: T.bg }}>
                            {['Name', 'Email', 'Role / Department', 'Access Scope', 'Actions'].map(h => (
                                <TableCell key={h} sx={{ fontSize: '0.68rem', fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: 0.8, py: 1.5, borderBottom: `2px solid ${T.border}` }}>{h}</TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={5} sx={{ textAlign: 'center', py: 4 }}><CircularProgress size={22} sx={{ color: T.accent }} /></TableCell></TableRow>
                        ) : users.map(u => {
                            const rs = roleStyle(u.user_role);
                            const isToggling = togglingId === u.op_user_id;
                            return (
                                <TableRow key={u.op_user_id} sx={{ '&:hover': { bgcolor: T.bg }, borderBottom: `1px solid ${T.border}` }}>
                                    <TableCell sx={{ py: 1.5 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                                            <Avatar sx={{ width: 28, height: 28, bgcolor: rs.soft, color: rs.color, fontSize: '0.68rem', fontWeight: 700 }}>
                                                {(u.first_name?.[0] || '')}{(u.last_name?.[0] || '')}
                                            </Avatar>
                                            <Box>
                                                <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: T.text }}>{u.title ? `${u.title} ` : ''}{u.first_name} {u.last_name}</Typography>
                                                <Box sx={{ display: 'flex', gap: 0.5, mt: 0.2 }}>
                                                    {u.is_super_admin && <Box sx={{ px: 0.7, py: 0.1, borderRadius: '4px', bgcolor: T.amberSoft }}><Typography sx={{ fontSize: '0.58rem', fontWeight: 700, color: T.amber }}>SUPER</Typography></Box>}
                                                    {u.has_global_access && <Box sx={{ px: 0.7, py: 0.1, borderRadius: '4px', bgcolor: T.purpleSoft, display: 'flex', alignItems: 'center', gap: 0.3 }}><GlobalIcon sx={{ fontSize: 8, color: T.purple }} /><Typography sx={{ fontSize: '0.58rem', fontWeight: 700, color: T.purple }}>GLOBAL</Typography></Box>}
                                                </Box>
                                            </Box>
                                        </Box>
                                    </TableCell>
                                    <TableCell sx={{ py: 1.5 }}>
                                        <Typography sx={{ fontSize: '0.78rem', color: T.muted }}>{u.email}</Typography>
                                    </TableCell>
                                    <TableCell sx={{ py: 1.5 }}>
                                        <Box sx={{ display: 'inline-flex', px: 1.1, py: 0.3, borderRadius: '7px', bgcolor: rs.soft, mb: 0.4 }}>
                                            <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: rs.color }}>{u.user_role}</Typography>
                                        </Box>
                                        {u.department_id && (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                                                <DeptIcon sx={{ fontSize: 10, color: T.muted }} />
                                                <Typography sx={{ fontSize: '0.68rem', color: T.muted }}>{u.department_id}</Typography>
                                            </Box>
                                        )}
                                    </TableCell>
                                    <TableCell sx={{ py: 1.5 }}>
                                        {showGlobalToggle(u) ? (
                                            <Tooltip title={u.has_global_access ? 'Revoke global access — restrict to own department' : 'Grant global access — can see all departments'}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    {isToggling
                                                        ? <CircularProgress size={14} sx={{ color: T.accent }} />
                                                        : <Switch
                                                            checked={!!u.has_global_access}
                                                            onChange={() => handleToggleGlobal(u)}
                                                            size="small"
                                                            sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: T.purple }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: T.purple } }}
                                                        />
                                                    }
                                                    <Typography sx={{ fontSize: '0.7rem', color: u.has_global_access ? T.purple : T.muted, fontWeight: u.has_global_access ? 700 : 400 }}>
                                                        {u.has_global_access ? 'All depts' : 'Own dept'}
                                                    </Typography>
                                                </Box>
                                            </Tooltip>
                                        ) : (
                                            <Typography sx={{ fontSize: '0.7rem', color: T.muted }}>—</Typography>
                                        )}
                                    </TableCell>
                                    <TableCell sx={{ py: 1.5 }}>
                                        <Tooltip title="Remove user">
                                            <IconButton size="small" onClick={() => setDelId(u.op_user_id)} sx={{ color: T.muted, '&:hover': { color: T.rose, bgcolor: T.roseSoft } }}>
                                                <DeleteIcon sx={{ fontSize: 16 }} />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </Paper>

            {/* Create user dialog */}
            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
                <DialogTitle sx={{ fontWeight: 800, fontSize: '1rem', color: T.text, pb: 1 }}>Add Operational User</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 0.5 }}>
                        <Grid item xs={3}>
                            <FormControl fullWidth size="small">
                                <InputLabel sx={{ fontSize: '0.8rem' }}>Title</InputLabel>
                                <Select value={form.title} label="Title" onChange={e => setForm(f => ({ ...f, title: e.target.value }))} sx={{ fontSize: '0.82rem' }}>
                                    {['', 'Mr', 'Ms', 'Mrs', 'Dr', 'Prof'].map(o => <MenuItem key={o} value={o} sx={{ fontSize: '0.82rem' }}>{o || '—'}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={9}>
                            <TextField fullWidth size="small" label="First Name" value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} InputProps={{ sx: { fontSize: '0.82rem' } }} InputLabelProps={{ sx: { fontSize: '0.8rem' } }} />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField fullWidth size="small" label="Last Name" value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} InputProps={{ sx: { fontSize: '0.82rem' } }} InputLabelProps={{ sx: { fontSize: '0.8rem' } }} />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField fullWidth size="small" label="Email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} InputProps={{ sx: { fontSize: '0.82rem' } }} InputLabelProps={{ sx: { fontSize: '0.8rem' } }} />
                        </Grid>
                        <Grid item xs={6}>
                            <FormControl fullWidth size="small">
                                <InputLabel sx={{ fontSize: '0.8rem' }}>Role</InputLabel>
                                <Select value={form.user_role} label="Role" onChange={e => setForm(f => ({ ...f, user_role: e.target.value, department_id: '' }))} sx={{ fontSize: '0.82rem' }}>
                                    {['Admin', 'Manager', 'Finance', 'Approver', 'MTN_Staff'].map(o => <MenuItem key={o} value={o} sx={{ fontSize: '0.82rem' }}>{o}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={6}>
                            <FormControl fullWidth size="small" required={deptRequired} error={deptRequired && !form.department_id}>
                                <InputLabel sx={{ fontSize: '0.8rem' }}>Department{deptRequired ? ' *' : ''}</InputLabel>
                                <Select value={form.department_id} label={`Department${deptRequired ? ' *' : ''}`} onChange={e => setForm(f => ({ ...f, department_id: e.target.value }))} sx={{ fontSize: '0.82rem' }}>
                                    <MenuItem value="" sx={{ fontSize: '0.82rem', color: T.muted }}>— None —</MenuItem>
                                    {departments.map(d => <MenuItem key={d.id} value={d.name} sx={{ fontSize: '0.82rem' }}>{d.name}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                    {deptRequired && (
                        <Box sx={{ mt: 1.5, p: 1.2, borderRadius: '9px', bgcolor: T.purpleSoft, display: 'flex', alignItems: 'center', gap: 0.8 }}>
                            <DeptIcon sx={{ fontSize: 14, color: T.purple }} />
                            <Typography sx={{ fontSize: '0.72rem', color: T.purple, fontWeight: 600 }}>
                                {form.user_role} users must be assigned a department. They will only see applications from that department by default.
                            </Typography>
                        </Box>
                    )}
                    <Box sx={{ mt: 1.5, p: 1.5, borderRadius: '10px', bgcolor: T.accentSoft }}>
                        <Typography sx={{ fontSize: '0.72rem', color: T.accent, fontWeight: 600 }}>
                            A temporary password will be auto-generated and emailed to the new user. They will be prompted to change it on first login.
                        </Typography>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button onClick={() => setOpen(false)} sx={{ color: T.muted, fontSize: '0.82rem' }}>Cancel</Button>
                    <Button variant="contained" onClick={handleCreate} disabled={saving}
                            sx={{ bgcolor: T.accent, borderRadius: '9px', fontSize: '0.82rem', textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: T.accent, opacity: 0.9 } }}>
                        {saving ? <CircularProgress size={14} sx={{ color: '#fff', mr: 1 }} /> : null}Create User
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete confirm dialog */}
            <Dialog open={!!delId} onClose={() => setDelId(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '14px' } }}>
                <DialogTitle sx={{ fontWeight: 700, fontSize: '0.95rem', color: T.text }}>Remove User?</DialogTitle>
                <DialogContent>
                    <Typography sx={{ fontSize: '0.82rem', color: T.muted }}>This will permanently remove the user. This action cannot be undone.</Typography>
                </DialogContent>
                <DialogActions sx={{ px: 2.5, pb: 2 }}>
                    <Button onClick={() => setDelId(null)} sx={{ color: T.muted, fontSize: '0.82rem' }}>Cancel</Button>
                    <Button variant="contained" onClick={() => handleDelete(delId)}
                            sx={{ bgcolor: T.rose, borderRadius: '9px', fontSize: '0.82rem', textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: T.rose, opacity: 0.9 } }}>
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

/* ── Admin: Audit log tab ────────────────────────────────────────── */
function AuditTab() {
    const [logs,    setLogs]    = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        auditAPI.getLogs('limit=40')
            .then(r => {
                const d = r.data?.data || r.data;
                setLogs(Array.isArray(d) ? d : (d?.logs || []));
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const ACTION_COLOR = {
        LOGIN: T.green, LOGOUT: T.muted, PASSWORD_RESET: T.amber,
        OPERATIONAL_USER_CREATED: T.accent, APPLICATION_APPROVED: T.green,
        APPLICATION_REJECTED: T.rose, PASSWORD_CHANGED: T.amber,
    };

    return (
        <Box>
            <Typography sx={{ fontWeight: 800, fontSize: '1.05rem', color: T.text, mb: 0.4 }}>Audit Log</Typography>
            <Typography sx={{ fontSize: '0.76rem', color: T.muted, mb: 3 }}>Last 40 system events</Typography>

            <Paper elevation={0} sx={{ borderRadius: '14px', border: `1px solid ${T.border}`, bgcolor: T.surface, overflow: 'hidden' }}>
                <Table size="small">
                    <TableHead>
                        <TableRow sx={{ bgcolor: T.bg }}>
                            {['When', 'Actor', 'Action', 'Entity'].map(h => (
                                <TableCell key={h} sx={{ fontSize: '0.68rem', fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: 0.8, py: 1.5, borderBottom: `2px solid ${T.border}` }}>{h}</TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={4} sx={{ textAlign: 'center', py: 4 }}><CircularProgress size={22} sx={{ color: T.accent }} /></TableCell></TableRow>
                        ) : logs.length === 0 ? (
                            <TableRow><TableCell colSpan={4} sx={{ textAlign: 'center', py: 4, color: T.muted, fontSize: '0.82rem' }}>No audit entries found.</TableCell></TableRow>
                        ) : logs.map((log, i) => {
                            const color = ACTION_COLOR[log.action] || T.muted;
                            return (
                                <TableRow key={i} sx={{ '&:hover': { bgcolor: T.bg }, borderBottom: `1px solid ${T.border}` }}>
                                    <TableCell sx={{ py: 1.2, fontSize: '0.72rem', color: T.muted, fontFamily: 'JetBrains Mono, monospace', whiteSpace: 'nowrap' }}>
                                        {log.created_at ? new Date(log.created_at).toLocaleString('en-ZA', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                                    </TableCell>
                                    <TableCell sx={{ py: 1.2 }}>
                                        <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: T.text }}>{log.actor_name || `ID ${log.actor_id}`}</Typography>
                                        <Typography sx={{ fontSize: '0.66rem', color: T.muted }}>{log.actor_type}</Typography>
                                    </TableCell>
                                    <TableCell sx={{ py: 1.2 }}>
                                        <Box sx={{ display: 'inline-flex', px: 1, py: 0.3, borderRadius: '6px', bgcolor: color + '18' }}>
                                            <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color }}>{log.action}</Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell sx={{ py: 1.2 }}>
                                        <Typography sx={{ fontSize: '0.72rem', color: T.muted }}>{log.entity_type} {log.entity_id ? `#${log.entity_id}` : ''}</Typography>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </Paper>
        </Box>
    );
}

/* ══════════════════════════ MAIN PAGE ══════════════════════════════ */
export default function ProfileSettings() {
    const [profile,  setProfile]  = useState(null);
    const [loading,  setLoading]  = useState(true);
    const [activeTab, setActiveTab] = useState('personal');

    const storedUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
    const isAdmin    = storedUser.user_role === 'Admin';

    useEffect(() => {
        profileAPI.getMe()
            .then(r => setProfile(r.data?.data || r.data))
            .catch(() => {
                // Fallback to localStorage if API fails
                setProfile(storedUser);
            })
            .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const TABS = [
        { id: 'personal',  label: 'Personal Info',  icon: PersonIcon,   adminOnly: false },
        { id: 'security',  label: 'Security',        icon: LockIcon,     adminOnly: false },
        ...(isAdmin ? [
            { id: 'system',  label: 'System Overview', icon: OverviewIcon, adminOnly: true },
            { id: 'team',    label: 'Manage Team',      icon: TeamIcon,     adminOnly: true },
            { id: 'audit',   label: 'Audit Log',         icon: AuditIcon,    adminOnly: true },
        ] : []),
    ];

    if (loading) return (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
            <CircularProgress sx={{ color: T.accent }} />
        </Box>
    );

    const rs = roleStyle(profile?.user_role || storedUser.user_role);

    return (
        <Box sx={{ p: { xs: 2, sm: 3 }, bgcolor: T.bg, minHeight: '100vh' }}>
            {/* Page header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <Box sx={{ width: 38, height: 38, borderRadius: '11px', bgcolor: rs.soft, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${rs.color}28` }}>
                    {isAdmin ? <AdminIcon sx={{ fontSize: 20, color: rs.color }} /> : <PersonIcon sx={{ fontSize: 20, color: rs.color }} />}
                </Box>
                <Box>
                    <Typography sx={{ fontSize: '1.2rem', fontWeight: 800, color: T.text }}>
                        {isAdmin ? 'Admin Settings' : 'My Settings'}
                    </Typography>
                    <Typography sx={{ fontSize: '0.76rem', color: T.muted }}>
                        {isAdmin
                            ? 'Manage your profile, security and system-wide configuration'
                            : 'Manage your profile and account security'
                        }
                    </Typography>
                </Box>
            </Box>

            <Grid container spacing={2.5}>
                {/* Left sidebar nav */}
                <Grid item xs={12} sm={3}>
                    <Paper elevation={0} sx={{ p: 1.5, borderRadius: '14px', border: `1px solid ${T.border}`, bgcolor: T.surface, position: 'sticky', top: 24 }}>
                        {isAdmin && (
                            <Box sx={{ px: 1.5, py: 1, mb: 0.5 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: T.green }} />
                                    <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: 0.8 }}>Account</Typography>
                                </Box>
                            </Box>
                        )}
                        {TABS.filter(t => !t.adminOnly).map(tab => (
                            <TabBtn key={tab.id} {...tab} active={activeTab === tab.id} onClick={setActiveTab} />
                        ))}
                        {isAdmin && TABS.filter(t => t.adminOnly).length > 0 && (
                            <>
                                <Divider sx={{ borderColor: T.border, my: 1.5 }} />
                                <Box sx={{ px: 1.5, py: 1, mb: 0.5 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: T.accent }} />
                                        <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: 0.8 }}>Administration</Typography>
                                    </Box>
                                </Box>
                                {TABS.filter(t => t.adminOnly).map(tab => (
                                    <TabBtn key={tab.id} {...tab} active={activeTab === tab.id} onClick={setActiveTab} />
                                ))}
                            </>
                        )}
                    </Paper>
                </Grid>

                {/* Content area */}
                <Grid item xs={12} sm={9}>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: '14px', border: `1px solid ${T.border}`, bgcolor: T.surface, minHeight: 400 }}>
                        {activeTab === 'personal' && <PersonalInfoTab profile={profile} onSaved={setProfile} />}
                        {activeTab === 'security' && <SecurityTab />}
                        {activeTab === 'system'   && isAdmin && <SystemTab />}
                        {activeTab === 'team'     && isAdmin && <TeamTab />}
                        {activeTab === 'audit'    && isAdmin && <AuditTab />}
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}
