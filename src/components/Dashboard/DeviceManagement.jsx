import React, {useState, useEffect, useCallback} from 'react';
import {
    Box, Paper, Typography, IconButton, Chip, CircularProgress,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    TablePagination, Button, Dialog, DialogTitle, DialogContent,
    DialogActions, MenuItem, Select, TextField, InputAdornment,
    Tooltip, useMediaQuery, useTheme,
} from '@mui/material';
import {
    Search as SearchIcon, Edit as EditIcon,
    Add as AddIcon, Delete as DeleteIcon,
    Clear as ClearIcon, PhoneAndroid as DeviceIcon, Close as CloseIcon,
    Refresh as RefreshIcon,
} from '@mui/icons-material';
import {deviceAPI} from '../../services/api';
import {useToast} from '../../hooks/useToast';

// ─── Theme tokens — identical to OperationalUsers ────────────────────────────
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

// ─── Status badge — mirrors RoleBadge in OperationalUsers ────────────────────
const STATUS_META = {
    active:       {color: T.green,  soft: T.greenSoft},
    inactive:     {color: T.amber,  soft: T.amberSoft},
    discontinued: {color: T.rose,   soft: T.roseSoft},
};

const StatusBadge = ({status}) => {
    const m = STATUS_META[status] || {color: T.muted, soft: '#F1F5F9'};
    return (
        <Box sx={{
            display: 'inline-flex', alignItems: 'center', gap: 0.6,
            px: 1.1, py: 0.3, borderRadius: '20px',
            bgcolor: m.soft, border: `1px solid ${m.color}28`
        }}>
            <Box sx={{width: 5, height: 5, borderRadius: '50%', bgcolor: m.color}}/>
            <Typography sx={{fontSize: '0.69rem', fontWeight: 600, color: m.color, textTransform: 'capitalize'}}>
                {status}
            </Typography>
        </Box>
    );
};

// ─── Reusable input — identical pattern to OperationalUsers InputField ────────
const InputField = ({label, name, value, onChange, type = 'text', required, multiline, rows, placeholder, startAdornment}) => (
    <Box>
        <Typography sx={{
            fontSize: '0.7rem', fontWeight: 700, color: T.muted,
            textTransform: 'uppercase', letterSpacing: 0.8, mb: 0.8
        }}>
            {label}{required && <span style={{color: T.rose}}> *</span>}
        </Typography>
        <TextField
            fullWidth size="small" name={name} value={value} onChange={onChange}
            type={type} required={required} multiline={multiline} rows={rows}
            placeholder={placeholder}
            InputProps={startAdornment ? {startAdornment: <InputAdornment position="start">{startAdornment}</InputAdornment>} : undefined}
            sx={{
                '& .MuiOutlinedInput-root': {
                    borderRadius: '10px', bgcolor: T.bg, fontSize: '0.85rem',
                    '& fieldset': {borderColor: T.border},
                    '&:hover fieldset': {borderColor: T.accent},
                    '&.Mui-focused fieldset': {borderColor: T.accent}
                },
                '& input, & textarea': {fontFamily: 'Plus Jakarta Sans, sans-serif'}
            }}
        />
    </Box>
);

// ─── normalise DB row (postgres returns numerics as strings) ──────────────────
const normalizeDevice = (row) => ({
    ...row,
    monthly_cost: parseFloat(row.monthly_cost) || 0,
    contract_duration_months: row.contract_duration_months
        ? parseInt(row.contract_duration_months)
        : null,
});

