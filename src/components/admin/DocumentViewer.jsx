// components/admin/DocumentViewer.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Full-screen-ish MUI Dialog that fetches a document from the backend
// (which proxies it from Supabase Storage) and renders it inline.
//
// PDFs  → rendered in an <iframe>
// Images → rendered in an <img>
// Other  → shows a download prompt
// ─────────────────────────────────────────────────────────────────────────────
import React, {useState, useEffect, useCallback} from 'react';
import {
    Dialog, DialogTitle, DialogContent,
    Box, Typography, IconButton, Button, CircularProgress,
    Chip, Alert,
} from '@mui/material';
import {
    Close as CloseIcon,
    Download as DownloadIcon,
    PictureAsPdf as PdfIcon,
    Image as ImageIcon,
    Description as DocIcon,
    CheckCircle as VerifiedIcon,
    Pending as PendingIcon,
    Block as RejectedIcon,
} from '@mui/icons-material';
import {adminAPI} from '../../services/api';

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
    bg: '#F8F9FC', surface: '#FFFFFF', border: '#E8ECF4',
    text: '#0F1F3D', muted: '#6B7A99',
    navy: '#0F1F3D',
    accent: '#1E4FD8', accentSoft: '#EBF0FF',
    green: '#059669', greenSoft: '#D1FAE5',
    amber: '#D97706', amberSoft: '#FEF3C7',
    rose: '#DC2626', roseSoft: '#FEE2E2',
};

const STATUS_META = {
    Verified: {color: T.green, soft: T.greenSoft, Icon: VerifiedIcon, label: 'Verified'},
    Pending: {color: T.amber, soft: T.amberSoft, Icon: PendingIcon, label: 'Pending'},
    Rejected: {color: T.rose, soft: T.roseSoft, Icon: RejectedIcon, label: 'Rejected'},
};

const DOC_LABELS = {
    ID: 'Identity Document',
    Payslip: 'Payslip',
    Proof_of_Residence: 'Proof of Residence',
    Invoice: 'Invoice',
};

// ── Helper ────────────────────────────────────────────────────────────────────
function getFileType(fileName) {
    if (!fileName) return 'other';
    const ext = fileName.split('.').pop().toLowerCase();
    if (ext === 'pdf') return 'pdf';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image';
    return 'other';
}

