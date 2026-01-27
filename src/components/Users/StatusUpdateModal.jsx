import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Alert,
  Chip,
} from '@mui/material';
import {
  CheckCircle as VerifiedIcon,
  Pending as PendingIcon,
  Block as RejectedIcon,
} from '@mui/icons-material';

const StatusUpdateModal = ({ open, user, onClose, onSubmit }) => {
  const [status, setStatus] = useState(user?.registration_status || 'Pending');
  const [notes, setNotes] = useState(user?.verification_notes || '');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setStatus(user.registration_status || 'Pending');
      setNotes(user.verification_notes || '');
    }
  }, [user]);

  const handleSubmit = () => {
    if (!status) {
      setError('Please select a status');
      return;
    }

    if (status === 'Rejected' && !notes.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }

    onSubmit(status, notes.trim());
  };

  const getStatusOptions = () => [
    { value: 'Verified', label: 'Verified', icon: <VerifiedIcon />, color: 'success' },
    { value: 'Pending', label: 'Pending', icon: <PendingIcon />, color: 'warning' },
    { value: 'Rejected', label: 'Rejected', icon: <RejectedIcon />, color: 'error' },
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Update User Registration Status
      </DialogTitle>
      <DialogContent>
        {user && (
          <Box mb={3}>
            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
              User Details
            </Typography>
            <Typography variant="body1" gutterBottom>
              {user.title} {user.first_name} {user.last_name}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Email: {user.email}
            </Typography>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={status}
            label="Status"
            onChange={(e) => setStatus(e.target.value)}
          >
            {getStatusOptions().map((option) => (
              <MenuItem key={option.value} value={option.value}>
                <Box display="flex" alignItems="center" gap={1}>
                  {option.icon}
                  <span>{option.label}</span>
                  <Chip
                    label={option.label}
                    size="small"
                    color={option.color}
                    variant="outlined"
                    sx={{ ml: 'auto' }}
                  />
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          fullWidth
          multiline
          rows={4}
          label="Verification Notes"
          placeholder="Add notes about verification status..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          helperText={
            status === 'Rejected' 
              ? 'Required: Please provide reason for rejection'
              : 'Optional: Add notes about this verification'
          }
          required={status === 'Rejected'}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          Update Status
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StatusUpdateModal;