// ─── Component ────────────────────────────────────────────────────────────────
const DeviceCatalogManagement = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const {success, error: toastError, warning} = useToast();

    const [devices, setDevices]           = useState([]);
    const [loading, setLoading]           = useState(true);
    const [searchTerm, setSearchTerm]     = useState('');
    const [page, setPage]                 = useState(0);
    const [rowsPerPage, setRowsPerPage]   = useState(10);
    const [dialogOpen, setDialogOpen]     = useState(false);
    const [selectedDevice, setSelectedDevice] = useState(null);
    const [submitting, setSubmitting]     = useState(false);

    const [formData, setFormData] = useState({
        device_name: '', model: '', manufacturer: '',
        plan_name: '', plan_details: '', monthly_cost: '',
        contract_duration_months: '', status: 'active',
    });
    const [formErrors, setFormErrors] = useState({});

    // ─── Fetch ────────────────────────────────────────────────────────────────
    const fetchDevices = useCallback(async () => {
        try {
            setLoading(true);
            const response = await deviceAPI.getAllDevices();
            const raw = response.data?.data ?? response.data ?? [];
            setDevices(Array.isArray(raw) ? raw.map(normalizeDevice) : []);
        } catch (err) {
            toastError(err.response?.data?.message || 'Failed to fetch devices', 'Failed to Load');
        } finally {
            setLoading(false);
        }
    }, [toastError]);

    useEffect(() => {fetchDevices();}, [fetchDevices]);

    // ─── Dialog helpers ───────────────────────────────────────────────────────
    const handleOpenDialog = (device = null) => {
        if (device) {
            setFormData({
                device_name:              device.device_name || '',
                model:                    device.model || '',
                manufacturer:             device.manufacturer || '',
                plan_name:                device.plan_name || '',
                plan_details:             device.plan_details || '',
                monthly_cost:             device.monthly_cost || '',
                contract_duration_months: device.contract_duration_months || '',
                status:                   device.status || 'active',
            });
            setSelectedDevice(device);
        } else {
            setFormData({
                device_name: '', model: '', manufacturer: '',
                plan_name: '', plan_details: '', monthly_cost: '',
                contract_duration_months: '', status: 'active',
            });
            setSelectedDevice(null);
        }
        setFormErrors({});
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setSelectedDevice(null);
        setFormErrors({});
    };

    const handleFormChange = (e) => {
        const {name, value} = e.target;
        setFormData(prev => ({...prev, [name]: value}));
        if (formErrors[name]) setFormErrors(prev => ({...prev, [name]: ''}));
    };

    // ─── Validation ───────────────────────────────────────────────────────────
    const validateForm = () => {
        const errors = {};
        if (!formData.device_name?.trim())    errors.device_name    = 'Device name is required';
        if (!formData.model?.trim())          errors.model          = 'Model is required';
        if (!formData.manufacturer?.trim())   errors.manufacturer   = 'Manufacturer is required';
        if (!formData.plan_name?.trim())      errors.plan_name      = 'Plan name is required';
        if (!formData.monthly_cost)           errors.monthly_cost   = 'Monthly cost is required';
        if (formData.monthly_cost && isNaN(formData.monthly_cost))
            errors.monthly_cost = 'Must be a valid number';

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            warning('Please fill in all required fields.', 'Missing Fields');
            return false;
        }
        return true;
    };

    // ─── Submit ───────────────────────────────────────────────────────────────
    const handleSubmit = async () => {
        if (!validateForm()) return;

        const payload = {
            device_name:              formData.device_name.trim(),
            model:                    formData.model.trim(),
            manufacturer:             formData.manufacturer.trim(),
            plan_name:                formData.plan_name.trim(),
            plan_details:             formData.plan_details?.trim() || null,
            monthly_cost:             parseFloat(formData.monthly_cost),
            contract_duration_months: formData.contract_duration_months
                ? parseInt(formData.contract_duration_months)
                : null,
            status: formData.status,
        };

        setSubmitting(true);
        try {
            if (selectedDevice) {
                const response = await deviceAPI.updateDevice(selectedDevice.device_id, payload);
                success(response?.data?.message || `${payload.device_name} has been updated.`, 'Device Updated');
            } else {
                const response = await deviceAPI.createDevice(payload);
                success(response?.data?.message || `${payload.device_name} has been added.`, 'Device Created');
            }
            handleCloseDialog();
            fetchDevices();
        } catch (err) {
            const status = err.response?.status;
            const msg = err.response?.data?.message || (selectedDevice ? 'Failed to update device' : 'Failed to create device');
            if (status === 409) {
                toastError(msg, 'Duplicate Device');
            } else {
                toastError(msg, selectedDevice ? 'Update Failed' : 'Creation Failed');
            }
        } finally {
            setSubmitting(false);
        }
    };

    // ─── Delete ───────────────────────────────────────────────────────────────
    const handleDelete = async (device) => {
        if (!window.confirm(`Are you sure you want to delete ${device.device_name}?`)) return;
        try {
            const response = await deviceAPI.deleteDevice(device.device_id);
            const msg = response?.data?.message || `${device.device_name} has been removed.`;
            success(msg, response?.data?.discontinued ? 'Device Discontinued' : 'Device Deleted');
            fetchDevices();
        } catch (err) {
            toastError(err.response?.data?.message || 'Failed to delete device', 'Delete Failed');
        }
    };

    // ─── Filtered list ────────────────────────────────────────────────────────
    const filteredDevices = devices.filter(d =>
        d.device_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.plan_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // ─── Loading state ────────────────────────────────────────────────────────
    if (loading && devices.length === 0) return (
        <Box sx={{display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400, bgcolor: T.bg}}>
            <CircularProgress sx={{color: T.accent}}/>
        </Box>
    );

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <Box sx={{p: {xs: 2, md: 3.5}, bgcolor: T.bg, minHeight: '100vh'}}>

            {/* Header */}
            <Box sx={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                mb: 3, flexWrap: 'wrap', gap: 1.5, animation: 'fadeUp 0.4s ease-out'
            }}>
                <Box>
                    <Box sx={{display: 'flex', alignItems: 'center', gap: 1.2, mb: 0.3}}>
                        <Box sx={{p: 1, borderRadius: '10px', bgcolor: T.accentSoft}}>
                            <DeviceIcon sx={{fontSize: 20, color: T.accent}}/>
                        </Box>
                        <Typography sx={{
                            fontSize: {xs: '1.25rem', md: '1.6rem'},
                            fontWeight: 800, color: T.text, letterSpacing: '-0.3px'
                        }}>
                            Device Catalog
                        </Typography>
                    </Box>
                    <Typography sx={{fontSize: '0.78rem', color: T.muted, ml: 0.5}}>
                        Manage devices available to clients
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon sx={{fontSize: '16px !important'}}/>}
                    onClick={() => handleOpenDialog()}
                    sx={{
                        borderRadius: '10px', textTransform: 'none', fontWeight: 700,
                        fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '0.83rem',
                        bgcolor: T.accent, boxShadow: 'none',
                        '&:hover': {bgcolor: '#1641B8', boxShadow: `0 4px 14px ${T.accent}44`}
                    }}>
                    Add Device
                </Button>
            </Box>

            {/* Search bar */}
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
                            placeholder="Search by name, model, manufacturer…"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            style={{
                                border: 'none', outline: 'none', background: 'transparent',
                                width: '100%', fontFamily: 'Plus Jakarta Sans, sans-serif',
                                fontSize: '0.83rem', color: T.text
                            }}
                        />
                        {searchTerm && (
                            <IconButton size="small" onClick={() => setSearchTerm('')}
                                        sx={{p: 0.3, color: T.muted}}>
                                <ClearIcon sx={{fontSize: 13}}/>
                            </IconButton>
                        )}
                    </Box>
                    <Chip
                        label={`${filteredDevices.length} device${filteredDevices.length !== 1 ? 's' : ''}`}
                        size="small"
                        sx={{
                            height: 28, fontSize: '0.75rem', fontWeight: 700,
                            bgcolor: T.accentSoft, color: T.accent,
                            fontFamily: 'JetBrains Mono, monospace'
                        }}
                    />
                    <Tooltip title="Refresh">
                        <IconButton onClick={fetchDevices} size="small"
                                    sx={{borderRadius: '8px', bgcolor: T.bg, border: `1px solid ${T.border}`}}>
                            <RefreshIcon sx={{fontSize: 16, color: T.muted}}/>
                        </IconButton>
                    </Tooltip>
                </Box>
            </Paper>

            {/* Table */}
            <Paper elevation={0} sx={{
                borderRadius: '14px', border: `1px solid ${T.border}`,
                bgcolor: T.surface, overflow: 'hidden'
            }}>
                <TableContainer>
                    <Table size={isMobile ? 'small' : 'medium'}>
                        <TableHead>
                            <TableRow sx={{bgcolor: T.bg}}>
                                {[
                                    'Device',
                                    !isMobile && 'Manufacturer',
                                    !isMobile && 'Plan',
                                    'Monthly Cost',
                                    !isMobile && 'Contract',
                                    'Status',
                                    'Actions'
                                ].filter(Boolean).map(h => (
                                    <TableCell key={h} sx={{
                                        fontWeight: 700, fontSize: '0.7rem', color: T.muted,
                                        letterSpacing: 0.8, textTransform: 'uppercase',
                                        py: 1.6, borderBottom: `1px solid ${T.border}`
                                    }}>{h}</TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredDevices
                                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                .map((device, i) => (
                                    <TableRow key={device.device_id} hover sx={{
                                        '&:hover': {bgcolor: T.bg},
                                        transition: 'background-color 0.15s ease',
                                        animation: `fadeUp 0.35s ease-out ${i * 0.03}s both`
                                    }}>
                                        {/* Device name + model */}
                                        <TableCell sx={{py: 1.8, borderBottom: `1px solid ${T.border}`}}>
                                            <Box sx={{display: 'flex', alignItems: 'center', gap: 1.5}}>
                                                <Box sx={{
                                                    width: 34, height: 34, borderRadius: '10px',
                                                    bgcolor: T.accentSoft,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    flexShrink: 0
                                                }}>
                                                    <DeviceIcon sx={{fontSize: 17, color: T.accent}}/>
                                                </Box>
                                                <Box>
                                                    <Typography sx={{fontSize: '0.83rem', fontWeight: 600, color: T.text}}>
                                                        {device.device_name}
                                                    </Typography>
                                                    <Typography className="mono" sx={{fontSize: '0.67rem', color: T.muted}}>
                                                        {device.model}
                                                    </Typography>
                                                    {isMobile && (
                                                        <Typography sx={{fontSize: '0.71rem', color: T.muted, mt: 0.2}}>
                                                            {device.manufacturer}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            </Box>
                                        </TableCell>

                                        {/* Manufacturer */}
                                        {!isMobile && (
                                            <TableCell sx={{py: 1.8, borderBottom: `1px solid ${T.border}`}}>
                                                <Typography sx={{fontSize: '0.8rem', color: T.text}}>
                                                    {device.manufacturer}
                                                </Typography>
                                            </TableCell>
                                        )}

                                        {/* Plan */}
                                        {!isMobile && (
                                            <TableCell sx={{py: 1.8, borderBottom: `1px solid ${T.border}`}}>
                                                <Typography sx={{fontSize: '0.8rem', fontWeight: 600, color: T.text}}>
                                                    {device.plan_name}
                                                </Typography>
                                                {device.plan_details && (
                                                    <Typography sx={{fontSize: '0.67rem', color: T.muted, mt: 0.2}}>
                                                        {device.plan_details.length > 40
                                                            ? `${device.plan_details.substring(0, 40)}…`
                                                            : device.plan_details}
                                                    </Typography>
                                                )}
                                            </TableCell>
                                        )}

                                        {/* Monthly cost */}
                                        <TableCell sx={{py: 1.8, borderBottom: `1px solid ${T.border}`}}>
                                            <Typography sx={{
                                                fontSize: '0.83rem', fontWeight: 700, color: T.accent,
                                                fontFamily: 'JetBrains Mono, monospace'
                                            }}>
                                                R{parseFloat(device.monthly_cost || 0).toFixed(2)}
                                            </Typography>
                                        </TableCell>

                                        {/* Contract */}
                                        {!isMobile && (
                                            <TableCell sx={{py: 1.8, borderBottom: `1px solid ${T.border}`}}>
                                                <Typography sx={{fontSize: '0.8rem', color: T.text}}>
                                                    {device.contract_duration_months
                                                        ? `${device.contract_duration_months} months`
                                                        : 'No contract'}
                                                </Typography>
                                            </TableCell>
                                        )}

                                        {/* Status */}
                                        <TableCell sx={{py: 1.8, borderBottom: `1px solid ${T.border}`}}>
                                            <StatusBadge status={device.status}/>
                                        </TableCell>

                                        {/* Actions */}
                                        <TableCell sx={{py: 1.8, borderBottom: `1px solid ${T.border}`}}>
                                            <Box sx={{display: 'flex', gap: 0.5}}>
                                                <Tooltip title="Edit">
                                                    <IconButton size="small" onClick={() => handleOpenDialog(device)}
                                                                sx={{
                                                                    width: 28, height: 28, borderRadius: '8px',
                                                                    bgcolor: T.amberSoft, color: T.amber,
                                                                    '&:hover': {bgcolor: '#FDE68A'}
                                                                }}>
                                                        <EditIcon sx={{fontSize: 14}}/>
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Delete">
                                                    <IconButton size="small" onClick={() => handleDelete(device)}
                                                                sx={{
                                                                    width: 28, height: 28, borderRadius: '8px',
                                                                    bgcolor: T.roseSoft, color: T.rose,
                                                                    '&:hover': {bgcolor: '#FECACA'}
                                                                }}>
                                                        <DeleteIcon sx={{fontSize: 14}}/>
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))}

                            {filteredDevices.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} sx={{py: 7, textAlign: 'center', borderBottom: 'none'}}>
                                        <DeviceIcon sx={{fontSize: 44, color: T.border, mb: 1.5}}/>
                                        <Typography sx={{fontSize: '0.88rem', fontWeight: 600, color: T.muted}}>
                                            {searchTerm ? 'No devices match your search' : 'No devices found'}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25]} component="div"
                    count={filteredDevices.length} rowsPerPage={rowsPerPage} page={page}
                    onPageChange={(e, p) => setPage(p)}
                    onRowsPerPageChange={e => {setRowsPerPage(parseInt(e.target.value, 10)); setPage(0);}}
                    sx={{
                        borderTop: `1px solid ${T.border}`,
                        '& *': {fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '0.8rem'}
                    }}
                />
            </Paper>

            {/* Add / Edit Dialog */}
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
                                bgcolor: selectedDevice ? T.amberSoft : T.accentSoft,
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                {selectedDevice
                                    ? <EditIcon sx={{fontSize: 15, color: T.amber}}/>
                                    : <AddIcon  sx={{fontSize: 15, color: T.accent}}/>}
                            </Box>
                            <Typography sx={{fontWeight: 700, fontSize: '0.95rem', color: T.text}}>
                                {selectedDevice ? 'Edit Device' : 'Add New Device'}
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

                        {/* Device name + Model */}
                        <Box sx={{display: 'flex', gap: 1.5, flexWrap: {xs: 'wrap', sm: 'nowrap'}}}>
                            <Box sx={{flex: 1}}>
                                <InputField label="Device Name" name="device_name"
                                            value={formData.device_name} onChange={handleFormChange} required/>
                                {formErrors.device_name && (
                                    <Typography sx={{fontSize: '0.7rem', color: T.rose, mt: 0.5}}>
                                        {formErrors.device_name}
                                    </Typography>
                                )}
                            </Box>
                            <Box sx={{flex: 1}}>
                                <InputField label="Model" name="model"
                                            value={formData.model} onChange={handleFormChange} required/>
                                {formErrors.model && (
                                    <Typography sx={{fontSize: '0.7rem', color: T.rose, mt: 0.5}}>
                                        {formErrors.model}
                                    </Typography>
                                )}
                            </Box>
                        </Box>

                        {/* Manufacturer + Plan Name */}
                        <Box sx={{display: 'flex', gap: 1.5, flexWrap: {xs: 'wrap', sm: 'nowrap'}}}>
                            <Box sx={{flex: 1}}>
                                <InputField label="Manufacturer" name="manufacturer"
                                            value={formData.manufacturer} onChange={handleFormChange} required/>
                                {formErrors.manufacturer && (
                                    <Typography sx={{fontSize: '0.7rem', color: T.rose, mt: 0.5}}>
                                        {formErrors.manufacturer}
                                    </Typography>
                                )}
                            </Box>
                            <Box sx={{flex: 1}}>
                                <InputField label="Plan Name" name="plan_name"
                                            value={formData.plan_name} onChange={handleFormChange} required/>
                                {formErrors.plan_name && (
                                    <Typography sx={{fontSize: '0.7rem', color: T.rose, mt: 0.5}}>
                                        {formErrors.plan_name}
                                    </Typography>
                                )}
                            </Box>
                        </Box>

                        {/* Plan Details */}
                        <InputField label="Plan Details" name="plan_details"
                                    value={formData.plan_details} onChange={handleFormChange}
                                    multiline rows={3} placeholder="Describe plan features, limitations, etc."/>

                        {/* Monthly Cost + Contract Duration */}
                        <Box sx={{display: 'flex', gap: 1.5, flexWrap: {xs: 'wrap', sm: 'nowrap'}}}>
                            <Box sx={{flex: 1}}>
                                <InputField label="Monthly Cost" name="monthly_cost" type="number"
                                            value={formData.monthly_cost} onChange={handleFormChange}
                                            required startAdornment="R"/>
                                {formErrors.monthly_cost && (
                                    <Typography sx={{fontSize: '0.7rem', color: T.rose, mt: 0.5}}>
                                        {formErrors.monthly_cost}
                                    </Typography>
                                )}
                            </Box>
                            <Box sx={{flex: 1}}>
                                <Typography sx={{
                                    fontSize: '0.7rem', fontWeight: 700, color: T.muted,
                                    textTransform: 'uppercase', letterSpacing: 0.8, mb: 0.8
                                }}>
                                    Contract Duration
                                </Typography>
                                <Select
                                    name="contract_duration_months"
                                    value={formData.contract_duration_months}
                                    onChange={handleFormChange}
                                    displayEmpty fullWidth size="small"
                                    renderValue={(v) => v ? `${v} Months` : <em style={{color: T.muted}}>No contract</em>}
                                    sx={{
                                        borderRadius: '10px', bgcolor: T.bg, fontSize: '0.85rem',
                                        '& .MuiOutlinedInput-notchedOutline': {borderColor: T.border},
                                        '&:hover .MuiOutlinedInput-notchedOutline': {borderColor: T.accent},
                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {borderColor: T.accent}
                                    }}>
                                    <MenuItem value=""><em>No contract</em></MenuItem>
                                    <MenuItem value={12}>12 Months</MenuItem>
                                    <MenuItem value={24}>24 Months</MenuItem>
                                    <MenuItem value={36}>36 Months</MenuItem>
                                </Select>
                            </Box>
                        </Box>

                        {/* Status */}
                        <Box>
                            <Typography sx={{
                                fontSize: '0.7rem', fontWeight: 700, color: T.muted,
                                textTransform: 'uppercase', letterSpacing: 0.8, mb: 0.8
                            }}>
                                Status <span style={{color: T.rose}}>*</span>
                            </Typography>
                            <Select
                                name="status" value={formData.status}
                                onChange={handleFormChange} fullWidth size="small"
                                sx={{
                                    borderRadius: '10px', bgcolor: T.bg, fontSize: '0.85rem',
                                    '& .MuiOutlinedInput-notchedOutline': {borderColor: T.border},
                                    '&:hover .MuiOutlinedInput-notchedOutline': {borderColor: T.accent},
                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {borderColor: T.accent}
                                }}>
                                {[
                                    {value: 'active',       label: 'Active'},
                                    {value: 'inactive',     label: 'Inactive'},
                                    {value: 'discontinued', label: 'Discontinued'},
                                ].map(opt => (
                                    <MenuItem key={opt.value} value={opt.value} sx={{fontSize: '0.85rem'}}>
                                        <Box sx={{display: 'flex', alignItems: 'center', gap: 1.2}}>
                                            <Box sx={{
                                                width: 7, height: 7, borderRadius: '50%',
                                                bgcolor: STATUS_META[opt.value]?.color || T.muted
                                            }}/>
                                            {opt.label}
                                        </Box>
                                    </MenuItem>
                                ))}
                            </Select>
                        </Box>
                    </Box>
                </DialogContent>

                <DialogActions sx={{px: 3, py: 2.2, bgcolor: T.surface, borderTop: `1px solid ${T.border}`, gap: 1.5}}>
                    <Button onClick={handleCloseDialog} sx={{
                        borderRadius: '10px', textTransform: 'none', fontWeight: 600,
                        fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '0.83rem',
                        color: T.muted, border: `1px solid ${T.border}`,
                        bgcolor: T.bg, '&:hover': {bgcolor: T.border}
                    }}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} variant="contained" disabled={submitting}
                            sx={{
                                borderRadius: '10px', textTransform: 'none', fontWeight: 700,
                                fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '0.83rem',
                                bgcolor: T.accent, boxShadow: 'none',
                                '&:hover': {bgcolor: '#1641B8', boxShadow: `0 4px 14px ${T.accent}44`},
                                '&.Mui-disabled': {bgcolor: T.border, color: T.muted}
                            }}>
                        {submitting ? 'Saving…' : selectedDevice ? 'Save Changes' : 'Add Device'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default DeviceCatalogManagement;