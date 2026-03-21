import React, {useState, useEffect, useCallback} from 'react';
import {
    Box, Paper, Typography, IconButton, Chip, CircularProgress,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    TablePagination, Avatar, Button, Dialog, DialogTitle, DialogContent,
    DialogActions, MenuItem, Select, TextField,
    Tooltip, useMediaQuery, useTheme,
} from '@mui/material';
import {
    Search as SearchIcon, Edit as EditIcon, Visibility as ViewIcon,
    Add as AddIcon, Email as EmailIcon, Delete as DeleteIcon,
    Clear as ClearIcon, ManageAccounts as ManageIcon, Close as CloseIcon,
    ContentCopy as CopyIcon, Check as CheckIcon, Lock as LockIcon,
    Warning as WarningIcon, Shield as ShieldIcon, ShieldOutlined as ShieldOutlinedIcon,
} from '@mui/icons-material';
import {adminAPI} from '../../services/api';
import {useNavigate} from 'react-router-dom';
import {USER_ROLES} from '../../utils/constants';
import {useToast} from '../../hooks/useToast';

const T = {
    bg: '#F8F9FC', surface: '#FFFFFF', border: '#E8ECF4',
    text: '#0F1F3D', muted: '#6B7A99',
    accent: '#1E4FD8', accentSoft: '#EBF0FF',
    green: '#059669', greenSoft: '#D1FAE5',
    amber: '#D97706', amberSoft: '#FEF3C7',
    rose: '#DC2626', roseSoft: '#FEE2E2',
    purple: '#7C3AED', purpleSoft: '#EDE9FE',
    cyan: '#0891B2', cyanSoft: '#CFFAFE',
};

const ROLE_META = {
    Admin: {color: T.rose, soft: T.roseSoft},
    Manager: {color: T.amber, soft: T.amberSoft},
    Support: {color: T.cyan, soft: T.cyanSoft},
};

const RoleBadge = ({role}) => {
    const m = ROLE_META[role] || {color: T.muted, soft: '#F1F5F9'};
    return (
        <Box sx={{
            display: 'inline-flex', alignItems: 'center', gap: 0.6,
            px: 1.1, py: 0.3, borderRadius: '20px',
            bgcolor: m.soft, border: `1px solid ${m.color}28`
        }}>
            <Box sx={{width: 5, height: 5, borderRadius: '50%', bgcolor: m.color}}/>
            <Typography sx={{fontSize: '0.69rem', fontWeight: 600, color: m.color}}>{role}</Typography>
        </Box>
    );
};

const InputField = ({label, name, value, onChange, type = 'text', required}) => (
    <Box>
        <Typography sx={{
            fontSize: '0.7rem', fontWeight: 700, color: T.muted,
            textTransform: 'uppercase', letterSpacing: 0.8, mb: 0.8
        }}>
            {label}{required && <span style={{color: T.rose}}> *</span>}
        </Typography>
        <TextField fullWidth size="small" name={name} value={value}
                   onChange={onChange} type={type} required={required}
                   sx={{
                       '& .MuiOutlinedInput-root': {
                           borderRadius: '10px', bgcolor: T.bg, fontSize: '0.85rem',
                           '& fieldset': {borderColor: T.border},
                           '&:hover fieldset': {borderColor: T.accent},
                           '&.Mui-focused fieldset': {borderColor: T.accent}
                       }, '& input': {fontFamily: 'Plus Jakarta Sans, sans-serif'}
                   }}/>
    </Box>
);

// ─── Get logged-in user from localStorage ─────────────────────────────────────
const getCurrentUser = () => {
    try {
        return JSON.parse(localStorage.getItem('adminUser') || '{}');
    } catch {
        return {};
    }
};

