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

const DocumentViewer = ({ open, documentId, fileName, documentType, documentStatus, onClose }) => {
    const [loading, setLoading] = useState(false);
    const [documentInfo, setDocumentInfo] = useState(null);
    const [error, setError] = useState(null);
    const [blobUrl, setBlobUrl] = useState(null);

    const fetchDocumentBlob = useCallback(async () => {
        try {
            const response = await adminAPI.viewDocument(documentId);
            const blob = new Blob([response.data], {
                type: response.headers['content-type']
            });
            const url = URL.createObjectURL(blob);
            setBlobUrl(url);

            setDocumentInfo(prev => ({
                ...prev,
                mime_type: response.headers['content-type'],
                file_size: response.headers['content-length']
            }));

            return url;
        } catch (err) {
            console.error('Error fetching document blob:', err);
            setError('Failed to load document');
            return null;
        }
    }, [documentId]);

    const fetchDocumentInfo = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            setDocumentInfo({
                file_name: fileName,
                document_type: documentType,
                document_status: documentStatus,
            });

            await fetchDocumentBlob();
        } catch (err) {
            console.error('Error fetching document info:', err);
            setError('Failed to load document information');
        } finally {
            setLoading(false);
        }
    }, [fileName, documentType, documentStatus, fetchDocumentBlob]);

    // Fetch document info when opened
    useEffect(() => {
        if (open && documentId) {
            fetchDocumentInfo();
        }

        // Cleanup blob URL on unmount
        return () => {
            if (blobUrl) {
                URL.revokeObjectURL(blobUrl);
            }
        };
    }, [open, documentId, fetchDocumentInfo, blobUrl]);

    const handleDownload = async () => {
        try {
            setLoading(true);
            const response = await adminAPI.downloadDocument(documentId);

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName || 'document.pdf');
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Download error:', err);
            setError('Failed to download document');
        } finally {
            setLoading(false);
        }
    };

    const handleView = async () => {
        try {
            setLoading(true);

            if (blobUrl) {
                window.open(blobUrl, '_blank');
            } else {
                const url = await fetchDocumentBlob();
                if (url) {
                    window.open(url, '_blank');
                }
            }
        } catch (err) {
            console.error('View error:', err);
            setError('Failed to view document');
        } finally {
            setLoading(false);
        }
    };

    const getFileIcon = (fileName) => {
        if (!fileName) return <Description />;

        if (fileName.toLowerCase().endsWith('.pdf')) {
            return <PdfIcon sx={{ fontSize: 48, color: 'error.main' }} />;
        } else if (fileName.toLowerCase().match(/\.(jpg|jpeg|png|gif|bmp|webp)$/)) {
            return <ImageIcon sx={{ fontSize: 48, color: 'info.main' }} />;
        } else if (fileName.toLowerCase().match(/\.(doc|docx)$/)) {
            return <DocIcon sx={{ fontSize: 48, color: 'primary.main' }} />;
        } else if (fileName.toLowerCase().match(/\.(xls|xlsx|csv)$/)) {
            return <Description sx={{ fontSize: 48, color: 'success.main' }} />;
        }
        return <Description sx={{ fontSize: 48 }} />;
    };

    const formatFileSize = (bytes) => {
        if (!bytes) return 'Unknown';
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatDocumentType = (type) => {
        if (!type) return 'Document';
        return type
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Verified': return 'success';
            case 'Rejected': return 'error';
            case 'Pending': return 'warning';
            default: return 'default';
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box display="flex" alignItems="center" gap={1}>
                        {getFileIcon(fileName)}
                        <Typography variant="h6">
                            {formatDocumentType(documentType)}
                        </Typography>
                    </Box>
                    <IconButton onClick={onClose} size="small">
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>

            <DialogContent>
                {loading && !documentInfo ? (
                    <Box display="flex" justifyContent="center" p={3}>
                        <CircularProgress />
                    </Box>
                ) : error ? (
                    <Alert severity="error" sx={{ my: 2 }}>
                        {error}
                    </Alert>
                ) : documentInfo ? (
                    <Box>
                        {/* Document Info Card */}
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
                                {getFileIcon(documentInfo.file_name)}
                                <Box ml={2}>
                                    <Typography variant="h6">
                                        {documentInfo.file_name}
                                    </Typography>
                                    <Chip
                                        size="small"
                                        label={documentInfo.document_status || 'Unknown'}
                                        color={getStatusColor(documentInfo.document_status)}
                                        sx={{ mt: 1 }}
                                    />
                                </Box>
                            </Box>

                            <Divider sx={{ my: 2 }} />

                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="textSecondary">
                                        Document Type
                                    </Typography>
                                    <Typography variant="body1">
                                        {formatDocumentType(documentInfo.document_type)}
                                    </Typography>
                                </Grid>

                                <Grid item xs={6}>
                                    <Typography variant="body2" color="textSecondary">
                                        File Size
                                    </Typography>
                                    <Typography variant="body1">
                                        {formatFileSize(documentInfo.file_size)}
                                    </Typography>
                                </Grid>

                                <Grid item xs={6}>
                                    <Typography variant="body2" color="textSecondary">
                                        File Type
                                    </Typography>
                                    <Typography variant="body1">
                                        {documentInfo.mime_type || 'Unknown'}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </Box>

                        {/* Preview Section */}
                        {documentInfo.mime_type?.includes('image') && blobUrl ? (
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
                                        bgcolor: '#f5f5f5',
                                    }}
                                >
                                    <img
                                        src={blobUrl}
                                        alt="Document preview"
                                        style={{
                                            maxWidth: '100%',
                                            maxHeight: '400px',
                                            objectFit: 'contain'
                                        }}
                                    />
                                </Box>
                            </Box>
                        ) : documentInfo.mime_type?.includes('pdf') && (
                            <Box mb={3}>
                                <Typography variant="subtitle1" gutterBottom>
                                    PDF Document
                                </Typography>
                                <Box
                                    sx={{
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        borderRadius: 1,
                                        p: 3,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexDirection: 'column',
                                        bgcolor: '#f5f5f5',
                                    }}
                                >
                                    <PdfIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
                                    <Typography color="textSecondary" align="center">
                                        This PDF cannot be previewed inline.
                                        <br />
                                        Click "View" to open in a new tab.
                                    </Typography>
                                </Box>
                            </Box>
                        )}
                    </Box>
                ) : (
                    <Alert severity="info" sx={{ my: 2 }}>
                        No document information available
                    </Alert>
                )}
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose} color="inherit">
                    Close
                </Button>
                {documentInfo && (
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

export default DocumentViewer;