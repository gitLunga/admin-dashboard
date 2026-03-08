// javascript
import React, {useState, useEffect, useCallback, useRef} from 'react';
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
import {adminAPI} from '../../services/api';

const DocumentViewer = ({open, documentId, fileName, documentType, documentStatus, onClose}) => {
    const [loading, setLoading] = useState(false);
    const [documentInfo, setDocumentInfo] = useState(null);
    const [error, setError] = useState(null);
    const [blobUrl, setBlobUrl] = useState(null);
    const [fetchAttempted, setFetchAttempted] = useState(false);
    const urlRef = useRef(null);

    const fetchDocument = useCallback(async () => {
        if (!documentId || !open) return null;

        try {
            setLoading(true);
            setError(null);
            setFetchAttempted(false);

            console.log('📄 Fetching document:', documentId);

            const response = await adminAPI.viewDocument(documentId, {
                responseType: 'blob'
            });

            const blob = new Blob([response.data], {
                type: response.headers['content-type'] || 'application/octet-stream'
            });
            const url = URL.createObjectURL(blob);

            // Revoke previous blob URL if present and store the new one in a ref
            if (urlRef.current) {
                try { URL.revokeObjectURL(urlRef.current); } catch (e) { /* ignore */ }
            }
            urlRef.current = url;
            setBlobUrl(url);

            setDocumentInfo({
                file_name: fileName || 'document.pdf',
                document_type: documentType,
                document_status: documentStatus,
                mime_type: response.headers['content-type'] || 'application/octet-stream',
                file_size: response.headers['content-length'] || blob.size
            });

            console.log('✅ Document loaded successfully');
            return url;
        } catch (err) {
            console.error('❌ Error fetching document:', err);
            setError(err.message || 'Failed to load document');
            return null;
        } finally {
            setLoading(false);
            setFetchAttempted(true);
        }
    }, [documentId, open, fileName, documentType, documentStatus]);

    useEffect(() => {
        if (open && documentId) {
            fetchDocument();
        }

        return () => {
            if (urlRef.current) {
                try { URL.revokeObjectURL(urlRef.current); } catch (e) { /* ignore */ }
                urlRef.current = null;
            }
            setBlobUrl(null);
            setDocumentInfo(null);
            setError(null);
            setFetchAttempted(false);
        };
    }, [open, documentId, fetchDocument]);

    const handleDownload = async () => {
        try {
            setLoading(true);

            if (blobUrl) {
                const link = document.createElement('a');
                link.href = blobUrl;
                link.setAttribute('download', fileName || 'document.pdf');
                document.body.appendChild(link);
                link.click();
                link.remove();
            } else {
                const response = await adminAPI.downloadDocument(documentId, {
                    responseType: 'blob'
                });

                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', fileName || 'document.pdf');
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);
            }
        } catch (err) {
            console.error('Download error:', err);
            setError('Failed to download document');
        } finally {
            setLoading(false);
        }
    };

    const handleView = () => {
        if (blobUrl) {
            window.open(blobUrl, '_blank');
        } else {
            setError('Document not ready for viewing');
        }
    };

    const getFileIcon = (fileName) => {
        if (!fileName) return <Description/>;
        const ext = fileName.split('.').pop()?.toLowerCase();

        switch (ext) {
            case 'pdf':
                return <PdfIcon sx={{fontSize: 48, color: 'error.main'}}/>;
            case 'jpg':
            case 'jpeg':
            case 'png':
            case 'gif':
            case 'bmp':
            case 'webp':
                return <ImageIcon sx={{fontSize: 48, color: 'info.main'}}/>;
            case 'doc':
            case 'docx':
                return <DocIcon sx={{fontSize: 48, color: 'primary.main'}}/>;
            case 'xls':
            case 'xlsx':
            case 'csv':
                return <Description sx={{fontSize: 48, color: 'success.main'}}/>;
            default:
                return <Description sx={{fontSize: 48}}/>;
        }
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
            case 'Verified':
                return 'success';
            case 'Rejected':
                return 'error';
            case 'Pending':
                return 'warning';
            default:
                return 'default';
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
                        <CloseIcon/>
                    </IconButton>
                </Box>
            </DialogTitle>

            <DialogContent>
                {loading ? (
                    <Box display="flex" justifyContent="center" alignItems="center" p={4}>
                        <CircularProgress/>
                    </Box>
                ) : error ? (
                    <Alert severity="error" sx={{my: 2}} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                ) : documentInfo ? (
                    <Box>
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
                                    <Typography variant="h6" noWrap sx={{maxWidth: 400}}>
                                        {documentInfo.file_name}
                                    </Typography>
                                    <Chip
                                        size="small"
                                        label={documentInfo.document_status || 'Unknown'}
                                        color={getStatusColor(documentInfo.document_status)}
                                        sx={{mt: 1}}
                                    />
                                </Box>
                            </Box>

                            <Divider sx={{my: 2}}/>

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
                                        {documentInfo.mime_type?.split('/')[1]?.toUpperCase() || 'Unknown'}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </Box>

                        {blobUrl && documentInfo.mime_type?.includes('image') ? (
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
                                        maxHeight: 400,
                                        overflow: 'auto'
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
                        ) : blobUrl && documentInfo.mime_type?.includes('pdf') ? (
                            <Box mb={3}>
                                <Typography variant="subtitle1" gutterBottom>
                                    PDF Preview
                                </Typography>
                                <Box
                                    sx={{
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        borderRadius: 1,
                                        height: 400,
                                        overflow: 'hidden'
                                    }}
                                >
                                    <iframe
                                        src={`${blobUrl}#toolbar=0&navpanes=0`}
                                        title="PDF Preview"
                                        width="100%"
                                        height="100%"
                                        style={{border: 'none'}}
                                    />
                                </Box>
                            </Box>
                        ) : (
                            <Box mb={3}>
                                <Alert severity="info">
                                    This file type cannot be previewed. Click "View" to open in a new tab.
                                </Alert>
                            </Box>
                        )}
                    </Box>
                ) : fetchAttempted ? (
                    <Alert severity="warning" sx={{my: 2}}>
                        No document information available
                    </Alert>
                ) : null}
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose} color="inherit">
                    Close
                </Button>
                {documentInfo && blobUrl && (
                    <>
                        <Button
                            onClick={handleView}
                            startIcon={<ViewIcon/>}
                            variant="outlined"
                            disabled={loading}
                        >
                            View
                        </Button>
                        <Button
                            onClick={handleDownload}
                            startIcon={<DownloadIcon/>}
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