// ── Main component ────────────────────────────────────────────────────────────
const DocumentViewer = ({
                            open,
                            onClose,
                            documentId,
                            fileName,
                            documentType,
                            documentStatus,
                        }) => {
    const [blobUrl, setBlobUrl] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [downloading, setDownloading] = useState(false);

    const fileType = getFileType(fileName);
    const statusMeta = STATUS_META[documentStatus] || {color: T.muted, soft: '#F1F5F9', label: documentStatus};

    // Fetch the document blob when the dialog opens
    const fetchDocument = useCallback(async () => {
        if (!open || documentId == null) return;
        setLoading(true);
        setError(null);
        setBlobUrl(null);
        try {
            const response = await adminAPI.viewDocument(documentId);
            console.log('📄 Document response:', response.data);

            if (!response.data.success || !response.data.url) {
                throw new Error('Failed to get document URL');
            }

            const signedUrl = response.data.url;
            console.log('🔗 Signed URL:', signedUrl);

            // ✅ For PDFs and images, use the signed URL directly
            // Don't fetch it - let the browser handle it
            setBlobUrl(signedUrl);

        } catch (err) {
            console.error('❌ fetchDocument error:', err);
            setError(err?.message || 'Failed to load document');
        } finally {
            setLoading(false);
        }
    }, [open, documentId]);


    useEffect(() => {
        if (open && documentId != null) {
            fetchDocument();
        }
        return () => {
            // Revoke blob URL on close/unmount to free memory
            setBlobUrl(prev => {
                if (prev) {
                    try {
                        URL.revokeObjectURL(prev);
                    } catch {
                    }
                }
                return null;
            });
        };
    }, [open, documentId, fetchDocument]);

    const handleDownload = async () => {
        try {
            setDownloading(true);

            // ✅ Get signed URL from backend (JSON response)
            const response = await adminAPI.downloadDocument(documentId);

            console.log('📥 Download response:', response.data);

            if (!response.data.success || !response.data.url) {
                throw new Error('Failed to get download URL');
            }

            // ✅ Use the signed URL directly
            const link = document.createElement('a');
            link.href = response.data.url;
            link.setAttribute('download', response.data.fileName || `document_${documentId}`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            console.log('✅ Download initiated');
        } catch (err) {
            console.error('❌ Download failed:', err);
            setError('Failed to download document');
        } finally {
            setDownloading(false);
        }
    };


    const handleClose = () => {
        if (blobUrl) URL.revokeObjectURL(blobUrl);
        setBlobUrl(null);
        setError(null);
        onClose();
    };

    const docLabel = DOC_LABELS[documentType] || documentType || 'Document';

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: '16px',
                    border: `1px solid ${T.border}`,
                    boxShadow: '0 24px 60px rgba(15,31,61,0.16)',
                    bgcolor: T.bg,
                    height: '90vh',
                    display: 'flex',
                    flexDirection: 'column',
                },
            }}
        >
            {/* Header */}
            <DialogTitle sx={{p: 0}}>
                <Box sx={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    px: 3, py: 2, bgcolor: T.surface, borderBottom: `1px solid ${T.border}`,
                }}>
                    <Box sx={{display: 'flex', alignItems: 'center', gap: 1.5}}>
                        {/* Doc type icon */}
                        <Box sx={{
                            width: 36, height: 36, borderRadius: '10px',
                            bgcolor: fileType === 'pdf' ? T.roseSoft : fileType === 'image' ? T.accentSoft : T.bg,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: `1px solid ${T.border}`,
                        }}>
                            {fileType === 'pdf' && <PdfIcon sx={{fontSize: 18, color: T.rose}}/>}
                            {fileType === 'image' && <ImageIcon sx={{fontSize: 18, color: T.accent}}/>}
                            {fileType === 'other' && <DocIcon sx={{fontSize: 18, color: T.muted}}/>}
                        </Box>

                        <Box>
                            <Typography sx={{fontWeight: 700, fontSize: '0.95rem', color: T.text}}>
                                {docLabel}
                            </Typography>
                            <Typography sx={{fontSize: '0.72rem', color: T.muted}}>
                                {fileName}
                            </Typography>
                        </Box>

                        {/* Status chip */}
                        <Chip
                            label={statusMeta.label}
                            size="small"
                            sx={{
                                height: 22, fontSize: '0.68rem', fontWeight: 700,
                                bgcolor: statusMeta.soft, color: statusMeta.color,
                                border: `1px solid ${statusMeta.color}28`,
                            }}
                        />
                    </Box>

                    {/* Actions */}
                    <Box sx={{display: 'flex', gap: 0.8}}>
                        <Button
                            size="small"
                            startIcon={downloading ? <CircularProgress size={12}/> : <DownloadIcon/>}
                            onClick={handleDownload}
                            disabled={downloading || loading || !!error}
                            sx={{
                                borderRadius: '8px', textTransform: 'none',
                                fontWeight: 600, fontSize: '0.78rem',
                                fontFamily: 'Plus Jakarta Sans, sans-serif',
                                bgcolor: T.greenSoft, color: T.green,
                                border: `1px solid ${T.green}28`,
                                '&:hover': {bgcolor: T.green, color: '#fff'},
                                '&.Mui-disabled': {opacity: 0.5},
                            }}
                        >
                            Download
                        </Button>
                        <IconButton
                            size="small"
                            onClick={handleClose}
                            sx={{
                                borderRadius: '8px', color: T.muted,
                                '&:hover': {bgcolor: T.bg, color: T.rose},
                            }}
                        >
                            <CloseIcon sx={{fontSize: 18}}/>
                        </IconButton>
                    </Box>
                </Box>
            </DialogTitle>

            {/* Content */}
            <DialogContent sx={{p: 0, flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column'}}>
                {loading && (
                    <Box sx={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'column',
                        gap: 2
                    }}>
                        <CircularProgress sx={{color: T.accent}}/>
                        <Typography sx={{fontSize: '0.82rem', color: T.muted}}>
                            Loading document…
                        </Typography>
                    </Box>
                )}

                {error && !loading && (
                    <Box sx={{p: 3}}>
                        <Alert
                            severity="error"
                            sx={{borderRadius: '10px', fontSize: '0.83rem'}}
                            action={
                                <Button size="small" onClick={fetchDocument}
                                        sx={{textTransform: 'none', fontWeight: 600}}>
                                    Retry
                                </Button>
                            }
                        >
                            {error}
                        </Alert>
                    </Box>
                )}

                {!loading && !error && blobUrl && (
                    <>
                        {/* PDF — Chrome blocks inline PDF blob rendering; open in new tab instead */}
                        {fileType === 'pdf' && (
                            <Box sx={{
                                flex: 1, display: 'flex', alignItems: 'center',
                                justifyContent: 'center', flexDirection: 'column',
                                gap: 2.5, p: 4, bgcolor: '#0F1F3D',
                            }}>
                                <Box sx={{
                                    width: 64, height: 64, borderRadius: '16px',
                                    bgcolor: 'rgba(220,38,38,0.15)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <PdfIcon sx={{fontSize: 34, color: '#ef4444'}}/>
                                </Box>
                                <Box sx={{textAlign: 'center'}}>
                                    <Typography sx={{
                                        fontWeight: 700,
                                        fontSize: '1rem',
                                        color: '#fff',
                                        mb: 0.5,
                                        fontFamily: 'Plus Jakarta Sans, sans-serif'
                                    }}>
                                        {fileName}
                                    </Typography>
                                    <Typography sx={{
                                        fontSize: '0.8rem',
                                        color: 'rgba(255,255,255,0.5)',
                                        fontFamily: 'Plus Jakarta Sans, sans-serif'
                                    }}>
                                        PDF document ready — open in a new tab to view
                                    </Typography>
                                </Box>
                                <Box sx={{display: 'flex', gap: 1.5}}>
                                    <button
                                        onClick={() => window.open(blobUrl, '_blank')}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 6,
                                            padding: '10px 22px', borderRadius: 10,
                                            background: '#1E4FD8', color: '#fff',
                                            border: 'none', cursor: 'pointer',
                                            fontWeight: 700, fontSize: '0.85rem',
                                            fontFamily: 'Plus Jakarta Sans, sans-serif',
                                            boxShadow: '0 4px 14px rgba(30,79,216,0.4)',
                                        }}
                                    >
                                        Open in new tab
                                    </button>
                                </Box>
                            </Box>
                        )}

                        {/* Image */}
                        {fileType === 'image' && (
                            <Box sx={{
                                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                p: 2, bgcolor: '#1a1a2e', overflow: 'auto',
                            }}>
                                <img
                                    src={blobUrl}
                                    alt={fileName}
                                    style={{
                                        maxWidth: '100%', maxHeight: '100%',
                                        objectFit: 'contain', borderRadius: 8,
                                        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                                    }}
                                />
                            </Box>
                        )}

                        {/* Other file types */}
                        {fileType === 'other' && (
                            <Box sx={{
                                flex: 1, display: 'flex', alignItems: 'center',
                                justifyContent: 'center', flexDirection: 'column', gap: 2, p: 4,
                            }}>
                                <Box sx={{
                                    width: 64, height: 64, borderRadius: '16px',
                                    bgcolor: T.accentSoft, display: 'flex',
                                    alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <DocIcon sx={{fontSize: 30, color: T.accent}}/>
                                </Box>
                                <Typography sx={{fontWeight: 700, fontSize: '0.95rem', color: T.text}}>
                                    Preview not available
                                </Typography>
                                <Typography sx={{fontSize: '0.82rem', color: T.muted, textAlign: 'center'}}>
                                    This file type cannot be previewed in the browser.
                                    Click Download to open it locally.
                                </Typography>
                                <Button
                                    variant="contained"
                                    startIcon={<DownloadIcon/>}
                                    onClick={handleDownload}
                                    sx={{
                                        borderRadius: '10px', textTransform: 'none',
                                        fontWeight: 700, fontFamily: 'Plus Jakarta Sans, sans-serif',
                                        bgcolor: T.accent, boxShadow: 'none',
                                        '&:hover': {bgcolor: '#1641B8'},
                                    }}
                                >
                                    Download {fileName}
                                </Button>
                            </Box>
                        )}
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default DocumentViewer;