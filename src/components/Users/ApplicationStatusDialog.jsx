// src/components/admin/Users/ApplicationStatusDialog.jsx
import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Box,
    Typography,
    Alert,
    Radio,
    RadioGroup,
    FormControlLabel,
    FormControl,
    FormLabel,
    Chip,
} from '@mui/material';
import {
    CheckCircle as ApprovedIcon,
    Cancel as RejectedIcon,
} from '@mui/icons-material';

const ApplicationStatusDialog = ({ open, application, onClose, onUpdate }) => {
    const [status, setStatus] = useState(application?.application_status || 'Pending');
    const [rejectionReason, setRejectionReason] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (status === 'Rejected' && !rejectionReason.trim()) {
            setError('Please provide a rejection reason');
            return;
        }

        setLoading(true);
        try {
            await onUpdate(application.application_id, {
                status,
                rejection_reason: rejectionReason,
                notes,
                approver_id: 1, // This should come from logged-in admin
            });
            handleClose();
        } catch (err) {
            setError(err.message || 'Failed to update status');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setStatus('Pending');
        setRejectionReason('');
        setNotes('');
        setError('');
        onClose();
    };

    if (!application) return null;

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                Update Application Status
                <Typography variant="caption" display="block" color="textSecondary">
                    Application #{application.application_id}
                </Typography>
            </DialogTitle>
            <DialogContent>
                <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" gutterBottom>
                        Applicant: <strong>{application.first_name} {application.last_name}</strong>
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                        Device: <strong>{application.device_name}</strong>
                    </Typography>
                    <Typography variant="body2">
                        Current Status:
                        <Chip
                            label={application.application_status}
                            size="small"
                            sx={{ ml: 1 }}
                            color={
                                application.application_status === 'Approved' ? 'success' :
                                    application.application_status === 'Rejected' ? 'error' :
                                        application.application_status === 'Pending' ? 'warning' : 'default'
                            }
                        />
                    </Typography>
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <FormControl component="fieldset" sx={{ mb: 3 }}>
                    <FormLabel component="legend">Select New Status</FormLabel>
                    <RadioGroup
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        row
                    >
                        <FormControlLabel
                            value="Approved"
                            control={<Radio />}
                            label={
                                <Box display="flex" alignItems="center">
                                    <ApprovedIcon sx={{ color: 'success.main', mr: 1 }} />
                                    <Typography>Approved</Typography>
                                </Box>
                            }
                        />
                        <FormControlLabel
                            value="Rejected"
                            control={<Radio />}
                            label={
                                <Box display="flex" alignItems="center">
                                    <RejectedIcon sx={{ color: 'error.main', mr: 1 }} />
                                    <Typography>Rejected</Typography>
                                </Box>
                            }
                        />
                    </RadioGroup>
                </FormControl>

                {status === 'Rejected' && (
                    <TextField
                        fullWidth
                        label="Rejection Reason"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        multiline
                        rows={3}
                        required
                        sx={{ mb: 2 }}
                        helperText="Please provide a clear reason for rejection"
                    />
                )}

                <TextField
                    fullWidth
                    label="Admin Notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    multiline
                    rows={3}
                    placeholder="Add any additional notes or instructions..."
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} disabled={loading}>
                    Cancel
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={loading}
                    color={status === 'Approved' ? 'success' : status === 'Rejected' ? 'error' : 'primary'}
                >
                    {loading ? 'Updating...' : 'Update Status'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ApplicationStatusDialog;