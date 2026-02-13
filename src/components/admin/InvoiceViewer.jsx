// src/components/admin/InvoiceViewer.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Grid,
    Typography,
    CircularProgress,
    Alert,
    IconButton,
    Chip,
    Divider,
} from '@mui/material';
import {
    Download as DownloadIcon,
    Visibility as ViewIcon,
    Close as CloseIcon,
    PictureAsPdf as PdfIcon,
    Description as DocIcon,
    Image as ImageIcon,
    Description,
} from '@mui/icons-material';
import { adminAPI } from '../../services/api';

const InvoiceViewer = ({ open, userId, userName, onClose }) => {
    const [loading, setLoading] = useState(false);
    const [invoiceInfo, setInvoiceInfo] = useState(null);
    const [error, setError] = useState(null);

    // Wrap fetchInvoiceInfo in useCallback to prevent unnecessary re-renders
    const fetchInvoiceInfo = useCallback(async () => {
        // Don't fetch if no userId
        if (!userId) return;

        try {
            setLoading(true);
            setError(null);
            const response = await adminAPI.getInvoiceInfo(userId);
            setInvoiceInfo(response.data.data);
        } catch (err) {
            console.error('Error fetching invoice info:', err);
            setError('Invoice not found or not uploaded yet');
            setInvoiceInfo(null);
        } finally {
            setLoading(false);
        }
    }, [userId]); // userId is the only dependency

    // Fetch invoice info when dialog opens or userId changes
    useEffect(() => {
        if (open && userId) {
            fetchInvoiceInfo();
        }
    }, [open, userId, fetchInvoiceInfo]); // Added all dependencies

    const handleDownload = useCallback(async () => {
        if (!userId || !invoiceInfo) return;

        try {
            setLoading(true);
            const response = await adminAPI.downloadInvoice(userId);

            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', invoiceInfo.file_name || 'invoice.pdf');
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Download error:', err);
            setError('Failed to download invoice');
        } finally {
            setLoading(false);
        }
    }, [userId, invoiceInfo]);

    const handleView = useCallback(async () => {
        if (!userId || !invoiceInfo) return;

        try {
            setLoading(true);
            const response = await adminAPI.viewInvoice(userId);

            // Open in new tab for viewing
            const blob = new Blob([response.data], { type: invoiceInfo.mime_type });
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');

            // Clean up the URL after opening
            setTimeout(() => {
                window.URL.revokeObjectURL(url);
            }, 100);
        } catch (err) {
            console.error('View error:', err);
            setError('Failed to view invoice');
        } finally {
            setLoading(false);
        }
    }, [userId, invoiceInfo]);

    const getFileIcon = useCallback((fileName) => {
        if (!fileName) return <Description />;

        if (fileName.toLowerCase().endsWith('.pdf')) {
            return <PdfIcon color="error" />;
        } else if (fileName.toLowerCase().match(/\.(jpg|jpeg|png|gif)$/)) {
            return <ImageIcon color="primary" />;
        } else if (fileName.toLowerCase().match(/\.(doc|docx)$/)) {
            return <DocIcon color="info" />;
        }
        return <Description />;
    }, []);

    const formatFileSize = useCallback((bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }, []);

    // Reset state when dialog closes
    const handleClose = useCallback(() => {
        setInvoiceInfo(null);
        setError(null);
        setLoading(false);
        onClose();
    }, [onClose]);

    const handleImageError = useCallback((e) => {
        e.target.onerror = null;
        e.target.style.display = 'none';
        // Optionally show a fallback icon
        const parent = e.target.parentNode;
        if (parent) {
            const fallbackIcon = document.createElement('div');
            fallbackIcon.innerHTML = '📄';
            fallbackIcon.style.fontSize = '48px';
            fallbackIcon.style.textAlign = 'center';
            parent.appendChild(fallbackIcon);
        }
    }, []);

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
            <DialogTitle>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6">
                        Invoice for {userName}
                    </Typography>
                    <IconButton onClick={handleClose} size="small">
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>

            <DialogContent>
                {loading && !invoiceInfo ? (
                    <Box display="flex" justifyContent="center" p={3}>
                        <CircularProgress />
                    </Box>
                ) : error ? (
                    <Alert severity="warning" sx={{ my: 2 }}>
                        {error}
                    </Alert>
                ) : invoiceInfo ? (
                    <Box>
                        {/* Invoice Info Card */}
                        <Box
                            sx={{
                                p: 3,
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 1,
                                mb: 3,
                                bgcolor: 'background.paper',
                            }}
                        >
                            <Box display="flex" alignItems="center" mb={2}>
                                {getFileIcon(invoiceInfo.file_name)}
                                <Typography variant="h6" sx={{ ml: 2 }}>
                                    {invoiceInfo.file_name}
                                </Typography>
                            </Box>

                            <Divider sx={{ my: 2 }} />

                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="textSecondary">
                                        File Size
                                    </Typography>
                                    <Typography variant="body1">
                                        {formatFileSize(invoiceInfo.file_size)}
                                    </Typography>
                                </Grid>

                                <Grid item xs={6}>
                                    <Typography variant="body2" color="textSecondary">
                                        Uploaded Date
                                    </Typography>
                                    <Typography variant="body1">
                                        {invoiceInfo.uploaded_date
                                            ? new Date(invoiceInfo.uploaded_date).toLocaleDateString()
                                            : 'N/A'}
                                    </Typography>
                                </Grid>

                                <Grid item xs={6}>
                                    <Typography variant="body2" color="textSecondary">
                                        File Type
                                    </Typography>
                                    <Typography variant="body1">
                                        {invoiceInfo.mime_type || 'Unknown'}
                                    </Typography>
                                </Grid>

                                <Grid item xs={6}>
                                    <Typography variant="body2" color="textSecondary">
                                        Status
                                    </Typography>
                                    <Chip
                                        label="Available"
                                        color="success"
                                        size="small"
                                    />
                                </Grid>
                            </Grid>
                        </Box>

                        {/* Preview Section */}
                        {invoiceInfo.mime_type?.includes('image') && invoiceInfo.file_path ? (
                            <Box mb={3}>
                                <Typography variant="subtitle1" gutterBottom>
                                    Preview
                                </Typography>
                                <Box
                                    sx={{
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        borderRadius: 1,
                                        p: 2,
                                        display: 'flex',
                                        justifyContent: 'center',
                                        minHeight: '100px',
                                    }}
                                >
                                    <img
                                        src={`/api${invoiceInfo.file_path}`}
                                        alt="Invoice preview"
                                        style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain' }}
                                        onError={handleImageError}
                                        loading="lazy"
                                    />
                                </Box>
                            </Box>
                        ) : invoiceInfo.mime_type?.includes('pdf') && (
                            <Box mb={3}>
                                <Typography variant="subtitle1" gutterBottom>
                                    PDF Document
                                </Typography>
                                <Box
                                    sx={{
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        borderRadius: 1,
                                        p: 2,
                                        height: '300px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexDirection: 'column',
                                        bgcolor: 'grey.50',
                                    }}
                                >
                                    <PdfIcon sx={{ fontSize: 48, color: 'error.main', mb: 2 }} />
                                    <Typography color="textSecondary" align="center">
                                        PDF document preview not available inline.<br />
                                        Click "View" to open in new tab.
                                    </Typography>
                                </Box>
                            </Box>
                        )}
                    </Box>
                ) : (
                    <Alert severity="info" sx={{ my: 2 }}>
                        No invoice uploaded for this user
                    </Alert>
                )}
            </DialogContent>

            <DialogActions sx={{ p: 2 }}>
                <Button onClick={handleClose} color="inherit">
                    Close
                </Button>
                {invoiceInfo && (
                    <>
                        <Button
                            onClick={handleView}
                            startIcon={<ViewIcon />}
                            variant="outlined"
                            disabled={loading}
                        >
                            View
                        </Button>
                        <Button
                            onClick={handleDownload}
                            startIcon={<DownloadIcon />}
                            variant="contained"
                            disabled={loading}
                        >
                            {loading ? 'Processing...' : 'Download'}
                        </Button>
                    </>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default InvoiceViewer;