// In QuickDocumentActions.jsx - add isInvoice prop
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
    // Receipt as InvoiceIcon,
    // Description as DocumentIcon,
} from '@mui/icons-material';
import { adminAPI } from '../../services/api';
import DocumentViewer from './DocumentViewer';

const QuickDocumentActions = ({ documentId, fileName, documentType, documentStatus, isInvoice }) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const [loading, setLoading] = useState(false);
    const [viewerOpen, setViewerOpen] = useState(false);
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

            const response = await adminAPI.downloadDocument(documentId);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName || 'document.pdf');
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            setSnackbar({
                open: true,
                message: `${isInvoice ? 'Invoice' : 'Document'} downloaded successfully`,
                severity: 'success'
            });
        } catch (error) {
            console.error('Download error:', error);
            setSnackbar({
                open: true,
                message: `Failed to download ${isInvoice ? 'invoice' : 'document'}`,
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleView = () => {
        handleMenuClose();
        setViewerOpen(true);
    };

    return (
        <>
            <IconButton
                size="small"
                onClick={handleMenuOpen}
                disabled={loading}
                color={isInvoice ? 'primary' : 'default'}
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
                    <ListItemText>
                        View {isInvoice ? 'Invoice' : 'Document'}
                    </ListItemText>
                </MenuItem>

                <MenuItem onClick={handleDownload}>
                    <ListItemIcon>
                        <DownloadIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>
                        Download {isInvoice ? 'Invoice' : 'Document'}
                    </ListItemText>
                </MenuItem>
            </Menu>

            <DocumentViewer
                open={viewerOpen}
                documentId={documentId}
                fileName={fileName}
                documentType={isInvoice ? 'Invoice' : documentType}
                documentStatus={documentStatus}
                onClose={() => setViewerOpen(false)}
            />

            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
            >
                <Alert
                    severity={snackbar.severity}
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </>
    );
};

export default QuickDocumentActions;