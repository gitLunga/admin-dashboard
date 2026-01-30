// src/components/admin/Users/ApplicationDetailsDialog.jsx
import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    IconButton,
    Typography,
    Box,
    Grid,
    Chip,
    Divider,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableRow,
    Avatar,
} from '@mui/material';
import {
    Close as CloseIcon,
    Person as PersonIcon,
    PhoneAndroid as DeviceIcon,
    Email as EmailIcon,
    Phone as PhoneIcon,
    LocationOn as LocationIcon,
    Business as BusinessIcon,
    Badge as BadgeIcon,
    CalendarToday as CalendarIcon,
    CheckCircle as ApprovedIcon,
    Cancel as RejectedIcon,
} from '@mui/icons-material';
import dayjs from 'dayjs';

const ApplicationDetailsDialog = ({ open, application, onClose }) => {
    if (!application) return null;

    const getStatusColor = (status) => {
        switch (status) {
            case 'Approved':
                return 'success';
            case 'Rejected':
                return 'error';
            case 'Pending':
                return 'warning';
            case 'Cancelled':
                return 'default';
            default:
                return 'default';
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-ZA', {
            style: 'currency',
            currency: 'ZAR',
            minimumFractionDigits: 2,
        }).format(amount);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6">
                        Application Details
                        <Typography variant="caption" display="block" color="textSecondary">
                            ID: #{application.application_id}
                        </Typography>
                    </Typography>
                    <IconButton onClick={onClose}>
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>
            <DialogContent dividers>
                <Grid container spacing={3}>
                    {/* Applicant Information */}
                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 2 }}>
                            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                                <PersonIcon sx={{ mr: 1 }} />
                                Applicant Information
                            </Typography>
                            <TableContainer>
                                <Table size="small">
                                    <TableBody>
                                        <TableRow>
                                            <TableCell><strong>Name</strong></TableCell>
                                            <TableCell>{application.first_name} {application.last_name}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell><strong>Email</strong></TableCell>
                                            <TableCell>
                                                <Box display="flex" alignItems="center">
                                                    <EmailIcon fontSize="small" sx={{ mr: 1 }} />
                                                    {application.email}
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                        {application.phone_number && (
                                            <TableRow>
                                                <TableCell><strong>Phone</strong></TableCell>
                                                <TableCell>
                                                    <Box display="flex" alignItems="center">
                                                        <PhoneIcon fontSize="small" sx={{ mr: 1 }} />
                                                        {application.phone_number}
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                        <TableRow>
                                            <TableCell><strong>User Type</strong></TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={application.user_type}
                                                    size="small"
                                                    color={application.user_type === 'Advocate' ? 'primary' : 'secondary'}
                                                    variant="outlined"
                                                />
                                            </TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell><strong>Region</strong></TableCell>
                                            <TableCell>
                                                <Box display="flex" alignItems="center">
                                                    <LocationIcon fontSize="small" sx={{ mr: 1 }} />
                                                    {application.region || 'N/A'}
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell><strong>Persal ID</strong></TableCell>
                                            <TableCell>
                                                <Box display="flex" alignItems="center">
                                                    <BadgeIcon fontSize="small" sx={{ mr: 1 }} />
                                                    {application.persal_id || 'N/A'}
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell><strong>Department</strong></TableCell>
                                            <TableCell>
                                                <Box display="flex" alignItems="center">
                                                    <BusinessIcon fontSize="small" sx={{ mr: 1 }} />
                                                    {application.department_id || 'N/A'}
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell><strong>Registration Status</strong></TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={application.registration_status}
                                                    size="small"
                                                    color={
                                                        application.registration_status === 'Verified' ? 'success' :
                                                            application.registration_status === 'Rejected' ? 'error' : 'warning'
                                                    }
                                                />
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>
                    </Grid>

                    {/* Device & Application Info */}
                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 2 }}>
                            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                                <DeviceIcon sx={{ mr: 1 }} />
                                Device & Plan Details
                            </Typography>
                            <TableContainer>
                                <Table size="small">
                                    <TableBody>
                                        <TableRow>
                                            <TableCell><strong>Device</strong></TableCell>
                                            <TableCell>{application.device_name}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell><strong>Model</strong></TableCell>
                                            <TableCell>{application.model}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell><strong>Manufacturer</strong></TableCell>
                                            <TableCell>{application.manufacturer}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell><strong>Plan</strong></TableCell>
                                            <TableCell>{application.plan_name}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell><strong>Monthly Cost</strong></TableCell>
                                            <TableCell>{formatCurrency(application.monthly_cost)}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell><strong>Contract Duration</strong></TableCell>
                                            <TableCell>{application.contract_duration_months} months</TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </TableContainer>

                            <Divider sx={{ my: 2 }} />

                            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                                <CalendarIcon sx={{ mr: 1 }} />
                                Application Details
                            </Typography>
                            <TableContainer>
                                <Table size="small">
                                    <TableBody>
                                        <TableRow>
                                            <TableCell><strong>Status</strong></TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={application.application_status}
                                                    color={getStatusColor(application.application_status)}
                                                    size="small"
                                                />
                                            </TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell><strong>Submission Date</strong></TableCell>
                                            <TableCell>
                                                {dayjs(application.submission_date).format('DD MMM YYYY HH:mm')}
                                            </TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell><strong>Last Updated</strong></TableCell>
                                            <TableCell>
                                                {dayjs(application.last_updated).format('DD MMM YYYY HH:mm')}
                                            </TableCell>
                                        </TableRow>
                                        {application.rejection_reason && (
                                            <TableRow>
                                                <TableCell><strong>Rejection Reason</strong></TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" color="error">
                                                        {application.rejection_reason}
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                        {application.approval_status && (
                                            <TableRow>
                                                <TableCell><strong>Approval Status</strong></TableCell>
                                                <TableCell>
                                                    <Chip
                                                        icon={application.approval_status === 'Approved' ? <ApprovedIcon /> : <RejectedIcon />}
                                                        label={application.approval_status}
                                                        color={application.approval_status === 'Approved' ? 'success' : 'error'}
                                                        size="small"
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        )}
                                        {application.approver_first_name && (
                                            <TableRow>
                                                <TableCell><strong>Approved By</strong></TableCell>
                                                <TableCell>
                                                    {application.approver_first_name} {application.approver_last_name}
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>
                    </Grid>
                </Grid>
            </DialogContent>
        </Dialog>
    );
};

export default ApplicationDetailsDialog;