const OperationalUsers = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const navigate = useNavigate();
    const {success, error: toastError, warning} = useToast();

    // ─── Permission checks ────────────────────────────────────────────────────
    const currentUser = getCurrentUser();
    const isSuperAdmin = currentUser?.is_super_admin === true;
    const currentUserId = currentUser?.op_user_id;

    // ─── Main state ───────────────────────────────────────────────────────────
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // ─── Add / Edit dialog ────────────────────────────────────────────────────
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        title: '', first_name: '', last_name: '', email: '', user_role: 'Admin'
    });
    const [generatedPassword, setGeneratedPassword] = useState('');
    const [passwordCopied, setPasswordCopied] = useState(false);

    // ─── View caution dialog ──────────────────────────────────────────────────
    const [cautionDialog, setCautionDialog] = useState({open: false, user: null});

    // ─── Change password dialog ───────────────────────────────────────────────
    const [pwDialogOpen, setPwDialogOpen] = useState(false);
    const [pwUserId, setPwUserId] = useState(null);
    const [pwUserName, setPwUserName] = useState('');
    const [pwSubmitting, setPwSubmitting] = useState(false);
    const [pwForm, setPwForm] = useState({
        current_password: '', new_password: '', confirm_password: ''
    });
    const [pwErrors, setPwErrors] = useState({});

    // ─── Promote / Demote confirm dialog ─────────────────────────────────────
    const [promoteDialog, setPromoteDialog] = useState({open: false, user: null});
    const [promoting, setPromoting] = useState(false);

    // ─── Fetch ────────────────────────────────────────────────────────────────
    const fetchOperationalUsers = useCallback(async () => {
        try {
            setLoading(true);
            const response = await adminAPI.getOperationalUsers();
            setUsers(response.data?.data?.users ?? []);
        } catch (err) {
            toastError(err.response?.data?.message || 'Failed to fetch operational users', 'Failed to Load');
        } finally {
            setLoading(false);
        }
    }, [toastError]);

    useEffect(() => {
        fetchOperationalUsers();
    }, [fetchOperationalUsers]);

    // ─── Search ───────────────────────────────────────────────────────────────
    const handleSearch = async () => {
        if (searchTerm.trim().length < 2) {
            fetchOperationalUsers();
            return;
        }
        try {
            setLoading(true);
            const response = await adminAPI.searchUsers(searchTerm.trim());
            setUsers((response.data?.data?.users ?? []).filter(u => u.user_type === 'operational'));
        } catch (err) {
            toastError(err.response?.data?.message || 'Search failed', 'Search Error');
        } finally {
            setLoading(false);
        }
    };

    // ─── Add / Edit handlers ──────────────────────────────────────────────────
    const handleOpenDialog = (user = null) => {
        if (!isSuperAdmin) return;
        if (user) {
            setFormData({
                title: user.title,
                first_name: user.first_name, last_name: user.last_name,
                email: user.email, user_role: user.user_role
            });
            setSelectedUser(user);
        } else {
            setFormData({title: '', first_name: '', last_name: '', email: '', user_role: 'Admin'});
            setSelectedUser(null);
        }
        setGeneratedPassword('');
        setPasswordCopied(false);
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setSelectedUser(null);
        setGeneratedPassword('');
        setPasswordCopied(false);
        setFormData({title: '', first_name: '', last_name: '', email: '', user_role: 'Admin'});
    };

    const handleFormChange = e => {
        const {name, value} = e.target;
        setFormData(prev => ({...prev, [name]: value}));
    };

    const handleSubmit = async () => {
        if (!isSuperAdmin) return;
        if (!formData.first_name.trim() || !formData.last_name.trim() || !formData.email.trim()) {
            warning('Please fill in all required fields.', 'Missing Fields');
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            warning('Please enter a valid email address.', 'Invalid Email');
            return;
        }

        setSubmitting(true);
        try {
            if (selectedUser) {
                const response = await adminAPI.updateOperationalUser?.(selectedUser.op_user_id, formData);
                const msg = response?.data?.message || `${formData.first_name} ${formData.last_name}'s profile has been updated.`;
                success(msg, 'User Updated');
                handleCloseDialog();
                fetchOperationalUsers();
            } else {
                const response = await adminAPI.createOperationalUser?.(formData);
                const pwd = response?.data?.data?.default_password;
                const msg = response?.data?.message || `${formData.first_name} ${formData.last_name} has been added as a ${formData.user_role}.`;
                success(msg, 'User Created');
                if (pwd) {
                    setGeneratedPassword(pwd);
                    fetchOperationalUsers();
                } else {
                    handleCloseDialog();
                    fetchOperationalUsers();
                }
            }
        } catch (err) {
            const status = err.response?.status;
            const msg = err.response?.data?.message || (selectedUser ? 'Failed to update user' : 'Failed to create user');
            toastError(msg, status === 409 ? 'Duplicate Email' : selectedUser ? 'Update Failed' : 'Creation Failed');
        } finally {
            setSubmitting(false);
        }
    };

    // ─── Delete ───────────────────────────────────────────────────────────────
    const handleDelete = async (user) => {
        if (!isSuperAdmin) return;
        if (!window.confirm(`Are you sure you want to delete ${user.first_name} ${user.last_name}?`)) return;
        try {
            const response = await adminAPI.deleteOperationalUser?.(user.op_user_id);
            success(response?.data?.message || `${user.first_name} ${user.last_name} has been removed.`, 'User Deleted');
            fetchOperationalUsers();
        } catch (err) {
            toastError(err.response?.data?.message || 'Failed to delete user', 'Delete Failed');
        }
    };

    // ─── View — own/super admin direct, others get caution ───────────────────
    const handleView = (user) => {
        const isOwnRow = user.op_user_id === currentUserId;
        if (isSuperAdmin || isOwnRow) {
            navigate(`/operational-users/${user.op_user_id}`);
        } else {
            setCautionDialog({open: true, user});
        }
    };

    const handleCautionProceed = () => {
        const user = cautionDialog.user;
        setCautionDialog({open: false, user: null});
        navigate(`/operational-users/${user.op_user_id}`);
    };

    const handleCautionClose = () => setCautionDialog({open: false, user: null});

    // ─── Change password ──────────────────────────────────────────────────────
    const handleOpenPwDialog = (user) => {
        if (!isSuperAdmin && user.op_user_id !== currentUserId) {
            warning('You can only change your own password.', 'Not Allowed');
            return;
        }
        setPwUserId(user.op_user_id);
        setPwUserName(`${user.first_name} ${user.last_name}`);
        setPwForm({current_password: '', new_password: '', confirm_password: ''});
        setPwErrors({});
        setPwDialogOpen(true);
    };

    const handleClosePwDialog = () => {
        setPwDialogOpen(false);
        setPwUserId(null);
        setPwUserName('');
        setPwErrors({});
        setPwForm({current_password: '', new_password: '', confirm_password: ''});
    };

    const handlePwFormChange = (e) => {
        const {name, value} = e.target;
        setPwForm(prev => ({...prev, [name]: value}));
        if (pwErrors[name]) setPwErrors(prev => ({...prev, [name]: ''}));
    };

    const handleChangePassword = async () => {
        const errors = {};
        if (!pwForm.current_password) errors.current_password = 'Required';
        if (!pwForm.new_password) errors.new_password = 'Required';
        if (pwForm.new_password && pwForm.new_password.length < 8)
            errors.new_password = 'Min 8 characters';
        if (!pwForm.confirm_password) errors.confirm_password = 'Required';
        if (pwForm.new_password && pwForm.confirm_password &&
            pwForm.new_password !== pwForm.confirm_password)
            errors.confirm_password = 'Does not match new password';

        if (Object.keys(errors).length > 0) {
            setPwErrors(errors);
            return;
        }

        setPwSubmitting(true);
        try {
            const response = await adminAPI.changeOperationalUserPassword(pwUserId, {
                current_password: pwForm.current_password,
                new_password: pwForm.new_password,
                confirm_password: pwForm.confirm_password,
            });
            success(response?.data?.message || 'Password changed successfully.', 'Password Updated');
            handleClosePwDialog();
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to change password';
            toastError(msg, err.response?.status === 401 ? 'Incorrect Password' : 'Error');
        } finally {
            setPwSubmitting(false);
        }
    };

    // ─── Promote / Demote super admin ─────────────────────────────────────────
    const handleOpenPromoteDialog = (user) => {
        setPromoteDialog({open: true, user});
    };

    const handleClosePromoteDialog = () => {
        setPromoteDialog({open: false, user: null});
    };

    const handleToggleSuperAdmin = async () => {
        const user = promoteDialog.user;
        const isPromote = !user.is_super_admin;
        setPromoting(true);
        try {
            const response = isPromote
                ? await adminAPI.promoteToSuperAdmin(user.op_user_id)
                : await adminAPI.demoteSuperAdmin(user.op_user_id);
            success(
                response?.data?.message ||
                `${user.first_name} ${user.last_name} has been ${isPromote ? 'promoted to' : 'demoted from'} Super Admin.`,
                isPromote ? 'Promoted' : 'Demoted'
            );
            handleClosePromoteDialog();
            fetchOperationalUsers();
        } catch (err) {
            toastError(
                err.response?.data?.message || `Failed to ${isPromote ? 'promote' : 'demote'} user`,
                'Error'
            );
        } finally {
            setPromoting(false);
        }
    };

    // ─── Filter ───────────────────────────────────────────────────────────────
    const filteredUsers = users.filter(u =>
        u.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.user_role?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading && users.length === 0) return (
        <Box sx={{display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400, bgcolor: T.bg}}>
            <CircularProgress sx={{color: T.accent}}/>
        </Box>
    );

    // ─── Locked placeholder ───────────────────────────────────────────────────
    const LockedAction = ({title}) => (
        <Tooltip title={title}>
            <Box sx={{
                width: 28, height: 28, borderRadius: '8px',
                bgcolor: T.bg, border: `1px dashed ${T.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'not-allowed'
            }}>
                <LockIcon sx={{fontSize: 11, color: T.border}}/>
            </Box>
        </Tooltip>
    );

    return (
        <Box sx={{p: {xs: 2, md: 3.5}, bgcolor: T.bg, minHeight: '100vh'}}>

            {/* ── Header ─────────────────────────────────────────────────────── */}
            <Box sx={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                mb: 3, flexWrap: 'wrap', gap: 1.5, animation: 'fadeUp 0.4s ease-out'
            }}>
                <Box>
                    <Box sx={{display: 'flex', alignItems: 'center', gap: 1.2, mb: 0.3}}>
                        <Box sx={{p: 1, borderRadius: '10px', bgcolor: T.purpleSoft}}>
                            <ManageIcon sx={{fontSize: 20, color: T.purple}}/>
                        </Box>
                        <Typography sx={{
                            fontSize: {xs: '1.25rem', md: '1.6rem'},
                            fontWeight: 800, color: T.text, letterSpacing: '-0.3px'
                        }}>
                            Operational Users
                        </Typography>
                    </Box>
                    <Typography sx={{fontSize: '0.78rem', color: T.muted, ml: 0.5}}>
                        Manage system administrators and staff
                    </Typography>
                </Box>

                {isSuperAdmin ? (
                    <Button variant="contained"
                            startIcon={<AddIcon sx={{fontSize: '16px !important'}}/>}
                            onClick={() => handleOpenDialog()}
                            sx={{
                                borderRadius: '10px', textTransform: 'none', fontWeight: 700,
                                fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '0.83rem',
                                bgcolor: T.accent, boxShadow: 'none',
                                '&:hover': {bgcolor: '#1641B8', boxShadow: `0 4px 14px ${T.accent}44`}
                            }}>
                        Add User
                    </Button>
                ) : (
                    <Tooltip title="Only Super Admins can add operational users">
                        <Box sx={{
                            display: 'inline-flex', alignItems: 'center', gap: 1,
                            px: 2, py: 1, borderRadius: '10px',
                            border: `1px solid ${T.border}`, bgcolor: T.bg,
                            cursor: 'not-allowed', userSelect: 'none'
                        }}>
                            <LockIcon sx={{fontSize: 14, color: T.muted}}/>
                            <Typography sx={{
                                fontSize: '0.83rem', fontWeight: 600, color: T.muted,
                                fontFamily: 'Plus Jakarta Sans, sans-serif'
                            }}>
                                Add User
                            </Typography>
                        </Box>
                    </Tooltip>
                )}
            </Box>

            {/* ── Search ─────────────────────────────────────────────────────── */}
            <Paper elevation={0} sx={{
                p: {xs: 2, md: 2.5}, mb: 2.5, borderRadius: '14px',
                border: `1px solid ${T.border}`, bgcolor: T.surface
            }}>
                <Box sx={{display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap'}}>
                    <Box sx={{
                        display: 'flex', alignItems: 'center', gap: 1,
                        bgcolor: T.bg, border: `1px solid ${T.border}`,
                        borderRadius: '10px', px: 1.5, py: 0.7,
                        flex: 1, minWidth: {xs: '100%', sm: 240},
                        '&:focus-within': {borderColor: T.accent, boxShadow: `0 0 0 3px ${T.accentSoft}`},
                        transition: 'all 0.2s'
                    }}>
                        <SearchIcon sx={{fontSize: 16, color: T.muted, flexShrink: 0}}/>
                        <input
                            placeholder="Search by name, email, or role…"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            onKeyPress={e => e.key === 'Enter' && handleSearch()}
                            style={{
                                border: 'none', outline: 'none', background: 'transparent',
                                width: '100%', fontFamily: 'Plus Jakarta Sans, sans-serif',
                                fontSize: '0.83rem', color: T.text
                            }}
                        />
                        {searchTerm && (
                            <IconButton size="small"
                                        onClick={() => {
                                            setSearchTerm('');
                                            fetchOperationalUsers();
                                        }}
                                        sx={{p: 0.3, color: T.muted}}>
                                <ClearIcon sx={{fontSize: 13}}/>
                            </IconButton>
                        )}
                    </Box>
                    <Chip
                        label={`${filteredUsers.length} user${filteredUsers.length !== 1 ? 's' : ''}`}
                        size="small"
                        sx={{
                            height: 28, fontSize: '0.75rem', fontWeight: 700,
                            bgcolor: T.purpleSoft, color: T.purple,
                            fontFamily: 'JetBrains Mono, monospace'
                        }}/>
                </Box>
            </Paper>

            {/* ── Table ──────────────────────────────────────────────────────── */}
            <Paper elevation={0} sx={{
                borderRadius: '14px', border: `1px solid ${T.border}`,
                bgcolor: T.surface, overflow: 'hidden'
            }}>
                <TableContainer>
                    <Table size={isMobile ? 'small' : 'medium'}>
                        <TableHead>
                            <TableRow sx={{bgcolor: T.bg}}>
                                {['User', !isMobile && 'Email', 'Role', 'Actions'].filter(Boolean).map(h => (
                                    <TableCell key={h} sx={{
                                        fontWeight: 700, fontSize: '0.7rem', color: T.muted,
                                        letterSpacing: 0.8, textTransform: 'uppercase',
                                        py: 1.6, borderBottom: `1px solid ${T.border}`
                                    }}>{h}</TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredUsers
                                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                .map((user, i) => {
                                    const isOwnRow = user.op_user_id === currentUserId;
                                    const canEdit = isSuperAdmin;
                                    const canDelete = isSuperAdmin;
                                    const canChangePw = isSuperAdmin || isOwnRow;

                                    return (
                                        <TableRow key={user.op_user_id} hover sx={{
                                            '&:hover': {bgcolor: T.bg},
                                            transition: 'background-color 0.15s ease',
                                            animation: `fadeUp 0.35s ease-out ${i * 0.03}s both`
                                        }}>
                                            {/* ── User cell ──────────────────── */}
                                            <TableCell sx={{py: 1.8, borderBottom: `1px solid ${T.border}`}}>
                                                <Box sx={{display: 'flex', alignItems: 'center', gap: 1.5}}>
                                                    <Avatar sx={{
                                                        width: 34, height: 34, borderRadius: '10px',
                                                        bgcolor: isOwnRow ? T.accentSoft : T.purpleSoft,
                                                        color: isOwnRow ? T.accent : T.purple,
                                                        fontSize: '0.73rem', fontWeight: 700,
                                                        fontFamily: 'Plus Jakarta Sans, sans-serif'
                                                    }}>
                                                        {user.first_name?.[0]}{user.last_name?.[0]}
                                                    </Avatar>
                                                    <Box>
                                                        <Box sx={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 0.8,
                                                            flexWrap: 'wrap'
                                                        }}>
                                                            <Typography sx={{fontSize: '0.83rem', fontWeight: 600, color: T.text}}>
                                                                {user.title && (
                                                                    <span style={{
                                                                        color: T.muted,
                                                                        fontWeight: 500,
                                                                        marginRight: 4,
                                                                        fontSize: '0.78rem'
                                                                    }}>
            {user.title}.
        </span>
                                                                )}
                                                                {user.first_name} {user.last_name}
                                                            </Typography>
                                                            {/* You badge */}
                                                            {isOwnRow && (
                                                                <Chip label="You" size="small" sx={{
                                                                    height: 16, fontSize: '0.6rem', fontWeight: 700,
                                                                    bgcolor: T.accentSoft, color: T.accent,
                                                                    fontFamily: 'Plus Jakarta Sans, sans-serif'
                                                                }}/>
                                                            )}
                                                            {/* Super admin badge */}
                                                            {user.is_super_admin && (
                                                                <Chip
                                                                    icon={<ShieldIcon sx={{
                                                                        fontSize: '10px !important',
                                                                        color: `${T.green} !important`
                                                                    }}/>}
                                                                    label="Super Admin"
                                                                    size="small"
                                                                    sx={{
                                                                        height: 16, fontSize: '0.6rem', fontWeight: 700,
                                                                        bgcolor: T.greenSoft, color: T.green,
                                                                        fontFamily: 'Plus Jakarta Sans, sans-serif',
                                                                        '& .MuiChip-icon': {ml: '4px'}
                                                                    }}
                                                                />
                                                            )}
                                                        </Box>
                                                        <Typography className="mono"
                                                                    sx={{fontSize: '0.67rem', color: T.muted}}>
                                                            #{user.op_user_id}
                                                        </Typography>
                                                        {isMobile && (
                                                            <Typography
                                                                sx={{fontSize: '0.71rem', color: T.muted, mt: 0.2}}>
                                                                {user.email}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                </Box>
                                            </TableCell>

                                            {/* ── Email cell ─────────────────── */}
                                            {!isMobile && (
                                                <TableCell sx={{py: 1.8, borderBottom: `1px solid ${T.border}`}}>
                                                    <Box sx={{display: 'flex', alignItems: 'center', gap: 0.8}}>
                                                        <EmailIcon sx={{fontSize: 13, color: T.muted}}/>
                                                        <Typography sx={{fontSize: '0.8rem', color: T.text}}>
                                                            {user.email}
                                                        </Typography>
                                                    </Box>
                                                </TableCell>
                                            )}

                                            {/* ── Role cell ──────────────────── */}
                                            <TableCell sx={{py: 1.8, borderBottom: `1px solid ${T.border}`}}>
                                                <RoleBadge role={user.user_role}/>
                                            </TableCell>

                                            {/* ── Actions cell ───────────────── */}
                                            <TableCell sx={{py: 1.8, borderBottom: `1px solid ${T.border}`}}>
                                                <Box sx={{display: 'flex', gap: 0.5, alignItems: 'center'}}>

                                                    {/* Edit — super admin only */}
                                                    {canEdit ? (
                                                        <Tooltip title="Edit">
                                                            <IconButton size="small"
                                                                        onClick={() => handleOpenDialog(user)}
                                                                        sx={{
                                                                            width: 28, height: 28, borderRadius: '8px',
                                                                            bgcolor: T.amberSoft, color: T.amber,
                                                                            '&:hover': {bgcolor: '#FDE68A'}
                                                                        }}>
                                                                <EditIcon sx={{fontSize: 14}}/>
                                                            </IconButton>
                                                        </Tooltip>
                                                    ) : (
                                                        <LockedAction title="Only Super Admins can edit users"/>
                                                    )}

                                                    {/* View — visible to all, caution for others */}
                                                    <Tooltip title={
                                                        isOwnRow || isSuperAdmin
                                                            ? 'View Details'
                                                            : 'View Details (restricted)'
                                                    }>
                                                        <IconButton size="small"
                                                                    onClick={() => handleView(user)}
                                                                    sx={{
                                                                        width: 28, height: 28, borderRadius: '8px',
                                                                        bgcolor: isOwnRow || isSuperAdmin ? T.accentSoft : T.amberSoft,
                                                                        color: isOwnRow || isSuperAdmin ? T.accent : T.amber,
                                                                        '&:hover': {
                                                                            bgcolor: isOwnRow || isSuperAdmin ? '#DBEAFE' : '#FDE68A'
                                                                        }
                                                                    }}>
                                                            {isOwnRow || isSuperAdmin
                                                                ? <ViewIcon sx={{fontSize: 14}}/>
                                                                : <WarningIcon sx={{fontSize: 14}}/>}
                                                        </IconButton>
                                                    </Tooltip>

                                                    {/* Change Password */}
                                                    {canChangePw ? (
                                                        <Tooltip
                                                            title={isOwnRow ? 'Change My Password' : 'Change Password'}>
                                                            <IconButton size="small"
                                                                        onClick={() => handleOpenPwDialog(user)}
                                                                        sx={{
                                                                            width: 28, height: 28, borderRadius: '8px',
                                                                            bgcolor: T.purpleSoft, color: T.purple,
                                                                            '&:hover': {bgcolor: '#DDD6FE'}
                                                                        }}>
                                                                <LockIcon sx={{fontSize: 14}}/>
                                                            </IconButton>
                                                        </Tooltip>
                                                    ) : (
                                                        <LockedAction title="You can only change your own password"/>
                                                    )}

                                                    {/* Promote / Demote — super admin only, not own row */}
                                                    {isSuperAdmin && !isOwnRow && (
                                                        <Tooltip title={
                                                            user.is_super_admin
                                                                ? 'Demote from Super Admin'
                                                                : 'Promote to Super Admin'
                                                        }>
                                                            <IconButton size="small"
                                                                        onClick={() => handleOpenPromoteDialog(user)}
                                                                        sx={{
                                                                            width: 28, height: 28, borderRadius: '8px',
                                                                            bgcolor: user.is_super_admin ? T.amberSoft : T.greenSoft,
                                                                            color: user.is_super_admin ? T.amber : T.green,
                                                                            '&:hover': {
                                                                                bgcolor: user.is_super_admin ? '#FDE68A' : '#A7F3D0'
                                                                            }
                                                                        }}>
                                                                {user.is_super_admin
                                                                    ? <ShieldOutlinedIcon sx={{fontSize: 14}}/>
                                                                    : <ShieldIcon sx={{fontSize: 14}}/>}
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}

                                                    {/* Delete — super admin only */}
                                                    {canDelete ? (
                                                        <Tooltip title="Delete">
                                                            <IconButton size="small"
                                                                        onClick={() => handleDelete(user)}
                                                                        sx={{
                                                                            width: 28, height: 28, borderRadius: '8px',
                                                                            bgcolor: T.roseSoft, color: T.rose,
                                                                            '&:hover': {bgcolor: '#FECACA'}
                                                                        }}>
                                                                <DeleteIcon sx={{fontSize: 14}}/>
                                                            </IconButton>
                                                        </Tooltip>
                                                    ) : (
                                                        <LockedAction title="Only Super Admins can delete users"/>
                                                    )}

                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            {filteredUsers.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} sx={{py: 7, textAlign: 'center', borderBottom: 'none'}}>
                                        <ManageIcon sx={{fontSize: 44, color: T.border, mb: 1.5}}/>
                                        <Typography sx={{fontSize: '0.88rem', fontWeight: 600, color: T.muted}}>
                                            No operational users found
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25]} component="div"
                    count={filteredUsers.length} rowsPerPage={rowsPerPage} page={page}
                    onPageChange={(e, p) => setPage(p)}
                    onRowsPerPageChange={e => {
                        setRowsPerPage(parseInt(e.target.value, 10));
                        setPage(0);
                    }}
                    sx={{
                        borderTop: `1px solid ${T.border}`,
                        '& *': {fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '0.8rem'}
                    }}
                />
            </Paper>

            {/* ── Add / Edit Dialog ───────────────────────────────────────────── */}
            <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth
                    PaperProps={{
                        sx: {
                            borderRadius: '16px', border: `1px solid ${T.border}`,
                            boxShadow: '0 24px 60px rgba(15,31,61,0.14)', bgcolor: T.bg
                        }
                    }}>
                <DialogTitle sx={{p: 0}}>
                    <Box sx={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        px: 3, py: 2.2, bgcolor: T.surface, borderBottom: `1px solid ${T.border}`
                    }}>
                        <Box sx={{display: 'flex', alignItems: 'center', gap: 1.2}}>
                            <Box sx={{
                                width: 30, height: 30, borderRadius: '9px',
                                bgcolor: selectedUser ? T.amberSoft : T.accentSoft,
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                {selectedUser
                                    ? <EditIcon sx={{fontSize: 15, color: T.amber}}/>
                                    : <AddIcon sx={{fontSize: 15, color: T.accent}}/>}
                            </Box>
                            <Typography sx={{fontWeight: 700, fontSize: '0.95rem', color: T.text}}>
                                {selectedUser ? 'Edit Operational User' : 'Add New Operational User'}
                            </Typography>
                        </Box>
                        <Button onClick={handleCloseDialog} sx={{
                            minWidth: 0, p: 0.7, borderRadius: '8px',
                            color: T.muted, '&:hover': {bgcolor: T.bg, color: T.rose}
                        }}>
                            <CloseIcon sx={{fontSize: 17}}/>
                        </Button>
                    </Box>
                </DialogTitle>
                <DialogContent sx={{p: 3, bgcolor: T.bg}}>
                    <Box sx={{display: 'flex', flexDirection: 'column', gap: 2}}>
                        {/* Title + First Name + Last Name */}
                        <Box sx={{display: 'flex', gap: 1.5, flexWrap: {xs: 'wrap', sm: 'nowrap'}}}>
                            <Box sx={{width: {xs: '100%', sm: 120}, flexShrink: 0}}>
                                <Typography sx={{
                                    fontSize: '0.7rem', fontWeight: 700, color: T.muted,
                                    textTransform: 'uppercase', letterSpacing: 0.8, mb: 0.8
                                }}>
                                    Title
                                </Typography>
                                <Select
                                    name="title" value={formData.title}
                                    onChange={handleFormChange} fullWidth size="small"
                                    displayEmpty
                                    renderValue={(v) => v ||
                                        <em style={{color: T.muted, fontSize: '0.85rem'}}>Select</em>}
                                    sx={{
                                        borderRadius: '10px', bgcolor: T.bg, fontSize: '0.85rem',
                                        '& .MuiOutlinedInput-notchedOutline': {borderColor: T.border},
                                        '&:hover .MuiOutlinedInput-notchedOutline': {borderColor: T.accent},
                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {borderColor: T.accent}
                                    }}>
                                    <MenuItem value=""><em>None</em></MenuItem>
                                    {['Mr', 'Mrs', 'Ms', 'Dr', 'Prof'].map(t => (
                                        <MenuItem key={t} value={t} sx={{fontSize: '0.85rem'}}>{t}</MenuItem>
                                    ))}
                                </Select>
                            </Box>
                            <Box sx={{flex: 1}}>
                                <InputField label="First Name" name="first_name"
                                            value={formData.first_name} onChange={handleFormChange} required/>
                            </Box>
                            <Box sx={{flex: 1}}>
                                <InputField label="Last Name" name="last_name"
                                            value={formData.last_name} onChange={handleFormChange} required/>
                            </Box>
                        </Box>
                        <InputField label="Email" name="email" value={formData.email}
                                    onChange={handleFormChange} type="email" required/>
                        {!selectedUser && !generatedPassword && (
                            <Box sx={{
                                p: 1.5, bgcolor: T.accentSoft, borderRadius: '8px',
                                border: `1px solid ${T.accent}28`
                            }}>
                                <Typography sx={{fontSize: '0.72rem', color: T.accent, fontWeight: 600}}>
                                    ℹ A default password will be auto-generated as{' '}
                                    <span style={{fontFamily: 'JetBrains Mono, monospace'}}>
                                        firstnamelastname#123
                                    </span>
                                    {' '}and shown once after creation.
                                </Typography>
                            </Box>
                        )}
                        <Box>
                            <Typography sx={{
                                fontSize: '0.7rem', fontWeight: 700, color: T.muted,
                                textTransform: 'uppercase', letterSpacing: 0.8, mb: 0.8
                            }}>
                                Role <span style={{color: T.rose}}>*</span>
                            </Typography>
                            <Select name="user_role" value={formData.user_role}
                                    onChange={handleFormChange} fullWidth size="small"
                                    sx={{
                                        borderRadius: '10px', bgcolor: T.bg, fontSize: '0.85rem',
                                        '& .MuiOutlinedInput-notchedOutline': {borderColor: T.border},
                                        '&:hover .MuiOutlinedInput-notchedOutline': {borderColor: T.accent},
                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {borderColor: T.accent}
                                    }}>
                                {(USER_ROLES || [
                                    {value: 'Admin', label: 'Admin'},
                                    {value: 'Manager', label: 'Manager'},
                                    {value: 'Support', label: 'Support'},
                                ]).map(role => (
                                    <MenuItem key={role.value} value={role.value} sx={{fontSize: '0.85rem'}}>
                                        <Box sx={{display: 'flex', alignItems: 'center', gap: 1.2}}>
                                            <Box sx={{
                                                width: 7, height: 7, borderRadius: '50%',
                                                bgcolor: ROLE_META[role.value]?.color || T.muted
                                            }}/>
                                            {role.label}
                                        </Box>
                                    </MenuItem>
                                ))}
                            </Select>
                        </Box>
                        {generatedPassword && (
                            <Box sx={{
                                mt: 1, p: 2, bgcolor: T.greenSoft, borderRadius: '10px',
                                border: `1px solid ${T.green}28`
                            }}>
                                <Typography sx={{
                                    fontSize: '0.7rem', fontWeight: 700, color: T.green,
                                    textTransform: 'uppercase', letterSpacing: 0.8, mb: 1
                                }}>
                                    ✓ User Created — Default Password
                                </Typography>
                                <Box sx={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    bgcolor: T.surface, borderRadius: '8px', px: 1.5, py: 1,
                                    border: `1px solid ${T.border}`
                                }}>
                                    <Typography sx={{
                                        fontFamily: 'JetBrains Mono, monospace', fontSize: '0.95rem',
                                        fontWeight: 700, color: T.accent
                                    }}>
                                        {generatedPassword}
                                    </Typography>
                                    <Tooltip title={passwordCopied ? 'Copied!' : 'Copy'}>
                                        <IconButton size="small" onClick={() => {
                                            navigator.clipboard.writeText(generatedPassword);
                                            setPasswordCopied(true);
                                            setTimeout(() => setPasswordCopied(false), 2000);
                                        }} sx={{
                                            borderRadius: '8px',
                                            bgcolor: passwordCopied ? T.greenSoft : T.accentSoft,
                                            color: passwordCopied ? T.green : T.accent
                                        }}>
                                            {passwordCopied
                                                ? <CheckIcon sx={{fontSize: 14}}/>
                                                : <CopyIcon sx={{fontSize: 14}}/>}
                                        </IconButton>
                                    </Tooltip>
                                </Box>
                                <Typography sx={{fontSize: '0.7rem', color: T.amber, fontWeight: 600, mt: 1}}>
                                    ⚠ Copy this now — it will not be shown again.
                                </Typography>
                            </Box>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions sx={{
                    px: 3, py: 2.2, bgcolor: T.surface,
                    borderTop: `1px solid ${T.border}`, gap: 1.5
                }}>
                    {!generatedPassword && (
                        <Button onClick={handleCloseDialog} sx={{
                            borderRadius: '10px', textTransform: 'none', fontWeight: 600,
                            fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '0.83rem',
                            color: T.muted, border: `1px solid ${T.border}`,
                            bgcolor: T.bg, '&:hover': {bgcolor: T.border}
                        }}>
                            Cancel
                        </Button>
                    )}
                    <Button
                        onClick={generatedPassword ? handleCloseDialog : handleSubmit}
                        variant="contained" disabled={submitting}
                        sx={{
                            borderRadius: '10px', textTransform: 'none', fontWeight: 700,
                            fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '0.83rem',
                            bgcolor: generatedPassword ? T.green : T.accent, boxShadow: 'none',
                            '&:hover': {
                                bgcolor: generatedPassword ? '#047857' : '#1641B8',
                                boxShadow: `0 4px 14px ${generatedPassword ? T.green : T.accent}44`
                            },
                            '&.Mui-disabled': {bgcolor: T.border, color: T.muted}
                        }}>
                        {submitting
                            ? 'Saving…'
                            : generatedPassword
                                ? 'Done — Close'
                                : selectedUser ? 'Save Changes' : 'Create User'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ── Promote / Demote Confirm Dialog ────────────────────────────── */}
            <Dialog open={promoteDialog.open} onClose={handleClosePromoteDialog} maxWidth="xs" fullWidth
                    PaperProps={{
                        sx: {
                            borderRadius: '16px',
                            border: `1px solid ${promoteDialog.user?.is_super_admin ? T.amber + '44' : T.green + '44'}`,
                            boxShadow: '0 24px 60px rgba(15,31,61,0.14)', bgcolor: T.bg
                        }
                    }}>
                <DialogTitle sx={{p: 0}}>
                    <Box sx={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        px: 3, py: 2.2,
                        bgcolor: promoteDialog.user?.is_super_admin ? T.amberSoft : T.greenSoft,
                        borderBottom: `1px solid ${promoteDialog.user?.is_super_admin ? T.amber + '28' : T.green + '28'}`
                    }}>
                        <Box sx={{display: 'flex', alignItems: 'center', gap: 1.2}}>
                            <Box sx={{
                                width: 30, height: 30, borderRadius: '9px',
                                bgcolor: promoteDialog.user?.is_super_admin ? '#FDE68A' : '#A7F3D0',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                {promoteDialog.user?.is_super_admin
                                    ? <ShieldOutlinedIcon sx={{fontSize: 15, color: T.amber}}/>
                                    : <ShieldIcon sx={{fontSize: 15, color: T.green}}/>}
                            </Box>
                            <Typography sx={{
                                fontWeight: 700, fontSize: '0.95rem',
                                color: promoteDialog.user?.is_super_admin ? T.amber : T.green
                            }}>
                                {promoteDialog.user?.is_super_admin ? 'Demote User' : 'Promote User'}
                            </Typography>
                        </Box>
                        <Button onClick={handleClosePromoteDialog} sx={{
                            minWidth: 0, p: 0.7, borderRadius: '8px',
                            color: T.muted, '&:hover': {bgcolor: 'rgba(0,0,0,0.05)'}
                        }}>
                            <CloseIcon sx={{fontSize: 17}}/>
                        </Button>
                    </Box>
                </DialogTitle>
                <DialogContent sx={{p: 3, bgcolor: T.bg}}>
                    <Typography sx={{fontSize: '0.85rem', color: T.text, mb: 1.5, fontWeight: 600}}>
                        {promoteDialog.user?.is_super_admin
                            ? `Remove Super Admin privileges from ${promoteDialog.user?.first_name} ${promoteDialog.user?.last_name}?`
                            : `Grant Super Admin privileges to ${promoteDialog.user?.first_name} ${promoteDialog.user?.last_name}?`}
                    </Typography>
                    <Typography sx={{fontSize: '0.82rem', color: T.muted, lineHeight: 1.6}}>
                        {promoteDialog.user?.is_super_admin
                            ? 'This user will lose the ability to add, edit, delete users and manage Super Admin privileges. They will keep their existing role.'
                            : 'This user will gain full access to add, edit, delete operational users and manage Super Admin privileges.'}
                    </Typography>
                    <Box sx={{
                        mt: 2, p: 1.5, borderRadius: '8px',
                        bgcolor: promoteDialog.user?.is_super_admin ? T.amberSoft : T.greenSoft,
                        border: `1px solid ${promoteDialog.user?.is_super_admin ? T.amber + '28' : T.green + '28'}`
                    }}>
                        <Typography sx={{
                            fontSize: '0.72rem', fontWeight: 600,
                            color: promoteDialog.user?.is_super_admin ? T.amber : T.green
                        }}>
                            {promoteDialog.user?.is_super_admin
                                ? '⚠ This action can be reversed by any Super Admin at any time.'
                                : '✓ This action can be reversed by any Super Admin at any time.'}
                        </Typography>
                    </Box>
                </DialogContent>
                <DialogActions sx={{
                    px: 3, py: 2.2, bgcolor: T.surface,
                    borderTop: `1px solid ${T.border}`, gap: 1.5
                }}>
                    <Button onClick={handleClosePromoteDialog} sx={{
                        borderRadius: '10px', textTransform: 'none', fontWeight: 600,
                        fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '0.83rem',
                        color: T.muted, border: `1px solid ${T.border}`,
                        bgcolor: T.bg, '&:hover': {bgcolor: T.border}
                    }}>
                        Cancel
                    </Button>
                    <Button onClick={handleToggleSuperAdmin} variant="contained" disabled={promoting}
                            sx={{
                                borderRadius: '10px', textTransform: 'none', fontWeight: 700,
                                fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '0.83rem',
                                bgcolor: promoteDialog.user?.is_super_admin ? T.amber : T.green,
                                boxShadow: 'none',
                                '&:hover': {
                                    bgcolor: promoteDialog.user?.is_super_admin ? '#B45309' : '#047857',
                                    boxShadow: `0 4px 14px ${promoteDialog.user?.is_super_admin ? T.amber : T.green}44`
                                },
                                '&.Mui-disabled': {bgcolor: T.border, color: T.muted}
                            }}>
                        {promoting
                            ? 'Saving…'
                            : promoteDialog.user?.is_super_admin ? 'Yes, Demote' : 'Yes, Promote'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ── View Caution Dialog ─────────────────────────────────────────── */}
            <Dialog open={cautionDialog.open} onClose={handleCautionClose} maxWidth="xs" fullWidth
                    PaperProps={{
                        sx: {
                            borderRadius: '16px', border: `1px solid ${T.amber}44`,
                            boxShadow: '0 24px 60px rgba(15,31,61,0.14)', bgcolor: T.bg
                        }
                    }}>
                <DialogTitle sx={{p: 0}}>
                    <Box sx={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        px: 3, py: 2.2, bgcolor: T.amberSoft, borderBottom: `1px solid ${T.amber}28`
                    }}>
                        <Box sx={{display: 'flex', alignItems: 'center', gap: 1.2}}>
                            <Box sx={{
                                width: 30, height: 30, borderRadius: '9px', bgcolor: '#FDE68A',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <WarningIcon sx={{fontSize: 16, color: T.amber}}/>
                            </Box>
                            <Typography sx={{fontWeight: 700, fontSize: '0.95rem', color: T.amber}}>
                                Restricted Access
                            </Typography>
                        </Box>
                        <Button onClick={handleCautionClose} sx={{
                            minWidth: 0, p: 0.7, borderRadius: '8px',
                            color: T.amber, '&:hover': {bgcolor: '#FDE68A'}
                        }}>
                            <CloseIcon sx={{fontSize: 17}}/>
                        </Button>
                    </Box>
                </DialogTitle>
                <DialogContent sx={{p: 3, bgcolor: T.bg}}>
                    <Typography sx={{fontSize: '0.85rem', color: T.text, mb: 1.5, fontWeight: 600}}>
                        You are about to view another user's profile.
                    </Typography>
                    <Typography sx={{fontSize: '0.82rem', color: T.muted, lineHeight: 1.6}}>
                        You are viewing the profile of{' '}
                        <strong style={{color: T.text}}>
                            {cautionDialog.user?.first_name} {cautionDialog.user?.last_name}
                        </strong>
                        . You do not have permission to edit or manage this account. You can only view their details.
                    </Typography>
                    <Box sx={{
                        mt: 2, p: 1.5, bgcolor: T.amberSoft, borderRadius: '8px',
                        border: `1px solid ${T.amber}28`
                    }}>
                        <Typography sx={{fontSize: '0.72rem', color: T.amber, fontWeight: 600}}>
                            ⚠ Any sensitive information on this page is read-only for your role.
                        </Typography>
                    </Box>
                </DialogContent>
                <DialogActions sx={{
                    px: 3, py: 2.2, bgcolor: T.surface,
                    borderTop: `1px solid ${T.border}`, gap: 1.5
                }}>
                    <Button onClick={handleCautionClose} sx={{
                        borderRadius: '10px', textTransform: 'none', fontWeight: 600,
                        fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '0.83rem',
                        color: T.muted, border: `1px solid ${T.border}`,
                        bgcolor: T.bg, '&:hover': {bgcolor: T.border}
                    }}>
                        Cancel
                    </Button>
                    <Button onClick={handleCautionProceed} variant="contained"
                            sx={{
                                borderRadius: '10px', textTransform: 'none', fontWeight: 700,
                                fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '0.83rem',
                                bgcolor: T.amber, boxShadow: 'none',
                                '&:hover': {bgcolor: '#B45309', boxShadow: `0 4px 14px ${T.amber}44`}
                            }}>
                        View Anyway
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ── Change Password Dialog ──────────────────────────────────────── */}
            <Dialog open={pwDialogOpen} onClose={handleClosePwDialog} maxWidth="xs" fullWidth
                    PaperProps={{
                        sx: {
                            borderRadius: '16px', border: `1px solid ${T.border}`,
                            boxShadow: '0 24px 60px rgba(15,31,61,0.14)', bgcolor: T.bg
                        }
                    }}>
                <DialogTitle sx={{p: 0}}>
                    <Box sx={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        px: 3, py: 2.2, bgcolor: T.surface, borderBottom: `1px solid ${T.border}`
                    }}>
                        <Box sx={{display: 'flex', alignItems: 'center', gap: 1.2}}>
                            <Box sx={{
                                width: 30, height: 30, borderRadius: '9px', bgcolor: T.purpleSoft,
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <LockIcon sx={{fontSize: 15, color: T.purple}}/>
                            </Box>
                            <Box>
                                <Typography sx={{fontWeight: 700, fontSize: '0.95rem', color: T.text}}>
                                    Change Password
                                </Typography>
                                <Typography sx={{fontSize: '0.7rem', color: T.muted}}>
                                    {pwUserName}
                                </Typography>
                            </Box>
                        </Box>
                        <Button onClick={handleClosePwDialog} sx={{
                            minWidth: 0, p: 0.7, borderRadius: '8px',
                            color: T.muted, '&:hover': {bgcolor: T.bg, color: T.rose}
                        }}>
                            <CloseIcon sx={{fontSize: 17}}/>
                        </Button>
                    </Box>
                </DialogTitle>
                <DialogContent sx={{p: 3, bgcolor: T.bg}}>
                    <Box sx={{display: 'flex', flexDirection: 'column', gap: 2}}>
                        {[
                            {label: 'Current Password', name: 'current_password'},
                            {label: 'New Password', name: 'new_password'},
                            {label: 'Confirm Password', name: 'confirm_password'},
                        ].map(({label, name}) => (
                            <Box key={name}>
                                <Typography sx={{
                                    fontSize: '0.7rem', fontWeight: 700, color: T.muted,
                                    textTransform: 'uppercase', letterSpacing: 0.8, mb: 0.8
                                }}>
                                    {label} <span style={{color: T.rose}}>*</span>
                                </Typography>
                                <TextField
                                    fullWidth size="small" name={name}
                                    type="password" value={pwForm[name]}
                                    onChange={handlePwFormChange}
                                    error={!!pwErrors[name]}
                                    helperText={pwErrors[name]}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: '10px', bgcolor: T.bg, fontSize: '0.85rem',
                                            '& fieldset': {borderColor: pwErrors[name] ? T.rose : T.border},
                                            '&:hover fieldset': {borderColor: T.accent},
                                            '&.Mui-focused fieldset': {borderColor: T.accent}
                                        }
                                    }}
                                />
                            </Box>
                        ))}
                        <Box sx={{
                            p: 1.5, bgcolor: T.accentSoft, borderRadius: '8px',
                            border: `1px solid ${T.accent}28`
                        }}>
                            <Typography sx={{fontSize: '0.72rem', color: T.accent, fontWeight: 600}}>
                                ℹ Password must be at least 8 characters and different from the current one.
                            </Typography>
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions sx={{
                    px: 3, py: 2.2, bgcolor: T.surface,
                    borderTop: `1px solid ${T.border}`, gap: 1.5
                }}>
                    <Button onClick={handleClosePwDialog} sx={{
                        borderRadius: '10px', textTransform: 'none', fontWeight: 600,
                        fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '0.83rem',
                        color: T.muted, border: `1px solid ${T.border}`,
                        bgcolor: T.bg, '&:hover': {bgcolor: T.border}
                    }}>
                        Cancel
                    </Button>
                    <Button onClick={handleChangePassword} variant="contained" disabled={pwSubmitting}
                            sx={{
                                borderRadius: '10px', textTransform: 'none', fontWeight: 700,
                                fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '0.83rem',
                                bgcolor: T.purple, boxShadow: 'none',
                                '&:hover': {bgcolor: '#6D28D9', boxShadow: `0 4px 14px ${T.purple}44`},
                                '&.Mui-disabled': {bgcolor: T.border, color: T.muted}
                            }}>
                        {pwSubmitting ? 'Saving…' : 'Change Password'}
                    </Button>
                </DialogActions>
            </Dialog>

        </Box>
    );
};

export default OperationalUsers;