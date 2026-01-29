// src/components/admin/QuickInvoiceActions.jsx
import React, { useState } from 'react';
import {
    IconButton,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    CircularProgress,
    Snackbar,
    Alert,
} from '@mui/material';
import {
    MoreVert as MoreVertIcon,
    Download as DownloadIcon,
    Visibility as ViewIcon,
    Description as InvoiceIcon,
} from '@mui/icons-material';
import { adminAPI } from '../../services/api';

const QuickInvoiceActions = ({ userId, fileName }) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const [loading, setLoading] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

    const handleMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleDownload = async () => {
        try {
            setLoading(true);
            handleMenuClose();

            const response = await adminAPI.downloadInvoice(userId);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName || 'invoice.pdf');
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            setSnackbar({
                open: true,
                message: 'Invoice downloaded successfully',
                severity: 'success'
            });
        } catch (error) {
            console.error('Download error:', error);
            setSnackbar({
                open: true,
                message: 'Failed to download invoice',
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleView = async () => {
        try {
            setLoading(true);
            handleMenuClose();

            const response = await adminAPI.viewInvoice(userId);
            const blob = new Blob([response.data], {
                type: response.headers['content-type']
            });
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');

            setSnackbar({
                open: true,
                message: 'Invoice opened in new tab',
                severity: 'info'
            });
        } catch (error) {
            console.error('View error:', error);
            setSnackbar({
                open: true,
                message: 'Failed to view invoice',
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <IconButton
                size="small"
                onClick={handleMenuOpen}
                disabled={loading}
            >
                {loading ? <CircularProgress size={20} /> : <MoreVertIcon />}
            </IconButton>

            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
            >
                <MenuItem onClick={handleView}>
                    <ListItemIcon>
                        <ViewIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>View Invoice</ListItemText>
                </MenuItem>

                <MenuItem onClick={handleDownload}>
                    <ListItemIcon>
                        <DownloadIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Download Invoice</ListItemText>
                </MenuItem>
            </Menu>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
            >
                <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </>
    );
};

export default QuickInvoiceActions;