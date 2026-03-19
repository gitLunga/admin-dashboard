// components/Dashboard/DeviceManagement.jsx
import React, { useState, useEffect } from 'react';
import {
    Container,
    Paper,
    Typography,
    TextField,
    Button,
    Grid,
    MenuItem,
    Box,
    Alert,
    Snackbar,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    CircularProgress,
    Chip,
    InputAdornment
} from '@mui/material';
import {
    Edit,
    Delete,
    Add,
    PhoneAndroid,
    Search,
    Refresh
} from '@mui/icons-material';
import { deviceAPI } from '../../services/api';
import { T } from '../Layout/Sidebar';

const DeviceCatalogManagement = () => {
    const [devices, setDevices] = useState([]);
    const [filteredDevices, setFilteredDevices] = useState([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingDevice, setEditingDevice] = useState(null);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success'
    });

    const [formData, setFormData] = useState({
        device_name: '',
        model: '',
        manufacturer: '',
        plan_name: '',
        plan_details: '',
        monthly_cost: '',
        contract_duration_months: '',
        status: 'active'
    });

    const [formErrors, setFormErrors] = useState({});

    // Fetch devices on component mount
    useEffect(() => {
        fetchDevices();
    }, []);

    // Filter devices based on search term
    useEffect(() => {
        if (searchTerm.trim() === '') {
            setFilteredDevices(devices);
        } else {
            const filtered = devices.filter(device =>
                device.device_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                device.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                device.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                device.plan_name?.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredDevices(filtered);
        }
    }, [searchTerm, devices]);

    const fetchDevices = async () => {
        setLoading(true);
        try {
            const response = await deviceAPI.getAllDevices();
            // Based on your service response structure
            setDevices(response.data.data || response.data || []);
        } catch (error) {
            showSnackbar(
                error.response?.data?.message || 'Error fetching devices',
                'error'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error for this field
        if (formErrors[name]) {
            setFormErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const errors = {};
        if (!formData.device_name?.trim()) errors.device_name = 'Device name is required';
        if (!formData.model?.trim()) errors.model = 'Model is required';
        if (!formData.manufacturer?.trim()) errors.manufacturer = 'Manufacturer is required';
        if (!formData.plan_name?.trim()) errors.plan_name = 'Plan name is required';
        if (!formData.monthly_cost) errors.monthly_cost = 'Monthly cost is required';
        if (formData.monthly_cost && isNaN(formData.monthly_cost)) errors.monthly_cost = 'Must be a number';
        if (formData.contract_duration_months && isNaN(formData.contract_duration_months)) {
            errors.contract_duration_months = 'Must be a number';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setLoading(true);
        try {
            const deviceData = {
                device_name: formData.device_name.trim(),
                model: formData.model.trim(),
                manufacturer: formData.manufacturer.trim(),
                plan_name: formData.plan_name.trim(),
                plan_details: formData.plan_details.trim(),
                monthly_cost: parseFloat(formData.monthly_cost),
                // Convert empty string to null for contract duration
                contract_duration_months: formData.contract_duration_months ?
                    parseInt(formData.contract_duration_months) : null,
                status: formData.status
            };

            if (editingDevice) {
                await deviceAPI.updateDevice(editingDevice.device_id, deviceData);
                showSnackbar('Device updated successfully', 'success');
            } else {
                await deviceAPI.createDevice(deviceData);
                showSnackbar('Device created successfully', 'success');
            }

            handleCloseDialog();
            fetchDevices();
        } catch (error) {
            showSnackbar(
                error.response?.data?.message || 'Error saving device',
                'error'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (device) => {
        setEditingDevice(device);
        setFormData({
            device_name: device.device_name || '',
            model: device.model || '',
            manufacturer: device.manufacturer || '',
            plan_name: device.plan_name || '',
            plan_details: device.plan_details || '',
            monthly_cost: device.monthly_cost || '',
            contract_duration_months: device.contract_duration_months || '',
            status: device.status || 'active'
        });
        setOpenDialog(true);
    };

    const handleDelete = async (deviceId) => {
        if (window.confirm('Are you sure you want to delete this device?')) {
            setLoading(true);
            try {
                await deviceAPI.deleteDevice(deviceId);
                showSnackbar('Device deleted successfully', 'success');
                fetchDevices();
            } catch (error) {
                showSnackbar(
                    error.response?.data?.message || 'Error deleting device',
                    'error'
                );
            } finally {
                setLoading(false);
            }
        }
    };

    const handleOpenDialog = () => {
        setEditingDevice(null);
        setFormData({
            device_name: '',
            model: '',
            manufacturer: '',
            plan_name: '',
            plan_details: '',
            monthly_cost: '',
            contract_duration_months: '',
            status: 'active'
        });
        setFormErrors({});
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingDevice(null);
        setFormErrors({});
    };

    const showSnackbar = (message, severity) => {
        setSnackbar({
            open: true,
            message,
            severity
        });
    };

    const statusOptions = [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
        { value: 'discontinued', label: 'Discontinued' }
    ];

    const getStatusChip = (status) => {
        const statusConfig = {
            active: { bg: T.greenSoft, color: T.green },
            inactive: { bg: T.amberSoft, color: T.amber },
            discontinued: { bg: T.roseSoft, color: T.rose }
        };
        const config = statusConfig[status] || { bg: T.bg, color: T.muted };

        return (
            <Chip
                label={status}
                size="small"
                sx={{
                    bgcolor: config.bg,
                    color: config.color,
                    fontWeight: 600,
                    textTransform: 'capitalize'
                }}
            />
        );
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            {/* Header */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box>
                    <Typography variant="h4" component="h1" sx={{ color: T.text, fontWeight: 700, mb: 1 }}>
                        Device Catalog Management
                    </Typography>
                    <Typography variant="body2" sx={{ color: T.muted }}>
                        Manage devices that will be accessible to clients
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={handleOpenDialog}
                    sx={{
                        bgcolor: T.accent,
                        '&:hover': { bgcolor: T.accentMid }
                    }}
                >
                    Add New Device
                </Button>
            </Box>

            {/* Search and Filter Bar */}
            <Paper sx={{ p: 2, mb: 3, border: `1px solid ${T.border}`, borderRadius: '12px' }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Search devices by name, model, manufacturer..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Search sx={{ color: T.muted }} />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    '& fieldset': {
                                        borderColor: T.border,
                                    },
                                },
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                            startIcon={<Refresh />}
                            onClick={fetchDevices}
                            sx={{ color: T.muted }}
                        >
                            Refresh
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

            {/* Devices Table */}
            <TableContainer
                component={Paper}
                sx={{
                    boxShadow: 'none',
                    border: `1px solid ${T.border}`,
                    borderRadius: '12px',
                    maxHeight: 'calc(100vh - 300px)',
                    overflow: 'auto'
                }}
            >
                <Table stickyHeader>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 700, color: T.text, bgcolor: T.bg }}>Device Name</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: T.text, bgcolor: T.bg }}>Model</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: T.text, bgcolor: T.bg }}>Manufacturer</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: T.text, bgcolor: T.bg }}>Plan</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: T.text, bgcolor: T.bg }}>Monthly Cost</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: T.text, bgcolor: T.bg }}>Contract</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: T.text, bgcolor: T.bg }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: T.text, bgcolor: T.bg }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading && devices.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                                    <CircularProgress />
                                </TableCell>
                            </TableRow>
                        ) : filteredDevices.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} align="center" sx={{ py: 8, color: T.muted }}>
                                    <PhoneAndroid sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                                    <Typography>
                                        {searchTerm ? 'No devices match your search' : 'No devices found. Click "Add New Device" to create one.'}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredDevices.map((device) => (
                                <TableRow key={device.device_id} hover>
                                    <TableCell sx={{ fontWeight: 600, color: T.text }}>{device.device_name}</TableCell>
                                    <TableCell>{device.model}</TableCell>
                                    <TableCell>{device.manufacturer}</TableCell>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                            {device.plan_name}
                                        </Typography>
                                        {device.plan_details && (
                                            <Typography variant="caption" sx={{ color: T.muted }}>
                                                {device.plan_details.substring(0, 50)}
                                                {device.plan_details.length > 50 && '...'}
                                            </Typography>
                                        )}
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: T.accent }}>
                                        ${device.monthly_cost?.toFixed(2)}
                                    </TableCell>
                                    <TableCell>
                                        {device.contract_duration_months ?
                                            `${device.contract_duration_months} months` :
                                            'No contract'
                                        }
                                    </TableCell>
                                    <TableCell>{getStatusChip(device.status)}</TableCell>
                                    <TableCell>
                                        <IconButton
                                            onClick={() => handleEdit(device)}
                                            size="small"
                                            sx={{ color: T.accent, mr: 1 }}
                                        >
                                            <Edit fontSize="small" />
                                        </IconButton>
                                        <IconButton
                                            onClick={() => handleDelete(device.device_id)}
                                            size="small"
                                            sx={{ color: T.rose }}
                                        >
                                            <Delete fontSize="small" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Add/Edit Device Dialog */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                <DialogTitle sx={{
                    bgcolor: T.bg,
                    color: T.text,
                    fontWeight: 700,
                    borderBottom: `1px solid ${T.border}`
                }}>
                    {editingDevice ? 'Edit Device' : 'Add New Device'}
                </DialogTitle>
                <DialogContent sx={{ pt: 3 }}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Device Name"
                                name="device_name"
                                value={formData.device_name}
                                onChange={handleInputChange}
                                error={!!formErrors.device_name}
                                helperText={formErrors.device_name}
                                required
                                size="small"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Model"
                                name="model"
                                value={formData.model}
                                onChange={handleInputChange}
                                error={!!formErrors.model}
                                helperText={formErrors.model}
                                required
                                size="small"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Manufacturer"
                                name="manufacturer"
                                value={formData.manufacturer}
                                onChange={handleInputChange}
                                error={!!formErrors.manufacturer}
                                helperText={formErrors.manufacturer}
                                required
                                size="small"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Plan Name"
                                name="plan_name"
                                value={formData.plan_name}
                                onChange={handleInputChange}
                                error={!!formErrors.plan_name}
                                helperText={formErrors.plan_name}
                                required
                                size="small"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Plan Details"
                                name="plan_details"
                                value={formData.plan_details}
                                onChange={handleInputChange}
                                multiline
                                rows={3}
                                size="small"
                                placeholder="Describe the plan features, limitations, etc."
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Monthly Cost (R)"
                                name="monthly_cost"
                                type="number"
                                value={formData.monthly_cost}
                                onChange={handleInputChange}
                                error={!!formErrors.monthly_cost}
                                helperText={formErrors.monthly_cost}
                                required
                                size="small"
                                InputProps={{
                                    inputProps: { min: 0, step: 0.01 },
                                    startAdornment: <InputAdornment position="start">R</InputAdornment>
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                select
                                label="Contract Duration"
                                name="contract_duration_months"
                                value={formData.contract_duration_months}
                                onChange={handleInputChange}
                                error={!!formErrors.contract_duration_months}
                                helperText={formErrors.contract_duration_months}
                                size="small"
                                SelectProps={{
                                    displayEmpty: true,
                                    renderValue: (selected) => {
                                        if (selected === '' || selected === null) {
                                            return <em style={{ color: '#6B7A99' }}>Select Contract Duration</em>;
                                        }
                                        return `${selected} Months`;
                                    }
                                }}
                            >
                                <MenuItem value="">
                                    <em>Select Contract Duration</em>
                                </MenuItem>
                                <MenuItem value={12}>12 Months</MenuItem>
                                <MenuItem value={24}>24 Months</MenuItem>
                                <MenuItem value={36}>36 Months</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                select
                                label="Status"
                                name="status"
                                value={formData.status}
                                onChange={handleInputChange}
                                size="small"
                            >
                                {statusOptions.map((option) => (
                                    <MenuItem key={option.value} value={option.value}>
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 2.5, borderTop: `1px solid ${T.border}` }}>
                    <Button onClick={handleCloseDialog} sx={{ color: T.muted }}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        variant="contained"
                        disabled={loading}
                        sx={{
                            bgcolor: T.accent,
                            '&:hover': { bgcolor: T.accentMid }
                        }}
                    >
                        {loading ? <CircularProgress size={24} /> : (editingDevice ? 'Update Device' : 'Create Device')}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    severity={snackbar.severity}
                    sx={{
                        width: '100%',
                        bgcolor: snackbar.severity === 'success' ? T.greenSoft : T.roseSoft,
                        color: snackbar.severity === 'success' ? T.green : T.rose
                    }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default DeviceCatalogManagement;